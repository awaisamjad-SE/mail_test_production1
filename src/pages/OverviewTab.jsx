import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area 
} from 'recharts';
import { 
  Send, AlertTriangle, CheckCircle2, FileText, Layers, Loader2, RefreshCw 
} from 'lucide-react';
import * as api from '../utils/api';

export default function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsData, chartsData, activitiesData] = await Promise.all([
        api.fetchDashboardStats(),
        api.fetchDashboardCharts(),
        api.fetchActivityLogs()
      ]);
      setStats(statsData);
      setCharts(chartsData);
      setActivities(activitiesData);
    } catch (err) {
      console.error('Error loading overview data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <p className="t3 text-sm">Loading analytics dashboard...</p>
      </div>
    );
  }

  // Fallback data in case empty
  const dailySendsData = charts?.daily_sends || [];
  const deliveryStatusData = charts?.delivery_status?.filter(d => d.value > 0).length > 0 
    ? charts.delivery_status 
    : [
        { name: 'Sent', value: stats?.emails_sent || 0, color: '#10b981' },
        { name: 'Failed', value: stats?.emails_failed || 0, color: '#ef4444' },
      ];
  
  const campaignPerfData = charts?.campaign_performance || [];
  const monthlyGrowthData = charts?.monthly_growth || [];

  return (
    <div className="space-y-8">
      {/* Tab Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black t1">Overview Dashboard</h2>
          <p className="t3 text-sm">Real-time email campaign statistics and logs</p>
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Card 1: Total Sent */}
        <div className="card p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <span className="t3 text-xs font-bold uppercase tracking-wider">Sent Emails</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Send className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold t1">{stats?.emails_sent ?? 0}</h3>
            <p className="t4 text-xs mt-1">Successfully dispatched</p>
          </div>
        </div>

        {/* Card 2: Failed */}
        <div className="card p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <span className="t3 text-xs font-bold uppercase tracking-wider">Failed Emails</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold t1">{stats?.emails_failed ?? 0}</h3>
            <p className="t4 text-xs mt-1">SMTP errors / Limit rejects</p>
          </div>
        </div>

        {/* Card 3: Success Rate */}
        <div className="card p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <span className="t3 text-xs font-bold uppercase tracking-wider">Delivery Rate</span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold t1">{stats?.success_rate ?? 0}%</h3>
            <p className="t4 text-xs mt-1">Overall percentage</p>
          </div>
        </div>

        {/* Card 4: Campaigns */}
        <div className="card p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <span className="t3 text-xs font-bold uppercase tracking-wider">Campaigns</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Layers className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold t1">{stats?.campaigns ?? 0}</h3>
            <p className="t4 text-xs mt-1">Active & Completed campaigns</p>
          </div>
        </div>

        {/* Card 5: Templates */}
        <div className="card p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <span className="t3 text-xs font-bold uppercase tracking-wider">Templates</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold t1">{stats?.templates ?? 0}</h3>
            <p className="t4 text-xs mt-1">Visual drafts saved</p>
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Chart 1: Daily Sends - LineChart */}
        <div className="card p-6 lg:col-span-8 space-y-4">
          <h3 className="text-sm font-bold t2">Daily Sends (Last 30 Days)</h3>
          <div className="h-72 w-full">
            {dailySendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface-1)', 
                      borderColor: 'var(--border)', 
                      borderRadius: '8px', 
                      color: 'var(--text-primary)' 
                    }} 
                  />
                  <Line type="monotone" dataKey="count" name="Emails Sent" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center t4 text-xs">No email sending data recorded yet.</div>
            )}
          </div>
        </div>

        {/* Chart 2: Delivery Status - PieChart */}
        <div className="card p-6 lg:col-span-4 space-y-4 flex flex-col justify-between">
          <h3 className="text-sm font-bold t2">Delivery Status</h3>
          <div className="h-56 w-full flex justify-center">
            {stats?.emails_sent > 0 || stats?.emails_failed > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliveryStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {deliveryStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface-1)', 
                      borderColor: 'var(--border)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)' 
                    }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center t4 text-xs">No status data available.</div>
            )}
          </div>
        </div>

        {/* Chart 3: Campaign Performance - BarChart */}
        <div className="card p-6 lg:col-span-6 space-y-4">
          <h3 className="text-sm font-bold t2">Campaign Performance (Top 5)</h3>
          <div className="h-72 w-full">
            {campaignPerfData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignPerfData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface-1)', 
                      borderColor: 'var(--border)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)' 
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="sent" name="Sent" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center t4 text-xs">No campaigns sent yet.</div>
            )}
          </div>
        </div>

        {/* Chart 4: Monthly volume - AreaChart */}
        <div className="card p-6 lg:col-span-6 space-y-4">
          <h3 className="text-sm font-bold t2">Monthly Growth (Last 6 Months)</h3>
          <div className="h-72 w-full">
            {monthlyGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyGrowthData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface-1)', 
                      borderColor: 'var(--border)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)' 
                    }} 
                  />
                  <Area type="monotone" dataKey="count" name="Monthly Sends" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center t4 text-xs">No monthly sending logs recorded yet.</div>
            )}
          </div>
        </div>

      </div>

      {/* Recent Activity Feed */}
      <div className="card p-6 space-y-4">
        <h3 className="text-base font-bold t1">Recent Activity</h3>
        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
          {activities.length > 0 ? (
            activities.map((act) => (
              <div key={act.id} className="flex justify-between items-center py-2.5 border-b border-theme last:border-none animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                  <span className="text-sm font-medium t1">{act.action}</span>
                </div>
                <span className="text-xs t4">{new Date(act.created_at).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <div className="py-6 text-center t4 text-sm">No activity logs recorded. Actions like logging in, creating campaigns, and SMTP testing will appear here.</div>
          )}
        </div>
      </div>
    </div>
  );
}
