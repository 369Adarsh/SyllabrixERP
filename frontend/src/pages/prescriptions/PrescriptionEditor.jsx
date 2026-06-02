import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getPrescriptionById, createPrescription, updatePrescription,
  searchDrugs,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Save, Printer, Plus, Trash2, Search, AlertTriangle,
  Pill, User, Stethoscope, Calendar, FileText, Activity, Send,
} from 'lucide-react';

const FREQUENCIES = [
  { code: 'OD',   label: 'OD — Once daily' },
  { code: 'BD',   label: 'BD — Twice daily' },
  { code: 'TDS',  label: 'TDS — Three times daily' },
  { code: 'QID',  label: 'QID — Four times daily' },
  { code: 'HS',   label: 'HS — At bedtime' },
  { code: 'SOS',  label: 'SOS — As needed' },
  { code: 'Stat', label: 'Stat — Immediately' },
  { code: 'OW',   label: 'OW — Once weekly' },
];

const DURATIONS = [
  '1 day', '2 days', '3 days', '5 days',
  '7 days (1 week)', '10 days', '14 days (2 weeks)',
  '21 days (3 weeks)', '28 days (1 month)',
  '2 months', '3 months', 'Continue till review',
];

const INSTRUCTIONS = [
  'After food', 'Before food', 'With water', 'Empty stomach',
  'With food', 'Avoid milk', 'Avoid alcohol', 'At bedtime',
  'In the morning', 'With warm water',
];

const DOSES = [
  '½ tablet', '1 tablet', '2 tablets', '½ teaspoon',
  '1 teaspoon', '2 teaspoons', '1 capsule', '2 capsules',
  '1 drop', '2 drops', '1 sachet', '1 injection',
  'As directed',
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function DrugSearchInput({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef();
  const debounce = useRef();

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleChange = (v) => {
    setQuery(v);
    clearTimeout(debounce.current);
    if (v.length < 2) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchDrugs(v);
        setResults(res.data || []);
        setOpen(true);
      } catch { /* noop */ }
      finally { setLoading(false); }
    }, 200);
  };

  const select = (drug) => {
    onSelect(drug);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input
          style={{ ...P.searchInput, paddingLeft: 34, width: '100%' }}
          placeholder="Search drug by generic or brand name…"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#9CA3AF' }}>
            searching…
          </span>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#fff', border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(30,43,60,0.12)',
          maxHeight: 300, overflowY: 'auto', marginTop: 4,
        }}>
          {results.map((drug, i) => (
            <button
              key={i}
              style={{
                display: 'flex', width: '100%', padding: '10px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', borderBottom: i < results.length - 1 ? '1px solid #F3F4F6' : 'none',
                gap: 12, alignItems: 'flex-start',
              }}
              onClick={() => select(drug)}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <Pill size={14} color="var(--cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>
                  {drug.generic}
                  {drug.strength && <span style={{ color: '#6B7280', marginLeft: 6 }}>{drug.strength}</span>}
                  <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--surface-2)', color: '#6B7280', borderRadius: 4, padding: '1px 5px' }}>
                    {drug.formulation}
                  </span>
                  {drug.scheduleH && (
                    <span style={{ marginLeft: 5, fontSize: 10, background: '#FEF3C7', color: '#D97706', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>
                      Sch-H
                    </span>
                  )}
                  {drug.scheduleX && (
                    <span style={{ marginLeft: 5, fontSize: 10, background: '#FEE2E2', color: '#DC2626', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>
                      Sch-X
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                  {drug.brand} · {drug.category}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DrugRow({ item, onChange, onRemove, index }) {
  const [open, setOpen] = useState(false);

  const field = (key, value) => onChange(index, key, value);

  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius-lg)',
      border: '1.5px solid var(--border)', padding: '14px 16px', position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: 'var(--navy)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            {index + 1}
          </span>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{item.drugName}</span>
          {item.brandName && <span style={{ fontSize: 12, color: '#6B7280' }}>({item.brandName})</span>}
          {item.formulation && (
            <span style={{ fontSize: 11, background: 'var(--surface-2)', color: '#6B7280', borderRadius: 4, padding: '1px 6px' }}>
              {item.formulation}
            </span>
          )}
          {item.strength && (
            <span style={{ fontSize: 11, background: '#EFF6FF', color: '#2563EB', borderRadius: 4, padding: '1px 6px', fontFamily: 'var(--font-mono)' }}>
              {item.strength}
            </span>
          )}
          {item.isScheduleH && (
            <span style={{ fontSize: 10, background: '#FEF3C7', color: '#D97706', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
              Sch-H
            </span>
          )}
          {item.isScheduleX && (
            <span style={{ fontSize: 10, background: '#FEE2E2', color: '#DC2626', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
              Sch-X ⚠
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            style={{ ...P.btn('ghost'), padding: '4px 8px', fontSize: 11, color: 'var(--cyan)' }}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Less' : 'Edit details'}
          </button>
          <button style={{ ...P.btn('danger'), padding: '4px 8px' }} onClick={() => onRemove(index)}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Compact summary row */}
      {!open && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { label: 'Dose', val: item.dose },
            { label: 'Freq', val: item.frequency },
            { label: 'Duration', val: item.duration },
            { label: 'Instructions', val: item.instructions },
          ].map(({ label, val }) => val ? (
            <span key={label} style={{ fontSize: 12, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 10px', color: '#374151' }}>
              <span style={{ color: '#9CA3AF', marginRight: 4 }}>{label}:</span>{val}
            </span>
          ) : null)}
          {!item.dose && !item.frequency && !item.duration && (
            <span style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>Click "Edit details" to set dosage</span>
          )}
        </div>
      )}

      {/* Expanded edit form */}
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 4 }}>
          <div>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Dose</label>
            <select
              value={item.dose || ''}
              onChange={(e) => field('dose', e.target.value)}
              style={{ ...P.input, width: '100%' }}
            >
              <option value="">Select dose…</option>
              {DOSES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Frequency</label>
            <select
              value={item.frequency || ''}
              onChange={(e) => field('frequency', e.target.value)}
              style={{ ...P.input, width: '100%' }}
            >
              <option value="">Select frequency…</option>
              {FREQUENCIES.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Duration</label>
            <select
              value={item.duration || ''}
              onChange={(e) => field('duration', e.target.value)}
              style={{ ...P.input, width: '100%' }}
            >
              <option value="">Select duration…</option>
              {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Instructions</label>
            <select
              value={item.instructions || ''}
              onChange={(e) => field('instructions', e.target.value)}
              style={{ ...P.input, width: '100%' }}
            >
              <option value="">Select…</option>
              {INSTRUCTIONS.map((ins) => <option key={ins} value={ins}>{ins}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PrescriptionEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, tenant } = useAuth();
  const isMobile = useBreakpoint();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState(user?.name || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [items, setItems] = useState([]);
  const [rxNumber, setRxNumber] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  useEffect(() => {
    if (!isNew) {
      (async () => {
        try {
          const res = await getPrescriptionById(id);
          const rx = res.data;
          setPatientName(rx.patientName || '');
          setPatientPhone(rx.patientPhone || '');
          setDoctorName(rx.doctorName || '');
          setDiagnosis(rx.diagnosis || '');
          setNotes(rx.notes || '');
          setFollowUpDate(rx.followUpDate ? rx.followUpDate.slice(0, 10) : '');
          setItems(rx.items || []);
          setRxNumber(rx.rxNumber);
          setCreatedAt(rx.createdAt);
          setStatus(rx.status);
        } catch {
          toast.error('Prescription not found');
          navigate('/prescriptions');
        } finally {
          setLoading(false);
        }
      })();
    }

    // Auto-trigger print mode if ?print=1
    if (searchParams.get('print') === '1') {
      // Brief delay to let state settle then print
      setTimeout(() => window.print(), 800);
    }
  }, [id]);

  const addDrug = (drug) => {
    setItems((prev) => [
      ...prev,
      {
        drugName: drug.generic,
        brandName: drug.brand || '',
        formulation: drug.formulation || '',
        strength: drug.strength || '',
        dose: '',
        frequency: '',
        duration: '',
        instructions: '',
        isScheduleH: drug.scheduleH ?? false,
        isScheduleX: drug.scheduleX ?? false,
      },
    ]);
    toast.success(`${drug.generic} added`);
  };

  const updateItem = useCallback((index, key, value) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }, []);

  const removeItem = useCallback((index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = async () => {
    if (!patientName.trim()) { toast.error('Patient name is required'); return; }
    if (!doctorName.trim()) { toast.error('Doctor name is required'); return; }
    if (items.length === 0) { toast.error('Add at least one drug to the prescription'); return; }

    setSaving(true);
    try {
      const payload = {
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim() || null,
        doctorName: doctorName.trim(),
        diagnosis: diagnosis.trim() || null,
        notes: notes.trim() || null,
        followUpDate: followUpDate || null,
        items,
      };

      if (isNew) {
        const res = await createPrescription(payload);
        toast.success(`Prescription ${res.data.rxNumber} created`);
        navigate(`/prescriptions/${res.data.id}`);
      } else {
        await updatePrescription(id, payload);
        toast.success('Prescription updated');
      }
    } catch {
      toast.error('Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div style={{ ...P.wrap(isMobile), display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <span style={{ color: '#9CA3AF' }}>Loading prescription…</span>
      </div>
    );
  }

  const hasScheduleX = items.some((i) => i.isScheduleX);

  return (
    <>
      {/* ── Print styles (CSS injected inline) ────────────────────────────────── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #rx-print-area, #rx-print-area * { visibility: visible !important; }
          #rx-print-area {
            position: fixed !important; top: 0 !important; left: 0 !important;
            width: 100% !important; background: #fff !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={P.wrap(isMobile)}>
        {/* Header */}
        <div style={{ ...P.head, marginBottom: 24 }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={P.btn('ghost')} onClick={() => navigate('/prescriptions')}>
              <ChevronLeft size={16} />
            </button>
            <div>
              <h1 style={P.h1(isMobile)}>
                {isNew ? 'New Prescription' : `Rx — ${rxNumber}`}
              </h1>
              {!isNew && (
                <p style={P.sub}>Created {fmtDate(createdAt)}</p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isNew && (
              <button style={P.btn('secondary')} onClick={handlePrint}>
                <Printer size={14} />
                Print
              </button>
            )}
            <button style={P.btn('primary')} onClick={handleSave} disabled={saving}>
              <Save size={14} />
              {saving ? 'Saving…' : isNew ? 'Create Prescription' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Schedule X warning */}
        {hasScheduleX && (
          <div className="no-print" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
            marginBottom: 16, color: '#DC2626', fontSize: 13,
          }}>
            <AlertTriangle size={16} />
            <strong>Schedule X drug(s) in this prescription.</strong> Manual override and documentation required as per law.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }} className="no-print">
          {/* Patient info */}
          <div style={P.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <User size={15} color="var(--cyan)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>Patient Details</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Patient Name *
                </label>
                <input
                  style={{ ...P.input, width: '100%', boxSizing: 'border-box' }}
                  placeholder="e.g., Ramesh Kumar"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Mobile Number
                </label>
                <input
                  style={{ ...P.input, width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }}
                  placeholder="10-digit mobile"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Doctor / Diagnosis */}
          <div style={P.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Stethoscope size={15} color="var(--cyan)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>Clinical Info</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Doctor Name *
                </label>
                <input
                  style={{ ...P.input, width: '100%', boxSizing: 'border-box' }}
                  placeholder="e.g., Dr. Sharma"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Diagnosis
                </label>
                <input
                  style={{ ...P.input, width: '100%', boxSizing: 'border-box' }}
                  placeholder="e.g., Type 2 Diabetes, URTI…"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Drug builder */}
        <div style={{ ...P.card, marginBottom: 16 }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Pill size={15} color="var(--cyan)" />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>Medicines</span>
            <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 4 }}>— search and add drugs</span>
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <DrugSearchInput onSelect={addDrug} />
            <button
              style={P.btn('secondary')}
              onClick={() => {
                const name = prompt('Enter drug name manually:');
                if (name?.trim()) {
                  setItems((prev) => [...prev, {
                    drugName: name.trim(), brandName: '', formulation: 'Tablet', strength: '',
                    dose: '', frequency: '', duration: '', instructions: '',
                    isScheduleH: false, isScheduleX: false,
                  }]);
                }
              }}
            >
              <Plus size={14} />
              Manual
            </button>
          </div>

          {/* Drug list */}
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9CA3AF' }}>
              <Pill size={32} color="#D1D5DB" />
              <p style={{ marginTop: 8, fontSize: 13 }}>No medicines added yet. Search for a drug above.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((item, i) => (
                <DrugRow key={i} item={item} index={i} onChange={updateItem} onRemove={removeItem} />
              ))}
            </div>
          )}
        </div>

        {/* Notes + Follow-up */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 24 }} className="no-print">
          <div style={P.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FileText size={14} color="var(--cyan)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>Additional Notes</span>
            </div>
            <textarea
              style={{ ...P.input, width: '100%', boxSizing: 'border-box', height: 80, resize: 'vertical' }}
              placeholder="Special instructions, advice, dietary recommendations…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div style={P.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Calendar size={14} color="var(--cyan)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>Follow-up Date</span>
            </div>
            <input
              type="date"
              style={{ ...P.input, width: '100%', boxSizing: 'border-box' }}
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
            {followUpDate && (
              <p style={{ fontSize: 12, color: '#059669', marginTop: 8 }}>
                Follow-up scheduled: {fmtDate(followUpDate)}
              </p>
            )}
          </div>
        </div>

        {/* Save footer (mobile) */}
        {isMobile && (
          <div className="no-print" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', gap: 10, zIndex: 50 }}>
            {!isNew && (
              <button style={{ ...P.btn('secondary'), flex: 1 }} onClick={handlePrint}>
                <Printer size={14} /> Print
              </button>
            )}
            <button style={{ ...P.btn('primary'), flex: 1 }} onClick={handleSave} disabled={saving}>
              <Save size={14} />
              {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* ── PRINT AREA ─────────────────────────────────────────────────────────── */}
      <div id="rx-print-area" style={{
        display: 'none',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        padding: '20px 32px', maxWidth: 680, margin: '0 auto',
        fontSize: 13, color: '#1A2535',
      }}>
        {/* Clinic header */}
        <div style={{ borderBottom: '2px solid var(--navy)', paddingBottom: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 20, fontFamily: "'Bricolage Grotesque', sans-serif", color: '#1E2B3C', letterSpacing: '-0.02em' }}>
            {tenant?.name || 'Clinic Name'}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            {doctorName && `Dr. ${doctorName}`}
            {tenant?.address && ` · ${tenant.address}`}
            {tenant?.phone && ` · ${tenant.phone}`}
          </div>
        </div>

        {/* Rx header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Patient: {patientName}</div>
            {patientPhone && <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{patientPhone}</div>}
            {diagnosis && <div style={{ fontSize: 12, marginTop: 4 }}>Diagnosis: <strong>{diagnosis}</strong></div>}
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: '#6B7280' }}>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#17B9D0', fontSize: 13 }}>{rxNumber || 'DRAFT'}</div>
            <div>{fmtDate(createdAt || new Date())}</div>
          </div>
        </div>

        {/* Rx symbol */}
        <div style={{ fontSize: 28, fontWeight: 900, color: '#1E2B3C', marginBottom: 12, letterSpacing: '-0.03em' }}>℞</div>

        {/* Drug list */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr style={{ background: '#F4F7FA', borderBottom: '1px solid #D5DCE8' }}>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: '#374151' }}>#</th>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: '#374151' }}>Medicine</th>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: '#374151' }}>Dose</th>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: '#374151' }}>Frequency</th>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: '#374151' }}>Duration</th>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: '#374151' }}>Instructions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <td style={{ padding: '8px 10px', color: '#9CA3AF', fontSize: 12 }}>{i + 1}</td>
                <td style={{ padding: '8px 10px' }}>
                  <div style={{ fontWeight: 700 }}>
                    {item.drugName}
                    {item.strength && <span style={{ marginLeft: 4, fontWeight: 400, color: '#6B7280' }}>{item.strength}</span>}
                  </div>
                  {item.formulation && <div style={{ fontSize: 11, color: '#6B7280' }}>{item.formulation}{item.brandName ? ` (${item.brandName})` : ''}</div>}
                  {(item.isScheduleH || item.isScheduleX) && (
                    <span style={{ fontSize: 10, background: '#FEF3C7', color: '#D97706', borderRadius: 3, padding: '0 4px' }}>
                      {item.isScheduleX ? 'Schedule X' : 'Schedule H'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '8px 10px', fontSize: 12 }}>{item.dose || '—'}</td>
                <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600 }}>{item.frequency || '—'}</td>
                <td style={{ padding: '8px 10px', fontSize: 12 }}>{item.duration || '—'}</td>
                <td style={{ padding: '8px 10px', fontSize: 12, color: '#6B7280' }}>{item.instructions || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Notes */}
        {notes && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#F4F7FA', borderRadius: 6, fontSize: 12 }}>
            <strong>Notes:</strong> {notes}
          </div>
        )}

        {/* Follow-up */}
        {followUpDate && (
          <div style={{ marginBottom: 16, fontSize: 12, color: '#059669' }}>
            <strong>Follow-up:</strong> {fmtDate(followUpDate)}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #D5DCE8', paddingTop: 14, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>
            <div>Generated by Syllabrix HMS</div>
            <div style={{ fontFamily: 'monospace', marginTop: 2 }}>{rxNumber || 'DRAFT'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ borderTop: '1px solid #1E2B3C', paddingTop: 6, minWidth: 140, fontSize: 12 }}>
              {doctorName ? `Dr. ${doctorName}` : 'Doctor Signature'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
