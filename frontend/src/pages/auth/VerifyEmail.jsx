import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');

  const [status, setStatus] = useState('loading'); // loading | success | error | notoken

  useEffect(() => {
    if (!token) { setStatus('notoken'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  const card = (icon, iconBg, title, body, action) => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: 40 }}>
          <div style={{ width: 64, height: 64, background: iconBg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
            {icon}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>{title}</h2>
          <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>{body}</p>
          {action}
        </div>
      </div>
    </div>
  );

  if (status === 'loading') return card(
    '⏳', 'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
    'Verifying your email…',
    'Please wait a moment.',
    null
  );

  if (status === 'success') return card(
    '✅', 'linear-gradient(135deg,#DCFCE7,#BBF7D0)',
    'Email verified!',
    'Your account is now active. You can log in and start using Syllabrix.',
    <Link to="/login" style={{
      display: 'inline-block', padding: '12px 32px',
      background: 'var(--navy)', color: '#fff',
      borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 15, textDecoration: 'none',
    }}>
      Go to Login
    </Link>
  );

  if (status === 'error') return card(
    '❌', 'linear-gradient(135deg,#FEF2F2,#FECACA)',
    'Link expired or already used',
    'This verification link is invalid or was already used. Request a new one from the login page.',
    <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
      Back to Login
    </Link>
  );

  return card(
    '✉️', 'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
    'No token found',
    'This link appears to be incomplete. Please use the full link from your email.',
    <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
      Back to Login
    </Link>
  );
}
