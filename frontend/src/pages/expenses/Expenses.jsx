import { useState, useEffect, useCallback } from 'react';
import { getExpenses, getExpenseSummary, createExpense, updateExpense, deleteExpense } from '../../api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, TrendingDown, ReceiptText, PieChart, Filter, X } from 'lucide-react';

const CATEGORIES = ['RENT','UTILITIES','SALARIES','MARKETING','SUPPLIES','MAINTENANCE','TRANSPORT','TAXES','INSURANCE','OTHER'];
const METHODS = ['CASH','CARD','UPI','BANK_TRANSFER','CHEQUE'];

const CATEGORY_COLORS = {
  RENT: '#6366F1', UTILITIES: '#0EA5E9', SALARIES: '#F59E0B',
  MARKETING: '#EC4899', SUPPLIES: '#10B981', MAINTENANCE: '#F97316',
  TRANSPORT: '#8B5CF6', TAXES: '#EF4444', INSURANCE: '#14B8A6', OTHER: '#6B7280',
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const CARD = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' };

function KPI({ icon: Icon, label, value, sub, color = 'var(--cyan)' }) {
  return (
    <div style={{ ...CARD, display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--navy)' }}>{value}</div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF' }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const INPUT = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' };
const BTN = (variant = 'primary') => ({
  padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
  background: variant === 'primary' ? 'var(--navy)' : variant === 'danger' ? '#FEE2E2' : '#F3F4F6',
  color: variant === 'primary' ? '#fff' : variant === 'danger' ? '#DC2626' : '#374151',
});

function ExpenseModal({ expense, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    category: expense?.category || 'SUPPLIES',
    description: expense?.description || '',
    amount: expense?.amount || '',
    date: expense?.date ? expense.date.slice(0, 10) : today,
    method: expense?.method || 'CASH',
    reference: expense?.reference || '',
    notes: expense?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.amount || !form.description) return toast.error('Description and amount are required');
    setSaving(true);
    try {
      if (expense) {
        await updateExpense(expense.id, form);
        toast.success('Expense updated');
      } else {
        await createExpense(form);
        toast.success('Expense recorded');
      }
      onSave();
    } catch { toast.error('Failed to save expense'); }
    finally { setSaving(false); }
  };

  const field = (label, content) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
      {content}
    </div>
  );

  return (
    <Modal title={expense ? 'Edit Expense' : 'Record Expense'} onClose={onClose}>
      {field('Category', (
        <select value={form.category} onChange={e => set('category', e.target.value)} style={INPUT}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
        </select>
      ))}
      {field('Description *', <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Monthly electricity bill" style={INPUT} />)}
      {field('Amount (₹) *', <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" style={INPUT} />)}
      {field('Date', <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={INPUT} />)}
      {field('Payment Method', (
        <select value={form.method} onChange={e => set('method', e.target.value)} style={INPUT}>
          {METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
        </select>
      ))}
      {field('Reference / Bill No.', <input value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="INV-001" style={INPUT} />)}
      {field('Notes', <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." rows={2} style={{ ...INPUT, resize: 'vertical' }} />)}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onClose} style={BTN('secondary')}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={BTN()}>
          {saving ? 'Saving...' : expense ? 'Update' : 'Record Expense'}
        </button>
      </div>
    </Modal>
  );
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | expense obj
  const [filters, setFilters] = useState({ category: '', method: '', from: '', to: '' });
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'summary'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.method) params.method = filters.method;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const [eRes, sRes] = await Promise.all([getExpenses(params), getExpenseSummary(params)]);
      setExpenses(eRes.data.data || []);
      setSummary(sRes.data.data || null);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await deleteExpense(id);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const topCategory = summary?.byCategory?.sort((a, b) => b._sum.amount - a._sum.amount)[0];

  const TAB = (id, label) => (
    <button onClick={() => setActiveTab(id)} style={{
      padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
      border: 'none', background: activeTab === id ? 'var(--navy)' : 'transparent',
      color: activeTab === id ? '#fff' : '#6B7280',
    }}>{label}</button>
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--navy)', margin: 0 }}>Expenses</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>Track all business expenditure</p>
        </div>
        <button onClick={() => setModal('create')} style={{ ...BTN(), display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Record Expense
        </button>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPI icon={TrendingDown} label="Total Expenses" value={fmt(summary?.total)} sub={`${summary?.count || 0} transactions`} color="#EF4444" />
        <KPI icon={ReceiptText} label="Largest Category" value={topCategory?.category?.replace('_', ' ') || '—'} sub={topCategory ? fmt(topCategory._sum.amount) : ''} color="#F59E0B" />
        <KPI icon={PieChart} label="This Month" value={fmt(expenses.filter(e => {
          const d = new Date(e.date);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).reduce((s, e) => s + Number(e.amount), 0))} sub="current month spend" color="#6366F1" />
      </div>

      {/* Tabs + Filters */}
      <div style={{ ...CARD, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {TAB('list', 'All Expenses')}
          {TAB('summary', 'By Category')}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={14} color="#9CA3AF" />
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} style={{ ...INPUT, width: 'auto', padding: '7px 10px' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
          <select value={filters.method} onChange={e => setFilters(f => ({ ...f, method: e.target.value }))} style={{ ...INPUT, width: 'auto', padding: '7px 10px' }}>
            <option value="">All Methods</option>
            {METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} style={{ ...INPUT, width: 'auto', padding: '7px 10px' }} />
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>to</span>
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} style={{ ...INPUT, width: 'auto', padding: '7px 10px' }} />
          {(filters.category || filters.method || filters.from || filters.to) && (
            <button onClick={() => setFilters({ category: '', method: '', from: '', to: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: 14 }}>Loading expenses...</div>
      ) : activeTab === 'list' ? (
        expenses.length === 0 ? (
          <div style={{ ...CARD, textAlign: 'center', padding: 60 }}>
            <TrendingDown size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
            <p style={{ color: '#9CA3AF', fontSize: 14 }}>No expenses recorded yet.</p>
            <button onClick={() => setModal('create')} style={{ ...BTN(), marginTop: 12 }}>Record First Expense</button>
          </div>
        ) : (
          <div style={CARD}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #F3F4F6' }}>
                  {['Date', 'Category', 'Description', 'Method', 'Reference', 'Amount', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td style={{ padding: '12px 12px', color: '#374151' }}>{fmtDate(e.date)}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: (CATEGORY_COLORS[e.category] || '#6B7280') + '18', color: CATEGORY_COLORS[e.category] || '#6B7280' }}>
                        {e.category?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px', color: '#111827', fontWeight: 500, maxWidth: 220 }}>
                      {e.description}
                      {e.notes && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{e.notes}</div>}
                    </td>
                    <td style={{ padding: '12px 12px', color: '#6B7280' }}>{e.method?.replace('_', ' ')}</td>
                    <td style={{ padding: '12px 12px', color: '#9CA3AF', fontSize: 13 }}>{e.reference || '—'}</td>
                    <td style={{ padding: '12px 12px', fontWeight: 700, color: '#EF4444' }}>{fmt(e.amount)}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setModal(e)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(e.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 4 }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Summary / By Category tab */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {(summary?.byCategory || []).sort((a, b) => b._sum.amount - a._sum.amount).map(cat => {
            const pct = summary.total > 0 ? ((cat._sum.amount / summary.total) * 100).toFixed(1) : 0;
            const color = CATEGORY_COLORS[cat.category] || '#6B7280';
            return (
              <div key={cat.category} style={{ ...CARD, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: 3, width: `${pct}%`, background: color, borderRadius: '12px 0 0 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: color + '18', color }}>{cat.category?.replace('_', ' ')}</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{pct}%</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: 4 }}>{fmt(cat._sum.amount)}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{cat._count} transaction{cat._count !== 1 ? 's' : ''}</div>
                <div style={{ marginTop: 12, height: 6, background: '#F3F4F6', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            );
          })}
          {(!summary?.byCategory?.length) && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: 14 }}>No expense data for the selected period.</div>
          )}
        </div>
      )}

      {/* Modals */}
      {(modal === 'create' || (modal && modal !== 'create')) && (
        <ExpenseModal
          expense={modal !== 'create' ? modal : null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
