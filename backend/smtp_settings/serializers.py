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
            'id', 'provider', 'smtp_host', 'smtp_port', 'use_ssl',
            'gmail_address', 'app_password', 'is_verified', 
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
        
        provider = validated_data.get('provider', 'gmail')
        if provider == 'gmail':
            smtp_host = 'smtp.gmail.com'
            smtp_port = 587
            use_ssl = False
        else:
            smtp_host = validated_data.get('smtp_host', 'mail.fastnexa.com')
            smtp_port = validated_data.get('smtp_port', 465)
            use_ssl = validated_data.get('use_ssl', True if int(smtp_port) == 465 else False)

        defaults = {
            'provider': provider,
            'smtp_host': smtp_host,
            'smtp_port': int(smtp_port),
            'use_ssl': bool(use_ssl),
            'gmail_address': validated_data['gmail_address'],
            'is_verified': False
        }
        if app_password:
            defaults['encrypted_app_password'] = encrypted

        smtp, created = SMTPCredential.objects.update_or_create(
            user=user,
            defaults=defaults
        )
        return smtp

    def update(self, instance, validated_data):
        app_password = validated_data.pop('app_password', None)
        if app_password is not None and app_password != '':
            instance.encrypted_app_password = encrypt_password(app_password)
            instance.is_verified = False
        
        new_provider = validated_data.get('provider', instance.provider)
        instance.provider = new_provider

        if new_provider == 'gmail':
            instance.smtp_host = 'smtp.gmail.com'
            instance.smtp_port = 587
            instance.use_ssl = False
        else:
            instance.smtp_host = validated_data.get('smtp_host', instance.smtp_host if instance.smtp_host != 'smtp.gmail.com' else 'mail.fastnexa.com')
            instance.smtp_port = int(validated_data.get('smtp_port', instance.smtp_port))
            instance.use_ssl = bool(validated_data.get('use_ssl', instance.use_ssl))

        instance.gmail_address = validated_data.get('gmail_address', instance.gmail_address)
        instance.save()
        return instance
