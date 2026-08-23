import { useState } from 'react';
import { Layers, PlusCircle, Users, FileSpreadsheet, LayoutGrid, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Edit3 } from 'lucide-react';
import BulkSend from '../components/BulkSend';
import PersonalizedCSV from '../components/PersonalizedCSV';
import TemplateGallery from '../components/TemplateGallery';

export default function CampaignsHub({ onNavigateToTracker }) {
  const [activeSubTab, setActiveSubTab] = useState('create');
  
  // Wizard State
  const [wizardStep, setWizardStep] = useState(1); // Step 1: Name ➔ Step 2: Mode ➔ Step 3: Compose
  const [campaignName, setCampaignName] = useState('');
  const [campaignMode, setCampaignMode] = useState(null); // 'bulk' vs 'csv'

  const handleStartCampaign = (e) => {
    e.preventDefault();
    if (!campaignName.trim()) return;
    setWizardStep(2);
  };

  const handleSelectMode = (mode) => {
    setCampaignMode(mode);
    setWizardStep(3);
  };

  const handleResetWizard = () => {
    setWizardStep(1);
    setCampaignMode(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-2">04 · Campaigns Hub</div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
            Campaigns <span className="gradient-text">center</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Create a named marketing campaign, pick Bulk or CSV Merge mode, and launch sending tasks.
          </p>
        </div>

        {/* Sub-Tab Selector */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl glass border border-border">
          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'create' ? 'bg-cyan text-zinc-950 shadow-md font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <PlusCircle className="size-3.5" />
            <span>Create Campaign</span>
          </button>
          <button
            onClick={() => setActiveSubTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'templates' ? 'bg-cyan text-zinc-950 shadow-md font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="size-3.5" />
            <span>Template Gallery</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'create' && (
        <div className="space-y-6">
          {/* STEP 1: Enter Campaign Name */}
          {wizardStep === 1 && (
            <div className="max-w-2xl mx-auto rounded-3xl glass border border-border p-8 space-y-6 text-center">
              <div className="size-14 rounded-2xl bg-cyan/15 text-cyan mx-auto grid place-items-center font-bold">
                <Sparkles className="size-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-display font-bold">Start a New Campaign</h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Give your marketing campaign a descriptive name to track its replies, bounces, and delivery stats.
                </p>
              </div>

              <form onSubmit={handleStartCampaign} className="space-y-4 max-w-md mx-auto text-left">
                <label className="block space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Campaign Name <span className="text-rose">*</span>
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Q3 Enterprise Lead Outreach"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-border text-sm font-semibold focus:outline-none focus:border-cyan transition"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={!campaignName.trim()}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-lime to-cyan text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition cursor-pointer shadow-lg"
                >
                  <span>Continue to Select Mode</span>
                  <ArrowRight className="size-4" />
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Select Campaign Mode */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-cyan font-bold uppercase tracking-wider">Step 2 of 3</span>
                  <h2 className="text-xl font-display font-bold">Select Campaign Mode for "{campaignName}"</h2>
                </div>
                <button
                  onClick={() => setWizardStep(1)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-border text-xs font-mono hover:bg-white/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" /> Edit Name
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => handleSelectMode('bulk')}
                  className="p-6 rounded-3xl glass border border-border hover:border-cyan/50 hover:bg-cyan/5 text-left transition-all cursor-pointer space-y-4 group"
                >
                  <div className="size-12 rounded-2xl bg-cyan/15 text-cyan grid place-items-center font-bold group-hover:scale-110 transition-transform">
                    <Users className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">Bulk Email Campaign</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Dispatch a uniform email campaign to multiple recipients simultaneously.
                    </p>
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan flex items-center gap-1.5 pt-2">
                    <span>Configure Bulk Campaign</span>
                    <ArrowRight className="size-4" />
                  </div>
                </button>

                <button
                  onClick={() => handleSelectMode('csv')}
                  className="p-6 rounded-3xl glass border border-border hover:border-lime/50 hover:bg-lime/5 text-left transition-all cursor-pointer space-y-4 group"
                >
                  <div className="size-12 rounded-2xl bg-lime/15 text-lime grid place-items-center font-bold group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">Personalized CSV Campaign</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Upload a CSV file and inject dynamic variables like <code className="text-lime">{"{{Name}}"}</code> and <code className="text-lime">{"{{Company}}"}</code>.
                    </p>
                  </div>
                  <div className="text-xs font-mono font-bold text-lime flex items-center gap-1.5 pt-2">
                    <span>Configure CSV Merge</span>
                    <ArrowRight className="size-4" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Compose & Launch */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              {/* Active Campaign Header Bar */}
              <div className="p-4 rounded-2xl bg-cyan/10 border border-cyan/30 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-cyan text-zinc-950 font-bold grid place-items-center text-xs">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-mono text-cyan font-bold uppercase tracking-wider">Active Campaign</p>
                    <h3 className="font-display font-bold text-base text-foreground">
                      "{campaignName}" <span className="text-xs font-mono font-normal text-muted-foreground">({campaignMode === 'bulk' ? 'Bulk Mode' : 'Personalized CSV Mode'})</span>
                    </h3>
                  </div>
                </div>

                <button
                  onClick={handleResetWizard}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Edit3 className="size-3.5" />
                  <span>Start Different Campaign</span>
                </button>
              </div>

              {/* Compose Component */}
              {campaignMode === 'bulk' ? (
                <BulkSend onNavigateToTracker={onNavigateToTracker} initialCampaignName={campaignName} />
              ) : (
                <PersonalizedCSV onNavigateToTracker={onNavigateToTracker} initialCampaignName={campaignName} />
              )}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'templates' && (
        <TemplateGallery onNavigateToQuick={() => {
          setActiveSubTab('create');
          setWizardStep(1);
        }} />
      )}
    </div>
  );
}
