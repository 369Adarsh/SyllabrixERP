import { useState, useEffect, useCallback } from 'react';
import { getSAAuditReports, updateSAAuditReport } from '../../api/platform';
import { usePlatformAuth } from '../../context/PlatformAuthContext';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const STATUS_META = {
  SUBMITTED:   { label: 'Submitted',   color: '#94A3B8', next: null },
  ASSIGNED:    { label: 'Assigned',    color: '#60A5FA', next: 'IN_PROGRESS' },
  IN_PROGRESS: { label: 'In Progress', color: '#F59E0B', next: 'RESOLVED' },
  RESOLVED:    { label: 'Resolved',    color: '#34D399', next: 'CLOSED' },
  CLOSED:      { label: 'Closed',      color: '#64748B', next: null },
};

const NEXT_LABEL = {
  IN_PROGRESS: 'Start Working',
  RESOLVED:    'Mark Resolved',
  CLOSED:      'Close',
};

const PRIORITY_META = {
  P1: { label: 'P1 Critical', color: '#F87171' },
  P2: { label: 'P2 Standard', color: '#F59E0B' },
  P3: { label: 'P3 Low',      color: '#94A3B8' },
};

const PAGE_LABELS = {
  '/dashboard': 'Dashboard', '/appointments': 'Appointments', '/membership-plans': 'Membership Plans',
  '/fees': 'Fees', '/staff': 'Staff', '/customers': 'Customers', '/inventory': 'Inventory',
  '/pos': 'Point of Sale', '/invoices': 'Invoicing', '/expenses': 'Expenses',
  '/reports': 'Reports', '/accounts': 'Accounts', '/ai-copilot': 'AI Copilot',
  '/auth': 'Login / Auth', '/settings': 'Settings',
};

function Chip({ label, color }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${color}22`, color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function QueueCard({ report, onDone }) {
  const [saving, setSaving]       = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [fixNotes, setFixNotes]   = useState(report.fixNotes || '');

  const sm = STATUS_META[report.status] || STATUS_META.SUBMITTED;
  const pm = PRIORITY_META[report.priority] || PRIORITY_META.P2;
  const nextStatus = sm.next;

  const advance = async () => {
    if (!nextStatus) return;
    if (nextStatus === 'RESOLVED') { setShowNotes(true); return; }
    setSaving(true);
    try {
      await updateSAAuditReport(report.reportId, { status: nextStatus });
      toast.success(`Moved to ${STATUS_META[nextStatus]?.label}`);
      onDone();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const resolve = async () => {
    if (!fixNotes.trim()) { toast.error('Add a fix description before resolving'); return; }
    setSaving(true);
    try {
      await updateSAAuditReport(report.reportId, { status: 'RESOLVED', fixNotes });
      toast.success('Marked resolved');
      onDone();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const isClosed = report.status === 'RESOLVED' || report.status === 'CLOSED';

  return (
    <div style={{ background: '#192533', borderRadius: 12, border: `1px solid ${isClosed ? '#1E2D3D' : '#2A3D50'}`, padding: '18px 20px', marginBottom: 10, opacity: isClosed ? 0.65 : 1 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#1FB8D6' }}>
              {report.reportId}
            </span>
            <Chip label={pm.label} color={pm.color} />
            <Chip label={sm.label} color={sm.color} />
            {report.occurrences > 1 && <Chip label={`${report.occurrences}× reported`} color="#A78BFA" />}
          </div>
          <div style={{ fontSize: 14, color: '#F1F5F9', fontWeight: 500, marginBottom: 6, lineHeight: 1.5 }}>
            {report.errorDesc}
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#64748B', flexWrap: 'wrap' }}>
            <span style={{ color: '#94A3B8' }}>{report.tenant?.name || report.tenantId}</span>
            <span>·</span>
            <span>{PAGE_LABELS[report.pageRoute] || report.pageRoute}</span>
            <span>·</span>
            <span>{new Date(report.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        {/* Action button */}
        {nextStatus && !showNotes && (
          <button
            onClick={advance} disabled={saving}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              border: 'none', flexShrink: 0, opacity: saving ? 0.7 : 1,
              background: nextStatus === 'RESOLVED' ? 'linear-gradient(135deg,#34D399,#10B981)' : 'linear-gradient(135deg,#1FB8D6,#27DCFF)',
              color: '#0B131C',
            }}>
            {saving ? 'Saving…' : NEXT_LABEL[nextStatus]}
          </button>
        )}
      </div>

      {/* Affected modules */}
      {report.modules?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: showNotes ? 12 : 0 }}>
          {report.modules.map(m => (
            <span key={m} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: 'rgba(31,184,214,0.12)', color: '#1FB8D6', fontFamily: 'var(--font-mono)' }}>
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Resolve panel */}
      {showNotes && (
        <div style={{ marginTop: 12, borderTop: '1px solid #1E2D3D', paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Fix Description (shown to the business)
          </div>
          <textarea
            rows={3} value={fixNotes} onChange={e => setFixNotes(e.target.value)}
            placeholder="Describe what was fixed — the business will see this in their portal…"
            style={{ width: '100%', padding: '10px 12px', background: '#111C27', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-body)', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={resolve} disabled={saving}
              style={{ padding: '9px 24px', background: 'linear-gradient(135deg,#34D399,#10B981)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Confirm Resolved'}
            </button>
            <button onClick={() => setShowNotes(false)}
              style={{ padding: '9px 16px', background: '#1E2D3D', border: '1px solid #2A3D50', borderRadius: 8, color: '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Resolved fix notes display */}
      {report.status === 'RESOLVED' && report.fixNotes && !showNotes && (
        <div style={{ marginTop: 10, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#34D399', lineHeight: 1.5 }}>
          <strong>Fix: </strong>{report.fixNotes}
        </div>
      )}
    </div>
  );
}

export default function DevQueue() {
  const { admin } = usePlatformAuth();
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    if (!admin?.name) return;
    setLoading(true);
    try {
      const r = await getSAAuditReports({ assignedTo: admin.name, limit: 200 });
      setReports(r.data?.data || []);
    } catch { toast.error('Failed to load queue'); }
    finally { setLoading(false); }
  }, [admin?.name]);

  useEffect(() => { load(); }, [load]);

  const active = reports.filter(r => !['RESOLVED', 'CLOSED'].includes(r.status));
  const done   = reports.filter(r =>  ['RESOLVED', 'CLOSED'].includes(r.status));
  const visible = showDone ? done : active;

  const stats = {
    total:      active.length,
    inProgress: active.filter(r => r.status === 'IN_PROGRESS').length,
    p1:         active.filter(r => r.priority === 'P1').length,
    resolved:   done.length,
  };

  return (
    <div style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
            My Queue
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Tickets assigned to <span style={{ color: '#1FB8D6', fontWeight: 600 }}>{admin?.name}</span>
          </p>
        </div>
        <button onClick={load}
          style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Open',        value: stats.total,      color: '#1FB8D6' },
          { label: 'In Progress', value: stats.inProgress, color: '#F59E0B' },
          { label: 'P1 Critical', value: stats.p1,         color: '#F87171' },
          { label: 'Resolved',    value: stats.resolved,   color: '#34D399' },
        ].map(s => (
          <div key={s.label} style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { label: `Active (${active.length})`, value: false },
          { label: `Resolved / Closed (${done.length})`, value: true },
        ].map(t => (
          <button key={String(t.value)} onClick={() => setShowDone(t.value)}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: showDone === t.value ? 'rgba(31,184,214,0.15)' : '#111C27',
              color: showDone === t.value ? '#1FB8D6' : '#64748B',
              border: `1px solid ${showDone === t.value ? '#1FB8D6' : '#1E2D3D'}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748B', fontSize: 14 }}>Loading…</div>
      ) : visible.length === 0 ? (
        <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{showDone ? '✓' : '🎉'}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#F1F5F9', marginBottom: 6 }}>
            {showDone ? 'No resolved tickets yet' : 'Queue is clear!'}
          </div>
          <div style={{ fontSize: 13, color: '#64748B' }}>
            {showDone ? 'Resolved tickets will appear here.' : 'No tickets assigned to you right now.'}
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>{visible.length} ticket{visible.length !== 1 ? 's' : ''}</div>
          {visible.map(r => <QueueCard key={r.id} report={r} onDone={load} />)}
        </>
      )}
    </div>
  );
}
