import random
from datetime import timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from campaigns.models import ActivityLog
from .serializers import (
    RegisterSerializer, UserSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer
)

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
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
                send_mail(
                    subject="MailFlow Email Verification OTP",
                    message=f"Thank you for registering with MailFlow!\n\nYour 6-digit email verification OTP code is: {otp}\n\nIt is valid for 15 minutes.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
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
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
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
                send_mail(
                    subject="MailFlow Password Reset OTP",
                    message=f"You requested a password reset.\n\nYour 6-digit password reset OTP code is: {otp}\n\nIt is valid for 15 minutes.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
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
            return Response({"message": "Password reset successful. You can now login."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"email": ["User not found."]}, status=status.HTTP_400_BAD_REQUEST)
