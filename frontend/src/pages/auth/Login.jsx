import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, staffLogin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('owner'); // 'owner' | 'staff'
  const [form, setForm] = useState({ email: '', password: '', tenantId: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tenantChoices, setTenantChoices] = useState(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resendSent, setResendSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTenantChoices(null);
    setUnverifiedEmail(null);
    try {
      if (mode === 'staff') {
        await staffLogin({ email: form.email, password: form.password, tenantId: form.tenantId || undefined });
      } else {
        await login({ email: form.email, password: form.password });
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.data?.tenants) {
        setTenantChoices(err.response.data.data.tenants);
      } else if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED' || err.response?.status === 403 && err.response?.data?.message?.includes('verify your email')) {
        setUnverifiedEmail(form.email);
      } else {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const chooseTenant = async (tenantId) => {
    setForm((f) => ({ ...f, tenantId }));
    setTenantChoices(null);
    setLoading(true);
    try {
      await staffLogin({ email: form.email, password: form.password, tenantId });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setErrors({});
    setTenantChoices(null);
    setUnverifiedEmail(null);
    setResendSent(false);
    setForm({ email: '', password: '', tenantId: '' });
  };

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/logo.png" alt="Syllabrix" style={{ height: 52, marginBottom: 12, objectFit: 'contain' }} />
          <p style={{ color: '#6B7280', marginTop: 4, fontSize: 14 }}>Sign in to your business</p>
        </div>

        <div className="auth-card">
          {/* Mode tabs */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {['owner', 'staff'].map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 14, transition: 'all 0.15s',
                  background: mode === m ? '#fff' : 'transparent',
                  color: mode === m ? 'var(--navy)' : '#6B7280',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {m === 'owner' ? 'Owner / Admin' : 'Staff Login'}
              </button>
            ))}
          </div>

          {/* Email not verified */}
          {unverifiedEmail && !tenantChoices && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>Email not verified</p>
              <p style={{ fontSize: 13, color: '#78350F', marginBottom: 12, lineHeight: 1.5 }}>
                Please check your inbox at <strong>{unverifiedEmail}</strong> and click the verification link before logging in.
              </p>
              {resendSent ? (
                <p style={{ fontSize: 13, color: '#15803D', fontWeight: 600 }}>✓ New link sent — check your inbox</p>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
                      await import('axios').then(m => m.default.post(`${base}/auth/resend-verification`, { email: unverifiedEmail }));
                      setResendSent(true);
                    } catch { toast.error('Could not resend — try again'); }
                  }}
                  style={{ fontSize: 13, fontWeight: 600, color: '#B45309', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Resend verification email
                </button>
              )}
            </div>
          )}

          {/* Multi-tenant picker */}
          {tenantChoices ? (
            <div>
              <p style={{ fontSize: 14, color: '#374151', marginBottom: 16, fontWeight: 600 }}>
                Your email is linked to multiple businesses. Choose one to sign in:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tenantChoices.map((t) => (
                  <button
                    key={t.tenantId}
                    onClick={() => chooseTenant(t.tenantId)}
                    disabled={loading}
                    style={{
                      padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB',
                      background: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: 14,
                      fontWeight: 600, color: 'var(--navy)', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cyan)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                  >
                    {t.name || t.tenantId}
                  </button>
                ))}
              </div>
              <button onClick={() => setTenantChoices(null)} style={{ marginTop: 14, fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Back
              </button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Input
                label="Email address"
                type="email"
                placeholder="you@yourbusiness.com"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                autoComplete="email"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                    autoComplete="current-password"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '9px 40px 9px 12px',
                      border: `1.5px solid ${errors.password ? 'var(--vermilion)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)', fontSize: 14, outline: 'none',
                      fontFamily: 'var(--font-body)', color: 'var(--ink)', background: '#fff',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                      color: '#9CA3AF', display: 'flex', alignItems: 'center',
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span style={{ fontSize: 12, color: 'var(--vermilion)' }}>{errors.password}</span>}
              </div>
              <div style={{ textAlign: 'right', marginTop: -8 }}>
                <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 500 }}>Forgot password?</Link>
              </div>
              <Button type="submit" fullWidth loading={loading} size="lg">Sign in</Button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6B7280' }}>
          New business?{' '}
          <Link to="/register" style={{ color: 'var(--cyan)', fontWeight: 600 }}>Create account</Link>
        </p>
      </div>
    </div>
  );
}
