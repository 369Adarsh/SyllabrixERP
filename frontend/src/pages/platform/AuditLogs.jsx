import { useEffect, useState } from 'react';
import { getSAAuditLogs } from '../../api/platform';
import toast from 'react-hot-toast';

const ACTION_COLOR = {
  ADMIN_LOGIN:           '#A78BFA',
  ACTIVATE_TENANT:       '#34D399',
  DEACTIVATE_TENANT:     '#F87171',
  CHANGE_PLAN:           '#1FB8D6',
  ROLE_REQUEST_APPROVED: '#34D399',
  ROLE_REQUEST_REJECTED: '#F87171',
  BUG_REPORT_UPDATE:     '#F59E0B',
  CREATE:                '#34D399',
  UPDATE:                '#60A5FA',
  DELETE:                '#F87171',
};

const ACTION_LABEL = {
  ADMIN_LOGIN:           'Admin Login',
  ACTIVATE_TENANT:       'Tenant Activated',
  DEACTIVATE_TENANT:     'Tenant Deactivated',
  CHANGE_PLAN:           'Plan Changed',
  ROLE_REQUEST_APPROVED: 'Role Approved',
  ROLE_REQUEST_REJECTED: 'Role Rejected',
  BUG_REPORT_UPDATE:     'Bug Report Updated',
};

export default function AuditLogs() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const PER_PAGE = 50;

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getSAAuditLogs({ limit: 200 });
      setLogs(data.data || []);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(s) ||
      l.resource?.toLowerCase().includes(s) ||
      l.actorName?.toLowerCase().includes(s) ||
      l.tenantName?.toLowerCase().includes(s) ||
      l.tenantSyllabrixId?.toLowerCase().includes(s)
    );
  });

  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F1F5F9' }}>
          Audit Logs
          <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B', marginLeft: 10 }}>{filtered.length} entries</span>
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Filter by admin, action, tenant…"
            style={inputStyle}
          />
          <button onClick={load}
            style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#64748B', fontSize: 14 }}>Loading…</div>
      ) : (
        <>
          <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E2D3D' }}>
                  {['Time', 'Admin', 'Action', 'Resource', 'Tenant', 'Details'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((log) => {
                  const color = ACTION_COLOR[log.action] || '#64748B';
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #1E2D3D' }}>
                      <td style={{ padding: '11px 14px', color: '#64748B', fontSize: 12, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                        {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '11px 14px', color: '#94A3B8', fontSize: 13 }}>
                        {log.actorName || '—'}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: `${color}22`, color, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {ACTION_LABEL[log.action] || log.action}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', color: '#94A3B8', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                        {log.resource}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ''}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13 }}>
                        {log.tenantName
                          ? <><span style={{ color: '#94A3B8' }}>{log.tenantName}</span>{log.tenantSyllabrixId && <span style={{ color: '#64748B', fontSize: 11, marginLeft: 6, fontFamily: 'var(--font-mono)' }}>{log.tenantSyllabrixId}</span>}</>
                          : <span style={{ color: '#334155' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '11px 14px', color: '#64748B', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {paginated.length === 0 && (
              <div style={{ color: '#64748B', textAlign: 'center', padding: 40, fontSize: 14 }}>
                {logs.length === 0 ? 'No audit logs yet — activity will appear here as admins take actions.' : 'No logs match your filter.'}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={pageBtn(page === 1)}>← Prev</button>
              <span style={{ color: '#64748B', fontSize: 13, padding: '7px 12px' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageBtn(page === totalPages)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const inputStyle = { padding: '8px 12px', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', minWidth: 260 };
const pageBtn = (disabled) => ({
  padding: '7px 16px', background: disabled ? '#192533' : 'rgba(31,184,214,0.1)',
  border: `1px solid ${disabled ? '#1E2D3D' : '#1FB8D6'}`,
  borderRadius: 8, color: disabled ? '#64748B' : '#1FB8D6',
  fontWeight: 600, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
});
