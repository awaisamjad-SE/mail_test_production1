from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch

from .models import Campaign, EmailLog, EmailTemplate

User = get_user_model()

class CampaignsTests(APITestCase):

    def setUp(self):
        self.campaigns_url = reverse('campaign-list')
        self.templates_url = reverse('template-list')
        
        self.user = User.objects.create_user(
            email='user@example.com',
            full_name='User Name',
            password='Password123'
        )
        self.user.is_email_verified = True
        self.user.save()

        
        # Authenticate
        login_res = self.client.post(reverse('token_obtain_pair'), {
            'email': 'user@example.com',
            'password': 'Password123'
        }, format='json')
        self.token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

    @patch('campaigns.views.send_email_task.delay')
    def test_create_campaign_triggers_celery_task(self, mock_send_email):
        payload = {
            'name': 'Test Bulk Campaign',
            'campaign_type': 'BULK_SEND',
            'subject': 'Welcome {{Name}}!',
            'body': 'Hi {{Name}}, welcome to MailFlow.',
            'recipients': [
                {'email': 'rcpt1@example.com', 'name': 'Alice', 'variables': {'Name': 'Alice'}},
                {'email': 'rcpt2@example.com', 'name': 'Bob', 'variables': {'Name': 'Bob'}}
            ]
        }
        
        response = self.client.post(self.campaigns_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify Campaign created
        self.assertEqual(Campaign.objects.count(), 1)
        campaign = Campaign.objects.get()
        self.assertEqual(campaign.name, 'Test Bulk Campaign')
        self.assertEqual(campaign.total_recipients, 2)
        
        # Verify EmailLog entries are created with interpolated templates
        self.assertEqual(EmailLog.objects.count(), 2)
        log1 = EmailLog.objects.get(recipient='rcpt1@example.com')
        self.assertEqual(log1.subject, 'Welcome Alice!')
        self.assertEqual(log1.body, 'Hi Alice, welcome to MailFlow.')
        
        log2 = EmailLog.objects.get(recipient='rcpt2@example.com')
        self.assertEqual(log2.subject, 'Welcome Bob!')
        self.assertEqual(log2.body, 'Hi Bob, welcome to MailFlow.')
        
        # Verify Celery task is triggered
        self.assertEqual(mock_send_email.call_count, 2)

    @patch('campaigns.views.send_email_task.delay')
    def test_create_campaign_with_file_attachment(self, mock_send_email):
        import base64
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        # Create a mock file
        test_file = SimpleUploadedFile("resume.pdf", b"pdf content", content_type="application/pdf")
        
        payload = {
            'name': 'Test Attachment Campaign',
            'campaign_type': 'QUICK_SEND',
            'subject': 'Application - {{Name}}',
            'body': 'Hi, please see attached my resume.',
            'recipients': '[{"email": "job@example.com", "name": "HR"}]',
            'attachment': test_file
        }
        
        response = self.client.post(self.campaigns_url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify Celery task is called with correct parameters (log.id, filename, base64_data)
        self.assertEqual(mock_send_email.call_count, 1)
        args, kwargs = mock_send_email.call_args
        self.assertEqual(args[1], 'resume.pdf')
        # Base64 string for b"pdf content" is "cGRmIGNvbnRlbnQ="
        self.assertEqual(args[2], 'cGRmIGNvbnRlbnQ=')

    def test_template_crud(self):
        payload = {
            'name': 'Welcome Template',
            'subject': 'Welcome to our platform!',
            'body': '<p>Hello world!</p>'
        }
        # Create
        response = self.client.post(self.templates_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(EmailTemplate.objects.count(), 1)
        template_id = response.data['id']
        
        # Fetch
        response = self.client.get(self.templates_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        # Update
        response = self.client.put(
            reverse('template-detail', kwargs={'pk': template_id}),
            {**payload, 'name': 'Welcome Template Updated'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(EmailTemplate.objects.get(id=template_id).name, 'Welcome Template Updated')
        
        # Delete
        response = self.client.delete(reverse('template-detail', kwargs={'pk': template_id}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(EmailTemplate.objects.count(), 0)
