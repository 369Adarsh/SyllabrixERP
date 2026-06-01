import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import KpiBar from '../../components/ui/KpiBar';
import {
  getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomer,
  getSubscriptions, createSubscription, updateSubscriptionStatus,
  sendSubscriptionReminder, deleteSubscription, adjustCustomerCredit,
  getSegmentCustomers, getStudents, createStudent, updateStudent, createFee, updateFee, getFees, collectFee,
  getMembershipPlans, createMemberReceipt,
} from '../../api';
import {
  Plus, Users, Search, Edit2, Trash2, X, Phone, Mail, Star,
  ChevronRight, Gift, CreditCard, Clock, MessageSquare, MessageCircle, Bell,
  RefreshCw, CheckCircle, XCircle, PauseCircle, Calendar, TrendingUp,
  AlertTriangle, Send, ArrowUpRight, ArrowDownRight, Zap, Radio,
  GraduationCap, IndianRupee, QrCode,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import BroadcastLauncher from '../../components/BroadcastLauncher';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const daysFromNow = (d) => Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));

// Customer tier/segment logic
const getSegment = (c) => {
  if ((c.totalSpent || 0) >= 10000 || (c.visitCount || 0) >= 20) return { label: 'VIP', bg: '#FEF3C7', color: '#D97706' };
  if ((c.totalSpent || 0) >= 2000 || (c.visitCount || 0) >= 5) return { label: 'Regular', bg: '#EFF6FF', color: '#2563EB' };
  return { label: 'New', bg: '#F0FDF4', color: '#16A34A' };
};

// Check if birthday is within next 7 days
const birthdaySoon = (c) => {
  if (!c.birthday) return false;
  const now = new Date();
  const bday = new Date(c.birthday);
  bday.setFullYear(now.getFullYear());
  if (bday < now) bday.setFullYear(now.getFullYear() + 1);
  return (bday - now) / (1000 * 60 * 60 * 24) <= 7;
};

const normalizePhone = (phone) => {
  if (!phone) return null;
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (p.length === 10) p = '91' + p;
  if (p.startsWith('+')) p = p.slice(1);
  return p;
};

const STATUS_COLORS = {
  ACTIVE: { bg: '#ECFDF5', color: '#059669', label: 'Active' },
  EXPIRED: { bg: '#FEF2F2', color: '#DC2626', label: 'Expired' },
  CANCELLED: { bg: '#F3F4F6', color: '#6B7280', label: 'Cancelled' },
  PAUSED: { bg: '#FFFBEB', color: '#D97706', label: 'Paused' },
};

const SUB_ICONS = { ACTIVE: CheckCircle, EXPIRED: XCircle, CANCELLED: XCircle, PAUSED: PauseCircle };

const GYM_PLANS = [
  { key: 'monthly',   name: 'Monthly',          price: 1499,  days: 30  },
  { key: 'quarterly', name: 'Quarterly',         price: 3999,  days: 90  },
  { key: 'annual',    name: 'Annual',            price: 12999, days: 365 },
  { key: 'pt',        name: 'Personal Training', price: 3999,  days: 30  },
  { key: 'couple',    name: 'Couple',            price: 2499,  days: 30  },
];

// ── Receipt View ──────────────────────────────────────────────────────────────
function ReceiptView({ receipt, tenantName, onDone }) {
  const fmtD = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const receiptNo = `RCP-${Date.now().toString(36).toUpperCase()}`;

  const waLines = [
    `*${tenantName || 'Gym'} — Membership Receipt*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `*Member:* ${receipt.memberName}`,
    `*Plan:* ${receipt.planName} (${receipt.planDuration} days)`,
    `*Valid:* ${fmtD(receipt.startDate)} → ${fmtD(receipt.expiryDate)}`,
    ``,
    receipt.discountAmount > 0 ? `*Original Price:* ₹${receipt.originalPrice.toLocaleString('en-IN')}` : null,
    receipt.discountAmount > 0 ? `*Discount:* ${receipt.discountLabel}` : null,
    `*Amount ${receipt.paymentMethod === 'LATER' ? 'Due' : 'Paid'}:* ₹${receipt.finalAmount.toLocaleString('en-IN')}`,
    `*Payment:* ${receipt.paymentMethod === 'LATER' ? 'Pending — invoice created' : receipt.paymentMethod}`,
    `*Date:* ${fmtD(receipt.registeredAt)}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Thank you for joining ${tenantName || 'us'}! 💪`,
  ].filter(Boolean).join('\n');

  const rawPhone = (receipt.memberPhone || '').replace(/\D/g, '');
  const waPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
  const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(waLines)}`;

  const handlePrint = () => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Receipt</title>
<style>
  body{font-family:Arial,sans-serif;max-width:320px;margin:20px auto;padding:20px;color:#111}
  .gym{font-size:20px;font-weight:700;color:#1B3A6B;text-align:center}
  .sub{font-size:13px;color:#6B7280;text-align:center;margin:4px 0 16px}
  hr{border:none;border-top:1px dashed #D1D5DB;margin:12px 0}
  .row{display:flex;justify-content:space-between;margin-bottom:7px;font-size:13px}
  .lbl{color:#6B7280}.val{font-weight:600;text-align:right}
  .total{display:flex;justify-content:space-between;padding-top:10px;border-top:2px solid #1B3A6B;margin-top:4px}
  .tl{font-size:15px;font-weight:700;color:#1B3A6B}.tv{font-size:18px;font-weight:700;color:#059669}
  .footer{text-align:center;margin-top:18px;font-size:12px;color:#9CA3AF}
  .rno{text-align:center;font-size:10px;color:#D1D5DB;margin-top:6px}
</style></head><body>
<div class="gym">${tenantName || 'Gym'}</div>
<div class="sub">Membership Receipt</div>
<hr>
<div class="row"><span class="lbl">Member</span><span class="val">${receipt.memberName}</span></div>
<div class="row"><span class="lbl">Phone</span><span class="val">${receipt.memberPhone}</span></div>
<hr>
<div class="row"><span class="lbl">Plan</span><span class="val">${receipt.planName}</span></div>
<div class="row"><span class="lbl">Duration</span><span class="val">${receipt.planDuration} days</span></div>
<div class="row"><span class="lbl">Start</span><span class="val">${fmtD(receipt.startDate)}</span></div>
<div class="row"><span class="lbl">Expires</span><span class="val">${fmtD(receipt.expiryDate)}</span></div>
<hr>
${receipt.discountAmount > 0 ? `<div class="row"><span class="lbl">Original</span><span class="val">₹${receipt.originalPrice.toLocaleString('en-IN')}</span></div><div class="row"><span class="lbl">Discount</span><span class="val">${receipt.discountLabel}</span></div>` : ''}
<div class="total"><span class="tl">${receipt.paymentMethod === 'LATER' ? 'Amount Due' : 'Amount Paid'}</span><span class="tv">₹${receipt.finalAmount.toLocaleString('en-IN')}</span></div>
<div class="row" style="margin-top:8px"><span class="lbl">Payment</span><span class="val">${receipt.paymentMethod === 'LATER' ? 'Pending' : receipt.paymentMethod}</span></div>
<div class="row"><span class="lbl">Date</span><span class="val">${fmtD(receipt.registeredAt)}</span></div>
<div class="footer">Thank you for joining!</div>
<div class="rno">${receiptNo}</div>
</body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Success header */}
      <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
        <div style={{ width: 56, height: 56, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 26 }}>
          ✓
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', margin: '0 0 4px' }}>
          Member Registered!
        </h2>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{tenantName} · {receiptNo}</p>
      </div>

      {/* Receipt card */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', fontSize: 13 }}>
        {/* Member */}
        <div style={{ background: '#F8FAFC', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{receipt.memberName}</div>
          <div style={{ color: '#6B7280', marginTop: 2 }}>{receipt.memberPhone}</div>
        </div>

        {/* Plan + dates */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6B7280' }}>Plan</span>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{receipt.planName} · {receipt.planDuration} days</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6B7280' }}>Start</span>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{fmtD(receipt.startDate)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6B7280' }}>Expires</span>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{fmtD(receipt.expiryDate)}</span>
          </div>
        </div>

        {/* Payment */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {receipt.discountAmount > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Original Price</span>
                <span style={{ color: '#9CA3AF', textDecoration: 'line-through' }}>₹{receipt.originalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Discount</span>
                <span style={{ fontWeight: 600, color: '#D97706' }}>{receipt.discountLabel}</span>
              </div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: receipt.discountAmount > 0 ? 8 : 0, borderTop: receipt.discountAmount > 0 ? '1px dashed var(--border)' : 'none', marginTop: receipt.discountAmount > 0 ? 2 : 0 }}>
            <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>
              {receipt.paymentMethod === 'LATER' ? 'Amount Due' : 'Amount Paid'}
            </span>
            <span style={{ fontWeight: 800, fontSize: 16, color: receipt.paymentMethod === 'LATER' ? '#D97706' : '#059669' }}>
              ₹{receipt.finalAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6B7280' }}>Payment</span>
            <span style={{ fontWeight: 600, color: receipt.paymentMethod === 'LATER' ? '#D97706' : '#059669' }}>
              {receipt.paymentMethod === 'LATER' ? 'Pending — invoice created' : receipt.paymentMethod}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 0', borderRadius: 10, background: '#25D366', color: '#fff',
            fontWeight: 700, fontSize: 14, textDecoration: 'none', border: 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Send via WhatsApp
        </a>
        <button
          type="button"
          onClick={handlePrint}
          style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid var(--border)', background: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: 'var(--ink)' }}
        >
          Print Receipt
        </button>
      </div>
      <button
        type="button"
        onClick={onDone}
        style={{ marginTop: 10, width: '100%', padding: '11px 0', borderRadius: 10, background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none' }}
      >
        Done
      </button>
    </div>
  );
}

// ── Customer / Member form modal ──────────────────────────────────────────────
function CustomerModal({ customer, onClose, onSaved, isGym = false }) {
  const editing = !!customer;
  const label = isGym ? 'Member' : 'Customer';
  const { tenant } = useAuth();
  const [receipt, setReceipt] = useState(null);

  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    birthday: customer?.birthday ? customer.birthday.slice(0, 10) : '',
    address: customer?.address || '',
    tags: customer?.tags?.join(', ') || '',
    notes: customer?.notes || '',
    creditLimit: customer?.creditLimit || '',
  });
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState('flat'); // 'flat' | 'percent'
  const [paymentMethod, setPaymentMethod] = useState('LATER');
  const [gymPlans, setGymPlans] = useState([]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (isGym && !editing) {
      getMembershipPlans()
        .then((r) => setGymPlans((r.data.data || []).filter((p) => p.isActive)))
        .catch(() => {});
    }
  }, [isGym, editing]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.phone.trim()) return toast.error('Phone is required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        birthday: form.birthday || undefined,
        creditLimit: isGym ? 0 : (form.creditLimit ? parseFloat(form.creditLimit) : 0),
      };
      if (editing) {
        await updateCustomer(customer.id, payload);
        toast.success(`${label} updated`);
      } else {
        const res = await createCustomer(payload);
        const newId = res.data.data?.id || res.data?.id;
        if (isGym && selectedPlanId && newId) {
          const plan = gymPlans.find((p) => p.id === selectedPlanId);
          if (plan) {
            const discAmt = discountType === 'percent'
              ? Math.round((parseFloat(discountValue || 0) / 100) * plan.price)
              : Math.min(parseFloat(discountValue || 0) || 0, plan.price);
            const finalPrice = Math.max(0, plan.price - discAmt);
            const start = new Date(subscriptionStartDate);
            const expiry = new Date(start);
            expiry.setDate(expiry.getDate() + plan.duration);
            const subRes = await createSubscription(newId, {
              planName: plan.name,
              startDate: start.toISOString().slice(0, 10),
              expiryDate: expiry.toISOString().slice(0, 10),
              amount: finalPrice,
              autoRenew: true,
              notes: discAmt > 0
                ? `Discount: ${discountType === 'percent' ? `${discountValue}% off` : `₹${discAmt.toLocaleString('en-IN')} off`} (original ₹${plan.price.toLocaleString('en-IN')})`
                : '',
              paymentMethod: paymentMethod !== 'LATER' ? paymentMethod : undefined,
            });
            const subscriptionId = subRes?.data?.data?.id || subRes?.data?.id || null;
            await createMemberReceipt({
              customerId:     newId,
              subscriptionId,
              memberName:     form.name,
              memberPhone:    form.phone,
              planName:       plan.name,
              planDuration:   plan.duration,
              startDate:      start.toISOString().slice(0, 10),
              expiryDate:     expiry.toISOString().slice(0, 10),
              originalAmount: plan.price,
              discountAmount: discAmt,
              discountNote:   discAmt > 0
                ? (discountType === 'percent' ? `${discountValue}% off` : `₹${discAmt.toLocaleString('en-IN')} off`)
                : null,
              finalAmount:    finalPrice,
              paymentMethod,
            });
          }
        }
        const chosenPlan = gymPlans.find((p) => p.id === selectedPlanId);
        if (isGym && chosenPlan) {
          const discAmt2 = discountType === 'percent'
            ? Math.round((parseFloat(discountValue || 0) / 100) * chosenPlan.price)
            : Math.min(parseFloat(discountValue || 0) || 0, chosenPlan.price);
          const finalAmt = Math.max(0, chosenPlan.price - discAmt2);
          const expiryForReceipt = new Date(subscriptionStartDate);
          expiryForReceipt.setDate(expiryForReceipt.getDate() + chosenPlan.duration);
          setReceipt({
            memberName: form.name,
            memberPhone: form.phone,
            planName: chosenPlan.name,
            planDuration: chosenPlan.duration,
            startDate: subscriptionStartDate,
            expiryDate: expiryForReceipt.toISOString().slice(0, 10),
            originalPrice: chosenPlan.price,
            discountAmount: discAmt2,
            discountLabel: discAmt2 > 0
              ? (discountType === 'percent' ? `${discountValue}% off` : `₹${discAmt2.toLocaleString('en-IN')} off`)
              : null,
            finalAmount: finalAmt,
            paymentMethod,
            registeredAt: new Date().toISOString().slice(0, 10),
          });
          return;
        }
        toast.success(`${label} registered`);
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Show receipt after successful gym registration */}
        {receipt && (
          <ReceiptView receipt={receipt} tenantName={tenant?.name} onDone={onSaved} />
        )}

        {!receipt && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', margin: 0 }}>
              {editing ? `Edit ${label}` : `Register New ${label}`}
            </h2>
            {isGym && !editing && (
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>Fill in the details and optionally assign a membership plan.</p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Required fields */}
          <Input label="Full name *" placeholder={isGym ? 'Member full name' : 'Rahul Sharma'} value={form.name} onChange={set('name')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Phone *" type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
            <Input label="Email" type="email" placeholder={isGym ? 'member@email.com' : 'rahul@email.com'} value={form.email} onChange={set('email')} />
          </div>

          {/* Birthday */}
          <div style={{ display: 'grid', gridTemplateColumns: isGym ? '1fr' : '1fr 1fr', gap: 14 }}>
            <Input label="Date of Birth" type="date" value={form.birthday} onChange={set('birthday')} />
            {!isGym && (
              <Input label="Credit limit (Udhar)" type="number" placeholder="0" value={form.creditLimit} onChange={set('creditLimit')} />
            )}
          </div>

          {/* Membership plan — gym only, create mode, loaded from API */}
          {isGym && !editing && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 8 }}>
                Membership Plan <span style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF' }}>— optional</span>
              </label>
              {gymPlans.length === 0 ? (
                <p style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                  No active plans yet — create plans in Membership Plans to offer them here.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                  {gymPlans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    const accentColor = plan.color || 'var(--navy)';
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => { setSelectedPlanId(isSelected ? null : plan.id); setDiscountValue(''); setDiscountType('flat'); }}
                        style={{
                          border: `2px solid ${isSelected ? accentColor : 'var(--border)'}`,
                          borderRadius: 10,
                          padding: '10px 12px',
                          background: isSelected ? accentColor : '#fff',
                          color: isSelected ? '#fff' : 'var(--ink)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{plan.name}</div>
                        <div style={{ fontSize: 12, marginTop: 2, opacity: 0.85 }}>₹{Number(plan.price).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: 11, marginTop: 2, opacity: 0.65 }}>{plan.duration} days</div>
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedPlanId && (() => {
                const p = gymPlans.find((pl) => pl.id === selectedPlanId);
                if (!p) return null;
                const expiry = new Date(subscriptionStartDate);
                expiry.setDate(expiry.getDate() + p.duration);
                const isBackdated = subscriptionStartDate < new Date().toISOString().slice(0, 10);
                return (
                  <p style={{ fontSize: 12, color: '#059669', marginTop: 8, fontWeight: 500 }}>
                    {p.name} · starts {isBackdated ? subscriptionStartDate : 'today'} · expires {expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                );
              })()}

              {/* Subscription start date — allows backdating */}
              {selectedPlanId && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    Membership Start Date
                    <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 6, fontSize: 12 }}>
                      — change if the member joined earlier
                    </span>
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={subscriptionStartDate}
                    onChange={(e) => setSubscriptionStartDate(e.target.value)}
                    style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fff', outline: 'none', width: '100%' }}
                  />
                  {subscriptionStartDate < new Date().toISOString().slice(0, 10) && (
                    <p style={{ fontSize: 12, color: '#D97706', margin: 0, fontWeight: 500 }}>
                      Backdated — subscription counted from {subscriptionStartDate}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Discount — shown when a plan is selected */}
          {isGym && !editing && selectedPlanId && (() => {
            const p = gymPlans.find((pl) => pl.id === selectedPlanId);
            if (!p) return null;
            const discAmt = discountType === 'percent'
              ? Math.round((parseFloat(discountValue || 0) / 100) * p.price)
              : Math.min(parseFloat(discountValue || 0) || 0, p.price);
            const finalPrice = Math.max(0, p.price - discAmt);
            return (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 16px' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#92400E', display: 'block', marginBottom: 10 }}>
                  Apply Discount <span style={{ fontWeight: 400, color: '#B45309', fontSize: 12 }}>— optional</span>
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #FDE68A', flexShrink: 0 }}>
                    {[{ key: 'flat', label: '₹ Off' }, { key: 'percent', label: '% Off' }].map(({ key, label: dl }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { setDiscountType(key); setDiscountValue(''); }}
                        style={{
                          padding: '7px 12px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          background: discountType === key ? '#D97706' : '#FEF3C7',
                          color: discountType === key ? '#fff' : '#92400E',
                          transition: 'all 0.12s',
                        }}
                      >
                        {dl}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percent' ? 100 : p.price}
                    placeholder={discountType === 'percent' ? 'e.g. 10' : 'e.g. 200'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fff', outline: 'none' }}
                  />
                </div>
                {discAmt > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'line-through' }}>
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>
                      ₹{finalPrice.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: 12, color: '#D97706', background: '#FEF3C7', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                      {discountType === 'percent' ? `${discountValue}% off` : `₹${discAmt.toLocaleString('en-IN')} off`}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Payment collection — only shown when a plan is selected */}
          {isGym && !editing && selectedPlanId && (
            <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 10 }}>
                Collect payment now?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { key: 'CASH',  label: 'Cash',  icon: '💵' },
                  { key: 'UPI',   label: 'UPI',   icon: '📲' },
                  { key: 'CARD',  label: 'Card',  icon: '💳' },
                  { key: 'LATER', label: 'Pay Later', icon: '🕐' },
                ].map(({ key, label: ml, icon }) => {
                  const active = paymentMethod === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaymentMethod(key)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: 10,
                        border: `2px solid ${active ? (key === 'LATER' ? '#9CA3AF' : '#059669') : 'var(--border)'}`,
                        background: active ? (key === 'LATER' ? '#F3F4F6' : '#F0FDF4') : '#fff',
                        color: active ? (key === 'LATER' ? '#6B7280' : '#065F46') : '#374151',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                      {ml}
                    </button>
                  );
                })}
              </div>
              {paymentMethod !== 'LATER' && (() => {
                const p = gymPlans.find((pl) => pl.id === selectedPlanId);
                if (!p) return null;
                const discAmt = discountType === 'percent'
                  ? Math.round((parseFloat(discountValue || 0) / 100) * p.price)
                  : Math.min(parseFloat(discountValue || 0) || 0, p.price);
                const finalPrice = Math.max(0, p.price - discAmt);
                return (
                  <>
                    <div style={{ marginTop: 10, padding: '8px 12px', background: '#DCFCE7', borderRadius: 8, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                      ✓ Invoice will be marked PAID · ₹{finalPrice.toLocaleString('en-IN')} via {paymentMethod}
                      {discAmt > 0 && (
                        <span style={{ fontWeight: 400, color: '#4ADE80', marginLeft: 6 }}>
                          (₹{discAmt.toLocaleString('en-IN')} discount applied)
                        </span>
                      )}
                    </div>

                    {/* UPI WhatsApp payment link */}
                    {paymentMethod === 'UPI' && (() => {
                      const upiId = tenant?.receiptConfig?.upiId;
                      const rawPhone = (form.phone || '').replace(/\D/g, '');
                      const waPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
                      const hasPhone = rawPhone.length >= 10;

                      if (!upiId) {
                        return (
                          <div style={{ marginTop: 8, padding: '8px 12px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, fontSize: 12, color: '#C2410C' }}>
                            ⚠ No UPI ID set — go to <strong>Settings → UPI ID</strong> to enable this feature.
                          </div>
                        );
                      }

                      const payUrl = `${window.location.origin}/pay?pa=${encodeURIComponent(upiId)}&am=${finalPrice}&pn=${encodeURIComponent(tenant?.name || 'Gym')}&tn=${encodeURIComponent((p.name + ' Membership').slice(0, 50))}`;
                      const waMsg = [
                        `*${tenant?.name || 'Gym'} — Payment Request* 💪`,
                        `━━━━━━━━━━━━━━━━━━━━`,
                        `Hi ${form.name || 'there'}!`,
                        ``,
                        `*Plan:* ${p.name} (${p.duration} days)`,
                        `*Amount:* ₹${finalPrice.toLocaleString('en-IN')}`,
                        discAmt > 0 ? `*Discount applied:* ${discountType === 'percent' ? `${discountValue}% off` : `₹${discAmt.toLocaleString('en-IN')} off`}` : null,
                        ``,
                        `👇 Tap the link below to pay via UPI:`,
                        payUrl,
                        ``,
                        `_Opens GPay, PhonePe, Paytm or any UPI app_`,
                        `━━━━━━━━━━━━━━━━━━━━`,
                        `*${tenant?.name || 'Gym'}*`,
                      ].filter(Boolean).join('\n');

                      return (
                        <div style={{ marginTop: 8, padding: '12px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#065F46', marginBottom: 8 }}>
                            📲 Send UPI payment request via WhatsApp
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 11, color: '#6B7280', background: '#fff', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--font-mono)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {upiId}
                            </div>
                            {hasPhone ? (
                              <a
                                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#25D366', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                Send UPI Link
                              </a>
                            ) : (
                              <span style={{ fontSize: 11, color: '#D97706' }}>Enter member phone first</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                );
              })()}
              {paymentMethod === 'LATER' && (
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
                  A draft invoice will be created — mark it paid when payment is collected.
                </p>
              )}
            </div>
          )}

          <Input label="Address" placeholder={isGym ? 'Residential address (optional)' : 'Street, City'} value={form.address} onChange={set('address')} />

          {/* Tags */}
          <Input
            label="Tags (comma separated)"
            placeholder={isGym ? 'vip, student, weight-loss, morning-batch' : 'vip, loyal, regular'}
            value={form.tags}
            onChange={set('tags')}
          />

          {/* Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              {isGym ? 'Health Notes / Fitness Goals' : 'Notes'}
            </label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              placeholder={isGym ? 'e.g. Knee injury — avoid squats. Goal: weight loss 10kg.' : 'Any remarks...'}
              rows={3}
              style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'inherit', background: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>
              {editing ? `Save ${label}` : `Register ${label}`}
            </Button>
          </div>
        </form>
        </>)}
      </div>
    </div>
  );
}

// ── Add Subscription modal ────────────────────────────────────────────────────
function AddSubscriptionModal({ customerId, onClose, onSaved }) {
  const [form, setForm] = useState({ planName: '', startDate: new Date().toISOString().slice(0, 10), expiryDate: '', amount: '', autoRenew: true, notes: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.planName || !form.expiryDate || !form.amount) return toast.error('Plan name, expiry and amount are required');
    setLoading(true);
    try {
      await createSubscription(customerId, form);
      toast.success('Subscription added');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--navy)' }}>Add Subscription</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Plan name *" placeholder="Monthly Membership, Annual Package..." value={form.planName} onChange={set('planName')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Start date *" type="date" value={form.startDate} onChange={set('startDate')} />
            <Input label="Expiry date *" type="date" value={form.expiryDate} onChange={set('expiryDate')} />
          </div>
          <Input label="Amount (₹) *" type="number" placeholder="999" value={form.amount} onChange={set('amount')} />
          <Input label="Notes" placeholder="Any notes..." value={form.notes} onChange={set('notes')} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.autoRenew} onChange={set('autoRenew')} />
            Auto-renew (send reminder before expiry)
          </label>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Add subscription</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Customer 360° slide-over panel ───────────────────────────────────────────
const calcAge = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const ALLERGY_SUGGESTIONS = ['Penicillin', 'Aspirin', 'NSAIDs', 'Sulfa drugs', 'Latex', 'Dust', 'Pollen', 'Eggs', 'Peanuts'];
const CONDITION_SUGGESTIONS = ['Diabetes Type 2', 'Hypertension', 'Hypothyroidism', 'Asthma', 'CKD', 'CAD', 'COPD', 'Epilepsy', 'Arthritis'];

function TagInput({ values = [], onChange, suggestions = [], placeholder }) {
  const [input, setInput] = useState('');
  const add = (val) => {
    const v = val.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        {values.map((v) => (
          <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EFF6FF', color: '#2563EB', fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>
            {v}
            <button type="button" onClick={() => onChange(values.filter(x => x !== v))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(input); } }}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 140, padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none' }}
        />
        <button type="button" onClick={() => add(input)} style={{ padding: '7px 12px', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Add</button>
      </div>
      {suggestions.filter(s => !values.includes(s)).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {suggestions.filter(s => !values.includes(s)).slice(0, 5).map(s => (
            <button key={s} type="button" onClick={() => onChange([...values, s])}
              style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)', background: '#F9FAFB', cursor: 'pointer', color: '#6B7280' }}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerPanel({ customerId, onClose, onEdit }) {
  const { tenant } = useAuth();
  const isClinic = tenant?.businessType === 'CLINIC';
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showAddSub, setShowAddSub] = useState(false);
  const [creditForm, setCreditForm] = useState({ amount: '', operation: 'add' });
  const [medForm, setMedForm] = useState(null);
  const [medSaving, setMedSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getCustomer(customerId);
      const c = r.data.data;
      setCustomer(c);
      setMedForm({
        bloodGroup: c.bloodGroup || '',
        dateOfBirth: c.dateOfBirth ? new Date(c.dateOfBirth).toISOString().split('T')[0] : '',
        gender: c.gender || '',
        allergies: c.allergies || [],
        chronicConditions: c.chronicConditions || [],
        abhaId: c.abhaId || '',
        referredBy: c.referredBy || '',
        emergencyContactName: c.emergencyContactName || '',
        emergencyContactPhone: c.emergencyContactPhone || '',
      });
    } catch { toast.error('Failed to load customer'); }
    finally { setLoading(false); }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  const handleReminder = async (sub) => {
    try {
      await sendSubscriptionReminder(customerId, sub.id);
      toast.success('Reminder sent via WhatsApp');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
  };

  const handleStatusChange = async (sub, status) => {
    try {
      await updateSubscriptionStatus(customerId, sub.id, status);
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleDeleteSub = async (sub) => {
    if (!window.confirm('Delete this subscription?')) return;
    try {
      await deleteSubscription(customerId, sub.id);
      toast.success('Subscription deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleCredit = async (e) => {
    e.preventDefault();
    if (!creditForm.amount) return;
    try {
      await adjustCustomerCredit(customerId, creditForm);
      toast.success('Credit balance updated');
      setCreditForm({ amount: '', operation: 'add' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleSaveMedical = async (e) => {
    e.preventDefault();
    setMedSaving(true);
    try {
      await updateCustomer(customerId, medForm);
      toast.success('Medical profile saved');
      load();
    } catch { toast.error('Failed to save'); }
    finally { setMedSaving(false); }
  };

  const activeSub = customer?.subscriptions?.find((s) => s.status === 'ACTIVE');
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'subscriptions', label: `Plans (${customer?.subscriptions?.length || 0})` },
    { key: 'history', label: 'History' },
    ...(isClinic ? [{ key: 'medical', label: 'Medical' }] : []),
  ];

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: 520, background: '#fff',
        zIndex: 201, boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.22s ease',
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--navy)', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, background: 'var(--cyan)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                {loading ? '?' : customer?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>
                  {loading ? 'Loading...' : customer?.name}
                </div>
                {customer?.phone && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{customer.phone}</div>}
                {activeSub && (
                  <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(5,150,105,0.3)', padding: '2px 10px', borderRadius: 20, fontSize: 12, color: '#6EE7B7' }}>
                    <Zap size={11} />
                    {activeSub.planName} · expires {fmtDate(activeSub.expiryDate)}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {customer?.phone && (
                <button
                  onClick={() => { const p = normalizePhone(customer.phone); if (p) window.open(`https://wa.me/${p}?text=${encodeURIComponent(`Hi ${customer.name.split(' ')[0]}! `)}`, '_blank'); }}
                  style={{ background: 'rgba(37,211,102,0.25)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MessageCircle size={12} /> Chat
                </button>
              )}
              <button onClick={() => onEdit(customer)} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Edit2 size={12} /> Edit
              </button>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#fff' }}><X size={16} /></button>
            </div>
          </div>

          {/* Segment badge */}
          {customer && (() => {
            const seg = getSegment(customer);
            const bday = birthdaySoon(customer);
            return (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.12)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  <Star size={10} /> {seg.label}
                </span>
                {bday && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(249,168,212,0.25)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#FBCFE8' }}>
                    <Gift size={10} /> Birthday soon!
                  </span>
                )}
              </div>
            );
          })()}

          {/* Quick stats */}
          {customer && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Total spent', value: fmt(customer.totalSpent), icon: TrendingUp },
                { label: 'Visits', value: customer.visitCount || 0, icon: Clock },
                { label: 'Loyalty pts', value: customer.loyaltyPoints || 0, icon: Star },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon size={10} />{label}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#FAFAFA' }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '11px 4px', fontSize: 12, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? 'var(--navy)' : '#9CA3AF',
              background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid var(--cyan)' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading...</div>
          ) : !customer ? null : (

            /* ── OVERVIEW ── */
            tab === 'overview' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Contact */}
                <Section title="Contact">
                  <Row icon={Phone} label="Phone" value={customer.phone || '—'} />
                  <Row icon={Mail} label="Email" value={customer.email || '—'} />
                  <Row icon={Gift} label="Birthday" value={fmtDate(customer.birthday)} />
                  {customer.address && <Row icon={ChevronRight} label="Address" value={customer.address} />}
                  {customer.tags?.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {customer.tags.map((tag) => (
                        <span key={tag} style={{ background: '#EFF6FF', color: '#2563EB', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </Section>

                {/* Udhar / Credit */}
                <Section title="Udhar / Credit Note">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <StatCard label="Outstanding balance" value={fmt(customer.creditBalance)} color={customer.creditBalance > 0 ? '#DC2626' : '#059669'} />
                    <StatCard label="Credit limit" value={customer.creditLimit > 0 ? fmt(customer.creditLimit) : 'No limit'} color="#6B7280" />
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>
                    Add amount when customer borrows · Subtract when they pay back
                  </div>
                  <form onSubmit={handleCredit} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <Input label="Amount (₹)" type="number" placeholder="500" value={creditForm.amount}
                        onChange={(e) => setCreditForm((f) => ({ ...f, amount: e.target.value }))} />
                    </div>
                    <select value={creditForm.operation} onChange={(e) => setCreditForm((f) => ({ ...f, operation: e.target.value }))}
                      style={{ padding: '9px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: '#fff', height: 40 }}>
                      <option value="add">+ Borrowed</option>
                      <option value="subtract">− Paid back</option>
                    </select>
                    <Button type="submit" style={{ height: 40, padding: '0 14px', fontSize: 13 }}>Update</Button>
                  </form>
                </Section>

                {/* Active subscription summary */}
                {activeSub && (
                  <Section title="Active Subscription">
                    <div style={{ background: '#ECFDF5', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontWeight: 700, color: '#065F46', fontSize: 15 }}>{activeSub.planName}</div>
                      <div style={{ fontSize: 13, color: '#059669', marginTop: 4 }}>
                        Expires: {fmtDate(activeSub.expiryDate)} · {Math.max(0, daysFromNow(activeSub.expiryDate))} days left
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>Amount: {fmt(activeSub.amount)}</div>
                      {daysFromNow(activeSub.expiryDate) <= 7 && (
                        <button onClick={() => handleReminder(activeSub)} style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                          <Bell size={13} /> Send renewal reminder
                        </button>
                      )}
                    </div>
                  </Section>
                )}

                {/* Recent Purchases */}
                {(customer.transactions?.length > 0 || customer.invoices?.length > 0) && (
                  <Section title="Recent Purchases">
                    {(customer.transactions?.length > 0
                      ? customer.transactions.slice(0, 3)
                      : customer.invoices.slice(0, 3)
                    ).map((tx) => (
                      <HistoryRow key={tx.id}
                        left={tx.receiptNumber || tx.invoiceNumber}
                        sub={fmtDate(tx.createdAt)}
                        right={fmt(tx.total)}
                        badge={tx.paymentMethod || tx.status}
                        badgeColor={tx.status === 'PAID' ? '#059669' : tx.status === 'OVERDUE' ? '#DC2626' : '#6B7280'}
                      />
                    ))}
                    <button onClick={() => setTab('history')}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--cyan)', fontWeight: 600, padding: '6px 0', textAlign: 'center' }}>
                      View full history →
                    </button>
                  </Section>
                )}

                {/* Quick Offer / Birthday Wish */}
                {customer.phone && (
                  <Section title="Send via WhatsApp">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        {
                          label: birthdaySoon(customer) ? 'Birthday wish' : 'Special offer',
                          icon: birthdaySoon(customer) ? Gift : Send,
                          color: birthdaySoon(customer) ? '#BE185D' : '#059669',
                          bg: birthdaySoon(customer) ? '#FDF2F8' : '#F0FDF4',
                          msg: birthdaySoon(customer)
                            ? `🎂 Happy Birthday ${customer.name.split(' ')[0]}! Wishing you a wonderful day!\n\nAs a special birthday gift, come visit us and enjoy an exclusive discount on your next purchase! 🎉\n\nSee you soon!`
                            : `Hello ${customer.name.split(' ')[0]}! 🎉\n\nWe have a special offer just for you!\nVisit us today and enjoy an exclusive discount.\n\nHope to see you soon!`,
                        },
                        {
                          label: 'Festival greeting',
                          icon: Star,
                          color: '#D97706',
                          bg: '#FFFBEB',
                          msg: `Hello ${customer.name.split(' ')[0]}! 🎊\n\nWishing you and your family a happy and prosperous festival season!\n\nVisit us for special festive offers and discounts.\n\n– ${customer.name}`,
                        },
                        {
                          label: 'We miss you!',
                          icon: MessageSquare,
                          color: '#7C3AED',
                          bg: '#F5F3FF',
                          msg: `Hi ${customer.name.split(' ')[0]}! 👋\n\nWe haven't seen you in a while and we miss you!\n\nCome visit us — we've got new products and special deals waiting just for you. 😊`,
                        },
                      ].map(({ label, icon: Icon, color, bg, msg }) => (
                        <button key={label}
                          onClick={() => {
                            const phone = normalizePhone(customer.phone);
                            if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: bg, border: `1px solid ${color}20`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={14} color={color} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color }}>{label}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Opens WhatsApp with pre-filled message</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Notes */}
                {customer.notes && (
                  <Section title="Notes">
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{customer.notes}</p>
                  </Section>
                )}
              </div>

            /* ── SUBSCRIPTIONS ── */
            ) : tab === 'subscriptions' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Subscription history</span>
                  <Button onClick={() => setShowAddSub(true)} style={{ fontSize: 12, padding: '6px 14px' }}><Plus size={13} style={{ marginRight: 4 }} />Add plan</Button>
                </div>
                {customer.subscriptions?.length === 0 ? (
                  <EmptyState icon={RefreshCw} msg="No subscriptions yet" sub="Add a plan to track renewals and send auto-reminders" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {customer.subscriptions.map((sub) => {
                      const s = STATUS_COLORS[sub.status];
                      const Icon = SUB_ICONS[sub.status];
                      const days = daysFromNow(sub.expiryDate);
                      return (
                        <div key={sub.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{sub.planName}</div>
                              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
                                {fmtDate(sub.startDate)} → {fmtDate(sub.expiryDate)}
                                {sub.status === 'ACTIVE' && ` · ${days > 0 ? `${days}d left` : 'expired'}`}
                              </div>
                              <div style={{ fontSize: 13, color: '#374151', marginTop: 4, fontWeight: 600 }}>{fmt(sub.amount)}</div>
                            </div>
                            <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Icon size={11} />{s.label}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                            {sub.status === 'ACTIVE' && (
                              <>
                                <ActionBtn onClick={() => handleReminder(sub)} icon={Bell} label="Remind" />
                                <ActionBtn onClick={() => handleStatusChange(sub, 'PAUSED')} icon={PauseCircle} label="Pause" color="#D97706" />
                                <ActionBtn onClick={() => handleStatusChange(sub, 'CANCELLED')} icon={XCircle} label="Cancel" color="#DC2626" />
                              </>
                            )}
                            {sub.status === 'PAUSED' && (
                              <ActionBtn onClick={() => handleStatusChange(sub, 'ACTIVE')} icon={CheckCircle} label="Reactivate" color="#059669" />
                            )}
                            {(sub.status === 'EXPIRED' || sub.status === 'CANCELLED') && (
                              <ActionBtn onClick={() => setShowAddSub(true)} icon={RefreshCw} label="Renew" color="#2563EB" />
                            )}
                            <ActionBtn onClick={() => handleDeleteSub(sub)} icon={Trash2} label="Delete" color="#DC2626" />
                          </div>
                          {sub.notes && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8, fontStyle: 'italic' }}>{sub.notes}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            /* ── HISTORY ── */
            ) : tab === 'history' ? (
              <div>
                {/* Invoices */}
                <div style={{ marginBottom: 20 }}>
                  <SectionTitle>Invoices ({customer.invoices?.length || 0})</SectionTitle>
                  {customer.invoices?.length === 0
                    ? <EmptyState icon={AlertTriangle} msg="No invoices" />
                    : customer.invoices.map((inv) => (
                        <HistoryRow key={inv.id}
                          left={inv.invoiceNumber}
                          sub={fmtDate(inv.createdAt)}
                          right={fmt(inv.total)}
                          badge={inv.status}
                          badgeColor={inv.status === 'PAID' ? '#059669' : inv.status === 'OVERDUE' ? '#DC2626' : '#6B7280'}
                        />
                      ))
                  }
                </div>

                {/* Transactions */}
                <div style={{ marginBottom: 20 }}>
                  <SectionTitle>POS Transactions ({customer.transactions?.length || 0})</SectionTitle>
                  {customer.transactions?.length === 0
                    ? <EmptyState icon={AlertTriangle} msg="No transactions" />
                    : customer.transactions.map((tx) => (
                        <HistoryRow key={tx.id}
                          left={tx.receiptNumber}
                          sub={fmtDate(tx.createdAt)}
                          right={fmt(tx.total)}
                          badge={tx.paymentMethod}
                          badgeColor="#6B7280"
                        />
                      ))
                  }
                </div>

                {/* Appointments */}
                {customer.appointments?.length > 0 && (
                  <div>
                    <SectionTitle>Appointments</SectionTitle>
                    {customer.appointments.map((appt) => (
                      <HistoryRow key={appt.id}
                        left={appt.title}
                        sub={fmtDate(appt.startTime)}
                        right={appt.price ? fmt(appt.price) : '—'}
                        badge={appt.status}
                        badgeColor={appt.status === 'COMPLETED' ? '#059669' : '#6B7280'}
                      />
                    ))}
                  </div>
                )}
              </div>

            /* ── MEDICAL PROFILE ── */
            ) : tab === 'medical' && isClinic ? (
              <form onSubmit={handleSaveMedical} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Summary pills if data exists */}
                {(customer.bloodGroup || customer.chronicConditions?.length > 0 || customer.allergies?.length > 0) && (
                  <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {customer.bloodGroup && (
                      <span style={{ background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{customer.bloodGroup}</span>
                    )}
                    {customer.allergies?.map(a => (
                      <span key={a} style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>⚠ {a}</span>
                    ))}
                    {customer.chronicConditions?.map(c => (
                      <span key={c} style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>{c}</span>
                    ))}
                  </div>
                )}

                {/* Basic clinical info */}
                <Section title="Clinical Info">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Blood Group</div>
                      <select value={medForm?.bloodGroup || ''} onChange={e => setMedForm(f => ({ ...f, bloodGroup: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, background: '#fff' }}>
                        <option value="">— Select —</option>
                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Gender</div>
                      <select value={medForm?.gender || ''} onChange={e => setMedForm(f => ({ ...f, gender: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, background: '#fff' }}>
                        <option value="">— Select —</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>
                        Date of Birth {medForm?.dateOfBirth && <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>· Age {calcAge(medForm.dateOfBirth)} yrs</span>}
                      </div>
                      <input type="date" value={medForm?.dateOfBirth || ''} onChange={e => setMedForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>ABHA ID</div>
                      <input value={medForm?.abhaId || ''} onChange={e => setMedForm(f => ({ ...f, abhaId: e.target.value }))}
                        placeholder="12-3456-7890-1234"
                        style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </Section>

                {/* Allergies */}
                <Section title="Known Allergies">
                  <TagInput
                    values={medForm?.allergies || []}
                    onChange={vals => setMedForm(f => ({ ...f, allergies: vals }))}
                    suggestions={ALLERGY_SUGGESTIONS}
                    placeholder="Type allergy and press Enter…"
                  />
                </Section>

                {/* Chronic conditions */}
                <Section title="Chronic Conditions">
                  <TagInput
                    values={medForm?.chronicConditions || []}
                    onChange={vals => setMedForm(f => ({ ...f, chronicConditions: vals }))}
                    suggestions={CONDITION_SUGGESTIONS}
                    placeholder="Type condition and press Enter…"
                  />
                </Section>

                {/* Emergency contact */}
                <Section title="Emergency Contact">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Name</div>
                      <input value={medForm?.emergencyContactName || ''} onChange={e => setMedForm(f => ({ ...f, emergencyContactName: e.target.value }))}
                        placeholder="Relative name"
                        style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Phone</div>
                      <input value={medForm?.emergencyContactPhone || ''} onChange={e => setMedForm(f => ({ ...f, emergencyContactPhone: e.target.value }))}
                        placeholder="10-digit mobile"
                        style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </Section>

                {/* Referred by */}
                <Section title="Referral">
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Referred by</div>
                  <input value={medForm?.referredBy || ''} onChange={e => setMedForm(f => ({ ...f, referredBy: e.target.value }))}
                    placeholder="e.g. Dr. Mehta, Google, Word of mouth"
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </Section>

                <button type="submit" disabled={medSaving}
                  style={{ padding: '11px 0', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: medSaving ? 'not-allowed' : 'pointer', opacity: medSaving ? 0.7 : 1 }}>
                  {medSaving ? 'Saving…' : 'Save Medical Profile'}
                </button>
              </form>

            ) : null
          )}
        </div>
      </div>

      {showAddSub && (
        <AddSubscriptionModal
          customerId={customerId}
          onClose={() => setShowAddSub(false)}
          onSaved={() => { setShowAddSub(false); load(); }}
        />
      )}
    </>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div style={{ background: '#FAFAFA', borderRadius: 12, padding: 14, border: '1px solid var(--border)' }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);
const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</div>
);
const Row = ({ icon: Icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13 }}>
    <Icon size={13} color="#9CA3AF" />
    <span style={{ color: '#9CA3AF', minWidth: 70 }}>{label}</span>
    <span style={{ color: '#111827', fontWeight: 500 }}>{value}</span>
  </div>
);
const StatCard = ({ label, value, color }) => (
  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
  </div>
);
const ActionBtn = ({ onClick, icon: Icon, label, color = 'var(--navy)' }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: `1px solid ${color}20`, background: `${color}10`, color, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
    <Icon size={11} />{label}
  </button>
);
const HistoryRow = ({ left, sub, right, badge, badgeColor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', borderRadius: 8, marginBottom: 6, border: '1px solid var(--border)' }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{left}</div>
      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{sub}</div>
    </div>
    <div style={{ display: 'flex', align: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, background: `${badgeColor}15`, color: badgeColor, padding: '2px 8px', borderRadius: 12 }}>{badge}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{right}</span>
    </div>
  </div>
);
const EmptyState = ({ icon: Icon, msg, sub }) => (
  <div style={{ textAlign: 'center', padding: '28px 16px', color: '#9CA3AF' }}>
    <Icon size={28} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
    <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>{msg}</div>
    {sub && <div style={{ fontSize: 12, marginTop: 4 }}>{sub}</div>}
  </div>
);

// ── Main Customers page ───────────────────────────────────────────────────────
const SEGMENT_FILTERS = ['All', 'VIP', 'Regular', 'New'];

const BROADCAST_TEMPLATES = [
  { label: 'Special Offer', text: 'Hello {{name}}! 🎉\n\nWe have a special offer just for you!\nVisit us today and enjoy an exclusive discount on your next purchase.\n\nHope to see you soon!' },
  { label: 'Festival Wishes', text: 'Hello {{name}}! 🎊\n\nWishing you and your family a joyful and prosperous festival season!\n\nCome visit us for special festive deals and discounts.' },
  { label: 'Win-back', text: 'Hi {{name}}! 👋\n\nWe miss you and haven\'t seen you in a while!\n\nCome back and enjoy a special welcome-back offer — new products and great deals waiting for you.' },
  { label: 'Birthday', text: '🎂 Happy Birthday {{name}}!\n\nWishing you a wonderful day filled with joy!\n\nAs our special gift, enjoy an exclusive birthday discount on your next visit. 🎉' },
  { label: 'New Arrivals', text: 'Hi {{name}}! ✨\n\nExciting news — we have new products and collections just arrived!\n\nCome check them out and find something you\'ll love.' },
];

function BroadcastCompose({ customers, onClose, onLaunch }) {
  const [message, setMessage] = useState(BROADCAST_TEMPLATES[0].text);
  const [templateIdx, setTemplateIdx] = useState(0);

  const preview = message
    .replace(/\{\{name\}\}/g, customers[0]?.name?.split(' ')[0] || 'Customer');

  const launch = () => {
    if (!message.trim()) { toast.error('Message is required'); return; }
    const recipients = customers.map(c => ({
      id: c.id, name: c.name, phone: c.phone,
      message: message.replace(/\{\{name\}\}/g, c.name?.split(' ')[0] || c.name || ''),
    }));
    onLaunch(recipients);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 560, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', margin: 0 }}>Compose Broadcast</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>Sending to {customers.length} customer{customers.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        {/* Template picker */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>Quick templates</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {BROADCAST_TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => { setTemplateIdx(i); setMessage(t.text); }}
                style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${templateIdx === i ? 'var(--cyan)' : 'var(--border)'}`, background: templateIdx === i ? 'rgba(31,184,214,0.08)' : '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: templateIdx === i ? 'var(--navy)' : '#6B7280' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message editor */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>Message <span style={{ fontWeight: 400, color: '#9CA3AF' }}>· use {'{{name}}'} for customer name</span></div>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={7}
            style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, resize: 'vertical', fontFamily: 'var(--font-body)', boxSizing: 'border-box', lineHeight: 1.65 }} />
        </div>

        {/* Preview */}
        <div style={{ marginBottom: 20, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', marginBottom: 6 }}>Preview (for {customers[0]?.name?.split(' ')[0] || 'Customer'})</div>
          <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{preview}</div>
        </div>

        {/* Recipients list */}
        <div style={{ marginBottom: 20, maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 0' }}>
          {customers.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px' }}>
              <div style={{ width: 28, height: 28, background: 'var(--navy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{c.name[0]?.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.phone}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <button onClick={launch}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            <Send size={15} /> Launch Broadcast →
          </button>
        </div>
      </div>
    </div>
  );
}

const GYM_TYPES = ['GYM', 'SPA'];

function CustomersView() {
  const { isMobile } = useBreakpoint();
  const { tenant } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [modal, setModal] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Broadcast / multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showCompose, setShowCompose] = useState(false);
  const [broadcastRecipients, setBroadcastRecipients] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const PAGE_LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getCustomers({ page, limit: PAGE_LIMIT });
      const d = r.data.data;
      if (d && d.customers) {
        setCustomers(d.customers);
        setPagination({ total: d.total, totalPages: d.totalPages, page: d.page, limit: d.limit });
      } else {
        setCustomers(d || []);
        setPagination(null);
      }
    } catch {
      toast.error('Failed to load customers');
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (c, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    try {
      await deleteCustomer(c.id);
      toast.success('Customer deleted');
      if (selectedId === c.id) setSelectedId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleEdit = (c, e) => {
    if (e) e.stopPropagation();
    setModal(c);
  };

  const sendOffer = (c, e) => {
    e.stopPropagation();
    const phone = normalizePhone(c.phone);
    if (!phone) { toast.error('No phone number for this customer'); return; }
    const msg = `Hello ${c.name.split(' ')[0]}! 🎉\n\nWe have a special offer just for you.\nVisit us today and get an exclusive discount on your purchase!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const toggleSelect = (c, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
      return next;
    });
  };

  const selectAll = () => {
    const withPhone = visibleCustomers.filter(c => c.phone);
    setSelectedIds(new Set(withPhone.map(c => c.id)));
  };

  const selectByCondition = async (condition) => {
    try {
      toast.loading('Selecting customers…', { id: 'sel' });
      const r = await getSegmentCustomers(condition);
      toast.dismiss('sel');
      const ids = new Set((r.data.data || []).map(c => c.id));
      setSelectedIds(ids);
      toast.success(`${ids.size} customers selected`);
    } catch {
      toast.dismiss('sel');
      toast.error('Failed to load segment');
    }
  };

  const openBroadcast = () => {
    const selected = customers.filter(c => selectedIds.has(c.id) && c.phone);
    if (!selected.length) { toast.error('No selected customers have a phone number'); return; }
    setShowCompose(true);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setShowCompose(false);
    setBroadcastRecipients(null);
  };

  const activeSub = (c) => c.subscriptions?.find((s) => s.status === 'ACTIVE');
  const subExpiringSoon = (c) => {
    const sub = activeSub(c);
    return sub && daysFromNow(sub.expiryDate) <= 7;
  };

  const visibleCustomers = customers.filter(c => {
    if (segmentFilter !== 'All' && getSegment(c).label !== segmentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
    }
    return true;
  });

  // Counts for each segment
  const segmentCounts = SEGMENT_FILTERS.reduce((acc, s) => {
    acc[s] = s === 'All' ? customers.length : customers.filter(c => getSegment(c).label === s).length;
    return acc;
  }, {});

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: selectedId ? 680 : 1100, margin: '0 auto', transition: 'max-width 0.2s' }}>
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>{GYM_TYPES.includes(tenant?.businessType) ? 'Members' : 'Customers'}</h1>
          <p style={P.sub}>{pagination ? `${pagination.total} ${GYM_TYPES.includes(tenant?.businessType) ? 'members' : 'customers'}` : `${customers.length} ${GYM_TYPES.includes(tenant?.businessType) ? 'members' : 'customers'}`} · click a card for full profile</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setSelectMode(s => !s); setSelectedIds(new Set()); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: `1.5px solid ${selectMode ? '#25D366' : 'var(--border)'}`, borderRadius: 8, background: selectMode ? '#DCFCE7' : '#fff', color: selectMode ? '#16A34A' : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Radio size={14} /> {selectMode ? 'Cancel Select' : 'Broadcast'}
          </button>
          {!selectMode && <Button onClick={() => setModal('create')}><Plus size={16} style={{ marginRight: 6 }} />{GYM_TYPES.includes(tenant?.businessType) ? 'Add Member' : 'Add Customer'}</Button>}
        </div>
      </div>

      {/* Broadcast condition selector (shown in select mode) */}
      {selectMode && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>Smart Select — pick customers by condition:</div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>Or tap individual cards below to pick manually</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'All with phone', seg: 'ALL', color: '#6B7280' },
              { label: 'VIP customers', seg: 'VIP', color: '#D97706' },
              { label: 'Inactive 30d+', seg: 'INACTIVE_30', color: '#7C3AED' },
              { label: 'Inactive 60d+', seg: 'INACTIVE_60', color: '#DC2626' },
              { label: 'Birthday this month', seg: 'BIRTHDAY_MONTH', color: '#BE185D' },
              { label: 'Expiring in 7d', seg: 'EXPIRING_7', color: '#D97706' },
            ].map(({ label, seg, color }) => (
              <button key={seg} onClick={() => selectByCondition(seg)}
                style={{ padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${color}30`, background: `${color}10`, color, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {label}
              </button>
            ))}
            <button onClick={selectAll}
              style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid #1E293B30', background: '#1E293B10', color: 'var(--navy)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Select all visible
            </button>
          </div>
        </div>
      )}

      {/* Search + segment filter row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, email..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' }} />
        </div>

        {/* Segment filter tabs */}
        {!selectMode && (
          <div style={{ display: 'flex', background: 'var(--surface-1)', borderRadius: 8, padding: 3, gap: 2 }}>
            {SEGMENT_FILTERS.map(seg => (
              <button key={seg} onClick={() => setSegmentFilter(seg)} style={{
                padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: segmentFilter === seg ? '#fff' : 'transparent',
                color: segmentFilter === seg ? 'var(--navy)' : '#9CA3AF',
                boxShadow: segmentFilter === seg ? 'var(--shadow-sm)' : 'none',
              }}>
                {seg} <span style={{ opacity: 0.65 }}>({segmentCounts[seg]})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>Loading...</div>
      ) : visibleCustomers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>
          <Users size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>
            {segmentFilter !== 'All' ? `No ${segmentFilter} customers yet` : 'No customers yet'}
          </div>
          <div style={{ fontSize: 14 }}>
            {segmentFilter !== 'All' ? 'Try a different filter' : 'Add your first customer to get started'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))', gap: 14 }}>
          {visibleCustomers.map((c) => {
            const sub = activeSub(c);
            const expiring = subExpiringSoon(c);
            const segment = getSegment(c);
            const hasBirthday = birthdaySoon(c);
            const selected = selectedId === c.id;
            const isChecked = selectedIds.has(c.id);
            return (
              <div key={c.id}
                onClick={selectMode ? (e) => toggleSelect(c, e) : () => setSelectedId(c.id)}
                style={{
                  background: '#fff', borderRadius: 12,
                  border: `1.5px solid ${selectMode && isChecked ? '#25D366' : selected ? 'var(--cyan)' : hasBirthday ? '#F9A8D4' : expiring ? '#FCD34D' : 'var(--border)'}`,
                  padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: selectMode && isChecked ? '0 0 0 3px rgba(37,211,102,0.15)' : selected ? '0 0 0 3px rgba(31,184,214,0.15)' : 'none',
                  position: 'relative',
                  opacity: selectMode && !c.phone ? 0.5 : 1,
                }}>

                {/* Select mode checkbox */}
                {selectMode && (
                  <div style={{ position: 'absolute', top: 10, left: 12, zIndex: 1 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isChecked ? '#25D366' : '#D1D5DB'}`, background: isChecked ? '#25D366' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isChecked && <CheckCircle size={12} color="#fff" />}
                    </div>
                  </div>
                )}

                {/* Top badges */}
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                  {hasBirthday && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#FCE7F3', color: '#BE185D', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
                      <Gift size={9} />BIRTHDAY
                    </div>
                  )}
                  {expiring && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#FFFBEB', color: '#D97706', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
                      <AlertTriangle size={9} />EXPIRING
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, background: selected ? 'var(--cyan)' : 'var(--navy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0, transition: 'background 0.15s' }}>
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: segment.bg, color: segment.color }}>{segment.label}</span>
                      {c.totalSpent > 0 && <span style={{ fontSize: 11, color: '#6B7280' }}>· {fmt(c.totalSpent)}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {c.phone && !selectMode && (
                      <button onClick={(e) => { e.stopPropagation(); const p = normalizePhone(c.phone); if (p) window.open(`https://wa.me/${p}?text=${encodeURIComponent(`Hi ${c.name.split(' ')[0]}! `)}`, '_blank'); }}
                        title="Chat on WhatsApp" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#25D366', padding: 4 }}>
                        <MessageCircle size={13} />
                      </button>
                    )}
                    <button onClick={(e) => handleEdit(c, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}><Edit2 size={13} /></button>
                    <button onClick={(e) => handleDelete(c, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 4 }}><Trash2 size={13} /></button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}><Phone size={11} />{c.phone}</div>}
                  {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}><Mail size={11} />{c.email}</div>}
                </div>

                {sub && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#059669', fontWeight: 600 }}>
                    <Zap size={10} />{sub.planName} · {Math.max(0, daysFromNow(sub.expiryDate))}d left
                  </div>
                )}
                {!sub && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {c.visitCount || 0} visits{c.lastVisitAt ? ` · Last: ${fmtDate(c.lastVisitAt)}` : ''}
                      {(c.creditBalance || 0) > 0 && (
                        <span style={{ marginLeft: 6, color: '#DC2626', fontWeight: 700 }}>· Udhar {fmt(c.creditBalance)}</span>
                      )}
                    </span>
                    {c.phone && (
                      <button onClick={(e) => sendOffer(c, e)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#DCFCE7', color: '#16A34A', border: 'none', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        <Send size={10} /> Offer
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={setPage}
          label="customers"
        />
      )}

      {/* Modals */}
      {modal && (
        <CustomerModal
          customer={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
          isGym={GYM_TYPES.includes(tenant?.businessType)}
        />
      )}

      {/* 360° slide-over */}
      {!selectMode && selectedId && (
        <CustomerPanel
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onEdit={(c) => { setSelectedId(null); setModal(c); }}
        />
      )}

      {/* Floating broadcast bar */}
      {selectMode && selectedIds.size > 0 && !showCompose && !broadcastRecipients && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy)', color: '#fff', borderRadius: 16, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.35)', zIndex: 300, whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, background: '#25D366', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedIds.size} customer{selectedIds.size !== 1 ? 's' : ''} selected</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                {customers.filter(c => selectedIds.has(c.id) && c.phone).length} have phone numbers
              </div>
            </div>
          </div>
          <button onClick={openBroadcast}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            <MessageCircle size={15} /> Compose & Send
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            Clear
          </button>
        </div>
      )}

      {/* Compose modal */}
      {showCompose && (
        <BroadcastCompose
          customers={customers.filter(c => selectedIds.has(c.id) && c.phone)}
          onClose={() => setShowCompose(false)}
          onLaunch={(recipients) => {
            setShowCompose(false);
            setBroadcastRecipients(recipients);
          }}
        />
      )}

      {/* Broadcast launcher */}
      {broadcastRecipients && (
        <BroadcastLauncher
          title={`Broadcast to ${broadcastRecipients.length} customers`}
          recipients={broadcastRecipients}
          onClose={exitSelectMode}
          onComplete={({ sent, skipped }) => {
            toast.success(`Broadcast done — ${sent} sent, ${skipped} skipped`);
            exitSelectMode();
          }}
        />
      )}
    </div>
  );
}

// ── Education / Coaching business — Students view ────────────────────────────

const EDUCATION_TYPES = ['COACHING', 'HOME_TUITION', 'MUSIC_SCHOOL', 'DANCE_ACADEMY', 'DRIVING_SCHOOL', 'COMPUTER_TRAINING'];

const EDU_FEE_STYLE = {
  PENDING: { bg: '#FFFBEB', color: '#D97706', label: 'Fee Pending' },
  PAID:    { bg: '#F0FDF4', color: '#16A34A', label: 'Paid' },
  OVERDUE: { bg: '#FEF2F2', color: '#DC2626', label: 'Overdue' },
  PARTIAL: { bg: '#EFF6FF', color: '#3B82F6', label: 'Partial' },
  WAIVED:  { bg: '#F3F4F6', color: '#6B7280', label: 'Waived' },
};
const FEE_PRIORITY = { OVERDUE: 4, PENDING: 3, PARTIAL: 2, PAID: 1, WAIVED: 0 };
const fmtRupee = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const CLASS_OPTIONS = [
  'Nursery', 'KG / LKG / UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 (Science)', 'Class 11 (Commerce)', 'Class 11 (Arts)',
  'Class 12 (Science)', 'Class 12 (Commerce)', 'Class 12 (Arts)',
  'Graduation', 'Post-Graduation', 'Other',
];

const BOARD_OPTIONS = [
  'CBSE', 'ICSE / ISC', 'IGCSE', 'IB (International Baccalaureate)',
  'Maharashtra Board (SSC/HSC)', 'UP Board', 'MP Board',
  'Rajasthan Board', 'Karnataka Board', 'Tamil Nadu Board (TNBSE)',
  'West Bengal Board', 'Bihar Board', 'Gujarat Board', 'Haryana Board',
  'Delhi Board (DSSSB)', 'Other State Board',
];

const parseCourse = (courseStr) => {
  if (!courseStr) return { classLevel: '', board: '', selectedSubjects: [] };
  const [classPart = '', subjectPart = ''] = courseStr.split(' — ');
  const boardMatch = classPart.match(/\(([^)]+)\)/);
  const board = boardMatch ? boardMatch[1] : '';
  const classLevel = boardMatch ? classPart.replace(` (${board})`, '').trim() : classPart.trim();
  const selectedSubjects = subjectPart ? subjectPart.split(', ').map(s => s.trim()).filter(Boolean) : [];
  return { classLevel, board, selectedSubjects };
};

function EditStudentModal({ student, fee, onClose, onSaved }) {
  const { tenant } = useAuth();
  const configuredSubjects = Array.isArray(tenant?.receiptConfig?.subjects)
    ? tenant.receiptConfig.subjects.filter(Boolean)
    : [];
  const hasSubjects = configuredSubjects.length > 0;

  const parsed = parseCourse(student.course);

  const [form, setForm] = useState({
    name: student.name || '',
    phone: student.phone || '',
    email: student.email || '',
    parentName: student.parentName || '',
    parentPhone: student.parentPhone || '',
    classLevel: parsed.classLevel,
    board: parsed.board,
    selectedSubjects: parsed.selectedSubjects,
    customSubject: '',
    batch: student.batch || '',
    isActive: student.isActive !== false,
  });

  const canEditFee = fee && ['PENDING', 'PARTIAL', 'OVERDUE'].includes(fee.status);
  const [feeForm, setFeeForm] = useState({
    edit: canEditFee,
    addNew: false,
    description: fee?.description || '',
    amount: fee ? String(fee.amount || '') : '',
    discount: fee ? String(fee.discount || '') : '',
    dueDate: fee?.dueDate ? fee.dueDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  });

  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setFee = (k) => (e) => setFeeForm(f => ({ ...f, [k]: e.target.value }));

  const toggleSubject = (s) => setForm(f => ({
    ...f,
    selectedSubjects: f.selectedSubjects.includes(s)
      ? f.selectedSubjects.filter(x => x !== s)
      : [...f.selectedSubjects, s],
  }));

  const buildCourse = () => {
    const allSubjects = [
      ...form.selectedSubjects,
      ...(form.customSubject.trim() ? [form.customSubject.trim()] : []),
    ];
    const classInfo = [form.classLevel, form.board ? `(${form.board})` : ''].filter(Boolean).join(' ');
    return [classInfo, allSubjects.join(', ')].filter(Boolean).join(' — ');
  };

  const netFee = feeForm.amount
    ? Math.max(0, Number(feeForm.amount) - (Number(feeForm.discount) || 0))
    : 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Student name is required');
    if ((feeForm.edit || feeForm.addNew) && !feeForm.description.trim())
      return toast.error('Fee description is required');
    if ((feeForm.edit || feeForm.addNew) && (!feeForm.amount || Number(feeForm.amount) <= 0))
      return toast.error('Enter a valid fee amount');

    setLoading(true);
    try {
      const course = buildCourse() || undefined;
      await updateStudent(student.id, {
        name: form.name.trim(),
        phone: form.phone || null,
        email: form.email || null,
        parentName: form.parentName || null,
        parentPhone: form.parentPhone || null,
        course: course || null,
        batch: form.batch || null,
        isActive: form.isActive,
      });

      if (feeForm.edit && fee) {
        await updateFee(fee.id, {
          description: feeForm.description,
          amount: Number(feeForm.amount),
          discount: Number(feeForm.discount) || 0,
          dueDate: feeForm.dueDate,
        });
      } else if (feeForm.addNew) {
        await createFee({
          studentId: student.id,
          description: feeForm.description,
          amount: Number(feeForm.amount),
          discount: Number(feeForm.discount) || 0,
          dueDate: feeForm.dueDate,
        });
      }

      toast.success('Student updated');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update student');
    } finally { setLoading(false); }
  };

  const SecHead = ({ icon: Icon, color, title, note, right }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 9, borderBottom: '1.5px solid #E5E7EB' }}>
      <div style={{ width: 24, height: 24, background: color, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} color="#fff" />
      </div>
      <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
      {note && <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>{note}</span>}
      {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
    </div>
  );

  const SelectField = ({ label, value, onChange, options, placeholder }) => (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
      <select value={value} onChange={onChange} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: '#fff', color: value ? 'var(--ink)' : '#9CA3AF' }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const coursePreview = buildCourse();
  const FEE_STATUS_LABEL = { PENDING: 'Fee Pending', PAID: 'Paid', OVERDUE: 'Overdue', PARTIAL: 'Partial', WAIVED: 'Waived' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', padding: 32 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--navy)', margin: 0 }}>Edit Student</h2>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '5px 0 0' }}>Update details, subjects, or fee record</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', marginTop: 4 }}><X size={20} /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── 1. Student Details ── */}
          <div>
            <SecHead icon={GraduationCap} color="var(--navy)" title="Student Details"
              right={
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ accentColor: 'var(--emerald)' }} />
                  Active
                </label>
              }
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <Input label="Full name *" placeholder="e.g. Ananya Sharma" value={form.name} onChange={set('name')} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
                <Input label="Phone" type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
                <Input label="Email" type="email" placeholder="student@email.com" value={form.email} onChange={set('email')} />
              </div>
            </div>
          </div>

          {/* ── 2. Class, Board & Subjects ── */}
          <div>
            <SecHead icon={Calendar} color="var(--cyan)" title="Class, Board & Subjects" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
                <SelectField label="Class" value={form.classLevel} onChange={set('classLevel')} options={CLASS_OPTIONS} placeholder="— Select class —" />
                <SelectField label="Board" value={form.board} onChange={set('board')} options={BOARD_OPTIONS} placeholder="— Select board —" />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Subjects
                  {!hasSubjects && (
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginLeft: 6 }}>
                      · <a href="/settings" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>Configure in Settings →</a>
                    </span>
                  )}
                </label>
                {hasSubjects && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
                    {configuredSubjects.map(s => {
                      const on = form.selectedSubjects.includes(s);
                      return (
                        <button key={s} type="button" onClick={() => toggleSubject(s)} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 13px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          border: `1.5px solid ${on ? 'var(--navy)' : '#D1D5DB'}`,
                          background: on ? 'var(--navy)' : '#fff',
                          color: on ? '#fff' : '#6B7280',
                          transition: 'all 0.12s',
                        }}>
                          {on && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                )}
                <input type="text" value={form.customSubject} onChange={set('customSubject')}
                  placeholder={hasSubjects ? 'Add extra subject not in the list…' : 'Type subjects, e.g. Maths, Physics, Chemistry'}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>

              <Input label="Batch / Slot / Timing" placeholder="e.g. Morning 7AM, Mon–Wed–Fri" value={form.batch} onChange={set('batch')} />

              {coursePreview && (
                <div style={{ background: '#F0F9FF', borderRadius: 8, padding: '9px 14px', border: '1px solid #BAE6FD', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Saved as</span>
                  <span style={{ color: '#0C4A6E', fontWeight: 500 }}>{coursePreview}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── 3. Parent / Guardian ── */}
          <div>
            <SecHead icon={Users} color="#6B7280" title="Parent / Guardian" note="· for WhatsApp reminders" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
              <Input label="Parent name" placeholder="e.g. Rajesh Sharma" value={form.parentName} onChange={set('parentName')} />
              <Input label="Parent phone" type="tel" placeholder="9876543210" value={form.parentPhone} onChange={set('parentPhone')} />
            </div>
          </div>

          {/* ── 4. Fee ── */}
          <div>
            <SecHead icon={IndianRupee} color="var(--emerald)" title="Fee Record" />

            {/* Existing fee summary */}
            {fee && !feeForm.addNew && (
              <div style={{ background: '#F9FAFB', borderRadius: 10, border: '1px solid var(--border)', padding: '12px 16px', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{fee.description || 'Fee record'}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    background: EDU_FEE_STYLE[fee.status]?.bg, color: EDU_FEE_STYLE[fee.status]?.color,
                  }}>{FEE_STATUS_LABEL[fee.status] || fee.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6B7280' }}>
                  <span>Amount: <strong style={{ color: 'var(--navy)' }}>₹{(fee.amount || 0).toLocaleString('en-IN')}</strong></span>
                  {fee.discount > 0 && <span>Discount: <strong>₹{fee.discount.toLocaleString('en-IN')}</strong></span>}
                  <span>Net: <strong style={{ color: 'var(--navy)' }}>₹{(fee.netAmount || fee.amount || 0).toLocaleString('en-IN')}</strong></span>
                  {fee.paidAmount > 0 && <span>Paid: <strong style={{ color: '#16A34A' }}>₹{fee.paidAmount.toLocaleString('en-IN')}</strong></span>}
                </div>
                {!canEditFee && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#9CA3AF' }}>
                    {fee.status === 'PAID' ? 'This fee has been paid — cannot edit.' : 'This fee cannot be edited in its current state.'}
                    {' '}
                    <button type="button" onClick={() => setFeeForm(f => ({ ...f, addNew: true }))}
                      style={{ background: 'none', border: 'none', color: 'var(--cyan)', fontSize: 11, cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                      + Add new fee record
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Editable fee fields */}
            {(feeForm.edit || feeForm.addNew) && (
              <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 16, border: '1px solid #BBF7D0', display: 'flex', flexDirection: 'column', gap: 13 }}>
                {feeForm.addNew && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Fee Record</span>
                    <button type="button" onClick={() => setFeeForm(f => ({ ...f, addNew: false }))}
                      style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 11 }}>Cancel</button>
                  </div>
                )}
                <Input label="Fee description *" placeholder="e.g. Monthly Tuition Fee — June 2026" value={feeForm.description} onChange={setFee('description')} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 13 }}>
                  <Input label="Amount (₹) *" type="number" min="1" placeholder="3000" value={feeForm.amount} onChange={setFee('amount')} />
                  <Input label="Discount (₹)" type="number" min="0" placeholder="0" value={feeForm.discount} onChange={setFee('discount')} />
                  <Input label="Due date *" type="date" value={feeForm.dueDate} onChange={setFee('dueDate')} />
                </div>
                {feeForm.amount > 0 && (
                  <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Net payable after discount</span>
                    <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>₹{netFee.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            )}

            {!fee && !feeForm.addNew && (
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>No fee records yet</span>
                <button type="button" onClick={() => setFeeForm(f => ({ ...f, addNew: true, edit: false }))}
                  style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  + Add Fee
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px solid #E5E7EB' }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddStudentModal({ onClose, onAdded }) {
  const { tenant } = useAuth();
  const configuredSubjects = Array.isArray(tenant?.receiptConfig?.subjects)
    ? tenant.receiptConfig.subjects.filter(Boolean)
    : [];
  const hasSubjects = configuredSubjects.length > 0;

  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    parentName: '', parentPhone: '',
    classLevel: '', board: '',
    selectedSubjects: [], customSubject: '',
    batch: '',
    setupFee: true,
    feeDescription: '',
    feeAmount: '',
    feeDiscount: '',
    feeDueDate: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setCheck = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.checked }));

  const toggleSubject = (s) => setForm(f => ({
    ...f,
    selectedSubjects: f.selectedSubjects.includes(s)
      ? f.selectedSubjects.filter(x => x !== s)
      : [...f.selectedSubjects, s],
  }));

  const netFee = form.feeAmount
    ? Math.max(0, Number(form.feeAmount) - (Number(form.feeDiscount) || 0))
    : 0;

  const buildCourse = () => {
    const allSubjects = [
      ...form.selectedSubjects,
      ...(form.customSubject.trim() ? [form.customSubject.trim()] : []),
    ];
    const classInfo = [
      form.classLevel,
      form.board ? `(${form.board})` : '',
    ].filter(Boolean).join(' ');
    return [classInfo, allSubjects.join(', ')].filter(Boolean).join(' — ');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Student name is required');
    if (form.setupFee && (!form.feeAmount || Number(form.feeAmount) <= 0))
      return toast.error('Enter a valid fee amount');
    if (form.setupFee && !form.feeDescription.trim())
      return toast.error('Fee description is required');
    setLoading(true);
    try {
      const course = buildCourse() || undefined;
      const res = await createStudent({
        name: form.name.trim(),
        ...(form.phone && { phone: form.phone }),
        ...(form.email && { email: form.email }),
        ...(form.parentName && { parentName: form.parentName }),
        ...(form.parentPhone && { parentPhone: form.parentPhone }),
        ...(course && { course }),
        ...(form.batch && { batch: form.batch }),
      });
      const student = res.data.data;
      if (form.setupFee && form.feeAmount) {
        await createFee({
          studentId: student.id,
          description: form.feeDescription,
          amount: Number(form.feeAmount),
          discount: form.feeDiscount ? Number(form.feeDiscount) : 0,
          dueDate: form.feeDueDate,
        });
      }
      toast.success(`${form.name.split(' ')[0]} enrolled successfully!`);
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enrol student');
    } finally { setLoading(false); }
  };

  const SecHead = ({ icon: Icon, color, title, note, right }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 9, borderBottom: '1.5px solid #E5E7EB' }}>
      <div style={{ width: 24, height: 24, background: color, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} color="#fff" />
      </div>
      <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
      {note && <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>{note}</span>}
      {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
    </div>
  );

  const SelectField = ({ label, value, onChange, options, placeholder }) => (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
      <select value={value} onChange={onChange} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: '#fff', color: value ? 'var(--ink)' : '#9CA3AF' }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const coursePreview = buildCourse();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', padding: 32 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--navy)', margin: 0 }}>Enrol New Student</h2>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '5px 0 0' }}>All details set once — linked to fees, reminders & reports automatically</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', marginTop: 4 }}><X size={20} /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── 1. Student Details ── */}
          <div>
            <SecHead icon={GraduationCap} color="var(--navy)" title="Student Details" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <Input label="Full name *" placeholder="e.g. Ananya Sharma" value={form.name} onChange={set('name')} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
                <Input label="Phone" type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
                <Input label="Email" type="email" placeholder="student@email.com" value={form.email} onChange={set('email')} />
              </div>
            </div>
          </div>

          {/* ── 2. Class, Board & Subjects ── */}
          <div>
            <SecHead icon={Calendar} color="var(--cyan)" title="Class, Board & Subjects" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Class + Board */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
                <SelectField label="Class" value={form.classLevel} onChange={set('classLevel')} options={CLASS_OPTIONS} placeholder="— Select class —" />
                <SelectField label="Board" value={form.board} onChange={set('board')} options={BOARD_OPTIONS} placeholder="— Select board —" />
              </div>

              {/* Subjects multi-select */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Subjects
                  {!hasSubjects && (
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginLeft: 6 }}>
                      · <a href="/settings" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>Configure in Settings →</a>
                    </span>
                  )}
                </label>

                {hasSubjects && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
                    {configuredSubjects.map(s => {
                      const on = form.selectedSubjects.includes(s);
                      return (
                        <button key={s} type="button" onClick={() => toggleSubject(s)} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 13px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          border: `1.5px solid ${on ? 'var(--navy)' : '#D1D5DB'}`,
                          background: on ? 'var(--navy)' : '#fff',
                          color: on ? '#fff' : '#6B7280',
                          transition: 'all 0.12s',
                        }}>
                          {on && (
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                )}

                <input
                  type="text"
                  value={form.customSubject}
                  onChange={set('customSubject')}
                  placeholder={hasSubjects ? 'Add extra subject not in the list…' : 'Type subjects, e.g. Maths, Physics, Chemistry'}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* Batch / timing */}
              <Input label="Batch / Slot / Timing" placeholder="e.g. Morning 7AM, Mon–Wed–Fri" value={form.batch} onChange={set('batch')} />

              {/* Live course preview */}
              {coursePreview && (
                <div style={{ background: '#F0F9FF', borderRadius: 8, padding: '9px 14px', border: '1px solid #BAE6FD', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Saved as</span>
                  <span style={{ color: '#0C4A6E', fontWeight: 500 }}>{coursePreview}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── 3. Parent / Guardian ── */}
          <div>
            <SecHead icon={Users} color="#6B7280" title="Parent / Guardian" note="· for WhatsApp reminders" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
              <Input label="Parent name" placeholder="e.g. Rajesh Sharma" value={form.parentName} onChange={set('parentName')} />
              <Input label="Parent phone" type="tel" placeholder="9876543210" value={form.parentPhone} onChange={set('parentPhone')} />
            </div>
          </div>

          {/* ── 4. Fee Setup ── */}
          <div>
            <SecHead
              icon={IndianRupee} color="var(--emerald)" title="Fee Setup"
              right={
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                  <input type="checkbox" checked={form.setupFee} onChange={setCheck('setupFee')} style={{ width: 15, height: 15, accentColor: 'var(--emerald)' }} />
                  Set up now
                </label>
              }
            />
            {form.setupFee ? (
              <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 16, border: '1px solid #BBF7D0', display: 'flex', flexDirection: 'column', gap: 13 }}>
                <Input label="Fee description *" placeholder="e.g. Monthly Tuition Fee — June 2026" value={form.feeDescription} onChange={set('feeDescription')} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 13 }}>
                  <Input label="Fee amount (₹) *" type="number" min="1" placeholder="3000" value={form.feeAmount} onChange={set('feeAmount')} />
                  <Input label="Discount (₹)" type="number" min="0" placeholder="0" value={form.feeDiscount} onChange={set('feeDiscount')} />
                  <Input label="Due date *" type="date" value={form.feeDueDate} onChange={set('feeDueDate')} />
                </div>
                {form.feeAmount > 0 && (
                  <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Net payable after discount</span>
                    <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>₹{netFee.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)', fontSize: 13, color: '#9CA3AF' }}>
                Fee records can be added later from the <strong style={{ color: 'var(--navy)' }}>Fees</strong> page.
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px solid #E5E7EB' }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>
              {form.setupFee ? 'Enrol & Create Fee Record' : 'Enrol Student'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CollectStudentFeeModal({ fee, student, onClose, onCollected }) {
  const { tenant } = useAuth();
  const balance = Math.max(0, (fee.netAmount || fee.amount || 0) - (fee.paidAmount || 0));
  const [amount, setAmount] = useState(String(balance || ''));
  const [method, setMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Enter valid amount');
    setLoading(true);
    try { await collectFee(fee.id, { amount: Number(amount), method }); setDone({ amount: Number(amount), method }); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  if (done) {
    const phone = student?.phone;
    const biz = tenant?.name || 'us';
    const msg = `Hi ${student?.name || 'there'}, your payment of ₹${done.amount.toLocaleString('en-IN')} via ${done.method} for *${fee.description || 'fee'}* has been received. Thank you! — ${biz}`;
    const waUrl = phone ? `https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(msg)}` : null;
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 360, padding: 32, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={28} color="#16A34A" />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 6 }}>Payment Collected!</h3>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>₹{done.amount.toLocaleString('en-IN')} via {done.method} from {student?.name}</p>
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={onCollected}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', padding: '11px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
              <MessageCircle size={16} />Send Receipt on WhatsApp
            </a>
          )}
          <Button variant="ghost" onClick={onCollected} style={{ width: '100%' }}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 360, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Collect Fee</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          {student?.name} — <strong style={{ color: 'var(--navy)' }}>{fee.description}</strong>
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Amount (₹)" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Payment method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              {['CASH', 'UPI', 'CARD', 'BANK', 'CHEQUE'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Collect</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── UPI Payment QR Modal ─────────────────────────────────────────────────────
function UPIQRModal({ student, fee, onClose }) {
  const { tenant } = useAuth();
  const upiId = tenant?.receiptConfig?.upiId;
  const bizName = tenant?.name || 'Business';
  const balance = fee ? Math.max(0, (fee.netAmount || fee.amount || 0) - (fee.paidAmount || 0)) : 0;
  const [amount, setAmount] = useState(String(balance || ''));
  const [desc, setDesc] = useState(fee?.description || 'Tuition Fee');

  if (!upiId) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 360, width: '100%', padding: 28, textAlign: 'center' }}>
        <AlertTriangle size={36} color="#D97706" style={{ display: 'block', margin: '0 auto 12px' }} />
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--navy)', marginBottom: 8 }}>UPI ID not set</h3>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Go to <strong>Settings → Business Profile</strong> and add your UPI ID to generate payment QR codes.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={() => { onClose(); window.location.href = '/settings'; }}>Open Settings</Button>
        </div>
      </div>
    </div>
  );

  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(bizName)}&am=${Number(amount || 0).toFixed(2)}&cu=INR&tn=${encodeURIComponent(desc)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiLink)}&size=240x240&margin=14&color=0D1B2A`;

  const waPhone = student?.parentPhone || student?.phone;
  const waNum = waPhone ? `91${waPhone.replace(/\D/g, '').slice(-10)}` : null;
  const waText = `💳 *Pay via UPI — ${bizName}*\n\nDear ${student?.parentName || 'Parent'},\n\nPlease pay *₹${Number(amount || 0).toLocaleString('en-IN')}* for *${desc}* for ${student?.name}.\n\n*UPI ID:* ${upiId}\n*Payee:* ${bizName}\n\n👉 Open GPay / PhonePe / BHIM → Scan QR or pay to the UPI ID above.\n\nThank you 🙏`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, maxWidth: 420, width: '100%', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--navy)', margin: 0 }}>UPI Payment QR</h2>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>For {student?.name} · Scan with any UPI app</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        {/* Editable amount + desc */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Amount (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1"
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 15, fontWeight: 700, color: 'var(--navy)', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>For</label>
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ background: '#F8FAFC', border: '2px solid #E5E7EB', borderRadius: 18, padding: 16, marginBottom: 12 }}>
            <img src={qrUrl} alt="UPI QR Code" width={200} height={200} style={{ display: 'block', borderRadius: 8 }} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--navy)', fontSize: 15, marginBottom: 3 }}>{upiId}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', gap: 8 }}>
            {['GPay', 'PhonePe', 'BHIM', 'Paytm'].map(app => (
              <span key={app} style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{app}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {waNum && (
            <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', background: '#25D366', color: '#fff', borderRadius: 11, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              <MessageCircle size={16} /> Send UPI Details on WhatsApp
            </a>
          )}
          <a href={qrUrl} download={`UPI-QR-${student?.name || 'student'}.png`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0', background: 'var(--navy)', color: '#fff', borderRadius: 11, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
            ⬇ Download QR Image
          </a>
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9, padding: '10px 14px', fontSize: 12, color: '#92400E', lineHeight: 1.55 }}>
            💡 <strong>Share the QR:</strong> Download → open WhatsApp chat → send as photo. Parent opens it in any UPI app to pay instantly.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Student Broadcast Compose ─────────────────────────────────────────────────
const STUDENT_TEMPLATES = [
  {
    label: 'Fee Reminder', emoji: '📚', color: '#D97706',
    text: `📚 *Fee Reminder — {{business}}*\n\nDear {{parent_name}},\n\nThis is a gentle reminder that *{{student_name}}*'s fee of *₹{{balance}}* for *{{fee_desc}}* is due on *{{due_date}}*.\n\nPlease pay at the earliest.\n\n*UPI ID:* {{upi_id}}\n\nThank you 🙏\n— {{business}}`,
  },
  {
    label: 'Overdue Notice', emoji: '⚠️', color: '#DC2626',
    text: `⚠️ *Fee Overdue — {{business}}*\n\nDear {{parent_name}},\n\n*{{student_name}}*'s fee of *₹{{balance}}* for *{{fee_desc}}* was due on *{{due_date}}* and is now overdue.\n\nKindly clear the dues immediately to avoid disruption to classes.\n\n*UPI ID:* {{upi_id}}\n\n— {{business}}`,
  },
  {
    label: 'General Notice', emoji: '📢', color: '#6B7280',
    text: `📢 *Notice from {{business}}*\n\nDear {{parent_name}},\n\n[Type your message here]\n\nRegards,\n{{business}}`,
  },
  {
    label: 'Holiday / Schedule', emoji: '🗓️', color: '#7C3AED',
    text: `🗓️ *Schedule Update — {{business}}*\n\nDear {{parent_name}},\n\nThis is to inform you about an upcoming schedule change or holiday for *{{student_name}}*'s batch.\n\n[Add details here]\n\nFor queries, reply to this message.\n— {{business}}`,
  },
];

function StudentBroadcastCompose({ students, feeMap, onClose, onLaunch }) {
  const { tenant } = useAuth();
  const upiId = tenant?.receiptConfig?.upiId || '';
  const bizName = tenant?.name || 'Business';
  const [tplIdx, setTplIdx] = useState(0);
  const [message, setMessage] = useState(STUDENT_TEMPLATES[0].text);

  const resolve = (template, s) => {
    const fee = feeMap[s.id];
    const balance = fee ? Math.max(0, (fee.netAmount || fee.amount || 0) - (fee.paidAmount || 0)) : 0;
    const dueDate = fee?.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    return template
      .replace(/\{\{business\}\}/g, bizName)
      .replace(/\{\{student_name\}\}/g, s.name || '')
      .replace(/\{\{parent_name\}\}/g, s.parentName || s.name?.split(' ')[0] || 'Parent')
      .replace(/\{\{balance\}\}/g, balance.toLocaleString('en-IN'))
      .replace(/\{\{fee_desc\}\}/g, fee?.description || 'Tuition Fee')
      .replace(/\{\{due_date\}\}/g, dueDate)
      .replace(/\{\{upi_id\}\}/g, upiId || 'Not set');
  };

  const preview = students[0] ? resolve(message, students[0]) : message;
  const withPhone = students.filter(s => s.parentPhone || s.phone);

  const launch = () => {
    if (!message.trim()) { toast.error('Message is empty'); return; }
    const recipients = withPhone.map(s => ({
      id: s.id, name: s.name,
      phone: s.parentPhone || s.phone,
      message: resolve(message, s),
    }));
    onLaunch(recipients);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600, padding: 28, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--navy)', margin: 0 }}>WhatsApp Broadcast</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>
              Sending to {students.length} student{students.length !== 1 ? 's' : ''} · {withPhone.length} have phone numbers
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        {/* Template picker */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 9 }}>Message template</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {STUDENT_TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => { setTplIdx(i); setMessage(t.text); }}
                style={{
                  padding: '5px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  border: `1.5px solid ${tplIdx === i ? t.color : '#E5E7EB'}`,
                  background: tplIdx === i ? `${t.color}15` : '#fff',
                  color: tplIdx === i ? t.color : '#6B7280',
                }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template variable legend */}
        <div style={{ background: '#F0F9FF', borderRadius: 9, padding: '9px 14px', marginBottom: 14, fontSize: 12, color: '#0369A1' }}>
          <strong>Smart variables</strong> — auto-filled per student: &nbsp;
          {['{{student_name}}', '{{parent_name}}', '{{balance}}', '{{due_date}}', '{{fee_desc}}', '{{upi_id}}'].map(v => (
            <code key={v} style={{ background: '#BAE6FD', padding: '1px 6px', borderRadius: 4, marginRight: 4, fontSize: 11, fontWeight: 600 }}>{v}</code>
          ))}
        </div>

        {/* Message editor */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Message</div>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={9}
            style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, resize: 'vertical', fontFamily: 'var(--font-body)', boxSizing: 'border-box', lineHeight: 1.65 }} />
        </div>

        {/* Live preview */}
        {students[0] && (
          <div style={{ marginBottom: 18, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 11, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Preview — {students[0].parentName || students[0].name}
            </div>
            <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{preview}</div>
          </div>
        )}

        {/* Recipients */}
        <div style={{ marginBottom: 18, border: '1px solid var(--border)', borderRadius: 10, maxHeight: 140, overflowY: 'auto' }}>
          {students.map(s => {
            const ph = s.parentPhone || s.phone;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ width: 28, height: 28, background: ph ? 'var(--navy)' : '#D1D5DB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {s.name[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{s.name}</div>
                  {s.parentName && <div style={{ fontSize: 11, color: '#9CA3AF' }}>Parent: {s.parentName}</div>}
                </div>
                <div style={{ fontSize: 12, color: ph ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                  {ph || 'No phone'}
                </div>
              </div>
            );
          })}
        </div>

        {!upiId && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9, padding: '9px 14px', marginBottom: 14, fontSize: 12, color: '#92400E' }}>
            ⚠️ <strong>UPI ID not set</strong> — {{upi_id}} will show "Not set" in messages.{' '}
            <a href="/settings" style={{ color: '#D97706', fontWeight: 700 }}>Set it in Settings →</a>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <button onClick={launch}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            <Send size={15} /> Send to {withPhone.length} on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentsView() {
  const { isMobile } = useBreakpoint();
  const { tenant } = useAuth();
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [collectItem, setCollectItem] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastRecipients, setBroadcastRecipients] = useState(null);
  const [showUPIQR, setShowUPIQR] = useState(null);

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };
  const quickSelectFilter = (cond) => {
    setSelectedIds(new Set(filtered.filter(cond).map(s => s.id)));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sr, fr] = await Promise.all([getStudents(), getFees()]);
      setStudents(sr.data.data || []);
      setFees(fr.data.data || []);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const feeMap = {};
  fees.forEach(f => {
    const cur = feeMap[f.studentId];
    if (!cur || (FEE_PRIORITY[f.status] || 0) > (FEE_PRIORITY[cur.status] || 0)) feeMap[f.studentId] = f;
  });

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthCollected = fees
    .filter(f => f.status === 'PAID' && f.paidAt && new Date(f.paidAt) >= monthStart)
    .reduce((s, f) => s + (f.paidAmount || 0), 0);
  const dueFees = fees.filter(f => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(f.status));

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      s.name.toLowerCase().includes(q) ||
      (s.phone || '').includes(q) ||
      (s.course || '').toLowerCase().includes(q);
    const fee = feeMap[s.id];
    const matchFilter =
      filter === 'ALL'     ? true :
      filter === 'ACTIVE'  ? s.isActive :
      filter === 'FEE_DUE' ? (fee && ['PENDING', 'PARTIAL', 'OVERDUE'].includes(fee.status)) : true;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Students</h1>
          <p style={P.sub}>{students.length} enrolled · {students.filter(s => s.isActive).length} active</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {selectMode ? (
            <button onClick={exitSelectMode}
              style={{ padding: '9px 18px', borderRadius: 9, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer' }}>
              Cancel
            </button>
          ) : (
            <button onClick={() => setSelectMode(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, border: '1.5px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, color: 'var(--navy)', cursor: 'pointer' }}>
              <CheckCircle size={14} /> Select
            </button>
          )}
          {!selectMode && <Button onClick={() => setShowAdd(true)}><Plus size={15} style={{ marginRight: 6 }} />Add Student</Button>}
        </div>
      </div>

      {/* Quick-select chips — visible in select mode */}
      {selectMode && (
        <div style={{ background: '#F0F9FF', borderRadius: 11, padding: '12px 16px', marginBottom: 20, border: '1px solid #BAE6FD' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 9 }}>Quick Select</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {[
              { label: 'All Students', fn: () => setSelectedIds(new Set(filtered.map(s => s.id))), color: 'var(--navy)' },
              { label: 'Fee Due / Overdue', fn: () => quickSelectFilter(s => feeMap[s.id] && ['PENDING', 'OVERDUE', 'PARTIAL'].includes(feeMap[s.id].status)), color: '#D97706' },
              { label: 'Overdue Only', fn: () => quickSelectFilter(s => feeMap[s.id]?.status === 'OVERDUE'), color: '#DC2626' },
              { label: 'Active Students', fn: () => quickSelectFilter(s => s.isActive), color: '#16A34A' },
              { label: 'No Fee Record', fn: () => quickSelectFilter(s => !feeMap[s.id]), color: '#6B7280' },
            ].map(({ label, fn, color }) => (
              <button key={label} onClick={fn}
                style={{ padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${color}30`, background: `${color}10`, color, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {label}
              </button>
            ))}
            <button onClick={() => setSelectedIds(new Set())}
              style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid #E5E7EB', background: '#fff', color: '#9CA3AF', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Clear
            </button>
          </div>
        </div>
      )}

      <KpiBar stats={[
        { label: 'Total Enrolled',     value: students.length,                              color: 'var(--cyan)',    icon: GraduationCap },
        { label: 'Active Students',    value: students.filter(s => s.isActive).length,      color: '#16A34A',       icon: CheckCircle   },
        { label: 'Collected (Month)',  value: fmtRupee(monthCollected),                     color: 'var(--emerald)',icon: IndianRupee   },
        { label: 'Fees Due / Overdue', value: dueFees.length,                               color: dueFees.some(f => f.status === 'OVERDUE') ? '#DC2626' : '#D97706', icon: AlertTriangle },
      ]} />

      {/* Search + Filter tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, course..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' }} />
        </div>
        {[['ALL', 'All'], ['ACTIVE', 'Active'], ['FEE_DUE', 'Fee Due']].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{
            padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            background: filter === id ? 'var(--navy)' : '#fff',
            color: filter === id ? '#fff' : '#6B7280',
          }}>{label}{id === 'FEE_DUE' && dueFees.length > 0 ? ` (${dueFees.length})` : ''}</button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>Loading students...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <GraduationCap size={42} style={{ display: 'block', margin: '0 auto 14px', opacity: 0.25, color: '#6B7280' }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>
            {search || filter !== 'ALL' ? 'No students match your filter' : 'No students yet'}
          </div>
          <div style={{ fontSize: 14, color: '#9CA3AF' }}>Click "Add Student" to enrol your first student.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(s => {
            const fee = feeMap[s.id];
            const fStyle = fee ? (EDU_FEE_STYLE[fee.status] || EDU_FEE_STYLE.PENDING) : null;
            const balance = fee ? Math.max(0, (fee.netAmount || fee.amount || 0) - (fee.paidAmount || 0)) : 0;
            const canCollect = fee && ['PENDING', 'PARTIAL', 'OVERDUE'].includes(fee.status);

            const isChecked = selectedIds.has(s.id);
            return (
              <div key={s.id}
                onClick={selectMode ? () => toggleSelect(s.id) : undefined}
                style={{
                  background: '#fff', borderRadius: 14, padding: '18px 20px',
                  border: `1.5px solid ${selectMode && isChecked ? '#25D366' : fee?.status === 'OVERDUE' ? '#FCA5A5' : 'var(--border)'}`,
                  boxShadow: selectMode && isChecked ? '0 0 0 3px rgba(37,211,102,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
                  cursor: selectMode ? 'pointer' : 'default',
                  transition: 'all 0.12s',
                  position: 'relative',
                }}>

                {/* Select-mode checkbox */}
                {selectMode && (
                  <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 2 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isChecked ? '#25D366' : '#D1D5DB'}`, background: isChecked ? '#25D366' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
                      {isChecked && <CheckCircle size={13} color="#fff" strokeWidth={3} />}
                    </div>
                  </div>
                )}

                {/* Avatar + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingLeft: selectMode ? 28 : 0, transition: 'padding 0.12s' }}>
                  <div style={{ width: 46, height: 46, background: s.isActive ? 'var(--navy)' : '#D1D5DB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {s.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      {[s.course, s.batch].filter(Boolean).join(' · ') || <span style={{ color: '#C4C4C4' }}>No course assigned</span>}
                    </div>
                  </div>
                  {!selectMode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      {!s.isActive && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', background: '#F3F4F6', padding: '3px 8px', borderRadius: 20 }}>INACTIVE</span>
                      )}
                      <button onClick={() => setEditItem({ student: s, fee: feeMap[s.id] || null })} title="Edit student"
                        style={{ background: '#F3F4F6', border: 'none', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
                        <Edit2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                  {s.phone && (
                    <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Phone size={11} color="#9CA3AF" />
                      <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, minWidth: 46 }}>Student</span>
                      {s.phone}
                    </div>
                  )}
                  {s.parentPhone && (
                    <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Phone size={11} color="#9CA3AF" />
                      <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, minWidth: 46 }}>Parent</span>
                      {s.parentPhone}{s.parentName ? ` (${s.parentName})` : ''}
                    </div>
                  )}
                </div>

                {/* Fee status pill */}
                {fee ? (
                  <div style={{ background: fStyle.bg, borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: fStyle.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{fStyle.label}</span>
                        {fee.description && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{fee.description}</div>}
                        {fee.dueDate && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Due {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
                      </div>
                      {balance > 0 && <span style={{ fontSize: 15, fontWeight: 700, color: fStyle.color }}>₹{balance.toLocaleString('en-IN')}</span>}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#C4C4C4', textAlign: 'center' }}>
                    No fee records yet
                  </div>
                )}

                {/* Actions — hidden in select mode */}
                {!selectMode && (() => {
                  const waPhone = s.parentPhone || s.phone;
                  const waNum = waPhone ? `91${waPhone.replace(/\D/g, '').slice(-10)}` : null;
                  const biz = tenant?.name || 'us';
                  const waMsg = canCollect
                    ? `📚 *Fee Due — ${biz}*\n\nDear ${s.parentName || 'Parent'},\n\n*${s.name}*'s ${fee?.description || 'fee'} of *₹${balance.toLocaleString('en-IN')}* is ${fee?.status === 'OVERDUE' ? 'overdue' : 'pending'}.\n\nPlease pay at the earliest.\n\n*UPI ID:* ${tenant?.receiptConfig?.upiId || '—'}\n\nThank you 🙏`
                    : `Hi from ${biz}! Please contact us for any queries about ${s.name}'s studies.`;
                  return (
                    <div style={{ display: 'flex', gap: 7 }}>
                      {canCollect ? (
                        <button onClick={() => setCollectItem({ fee, student: s })}
                          style={{ flex: 1, padding: '8px 0', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          Collect {balance > 0 ? fmtRupee(balance) : ''}
                        </button>
                      ) : (
                        <a href="/fees" style={{ flex: 1, padding: '8px 0', background: '#F3F4F6', color: '#6B7280', borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                          View Fees →
                        </a>
                      )}
                      {/* UPI QR button — shown when there is a balance to collect */}
                      {canCollect && balance > 0 && (
                        <button onClick={() => setShowUPIQR({ student: s, fee })} title="Generate UPI QR for payment"
                          style={{ width: 36, height: 36, background: '#FFF7ED', border: '1px solid #FDE68A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <QrCode size={15} color="#D97706" />
                        </button>
                      )}
                      {waNum && (
                        <button onClick={() => window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}`, '_blank')}
                          title={`WhatsApp ${s.parentName || s.name}`}
                          style={{ width: 36, height: 36, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <MessageCircle size={15} color="#16A34A" />
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Select mode — show selected state hint */}
                {selectMode && (
                  <div style={{ textAlign: 'center', fontSize: 12, color: isChecked ? '#16A34A' : '#9CA3AF', fontWeight: 600, marginTop: 4 }}>
                    {isChecked ? '✓ Selected' : 'Tap to select'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Floating broadcast bar ─────────────────────────────────────── */}
      {selectMode && selectedIds.size > 0 && !showBroadcast && !broadcastRecipients && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--navy)', color: '#fff', borderRadius: 18,
          padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)', zIndex: 300, whiteSpace: 'nowrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#25D366', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageCircle size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedIds.size} student{selectedIds.size !== 1 ? 's' : ''} selected</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                {filtered.filter(s => selectedIds.has(s.id) && (s.parentPhone || s.phone)).length} have phone · messages personalized per student
              </div>
            </div>
          </div>

          <button onClick={() => setShowBroadcast(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            <Send size={15} /> Message All on WhatsApp
          </button>

          <button onClick={() => setSelectedIds(new Set())}
            style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            Clear
          </button>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load(); }} />}
      {editItem && (
        <EditStudentModal
          student={editItem.student}
          fee={editItem.fee}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); load(); }}
        />
      )}
      {collectItem && (
        <CollectStudentFeeModal
          fee={collectItem.fee}
          student={collectItem.student}
          onClose={() => setCollectItem(null)}
          onCollected={() => { setCollectItem(null); load(); }}
        />
      )}
      {showUPIQR && (
        <UPIQRModal
          student={showUPIQR.student}
          fee={showUPIQR.fee}
          onClose={() => setShowUPIQR(null)}
        />
      )}
      {showBroadcast && (
        <StudentBroadcastCompose
          students={filtered.filter(s => selectedIds.has(s.id))}
          feeMap={feeMap}
          onClose={() => setShowBroadcast(false)}
          onLaunch={(recipients) => { setShowBroadcast(false); setBroadcastRecipients(recipients); }}
        />
      )}
      {broadcastRecipients && (
        <BroadcastLauncher
          title={`WhatsApp broadcast to ${broadcastRecipients.length} students`}
          recipients={broadcastRecipients}
          onClose={exitSelectMode}
          onComplete={({ sent, skipped }) => {
            toast.success(`Done — ${sent} sent, ${skipped} skipped`);
            exitSelectMode();
          }}
        />
      )}
    </div>
  );
}

export default function Customers() {
  const { tenant } = useAuth();
  if (EDUCATION_TYPES.includes(tenant?.businessType)) return <StudentsView />;
  return <CustomersView />;
}

