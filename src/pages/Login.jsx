import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, User, AlertCircle, Sun, Moon, CheckCircle2 } from 'lucide-react';
import * as api from '../utils/api';

export default function Login({ onBackToHome }) {
  const { isDark, toggle } = useTheme();
  const { login, register, verifyEmail } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset' | 'verify_email'
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResendOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const reason = mode === 'verify_email' ? 'verification' : 'reset';
      await api.resendOTPUser(email, reason);
      setSuccess('A new 6-digit OTP code has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

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
        setSuccess('Registration successful! Please check your email for the 6-digit verification code.');
        setMode('verify_email');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
      } else if (mode === 'verify_email') {
        if (!otp) throw new Error('Please enter the 6-digit OTP code.');
        await verifyEmail(email, otp);
        setSuccess('Email verified successfully!');
      } else if (mode === 'forgot') {
        await api.forgotPassword(email);
        setSuccess('A 6-digit password reset OTP has been sent to your email. Check your email/logs.');
        setMode('reset');
        setOtp('');
      } else if (mode === 'reset') {
        if (!otp) throw new Error('Please enter the 6-digit OTP code.');
        await api.resetPassword(email, otp, password);
        setSuccess('Password reset successful! Please log in.');
        setMode('login');
        setPassword('');
        setOtp('');
      }
    } catch (err) {
      if (err.response?.data?.email_unverified) {
        setError('Your email is not verified yet. Please enter the OTP sent to your email.');
        setMode('verify_email');
        setEmail(err.response.data.email || email);
        setPassword('');
        setOtp('');
      } else {
        setError(err.response?.data?.error || err.response?.data?.detail || err.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-background text-foreground">
      {/* Background Accent Orbs */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-lime/10 opacity-30 blur-[120px] pointer-events-none animate-pulse translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-cyan/10 opacity-25 blur-[150px] pointer-events-none -translate-x-1/4 translate-y-1/4" />

      {/* Navigation Options */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-white/5 border border-border hover:bg-white/10 transition duration-300 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ← Home
          </button>
        )}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="p-2 rounded-xl bg-white/5 border border-border hover:bg-white/10 transition cursor-pointer text-muted-foreground hover:text-foreground"
        >
          {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-indigo-400" />}
        </button>
      </div>

      {/* Main viewport */}
      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="rounded-3xl glass border border-border p-8 max-w-md w-full shadow-2xl space-y-6 animate-slide-up">
          {/* Logo & Headline */}
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime to-cyan flex items-center justify-center mx-auto shadow-lg shadow-lime/20">
              <Mail className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold tracking-tight text-foreground">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'Set New Password'}
              {mode === 'verify_email' && 'Verify Your Email'}
            </h2>
            <p className="text-muted-foreground text-xs font-medium">
              {mode === 'login' && 'Sign in to access your Pulsemail email center'}
              {mode === 'register' && 'Register for MailFlow email infrastructure'}
              {mode === 'forgot' && 'Enter email to receive reset credentials'}
              {mode === 'reset' && 'Enter reset OTP and set your new password'}
              {mode === 'verify_email' && 'Enter the 6-digit OTP code sent to your email'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Full Name</span>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="input pl-10"
                    required
                  />
                </div>
              </label>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot' || mode === 'verify_email' || mode === 'reset') && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Email Address</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="input pl-10"
                    required
                    disabled={mode === 'verify_email' || mode === 'reset'}
                  />
                </div>
              </label>
            )}

            {(mode === 'verify_email' || mode === 'reset') && (
              <div className="space-y-1.5">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">6-Digit Verification OTP</span>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="input font-mono text-center tracking-[0.5em] text-lg font-bold"
                    required
                    maxLength={6}
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-xs font-bold text-cyan hover:text-lime transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-transparent border-none p-0"
                  >
                    Resend OTP Code
                  </button>
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset') && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">{mode === 'reset' ? 'New Password' : 'Password'}</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10"
                    required
                    minLength={8}
                  />
                </div>
              </label>
            )}

            {mode === 'register' && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Confirm Password</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10"
                    required
                    minLength={8}
                  />
                </div>
              </label>
            )}

            {error && (
              <div className="alert-error flex items-start gap-2 text-xs">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {success && (
              <div className="alert-success flex items-start gap-2 text-xs">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <p className="font-semibold">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-lime to-cyan text-primary-foreground font-semibold text-sm cursor-pointer justify-center flex items-center hover:shadow-lg hover:shadow-lime/25 transition mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Sign in to Console'}
                  {mode === 'register' && 'Register Account'}
                  {mode === 'forgot' && 'Send Reset OTP'}
                  {mode === 'reset' && 'Reset Password'}
                  {mode === 'verify_email' && 'Verify OTP & Log In'}
                </>
              )}
            </button>
          </form>

          {/* Mode Switch triggers */}
          <div className="flex flex-col gap-2 pt-2 text-center text-xs">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => { setMode('register'); setError(''); setSuccess(''); setPassword(''); }}
                  className="font-bold text-muted-foreground hover:text-cyan cursor-pointer bg-transparent border-none"
                >
                  Don't have an account? Sign Up
                </button>
                <button
                  onClick={() => { setMode('forgot'); setError(''); setSuccess(''); setPassword(''); }}
                  className="font-semibold text-muted-foreground/60 hover:text-cyan cursor-pointer bg-transparent border-none mt-1"
                >
                  Forgot password?
                </button>
              </>
            )}

            {mode === 'register' && (
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); setPassword(''); }}
                className="font-bold text-muted-foreground hover:text-cyan cursor-pointer bg-transparent border-none"
              >
                Already have an account? Sign In
              </button>
            )}

            {(mode === 'forgot' || mode === 'reset' || mode === 'verify_email') && (
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); setPassword(''); setOtp(''); }}
                className="font-bold text-muted-foreground hover:text-cyan cursor-pointer bg-transparent border-none"
              >
                ← Back to Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-[10px] text-muted-foreground/50 font-mono">
        MailFlow v3.0 · Secure Email Infrastructure
      </footer>
    </div>
  );
}
