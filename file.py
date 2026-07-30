import smtplib
from email.mime.text import MIMEText

SMTP_SERVER = "mail.fastnexa.com"
SMTP_PORT = 465

USERNAME = "awaisamjad@fastnexa.com"
PASSWORD = "Qwerty@12345"

msg = MIMEText("Hello from SMTP")
msg["Subject"] = "Test Email"
msg["From"] = USERNAME
msg["To"] = "aaap1828@gmail.com"

with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
    server.login(USERNAME, PASSWORD)
    server.send_message(msg)

print("Email sent!")