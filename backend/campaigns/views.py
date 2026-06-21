from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q
from django.db.models.functions import TruncDay, TruncMonth

from .models import Campaign, EmailLog, EmailTemplate, ContactList, Contact, ActivityLog
from .serializers import (
    CampaignSerializer, EmailLogSerializer, EmailTemplateSerializer,
    ContactListSerializer, ContactSerializer, ActivityLogSerializer
)
from .tasks import send_email_task
class EmailTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = EmailTemplateSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return EmailTemplate.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        template = serializer.save(user=self.request.user)
        ActivityLog.objects.create(user=self.request.user, action=f"Saved Email Template: {template.name}")

    def perform_update(self, serializer):
        template = serializer.save()
        ActivityLog.objects.create(user=self.request.user, action=f"Updated Email Template: {template.name}")

    def perform_destroy(self, instance):
        name = instance.name
        instance.delete()
        ActivityLog.objects.create(user=self.request.user, action=f"Deleted Email Template: {name}")

class ContactListViewSet(viewsets.ModelViewSet):
    serializer_class = ContactListSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return ContactList.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        contact_list = serializer.save(user=self.request.user)
        ActivityLog.objects.create(user=self.request.user, action=f"Created Contact List: {contact_list.name}")

class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Contact.objects.filter(contact_list__user=self.request.user).order_by('-created_at')

class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Campaign.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # We handle creation via custom POST logic below to support queuing
        pass

    def create(self, request, *args, **kwargs):
        import json
        import base64
        user = request.user
        data = request.data
        
        name = data.get('name', f"Campaign {timezone.now().strftime('%Y-%m-%d %H:%M')}")
        campaign_type = data.get('campaign_type', 'QUICK_SEND')
        subject = data.get('subject', '')
        body = data.get('body', '')
        recipients = data.get('recipients', []) # Expected list: [{"email": "...", "name": "...", "variables": {...}}]

        # Robust recipients parsing for both application/json and multipart/form-data
        if isinstance(recipients, str):
            try:
                recipients = json.loads(recipients)
            except json.JSONDecodeError:
                return Response({"error": "Invalid recipients JSON string format."}, status=status.HTTP_400_BAD_REQUEST)

        if isinstance(recipients, list):
            parsed_recipients = []
            for item in recipients:
                if isinstance(item, str):
                    try:
                        parsed_item = json.loads(item)
                        if isinstance(parsed_item, list):
                            parsed_recipients.extend(parsed_item)
                        elif isinstance(parsed_item, dict):
                            parsed_recipients.append(parsed_item)
                        else:
                            parsed_recipients.append({"email": item})
                    except (json.JSONDecodeError, TypeError):
                        parsed_recipients.append({"email": item})
                elif isinstance(item, dict):
                    parsed_recipients.append(item)
            recipients = parsed_recipients

        if not subject or not body:
            return Response({"error": "Subject and Body fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not recipients or len(recipients) == 0:
            return Response({"error": "At least one recipient is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Handle in-memory Base64 attachment encoding
        file_obj = request.FILES.get('attachment')
        attachment_name = None
        attachment_data = None
        if file_obj:
            attachment_name = file_obj.name
            attachment_data = base64.b64encode(file_obj.read()).decode('utf-8')

        # Create Campaign
        campaign = Campaign.objects.create(
            user=user,
            name=name,
            campaign_type=campaign_type,
            subject=subject,
            body=body,
            total_recipients=len(recipients),
            status='Processing'
        )

        ActivityLog.objects.create(user=user, action=f"Created Campaign: {name} ({len(recipients)} recipients)")

        # Create EmailLog entries and schedule background tasks
        for r in recipients:
            email_addr = r.get('email')
            rcpt_name = r.get('name', '')
            variables = r.get('variables', {})

            # Replace placeholders in subject/body if variables are present
            rcpt_subject = subject
            rcpt_body = body
            
            # Inject name fallback
            replacements = {**variables}
            if rcpt_name and 'Name' not in replacements:
                replacements['Name'] = rcpt_name
                
            for key, val in replacements.items():
                placeholder = '{{' + key + '}}'
                rcpt_subject = rcpt_subject.replace(placeholder, str(val))
                rcpt_body = rcpt_body.replace(placeholder, str(val))

            log = EmailLog.objects.create(
                user=user,
                campaign=campaign,
                recipient=email_addr,
                recipient_name=rcpt_name,
                subject=rcpt_subject,
                body=rcpt_body,
                status='PENDING'
            )

            # Trigger Celery background task with attachment parameters (cast log.id to string for JSON serialization)
            send_email_task.delay(str(log.id), attachment_name, attachment_data)

        return Response(CampaignSerializer(campaign).data, status=status.HTTP_201_CREATED)

class CampaignStatusView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, pk):
        try:
            campaign = Campaign.objects.get(id=pk, user=request.user)
            
            # Dynamic stats
            pending = EmailLog.objects.filter(campaign=campaign, status='PENDING').count()
            sent = EmailLog.objects.filter(campaign=campaign, status='SENT').count()
            failed = EmailLog.objects.filter(campaign=campaign, status='FAILED').count()
            
            progress = (sent + failed) / campaign.total_recipients if campaign.total_recipients > 0 else 0
            
            return Response({
                "id": campaign.id,
                "name": campaign.name,
                "status": campaign.status,
                "total_recipients": campaign.total_recipients,
                "successful_count": sent,
                "failed_count": failed,
                "pending_count": pending,
                "progress_percent": round(progress * 100, 1),
                "created_at": campaign.created_at
            })
        except Campaign.DoesNotExist:
            return Response({"error": "Campaign not found."}, status=status.HTTP_404_NOT_FOUND)

class DashboardStatsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        
        total_sent = EmailLog.objects.filter(user=user, status='SENT').count()
        total_failed = EmailLog.objects.filter(user=user, status='FAILED').count()
        total_campaigns = Campaign.objects.filter(user=user).count()
        total_templates = EmailTemplate.objects.filter(user=user).count()

        success_rate = 0
        total_deliveries = total_sent + total_failed
        if total_deliveries > 0:
            success_rate = round((total_sent / total_deliveries) * 100, 1)

        return Response({
            "emails_sent": total_sent,
            "emails_failed": total_failed,
            "campaigns": total_campaigns,
            "templates": total_templates,
            "success_rate": success_rate
        })

class DashboardChartsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        
        # 1. Daily Sends - Last 30 Days
        start_date = timezone.now() - timedelta(days=30)
        daily_logs = EmailLog.objects.filter(
            user=user, 
            status='SENT', 
            sent_at__gte=start_date
        ).annotate(
            day=TruncDay('sent_at')
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')

        daily_sends = []
        # Prepopulate last 30 days to avoid gaps
        day_map = { (timezone.now() - timedelta(days=i)).date().strftime('%b %d'): 0 for i in range(30) }
        
        for log in daily_logs:
            if log['day']:
                day_str = log['day'].date().strftime('%b %d')
                day_map[day_str] = log['count']
        
        # Format as list sorted chronologically
        daily_sends = [{"date": k, "count": v} for k, v in reversed(list(day_map.items()))]

        # 2. Delivery Status Partition
        status_counts = EmailLog.objects.filter(user=user).values('status').annotate(count=Count('id'))
        delivery_status = [
            {"name": "Sent", "value": 0, "color": "#10b981"},
            {"name": "Failed", "value": 0, "color": "#ef4444"},
            {"name": "Pending", "value": 0, "color": "#3b82f6"}
        ]
        
        for stat in status_counts:
            val = stat['status']
            count = stat['count']
            if val == 'SENT':
                delivery_status[0]['value'] = count
            elif val == 'FAILED':
                delivery_status[1]['value'] = count
            elif val == 'PENDING':
                delivery_status[2]['value'] = count

        # 3. Campaign Performance (Top 5 Campaigns by Volume)
        campaigns_logs = Campaign.objects.filter(user=user).order_by('-created_at')[:5]
        campaign_performance = [
            {"name": c.name[:15] + "...", "sent": c.successful_count, "failed": c.failed_count}
            for c in campaigns_logs
        ]

        # 4. Monthly sends growth (Last 6 Months)
        six_months_ago = timezone.now() - timedelta(days=180)
        monthly_logs = EmailLog.objects.filter(
            user=user, 
            status='SENT', 
            sent_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('sent_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        monthly_growth = []
        for log in monthly_logs:
            if log['month']:
                monthly_growth.append({
                    "month": log['month'].strftime('%b %Y'),
                    "count": log['count']
                })

        return Response({
            "daily_sends": daily_sends,
            "delivery_status": delivery_status,
            "campaign_performance": campaign_performance,
            "monthly_growth": monthly_growth
        })

class EmailHistoryListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        
        # Filtering & Search parameters
        status_filter = request.query_params.get('status')
        campaign_filter = request.query_params.get('campaign')
        search_query = request.query_params.get('search')
        
        logs = EmailLog.objects.filter(user=user).order_by('-sent_at', '-id')
        
        if status_filter:
            logs = logs.filter(status=status_filter.upper())
        if campaign_filter:
            logs = logs.filter(campaign__id=campaign_filter)
        if search_query:
            logs = logs.filter(
                Q(recipient__icontains=search_query) |
                Q(subject__icontains=search_query) |
                Q(campaign__name__icontains=search_query)
            )

        # Pagination helper
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        start = (page - 1) * page_size
        end = start + page_size

        total_count = logs.count()
        paginated_logs = logs[start:end]
        
        serializer = EmailLogSerializer(paginated_logs, many=True)
        return Response({
            "results": serializer.data,
            "total_count": total_count,
            "page": page,
            "page_size": page_size
        })

class ActivityLogListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        logs = ActivityLog.objects.filter(user=request.user).order_by('-created_at')[:25]
        serializer = ActivityLogSerializer(logs, many=True)
        return Response(serializer.data)
