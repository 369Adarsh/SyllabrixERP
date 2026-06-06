import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTRStats, listTRs, promoteTR } from '../../api/platform';
import toast from 'react-hot-toast';

const STATUS_META = {
  DRAFT:         { label: 'Draft',        color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  APPROVED:      { label: 'Approved',     color: '#1FB8D6', bg: 'rgba(31,184,214,0.12)'  },
  DEVELOPMENT:   { label: 'Development',  color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
  TESTING:       { label: 'Testing',      color: '#EAB308', bg: 'rgba(234,179,8,0.12)'   },
  IN_QUALITY:    { label: 'Quality',      color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  IN_PRODUCTION: { label: 'Production',   color: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
  ROLLED_BACK:   { label: 'Rolled Back',  color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
};

const CATEGORY_COLOR = {
  FEATURE:     '#1FB8D6',
  BUGFIX:      '#F87171',
  ENHANCEMENT: '#A78BFA',
  CONFIG:      '#94A3B8',
  HOTFIX:      '#EF4444',
};

const PRIORITY_COLOR = {
  CRITICAL: '#EF4444',
  HIGH:     '#F97316',
  MEDIUM:   '#EAB308',
  LOW:      '#64748B',
};

const COLUMNS = ['DRAFT', 'APPROVED', 'DEVELOPMENT', 'TESTING', 'IN_QUALITY', 'IN_PRODUCTION'];

export default function TransportManager() {
  const navigate = useNavigate();
  const [trs, setTrs]         = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [promoting, setPromoting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [trRes, statsRes] = await Promise.all([listTRs(), getTRStats()]);
      setTrs(trRes.data.data || []);
      setStats(statsRes.data.data);
    } catch { toast.error('Failed to load transport requests'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = trs.filter((tr) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return tr.trCode.toLowerCase().includes(s) || tr.title.toLowerCase().includes(s) || tr.businessTypeCode.toLowerCase().includes(s);
  });

  const byStatus = (status) => filtered.filter((tr) => tr.status === status);

  const handlePromote = async (tr) => {
    const nextLabel = { APPROVED: 'Development', DEVELOPMENT: 'Testing', TESTING: 'Quality', IN_QUALITY: 'Production' }[tr.status];
    if (!window.confirm(`Promote "${tr.trCode}: ${tr.title}" to ${nextLabel}?`)) return;
    setPromoting(tr.id);
    try {
      await promoteTR(tr.id);
      toast.success(`${tr.trCode} promoted to ${nextLabel}`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Promotion failed'); }
    finally    { setPromoting(null); }
  };

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
            Transport Manager
          </h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>Track, promote, and rollback every change across Dev → Quality → Production</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/platform/transport/environments')}
            style={ghostBtn}>
            Environments
          </button>
          <button onClick={() => navigate('/platform/transport/new')}
            style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + New TR
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total TRs',   value: stats.total,        color: '#94A3B8' },
            { label: 'Draft',       value: stats.draft,        color: '#94A3B8' },
            { label: 'Approved',    value: stats.approved,     color: '#1FB8D6' },
            { label: 'Development', value: stats.development,  color: '#64748B' },
            { label: 'Testing',     value: stats.testing,      color: '#EAB308' },
            { label: 'In Quality',  value: stats.inQuality,    color: '#A78BFA' },
            { label: 'Production',  value: stats.inProduction, color: '#34D399' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: 600, letterSpacing: '0.05em' }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by TR code, title, or business type…"
          style={inputStyle}
        />
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div style={{ color: '#64748B', fontSize: 14, textAlign: 'center', paddingTop: 60 }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}>
          {COLUMNS.map((status) => {
            const meta  = STATUS_META[status];
            const items = byStatus(status);
            return (
              <div key={status}>
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {meta.label}
                  </span>
                  <span style={{ marginLeft: 'auto', background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.length === 0 && (
                    <div style={{ border: '1px dashed #1E2D3D', borderRadius: 10, padding: '20px 16px', textAlign: 'center', color: '#334155', fontSize: 12 }}>
                      No TRs
                    </div>
                  )}
                  {items.map((tr) => (
                    <div key={tr.id}
                      onClick={() => navigate(`/platform/transport/${tr.id}`)}
                      style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1FB8D6'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1E2D3D'}
                    >
                      {/* TR Code + Priority */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#1FB8D6', fontWeight: 700 }}>{tr.trCode}</span>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLOR[tr.priority], flexShrink: 0 }} title={tr.priority} />
                      </div>

                      {/* Title */}
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 10, lineHeight: 1.4 }}>
                        {tr.title}
                      </div>

                      {/* Category + BT */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: CATEGORY_COLOR[tr.category], background: `${CATEGORY_COLOR[tr.category]}18`, padding: '2px 7px', borderRadius: 99 }}>
                          {tr.category}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B', background: '#0F1923', padding: '2px 7px', borderRadius: 99, fontFamily: 'var(--font-mono)' }}>
                          {tr.businessTypeCode}
                        </span>
                        {tr.scopeLocked && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#F97316', background: 'rgba(249,115,22,0.12)', padding: '2px 7px', borderRadius: 99 }}>
                            LOCKED
                          </span>
                        )}
                      </div>

                      {/* Footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#64748B' }}>{new Date(tr.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        {['APPROVED', 'DEVELOPMENT', 'TESTING', 'IN_QUALITY'].includes(tr.status) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePromote(tr); }}
                            disabled={promoting === tr.id || tr.scopeLocked}
                            style={{
                              padding: '4px 10px', fontSize: 11, fontWeight: 700,
                              background: tr.scopeLocked ? 'rgba(249,115,22,0.1)' : 'rgba(31,184,214,0.1)',
                              border: `1px solid ${tr.scopeLocked ? '#F97316' : '#1FB8D6'}`,
                              color: tr.scopeLocked ? '#F97316' : '#1FB8D6',
                              borderRadius: 6, cursor: tr.scopeLocked ? 'not-allowed' : 'pointer',
                            }}>
                            {promoting === tr.id ? '…' : tr.scopeLocked ? 'Locked' : 'Promote →'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rolled Back section */}
      {filtered.filter((t) => t.status === 'ROLLED_BACK').length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F87171', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Rolled Back
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {filtered.filter((t) => t.status === 'ROLLED_BACK').map((tr) => (
              <div key={tr.id}
                onClick={() => navigate(`/platform/transport/${tr.id}`)}
                style={{ background: '#192533', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', opacity: 0.7 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#F87171', marginBottom: 4 }}>{tr.trCode}</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>{tr.title}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>{tr.rolledBackReason || 'No reason given'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '8px 14px', background: '#192533', border: '1px solid #1E2D3D',
  borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', width: 340,
};
const ghostBtn = {
  padding: '8px 16px', background: 'transparent', border: '1px solid #1E2D3D',
  borderRadius: 8, color: '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
