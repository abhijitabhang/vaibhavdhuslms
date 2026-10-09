import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn } from 'lucide-react';

export default function SessionRevokedModal() {
  const { revokedNotice, dismissRevokedNotice } = useAuth();
  const navigate = useNavigate();

  if (!revokedNotice) return null;

  const handleReLogin = () => {
    dismissRevokedNotice();
    navigate('/login');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      zIndex: 9999
    }}>
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-danger)',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '480px',
        width: '100%',
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <ShieldAlert size={30} />
        </div>

        <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Session Terminated
        </h3>

        <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          {revokedNotice}
        </p>

        <div style={{
          background: 'var(--color-bg-base)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.825rem',
          color: 'var(--color-text-muted)',
          textAlign: 'left',
          marginBottom: '1.75rem',
          border: '1px solid var(--color-border-subtle)'
        }}>
          🛡️ <strong>Anti-Account Sharing Protection:</strong> To protect premium course content, our security engine strictly enforces concurrent device limits. Only one device can actively stream lectures at a time.
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={handleReLogin}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            <LogIn size={18} />
            Log In on this Device
          </button>
        </div>
      </div>
    </div>
  );
}
