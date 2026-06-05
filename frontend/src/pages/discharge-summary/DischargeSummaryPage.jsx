import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { FileText, Search, Printer, RefreshCw, ChevronDown } from 'lucide-react';

const authHdr = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
const apiAdm  = (path, opts = {}) => fetch(`/api/v1/ipd-admissions${path}`, { headers: authHdr(), ...opts }).then((r) => r.json());

const fmt     = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDT   = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const CONDITION_OPTIONS = ['STABLE', 'IMPROVED', 'SATISFACTORY', 'CRITICAL', 'LAMA', 'REFERRED', 'DECEASED'];
const DISCHARGE_TYPES   = ['REGULAR', 'LAMA', 'ABSCONDED', 'TRANSFERRED', 'DECEASED'];

// ── Print-friendly summary component ──────────────────────────────────────────
function PrintSummary({ adm, form }) {
  return (
    <div id="discharge-print" style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#000', padding: 32, maxWidth: 680 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>DISCHARGE SUMMARY</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Syllabrix Healthcare</div>
      </div>

      {/* Patient Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14, fontSize: 12 }}>
        {[
          ['Patient Name', adm.patientName],
          ['Admission No.', adm.admissionNumber],
          ['Age / Gender', `${adm.patientAge || '—'} yrs / ${adm.patientGender || '—'}`],
          ['Phone', adm.patientPhone || '—'],
          ['Ward / Bed', `${adm.wardName || '—'} / ${adm.bedNumber || '—'}`],
          ['Admitting Doctor', adm.admittingDoctorName || '—'],
          ['Admission Date', fmtDT(adm.admissionDate)],
          ['Discharge Date', fmt(new Date())],
        ].map(([k, v]) => (
          <div key={k} style={{ borderBottom: '1px solid #eee', paddingBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>{k}:</span> {v}
          </div>
        ))}
      </div>

      {/* Clinical Content */}
      {[
        ['Admission Diagnosis', adm.admissionDiagnosis],
        ['Final Diagnosis at Discharge', form.diagnosisAtDischarge],
        ['History of Present Illness', form.historyOfIllness],
        ['Examination Findings on Admission', form.examinationFindings],
        ['Investigations Done', form.investigationsDone],
        ['Treatment Given', form.treatmentGiven],
        ['Operative Notes', form.operativeNotes],
        ['Discharge Medications', form.dischargeMedications],
        ['Follow-up Instructions', form.followUpInstructions],
        ['Follow-up Date', form.followUpDate ? fmt(form.followUpDate) : ''],
        ['Dietary Advice', form.dietaryAdvice],
      ].map(([label, value]) => value ? (
        <div key={label} style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, borderBottom: '1px solid #ccc', marginBottom: 4 }}>{label}</div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{value}</div>
        </div>
      ) : null)}

      {/* Condition at discharge */}
      <div style={{ margin: '16px 0', padding: 10, border: '1px solid #000', borderRadius: 4 }}>
        <strong>Condition at Discharge:</strong> {form.conditionAtDischarge} &nbsp;|&nbsp;
        <strong>Discharge Type:</strong> {form.dischargeType}
      </div>

      {/* Signature */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: 160, paddingTop: 4 }}>Patient / Attendant Signature</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: 160, paddingTop: 4 }}>Doctor Signature &amp; Seal</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DischargeSummaryPage() {
  const [admissions, setAdmissions] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [form, setForm] = useState({
    diagnosisAtDischarge: '', historyOfIllness: '', examinationFindings: '',
    investigationsDone: '', treatmentGiven: '', operativeNotes: '',
    dischargeMedications: '', followUpInstructions: '', followUpDate: '',
    dietaryAdvice: '', conditionAtDischarge: 'STABLE', dischargeType: 'REGULAR',
  });
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [preview, setPreview] = useState(false);

  const loadAdmissions = async () => {
    setLoading(true);
    try {
      const res = await apiAdm('?limit=200');
      setAdmissions(res.admissions || []);
    } catch { toast.error('Failed to load admissions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAdmissions(); }, []);

  const selectAdm = (adm) => {
    setSelected(adm);
    const ds = adm.dischargeSummary || {};
    setForm({
      diagnosisAtDischarge: ds.diagnosisAtDischarge || adm.admissionDiagnosis || '',
      historyOfIllness:     ds.historyOfIllness || '',
      examinationFindings:  ds.examinationFindings || '',
      investigationsDone:   ds.investigationsDone || '',
      treatmentGiven:       ds.treatmentGiven || '',
      operativeNotes:       ds.operativeNotes || '',
      dischargeMedications: ds.dischargeMedications || '',
      followUpInstructions: ds.followUpInstructions || '',
      followUpDate:         ds.followUpDate ? ds.followUpDate.slice(0, 10) : '',
      dietaryAdvice:        ds.dietaryAdvice || '',
      conditionAtDischarge: ds.conditionAtDischarge || 'STABLE',
      dischargeType:        adm.dischargeType || ds.dischargeType || 'REGULAR',
    });
    setPreview(false);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await apiAdm(`/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ dischargeSummary: form }),
      });
      if (res.id) toast.success('Discharge summary saved');
      else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const print = () => {
    const el = document.getElementById('discharge-print');
    if (!el) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Discharge Summary</title><style>body{margin:0;padding:0}@media print{body{margin:0}}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  const setF = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const inp = { style: { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' } };
  const ta = (rows = 3) => ({ ...inp, as: 'textarea', rows, style: { ...inp.style, resize: 'vertical' } });

  const filtered = admissions.filter((a) =>
    !search || a.patientName.toLowerCase().includes(search.toLowerCase()) || a.admissionNumber.includes(search)
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      {/* Left panel — admission list */}
      <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface-1)' }}>
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <FileText size={16} color="var(--teal)" />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Discharge Summary</span>
          </div>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient…"
            style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-0)', color: 'var(--text-primary)', fontSize: 12, boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24, fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24, fontSize: 13 }}>No admissions found</div>
          ) : filtered.map((adm) => (
            <button key={adm.id} onClick={() => selectAdm(adm)} style={{
              width: '100%', textAlign: 'left', padding: '10px 14px',
              background: selected?.id === adm.id ? 'var(--teal)15' : 'transparent',
              border: 'none', borderLeft: selected?.id === adm.id ? '3px solid var(--teal)' : '3px solid transparent',
              cursor: 'pointer',
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{adm.patientName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{adm.admissionNumber} · {fmt(adm.admissionDate)}</div>
              <div style={{ fontSize: 11, marginTop: 2 }}>
                <span style={{ padding: '1px 6px', borderRadius: 8, background: adm.dischargeSummary ? '#22c55e20' : '#f59e0b20', color: adm.dischargeSummary ? '#16a34a' : '#d97706', fontSize: 10, fontWeight: 600 }}>
                  {adm.dischargeSummary ? 'Summary Done' : 'Pending'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel — editor */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {!selected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 12, color: 'var(--text-secondary)' }}>
            <FileText size={48} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>Select a patient from the left to write or print their discharge summary</p>
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            {/* Toolbar */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'var(--surface-0)', position: 'sticky', top: 0, zIndex: 10 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{selected.patientName}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>{selected.admissionNumber}</span>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={() => setPreview(!preview)} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
                  {preview ? 'Edit' : 'Preview'}
                </button>
                <button onClick={print} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <Printer size={14} /> Print
                </button>
                <button onClick={save} disabled={saving} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                  {saving ? 'Saving…' : 'Save Summary'}
                </button>
              </div>
            </div>

            {preview ? (
              <div style={{ padding: 24, background: 'var(--surface-0)' }}>
                <PrintSummary adm={selected} form={form} />
              </div>
            ) : (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Patient info strip */}
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, fontSize: 12 }}>
                  {[
                    ['Ward / Bed', `${selected.wardName || '—'} / ${selected.bedNumber || '—'}`],
                    ['Admitting Doctor', selected.admittingDoctorName || '—'],
                    ['Admitted', fmtDT(selected.admissionDate)],
                    ['Advance Paid', selected.advanceAmount > 0 ? `₹${selected.advanceAmount.toLocaleString('en-IN')}` : 'None'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>{k}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Form fields */}
                {[
                  ['Diagnosis at Admission', 'diagnosisAtDischarge', 2, 'Final confirmed diagnosis'],
                  ['History of Present Illness', 'historyOfIllness', 3, 'Chief complaint, duration, associated symptoms…'],
                  ['Examination Findings on Admission', 'examinationFindings', 3, 'Vitals, general examination, systemic findings…'],
                  ['Investigations Done', 'investigationsDone', 3, 'CBC, LFT, RFT, ECG, X-Ray findings…'],
                  ['Treatment Given', 'treatmentGiven', 4, 'Medicines administered, procedures performed, IV fluids…'],
                  ['Operative Notes', 'operativeNotes', 2, 'Procedure name, technique, findings, complications (if any)'],
                  ['Discharge Medications', 'dischargeMedications', 3, 'Tab Paracetamol 500mg BD × 5 days…'],
                  ['Follow-up Instructions', 'followUpInstructions', 2, 'Rest, activity restrictions, wound care…'],
                  ['Dietary Advice', 'dietaryAdvice', 2, 'Low salt, diabetic diet, high protein…'],
                ].map(([label, key, rows, ph]) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                    <textarea value={form[key]} onChange={setF(key)} placeholder={ph} rows={rows}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />
                  </div>
                ))}

                {/* Bottom row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Condition at Discharge</label>
                    <select value={form.conditionAtDischarge} onChange={setF('conditionAtDischarge')} style={{ ...inp.style }}>
                      {CONDITION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Discharge Type</label>
                    <select value={form.dischargeType} onChange={setF('dischargeType')} style={{ ...inp.style }}>
                      {DISCHARGE_TYPES.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Follow-up Date</label>
                    <input type="date" value={form.followUpDate} onChange={setF('followUpDate')} style={{ ...inp.style }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
