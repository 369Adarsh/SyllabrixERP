import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getAppointment, getCustomer, getClinicalNote, saveClinicalNote,
  getVitalsByAppointment, getPatientNoteHistory,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Save, AlertTriangle, Stethoscope, FileText,
  Calendar, User, Activity, Clock, FlaskConical, Pill,
} from 'lucide-react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const calcAge = (dob) => dob ? Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;

// SOAP section labels with descriptions
const SOAP_SECTIONS = [
  {
    key: 'soapS', label: 'S — Subjective', color: '#2563EB', bg: '#EFF6FF',
    placeholder: 'Chief complaint, history of present illness, duration, associated symptoms, review of systems…',
    hint: 'What the patient reports — in their own words',
  },
  {
    key: 'soapO', label: 'O — Objective', color: '#059669', bg: '#ECFDF5',
    placeholder: 'Examination findings, observations…\n\nVitals are shown below if recorded for this appointment.',
    hint: 'What you observe — examination findings',
  },
  {
    key: 'soapA', label: 'A — Assessment', color: '#D97706', bg: '#FFFBEB',
    placeholder: 'Working diagnosis or differential diagnoses…',
    hint: 'Your clinical judgment — diagnosis',
  },
  {
    key: 'soapP', label: 'P — Plan', color: '#7C3AED', bg: '#F5F3FF',
    placeholder: 'Treatment plan, medications, investigations ordered, patient education, referrals…',
    hint: 'Next steps — treatment, referrals, follow-up',
  },
];

function VitalsBadge({ label, value, unit, abnormal }) {
  if (value == null) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
      borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: abnormal ? '#FEE2E2' : '#F0FDF4',
      color: abnormal ? '#DC2626' : '#059669',
      border: `1px solid ${abnormal ? '#FECACA' : '#BBF7D0'}`,
    }}>
      {abnormal && <AlertTriangle size={10} />}
      {label}: <span style={{ fontFamily: 'var(--font-mono)' }}>{value}{unit}</span>
    </span>
  );
}

function PatientSidebar({ patient, vitals, noteHistory }) {
  const age = calcAge(patient?.dateOfBirth);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Identity */}
      <div style={{ background: 'var(--navy)', borderRadius: 12, padding: 16, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
            {patient?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>{patient?.name || '—'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
              {[age ? `${age} yrs` : null, patient?.gender === 'M' ? 'Male' : patient?.gender === 'F' ? 'Female' : patient?.gender].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {patient?.bloodGroup && (
            <span style={{ background: '#DC2626', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{patient.bloodGroup}</span>
          )}
          {patient?.phone && (
            <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>{patient.phone}</span>
          )}
        </div>
      </div>

      {/* Allergies — prominent warning */}
      {patient?.allergies?.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={11} /> Allergies
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {patient.allergies.map(a => (
              <span key={a} style={{ background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>⚠ {a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Chronic conditions */}
      {patient?.chronicConditions?.length > 0 && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Known Conditions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {patient.chronicConditions.map(c => (
              <span key={c} style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Vitals summary */}
      {vitals && (
        <div style={{ background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Activity size={11} color="var(--cyan)" /> Vitals {vitals.abnormal && <AlertTriangle size={10} color="#DC2626" />}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <VitalsBadge label="BP" value={vitals.bpSystolic && vitals.bpDiastolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : null} unit=" mmHg" abnormal={vitals.bpSystolic > 140 || vitals.bpDiastolic > 90} />
            <VitalsBadge label="Pulse" value={vitals.pulse} unit=" bpm" abnormal={vitals.pulse < 60 || vitals.pulse > 100} />
            <VitalsBadge label="Temp" value={vitals.temperature} unit="°C" abnormal={vitals.temperature < 36 || vitals.temperature > 37.5} />
            <VitalsBadge label="SpO₂" value={vitals.spo2} unit="%" abnormal={vitals.spo2 < 95} />
            <VitalsBadge label="Wt" value={vitals.weight} unit=" kg" abnormal={false} />
          </div>
        </div>
      )}

      {/* Note history */}
      {noteHistory.length > 0 && (
        <div style={{ background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} /> Past Visits
          </div>
          {noteHistory.map(n => (
            <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{fmtDate(n.createdAt)}{n.serviceName ? ` · ${n.serviceName}` : ''}</div>
              {n.soapA && <div style={{ fontSize: 12, color: '#374151', fontStyle: 'italic', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>Dx: {n.soapA}</div>}
              {n.followUpDate && <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>Follow-up: {fmtDate(n.followUpDate)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EMRPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();

  const [appt, setAppt]           = useState(null);
  const [patient, setPatient]     = useState(null);
  const [vitals, setVitals]       = useState(null);
  const [noteHistory, setHistory] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [savedAt, setSavedAt]     = useState(null);
  const [noteId, setNoteId]       = useState(null);

  const [form, setForm] = useState({
    soapS: '', soapO: '', soapA: '', soapP: '',
    diagnosisCode: '', followUpDate: '', followUpNotes: '',
  });

  const autoSaveTimer = useRef(null);

  const load = useCallback(async () => {
    if (!appointmentId) return;
    try {
      const apptRes = await getAppointment(appointmentId);
      const a = apptRes.data.data;
      setAppt(a);

      const [noteRes, vitalsRes] = await Promise.all([
        getClinicalNote(appointmentId),
        getVitalsByAppointment(appointmentId),
      ]);

      const note = noteRes.data.data;
      if (note) {
        setNoteId(note.id);
        setForm({
          soapS: note.soapS || '',
          soapO: note.soapO || '',
          soapA: note.soapA || '',
          soapP: note.soapP || '',
          diagnosisCode: note.diagnosisCode || '',
          followUpDate: note.followUpDate ? new Date(note.followUpDate).toISOString().split('T')[0] : '',
          followUpNotes: note.followUpNotes || '',
        });
      }
      setVitals(vitalsRes.data.data || null);

      if (a?.customerId) {
        const [patientRes, historyRes] = await Promise.all([
          getCustomer(a.customerId),
          getPatientNoteHistory(a.customerId, { limit: 5 }),
        ]);
        setPatient(patientRes.data.data);
        // Exclude current appointment from history
        setHistory((historyRes.data.data || []).filter(n => n.appointmentId !== appointmentId));
      }
    } catch (err) {
      toast.error('Failed to load EMR data');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => { load(); }, [load]);

  const doSave = useCallback(async (silent = false) => {
    if (!appointmentId || !appt) return;
    setSaving(true);
    try {
      await saveClinicalNote({
        appointmentId,
        customerId: appt.customerId || null,
        doctorId: user?.id || null,
        doctorName: user?.name || null,
        patientName: appt.customer?.name || null,
        serviceName: appt.service?.name || null,
        ...form,
        followUpDate: form.followUpDate || null,
      });
      setSavedAt(new Date());
      if (!silent) toast.success('Clinical note saved');
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [appointmentId, appt, form, user]);

  // Auto-save 4 seconds after last keystroke
  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [k]: val }));
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => doSave(true), 4000);
  };

  useEffect(() => () => clearTimeout(autoSaveTimer.current), []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9CA3AF' }}>
        Loading EMR…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px' : '24px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/appointments')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontWeight: 600 }}>
            <ChevronLeft size={14} /> Appointments
          </button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--navy)', margin: 0, letterSpacing: '-0.02em' }}>
              Clinical Note
            </h1>
            {appt && (
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Stethoscope size={11} />{appt.service?.name || appt.title}
                <span>·</span>
                <Calendar size={11} />{fmtDateTime(appt.startTime)}
                {appt.staff?.name && <><span>·</span><User size={11} />Dr. {appt.staff.name.replace(/^Dr\.?\s*/i, '')}</>}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {savedAt && (
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>
              Auto-saved {savedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          )}
          <button onClick={() => doSave(false)} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: saving ? '#9CA3AF' : 'var(--navy)', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer' }}>
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Note'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '260px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left: Patient sidebar */}
        {!isMobile && (
          <PatientSidebar patient={patient} vitals={vitals} noteHistory={noteHistory} />
        )}

        {/* Right: SOAP editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Mobile patient banner */}
          {isMobile && patient && (
            <div style={{ background: 'var(--navy)', borderRadius: 12, padding: '12px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
                {patient.name?.[0]}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{patient.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', gap: 6 }}>
                  {patient.bloodGroup && <span style={{ background: '#DC2626', color: '#fff', padding: '1px 7px', borderRadius: 20 }}>{patient.bloodGroup}</span>}
                  {patient.allergies?.map(a => <span key={a} style={{ color: '#FCA5A5' }}>⚠ {a}</span>)}
                </div>
              </div>
            </div>
          )}

          {/* SOAP sections */}
          {SOAP_SECTIONS.map((section) => (
            <div key={section.key} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: section.bg, borderBottom: `2px solid ${section.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: section.color, letterSpacing: '-0.01em' }}>{section.label}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>{section.hint}</div>
              </div>

              {/* Vitals inline under O section */}
              {section.key === 'soapO' && vitals && (
                <div style={{ padding: '10px 16px', background: '#F0FDF4', borderBottom: '1px solid #D1FAE5', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginRight: 4 }}>Recorded vitals:</span>
                  <VitalsBadge label="BP" value={vitals.bpSystolic && vitals.bpDiastolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : null} unit=" mmHg" abnormal={vitals.bpSystolic > 140 || vitals.bpDiastolic > 90} />
                  <VitalsBadge label="Pulse" value={vitals.pulse} unit=" bpm" abnormal={vitals.pulse < 60 || vitals.pulse > 100} />
                  <VitalsBadge label="Temp" value={vitals.temperature} unit="°C" abnormal={vitals.temperature < 36 || vitals.temperature > 37.5} />
                  <VitalsBadge label="SpO₂" value={vitals.spo2} unit="%" abnormal={vitals.spo2 < 95} />
                  <VitalsBadge label="Wt" value={vitals.weight} unit=" kg" abnormal={false} />
                  {vitals.bmi && <VitalsBadge label="BMI" value={vitals.bmi} unit="" abnormal={false} />}
                </div>
              )}

              <textarea
                value={form[section.key]}
                onChange={set(section.key)}
                placeholder={section.placeholder}
                rows={section.key === 'soapS' ? 5 : 4}
                style={{
                  width: '100%', padding: '14px 16px', border: 'none', resize: 'vertical',
                  fontSize: 14, fontFamily: 'var(--font-body)', lineHeight: 1.6,
                  color: 'var(--ink)', background: '#fff', boxSizing: 'border-box', outline: 'none',
                  minHeight: 100,
                }}
              />
            </div>
          ))}

          {/* Diagnosis code + Follow-up */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} /> Diagnosis & Follow-up
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Diagnosis Code <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(ICD-10 or free text)</span></div>
                <input value={form.diagnosisCode} onChange={set('diagnosisCode')} placeholder="e.g. J06.9 — Common cold"
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Follow-up Date</div>
                <input type="date" value={form.followUpDate} onChange={set('followUpDate')} min={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Follow-up Instructions</div>
                <textarea value={form.followUpNotes} onChange={set('followUpNotes')} rows={2} placeholder="Instructions for patient at follow-up visit…"
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
            </div>
          </div>

          {/* Quick action buttons — Modules 5 & 6 */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to={`/prescriptions/new?appointmentId=${appointmentId}&customerId=${appt?.customerId || ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#7C3AED', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              <Pill size={14} /> Write Prescription
            </Link>
            <Link to={`/lab-orders/new?appointmentId=${appointmentId}&customerId=${appt?.customerId || ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#0891B2', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              <FlaskConical size={14} /> Order Lab Tests
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
