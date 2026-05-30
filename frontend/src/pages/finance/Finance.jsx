import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import {
  getProfitLoss, getCashFlow, getGstr1, getTotalBalance,
  getBankAccounts, getInvoiceReport,
} from '../../api';
import {
  TrendingUp, TrendingDown, Download, RefreshCw, AlertTriangle,
  Activity, FileText, BarChart3, Receipt, Landmark,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';

// ── Utilities ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtNum = (n) => Number(n || 0).toFixed(2);

const exportCsv = (filename, headers, rows) => {
  const bom = '﻿';
  const content = [headers, ...rows]
    .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success('Exported successfully');
};

const now = new Date();
const fyStart = `${now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1}-04-01`;
const today = now.toISOString().split('T')[0];

// ── Stress Score ───────────────────────────────────────────────────────────────

const STRESS = {
  HEALTHY:  { label: 'Financially Healthy', color: '#10B981', pct: 15, icon: '✅', tip: 'Strong profit margins and sufficient cash runway.' },
  MODERATE: { label: 'Moderate Stress',     color: '#F59E0B', pct: 48, icon: '📊', tip: 'Expense ratio is moderate. Monitor cash flow carefully.' },
  HIGH:     { label: 'High Stress',         color: '#F97316', pct: 72, icon: '⚠️', tip: 'High expense-to-revenue ratio. Consider cost reduction.' },
  CRITICAL: { label: 'Critical',            color: '#EF4444', pct: 92, icon: '🚨', tip: 'Expenses nearly equal or exceed revenue. Act immediately.' },
  NO_DATA:  { label: 'No Revenue Data',     color: '#9CA3AF', pct: 0,  icon: '—',  tip: 'No revenue recorded for this period.' },
};

function getStressLevel(revenue, expenses, totalCash) {
  if (!revenue || revenue === 0) return 'NO_DATA';
  const ratio = expenses / revenue;
  const monthlyBurn = expenses / 12;
  const runway = monthlyBurn > 0 ? totalCash / monthlyBurn : 999;
  if (ratio > 0.95 || runway < 1) return 'CRITICAL';
  if (ratio > 0.80 || runway < 2) return 'HIGH';
  if (ratio > 0.60 || runway < 4) return 'MODERATE';
  return 'HEALTHY';
}

// ── Shared Date Filter ─────────────────────────────────────────────────────────

function DateFilter({ from, to, onFrom, onTo, onRefresh, loading, extra }) {
  const { isMobile } = useBreakpoint();
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      {[['FROM', from, onFrom], ['TO', to, onTo]].map(([lbl, val, setter]) => (
        <div key={lbl} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em' }}>{lbl}</span>
          <input type="date" value={val} onChange={e => setter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', width: isMobile ? 140 : 'auto' }} />
        </div>
      ))}
      <button onClick={onRefresh} disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
        <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
        Refresh
      </button>
      {extra}
    </div>
  );
}

// ── Tab 1: Overview ────────────────────────────────────────────────────────────

function OverviewTab() {
  const { isMobile } = useBreakpoint();
  const [plData, setPlData] = useState(null);
  const [totalCash, setTotalCash] = useState(0);
  const [loanOutstanding, setLoanOutstanding] = useState(0);
  const [receivables, setReceivables] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pl, cash, accounts, invRep] = await Promise.all([
        getProfitLoss({ from: fyStart, to: today }),
        getTotalBalance(),
        getBankAccounts(),
        getInvoiceReport({ from: fyStart, to: today }),
      ]);
      setPlData(pl.data.data);
      setTotalCash(cash.data.data?.totalBalance || 0);
      const accs = accounts.data.data || [];
      setLoanOutstanding(accs.filter(a => a.accountType === 'LOAN').reduce((s, a) => s + (a.currentBalance || 0), 0));
      setReceivables(invRep.data.data?.totals?._sum?.balanceDue || 0);
    } catch { toast.error('Failed to load overview'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const revenue = plData?.revenue?.total || 0;
  const expenses = plData?.expenses?.total || 0;
  const profit = plData?.grossProfit || 0;
  const margin = plData?.profitMargin || 0;
  const sl = getStressLevel(revenue, expenses, totalCash);
  const stress = STRESS[sl];
  const expRatio = revenue > 0 ? ((expenses / revenue) * 100).toFixed(1) : null;
  const monthlyBurn = expenses / 12;
  const runway = monthlyBurn > 0 ? (totalCash / monthlyBurn).toFixed(1) : null;
  const netCash = totalCash - loanOutstanding;

  const doExport = () => exportCsv('syllabrix_overview.csv',
    ['Metric', 'Value (₹)'],
    [
      ['Report Period', `${fyStart} to ${today}`],
      ['Total Revenue (FY)', fmtNum(revenue)],
      ['Total Expenses (FY)', fmtNum(expenses)],
      ['Net Profit / Loss', fmtNum(profit)],
      ['Profit Margin %', `${margin}%`],
      ['Cash & Bank Balance', fmtNum(totalCash)],
      ['Loan Outstanding', fmtNum(loanOutstanding)],
      ['Accounts Receivable', fmtNum(receivables)],
      ['Net Cash Position', fmtNum(netCash)],
      ['Business Stress', stress.label],
      ['Expense Ratio %', expRatio ? `${expRatio}%` : 'N/A'],
      ['Cash Runway (months)', runway ?? 'N/A'],
    ]
  );

  if (loading) return <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>Loading overview…</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <ExportBtn onClick={doExport} label="Export Overview" />
      </div>

      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Revenue (FY)', value: fmt(revenue), color: '#10B981', sub: 'POS + Invoices + Fees' },
          { label: 'Total Expenses (FY)', value: fmt(expenses), color: '#EF4444', sub: 'Ops + Payroll + Bills' },
          { label: profit >= 0 ? 'Net Profit' : 'Net Loss', value: fmt(Math.abs(profit)), color: profit >= 0 ? '#192F3D' : '#EF4444', sub: `${margin}% margin` },
          { label: 'Cash & Bank', value: fmt(totalCash), color: '#1FB8D6', sub: `Net: ${fmt(netCash)}` },
        ].map(({ label, value, color, sub }) => (
          <Card key={label} style={{ borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 5 }}>{sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Stress Gauge */}
        <Card style={{ borderLeft: `4px solid ${stress.color}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Business Stress Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 28 }}>{stress.icon}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: stress.color, fontFamily: 'var(--font-display)' }}>{stress.label}</span>
          </div>
          <div style={{ background: '#E5E7EB', borderRadius: 99, height: 10, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ width: `${stress.pct}%`, background: stress.color, height: '100%', borderRadius: 99, transition: 'width 0.7s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginBottom: 12 }}>
            <span>Healthy</span><span>Moderate</span><span>High</span><span>Critical</span>
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{stress.tip}</div>
        </Card>

        {/* Key Metrics */}
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 14 }}>Key Business Metrics</div>
          {[
            { label: 'Profit Margin', value: `${margin}%`, good: margin > 20 },
            { label: 'Expense Ratio', value: expRatio ? `${expRatio}%` : 'N/A', good: expRatio && Number(expRatio) < 70 },
            { label: 'Cash Runway', value: runway ? `${runway} months` : 'N/A', good: runway && Number(runway) > 3 },
            { label: 'Accounts Receivable', value: fmt(receivables), good: receivables < revenue * 0.2 },
            { label: 'Loan Outstanding', value: fmt(loanOutstanding), good: loanOutstanding < netCash },
          ].map(({ label, value, good }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: good ? '#10B981' : '#EF4444' }}>{value}</span>
                <span>{good ? '✅' : '⚠️'}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Revenue vs Expense visual bar */}
      {revenue > 0 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 16 }}>Revenue vs Expenses (FY)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Revenue', value: revenue, color: '#10B981', total: Math.max(revenue, expenses) },
              { label: 'Expenses', value: expenses, color: '#EF4444', total: Math.max(revenue, expenses) },
              { label: 'Net Profit', value: Math.abs(profit), color: profit >= 0 ? '#1FB8D6' : '#9CA3AF', total: Math.max(revenue, expenses) },
            ].map(({ label, value, color, total }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>{fmt(value)}</span>
                </div>
                <div style={{ background: '#F3F4F6', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (value / total) * 100)}%`, background: color, height: '100%', borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Alerts */}
      {(profit < 0 || (runway && Number(runway) < 2) || (expRatio && Number(expRatio) > 80)) && (
        <Card style={{ marginTop: 20, background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={16} color="#EF4444" />
            <span style={{ fontWeight: 700, fontSize: 13, color: '#991B1B' }}>Business Alerts</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {profit < 0 && <div style={{ fontSize: 13, color: '#7F1D1D' }}>• Operating at a net loss of {fmt(Math.abs(profit))} this financial year.</div>}
            {runway && Number(runway) < 2 && <div style={{ fontSize: 13, color: '#7F1D1D' }}>• Cash runway is only {runway} months — urgently improve collections or cut costs.</div>}
            {expRatio && Number(expRatio) > 80 && <div style={{ fontSize: 13, color: '#7F1D1D' }}>• Expense ratio is {expRatio}% — leaves minimal profit buffer.</div>}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Tab 2: P&L Statement ───────────────────────────────────────────────────────

function PLTab() {
  const { isMobile } = useBreakpoint();
  const [from, setFrom] = useState(fyStart);
  const [to, setTo] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProfitLoss({ from, to });
      setData(res.data.data);
    } catch { toast.error('Failed to load P&L'); }
    finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const revenue = data?.revenue?.total || 0;
  const expenses = data?.expenses?.total || 0;
  const profit = data?.grossProfit || 0;
  const margin = data?.profitMargin || 0;

  const revenueRows = data ? [
    ['POS / Retail Sales', data.revenue.posRevenue],
    ['Invoice Collections', data.revenue.invoiceRevenue],
    ['Fee Collections', data.revenue.feeRevenue],
  ] : [];

  const expenseRows = data ? [
    ['Operating Expenses', data.expenses.operationalExpenses],
    ['Vendor Bill Payments', data.expenses.vendorPayments],
    ['Payroll & Salaries', data.expenses.payroll],
  ] : [];

  const doExport = () => {
    if (!data) return;
    exportCsv(`pl_${from}_${to}.csv`,
      ['Category', 'Item', 'Amount (₹)'],
      [
        ['Revenue', 'POS / Retail Sales', fmtNum(data.revenue.posRevenue)],
        ['Revenue', 'Invoice Collections', fmtNum(data.revenue.invoiceRevenue)],
        ['Revenue', 'Fee Collections', fmtNum(data.revenue.feeRevenue)],
        ['Revenue', 'TOTAL REVENUE', fmtNum(revenue)],
        ['Expenses', 'Operating Expenses', fmtNum(data.expenses.operationalExpenses)],
        ['Expenses', 'Vendor Bill Payments', fmtNum(data.expenses.vendorPayments)],
        ['Expenses', 'Payroll & Salaries', fmtNum(data.expenses.payroll)],
        ...(data.expenses.byCategory || []).map(c => ['Expense Category', c.category, fmtNum(c.amount)]),
        ['Expenses', 'TOTAL EXPENSES', fmtNum(expenses)],
        ['Summary', 'NET PROFIT / LOSS', fmtNum(profit)],
        ['Summary', 'PROFIT MARGIN %', `${margin}%`],
      ]
    );
  };

  return (
    <div>
      <DateFilter from={from} to={to} onFrom={setFrom} onTo={setTo} onRefresh={load} loading={loading}
        extra={data && <ExportBtn onClick={doExport} label={isMobile ? 'Export' : 'Export P&L'} />}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>Loading P&L…</div>
      ) : data ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
            <Card style={{ borderLeft: '4px solid #10B981' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Revenue</div>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-display)' }}>{fmt(revenue)}</div>
            </Card>
            <Card style={{ borderLeft: '4px solid #EF4444' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Expenses</div>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-display)' }}>{fmt(expenses)}</div>
            </Card>
            <Card style={{ borderLeft: `4px solid ${profit >= 0 ? 'var(--navy)' : '#EF4444'}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Net {profit >= 0 ? 'Profit' : 'Loss'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {profit >= 0 ? <TrendingUp size={18} color="#10B981" /> : <TrendingDown size={18} color="#EF4444" />}
                <span style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: profit >= 0 ? 'var(--navy)' : '#EF4444', fontFamily: 'var(--font-display)' }}>{fmt(Math.abs(profit))}</span>
              </div>
            </Card>
            <Card style={{ borderLeft: '4px solid #1FB8D6' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Profit Margin</div>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#1FB8D6', fontFamily: 'var(--font-display)' }}>{margin}%</div>
            </Card>
          </div>

          {/* P&L Tables */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <PLSection title="Income" color="#10B981" rows={revenueRows} total={revenue} />
            <PLSection title="Expenditure" color="#EF4444" rows={expenseRows} total={expenses} />
          </div>

          {/* Expense by category */}
          {data.expenses.byCategory?.length > 0 && (
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 14 }}>Expense Breakdown by Category</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                {data.expenses.byCategory.sort((a, b) => b.amount - a.amount).map(({ category, amount }) => (
                  <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', background: '#F9FAFB', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>{category}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>{fmt(amount)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Net P&L Summary */}
          <Card style={{ marginTop: 20, background: profit >= 0 ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${profit >= 0 ? '#BBF7D0' : '#FECACA'}` }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Period: {from} → {to}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: profit >= 0 ? '#166534' : '#991B1B' }}>
                  {profit >= 0 ? 'Business is Profitable' : 'Business is in Loss'} — {fmt(Math.abs(profit))} ({margin}% margin)
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: profit >= 0 ? '#10B981' : '#EF4444', fontFamily: 'var(--font-display)' }}>
                {profit >= 0 ? '+' : '-'}{fmt(Math.abs(profit))}
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function PLSection({ title, color, rows, total }) {
  return (
    <Card style={{ padding: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{title}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{fmt(total)}</span>
      </div>
      <div style={{ padding: '4px 0' }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
            <span style={{ color: '#6B7280' }}>{label}</span>
            <strong style={{ color }}>{fmt(value)}</strong>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontWeight: 700, fontSize: 15 }}>
          <span>Total {title}</span><span style={{ color }}>{fmt(total)}</span>
        </div>
      </div>
    </Card>
  );
}

// ── Tab 3: Cash Flow ───────────────────────────────────────────────────────────

function CashFlowTab() {
  const { isMobile } = useBreakpoint();
  const [from, setFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  const [to, setTo] = useState(today);
  const [groupBy, setGroupBy] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCashFlow({ from, to, groupBy });
      setData(res.data.data);
    } catch { toast.error('Failed to load cash flow'); }
    finally { setLoading(false); }
  }, [from, to, groupBy]);

  useEffect(() => { load(); }, [load]);

  const summary = data?.summary || {};
  const periods = data?.data || [];
  const maxVal = Math.max(...periods.map(p => Math.max(p.inflow, p.outflow)), 1);

  const doExport = () => {
    if (!data) return;
    exportCsv(`cashflow_${from}_${to}.csv`,
      ['Period', 'Inflow (₹)', 'Outflow (₹)', 'Net Cash Flow (₹)'],
      periods.map(p => [p.period, fmtNum(p.inflow), fmtNum(p.outflow), fmtNum(p.net)]).concat([
        ['TOTAL', fmtNum(summary.totalInflow), fmtNum(summary.totalOutflow), fmtNum(summary.netCashFlow)],
      ])
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {[['FROM', from, setFrom], ['TO', to, setTo]].map(([lbl, val, setter]) => (
          <div key={lbl} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em' }}>{lbl}</span>
            <input type="date" value={val} onChange={e => setter(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', width: isMobile ? 140 : 'auto' }} />
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em' }}>GROUP BY</span>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
            <option value="day">Day</option>
            <option value="month">Month</option>
          </select>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} /> Refresh
        </button>
        {data && <ExportBtn onClick={doExport} label={isMobile ? 'Export' : 'Export Cash Flow'} />}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>Loading…</div>
        : data ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Total Inflow', value: fmt(summary.totalInflow), color: '#10B981' },
                { label: 'Total Outflow', value: fmt(summary.totalOutflow), color: '#EF4444' },
                { label: 'Net Cash Flow', value: fmt(summary.netCashFlow), color: summary.netCashFlow >= 0 ? 'var(--navy)' : '#EF4444' },
              ].map(({ label, value, color }) => (
                <Card key={label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
                </Card>
              ))}
            </div>

            {/* Visual bars */}
            {periods.length > 0 && (
              <Card style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 16 }}>
                  Cash Flow — {groupBy === 'day' ? 'Daily' : 'Monthly'} Breakdown
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {periods.map(p => (
                    <div key={p.period}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{p.period}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: p.net >= 0 ? '#10B981' : '#EF4444' }}>
                          Net: {p.net >= 0 ? '+' : ''}{fmt(p.net)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: '#10B981', width: 40, textAlign: 'right' }}>IN</span>
                          <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 99, height: 7, overflow: 'hidden' }}>
                            <div style={{ width: `${(p.inflow / maxVal) * 100}%`, background: '#10B981', height: '100%', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#6B7280', width: isMobile ? 70 : 100, textAlign: 'right' }}>{fmt(p.inflow)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: '#EF4444', width: 40, textAlign: 'right' }}>OUT</span>
                          <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 99, height: 7, overflow: 'hidden' }}>
                            <div style={{ width: `${(p.outflow / maxVal) * 100}%`, background: '#EF4444', height: '100%', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#6B7280', width: isMobile ? 70 : 100, textAlign: 'right' }}>{fmt(p.outflow)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Detailed table */}
            <Card style={{ padding: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>Period Breakdown</div>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 480 : 'unset' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      {['Period', 'Inflow', 'Outflow', 'Net Cash Flow'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Period' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((p, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{p.period}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, textAlign: 'right', color: '#10B981', fontWeight: 600 }}>{fmt(p.inflow)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, textAlign: 'right', color: '#EF4444', fontWeight: 600 }}>{fmt(p.outflow)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, textAlign: 'right', fontWeight: 700, color: p.net >= 0 ? 'var(--navy)' : '#EF4444' }}>{fmt(p.net)}</td>
                      </tr>
                    ))}
                    {!periods.length && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>No data for this period</td></tr>}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#F0F9FF', borderTop: '2px solid #BFDBFE' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14 }}>TOTAL</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: '#10B981' }}>{fmt(summary.totalInflow)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: '#EF4444' }}>{fmt(summary.totalOutflow)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: summary.netCashFlow >= 0 ? 'var(--navy)' : '#EF4444' }}>{fmt(summary.netCashFlow)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </>
        ) : null}
    </div>
  );
}

// ── Tab 4: Balance Sheet ───────────────────────────────────────────────────────

function BalanceSheetTab() {
  const { isMobile } = useBreakpoint();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cash, accounts, pl, invRep] = await Promise.all([
        getTotalBalance(),
        getBankAccounts(),
        getProfitLoss({ from: fyStart, to: today }),
        getInvoiceReport({ from: fyStart, to: today }),
      ]);
      const accs = accounts.data.data || [];
      const loanAccs = accs.filter(a => a.accountType === 'LOAN');
      const bankAccs = accs.filter(a => a.accountType !== 'LOAN');
      const totalCash = cash.data.data?.totalBalance || 0;
      const loanLiability = loanAccs.reduce((s, a) => s + (a.currentBalance || 0), 0);
      const receivables = invRep.data.data?.totals?._sum?.balanceDue || 0;
      const plD = pl.data.data;
      setData({
        assets: { cash: totalCash, receivables, bankAccounts: bankAccs },
        liabilities: { loans: loanLiability, loanAccounts: loanAccs },
        pl: plD,
      });
    } catch { toast.error('Failed to load balance sheet'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>Loading…</div>;
  if (!data) return null;

  const totalAssets = data.assets.cash + data.assets.receivables;
  const totalLiabilities = data.liabilities.loans;
  const netWorth = totalAssets - totalLiabilities;
  const revenue = data.pl?.revenue?.total || 0;
  const profit = data.pl?.grossProfit || 0;

  const doExport = () => exportCsv(`balance_sheet_${today}.csv`,
    ['Category', 'Item', 'Amount (₹)'],
    [
      ['Assets', 'Cash & Bank Balance', fmtNum(data.assets.cash)],
      ['Assets', 'Accounts Receivable (Invoices)', fmtNum(data.assets.receivables)],
      ['Assets', 'TOTAL ASSETS', fmtNum(totalAssets)],
      ['Liabilities', 'Loan Outstanding', fmtNum(data.liabilities.loans)],
      ['Liabilities', 'TOTAL LIABILITIES', fmtNum(totalLiabilities)],
      ['Net Position', 'NET WORTH / EQUITY', fmtNum(netWorth)],
      ['P&L Context', 'Revenue (FY)', fmtNum(revenue)],
      ['P&L Context', 'Net Profit (FY)', fmtNum(profit)],
    ]
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 13, color: '#6B7280' }}>Snapshot as of <strong>{today}</strong> — Financial Year starting {fyStart}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <ExportBtn onClick={doExport} label="Export Balance Sheet" />
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Net Worth Banner */}
      <Card style={{ marginBottom: 20, background: netWorth >= 0 ? 'linear-gradient(135deg, #192F3D, #1a3548)' : 'linear-gradient(135deg, #7F1D1D, #991B1B)', color: '#fff', border: 'none' }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7, marginBottom: 6 }}>Net Business Worth (Assets − Liabilities)</div>
        <div style={{ fontSize: isMobile ? 32 : 44, fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{fmt(netWorth)}</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
          Assets: {fmt(totalAssets)} · Liabilities: {fmt(totalLiabilities)}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Assets */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: '#F0FDF4', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#166534' }}>ASSETS</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#10B981' }}>{fmt(totalAssets)}</span>
          </div>
          {[
            { label: 'Cash & Bank Balance', value: data.assets.cash, note: `${data.assets.bankAccounts.length} account(s)` },
            { label: 'Accounts Receivable', value: data.assets.receivables, note: 'Outstanding invoices' },
          ].map(({ label, value, note }) => (
            <div key={label} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 14, color: '#374151' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>{fmt(value)}</span>
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{note}</div>
            </div>
          ))}
          <div style={{ padding: '8px 16px 8px', fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
            Note: Inventory value not included — see Inventory module.
          </div>
        </Card>

        {/* Liabilities */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: '#FEF2F2', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#991B1B' }}>LIABILITIES</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#EF4444' }}>{fmt(totalLiabilities)}</span>
          </div>
          {data.liabilities.loanAccounts.length > 0 ? data.liabilities.loanAccounts.map(acc => (
            <div key={acc.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 14, color: '#374151' }}>{acc.name}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}>{fmt(acc.currentBalance)}</span>
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{acc.bankName} · Loan Account</div>
            </div>
          )) : (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              No loan liabilities recorded. Add a Loan account in Bank Accounts.
            </div>
          )}
          <div style={{ padding: '8px 16px 8px', fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
            Note: Vendor payables not included — see Vendor Bills module.
          </div>
        </Card>
      </div>

      {/* P&L Context */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 14 }}>P&L Context (Financial Year)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { label: 'Revenue', value: fmt(revenue), color: '#10B981' },
            { label: 'Expenses', value: fmt(data.pl?.expenses?.total || 0), color: '#EF4444' },
            { label: 'Net Profit', value: fmt(profit), color: profit >= 0 ? 'var(--navy)' : '#EF4444' },
            { label: 'Margin', value: `${data.pl?.profitMargin || 0}%`, color: '#1FB8D6' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center', padding: '12px', background: '#F9FAFB', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Tab 5: GSTR-1 ─────────────────────────────────────────────────────────────

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function GstrTab() {
  const { isMobile } = useBreakpoint();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGstr1({ month, year });
      setData(res.data.data);
    } catch { toast.error('Failed to load GSTR-1'); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const doExport = () => {
    if (!data) return;
    exportCsv(`GSTR1_${MONTHS[month - 1]}_${year}.csv`,
      ['Type', 'Invoice #', 'Date', 'Customer', 'GSTIN', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Tax (₹)', 'Invoice Value (₹)'],
      [
        ...(data.b2b || []).map(r => ['B2B', r.invoiceNumber, r.invoiceDate, r.customerName, r.customerGSTIN, fmtNum(r.taxableValue), fmtNum(r.cgst), fmtNum(r.sgst), fmtNum(r.igst), fmtNum(r.totalTax), fmtNum(r.invoiceValue)]),
        ...(data.b2c || []).map(r => ['B2C', r.invoiceNumber, r.invoiceDate, r.customerName, '', fmtNum(r.taxableValue), fmtNum(r.cgst), fmtNum(r.sgst), fmtNum(r.igst), fmtNum(r.totalTax), fmtNum(r.invoiceValue)]),
        ['SUMMARY', '', '', '', 'Total Taxable', fmtNum(data.summary?.totalTaxableValue), '', '', '', fmtNum(data.summary?.totalTax), fmtNum(data.summary?.totalInvoiceValue)],
      ]
    );
  };

  const allInvoices = [...(data?.b2b || []), ...(data?.b2c || [])];

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em' }}>MONTH</span>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em' }}>YEAR</span>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
            {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} /> Load
        </button>
        {data && <ExportBtn onClick={doExport} label={isMobile ? 'Export CSV' : 'Export GSTR-1 CSV'} />}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>Loading…</div>
        : data ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
              {[
                { label: 'B2B Invoices', value: data.b2b?.length || 0, color: 'var(--navy)' },
                { label: 'B2C Invoices', value: data.b2c?.length || 0, color: '#6B7280' },
                { label: 'Taxable Value', value: fmt(data.summary?.totalTaxableValue), color: 'var(--navy)' },
                { label: 'Total Tax', value: fmt(data.summary?.totalTax), color: '#10B981' },
                { label: 'Invoice Value', value: fmt(data.summary?.totalInvoiceValue), color: '#1FB8D6' },
              ].map(({ label, value, color }) => (
                <Card key={label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
                </Card>
              ))}
            </div>

            <div style={{ marginBottom: 8, fontSize: 13, color: '#6B7280' }}>
              GSTIN: <strong style={{ fontFamily: 'monospace' }}>{data.summary?.gstin}</strong> · Period: {data.summary?.period}
            </div>

            {['b2b', 'b2c'].map(type => (
              <Card key={type} style={{ marginBottom: 20, padding: 0 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--navy)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{type === 'b2b' ? 'B2B — GST Registered Buyers' : 'B2C — End Consumers'}</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400 }}>{(data[type] || []).length} invoices</span>
                </div>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB' }}>
                        {['Invoice #', 'Date', 'Customer', ...(type === 'b2b' ? ['GSTIN'] : []), 'Taxable', 'CGST', 'SGST', 'IGST', 'Total'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Invoice #' || h === 'Date' || h === 'Customer' || h === 'GSTIN' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(data[type] || []).map((row, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{row.invoiceNumber}</td>
                          <td style={{ padding: '9px 12px', fontSize: 12, color: '#6B7280' }}>{row.invoiceDate}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13 }}>{row.customerName}</td>
                          {type === 'b2b' && <td style={{ padding: '9px 12px', fontSize: 11, color: '#6B7280', fontFamily: 'monospace' }}>{row.customerGSTIN}</td>}
                          <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right' }}>{fmt(row.taxableValue)}</td>
                          <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'right', color: '#6B7280' }}>{fmt(row.cgst)}</td>
                          <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'right', color: '#6B7280' }}>{fmt(row.sgst)}</td>
                          <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'right', color: '#6B7280' }}>{fmt(row.igst)}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', fontWeight: 700 }}>{fmt(row.invoiceValue)}</td>
                        </tr>
                      ))}
                      {!data[type]?.length && (
                        <tr><td colSpan={type === 'b2b' ? 9 : 8} style={{ textAlign: 'center', padding: 24, color: '#9CA3AF', fontSize: 13 }}>No {type.toUpperCase()} invoices this period</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </>
        ) : null}
    </div>
  );
}

// ── Shared Export Button ───────────────────────────────────────────────────────

function ExportBtn({ onClick, label }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #10B981', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#10B981', whiteSpace: 'nowrap' }}>
      <Download size={13} /> {label}
    </button>
  );
}

// ── Main Finance Component ─────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',  label: 'Overview',       icon: Activity },
  { key: 'pl',        label: 'P&L Statement',  icon: FileText },
  { key: 'cashflow',  label: 'Cash Flow',      icon: BarChart3 },
  { key: 'balance',   label: 'Balance Sheet',  icon: Landmark },
  { key: 'gstr1',     label: 'GSTR-1',         icon: Receipt },
];

export default function Finance() {
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState('overview');

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={P.h1(isMobile)}>Finance Hub</h1>
        <p style={P.sub}>P&L · Cash Flow · Balance Sheet · Stress Score · GSTR-1 Export</p>
      </div>

      {/* Tab Bar */}
      <div className="tabs-row" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4, width: 'fit-content', minWidth: 'max-content' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: isMobile ? '7px 10px' : '8px 16px',
              borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: isMobile ? 12 : 13, fontWeight: 600, whiteSpace: 'nowrap',
              background: tab === key ? '#fff' : 'transparent',
              color: tab === key ? 'var(--navy)' : '#9CA3AF',
              boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}>
              <Icon size={isMobile ? 13 : 14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'pl'       && <PLTab />}
      {tab === 'cashflow' && <CashFlowTab />}
      {tab === 'balance'  && <BalanceSheetTab />}
      {tab === 'gstr1'    && <GstrTab />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
