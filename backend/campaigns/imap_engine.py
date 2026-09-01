import imaplib
import email
from email.header import decode_header
import re
import html
import logging
from datetime import datetime
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction, models
from django.conf import settings

from .models import Campaign, EmailLog, InboundEmail, BounceDetail, GlobalSuppressionList, ActivityLog
from smtp_settings.models import SMTPCredential
from mailflow_backend.encryption import decrypt_password

logger = logging.getLogger(__name__)

def sanitize_email_header(header_val):
    """Cleanly decodes RFC 2047 encoded headers."""
    if not header_val:
        return ""
    parts = decode_header(header_val)
    decoded_str = ""
    for content, encoding in parts:
        if isinstance(content, bytes):
            decoded_str += content.decode(encoding or 'utf-8', errors='replace')
        else:
            decoded_str += str(content)
    return decoded_str.strip()

def normalize_message_id(msg_id):
    """Strips angle brackets and whitespace to standardize Message-ID for DB lookup."""
    if not msg_id:
        return ""
    clean = str(msg_id).strip()
    if clean.startswith('<') and clean.endswith('>'):
        clean = clean[1:-1]
    return clean.strip()

def sanitize_html_body(html_content):
    """Strips dangerous script/iframe tags from inbound HTML for safe rendering."""
    if not html_content:
        return ""
    # Strip script, iframe, and form tags
    clean = re.sub(r'<(script|iframe|form)[^>]*>.*?</\1>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    # Strip inline javascript handlers
    clean = re.sub(r'\son\w+=["\'][^"\']*["\']', '', clean, flags=re.IGNORECASE)
    return clean

class IMAPSyncEngine:
    def __init__(self, credential: SMTPCredential):
        self.credential = credential
        self.user = credential.user

    def _acquire_lock(self):
        lock_key = f"imap-sync-lock:{self.credential.id}"
        # Acquire 5-minute timeout lock
        return cache.add(lock_key, "1", timeout=300)

    def _release_lock(self):
        lock_key = f"imap-sync-lock:{self.credential.id}"
        cache.delete(lock_key)

    def sync_inbox(self):
        if not self._acquire_lock():
            logger.info(f"Sync already in progress for credential {self.credential.id}. Skipping.")
            return {"status": "LOCKED", "processed_count": 0}

        self.credential.last_sync_status = 'SYNCING'
        self.credential.save(update_fields=['last_sync_status'])

        try:
            processed_count = self._run_imap_fetch()
            self.credential.last_sync_status = 'OK'
            self.credential.last_sync_at = timezone.now()
            self.credential.last_error_message = None
            self.credential.save(update_fields=['last_sync_status', 'last_sync_at', 'last_error_message'])
            return {"status": "SUCCESS", "processed_count": processed_count}
        except Exception as e:
            error_msg = str(e)
            logger.error(f"IMAP Sync failed for credential {self.credential.id}: {error_msg}")
            self.credential.last_sync_status = 'CONNECTION_ERROR' if ('connect' in error_msg.lower() or 'timed out' in error_msg.lower()) else 'AUTH_ERROR'
            self.credential.last_error_message = error_msg
            self.credential.save(update_fields=['last_sync_status', 'last_error_message'])
            return {"status": "NOTICE", "processed_count": 0, "error": error_msg}
        finally:
            self._release_lock()

    def _run_imap_fetch(self):
        # 1. Establish SSL / STARTTLS connection with multi-target fallback
        connection_targets = []
        if self.credential.provider == 'gmail':
            connection_targets.append(('imap.gmail.com', 993, True))
        else:
            primary_host = (self.credential.imap_host or self.credential.smtp_host or 'imap.hostinger.com').strip()
            connection_targets.append((primary_host, 993, True))
            connection_targets.append((primary_host, 143, False))
            if 'hostinger' in primary_host.lower():
                connection_targets.append(('imap.hostinger.com', 993, True))

        mail = None
        last_err = None
        for host, port, use_ssl in connection_targets:
            try:
                if use_ssl:
                    mail = imaplib.IMAP4_SSL(host, port)
                else:
                    mail = imaplib.IMAP4(host, port)
                    mail.starttls()
                password = decrypt_password(self.credential.encrypted_app_password)
                mail.login(self.credential.gmail_address, password)
                last_err = None
                break
            except Exception as err:
                last_err = err
                if mail:
                    try:
                        mail.logout()
                    except Exception:
                        pass
                mail = None

        if not mail:
            raise last_err




        # 2. Select INBOX and check UIDVALIDITY
        status, select_data = mail.select("INBOX", readonly=True)
        if status != 'OK':
            mail.logout()
            raise Exception("Unable to select INBOX")

        status, status_data = mail.status("INBOX", "(UIDVALIDITY)")
        current_uid_validity = 1
        if status == 'OK' and status_data and status_data[0]:
            match = re.search(r'UIDVALIDITY\s+(\d+)', status_data[0].decode('utf-8', errors='ignore'))
            if match:
                current_uid_validity = int(match.group(1))

        # Check if mailbox UIDVALIDITY changed (e.g. mailbox rebuilt on server)
        if self.credential.imap_uid_validity != current_uid_validity:
            self.credential.imap_uid_validity = current_uid_validity
            self.credential.last_imap_uid = 0
            self.credential.save(update_fields=['imap_uid_validity', 'last_imap_uid'])


        last_uid = self.credential.last_imap_uid or 0
        search_criterion = f"UID {last_uid + 1}:*" if last_uid > 0 else "ALL"

        status, search_data = mail.uid('SEARCH', None, search_criterion)
        if status != 'OK' or not search_data or not search_data[0]:
            mail.logout()
            return 0

        uids = search_data[0].split()
        if not uids:
            mail.logout()
            return 0

        # If doing initial sync (last_uid == 0), target the most recent 100 UIDs for instant reply detection
        if last_uid == 0 and len(uids) > 100:
            max_uid_in_inbox = int(uids[-1])
            uids = uids[-100:]
            # Set last_uid checkpoint baseline so we don't re-scan ancient emails
            self.credential.last_imap_uid = max_uid_in_inbox - 100
            self.credential.save(update_fields=['last_imap_uid'])

        processed_count = 0
        max_processed_uid = last_uid or int(uids[0])

        for uid_bytes in uids:
            uid = int(uid_bytes)
            if uid <= last_uid:
                continue

            status, fetch_data = mail.uid('FETCH', uid_bytes, '(RFC822)')
            if status != 'OK' or not fetch_data or not fetch_data[0]:
                continue

            raw_email = None
            for response_part in fetch_data:
                if isinstance(response_part, tuple):
                    raw_email = response_part[1]
                    break

            if raw_email:
                try:
                    self._process_single_inbound_message(uid, current_uid_validity, raw_email)
                    processed_count += 1
                except Exception as msg_err:
                    logger.error(f"Error processing IMAP message UID {uid}: {msg_err}")

            max_processed_uid = max(max_processed_uid, uid)

        # Update last processed UID checkpoint
        if max_processed_uid > last_uid:
            self.credential.last_imap_uid = max_processed_uid
            self.credential.save(update_fields=['last_imap_uid'])

        mail.logout()
        return processed_count

    def _process_single_inbound_message(self, uid, uid_validity, raw_email_bytes):
        msg = email.message_from_bytes(raw_email_bytes)

        # Extract Raw Headers into Dictionary
        raw_headers = {}
        for k, v in msg.items():
            raw_headers[k.lower()] = sanitize_email_header(v)

        raw_msg_id = normalize_message_id(msg.get("Message-ID"))
        raw_in_reply_to = normalize_message_id(msg.get("In-Reply-To"))
        
        # References header can contain multiple Message-IDs separated by space
        raw_references = msg.get("References", "")
        references_list = [normalize_message_id(ref) for ref in raw_references.split() if ref.strip()] if raw_references else []

        sender_header = sanitize_email_header(msg.get("From"))
        sender_name, sender_email = self._parse_address_header(sender_header)
        recipient_header = sanitize_email_header(msg.get("To"))
        _, recipient_email = self._parse_address_header(recipient_header)
        subject = sanitize_email_header(msg.get("Subject", ""))

        # Filter out social/automated notifications from entering Unibox
        automated_domains = ['facebookmail.com', 'linkedin.com', 'twitter.com', 'github.com', 'notifications.google.com', 'google.com', 'youtube.com', 'instagram.com', 'tiktok.com', 'indeed.com', 'groq.co', 'clickup.com', 'amazon.com', 'codecademy.com', 'abl.com', 'snov.io', 'blueticks.co', 'hbl.com', 'binance.com', 'snapchat.com', 'foodpanda.pk', 'telenorbank.pk', 'ubl.com.pk', 'apollo.io', 'moodle.org', 'oracle.com', 'hubspot.com', 'bayt.com', 'ipinfo.io', 'jobscan.co']
        automated_prefixes = ('no-reply@', 'noreply@', 'donotreply@', 'do_not_reply@', 'notification@', 'notifications@', 'mailer@', 'news@', 'andy-noreply@', 'jobalert@', 'securityalerts@')
        sender_lower = sender_email.lower()
        if any(dom in sender_lower for dom in automated_domains) or sender_lower.startswith(automated_prefixes):
            logger.info(f"Skipping social/automated notification from {sender_email}")
            return

        # Extract Body text and HTML
        body_text, body_html = self._extract_body(msg)

        # Classification (Bounce vs Auto-Reply vs Human Reply)
        classification = self._classify_message(msg, subject, body_text, sender_email)
        sentiment = self._analyze_sentiment(body_text, subject, sender_email) if classification == 'HUMAN_REPLY' else 'NEUTRAL'

        is_bounce = (classification == 'BOUNCE')

        # Multi-Tier Thread & EmailLog Matching
        email_log = self._find_matching_email_log(
            in_reply_to=raw_in_reply_to,
            references=references_list,
            custom_header=msg.get("X-FastNexa-EmailLog-ID"),
            sender_email=sender_email,
            user=self.user,
            body_text=body_text,
            is_bounce=is_bounce
        )

        campaign = email_log.campaign if email_log else None

        with transaction.atomic():
            # Create InboundEmail (Database constraint ensures idempotency)
            inbound_email, created = InboundEmail.objects.get_or_create(
                smtp_credential=self.credential,
                imap_uid_validity=uid_validity,
                imap_uid=uid,
                defaults={
                    'user': self.user,
                    'campaign': campaign,
                    'email_log': email_log,
                    'message_id': raw_msg_id,
                    'in_reply_to': raw_in_reply_to,
                    'references': references_list,
                    'sender_email': sender_email,
                    'sender_name': sender_name,
                    'recipient_email': recipient_email or self.credential.gmail_address,
                    'subject': subject,
                    'body_text': body_text,
                    'body_html': sanitize_html_body(body_html),
                    'raw_headers': raw_headers,
                    'classification': classification,
                    'sentiment': sentiment,
                    'received_at': timezone.now()
                }
            )

            if not created:
                return  # Message was already processed in a previous transaction

            # If matching EmailLog was found, update state & metrics atomically
            if email_log:
                email_log.last_inbound_at = timezone.now()
                
                if classification == 'HUMAN_REPLY':
                    if email_log.reply_status != 'REPLIED':
                        email_log.reply_status = 'REPLIED'
                        if campaign:
                            Campaign.objects.filter(pk=campaign.pk).update(replied_count=models.F('replied_count') + 1)

                elif classification == 'AUTO_REPLY':
                    if email_log.reply_status == 'NO_REPLY':
                        email_log.reply_status = 'AUTO_REPLY'
                        if campaign:
                            Campaign.objects.filter(pk=campaign.pk).update(auto_reply_count=models.F('auto_reply_count') + 1)

                elif classification == 'BOUNCE':
                    bounce_type, status_code = self._parse_bounce_details(body_text, subject)
                    email_log.reply_status = 'BOUNCED'
                    email_log.status = 'FAILED'
                    email_log.error_message = f"Bounced ({bounce_type}): Delivery failed to recipient"
                    if campaign:
                        Campaign.objects.filter(pk=campaign.pk).update(
                            bounced_count=models.F('bounced_count') + 1,
                            failed_count=models.F('failed_count') + 1,
                            successful_count=models.Case(
                                models.When(successful_count__gt=0, then=models.F('successful_count') - 1),
                                default=models.F('successful_count')
                            )
                        )

                    # Create BounceDetail
                    BounceDetail.objects.create(
                        inbound_email=inbound_email,
                        email_log=email_log,
                        bounce_type=bounce_type,
                        smtp_status_code=status_code,
                        diagnostic_code=body_text[:1000]
                    )

                if sentiment == 'UNSUBSCRIBE':
                    email_log.reply_status = 'UNSUBSCRIBED'
                    GlobalSuppressionList.objects.get_or_create(
                        user=self.user,
                        email=sender_email,
                        defaults={'reason': 'Unsubscribed via reply'}
                    )
                    if campaign:
                        Campaign.objects.filter(pk=campaign.pk).update(unsubscribed_count=models.F('unsubscribed_count') + 1)

                email_log.save(update_fields=['reply_status', 'status', 'error_message', 'last_inbound_at'])

            # Log Activity
            ActivityLog.objects.create(
                user=self.user,
                action=f"Inbound email received from {sender_email} ({classification})"
            )
            ActivityLog.objects.create(
                user=self.user,
                action=f"Inbound email received from {sender_email} ({classification})"
            )

    def _parse_address_header(self, header_val):
        if not header_val:
            return "", ""
        match = re.search(r'(.*?)\s*<([^>]+)>', header_val)
        if match:
            return match.group(1).replace('"', '').strip(), match.group(2).strip()
        if '@' in header_val:
            return "", header_val.strip()
        return "", header_val.strip()

    def _extract_body(self, msg):
        body_text = ""
        body_html = ""

        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get('Content-Disposition', ''))

                if 'attachment' in content_disposition:
                    continue

                try:
                    payload = part.get_payload(decode=True)
                    if payload:
                        charset = part.get_content_charset() or 'utf-8'
                        decoded_str = payload.decode(charset, errors='replace')
                        if content_type == 'text/plain' and not body_text:
                            body_text = decoded_str
                        elif content_type == 'text/html' and not body_html:
                            body_html = decoded_str
                except Exception:
                    pass
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                charset = msg.get_content_charset() or 'utf-8'
                decoded_str = payload.decode(charset, errors='replace')
                if msg.get_content_type() == 'text/html':
                    body_html = decoded_str
                else:
                    body_text = decoded_str

        return body_text.strip(), body_html.strip()

    def _classify_message(self, msg, subject, body_text, sender_email):
        subj_lower = subject.lower()
        sender_lower = sender_email.lower()

        # 0. Automated Service & Social Media Notification Detection
        automated_domains = ['facebookmail.com', 'linkedin.com', 'twitter.com', 'github.com', 'notifications.google.com', 'youtube.com', 'instagram.com', 'tiktok.com']
        automated_prefixes = ('no-reply@', 'noreply@', 'notification@', 'notifications@', 'mailer@', 'news@')
        if any(dom in sender_lower for dom in automated_domains) or sender_lower.startswith(automated_prefixes):
            return 'UNKNOWN'

        # 1. Bounce Detection
        bounce_senders = ['mailer-daemon', 'postmaster', 'mail delivery subsystem', 'daemon@']
        if any(b in sender_lower for b in bounce_senders) or 'delivery status notification' in subj_lower or 'undelivered mail' in subj_lower:
            return 'BOUNCE'

        # 2. Auto-Reply / Out of Office Detection
        auto_submitted = msg.get('Auto-Submitted', '').lower()
        x_autoreply = msg.get('X-Autoreply', '').lower()
        precedence = msg.get('Precedence', '').lower()

        if auto_submitted in ['auto-replied', 'auto-generated'] or x_autoreply == 'yes' or precedence in ['bulk', 'junk', 'auto_reply']:
            return 'AUTO_REPLY'

        ooo_keywords = ['out of office', 'automatic reply', 'vacation reply', 'away from my desk', 'auto response']
        if any(kw in subj_lower for kw in ooo_keywords):
            return 'AUTO_REPLY'

        return 'HUMAN_REPLY'

    def _analyze_sentiment(self, body_text, subject, sender_email=''):
        sender_lower = sender_email.lower()
        automated_domains = ['facebookmail.com', 'linkedin.com', 'twitter.com', 'github.com', 'notifications.google.com', 'youtube.com', 'instagram.com', 'tiktok.com']
        automated_prefixes = ('no-reply@', 'noreply@', 'notification@', 'notifications@', 'mailer@', 'news@')
        if any(dom in sender_lower for dom in automated_domains) or sender_lower.startswith(automated_prefixes):
            return 'NEUTRAL'

        text = (body_text + " " + subject).lower()

        if 'calendar.google.com' in text or 'invitation:' in text:
            return 'NEUTRAL'

        # Strip standard boilerplate unsubscribe footer phrases
        footer_phrases = [
            "if you don't want to receive these emails",
            "follow the link below to unsubscribe",
            "click here to unsubscribe",
            "unsubscribe from notifications",
            "please follow the link below to unsubscribe",
            "link below to unsubscribe"
        ]
        clean_text = text
        for phrase in footer_phrases:
            clean_text = clean_text.replace(phrase, "")

        unsubscribe_kw = ['please unsubscribe', 'unsubscribe me', 'remove me', 'stop emailing', 'take me off', 'do not contact']
        if any(kw in clean_text for kw in unsubscribe_kw):
            return 'UNSUBSCRIBE'

        interested_kw = ['interested', 'let\'s talk', 'schedule a call', 'book a demo', 'sounds good', 'send more info', 'pricing']
        if any(kw in text for kw in interested_kw):
            return 'INTERESTED'

        not_interested_kw = ['not interested', 'no thanks', 'pass', 'don\'t need', 'stop']
        if any(kw in text for kw in not_interested_kw):
            return 'NOT_INTERESTED'

        question_kw = ['how much', 'what is', 'can you', 'where', 'when']
        if any(kw in text for kw in question_kw):
            return 'QUESTION'

        return 'NEUTRAL'

    def _find_matching_email_log(self, in_reply_to, references, custom_header, sender_email, user, body_text='', is_bounce=False):
        # Tier 0: For BOUNCE emails, extract failed recipient email address from body
        if is_bounce and body_text:
            extracted_emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', body_text)
            user_email = user.email.lower() if (user and user.email) else ''
            for target_email in extracted_emails:
                t_lower = target_email.lower()
                if t_lower != user_email and not any(b in t_lower for b in ['daemon', 'postmaster', 'googlemail', 'gmail.com', 'hostinger']):
                    log = EmailLog.objects.filter(user=user, recipient__iexact=t_lower).order_by('-sent_at').first()
                    if log:
                        return log

        # Tier 1: Match exact In-Reply-To
        if in_reply_to:
            log = EmailLog.objects.filter(user=user, message_id=in_reply_to).first()
            if log:
                return log

        # Tier 2: Match any ID in References
        if references:
            log = EmailLog.objects.filter(user=user, message_id__in=references).first()
            if log:
                return log

        # Tier 3: Match custom RFC header
        if custom_header:
            log = EmailLog.objects.filter(user=user, id=custom_header).first()
            if log:
                return log

        # Tier 4: Fallback to matching recipient email address on most recent email log
        if sender_email:
            log = EmailLog.objects.filter(user=user, recipient__iexact=sender_email).order_by('-sent_at').first()
            if log:
                return log

        return None

    def _parse_bounce_details(self, body_text, subject):
        text = body_text.lower()
        if '550' in text or 'user unknown' in text or 'no such user' in text or 'mailbox not found' in text:
            return 'HARD_BOUNCE', '550'
        if '554' in text or 'spam' in text or 'rejected' in text or 'blocked' in text:
            return 'BLOCKED', '554'
        if '450' in text or '451' in text or 'mailbox full' in text or 'try again later' in text:
            return 'SOFT_BOUNCE', '450'
        return 'UNKNOWN', ''
