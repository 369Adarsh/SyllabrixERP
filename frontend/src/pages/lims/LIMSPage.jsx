import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FlaskConical, Plus, X, RefreshCw, AlertTriangle, ChevronDown } from 'lucide-react';

const authHdr = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
const api = (path, opts = {}) =>
  fetch(`/api/v1/lims${path}`, { headers: authHdr(), ...opts }).then((r) => r.json());

const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_META = {
  COLLECTED:     { color: '#3b82f6', bg: '#3b82f618', label: 'Collected' },
  IN_PROCESSING: { color: '#f59e0b', bg: '#f59e0b18', label: 'Processing' },
  RESULTED:      { color: '#6366f1', bg: '#6366f118', label: 'Resulted' },
  REPORTED:      { color: '#22c55e', bg: '#22c55e18', label: 'Reported' },
  DELIVERED:     { color: '#6b7280', bg: '#6b728018', label: 'Delivered' },
};

const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' };

// ── New Sample Modal ───────────────────────────────────────────────────────────
function SampleModal({ tests, onClose, onSaved }) {
  const [patientName, setPatient] = useState('');
  const [collectedBy, setCollector] = useState('');
  const [selectedTests, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggleTest = (t) => setSelected((p) => p.some((x) => x.testCode === t.testCode) ? p.filter((x) => x.testCode !== t.testCode) : [...p, { testCode: t.testCode, testName: t.testName }]);

  const save = async () => {
    if (!patientName.trim()) return toast.error('Patient name required');
    if (!selectedTests.length) return toast.error('Select at least one test');
    setSaving(true);
    try {
      const res = await api('/samples', { method: 'POST', body: JSON.stringify({ patientName, collectedBy, testsOrdered: selectedTests }) });
      if (res.id) { toast.success(`Sample ${res.sampleNumber} collected`); onSaved(); onClose(); }
      else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const byCategory = tests.reduce((acc, t) => { (acc[t.category] = acc[t.category] || []).push(t); return acc; }, {});

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 580, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Collect Sample</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Patient Name *</label>
            <input value={patientName} onChange={(e) => setPatient(e.target.value)} placeholder="Full name" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Collected By</label>
            <input value={collectedBy} onChange={(e) => setCollector(e.target.value)} placeholder="Lab technician name" style={inputStyle} />
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Select Tests ({selectedTests.length} selected)</div>
        <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
          {Object.entries(byCategory).map(([cat, catTests]) => (
            <div key={cat}>
              <div style={{ padding: '7px 12px', background: 'var(--surface-1)', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{cat}</div>
              {catTests.map((t) => {
                const checked = selectedTests.some((x) => x.testCode === t.testCode);
                return (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer', background: checked ? 'var(--teal)08' : 'transparent', borderBottom: '1px solid var(--border)' }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleTest(t)} style={{ accentColor: 'var(--teal)' }} />
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{t.testName}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.testCode}</span>
                    <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>₹{t.price}</span>
                  </label>
                );
              })}
            </div>
          ))}
          {tests.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>No tests in catalog. Add tests first.</div>}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Collect Sample'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Result Entry Modal ─────────────────────────────────────────────────────────
function ResultModal({ sample, onClose, onSaved }) {
  const [entries, setEntries] = useState((sample.testsOrdered || []).map((t) => ({ ...t, value: '', unit: '', refRange: '', isAbnormal: false, isCritical: false, enteredBy: '' })));
  const [saving, setSaving] = useState(false);

  const setEntry = (i, k, v) => setEntries((p) => p.map((e, idx) => idx === i ? { ...e, [k]: v } : e));

  const save = async () => {
    const filled = entries.filter((e) => e.value.trim());
    if (!filled.length) return toast.error('Enter at least one result');
    setSaving(true);
    try {
      await Promise.all(filled.map((e) =>
        api(`/samples/${sample.id}/results`, { method: 'POST', body: JSON.stringify(e) })
      ));
      await api(`/samples/${sample.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'RESULTED' }) });
      toast.success('Results entered'); onSaved(); onClose();
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 640, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Enter Results</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{sample.sampleNumber} · {sample.patientName}</p>

        {entries.map((e, i) => (
          <div key={e.testCode} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 10 }}>{e.testName} <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>({e.testCode})</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['value','Result Value *','e.g. 12.5'], ['unit','Unit','g/dL'], ['refRange','Reference Range','12–16 g/dL']].map(([k, lbl, ph]) => (
                <div key={k}>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>{lbl}</label>
                  <input value={e[k]} onChange={(ev) => setEntry(i, k, ev.target.value)} placeholder={ph} style={{ ...inputStyle, background: 'var(--surface-0)' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
              {[['isAbnormal', 'Abnormal value', '#f59e0b'], ['isCritical', 'Critical / Panic value', '#ef4444']].map(([k, lbl, color]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12 }}>
                  <input type="checkbox" checked={e[k]} onChange={() => setEntry(i, k, !e[k])} style={{ accentColor: color }} />
                  <span style={{ color: e[k] ? color : 'var(--text-secondary)', fontWeight: e[k] ? 700 : 400 }}>{lbl}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Save Results'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function LIMSPage() {
  const [tab, setTab]           = useState('samples');
  const [samples, setSamples]   = useState([]);
  const [tests, setTests]       = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [sampleModal, setSampleModal] = useState(false);
  const [resultModal, setResultModal] = useState(null);
  const [statusFilter, setStatus] = useState('');

  // Add test form
  const [newTest, setNewTest] = useState({ testCode: '', testName: '', category: 'GENERAL', unit: '', refRangeLow: '', refRangeHigh: '', price: '', turnaroundHours: 24 });
  const [addingTest, setAddingTest] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const [s, t, st] = await Promise.all([api(`/samples${params}`), api('/tests'), api('/stats')]);
      setSamples(s.samples || []); setTests(Array.isArray(t) ? t : []); setStats(st);
    } catch { toast.error('Failed to load LIMS data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const addTest = async () => {
    if (!newTest.testCode.trim() || !newTest.testName.trim()) return toast.error('Test code and name required');
    setAddingTest(true);
    try {
      const res = await api('/tests', { method: 'POST', body: JSON.stringify(newTest) });
      if (res.id) { toast.success('Test added to catalog'); setNewTest({ testCode: '', testName: '', category: 'GENERAL', unit: '', refRangeLow: '', refRangeHigh: '', price: '', turnaroundHours: 24 }); load(); }
      else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setAddingTest(false); }
  };

  const updateStatus = async (id, status) => {
    try { await api(`/samples/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); toast.success('Status updated'); load(); }
    catch { toast.error('Failed'); }
  };

  const CATEGORIES = ['GENERAL', 'HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'SEROLOGY', 'URINE', 'HISTOPATHOLOGY'];

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#06b6d420', borderRadius: 10, padding: 10 }}><FlaskConical size={24} color="#06b6d4" /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>LIMS — Laboratory</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Module 23 — Sample Tracking, Results & Reports</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {tab === 'samples' && (
            <button onClick={() => setSampleModal(true)} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Collect Sample
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: 'Total Samples', value: stats.total, color: 'var(--teal)' },
            { label: 'Pending', value: stats.pending, color: '#f59e0b' },
            { label: 'Reported', value: stats.reported, color: '#22c55e' },
            { label: 'Critical Alerts', value: stats.critical, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, minWidth: 130, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
              {label === 'Critical Alerts' && value > 0 && <AlertTriangle size={16} color="#ef4444" style={{ marginLeft: 'auto' }} />}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 20 }}>
        {[{ id: 'samples', label: 'Sample Tracking' }, { id: 'catalog', label: 'Test Catalog' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? '#06b6d4' : 'var(--text-secondary)', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: tab === t.id ? '2px solid #06b6d4' : '2px solid transparent', marginBottom: -2 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Sample Tracking */}
      {tab === 'samples' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {[{ val: '', label: 'All' }, ...Object.entries(STATUS_META).map(([k, v]) => ({ val: k, label: v.label }))].map(({ val, label }) => (
              <button key={val} onClick={() => setStatus(val)}
                style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${statusFilter === val ? 'var(--teal)' : 'var(--border)'}`, background: statusFilter === val ? 'var(--teal)15' : 'transparent', color: statusFilter === val ? 'var(--teal)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: statusFilter === val ? 600 : 400 }}>
                {label}
              </button>
            ))}
          </div>
          {loading ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 48 }}>Loading…</div>
          : samples.length === 0 ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}><FlaskConical size={40} style={{ opacity: 0.3, marginBottom: 10 }} /><p>No samples found.</p></div>
          : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-1)' }}>
                    {['Sample #', 'Patient', 'Tests', 'Collected By', 'Collected At', 'Status', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {samples.map((s, i) => {
                    const sm = STATUS_META[s.status] || STATUS_META.COLLECTED;
                    const hasCritical = (s.results || []).some((r) => r.isCritical);
                    return (
                      <tr key={s.id} style={{ borderBottom: i < samples.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                          {s.sampleNumber}
                          {hasCritical && <AlertTriangle size={12} color="#ef4444" style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.patientName}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>
                          {(s.testsOrdered || []).map((t) => t.testName).join(', ')}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{s.collectedBy || '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDT(s.collectedAt)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: sm.bg, color: sm.color, fontWeight: 600 }}>{sm.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {s.status === 'COLLECTED' && (
                              <button onClick={() => updateStatus(s.id, 'IN_PROCESSING')} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', fontSize: 11, cursor: 'pointer', color: 'var(--text-secondary)' }}>→ Processing</button>
                            )}
                            {s.status === 'IN_PROCESSING' && (
                              <button onClick={() => setResultModal(s)} style={{ padding: '4px 10px', borderRadius: 5, border: 'none', background: 'var(--teal)', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Enter Results</button>
                            )}
                            {s.status === 'RESULTED' && (
                              <button onClick={() => updateStatus(s.id, 'REPORTED')} style={{ padding: '4px 10px', borderRadius: 5, border: 'none', background: '#22c55e', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Mark Reported</button>
                            )}
                            {s.status === 'REPORTED' && (
                              <button onClick={() => updateStatus(s.id, 'DELIVERED')} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', fontSize: 11, cursor: 'pointer', color: 'var(--text-secondary)' }}>Delivered</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Test Catalog */}
      {tab === 'catalog' && (
        <div>
          {/* Add test form */}
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Add Test to Catalog</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 10 }}>
              {[['testCode', 'Test Code *', 'e.g. CBC'], ['testName', 'Test Name *', 'Complete Blood Count'], ['unit', 'Unit', 'g/dL'], ['refRangeLow', 'Ref Low', '12'], ['refRangeHigh', 'Ref High', '16'], ['price', 'Price (₹)', '200']].map(([k, lbl, ph]) => (
                <div key={k}>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>{lbl}</label>
                  <input value={newTest[k] || ''} onChange={(e) => setNewTest((p) => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={{ ...inputStyle, background: 'var(--surface-0)' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Category</label>
                <select value={newTest.category} onChange={(e) => setNewTest((p) => ({ ...p, category: e.target.value }))} style={{ ...inputStyle, background: 'var(--surface-0)' }}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button onClick={addTest} disabled={addingTest} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              {addingTest ? 'Adding…' : '+ Add Test'}
            </button>
          </div>

          {/* Catalog list grouped by category */}
          {(() => {
            const byCategory = tests.reduce((acc, t) => { (acc[t.category] = acc[t.category] || []).push(t); return acc; }, {});
            return Object.entries(byCategory).map(([cat, catTests]) => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{cat} ({catTests.length})</div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ background: 'var(--surface-1)' }}>{['Code', 'Test Name', 'Unit', 'Ref Range', 'TAT (hrs)', 'Price', ''].map((h) => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11, borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {catTests.map((t, i) => (
                        <tr key={t.id} style={{ borderBottom: i < catTests.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{t.testCode}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>{t.testName}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{t.unit || '—'}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{t.refRangeLow != null && t.refRangeHigh != null ? `${t.refRangeLow}–${t.refRangeHigh}` : t.referenceText || '—'}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{t.turnaroundHours}h</td>
                          <td style={{ padding: '8px 12px', color: 'var(--teal)', fontWeight: 600 }}>₹{t.price}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <button onClick={() => api(`/tests/${t.id}`, { method: 'DELETE' }).then(load)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ));
          })()}
          {tests.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No tests in catalog yet.</div>}
        </div>
      )}

      {sampleModal && <SampleModal tests={tests} onClose={() => setSampleModal(false)} onSaved={load} />}
      {resultModal  && <ResultModal sample={resultModal} onClose={() => setResultModal(null)} onSaved={load} />}
    </div>
  );
}
