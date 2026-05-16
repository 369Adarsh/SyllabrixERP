import { useState, useEffect, useCallback } from 'react';
import { getVendors, createVendor, updateVendor, getPurchaseOrders, createPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder, getProducts } from '../../api';
import { Plus, Truck, X, Search, CheckCircle, Package } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PO_STATUS = {
  DRAFT:     { bg: '#F3F4F6', color: '#6B7280' },
  ORDERED:   { bg: '#EFF6FF', color: '#3B82F6' },
  PARTIAL:   { bg: '#FFFBEB', color: '#D97706' },
  RECEIVED:  { bg: '#F0FDF4', color: '#16A34A' },
  CANCELLED: { bg: '#FEF2F2', color: '#DC2626' },
};

function VendorModal({ vendor, onClose, onSaved }) {
  const [form, setForm] = useState({ name: vendor?.name || '', contactPerson: vendor?.contactPerson || '', phone: vendor?.phone || '', email: vendor?.email || '', address: vendor?.address || '', gstin: vendor?.gstin || '', paymentTerms: vendor?.paymentTerms || '', notes: vendor?.notes || '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Vendor name required');
    setLoading(true);
    try {
      vendor ? await updateVendor(vendor.id, form) : await createVendor(form);
      toast.success(vendor ? 'Vendor updated' : 'Vendor added');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>{vendor ? 'Edit Vendor' : 'Add Vendor / Supplier'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Company / Vendor name *" value={form.name} onChange={set('name')} placeholder="Sharma Distributors" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Contact person" value={form.contactPerson} onChange={set('contactPerson')} placeholder="Raj Sharma" />
            <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="9876543210" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="raj@sharma.com" />
            <Input label="GSTIN" value={form.gstin} onChange={set('gstin')} placeholder="27AAPFU0939F1ZV" />
          </div>
          <Input label="Address" value={form.address} onChange={set('address')} placeholder="Street, City, State" />
          <Input label="Payment terms" value={form.paymentTerms} onChange={set('paymentTerms')} placeholder="e.g. Net 30 days, Advance" />
          <Input label="Notes" value={form.notes} onChange={set('notes')} placeholder="Any remarks..." />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{vendor ? 'Save changes' : 'Add vendor'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreatePOModal({ vendors, onClose, onCreated }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ vendorId: '', expectedDate: '', notes: '', items: [{ productId: '', description: '', quantity: 1, unitCost: 0, taxRate: 0 }] });
  const [loading, setLoading] = useState(false);

  useEffect(() => { getProducts().then(r => setProducts(r.data.data || [])).catch(() => {}); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setItem = (i, k, v) => { const items = [...form.items]; items[i] = { ...items[i], [k]: v }; setForm(f => ({ ...f, items })); };
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', description: '', quantity: 1, unitCost: 0, taxRate: 0 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const total = form.items.reduce((s, it) => s + (Number(it.quantity) * Number(it.unitCost)), 0);

  const handleProductSelect = (i, productId) => {
    const prod = products.find(p => p.id === productId);
    const items = [...form.items];
    items[i] = { ...items[i], productId, description: prod?.name || '', unitCost: prod?.costPrice || 0 };
    setForm(f => ({ ...f, items }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.items.every(it => it.description.trim() && it.quantity > 0)) return toast.error('Fill all item details');
    setLoading(true);
    try {
      await createPurchaseOrder({ ...form, items: form.items.map(it => ({ ...it, quantity: Number(it.quantity), unitCost: Number(it.unitCost), taxRate: Number(it.taxRate) })) });
      toast.success('Purchase order created');
      onCreated();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>New Purchase Order</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Vendor (optional)</label>
              <select value={form.vendorId} onChange={set('vendorId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                <option value="">No vendor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <Input label="Expected delivery" type="date" value={form.expectedDate} onChange={set('expectedDate')} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Items</label>
              <button type="button" onClick={addItem} style={{ fontSize: 13, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add item</button>
            </div>
            {form.items.map((it, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 28px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <div>
                  <select value={it.productId} onChange={e => handleProductSelect(i, e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: '#fff', marginBottom: 4 }}>
                    <option value="">Custom item</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input value={it.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Description" style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <input type="number" min="1" value={it.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} placeholder="Qty" style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                <input type="number" min="0" step="0.01" value={it.unitCost} onChange={e => setItem(i, 'unitCost', e.target.value)} placeholder="Cost ₹" style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                <input type="number" min="0" max="28" value={it.taxRate} onChange={e => setItem(i, 'taxRate', e.target.value)} placeholder="GST%" style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><X size={14} /></button>}
              </div>
            ))}
            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginTop: 8 }}>Total: {fmt(total)}</div>
          </div>

          <Input label="Notes" value={form.notes} onChange={set('notes')} placeholder="Delivery instructions, remarks..." />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create PO</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Vendors() {
  const [tab, setTab] = useState('po');
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [editVendor, setEditVendor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vr, pr] = await Promise.all([getVendors(search ? { search } : {}), getPurchaseOrders()]);
      setVendors(vr.data.data || []);
      setOrders(pr.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleReceive = async (id) => {
    if (!window.confirm('Mark this PO as received? This will update inventory stock.')) return;
    try { await receivePurchaseOrder(id); toast.success('Stock updated!'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this purchase order?')) return;
    try { await cancelPurchaseOrder(id); toast.success('Cancelled'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const totalOrdered = orders.filter(o => !['CANCELLED', 'RECEIVED'].includes(o.status)).reduce((s, o) => s + (o.total || 0), 0);
  const totalReceived = orders.filter(o => o.status === 'RECEIVED').reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Vendors & Purchases</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>{vendors.length} vendors, {orders.length} purchase orders</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={() => setModal('vendor')}><Plus size={15} style={{ marginRight: 5 }} />Add Vendor</Button>
          <Button onClick={() => setModal('po')}><Plus size={15} style={{ marginRight: 5 }} />New Purchase Order</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Vendors', value: vendors.length, color: 'var(--navy)', icon: Truck },
          { label: 'Active POs', value: orders.filter(o => !['CANCELLED', 'RECEIVED'].includes(o.status)).length, color: '#3B82F6', icon: Package },
          { label: 'Pending Value', value: fmt(totalOrdered), color: '#D97706', icon: Package },
          { label: 'Total Purchased', value: fmt(totalReceived), color: '#16A34A', icon: CheckCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, background: color + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={color} /></div>
            <div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#F3F4F6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ id: 'po', label: 'Purchase Orders' }, { id: 'vendors', label: 'Vendors' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? 'var(--navy)' : '#6B7280', boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'po' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                {['PO Number', 'Vendor', 'Date', 'Expected', 'Items', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
              : orders.length === 0 ? <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>No purchase orders yet</td></tr>
              : orders.map(o => {
                const s = PO_STATUS[o.status] || PO_STATUS.DRAFT;
                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>{o.poNumber}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>{o.vendor?.name || <span style={{ color: '#9CA3AF' }}>No vendor</span>}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{fmtDate(o.createdAt)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{fmtDate(o.expectedDate)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>{o.items?.length || 0}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700 }}>{fmt(o.total)}</td>
                    <td style={{ padding: '14px 16px' }}><span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{o.status}</span></td>
                    <td style={{ padding: '14px 16px' }}>
                      {['DRAFT', 'ORDERED', 'PARTIAL'].includes(o.status) && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleReceive(o.id)} style={{ fontSize: 12, color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark Received</button>
                          <button onClick={() => handleCancel(o.id)} style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'vendors' && (
        <>
          <div style={{ position: 'relative', marginBottom: 16, maxWidth: 360 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {vendors.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 64, color: '#9CA3AF' }}>
                <Truck size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: '#6B7280' }}>No vendors yet</div>
              </div>
            ) : vendors.map(v => (
              <div key={v.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{v.name}</div>
                    {v.contactPerson && <div style={{ fontSize: 13, color: '#6B7280' }}>{v.contactPerson}</div>}
                  </div>
                  <button onClick={() => setEditVendor(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 12, fontWeight: 600 }}>Edit</button>
                </div>
                {v.phone && <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{v.phone}</div>}
                {v.gstin && <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>GSTIN: {v.gstin}</div>}
                {v.paymentTerms && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{v.paymentTerms}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {modal === 'vendor' && <VendorModal onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal === 'po' && <CreatePOModal vendors={vendors} onClose={() => setModal(null)} onCreated={() => { setModal(null); load(); }} />}
      {editVendor && <VendorModal vendor={editVendor} onClose={() => setEditVendor(null)} onSaved={() => { setEditVendor(null); load(); }} />}
    </div>
  );
}
