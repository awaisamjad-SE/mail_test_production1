import os
import re
import html
import logging
from datetime import datetime
from email.message import EmailMessage
from email.utils import make_msgid, formatdate
from django.conf import settings

logger = logging.getLogger(__name__)

def clean_html_to_plain_text(html_content: str) -> str:
    """
    Cleanly converts an HTML string into readable plain text for MIME text/plain fallback.
    Strips script/style blocks, replaces block tags with line breaks, converts links,
    and unescapes HTML entities.
    """
    if not html_content:
        return ""

    # Remove script and style elements
    text = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Replace line breaks and paragraph breaks with newlines
    text = re.sub(r'<(br|br\s*/)\s*>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</?(p|div|tr|h[1-6]|li|blockquote)[^>]*>', '\n', text, flags=re.IGNORECASE)
    
    # Convert href links: <a href="URL">Text</a> -> Text (URL)
    def _link_replacer(match):
        href = match.group(1)
        link_text = match.group(2).strip()
        if href and link_text and href != link_text and not href.startswith('javascript:'):
            return f"{link_text} ({href})"
        return link_text or href
    text = re.sub(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', _link_replacer, text, flags=re.DOTALL | re.IGNORECASE)
    
    # Strip any remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Unescape HTML entities (&amp;, &lt;, &gt;, &quot;, &#39;, etc.)
    text = html.unescape(text)
    
    # Normalize multiple empty lines to a max of two newlines
    lines = [line.strip() for line in text.splitlines()]
    normalized = []
    blank_count = 0
    for line in lines:
        if not line:
            blank_count += 1
            if blank_count <= 1:
                normalized.append('')
        else:
            blank_count = 0
            normalized.append(line)
            
    return '\n'.join(normalized).strip()


class DeliverabilityAnalyzer:
    """
    Pre-flight RFC and deliverability analyzer for email messages.
    Validates message structure, mandatory headers, sender consistency,
    and MIME content types prior to SMTP socket submission.
    """
    
    @staticmethod
    def validate_rfc_compliance(msg: EmailMessage, is_campaign: bool = False) -> dict:
        """
        Validates RFC 5322, RFC 5321, and RFC 2046 compliance on an EmailMessage object.
        Returns a dict with 'is_valid', 'errors', and 'warnings'.
        """
        errors = []
        warnings = []
        
        # 1. Mandatory RFC 5322 Headers
        required_headers = ['From', 'To', 'Subject', 'Date', 'Message-ID']
        for header in required_headers:
            if not msg.get(header):
                errors.append(f"Missing mandatory RFC 5322 header: '{header}'")
                
        # 2. Bulk Campaign Mandatory Headers (RFC 2369 / RFC 8058)
        if is_campaign:
            if not msg.get('List-Unsubscribe'):
                warnings.append("Missing 'List-Unsubscribe' header (RFC 2369) on campaign email.")
            if not msg.get('List-Unsubscribe-Post'):
                warnings.append("Missing 'List-Unsubscribe-Post' header (RFC 8058) on campaign email.")
                
        # 3. Duplicate Headers Check
        header_names = [k.lower() for k in msg.keys()]
        single_instance_headers = ['from', 'to', 'subject', 'date', 'message-id', 'reply-to', 'content-type']
        for single_h in single_instance_headers:
            if header_names.count(single_h) > 1:
                errors.append(f"Duplicate header detected for single-instance field: '{single_h}'")
                
        # 4. MIME Structure Validation
        content_type = msg.get_content_type()
        is_multipart = msg.is_multipart()
        
        if is_multipart:
            subparts = list(msg.iter_parts())
            if content_type == 'multipart/mixed' and len(subparts) == 1 and subparts[0].get_content_type() == 'text/plain':
                warnings.append("Abnormal MIME architecture: 'multipart/mixed' container containing only a single text/plain part.")
            elif content_type == 'multipart/alternative':
                types = [p.get_content_type() for p in subparts]
                if 'text/plain' not in types:
                    errors.append("MIME 'multipart/alternative' structure must contain a 'text/plain' fallback part.")
                if 'text/html' not in types:
                    warnings.append("MIME 'multipart/alternative' missing 'text/html' part.")
        else:
            if content_type not in ['text/plain', 'text/html']:
                warnings.append(f"Non-standard single-part Content-Type: '{content_type}'")
                
        # 5. UTF-8 & Encoding Check
        try:
            msg.as_bytes()
        except Exception as enc_err:
            errors.append(f"Message byte serialization failed: {str(enc_err)}")
            
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }


class DebugEmailLogger:
    """
    Handles diagnostic dumping and sanitized SMTP conversation logging
    when MAILFLOW_EMAIL_DEBUG environment setting is active.
    """
    
    @staticmethod
    def is_debug_enabled() -> bool:
        debug_env = os.getenv('MAILFLOW_EMAIL_DEBUG', 'False').lower()
        return debug_env in ['true', '1', 'yes'] or getattr(settings, 'MAILFLOW_EMAIL_DEBUG', False)
        
    @classmethod
    def dump_eml(cls, msg: EmailMessage, log_id: str = None) -> str:
        """
        Saves the raw RFC 5322 payload to logs/email-debug/YYYYMMDD-HHMMSS-<id>.eml
        """
        if not cls.is_debug_enabled():
            return None
            
        try:
            log_dir = os.path.join(settings.BASE_DIR, 'logs', 'email-debug')
            os.makedirs(log_dir, exist_ok=True)
            
            timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
            filename = f"{timestamp}-{log_id or 'test'}.eml"
            filepath = os.path.join(log_dir, filename)
            
            with open(filepath, 'wb') as f:
                f.write(msg.as_bytes(policy=msg.policy))
                
            logger.info(f"[MAILFLOW_EMAIL_DEBUG] Saved raw email trace to {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"[MAILFLOW_EMAIL_DEBUG] Failed to save .eml trace: {e}")
            return None
