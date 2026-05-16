import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getProducts, getCustomers, createSale } from '../../api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { Search, Plus, Minus, Trash2, Receipt, User, ScanLine } from 'lucide-react';
import POSReceipt from './POSReceipt';
import BarcodeScanner from '../../components/BarcodeScanner';

const METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'];

export default function POS() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [method, setMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const searchRef = useRef();

  useEffect(() => {
    Promise.all([getProducts(), getCustomers()])
      .then(([p, c]) => { setProducts(p.data.data); setCustomers(c.data.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.stock > 0 && (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
    )
  );

  // Called when camera scanner decodes a barcode
  const handleBarcodeScan = (barcode) => {
    const exact = products.find(p => p.barcode === barcode && p.stock > 0);
    if (exact) { addToCart(exact); toast.success(`Added: ${exact.name}`); }
    else { setSearch(barcode); toast.error('Product not found for barcode: ' + barcode); }
    setShowScanner(false);
    searchRef.current?.focus();
  };

  // Enter key in search → add first/exact match (works for USB scanners)
  const handleSearchKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    const exact = products.find(p => p.barcode === search && p.stock > 0);
    if (exact) { addToCart(exact); setSearch(''); return; }
    if (filtered.length === 1) { addToCart(filtered[0]); setSearch(''); }
    else if (filtered.length > 1) { addToCart(filtered[0]); }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) {
        if (ex.quantity >= product.stock) { toast.error('Not enough stock'); return prev; }
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, name: product.name, quantity: 1, unitPrice: product.sellingPrice, maxStock: product.stock }];
    });
    setSearch('');
    searchRef.current?.focus();
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.productId === id
      ? { ...i, quantity: Math.max(1, Math.min(i.quantity + delta, i.maxStock)) }
      : i
    ).filter(i => i.quantity > 0));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.productId !== id));

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = subtotal;
  const paid = parseFloat(amountPaid) || 0;
  const change = Math.max(0, paid - total);

  const checkout = async () => {
    if (!cart.length) return toast.error('Cart is empty');
    if (method === 'CASH' && paid < total) return toast.error('Amount paid is less than total');
    setSubmitting(true);
    try {
      const { data } = await createSale({
        customerId: customerId || undefined,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: method,
        amountPaid: method === 'CASH' ? paid : total,
      });
      setLastReceipt(data.data);
      setCart([]);
      setAmountPaid('');
      setCustomerId('');
      // Refresh product stock
      const p = await getProducts();
      setProducts(p.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sale failed');
    } finally { setSubmitting(false); }
  };

  return (
    <>
    <div style={{ display: 'flex', height: 'calc(100vh - 0px)', overflow: 'hidden' }}>
      {/* Left — Product grid */}
      <div style={{ flex: 1, padding: 24, overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Point of sale</h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearchKeyDown}
              placeholder={t('pos.searchPlaceholder')} autoFocus
              style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14, background: '#fff' }} />
          </div>
          <button onClick={() => setShowScanner(true)} title={t('pos.scanBarcode')}
            style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: '#fff', cursor: 'pointer', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
            <ScanLine size={16} /> {t('pos.scanBarcode')}
          </button>
        </div>

        {loading ? <p style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 40 }}>Loading products…</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => addToCart(p)}
                style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 14, cursor: 'pointer', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--cyan)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>{p.name}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>₹{Number(p.sellingPrice).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 11, color: p.stock <= p.lowStockAlert ? 'var(--vermilion)' : '#9CA3AF', marginTop: 4 }}>Stock: {p.stock} {p.unit}</div>
              </div>
            ))}
            {filtered.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 14, gridColumn: '1/-1', textAlign: 'center', marginTop: 24 }}>No products found</p>}
          </div>
        )}
      </div>

      {/* Right — Cart */}
      <div style={{ width: 340, display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Receipt size={16} color="var(--navy)" />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Current bill</span>
          {cart.length > 0 && <span style={{ marginLeft: 'auto', fontSize: 12, background: 'var(--cyan)', color: '#fff', padding: '2px 8px', borderRadius: 99 }}>{cart.length} items</span>}
        </div>

        {/* Customer */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <User size={13} color="#9CA3AF" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Customer (optional)</span>
          </div>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
            <option value="">Walk-in customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
          </select>
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {cart.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF' }}>
              <Receipt size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>Add products to start billing</p>
            </div>
          ) : cart.map(item => (
            <div key={item.productId} style={{ padding: '10px 20px', borderBottom: '1px solid var(--surface-2)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-mono)' }}>₹{item.unitPrice} × {item.quantity}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => updateQty(item.productId, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={11} /></button>
                <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={11} /></button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, minWidth: 60, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}</div>
              <button onClick={() => removeItem(item.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>

        {/* Totals + Payment */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--navy)' }}>₹{total.toLocaleString('en-IN')}</span>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {METHODS.map(m => (
              <button key={m} onClick={() => setMethod(m)} style={{ flex: 1, padding: '6px 4px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: `1px solid ${method === m ? 'var(--navy)' : 'var(--border)'}`, background: method === m ? 'var(--navy)' : '#fff', color: method === m ? '#fff' : '#6B7280', cursor: 'pointer' }}>
                {m === 'BANK_TRANSFER' ? 'BANK' : m}
              </button>
            ))}
          </div>

          {method === 'CASH' && (
            <div style={{ marginBottom: 12 }}>
              <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="Amount received (₹)"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14, marginBottom: 6 }} />
              {change > 0 && <div style={{ fontSize: 13, color: 'var(--emerald)', fontWeight: 600 }}>Change: ₹{change.toLocaleString('en-IN')}</div>}
            </div>
          )}

          <Button fullWidth size="lg" loading={submitting} onClick={checkout} disabled={cart.length === 0}>
            Charge ₹{total.toLocaleString('en-IN')}
          </Button>
        </div>
      </div>
    </div>

    {lastReceipt && (
      <POSReceipt
        receipt={lastReceipt}
        onClose={() => setLastReceipt(null)}
        onNewSale={() => { setLastReceipt(null); setAmountPaid(''); setCustomerId(''); }}
      />
    )}
    {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </>
  );
}
