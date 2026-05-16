import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { KeyRound, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Redirect to login after success
  useEffect(() => {
    if (done) {
      const t = setTimeout(() => navigate('/login'), 3000);
      return () => clearTimeout(t);
    }
  }, [done, navigate]);

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: 36, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertCircle size={28} color="var(--vermilion)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: '0 0 10px' }}>Invalid link</h2>
            <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
              This password reset link is missing or invalid. Request a new one below.
            </p>
            <Link to="/forgot-password">
              <Button fullWidth>Request new link</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setDone(true);
      toast.success('Password updated! Redirecting to login...');
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed';
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setErrors({ form: 'This reset link has expired or already been used. Please request a new one.' });
      } else {
        toast.error(msg);
      }
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

          {done ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={28} color="var(--emerald)" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: '0 0 10px' }}>
                Password updated!
              </h2>
              <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 6px', lineHeight: 1.6 }}>
                Your password has been changed successfully.
              </p>
              <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 28px' }}>
                Redirecting to sign in...
              </p>
              <Link to="/login">
                <Button fullWidth>Go to sign in</Button>
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div style={{ marginBottom: 28 }}>
                <div style={{ width: 44, height: 44, background: '#EFF6FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <KeyRound size={20} color="var(--navy)" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
                  Set new password
                </h2>
                <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
                  Choose a strong password for your account.
                </p>
              </div>

              {errors.form && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, marginBottom: 18 }}>
                  <AlertCircle size={16} color="var(--vermilion)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--vermilion)', fontWeight: 600 }}>Link expired</p>
                    <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6B7280' }}>{errors.form}</p>
                    <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 600 }}>Request a new link →</Link>
                  </div>
                </div>
              )}

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Input
                  label="New password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
                  autoFocus
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  error={errors.confirm}
                />

                {/* Strength indicator */}
                {form.password.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[...Array(4)].map((_, i) => {
                        const score = Math.min(Math.floor(form.password.length / 3), 4);
                        const colors = ['#FCA5A5', '#FDBA74', '#86EFAC', '#4ADE80'];
                        return (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score - 1] : '#E5E7EB', transition: 'background 0.2s' }} />
                        );
                      })}
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
                      {form.password.length < 8 ? 'Too short' : form.password.length < 12 ? 'Good' : form.password.length < 16 ? 'Strong' : 'Very strong'}
                    </p>
                  </div>
                )}

                <Button type="submit" fullWidth loading={loading} size="lg">
                  Update password
                </Button>
              </form>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
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
