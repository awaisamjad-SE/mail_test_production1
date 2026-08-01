import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Shield, Globe, Key, AlertCircle, CheckCircle2, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import * as api from '../utils/api';
import imgOverview from '../assets/snippet-overview.jpg';

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

  // SMTP settings state
  const [provider, setProvider] = useState('gmail');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [useSsl, setUseSsl] = useState(false);
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
      const prov = data.provider || 'gmail';
      setProvider(prov);
      if (prov === 'custom') {
        setSmtpHost(data.smtp_host || 'mail.fastnexa.com');
        setSmtpPort(data.smtp_port || 465);
        setUseSsl(data.use_ssl !== undefined ? data.use_ssl : true);
      } else {
        setSmtpHost('smtp.gmail.com');
        setSmtpPort(587);
        setUseSsl(false);
      }
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

  const handleProviderSwitch = (newProv) => {
    setProvider(newProv);
    setSmtpError('');
    setSmtpSuccess('');
    
    if (newProv === 'custom') {
      if (!smtpHost || smtpHost === 'smtp.gmail.com') {
        setSmtpHost('mail.fastnexa.com');
      }
      setSmtpPort(465);
      setUseSsl(true);
    } else {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort(587);
      setUseSsl(false);
    }

    if (smtpData?.provider !== newProv) {
      setSmtpPassword('');
    } else if (smtpData?.has_password) {
      setSmtpPassword('••••••••••••');
    }
  };

  const handleSaveSMTP = async (e) => {
    e.preventDefault();
    setSmtpError('');
    setSmtpSuccess('');
    setSmtpLoading(true);

    const isDummyPass = smtpPassword === '••••••••••••';
    const passToSend = isDummyPass ? null : smtpPassword;

    if (!isDummyPass && (!smtpPassword || smtpPassword.trim() === '')) {
      setSmtpError('Please enter your email account password before saving.');
      setSmtpLoading(false);
      return;
    }

    try {
      const payload = {
        provider,
        smtp_host: provider === 'gmail' ? 'smtp.gmail.com' : smtpHost,
        smtp_port: provider === 'gmail' ? 587 : parseInt(smtpPort, 10),
        use_ssl: provider === 'gmail' ? false : useSsl,
        gmail_address: smtpAddress,
        app_password: passToSend
      };
      const updated = await api.saveSMTP(payload);
      setSmtpSuccess(`${provider === 'gmail' ? 'Google/Gmail' : 'Hostinger/Custom'} SMTP configuration saved successfully!`);
      setSmtpData(updated);
      if (updated.has_password) {
        setSmtpPassword('••••••••••••');
      }
      fetchSMTPConfig();
    } catch (err) {
      setSmtpError(err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to save SMTP settings.');
    } finally {
      setSmtpLoading(false);
    }
  };

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
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-cyan/80 font-mono mb-2">08 · Config</div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
            Settings & <span className="gradient-text">SMTP</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Sender identity, Gmail SMTP credentials, domain verification status and user profile settings.
          </p>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-48 lg:h-56 rounded-3xl overflow-hidden border border-border group">
        <img src={imgOverview} alt="Settings and domain configuration" loading="lazy" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative h-full p-6 lg:p-8 flex items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-cyan px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20">
              <span className="size-1.5 rounded-full bg-cyan animate-pulse" /> Verified
            </div>
            <h2 className="mt-3 font-display text-xl lg:text-2xl font-semibold max-w-md">Secure Fernet symmetric encryption protect your app credentials.</h2>
          </div>
          <div className="hidden md:grid grid-cols-3 gap-6 pr-2">
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">{smtpData?.gmail_address ? "1" : "0"}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Domains</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">{smtpData?.is_verified ? "OK" : "NO"}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">SPF / DKIM</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold gradient-text">AES‑256</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Storage Crypt</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile and Password */}
        <div className="lg:col-span-5 space-y-6">
          {/* Account Profile Card */}
          <div className="rounded-3xl glass border border-border p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Settings className="w-5 h-5 text-cyan" />
              <h3 className="text-base font-display font-semibold">Account Profile</h3>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium flex items-center gap-1.5">Full Name</span>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="input"
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium flex items-center gap-1.5">Email Address</span>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="input"
                  required
                />
              </label>

              {profileError && (
                <div className="alert-error flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{profileError}</p>
                </div>
              )}
              {profileSuccess && (
                <div className="alert-success flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{profileSuccess}</p>
                </div>
              )}

              <button type="submit" disabled={profileLoading} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold text-sm cursor-pointer transition">
                {profileLoading ? <Loader2 className="size-4 animate-spin mx-auto" /> : 'Save details'}
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="rounded-3xl glass border border-border p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Key className="w-5 h-5 text-cyan" />
              <h3 className="text-base font-display font-semibold">Change Password</h3>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium flex items-center gap-1.5">Current Password</span>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="input"
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium flex items-center gap-1.5">New Password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  required
                  minLength={8}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium flex items-center gap-1.5">Confirm New Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  required
                  minLength={8}
                />
              </label>

              {passwordError && (
                <div className="alert-error flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{passwordError}</p>
                </div>
              )}
              {passwordSuccess && (
                <div className="alert-success flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{passwordSuccess}</p>
                </div>
              )}

              <button type="submit" disabled={passwordLoading} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold text-sm cursor-pointer transition">
                {passwordLoading ? <Loader2 className="size-4 animate-spin mx-auto" /> : 'Update password'}
              </button>
            </form>
          </div>
        </div>

        {/* Gmail & Custom SMTP credentials */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl glass border border-border p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan" />
                <div>
                  <h3 className="font-display font-semibold text-base">SMTP Credentials</h3>
                  <p className="text-xs text-muted-foreground">Used to dispatch outbound mail securely</p>
                </div>
              </div>
              {smtpData?.is_verified && smtpData?.provider === provider && (
                <span className="bg-lime/10 text-lime border border-lime/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md animate-pulse">
                  Active Connection
                </span>
              )}
            </div>

            {/* Provider Switch Tabs */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select SMTP Provider</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleProviderSwitch('gmail')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
                    provider === 'gmail'
                      ? 'bg-cyan/20 border-cyan text-cyan'
                      : 'bg-white/5 border-border text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  <span>Google / Gmail</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderSwitch('custom')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
                    provider === 'custom'
                      ? 'bg-cyan/20 border-cyan text-cyan'
                      : 'bg-white/5 border-border text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  <span>Hostinger / Custom SMTP</span>
                </button>
              </div>
            </div>

            {/* Active Provider Indicator Alert */}
            {smtpData?.provider && smtpData.provider !== provider && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs leading-normal">
                <strong>Notice:</strong> Your currently active mail sender is configured with{' '}
                <strong className="underline decoration-wavy">
                  {smtpData.provider === 'gmail' ? 'Google / Gmail' : 'Hostinger / Custom SMTP'}
                </strong>
                . Fill in the details below and click <strong>Save settings</strong> to switch to this provider.
              </div>
            )}

            <form onSubmit={handleSaveSMTP} className="space-y-4">
              {/* Form fields based on selected provider */}
              {provider === 'gmail' ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span>SMTP Server: <strong className="text-foreground font-semibold">smtp.gmail.com</strong></span>
                    <span>Port: <strong className="text-foreground font-semibold">587 (TLS)</strong></span>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-xs font-medium">Gmail Address</span>
                    <input
                      type="email"
                      value={smtpAddress}
                      onChange={(e) => setSmtpAddress(e.target.value)}
                      placeholder="username@gmail.com"
                      className="input text-xs"
                      required
                    />
                  </label>

                  <label className="block space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium">Gmail App Password</span>
                      <span className="text-muted-foreground font-mono text-[10px]">16 characters</span>
                    </div>
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
                      className="input font-mono text-xs"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                      App Password generation: Go to Google Account Settings → Security → 2-Step Verification → App Passwords.
                    </p>
                  </label>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="block space-y-1.5 sm:col-span-2">
                      <span className="text-xs font-medium">SMTP Server Host</span>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="e.g. mail.fastnexa.com"
                        className="input text-xs"
                        required
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium">Port</span>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => {
                          const p = parseInt(e.target.value, 10);
                          setSmtpPort(e.target.value);
                          if (p === 465) setUseSsl(true);
                        }}
                        placeholder="465 or 587"
                        className="input text-xs font-mono"
                        required
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="use_ssl"
                      checked={useSsl}
                      onChange={(e) => setUseSsl(e.target.checked)}
                      className="rounded border-border bg-white/5 text-cyan focus:ring-cyan cursor-pointer"
                    />
                    <label htmlFor="use_ssl" className="text-xs font-medium text-muted-foreground cursor-pointer">
                      Use SSL Encryption (recommended for Port 465)
                    </label>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-xs font-medium">Email / Username</span>
                    <input
                      type="email"
                      value={smtpAddress}
                      onChange={(e) => setSmtpAddress(e.target.value)}
                      placeholder="awaisamjad@fastnexa.com"
                      className="input text-xs"
                      required
                    />
                  </label>

                  <label className="block space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium">Mailbox Password</span>
                      <span className="text-muted-foreground font-mono text-[10px]">Hostinger Password</span>
                    </div>
                    <input
                      type="password"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      onClick={() => {
                        if (smtpPassword === '••••••••••••') {
                          setSmtpPassword('');
                        }
                      }}
                      placeholder="Your email password"
                      className="input font-mono text-xs"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                      Use the email account password set in your Hostinger / cPanel email control panel.
                    </p>
                  </label>
                </div>
              )}

              {smtpError && (
                <div className="alert-error flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{smtpError}</p>
                </div>
              )}
              {smtpSuccess && (
                <div className="alert-success flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{smtpSuccess}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={smtpLoading || testingConnection}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold text-sm cursor-pointer transition flex-1"
                >
                  {smtpLoading ? <Loader2 className="size-4 animate-spin mx-auto" /> : 'Save settings'}
                </button>
                
                {smtpData?.has_password && smtpData?.provider === provider && (
                  <>
                    <button
                      type="button"
                      onClick={handleTestSMTP}
                      disabled={testingConnection || smtpLoading}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-sm flex items-center justify-center gap-2 cursor-pointer transition flex-1"
                    >
                      {testingConnection ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                      <span>Test connection</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleDeleteSMTP}
                      disabled={smtpLoading}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-border text-rose-500 hover:border-rose-500/25 transition cursor-pointer"
                      title="Delete Credentials"
                    >
                      <Trash2 className="size-4.5" />
                    </button>
                  </>
                )}
              </div>
            </form>

            {/* Stats section */}
            {smtpData && (
              <div className="border-t border-border pt-4 space-y-3 font-mono text-xs">
                <h4 className="text-[10px] tracking-wider uppercase font-semibold text-muted-foreground">Daily Throttle & Telemetry Limits</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border bg-white/[0.01] p-3">
                    <p className="text-muted-foreground text-[10px]">DISPATCHED TODAY</p>
                    <div className="flex justify-between items-baseline mt-1.5">
                      <span className="text-base font-bold text-foreground">{smtpData.emails_sent_today}</span>
                      <span className="text-muted-foreground text-[10px]">/ 500 max</span>
                    </div>
                  </div>
                  
                  <div className="rounded-2xl border border-border bg-white/[0.01] p-3">
                    <p className="text-muted-foreground text-[10px]">TOTAL MONTHLY VOLUME</p>
                    <p className="text-base font-bold text-foreground mt-1.5">{smtpData.emails_sent_this_month}</p>
                  </div>
                </div>
                
                {smtpData.last_email_sent_at && (
                  <p className="text-[10px] text-muted-foreground/60">
                    Last sent event: {new Date(smtpData.last_email_sent_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
