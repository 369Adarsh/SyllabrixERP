import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import { Plus, Edit2, Trash2, X, Check, Copy, Power, Award } from 'lucide-react';
import KpiBar from '../../components/ui/KpiBar';
import {
  getMembershipPlans, createMembershipPlan, updateMembershipPlan,
  deleteMembershipPlan, toggleMembershipPlan,
} from '../../api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { key: 'individual',      label: 'Individual' },
  { key: 'couple',          label: 'Couple' },
  { key: 'student',         label: 'Student' },
  { key: 'senior',          label: 'Senior' },
  { key: 'corporate',       label: 'Corporate' },
  { key: 'personal_training', label: 'Personal Training' },
];

const DURATION_PRESETS = [
  { label: '1 Month',   days: 30  },
  { label: '3 Months',  days: 90  },
  { label: '6 Months',  days: 180 },
  { label: '1 Year',    days: 365 },
];

const PLAN_COLORS = ['#1B3A6B', '#059669', '#DC2626', '#7C3AED', '#D97706', '#0891B2'];

const QUICK_FEATURES = [
  'Unlimited group classes',
  'Personal locker access',
  'Shower & changing room',
  'Free Wi-Fi',
  'Guest pass (1/month)',
  'Access to all equipment',
  'Morning batch access',
  'Evening batch access',
  'Yoga sessions included',
  'Zumba sessions included',
  'Nutrition consultation',
  'Body composition analysis',
  'Personal training (2 sessions/month)',
  'Diet plan included',
];

const CAT_COLORS = {
  individual:       { bg: '#EFF6FF', text: '#1D4ED8' },
  couple:           { bg: '#FDF4FF', text: '#7E22CE' },
  student:          { bg: '#F0FDF4', text: '#166534' },
  senior:           { bg: '#FFF7ED', text: '#C2410C' },
  corporate:        { bg: '#F0F9FF', text: '#0369A1' },
  personal_training:{ bg: '#FEF3C7', text: '#92400E' },
};

const fmt = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

const durationLabel = (days) =>
  days >= 365 ? `${Math.round(days / 365)} yr` :
  days >= 30  ? `${Math.round(days / 30)} mo`  :
  `${days}d`;

// ── Plan Form Modal ───────────────────────────────────────────────────────────
function PlanModal({ plan, onClose, onSaved }) {
  const editing = !!plan;
  const [form, setForm] = useState({
    name:        plan?.name        || '',
    category:    plan?.category    || 'individual',
    price:       plan?.price       || '',
    duration:    plan?.duration    || 30,
    description: plan?.description || '',
    features:    plan?.features    ? [...plan.features] : [],
    color:       plan?.color       || PLAN_COLORS[0],
    isActive:    plan?.isActive    !== undefined ? plan.isActive : true,
  });
  const [featureInput, setFeatureInput] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const addFeature = (text) => {
    const t = (text || featureInput).trim();
    if (!t || form.features.includes(t)) return;
    setForm((f) => ({ ...f, features: [...f.features, t] }));
    setFeatureInput('');
  };

  const removeFeature = (i) =>
    setForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Plan name is required');
    if (!form.price || parseFloat(form.price) <= 0) return toast.error('Price must be greater than 0');
    if (!form.duration || parseInt(form.duration) < 1) return toast.error('Duration must be at least 1 day');
    setLoading(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), duration: parseInt(form.duration) };
      if (editing) {
        await updateMembershipPlan(plan.id, payload);
        toast.success('Plan updated');
      } else {
        await createMembershipPlan(payload);
        toast.success('Plan created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    } finally { setLoading(false); }
  };

  const quickLeft = QUICK_FEATURES.filter((f) => !form.features.includes(f));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, padding: 28, maxHeight: '92vh', overflowY: 'auto', margin: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', margin: 0 }}>
              {editing ? 'Edit Plan' : 'New Membership Plan'}
            </h2>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>
              Plans appear as selectable options when registering members
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Name + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input
              label="Plan name *"
              placeholder="Monthly Gold, Annual Premium…"
              value={form.name}
              onChange={set('name')}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Category</label>
              <select
                value={form.category}
                onChange={set('category')}
                style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', fontFamily: 'inherit', color: 'var(--ink)' }}
              >
                {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Price */}
          <Input label="Price (₹) *" type="number" min="1" placeholder="1499" value={form.price} onChange={set('price')} />

          {/* Duration */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 8 }}>
              Duration *
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, duration: p.days }))}
                  style={{
                    padding: '6px 16px', borderRadius: 20, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                    border: `1.5px solid ${parseInt(form.duration) === p.days ? 'var(--navy)' : 'var(--border)'}`,
                    background: parseInt(form.duration) === p.days ? 'var(--navy)' : '#fff',
                    color: parseInt(form.duration) === p.days ? '#fff' : 'var(--ink)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Input
              label="Custom (days)"
              type="number"
              min="1"
              placeholder="e.g. 45"
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: parseInt(e.target.value) || '' }))}
            />
          </div>

          {/* Description */}
          <Input
            label="Short description (optional)"
            placeholder="Best value for committed gym-goers"
            value={form.description}
            onChange={set('description')}
          />

          {/* Features / Benefits */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
              Included benefits
              <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>— click to add, or type your own</span>
            </label>

            {/* Quick-add chips */}
            {quickLeft.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {quickLeft.slice(0, 10).map((qf) => (
                  <button
                    key={qf}
                    type="button"
                    onClick={() => addFeature(qf)}
                    style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)', background: '#F9FAFB', color: '#374151', fontSize: 12, cursor: 'pointer' }}
                  >
                    + {qf}
                  </button>
                ))}
              </div>
            )}

            {/* Added features list */}
            {form.features.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {form.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                    <Check size={13} color="#059669" />
                    <span style={{ flex: 1, fontSize: 13, color: '#065F46' }}>{f}</span>
                    <button type="button" onClick={() => removeFeature(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2 }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Custom feature input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                placeholder="Type a custom benefit and press Enter…"
                style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => addFeature()}
                style={{ padding: '8px 16px', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Card colour */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 8 }}>Card colour</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {PLAN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  style={{
                    width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: form.color === c ? '3px solid #fff' : '3px solid transparent',
                    outline: form.color === c ? `2.5px solid ${c}` : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
              {/* Live preview swatch */}
              <span style={{ marginLeft: 10, fontSize: 12, color: '#6B7280' }}>
                Preview: <strong style={{ color: form.color }}>{form.name || 'Plan name'}</strong>
              </span>
            </div>
          </div>

          {/* Active */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              Active — show this plan when registering members
            </span>
          </label>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{editing ? 'Save changes' : 'Create plan'}</Button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, onEdit, onDuplicate, onToggle, onDelete }) {
  const cat = CAT_COLORS[plan.category] || { bg: '#F9FAFB', text: '#374151' };
  const catLabel = CATEGORIES.find((c) => c.key === plan.category)?.label || plan.category;

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', opacity: plan.isActive ? 1 : 0.55, display: 'flex', flexDirection: 'column' }}>
      {/* Colour bar */}
      <div style={{ height: 5, background: plan.color || 'var(--navy)', flexShrink: 0 }} />

      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)', margin: '0 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {plan.name}
            </h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ background: cat.bg, color: cat.text, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {catLabel}
              </span>
              {!plan.isActive && (
                <span style={{ background: '#F3F4F6', color: '#9CA3AF', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>
                  Inactive
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: plan.color || 'var(--navy)', lineHeight: 1 }}>
              {fmt(plan.price)}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{durationLabel(plan.duration)}</div>
          </div>
        </div>

        {/* Description */}
        {plan.description && (
          <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 10px', lineHeight: 1.5 }}>
            {plan.description}
          </p>
        )}

        {/* Features */}
        {plan.features?.length > 0 && (
          <ul style={{ margin: '0 0 14px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            {plan.features.slice(0, 5).map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#374151' }}>
                <Check size={11} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                {f}
              </li>
            ))}
            {plan.features.length > 5 && (
              <li style={{ fontSize: 11, color: '#9CA3AF', paddingLeft: 17 }}>
                +{plan.features.length - 5} more benefits
              </li>
            )}
          </ul>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 'auto' }}>
          <button
            onClick={() => onEdit(plan)}
            style={{ flex: 1, padding: '7px 0', background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <Edit2 size={11} /> Edit
          </button>
          <button
            onClick={() => onDuplicate(plan)}
            style={{ flex: 1, padding: '7px 0', background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <Copy size={11} /> Copy
          </button>
          <button
            onClick={() => onToggle(plan)}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              background: plan.isActive ? '#FFF7ED' : '#F0FDF4',
              border: `1px solid ${plan.isActive ? '#FED7AA' : '#BBF7D0'}`,
              color: plan.isActive ? '#C2410C' : '#059669',
            }}
          >
            <Power size={11} /> {plan.isActive ? 'Disable' : 'Enable'}
          </button>
          <button
            onClick={() => onDelete(plan)}
            style={{ padding: '7px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer', color: '#DC2626' }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MembershipPlans() {
  const { isMobile } = useBreakpoint();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | plan object

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getMembershipPlans();
      setPlans(r.data.data || []);
    } catch {
      toast.error('Failed to load membership plans');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (plan) => {
    if (!window.confirm(`Delete "${plan.name}"?\nExisting member subscriptions are not affected.`)) return;
    try {
      await deleteMembershipPlan(plan.id);
      toast.success('Plan deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const handleToggle = async (plan) => {
    try {
      await toggleMembershipPlan(plan.id);
      toast.success(plan.isActive ? 'Plan disabled' : 'Plan enabled');
      load();
    } catch { toast.error('Failed to update plan'); }
  };

  const handleDuplicate = (plan) => {
    // Pre-fill modal with copied data (no id → create mode)
    setModal({ ...plan, id: undefined, name: `${plan.name} (Copy)` });
  };

  const active = plans.filter((p) => p.isActive).length;
  const avgPrice = plans.length ? plans.reduce((s, p) => s + p.price, 0) / plans.length : 0;

  return (
    <div style={{ ...P.wrap(isMobile), paddingBottom: 80, maxWidth: 1100, margin: '0 auto' }}>

      {/* Page header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Plan Catalog</h1>
          <p style={P.sub}>Define your gym's plan offerings — pricing, duration, and benefits. Members are assigned a plan from here when they register.</p>
        </div>
        <Button onClick={() => setModal('create')}>
          <Plus size={16} style={{ marginRight: 6 }} /> New Plan
        </Button>
      </div>

      {plans.length > 0 && (
        <KpiBar stats={[
          { label: 'Total plans',  value: plans.length },
          { label: 'Active plans', value: active },
          { label: 'Avg. price',   value: `₹${Math.round(avgPrice).toLocaleString('en-IN')}` },
        ]} />
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: 14 }}>Loading plans…</div>
      ) : plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: '#fff', borderRadius: 16, border: '1px dashed var(--border)' }}>
          <Award size={44} color="#D1D5DB" style={{ marginBottom: 14 }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 8 }}>
            No plans created yet
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
            Create your first plan — set the name, price, duration, and benefits. These plans appear as options when you register a new member under <strong>Members</strong>.
          </p>
          <Button onClick={() => setModal('create')}>
            <Plus size={15} style={{ marginRight: 6 }} /> Create First Plan
          </Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={setModal}
              onDuplicate={handleDuplicate}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modal && (
        <PlanModal
          plan={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
