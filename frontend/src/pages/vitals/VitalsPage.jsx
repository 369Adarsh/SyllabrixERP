import { useState, useEffect, useCallback, useRef } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import { getCustomers, getVitalsByPatient } from '../../api';
import VitalsModal from '../../components/clinic/VitalsModal';
import {
  Activity, Search, AlertTriangle, CheckCircle2,
  User, Plus, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Normal ranges (mirrors backend) ──────────────────────────────────────────
const RANGES = {
  bpSystolic:      { min: 90,  max: 140, unit: 'mmHg', label: 'Systolic BP'   },
  bpDiastolic:     { min: 60,  max: 90,  unit: 'mmHg', label: 'Diastolic BP'  },
  pulse:           { min: 60,  max: 100, unit: 'bpm',  label: 'Pulse'          },
  temperature:     { min: 36.0, max: 37.5, unit: '°C', label: 'Temperature'   },
  spo2:            { min: 95,  max: 100, unit: '%',    label: 'SpO₂'          },
  weight:          { min: null, max: null, unit: 'kg', label: 'Weight'         },
  height:          { min: null, max: null, unit: 'cm', label: 'Height'         },
  bloodGlucose:    { min: 70,  max: 140, unit: 'mg/dL', label: 'Blood Glucose' },
  respiratoryRate: { min: 12,  max: 20,  unit: '/min', label: 'Resp. Rate'    },
};

const isAbnormal = (key, val) => {
  if (val === null || val === undefined) return false;
  const r = RANGES[key];
  if (!r || r.min === null) return false;
  return val < r.min || val > r.max;
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

const calcBMI = (w, h) => {
  if (!w || !h) return null;
  return (w / Math.pow(h / 100, 2)).toFixed(1);
};
const bmiCategory = (bmi) => {
  if (!bmi) return null;
  const b = parseFloat(bmi);
  if (b < 18.5) return { label: 'Underweight', color: '#F59E0B' };
  if (b < 25)   return { label: 'Normal',       color: '#059669' };
  if (b < 30)   return { label: 'Overweight',   color: '#F59E0B' };
  return              { label: 'Obese',          color: '#DC2626' };
};

// ── Vitals Chip ───────────────────────────────────────────────────────────────
function VitalChip({ label, value, unit, abnormal }) {
  if (value === null || value === undefined) return null;
  const color = abnormal ? '#DC2626' : '#059669';
  const bg    = abnormal ? '#FEF2F2' : '#F0FDF4';
  return (
    <div style={{ background: bg, border: `1px solid ${color}30`, borderRadius: 8, padding: '6px 10px', display: 'inline-flex', flexDirection: 'column', gap: 1, minWidth: 64 }}>
      <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{value}</span>
      <span style={{ fontSize: 9, color, fontWeight: 500 }}>{unit}</span>
    </div>
  );
}

// ── Vitals Row Card ───────────────────────────────────────────────────────────
function VitalsRow({ vitals, onRecord }) {
  const bmi     = calcBMI(vitals.weight, vitals.height);
  const bmiCat  = bmiCategory(bmi);
  const anyAbnormal = vitals.abnormal;

  return (
    <div style={{
      background: '#fff', border: `1.5px solid ${anyAbnormal ? '#FECACA' : '#E5E7EB'}`,
      borderLeft: `4px solid ${anyAbnormal ? '#DC2626' : '#10B981'}`,
      borderRadius: 12, padding: '14px 16px', marginBottom: 10,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{fmtDate(vitals.recordedAt)}</span>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{fmtTime(vitals.recordedAt)}</span>
          {vitals.recordedBy && <span style={{ fontSize: 11, color: '#9CA3AF' }}>by {vitals.recordedBy}</span>}
        </div>
        {anyAbnormal && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FEF2F2', borderRadius: 20, padding: '3px 10px' }}>
            <AlertTriangle size={11} color="#DC2626" />
            <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 700 }}>Abnormal</span>
          </div>
        )}
        {!anyAbnormal && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0FDF4', borderRadius: 20, padding: '3px 10px' }}>
            <CheckCircle2 size={11} color="#059669" />
            <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>Normal</span>
          </div>
        )}
      </div>

      {/* Vital chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {vitals.bpSystolic && vitals.bpDiastolic && (
          <VitalChip label="BP" value={`${vitals.bpSystolic}/${vitals.bpDiastolic}`} unit="mmHg"
            abnormal={isAbnormal('bpSystolic', vitals.bpSystolic) || isAbnormal('bpDiastolic', vitals.bpDiastolic)} />
        )}
        {vitals.pulse != null && <VitalChip label="Pulse" value={vitals.pulse} unit="bpm" abnormal={isAbnormal('pulse', vitals.pulse)} />}
        {vitals.temperature != null && <VitalChip label="Temp" value={vitals.temperature} unit="°C" abnormal={isAbnormal('temperature', vitals.temperature)} />}
        {vitals.spo2 != null && <VitalChip label="SpO₂" value={vitals.spo2} unit="%" abnormal={isAbnormal('spo2', vitals.spo2)} />}
        {vitals.respiratoryRate != null && <VitalChip label="RR" value={vitals.respiratoryRate} unit="/min" abnormal={isAbnormal('respiratoryRate', vitals.respiratoryRate)} />}
        {vitals.weight != null && <VitalChip label="Weight" value={vitals.weight} unit="kg" abnormal={false} />}
        {vitals.height != null && <VitalChip label="Height" value={vitals.height} unit="cm" abnormal={false} />}
        {bmi && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '6px 10px', display: 'inline-flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>BMI</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: bmiCat?.color, fontFamily: 'var(--font-mono)' }}>{bmi}</span>
            <span style={{ fontSize: 9, color: bmiCat?.color, fontWeight: 500 }}>{bmiCat?.label}</span>
          </div>
        )}
        {vitals.bloodGlucose != null && <VitalChip label="Glucose" value={vitals.bloodGlucose} unit="mg/dL" abnormal={isAbnormal('bloodGlucose', vitals.bloodGlucose)} />}
      </div>

      {vitals.notes && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#6B7280', fontStyle: 'italic', borderTop: '1px solid #F3F4F6', paddingTop: 8 }}>
          {vitals.notes}
        </div>
      )}
    </div>
  );
}

// ── Mini trend for BP / Pulse ─────────────────────────────────────────────────
function TrendBadge({ values, label, unit, color }) {
  if (!values?.length || values.length < 2) return null;
  const last  = values[0];
  const prev  = values[1];
  const diff  = last - prev;
  const Icon  = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
      <Icon size={13} color={diff > 0 ? '#DC2626' : diff < 0 ? '#059669' : '#9CA3AF'} />
      <span style={{ color: '#6B7280' }}>{label}:</span>
      <span style={{ fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{last} {unit}</span>
      {diff !== 0 && <span style={{ fontSize: 10, color: diff > 0 ? '#DC2626' : '#059669' }}>({diff > 0 ? '+' : ''}{diff})</span>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VitalsPage() {
  const { isMobile } = useBreakpoint();
  const [patientQuery, setPatientQuery] = useState('');
  const [patients,     setPatients]     = useState([]);
  const [showDrop,     setShowDrop]     = useState(false);
  const [selected,     setSelected]     = useState(null); // { id, name, phone }
  const [history,      setHistory]      = useState([]);
  const [loadingH,     setLoadingH]     = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const searchTimer = useRef(null);
  const wrapRef     = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Debounced patient search
  const searchPatients = useCallback((q) => {
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setPatients([]); setShowDrop(false); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await getCustomers({ search: q, limit: 8 });
        setPatients(r.data.data || []);
        setShowDrop(true);
      } catch { /* silent */ }
    }, 280);
  }, []);

  const loadHistory = useCallback(async (customerId) => {
    setLoadingH(true);
    setHistory([]);
    try {
      const r = await getVitalsByPatient(customerId, { limit: 20 });
      setHistory(r.data.data || []);
    } catch {
      toast.error('Failed to load vitals history');
    } finally {
      setLoadingH(false);
    }
  }, []);

  const selectPatient = (p) => {
    setSelected(p);
    setPatientQuery(`${p.name}${p.phone ? ` (${p.phone})` : ''}`);
    setShowDrop(false);
    loadHistory(p.id);
  };

  const clearPatient = () => {
    setSelected(null);
    setPatientQuery('');
    setHistory([]);
  };

  // Trend data
  const bpValues      = history.map(v => v.bpSystolic).filter(Boolean);
  const pulseValues   = history.map(v => v.pulse).filter(Boolean);
  const weightValues  = history.map(v => v.weight).filter(Boolean);
  const abnormalCount = history.filter(v => v.abnormal).length;

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Vitals</h1>
          <p style={P.sub}>Record and track patient vital signs</p>
        </div>
        {selected && (
          <button onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--navy)', color: '#fff', border: 'none',
            borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            <Plus size={14} /> Record Vitals
          </button>
        )}
      </div>

      {/* Patient search */}
      <div ref={wrapRef} style={{ position: 'relative', marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          <input
            value={patientQuery}
            onChange={e => { setPatientQuery(e.target.value); searchPatients(e.target.value); }}
            onFocus={() => patients.length > 0 && setShowDrop(true)}
            placeholder="Search patient by name or phone…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '11px 40px 11px 36px',
              border: '1.5px solid var(--border)', borderRadius: 10,
              fontSize: 14, outline: 'none',
              background: selected ? '#F0FDF4' : '#fff',
            }}
          />
          {selected && (
            <button onClick={clearPatient} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
              ×
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showDrop && patients.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)', marginTop: 4, maxHeight: 240, overflowY: 'auto',
          }}>
            {patients.map(p => (
              <button key={p.id} onMouseDown={() => selectPatient(p)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                textAlign: 'left', padding: '10px 14px', border: 'none',
                background: 'none', cursor: 'pointer', borderBottom: '1px solid #F9FAFB',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                  {p.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{p.name}</div>
                  {p.phone && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.phone}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* No patient selected */}
      {!selected && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', border: '1px solid var(--border)', borderRadius: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Activity size={28} color="#10B981" />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)', margin: '0 0 6px' }}>Search for a Patient</h3>
          <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>Type a patient name or phone number above to view their vitals history</p>
        </div>
      )}

      {/* Patient selected — show history */}
      {selected && (
        <>
          {/* Patient header */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>
                {selected.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy)' }}>{selected.name}</div>
                {selected.phone && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{selected.phone}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {history.length > 0 && (
                <>
                  <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Activity size={13} /> {history.length} recording{history.length !== 1 ? 's' : ''}
                  </div>
                  {abnormalCount > 0 && (
                    <div style={{ fontSize: 12, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 4, background: '#FEF2F2', padding: '3px 10px', borderRadius: 20 }}>
                      <AlertTriangle size={11} /> {abnormalCount} abnormal
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Trend summary (if ≥ 2 readings) */}
          {history.length >= 2 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <TrendBadge values={bpValues}     label="Systolic BP" unit="mmHg" color="#1D4ED8" />
              <TrendBadge values={pulseValues}   label="Pulse"       unit="bpm"  color="#7C3AED" />
              <TrendBadge values={weightValues}  label="Weight"      unit="kg"   color="#059669" />
            </div>
          )}

          {/* History list */}
          {loadingH ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading vitals history…</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', border: '1px solid var(--border)', borderRadius: 14 }}>
              <User size={28} style={{ color: '#D1D5DB', marginBottom: 12 }} />
              <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>No vitals recorded yet</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Record the first vitals for {selected.name}</div>
              <button onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={14} /> Record Vitals
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                History — most recent first
              </div>
              {history.map(v => (
                <VitalsRow key={v.id} vitals={v} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Vitals modal */}
      {showModal && selected && (
        <VitalsModal
          customerId={selected.id}
          patientName={selected.name}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadHistory(selected.id); }}
        />
      )}
    </div>
  );
}
