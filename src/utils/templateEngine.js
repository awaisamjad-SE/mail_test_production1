export const interpolate = (template, variables) => {
  if (!template) return '';
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    const value = variables[trimmedKey] || variables[trimmedKey.toLowerCase()] || '';
    return value || match;
  });
};

export const getPlaceholders = (template) => {
  if (!template) return [];
  const matches = template.match(/\{\{\s*([^}]+)\s*\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/[{}\s]/g, '')))];
};

export const buildEmailPayload = (row, subject, body, replyTo = '') => {
  const vars = {
    Name: row.name || '',
    name: row.name || '',
    Email: row.email || '',
    email: row.email || '',
    ...row.raw,
  };

  return {
    to: row.email,
    subject: interpolate(subject, vars),
    body: interpolate(body, vars),
    reply_to: replyTo,
  };
};
