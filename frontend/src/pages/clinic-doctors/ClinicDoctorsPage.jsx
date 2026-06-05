import { useState, useEffect } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import toast from 'react-hot-toast';
import { Stethoscope, Plus, Save, ChevronDown, X } from 'lucide-react';

const api = (path, opts = {}) =>
  fetch(`/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
    ...opts,
  }).then((r) => r.json());

const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function DoctorProfileModal({ staffId, staffName, onClose, onSave }) {
  const [profile, setProfile] = useState({ specialization: '', mciRegNumber: '', consultationFee: '', followUpFee: '', availableDays: [], morningStart: '', morningEnd: '', eveningStart: '', eveningEnd: '', bio: '', education: '', experience: '', languages: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api(`/clinic-doctors/${staffId}/profile`).then((res) => {
      if (res.profile) setProfile({ ...profile, ...res.profile, consultationFee: res.profile.consultationFee || '', followUpFee: res.profile.followUpFee || '', experience: res.profile.experience || '' });
    });
  }, [staffId]);

  const set = (k, v) => setProfile((p) => ({ ...p, [k]: v }));
  const toggleDay = (d) => set('availableDays', profile.availableDays.includes(d) ? profile.availableDays.filter((x) => x !== d) : [...profile.availableDays, d]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api(`/clinic-doctors/${staffId}/profile`, { method: 'POST', body: JSON.stringify(profile) });
      toast.success('Doctor profile saved');
      onSave();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 540, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy)' }}>Doctor Profile</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{staffName}</div>
          </div>
          <button style={P.btn('ghost')} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Specialization', key: 'specialization', full: true, placeholder: 'General Medicine, Pediatrics…' },
            { label: 'MCI Reg. Number', key: 'mciRegNumber', placeholder: 'State/Year/Number' },
            { label: 'Experience (years)', key: 'experience', type: 'number' },
            { label: 'Consultation Fee (₹)', key: 'consultationFee', type: 'number' },
            { label: 'Follow-up Fee (₹)', key: 'followUpFee', type: 'number' },
            { label: 'Education', key: 'education', full: true, placeholder: 'MBBS, MD (Medicine), etc.' },
          ].map(({ label, key, full, type, placeholder }) => (
            <div key={key} style={full ? { gridColumn: '1 / -1' } : {}}>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
              <input type={type || 'text'} style={{ ...P.input, width: '100%', boxSizing: 'border-box' }} placeholder={placeholder || ''} value={profile[key]} onChange={(e) => set(key, e.target.value)} />
            </div>
          ))}

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 8 }}>Available Days</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DAYS.map((d) => (
                <button key={d} onClick={() => toggleDay(d)} style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: profile.availableDays.includes(d) ? 'var(--navy)' : 'var(--surface-2)',
                  color: profile.availableDays.includes(d) ? '#fff' : '#6B7280',
                  border: 'none',
                }}>{d}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Morning OPD</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="time" style={{ ...P.input, flex: 1 }} value={profile.morningStart} onChange={(e) => set('morningStart', e.target.value)} />
              <span style={{ color: '#9CA3AF' }}>—</span>
              <input type="time" style={{ ...P.input, flex: 1 }} value={profile.morningEnd} onChange={(e) => set('morningEnd', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Evening OPD</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="time" style={{ ...P.input, flex: 1 }} value={profile.eveningStart} onChange={(e) => set('eveningStart', e.target.value)} />
              <span style={{ color: '#9CA3AF' }}>—</span>
              <input type="time" style={{ ...P.input, flex: 1 }} value={profile.eveningEnd} onChange={(e) => set('eveningEnd', e.target.value)} />
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Bio</label>
            <textarea style={{ ...P.input, width: '100%', boxSizing: 'border-box', height: 70, resize: 'vertical' }} placeholder="Short professional bio…" value={profile.bio} onChange={(e) => set('bio', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button style={P.btn('secondary')} onClick={onClose}>Cancel</button>
          <button style={P.btn('primary')} onClick={handleSave} disabled={saving}><Save size={13} /> {saving ? 'Saving…' : 'Save Profile'}</button>
        </div>
      </div>
    </div>
  );
}

export default function ClinicDoctorsPage() {
  const isMobile = useBreakpoint();
  const [doctors, setDoctors] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDoctor, setEditDoctor] = useState(null);

  const load = async () => {
    setLoading(true);
    const [docs, staff] = await Promise.all([
      api('/clinic-doctors'),
      api('/clinic-doctors/staff'),
    ]);
    setDoctors(docs.error ? [] : docs);
    setAllStaff(staff.error ? [] : staff);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={P.wrap(isMobile)}>
      {editDoctor && <DoctorProfileModal staffId={editDoctor.id} staffName={editDoctor.name} onClose={() => setEditDoctor(null)} onSave={() => { setEditDoctor(null); load(); }} />}

      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Clinic Doctors</h1>
          <p style={P.sub}>Module 9 — Doctor profiles, schedules, and fee setup</p>
        </div>
      </div>

      <div style={{ ...P.card, marginBottom: 16, padding: '12px 16px' }}>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
          Doctor profiles are linked to Staff records. Set up a staff member with role "DOCTOR" in the Staff module, then configure their clinical profile here.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {allStaff.filter((s) => ['DOCTOR', 'Doctor', 'doctor', 'Physician'].some((r) => s.role?.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(s.role?.toLowerCase()))).map((s) => (
            <button key={s.id} style={{ ...P.btn('secondary'), fontSize: 12, padding: '5px 12px' }} onClick={() => setEditDoctor(s)}>
              <Stethoscope size={11} color="var(--cyan)" /> {s.name} — setup profile
            </button>
          ))}
          {allStaff.length > 0 && allStaff.filter((s) => !['DOCTOR', 'Doctor', 'doctor'].includes(s.role)).slice(0, 3).map((s) => (
            <button key={s.id} style={{ ...P.btn('ghost'), fontSize: 12, padding: '5px 12px', color: '#9CA3AF' }} onClick={() => setEditDoctor(s)}>
              {s.name} ({s.role}) — setup
            </button>
          ))}
        </div>
      </div>

      <div style={P.tableWrap}>
        <div style={P.tableScroll}>
          <table style={P.table}>
            <thead style={P.thead}>
              <tr>
                <th style={P.th()}>Doctor</th>
                <th style={P.th()}>Specialization</th>
                <th style={P.th()}>MCI Reg #</th>
                <th style={P.th('right')}>Consult Fee</th>
                <th style={P.th()}>Available Days</th>
                <th style={P.th()}>Timings</th>
                <th style={P.th('center')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={P.empty}>Loading…</td></tr> :
                doctors.length === 0 ? (
                  <tr><td colSpan={7} style={P.empty}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <Stethoscope size={32} color="#D1D5DB" />
                      <span>No doctors found. Add staff with role "DOCTOR" in the Staff module.</span>
                    </div>
                  </td></tr>
                ) : (
                  doctors.map((d, i) => (
                    <tr key={d.id} style={P.tr(i, doctors.length)}>
                      <td style={P.td()}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</div>
                        {d.profile?.education && <div style={{ fontSize: 11, color: '#6B7280' }}>{d.profile.education}</div>}
                      </td>
                      <td style={P.td()}>{d.profile?.specialization || <span style={{ color: '#D1D5DB' }}>—</span>}</td>
                      <td style={{ ...P.td(), fontFamily: 'var(--font-mono)', fontSize: 11 }}>{d.profile?.mciRegNumber || '—'}</td>
                      <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)' }}>{d.profile?.consultationFee ? fmt(d.profile.consultationFee) : '—'}</td>
                      <td style={P.td()}>
                        {d.profile?.availableDays?.length > 0 ? (
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {d.profile.availableDays.map((day) => (
                              <span key={day} style={{ fontSize: 10, background: 'var(--surface-2)', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>{day}</span>
                            ))}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ ...P.td(), fontSize: 12, color: '#374151' }}>
                        {d.profile?.morningStart ? `${d.profile.morningStart}–${d.profile.morningEnd}` : '—'}
                        {d.profile?.eveningStart && ` / ${d.profile.eveningStart}–${d.profile.eveningEnd}`}
                      </td>
                      <td style={P.td('center')}>
                        <button style={{ ...P.btn('secondary'), padding: '4px 12px', fontSize: 11 }} onClick={() => setEditDoctor(d)}>Edit Profile</button>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
