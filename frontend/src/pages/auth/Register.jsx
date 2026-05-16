import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

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
      { value: 'RESTAURANT',   label: 'Restaurant / Cafe' },
      { value: 'DHABA',        label: 'Dhaba' },
      { value: 'BAKERY',       label: 'Bakery / Confectionery' },
      { value: 'CLOUD_KITCHEN',label: 'Cloud kitchen' },
      { value: 'JUICE_BAR',    label: 'Juice bar / Beverages' },
      { value: 'CANTEEN_MESS', label: 'Canteen / Mess' },
      { value: 'CATERING',     label: 'Catering service' },
    ],
  },
  {
    label: 'Beauty & Personal Care',
    types: [
      { value: 'SALON',         label: 'Salon' },
      { value: 'BEAUTY_PARLOUR',label: 'Beauty parlour' },
      { value: 'BARBERSHOP',    label: 'Barbershop' },
      { value: 'SPA',           label: 'Spa & wellness' },
      { value: 'LAUNDRY',       label: 'Laundry service' },
      { value: 'TAILORING',     label: 'Tailoring / Boutique' },
    ],
  },
  {
    label: 'Healthcare',
    types: [
      { value: 'CLINIC',         label: 'Clinic / Doctor' },
      { value: 'DENTAL',         label: 'Dental clinic' },
      { value: 'DIAGNOSTIC_LAB', label: 'Diagnostic lab' },
      { value: 'PHYSIOTHERAPY',  label: 'Physiotherapy' },
      { value: 'AYURVEDA',       label: 'Ayurveda clinic' },
      { value: 'HOSPITAL',       label: 'Hospital / Nursing home' },
      { value: 'VET_CLINIC',     label: 'Veterinary clinic' },
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
    label: 'Fitness & Recreation',
    types: [
      { value: 'GYM', label: 'Gym / Fitness centre' },
      { value: 'SPA', label: 'Spa & wellness' },
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
      { value: 'FREELANCER',       label: 'Freelancer' },
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
      { value: 'CAB_SERVICE',    label: 'Cab / Auto service' },
      { value: 'TRANSPORT',      label: 'Transport / Lorry service' },
      { value: 'CAR_RENTAL',     label: 'Car rental' },
      { value: 'COURIER',        label: 'Courier service' },
      { value: 'PACKERS_MOVERS', label: 'Packers & movers' },
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

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', businessName: '', businessType: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Your name is required';
    if (!form.email) e.email = 'Email is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.phone || form.phone.length < 10) e.phone = 'Valid phone number required';
    if (!form.businessName.trim()) e.businessName = 'Business name is required';
    if (!form.businessType) e.businessType = 'Select your business type';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
      toast.success('Welcome to Syllabrix!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="Syllabrix" style={{ height: 48, marginBottom: 12, objectFit: 'contain' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Set up your business</h1>
          <p style={{ color: '#6B7280', marginTop: 4, fontSize: 14 }}>It takes less than 2 minutes</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: 32 }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input label="Your name" placeholder="Adarsh Singh" value={form.name} onChange={set('name')} error={errors.name} />
              <Input label="Phone" type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} error={errors.phone} />
            </div>
            <Input label="Business name" placeholder="Adarsh Kirana Store" value={form.businessName} onChange={set('businessName')} error={errors.businessName} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>What kind of business is this?</label>
              <select
                value={form.businessType}
                onChange={set('businessType')}
                style={{ padding: '9px 12px', border: `1px solid ${errors.businessType ? 'var(--vermilion)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', fontSize: 14, background: '#fff', color: form.businessType ? 'var(--ink)' : '#9CA3AF' }}
              >
                <option value="">Select business type</option>
                {BUSINESS_CATEGORIES.map((cat) => (
                  <optgroup key={cat.label} label={cat.label}>
                    {cat.types.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.businessType && <span style={{ fontSize: 12, color: 'var(--vermilion)' }}>{errors.businessType}</span>}
            </div>
            <Input label="Email address" type="email" placeholder="you@business.com" value={form.email} onChange={set('email')} error={errors.email} />
            <Input label="Password" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={set('password')} error={errors.password} />
            <Button type="submit" fullWidth loading={loading} size="lg">Create my account</Button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6B7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
