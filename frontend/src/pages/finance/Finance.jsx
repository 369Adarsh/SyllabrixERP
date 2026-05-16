import { useState, useEffect, useCallback } from 'react';
import { getProfitLoss, getCashFlow, getGstr1 } from '../../api';
import { TrendingUp, TrendingDown, Download, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TABS = ['P&L Report', 'Cash Flow', 'GSTR-1'];

function PLReport() {
  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-04-01`);
  const [to, setTo] = useState(now.toISOString().split('T')[0]);
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

  const revenue = data ? (
    Number(data.posRevenue || 0) +
    Number(data.invoiceRevenue || 0) +
    Number(data.feeRevenue || 0) +
    Number(data.leaseRevenue || 0)
  ) : 0;

  const expenses = data ? (
    Number(data.expenses || 0) +
    Number(data.billPayments || 0) +
    Number(data.payroll || 0)
  ) : 0;

  const profit = revenue - expenses;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>FROM</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>TO</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
        </div>
        <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading…</p>
      ) : data ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            <Card style={{ borderLeft: '4px solid var(--emerald)' }}>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Revenue</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--emerald)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{fmt(revenue)}</div>
            </Card>
            <Card style={{ borderLeft: '4px solid var(--vermilion)' }}>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Expenses</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--vermilion)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{fmt(expenses)}</div>
            </Card>
            <Card style={{ borderLeft: `4px solid ${profit >= 0 ? 'var(--navy)' : 'var(--vermilion)'}` }}>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Net Profit / Loss</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {profit >= 0 ? <TrendingUp size={20} color="var(--emerald)" /> : <TrendingDown size={20} color="var(--vermilion)" />}
                <span style={{ fontSize: 28, fontWeight: 800, color: profit >= 0 ? 'var(--navy)' : 'var(--vermilion)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{fmt(Math.abs(profit))}</span>
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 16 }}>Revenue Breakdown</h3>
              {[
                { label: 'POS / Retail Sales', value: data.posRevenue },
                { label: 'Invoice Collections', value: data.invoiceRevenue },
                { label: 'Fee Collections', value: data.feeRevenue },
                { label: 'Lease / Rent', value: data.leaseRevenue },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  <span style={{ color: '#6B7280' }}>{label}</span>
                  <strong style={{ color: 'var(--emerald)' }}>{fmt(value)}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 15, fontWeight: 700 }}>
                <span>Total Revenue</span><span style={{ color: 'var(--emerald)' }}>{fmt(revenue)}</span>
              </div>
            </Card>
            <Card>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 16 }}>Expense Breakdown</h3>
              {[
                { label: 'Operating Expenses', value: data.expenses },
                { label: 'Vendor Bill Payments', value: data.billPayments },
                { label: 'Payroll & Salaries', value: data.payroll },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  <span style={{ color: '#6B7280' }}>{label}</span>
                  <strong style={{ color: 'var(--vermilion)' }}>{fmt(value)}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 15, fontWeight: 700 }}>
                <span>Total Expenses</span><span style={{ color: 'var(--vermilion)' }}>{fmt(expenses)}</span>
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function CashFlowReport() {
  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  const [to, setTo] = useState(now.toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState('day');
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

  const inflow = data?.inflows?.reduce((s, i) => s + Number(i.total || 0), 0) || 0;
  const outflow = data?.outflows?.reduce((s, o) => s + Number(o.total || 0), 0) || 0;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {[
          { label: 'FROM', val: from, set: setFrom, type: 'date' },
          { label: 'TO', val: to, set: setTo, type: 'date' },
        ].map(({ label, val, set, type }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{label}</label>
            <input type={type} value={val} onChange={e => set(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>GROUP BY</label>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
            <option value="day">Day</option>
            <option value="month">Month</option>
          </select>
        </div>
        <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading…</p>
      ) : data ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            <Card><div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Inflow</div><div style={{ fontSize: 26, fontWeight: 800, color: 'var(--emerald)', fontFamily: 'var(--font-display)' }}>{fmt(inflow)}</div></Card>
            <Card><div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Outflow</div><div style={{ fontSize: 26, fontWeight: 800, color: 'var(--vermilion)', fontFamily: 'var(--font-display)' }}>{fmt(outflow)}</div></Card>
            <Card><div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Net Cash Flow</div><div style={{ fontSize: 26, fontWeight: 800, color: inflow - outflow >= 0 ? 'var(--navy)' : 'var(--vermilion)', fontFamily: 'var(--font-display)' }}>{fmt(inflow - outflow)}</div></Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 12 }}>Cash Inflows</h3>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead><tr><th style={{ textAlign: 'left', paddingBottom: 8, color: '#9CA3AF', fontWeight: 600 }}>Period</th><th style={{ textAlign: 'right', paddingBottom: 8, color: '#9CA3AF', fontWeight: 600 }}>Amount</th></tr></thead>
                <tbody>
                  {(data.inflows || []).slice(0, 15).map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', color: '#6B7280' }}>{row.period}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600, color: 'var(--emerald)' }}>{fmt(row.total)}</td>
                    </tr>
                  ))}
                  {!data.inflows?.length && <tr><td colSpan={2} style={{ textAlign: 'center', padding: 24, color: '#9CA3AF' }}>No data</td></tr>}
                </tbody>
              </table>
            </Card>
            <Card>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 12 }}>Cash Outflows</h3>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead><tr><th style={{ textAlign: 'left', paddingBottom: 8, color: '#9CA3AF', fontWeight: 600 }}>Period</th><th style={{ textAlign: 'right', paddingBottom: 8, color: '#9CA3AF', fontWeight: 600 }}>Amount</th></tr></thead>
                <tbody>
                  {(data.outflows || []).slice(0, 15).map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', color: '#6B7280' }}>{row.period}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600, color: 'var(--vermilion)' }}>{fmt(row.total)}</td>
                    </tr>
                  ))}
                  {!data.outflows?.length && <tr><td colSpan={2} style={{ textAlign: 'center', padding: 24, color: '#9CA3AF' }}>No data</td></tr>}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Gstr1Report() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const load = async () => {
    setLoading(true);
    try {
      const res = await getGstr1({ month, year });
      setData(res.data.data);
    } catch { toast.error('Failed to load GSTR-1'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [month, year]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Type', 'Invoice #', 'Date', 'Customer', 'GSTIN', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total'],
      ...(data.b2b || []).map(r => ['B2B', r.invoiceNumber, r.date, r.customerName, r.gstin, r.taxable, r.cgst, r.sgst, r.igst, r.total]),
      ...(data.b2c || []).map(r => ['B2C', r.invoiceNumber, r.date, r.customerName, '', r.taxable, r.cgst, r.sgst, r.igst, r.total]),
    ];
    const csv = rows.map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${MONTHS[month - 1]}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalTaxable = [...(data?.b2b || []), ...(data?.b2c || [])].reduce((s, r) => s + Number(r.taxable || 0), 0);
  const totalTax = [...(data?.b2b || []), ...(data?.b2c || [])].reduce((s, r) => s + Number(r.cgst || 0) + Number(r.sgst || 0) + Number(r.igst || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>MONTH</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>YEAR</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
            {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          <RefreshCw size={14} />Load
        </button>
        {data && (
          <button onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid var(--emerald)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--emerald)' }}>
            <Download size={14} />Export CSV
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading…</p>
      ) : data ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'B2B Invoices', value: data.b2b?.length || 0, color: 'var(--navy)' },
              { label: 'B2C Invoices', value: data.b2c?.length || 0, color: '#6B7280' },
              { label: 'Total Taxable Value', value: fmt(totalTaxable), color: 'var(--navy)' },
              { label: 'Total Tax', value: fmt(totalTax), color: 'var(--emerald)' },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
              </Card>
            ))}
          </div>

          {['b2b', 'b2c'].map(type => (
            <Card key={type} style={{ marginBottom: 20, padding: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
                {type === 'b2b' ? 'B2B — Business to Business (GST Registered Customers)' : 'B2C — Business to Consumer'}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Invoice #', 'Date', 'Customer', ...(type === 'b2b' ? ['GSTIN'] : []), 'Taxable', 'CGST', 'SGST', 'IGST', 'Total'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data[type] || []).map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{row.invoiceNumber}</td>
                      <td style={{ padding: '9px 12px', fontSize: 13, color: '#6B7280' }}>{row.date}</td>
                      <td style={{ padding: '9px 12px', fontSize: 13 }}>{row.customerName}</td>
                      {type === 'b2b' && <td style={{ padding: '9px 12px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{row.gstin}</td>}
                      <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right' }}>{fmt(row.taxable)}</td>
                      <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', color: '#6B7280' }}>{fmt(row.cgst)}</td>
                      <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', color: '#6B7280' }}>{fmt(row.sgst)}</td>
                      <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', color: '#6B7280' }}>{fmt(row.igst)}</td>
                      <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', fontWeight: 700 }}>{fmt(row.total)}</td>
                    </tr>
                  ))}
                  {!data[type]?.length && <tr><td colSpan={type === 'b2b' ? 9 : 8} style={{ textAlign: 'center', padding: 24, color: '#9CA3AF', fontSize: 13 }}>No {type.toUpperCase()} invoices this period</td></tr>}
                </tbody>
              </table>
            </Card>
          ))}
        </>
      ) : null}
    </div>
  );
}

export default function Finance() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Finance Reports</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>P&amp;L Statement · Cash Flow · GSTR-1 Export</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#F3F4F6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
            background: tab === i ? '#fff' : 'transparent',
            color: tab === i ? 'var(--navy)' : '#9CA3AF',
            boxShadow: tab === i ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && <PLReport />}
      {tab === 1 && <CashFlowReport />}
      {tab === 2 && <Gstr1Report />}
    </div>
  );
}
