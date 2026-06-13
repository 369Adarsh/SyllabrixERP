import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Briefcase } from 'lucide-react';
import { listJobs } from '../../api/freelancer';
import toast from 'react-hot-toast';

const OR = '#f97316';
const TEXT = '#f1f5f9';
const MUTED = '#64748b';
const CARD = '#141414';
const BORDER = '#1e1e1e';

const STATUS_COLORS = {
  ENQUIRY: { bg: '#1E293B', color: '#94A3B8', label: 'Enquiry' },
  ESTIMATE_SENT: { bg: '#1C2A3A', color: '#60A5FA', label: 'Estimate Sent' },
  IN_PROGRESS: { bg: '#1A2A1A', color: '#4ADE80', label: 'In Progress' },
  COMPLETED: { bg: '#1A2A20', color: '#34D399', label: 'Completed' },
  PAYMENT_PENDING: { bg: '#2A1F0A', color: '#FBBF24', label: 'Payment Pending' },
  CLOSED: { bg: '#1A1A2A', color: '#818CF8', label: 'Closed' },
  CANCELLED: { bg: '#2A1A1A', color: '#F87171', label: 'Cancelled' },
};

const STATUSES = ['', 'ENQUIRY', 'ESTIMATE_SENT', 'IN_PROGRESS', 'COMPLETED', 'PAYMENT_PENDING', 'CLOSED', 'CANCELLED'];

const fmt = (n) => n ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—';

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#1f1f1f', color: MUTED, label: status };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export default function FreelancerJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    listJobs({ search: search || undefined, status: status || undefined, page, limit: 20 })
      .then(r => { setJobs(r.data.jobs); setTotal(r.data.total); })
      .catch(() => toast.error('Could not load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status, page]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 2 }}>Jobs</h1>
          <p style={{ fontSize: 13, color: MUTED }}>{total} total</p>
        </div>
        <button
          onClick={() => navigate('/freelancer/jobs/new')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={15} /> New Job
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: MUTED }} />
          <input
            type="text"
            placeholder="Search by customer, work type, job no…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ padding: '9px 12px 9px 32px', background: '#161616', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: '9px 12px', background: '#161616', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: status ? TEXT : MUTED, outline: 'none' }}
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{s ? STATUS_COLORS[s]?.label : 'All status'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: MUTED, fontSize: 14, padding: '20px 0' }}>Loading jobs…</div>
      ) : jobs.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '48px', textAlign: 'center' }}>
          <Briefcase size={36} color={MUTED} style={{ marginBottom: 12 }} />
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>No jobs yet</p>
          <p style={{ color: MUTED, fontSize: 13, marginBottom: 20 }}>Add your first job to start tracking your work</p>
          <button onClick={() => navigate('/freelancer/jobs/new')} style={{ padding: '9px 20px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
            + New Job
          </button>
        </div>
      ) : (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Job No.', 'Customer', 'Work Type', 'Value', 'Status', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: MUTED, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((j, i) => (
                  <tr
                    key={j.id}
                    style={{ borderBottom: i < jobs.length - 1 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => navigate(`/freelancer/jobs/${j.id}`)}
                  >
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: OR }}>{j.jobNumber}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: TEXT }}>{j.customerName}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: MUTED }}>{j.workType || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: TEXT, fontWeight: 500 }}>{fmt(j.jobValue)}</td>
                    <td style={{ padding: '13px 16px' }}><StatusBadge status={j.status} /></td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: MUTED }}>
                      {new Date(j.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 12, color: OR, fontWeight: 500 }}>View →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '14px', borderTop: `1px solid ${BORDER}` }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, cursor: 'pointer', fontSize: 13 }}>←</button>
              <span style={{ fontSize: 13, color: MUTED, alignSelf: 'center' }}>Page {page} of {Math.ceil(total / 20)}</span>
              <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, cursor: 'pointer', fontSize: 13 }}>→</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

