import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, Sun, Moon, Zap, Users, Sparkles, Layout, ArrowRight, Play, 
  CheckCircle2, Shield, Lock, Eye, ListFilter, ClipboardCheck
} from 'lucide-react';

export default function Home({ onEnter }) {
  const { isDark, toggle } = useTheme();
  const { isLoggedIn } = useAuth();

  const features = [
    {
      icon: Zap,
      title: 'Quick Single Dispatch',
      desc: 'Compose and dispatch individual emails instantly. Perfect for direct client notices, custom messages, and quick notifications with live sandbox rendering.',
      color: 'from-violet-600 to-indigo-600',
    },
    {
      icon: Users,
      title: 'High-Volume Bulk Campaigns',
      desc: 'Upload standard CSV lists of contacts to launch bulk campaigns. The background dispatcher processes them concurrently without affecting website usability.',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      icon: Sparkles,
      title: 'Dynamic Personalized Emails',
      desc: 'Inject variables (like {{Name}}) to personalize subject lines and email bodies dynamically for each recipient based on CSV columns.',
      color: 'from-emerald-600 to-teal-600',
    },
    {
      icon: Layout,
      title: 'Rich Pre-Built Templates',
      desc: 'Select from pre-configured visual layouts (Newsletter, Welcomes, Job Updates, Alerts) and instantly tweak colors, content, and CTA links.',
      color: 'from-purple-600 to-pink-600',
    },
    {
      icon: Eye,
      title: 'Sandboxed Client Previews',
      desc: 'Inspect rendering inside an isolated secure iframe mock. Simulates desktop and mobile email viewports before you click send.',
      color: 'from-rose-600 to-orange-600',
    },
    {
      icon: ListFilter,
      title: 'Transmission Audit & Logs',
      desc: 'Track every sent log, search recipients, inspect processing queues, check delivery statuses (SENT, FAILED), and view recent activity feeds.',
      color: 'from-amber-600 to-yellow-600',
    },
  ];

  const scrollToSetup = () => {
    const el = document.getElementById('step-by-step-guide');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen app-bg flex flex-col justify-between overflow-x-hidden relative">
      
      {/* Background Accent Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--accent-bg)] opacity-35 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 opacity-25 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-theme surface-1/80 backdrop-blur-md sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <Mail className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">
                MailFlow
              </span>
              <span className="text-[10px] ml-1.5 px-2.5 py-0.5 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-500 font-extrabold uppercase tracking-wider">
                Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl surface-2 hover:bg-[var(--surface-3)] border border-theme transition-all duration-350 cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
              )}
            </button>

            <button
              onClick={onEnter}
              className="btn-primary"
            >
              <span>{isLoggedIn ? 'Dashboard' : 'Sign In / Register'}</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center z-10 flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-2 border border-theme text-xs font-semibold t2 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Professional Bulk Email Infrastructure</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight t1 max-w-4xl mx-auto leading-tight md:leading-none">
          Send Professional Emails{' '}
          <span className="bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 bg-clip-text text-transparent animate-gradient">
            Instantly & Securely
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl t2 max-w-2xl mx-auto leading-relaxed">
          Manage, verify, and broadcast premium email campaigns. Draft custom messages, upload contact lists, inspect outputs live, and track delivery progress in real time.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onEnter}
            className="btn-primary px-8 py-3.5 text-base shadow-xl hover:scale-[1.02] transition-transform"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isLoggedIn ? 'Go to Dashboard' : 'Get Started Now'}</span>
          </button>
          <button
            onClick={scrollToSetup}
            className="btn-ghost px-8 py-3.5 text-base"
          >
            <span>Read Step-by-Step Guide</span>
          </button>
        </div>

        {/* Stats bar */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-y border-theme py-8">
          <div>
            <h4 className="text-3xl font-black t1 bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">Direct SMTP</h4>
            <p className="text-[10px] font-black t3 uppercase tracking-wider mt-1">Gmail Authentication</p>
          </div>
          <div>
            <h4 className="text-3xl font-black t1 bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">Secure AES</h4>
            <p className="text-[10px] font-black t3 uppercase tracking-wider mt-1">Credentials Encryption</p>
          </div>
          <div>
            <h4 className="text-3xl font-black t1 bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">Live Client</h4>
            <p className="text-[10px] font-black t3 uppercase tracking-wider mt-1">HTML Sandbox Previews</p>
          </div>
          <div>
            <h4 className="text-3xl font-black t1 bg-gradient-to-r from-emerald-500 to-violet-500 bg-clip-text text-transparent">Limit Guard</h4>
            <p className="text-[10px] font-black t3 uppercase tracking-wider mt-1">Rate Suspension Guard</p>
          </div>
        </div>
      </section>

      {/* Available Features Section */}
      <section className="surface-1 border-y border-theme py-24 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight t1">Advanced Sending Capabilities</h2>
            <p className="text-sm t2">
              Discover powerful tools designed to manage bulk marketing and transactional communications with maximum delivery rates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="card hover:border-violet-500/30 transition-all duration-300 shadow-md flex flex-col p-6 rounded-2xl group border border-theme bg-[var(--surface-1)]"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-110 transition-transform duration-300 mb-4`}>
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col">
                    <h3 className="font-bold text-base t1">{feat.title}</h3>
                    <p className="text-xs t2 leading-relaxed flex-1">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* User Guide Section */}
      <section id="step-by-step-guide" className="max-w-7xl mx-auto px-6 py-24 z-10 space-y-20">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight t1 flex items-center justify-center gap-2">
            <ClipboardCheck className="w-8 h-8 text-violet-500" />
            <span>Platform User Guide</span>
          </h2>
          <p className="text-sm t2">
            Follow these three simple steps to secure your credentials, compose email templates, and broadcast bulk campaigns.
          </p>
        </div>

        {/* Step 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-xs font-bold text-violet-500">
              STEP 1
            </div>
            <h3 className="text-2xl font-bold t1 flex items-center gap-2">
              <Lock className="w-6 h-6 text-violet-500" />
              <span>Configure Secure Credentials</span>
            </h3>
            <p className="t2 text-sm leading-relaxed">
              Your App Password credentials are protected on the backend using symmetric encryption. They are strictly write-only, and the system never exposes decrypted details back to the interface.
            </p>
            <ul className="space-y-2 text-xs t3">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Go to Settings & SMTP tab in the dashboard.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Enter your Gmail address and 16-digit Google App Password.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Click <strong>Test SMTP Connection</strong> to verify settings live.</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-theme shadow-xl bg-[var(--surface-1)]">
            <img 
              src="/images/smtp_setup_guide.png" 
              alt="SMTP Credentials setup user interface guide screenshot" 
              className="w-full object-cover aspect-video hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        </div>

        <div className="border-t border-theme w-2/3 mx-auto" />

        {/* Step 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          <div className="lg:col-span-6 order-last lg:order-first rounded-2xl overflow-hidden border border-theme shadow-xl bg-[var(--surface-1)]">
            <img 
              src="/images/quick_send_demo.png" 
              alt="Quick send email preview user interface guide screenshot" 
              className="w-full object-cover aspect-video hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-xs font-bold text-violet-500">
              STEP 2
            </div>
            <h3 className="text-2xl font-bold t1 flex items-center gap-2">
              <Zap className="w-6 h-6 text-violet-500" />
              <span>Draft & Preview Quick Emails</span>
            </h3>
            <p className="t2 text-sm leading-relaxed">
              Quickly dispatch single emails using the visual builder or the raw editor. Live preview renders HTML designs in real-time within a sandboxed viewer.
            </p>
            <ul className="space-y-2 text-xs t3">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Use the visual tab to easily pick accent colors, input CTA links, and headers.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Preview mobile and desktop viewports side-by-side.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Send instantly. All tasks process in background worker queues.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-theme w-2/3 mx-auto" />

        {/* Step 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-xs font-bold text-violet-500">
              STEP 3
            </div>
            <h3 className="text-2xl font-bold t1 flex items-center gap-2">
              <Users className="w-6 h-6 text-violet-500" />
              <span>Upload CSV & Blast Campaigns</span>
            </h3>
            <p className="t2 text-sm leading-relaxed">
              Broadcast high-volume messages using CSV files. The platform automatically tracks sending rates to protect your account and enqueues tasks.
            </p>
            <ul className="space-y-2 text-xs t3">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Upload a CSV file containing your recipients.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Map dynamic variables like <code>{"{{Name}}"}</code> inside subjects or bodies.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Track live dispatches with progress bars on the Campaign Tracker tab.</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-theme shadow-xl bg-[var(--surface-1)]">
            <img 
              src="/images/bulk_send_demo.png" 
              alt="Bulk email sending user interface guide screenshot" 
              className="w-full object-cover aspect-video hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-theme surface-1 py-8 text-center text-xs t3 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 MailFlow Email Automation. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 text-[var(--success-text)] font-semibold text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Direct SMTP Active
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
