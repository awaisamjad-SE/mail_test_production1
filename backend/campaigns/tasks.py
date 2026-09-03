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

from .models import EmailLog, Campaign, ActivityLog, GlobalSuppressionList
from .deliverability import clean_html_to_plain_text, DeliverabilityAnalyzer, DebugEmailLogger
from .imap_engine import IMAPSyncEngine, normalize_message_id
from smtp_settings.models import SMTPCredential
from mailflow_backend.encryption import decrypt_password

logger = logging.getLogger(__name__)

def dispatch_email(email_log_id, countdown=0):
    """Dispatches email in background thread with optional delay/countdown to guarantee delivery even if website is closed."""
    import threading, time
    def run_task():
        if countdown > 0:
            time.sleep(countdown)
        try:
            send_email_task.apply(args=[str(email_log_id)])
        except Exception as err:
            logger.warning(f"Direct task apply warning ({err}). Retrying via Celery delay.")
            try:
                send_email_task.delay(str(email_log_id))
            except Exception:
                pass

    threading.Thread(target=run_task, daemon=True).start()



@shared_task(bind=True, max_retries=3)
def send_email_task(self, email_log_id):

    try:
        log = EmailLog.objects.get(id=email_log_id)

    except EmailLog.DoesNotExist:
        return f"Log {email_log_id} not found."

    user = log.user

    # 0. Check Global Suppression List
    if GlobalSuppressionList.objects.filter(user=user, email__iexact=log.recipient).exists():
        log.status = 'FAILED'
        log.error_message = f"Recipient {log.recipient} is in the global suppression / unsubscribe list."
        log.save()
        if log.campaign:
            with transaction.atomic():
                campaign = Campaign.objects.select_for_update().get(id=log.campaign.id)
                campaign.failed_count += 1
                campaign.save()
                check_campaign_completion(campaign.id)
        return f"Recipient {log.recipient} suppressed."
    
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

    # 4. Pre-Generate & Persist Canonical Message-ID BEFORE SMTP transmission
    from_name = user.full_name or 'MailFlow'
    sender_domain = authenticated_sender.split('@')[-1] if '@' in authenticated_sender else 'mailflow.engineer'

    if not log.message_id:
        raw_msg_id = make_msgid(idstring=str(log.id), domain=sender_domain)
        log.message_id = normalize_message_id(raw_msg_id)
        log.save(update_fields=['message_id'])

    # 5. Formulate email message using Canonical EmailMessage Engine
    is_html = log.body.strip().startswith('<!DOCTYPE html>') or '<html' in log.body.lower() or '<div' in log.body.lower()

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
    msg['Message-ID'] = f"<{log.message_id}>"
    msg['X-FastNexa-EmailLog-ID'] = str(log.id)

    # Inject CC header if CC addresses are set on this log
    cc_addresses = [addr.strip() for addr in log.cc.split(',') if addr.strip()] if log.cc else []
    if cc_addresses:
        msg['Cc'] = ', '.join(cc_addresses)

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

    # Attach file (Resume / PDF / Docx) if provided
    att_name = log.attachment_name or (log.campaign.attachment_name if log.campaign else '')
    att_data = log.attachment_data or (log.campaign.attachment_data if log.campaign else '')

    if att_name and att_data:
        try:
            import mimetypes
            file_bytes = base64.b64decode(att_data)
            mime_type, _ = mimetypes.guess_type(att_name)
            if mime_type and '/' in mime_type:
                maintype, subtype = mime_type.split('/', 1)
            else:
                maintype, subtype = 'application', 'octet-stream'
            msg.add_attachment(file_bytes, maintype=maintype, subtype=subtype, filename=att_name)
        except Exception as attach_err:
            logger.warning(f"Failed to attach file {att_name} for log {email_log_id}: {attach_err}")

    # Pre-Flight RFC & Deliverability Audit

    analysis = DeliverabilityAnalyzer.validate_rfc_compliance(msg, is_campaign=bool(log.campaign))
    if not analysis['is_valid']:
        logger.warning(f"RFC Compliance warnings for log {email_log_id}: {analysis['errors']}")

    # Save debug trace .eml if MAILFLOW_EMAIL_DEBUG is active
    DebugEmailLogger.dump_eml(msg, str(log.id))

    # 6. Connect and Send with Smart Port & Host Fallbacks
    try:
        connection_attempts = []
        if smtp.provider == 'gmail':
            connection_attempts.append(('smtp.gmail.com', 587, False))
        else:
            primary_host = (smtp.smtp_host or 'smtp.hostinger.com').strip()
            primary_port = int(smtp.smtp_port or 465)
            primary_ssl = smtp.use_ssl if smtp.use_ssl is not None else (primary_port == 465)

            connection_attempts.append((primary_host, primary_port, primary_ssl))
            
            # Port 587 STARTTLS fallback for custom domains
            if primary_port != 587:
                connection_attempts.append((primary_host, 587, False))

            # Hostinger fallback cluster if primary host differs from smtp.hostinger.com
            if primary_host != 'smtp.hostinger.com':
                connection_attempts.append(('smtp.hostinger.com', 465, True))
                connection_attempts.append(('smtp.hostinger.com', 587, False))

        server = None
        last_err = None
        for host, port, use_ssl in connection_attempts:
            try:
                if use_ssl or port == 465:
                    server = smtplib.SMTP_SSL(host, port, timeout=15)
                else:
                    server = smtplib.SMTP(host, port, timeout=15)
                    server.starttls()
                server.login(authenticated_sender, password)
                break
            except Exception as err:
                logger.warning(f"SMTP Connection attempt ({host}:{port}, ssl={use_ssl}) failed: {err}")
                last_err = err

        if not server:
            raise last_err

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
        is_auth_error = isinstance(e, smtplib.SMTPAuthenticationError) or any(code in error_msg for code in ['530', '535', 'Authentication Required', '5.7.0', '5.7.8'])
        
        if is_auth_error:
            error_msg = f"Gmail SMTP Auth Error: Invalid App Password or Account Credentials ({str(e)}). Please update your App Password in Settings & SMTP."
            smtp.last_sync_status = 'AUTH_ERROR'
            smtp.last_error_message = error_msg
            smtp.is_verified = False
            smtp.save(update_fields=['last_sync_status', 'last_error_message', 'is_verified'])

        is_non_transient = is_auth_error or isinstance(e, (smtplib.SMTPRecipientsRefused, TypeError))
        
        # Immediate fail for non-transient errors or after max retries
        if is_non_transient or log.retry_count >= 3:
            log.status = 'FAILED'
            log.error_message = error_msg
            log.save()
            
            if log.campaign:
                with transaction.atomic():
                    campaign = Campaign.objects.select_for_update().get(id=log.campaign.id)
                    campaign.failed_count += 1
                    campaign.save()
                    check_campaign_completion(campaign.id)
            
            ActivityLog.objects.create(user=user, action=f"Failed sending email to {log.recipient}: {error_msg}")
            return f"Failed sending to {log.recipient}: {error_msg}"
        else:
            log.retry_count += 1
            log.error_message = f"Attempt {log.retry_count} failed: {error_msg}"
            log.save()
            try:
                self.retry(exc=e, countdown=60)
            except Exception:
                log.status = 'FAILED'
                log.save()
                return f"Failed sending to {log.recipient}: {error_msg}"

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

@shared_task
def sync_user_inbox_task(credential_id):
    """Celery task to sync a single user IMAP inbox."""
    try:
        cred = SMTPCredential.objects.get(id=credential_id, is_monitoring_enabled=True)
        engine = IMAPSyncEngine(cred)
        res = engine.sync_inbox()
        return f"Inbox sync result for {cred.gmail_address}: {res}"
    except SMTPCredential.DoesNotExist:
        return f"Credential {credential_id} not found or monitoring disabled."
    except Exception as e:
        logger.error(f"Error syncing inbox for credential {credential_id}: {e}")
        return f"Sync failed: {e}"

@shared_task
def sync_all_inboxes_periodic():
    """Periodic Celery Beat task to dispatch inbox sync tasks for all active credentials."""
    active_credentials = SMTPCredential.objects.filter(is_monitoring_enabled=True)
    count = 0
    for cred in active_credentials:
        sync_user_inbox_task.delay(str(cred.id))
        count += 1
    return f"Dispatched sync tasks for {count} credentials."

