import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import { getMemberReceipts, getMemberReceiptsSummary, backfillMemberReceipts, updateReceiptPayment } from '../../api';
import { ReceiptText, Search, Printer, MessageCircle, RefreshCw } from 'lucide-react';
import KpiBar from '../../components/ui/KpiBar';
import toast from 'react-hot-toast';

const fmtD = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtAmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const METHOD_COLORS = {
  CASH:  { bg: '#F0FDF4', color: '#059669' },
  UPI:   { bg: '#EFF6FF', color: '#2563EB' },
  CARD:  { bg: '#F5F3FF', color: '#7C3AED' },
  LATER: { bg: '#FFFBEB', color: '#D97706' },
};

const TODAY = new Date().toISOString().slice(0, 10);
const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const PRESETS = [
  { label: 'Today',      from: TODAY,           to: TODAY },
  { label: 'This Week',  from: (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10); })(), to: TODAY },
  { label: 'This Month', from: startOfMonth(),  to: TODAY },
  { label: 'Custom',     from: null,            to: null },
];

function PrintReceipt({ r, tenantName }) {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt</title>
<style>body{font-family:Arial,sans-serif;max-width:320px;margin:20px auto;padding:20px;color:#111}
.gym{font-size:20px;font-weight:700;color:#1B3A6B;text-align:center}.sub{font-size:13px;color:#6B7280;text-align:center;margin:4px 0 16px}
hr{border:none;border-top:1px dashed #D1D5DB;margin:12px 0}.row{display:flex;justify-content:space-between;margin-bottom:7px;font-size:13px}
.lbl{color:#6B7280}.val{font-weight:600;text-align:right}
.total{display:flex;justify-content:space-between;padding-top:10px;border-top:2px solid #1B3A6B;margin-top:4px}
.tl{font-size:15px;font-weight:700;color:#1B3A6B}.tv{font-size:18px;font-weight:700;color:#059669}
.footer{text-align:center;margin-top:18px;font-size:12px;color:#9CA3AF}
.rno{text-align:center;font-size:10px;color:#D1D5DB;margin-top:6px}</style></head><body>
<div class="gym">${tenantName}</div><div class="sub">Membership Receipt</div><hr>
<div class="row"><span class="lbl">Member</span><span class="val">${r.memberName}</span></div>
<div class="row"><span class="lbl">Phone</span><span class="val">${r.memberPhone}</span></div><hr>
<div class="row"><span class="lbl">Plan</span><span class="val">${r.planName}</span></div>
<div class="row"><span class="lbl">Duration</span><span class="val">${r.planDuration} days</span></div>
<div class="row"><span class="lbl">Start</span><span class="val">${fmtD(r.startDate)}</span></div>
<div class="row"><span class="lbl">Expires</span><span class="val">${fmtD(r.expiryDate)}</span></div><hr>
${r.discountAmount > 0 ? `<div class="row"><span class="lbl">Original</span><span class="val">${fmtAmt(r.originalAmount)}</span></div><div class="row"><span class="lbl">Discount</span><span class="val">${r.discountNote}</span></div>` : ''}
<div class="total"><span class="tl">${r.paymentMethod === 'LATER' ? 'Amount Due' : 'Amount Paid'}</span><span class="tv">${fmtAmt(r.finalAmount)}</span></div>
<div class="row" style="margin-top:8px"><span class="lbl">Payment</span><span class="val">${r.paymentMethod === 'LATER' ? 'Pending' : r.paymentMethod}</span></div>
<div class="row"><span class="lbl">Date</span><span class="val">${fmtD(r.createdAt)}</span></div>
<div class="footer">Thank you for joining!</div><div class="rno">${r.receiptNo}</div>
</body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

export default function Receipts() {
  const { isMobile } = useBreakpoint();
  const [receipts, setReceipts] = useState([]);
  const [summary, setSummary] = useState({ CASH: 0, UPI: 0, CARD: 0, LATER: 0, total: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState(0); // index into PRESETS
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [backfilling, setBackfilling] = useState(false);

  const isCustom = preset === 3;
  const from = isCustom ? customFrom : PRESETS[preset].from;
  const to   = isCustom ? customTo   : PRESETS[preset].to;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { paymentMethod: methodFilter };
      if (from) params.from = from;
      if (to)   params.to   = to;
      const [rRes, sRes] = await Promise.all([
        getMemberReceipts(params),
        getMemberReceiptsSummary({ from, to }),
      ]);
      setReceipts(rRes.data.receipts || []);
      setSummary(sRes.data.data || summary);
    } catch {
      toast.error('Failed to load receipts');
    } finally { setLoading(false); }
  }, [from, to, methodFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = receipts.filter((r) =>
    !search || r.memberName.toLowerCase().includes(search.toLowerCase()) || r.receiptNo.toLowerCase().includes(search.toLowerCase())
  );

  const sendWhatsApp = (r, tenantName) => {
    const lines = [
      `*${tenantName} — Membership Receipt*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*Member:* ${r.memberName}`,
      `*Plan:* ${r.planName} (${r.planDuration} days)`,
      `*Valid:* ${fmtD(r.startDate)} → ${fmtD(r.expiryDate)}`,
      ``,
      r.discountAmount > 0 ? `*Original:* ${fmtAmt(r.originalAmount)}` : null,
      r.discountAmount > 0 ? `*Discount:* ${r.discountNote}` : null,
      `*Amount ${r.paymentMethod === 'LATER' ? 'Due' : 'Paid'}:* ${fmtAmt(r.finalAmount)}`,
      `*Payment:* ${r.paymentMethod === 'LATER' ? 'Pending' : r.paymentMethod}`,
      `*Date:* ${fmtD(r.createdAt)}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `Thank you for joining! 💪`,
    ].filter(Boolean).join('\n');
    const phone = (r.memberPhone || '').replace(/\D/g, '');
    const waPhone = phone.startsWith('91') ? phone : `91${phone}`;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(lines)}`, '_blank');
  };

  return (
    <div style={{ ...P.wrap(isMobile), paddingBottom: 80, maxWidth: 1100, margin: '0 auto' }}>

      {/* Page header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Receipts</h1>
          <p style={P.sub}>All member payment receipts — filter by date or payment method</p>
        </div>
        <button
          onClick={async () => {
            setBackfilling(true);
            try {
              const res = await backfillMemberReceipts();
              const created = res.data.created;
              toast.success(created > 0 ? `${created} receipt${created !== 1 ? 's' : ''} imported from existing subscriptions` : 'All subscriptions already have receipts');
              load();
            } catch { toast.error('Backfill failed'); }
            finally { setBackfilling(false); }
          }}
          disabled={backfilling}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--ink)' }}
        >
          <RefreshCw size={14} style={{ animation: backfilling ? 'spin 1s linear infinite' : 'none' }} />
          {backfilling ? 'Importing…' : 'Import Existing'}
        </button>
      </div>

      {/* Summary KPIs */}
      <KpiBar stats={[
        { label: 'Total Collected', value: fmtAmt(summary.total) },
        { label: 'Cash',  value: fmtAmt(summary.CASH)  },
        { label: 'UPI',   value: fmtAmt(summary.UPI)   },
        { label: 'Card',  value: fmtAmt(summary.CARD)  },
        { label: 'Pending',  value: fmtAmt(summary.LATER), },
        { label: 'Total Receipts', value: summary.totalCount },
      ]} />

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '16px 18px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>

        {/* Date presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Period</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => setPreset(i)}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${preset === i ? 'var(--navy)' : 'var(--border)'}`,
                  background: preset === i ? 'var(--navy)' : '#fff',
                  color: preset === i ? '#fff' : 'var(--ink)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date range */}
        {isCustom && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>From</label>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>To</label>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
            </div>
          </div>
        )}

        {/* Payment method filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Payment</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'CASH', 'UPI', 'CARD', 'LATER'].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${methodFilter === m ? 'var(--navy)' : 'var(--border)'}`,
                  background: methodFilter === m ? 'var(--navy)' : '#fff',
                  color: methodFilter === m ? '#fff' : 'var(--ink)',
                }}
              >
                {m === 'LATER' ? 'Pending' : m === 'ALL' ? 'All' : m}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              placeholder="Member name or receipt no…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: 14 }}>Loading receipts…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 16, border: '1px dashed var(--border)' }}>
          <ReceiptText size={40} color="#D1D5DB" style={{ marginBottom: 14 }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--navy)', marginBottom: 6 }}>No receipts found</h3>
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>Receipts are generated automatically when a member is registered with a plan.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                {['Receipt No', 'Member', 'Plan', 'Original', 'Discount', 'Final Amount', 'Payment', 'Date', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const mc = METHOD_COLORS[r.paymentMethod] || METHOD_COLORS.LATER;
                return (
                  <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--navy)', fontWeight: 600 }}>{r.receiptNo}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.memberName}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.memberPhone}</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--ink)' }}>{r.planName} <span style={{ color: '#9CA3AF', fontSize: 11 }}>· {r.planDuration}d</span></td>
                    <td style={{ padding: '10px 14px', color: r.discountAmount > 0 ? '#9CA3AF' : 'var(--ink)', textDecoration: r.discountAmount > 0 ? 'line-through' : 'none' }}>{fmtAmt(r.originalAmount)}</td>
                    <td style={{ padding: '10px 14px', color: '#D97706', fontWeight: r.discountAmount > 0 ? 600 : 400 }}>{r.discountAmount > 0 ? r.discountNote : '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: r.paymentMethod === 'LATER' ? '#D97706' : '#059669', fontSize: 14 }}>{fmtAmt(r.finalAmount)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <select
                        value={r.paymentMethod}
                        onChange={async (e) => {
                          const newMethod = e.target.value;
                          try {
                            await updateReceiptPayment(r.id, newMethod);
                            toast.success('Payment method updated');
                            load();
                          } catch { toast.error('Failed to update'); }
                        }}
                        style={{
                          padding: '4px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          border: `1.5px solid ${mc.color}`, background: mc.bg, color: mc.color, outline: 'none',
                        }}
                      >
                        <option value="CASH">CASH</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">CARD</option>
                        <option value="LATER">Pending</option>
                      </select>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtD(r.createdAt)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => PrintReceipt({ r, tenantName: 'Gym' })}
                          title="Print"
                          style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: '#374151' }}
                        >
                          <Printer size={13} />
                        </button>
                        <button
                          onClick={() => sendWhatsApp(r, 'Gym')}
                          title="Send via WhatsApp"
                          style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid #BBF7D0', background: '#F0FDF4', cursor: 'pointer', color: '#059669' }}
                        >
                          <MessageCircle size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: '#6B7280', textAlign: 'right' }}>
            {filtered.length} receipt{filtered.length !== 1 ? 's' : ''} · Total collected: <strong style={{ color: '#059669' }}>{fmtAmt(summary.total)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
