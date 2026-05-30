import { useEffect, useState } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import KpiBar from '../../components/ui/KpiBar';
import { useSearchParams } from 'react-router-dom';
import { useBranch } from '../../context/BranchContext';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, getCategoryReport, seedStandardCategories, deduplicateCategories, createCategory, deleteCategory, getTaxRates, adjustStock, getStockMovements, getSalesReport, getAllStockMovements, getTopProducts, getDemandTrends } from '../../api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import BarcodeScanner from '../../components/BarcodeScanner';
import toast from 'react-hot-toast';
import { Plus, Search, Package, AlertTriangle, Edit2, Trash2, ArrowUpDown, AlertCircle, CalendarX, Lightbulb, ShoppingCart, CheckCircle2, Clock, Truck, BarChart2, TrendingUp, TrendingDown, Activity, Star, Flame, Zap, Camera } from 'lucide-react';
import { getPurchaseOrders, createPurchaseOrder, receivePurchaseOrder, getVendors, deletePurchaseOrder } from '../../api';

// Client-side GST keyword lookup (mirrors gstReference.js)
const GST_HINTS = [
  { keywords: ['mobile','smartphone','iphone','android','redmi','samsung galaxy','oppo','vivo','oneplus'], hsn: '8517', rate: 18 },
  { keywords: ['television','smart tv','oled','4k tv','led tv','43"','55"','65"'], hsn: '8528', rate: 28 },
  { keywords: ['32" tv','mi 32','32 inch tv'], hsn: '8528', rate: 18 },
  { keywords: ['air conditioner','split ac','window ac','inverter ac','daikin','voltas','carrier'], hsn: '8415', rate: 28 },
  { keywords: ['refrigerator','fridge'], hsn: '8418', rate: 28 },
  { keywords: ['washing machine','front load','top load'], hsn: '8450', rate: 28 },
  { keywords: ['laptop','computer','notebook','macbook'], hsn: '8471', rate: 18 },
  { keywords: ['earphone','headphone','speaker','boat','neckband','earbuds','rockerz'], hsn: '8518', rate: 18 },
  { keywords: ['charger','adapter','gan charger','fast charger'], hsn: '8504', rate: 18 },
  { keywords: ['power bank','powerbank'], hsn: '8507', rate: 28 },
  { keywords: ['tempered glass','screen protector','screen guard'], hsn: '7007', rate: 18 },
  { keywords: ['phone cover','phone case','back cover','silicon cover'], hsn: '3926', rate: 18 },
  { keywords: ['smart watch','fitness band'], hsn: '9102', rate: 18 },
  { keywords: ['led bulb','led light','tubelight'], hsn: '8539', rate: 12 },
  { keywords: ['fan','ceiling fan','table fan'], hsn: '8414', rate: 18 },
  { keywords: ['induction','cooktop','kettle','toaster','electric iron','room heater','geyser'], hsn: '8516', rate: 18 },
  { keywords: ['air fryer','microwave','oven','otg'], hsn: '8516', rate: 18 },
  { keywords: ['mixer','grinder','mixer grinder','juicer','blender'], hsn: '8509', rate: 12 },
  { keywords: ['toor dal','chana dal','moong dal','urad dal','masoor dal','dal'], hsn: '0713', rate: 5 },
  { keywords: ['basmati rice','india gate','dawat rice'], hsn: '1006', rate: 5 },
  { keywords: ['atta','aashirvaad','wheat flour'], hsn: '1101', rate: 5 },
  { keywords: ['salt','tata salt','namak'], hsn: '2501', rate: 0 },
  { keywords: ['milk','amul milk','doodh'], hsn: '0401', rate: 0 },
  { keywords: ['ghee','pure ghee','amul ghee'], hsn: '0405', rate: 12 },
  { keywords: ['butter','amul butter'], hsn: '0405', rate: 12 },
  { keywords: ['tea','red label','tata tea','brooke bond'], hsn: '0902', rate: 5 },
  { keywords: ['nescafe','instant coffee','coffee powder'], hsn: '2101', rate: 18 },
  { keywords: ['coconut oil','parachute'], hsn: '1513', rate: 5 },
  { keywords: ['sunflower oil','saffola','sundrop','soya bean oil','edible oil'], hsn: '1507', rate: 5 },
  { keywords: ['masala','haldi','turmeric','chilli powder','garam masala','mdh','everest'], hsn: '0910', rate: 5 },
  { keywords: ['biscuit','parle','britannia','cookie'], hsn: '1905', rate: 18 },
  { keywords: ['chips','lays','kurkure','wafers'], hsn: '2008', rate: 18 },
  { keywords: ['namkeen','bhujia','haldirams'], hsn: '2106', rate: 18 },
  { keywords: ['maggi','noodles','yippee'], hsn: '1902', rate: 18 },
  { keywords: ['shampoo','hair serum','hair colour','schwarzkopf','loreal','matrix'], hsn: '3305', rate: 18 },
  { keywords: ['face cream','sunscreen','moisturiser','lakme','vlcc cream','skin care'], hsn: '3304', rate: 18 },
  { keywords: ['soap','handwash','face wash','body wash','dettol','lux','dove'], hsn: '3401', rate: 18 },
  { keywords: ['toothpaste','toothbrush','colgate','pepsodent','oral-b'], hsn: '3306', rate: 18 },
  { keywords: ['detergent','surf excel','ariel','tide','washing powder'], hsn: '3402', rate: 18 },
  { keywords: ['toilet cleaner','harpic','lizol','phenyl','floor cleaner'], hsn: '3808', rate: 18 },
  { keywords: ['deodorant','deo','perfume','fogg','axe'], hsn: '3303', rate: 28 },
  { keywords: ['coca cola','pepsi','sprite','cold drink','soda','aerated'], hsn: '2202', rate: 28 },
  { keywords: ['mineral water','bisleri','kinley'], hsn: '2201', rate: 18 },
  { keywords: ['dahi','curd','yoghurt'], hsn: '0403', rate: 5 },
  { keywords: ['paneer','cheese'], hsn: '0406', rate: 12 },
  { keywords: ['chocolate','cadbury','bournvita'], hsn: '1806', rate: 18 },
  { keywords: ['medicine','tablet','capsule','syrup','drug','antibiotic'], hsn: '3004', rate: 5 },
  { keywords: ['bandage','dressing','cotton','gauze'], hsn: '3005', rate: 12 },
  { keywords: ['consultation','doctor fee','opd'], hsn: '999311', rate: 0 },
  { keywords: ['blood test','x-ray','ecg','diagnostic'], hsn: '999312', rate: 0 },
  { keywords: ['coaching fee','tuition','class fee','course fee','jee','neet'], hsn: '999294', rate: 18 },
  { keywords: ['book','textbook','study material','notes'], hsn: '4901', rate: 0 },
  { keywords: ['gold','gold ring','gold chain','jewellery'], hsn: '7113', rate: 3 },
  { keywords: ['silver','silver ring'], hsn: '7114', rate: 3 },
];

const suggestGst = (productName, categoryName = '') => {
  const text = `${productName} ${categoryName}`.toLowerCase();
  let best = null, bestScore = 0;
  for (const h of GST_HINTS) {
    const score = h.keywords.reduce((s, kw) => text.includes(kw) ? s + kw.length : s, 0);
    if (score > bestScore) { bestScore = score; best = h; }
  }
  return bestScore > 0 ? best : null;
};


const getCurrentFY = () => {
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { label: `FY ${fyStart}-${String(fyStart + 1).slice(2)}`, from: `${fyStart}-04-01`, to: `${fyStart + 1}-03-31`, fyStart };
};
const FY_MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

const buildFYChart = (salesData, fyStart) => {
  const months = [
    `${fyStart}-04`,`${fyStart}-05`,`${fyStart}-06`,`${fyStart}-07`,
    `${fyStart}-08`,`${fyStart}-09`,`${fyStart}-10`,`${fyStart}-11`,
    `${fyStart}-12`,`${fyStart+1}-01`,`${fyStart+1}-02`,`${fyStart+1}-03`,
  ];
  const map = {};
  for (const d of salesData) map[d.date] = d;
  return months.map((m, i) => ({ label: FY_MONTHS[i], revenue: map[m]?.revenue || 0, txn: map[m]?.transactions || 0, month: m }));
};

// Build { parents: Category[], childrenOf: {[parentId]: Category[]} } from flat list
const buildCategoryTree = (cats) => {
  const parents = cats.filter(c => !c.parentId);
  const childrenOf = {};
  for (const c of cats) {
    if (c.parentId) {
      if (!childrenOf[c.parentId]) childrenOf[c.parentId] = [];
      childrenOf[c.parentId].push(c);
    }
  }
  return { parents, childrenOf };
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const EMPTY = {
  name: '', sku: '', sellingPrice: '', costPrice: '', stock: '', unit: 'pcs',
  categoryId: '', taxRateId: '', hsnCode: '', lowStockAlert: '5', description: '',
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
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [searchParams] = useSearchParams();
  const [section, setSection] = useState('products'); // 'products' | 'purchase-orders'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [search, setSearch] = useState('');
  const [expiryFilter, setExpiryFilter] = useState(searchParams.get('filter') || 'all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const PAGE_LIMIT = 100;
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [stockForm, setStockForm] = useState({ productId: '', type: 'PURCHASE', quantity: '', notes: '' });
  const [catName, setCatName] = useState('');
  const [saving, setSaving] = useState(false);

  // Barcode scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState('search'); // 'search' | 'sku'

  // Product detail / stock history
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [detailMovements, setDetailMovements] = useState([]);
  const [detailMovementsLoading, setDetailMovementsLoading] = useState(false);

  // Purchase Orders state
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [poForm, setPOForm] = useState({ vendorId: '', expectedDate: '', notes: '', items: [{ productId: '', description: '', quantity: 1, unitCost: '', taxRate: 0 }] });
  const [receiveForm, setReceiveForm] = useState([]);
  const [poSaving, setPOSaving] = useState(false);

  // Analytics state
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [topSellers, setTopSellers] = useState([]);
  const [salesMonthly, setSalesMonthly] = useState([]);
  const [allMovements, setAllMovements] = useState([]);
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());

  // Demand trends state
  const [demandInterval, setDemandInterval] = useState('3m');
  const [demandData, setDemandData] = useState({ rising: [], declining: [] });
  const [demandLoading, setDemandLoading] = useState(false);

  // Category report state
  const [catReport, setCatReport] = useState([]);
  const [catReportLoading, setCatReportLoading] = useState(false);
  const [expandedCat, setExpandedCat] = useState(null);

  const load = async (opts = {}) => {
    setLoading(true);
    try {
      const params = { page: opts.page || page, limit: PAGE_LIMIT };
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (branchId) params.branchId = branchId;
      const [p, c, t, po, v] = await Promise.all([getProducts(params), getCategories(), getTaxRates(), getPurchaseOrders(), getVendors()]);
      const pd = p.data.data;
      if (pd && pd.products) {
        setProducts(pd.products);
        setPagination({ total: pd.total, totalPages: pd.totalPages, page: pd.page, limit: pd.limit });
      } else {
        setProducts(pd || []);
        setPagination(null);
      }
      setCategories(c.data.data);
      setTaxRates(t.data.data);
      setPurchaseOrders(po.data.data || []);
      setVendors(v.data.data || []);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  // Reset to page 1 when filters or branch changes
  useEffect(() => { setPage(1); load({ page: 1 }); }, [search, categoryFilter, branchId]);

  // Keep detailProduct in sync when products list refreshes
  useEffect(() => {
    if (detailProduct) {
      const updated = products.find(p => p.id === detailProduct.id);
      if (updated) setDetailProduct(updated);
    }
  }, [products]);

  const openDetail = async (product) => {
    setDetailProduct(product);
    setDetailMovements([]);
    setShowDetailModal(true);
    setDetailMovementsLoading(true);
    try {
      const { data } = await getStockMovements(product.id);
      setDetailMovements(data.data || []);
    } catch { toast.error('Failed to load stock history'); }
    finally { setDetailMovementsLoading(false); }
  };

  const refreshDetailMovements = async (productId) => {
    try {
      const { data } = await getStockMovements(productId);
      setDetailMovements(data.data || []);
    } catch {}
  };

  const loadAnalytics = async (fy = selectedFY) => {
    setAnalyticsLoading(true);
    try {
      const [sellers, sales, movements] = await Promise.all([
        getTopProducts({ from: fy.from, to: fy.to, limit: 10 }),
        getSalesReport({ from: fy.from, to: fy.to, groupBy: 'month' }),
        getAllStockMovements(),
      ]);
      setTopSellers(sellers.data.data || []);
      setSalesMonthly(sales.data.data?.data || []);
      setAllMovements(movements.data.data || []);
    } catch { toast.error('Failed to load analytics'); }
    finally { setAnalyticsLoading(false); }
  };

  useEffect(() => { if (section === 'analytics') loadAnalytics(selectedFY); }, [section, selectedFY]);

  const loadDemandTrends = async (interval = demandInterval) => {
    setDemandLoading(true);
    try {
      const { data } = await getDemandTrends({ interval });
      setDemandData(data.data || { rising: [], declining: [] });
    } catch { toast.error('Failed to load demand trends'); }
    finally { setDemandLoading(false); }
  };

  useEffect(() => { if (section === 'analytics') loadDemandTrends(demandInterval); }, [section, demandInterval]);

  const loadCatReport = async () => {
    setCatReportLoading(true);
    try {
      const { data } = await getCategoryReport();
      setCatReport(data.data || []);
    } catch { toast.error('Failed to load category report'); }
    finally { setCatReportLoading(false); }
  };

  useEffect(() => { if (section === 'analytics') loadCatReport(); }, [section]);

  const importStdCategories = async () => {
    setSaving(true);
    try {
      await seedStandardCategories();
      toast.success('Syllabrix standard taxonomy seeded! 14 super-categories + 78 sub-categories.');
      load();
    } catch { toast.error('Failed to seed standard categories'); }
    finally { setSaving(false); }
  };

  // ── Purchase Order handlers ────────────────────────────────────────────────
  const openNewPO = () => {
    setPOForm({ vendorId: '', expectedDate: '', notes: '', items: [{ productId: '', description: '', quantity: 1, unitCost: '', taxRate: 0 }] });
    setShowPOModal(true);
  };

  const addPOItem = () => setPOForm(f => ({ ...f, items: [...f.items, { productId: '', description: '', quantity: 1, unitCost: '', taxRate: 0 }] }));
  const removePOItem = (i) => setPOForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const setPOItem = (i, k, v) => setPOForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));

  const savePO = async (e) => {
    e.preventDefault();
    if (poForm.items.length === 0) return toast.error('Add at least one item');
    setPOSaving(true);
    try {
      await createPurchaseOrder({
        ...poForm,
        items: poForm.items.map(i => ({
          ...i,
          productId: i.productId || null,
          description: i.description || products.find(p => p.id === i.productId)?.name || 'Item',
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
          taxRate: Number(i.taxRate),
        })),
      });
      toast.success('Purchase Order created!');
      setShowPOModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPOSaving(false); }
  };

  const openReceive = (po) => {
    setSelectedPO(po);
    setReceiveForm(po.items.map(i => ({ itemId: i.id, receivedQty: i.quantity - i.receivedQty, maxQty: i.quantity - i.receivedQty, description: i.description })));
    setShowReceiveModal(true);
  };

  const confirmReceive = async () => {
    setPOSaving(true);
    try {
      await receivePurchaseOrder(selectedPO.id, receiveForm.map(r => ({ itemId: r.itemId, receivedQty: Number(r.receivedQty) })));
      toast.success('Stock updated! Inventory has been incremented.');
      setShowReceiveModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPOSaving(false); }
  };

  const handleBarcodeScan = (code) => {
    if (scanTarget === 'search') {
      setSearch(code);
      setExpiryFilter('all');
      setCategoryFilter('');
      toast.success(`Scanned: ${code}`);
    } else if (scanTarget === 'sku') {
      setForm(f => ({ ...f, sku: code }));
      toast.success(`SKU filled: ${code}`);
    }
  };

  const openScanner = (target) => { setScanTarget(target); setShowScanner(true); };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku || '', sellingPrice: p.sellingPrice, costPrice: p.costPrice,
      stock: p.stock, unit: p.unit, categoryId: p.categoryId || '', taxRateId: p.taxRateId || '',
      hsnCode: p.hsnCode || '', lowStockAlert: p.lowStockAlert, description: p.description || '',
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
      await adjustStock(stockForm.productId, { type: stockForm.type, quantity: +stockForm.quantity, notes: stockForm.notes, ...(branchId && { branchId }) });
      toast.success('Stock updated');
      setShowStockModal(false);
      load();
      if (showDetailModal && detailProduct?.id === stockForm.productId) {
        refreshDetailMovements(stockForm.productId);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Stock update failed'); }
    finally { setSaving(false); }
  };

  const saveCat = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setSaving(true);
    try { await createCategory({ name: catName }); toast.success('Category added'); setCatName(''); load(); }
    catch { toast.error('Failed to add category'); }
    finally { setSaving(false); }
  };

  const deleteCat = async (cat) => {
    if (!confirm(`Delete "${cat.name}"? Products in this category will become uncategorised.`)) return;
    try { await deleteCategory(cat.id); toast.success('Category deleted'); load(); }
    catch { toast.error('Failed to delete category'); }
  };

  // Counts
  const lowStock = products.filter(p => p.stock <= p.lowStockAlert);
  const expiredCount = products.filter(p => p.expiryDate && daysUntilExpiry(p.expiryDate) < 0).length;
  const expiringCount = products.filter(p => p.expiryDate && daysUntilExpiry(p.expiryDate) >= 0 && daysUntilExpiry(p.expiryDate) <= 30).length;

  // Precompute category tree for filtering
  const { parents: catParents, childrenOf: catChildrenOf } = buildCategoryTree(categories);
  const parentCatIds = new Set(catParents.map(c => c.id));

  // Filter products
  // search and categoryFilter are handled server-side; only expiry/stock filters remain client-side
  const filtered = expiryFilter === 'all' ? products : products.filter(p => {
    const days = daysUntilExpiry(p.expiryDate);
    if (expiryFilter === 'expired')  return days !== null && days < 0;
    if (expiryFilter === 'expiring') return days !== null && days >= 0 && days <= 30;
    if (expiryFilter === 'lowstock') return p.stock <= p.lowStockAlert;
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

  const poStatusBadge = (status) => {
    const s = { DRAFT: ['#6B7280','#F3F4F6'], ORDERED: ['#2563EB','#EFF6FF'], PARTIAL: ['#D97706','#FFFBEB'], RECEIVED: ['#059669','#ECFDF5'], CANCELLED: ['#DC2626','#FEF2F2'] }[status] || ['#6B7280','#F3F4F6'];
    return <span style={{ fontSize: 11, fontWeight: 700, color: s[0], background: s[1], padding: '2px 8px', borderRadius: 10 }}>{status}</span>;
  };

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Inventory</h1>
          <p style={P.sub}>
            {products.length} products · {lowStock.length} low stock
            {expiredCount > 0 && <span style={{ color: 'var(--vermilion)', marginLeft: 8 }}>· {expiredCount} expired</span>}
            {expiringCount > 0 && <span style={{ color: 'var(--amber)', marginLeft: 8 }}>· {expiringCount} expiring soon</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {section === 'products' && <>
            <Button variant="ghost" size="sm" onClick={() => setShowCatModal(true)}>Categories</Button>
            <Button size="sm" onClick={openAdd}><Plus size={15} />Add product</Button>
          </>}
          {section === 'purchase-orders' && (
            <Button size="sm" onClick={openNewPO}><Plus size={15} />New Purchase Order</Button>
          )}
          {section === 'analytics' && (
            <select value={selectedFY.label} onChange={e => {
              const yr = parseInt(e.target.value.split(' ')[1].split('-')[0]);
              setSelectedFY({ label: `FY ${yr}-${String(yr+1).slice(2)}`, from: `${yr}-04-01`, to: `${yr+1}-03-31`, fyStart: yr });
            }} style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: '#fff' }}>
              {[getCurrentFY().fyStart, getCurrentFY().fyStart - 1].map(yr => (
                <option key={yr} value={`FY ${yr}-${String(yr+1).slice(2)}`}>{`FY ${yr}-${String(yr+1).slice(2)}`}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface-1)', borderRadius: 10, padding: 3, marginBottom: 20, width: 'fit-content' }}>
        {[['products','Products', Package], ['purchase-orders','Purchase Orders', ShoppingCart], ['analytics','Analytics', BarChart2]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setSection(id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            background: section === id ? '#fff' : 'transparent',
            color: section === id ? 'var(--navy)' : '#9CA3AF',
            boxShadow: section === id ? 'var(--shadow-sm)' : 'none',
          }}>
            <Icon size={14} />{label}
            {id === 'purchase-orders' && purchaseOrders.filter(p => p.status === 'ORDERED').length > 0 && (
              <span style={{ background: 'var(--navy)', color: '#fff', borderRadius: 10, fontSize: 10, padding: '0 5px', fontWeight: 700 }}>
                {purchaseOrders.filter(p => p.status === 'ORDERED').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Analytics Section ──────────────────────────────────────── */}
      {section === 'analytics' && (
        analyticsLoading ? (
          <div style={{ padding: 64, textAlign: 'center', color: '#9CA3AF' }}>
            <Activity size={28} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>Loading analytics…</p>
          </div>
        ) : (
          <div>
            <KpiBar stats={[
              { label: 'Total Products',  value: products.length,                                                                                           color: 'var(--navy)',     icon: Package       },
              { label: 'Inventory Value', value: `₹${products.reduce((s,p) => s + (p.costPrice || p.sellingPrice || 0) * p.stock, 0).toLocaleString('en-IN')}`, color: 'var(--cyan)', icon: TrendingUp     },
              { label: 'Low Stock Items', value: products.filter(p => p.stock <= p.lowStockAlert).length,                                                   color: 'var(--amber)',    icon: AlertTriangle  },
              { label: 'Out of Stock',    value: products.filter(p => p.stock === 0).length,                                                                color: 'var(--vermilion)',icon: AlertCircle    },
            ]} />

            {/* Top Sellers + Low Stock */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Top Selling Products */}
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Star size={15} color="var(--amber)" />
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Top Selling Products</h3>
                  </div>
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{selectedFY.label}</span>
                </div>
                {topSellers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>
                    <Package size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                    <p style={{ fontSize: 13 }}>No sales data for {selectedFY.label}</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>Record POS transactions to see top sellers</p>
                  </div>
                ) : topSellers.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: i < 3 ? 'var(--amber)' : '#9CA3AF', width: 18, textAlign: 'center' }}>#{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.product?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.qty} units sold</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>₹{Number(p.revenue).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </Card>

              {/* Low Stock Alert Panel */}
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <AlertTriangle size={15} color="var(--amber)" />
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Low Stock Alert</h3>
                  {products.filter(p => p.stock <= p.lowStockAlert).length > 0 && (
                    <span style={{ marginLeft: 'auto', background: '#FEF3C7', color: '#92400E', borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      {products.filter(p => p.stock <= p.lowStockAlert).length} items
                    </span>
                  )}
                </div>
                {products.filter(p => p.stock <= p.lowStockAlert).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>
                    <CheckCircle2 size={28} style={{ margin: '0 auto 8px', color: '#34D399' }} />
                    <p style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>All products are well-stocked!</p>
                  </div>
                ) : products.filter(p => p.stock <= p.lowStockAlert).sort((a, b) => a.stock - b.stock).slice(0, 8).map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>Alert at {p.lowStockAlert} {p.unit}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: p.stock === 0 ? 'var(--vermilion)' : 'var(--amber)' }}>
                      {p.stock} {p.unit}
                      {p.stock === 0 && <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--vermilion)' }}>OUT</span>}
                    </div>
                  </div>
                ))}
              </Card>
            </div>

            {/* Revenue Chart */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart2 size={15} color="var(--cyan)" />
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Monthly Revenue — {selectedFY.label}</h3>
                </div>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>From POS transactions</span>
              </div>
              {(() => {
                const chartData = buildFYChart(salesMonthly, selectedFY.fyStart);
                const maxRev = Math.max(...chartData.map(d => d.revenue), 1);
                const totalRev = chartData.reduce((s, d) => s + d.revenue, 0);
                return (
                  <div>
                    {totalRev === 0 && (
                      <div style={{ textAlign: 'center', padding: '16px 0 8px', color: '#9CA3AF', fontSize: 13 }}>
                        No POS revenue recorded for {selectedFY.label}. Record sales via POS to see chart.
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 180, padding: '0 4px' }}>
                      {chartData.map((d, i) => {
                        const barH = totalRev === 0 ? 0 : Math.max((d.revenue / maxRev) * 140, d.revenue > 0 ? 4 : 0);
                        const isCurrentMonth = d.month === `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
                        return (
                          <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 4, height: 16, textAlign: 'center' }}>
                              {d.revenue > 0 ? (d.revenue >= 100000 ? `₹${(d.revenue/100000).toFixed(1)}L` : `₹${Math.round(d.revenue/1000)}k`) : ''}
                            </div>
                            <div title={`${d.label}: ₹${d.revenue.toLocaleString('en-IN')} (${d.txn} txns)`}
                              style={{ width: '100%', height: barH || 0, background: isCurrentMonth ? 'var(--navy)' : 'var(--cyan)', borderRadius: '3px 3px 0 0', transition: 'height 0.4s ease', opacity: d.revenue === 0 ? 0.15 : 1 }} />
                            <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />
                            <div style={{ fontSize: 10, color: isCurrentMonth ? 'var(--navy)' : '#6B7280', fontWeight: isCurrentMonth ? 700 : 400, marginTop: 4, textAlign: 'center' }}>{d.label}</div>
                          </div>
                        );
                      })}
                    </div>
                    {totalRev > 0 && (
                      <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                        <div><span style={{ fontSize: 12, color: '#6B7280' }}>Total: </span><span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{totalRev.toLocaleString('en-IN')}</span></div>
                        <div><span style={{ fontSize: 12, color: '#6B7280' }}>Months with sales: </span><span style={{ fontSize: 13, fontWeight: 700 }}>{chartData.filter(d => d.revenue > 0).length}/12</span></div>
                        <div><span style={{ fontSize: 12, color: '#6B7280' }}>Monthly avg: </span><span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{Math.round(totalRev / Math.max(chartData.filter(d => d.revenue > 0).length, 1)).toLocaleString('en-IN')}</span></div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </Card>

            {/* Category Report */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <Package size={15} color="var(--navy)" />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Category Tally</h3>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>Products and inventory value by category</span>
                <button onClick={() => { setSection('products'); setShowCatModal(true); }}
                  style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--navy)', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontWeight: 600 }}>
                  Manage Categories →
                </button>
              </div>
              {catReportLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>Loading category report…</div>
              ) : catReport.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>No categories found. Add products to see the tally.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {catReport.filter(c => c.summary.count > 0 || c.subcategories.some(s => s.summary.count > 0)).map(cat => (
                    <div key={cat.id}>
                      {/* Super-category row */}
                      <div
                        onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: expandedCat === cat.id ? `${cat.color || '#64748B'}10` : 'var(--surface-1)', border: `1px solid ${expandedCat === cat.id ? (cat.color || '#64748B') + '44' : 'var(--border)'}`, cursor: 'pointer' }}>
                        <span style={{ fontSize: 18, width: 26, textAlign: 'center' }}>{cat.icon || '📦'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{cat.name}</span>
                            {cat.code && <span style={{ fontSize: 10, fontWeight: 800, color: cat.color || '#64748B', background: (cat.color || '#64748B') + '18', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{cat.code}</span>}
                            {cat.isStandard && <span style={{ fontSize: 9, color: '#059669', fontWeight: 700, background: '#DCFCE7', padding: '1px 5px', borderRadius: 4 }}>SYLLABRIX</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{cat.summary.count}</div>
                            <div style={{ fontSize: 10, color: '#9CA3AF' }}>products</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{fmt(cat.summary.inventoryValue)}</div>
                            <div style={{ fontSize: 10, color: '#9CA3AF' }}>stock value</div>
                          </div>
                          <div style={{ display: 'flex', gap: 5 }}>
                            {cat.summary.outOfStock > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--vermilion)', background: '#FEF2F2', padding: '2px 6px', borderRadius: 5 }}>{cat.summary.outOfStock} out</span>}
                            <span style={{ color: '#9CA3AF', fontSize: 13 }}>{expandedCat === cat.id ? '▲' : '▼'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {expandedCat === cat.id && (
                        <div style={{ marginLeft: 16, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {/* Subcategory rows (standard taxonomy) */}
                          {cat.subcategories.filter(s => s.summary.count > 0).map(sub => (
                            <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, background: '#fff', border: '1px solid var(--border)' }}>
                              <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-mono)', width: 80, flexShrink: 0 }}>{sub.code || '—'}</span>
                              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{sub.name}</span>
                              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{sub.summary.count}</span>
                                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>items</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{fmt(sub.summary.inventoryValue)}</span>
                                </div>
                                {sub.summary.outOfStock > 0 && (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--vermilion)', background: '#FEF2F2', padding: '2px 6px', borderRadius: 4 }}>{sub.summary.outOfStock} out</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {/* Direct products (flat/legacy categories — no subcategory) */}
                          {cat.directProducts?.filter(p => cat.subcategories.length === 0 || cat.subcategories.every(s => s.summary.count === 0)).map((p, i) => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 6, background: i % 2 === 0 ? '#FAFAFA' : '#fff', border: '1px solid var(--border)' }}>
                              <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{p.name}</span>
                              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{p.stock}</span>
                                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>in stock</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{fmt(p.value)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {cat.subcategories.filter(s => s.summary.count > 0).length === 0 &&
                           (!cat.directProducts || cat.directProducts.length === 0) && (
                            <div style={{ padding: '8px 12px', fontSize: 12, color: '#9CA3AF' }}>No products under this category yet.</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {catReport.every(c => c.summary.count === 0 && c.subcategories.every(s => s.summary.count === 0)) && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>
                      Add products and assign them to categories to see the tally here.
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Demand Trends */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flame size={15} color="var(--vermilion)" />
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Product Demand Trends</h3>
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>Period vs. prior period</span>
                </div>
                {/* Interval selector */}
                <div style={{ display: 'flex', gap: 4, background: 'var(--surface-1)', borderRadius: 8, padding: 3 }}>
                  {[['1m','1 Month'],['3m','3 Months'],['6m','6 Months'],['1y','1 Year']].map(([key, label]) => (
                    <button key={key} onClick={() => setDemandInterval(key)}
                      style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: demandInterval === key ? '#fff' : 'transparent',
                        color: demandInterval === key ? 'var(--navy)' : '#9CA3AF',
                        boxShadow: demandInterval === key ? 'var(--shadow-sm)' : 'none',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {demandLoading ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 13 }}>Computing trends…</div>
              ) : (demandData.rising.length === 0 && demandData.declining.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF' }}>
                  <Zap size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p style={{ fontSize: 13 }}>Need sales data in two consecutive periods to compute trends.</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Record POS transactions across two {demandInterval === '1m' ? 'months' : demandInterval === '3m' ? 'quarters' : demandInterval === '6m' ? 'half-years' : 'years'} to see rising and declining products.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>

                  {/* Rising */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                      <TrendingUp size={14} color="#059669" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>Rising Demand</span>
                      <span style={{ marginLeft: 'auto', background: '#059669', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{demandData.rising.length}</span>
                    </div>
                    {demandData.rising.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 12 }}>No rising products this period</div>
                    ) : demandData.rising.map((p, i) => (
                      <DemandRow key={p.id} item={p} rank={i + 1} type="rising" />
                    ))}
                  </div>

                  {/* Declining */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA' }}>
                      <TrendingDown size={14} color="#DC2626" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#7F1D1D' }}>Declining Demand</span>
                      <span style={{ marginLeft: 'auto', background: '#DC2626', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{demandData.declining.length}</span>
                    </div>
                    {demandData.declining.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 12 }}>No declining products this period</div>
                    ) : demandData.declining.map((p, i) => (
                      <DemandRow key={p.id} item={p} rank={i + 1} type="declining" />
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Recent Stock Movements */}
            <Card padding={0}>
              <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
                <Activity size={15} color="var(--navy)" />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Recent Stock Movements</h3>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>Last 50 entries</span>
              </div>
              {allMovements.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
                  <Package size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p style={{ fontSize: 13 }}>No stock movements yet. Adjust stock or receive a purchase order.</p>
                </div>
              ) : (
                <div style={P.tableScroll}>
                  <table style={P.table}>
                    <thead style={P.thead}>
                      <tr>
                        {['Product', 'Type', 'Qty Change', 'Stock After', 'Reference', 'Date'].map(h => (
                          <th key={h} style={P.th()}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allMovements.map((m, i) => {
                        const isAdd = ['PURCHASE','RETURN','ADJUSTMENT'].includes(m.type);
                        const typeColor = { PURCHASE: '#059669', RETURN: '#2563EB', ADJUSTMENT: '#7C3AED', DAMAGE: '#DC2626', SALE: '#D97706' }[m.type] || '#6B7280';
                        return (
                          <tr key={m.id} style={P.tr(i, allMovements.length)}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-1)'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}>
                            <td style={{ ...P.td(), fontWeight: 600 }}>{m.product?.name || '—'}</td>
                            <td style={P.td()}>
                              <span style={{ background: typeColor + '15', color: typeColor, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{m.type}</span>
                            </td>
                            <td style={{ ...P.td(), fontFamily: 'var(--font-mono)', fontWeight: 700, color: isAdd ? '#059669' : '#DC2626' }}>
                              {isAdd ? '+' : '−'}{m.quantity}
                            </td>
                            <td style={{ ...P.td(), fontFamily: 'var(--font-mono)' }}>{m.afterStock}</td>
                            <td style={{ ...P.td(), color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{m.reference || m.notes || '—'}</td>
                            <td style={{ ...P.td(), color: '#9CA3AF', fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )
      )}

      {/* ── Purchase Orders Section ─────────────────────────────────── */}
      {section === 'purchase-orders' && (
        <div>
          {purchaseOrders.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>
                <ShoppingCart size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontWeight: 600, marginBottom: 4 }}>No purchase orders yet</p>
                <p style={{ fontSize: 13 }}>Create a PO when you order from a supplier. Mark it Received to auto-update stock.</p>
              </div>
            </Card>
          ) : (
            <Card padding={0}>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ ...P.table, minWidth: isMobile ? 560 : 'unset' }}>
                <thead style={P.thead}>
                  <tr>
                    {['PO #','Supplier','Items','Total','Expected','Status',''].map(h => (
                      <th key={h} style={P.th()}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po, i) => (
                    <tr key={po.id} style={P.tr(i, purchaseOrders.length)}>
                      <td style={{ ...P.td(), fontWeight: 700, color: 'var(--navy)' }}>{po.poNumber}</td>
                      <td style={P.td()}>{po.vendor?.name || '—'}</td>
                      <td style={P.td()}>{po.items?.length || 0} {po.items?.length === 1 ? 'item' : 'items'}</td>
                      <td style={{ ...P.td(), fontWeight: 600 }}>₹{Number(po.total).toLocaleString('en-IN')}</td>
                      <td style={{ ...P.td(), color: '#6B7280' }}>{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={P.td()}>{poStatusBadge(po.status)}</td>
                      <td style={P.td()}>
                        {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                          <button onClick={() => openReceive(po)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: '1.5px solid #059669', background: '#ECFDF5', color: '#059669', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            <Truck size={12} /> Mark Received
                          </button>
                        )}
                        {po.status === 'RECEIVED' && <span style={{ color: '#059669', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={13} /> Done</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </Card>
          )}

          {/* New PO Modal */}
          <Modal open={showPOModal} onClose={() => setShowPOModal(false)} title="New Purchase Order" width={620}>
            <form onSubmit={savePO} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Supplier</label>
                  <select value={poForm.vendorId} onChange={e => setPOForm(f => ({ ...f, vendorId: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13 }}>
                    <option value="">— No supplier —</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <Input label="Expected delivery date" type="date" value={poForm.expectedDate}
                  onChange={e => setPOForm(f => ({ ...f, expectedDate: e.target.value }))} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Items *</label>
                  <button type="button" onClick={addPOItem}
                    style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add row</button>
                </div>
                {poForm.items.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.7fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <div>
                      <select value={item.productId} onChange={e => {
                        const prod = products.find(p => p.id === e.target.value);
                        setPOItem(i, 'productId', e.target.value);
                        if (prod) { setPOItem(i, 'description', prod.name); setPOItem(i, 'unitCost', prod.costPrice || ''); }
                      }} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid var(--border)', fontSize: 12 }}>
                        <option value="">— Pick product —</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <input placeholder="Description" value={item.description} onChange={e => setPOItem(i, 'description', e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: 7, border: '1.5px solid var(--border)', fontSize: 12 }} />
                    <input type="number" placeholder="Qty" min={1} value={item.quantity} onChange={e => setPOItem(i, 'quantity', e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: 7, border: '1.5px solid var(--border)', fontSize: 12 }} />
                    <input type="number" placeholder="Cost ₹" value={item.unitCost} onChange={e => setPOItem(i, 'unitCost', e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: 7, border: '1.5px solid var(--border)', fontSize: 12 }} />
                    <button type="button" onClick={() => removePOItem(i)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>

              <Input label="Notes" value={poForm.notes} onChange={e => setPOForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="ghost" type="button" onClick={() => setShowPOModal(false)}>Cancel</Button>
                <Button type="submit" loading={poSaving}>Create Purchase Order</Button>
              </div>
            </form>
          </Modal>

          {/* Receive PO Modal */}
          <Modal open={showReceiveModal} onClose={() => setShowReceiveModal(false)} title={`Receive: ${selectedPO?.poNumber}`} width={500}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: '#6B7280' }}>Enter the quantity received for each item. Stock will be updated automatically.</p>
              {receiveForm.map((r, i) => (
                <div key={r.itemId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface-1)', borderRadius: 8 }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{r.description}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginRight: 4 }}>Ordered: {r.maxQty}</div>
                  <input type="number" min={0} max={r.maxQty} value={r.receivedQty}
                    onChange={e => setReceiveForm(f => f.map((x, idx) => idx === i ? { ...x, receivedQty: e.target.value } : x))}
                    style={{ width: 72, padding: '6px 10px', borderRadius: 7, border: '1.5px solid var(--border)', fontSize: 13, textAlign: 'center' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <Button variant="ghost" onClick={() => setShowReceiveModal(false)}>Cancel</Button>
                <Button onClick={confirmReceive} loading={poSaving}>Confirm Receipt & Update Stock</Button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* ── Products Section ────────────────────────────────────────── */}
      {section === 'products' && <>

      {/* Alert chips */}
      {(expiredCount > 0 || expiringCount > 0 || (lowStock.length > 0 && expiryFilter === 'all')) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {expiredCount > 0 && (
            <button onClick={() => setExpiryFilter('expired')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: '#FEE2E2', color: 'var(--vermilion)', fontSize: 12, fontWeight: 600, border: '1px solid #FECACA', cursor: 'pointer' }}>
              <AlertCircle size={13} /> {expiredCount} expired
            </button>
          )}
          {expiringCount > 0 && (
            <button onClick={() => setExpiryFilter('expiring')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: '#FEF3C7', color: '#B45309', fontSize: 12, fontWeight: 600, border: '1px solid #FDE68A', cursor: 'pointer' }}>
              <AlertTriangle size={13} /> {expiringCount} expiring soon
            </button>
          )}
          {lowStock.length > 0 && expiryFilter === 'all' && (
            <button onClick={() => setExpiryFilter('lowstock')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: '#FEF3C7', color: '#B45309', fontSize: 12, fontWeight: 600, border: '1px solid #FDE68A', cursor: 'pointer' }}>
              <AlertTriangle size={13} /> {lowStock.length} low stock
            </button>
          )}
        </div>
      )}

      {/* Filter + Search row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
        {filterPill('all', 'All', 0, 'var(--navy)')}
        {filterPill('lowstock', '⚠ Low Stock', lowStock.length, 'var(--vermilion)')}
        {filterPill('expiring', 'Expiring ≤30d', expiringCount, 'var(--amber)')}
        {filterPill('expired', 'Expired', expiredCount, 'var(--vermilion)')}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{
            padding: '8px 12px', border: `1.5px solid ${categoryFilter ? 'var(--navy)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)', fontSize: 13, background: categoryFilter ? '#EFF6FF' : '#fff',
            color: categoryFilter ? 'var(--navy)' : '#6B7280', fontWeight: categoryFilter ? 600 : 400,
            minWidth: 180, cursor: 'pointer',
          }}
        >
          <option value="">All Categories</option>
          {catParents.map(p => (
            catChildrenOf[p.id]?.length ? (
              <optgroup key={p.id} label={`${p.icon || ''} ${p.name}`}>
                <option value={p.id}>— All {p.name}</option>
                {catChildrenOf[p.id].map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>
                ))}
              </optgroup>
            ) : (
              <option key={p.id} value={p.id}>{p.icon ? `${p.icon} ` : ''}{p.name}</option>
            )
          ))}
        </select>
        {categoryFilter && (
          <button onClick={() => setCategoryFilter('')}
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '7px 12px', cursor: 'pointer' }}>
            ✕ Clear category
          </button>
        )}
        {/* Search */}
        <div style={{ flex: 1, position: 'relative', minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU…" style={{ width: '100%', padding: '8px 40px 8px 36px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14, background: '#fff', boxSizing: 'border-box' }} />
          <button onClick={() => openScanner('search')} title="Scan barcode"
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--navy)'}
            onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
            <Camera size={16} />
          </button>
        </div>
        {/* Active filter summary */}
        {(categoryFilter || expiryFilter !== 'all') && (
          <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <Card padding={0}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>Loading products…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Package size={36} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#6B7280', fontWeight: 600 }}>
              {expiryFilter === 'lowstock' ? 'All products are well-stocked!' : categoryFilter ? 'No products in this category' : expiryFilter !== 'all' ? `No ${expiryFilter} products` : 'No products yet'}
            </p>
            {(expiryFilter !== 'all' || categoryFilter)
              ? <button onClick={() => { setExpiryFilter('all'); setCategoryFilter(''); }} style={{ marginTop: 10, fontSize: 13, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear all filters</button>
              : <div style={{ marginTop: 16 }}><Button size="sm" onClick={openAdd}><Plus size={14} />Add product</Button></div>
            }
          </div>
        ) : (
          <table style={P.table}>
            <thead style={P.thead}>
              <tr>
                {['Product', 'SKU / Batch', 'Category', 'Price', 'Stock', 'Expiry', 'Status', ''].map(h => (
                  <th key={h} style={P.th()}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const days = daysUntilExpiry(p.expiryDate);
                const expiry = expiryStatus(days);
                return (
                  <tr key={p.id} style={{ ...P.tr(i, filtered.length), background: days !== null && days < 0 ? '#FFF8F8' : undefined }}
                    onMouseEnter={e => { if (!(days !== null && days < 0)) e.currentTarget.style.background = 'var(--surface-1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = (days !== null && days < 0) ? '#FFF8F8' : ''; }}
                  >
                    <td style={P.td()}>
                      <button onClick={() => openDetail(p)} style={{ fontWeight: 600, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)', textAlign: 'left', padding: 0, textDecoration: 'underline', textDecorationColor: 'transparent', textUnderlineOffset: 2 }}
                        onMouseEnter={e => e.currentTarget.style.textDecorationColor = 'var(--navy)'}
                        onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'transparent'}>
                        {p.name}
                      </button>
                      {p.description && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{p.description}</div>}
                    </td>
                    <td style={P.td()}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280' }}>{p.sku || '—'}</div>
                      {p.batchNumber && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Batch: {p.batchNumber}</div>}
                    </td>
                    <td style={P.td()}>
                      {p.category ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.category.name}</div>
                          {p.category.code && <div style={{ fontSize: 10, fontWeight: 700, color: p.category.color || '#9CA3AF', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{p.category.code}</div>}
                        </div>
                      ) : <span style={{ color: '#D1D5DB' }}>—</span>}
                    </td>
                    <td style={{ ...P.td(), fontWeight: 600, fontFamily: 'var(--font-mono)' }}>₹{Number(p.sellingPrice).toLocaleString('en-IN')}</td>
                    <td style={{ ...P.td(), fontFamily: 'var(--font-mono)', color: p.stock <= p.lowStockAlert ? 'var(--vermilion)' : 'inherit' }}>{p.stock} {p.unit}</td>
                    <td style={P.td()}>
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
                    <td style={P.td()}>
                      <Badge color={p.stock === 0 ? 'red' : p.stock <= p.lowStockAlert ? 'amber' : 'green'}>
                        {p.stock === 0 ? 'Out of stock' : p.stock <= p.lowStockAlert ? 'Low stock' : 'In stock'}
                      </Badge>
                    </td>
                    <td style={P.td()}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap' }}>
                        <button onClick={() => openStock(p)} title="Adjust stock"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid #D1FAE5', borderRadius: 6, background: '#ECFDF5', color: '#059669', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          <ArrowUpDown size={12} /> Stock
                        </button>
                        <button onClick={() => openEdit(p)} title="Edit"
                          style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => remove(p.id)} title="Delete"
                          style={{ padding: '5px 8px', border: '1px solid #FCA5A5', borderRadius: 6, background: '#FEF2F2', cursor: 'pointer' }}>
                          <Trash2 size={13} color="var(--vermilion)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        </div>
        {pagination && expiryFilter === 'all' && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
            label="products"
          />
        )}
      </Card>

      </>}

      {/* Add/Edit Product Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit product' : 'Add product'} width={560}>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Product name *" value={form.name} onChange={set('name')} placeholder="e.g. Tata Salt 1kg" />
          {/* GST auto-suggestion */}
          {(() => {
            if (!form.name || form.taxRateId) return null;
            const catName = categories.find(c => c.id === form.categoryId)?.name || '';
            const hint = suggestGst(form.name, catName);
            if (!hint) return null;
            const matchedRate = taxRates.find(t => t.rate === hint.rate);
            if (!matchedRate) return null;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <Lightbulb size={14} color="#2563EB" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#1D4ED8', flex: 1 }}>
                  GST suggestion: <strong>HSN {hint.hsn} @ {hint.rate}%</strong>
                </span>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, taxRateId: matchedRate.id, hsnCode: hint.hsn }))}
                  style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Apply
                </button>
              </div>
            );
          })()}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>SKU / Barcode</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={form.sku} onChange={set('sku')} placeholder="SKU001"
                  style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14 }} />
                <button type="button" onClick={() => openScanner('sku')} title="Scan barcode to fill SKU"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', background: '#fff', cursor: 'pointer', color: '#6B7280', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--navy)'; e.currentTarget.style.color = 'var(--navy)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = '#6B7280'; }}>
                  <Camera size={14} /> Scan
                </button>
              </div>
            </div>
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

          {(() => {
            const { parents, childrenOf } = buildCategoryTree(categories);
            const selCat = categories.find(c => c.id === form.categoryId);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Category *</label>
                  {selCat?.code && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: (selCat.color || '#64748B') + '18', color: selCat.color || '#64748B', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>
                      {selCat.code}
                    </span>
                  )}
                </div>
                <select value={form.categoryId} onChange={set('categoryId')} required
                  style={{ padding: '9px 12px', border: `1.5px solid ${form.categoryId ? 'var(--border)' : '#FCA5A5'}`, borderRadius: 'var(--radius-md)', fontSize: 14 }}>
                  <option value="">— Select a category —</option>
                  {parents.map(p => (
                    childrenOf[p.id]?.length ? (
                      <optgroup key={p.id} label={`${p.icon || ''} ${p.name}${p.code ? ` [${p.code}]` : ''}`}>
                        {childrenOf[p.id].map(c => (
                          <option key={c.id} value={c.id}>{c.name}{c.code ? ` — ${c.code}` : ''}</option>
                        ))}
                      </optgroup>
                    ) : (
                      <option key={p.id} value={p.id}>{p.icon ? `${p.icon} ` : ''}{p.name}{p.code ? ` — ${p.code}` : ''}</option>
                    )
                  ))}
                </select>
              </div>
            );
          })()}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>GST rate</label>
              <select value={form.taxRateId} onChange={set('taxRateId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14 }}>
                <option value="">No GST</option>
                {taxRates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
              </select>
            </div>
            <Input label="HSN / SAC code" value={form.hsnCode} onChange={set('hsnCode')} placeholder="e.g. 8517" />
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
      <Modal open={showCatModal} onClose={() => setShowCatModal(false)} title="Category Management" width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Syllabrix taxonomy status */}
          {(() => {
            const { parents } = buildCategoryTree(categories);
            const stdParents = parents.filter(c => c.isStandard);
            const totalStd = 14; // 14 super-categories in taxonomy
            const seeded = stdParents.length;
            return (
              <div style={{ background: seeded >= totalStd ? '#F0FDF4' : '#FFF7ED', border: `1px solid ${seeded >= totalStd ? '#BBF7D0' : '#FED7AA'}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: seeded >= totalStd ? '#059669' : '#F97316', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Star size={14} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: seeded >= totalStd ? '#065F46' : '#92400E', marginBottom: 2 }}>
                    Syllabrix Standard Taxonomy — {seeded}/{totalStd} super-categories seeded
                  </p>
                  <p style={{ fontSize: 12, color: seeded >= totalStd ? '#047857' : '#B45309', marginBottom: seeded < totalStd ? 8 : 0 }}>
                    {seeded >= totalStd ? '14 super-categories + 78 sub-categories active across Electronics, Food, Health, Tobacco, Liquor and more.' : 'Seed the full 14-super / 78-sub standard taxonomy. All categories get unique codes (ELEC, FOOD-GRN, TBCO-CIG, etc.) for tally reports.'}
                  </p>
                  {seeded < totalStd && (
                    <button type="button" onClick={importStdCategories} disabled={saving}
                      style={{ padding: '6px 14px', background: '#F97316', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {saving ? 'Seeding…' : 'Seed Syllabrix Standard Categories'}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Duplicate warning */}
          {(() => {
            const { parents } = buildCategoryTree(categories);
            const nameCount = {};
            for (const c of categories) {
              const k = c.name.trim().toLowerCase();
              nameCount[k] = (nameCount[k] || 0) + 1;
            }
            const hasDupes = Object.values(nameCount).some(n => n > 1);
            if (!hasDupes) return null;
            const dupeCount = Object.values(nameCount).filter(n => n > 1).length;
            const handleDedup = async () => {
              setSaving(true);
              try {
                const { data } = await deduplicateCategories();
                toast.success(`Merged ${data.data.merged} duplicate categor${data.data.merged === 1 ? 'y' : 'ies'}`);
                load();
              } catch { toast.error('Failed to merge duplicates'); }
              finally { setSaving(false); }
            };
            return (
              <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 1 }}>{dupeCount} duplicate category name{dupeCount > 1 ? 's' : ''} detected</p>
                  <p style={{ fontSize: 11, color: '#DC2626' }}>Products will be reassigned to the surviving category automatically.</p>
                </div>
                <button type="button" onClick={handleDedup} disabled={saving}
                  style={{ padding: '5px 12px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {saving ? 'Merging…' : 'Fix Duplicates'}
                </button>
              </div>
            );
          })()}

          {/* Add custom category */}
          <form onSubmit={saveCat} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input label="Add custom category" value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Seasonal Specials" />
            </div>
            <Button type="submit" loading={saving} size="sm">Add</Button>
          </form>

          {/* Category tree */}
          {categories.length > 0 && (
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                All categories ({categories.length})
              </p>
              {(() => {
                const { parents, childrenOf } = buildCategoryTree(categories);
                return parents.map(p => (
                  <div key={p.id} style={{ marginBottom: 6 }}>
                    {/* Parent row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: p.color ? `${p.color}0D` : 'var(--surface-1)', border: `1px solid ${p.color ? p.color + '33' : 'var(--border)'}` }}>
                      {p.icon && <span style={{ fontSize: 16 }}>{p.icon}</span>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</span>
                          {p.code && <span style={{ fontSize: 10, fontWeight: 800, color: p.color || '#64748B', background: (p.color || '#64748B') + '20', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{p.code}</span>}
                          {p.isStandard && <span style={{ fontSize: 9, color: '#059669', fontWeight: 700 }}>SYLLABRIX</span>}
                        </div>
                        {childrenOf[p.id]?.length > 0 && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{childrenOf[p.id].length} subcategories</span>}
                      </div>
                      {!p.isStandard && (
                        <button type="button" onClick={() => deleteCat(p)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, lineHeight: 1 }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--vermilion)'}
                          onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>×</button>
                      )}
                    </div>
                    {/* Children */}
                    {childrenOf[p.id]?.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 6px 34px', borderLeft: `2px solid ${p.color || 'var(--border)'}44`, marginLeft: 18, marginTop: 2 }}>
                        <span style={{ flex: 1, fontSize: 12, color: '#374151' }}>{c.name}</span>
                        {c.code && <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>{c.code}</span>}
                        {!c.isStandard && (
                          <button type="button" onClick={() => deleteCat(c)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: 14, lineHeight: 1 }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--vermilion)'}
                            onMouseLeave={e => e.currentTarget.style.color = '#D1D5DB'}>×</button>
                        )}
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowCatModal(false)} type="button">Close</Button>
          </div>
        </div>
      </Modal>

      {/* ── Product Detail Modal ──────────────────────────────────────── */}
      <Modal open={showDetailModal} onClose={() => setShowDetailModal(false)} title={detailProduct?.name || 'Product Detail'} width={580}>
        {detailProduct && (() => {
          const days = daysUntilExpiry(detailProduct.expiryDate);
          const expiry = expiryStatus(days);
          const stockValue = detailProduct.stock * (detailProduct.costPrice || detailProduct.sellingPrice || 0);
          const isLow = detailProduct.stock <= detailProduct.lowStockAlert;
          const isOut = detailProduct.stock === 0;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Stock KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Current Stock', value: `${detailProduct.stock} ${detailProduct.unit}`, color: isOut ? 'var(--vermilion)' : isLow ? 'var(--amber)' : 'var(--navy)', sub: isLow ? `Alert at ${detailProduct.lowStockAlert}` : null },
                  { label: 'Selling Price', value: `₹${Number(detailProduct.sellingPrice).toLocaleString('en-IN')}`, color: 'var(--ink)', sub: detailProduct.costPrice ? `Cost ₹${Number(detailProduct.costPrice).toLocaleString('en-IN')}` : null },
                  { label: 'Stock Value', value: `₹${stockValue.toLocaleString('en-IN')}`, color: 'var(--cyan)', sub: 'at cost price' },
                ].map(({ label, value, color, sub }) => (
                  <div key={label} style={{ background: 'var(--surface-1)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{value}</p>
                    {sub && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</p>}
                  </div>
                ))}
              </div>

              {/* Meta info */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
                {detailProduct.sku && <span style={{ background: '#F3F4F6', color: '#374151', padding: '3px 10px', borderRadius: 8, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>SKU: {detailProduct.sku}</span>}
                {detailProduct.batchNumber && <span style={{ background: '#F3F4F6', color: '#374151', padding: '3px 10px', borderRadius: 8, fontFamily: 'var(--font-mono)' }}>Batch: {detailProduct.batchNumber}</span>}
                {detailProduct.hsnCode && <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '3px 10px', borderRadius: 8, fontFamily: 'var(--font-mono)' }}>HSN: {detailProduct.hsnCode}</span>}
                {detailProduct.category && <span style={{ background: (detailProduct.category.color || '#64748B') + '18', color: detailProduct.category.color || '#64748B', padding: '3px 10px', borderRadius: 8, fontWeight: 600 }}>{detailProduct.category.name}{detailProduct.category.code ? ` · ${detailProduct.category.code}` : ''}</span>}
                {expiry && <span style={{ background: expiry.bg, color: expiry.text, padding: '3px 10px', borderRadius: 8, fontWeight: 600 }}>{expiry.label}</span>}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openStock(detailProduct)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <ArrowUpDown size={14} /> Adjust Stock
                </button>
                <button onClick={() => { setShowDetailModal(false); openEdit(detailProduct); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', color: 'var(--navy)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <Edit2 size={14} /> Edit Product
                </button>
              </div>

              {/* Stock History */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Activity size={14} color="var(--navy)" />
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Stock Movement History</h4>
                  {detailMovements.length > 0 && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF' }}>{detailMovements.length} entries</span>}
                </div>
                {detailMovementsLoading ? (
                  <div style={{ padding: '28px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading history…</div>
                ) : detailMovements.length === 0 ? (
                  <div style={{ padding: '28px 0', textAlign: 'center', background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <Activity size={26} style={{ color: '#D1D5DB', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>No stock movements yet</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Click "Adjust Stock" above to record the first movement.</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
                    {detailMovements.map((m, i) => {
                      const isAdd = ['PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(m.type);
                      const typeColor = { PURCHASE: '#059669', RETURN: '#2563EB', ADJUSTMENT: '#7C3AED', DAMAGE: '#DC2626', SALE: '#D97706' }[m.type] || '#6B7280';
                      return (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? '#fff' : 'var(--surface-1)' }}>
                          <span style={{ width: 34, height: 34, borderRadius: 8, background: typeColor + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 900, color: typeColor }}>{isAdd ? '+' : '−'}</span>
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: typeColor, background: typeColor + '15', padding: '1px 7px', borderRadius: 6 }}>{m.type}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: isAdd ? '#059669' : '#DC2626', fontFamily: 'var(--font-mono)' }}>{isAdd ? '+' : '−'}{m.quantity} {detailProduct.unit}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                              {m.beforeStock} → <b style={{ color: 'var(--ink)' }}>{m.afterStock}</b> {detailProduct.unit}
                              {m.notes && <span style={{ marginLeft: 8, fontStyle: 'italic' }}>"{m.notes}"</span>}
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right', flexShrink: 0 }}>
                            {new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            <div>{new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          );
        })()}
      </Modal>

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

    </div>
  );
}

// ── DemandRow sub-component ───────────────────────────────────────────────────
function DemandRow({ item, rank, type }) {
  const isRising = type === 'rising';
  const pct = item.changePercent;
  const absChange = Math.abs(pct);

  // Bar width: cap at 100%, map 0–200% range to 0–100px for very large swings
  const barW = Math.min(absChange, 200) / 2;

  const accent = isRising ? '#059669' : '#DC2626';
  const accentBg = isRising ? '#F0FDF4' : '#FEF2F2';

  return (
    <div style={{ padding: '10px 0', borderTop: rank > 1 ? '1px solid var(--border)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: rank <= 3 ? accent : '#9CA3AF', width: 18, textAlign: 'center', paddingTop: 2 }}>#{rank}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
              {item.product?.name || '—'}
            </span>
            {item.isNew && (
              <span style={{ fontSize: 10, fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', borderRadius: 6, padding: '1px 6px', flexShrink: 0 }}>NEW</span>
            )}
            <span style={{ marginLeft: 'auto', flexShrink: 0, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 800, background: accentBg, color: accent }}>
              {isRising ? '▲' : '▼'} {item.isNew ? 'New entry' : `${absChange}%`}
            </span>
          </div>
          {/* Change bar */}
          <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6', marginBottom: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${barW}%`, background: accent, borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#9CA3AF' }}>
            <span>Now: <b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>₹{Number(item.currentRevenue).toLocaleString('en-IN')}</b> ({item.currentQty} units)</span>
            <span>Prev: <b style={{ fontFamily: 'var(--font-mono)' }}>₹{Number(item.previousRevenue).toLocaleString('en-IN')}</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}
