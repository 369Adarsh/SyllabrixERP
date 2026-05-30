import { useEffect, useState, useCallback } from 'react';
import { getSAPlansOverview, changeSATenantPlan, toggleSATenant } from '../../api/platform';
import toast from 'react-hot-toast';

const PLAN_COLOR = { STARTER: '#34D399', GROWTH: '#60A5FA', SCALE: '#A78BFA' };
const PLANS = ['STARTER', 'GROWTH', 'SCALE'];
const fmt = (n) => new Intl.NumberFormat('en-IN').format(n);
const PLAN_PRICE = { STARTER: 999, GROWTH: 2499, SCALE: 4999 };

const PlanBadge = ({ plan }) => (
  <span style={{
    background: `${PLAN_COLOR[plan] || '#64748B'}22`,
    color: PLAN_COLOR[plan] || '#64748B',
    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
  }}>{plan}</span>
);

export default function Plans() {
  const [data, setData] = useState({ tenants: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [changingId, setChangingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getSAPlansOverview({ search, plan: planFilter, limit: 50 });
      setData(r.data.data);
    } catch { toast.error('Failed to load plans'); }
    finally { setLoading(false); }
  }, [search, planFilter]);

  useEffect(() => { load(); }, [load]);

  const handlePlanChange = async (tenantId, newPlan) => {
    setChangingId(tenantId);
    try {
      await changeSATenantPlan(tenantId, newPlan);
      toast.success('Plan updated');
      load();
    } catch { toast.error('Failed to change plan'); }
    finally { setChangingId(null); }
  };

  const handleToggle = async (tenantId, currentActive) => {
    setTogglingId(tenantId);
    try {
      await toggleSATenant(tenantId);
      toast.success(currentActive ? 'Tenant deactivated' : 'Tenant activated');
      load();
    } catch { toast.error('Failed to toggle tenant'); }
    finally { setTogglingId(null); }
  };

  const totalMRR = data.tenants.filter(t => t.isActive).reduce((sum, t) => sum + (PLAN_PRICE[t.plan] || 0), 0);

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
            Plans & Billing
          </h1>
          <p style={{ color: '#64748B', fontSize: 14 }}>
            {data.total} tenants · MRR from this view: ₹{fmt(totalMRR)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or email…"
          style={{
            flex: 1, minWidth: 220, padding: '9px 14px',
            background: '#192533', border: '1px solid #1E2D3D',
            borderRadius: 8, color: '#F1F5F9', fontSize: 14, outline: 'none',
          }}
        />
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          style={{
            padding: '9px 14px', background: '#192533', border: '1px solid #1E2D3D',
            borderRadius: 8, color: planFilter ? '#F1F5F9' : '#64748B', fontSize: 14, outline: 'none',
          }}
        >
          <option value="">All Plans</option>
          {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Plan count badges */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {PLANS.map(p => {
          const count = data.tenants.filter(t => t.plan === p).length;
          return (
            <div key={p} style={{ background: '#192533', border: `1px solid ${PLAN_COLOR[p]}33`, borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: PLAN_COLOR[p] }}>{p}</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', fontFamily: 'var(--font-display)' }}>{count}</span>
              <span style={{ fontSize: 11, color: '#64748B' }}>tenants</span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E2D3D' }}>
              {['Tenant', 'Business Type', 'Current Plan', 'Monthly', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading…</td></tr>
            )}
            {!loading && data.tenants.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>No tenants found.</td></tr>
            )}
            {!loading && data.tenants.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: i < data.tenants.length - 1 ? '1px solid #1E2D3D' : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1E2D3D22'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{t.syllabrixId || t.email}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>{t.businessType.replace(/_/g, ' ')}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <PlanBadge plan={t.plan} />
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#1FB8D6' }}>
                  ₹{fmt(PLAN_PRICE[t.plan] || 0)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B' }}>
                  {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: t.isActive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: t.isActive ? '#34D399' : '#F87171' }}>
                    {t.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Plan change dropdown */}
                    <select
                      value={t.plan}
                      onChange={e => handlePlanChange(t.id, e.target.value)}
                      disabled={changingId === t.id}
                      style={{
                        padding: '5px 8px', background: '#0F1923', border: '1px solid #1E2D3D',
                        borderRadius: 6, color: '#94A3B8', fontSize: 12, outline: 'none', cursor: 'pointer',
                      }}
                    >
                      {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {/* Toggle button */}
                    <button
                      onClick={() => handleToggle(t.id, t.isActive)}
                      disabled={togglingId === t.id}
                      style={{
                        padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                        background: t.isActive ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)',
                        color: t.isActive ? '#F87171' : '#34D399',
                      }}
                    >
                      {togglingId === t.id ? '…' : t.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.total > 50 && (
        <p style={{ marginTop: 16, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
          Showing 50 of {data.total} tenants. Use search to filter.
        </p>
      )}
    </div>
  );
}
