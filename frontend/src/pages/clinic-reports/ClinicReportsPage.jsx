import { useState, useEffect } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import toast from 'react-hot-toast';
import { BarChart3, TrendingUp, Users, Stethoscope, Activity, Calendar } from 'lucide-react';

const api = (path, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`/api/v1${path}${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  }).then((r) => r.json());
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ flex: 1, height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
    </div>
  );
}

export default function ClinicReportsPage() {
  const isMobile = useBreakpoint();
  const [activeReport, setActiveReport] = useState('opd-trend');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const loadReport = async (report) => {
    setLoading(true);
    setActiveReport(report);
    try {
      let result;
      switch (report) {
        case 'opd-trend':       result = await api('/clinic-reports/opd-trend'); break;
        case 'daily-opd':       result = await api('/clinic-reports/daily-opd', { date: selectedDate }); break;
        case 'monthly-revenue': result = await api('/clinic-reports/monthly-revenue'); break;
        case 'patient-growth':  result = await api('/clinic-reports/patient-growth'); break;
        case 'diagnosis-freq':  result = await api('/clinic-reports/diagnosis-freq'); break;
        case 'doctor-perf':     result = await api('/clinic-reports/doctor-performance'); break;
        default: result = [];
      }
      setData((prev) => ({ ...prev, [report]: result }));
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReport('opd-trend'); }, []);

  const REPORTS = [
    { key: 'opd-trend',       label: 'OPD Trend',         icon: Activity },
    { key: 'daily-opd',       label: 'Daily OPD',         icon: Calendar },
    { key: 'monthly-revenue', label: 'Monthly Revenue',   icon: TrendingUp },
    { key: 'patient-growth',  label: 'Patient Growth',    icon: Users },
    { key: 'diagnosis-freq',  label: 'Diagnosis Freq.',   icon: Stethoscope },
    { key: 'doctor-perf',     label: 'Doctor Performance',icon: BarChart3 },
  ];

  return (
    <div style={P.wrap(isMobile)}>
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Clinic Reports</h1>
          <p style={P.sub}>Module 13 — OPD trends, revenue, patient growth, diagnosis insights</p>
        </div>
      </div>

      {/* Report selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {REPORTS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => loadReport(key)} style={{
            ...P.btn(activeReport === key ? 'primary' : 'secondary'),
            fontSize: 12, padding: '7px 14px',
          }}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Date picker for daily OPD */}
      {activeReport === 'daily-opd' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input type="date" style={P.input} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <button style={P.btn('primary')} onClick={() => loadReport('daily-opd')}>Load</button>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading report…</div>}

      {/* ── OPD Trend ──────────────────────────────────────────────────────────── */}
      {!loading && activeReport === 'opd-trend' && (() => {
        const d = data['opd-trend'] || [];
        const max = Math.max(...d.map((r) => r.total), 1);
        return (
          <div style={P.card}>
            <div style={{ ...P.sectionTitle, marginBottom: 16 }}>Daily OPD — Last 30 Days</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {d.slice(-14).map((row) => (
                <div key={row.date} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7280', width: 60 }}>{fmtDate(row.date)}</span>
                  <MiniBar value={row.completed} max={max} color="#059669" />
                  <MiniBar value={row.noShow} max={max} color="#DC2626" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, width: 20, textAlign: 'right' }}>{row.total}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              {[{ color: '#059669', label: 'Completed' }, { color: '#DC2626', label: 'No-show' }].map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B7280' }}>
                  <div style={{ width: 10, height: 10, background: l.color, borderRadius: 2 }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Daily OPD Summary ──────────────────────────────────────────────────── */}
      {!loading && activeReport === 'daily-opd' && (() => {
        const d = data['daily-opd'];
        if (!d) return null;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Tokens', value: d.totalTokens, color: 'var(--navy)' },
              { label: 'Completed', value: d.completed, color: '#059669' },
              { label: 'No-Show', value: d.noShow, color: '#DC2626' },
              { label: 'Collection', value: fmt(d.totalCollection), color: '#2563EB' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ ...P.card, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontFamily: 'var(--font-mono)', fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{label}</div>
              </div>
            ))}
            {d.totalTokens > 0 && (
              <div style={{ ...P.card, gridColumn: '1 / -1', display: 'flex', gap: 20 }}>
                <div style={{ fontSize: 13, color: '#374151' }}>No-show rate: <strong style={{ color: '#DC2626' }}>{d.noShowRate}%</strong></div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Monthly Revenue ────────────────────────────────────────────────────── */}
      {!loading && activeReport === 'monthly-revenue' && (() => {
        const d = data['monthly-revenue'] || [];
        const max = Math.max(...d.map((r) => r.revenue), 1);
        return (
          <div style={P.card}>
            <div style={{ ...P.sectionTitle, marginBottom: 16 }}>Monthly Revenue — Last 12 Months</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {d.map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7280', width: 48 }}>{row.label}</span>
                  <div style={{ flex: 1, height: 20, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${(row.revenue / max) * 100}%`, height: '100%', background: 'var(--cyan)', borderRadius: 4, transition: 'width 0.4s ease' }} />
                    <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 10, fontFamily: 'var(--font-mono)', color: '#374151', fontWeight: 700 }}>
                      {row.bills} bills
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--cyan)', width: 80, textAlign: 'right' }}>{fmt(row.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Patient Growth ─────────────────────────────────────────────────────── */}
      {!loading && activeReport === 'patient-growth' && (() => {
        const d = data['patient-growth'] || [];
        const max = Math.max(...d.map((r) => r.count), 1);
        return (
          <div style={P.card}>
            <div style={{ ...P.sectionTitle, marginBottom: 16 }}>New Patient Registrations — Last 12 Months</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {d.map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7280', width: 48 }}>{row.label}</span>
                  <div style={{ flex: 1, height: 18, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(row.count / max) * 100}%`, height: '100%', background: '#059669', borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#059669', width: 32, textAlign: 'right' }}>{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Diagnosis Frequency ────────────────────────────────────────────────── */}
      {!loading && activeReport === 'diagnosis-freq' && (() => {
        const d = data['diagnosis-freq'] || [];
        const max = Math.max(...d.map((r) => r.count), 1);
        return (
          <div style={P.card}>
            <div style={{ ...P.sectionTitle, marginBottom: 4 }}>Top Diagnoses (last 500 notes)</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>Based on text frequency in Assessment (SOAP-A) field</div>
            {d.length === 0 ? <div style={{ textAlign: 'center', padding: 30, color: '#9CA3AF' }}>No clinical notes with diagnoses yet</div> :
              d.map((row, i) => (
                <div key={row.diagnosis} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#9CA3AF', width: 18, textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink)', flex: 1, textTransform: 'capitalize' }}>{row.diagnosis}</span>
                  <MiniBar value={row.count} max={max} color="#7C3AED" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#7C3AED', width: 24, textAlign: 'right' }}>{row.count}</span>
                </div>
              ))}
          </div>
        );
      })()}

      {/* ── Doctor Performance ─────────────────────────────────────────────────── */}
      {!loading && activeReport === 'doctor-perf' && (() => {
        const d = data['doctor-perf'] || [];
        return (
          <div style={P.tableWrap}>
            <div style={P.tableScroll}>
              <table style={P.table}>
                <thead style={P.thead}>
                  <tr>
                    <th style={P.th()}>Doctor</th>
                    <th style={P.th('right')}>Patients (30d)</th>
                    <th style={P.th('right')}>Revenue</th>
                    <th style={P.th('right')}>Avg Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {d.length === 0 ? <tr><td colSpan={4} style={P.empty}>No billing data for last 30 days</td></tr> :
                    d.map((row, i) => (
                      <tr key={row.doctor} style={P.tr(i, d.length)}>
                        <td style={P.td()}><div style={{ fontWeight: 600, fontSize: 13 }}>Dr. {row.doctor}</div></td>
                        <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{row.patients}</td>
                        <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#059669' }}>{fmt(row.revenue)}</td>
                        <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', color: '#6B7280' }}>{fmt(row.avgBill)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
