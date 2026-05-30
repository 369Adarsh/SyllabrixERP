import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useBranch } from '../../context/BranchContext';
import { P } from '../../styles/page';
import {
  getDashboard, getSalesReport, getTopProducts, getTopCustomers,
  getProfitLoss, getBalanceSheet, getCashFlow, getGstr1, getGstr3b,
  getTdsReport, getCashBook, getCreditorAging,
  getTotalBalance, getBankAccounts, getInvoiceReport,
} from '../../api';
import {
  BarChart3, TrendingUp, ShoppingBag, Users, IndianRupee, Package,
  Download, RefreshCw, AlertTriangle, Activity, FileText, Receipt, Landmark,
  BookOpen, Clock,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import KpiBar from '../../components/ui/KpiBar';
import toast from 'react-hot-toast';

// ── Utilities ──────────────────────────────────────────────────────────────────

// No-decimal format for sales counts
const fmtI = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
// Two-decimal format for accounting
const fmt  = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (n) => Number(n || 0).toFixed(2);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

const now = new Date();
const fyStart = `${now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1}-04-01`;
const today = now.toISOString().split('T')[0];

function periodToRange(period) {
  const pad = (d) => d.toISOString().split('T')[0];
  const t = pad(now);
  if (period === 'today') return { from: t, to: t };
  if (period === 'week')  { const d = new Date(now); d.setDate(d.getDate() - 6); return { from: pad(d), to: t }; }
  if (period === 'month') return { from: pad(new Date(now.getFullYear(), now.getMonth(), 1)), to: t };
  return { from: pad(new Date(now.getFullYear(), 0, 1)), to: t };
}

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

// ── Shared small components ────────────────────────────────────────────────────

function ExportBtn({ onClick, label }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #10B981', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#10B981', whiteSpace: 'nowrap' }}>
      <Download size={13} /> {label}
    </button>
  );
}

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

// ── Financial Stress Score ─────────────────────────────────────────────────────

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

// ── Sales Tab ─────────────────────────────────────────────────────────────────


function SimpleBar({ label, value, max, color = 'var(--cyan)' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
        <span style={{ fontWeight: 500, color: 'var(--navy)' }}>{label}</span>
        <span style={{ color: '#6B7280', fontWeight: 600 }}>{fmtI(value)}</span>
      </div>
      <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

function SalesTab() {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [dashboard, setDashboard] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [salesSummary, setSalesSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const range = periodToRange(period);
        const bparam = branchId ? { branchId } : {};
        const [dr, sr, pr, cr] = await Promise.all([
          getDashboard(bparam),
          getSalesReport({ ...range, ...bparam }),
          getTopProducts({ ...range, ...bparam }),
          getTopCustomers({ ...range, ...bparam }),
        ]);
        setDashboard(dr.data.data || dr.data);
        const srPayload = sr.data.data || {};
        setSalesData(srPayload.data || []);
        setSalesSummary(srPayload.summary || null);
        setTopProducts(pr.data.data || []);
        setTopCustomers(cr.data.data || []);
      } catch {
        toast.error('Failed to load sales reports');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period, branchId]);

  const d = dashboard || {};
  const revenue = salesSummary?.totalRevenue ?? (period === 'today' ? (d.today?.revenue || 0) : (d.month?.revenue || 0));
  const orders  = salesSummary?.totalTransactions ?? (period === 'today' ? (d.today?.transactions || 0) : (d.month?.transactions || 0));
  const maxProductRevenue = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.revenue || 0)) : 1;
  const maxCustomerSpend  = topCustomers.length > 0 ? Math.max(...topCustomers.map(c => c.totalSpent || 0)) : 1;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <select value={period} onChange={e => setPeriod(e.target.value)}
          style={{ padding: '9px 16px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', fontWeight: 500 }}>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#9CA3AF', fontSize: 15 }}>Loading...</div>
      ) : (
        <>
          <KpiBar stats={[
            { icon: IndianRupee, label: 'Revenue',      value: fmtI(revenue),       sub: period === 'today' ? 'Today' : period === 'week' ? 'Last 7 days' : period === 'month' ? 'This month' : 'This year', color: 'var(--cyan)' },
            { icon: ShoppingBag, label: 'Transactions', value: orders,              sub: 'Sales count',       color: '#8B5CF6' },
            { icon: Users,       label: 'Customers',    value: d.customers || 0,    sub: 'Total registered',  color: '#16A34A' },
            { icon: Package,     label: 'Products',     value: d.products || 0,     sub: 'Active items',      color: '#D97706' },
          ]} />

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, background: '#8B5CF618', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} color="#8B5CF6" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>Top Products</h3>
              </div>
              {topProducts.length === 0
                ? <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 14 }}>No sales data yet</div>
                : topProducts.slice(0, 8).map((p, i) => (
                  <SimpleBar key={p.product?.id || i} label={p.product?.name || '—'} value={p.revenue || 0} max={maxProductRevenue} color={i === 0 ? 'var(--cyan)' : '#8B5CF6'} />
                ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, background: '#16A34A18', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} color="#16A34A" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>Top Customers</h3>
              </div>
              {topCustomers.length === 0
                ? <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 14 }}>No customer data yet</div>
                : topCustomers.slice(0, 8).map((c, i) => (
                  <SimpleBar key={c.id || i} label={c.name} value={c.totalSpent || 0} max={maxCustomerSpend} color={i === 0 ? '#16A34A' : 'var(--emerald)'} />
                ))}
            </div>
          </div>

          {salesData.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 24px', marginTop: 16 }}>
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
                          <div title={fmtI(val)} style={{ width: '100%', height: h, background: 'var(--cyan)', borderRadius: '4px 4px 0 0', opacity: 0.85, cursor: 'pointer', minHeight: 4 }} />
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

// ── Finance: Overview Tab ──────────────────────────────────────────────────────

function OverviewTab() {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [plData, setPlData] = useState(null);
  const [totalCash, setTotalCash] = useState(0);
  const [loanOutstanding, setLoanOutstanding] = useState(0);
  const [receivables, setReceivables] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const bparam = branchId ? { branchId } : {};
    const [plRes, cashRes, accRes, invRes] = await Promise.allSettled([
      getProfitLoss({ from: fyStart, to: today, ...bparam }),
      getTotalBalance(),
      getBankAccounts(),
      getInvoiceReport({ from: fyStart, to: today, ...bparam }),
    ]);
    let anyFailed = false;
    if (plRes.status === 'fulfilled')   setPlData(plRes.value.data?.data ?? null);
    else anyFailed = true;
    if (cashRes.status === 'fulfilled') setTotalCash(cashRes.value.data?.data?.totalBalance || 0);
    else anyFailed = true;
    if (accRes.status === 'fulfilled') {
      const accs = accRes.value.data?.data || [];
      setLoanOutstanding(accs.filter(a => a.accountType === 'LOAN').reduce((s, a) => s + (a.currentBalance || 0), 0));
    } else anyFailed = true;
    if (invRes.status === 'fulfilled') setReceivables(invRes.value.data?.data?.totals?._sum?.balanceDue || 0);
    else anyFailed = true;
    if (anyFailed) toast.error('Some overview data could not be loaded');
    setLoading(false);
  }, [branchId]);

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

      <KpiBar stats={[
        { label: 'Total Revenue (FY)',                          value: fmt(revenue),            sub: 'POS + Invoices + Fees',                              color: '#10B981' },
        { label: 'Total Expenses (FY)',                         value: fmt(expenses),           sub: 'Ops + Payroll + Bills',                              color: '#EF4444' },
        { label: profit >= 0 ? 'Net Profit' : 'Net Loss',      value: fmt(Math.abs(profit)),   sub: `${margin}% margin`,                                  color: profit >= 0 ? 'var(--navy)' : '#EF4444' },
        { label: 'Cash & Bank',                                 value: fmt(totalCash),          sub: `Net: ${fmt(netCash)}`,                               color: '#1FB8D6' },
      ]} />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
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

// ── Finance: P&L Tab ───────────────────────────────────────────────────────────

function TradingRow({ label, value, color = '#374151', bold = false, indent = false, borderTop = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: indent ? '8px 16px 8px 32px' : '10px 16px', borderTop: borderTop ? '2px solid var(--border)' : '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: '#6B7280', fontStyle: indent ? 'italic' : 'normal' }}>{label}</span>
      <strong style={{ color, fontWeight: bold ? 800 : 600, fontFamily: bold ? 'var(--font-display)' : 'inherit' }}>{fmt(value)}</strong>
    </div>
  );
}

function PLTab() {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [from, setFrom] = useState(fyStart);
  const [to, setTo] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const bparam = branchId ? { branchId } : {};
    try { const res = await getProfitLoss({ from, to, ...bparam }); setData(res.data.data); }
    catch { toast.error('Failed to load P&L'); }
    finally { setLoading(false); }
  }, [from, to, branchId]);

  useEffect(() => { load(); }, [load]);

  const ta = data?.tradingAccount || {};
  const pl = data?.plAccount || {};
  const revenue = ta.revenue?.total || 0;
  const grossProfit = ta.grossProfit || 0;
  const netProfit = pl.netProfit ?? data?.grossProfit ?? 0;
  const netMargin = pl.netMargin ?? data?.profitMargin ?? 0;
  const grossMargin = ta.grossMargin || 0;
  const opex = pl.operatingExpenses || {};

  const doExport = () => {
    if (!data) return;
    exportCsv(`pl_${from}_${to}.csv`,
      ['Section', 'Item', 'Amount (₹)'],
      [
        ['TRADING ACCOUNT','Gross Sales (POS)',       fmtNum(ta.revenue?.posRevenue)],
        ['TRADING ACCOUNT','Invoice Collections',     fmtNum(ta.revenue?.invoiceRevenue)],
        ['TRADING ACCOUNT','Fee Collections',         fmtNum(ta.revenue?.feeRevenue)],
        ['TRADING ACCOUNT','TOTAL REVENUE',           fmtNum(revenue)],
        ['TRADING ACCOUNT','Less: Purchases (Vendor Bills)', fmtNum(ta.purchases)],
        ['TRADING ACCOUNT','Closing Stock (Reference)',fmtNum(ta.closingStock)],
        ['TRADING ACCOUNT','GROSS PROFIT',            fmtNum(grossProfit)],
        ['P&L ACCOUNT',    'Gross Profit b/d',        fmtNum(grossProfit)],
        ['P&L ACCOUNT',    'Operating Expenses',      fmtNum(opex.operational)],
        ['P&L ACCOUNT',    'Payroll & Salaries',      fmtNum(opex.payroll)],
        ['P&L ACCOUNT',    'Depreciation',            fmtNum(opex.depreciation)],
        ...(opex.byCategory || []).map(c => ['EXPENSE DETAIL', c.category, fmtNum(c.amount)]),
        ['P&L ACCOUNT',    'NET PROFIT / LOSS',       fmtNum(netProfit)],
        ['P&L ACCOUNT',    'NET MARGIN %',            `${netMargin}%`],
      ]
    );
  };

  return (
    <div>
      <DateFilter from={from} to={to} onFrom={setFrom} onTo={setTo} onRefresh={load} loading={loading}
        extra={data && <ExportBtn onClick={doExport} label={isMobile ? 'Export' : 'Export P&L'} />}
      />
      {loading ? <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>Loading P&L…</div>
        : data ? (
          <>
            {/* KPI row */}
            <KpiBar stats={[
              { label: 'Gross Revenue',                                  value: fmt(revenue),            color: '#10B981' },
              { label: 'Gross Profit',                                   value: fmt(grossProfit),        sub: `${grossMargin}% margin`,    color: grossProfit >= 0 ? '#1FB8D6' : '#EF4444' },
              { label: netProfit >= 0 ? 'Net Profit' : 'Net Loss',      value: fmt(Math.abs(netProfit)), sub: `${netMargin}% net margin`,  color: netProfit >= 0 ? 'var(--navy)' : '#EF4444' },
              { label: 'Total OpEx',                                     value: fmt(opex.total || 0),    sub: 'Expenses + Payroll + Dep.', color: '#EF4444' },
            ]} />

            {/* Trading Account + P&L side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Trading Account */}
              <Card style={{ padding: 0 }}>
                <div style={{ padding: '12px 16px', background: '#F0FDF4', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>TRADING ACCOUNT</span>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>Accrual basis · {from} → {to}</span>
                </div>
                <TradingRow label="POS / Retail Sales" value={ta.revenue?.posRevenue} indent />
                <TradingRow label="Invoice Collections (cash)" value={ta.revenue?.invoiceRevenue} indent />
                {(ta.revenue?.feeRevenue > 0) && <TradingRow label="Fee Collections" value={ta.revenue?.feeRevenue} indent />}
                <TradingRow label="GROSS SALES" value={revenue} bold color="#10B981" borderTop />
                <TradingRow label={`Less: Purchases (${ta.purchaseCount || 0} bills)`} value={-(ta.purchases || 0)} color="#EF4444" />
                <TradingRow label="= GROSS PROFIT" value={grossProfit} bold color={grossProfit >= 0 ? '#1FB8D6' : '#EF4444'} borderTop />
                <div style={{ padding: '8px 16px', fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
                  Closing stock value: {fmt(ta.closingStock)} (reference only)
                </div>
              </Card>

              {/* P&L Account */}
              <Card style={{ padding: 0 }}>
                <div style={{ padding: '12px 16px', background: '#F8F9FA', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>PROFIT & LOSS ACCOUNT</span>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>All deductions</span>
                </div>
                <TradingRow label="Gross Profit b/d" value={grossProfit} color="#1FB8D6" />
                <TradingRow label="Operating Expenses" value={-(opex.operational || 0)} color="#EF4444" indent />
                <TradingRow label="Payroll & Salaries" value={-(opex.payroll || 0)} color="#EF4444" indent />
                <TradingRow label="Depreciation" value={-(opex.depreciation || 0)} color="#EF4444" indent />
                <TradingRow label="Total Operating Costs" value={-(opex.total || 0)} bold color="#EF4444" borderTop />
                <TradingRow label={netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'} value={netProfit} bold color={netProfit >= 0 ? '#10B981' : '#EF4444'} borderTop />
              </Card>
            </div>

            {/* Expense breakdown */}
            {opex.byCategory?.length > 0 && (
              <Card>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)', marginBottom: 12 }}>Operating Expense Breakdown</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px,1fr))', gap: 8 }}>
                  {opex.byCategory.map(({ category, amount }) => (
                    <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F9FAFB', borderRadius: 8 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>{category.replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>{fmt(amount)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>Note: Vendor bill purchases are shown in Trading Account as COGS, not here.</div>
              </Card>
            )}

            {/* Bottom summary card */}
            <Card style={{ marginTop: 16, background: netProfit >= 0 ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${netProfit >= 0 ? '#BBF7D0' : '#FECACA'}` }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Period: {from} → {to}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: netProfit >= 0 ? '#166534' : '#991B1B' }}>
                    {netProfit >= 0 ? 'Profitable' : 'Net Loss'} — Gross Margin {grossMargin}% · Net Margin {netMargin}%
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>Net {netProfit >= 0 ? 'Profit' : 'Loss'}</div>
                  <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: netProfit >= 0 ? '#10B981' : '#EF4444', fontFamily: 'var(--font-display)' }}>
                    {netProfit >= 0 ? '+' : '-'}{fmt(Math.abs(netProfit))}
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : null}
    </div>
  );
}

// ── Finance: Cash Flow Tab ─────────────────────────────────────────────────────

function CashFlowTab() {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [from, setFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  const [to, setTo] = useState(today);
  const [groupBy, setGroupBy] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const bparam = branchId ? { branchId } : {};
    try { const res = await getCashFlow({ from, to, groupBy, ...bparam }); setData(res.data.data); }
    catch { toast.error('Failed to load cash flow'); }
    finally { setLoading(false); }
  }, [from, to, groupBy, branchId]);

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
            <KpiBar stats={[
              { label: 'Total Inflow',   value: fmt(summary.totalInflow),   color: '#10B981' },
              { label: 'Total Outflow',  value: fmt(summary.totalOutflow),  color: '#EF4444' },
              { label: 'Net Cash Flow',  value: fmt(summary.netCashFlow),   color: summary.netCashFlow >= 0 ? 'var(--navy)' : '#EF4444' },
            ]} />

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
                        <span style={{ fontSize: 12, fontWeight: 700, color: p.net >= 0 ? '#10B981' : '#EF4444' }}>Net: {p.net >= 0 ? '+' : ''}{fmt(p.net)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {[['IN', p.inflow, '#10B981'], ['OUT', p.outflow, '#EF4444']].map(([lbl, val, clr]) => (
                          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, color: clr, width: 40, textAlign: 'right' }}>{lbl}</span>
                            <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 99, height: 7, overflow: 'hidden' }}>
                              <div style={{ width: `${(val / maxVal) * 100}%`, background: clr, height: '100%', borderRadius: 99 }} />
                            </div>
                            <span style={{ fontSize: 11, color: '#6B7280', width: isMobile ? 70 : 100, textAlign: 'right' }}>{fmt(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card style={{ padding: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>Period Breakdown</div>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ ...P.table, minWidth: isMobile ? 480 : 'unset' }}>
                  <thead style={P.thead}>
                    <tr>
                      {['Period', 'Inflow', 'Outflow', 'Net Cash Flow'].map(h => (
                        <th key={h} style={P.th(h === 'Period' ? 'left' : 'right')}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((p, i) => (
                      <tr key={i} style={P.tr(i, periods.length)}>
                        <td style={{ ...P.td(), fontWeight: 600, color: 'var(--navy)' }}>{p.period}</td>
                        <td style={{ ...P.td('right'), color: '#10B981', fontWeight: 600 }}>{fmt(p.inflow)}</td>
                        <td style={{ ...P.td('right'), color: '#EF4444', fontWeight: 600 }}>{fmt(p.outflow)}</td>
                        <td style={{ ...P.td('right'), fontWeight: 700, color: p.net >= 0 ? 'var(--navy)' : '#EF4444' }}>{fmt(p.net)}</td>
                      </tr>
                    ))}
                    {!periods.length && <tr><td colSpan={4} style={P.empty}>No data for this period</td></tr>}
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

// ── Finance: Balance Sheet Tab ─────────────────────────────────────────────────

function BSRow({ label, value, color = '#10B981', note, bold = false, indent = false }) {
  return (
    <div style={{ padding: indent ? '10px 16px 10px 28px' : '11px 16px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: indent ? '#6B7280' : '#374151', fontWeight: bold ? 700 : 400 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: bold ? 800 : 600, color }}>{fmt(value)}</span>
      </div>
      {note && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{note}</div>}
    </div>
  );
}

function BalanceSheetTab() {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invOpen, setInvOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const bparam = branchId ? { branchId } : {};
    try { const res = await getBalanceSheet(bparam); setData(res.data.data); }
    catch { toast.error('Failed to load balance sheet'); }
    finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>Loading…</div>;
  if (!data) return null;

  const ca = data.currentAssets  || {};
  const fa = data.fixedAssets    || {};
  const cl = data.currentLiabilities || {};
  const ll = data.longTermLiabilities || {};
  const eq = data.ownersEquity   || {};
  const netWorth = eq.total || 0;

  const doExport = () => exportCsv(`balance_sheet_${data.asOf}.csv`,
    ['Section', 'Item', 'Amount (₹)'],
    [
      ['Current Assets',  'Cash & Bank',          fmtNum(ca.cashAndBank)],
      ['Current Assets',  'Accounts Receivable',  fmtNum(ca.receivables)],
      ['Current Assets',  'Inventory (at cost)',  fmtNum(ca.inventory)],
      ['Current Assets',  'TOTAL CURRENT ASSETS', fmtNum(ca.total)],
      ['Fixed Assets',    'Gross Block',          fmtNum(fa.grossBlock)],
      ['Fixed Assets',    'Less: Accumulated Dep.',fmtNum(fa.accumulatedDepreciation)],
      ['Fixed Assets',    'Net Block',            fmtNum(fa.netBlock)],
      ['Fixed Assets',    'TOTAL FIXED ASSETS',   fmtNum(fa.total)],
      ['TOTAL ASSETS',    '',                     fmtNum(data.totalAssets)],
      ['Current Liabilities', 'Vendor Payables',  fmtNum(cl.vendorPayables)],
      ['Long-term Liabilities', 'Loans',          fmtNum(ll.loans)],
      ['TOTAL LIABILITIES', '',                   fmtNum(data.totalLiabilities)],
      ['Owners Equity',   'Net Worth (A−L)',       fmtNum(netWorth)],
    ]
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 13, color: '#6B7280' }}>Snapshot as of <strong>{data.asOf}</strong></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <ExportBtn onClick={doExport} label="Export" />
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Net Worth Hero */}
      <Card style={{ marginBottom: 18, background: netWorth >= 0 ? 'linear-gradient(135deg,#192F3D,#1a3548)' : 'linear-gradient(135deg,#7F1D1D,#991B1B)', color: '#fff', border: 'none' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', opacity: 0.65, marginBottom: 4 }}>Net Business Worth (Assets − Liabilities)</div>
        <div style={{ fontSize: isMobile ? 30 : 42, fontWeight: 900, fontFamily: 'var(--font-display)' }}>{fmt(netWorth)}</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Total Assets: {fmt(data.totalAssets)} · Total Liabilities: {fmt(data.totalLiabilities)}</div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* ASSETS */}
        <div>
          <Card style={{ padding: 0, marginBottom: 12 }}>
            <div style={{ padding: '11px 16px', background: '#F0FDF4', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>CURRENT ASSETS</span>
              <span style={{ fontWeight: 800, color: '#10B981' }}>{fmt(ca.total)}</span>
            </div>
            <BSRow label="Cash & Bank Balance" value={ca.cashAndBank} note={`${ca.bankAccounts?.length || 0} account(s)`} indent />
            <BSRow label="Accounts Receivable" value={ca.receivables} note={`${ca.receivablesCount || 0} outstanding invoices`} indent />
            <BSRow label={`Inventory (at cost)`} value={ca.inventory} note={`${ca.inventoryTopItems?.length || 0}+ products in stock`} indent />
            {invOpen && ca.inventoryTopItems?.map(item => (
              <div key={item.name} style={{ padding: '6px 16px 6px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280' }}>
                <span>{item.name} ({item.stock} units)</span>
                <span>{fmt(item.value)}</span>
              </div>
            ))}
            {ca.inventory > 0 && (
              <button onClick={() => setInvOpen(o => !o)} style={{ width: '100%', padding: '6px 16px 6px 28px', background: 'none', border: 'none', fontSize: 11, color: '#1FB8D6', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                {invOpen ? '▲ Hide items' : '▼ Show top inventory items'}
              </button>
            )}
            <BSRow label="TOTAL CURRENT ASSETS" value={ca.total} color="#10B981" bold />
          </Card>

          <Card style={{ padding: 0 }}>
            <div style={{ padding: '11px 16px', background: '#EFF6FF', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#1E40AF' }}>FIXED ASSETS</span>
              <span style={{ fontWeight: 800, color: '#3B82F6' }}>{fmt(fa.total)}</span>
            </div>
            <BSRow label="Gross Block (Purchase Value)" value={fa.grossBlock} color="#374151" indent />
            <BSRow label="Less: Accumulated Depreciation" value={-(fa.accumulatedDepreciation)} color="#EF4444" indent />
            <BSRow label="Net Block (WDV)" value={fa.netBlock} color="#3B82F6" indent />
            <BSRow label="TOTAL FIXED ASSETS" value={fa.total} color="#3B82F6" bold />
          </Card>

          <div style={{ padding: '12px 16px', background: '#192F3D', borderRadius: 10, marginTop: 10, display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>TOTAL ASSETS</span>
            <span style={{ fontWeight: 900, fontSize: 16, fontFamily: 'var(--font-display)' }}>{fmt(data.totalAssets)}</span>
          </div>
        </div>

        {/* LIABILITIES + EQUITY */}
        <div>
          <Card style={{ padding: 0, marginBottom: 12 }}>
            <div style={{ padding: '11px 16px', background: '#FEF2F2', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#991B1B' }}>CURRENT LIABILITIES</span>
              <span style={{ fontWeight: 800, color: '#EF4444' }}>{fmt(cl.total)}</span>
            </div>
            <BSRow label="Vendor Payables (outstanding bills)" value={cl.vendorPayables} color="#EF4444" note={`${cl.vendorPayablesCount || 0} unpaid bills`} indent />
            <BSRow label="TOTAL CURRENT LIABILITIES" value={cl.total} color="#EF4444" bold />
          </Card>

          <Card style={{ padding: 0, marginBottom: 12 }}>
            <div style={{ padding: '11px 16px', background: '#FFF7ED', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#92400E' }}>LONG-TERM LIABILITIES</span>
              <span style={{ fontWeight: 800, color: '#F97316' }}>{fmt(ll.total)}</span>
            </div>
            {ll.loanAccounts?.length > 0
              ? ll.loanAccounts.map((acc, i) => (
                <BSRow key={i} label={acc.name} value={Math.abs(acc.currentBalance)} color="#F97316" note={acc.bankName + ' · Loan'} indent />
              ))
              : <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>No loan accounts</div>
            }
            <BSRow label="TOTAL LONG-TERM LIABILITIES" value={ll.total} color="#F97316" bold />
          </Card>

          <Card style={{ padding: 0, marginBottom: 10 }}>
            <div style={{ padding: '11px 16px', background: '#F5F3FF', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#4C1D95' }}>OWNERS EQUITY</span>
              <span style={{ fontWeight: 800, color: '#7C3AED' }}>{fmt(eq.total)}</span>
            </div>
            <BSRow label="Net Worth (Assets − Liabilities)" value={eq.total} color="#7C3AED" bold />
            <div style={{ padding: '6px 16px 10px', fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>{eq.note}</div>
          </Card>

          <div style={{ padding: '12px 16px', background: '#991B1B', borderRadius: 10, display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>TOTAL LIABILITIES + EQUITY</span>
            <span style={{ fontWeight: 900, fontSize: 16, fontFamily: 'var(--font-display)' }}>{fmt(data.totalAssets)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Finance: GSTR-1 Tab ────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function MonthYearPicker({ month, year, onMonth, onYear, onLoad, loading, children }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em' }}>MONTH</span>
        <select value={month} onChange={e => onMonth(Number(e.target.value))}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em' }}>YEAR</span>
        <select value={year} onChange={e => onYear(Number(e.target.value))}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
          {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <button onClick={onLoad} disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
        <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} /> Load
      </button>
      {children}
    </div>
  );
}

function GstrTab() {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hsnOpen, setHsnOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const bparam = branchId ? { branchId } : {};
    try { const res = await getGstr1({ month, year, ...bparam }); setData(res.data.data); }
    catch { toast.error('Failed to load GSTR-1'); }
    finally { setLoading(false); }
  }, [month, year, branchId]);

  useEffect(() => { load(); }, [load]);

  const doExport = () => {
    if (!data) return;
    const hsn = data.hsnSummary || [];
    exportCsv(`GSTR1_${MONTHS[month - 1]}_${year}.csv`,
      ['Section','Invoice #','Date','Customer','GSTIN','Taxable Value (₹)','CGST (₹)','SGST (₹)','IGST (₹)','Total Tax (₹)','Invoice Value (₹)'],
      [
        ...(data.b2b || []).map(r => ['B2B', r.invoiceNumber, r.invoiceDate, r.customerName, r.customerGSTIN, fmtNum(r.taxableValue), fmtNum(r.cgst), fmtNum(r.sgst), fmtNum(r.igst), fmtNum(r.totalTax), fmtNum(r.invoiceValue)]),
        ...(data.b2c || []).map(r => [r.type === 'POS' ? 'B2C-POS' : 'B2C', r.invoiceNumber, r.invoiceDate, r.customerName, '', fmtNum(r.taxableValue), fmtNum(r.cgst), fmtNum(r.sgst), fmtNum(r.igst), fmtNum(r.totalTax), fmtNum(r.invoiceValue)]),
        ['--- HSN SUMMARY ---','','','','','','','','','',''],
        ...hsn.map(h => ['HSN-' + h.hsnCode, '', '', h.description, '', fmtNum(h.taxableValue), fmtNum(h.cgst), fmtNum(h.sgst), fmtNum(h.igst), fmtNum(h.totalTax), '']),
        ['TOTAL','','','','', fmtNum(data.summary?.totalTaxableValue), fmtNum(data.summary?.totalCgst), fmtNum(data.summary?.totalSgst), fmtNum(data.summary?.totalIgst), fmtNum(data.summary?.totalTax), fmtNum(data.summary?.totalInvoiceValue)],
      ]
    );
  };

  const s = data?.summary || {};
  const invoiceCols = (type) => type === 'b2b'
    ? ['Invoice #','Date','Customer','GSTIN','Taxable','CGST','SGST','IGST','Total']
    : ['Receipt #','Date','Customer','Type','Taxable','CGST','SGST','IGST','Total'];

  return (
    <div>
      <MonthYearPicker month={month} year={year} onMonth={setMonth} onYear={setYear} onLoad={load} loading={loading}>
        {data && <ExportBtn onClick={doExport} label={isMobile ? 'Export' : 'Export GSTR-1 CSV'} />}
      </MonthYearPicker>

      {loading ? <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>Loading…</div>
        : data ? (
          <>
            {/* Summary KPIs */}
            <KpiBar stats={[
              { label: 'B2B Invoices',   value: data.b2b?.length || 0,     color: 'var(--navy)' },
              { label: 'B2C + POS',      value: data.b2c?.length || 0,     color: '#6B7280' },
              { label: 'Taxable Value',  value: fmt(s.totalTaxableValue),   color: 'var(--navy)' },
              { label: 'CGST',           value: fmt(s.totalCgst),           color: '#8B5CF6' },
              { label: 'SGST',           value: fmt(s.totalSgst),           color: '#8B5CF6' },
              { label: 'IGST',           value: fmt(s.totalIgst),           color: '#F59E0B' },
              { label: 'Total Tax',      value: fmt(s.totalTax),            color: '#10B981' },
              { label: 'Invoice Value',  value: fmt(s.totalInvoiceValue),   color: '#1FB8D6' },
            ]} />

            <div style={{ marginBottom: 16, fontSize: 13, color: '#6B7280' }}>
              GSTIN: <strong style={{ fontFamily: 'monospace' }}>{s.gstin}</strong> · Period: {s.period}
              {s.totalPosTransactions > 0 && <span style={{ marginLeft: 8, padding: '2px 8px', background: '#E0F2FE', color: '#0369A1', borderRadius: 99, fontSize: 12 }}>+{s.totalPosTransactions} POS receipts included</span>}
            </div>

            {/* B2B Table */}
            <Card style={{ marginBottom: 16, padding: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--navy)', display: 'flex', justifyContent: 'space-between' }}>
                <span>B2B — GST Registered Buyers</span>
                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400 }}>{(data.b2b || []).length} invoices</span>
              </div>
              <div style={P.tableScroll}>
                <table style={{ ...P.table, minWidth: 680 }}>
                  <thead style={P.thead}>
                    <tr>
                      {invoiceCols('b2b').map(h => (
                        <th key={h} style={P.th(['Invoice #','Date','Customer','GSTIN'].includes(h) ? 'left' : 'right')}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.b2b || []).map((row, i) => (
                      <tr key={i} style={P.tr(i, data.b2b.length)}>
                        <td style={{ ...P.td(), fontWeight: 600, color: 'var(--navy)' }}>{row.invoiceNumber}</td>
                        <td style={{ ...P.td(), color: '#6B7280' }}>{row.invoiceDate}</td>
                        <td style={P.td()}>{row.customerName}</td>
                        <td style={{ ...P.td(), color: '#6B7280', fontFamily: 'monospace' }}>{row.customerGSTIN}</td>
                        <td style={P.td('right')}>{fmt(row.taxableValue)}</td>
                        <td style={{ ...P.td('right'), color: '#6B7280' }}>{fmt(row.cgst)}</td>
                        <td style={{ ...P.td('right'), color: '#6B7280' }}>{fmt(row.sgst)}</td>
                        <td style={{ ...P.td('right'), color: '#6B7280' }}>{fmt(row.igst)}</td>
                        <td style={{ ...P.td('right'), fontWeight: 700 }}>{fmt(row.invoiceValue)}</td>
                      </tr>
                    ))}
                    {!data.b2b?.length && (
                      <tr><td colSpan={9} style={P.empty}>No B2B invoices this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* B2C Table (invoices + POS) */}
            <Card style={{ marginBottom: 16, padding: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--navy)', display: 'flex', justifyContent: 'space-between' }}>
                <span>B2C — End Consumers &amp; POS Transactions</span>
                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400 }}>{(data.b2c || []).length} records</span>
              </div>
              <div style={P.tableScroll}>
                <table style={{ ...P.table, minWidth: 640 }}>
                  <thead style={P.thead}>
                    <tr>
                      {invoiceCols('b2c').map(h => (
                        <th key={h} style={P.th(['Receipt #','Date','Customer','Type'].includes(h) ? 'left' : 'right')}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.b2c || []).map((row, i) => (
                      <tr key={i} style={{ ...P.tr(i, data.b2c.length), background: row.type === 'POS' ? '#F0FDF4' : undefined }}>
                        <td style={{ ...P.td(), fontWeight: 600, color: 'var(--navy)' }}>{row.invoiceNumber}</td>
                        <td style={{ ...P.td(), color: '#6B7280' }}>{row.invoiceDate}</td>
                        <td style={P.td()}>{row.customerName}</td>
                        <td style={P.td()}>
                          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: row.type === 'POS' ? '#D1FAE5' : '#E0F2FE', color: row.type === 'POS' ? '#065F46' : '#0369A1', fontWeight: 600 }}>
                            {row.type === 'POS' ? 'POS' : 'INV'}
                          </span>
                        </td>
                        <td style={P.td('right')}>{fmt(row.taxableValue)}</td>
                        <td style={{ ...P.td('right'), color: '#6B7280' }}>{fmt(row.cgst)}</td>
                        <td style={{ ...P.td('right'), color: '#6B7280' }}>{fmt(row.sgst)}</td>
                        <td style={{ ...P.td('right'), color: '#6B7280' }}>{fmt(row.igst)}</td>
                        <td style={{ ...P.td('right'), fontWeight: 700 }}>{fmt(row.invoiceValue)}</td>
                      </tr>
                    ))}
                    {!data.b2c?.length && (
                      <tr><td colSpan={9} style={P.empty}>No B2C records this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* HSN Summary (Table 12) */}
            {(data.hsnSummary?.length > 0) && (
              <Card style={{ padding: 0 }}>
                <button
                  onClick={() => setHsnOpen(o => !o)}
                  style={{ width: '100%', padding: '12px 16px', borderBottom: hsnOpen ? '1px solid var(--border)' : 'none', fontWeight: 700, fontSize: 14, color: 'var(--navy)', display: 'flex', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span>Table 12 — HSN-wise Summary ({data.hsnSummary.length} codes)</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400 }}>{hsnOpen ? 'Collapse ▲' : 'Expand ▼'}</span>
                </button>
                {hsnOpen && (
                  <div style={P.tableScroll}>
                    <table style={{ ...P.table, minWidth: 600 }}>
                      <thead style={P.thead}>
                        <tr>
                          {['HSN Code','Description','Qty','Rate %','Taxable Value','CGST','SGST','IGST','Total Tax'].map(h => (
                            <th key={h} style={P.th(['HSN Code','Description'].includes(h) ? 'left' : 'right')}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.hsnSummary.map((h, i) => (
                          <tr key={i} style={P.tr(i, data.hsnSummary.length)}>
                            <td style={{ ...P.td(), fontWeight: 700, color: 'var(--navy)', fontFamily: 'monospace' }}>{h.hsnCode}</td>
                            <td style={{ ...P.td(), maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.description}</td>
                            <td style={{ ...P.td('right'), color: '#6B7280' }}>{h.totalQty}</td>
                            <td style={{ ...P.td('right'), color: '#6B7280' }}>{h.rate}%</td>
                            <td style={P.td('right')}>{fmt(h.taxableValue)}</td>
                            <td style={{ ...P.td('right'), color: '#6B7280' }}>{fmt(h.cgst)}</td>
                            <td style={{ ...P.td('right'), color: '#6B7280' }}>{fmt(h.sgst)}</td>
                            <td style={{ ...P.td('right'), color: '#6B7280' }}>{fmt(h.igst)}</td>
                            <td style={{ ...P.td('right'), fontWeight: 700, color: '#10B981' }}>{fmt(h.totalTax)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#F0FDF4', borderTop: '2px solid #BBF7D0' }}>
                          <td colSpan={4} style={{ padding: '10px 12px', fontWeight: 700, fontSize: 13 }}>TOTAL</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{fmt(s.totalTaxableValue)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#6B7280' }}>{fmt(s.totalCgst)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#6B7280' }}>{fmt(s.totalSgst)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#6B7280' }}>{fmt(s.totalIgst)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, fontSize: 13, color: '#10B981' }}>{fmt(s.totalTax)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </>
        ) : null}
    </div>
  );
}

// ── Finance: GSTR-3B Tab ───────────────────────────────────────────────────────

function Gstr3bTab() {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const bparam = branchId ? { branchId } : {};
    try { const res = await getGstr3b({ month, year, ...bparam }); setData(res.data.data); }
    catch { toast.error('Failed to load GSTR-3B'); }
    finally { setLoading(false); }
  }, [month, year, branchId]);

  useEffect(() => { load(); }, [load]);

  const doExport = () => {
    if (!data) return;
    const out = data.outputTax || {};
    const itc = data.itcAvailable || {};
    const net = data.netTaxPayable || {};
    exportCsv(`GSTR3B_${MONTHS[month - 1]}_${year}.csv`,
      ['Table','Description','Taxable Value (₹)','CGST (₹)','SGST (₹)','IGST (₹)','Total (₹)'],
      [
        ['3.1', 'Output Tax — Intra-State (CGST+SGST)', fmtNum(out.intraState?.taxableValue), fmtNum(out.intraState?.cgst), fmtNum(out.intraState?.sgst), '0.00', fmtNum((out.intraState?.cgst||0)+(out.intraState?.sgst||0))],
        ['3.1', 'Output Tax — Inter-State (IGST)', fmtNum(out.interState?.taxableValue), '0.00', '0.00', fmtNum(out.interState?.igst), fmtNum(out.interState?.igst)],
        ['3.1', 'Total Output Tax Liability', fmtNum(out.totalTaxableValue), fmtNum(out.totalCgst), fmtNum(out.totalSgst), fmtNum(out.totalIgst), fmtNum(out.total)],
        ['4', 'ITC Available (Vendor Bills)', fmtNum(itc.taxableValue), fmtNum(itc.cgst), fmtNum(itc.sgst), fmtNum(itc.igst), fmtNum(itc.total)],
        ['6.1', 'Net Tax Payable', '', fmtNum(net.cgst), fmtNum(net.sgst), fmtNum(net.igst), fmtNum(net.total)],
      ]
    );
  };

  const out = data?.outputTax || {};
  const itc = data?.itcAvailable || {};
  const net = data?.netTaxPayable || {};

  return (
    <div>
      <MonthYearPicker month={month} year={year} onMonth={setMonth} onYear={setYear} onLoad={load} loading={loading}>
        {data && <ExportBtn onClick={doExport} label={isMobile ? 'Export' : 'Export GSTR-3B'} />}
      </MonthYearPicker>

      {loading ? <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>Loading…</div>
        : data ? (
          <>
            <div style={{ marginBottom: 14, fontSize: 13, color: '#6B7280' }}>
              GSTIN: <strong style={{ fontFamily: 'monospace' }}>{data.gstin}</strong> · Period: {data.period}
              <span style={{ marginLeft: 8, fontSize: 12, color: '#9CA3AF' }}>({out.invoiceCount || 0} invoices + {out.posCount || 0} POS transactions · {itc.vendorBillsCount || 0} vendor bills)</span>
            </div>

            {/* Net Tax Payable Hero */}
            <Card style={{ marginBottom: 20, background: net.total > 0 ? 'linear-gradient(135deg, #192F3D, #1a3548)' : 'linear-gradient(135deg, #065F46, #047857)', color: '#fff', border: 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7, marginBottom: 6 }}>
                Net GST Payable (Output Tax − ITC)
              </div>
              <div style={{ fontSize: isMobile ? 32 : 44, fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{fmt(net.total)}</div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>CGST: {fmt(net.cgst)}</span>
                <span>SGST: {fmt(net.sgst)}</span>
                <span>IGST: {fmt(net.igst)}</span>
              </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Table 3.1 — Output Tax */}
              <Card style={{ padding: 0 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: '#FEF2F2', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#991B1B' }}>Table 3.1 — Output Tax Liability</span>
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#EF4444' }}>{fmt(out.total)}</span>
                </div>
                {[
                  { label: 'Taxable Value (Intra-State)', value: out.intraState?.taxableValue, color: '#374151' },
                  { label: 'CGST (Intra-State)', value: out.intraState?.cgst, color: '#EF4444' },
                  { label: 'SGST (Intra-State)', value: out.intraState?.sgst, color: '#EF4444' },
                  { label: 'Taxable Value (Inter-State)', value: out.interState?.taxableValue, color: '#374151' },
                  { label: 'IGST (Inter-State)', value: out.interState?.igst, color: '#F59E0B' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ color: '#6B7280' }}>{label}</span>
                    <strong style={{ color }}>{fmt(value || 0)}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: 14, fontWeight: 700, background: '#FFF7F7' }}>
                  <span>Total Output Tax</span>
                  <span style={{ color: '#EF4444' }}>{fmt(out.total)}</span>
                </div>
              </Card>

              {/* Table 4 — ITC */}
              <Card style={{ padding: 0 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: '#F0FDF4', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#166534' }}>Table 4 — ITC Available</span>
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#10B981' }}>{fmt(itc.total)}</span>
                </div>
                {[
                  { label: 'Taxable Purchases', value: itc.taxableValue, color: '#374151' },
                  { label: 'CGST ITC', value: itc.cgst, color: '#10B981' },
                  { label: 'SGST ITC', value: itc.sgst, color: '#10B981' },
                  { label: 'IGST ITC', value: itc.igst, color: '#10B981' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ color: '#6B7280' }}>{label}</span>
                    <strong style={{ color }}>{fmt(value || 0)}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: 14, fontWeight: 700, background: '#F7FFF7' }}>
                  <span>Total ITC</span>
                  <span style={{ color: '#10B981' }}>{fmt(itc.total)}</span>
                </div>
                {itc.note && <div style={{ padding: '8px 16px', fontSize: 11, color: '#9CA3AF', fontStyle: 'italic', borderTop: '1px solid var(--border)' }}>{itc.note}</div>}
              </Card>
            </div>

            {/* Table 6.1 — Net Tax Payable breakdown */}
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 14 }}>Table 6.1 — Net Tax Payable Computation</div>
              <div style={P.tableScroll}>
                <table style={{ ...P.table, minWidth: 420 }}>
                  <thead style={P.thead}>
                    <tr>
                      {['Tax Head', 'Output Tax', 'ITC Available', 'Net Payable'].map(h => (
                        <th key={h} style={P.th(h === 'Tax Head' ? 'left' : 'right')}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { head: 'CGST', output: out.totalCgst, itcAmt: itc.cgst, net: net.cgst },
                      { head: 'SGST', output: out.totalSgst, itcAmt: itc.sgst, net: net.sgst },
                      { head: 'IGST', output: out.totalIgst, itcAmt: itc.igst, net: net.igst },
                    ].map(({ head, output, itcAmt, net: n }, i) => (
                      <tr key={head} style={P.tr(i, 3)}>
                        <td style={{ ...P.td(), fontWeight: 700, color: 'var(--navy)' }}>{head}</td>
                        <td style={{ ...P.td('right'), color: '#EF4444', fontWeight: 600 }}>{fmt(output || 0)}</td>
                        <td style={{ ...P.td('right'), color: '#10B981', fontWeight: 600 }}>{fmt(itcAmt || 0)}</td>
                        <td style={{ ...P.td('right'), fontWeight: 700, color: n > 0 ? '#EF4444' : '#10B981' }}>{fmt(n || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: net.total > 0 ? '#FEF2F2' : '#F0FDF4', borderTop: '2px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, fontSize: 14 }}>TOTAL</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: '#EF4444' }}>{fmt(out.total || 0)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: '#10B981' }}>{fmt(itc.total || 0)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, fontSize: 15, color: net.total > 0 ? '#EF4444' : '#10B981' }}>{fmt(net.total || 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {net.total === 0 && itc.total >= out.total && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, fontSize: 13, color: '#065F46' }}>
                  ITC fully offsets output tax. No cash payment required this period.
                </div>
              )}
            </Card>
          </>
        ) : null}
    </div>
  );
}

// ── Finance: TDS Report Tab ────────────────────────────────────────────────────

function TdsTab() {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [from, setFrom] = useState(fyStart);
  const [to, setTo] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [salaryOpen, setSalaryOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const bparam = branchId ? { branchId } : {};
    try { const res = await getTdsReport({ from, to, ...bparam }); setData(res.data.data); }
    catch { toast.error('Failed to load TDS report'); }
    finally { setLoading(false); }
  }, [from, to, branchId]);

  useEffect(() => { load(); }, [load]);

  const sum = data?.summary || {};
  const salary = data?.salaryTds || {};

  const doExport = () => {
    if (!data) return;
    exportCsv(`TDS_${from}_${to}.csv`,
      ['Section', 'Nature of Payment', 'Total Paid (₹)', 'Threshold (₹)', 'Rate %', 'TDS Due (₹)', 'TDS Deducted (₹)', 'Shortfall (₹)'],
      [
        ...(data.expenseTds || []).map(r => [r.section, r.label, fmtNum(r.totalPayments), r.threshold, r.tdsRate, fmtNum(r.tdsDue), fmtNum(r.tdsDeducted), fmtNum(r.shortfall)]),
        ['192', 'Salary TDS', fmtNum(salary.totalGrossSalary), '—', '—', fmtNum(salary.tdsDeducted), fmtNum(salary.tdsDeducted), '0.00'],
        ['TOTAL', '', '', '', '', fmtNum(sum.totalTdsDue), fmtNum(sum.totalTdsDeducted), fmtNum(sum.totalShortfall)],
      ]
    );
  };

  return (
    <div>
      <DateFilter from={from} to={to} onFrom={setFrom} onTo={setTo} onRefresh={load} loading={loading}
        extra={data && <ExportBtn onClick={doExport} label="Export TDS" />}
      />

      {loading ? <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>Loading…</div>
        : data ? (
          <>
            <KpiBar stats={[
              { label: 'TDS Liability',    value: fmt(sum.totalTdsDue),       sub: 'Due on vendor payments',                                      color: '#EF4444' },
              { label: 'TDS Deducted',     value: fmt(sum.totalTdsDeducted),  sub: 'Already deducted',                                            color: '#10B981' },
              { label: 'TDS Shortfall',    value: fmt(sum.totalShortfall),    sub: sum.totalShortfall > 0 ? 'Action required' : 'Fully compliant', color: sum.totalShortfall > 0 ? '#EF4444' : '#10B981' },
              { label: 'Salary TDS',       value: fmt(sum.salaryTds),         sub: `${salary.employeeCount || 0} employees`,                       color: '#8B5CF6' },
            ]} />

            <Card style={{ padding: 0, marginBottom: 16 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
                TDS Liability — Expense Payments
              </div>
              {data.expenseTds?.length > 0 ? (
                <div style={P.tableScroll}>
                  <table style={{ ...P.table, minWidth: 700 }}>
                    <thead style={P.thead}>
                      <tr>
                        {['Section', 'Nature of Payment', 'Total Paid', 'Threshold', 'Rate', 'TDS Due', 'Deducted', 'Shortfall', 'Status'].map(h => (
                          <th key={h} style={P.th(['Section','Nature of Payment','Status'].includes(h) ? 'left' : 'right')}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.expenseTds.map((row, i) => (
                        <tr key={row.category} style={{ ...P.tr(i, data.expenseTds.length), background: row.shortfall > 0 ? '#FFF7F7' : undefined }}>
                          <td style={{ ...P.td(), fontWeight: 700, fontFamily: 'monospace', color: 'var(--navy)' }}>{row.section}</td>
                          <td style={P.td()}>
                            <div style={{ fontWeight: 600, color: '#374151' }}>{row.label}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{row.count} payment{row.count !== 1 ? 's' : ''}</div>
                          </td>
                          <td style={P.td('right')}>{fmt(row.totalPayments)}</td>
                          <td style={{ ...P.td('right'), color: '#6B7280' }}>{fmt(row.threshold)}</td>
                          <td style={{ ...P.td('right'), color: '#6B7280' }}>{row.tdsRate}%</td>
                          <td style={{ ...P.td('right'), fontWeight: 600, color: '#EF4444' }}>{fmt(row.tdsDue)}</td>
                          <td style={{ ...P.td('right'), fontWeight: 600, color: '#10B981' }}>{fmt(row.tdsDeducted)}</td>
                          <td style={{ ...P.td('right'), fontWeight: 700, color: row.shortfall > 0 ? '#EF4444' : '#10B981' }}>{fmt(row.shortfall)}</td>
                          <td style={P.td()}>
                            {!row.exceeded ? (
                              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: '#F3F4F6', color: '#6B7280', fontWeight: 600 }}>Below limit</span>
                            ) : row.shortfall <= 0 ? (
                              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: '#D1FAE5', color: '#065F46', fontWeight: 600 }}>Compliant</span>
                            ) : (
                              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}>Shortfall</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#F9FAFB', borderTop: '2px solid var(--border)' }}>
                        <td colSpan={5} style={{ padding: '11px 12px', fontWeight: 700, fontSize: 13 }}>TOTAL (Vendor TDS)</td>
                        <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 700, color: '#EF4444' }}>{fmt(sum.totalTdsDue)}</td>
                        <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{fmt(sum.totalTdsDeducted)}</td>
                        <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 800, color: sum.totalShortfall > 0 ? '#EF4444' : '#10B981' }}>{fmt(sum.totalShortfall)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9CA3AF', fontSize: 14 }}>
                  No TDS-applicable expense categories (Rent, Professional Fees, Contract Labour) for this period.
                </div>
              )}
            </Card>

            <Card style={{ padding: 0, marginBottom: 14 }}>
              <button onClick={() => setSalaryOpen(o => !o)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: salaryOpen ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>Section 192 — Salary TDS &amp; Professional Tax</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{salary.employeeCount || 0} employee(s)</span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#8B5CF6' }}>TDS: {fmt(salary.tdsDeducted)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>PT: {fmt(salary.professionalTax)}</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{salaryOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {salaryOpen && (
                salary.entries?.length > 0 ? (
                  <div style={P.tableScroll}>
                    <table style={{ ...P.table, minWidth: 480 }}>
                      <thead style={P.thead}>
                        <tr>
                          {['Employee', 'Gross Salary', 'TDS (192)', 'Prof. Tax', 'Net Salary'].map(h => (
                            <th key={h} style={P.th(h === 'Employee' ? 'left' : 'right')}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {salary.entries.map((e, i) => (
                          <tr key={i} style={P.tr(i, salary.entries.length)}>
                            <td style={{ ...P.td(), fontWeight: 600, color: 'var(--navy)' }}>{e.name}</td>
                            <td style={P.td('right')}>{fmt(e.grossSalary)}</td>
                            <td style={{ ...P.td('right'), color: '#8B5CF6', fontWeight: 600 }}>{fmt(e.tds)}</td>
                            <td style={{ ...P.td('right'), color: '#F59E0B', fontWeight: 600 }}>{fmt(e.pt)}</td>
                            <td style={{ ...P.td('right'), fontWeight: 700, color: 'var(--navy)' }}>{fmt(e.netSalary)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#F5F3FF', borderTop: '2px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>TOTAL</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{fmt(salary.totalGrossSalary)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#8B5CF6' }}>{fmt(salary.tdsDeducted)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#F59E0B' }}>{fmt(salary.professionalTax)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: 13 }}>No payroll entries for this period.</div>
                )
              )}
            </Card>

            {sum.totalShortfall > 0 && (
              <Card style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <AlertTriangle size={15} color="#EF4444" />
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#991B1B' }}>TDS Compliance Alert</span>
                </div>
                <div style={{ fontSize: 13, color: '#7F1D1D' }}>
                  TDS shortfall of <strong>{fmt(sum.totalShortfall)}</strong> detected. Deposit pending TDS to avoid interest under Section 201(1A) at 1.5% per month.
                </div>
              </Card>
            )}
          </>
        ) : null}
    </div>
  );
}

// ── Finance: Cash Book Tab ─────────────────────────────────────────────────────

function CashBookTab() {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [from, setFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  const [to, setTo] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const bparam = branchId ? { branchId } : {};
    try { const res = await getCashBook({ from, to, ...bparam }); setData(res.data.data); }
    catch { toast.error('Failed to load cash book'); }
    finally { setLoading(false); }
  }, [from, to, branchId]);

  useEffect(() => { load(); }, [load]);

  const s = data?.summary || {};
  const entries = data?.entries || [];

  let running = 0;
  const withBalance = entries.map(e => {
    running += e.type === 'IN' ? e.amount : -e.amount;
    return { ...e, balance: running };
  });

  const doExport = () => {
    if (!data) return;
    exportCsv(`cash_book_${from}_${to}.csv`,
      ['Date', 'Narration', 'Type', 'Amount (₹)', 'Running Balance (₹)'],
      withBalance.map(e => [
        new Date(e.date).toLocaleDateString('en-IN'),
        e.narration, e.type, fmtNum(e.amount), fmtNum(e.balance),
      ]).concat([
        ['', '', '', '', ''],
        ['Total Cash IN', '', '', fmtNum(s.totalIn), ''],
        ['Total Cash OUT', '', '', fmtNum(s.totalOut), ''],
        ['Net Cash', '', '', fmtNum(s.netCash), ''],
      ])
    );
  };

  return (
    <div>
      <DateFilter from={from} to={to} onFrom={setFrom} onTo={setTo} onRefresh={load} loading={loading}
        extra={data && <ExportBtn onClick={doExport} label="Export Cash Book" />}
      />

      {loading ? <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>Loading…</div>
        : data ? (
          <>
            <KpiBar stats={[
              { label: 'Total Cash IN',  value: fmt(s.totalIn),  color: '#10B981' },
              { label: 'Total Cash OUT', value: fmt(s.totalOut), color: '#EF4444' },
              { label: 'Net Cash',       value: fmt(s.netCash),  color: s.netCash >= 0 ? 'var(--navy)' : '#EF4444' },
              { label: 'Entries',        value: String(s.entryCount || 0), color: '#8B5CF6' },
            ]} />

            <Card style={{ padding: 0 }}>
              <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--navy)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Cash Book Entries</span>
                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400 }}>{entries.length} entries · {from} to {to}</span>
              </div>
              {entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#9CA3AF', fontSize: 14 }}>No cash transactions for this period.</div>
              ) : (
                <div style={{ ...P.tableScroll, WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ ...P.table, minWidth: isMobile ? 460 : 'unset' }}>
                    <thead style={P.thead}>
                      <tr>
                        {['Date', 'Narration', 'Type', 'Amount', 'Balance'].map(h => (
                          <th key={h} style={P.th(['Date','Narration','Type'].includes(h) ? 'left' : 'right')}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {withBalance.map((e, i) => (
                        <tr key={i} style={{ ...P.tr(i, withBalance.length), background: e.type === 'IN' ? '#F0FFF4' : undefined }}>
                          <td style={{ ...P.td(), color: '#6B7280', whiteSpace: 'nowrap' }}>
                            {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ ...P.td(), maxWidth: isMobile ? 140 : 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.narration}</td>
                          <td style={P.td()}>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: e.type === 'IN' ? '#D1FAE5' : '#FEE2E2', color: e.type === 'IN' ? '#065F46' : '#991B1B', fontWeight: 700 }}>
                              {e.type === 'IN' ? '▲ IN' : '▼ OUT'}
                            </span>
                          </td>
                          <td style={{ ...P.td('right'), fontWeight: 700, color: e.type === 'IN' ? '#10B981' : '#EF4444' }}>
                            {e.type === 'IN' ? '+' : '-'}{fmt(e.amount)}
                          </td>
                          <td style={{ ...P.td('right'), fontWeight: 600, color: e.balance >= 0 ? 'var(--navy)' : '#EF4444' }}>{fmt(e.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#F0F9FF', borderTop: '2px solid #BFDBFE' }}>
                        <td colSpan={2} style={{ padding: '11px 12px', fontWeight: 700, fontSize: 13 }}>CLOSING BALANCE</td>
                        <td />
                        <td style={{ padding: '11px 12px', textAlign: 'right', fontSize: 13 }}>
                          <span style={{ color: '#10B981', fontWeight: 700 }}>+{fmt(s.totalIn)}</span>
                          <span style={{ color: '#9CA3AF', margin: '0 4px' }}>−</span>
                          <span style={{ color: '#EF4444', fontWeight: 700 }}>{fmt(s.totalOut)}</span>
                        </td>
                        <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: s.netCash >= 0 ? 'var(--navy)' : '#EF4444' }}>{fmt(s.netCash)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>
          </>
        ) : null}
    </div>
  );
}

// ── Finance: Creditors Aging Tab ───────────────────────────────────────────────

function CreditorsAgingTab() {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const bparam = branchId ? { branchId } : {};
    try { const res = await getCreditorAging(bparam); setData(res.data.data); }
    catch { toast.error('Failed to load creditors aging'); }
    finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>Loading…</div>;
  if (!data) return null;

  const b = data.buckets || {};
  const total = data.totalOutstanding || 0;

  const BUCKETS = [
    { key: 'current', label: 'Not Yet Due', color: '#10B981' },
    { key: 'days30',  label: '1–30 Days',   color: '#F59E0B' },
    { key: 'days60',  label: '31–60 Days',  color: '#F97316' },
    { key: 'days90',  label: '61–90 Days',  color: '#EF4444' },
    { key: 'over90',  label: '90+ Days',    color: '#7F1D1D' },
  ];

  const bucketColor = (bucket) => ({ current: '#10B981', '1-30': '#F59E0B', '31-60': '#F97316', '61-90': '#EF4444', '90+': '#7F1D1D' })[bucket] || '#9CA3AF';

  const doExport = () => exportCsv(`creditors_aging_${data.asOf}.csv`,
    ['Bill #', 'Vendor', 'Issue Date', 'Due Date', 'Days Past Due', 'Bucket', 'Balance Due (₹)', 'Total Bill (₹)', 'Status'],
    (data.bills || []).map(bill => [
      bill.billNumber, bill.vendor?.name || '—',
      new Date(bill.issueDate).toLocaleDateString('en-IN'),
      bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN') : '—',
      bill.daysPast, bill.bucket, fmtNum(bill.balanceDue), fmtNum(bill.total), bill.status,
    ])
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 13, color: '#6B7280' }}>Snapshot as of <strong>{data.asOf}</strong> · {data.bills?.length || 0} outstanding bills</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <ExportBtn onClick={doExport} label="Export" />
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      <Card style={{ marginBottom: 18, background: total > 0 ? 'linear-gradient(135deg,#7F1D1D,#991B1B)' : 'linear-gradient(135deg,#065F46,#047857)', color: '#fff', border: 'none' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', opacity: 0.65, marginBottom: 4 }}>Total Vendor Payables Outstanding</div>
        <div style={{ fontSize: isMobile ? 30 : 42, fontWeight: 900, fontFamily: 'var(--font-display)' }}>{fmt(total)}</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{data.bills?.length || 0} unpaid bills across all vendors</div>
      </Card>

      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 16 }}>Aging Analysis</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: isMobile ? 10 : 12, marginBottom: 16 }}>
          {BUCKETS.map(({ key, label, color }) => {
            const val = b[key] || 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <div key={key} style={{ textAlign: 'center', padding: '14px 8px', background: '#F9FAFB', borderRadius: 10, border: `2px solid ${val > 0 ? color + '60' : '#E5E7EB'}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: val > 0 ? color : '#9CA3AF', fontFamily: 'var(--font-display)' }}>{fmt(val)}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{pct}% of total</div>
              </div>
            );
          })}
        </div>
        <div style={{ height: 12, borderRadius: 99, overflow: 'hidden', display: 'flex', background: '#F3F4F6' }}>
          {BUCKETS.map(({ key, color }) => {
            const val = b[key] || 0;
            const pct = total > 0 ? (val / total) * 100 : 0;
            return pct > 0 ? <div key={key} style={{ width: `${pct}%`, background: color, height: '100%' }} /> : null;
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
          {BUCKETS.map(({ key, label, color }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
              <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--navy)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Outstanding Bills</span>
          <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400 }}>{data.bills?.length || 0} bills</span>
        </div>
        {data.bills?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9CA3AF', fontSize: 14 }}>No outstanding vendor bills.</div>
        ) : (
          <div style={{ ...P.tableScroll, WebkitOverflowScrolling: 'touch' }}>
            <table style={{ ...P.table, minWidth: isMobile ? 480 : 'unset' }}>
              <thead style={P.thead}>
                <tr>
                  {['Bill #', 'Vendor', 'Due Date', 'Age', 'Balance Due', 'Status'].map(h => (
                    <th key={h} style={P.th(h === 'Balance Due' ? 'right' : 'left')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.bills.map((bill, i) => {
                  const color = bucketColor(bill.bucket);
                  return (
                    <tr key={i} style={{ ...P.tr(i, data.bills.length), background: bill.daysPast > 60 ? '#FFF7F7' : undefined }}>
                      <td style={{ ...P.td(), fontWeight: 600, color: 'var(--navy)', fontFamily: 'monospace' }}>{bill.billNumber}</td>
                      <td style={P.td()}>{bill.vendor?.name || '—'}</td>
                      <td style={{ ...P.td(), color: '#6B7280' }}>
                        {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                      <td style={P.td()}>
                        <span style={{ fontSize: 12, fontWeight: 700, color }}>
                          {bill.daysPast === 0 ? 'On time' : `${bill.daysPast}d overdue`}
                        </span>
                      </td>
                      <td style={{ ...P.td('right'), fontWeight: 700, color }}>{fmt(bill.balanceDue)}</td>
                      <td style={P.td()}>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: bill.status === 'OVERDUE' ? '#FEE2E2' : bill.status === 'PARTIAL' ? '#FEF3C7' : '#F3F4F6', color: bill.status === 'OVERDUE' ? '#991B1B' : bill.status === 'PARTIAL' ? '#92400E' : '#6B7280', fontWeight: 600 }}>
                          {bill.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#FEF2F2', borderTop: '2px solid #FECACA' }}>
                  <td colSpan={4} style={{ padding: '11px 12px', fontWeight: 700, fontSize: 13 }}>TOTAL OUTSTANDING</td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 900, fontSize: 14, color: '#EF4444' }}>{fmt(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Finance sub-tabs config ────────────────────────────────────────────────────

const FINANCE_TABS = [
  { key: 'overview',   label: 'Overview',       icon: Activity },
  { key: 'pl',         label: 'P&L',            icon: FileText },
  { key: 'cashflow',   label: 'Cash Flow',      icon: BarChart3 },
  { key: 'balance',    label: 'Balance Sheet',  icon: Landmark },
  { key: 'gstr1',      label: 'GSTR-1',         icon: Receipt },
  { key: 'gstr3b',     label: 'GSTR-3B',        icon: Receipt },
  { key: 'tds',        label: 'TDS',            icon: FileText },
  { key: 'cashbook',   label: 'Cash Book',      icon: BookOpen },
  { key: 'creditors',  label: 'Creditors',      icon: Clock },
];

// ── Main Reports Page ──────────────────────────────────────────────────────────

export default function Reports() {
  const { isMobile } = useBreakpoint();
  const [section, setSection] = useState('sales');
  const [finTab, setFinTab] = useState('overview');

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={P.h1(isMobile)}>Reports</h1>
        <p style={P.sub}>Sales · P&L · Cash Flow · Balance Sheet · GSTR-1 · GSTR-3B · TDS · Cash Book · Creditors Aging</p>
      </div>

      {/* Top section switcher: Sales | Finance */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'sales',   label: 'Sales Reports',   color: 'var(--cyan)' },
          { key: 'finance', label: 'Finance Reports',  color: '#10B981' },
        ].map(({ key, label, color }) => (
          <button key={key} onClick={() => setSection(key)} style={{
            padding: isMobile ? '9px 16px' : '10px 24px',
            borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: isMobile ? 13 : 14, fontWeight: 700,
            background: section === key ? color : '#F3F4F6',
            color: section === key ? '#fff' : '#6B7280',
            boxShadow: section === key ? `0 2px 8px ${color}44` : 'none',
            transition: 'all 0.15s',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Finance sub-tabs (only shown when finance section is active) */}
      {section === 'finance' && (
        <div className="tabs-row" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4, width: 'fit-content', minWidth: 'max-content' }}>
            {FINANCE_TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setFinTab(key)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: isMobile ? '7px 10px' : '8px 16px',
                borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: isMobile ? 12 : 13, fontWeight: 600, whiteSpace: 'nowrap',
                background: finTab === key ? '#fff' : 'transparent',
                color: finTab === key ? 'var(--navy)' : '#9CA3AF',
                boxShadow: finTab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}>
                <Icon size={isMobile ? 13 : 14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {section === 'sales' && <SalesTab />}
      {section === 'finance' && finTab === 'overview'  && <OverviewTab />}
      {section === 'finance' && finTab === 'pl'        && <PLTab />}
      {section === 'finance' && finTab === 'cashflow'  && <CashFlowTab />}
      {section === 'finance' && finTab === 'balance'   && <BalanceSheetTab />}
      {section === 'finance' && finTab === 'gstr1'      && <GstrTab />}
      {section === 'finance' && finTab === 'gstr3b'     && <Gstr3bTab />}
      {section === 'finance' && finTab === 'tds'        && <TdsTab />}
      {section === 'finance' && finTab === 'cashbook'   && <CashBookTab />}
      {section === 'finance' && finTab === 'creditors'  && <CreditorsAgingTab />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

