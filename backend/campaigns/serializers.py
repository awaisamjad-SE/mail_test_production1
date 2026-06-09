from rest_framework import serializers
from .models import Campaign, EmailLog, EmailTemplate, ContactList, Contact, ActivityLog

class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = '__all__'
        read_only_fields = ('id', 'user', 'successful_count', 'failed_count', 'status', 'created_at')

class EmailLogSerializer(serializers.ModelSerializer):
    campaign_name = serializers.CharField(source='campaign.name', read_only=True, default='Quick Send')
    
    class Meta:
        model = EmailLog
        fields = '__all__'
        read_only_fields = ('id', 'user', 'sent_at', 'status', 'error_message', 'retry_count')

class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at')

class ContactListSerializer(serializers.ModelSerializer):
    contacts_count = serializers.IntegerField(source='contacts.count', read_only=True, default=0)

    class Meta:
        model = ContactList
        fields = ('id', 'name', 'contacts_count', 'created_at')
        read_only_fields = ('id', 'contacts_count', 'created_at')

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'
        read_only_fields = ('id', 'created_at')

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'
        read_only_fields = ('id', 'created_at')
