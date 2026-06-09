import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from django.utils import timezone
from celery import shared_task
from django.db import transaction

from .models import EmailLog, Campaign, ActivityLog
from smtp_settings.models import SMTPCredential
from mailflow_backend.encryption import decrypt_password

@shared_task(bind=True, max_retries=3)
def send_email_task(self, email_log_id):
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

    # Enforce Gmail SMTP sending limits (e.g. 500 emails/day)
    LIMIT = 500
    if smtp.daily_sent_count >= LIMIT:
        log.status = 'FAILED'
        log.error_message = f"Daily Gmail sending limit of {LIMIT} exceeded."
        log.save()
        
        if log.campaign:
            with transaction.atomic():
                campaign = Campaign.objects.select_for_update().get(id=log.campaign.id)
                campaign.failed_count += 1
                campaign.save()
                check_campaign_completion(campaign.id)
        return "Daily sending limit exceeded."

    # 3. Decrypt App Password
    password = decrypt_password(smtp.encrypted_app_password)
    if not smtp.gmail_address or not password:
        log.status = 'FAILED'
        log.error_message = "Gmail address or App Password is missing/invalid."
        log.save()
        
        if log.campaign:
            with transaction.atomic():
                campaign = Campaign.objects.select_for_update().get(id=log.campaign.id)
                campaign.failed_count += 1
                campaign.save()
                check_campaign_completion(campaign.id)
        return "Invalid SMTP config."

    # 4. Formulate email message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = log.subject
    msg['From'] = f"MailFlow <{smtp.gmail_address}>"
    msg['To'] = log.recipient
    
    # Check if body contains HTML tags
    is_html = log.body.strip().startswith('<!DOCTYPE html>') or '<html' in log.body.lower() or '<div' in log.body.lower()
    if is_html:
        msg.attach(MIMEText(log.body, 'html', 'utf-8'))
    else:
        # Convert plain text to simple HTML with paragraphs to keep it styled
        msg.attach(MIMEText(log.body, 'plain', 'utf-8'))

    # 5. Connect and Send
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587, timeout=15)
        server.starttls()
        server.login(smtp.gmail_address, password)
        server.sendmail(smtp.gmail_address, log.recipient, msg.as_string())
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
