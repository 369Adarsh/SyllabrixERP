import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { getProducts, getCustomers, createCustomer, createSale, getTransactions, getTenantProfile } from '../../api';
import { useModuleFeatures } from '../../hooks/useModuleFeatures';
import { P } from '../../styles/page';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import {
  Search, Plus, Minus, Trash2, Receipt, User, ScanLine, History,
  QrCode, CheckCircle, ShoppingBag, X as CloseIcon, PauseCircle, PlayCircle,
} from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { QRCodeSVG } from 'qrcode.react';
import POSReceipt from './POSReceipt';
import BarcodeScanner from '../../components/BarcodeScanner';

const ALL_METHODS = [
  { key: 'CASH',          label: 'CASH',  feature: 'pos.cash_payment' },
  { key: 'UPI',           label: 'UPI',   feature: 'pos.upi_payment' },
  { key: 'CARD',          label: 'CARD',  feature: 'pos.card_payment' },
  { key: 'BANK_TRANSFER', label: 'BANK',  feature: 'pos.card_payment' },
];
const QUICK_CASH = [10, 20, 50, 100, 200, 500, 1000, 2000];

export default function POS() {
  const { t } = useTranslation();
  const { tenant } = useAuth();
  const { branchId } = useBranch();
  const { isMobile } = useBreakpoint();
  const { has, loading: featuresLoading } = useModuleFeatures('SYL-MOD-POS');

  const [products, setProducts]         = useState([]);
  const [customers, setCustomers]       = useState([]);
  const [search, setSearch]             = useState('');
  const [cart, setCart]                 = useState([]);
  const [method, setMethod]             = useState('CASH');
  const [amountPaid, setAmountPaid]     = useState('');
  const [discount, setDiscount]         = useState('');
  const [discountType, setDiscountType] = useState('flat');
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [lastReceipt, setLastReceipt]   = useState(null);
  const [showScanner, setShowScanner]   = useState(false);
  const [tab, setTab]                   = useState('products');
  const [todaySales, setTodaySales]     = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [localUpiId, setLocalUpiId]     = useState('');
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [parkedBills, setParkedBills]   = useState([]);
  const [editingQty, setEditingQty]     = useState(null);
  const [editingQtyValue, setEditingQtyValue] = useState('');
  const [billNote, setBillNote]         = useState('');
  const searchRef  = useRef();
  const qtyInputRef = useRef();

  // Customer state
  const [customerMode, setCustomerMode]         = useState('walkin');
  const [existingCustomerId, setExistingCustomerId] = useState('');
  const [walkinName, setWalkinName]             = useState('');
  const [walkinPhone, setWalkinPhone]           = useState('');
  const [walkinEmail, setWalkinEmail]           = useState('');
  const [walkinAddress, setWalkinAddress]       = useState('');

  // Ensure selected payment method is still enabled after features load
  useEffect(() => {
    if (!featuresLoading && !has('pos.cash_payment') && method === 'CASH') {
      const first = ALL_METHODS.find(m => has(m.feature));
      if (first) setMethod(first.key);
    }
  }, [featuresLoading]);

  const loadTodaySales = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const params = { from: today.toISOString() };
    if (branchId) params.branchId = branchId;
    const r = await getTransactions(params);
    setTodaySales(r.data.data || []);
  };

  useEffect(() => {
    const productParams = branchId ? { branchId } : {};
    Promise.all([getProducts(productParams), getCustomers()])
      .then(([p, c]) => { setProducts(p.data.data); setCustomers(c.data.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [branchId]);

  useEffect(() => {
    getTenantProfile()
      .then(r => setLocalUpiId((r.data.data || r.data)?.receiptConfig?.upiId || ''))
      .catch(() => {});
  }, []);

  const categories = [
    { id: 'all', name: 'All' },
    ...Array.from(
      new Map(products.filter(p => p.category).map(p => [p.category.id, p.category])).values()
    ).sort((a, b) => a.name.localeCompare(b.name)),
  ];

  const filtered = products.filter(p => {
    if (p.stock <= 0) return false;
    if (activeCategory !== 'all' && p.categoryId !== activeCategory) return false;
    if (!search) return true;
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
    );
  });

  const handleBarcodeScan = (barcode) => {
    const exact = products.find(p => p.barcode === barcode && p.stock > 0);
    if (exact) { addToCart(exact); toast.success(`Added: ${exact.name}`); }
    else { setSearch(barcode); toast.error('Product not found for barcode: ' + barcode); }
    setShowScanner(false);
    searchRef.current?.focus();
  };

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
      return [...prev, {
        productId: product.id, name: product.name, quantity: 1,
        unitPrice: product.sellingPrice, maxStock: product.stock,
        gstRate: product.taxRate?.rate || 0,
      }];
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

  const setQtyDirect = (id, val) => {
    const qty = parseInt(val);
    if (!isNaN(qty) && qty > 0) {
      setCart(prev => prev.map(i => i.productId === id
        ? { ...i, quantity: Math.min(qty, i.maxStock) }
        : i
      ));
    }
    setEditingQty(null);
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.productId !== id));

  // Park / Hold bill
  const parkBill = () => {
    if (cart.length === 0) return toast.error('Cart is empty — nothing to park');
    const snapshot = {
      id: Date.now(), cart: [...cart],
      walkinName, walkinPhone, walkinEmail, walkinAddress,
      customerMode, existingCustomerId, discount, discountType, method, billNote,
    };
    setParkedBills(prev => [...prev, snapshot]);
    resetForm(); setBillNote('');
    toast.success('Bill parked — start a new sale');
  };

  const restoreParkedBill = (bill) => {
    if (cart.length > 0 && !window.confirm('Discard current cart and restore parked bill?')) return;
    setCart(bill.cart);
    setWalkinName(bill.walkinName || ''); setWalkinPhone(bill.walkinPhone || '');
    setWalkinEmail(bill.walkinEmail || ''); setWalkinAddress(bill.walkinAddress || '');
    setCustomerMode(bill.customerMode || 'walkin');
    setExistingCustomerId(bill.existingCustomerId || '');
    setDiscount(bill.discount || ''); setDiscountType(bill.discountType || 'flat');
    setMethod(bill.method || 'CASH'); setBillNote(bill.billNote || '');
    setParkedBills(prev => prev.filter(b => b.id !== bill.id));
    setTab('products');
    toast.success('Parked bill restored');
  };

  const dropParkedBill = (id) => setParkedBills(prev => prev.filter(b => b.id !== id));

  // Totals
  const subtotal    = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discountAmt = discount
    ? discountType === 'pct'
      ? Math.min((parseFloat(discount) / 100) * subtotal, subtotal)
      : Math.min(parseFloat(discount), subtotal)
    : 0;
  const taxableAmt = Math.max(0, subtotal - discountAmt);
  const discRatio  = subtotal > 0 ? taxableAmt / subtotal : 1;

  const gstGroups = {};
  cart.forEach(item => {
    const rate = item.gstRate || 0;
    if (!gstGroups[rate]) gstGroups[rate] = { cgst: 0, sgst: 0, total: 0 };
    const lineTaxable = item.quantity * item.unitPrice * discRatio;
    const lineGst = lineTaxable * rate / 100;
    gstGroups[rate].total += lineGst;
    gstGroups[rate].cgst  += lineGst / 2;
    gstGroups[rate].sgst  += lineGst / 2;
  });
  const totalGst = Object.values(gstGroups).reduce((s, v) => s + v.total, 0);
  const hasTax   = totalGst > 0.001;
  const total    = Math.max(0, taxableAmt + totalGst);
  const paid     = parseFloat(amountPaid) || 0;
  const change   = Math.max(0, paid - total);

  // Today's summary
  const todayRevenue = todaySales.reduce((s, sale) => s + Number(sale.total || 0), 0);
  const todayCount   = todaySales.length;
  const todayAvg     = todayCount > 0 ? todayRevenue / todayCount : 0;

  const upiId    = localUpiId || tenant?.receiptConfig?.upiId || '';
  const upiString = upiId && total > 0
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(tenant?.name || 'Store')}&am=${total.toFixed(2)}&cu=INR`
    : null;

  const resetForm = () => {
    setCart([]); setAmountPaid(''); setDiscount('');
    setExistingCustomerId(''); setWalkinName(''); setWalkinPhone('');
    setWalkinEmail(''); setWalkinAddress('');
  };

  const checkout = async () => {
    if (!cart.length) return toast.error('Cart is empty');
    if (method === 'CASH' && amountPaid && paid < total)
      return toast.error(`Amount received ₹${paid} is less than total ₹${total}`);
    setSubmitting(true);
    try {
      let resolvedCustomerId = existingCustomerId || undefined;
      if (customerMode === 'walkin' && (walkinName.trim() || walkinPhone.trim())) {
        const cRes = await createCustomer({
          name:    walkinName.trim() || 'Walk-in Customer',
          phone:   walkinPhone.trim() || undefined,
          email:   walkinEmail.trim() || undefined,
          address: walkinAddress.trim() || undefined,
        });
        resolvedCustomerId = cRes.data.data.id;
      }

      const effectivePaid = method === 'CASH' ? (amountPaid ? paid : total) : total;
      const { data } = await createSale({
        customerId:     resolvedCustomerId,
        items:          cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod:  method,
        amountPaid:     effectivePaid,
        discountAmount: discountAmt,
        ...(has('pos.bill_note') && billNote.trim() && { note: billNote.trim() }),
        ...(branchId && { branchId }),
      });

      const ac = tenant?.automationConfig || {};
      setLastReceipt({
        ...data.data,
        _autoWhatsApp: !!data.data.customer?.phone,
        _autoPrint:    !!ac.autoPrint,
      });
      resetForm(); setBillNote('');
      const p = await getProducts(branchId ? { branchId } : {});
      setProducts(p.data.data);
      loadTodaySales();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sale failed');
    } finally { setSubmitting(false); }
  };

  const cartTotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const activeMethods = ALL_METHODS.filter(m => has(m.feature));

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
    <div style={{ display: 'flex', height: isMobile ? 'calc(100dvh - 56px)' : '100dvh', overflow: 'hidden' }}>

      {/* ── LEFT: Product grid / tabs ─────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: isMobile ? '12px 12px 80px' : 24, overflowY: 'auto', borderRight: isMobile ? 'none' : '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--navy)', margin: 0, letterSpacing: '-0.02em' }}>
            Point of Sale
          </h1>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-1)', borderRadius: 8, padding: 3 }}>
            <button onClick={() => setTab('products')}
              style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: tab === 'products' ? '#fff' : 'transparent', color: tab === 'products' ? 'var(--navy)' : '#9CA3AF', boxShadow: tab === 'products' ? 'var(--shadow-sm)' : 'none' }}>
              Products
            </button>
            {has('pos.sales_history') && (
              <button onClick={() => { setTab('history'); loadTodaySales(); }}
                style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: tab === 'history' ? '#fff' : 'transparent', color: tab === 'history' ? 'var(--navy)' : '#9CA3AF', boxShadow: tab === 'history' ? 'var(--shadow-sm)' : 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                <History size={12} /> Today's Sales
              </button>
            )}
            {has('pos.hold_bill') && parkedBills.length > 0 && (
              <button onClick={() => setTab('parked')}
                style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: tab === 'parked' ? '#fff' : 'transparent', color: tab === 'parked' ? '#D97706' : '#9CA3AF', boxShadow: tab === 'parked' ? 'var(--shadow-sm)' : 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                <PauseCircle size={12} /> Parked ({parkedBills.length})
              </button>
            )}
          </div>
        </div>

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div>
            {todaySales.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
                  { label: 'Transactions',    value: todayCount },
                  { label: 'Avg. Bill',       value: `₹${Math.round(todayAvg).toLocaleString('en-IN')}` },
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{stat.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            )}
            {todaySales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>
                <Receipt size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 14 }}>No sales today yet</p>
              </div>
            ) : todaySales.map(sale => (
              <div key={sale.id} onClick={() => setLastReceipt(sale)}
                style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', marginBottom: 10, border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cyan)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Receipt size={16} color="var(--navy)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{sale.receiptNumber}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {sale.customer?.name ? `${sale.customer.name} · ` : ''}{sale.items?.length || 0} items · {sale.paymentMethod} · {new Date(sale.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', color: 'var(--navy)' }}>₹{Number(sale.total).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── PARKED BILLS TAB ── */}
        {tab === 'parked' && (
          <div>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Tap a parked bill to restore it to the cart.</p>
            {parkedBills.map((bill, idx) => {
              const billTotal = bill.cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
              const billItems = bill.cart.reduce((s, i) => s + i.quantity, 0);
              return (
                <div key={bill.id} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', marginBottom: 10, border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PauseCircle size={16} color="#D97706" />
                  </div>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => restoreParkedBill(bill)}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>
                      Bill #{idx + 1}{bill.walkinName ? ` · ${bill.walkinName}` : ''}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                      {billItems} item{billItems !== 1 ? 's' : ''} · ₹{billTotal.toLocaleString('en-IN')}
                    </div>
                    {bill.billNote && <div style={{ fontSize: 11, color: '#D97706', marginTop: 2 }}>Note: {bill.billNote}</div>}
                  </div>
                  <button onClick={() => restoreParkedBill(bill)} style={{ padding: '5px 12px', background: '#D97706', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Restore</button>
                  <button onClick={() => dropParkedBill(bill.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}><CloseIcon size={14} /></button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {tab === 'products' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t('pos.searchPlaceholder')} autoFocus
                  style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14, background: '#fff', boxSizing: 'border-box' }} />
              </div>
              {has('pos.barcode_scanner') && (
                <button onClick={() => setShowScanner(true)} title={t('pos.scanBarcode')}
                  style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: '#fff', cursor: 'pointer', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  <ScanLine size={16} /> Scan
                </button>
              )}
            </div>

            {has('pos.category_filter') && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                    style={{ padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', background: activeCategory === cat.id ? 'var(--navy)' : 'var(--surface-1)', color: activeCategory === cat.id ? '#fff' : '#6B7280', transition: 'all 0.15s' }}>
                    {cat.name}
                    {cat.id !== 'all' && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.75 }}>{products.filter(p => p.stock > 0 && p.categoryId === cat.id).length}</span>}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <p style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 40 }}>Loading products…</p>
            ) : filtered.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 32 }}>No products found</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filtered.map(p => (
                  <div key={p.id} onClick={() => addToCart(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.background = '#F0FDFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#fff'; }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: p.category ? `hsl(${(p.category.name.charCodeAt(0) * 47) % 360}, 60%, 55%)` : '#D1D5DB' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{p.category?.name || 'Uncategorised'} · {p.sku || '—'}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: p.stock <= p.lowStockAlert ? 'var(--vermilion)' : '#9CA3AF', whiteSpace: 'nowrap', flexShrink: 0 }}>{p.stock} {p.unit}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--navy)' }}>₹{Number(p.sellingPrice).toLocaleString('en-IN')}</span>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Plus size={14} color="#fff" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile floating cart button */}
      {isMobile && (
        <button onClick={() => setMobileCartOpen(true)} style={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 90, background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
          <ShoppingBag size={18} />
          <span style={{ fontWeight: 700, fontSize: 15, flex: 1, textAlign: 'left' }}>
            {cartCount > 0 ? `${cartCount} item${cartCount !== 1 ? 's' : ''}` : 'View Cart'}
          </span>
          {cartCount > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15 }}>₹{cartTotal.toLocaleString('en-IN')}</span>}
        </button>
      )}

      {/* ── RIGHT: Cart ───────────────────────────────────────────────────────── */}
      {(!isMobile || mobileCartOpen) && (
        <div style={{ ...(isMobile ? { position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: 'transparent' } : { width: 360, display: 'flex', flexDirection: 'column', background: '#fff' }) }}>
          {isMobile && <div onClick={() => setMobileCartOpen(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} />}
          <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', ...(isMobile ? { borderRadius: '20px 20px 0 0', maxHeight: '90dvh', boxShadow: '0 -4px 32px rgba(0,0,0,0.18)' } : { flex: 1, minHeight: 0 }) }}>

            {/* Cart Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Receipt size={15} color="var(--navy)" />
              <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>Current Bill</span>
              {cart.length > 0 && <span style={{ fontSize: 11, background: 'var(--cyan)', color: '#fff', padding: '2px 8px', borderRadius: 99 }}>{cart.length} items</span>}
              {has('pos.hold_bill') && cart.length > 0 && (
                <button onClick={parkBill} title="Park this bill and start a new one"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #FDE68A', borderRadius: 6, background: '#FFFBEB', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#D97706' }}>
                  <PauseCircle size={12} /> Park
                </button>
              )}
              {has('pos.hold_bill') && parkedBills.length > 0 && (
                <button onClick={() => setTab('parked')} title="View parked bills"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-1)', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                  <PlayCircle size={12} /> {parkedBills.length}
                </button>
              )}
              {isMobile && <button onClick={() => setMobileCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><CloseIcon size={18} /></button>}
            </div>

            {/* Customer Section */}
            {has('pos.customer_capture') && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={13} color="#9CA3AF" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Customer</span>
                  </div>
                  <div style={{ display: 'flex', background: 'var(--surface-1)', borderRadius: 6, padding: 2 }}>
                    <button onClick={() => setCustomerMode('walkin')} style={{ padding: '3px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: customerMode === 'walkin' ? '#fff' : 'transparent', color: customerMode === 'walkin' ? 'var(--navy)' : '#9CA3AF', boxShadow: customerMode === 'walkin' ? 'var(--shadow-sm)' : 'none' }}>New</button>
                    <button onClick={() => setCustomerMode('existing')} style={{ padding: '3px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: customerMode === 'existing' ? '#fff' : 'transparent', color: customerMode === 'existing' ? 'var(--navy)' : '#9CA3AF', boxShadow: customerMode === 'existing' ? 'var(--shadow-sm)' : 'none' }}>Existing</button>
                  </div>
                </div>
                {customerMode === 'existing' ? (
                  <select value={existingCustomerId} onChange={e => setExistingCustomerId(e.target.value)} style={{ ...P.input, width: '100%' }}>
                    <option value="">Walk-in customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
                  </select>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <input value={walkinName}  onChange={e => setWalkinName(e.target.value)}  placeholder="Name"             style={{ ...P.input, width: '100%' }} />
                      <input value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} placeholder="Phone (WhatsApp)" type="tel" style={{ ...P.input, width: '100%' }} />
                    </div>
                    {showExtraFields && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <input value={walkinEmail}   onChange={e => setWalkinEmail(e.target.value)}   placeholder="Email"   type="email" style={{ ...P.input, width: '100%' }} />
                        <input value={walkinAddress} onChange={e => setWalkinAddress(e.target.value)} placeholder="Address"             style={{ ...P.input, width: '100%' }} />
                      </div>
                    )}
                    <button onClick={() => setShowExtraFields(f => !f)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9CA3AF', textAlign: 'left', padding: 0 }}>
                      {showExtraFields ? '▲ Less details' : '+ Add email / address'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', minHeight: 0 }}>
              {cart.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF' }}>
                  <Receipt size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p style={{ fontSize: 13 }}>Add products to start billing</p>
                </div>
              ) : cart.map(item => (
                <div key={item.productId} style={{ padding: '10px 16px', borderBottom: '1px solid var(--surface-2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                      <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'var(--font-mono)' }}>₹{Number(item.unitPrice).toLocaleString('en-IN')}</span>
                      {item.gstRate > 0 && (
                        <span style={{ fontSize: 10, background: '#FFFBEB', color: '#D97706', borderRadius: 4, padding: '1px 5px', fontWeight: 700, border: '1px solid #FDE68A', flexShrink: 0 }}>
                          GST {item.gstRate}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <button onClick={() => updateQty(item.productId, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={11} /></button>
                    {editingQty === item.productId ? (
                      <input ref={qtyInputRef} type="number" min="1" max={item.maxStock}
                        value={editingQtyValue}
                        onChange={e => setEditingQtyValue(e.target.value)}
                        onBlur={() => setQtyDirect(item.productId, editingQtyValue)}
                        onKeyDown={e => { if (e.key === 'Enter') setQtyDirect(item.productId, editingQtyValue); if (e.key === 'Escape') setEditingQty(null); }}
                        style={{ width: 36, textAlign: 'center', border: '1px solid var(--cyan)', borderRadius: 6, fontSize: 13, fontWeight: 700, padding: '2px 4px', outline: 'none' }} />
                    ) : (
                      <span
                        onClick={() => { setEditingQty(item.productId); setEditingQtyValue(String(item.quantity)); setTimeout(() => qtyInputRef.current?.select(), 0); }}
                        title="Click to edit quantity"
                        style={{ fontSize: 14, fontWeight: 700, minWidth: 28, textAlign: 'center', cursor: 'text', borderRadius: 4, padding: '2px 4px', border: '1px solid transparent' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                        {item.quantity}
                      </span>
                    )}
                    <button onClick={() => updateQty(item.productId, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={11} /></button>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, minWidth: 56, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}</div>
                  <button onClick={() => removeItem(item.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>

            {/* Totals + Payment */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface-1)', flexShrink: 0 }}>

              {/* Bill Breakup */}
              <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 10, overflow: 'hidden', fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ color: '#6B7280' }}>Subtotal (excl. tax)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#374151' }}>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>

                {has('pos.discount') && (
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F3F4F6' }}>
                    <span style={{ padding: '0 12px', color: '#6B7280', whiteSpace: 'nowrap' }}>Discount</span>
                    <div style={{ flex: 1, display: 'flex', borderLeft: '1px solid #F3F4F6' }}>
                      <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)}
                        placeholder={discountType === 'pct' ? '0 %' : '₹ 0'}
                        style={{ flex: 1, padding: '6px 8px', border: 'none', outline: 'none', fontSize: 12, background: '#fff', width: 0 }} />
                      <button onClick={() => setDiscountType(dt => dt === 'flat' ? 'pct' : 'flat')}
                        style={{ padding: '6px 10px', background: '#F9FAFB', border: 'none', borderLeft: '1px solid #F3F4F6', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>
                        {discountType === 'flat' ? '₹' : '%'}
                      </button>
                    </div>
                    {discountAmt > 0 && (
                      <span style={{ padding: '0 12px', color: '#16A34A', fontWeight: 700, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        − ₹{discountAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                )}

                {(discountAmt > 0 || hasTax) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                    <span style={{ color: '#374151', fontWeight: 600 }}>Taxable amount</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#374151' }}>₹{taxableAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                {has('pos.gst_breakdown') && Object.entries(gstGroups).filter(([rate]) => Number(rate) > 0).map(([rate, vals]) => (
                  <div key={rate} style={{ background: '#FFFBEB', borderBottom: '1px solid #FEF3C7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 12px 2px' }}>
                      <span style={{ color: '#B45309', fontWeight: 700 }}>GST @ {rate}%</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#B45309' }}>₹{vals.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 12px 1px 22px' }}>
                      <span style={{ color: '#92400E', fontSize: 11 }}>CGST ({Number(rate) / 2}%)</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#92400E', fontSize: 11 }}>₹{vals.cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 12px 5px 22px' }}>
                      <span style={{ color: '#92400E', fontSize: 11 }}>SGST ({Number(rate) / 2}%)</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#92400E', fontSize: 11 }}>₹{vals.sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}

                {!hasTax && cart.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#F9FAFB' }}>
                    <span style={{ color: '#9CA3AF', fontSize: 11 }}>GST</span>
                    <span style={{ color: '#9CA3AF', fontSize: 11 }}>₹0.00 (no tax on items)</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--navy)' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Grand Total</span>
                  <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff' }}>
                    ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment methods */}
              <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                {activeMethods.map(m => (
                  <button key={m.key} onClick={() => setMethod(m.key)}
                    style={{ flex: 1, padding: '6px 4px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: `1px solid ${method === m.key ? 'var(--navy)' : 'var(--border)'}`, background: method === m.key ? 'var(--navy)' : '#fff', color: method === m.key ? '#fff' : '#6B7280', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* CASH: amount + quick buttons */}
              {method === 'CASH' && (
                <div style={{ marginBottom: 10 }}>
                  <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                    placeholder={`Amount received (default ₹${total.toLocaleString('en-IN')})`}
                    style={{ ...P.input, width: '100%', marginBottom: 6 }} />
                  {has('pos.quick_cash') && total > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
                      {QUICK_CASH.filter(a => a >= total).slice(0, 5).map(a => (
                        <button key={a} onClick={() => setAmountPaid(String(a))}
                          style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${amountPaid === String(a) ? 'var(--cyan)' : 'var(--border)'}`, background: amountPaid === String(a) ? '#F0FDFF' : '#fff', color: amountPaid === String(a) ? 'var(--cyan)' : '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                          ₹{a}
                        </button>
                      ))}
                      {total % 1 !== 0 && (
                        <button onClick={() => setAmountPaid(String(Math.ceil(total)))}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E0F2FE', background: '#F0F9FF', color: '#0284C7', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                          ₹{Math.ceil(total)} ↑
                        </button>
                      )}
                    </div>
                  )}
                  {change > 0 && (
                    <div style={{ fontSize: 13, color: 'var(--emerald)', fontWeight: 700, padding: '4px 8px', background: '#F0FDF4', borderRadius: 6 }}>
                      Change to return: ₹{change.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              )}

              {/* UPI QR */}
              {method === 'UPI' && has('pos.upi_qr') && cart.length > 0 && (
                <div style={{ marginBottom: 10, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 14, textAlign: 'center' }}>
                  {upiString ? (
                    <>
                      <div style={{ display: 'inline-flex', padding: 10, background: '#fff', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 8 }}>
                        <QRCodeSVG value={upiString} size={140} level="M" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                        <QrCode size={12} color="#6B7280" />
                        <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'var(--font-mono)' }}>{upiId}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                        Ask customer to scan and pay <strong>₹{total.toLocaleString('en-IN')}</strong>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '6px 0' }}>
                      <QrCode size={24} color="#D1D5DB" style={{ margin: '0 auto 8px', display: 'block' }} />
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Add your UPI ID in <strong>Settings → Business Profile</strong> to show QR code</p>
                    </div>
                  )}
                </div>
              )}

              {/* Bill Note */}
              {has('pos.bill_note') && (
                <div style={{ marginBottom: 10 }}>
                  <input value={billNote} onChange={e => setBillNote(e.target.value)}
                    placeholder="Bill note (optional — e.g. home delivery, gift wrapping)"
                    style={{ ...P.input, width: '100%', fontSize: 12 }} />
                </div>
              )}

              {/* Checkout button */}
              {method === 'UPI' ? (
                <button onClick={checkout} disabled={submitting || cart.length === 0}
                  style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: cart.length === 0 ? '#D1D5DB' : 'var(--emerald)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: (submitting || cart.length === 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <CheckCircle size={16} />
                  {submitting ? 'Processing…' : cart.length === 0 ? 'Add items to bill' : `Mark as Paid — ₹${total.toLocaleString('en-IN')}`}
                </button>
              ) : (
                <Button fullWidth size="lg" loading={submitting} onClick={checkout} disabled={cart.length === 0}>
                  Charge ₹{total.toLocaleString('en-IN')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

    {lastReceipt && (
      <POSReceipt receipt={lastReceipt} onClose={() => setLastReceipt(null)} onNewSale={() => setLastReceipt(null)} />
    )}
    {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </>
  );
}
