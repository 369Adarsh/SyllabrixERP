import { useState, useEffect, useCallback } from 'react';
import { getRecurringInvoices, createRecurringInvoice, toggleRecurringInvoice, deleteRecurringInvoice, generateDueInvoices, getCustomers } from '../../api';
import { RefreshCw, Plus, Repeat, Trash2, X, Play, Pause } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const FREQ_LABELS = { WEEKLY: 'Weekly', MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', YEARLY: 'Yearly' };
const FREQ_COLORS = { WEEKLY: 'info', MONTHLY: 'success', QUARTERLY: 'secondary', YEARLY: 'error' };

function CreateModal({ onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customerId: '', frequency: 'MONTHLY',
    nextRunDate: new Date().toISOString().split('T')[0],
    notes: '', terms: 'Payment due within 15 days.',
  });
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCustomers().then(r => setCustomers(r.data.data || []));
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setItem = (i, k) => (e) => setItems(arr => arr.map((it, idx) => idx === i ? { ...it, [k]: e.target.value } : it));
  const addItem = () => setItems(arr => [...arr, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  const removeItem = (i) => setItems(arr => arr.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((s, it) => s + Number(it.quantity) * Number(it.unitPrice), 0);
  const tax = items.reduce((s, it) => s + Number(it.quantity) * Number(it.unitPrice) * Number(it.taxRate) / 100, 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.frequency || !form.nextRunDate) return toast.error('Frequency and start date required');
    if (items.some(it => !it.description || !it.unitPrice)) return toast.error('Fill all item details');
    setLoading(true);
    try {
      await createRecurringInvoice({
        ...form,
        items: items.map(it => ({
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          taxRate: Number(it.taxRate),
        })),
      });
      toast.success('Recurring invoice scheduled');
      onCreated();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 660, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>New Recurring Invoice</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Customer (optional)</label>
              <select value={form.customerId} onChange={set('customerId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                <option value="">No specific customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Frequency</label>
              <select value={form.frequency} onChange={set('frequency')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <Input label="First run date" type="date" value={form.nextRunDate} onChange={set('nextRunDate')} />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Line Items</div>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 70px 110px 70px 32px', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                <Input label={i === 0 ? 'Description' : ''} value={it.description} onChange={setItem(i, 'description')} placeholder="Service / product" />
                <Input label={i === 0 ? 'Qty' : ''} type="number" value={it.quantity} onChange={setItem(i, 'quantity')} />
                <Input label={i === 0 ? 'Unit Price (₹)' : ''} type="number" value={it.unitPrice} onChange={setItem(i, 'unitPrice')} />
                <Input label={i === 0 ? 'Tax %' : ''} type="number" value={it.taxRate} onChange={setItem(i, 'taxRate')} />
                {items.length > 1 && <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', paddingBottom: 4 }}><X size={16} /></button>}
              </div>
            ))}
            <button type="button" onClick={addItem} style={{ fontSize: 13, color: 'var(--navy)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add item</button>
          </div>

          <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 12, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Subtotal</span><strong>{fmt(subtotal)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Tax</span><strong>{fmt(tax)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}><span>Per invoice</span><span style={{ color: 'var(--navy)' }}>{fmt(subtotal + tax)}</span></div>
          </div>

          <Input label="Notes (optional)" value={form.notes} onChange={set('notes')} placeholder="Monthly retainer fee" />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Schedule Recurring Invoice</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RecurringInvoices() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRecurringInvoices();
      setRecords(res.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id) => {
    try { await toggleRecurringInvoice(id); toast.success('Updated'); load(); }
    catch { toast.error('Failed'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this recurring invoice?')) return;
    try { await deleteRecurringInvoice(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await generateDueInvoices();
      const { generated } = res.data.data;
      toast.success(generated > 0 ? `${generated} invoice(s) generated` : 'No invoices due right now');
      load();
    } catch { toast.error('Generation failed'); }
    finally { setGenerating(false); }
  };

  const activeCount = records.filter(r => r.isActive).length;
  const totalMonthlyValue = records.filter(r => r.isActive && r.frequency === 'MONTHLY').reduce((s, r) => {
    const items = Array.isArray(r.items) ? r.items : [];
    return s + items.reduce((ss, it) => ss + Number(it.quantity || 1) * Number(it.unitPrice || 0) * (1 + Number(it.taxRate || 0) / 100), 0);
  }, 0);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Recurring Invoices</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>Auto-generate invoices on a fixed schedule — weekly, monthly, quarterly, yearly</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={generate} loading={generating}><RefreshCw size={14} style={{ marginRight: 6 }} />Generate Due</Button>
          <Button onClick={() => setShowCreate(true)}><Plus size={16} style={{ marginRight: 6 }} />New Schedule</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <Card><div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Active Schedules</div><div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>{activeCount}</div></Card>
        <Card><div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Monthly Auto-Revenue</div><div style={{ fontSize: 22, fontWeight: 800, color: 'var(--emerald)', fontFamily: 'var(--font-display)' }}>{fmt(totalMonthlyValue)}</div></Card>
        <Card><div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Schedules</div><div style={{ fontSize: 26, fontWeight: 800, color: '#6B7280', fontFamily: 'var(--font-display)' }}>{records.length}</div></Card>
      </div>

      <Card style={{ padding: 0 }}>
        {loading ? (
          <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading…</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Customer', 'Items', 'Per Invoice', 'Frequency', 'Next Run', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const items = Array.isArray(r.items) ? r.items : [];
                const total = items.reduce((s, it) => s + Number(it.quantity || 1) * Number(it.unitPrice || 0) * (1 + Number(it.taxRate || 0) / 100), 0);
                const isDue = new Date(r.nextRunDate) <= new Date();
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{r.customer?.name || <span style={{ color: '#9CA3AF' }}>No customer</span>}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280', maxWidth: 200 }}>
                      {items.slice(0, 2).map(it => it.description).join(', ')}
                      {items.length > 2 && ` +${items.length - 2} more`}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13 }}>{fmt(total)}</td>
                    <td style={{ padding: '12px 16px' }}><Badge variant={FREQ_COLORS[r.frequency]}>{FREQ_LABELS[r.frequency]}</Badge></td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: isDue && r.isActive ? 'var(--vermilion)' : '#6B7280', fontWeight: isDue && r.isActive ? 700 : 400 }}>
                      {fmtDate(r.nextRunDate)}{isDue && r.isActive ? ' (DUE)' : ''}
                    </td>
                    <td style={{ padding: '12px 16px' }}><Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Paused'}</Badge></td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => toggle(r.id)} title={r.isActive ? 'Pause' : 'Resume'} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: r.isActive ? 'var(--amber)' : 'var(--emerald)' }}>
                          {r.isActive ? <Pause size={13} /> : <Play size={13} />}
                        </button>
                        <button onClick={() => del(r.id)} title="Delete" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--vermilion)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>
                  <Repeat size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                  No recurring schedules. Add one to auto-generate invoices.
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}
