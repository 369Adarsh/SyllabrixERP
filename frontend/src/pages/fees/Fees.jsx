import { useState, useEffect, useCallback } from 'react';
import { getStudents, createStudent, getFees, createFee, collectFee, getOverdueFees, sendWAFeeReminder, bulkWAFeeReminders } from '../../api';
import { Plus, GraduationCap, Search, X, AlertTriangle, IndianRupee, CheckCircle, MessageCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  PENDING:  { bg: '#FFFBEB', color: '#D97706', label: 'Pending' },
  PAID:     { bg: '#F0FDF4', color: '#16A34A', label: 'Paid' },
  OVERDUE:  { bg: '#FEF2F2', color: '#DC2626', label: 'Overdue' },
  WAIVED:   { bg: '#F3F4F6', color: '#6B7280', label: 'Waived' },
  PARTIAL:  { bg: '#EFF6FF', color: '#3B82F6', label: 'Partial' },
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function Badge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.label}</span>;
}

function AddStudentModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', course: '', batchTime: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setLoading(true);
    try {
      await createStudent(form);
      toast.success('Member added');
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Add Member</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Full name *" placeholder="Vikas Yadav" value={form.name} onChange={set('name')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Phone" type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
            <Input label="Email" type="email" placeholder="vikas@email.com" value={form.email} onChange={set('email')} />
          </div>
          <Input label="Plan / Course" placeholder="e.g. Monthly Membership, Weight Loss" value={form.course} onChange={set('course')} />
          <Input label="Batch / Slot" placeholder="e.g. Morning 6AM, Evening 6PM" value={form.batchTime} onChange={set('batchTime')} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Add member</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateFeeModal({ students, onClose, onCreated }) {
  const [form, setForm] = useState({ studentId: '', description: '', amount: '', dueDate: '', period: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.amount || !form.dueDate) return toast.error('Member, amount and due date are required');
    setLoading(true);
    try {
      await createFee({ studentId: form.studentId, description: form.description, amount: Number(form.amount), dueDate: form.dueDate, period: form.period });
      toast.success('Fee created');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Create Fee</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Member *</label>
            <select value={form.studentId} onChange={set('studentId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              <option value="">Select member</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Input label="Description" placeholder="e.g. Monthly gym fee - June 2025" value={form.description} onChange={set('description')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Amount (₹) *" type="number" min="1" value={form.amount} onChange={set('amount')} placeholder="2000" />
            <Input label="Due date *" type="date" value={form.dueDate} onChange={set('dueDate')} />
          </div>
          <Input label="Period (optional)" placeholder="e.g. June 2025" value={form.period} onChange={set('period')} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create fee</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CollectModal({ fee, onClose, onCollected }) {
  const balance = (fee.netAmount || fee.amount || 0) - (fee.paidAmount || 0);
  const [amount, setAmount] = useState(String(balance || fee.amount || ''));
  const [method, setMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Enter valid amount');
    setLoading(true);
    try {
      await collectFee(fee.id, { amount: Number(amount), method });
      toast.success('Payment collected!');
      onCollected();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Collect Fee</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          {fee.student?.name} — <strong style={{ color: 'var(--navy)' }}>{fee.description}</strong>
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

export default function Fees() {
  const [tab, setTab] = useState('fees'); // 'fees' | 'members'
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'student' | 'fee' | fee-object
  const [collectFeeItem, setCollectFeeItem] = useState(null);

  const loadFees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [fr, sr, or_] = await Promise.all([getFees(params), getStudents(), getOverdueFees()]);
      setFees(fr.data.data || []);
      setStudents(sr.data.data || []);
      setOverdue(or_.data.data || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { loadFees(); }, [loadFees]);

  const totalCollected = fees.filter(f => ['PAID', 'PARTIAL'].includes(f.status)).reduce((s, f) => s + (f.paidAmount || 0), 0);
  const totalPending = fees.filter(f => ['PENDING', 'PARTIAL'].includes(f.status)).reduce((s, f) => s + ((f.amount || 0) - (f.paidAmount || 0)), 0);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Fees</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>{students.length} members, {fees.length} fee records</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={() => setModal('student')}><Plus size={15} style={{ marginRight: 5 }} />Add Member</Button>
          <Button onClick={() => setModal('fee')}><Plus size={15} style={{ marginRight: 5 }} />Create Fee</Button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Members', value: students.length, color: 'var(--cyan)', icon: GraduationCap },
          { label: 'Collected', value: fmt(totalCollected), color: '#16A34A', icon: CheckCircle },
          { label: 'Pending', value: fmt(totalPending), color: '#D97706', icon: IndianRupee },
          { label: 'Overdue', value: overdue.length, color: '#DC2626', icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, background: color + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#F3F4F6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ id: 'fees', label: 'Fee Records' }, { id: 'members', label: 'Members' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            background: tab === t.id ? '#fff' : 'transparent',
            color: tab === t.id ? 'var(--navy)' : '#6B7280',
            boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'fees' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by member name..."
                style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              <option value="">All status</option>
              {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
            </select>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                  {['Member', 'Description', 'Amount', 'Paid', 'Due Date', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
                ) : fees.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>No fee records yet</td></tr>
                ) : fees.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500 }}>{f.student?.name || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{f.description || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600 }}>{fmt(f.amount)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#16A34A', fontWeight: 600 }}>{fmt(f.paidAmount)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{fmtDate(f.dueDate)}</td>
                    <td style={{ padding: '14px 16px' }}><Badge status={f.status} /></td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {['PENDING', 'PARTIAL', 'OVERDUE'].includes(f.status) && (
                          <button onClick={() => setCollectFeeItem(f)} style={{ fontSize: 13, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                            Collect
                          </button>
                        )}
                        {(f.student?.phone || f.student?.parentPhone) && ['PENDING', 'PARTIAL', 'OVERDUE'].includes(f.status) && (
                          <button
                            onClick={async () => { try { await sendWAFeeReminder(f.id); toast.success('Reminder sent via WhatsApp'); } catch { toast.error('Failed to send'); } }}
                            title="Send WhatsApp Reminder"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#25D366', padding: 2 }}
                          >
                            <MessageCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'members' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {students.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 64, color: '#9CA3AF' }}>
              <GraduationCap size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>No members yet</div>
              <div style={{ fontSize: 14 }}>Add your first gym member</div>
            </div>
          ) : students.map(s => (
            <div key={s.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, background: 'var(--navy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  {s.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--navy)' }}>{s.name}</div>
                  {s.course && <div style={{ fontSize: 12, color: '#6B7280' }}>{s.course}</div>}
                </div>
              </div>
              {s.phone && <div style={{ fontSize: 13, color: '#6B7280' }}>{s.phone}</div>}
              {s.batchTime && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{s.batchTime}</div>}
            </div>
          ))}
        </div>
      )}

      {modal === 'student' && <AddStudentModal onClose={() => setModal(null)} onAdded={() => { setModal(null); loadFees(); }} />}
      {modal === 'fee' && <CreateFeeModal students={students} onClose={() => setModal(null)} onCreated={() => { setModal(null); loadFees(); }} />}
      {collectFeeItem && <CollectModal fee={collectFeeItem} onClose={() => setCollectFeeItem(null)} onCollected={() => { setCollectFeeItem(null); loadFees(); }} />}
    </div>
  );
}
