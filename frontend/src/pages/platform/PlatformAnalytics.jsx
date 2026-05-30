import { useEffect, useState } from 'react';
import { getSAPlatformAnalytics } from '../../api/platform';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = (n) => new Intl.NumberFormat('en-IN').format(n);

const monthLabel = (key) => {
  const [y, m] = key.split('-');
  return `${MONTH_SHORT[parseInt(m) - 1]} ${y.slice(2)}`;
};

const RETENTION_COLOR = (pct) => {
  if (pct === null) return '#475569';
  if (pct >= 80) return '#34D399';
  if (pct >= 60) return '#60A5FA';
  if (pct >= 40) return '#F59E0B';
  return '#F87171';
};

const TYPE_COLORS = ['#1FB8D6','#34D399','#60A5FA','#A78BFA','#F59E0B','#F87171','#E879F9','#34D399','#FB923C','#94A3B8'];

export default function PlatformAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSAPlatformAnalytics()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 28, color: '#64748B', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #1FB8D6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      Loading analytics…
    </div>
  );
  if (!data) return <div style={{ padding: 28, color: '#F87171' }}>Failed to load analytics.</div>;

  const maxNew = Math.max(...data.monthlyGrowth.map(m => m.newTenants), 1);
  const maxCumulative = Math.max(...data.monthlyGrowth.map(m => m.cumulative), 1);
  const maxTypeCount = Math.max(...data.businessTypeDistribution.map(t => t.count), 1);

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
          Platform Analytics
        </h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          {fmt(data.totalTenants)} total tenants · {fmt(data.activeTenants)} active
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Tenants', value: fmt(data.totalTenants), icon: '🏢', color: '#1FB8D6' },
          { label: 'Active Tenants', value: fmt(data.activeTenants), icon: '✅', color: '#34D399' },
          { label: 'Business Types', value: data.businessTypeDistribution.length, icon: '🗂', color: '#A78BFA' },
          { label: 'Cities Covered', value: data.topCities.length + '+', icon: '📍', color: '#F59E0B' },
        ].map(c => (
          <div key={c.label} style={{ flex: 1, minWidth: 150, background: '#192533', borderRadius: 12, padding: '18px 20px', border: '1px solid #1E2D3D' }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#F1F5F9', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Growth chart + Cohort table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Tenant growth — dual bar/line chart */}
        <div style={{ background: '#192533', borderRadius: 12, padding: 24, border: '1px solid #1E2D3D' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>Tenant Growth</h2>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#64748B' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#1FB8D6', display: 'inline-block' }} />New
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 2, background: '#A78BFA', display: 'inline-block' }} />Cumulative
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, position: 'relative' }}>
            {data.monthlyGrowth.map((m, i) => {
              const barH = maxNew > 0 ? (m.newTenants / maxNew) * 100 : 0;
              const lineH = maxCumulative > 0 ? (m.cumulative / maxCumulative) * 100 : 0;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 90, position: 'relative' }}>
                    {/* Cumulative dot */}
                    <div style={{ position: 'absolute', bottom: `${lineH}%`, left: '50%', transform: 'translate(-50%, 50%)', width: 6, height: 6, borderRadius: '50%', background: '#A78BFA', zIndex: 2 }} />
                    {/* New bar */}
                    <div style={{ width: '100%', height: `${Math.max(barH, m.newTenants > 0 ? 3 : 0)}%`, background: 'linear-gradient(180deg, #1FB8D6, #0E7490)', borderRadius: '3px 3px 0 0', minHeight: m.newTenants > 0 ? 3 : 0 }} />
                  </div>
                  <span style={{ fontSize: 9, color: '#475569', whiteSpace: 'nowrap' }}>{monthLabel(m.month)}</span>
                </div>
              );
            })}
          </div>
          {/* Latest cumulative */}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #1E2D3D', display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748B' }}>Total tenants today</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#A78BFA', fontFamily: 'var(--font-display)' }}>{fmt(data.monthlyGrowth.at(-1)?.cumulative || 0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B' }}>New this month</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1FB8D6', fontFamily: 'var(--font-display)' }}>{fmt(data.monthlyGrowth.at(-1)?.newTenants || 0)}</div>
            </div>
          </div>
        </div>

        {/* Retention Cohorts */}
        <div style={{ background: '#192533', borderRadius: 12, padding: 24, border: '1px solid #1E2D3D' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>Retention Cohorts</h2>
          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 16 }}>% of tenants from each month still active today</div>
          {data.retentionCohorts.map(c => (
            <div key={c.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>{c.label}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#475569' }}>{c.active}/{c.total}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: RETENTION_COLOR(c.retentionPct), minWidth: 38, textAlign: 'right' }}>
                    {c.retentionPct !== null ? `${c.retentionPct}%` : '—'}
                  </span>
                </div>
              </div>
              <div style={{ height: 5, background: '#1E2D3D', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${c.retentionPct || 0}%`, height: '100%', background: RETENTION_COLOR(c.retentionPct), borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Business type distribution + Geo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Business type distribution */}
        <div style={{ background: '#192533', borderRadius: 12, padding: 24, border: '1px solid #1E2D3D' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>Business Type Distribution</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.businessTypeDistribution.slice(0, 12).map((t, i) => (
              <div key={t.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>{t.type.replace(/_/g, ' ')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: TYPE_COLORS[i % TYPE_COLORS.length] }}>{t.count}</span>
                    <span style={{ fontSize: 11, color: '#475569' }}>{data.totalTenants > 0 ? Math.round(t.count / data.totalTenants * 100) : 0}%</span>
                  </div>
                </div>
                <div style={{ height: 5, background: '#1E2D3D', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${maxTypeCount > 0 ? (t.count / maxTypeCount) * 100 : 0}%`, height: '100%', background: TYPE_COLORS[i % TYPE_COLORS.length], borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic distribution */}
        <div style={{ background: '#192533', borderRadius: 12, padding: 24, border: '1px solid #1E2D3D' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>Geographic Distribution</h2>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top Cities</div>
            {data.topCities.length === 0 && <div style={{ color: '#475569', fontSize: 13 }}>No city data available.</div>}
            {data.topCities.map((c, i) => (
              <div key={c.city} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1E2D3D' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#475569', width: 18 }}>#{i + 1}</span>
                  <span style={{ fontSize: 13, color: '#CBD5E1' }}>{c.city}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1FB8D6' }}>{c.count}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top States</div>
            {data.topStates.length === 0 && <div style={{ color: '#475569', fontSize: 13 }}>No state data available.</div>}
            {data.topStates.slice(0, 5).map((s, i) => (
              <div key={s.state} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1E2D3D' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#475569', width: 18 }}>#{i + 1}</span>
                  <span style={{ fontSize: 13, color: '#CBD5E1' }}>{s.state}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#60A5FA' }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
