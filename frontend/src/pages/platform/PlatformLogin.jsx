import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformAuth } from '../../context/PlatformAuthContext';
import toast from 'react-hot-toast';

export default function PlatformLogin() {
  const { login } = usePlatformAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = 'Nerve Center — Syllabrix'; }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/platform/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0F1923',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 16 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-block',
            background: '#fff',
            borderRadius: 14,
            padding: '10px 24px',
            marginBottom: 14,
            boxShadow: '0 4px 24px rgba(31,184,214,0.18)',
          }}>
            <img
              src="/logo.png"
              alt="Syllabrix"
              style={{ height: 44, objectFit: 'contain', display: 'block' }}
            />
          </div>
          <p style={{ color: '#64748B', fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Nerve Center
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#192533', borderRadius: 16, padding: 32,
          border: '1px solid #1E2D3D',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
            color: '#F1F5F9', marginBottom: 6,
          }}>
            Welcome to Syllabrix Nerve Center
          </h1>
          <p style={{ color: '#64748B', fontSize: 14, marginBottom: 28 }}>
            Syllabrix staff access only
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@syllabrix.com"
                required
                style={{
                  width: '100%', padding: '10px 14px',
                  background: '#0F1923', border: '1px solid #1E2D3D',
                  borderRadius: 8, color: '#F1F5F9', fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '10px 14px',
                  background: '#0F1923', border: '1px solid #1E2D3D',
                  borderRadius: 8, color: '#F1F5F9', fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? '#1a3a4a' : 'linear-gradient(135deg, #1FB8D6 0%, #27DCFF 100%)',
                border: 'none', borderRadius: 8,
                color: loading ? '#64748B' : '#0F1923',
                fontWeight: 700, fontSize: 15,
                fontFamily: 'var(--font-body)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: '#334155', fontSize: 12 }}>
          Default: admin@syllabrix.com / SyllabrixAdmin@2025
        </p>
      </div>
    </div>
  );
}
