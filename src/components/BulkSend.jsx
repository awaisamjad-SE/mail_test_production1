import { useState } from 'react';
import { Send, Users, Loader2, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, Edit2, Check, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import CSVUploader from './CSVUploader';
import EmailPreview from './EmailPreview';
import StatusToast from './StatusToast';
import BodyEditor from './BodyEditor';
import { sendEmails } from '../utils/api';
import { buildEmailPayload } from '../utils/templateEngine';
import { emailTemplates, buildCorporateHTML } from '../data/templates';
import imgBulk from '../assets/snippet-bulk.jpg';

export default function BulkSend({ onNavigateToTracker }) {
  const [csvData, setCsvData] = useState(null);
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [cc, setCc] = useState('');
  const [sending, setSending] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const [toast, setToast] = useState(null);

  // Editing Row States
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');

  const handleEditRow = (index) => {
    setEditingRowIndex(index);
    setEditEmail(csvData.rows[index].email);
    setEditName(csvData.rows[index].name || '');
  };

  const handleSaveRow = (index) => {
    const updatedRows = [...csvData.rows];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(editEmail);

    updatedRows[index] = {
      ...updatedRows[index],
      email: editEmail,
      name: editName,
      valid: isValidEmail
    };

    const validRows = updatedRows.filter(r => r.valid);
    const validCount = validRows.length;
    const invalidCount = updatedRows.length - validCount;

    setCsvData({
      ...csvData,
      rows: updatedRows,
      validRows: validRows,
      validCount,
      invalidCount
    });

    setEditingRowIndex(null);
  };

  const handleApplyTemplate = (e) => {
    const templateId = e.target.value;
    const template = emailTemplates.find(t => t.id === templateId);
    if (!template) return;

    setSubject(template.subject);

    const compiled = buildCorporateHTML({
      name: template.name,
      headline: template.defaultHeadline || '',
      bodyText: template.defaultBody || '',
      headerBg: template.defaultHeaderColor || '#2563eb',
      outerBg: template.defaultBgColor || '#f4f6f9',
      showButton: template.hasButton !== false,
      buttonText: template.defaultButtonText || 'View Details',
      buttonUrl: template.defaultButtonUrl || 'https://example.com',
      layoutType: template.layoutType
    });
    setBody(compiled);
  };

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

    let payload;
    if (file) {
      payload = new FormData();
      payload.append('name', `Bulk Campaign (${csvData.validCount} contacts)`);
      payload.append('campaign_type', 'BULK_SEND');
      payload.append('subject', subject);
      payload.append('body', body);
      if (cc) payload.append('cc', cc);
      payload.append('recipients', JSON.stringify(recipients));
      payload.append('attachment', file);
    } else {
      payload = {
        name: `Bulk Campaign (${csvData.validCount} contacts)`,
        campaign_type: 'BULK_SEND',
        subject: subject,
        body: body,
        ...(cc && { cc }),
        recipients
      };
    }

    try {
      await sendEmails(payload);
      setToast({ 
        type: 'success', 
        message: 'Campaign launched successfully!', 
        details: `Processing ${csvData.validCount} emails in background queue.` 
      });
      setSubject('');
      setBody('');
      setCsvData(null);
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
    : { to: 'recipient@example.com', subject: subject || 'Demo Subject', body: body || 'Demo email body content' };

  const canSend = csvData && csvData.validCount > 0 && subject && body && !sending;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-2">03 · Fan‑out</div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
            Bulk <span className="gradient-text">send</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Dispatch the same message to thousands. Smart throttle, per‑domain pacing and automatic worker distribution.
          </p>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-48 lg:h-56 rounded-3xl overflow-hidden border border-border group">
        <img src={imgBulk} alt="Bulk send infrastructure" loading="lazy" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative h-full p-6 lg:p-8 flex items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-cyan px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20">
              <span className="size-1.5 rounded-full bg-cyan animate-pulse" /> Fan‑out
            </div>
            <h2 className="mt-3 font-display text-xl lg:text-2xl font-semibold max-w-md">Smart throttling across pools — millions reached, reputation intact.</h2>
          </div>
          <div className="hidden md:grid grid-cols-3 gap-6 pr-2">
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">{csvData?.validCount || 0}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Recipients</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">Celery</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Throttle</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">Direct</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Domain Pools</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form area */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Upload */}
          <div className="rounded-3xl glass border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="size-6 rounded-lg bg-cyan/10 border border-cyan/35 text-cyan text-xs font-bold font-mono grid place-items-center">1</span>
              <h3 className="text-base font-display font-semibold">Upload CSV Recipients</h3>
            </div>
            
            <CSVUploader 
              onDataParsed={(data) => {
                setCsvData(data);
                if (data) {
                  setShowTable(true);
                  setPreviewIndex(0);
                }
              }} 
              requiredColumns="bulk" 
            />

            {csvData && (
              <div className="p-4 rounded-2xl bg-white/[0.01] border border-border animate-fade-in space-y-4">
                {/* Warning Alert Banner */}
                {csvData.invalidCount === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-lime bg-lime/10 border border-lime/20 p-3.5 rounded-xl">
                    <CheckCircle2 className="size-4 shrink-0 text-lime" />
                    <span>All emails are valid!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-rose bg-rose/10 border border-rose/20 p-3.5 rounded-xl">
                    <AlertCircle className="size-4 shrink-0 text-rose" />
                    <span>Warning: {csvData.validCount} email{csvData.validCount !== 1 ? 's' : ''} are valid and {csvData.invalidCount} not valid.</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-lime font-bold">{csvData.validCount} valid</span>
                    </div>
                    {csvData.invalidCount > 0 && (
                      <div>
                        <span className="text-rose font-bold">{csvData.invalidCount} not valid</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowTable(!showTable)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs flex items-center gap-1 cursor-pointer transition border border-border"
                  >
                    <span>{showTable ? 'Hide list' : 'Show list & edit'}</span>
                    {showTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showTable && (
                  <div className="max-h-64 overflow-auto rounded-xl border border-border bg-black/15 scrollbar-thin">
                    <table className="w-full text-xs text-left border-collapse font-mono">
                      <thead className="text-muted-foreground border-b border-border bg-white/[0.02]">
                        <tr>
                          <th className="py-2.5 px-3">Index</th>
                          {csvData.hasName && <th className="py-2.5 px-3">Name</th>}
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.rows.map((row, i) => {
                          const isEditing = editingRowIndex === i;
                          return (
                            <tr key={i} className={`border-b border-border last:border-none hover:bg-white/[0.01] ${!row.valid ? 'bg-rose-500/5' : ''}`}>
                              <td className="py-2 px-3 text-muted-foreground">{row.index}</td>
                              
                              {csvData.hasName && (
                                <td className="py-2 px-3">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      className="px-2 py-1 bg-white/5 border border-border rounded text-xs text-foreground outline-none focus:border-cyan/50 max-w-[120px]"
                                    />
                                  ) : (
                                    <span className="text-foreground font-semibold">{row.name}</span>
                                  )}
                                </td>
                              )}

                              <td className="py-2 px-3">
                                {isEditing ? (
                                  <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="px-2 py-1 bg-white/5 border border-border rounded text-xs text-foreground outline-none focus:border-cyan/50 max-w-[200px]"
                                  />
                                ) : (
                                  <span className="text-muted-foreground">{row.email}</span>
                                )}
                              </td>

                              <td className="py-2 px-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                  row.valid ? 'bg-lime/15 text-lime' : 'bg-rose/15 text-rose'
                                }`}>
                                  {row.valid ? 'Valid' : 'Invalid'}
                                </span>
                              </td>

                              <td className="py-2 px-3 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleSaveRow(i)}
                                      className="p-1 rounded bg-lime/10 border border-lime/20 text-lime hover:bg-lime/20 transition cursor-pointer"
                                      title="Save Change"
                                    >
                                      <Check className="size-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingRowIndex(null)}
                                      className="p-1 rounded bg-rose/10 border border-rose/20 text-rose hover:bg-rose/20 transition cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X className="size-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleEditRow(i)}
                                    className="p-1 rounded bg-white/5 border border-border text-muted-foreground hover:text-foreground hover:bg-white/10 transition cursor-pointer"
                                    title="Edit Row"
                                  >
                                    <Edit2 className="size-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Compose */}
          <div className="rounded-3xl glass border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="size-6 rounded-lg bg-cyan/10 border border-cyan/35 text-cyan text-xs font-bold font-mono grid place-items-center">2</span>
              <h3 className="text-base font-display font-semibold">Draft Template Message</h3>
            </div>

            <div className="space-y-4">
              {/* Load pre-designed templates shortcut */}
              <label className="block space-y-2">
                <span className="text-sm font-medium flex items-center justify-between">
                  <span>Import Layout Template</span>
                  <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </span>
                <select
                  onChange={handleApplyTemplate}
                  className="input py-2.5 text-sm bg-surface text-foreground border border-border rounded-xl cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>-- Select a pre-designed corporate template --</option>
                  {emailTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </label>

              <div className="block space-y-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    Subject <span className="text-rose">*</span>
                  </span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Briefing — supports {{Name}}"
                    className="input"
                    required
                  />
                </label>
              </div>

              {/* CC Field */}
              <label className="block space-y-2">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  CC <span className="text-[11px] text-muted-foreground font-normal">(optional — comma-separated, e.g. ceo@company.com, manager@company.com)</span>
                </span>
                <input
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="ceo@fastnexa.com, bilal@fastnexa.com"
                  className="input"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium flex items-center justify-between">
                  <span>File Attachment <span className="text-[11px] text-muted-foreground font-normal">(optional, e.g. PDF resume)</span></span>
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

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Message Body <span className="text-rose">*</span></label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSubject(prev => prev + '{{Name}}')}
                      className="px-2 py-0.5 rounded bg-cyan/10 hover:bg-cyan/15 text-[10px] text-cyan border border-cyan/20 cursor-pointer font-mono font-semibold"
                    >
                      Subject {"{{Name}}"}
                    </button>
                    <button
                      onClick={() => setBody(prev => prev + '{{Name}}')}
                      className="px-2 py-0.5 rounded bg-cyan/10 hover:bg-cyan/15 text-[10px] text-cyan border border-cyan/20 cursor-pointer font-mono font-semibold"
                    >
                      Body {"{{Name}}"}
                    </button>
                  </div>
                </div>
                
                <BodyEditor value={body} onChange={setBody} />
              </div>
            </div>
          </div>

          {/* Action trigger */}
          <div className="rounded-3xl glass border border-border p-6">
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:shadow-[0_8px_30px_-8px] hover:shadow-lime/60 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              <span>
                {sending
                  ? 'Launching campaign...'
                  : `Launch campaign to ${csvData?.validCount || 0} Contacts`
                }
              </span>
            </button>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm">Preview Output</h3>
            {csvData && csvData.validCount > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                  disabled={previewIndex === 0}
                  className="p-1 rounded bg-white/5 border border-border text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40"
                  aria-label="Previous recipient preview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-muted-foreground font-mono">
                  {previewIndex + 1} of {csvData.validCount}
                </span>
                <button
                  onClick={() => setPreviewIndex(Math.min(csvData.validCount - 1, previewIndex + 1))}
                  disabled={previewIndex >= csvData.validCount - 1}
                  className="p-1 rounded bg-white/5 border border-border text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40"
                  aria-label="Next recipient preview"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <EmailPreview
            to={previewEmail.to}
            subject={previewEmail.subject}
            body={previewEmail.body}
          />
        </div>
      </div>

      {toast && <StatusToast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
