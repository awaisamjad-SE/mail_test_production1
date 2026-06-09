import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, User, AlertCircle, Sun, Moon, CheckCircle } from 'lucide-react';
import * as api from '../utils/api';

export default function Login({ onBackToHome }) {
  const { isDark, toggle } = useTheme();
  const { login, register } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        await register(email, fullName, password, confirmPassword);
        setSuccess('Registration successful! You can now log in.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } else if (mode === 'forgot') {
        await api.forgotPassword(email);
        setSuccess('Reset token sent! Check the console/database logs for the token.');
        setMode('reset');
      } else if (mode === 'reset') {
        await api.resetPassword(token, password);
        setSuccess('Password reset successful! Please log in.');
        setMode('login');
        setPassword('');
        setToken('');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-bg flex flex-col justify-between relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[var(--accent-bg)] opacity-30 blur-[100px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-blue-500/10 opacity-20 blur-[120px] pointer-events-none" />

      {/* Floating Theme Button */}
      <div className="absolute top-6 right-6 z-55 flex items-center gap-2">
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="text-xs font-bold px-3 py-2 rounded-xl surface-2 border border-theme transition-all t2 hover:accent-text cursor-pointer"
          >
            ← Home
          </button>
        )}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="p-2.5 rounded-xl surface-2 hover:bg-[var(--surface-3)] border border-theme transition-colors cursor-pointer"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600" />
          )}
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="card-solid p-8 max-w-md w-full border border-theme shadow-2xl space-y-6 animate-slide-up">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-violet-600/20">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight t1">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'Enter New Password'}
            </h2>
            <p className="t3 text-sm">
              {mode === 'login' && 'Sign in to access your dashboard'}
              {mode === 'register' && 'Register for MailFlow SaaS platform'}
              {mode === 'forgot' && 'Enter your email to request a reset token'}
              {mode === 'reset' && 'Set your new secure password'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="field-label">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 t3">
                    <User className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div className="space-y-1">
                <label className="field-label">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 t3">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <div className="space-y-1">
                <label className="field-label">Reset Token</label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter token from email/console"
                  className="input-field"
                  required
                />
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset') && (
              <div className="space-y-1">
                <label className="field-label">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 t3">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-10"
                    required
                    minLength={8}
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-1">
                <label className="field-label">Confirm Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 t3">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-10"
                    required
                    minLength={8}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="alert-error flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold">{error}</p>
              </div>
            )}

            {success && (
              <div className="alert-success flex items-start gap-2 animate-fade-in">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
                <p className="text-xs font-semibold text-emerald-500">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 justify-center mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Login to Dashboard'}
                  {mode === 'register' && 'Register Account'}
                  {mode === 'forgot' && 'Send Reset Token'}
                  {mode === 'reset' && 'Reset Password'}
                </>
              )}
            </button>
          </form>

          {/* Mode Toggles */}
          <div className="flex flex-col gap-2 pt-2 text-center text-xs">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                  className="font-bold t3 hover:accent-text cursor-pointer bg-transparent border-none"
                >
                  Don't have an account? Sign Up
                </button>
                <button
                  onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  className="font-semibold t4 hover:accent-text cursor-pointer bg-transparent border-none mt-1"
                >
                  Forgot password?
                </button>
              </>
            )}

            {mode === 'register' && (
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="font-bold t3 hover:accent-text cursor-pointer bg-transparent border-none"
              >
                Already have an account? Sign In
              </button>
            )}

            {(mode === 'forgot' || mode === 'reset') && (
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="font-bold t3 hover:accent-text cursor-pointer bg-transparent border-none"
              >
                ← Back to Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-[10px] t4">
        MailFlow v3.0 • Secure Email Infrastructure
      </footer>
    </div>
  );
}
