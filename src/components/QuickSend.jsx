import { useState } from 'react';
import { Send, Zap, Loader2, RotateCcw } from 'lucide-react';
import { sendEmails } from '../utils/api';
import StatusToast from './StatusToast';
import BodyEditor from './BodyEditor';
import EmailPreview from './EmailPreview';

export default function QuickSend({ onNavigateToTracker }) {
  const [form, setForm] = useState({ to: '', subject: '', body: '', replyTo: '' });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBodyChange = (bodyHtml) => setForm(prev => ({ ...prev, body: bodyHtml }));

  const isValid = form.to && form.subject && form.body && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.to);

  const handleSend = async () => {
    if (!isValid) return;
    setSending(true);
    try {
      const payload = {
        name: `Quick Send to ${form.to}`,
        campaign_type: 'QUICK_SEND',
        subject: form.subject,
        body: form.body,
        recipients: [
          {
            email: form.to,
            name: form.to.split('@')[0],
            variables: {}
          }
        ]
      };
      
      await sendEmails(payload);
      setToast({ 
        type: 'success', 
        message: 'Email campaign enqueued!', 
        details: `Processing send-job to ${form.to}` 
      });
      setForm({ to: '', subject: '', body: '', replyTo: '' });
      
      // Redirect to tracker tab after 1.5 seconds
      if (onNavigateToTracker) {
        setTimeout(() => {
          onNavigateToTracker();
        }, 1500);
      }
    } catch (err) {
      setToast({ 
        type: 'error', 
        message: 'Failed to send email', 
        details: err.response?.data?.error || err.response?.data?.detail || err.message 
      });
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    setForm({ to: '', subject: '', body: '', replyTo: '' });
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent-border)] flex items-center justify-center">
          <Zap className="w-6 h-6 accent-text animate-float" />
        </div>
        <div>
          <h2 className="text-xl font-bold t1">Quick Send</h2>
          <p className="t3 text-sm">Draft an email and send it instantly with live HTML rendering</p>
        </div>
      </div>

      {/* Responsive Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Editor */}
        <div className="lg:col-span-7 card p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Recipient Email <span className="text-red-400">*</span></label>
              <input
                name="to"
                type="email"
                value={form.to}
                onChange={handleChange}
                placeholder="recipient@example.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="field-label">Reply-To <span className="t3 text-[10px]">(optional)</span></label>
              <input
                name="replyTo"
                type="email"
                value={form.replyTo}
                onChange={handleChange}
                placeholder="reply@example.com"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="field-label">Subject <span className="text-red-400">*</span></label>
            <input
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              placeholder="Enter email subject line"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="field-label">Message Body <span className="text-red-400">*</span></label>
            <BodyEditor value={form.body} onChange={handleBodyChange} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSend}
              disabled={!isValid || sending}
              className="btn-primary"
            >
              {sending ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
              <span>{sending ? 'Sending...' : 'Send Email'}</span>
            </button>

            <button
              onClick={handleClear}
              className="btn-ghost"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear Form</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Preview Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-40">
          <EmailPreview
            to={form.to}
            subject={form.subject}
            body={form.body}
          />
        </div>
      </div>

      {/* Toast Alert */}
      {toast && <StatusToast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
