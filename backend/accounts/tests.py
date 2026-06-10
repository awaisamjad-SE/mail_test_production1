from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.core import mail
import re


User = get_user_model()

class AccountsAuthTests(APITestCase):

    def setUp(self):
        self.register_url = reverse('auth_register')
        self.login_url = reverse('token_obtain_pair')
        self.profile_url = reverse('auth_profile')
        
        self.user_data = {
            'email': 'testuser@example.com',
            'full_name': 'Test User',
            'password': 'StrongPassword123',
            'confirm_password': 'StrongPassword123'
        }

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().email, 'testuser@example.com')

    def test_registration_with_existing_email(self):
        # Create initial user
        User.objects.create_user(
            email=self.user_data['email'],
            full_name=self.user_data['full_name'],
            password=self.user_data['password']
        )
        # Try registering same email
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login(self):
        # Create user
        user = User.objects.create_user(
            email=self.user_data['email'],
            full_name=self.user_data['full_name'],
            password=self.user_data['password']
        )
        user.is_email_verified = True
        user.save()
        
        # Login
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_profile_requires_auth(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_fetch_profile_success(self):
        # Create user
        user = User.objects.create_user(
            email=self.user_data['email'],
            full_name=self.user_data['full_name'],
            password=self.user_data['password']
        )
        user.is_email_verified = True
        user.save()
        
        # Obtain JWT Token
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        res = self.client.post(self.login_url, login_data, format='json')
        token = res.data['access']
        
        # Request Profile
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user_data['email'])
        self.assertEqual(response.data['full_name'], self.user_data['full_name'])

    def test_login_blocked_for_unverified_user(self):
        # Create user (defaults to is_email_verified=False)
        User.objects.create_user(
            email=self.user_data['email'],
            full_name=self.user_data['full_name'],
            password=self.user_data['password']
        )
        # Attempt Login
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(response.data.get('email_unverified'))
        self.assertEqual(response.data.get('email'), self.user_data['email'])

    def test_email_verification_otp_flow(self):
        # Clear outbox
        mail.outbox.clear()
        
        # Register user
        reg_response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)
        
        # Extract OTP from outbox
        self.assertEqual(len(mail.outbox), 1)
        email_body = mail.outbox[0].body
        otp = re.search(r'\b\d{6}\b', email_body).group()

        # Verify email with correct OTP
        verify_url = reverse('auth_verify_email')
        verify_response = self.client.post(verify_url, {
            'email': self.user_data['email'],
            'otp': otp
        }, format='json')
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', verify_response.data)
        
        # Verify database flag updated
        user = User.objects.get(email=self.user_data['email'])
        self.assertTrue(user.is_email_verified)

    def test_resend_otp(self):
        # Register user
        self.client.post(self.register_url, self.user_data, format='json')
        
        # Clear outbox
        mail.outbox.clear()
        
        # Request resend
        resend_url = reverse('auth_resend_otp')
        resend_response = self.client.post(resend_url, {
            'email': self.user_data['email'],
            'reason': 'verification'
        }, format='json')
        self.assertEqual(resend_response.status_code, status.HTTP_200_OK)
        
        # Extract OTP from outbox
        self.assertEqual(len(mail.outbox), 1)
        email_body = mail.outbox[0].body
        otp = re.search(r'\b\d{6}\b', email_body).group()
        self.assertTrue(otp)

    def test_forgot_reset_password_otp_flow(self):
        # Create verified user
        user = User.objects.create_user(
            email=self.user_data['email'],
            full_name=self.user_data['full_name'],
            password=self.user_data['password']
        )
        user.is_email_verified = True
        user.save()

        # Clear outbox
        mail.outbox.clear()

        # Trigger Forgot Password
        forgot_url = reverse('auth_forgot_password')
        forgot_response = self.client.post(forgot_url, {'email': self.user_data['email']}, format='json')
        self.assertEqual(forgot_response.status_code, status.HTTP_200_OK)
        
        # Extract OTP from outbox
        self.assertEqual(len(mail.outbox), 1)
        email_body = mail.outbox[0].body
        otp = re.search(r'\b\d{6}\b', email_body).group()

        # Reset Password
        reset_url = reverse('auth_reset_password')
        reset_response = self.client.post(reset_url, {
            'email': self.user_data['email'],
            'otp': otp,
            'new_password': 'NewStrongPassword123'
        }, format='json')
        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)

        # Login with new password
        login_data = {
            'email': self.user_data['email'],
            'password': 'NewStrongPassword123'
        }
        login_response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)


