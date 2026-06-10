from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import SMTPCredential
from mailflow_backend.encryption import decrypt_password

User = get_user_model()

class SmtpSettingsTests(APITestCase):

    def setUp(self):
        self.smtp_url = reverse('smtp_credentials')
        self.smtp_test_url = reverse('smtp_test_connection')
        
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

    def test_create_smtp_credential_encrypts_password(self):
        payload = {
            'gmail_address': 'sender@gmail.com',
            'app_password': 'abcd1234efgh5678'
        }
        
        response = self.client.post(self.smtp_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Confirm it's encrypted in database
        smtp = SMTPCredential.objects.get(user=self.user)
        self.assertNotEqual(smtp.encrypted_app_password, 'abcd1234efgh5678')
        
        # Confirm we can decrypt it correctly
        decrypted = decrypt_password(smtp.encrypted_app_password)
        self.assertEqual(decrypted, 'abcd1234efgh5678')

    def test_get_smtp_settings_masks_password(self):
        # Seed SMTP settings
        SMTPCredential.objects.create(
            user=self.user,
            gmail_address='sender@gmail.com',
            encrypted_app_password='encryptedpasswordstub',
            is_verified=False
        )
        
        response = self.client.get(self.smtp_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should not contain password or encrypted password field
        self.assertNotIn('app_password', response.data)
        self.assertNotIn('encrypted_app_password', response.data)
        self.assertEqual(response.data['gmail_address'], 'sender@gmail.com')
        self.assertTrue(response.data['has_password'])
        self.assertFalse(response.data['is_verified'])
