import Papa from 'papaparse';

const normalizeHeader = (header) => header.trim().toLowerCase().replace(/[\s_-]+/g, '');

const COLUMN_MAP = {
  email: ['email', 'emailaddress', 'emailid', 'mail', 'e-mail'],
  name: ['name', 'fullname', 'firstname', 'first_name', 'recipientname', 'recipient'],
  subject: ['subject', 'emailsubject', 'sub', 'title'],
  body: ['body', 'message', 'emailbody', 'content', 'text', 'bodymessage'],
  replyTo: ['replyto', 'reply_to', 'reply'],
};

const findColumn = (headers, targetAliases) => {
  for (const alias of targetAliases) {
    const found = headers.find(h => normalizeHeader(h) === alias);
    if (found) return found;
  }
  return null;
};

export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          const criticalErrors = results.errors.filter(e => e.type === 'FieldMismatch' || e.type === 'Quotes');
          if (criticalErrors.length > 0) {
            reject(new Error(`CSV parsing errors: ${criticalErrors.map(e => e.message).join(', ')}`));
            return;
          }
        }

        const headers = results.meta.fields || [];
        const columnMapping = {
          email: findColumn(headers, COLUMN_MAP.email),
          name: findColumn(headers, COLUMN_MAP.name),
          subject: findColumn(headers, COLUMN_MAP.subject),
          body: findColumn(headers, COLUMN_MAP.body),
          replyTo: findColumn(headers, COLUMN_MAP.replyTo),
        };

        if (!columnMapping.email) {
          reject(new Error('CSV must contain an "Email" column. Found columns: ' + headers.join(', ')));
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const rows = results.data
          .map((row, index) => {
            const email = row[columnMapping.email]?.trim() || '';
            return {
              index: index + 1,
              email,
              name: columnMapping.name ? (row[columnMapping.name]?.trim() || '') : '',
              subject: columnMapping.subject ? (row[columnMapping.subject]?.trim() || '') : '',
              body: columnMapping.body ? (row[columnMapping.body]?.trim() || '') : '',
              replyTo: columnMapping.replyTo ? (row[columnMapping.replyTo]?.trim() || '') : '',
              valid: emailRegex.test(email),
              raw: row,
            };
          })
          .filter(row => row.email !== '');

        const validRows = rows.filter(r => r.valid);
        const invalidRows = rows.filter(r => !r.valid);

        resolve({
          rows,
          validRows,
          invalidRows,
          headers,
          columnMapping,
          totalCount: rows.length,
          validCount: validRows.length,
          invalidCount: invalidRows.length,
          hasName: !!columnMapping.name,
          hasSubject: !!columnMapping.subject,
          hasBody: !!columnMapping.body,
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
};

export const generateSampleCSV = (type) => {
  const samples = {
    bulk: 'Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com\nBob Wilson,bob@example.com',
    personalized: 'Name,Email,Subject,Body\nJohn Doe,john@example.com,Meeting Tomorrow,Hi John! Just a reminder about our meeting.\nJane Smith,jane@example.com,Project Update,Hi Jane! Here is the project update.',
    emailOnly: 'Email\njohn@example.com\njane@example.com\nbob@example.com',
  };
  return samples[type] || samples.bulk;
};
