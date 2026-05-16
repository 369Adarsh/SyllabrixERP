import { useState, useEffect } from 'react';
import { getDashboard, getSalesReport, getTopProducts, getTopCustomers } from '../../api';
import { BarChart3, TrendingUp, ShoppingBag, Users, IndianRupee, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

// Convert period label to from/to date strings the backend understands
function periodToRange(period) {
  const now = new Date();
  const pad = (d) => d.toISOString().split('T')[0];
  const today = pad(now);

  if (period === 'today') {
    return { from: today, to: today };
  }
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: pad(d), to: today };
  }
  if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: pad(d), to: today };
  }
  // year
  const d = new Date(now.getFullYear(), 0, 1);
  return { from: pad(d), to: today };
}

function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, background: color + '18', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em', marginTop: 2 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SimpleBar({ label, value, max, color = 'var(--cyan)' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
        <span style={{ fontWeight: 500, color: 'var(--navy)' }}>{label}</span>
        <span style={{ color: '#6B7280', fontWeight: 600 }}>{fmt(value)}</span>
      </div>
      <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

export default function Reports() {
  const [dashboard, setDashboard] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const range = periodToRange(period);
        const [dr, sr, pr, cr] = await Promise.all([
          getDashboard(),
          getSalesReport(range),
          getTopProducts(range),
          getTopCustomers(),
        ]);
        setDashboard(dr.data.data || dr.data);
        // salesReport returns { summary, data: [...] } wrapped in ok()
        const srPayload = sr.data.data || {};
        setSalesData(srPayload.data || []);
        setTopProducts(pr.data.data || []);
        setTopCustomers(cr.data.data || []);
      } catch {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  const d = dashboard || {};
  // Dashboard structure: { today: { revenue, transactions }, month: { revenue, transactions }, customers, products, ... }
  const revenue = period === 'today' ? (d.today?.revenue || 0) : (d.month?.revenue || 0);
  const orders  = period === 'today' ? (d.today?.transactions || 0) : (d.month?.transactions || 0);

  const maxProductRevenue = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.revenue || 0)) : 1;
  const maxCustomerSpend  = topCustomers.length > 0 ? Math.max(...topCustomers.map(c => c.totalSpent || 0)) : 1;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Reports</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>Business performance overview</p>
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '9px 16px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', fontWeight: 500 }}>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#9CA3AF', fontSize: 15 }}>Loading reports...</div>
      ) : (
        <>
          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
            <KpiCard label="Revenue" value={fmt(revenue)} icon={IndianRupee} color="var(--cyan)"
              sub={period === 'today' ? 'Today' : period === 'week' ? 'Last 7 days' : period === 'month' ? 'This month' : 'This year'} />
            <KpiCard label="Transactions" value={orders} icon={ShoppingBag} color="#8B5CF6" sub="Sales count" />
            <KpiCard label="Customers" value={d.customers || 0} icon={Users} color="#16A34A" sub="Total registered" />
            <KpiCard label="Products" value={d.products || 0} icon={Package} color="#D97706" sub="Active items" />
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Top products */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, background: '#8B5CF618', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} color="#8B5CF6" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>Top Products</h3>
              </div>
              {topProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 14 }}>No sales data yet</div>
              ) : topProducts.slice(0, 8).map((p, i) => (
                <SimpleBar
                  key={p.product?.id || i}
                  label={p.product?.name || '—'}
                  value={p.revenue || 0}
                  max={maxProductRevenue}
                  color={i === 0 ? 'var(--cyan)' : '#8B5CF6'}
                />
              ))}
            </div>

            {/* Top customers */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, background: '#16A34A18', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} color="#16A34A" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>Top Customers</h3>
              </div>
              {topCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 14 }}>No customer data yet</div>
              ) : topCustomers.slice(0, 8).map((c, i) => (
                <SimpleBar
                  key={c.id || i}
                  label={c.name}
                  value={c.totalSpent || 0}
                  max={maxCustomerSpend}
                  color={i === 0 ? '#16A34A' : 'var(--emerald)'}
                />
              ))}
            </div>
          </div>

          {/* Sales timeline */}
          {salesData.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 24px', marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, background: 'var(--cyan)18', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={16} color="var(--cyan)" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>Sales Trend</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, minWidth: Math.max(salesData.length * 40, 300) }}>
                  {(() => {
                    const maxVal = Math.max(...salesData.map(s => s.revenue || 0), 1);
                    return salesData.map((s, i) => {
                      const val = s.revenue || 0;
                      const h = Math.max(Math.round((val / maxVal) * 100), 4);
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div title={fmt(val)} style={{ width: '100%', height: h, background: 'var(--cyan)', borderRadius: '4px 4px 0 0', opacity: 0.85, cursor: 'pointer', minHeight: 4 }} />
                          <span style={{ fontSize: 10, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(s.date)}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
