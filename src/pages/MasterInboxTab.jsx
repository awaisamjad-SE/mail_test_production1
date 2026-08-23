import { useState, useEffect, useRef } from 'react';
import { 
  Inbox, Flame, HelpCircle, Ban, UserX, AlertTriangle, Plane, Star, 
  Search, RefreshCw, Send, Paperclip, Loader2, CheckCircle2, ShieldAlert,
  ArrowRight, Filter, ChevronRight, CornerUpLeft, Mail, User, Clock, Trash2
} from 'lucide-react';
import * as api from '../utils/api';

export default function MasterInboxTab() {
  const [inboundEmails, setInboundEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingInbox, setSyncingInbox] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // Filters & State
  const [activeFolder, setActiveFolder] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);

  // Composer State
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(null);

  const fetchEmails = async () => {
    try {
      const res = await api.fetchInboundEmails();
      const items = res.results || res;
      setInboundEmails(items);
      if (items.length > 0 && !selectedEmail) {
        setSelectedEmail(items[0]);
      }
    } catch (err) {
      console.error('Error fetching inbound emails:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleManualSync = async () => {
    setSyncingInbox(true);
    setSyncMessage(null);
    try {
      const res = await api.triggerInboxSync();
      const count = res.details?.processed_count || 0;
      setSyncMessage(`Synced ${count} new email(s) from IMAP inbox.`);
      fetchEmails();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setSyncMessage(msg.startsWith('IMAP sync') ? msg : `IMAP sync error: ${msg}`);
    } finally {
      setSyncingInbox(false);
    }


  };

  const handleSelectEmail = async (emailItem) => {
    setSelectedEmail(emailItem);
    setReplySuccess(null);
    setReplyBody('');

    // Mark as read if not already
    if (!emailItem.is_read) {
      try {
        await api.updateInboundEmail(emailItem.id, { is_read: true });
        setInboundEmails(prev => prev.map(item => item.id === emailItem.id ? { ...item, is_read: true } : item));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
  };

  const handleToggleStar = async (e, emailItem) => {
    e.stopPropagation();
    const newStar = !emailItem.is_starred;
    try {
      await api.updateInboundEmail(emailItem.id, { is_starred: newStar });
      setInboundEmails(prev => prev.map(item => item.id === emailItem.id ? { ...item, is_starred: newStar } : item));
      if (selectedEmail?.id === emailItem.id) {
        setSelectedEmail(prev => ({ ...prev, is_starred: newStar }));
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleUpdateSentiment = async (newSentiment) => {
    if (!selectedEmail) return;
    try {
      await api.updateInboundEmail(selectedEmail.id, { sentiment: newSentiment });
      setInboundEmails(prev => prev.map(item => item.id === selectedEmail.id ? { ...item, sentiment: newSentiment } : item));
      setSelectedEmail(prev => ({ ...prev, sentiment: newSentiment }));
    } catch (err) {
      alert('Failed to update sentiment: ' + err.message);
    }
  };

  const handleAddSuppression = async () => {
    if (!selectedEmail) return;
    if (!window.confirm(`Add ${selectedEmail.sender_email} to global unsubscribe/suppression list?`)) return;
    try {
      await api.addSuppression(selectedEmail.sender_email, 'Manually suppressed from Master Inbox');
      alert(`Suppressed ${selectedEmail.sender_email}. Future sequence steps for this lead are blocked.`);
    } catch (err) {
      alert('Failed to add to suppression list: ' + err.message);
    }
  };

  const handleSendQuickReply = async (e) => {
    e.preventDefault();
    if (!selectedEmail || !replyBody.trim()) return;

    setSendingReply(true);
    setReplySuccess(null);

    try {
      const payload = {
        name: `Quick Reply to ${selectedEmail.sender_email}`,
        campaign_type: 'QUICK_SEND',
        subject: selectedEmail.subject.toLowerCase().startsWith('re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
        body: replyBody,
        recipients: [{ email: selectedEmail.sender_email, name: selectedEmail.sender_name }]
      };

      await api.sendEmails(payload);
      setReplySuccess(`Reply successfully sent to ${selectedEmail.sender_email}!`);
      setReplyBody('');
    } catch (err) {
      alert('Failed to send reply: ' + (err.response?.data?.error || err.message));
    } finally {
      setSendingReply(false);
    }
  };

  // Filter Logic
  const filteredEmails = inboundEmails.filter((item) => {
    // 1. Folder match
    if (activeFolder === 'INTERESTED' && item.sentiment !== 'INTERESTED') return false;
    if (activeFolder === 'QUESTION' && item.sentiment !== 'QUESTION') return false;
    if (activeFolder === 'NOT_INTERESTED' && item.sentiment !== 'NOT_INTERESTED') return false;
    if (activeFolder === 'UNSUBSCRIBE' && item.sentiment !== 'UNSUBSCRIBE') return false;
    if (activeFolder === 'BOUNCE' && item.classification !== 'BOUNCE') return false;
    if (activeFolder === 'AUTO_REPLY' && item.classification !== 'AUTO_REPLY') return false;
    if (activeFolder === 'STARRED' && !item.is_starred) return false;

    // 2. Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSender = item.sender_email?.toLowerCase().includes(q) || item.sender_name?.toLowerCase().includes(q);
      const matchSubj = item.subject?.toLowerCase().includes(q);
      const matchBody = item.body_text?.toLowerCase().includes(q);
      return matchSender || matchSubj || matchBody;
    }

    return true;
  });

  const getSentimentPill = (sentiment) => {
    const map = {
      INTERESTED: { cls: 'bg-lime/15 text-lime border-lime/30', label: '🔥 Interested' },
      QUESTION: { cls: 'bg-cyan/15 text-cyan border-cyan/30', label: '❓ Question' },
      NOT_INTERESTED: { cls: 'bg-rose/15 text-rose border-rose/30', label: '🚫 Not Interested' },
      UNSUBSCRIBE: { cls: 'bg-amber/15 text-amber border-amber/30', label: '✋ Unsubscribed' },
      NEUTRAL: { cls: 'bg-white/10 text-muted-foreground border-border', label: 'Neutral' }
    };
    const s = map[sentiment] || { cls: 'bg-white/10 text-muted-foreground border-border', label: sentiment };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${s.cls}`}>
        {s.label}
      </span>
    );
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 text-cyan animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Loading Gmail-style Master Inbox telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-1">Master Unibox · 06</div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
            Lead <span className="gradient-text">master inbox</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
            Unified thread hub for all Hostinger & Gmail lead responses, AI sentiment tagging, and instant direct replies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleManualSync}
            disabled={syncingInbox}
            className="px-4 py-2 rounded-xl bg-cyan/15 hover:bg-cyan/25 border border-cyan/30 text-cyan text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className={`size-3.5 ${syncingInbox ? 'animate-spin' : ''}`} /> 
            <span>{syncingInbox ? 'Syncing IMAP...' : 'Sync Inbox Now'}</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3.5 rounded-2xl bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono flex items-center justify-between">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* 3-Pane Unibox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
        {/* Pane 1: Left Smart Folders (3 cols) */}
        <div className="lg:col-span-3 rounded-3xl glass border border-border p-4 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="px-2 pt-1 text-[11px] uppercase tracking-[0.2em] font-mono text-muted-foreground">
              Smart Filters
            </div>

            <nav className="space-y-1">
              {[
                { key: 'ALL', label: 'All Replies', icon: Inbox, count: inboundEmails.length },
                { key: 'INTERESTED', label: 'Interested', icon: Flame, count: inboundEmails.filter(e => e.sentiment === 'INTERESTED').length, color: 'text-lime' },
                { key: 'QUESTION', label: 'Questions', icon: HelpCircle, count: inboundEmails.filter(e => e.sentiment === 'QUESTION').length, color: 'text-cyan' },
                { key: 'NOT_INTERESTED', label: 'Not Interested', icon: Ban, count: inboundEmails.filter(e => e.sentiment === 'NOT_INTERESTED').length, color: 'text-rose' },
                { key: 'UNSUBSCRIBE', label: 'Unsubscribes', icon: UserX, count: inboundEmails.filter(e => e.sentiment === 'UNSUBSCRIBE').length, color: 'text-amber' },
                { key: 'BOUNCE', label: 'Bounces & Failures', icon: AlertTriangle, count: inboundEmails.filter(e => e.classification === 'BOUNCE').length, color: 'text-rose' },
                { key: 'AUTO_REPLY', label: 'Out of Office', icon: Plane, count: inboundEmails.filter(e => e.classification === 'AUTO_REPLY').length },
                { key: 'STARRED', label: 'Starred', icon: Star, count: inboundEmails.filter(e => e.is_starred).length, color: 'text-amber' },
              ].map(folder => {
                const active = activeFolder === folder.key;
                const Icon = folder.icon;
                return (
                  <button
                    key={folder.key}
                    onClick={() => setActiveFolder(folder.key)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-mono transition-all cursor-pointer ${
                      active ? 'bg-cyan/15 border border-cyan/30 text-foreground font-bold' : 'hover:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`size-4 ${folder.color || ''}`} />
                      <span>{folder.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? 'bg-cyan text-zinc-950 font-bold' : 'bg-white/5 text-muted-foreground'}`}>
                      {folder.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Telemetry Card */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-border text-xs font-mono space-y-1">
            <p className="text-muted-foreground uppercase text-[10px] tracking-wider">Unibox Telemetry</p>
            <div className="flex justify-between items-center text-foreground font-bold">
              <span>Hostinger IMAP</span>
              <span className="text-lime">Connected</span>
            </div>
          </div>
        </div>

        {/* Pane 2: Middle Email List (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl glass border border-border p-4 flex flex-col gap-3 min-h-[500px]">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sender, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/5 border border-border text-xs focus:outline-none focus:border-cyan transition-colors"
            />
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {filteredEmails.length > 0 ? (
              filteredEmails.map((item) => {
                const isSelected = selectedEmail?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectEmail(item)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative space-y-1.5 ${
                      isSelected 
                        ? 'bg-cyan/10 border-cyan/50 shadow-lg' 
                        : item.is_read ? 'bg-white/[0.01] border-border/60 hover:bg-white/5' : 'bg-white/[0.04] border-cyan/30 hover:border-cyan/50'
                    }`}
                  >
                    {!item.is_read && (
                      <span className="absolute top-3.5 right-3.5 size-2 rounded-full bg-cyan animate-pulse" />
                    )}

                    <div className="flex items-center justify-between gap-2 pr-4">
                      <span className="font-display font-semibold text-xs truncate text-foreground">
                        {item.sender_name || item.sender_email}
                      </span>
                      <button
                        onClick={(e) => handleToggleStar(e, item)}
                        className="text-muted-foreground hover:text-amber transition-colors"
                      >
                        <Star className={`size-3.5 ${item.is_starred ? 'fill-amber text-amber' : ''}`} />
                      </button>
                    </div>

                    <p className="text-xs font-medium text-foreground/90 truncate">{item.subject}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.body_text || 'No preview available.'}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-muted-foreground">
                      {getSentimentPill(item.sentiment)}
                      <span>{new Date(item.received_at || item.processed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center text-xs text-muted-foreground font-mono">
                No emails found in filter "{activeFolder}".
              </div>
            )}
          </div>
        </div>

        {/* Pane 3: Right Thread Reader & Composer (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl glass border border-border p-6 flex flex-col justify-between gap-6 min-h-[500px]">
          {selectedEmail ? (
            <div className="flex-1 flex flex-col justify-between space-y-6 overflow-y-auto pr-1 scrollbar-thin">
              {/* Lead Profile Header */}
              <div className="border-b border-border pb-4 space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="font-display font-bold text-lg">{selectedEmail.sender_name || selectedEmail.sender_email}</h3>
                    <p className="text-xs text-muted-foreground font-mono">&lt;{selectedEmail.sender_email}&gt;</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSentimentPill(selectedEmail.sentiment)}
                    <button
                      onClick={handleAddSuppression}
                      className="p-1.5 rounded-xl bg-white/5 border border-border text-rose hover:bg-rose/10 transition cursor-pointer"
                      title="Add to Suppression / Unsubscribe List"
                    >
                      <UserX className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground flex-wrap gap-2">
                  <span>Campaign: <strong className="text-cyan">{selectedEmail.campaign_name || 'Direct Send'}</strong></span>
                  <span>Received: {new Date(selectedEmail.received_at || selectedEmail.processed_at).toLocaleString()}</span>
                </div>

                {/* Sentiment Manual Override */}
                <div className="flex items-center gap-2 pt-1 text-xs font-mono">
                  <span className="text-muted-foreground">Tag Sentiment:</span>
                  {['INTERESTED', 'QUESTION', 'NOT_INTERESTED', 'UNSUBSCRIBE'].map(s => (
                    <button
                      key={s}
                      onClick={() => handleUpdateSentiment(s)}
                      className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
                        selectedEmail.sentiment === s ? 'bg-cyan/20 border-cyan text-cyan font-bold' : 'bg-white/5 border-border hover:bg-white/10 text-muted-foreground'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation History Thread */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-border space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono border-b border-border/50 pb-2">
                    <span className="font-bold text-cyan">Incoming Reply</span>
                    <span className="text-muted-foreground">{selectedEmail.classification}</span>
                  </div>

                  <p className="text-xs font-semibold text-foreground font-mono">Subject: {selectedEmail.subject}</p>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-foreground/90 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedEmail.body_text || (selectedEmail.body_html ? 'HTML Content' : 'No message body.')}
                  </div>

                  {selectedEmail.bounce_detail && (
                    <div className="p-3 rounded-xl bg-rose/10 border border-rose/30 text-xs font-mono text-rose space-y-1">
                      <p className="font-bold">Bounce Failure Code: {selectedEmail.bounce_detail.smtp_status_code}</p>
                      <p className="text-[11px]">{selectedEmail.bounce_detail.diagnostic_code}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Quick Reply Composer */}
              <form onSubmit={handleSendQuickReply} className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-cyan flex items-center gap-1.5">
                    <CornerUpLeft className="size-4" /> Quick Reply to Lead
                  </span>
                  <span className="text-muted-foreground">From: ali@fastnexa.com</span>
                </div>

                {replySuccess && (
                  <div className="p-2.5 rounded-xl bg-lime/15 border border-lime/30 text-lime text-xs font-mono">
                    {replySuccess}
                  </div>
                )}

                <textarea
                  rows={3}
                  placeholder={`Write your direct message to ${selectedEmail.sender_email}...`}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white/5 border border-border text-xs focus:outline-none focus:border-cyan transition-colors resize-none"
                />

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground font-mono">Dispatched instantly via Hostinger / Gmail SMTP</p>
                  <button
                    type="submit"
                    disabled={sendingReply || !replyBody.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-lime to-cyan text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {sendingReply ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                    <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2">
              <Mail className="size-12 text-cyan/50" />
              <p className="text-sm font-semibold text-muted-foreground">Select an email thread from the inbox to read and compose replies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
