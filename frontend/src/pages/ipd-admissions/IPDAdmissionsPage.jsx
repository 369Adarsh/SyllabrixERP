import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, Plus, X, RefreshCw, ChevronDown, ChevronUp, Stethoscope, FileText, Activity, Pill } from 'lucide-react';

const authHdr = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
const apiAdm = (path, opts = {}) =>
  fetch(`/api/v1/ipd-admissions${path}`, { headers: authHdr(), ...opts }).then((r) => r.json());
const apiWard = (path) =>
  fetch(`/api/v1/ipd-wards${path}`, { headers: authHdr() }).then((r) => r.json());

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_META = {
  ADMITTED:    { color: '#22c55e', bg: '#22c55e18', label: 'Admitted' },
  DISCHARGED:  { color: '#6b7280', bg: '#6b728018', label: 'Discharged' },
  TRANSFERRED: { color: '#3b82f6', bg: '#3b82f618', label: 'Transferred' },
  LAMA:        { color: '#f59e0b', bg: '#f59e0b18', label: 'LAMA' },
  ABSCONDED:   { color: '#ef4444', bg: '#ef444418', label: 'Absconded' },
  DECEASED:    { color: '#374151', bg: '#37415118', label: 'Deceased' },
};

const DISCHARGE_TYPES = ['REGULAR', 'LAMA', 'ABSCONDED', 'TRANSFERRED', 'DECEASED'];
const NOTE_TYPES      = ['PROGRESS', 'NIGHT', 'CRITICAL', 'ORDERS'];
const CHART_TYPES     = ['MAR', 'VITALS', 'IV_FLUID', 'INTAKE_OUTPUT'];

// ── Admit Modal ────────────────────────────────────────────────────────────────
function AdmitModal({ wards, onClose, onSaved }) {
  const [form, setForm] = useState({
    patientName: '', patientPhone: '', patientAge: '', patientGender: 'MALE',
    wardId: '', bedId: '', admittingDoctorName: '', admissionDiagnosis: '',
    isMLC: false, advanceAmount: '', attendantName: '', attendantPhone: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const selectedWard = wards.find((w) => w.id === form.wardId);
  const availableBeds = (selectedWard?.beds || []).filter((b) => b.status === 'AVAILABLE');

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    if (!form.patientName.trim()) return toast.error('Patient name required');
    setSaving(true);
    const payload = {
      ...form,
      wardName: selectedWard?.name || '',
      bedNumber: availableBeds.find((b) => b.id === form.bedId)?.bedNumber || '',
    };
    try {
      const res = await apiAdm('/', { method: 'POST', body: JSON.stringify(payload) });
      if (res.id) { toast.success(`Admission ${res.admissionNumber} created`); onSaved(); onClose(); }
      else toast.error(res.error || 'Failed to admit patient');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' };
  const label = (t) => <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{t}</label>;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 620, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Admit Patient</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            {label('Patient Name *')}
            <input value={form.patientName} onChange={set('patientName')} placeholder="Full name" style={inputStyle} />
          </div>
          <div>
            {label('Phone')}
            <input value={form.patientPhone} onChange={set('patientPhone')} placeholder="+91 XXXXX XXXXX" style={inputStyle} />
          </div>
          <div>
            {label('Age')}
            <input value={form.patientAge} onChange={set('patientAge')} type="number" placeholder="e.g. 45" style={inputStyle} />
          </div>
          <div>
            {label('Gender')}
            <select value={form.patientGender} onChange={set('patientGender')} style={inputStyle}>
              {['MALE', 'FEMALE', 'OTHER'].map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            {label('Ward')}
            <select value={form.wardId} onChange={set('wardId')} style={inputStyle}>
              <option value="">Select ward…</option>
              {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            {label('Bed (available only)')}
            <select value={form.bedId} onChange={set('bedId')} style={inputStyle} disabled={!form.wardId}>
              <option value="">Select bed…</option>
              {availableBeds.map((b) => <option key={b.id} value={b.id}>Bed {b.bedNumber} ({b.bedType})</option>)}
            </select>
          </div>
          <div>
            {label('Admitting Doctor')}
            <input value={form.admittingDoctorName} onChange={set('admittingDoctorName')} placeholder="Dr. Name" style={inputStyle} />
          </div>
          <div>
            {label('Advance Amount (₹)')}
            <input value={form.advanceAmount} onChange={set('advanceAmount')} type="number" placeholder="0" style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            {label('Admission Diagnosis')}
            <input value={form.admissionDiagnosis} onChange={set('admissionDiagnosis')} placeholder="Provisional diagnosis" style={inputStyle} />
          </div>
          <div>
            {label('Attendant Name')}
            <input value={form.attendantName} onChange={set('attendantName')} placeholder="Relative/guardian" style={inputStyle} />
          </div>
          <div>
            {label('Attendant Phone')}
            <input value={form.attendantPhone} onChange={set('attendantPhone')} placeholder="+91 XXXXX XXXXX" style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            {label('Notes')}
            <textarea value={form.notes} onChange={set('notes')} placeholder="Additional notes…" rows={2}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="mlc" checked={form.isMLC} onChange={set('isMLC')} />
            <label htmlFor="mlc" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
              MLC Case (Medico-Legal Case) — accident / assault
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Admitting…' : 'Admit Patient'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Progress Note Form ─────────────────────────────────────────────────────────
function AddNoteForm({ admId, onAdded }) {
  const [form, setForm] = useState({ doctorName: '', noteType: 'PROGRESS', findings: '', orders: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.doctorName.trim() || !form.findings.trim()) return toast.error('Doctor name and findings required');
    setSaving(true);
    try {
      const payload = { ...form, orders: form.orders ? [form.orders] : [] };
      const res = await apiAdm(`/${admId}/progress-notes`, { method: 'POST', body: JSON.stringify(payload) });
      if (res.id) { toast.success('Progress note added'); setForm({ doctorName: '', noteType: 'PROGRESS', findings: '', orders: '' }); onAdded(); }
      else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const inp = (f, el = 'input', rows = 2) => {
    const props = { value: form[f] || '', onChange: (e) => setForm((p) => ({ ...p, [f]: e.target.value })), style: { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-0)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' } };
    if (el === 'textarea') return { ...props, rows, style: { ...props.style, resize: 'vertical' } };
    return props;
  };

  return (
    <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <h4 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-primary)' }}>Add Progress Note</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Doctor Name *</label>
          <input {...inp('doctorName')} placeholder="Dr. Sharma" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Note Type</label>
          <select {...inp('noteType')} style={{ ...inp('noteType').style }}>
            {NOTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Clinical Findings / Examination *</label>
          <textarea {...inp('findings', 'textarea', 3)} placeholder="Vitals stable. Abdomen soft. No guarding…" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Orders / Instructions</label>
          <textarea {...inp('orders', 'textarea', 2)} placeholder="Continue Tab Paracetamol. Repeat CBC tomorrow. NPO after midnight…" />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          {saving ? 'Saving…' : 'Save Note'}
        </button>
      </div>
    </div>
  );
}

// ── Add Chart Form ─────────────────────────────────────────────────────────────
function AddChartForm({ admId, onAdded }) {
  const [chartType, setChartType] = useState('VITALS');
  const [recordedBy, setRecordedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [vitals, setVitals] = useState({ bp: '', pulse: '', temp: '', spo2: '', rr: '' });
  const [mar, setMar] = useState({ drug: '', dose: '', time: '', status: 'GIVEN', nurse: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!recordedBy.trim()) return toast.error('Nurse/staff name required');
    const chartData = chartType === 'VITALS' ? vitals : chartType === 'MAR' ? mar : { notes };
    setSaving(true);
    try {
      const res = await apiAdm(`/${admId}/nursing-charts`, {
        method: 'POST',
        body: JSON.stringify({ chartType, data: chartData, recordedBy, notes }),
      });
      if (res.id) {
        toast.success('Chart entry recorded');
        setRecordedBy(''); setNotes('');
        setVitals({ bp: '', pulse: '', temp: '', spo2: '', rr: '' });
        setMar({ drug: '', dose: '', time: '', status: 'GIVEN', nurse: '' });
        onAdded();
      } else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const inputStyle = { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-0)', color: 'var(--text-primary)', fontSize: 12, boxSizing: 'border-box' };

  return (
    <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <h4 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-primary)' }}>Add Chart Entry</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Chart Type</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)} style={inputStyle}>
            {CHART_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Recorded By *</label>
          <input value={recordedBy} onChange={(e) => setRecordedBy(e.target.value)} placeholder="Nurse Priya / Staff name" style={inputStyle} />
        </div>
      </div>

      {chartType === 'VITALS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 10 }}>
          {[['bp', 'BP (mmHg)', '120/80'], ['pulse', 'Pulse (/min)', '72'], ['temp', 'Temp (°C)', '37.0'], ['spo2', 'SpO₂ (%)', '98'], ['rr', 'RR (/min)', '18']].map(([k, lbl, ph]) => (
            <div key={k}>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>{lbl}</label>
              <input value={vitals[k]} onChange={(e) => setVitals((p) => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={inputStyle} />
            </div>
          ))}
        </div>
      )}

      {chartType === 'MAR' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[['drug', 'Drug Name', 'Tab Paracetamol 500mg'], ['dose', 'Dose', '1 tablet'], ['time', 'Time', '08:00']].map(([k, lbl, ph]) => (
            <div key={k}>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>{lbl}</label>
              <input value={mar[k]} onChange={(e) => setMar((p) => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={inputStyle} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Status</label>
            <select value={mar.status} onChange={(e) => setMar((p) => ({ ...p, status: e.target.value }))} style={inputStyle}>
              {['GIVEN', 'HELD', 'REFUSED', 'NOT_AVAILABLE'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
      )}

      {(chartType === 'IV_FLUID' || chartType === 'INTAKE_OUTPUT') && (
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Notes / Details</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            placeholder={chartType === 'IV_FLUID' ? 'NS 500ml @ 60 drops/min, started 10:00, completed 11:30' : 'Oral: 800ml, IV: 500ml | Urine: 600ml, Drain: 50ml'}
            style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save} disabled={saving} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          {saving ? 'Saving…' : 'Record Entry'}
        </button>
      </div>
    </div>
  );
}

// ── Admission Detail Modal ─────────────────────────────────────────────────────
function AdmissionDetail({ adm: initial, wards, onClose, onUpdated }) {
  const [adm, setAdm] = useState(initial);
  const [tab, setTab] = useState('overview');
  const [dischargeForm, setDischargeForm] = useState({ status: adm.status, dischargeType: 'REGULAR', dischargeSummary: { diagnosis: '', treatment: '', condition: 'STABLE' } });
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const res = await apiAdm(`/${adm.id}`);
    if (res.id) setAdm(res);
  };

  const discharge = async () => {
    if (!window.confirm('Confirm discharge / status update?')) return;
    setSaving(true);
    try {
      const res = await apiAdm(`/${adm.id}`, { method: 'PATCH', body: JSON.stringify(dischargeForm) });
      if (res.id) { toast.success('Status updated'); onUpdated(); onClose(); }
      else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const s = STATUS_META[adm.status] || STATUS_META.ADMITTED;
  const TABS = ['overview', 'rounds', 'nursing', 'discharge'];
  const TAB_LABELS = { overview: 'Overview', rounds: `Rounds (${adm.progressNotes?.length || 0})`, nursing: `Nursing Charts (${adm.nursingCharts?.length || 0})`, discharge: 'Discharge' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 12, width: '100%', maxWidth: 700, marginTop: 20 }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{adm.patientName}</span>
              {adm.isMLC && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#ef444420', color: '#ef4444', fontWeight: 700 }}>MLC</span>}
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{adm.admissionNumber} · Admitted {fmtDate(adm.admissionDate)}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 18px', fontSize: 13, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--teal)' : 'var(--text-secondary)',
              border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
              borderBottom: tab === t ? '2px solid var(--teal)' : '2px solid transparent', marginBottom: -1,
            }}>{TAB_LABELS[t]}</button>
          ))}
        </div>

        <div style={{ padding: 20, maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Overview */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Ward / Bed', `${adm.wardName || '—'} / Bed ${adm.bedNumber || '—'}`],
                ['Admitting Doctor', adm.admittingDoctorName || '—'],
                ['Diagnosis', adm.admissionDiagnosis || '—'],
                ['Age / Gender', `${adm.patientAge || '—'} yrs · ${adm.patientGender || '—'}`],
                ['Phone', adm.patientPhone || '—'],
                ['Advance Paid', adm.advanceAmount > 0 ? `₹${adm.advanceAmount.toLocaleString('en-IN')}` : 'None'],
                ['Attendant', adm.attendantName ? `${adm.attendantName} · ${adm.attendantPhone || ''}` : '—'],
                ['Admission Date', fmtDateTime(adm.admissionDate)],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--surface-1)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{v}</div>
                </div>
              ))}
              {adm.notes && (
                <div style={{ gridColumn: '1 / -1', background: 'var(--surface-1)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Notes</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{adm.notes}</div>
                </div>
              )}
            </div>
          )}

          {/* Daily Rounds / Progress Notes — Module 19 */}
          {tab === 'rounds' && (
            <div>
              <AddNoteForm admId={adm.id} onAdded={refresh} />
              {(adm.progressNotes || []).length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>No progress notes yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(adm.progressNotes || []).map((note) => (
                    <div key={note.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Stethoscope size={14} color="var(--teal)" />
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{note.doctorName}</span>
                          <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>{note.noteType}</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{fmtDateTime(note.noteDate)}</span>
                      </div>
                      {note.findings && (
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Findings</div>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{note.findings}</div>
                        </div>
                      )}
                      {note.orders && note.orders.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Orders</div>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{Array.isArray(note.orders) ? note.orders.join(', ') : JSON.stringify(note.orders)}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nursing Charts / MAR — Module 20 */}
          {tab === 'nursing' && (
            <div>
              <AddChartForm admId={adm.id} onAdded={refresh} />
              {(adm.nursingCharts || []).length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>No nursing chart entries yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(adm.nursingCharts || []).map((chart) => (
                    <div key={chart.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Activity size={14} color="#6366f1" />
                          <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{chart.chartType.replace('_', ' ')}</span>
                          {chart.recordedBy && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>by {chart.recordedBy}</span>}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{fmtDateTime(chart.chartDate)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--surface-0)', borderRadius: 6, padding: '8px 10px', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
                        {typeof chart.data === 'object' ? Object.entries(chart.data).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('  ·  ') : chart.data}
                      </div>
                      {chart.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{chart.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discharge */}
          {tab === 'discharge' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Update Status</label>
                <select value={dischargeForm.status} onChange={(e) => setDischargeForm((p) => ({ ...p, status: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13 }}>
                  {Object.keys(STATUS_META).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                </select>
              </div>
              {dischargeForm.status !== 'ADMITTED' && (
                <>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Discharge Type</label>
                    <select value={dischargeForm.dischargeType} onChange={(e) => setDischargeForm((p) => ({ ...p, dischargeType: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13 }}>
                      {DISCHARGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Discharge Diagnosis</label>
                    <input value={dischargeForm.dischargeSummary.diagnosis} onChange={(e) => setDischargeForm((p) => ({ ...p, dischargeSummary: { ...p.dischargeSummary, diagnosis: e.target.value } }))}
                      placeholder="Final diagnosis at discharge"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Treatment Given</label>
                    <textarea value={dischargeForm.dischargeSummary.treatment} onChange={(e) => setDischargeForm((p) => ({ ...p, dischargeSummary: { ...p.dischargeSummary, treatment: e.target.value } }))}
                      placeholder="Summary of treatment, procedures, medications…" rows={3}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Condition at Discharge</label>
                    <select value={dischargeForm.dischargeSummary.condition} onChange={(e) => setDischargeForm((p) => ({ ...p, dischargeSummary: { ...p.dischargeSummary, condition: e.target.value } }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13 }}>
                      {['STABLE', 'IMPROVED', 'CRITICAL', 'LAMA', 'REFERRED'].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </>
              )}
              <button onClick={discharge} disabled={saving || adm.status === dischargeForm.status}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: dischargeForm.status === 'ADMITTED' ? 'var(--teal)' : '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                {saving ? 'Updating…' : dischargeForm.status === 'ADMITTED' ? 'Update Status' : `Discharge as ${dischargeForm.dischargeType}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function IPDAdmissionsPage() {
  const [admissions, setAdmissions] = useState([]);
  const [total, setTotal]           = useState(0);
  const [census, setCensus]         = useState(null);
  const [wards, setWards]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [admitModal, setAdmitModal] = useState(false);
  const [detail, setDetail]         = useState(null);
  const [statusFilter, setStatusFilter] = useState('ADMITTED');

  const load = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}&limit=100` : '?limit=100';
      const [a, c, w] = await Promise.all([
        apiAdm(params),
        apiAdm('/census'),
        apiWard('/'),
      ]);
      setAdmissions(a.admissions || []);
      setTotal(a.total || 0);
      setCensus(c);
      setWards(Array.isArray(w) ? w : []);
    } catch { toast.error('Failed to load admissions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openDetail = async (adm) => {
    const full = await apiAdm(`/${adm.id}`);
    setDetail(full.id ? full : adm);
  };

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#22c55e20', borderRadius: 10, padding: 10 }}>
            <ClipboardList size={24} color="#22c55e" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>IPD Admissions</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Modules 18–20 — Admissions · Rounds · Nursing MAR</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setAdmitModal(true)} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Admit Patient
          </button>
        </div>
      </div>

      {/* Census */}
      {census && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: "Today's Admissions", value: census.admitted, color: '#22c55e' },
            { label: "Today's Discharges", value: census.discharged, color: '#6b7280' },
            { label: 'Current Inpatients', value: census.current, color: '#3b82f6' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, minWidth: 140, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ val: 'ADMITTED', label: 'Current' }, { val: '', label: 'All' }, ...Object.entries(STATUS_META).filter(([k]) => k !== 'ADMITTED').map(([k, v]) => ({ val: k, label: v.label }))].map(({ val, label }) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${statusFilter === val ? 'var(--teal)' : 'var(--border)'}`, background: statusFilter === val ? 'var(--teal)15' : 'transparent', color: statusFilter === val ? 'var(--teal)' : 'var(--text-secondary)', fontWeight: statusFilter === val ? 600 : 400, cursor: 'pointer', fontSize: 13 }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 48 }}>Loading admissions…</div>
      ) : admissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          <ClipboardList size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>No admissions found for the selected filter.</p>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-1)' }}>
                {['Adm #', 'Patient', 'Ward / Bed', 'Doctor', 'Diagnosis', 'Admitted', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admissions.map((adm, i) => {
                const s = STATUS_META[adm.status] || STATUS_META.ADMITTED;
                return (
                  <tr key={adm.id} style={{ borderBottom: i < admissions.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }} onClick={() => openDetail(adm)}>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{adm.admissionNumber}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{adm.patientName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{adm.patientAge ? `${adm.patientAge} yrs · ` : ''}{adm.patientGender || ''}</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{adm.wardName || '—'} / {adm.bedNumber || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{adm.admittingDoctorName || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adm.admissionDiagnosis || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(adm.admissionDate)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>
                      {adm.isMLC && <span style={{ fontSize: 10, marginLeft: 4, padding: '1px 5px', borderRadius: 4, background: '#ef444420', color: '#ef4444', fontWeight: 700 }}>MLC</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={(e) => { e.stopPropagation(); openDetail(adm); }}
                        style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {admitModal && <AdmitModal wards={wards} onClose={() => setAdmitModal(false)} onSaved={load} />}
      {detail    && <AdmissionDetail adm={detail} wards={wards} onClose={() => setDetail(null)} onUpdated={load} />}
    </div>
  );
}
