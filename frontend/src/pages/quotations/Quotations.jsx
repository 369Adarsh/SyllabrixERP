import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import KpiBar from '../../components/ui/KpiBar';
import { P } from '../../styles/page';
import { useBranch } from '../../context/BranchContext';
import { getQuotations, createQuotation, updateQuotationStatus, convertQuotationToInvoice, getCustomers, getTaxRates } from '../../api';
import { Plus, FileText, X, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_COLOR = { DRAFT: 'secondary', SENT: 'info', ACCEPTED: 'success', REJECTED: 'error', EXPIRED: 'secondary', CONVERTED: 'success' };

function CreateQuotationModal({ onClose, onCreated }) {
  const { branchId } = useBranch();
  const [customers, setCustomers] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [form, setForm] = useState({
    customerId: '', date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    notes: '', terms: 'Payment due within 30 days.',
  });
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([getCustomers(), getTaxRates()]).then(([c, t]) => {
      setCustomers(c.data.data || []);
      setTaxRates(t.data.data || []);
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
    if (!form.customerId) return toast.error('Customer is required');
    if (items.some(it => !it.description || !it.unitPrice)) return toast.error('Fill all item details');
    setLoading(true);
    try {
      await createQuotation({
        ...form,
        ...(branchId && { branchId }),
        items: items.map(it => ({ ...it, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice), taxRate: Number(it.taxRate) })),
      });
      toast.success('Quotation created');
      onCreated();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 720, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>New Quotation / Estimate</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Customer</label>
              <select value={form.customerId} onChange={set('customerId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                <option value="">Select customer…</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Quote Date" type="date" value={form.date} onChange={set('date')} />
            <Input label="Valid Until" type="date" value={form.validUntil} onChange={set('validUntil')} />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Line Items</div>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 80px 32px', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                <Input label={i === 0 ? 'Description' : ''} value={it.description} onChange={setItem(i, 'description')} placeholder="Product / service name" />
                <Input label={i === 0 ? 'Qty' : ''} type="number" value={it.quantity} onChange={setItem(i, 'quantity')} />
                <Input label={i === 0 ? 'Unit Price (₹)' : ''} type="number" value={it.unitPrice} onChange={setItem(i, 'unitPrice')} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {i === 0 && <label style={{ fontSize: 13, fontWeight: 600 }}>Tax %</label>}
                  <select value={it.taxRate} onChange={setItem(i, 'taxRate')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                    <option value={0}>0%</option>
                    {taxRates.map(t => <option key={t.id} value={t.rate}>{t.name} ({t.rate}%)</option>)}
                    {[5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Notes for customer" value={form.notes} onChange={set('notes')} placeholder="Thank you for your business!" />
            <Input label="Terms & Conditions" value={form.terms} onChange={set('terms')} placeholder="Payment due within 30 days." />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Quotation</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuotationRow({ q, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [converting, setConverting] = useState(false);

  const markStatus = async (status) => {
    try { await updateQuotationStatus(q.id, status); toast.success('Updated'); onRefresh(); }
    catch { toast.error('Failed'); }
  };

  const convert = async (e) => {
    e.stopPropagation();
    setConverting(true);
    try { await convertQuotationToInvoice(q.id); toast.success('Converted to invoice!'); onRefresh(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setConverting(false); }
  };

  const isExpired = q.validUntil && new Date(q.validUntil) < new Date() && q.status === 'SENT';

  return (
    <>
      <tr style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setExpanded(x => !x)}>
        <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, color: 'var(--navy)' }}>{q.quotationNumber || `QT-${q.id.slice(-6).toUpperCase()}`}</td>
        <td style={{ padding: '12px 16px', fontSize: 13 }}>{q.customer?.name || '—'}</td>
        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{fmtDate(q.date)}</td>
        <td style={{ padding: '12px 16px', fontSize: 13, color: isExpired ? 'var(--vermilion)' : '#6B7280' }}>{fmtDate(q.validUntil)}</td>
        <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13 }}>{fmt(q.total)}</td>
        <td style={{ padding: '12px 16px' }}><Badge variant={STATUS_COLOR[q.status]}>{q.status}</Badge></td>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
            {q.status === 'DRAFT' && <button onClick={() => markStatus('SENT')} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--navy)', color: 'var(--navy)', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Send</button>}
            {(q.status === 'SENT' || q.status === 'DRAFT') && (
              <>
                <button onClick={() => markStatus('ACCEPTED')} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--emerald)', color: 'var(--emerald)', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Accept</button>
                <button onClick={() => markStatus('REJECTED')} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--vermilion)', color: 'var(--vermilion)', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Reject</button>
              </>
            )}
            {q.status === 'ACCEPTED' && (
              <button onClick={convert} disabled={converting} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--cyan)', color: 'var(--cyan)', background: 'none', cursor: 'pointer', fontWeight: 600 }}>
                <ArrowRight size={12} />{converting ? '…' : 'Convert to Invoice'}
              </button>
            )}
            {expanded ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
          </div>
        </td>
      </tr>
      {expanded && q.items?.length > 0 && (
        <tr style={{ background: '#F9FAFB' }}>
          <td colSpan={7} style={{ padding: '10px 24px 14px' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead><tr style={{ color: '#6B7280' }}><th style={{ textAlign: 'left', paddingBottom: 4 }}>Description</th><th style={{ textAlign: 'right', paddingBottom: 4 }}>Qty</th><th style={{ textAlign: 'right', paddingBottom: 4 }}>Unit Price</th><th style={{ textAlign: 'right', paddingBottom: 4 }}>Tax</th><th style={{ textAlign: 'right', paddingBottom: 4 }}>Amount</th></tr></thead>
              <tbody>
                {q.items.map((it, i) => (
                  <tr key={i}><td style={{ paddingBottom: 2 }}>{it.description}</td><td style={{ textAlign: 'right' }}>{it.quantity}</td><td style={{ textAlign: 'right' }}>{fmt(it.unitPrice)}</td><td style={{ textAlign: 'right' }}>{it.taxRate}%</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(it.amount)}</td></tr>
                ))}
              </tbody>
            </table>
            {q.notes && <p style={{ marginTop: 8, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>{q.notes}</p>}
          </td>
        </tr>
      )}
    </>
  );
}

export default function Quotations() {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'ALL') params.status = filter;
      if (branchId) params.branchId = branchId;
      const res = await getQuotations(params);
      setQuotations(res.data.data || []);
    } catch { toast.error('Failed to load quotations'); }
    finally { setLoading(false); }
  }, [filter, branchId]);

  useEffect(() => { load(); }, [load]);

  const totalValue = quotations.reduce((s, q) => s + Number(q.total || 0), 0);
  const accepted = quotations.filter(q => q.status === 'ACCEPTED');
  const converted = quotations.filter(q => q.status === 'CONVERTED');
  const conversionRate = quotations.length ? Math.round((accepted.length + converted.length) / quotations.length * 100) : 0;

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1100, margin: '0 auto' }}>
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Quotations & Estimates</h1>
          <p style={P.sub}>Create quotes, get acceptance, convert to invoices</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} style={{ marginRight: 6 }} />New Quotation</Button>
      </div>

      <KpiBar stats={[
        { label: 'Total Pipeline',   value: fmt(totalValue),        color: 'var(--navy)'                              },
        { label: 'Accepted',         value: accepted.length,        color: 'var(--emerald)'                           },
        { label: 'Converted',        value: converted.length,       color: 'var(--cyan)'                              },
        { label: 'Conversion Rate',  value: `${conversionRate}%`,   color: conversionRate >= 50 ? 'var(--emerald)' : '#F59E0B' },
      ]} />

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: filter === s ? 'var(--navy)' : '#F3F4F6', color: filter === s ? '#fff' : '#6B7280' }}>{s}</button>
          ))}
        </div>
        {loading ? (
          <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading…</p>
        ) : (
          <div style={P.tableScroll}>
          <table style={P.table}>
            <thead style={P.thead}>
              <tr>
                {['Quote #', 'Customer', 'Date', 'Valid Until', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} style={P.th()}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => <QuotationRow key={q.id} q={q} onRefresh={load} />)}
              {quotations.length === 0 && (
                <tr><td colSpan={7} style={P.empty}>
                  <FileText size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                  No quotations found
                </td></tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </Card>

      {showCreate && <CreateQuotationModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

