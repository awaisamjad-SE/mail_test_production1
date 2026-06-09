from django.db import models
from django.conf import settings
import uuid

class SMTPCredential(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='smtp_settings')
    gmail_address = models.EmailField()
    encrypted_app_password = models.TextField()
    is_verified = models.BooleanField(default=False)
    daily_sent_count = models.IntegerField(default=0)
    last_reset_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.gmail_address} ({self.user.email})"
