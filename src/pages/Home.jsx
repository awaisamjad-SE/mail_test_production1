import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, Sun, Moon, Zap, Users, Sparkles, Layout, ArrowRight, Play, 
  CheckCircle2, Shield, Lock, Eye, ListFilter, ClipboardCheck,
  UserCheck, Target, Briefcase, GraduationCap, Store, Laptop, Inbox, RefreshCw,
  Flame, HelpCircle, Ban, AlertTriangle, CornerUpLeft, Activity, Layers, Check
} from 'lucide-react';

export default function Home({ onEnter }) {
  const { isDark, toggle } = useTheme();
  const { isLoggedIn } = useAuth();
  const [activeDemoTab, setActiveDemoTab] = useState('UNIBOX'); // 'UNIBOX' | 'CAMPAIGNS' | 'REPLY'

  const features = [
    {
      icon: Inbox,
      title: 'Unified Lead Master Unibox',
      desc: 'Sync Hostinger & Gmail IMAP threads into a single hub. Automatically purge social newsletters and tag lead sentiment (Positive, Questions, Churn Risk).',
      color: 'from-cyan/20 to-lime/20 text-cyan',
      badge: 'IMAP Auto-Sync'
    },
    {
      icon: Users,
      title: 'High-Volume Batch Campaigns',
      desc: 'Upload CSV lists, inject dynamic variables like {{Name}}, and broadcast campaigns with humanized delays (45s–2min) and 150/day safe account caps.',
      color: 'from-lime/20 to-cyan/20 text-lime',
      badge: '150/day Safe Cap'
    },
    {
      icon: AlertTriangle,
      title: 'Recipient & Bounce Audit Log',
      desc: 'Inspect every target recipient status (SENT, BOUNCED, REPLIED), view dispatch timestamps, and examine exact SMTP diagnostic error codes.',
      color: 'from-rose/20 to-amber/20 text-rose',
      badge: 'Diagnostic Telemetry'
    },
    {
      icon: CornerUpLeft,
      title: 'Direct Quick Reply & Forward Drawer',
      desc: 'Reply to leads instantly via SMTP or forward email threads to team members with custom notes and quoted message history.',
      color: 'from-cyan/20 to-lime/20 text-cyan',
      badge: 'SMTP Dispatch'
    },
    {
      icon: Lock,
      title: 'AES Cryptographic Pipeline',
      desc: 'App Passwords are encrypted using static Fernet keys. Credentials remain strictly write-only with zero network exposure.',
      color: 'from-lime/20 to-cyan/20 text-lime',
      badge: 'Fernet AES Encryption'
    },
    {
      icon: Activity,
      title: 'Real-Time Telemetry Dashboard',
      desc: 'Monitor 30-day sending throughput area charts, delivery status partitions, active worker threads, and live activity audit feeds.',
      color: 'from-amber/20 to-cyan/20 text-amber',
      badge: 'Live Worker Pool'
    },
  ];

  const scrollToSetup = () => {
    const el = document.getElementById('step-by-step-guide');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-x-hidden relative bg-background text-foreground selection:bg-cyan/20 selection:text-cyan">
      
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-lime/10 opacity-30 blur-[140px] -translate-y-1/2 animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-10 w-[700px] h-[700px] rounded-full bg-cyan/10 opacity-25 blur-[160px]" />
      </div>

      {/* Navigation Header */}
      <header className="border-b border-border bg-background/70 backdrop-blur-xl sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-lime to-cyan flex items-center justify-center shadow-lg shadow-lime/20">
              <Mail className="size-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-lime via-cyan to-lime bg-clip-text text-transparent">
                MailFlow
              </span>
              <span className="text-[9px] ml-1.5 px-2 py-0.5 rounded bg-cyan/15 border border-cyan/20 text-cyan font-mono font-bold uppercase tracking-wider">
                SaaS v2.4
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="p-2 rounded-xl bg-white/5 border border-border hover:bg-white/10 transition cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-indigo-400" />}
            </button>

            <button
              onClick={onEnter}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime to-cyan text-zinc-950 font-bold text-xs flex items-center gap-2 hover:shadow-[0_8px_30px_-8px] hover:shadow-lime/60 transition cursor-pointer"
            >
              <span>{isLoggedIn ? 'Go to Console' : 'Launch Console'}</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center z-10 flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan/10 border border-cyan/20 text-xs font-mono font-semibold text-cyan mb-6 mx-auto shadow-sm">
          <span className="size-2 rounded-full bg-lime animate-pulse" />
          <span>98.4% Domain Deliverability Alignment · DKIM & SPF Ready</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground max-w-5xl mx-auto leading-[1.1]">
          Supercharge Cold Outreach &{' '}
          <span className="gradient-text">Lead Unibox Automation</span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Broadcast high-deliverability campaigns, sync Hostinger & Gmail lead responses in real time, auto-classify lead intent, and audit hard/soft bounces with 0 spam risk.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onEnter}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-lime to-cyan text-zinc-950 font-bold text-sm flex items-center gap-2 hover:shadow-[0_8px_30px_-8px] hover:shadow-lime/60 transition cursor-pointer"
          >
            <Play className="size-4 fill-current" />
            <span>{isLoggedIn ? 'Go to Ops Console' : 'Get Started Free'}</span>
          </button>
          <button
            onClick={scrollToSetup}
            className="px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-sm font-semibold flex items-center gap-2 cursor-pointer transition"
          >
            <span>Read Platform Setup</span>
          </button>
        </div>

        {/* Stats Metrics Bar */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-y border-border py-8 font-mono">
          <div>
            <h4 className="text-2xl font-bold text-lime">150 / day</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">Safe Account Cap</p>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-cyan">45s – 2min</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">Humanized Jitter Delay</p>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-lime">IMAP Sync</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">20s Auto-Poll Unibox</p>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-amber">Fernet AES</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">Encrypted Passwords</p>
          </div>
        </div>
      </section>

      {/* Interactive Product Feature Workspace Demo */}
      <section className="max-w-6xl mx-auto px-6 py-12 z-10 w-full">
        <div className="rounded-3xl glass border border-border p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-rose/60" />
              <span className="size-3 rounded-full bg-amber/60" />
              <span className="size-3 rounded-full bg-lime/60" />
              <span className="text-muted-foreground ml-2 font-bold text-foreground">MailFlow Platform Interactive Mockup</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-border">
              {[
                { key: 'UNIBOX', label: 'Lead Unibox' },
                { key: 'CAMPAIGNS', label: 'Campaign Audit' },
                { key: 'REPLY', label: 'Forwarding Drawer' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveDemoTab(tab.key)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeDemoTab === tab.key ? 'bg-cyan text-zinc-950 font-bold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Demo Content Box */}
          <div className="min-h-[280px] flex flex-col justify-center">
            {activeDemoTab === 'UNIBOX' && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-border space-y-3 font-mono text-xs animate-fade-in">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">kics AI</span>
                    <span className="text-muted-foreground">&lt;aaap1828@gmail.com&gt;</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-lime/20 text-lime font-bold text-[10px]">
                    🔥 Positive Reply
                  </span>
                </div>
                <p className="font-bold text-cyan">Subject: Re: Cold Outreach Partnership</p>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-muted-foreground text-xs font-sans leading-relaxed">
                  "Thanks for reaching out Awais! Thursday works great for a call. Here is my calendar link."
                </div>
              </div>
            )}

            {activeDemoTab === 'CAMPAIGNS' && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-border space-y-3 font-mono text-xs animate-fade-in">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-bold text-foreground">Campaign: Q3 SaaS Founders Outreach</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-lime/20 text-lime font-bold text-[10px]">Active Processing</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-border">
                    <span className="text-[10px] text-muted-foreground">Dispatched</span>
                    <p className="font-bold text-lime text-base mt-0.5">142 / 150</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan/5 border border-cyan/30">
                    <span className="text-[10px] text-cyan">Replies</span>
                    <p className="font-bold text-cyan text-base mt-0.5">18 (12.6%)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose/5 border border-rose/30">
                    <span className="text-[10px] text-rose">Bounces</span>
                    <p className="font-bold text-rose text-base mt-0.5">1 (0.7%)</p>
                  </div>
                </div>
              </div>
            )}

            {activeDemoTab === 'REPLY' && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-border space-y-3 font-mono text-xs animate-fade-in">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-bold text-cyan flex items-center gap-1.5">
                    <CornerUpLeft className="size-4" /> Quick Reply & Forward Drawer
                  </span>
                  <span className="text-muted-foreground">From: awaisamjad.official@gmail.com</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-muted-foreground font-sans text-xs">
                  Writing direct reply / forwarding lead thread to colleague with custom intro note...
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Available Features Grid Section */}
      <section className="border-t border-border bg-white/[0.005] py-24 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-xs font-mono font-semibold text-cyan">
              <span>CORE ARCHITECTURE</span>
            </div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Built for Enterprise Cold Email Scaling</h2>
            <p className="text-sm text-muted-foreground">
              Discover powerful tools designed to manage bulk marketing and transactional communications with maximum deliverability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="rounded-3xl glass border border-border hover:border-cyan/35 transition-all duration-300 p-6 flex flex-col justify-between h-full group shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`size-12 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 border border-border`}>
                        <Icon className="size-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/5 border border-border text-muted-foreground">
                        {feat.badge}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base text-foreground mb-2">{feat.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Target Workflows Section */}
      <section className="border-t border-border bg-white/[0.002] py-24 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime/10 border border-lime/20 text-xs font-mono font-semibold text-lime">
              <span>TARGET USE CASES</span>
            </div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Designed for Every Growth Workflow</h2>
            <p className="text-sm text-muted-foreground">
              Discover how sales teams, recruiters, and agencies leverage MailFlow to scale their communications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Sales & SDR Teams",
                items: ["Cold outreach sequences", "Lead sentiment tracking", "Direct inbox quick replies", "Bounce error diagnostics"],
                color: "from-lime/10 to-cyan/5 text-lime border-lime/20",
              },
              {
                icon: UserCheck,
                title: "Recruiters & HR Leaders",
                items: ["Interview invitations", "Candidate screening follow-ups", "Offer letters dispatch", "Automated rejection tracking"],
                color: "from-cyan/10 to-lime/5 text-cyan border-cyan/20",
              },
              {
                icon: Briefcase,
                title: "Outreach Agencies",
                items: ["Multi-client campaign tracking", "Hostinger & Gmail IMAP sync", "Forward lead threads to clients", "Daily sending volume caps"],
                color: "from-lime/10 to-cyan/5 text-lime border-lime/20",
              },
              {
                icon: Store,
                title: "Founders & Consultants",
                items: ["Direct client notices", "Investor update broadcasts", "Personalized CSV merges", "Fernet App Password security"],
                color: "from-cyan/10 to-lime/5 text-cyan border-cyan/20",
              },
              {
                icon: GraduationCap,
                title: "Universities & Schools",
                items: ["Student notifications", "Admission updates", "Event invitations", "Bulk status dispatches"],
                color: "from-lime/10 to-cyan/5 text-lime border-lime/20",
              },
              {
                icon: Laptop,
                title: "Developers & Creators",
                items: ["API webhook alerts", "System warning alerts", "Newsletter updates", "Rate limit monitoring"],
                color: "from-cyan/10 to-lime/5 text-cyan border-cyan/20",
              },
            ].map((workflow, idx) => {
              const Icon = workflow.icon;
              return (
                <div key={idx} className="rounded-3xl glass border border-border p-6 flex flex-col h-full hover:border-cyan/30 transition-all duration-300">
                  <div className={`size-10 rounded-xl bg-gradient-to-br ${workflow.color} flex items-center justify-center mb-5 border`}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-display font-bold text-sm text-foreground mb-3">{workflow.title}</h3>
                  <ul className="space-y-2 flex-1">
                    {workflow.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground font-sans">
                        <CheckCircle2 className="size-3.5 text-cyan shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Matrix Section */}
      <section className="border-t border-border py-24 z-10 bg-white/[0.005]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-xs font-mono font-semibold text-cyan">
              <span>COMPETITIVE ADVANTAGE</span>
            </div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Why Teams Choose MailFlow</h2>
            <p className="text-sm text-muted-foreground">
              A side-by-side comparison of standard merge tools, traditional marketing dispatchers, and MailFlow.
            </p>
          </div>

          <div className="max-w-4xl mx-auto overflow-hidden rounded-3xl glass border border-border shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-white/[0.01] font-mono">
                    <th className="p-4 md:p-5 font-semibold text-foreground">Feature</th>
                    <th className="p-4 md:p-5 font-semibold text-muted-foreground">Gmail Merge</th>
                    <th className="p-4 md:p-5 font-semibold text-muted-foreground">Mailchimp</th>
                    <th className="p-4 md:p-5 font-semibold text-muted-foreground">Apollo / Lemlist</th>
                    <th className="p-4 md:p-5 font-semibold text-cyan font-bold bg-cyan/5">MailFlow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/45 font-mono">
                  {[
                    { feat: "Unified Lead Master Unibox", m1: "❌", m2: "❌", m3: "Limited ($99/mo)", m4: "✅ Included" },
                    { feat: "Hostinger & Gmail IMAP Sync", m1: "❌", m2: "❌", m3: "Extra Fee", m4: "✅ Included" },
                    { feat: "AI Sentiment Tagging", m1: "❌", m2: "❌", m3: "✅", m4: "✅ Included" },
                    { feat: "Humanized Jitter Delay (45s–2m)", m1: "❌", m2: "❌", m3: "✅", m4: "✅ Included" },
                    { feat: "Recipient Bounce Audit Logs", m1: "❌", m2: "Basic", m3: "✅", m4: "✅ Included" },
                    { feat: "Forward Lead Thread Drawer", m1: "❌", m2: "❌", m3: "❌", m4: "✅ Included" },
                    { feat: "Fernet Encrypted App Passwords", m1: "❌", m2: "❌", m3: "Basic", m4: "✅ Included" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 md:p-5 font-medium text-foreground font-sans">{row.feat}</td>
                      <td className="p-4 md:p-5 text-muted-foreground">{row.m1}</td>
                      <td className="p-4 md:p-5 text-muted-foreground">{row.m2}</td>
                      <td className="p-4 md:p-5 text-muted-foreground">{row.m3}</td>
                      <td className="p-4 md:p-5 font-bold text-lime bg-cyan/5">{row.m4}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* User Setup Guide Section */}
      <section id="step-by-step-guide" className="max-w-7xl mx-auto px-6 py-24 z-10 space-y-16 border-t border-border">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center justify-center gap-3">
            <ClipboardCheck className="size-8 text-cyan" />
            <span>Platform Setup & Dispatch Guide</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Follow these three simple steps to secure your credentials, launch outreach campaigns, and manage incoming lead replies.
          </p>
        </div>

        {/* 3 Steps Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="p-6 rounded-3xl glass border border-border space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/15 border border-cyan/25 text-xs font-mono font-bold text-cyan">
              STEP 1
            </div>
            <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
              <Lock className="size-5 text-cyan" /> Configure Credentials
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Navigate to **Settings & SMTP** tab. Enter your Gmail address and 16-digit Google App Password. Credentials are encrypted using static Fernet keys.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass border border-border space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime/15 border border-lime/25 text-xs font-mono font-bold text-lime">
              STEP 2
            </div>
            <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
              <Zap className="size-5 text-lime" /> Launch Campaign
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload a CSV file of contacts in **Campaigns Hub**. Inject variables like `{"{{Name}}"}` in your template and launch with 150/day safe account limits.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass border border-border space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/15 border border-cyan/25 text-xs font-mono font-bold text-cyan">
              STEP 3
            </div>
            <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
              <Inbox className="size-5 text-cyan" /> Reply from Unibox
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Watch incoming lead replies sync into **Master Unibox** in real time. Use the Quick Reply text composer or forward lead threads to colleagues.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-transparent pt-12 pb-8 text-xs text-muted-foreground/50 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-gradient-to-br from-lime to-cyan flex items-center justify-center text-zinc-950 font-bold">
                <Mail className="size-4.5" />
              </div>
              <div>
                <span className="font-display font-extrabold text-sm tracking-tight text-foreground">
                  MailFlow
                </span>
                <span className="text-[10px] text-muted-foreground/30 font-mono mx-2">|</span>
                <span className="text-xs">
                  Developed by <a href="https://awaisamjad.engineer/" target="_blank" rel="noopener noreferrer" className="text-cyan hover:text-lime transition underline underline-offset-4 decoration-cyan/30 font-semibold">Awais Amjad</a>
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-[11px] font-mono">
              <button onClick={onEnter} className="hover:text-cyan transition bg-transparent border-none p-0 cursor-pointer">Console Dashboard</button>
              <button onClick={scrollToSetup} className="hover:text-cyan transition bg-transparent border-none p-0 cursor-pointer">Setup Guide</button>
              <span className="flex items-center gap-1 text-lime font-bold bg-lime/10 border border-lime/20 px-2 py-0.5 rounded">
                <span className="size-1.5 rounded-full bg-lime animate-pulse" /> Engine Active
              </span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/10 text-center text-[10px] text-muted-foreground/45 font-mono">
            © 2026 MailFlow Email Automation. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
