from django.contrib import admin
from .models import Campaign, EmailLog, EmailTemplate, ContactList, Contact, ActivityLog

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'campaign_type', 'status', 'total_recipients', 'successful_count', 'failed_count', 'created_at')
    list_filter = ('campaign_type', 'status', 'created_at')
    search_fields = ('name', 'subject', 'user__email', 'user__full_name')
    raw_id_fields = ('user',)
    ordering = ('-created_at',)

@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'recipient_name', 'campaign', 'user', 'status', 'sent_at', 'retry_count')
    list_filter = ('status', 'sent_at')
    search_fields = ('recipient', 'recipient_name', 'subject', 'user__email', 'campaign__name')
    raw_id_fields = ('user', 'campaign')
    ordering = ('-sent_at',)

@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'subject', 'user__email')
    raw_id_fields = ('user',)
    ordering = ('-created_at',)

@admin.register(ContactList)
class ContactListAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'user__email')
    raw_id_fields = ('user',)
    ordering = ('-created_at',)

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'contact_list', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('email', 'name', 'contact_list__name')
    raw_id_fields = ('contact_list',)
    ordering = ('-created_at',)

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'action')
    raw_id_fields = ('user',)
    ordering = ('-created_at',)
