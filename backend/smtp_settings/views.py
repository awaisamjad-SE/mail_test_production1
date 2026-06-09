from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.utils import timezone
import smtplib

from .models import SMTPCredential
from .serializers import SMTPCredentialSerializer
from mailflow_backend.encryption import decrypt_password
from campaigns.models import EmailLog, ActivityLog

class SMTPCredentialView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        try:
            smtp = SMTPCredential.objects.get(user=request.user)
            
            # Check and reset daily sent limits if date has changed
            today = timezone.now().date()
            if smtp.last_reset_date != today:
                smtp.daily_sent_count = 0
                smtp.last_reset_date = today
                smtp.save()

            # Retrieve monthly counts from EmailLog
            start_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            monthly_count = EmailLog.objects.filter(
                user=request.user,
                status='SENT',
                sent_at__gte=start_of_month
            ).count()

            # Retrieve last sent timestamp
            last_sent_log = EmailLog.objects.filter(
                user=request.user,
                status='SENT'
            ).order_by('-sent_at').first()
            last_sent_at = last_sent_log.sent_at if last_sent_log else None

            serializer = SMTPCredentialSerializer(smtp)
            data = serializer.data
            data['emails_sent_this_month'] = monthly_count
            data['last_email_sent_at'] = last_sent_at
            return Response(data)
        except SMTPCredential.DoesNotExist:
            return Response({
                "gmail_address": "",
                "is_verified": False,
                "emails_sent_today": 0,
                "emails_sent_this_month": 0,
                "last_email_sent_at": None,
                "has_password": False
            })

    def post(self, request):
        try:
            smtp = SMTPCredential.objects.get(user=request.user)
            serializer = SMTPCredentialSerializer(smtp, data=request.data, partial=True, context={'request': request})
        except SMTPCredential.DoesNotExist:
            smtp = None
            serializer = SMTPCredentialSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            ActivityLog.objects.create(user=request.user, action="SMTP Credentials Updated")
            return Response(serializer.data, status=status.HTTP_200_OK if smtp else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        try:
            smtp = SMTPCredential.objects.get(user=request.user)
            smtp.delete()
            ActivityLog.objects.create(user=request.user, action="SMTP Credentials Deleted")
            return Response({"message": "SMTP credentials deleted successfully."}, status=status.HTTP_200_OK)
        except SMTPCredential.DoesNotExist:
            return Response({"error": "No SMTP credentials configured."}, status=status.HTTP_404_NOT_FOUND)

class SMTPTestConnectionView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            smtp = SMTPCredential.objects.get(user=request.user)
            if not smtp.encrypted_app_password:
                return Response({"status": "Failed", "error": "Gmail App Password not set."}, status=status.HTTP_400_BAD_REQUEST)

            password = decrypt_password(smtp.encrypted_app_password)
            if not smtp.gmail_address or not password:
                return Response({"status": "Failed", "error": "Invalid configuration details."}, status=status.HTTP_400_BAD_REQUEST)

            # Test connection to Google SMTP servers
            try:
                server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
                server.starttls()
                server.login(smtp.gmail_address, password)
                server.quit()

                # Mark as verified
                smtp.is_verified = True
                smtp.save()

                ActivityLog.objects.create(user=request.user, action="SMTP Connection Test Successful")
                return Response({"status": "Success", "message": "Gmail SMTP connection verified successfully."})
            except Exception as e:
                smtp.is_verified = False
                smtp.save()
                
                error_msg = str(e)
                ActivityLog.objects.create(user=request.user, action=f"SMTP Connection Test Failed: {error_msg}")
                return Response({"status": "Failed", "error": error_msg}, status=status.HTTP_400_BAD_REQUEST)

        except SMTPCredential.DoesNotExist:
            return Response({"status": "Failed", "error": "No SMTP credentials configured. Save them first."}, status=status.HTTP_400_BAD_REQUEST)
