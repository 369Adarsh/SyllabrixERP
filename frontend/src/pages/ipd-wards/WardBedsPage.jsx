import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { BedDouble, Plus, Trash2, RefreshCw, Edit3, X } from 'lucide-react';

const authHdr = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
const api = (path, opts = {}) =>
  fetch(`/api/v1/ipd-wards${path}`, { headers: authHdr(), ...opts }).then((r) => r.json());

const BED_STATUS_COLORS = {
  AVAILABLE:     { bg: '#22c55e20', color: '#16a34a', label: 'Available' },
  OCCUPIED:      { bg: '#ef444420', color: '#dc2626', label: 'Occupied' },
  UNDER_CLEANING:{ bg: '#f59e0b20', color: '#d97706', label: 'Cleaning' },
  RESERVED:      { bg: '#3b82f620', color: '#2563eb', label: 'Reserved' },
  MAINTENANCE:   { bg: '#a855f720', color: '#9333ea', label: 'Maintenance' },
};

const WARD_TYPES  = ['ICU', 'GENERAL', 'PRIVATE', 'SEMI_PRIVATE', 'MATERNITY', 'PEDIATRIC', 'OTHER'];
const BED_TYPES   = ['STANDARD', 'AC', 'ICU', 'ISOLATION', 'VIP'];
const BED_STATUSES = Object.keys(BED_STATUS_COLORS);

// ── Occupancy Bar ──────────────────────────────────────────────────────────────
function OccupancyBar({ pct }) {
  return (
    <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#22c55e', borderRadius: 3, transition: 'width 0.4s ease' }} />
    </div>
  );
}

// ── Bed Tile ───────────────────────────────────────────────────────────────────
function BedTile({ bed, onStatusChange, onDelete }) {
  const s = BED_STATUS_COLORS[bed.status] || BED_STATUS_COLORS.AVAILABLE;
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', background: s.bg, border: `1.5px solid ${s.color}50`, borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Bed {bed.bedNumber}</div>
      <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{bed.bedType} · ₹{bed.dailyRate}/day</div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10, background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 8, minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', overflow: 'hidden' }}
             onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: '8px 0' }}>
            {BED_STATUSES.map((st) => (
              <button key={st} onClick={() => { onStatusChange(bed.id, st); setOpen(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', border: 'none', background: bed.status === st ? 'var(--surface-1)' : 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 12 }}>
                {BED_STATUS_COLORS[st].label}
              </button>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
            <button onClick={() => { if (window.confirm('Delete this bed?')) { onDelete(bed.id); setOpen(false); } }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
              Delete Bed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Ward Modal ─────────────────────────────────────────────────────────────
function WardModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', wardType: 'GENERAL', floor: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) return toast.error('Enter ward name');
    setSaving(true);
    try {
      const res = await api('/', { method: 'POST', body: JSON.stringify(form) });
      if (res.id) { toast.success('Ward created'); onSaved(); onClose(); }
      else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const inp = (f) => ({
    value: form[f] || '', onChange: (e) => setForm((p) => ({ ...p, [f]: e.target.value })),
    style: { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' },
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 400 }}>
        <h3 style={{ margin: '0 0 20px', color: 'var(--text-primary)' }}>Add Ward</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Ward Name *</label>
            <input {...inp('name')} placeholder="e.g. General Ward A" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Ward Type</label>
            <select {...inp('wardType')} style={{ ...inp('wardType').style }}>
              {WARD_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Floor</label>
            <input {...inp('floor')} placeholder="Ground, 1st, 2nd…" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Creating…' : 'Create Ward'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Bed Modal ──────────────────────────────────────────────────────────────
function BedModal({ ward, onClose, onSaved }) {
  const [form, setForm] = useState({ bedNumber: '', bedType: 'STANDARD', dailyRate: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.bedNumber.trim()) return toast.error('Enter bed number');
    setSaving(true);
    try {
      const res = await api('/beds', { method: 'POST', body: JSON.stringify({ ...form, wardId: ward.id }) });
      if (res.id) { toast.success('Bed added'); onSaved(); onClose(); }
      else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const inp = (f, type = 'text') => ({
    type, value: form[f] || '', onChange: (e) => setForm((p) => ({ ...p, [f]: e.target.value })),
    style: { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' },
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 380 }}>
        <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>Add Bed</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-secondary)' }}>Ward: {ward.name}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Bed Number *</label>
            <input {...inp('bedNumber')} placeholder="e.g. A-01, ICU-3" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Bed Type</label>
            <select {...inp('bedType')} style={{ ...inp('bedType').style }}>
              {BED_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Daily Rate (₹)</label>
            <input {...inp('dailyRate', 'number')} placeholder="500" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Adding…' : 'Add Bed'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function WardBedsPage() {
  const [wards, setWards]       = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [wardModal, setWardModal] = useState(false);
  const [bedModal, setBedModal]  = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [w, o] = await Promise.all([api('/'), api('/occupancy')]);
      setWards(Array.isArray(w) ? w : []);
      setOccupancy(o);
    } catch { toast.error('Failed to load ward data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (bedId, status) => {
    try {
      await api(`/beds/${bedId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const deleteBed = async (bedId) => {
    try {
      await api(`/beds/${bedId}`, { method: 'DELETE' });
      toast.success('Bed removed');
      load();
    } catch { toast.error('Failed to delete bed'); }
  };

  const deleteWard = async (wardId) => {
    if (!window.confirm('Archive this ward? Beds remain but ward will be hidden.')) return;
    try {
      await api(`/${wardId}`, { method: 'DELETE' });
      toast.success('Ward archived');
      load();
    } catch { toast.error('Failed to archive ward'); }
  };

  const statusCounts = (beds) =>
    Object.fromEntries(Object.keys(BED_STATUS_COLORS).map((s) => [s, beds.filter((b) => b.status === s).length]));

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#3b82f620', borderRadius: 10, padding: 10 }}>
            <BedDouble size={24} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Bed & Ward Management</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Module 17 — Live bed board and occupancy</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setWardModal(true)} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Ward
          </button>
        </div>
      </div>

      {/* Occupancy Summary */}
      {occupancy && (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: 28, color: 'var(--text-primary)' }}>{occupancy.occupancyPct}%</div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <OccupancyBar pct={occupancy.occupancyPct} />
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Overall Occupancy</div>
            </div>
            {[
              { label: 'Total Beds', value: occupancy.total, color: 'var(--text-primary)' },
              { label: 'Occupied', value: occupancy.occupied, color: '#dc2626' },
              { label: 'Available', value: occupancy.available, color: '#16a34a' },
              { label: 'Cleaning', value: occupancy.cleaning, color: '#d97706' },
              { label: 'Reserved', value: occupancy.reserved, color: '#2563eb' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', minWidth: 64 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {Object.entries(BED_STATUS_COLORS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: v.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{v.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 48 }}>Loading wards…</div>
      ) : wards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          <BedDouble size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>No wards created yet. Add your first ward to begin managing beds.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {wards.map((ward) => {
            const beds = ward.beds || [];
            const counts = statusCounts(beds);
            const pct = beds.length > 0 ? ((counts.OCCUPIED || 0) / beds.length) * 100 : 0;

            return (
              <div key={ward.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                {/* Ward Header */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{ward.name}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                        {ward.wardType.replace('_', ' ')}
                      </span>
                      {ward.floor && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Floor: {ward.floor}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                      <OccupancyBar pct={pct} />
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {counts.OCCUPIED || 0}/{beds.length} occupied
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setBedModal(ward)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#3b82f615', color: '#3b82f6', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Plus size={12} /> Add Bed
                    </button>
                    <button onClick={() => deleteWard(ward.id)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Bed Grid */}
                <div style={{ padding: 16 }}>
                  {beds.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: '12px 0' }}>
                      No beds in this ward. Click "Add Bed" to add.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                      {beds.map((bed) => (
                        <BedTile key={bed.id} bed={bed} onStatusChange={changeStatus} onDelete={deleteBed} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {wardModal && <WardModal onClose={() => setWardModal(false)} onSaved={load} />}
      {bedModal  && <BedModal  ward={bedModal} onClose={() => setBedModal(null)} onSaved={load} />}
    </div>
  );
}
