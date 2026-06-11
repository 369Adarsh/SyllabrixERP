import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X, RefreshCw } from 'lucide-react';
import { listExpenses, createExpense, deleteExpense } from '../../api/freelancer';
import toast from 'react-hot-toast';

const OR = '#f97316';
const TEXT = '#f1f5f9';
const MUTED = '#64748b';
const CARD = '#141414';
const BORDER = '#1e1e1e';
const RE = '#ef4444';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

const CATEGORIES = [
  { value: 'MATERIAL', label: 'Material' },
  { value: 'TOOL',     label: 'Tool / Equipment' },
  { value: 'TRAVEL',   label: 'Travel' },
  { value: 'PHONE',    label: 'Phone / Internet' },
  { value: 'WAGES',    label: 'Wages' },
  { value: 'OTHER',    label: 'Other' },
];

const CAT_COLORS = { MATERIAL: '#22d3ee', TOOL: '#a78bfa', TRAVEL: '#34d399', PHONE: '#60a5fa', WAGES: '#fbbf24', OTHER: '#94a3b8' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const now = new Date();
const BLANK = { note: '', amount: '', category: 'OTHER', expenseDate: '' };

export default function FreelancerExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listExpenses({ month, year })
      .then(r => setExpenses(r.data))
      .catch(err => setError(`Could not load — ${err?.response?.status || 'Network error'}`))
      .finally(() => setLoading(false));
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (ev) => {
    ev.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return toast.error('Enter valid amount');
    setSaving(true);
    try {
      await createExpense({
        note: form.note || undefined,
        amount: amt,
        category: form.category,
        expenseDate: form.expenseDate || undefined,
      });
      toast.success('Expense logged');
      setForm(BLANK);
      setShowAdd(false);
      load();
    } catch (e) { toast.error(e?.response?.data?.error || 'Could not save'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await deleteExpense(id); load(); toast.success('Deleted'); }
    catch { toast.error('Could not delete'); }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  // Group by category for summary
  const byCat = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 3 }}>Expenses</h1>
          <p style={{ fontSize: 13, color: MUTED }}>
            {MONTHS[month - 1]} {year} · <strong style={{ color: RE }}>{fmt(total)}</strong> total
          </p>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
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

      {/* Category summary pills */}
      {Object.keys(byCat).length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {Object.entries(byCat).map(([cat, amt]) => {
            const c = CAT_COLORS[cat] || MUTED;
            const label = CATEGORIES.find(x => x.value === cat)?.label || cat;
            return (
              <div key={cat} style={{ padding: '4px 12px', borderRadius: 20, background: `${c}14`, border: `1px solid ${c}28`, fontSize: 12 }}>
                <span style={{ color: c, fontWeight: 600 }}>{label}</span>
                <span style={{ color: MUTED, marginLeft: 6 }}>{fmt(amt)}</span>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ height: 44, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px' }}>
            <div style={{ width: '10%', height: 12, background: '#222', borderRadius: 3 }} />
            <div style={{ width: '30%', height: 12, background: '#1a1a1a', borderRadius: 3 }} />
          </div>)}
        </div>
      ) : error ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '32px', textAlign: 'center' }}>
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>Failed to load</p>
          <p style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>{error}</p>
          <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: OR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      ) : expenses.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '40px', textAlign: 'center' }}>
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>No expenses in {MONTHS[month - 1]} {year}</p>
          <p style={{ color: MUTED, fontSize: 13 }}>Log expenses to track your costs and net profit</p>
        </div>
      ) : (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Date', 'Note', 'Category', 'Amount', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => {
                const c = CAT_COLORS[e.category] || MUTED;
                const label = CATEGORIES.find(x => x.value === e.category)?.label || e.category;
                return (
                  <tr key={e.id} style={{ borderBottom: i < expenses.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: MUTED, whiteSpace: 'nowrap' }}>{fmtDate(e.expenseDate)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: TEXT }}>{e.note || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${c}14`, color: c }}>{label}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: RE }}>{fmt(e.amount)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => remove(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 0 }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: `2px solid ${BORDER}`, background: '#0f0f0f' }}>
                <td colSpan={3} style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: MUTED }}>Total</td>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: RE }}>{fmt(total)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#141414', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px', width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>Log Expense</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}><X size={18} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <EF label="Amount (₹) *" type="number" value={form.amount} onChange={set('amount')} placeholder="0" />
                <EF label="Date" type="date" value={form.expenseDate} onChange={set('expenseDate')} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: MUTED, display: 'block', marginBottom: 5 }}>Category *</label>
                <select value={form.category} onChange={set('category')}
                  style={{ padding: '9px 12px', background: '#0f0f0f', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14, color: TEXT, outline: 'none', width: '100%' }}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <EF label="Note" value={form.note} onChange={set('note')} placeholder="What was this for?" />
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setShowAdd(false); setForm(BLANK); }} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
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

function EF({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: MUTED, display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ padding: '9px 12px', background: '#0f0f0f', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14, color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
    </div>
  );
}
