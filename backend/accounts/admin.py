from django.contrib import admin
from django.contrib.auth import get_user_model

User = get_user_model()

@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'is_email_verified', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_email_verified', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('email', 'full_name')
    ordering = ('-date_joined',)
    readonly_fields = ('id', 'date_joined', 'email_verification_otp_created_at', 'password_reset_otp_created_at')
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Verification & OTP', {'fields': ('is_email_verified', 'email_verification_otp', 'email_verification_otp_created_at', 'password_reset_otp', 'password_reset_otp_created_at')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
