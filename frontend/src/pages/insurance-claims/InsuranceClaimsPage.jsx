import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Shield, Plus, X, RefreshCw, TrendingDown } from 'lucide-react';

const authHdr = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
const api = (path, opts = {}) =>
  fetch(`/api/v1/insurance-claims${path}`, { headers: authHdr(), ...opts }).then((r) => r.json());

const fmt   = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const fmtDT = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_META = {
  PENDING:             { color: '#6b7280', bg: '#6b728018', label: 'Pending',          step: 1 },
  PRE_AUTH_REQUESTED:  { color: '#3b82f6', bg: '#3b82f618', label: 'Pre-Auth Req.',    step: 2 },
  PRE_AUTH_APPROVED:   { color: '#6366f1', bg: '#6366f118', label: 'Pre-Auth OK',      step: 3 },
  UNDER_QUERY:         { color: '#f59e0b', bg: '#f59e0b18', label: 'Under Query',       step: 2 },
  APPROVED:            { color: '#22c55e', bg: '#22c55e18', label: 'Approved',          step: 4 },
  REJECTED:            { color: '#ef4444', bg: '#ef444418', label: 'Rejected',          step: 5 },
  SETTLED:             { color: '#10b981', bg: '#10b98118', label: 'Settled',           step: 5 },
};

const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' };

// ── New Claim Modal ────────────────────────────────────────────────────────────
function NewClaimModal({ meta, onClose, onSaved }) {
  const [form, setForm] = useState({
    patientName: '', policyNumber: '', memberId: '', tpaName: '',
    insurerName: '', coverageAmount: '', isCashless: false, notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    if (!form.patientName.trim()) return toast.error('Patient name required');
    setSaving(true);
    try {
      const res = await api('/', { method: 'POST', body: JSON.stringify(form) });
      if (res.id) { toast.success(`Claim ${res.claimNumber} created`); onSaved(); onClose(); }
      else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>New Insurance Claim</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Patient Name *</label>
            <input value={form.patientName} onChange={set('patientName')} placeholder="Full name" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>TPA / Insurer</label>
            <select value={form.tpaName} onChange={set('tpaName')} style={inputStyle}>
              <option value="">Select…</option>
              {(meta?.tpaSchemes || []).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Insurance Company</label>
            <input value={form.insurerName} onChange={set('insurerName')} placeholder="Star Health, ICICI Lombard…" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Policy Number</label>
            <input value={form.policyNumber} onChange={set('policyNumber')} placeholder="POL/2024/XXXXX" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Member ID</label>
            <input value={form.memberId} onChange={set('memberId')} placeholder="Member ID" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Coverage Amount (₹)</label>
            <input type="number" value={form.coverageAmount} onChange={set('coverageAmount')} placeholder="500000" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
            <input type="checkbox" id="cashless" checked={form.isCashless} onChange={set('isCashless')} style={{ accentColor: 'var(--teal)', width: 16, height: 16 }} />
            <label htmlFor="cashless" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>Cashless Admission</label>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea value={form.notes} onChange={set('notes')} placeholder="Additional notes…" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Creating…' : 'Create Claim'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Update Claim Modal ─────────────────────────────────────────────────────────
function UpdateClaimModal({ claim, meta, onClose, onSaved }) {
  const [form, setForm] = useState({
    status: claim.status,
    preAuthCode: claim.preAuthCode || '',
    preAuthAmount: claim.preAuthAmount || '',
    claimedAmount: claim.claimedAmount || '',
    approvedAmount: claim.approvedAmount || '',
    rejectionReason: claim.rejectionReason || '',
    notes: claim.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await api(`/${claim.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      if (res.id) { toast.success('Claim updated'); onSaved(); onClose(); }
      else toast.error(res.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const s = STATUS_META[form.status] || STATUS_META.PENDING;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 540, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{claim.claimNumber}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {claim.patientName} · {claim.tpaName || '—'} · Policy: {claim.policyNumber || '—'}
            </div>
            {claim.isCashless && <span style={{ fontSize: 11, background: 'var(--teal)18', color: 'var(--teal)', padding: '1px 7px', borderRadius: 8, fontWeight: 600 }}>CASHLESS</span>}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Claim Status</label>
            <select value={form.status} onChange={set('status')} style={{ ...inputStyle, color: s.color, fontWeight: 600 }}>
              {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Pre-Auth Code</label>
            <input value={form.preAuthCode} onChange={set('preAuthCode')} placeholder="PA/2024/XXXXX" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Pre-Auth Amount (₹)</label>
            <input type="number" value={form.preAuthAmount} onChange={set('preAuthAmount')} placeholder="50000" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Claimed Amount (₹)</label>
            <input type="number" value={form.claimedAmount} onChange={set('claimedAmount')} placeholder="75000" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Approved Amount (₹)</label>
            <input type="number" value={form.approvedAmount} onChange={set('approvedAmount')} placeholder="70000" style={inputStyle} />
          </div>
          {form.status === 'REJECTED' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 11, color: '#ef4444', display: 'block', marginBottom: 4 }}>Rejection Reason *</label>
              <input value={form.rejectionReason} onChange={set('rejectionReason')} placeholder="Reason for rejection…" style={{ ...inputStyle, border: '1px solid #ef444450' }} />
            </div>
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea value={form.notes} onChange={set('notes')} placeholder="Communication log, follow-up notes…" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Update Claim'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function InsuranceClaimsPage() {
  const [claims, setClaims]   = useState([]);
  const [stats, setStats]     = useState(null);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [newModal, setNewModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(null);
  const [statusFilter, setStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const [c, st, m] = await Promise.all([api(params), api('/stats'), api('/meta')]);
      setClaims(c.claims || []); setStats(st); setMeta(m);
    } catch { toast.error('Failed to load claims'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#10b98120', borderRadius: 10, padding: 10 }}><Shield size={24} color="#10b981" /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Insurance & TPA</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Module 25 — Claim Tracking, Pre-Auth & Settlements</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setNewModal(true)} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> New Claim
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: 'Total Claims', value: stats.total, color: 'var(--teal)' },
            { label: 'Pending', value: stats.pending, color: '#f59e0b' },
            { label: 'Approved / Settled', value: stats.approved, color: '#22c55e' },
            { label: 'Rejected', value: stats.rejected, color: '#ef4444' },
            { label: 'Cashless', value: stats.cashless, color: '#3b82f6' },
            { label: 'Total Claimed', value: stats.totalClaimed > 0 ? `₹${(stats.totalClaimed / 1000).toFixed(0)}K` : '—', color: '#6366f1' },
            { label: 'Total Approved', value: stats.totalApproved > 0 ? `₹${(stats.totalApproved / 1000).toFixed(0)}K` : '—', color: '#10b981' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, minWidth: 110, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</div>
            </div>
          ))}
          {stats.rejectionRate > 0 && (
            <div style={{ flex: 1, minWidth: 130, background: '#ef444408', border: '1px solid #ef444430', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingDown size={16} color="#ef4444" />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{stats.rejectionRate}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Rejection Rate</div>
              </div>
            </div>
          )}
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
      {loading ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 48 }}>Loading claims…</div>
      : claims.length === 0 ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}><Shield size={48} style={{ opacity: 0.3, marginBottom: 12 }} /><p>No claims found.</p></div>
      : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-1)' }}>
                {['Claim #', 'Patient', 'TPA / Insurer', 'Policy No.', 'Claimed', 'Approved', 'Cashless', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map((c, i) => {
                const sm = STATUS_META[c.status] || STATUS_META.PENDING;
                return (
                  <tr key={c.id} style={{ borderBottom: i < claims.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }} onClick={() => setUpdateModal(c)}>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{c.claimNumber}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.patientName}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{c.tpaName || c.insurerName || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.policyNumber || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>{fmt(c.claimedAmount)}</td>
                    <td style={{ padding: '10px 14px', color: '#22c55e', fontWeight: c.approvedAmount ? 600 : 400 }}>{fmt(c.approvedAmount)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {c.isCashless && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'var(--teal)15', color: 'var(--teal)', fontWeight: 600 }}>Yes</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: sm.bg, color: sm.color, fontWeight: 600 }}>{sm.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={(e) => { e.stopPropagation(); setUpdateModal(c); }} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>Update</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {newModal    && <NewClaimModal meta={meta} onClose={() => setNewModal(false)} onSaved={load} />}
      {updateModal && <UpdateClaimModal claim={updateModal} meta={meta} onClose={() => setUpdateModal(null)} onSaved={load} />}
    </div>
  );
}
