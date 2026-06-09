import { useState, useEffect } from 'react';
import { Search, Loader2, RefreshCw, ChevronLeft, ChevronRight, Eye, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react';
import * as api from '../utils/api';
import imgTracker from '../assets/snippet-tracker.jpg';

export default function HistoryTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  
  const [selectedBody, setSelectedBody] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.fetchEmailLogs({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: status || undefined
      });
      setLogs(data.results);
      setTotalCount(data.total_count);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const getStatusBadge = (status) => {
    const map = {
      SENT: { c: "lime", label: "INFO" },
      FAILED: { c: "rose", label: "ERR" },
    };
    const x = map[status] || { c: "amber", label: "PENDING" };
    return (
      <span className="text-[10px] tracking-wider font-mono font-bold px-2 py-1 rounded-md text-center"
        style={{ background: `oklch(from var(--${x.c}) l c h / 0.15)`, color: `var(--${x.c})` }}>
        {x.label}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-2">06 · Audit</div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
            History <span className="gradient-text">logs</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Append‑only event stream. Filter by campaign, recipient email address, or sending level.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> 
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-48 lg:h-56 rounded-3xl overflow-hidden border border-border group">
        <img src={imgTracker} alt="Audit history logs" loading="lazy" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative h-full p-6 lg:p-8 flex items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-cyan px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20">
              <span className="size-1.5 rounded-full bg-cyan animate-pulse" /> Domain Audit
            </div>
            <h2 className="mt-3 font-display text-xl lg:text-2xl font-semibold max-w-md">An append‑only timeline of every event your domain has triggered.</h2>
          </div>
          <div className="hidden md:grid grid-cols-3 gap-6 pr-2">
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">{totalCount}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Events</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">90d</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Retention</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">celery</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Queue Mode</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl glass border border-border p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by recipient email, subject or campaign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <div className="w-full sm:w-48">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="input capitalize"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold text-sm cursor-pointer whitespace-nowrap">
            Apply Filter
          </button>
        </form>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 text-cyan animate-spin" />
          <p className="text-muted-foreground text-sm font-medium font-mono">Querying logs stream...</p>
        </div>
      ) : logs.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-3xl glass border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-muted-foreground border-b border-border bg-white/[0.02] font-semibold text-xs uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-4 px-5">Recipient</th>
                    <th className="py-4 px-5">Subject</th>
                    <th className="py-4 px-5">Campaign</th>
                    <th className="py-4 px-5">Level</th>
                    <th className="py-4 px-5">Sent At</th>
                    <th className="py-4 px-5 text-center">Body</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-xs">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-5 font-semibold text-foreground">
                        {log.recipient_name ? `${log.recipient_name} ` : ''}
                        <span className="text-muted-foreground font-normal">({log.recipient})</span>
                      </td>
                      <td className="py-4 px-5 text-muted-foreground truncate max-w-xs">{log.subject}</td>
                      <td className="py-4 px-5 text-cyan font-bold">{log.campaign_name}</td>
                      <td className="py-4 px-5">
                        {getStatusBadge(log.status)}
                        {log.error_message && (
                          <p className="text-[10px] text-rose mt-1 max-w-xs truncate" title={log.error_message}>
                            {log.error_message}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-5 text-muted-foreground/60">
                        {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => setSelectedBody(log)}
                          className="p-1.5 rounded-lg bg-white/5 border border-border text-cyan hover:bg-cyan/15 cursor-pointer transition"
                          title="View Email Body"
                        >
                          <Eye className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-4 border border-border rounded-2xl glass text-xs font-mono">
            <span className="text-muted-foreground">
              Showing page <span className="font-bold text-cyan">{page}</span> of <span className="font-bold text-cyan">{totalPages}</span> ({totalCount} entries)
            </span>
            
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 rounded bg-white/5 hover:bg-white/10 border border-border text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded bg-white/5 hover:bg-white/10 border border-border text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl glass border border-border p-12 text-center space-y-2">
          <p className="text-muted-foreground text-sm font-semibold">No audit logs matched your query.</p>
          <p className="text-muted-foreground/60 text-xs font-mono">Check your filters or deploy a campaign to populate events.</p>
        </div>
      )}

      {/* Email Body Modal Preview */}
      {selectedBody && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-55 animate-fade-in">
          <div className="rounded-3xl glass border border-border max-w-3xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex justify-between items-start gap-4">
              <div className="space-y-1">
                <h3 className="font-display font-semibold text-lg">{selectedBody.subject}</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  To: <span className="text-cyan font-bold">{selectedBody.recipient}</span> · Status: <span className="text-lime font-bold">{selectedBody.status}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedBody(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-neutral-900/30">
              {selectedBody.body?.trim().startsWith('<') ? (
                <div className="rounded-2xl border border-border bg-white overflow-hidden flex flex-col shadow-inner">
                  <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50 flex items-center gap-2 text-xs flex-shrink-0 select-none">
                    <span className="size-2 rounded-full bg-rose-400" />
                    <span className="size-2 rounded-full bg-amber-400" />
                    <span className="size-2 rounded-full bg-emerald-400" />
                    <span className="ml-auto font-mono text-zinc-400">browser</span>
                  </div>
                  <div className="p-4 bg-white text-zinc-800 min-h-[300px] overflow-auto">
                    <iframe
                      srcDoc={selectedBody.body}
                      title="Sent Email Content"
                      sandbox="allow-same-origin"
                      className="w-full min-h-[350px] border-none bg-white"
                    />
                  </div>
                </div>
              ) : (
                <pre className="p-6 rounded-2xl bg-white/5 font-mono text-xs whitespace-pre-wrap border border-border text-muted-foreground select-text">
                  {selectedBody.body}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
