import { useState, useEffect, useCallback } from 'react';
import { getInvoices, createInvoice, recordPayment, cancelInvoice, getCustomers, sendWAInvoice, createPaymentLink } from '../../api';
import { Plus, FileText, Search, X, IndianRupee, Clock, CheckCircle, AlertCircle, MessageCircle, Eye, Link2, Copy, ExternalLink } from 'lucide-react';
import InvoiceView from './InvoiceView';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  DRAFT:     { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' },
  SENT:      { bg: '#EFF6FF', color: '#3B82F6', label: 'Sent' },
  PAID:      { bg: '#F0FDF4', color: '#16A34A', label: 'Paid' },
  PARTIAL:   { bg: '#FFFBEB', color: '#D97706', label: 'Partial' },
  OVERDUE:   { bg: '#FEF2F2', color: '#DC2626', label: 'Overdue' },
  CANCELLED: { bg: '#F9FAFB', color: '#9CA3AF', label: 'Cancelled' },
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function Badge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.DRAFT;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

function CreateInvoiceModal({ onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customerId: '', dueDate: '', notes: '', items: [{ description: '', qty: 1, unitPrice: 0 }] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCustomers().then(r => setCustomers(r.data.data || [])).catch(() => {});
  }, []);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setItem = (i, k, v) => {
    const items = [...form.items];
    items[i] = { ...items[i], [k]: v };
    setForm(f => ({ ...f, items }));
  };
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: '', qty: 1, unitPrice: 0 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const subtotal = form.items.reduce((s, it) => s + (Number(it.qty) * Number(it.unitPrice)), 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.items.every(it => it.description.trim() && it.qty > 0 && it.unitPrice >= 0)) {
      return toast.error('Fill all item details');
    }
    setLoading(true);
    try {
      await createInvoice({
        customerId: form.customerId || undefined,
        dueDate: form.dueDate || undefined,
        notes: form.notes,
        items: form.items.map(it => ({ description: it.description, quantity: Number(it.qty), unitPrice: Number(it.unitPrice) })),
      });
      toast.success('Invoice created');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>New Invoice</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Customer (optional)</label>
              <select value={form.customerId} onChange={e => setField('customerId', e.target.value)} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                <option value="">Walk-in customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Due date" type="date" value={form.dueDate} onChange={e => setField('dueDate', e.target.value)} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Line Items</label>
              <button type="button" onClick={addItem} style={{ fontSize: 13, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add item</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.items.map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 32px', gap: 8, alignItems: 'center' }}>
                  <input placeholder="Description" value={it.description} onChange={e => setItem(i, 'description', e.target.value)}
                    style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
                  <input type="number" min="1" placeholder="Qty" value={it.qty} onChange={e => setItem(i, 'qty', e.target.value)}
                    style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, textAlign: 'center' }} />
                  <input type="number" min="0" step="0.01" placeholder="Price" value={it.unitPrice} onChange={e => setItem(i, 'unitPrice', e.target.value)}
                    style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><X size={16} /></button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right', marginTop: 12, fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>
              Total: {fmt(subtotal)}
            </div>
          </div>

          <Input label="Notes (optional)" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Payment terms, remarks..." />

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Invoice</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({ invoice, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);

  const remaining = (invoice.total || 0) - (invoice.amountPaid || 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Enter valid amount');
    setLoading(true);
    try {
      await recordPayment(invoice.id, { amount: Number(amount), method });
      toast.success('Payment recorded');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Record Payment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Remaining: <strong style={{ color: 'var(--navy)' }}>{fmt(remaining)}</strong></p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Amount (₹)" type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder={String(remaining)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              {['CASH', 'UPI', 'CARD', 'BANK', 'CHEQUE'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Record</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentLinkModal({ invoice, onClose }) {
  const [url, setUrl] = useState(invoice.razorpayLinkUrl || null);
  const [loading, setLoading] = useState(!invoice.razorpayLinkUrl);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (invoice.razorpayLinkUrl) { setUrl(invoice.razorpayLinkUrl); setLoading(false); return; }
    createPaymentLink(invoice.id)
      .then(r => setUrl(r.data.data.linkUrl))
      .catch(err => { toast.error(err.response?.data?.message || 'Failed to create payment link'); onClose(); })
      .finally(() => setLoading(false));
  }, [invoice.id, invoice.razorpayLinkUrl, onClose]);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsapp = () => {
    const text = encodeURIComponent(`Hi, please find the payment link for Invoice ${invoice.invoiceNumber} (${fmt(invoice.balanceDue || invoice.total)}): ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Razorpay Payment Link</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          Invoice <strong>{invoice.invoiceNumber}</strong> · <strong style={{ color: 'var(--navy)' }}>{fmt(invoice.balanceDue || invoice.total)}</strong> due
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#9CA3AF', fontSize: 14 }}>Generating link via Razorpay...</div>
        ) : url ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
              <Link2 size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#6B7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <button onClick={copy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: copied ? 'var(--emerald)' : 'var(--navy)' }}>
                <Copy size={14} />{copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={whatsapp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 8, border: 'none', background: '#25D366', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff' }}>
                <MessageCircle size={14} />WhatsApp
              </button>
              <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
                <ExternalLink size={14} />Open
              </a>
            </div>
            <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 4 }}>
              Customer can pay via UPI, cards, net banking · Powered by Razorpay
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [payInvoice, setPayInvoice] = useState(null);
  const [viewInvoiceId, setViewInvoiceId] = useState(null);
  const [paymentLinkInvoice, setPaymentLinkInvoice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const r = await getInvoices(params);
      setInvoices(r.data.data || []);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const total = invoices.reduce((s, inv) => s + (inv.total || 0), 0);
  const paid = invoices.filter(i => i.status === 'PAID').reduce((s, inv) => s + (inv.amountPaid || 0), 0);
  const outstanding = invoices.filter(i => ['SENT', 'PARTIAL', 'OVERDUE'].includes(i.status)).reduce((s, inv) => s + ((inv.total || 0) - (inv.amountPaid || 0)), 0);
  const overdue = invoices.filter(i => i.status === 'OVERDUE').length;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Invoices</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>{invoices.length} invoices</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} style={{ marginRight: 6 }} />New Invoice</Button>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Invoiced', value: fmt(total), icon: FileText, color: 'var(--cyan)' },
          { label: 'Collected', value: fmt(paid), icon: CheckCircle, color: '#16A34A' },
          { label: 'Outstanding', value: fmt(outstanding), icon: Clock, color: '#D97706' },
          { label: 'Overdue', value: overdue, icon: AlertCircle, color: '#DC2626' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, background: color + '15', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
          <option value="">All status</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
              {['Invoice #', 'Customer', 'Date', 'Due Date', 'Amount', 'Paid', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>
                <FileText size={32} style={{ marginBottom: 8, opacity: 0.4, display: 'block', margin: '0 auto 8px' }} />
                No invoices yet
              </td></tr>
            ) : invoices.map(inv => (
              <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>{inv.invoiceNumber}</td>
                <td style={{ padding: '14px 16px', fontSize: 14 }}>{inv.customer?.name || <span style={{ color: '#9CA3AF' }}>Walk-in</span>}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{fmtDate(inv.createdAt)}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{fmtDate(inv.dueDate)}</td>
                <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600 }}>{fmt(inv.total)}</td>
                <td style={{ padding: '14px 16px', fontSize: 14, color: '#16A34A', fontWeight: 600 }}>{fmt(inv.amountPaid)}</td>
                <td style={{ padding: '14px 16px' }}><Badge status={inv.status} /></td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={() => setViewInvoiceId(inv.id)}
                      title="View / Print PDF"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--navy)', background: '#F3F4F6', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}
                    >
                      <Eye size={13} /> View
                    </button>
                    {!['PAID', 'CANCELLED'].includes(inv.status) && (
                      <>
                        <button onClick={() => setPayInvoice(inv)} style={{ fontSize: 13, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                          Pay
                        </button>
                        <button
                          onClick={() => setPaymentLinkInvoice(inv)}
                          title={inv.razorpayLinkUrl ? 'View payment link' : 'Generate Razorpay payment link'}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: inv.razorpayLinkUrl ? 'var(--emerald)' : '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          <Link2 size={14} />{inv.razorpayLinkUrl ? 'Link' : 'Link'}
                        </button>
                      </>
                    )}
                    {inv.customer?.phone && (
                      <button
                        onClick={async () => { try { await sendWAInvoice(inv.id); toast.success('Invoice sent via WhatsApp'); } catch { toast.error('Failed to send'); } }}
                        title="Send via WhatsApp"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#25D366', padding: 2 }}
                      >
                        <MessageCircle size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateInvoiceModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {payInvoice && <PaymentModal invoice={payInvoice} onClose={() => setPayInvoice(null)} onDone={() => { setPayInvoice(null); load(); }} />}
      {viewInvoiceId && <InvoiceView invoiceId={viewInvoiceId} onClose={() => setViewInvoiceId(null)} />}
      {paymentLinkInvoice && <PaymentLinkModal invoice={paymentLinkInvoice} onClose={() => { setPaymentLinkInvoice(null); load(); }} />}
    </div>
  );
}
