import smtplib
import base64
import logging
from email.message import EmailMessage
from email.utils import make_msgid, formatdate
from email.headerregistry import Address
from email import policy
from django.utils import timezone
from celery import shared_task
from django.db import transaction

from .models import EmailLog, Campaign, ActivityLog
from .deliverability import clean_html_to_plain_text, DeliverabilityAnalyzer, DebugEmailLogger
from smtp_settings.models import SMTPCredential
from mailflow_backend.encryption import decrypt_password

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, rate_limit='12/h')
def send_email_task(self, email_log_id, attachment_name=None, attachment_data=None):
    try:
        log = EmailLog.objects.get(id=email_log_id)
    except EmailLog.DoesNotExist:
        return f"Log {email_log_id} not found."

    user = log.user
    
    # 1. Fetch SMTP settings
    try:
        smtp = SMTPCredential.objects.get(user=user)
    except SMTPCredential.DoesNotExist:
        log.status = 'FAILED'
        log.error_message = "SMTP settings not configured for this user."
        log.save()
        
        if log.campaign:
            with transaction.atomic():
                campaign = Campaign.objects.select_for_update().get(id=log.campaign.id)
                campaign.failed_count += 1
                campaign.save()
                check_campaign_completion(campaign.id)
        return "SMTP credentials missing."

    # 2. Check and reset daily limits
    today = timezone.now().date()
    if smtp.last_reset_date != today:
        smtp.daily_sent_count = 0
        smtp.last_reset_date = today
        smtp.save()

    # Enforce Gmail/SMTP sending limits (e.g. 500 emails/day)
    LIMIT = 500
    if smtp.daily_sent_count >= LIMIT:
        log.status = 'FAILED'
        log.error_message = f"Daily sending limit of {LIMIT} exceeded."
        log.save()
        
        if log.campaign:
            with transaction.atomic():
                campaign = Campaign.objects.select_for_update().get(id=log.campaign.id)
                campaign.failed_count += 1
                campaign.save()
                check_campaign_completion(campaign.id)
        return "Daily sending limit exceeded."

    # 3. Decrypt App Password & Alias Provider-Agnostic Sender
    authenticated_sender = smtp.gmail_address  # Generic SMTP account email address
    password = decrypt_password(smtp.encrypted_app_password)
    if not authenticated_sender or not password:
        log.status = 'FAILED'
        log.error_message = "SMTP username or Password is missing/invalid."
        log.save()
        
        if log.campaign:
            with transaction.atomic():
                campaign = Campaign.objects.select_for_update().get(id=log.campaign.id)
                campaign.failed_count += 1
                campaign.save()
                check_campaign_completion(campaign.id)
        return "Invalid SMTP config."

    # 4. Formulate email message using Canonical EmailMessage Engine
    is_html = log.body.strip().startswith('<!DOCTYPE html>') or '<html' in log.body.lower() or '<div' in log.body.lower()
    from_name = user.full_name or 'MailFlow'
    sender_domain = authenticated_sender.split('@')[-1] if '@' in authenticated_sender else 'mailflow.engineer'

    msg = EmailMessage(policy=policy.SMTP)
    msg['Subject'] = log.subject
    
    # Format From header cleanly (handles UTF-8 display names with RFC 2047 encoding)
    if '@' in authenticated_sender:
        username_part, domain_part = authenticated_sender.split('@', 1)
        msg['From'] = Address(display_name=from_name, username=username_part, domain=domain_part)
    else:
        msg['From'] = f"{from_name} <{authenticated_sender}>"

    msg['To'] = log.recipient
    msg['Date'] = formatdate(localtime=True)
    msg['Message-ID'] = make_msgid(domain=sender_domain)

    # Add List-Unsubscribe headers for campaign deliverability compliance (RFC 2369 / RFC 8058)
    if log.campaign:
        msg['List-Unsubscribe'] = f"<mailto:unsubscribe@{sender_domain}?subject=unsubscribe>"
        msg['List-Unsubscribe-Post'] = "List-Unsubscribe=One-Click"

    # Set content tree cleanly
    plain_text_content = clean_html_to_plain_text(log.body) if is_html else log.body

    if is_html:
        msg.set_content(plain_text_content)
        msg.add_alternative(log.body, subtype='html')
    else:
        msg.set_content(plain_text_content)

    if attachment_data:
        try:
            raw_bytes = base64.b64decode(attachment_data)
            msg.add_attachment(raw_bytes, maintype='application', subtype='octet-stream', filename=attachment_name or 'attachment.bin')
        except Exception as attach_err:
            log.error_message = f"Attachment error: {str(attach_err)}"
            log.save()

    # Pre-Flight RFC & Deliverability Audit
    analysis = DeliverabilityAnalyzer.validate_rfc_compliance(msg, is_campaign=bool(log.campaign))
    if not analysis['is_valid']:
        logger.warning(f"RFC Compliance warnings for log {email_log_id}: {analysis['errors']}")

    # Save debug trace .eml if MAILFLOW_EMAIL_DEBUG is active
    DebugEmailLogger.dump_eml(msg, str(log.id))

    # 5. Connect and Send
    try:
        if smtp.provider == 'gmail':
            host = 'smtp.gmail.com'
            port = 587
            use_ssl = False
        else:
            host = smtp.smtp_host or 'mail.fastnexa.com'
            port = int(smtp.smtp_port or 465)
            use_ssl = smtp.use_ssl if smtp.use_ssl is not None else (port == 465)

        if use_ssl or port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            server.starttls()

        server.login(authenticated_sender, password)
        # Dispatch via send_message with explicit envelope sender (MAIL FROM)
        server.send_message(msg, from_addr=authenticated_sender, to_addrs=[log.recipient])
        server.quit()
        
        # Mark as sent
        log.status = 'SENT'
        log.sent_at = timezone.now()
        log.save()
        
        # Increment counts
        smtp.daily_sent_count += 1
        smtp.save()
        
        if log.campaign:
            with transaction.atomic():
                campaign = Campaign.objects.select_for_update().get(id=log.campaign.id)
                campaign.successful_count += 1
                campaign.save()
                check_campaign_completion(campaign.id)
                
        # Log action
        ActivityLog.objects.create(user=user, action=f"Email sent to {log.recipient}")
        return f"Successfully sent to {log.recipient}"
        
    except Exception as e:
        error_msg = str(e)
        
        # Retry logic (up to 3 times)
        if log.retry_count < 3:
            log.retry_count += 1
            log.error_message = f"Attempt {log.retry_count} failed: {error_msg}"
            log.save()
            
            # Retry task in 60 seconds
            self.retry(exc=e, countdown=60)
        else:
            # Mark as failed
            log.status = 'FAILED'
            log.error_message = f"Failed after 3 retries: {error_msg}"
            log.save()
            
            if log.campaign:
                with transaction.atomic():
                    campaign = Campaign.objects.select_for_update().get(id=log.campaign.id)
                    campaign.failed_count += 1
                    campaign.save()
                    check_campaign_completion(campaign.id)
            
            # Log action
            ActivityLog.objects.create(user=user, action=f"Failed sending email to {log.recipient} after retries")
            return f"Failed sending to {log.recipient}"

def check_campaign_completion(campaign_id):
    # Retrieve campaign
    campaign = Campaign.objects.get(id=campaign_id)
    
    # Check if there are any pending email logs left
    pending_logs = EmailLog.objects.filter(campaign=campaign, status='PENDING').count()
    if pending_logs == 0:
        # If all sent/failed, complete the campaign
        if campaign.successful_count > 0:
            campaign.status = 'Completed'
        else:
            campaign.status = 'Failed'
        campaign.save()
        
        ActivityLog.objects.create(
            user=campaign.user, 
            action=f"Campaign Completed: {campaign.name} ({campaign.successful_count} sent, {campaign.failed_count} failed)"
        )
