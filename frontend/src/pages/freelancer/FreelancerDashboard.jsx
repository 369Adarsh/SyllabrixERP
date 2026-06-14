import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Briefcase, Clock, TrendingUp, AlertTriangle, Plus, RefreshCw, ChevronRight, CheckCircle2 } from 'lucide-react';
import { dashboardStats, listJobs } from '../../api/freelancer';
import { useAuth } from '../../context/AuthContext';

const OR = '#f97316';
const TEXT = '#f1f5f9';
const MUTED = '#64748b';
const CARD = '#141414';
const BORDER = '#1e1e1e';
const GR = '#10b981';
const YE = '#f59e0b';
const RE = '#ef4444';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const STATUS = {
  ENQUIRY:         { label: 'Enquiry',         color: '#94a3b8' },
  ESTIMATE_SENT:   { label: 'Estimate Sent',   color: '#60a5fa' },
  IN_PROGRESS:     { label: 'In Progress',     color: GR },
  COMPLETED:       { label: 'Completed',       color: '#34d399' },
  PAYMENT_PENDING: { label: 'Payment Pending', color: YE },
  CLOSED:          { label: 'Closed',          color: '#818cf8' },
  CANCELLED:       { label: 'Cancelled',       color: RE },
};

function KpiCard({ icon: Icon, label, value, color, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px', cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}1a`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={17} color={color} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: TEXT, marginBottom: 3, letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 13, color: MUTED }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color, marginTop: 5, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, color: MUTED };
  return (
    <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${s.color}18`, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

export default function FreelancerDashboard() {
  const { user, tenant } = useAuth();
  const jobLabel = tenant?.labelConfig?.flLabels?.jobs || 'Jobs';
  const jobSingular = jobLabel.replace(/s$/, '');
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([dashboardStats(), listJobs({ limit: 6, page: 1 })])
      .then(([s, j]) => {
        setStats(s.data);
        setRecentJobs(j.data.jobs || []);
      })
      .catch((err) => {
        const code = err?.response?.status;
        setError(code === 404 ? 'API not found — backend may still be deploying. Try again in a minute.' : code === 401 ? 'Session expired. Please log in again.' : `Error ${code || 'Network'} — ${err?.response?.data?.error || err.message}`);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ maxWidth: 1080 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 3 }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ fontSize: 14, color: MUTED }}>Here's your work at a glance</p>
        </div>
        <button
          onClick={() => navigate('/freelancer/jobs/new')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={15} /> New {jobSingular}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px', height: 110 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#222', marginBottom: 14 }} />
              <div style={{ width: '60%', height: 20, background: '#222', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: '40%', height: 13, background: '#1a1a1a', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '32px 24px', textAlign: 'center', marginBottom: 28 }}>
          <AlertTriangle size={28} color={YE} style={{ marginBottom: 12 }} />
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>Could not load dashboard</p>
          <p style={{ color: MUTED, fontSize: 13, marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>{error}</p>
          <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: OR, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : stats ? (
        <>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            <KpiCard icon={IndianRupee} label="Earned this month" value={fmt(stats.earnedThisMonth)} color={OR} />
            <KpiCard
              icon={Clock} label="Pending payments" value={fmt(stats.pendingAmount)} color={YE}
              sub={stats.pendingPaymentJobs > 0 ? `${stats.pendingPaymentJobs} jobs pending` : null}
              onClick={() => navigate('/freelancer/bills')}
            />
            <KpiCard icon={Briefcase} label="Active jobs" value={stats.activeJobs} color="#22d3ee" onClick={() => navigate('/freelancer/jobs?status=IN_PROGRESS')} />
            <KpiCard icon={TrendingUp} label="Completed this month" value={stats.completedThisMonth} color={GR} />
          </div>

          {/* Month summary strip */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Expenses this month</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: RE }}>{fmt(stats.expensesThisMonth)}</div>
            </div>
            <div style={{ width: 1, background: BORDER, alignSelf: 'stretch' }} />
            <div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Net this month</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: (stats.earnedThisMonth - stats.expensesThisMonth) >= 0 ? GR : RE }}>
                {fmt(stats.earnedThisMonth - stats.expensesThisMonth)}
              </div>
            </div>
          </div>

          {/* Overdue alert */}
          {stats.overdueJobs?.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <AlertTriangle size={15} color={RE} />
                <span style={{ fontSize: 13, fontWeight: 600, color: RE }}>
                  {stats.overdueJobs.length} overdue job{stats.overdueJobs.length > 1 ? 's' : ''} — end date passed
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stats.overdueJobs.slice(0, 4).map(j => (
                  <div key={j.id} onClick={() => navigate(`/freelancer/jobs/${j.id}`)}
                    style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '6px 0', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
                    <span style={{ fontSize: 13, color: TEXT }}><span style={{ color: OR, fontWeight: 600 }}>{j.jobNumber}</span> · {j.customerName}</span>
                    <span style={{ fontSize: 12, color: RE }}>Due {j.endDate ? fmtDate(j.endDate) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Jobs */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>Recent {jobLabel}</span>
              <button onClick={() => navigate('/freelancer/jobs')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: OR, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                View all <ChevronRight size={13} />
              </button>
            </div>
            {recentJobs.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: MUTED, fontSize: 13 }}>No jobs yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Job No.', 'Customer', 'Work Type', 'Value', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((j, i) => (
                    <tr
                      key={j.id}
                      onClick={() => navigate(`/freelancer/jobs/${j.id}`)}
                      style={{ borderBottom: i < recentJobs.length - 1 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: OR }}>{j.jobNumber}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: TEXT }}>{j.customerName}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: MUTED }}>{j.workType || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: TEXT }}>{fmt(j.jobValue)}</td>
                      <td style={{ padding: '12px 16px' }}><StatusBadge status={j.status} /></td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: MUTED }}>{fmtDate(j.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: MUTED, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Actions</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: `+ New ${jobSingular}`, path: '/freelancer/jobs/new' },
                { label: 'Log Expense',        path: '/freelancer/expenses' },
                { label: 'Add AMC Contract',   path: '/freelancer/amc' },
                { label: 'Add Client',         path: '/freelancer/clients' },
                { label: 'Bills & Payments',   path: '/freelancer/bills' },
              ].map(a => (
                <button key={a.path} onClick={() => navigate(a.path)}
                  style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = OR; e.currentTarget.style.color = OR; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT; }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* All OK banner if nothing pending */}
          {stats.pendingAmount === 0 && stats.overdueJobs?.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, marginTop: 16 }}>
              <CheckCircle2 size={15} color={GR} />
              <span style={{ fontSize: 13, color: GR }}>All caught up — no overdue jobs, no pending payments</span>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
