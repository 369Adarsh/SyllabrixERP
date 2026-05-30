import { useState, useEffect, useCallback, useRef } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useBranch } from '../../context/BranchContext';
import KpiBar from '../../components/ui/KpiBar';
import { P } from '../../styles/page';
import { getInvoices, createInvoice, recordPayment, cancelInvoice, getCustomers, getProducts, createPaymentLink, updateInvoiceStatus } from '../../api';
import Pagination from '../../components/ui/Pagination';
import { Plus, FileText, Search, X, IndianRupee, Clock, CheckCircle, AlertCircle, MessageCircle, Eye, Link2, Copy, ExternalLink, Package } from 'lucide-react';
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

// ─── Product search combobox for invoice line items ──────────────────────────

const today = new Date();
today.setHours(0, 0, 0, 0);

function productStatus(p) {
  const isExpired  = p.expiryDate && new Date(p.expiryDate) < today;
  const isOutOfStock = Number(p.stock) <= 0;
  const isLowStock   = !isOutOfStock && Number(p.stock) <= Number(p.lowStockAlert || 5);
  const daysToExpiry = p.expiryDate
    ? Math.ceil((new Date(p.expiryDate) - today) / 86400000)
    : null;
  const isExpiringSoon = !isExpired && daysToExpiry !== null && daysToExpiry <= 30;
  return { isExpired, isOutOfStock, isLowStock, isExpiringSoon, daysToExpiry };
}

function StockBadge({ p }) {
  const { isExpired, isOutOfStock, isLowStock, isExpiringSoon, daysToExpiry } = productStatus(p);
  if (isExpired)      return <span style={{ fontSize: 10, fontWeight: 700, background: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>EXPIRED</span>;
  if (isOutOfStock)   return <span style={{ fontSize: 10, fontWeight: 700, background: '#F3F4F6', color: '#6B7280', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>OUT OF STOCK</span>;
  if (isExpiringSoon) return <span style={{ fontSize: 10, fontWeight: 700, background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>EXP in {daysToExpiry}d</span>;
  if (isLowStock)     return <span style={{ fontSize: 10, fontWeight: 700, background: '#FFF7ED', color: '#EA580C', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>LOW</span>;
  return null;
}

function ProductSearchInput({ value, productId, products, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  // Sort: healthy stock first, then low stock, then out-of-stock, then expired last
  const sortWeight = (p) => {
    const { isExpired, isOutOfStock, isLowStock } = productStatus(p);
    if (isExpired)    return 3;
    if (isOutOfStock) return 2;
    if (isLowStock)   return 1;
    return 0;
  };

  const filtered = products
    .filter(p => !query.trim() || p.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sortWeight(a) - sortWeight(b))
    .slice(0, 60);

  const expiredCount    = products.filter(p => productStatus(p).isExpired).length;
  const outOfStockCount = products.filter(p => productStatus(p).isOutOfStock).length;

  useEffect(() => {
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (p) => {
    setQuery(p.name);
    setOpen(false);
    onChange({ description: p.name, unitPrice: p.sellingPrice, taxRate: p.taxRate?.rate || 0, productId: p.id });
  };

  const handleInput = (e) => {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    onChange({ description: v, productId: null, taxRate: 0 });
  };

  const unlink = () => {
    setQuery('');
    onChange({ description: '', unitPrice: 0, taxRate: 0, productId: null });
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder="Search inventory or type description…"
          style={{ width: '100%', padding: productId ? '9px 30px 9px 32px' : '9px 12px 9px 32px', border: `1.5px solid ${productId ? '#10B981' : 'var(--border)'}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none', background: productId ? '#F0FDF4' : '#fff' }}
        />
        <Package size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: productId ? '#10B981' : '#C4C4C4', pointerEvents: 'none' }} />
        {productId && (
          <button type="button" onClick={unlink} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, display: 'flex' }}>
            <X size={12} />
          </button>
        )}
      </div>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.13)', zIndex: 400, maxHeight: 320, overflowY: 'auto' }}>
          {!query.trim() && products.length === 0 ? (
            <div style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: 13, fontStyle: 'italic' }}>No products in inventory yet</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: 13, fontStyle: 'italic' }}>
              No match — "{query}" will be used as a custom description
            </div>
          ) : (
            <>
              {/* Summary header */}
              <div style={{ padding: '6px 14px', fontSize: 11, background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: '#6B7280', fontWeight: 600 }}>{products.length} items</span>
                {outOfStockCount > 0 && (
                  <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>
                    {outOfStockCount} out of stock
                  </span>
                )}
                {expiredCount > 0 && (
                  <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>
                    {expiredCount} expired
                  </span>
                )}
                {(outOfStockCount > 0 || expiredCount > 0) && (
                  <span style={{ color: '#9CA3AF', fontSize: 10 }}>· shown at bottom</span>
                )}
              </div>

              {filtered.map(p => {
                const { isExpired, isOutOfStock } = productStatus(p);
                const rowBg = isExpired ? '#FFF5F5' : isOutOfStock ? '#FAFAFA' : '#fff';
                const rowHover = isExpired ? '#FEE2E2' : isOutOfStock ? '#F3F4F6' : '#F0FDF4';
                return (
                  <div
                    key={p.id}
                    onMouseDown={() => select(p)}
                    style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: rowBg, opacity: isExpired ? 0.8 : 1 }}
                    onMouseEnter={e => e.currentTarget.style.background = rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = rowBg}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: isExpired || isOutOfStock ? '#6B7280' : 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        <StockBadge p={p} />
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {p.taxRate?.rate ? `GST ${p.taxRate.rate}%` : 'No GST'}
                        {p.hsnCode ? ` · HSN ${p.hsnCode}` : ''}
                        {p.expiryDate && <span style={{ color: productStatus(p).isExpired ? '#DC2626' : '#D97706', marginLeft: 4 }}>· Exp: {new Date(p.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>₹{Number(p.sellingPrice).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: 11, color: isOutOfStock ? '#DC2626' : Number(p.stock) <= (p.lowStockAlert || 5) ? '#D97706' : '#9CA3AF', fontWeight: isOutOfStock || Number(p.stock) <= (p.lowStockAlert || 5) ? 600 : 400 }}>
                        {Number(p.stock)} in stock
                      </div>
                    </div>
                  </div>
                );
              })}

              {query.trim() && (
                <div
                  onMouseDown={() => { setOpen(false); onChange({ description: query, productId: null, taxRate: 0 }); }}
                  style={{ padding: '8px 14px', cursor: 'pointer', background: '#F9FAFB', fontSize: 13, color: '#6B7280', fontStyle: 'italic', borderTop: '1px solid #F3F4F6' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F9FAFB'}
                >
                  + Use "{query}" as custom item
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Invoice creation modal ───────────────────────────────────────────────────

const emptyItem = () => ({ productId: null, description: '', qty: 1, unitPrice: 0, taxRate: 0, discount: 0 });

function CreateInvoiceModal({ branchId, onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ customerId: '', dueDate: '', notes: '', items: [emptyItem()] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCustomers().then(r => setCustomers(r.data.data || [])).catch(() => {});
    const productParams = branchId ? { branchId } : {};
    getProducts(productParams).then(r => setProducts(r.data.data || [])).catch(() => {});
  }, [branchId]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setItemField = (i, k, v) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [k]: v };
    return { ...f, items };
  });

  const setItemProduct = (i, fields) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], ...fields };
    return { ...f, items };
  });

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const lineGross = (it) => Number(it.qty) * Number(it.unitPrice);
  const lineBase  = (it) => lineGross(it) * (1 - (Number(it.discount) / 100));
  const lineTax   = (it) => lineBase(it) * (Number(it.taxRate) / 100);
  const lineTotal = (it) => lineBase(it) + lineTax(it);
  const grossSubtotal  = form.items.reduce((s, it) => s + lineGross(it), 0);
  const subtotal       = form.items.reduce((s, it) => s + lineBase(it), 0);
  const totalDiscount  = grossSubtotal - subtotal;
  const totalTax       = form.items.reduce((s, it) => s + lineTax(it), 0);
  const grandTotal     = subtotal + totalTax;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.items.every(it => it.description.trim() && Number(it.qty) > 0 && Number(it.unitPrice) >= 0)) {
      return toast.error('Fill all item details');
    }
    setLoading(true);
    try {
      await createInvoice({
        customerId: form.customerId || undefined,
        dueDate: form.dueDate || undefined,
        notes: form.notes,
        ...(branchId && { branchId }),
        items: form.items.map(it => ({
          productId: it.productId || undefined,
          description: it.description,
          quantity: Number(it.qty),
          unitPrice: Number(it.unitPrice),
          taxRate: Number(it.taxRate || 0),
          discount: Number(it.discount || 0),
        })),
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
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>New Invoice</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Customer + Due date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Customer (optional)</label>
              <select value={form.customerId} onChange={e => setField('customerId', e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, background: '#fff', outline: 'none' }}>
                <option value="">Walk-in customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Due date" type="date" value={form.dueDate} onChange={e => setField('dueDate', e.target.value)} />
          </div>

          {/* Line items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Line Items</label>
              <button type="button" onClick={addItem} style={{ fontSize: 13, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>+ Add item</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.items.map((it, i) => (
                <div key={i} style={{ background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Row 1: product search */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <ProductSearchInput
                      value={it.description}
                      productId={it.productId}
                      products={products}
                      onChange={(fields) => setItemProduct(i, fields)}
                    />
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex', flexShrink: 0, padding: 2 }}>
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  {/* Row 2: qty | price | discount | total */}
                  <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 140px 90px', gap: 8 }}>
                    {/* Qty */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Qty</div>
                      <input
                        type="number" min="0.1" step="0.1"
                        value={it.qty}
                        onChange={e => setItemField(i, 'qty', e.target.value)}
                        style={{ padding: '8px 6px', border: '1.5px solid #D1D5DB', borderRadius: 7, fontSize: 13, textAlign: 'center', width: '100%', boxSizing: 'border-box', background: '#fff' }}
                      />
                    </div>
                    {/* Price */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Price (₹)</div>
                      <input
                        type="number" min="0" step="0.01"
                        value={it.unitPrice}
                        onChange={e => setItemField(i, 'unitPrice', e.target.value)}
                        style={{ padding: '8px 8px', border: '1.5px solid #D1D5DB', borderRadius: 7, fontSize: 13, width: '100%', boxSizing: 'border-box', background: '#fff' }}
                      />
                    </div>
                    {/* Discount — always amber so it stands out */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Discount %</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#FFFBEB', border: `2px solid ${Number(it.discount) > 0 ? '#F59E0B' : '#FCD34D'}`, borderRadius: 7, overflow: 'hidden' }}>
                        <input
                          type="number" min="0" max="100" step="0.5"
                          value={it.discount}
                          onChange={e => setItemField(i, 'discount', e.target.value)}
                          placeholder="0"
                          style={{ padding: '8px 6px', border: 'none', fontSize: 13, width: '100%', boxSizing: 'border-box', background: 'transparent', outline: 'none', fontWeight: Number(it.discount) > 0 ? 700 : 400, color: Number(it.discount) > 0 ? '#92400E' : '#D97706' }}
                        />
                        <span style={{ padding: '0 8px', fontSize: 13, fontWeight: 700, color: '#F59E0B', background: '#FEF3C7', borderLeft: '1px solid #FCD34D', height: '100%', display: 'flex', alignItems: 'center', flexShrink: 0 }}>%</span>
                      </div>
                    </div>
                    {/* Total */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', paddingTop: 6 }}>{fmt(lineTotal(it))}</div>
                      {(Number(it.discount) > 0 || it.taxRate > 0) && (
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                          {Number(it.discount) > 0 && <span style={{ color: '#D97706' }}>−{it.discount}% </span>}
                          {it.taxRate > 0 && <span>+{it.taxRate}% GST</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24 }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>Subtotal</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', minWidth: 90, textAlign: 'right' }}>{fmt(grossSubtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24 }}>
                  <span style={{ fontSize: 13, color: '#F59E0B' }}>Discount</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B', minWidth: 90, textAlign: 'right' }}>− {fmt(totalDiscount)}</span>
                </div>
              )}
              {totalTax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24 }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>GST</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#D97706', minWidth: 90, textAlign: 'right' }}>{fmt(totalTax)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, borderTop: '1.5px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Total</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', minWidth: 90, textAlign: 'right' }}>{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>

          <Input label="Notes (optional)" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Payment terms, remarks..." />

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
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
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [payInvoice, setPayInvoice] = useState(null);
  const [viewInvoiceId, setViewInvoiceId] = useState(null);
  const [paymentLinkInvoice, setPaymentLinkInvoice] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const PAGE_LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_LIMIT };
      if (statusFilter) params.status = statusFilter;
      if (branchId) params.branchId = branchId;
      const r = await getInvoices(params);
      const d = r.data.data;
      if (d && d.invoices) {
        setInvoices(d.invoices);
        setPagination({ total: d.total, totalPages: d.totalPages, page: d.page, limit: d.limit });
      } else {
        setInvoices(d || []);
        setPagination(null);
      }
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, branchId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter, branchId]);

  const filtered = search ? invoices.filter(i =>
    i.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    i.customer?.name?.toLowerCase().includes(search.toLowerCase())
  ) : invoices;

  const total = invoices.filter(i => i.status !== 'DRAFT').reduce((s, inv) => s + (inv.total || 0), 0);
  const paid = invoices.filter(i => i.status === 'PAID').reduce((s, inv) => s + (inv.amountPaid || 0), 0);
  const outstanding = invoices.filter(i => ['SENT', 'PARTIAL', 'OVERDUE'].includes(i.status)).reduce((s, inv) => s + ((inv.total || 0) - (inv.amountPaid || 0)), 0);
  const overdue = invoices.filter(i => i.status === 'OVERDUE').length;

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1100, margin: '0 auto' }}>
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Invoices</h1>
          <p style={P.sub}>{pagination ? `${pagination.total} invoices` : `${invoices.length} invoices`}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} style={{ marginRight: 6 }} />New Invoice</Button>
      </div>

      <KpiBar stats={[
        { label: 'Total Invoiced', value: fmt(total), icon: FileText, color: 'var(--cyan)' },
        { label: 'Collected', value: fmt(paid), icon: CheckCircle, color: '#16A34A' },
        { label: 'Outstanding', value: fmt(outstanding), icon: Clock, color: '#D97706' },
        { label: 'Overdue', value: overdue, icon: AlertCircle, color: '#DC2626' },
      ]} />

      {/* Filters */}
      <div style={P.bar}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..."
            style={P.searchInput} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...P.input, width: 'auto' }}>
          <option value="">All status</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={P.tableWrap}>
        <div style={P.tableScroll}>
        <table style={{ ...P.table, minWidth: isMobile ? 'auto' : 600 }}>
          <thead style={P.thead}>
            <tr>
              {['Invoice #', 'Customer', 'Date', 'Due Date', 'Amount', 'Paid', 'Status', 'Actions'].map(h => (
                <th key={h} style={P.th()}>{h}</th>
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
            ) : filtered.map((inv, i) => (
              <tr key={inv.id} style={{ ...P.tr(i, filtered.length), transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={{ ...P.td(), fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>{inv.invoiceNumber}</td>
                <td style={P.td()}>{inv.customer?.name || <span style={{ color: '#9CA3AF' }}>Walk-in</span>}</td>
                <td style={{ ...P.td(), color: '#6B7280' }}>{fmtDate(inv.createdAt)}</td>
                <td style={{ ...P.td(), color: '#6B7280' }}>{fmtDate(inv.dueDate)}</td>
                <td style={{ ...P.td(), fontWeight: 600 }}>{fmt(inv.total)}</td>
                <td style={{ ...P.td(), color: '#16A34A', fontWeight: 600 }}>{fmt(inv.amountPaid)}</td>
                <td style={P.td()}><Badge status={inv.status} /></td>
                <td style={P.td()}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={() => setViewInvoiceId(inv.id)}
                      title="View / Print PDF"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--navy)', background: '#F3F4F6', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}
                    >
                      <Eye size={13} /> View
                    </button>
                    {inv.status === 'DRAFT' && (
                      <button
                        onClick={async () => { await updateInvoiceStatus(inv.id, 'SENT'); load(); toast.success('Invoice sent'); }}
                        style={{ fontSize: 13, color: '#fff', background: 'var(--navy)', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}
                      >
                        Send
                      </button>
                    )}
                    {!['PAID', 'CANCELLED', 'DRAFT'].includes(inv.status) && (
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
                        onClick={() => {
                          const phone = '91' + inv.customer.phone.replace(/\D/g, '').slice(-10);
                          const amount = (inv.balanceDue || inv.total || 0).toLocaleString('en-IN');
                          const due = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                          const msg = `Hi ${inv.customer.name}, this is a payment reminder for Invoice *${inv.invoiceNumber}* of *₹${amount}*${due ? ` due on ${due}` : ''}. Please pay at your earliest convenience. Thank you!`;
                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        title="Send payment reminder on WhatsApp"
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
        {pagination && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
            label="invoices"
          />
        )}
      </div>

      {showCreate && <CreateInvoiceModal branchId={branchId} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {payInvoice && <PaymentModal invoice={payInvoice} onClose={() => setPayInvoice(null)} onDone={() => { setPayInvoice(null); load(); }} />}
      {viewInvoiceId && <InvoiceView invoiceId={viewInvoiceId} onClose={() => setViewInvoiceId(null)} />}
      {paymentLinkInvoice && <PaymentLinkModal invoice={paymentLinkInvoice} onClose={() => { setPaymentLinkInvoice(null); load(); }} />}
    </div>
  );
}

