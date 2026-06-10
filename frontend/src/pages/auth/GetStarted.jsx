import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
];

function PasswordInput({ label, placeholder, value, onChange, error, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 40px 10px 12px', border: `1.5px solid ${error ? '#EF4444' : '#E5E7EB'}`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: '#111827', background: '#fff' }}
        />
        <button type="button" onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}
          tabIndex={-1}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <span style={{ fontSize: 12, color: '#EF4444' }}>{error}</span>}
    </div>
  );
}

function Field({ label, type = 'text', placeholder, value, onChange, error, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}{required && <span style={{ color: '#EF4444' }}> *</span>}</label>}
      {children || (
        <input type={type} placeholder={placeholder} value={value} onChange={onChange}
          style={{ padding: '10px 12px', border: `1.5px solid ${error ? '#EF4444' : '#E5E7EB'}`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box' }} />
      )}
      {error && <span style={{ fontSize: 12, color: '#EF4444' }}>{error}</span>}
    </div>
  );
}

export default function GetStarted() {
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (import.meta.env.VITE_ENV !== 'production') navigate('/login', { replace: true });
  }, []);

  const [plans, setPlans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    businessName: '', businessType: '',
    gstin: '', pan: '', address: '', city: '', state: '', pincode: '',
  });

  useEffect(() => {
    axios.get(`${BASE}/auth/plans`).then(({ data }) => {
      const list = data.data ?? data;
      if (Array.isArray(list) && list.length) {
        setPlans(list);
        setSelectedPlan(list[0].key);
      }
    }).catch(() => {});

    axios.get(`${BASE}/auth/business-types`).then(({ data }) => {
      const remote = data.data ?? data;
      if (Array.isArray(remote) && remote.length) setCategories(remote.map(cat => ({
        label: cat.name,
        types: (cat.businessTypes || []).map(bt => ({ value: bt.enumKey, label: bt.name })),
      })));
    }).catch(() => {});
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email) e.email = 'Required';
    if (form.password.length < 8) e.password = 'Min 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must contain uppercase letter';
    else if (!/[a-z]/.test(form.password)) e.password = 'Must contain lowercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must contain a number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.phone || form.phone.length < 10) e.phone = 'Valid phone required';
    if (!form.businessName.trim()) e.businessName = 'Required';
    if (!form.businessType) e.businessType = 'Select business type';
    if (!selectedPlan) e.plan = 'Select a plan';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async e => {
    e.preventDefault();
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setLoading(true);
    try {
      await register({ ...form, planKey: selectedPlan });
      setSubmitted(true);
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
    } finally { setLoading(false); }
  };

  if (submitted) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 48 }}>
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#DCFCE7,#BBF7D0)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32 }}>✉️</div>
          <h2 style={{ fontFamily: 'var(--font-display,sans-serif)', fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Application Submitted!</h2>
          <p style={{ color: '#6B7280', fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
            We've received your business registration and KYC details. Our team will review and activate your account.
          </p>
          <p style={{ color: '#0F172A', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{form.email}</p>
          <p style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.6, marginBottom: 32 }}>
            Check your inbox for an email verification link. Once KYC is approved, you'll receive your account credentials.
          </p>
          <Link to="/login" style={{ display: 'inline-block', padding: '12px 32px', background: '#1FB8D6', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '40px 16px 80px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/logo.png" alt="Syllabrix" style={{ height: 48, marginBottom: 16, objectFit: 'contain' }} />
          <h1 style={{ fontFamily: 'var(--font-display,sans-serif)', fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Create Your Business Account
          </h1>
          <p style={{ color: '#6B7280', fontSize: 15 }}>Select a plan and fill in your details. Our team will review and activate your account.</p>
        </div>

        {/* Plans */}
        {plans.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>Choose Your Plan</h2>
              <div style={{ display: 'flex', background: '#E5E7EB', borderRadius: 8, padding: 3, gap: 2 }}>
                {['monthly', 'yearly'].map(c => (
                  <button key={c} type="button" onClick={() => setBillingCycle(c)}
                    style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: billingCycle === c ? '#fff' : 'transparent', color: billingCycle === c ? '#0F172A' : '#6B7280', boxShadow: billingCycle === c ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                    {c === 'monthly' ? 'Monthly' : 'Yearly (Save 17%)'}
                  </button>
                ))}
              </div>
            </div>
            {errors.plan && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{errors.plan}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${plans.length}, 1fr)`, gap: 16 }}>
              {plans.map(plan => {
                const price = billingCycle === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice / 12 : plan.monthlyPrice;
                const isSelected = selectedPlan === plan.key;
                return (
                  <div key={plan.key} onClick={() => setSelectedPlan(plan.key)}
                    style={{ background: '#fff', border: `2px solid ${isSelected ? (plan.color || '#1FB8D6') : '#E5E7EB'}`, borderRadius: 14, padding: '20px 18px', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', boxShadow: isSelected ? `0 4px 20px ${plan.color || '#1FB8D6'}33` : '0 1px 4px rgba(0,0,0,0.06)' }}>
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: plan.color || '#1FB8D6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={13} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: plan.color || '#1FB8D6' }} />
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{plan.name}</span>
                    </div>
                    {plan.tagline && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>{plan.tagline}</p>}
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: plan.color || '#1FB8D6' }}>₹{Math.round(price).toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: 13, color: '#9CA3AF' }}>/mo</span>
                      {billingCycle === 'yearly' && plan.yearlyPrice && (
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>₹{plan.yearlyPrice.toLocaleString('en-IN')}/yr</div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      {plan.maxUsers ? `Up to ${plan.maxUsers} users` : 'Unlimited users'} · {plan.maxBranches ? `${plan.maxBranches} branch${plan.maxBranches > 1 ? 'es' : ''}` : 'Unlimited branches'}
                      {plan.trialDays > 0 && ` · ${plan.trialDays}-day trial`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: 32, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #F3F4F6' }}>Business Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Business name" placeholder="Adarsh Kirana Store" value={form.businessName} onChange={set('businessName')} error={errors.businessName} required />
                <Field label="Business type" error={errors.businessType} required>
                  <select value={form.businessType} onChange={set('businessType')}
                    style={{ padding: '10px 12px', border: `1.5px solid ${errors.businessType ? '#EF4444' : '#E5E7EB'}`, borderRadius: 8, fontSize: 14, background: '#fff', color: form.businessType ? '#111827' : '#9CA3AF', width: '100%', boxSizing: 'border-box' }}>
                    <option value="">Select business type</option>
                    {categories.map(cat => (
                      <optgroup key={cat.label} label={cat.label}>
                        {cat.types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="GSTIN" placeholder="22AAAAA0000A1Z5" value={form.gstin} onChange={set('gstin')} />
                <Field label="PAN" placeholder="ABCDE1234F" value={form.pan} onChange={set('pan')} />
              </div>
              <Field label="Business address" placeholder="Shop No. 12, MG Road" value={form.address} onChange={set('address')} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <Field label="City" placeholder="Bhopal" value={form.city} onChange={set('city')} />
                <Field label="State" error={errors.state}>
                  <select value={form.state} onChange={set('state')}
                    style={{ padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, background: '#fff', color: form.state ? '#111827' : '#9CA3AF', width: '100%', boxSizing: 'border-box' }}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Pincode" placeholder="462001" value={form.pincode} onChange={set('pincode')} />
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: 32, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #F3F4F6' }}>Owner Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Your name" placeholder="Adarsh Singh" value={form.name} onChange={set('name')} error={errors.name} required />
                <Field label="Phone" type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} error={errors.phone} required />
              </div>
              <Field label="Email address" type="email" placeholder="you@business.com" value={form.email} onChange={set('email')} error={errors.email} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <PasswordInput label="Password *" placeholder="Min 8 chars, A–Z, a–z, 0–9" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
                <PasswordInput label="Confirm password *" placeholder="Re-enter your password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" />
              </div>
              {!errors.password && <span style={{ fontSize: 11, color: '#9CA3AF', marginTop: -8 }}>Must include uppercase, lowercase and a number</span>}
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? '#9CA3AF' : '#1FB8D6', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#9CA3AF' }}>
            By submitting, you agree to Syllabrix Terms of Service. Your details will be verified by our team before account activation.
          </p>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6B7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1FB8D6', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
