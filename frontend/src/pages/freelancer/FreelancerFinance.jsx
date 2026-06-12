import { useEffect, useState, useCallback } from 'react';
import { IndianRupee, TrendingUp, TrendingDown, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { financeReport } from '../../api/freelancer';

const OR = '#f97316';
const TEXT = '#f1f5f9';
const MUTED = '#64748b';
const CARD = '#141414';
const BORDER = '#1e1e1e';
const GR = '#10b981';
const RE = '#ef4444';
const YE = '#f59e0b';
const BL = '#3b82f6';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
};

const CAT_LABELS = { MATERIAL: 'Material', TOOL: 'Tools', TRAVEL: 'Travel', PHONE: 'Phone', WAGES: 'Wages', OTHER: 'Other' };
const CAT_COLORS = { MATERIAL: '#22d3ee', TOOL: '#a78bfa', TRAVEL: '#34d399', PHONE: '#60a5fa', WAGES: YE, OTHER: MUTED };

function SummaryCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}1a`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={17} color={color} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: TEXT, marginBottom: 3, letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 13, color: MUTED }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}` }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function FreelancerFinance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    financeReport({ year })
      .then(r => setData(r.data))
      .catch(err => setError(`Error ${err?.response?.status || 'Network'} — ${err?.response?.data?.error || err.message}`))
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const maxMonthIncome = data ? Math.max(...data.monthly.map(m => m.income), 1) : 1;

  return (
    <div style={{ maxWidth: 1060 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 3 }}>Finance & Tally</h1>
          <p style={{ fontSize: 13, color: MUTED }}>Your complete money picture — all time + {year} breakdown</p>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ padding: '7px 12px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, color: TEXT, outline: 'none' }}>
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          {!loading && (
            <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, color: MUTED, cursor: 'pointer' }}>
              <RefreshCw size={13} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px', height: 110 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#222', marginBottom: 14 }} />
              <div style={{ width: '60%', height: 20, background: '#222', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '36px', textAlign: 'center' }}>
          <AlertTriangle size={28} color={YE} style={{ marginBottom: 12 }} />
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>Could not load finance data</p>
          <p style={{ color: MUTED, fontSize: 13, marginBottom: 20 }}>{error}</p>
          <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: OR, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : data ? (
        <>
          {/* All-time summary */}
          <div style={{ marginBottom: 6 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>All Time</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
              <SummaryCard icon={IndianRupee}  label="Total Income Received"  value={fmt(data.allTime.income)}    color={OR} />
              <SummaryCard icon={TrendingDown} label="Total Expenses"         value={fmt(data.allTime.expenses)}  color={RE} />
              <SummaryCard icon={TrendingUp}   label="Net Profit"             value={fmt(data.allTime.profit)}    color={GR} sub={`${data.allTime.income > 0 ? Math.round((data.allTime.profit / data.allTime.income) * 100) : 0}% margin`} />
              <SummaryCard icon={Clock}        label="Outstanding (Unpaid)"   value={fmt(data.allTime.outstanding)} color={YE} sub="To be collected" />
            </div>
          </div>

          {/* This year summary strip */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 22px', marginBottom: 24, display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{year}</div>
            {[
              { label: 'Income', value: data.thisYear.income, color: OR },
              { label: 'Expenses', value: data.thisYear.expenses, color: RE },
              { label: 'Net Profit', value: data.thisYear.profit, color: data.thisYear.profit >= 0 ? GR : RE },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: MUTED, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: '-0.3px' }}>{fmt(value)}</div>
              </div>
            ))}
          </div>

          {/* Monthly bar chart + table */}
          <Section title={`Month-by-Month — ${year}`}>
            {/* Visual bars */}
            <div style={{ padding: '16px 20px 8px', display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
              {data.monthly.map(m => {
                const h = maxMonthIncome > 0 ? Math.max((m.income / maxMonthIncome) * 60, m.income > 0 ? 4 : 1) : 1;
                const isProfit = m.profit >= 0;
                return (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: '100%', height: h, background: isProfit ? OR : RE, borderRadius: '3px 3px 0 0', opacity: m.income === 0 ? 0.2 : 1, minHeight: 2 }} title={`${m.name}: ${fmt(m.income)}`} />
                    <div style={{ fontSize: 9, color: MUTED, textAlign: 'center' }}>{m.name}</div>
                  </div>
                );
              })}
            </div>
            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                    {['Month', 'Jobs', 'Income', 'Expenses', 'Net Profit'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.monthly.map((m, i) => (
                    <tr key={m.month} style={{ borderTop: `1px solid ${BORDER}`, opacity: m.income === 0 && m.expenses === 0 ? 0.4 : 1 }}>
                      <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: TEXT }}>{m.name}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: MUTED }}>{m.jobs}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: OR, fontWeight: m.income > 0 ? 600 : 400 }}>{m.income > 0 ? fmt(m.income) : '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: m.expenses > 0 ? RE : MUTED }}>{m.expenses > 0 ? fmt(m.expenses) : '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: m.profit > 0 ? GR : m.profit < 0 ? RE : MUTED }}>{m.income > 0 || m.expenses > 0 ? fmt(m.profit) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${BORDER}`, background: '#0f0f0f' }}>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: TEXT }}>Total {year}</td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: MUTED }}>{data.monthly.reduce((s, m) => s + m.jobs, 0)}</td>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: OR }}>{fmt(data.thisYear.income)}</td>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: RE }}>{fmt(data.thisYear.expenses)}</td>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: data.thisYear.profit >= 0 ? GR : RE }}>{fmt(data.thisYear.profit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Section>

          {/* Bottom two-column: Top Clients + Expense Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginBottom: 20 }}>

            {/* Top Clients */}
            <Section title="Top Clients by Revenue">
              {data.topClients.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: MUTED, fontSize: 13 }}>No data</div>
              ) : (
                <div>
                  {data.topClients.map((c, i) => {
                    const pct = data.allTime.income > 0 ? (c.received / data.allTime.income) * 100 : 0;
                    return (
                      <div key={c.name} style={{ padding: '10px 20px', borderTop: i > 0 ? `1px solid ${BORDER}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${OR}1a`, border: `1px solid ${OR}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: OR, flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                          <div style={{ width: `${Math.max(pct, 2)}%`, height: 3, background: OR, borderRadius: 2, marginTop: 4, opacity: 0.6 }} />
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: OR }}>{fmtShort(c.received)}</div>
                          <div style={{ fontSize: 11, color: MUTED }}>{c.jobs} job{c.jobs !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            {/* Expense breakdown */}
            <Section title="Expense Breakdown (All Time)">
              {data.expensesByCategory.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: MUTED, fontSize: 13 }}>No expenses recorded</div>
              ) : (
                <div>
                  {data.expensesByCategory.map((e, i) => {
                    const color = CAT_COLORS[e.category] || MUTED;
                    const label = CAT_LABELS[e.category] || e.category;
                    const pct = data.allTime.expenses > 0 ? (e.amount / data.allTime.expenses) * 100 : 0;
                    return (
                      <div key={e.category} style={{ padding: '10px 20px', borderTop: i > 0 ? `1px solid ${BORDER}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: TEXT }}>{label}</div>
                          <div style={{ width: `${Math.max(pct, 2)}%`, height: 3, background: color, borderRadius: 2, marginTop: 4, opacity: 0.5 }} />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color }}>{fmtShort(e.amount)}</div>
                          <div style={{ fontSize: 11, color: MUTED }}>{Math.round(pct)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>

          {/* Top Work Types */}
          <Section title="Top Work Types by Revenue">
            {data.topWorkTypes.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: MUTED, fontSize: 13 }}>No data</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Work Type', 'Jobs', 'Total Received', 'Avg per Job'].map(h => (
                        <th key={h} style={{ padding: '9px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', borderTop: `1px solid ${BORDER}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.topWorkTypes.map((w, i) => (
                      <tr key={w.workType} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '11px 20px', fontSize: 13, color: TEXT, fontWeight: 500 }}>{w.workType}</td>
                        <td style={{ padding: '11px 20px', fontSize: 13, color: MUTED }}>{w.jobs}</td>
                        <td style={{ padding: '11px 20px', fontSize: 13, fontWeight: 600, color: OR }}>{fmt(w.received)}</td>
                        <td style={{ padding: '11px 20px', fontSize: 13, color: MUTED }}>{fmt(w.jobs > 0 ? w.received / w.jobs : 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      ) : null}
    </div>
  );
}
