import { useState } from 'react';
import { Send, Zap, Loader2, RotateCcw } from 'lucide-react';
import { sendDirectEmail } from '../utils/api';
import StatusToast from './StatusToast';
import BodyEditor from './BodyEditor';
import EmailPreview from './EmailPreview';
import imgQuick from '../assets/snippet-quick.jpg';

export default function QuickSend({ onNavigateToTracker }) {
  const [form, setForm] = useState({ to: '', cc: '', subject: '', body: '', replyTo: '' });
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBodyChange = (bodyHtml) => setForm(prev => ({ ...prev, body: bodyHtml }));

  const recipientsList = form.to.split(',').map(s => s.trim()).filter(Boolean);
  const isValid = recipientsList.length > 0 && recipientsList.every(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) && form.subject && form.body;

  const handleSend = async () => {
    if (!isValid) return;
    setSending(true);
    try {
      const payload = {
        to: form.to,
        cc: form.cc,
        subject: form.subject,
        body: form.body
      };

      const res = await sendDirectEmail(payload);
      const count = recipientsList.length;
      setToast({ 
        type: 'success', 
        message: count > 1 ? `${count} Direct emails dispatched!` : 'Direct email dispatched!', 
        details: `Dispatched to: ${form.to}` 
      });
      setForm({ to: '', cc: '', subject: '', body: '', replyTo: '' });
      setFile(null);
      
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
    setForm({ to: '', cc: '', subject: '', body: '', replyTo: '' });
    setFile(null);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-2">02 · Compose</div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
            Quick <span className="gradient-text">send</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Draft direct 1-on-1 or multi-recipient emails without creating a marketing campaign.
          </p>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-48 lg:h-56 rounded-3xl overflow-hidden border border-border group">
        <img src={imgQuick} alt="Quick send compose" loading="lazy" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative h-full p-6 lg:p-8 flex items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-cyan px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20">
              <span className="size-1.5 rounded-full bg-cyan animate-pulse" /> Direct Send
            </div>
            <h2 className="mt-3 font-display text-xl lg:text-2xl font-semibold max-w-md">Compose and dispatch direct emails to single or multiple recipients.</h2>
          </div>
          <div className="hidden md:grid grid-cols-3 gap-6 pr-2">
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">0.4s</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Avg dispatch</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">Live</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Preview</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">Celery</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Worker pool</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Form Card */}
        <div className="lg:col-span-7 rounded-3xl glass border border-border p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium flex items-center gap-1.5">
                Recipient Email(s) <span className="text-rose">*</span> <span className="text-[10px] text-muted-foreground font-normal">(comma-separated)</span>
              </span>
              <input
                name="to"
                type="text"
                value={form.to}
                onChange={handleChange}
                placeholder="user1@example.com, user2@example.com"
                className="input"
                required
              />
            </label>
            <label className="block space-y-2">

              <span className="text-sm font-medium flex items-center gap-1.5">
                CC Email(s) <span className="text-[11px] text-muted-foreground font-normal">(optional, comma-separated)</span>
              </span>
              <input
                name="cc"
                type="text"
                value={form.cc}
                onChange={handleChange}
                placeholder="cc1@example.com, cc2@example.com"
                className="input"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium flex items-center gap-1.5">
              Subject <span className="text-rose">*</span>
            </span>
            <input
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              placeholder="Your briefing is ready"
              className="input"
              required
            />
          </label>


          <div className="space-y-2">
            <label className="block text-sm font-medium">Message body <span className="text-rose">*</span></label>
            <BodyEditor value={form.body} onChange={handleBodyChange} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSend}
              disabled={!isValid || sending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold flex items-center gap-2 hover:shadow-[0_8px_30px_-8px] hover:shadow-lime/60 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              <span>{sending ? 'Sending...' : 'Send now'}</span>
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-sm flex items-center gap-2 cursor-pointer transition"
            >
              <RotateCcw className="size-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
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
