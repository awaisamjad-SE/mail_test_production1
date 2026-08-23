from django.db import models
from django.conf import settings
import uuid

class SMTPCredential(models.Model):
    PROVIDER_CHOICES = (
        ('gmail', 'Gmail'),
        ('custom', 'Custom SMTP'),
    )

    AUTH_TYPE_CHOICES = (
        ('PASSWORD', 'Password / App Password'),
        ('OAUTH2', 'OAuth 2.0'),
    )

    SYNC_STATUS_CHOICES = (
        ('OK', 'OK'),
        ('AUTH_ERROR', 'Authentication Error'),
        ('CONNECTION_ERROR', 'Connection Error'),
        ('SYNCING', 'Syncing'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='smtp_settings')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='gmail')
    smtp_host = models.CharField(max_length=255, default='smtp.gmail.com')
    smtp_port = models.IntegerField(default=587)
    use_ssl = models.BooleanField(default=False)
    gmail_address = models.EmailField()
    encrypted_app_password = models.TextField()
    is_verified = models.BooleanField(default=False)
    daily_sent_count = models.IntegerField(default=0)
    last_reset_date = models.DateField(auto_now_add=True)

    # IMAP Configuration & Monitoring
    auth_type = models.CharField(max_length=20, choices=AUTH_TYPE_CHOICES, default='PASSWORD')
    imap_host = models.CharField(max_length=255, default='imap.hostinger.com')
    imap_port = models.IntegerField(default=993)
    imap_use_ssl = models.BooleanField(default=True)
    is_monitoring_enabled = models.BooleanField(default=True)

    # UID Checkpoints for Idempotent Syncing
    last_imap_uid = models.BigIntegerField(null=True, blank=True)
    imap_uid_validity = models.BigIntegerField(null=True, blank=True)
    last_sync_status = models.CharField(max_length=30, choices=SYNC_STATUS_CHOICES, default='OK')
    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_error_message = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.gmail_address} ({self.smtp_host}:{self.smtp_port})"

