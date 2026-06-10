from django.contrib import admin
from .models import SMTPCredential

@admin.register(SMTPCredential)
class SMTPCredentialAdmin(admin.ModelAdmin):
    list_display = ('gmail_address', 'user', 'is_verified', 'daily_sent_count', 'last_reset_date', 'created_at', 'updated_at')
    list_filter = ('is_verified', 'last_reset_date', 'created_at')
    search_fields = ('gmail_address', 'user__email', 'user__full_name')
    raw_id_fields = ('user',)
    ordering = ('-created_at',)
