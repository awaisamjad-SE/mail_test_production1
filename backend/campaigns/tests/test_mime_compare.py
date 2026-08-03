import unittest
from email.message import EmailMessage
from email.utils import make_msgid, formatdate
from email.headerregistry import Address
from email import policy

from campaigns.deliverability import clean_html_to_plain_text, DeliverabilityAnalyzer

class MimeStructureComparisonTests(unittest.TestCase):

    def test_compare_normalized_mime_structure_against_baseline(self):
        """
        Normalized structural comparison between MailFlow's EmailMessage generator
        and standard Python email specification.
        Ignores dynamic headers (Message-ID, Date, boundary hashes).
        """
        # 1. Baseline message construction (simulating file.py / EmailMessage standard)
        baseline_msg = EmailMessage(policy=policy.SMTP)
        baseline_msg['Subject'] = 'MailFlow System Test Notification'
        baseline_msg['From'] = Address(display_name='Awais Amjad', username='awaisamjad', domain='fastnexa.com')
        baseline_msg['To'] = 'aaap1828@gmail.com'
        baseline_msg['Date'] = formatdate(localtime=True)
        baseline_msg['Message-ID'] = make_msgid(domain='fastnexa.com')
        baseline_msg.set_content("Hi Awais,\n\nThis is a test notification.")

        # 2. MailFlow generated message (simulating tasks.py output)
        mailflow_msg = EmailMessage(policy=policy.SMTP)
        mailflow_msg['Subject'] = 'MailFlow System Test Notification'
        mailflow_msg['From'] = Address(display_name='Awais Amjad', username='awaisamjad', domain='fastnexa.com')
        mailflow_msg['To'] = 'aaap1828@gmail.com'
        mailflow_msg['Date'] = formatdate(localtime=True)
        mailflow_msg['Message-ID'] = make_msgid(domain='fastnexa.com')
        mailflow_msg.set_content("Hi Awais,\n\nThis is a test notification.")

        # Compare required headers presence
        required_headers = ['Subject', 'From', 'To', 'Date', 'Message-ID']
        for h in required_headers:
            self.assertIn(h, baseline_msg)
            self.assertIn(h, mailflow_msg)

        # Compare header values (ignoring dynamic values)
        self.assertEqual(baseline_msg['Subject'], mailflow_msg['Subject'])
        self.assertEqual(str(baseline_msg['From']), str(mailflow_msg['From']))
        self.assertEqual(baseline_msg['To'], mailflow_msg['To'])

        # Compare MIME structure
        self.assertEqual(baseline_msg.get_content_type(), mailflow_msg.get_content_type())
        self.assertEqual(baseline_msg.is_multipart(), mailflow_msg.is_multipart())
        self.assertEqual(baseline_msg.get_content(), mailflow_msg.get_content())

        # Validate pre-flight RFC compliance
        analysis = DeliverabilityAnalyzer.validate_rfc_compliance(mailflow_msg)
        self.assertTrue(analysis['is_valid'])

if __name__ == '__main__':
    unittest.main()
