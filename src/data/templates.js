export const emailTemplates = [
  {
    id: 'interview_update',
    name: 'Interview Update',
    icon: '🎉',
    category: 'Recruiting',
    description: 'Corporate recruitment notification with next-step instructions and themed details.',
    subject: 'Interview Update: Proceeding to the next stage, {{Name}}',
    defaultHeadline: 'Congratulations, {{Name}}! 🎉',
    defaultBody: 'Thank you for participating in our interview process.\n\nWe are pleased to inform you that you have been selected to proceed to the next round of interviews.\n\nOur team was impressed with your qualifications, experience, and overall performance. We look forward to learning more about you in the upcoming stage of the hiring process.',
    layoutType: 'interview',
    defaultButtonText: 'Schedule Next Round',
    defaultButtonUrl: 'https://calendly.com/company/interview',
    hasButton: true,
    defaultHeaderColor: '#2563eb', // Royal Blue
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'welcome',
    name: 'Welcome Onboarding',
    icon: '👋',
    category: 'Onboarding',
    description: 'Corporate client welcoming letter with step-by-step points and a dashboard button.',
    subject: 'Welcome aboard to MailFlow, {{Name}}! 🎉',
    defaultHeadline: 'We are thrilled to welcome you, {{Name}}! 👋',
    defaultBody: 'Your company profile has been created successfully, and your environment is fully provisioned.\n\nHere are the first three things you should do to get started:\n\n1. Configure your custom SMTP domain credentials in settings.\n2. Upload your recipient dataset in CSV format.\n3. Draft your first personalized template and trigger a test launch.',
    layoutType: 'announcement',
    defaultButtonText: 'Access Dashboard',
    defaultButtonUrl: 'https://mail.awaisamjad.engineer/dashboard',
    hasButton: true,
    defaultHeaderColor: '#06b6d4', // Cyan Accent
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'meeting',
    name: 'Meeting Invitation',
    icon: '📅',
    category: 'Scheduling',
    description: 'Calendar sync card designed for client consults or department briefings.',
    subject: 'Meeting Invitation: Project sync request for {{Name}}',
    defaultHeadline: 'Let\'s connect to sync up, {{Name}}! 📅',
    defaultBody: 'I would like to schedule a brief call this week to review our project progress and outline the timeline milestones.\n\nPlease select a convenient slot from our calendar planner or reply with your preferred times.',
    layoutType: 'meeting',
    defaultButtonText: 'Choose Slot',
    defaultButtonUrl: 'https://calendly.com/company/sync',
    hasButton: true,
    defaultHeaderColor: '#16a34a', // Emerald Green
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'product_launch',
    name: 'Product Launch',
    icon: '🚀',
    category: 'Marketing',
    description: 'Marketing announcement detailing new software features and enhancements.',
    subject: 'New release is live: Explore MailFlow v3.1, {{Name}}!',
    defaultHeadline: 'Vite‑powered MailFlow v3.1 is here! 🚀',
    defaultBody: 'We have updated our core engine with massive performance optimizations and features:\n\n• High-fidelity responsive mobile previews.\n• Automatic inline CSV spreadsheet dataset editors.\n• Direct warning indicators detailing email delivery issues.\n\nRead our launch logs or start broadcasting directly.',
    layoutType: 'announcement',
    defaultButtonText: 'See Release Notes',
    defaultButtonUrl: 'https://github.com/company/releases',
    hasButton: true,
    defaultHeaderColor: '#7c3aed', // Purple Accent
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'invoice',
    name: 'Invoice Receipt',
    icon: '💳',
    category: 'Billing',
    description: 'Clean invoice layout with table summary for enterprise payments.',
    subject: 'Invoice Paid: Receipt #MF-9841 for {{Name}}',
    defaultHeadline: 'Payment Received — Thank you, {{Name}}! 💳',
    defaultBody: 'Your monthly enterprise subscription payment has been processed successfully. Your account is active and in good standing.\n\nA breakdown of this transaction is listed in the details section below.',
    layoutType: 'invoice',
    defaultButtonText: 'Download Invoice PDF',
    defaultButtonUrl: 'https://billing.company.com/receipts',
    hasButton: true,
    defaultHeaderColor: '#1e293b', // Charcoal Dark
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'security_alert',
    name: 'Security Notice',
    icon: '🔒',
    category: 'Security',
    description: 'Alert informing users of suspicious activity or password reset triggers.',
    subject: 'Security Notice: Account password change, {{Name}}',
    defaultHeadline: 'Important Security Alert, {{Name}} 🔒',
    defaultBody: 'Our security firewalls detected a password modification request for your account.\n\nIf you initiated this change, no action is required. If this was not you, please secure your profile immediately.',
    layoutType: 'warning',
    defaultButtonText: 'Reset Password Now',
    defaultButtonUrl: 'https://company.com/auth/reset',
    hasButton: true,
    defaultHeaderColor: '#ea580c', // Orange Accent
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'survey',
    name: 'Feedback Survey',
    icon: '⭐',
    category: 'Success',
    description: 'Customer success template with interactive survey rating links.',
    subject: 'Feedback Request: How is MailFlow working for you, {{Name}}?',
    defaultHeadline: 'We value your opinion, {{Name}}! ⭐',
    defaultBody: 'Thank you for choosing our platform. We are committed to delivering the best experience.\n\nPlease take 1 minute to rate our support and let us know if there is anything we can do better.',
    layoutType: 'survey',
    defaultButtonText: 'Submit Feedback Form',
    defaultButtonUrl: 'https://survey.company.com/feedback',
    hasButton: true,
    defaultHeaderColor: '#7c3aed', // Purple Accent
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'thankyou',
    name: 'Appreciation Thank You',
    icon: '🙏',
    category: 'Success',
    description: 'High-end corporate card to express gratitude to long-term partners.',
    subject: 'Thank You: Sincere appreciation from our CEO, {{Name}}',
    defaultHeadline: 'A heartfelt thank you, {{Name}}! 🙏',
    defaultBody: 'We wanted to take a moment to express our sincere appreciation for your partnership and trust in our company.\n\nOur client success team is always here to support your growth. We look forward to continuing our journey together.',
    layoutType: 'standard',
    defaultButtonText: 'Schedule QBR Review',
    defaultButtonUrl: 'https://company.com/success',
    hasButton: true,
    defaultHeaderColor: '#06b6d4', // Cyan Accent
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'webinar_invite',
    name: 'Webinar Invitation',
    icon: '🎟️',
    category: 'Marketing',
    description: 'RSVP flyer for company-sponsored webinar panels and masterclasses.',
    subject: 'RSVP Invitation: Live tech masterclass, {{Name}} 🎟️',
    defaultHeadline: 'Reserve your virtual seat, {{Name}}! 🎟️',
    defaultBody: 'We are hosting a live roundtable discussing advanced email server deliverability, reputation warming, and domain alignments.\n\nDate: Thursday, June 18th\nTime: 10:00 AM EST\nSpeaker: Lead Deliverability Engineer',
    layoutType: 'announcement',
    defaultButtonText: 'Register Free Now',
    defaultButtonUrl: 'https://webinar.company.com/register',
    hasButton: true,
    defaultHeaderColor: '#2563eb', // Royal Blue
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'maintenance',
    name: 'System Maintenance',
    icon: '⚙️',
    category: 'Operations',
    description: 'Engineering notice regarding scheduled downtime or service intervals.',
    subject: 'Scheduled Maintenance Notice: Downtime alert, {{Name}}',
    defaultHeadline: 'Scheduled System Maintenance Notice ⚙️',
    defaultBody: 'Our database engineers will perform scheduled upgrades to the API server pools next Sunday to increase processing speed.\n\nDowntime Window: Sunday, June 14th (02:00 AM - 04:00 AM UTC).\n\nDuring this window, campaigns might face minor execution latency.',
    layoutType: 'warning',
    defaultButtonText: 'Check Ops Status',
    defaultButtonUrl: 'https://status.company.com',
    hasButton: true,
    defaultHeaderColor: '#1e293b', // Charcoal Dark
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'referral',
    name: 'Hiring Referral',
    icon: '👥',
    category: 'Recruiting',
    description: 'Internal company memo calling for employee referrals for open job positions.',
    subject: 'Referral Request: We are growing our teams, {{Name}}!',
    defaultHeadline: 'Know someone who fits our team, {{Name}}? 👥',
    defaultBody: 'We are actively expanding our software architecture and product design departments.\n\nRefer your colleagues or friends for senior roles and earn our standard employee referral bonus. Explore our active careers listings page.',
    layoutType: 'interview',
    defaultButtonText: 'View Open Roles',
    defaultButtonUrl: 'https://company.com/careers',
    hasButton: true,
    defaultHeaderColor: '#16a34a', // Emerald Green
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'newsletter',
    name: 'Corporate Newsletter',
    icon: '📰',
    category: 'Marketing',
    description: 'Structured newsletter digest layout for department updates or client digests.',
    subject: 'The Company Digest: Top headlines inside, {{Name}} 📬',
    defaultHeadline: 'Your Monthly Company Digest, {{Name}} 📰',
    defaultBody: 'Here is your monthly summary of top stories, features, and engineering tips:\n\n• Advanced DKIM alignment guides.\n• Dynamic client-side transformations.\n• Multi-node background workers.\n\nClick below to read the detailed blog posts.',
    layoutType: 'announcement',
    defaultButtonText: 'Read Corporate Blog',
    defaultButtonUrl: 'https://blog.company.com',
    hasButton: true,
    defaultHeaderColor: '#7c3aed', // Purple Accent
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'renewal',
    name: 'Subscription Renewal',
    icon: '🔄',
    category: 'Billing',
    description: 'Renewal notification for expiring corporate contracts or plans.',
    subject: 'Renewal Notice: Action required for plan expiry, {{Name}}',
    defaultHeadline: 'Your subscription is expiring soon, {{Name}}! 🔄',
    defaultBody: 'This is a friendly reminder that your enterprise subscription is scheduled to expire in 5 days.\n\nKeep your server active and prevent pacing delays by renewing your plan today.',
    layoutType: 'warning',
    defaultButtonText: 'Renew Subscription',
    defaultButtonUrl: 'https://billing.company.com/renew',
    hasButton: true,
    defaultHeaderColor: '#ea580c', // Orange Accent
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'support_reply',
    name: 'Support Response',
    icon: '💬',
    category: 'Operations',
    description: 'Customer care ticket update response with corporate styling.',
    subject: 'Support Ticket #MF-7429 Update: Responding to {{Name}}',
    defaultHeadline: 'Your support ticket has been updated, {{Name}}! 💬',
    defaultBody: 'Our engineering operations team has reviewed the connection errors you faced.\n\nWe have successfully adjusted your domain throttle policies to prevent Gmail rate limiting. Your services are now fully operational.',
    layoutType: 'standard',
    defaultButtonText: 'View Helpdesk Ticket',
    defaultButtonUrl: 'https://support.company.com/tickets/7429',
    hasButton: true,
    defaultHeaderColor: '#2563eb', // Royal Blue
    defaultBgColor: '#f4f6f9'
  },
  {
    id: 'hiring_offer',
    name: 'Hiring Offer Letter',
    icon: '💼',
    category: 'Recruiting',
    description: 'Official employment job offer layout with customized terms links.',
    subject: 'Employment Offer: Joining our teams, {{Name}}! 💼',
    defaultHeadline: 'Welcome to the team, {{Name}}! 💼',
    defaultBody: 'We are absolutely delighted to offer you a position on our software engineering team.\n\nWe were highly impressed by your technical depth and alignment with our culture. Please review the official offer terms and benefits link below.',
    layoutType: 'interview',
    defaultButtonText: 'View Employment Offer',
    defaultButtonUrl: 'https://hr.company.com/offers/accept',
    hasButton: true,
    defaultHeaderColor: '#16a34a', // Emerald Green
    defaultBgColor: '#f4f6f9'
  }
];

export function buildCorporateHTML({
  name,
  headline,
  bodyText,
  headerBg = '#2563eb',
  outerBg = '#f4f6f9',
  showButton = true,
  buttonText = 'View Details',
  buttonUrl = 'https://example.com',
  layoutType = 'standard'
}) {
  // Convert bodyText paragraphs (separated by newlines) into HTML paragraphs
  const paragraphs = bodyText
    .split('\n')
    .filter(p => p.trim() !== '')
    .map(p => `<p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">${p}</p>`)
    .join('');

  // Determine header text color (white for colored background, dark for white background)
  const headerTextColor = headerBg === '#ffffff' ? '#0f172a' : '#ffffff';
  const headerBorder = headerBg === '#ffffff' ? 'border-bottom: 1px solid #e2e8f0;' : '';

  // Determine button background color
  const btnColor = headerBg === '#ffffff' ? '#2563eb' : headerBg;
  const buttonHTML = showButton ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
      <tr>
        <td align="center">
          <a href="${buttonUrl}" target="_blank" style="background-color:${btnColor};color:#ffffff;padding:12px 28px;text-decoration:none;font-weight:bold;font-size:15px;border-radius:6px;display:inline-block;box-shadow:0 3px 6px rgba(0,0,0,0.1);font-family:Arial,Helvetica,sans-serif;">
            ${buttonText}
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  // Layout-specific visual elements
  let layoutSectionHTML = '';
  if (layoutType === 'interview') {
    layoutSectionHTML = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-left:4px solid ${btnColor};margin:25px 0;">
        <tr>
          <td style="padding:20px;font-family:Arial,Helvetica,sans-serif;">
            <strong style="font-size:16px;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">Next Step</strong>
            <p style="margin:10px 0 0 0;color:#475569;font-size:14px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
              Our recruiting team will contact you shortly with details regarding scheduling and interview requirements.
            </p>
          </td>
        </tr>
      </table>
    `;
  } else if (layoutType === 'meeting') {
    layoutSectionHTML = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px dashed #bbf7d0;border-radius:8px;margin:25px 0;">
        <tr>
          <td style="padding:18px;font-family:Arial,Helvetica,sans-serif;color:#166534;">
            <strong style="font-size:15px;font-family:Arial,Helvetica,sans-serif;">📅 Meeting Details:</strong>
            <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
              <strong>Date:</strong> Schedule selected slot<br/>
              <strong>Platform:</strong> Google Meet / Zoom link will be auto-generated
            </p>
          </td>
        </tr>
      </table>
    `;
  } else if (layoutType === 'invoice') {
    layoutSectionHTML = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0;border-radius:8px;margin:25px 0;font-size:13px;font-family:Arial,Helvetica,sans-serif;">
        <tr bgcolor="#f8fafc" style="font-weight:bold;color:#0f172a;">
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">Item Description</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">Amount</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569;">Enterprise SaaS Subscription</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#0f172a;font-weight:600;">$99.00</td>
        </tr>
        <tr style="font-weight:bold;color:#0f172a;font-size:14px;">
          <td style="padding:12px;text-align:right;">Total Paid:</td>
          <td style="padding:12px;text-align:right;color:${btnColor};">$99.00</td>
        </tr>
      </table>
    `;
  } else if (layoutType === 'warning') {
    layoutSectionHTML = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef2f2;border-left:4px solid #ef4444;margin:25px 0;">
        <tr>
          <td style="padding:16px;font-family:Arial,Helvetica,sans-serif;">
            <strong style="font-size:15px;color:#991b1b;font-family:Arial,Helvetica,sans-serif;">⚠️ Important Notification</strong>
            <p style="margin:6px 0 0 0;color:#b91c1c;font-size:13px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
              Please review these details and update your settings to prevent delivery failures or throttling policies.
            </p>
          </td>
        </tr>
      </table>
    `;
  } else if (layoutType === 'survey') {
    layoutSectionHTML = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:25px 0;text-align:center;">
        <tr>
          <td align="center">
            <span style="font-size:13px;color:#475569;font-weight:600;display:block;margin-bottom:12px;font-family:Arial,Helvetica,sans-serif;">How satisfied are you with our service?</span>
            <table cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td style="padding:0 5px;"><a href="${buttonUrl}?rating=1" style="display:inline-block;width:34px;height:34px;line-height:34px;background:#f1f5f9;color:#334155;text-decoration:none;font-weight:bold;border-radius:50%;font-size:14px;font-family:Arial,Helvetica,sans-serif;">1</a></td>
                <td style="padding:0 5px;"><a href="${buttonUrl}?rating=2" style="display:inline-block;width:34px;height:34px;line-height:34px;background:#f1f5f9;color:#334155;text-decoration:none;font-weight:bold;border-radius:50%;font-size:14px;font-family:Arial,Helvetica,sans-serif;">2</a></td>
                <td style="padding:0 5px;"><a href="${buttonUrl}?rating=3" style="display:inline-block;width:34px;height:34px;line-height:34px;background:#f1f5f9;color:#334155;text-decoration:none;font-weight:bold;border-radius:50%;font-size:14px;font-family:Arial,Helvetica,sans-serif;">3</a></td>
                <td style="padding:0 5px;"><a href="${buttonUrl}?rating=4" style="display:inline-block;width:34px;height:34px;line-height:34px;background:#f1f5f9;color:#334155;text-decoration:none;font-weight:bold;border-radius:50%;font-size:14px;font-family:Arial,Helvetica,sans-serif;">4</a></td>
                <td style="padding:0 5px;"><a href="${buttonUrl}?rating=5" style="display:inline-block;width:34px;height:34px;line-height:34px;background:${btnColor};color:#ffffff;text-decoration:none;font-weight:bold;border-radius:50%;font-size:14px;font-family:Arial,Helvetica,sans-serif;">5</a></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name}</title>
</head>
<body style="margin:0;padding:0;background-color:${outerBg};font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${outerBg}">
    <tr>
        <td align="center" style="padding:40px 20px;">

            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">

                <!-- Header -->
                <tr>
                    <td align="center" bgcolor="${headerBg}" style="padding:32px 30px;${headerBorder}">
                        <h1 style="margin:0;color:${headerTextColor};font-size:24px;font-weight:bold;letter-spacing:-0.5px;font-family:Arial,Helvetica,sans-serif;">
                            ${name}
                        </h1>
                    </td>
                </tr>

                <!-- Content -->
                <tr>
                    <td style="padding:40px 35px;color:#334155;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">

                        <h2 style="margin-top:0;color:#0f172a;font-size:20px;font-weight:700;font-family:Arial,Helvetica,sans-serif;margin-bottom:18px;">
                            ${headline}
                        </h2>

                        ${paragraphs}

                        ${layoutSectionHTML}

                        ${buttonHTML}

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td bgcolor="#f8fafc" align="center" style="padding:22px;color:#64748b;font-size:12px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #f1f5f9;">
                        This is an automated operational notification regarding your application status.
                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>`;
}
