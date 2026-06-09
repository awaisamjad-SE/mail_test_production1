import { useState, useEffect, useRef } from 'react';
import { Mail, Clock, CheckCircle2, AlertTriangle, Loader2, Trash2, RefreshCw } from 'lucide-react';
import * as api from '../utils/api';
import imgTracker from '../assets/snippet-tracker.jpg';

export default function CampaignsTab() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This will delete all associated logs.')) return;
    try {
      await api.deleteCampaign(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-2">05 · Live</div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
            Campaign <span className="gradient-text">tracker</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Monitor every active and recent email sending dispatch job — throughput, successful sends, and queue health.
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Banner */}
      <div className="relative h-48 lg:h-56 rounded-3xl overflow-hidden border border-border group">
        <img src={imgTracker} alt="Campaign telemetry tracker" loading="lazy" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative h-full p-6 lg:p-8 flex items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-cyan px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20">
              <span className="size-1.5 rounded-full bg-cyan animate-pulse" /> Live Telemetry
            </div>
            <h2 className="mt-3 font-display text-xl lg:text-2xl font-semibold max-w-md">Live campaign status and deliverability counters.</h2>
          </div>
          <div className="hidden md:grid grid-cols-3 gap-6 pr-2">
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">{campaigns.filter(c => c.status === 'Processing').length}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Active</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">{campaigns.filter(c => c.status === 'Completed').length}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Completed</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">{campaigns.length}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Pools</div>
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
                      onClick={() => handleDelete(c.id)}
                      className="p-2 rounded-xl bg-white/5 border border-border text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                  <div className="rounded-2xl border border-border bg-white/[0.01] p-3 text-center">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total Rows</p>
                    <p className="text-xl font-bold mt-1">{c.total_recipients}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white/[0.01] p-3 text-center">
                    <p className="text-lime text-xs font-semibold uppercase tracking-wider">Delivered</p>
                    <p className="text-xl font-bold mt-1 text-lime">{c.successful_count}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white/[0.01] p-3 text-center">
                    <p className="text-rose text-xs font-semibold uppercase tracking-wider">Errors</p>
                    <p className="text-xl font-bold mt-1 text-rose">{c.failed_count}</p>
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
    </div>
  );
}
