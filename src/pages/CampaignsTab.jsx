import { useState, useEffect, useRef } from 'react';
import { Mail, Clock, CheckCircle2, AlertTriangle, Loader2, Trash2, RefreshCw, MessageSquare, AlertOctagon, CornerUpLeft, Eye } from 'lucide-react';
import * as api from '../utils/api';
import imgTracker from '../assets/snippet-tracker.jpg';

export default function CampaignsTab() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingInbox, setSyncingInbox] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  
  // Selected Campaign Inbound Replies View
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [inboundReplies, setInboundReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [activeReplyFilter, setActiveReplyFilter] = useState('ALL');

  const pollIntervalRef = useRef(null);

  const fetchCampaigns = async () => {
    try {
      const data = await api.fetchCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();

    pollIntervalRef.current = setInterval(async () => {
      let hasProcessing = false;
      
      setCampaigns(prev => {
        hasProcessing = prev.some(c => c.status === 'Processing');
        return prev;
      });

      if (hasProcessing) {
        try {
          const freshCampaigns = await api.fetchCampaigns();
          setCampaigns(freshCampaigns);
        } catch (e) {
          console.error('Failed to poll campaigns:', e);
        }
      }
    }, 4000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  const handleManualSync = async () => {
    setSyncingInbox(true);
    setSyncMessage(null);
    try {
      const res = await api.triggerInboxSync();
      const count = res.details?.processed_count || 0;
      setSyncMessage(`Inbox sync finished! Processed ${count} new incoming message(s).`);
      fetchCampaigns();
    } catch (err) {
      setSyncMessage(`Sync failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setSyncingInbox(false);
    }
  };

  const handleOpenReplies = async (campaign) => {
    setSelectedCampaign(campaign);
    setLoadingReplies(true);
    try {
      const res = await api.fetchInboundEmails({ campaign: campaign.id });
      setInboundReplies(res.results || res);
    } catch (err) {
      console.error('Failed to load campaign replies:', err);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This will delete all associated logs.')) return;
    try {
      await api.deleteCampaign(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null);
      }
    } catch (err) {
      alert('Failed to delete campaign: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 text-cyan animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Loading campaign tracker telemetry...</p>
      </div>
    );
  }

  const getStatusPill = (status) => {
    const map = {
      Completed: { c: "lime", label: "Completed", dot: false },
      Failed: { c: "rose", label: "Failed", dot: false },
      Processing: { c: "cyan", label: "Active", dot: true },
    };
    const x = map[status] || { c: "amber", label: status, dot: false };
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-mono"
        style={{ background: `oklch(from var(--${x.c}) l c h / 0.15)`, color: `var(--${x.c})` }}>
        {x.dot && <span className="size-1.5 rounded-full animate-pulse" style={{ background: `var(--${x.c})` }} />}
        {x.label}
      </span>
    );
  };

  const filteredInboundReplies = inboundReplies.filter(r => {
    if (activeReplyFilter === 'ALL') return true;
    return r.classification === activeReplyFilter || r.sentiment === activeReplyFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-2">05 · Live</div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
            Campaign <span className="gradient-text">tracker & replies</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Monitor active dispatch jobs, delivery throughput, IMAP response rates, hard/soft bounces, and sentiment telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleManualSync}
            disabled={syncingInbox}
            className="px-3.5 py-2 rounded-xl bg-cyan/10 hover:bg-cyan/20 border border-cyan/30 text-cyan text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className={`size-3.5 ${syncingInbox ? 'animate-spin' : ''}`} /> 
            <span>{syncingInbox ? 'Syncing IMAP...' : 'Sync Inboxes Now'}</span>
          </button>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} /> 
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-4 rounded-2xl bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono flex items-center justify-between">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Banner */}
      <div className="relative h-48 lg:h-56 rounded-3xl overflow-hidden border border-border group">
        <img src={imgTracker} alt="Campaign telemetry tracker" loading="lazy" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative h-full p-6 lg:p-8 flex items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-cyan px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20">
              <span className="size-1.5 rounded-full bg-cyan animate-pulse" /> IMAP Monitoring Engine
            </div>
            <h2 className="mt-3 font-display text-xl lg:text-2xl font-semibold max-w-md">Live campaign response, bounce, and thread tracking.</h2>
          </div>
          <div className="hidden md:grid grid-cols-4 gap-6 pr-2">
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">{campaigns.filter(c => c.status === 'Processing').length}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Active</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-lime">{campaigns.reduce((acc, c) => acc + (c.replied_count || 0), 0)}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Replies</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-rose">{campaigns.reduce((acc, c) => acc + (c.bounced_count || 0), 0)}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Bounces</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">{campaigns.length}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Pools</div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Listing */}
      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {campaigns.map((c) => {
            const completedCount = c.successful_count + c.failed_count;
            const progressPct = c.total_recipients > 0 
              ? Math.round((completedCount / c.total_recipients) * 100) 
              : 0;

            const replyRatePct = c.successful_count > 0
              ? Math.round(((c.replied_count || 0) / c.successful_count) * 100)
              : 0;

            return (
              <div key={c.id} className="rounded-3xl glass border border-border p-6 space-y-4 hover:border-cyan/35 transition animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="space-y-1">
                    <h3 className="font-display font-semibold text-lg">{c.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      ID: {c.id} · Type: <span className="text-cyan font-bold">{c.campaign_type}</span> · Created: {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {getStatusPill(c.status)}
                    <button
                      onClick={() => handleOpenReplies(c)}
                      className="px-3 py-1.5 rounded-xl bg-cyan/10 border border-cyan/30 text-cyan text-xs font-semibold hover:bg-cyan/20 cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="size-3.5" />
                      <span>View Replies ({c.replied_count || 0})</span>
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 rounded-xl bg-white/5 border border-border text-rose hover:bg-rose/10 cursor-pointer transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
                  <div className="rounded-2xl border border-border bg-white/[0.01] p-3 text-center">
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Recipients</p>
                    <p className="text-lg font-bold mt-1">{c.total_recipients}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white/[0.01] p-3 text-center">
                    <p className="text-lime text-[10px] font-semibold uppercase tracking-wider">Delivered</p>
                    <p className="text-lg font-bold mt-1 text-lime">{c.successful_count}</p>
                  </div>
                  <div className="rounded-2xl border border-cyan/30 bg-cyan/5 p-3 text-center">
                    <p className="text-cyan text-[10px] font-semibold uppercase tracking-wider">Replied ({replyRatePct}%)</p>
                    <p className="text-lg font-bold mt-1 text-cyan">{c.replied_count || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-rose/30 bg-rose/5 p-3 text-center">
                    <p className="text-rose text-[10px] font-semibold uppercase tracking-wider">Bounced</p>
                    <p className="text-lg font-bold mt-1 text-rose">{c.bounced_count || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-amber/30 bg-amber/5 p-3 text-center col-span-2 sm:col-span-1">
                    <p className="text-amber text-[10px] font-semibold uppercase tracking-wider">Auto-Reply / OOO</p>
                    <p className="text-lg font-bold mt-1 text-amber">{c.auto_reply_count || 0}</p>
                  </div>
                </div>

                {/* Progress Tracks */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-muted-foreground">Sending Progress</span>
                    <span className="font-bold">{progressPct}% ({completedCount} / {c.total_recipients})</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-border">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-lime to-cyan transition-all duration-500"
                      style={{ 
                        width: `${progressPct}%`,
                        background: c.status === 'Failed' ? 'var(--rose)' : undefined 
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl glass border border-border p-12 text-center space-y-2">
          <p className="text-muted-foreground text-sm font-semibold">No active or historic campaigns found.</p>
          <p className="text-muted-foreground/60 text-xs">Deploy a batch email campaign or send a quick email, and the tracking console will display live statistics here.</p>
        </div>
      )}

      {/* Inbound Replies Modal Drawer */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[85vh] rounded-3xl glass border border-border p-6 flex flex-col gap-4 overflow-hidden shadow-2xl animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-display font-bold">Replies for "{selectedCampaign.name}"</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  IMAP Synced Threads · Total Captured: {inboundReplies.length}
                </p>
              </div>
              <button 
                onClick={() => setSelectedCampaign(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap text-xs font-mono">
              {['ALL', 'HUMAN_REPLY', 'INTERESTED', 'NOT_INTERESTED', 'UNSUBSCRIBE', 'AUTO_REPLY', 'BOUNCE'].map(filterKey => (
                <button
                  key={filterKey}
                  onClick={() => setActiveReplyFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                    activeReplyFilter === filterKey 
                      ? 'bg-cyan/20 border-cyan text-cyan font-bold' 
                      : 'bg-white/5 border-border text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {loadingReplies ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="size-8 text-cyan animate-spin" />
                  <p className="text-xs text-muted-foreground font-mono">Fetching campaign email threads...</p>
                </div>
              ) : filteredInboundReplies.length > 0 ? (
                filteredInboundReplies.map((reply) => (
                  <div key={reply.id} className="p-4 rounded-2xl bg-white/[0.02] border border-border space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{reply.sender_name || reply.sender_email}</span>
                        <span className="text-muted-foreground">&lt;{reply.sender_email}&gt;</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          reply.classification === 'HUMAN_REPLY' ? 'bg-lime/20 text-lime' :
                          reply.classification === 'BOUNCE' ? 'bg-rose/20 text-rose' : 'bg-amber/20 text-amber'
                        }`}>
                          {reply.classification}
                        </span>
                        {reply.sentiment !== 'UNKNOWN' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan/20 text-cyan font-bold">
                            {reply.sentiment}
                          </span>
                        )}
                        <span className="text-muted-foreground">{new Date(reply.received_at || reply.processed_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-foreground/90 font-mono">Subject: {reply.subject}</p>
                    
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-muted-foreground font-sans leading-relaxed whitespace-pre-wrap">
                      {reply.body_text || (reply.body_html ? 'HTML Content (Sanitized)' : 'No message body.')}
                    </div>

                    {reply.bounce_detail && (
                      <div className="p-2.5 rounded-xl bg-rose/10 border border-rose/30 text-[11px] font-mono text-rose space-y-1">
                        <p className="font-bold">Bounce Detail ({reply.bounce_detail.bounce_type}):</p>
                        <p>{reply.bounce_detail.diagnostic_code || 'SMTP failure code ' + reply.bounce_detail.smtp_status_code}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-xs text-muted-foreground font-mono">
                  No incoming email replies matching filter "{activeReplyFilter}".
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

