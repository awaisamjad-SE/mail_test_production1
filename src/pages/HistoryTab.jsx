import { useState, useEffect } from 'react';
import { Search, Loader2, RefreshCw, ChevronLeft, ChevronRight, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import * as api from '../utils/api';

export default function HistoryTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  
  const [selectedBody, setSelectedBody] = useState(null); // To view specific email body

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black t1">Email History Logs</h2>
          <p className="t3 text-sm">Search and audit every individual email sent from the platform</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 px-3 py-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-3 t3">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search recipient, subject or campaign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          
          <div className="w-full sm:w-48">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="input-field py-2.5"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <button type="submit" className="btn-primary w-full sm:w-auto px-6 py-2.5">
            Search
          </button>
        </form>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
          <p className="t3 text-sm">Searching history logs...</p>
        </div>
      ) : logs.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-theme bg-[var(--surface-1)]">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="t3 border-b border-theme bg-[var(--surface-3)] font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Campaign</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Sent At</th>
                  <th className="py-3.5 px-4 text-center">Body</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-theme last:border-none hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-4 px-4 font-medium t1">
                      {log.recipient_name ? `${log.recipient_name} ` : ''}
                      <span className="t3 font-normal">({log.recipient})</span>
                    </td>
                    <td className="py-4 px-4 t2 truncate max-w-xs">{log.subject}</td>
                    <td className="py-4 px-4 t2 font-semibold">{log.campaign_name}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(log.status)}
                        <span className={`text-xs font-bold ${
                          log.status === 'SENT' ? 'text-emerald-500' : log.status === 'FAILED' ? 'text-red-500' : 'text-amber-500'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      {log.error_message && (
                        <p className="text-[10px] text-red-400 mt-1 max-w-xs truncate" title={log.error_message}>
                          {log.error_message}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 t4 text-xs">
                      {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setSelectedBody(log)}
                        className="btn-ghost p-1.5 rounded-lg text-violet-500 border border-transparent hover:border-violet-500/20"
                        title="View Email Body"
                      >
                        <Eye className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-4 border border-theme rounded-xl surface-1 text-sm">
            <span className="t3">
              Showing page <span className="font-bold t1">{page}</span> of <span className="font-bold t1">{totalPages}</span> ({totalCount} total logs)
            </span>
            
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="btn-secondary p-2 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="btn-secondary p-2 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center space-y-2">
          <p className="t3 font-medium">No history logs matched your query.</p>
          <p className="t4 text-xs">Modify your filters or send emails to inspect results.</p>
        </div>
      )}

      {/* Email Body Modal Preview */}
      {selectedBody && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-[var(--surface-1)] border border-theme max-w-3xl w-full rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-theme flex justify-between items-start gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold t1">{selectedBody.subject}</h3>
                <p className="t3 text-xs">
                  To: <span className="font-semibold">{selectedBody.recipient}</span> • Status: <span className="font-bold uppercase">{selectedBody.status}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedBody(null)}
                className="btn-ghost p-1.5 rounded-lg border border-theme text-xs"
              >
                ✕ Close
              </button>
            </div>
            
            {/* Modal Body content (HTML or plain text) */}
            <div className="p-6 overflow-y-auto flex-1 bg-[var(--surface-2)]">
              {selectedBody.body?.trim().startsWith('<') ? (
                <div 
                  className="bg-white text-black p-6 rounded-lg border border-gray-300 min-h-[250px] overflow-auto shadow-inner"
                  dangerouslySetInnerHTML={{ __html: selectedBody.body }}
                />
              ) : (
                <pre className="p-6 rounded-lg bg-[var(--surface-3)] text-sm font-mono whitespace-pre-wrap border border-theme t2">
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
