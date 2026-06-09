import { useState } from 'react';
import { Send, LayoutTemplate, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import CSVUploader from './CSVUploader';
import EmailPreview from './EmailPreview';
import StatusToast from './StatusToast';
import BodyEditor from './BodyEditor';
import { sendEmails } from '../utils/api';
import { buildEmailPayload } from '../utils/templateEngine';
import { emailTemplates } from '../data/templates';

export default function TemplateGallery({ onNavigateToTracker }) {
  const [selected, setSelected] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [sending, setSending] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [toast, setToast] = useState(null);

  const handleSelectTemplate = (template) => {
    setSelected(template);
    setSubject(template.subject);
    setBody(template.body);
  };

  const handleBack = () => {
    setSelected(null);
    setCsvData(null);
    setSubject('');
    setBody('');
    setReplyTo('');
  };

  const handleSend = async () => {
    if (!csvData || !subject || !body) return;
    setSending(true);

    const payload = {
      name: `Template Campaign: ${selected.name}`,
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
        message: 'Campaign launched with template!', 
        details: `Processing ${csvData.validCount} emails in background queue.` 
      });
      handleBack();

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

  // Build preview payload for active CSV row or default
  const previewEmail = csvData?.validRows?.[previewIndex]
    ? buildEmailPayload(csvData.validRows[previewIndex], subject, body, replyTo)
    : { to: 'recipient@email.com', subject: subject || 'Template Subject', body: body || 'Template body content' };

  const canSend = csvData && csvData.validCount > 0 && subject && body && !sending;

  if (!selected) {
    return (
      <div className="space-y-6">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent-border)] flex items-center justify-center">
            <LayoutTemplate className="w-6 h-6 accent-text" />
          </div>
          <div>
            <h2 className="text-xl font-bold t1">Template Gallery</h2>
            <p className="t3 text-sm">Select a pre-designed layout, fill in placeholders, and send to contacts</p>
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {emailTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className="card text-left p-6 hover:border-[var(--accent)] hover:bg-[var(--surface-3)] hover:scale-[1.02] hover:shadow-lg transition-all duration-300 group flex flex-col justify-between h-full border border-theme cursor-pointer"
            >
              <div>
                <div className="text-3xl mb-4">{template.icon}</div>
                <h3 className="font-bold text-lg t1 group-hover:accent-text transition-colors mb-1">
                  {template.name}
                </h3>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--accent-bg)] border border-[var(--accent-border)] accent-text text-xs font-semibold mb-3">
                  {template.category}
                </span>
                <p className="t2 text-sm leading-relaxed mb-4">
                  {template.description}
                </p>
              </div>
              
              <span className="text-xs font-bold accent-text group-hover:underline flex items-center gap-1 mt-auto">
                Customize Template <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button & header info */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={handleBack}
          className="btn-ghost px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Templates</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-3xl">{selected.icon}</span>
          <div>
            <h3 className="font-bold text-lg t1">{selected.name}</h3>
            <p className="t3 text-xs">Customizing: {selected.category}</p>
          </div>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column - customize & upload */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider t3">1. Customize Content</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Subject Line</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
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
                <label className="field-label">Body Content</label>
                <div className="flex gap-2 mb-2">
                  <span className="text-xs t3 self-center">Insert variables:</span>
                  <button
                    onClick={() => setSubject(prev => prev + '{{Name}}')}
                    className="px-2 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] accent-text text-xs cursor-pointer"
                  >
                    Subject {"{{Name}}"}
                  </button>
                  <button
                    onClick={() => setBody(prev => prev + '{{Name}}')}
                    className="px-2 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] accent-text text-xs cursor-pointer"
                  >
                    Body {"{{Name}}"}
                  </button>
                </div>
                <BodyEditor value={body} onChange={setBody} />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider t3">2. Add Recipients</h3>
            <CSVUploader onDataParsed={setCsvData} requiredColumns="bulk" />

            {csvData && (
              <div className="p-3 rounded-xl surface-2 border border-theme animate-fade-in flex items-center justify-between">
                <div>
                  <span className="text-[var(--success-text)] font-extrabold text-base">{csvData.validCount}</span>
                  <span className="t2 text-xs font-semibold ml-1.5">contacts loaded</span>
                </div>
                {csvData.hasName && (
                  <span className="px-2 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] accent-text text-[10px] font-bold">
                    Names Detected
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="card p-6 space-y-4">
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="btn-primary"
            >
              {sending ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
              <span>
                {sending
                  ? 'Queueing custom emails...'
                  : `Launch template to ${csvData?.validCount || 0} Contacts`
                }
              </span>
            </button>
          </div>

        </div>

        {/* Right column - Email Preview with index navigation */}
        <div className="lg:col-span-5 lg:sticky lg:top-40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold t2">Template Output Preview</h3>
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
