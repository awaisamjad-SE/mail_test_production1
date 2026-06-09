import { useState } from 'react';
import { Send, Users, Loader2, ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from 'lucide-react';
import CSVUploader from './CSVUploader';
import EmailPreview from './EmailPreview';
import StatusToast from './StatusToast';
import BodyEditor from './BodyEditor';
import { sendEmails } from '../utils/api';
import { buildEmailPayload } from '../utils/templateEngine';

export default function BulkSend({ onNavigateToTracker }) {
  const [csvData, setCsvData] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [sending, setSending] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSend = async () => {
    if (!csvData || !subject || !body) return;
    setSending(true);

    const payload = {
      name: `Bulk Campaign (${csvData.validCount} contacts)`,
      campaign_type: 'BULK_SEND',
      subject: subject,
      body: body,
      recipients: csvData.validRows.map(row => ({
        email: row.email,
        name: row.name || '',
        variables: {
          Name: row.name || '',
          ...row.raw
        }
      }))
    };

    try {
      await sendEmails(payload);
      setToast({ 
        type: 'success', 
        message: 'Campaign launched successfully!', 
        details: `Processing ${csvData.validCount} emails in background queue.` 
      });
      setSubject('');
      setBody('');
      setCsvData(null);

      // Redirect to tracker tab after 1.5 seconds
      if (onNavigateToTracker) {
        setTimeout(() => {
          onNavigateToTracker();
        }, 1500);
      }
    } catch (err) {
      setToast({ 
        type: 'error', 
        message: 'Failed to launch campaign', 
        details: err.response?.data?.error || err.response?.data?.detail || err.message 
      });
    } finally {
      setSending(false);
    }
  };

  // Build preview payload for the active recipient row
  const previewEmail = csvData?.validRows?.[previewIndex]
    ? buildEmailPayload(csvData.validRows[previewIndex], subject, body, replyTo)
    : { to: 'recipient@example.com', subject: subject || 'Demo Subject', body: body || 'Demo email body content' };

  const canSend = csvData && csvData.validCount > 0 && subject && body && !sending;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent-border)] flex items-center justify-center">
          <Users className="w-6 h-6 accent-text" />
        </div>
        <div>
          <h2 className="text-xl font-bold t1">Bulk Send</h2>
          <p className="t3 text-sm">Upload CSV and compose a template message to send to all contacts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Inputs & Composing */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Upload */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="step-badge">1</span>
              <h3 className="text-base font-bold t1">Upload CSV Recipients</h3>
            </div>
            
            <CSVUploader onDataParsed={setCsvData} requiredColumns="bulk" />

            {csvData && (
              <div className="p-4 rounded-xl surface-2 border border-theme animate-fade-in space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--success-text)] font-bold text-lg">{csvData.validCount}</span>
                    <span className="t2 text-sm">valid emails</span>
                    {csvData.invalidCount > 0 && (
                      <span className="text-[var(--error-text)] text-sm font-medium">{csvData.invalidCount} invalid</span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowTable(!showTable)}
                    className="btn-ghost px-2 py-1 flex items-center gap-1 text-xs"
                  >
                    <span>{showTable ? 'Hide Table' : 'Show Table'}</span>
                    {showTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showTable && (
                  <div className="max-h-48 overflow-auto rounded-lg border border-theme bg-[var(--surface-3)]">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="t3 border-b border-theme sticky top-0 bg-[var(--surface-1)]">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          {csvData.hasName && <th className="py-2 px-3">Name</th>}
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.rows.slice(0, 50).map((row, i) => (
                          <tr key={i} className="border-b border-theme last:border-none">
                            <td className="py-2 px-3 t3">{row.index}</td>
                            {csvData.hasName && <td className="py-2 px-3 t1 font-medium">{row.name}</td>}
                            <td className="py-2 px-3 t2">{row.email}</td>
                            <td className="py-2 px-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                row.valid
                                  ? 'bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)]'
                                  : 'bg-[var(--error-bg)] text-[var(--error-text)] border border-[var(--error-border)]'
                              }`}>
                                {row.valid ? 'Valid' : 'Invalid'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Compose */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="step-badge">2</span>
              <h3 className="text-base font-bold t1">Draft Template Message</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Subject <span className="text-red-400">*</span></label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject line — supports {{Name}}"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Reply-To <span className="t3 text-[10px]">(optional)</span></label>
                  <input
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    placeholder="reply@example.com"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Template Body <span className="text-red-400">*</span></label>
                <div className="flex gap-2 mb-2">
                  <span className="text-xs t3 self-center">Use template variables:</span>
                  <button
                    onClick={() => setSubject(prev => prev + '{{Name}}')}
                    className="px-2 py-1 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] accent-text text-xs cursor-pointer"
                  >
                    Subject {"{{Name}}"}
                  </button>
                  <button
                    onClick={() => setBody(prev => prev + '{{Name}}')}
                    className="px-2 py-1 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] accent-text text-xs cursor-pointer"
                  >
                    Body {"{{Name}}"}
                  </button>
                </div>
                
                <BodyEditor value={body} onChange={setBody} />
              </div>
            </div>
          </div>

          {/* Step 3: Action & Send Progress */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="btn-primary"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                <span>
                  {sending
                    ? 'Launching campaign...'
                    : `Launch campaign to ${csvData?.validCount || 0} Contacts`
                  }
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Right: Live Preview Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold t2">Preview Output</h3>
            {csvData && csvData.validCount > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                  disabled={previewIndex === 0}
                  className="btn-ghost p-1 disabled:opacity-40"
                  aria-label="Previous recipient preview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold t2">
                  {previewIndex + 1} of {csvData.validCount}
                </span>
                <button
                  onClick={() => setPreviewIndex(Math.min(csvData.validCount - 1, previewIndex + 1))}
                  disabled={previewIndex >= csvData.validCount - 1}
                  className="btn-ghost p-1 disabled:opacity-40"
                  aria-label="Next recipient preview"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <EmailPreview
            to={previewEmail.to}
            subject={previewEmail.subject}
            body={previewEmail.body}
          />
        </div>
      </div>

      {toast && <StatusToast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
