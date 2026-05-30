import { useEffect, useState } from 'react';
import { getSARevenue } from '../../api/platform';

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
const fmtCr = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${fmt(n)}`;

const PLAN_COLOR = { STARTER: '#34D399', GROWTH: '#60A5FA', SCALE: '#A78BFA' };
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatCard = ({ label, value, sub, accent = '#1FB8D6', icon }) => (
  <div style={{ background: '#192533', borderRadius: 12, padding: '20px 24px', border: '1px solid #1E2D3D', flex: 1, minWidth: 160 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, marginTop: 6 }} />
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: '#F1F5F9', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 13, color: '#64748B', marginTop: 6, fontWeight: 500 }}>{label}</div>
    {sub && <div style={{ fontSize: 12, color: accent, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
  </div>
);

const MiniBar = ({ value, max, color }) => (
  <div style={{ flex: 1, height: 6, background: '#1E2D3D', borderRadius: 99, overflow: 'hidden' }}>
    <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
  </div>
);

export default function Revenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSARevenue()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 28, color: '#64748B', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #1FB8D6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      Loading revenue data…
    </div>
  );

  if (!data) return <div style={{ padding: 28, color: '#F87171' }}>Failed to load data.</div>;

  const maxMonthlyCount = Math.max(...(data.monthlyData || []).map(m => m.count), 1);
  const maxTypeRevenue = Math.max(...(data.revenueByType || []).map(t => t.revenue), 1);

  const monthLabel = (key) => {
    const [y, m] = key.split('-');
    return `${MONTH_LABELS[parseInt(m) - 1]} ${y.slice(2)}`;
  };

  const chartMax = maxMonthlyCount > 0 ? maxMonthlyCount : 1;

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
          Revenue
        </h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          Computed from active tenant plans · STARTER ₹999 · GROWTH ₹2,499 · SCALE ₹4,999
        </p>
      </div>

      {/* Top stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard label="Monthly Recurring Revenue" value={fmtCr(data.mrr)} sub="MRR" accent="#1FB8D6" icon="💰" />
        <StatCard label="Annual Recurring Revenue" value={fmtCr(data.arr)} sub="ARR" accent="#60A5FA" icon="📈" />
        <StatCard label="Active Tenants" value={fmt(data.activeTenants)} sub={`of ${fmt(data.totalTenants)} total`} accent="#34D399" icon="🏢" />
        <StatCard label="Inactive Rate" value={`${data.churnRate}%`} sub="deactivated tenants" accent="#F87171" icon="📉" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Plan Distribution */}
        <div style={{ background: '#192533', borderRadius: 12, padding: 24, border: '1px solid #1E2D3D' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>Plan Distribution</h2>
          {data.planDistribution.length === 0 && (
            <p style={{ color: '#64748B', fontSize: 13 }}>No active tenants.</p>
          )}
          {data.planDistribution.map(p => (
            <div key={p.plan} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLAN_COLOR[p.plan] || '#64748B' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>{p.plan}</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>₹{fmt(p.pricePerMonth)}/mo</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: PLAN_COLOR[p.plan] || '#64748B' }}>{p.count} tenants</span>
                  <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>→ {fmtCr(p.revenue)}/mo</span>
                </div>
              </div>
              <MiniBar value={p.revenue} max={data.mrr} color={PLAN_COLOR[p.plan] || '#64748B'} />
            </div>
          ))}
          <div style={{ borderTop: '1px solid #1E2D3D', paddingTop: 16, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Total MRR</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1FB8D6', fontFamily: 'var(--font-display)' }}>{fmtCr(data.mrr)}</span>
            </div>
          </div>
        </div>

        {/* Revenue by Business Type */}
        <div style={{ background: '#192533', borderRadius: 12, padding: 24, border: '1px solid #1E2D3D' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>Revenue by Business Type</h2>
          {data.revenueByType.length === 0 && (
            <p style={{ color: '#64748B', fontSize: 13 }}>No data.</p>
          )}
          {data.revenueByType.map((t, i) => (
            <div key={t.type} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#475569', fontWeight: 700, width: 18 }}>#{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#CBD5E1' }}>{t.type.replace(/_/g, ' ')}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{fmtCr(t.revenue)}/mo</span>
                  <span style={{ fontSize: 11, color: '#64748B', marginLeft: 6 }}>{t.count} tenants</span>
                </div>
              </div>
              <MiniBar value={t.revenue} max={maxTypeRevenue} color="#1FB8D6" />
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Growth Chart */}
      <div style={{ background: '#192533', borderRadius: 12, padding: 24, border: '1px solid #1E2D3D' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 24 }}>New Tenants — Last 12 Months</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
          {(data.monthlyData || []).map((m, i) => {
            const pct = chartMax > 0 ? (m.count / chartMax) * 100 : 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{m.count || ''}</span>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 100 }}>
                  <div style={{
                    width: '100%', height: `${Math.max(pct, m.count > 0 ? 4 : 0)}%`,
                    background: 'linear-gradient(180deg, #1FB8D6, #0E7490)',
                    borderRadius: '4px 4px 0 0',
                    minHeight: m.count > 0 ? 4 : 0,
                    transition: 'height 0.4s ease',
                  }} />
                </div>
                <span style={{ fontSize: 10, color: '#475569', whiteSpace: 'nowrap' }}>{monthLabel(m.month)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
