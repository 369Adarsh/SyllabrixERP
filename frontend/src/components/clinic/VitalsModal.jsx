import { useState, useEffect } from 'react';
import { recordVitals, getVitalsByAppointment } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Activity, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Normal ranges for colour-coding
const RANGES = {
  bpSystolic:      { min: 90,  max: 140, unit: 'mmHg',  label: 'Systolic BP' },
  bpDiastolic:     { min: 60,  max: 90,  unit: 'mmHg',  label: 'Diastolic BP' },
  pulse:           { min: 60,  max: 100, unit: 'bpm',   label: 'Pulse' },
  temperature:     { min: 36.0, max: 37.5, unit: '°C',  label: 'Temperature' },
  weight:          { min: null, max: null, unit: 'kg',   label: 'Weight' },
  height:          { min: null, max: null, unit: 'cm',   label: 'Height' },
  spo2:            { min: 95,  max: 100, unit: '%',     label: 'SpO₂' },
  bloodGlucose:    { min: 70,  max: 140, unit: 'mg/dL', label: 'Blood Glucose' },
  respiratoryRate: { min: 12,  max: 20,  unit: '/min',  label: 'Resp. Rate' },
};

const flag = (key, val) => {
  if (val === '' || val === null || val === undefined) return 'normal';
  const r = RANGES[key];
  if (!r || r.min === null) return 'normal';
  const n = parseFloat(val);
  if (isNaN(n)) return 'normal';
  if (n < r.min || n > r.max) return 'abnormal';
  return 'normal';
};

const flagColor = (f) => f === 'abnormal' ? '#DC2626' : '#059669';

const BLANK = {
  bpSystolic: '', bpDiastolic: '', pulse: '', temperature: '',
  weight: '', height: '', spo2: '', bloodGlucose: '', respiratoryRate: '', notes: '',
};

export default function VitalsModal({ appointmentId, customerId, patientName, onClose, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState(null);

  useEffect(() => {
    if (!appointmentId) { setLoading(false); return; }
    getVitalsByAppointment(appointmentId)
      .then(r => {
        const v = r.data.data;
        if (v) {
          setExisting(v);
          setForm({
            bpSystolic:      v.bpSystolic      ?? '',
            bpDiastolic:     v.bpDiastolic     ?? '',
            pulse:           v.pulse           ?? '',
            temperature:     v.temperature     ?? '',
            weight:          v.weight          ?? '',
            height:          v.height          ?? '',
            spo2:            v.spo2            ?? '',
            bloodGlucose:    v.bloodGlucose    ?? '',
            respiratoryRate: v.respiratoryRate ?? '',
            notes:           v.notes           ?? '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const toNum = (v) => v === '' ? null : parseFloat(v);
  const toInt = (v) => v === '' ? null : parseInt(v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await recordVitals({
        customerId,
        appointmentId,
        bpSystolic:      toInt(form.bpSystolic),
        bpDiastolic:     toInt(form.bpDiastolic),
        pulse:           toInt(form.pulse),
        temperature:     toNum(form.temperature),
        weight:          toNum(form.weight),
        height:          toNum(form.height),
        spo2:            toInt(form.spo2),
        bloodGlucose:    toNum(form.bloodGlucose),
        respiratoryRate: toInt(form.respiratoryRate),
        notes:           form.notes || null,
        recordedBy:      user?.name || null,
      });
      toast.success(existing ? 'Vitals updated' : 'Vitals recorded');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vitals');
    } finally {
      setSaving(false);
    }
  };

  // BMI calculation
  const bmi = form.weight && form.height
    ? (parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)
    : null;
  const bmiCategory = bmi
    ? bmi < 18.5 ? { label: 'Underweight', color: '#F59E0B' }
    : bmi < 25   ? { label: 'Normal',       color: '#059669' }
    : bmi < 30   ? { label: 'Overweight',   color: '#F59E0B' }
    :              { label: 'Obese',         color: '#DC2626' }
    : null;

  const Field = ({ k, type = 'number', step, placeholder }) => {
    const f = flag(k, form[k]);
    return (
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span>{RANGES[k].label}</span>
          <span style={{ color: '#9CA3AF' }}>{RANGES[k].unit}</span>
        </div>
        <input
          type={type} step={step || (type === 'number' ? '0.1' : undefined)}
          value={form[k]} onChange={set(k)} placeholder={placeholder || '—'}
          style={{
            width: '100%', padding: '8px 10px', boxSizing: 'border-box',
            border: `1.5px solid ${form[k] !== '' ? flagColor(f) : 'var(--border)'}`,
            borderRadius: 8, fontSize: 13, outline: 'none',
            background: form[k] !== '' && f === 'abnormal' ? '#FEF2F2' : '#fff',
          }}
        />
      </div>
    );
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540,
        maxHeight: '90vh', overflowY: 'auto', zIndex: 401, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', background: 'var(--navy)', color: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={18} color="var(--cyan)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {existing ? 'Update Vitals' : 'Record Vitals'}
              </div>
              {patientName && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{patientName}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#fff' }}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Abnormal indicator */}
            {existing?.abnormal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px' }}>
                <AlertTriangle size={15} color="#DC2626" />
                <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>Some vitals are outside normal range</span>
              </div>
            )}

            {/* BP + Pulse */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blood Pressure & Pulse</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field k="bpSystolic"  step="1" placeholder="120" />
                <Field k="bpDiastolic" step="1" placeholder="80" />
                <Field k="pulse"       step="1" placeholder="72" />
              </div>
            </div>

            {/* Temperature + SpO2 + RR */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temperature & Oxygen</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field k="temperature"     step="0.1" placeholder="98.6" />
                <Field k="spo2"            step="1"   placeholder="99" />
                <Field k="respiratoryRate" step="1"   placeholder="16" />
              </div>
            </div>

            {/* Weight + Height + BMI */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weight & Height</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field k="weight" step="0.1" placeholder="65" />
                <Field k="height" step="0.5" placeholder="170" />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>BMI</div>
                  <div style={{ padding: '9px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {bmi
                      ? <><span style={{ fontWeight: 700, color: bmiCategory.color }}>{bmi}</span><span style={{ fontSize: 11, color: bmiCategory.color }}>{bmiCategory.label}</span></>
                      : <span style={{ color: '#9CA3AF' }}>Auto</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Blood Glucose */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blood Glucose</div>
              <div style={{ maxWidth: 200 }}>
                <Field k="bloodGlucose" step="0.1" placeholder="90" />
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Random blood glucose (non-fasting)</div>
            </div>

            {/* Notes */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Notes</div>
              <textarea value={form.notes} onChange={set('notes')} placeholder="Any observations…" rows={2}
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#9CA3AF' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={11} color="#059669" /> Normal</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} color="#DC2626" /> Outside normal range</span>
            </div>

            <button type="submit" disabled={saving} style={{
              padding: '12px 0', background: saving ? '#9CA3AF' : 'var(--navy)', color: '#fff',
              border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Activity size={15} />
              {saving ? 'Saving…' : (existing ? 'Update Vitals' : 'Save Vitals')}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
