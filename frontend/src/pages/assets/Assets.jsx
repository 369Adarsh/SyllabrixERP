import { useState, useEffect, useCallback } from 'react';
import {
  getAssetSummary, getAssetCategories, createAssetCategory,
  getAssets, getAsset, createAsset, updateAsset, disposeAsset, deleteAsset,
  logAssetMaintenance,
} from '../../api';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, X, Search, Filter, Wrench, BarChart2,
  Package2, AlertTriangle, CheckCircle, TrendingDown, Eye, ChevronDown, ChevronRight,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUSES = { ACTIVE: { label: 'Active', color: '#16A34A', bg: '#F0FDF4' }, UNDER_MAINTENANCE: { label: 'Maintenance', color: '#D97706', bg: '#FFFBEB' }, DISPOSED: { label: 'Disposed', color: '#6B7280', bg: '#F3F4F6' }, LOST: { label: 'Lost', color: '#DC2626', bg: '#FEF2F2' }, RETIRED: { label: 'Retired', color: '#7C3AED', bg: '#F5F3FF' } };
const MAINT_TYPES = ['SCHEDULED', 'REPAIR', 'INSPECTION', 'UPGRADE'];
const DEFAULT_CATEGORIES = [
  { name: 'Computer & IT', wdvRate: 40 }, { name: 'Vehicles', wdvRate: 15 },
  { name: 'Plant & Machinery', wdvRate: 15 }, { name: 'Furniture & Fixtures', wdvRate: 10 },
  { name: 'Buildings', wdvRate: 10 }, { name: 'Electrical Equipment', wdvRate: 15 },
  { name: 'Office Equipment', wdvRate: 15 }, { name: 'Tools', wdvRate: 15 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : 0;

// ── Styles ────────────────────────────────────────────────────────────────────
const CARD = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' };
const INPUT_S = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' };
const BTN = (v = 'primary') => ({ padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: v === 'primary' ? 'var(--navy)' : v === 'danger' ? '#FEE2E2' : '#F3F4F6', color: v === 'primary' ? '#fff' : v === 'danger' ? '#DC2626' : '#374151' });

function Badge({ status }) {
  const s = STATUSES[status] || STATUSES.ACTIVE;
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>;
}

function Modal({ title, onClose, wide, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: wide ? 720 : 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Asset Form ────────────────────────────────────────────────────────────────
function AssetForm({ asset, categories, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    name: asset?.name || '', assetCode: asset?.assetCode || '', categoryId: asset?.categoryId || '',
    description: asset?.description || '', serialNumber: asset?.serialNumber || '',
    location: asset?.location || '', assignedTo: asset?.assignedTo || '', vendor: asset?.vendor || '',
    purchaseDate: asset?.purchaseDate ? asset.purchaseDate.slice(0, 10) : today,
    purchasePrice: asset?.purchasePrice || '', salvageValue: asset?.salvageValue || 0,
    usefulLifeYears: asset?.usefulLifeYears || 5, depreciationMethod: asset?.depreciationMethod || 'SLM',
    warrantyExpiry: asset?.warrantyExpiry ? asset.warrantyExpiry.slice(0, 10) : '',
    notes: asset?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.purchaseDate || !form.purchasePrice) return toast.error('Name, purchase date and price are required');
    setSaving(true);
    try {
      if (asset) { await updateAsset(asset.id, form); toast.success('Asset updated'); }
      else { await createAsset(form); toast.success('Asset added to register'); }
      onSave();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const F = (label, content, half) => (
    <div style={{ marginBottom: 14, ...(half ? {} : {}) }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
      {content}
    </div>
  );

  return (
    <Modal title={asset ? 'Edit Asset' : 'Add Asset'} onClose={onClose} wide>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <div style={{ gridColumn: '1/-1' }}>{F('Asset Name *', <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Dell Laptop - Core i7" style={INPUT_S} />)}</div>
        {F('Asset Code', <input value={form.assetCode} onChange={e => set('assetCode', e.target.value)} placeholder="COMP-001" style={INPUT_S} />)}
        {F('Category', (
          <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} style={INPUT_S}>
            <option value="">— No Category —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ))}
        {F('Purchase Date *', <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} style={INPUT_S} />)}
        {F('Purchase Price (₹) *', <input type="number" value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} placeholder="0" style={INPUT_S} />)}
        {F('Salvage Value (₹)', <input type="number" value={form.salvageValue} onChange={e => set('salvageValue', e.target.value)} placeholder="0" style={INPUT_S} />)}
        {F('Useful Life (Years)', <input type="number" value={form.usefulLifeYears} onChange={e => set('usefulLifeYears', e.target.value)} min="1" max="50" style={INPUT_S} />)}
        {F('Depreciation Method', (
          <select value={form.depreciationMethod} onChange={e => set('depreciationMethod', e.target.value)} style={INPUT_S}>
            <option value="SLM">SLM — Straight Line Method</option>
            <option value="WDV">WDV — Written Down Value (IT Act)</option>
          </select>
        ))}
        {F('Serial Number', <input value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} placeholder="SN-XXXXX" style={INPUT_S} />)}
        {F('Vendor / Supplier', <input value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="Dell India" style={INPUT_S} />)}
        {F('Location', <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Head Office — Floor 2" style={INPUT_S} />)}
        {F('Assigned To', <input value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} placeholder="Rahul Sharma" style={INPUT_S} />)}
        {F('Warranty Expiry', <input type="date" value={form.warrantyExpiry} onChange={e => set('warrantyExpiry', e.target.value)} style={INPUT_S} />)}
        <div style={{ gridColumn: '1/-1' }}>{F('Description / Notes', <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...INPUT_S, resize: 'vertical' }} />)}</div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onClose} style={BTN('secondary')}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={BTN()}>{saving ? 'Saving…' : asset ? 'Update Asset' : 'Add Asset'}</button>
      </div>
    </Modal>
  );
}

// ── Maintenance Log Modal ─────────────────────────────────────────────────────
function MaintenanceModal({ assetId, assetName, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ type: 'SCHEDULED', description: '', cost: '', performedBy: '', performedAt: today, nextDueDate: '', notes: '', setStatus: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.description) return toast.error('Description is required');
    setSaving(true);
    try {
      await logAssetMaintenance(assetId, form);
      toast.success('Maintenance logged');
      onSave();
    } catch { toast.error('Failed to log maintenance'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={`Log Maintenance — ${assetName}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)} style={INPUT_S}>
            {MAINT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Description *</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What was done?" rows={2} style={{ ...INPUT_S, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Cost (₹)</label>
            <input type="number" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="0" style={INPUT_S} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Date</label>
            <input type="date" value={form.performedAt} onChange={e => set('performedAt', e.target.value)} style={INPUT_S} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Performed By</label>
            <input value={form.performedBy} onChange={e => set('performedBy', e.target.value)} placeholder="Technician name" style={INPUT_S} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Next Due Date</label>
            <input type="date" value={form.nextDueDate} onChange={e => set('nextDueDate', e.target.value)} style={INPUT_S} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Update Asset Status (optional)</label>
          <select value={form.setStatus} onChange={e => set('setStatus', e.target.value)} style={INPUT_S}>
            <option value="">— Keep current status —</option>
            <option value="ACTIVE">Mark as Active</option>
            <option value="UNDER_MAINTENANCE">Mark as Under Maintenance</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...INPUT_S, resize: 'vertical' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
        <button onClick={onClose} style={BTN('secondary')}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={BTN()}>{saving ? 'Saving…' : 'Log Maintenance'}</button>
      </div>
    </Modal>
  );
}

// ── Dispose Modal ─────────────────────────────────────────────────────────────
function DisposeModal({ asset, onClose, onSave }) {
  const [form, setForm] = useState({ disposalPrice: '', disposalReason: '' });
  const [saving, setSaving] = useState(false);

  const handleDispose = async () => {
    if (!window.confirm(`Dispose of "${asset.name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await disposeAsset(asset.id, form);
      toast.success('Asset disposed');
      onSave();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Dispose Asset" onClose={onClose}>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Recording disposal of <strong>{asset.name}</strong>. Current book value: <strong style={{ color: '#DC2626' }}>{fmt(asset.currentValue)}</strong></p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Sale/Disposal Price (₹)</label>
          <input type="number" value={form.disposalPrice} onChange={e => setForm(f => ({ ...f, disposalPrice: e.target.value }))} placeholder="0 if scrapped" style={INPUT_S} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Reason for Disposal</label>
          <textarea value={form.disposalReason} onChange={e => setForm(f => ({ ...f, disposalReason: e.target.value }))} rows={2} placeholder="End of life, sold, damaged beyond repair…" style={{ ...INPUT_S, resize: 'vertical' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
        <button onClick={onClose} style={BTN('secondary')}>Cancel</button>
        <button onClick={handleDispose} disabled={saving} style={{ ...BTN('danger'), background: '#DC2626', color: '#fff' }}>{saving ? 'Processing…' : 'Confirm Disposal'}</button>
      </div>
    </Modal>
  );
}

// ── Asset Detail Panel ────────────────────────────────────────────────────────
function AssetDetail({ assetId, onClose, onEdit, onMaintenance, onDispose }) {
  const [asset, setAsset] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    getAsset(assetId).then(r => setAsset(r.data.data)).catch(() => toast.error('Failed to load asset'));
  }, [assetId]);

  if (!asset) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, color: '#9CA3AF', fontSize: 14 }}>Loading…</div>
    </div>
  );

  const depPct = pct(asset.totalDepreciation, asset.purchasePrice);
  const warrantyOk = asset.warrantyExpiry && new Date(asset.warrantyExpiry) > new Date();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 900, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
      <div style={{ width: 460, height: '100vh', background: '#fff', boxShadow: '-4px 0 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--navy)' }}>{asset.name}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{asset.assetCode || asset.category?.name || 'Asset'}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Badge status={asset.status} />
            {warrantyOk && <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#EFF6FF', color: '#3B82F6' }}>Warranty Valid</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => onEdit(asset)} style={{ ...BTN('secondary'), padding: '6px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}><Pencil size={12} /> Edit</button>
            <button onClick={() => onMaintenance(asset)} style={{ ...BTN('secondary'), padding: '6px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}><Wrench size={12} /> Maintenance</button>
            {asset.status !== 'DISPOSED' && <button onClick={() => onDispose(asset)} style={{ ...BTN('danger'), padding: '6px 14px', fontSize: 13 }}>Dispose</button>}
          </div>
        </div>

        <div style={{ padding: '20px 24px', flex: 1 }}>
          {/* Value cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Purchase Price', value: fmt(asset.purchasePrice), color: '#1E293B' },
              { label: 'Current Value', value: fmt(asset.currentValue), color: asset.currentValue < asset.purchasePrice * 0.3 ? '#DC2626' : '#16A34A' },
              { label: 'Total Depreciation', value: fmt(asset.totalDepreciation), color: '#D97706' },
              { label: 'Depreciated', value: `${depPct}%`, color: '#6366F1' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Depreciation bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>
              <span>Book Value Progress</span><span>{depPct}% depreciated</span>
            </div>
            <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4 }}>
              <div style={{ height: '100%', width: `${Math.min(100, depPct)}%`, background: depPct > 80 ? '#DC2626' : depPct > 50 ? '#D97706' : '#16A34A', borderRadius: 4, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Details */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Category', asset.category?.name || '—'],
                ['Purchase Date', fmtDate(asset.purchaseDate)],
                ['Method', asset.depreciationMethod === 'SLM' ? 'Straight Line (SLM)' : 'Written Down Value (WDV)'],
                ['Useful Life', `${asset.usefulLifeYears} years`],
                ['Salvage Value', fmt(asset.salvageValue)],
                ['Serial Number', asset.serialNumber || '—'],
                ['Vendor', asset.vendor || '—'],
                ['Location', asset.location || '—'],
                ['Assigned To', asset.assignedTo || '—'],
                ['Warranty Expiry', fmtDate(asset.warrantyExpiry)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #F9FAFB' }}>
                  <span style={{ color: '#6B7280' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: '#1E293B', textAlign: 'right', maxWidth: 220 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Depreciation Schedule */}
          {asset.depreciationSchedule?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => setShowSchedule(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--navy)', padding: 0, marginBottom: 10 }}>
                {showSchedule ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Depreciation Schedule
              </button>
              {showSchedule && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      {['Year', 'Depreciation', 'Book Value'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Year' ? 'center' : 'right', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {asset.depreciationSchedule.map(row => (
                      <tr key={row.year} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '7px 10px', textAlign: 'center', color: '#6B7280' }}>Y{row.year}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#D97706' }}>{fmt(row.depreciation)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(row.bookValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Maintenance logs */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Maintenance History</div>
            {asset.maintenanceLogs?.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>No maintenance recorded yet.</p>
            ) : (
              asset.maintenanceLogs?.map(log => (
                <div key={log.id} style={{ padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{log.description}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', padding: '2px 8px', background: '#F5F3FF', borderRadius: 12 }}>{log.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: '#6B7280' }}>
                    <span>{fmtDate(log.performedAt)}</span>
                    {log.cost > 0 && <span style={{ color: '#DC2626', fontWeight: 600 }}>{fmt(log.cost)}</span>}
                    {log.performedBy && <span>by {log.performedBy}</span>}
                  </div>
                  {log.nextDueDate && <div style={{ fontSize: 12, color: '#D97706', marginTop: 3 }}>Next due: {fmtDate(log.nextDueDate)}</div>}
                  {log.notes && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{log.notes}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'dispose' | 'maint'
  const [selected, setSelected] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (catFilter) params.categoryId = catFilter;
      if (search) params.search = search;
      const [aRes, sRes, cRes] = await Promise.all([getAssets(params), getAssetSummary(), getAssetCategories()]);
      setAssets(aRes.data.data || []);
      setSummary(sRes.data.data || null);
      setCategories(cRes.data.data || []);
    } catch { toast.error('Failed to load assets'); }
    finally { setLoading(false); }
  }, [search, statusFilter, catFilter]);

  useEffect(() => { load(); }, [load]);

  // Seed default categories if none exist
  const seedCategories = async () => {
    for (const cat of DEFAULT_CATEGORIES) {
      try { await createAssetCategory(cat); } catch {}
    }
    load();
    toast.success('Default categories created');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this asset? This cannot be undone.')) return;
    try { await deleteAsset(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const closeAndRefresh = () => { setModal(null); setSelected(null); load(); if (detailId) setDetailId(null); };

  const kpis = [
    { label: 'Total Assets', value: summary?.total ?? '—', icon: Package2, color: '#6366F1' },
    { label: 'Purchase Value', value: fmt(summary?.totalPurchaseValue), icon: BarChart2, color: 'var(--cyan)' },
    { label: 'Current Value', value: fmt(summary?.totalCurrentValue), icon: TrendingDown, color: '#16A34A' },
    { label: 'Total Depreciation', value: fmt(summary?.totalDepreciation), icon: TrendingDown, color: '#D97706' },
    { label: 'Active', value: summary?.active ?? '—', icon: CheckCircle, color: '#16A34A' },
    { label: 'Under Maintenance', value: summary?.underMaintenance ?? '—', icon: Wrench, color: '#D97706' },
    { label: 'Maintenance Due (30d)', value: summary?.maintenanceDueSoon ?? '—', icon: AlertTriangle, color: '#DC2626' },
    { label: 'Disposed', value: summary?.disposed ?? '—', icon: X, color: '#9CA3AF' },
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--navy)', margin: 0 }}>Asset Management</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>Fixed asset register with depreciation tracking (SLM / WDV)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {categories.length === 0 && (
            <button onClick={seedCategories} style={{ ...BTN('secondary'), fontSize: 13 }}>+ Default Categories</button>
          )}
          <button onClick={() => setModal('add')} style={{ ...BTN(), display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Add Asset
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ ...CARD, display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--navy)' }}>{value}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ ...CARD, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets…" style={{ ...INPUT_S, paddingLeft: 32 }} />
        </div>
        <Filter size={14} color="#9CA3AF" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...INPUT_S, width: 'auto' }}>
          <option value="">All Status</option>
          {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...INPUT_S, width: 'auto' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(statusFilter || catFilter || search) && (
          <button onClick={() => { setStatusFilter(''); setCatFilter(''); setSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 13 }}>✕ Clear</button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Loading assets…</div>
      ) : assets.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', padding: 60 }}>
          <Package2 size={44} color="#E5E7EB" style={{ marginBottom: 12 }} />
          <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 16 }}>No assets in the register yet.</p>
          <button onClick={() => setModal('add')} style={BTN()}>Add First Asset</button>
        </div>
      ) : (
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1.5px solid #F3F4F6' }}>
                {['Asset', 'Category', 'Purchase', 'Book Value', 'Depreciated', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.map(a => {
                const depPct = pct(a.totalDepreciation, a.purchasePrice);
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #F9FAFB', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 14 }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                        {a.assetCode && <span style={{ marginRight: 8 }}>{a.assetCode}</span>}
                        {a.assignedTo && <span>→ {a.assignedTo}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', color: '#6B7280', fontSize: 13 }}>{a.category?.name || '—'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{fmt(a.purchasePrice)}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{fmtDate(a.purchaseDate)}</div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontWeight: 700, color: a.currentValue < a.purchasePrice * 0.2 ? '#DC2626' : '#16A34A' }}>{fmt(a.currentValue)}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{a.depreciationMethod}</div>
                    </td>
                    <td style={{ padding: '13px 16px', width: 130 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>{depPct}%</div>
                      <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${Math.min(100, depPct)}%`, background: depPct > 80 ? '#DC2626' : depPct > 50 ? '#D97706' : '#16A34A', borderRadius: 3 }} />
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}><Badge status={a.status} /></td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setDetailId(a.id)} title="View Details" style={{ background: '#F3F4F6', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#6B7280' }}><Eye size={13} /></button>
                        <button onClick={() => { setSelected(a); setModal('edit'); }} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}><Pencil size={13} /></button>
                        <button onClick={() => { setSelected(a); setModal('maint'); }} title="Log Maintenance" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D97706', padding: 4 }}><Wrench size={13} /></button>
                        {a.status !== 'DISPOSED' && <button onClick={() => { setSelected(a); setModal('dispose'); }} title="Dispose" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, fontSize: 13 }}>↓</button>}
                        <button onClick={() => handleDelete(a.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 4 }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal === 'add' && <AssetForm categories={categories} onClose={() => setModal(null)} onSave={closeAndRefresh} />}
      {modal === 'edit' && selected && <AssetForm asset={selected} categories={categories} onClose={() => setModal(null)} onSave={closeAndRefresh} />}
      {modal === 'maint' && selected && <MaintenanceModal assetId={selected.id} assetName={selected.name} onClose={() => setModal(null)} onSave={closeAndRefresh} />}
      {modal === 'dispose' && selected && <DisposeModal asset={selected} onClose={() => setModal(null)} onSave={closeAndRefresh} />}

      {/* Detail slide-in */}
      {detailId && (
        <AssetDetail
          assetId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(a) => { setSelected(a); setModal('edit'); setDetailId(null); }}
          onMaintenance={(a) => { setSelected(a); setModal('maint'); setDetailId(null); }}
          onDispose={(a) => { setSelected(a); setModal('dispose'); setDetailId(null); }}
        />
      )}
    </div>
  );
}
