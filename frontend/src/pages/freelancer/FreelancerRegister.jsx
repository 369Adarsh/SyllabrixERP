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

const HOW_OPTIONS = [
  { value: 'solo', label: 'I work alone', desc: 'Independent professional' },
  { value: 'team', label: 'I have a small team', desc: 'With helpers or partners' },
];

export default function FreelancerRegister() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', workDescription: '', city: '', howYouWork: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Your name is required';
    if (!form.email) e.email = 'Email is required';
    if (form.password.length < 8) e.password = 'Minimum 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must have uppercase (A-Z)';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must have a number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.phone || form.phone.length < 10) e.phone = 'Valid phone required';
    if (!form.workDescription.trim()) e.workDescription = 'Tell us what you do';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        phone: form.phone,
        businessName: form.workDescription,
        businessType: 'FREELANCER',
        city: form.city,
        meta: { howYouWork: form.howYouWork, isFreelancer: true },
      });
      setDone(true);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        const fe = {};
        data.errors.forEach(({ field, message }) => { if (field) fe[field] = message; });
        if (Object.keys(fe).length) setErrors(fe);
        else toast.error(data.errors[0]?.message || 'Registration failed');
      } else {
        toast.error(data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ width: 64, height: 64, background: 'rgba(249,115,22,0.15)', border: '2px solid rgba(249,115,22,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✉️</div>
        <h2 style={{ color: TEXT, fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Check your inbox</h2>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>We sent a verification link to</p>
        <p style={{ color: OR, fontWeight: 700, fontSize: 15, marginBottom: 20 }}>{form.email}</p>
        <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
          Click the link to activate your account and start managing your work on Syllabrix.
        </p>
        <Link to="/freelancer/login" style={{ color: OR, fontWeight: 600, fontSize: 14 }}>Go to login →</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: OR, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Wrench size={26} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{ color: TEXT, fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display, sans-serif)' }}>
            Join as Freelancer
          </h1>
          <p style={{ color: MUTED, fontSize: 14 }}>Get your work organised in 2 minutes</p>
        </div>

        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '32px 28px' }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Name + Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Your name" error={errors.name}>
                <input type="text" placeholder="Ramesh Kumar" value={form.name} onChange={set('name')} autoComplete="name"
                  style={inp(errors.name)} />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} autoComplete="tel"
                  style={inp(errors.phone)} />
              </Field>
            </div>

            {/* Work description */}
            <Field label="What do you do?" error={errors.workDescription}>
              <input type="text" placeholder="e.g. Electrician, Plumber, Graphic Designer…" value={form.workDescription} onChange={set('workDescription')}
                style={inp(errors.workDescription)} />
            </Field>

            {/* How you work */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>How do you work?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {HOW_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, howYouWork: opt.value }))}
                    style={{
                      padding: '12px 14px', borderRadius: 10, border: `2px solid ${form.howYouWork === opt.value ? OR : BORDER}`,
                      background: form.howYouWork === opt.value ? 'rgba(249,115,22,0.1)' : '#111',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: form.howYouWork === opt.value ? OR : TEXT }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* City */}
            <Field label="City (optional)">
              <input type="text" placeholder="Mumbai" value={form.city} onChange={set('city')}
                style={inp()} />
            </Field>

            {/* Email */}
            <Field label="Email address" error={errors.email}>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email"
                style={inp(errors.email)} />
            </Field>

            {/* Password */}
            <Field label="Password" error={errors.password}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 chars, A-Z, 0-9"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                  style={{ ...inp(errors.password), paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {/* Confirm password */}
            <Field label="Confirm password" error={errors.confirmPassword}>
              <input type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password"
                style={inp(errors.confirmPassword)} />
            </Field>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px', background: OR, color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, marginTop: 4,
              }}
            >
              {loading ? 'Creating account…' : 'Create my account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: MUTED }}>
          Already have an account?{' '}
          <Link to="/freelancer/login" style={{ color: OR, fontWeight: 600 }}>Sign in</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: MUTED }}>
          <Link to="/register" style={{ color: MUTED }}>← Register a business instead</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: '#F3F4F6' }}>{label}</label>}
      {children}
      {error && <span style={{ fontSize: 12, color: '#EF4444' }}>{error}</span>}
    </div>
  );
}

function inp(err) {
  return {
    padding: '10px 12px', background: '#111', border: `1.5px solid ${err ? '#EF4444' : '#2d2d2d'}`,
    borderRadius: 10, fontSize: 14, color: '#F3F4F6', outline: 'none', width: '100%', boxSizing: 'border-box',
  };
}
