import { useState, useEffect } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import { getClinicPnL } from '../../api';
import toast from 'react-hot-toast';
import {
  TrendingUp, TrendingDown, IndianRupee, FileText,
  ChevronLeft, ChevronRight, BarChart2,
} from 'lucide-react';

const fmt   = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CAT_COLORS = {
  CONSULTATION: '#1D4ED8',
  PROCEDURE:    '#6D28D9',
  MEDICINE:     '#059669',
  DIAGNOSTIC:   '#C2410C',
  OTHER:        '#6B7280',
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, bg, icon: Icon, sub }) {
  return (
    <div style={{ background: bg, border: `1.5px solid ${color}22`, borderRadius: 14, padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Bar chart row ─────────────────────────────────────────────────────────────
function BarRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ width: 110, fontSize: 12, fontWeight: 600, color, textTransform: 'capitalize', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color, width: 72, textAlign: 'right', flexShrink: 0 }}>{fmt(value)}</span>
      <span style={{ fontSize: 11, color: '#9CA3AF', width: 32, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
    </div>
  );
}

// ── Monthly trend chart (simple bar) ─────────────────────────────────────────
function MonthlyTrendChart({ months }) {
  if (!months?.length) return null;
  const maxRev = Math.max(...months.map(m => m.revenue || 0), 1);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, marginBottom: 8 }}>
        {months.map((m, i) => {
          const revH = Math.round((m.revenue / maxRev) * 90);
          const expH = Math.round((m.expenses / maxRev) * 90);
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 90 }}>
                <div title={`Revenue: ${fmt(m.revenue)}`}
                  style={{ flex: 1, height: revH, background: '#10B981', borderRadius: '3px 3px 0 0', minHeight: 2, transition: 'height 0.4s' }} />
                <div title={`Expenses: ${fmt(m.expenses)}`}
                  style={{ flex: 1, height: expH, background: '#EF4444', borderRadius: '3px 3px 0 0', minHeight: 2, transition: 'height 0.4s' }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {months.map((m, i) => (
          <div key={i} style={{ flex: 1, fontSize: 9, color: '#9CA3AF', textAlign: 'center', fontWeight: 600 }}>
            {MONTHS[m.month - 1]}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
        {[{ color: '#10B981', label: 'Revenue' }, { color: '#EF4444', label: 'Expenses' }].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B7280' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />{l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ClinicPnLPage() {
  const { isMobile } = useBreakpoint();
  const now = new Date();

  // View: 'monthly' | 'annual'
  const [viewMode, setViewMode] = useState('monthly');
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [pnl,   setPnl]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = viewMode === 'annual' ? { year } : { year, month };
      const r = await getClinicPnL(params);
      setPnl(r.data.data || r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load P&L');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year, month, viewMode]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isProfit    = (pnl?.grossProfit || 0) >= 0;
  const profitColor = isProfit ? '#059669' : '#DC2626';
  const profitBg    = isProfit ? '#ECFDF5' : '#FEF2F2';

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ ...P.head, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={P.h1(isMobile)}>Clinic P&amp;L</h1>
          <p style={P.sub}>Revenue vs Expenses — Profit & Loss</p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 9, padding: 3, gap: 2 }}>
            {['monthly', 'annual'].map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                background: viewMode === v ? 'var(--navy)' : 'transparent',
                color: viewMode === v ? '#fff' : '#6B7280',
                transition: 'all 0.12s',
              }}>
                {v === 'monthly' ? 'Monthly' : 'Annual'}
              </button>
            ))}
          </div>

          {/* Month navigation */}
          {viewMode === 'monthly' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid var(--border)', borderRadius: 9, padding: '4px 8px' }}>
              <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 2 }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', minWidth: 90, textAlign: 'center' }}>
                {MONTHS[month - 1]} {year}
              </span>
              <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 2 }}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Year picker (annual view) */}
          {viewMode === 'annual' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setYear(y => y - 1)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', padding: '4px 8px', color: '#6B7280' }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', minWidth: 50, textAlign: 'center' }}>{year}</span>
              <button onClick={() => setYear(y => y + 1)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', padding: '4px 8px', color: '#6B7280' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: 'var(--cyan)', margin: '0 auto 12px', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          Loading P&L…
        </div>
      ) : !pnl ? null : (
        <>
          {/* ── KPI Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            <KpiCard label="Total Revenue"    value={fmt(pnl.revenue?.total || 0)}  color="#059669" bg="#ECFDF5" icon={TrendingUp}   sub={`${pnl.bills || 0} bills`} />
            <KpiCard label="Total Expenses"   value={fmt(pnl.expenseTotal || 0)}     color="#DC2626" bg="#FEF2F2" icon={TrendingDown}  sub={`${pnl.expenses || 0} entries`} />
            <KpiCard label={isProfit ? 'Net Profit' : 'Net Loss'}
                     value={fmt(Math.abs(pnl.grossProfit || 0))}
                     color={profitColor} bg={profitBg} icon={IndianRupee}
                     sub={isProfit ? 'positive' : 'negative'} />
            <KpiCard label="Bills Raised"     value={pnl.bills || 0}                 color="var(--navy)" bg="#EFF6FF" icon={FileText}    sub={viewMode === 'monthly' ? `${MONTHS[month-1]} ${year}` : `FY ${year}`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* Revenue by Category */}
            <div style={P.card}>
              <div style={{ ...P.sectionTitle, marginBottom: 16 }}>Revenue by Category</div>
              {Object.entries(CAT_COLORS).map(([cat, color]) => {
                const val = (pnl.revenue || {})[cat.toLowerCase()] || (pnl.revenue || {})[cat] || 0;
                if (!val) return null;
                return <BarRow key={cat} label={cat.charAt(0) + cat.slice(1).toLowerCase()} value={val} total={pnl.revenue?.total || 1} color={color} />;
              })}
              {!pnl.revenue?.total && (
                <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: 20 }}>No revenue this period</div>
              )}
            </div>

            {/* Revenue by Doctor */}
            <div style={P.card}>
              <div style={{ ...P.sectionTitle, marginBottom: 16 }}>Revenue by Doctor</div>
              {Object.keys(pnl.revenue?.byDoctor || {}).length === 0 ? (
                <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: 20 }}>No doctor-attributed revenue</div>
              ) : (
                Object.entries(pnl.revenue.byDoctor)
                  .sort(([, a], [, b]) => b - a)
                  .map(([doc, val]) => (
                    <BarRow key={doc}
                      label={doc.replace(/^Dr\.?\s*/i, 'Dr. ')}
                      value={val}
                      total={pnl.revenue.total || 1}
                      color="var(--cyan)" />
                  ))
              )}
            </div>
          </div>

          {/* Monthly trend (annual view) */}
          {viewMode === 'annual' && pnl.months?.length > 0 && (
            <div style={{ ...P.card, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BarChart2 size={16} color="var(--navy)" />
                <div style={P.sectionTitle}>Monthly Trend — {year}</div>
              </div>
              <MonthlyTrendChart months={pnl.months} />
            </div>
          )}

          {/* P&L Statement */}
          <div style={P.card}>
            <div style={{ ...P.sectionTitle, marginBottom: 16 }}>
              P&L Statement — {viewMode === 'monthly' ? `${MONTHS[month - 1]} ${year}` : `Full Year ${year}`}
            </div>
            <div style={{ maxWidth: 480 }}>
              {/* Revenue line */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700 }}>
                <span style={{ color: '#059669' }}>Revenue (collections)</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 800 }}>{fmt(pnl.revenue?.total || 0)}</span>
              </div>

              {/* Expense lines */}
              {Object.entries(pnl.expenseByCategory || {}).length === 0 ? (
                <div style={{ padding: '10px 0', fontSize: 13, color: '#9CA3AF', borderBottom: '1px solid #F3F4F6' }}>
                  No expenses recorded this period
                </div>
              ) : (
                Object.entries(pnl.expenseByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, val]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
                      <span style={{ color: '#374151' }}>  Expenses — {cat}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#DC2626' }}>({fmt(val)})</span>
                    </div>
                  ))
              )}

              {/* Net */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderTop: '2px solid var(--navy)', fontSize: 16, fontWeight: 800, marginTop: 4 }}>
                <span style={{ color: profitColor }}>{isProfit ? 'Net Profit' : 'Net Loss'}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: profitColor }}>
                  {isProfit ? '' : '('}{fmt(Math.abs(pnl.grossProfit || 0))}{isProfit ? '' : ')'}
                </span>
              </div>

              {/* Margin */}
              {(pnl.revenue?.total || 0) > 0 && (
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'right' }}>
                  Margin: {Math.round(((pnl.grossProfit || 0) / pnl.revenue.total) * 100)}%
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
