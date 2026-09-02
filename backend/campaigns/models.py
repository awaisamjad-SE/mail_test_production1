from django.db import models
from django.conf import settings
import uuid

class Campaign(models.Model):
    CAMPAIGN_TYPES = (
        ('QUICK_SEND', 'Quick Send'),
        ('BULK_SEND', 'Bulk Send'),
        ('PERSONALIZED', 'Personalized CSV'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='campaigns')
    name = models.CharField(max_length=255)
    campaign_type = models.CharField(max_length=20, choices=CAMPAIGN_TYPES)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    total_recipients = models.IntegerField(default=0)
    successful_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)

    # Inbound Campaign Monitoring Metrics
    replied_count = models.IntegerField(default=0)
    bounced_count = models.IntegerField(default=0)
    auto_reply_count = models.IntegerField(default=0)
    unsubscribed_count = models.IntegerField(default=0)

    status = models.CharField(max_length=20, default='Draft') # 'Draft', 'Processing', 'Completed', 'Failed'
    send_gap_minutes = models.IntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class EmailLog(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    )

    REPLY_STATUS_CHOICES = (
        ('NO_REPLY', 'No Reply'),
        ('REPLIED', 'Replied'),
        ('BOUNCED', 'Bounced'),
        ('AUTO_REPLY', 'Auto Reply/OOO'),
        ('UNSUBSCRIBED', 'Unsubscribed'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_logs')
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='email_logs', null=True, blank=True)
    recipient = models.EmailField()
    recipient_name = models.CharField(max_length=255, blank=True)
    cc = models.CharField(max_length=500, blank=True, default='')       # Comma-separated CC addresses
    subject = models.CharField(max_length=255)
    body = models.TextField(default="")
    status = models.CharField(max_length=20, default='PENDING', choices=STATUS_CHOICES)
    error_message = models.TextField(null=True, blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True, db_index=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)

    # Message Tracking & Threading
    message_id = models.CharField(max_length=255, unique=True, null=True, blank=True, db_index=True)
    reply_status = models.CharField(max_length=30, default='NO_REPLY', choices=REPLY_STATUS_CHOICES)
    last_inbound_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.recipient} - {self.status} [{self.reply_status}]"

class InboundEmail(models.Model):
    CLASSIFICATION_CHOICES = (
        ('HUMAN_REPLY', 'Human Reply'),
        ('AUTO_REPLY', 'Auto Reply / Out of Office'),
        ('BOUNCE', 'Bounce Notification'),
        ('UNKNOWN', 'Unknown / System'),
    )

    SENTIMENT_CHOICES = (
        ('INTERESTED', 'Interested'),
        ('NOT_INTERESTED', 'Not Interested'),
        ('QUESTION', 'Question / Clarification'),
        ('UNSUBSCRIBE', 'Unsubscribe Request'),
        ('NEUTRAL', 'Neutral'),
        ('UNKNOWN', 'Unknown'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='inbound_emails')
    smtp_credential = models.ForeignKey('smtp_settings.SMTPCredential', on_delete=models.CASCADE, related_name='inbound_emails')
    campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, related_name='inbound_emails', null=True, blank=True)
    email_log = models.ForeignKey(EmailLog, on_delete=models.SET_NULL, related_name='inbound_replies', null=True, blank=True)

    imap_uid = models.BigIntegerField()
    imap_uid_validity = models.BigIntegerField(null=True, blank=True)

    message_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    in_reply_to = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    references = models.JSONField(default=list, blank=True)

    sender_email = models.EmailField()
    sender_name = models.CharField(max_length=255, blank=True)
    recipient_email = models.EmailField()
    subject = models.CharField(max_length=500)
    body_text = models.TextField(blank=True)
    body_html = models.TextField(blank=True)
    raw_headers = models.JSONField(default=dict, blank=True)

    classification = models.CharField(max_length=30, choices=CLASSIFICATION_CHOICES, default='UNKNOWN')
    sentiment = models.CharField(max_length=30, choices=SENTIMENT_CHOICES, default='UNKNOWN')

    is_read = models.BooleanField(default=False)
    is_starred = models.BooleanField(default=False)

    received_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(auto_now_add=True)


    class Meta:
        ordering = ['-received_at', '-processed_at']
        constraints = [
            models.UniqueConstraint(
                fields=['smtp_credential', 'imap_uid_validity', 'imap_uid'],
                name='unique_inbound_imap_message'
            )
        ]

    def __str__(self):
        return f"Inbound from {self.sender_email} ({self.classification})"

class BounceDetail(models.Model):
    BOUNCE_TYPE_CHOICES = (
        ('HARD_BOUNCE', 'Hard Bounce (Permanent)'),
        ('SOFT_BOUNCE', 'Soft Bounce (Temporary)'),
        ('BLOCKED', 'Blocked / Reputation'),
        ('SPAM', 'Spam Filtered'),
        ('UNKNOWN', 'Unknown Failure'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inbound_email = models.OneToOneField(InboundEmail, on_delete=models.CASCADE, related_name='bounce_detail')
    email_log = models.ForeignKey(EmailLog, on_delete=models.SET_NULL, related_name='bounce_details', null=True, blank=True)
    bounce_type = models.CharField(max_length=30, choices=BOUNCE_TYPE_CHOICES, default='UNKNOWN')
    smtp_status_code = models.CharField(max_length=20, blank=True)
    diagnostic_code = models.TextField(blank=True)

    def __str__(self):
        return f"Bounce {self.bounce_type} for {self.email_log.recipient if self.email_log else 'Unknown'}"

class GlobalSuppressionList(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='suppressed_contacts')
    email = models.EmailField(db_index=True)
    reason = models.CharField(max_length=255, default='Unsubscribed')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'email')

    def __str__(self):
        return f"Suppressed: {self.email} ({self.reason})"

class EmailTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='templates')
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ContactList(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='contact_lists')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Contact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contact_list = models.ForeignKey(ContactList, on_delete=models.CASCADE, related_name='contacts')
    email = models.EmailField()
    name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} ({self.contact_list.name})"

class ActivityLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.action}"

