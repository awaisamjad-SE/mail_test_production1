from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmailTemplateViewSet, ContactListViewSet, ContactViewSet, CampaignViewSet,
    CampaignStatusView, DashboardStatsView, DashboardChartsView,
    EmailHistoryListView, ActivityLogListView, InboundEmailViewSet,
    GlobalSuppressionViewSet, ManualInboxSyncView, DirectSendView, PurgeSocialEmailsView
)

router = DefaultRouter()
router.register(r'templates', EmailTemplateViewSet, basename='template')
router.register(r'contact-lists', ContactListViewSet, basename='contact-list')
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'campaigns', CampaignViewSet, basename='campaign')
router.register(r'inbound-emails', InboundEmailViewSet, basename='inbound-email')
router.register(r'suppressions', GlobalSuppressionViewSet, basename='suppression')

urlpatterns = [
    path('inbox/sync-now/', ManualInboxSyncView.as_view(), name='inbox-sync-now'),
    path('inbox/purge-social/', PurgeSocialEmailsView.as_view(), name='inbox-purge-social'),
    path('send-direct/', DirectSendView.as_view(), name='send-direct'),
    path('campaigns/<uuid:pk>/status/', CampaignStatusView.as_view(), name='campaign-status'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/charts/', DashboardChartsView.as_view(), name='dashboard-charts'),
    path('email-logs/', EmailHistoryListView.as_view(), name='email-logs'),
    path('activity-logs/', ActivityLogListView.as_view(), name='activity-logs'),
    path('', include(router.urls)),
]



