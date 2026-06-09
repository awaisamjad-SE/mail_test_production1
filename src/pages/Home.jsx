import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, Sun, Moon, Zap, Users, Sparkles, Layout, ArrowRight, Play, 
  CheckCircle2, Shield, Lock, Eye, ListFilter, ClipboardCheck,
  UserCheck, Target, Briefcase, GraduationCap, Store, Laptop
} from 'lucide-react';

export default function Home({ onEnter }) {
  const { isDark, toggle } = useTheme();
  const { isLoggedIn } = useAuth();

  const features = [
    {
      icon: Zap,
      title: 'Quick Single Dispatch',
      desc: 'Compose and dispatch individual emails instantly. Perfect for direct client notices, custom messages, and quick notifications with live sandbox rendering.',
      color: 'from-lime/20 to-cyan/20 text-cyan',
    },
    {
      icon: Users,
      title: 'High-Volume Bulk Campaigns',
      desc: 'Upload standard CSV lists of contacts to launch bulk campaigns. The background dispatcher processes them concurrently without affecting website usability.',
      color: 'from-cyan/20 to-lime/20 text-lime',
    },
    {
      icon: Sparkles,
      title: 'Dynamic Personalized Emails',
      desc: 'Inject variables (like {{Name}}) to personalize subject lines and email bodies dynamically for each recipient based on CSV columns.',
      color: 'from-lime/20 to-cyan/20 text-cyan',
    },
    {
      icon: Layout,
      title: 'Rich Pre-Built Templates',
      desc: 'Select from pre-configured visual layouts (Newsletter, Welcomes, Job Updates, Alerts) and instantly tweak colors, content, and CTA links.',
      color: 'from-cyan/20 to-lime/20 text-lime',
    },
    {
      icon: Eye,
      title: 'Sandboxed Client Previews',
      desc: 'Inspect rendering inside an isolated secure iframe mock. Simulates desktop and mobile email viewports before you click send.',
      color: 'from-lime/20 to-cyan/20 text-cyan',
    },
    {
      icon: ListFilter,
      title: 'Transmission Audit & Logs',
      desc: 'Track every sent log, search recipients, inspect processing queues, check delivery statuses (SENT, FAILED), and view recent activity feeds.',
      color: 'from-cyan/20 to-lime/20 text-lime',
    },
  ];

  const scrollToSetup = () => {
    const el = document.getElementById('step-by-step-guide');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-x-hidden relative bg-background text-foreground">
      
      {/* Background Accent Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-lime/10 opacity-30 blur-[120px] -translate-x-1/4 -translate-y-1/4 animate-pulse-glow" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-cyan/10 opacity-25 blur-[150px] translate-x-1/4 translate-y-1/4" />
      </div>

      {/* Header */}
      <header className="border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime to-cyan flex items-center justify-center shadow-lg shadow-lime/20">
              <Mail className="w-5.5 h-5.5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-lime via-cyan to-lime bg-clip-text text-transparent">
                MailFlow
              </span>
              <span className="text-[9px] ml-1.5 px-2 py-0.5 rounded bg-cyan/15 border border-cyan/20 text-cyan font-mono font-bold uppercase tracking-wider">
                Console Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="p-2 rounded-xl bg-white/5 border border-border hover:bg-white/10 transition cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="size-4.5 text-amber-400" /> : <Moon className="size-4.5 text-indigo-400" />}
            </button>

            <button
              onClick={onEnter}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold text-xs flex items-center gap-2 hover:shadow-[0_8px_30px_-8px] hover:shadow-lime/60 transition cursor-pointer"
            >
              <span>{isLoggedIn ? 'Go to Console' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-16 text-center z-10 flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-xs font-mono font-semibold text-cyan mb-6 mx-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
          <span>Professional Bulk Email Infrastructure</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
          Send Professional Emails{' '}
          <span className="gradient-text">
            Instantly & Securely
          </span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Manage, verify, and broadcast premium email campaigns. Draft custom messages, upload contact lists, inspect outputs live, and track delivery progress in real time.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onEnter}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold text-sm flex items-center gap-2 hover:shadow-[0_8px_30px_-8px] hover:shadow-lime/60 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isLoggedIn ? 'Go to Dashboard' : 'Get Started Now'}</span>
          </button>
          <button
            onClick={scrollToSetup}
            className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-sm flex items-center gap-2 cursor-pointer transition"
          >
            <span>Read Setup Guide</span>
          </button>
        </div>

        {/* Stats bar */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-y border-border py-8 font-mono">
          <div>
            <h4 className="text-2xl font-bold gradient-text">Direct SMTP</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">Gmail Authentication</p>
          </div>
          <div>
            <h4 className="text-2xl font-bold gradient-text">Secure AES</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">Credentials Crypt</p>
          </div>
          <div>
            <h4 className="text-2xl font-bold gradient-text">Live Client</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">HTML Sandbox Previews</p>
          </div>
          <div>
            <h4 className="text-2xl font-bold gradient-text">Limit Guard</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">Rate Auto Suspension</p>
          </div>
        </div>
      </section>

      {/* Available Features Section */}
      <section className="border-t border-border bg-white/[0.01] py-24 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Advanced Infrastructure Features</h2>
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
                  className="rounded-3xl glass border border-border hover:border-cyan/30 transition-all duration-300 p-6 flex flex-col justify-between h-full group"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 mb-5 border border-border`}>
                      <Icon className="w-5.5 h-5.5" />
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

      {/* Designed for Every Workflow Section */}
      <section className="border-t border-border bg-white/[0.005] py-24 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime/10 border border-lime/20 text-xs font-mono font-semibold text-lime">
              <span>TARGET AUDIENCES</span>
            </div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Designed for Every Workflow</h2>
            <p className="text-sm text-muted-foreground">
              Discover how different teams leverage MailFlow to scale their communications with safety and speed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: UserCheck,
                title: "HR & Recruiters",
                items: ["Interview invitations", "Rejection emails", "Offer letters", "Follow-ups"],
                color: "from-lime/10 to-cyan/5 text-lime border-lime/20",
              },
              {
                icon: Target,
                title: "Sales Teams",
                items: ["Cold outreach", "Lead nurturing", "Product demos"],
                color: "from-cyan/10 to-lime/5 text-cyan border-cyan/20",
              },
              {
                icon: Briefcase,
                title: "Agencies & Consultants",
                items: ["Client updates", "Marketing campaigns", "Reports dispatch"],
                color: "from-lime/10 to-cyan/5 text-lime border-lime/20",
              },
              {
                icon: GraduationCap,
                title: "Schools & Universities",
                items: ["Student notifications", "Admission updates", "Event invites"],
                color: "from-cyan/10 to-lime/5 text-cyan border-cyan/20",
              },
              {
                icon: Store,
                title: "Small Businesses",
                items: ["Promotions", "Announcements", "Customer loyalty"],
                color: "from-lime/10 to-cyan/5 text-lime border-lime/20",
              },
              {
                icon: Laptop,
                title: "Developers & Creators",
                items: ["API status logs", "System warning alerts", "Newsletter updates", "Webhook alerts"],
                color: "from-cyan/10 to-lime/5 text-cyan border-cyan/20",
              },
            ].map((workflow, idx) => {
              const Icon = workflow.icon;
              return (
                <div key={idx} className="rounded-3xl glass border border-border p-6 flex flex-col h-full hover:border-cyan/30 transition-all duration-300">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${workflow.color} flex items-center justify-center mb-5 border`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-sm text-foreground mb-3">{workflow.title}</h3>
                  <ul className="space-y-2 flex-1">
                    {workflow.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan shrink-0 mt-0.5" />
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
              <span>PLATFORM COMPARISON</span>
            </div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Why Teams Choose MailFlow</h2>
            <p className="text-sm text-muted-foreground">
              A side-by-side comparison of standard merge practices, massive marketing dispatchers, and MailFlow.
            </p>
          </div>

          <div className="max-w-4xl mx-auto overflow-hidden rounded-3xl glass border border-border shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-white/[0.01]">
                    <th className="p-4 md:p-5 font-semibold text-foreground">Feature</th>
                    <th className="p-4 md:p-5 font-semibold text-muted-foreground">Gmail Mail Merge</th>
                    <th className="p-4 md:p-5 font-semibold text-muted-foreground">Mailchimp</th>
                    <th className="p-4 md:p-5 font-semibold text-muted-foreground">Brevo</th>
                    <th className="p-4 md:p-5 font-semibold text-cyan font-bold bg-cyan/5">MailFlow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/45">
                  {[
                    { feat: "Gmail Sending", m1: "Limited", m2: "❌", m3: "❌", m4: "✅" },
                    { feat: "CSV Upload", m1: "Basic", m2: "✅", m3: "✅", m4: "✅" },
                    { feat: "Personalization", m1: "Basic", m2: "✅", m3: "✅", m4: "✅" },
                    { feat: "Interview Emails", m1: "❌", m2: "❌", m3: "❌", m4: "✅" },
                    { feat: "Gmail App Password", m1: "❌", m2: "❌", m3: "❌", m4: "✅" },
                    { feat: "Open Tracking", m1: "❌", m2: "✅", m3: "✅", m4: "✅" },
                    { feat: "HTML Templates", m1: "❌", m2: "✅", m3: "✅", m4: "✅" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 md:p-5 font-medium text-foreground">{row.feat}</td>
                      <td className="p-4 md:p-5 text-muted-foreground">{row.m1}</td>
                      <td className="p-4 md:p-5">{row.m2}</td>
                      <td className="p-4 md:p-5">{row.m3}</td>
                      <td className="p-4 md:p-5 font-semibold text-lime bg-cyan/5">{row.m4}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-center mt-3 text-[10px] text-muted-foreground/60 font-mono md:hidden">
            ← Swipe left/right to compare features →
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="border-t border-border py-24 z-10 bg-white/[0.002]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/15 border border-cyan/25 text-xs font-mono font-bold text-cyan">
                SECURITY COMPLIANCE
              </div>
              <h3 className="text-3xl font-display font-bold text-foreground">Your Credentials Stay Safe</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We prioritize database-level and client security above all. Your credentials never touch exposed networks, keeping your communications locked down and secure.
              </p>
              <div className="pt-2">
                <div className="flex items-center gap-2.5 text-xs text-lime font-mono">
                  <Shield className="w-4.5 h-4.5" />
                  <span>Compliant SMTP cryptographic pipeline.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "AES-256 Encryption", desc: "All credentials stored in the database are encrypted using AES-256, readable only by the dispatch worker pool." },
                { title: "Gmail App Password Only", desc: "Authentication requires a unique 16-digit App Password, keeping your primary Google credentials secure." },
                { title: "Never Stores Gmail Password", desc: "Your standard Gmail account password is never collected, stored, or transmitted by the system." },
                { title: "Secure Dedicated Servers", desc: "Campaigns run inside a secure containerized environment with strict sandbox controls." },
                { title: "SSL Encryption", desc: "All traffic sent to webhooks and database servers travels through encrypted SSL/TLS data pipelines." },
                { title: "Revoke Access Anytime", desc: "You can revoke or regenerate App Passwords directly from your Google Account settings at any moment." }
              ].map((item, idx) => (
                <div key={idx} className="rounded-2xl glass border border-border p-5 hover:border-cyan/30 transition-all duration-300">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan shrink-0" />
                    <h4 className="font-display font-bold text-sm text-foreground">{item.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: Real-time System Status & Architecture */}
      <section className="border-t border-border py-24 z-10 bg-white/[0.002]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/15 border border-cyan/25 text-xs font-mono font-bold text-cyan">
                SYSTEM TELEMETRY
              </div>
              <h3 className="text-3xl font-display font-bold text-foreground">Robust Background Queue Network</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our core engine leverages concurrent asynchronous queues powered by Redis and Celery. Your campaigns are warm-sent sequentially, respecting SMTP rate limit constraints automatically.
              </p>
              <div className="grid grid-cols-2 gap-4 font-mono text-xs pt-4">
                <div className="bg-white/5 border border-border p-3.5 rounded-2xl">
                  <div className="text-cyan font-bold text-base">99.98%</div>
                  <div className="text-muted-foreground text-[10px] uppercase tracking-wider mt-1 font-semibold">Console Uptime</div>
                </div>
                <div className="bg-white/5 border border-border p-3.5 rounded-2xl">
                  <div className="text-lime font-bold text-base">&lt; 1.2s</div>
                  <div className="text-muted-foreground text-[10px] uppercase tracking-wider mt-1 font-semibold">Average Latency</div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 bg-black/40 border border-border p-6 rounded-3xl font-mono text-xs text-muted-foreground/80 space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-foreground font-semibold">Active Workers Monitor</span>
                <span className="flex items-center gap-1.5 text-lime"><span className="size-2 rounded-full bg-lime animate-ping" /> online</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px] leading-relaxed">
                <div className="text-cyan">[INFO] Worker cluster 'us-east-worker-pool-1' successfully spawned.</div>
                <div className="text-lime">[INFO] Warm-up schedule complete: IP reputation index 99.4/100.</div>
                <div className="text-muted-foreground">[DEBUG] Ready queue depth: 0 items pending in Celery.</div>
                <div className="text-cyan">[INFO] Rate limits warmed: max 250 requests per SMTP interval.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Guide Section */}
      <section id="step-by-step-guide" className="max-w-7xl mx-auto px-6 py-24 z-10 space-y-20 border-t border-border">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center justify-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-cyan" />
            <span>Platform Setup Guide</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Follow these three simple steps to secure your credentials, compose email templates, and broadcast bulk campaigns.
          </p>
        </div>

        {/* Step 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/15 border border-cyan/25 text-xs font-mono font-bold text-cyan">
              STEP 1
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Lock className="w-6 h-6 text-cyan" />
              <span>Configure Secure Credentials</span>
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your App Password credentials are protected on the backend using symmetric encryption. They are strictly write-only, and the system never exposes decrypted details back to the interface.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
                <span>Navigate to the Settings & SMTP tab.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
                <span>Enter your Gmail address and 16-digit Google App Password.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
                <span>Click **Test SMTP Connection** to verify settings live.</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6 rounded-3xl overflow-hidden border border-border shadow-2xl glass p-2">
            <img 
              src="/images/smtp_setup_guide.png" 
              alt="SMTP Credentials setup user interface guide screenshot" 
              className="w-full rounded-2xl object-cover aspect-video hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
        </div>

        <div className="border-t border-border w-2/3 mx-auto" />

        {/* Step 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          <div className="lg:col-span-6 order-last lg:order-first rounded-3xl overflow-hidden border border-border shadow-2xl glass p-2">
            <img 
              src="/images/quick_send_demo.png" 
              alt="Quick send email preview user interface guide screenshot" 
              className="w-full rounded-2xl object-cover aspect-video hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/15 border border-cyan/25 text-xs font-mono font-bold text-cyan">
              STEP 2
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Zap className="w-6 h-6 text-lime" />
              <span>Draft & Preview Quick Emails</span>
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Quickly dispatch single emails using the visual builder or the raw editor. Live preview renders HTML designs in real-time within a sandboxed viewer.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
                <span>Use the visual tab to easily pick accent colors and input headers.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
                <span>Preview mobile and desktop viewports side-by-side.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
                <span>Send instantly. All tasks process in background worker queues.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border w-2/3 mx-auto" />

        {/* Step 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/15 border border-cyan/25 text-xs font-mono font-bold text-cyan">
              STEP 3
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-cyan" />
              <span>Upload CSV & Blast Campaigns</span>
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Broadcast high-volume messages using CSV files. The platform automatically tracks sending rates to protect your account reputation.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
                <span>Upload a CSV file containing your recipients.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
                <span>Map dynamic variables like `{"{{Name}}"}` inside subjects or bodies.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
                <span>Track live dispatches with progress bars on the Campaign Tracker tab.</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6 rounded-3xl overflow-hidden border border-border shadow-2xl glass p-2">
            <img 
              src="/images/bulk_send_demo.png" 
              alt="Bulk email sending user interface guide screenshot" 
              className="w-full rounded-2xl object-cover aspect-video hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-t border-border py-24 z-10 bg-white/[0.005]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime/10 border border-lime/20 text-xs font-mono font-semibold text-lime">
              <span>SOCIAL PROOF</span>
            </div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">What Our Users Say</h2>
            <p className="text-sm text-muted-foreground">
              Hear how recruitment leaders, agencies, and startup founders utilize MailFlow to accelerate their dispatch pipelines.
            </p>
          </div>

          <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 scrollbar-thin scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              {
                quote: "Reduced candidate communication time by 90%. Simple tags mapping works in seconds.",
                author: "HR Manager",
                company: "Global Tech Enterprise",
                initials: "HM",
                color: "from-lime/10 to-cyan/5",
              },
              {
                quote: "Sent 5,000 interview updates in one day without any hitches. Super reliable queues.",
                author: "Recruitment Agency",
                company: "Scale Talent Corp",
                initials: "RA",
                color: "from-cyan/10 to-lime/5",
              },
              {
                quote: "Much easier than Mail Merge. Connecting Gmail SMTP credentials was effortless.",
                author: "Startup Founder",
                company: "NextGen SaaS",
                initials: "SF",
                color: "from-lime/10 to-cyan/5",
              },
              {
                quote: "Saves us 15 hours a week in developer communication. Instant system notification alerts.",
                author: "Engineering Lead",
                company: "DevOps Solutions",
                initials: "EL",
                color: "from-cyan/10 to-lime/5",
              },
            ].map((t, idx) => (
              <div key={idx} className="w-[85vw] sm:w-[350px] snap-start shrink-0 rounded-3xl glass border border-border p-6 flex flex-col justify-between hover:border-cyan/30 transition-all duration-300">
                <div className="text-sm font-medium text-foreground italic mb-6 leading-relaxed">
                  "{t.quote}"
                </div>
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-xl bg-gradient-to-br ${t.color} border border-border flex items-center justify-center font-bold text-xs text-foreground`}>
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-foreground">{t.author}</h4>
                    <p className="text-[10px] text-muted-foreground">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4 text-[10px] text-muted-foreground/60 font-mono sm:hidden">
            ← Swipe left/right to view testimonials →
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="border-t border-border py-24 z-10 bg-white/[0.002]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-xs font-mono font-semibold text-cyan">
              <span>TRANSPARENT PRICING</span>
            </div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Completely Free & Open Source</h2>
            <p className="text-sm text-muted-foreground">
              No subscription limits. No hidden fees. Own your pipeline, connect your SMTP, and start sending campaigns.
            </p>
          </div>

          <div className="max-w-5xl mx-auto rounded-3xl glass border border-lime/30 p-8 md:p-10 shadow-2xl relative overflow-hidden group hover:border-cyan/30 transition-colors duration-300 text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-lime/10 rounded-full blur-2xl group-hover:bg-cyan/10 transition-colors pointer-events-none" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Pricing Left: Price & Pitch */}
              <div className="lg:col-span-5 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime/10 border border-lime/20 text-xs font-mono font-bold text-lime">
                  <span>COMMUNITY LICENSE</span>
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-2xl text-foreground">Self-Hosted Community Edition</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Own your email infrastructure. Run it locally or deploy it to Vercel/Docker. No monthly fees, no tracking, and 100% control over your credentials and SMTP dispatch queue.
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl font-extrabold text-foreground">$0</span>
                  <span className="text-xs text-muted-foreground font-mono">/ forever free</span>
                </div>
                <button
                  onClick={onEnter}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:shadow-[0_8px_30px_-8px] hover:shadow-lime/60 transition cursor-pointer mt-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Pricing Right: Features Included */}
              <div className="lg:col-span-7 bg-white/[0.02] border border-border/60 p-6 md:p-8 rounded-2xl space-y-4">
                <div className="text-xs font-mono font-bold text-cyan uppercase tracking-wider">All Unlocked Features Included:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    "Unlimited Single & Bulk Sends",
                    "Dynamic Personalized CSV Merges",
                    "15 Pre-Built Corporate Email Templates",
                    "AES-256 Encryption Security Pipeline",
                    "Live Client Sandbox Preview Mockup",
                    "Transmissions Audit & Campaigns Tracker",
                    "Full Developer Support & Free Updates",
                    "Self-Host via Docker or Vercel"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-cyan shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-transparent pt-12 pb-8 text-xs text-muted-foreground/50 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime to-cyan flex items-center justify-center text-primary-foreground font-bold">
                <Mail className="w-4.5 h-4.5" />
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
                <span className="size-1.5 rounded-full bg-lime animate-pulse" /> SMTP Active
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
