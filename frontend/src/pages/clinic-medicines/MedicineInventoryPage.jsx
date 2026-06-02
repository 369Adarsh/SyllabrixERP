import { useState, useEffect } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import toast from 'react-hot-toast';
import {
  Pill, Plus, Search, Trash2, AlertTriangle, CheckCircle,
  Package, Truck, ClipboardList, ChevronDown,
} from 'lucide-react';

const api = (path, opts = {}) =>
  fetch(`/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
    ...opts,
  }).then((r) => r.json());

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const SCHEDULE_COLORS = { NONE: null, H: '#D97706', H1: '#DC2626', X: '#7C3AED' };
const FORMULATIONS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Sachet', 'Patch', 'Other'];

function ScheduleBadge({ type }) {
  const color = SCHEDULE_COLORS[type];
  if (!color || type === 'NONE') return null;
  return <span style={{ fontSize: 10, background: '#FEF3C7', color, borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>Sch-{type}</span>;
}

function StockBar({ current, reorder }) {
  const ratio = reorder > 0 ? Math.min(1, current / (reorder * 3)) : 1;
  const color = current <= 0 ? '#DC2626' : current <= reorder ? '#D97706' : '#059669';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${ratio * 100}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color, minWidth: 24, textAlign: 'right' }}>{current}</span>
    </div>
  );
}

// ── Add Medicine Modal ─────────────────────────────────────────────────────────
function AddMedicineModal({ onClose, onSave }) {
  const [form, setForm] = useState({ genericName: '', brandName: '', formulation: 'Tablet', strength: '', unit: 'Strip', mrp: '', reorderLevel: 10, scheduleType: 'NONE' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.genericName.trim()) { toast.error('Generic name required'); return; }
    setSaving(true);
    try {
      await api('/clinic-medicines', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Medicine added');
      onSave();
    } catch { toast.error('Failed to add medicine'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)', marginBottom: 20 }}>Add Medicine to Master</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Generic Name *', key: 'genericName', full: true },
            { label: 'Brand Name', key: 'brandName' },
            { label: 'Strength', key: 'strength', placeholder: '500mg' },
            { label: 'MRP (₹)', key: 'mrp', type: 'number' },
            { label: 'Reorder Level', key: 'reorderLevel', type: 'number' },
          ].map(({ label, key, full, type, placeholder }) => (
            <div key={key} style={full ? { gridColumn: '1 / -1' } : {}}>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
              <input type={type || 'text'} style={{ ...P.input, width: '100%', boxSizing: 'border-box' }} placeholder={placeholder || ''} value={form[key]} onChange={(e) => set(key, e.target.value)} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Formulation</label>
            <select style={{ ...P.input, width: '100%' }} value={form.formulation} onChange={(e) => set('formulation', e.target.value)}>
              {FORMULATIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Unit</label>
            <select style={{ ...P.input, width: '100%' }} value={form.unit} onChange={(e) => set('unit', e.target.value)}>
              {['Strip', 'Bottle', 'Vial', 'Tube', 'Sachet', 'Pcs'].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Schedule</label>
            <select style={{ ...P.input, width: '100%' }} value={form.scheduleType} onChange={(e) => set('scheduleType', e.target.value)}>
              {['NONE', 'H', 'H1', 'X'].map((s) => <option key={s} value={s}>{s === 'NONE' ? 'No Schedule' : `Schedule ${s}`}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button style={P.btn('secondary')} onClick={onClose}>Cancel</button>
          <button style={P.btn('primary')} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Add Medicine'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Add Batch Modal ────────────────────────────────────────────────────────────
function AddBatchModal({ medicine, suppliers, onClose, onSave }) {
  const [form, setForm] = useState({ batchNumber: '', expiryDate: '', mfgDate: '', quantity: '', purchasePrice: '', supplierId: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.batchNumber.trim() || !form.expiryDate || !form.quantity) { toast.error('Batch#, expiry, and quantity required'); return; }
    setSaving(true);
    try {
      await api('/clinic-medicines/batches', { method: 'POST', body: JSON.stringify({ ...form, medicineId: medicine.id }) });
      toast.success('Batch added');
      onSave();
    } catch { toast.error('Failed to add batch'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 460 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 4 }}>Add Stock Batch</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>{medicine.genericName} {medicine.strength} {medicine.formulation}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Batch Number *', key: 'batchNumber', full: true },
            { label: 'Expiry Date *', key: 'expiryDate', type: 'date' },
            { label: 'Mfg Date', key: 'mfgDate', type: 'date' },
            { label: 'Quantity *', key: 'quantity', type: 'number' },
            { label: 'Purchase Price/Unit (₹)', key: 'purchasePrice', type: 'number' },
          ].map(({ label, key, type, full }) => (
            <div key={key} style={full ? { gridColumn: '1 / -1' } : {}}>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
              <input type={type || 'text'} style={{ ...P.input, width: '100%', boxSizing: 'border-box' }} value={form[key]} onChange={(e) => set(key, e.target.value)} />
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Supplier</label>
            <select style={{ ...P.input, width: '100%' }} value={form.supplierId} onChange={(e) => set('supplierId', e.target.value)}>
              <option value="">— None —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button style={P.btn('secondary')} onClick={onClose}>Cancel</button>
          <button style={P.btn('primary')} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Add Batch'}</button>
        </div>
      </div>
    </div>
  );
}

export default function MedicineInventoryPage() {
  const isMobile = useBreakpoint();
  const [tab, setTab] = useState('stock');
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [scheduleH, setScheduleH] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddMed, setShowAddMed] = useState(false);
  const [addBatchFor, setAddBatchFor] = useState(null);
  const [newSupplier, setNewSupplier] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [meds, sups, alerts, low] = await Promise.all([
        api('/clinic-medicines'),
        api('/clinic-medicines/suppliers'),
        api('/clinic-medicines/alerts/expiry'),
        api('/clinic-medicines/alerts/low-stock'),
      ]);
      setMedicines(meds.error ? [] : meds);
      setSuppliers(sups.error ? [] : sups);
      setExpiryAlerts(alerts.error ? [] : alerts);
      setLowStock(low.error ? [] : low);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  };

  const loadScheduleH = async () => {
    const data = await api('/clinic-medicines/schedule-h');
    setScheduleH(data.error ? [] : data);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (tab === 'schedule-h') loadScheduleH(); }, [tab]);

  const handleAddSupplier = async () => {
    if (!newSupplier.trim()) return;
    await api('/clinic-medicines/suppliers', { method: 'POST', body: JSON.stringify({ name: newSupplier.trim() }) });
    setNewSupplier('');
    load();
    toast.success('Supplier saved');
  };

  const handleDeleteMed = async (id) => {
    if (!window.confirm('Remove medicine from master?')) return;
    await api(`/clinic-medicines/${id}`, { method: 'DELETE' });
    toast.success('Removed');
    load();
  };

  const filtered = medicines.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return m.genericName.toLowerCase().includes(q) || (m.brandName || '').toLowerCase().includes(q);
  });

  const TABS = [
    { key: 'stock', label: 'Stock', icon: Package },
    { key: 'expiry', label: `Expiry Alerts (${expiryAlerts.length})`, icon: AlertTriangle },
    { key: 'low-stock', label: `Low Stock (${lowStock.length})`, icon: AlertTriangle },
    { key: 'suppliers', label: 'Suppliers', icon: Truck },
    { key: 'schedule-h', label: 'Schedule H Register', icon: ClipboardList },
  ];

  return (
    <div style={P.wrap(isMobile)}>
      {showAddMed && <AddMedicineModal onClose={() => setShowAddMed(false)} onSave={() => { setShowAddMed(false); load(); }} />}
      {addBatchFor && <AddBatchModal medicine={addBatchFor} suppliers={suppliers} onClose={() => setAddBatchFor(null)} onSave={() => { setAddBatchFor(null); load(); }} />}

      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Medicine Inventory</h1>
          <p style={P.sub}>Module 8 — Stock, batches, expiry & Schedule H register</p>
        </div>
        <button style={P.btn('primary')} onClick={() => setShowAddMed(true)}><Plus size={14} /> Add Medicine</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Medicines', value: medicines.length, color: 'var(--navy)' },
          { label: 'Low Stock', value: lowStock.length, color: '#D97706' },
          { label: 'Expiry Alerts', value: expiryAlerts.length, color: '#DC2626' },
          { label: 'Suppliers', value: suppliers.length, color: '#059669' },
        ].map((s) => (
          <div key={s.label} style={{ ...P.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)', overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap',
            borderBottom: tab === t.key ? '2px solid var(--cyan)' : '2px solid transparent',
            color: tab === t.key ? 'var(--cyan)' : '#6B7280', marginBottom: -2,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Stock tab */}
      {tab === 'stock' && (
        <>
          <div style={P.bar}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
              <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input style={{ ...P.searchInput, paddingLeft: 34 }} placeholder="Search generic or brand…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div style={P.tableWrap}>
            <div style={P.tableScroll}>
              <table style={P.table}>
                <thead style={P.thead}>
                  <tr>
                    <th style={P.th()}>Medicine</th>
                    <th style={P.th()}>Formulation</th>
                    <th style={P.th('center')}>Schedule</th>
                    <th style={P.th('right')}>MRP</th>
                    <th style={P.th()}>Current Stock</th>
                    <th style={P.th('center')}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} style={P.empty}>Loading…</td></tr> :
                    filtered.length === 0 ? (
                      <tr><td colSpan={6} style={P.empty}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <Pill size={32} color="#D1D5DB" />
                          <span>No medicines yet</span>
                          <button style={P.btn('secondary')} onClick={() => setShowAddMed(true)}><Plus size={12} /> Add first medicine</button>
                        </div>
                      </td></tr>
                    ) : (
                      filtered.map((m, i) => (
                        <tr key={m.id} style={P.tr(i, filtered.length)}>
                          <td style={P.td()}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{m.genericName}</div>
                            {m.brandName && <div style={{ fontSize: 11, color: '#6B7280' }}>{m.brandName}</div>}
                          </td>
                          <td style={P.td()}>
                            <span style={{ fontSize: 12 }}>{m.formulation}</span>
                            {m.strength && <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 4 }}>{m.strength}</span>}
                          </td>
                          <td style={P.td('center')}><ScheduleBadge type={m.scheduleType} /></td>
                          <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', fontSize: 12 }}>{m.mrp ? fmt(m.mrp) : '—'}</td>
                          <td style={{ ...P.td(), minWidth: 120 }}>
                            <StockBar current={m.currentStock || 0} reorder={m.reorderLevel} />
                          </td>
                          <td style={P.td('center')}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              <button style={{ ...P.btn('secondary'), padding: '4px 10px', fontSize: 11 }} onClick={() => setAddBatchFor(m)}>
                                + Batch
                              </button>
                              <button style={{ ...P.btn('danger'), padding: '4px 8px' }} onClick={() => handleDeleteMed(m.id)}>
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Expiry Alerts tab */}
      {tab === 'expiry' && (
        <div style={P.tableWrap}>
          <div style={P.tableScroll}>
            <table style={P.table}>
              <thead style={P.thead}>
                <tr>
                  <th style={P.th()}>Medicine</th>
                  <th style={P.th()}>Batch#</th>
                  <th style={P.th('right')}>Available</th>
                  <th style={P.th()}>Expiry Date</th>
                  <th style={P.th('center')}>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {expiryAlerts.length === 0 ? <tr><td colSpan={5} style={{ ...P.empty, color: '#059669' }}>✓ No expiry alerts!</td></tr> :
                  expiryAlerts.map((b, i) => (
                    <tr key={b.id} style={{ ...P.tr(i, expiryAlerts.length), background: b.urgency === 'CRITICAL' ? '#FEF2F2' : '#FFFBEB' }}>
                      <td style={P.td()}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{b.medicine?.genericName}</div>
                        <ScheduleBadge type={b.medicine?.scheduleType} />
                      </td>
                      <td style={{ ...P.td(), fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b.batchNumber}</td>
                      <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{b.available}</td>
                      <td style={{ ...P.td(), fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fmtDate(b.expiryDate)}</td>
                      <td style={P.td('center')}>
                        <span style={{ fontWeight: 800, color: b.urgency === 'CRITICAL' ? '#DC2626' : '#D97706', fontSize: 13 }}>
                          {b.daysLeft} days
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Stock tab */}
      {tab === 'low-stock' && (
        <div style={P.tableWrap}>
          <div style={P.tableScroll}>
            <table style={P.table}>
              <thead style={P.thead}>
                <tr>
                  <th style={P.th()}>Medicine</th>
                  <th style={P.th('right')}>Current Stock</th>
                  <th style={P.th('right')}>Reorder Level</th>
                  <th style={P.th('center')}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? <tr><td colSpan={4} style={{ ...P.empty, color: '#059669' }}>✓ All medicines adequately stocked!</td></tr> :
                  lowStock.map((m, i) => (
                    <tr key={m.id} style={{ ...P.tr(i, lowStock.length), background: '#FFFBEB' }}>
                      <td style={P.td()}><div style={{ fontWeight: 600, fontSize: 13 }}>{m.genericName}</div><div style={{ fontSize: 11, color: '#6B7280' }}>{m.brandName}</div></td>
                      <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', fontWeight: 800, color: m.currentStock === 0 ? '#DC2626' : '#D97706' }}>{m.currentStock}</td>
                      <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280' }}>{m.reorderLevel}</td>
                      <td style={P.td('center')}>
                        <button style={{ ...P.btn('primary'), padding: '4px 12px', fontSize: 11 }} onClick={() => setAddBatchFor(m)}>+ Add Stock</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers tab */}
      {tab === 'suppliers' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input style={{ ...P.input, flex: 1, maxWidth: 280 }} placeholder="Supplier / distributor name" value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSupplier()} />
            <button style={P.btn('primary')} onClick={handleAddSupplier}><Plus size={13} /> Add</button>
          </div>
          <div style={P.tableWrap}>
            <table style={P.table}>
              <thead style={P.thead}><tr><th style={P.th()}>Name</th><th style={P.th()}>Phone</th><th style={P.th()}>GSTIN</th><th style={P.th('right')}>Credit Days</th></tr></thead>
              <tbody>
                {suppliers.length === 0 ? <tr><td colSpan={4} style={P.empty}>No suppliers yet</td></tr> :
                  suppliers.map((s, i) => (
                    <tr key={s.id} style={P.tr(i, suppliers.length)}>
                      <td style={P.td()}><div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div></td>
                      <td style={{ ...P.td(), fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.phone || '—'}</td>
                      <td style={{ ...P.td(), fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.gstin || '—'}</td>
                      <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)' }}>{s.creditDays} days</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule H Register tab */}
      {tab === 'schedule-h' && (
        <div style={P.tableWrap}>
          <div style={P.tableScroll}>
            <table style={P.table}>
              <thead style={P.thead}>
                <tr>
                  <th style={P.th()}>Medicine</th>
                  <th style={P.th('center')}>Schedule</th>
                  <th style={P.th()}>Patient</th>
                  <th style={P.th()}>Rx #</th>
                  <th style={P.th('center')}>Qty</th>
                  <th style={P.th()}>Dispensed</th>
                </tr>
              </thead>
              <tbody>
                {scheduleH.length === 0 ? <tr><td colSpan={6} style={P.empty}>No Schedule H/X dispensing records yet</td></tr> :
                  scheduleH.map((d, i) => (
                    <tr key={d.id} style={P.tr(i, scheduleH.length)}>
                      <td style={P.td()}><div style={{ fontWeight: 600, fontSize: 13 }}>{d.medicine?.genericName}</div></td>
                      <td style={P.td('center')}><ScheduleBadge type={d.medicine?.scheduleType} /></td>
                      <td style={P.td()}><div style={{ fontSize: 13 }}>{d.patientName}</div></td>
                      <td style={{ ...P.td(), fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan)' }}>{d.rxNumber || '—'}</td>
                      <td style={{ ...P.td('center'), fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{d.quantity}</td>
                      <td style={{ ...P.td(), fontFamily: 'var(--font-mono)', fontSize: 11 }}>{fmtDate(d.dispensedAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
