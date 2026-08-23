import { useState, useEffect } from 'react';
import { Send, Loader2, ArrowLeft, ArrowRight, Check, Code, Sparkles } from 'lucide-react';
import CSVUploader from './CSVUploader';
import EmailPreview from './EmailPreview';
import StatusToast from './StatusToast';
import BodyEditor from './BodyEditor';
import { sendEmails } from '../utils/api';
import { buildEmailPayload } from '../utils/templateEngine';
import { emailTemplates, buildCorporateHTML } from '../data/templates';
import imgTemplates from '../assets/snippet-templates.jpg';

export default function TemplateGallery({ onNavigateToTracker }) {
  const [selected, setSelected] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [sending, setSending] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [toast, setToast] = useState(null);

  // Customizer States
  const [headerColor, setHeaderColor] = useState('#2563eb');
  const [bgColor, setBgColor] = useState('#f4f6f9');
  const [headline, setHeadline] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [showButton, setShowButton] = useState(true);
  const [buttonText, setButtonText] = useState('View Details');
  const [buttonUrl, setButtonUrl] = useState('https://example.com');
  const [activeSubTab, setActiveSubTab] = useState('designer'); // 'designer' | 'code'

  const handleSelectTemplate = (template) => {
    setSelected(template);
    setSubject(template.subject);
    
    // Initialize customizer fields
    const defaultHead = template.defaultHeadline || '';
    const defaultB = template.defaultBody || '';
    const defaultColor = template.defaultHeaderColor || '#2563eb';
    const defaultBg = template.defaultBgColor || '#f4f6f9';
    const hasBtn = template.hasButton !== false;
    const btnTxt = template.defaultButtonText || 'View Details';
    const btnUrl = template.defaultButtonUrl || 'https://example.com';

    setHeadline(defaultHead);
    setBodyText(defaultB);
    setHeaderColor(defaultColor);
    setBgColor(defaultBg);
    setShowButton(hasBtn);
    setButtonText(btnTxt);
    setButtonUrl(btnUrl);
    setActiveSubTab('designer');

    const compiledHTML = buildCorporateHTML({
      name: template.name,
      headline: defaultHead,
      bodyText: defaultB,
      headerBg: defaultColor,
      outerBg: defaultBg,
      showButton: hasBtn,
      buttonText: btnTxt,
      buttonUrl: btnUrl,
      layoutType: template.layoutType
    });
    setBody(compiledHTML);
  };

  const handleBack = () => {
    setSelected(null);
    setCsvData(null);
    setFile(null);
    setSubject('');
    setBody('');
    setReplyTo('');
  };

  // Compile layout on designer state changes
  useEffect(() => {
    if (!selected) return;
    const compiledHTML = buildCorporateHTML({
      name: selected.name,
      headline: headline,
      bodyText: bodyText,
      headerBg: headerColor,
      outerBg: bgColor,
      showButton: showButton,
      buttonText: buttonText,
      buttonUrl: buttonUrl,
      layoutType: selected.layoutType
    });
    setBody(compiledHTML);
  }, [selected, headline, bodyText, headerColor, bgColor, showButton, buttonText, buttonUrl]);

  const handleSend = async () => {
    if (!csvData || !subject || !body) return;
    setSending(true);

    const recipients = csvData.validRows.map(row => ({
      email: row.email,
      name: row.name || '',
      variables: {
        Name: row.name || '',
        ...row.raw
      }
    }));

    const payload = {
      name: `Template Campaign: ${selected.name}`,
      campaign_type: 'BULK_SEND',
      subject: subject,
      body: body,
      recipients
    };


    try {
      await sendEmails(payload);
      setToast({ 
        type: 'success', 
        message: 'Campaign launched with template!', 
        details: `Processing ${csvData.validCount} emails in background queue.` 
      });
      handleBack();
      setFile(null);

      if (onNavigateToTracker) {
        setTimeout(() => {
          onNavigateToTracker();
        }, 1500);
      }
    } catch (err) {
      setToast({ 
        type: 'error', 
        message: 'Failed to launch campaign', 
        details: err.response?.data?.error || err.response?.data?.detail || err.message 
      });
    } finally {
      setSending(false);
    }
  };

  const previewEmail = csvData?.validRows?.[previewIndex]
    ? buildEmailPayload(csvData.validRows[previewIndex], subject, body, replyTo)
    : { to: 'recipient@email.com', subject: subject || 'Template Subject', body: body || 'Template body content' };

  const canSend = csvData && csvData.validCount > 0 && subject && body && !sending;

  // Design Colors Preset Options
  const ACCENT_COLORS = [
    { name: 'Royal Blue', value: '#2563eb' },
    { name: 'Emerald', value: '#16a34a' },
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Sky Blue', value: '#0284c7' },
    { name: 'Carbon Dark', value: '#1e293b' },
    { name: 'Crimson Red', value: '#dc2626' }
  ];

  const BACKGROUNDS = [
    { name: 'Cool Gray', value: '#f4f6f9' },
    { name: 'White', value: '#ffffff' },
    { name: 'Dark Slate', value: '#0f172a' }
  ];

  if (!selected) {
    return (
      <div className="space-y-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-2">07 · Library</div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
              Template <span className="gradient-text">gallery</span>
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              15 professional, corporate‑ready responsive templates with full customizer configurations.
            </p>
          </div>
        </div>

        <div className="relative h-48 lg:h-56 rounded-3xl overflow-hidden border border-border group">
          <img src={imgTemplates} alt="Email templates library" loading="lazy" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="relative h-full p-6 lg:p-8 flex items-center">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-cyan px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20">
                <span className="size-1.5 rounded-full bg-cyan animate-pulse" /> Corporate Library
              </div>
              <h2 className="mt-3 font-display text-xl lg:text-2xl font-semibold max-w-md">Pick a layout, customize variables in real time, and dispatch.</h2>
            </div>
            <div className="hidden md:grid grid-cols-3 gap-6 pr-2">
              <div className="text-right">
                <div className="font-display text-2xl font-bold gradient-text">{emailTemplates.length}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Layouts</div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-bold gradient-text">Custom</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Accent Colors</div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-bold gradient-text">HTML</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Responsive</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {emailTemplates.map((template, i) => {
            const colors = ["from-lime to-cyan", "from-cyan to-amber", "from-rose to-amber", "from-lime to-amber", "from-cyan to-lime", "from-amber to-rose"];
            const color = colors[i % colors.length];

            return (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="group rounded-3xl overflow-hidden glass border border-border cursor-pointer hover:border-cyan/35 transition duration-300 flex flex-col justify-between h-full"
              >
                <div>
                  <div className={`h-40 bg-gradient-to-br ${color} relative overflow-hidden flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_50%)]" />
                    <span className="text-5xl drop-shadow-lg select-none">{template.icon}</span>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="font-display font-semibold text-base text-foreground group-hover:text-cyan transition-colors">{template.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{template.description}</p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-white/[0.02] mt-auto">
                  <span className="text-[11px] text-muted-foreground/60 font-mono">Customizable Layout</span>
                  <button className="size-9 rounded-xl bg-white/5 grid place-items-center group-hover:bg-gradient-to-r group-hover:from-lime group-hover:to-cyan group-hover:text-primary-foreground transition cursor-pointer border border-border">
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={handleBack}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs flex items-center gap-1.5 cursor-pointer transition border border-border"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-3xl">{selected.icon}</span>
          <div>
            <h3 className="font-display font-semibold text-base leading-none">{selected.name}</h3>
            <span className="text-[10px] tracking-wider font-mono font-bold bg-cyan/15 text-cyan px-1.5 py-0.5 rounded-md mt-1.5 inline-block">
              {selected.category} · Interactive Designer
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl glass border border-border p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">1. Customize Content</h3>
              <div className="flex bg-white/5 p-0.5 rounded-lg border border-border">
                <button
                  onClick={() => setActiveSubTab('designer')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer ${activeSubTab === 'designer' ? 'bg-gradient-to-r from-lime/15 to-cyan/10 border border-cyan/25 text-cyan' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Sparkles className="size-3.5" />
                  <span>Interactive Designer</span>
                </button>
                <button
                  onClick={() => setActiveSubTab('code')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer ${activeSubTab === 'code' ? 'bg-gradient-to-r from-lime/15 to-cyan/10 border border-cyan/25 text-cyan' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Code className="size-3.5" />
                  <span>HTML Code Editor</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium flex items-center gap-1.5">Subject Line</span>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input" required />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium flex items-center gap-1.5">Reply-To <span className="text-[11px] text-muted-foreground font-normal">(optional)</span></span>
                <input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="reply@example.com" className="input" />
              </label>
            </div>

            {activeSubTab === 'designer' ? (
              <div className="space-y-5 pt-2 animate-fade-in">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Header Theme Color</span>
                  <div className="flex flex-wrap gap-2.5">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setHeaderColor(color.value)}
                        style={{ backgroundColor: color.value }}
                        className="size-7 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 border border-white/25 ring-2 ring-transparent active:scale-95"
                        title={color.name}
                      >
                        {headerColor === color.value && <Check className="size-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Email Background Style</span>
                  <div className="flex gap-3">
                    {BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.value}
                        onClick={() => setBgColor(bg.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${bgColor === bg.value ? 'bg-white/10 text-foreground border-cyan/45 shadow' : 'bg-transparent text-muted-foreground border-border hover:bg-white/5 hover:text-foreground'}`}
                      >
                        {bg.name}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Greeting Headline</span>
                  <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Enter welcome headline..." className="input" />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium flex justify-between items-center">
                    <span>Email Content Paragraphs</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Use double breaks for new paragraphs</span>
                  </span>
                  <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={6} placeholder="Type your message content paragraphs here..." className="input font-sans text-sm resize-y min-h-[120px]" />
                </label>

                <div className="p-4 rounded-2xl bg-white/[0.01] border border-border space-y-4">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={showButton} onChange={(e) => setShowButton(e.target.checked)} className="size-4 accent-cyan cursor-pointer rounded" />
                    <span className="text-sm font-medium text-foreground">Include Call-To-Action Button (CTA)</span>
                  </label>

                  {showButton && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                      <label className="block space-y-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Button Text</span>
                        <input type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="e.g. Schedule Interview" className="input" />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Button Link URL</span>
                        <input type="text" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="e.g. https://company.com/page" className="input font-mono" />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Modify raw compiled template code directly:</span>
                  <span className="text-rose font-medium text-[10px]">* Modifying here overrides designer controls</span>
                </div>
                <BodyEditor value={body} onChange={setBody} />
              </div>
            )}
          </div>

          <div className="rounded-3xl glass border border-border p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">2. Add Recipients</h3>
            <CSVUploader onDataParsed={setCsvData} requiredColumns="bulk" />
            {csvData && (
              <div className="p-3 rounded-2xl bg-white/[0.01] border border-border animate-fade-in flex items-center justify-between">
                <div>
                  <span className="text-lime font-display font-bold text-base">{csvData.validCount}</span>
                  <span className="text-muted-foreground text-xs font-semibold ml-1.5">contacts loaded</span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl glass border border-border p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">3. File Attachment</h3>
            <label className="block space-y-2">
              <span className="text-sm font-medium flex items-center justify-between">
                <span>Upload File <span className="text-[11px] text-muted-foreground font-normal">(optional, e.g. PDF resume)</span></span>
                {file && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-[10px] text-rose-500 font-bold uppercase tracking-wider hover:underline cursor-pointer"
                  >
                    Remove File
                  </button>
                )}
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                  className="input text-xs file:hidden cursor-pointer"
                />
              </div>
              {file && (
                <p className="text-[11px] text-lime font-mono">
                  Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              )}
            </label>
          </div>

          <div className="rounded-3xl glass border border-border p-6">
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:shadow-[0_8px_30px_-8px] hover:shadow-lime/60 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              <span>{sending ? 'Queueing custom emails...' : `Launch template to ${csvData?.validCount || 0} Contacts`}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm">Template Output Preview</h3>
            {csvData && csvData.validCount > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))} disabled={previewIndex === 0} className="p-1 rounded bg-white/5 border border-border text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-muted-foreground font-mono">{previewIndex + 1} of {csvData.validCount}</span>
                <button onClick={() => setPreviewIndex(Math.min(csvData.validCount - 1, previewIndex + 1))} disabled={previewIndex >= csvData.validCount - 1} className="p-1 rounded bg-white/5 border border-border text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <EmailPreview to={previewEmail.to} subject={previewEmail.subject} body={previewEmail.body} />
        </div>
      </div>
      {toast && <StatusToast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
