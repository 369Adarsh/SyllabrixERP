import { useEffect, useState } from 'react';
import { getSACompliance, getSAComplianceStats, updateSACompliance, addSAComplianceFlag, removeSAComplianceFlag } from '../../api/platform';
import toast from 'react-hot-toast';

const KYC_COLOR = { PENDING: '#64748B', SUBMITTED: '#60A5FA', UNDER_REVIEW: '#F59E0B', VERIFIED: '#34D399', REJECTED: '#F87171' };
const RISK_COLOR = { LOW: '#34D399', MEDIUM: '#F59E0B', HIGH: '#F87171' };

const Badge = ({ children, color }) => (
  <span style={{ background: `${color}22`, color, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
    {typeof children === 'string' ? children.replace(/_/g, ' ') : children}
  </span>
);

const COMMON_FLAGS = ['MISSING_GST', 'MISSING_PAN', 'SUSPICIOUS_ACTIVITY', 'HIGH_CHARGEBACK', 'UNVERIFIED_DOCS', 'PENDING_TDS'];

export default function Compliance() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flagInput, setFlagInput] = useState('');
  const [flagNote, setFlagNote] = useState('');
  const [editForm, setEditForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([getSACompliance(), getSAComplianceStats()]);
      setRecords(r.data.data?.records || []);
      setStats(s.data.data);
    } catch { toast.error('Failed to load compliance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openRecord = (rec) => {
    setSelected(rec);
    setEditForm({ kycStatus: rec.kycStatus, riskLevel: rec.riskLevel, notes: rec.notes || '' });
  };

  const filtered = records.filter((r) =>
    !search || r.tenant?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateSACompliance(selected.tenantId, editForm);
      toast.success('Compliance updated');
      load();
      setSelected((prev) => ({ ...prev, ...editForm }));
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleAddFlag = async () => {
    const flag = flagInput.trim().toUpperCase().replace(/\s+/g, '_');
    if (!flag) return;
    try {
      await addSAComplianceFlag(selected.tenantId, { flag, note: flagNote.trim() || undefined });
      toast.success('Flag added');
      setFlagInput('');
      setFlagNote('');
      load();
    } catch { toast.error('Failed to add flag'); }
  };

  const handleRemoveFlag = async (flag) => {
    try {
      await removeSAComplianceFlag(selected.tenantId, flag);
      toast.success('Flag removed');
      load();
    } catch { toast.error('Failed to remove flag'); }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* List */}
      <div style={{ flex: selected ? '0 0 50%' : '1', padding: 28, overflowY: 'auto', borderRight: selected ? '1px solid #1E2D3D' : 'none' }}>
        {/* Stats */}
        {stats && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { l: 'Total', v: stats.total, c: '#64748B' },
              { l: 'KYC Verified', v: stats.kycVerified, c: '#34D399' },
              { l: 'KYC Pending', v: stats.kycPending, c: '#F59E0B' },
              { l: 'High Risk', v: stats.highRisk, c: '#F87171' },
              { l: 'Flagged', v: stats.flagged, c: '#A78BFA' },
            ].map((s) => (
              <div key={s.l} style={{ background: `${s.c}11`, border: `1px solid ${s.c}33`, borderRadius: 10, padding: '10px 14px', flex: 1, minWidth: 80 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.c, fontFamily: 'var(--font-display)' }}>{s.v ?? '—'}</div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#F1F5F9' }}>Compliance</h1>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search business…"
            style={inputStyle}
          />
        </div>

        {loading ? (
          <div style={{ color: '#64748B', fontSize: 14 }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((r) => (
              <div
                key={r.id}
                onClick={() => openRecord(r)}
                style={{
                  background: selected?.id === r.id ? 'rgba(31,184,214,0.08)' : '#192533',
                  border: `1px solid ${selected?.id === r.id ? '#1FB8D6' : '#1E2D3D'}`,
                  borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 4 }}>
                      {r.tenant?.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{r.tenant?.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Badge color={KYC_COLOR[r.kycStatus]}>{r.kycStatus}</Badge>
                    <Badge color={RISK_COLOR[r.riskLevel]}>{r.riskLevel} RISK</Badge>
                    {r.flags?.length > 0 && (
                      <span style={{ fontSize: 11, color: '#A78BFA', fontWeight: 700 }}>⚑ {r.flags.length} flag{r.flags.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ color: '#64748B', textAlign: 'center', padding: 40, fontSize: 14 }}>No records</div>}
          </div>
        )}
      </div>

      {/* Detail */}
      {selected && (
        <div style={{ flex: '0 0 50%', overflowY: 'auto', padding: 28, background: '#111C27' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#F1F5F9' }}>
                {selected.tenant?.name}
              </h2>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{selected.tenant?.email}</div>
            </div>
            <button onClick={() => setSelected(null)} style={closeBtn}>✕</button>
          </div>

          {/* KYC + Risk */}
          <SectionLabel>KYC Status</SectionLabel>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {Object.keys(KYC_COLOR).map((s) => (
              <button key={s} onClick={() => setEditForm((f) => ({ ...f, kycStatus: s }))}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: `1px solid ${editForm.kycStatus === s ? KYC_COLOR[s] : '#1E2D3D'}`,
                  background: editForm.kycStatus === s ? `${KYC_COLOR[s]}22` : '#192533',
                  color: editForm.kycStatus === s ? KYC_COLOR[s] : '#64748B',
                  fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <SectionLabel>Risk Level</SectionLabel>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {Object.keys(RISK_COLOR).map((r) => (
              <button key={r} onClick={() => setEditForm((f) => ({ ...f, riskLevel: r }))}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: `1px solid ${editForm.riskLevel === r ? RISK_COLOR[r] : '#1E2D3D'}`,
                  background: editForm.riskLevel === r ? `${RISK_COLOR[r]}22` : '#192533',
                  color: editForm.riskLevel === r ? RISK_COLOR[r] : '#64748B',
                  fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>
                {r}
              </button>
            ))}
          </div>

          <SectionLabel>Internal Notes</SectionLabel>
          <textarea
            value={editForm.notes}
            onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Internal compliance notes…"
            rows={3}
            style={{ ...inputStyle, width: '100%', resize: 'vertical', marginBottom: 12 }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '10px', border: 'none', borderRadius: 8, marginBottom: 24,
              background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)', color: '#0B131C',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>

          {/* Flags */}
          <SectionLabel>Compliance Flags</SectionLabel>
          {selected.flags?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {selected.flags.map((f) => (
                <div key={f.flag} style={{ background: '#192533', borderRadius: 8, border: '1px solid #A78BFA33', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: '#A78BFA', fontWeight: 700, fontSize: 13 }}>⚑ {f.flag}</span>
                    {f.note && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{f.note}</div>}
                  </div>
                  <button onClick={() => handleRemoveFlag(f.flag)} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #F8717133', borderRadius: 6, color: '#F87171', padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#64748B', fontSize: 13, marginBottom: 16 }}>No flags.</div>
          )}

          {/* Quick flags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {COMMON_FLAGS.map((f) => (
              <button key={f} onClick={() => setFlagInput(f)}
                style={{ padding: '4px 10px', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 6, color: '#64748B', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                {f}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={flagInput} onChange={(e) => setFlagInput(e.target.value)} placeholder="FLAG_NAME" style={{ ...inputStyle, flex: 1 }} />
            <input value={flagNote} onChange={(e) => setFlagNote(e.target.value)} placeholder="Note (optional)" style={{ ...inputStyle, flex: 2 }} />
            <button onClick={handleAddFlag} disabled={!flagInput.trim()}
              style={{ padding: '8px 14px', background: '#A78BFA22', border: '1px solid #A78BFA', borderRadius: 8, color: '#A78BFA', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              + Flag
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{children}</div>
);
const inputStyle = { padding: '8px 12px', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)' };
const closeBtn = { background: '#1E2D3D', border: 'none', borderRadius: 6, color: '#64748B', width: 28, height: 28, cursor: 'pointer', fontSize: 14 };
