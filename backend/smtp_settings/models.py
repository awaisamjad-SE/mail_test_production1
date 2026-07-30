from django.db import models
from django.conf import settings
import uuid

class SMTPCredential(models.Model):
    PROVIDER_CHOICES = (
        ('gmail', 'Gmail'),
        ('custom', 'Custom SMTP'),
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.gmail_address} ({self.smtp_host}:{self.smtp_port})"
