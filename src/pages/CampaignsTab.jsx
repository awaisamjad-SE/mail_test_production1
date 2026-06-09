import { useState, useEffect, useRef } from 'react';
import { Mail, Clock, CheckCircle, AlertCircle, Loader2, Trash2, RefreshCw } from 'lucide-react';
import * as api from '../utils/api';

export default function CampaignsTab() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollIntervalRef = useRef(null);

  const fetchCampaigns = async () => {
    try {
      const data = await api.fetchCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();

    // Poll campaigns that are in 'Processing' state
    pollIntervalRef.current = setInterval(async () => {
      let hasProcessing = false;
      
      setCampaigns(prev => {
        hasProcessing = prev.some(c => c.status === 'Processing');
        return prev;
      });

      if (hasProcessing) {
        try {
          const freshCampaigns = await api.fetchCampaigns();
          setCampaigns(freshCampaigns);
        } catch (e) {
          console.error('Failed to poll campaigns:', e);
        }
      }
    }, 4000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This will delete all associated logs.')) return;
    try {
      await api.deleteCampaign(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Failed to delete campaign: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <p className="t3 text-sm">Loading campaigns tracker...</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'Failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'Processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'Failed':
        return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'Processing':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black t1 flex items-center gap-3">
            <Mail className="w-7 h-7 accent-text" />
            <span>Campaign Tracker</span>
          </h2>
          <p className="t3 text-sm">Monitor live dispatch status of bulk and quick sending jobs</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 px-3 py-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {campaigns.map((c) => {
            const completedCount = c.successful_count + c.failed_count;
            const progressPct = c.total_recipients > 0 
              ? Math.round((completedCount / c.total_recipients) * 100) 
              : 0;

            return (
              <div key={c.id} className="card p-6 space-y-4 hover:border-violet-500/30 transition-colors animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-3">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold t1">{c.name}</h3>
                    <p className="t3 text-xs">
                      Type: <span className="font-semibold">{c.campaign_type}</span> • Created at: {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(c.status)}`}>
                      {getStatusIcon(c.status)}
                      <span>{c.status}</span>
                    </span>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg border border-theme hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="surface-2 p-3 rounded-lg border border-theme text-center">
                    <p className="t3 text-xs">Total Recipients</p>
                    <p className="text-xl font-bold t1 mt-1">{c.total_recipients}</p>
                  </div>
                  <div className="surface-2 p-3 rounded-lg border border-theme text-center">
                    <p className="text-emerald-500 text-xs">Successful Sent</p>
                    <p className="text-xl font-bold text-emerald-500 mt-1">{c.successful_count}</p>
                  </div>
                  <div className="surface-2 p-3 rounded-lg border border-theme text-center">
                    <p className="text-red-500 text-xs">Failed / Bounced</p>
                    <p className="text-xl font-bold text-red-500 mt-1">{c.failed_count}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="t3 font-medium">Sending Progress</span>
                    <span className="font-bold t1">{progressPct}% ({completedCount} / {c.total_recipients})</span>
                  </div>
                  <div className="progress-track h-3 bg-violet-600/10">
                    <div 
                      className={`progress-fill h-full rounded-full transition-all duration-500 ${
                        c.status === 'Failed' 
                          ? 'bg-red-500' 
                          : c.status === 'Completed'
                          ? 'bg-emerald-500' 
                          : 'bg-violet-600'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center space-y-3">
          <p className="t3">No email campaigns discovered.</p>
          <p className="t4 text-xs">Deploy a batch email campaign or quick send an email, and the log tracker will display it here.</p>
        </div>
      )}
    </div>
  );
}
