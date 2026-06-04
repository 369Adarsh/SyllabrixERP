import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Scissors, Plus, X, RefreshCw, ChevronDown } from 'lucide-react';

const authHdr = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
const api = (path, opts = {}) =>
  fetch(`/api/v1/ot-sessions${path}`, { headers: authHdr(), ...opts }).then((r) => r.json());

const fmtDT  = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmt    = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_META = {
  SCHEDULED:   { color: '#3b82f6', bg: '#3b82f618', label: 'Scheduled' },
  IN_PROGRESS: { color: '#f59e0b', bg: '#f59e0b18', label: 'In Progress' },
  COMPLETED:   { color: '#22c55e', bg: '#22c55e18', label: 'Completed' },
  CANCELLED:   { color: '#ef4444', bg: '#ef444418', label: 'Cancelled' },
  POSTPONED:   { color: '#6b7280', bg: '#6b728018', label: 'Postponed' },
};

const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' };
const label = (t) => <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{t}</label>;

// ── Schedule OT Modal ──────────────────────────────────────────────────────────
function ScheduleModal({ meta, onClose, onSaved }) {
  const [form, setForm] = useState({
    patientName: '', patientId: '', admissionId: '',
    procedureName: '', surgeonName: '', anesthesiologistName: '',
    otRoom: '', scheduledDate: '', estimatedDuration: '',
    sessionType: 'ELECTIVE',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!form.patientName.trim()) return toast.error('Patient name required');
    if (!form.procedureName.trim()) return toast.error('Procedure name required');
    if (!form.surgeonName.trim()) return toast.error('Surgeon name required');
    if (!form.scheduledDate) return toast.error('Schedule date required');
    setSaving(true);
    try {
      const res = await api('/', { method: 'POST', body: JSON.stringify(form) });
      if (res.id) { toast.success(`OT Session ${res.sessionNumber} scheduled`); onSaved(); onClose(); }
      else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 580, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Schedule OT Procedure</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>{label('Patient Name *')}<input value={form.patientName} onChange={set('patientName')} placeholder="Full name" style={inputStyle} /></div>
          <div style={{ gridColumn: '1 / -1' }}>{label('Procedure / Surgery Name *')}<input value={form.procedureName} onChange={set('procedureName')} placeholder="e.g. Appendectomy, LSCS, Hernia Repair" style={inputStyle} /></div>
          <div>{label('Surgeon Name *')}<input value={form.surgeonName} onChange={set('surgeonName')} placeholder="Dr. Sharma" style={inputStyle} /></div>
          <div>{label('Anesthesiologist')}<input value={form.anesthesiologistName} onChange={set('anesthesiologistName')} placeholder="Dr. Patel" style={inputStyle} /></div>
          <div>{label('OT Room')}<input value={form.otRoom} onChange={set('otRoom')} placeholder="OT-1, OT-2…" style={inputStyle} /></div>
          <div>{label('Session Type')}<select value={form.sessionType} onChange={set('sessionType')} style={inputStyle}>{(meta?.sessionTypes || ['ELECTIVE','EMERGENCY']).map((t) => <option key={t}>{t}</option>)}</select></div>
          <div>{label('Scheduled Date & Time *')}<input type="datetime-local" value={form.scheduledDate} onChange={set('scheduledDate')} style={inputStyle} /></div>
          <div>{label('Est. Duration (min)')}<input type="number" value={form.estimatedDuration} onChange={set('estimatedDuration')} placeholder="60" style={inputStyle} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Scheduling…' : 'Schedule OT'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail / Update Modal ──────────────────────────────────────────────────────
function DetailModal({ session, meta, onClose, onUpdated }) {
  const [tab, setTab]   = useState('clearance');
  const [form, setForm] = useState({
    status: session.status,
    clearance: session.clearance || { consentSigned: false, investigationsDone: false, npoBefore: false, anesthesiaFitness: false, ivLine: false },
    anesthesiaType: session.anesthesiaType || '',
    intraopNotes: session.intraopNotes || '',
    anesthesiaNotes: session.anesthesiaNotes || '',
    postOpOrders: session.postOpOrders || '',
    consumables: session.consumables ? JSON.stringify(session.consumables, null, 2) : '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (form.consumables) { try { payload.consumables = JSON.parse(form.consumables); } catch { payload.consumables = form.consumables; } }
      const res = await api(`/${session.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      if (res.id) { toast.success('OT session updated'); onUpdated(); onClose(); }
      else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const setClear = (k) => setForm((p) => ({ ...p, clearance: { ...p.clearance, [k]: !p.clearance[k] } }));
  const TABS = [{ id: 'clearance', label: 'Pre-op Clearance' }, { id: 'intraop', label: 'Intraoperative' }, { id: 'postop', label: 'Post-op Orders' }];
  const s = STATUS_META[form.status] || STATUS_META.SCHEDULED;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 12, width: '100%', maxWidth: 620, marginTop: 20 }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{session.procedureName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {session.sessionNumber} · {session.patientName} · {fmtDT(session.scheduledDate)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${s.color}`, background: s.bg, color: s.color, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 18px', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'var(--teal)' : 'var(--text-secondary)', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: tab === t.id ? '2px solid var(--teal)' : '2px solid transparent', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 20, maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Pre-op Clearance */}
          {tab === 'clearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Tick all clearance items before proceeding to OT</p>
              {[
                ['consentSigned',        'Informed consent signed by patient / guardian'],
                ['investigationsDone',   'Pre-op investigations completed (CBC, LFT, ECG, X-ray, etc.)'],
                ['npoBefore',            'NPO (Nil per Os) status confirmed'],
                ['anesthesiaFitness',    'Anesthesia fitness cleared'],
                ['ivLine',               'IV line secured'],
              ].map(([k, text]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, background: form.clearance[k] ? '#22c55e10' : 'var(--surface-1)' }}>
                  <input type="checkbox" checked={!!form.clearance[k]} onChange={() => setClear(k)} style={{ width: 16, height: 16, accentColor: '#22c55e' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{text}</span>
                  {form.clearance[k] && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e', fontWeight: 600 }}>✓ Done</span>}
                </label>
              ))}
              <div>
                {label('Anesthesia Type')}
                <select value={form.anesthesiaType} onChange={(e) => setForm((p) => ({ ...p, anesthesiaType: e.target.value }))} style={inputStyle}>
                  <option value="">Select…</option>
                  {(meta?.anesthesiaTypes || ['GA','SA','LA','REGIONAL','NONE']).map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                {label('Anesthesia Notes')}
                <textarea value={form.anesthesiaNotes} onChange={(e) => setForm((p) => ({ ...p, anesthesiaNotes: e.target.value }))} rows={2}
                  placeholder="Drugs used, any allergies, complications…"
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
          )}

          {/* Intraoperative */}
          {tab === 'intraop' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                {label('Intraoperative Notes')}
                <textarea value={form.intraopNotes} onChange={(e) => setForm((p) => ({ ...p, intraopNotes: e.target.value }))} rows={6}
                  placeholder="Procedure performed, surgical findings, technique used, blood loss, complications…"
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                {label('Consumables Used (JSON or free text)')}
                <textarea value={form.consumables} onChange={(e) => setForm((p) => ({ ...p, consumables: e.target.value }))} rows={3}
                  placeholder='[{"item":"Suture 2-0","qty":2},{"item":"Drain","qty":1}]'
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }} />
              </div>
            </div>
          )}

          {/* Post-op */}
          {tab === 'postop' && (
            <div>
              {label('Post-operative Orders')}
              <textarea value={form.postOpOrders} onChange={(e) => setForm((p) => ({ ...p, postOpOrders: e.target.value }))} rows={8}
                placeholder="1. Keep NPO for 6 hours&#10;2. IV fluids NS 500ml @ 40 drops/min&#10;3. Inj. Tramadol 50mg IM SOS for pain&#10;4. Monitor vitals every 30 min for 2 hrs&#10;5. Wound care: change dressing daily"
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Update Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OTSessionsPage() {
  const [sessions, setSessions]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [utilization, setUtil]    = useState(null);
  const [meta, setMeta]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [detail, setDetail]       = useState(null);
  const [statusFilter, setStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const [s, u, m] = await Promise.all([api(params), api('/utilization'), api('/meta')]);
      setSessions(s.sessions || []); setTotal(s.total || 0);
      setUtil(u); setMeta(m);
    } catch { toast.error('Failed to load OT sessions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#8b5cf620', borderRadius: 10, padding: 10 }}><Scissors size={24} color="#8b5cf6" /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Operation Theatre</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Module 22 — OT Scheduling, Clearance & Notes</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setScheduleModal(true)} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Schedule OT
          </button>
        </div>
      </div>

      {/* Stats */}
      {utilization && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: 'Total Sessions', value: utilization.total, color: 'var(--teal)' },
            { label: 'Scheduled', value: utilization.scheduled, color: '#3b82f6' },
            { label: 'Completed', value: utilization.completed, color: '#22c55e' },
            { label: 'Emergency', value: utilization.emergency, color: '#ef4444' },
            { label: 'Cancelled', value: utilization.cancelled, color: '#6b7280' },
            { label: 'Est. Total Hours', value: utilization.totalEstimatedMinutes ? `${(utilization.totalEstimatedMinutes / 60).toFixed(1)}h` : '—', color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, minWidth: 120, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ val: '', label: 'All' }, ...Object.entries(STATUS_META).map(([k, v]) => ({ val: k, label: v.label }))].map(({ val, label }) => (
          <button key={val} onClick={() => setStatus(val)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${statusFilter === val ? 'var(--teal)' : 'var(--border)'}`, background: statusFilter === val ? 'var(--teal)15' : 'transparent', color: statusFilter === val ? 'var(--teal)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: statusFilter === val ? 600 : 400 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 48 }}>Loading OT sessions…</div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          <Scissors size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>No OT sessions found. Schedule your first procedure.</p>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-1)' }}>
                {['Session #', 'Patient', 'Procedure', 'Surgeon', 'OT Room', 'Scheduled', 'Type', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => {
                const sm = STATUS_META[s.status] || STATUS_META.SCHEDULED;
                return (
                  <tr key={s.id} style={{ borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }} onClick={() => setDetail(s)}>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{s.sessionNumber}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.patientName}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>{s.procedureName}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{s.surgeonName}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{s.otRoom || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDT(s.scheduledDate)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: s.sessionType === 'EMERGENCY' ? '#ef444418' : '#3b82f618', color: s.sessionType === 'EMERGENCY' ? '#ef4444' : '#3b82f6', fontWeight: 600 }}>{s.sessionType}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: sm.bg, color: sm.color, fontWeight: 600 }}>{sm.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={(e) => { e.stopPropagation(); setDetail(s); }} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>Open</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {scheduleModal && <ScheduleModal meta={meta} onClose={() => setScheduleModal(false)} onSaved={load} />}
      {detail        && <DetailModal session={detail} meta={meta} onClose={() => setDetail(null)} onUpdated={load} />}
    </div>
  );
}
