import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { listExpenses, createExpense, deleteExpense } from '../../api/freelancer';
import toast from 'react-hot-toast';

const OR = '#F97316';
const TEXT = '#F3F4F6';
const MUTED = '#9CA3AF';
const CARD = '#161616';
const BORDER = '#222';

const CATEGORIES = ['Tools', 'Transport', 'Material', 'Labour', 'Food', 'Misc'];

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const now = new Date();

export default function FreelancerExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [form, setForm] = useState({ description: '', amount: '', category: '', expenseDate: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listExpenses({ month, year })
      .then(r => setExpenses(r.data))
      .catch(() => toast.error('Could not load expenses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [month, year]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (ev) => {
    ev.preventDefault();
    if (!form.description.trim()) return toast.error('Description required');
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return toast.error('Enter valid amount');
    setSaving(true);
    try {
      await createExpense({ ...form, amount: amt, expenseDate: form.expenseDate || undefined });
      toast.success('Expense logged');
      setForm({ description: '', amount: '', category: '', expenseDate: '', note: '' });
      setShowAdd(false);
      load();
    } catch { toast.error('Could not save'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await deleteExpense(id); load(); toast.success('Deleted'); }
    catch { toast.error('Could not delete'); }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 2 }}>Expenses</h1>
          <p style={{ fontSize: 13, color: MUTED }}>Total this period: <strong style={{ color: TEXT }}>{fmt(total)}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            style={{ padding: '7px 10px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, color: TEXT, outline: 'none' }}>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ padding: '7px 10px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, color: TEXT, outline: 'none' }}>
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Log Expense
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: MUTED, fontSize: 14 }}>Loading…</div>
      ) : expenses.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '40px', textAlign: 'center' }}>
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>No expenses this month</p>
          <p style={{ color: MUTED, fontSize: 13 }}>Log your expenses to track costs and profits</p>
        </div>
      ) : (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Date', 'Description', 'Category', 'Amount', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: i < expenses.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: MUTED }}>
                    {e.expenseDate ? new Date(e.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: TEXT }}>{e.description}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {e.category && (
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: 'rgba(249,115,22,0.1)', color: OR }}>{e.category}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#F87171' }}>{fmt(e.amount)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => remove(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `1px solid ${BORDER}`, background: '#111' }}>
                <td colSpan={3} style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: MUTED }}>Total</td>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#F87171' }}>{fmt(total)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px 28px', width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>Log Expense</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}><X size={18} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FField label="Description *" value={form.description} onChange={set('description')} placeholder="What was the expense for?" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FField label="Amount (₹) *" type="number" value={form.amount} onChange={set('amount')} placeholder="0" />
                <FField label="Date" type="date" value={form.expenseDate} onChange={set('expenseDate')} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: MUTED, display: 'block', marginBottom: 5 }}>Category</label>
                <select value={form.category} onChange={set('category')}
                  style={{ padding: '9px 12px', background: '#111', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14, color: form.category ? TEXT : MUTED, outline: 'none', width: '100%' }}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <FField label="Note" value={form.note} onChange={set('note')} placeholder="Optional note" />
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', background: OR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Log Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FField({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ padding: '9px 12px', background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 14, color: '#F3F4F6', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
    </div>
  );
}
