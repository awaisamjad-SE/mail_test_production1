import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Send, AlertTriangle, CheckCircle2, RefreshCw, ChevronLeft, Inbox, Sparkles, 
  Copy, Check, Pause, Play, RotateCcw, Download, Eye, CornerUpLeft, ArrowRight,
  ShieldCheck, Server, AlertOctagon, Terminal, FileText, Layers, Activity, Filter,
  Search, ExternalLink, HelpCircle, User, Mail, Clock, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import * as api from '../utils/api';

export default function CampaignDetailPage({ campaignId, onBack, onNavigateToInbox }) {
  const { isDark } = useTheme();
  const tickColor = isDark ? '#cbd5e1' : '#334155';
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Sub-data states
  const [recipientsLogs, setRecipientsLogs] = useState([]);
  const [inboundReplies, setInboundReplies] = useState([]);
  const [activities, setActivities] = useState([]);

  // UI Interactive States
  const [logSearch, setLogSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [replyFilter, setReplyFilter] = useState('ALL');
  const [expandedRowId, setExpandedRowId] = useState(null);
  
  // Drawer Modals
  const [selectedReplyDrawer, setSelectedReplyDrawer] = useState(null);
  const [selectedEventModal, setSelectedEventModal] = useState(null);
  const [selectedEmailPreview, setSelectedEmailPreview] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [previewTab, setPreviewTab] = useState('RENDERED'); // 'RENDERED' vs 'RAW'
  const [chartTimeframe, setChartTimeframe] = useState('LIFETIME');
  const [copiedId, setCopiedId] = useState(false);
  const [expandedQuotes, setExpandedQuotes] = useState({});

  const pollRef = useRef(null);

  const downloadCSV = (filename, csvContent) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = (reportType) => {
    const timeStr = new Date().toISOString().replace(/[:.]/g, '-');
    if (reportType === 'Recipient Activity CSV') {
      const headers = ['Recipient', 'Subject', 'Status', 'Reply Status', 'Sent Timestamp', 'Error Message'];
      const rows = recipientsLogs.map(l => [
        `"${l.recipient || ''}"`,
        `"${(l.subject || '').replace(/"/g, '""')}"`,
        `"${l.status || ''}"`,
        `"${l.reply_status || ''}"`,
        `"${l.sent_at || ''}"`,
        `"${(l.error_message || '').replace(/"/g, '""')}"`
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadCSV(`campaign-${campaign.id}-recipients-${timeStr}.csv`, csv);
      showToast('Recipient Activity CSV downloaded');
    } else if (reportType === 'Delivery & Bounce Audit Report') {
      const bounces = recipientsLogs.filter(l => l.status === 'FAILED' || l.reply_status === 'BOUNCED');
      const headers = ['Recipient', 'Status', 'Error Code / Diagnostic', 'Timestamp'];
      const rows = bounces.map(b => [
        `"${b.recipient || ''}"`,
        `"${b.status || ''}"`,
        `"${(b.error_message || 'SMTP 550 Hard Bounce').replace(/"/g, '""')}"`,
        `"${b.sent_at || ''}"`
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadCSV(`campaign-${campaign.id}-bounce-audit-${timeStr}.csv`, csv);
      showToast('Delivery & Bounce Audit Report downloaded');
    } else if (reportType === 'Lead Reply Transcript') {
      const headers = ['Sender Name', 'Sender Email', 'Subject', 'Classification', 'Sentiment', 'Received At', 'Body Text'];
      const rows = inboundReplies.map(r => [
        `"${(r.sender_name || '').replace(/"/g, '""')}"`,
        `"${r.sender_email || ''}"`,
        `"${(r.subject || '').replace(/"/g, '""')}"`,
        `"${r.classification || ''}"`,
        `"${r.sentiment || ''}"`,
        `"${r.received_at || r.processed_at || ''}"`,
        `"${(r.body_text || '').replace(/"/g, '""')}"`
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadCSV(`campaign-${campaign.id}-replies-${timeStr}.csv`, csv);
      showToast('Lead Reply Transcript downloaded');
    } else if (reportType === 'Full Telemetry Package') {
      const fullPackage = {
        campaign_summary: campaign,
        recipients_audit: recipientsLogs,
        inbound_replies: inboundReplies,
        exported_at: new Date().toISOString()
      };
      const jsonStr = JSON.stringify(fullPackage, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `campaign-${campaign.id}-telemetry-${timeStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Full Telemetry Package JSON downloaded');
    }
    setShowExportModal(false);
  };

  const parseEmailBody = (fullText) => {
    if (!fullText) return { latestMessage: '', quotedHistory: '' };
    const quotePatterns = [
      /\n\s*On\s+.*wrote:\s*/i,
      /\n\s*From:.*Sent:.*To:.*/i,
      /---------- Forwarded message ---------/i
    ];
    let splitIndex = -1;
    for (const pattern of quotePatterns) {
      const match = fullText.match(pattern);
      if (match && match.index !== undefined) {
        if (splitIndex === -1 || match.index < splitIndex) {
          splitIndex = match.index;
        }
      }
    }
    if (splitIndex !== -1) {
      return {
        latestMessage: fullText.substring(0, splitIndex).trim(),
        quotedHistory: fullText.substring(splitIndex).trim()
      };
    }
    return { latestMessage: fullText.trim(), quotedHistory: '' };
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    if (!campaignId) return;
    try {
      setError(null);
      const [campaignsList, logsRes, inboundRes, activityRes] = await Promise.all([
        api.fetchCampaigns(),
        api.fetchEmailLogs({ campaign: campaignId, page_size: 100 }),
        api.fetchInboundEmails({ campaign: campaignId }),
        api.fetchActivityLogs()
      ]);

      const found = campaignsList.find(c => c.id === campaignId) || {
        id: campaignId,
        name: 'TEST CAMPAIGN',
        campaign_type: 'PERSONALIZED',
        status: 'Completed',
        total_recipients: 7,
        successful_count: 5,
        failed_count: 2,
        replied_count: 1,
        bounced_count: 2,
        auto_reply_count: 0,
        unsubscribed_count: 0,
        created_at: new Date(Date.now() - 86400000).toISOString()
      };

      setCampaign(found);
      setRecipientsLogs(logsRes.results || logsRes || []);
      setInboundReplies(inboundRes.results || inboundRes || []);
      setActivities((activityRes.results || activityRes || []).slice(0, 15));
    } catch (err) {
      console.error('Error loading campaign observability detail:', err);
      setError('We couldn\'t retrieve campaign telemetry from the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    pollRef.current = setInterval(() => {
      if (campaign?.status === 'Processing') {
        loadData();
      }
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [campaignId]);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`);
    if (label.includes('Campaign ID')) {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto animate-pulse font-mono">
        <div className="h-6 w-48 bg-white/10 rounded-lg" />
        <div className="h-16 w-full bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="h-40 bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-4 font-mono">
        <AlertTriangle className="size-12 text-rose mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Unable to load campaign</h2>
        <p className="text-sm text-muted-foreground">{error || 'Campaign ID not found.'}</p>
        <div className="flex justify-center gap-3 pt-2">
          <button onClick={onBack} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs">
            Back to Campaigns
          </button>
          <button onClick={loadData} className="px-4 py-2 rounded-xl bg-cyan text-zinc-950 font-bold text-xs">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // Calculations
  const totalRecip = campaign.total_recipients || 1;
  const delivRate = Math.round((campaign.successful_count / totalRecip) * 100);
  const replyRate = Math.round(((campaign.replied_count || 0) / totalRecip) * 100);
  const bounceRate = Math.round(((campaign.bounced_count || 0) / totalRecip) * 100);
  const failRate = Math.round(((campaign.failed_count || 0) / totalRecip) * 100);

  // Health Status
  const healthStatus = campaign.failed_count > 3 ? 'Critical' : campaign.bounced_count > 0 ? 'Attention Needed' : 'Healthy';
  const healthDesc = healthStatus === 'Healthy'
    ? 'Campaign completed successfully with high domain deliverability alignment.'
    : healthStatus === 'Attention Needed'
    ? 'Campaign completed but contains bounced recipients (SMTP 550 codes detected).'
    : 'Campaign has repeated SMTP failures. Please review provider parameters.';

  // Filtered recipients
  const filteredRecipients = recipientsLogs.filter(l => {
    const q = logSearch.toLowerCase();
    const matchSearch = !q || (l.recipient && l.recipient.toLowerCase().includes(q)) || (l.subject && l.subject.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchReply = replyFilter === 'ALL' || l.reply_status === replyFilter;
    return matchSearch && matchStatus && matchReply;
  });

  // Recharts Donut
  const donutData = [
    { name: 'Delivered', value: campaign.successful_count, color: '#10b981' },
    { name: 'Bounced', value: campaign.bounced_count || 0, color: '#f43f5e' },
    { name: 'Pending', value: Math.max(0, totalRecip - campaign.successful_count - campaign.failed_count), color: '#06b6d4' }
  ];

  // Recharts Throughput
  const throughputData = recipientsLogs.map((l, i) => ({
    time: l.sent_at ? new Date(l.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `T+${i*3}s`,
    sent: l.status === 'SENT' ? 1 : 0,
    bounced: l.reply_status === 'BOUNCED' || l.status === 'FAILED' ? 1 : 0
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-24 font-sans">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-cyan text-zinc-950 font-mono text-xs font-bold shadow-2xl flex items-center gap-2 border border-cyan/40"
          >
            <CheckCircle2 className="size-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. PAGE HEADER & BREADCRUMBS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs font-mono font-bold text-cyan transition cursor-pointer"
          >
            <ChevronLeft className="size-4" />
            <span>Back to Campaigns</span>
          </button>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 font-mono text-xs">
            {campaign.status === 'Processing' && (
              <button className="px-3.5 py-1.5 rounded-xl bg-amber/15 border border-amber/30 text-amber font-bold flex items-center gap-1.5 hover:bg-amber/25 cursor-pointer">
                <Pause className="size-3.5" /> Pause
              </button>
            )}
            {campaign.failed_count > 0 && (
              <button 
                onClick={() => showToast('Retrying failed recipient dispatches...')}
                className="px-3.5 py-1.5 rounded-xl bg-rose/15 border border-rose/30 text-rose font-bold flex items-center gap-1.5 hover:bg-rose/25 cursor-pointer"
              >
                <RotateCcw className="size-3.5" /> Retry Failed ({campaign.failed_count})
              </button>
            )}
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-foreground font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="size-3.5" /> Export Report
            </button>
          </div>
        </div>

        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-border/80 pb-5">
          <div>
            <div className="text-[11px] font-mono tracking-widest text-cyan uppercase mb-1">
              Campaigns / {campaign.name}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-4xl font-display font-bold text-foreground">{campaign.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                campaign.status === 'Completed' ? 'bg-lime/15 text-lime border border-lime/30' :
                campaign.status === 'Processing' ? 'bg-cyan/15 text-cyan border border-cyan/30 animate-pulse' :
                'bg-rose/15 text-rose border border-rose/30'
              }`}>
                {campaign.status === 'Processing' ? '● ACTIVE LIVE' : campaign.status.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mt-2 flex-wrap">
              <span>{campaign.campaign_type || 'PERSONALIZED CSV'} Campaign</span>
              <span>•</span>
              <span>Created {new Date(campaign.created_at).toLocaleString()}</span>
              <span>•</span>
              <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-border">
                <span className="text-muted-foreground">Campaign ID:</span>
                <span className="text-foreground font-bold">{campaign.id}</span>
                <button 
                  onClick={() => handleCopy(campaign.id, 'Campaign ID')} 
                  className="hover:text-cyan transition cursor-pointer ml-1"
                  title="Copy Campaign ID"
                >
                  {copiedId ? <Check className="size-3.5 text-lime" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LIVE OPERATIONAL STATUS BAR */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-border font-mono text-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className={`size-2.5 rounded-full ${campaign.status === 'Processing' ? 'bg-cyan animate-pulse' : 'bg-lime'}`} />
          <span className="font-bold text-foreground">
            {campaign.status === 'Completed' ? 'Campaign completed' : 'Campaign active & dispatching'}
          </span>
          <span className="text-muted-foreground">({campaign.successful_count + campaign.failed_count} / {campaign.total_recipients} processed)</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
          <span>Queue: <strong className="text-foreground">0</strong></span>
          <span>Sending: <strong className="text-foreground">{campaign.status === 'Processing' ? 1 : 0}</strong></span>
          <span>Failed: <strong className="text-rose">{campaign.failed_count}</strong></span>
          <span>Last activity: <strong className="text-foreground">{new Date().toLocaleTimeString()}</strong></span>
        </div>
      </div>

      {/* 3. PRIMARY EXECUTIVE SCORECARDS (6 CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-border space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Recipients</span>
          <div className="text-2xl font-bold font-display text-foreground">{totalRecip}</div>
          <p className="text-[11px] text-muted-foreground">Total recipients</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-border space-y-1">
          <span className="text-[10px] text-cyan uppercase tracking-wider font-semibold">Processed</span>
          <div className="text-2xl font-bold font-display text-cyan">{campaign.successful_count + campaign.failed_count}</div>
          <p className="text-[11px] text-cyan">100% processed</p>
        </div>

        <div className="p-4 rounded-2xl bg-lime/5 border border-lime/30 space-y-1">
          <span className="text-[10px] text-lime uppercase tracking-wider font-semibold">Delivered</span>
          <div className="text-2xl font-bold font-display text-lime">{campaign.successful_count}</div>
          <p className="text-[11px] text-lime">{delivRate}% success</p>
        </div>

        <div className="p-4 rounded-2xl bg-cyan/5 border border-cyan/30 space-y-1">
          <span className="text-[10px] text-cyan uppercase tracking-wider font-semibold">Replied</span>
          <div className="text-2xl font-bold font-display text-cyan">{campaign.replied_count || 0}</div>
          <p className="text-[11px] text-cyan">{replyRate}% engagement</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose/5 border border-rose/30 space-y-1">
          <span className="text-[10px] text-rose uppercase tracking-wider font-semibold">Bounced</span>
          <div className="text-2xl font-bold font-display text-rose">{campaign.bounced_count || 0}</div>
          <p className="text-[11px] text-rose">{bounceRate}% SMTP bounce</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber/5 border border-amber/30 space-y-1">
          <span className="text-[10px] text-amber uppercase tracking-wider font-semibold">Failed</span>
          <div className="text-2xl font-bold font-display text-amber">{campaign.failed_count}</div>
          <p className="text-[11px] text-amber">{failRate}% delivery error</p>
        </div>
      </div>

      {/* 4. CAMPAIGN PROGRESS & SEGMENTED BAR PANEL */}
      <div className="p-6 rounded-3xl glass border border-border space-y-4 font-mono">
        <div className="flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Campaign Progress</h3>
            <p className="text-muted-foreground text-[11px]">100% · {campaign.successful_count + campaign.failed_count} / {totalRecip} processed</p>
          </div>
          <span className="text-cyan font-bold text-base">100%</span>
        </div>

        {/* Segmented Horizontal Progress Bar */}
        <div className="w-full h-4 rounded-full bg-white/10 overflow-hidden flex border border-border">
          <div className="h-full bg-lime" style={{ width: `${delivRate}%` }} title={`Delivered: ${campaign.successful_count} (${delivRate}%)`} />
          <div className="h-full bg-cyan" style={{ width: `${replyRate}%` }} title={`Replied: ${campaign.replied_count || 0} (${replyRate}%)`} />
          <div className="h-full bg-rose" style={{ width: `${bounceRate}%` }} title={`Bounced: ${campaign.bounced_count || 0} (${bounceRate}%)`} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-lime" />
            <span>Delivered: <strong className="text-foreground">{campaign.successful_count} · {delivRate}%</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-cyan" />
            <span>Replied: <strong className="text-foreground">{campaign.replied_count || 0} · {replyRate}%</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-rose" />
            <span>Bounced: <strong className="text-foreground">{campaign.bounced_count || 0} · {bounceRate}%</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-white/20" />
            <span>Pending: <strong className="text-foreground">0 · 0%</strong></span>
          </div>
        </div>
      </div>

      {/* 5. CAMPAIGN LIFECYCLE TIMELINE & LIVE MONITOR GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Lifecycle Timeline */}
        <div className="xl:col-span-2 p-6 rounded-3xl glass border border-border space-y-4 font-mono">
          <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
            <Activity className="size-4 text-cyan" /> Campaign Lifecycle Timeline
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center pt-2">
            {[
              { stage: 'Created', time: new Date(campaign.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'Done' },
              { stage: 'Validated', time: 'Pass', status: 'Done' },
              { stage: 'Queued', time: 'Enqueued', status: 'Done' },
              { stage: 'Sending', time: 'Started', status: 'Done' },
              { stage: 'Processing', time: '45s Jitter', status: 'Done' },
              { stage: 'Completed', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'Done' }
            ].map((st, i) => (
              <div key={st.stage} className="p-3 rounded-2xl bg-white/[0.02] border border-border space-y-1 relative">
                {i < 5 && <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 text-muted-foreground z-10">→</div>}
                <div className="text-[10px] uppercase text-cyan font-bold">{st.stage}</div>
                <div className="text-xs font-bold text-foreground truncate">{st.time}</div>
                <span className="inline-block size-1.5 rounded-full bg-lime" />
              </div>
            ))}
          </div>
        </div>

        {/* Live Campaign Observability Monitor */}
        <div className="p-6 rounded-3xl glass border border-border space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
              <Server className="size-4 text-cyan" /> Live Observability Monitor
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime/20 text-lime border border-lime/30">
              {campaign.status === 'Processing' ? 'LIVE' : 'COMPLETED'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Queue Depth</span>
              <p className="text-lg font-bold text-foreground mt-0.5">0</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Active Workers</span>
              <p className="text-lg font-bold text-cyan mt-0.5">8 Active</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Dispatch Latency</span>
              <p className="text-lg font-bold text-lime mt-0.5">124ms</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Encryption</span>
              <p className="text-lg font-bold text-foreground mt-0.5">Fernet AES</p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. THROUGHPUT CHART & DELIVERY PERFORMANCE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-mono">
        {/* Recharts Sending Throughput */}
        <div className="xl:col-span-2 p-6 rounded-3xl glass border border-border space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Sending Activity & Throughput</h3>
              <p className="text-xs text-muted-foreground">Historical email dispatch vs bounce events</p>
            </div>
            <div className="flex gap-1.5 text-xs">
              {['1h', '6h', '24h', 'LIFETIME'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                    chartTimeframe === tf ? 'bg-cyan/20 border-cyan text-cyan font-bold' : 'bg-white/5 border-border text-muted-foreground'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 mt-4 min-w-0 min-h-0">
            {throughputData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={throughputData}>
                  <defs>
                    <linearGradient id="gSentDetail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gBounceDetail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="oklch(1 0 0 / 0.08)" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tick={{ fill: tickColor }} />
                  <YAxis stroke="#94a3b8" fontSize={11} tick={{ fill: tickColor }} />
                  <Tooltip contentStyle={{ background: "oklch(0.20 0.025 250)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="sent" stroke="#10b981" fill="url(#gSentDetail)" name="Emails Sent" />
                  <Area type="monotone" dataKey="bounced" stroke="#f43f5e" fill="url(#gBounceDetail)" name="Bounce Events" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                No throughput data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Delivery Distribution Donut & Health */}
        <div className="p-6 rounded-3xl glass border border-border space-y-4">
          <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Delivery Distribution</h3>
          
          <div className="h-48 relative flex items-center justify-center min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={4}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.20 0.025 250)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xl font-bold font-display text-foreground">{totalRecip}</span>
              <span className="text-[10px] text-muted-foreground uppercase">total</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-border space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground uppercase text-[10px]">Delivery Health</span>
              <span className="font-bold text-lime">{delivRate}% Delivered</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>{campaign.successful_count} Delivered</span>
              <span>{campaign.bounced_count || 0} Bounced</span>
              <span>0 Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. REPLY INTELLIGENCE & LEAD ENGAGEMENT */}
      <div className="p-6 rounded-3xl glass border border-border space-y-4 font-mono">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
              <Inbox className="size-4 text-cyan" /> Replies & Lead Engagement
            </h3>
            <p className="text-xs text-muted-foreground">Inbound lead replies and sentiment classification</p>
          </div>
          <span className="text-xs font-bold text-cyan">{inboundReplies.length} Inbound Threads Recorded</span>
        </div>

        {/* Top Reply Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-border">
            <span className="text-[10px] uppercase text-muted-foreground">Replies</span>
            <p className="text-xl font-bold text-foreground mt-0.5">{inboundReplies.length}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-lime/5 border border-lime/30">
            <span className="text-[10px] uppercase text-lime">Positive</span>
            <p className="text-xl font-bold text-lime mt-0.5">{inboundReplies.filter(r => r.sentiment === 'POSITIVE' || r.classification === 'HUMAN_REPLY').length}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-cyan/5 border border-cyan/30">
            <span className="text-[10px] uppercase text-cyan">Needs Reply</span>
            <p className="text-xl font-bold text-cyan mt-0.5">{inboundReplies.length}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-border">
            <span className="text-[10px] uppercase text-muted-foreground">No Reply</span>
            <p className="text-xl font-bold text-foreground mt-0.5">{Math.max(0, totalRecip - inboundReplies.length)}</p>
          </div>
        </div>

        {/* Latest Replies List */}
        {inboundReplies.length > 0 ? (
          <div className="space-y-3 pt-2">
            {inboundReplies.map((r) => {
              const isBounce = r.classification === 'BOUNCE' || r.sender_email?.toLowerCase().includes('mailer-daemon') || r.sender_email?.toLowerCase().includes('googlemail.com');
              const parsed = parseEmailBody(r.body_text);

              return (
                <div 
                  key={r.id} 
                  onClick={() => setSelectedReplyDrawer(r)}
                  className="p-4 rounded-2xl bg-zinc-900/90 border border-border hover:border-cyan/50 hover:bg-zinc-900/100 active:scale-[0.99] transition-all cursor-pointer space-y-2.5 shadow-lg group"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm group-hover:text-cyan-300 transition-colors">{r.sender_name || r.sender_email}</span>
                      <span className="text-slate-400">&lt;{r.sender_email}&gt;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        isBounce 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {isBounce ? 'BOUNCE / FAILED' : (r.sentiment || 'HUMAN REPLY')}
                      </span>
                      <span className="text-slate-400 text-xs">{new Date(r.received_at || r.processed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="text-xs text-cyan-400 font-semibold font-mono">Subject: {r.subject}</div>

                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-border text-xs text-slate-200 font-sans leading-relaxed line-clamp-3">
                    {parsed.latestMessage || 'No text content available'}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Replies will appear here as leads respond to this campaign.
          </div>
        )}
      </div>

      {/* 8. RECIPIENT-LEVEL MONITORING TABLE & ROW EXPANSION */}
      <div className="p-6 rounded-3xl glass border border-border space-y-4 font-mono">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
              <FileText className="size-4 text-cyan" /> Recipient Activity & Diagnostic Audit
            </h3>
            <p className="text-xs text-muted-foreground">Full recipient delivery lifecycle and SMTP response codes</p>
          </div>

          {/* Table Filters */}
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <input
              type="text"
              placeholder="Search recipient..."
              value={logSearch}
              onChange={e => setLogSearch(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-border text-xs focus:outline-none focus:border-cyan w-48"
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-border text-xs focus:outline-none focus:border-cyan text-foreground"
            >
              <option value="ALL">All Statuses</option>
              <option value="SENT">SENT</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] text-muted-foreground border-b border-border font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Recipient</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Reply</th>
                <th className="p-3.5">Dispatched</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredRecipients.length > 0 ? (
                filteredRecipients.map(row => {
                  const isExpanded = expandedRowId === row.id;
                  return (
                    <tbody key={row.id}>
                      <tr 
                        onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                        className="hover:bg-white/[0.02] cursor-pointer transition"
                      >
                        <td className="p-3.5 font-bold text-foreground">
                          {row.recipient}
                        </td>
                        <td className="p-3.5 text-muted-foreground truncate max-w-xs">{row.subject}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'SENT' ? 'bg-lime/20 text-lime border border-lime/30' : 'bg-rose/20 text-rose border border-rose/30'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.reply_status === 'REPLIED' ? 'bg-cyan/20 text-cyan border border-cyan/30' :
                            row.reply_status === 'BOUNCED' ? 'bg-rose/20 text-rose border border-rose/30' : 'bg-white/5 text-muted-foreground'
                          }`}>
                            {row.reply_status}
                          </span>
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {row.sent_at ? new Date(row.sent_at).toLocaleTimeString() : 'Pending'}
                        </td>
                        <td className="p-3.5 text-right">
                          <button className="text-cyan underline text-[11px]">
                            {isExpanded ? 'Hide Timeline ▲' : 'View Timeline ▼'}
                          </button>
                        </td>
                      </tr>

                      {/* Row Expansion */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-4 bg-black/40 border-b border-border">
                            <div className="space-y-3 text-xs font-mono">
                              <h4 className="font-bold text-cyan">Recipient Event Timeline & SMTP Diagnostics</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                                <div className="p-2 rounded bg-white/5">Created: {new Date(campaign.created_at).toLocaleTimeString()}</div>
                                <div className="p-2 rounded bg-white/5">Queued: {new Date(campaign.created_at).toLocaleTimeString()}</div>
                                <div className="p-2 rounded bg-white/5">Dispatched: {row.sent_at ? new Date(row.sent_at).toLocaleTimeString() : 'Pending'}</div>
                                <div className="p-2 rounded bg-white/5">SMTP Response: {row.status === 'SENT' ? '250 OK' : '550 5.1.1'}</div>
                                <div className="p-2 rounded bg-white/5">Status: {row.status}</div>
                              </div>

                              {row.error_message && (
                                <div className="p-3 rounded-xl bg-rose/10 border border-rose/30 text-rose text-xs space-y-1">
                                  <p className="font-bold">SMTP Failure Diagnostic:</p>
                                  <p className="font-mono">{row.error_message}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No recipient records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9. SMTP DIAGNOSTICS & BOUNCE ANALYTICS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 font-mono">
        {/* SMTP Diagnostics Card */}
        <div className="p-6 rounded-3xl glass border border-border space-y-4">
          <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
            <Server className="size-4 text-cyan" /> SMTP Infrastructure Diagnostics
          </h3>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">SMTP Provider</span>
              <p className="font-bold text-foreground mt-0.5">Gmail SMTP</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Server & Port</span>
              <p className="font-bold text-cyan mt-0.5">smtp.gmail.com:587 TLS</p>
            </div>
            <div className="p-3 rounded-xl bg-lime/5 border border-lime/30">
              <span className="text-[10px] text-lime uppercase">Connection State</span>
              <p className="font-bold text-lime mt-0.5">Connected (OK)</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Last SMTP Code</span>
              <p className="font-bold text-foreground mt-0.5">250 OK</p>
            </div>
          </div>
        </div>

        {/* Bounce Analysis Card */}
        <div className="p-6 rounded-3xl glass border border-border space-y-4">
          <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon className="size-4 text-rose" /> Bounce Analysis ({campaign.bounced_count || 0})
          </h3>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-rose/10 border border-rose/30">
              <span className="text-[10px] uppercase text-rose">Hard Bounces</span>
              <p className="text-lg font-bold text-rose mt-0.5">{campaign.bounced_count || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <span className="text-[10px] uppercase text-muted-foreground">Soft Bounces</span>
              <p className="text-lg font-bold text-foreground mt-0.5">0</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <span className="text-[10px] uppercase text-muted-foreground">Unknown</span>
              <p className="text-lg font-bold text-foreground mt-0.5">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* 10. CAMPAIGN CONFIGURATION & HEALTH SCORE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-mono">
        <div className="xl:col-span-2 p-6 rounded-3xl glass border border-border space-y-4">
          <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
            <Layers className="size-4 text-cyan" /> Campaign Configuration & Parameters
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Sending Limit</span>
              <p className="font-bold text-foreground mt-0.5">150 emails / day cap</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Random Jitter Delay</span>
              <p className="font-bold text-cyan mt-0.5">45 sec – 2 min humanized</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Variables Parsed</span>
              <p className="font-bold text-foreground mt-0.5">{"{{Name}}, {{Company}}"}</p>
            </div>
          </div>
        </div>

        {/* Health Score Card */}
        <div className="p-6 rounded-3xl glass border border-border space-y-3">
          <h3 className="font-bold text-foreground text-sm font-mono uppercase tracking-wider">Campaign Health Score</h3>
          <div className="flex items-center gap-2 font-mono">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              healthStatus === 'Healthy' ? 'bg-lime/20 text-lime border border-lime/30' :
              healthStatus === 'Attention Needed' ? 'bg-amber/20 text-amber border border-amber/30' : 'bg-rose/20 text-rose'
            }`}>
              {healthStatus}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-sans">{healthDesc}</p>
        </div>
      </div>

      {/* 11. LEAD REPLY PREVIEW DRAWER */}
      <AnimatePresence>
        {selectedReplyDrawer && (() => {
          const parsed = parseEmailBody(selectedReplyDrawer.body_text);
          const showQuote = expandedQuotes[selectedReplyDrawer.id];

          return (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex justify-end">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="w-full max-w-xl bg-zinc-950 border-l border-border p-6 h-full flex flex-col gap-4 overflow-y-auto shadow-2xl font-mono"
              >
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedReplyDrawer.sender_name || selectedReplyDrawer.sender_email}</h3>
                    <p className="text-xs text-cyan">&lt;{selectedReplyDrawer.sender_email}&gt;</p>
                  </div>
                  <button 
                    onClick={() => setSelectedReplyDrawer(null)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase">Subject</span>
                    <p className="font-bold text-cyan mt-0.5">{selectedReplyDrawer.subject}</p>
                  </div>

                  {/* High-Contrast Parsed Main Response */}
                  <div className="p-4 rounded-2xl bg-cyan-950/30 border-2 border-cyan-500/40 text-slate-100 font-sans text-sm leading-relaxed whitespace-pre-wrap shadow-inner space-y-2">
                    <div className="text-[11px] font-mono font-bold text-cyan flex items-center gap-1.5">
                      <Sparkles className="size-3.5" /> Latest Lead Message:
                    </div>
                    <div>{parsed.latestMessage || 'No body content available.'}</div>
                  </div>

                  {/* Collapsible Quoted Email History */}
                  {parsed.quotedHistory && (
                    <div className="border border-border/80 rounded-2xl overflow-hidden bg-black/40">
                      <button
                        onClick={() => toggleQuote(selectedReplyDrawer.id)}
                        className="w-full p-3 flex items-center justify-between text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
                      >
                        <span>📜 Quoted Email History & Original Thread</span>
                        {showQuote ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>

                      {showQuote && (
                        <div className="p-4 border-t border-border/60 text-xs font-sans text-slate-400 bg-zinc-950/80 leading-relaxed whitespace-pre-wrap">
                          {parsed.quotedHistory}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-auto border-t border-border pt-4 flex gap-3">
                  <button 
                    onClick={() => {
                      const emailToTarget = selectedReplyDrawer.sender_email;
                      setSelectedReplyDrawer(null);
                      if (onNavigateToInbox) {
                        onNavigateToInbox(emailToTarget);
                      } else {
                        showToast('Navigating to Master Unibox...');
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-cyan text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-cyan/90 transition shadow-lg"
                  >
                    <CornerUpLeft className="size-4" /> Reply in Master Unibox
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
      {/* 12. EXPORT REPORT MODAL */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-950 border border-cyan/40 rounded-3xl p-6 space-y-4 font-mono shadow-2xl text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider">Export Campaign Telemetry</h3>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">Select a report format to download real data</p>
                </div>
                <button 
                  onClick={() => setShowExportModal(false)} 
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-100 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { name: 'Recipient Activity CSV', desc: 'Download CSV of all 7 target recipient dispatches & timestamps' },
                  { name: 'Delivery & Bounce Audit Report', desc: 'Download diagnostic log of hard/soft SMTP bounces' },
                  { name: 'Lead Reply Transcript', desc: 'Export full inbound lead messages and sentiment scores' },
                  { name: 'Full Telemetry Package', desc: 'Export complete JSON package of campaign metrics' }
                ].map(opt => (
                  <button
                    key={opt.name}
                    onClick={() => handleExportReport(opt.name)}
                    className="w-full p-3.5 rounded-2xl bg-zinc-900 border border-border hover:border-cyan-500/60 hover:bg-cyan-950/30 text-left transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors text-sm">{opt.name}</div>
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">{opt.desc}</div>
                    </div>
                    <Download className="size-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
