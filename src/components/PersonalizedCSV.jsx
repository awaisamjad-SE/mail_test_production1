import { Send, Target, Loader2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Edit2, Check, X, Clock } from 'lucide-react';
import CSVUploader from './CSVUploader';
import EmailPreview from './EmailPreview';
import StatusToast from './StatusToast';
import { sendEmails } from '../utils/api';
import imgCsv from '../assets/snippet-csv.jpg';

export default function PersonalizedCSV({ onNavigateToTracker, initialCampaignName = '' }) {
  const [campaignName, setCampaignName] = useState(initialCampaignName);
  const [csvData, setCsvData] = useState(null);
  const [file, setFile] = useState(null);
  const [replyTo, setReplyTo] = useState('');
  const [sending, setSending] = useState(false);
  const [sendGapMinutes, setSendGapMinutes] = useState(5);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const [toast, setToast] = useState(null);


  // Inline Editing States
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  const handleEditRow = (index) => {
    setEditingRowIndex(index);
    setEditEmail(csvData.rows[index].email);
    setEditSubject(csvData.rows[index].subject || '');
    setEditBody(csvData.rows[index].body || '');
  };

  const handleSaveRow = (index) => {
    const updatedRows = [...csvData.rows];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(editEmail);

    updatedRows[index] = {
      ...updatedRows[index],
      email: editEmail,
      subject: editSubject,
      body: editBody,
      valid: isValidEmail
    };

    // Filter valid rows again
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

  const handleSend = async () => {
    if (!csvData) return;
    setSending(true);

    const recipients = csvData.validRows.map(row => ({
      email: row.email,
      name: row.name || row.email.split('@')[0],
      variables: {
        Subject: row.subject,
        Body: row.body,
        ...row.raw
      }
    }));

    const payload = {
      name: campaignName.trim() || `Personalized CSV (${csvData.validCount} rows)`,
      campaign_type: 'PERSONALIZED',
      subject: '{{Subject}}',
      body: '{{Body}}',
      send_gap_minutes: parseInt(sendGapMinutes, 10),
      recipients
    };

    try {
      const res = await sendEmails(payload);
      const createdCampaignId = res?.id || res?.data?.id;

      setToast({ 
        type: 'success', 
        message: 'Personalized campaign enqueued!', 
        details: `Dispatched to background queue with ${sendGapMinutes}m delay gap.` 
      });
      setCsvData(null);
      setFile(null);
      
      if (createdCampaignId) {
        window.history.pushState({}, '', `/campaigns/${createdCampaignId}`);
        window.dispatchEvent(new Event('popstate'));
      } else if (onNavigateToTracker) {
        onNavigateToTracker();
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

  const previewRow = csvData?.validRows?.[previewIndex];

  const previewEmail = previewRow
    ? { to: previewRow.email, subject: previewRow.subject, body: previewRow.body }
    : { to: 'recipient@example.com', subject: 'Custom Row Subject', body: 'This body and subject will be loaded directly from your uploaded CSV. Upload a CSV to preview your individual rows.' };

  const canSend = csvData && csvData.validCount > 0 && !sending;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-2">04 · Merge</div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
            Personalized <span className="gradient-text">CSV</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Upload a CSV, map columns to custom subjects and body contents, and broadcast unique custom messages.
          </p>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-48 lg:h-56 rounded-3xl overflow-hidden border border-border group">
        <img src={imgCsv} alt="CSV merge automation" loading="lazy" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative h-full p-6 lg:p-8 flex items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-cyan px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20">
              <span className="size-1.5 rounded-full bg-cyan animate-pulse" /> Merge Mode
            </div>
            <h2 className="mt-3 font-display text-xl lg:text-2xl font-semibold max-w-md">One campaign file, infinite variations — every recipient gets a unique body.</h2>
          </div>
          <div className="hidden md:grid grid-cols-3 gap-6 pr-2">
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">{csvData?.validCount || 0}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Rows parsed</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">3/3</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Token maps</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">100%</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Ready rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info warning */}
      <div className="rounded-2xl bg-cyan/10 border border-cyan/20 p-4 text-cyan flex gap-3 text-sm">
        <AlertCircle className="size-5 shrink-0 animate-pulse" />
        <div>
          <h4 className="font-display font-semibold mb-1">CSV Format Requirements</h4>
          <p className="opacity-90">
            For personalized mode, your CSV file must include columns explicitly titled <span className="font-mono bg-cyan/20 px-1 py-0.5 rounded">Email</span>, <span className="font-mono bg-cyan/20 px-1 py-0.5 rounded">Subject</span>, and <span className="font-mono bg-cyan/20 px-1 py-0.5 rounded">Body</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl glass border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="size-6 rounded-lg bg-cyan/10 border border-cyan/35 text-cyan text-xs font-bold font-mono grid place-items-center">1</span>
              <h3 className="text-base font-display font-semibold">Upload Custom Dataset</h3>
            </div>
            
            <CSVUploader 
              onDataParsed={(data) => {
                setCsvData(data);
                if (data) {
                  setShowTable(true);
                  setPreviewIndex(0);
                }
              }} 
              requiredColumns="personalized" 
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
                  <div className="flex items-center gap-4 text-xs font-mono font-semibold">
                    <div>
                      <span className="text-lime">{csvData.validCount} valid</span>
                    </div>
                    {csvData.invalidCount > 0 && (
                      <div>
                        <span className="text-rose">{csvData.invalidCount} not valid</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowTable(!showTable)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs flex items-center gap-1 cursor-pointer transition border border-border"
                  >
                    <span>{showTable ? 'Hide dataset' : 'Show dataset & edit'}</span>
                    {showTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showTable && (
                  <div className="max-h-64 overflow-auto rounded-xl border border-border bg-black/15 scrollbar-thin">
                    <table className="w-full text-xs text-left border-collapse font-mono">
                      <thead className="text-muted-foreground border-b border-border bg-white/[0.02] sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Row</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">Body Preview</th>
                          <th className="py-2.5 px-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.rows.map((row, i) => {
                          const isEditing = editingRowIndex === i;
                          return (
                            <tr key={i} className={`border-b border-border last:border-none hover:bg-white/[0.01] ${!row.valid ? 'bg-rose-500/5' : ''}`}>
                              <td className="py-2.5 px-3 text-muted-foreground">{row.index}</td>
                              
                              <td className="py-2.5 px-3">
                                {isEditing ? (
                                  <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="px-2 py-1 bg-white/5 border border-border rounded text-xs text-foreground outline-none focus:border-cyan/50 max-w-[150px]"
                                  />
                                ) : (
                                  <span className="text-foreground font-semibold">{row.email}</span>
                                )}
                              </td>

                              <td className="py-2.5 px-3">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editSubject}
                                    onChange={(e) => setEditSubject(e.target.value)}
                                    className="px-2 py-1 bg-white/5 border border-border rounded text-xs text-foreground outline-none focus:border-cyan/50 max-w-[150px]"
                                  />
                                ) : (
                                  <span className="text-muted-foreground max-w-[120px] truncate block">{row.subject}</span>
                                )}
                              </td>

                              <td className="py-2.5 px-3">
                                {isEditing ? (
                                  <textarea
                                    value={editBody}
                                    onChange={(e) => setEditBody(e.target.value)}
                                    rows={1}
                                    className="px-2 py-1 bg-white/5 border border-border rounded text-xs text-foreground outline-none focus:border-cyan/50 max-w-[200px]"
                                  />
                                ) : (
                                  <span className="text-muted-foreground/60 max-w-[150px] truncate block">{row.body}</span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleSaveRow(i)}
                                      className="p-1 rounded bg-lime/10 border border-lime/20 text-lime hover:bg-lime/20 transition cursor-pointer"
                                      title="Save"
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

          {csvData && (
            <div className="rounded-3xl glass border border-border p-6 space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="size-6 rounded-lg bg-cyan/10 border border-cyan/35 text-cyan text-xs font-bold font-mono grid place-items-center">2</span>
                <h3 className="text-base font-display font-semibold">Additional Configuration</h3>
              </div>

              {/* Staggered Delay Selector */}
              <label className="block space-y-2">
                <span className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4 text-cyan" /> Delay Between Emails (Staggered Dispatch)
                  </span>
                  <span className="text-[11px] text-lime font-mono">Background Queue</span>
                </span>
                <select
                  value={sendGapMinutes}
                  onChange={(e) => setSendGapMinutes(e.target.value)}
                  className="input py-2.5 text-sm bg-surface text-foreground border border-border rounded-xl cursor-pointer"
                >
                  <option value="5">5 Minutes Gap (Recommended for High Deliverability)</option>
                  <option value="10">10 Minutes Gap (Safest / Anti-Spam Protection)</option>
                  <option value="1">1 Minute Gap (Fast Stagger)</option>
                  <option value="3">3 Minutes Gap</option>
                  <option value="15">15 Minutes Gap</option>
                  <option value="0">Instant (No Gap)</option>
                </select>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Emails send 1-by-1 in background with a <strong>{sendGapMinutes} minute gap</strong> between each recipient. You can close this website or turn off your PC; the server continues sending on schedule.
                </p>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  Global Reply-To <span className="text-[11px] text-muted-foreground font-normal">(optional — fallback for all rows)</span>
                </span>
                <input
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="reply@example.com"
                  className="input"
                />
              </label>

              <label className="block space-y-2 pt-2">
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
            </div>
          )}

          {csvData && (
            <div className="rounded-3xl glass border border-border p-6 animate-fade-in">
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:shadow-[0_8px_30px_-8px] hover:shadow-lime/60 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                <span>
                  {sending
                    ? 'Queueing custom emails...'
                    : `Launch ${csvData.validCount} Personalized Emails`
                  }
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm">Row Output Preview</h3>
            {csvData && csvData.validCount > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                  disabled={previewIndex === 0}
                  className="p-1 rounded bg-white/5 border border-border text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40"
                  aria-label="Previous row preview"
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
                  aria-label="Next row preview"
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
