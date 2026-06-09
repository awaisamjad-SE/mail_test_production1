import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Sun, Moon, Zap, Users, Sparkles, Layout, Mail, Settings, 
  History, FileText, LogOut 
} from 'lucide-react';

import OverviewTab from './OverviewTab';
import QuickSend from '../components/QuickSend';
import BulkSend from '../components/BulkSend';
import PersonalizedCSV from '../components/PersonalizedCSV';
import CampaignsTab from './CampaignsTab';
import HistoryTab from './HistoryTab';
import TemplateGallery from '../components/TemplateGallery';
import SettingsTab from './SettingsTab';

export default function Dashboard() {
  const { isDark, toggle } = useTheme();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'quick' | 'bulk' | 'personalized' | 'campaigns' | 'history' | 'templates' | 'settings'

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'quick', label: 'Quick Send', icon: Zap },
    { id: 'bulk', label: 'Bulk Send', icon: Users },
    { id: 'personalized', label: 'Personalized CSV', icon: Sparkles },
    { id: 'campaigns', label: 'Campaign Tracker', icon: Mail },
    { id: 'history', label: 'History Logs', icon: History },
    { id: 'templates', label: 'Template Gallery', icon: FileText },
    { id: 'settings', label: 'Settings & SMTP', icon: Settings },
  ];

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
    <div className="min-h-screen app-bg flex flex-col transition-colors duration-300">
      {/* Top Header Navigation */}
      <header className="border-b border-theme surface-1 sticky top-0 z-30 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">
              MailFlow
            </span>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden sm:inline-block text-xs font-semibold t3 bg-surface-2 border border-theme px-3 py-1.5 rounded-lg">
                Hello, <span className="t1 font-bold">{user.full_name || user.email}</span>
              </span>
            )}

            {/* Theme switcher */}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="p-2 rounded-lg surface-2 hover:bg-[var(--surface-3)] border border-theme transition-colors cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-indigo-600" />
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={logout}
              aria-label="Logout"
              className="p-2 rounded-lg border border-theme hover:bg-red-500/10 hover:text-red-500 text-red-500/80 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Header Tab Bar */}
      <div className="border-b border-theme surface-3 sticky top-16 z-20 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--accent-bg)] border border-[var(--accent-border)] accent-text'
                      : 't3 hover:t1 hover:bg-[var(--surface-2)] border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 animate-fade-in overflow-y-auto">
        {renderActiveComponent()}
      </main>
    </div>
  );
}
