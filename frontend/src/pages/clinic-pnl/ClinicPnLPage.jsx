import { useState, useEffect } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import { getClinicBills } from '../../api';
import toast from 'react-hot-toast';
import { TrendingUp, TrendingDown, IndianRupee, Users } from 'lucide-react';

const api = (path, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`/api/v1${path}${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  }).then((r) => r.json());
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CAT_COLORS = {
  consultation: '#1D4ED8', procedure: '#6D28D9', medicine: '#059669', diagnostic: '#C2410C', other: '#6B7280',
};

export default function ClinicPnLPage() {
  const isMobile = useBreakpoint();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [pnl, setPnl] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/clinic-billing/pnl', { year, month });
      setPnl(data);
    } catch { toast.error('Failed to load P&L'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [year, month]);

  if (loading || !pnl) return <div style={{ ...P.wrap(isMobile), textAlign: 'center', paddingTop: 60, color: '#9CA3AF' }}>Loading P&L…</div>;

  const { revenue, expenseTotal, grossProfit } = pnl;
  const isProfit = grossProfit >= 0;

  return (
    <div style={P.wrap(isMobile)}>
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Clinic P&L</h1>
          <p style={P.sub}>Module 12 — Profit & Loss — Revenue vs Expenses</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select style={P.input} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select style={P.input} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Revenue', value: fmt(revenue.total), color: '#059669', bg: '#ECFDF5', icon: TrendingUp },
          { label: 'Total Expenses', value: fmt(expenseTotal), color: '#DC2626', bg: '#FEF2F2', icon: TrendingDown },
          { label: isProfit ? 'Gross Profit' : 'Net Loss', value: fmt(Math.abs(grossProfit)), color: isProfit ? '#059669' : '#DC2626', bg: isProfit ? '#ECFDF5' : '#FEF2F2', icon: IndianRupee },
          { label: 'Bills Raised', value: pnl.bills, color: 'var(--navy)', bg: '#EFF6FF', icon: Users },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} style={{ ...P.card, background: bg, border: `1.5px solid ${color}20` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color }}>{value}</div>
              </div>
              <Icon size={18} color={color} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {/* Revenue breakdown */}
        <div style={P.card}>
          <div style={{ ...P.sectionTitle, marginBottom: 16 }}>Revenue by Category</div>
          {Object.entries(CAT_COLORS).map(([cat, color]) => {
            const val = revenue[cat] || 0;
            if (val === 0) return null;
            const pct = revenue.total > 0 ? ((val / revenue.total) * 100).toFixed(1) : 0;
            return (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ width: 90, fontSize: 12, fontWeight: 600, color, textTransform: 'capitalize' }}>{cat}</span>
                <div style={{ flex: 1, height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color, width: 70, textAlign: 'right' }}>{fmt(val)}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF', width: 34, textAlign: 'right' }}>{pct}%</span>
              </div>
            );
          })}
          {revenue.total === 0 && <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: 20 }}>No revenue this period</div>}
        </div>

        {/* Doctor-wise revenue */}
        <div style={P.card}>
          <div style={{ ...P.sectionTitle, marginBottom: 16 }}>Revenue by Doctor</div>
          {Object.entries(revenue.byDoctor || {}).length === 0 ? (
            <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: 20 }}>No doctor-attributed revenue</div>
          ) : (
            Object.entries(revenue.byDoctor).sort(([, a], [, b]) => b - a).map(([doc, val]) => {
              const pct = revenue.total > 0 ? ((val / revenue.total) * 100).toFixed(1) : 0;
              return (
                <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr. {doc}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--cyan)', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: 'var(--cyan)' }}>{fmt(val)}</span>
                </div>
              );
            })
          )}
        </div>

        {/* P&L statement */}
        <div style={{ ...P.card, gridColumn: isMobile ? 'auto' : '1 / -1' }}>
          <div style={{ ...P.sectionTitle, marginBottom: 16 }}>P&L Statement — {MONTHS[month - 1]} {year}</div>
          <div style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700 }}>
              <span style={{ color: '#059669' }}>Revenue (collections)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 800 }}>{fmt(revenue.total)}</span>
            </div>
            {Object.entries(pnl.expenseByCategory || {}).map(([cat, val]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
                <span style={{ color: '#374151' }}>Expenses — {cat}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#DC2626' }}>({fmt(val)})</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid var(--navy)', fontSize: 16, fontWeight: 800 }}>
              <span style={{ color: isProfit ? '#059669' : '#DC2626' }}>{isProfit ? 'Net Profit' : 'Net Loss'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: isProfit ? '#059669' : '#DC2626' }}>{isProfit ? '' : '('}{fmt(Math.abs(grossProfit))}{isProfit ? '' : ')'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
