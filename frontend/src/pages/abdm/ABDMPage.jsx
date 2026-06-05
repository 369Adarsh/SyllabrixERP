import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, QrCode, FileUp, Settings2, Users, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const authHdr = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
const api = (path, opts = {}) =>
  fetch(`/api/v1/abdm${path}`, { headers: authHdr(), ...opts }).then((r) => r.json());

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 160 }}>
      <div style={{ background: `${color}18`, borderRadius: 8, padding: 10 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── ABHA Update Modal ──────────────────────────────────────────────────────────
function AbhaModal({ patient, onClose, onSaved }) {
  const [abhaId, setAbhaId] = useState(patient.abhaId || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!abhaId.trim()) return toast.error('Enter ABHA ID');
    setSaving(true);
    try {
      const res = await api(`/patients/${patient.id}/abha`, {
        method: 'PATCH',
        body: JSON.stringify({ abhaId: abhaId.trim() }),
      });
      if (res.id) { toast.success('ABHA ID saved'); onSaved(); onClose(); }
      else toast.error(res.error || 'Failed to save');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 420 }}>
        <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>Link ABHA ID</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{patient.name} · {patient.phone}</p>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>ABHA ID / Health Account Number</label>
        <input
          value={abhaId} onChange={(e) => setAbhaId(e.target.value)}
          placeholder="XX-XXXX-XXXX-XXXX"
          style={{ width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }}
        />
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '6px 0 20px' }}>
          ABHA (Ayushman Bharat Health Account) is the patient's unique health ID under ABDM. Ask patient to scan their ABHA QR card.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            {saving ? 'Saving…' : 'Save ABHA ID'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Config Panel ───────────────────────────────────────────────────────────────
function ConfigPanel({ initial, onSave }) {
  const [form, setForm] = useState({
    hfrId: '', hprId: '', facilityName: '', doctorName: '', abdmEnabled: false,
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api('/config', { method: 'POST', body: JSON.stringify(form) });
      toast.success('ABDM config saved');
      onSave(form);
    } catch { toast.error('Failed to save config'); }
    finally { setSaving(false); }
  };

  const inp = (field) => ({
    value: form[field] || '',
    onChange: (e) => setForm((p) => ({ ...p, [field]: e.target.value })),
    style: { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' },
  });

  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Settings2 size={16} color="var(--teal)" />
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>ABDM Facility Configuration</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          ['hfrId', 'HFR Facility ID', 'Health Facility Registry ID'],
          ['hprId', 'HPR Doctor ID', 'Health Professional Registry ID'],
          ['facilityName', 'Facility Name (as registered)'],
          ['doctorName', 'Registered Doctor Name'],
        ].map(([field, label, placeholder]) => (
          <div key={field}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>
            <input {...inp(field)} placeholder={placeholder || ''} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <input type="checkbox" id="abdmEnabled" checked={!!form.abdmEnabled} onChange={(e) => setForm((p) => ({ ...p, abdmEnabled: e.target.checked }))} />
        <label htmlFor="abdmEnabled" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
          ABDM Compliance Active — display badge on clinic profile
        </label>
      </div>
      <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
        {saving ? 'Saving…' : 'Save Configuration'}
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ABDMPage() {
  const [stats, setStats]               = useState(null);
  const [patientsNoAbha, setPatients]   = useState([]);
  const [hrQueue, setHrQueue]           = useState({ prescriptions: [], labOrders: [] });
  const [config, setConfig]             = useState({});
  const [loading, setLoading]           = useState(true);
  const [abhaModal, setAbhaModal]       = useState(null);
  const [activeTab, setActiveTab]       = useState('overview');
  const [search, setSearch]             = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [s, p, h, c] = await Promise.all([
        api('/stats'),
        api('/patients/no-abha?limit=100'),
        api('/health-records/queue'),
        api('/config'),
      ]);
      setStats(s);
      setPatients(Array.isArray(p) ? p : []);
      setHrQueue(h);
      setConfig(c.config || {});
    } catch { toast.error('Failed to load ABDM data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const abhaColor = '#00b388';
  const filteredPatients = patientsNoAbha.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.phone || '').includes(search)
  );

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'patients', label: `Patients without ABHA (${stats?.withoutAbha ?? '…'})` },
    { id: 'records', label: 'Health Records Queue' },
    { id: 'config', label: 'Configuration' },
  ];

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ background: `${abhaColor}20`, borderRadius: 10, padding: 10 }}>
          <ShieldCheck size={24} color={abhaColor} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>ABDM / ABHA Integration</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Ayushman Bharat Digital Mission — Module 16</p>
        </div>
        {config.abdmEnabled && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: `${abhaColor}18`, border: `1px solid ${abhaColor}40`, borderRadius: 20, padding: '4px 12px' }}>
            <CheckCircle2 size={14} color={abhaColor} />
            <span style={{ fontSize: 12, color: abhaColor, fontWeight: 600 }}>ABDM Compliant</span>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      {stats && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <StatCard label="Total Patients" value={stats.total} color="var(--teal)" icon={Users} />
          <StatCard label="ABHA Linked" value={stats.withAbha} sub={`${stats.total > 0 ? ((stats.withAbha / stats.total) * 100).toFixed(0) : 0}% coverage`} color={abhaColor} icon={CheckCircle2} />
          <StatCard label="ABHA Pending" value={stats.withoutAbha} sub="Require ABHA linkage" color="#f59e0b" icon={AlertCircle} />
          <StatCard label="Records Ready to Push" value={(hrQueue.prescriptions?.length || 0) + (hrQueue.labOrders?.length || 0)} sub="Prescriptions + Lab reports" color="#6366f1" icon={FileUp} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '10px 18px', fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400,
            color: activeTab === t.id ? abhaColor : 'var(--text-secondary)',
            border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: activeTab === t.id ? `2px solid ${abhaColor}` : '2px solid transparent',
            marginBottom: -2, whiteSpace: 'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 48 }}>Loading ABDM data…</div>
      ) : (
        <>
          {/* Overview */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[
                { icon: QrCode, title: 'ABHA ID Capture', desc: 'Register patients with their Ayushman Bharat Health Account ID. Patient scans clinic QR — profile auto-populated.', status: 'Available' },
                { icon: FileUp, title: 'Health Record Push', desc: 'Push prescriptions and lab reports to patient\'s ABHA-linked health locker (consent-based).', status: 'Available' },
                { icon: ShieldCheck, title: 'Facility Registration (HFR)', desc: 'Register your clinic on the Health Facility Registry to appear on ABDM network.', status: config.hfrId ? 'Configured' : 'Needs Setup' },
                { icon: Users, title: 'Doctor Registration (HPR)', desc: 'Register doctors on the Health Professional Registry for ABDM compliance.', status: config.hprId ? 'Configured' : 'Needs Setup' },
              ].map((item) => (
                <div key={item.title} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <item.icon size={18} color={abhaColor} />
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: item.status === 'Available' || item.status === 'Configured' ? `${abhaColor}18` : '#f59e0b18', color: item.status === 'Available' || item.status === 'Configured' ? abhaColor : '#f59e0b', fontWeight: 600 }}>
                      {item.status}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--text-primary)' }}>{item.title}</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Patients without ABHA */}
          {activeTab === 'patients' && (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient name or phone…"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13 }}
                />
                <button onClick={load} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
              {filteredPatients.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 48 }}>
                  {patientsNoAbha.length === 0 ? 'All patients have ABHA IDs linked!' : 'No patients match search.'}
                </div>
              ) : (
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-1)' }}>
                        {['Patient Name', 'Phone', 'DOB', 'Gender', 'Action'].map((h) => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((p, i) => (
                        <tr key={p.id} style={{ borderBottom: i < filteredPatients.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{p.phone || '—'}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{fmtDate(p.dateOfBirth)}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{p.gender || '—'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <button onClick={() => setAbhaModal(p)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: `${abhaColor}15`, color: abhaColor, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                              + Link ABHA
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Health Records Queue */}
          {activeTab === 'records' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { label: 'Prescriptions', items: hrQueue.prescriptions || [], key: 'rxNumber', desc: 'diagnosis' },
                { label: 'Lab Reports', items: hrQueue.labOrders || [], key: 'orderNumber', desc: null },
              ].map(({ label, items, key, desc }) => (
                <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{label}</span>
                    <span style={{ fontSize: 12, background: 'var(--surface-2)', borderRadius: 10, padding: '2px 8px', color: 'var(--text-secondary)' }}>{items.length}</span>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {items.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>No records pending</div>
                    ) : items.map((item) => (
                      <div key={item.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.patientName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item[key]} {desc && item[desc] ? `· ${item[desc]}` : ''}</div>
                        </div>
                        <button style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#6366f115', color: '#6366f1', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                          Push to ABHA
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> ABHA health record push requires the National Health Authority (NHA) API integration to be activated. Once your facility is registered on HFR and API credentials are obtained, records above can be pushed to patients' ABHA-linked health lockers with one click.
                </p>
              </div>
            </div>
          )}

          {/* Config */}
          {activeTab === 'config' && (
            <ConfigPanel initial={config} onSave={setConfig} />
          )}
        </>
      )}

      {abhaModal && (
        <AbhaModal patient={abhaModal} onClose={() => setAbhaModal(null)} onSaved={load} />
      )}
    </div>
  );
}
