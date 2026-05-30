import { useEffect, useState } from 'react';
import { getSAOnboardingPipeline } from '../../api/platform';

const STAGES = [
  { key: 'NEW_SIGNUP',   label: 'New Signup',   color: '#64748B', icon: '🆕', desc: 'Registered, no KYC docs yet' },
  { key: 'SUBMITTED',    label: 'Docs Submitted', color: '#60A5FA', icon: '📄', desc: 'Documents uploaded, awaiting review' },
  { key: 'UNDER_REVIEW', label: 'Under Review',  color: '#F59E0B', icon: '🔍', desc: 'Being reviewed by compliance team' },
  { key: 'VERIFIED',     label: 'Verified',      color: '#34D399', icon: '✅', desc: 'KYC complete and approved' },
  { key: 'REJECTED',     label: 'Rejected',      color: '#F87171', icon: '❌', desc: 'KYC rejected, needs re-submission' },
];

const BT_LABEL = (bt) => bt.replace(/_/g, ' ');

export default function Onboarding() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('NEW_SIGNUP');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getSAOnboardingPipeline()
      .then(r => { setData(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 28, color: '#64748B', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #1FB8D6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      Loading pipeline…
    </div>
  );
  if (!data) return <div style={{ padding: 28, color: '#F87171' }}>Failed to load data.</div>;

  const stageTenants = data.stages[activeStage] || [];
  const stageInfo = STAGES.find(s => s.key === activeStage);
  const total = Object.values(data.summary).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
          Onboarding Pipeline
        </h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          {total} tenants across all stages
        </p>
      </div>

      {/* Pipeline stage cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
        {STAGES.map(s => {
          const count = data.summary[s.key.toLowerCase().replace(/_([a-z])/g, (_, l) => l.toUpperCase())] ?? data.stages[s.key]?.length ?? 0;
          const isActive = activeStage === s.key;
          return (
            <button
              key={s.key}
              onClick={() => { setActiveStage(s.key); setSelected(null); }}
              style={{
                flex: '0 0 auto', minWidth: 150, padding: '16px 20px',
                background: isActive ? `${s.color}18` : '#192533',
                border: `1px solid ${isActive ? s.color : '#1E2D3D'}`,
                borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#F1F5F9' : '#94A3B8', marginTop: 4 }}>{s.label}</div>
            </button>
          );
        })}

        {/* Flow arrow summary */}
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            {STAGES.slice(0, 4).map((s, i) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                {i < 3 && <div style={{ width: 1, height: 16, background: '#1E2D3D' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drop-off notice */}
      {activeStage === 'NEW_SIGNUP' && stageTenants.filter(t => t.daysSinceSignup > 7).length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#F59E0B', fontSize: 13 }}>
          ⚠️ {stageTenants.filter(t => t.daysSinceSignup > 7).length} tenants stuck in New Signup for more than 7 days — consider following up.
        </div>
      )}
      {activeStage === 'UNDER_REVIEW' && stageTenants.filter(t => t.daysSinceReview > 3).length > 0 && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#F87171', fontSize: 13 }}>
          🔴 {stageTenants.filter(t => t.daysSinceReview > 3).length} tenants stuck in review for more than 3 days — prioritise these.
        </div>
      )}

      {/* Two-panel layout */}
      <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 340px)', minHeight: 400 }}>
        {/* Left — tenant list */}
        <div style={{ width: 340, flexShrink: 0, background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E2D3D', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{stageInfo?.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: stageInfo?.color }}>{stageInfo?.label}</span>
            <span style={{ fontSize: 12, color: '#64748B', marginLeft: 'auto' }}>{stageTenants.length} tenants</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {stageTenants.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                No tenants in this stage.
              </div>
            )}
            {stageTenants.map(t => {
              const isSelected = selected?.id === t.id;
              const isStuck = (activeStage === 'UNDER_REVIEW' && t.daysSinceReview > 3) || (activeStage === 'NEW_SIGNUP' && t.daysSinceSignup > 7);
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  style={{
                    width: '100%', padding: '12px 16px', textAlign: 'left',
                    background: isSelected ? 'rgba(31,184,214,0.08)' : 'transparent',
                    border: 'none', borderBottom: '1px solid #1E2D3D',
                    cursor: 'pointer', transition: 'background 0.15s',
                    borderLeft: isSelected ? '3px solid #1FB8D6' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', marginBottom: 2 }}>{t.name}</div>
                    {isStuck && <span style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700, background: 'rgba(245,158,11,0.12)', padding: '2px 6px', borderRadius: 4 }}>STUCK</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{t.syllabrixId || t.email}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#475569', background: '#1E2D3D', padding: '2px 6px', borderRadius: 4 }}>{BT_LABEL(t.businessType)}</span>
                    <span style={{ fontSize: 10, color: '#64748B' }}>{t.daysSinceSignup}d since signup</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — detail panel */}
        <div style={{ flex: 1, background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', overflow: 'hidden' }}>
          {!selected ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Select a tenant to view details</div>
            </div>
          ) : (
            <div style={{ padding: 28, overflowY: 'auto', height: '100%' }}>
              {/* Tenant header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9', fontFamily: 'var(--font-display)', marginBottom: 4 }}>{selected.name}</h2>
                  <div style={{ fontSize: 13, color: '#64748B' }}>{selected.syllabrixId || selected.id}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: selected.isActive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: selected.isActive ? '#34D399' : '#F87171' }}>
                  {selected.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Email', value: selected.email },
                  { label: 'Business Type', value: BT_LABEL(selected.businessType) },
                  { label: 'Plan', value: selected.plan },
                  { label: 'Signed Up', value: new Date(selected.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                  { label: 'Days Since Signup', value: `${selected.daysSinceSignup} days` },
                  { label: 'Days Since Last Review', value: selected.daysSinceReview !== null ? `${selected.daysSinceReview} days` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#111C27', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* KYC Status */}
              <div style={{ background: '#111C27', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>KYC Status</div>
                {!selected.complianceRecord ? (
                  <p style={{ fontSize: 13, color: '#64748B' }}>No compliance record yet. Business has not submitted any documents.</p>
                ) : (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[
                      { label: 'KYC Status', value: selected.complianceRecord.kycStatus, color: stageInfo?.color },
                      { label: 'Risk Level', value: selected.complianceRecord.riskLevel, color: selected.complianceRecord.riskLevel === 'HIGH' ? '#F87171' : selected.complianceRecord.riskLevel === 'MEDIUM' ? '#F59E0B' : '#34D399' },
                      { label: 'GST Verified', value: selected.complianceRecord.gstVerified ? 'Yes' : 'No', color: selected.complianceRecord.gstVerified ? '#34D399' : '#64748B' },
                      { label: 'PAN Verified', value: selected.complianceRecord.panVerified ? 'Yes' : 'No', color: selected.complianceRecord.panVerified ? '#34D399' : '#64748B' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{label}</div>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stage progress */}
              <div style={{ background: '#111C27', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Pipeline Stage</div>
                <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                  {STAGES.map((s, i) => {
                    const isCurrent = s.key === activeStage;
                    const isPast = STAGES.findIndex(st => st.key === activeStage) > i;
                    return (
                      <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STAGES.length - 1 ? 1 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: isCurrent ? s.color : isPast ? '#34D399' : '#1E2D3D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                            {isPast ? '✓' : s.icon}
                          </div>
                          <span style={{ fontSize: 10, color: isCurrent ? s.color : '#475569', fontWeight: isCurrent ? 700 : 500, whiteSpace: 'nowrap' }}>{s.label}</span>
                        </div>
                        {i < STAGES.length - 1 && (
                          <div style={{ flex: 1, height: 2, background: isPast ? '#34D399' : '#1E2D3D', margin: '0 4px', marginBottom: 16 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
