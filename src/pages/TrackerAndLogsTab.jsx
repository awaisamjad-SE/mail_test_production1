import { useState, useEffect, useRef } from 'react';
import { LineChart as LineChartIcon, ScrollText, RefreshCw, Trash2, Loader2, MessageSquare, ChevronLeft, ChevronRight, Search, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import * as api from '../utils/api';
import imgTracker from '../assets/snippet-tracker.jpg';
import CampaignDetailPage from './CampaignDetailPage';

export default function TrackerAndLogsTab({ onNavigateToInbox }) {
  const [activeSubTab, setActiveSubTab] = useState('campaigns'); // 'campaigns' vs 'individual'

  // Campaigns State
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [inboundReplies, setInboundReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Individual Email Logs State (Paginated)
  const [emailLogs, setEmailLogs] = useState([]);
  const [logsTotalCount, setLogsTotalCount] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearch, setLogsSearch] = useState('');
  const [logsStatusFilter, setLogsStatusFilter] = useState('');

  const pollIntervalRef = useRef(null);

  const fetchCampaigns = async () => {
    try {
      const data = await api.fetchCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
      setRefreshing(false);
    }
  };

  const fetchIndividualLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const res = await api.fetchEmailLogs({
        page,
        page_size: 10,
        search: logsSearch,
        status: logsStatusFilter
      });
      setEmailLogs(res.results || []);
      setLogsTotalCount(res.total_count || 0);
      setLogsPage(res.page || page);
    } catch (err) {
      console.error('Error fetching email logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();

    pollIntervalRef.current = setInterval(async () => {
      try {
        const freshCampaigns = await api.fetchCampaigns();
        setCampaigns(freshCampaigns);
      } catch (e) {
        console.error('Failed to poll campaigns:', e);
      }
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeSubTab === 'individual') {
      fetchIndividualLogs(1);
    }
  }, [activeSubTab, logsSearch, logsStatusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (activeSubTab === 'campaigns') {
      fetchCampaigns();
    } else {
      fetchIndividualLogs(logsPage);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this marketing campaign?')) return;
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

  const handleOpenReplies = (campaign) => {
    setSelectedCampaign(campaign);
    window.history.pushState({}, '', `/campaigns/${campaign.id}`);
  };

  const getStatusPill = (status) => {
    const map = {
      Completed: { c: "lime", label: "Completed", dot: false },
      Failed: { c: "rose", label: "Failed", dot: false },
      Processing: { c: "cyan", label: "Active", dot: true },
      SENT: { c: "lime", label: "Sent", dot: false },
      PENDING: { c: "cyan", label: "Pending", dot: true },
    };
    const x = map[status] || { c: "amber", label: status, dot: false };
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-md font-mono"
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

  const logsTotalPages = Math.ceil(logsTotalCount / 10) || 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-2">05 · Telemetry & Audit</div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
            Tracker & <span className="gradient-text">audit logs</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Monitor bulk marketing campaigns or audit individual 1-on-1 Quick Sends with full pagination.
          </p>
        </div>

        {/* Sub-Tab Selector */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl glass border border-border">
          <button
            onClick={() => setActiveSubTab('campaigns')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'campaigns' ? 'bg-cyan text-zinc-950 shadow-md font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LineChartIcon className="size-3.5" />
            <span>Marketing Campaigns</span>
          </button>
          <button
            onClick={() => setActiveSubTab('individual')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'individual' ? 'bg-cyan text-zinc-950 shadow-md font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ScrollText className="size-3.5" />
            <span>Individual Sends Log</span>
          </button>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer transition"
            title="Refresh List"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Marketing Campaigns */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-6">
          {loadingCampaigns ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 text-cyan animate-spin" />
              <p className="text-xs font-mono text-muted-foreground">Loading marketing campaign telemetry...</p>
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {campaigns.map((c) => {
                const completedCount = c.successful_count + c.failed_count;
                const progressPct = c.total_recipients > 0 ? Math.round((completedCount / c.total_recipients) * 100) : 0;
                const replyRatePct = c.successful_count > 0 ? Math.round(((c.replied_count || 0) / c.successful_count) * 100) : 0;

                return (
                  <div key={c.id} className="rounded-3xl glass border border-border p-6 space-y-4 hover:border-cyan/35 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                      <div>
                        <h3 className="font-display font-semibold text-lg">{c.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          ID: {c.id} · Type: <span className="text-cyan font-bold">{c.campaign_type}</span> · Created: {new Date(c.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusPill(c.status)}
                        <button
                          onClick={() => handleOpenReplies(c)}
                          className="px-3 py-1.5 rounded-xl bg-cyan/10 border border-cyan/30 text-cyan text-xs font-semibold hover:bg-cyan/20 cursor-pointer transition flex items-center gap-1.5"
                        >
                          <MessageSquare className="size-3.5" />
                          <span>View Replies ({c.replied_count || 0})</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(c.id)}
                          className="p-2 rounded-xl bg-white/5 border border-border text-rose hover:bg-rose/10 cursor-pointer transition"
                          title="Delete Campaign"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
                      <div className="rounded-2xl border border-border bg-white/[0.01] p-3">
                        <p className="text-muted-foreground text-[10px] uppercase">Recipients</p>
                        <p className="text-lg font-bold mt-0.5">{c.total_recipients}</p>
                      </div>
                      <div className="rounded-2xl border border-lime/30 bg-lime/5 p-3">
                        <p className="text-lime text-[10px] uppercase">Delivered</p>
                        <p className="text-lg font-bold mt-0.5 text-lime">{c.successful_count}</p>
                      </div>
                      <div className="rounded-2xl border border-cyan/30 bg-cyan/5 p-3">
                        <p className="text-cyan text-[10px] uppercase">Replied ({replyRatePct}%)</p>
                        <p className="text-lg font-bold mt-0.5 text-cyan">{c.replied_count || 0}</p>
                      </div>
                      <div className="rounded-2xl border border-rose/30 bg-rose/5 p-3">
                        <p className="text-rose text-[10px] uppercase">Bounced</p>
                        <p className="text-lg font-bold mt-0.5 text-rose">{c.bounced_count || 0}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-bold">{progressPct}% ({completedCount} / {c.total_recipients})</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-border">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-lime to-cyan transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl glass border border-border p-12 text-center text-muted-foreground text-xs font-mono">
              No marketing campaigns found. Create a campaign from the Campaigns Hub.
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Individual Sends Log (Paginated) */}
      {activeSubTab === 'individual' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search recipient or subject..."
                value={logsSearch}
                onChange={(e) => setLogsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/5 border border-border text-xs focus:outline-none focus:border-cyan transition"
              />
            </div>
            <select
              value={logsStatusFilter}
              onChange={(e) => setLogsStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-2xl bg-white/5 border border-border text-xs font-mono focus:outline-none focus:border-cyan"
            >
              <option value="">All Statuses</option>
              <option value="SENT">SENT</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          {/* Table */}
          <div className="rounded-3xl glass border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-white/[0.02] text-[11px] font-mono text-muted-foreground uppercase">
                    <th className="p-4">Recipient</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Reply Status</th>
                    <th className="p-4">Dispatched At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-mono">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-muted-foreground">
                        <Loader2 className="size-6 text-cyan animate-spin mx-auto mb-2" />
                        Fetching individual send logs...
                      </td>
                    </tr>
                  ) : emailLogs.length > 0 ? (
                    emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-4 font-bold text-foreground">{log.recipient}</td>
                        <td className="p-4 text-muted-foreground max-w-xs truncate">{log.subject}</td>
                        <td className="p-4">
                          {getStatusPill(log.status)}
                          {log.error_message && (
                            <p className="text-[10px] text-rose/90 font-mono mt-1 max-w-xs truncate" title={log.error_message}>
                              {log.error_message}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.reply_status === 'REPLIED' ? 'bg-lime/20 text-lime' :
                            log.reply_status === 'BOUNCED' ? 'bg-rose/20 text-rose' : 'bg-white/5 text-muted-foreground'
                          }`}>
                            {log.reply_status || 'NO_REPLY'}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'Pending'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-muted-foreground">
                        No individual send logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-border flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">
                Showing Page {logsPage} of {logsTotalPages} ({logsTotalCount} total logs)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchIndividualLogs(logsPage - 1)}
                  disabled={logsPage <= 1 || logsLoading}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="size-3.5" /> Previous
                </button>
                <button
                  onClick={() => fetchIndividualLogs(logsPage + 1)}
                  disabled={logsPage >= logsTotalPages || logsLoading}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  Next <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inbound Replies Modal Drawer */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[85vh] rounded-3xl glass border border-border p-6 flex flex-col gap-4 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-display font-bold">Replies for "{selectedCampaign.name}"</h3>
                <p className="text-xs text-muted-foreground font-mono">IMAP Synced Threads ({inboundReplies.length})</p>
              </div>
              <button onClick={() => setSelectedCampaign(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs cursor-pointer">
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {loadingReplies ? (
                <div className="py-20 text-center text-xs text-muted-foreground font-mono">Loading replies...</div>
              ) : inboundReplies.length > 0 ? (
                inboundReplies.map((reply) => (
                  <div key={reply.id} className="p-4 rounded-2xl bg-white/[0.02] border border-border space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{reply.sender_name || reply.sender_email}</span>
                      <span className="text-muted-foreground">{new Date(reply.received_at || reply.processed_at).toLocaleString()}</span>
                    </div>
                    <p className="font-semibold text-foreground">Subject: {reply.subject}</p>
                    <p className="p-3 rounded-xl bg-black/40 text-muted-foreground font-sans leading-relaxed whitespace-pre-wrap">
                      {reply.body_text || 'No text content.'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-xs text-muted-foreground font-mono">No replies found for this campaign.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
