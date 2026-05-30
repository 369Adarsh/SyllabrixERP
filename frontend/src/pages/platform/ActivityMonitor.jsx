import { useState, useEffect, useCallback } from 'react';
import { getActivityLogs, getActivityModuleSummary, getActivityActiveTenants } from '../../api/platform';
import toast from 'react-hot-toast';

const MODULE_META = {
  auth:         { label: 'Auth',         color: '#A78BFA', icon: '🔐' },
  invoicing:    { label: 'Invoicing',    color: '#1FB8D6', icon: '🧾' },
  fees:         { label: 'Fees',         color: '#34D399', icon: '💰' },
  inventory:    { label: 'Inventory',    color: '#F59E0B', icon: '📦' },
  pos:          { label: 'POS',          color: '#60A5FA', icon: '🛒' },
  appointments: { label: 'Appointments', color: '#F87171', icon: '📅' },
  expenses:     { label: 'Expenses',     color: '#FB923C', icon: '📝' },
  customers:    { label: 'Customers',    color: '#4ADE80', icon: '👥' },
  staff:        { label: 'Staff',        color: '#E879F9', icon: '👤' },
};

const ACTION_COLOR = {
  LOGIN:                '#A78BFA',
  LOGOUT:               '#64748B',
  INVOICE_CREATED:      '#1FB8D6',
  INVOICE_PAID:         '#34D399',
  INVOICE_CANCELLED:    '#F87171',
  PAYMENT_RECORDED:     '#34D399',
  FEE_COLLECTED:        '#34D399',
  PRODUCT_CREATED:      '#F59E0B',
  PRODUCT_UPDATED:      '#60A5FA',
  STOCK_ADJUSTED:       '#F59E0B',
  SALE_COMPLETED:       '#60A5FA',
  APPOINTMENT_BOOKED:   '#1FB8D6',
  APPOINTMENT_CANCELLED:'#F87171',
  EXPENSE_ADDED:        '#FB923C',
};

const ROLE_COLOR = { OWNER: '#27DCFF', ADMIN: '#A78BFA', STAFF: '#94A3B8', MANAGER: '#F59E0B' };

const MODULES = ['', 'auth', 'invoicing', 'fees', 'inventory', 'pos', 'appointments', 'expenses', 'customers', 'staff'];

function ActionBadge({ action }) {
  const color = ACTION_COLOR[action] || '#64748B';
  const label = action?.replace(/_/g, ' ') || '—';
  return (
    <span style={{ background: `${color}22`, color, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function ModuleBadge({ module }) {
  const m = MODULE_META[module] || { label: module, color: '#64748B', icon: '•' };
  return (
    <span style={{ background: `${m.color}18`, color: m.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {m.icon} {m.label}
    </span>
  );
}

export default function ActivityMonitor() {
  const [logs, setLogs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [moduleSummary, setModuleSummary] = useState([]);
  const [activeTenants, setActiveTenants] = useState([]);
  const [tab, setTab]             = useState('feed');

  const [filters, setFilters] = useState({ tenantId: '', module: '', from: '', to: '', limit: 100, page: 1 });
  const [search, setSearch]   = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.tenantId) params.tenantId = filters.tenantId;
      if (filters.module)   params.module   = filters.module;
      if (filters.from)     params.from     = filters.from;
      if (filters.to)       params.to       = filters.to;
      params.limit = filters.limit;
      params.page  = filters.page;

      const [logsRes, summaryRes, activeRes] = await Promise.all([
        getActivityLogs(params),
        getActivityModuleSummary(filters.tenantId || undefined),
        getActivityActiveTenants(),
      ]);
      setLogs(logsRes.data?.data?.logs || []);
      setTotal(logsRes.data?.data?.total || 0);
      setModuleSummary(summaryRes.data?.data || []);
      setActiveTenants(activeRes.data?.data || []);
    } catch { toast.error('Failed to load activity'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const visible = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.userName?.toLowerCase().includes(s) ||
      l.action?.toLowerCase().includes(s) ||
      l.tenant?.name?.toLowerCase().includes(s) ||
      l.tenant?.syllabrixId?.toLowerCase().includes(s)
    );
  });

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
            Activity Monitor
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Real-time trace of all business user actions — identify issues, cross-reference bug reports
          </p>
        </div>
        <button onClick={loadAll}
          style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Events',     value: total,               color: '#1FB8D6' },
          { label: 'Active (24h)',      value: activeTenants.length, color: '#34D399' },
          { label: 'Modules Tracked',  value: moduleSummary.length, color: '#A78BFA' },
          { label: 'Loaded',           value: logs.length,          color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[{ k: 'feed', label: 'Activity Feed' }, { k: 'tenants', label: 'Active Tenants' }, { k: 'modules', label: 'Module Breakdown' }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: tab === t.k ? 'rgba(31,184,214,0.15)' : '#111C27',
              color: tab === t.k ? '#1FB8D6' : '#64748B',
              border: `1px solid ${tab === t.k ? '#1FB8D6' : '#1E2D3D'}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Activity Feed tab ── */}
      {tab === 'feed' && (
        <>
          {/* Filters */}
          <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, action, tenant…"
              style={{ flex: 1, minWidth: 200, padding: '7px 12px', background: '#111C27', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none' }} />

            <select value={filters.module} onChange={e => setF('module', e.target.value)}
              style={{ padding: '7px 12px', background: '#111C27', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none' }}>
              {MODULES.map(m => <option key={m} value={m}>{m ? MODULE_META[m]?.label || m : 'All Modules'}</option>)}
            </select>

            <input type="date" value={filters.from} onChange={e => setF('from', e.target.value)}
              style={{ padding: '7px 10px', background: '#111C27', border: '1px solid #1E2D3D', borderRadius: 8, color: '#94A3B8', fontSize: 13, outline: 'none' }} />
            <span style={{ color: '#64748B', fontSize: 12 }}>to</span>
            <input type="date" value={filters.to} onChange={e => setF('to', e.target.value)}
              style={{ padding: '7px 10px', background: '#111C27', border: '1px solid #1E2D3D', borderRadius: 8, color: '#94A3B8', fontSize: 13, outline: 'none' }} />

            {(filters.module || filters.from || filters.to) && (
              <button onClick={() => setFilters(f => ({ ...f, module: '', from: '', to: '', page: 1 }))}
                style={{ padding: '6px 12px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: '#F87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>Loading…</div>
          ) : (
            <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E2D3D' }}>
                    {['Time', 'Business', 'User', 'Role', 'Module', 'Action', 'Resource'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #1E2D3D' }}>
                      <td style={{ padding: '10px 14px', color: '#64748B', fontSize: 12, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                        {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {log.tenant ? (
                          <div>
                            <div style={{ fontSize: 13, color: '#F1F5F9', fontWeight: 500 }}>{log.tenant.name}</div>
                            <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-mono)' }}>{log.tenant.syllabrixId}</div>
                          </div>
                        ) : <span style={{ color: '#334155', fontSize: 13 }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#94A3B8', fontSize: 13 }}>{log.userName}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: ROLE_COLOR[log.userRole] || '#64748B' }}>{log.userRole}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}><ModuleBadge module={log.module} /></td>
                      <td style={{ padding: '10px 14px' }}><ActionBadge action={log.action} /></td>
                      <td style={{ padding: '10px 14px', color: '#64748B', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                        {log.resourceType ? `${log.resourceType} ${log.resourceId ? '· ' + log.resourceId.slice(0, 8) : ''}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visible.length === 0 && (
                <div style={{ textAlign: 'center', padding: 48, color: '#64748B', fontSize: 14 }}>
                  {logs.length === 0 ? 'No activity yet — events will appear as business users take actions.' : 'No results match your filter.'}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {total > filters.limit && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center', alignItems: 'center' }}>
              <button disabled={filters.page === 1} onClick={() => setF('page', filters.page - 1)}
                style={pageBtn(filters.page === 1)}>← Prev</button>
              <span style={{ color: '#64748B', fontSize: 13 }}>
                Page {filters.page} · {total} total
              </span>
              <button disabled={filters.page * filters.limit >= total} onClick={() => setF('page', filters.page + 1)}
                style={pageBtn(filters.page * filters.limit >= total)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ── Active Tenants tab ── */}
      {tab === 'tenants' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {activeTenants.length === 0 ? (
            <div style={{ gridColumn: '1/-1', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: '48px 20px', textAlign: 'center', color: '#64748B', fontSize: 14 }}>
              No business activity in the last 24 hours
            </div>
          ) : activeTenants.map(t => (
            <div key={t.id} style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: '16px 18px', cursor: 'pointer' }}
              onClick={() => { setTab('feed'); setF('tenantId', t.id); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-mono)' }}>{t.syllabrixId}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1FB8D6', fontFamily: 'var(--font-display)' }}>{t.actions}</div>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t.businessType?.replace(/_/g, ' ')} · {t.actions} actions
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#1FB8D6' }}>Click to filter feed →</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Module Breakdown tab ── */}
      {tab === 'modules' && (
        <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, overflow: 'hidden' }}>
          {moduleSummary.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#64748B', fontSize: 14 }}>No module data yet</div>
          ) : (() => {
            const max = moduleSummary[0]?.count || 1;
            return moduleSummary.map(row => {
              const m = MODULE_META[row.module] || { label: row.module, color: '#64748B', icon: '•' };
              const pct = Math.round((row.count / max) * 100);
              return (
                <div key={row.module} style={{ padding: '14px 20px', borderBottom: '1px solid #1E2D3D', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 120, fontSize: 13, fontWeight: 600, color: m.color, flexShrink: 0 }}>
                    {m.icon} {m.label}
                  </div>
                  <div style={{ flex: 1, background: '#111C27', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: m.color, borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', width: 60, textAlign: 'right', flexShrink: 0 }}>
                    {row.count.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', width: 36, textAlign: 'right', flexShrink: 0 }}>
                    {pct}%
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}

const pageBtn = (disabled) => ({
  padding: '7px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
  background: disabled ? '#192533' : 'rgba(31,184,214,0.1)',
  border: `1px solid ${disabled ? '#1E2D3D' : '#1FB8D6'}`,
  color: disabled ? '#64748B' : '#1FB8D6',
});
