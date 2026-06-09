from rest_framework import serializers
from .models import SMTPCredential
from mailflow_backend.encryption import encrypt_password

class SMTPCredentialSerializer(serializers.ModelSerializer):
    app_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    has_password = serializers.SerializerMethodField()
    emails_sent_today = serializers.IntegerField(source='daily_sent_count', read_only=True)

    class Meta:
        model = SMTPCredential
        fields = (
            'id', 'gmail_address', 'app_password', 'is_verified', 
            'emails_sent_today', 'last_reset_date', 'has_password',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'is_verified', 'last_reset_date', 'created_at', 'updated_at')

    def get_has_password(self, obj):
        return bool(obj.encrypted_app_password)

    def create(self, validated_data):
        user = self.context['request'].user
        app_password = validated_data.pop('app_password', '')
        encrypted = encrypt_password(app_password) if app_password else ''
        
        # If SMTP settings already exist for user, overwrite them
        smtp, created = SMTPCredential.objects.update_or_create(
            user=user,
            defaults={
                'gmail_address': validated_data['gmail_address'],
                'encrypted_app_password': encrypted,
                'is_verified': False
            }
        )
        return smtp

    def update(self, instance, validated_data):
        app_password = validated_data.pop('app_password', None)
        if app_password is not None:
            instance.encrypted_app_password = encrypt_password(app_password)
            instance.is_verified = False
        
        instance.gmail_address = validated_data.get('gmail_address', instance.gmail_address)
        instance.save()
        return instance
