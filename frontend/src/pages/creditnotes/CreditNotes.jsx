import { useState, useEffect, useCallback } from 'react';
import { getCreditNotes, createCreditNote, updateCreditNoteStatus, getCustomers, getInvoices } from '../../api';
import { Plus, FileX, X, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_COLOR = { DRAFT: 'secondary', APPROVED: 'success', APPLIED: 'info', VOID: 'error' };

function CreateCreditNoteModal({ onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState({ customerId: '', invoiceId: '', reason: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([getCustomers(), getInvoices()]).then(([c, i]) => {
      setCustomers(c.data.data || []);
      setInvoices(i.data.data || []);
    });
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setItem = (i, k) => (e) => setItems(arr => arr.map((it, idx) => idx === i ? { ...it, [k]: e.target.value } : it));
  const addItem = () => setItems(arr => [...arr, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  const removeItem = (i) => setItems(arr => arr.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((s, it) => s + Number(it.quantity) * Number(it.unitPrice), 0);
  const tax = items.reduce((s, it) => s + Number(it.quantity) * Number(it.unitPrice) * Number(it.taxRate) / 100, 0);
  const total = subtotal + tax;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customerId || !form.reason) return toast.error('Customer and reason are required');
    if (items.some(it => !it.description || !it.unitPrice)) return toast.error('Fill all item details');
    setLoading(true);
    try {
      await createCreditNote({
        ...form,
        items: items.map(it => ({ ...it, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice), taxRate: Number(it.taxRate) })),
      });
      toast.success('Credit note created');
      onCreated();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>New Credit Note</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Customer</label>
              <select value={form.customerId} onChange={set('customerId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                <option value="">Select customer…</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Against Invoice (optional)</label>
              <select value={form.invoiceId} onChange={set('invoiceId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                <option value="">None</option>
                {invoices.filter(i => !form.customerId || i.customerId === form.customerId).map(i => (
                  <option key={i.id} value={i.id}>{i.invoiceNumber} — {fmt(i.total)}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Reason" value={form.reason} onChange={set('reason')} placeholder="e.g. Return, Overcharge, Discount" />
            <Input label="Date" type="date" value={form.date} onChange={set('date')} />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Items</div>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 80px 32px', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                <Input label={i === 0 ? 'Description' : ''} value={it.description} onChange={setItem(i, 'description')} placeholder="Item description" />
                <Input label={i === 0 ? 'Qty' : ''} type="number" value={it.quantity} onChange={setItem(i, 'quantity')} />
                <Input label={i === 0 ? 'Unit Price' : ''} type="number" value={it.unitPrice} onChange={setItem(i, 'unitPrice')} />
                <Input label={i === 0 ? 'Tax %' : ''} type="number" value={it.taxRate} onChange={setItem(i, 'taxRate')} />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', paddingBottom: 4 }}><X size={16} /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={addItem} style={{ fontSize: 13, color: 'var(--navy)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add item</button>
          </div>

          <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 12, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Subtotal</span><strong>{fmt(subtotal)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Tax</span><strong>{fmt(tax)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}><span>Total</span><span style={{ color: 'var(--navy)' }}>{fmt(total)}</span></div>
          </div>

          <Input label="Notes (optional)" value={form.notes} onChange={set('notes')} placeholder="Internal notes..." />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Credit Note</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CNRow({ cn, onRefresh }) {
  const [expanded, setExpanded] = useState(false);

  const approve = async () => {
    try { await updateCreditNoteStatus(cn.id, 'APPROVED'); toast.success('Approved'); onRefresh(); }
    catch { toast.error('Failed'); }
  };
  const voidNote = async () => {
    try { await updateCreditNoteStatus(cn.id, 'VOID'); toast.success('Voided'); onRefresh(); }
    catch { toast.error('Failed'); }
  };

  return (
    <>
      <tr style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setExpanded(x => !x)}>
        <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, color: 'var(--navy)' }}>{cn.creditNoteNumber || `CN-${cn.id.slice(-6).toUpperCase()}`}</td>
        <td style={{ padding: '12px 16px', fontSize: 13 }}>{cn.customer?.name || '—'}</td>
        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{cn.reason}</td>
        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{fmtDate(cn.date)}</td>
        <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13 }}>{fmt(cn.total)}</td>
        <td style={{ padding: '12px 16px' }}><Badge variant={STATUS_COLOR[cn.status]}>{cn.status}</Badge></td>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {cn.status === 'DRAFT' && <button onClick={(e) => { e.stopPropagation(); approve(); }} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--emerald)', color: 'var(--emerald)', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Approve</button>}
            {cn.status !== 'VOID' && cn.status !== 'APPLIED' && <button onClick={(e) => { e.stopPropagation(); voidNote(); }} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--vermilion)', color: 'var(--vermilion)', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Void</button>}
            {expanded ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
          </div>
        </td>
      </tr>
      {expanded && cn.items?.length > 0 && (
        <tr style={{ background: '#F9FAFB' }}>
          <td colSpan={7} style={{ padding: '10px 24px 14px' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead><tr style={{ color: '#6B7280' }}><th style={{ textAlign: 'left', paddingBottom: 4 }}>Description</th><th style={{ textAlign: 'right', paddingBottom: 4 }}>Qty</th><th style={{ textAlign: 'right', paddingBottom: 4 }}>Unit Price</th><th style={{ textAlign: 'right', paddingBottom: 4 }}>Tax</th><th style={{ textAlign: 'right', paddingBottom: 4 }}>Amount</th></tr></thead>
              <tbody>
                {cn.items.map((it, i) => (
                  <tr key={i}><td style={{ paddingBottom: 2 }}>{it.description}</td><td style={{ textAlign: 'right' }}>{it.quantity}</td><td style={{ textAlign: 'right' }}>{fmt(it.unitPrice)}</td><td style={{ textAlign: 'right' }}>{it.taxRate}%</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(it.amount)}</td></tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

export default function CreditNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCreditNotes(filter !== 'ALL' ? { status: filter } : {});
      setNotes(res.data.data || []);
    } catch { toast.error('Failed to load credit notes'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const totalApproved = notes.filter(n => n.status === 'APPROVED').reduce((s, n) => s + Number(n.total || 0), 0);
  const totalApplied = notes.filter(n => n.status === 'APPLIED').reduce((s, n) => s + Number(n.total || 0), 0);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Credit Notes</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>Manage refunds and adjustments for your customers</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} style={{ marginRight: 6 }} />New Credit Note</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Pending Approval', value: notes.filter(n => n.status === 'DRAFT').length, sub: `${notes.filter(n => n.status === 'DRAFT').length} notes`, color: '#F59E0B' },
          { label: 'Approved (Unused)', value: fmt(totalApproved), sub: `${notes.filter(n => n.status === 'APPROVED').length} notes`, color: 'var(--navy)' },
          { label: 'Applied to Invoices', value: fmt(totalApplied), sub: `${notes.filter(n => n.status === 'APPLIED').length} notes`, color: 'var(--emerald)' },
        ].map(({ label, value, sub, color }) => (
          <Card key={label}>
            <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          {['ALL', 'DRAFT', 'APPROVED', 'APPLIED', 'VOID'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: filter === s ? 'var(--navy)' : '#F3F4F6', color: filter === s ? '#fff' : '#6B7280' }}>{s}</button>
          ))}
        </div>
        {loading ? (
          <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading…</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Credit Note #', 'Customer', 'Reason', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {notes.map(cn => <CNRow key={cn.id} cn={cn} onRefresh={load} />)}
              {notes.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>
                  <FileX size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                  No credit notes found
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {showCreate && <CreateCreditNoteModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}
