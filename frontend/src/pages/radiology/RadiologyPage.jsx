import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Radio, Plus, X, RefreshCw, ListChecks } from 'lucide-react';

const authHdr = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
const api = (path, opts = {}) =>
  fetch(`/api/v1/radiology${path}`, { headers: authHdr(), ...opts }).then((r) => r.json());

const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_META = {
  ORDERED:     { color: '#3b82f6', bg: '#3b82f618', label: 'Ordered' },
  SCHEDULED:   { color: '#6366f1', bg: '#6366f118', label: 'Scheduled' },
  IN_PROGRESS: { color: '#f59e0b', bg: '#f59e0b18', label: 'In Progress' },
  REPORTED:    { color: '#22c55e', bg: '#22c55e18', label: 'Reported' },
  DELIVERED:   { color: '#6b7280', bg: '#6b728018', label: 'Delivered' },
};

const PRIORITY_META = {
  ROUTINE: { color: '#6b7280', label: 'Routine' },
  URGENT:  { color: '#f59e0b', label: 'Urgent' },
  STAT:    { color: '#ef4444', label: 'STAT' },
};

const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' };

// ── New Order Modal ────────────────────────────────────────────────────────────
function NewOrderModal({ meta, onClose, onSaved }) {
  const [form, setForm] = useState({ patientName: '', orderedBy: '', modality: 'XRAY', bodyPart: '', clinicalInfo: '', priority: 'ROUTINE' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!form.patientName.trim()) return toast.error('Patient name required');
    if (!form.orderedBy.trim()) return toast.error('Ordering doctor required');
    setSaving(true);
    try {
      const res = await api('/', { method: 'POST', body: JSON.stringify(form) });
      if (res.id) { toast.success(`Radiology order ${res.orderNumber} created`); onSaved(); onClose(); }
      else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>New Radiology Order</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Patient Name *</label>
            <input value={form.patientName} onChange={set('patientName')} placeholder="Full name" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Ordered By *</label>
            <input value={form.orderedBy} onChange={set('orderedBy')} placeholder="Dr. Sharma" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Modality *</label>
            <select value={form.modality} onChange={set('modality')} style={inputStyle}>
              {(meta?.modalities || ['XRAY','USG','CT','MRI','ECG','ECHO']).map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Body Part</label>
            <input value={form.bodyPart} onChange={set('bodyPart')} placeholder="Chest, Abdomen, Left knee…" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Priority</label>
            <select value={form.priority} onChange={set('priority')} style={inputStyle}>
              {(meta?.priorities || ['ROUTINE','URGENT','STAT']).map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Clinical Information</label>
            <textarea value={form.clinicalInfo} onChange={set('clinicalInfo')} placeholder="Relevant clinical history, suspected diagnosis…" rows={2}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Creating…' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Report Entry Modal ─────────────────────────────────────────────────────────
function ReportModal({ order, meta, onClose, onSaved }) {
  const [form, setForm] = useState({ technicianName: order.technicianName || '', findings: order.findings || '', impression: order.impression || '', reportedBy: order.reportedBy || '', status: order.status });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (form.findings || form.impression) payload.status = 'REPORTED';
      const res = await api(`/${order.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      if (res.id) { toast.success('Report saved'); onSaved(); onClose(); }
      else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const s = STATUS_META[form.status] || STATUS_META.ORDERED;
  const p = PRIORITY_META[order.priority] || PRIORITY_META.ROUTINE;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 580, marginTop: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{order.modality} — {order.bodyPart || 'General'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
              {order.orderNumber} · {order.patientName} · Ordered by {order.orderedBy}
              <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 6, background: p.color + '18', color: p.color, fontWeight: 600, fontSize: 11 }}>{p.label}</span>
            </div>
            {order.clinicalInfo && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>"{order.clinicalInfo}"</div>}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Technician Name</label>
              <input value={form.technicianName} onChange={set('technicianName')} placeholder="Radiographer name" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Status</label>
              <select value={form.status} onChange={set('status')} style={{ ...inputStyle, color: s.color, fontWeight: 600 }}>
                {(meta?.statuses || Object.keys(STATUS_META)).map((st) => <option key={st} value={st}>{STATUS_META[st]?.label || st}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Radiological Findings</label>
            <textarea value={form.findings} onChange={set('findings')} rows={5}
              placeholder="Describe what is seen on the image — size, location, density, margins, associated findings…"
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Impression / Conclusion</label>
            <textarea value={form.impression} onChange={set('impression')} rows={3}
              placeholder="Radiologist's impression and differential diagnosis…"
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Reported By (Radiologist)</label>
            <input value={form.reportedBy} onChange={set('reportedBy')} placeholder="Dr. Radiologist Name" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Save Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RadiologyPage() {
  const [tab, setTab]           = useState('worklist');
  const [orders, setOrders]     = useState([]);
  const [worklist, setWorklist] = useState([]);
  const [stats, setStats]       = useState(null);
  const [meta, setMeta]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [newOrderModal, setNewOrder] = useState(false);
  const [reportModal, setReport]    = useState(null);
  const [statusFilter, setStatus]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const [o, w, st, m] = await Promise.all([api(params), api('/worklist'), api('/stats'), api('/meta')]);
      setOrders(o.orders || []); setWorklist(Array.isArray(w) ? w : []); setStats(st); setMeta(m);
    } catch { toast.error('Failed to load radiology data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const displayOrders = tab === 'worklist' ? worklist : orders;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#a855f720', borderRadius: 10, padding: 10 }}><Radio size={24} color="#a855f7" /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Radiology</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Module 24 — Orders, Worklist & Reports</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setNewOrder(true)} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> New Order
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: 'Total Orders', value: stats.total, color: 'var(--teal)' },
            { label: 'Pending', value: stats.pending, color: '#f59e0b' },
            ...Object.entries(stats.byModality || {}).map(([mod, count]) => ({ label: mod, value: count, color: '#a855f7' })).slice(0, 3),
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, minWidth: 110, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 20 }}>
        {[{ id: 'worklist', label: `Worklist (${worklist.length})` }, { id: 'all', label: 'All Orders' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? '#a855f7' : 'var(--text-secondary)', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: tab === t.id ? '2px solid #a855f7' : '2px solid transparent', marginBottom: -2 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'all' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {[{ val: '', label: 'All' }, ...Object.entries(STATUS_META).map(([k, v]) => ({ val: k, label: v.label }))].map(({ val, label }) => (
            <button key={val} onClick={() => setStatus(val)}
              style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${statusFilter === val ? 'var(--teal)' : 'var(--border)'}`, background: statusFilter === val ? 'var(--teal)15' : 'transparent', color: statusFilter === val ? 'var(--teal)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: statusFilter === val ? 600 : 400 }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 48 }}>Loading…</div>
      : displayOrders.length === 0 ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}><Radio size={40} style={{ opacity: 0.3, marginBottom: 10 }} /><p>{tab === 'worklist' ? 'Worklist is clear.' : 'No radiology orders found.'}</p></div>
      : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-1)' }}>
                {['Order #', 'Patient', 'Modality', 'Body Part', 'Ordered By', 'Priority', 'Date', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayOrders.map((o, i) => {
                const sm = STATUS_META[o.status] || STATUS_META.ORDERED;
                const pm = PRIORITY_META[o.priority] || PRIORITY_META.ROUTINE;
                return (
                  <tr key={o.id} style={{ borderBottom: i < displayOrders.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }} onClick={() => setReport(o)}>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{o.orderNumber}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{o.patientName}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ padding: '2px 8px', borderRadius: 6, background: '#a855f718', color: '#a855f7', fontWeight: 600, fontSize: 12 }}>{o.modality}</span></td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{o.bodyPart || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{o.orderedBy}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: pm.color + '18', color: pm.color, fontWeight: 600 }}>{pm.label}</span></td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDT(o.createdAt)}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: sm.bg, color: sm.color, fontWeight: 600 }}>{sm.label}</span></td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={(e) => { e.stopPropagation(); setReport(o); }} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#a855f715', color: '#a855f7', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        {['ORDERED','SCHEDULED','IN_PROGRESS'].includes(o.status) ? 'Enter Report' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {newOrderModal && <NewOrderModal meta={meta} onClose={() => setNewOrder(false)} onSaved={load} />}
      {reportModal   && <ReportModal order={reportModal} meta={meta} onClose={() => setReport(null)} onSaved={load} />}
    </div>
  );
}
