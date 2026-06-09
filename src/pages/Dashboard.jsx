import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Send, Users, FileSpreadsheet, LineChart as LineChartIcon,
  ScrollText, LayoutGrid, Settings, Mail, ShieldCheck, LogOut, 
  Sun, Moon, Menu, X, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import * as api from '../utils/api';

import OverviewTab from './OverviewTab';
import QuickSend from '../components/QuickSend';
import BulkSend from '../components/BulkSend';
import PersonalizedCSV from '../components/PersonalizedCSV';
import CampaignsTab from './CampaignsTab';
import HistoryTab from './HistoryTab';
import TemplateGallery from '../components/TemplateGallery';
import SettingsTab from './SettingsTab';

const NAV = [
  { key: 'overview', label: 'Overview', icon: Activity, hint: 'Live ops' },
  { key: 'quick', label: 'Quick Send', icon: Send, hint: '1 ↦ 1' },
  { key: 'bulk', label: 'Bulk Send', icon: Users, hint: 'Fan‑out' },
  { key: 'personalized', label: 'Personalized CSV', icon: FileSpreadsheet, hint: 'Merge' },
  { key: 'campaigns', label: 'Campaign Tracker', icon: LineChartIcon, hint: 'Live' },
  { key: 'history', label: 'History Logs', icon: ScrollText, hint: 'Audit' },
  { key: 'templates', label: 'Template Gallery', icon: LayoutGrid, hint: '15' },
  { key: 'settings', label: 'Settings & SMTP', icon: Settings, hint: 'Domain' },
];

export default function Dashboard() {
  const { isDark, toggle } = useTheme();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check SMTP setup status on load and on tab switches
  useEffect(() => {
    const checkSMTP = async () => {
      try {
        const data = await api.fetchSMTP();
        if (data && data.gmail_address && data.has_password) {
          setSmtpConfigured(true);
        } else {
          setSmtpConfigured(false);
        }
      } catch (err) {
        setSmtpConfigured(false);
      }
    };
    checkSMTP();
  }, [activeTab]);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'quick':
        return <QuickSend onNavigateToTracker={() => setActiveTab('campaigns')} />;
      case 'bulk':
        return <BulkSend onNavigateToTracker={() => setActiveTab('campaigns')} />;
      case 'personalized':
        return <PersonalizedCSV onNavigateToTracker={() => setActiveTab('campaigns')} />;
      case 'campaigns':
        return <CampaignsTab />;
      case 'history':
        return <HistoryTab />;
      case 'templates':
        return <TemplateGallery onNavigateToQuick={() => setActiveTab('quick')} />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="flex min-h-screen text-foreground bg-background">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex ${isCollapsed ? 'w-20' : 'w-72'} shrink-0 flex-col border-r border-border bg-surface/40 backdrop-blur-xl sticky top-0 h-screen transition-all duration-300`}>
        <div className={`px-6 pt-7 pb-6 flex items-center justify-between ${isCollapsed ? 'flex-col gap-4' : 'gap-3'}`}>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="size-10 rounded-xl bg-gradient-to-br from-lime to-cyan grid place-items-center text-primary-foreground font-bold shadow-lg">
                <Mail className="size-5" />
              </div>
              <div className="absolute -bottom-1 -right-1 size-3 rounded-full bg-lime ring-2 ring-background animate-pulse" />
            </div>
            {!isCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="font-display font-bold text-lg leading-none">MailFlow</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">Ops Console</div>
              </motion.div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-border text-muted-foreground hover:text-foreground cursor-pointer transition hidden lg:block"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        <nav className="px-3 mt-2 flex-1 overflow-y-auto scrollbar-thin">
          {!isCollapsed && (
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground px-3 mb-2">Workspace</div>
          )}
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = activeTab === item.key;
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => {
                      setActiveTab(item.key);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`group relative w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-sm transition-all cursor-pointer
                      ${active ? 'bg-gradient-to-r from-lime/15 to-cyan/10 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-lime to-cyan"
                      />
                    )}
                    <Icon className={`size-4 ${active ? 'text-lime' : ''}`} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${active ? 'bg-cyan/15 text-cyan' : 'bg-white/5 text-muted-foreground'}`}>
                          {item.hint}
                        </span>
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer Info Card */}
        {!isCollapsed ? (
          <div className="m-3 p-4 rounded-2xl glass relative overflow-hidden">
            <div className="absolute -top-10 -right-10 size-32 bg-lime/20 blur-3xl rounded-full" />
            <div className="flex items-center gap-2 text-xs text-cyan">
              <ShieldCheck className="size-4" /> Deliverability
            </div>
            <div className="mt-2 font-display text-2xl font-bold">98.4%</div>
            <div className="text-xs text-muted-foreground mt-1">All domains aligned · DKIM ok</div>
            <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: '98%' }} transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-lime to-cyan"
              />
            </div>
          </div>
        ) : (
          <div className="m-3 p-2 rounded-xl bg-white/5 border border-border flex flex-col items-center gap-1.5" title="Deliverability: 98.4%">
            <ShieldCheck className="size-4 text-cyan" />
            <span className="text-[10px] font-bold text-lime">98%</span>
          </div>
        )}

        {/* Profile Card / Theme / Logout */}
        <div className={`border-t border-border p-4 flex ${isCollapsed ? 'flex-col items-center gap-3' : 'items-center justify-between gap-2'} transition-all`}>
          <button
            onClick={toggle}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-muted-foreground hover:text-foreground transition cursor-pointer"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="size-4.5 text-amber-400" /> : <Moon className="size-4.5 text-indigo-400" />}
          </button>
          <button
            onClick={logout}
            className={`p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-border text-rose-500 transition cursor-pointer flex items-center justify-center ${isCollapsed ? 'w-10 h-10' : 'gap-1.5 text-xs font-semibold'}`}
            title="Logout"
          >
            <LogOut className="size-4.5" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            />
            {/* Sidebar drawer content */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-72 max-w-xs bg-card border-r border-border h-full flex flex-col p-4 z-50"
            >
              <div className="flex items-center justify-between pb-6 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-gradient-to-br from-lime to-cyan grid place-items-center text-primary-foreground font-bold shadow-md">
                    <Mail className="size-4" />
                  </div>
                  <span className="font-display font-bold text-base leading-none">MailFlow</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="size-8 grid place-items-center rounded-xl bg-white/5 hover:bg-white/10"
                >
                  <X className="size-4" />
                </button>
              </div>

              <nav className="mt-4 flex-1 overflow-y-auto scrollbar-thin">
                <ul className="space-y-1">
                  {NAV.map((item) => {
                    const active = activeTab === item.key;
                    const Icon = item.icon;
                    return (
                      <li key={item.key}>
                        <button
                          onClick={() => {
                            setActiveTab(item.key);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer
                            ${active ? 'bg-gradient-to-r from-lime/15 to-cyan/10 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'}`}
                        >
                          <Icon className={`size-4 ${active ? 'text-lime' : ''}`} />
                          <span className="flex-1 text-left font-medium">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="border-t border-border pt-4 flex items-center justify-between">
                <button
                  onClick={toggle}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  {isDark ? <Sun className="size-4.5 text-amber-400" /> : <Moon className="size-4.5 text-indigo-400" />}
                </button>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-border text-rose-500 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                >
                  <LogOut className="size-4.5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Viewport */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 px-6 lg:px-10 py-4 flex items-center justify-between border-b border-border bg-background/60 backdrop-blur-xl">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border mr-2"
          >
            <Menu className="size-5" />
          </button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-lime animate-pulse" />
            <span className="hidden sm:inline">Live · us‑east‑1 · queue 0</span>
          </div>

          <div className="flex items-center gap-3 pl-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium leading-tight">{user?.full_name || 'Awais Amjad'}</div>
              <div className="text-[11px] text-muted-foreground">{user?.email || 'Workspace owner'}</div>
            </div>
            <div className="size-10 rounded-xl bg-gradient-to-br from-cyan to-lime grid place-items-center font-bold text-primary-foreground">
              {(user?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 px-6 lg:px-10 py-8 max-w-[1400px] w-full mx-auto">
          {/* SMTP Empty Warning Bar */}
          {!smtpConfigured && activeTab !== 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl bg-amber/15 border border-amber/35 text-amber p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="size-5 shrink-0" />
                <div>
                  <h4 className="font-display font-semibold">SMTP credentials not configured</h4>
                  <p className="text-xs text-muted-foreground/90 mt-0.5">Please add your Gmail SMTP details to start sending campaigns and using the app.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="px-3.5 py-1.5 rounded-xl bg-amber text-zinc-950 font-semibold text-xs cursor-pointer hover:opacity-90 transition shrink-0"
              >
                Configure SMTP
              </button>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderActiveComponent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
