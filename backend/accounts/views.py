import random
import re
from datetime import timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail, EmailMultiAlternatives
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from campaigns.models import ActivityLog
from .models import UserDevice
from .serializers import (
    RegisterSerializer, UserSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer
)

from email.utils import make_msgid, formatdate
from campaigns.deliverability import clean_html_to_plain_text

User = get_user_model()

def send_html_system_email(subject, title, message_html, recipient_email):
    # HTML body
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{subject}</title>
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          color: #334155;
          -webkit-font-smoothing: antialiased;
        }}
        .wrapper {{
          background-color: #f8fafc;
          padding: 24px;
        }}
        .container {{
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025);
          border: 1px solid #e2e8f0;
        }}
        .header {{
          background-color: #0f172a;
          padding: 32px 24px;
          text-align: center;
        }}
        .header-logo {{
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.025em;
          text-decoration: none;
        }}
        .content {{
          padding: 32px 24px;
          line-height: 1.6;
        }}
        .title {{
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 16px;
        }}
        .body-text {{
          font-size: 15px;
          color: #475569;
          margin-bottom: 24px;
        }}
        .otp-container {{
          background-color: #f1f5f9;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin: 24px 0;
          border: 1px dashed #cbd5e1;
        }}
        .otp-code {{
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: 0.25em;
          color: #0d9488;
        }}
        .footer {{
          background-color: #f8fafc;
          padding: 24px;
          text-align: center;
          border-top: 1px solid #f1f5f9;
          font-size: 12px;
          color: #94a3b8;
        }}
        .btn {{
          display: inline-block;
          background-color: #0d9488;
          color: #ffffff !important;
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin: 16px 0;
        }}
        .warning-box {{
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
          padding: 16px;
          border-radius: 8px;
          color: #991b1b;
          font-size: 14px;
          margin: 24px 0;
        }}
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <span class="header-logo">⚡ MailFlow</span>
          </div>
          <div class="content">
            <h1 class="title">{title}</h1>
            <div class="body-text">
              {message_html}
            </div>
          </div>
          <div class="footer">
            <p>MailFlow v5.1 &middot; Secure Email Marketing Infrastructure</p>
            <p style="margin-top: 8px;">If you did not request this email, you can safely ignore it or contact administrator.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    """
    
    # Plain text fallback via Deliverability module
    text_content = f"{title}\n\n" + clean_html_to_plain_text(message_html)
    
    from_email = settings.DEFAULT_FROM_EMAIL or 'noreply@mailflow.engineer'
    domain = from_email.split('@')[-1] if '@' in from_email else 'mailflow.engineer'
    
    headers = {
        'Date': formatdate(localtime=True),
        'Message-ID': make_msgid(domain=domain),
        'Auto-Submitted': 'auto-generated'
    }

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=from_email,
        to=[recipient_email],
        headers=headers
    )
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            
            # Successful validation, reset failed attempts
            user = serializer.user
            if user.failed_login_attempts > 0:
                user.failed_login_attempts = 0
                user.save()
                
            # Device auditing
            user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown Device')
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')
                
            # Check if this device already exists
            device_exists = UserDevice.objects.filter(user=user, user_agent=user_agent).exists()
            if not device_exists:
                # Create device log
                UserDevice.objects.create(user=user, user_agent=user_agent, ip_address=ip)
                # Send "New Device Login" notification email
                try:
                    send_html_system_email(
                        subject="MailFlow Security: New Device Login Detected",
                        title="New Device Login Detected",
                        message_html=f"""
                        We detected a new login to your MailFlow account.<br/><br/>
                        <b>Device User-Agent:</b> {user_agent}<br/>
                        <b>IP Address:</b> {ip}<br/>
                        <b>Time:</b> {timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')}<br/><br/>
                        If this was you, you can safely ignore this email. If this wasn't you, please change your password immediately.
                        """,
                        recipient_email=user.email
                    )
                except Exception as mail_err:
                    print(f"Failed to send new device notification to {user.email}: {mail_err}")
                    
        except Exception as e:
            # Handle validation/failed login attempts
            email = request.data.get('email')
            if email:
                try:
                    user = User.objects.get(email=email)
                    if user.is_email_verified:
                        user.failed_login_attempts += 1
                        user.last_failed_login = timezone.now()
                        user.save()
                        
                        if user.failed_login_attempts == 3:
                            # Send security warning email
                            try:
                                send_html_system_email(
                                    subject="MailFlow Security Alert: Multiple Failed Login Attempts",
                                    title="Security Alert: Failed Login Attempts",
                                    message_html=f"""
                                    <div class="warning-box">
                                      <b>Warning:</b> We detected 3 failed login attempts on your MailFlow account.
                                    </div>
                                    If this was you, please make sure you are using the correct password. If this was not you, someone might be attempting to access your account.
                                    """,
                                    recipient_email=user.email
                                )
                            except Exception as mail_err:
                                print(f"Failed to send failed login alert to {user.email}: {mail_err}")
                except User.DoesNotExist:
                    pass
            
            if hasattr(e, 'detail') and isinstance(e.detail, dict) and e.detail.get('email_unverified'):
                return Response({
                    "detail": "Email not verified.",
                    "email_unverified": True,
                    "email": request.data.get('email')
                }, status=status.HTTP_400_BAD_REQUEST)
            raise e
        return Response(serializer.validated_data, status=status.HTTP_200_OK)



class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate OTP
            otp = str(random.randint(100000, 999999))
            user.email_verification_otp = otp
            user.email_verification_otp_created_at = timezone.now()
            user.save()
            
            # Log action
            ActivityLog.objects.create(user=user, action="User Registered - Email Verification Sent")
            
            # Send Email
            email_sent = False
            try:
                send_html_system_email(
                    subject="MailFlow Email Verification OTP",
                    title="Verify Your Email Address",
                    message_html=f"""
                    Thank you for registering with MailFlow!<br/><br/>
                    Please use the following 6-digit OTP code to verify your email address:<br/>
                    <div class="otp-container">
                      <span class="otp-code">{otp}</span>
                    </div>
                    This code is valid for 15 minutes. If you did not register for a MailFlow account, you can safely ignore this email.
                    """,
                    recipient_email=user.email
                )
                email_sent = True
            except Exception as e:
                print(f"SMTP Error: Failed to send email verification to {user.email}. Error: {e}")
            
            response_data = {
                "user": UserSerializer(user).data,
                "message": "Registration successful. A verification OTP has been sent to your email.",
                "email": user.email,
                "email_sent": email_sent
            }
            # For developer convenience when testing locally if SMTP is not set up
            if settings.DEBUG or not email_sent:
                response_data["otp_dev_bypass"] = otp
                
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({"error": "Email and otp fields are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            
            if user.is_email_verified:
                return Response({"message": "Email is already verified."}, status=status.HTTP_200_OK)
                
            # Check OTP
            if not user.email_verification_otp or user.email_verification_otp != otp:
                return Response({"otp": ["Invalid verification OTP code."]}, status=status.HTTP_400_BAD_REQUEST)
                
            # Check Expiry (15 minutes)
            if user.email_verification_otp_created_at and timezone.now() - user.email_verification_otp_created_at > timedelta(minutes=15):
                return Response({"otp": ["Verification OTP code has expired."]}, status=status.HTTP_400_BAD_REQUEST)
                
            # Verify user
            user.is_email_verified = True
            user.email_verification_otp = None
            user.email_verification_otp_created_at = None
            user.save()
            
            ActivityLog.objects.create(user=user, action="Email Verified successfully via OTP")
            
            # Generate JWT token so they are logged in immediately
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Email verified successfully.",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({"email": ["User not found."]}, status=status.HTTP_400_BAD_REQUEST)

class ResendOTPView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        reason = request.data.get('reason') # 'verification' | 'reset'
        
        if not email or not reason:
            return Response({"error": "Email and reason fields are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            otp = str(random.randint(100000, 999999))
            
            if reason == 'verification':
                if user.is_email_verified:
                    return Response({"message": "Email is already verified."}, status=status.HTTP_400_BAD_REQUEST)
                user.email_verification_otp = otp
                user.email_verification_otp_created_at = timezone.now()
                user.save()
                
                subject = "MailFlow Email Verification OTP"
                message = f"Here is your new 6-digit email verification OTP code: {otp}\n\nIt is valid for 15 minutes."
                log_action = "Resent Email Verification OTP"
            elif reason == 'reset':
                user.password_reset_otp = otp
                user.password_reset_otp_created_at = timezone.now()
                user.save()
                
                subject = "MailFlow Password Reset OTP"
                message = f"Here is your new 6-digit password reset OTP code: {otp}\n\nIt is valid for 15 minutes."
                log_action = "Resent Password Reset OTP"
            else:
                return Response({"reason": ["Invalid reason. Must be 'verification' or 'reset'."]}, status=status.HTTP_400_BAD_REQUEST)
                
            # Send Email
            email_sent = False
            try:
                title_text = "Verify Your Email Address" if reason == 'verification' else "Reset Your Password"
                desc_text = "verify your email address" if reason == 'verification' else "reset your password"
                send_html_system_email(
                    subject=subject,
                    title=title_text,
                    message_html=f"""
                    You requested a new OTP code to {desc_text}.<br/><br/>
                    Please use the following 6-digit OTP code:<br/>
                    <div class="otp-container">
                      <span class="otp-code">{otp}</span>
                    </div>
                    This code is valid for 15 minutes.
                    """,
                    recipient_email=user.email
                )
                email_sent = True
            except Exception as e:
                print(f"SMTP Error: Failed to send {reason} OTP to {email}. Error: {e}")
                
            ActivityLog.objects.create(user=user, action=log_action)
            
            response_data = {
                "message": "A new 6-digit OTP code has been sent.",
                "email_sent": email_sent
            }
            if settings.DEBUG or not email_sent:
                response_data["otp_dev_bypass"] = otp
                
            return Response(response_data, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({"email": ["User not found."]}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            old_email = instance.email
            old_name = instance.full_name
            self.perform_update(serializer)
            
            # Log audit trail
            changes = []
            if old_email != instance.email:
                changes.append(f"email changed from {old_email} to {instance.email}")
            if old_name != instance.full_name:
                changes.append(f"name changed from {old_name} to {instance.full_name}")
            
            action_desc = "Profile Updated: " + (", ".join(changes) if changes else "no changes")
            ActivityLog.objects.create(user=instance, action=action_desc)
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({"error": "Wrong current password."}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            ActivityLog.objects.create(user=user, action="Password Changed")
            # Send Password Changed security notification email
            try:
                send_html_system_email(
                    subject="MailFlow Security Alert: Password Changed",
                    title="Your Password Has Been Changed",
                    message_html="""
                    Your MailFlow account password was recently changed.<br/><br/>
                    If this was you, no action is needed.<br/>
                    <b>If this was not you, please contact support or reset your password immediately.</b>
                    """,
                    recipient_email=user.email
                )
            except Exception as mail_err:
                print(f"Failed to send password changed notification: {mail_err}")
                
            return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"email": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            otp = str(random.randint(100000, 999999))
            user.password_reset_otp = otp
            user.password_reset_otp_created_at = timezone.now()
            user.save()
            
            # Log audit trail
            ActivityLog.objects.create(user=user, action="Requested Password Reset OTP")
            
            # Send Email
            email_sent = False
            try:
                send_html_system_email(
                    subject="MailFlow Password Reset OTP",
                    title="Reset Your Password",
                    message_html=f"""
                    You requested a password reset for your MailFlow account.<br/><br/>
                    Please use the following 6-digit OTP code to complete your password reset:<br/>
                    <div class="otp-container">
                      <span class="otp-code">{otp}</span>
                    </div>
                    This code is valid for 15 minutes.
                    """,
                    recipient_email=user.email
                )
                email_sent = True
            except Exception as e:
                print(f"SMTP Error: Failed to send password reset OTP to {email}. Error: {e}")
            
            response_data = {
                "message": "A password reset OTP has been sent to your email.",
                "email_sent": email_sent
            }
            if settings.DEBUG or not email_sent:
                response_data["otp_dev_bypass"] = otp
                
            return Response(response_data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            # For security, return 200 even if email doesn't exist so emails aren't enumerable
            return Response({"message": "A password reset OTP has been sent to your email."}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        
        if not email or not otp or not new_password:
            return Response({"error": "Email, otp, and new_password fields are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({"new_password": ["Password must be at least 8 characters long."]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            
            # Check OTP
            if not user.password_reset_otp or user.password_reset_otp != otp:
                return Response({"otp": ["Invalid reset OTP code."]}, status=status.HTTP_400_BAD_REQUEST)
                
            # Check Expiry (15 minutes)
            if user.password_reset_otp_created_at and timezone.now() - user.password_reset_otp_created_at > timedelta(minutes=15):
                return Response({"otp": ["Reset OTP code has expired."]}, status=status.HTTP_400_BAD_REQUEST)
                
            # Valid OTP
            user.set_password(new_password)
            user.password_reset_otp = None
            user.password_reset_otp_created_at = None
            # If they reset their password via email validation, we can also verify their email if it wasn't.
            user.is_email_verified = True
            user.save()
            
            ActivityLog.objects.create(user=user, action="Password Reset Completed via OTP")
            # Send Password Changed security notification email
            try:
                send_html_system_email(
                    subject="MailFlow Security Alert: Password Changed",
                    title="Your Password Has Been Changed",
                    message_html="""
                    Your MailFlow account password was recently reset successfully using an OTP code.<br/><br/>
                    If this was you, no action is needed.<br/>
                    <b>If this was not you, please contact support or reset your password immediately.</b>
                    """,
                    recipient_email=user.email
                )
            except Exception as mail_err:
                print(f"Failed to send password reset completed notification: {mail_err}")
                
            return Response({"message": "Password reset successful. You can now login."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"email": ["User not found."]}, status=status.HTTP_400_BAD_REQUEST)
