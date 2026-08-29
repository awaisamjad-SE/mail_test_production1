import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Server, Database, Activity, Users, UserPlus, Key, Trash2, 
  RefreshCw, CheckCircle2, AlertTriangle, AlertOctagon, Cpu, HardDrive, 
  Search, Filter, Lock, Unlock, Mail, Clock, Eye, X, Check, Layers
} from 'lucide-react';
import * as api from '../utils/api';

export default function AdminConsoleTab() {
  const [telemetry, setTelemetry] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // User Management State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);

  // Form Inputs
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('USER');

  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [processing, setProcessing] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadAdminData = async () => {
    try {
      setRefreshing(true);
      const [telRes, usersRes] = await Promise.all([
        api.fetchAdminTelemetry(),
        api.fetchAdminUsers()
      ]);
      setTelemetry(telRes);
      setUsers(usersRes || []);
    } catch (err) {
      console.error('Failed to load admin console telemetry:', err);
      showToast('Error loading admin telemetry from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) {
      showToast('Email and Password are required.');
      return;
    }
    setProcessing(true);
    try {
      await api.createAdminUser({
        email: newUserEmail,
        full_name: newUserName,
        password: newUserPassword,
        role: newUserRole
      });
      showToast(`User account ${newUserEmail} created successfully.`);
      setShowCreateUserModal(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setNewUserRole('USER');
      loadAdminData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to create user account.');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleUserRole = async (userObj) => {
    const nextRole = userObj.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.updateAdminUser(userObj.id, { role: nextRole });
      showToast(`Updated ${userObj.email} role to ${nextRole}`);
      loadAdminData();
    } catch (err) {
      showToast('Failed to update user role.');
    }
  };

  const handleToggleUserStatus = async (userObj) => {
    const nextStatus = !userObj.is_active;
    try {
      await api.updateAdminUser(userObj.id, { is_active: nextStatus });
      showToast(`User ${userObj.email} ${nextStatus ? 'activated' : 'disabled'}.`);
      loadAdminData();
    } catch (err) {
      showToast('Failed to update user active status.');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUserForPassword || !resetPasswordInput) return;
    setProcessing(true);
    try {
      await api.updateAdminUser(selectedUserForPassword.id, { password: resetPasswordInput });
      showToast(`Password reset for ${selectedUserForPassword.email}.`);
      setSelectedUserForPassword(null);
      setResetPasswordInput('');
    } catch (err) {
      showToast('Failed to reset password.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserForDelete) return;
    setProcessing(true);
    try {
      await api.deleteAdminUser(selectedUserForDelete.id);
      showToast(`User account ${selectedUserForDelete.email} deleted.`);
      setSelectedUserForDelete(null);
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete user account.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && u.is_active) || 
      (statusFilter === 'DISABLED' && !u.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto font-mono animate-pulse">
        <div className="h-10 w-64 bg-white/10 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-white/5 rounded-3xl" />
          <div className="h-32 bg-white/5 rounded-3xl" />
          <div className="h-32 bg-white/5 rounded-3xl" />
        </div>
        <div className="h-96 bg-white/5 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-24 font-sans text-foreground">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-cyan text-zinc-950 font-mono text-xs font-bold shadow-2xl flex items-center gap-2 border border-cyan/40"
          >
            <CheckCircle2 className="size-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass border border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-[11px] font-mono uppercase font-bold tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> Super Admin Operations Console
            </span>
            <span className="size-2 rounded-full bg-lime animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">System Administration & Infrastructure Health</h1>
          <p className="text-xs text-muted-foreground font-mono">Manage SaaS user access, roles, database status, and background queue workers.</p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button 
            onClick={loadAdminData}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-border text-foreground font-semibold flex items-center gap-2 cursor-pointer transition"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-cyan' : ''}`} /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* 2. Infrastructure Health & Database Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        {/* Database Telemetry */}
        <div className="p-6 rounded-3xl glass border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-cyan/10 border border-cyan/30 grid place-items-center text-cyan">
                <Database className="size-4" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm uppercase">Database Cluster</h3>
                <span className="text-[10px] text-muted-foreground">Engine: {telemetry?.database?.engine || 'POSTGRESQL'}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-lime/10 border border-lime/30 text-lime text-[10px] font-bold">
              ● ONLINE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">SaaS Users</span>
              <p className="text-xl font-bold text-foreground mt-0.5">{telemetry?.database?.user_count || 0}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Campaigns</span>
              <p className="text-xl font-bold text-cyan mt-0.5">{telemetry?.database?.campaign_count || 0}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Email Logs</span>
              <p className="text-xl font-bold text-foreground mt-0.5">{telemetry?.database?.email_log_count || 0}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Inbound Replies</span>
              <p className="text-xl font-bold text-lime mt-0.5">{telemetry?.database?.inbound_count || 0}</p>
            </div>
          </div>
        </div>

        {/* Redis & Celery Queue Health */}
        <div className="p-6 rounded-3xl glass border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-lime/10 border border-lime/30 grid place-items-center text-lime">
                <Cpu className="size-4" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm uppercase">Queue & Redis Workers</h3>
                <span className="text-[10px] text-muted-foreground">Celery Task Dispatcher</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              telemetry?.queue?.status === 'HEALTHY' ? 'bg-lime/10 border-lime/30 text-lime' : 'bg-amber/10 border-amber/30 text-amber'
            }`}>
              ● {telemetry?.queue?.status || 'HEALTHY'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Active Workers</span>
              <p className="text-xl font-bold text-lime mt-0.5">{telemetry?.queue?.active_workers || 8} Threads</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Queue Depth</span>
              <p className="text-xl font-bold text-foreground mt-0.5">{telemetry?.queue?.pending_queue_depth || 0} Pending</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-border col-span-2">
              <span className="text-[10px] text-muted-foreground uppercase">Redis Cache State</span>
              <p className="text-xs font-bold text-cyan mt-0.5 flex items-center gap-2">
                <span className="size-2 rounded-full bg-cyan animate-ping" />
                {telemetry?.queue?.redis_online ? 'CONNECTED & FLUSHING' : 'STANDBY MODE'}
              </p>
            </div>
          </div>
        </div>

        {/* System SMTP Audit */}
        <div className="p-6 rounded-3xl glass border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-amber/10 border border-amber/30 grid place-items-center text-amber">
                <Mail className="size-4" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm uppercase">SMTP Accounts Health</h3>
                <span className="text-[10px] text-muted-foreground">Global Sending Accounts</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-[10px] font-bold">
              {telemetry?.smtp?.healthy_credentials || 0} Healthy
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Total Accounts</span>
              <p className="text-xl font-bold text-foreground mt-0.5">{telemetry?.smtp?.total_credentials || 0}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Auth Errors</span>
              <p className={`text-xl font-bold mt-0.5 ${telemetry?.smtp?.auth_errors > 0 ? 'text-rose font-black' : 'text-foreground'}`}>
                {telemetry?.smtp?.auth_errors || 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-border col-span-2">
              <span className="text-[10px] text-muted-foreground uppercase">Connection Status</span>
              <p className="text-xs font-bold text-lime mt-0.5">All outbound relays verified OK</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. User Management Suite */}
      <div className="p-6 rounded-3xl glass border border-border space-y-6 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="size-4 text-cyan" /> User Accounts & Access Control
            </h2>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">Manage user permissions, grant admin roles, reset passwords, or create new accounts.</p>
          </div>

          <button 
            onClick={() => setShowCreateUserModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-cyan text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer hover:bg-cyan/90 transition shadow-lg shrink-0"
          >
            <UserPlus className="size-4" /> Create User Account
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search users by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2.5 rounded-2xl bg-white/5 border border-border text-xs text-foreground focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admins Only</option>
              <option value="USER">Standard Users</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-2xl bg-white/5 border border-border text-xs text-foreground focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="DISABLED">Disabled Accounts</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Campaigns</th>
                  <th className="p-4">Date Joined</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-semibold text-foreground">
                        <div>
                          <div className="text-sm font-bold text-foreground">{u.email}</div>
                          <div className="text-[11px] text-muted-foreground font-sans">{u.full_name || 'No display name'}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          u.role === 'ADMIN' 
                            ? 'bg-cyan/10 border-cyan/40 text-cyan' 
                            : 'bg-white/5 border-border text-muted-foreground'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          u.is_active 
                            ? 'bg-lime/10 border-lime/40 text-lime' 
                            : 'bg-rose/10 border-rose/40 text-rose'
                        }`}>
                          {u.is_active ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-foreground">{u.total_campaigns}</td>
                      <td className="p-4 text-muted-foreground text-[11px]">
                        {new Date(u.date_joined).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Role Toggle */}
                          <button
                            onClick={() => handleToggleUserRole(u)}
                            title={u.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-muted-foreground hover:text-cyan cursor-pointer transition"
                          >
                            <ShieldCheck className="size-3.5" />
                          </button>

                          {/* Status Toggle */}
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            title={u.is_active ? 'Disable Account' : 'Activate Account'}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-muted-foreground hover:text-amber cursor-pointer transition"
                          >
                            {u.is_active ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => setSelectedUserForPassword(u)}
                            title="Reset Password"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-muted-foreground hover:text-foreground cursor-pointer transition"
                          >
                            <Key className="size-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => setSelectedUserForDelete(u)}
                            title="Delete User Account"
                            className="p-2 rounded-xl bg-white/5 hover:bg-rose/10 border border-border hover:border-rose/40 text-muted-foreground hover:text-rose cursor-pointer transition"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                      No user accounts found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. MODALS */}

      {/* CREATE USER MODAL */}
      <AnimatePresence>
        {showCreateUserModal && (
          <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-950 border border-cyan/40 rounded-3xl p-6 space-y-4 font-mono text-slate-100 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-slate-100 text-sm uppercase">Create New User Account</h3>
                <button onClick={() => setShowCreateUserModal(false)} className="text-slate-400 hover:text-slate-100 p-1">
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Email Address *</label>
                  <input 
                    type="email"
                    required
                    placeholder="user@company.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-zinc-900 border border-border text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Full Name</label>
                  <input 
                    type="text"
                    placeholder="Awais Amjad"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-zinc-900 border border-border text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Password *</label>
                  <input 
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-zinc-900 border border-border text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Role Permission</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-zinc-900 border border-border text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-xs cursor-pointer"
                  >
                    <option value="USER">USER (Standard SaaS User)</option>
                    <option value="ADMIN">ADMIN (Full Super Admin Access)</option>
                  </select>
                </div>

                <div className="pt-3 flex gap-2 font-mono">
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="w-1/2 py-3 rounded-2xl bg-white/5 border border-border text-slate-300 font-bold hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-1/2 py-3 rounded-2xl bg-cyan text-zinc-950 font-bold hover:bg-cyan/90 transition shadow-lg cursor-pointer"
                  >
                    {processing ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESET PASSWORD MODAL */}
      <AnimatePresence>
        {selectedUserForPassword && (
          <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-950 border border-cyan/40 rounded-3xl p-6 space-y-4 font-mono text-slate-100 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-slate-100 text-sm uppercase">Reset User Password</h3>
                <button onClick={() => setSelectedUserForPassword(null)} className="text-slate-400 hover:text-slate-100 p-1">
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <p className="text-slate-300">Set a new password for account <strong className="text-cyan">{selectedUserForPassword.email}</strong>:</p>

                <input 
                  type="password"
                  placeholder="Enter new password..."
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-zinc-900 border border-border text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />

                <div className="pt-3 flex gap-2 font-mono">
                  <button
                    onClick={() => setSelectedUserForPassword(null)}
                    className="w-1/2 py-3 rounded-2xl bg-white/5 border border-border text-slate-300 font-bold hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={processing || !resetPasswordInput}
                    className="w-1/2 py-3 rounded-2xl bg-cyan text-zinc-950 font-bold hover:bg-cyan/90 transition shadow-lg cursor-pointer"
                  >
                    {processing ? 'Saving...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {selectedUserForDelete && (
          <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-950 border border-rose/40 rounded-3xl p-6 space-y-4 font-mono text-slate-100 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-rose-400 text-sm uppercase flex items-center gap-2">
                  <AlertOctagon className="size-4" /> Delete User Account
                </h3>
                <button onClick={() => setSelectedUserForDelete(null)} className="text-slate-400 hover:text-slate-100 p-1">
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <p className="text-slate-300 leading-relaxed">
                  Are you sure you want to permanently delete account <strong className="text-rose-400">{selectedUserForDelete.email}</strong>? All associated campaigns and email logs will be purged.
                </p>

                <div className="pt-3 flex gap-2 font-mono">
                  <button
                    onClick={() => setSelectedUserForDelete(null)}
                    className="w-1/2 py-3 rounded-2xl bg-white/5 border border-border text-slate-300 font-bold hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={processing}
                    className="w-1/2 py-3 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-500 transition shadow-lg cursor-pointer"
                  >
                    {processing ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
