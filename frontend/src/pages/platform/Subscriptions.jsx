import { useEffect, useState, useCallback } from 'react';
import { getSASubscriptions, changeSATenantPlan } from '../../api/platform';
import toast from 'react-hot-toast';

const PLAN_COLOR = { FREE: '#64748B', STARTER: '#34D399', GROWTH: '#60A5FA', SCALE: '#A78BFA' };
const PLAN_BG    = { FREE: 'rgba(100,116,139,0.12)', STARTER: 'rgba(52,211,153,0.12)', GROWTH: 'rgba(96,165,250,0.12)', SCALE: 'rgba(167,139,250,0.12)' };
const PLANS      = ['FREE', 'STARTER', 'GROWTH', 'SCALE'];
const fmt        = (n) => new Intl.NumberFormat('en-IN').format(n);

const PlanBadge = ({ plan }) => (
  <span style={{
    background: PLAN_BG[plan] || 'rgba(100,116,139,0.12)',
    color: PLAN_COLOR[plan] || '#64748B',
    padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
  }}>{plan}</span>
);

export default function Subscriptions() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ plan: '', status: '', search: '' });
  const [page, setPage]       = useState(1);
  const [changing, setChanging] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getSASubscriptions({ ...filters, page, limit: 25 })
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load subscriptions'))
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const handlePlanChange = async (tenantId, newPlan) => {
    setChanging(tenantId);
    try {
      await changeSATenantPlan(tenantId, newPlan);
      toast.success(`Plan updated to ${newPlan}`);
      load();
    } catch {
      toast.error('Failed to update plan');
    } finally {
      setChanging(null);
    }
  };

  const subs   = data?.subscriptions || [];
  const total  = data?.total || 0;
  const totalPages = Math.ceil(total / 25);
  const planSummary = data?.planSummary || [];
  const totalMrr = data?.totalMrr || 0;

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
          Subscriptions
        </h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          {fmt(total)} total tenants · ₹{fmt(totalMrr)} MRR
        </p>
      </div>

      {/* MRR + plan summary cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 150, background: '#192533', borderRadius: 12, padding: '18px 20px', border: '1px solid #1E2D3D' }}>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Total MRR</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#34D399', fontFamily: 'var(--font-display)' }}>₹{fmt(totalMrr)}</div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>from active paid plans</div>
        </div>
        {planSummary.map(p => (
          <div key={p.plan} style={{ flex: 1, minWidth: 130, background: '#192533', borderRadius: 12, padding: '18px 20px', border: `1px solid ${PLAN_COLOR[p.plan]}22` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: PLAN_COLOR[p.plan], letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{p.plan}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#F1F5F9', fontFamily: 'var(--font-display)' }}>{p.count}</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>₹{fmt(p.mrr)} / mo</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          value={filters.search}
          onChange={e => handleFilterChange('search', e.target.value)}
          placeholder="Search by name, ID, email…"
          style={{
            flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 8, fontSize: 13,
            background: '#192533', border: '1px solid #1E2D3D', color: '#F1F5F9', outline: 'none',
          }}
        />
        <select
          value={filters.plan}
          onChange={e => handleFilterChange('plan', e.target.value)}
          style={selectStyle}
        >
          <option value="">All Plans</option>
          {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={e => handleFilterChange('status', e.target.value)}
          style={selectStyle}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E2D3D' }}>
              {['Business', 'ID', 'Plan', 'Monthly', 'Next Renewal', 'Days Left', 'Status', 'Change Plan'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 13 }}>Loading…</td></tr>
            )}
            {!loading && subs.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 13 }}>No subscriptions found</td></tr>
            )}
            {subs.map(s => {
              const daysColor = s.daysUntilRenewal <= 3 ? '#F87171' : s.daysUntilRenewal <= 7 ? '#F59E0B' : '#34D399';
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #1E2D3D' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{s.businessName}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{s.businessType?.replace(/_/g, ' ')}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#475569' }}>{s.syllabrixId}</td>
                  <td style={{ padding: '12px 16px' }}><PlanBadge plan={s.plan} /></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: s.monthlyPrice > 0 ? '#34D399' : '#475569' }}>
                    {s.monthlyPrice > 0 ? `₹${fmt(s.monthlyPrice)}` : 'Free'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#94A3B8' }}>
                    {new Date(s.nextRenewal).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {s.isActive ? (
                      <span style={{ fontSize: 13, fontWeight: 700, color: daysColor }}>{s.daysUntilRenewal}d</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#F87171', fontWeight: 700 }}>Suspended</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: s.isActive ? '#34D399' : '#F87171', fontSize: 12, fontWeight: 700 }}>
                      {s.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={s.plan}
                      disabled={changing === s.id}
                      onChange={e => handlePlanChange(s.id, e.target.value)}
                      style={{
                        padding: '5px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: '#0F1923', border: `1px solid ${PLAN_COLOR[s.plan]}55`,
                        color: PLAN_COLOR[s.plan], cursor: changing === s.id ? 'not-allowed' : 'pointer',
                        outline: 'none',
                      }}
                    >
                      {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={pageBtn}
          >← Prev</button>
          <span style={{ fontSize: 13, color: '#64748B' }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={pageBtn}
          >Next →</button>
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  padding: '9px 12px', borderRadius: 8, fontSize: 13,
  background: '#192533', border: '1px solid #1E2D3D', color: '#94A3B8',
  outline: 'none', cursor: 'pointer',
};

const pageBtn = {
  padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  background: '#192533', border: '1px solid #1E2D3D', color: '#94A3B8', cursor: 'pointer',
};
