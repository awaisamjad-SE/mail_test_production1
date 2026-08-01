import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = "mail.fastnexa.com"
SMTP_PORT = 465

USERNAME = "awaisamjad@fastnexa.com"
PASSWORD = os.getenv("SMTP_PASSWORD", "")

msg = MIMEMultipart()
msg["Subject"] = "MailFlow System Test Notification"
msg["From"] = f"Awais Amjad <{USERNAME}>"
msg["To"] = "aaap1828@gmail.com"

body_text = """Hi Awais,

This is a test notification sent from the MailFlow application to verify outbound email delivery.

Best regards,
Awais Amjad
FastNexa Team
"""

msg.attach(MIMEText(body_text, "plain", "utf-8"))

try:
    print(f"Connecting to {SMTP_SERVER}:{SMTP_PORT} via SSL...")
    with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=15) as server:
        print("Logging in...")
        server.login(USERNAME, PASSWORD)
        print("Sending email message...")
        server.send_message(msg)
    print("Email sent successfully!")
except Exception as e:
    print("Error:", e)