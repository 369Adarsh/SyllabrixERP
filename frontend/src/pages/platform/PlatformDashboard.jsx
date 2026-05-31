import { useEffect, useState } from 'react';
import { getSAPlatformDashboard, getSAComplianceStats, getSAAuditReports, getActivityActiveTenants, seedDemoData } from '../../api/platform';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, sub, accent = '#1FB8D6', icon }) => (
  <div style={{
    background: '#192533', borderRadius: 12, padding: '20px 24px',
    border: '1px solid #1E2D3D', flex: 1, minWidth: 160,
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, marginTop: 6 }} />
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: '#F1F5F9', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
      {value ?? '—'}
    </div>
    <div style={{ fontSize: 13, color: '#64748B', marginTop: 6, fontWeight: 500 }}>{label}</div>
    {sub && <div style={{ fontSize: 12, color: accent, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
  </div>
);

const PlanBadge = ({ plan }) => {
  const colors = { FREE: '#64748B', STARTER: '#34D399', GROWTH: '#60A5FA', SCALE: '#A78BFA' };
  return (
    <span style={{
      background: `${colors[plan] || '#64748B'}22`, color: colors[plan] || '#64748B',
      padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
    }}>{plan}</span>
  );
};

export default function PlatformDashboard() {
  const [stats, setStats]             = useState(null);
  const [bugStats, setBugStats]       = useState(null);
  const [complianceStats, setComplianceStats] = useState(null);
  const [activeToday, setActiveToday] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [seeding, setSeeding]         = useState(false);

  useEffect(() => {
    Promise.all([
      getSAPlatformDashboard().catch(() => null),
      getSAAuditReports({ limit: 200 }).catch(() => null),
      getSAComplianceStats().catch(() => null),
      getActivityActiveTenants(24).catch(() => null),
    ]).then(([d, b, c, act]) => {
      setStats(d?.data?.data);
      const reports = b?.data?.data || [];
      setBugStats({
        total:      reports.length,
        p1:         reports.filter(r => r.priority === 'P1').length,
        open:       reports.filter(r => !['RESOLVED','CLOSED'].includes(r.status)).length,
        resolved:   reports.filter(r => r.status === 'RESOLVED').length,
      });
      setComplianceStats(c?.data?.data);
      setActiveToday(act?.data?.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState />;

  const t  = stats || {};
  const bs = bugStats || {};
  const cs = complianceStats || {};

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
          Platform Overview
        </h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Tenant Stats */}
      <SectionLabel>Tenants</SectionLabel>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard icon="🏢" label="Total Tenants" value={t.totalTenants} accent="#1FB8D6" />
        <StatCard icon="✅" label="Active" value={t.activeTenants} accent="#34D399" />
        <StatCard icon="🚫" label="Suspended" value={t.suspendedTenants} accent="#F87171" />
        <StatCard icon="📅" label="New This Month" value={t.newThisMonth} accent="#A78BFA" />
        <StatCard icon="🚀" label="New Last 7 Days" value={t.newLast7Days} accent="#60A5FA" />
        <StatCard icon="💰" label="MRR Today" value={t.mrrToday != null ? `₹${new Intl.NumberFormat('en-IN').format(t.mrrToday)}` : '—'} accent="#34D399" sub="active paid plans" />
      </div>

      {/* Plan Breakdown */}
      {t.planBreakdown && (
        <>
          <SectionLabel>Plan Distribution</SectionLabel>
          <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', padding: 20, marginBottom: 28 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {Object.entries(t.planBreakdown).map(([plan, count]) => (
                <div key={plan} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <PlanBadge plan={plan} />
                  <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-display)' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bug Reports + Compliance + Activity Row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <SectionLabel>Bug Reports</SectionLabel>
          <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', padding: 20 }}>
            {[
              { label: 'Total Reports', val: bs.total,    color: '#1FB8D6' },
              { label: 'P1 Critical',   val: bs.p1,       color: '#F87171' },
              { label: 'Open',          val: bs.open,     color: '#F59E0B' },
              { label: 'Resolved',      val: bs.resolved, color: '#34D399' },
            ].map((r) => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#94A3B8' }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: r.color, fontSize: 15 }}>{r.val ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <SectionLabel>Compliance</SectionLabel>
          <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', padding: 20 }}>
            {[
              { label: 'Total Records', val: cs.total,       color: '#64748B' },
              { label: 'KYC Verified',  val: cs.kycVerified, color: '#34D399' },
              { label: 'KYC Pending',   val: cs.kycPending,  color: '#F59E0B' },
              { label: 'High Risk',     val: cs.highRisk,    color: '#F87171' },
              { label: 'Flagged',       val: cs.flagged,     color: '#A78BFA' },
            ].map((r) => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#94A3B8' }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: r.color, fontSize: 15 }}>{r.val ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <SectionLabel>Active Today</SectionLabel>
          <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', padding: 20, maxHeight: 180, overflowY: 'auto' }}>
            {activeToday.length === 0 ? (
              <div style={{ fontSize: 13, color: '#64748B' }}>No activity in last 24h</div>
            ) : activeToday.slice(0, 5).map(ten => (
              <div key={ten.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, color: '#F1F5F9', fontWeight: 500 }}>{ten.name}</div>
                  <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-mono)' }}>{ten.syllabrixId}</div>
                </div>
                <span style={{ fontWeight: 700, color: '#1FB8D6', fontSize: 14 }}>{ten.actions}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tenants */}
      {t.recentTenants?.length > 0 && (
        <>
          <SectionLabel>Recent Signups</SectionLabel>
          <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E2D3D' }}>
                  {['Business', 'Type', 'Plan', 'Status', 'Joined'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.recentTenants.map((ten) => (
                  <tr key={ten.id} style={{ borderBottom: '1px solid #1E2D3D' }}>
                    <td style={{ padding: '12px 16px', color: '#F1F5F9', fontWeight: 600, fontSize: 14 }}>{ten.businessName}</td>
                    <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: 13 }}>{ten.businessType}</td>
                    <td style={{ padding: '12px 16px' }}><PlanBadge plan={ten.plan} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: ten.isActive ? '#34D399' : '#F87171', fontSize: 13, fontWeight: 600 }}>
                        {ten.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748B', fontSize: 13 }}>
                      {new Date(ten.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Staging Tools — hidden on production */}
      {import.meta.env.VITE_API_URL?.includes('quality') && <div style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid #1E2D3D' }}>
        <SectionLabel>Staging Tools</SectionLabel>
        <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 4 }}>🏋️ Seed Iron Zone Fitness Demo</div>
            <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
              Creates the full gym demo tenant with 60 members, 4 trainers, sessions, assets and expenses.<br />
              Login: <code style={{ color: '#1FB8D6', fontFamily: 'monospace' }}>owner@ironzone.test</code> / <code style={{ color: '#1FB8D6', fontFamily: 'monospace' }}>Test@1234</code>
            </div>
          </div>
          <button
            onClick={async () => {
              setSeeding(true);
              try {
                const r = await seedDemoData();
                toast.success(r.data?.message || 'Seeded successfully');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Seed failed');
              } finally {
                setSeeding(false);
              }
            }}
            disabled={seeding}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none', cursor: seeding ? 'not-allowed' : 'pointer',
              background: seeding ? '#1E2D3D' : 'linear-gradient(135deg,#1FB8D6,#27DCFF)',
              color: seeding ? '#64748B' : '#0B131C', fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}
          >
            {seeding ? 'Seeding…' : 'Run Seed'}
          </button>
        </div>
      </div>}
    </div>
  );
}

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
    {children}
  </div>
);

const LoadingState = () => (
  <div style={{ padding: 32, color: '#64748B', fontSize: 14 }}>Loading dashboard…</div>
);
