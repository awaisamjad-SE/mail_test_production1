import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
  Send, AlertTriangle, CheckCircle2, LayoutGrid, LineChart as LineChartIcon,
  RefreshCw, ChevronRight, Inbox, Sparkles, MoreHorizontal, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import * as api from '../utils/api';
import imgOverview from '../assets/snippet-overview.jpg';

export default function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      console.error('Error loading overview data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  // Formatting and Mapping Recharts data
  const dailySendsData = charts?.daily_sends?.map((d, i) => ({
    day: d.date || `Day ${i + 1}`,
    sent: d.count || 0,
    failed: Math.round(d.count * 0.01) // mock failure rate proportional to sends
  })) || [];

  const deliveryStatusData = [
    { name: "Delivered", value: stats?.emails_sent || 0, color: "var(--lime)" },
    { name: "Bounced", value: stats?.emails_failed || 0, color: "var(--rose)" },
  ];

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
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} /> 
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Overview Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-48 lg:h-56 rounded-3xl overflow-hidden border border-border group"
      >
        <img src={imgOverview} alt="Email command center" loading="lazy" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative h-full p-6 lg:p-8 flex items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-cyan px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20">
              <span className="size-1.5 rounded-full bg-cyan animate-pulse" /> Live · Telemetry Active
            </div>
            <h2 className="mt-3 font-display text-xl lg:text-2xl font-semibold max-w-md">Every send, open and bounce — observed in real time.</h2>
          </div>
          <div className="hidden md:grid grid-cols-3 gap-6 pr-2">
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">{stats?.emails_sent || 0}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Sent Total</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">{stats?.success_rate || 100}%</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Delivered</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">0</div>
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
        <Card className="xl:col-span-2 p-6">
          <CardHeader
            title="Daily sends · last 30 days"
            subtitle="Throughput vs failures"
            chips={[{ label: "Sent", color: "var(--lime)" }, { label: "Failed", color: "var(--rose)" }]}
          />
          <div className="h-72 mt-4">
            {dailySendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySendsData} margin={{ left: -10, right: 10, top: 10 }}>
                  <defs>
                    <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--lime)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--lime)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--rose)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--rose)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis dataKey="day" stroke="oklch(1 0 0 / 0.4)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(1 0 0 / 0.4)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.20 0.025 250)", border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 12, fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="sent" stroke="var(--lime)" strokeWidth={2} fill="url(#gSent)" />
                  <Area type="monotone" dataKey="failed" stroke="var(--rose)" strokeWidth={2} fill="url(#gFail)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs">No email sending telemetry available yet.</div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <CardHeader title="Delivery status" subtitle="Distribution breakdown" />
          <div className="h-56 mt-2">
            {stats?.emails_sent > 0 || stats?.emails_failed > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deliveryStatusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {deliveryStatusData.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "oklch(0.20 0.025 250)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs">No email telemetry data to display.</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {deliveryStatusData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-mono font-medium">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity Timeline and Details */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-6">
          <CardHeader title="Latest activity logs" subtitle="Audit tracking feeds" />
          <div className="mt-4 divide-y divide-border max-h-96 overflow-y-auto pr-2 scrollbar-thin">
            {activities.length > 0 ? (
              activities.map((it, i) => (
                <div key={it.id || i} className="flex items-start gap-3 py-3 animate-fade-in">
                  <div className="size-9 rounded-xl grid place-items-center bg-cyan/15 text-cyan">
                    <Send className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{it.action}</div>
                    <div className="text-xs text-muted-foreground">{new Date(it.created_at).toLocaleString()}</div>
                  </div>
                  <MoreHorizontal className="size-4 text-muted-foreground" />
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No activity logs recorded. Actions like campaign dispatches will appear here.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <CardHeader title="Heartbeat" subtitle="Queue infrastructure" />
          <div className="space-y-4 mt-4">
            {[
              { label: "Worker threads", value: "8 Active", color: "lime" },
              { label: "Dispatch latency", value: "124ms", color: "cyan" },
              { label: "Background pools", value: "Celery", color: "amber" },
              { label: "Suppression pool", value: "Auto", color: "rose" },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-border">
                <span className="text-sm text-muted-foreground">{m.label}</span>
                <span className="font-display text-sm font-bold" style={{ color: `var(--${m.color})` }}>{m.value}</span>
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
      className="relative p-5 rounded-2xl glass overflow-hidden border border-border group"
    >
      <div className="absolute -top-8 -right-8 size-28 blur-3xl opacity-40 rounded-full"
        style={{ background: `var(--${accent})` }} />
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="size-8 rounded-lg grid place-items-center bg-white/5 border border-border"
          style={{ color: `var(--${accent})` }}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 font-display text-2xl font-bold">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">
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
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {chips?.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: c.color }} />{c.label}
          </div>
        ))}
      </div>
    </div>
  );
}
