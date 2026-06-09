import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Shield, Globe, Key, AlertCircle, CheckCircle2, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import * as api from '../utils/api';

export default function SettingsTab() {
  const { user, updateProfile, changePassword } = useAuth();
  
  // Profile settings state
  const [profileName, setProfileName] = useState(user?.full_name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);



  // SMTP Gmail settings state
  const [smtpAddress, setSmtpAddress] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpData, setSmtpData] = useState(null);
  const [smtpError, setSmtpError] = useState('');
  const [smtpSuccess, setSmtpSuccess] = useState('');
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const fetchSMTPConfig = async () => {
    try {
      const data = await api.fetchSMTP();
      setSmtpData(data);
      setSmtpAddress(data.gmail_address || '');
      if (data.has_password) {
        setSmtpPassword('••••••••••••');
      } else {
        setSmtpPassword('');
      }
    } catch (err) {
      console.error('Failed to load SMTP settings:', err);
    }
  };

  useEffect(() => {
    fetchSMTPConfig();
  }, []);

  // Handle Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    try {
      await updateProfile(profileName, profileEmail);
      setProfileSuccess('Profile updated successfully!');
    } catch (err) {
      setProfileError(err.response?.data?.error || err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };



  // Handle Save SMTP credentials
  const handleSaveSMTP = async (e) => {
    e.preventDefault();
    setSmtpError('');
    setSmtpSuccess('');
    setSmtpLoading(true);
    
    // Only send the password to backend if user modified it
    const passToSend = smtpPassword === '••••••••••••' ? null : smtpPassword;

    try {
      const updated = await api.saveSMTP(smtpAddress, passToSend);
      setSmtpSuccess('Gmail SMTP configurations saved!');
      setSmtpData(updated);
      if (updated.has_password) {
        setSmtpPassword('••••••••••••');
      }
      fetchSMTPConfig();
    } catch (err) {
      setSmtpError(err.response?.data?.error || err.message || 'Failed to save SMTP settings.');
    } finally {
      setSmtpLoading(false);
    }
  };

  // Handle Test SMTP Connection
  const handleTestSMTP = async () => {
    setTestingConnection(true);
    setSmtpError('');
    setSmtpSuccess('');
    try {
      const result = await api.testSMTP();
      setSmtpSuccess(result.message);
      fetchSMTPConfig();
    } catch (err) {
      setSmtpError(err.response?.data?.error || err.message || 'SMTP Authentication Test Failed.');
    } finally {
      setTestingConnection(false);
    }
  };

  // Handle Delete SMTP Config
  const handleDeleteSMTP = async () => {
    if (!window.confirm('Are you sure you want to delete your SMTP configuration? You will not be able to send emails.')) return;
    setSmtpLoading(true);
    setSmtpError('');
    setSmtpSuccess('');
    try {
      await api.deleteSMTP();
      setSmtpSuccess('SMTP configuration deleted.');
      setSmtpAddress('');
      setSmtpPassword('');
      setSmtpData(null);
    } catch (err) {
      setSmtpError(err.response?.data?.error || err.message || 'Failed to delete SMTP settings.');
    } finally {
      setSmtpLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Profile & Security */}
      <div className="lg:col-span-5 space-y-6 animate-slide-up">
        {/* Account Profile Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-theme pb-2">
            <Settings className="w-5 h-5 text-violet-500" />
            <h3 className="text-base font-bold t1">Account Profile</h3>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="field-label">Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="field-label">Email Address</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {profileError && (
              <div className="alert-error flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs">{profileError}</p>
              </div>
            )}
            {profileSuccess && (
              <div className="alert-success flex items-start gap-2 text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <p className="text-xs font-semibold">{profileSuccess}</p>
              </div>
            )}

            <button type="submit" disabled={profileLoading} className="btn-primary w-full justify-center">
              {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-theme pb-2">
            <Key className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold t1">Change Password</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="field-label">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="field-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="field-label">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                required
                minLength={8}
              />
            </div>

            {passwordError && (
              <div className="alert-error flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs">{passwordError}</p>
              </div>
            )}
            {passwordSuccess && (
              <div className="alert-success flex items-start gap-2 text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <p className="text-xs font-semibold">{passwordSuccess}</p>
              </div>
            )}

            <button type="submit" disabled={passwordLoading} className="btn-primary w-full justify-center">
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>


      </div>

      {/* Right Column: Gmail SMTP Configuration */}
      <div className="lg:col-span-7 space-y-6 animate-slide-up">
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-theme pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-violet-500" />
              <div>
                <h3 className="text-base font-bold t1">Gmail SMTP credentials</h3>
                <p className="t3 text-xs">Direct secure dispatch setup (Fernet encrypted backend storage)</p>
              </div>
            </div>
            {smtpData?.is_verified && (
              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                Verified Connection
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSMTP} className="space-y-4">
            <div>
              <label className="field-label">Gmail Address</label>
              <input
                type="email"
                value={smtpAddress}
                onChange={(e) => setSmtpAddress(e.target.value)}
                placeholder="username@gmail.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="field-label flex justify-between">
                <span>Gmail App Password</span>
                <span className="t4 text-[10px] font-semibold">16 characters</span>
              </label>
              <input
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                onClick={() => {
                  if (smtpPassword === '••••••••••••') {
                    setSmtpPassword('');
                  }
                }}
                placeholder="xxxx xxxx xxxx xxxx"
                className="input-field font-mono"
                required
              />
              <p className="text-[10px] t3 mt-1.5 leading-normal">
                To generate a password: Go to Google Account Settings → Security → 2-Step Verification → App Passwords (at the bottom). Generate password for "Mail" and select "Other".
              </p>
            </div>

            {smtpError && (
              <div className="alert-error flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs">{smtpError}</p>
              </div>
            )}
            {smtpSuccess && (
              <div className="alert-success flex items-start gap-2 text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <p className="text-xs font-semibold">{smtpSuccess}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={smtpLoading || testingConnection}
                className="btn-primary flex-1 justify-center py-2.5"
              >
                {smtpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Credentials'}
              </button>
              
              {smtpData?.has_password && (
                <>
                  <button
                    type="button"
                    onClick={handleTestSMTP}
                    disabled={testingConnection || smtpLoading}
                    className="btn-secondary flex-1 justify-center py-2.5 flex items-center gap-2"
                  >
                    {testingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>Test SMTP Connection</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDeleteSMTP}
                    disabled={smtpLoading}
                    className="p-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all cursor-pointer flex items-center justify-center"
                    title="Delete Credentials"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Stats details section */}
          {smtpData && (
            <div className="border-t border-theme pt-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider t3">Daily limits & stats</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="surface-2 p-3 rounded-lg border border-theme">
                  <p className="t3">Sent Today (Limit 500/day)</p>
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-base font-bold t1">{smtpData.emails_sent_today}</span>
                    <span className="t4 font-semibold">/ 500</span>
                  </div>
                </div>
                
                <div className="surface-2 p-3 rounded-lg border border-theme">
                  <p className="t3">Sent This Month</p>
                  <p className="text-base font-bold t1 mt-1">{smtpData.emails_sent_this_month}</p>
                </div>
              </div>
              
              {smtpData.last_email_sent_at && (
                <p className="text-[10px] t4">
                  Last email dispatched at: {new Date(smtpData.last_email_sent_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
