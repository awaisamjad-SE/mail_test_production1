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
                "provider": "gmail",
                "smtp_host": "smtp.gmail.com",
                "smtp_port": 587,
                "use_ssl": False,
                "gmail_address": "",
                "is_verified": False,
                "emails_sent_today": 0,
                "emails_sent_this_month": 0,
                "last_email_sent_at": None,
                "has_password": False
            })

    def post(self, request):
        data = request.data.copy()
        if not data.get('imap_host'):
            data['imap_host'] = data.get('smtp_host') or 'smtp.hostinger.com'
            data['imap_port'] = 993
            data['imap_use_ssl'] = True


        try:
            smtp = SMTPCredential.objects.get(user=request.user)
            serializer = SMTPCredentialSerializer(smtp, data=data, partial=True, context={'request': request})
        except SMTPCredential.DoesNotExist:
            smtp = None
            serializer = SMTPCredentialSerializer(data=data, context={'request': request})
        
        if serializer.is_valid():
            saved_smtp = serializer.save()
            saved_smtp.last_sync_status = 'OK'
            saved_smtp.last_error_message = None
            saved_smtp.is_verified = False
            saved_smtp.save(update_fields=['last_sync_status', 'last_error_message', 'is_verified'])
            ActivityLog.objects.create(user=request.user, action="SMTP Credentials Updated")
            return Response(SMTPCredentialSerializer(saved_smtp, context={'request': request}).data, status=status.HTTP_200_OK if smtp else status.HTTP_201_CREATED)
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
                return Response({"status": "Failed", "error": "SMTP Password not set."}, status=status.HTTP_400_BAD_REQUEST)

            password = decrypt_password(smtp.encrypted_app_password)
            if not smtp.gmail_address or not password:
                return Response({"status": "Failed", "error": "Invalid configuration details."}, status=status.HTTP_400_BAD_REQUEST)

            # Test connection to SMTP server dynamically
            try:
                connection_attempts = []
                if smtp.provider == 'gmail':
                    connection_attempts.append(('smtp.gmail.com', 587, False))
                else:
                    primary_host = (smtp.smtp_host or 'smtp.hostinger.com').strip()
                    primary_port = int(smtp.smtp_port or 465)
                    primary_ssl = smtp.use_ssl if smtp.use_ssl is not None else (primary_port == 465)

                    connection_attempts.append((primary_host, primary_port, primary_ssl))
                    if primary_port != 587:
                        connection_attempts.append((primary_host, 587, False))
                    if primary_host != 'smtp.hostinger.com':
                        connection_attempts.append(('smtp.hostinger.com', 465, True))
                        connection_attempts.append(('smtp.hostinger.com', 587, False))

                server = None
                last_err = None
                connected_info = ""
                for host, port, use_ssl in connection_attempts:
                    try:
                        if use_ssl or port == 465:
                            server = smtplib.SMTP_SSL(host, port, timeout=12)
                        else:
                            server = smtplib.SMTP(host, port, timeout=12)
                            server.starttls()
                        server.login(smtp.gmail_address, password)
                        connected_info = f"{host}:{port}"
                        break
                    except Exception as err:
                        last_err = err

                if not server:
                    raise last_err

                server.quit()

                # Mark as verified and clear errors
                smtp.is_verified = True
                smtp.last_sync_status = 'OK'
                smtp.last_error_message = None
                smtp.save(update_fields=['is_verified', 'last_sync_status', 'last_error_message'])

                ActivityLog.objects.create(user=request.user, action=f"SMTP Connection Test Successful ({connected_info})")
                return Response({"status": "Success", "message": f"SMTP connection to {connected_info} verified successfully!"})
            except smtplib.SMTPAuthenticationError as auth_err:
                smtp.is_verified = False
                smtp.last_sync_status = 'AUTH_ERROR'
                error_detail = auth_err.smtp_error.decode('utf-8', errors='ignore') if isinstance(auth_err.smtp_error, bytes) else str(auth_err.smtp_error)
                msg = f"Authentication Failed ({host}:{port}): {error_detail}"
                smtp.last_error_message = msg
                smtp.save(update_fields=['is_verified', 'last_sync_status', 'last_error_message'])
                ActivityLog.objects.create(user=request.user, action=f"SMTP Auth Failed: {msg}")
                return Response({"status": "Failed", "error": msg}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                smtp.is_verified = False
                smtp.last_sync_status = 'CONNECTION_ERROR'
                error_msg = str(e)
                msg = f"Connection Failed ({host}:{port}): {error_msg}"
                smtp.last_error_message = msg
                smtp.save(update_fields=['is_verified', 'last_sync_status', 'last_error_message'])
                ActivityLog.objects.create(user=request.user, action=f"SMTP Connection Test Failed: {error_msg}")
                return Response({"status": "Failed", "error": msg}, status=status.HTTP_400_BAD_REQUEST)


        except SMTPCredential.DoesNotExist:
            return Response({"status": "Failed", "error": "No SMTP credentials configured. Save them first."}, status=status.HTTP_400_BAD_REQUEST)
