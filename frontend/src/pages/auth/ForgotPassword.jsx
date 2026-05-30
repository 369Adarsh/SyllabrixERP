import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data?.data?.devResetLink) setDevLink(res.data.data.devResetLink);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/logo.png" alt="Syllabrix" style={{ height: 52, marginBottom: 12, objectFit: 'contain' }} />
        </div>

        <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: 36 }}>

          {sent ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={28} color="var(--emerald)" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: '0 0 10px' }}>
                Check your inbox
              </h2>
              <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6, margin: '0 0 6px' }}>
                If <strong>{email}</strong> is registered, we've sent a password reset link.
              </p>
              <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
                The link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
              {devLink && (
                <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '12px 14px', marginBottom: 16, textAlign: 'left' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#92400E' }}>DEV MODE — Email not configured. Use this link:</p>
                  <a href={devLink} style={{ fontSize: 12, color: '#1D4ED8', wordBreak: 'break-all' }}>{devLink}</a>
                </div>
              )}
              <Button
                fullWidth
                onClick={() => { setSent(false); setEmail(''); }}
                style={{ marginBottom: 12 }}
              >
                Send again
              </Button>
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, color: 'var(--cyan)', fontWeight: 600, textDecoration: 'none' }}>
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div style={{ marginBottom: 28 }}>
                <div style={{ width: 44, height: 44, background: '#EFF6FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Mail size={20} color="var(--navy)" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
                  Forgot your password?
                </h2>
                <p style={{ color: '#6B7280', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                  Enter your registered email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@yourbusiness.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  error={error}
                  autoComplete="email"
                  autoFocus
                />
                <Button type="submit" fullWidth loading={loading} size="lg">
                  Send reset link
                </Button>
              </form>

              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>
                  <ArrowLeft size={14} /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
