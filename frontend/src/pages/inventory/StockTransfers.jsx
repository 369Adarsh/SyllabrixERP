import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  getStockTransfers, createStockTransfer, approveStockTransfer,
  markTransferInTransit, receiveStockTransfer, cancelStockTransfer,
  getSurplusSuggestion, getProducts, getBranches,
} from '../../api';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight, Plus, Search, AlertTriangle, CheckCircle2,
  Truck, XCircle, Clock, Zap, Package, ChevronDown, ChevronUp, X, Lightbulb,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS = {
  REQUESTED:  { label: 'Requested',  bg: '#EFF6FF', color: '#1D4ED8', icon: Clock },
  APPROVED:   { label: 'Approved',   bg: '#DCFCE7', color: '#15803D', icon: CheckCircle2 },
  IN_TRANSIT: { label: 'In Transit', bg: '#FEF9C3', color: '#92400E', icon: Truck },
  RECEIVED:   { label: 'Received',   bg: '#F0FDF4', color: '#166534', icon: CheckCircle2 },
  CANCELLED:  { label: 'Cancelled',  bg: '#F3F4F6', color: '#9CA3AF', icon: XCircle },
};

const FILTER_TABS = [
  { key: 'ALL',        label: 'All' },
  { key: 'REQUESTED',  label: 'Requested' },
  { key: 'APPROVED',   label: 'Approved' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'RECEIVED',   label: 'Received' },
  { key: 'CANCELLED',  label: 'Cancelled' },
];

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.REQUESTED;
  const Icon = cfg.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

function TransferCard({ transfer, onAction, isOwner, userBranchId }) {
  const [expanded, setExpanded] = useState(false);
  const [acting, setActing] = useState(false);

  const act = async (fn, label) => {
    setActing(true);
    try { await fn(); toast.success(label); }
    catch (e) { toast.error(e.response?.data?.message || 'Action failed'); }
    finally { setActing(false); }
    onAction();
  };

  const isFromManager = userBranchId === transfer.fromBranch?.id;
  const isToManager   = userBranchId === transfer.toBranch?.id;

  // Owner has full control; managers have role-specific actions
  const canApprove   = isOwner && transfer.status === 'REQUESTED';
  const canInTransit = isOwner && transfer.status === 'APPROVED';
  const canReceive   = (isOwner || isToManager) && ['APPROVED', 'IN_TRANSIT'].includes(transfer.status);
  const canCancel    = (isOwner || isFromManager) && ['REQUESTED', 'APPROVED'].includes(transfer.status);
  const showActions  = canApprove || canInTransit || canReceive || canCancel;

  return (
    <div style={{ background: '#fff', border: `1.5px solid ${transfer.isEmergency ? '#FCA5A5' : 'var(--border)'}`, borderRadius: 14, padding: '16px 18px', transition: 'box-shadow 0.15s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
              {transfer.transferNumber}
            </span>
            {transfer.isEmergency && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#FEE2E2', color: '#DC2626' }}>
                <Zap size={10} /> Emergency
              </span>
            )}
            <StatusBadge status={transfer.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{transfer.fromBranch?.name}</span>
            <ArrowLeftRight size={12} color="#9CA3AF" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{transfer.toBranch?.name}</span>
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            {transfer.items?.length || 0} item{transfer.items?.length !== 1 ? 's' : ''}
            {' · '}
            {new Date(transfer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background: '#F3F4F6', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Hide' : 'Details'}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 8 }}>ITEMS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {transfer.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: '#F9FAFB', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{item.product?.name || item.productId}</div>
                  {item.product?.unit && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.product.unit}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Qty: {item.quantity}</div>
                  {item.unitCost > 0 && <div style={{ fontSize: 11, color: '#9CA3AF' }}>₹{item.unitCost}/unit</div>}
                </div>
              </div>
            ))}
          </div>
          {transfer.notes && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: '#FFFBEB', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
              <strong>Notes:</strong> {transfer.notes}
            </div>
          )}
          {showActions && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {canApprove && (
                <button onClick={() => act(() => approveStockTransfer(transfer.id), 'Transfer approved')} disabled={acting}
                  style={{ padding: '8px 14px', borderRadius: 8, background: '#DCFCE7', color: '#15803D', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  Approve
                </button>
              )}
              {canInTransit && (
                <button onClick={() => act(() => markTransferInTransit(transfer.id), 'Marked in transit')} disabled={acting}
                  style={{ padding: '8px 14px', borderRadius: 8, background: '#FEF9C3', color: '#92400E', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  Mark In Transit
                </button>
              )}
              {canReceive && (
                <button onClick={() => act(() => receiveStockTransfer(transfer.id), 'Transfer received — stock updated')} disabled={acting}
                  style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  Receive & Update Stock
                </button>
              )}
              {canCancel && (
                <button onClick={() => act(() => cancelStockTransfer(transfer.id), 'Transfer cancelled')} disabled={acting}
                  style={{ padding: '8px 14px', borderRadius: 8, background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewTransferModal({ branches, onClose, onCreated, userBranchId, isOwner }) {
  const [form, setForm] = useState({ fromBranchId: userBranchId || '', toBranchId: '', notes: '', isEmergency: false });
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [prodSearch, setProdSearch] = useState('');
  const [selectedProd, setSelectedProd] = useState(null);
  const [itemQty, setItemQty] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProducts({ limit: 500 }).then(r => setProducts(r.data.data || [])).catch(() => {});
  }, []);

  const filteredProds = useMemo(() =>
    products.filter(p => !prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.sku?.toLowerCase().includes(prodSearch.toLowerCase())),
    [products, prodSearch]
  );

  const fetchSuggestion = useCallback(async (prod, qty) => {
    if (!prod || !qty || !form.toBranchId) return;
    try {
      const r = await getSurplusSuggestion(prod.id, Number(qty));
      setSuggestion(r.data.data || r.data || []);
    } catch { setSuggestion(null); }
  }, [form.toBranchId]);

  const handleAddItem = () => {
    if (!selectedProd || !itemQty || Number(itemQty) <= 0) return toast.error('Select a product and enter quantity');
    if (items.find(i => i.productId === selectedProd.id)) return toast.error('Product already added');
    setItems(prev => [...prev, { productId: selectedProd.id, productName: selectedProd.name, unit: selectedProd.unit, quantity: Number(itemQty), unitCost: Number(itemCost) || 0 }]);
    setSelectedProd(null); setProdSearch(''); setItemQty(''); setItemCost(''); setSuggestion(null);
  };

  const handleSubmit = async () => {
    if (!form.fromBranchId || !form.toBranchId) return toast.error('Select both branches');
    if (form.fromBranchId === form.toBranchId) return toast.error('From and To must be different branches');
    if (items.length === 0) return toast.error('Add at least one item');
    setLoading(true);
    try {
      await createStockTransfer({ ...form, items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost })) });
      toast.success('Transfer request created');
      onCreated();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create transfer');
    } finally { setLoading(false); }
  };

  const sel = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 16 }}>New Stock Transfer</h3>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: 7, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Branches */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                From Branch * {!isOwner && <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>(your branch)</span>}
              </label>
              <select value={form.fromBranchId} onChange={sel('fromBranchId')} disabled={!isOwner}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', background: isOwner ? '#fff' : '#F9FAFB', cursor: isOwner ? 'default' : 'not-allowed', color: '#374151' }}>
                <option value="">Select…</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>To Branch *</label>
              <select value={form.toBranchId} onChange={sel('toBranchId')} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', background: '#fff' }}>
                <option value="">Select…</option>
                {branches.filter(b => b.id !== form.fromBranchId).map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
            </div>
          </div>

          {/* Emergency toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', userSelect: 'none' }}>
            <div
              onClick={() => setForm(p => ({ ...p, isEmergency: !p.isEmergency }))}
              style={{ width: 36, height: 20, borderRadius: 10, background: form.isEmergency ? '#DC2626' : '#D1D5DB', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', top: 2, left: form.isEmergency ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: form.isEmergency ? '#DC2626' : '#374151' }}>
              <Zap size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Emergency transfer
            </span>
          </label>

          {/* Product selector */}
          <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>ADD ITEMS</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <div style={{ position: 'relative', flex: '2 1 160px' }}>
                <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  placeholder="Search product…"
                  value={selectedProd ? selectedProd.name : prodSearch}
                  onChange={e => { setProdSearch(e.target.value); setSelectedProd(null); setSuggestion(null); }}
                  style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 8, paddingBottom: 8, borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                />
                {prodSearch && !selectedProd && filteredProds.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, zIndex: 10, maxHeight: 160, overflowY: 'auto', marginTop: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                    {filteredProds.slice(0, 20).map(p => (
                      <div key={p.id} onClick={() => { setSelectedProd(p); setProdSearch(''); fetchSuggestion(p, itemQty); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #F3F4F6' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                        {p.sku && <span style={{ marginLeft: 6, fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>{p.sku}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number" placeholder="Qty" value={itemQty} min="1"
                onChange={e => { setItemQty(e.target.value); fetchSuggestion(selectedProd, e.target.value); }}
                style={{ flex: '1 1 70px', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', width: 80 }}
              />
              <input
                type="number" placeholder="Cost/unit" value={itemCost} min="0"
                onChange={e => setItemCost(e.target.value)}
                style={{ flex: '1 1 90px', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', width: 90 }}
              />
              <button onClick={handleAddItem} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Plus size={13} /> Add
              </button>
            </div>

            {/* Surplus suggestion */}
            {suggestion && suggestion.length > 0 && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, fontWeight: 700, color: '#92400E' }}>
                  <Lightbulb size={12} /> Surplus available at:
                </div>
                {suggestion.slice(0, 3).map(s => (
                  <div key={s.branchId} style={{ color: '#78350F', marginBottom: 2 }}>
                    <strong>{s.branchName}</strong> — {s.available} units available ({s.surplus} surplus)
                    {s.canFulfill && <span style={{ marginLeft: 6, color: '#059669', fontWeight: 700 }}>✓ Can fulfill</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Items list */}
            {items.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <Package size={13} color="#9CA3AF" />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{item.productName}</span>
                      {item.unit && <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 5 }}>{item.unit}</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>×{item.quantity}</span>
                    {item.unitCost > 0 && <span style={{ fontSize: 12, color: '#9CA3AF' }}>₹{item.unitCost}</span>}
                    <button onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex', padding: 2 }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Notes (optional)</label>
            <textarea
              value={form.notes} onChange={sel('notes')} rows={2} placeholder="Reason for transfer, special instructions…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button onClick={handleSubmit} disabled={loading}
              style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating…' : 'Create Transfer Request'}
            </button>
            <button onClick={onClose} style={{ padding: '11px 20px', borderRadius: 10, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockTransfers() {
  const { isMobile } = useBreakpoint();
  const { hasBranches, branches } = useBranch();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const isOwner = user?.role === 'OWNER';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const r = await getStockTransfers(params);
      setTransfers(r.data.data || r.data || []);
    } catch { toast.error('Failed to load transfers'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search) return transfers;
    const q = search.toLowerCase();
    return transfers.filter(t =>
      t.transferNumber?.toLowerCase().includes(q) ||
      t.fromBranch?.name?.toLowerCase().includes(q) ||
      t.toBranch?.name?.toLowerCase().includes(q)
    );
  }, [transfers, search]);

  if (!hasBranches) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <ArrowLeftRight size={40} color="#D1D5DB" style={{ margin: '0 auto 12px', display: 'block' }} />
        <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>No branches configured</div>
        <div style={{ color: '#9CA3AF', fontSize: 13 }}>Set up branches in Settings to use stock transfers.</div>
      </div>
    );
  }

  return (
    <div style={P.wrap(isMobile)}>
      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Stock Transfers</h1>
          <p style={P.sub}>Move inventory between branches</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/stock-network')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            Network Health
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            <Plus size={14} /> {isOwner ? 'New Transfer' : 'Request Transfer'}
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
        {FILTER_TABS.map(tab => (
          <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '7px 14px', borderRadius: 20, border: '1.5px solid', whiteSpace: 'nowrap', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              borderColor: statusFilter === tab.key ? 'var(--navy)' : 'var(--border)',
              background: statusFilter === tab.key ? 'var(--navy)' : '#fff',
              color: statusFilter === tab.key ? '#fff' : '#6B7280',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 320 }}>
        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input
          placeholder="Search by number or branch…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={P.searchInput}
        />
      </div>

      {/* Transfer list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF', fontSize: 14 }}>Loading transfers…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <ArrowLeftRight size={36} color="#D1D5DB" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={{ color: '#6B7280', fontSize: 14, marginBottom: 4 }}>No transfers found</div>
          {isOwner && statusFilter === 'ALL' && !search && (
            <button onClick={() => setShowModal(true)} style={{ marginTop: 12, padding: '9px 18px', borderRadius: 9, background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Create First Transfer
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(t => (
            <TransferCard key={t.id} transfer={t} onAction={load} isOwner={isOwner} userBranchId={user?.branchId} />
          ))}
        </div>
      )}

      {showModal && (
        <NewTransferModal
          branches={branches}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(); }}
          userBranchId={user?.branchId}
          isOwner={isOwner}
        />
      )}
    </div>
  );
}
