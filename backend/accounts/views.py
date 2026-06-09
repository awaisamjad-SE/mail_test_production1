from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer, ChangePasswordSerializer
from campaigns.models import ActivityLog

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Log action
            ActivityLog.objects.create(user=user, action="User Registered")
            
            # Generate JWT token
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "User registered successfully."
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
            if not user.check_password(serializer.validated_data['current_password']):
                return Response({"current_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            
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
            token = default_token_generator.make_token(user)
            # Create a mock reset link (printed in server logs for developer)
            reset_link = f"http://localhost:5173/reset-password?email={user.email}&token={token}"
            
            # Log audit trail
            ActivityLog.objects.create(user=user, action="Requested Password Reset Link")
            
            # Print to console for development verification
            print("\n" + "="*50)
            print(f"PASSWORD RESET LINK FOR {email}:")
            print(reset_link)
            print("="*50 + "\n")
            
            return Response({
                "message": "Password reset link generated. Check server logs.",
                "reset_link_dev": reset_link  # Return in response for easier testing
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            # For security, return 200 even if email doesn't exist so emails aren't enumerable
            return Response({"message": "Password reset link generated. Check server logs."}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not email or not token or not new_password:
            return Response({"error": "Email, token, and new_password fields are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({"new_password": ["Password must be at least 8 characters long."]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if default_token_generator.check_token(user, token):
                user.set_password(new_password)
                user.save()
                
                ActivityLog.objects.create(user=user, action="Password Reset Completed")
                return Response({"message": "Password reset successful. You can now login."}, status=status.HTTP_200_OK)
            else:
                return Response({"token": ["Invalid or expired reset token."]}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"email": ["User not found."]}, status=status.HTTP_400_BAD_REQUEST)
