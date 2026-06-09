import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity, Send, Users, FileSpreadsheet, LineChart as LineChartIcon,
  ScrollText, LayoutGrid, Settings, Search, Bell, Plus, ArrowUpRight,
  ArrowDownRight, CheckCircle2, AlertTriangle, Clock, Zap, Mail,
  Upload, Eye, Sparkles, Filter, MoreHorizontal, Download, Play,
  Pause, Copy, Trash2, ChevronRight, Inbox, Globe2, ShieldCheck,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import imgOverview from "@/assets/snippet-overview.jpg";
import imgQuick from "@/assets/snippet-quick.jpg";
import imgBulk from "@/assets/snippet-bulk.jpg";
import imgCsv from "@/assets/snippet-csv.jpg";
import imgTracker from "@/assets/snippet-tracker.jpg";
import imgTemplates from "@/assets/snippet-templates.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulsemail — Email Command Center" },
      { name: "description", content: "Drafts, bulk sends, CSV personalization, deliverability tracking and templates — all in one precision workspace." },
    ],
  }),
  component: Dashboard,
});

type SectionKey =
  | "overview" | "quick" | "bulk" | "csv" | "tracker"
  | "logs" | "templates" | "settings";

const NAV: { key: SectionKey; label: string; icon: any; hint: string }[] = [
  { key: "overview", label: "Overview", icon: Activity, hint: "Live ops" },
  { key: "quick", label: "Quick Send", icon: Send, hint: "1 ↦ 1" },
  { key: "bulk", label: "Bulk Send", icon: Users, hint: "Fan‑out" },
  { key: "csv", label: "Personalized CSV", icon: FileSpreadsheet, hint: "Merge" },
  { key: "tracker", label: "Campaign Tracker", icon: LineChartIcon, hint: "Live" },
  { key: "logs", label: "History Logs", icon: ScrollText, hint: "Audit" },
  { key: "templates", label: "Template Gallery", icon: LayoutGrid, hint: "37" },
  { key: "settings", label: "Settings & SMTP", icon: Settings, hint: "Domain" },
];

function Dashboard() {
  const [section, setSection] = useState<SectionKey>("overview");

  return (
    <div className="flex min-h-screen text-foreground">
      <Sidebar section={section} setSection={setSection} />
      <main className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <div className="flex-1 px-6 lg:px-10 py-8 max-w-[1400px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {section === "overview" && <Overview />}
              {section === "quick" && <QuickSend />}
              {section === "bulk" && <BulkSend />}
              {section === "csv" && <PersonalizedCSV />}
              {section === "tracker" && <CampaignTracker />}
              {section === "logs" && <HistoryLogs />}
              {section === "templates" && <TemplateGallery />}
              {section === "settings" && <SettingsSMTP />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ---------------- Shell ---------------- */

function Sidebar({ section, setSection }: { section: SectionKey; setSection: (s: SectionKey) => void }) {
  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border bg-surface/40 backdrop-blur-xl sticky top-0 h-screen">
      <div className="px-6 pt-7 pb-6 flex items-center gap-3">
        <div className="relative">
          <div className="size-10 rounded-xl bg-gradient-to-br from-lime to-cyan grid place-items-center text-primary-foreground font-bold shadow-lg">
            <Mail className="size-5" />
          </div>
          <div className="absolute -bottom-1 -right-1 size-3 rounded-full bg-lime ring-2 ring-background animate-pulse" />
        </div>
        <div>
          <div className="font-display font-bold text-lg leading-none">Pulsemail</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">Ops Console</div>
        </div>
      </div>

      <nav className="px-3 mt-2 flex-1 overflow-y-auto scrollbar-thin">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground px-3 mb-2">Workspace</div>
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = section === item.key;
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <button
                  onClick={() => setSection(item.key)}
                  className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                    ${active ? "bg-gradient-to-r from-lime/15 to-cyan/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"}`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-lime to-cyan"
                    />
                  )}
                  <Icon className={`size-4 ${active ? "text-lime" : ""}`} />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${active ? "bg-cyan/15 text-cyan" : "bg-white/5 text-muted-foreground"}`}>
                    {item.hint}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="m-3 p-4 rounded-2xl glass relative overflow-hidden">
        <div className="absolute -top-10 -right-10 size-32 bg-lime/20 blur-3xl rounded-full" />
        <div className="flex items-center gap-2 text-xs text-cyan">
          <ShieldCheck className="size-4" /> Deliverability
        </div>
        <div className="mt-2 font-display text-2xl font-bold">98.4%</div>
        <div className="text-xs text-muted-foreground mt-1">All domains aligned · DKIM ok</div>
        <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }} animate={{ width: "98%" }} transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-lime to-cyan"
          />
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-30 px-6 lg:px-10 py-4 flex items-center gap-4 border-b border-border bg-background/60 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-2 rounded-full bg-lime animate-pulse" />
        <span>Live · us‑east‑1 · queue 0</span>
      </div>
      <div className="flex-1 max-w-xl mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          placeholder="Search campaigns, recipients, templates… (⌘K)"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-border focus:border-cyan/50 focus:ring-2 focus:ring-cyan/20 outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>
      <button className="size-10 grid place-items-center rounded-xl bg-white/5 hover:bg-white/10 border border-border relative">
        <Bell className="size-4" />
        <span className="absolute top-2 right-2 size-2 rounded-full bg-rose" />
      </button>
      <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold text-sm flex items-center gap-2 hover:shadow-[0_8px_30px_-8px] hover:shadow-lime/60 transition-shadow">
        <Plus className="size-4" /> New Campaign
      </button>
      <div className="flex items-center gap-3 pl-3 border-l border-border">
        <div className="text-right hidden md:block">
          <div className="text-sm font-medium leading-tight">Awais Amjad</div>
          <div className="text-[11px] text-muted-foreground">Workspace owner</div>
        </div>
        <div className="size-10 rounded-xl bg-gradient-to-br from-cyan to-lime grid place-items-center font-bold text-primary-foreground">A</div>
      </div>
    </header>
  );
}

/* ---------------- OVERVIEW ---------------- */

const sendsData = Array.from({ length: 30 }).map((_, i) => ({
  day: i + 1,
  sent: Math.round(800 + Math.sin(i / 3) * 300 + Math.random() * 400 + i * 25),
  failed: Math.round(20 + Math.random() * 40),
}));
const deliveryStatus = [
  { name: "Delivered", value: 18420, color: "var(--lime)" },
  { name: "Opened", value: 11230, color: "var(--cyan)" },
  { name: "Bounced", value: 312, color: "var(--rose)" },
  { name: "Pending", value: 88, color: "var(--amber)" },
];

function Overview() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="01 · Operations"
        title={<>Email <span className="gradient-text">command center</span></>}
        subtitle="Real‑time campaign telemetry, deliverability and queue health across all sending domains."
        right={
          <div className="flex items-center gap-2">
            <PillButton icon={Filter}>Last 30 days</PillButton>
            <PillButton icon={Download}>Export</PillButton>
          </div>
        }
      />
      <SectionBanner image={imgOverview} alt="Email operations" tag="Live · 24h"
        headline="Every send, open and bounce — observed in real time."
        stats={[{ label: "Sent 24h", value: "24.8k" }, { label: "Delivered", value: "98.4%" }, { label: "Queue", value: "0" }]} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Sent" value="24,861" delta="+12.4%" up icon={Send} accent="lime" />
        <StatCard label="Failed" value="284" delta="-3.1%" up={false} icon={AlertTriangle} accent="rose" />
        <StatCard label="Delivery rate" value="98.4%" delta="+0.6%" up icon={CheckCircle2} accent="cyan" />
        <StatCard label="Campaigns" value="17" delta="3 active" icon={LineChartIcon} accent="amber" />
        <StatCard label="Templates" value="37" delta="+4 this week" icon={LayoutGrid} accent="cyan" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-6">
          <CardHeader
            title="Daily sends · last 30 days"
            subtitle="Throughput vs failures"
            chips={[{ label: "Sent", color: "var(--lime)" }, { label: "Failed", color: "var(--rose)" }]}
          />
          <div className="h-72 mt-4">
            <ResponsiveContainer>
              <AreaChart data={sendsData} margin={{ left: -10, right: 10, top: 10 }}>
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
          </div>
        </Card>

        <Card className="p-6">
          <CardHeader title="Delivery status" subtitle="Across all live campaigns" />
          <div className="h-56 mt-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={deliveryStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                  {deliveryStatus.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.20 0.025 250)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {deliveryStatus.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-mono font-medium">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <CardHeader title="Latest activity" subtitle="Sends, opens & bounces"
            right={<button className="text-xs text-cyan hover:underline flex items-center gap-1">View logs <ChevronRight className="size-3" /></button>}
          />
          <ActivityFeed />
        </Card>
        <Card className="p-6">
          <CardHeader title="Top templates" subtitle="By open rate this week" />
          <div className="space-y-3 mt-4">
            {[
              { name: "Welcome · Onboarding v3", rate: 64, sends: 3120 },
              { name: "Receipt · Stripe checkout", rate: 58, sends: 8421 },
              { name: "Re‑engage 30d", rate: 41, sends: 1240 },
              { name: "Product launch · Q2", rate: 37, sends: 4760 },
            ].map((t, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{t.name}</span>
                  <span className="font-mono text-lime">{t.rate}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${t.rate}%` }}
                    transition={{ duration: 1, delay: i * 0.08 }}
                    className="h-full bg-gradient-to-r from-lime to-cyan"
                  />
                </div>
                <div className="text-[11px] text-muted-foreground">{t.sends.toLocaleString()} sends</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ActivityFeed() {
  const items = [
    { icon: CheckCircle2, color: "lime", label: "Campaign 'Spring Launch' completed", meta: "12,420 delivered · 2m ago" },
    { icon: Send, color: "cyan", label: "Bulk send queued · 2,184 recipients", meta: "newsletter@brand.com · 6m ago" },
    { icon: AlertTriangle, color: "rose", label: "3 hard bounces on receipt template", meta: "auto‑suppressed · 11m ago" },
    { icon: Sparkles, color: "amber", label: "Template 'Onboarding v3' edited", meta: "by Awais · 24m ago" },
    { icon: Inbox, color: "cyan", label: "47 opens on 'Re‑engage 30d'", meta: "open rate ↑ 4.1% · 38m ago" },
  ];
  return (
    <div className="mt-4 divide-y divide-border">
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 py-3"
          >
            <div className={`size-9 rounded-xl grid place-items-center bg-${it.color}/15 text-${it.color}`}
                 style={{ background: `oklch(from var(--${it.color}) l c h / 0.15)`, color: `var(--${it.color})` }}>
              <Icon className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm">{it.label}</div>
              <div className="text-xs text-muted-foreground">{it.meta}</div>
            </div>
            <MoreHorizontal className="size-4 text-muted-foreground" />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ---------------- QUICK SEND ---------------- */

function QuickSend() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("Dear {{Name}},\n\n");
  const [tab, setTab] = useState<"plain" | "html" | "visual">("plain");

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="02 · Compose"
        title={<>Quick <span className="gradient-text">send</span></>}
        subtitle="Draft a one‑off email and dispatch instantly. Live preview, merge tags and Markdown supported."
      />
      <SectionBanner image={imgQuick} alt="Quick send" tag="One‑to‑one"
        headline="Compose, preview and dispatch in under thirty seconds."
        stats={[{ label: "Avg dispatch", value: "0.4s" }, { label: "Preview", value: "Live" }, { label: "Tokens", value: "12" }]} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Recipient" required>
              <input value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@example.com"
                className="input" />
            </Field>
            <Field label="Reply‑To" optional>
              <input placeholder="reply@example.com" className="input" />
            </Field>
          </div>
          <Field label="Subject" required>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Your weekly briefing is ready" className="input" />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Message body <span className="text-rose">*</span></label>
              <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-border">
                {(["plain", "html", "visual"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-3 py-1.5 text-xs rounded-lg capitalize transition ${tab === t ? "bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
                    {t === "plain" ? "Plain text" : t === "html" ? "Raw HTML" : "Visual builder"}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Supports <code className="px-1 py-0.5 rounded bg-white/5 font-mono text-cyan">{`{{Name}}`}</code> placeholders. Auto‑wrapped in a styled shell on send.</p>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={10} className="input font-mono text-sm resize-none" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold flex items-center gap-2 hover:shadow-[0_8px_30px_-8px] hover:shadow-lime/60 transition">
              <Zap className="size-4" /> Send now
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-sm flex items-center gap-2">
              <Clock className="size-4" /> Schedule
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-sm flex items-center gap-2 ml-auto">
              <Eye className="size-4" /> Test inbox
            </button>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6 sticky top-24 self-start">
          <CardHeader title="Live preview" subtitle="What your recipient sees" />
          <div className="mt-4 rounded-2xl border border-border bg-white text-zinc-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50 flex items-center gap-2 text-xs">
              <span className="size-2 rounded-full bg-rose-400" />
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="size-2 rounded-full bg-emerald-400" />
              <span className="ml-auto font-mono text-zinc-500">inbox</span>
            </div>
            <div className="p-5 space-y-2 min-h-[260px]">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400">From Pulsemail</div>
              <div className="font-semibold text-zinc-900">{subject || "Enter a subject…"}</div>
              <div className="text-xs text-zinc-500">to {to || "recipient@example.com"}</div>
              <div className="h-px bg-zinc-100 my-3" />
              <pre className="font-sans whitespace-pre-wrap text-sm text-zinc-700">{body || "Start typing your email…"}</pre>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- BULK SEND ---------------- */

function BulkSend() {
  const recipients = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
    email: `user${i + 1}@${["acme.io", "north.co", "hex.dev", "stripe.com"][i % 4]}`,
    name: ["Alex Chen", "Priya Rao", "Marcus Hill", "Sara Yoon", "Diego Vega", "Mei Lin", "Noah Park", "Ivy Tran"][i],
    tag: ["VIP", "Newsletter", "Trial", "Customer"][i % 4],
  })), []);
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="03 · Fan‑out"
        title={<>Bulk <span className="gradient-text">send</span></>}
        subtitle="Dispatch the same message to thousands. Smart throttle, per‑domain pacing and automatic retries."
      />
      <SectionBanner image={imgBulk} alt="Bulk send network" tag="Fan‑out"
        headline="Smart throttling across pools — millions reached, reputation intact."
        stats={[{ label: "Recipients", value: "2.1k" }, { label: "Throttle", value: "1.2k/m" }, { label: "Pools", value: "4" }]} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div className="rounded-2xl border-2 border-dashed border-border bg-white/[0.02] p-10 text-center hover:border-cyan/40 transition cursor-pointer group">
            <div className="mx-auto size-14 rounded-2xl bg-gradient-to-br from-lime/20 to-cyan/20 grid place-items-center group-hover:scale-110 transition">
              <Upload className="size-6 text-cyan" />
            </div>
            <div className="mt-4 font-display font-semibold text-lg">Drop a recipient list</div>
            <p className="text-sm text-muted-foreground mt-1">CSV, TXT or paste below — up to 100,000 rows</p>
            <button className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-border text-sm hover:bg-white/10">Browse files</button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold">Recipients · 8 of 2,184 preview</h3>
              <button className="text-xs text-cyan flex items-center gap-1 hover:underline">All <ChevronRight className="size-3" /></button>
            </div>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="text-left p-3">Email</th><th className="text-left p-3">Name</th><th className="text-left p-3">Tag</th></tr>
                </thead>
                <tbody>
                  {recipients.map((r, i) => (
                    <tr key={i} className="border-t border-border hover:bg-white/[0.03]">
                      <td className="p-3 font-mono text-xs">{r.email}</td>
                      <td className="p-3">{r.name}</td>
                      <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-md bg-cyan/15 text-cyan">{r.tag}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <CardHeader title="Send configuration" subtitle="Throttle, schedule & template" />
          <Field label="Template">
            <select className="input"><option>Welcome · Onboarding v3</option><option>Receipt · Stripe checkout</option></select>
          </Field>
          <Field label="From">
            <select className="input"><option>hello@pulsemail.app</option><option>news@pulsemail.app</option></select>
          </Field>
          <Field label="Throttle (per minute)">
            <input type="range" min={100} max={5000} defaultValue={1200} className="w-full accent-lime" />
            <div className="flex justify-between text-[11px] text-muted-foreground"><span>100</span><span className="text-lime font-mono">1,200/min</span><span>5,000</span></div>
          </Field>
          <Field label="Schedule">
            <div className="grid grid-cols-2 gap-2">
              <button className="px-3 py-2 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground text-sm font-semibold">Send now</button>
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-border text-sm">Schedule</button>
            </div>
          </Field>
          <div className="rounded-xl bg-cyan/10 border border-cyan/20 p-3 text-xs text-cyan flex gap-2">
            <Globe2 className="size-4 shrink-0" />
            ETA ~ 1h 49m · across 4 sender pools
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- PERSONALIZED CSV ---------------- */

function PersonalizedCSV() {
  const sample = [
    { Name: "Alex Chen", Email: "alex@acme.io", Company: "Acme", Plan: "Pro" },
    { Name: "Priya Rao", Email: "priya@north.co", Company: "North", Plan: "Team" },
    { Name: "Marcus Hill", Email: "marcus@hex.dev", Company: "Hex", Plan: "Starter" },
    { Name: "Sara Yoon", Email: "sara@stripe.com", Company: "Stripe", Plan: "Enterprise" },
  ];
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="04 · Merge"
        title={<>Personalized <span className="gradient-text">CSV</span></>}
        subtitle="Upload a CSV, map columns to merge tags, and every recipient gets a perfectly tailored email."
      />
      <SectionBanner image={imgCsv} alt="CSV personalization" tag="Merge"
        headline="One template, infinite variations — every recipient feels seen."
        stats={[{ label: "Rows", value: "4" }, { label: "Tokens", value: "4/4" }, { label: "Ready", value: "100%" }]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader title="Source CSV" subtitle="recipients_q2.csv · 4 rows · 4 columns" />
          <div className="mt-4 rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm font-mono">
              <thead className="bg-white/[0.03] text-xs">
                <tr>{Object.keys(sample[0]).map(k => <th key={k} className="text-left p-3 text-cyan">{k}</th>)}</tr>
              </thead>
              <tbody>
                {sample.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {Object.values(row).map((v, j) => <td key={j} className="p-3 text-xs">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <CardHeader title="Merge mapping" subtitle="Match CSV columns ↦ template tokens" />
          <div className="space-y-3 mt-4">
            {[
              ["Name", "{{firstName}}"],
              ["Email", "{{to}}"],
              ["Company", "{{company}}"],
              ["Plan", "{{plan}}"],
            ].map(([col, tag], i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-border">
                <span className="text-sm font-mono px-2 py-1 rounded-md bg-cyan/15 text-cyan">{col}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
                <span className="text-sm font-mono px-2 py-1 rounded-md bg-lime/15 text-lime">{tag}</span>
                <CheckCircle2 className="size-4 text-lime ml-auto" />
              </div>
            ))}
          </div>
          <button className="mt-5 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold flex items-center justify-center gap-2">
            <Sparkles className="size-4" /> Generate 4 personalized emails
          </button>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- CAMPAIGN TRACKER ---------------- */

const campaigns = [
  { name: "Spring Launch", status: "active", sent: 12420, open: 64, click: 18, bounce: 0.4 },
  { name: "Receipt · Stripe", status: "active", sent: 8421, open: 58, click: 4, bounce: 0.1 },
  { name: "Onboarding v3", status: "paused", sent: 3120, open: 71, click: 22, bounce: 0.6 },
  { name: "Re‑engage 30d", status: "active", sent: 1240, open: 41, click: 9, bounce: 1.2 },
  { name: "Black Friday tease", status: "draft", sent: 0, open: 0, click: 0, bounce: 0 },
];

function CampaignTracker() {
  const perfData = Array.from({ length: 14 }).map((_, i) => ({
    d: `D${i + 1}`,
    opens: 200 + Math.round(Math.random() * 300 + i * 20),
    clicks: 60 + Math.round(Math.random() * 80 + i * 6),
  }));
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="05 · Live"
        title={<>Campaign <span className="gradient-text">tracker</span></>}
        subtitle="Monitor every active and recent campaign — opens, clicks, bounces, complaints."
      />
      <SectionBanner image={imgTracker} alt="Campaign tracker" tag="Analytics"
        headline="Opens, clicks and complaints — every signal, every campaign."
        stats={[{ label: "Active", value: "3" }, { label: "Avg open", value: "54%" }, { label: "CTR", value: "13%" }]} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-6">
          <CardHeader title="Engagement · last 14 days" subtitle="Opens vs clicks across all campaigns" />
          <div className="h-72 mt-4">
            <ResponsiveContainer>
              <BarChart data={perfData} barGap={4}>
                <CartesianGrid strokeDasharray="3 6" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="d" stroke="oklch(1 0 0 / 0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(1 0 0 / 0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.20 0.025 250)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="opens" fill="var(--cyan)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="clicks" fill="var(--lime)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <CardHeader title="Heartbeat" subtitle="Live ops" />
          <div className="space-y-4 mt-4">
            {[
              { label: "Queue depth", value: "0", color: "lime" },
              { label: "Avg latency", value: "184ms", color: "cyan" },
              { label: "Active workers", value: "12", color: "amber" },
              { label: "SMTP errors", value: "2", color: "rose" },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                <span className="text-sm text-muted-foreground">{m.label}</span>
                <span className="font-display text-xl font-bold" style={{ color: `var(--${m.color})` }}>{m.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <CardHeader title="All campaigns" subtitle="Active, paused & draft" right={
          <button className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-border flex items-center gap-1">
            <Filter className="size-3" /> Filter
          </button>
        } />
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Campaign</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Sent</th>
                <th className="text-right p-3">Open %</th>
                <th className="text-right p-3">Click %</th>
                <th className="text-right p-3">Bounce %</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <tr key={i} className="border-t border-border hover:bg-white/[0.03]">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3"><StatusPill status={c.status as any} /></td>
                  <td className="p-3 text-right font-mono">{c.sent.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-lime">{c.open}%</td>
                  <td className="p-3 text-right font-mono text-cyan">{c.click}%</td>
                  <td className="p-3 text-right font-mono text-rose">{c.bounce}%</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <IconBtn icon={c.status === "paused" ? Play : Pause} />
                      <IconBtn icon={Copy} />
                      <IconBtn icon={Trash2} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- HISTORY LOGS ---------------- */

function HistoryLogs() {
  const logs = Array.from({ length: 12 }).map((_, i) => ({
    ts: new Date(Date.now() - i * 1000 * 60 * 7).toLocaleString(),
    level: (["info", "info", "warn", "info", "error"] as const)[i % 5],
    msg: [
      "Delivered to mailbox · alex@acme.io",
      "Opened by priya@north.co · UA Safari",
      "Soft bounce · mailbox full · queued retry",
      "Click on https://pulsemail.app/cta",
      "Hard bounce · invalid recipient · suppressed",
    ][i % 5],
    campaign: ["Spring Launch", "Receipt", "Onboarding v3", "Re‑engage"][i % 4],
  }));
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="06 · Audit"
        title={<>History <span className="gradient-text">logs</span></>}
        subtitle="Append‑only event stream. Filter by campaign, recipient, or level."
      />
      <SectionBanner image={imgTracker} alt="History logs" tag="Audit"
        headline="An append‑only timeline of every event your domain has touched."
        stats={[{ label: "Events", value: "184k" }, { label: "Retention", value: "90d" }, { label: "Levels", value: "3" }]} />
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <input placeholder="Search by recipient, message ID, campaign…" className="input flex-1 min-w-64" />
          <PillButton icon={Filter}>Level</PillButton>
          <PillButton icon={Filter}>Campaign</PillButton>
          <PillButton icon={Download}>Export CSV</PillButton>
        </div>
        <div className="divide-y divide-border font-mono text-sm">
          {logs.map((l, i) => (
            <div key={i} className="grid grid-cols-[160px_70px_1fr_140px] items-center px-4 py-3 hover:bg-white/[0.03] gap-3">
              <span className="text-xs text-muted-foreground">{l.ts}</span>
              <LevelBadge level={l.level} />
              <span className="truncate">{l.msg}</span>
              <span className="text-xs text-cyan text-right">{l.campaign}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function LevelBadge({ level }: { level: "info" | "warn" | "error" }) {
  const map = {
    info: { c: "cyan", label: "INFO" },
    warn: { c: "amber", label: "WARN" },
    error: { c: "rose", label: "ERR" },
  } as const;
  const x = map[level];
  return <span className="text-[10px] tracking-wider font-bold px-2 py-1 rounded-md text-center"
    style={{ background: `oklch(from var(--${x.c}) l c h / 0.15)`, color: `var(--${x.c})` }}>{x.label}</span>;
}

/* ---------------- TEMPLATE GALLERY ---------------- */

const templates = [
  { name: "Onboarding v3", category: "Lifecycle", color: "from-lime to-cyan", uses: 3120 },
  { name: "Receipt · Stripe", category: "Transactional", color: "from-cyan to-amber", uses: 8421 },
  { name: "Re‑engage 30d", category: "Lifecycle", color: "from-rose to-amber", uses: 1240 },
  { name: "Product launch", category: "Marketing", color: "from-lime to-amber", uses: 4760 },
  { name: "Password reset", category: "Transactional", color: "from-cyan to-lime", uses: 12384 },
  { name: "Weekly digest", category: "Newsletter", color: "from-amber to-rose", uses: 6710 },
];

function TemplateGallery() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="07 · Library"
        title={<>Template <span className="gradient-text">gallery</span></>}
        subtitle="Visually drafted, version‑controlled email templates."
        right={<button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold text-sm flex items-center gap-2"><Plus className="size-4" /> New template</button>}
      />
      <SectionBanner image={imgTemplates} alt="Template gallery" tag="Library"
        headline="A versioned library of branded templates, ready to compose."
        stats={[{ label: "Templates", value: "37" }, { label: "Avg open", value: "52%" }, { label: "Drafts", value: "6" }]} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {templates.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="group rounded-2xl overflow-hidden glass cursor-pointer"
          >
            <div className={`h-44 bg-gradient-to-br ${t.color} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_50%)]" />
              <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/95 p-3 shadow-xl">
                <div className="h-1.5 w-16 rounded bg-zinc-300 mb-2" />
                <div className="h-1.5 w-32 rounded bg-zinc-200 mb-1" />
                <div className="h-1.5 w-24 rounded bg-zinc-200" />
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="font-display font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.category} · {t.uses.toLocaleString()} sends</div>
              </div>
              <button className="size-9 rounded-xl bg-white/5 grid place-items-center group-hover:bg-gradient-to-r group-hover:from-lime group-hover:to-cyan group-hover:text-primary-foreground transition">
                <ArrowUpRight className="size-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- SETTINGS ---------------- */

function SettingsSMTP() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="08 · Config"
        title={<>Settings & <span className="gradient-text">SMTP</span></>}
        subtitle="Sender identity, SMTP credentials, domain authentication."
      />
      <SectionBanner image={imgOverview} alt="Settings & SMTP" tag="Config"
        headline="One workspace, one verified identity, every domain aligned."
        stats={[{ label: "Domains", value: "1" }, { label: "DKIM", value: "OK" }, { label: "SPF", value: "OK" }]} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-5">
          <CardHeader title="SMTP credentials" subtitle="Used to dispatch outbound mail" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Host"><input className="input" defaultValue="smtp.pulsemail.app" /></Field>
            <Field label="Port"><input className="input" defaultValue="587" /></Field>
            <Field label="Username"><input className="input" defaultValue="api" /></Field>
            <Field label="Password"><input className="input" type="password" defaultValue="••••••••••••" /></Field>
            <Field label="From name"><input className="input" defaultValue="Pulsemail" /></Field>
            <Field label="From address"><input className="input" defaultValue="hello@pulsemail.app" /></Field>
          </div>
          <div className="flex gap-2 pt-2">
            <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold text-sm">Save changes</button>
            <button className="px-4 py-2.5 rounded-xl bg-white/5 border border-border text-sm">Test connection</button>
          </div>
        </Card>
        <Card className="p-6 space-y-4">
          <CardHeader title="Domain auth" subtitle="DNS verification" />
          {[
            { label: "SPF", ok: true },
            { label: "DKIM", ok: true },
            { label: "DMARC", ok: true },
            { label: "BIMI", ok: false },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-border">
              <span className="font-mono text-sm">{d.label}</span>
              {d.ok ? (
                <span className="flex items-center gap-1.5 text-xs text-lime"><CheckCircle2 className="size-4" /> Verified</span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber"><AlertTriangle className="size-4" /> Pending</span>
              )}
            </div>
          ))}
          <div className="text-xs text-muted-foreground pt-2">Resolved against <span className="font-mono text-cyan">pulsemail.app</span></div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- PRIMITIVES ---------------- */

function SectionHeader({ eyebrow, title, subtitle, right }: { eyebrow: string; title: React.ReactNode; subtitle: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4">
      <div>
        <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-2">{eyebrow}</div>
        <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}

function SectionBanner({ image, alt, tag, headline, stats }: { image: string; alt: string; tag: string; headline: string; stats: { label: string; value: string }[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-48 lg:h-56 rounded-3xl overflow-hidden border border-border group"
    >
      <img src={image} alt={alt} loading="lazy" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      <div className="relative h-full p-6 lg:p-8 flex items-center">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-cyan px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20">
            <span className="size-1.5 rounded-full bg-cyan animate-pulse" /> {tag}
          </div>
          <h2 className="mt-3 font-display text-xl lg:text-2xl font-semibold max-w-md">{headline}</h2>
        </div>
        <div className="hidden md:grid grid-cols-3 gap-6 pr-2">
          {stats.map((s, i) => (
            <div key={i} className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">{s.value}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, delta, up, icon: Icon, accent }: { label: string; value: string; delta: string; up?: boolean; icon: any; accent: "lime" | "cyan" | "rose" | "amber" }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="relative p-5 rounded-2xl glass overflow-hidden group"
    >
      <div className="absolute -top-8 -right-8 size-28 blur-3xl opacity-40 rounded-full"
        style={{ background: `var(--${accent})` }} />
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="size-8 rounded-lg grid place-items-center"
          style={{ background: `oklch(from var(--${accent}) l c h / 0.15)`, color: `var(--${accent})` }}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      <div className={`mt-1 text-xs flex items-center gap-1 ${up === undefined ? "text-muted-foreground" : up ? "text-lime" : "text-rose"}`}>
        {up !== undefined && (up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />)}
        {delta}
      </div>
    </motion.div>
  );
}

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-3xl glass ${className}`}>{children}</div>;
}

function CardHeader({ title, subtitle, chips, right }: { title: string; subtitle?: string; chips?: { label: string; color: string }[]; right?: React.ReactNode }) {
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
        {right}
      </div>
    </div>
  );
}

function Field({ label, required, optional, children }: { label: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium flex items-center gap-1.5">
        {label}
        {required && <span className="text-rose">*</span>}
        {optional && <span className="text-[11px] text-muted-foreground font-normal">(optional)</span>}
      </span>
      {children}
    </label>
  );
}

function PillButton({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <button className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs flex items-center gap-2">
      <Icon className="size-3.5" /> {children}
    </button>
  );
}

function IconBtn({ icon: Icon }: { icon: any }) {
  return (
    <button className="size-8 grid place-items-center rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground">
      <Icon className="size-4" />
    </button>
  );
}

function StatusPill({ status }: { status: "active" | "paused" | "draft" }) {
  const map = {
    active: { c: "lime", label: "Active", dot: true },
    paused: { c: "amber", label: "Paused", dot: false },
    draft: { c: "cyan", label: "Draft", dot: false },
  } as const;
  const x = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
      style={{ background: `oklch(from var(--${x.c}) l c h / 0.15)`, color: `var(--${x.c})` }}>
      {x.dot && <span className="size-1.5 rounded-full animate-pulse" style={{ background: `var(--${x.c})` }} />}
      {x.label}
    </span>
  );
}
