import { useState, useEffect, useCallback, useRef } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import KpiBar from '../../components/ui/KpiBar';
import { P } from '../../styles/page';
import { useBranch } from '../../context/BranchContext';
import { getVendors, createVendor, updateVendor, getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder, getProducts, getVendorCatalog, addVendorCatalogItem, updateVendorCatalogItem, deleteVendorCatalogItem, getReorderSuggestions, getBills, createBill, payBill, cancelBill, getBillsSummary, getMyPartnerships } from '../../api';
import GRNModal from './GRNModal';
import { Plus, Truck, X, Search, CheckCircle, Package, AlertTriangle, Edit2, Trash2, BookOpen, ShoppingBag, Link2, PlusCircle, FileText, Clock, AlertCircle, Wifi, WifiOff, Star, Phone, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PO_STATUS = {
  DRAFT:     { bg: '#F3F4F6', color: '#6B7280' },
  ORDERED:   { bg: '#EFF6FF', color: '#3B82F6' },
  PARTIAL:   { bg: '#FFFBEB', color: '#D97706' },
  RECEIVED:  { bg: '#F0FDF4', color: '#16A34A' },
  CANCELLED: { bg: '#FEF2F2', color: '#DC2626' },
};

const BILL_STATUS = {
  PENDING:   { bg: '#FFF7ED', color: '#C2410C', label: 'Pending' },
  PARTIAL:   { bg: '#FFFBEB', color: '#D97706', label: 'Partial' },
  PAID:      { bg: '#F0FDF4', color: '#16A34A', label: 'Paid' },
  OVERDUE:   { bg: '#FEF2F2', color: '#DC2626', label: 'Overdue' },
  CANCELLED: { bg: '#F9FAFB', color: '#9CA3AF', label: 'Cancelled' },
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

// ─── Searchable product combobox for PO items ────────────────────────────────

function POProductSearchInput({ value, productId, products, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  const filtered = products
    .filter(p => !query.trim() || p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 60);

  useEffect(() => {
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (p) => {
    setQuery(p.name);
    setOpen(false);
    onChange({ description: p.name, unitCost: p.costPrice || 0, taxRate: p.taxRate?.rate || 0, productId: p.id });
  };

  const unlink = () => {
    setQuery('');
    onChange({ description: '', unitCost: 0, taxRate: 0, productId: null });
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); onChange({ description: e.target.value, productId: null }); }}
          onFocus={() => setOpen(true)}
          placeholder="Search inventory or type item name…"
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
        <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.13)', zIndex: 400, maxHeight: 300, overflowY: 'auto' }}>
          {products.length === 0 ? (
            <div style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: 13, fontStyle: 'italic' }}>No products in inventory yet</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: 13, fontStyle: 'italic' }}>No match — "{query}" will be added as a custom item</div>
          ) : (
            <>
              {!query.trim() && (
                <div style={{ padding: '6px 14px', fontSize: 11, color: '#9CA3AF', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', fontWeight: 600 }}>
                  {products.length} products in inventory · type to filter
                </div>
              )}
              {filtered.map(p => {
                const isLow = Number(p.stock) > 0 && Number(p.stock) <= Number(p.lowStockAlert || 5);
                const isOut = Number(p.stock) <= 0;
                return (
                  <div key={p.id} onMouseDown={() => select(p)}
                    style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F0FDF4'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        {isOut && <span style={{ fontSize: 10, fontWeight: 700, background: '#FEE2E2', color: '#DC2626', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>OUT OF STOCK</span>}
                        {isLow && !isOut && <span style={{ fontSize: 10, fontWeight: 700, background: '#FFF7ED', color: '#EA580C', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>LOW STOCK</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {p.sku ? `SKU: ${p.sku} · ` : ''}{p.taxRate?.rate ? `GST ${p.taxRate.rate}%` : 'No GST'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>₹{Number(p.costPrice || 0).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: 11, color: isOut ? '#DC2626' : isLow ? '#D97706' : '#9CA3AF', fontWeight: isOut || isLow ? 600 : 400 }}>
                        {p.stock} in stock
                      </div>
                    </div>
                  </div>
                );
              })}
              {query.trim() && (
                <div
                  onMouseDown={() => { setOpen(false); onChange({ description: query, productId: null }); }}
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

// ─── Vendor Catalog Manager modal ────────────────────────────────────────────

function VendorCatalogModal({ vendor, myProducts, onClose }) {
  const [catalog, setCatalog] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ itemName: '', vendorSku: '', vendorPrice: '', minOrderQty: 1, productId: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = () => {
    setFetching(true);
    getVendorCatalog(vendor.id).then(r => setCatalog(r.data.data || [])).catch(() => {}).finally(() => setFetching(false));
  };
  useEffect(load, [vendor.id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.itemName.trim()) return toast.error('Item name required');
    setSaving(true);
    try {
      await addVendorCatalogItem(vendor.id, { ...form, vendorPrice: Number(form.vendorPrice || 0), minOrderQty: Number(form.minOrderQty || 1), productId: form.productId || null });
      toast.success('Added to catalog');
      setForm({ itemName: '', vendorSku: '', vendorPrice: '', minOrderQty: 1, productId: '', notes: '' });
      setAdding(false);
      load();
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const handleUpdate = async (id) => {
    setSaving(true);
    try {
      await updateVendorCatalogItem(id, { ...editForm, vendorPrice: Number(editForm.vendorPrice || 0), minOrderQty: Number(editForm.minOrderQty || 1), productId: editForm.productId || null });
      setEditId(null);
      load();
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item from vendor catalog?')) return;
    try { await deleteVendorCatalogItem(id); toast.success('Removed'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Vendor Catalog</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{vendor.name} — items this vendor can supply</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        {/* Catalog list */}
        {fetching ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>Loading catalog…</div>
        ) : catalog.length === 0 && !adding ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
            <BookOpen size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>No catalog items yet</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Add items this vendor supplies with their prices</div>
            <Button onClick={() => setAdding(true)}>Add First Item</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {catalog.map(item => (
              <div key={item.id} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 14px' }}>
                {editId === item.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', marginBottom: 3 }}>ITEM NAME</div>
                        <input value={editForm.itemName} onChange={e => setEditForm(f => ({ ...f, itemName: e.target.value }))} style={{ width: '100%', padding: '7px 9px', border: '1.5px solid #D1D5DB', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} /></div>
                      <div><div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', marginBottom: 3 }}>VENDOR SKU</div>
                        <input value={editForm.vendorSku || ''} onChange={e => setEditForm(f => ({ ...f, vendorSku: e.target.value }))} style={{ width: '100%', padding: '7px 9px', border: '1.5px solid #D1D5DB', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} /></div>
                      <div><div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', marginBottom: 3 }}>PRICE (₹)</div>
                        <input type="number" min="0" value={editForm.vendorPrice} onChange={e => setEditForm(f => ({ ...f, vendorPrice: e.target.value }))} style={{ width: '100%', padding: '7px 9px', border: '1.5px solid #D1D5DB', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} /></div>
                      <div><div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', marginBottom: 3 }}>MIN QTY</div>
                        <input type="number" min="1" value={editForm.minOrderQty} onChange={e => setEditForm(f => ({ ...f, minOrderQty: e.target.value }))} style={{ width: '100%', padding: '7px 9px', border: '1.5px solid #D1D5DB', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Button type="button" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                      <Button loading={saving} onClick={() => handleUpdate(item.id)}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{item.itemName}</span>
                        {item.product && <span style={{ fontSize: 10, background: '#ECFDF5', color: '#059669', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>Linked to inventory</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, display: 'flex', gap: 10 }}>
                        {item.vendorSku && <span>SKU: {item.vendorSku}</span>}
                        <span>Min: {item.minOrderQty} units</span>
                        {item.product && <span style={{ color: Number(item.product.stock) <= Number(item.product.lowStockAlert) ? '#D97706' : '#9CA3AF' }}>Stock: {item.product.stock}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>₹{Number(item.vendorPrice).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>per unit</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setEditId(item.id); setEditForm({ itemName: item.itemName, vendorSku: item.vendorSku || '', vendorPrice: item.vendorPrice, minOrderQty: item.minOrderQty, productId: item.productId || '' }); }}
                          style={{ background: '#F3F4F6', border: 'none', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: '#6B7280', display: 'flex' }}><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(item.id)}
                          style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: '#DC2626', display: 'flex' }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new item form */}
        {adding ? (
          <form onSubmit={handleAdd} style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginBottom: 2 }}>Add New Catalog Item</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 3 }}>ITEM NAME *</div>
                <input value={form.itemName} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))} placeholder="Chana Dal 1kg" required style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #BFDBFE', borderRadius: 7, fontSize: 13, boxSizing: 'border-box', background: '#fff' }} /></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 3 }}>VENDOR SKU</div>
                <input value={form.vendorSku} onChange={e => setForm(f => ({ ...f, vendorSku: e.target.value }))} placeholder="CDL-001" style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #BFDBFE', borderRadius: 7, fontSize: 13, boxSizing: 'border-box', background: '#fff' }} /></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 3 }}>PRICE (₹) *</div>
                <input type="number" min="0" value={form.vendorPrice} onChange={e => setForm(f => ({ ...f, vendorPrice: e.target.value }))} placeholder="65" required style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #BFDBFE', borderRadius: 7, fontSize: 13, boxSizing: 'border-box', background: '#fff' }} /></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 3 }}>MIN ORDER QTY</div>
                <input type="number" min="1" value={form.minOrderQty} onChange={e => setForm(f => ({ ...f, minOrderQty: e.target.value }))} placeholder="1" style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #BFDBFE', borderRadius: 7, fontSize: 13, boxSizing: 'border-box', background: '#fff' }} /></div>
            </div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 3 }}>LINK TO YOUR INVENTORY (optional)</div>
              <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #BFDBFE', borderRadius: 7, fontSize: 13, background: '#fff' }}>
                <option value="">Don't link to inventory</option>
                {myProducts.map(p => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Add Item</Button>
            </div>
          </form>
        ) : catalog.length > 0 && (
          <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--cyan)', background: 'none', border: '1.5px dashed var(--cyan)', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 700, width: '100%', justifyContent: 'center' }}>
            <PlusCircle size={15} /> Add another item
          </button>
        )}
      </div>
    </div>
  );
}

// ─── New Purchase Order modal ─────────────────────────────────────────────────

function CreatePOModal({ vendors, myProducts, onClose, onCreated }) {
  const { branchId } = useBranch();
  const [vendorCatalog, setVendorCatalog] = useState([]);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [customSearch, setCustomSearch] = useState('');
  const [addMode, setAddMode] = useState('catalog'); // 'catalog' | 'custom'
  const [showAlerts, setShowAlerts] = useState(true);
  const [form, setForm] = useState({ vendorId: '', expectedDate: '', notes: '', items: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getReorderSuggestions().then(r => setReorderAlerts(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.vendorId) {
      getVendorCatalog(form.vendorId).then(r => setVendorCatalog(r.data.data || [])).catch(() => {});
    } else {
      setVendorCatalog([]);
    }
    setCatalogSearch('');
  }, [form.vendorId]);

  const addItem = (item) => {
    setForm(f => {
      const exists = f.items.findIndex(i => i._key === item._key);
      if (exists >= 0) {
        const items = [...f.items];
        items[exists] = { ...items[exists], quantity: items[exists].quantity + 1 };
        return { ...f, items };
      }
      return { ...f, items: [...f.items, item] };
    });
  };

  const addFromCatalog = (ci) => addItem({
    _key: `catalog-${ci.id}`,
    description: ci.itemName,
    vendorSku: ci.vendorSku,
    productId: ci.productId || null,
    quantity: ci.minOrderQty || 1,
    unitCost: ci.vendorPrice || 0,
    taxRate: 0,
    _source: 'catalog',
    _catalogId: ci.id,
  });

  const addFromReorder = (suggestion, vendorInfo) => {
    if (!form.vendorId && vendorInfo) {
      setForm(f => ({ ...f, vendorId: vendorInfo.vendorId }));
    }
    addItem({
      _key: `reorder-${suggestion.id}`,
      description: vendorInfo ? vendorInfo.itemName : suggestion.name,
      productId: suggestion.id,
      quantity: suggestion.suggestedQty || 1,
      unitCost: vendorInfo ? vendorInfo.vendorPrice : 0,
      taxRate: 0,
      _source: 'reorder',
    });
  };

  const addCustom = (desc, product) => addItem({
    _key: `custom-${Date.now()}`,
    description: desc,
    productId: product?.id || null,
    quantity: 1,
    unitCost: product?.costPrice || 0,
    taxRate: product?.taxRate?.rate || 0,
    _source: 'custom',
  });

  const setItemField = (idx, k, v) => setForm(f => {
    const items = [...f.items];
    items[idx] = { ...items[idx], [k]: v };
    return { ...f, items };
  });
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const lineTotal = (it) => Number(it.quantity) * Number(it.unitCost) * (1 + Number(it.taxRate) / 100);
  const subtotal  = form.items.reduce((s, it) => s + Number(it.quantity) * Number(it.unitCost), 0);
  const totalTax  = form.items.reduce((s, it) => s + Number(it.quantity) * Number(it.unitCost) * Number(it.taxRate) / 100, 0);
  const grandTotal = subtotal + totalTax;

  const selectedVendor = vendors.find(v => v.id === form.vendorId);
  const filteredCatalog = vendorCatalog.filter(ci => !catalogSearch || ci.itemName.toLowerCase().includes(catalogSearch.toLowerCase()));
  const filteredProducts = myProducts.filter(p => !customSearch || p.name.toLowerCase().includes(customSearch.toLowerCase())).slice(0, 40);

  const submit = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) return toast.error('Add at least one item');
    if (!form.items.every(it => it.description.trim() && Number(it.quantity) > 0)) return toast.error('Fill qty for all items');
    setLoading(true);
    try {
      await createPurchaseOrder({
        vendorId: form.vendorId || undefined,
        expectedDate: form.expectedDate || undefined,
        notes: form.notes,
        ...(branchId && { branchId }),
        items: form.items.map(it => ({
          productId: it.productId || undefined,
          description: it.description,
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost),
          taxRate: Number(it.taxRate || 0),
        })),
      });
      toast.success('Purchase order created');
      onCreated();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 820, maxHeight: '94vh', overflowY: 'auto', padding: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>New Purchase Order</h2>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>Order from vendor catalog · Stock updates on receipt</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        {/* ── Reorder Alerts ── */}
        {reorderAlerts.length > 0 && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, marginBottom: 18 }}>
            <button type="button" onClick={() => setShowAlerts(v => !v)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color="#D97706" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>{reorderAlerts.length} items need restocking</span>
              </div>
              <span style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>{showAlerts ? 'hide ▲' : 'show ▼'}</span>
            </button>
            {showAlerts && (
              <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {reorderAlerts.slice(0, 8).map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 8, padding: '8px 12px', border: '1px solid #FDE68A' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', gap: 8 }}>
                        <span style={{ color: s.stock === 0 ? '#DC2626' : '#D97706', fontWeight: 600 }}>{s.stock === 0 ? 'Out of stock' : `${s.stock} left`}</span>
                        <span>· Alert: ≤{s.lowStockAlert}</span>
                        <span>· Suggest: {s.suggestedQty} {s.unit}</span>
                      </div>
                    </div>
                    {s.vendors.length > 0 ? (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {s.vendors.slice(0, 2).map(v => (
                          <button key={v.vendorId} type="button" onClick={() => addFromReorder(s, v)}
                            style={{ fontSize: 11, fontWeight: 700, background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 6, padding: '4px 9px', cursor: 'pointer', color: '#92400E', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ShoppingBag size={10} /> {v.vendorName} ₹{v.vendorPrice}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button type="button" onClick={() => addFromReorder(s, null)}
                        style={{ fontSize: 11, fontWeight: 700, background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 6, padding: '4px 9px', cursor: 'pointer', color: '#6B7280' }}>
                        Add to PO
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Vendor + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Supplier / Vendor</label>
              <select value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}
                style={{ padding: '9px 12px', border: `1.5px solid ${form.vendorId ? '#10B981' : 'var(--border)'}`, borderRadius: 8, fontSize: 13, background: '#fff', outline: 'none', color: '#111827' }}>
                <option value="">No vendor / direct purchase</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              {form.vendorId && vendorCatalog.length === 0 && (
                <div style={{ fontSize: 11, color: '#D97706' }}>⚠ This vendor has no catalog items yet</div>
              )}
              {form.vendorId && vendorCatalog.length > 0 && (
                <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>✓ {vendorCatalog.length} catalog items available</div>
              )}
            </div>
            <Input label="Expected delivery date" type="date" value={form.expectedDate} onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))} />
          </div>

          {/* ── Two-panel: Add Items ── */}
          <div style={{ display: 'grid', gridTemplateColumns: form.vendorId ? '1fr 1fr' : '1fr', gap: 14 }}>

            {/* Left: Vendor catalog (only when vendor selected) */}
            {form.vendorId && (
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: '#F0FDF4', padding: '10px 14px', borderBottom: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={13} color="#059669" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>{selectedVendor?.name}'s Catalog</span>
                  <span style={{ fontSize: 11, color: '#059669', marginLeft: 'auto' }}>{vendorCatalog.length} items</span>
                </div>
                {vendorCatalog.length === 0 ? (
                  <div style={{ padding: '24px 14px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    No catalog items added yet.<br />
                    <span style={{ fontSize: 12 }}>Go to Vendors tab → Manage Catalog</span>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} placeholder="Search catalog…"
                          style={{ width: '100%', padding: '6px 8px 6px 26px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                      {filteredCatalog.map(ci => {
                        const inPO = form.items.some(i => i._catalogId === ci.id);
                        return (
                          <div key={ci.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderBottom: '1px solid #F9FAFB', background: inPO ? '#F0FDF4' : '#fff' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ci.itemName}</div>
                              <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                                {ci.vendorSku ? `SKU: ${ci.vendorSku} · ` : ''}Min: {ci.minOrderQty}
                                {ci.product && <span style={{ color: ci.product.stock <= ci.product.lowStockAlert ? '#D97706' : '#9CA3AF' }}> · {ci.product.stock} in stock</span>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>₹{Number(ci.vendorPrice).toLocaleString('en-IN')}</span>
                              <button type="button" onClick={() => addFromCatalog(ci)}
                                style={{ background: inPO ? '#D1FAE5' : '#F0FDF4', border: `1px solid ${inPO ? '#6EE7B7' : '#A7F3D0'}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#065F46', whiteSpace: 'nowrap' }}>
                                {inPO ? '+ Add more' : '+ Add'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Right (or full-width): Custom / inventory-based items */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: '#F9FAFB', padding: '10px 14px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={13} color="#6B7280" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                  {form.vendorId ? 'Custom / Other Items' : 'All Items (no vendor selected)'}
                </span>
              </div>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  <input value={customSearch} onChange={e => setCustomSearch(e.target.value)} placeholder="Search your inventory or type name…"
                    style={{ width: '100%', padding: '6px 8px 6px 26px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {customSearch.trim() && !filteredProducts.find(p => p.name.toLowerCase() === customSearch.toLowerCase()) && (
                  <div
                    onMouseDown={() => { addCustom(customSearch, null); setCustomSearch(''); }}
                    style={{ padding: '9px 12px', cursor: 'pointer', background: '#F9FAFB', fontSize: 13, color: '#6B7280', fontStyle: 'italic', borderBottom: '1px solid #F3F4F6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={e => e.currentTarget.style.background = '#F9FAFB'}
                  >
                    + Add "{customSearch}" as custom item
                  </div>
                )}
                {filteredProducts.map(p => {
                  const inPO = form.items.some(i => i.productId === p.id);
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderBottom: '1px solid #F9FAFB', background: inPO ? '#F0FDF4' : '#fff' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: p.stock <= p.lowStockAlert ? '#D97706' : '#9CA3AF' }}>
                          {p.stock <= 0 ? 'Out of stock' : `${p.stock} in stock`}
                          {p.stock <= p.lowStockAlert && p.stock > 0 ? ' · LOW' : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Cost: ₹{Number(p.costPrice).toLocaleString('en-IN')}</span>
                        <button type="button" onClick={() => { addCustom(p.name, p); setCustomSearch(''); }}
                          style={{ background: inPO ? '#D1FAE5' : '#F3F4F6', border: `1px solid ${inPO ? '#6EE7B7' : '#E5E7EB'}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: inPO ? '#065F46' : '#374151', whiteSpace: 'nowrap' }}>
                          {inPO ? '+ Add more' : '+ Add'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredProducts.length === 0 && !customSearch && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Search your inventory above or type a custom item name</div>
                )}
              </div>
            </div>
          </div>

          {/* ── Order basket ── */}
          {form.items.length > 0 ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Order Summary ({form.items.length} items)</label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {form.items.map((it, idx) => (
                  <div key={it._key} style={{ display: 'grid', gridTemplateColumns: '1fr 72px 100px 80px 80px 26px', gap: 8, alignItems: 'center', background: '#F9FAFB', borderRadius: 8, padding: '8px 10px', border: '1px solid #E5E7EB' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.description}</div>
                      {it._source === 'catalog' && <div style={{ fontSize: 10, color: '#059669', fontWeight: 600 }}>from catalog{it.vendorSku ? ` · ${it.vendorSku}` : ''}</div>}
                      {it._source === 'reorder' && <div style={{ fontSize: 10, color: '#D97706', fontWeight: 600 }}>reorder suggestion</div>}
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', marginBottom: 2 }}>QTY</div>
                      <input type="number" min="1" value={it.quantity} onChange={e => setItemField(idx, 'quantity', e.target.value)}
                        style={{ width: '100%', padding: '5px 6px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, textAlign: 'center', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', marginBottom: 2 }}>COST (₹)</div>
                      <input type="number" min="0" step="0.01" value={it.unitCost} onChange={e => setItemField(idx, 'unitCost', e.target.value)}
                        style={{ width: '100%', padding: '5px 6px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', marginBottom: 2 }}>GST %</div>
                      <input type="number" min="0" max="28" value={it.taxRate} onChange={e => setItemField(idx, 'taxRate', e.target.value)}
                        style={{ width: '100%', padding: '5px 6px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{fmt(lineTotal(it))}</div>
                    <button type="button" onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex', padding: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              {/* Totals */}
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20 }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>Subtotal</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', minWidth: 90, textAlign: 'right' }}>{fmt(subtotal)}</span>
                </div>
                {totalTax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>GST</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#D97706', minWidth: 90, textAlign: 'right' }}>{fmt(totalTax)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, borderTop: '1.5px solid var(--border)', paddingTop: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Order Total</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', minWidth: 90, textAlign: 'right' }}>{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 13 }}>
              Add items from vendor catalog or inventory above →
            </div>
          )}

          <Input label="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Delivery instructions, payment terms…" />

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading} disabled={form.items.length === 0}>
              Create PO {form.items.length > 0 ? `· ${form.items.length} items` : ''}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Goods Receipt modal ──────────────────────────────────────────────────────

function ReceivePOModal({ poId, onClose, onDone }) {
  const [po, setPo] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [received, setReceived] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPurchaseOrder(poId)
      .then(r => {
        const data = r.data.data;
        setPo(data);
        const init = {};
        for (const item of data.items) {
          const remaining = item.quantity - (item.receivedQty || 0);
          init[item.id] = remaining > 0 ? remaining : 0;
        }
        setReceived(init);
      })
      .catch(() => toast.error('Failed to load PO'))
      .finally(() => setFetching(false));
  }, [poId]);

  const setQty = (itemId, val) => setReceived(r => ({ ...r, [itemId]: val }));

  const submit = async () => {
    const items = po.items
      .map(item => ({ itemId: item.id, receivedQty: Number(received[item.id] || 0) }))
      .filter(i => i.receivedQty > 0);
    if (items.length === 0) return toast.error('Enter at least one received quantity');
    setLoading(true);
    try {
      await receivePurchaseOrder(poId, items);
      const hasShortfall = po.items.some(item => {
        const remaining = item.quantity - (item.receivedQty || 0);
        return Number(received[item.id] || 0) < remaining;
      });
      toast.success(hasShortfall ? 'Partial receipt recorded — PO marked PARTIAL' : 'All items received — stock updated');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record receipt');
    } finally {
      setLoading(false);
    }
  };

  if (fetching || !po) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, color: '#6B7280', fontSize: 15 }}>Loading PO…</div>
      </div>
    );
  }

  const hasShortfall = po.items.some(item => {
    const remaining = item.quantity - (item.receivedQty || 0);
    return Number(received[item.id] || 0) < remaining;
  });

  const totalOrderedItems = po.items.reduce((s, i) => s + i.quantity, 0);
  const totalReceiving    = po.items.reduce((s, i) => s + Number(received[i.id] || 0), 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '92vh', overflowY: 'auto', padding: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Receive Items</h2>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--navy)' }}>{po.poNumber}</span>
              {po.vendor?.name && <span>· {po.vendor.name}</span>}
              <span>· Ordered {fmtDate(po.createdAt)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        {/* Summary strip */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          {[
            { label: 'Total ordered', value: totalOrderedItems + ' units' },
            { label: 'Receiving now', value: totalReceiving + ' units', highlight: true },
            { label: 'PO status after', value: hasShortfall ? 'PARTIAL' : 'RECEIVED', color: hasShortfall ? '#D97706' : '#16A34A' },
          ].map(({ label, value, highlight, color }) => (
            <div key={label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 14px', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: color || (highlight ? 'var(--navy)' : '#374151') }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 64px 100px 110px', gap: 8, padding: '0 12px 8px', borderBottom: '2px solid #F3F4F6', marginBottom: 8 }}>
          {['Item', 'Ordered', 'Prev Rcvd', 'Receiving Now', 'Stock Impact'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
          ))}
        </div>

        {/* Item rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {po.items.map(item => {
            const ordered       = item.quantity;
            const prevReceived  = item.receivedQty || 0;
            const remaining     = ordered - prevReceived;
            const receivingNow  = Number(received[item.id] || 0);
            const shortfall     = receivingNow < remaining;
            const excess        = receivingNow > remaining;
            const currentStock  = item.product?.stock ?? null;
            const afterStock    = currentStock !== null ? currentStock + receivingNow : null;

            return (
              <div key={item.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 64px 64px 100px 110px', gap: 8, alignItems: 'center',
                background: shortfall && remaining > 0 ? '#FFFBEB' : '#F9FAFB',
                border: `1px solid ${shortfall && remaining > 0 ? '#FCD34D' : '#E5E7EB'}`,
                borderRadius: 9, padding: '10px 12px',
              }}>
                {/* Item name */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.description}
                  </div>
                  {item.product && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                      {item.product.sku ? `SKU: ${item.product.sku}` : 'Linked to inventory'}
                    </div>
                  )}
                  {!item.product && (
                    <div style={{ fontSize: 11, color: '#D97706', marginTop: 1 }}>Not linked to inventory</div>
                  )}
                </div>

                {/* Ordered */}
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', textAlign: 'center' }}>{ordered}</div>

                {/* Previously received */}
                <div style={{ fontSize: 14, textAlign: 'center', color: prevReceived > 0 ? '#059669' : '#9CA3AF', fontWeight: prevReceived > 0 ? 600 : 400 }}>
                  {prevReceived > 0 ? prevReceived : '—'}
                </div>

                {/* Receiving now — editable */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" min="0" step="1"
                    value={received[item.id] ?? 0}
                    onChange={e => setQty(item.id, e.target.value)}
                    disabled={remaining <= 0}
                    style={{
                      width: '100%', padding: '8px 10px', boxSizing: 'border-box',
                      border: `2px solid ${shortfall && remaining > 0 ? '#FCA5A5' : excess ? '#A7F3D0' : '#D1D5DB'}`,
                      borderRadius: 7, fontSize: 14, fontWeight: 700, textAlign: 'center',
                      background: remaining <= 0 ? '#F3F4F6' : '#fff', outline: 'none',
                      color: remaining <= 0 ? '#9CA3AF' : 'var(--navy)',
                    }}
                  />
                  {remaining <= 0 && (
                    <div style={{ fontSize: 10, color: '#16A34A', textAlign: 'center', marginTop: 2, fontWeight: 600 }}>DONE</div>
                  )}
                  {shortfall && remaining > 0 && receivingNow > 0 && (
                    <div style={{ fontSize: 10, color: '#D97706', textAlign: 'center', marginTop: 2, fontWeight: 600 }}>
                      -{remaining - receivingNow} short
                    </div>
                  )}
                  {shortfall && remaining > 0 && receivingNow === 0 && (
                    <div style={{ fontSize: 10, color: '#DC2626', textAlign: 'center', marginTop: 2, fontWeight: 600 }}>
                      not receiving
                    </div>
                  )}
                </div>

                {/* Stock impact */}
                <div style={{ textAlign: 'right' }}>
                  {item.product ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 700, color: receivingNow > 0 ? '#059669' : '#9CA3AF' }}>
                        {currentStock} → {afterStock}
                      </div>
                      <div style={{ fontSize: 10, color: receivingNow > 0 ? '#059669' : '#9CA3AF', marginTop: 1, fontWeight: 600 }}>
                        {receivingNow > 0 ? `+${receivingNow}` : 'no change'}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>manual item</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Shortfall warning */}
        {hasShortfall && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: '#92400E' }}>
              <strong>Partial receipt</strong> — one or more items are receiving fewer units than ordered.
              The PO will remain open and be marked <strong>PARTIAL</strong>. You can receive the remaining stock when it arrives.
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={loading} onClick={submit}>
            {hasShortfall ? 'Record Partial Receipt' : 'Confirm Full Receipt'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Vendor Bills: Create modal ───────────────────────────────────────────────

function CreateBillModal({ onClose, onCreated, vendors }) {
  const [form, setForm] = useState({ vendorId: '', dueDate: '', notes: '', grnId: '', items: [{ description: '', quantity: 1, unitPrice: 0 }] });
  const [loading, setLoading] = useState(false);
  const [grns, setGrns] = useState([]);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [loadingGRNs, setLoadingGRNs] = useState(false);

  // Load confirmed GRNs when vendor changes
  useEffect(() => {
    if (!form.vendorId) { setGrns([]); setSelectedGRN(null); return; }
    setLoadingGRNs(true);
    import('../../api').then(({ listGRNs }) =>
      listGRNs()
        .then(r => {
          const vendorGRNs = (r.data.data || []).filter(g =>
            g.status === 'CONFIRMED' && g.po?.vendorId === form.vendorId
          );
          setGrns(vendorGRNs);
        })
        .finally(() => setLoadingGRNs(false))
    );
  }, [form.vendorId]);

  const handleGRNSelect = (grnId) => {
    const grn = grns.find(g => g.id === grnId);
    setSelectedGRN(grn || null);
    if (grn) {
      setForm(f => ({
        ...f,
        grnId,
        items: grn.lines.map(l => ({
          description: l.description,
          quantity:    l.receivedQty,
          unitPrice:   l.unitCost,
          _orderedQty: l.orderedQty,
          _variance:   l.variance,
        })),
      }));
    } else {
      setForm(f => ({ ...f, grnId: '', items: [{ description: '', quantity: 1, unitPrice: 0 }] }));
    }
  };

  const setItem = (i, k, v) => setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items }; });
  const subtotal = form.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBill({
        ...form,
        grnId: form.grnId || undefined,
        items: form.items.map(i => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
      });
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
          {/* Link to a GRN */}
          {form.vendorId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Link to GRN <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional — pre-fills items from delivery)</span></label>
              <select
                value={form.grnId}
                onChange={e => handleGRNSelect(e.target.value)}
                style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}
              >
                <option value="">No GRN — enter items manually</option>
                {loadingGRNs ? <option disabled>Loading GRNs...</option> : grns.map(g => (
                  <option key={g.id} value={g.id}>{g.grnNumber} · PO: {g.po?.poNumber}</option>
                ))}
              </select>
              {grns.length === 0 && !loadingGRNs && form.vendorId && (
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>No confirmed GRNs for this vendor yet. Create a GRN via Purchase Orders first.</p>
              )}
            </div>
          )}

          {/* Variance warning */}
          {selectedGRN && form.items.some(i => i._variance && i._variance !== 0) && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} color="#D97706" />
              <span style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                Some items have quantity differences from the original PO — amounts are pre-filled from actual received quantities.
              </span>
            </div>
          )}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Line Items</label>
              {!selectedGRN && <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, unitPrice: 0 }] }))} style={{ fontSize: 13, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add item</button>}
            </div>
            {form.items.map((it, i) => {
              const hasVar = it._variance && it._variance !== 0;
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 28px', gap: 8, marginBottom: 6 }}>
                  <div>
                    <input placeholder="Description" value={it.description} onChange={e => setItem(i, 'description', e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' }} />
                    {hasVar && <span style={{ fontSize: 10, color: '#D97706', fontWeight: 600 }}>Ordered: {it._orderedQty} · Received: {it.quantity} ({it._variance > 0 ? '+' : ''}{it._variance})</span>}
                  </div>
                  <input type="number" min="1" value={it.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${hasVar ? '#FCA5A5' : 'var(--border)'}`, borderRadius: 8, fontSize: 14, textAlign: 'center' }} />
                  <input type="number" min="0" value={it.unitPrice} onChange={e => setItem(i, 'unitPrice', e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
                  {!selectedGRN && form.items.length > 1 && <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><X size={14} /></button>}
                </div>
              );
            })}
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

function PayBillModal({ bill, onClose, onDone }) {
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Vendors() {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [tab, setTab] = useState('po');
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [onlinePartners, setOnlinePartners] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [editVendor, setEditVendor] = useState(null);
  const [catalogVendor, setCatalogVendor] = useState(null);
  const [receivingPOId, setReceivingPOId] = useState(null);
  const [grnPO, setGrnPO] = useState(null);

  // Bills state
  const [bills, setBills] = useState([]);
  const [billSummary, setBillSummary] = useState(null);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billSearch, setBillSearch] = useState('');
  const [billStatusFilter, setBillStatusFilter] = useState('');
  const [showCreateBill, setShowCreateBill] = useState(false);
  const [payBillItem, setPayBillItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const poParams = branchId ? { branchId } : {};
      const [vr, pr, prodR, partsR] = await Promise.all([getVendors(search ? { search } : {}), getPurchaseOrders(poParams), getProducts(), getMyPartnerships()]);
      setVendors(vr.data.data || []);
      setOrders(pr.data.data || []);
      setMyProducts(prodR.data.data || []);
      const parts = partsR.data?.data || { sent: [], received: [] };
      const active = [...(parts.sent || []), ...(parts.received || [])].filter(p => p.status === 'ACTIVE');
      setOnlinePartners(active);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [search, branchId]);

  const loadBills = useCallback(async () => {
    setBillsLoading(true);
    try {
      const billParams = { ...(billStatusFilter && { status: billStatusFilter }), ...(branchId && { branchId }) };
      const summaryParams = branchId ? { branchId } : {};
      const [b, s] = await Promise.all([getBills(billParams), getBillsSummary(summaryParams)]);
      setBills(b.data.data || []);
      setBillSummary(s.data.data);
    } catch { toast.error('Failed to load bills'); }
    finally { setBillsLoading(false); }
  }, [billStatusFilter, branchId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'bills') loadBills(); }, [tab, loadBills]);

  const handleReceive = (id) => setReceivingPOId(id);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this purchase order?')) return;
    try { await cancelPurchaseOrder(id); toast.success('Cancelled'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const totalPurchased = orders.filter(o => o.status === 'RECEIVED').reduce((s, o) => s + (o.total || 0), 0);
  const unpaidBills = bills.filter(b => !['PAID', 'CANCELLED'].includes(b.status));
  const unpaidBillsValue = unpaidBills.reduce((s, b) => s + ((b.total || 0) - (b.paidAmount || 0)), 0);

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1100, margin: '0 auto' }}>
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Vendors & Purchases</h1>
          <p style={P.sub}>{vendors.length} vendors · {orders.length} purchase orders · {bills.length} bills</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {tab === 'bills' ? (
            <Button onClick={() => setShowCreateBill(true)}><Plus size={15} style={{ marginRight: 5 }} />New Bill</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setModal('vendor')}><Plus size={15} style={{ marginRight: 5 }} />Add Vendor</Button>
              <Button onClick={() => setModal('po')}><Plus size={15} style={{ marginRight: 5 }} />New Purchase Order</Button>
            </>
          )}
        </div>
      </div>

      <KpiBar stats={[
        { label: 'Total Vendors',   value: vendors.length,                                                              color: 'var(--navy)',                                icon: Truck       },
        { label: 'Total Orders',    value: orders.length,                                                               color: '#3B82F6',                                    icon: Package     },
        { label: 'Unpaid Bills',    value: unpaidBills.length > 0 ? `${unpaidBills.length} · ${fmt(unpaidBillsValue)}` : '0', color: unpaidBills.length > 0 ? '#D97706' : '#9CA3AF', icon: Clock  },
        { label: 'Total Purchased', value: fmt(totalPurchased),                                                         color: '#16A34A',                                    icon: CheckCircle },
      ]} />

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#F3F4F6', borderRadius: 10, padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
        {[{ id: 'po', label: 'Purchase Orders' }, { id: 'vendors', label: 'Vendors' }, { id: 'bills', label: 'Vendor Bills' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? 'var(--navy)' : '#6B7280', boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'po' && (
        <div style={P.tableWrap}>
          <div style={{ ...P.tableScroll, WebkitOverflowScrolling: 'touch' }}>
          <table style={{ ...P.table, minWidth: isMobile ? 560 : 'unset' }}>
            <thead style={P.thead}>
              <tr>
                {['PO Number', 'Vendor', 'Date', 'Expected', 'Items', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} style={P.th()}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={P.empty}>Loading...</td></tr>
              : orders.length === 0 ? <tr><td colSpan={8} style={P.empty}>No purchase orders yet</td></tr>
              : orders.map((o, i) => {
                const s = PO_STATUS[o.status] || PO_STATUS.DRAFT;
                return (
                  <tr key={o.id} style={{ ...P.tr(i, orders.length), cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...P.td(), fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>{o.poNumber}</td>
                    <td style={P.td()}>{o.vendor?.name || <span style={{ color: '#9CA3AF' }}>No vendor</span>}</td>
                    <td style={{ ...P.td(), color: '#6B7280' }}>{fmtDate(o.createdAt)}</td>
                    <td style={{ ...P.td(), color: '#6B7280' }}>{fmtDate(o.expectedDate)}</td>
                    <td style={P.td()}>{o.items?.length || 0}</td>
                    <td style={{ ...P.td(), fontWeight: 700 }}>{fmt(o.total)}</td>
                    <td style={P.td()}><span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{o.status}</span></td>
                    <td style={P.td()}>
                      {['DRAFT', 'ORDERED', 'PARTIAL'].includes(o.status) && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => setGrnPO(o)}
                            style={{ fontSize: 12, color: '#fff', background: '#16A34A', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}
                          >
                            Receive (GRN)
                          </button>
                          <button onClick={() => handleCancel(o.id)} style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                        </div>
                      )}
                      {o.status === 'RECEIVED' && o.grns?.length > 0 && (
                        <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>
                          {o.grns.length} GRN{o.grns.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {tab === 'vendors' && (
        <>
          {/* ── Online Suppliers (Syllabrix Partners) ─────────────────── */}
          {onlinePartners.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, background: '#16A34A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wifi size={14} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#14532D' }}>Online Suppliers — On Syllabrix ({onlinePartners.length})</div>
                  <div style={{ fontSize: 12, color: '#166534' }}>Connected via B2B Marketplace · Digital ordering, catalog browsing & price negotiation available</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {onlinePartners.map(p => {
                  const partner = p.requesterTenantId ? p.supplier : p.requester;
                  if (!partner) return null;
                  return (
                    <div key={p.id} style={{ background: '#F0FDF4', borderRadius: 12, border: '1.5px solid #BBF7D0', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#14532D' }}>{partner.name}</div>
                            <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#16A34A', color: '#fff' }}>ONLINE</span>
                          </div>
                          {partner.syllabrixId && <div style={{ fontSize: 11, color: '#16A34A', fontFamily: 'monospace' }}>{partner.syllabrixId}</div>}
                          {partner.city && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{partner.city}{partner.state ? `, ${partner.state}` : ''}</div>}
                          {p.paymentTerms && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Terms: {p.paymentTerms}</div>}
                        </div>
                        <CheckCircle size={18} color="#16A34A" />
                      </div>
                      <div style={{ borderTop: '1px solid #BBF7D0', paddingTop: 10, marginTop: 6, display: 'flex', gap: 8 }}>
                        <a href="/b2b-marketplace" style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', background: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Package size={11} /> Browse Catalog
                        </a>
                        <a href="/b2b-marketplace" style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', textDecoration: 'none' }}>
                          Negotiate Price
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Offline Vendors ────────────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, background: '#64748B', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <WifiOff size={14} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>Offline Vendors ({vendors.length})</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Manually added · Invite them to Syllabrix to unlock digital ordering</div>
                </div>
              </div>
              <div style={{ position: 'relative', maxWidth: 260 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: '#fff', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {vendors.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: '#9CA3AF' }}>
                  <Truck size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                  <div style={{ fontSize: 15, fontWeight: 600 }}>No vendors yet</div>
                </div>
              ) : vendors.map(v => {
                const inviteMsg = `Hi ${v.name},\n\nWe use Syllabrix ERP to manage our business. Join Syllabrix to receive digital purchase orders, track deliveries, and negotiate prices with us online.\n\nVisit syllabrix.com to get started.`;
                const waLink = v.phone ? `https://wa.me/91${v.phone.replace(/\D/g, '')}?text=${encodeURIComponent(inviteMsg)}` : null;
                return (
                  <div key={v.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{v.name}</div>
                        {v.contactPerson && <div style={{ fontSize: 12, color: '#6B7280' }}>{v.contactPerson}</div>}
                      </div>
                      <button onClick={() => setEditVendor(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 12, fontWeight: 600 }}>Edit</button>
                    </div>
                    {v.phone && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{v.phone}</div>}
                    {v.gstin && <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>GSTIN: {v.gstin}</div>}
                    {v.paymentTerms && <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{v.paymentTerms}</div>}
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10, marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <button onClick={() => setCatalogVendor(v)}
                        style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', background: '#F0FDFE', border: '1px solid #A5F3FC', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BookOpen size={10} /> {v.catalog?.length > 0 ? `${v.catalog.length} catalog items` : 'Add Catalog'}
                      </button>
                      {waLink && (
                        <a href={waLink} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '4px 10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Send size={10} /> Invite
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          VENDOR BILLS TAB
      ═══════════════════════════════════════════════════════ */}
      {tab === 'bills' && (
        <div>
          {billSummary && (
            <KpiBar stats={[
              { label: 'Pending',        value: fmt(billSummary.pendingAmount), sub: `${billSummary.pendingCount} bills`, icon: Clock,        color: '#D97706' },
              { label: 'Overdue',        value: fmt(billSummary.overdueAmount), sub: `${billSummary.overdueCount} bills`, icon: AlertCircle,  color: '#DC2626' },
              { label: 'Paid this month',value: fmt(billSummary.paidThisMonth), sub: 'Settled',                           icon: CheckCircle,  color: '#16A34A' },
            ]} />
          )}

          <div style={{ ...P.bar, marginBottom: 20 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input value={billSearch} onChange={e => setBillSearch(e.target.value)} placeholder="Search bills..."
                style={{ ...P.searchInput }} />
            </div>
            <select value={billStatusFilter} onChange={e => { setBillStatusFilter(e.target.value); }} style={{ ...P.input, width: 'auto' }}>
              <option value="">All</option>
              {Object.keys(BILL_STATUS).map(s => <option key={s} value={s}>{BILL_STATUS[s].label}</option>)}
            </select>
          </div>

          <div style={P.tableWrap}>
            <div style={P.tableScroll}>
              <table style={{ ...P.table, minWidth: 600 }}>
                <thead style={P.thead}>
                  <tr>
                    {['Bill #', 'Vendor', 'Date', 'Due Date', 'Total', 'Balance', 'Status', 'Actions'].map(h => (
                      <th key={h} style={P.th()}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {billsLoading
                    ? <tr><td colSpan={8} style={P.empty}>Loading...</td></tr>
                    : bills.filter(b => !billSearch || b.vendor?.name?.toLowerCase().includes(billSearch.toLowerCase()) || b.billNumber?.includes(billSearch)).length === 0
                    ? <tr><td colSpan={8} style={P.empty}><FileText size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />No bills yet</td></tr>
                    : bills
                        .filter(b => !billSearch || b.vendor?.name?.toLowerCase().includes(billSearch.toLowerCase()) || b.billNumber?.includes(billSearch))
                        .map((bill, i, arr) => {
                          const st = BILL_STATUS[bill.status] || BILL_STATUS.PENDING;
                          return (
                            <tr key={bill.id} style={{ ...P.tr(i, arr.length), cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.background = ''}>
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
                        })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modal === 'vendor' && <VendorModal onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal === 'po' && <CreatePOModal vendors={vendors} myProducts={myProducts} onClose={() => setModal(null)} onCreated={() => { setModal(null); load(); }} />}
      {editVendor && <VendorModal vendor={editVendor} onClose={() => setEditVendor(null)} onSaved={() => { setEditVendor(null); load(); }} />}
      {catalogVendor && <VendorCatalogModal vendor={catalogVendor} myProducts={myProducts} onClose={() => { setCatalogVendor(null); load(); }} />}
      {receivingPOId && <ReceivePOModal poId={receivingPOId} onClose={() => setReceivingPOId(null)} onDone={() => { setReceivingPOId(null); load(); }} />}
      {grnPO && <GRNModal po={grnPO} onClose={() => setGrnPO(null)} onConfirmed={() => { setGrnPO(null); load(); }} />}
      {showCreateBill && <CreateBillModal vendors={vendors} onClose={() => setShowCreateBill(false)} onCreated={() => { setShowCreateBill(false); loadBills(); }} />}
      {payBillItem && <PayBillModal bill={payBillItem} onClose={() => setPayBillItem(null)} onDone={() => { setPayBillItem(null); loadBills(); }} />}
    </div>
  );
}
