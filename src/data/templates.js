export const emailTemplates = [
  {
    id: 'interview_update',
    name: 'Interview Update (HTML)',
    icon: '🎉',
    category: 'Recruiting',
    description: 'Beautiful selection response email with structured details and corporate blue styling.',
    subject: 'Interview Update: Proceeding to next round, {{Name}}',
    body: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Interview Update</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f6f9">
    <tr>
        <td align="center" style="padding:40px 20px;">

            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                    <td align="center" bgcolor="#2563eb" style="padding:30px;">
                        <h1 style="margin:0;color:#ffffff;font-size:28px;font-family:Arial,Helvetica,sans-serif;">
                            Interview Update
                        </h1>
                    </td>
                </tr>

                <!-- Content -->
                <tr>
                    <td style="padding:40px 35px;color:#333333;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">

                        <h2 style="margin-top:0;color:#111827;font-family:Arial,Helvetica,sans-serif;">
                            Congratulations, {{Name}}! 🎉
                        </h2>

                        <p>
                            Thank you for participating in our interview process.
                        </p>

                        <p>
                            We are pleased to inform you that you have been selected to proceed to the next round of interviews.
                        </p>

                        <p>
                            Our team was impressed with your qualifications, experience, and overall performance. We look forward to learning more about you in the upcoming stage of the hiring process.
                        </p>

                        <!-- Next Step Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-left:4px solid #2563eb;margin:25px 0;">
                            <tr>
                                <td style="padding:20px;font-family:Arial,Helvetica,sans-serif;">
                                    <strong style="font-size:16px;color:#111827;">
                                        Next Step
                                    </strong>
                                    <p style="margin:10px 0 0 0;color:#4b5563;">
                                        Our recruiting team will contact you shortly with details regarding scheduling and interview requirements.
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <p>
                            Congratulations on advancing to the next stage. We wish you continued success and look forward to speaking with you again.
                        </p>

                        <p style="margin-top:30px;">
                            Best regards,<br>
                            <strong>Hiring Team</strong>
                        </p>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td bgcolor="#f9fafb" align="center" style="padding:20px;color:#6b7280;font-size:12px;font-family:Arial,Helvetica,sans-serif;">
                        This is an automated notification regarding your application status.
                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>`
  },
  {
    id: 'welcome',
    name: 'Welcome Email',
    icon: '👋',
    category: 'Onboarding',
    description: 'Welcome new users, clients, or team members with a warm introduction.',
    subject: 'Welcome aboard, {{Name}}! 🎉',
    body: `Hi {{Name}},\n\nWelcome! We're thrilled to have you with us.\n\nHere's what you can expect:\n• A dedicated team ready to support you\n• Resources to help you get started\n• Regular updates on what's new\n\nIf you have any questions, don't hesitate to reach out. We're here to help!\n\nBest regards,\nThe Team`,
  },
  {
    id: 'followup',
    name: 'Follow-Up',
    icon: '🔄',
    category: 'Sales',
    description: 'Professional follow-up after a meeting, call, or initial contact.',
    subject: 'Great connecting with you, {{Name}}!',
    body: `Hi {{Name}},\n\nThank you for taking the time to connect. I really enjoyed our conversation and wanted to follow up on the points we discussed.\n\nAs mentioned, I'd love to explore how we can work together. Here are the next steps:\n\n1. Review the attached materials\n2. Schedule a follow-up call\n3. Share any questions or feedback\n\nLooking forward to hearing from you!\n\nBest regards`,
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    icon: '📰',
    category: 'Marketing',
    description: 'Monthly or weekly newsletter to keep your audience engaged.',
    subject: 'Your Weekly Update is Here! 📬',
    body: `Hi {{Name}},\n\nHere's what's new this week:\n\n📌 HIGHLIGHTS\n• Feature update: We've launched exciting new capabilities\n• Community spotlight: Amazing work from our users\n• Upcoming event: Don't miss our webinar next Tuesday\n\n💡 TIP OF THE WEEK\nDid you know you can customize your dashboard? Check out our guide for more details.\n\nThanks for being part of our community!\n\nCheers,\nThe Newsletter Team`,
  },
  {
    id: 'meeting',
    name: 'Meeting Request',
    icon: '📅',
    category: 'Business',
    description: 'Request a meeting with a professional, courteous tone.',
    subject: 'Meeting Request: Let\'s Connect, {{Name}}',
    body: `Hi {{Name}},\n\nI hope this message finds you well. I'd like to schedule a brief meeting to discuss a few important topics.\n\nProposed Details:\n• Duration: 30 minutes\n• Format: Video call or in-person\n• Suggested times: This week, flexible\n\nPlease let me know your availability, and I'll send over a calendar invite.\n\nLooking forward to connecting!\n\nBest regards`,
  },
  {
    id: 'thankyou',
    name: 'Thank You',
    icon: '🙏',
    category: 'Appreciation',
    description: 'Express gratitude to clients, partners, or team members.',
    subject: 'Thank You, {{Name}}! 🌟',
    body: `Dear {{Name}},\n\nI wanted to take a moment to express my sincere gratitude. Your support and collaboration have been invaluable.\n\nYour contributions have made a real difference, and I truly appreciate everything you've done.\n\nPlease don't hesitate to reach out if there's ever anything I can do for you in return.\n\nWith warm regards`,
  },
  {
    id: 'announcement',
    name: 'Announcement',
    icon: '📢',
    category: 'Updates',
    description: 'Make important announcements to your audience or team.',
    subject: 'Important Update: {{Name}}, Please Read',
    body: `Hi {{Name}},\n\nWe have an important announcement to share with you.\n\n🔔 WHAT'S CHANGING\nWe're excited to announce some significant improvements that will enhance your experience.\n\n📋 KEY DETAILS\n• Effective date: Starting next week\n• What to expect: Improved performance and new features\n• Action required: No action needed on your end\n\n❓ QUESTIONS?\nOur team is here to help. Reply to this email or visit our help center.\n\nThank you for your continued trust!\n\nBest regards,\nThe Team`,
  },
];
