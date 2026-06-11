import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import axios from 'axios';

function PasswordInput({ label, placeholder, value, onChange, error, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '9px 40px 9px 12px',
            border: `1.5px solid ${error ? 'var(--vermilion)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)', fontSize: 14, outline: 'none',
            fontFamily: 'var(--font-body)', color: 'var(--ink)', background: '#fff',
          }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: '#9CA3AF', display: 'flex', alignItems: 'center',
          }}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <span style={{ fontSize: 12, color: 'var(--vermilion)' }}>{error}</span>}
    </div>
  );
}

const BUSINESS_CATEGORIES = [
  {
    label: 'Retail & Commerce',
    types: [
      { value: 'RETAIL',        label: 'Retail shop' },
      { value: 'KIRANA',        label: 'Kirana store' },
      { value: 'MEDICAL_STORE', label: 'Medical store / Pharmacy' },
      { value: 'STATIONARY',    label: 'Stationery shop' },
      { value: 'SWEET_SHOP',    label: 'Sweet shop / Mithai' },
      { value: 'BAKERY',        label: 'Bakery' },
      { value: 'JEWELLERY',     label: 'Jewellery store' },
      { value: 'HARDWARE',      label: 'Hardware store' },
      { value: 'ELECTRICAL',    label: 'Electrical store' },
      { value: 'CLOTHING',      label: 'Clothing / Garments' },
      { value: 'FOOTWEAR',      label: 'Footwear store' },
      { value: 'ELECTRONICS',   label: 'Electronics store' },
      { value: 'MOBILE_REPAIR', label: 'Mobile repair shop' },
      { value: 'OPTICAL',       label: 'Optical store' },
      { value: 'BOOKSTORE',     label: 'Book store' },
      { value: 'FLORIST',       label: 'Flower shop / Florist' },
    ],
  },
  {
    label: 'Food & Beverage',
    types: [
      { value: 'RESTAURANT',    label: 'Restaurant / Cafe' },
      { value: 'DHABA',         label: 'Dhaba' },
      { value: 'CLOUD_KITCHEN', label: 'Cloud kitchen' },
      { value: 'JUICE_BAR',     label: 'Juice bar / Beverages' },
      { value: 'CANTEEN_MESS',  label: 'Canteen / Mess' },
      { value: 'CATERING',      label: 'Catering service' },
    ],
  },
  {
    label: 'Beauty & Personal Care',
    types: [
      { value: 'SALON',          label: 'Salon' },
      { value: 'BEAUTY_PARLOUR', label: 'Beauty parlour' },
      { value: 'BARBERSHOP',     label: 'Barbershop' },
      { value: 'LAUNDRY',        label: 'Laundry service' },
      { value: 'TAILORING',      label: 'Tailoring / Boutique' },
    ],
  },
  {
    label: 'Healthcare',
    types: [
      { value: 'CLINIC',          label: 'Clinic / Doctor' },
      { value: 'DENTAL',          label: 'Dental clinic' },
      { value: 'DIAGNOSTIC_LAB',  label: 'Diagnostic lab' },
      { value: 'PHYSIOTHERAPY',   label: 'Physiotherapy' },
      { value: 'AYURVEDA',        label: 'Ayurveda clinic' },
      { value: 'HOSPITAL',        label: 'Hospital / Nursing home' },
      { value: 'VET_CLINIC',      label: 'Veterinary clinic' },
    ],
  },
  {
    label: 'Education & Training',
    types: [
      { value: 'COACHING',          label: 'Coaching institute' },
      { value: 'HOME_TUITION',      label: 'Home tuition' },
      { value: 'MUSIC_SCHOOL',      label: 'Music school' },
      { value: 'DANCE_ACADEMY',     label: 'Dance academy' },
      { value: 'DRIVING_SCHOOL',    label: 'Driving school' },
      { value: 'COMPUTER_TRAINING', label: 'Computer training' },
    ],
  },
  {
    label: 'Fitness & Sports',
    types: [
      { value: 'GYM',               label: 'Gym / Fitness centre' },
      { value: 'YOGA_STUDIO',       label: 'Yoga studio' },
      { value: 'MARTIAL_ARTS',      label: 'Martial arts academy' },
      { value: 'SPORTS_ACADEMY',    label: 'Sports academy / Coaching' },
      { value: 'SWIMMING_ACADEMY',  label: 'Swimming academy' },
      { value: 'CROSSFIT_STUDIO',   label: 'CrossFit / Functional fitness' },
      { value: 'SPA',               label: 'Spa & wellness' },
    ],
  },
  {
    label: 'Events & Functions',
    types: [
      { value: 'EVENT_PLANNER', label: 'Event planner' },
      { value: 'DECORATOR',     label: 'Decorator' },
      { value: 'TENT_HOUSE',    label: 'Tent house' },
      { value: 'PHOTOGRAPHY',   label: 'Photography studio' },
    ],
  },
  {
    label: 'Professional Services',
    types: [
      { value: 'CA_FIRM',          label: 'CA / Accountant firm' },
      { value: 'LAW_FIRM',         label: 'Law firm' },
      { value: 'DIGITAL_AGENCY',   label: 'Digital / Creative agency' },
      { value: 'REAL_ESTATE',      label: 'Real estate agency' },
      { value: 'INSURANCE_AGENCY', label: 'Insurance agency' },
      { value: 'TRAVEL_AGENCY',    label: 'Travel agency' },
      { value: 'PEST_CONTROL',     label: 'Pest control' },
      { value: 'INTERIOR_DESIGN',  label: 'Interior design' },
      { value: 'CONSTRUCTION',     label: 'Construction firm' },
    ],
  },
  {
    label: 'Transport & Logistics',
    types: [
      { value: 'CAB_SERVICE',     label: 'Cab / Auto service' },
      { value: 'TRANSPORT',       label: 'Transport / Lorry service' },
      { value: 'CAR_RENTAL',      label: 'Car rental' },
      { value: 'COURIER',         label: 'Courier service' },
      { value: 'PACKERS_MOVERS',  label: 'Packers & movers' },
    ],
  },
  {
    label: 'Property & Workspace',
    types: [
      { value: 'MALL',       label: 'Mall / Shopping complex' },
      { value: 'CO_WORKING', label: 'Co-working space' },
    ],
  },
  {
    label: 'Trade & Supply (B2B)',
    types: [
      { value: 'DEALER',    label: 'Dealer' },
      { value: 'SUPPLIER',  label: 'Supplier' },
      { value: 'WHOLESALE', label: 'Wholesale business' },
    ],
  },
  {
    label: 'Workshop & Repairs',
    types: [
      { value: 'WORKSHOP', label: 'Workshop / Service centre' },
    ],
  },
  {
    label: 'Other',
    types: [
      { value: 'OTHER', label: 'Other business' },
    ],
  },
];

const HOW_OPTIONS = [
  { value: 'solo', label: 'I work alone', desc: 'Independent professional' },
  { value: 'team', label: 'I have a small team', desc: 'Helpers or partners' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('type') === 'freelancer' ? 'freelancer' : 'business');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState(BUSINESS_CATEGORIES);
  const [verified, setVerified] = useState(false);

  // Business form state
  const [biz, setBiz] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', businessName: '', businessType: '' });

  // Freelancer form state
  const [fl, setFl] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', workDescription: '', city: '', howYouWork: '' });

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    axios.get(`${base}/auth/business-types`)
      .then(({ data }) => {
        const remote = data.data ?? data;
        if (Array.isArray(remote) && remote.length) {
          setCategories(remote.map(cat => ({
            label: cat.name,
            types: (cat.businessTypes || []).map(bt => ({ value: bt.enumKey, label: bt.name })),
          })));
        }
      })
      .catch(() => {});
  }, []);

  const switchTab = (t) => { setTab(t); setErrors({}); };

  const setBizField = (k) => (e) => setBiz(f => ({ ...f, [k]: e.target.value }));
  const setFlField  = (k) => (e) => setFl(f => ({ ...f, [k]: e.target.value }));

  // ── Business validation ───────────────────────────────────────────────────
  const validateBiz = () => {
    const e = {};
    if (!biz.name.trim()) e.name = 'Your name is required';
    if (!biz.email) e.email = 'Email is required';
    if (biz.password.length < 8) e.password = 'Minimum 8 characters';
    else if (!/[A-Z]/.test(biz.password)) e.password = 'Must contain at least one uppercase letter (A–Z)';
    else if (!/[a-z]/.test(biz.password)) e.password = 'Must contain at least one lowercase letter (a–z)';
    else if (!/[0-9]/.test(biz.password)) e.password = 'Must contain at least one number (0–9)';
    if (!biz.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (biz.password !== biz.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!biz.phone || biz.phone.length < 10) e.phone = 'Valid phone number required';
    if (!biz.businessName.trim()) e.businessName = 'Business name is required';
    if (!biz.businessType) e.businessType = 'Select your business type';
    setErrors(e);
    return !Object.keys(e).length;
  };

  // ── Freelancer validation ─────────────────────────────────────────────────
  const validateFl = () => {
    const e = {};
    if (!fl.name.trim()) e.name = 'Your name is required';
    if (!fl.email) e.email = 'Email is required';
    if (fl.password.length < 8) e.password = 'Minimum 8 characters';
    else if (!/[A-Z]/.test(fl.password)) e.password = 'Must have uppercase (A–Z)';
    else if (!/[0-9]/.test(fl.password)) e.password = 'Must have a number (0–9)';
    if (fl.password !== fl.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!fl.phone || fl.phone.length < 10) e.phone = 'Valid phone number required';
    if (!fl.workDescription.trim()) e.workDescription = 'Tell us what you do';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    const valid = tab === 'business' ? validateBiz() : validateFl();
    if (!valid) return;
    setLoading(true);
    try {
      if (tab === 'business') {
        await register(biz);
      } else {
        await register({
          name: fl.name,
          email: fl.email,
          password: fl.password,
          confirmPassword: fl.confirmPassword,
          phone: fl.phone,
          businessName: fl.workDescription,
          businessType: 'FREELANCER',
          city: fl.city,
          meta: { howYouWork: fl.howYouWork, isFreelancer: true },
        });
      }
      setVerified(true);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        const fe = {};
        data.errors.forEach(({ field, message }) => { if (field) fe[field] = message; });
        if (Object.keys(fe).length) setErrors(fe);
        else toast.error(data.errors[0]?.message || data.message || 'Registration failed');
      } else {
        toast.error(data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const emailForConfirm = tab === 'business' ? biz.email : fl.email;

  // ── Verified screen ───────────────────────────────────────────────────────
  if (verified) return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div className="auth-success">
          <div style={{ width: 64, height: 64, background: tab === 'freelancer' ? 'rgba(249,115,22,0.15)' : 'linear-gradient(135deg,#DCFCE7,#BBF7D0)', border: tab === 'freelancer' ? '2px solid rgba(249,115,22,0.35)' : 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
            ✉️
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>Check your inbox</h2>
          <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>We sent a verification link to</p>
          <p style={{ color: 'var(--navy)', fontWeight: 700, fontSize: 15, marginBottom: 20 }}>{emailForConfirm}</p>
          <p style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
            Click the link in the email to activate your account. Check your spam folder if you don't see it.
          </p>
          <Link
            to={tab === 'freelancer' ? '/freelancer/login' : '/login'}
            style={{ display: 'block', textAlign: 'center', color: tab === 'freelancer' ? '#F97316' : 'var(--cyan)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
          >
            Go to Login →
          </Link>
        </div>
      </div>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 500 }}>

        {/* Logo + heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo.png" alt="Syllabrix" style={{ height: 48, marginBottom: 14, objectFit: 'contain' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--navy)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {tab === 'business' ? 'Set up your business' : 'Join as Freelancer'}
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            {tab === 'business' ? 'It takes less than 2 minutes' : 'Start managing your work in minutes'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 20, gap: 2 }}>
          <button
            type="button"
            onClick={() => switchTab('business')}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14, transition: 'all 0.15s',
              background: tab === 'business' ? '#fff' : 'transparent',
              color: tab === 'business' ? 'var(--navy)' : '#6B7280',
              boxShadow: tab === 'business' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            🏢 Business
          </button>
          <button
            type="button"
            onClick={() => switchTab('freelancer')}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14, transition: 'all 0.15s',
              background: tab === 'freelancer' ? '#fff' : 'transparent',
              color: tab === 'freelancer' ? '#F97316' : '#6B7280',
              boxShadow: tab === 'freelancer' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            🔧 Freelancer
          </button>
        </div>

        <div className="auth-card">
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {tab === 'business' ? (
              /* ── Business form ── */
              <>
                <div className="auth-grid-2">
                  <Input label="Your name" placeholder="Adarsh Singh" value={biz.name} onChange={setBizField('name')} error={errors.name} />
                  <Input label="Phone" type="tel" placeholder="9876543210" value={biz.phone} onChange={setBizField('phone')} error={errors.phone} />
                </div>
                <Input label="Business name" placeholder="Adarsh Kirana Store" value={biz.businessName} onChange={setBizField('businessName')} error={errors.businessName} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>What kind of business is this?</label>
                  <select
                    value={biz.businessType}
                    onChange={setBizField('businessType')}
                    style={{ padding: '9px 12px', border: `1px solid ${errors.businessType ? 'var(--vermilion)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', fontSize: 14, background: '#fff', color: biz.businessType ? 'var(--ink)' : '#9CA3AF' }}
                  >
                    <option value="">Select business type</option>
                    {categories.map((cat) => (
                      <optgroup key={cat.label} label={cat.label}>
                        {cat.types.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.businessType && <span style={{ fontSize: 12, color: 'var(--vermilion)' }}>{errors.businessType}</span>}
                </div>
                <Input label="Email address" type="email" placeholder="you@business.com" value={biz.email} onChange={setBizField('email')} error={errors.email} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <PasswordInput label="Password" placeholder="Min 8 chars, A–Z, a–z, 0–9" value={biz.password} onChange={setBizField('password')} error={errors.password} autoComplete="new-password" />
                  {!errors.password && <span style={{ fontSize: 11, color: '#9CA3AF' }}>Must include uppercase, lowercase and a number</span>}
                </div>
                <PasswordInput label="Confirm password" placeholder="Re-enter your password" value={biz.confirmPassword} onChange={setBizField('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" />
              </>
            ) : (
              /* ── Freelancer form ── */
              <>
                <div className="auth-grid-2">
                  <Input label="Your name" placeholder="Ramesh Kumar" value={fl.name} onChange={setFlField('name')} error={errors.name} />
                  <Input label="Phone" type="tel" placeholder="9876543210" value={fl.phone} onChange={setFlField('phone')} error={errors.phone} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>What do you do? *</label>
                  <input
                    type="text"
                    placeholder="e.g. Electrician, Plumber, Graphic Designer, Tarot Reader…"
                    value={fl.workDescription}
                    onChange={setFlField('workDescription')}
                    style={{ padding: '9px 12px', border: `1.5px solid ${errors.workDescription ? 'var(--vermilion)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', fontSize: 14, outline: 'none', color: 'var(--ink)' }}
                  />
                  {errors.workDescription && <span style={{ fontSize: 12, color: 'var(--vermilion)' }}>{errors.workDescription}</span>}
                </div>

                {/* How you work */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>How do you work?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {HOW_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFl(f => ({ ...f, howYouWork: opt.value }))}
                        style={{
                          padding: '11px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                          border: `2px solid ${fl.howYouWork === opt.value ? '#F97316' : 'var(--border)'}`,
                          background: fl.howYouWork === opt.value ? 'rgba(249,115,22,0.07)' : '#fff',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: fl.howYouWork === opt.value ? '#F97316' : 'var(--ink)' }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Input label="City (optional)" placeholder="Mumbai" value={fl.city} onChange={setFlField('city')} />
                <Input label="Email address" type="email" placeholder="you@example.com" value={fl.email} onChange={setFlField('email')} error={errors.email} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <PasswordInput label="Password" placeholder="Min 8 chars, A–Z, 0–9" value={fl.password} onChange={setFlField('password')} error={errors.password} autoComplete="new-password" />
                  {!errors.password && <span style={{ fontSize: 11, color: '#9CA3AF' }}>Must include uppercase and a number</span>}
                </div>
                <PasswordInput label="Confirm password" placeholder="Re-enter your password" value={fl.confirmPassword} onChange={setFlField('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" />
              </>
            )}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="lg"
              style={tab === 'freelancer' ? { background: '#F97316' } : {}}
            >
              {tab === 'business' ? 'Create my account' : 'Join as Freelancer'}
            </Button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6B7280' }}>
          Already have an account?{' '}
          <Link to={tab === 'freelancer' ? '/freelancer/login' : '/login'} style={{ color: tab === 'freelancer' ? '#F97316' : 'var(--cyan)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
