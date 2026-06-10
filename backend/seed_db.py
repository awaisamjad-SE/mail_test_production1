import os
from cryptography.fernet import Fernet
#Comments
# Define env file path
env_path = os.path.join(os.path.dirname(__file__), '.env')

# 1. Generate or read ENCRYPTION_KEY and Django SECRET_KEY
encryption_key = None
secret_key = None

if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        content = f.read()
        for line in content.split('\n'):
            if line.startswith('ENCRYPTION_KEY='):
                encryption_key = line.split('=')[1].strip()
            if line.startswith('SECRET_KEY='):
                secret_key = line.split('=')[1].strip()

if not encryption_key:
    encryption_key = Fernet.generate_key().decode()
if not secret_key:
    import random
    secret_key = ''.join(random.SystemRandom().choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)') for i in range(50))

# Write keys to .env
with open(env_path, 'w') as f:
    f.write(f"DEBUG=True\n")
    f.write(f"SECRET_KEY={secret_key}\n")
    f.write(f"ENCRYPTION_KEY={encryption_key}\n")
    f.write(f"CELERY_BROKER_URL=redis://localhost:6379/0\n")
    f.write(f"CELERY_RESULT_BACKEND=redis://localhost:6379/0\n")

print("Generated and saved configuration keys to .env")

# 2. Boot up Django context
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mailflow_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from smtp_settings.models import SMTPCredential
from mailflow_backend.encryption import encrypt_password

User = get_user_model()

email = 'awaisamjad.official@gmail.com'
password = 'Pass@1234'
app_password = 'tmvmtywmdazyslmd'

# Create or update user
user, created = User.objects.get_or_create(email=email)
user.set_password(password)
user.full_name = 'Awais Amjad'
user.is_staff = True
user.is_superuser = True
user.save()

print(f"User {email} {'created' if created else 'updated'} successfully.")

# Create or update SMTP credential
smtp, smtp_created = SMTPCredential.objects.get_or_create(user=user)
smtp.gmail_address = email
smtp.encrypted_app_password = encrypt_password(app_password)
smtp.is_verified = True  # Pre-verified for testing
smtp.save()

print(f"SMTP Credentials for {email} {'created' if smtp_created else 'updated'} successfully.")
