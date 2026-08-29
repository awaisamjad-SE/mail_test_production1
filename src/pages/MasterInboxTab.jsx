import { useState, useEffect, useRef } from 'react';
import { 
  Inbox, Flame, HelpCircle, Ban, UserX, AlertTriangle, Plane, Star, 
  Search, RefreshCw, Send, Paperclip, Loader2, CheckCircle2, ShieldAlert,
  ArrowRight, ArrowLeft, Filter, ChevronRight, CornerUpLeft, Mail, User, Clock, Trash2
} from 'lucide-react';
import * as api from '../utils/api';

export default function MasterInboxTab() {
  const [mobileViewMode, setMobileViewMode] = useState('LIST'); // 'LIST' vs 'THREAD' for mobile screens
  const [inboundEmails, setInboundEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingInbox, setSyncingInbox] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // Auto-Fetch Polling State
  const [autoSync, setAutoSync] = useState(true);

  // Filters & Pagination State
  const [activeFolder, setActiveFolder] = useState('ALL');
  const [leadRepliesOnly, setLeadRepliesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Reply & Forward State
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(null);

  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardToEmail, setForwardToEmail] = useState('');
  const [forwardNote, setForwardNote] = useState('');
  const [sendingForward, setSendingForward] = useState(false);
  const [forwardSuccess, setForwardSuccess] = useState(null);

  const [senderAddress, setSenderAddress] = useState('awaisamjad.official@gmail.com');

  const fetchEmails = async () => {
    try {
      const res = await api.fetchInboundEmails();
      const items = res.results || res;
      setInboundEmails(items);
      try {
        sessionStorage.setItem('mailflow_inbox_cache', JSON.stringify(items));
      } catch (e) {}
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
    try {
      const cached = sessionStorage.getItem('mailflow_inbox_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInboundEmails(parsed);
          setSelectedEmail(parsed[0]);
          setLoading(false);
        }
      }
    } catch (e) {}

    fetchEmails();
    api.fetchSMTPSettings().then(res => {
      const email = res.gmail_address || res[0]?.gmail_address;
      if (email && email.includes('@')) setSenderAddress(email);
    }).catch(() => {});
  }, []);

  // Background Auto-Polling every 5 seconds for live email fetching
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(async () => {
      try {
        await api.triggerInboxSync();
        fetchEmails();
      } catch (err) {
        if (err.response?.status === 401) {
          setAutoSync(false);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [autoSync]);

  // Reset composer ONLY when the selected email thread ID actually changes
  const prevSelectedId = useRef(selectedEmail?.id);
  useEffect(() => {
    if (selectedEmail?.id !== prevSelectedId.current) {
      prevSelectedId.current = selectedEmail?.id;
      setShowReplyComposer(false);
      setReplySuccess(null);
      setReplyBody('');
    }
  }, [selectedEmail?.id]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFolder, searchQuery, leadRepliesOnly]);

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

  const handlePurgeSocial = async () => {
    if (!window.confirm('Clear all non-primary social notifications & newsletters from Unibox?')) return;
    try {
      const res = await api.purgeSocialEmails();
      setSyncMessage(res.message || 'Social notifications purged.');
      setSelectedEmail(null);
      fetchEmails();
    } catch (err) {
      alert('Failed to purge social emails: ' + err.message);
    }
  };

  const handleSelectEmail = async (emailItem) => {
    setSelectedEmail(emailItem);
    setMobileViewMode('THREAD');
    setReplySuccess(null);
    setReplyBody('');
    setShowReplyComposer(false);

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

  const handleSendForward = async (e) => {
    e.preventDefault();
    if (!selectedEmail || !forwardToEmail.trim()) return;

    setSendingForward(true);
    setForwardSuccess(null);

    try {
      const fullBody = `${forwardNote.trim() ? forwardNote.trim() + '\n\n' : ''}---------- Forwarded message ---------\nFrom: ${selectedEmail.sender_name || selectedEmail.sender_email} <${selectedEmail.sender_email}>\nDate: ${new Date(selectedEmail.received_at || selectedEmail.processed_at).toLocaleString()}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body_text || ''}`;

      const payload = {
        to: forwardToEmail.trim(),
        subject: selectedEmail.subject.toLowerCase().startsWith('fwd:') ? selectedEmail.subject : `Fwd: ${selectedEmail.subject}`,
        body: fullBody
      };

      await api.sendDirectEmail(payload);
      setForwardSuccess(`Thread successfully forwarded to ${forwardToEmail}!`);
      setTimeout(() => {
        setShowForwardModal(false);
        setForwardToEmail('');
        setForwardNote('');
        setForwardSuccess(null);
      }, 1500);
    } catch (err) {
      alert('Failed to forward email: ' + (err.response?.data?.error || err.message));
    } finally {
      setSendingForward(false);
    }
  };

  // Filter Logic
  const filteredEmails = inboundEmails.filter((item) => {
    // 0. Campaign Lead Replies filter
    if (leadRepliesOnly && !item.email_log) return false;

    // 1. Folder / Pill match
    if (activeFolder === 'NEEDS_REPLY' && item.is_read) return false;
    if (activeFolder === 'INTERESTED' && item.sentiment !== 'INTERESTED') return false;
    if (activeFolder === 'QUESTION' && item.sentiment !== 'QUESTION') return false;
    if (activeFolder === 'NOT_INTERESTED' && (item.sentiment !== 'NOT_INTERESTED' && item.sentiment !== 'UNSUBSCRIBE')) return false;
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

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredEmails.length / pageSize));
  const paginatedEmails = filteredEmails.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const needsReplyCount = inboundEmails.filter(e => !e.is_read).length;

  const getSentimentPill = (sentiment, isRead) => {
    if (!isRead) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border bg-cyan/15 text-cyan border-cyan/30 font-bold">
          Needs reply
        </span>
      );
    }
    const map = {
      INTERESTED: { cls: 'bg-lime/15 text-lime border-lime/30', label: 'Positive' },
      QUESTION: { cls: 'bg-cyan/15 text-cyan border-cyan/30', label: 'Hot · 7d' },
      NOT_INTERESTED: { cls: 'bg-rose/15 text-rose border-rose/30', label: 'Churn risk' },
      UNSUBSCRIBE: { cls: 'bg-amber/15 text-amber border-amber/30', label: 'Unsubscribed' },
      NEUTRAL: { cls: 'bg-white/10 text-muted-foreground border-white/10', label: 'Neutral' },
      UNKNOWN: { cls: 'bg-white/5 text-muted-foreground border-white/5', label: 'Open' },
    };
    const pill = map[sentiment] || map.UNKNOWN;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${pill.cls}`}>
        {pill.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 text-cyan animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Loading Lead Master Inbox telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-0.5">Master Inbox · 06</div>
          <h1 className="text-3xl font-display font-bold tracking-tight">
            Lead Master Inbox
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs font-mono">
            {inboundEmails.length} open threads · <span className="text-cyan font-bold">{needsReplyCount} need reply</span> · synced just now
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAutoSync(!autoSync)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono border flex items-center gap-2 cursor-pointer transition-colors ${
              autoSync ? 'bg-lime/10 border-lime/30 text-lime' : 'bg-white/5 border-border text-muted-foreground'
            }`}
            title="Toggle background auto-fetch (every 20s)"
          >
            <span className={`size-2 rounded-full ${autoSync ? 'bg-lime animate-pulse' : 'bg-zinc-600'}`} />
            <span>{autoSync ? 'Auto-Fetch (20s)' : 'Auto-Fetch Off'}</span>
          </button>

          <button 
            onClick={handlePurgeSocial}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Remove non-primary social notifications from Unibox"
          >
            <Trash2 className="size-3.5" />
            <span>Purge Social</span>
          </button>

          <button 
            onClick={handleManualSync}
            disabled={syncingInbox}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-foreground text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className={`size-3.5 ${syncingInbox ? 'animate-spin' : ''}`} /> 
            <span>Sync</span>
          </button>

          <button 
            onClick={() => {
              if (selectedEmail) {
                const el = document.getElementById('quick-reply-textarea');
                if (el) el.focus();
              }
            }}
            className="px-4 py-1.5 rounded-xl bg-cyan text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-cyan/90 transition"
          >
            <span>+ New thread</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3.5 rounded-2xl bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono flex items-center justify-between">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Quick Filter Pills Row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          {[
            { key: 'ALL', label: 'All leads' },
            { key: 'NEEDS_REPLY', label: 'Needs reply' },
            { key: 'INTERESTED', label: 'Positive' },
            { key: 'QUESTION', label: 'Hot · 7d' },
            { key: 'NOT_INTERESTED', label: 'Churn risk' },
          ].map(pill => {
            const active = activeFolder === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => setActiveFolder(pill.key)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  active ? 'bg-cyan/20 border-cyan text-cyan font-bold shadow-sm' : 'bg-white/5 border-border text-muted-foreground hover:bg-white/10 hover:text-foreground'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setLeadRepliesOnly(!leadRepliesOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono cursor-pointer border transition-colors ${
              leadRepliesOnly ? 'bg-cyan/20 text-cyan border-cyan/40 font-bold' : 'bg-white/5 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            🎯 Campaign Leads Only
          </button>
          <span className="text-xs font-mono text-muted-foreground bg-white/5 px-3 py-1.5 rounded-xl border border-border">
            Last 30 days
          </span>
        </div>
      </div>

      {/* Full Width Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search leads, threads, or campaigns..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/5 border border-border text-xs focus:outline-none focus:border-cyan transition-colors"
        />
      </div>

      {/* Split Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[620px]">
        {/* Left Threads Column (4 cols) */}
        <div className={`lg:col-span-4 rounded-3xl glass border border-border p-4 flex-col justify-between gap-3 min-h-[500px] ${
          mobileViewMode === 'THREAD' ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono px-1">
              <div>
                <span className="font-bold text-foreground">Threads</span>
                <span className="text-muted-foreground ml-2">{filteredEmails.length} conversations</span>
              </div>
              <span className="text-[10px] bg-cyan/10 text-cyan px-2 py-0.5 rounded font-bold">
                {activeFolder}
              </span>
            </div>

            {/* Scrollable Threads List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
              {paginatedEmails.length > 0 ? (
                paginatedEmails.map((item) => {
                  const isSelected = selectedEmail?.id === item.id;
                  const isLeadReply = !!item.email_log;
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
                        <div className="flex items-center gap-1.5 truncate">
                          {isLeadReply && (
                            <span className="px-1.5 py-0.2 text-[9px] font-mono bg-cyan/20 text-cyan rounded font-bold">
                              LEAD
                            </span>
                          )}
                          <span className="font-display font-semibold text-xs truncate text-foreground">
                            {item.sender_name || item.sender_email}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(item.received_at || item.processed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-foreground/90 truncate">{item.subject}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.body_text || 'No preview available.'}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-muted-foreground">
                        {getSentimentPill(item.sentiment, item.is_read)}
                        <button
                          onClick={(e) => handleToggleStar(e, item)}
                          className="text-muted-foreground hover:text-amber transition-colors"
                        >
                          <Star className={`size-3.5 ${item.is_starred ? 'fill-amber text-amber' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center text-xs text-muted-foreground font-mono">
                  No threads found matching "{activeFolder}".
                </div>
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          {filteredEmails.length > 0 && (
            <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground text-[11px]">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-xl bg-white/5 border border-border hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[11px]"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-xl bg-white/5 border border-border hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[11px]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Selected Lead Workspace (8 cols) */}
        <div className={`lg:col-span-8 rounded-3xl glass border border-border p-4 lg:p-6 flex-col justify-between gap-5 min-h-[500px] ${
          mobileViewMode === 'LIST' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Mobile Back Header */}
          <div className="lg:hidden flex items-center justify-between pb-3 mb-2 border-b border-border text-xs font-mono">
            <button
              onClick={() => setMobileViewMode('LIST')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan/15 border border-cyan/30 text-cyan font-bold cursor-pointer hover:bg-cyan/20 transition"
            >
              <ArrowLeft className="size-4" /> Back to Threads
            </button>
            <span className="text-[10px] text-muted-foreground bg-white/5 px-2.5 py-1 rounded-lg border border-border font-bold">
              {filteredEmails.length} Conversations
            </span>
          </div>

          {selectedEmail ? (
            <div className="flex-1 flex flex-col justify-between space-y-5 overflow-y-auto pr-1 scrollbar-thin">
              <div className="space-y-4">
                {/* Lead Profile Banner Card */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-border flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3.5">
                    <div className="size-12 rounded-2xl bg-gradient-to-br from-cyan/20 to-lime/20 border border-cyan/30 grid place-items-center font-bold text-cyan text-lg">
                      {(selectedEmail.sender_name || selectedEmail.sender_email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-lg">{selectedEmail.sender_name || selectedEmail.sender_email}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan/15 text-cyan font-bold">
                          {selectedEmail.email_log ? 'Growth Tier' : 'Direct Lead'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">&lt;{selectedEmail.sender_email}&gt;</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getSentimentPill(selectedEmail.sentiment, selectedEmail.is_read)}
                    
                    <button
                      onClick={() => setShowReplyComposer(true)}
                      className="p-2 rounded-xl bg-cyan/10 hover:bg-cyan/20 border border-cyan/30 text-cyan transition cursor-pointer text-xs"
                      title="Reply to Lead"
                    >
                      <CornerUpLeft className="size-4" />
                    </button>

                    <button
                      onClick={() => {
                        setForwardToEmail('');
                        setForwardNote('');
                        setForwardSuccess(null);
                        setShowForwardModal(true);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-muted-foreground hover:text-foreground transition cursor-pointer text-xs"
                      title="Forward Email Thread"
                    >
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Metadata Info Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Last touch</span>
                    <p className="font-bold text-foreground truncate mt-0.5">{selectedEmail.subject || 'Direct Outreach'}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Lifecycle</span>
                    <p className="font-bold text-cyan mt-0.5">
                      {selectedEmail.classification === 'HUMAN_REPLY' ? 'Qualified Lead' : 'Engaged'}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Owner</span>
                    <p className="font-bold text-foreground mt-0.5">Awais Amjad</p>
                  </div>
                </div>

                {/* Message Body View */}
                {(() => {
                  const rawBody = selectedEmail.body_text || '';
                  
                  // Smart Quote Separator
                  let latestMsg = rawBody;
                  let quotedHistory = '';

                  const matchIndex = rawBody.search(/(On\s+[A-Za-z]+,?\s+[A-Za-z]+\s+\d+.*?wrote:|From:\s+.*?\nSent:|>+\s*On\s+|---------- Forwarded message ---------)/i);
                  if (matchIndex !== -1 && matchIndex > 0) {
                    latestMsg = rawBody.substring(0, matchIndex).trim();
                    quotedHistory = rawBody.substring(matchIndex).trim();
                  } else {
                    const lines = rawBody.split('\n');
                    const firstQuoteIdx = lines.findIndex(l => l.trim().startsWith('>'));
                    if (firstQuoteIdx > 0) {
                      latestMsg = lines.slice(0, firstQuoteIdx).join('\n').trim();
                      quotedHistory = lines.slice(firstQuoteIdx).join('\n').trim();
                    }
                  }

                  return (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-border space-y-4">
                      {/* Inbound Header & Timestamp */}
                      <div className="flex items-center justify-between text-xs font-mono border-b border-border/60 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">
                            {selectedEmail.sender_name || selectedEmail.sender_email}
                          </span>
                          <span className="text-muted-foreground text-xs">&lt;{selectedEmail.sender_email}&gt;</span>
                        </div>
                        <span className="text-muted-foreground text-xs font-mono">
                          {new Date(selectedEmail.received_at || selectedEmail.processed_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-cyan">
                        <span className="text-muted-foreground">Subject: </span>
                        <span className="font-bold">{selectedEmail.subject}</span>
                      </div>
                      
                      {/* Primary / Latest Lead Reply Box */}
                      <div className="p-5 rounded-2xl bg-cyan/5 border-2 border-cyan/40 text-foreground font-sans shadow-xl backdrop-blur-md space-y-2.5">
                        <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan px-3 py-1 rounded-lg bg-cyan/20 border border-cyan/40 shadow-sm">
                          <CornerUpLeft className="size-3.5" />
                          <span>Latest Lead Response</span>
                        </div>
                        <div className="text-foreground text-sm font-semibold leading-relaxed whitespace-pre-wrap tracking-normal pt-1">
                          {latestMsg || (selectedEmail.body_html ? 'HTML Content (Sanitized)' : 'No message body.')}
                        </div>
                      </div>

                      {/* Quoted Email Thread History */}
                      {quotedHistory && (
                        <details className="group border border-border/80 rounded-2xl bg-white/[0.01] overflow-hidden">
                          <summary className="px-4 py-2.5 text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-between select-none group-open:border-b group-open:border-border/60">
                            <span>📜 Quoted Email History & Original Thread</span>
                            <span className="text-[10px] text-cyan underline">Toggle History</span>
                          </summary>
                          <div className="p-4 border-l-2 border-cyan/40 text-xs text-muted-foreground/80 font-sans leading-relaxed whitespace-pre-wrap bg-black/20">
                            {quotedHistory}
                          </div>
                        </details>
                      )}

                      {/* Bounce Detail Alert */}
                      {selectedEmail.bounce_detail && (
                        <div className="p-3 rounded-xl bg-rose/10 border border-rose/30 text-xs font-mono text-rose space-y-1">
                          <p className="font-bold">Bounce Failure Code: {selectedEmail.bounce_detail.smtp_status_code}</p>
                          <p className="text-[11px]">{selectedEmail.bounce_detail.diagnostic_code}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Action Bar & Quick Reply Drawer */}
              {!showReplyComposer ? (
                <div className="border-t border-border pt-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowReplyComposer(true)}
                      className="px-4 py-2 rounded-xl bg-cyan text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer hover:bg-cyan/90 transition shadow-sm"
                    >
                      <CornerUpLeft className="size-3.5" />
                      <span>Reply to Lead</span>
                    </button>

                    <button
                      onClick={() => {
                        setForwardToEmail('');
                        setForwardNote('');
                        setForwardSuccess(null);
                        setShowForwardModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-foreground font-semibold text-xs flex items-center gap-2 cursor-pointer transition"
                    >
                      <ArrowRight className="size-3.5" />
                      <span>Forward Thread</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Quick Reply Composer */
                <form onSubmit={handleSendQuickReply} className="border-t border-border pt-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-cyan flex items-center gap-1.5">
                      <CornerUpLeft className="size-4" /> Quick Reply to Lead
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">From: {senderAddress}</span>
                      <button
                        type="button"
                        onClick={() => setShowReplyComposer(false)}
                        className="text-muted-foreground hover:text-foreground underline text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {replySuccess && (
                    <div className="p-2.5 rounded-xl bg-lime/15 border border-lime/30 text-lime text-xs font-mono">
                      {replySuccess}
                    </div>
                  )}

                  <textarea
                    id="quick-reply-textarea"
                    rows={3}
                    autoFocus
                    placeholder={`Write your direct message to ${selectedEmail.sender_email}...`}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-white/5 border border-border text-xs focus:outline-none focus:border-cyan transition-colors resize-none font-sans"
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground font-mono">Dispatched instantly via SMTP ({senderAddress})</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowReplyComposer(false)}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={sendingReply || !replyBody.trim()}
                        className="px-4 py-2 rounded-xl bg-cyan text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer hover:bg-cyan/90 disabled:opacity-50 transition"
                      >
                        {sendingReply ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                        <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2">
              <Mail className="size-12 text-cyan/50" />
              <p className="text-sm font-semibold text-muted-foreground">Select a lead thread from the left pane to read and compose replies.</p>
            </div>
          )}
        </div>
      </div>

      {/* Forward Email Modal Pop-Up */}
      {showForwardModal && selectedEmail && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl glass border border-border p-6 flex flex-col gap-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-cyan font-bold font-mono text-sm">
                <ArrowRight className="size-4" />
                <span>Forward Email Thread</span>
              </div>
              <button
                onClick={() => setShowForwardModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendForward} className="space-y-4 font-mono text-xs">
              {forwardSuccess && (
                <div className="p-3 rounded-2xl bg-lime/15 border border-lime/30 text-lime font-bold">
                  {forwardSuccess}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-muted-foreground uppercase text-[10px] font-semibold">Forward To Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@company.com, manager@firm.com"
                  value={forwardToEmail}
                  onChange={(e) => setForwardToEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-border text-xs focus:outline-none focus:border-cyan text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-muted-foreground uppercase text-[10px] font-semibold">Subject Line</label>
                <input
                  type="text"
                  readOnly
                  value={selectedEmail.subject.toLowerCase().startsWith('fwd:') ? selectedEmail.subject : `Fwd: ${selectedEmail.subject}`}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-border/50 text-xs text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-muted-foreground uppercase text-[10px] font-semibold">Add Forwarding Note (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Hey, please check out this lead reply..."
                  value={forwardNote}
                  onChange={(e) => setForwardNote(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-border text-xs focus:outline-none focus:border-cyan resize-none font-sans text-foreground"
                />
              </div>

              {/* Quoted Message Preview */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-border space-y-1 text-[11px] text-muted-foreground max-h-36 overflow-y-auto scrollbar-thin">
                <p className="font-bold text-foreground">---------- Forwarded message ---------</p>
                <p>From: {selectedEmail.sender_name || selectedEmail.sender_email} &lt;{selectedEmail.sender_email}&gt;</p>
                <p>Subject: {selectedEmail.subject}</p>
                <p className="pt-1 whitespace-pre-wrap font-sans">{selectedEmail.body_text || 'No message text.'}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-muted-foreground">From: {senderAddress}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForwardModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingForward || !forwardToEmail.trim()}
                    className="px-5 py-2 rounded-xl bg-cyan text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer hover:bg-cyan/90 disabled:opacity-50 transition"
                  >
                    {sendingForward ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                    <span>{sendingForward ? 'Forwarding...' : 'Send Forward'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
