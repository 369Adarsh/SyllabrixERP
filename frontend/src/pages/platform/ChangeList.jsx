import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCRStats, listCRs } from '../../api/platform';
import toast from 'react-hot-toast';

const STATUS_META = {
  DRAFT:          { label: 'Draft',          color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  APPROVED:       { label: 'Approved',       color: '#1FB8D6', bg: 'rgba(31,184,214,0.12)'  },
  IN_DEVELOPMENT: { label: 'In Development', color: '#EAB308', bg: 'rgba(234,179,8,0.12)'   },
  COMPLETED:      { label: 'Completed',      color: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
  REJECTED:       { label: 'Rejected',       color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
};

const PRIORITY_COLOR = { CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#EAB308', LOW: '#64748B' };

export default function ChangeList() {
  const navigate = useNavigate();
  const [items, setItems]   = useState([]);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        listCRs({ type: filterType || undefined, status: filterStatus || undefined, search: search || undefined }),
        getCRStats(),
      ]);
      setItems(listRes.data.data || []);
      setStats(statsRes.data.data);
    } catch { toast.error('Failed to load change requests'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterType, filterStatus]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') load();
  };

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
            Change Requests
          </h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>All CRs and Enhancements — every change starts here before development begins</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/platform/changes/new?type=CR')}
            style={ghostBtn}>
            + New CR
          </button>
          <button onClick={() => navigate('/platform/changes/new?type=ENHANCEMENT')}
            style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + New Enhancement
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total',         value: stats.total,         color: '#94A3B8' },
            { label: 'CRs',           value: stats.crs,           color: '#A78BFA' },
            { label: 'Enhancements',  value: stats.enhancements,  color: '#1FB8D6' },
            { label: 'Draft',         value: stats.draft,         color: '#64748B' },
            { label: 'Approved',      value: stats.approved,      color: '#1FB8D6' },
            { label: 'In Dev',        value: stats.inDevelopment, color: '#EAB308' },
            { label: 'Completed',     value: stats.completed,     color: '#34D399' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 2, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search by code, title, business type… (Enter)"
          style={inputStyle}
        />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectStyle}>
          <option value="">All Types</option>
          <option value="CR">Change Request</option>
          <option value="ENHANCEMENT">Enhancement</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="APPROVED">Approved</option>
          <option value="IN_DEVELOPMENT">In Development</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: '#64748B', fontSize: 14, textAlign: 'center', paddingTop: 60 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60, color: '#334155' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, color: '#64748B' }}>No change requests yet. Create your first CR or Enhancement.</div>
        </div>
      ) : (
        <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E2D3D' }}>
                {['Code', 'Type', 'Title', 'Business Type', 'Priority', 'Status', 'Created'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const sm = STATUS_META[item.status] || STATUS_META.DRAFT;
                return (
                  <tr key={item.id}
                    onClick={() => navigate(`/platform/changes/${item.id}`)}
                    style={{ borderBottom: '1px solid #1E2D3D', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(31,184,214,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1FB8D6', fontWeight: 700 }}>{item.crCode}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: item.type === 'CR' ? '#A78BFA' : '#1FB8D6', background: item.type === 'CR' ? 'rgba(167,139,250,0.12)' : 'rgba(31,184,214,0.12)', padding: '2px 8px', borderRadius: 99 }}>
                        {item.type === 'CR' ? 'CR' : 'ENH'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#E2E8F0', fontWeight: 500, maxWidth: 280 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#64748B' }}>{item.businessTypeCode}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLOR[item.priority], display: 'inline-block' }} title={item.priority} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: sm.color, background: sm.bg, padding: '2px 9px', borderRadius: 99 }}>{sm.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B' }}>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputStyle  = { padding: '8px 14px', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', width: 320 };
const selectStyle = { padding: '8px 12px', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 8, color: '#94A3B8', fontSize: 13, outline: 'none', cursor: 'pointer' };
const ghostBtn    = { padding: '8px 16px', background: 'transparent', border: '1px solid #1E2D3D', borderRadius: 8, color: '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
