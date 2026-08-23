from cryptography.fernet import Fernet
from django.conf import settings

def get_fernet():
    key = settings.ENCRYPTION_KEY.encode()
    return Fernet(key)

def encrypt_password(password: str) -> str:
    if not password:
        return ""
    f = get_fernet()
    return f.encrypt(password.encode()).decode()

def decrypt_password(encrypted_password: str) -> str:
    if not encrypted_password:
        return ""
    try:
        f = get_fernet()
        return f.decrypt(encrypted_password.encode()).decode()
    except Exception:
        return encrypted_password

