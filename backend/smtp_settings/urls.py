from django.urls import path
from .views import SMTPCredentialView, SMTPTestConnectionView

urlpatterns = [
    path('', SMTPCredentialView.as_view(), name='smtp_credentials'),
    path('test/', SMTPTestConnectionView.as_view(), name='smtp_test_connection'),
]
