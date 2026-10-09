import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/lmsServices';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { platformSettings } = useTheme();

  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Forgot / Reset password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate(redirectUrl);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessNotice(null);
    try {
      const res = await authService.forgotPassword(forgotEmail);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setSuccessNotice('Security verification code generated. Please set your new password below.');
        setMode('reset');
      } else {
        setSuccessNotice('If that email exists, reset instructions have been dispatched.');
      }
    } catch (err) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(resetToken, newPassword);
      setSuccessNotice('Password updated successfully! You can now sign in.');
      setEmail(forgotEmail);
      setPassword('');
      setMode('login');
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoStudent = () => {
    setEmail('student@vaibhavdhuslms.com');
    setPassword('Student@12345');
  };

  const fillDemoAdmin = () => {
    setEmail('admin@vaibhavdhuslms.com');
    setPassword('Admin@12345');
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 12rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(2rem, 5vw, 3rem) 1rem'
    }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 3vw, 2rem)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            {mode === 'login' ? <BookOpen size={22} color="#ffffff" /> : <KeyRound size={22} color="#ffffff" />}
          </div>

          <h2 style={{ fontSize: '1.65rem', marginBottom: '0.35rem' }}>
            {mode === 'login' && 'Welcome Back'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'reset' && 'Create New Password'}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            {mode === 'login' && 'Sign in to access your protected courses'}
            {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
            {mode === 'reset' && 'Enter your security token and new password'}
          </p>
        </div>

        {/* Demo Fill Helper Buttons (only in login mode) */}
        {mode === 'login' && (
          <div style={{
            background: 'var(--color-bg-elevated)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            border: '1px solid var(--color-border-subtle)'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>
              QUICK DEMO CREDENTIALS:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={fillDemoStudent}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }}
              >
                Fill Student
              </button>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }}
              >
                Fill Admin
              </button>
            </div>
          </div>
        )}

        {successNotice && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid var(--color-success)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-success)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{successNotice}</span>
          </div>
        )}

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        {/* Mode 1: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessNotice(null);
                    setForgotEmail(email);
                    setMode('forgot');
                  }}
                  style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem' }}
            >
              {loading ? <Loader2 size={18} className="pulse-active" /> : 'Sign In to Account'}
            </button>
          </form>
        )}

        {/* Mode 2: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit}>
            <div className="form-group">
              <label className="form-label">Account Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="registered@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem' }}
            >
              {loading ? <Loader2 size={18} className="pulse-active" /> : 'Send Reset Instructions'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.65rem', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </button>
          </form>
        )}

        {/* Mode 3: RESET PASSWORD */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit}>
            <div className="form-group">
              <label className="form-label">Reset Verification Token</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Paste token or code"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password (min 6 characters)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="form-input"
                  style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(p => !p)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem' }}
            >
              {loading ? <Loader2 size={18} className="pulse-active" /> : 'Confirm New Password'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.65rem', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </button>
          </form>
        )}

        <div style={{
          textAlign: 'center',
          marginTop: '1.75rem',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)'
        }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
