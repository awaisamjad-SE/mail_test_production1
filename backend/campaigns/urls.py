from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmailTemplateViewSet, ContactListViewSet, ContactViewSet, CampaignViewSet,
    CampaignStatusView, DashboardStatsView, DashboardChartsView,
    EmailHistoryListView, ActivityLogListView
)

router = DefaultRouter()
router.register(r'templates', EmailTemplateViewSet, basename='template')
router.register(r'contact-lists', ContactListViewSet, basename='contact-list')
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'campaigns', CampaignViewSet, basename='campaign')

urlpatterns = [
    path('', include(router.urls)),
    path('campaigns/<uuid:pk>/status/', CampaignStatusView.as_view(), name='campaign-status'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/charts/', DashboardChartsView.as_view(), name='dashboard-charts'),
    path('email-logs/', EmailHistoryListView.as_view(), name='email-logs'),
    path('activity-logs/', ActivityLogListView.as_view(), name='activity-logs'),
]
