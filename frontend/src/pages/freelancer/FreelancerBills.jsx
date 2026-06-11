import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pendingPayments, jobsReport } from '../../api/freelancer';
import toast from 'react-hot-toast';

const OR = '#F97316';
const TEXT = '#F3F4F6';
const MUTED = '#9CA3AF';
const CARD = '#161616';
const BORDER = '#222';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function FreelancerBills() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([pendingPayments(), jobsReport()])
      .then(([p, r]) => { setPending(p.data); setReport(r.data); })
      .catch(() => toast.error('Could not load data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 2 }}>Bills & Invoices</h1>
        <p style={{ fontSize: 13, color: MUTED }}>Track what's owed to you</p>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#111', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ key: 'pending', label: 'Pending Payments' }, { key: 'report', label: 'Job Report' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t.key ? CARD : 'transparent', color: tab === t.key ? OR : MUTED }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: MUTED, fontSize: 14 }}>Loading…</div>
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#4ADE80', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>All clear! 🎉</p>
            <p style={{ color: MUTED, fontSize: 13 }}>No pending payments right now</p>
          </div>
        ) : (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Outstanding Amount</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#FBBF24' }}>
                {fmt(pending.reduce((s, j) => s + j.pendingAmount, 0))}
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Job', 'Customer', 'Job Value', 'Received', 'Balance'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: MUTED }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map((j, i) => (
                  <tr
                    key={j.id}
                    style={{ borderBottom: i < pending.length - 1 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer' }}
                    onClick={() => navigate(`/freelancer/jobs/${j.id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: OR }}>{j.jobNumber}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: TEXT }}>{j.customerName}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: MUTED }}>{fmt(j.jobValue)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#4ADE80' }}>{fmt(j.paidAmount)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#FBBF24' }}>{fmt(j.pendingAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        report.length === 0 ? (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '40px', textAlign: 'center' }}>
            <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>No jobs yet</p>
          </div>
        ) : (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Job', 'Customer', 'Value', 'Received', 'Mat Cost', 'Profit', 'Margin'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: MUTED, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.map((j, i) => (
                    <tr
                      key={j.id}
                      style={{ borderBottom: i < report.length - 1 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer' }}
                      onClick={() => navigate(`/freelancer/jobs/${j.id}`)}
                      onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: OR, whiteSpace: 'nowrap' }}>{j.jobNumber}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: TEXT }}>{j.customerName}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: MUTED }}>{fmt(j.jobValue)}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: '#4ADE80' }}>{fmt(j.received)}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: '#F87171' }}>{fmt(j.matCost)}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: j.profit >= 0 ? '#4ADE80' : '#F87171' }}>{fmt(j.profit)}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: j.margin >= 30 ? '#4ADE80' : '#FBBF24' }}>{j.margin}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
