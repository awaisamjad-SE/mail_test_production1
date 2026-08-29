import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
  Send, AlertTriangle, CheckCircle2, LayoutGrid, LineChart as LineChartIcon,
  RefreshCw, ChevronRight, Inbox, Sparkles, MoreHorizontal, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import * as api from '../utils/api';
import imgOverview from '../assets/snippet-overview.jpg';

export default function OverviewTab() {
  const { isDark } = useTheme();
  const tickColor = isDark ? '#cbd5e1' : '#334155';

  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const intervalRef = useRef(null);

  const fetchData = async () => {
    try {
      const [statsData, chartsData, activitiesData] = await Promise.all([
        api.fetchDashboardStats(),
        api.fetchDashboardCharts(),
        api.fetchActivityLogs()
      ]);
      setStats(statsData);
      setCharts(chartsData);
      setActivities(activitiesData);
    } catch (err) {
      if (err.response?.status === 401 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      console.error('Error loading overview data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 text-cyan animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Loading telemetry command center...</p>
      </div>
    );
  }

  // Formatting Recharts data
  const dailySendsData = charts?.daily_sends?.map((d, i) => ({
    day: d.date || `Day ${i + 1}`,
    sent: d.sent !== undefined ? d.sent : (d.count || 0),
    failed: d.failed || 0
  })) || [];

  const deliveryStatusData = charts?.delivery_status?.map(s => ({
    name: s.name,
    value: s.value || 0,
    color: s.color || (s.name === 'Delivered' ? '#10b981' : s.name === 'Lead Replies' ? '#06b6d4' : '#f43f5e')
  })) || [
    { name: "Delivered", value: stats?.emails_sent || 0, color: "#10b981" },
    { name: "Bounced", value: stats?.emails_bounced || 0, color: "#f43f5e" },
    { name: "Lead Replies", value: stats?.emails_replied || 0, color: "#06b6d4" }
  ];

  const campaignPerformance = charts?.campaign_performance || [];

  const getActivityBadge = (action) => {
    const act = (action || '').toLowerCase();
    if (act.includes('inbound') || act.includes('reply')) {
      return { icon: Inbox, cls: 'bg-cyan/15 text-cyan border-cyan/30', label: 'INBOUND' };
    }
    if (act.includes('bounce') || act.includes('failed')) {
      return { icon: AlertTriangle, cls: 'bg-rose/15 text-rose border-rose/30', label: 'BOUNCE' };
    }
    if (act.includes('campaign') || act.includes('created')) {
      return { icon: Sparkles, cls: 'bg-amber/15 text-amber border-amber/30', label: 'CAMPAIGN' };
    }
    return { icon: Send, cls: 'bg-lime/15 text-lime border-lime/30', label: 'DISPATCH' };
  };

  return (
    <div className="space-y-8">
      {/* Telemetry Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-2">01 · Operations</div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
            Email <span className="gradient-text">command center</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Real‑time campaign telemetry, deliverability, queue health, and domain sending volumes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs flex items-center gap-2 cursor-pointer transition-colors font-mono"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} /> 
            <span>{refreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* Overview Hero Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-48 lg:h-56 rounded-3xl overflow-hidden border border-border group shadow-2xl"
      >
        <img src={imgOverview} alt="Email command center" loading="lazy" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative h-full p-6 lg:p-8 flex items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-cyan px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20">
              <span className="size-1.5 rounded-full bg-lime animate-pulse" /> Live · Telemetry Active
            </div>
            <h2 className="mt-3 font-display text-xl lg:text-2xl font-semibold max-w-md">
              Every send, reply and bounce — observed in real time.
            </h2>
          </div>
          <div className="hidden md:grid grid-cols-4 gap-6 pr-2 font-mono">
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-lime">{stats?.emails_sent || 0}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Sent Total</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-cyan">{stats?.emails_replied || 0}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Lead Replies</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-amber">{stats?.success_rate || 100}%</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Delivery Rate</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-foreground">0</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Queue Depth</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Sent Total" value={stats?.emails_sent ?? 0} delta="Dispatched emails" icon={Send} accent="lime" />
        <StatCard label="Replies" value={stats?.emails_replied ?? 0} delta={`Reply rate: ${stats?.reply_rate ?? 0}%`} icon={Inbox} accent="cyan" />
        <StatCard label="Bounces" value={stats?.emails_bounced ?? 0} delta="Hard / Soft bounces" icon={AlertTriangle} accent="rose" />
        <StatCard label="Delivery Rate" value={`${stats?.success_rate ?? 100}%`} delta="SMTP success" icon={CheckCircle2} accent="amber" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart 1: Daily Sends */}
        <Card className="xl:col-span-2 p-6 border border-border">
          <CardHeader
            title="Daily sends · last 30 days"
            subtitle="Dispatched volume and throughput"
            chips={[{ label: "Sent", color: "var(--lime)" }, { label: "Bounces", color: "var(--rose)" }]}
          />
          <div className="h-72 mt-4 min-w-0 min-h-0">
            {dailySendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={dailySendsData} margin={{ left: -10, right: 10, top: 10 }}>
                  <defs>
                    <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--lime)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--lime)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--rose)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--rose)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis dataKey="day" stroke="oklch(1 0 0 / 0.4)" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: tickColor }} />
                  <YAxis stroke="oklch(1 0 0 / 0.4)" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: tickColor }} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.20 0.025 250)", border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 12, fontSize: 12, fontFamily: "monospace"
                    }}
                  />
                  <Area type="monotone" dataKey="sent" stroke="var(--lime)" strokeWidth={2} fill="url(#gSent)" />
                  <Area type="monotone" dataKey="failed" stroke="var(--rose)" strokeWidth={2} fill="url(#gFail)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-mono">No email sending telemetry available yet.</div>
            )}
          </div>
        </Card>

        {/* Chart 2: Delivery Partition */}
        <Card className="p-6 border border-border">
          <CardHeader title="Delivery status" subtitle="Partition breakdown" />
          <div className="h-56 mt-2 min-w-0 min-h-0">
            {deliveryStatusData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie data={deliveryStatusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {deliveryStatusData.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "oklch(0.20 0.025 250)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-mono">No email telemetry data to display.</div>
            )}
          </div>
          <div className="space-y-2 mt-2 font-mono">
            {deliveryStatusData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.02] border border-border">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-bold text-foreground">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Campaign Streams & Infrastructure Health */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Campaign Performance Bar */}
        {campaignPerformance.length > 0 && (
          <Card className="xl:col-span-2 p-6 border border-border">
            <CardHeader title="Campaign Outreach Ranking" subtitle="Top performing batch campaigns" />
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={campaignPerformance} margin={{ left: -10, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="oklch(1 0 0 / 0.08)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: tickColor }} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: tickColor }} />
                  <Tooltip contentStyle={{ background: "oklch(0.20 0.025 250)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="sent" fill="var(--lime)" radius={[6, 6, 0, 0]} name="Sent / Dispatched" />
                  <Bar dataKey="replied" fill="var(--cyan)" radius={[6, 6, 0, 0]} name="Lead Replies" />
                  <Bar dataKey="failed" fill="var(--rose)" radius={[6, 6, 0, 0]} name="Bounced / Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Live Activity Timeline */}
        <Card className={`p-6 border border-border ${campaignPerformance.length > 0 ? '' : 'xl:col-span-2'}`}>
          <CardHeader title="Latest activity logs" subtitle="Audit tracking feeds" />
          <div className="mt-4 divide-y divide-border/60 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
            {activities.length > 0 ? (
              activities.map((it, i) => {
                const badge = getActivityBadge(it.action);
                const Icon = badge.icon;
                return (
                  <div key={it.id || i} className="flex items-start gap-3 py-3 animate-fade-in text-xs font-mono">
                    <div className={`size-8 rounded-xl grid place-items-center shrink-0 border ${badge.cls}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground leading-relaxed">{it.action}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(it.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-muted-foreground text-xs font-mono">
                No activity logs recorded. Actions like campaign dispatches will appear here.
              </div>
            )}
          </div>
        </Card>

        {/* System Heartbeat & Infrastructure Health */}
        <Card className="p-6 border border-border">
          <CardHeader title="Heartbeat" subtitle="Queue infrastructure health" />
          <div className="space-y-3 mt-4 font-mono text-xs">
            {[
              { label: "Worker threads", value: "8 Active", color: "lime", dot: true },
              { label: "IMAP Sync Engine", value: "Connected (20s)", color: "cyan", dot: true },
              { label: "Dispatch latency", value: "124ms", color: "lime", dot: false },
              { label: "Encryption Engine", value: "Fernet Active", color: "cyan", dot: false },
              { label: "Suppression pool", value: "Auto", color: "amber", dot: false },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-border">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="font-bold flex items-center gap-1.5" style={{ color: `var(--${m.color})` }}>
                  {m.dot && <span className="size-1.5 rounded-full animate-pulse" style={{ background: `var(--${m.color})` }} />}
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Helper primitives ---------------- */

function StatCard({ label, value, delta, icon: Icon, accent }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="relative p-5 rounded-3xl glass overflow-hidden border border-border group shadow-lg transition-all"
    >
      <div className="absolute -top-8 -right-8 size-28 blur-3xl opacity-30 rounded-full"
        style={{ background: `var(--${accent})` }} />
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{label}</span>
        <div className="size-8 rounded-xl grid place-items-center bg-white/5 border border-border"
          style={{ color: `var(--${accent})` }}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 font-display text-2xl font-bold">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground font-mono">
        {delta}
      </div>
    </motion.div>
  );
}

function Card({ className = "", children }) {
  return <div className={`rounded-3xl glass ${className}`}>{children}</div>;
}

function CardHeader({ title, subtitle, chips }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h3 className="font-display font-semibold text-lg">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 font-mono">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {chips?.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <span className="size-2 rounded-full" style={{ background: c.color }} />{c.label}
          </div>
        ))}
      </div>
    </div>
  );
}
