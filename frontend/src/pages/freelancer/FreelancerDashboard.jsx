import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Briefcase, Clock, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { dashboardStats } from '../../api/freelancer';
import { useAuth } from '../../context/AuthContext';

const OR = '#F97316';
const TEXT = '#F3F4F6';
const MUTED = '#9CA3AF';
const CARD = '#161616';
const BORDER = '#222';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

function KpiCard({ icon: Icon, label, value, color = OR, sub }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}1a`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: MUTED }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: color, marginTop: 6, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardStats()
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 4 }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ fontSize: 14, color: MUTED }}>Here's a snapshot of your work today</p>
        </div>
        <button
          onClick={() => navigate('/freelancer/jobs/new')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={16} />
          New Job
        </button>
      </div>

      {loading ? (
        <div style={{ color: MUTED, fontSize: 14 }}>Loading stats…</div>
      ) : stats ? (
        <>
          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <KpiCard icon={IndianRupee} label="Earned this month" value={fmt(stats.earnedThisMonth)} color={OR} />
            <KpiCard icon={Clock} label="Pending payments" value={fmt(stats.pendingAmount)} color="#F59E0B" sub={stats.pendingPaymentJobs > 0 ? `${stats.pendingPaymentJobs} jobs pending` : null} />
            <KpiCard icon={Briefcase} label="Active jobs" value={stats.activeJobs} color="#22D3EE" />
            <KpiCard icon={TrendingUp} label="Completed this month" value={stats.completedThisMonth} color="#4ADE80" />
          </div>

          {/* Overdue jobs alert */}
          {stats.overdueJobs?.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={16} color="#EF4444" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#EF4444' }}>Overdue Jobs ({stats.overdueJobs.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.overdueJobs.slice(0, 5).map(j => (
                  <div
                    key={j.id}
                    onClick={() => navigate(`/freelancer/jobs/${j.id}`)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px 0' }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{j.jobNumber}</span>
                      <span style={{ fontSize: 13, color: MUTED, marginLeft: 8 }}>{j.customerName}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#EF4444' }}>
                      {j.endDate ? `Due ${new Date(j.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Overdue'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'New Job', path: '/freelancer/jobs/new' },
                { label: 'View Jobs', path: '/freelancer/jobs' },
                { label: 'Add Client', path: '/freelancer/clients' },
                { label: 'Log Expense', path: '/freelancer/expenses' },
              ].map(a => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  style={{ padding: '8px 16px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 8, color: OR, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: MUTED, fontSize: 14 }}>Could not load stats. Check your connection.</div>
      )}
    </div>
  );
}
