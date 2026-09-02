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

    @patch('campaigns.views.dispatch_email')
    def test_create_campaign_triggers_celery_task(self, mock_dispatch_email):
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
        
        # Verify Celery/background dispatch is triggered
        self.assertEqual(mock_dispatch_email.call_count, 2)

    @patch('campaigns.views.dispatch_email')
    def test_direct_send_email(self, mock_dispatch_email):
        payload = {
            'to': 'direct@example.com',
            'cc': 'manager@example.com',
            'subject': 'Direct Briefing',
            'body': 'Hi, here is the direct update.',
        }
        response = self.client.post('/api/send-direct/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(mock_dispatch_email.call_count, 1)
        args, _ = mock_dispatch_email.call_args
        self.assertIsInstance(args[0], str)


    @patch('campaigns.views.dispatch_email')
    def test_create_campaign_with_multipart_list_of_strings_recipients(self, mock_dispatch_email):
        payload = {
            'name': 'Test Multipart List Campaign',
            'campaign_type': 'QUICK_SEND',
            'subject': 'Hello',
            'body': 'World',
            # Simulating list of strings that contains a JSON string
            'recipients': ['[{"email": "list1@example.com", "name": "List1"}]'],
        }
        response = self.client.post(self.campaigns_url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(mock_dispatch_email.call_count, 1)
        args, kwargs = mock_dispatch_email.call_args
        self.assertIsInstance(args[0], str)

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


class DeliverabilityTests(TestCase):

    def test_clean_html_to_plain_text(self):
        from .deliverability import clean_html_to_plain_text
        
        html_input = """
        <html>
          <body>
            <h1>Welcome to MailFlow!</h1>
            <p>Hi Awais,<br>Thank you for signing up.</p>
            <p>Click <a href="https://mailflow.engineer/login">here to login</a>.</p>
          </body>
        </html>
        """
        plain_text = clean_html_to_plain_text(html_input)
        self.assertIn("Welcome to MailFlow!", plain_text)
        self.assertIn("Hi Awais,\nThank you for signing up.", plain_text)
        self.assertIn("here to login (https://mailflow.engineer/login)", plain_text)
        self.assertNotIn("<h1>", plain_text)
        self.assertNotIn("<p>", plain_text)

    def test_deliverability_analyzer_validation(self):
        from email.message import EmailMessage
        from email.utils import make_msgid, formatdate
        from .deliverability import DeliverabilityAnalyzer
        
        msg = EmailMessage()
        msg['Subject'] = 'Test Subject'
        msg['From'] = 'Awais Amjad <awaisamjad@fastnexa.com>'
        msg['To'] = 'recipient@example.com'
        msg['Date'] = formatdate(localtime=True)
        msg['Message-ID'] = make_msgid(domain='fastnexa.com')
        msg.set_content('Plain text body')
        msg.add_alternative('<p>HTML body</p>', subtype='html')
        
        analysis = DeliverabilityAnalyzer.validate_rfc_compliance(msg, is_campaign=True)
        self.assertTrue(analysis['is_valid'])
        self.assertEqual(len(analysis['errors']), 0)


class IMAPEngineTests(TestCase):

    def setUp(self):
        from smtp_settings.models import SMTPCredential
        self.user = User.objects.create_user(
            email='ali@fastnexa.com',
            full_name='Ali FastNexa',
            password='Password123'
        )
        self.cred = SMTPCredential.objects.create(
            user=self.user,
            provider='custom',
            smtp_host='smtp.hostinger.com',
            smtp_port=465,
            use_ssl=True,
            gmail_address='ali@fastnexa.com',
            encrypted_app_password='encrypted_pass',
            imap_host='imap.hostinger.com',
            imap_port=993,
            imap_use_ssl=True
        )

        self.campaign = Campaign.objects.create(
            user=self.user,
            name='Outreach Campaign 1',
            campaign_type='QUICK_SEND',
            subject='Demo Request',
            body='Hi Lead, checking in!',
            total_recipients=1
        )

        self.log = EmailLog.objects.create(
            user=self.user,
            campaign=self.campaign,
            recipient='client@example.com',
            subject='Demo Request',
            body='Hi Lead, checking in!',
            status='SENT',
            message_id='msg-uuid-12345@mail.fastnexa.com'
        )

    def test_multi_tier_thread_matching_tier1(self):
        from .imap_engine import IMAPSyncEngine
        engine = IMAPSyncEngine(self.cred)
        matched_log = engine._find_matching_email_log(
            in_reply_to='msg-uuid-12345@mail.fastnexa.com',
            references=[],
            custom_header=None,
            sender_email='client@example.com',
            user=self.user
        )
        self.assertEqual(matched_log, self.log)

    def test_multi_tier_thread_matching_tier2(self):
        from .imap_engine import IMAPSyncEngine
        engine = IMAPSyncEngine(self.cred)
        matched_log = engine._find_matching_email_log(
            in_reply_to=None,
            references=['msg-uuid-12345@mail.fastnexa.com'],
            custom_header=None,
            sender_email='client@example.com',
            user=self.user
        )
        self.assertEqual(matched_log, self.log)

    def test_classification_and_sentiment_analysis(self):
        from .imap_engine import IMAPSyncEngine
        engine = IMAPSyncEngine(self.cred)

        # Interested Sentiment
        sentiment = engine._analyze_sentiment("Sounds great! Let's schedule a call tomorrow.", "Re: Demo Request")
        self.assertEqual(sentiment, 'INTERESTED')

        # Unsubscribe Sentiment
        sentiment_unsub = engine._analyze_sentiment("Please unsubscribe me and remove me from your list.", "Re: Demo Request")
        self.assertEqual(sentiment_unsub, 'UNSUBSCRIBE')

        # Bounce Classification
        from email.message import EmailMessage
        msg_bounce = EmailMessage()
        msg_bounce['From'] = 'Mailer-Daemon <mailer-daemon@hostinger.com>'
        msg_bounce['Subject'] = 'Delivery Status Notification (Failure)'
        cls_bounce = engine._classify_message(msg_bounce, msg_bounce['Subject'], "550 5.1.1 User unknown", "mailer-daemon@hostinger.com")
        self.assertEqual(cls_bounce, 'BOUNCE')

    def test_idempotent_inbound_email_processing(self):
        from .imap_engine import IMAPSyncEngine
        from .models import InboundEmail
        engine = IMAPSyncEngine(self.cred)

        # Mock single raw email payload
        from email.message import EmailMessage
        raw_msg = EmailMessage()
        raw_msg['From'] = 'client@example.com'
        raw_msg['To'] = 'ali@fastnexa.com'
        raw_msg['Subject'] = 'Re: Demo Request'
        raw_msg['In-Reply-To'] = '<msg-uuid-12345@mail.fastnexa.com>'
        raw_msg.set_content("Yes, I am interested! Let's talk.")

        # Process twice with same UID & UIDVALIDITY
        engine._process_single_inbound_message(uid=101, uid_validity=9999, raw_email_bytes=raw_msg.as_bytes())
        engine._process_single_inbound_message(uid=101, uid_validity=9999, raw_email_bytes=raw_msg.as_bytes())

        # Assert only 1 InboundEmail record created
        self.assertEqual(InboundEmail.objects.count(), 1)
        inbound = InboundEmail.objects.get()
        self.assertEqual(inbound.classification, 'HUMAN_REPLY')
        self.assertEqual(inbound.sentiment, 'INTERESTED')

        # Assert EmailLog reply_status updated to REPLIED and campaign replied_count is 1 (not 2)
        self.log.refresh_from_db()
        self.assertEqual(self.log.reply_status, 'REPLIED')
        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.replied_count, 1)


