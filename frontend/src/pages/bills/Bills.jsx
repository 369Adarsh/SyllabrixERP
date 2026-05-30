import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import { getBills, createBill, payBill, cancelBill, getBillsSummary, getVendors } from '../../api';
import { Plus, FileText, Search, X, AlertCircle, Clock, CheckCircle, Truck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS = {
  PENDING:   { bg: '#FFF7ED', color: '#C2410C', label: 'Pending' },
  PARTIAL:   { bg: '#FFFBEB', color: '#D97706', label: 'Partial' },
  PAID:      { bg: '#F0FDF4', color: '#16A34A', label: 'Paid' },
  OVERDUE:   { bg: '#FEF2F2', color: '#DC2626', label: 'Overdue' },
  CANCELLED: { bg: '#F9FAFB', color: '#9CA3AF', label: 'Cancelled' },
};

function CreateBillModal({ onClose, onCreated }) {
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ vendorId: '', dueDate: '', notes: '', items: [{ description: '', quantity: 1, unitPrice: 0 }] });
  const [loading, setLoading] = useState(false);

  useEffect(() => { getVendors().then(r => setVendors(r.data.data || [])).catch(() => {}); }, []);

  const setItem = (i, k, v) => setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items }; });
  const subtotal = form.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBill({ ...form, items: form.items.map(i => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })) });
      toast.success('Bill created');
      onCreated();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>New Vendor Bill</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Vendor</label>
              <select value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                <option value="">Select vendor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <Input label="Due date" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Line Items</label>
              <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, unitPrice: 0 }] }))} style={{ fontSize: 13, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add item</button>
            </div>
            {form.items.map((it, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 28px', gap: 8, marginBottom: 8 }}>
                <input placeholder="Description" value={it.description} onChange={e => setItem(i, 'description', e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
                <input type="number" min="1" value={it.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, textAlign: 'center' }} />
                <input type="number" min="0" value={it.unitPrice} onChange={e => setItem(i, 'unitPrice', e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
                {form.items.length > 1 && <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><X size={14} /></button>}
              </div>
            ))}
            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginTop: 8 }}>Total: {fmt(subtotal)}</div>
          </div>
          <Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Bill</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PayModal({ bill, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK');
  const [loading, setLoading] = useState(false);
  const remaining = bill.balanceDue || 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Enter valid amount');
    setLoading(true);
    try { await payBill(bill.id, { amount: Number(amount), method }); toast.success('Payment recorded'); onDone(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Record Payment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Balance due: <strong>{fmt(remaining)}</strong></p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Amount (₹)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={String(remaining)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              {['BANK', 'CASH', 'UPI', 'CHEQUE', 'NEFT', 'RTGS'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Record</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Bills() {
  const { isMobile } = useBreakpoint();
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [payBillItem, setPayBillItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([getBills({ status: statusFilter || undefined }), getBillsSummary()]);
      setBills(b.data.data || []);
      setSummary(s.data.data);
    } catch { toast.error('Failed to load bills'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = bills.filter(b => !search || b.vendor?.name?.toLowerCase().includes(search.toLowerCase()) || b.billNumber?.includes(search));

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1100, margin: '0 auto' }}>
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Vendor Bills</h1>
          <p style={P.sub}>Accounts payable — money you owe vendors</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} style={{ marginRight: 6 }} />New Bill</Button>
      </div>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Pending', value: fmt(summary.pendingAmount), sub: `${summary.pendingCount} bills`, icon: Clock, color: '#D97706' },
            { label: 'Overdue', value: fmt(summary.overdueAmount), sub: `${summary.overdueCount} bills`, icon: AlertCircle, color: '#DC2626' },
            { label: 'Paid this month', value: fmt(summary.paidThisMonth), sub: 'Settled', icon: CheckCircle, color: '#16A34A' },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <Card key={label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, background: color + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>{value}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{sub}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ ...P.bar, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bills..."
            style={{ ...P.searchInput }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...P.input, width: 'auto' }}>
          <option value="">All</option>
          {Object.keys(STATUS).map(s => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
      </div>

      <div style={P.tableWrap}>
        <div style={P.tableScroll}>
        <table style={P.table}>
          <thead style={P.thead}>
            <tr>
              {['Bill #', 'Vendor', 'Date', 'Due Date', 'Total', 'Balance', 'Status', 'Actions'].map(h => (
                <th key={h} style={P.th()}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={P.empty}>Loading...</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={8} style={P.empty}><FileText size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />No bills yet</td></tr>
            : filtered.map((bill, i) => {
              const st = STATUS[bill.status] || STATUS.PENDING;
              return (
                <tr key={bill.id} style={{ ...P.tr(i, filtered.length), cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ ...P.td(), fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{bill.billNumber}</td>
                  <td style={P.td()}>{bill.vendor?.name || <span style={{ color: '#9CA3AF' }}>—</span>}</td>
                  <td style={{ ...P.td(), color: '#6B7280' }}>{fmtDate(bill.createdAt)}</td>
                  <td style={{ ...P.td(), color: bill.status === 'OVERDUE' ? '#DC2626' : '#6B7280' }}>{fmtDate(bill.dueDate)}</td>
                  <td style={{ ...P.td(), fontWeight: 600 }}>{fmt(bill.total)}</td>
                  <td style={{ ...P.td(), fontWeight: 600, color: bill.balanceDue > 0 ? '#DC2626' : '#16A34A' }}>{fmt(bill.balanceDue)}</td>
                  <td style={P.td()}><span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{st.label}</span></td>
                  <td style={P.td()}>
                    {!['PAID', 'CANCELLED'].includes(bill.status) && (
                      <button onClick={() => setPayBillItem(bill)} style={{ fontSize: 13, color: 'var(--emerald)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Pay</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {showCreate && <CreateBillModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {payBillItem && <PayModal bill={payBillItem} onClose={() => setPayBillItem(null)} onDone={() => { setPayBillItem(null); load(); }} />}
    </div>
  );
}

