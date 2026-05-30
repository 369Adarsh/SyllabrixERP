import { useEffect, useState, useCallback } from 'react';
import { getSAErrorLogs } from '../../api/platform';

const fmt = (n) => new Intl.NumberFormat('en-IN').format(n);

const STATUS_COLOR = (code) => {
  if (code >= 500) return '#F87171';
  if (code >= 400) return '#F59E0B';
  return '#34D399';
};

const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function ErrorTracker() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { days };
      if (statusFilter) params.statusCode = statusFilter;
      const r = await getSAErrorLogs(params);
      setData(r.data.data);
    } catch { }
    finally { setLoading(false); }
  }, [days, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const errors5xx = data?.byStatusCode?.filter(s => s.statusCode >= 500).reduce((a, b) => a + b._count, 0) || 0;
  const errors4xx = data?.byStatusCode?.filter(s => s.statusCode >= 400 && s.statusCode < 500).reduce((a, b) => a + b._count, 0) || 0;
  const maxTrend = Math.max(...(data?.dailyTrend || []).map(d => d.count), 1);

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>
              Error Tracker
            </h1>
            {errors5xx > 0 && (
              <span style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, border: '1px solid rgba(248,113,113,0.3)' }}>
                {fmt(errors5xx)} 5xx ERRORS
              </span>
            )}
          </div>
          <p style={{ color: '#64748B', fontSize: 14 }}>
            {data ? `${fmt(data.totalCount)} errors in the last ${days} days` : 'Loading…'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ padding: '8px 12px', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none' }}>
            <option value={1}>Last 24h</option>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 8, color: statusFilter ? '#F1F5F9' : '#64748B', fontSize: 13, outline: 'none' }}>
            <option value="">All Status Codes</option>
            <option value="400">400</option>
            <option value="401">401</option>
            <option value="403">403</option>
            <option value="404">404</option>
            <option value="422">422</option>
            <option value="500">500</option>
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Errors', value: fmt(data?.totalCount || 0), color: '#64748B', icon: '⚠️' },
          { label: '5xx Server Errors', value: fmt(errors5xx), color: '#F87171', icon: '🔴' },
          { label: '4xx Client Errors', value: fmt(errors4xx), color: '#F59E0B', icon: '🟡' },
          { label: 'Affected Endpoints', value: data?.topPaths?.length || 0, color: '#60A5FA', icon: '🛤️' },
        ].map(c => (
          <div key={c.label} style={{ flex: 1, minWidth: 150, background: '#192533', borderRadius: 12, padding: '18px 20px', border: '1px solid #1E2D3D' }}>
            <div style={{ fontSize: 20, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {!data && loading && (
        <div style={{ color: '#64748B', fontSize: 14, textAlign: 'center', padding: 40 }}>Loading error logs…</div>
      )}

      {data && data.totalCount === 0 && (
        <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#34D399', marginBottom: 8 }}>No errors in this period</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>Errors will appear here automatically as they occur across the platform.</div>
        </div>
      )}

      {data && data.totalCount > 0 && (
        <>
          {/* Daily trend bar chart */}
          <div style={{ background: '#192533', borderRadius: 12, padding: 24, border: '1px solid #1E2D3D', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>Error Trend</h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
              {data.dailyTrend.map((d, i) => {
                const totalPct = maxTrend > 0 ? (d.count / maxTrend) * 100 : 0;
                const fivePct = d.count > 0 ? (d.errors5xx / d.count) * totalPct : 0;
                const fourPct = d.count > 0 ? (d.errors4xx / d.count) * totalPct : 0;
                const dateLabel = new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    {d.count > 0 && <span style={{ fontSize: 10, color: '#64748B' }}>{d.count}</span>}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 72 }}>
                      {d.count > 0 && (
                        <div style={{ width: '100%', height: `${Math.max(totalPct, 4)}%`, borderRadius: '3px 3px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                          <div style={{ width: '100%', height: `${fivePct > 0 ? (fivePct / totalPct) * 100 : 0}%`, background: '#F87171', minHeight: d.errors5xx > 0 ? 3 : 0 }} />
                          <div style={{ width: '100%', height: `${fourPct > 0 ? (fourPct / totalPct) * 100 : 0}%`, background: '#F59E0B', minHeight: d.errors4xx > 0 ? 3 : 0 }} />
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 9, color: '#475569', whiteSpace: 'nowrap' }}>{dateLabel}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: '#64748B' }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#F87171', borderRadius: 2, marginRight: 4 }} />5xx errors</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#F59E0B', borderRadius: 2, marginRight: 4 }} />4xx errors</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Top error paths */}
            <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #1E2D3D' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>Top Error Endpoints</h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E2D3D' }}>
                    {['Path', 'Status', 'Count'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topPaths.map((p, i) => (
                    <tr key={i} style={{ borderBottom: i < data.topPaths.length - 1 ? '1px solid #1E2D3D' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#CBD5E1', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.path}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR(p.statusCode), background: `${STATUS_COLOR(p.statusCode)}15`, padding: '2px 8px', borderRadius: 4 }}>
                          {p.statusCode}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{fmt(p._count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Per-tenant breakdown + Status code split */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status code breakdown */}
              <div style={{ background: '#192533', borderRadius: 12, padding: 20, border: '1px solid #1E2D3D' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>By Status Code</h2>
                {data.byStatusCode.map(s => (
                  <div key={s.statusCode} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: STATUS_COLOR(s.statusCode), fontFamily: 'var(--font-mono)', background: `${STATUS_COLOR(s.statusCode)}15`, padding: '2px 8px', borderRadius: 4 }}>
                      {s.statusCode}
                    </span>
                    <div style={{ flex: 1, margin: '0 12px', height: 5, background: '#1E2D3D', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${data.totalCount > 0 ? (s._count / data.totalCount) * 100 : 0}%`, height: '100%', background: STATUS_COLOR(s.statusCode), borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', minWidth: 36, textAlign: 'right' }}>{fmt(s._count)}</span>
                  </div>
                ))}
              </div>

              {/* Per-tenant breakdown */}
              {data.byTenant.length > 0 && (
                <div style={{ background: '#192533', borderRadius: 12, padding: 20, border: '1px solid #1E2D3D' }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>Most Errors by Tenant</h2>
                  {data.byTenant.map((t, i) => (
                    <div key={t.tenantId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < data.byTenant.length - 1 ? '1px solid #1E2D3D' : 'none' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>{t.tenantName}</div>
                        <div style={{ fontSize: 10, color: '#475569' }}>{t.syllabrixId || ''}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#F87171' }}>{fmt(t._count)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent error log */}
          <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #1E2D3D' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>Recent Errors</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E2D3D' }}>
                    {['Time', 'Method', 'Path', 'Status', 'Message'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.logs.slice(0, 50).map((log, i) => (
                    <tr key={log.id} style={{ borderBottom: i < Math.min(data.logs.length, 50) - 1 ? '1px solid #1E2D3D' : 'none', cursor: 'pointer' }}
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = selectedLog?.id === log.id ? 'rgba(31,184,214,0.05)' : 'transparent'}>
                      <td style={{ padding: '9px 16px', fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '9px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>{log.method}</span>
                      </td>
                      <td style={{ padding: '9px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94A3B8', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.path}
                      </td>
                      <td style={{ padding: '9px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR(log.statusCode), background: `${STATUS_COLOR(log.statusCode)}15`, padding: '2px 7px', borderRadius: 4 }}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td style={{ padding: '9px 16px', fontSize: 12, color: '#94A3B8', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.message || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
