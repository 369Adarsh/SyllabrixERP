import { useState, useEffect, useCallback } from 'react';
import {
  getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomer,
  getSubscriptions, createSubscription, updateSubscriptionStatus,
  sendSubscriptionReminder, deleteSubscription, sendWAMessage, adjustCustomerCredit,
} from '../../api';
import {
  Plus, Users, Search, Edit2, Trash2, X, Phone, Mail, Star,
  ChevronRight, Gift, CreditCard, Clock, MessageSquare, Bell,
  RefreshCw, CheckCircle, XCircle, PauseCircle, Calendar, TrendingUp,
  AlertTriangle, Send, ArrowUpRight, ArrowDownRight, Zap,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const daysFromNow = (d) => Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));

const STATUS_COLORS = {
  ACTIVE: { bg: '#ECFDF5', color: '#059669', label: 'Active' },
  EXPIRED: { bg: '#FEF2F2', color: '#DC2626', label: 'Expired' },
  CANCELLED: { bg: '#F3F4F6', color: '#6B7280', label: 'Cancelled' },
  PAUSED: { bg: '#FFFBEB', color: '#D97706', label: 'Paused' },
};

const SUB_ICONS = { ACTIVE: CheckCircle, EXPIRED: XCircle, CANCELLED: XCircle, PAUSED: PauseCircle };

// ── Customer form modal ───────────────────────────────────────────────────────
function CustomerModal({ customer, onClose, onSaved }) {
  const editing = !!customer;
  const [form, setForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    notes: customer?.notes || '',
    birthday: customer?.birthday ? customer.birthday.slice(0, 10) : '',
    creditLimit: customer?.creditLimit || '',
    tags: customer?.tags?.join(', ') || '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : 0,
        birthday: form.birthday || undefined,
      };
      if (editing) { await updateCustomer(customer.id, payload); toast.success('Customer updated'); }
      else { await createCustomer(payload); toast.success('Customer added'); }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>
            {editing ? 'Edit Customer' : 'Add Customer'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Full name *" placeholder="Rahul Sharma" value={form.name} onChange={set('name')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Phone" type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
            <Input label="Email" type="email" placeholder="rahul@email.com" value={form.email} onChange={set('email')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Birthday" type="date" value={form.birthday} onChange={set('birthday')} />
            <Input label="Credit limit (Udhar)" type="number" placeholder="0" value={form.creditLimit} onChange={set('creditLimit')} />
          </div>
          <Input label="Address" placeholder="Street, City" value={form.address} onChange={set('address')} />
          <Input label="Tags (comma separated)" placeholder="vip, loyal, gym-member" value={form.tags} onChange={set('tags')} />
          <Input label="Notes" placeholder="Any remarks..." value={form.notes} onChange={set('notes')} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{editing ? 'Save changes' : 'Add customer'}</Button>
          </div>
        </form>
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
function CustomerPanel({ customerId, onClose, onEdit }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showAddSub, setShowAddSub] = useState(false);
  const [waMsg, setWaMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [creditForm, setCreditForm] = useState({ amount: '', operation: 'add' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getCustomer(customerId);
      setCustomer(r.data.data);
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

  const handleSendWA = async () => {
    if (!waMsg.trim() || !customer?.phone) return;
    setSending(true);
    try {
      await sendWAMessage({ phone: customer.phone, body: waMsg });
      toast.success('Message sent');
      setWaMsg('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSending(false); }
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

  const activeSub = customer?.subscriptions?.find((s) => s.status === 'ACTIVE');
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'subscriptions', label: `Subscriptions (${customer?.subscriptions?.length || 0})` },
    { key: 'history', label: 'History' },
    { key: 'whatsapp', label: 'WhatsApp' },
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
              <button onClick={() => onEdit(customer)} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Edit2 size={12} /> Edit
              </button>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#fff' }}><X size={16} /></button>
            </div>
          </div>

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
                <Section title="Udhar / Credit">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <StatCard label="Credit balance" value={fmt(customer.creditBalance)} color={customer.creditBalance > 0 ? '#DC2626' : '#059669'} />
                    <StatCard label="Credit limit" value={fmt(customer.creditLimit)} color="#6B7280" />
                  </div>
                  <form onSubmit={handleCredit} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <Input label="Amount" type="number" placeholder="500" value={creditForm.amount}
                        onChange={(e) => setCreditForm((f) => ({ ...f, amount: e.target.value }))} />
                    </div>
                    <select value={creditForm.operation} onChange={(e) => setCreditForm((f) => ({ ...f, operation: e.target.value }))}
                      style={{ padding: '9px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: '#fff', height: 40 }}>
                      <option value="add">Add (borrow)</option>
                      <option value="subtract">Subtract (paid)</option>
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

            /* ── WHATSAPP ── */
            ) : tab === 'whatsapp' ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {!customer.phone && (
                    <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>
                      <MessageSquare size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                      <div style={{ fontSize: 14 }}>No phone number — add one to send messages</div>
                    </div>
                  )}
                  {customer.messages?.length === 0 && customer.phone && (
                    <EmptyState icon={MessageSquare} msg="No messages yet" sub="Send the first message below" />
                  )}
                  {customer.messages?.map((msg) => (
                    <div key={msg.id} style={{
                      maxWidth: '80%', alignSelf: msg.direction === 'OUTBOUND' ? 'flex-end' : 'flex-start',
                      background: msg.direction === 'OUTBOUND' ? 'var(--cyan)' : '#F3F4F6',
                      color: msg.direction === 'OUTBOUND' ? '#fff' : '#111827',
                      padding: '10px 14px', borderRadius: msg.direction === 'OUTBOUND' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      fontSize: 13, lineHeight: 1.5,
                    }}>
                      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.body}</div>
                      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>{fmtDate(msg.createdAt)}</div>
                    </div>
                  ))}
                </div>

                {/* Send box */}
                {customer.phone && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <textarea value={waMsg} onChange={(e) => setWaMsg(e.target.value)}
                        placeholder={`Message ${customer.name}...`}
                        rows={2}
                        style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, resize: 'vertical', fontFamily: 'var(--font-body)' }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendWA(); } }}
                      />
                      <button onClick={handleSendWA} disabled={sending || !waMsg.trim()}
                        style={{ background: 'var(--cyan)', border: 'none', borderRadius: 10, padding: '0 16px', cursor: 'pointer', color: '#fff', opacity: (!waMsg.trim() || sending) ? 0.5 : 1 }}>
                        <Send size={16} />
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Enter to send · Shift+Enter for new line</div>
                  </div>
                )}
              </div>
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
export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const r = await getCustomers(params);
      setCustomers(r.data.data || []);
    } catch {
      toast.error('Failed to load customers');
    } finally { setLoading(false); }
  }, [search]);

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

  const activeSub = (c) => c.subscriptions?.find((s) => s.status === 'ACTIVE');
  const subExpiringSoon = (c) => {
    const sub = activeSub(c);
    return sub && daysFromNow(sub.expiryDate) <= 7;
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: selectedId ? 680 : 1080, transition: 'max-width 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Customers</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>{customers.length} customers · click a card for full profile</p>
        </div>
        <Button onClick={() => setModal('create')}><Plus size={16} style={{ marginRight: 6 }} />Add Customer</Button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 420 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, email..."
          style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' }} />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>Loading...</div>
      ) : customers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>
          <Users size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>No customers yet</div>
          <div style={{ fontSize: 14 }}>Add your first customer to get started</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
          {customers.map((c) => {
            const sub = activeSub(c);
            const expiring = subExpiringSoon(c);
            const selected = selectedId === c.id;
            return (
              <div key={c.id} onClick={() => setSelectedId(c.id)}
                style={{
                  background: '#fff', borderRadius: 12, border: `1.5px solid ${selected ? 'var(--cyan)' : expiring ? '#FCD34D' : 'var(--border)'}`,
                  padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: selected ? '0 0 0 3px rgba(31,184,214,0.15)' : expiring ? '0 0 0 3px rgba(252,211,77,0.2)' : 'none',
                  position: 'relative',
                }}>
                {expiring && (
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 4, background: '#FFFBEB', color: '#D97706', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                    <AlertTriangle size={9} />EXPIRING SOON
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, background: selected ? 'var(--cyan)' : 'var(--navy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0, transition: 'background 0.15s' }}>
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    {c.totalSpent > 0 && <div style={{ fontSize: 12, color: '#6B7280' }}>Spent {fmt(c.totalSpent)}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={(e) => handleEdit(c, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}><Edit2 size={13} /></button>
                    <button onClick={(e) => handleDelete(c, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 4 }}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}><Phone size={11} />{c.phone}</div>}
                  {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}><Mail size={11} />{c.email}</div>}
                </div>
                {sub && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#059669', fontWeight: 600 }}>
                    <Zap size={10} />{sub.planName} · {Math.max(0, daysFromNow(sub.expiryDate))}d left
                  </div>
                )}
                {!sub && c.visitCount > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF' }}>
                    <span>{c.visitCount} visits</span>
                    {c.lastVisitAt && <span>Last: {fmtDate(c.lastVisitAt)}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modal && (
        <CustomerModal
          customer={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {/* 360° slide-over */}
      {selectedId && (
        <CustomerPanel
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onEdit={(c) => { setSelectedId(null); setModal(c); }}
        />
      )}
    </div>
  );
}
