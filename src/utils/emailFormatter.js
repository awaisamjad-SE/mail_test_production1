/**
 * Email body formatter — converts plain text to styled HTML emails
 * and provides a visual builder for custom HTML emails
 */

export const isHtml = (text) => /<[a-z][\s\S]*>/i.test(text || '');

/**
 * Auto-convert plain text to a clean styled HTML email
 */
export const plainTextToHtml = (text) => {
  if (!text) return '';
  if (isHtml(text)) return text;

  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Split into paragraphs on double newlines, single newlines become <br>
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map(para => {
      const lines = para.split('\n').join('<br>');
      return `<p style="margin:0 0 18px 0;line-height:1.75;">${lines}</p>`;
    })
    .join('');

  return wrapInEmailShell(paragraphs);
};

/**
 * Wrap body content in a clean, responsive HTML email shell
 */
const wrapInEmailShell = (bodyContent, options = {}) => {
  const {
    headerBg = '#2563eb',
    headerTitle = '',
    headerSubtitle = '',
    buttonText = '',
    buttonUrl = '#',
    buttonBg = '#2563eb',
    footerText = 'Sent via MailFlow',
  } = options;

  const headerHtml = headerTitle ? `
    <tr>
      <td align="center" bgcolor="${headerBg}" style="padding:30px;">
        <h1 style="margin:0;color:#ffffff;font-size:28px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;">${headerTitle}</h1>
        ${headerSubtitle ? `<p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:15px;font-family:Arial,Helvetica,sans-serif;">${headerSubtitle}</p>` : ''}
      </td>
    </tr>` : '';

  const buttonHtml = buttonText ? `
    <tr>
      <td align="center" style="padding:0 35px 30px;">
        <a href="${buttonUrl}" style="display:inline-block;padding:12px 30px;background:${buttonBg};color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;font-family:Arial,Helvetica,sans-serif;">${buttonText}</a>
      </td>
    </tr>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Email Update</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f6f9" style="padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        ${headerHtml}
        <tr>
          <td style="padding:40px 35px;color:#333333;font-size:15px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
            ${bodyContent}
          </td>
        </tr>
        ${buttonHtml}
        <tr>
          <td bgcolor="#f9fafb" align="center" style="padding:20px;color:#6b7280;font-size:12px;font-family:Arial,Helvetica,sans-serif;">
            ${footerText}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

/**
 * Build a full visual HTML email from the visual builder state
 */
export const buildVisualEmail = (state) => {
  const {
    headerBg = '#7c3aed',
    headerTitle = '',
    headerSubtitle = '',
    bodyText = '',
    buttonText = '',
    buttonUrl = '#',
    buttonBg = '#7c3aed',
    footerText = 'Sent via MailFlow',
  } = state;

  let bodyContent;
  if (isHtml(bodyText)) {
    bodyContent = bodyText;
  } else {
    const escaped = (bodyText || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    bodyContent = escaped
      .split(/\n{2,}/)
      .map(para => `<p style="margin:0 0 18px 0;line-height:1.75;">${para.split('\n').join('<br>')}</p>`)
      .join('');
  }

  return wrapInEmailShell(bodyContent, {
    headerBg,
    headerTitle,
    headerSubtitle,
    buttonText,
    buttonUrl,
    buttonBg,
    footerText,
  });
};

/**
 * Prepare body for actual sending — always returns HTML
 */
export const prepareBodyForSend = (body) => {
  if (!body) return '';
  return isHtml(body) ? body : plainTextToHtml(body);
};
