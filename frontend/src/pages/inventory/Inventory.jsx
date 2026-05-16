import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, createCategory, getTaxRates, adjustStock } from '../../api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { Plus, Search, Package, AlertTriangle, Edit2, Trash2, ArrowUpDown, AlertCircle, CalendarX } from 'lucide-react';

const EMPTY = {
  name: '', sku: '', sellingPrice: '', costPrice: '', stock: '', unit: 'pcs',
  categoryId: '', taxRateId: '', lowStockAlert: '5', description: '',
  expiryDate: '', batchNumber: '',
};

// Returns days until expiry (negative = already expired)
const daysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
};

const expiryStatus = (days) => {
  if (days === null) return null;
  if (days < 0)  return { label: 'Expired',          color: 'red',   bg: '#FEF2F2', text: 'var(--vermilion)' };
  if (days <= 7) return { label: `${days}d left`,     color: 'red',   bg: '#FEF2F2', text: 'var(--vermilion)' };
  if (days <= 30) return { label: `${days}d left`,    color: 'amber', bg: '#FFFBEB', text: 'var(--amber)' };
  return            { label: `${days}d left`,          color: 'green', bg: '#F0FDF4', text: 'var(--emerald)' };
};

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [search, setSearch] = useState('');
  const [expiryFilter, setExpiryFilter] = useState(searchParams.get('filter') || 'all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [stockForm, setStockForm] = useState({ productId: '', type: 'PURCHASE', quantity: '', notes: '' });
  const [catName, setCatName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c, t] = await Promise.all([getProducts(), getCategories(), getTaxRates()]);
      setProducts(p.data.data);
      setCategories(c.data.data);
      setTaxRates(t.data.data);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku || '', sellingPrice: p.sellingPrice, costPrice: p.costPrice,
      stock: p.stock, unit: p.unit, categoryId: p.categoryId || '', taxRateId: p.taxRateId || '',
      lowStockAlert: p.lowStockAlert, description: p.description || '',
      expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().split('T')[0] : '',
      batchNumber: p.batchNumber || '',
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sellingPrice) return toast.error('Name and selling price are required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        sellingPrice: +form.sellingPrice, costPrice: +form.costPrice || 0,
        stock: +form.stock || 0, lowStockAlert: +form.lowStockAlert || 5,
        expiryDate: form.expiryDate || null,
        batchNumber: form.batchNumber || null,
      };
      if (editing) await updateProduct(editing.id, payload);
      else await createProduct(payload);
      toast.success(editing ? 'Product updated' : 'Product added');
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await deleteProduct(id); toast.success('Product deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const openStock = (p) => { setStockForm({ productId: p.id, type: 'PURCHASE', quantity: '', notes: '' }); setShowStockModal(true); };

  const saveStock = async (e) => {
    e.preventDefault();
    if (!stockForm.quantity || +stockForm.quantity <= 0) return toast.error('Enter a valid quantity');
    setSaving(true);
    try {
      await adjustStock(stockForm.productId, { type: stockForm.type, quantity: +stockForm.quantity, notes: stockForm.notes });
      toast.success('Stock updated');
      setShowStockModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Stock update failed'); }
    finally { setSaving(false); }
  };

  const saveCat = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setSaving(true);
    try { await createCategory({ name: catName }); toast.success('Category added'); setCatName(''); setShowCatModal(false); load(); }
    catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  // Counts
  const lowStock = products.filter(p => p.stock <= p.lowStockAlert);
  const expiredCount = products.filter(p => p.expiryDate && daysUntilExpiry(p.expiryDate) < 0).length;
  const expiringCount = products.filter(p => p.expiryDate && daysUntilExpiry(p.expiryDate) >= 0 && daysUntilExpiry(p.expiryDate) <= 30).length;

  // Filter products
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    const days = daysUntilExpiry(p.expiryDate);
    if (expiryFilter === 'expired')  return days !== null && days < 0;
    if (expiryFilter === 'expiring') return days !== null && days >= 0 && days <= 30;
    return true;
  });

  const filterPill = (key, label, count, colorActive) => (
    <button
      onClick={() => setExpiryFilter(key)}
      style={{
        padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        border: `1px solid ${expiryFilter === key ? colorActive : 'var(--border)'}`,
        background: expiryFilter === key ? colorActive + '18' : '#fff',
        color: expiryFilter === key ? colorActive : '#6B7280',
        transition: 'all 0.15s',
      }}
    >
      {label} {count > 0 && <span style={{ marginLeft: 4, background: expiryFilter === key ? colorActive : '#E5E7EB', color: expiryFilter === key ? '#fff' : '#6B7280', borderRadius: 10, padding: '0 6px', fontSize: 11 }}>{count}</span>}
    </button>
  );

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Inventory</h1>
          <p style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
            {products.length} products · {lowStock.length} low stock
            {expiredCount > 0 && <span style={{ color: 'var(--vermilion)', marginLeft: 8 }}>· {expiredCount} expired</span>}
            {expiringCount > 0 && <span style={{ color: 'var(--amber)', marginLeft: 8 }}>· {expiringCount} expiring soon</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" size="sm" onClick={() => setShowCatModal(true)}>Categories</Button>
          <Button size="sm" onClick={openAdd}><Plus size={15} />Add product</Button>
        </div>
      </div>

      {/* Alert banners */}
      {expiredCount > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} color="var(--vermilion)" />
          <span style={{ fontSize: 14, flex: 1 }}>
            <b style={{ color: 'var(--vermilion)' }}>{expiredCount} product{expiredCount > 1 ? 's' : ''} expired</b> — remove from shelves immediately. Selling expired items is a legal risk.
          </span>
          <button onClick={() => setExpiryFilter('expired')} style={{ fontSize: 12, color: 'var(--vermilion)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Show expired →</button>
        </div>
      )}
      {expiringCount > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color="var(--amber)" />
          <span style={{ fontSize: 14, flex: 1 }}>
            <b>{expiringCount} product{expiringCount > 1 ? 's' : ''}</b> expiring within 30 days — sell before expiry or return to distributor.
          </span>
          <button onClick={() => setExpiryFilter('expiring')} style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Show expiring →</button>
        </div>
      )}
      {lowStock.length > 0 && expiryFilter === 'all' && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color="var(--amber)" />
          <span style={{ fontSize: 14 }}><b>{lowStock.length} product{lowStock.length > 1 ? 's' : ''}</b> running low: {lowStock.slice(0, 3).map(p => p.name).join(', ')}{lowStock.length > 3 ? '…' : ''}</span>
        </div>
      )}

      {/* Filter + Search row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {filterPill('all', 'All products', 0, 'var(--navy)')}
        {filterPill('expiring', 'Expiring ≤30d', expiringCount, 'var(--amber)')}
        {filterPill('expired', 'Expired', expiredCount, 'var(--vermilion)')}
        <div style={{ flex: 1, position: 'relative', minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU…" style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14, background: '#fff', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Table */}
      <Card padding={0}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>Loading products…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Package size={36} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#6B7280', fontWeight: 600 }}>
              {expiryFilter !== 'all' ? `No ${expiryFilter} products` : 'No products yet'}
            </p>
            {expiryFilter !== 'all'
              ? <button onClick={() => setExpiryFilter('all')} style={{ marginTop: 10, fontSize: 13, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Show all products</button>
              : <div style={{ marginTop: 16 }}><Button size="sm" onClick={openAdd}><Plus size={14} />Add product</Button></div>
            }
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                {['Product', 'SKU / Batch', 'Category', 'Price', 'Stock', 'Expiry', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const days = daysUntilExpiry(p.expiryDate);
                const expiry = expiryStatus(days);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: days !== null && days < 0 ? '#FFF8F8' : undefined }}
                    onMouseEnter={e => { if (!(days !== null && days < 0)) e.currentTarget.style.background = 'var(--surface-1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = (days !== null && days < 0) ? '#FFF8F8' : ''; }}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{p.description}</div>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280' }}>{p.sku || '—'}</div>
                      {p.batchNumber && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Batch: {p.batchNumber}</div>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{p.category?.name || '—'}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 14 }}>₹{Number(p.sellingPrice).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 14, color: p.stock <= p.lowStockAlert ? 'var(--vermilion)' : 'inherit' }}>{p.stock} {p.unit}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {expiry ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: expiry.bg, fontSize: 12, fontWeight: 600, color: expiry.text, whiteSpace: 'nowrap' }}>
                          {days < 0 ? <AlertCircle size={11} /> : <CalendarX size={11} />}
                          {expiry.label}
                        </div>
                      ) : (
                        <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
                      )}
                      {p.expiryDate && (
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                          {new Date(p.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge color={p.stock === 0 ? 'red' : p.stock <= p.lowStockAlert ? 'amber' : 'green'}>
                        {p.stock === 0 ? 'Out of stock' : p.stock <= p.lowStockAlert ? 'Low stock' : 'In stock'}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openStock(p)} title="Adjust stock" style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, background: '#fff', cursor: 'pointer' }}><ArrowUpDown size={13} /></button>
                        <button onClick={() => openEdit(p)} title="Edit" style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, background: '#fff', cursor: 'pointer' }}><Edit2 size={13} /></button>
                        <button onClick={() => remove(p.id)} title="Delete" style={{ padding: '5px 8px', border: '1px solid #FCA5A5', borderRadius: 6, background: '#FEF2F2', cursor: 'pointer' }}><Trash2 size={13} color="var(--vermilion)" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit product' : 'Add product'} width={560}>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Product name *" value={form.name} onChange={set('name')} placeholder="e.g. Tata Salt 1kg" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="SKU / Barcode" value={form.sku} onChange={set('sku')} placeholder="SKU001" />
            <Input label="Unit" value={form.unit} onChange={set('unit')} placeholder="pcs, kg, L…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Selling price (₹) *" type="number" value={form.sellingPrice} onChange={set('sellingPrice')} placeholder="0" />
            <Input label="Cost price (₹)" type="number" value={form.costPrice} onChange={set('costPrice')} placeholder="0" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Opening stock" type="number" value={form.stock} onChange={set('stock')} placeholder="0" />
            <Input label="Low stock alert at" type="number" value={form.lowStockAlert} onChange={set('lowStockAlert')} placeholder="5" />
          </div>

          {/* Expiry + Batch */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Expiry date" type="date" value={form.expiryDate} onChange={set('expiryDate')} />
            <Input label="Batch number" value={form.batchNumber} onChange={set('batchNumber')} placeholder="BATCH001" />
          </div>
          {form.expiryDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: (() => { const d = daysUntilExpiry(form.expiryDate); return d < 0 ? '#FEF2F2' : d <= 30 ? '#FFFBEB' : '#F0FDF4'; })() }}>
              {(() => {
                const d = daysUntilExpiry(form.expiryDate);
                const s = expiryStatus(d);
                return s ? <><AlertTriangle size={13} color={s.text} /><span style={{ fontSize: 12, color: s.text, fontWeight: 600 }}>{d < 0 ? 'Already expired' : `Expires in ${d} days`}</span></> : null;
              })()}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Category</label>
            <select value={form.categoryId} onChange={set('categoryId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14 }}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>GST rate</label>
            <select value={form.taxRateId} onChange={set('taxRateId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14 }}>
              <option value="">No GST</option>
              {taxRates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <Button variant="ghost" onClick={() => setShowModal(false)} type="button">Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add product'}</Button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal open={showStockModal} onClose={() => setShowStockModal(false)} title="Adjust stock" width={400}>
        <form onSubmit={saveStock} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Movement type</label>
            <select value={stockForm.type} onChange={e => setStockForm(f => ({ ...f, type: e.target.value }))} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14 }}>
              <option value="PURCHASE">Purchase (add stock)</option>
              <option value="ADJUSTMENT">Manual adjustment (add)</option>
              <option value="RETURN">Customer return (add)</option>
              <option value="DAMAGE">Damage / Loss (remove)</option>
            </select>
          </div>
          <Input label="Quantity" type="number" value={stockForm.quantity} onChange={e => setStockForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" />
          <Input label="Notes (optional)" value={stockForm.notes} onChange={e => setStockForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Received from supplier" />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowStockModal(false)} type="button">Cancel</Button>
            <Button type="submit" loading={saving}>Update stock</Button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal open={showCatModal} onClose={() => setShowCatModal(false)} title="Add category" width={360}>
        <form onSubmit={saveCat} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Category name" value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Beverages" autoFocus />
          {categories.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Existing categories</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {categories.map(c => <Badge key={c.id} color="gray">{c.name}</Badge>)}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowCatModal(false)} type="button">Cancel</Button>
            <Button type="submit" loading={saving}>Add category</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
