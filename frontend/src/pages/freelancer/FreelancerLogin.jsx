import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const OR = '#F97316';
const DARK = '#0f0f0f';
const CARD = '#1a1a1a';
const BORDER = '#2d2d2d';
const TEXT = '#F3F4F6';
const MUTED = '#9CA3AF';

export default function FreelancerLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email: form.email.trim().toLowerCase(), password: form.password });
      navigate('/freelancer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 52, height: 52, background: OR, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Wrench size={26} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{ color: TEXT, fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display, sans-serif)' }}>
            Freelancer Login
          </h1>
          <p style={{ color: MUTED, fontSize: 14 }}>Sign in to manage your work</p>
        </div>

        {/* Card */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '32px 28px' }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                style={{
                  padding: '10px 12px', background: '#111', border: `1.5px solid ${errors.email ? '#EF4444' : BORDER}`,
                  borderRadius: 10, fontSize: 14, color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box',
                }}
              />
              {errors.email && <span style={{ fontSize: 12, color: '#EF4444' }}>{errors.email}</span>}
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                  style={{
                    padding: '10px 40px 10px 12px', background: '#111', border: `1.5px solid ${errors.password ? '#EF4444' : BORDER}`,
                    borderRadius: 10, fontSize: 14, color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', padding: 2 }}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span style={{ fontSize: 12, color: '#EF4444' }}>{errors.password}</span>}
            </div>

            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <Link to="/forgot-password" style={{ fontSize: 13, color: OR, fontWeight: 500 }}>Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px', background: OR, color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: MUTED }}>
          New freelancer?{' '}
          <Link to="/freelancer/register" style={{ color: OR, fontWeight: 600 }}>Create account</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: MUTED }}>
          <Link to="/login" style={{ color: MUTED }}>← Business login</Link>
        </p>
      </div>
    </div>
  );
}
