import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pendingPayments, jobsReport } from '../../api/freelancer';
import toast from 'react-hot-toast';

const WA_GREEN = '#25D366';
function WABtn({ phone, text }) {
  if (!phone) return null;
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (p.length === 10) p = '91' + p;
  const link = `https://wa.me/${p}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: `${WA_GREEN}18`, border: `1px solid ${WA_GREEN}50`, borderRadius: 6, color: WA_GREEN, fontSize: 11, fontWeight: 600, textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill={WA_GREEN}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      Remind
    </a>
  );
}

const OR = '#f97316';
const TEXT = '#f1f5f9';
const MUTED = '#64748b';
const CARD = '#141414';
const BORDER = '#1e1e1e';

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
                  {['Job', 'Customer', 'Job Value', 'Received', 'Balance', ''].map(h => (
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
                    <td style={{ padding: '12px 16px' }}>
                      <WABtn phone={j.customerPhone}
                        text={`Hi ${j.customerName}, this is a gentle reminder for payment of *${fmt(j.pendingAmount)}* pending for job *${j.jobNumber}*. Please make the payment at your convenience. Thank you! 🙏`} />
                    </td>
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
