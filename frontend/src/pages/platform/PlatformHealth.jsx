import { useEffect, useState } from 'react';
import { getSAPlatformHealth } from '../../api/platform';

const STATUS_COLOR = { OK: '#34D399', ERROR: '#F87171', WARN: '#F59E0B' };
const STATUS_BG    = { OK: 'rgba(52,211,153,0.12)', ERROR: 'rgba(248,113,113,0.12)', WARN: 'rgba(245,158,11,0.12)' };

const Dot = ({ status }) => (
  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[status] || '#475569', display: 'inline-block', flexShrink: 0 }} />
);

const StatusPill = ({ status, label }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: STATUS_BG[status] || 'rgba(71,85,105,0.2)',
    color: STATUS_COLOR[status] || '#94A3B8',
    border: `1px solid ${STATUS_COLOR[status] || '#475569'}44`,
    padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
  }}>
    <Dot status={status} />{label || status}
  </span>
);

const codeColor = (code) => {
  if (code >= 500) return '#F87171';
  if (code >= 400) return '#F59E0B';
  return '#34D399';
};

export default function PlatformHealth() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = () => {
    setLoading(true);
    getSAPlatformHealth()
      .then(r => { setData(r.data.data); setLastRefresh(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const dbStatus  = data?.db?.status || 'ERROR';
  const apiStatus = data?.api?.status || 'OK';
  const overallStatus = dbStatus === 'ERROR' ? 'ERROR' : apiStatus === 'ERROR' ? 'ERROR' : 'OK';

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
            Platform Health
          </h1>
          <p style={{ color: '#64748B', fontSize: 14 }}>
            Live infrastructure status · refreshed {lastRefresh.toLocaleTimeString('en-IN')}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'rgba(31,184,214,0.1)', border: '1px solid rgba(31,184,214,0.3)',
            color: '#1FB8D6', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {/* Overall status banner */}
      <div style={{
        background: overallStatus === 'OK' ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
        border: `1px solid ${STATUS_COLOR[overallStatus]}33`,
        borderRadius: 12, padding: '18px 24px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Dot status={overallStatus} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: STATUS_COLOR[overallStatus] }}>
            {overallStatus === 'OK' ? 'All Systems Operational' : 'System Degraded — Attention Required'}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            Database {dbStatus === 'OK' ? 'healthy' : 'unreachable'} · API server responding normally
          </div>
        </div>
      </div>

      {/* Service Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* DB */}
        <div style={{ background: '#192533', borderRadius: 12, padding: '20px 24px', border: '1px solid #1E2D3D' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>🗄️</span>
            <StatusPill status={dbStatus} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>PostgreSQL</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>Supabase / Prisma</div>
          {data?.db?.latencyMs != null && (
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: data.db.latencyMs < 50 ? '#34D399' : data.db.latencyMs < 150 ? '#F59E0B' : '#F87171' }}>
              {data.db.latencyMs} ms latency
            </div>
          )}
        </div>

        {/* API */}
        <div style={{ background: '#192533', borderRadius: 12, padding: '20px 24px', border: '1px solid #1E2D3D' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <StatusPill status={apiStatus} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>API Server</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>Express · Node.js</div>
          <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: '#34D399' }}>Responding normally</div>
        </div>

        {/* Errors last 1h */}
        <div style={{ background: '#192533', borderRadius: 12, padding: '20px 24px', border: '1px solid #1E2D3D' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>🔴</span>
            <StatusPill status={data?.errors?.last1h > 20 ? 'ERROR' : data?.errors?.last1h > 5 ? 'WARN' : 'OK'} label={data?.errors?.last1h > 20 ? 'HIGH' : data?.errors?.last1h > 5 ? 'WARN' : 'LOW'} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#F1F5F9', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
            {loading ? '…' : data?.errors?.last1h ?? 0}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>Errors last 1 hour</div>
        </div>

        {/* Errors last 24h */}
        <div style={{ background: '#192533', borderRadius: 12, padding: '20px 24px', border: '1px solid #1E2D3D' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>📊</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#F1F5F9', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
            {loading ? '…' : data?.errors?.last24h ?? 0}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>Errors last 24 hours</div>
        </div>
      </div>

      {/* Error breakdown + top endpoints */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, marginBottom: 20 }}>

        {/* By status code */}
        <div style={{ background: '#192533', borderRadius: 12, padding: 24, border: '1px solid #1E2D3D' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>Errors by Status Code</h2>
          {!data?.errorsByStatus?.length ? (
            <div style={{ color: '#475569', fontSize: 13 }}>No errors in last 24h</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.errorsByStatus.map(e => (
                <div key={e.statusCode} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0F1923', borderRadius: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: codeColor(e.statusCode) }}>{e.statusCode}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>{e.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top error endpoints */}
        <div style={{ background: '#192533', borderRadius: 12, padding: 24, border: '1px solid #1E2D3D' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>Top Error Endpoints (24h)</h2>
          {!data?.topErrorEndpoints?.length ? (
            <div style={{ color: '#475569', fontSize: 13 }}>No errors in last 24h</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.topErrorEndpoints.map((e, i) => {
                const maxCount = data.topErrorEndpoints[0]?.count || 1;
                return (
                  <div key={e.path}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{e.path}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#F87171' }}>{e.count}</span>
                    </div>
                    <div style={{ height: 4, background: '#1E2D3D', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${(e.count / maxCount) * 100}%`, height: '100%', background: `rgba(248,113,113,${0.4 + (1 - i / data.topErrorEndpoints.length) * 0.6})`, borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Error Log */}
      <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E2D3D' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>Recent Errors</h2>
        </div>
        {!data?.recentErrors?.length ? (
          <div style={{ padding: '20px', color: '#475569', fontSize: 13 }}>No recent errors logged.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E2D3D' }}>
                {['Status', 'Method', 'Path', 'Message', 'When'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentErrors.map(err => (
                <tr key={err.id} style={{ borderBottom: '1px solid #1E2D3D' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: codeColor(err.statusCode) }}>{err.statusCode}</span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#60A5FA', fontWeight: 600 }}>{err.method}</span>
                  </td>
                  <td style={{ padding: '10px 16px', maxWidth: 280 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94A3B8', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{err.path}</span>
                  </td>
                  <td style={{ padding: '10px 16px', maxWidth: 260 }}>
                    <span style={{ fontSize: 12, color: '#CBD5E1', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{err.message || '—'}</span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#64748B', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {new Date(err.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
