import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import KpiBar from '../../components/ui/KpiBar';
import { P } from '../../styles/page';
import { getPayrollRuns, getPayrollRun, processPayroll, markPayrollPaid } from '../../api';
import { Users, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function RunRow({ run, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [paying, setPaying] = useState(false);

  const toggle = async () => {
    if (!expanded && !detail) {
      setLoadingDetail(true);
      try {
        const res = await getPayrollRun(run.id);
        setDetail(res.data.data);
      } catch { toast.error('Failed to load details'); }
      finally { setLoadingDetail(false); }
    }
    setExpanded(x => !x);
  };

  const pay = async () => {
    setPaying(true);
    try { await markPayrollPaid(run.id); toast.success('Payroll marked as paid'); onRefresh(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPaying(false); }
  };

  const statusColor = run.status === 'PAID' ? 'success' : run.status === 'PROCESSED' ? 'info' : 'secondary';

  return (
    <>
      <tr style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={toggle}>
        <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{MONTHS[run.month - 1]} {run.year}</td>
        <td style={{ padding: '12px 16px', fontSize: 13 }}>{run._count?.entries || run.entries?.length || 0} employees</td>
        <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14 }}>{fmt(run.totalNet)}</td>
        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{fmt(run.totalPF)}</td>
        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{fmt(run.totalESI)}</td>
        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{fmt(run.totalPT)}</td>
        <td style={{ padding: '12px 16px' }}><Badge variant={statusColor}>{run.status}</Badge></td>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
            {run.status === 'PROCESSED' && (
              <button onClick={pay} disabled={paying} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--emerald)', color: 'var(--emerald)', background: 'none', cursor: 'pointer', fontWeight: 600 }}>
                <CheckCircle size={12} />{paying ? '…' : 'Mark Paid'}
              </button>
            )}
            {expanded ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: '#F9FAFB' }}>
          <td colSpan={8} style={{ padding: '12px 24px 16px' }}>
            {loadingDetail ? (
              <p style={{ color: '#9CA3AF', fontSize: 13 }}>Loading details…</p>
            ) : (detail?.entries || run.entries)?.length > 0 ? (
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#6B7280' }}>
                    {['Employee', 'Days', 'Basic', 'HRA', 'Allowances', 'Gross', 'PF (EE)', 'ESI (EE)', 'PT', 'Net Pay'].map(h => (
                      <th key={h} style={{ textAlign: h === 'Employee' ? 'left' : 'right', paddingBottom: 6, fontWeight: 600, paddingRight: 8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(detail?.entries || run.entries).map(e => (
                    <tr key={e.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '6px 8px 6px 0', fontWeight: 600 }}>{e.staff?.name || '—'}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px' }}>{e.presentDays}/{e.workingDays}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px' }}>{fmt(e.basicSalary)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px' }}>{fmt(e.hra)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px' }}>{fmt(e.allowances)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>{fmt(e.grossSalary)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px', color: '#6B7280' }}>{fmt(e.pfEmployee)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px', color: '#6B7280' }}>{fmt(e.esiEmployee)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px', color: '#6B7280' }}>{fmt(e.professionalTax)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 800, color: 'var(--navy)' }}>{fmt(e.netSalary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#9CA3AF', fontSize: 13 }}>No employee entries</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function ProcessModal({ onClose, onDone }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await processPayroll(Number(month), Number(year));
      toast.success(`Payroll for ${MONTHS[month - 1]} ${year} processed — ${res.data.data?.entries?.length || 0} employees`);
      onDone();
    } catch (err) { toast.error(err.response?.data?.message || 'Processing failed'); }
    finally { setLoading(false); }
  };

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 20 }}>Process Payroll</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#FEF3C7', borderRadius: 8, padding: 12, fontSize: 13, color: '#92400E' }}>
            This will calculate salaries based on attendance records, apply PF (12%), ESI (0.75% EE / 3.25% ER), and PT deductions for all active staff.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Month</label>
              <select value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Year</label>
              <select value={year} onChange={e => setYear(e.target.value)} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Process Payroll</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Payroll() {
  const { isMobile } = useBreakpoint();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProcess, setShowProcess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPayrollRuns();
      setRuns(res.data.data || []);
    } catch { toast.error('Failed to load payroll'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalPaid = runs.filter(r => r.status === 'PAID').reduce((s, r) => s + Number(r.totalNet || 0), 0);
  const totalPending = runs.filter(r => r.status !== 'PAID').reduce((s, r) => s + Number(r.totalNet || 0), 0);
  const totalDeductions = runs.reduce((s, r) => s + Number(r.totalDeductions || 0), 0);

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1100, margin: '0 auto' }}>
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Payroll</h1>
          <p style={P.sub}>PF, ESI, PT calculations with pro-rata attendance</p>
        </div>
        <Button onClick={() => setShowProcess(true)}><Users size={16} style={{ marginRight: 6 }} />Process Payroll</Button>
      </div>

      <KpiBar stats={[
        { label: 'Total Paid (All Time)', value: fmt(totalPaid),                  color: 'var(--emerald)' },
        { label: 'Pending Payment',       value: fmt(totalPending),               color: '#F59E0B'        },
        { label: 'Total Deductions',      value: fmt(totalDeductions),            color: 'var(--navy)'    },
        { label: 'Net Payroll',           value: fmt(totalPaid + totalPending),   color: 'var(--cyan)'    },
      ]} />

      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#1E40AF', marginBottom: 20 }}>
        <strong>Statutory Deductions (India):</strong> PF — 12% of basic (capped at ₹15,000 basic wage) · ESI — 0.75% employee + 3.25% employer (if gross ≤ ₹21,000) · PT — ₹200/month (if gross &gt; ₹15,000)
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>Payroll History</div>
        {loading ? (
          <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading…</p>
        ) : (
          <div style={P.tableScroll}>
          <table style={P.table}>
            <thead style={P.thead}>
              <tr>
                {['Period', 'Employees', 'Net Pay', 'PF (EE)', 'ESI (EE)', 'PT', 'Status', 'Actions'].map(h => (
                  <th key={h} style={P.th()}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map(r => <RunRow key={r.id} run={r} onRefresh={load} />)}
              {runs.length === 0 && (
                <tr><td colSpan={8} style={P.empty}>
                  <Users size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                  No payroll runs yet. Process your first payroll.
                </td></tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </Card>

      {showProcess && <ProcessModal onClose={() => setShowProcess(false)} onDone={() => { setShowProcess(false); load(); }} />}
    </div>
  );
}

