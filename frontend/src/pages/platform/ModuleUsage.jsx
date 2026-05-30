import { useEffect, useState } from 'react';
import { getSAModuleUsage } from '../../api/platform';

const ADOPTION_COLOR = (pct) => {
  if (pct >= 70) return '#34D399';
  if (pct >= 40) return '#60A5FA';
  if (pct >= 15) return '#F59E0B';
  return '#F87171';
};

const ADOPTION_LABEL = (pct) => {
  if (pct >= 70) return { text: 'High', color: '#34D399' };
  if (pct >= 40) return { text: 'Medium', color: '#60A5FA' };
  if (pct >= 15) return { text: 'Low', color: '#F59E0B' };
  return { text: 'Very Low', color: '#F87171' };
};

const fmt = (n) => new Intl.NumberFormat('en-IN').format(n);

export default function ModuleUsage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('adoption'); // 'adoption' | 'activity'
  const [view, setView] = useState('all'); // 'all' | 'high' | 'low'

  useEffect(() => {
    getSAModuleUsage()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 28, color: '#64748B', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #1FB8D6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      Loading module usage data…
    </div>
  );
  if (!data) return <div style={{ padding: 28, color: '#F87171' }}>Failed to load data.</div>;

  let modules = [...data.modules];
  if (sortBy === 'activity') modules.sort((a, b) => b.activityLast30d - a.activityLast30d);

  if (view === 'high') modules = modules.filter(m => m.adoptionPct >= 70);
  if (view === 'low') modules = modules.filter(m => m.adoptionPct < 15);

  const topModule = data.modules[0];
  const leastModule = [...data.modules].sort((a, b) => a.adoptionPct - b.adoptionPct)[0];
  const mostActive = [...data.modules].sort((a, b) => b.activityLast30d - a.activityLast30d)[0];
  const deprecationCandidates = data.modules.filter(m => m.adoptionPct < 15);
  const maxActivity = Math.max(...data.modules.map(m => m.activityLast30d), 1);

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
          Module Usage
        </h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          Adoption rates and activity across {fmt(data.totalActiveTenants)} active tenants · Last 30 days activity
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Most Adopted', value: topModule?.label, sub: `${topModule?.adoptionPct}% of tenants`, icon: '🏆', color: '#34D399' },
          { label: 'Least Adopted', value: leastModule?.label, sub: `${leastModule?.adoptionPct}% of tenants`, icon: '📉', color: '#F87171' },
          { label: 'Most Active (30d)', value: mostActive?.label, sub: `${fmt(mostActive?.activityLast30d)} events`, icon: '⚡', color: '#60A5FA' },
          { label: 'Deprecation Candidates', value: deprecationCandidates.length, sub: 'modules below 15% adoption', icon: '⚠️', color: '#F59E0B' },
        ].map(card => (
          <div key={card.label} style={{ flex: 1, minWidth: 160, background: '#192533', borderRadius: 12, padding: '18px 20px', border: '1px solid #1E2D3D' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{card.icon}</span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: card.color, marginTop: 4 }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9', fontFamily: 'var(--font-display)', lineHeight: 1.2, marginBottom: 4 }}>{card.value}</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>{card.label}</div>
            <div style={{ fontSize: 11, color: card.color, marginTop: 3, fontWeight: 600 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Deprecation warning */}
      {deprecationCandidates.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>Deprecation candidates: </span>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>
              {deprecationCandidates.map(m => m.label).join(', ')} — below 15% adoption
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 8, overflow: 'hidden' }}>
          {[['all', 'All Modules'], ['high', 'High Adoption'], ['low', 'Deprecation Risk']].map(([key, label]) => (
            <button key={key} onClick={() => setView(key)} style={{
              padding: '7px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: view === key ? '#1FB8D6' : 'transparent',
              color: view === key ? '#0B131C' : '#64748B',
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 8, overflow: 'hidden', marginLeft: 'auto' }}>
          {[['adoption', 'Sort by Adoption'], ['activity', 'Sort by Activity']].map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)} style={{
              padding: '7px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: sortBy === key ? '#1E2D3D' : 'transparent',
              color: sortBy === key ? '#1FB8D6' : '#64748B',
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Module table */}
      <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E2D3D' }}>
              {['Module', 'Adoption', 'Tenants Enabled', 'Activity (30d)', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>No modules match this filter.</td></tr>
            )}
            {modules.map((m, i) => {
              const adoptionLabel = ADOPTION_LABEL(m.adoptionPct);
              const color = ADOPTION_COLOR(m.adoptionPct);
              const activityWidth = maxActivity > 0 ? (m.activityLast30d / maxActivity) * 100 : 0;
              return (
                <tr key={m.key} style={{ borderBottom: i < modules.length - 1 ? '1px solid #1E2D3D' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{m.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: '#475569', fontFamily: 'var(--font-mono)' }}>{m.key}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 80, height: 6, background: '#1E2D3D', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${m.adoptionPct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 38 }}>{m.adoptionPct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#CBD5E1' }}>
                    {fmt(m.enabledCount)} <span style={{ fontSize: 11, color: '#475569', fontWeight: 400 }}>/ {fmt(data.totalActiveTenants)}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 5, background: '#1E2D3D', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${activityWidth}%`, height: '100%', background: '#60A5FA', borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 13, color: m.activityLast30d > 0 ? '#60A5FA' : '#475569', fontWeight: m.activityLast30d > 0 ? 600 : 400 }}>
                        {m.activityLast30d > 0 ? fmt(m.activityLast30d) : '—'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                      background: `${adoptionLabel.color}18`, color: adoptionLabel.color,
                    }}>
                      {adoptionLabel.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
