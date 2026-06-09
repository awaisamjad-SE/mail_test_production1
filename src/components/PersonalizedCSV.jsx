import { useState } from 'react';
import { Send, Target, Loader2, ChevronDown, ChevronUp, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import CSVUploader from './CSVUploader';
import EmailPreview from './EmailPreview';
import StatusToast from './StatusToast';
import { sendEmails } from '../utils/api';

export default function PersonalizedCSV({ onNavigateToTracker }) {
  const [csvData, setCsvData] = useState(null);
  const [replyTo, setReplyTo] = useState('');
  const [sending, setSending] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSend = async () => {
    if (!csvData) return;
    setSending(true);

    const payload = {
      name: `Personalized Campaign (${csvData.validCount} rows)`,
      campaign_type: 'PERSONALIZED',
      subject: '{{Subject}}',
      body: '{{Body}}',
      recipients: csvData.validRows.map(row => ({
        email: row.email,
        name: row.name || row.email.split('@')[0],
        variables: {
          Subject: row.subject,
          Body: row.body,
          ...row.raw
        }
      }))
    };

    try {
      await sendEmails(payload);
      setToast({ 
        type: 'success', 
        message: 'Personalized campaign enqueued!', 
        details: `Processing ${csvData.validCount} custom emails in backend queue.` 
      });
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

  const previewRow = csvData?.validRows?.[previewIndex];

  // Build preview payload
  const previewEmail = previewRow
    ? { to: previewRow.email, subject: previewRow.subject, body: previewRow.body }
    : { to: 'recipient@example.com', subject: 'Custom Row Subject', body: 'This body and subject will be loaded directly from your uploaded CSV. Upload a CSV to preview your individual rows.' };

  const canSend = csvData && csvData.validCount > 0 && !sending;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent-border)] flex items-center justify-center">
          <Target className="w-6 h-6 accent-text" />
        </div>
        <div>
          <h2 className="text-xl font-bold t1">Personalized CSV</h2>
          <p className="t3 text-sm">Upload a CSV where each recipient gets a completely custom subject and body</p>
        </div>
      </div>

      {/* Info Warning Banner */}
      <div className="alert-info flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold mb-1">CSV Format Required</p>
          <p className="opacity-90">
            For personalized mode, your CSV file must include columns explicitly titled <strong>Email</strong>, <strong>Subject</strong>, and <strong>Body</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Config */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="step-badge">1</span>
              <h3 className="text-base font-bold t1">Upload Custom Dataset</h3>
            </div>
            
            <CSVUploader onDataParsed={setCsvData} requiredColumns="personalized" />

            {csvData && (
              <div className="p-4 rounded-xl surface-2 border border-theme animate-fade-in space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--success-text)] font-bold text-lg">{csvData.validCount}</span>
                    <span className="t2 text-sm font-semibold">personalized emails ready</span>
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
                  <div className="max-h-64 overflow-auto rounded-lg border border-theme bg-[var(--surface-3)]">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="t3 border-b border-theme sticky top-0 bg-[var(--surface-1)]">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Subject</th>
                          <th className="py-2 px-3">Body Preview</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.validRows.slice(0, 30).map((row, i) => (
                          <tr key={i} className="border-b border-theme last:border-none">
                            <td className="py-2 px-3 t3">{row.index}</td>
                            <td className="py-2 px-3 t1 font-medium">{row.email}</td>
                            <td className="py-2 px-3 t2 max-w-[150px] truncate font-semibold">{row.subject}</td>
                            <td className="py-2 px-3 t3 max-w-[200px] truncate">{row.body}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {csvData && (
            <div className="card p-6 space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="step-badge">2</span>
                <h3 className="text-base font-bold t1">Additional Configuration</h3>
              </div>

              <div>
                <label className="field-label">Global Reply-To <span className="t3 text-[10px]">(optional — fallback for all rows)</span></label>
                <input
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="reply@example.com"
                  className="input-field"
                />
              </div>
            </div>
          )}

          {csvData && (
            <div className="card p-6 space-y-4 animate-fade-in">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className="btn-primary"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  <span>
                    {sending
                      ? 'Queueing custom emails...'
                      : `Launch ${csvData.validCount} Personalized Emails`
                    }
                  </span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Live Preview Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold t2">Row Output Preview</h3>
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
