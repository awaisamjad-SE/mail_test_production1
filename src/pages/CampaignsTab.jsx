import { useState, useEffect, useRef } from 'react';
import { Mail, Clock, CheckCircle2, AlertTriangle, Loader2, Trash2, RefreshCw, MessageSquare, AlertOctagon, CornerUpLeft, Eye } from 'lucide-react';
import * as api from '../utils/api';
import imgTracker from '../assets/snippet-tracker.jpg';
import CampaignDetailPage from './CampaignDetailPage';

export default function CampaignsTab({ onNavigateToInbox }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingInbox, setSyncingInbox] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  
  // Selected Campaign Details & Telemetry View
  const [selectedCampaign, setSelectedCampaign] = useState(null);

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
      try {
        const freshCampaigns = await api.fetchCampaigns();
        setCampaigns(freshCampaigns);
      } catch (e) {
        if (e.response?.status === 401) {
          clearInterval(pollIntervalRef.current);
        } else {
          console.error('Failed to poll campaigns:', e);
        }
      }
    }, 5000);

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

  const handleOpenReplies = (campaign) => {
    setSelectedCampaign(campaign);
    window.history.pushState({}, '', `/campaigns/${campaign.id}`);
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

  if (selectedCampaign) {
    return (
      <CampaignDetailPage 
        campaignId={selectedCampaign.id} 
        onBack={() => {
          setSelectedCampaign(null);
          window.history.pushState({}, '', '/dashboard');
        }} 
        onNavigateToInbox={onNavigateToInbox}
      />
    );
  }

        {/* Executive Scorecards (4 Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-border space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground uppercase font-semibold">
              <span>Target Leads</span>
              <Mail className="size-4 text-cyan" />
            </div>
            <div className="text-2xl font-bold font-display text-foreground">{selectedCampaign.total_recipients}</div>
            <p className="text-[11px] text-muted-foreground">100% Enqueued</p>
          </div>

          <div className="p-5 rounded-2xl bg-lime/5 border border-lime/30 space-y-1">
            <div className="flex items-center justify-between text-xs text-lime uppercase font-semibold">
              <span>Delivery Rate</span>
              <CheckCircle2 className="size-4 text-lime" />
            </div>
            <div className="text-2xl font-bold font-display text-lime">{delivRate}%</div>
            <p className="text-[11px] text-muted-foreground">{selectedCampaign.successful_count} Dispatched Successfully</p>
          </div>

          <div className="p-5 rounded-2xl bg-cyan/5 border border-cyan/30 space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan uppercase font-semibold">
              <span>Lead Reply Ratio</span>
              <MessageSquare className="size-4 text-cyan" />
            </div>
            <div className="text-2xl font-bold font-display text-cyan">{replyRate}%</div>
            <p className="text-[11px] text-cyan font-semibold">{selectedCampaign.replied_count || 0} Inbound Replies Received</p>
          </div>

          <div className="p-5 rounded-2xl bg-rose/5 border border-rose/30 space-y-1">
            <div className="flex items-center justify-between text-xs text-rose uppercase font-semibold">
              <span>Bounce Rate</span>
              <AlertTriangle className="size-4 text-rose" />
            </div>
            <div className="text-2xl font-bold font-display text-rose">{bounceRate}%</div>
            <p className="text-[11px] text-rose font-semibold">{selectedCampaign.bounced_count || 0} Delivery Bounces</p>
          </div>
        </div>

        {/* Delivery Progress & Funnel Monitor */}
        <div className="p-6 rounded-3xl glass border border-border space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground uppercase tracking-wider">Campaign Dispatch & Deliverability Funnel</span>
            <span className="text-cyan font-semibold">{selectedCampaign.successful_count} / {selectedCampaign.total_recipients} Dispatched</span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex">
            <div className="h-full bg-lime transition-all duration-500" style={{ width: `${delivRate}%` }} />
            <div className="h-full bg-rose transition-all duration-500" style={{ width: `${bounceRate}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 flex-wrap gap-2">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-lime" /> Delivered ({selectedCampaign.successful_count})</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose" /> Bounced ({selectedCampaign.bounced_count || 0})</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-cyan" /> Replies ({selectedCampaign.replied_count || 0})</span>
          </div>
        </div>

        {/* Multi-Tab Telemetry Inspector */}
        <div className="space-y-4">
          <div className="flex border-b border-border text-xs font-mono gap-2">
            <button
              onClick={() => setActiveModalTab('RECIPIENTS')}
              className={`px-5 py-3 font-bold border-b-2 transition-colors cursor-pointer text-sm ${
                activeModalTab === 'RECIPIENTS'
                  ? 'border-cyan text-cyan bg-cyan/10 rounded-t-xl'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              📋 Target Recipients & Audit Logs ({campaignLogs.length})
            </button>
            <button
              onClick={() => setActiveModalTab('REPLIES')}
              className={`px-5 py-3 font-bold border-b-2 transition-colors cursor-pointer text-sm ${
                activeModalTab === 'REPLIES'
                  ? 'border-cyan text-cyan bg-cyan/10 rounded-t-xl'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              💬 Inbound Lead Threads ({inboundReplies.length})
            </button>
          </div>

          {/* Tab Content */}
          {loadingReplies ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 text-cyan animate-spin" />
              <p className="text-xs text-muted-foreground font-mono">Fetching campaign telemetry & bounce audit logs...</p>
            </div>
          ) : activeModalTab === 'RECIPIENTS' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <input
                  type="text"
                  placeholder="Search recipient email, subject, or error code..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-border text-xs focus:outline-none focus:border-cyan font-mono w-full max-w-md"
                />
                <span className="text-xs font-mono text-muted-foreground">Showing {filteredLogs.length} logs</span>
              </div>

              {filteredLogs.length > 0 ? (
                <div className="space-y-3">
                  {filteredLogs.map(log => (
                    <div key={log.id} className="p-4 rounded-2xl bg-white/[0.02] border border-border space-y-2 text-xs font-mono hover:border-cyan/30 transition">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">{log.recipient_name || log.recipient}</span>
                          <span className="text-muted-foreground">&lt;{log.recipient}&gt;</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            log.status === 'SENT' ? 'bg-lime/20 text-lime border border-lime/30' :
                            log.status === 'FAILED' ? 'bg-rose/20 text-rose border border-rose/30' : 'bg-amber/20 text-amber'
                          }`}>
                            {log.status}
                          </span>
                          {log.reply_status !== 'NO_REPLY' && (
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              log.reply_status === 'REPLIED' ? 'bg-cyan/20 text-cyan border border-cyan/30' :
                              log.reply_status === 'BOUNCED' ? 'bg-rose/20 text-rose border border-rose/30' : 'bg-amber/20 text-amber'
                            }`}>
                              {log.reply_status}
                            </span>
                          )}
                          <span className="text-muted-foreground text-xs">
                            {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'Pending'}
                          </span>
                        </div>
                      </div>

                      <div className="text-muted-foreground text-xs">
                        Subject: <span className="text-foreground font-semibold">{log.subject}</span>
                      </div>

                      {log.error_message && (
                        <div className="p-3 rounded-xl bg-rose/10 border border-rose/30 text-xs text-rose space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <AlertOctagon className="size-3.5" /> Bounce / Delivery Diagnostic Error:
                          </p>
                          <p className="leading-relaxed font-sans">{log.error_message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-muted-foreground font-mono">
                  No recipient logs found matching "{logSearchQuery}".
                </div>
              )}
            </div>
          ) : (
            /* Inbound Replies Tab */
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap text-xs font-mono">
                {['ALL', 'HUMAN_REPLY', 'BOUNCE'].map(filterKey => (
                  <button
                    key={filterKey}
                    onClick={() => setActiveReplyFilter(filterKey)}
                    className={`px-3.5 py-1.5 rounded-xl border transition-colors cursor-pointer text-xs ${
                      activeReplyFilter === filterKey 
                        ? 'bg-cyan/20 border-cyan text-cyan font-bold' 
                        : 'bg-white/5 border-border text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    {filterKey === 'ALL' ? 'All Replies' : filterKey}
                  </button>
                ))}
              </div>

              {filteredInboundReplies.length > 0 ? (
                filteredInboundReplies.map((reply) => (
                  <div key={reply.id} className="p-5 rounded-2xl bg-white/[0.02] border border-border space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{reply.sender_name || reply.sender_email}</span>
                        <span className="text-muted-foreground">&lt;{reply.sender_email}&gt;</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          reply.classification === 'HUMAN_REPLY' ? 'bg-lime/20 text-lime border border-lime/30' :
                          reply.classification === 'BOUNCE' ? 'bg-rose/20 text-rose border border-rose/30' : 'bg-amber/20 text-amber'
                        }`}>
                          {reply.classification}
                        </span>
                        <span className="text-muted-foreground">{new Date(reply.received_at || reply.processed_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-cyan">Subject: {reply.subject}</div>

                    {/* Reply Body */}
                    <div className="p-4 rounded-2xl bg-cyan/5 border-2 border-cyan/40 text-foreground text-sm font-semibold leading-relaxed whitespace-pre-wrap">
                      {reply.body_text || 'HTML Content (Sanitized)'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-xs text-muted-foreground font-mono">
                  No incoming email replies matching filter "{activeReplyFilter}".
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

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
            const total = c.total_recipients || 1;
            const completedCount = c.successful_count + c.failed_count;
            const progressPct = Math.round((completedCount / total) * 100);
            
            const deliveryRatePct = Math.round((c.successful_count / total) * 100);
            const replyRatePct = Math.round(((c.replied_count || 0) / total) * 100);
            const bounceRatePct = Math.round(((c.bounced_count || 0) / total) * 100);

            return (
              <div key={c.id} className="rounded-3xl glass border border-border p-6 space-y-4 hover:border-cyan/35 transition animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="space-y-1 cursor-pointer" onClick={() => handleOpenReplies(c)}>
                    <h3 className="font-display font-semibold text-lg hover:text-cyan transition-colors flex items-center gap-2">
                      <span>{c.name}</span>
                      <span className="text-xs font-mono text-cyan underline font-normal">(Click to open Observability Console)</span>
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      ID: {c.id} · Type: <span className="text-cyan font-bold">{c.campaign_type}</span> · Created: {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {getStatusPill(c.status)}
                    <button
                      onClick={() => handleOpenReplies(c)}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan/15 border border-cyan/40 text-cyan text-xs font-bold hover:bg-cyan/25 cursor-pointer transition-colors flex items-center gap-2"
                    >
                      <Eye className="size-3.5" />
                      <span>Details & Telemetry</span>
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
                  <div className="rounded-2xl border border-lime/30 bg-lime/5 p-3 text-center">
                    <p className="text-lime text-[10px] font-semibold uppercase tracking-wider">Delivered ({deliveryRatePct}%)</p>
                    <p className="text-lg font-bold mt-1 text-lime">{c.successful_count}</p>
                  </div>
                  <div className="rounded-2xl border border-cyan/30 bg-cyan/5 p-3 text-center">
                    <p className="text-cyan text-[10px] font-semibold uppercase tracking-wider">Replied ({replyRatePct}%)</p>
                    <p className="text-lg font-bold mt-1 text-cyan">{c.replied_count || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-rose/30 bg-rose/5 p-3 text-center">
                    <p className="text-rose text-[10px] font-semibold uppercase tracking-wider">Bounced ({bounceRatePct}%)</p>
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
                    <span className="text-muted-foreground">Dispatch Progress</span>
                    <span className="font-bold">{progressPct}% ({completedCount} / {c.total_recipients})</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/5 overflow-hidden border border-border flex">
                    <div 
                      className="h-full bg-lime transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.round((c.successful_count / total) * 100))}%` }} 
                      title="Successful Sends"
                    />
                    <div 
                      className="h-full bg-rose transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.round((c.failed_count / total) * 100))}%` }} 
                      title="Bounces / Failures"
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
    </div>
  );
}


