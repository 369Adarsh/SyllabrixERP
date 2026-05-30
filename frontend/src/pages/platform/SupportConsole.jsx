import { useState, useEffect, useCallback } from 'react';
import { getSAAuditReports, updateSAAuditReport } from '../../api/platform';
import toast from 'react-hot-toast';

const STATUS_META = {
  SUBMITTED:   { label: 'Submitted',   color: '#94A3B8' },
  ASSIGNED:    { label: 'Assigned',    color: '#60A5FA' },
  IN_PROGRESS: { label: 'In Progress', color: '#F59E0B' },
  RESOLVED:    { label: 'Resolved',    color: '#34D399' },
  CLOSED:      { label: 'Closed',      color: '#64748B' },
};

const PRIORITY_META = {
  P1: { label: 'P1 Critical', color: '#F87171' },
  P2: { label: 'P2 Standard', color: '#F59E0B' },
  P3: { label: 'P3 Low',      color: '#94A3B8' },
};

function Chip({ label, color }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: `${color}22`, color, whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function ReportCard({ report, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({
    status: report.status, assignedTo: report.assignedTo || '', fixNotes: report.fixNotes || '',
  });

  const sm = STATUS_META[report.status] || STATUS_META.SUBMITTED;
  const pm = PRIORITY_META[report.priority] || PRIORITY_META.P2;

  const save = async () => {
    setSaving(true);
    try {
      await updateSAAuditReport(report.reportId, form);
      onUpdate();
      toast.success('Report updated');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', padding: '16px 20px', marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#1FB8D6' }}>
              {report.reportId}
            </span>
            <Chip label={pm.label} color={pm.color} />
            <Chip label={sm.label} color={sm.color} />
            {report.occurrences > 1 && <Chip label={`${report.occurrences}× reported`} color="#A78BFA" />}
          </div>
          <div style={{ fontSize: 13, color: '#F1F5F9', marginBottom: 6, lineHeight: 1.5 }}>
            {report.errorDesc?.length > 150 ? report.errorDesc.slice(0, 150) + '…' : report.errorDesc}
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#64748B', flexWrap: 'wrap' }}>
            <span style={{ color: '#94A3B8' }}>{report.tenant?.name || report.tenantId}</span>
            <span>·</span>
            <span>{report.tenant?.businessType?.replace(/_/g, ' ')}</span>
            {report.tenant?.syllabrixId && (
              <><span>·</span><span style={{ fontFamily: 'var(--font-mono)' }}>{report.tenant.syllabrixId}</span></>
            )}
            <span>·</span>
            <span>{report.pageRoute}</span>
            <span>·</span>
            <span>{new Date(report.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ padding: '7px 16px', background: '#1E2D3D', border: '1px solid #2A3D50', borderRadius: 8, color: '#94A3B8', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
        >
          {expanded ? 'Collapse' : 'Manage'}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, borderTop: '1px solid #1E2D3D', paddingTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={labelStyle}>Status</div>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <div style={labelStyle}>Assigned To</div>
              <input value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                placeholder="Developer name" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={save} disabled={saving}
                style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {form.status === 'RESOLVED' && (
            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>Fix Description (visible to business in their portal)</div>
              <textarea rows={2} value={form.fixNotes} onChange={e => setForm(f => ({ ...f, fixNotes: e.target.value }))}
                placeholder="Describe what was fixed so the business sees it in their Report Error tab…"
                style={{ ...inputStyle, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          )}

          {report.modules?.length > 0 && (
            <div>
              <div style={labelStyle}>Affected Modules</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {report.modules.map(m => (
                  <span key={m} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: 'rgba(31,184,214,0.12)', color: '#1FB8D6', fontFamily: 'var(--font-mono)' }}>{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SupportConsole() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [search, setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status)   params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const r = await getSAAuditReports(params);
      setReports(r.data?.data || []);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const visible = reports.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.reportId?.toLowerCase().includes(s) ||
      r.errorDesc?.toLowerCase().includes(s) ||
      r.tenant?.name?.toLowerCase().includes(s) ||
      r.tenant?.syllabrixId?.toLowerCase().includes(s)
    );
  });

  const stats = {
    total:    reports.length,
    p1:       reports.filter(r => r.priority === 'P1').length,
    open:     reports.filter(r => !['RESOLVED', 'CLOSED'].includes(r.status)).length,
    resolved: reports.filter(r => r.status === 'RESOLVED').length,
  };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
            Bug Reports
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Diagnostic error reports submitted by businesses — review, assign, and resolve</p>
        </div>
        <button onClick={load}
          style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Reports', value: stats.total,    color: '#1FB8D6' },
          { label: 'P1 Critical',   value: stats.p1,       color: '#F87171' },
          { label: 'Open',          value: stats.open,     color: '#F59E0B' },
          { label: 'Resolved',      value: stats.resolved, color: '#34D399' },
        ].map(s => (
          <div key={s.label} style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, error, or business…"
          style={{ flex: 1, minWidth: 200, padding: '7px 12px', background: '#111C27', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none' }} />

        <div style={{ display: 'flex', gap: 6 }}>
          {['', 'P1', 'P2', 'P3'].map(p => (
            <button key={p} onClick={() => setFilters(f => ({ ...f, priority: p }))} style={chip(filters.priority === p)}>
              {p || 'All Priority'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {['', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
            <button key={s} onClick={() => setFilters(f => ({ ...f, status: s }))} style={chip(filters.status === s)}>
              {s ? (STATUS_META[s]?.label || s) : 'All Status'}
            </button>
          ))}
        </div>
      </div>

      {/* Reports list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748B', fontSize: 14 }}>Loading reports…</div>
      ) : visible.length === 0 ? (
        <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: '60px 20px', textAlign: 'center', color: '#64748B', fontSize: 14 }}>
          {reports.length === 0 ? 'No diagnostic reports submitted yet.' : 'No reports match your filter.'}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>
            {visible.length} report{visible.length !== 1 ? 's' : ''}
          </div>
          {visible.map(r => <ReportCard key={r.id} report={r} onUpdate={load} />)}
        </>
      )}
    </div>
  );
}

const labelStyle = { fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase' };
const inputStyle = { width: '100%', padding: '8px 12px', background: '#111C27', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)' };
const chip = (active) => ({
  padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
  background: active ? 'rgba(31,184,214,0.15)' : '#111C27',
  color: active ? '#1FB8D6' : '#64748B',
  border: `1px solid ${active ? '#1FB8D6' : '#1E2D3D'}`,
});
