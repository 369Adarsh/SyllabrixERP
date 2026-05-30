import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Printer, MessageCircle } from 'lucide-react';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d || Date.now()).toLocaleString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

function buildGstSummary(items, isGstRegistered) {
  if (!isGstRegistered) return [];
  const slabs = {};
  for (const item of items || []) {
    const rate = item.gstRate || 0;
    if (rate === 0) continue;
    if (!slabs[rate]) slabs[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    const taxable = (item.total || 0) - (item.taxAmount || 0);
    slabs[rate].taxable += taxable;
    slabs[rate].cgst += item.cgst || 0;
    slabs[rate].sgst += item.sgst || 0;
    slabs[rate].igst += item.igst || 0;
  }
  return Object.entries(slabs).map(([rate, v]) => ({ rate: Number(rate), ...v }));
}

export default function POSReceipt({ receipt, onClose, onNewSale }) {
  const { tenant } = useAuth();
  const printRef = useRef(null);
  const [walkinPhone, setWalkinPhone] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const rc = tenant?.receiptConfig || {};
  const isGstRegistered = !!tenant?.gstin;
  const docTitle = isGstRegistered ? 'TAX INVOICE' : 'BILL OF SUPPLY';

  // Aggregated GST totals across all items
  const totalCgst = (receipt.items || []).reduce((s, i) => s + (i.cgst || 0), 0);
  const totalSgst = (receipt.items || []).reduce((s, i) => s + (i.sgst || 0), 0);
  const totalIgst = (receipt.items || []).reduce((s, i) => s + (i.igst || 0), 0);
  const taxable = (receipt.total || 0) - (receipt.taxAmount || 0) + (receipt.discountAmount || 0);
  const gstSummary = buildGstSummary(receipt.items, isGstRegistered);
  const hasAnyGst = isGstRegistered && (receipt.taxAmount || 0) > 0;

  const buildReceiptText = () => {
    const DIV = '─────────────────────────';
    const BOLD_DIV = '━━━━━━━━━━━━━━━━━━━━━━━━━';
    const lines = [];

    // Header
    lines.push(BOLD_DIV);
    lines.push(`🏪 *${(tenant?.name || 'STORE').toUpperCase()}*`);
    if (receipt.branch?.name) lines.push(`📍 Branch: ${receipt.branch.name}`);
    if (tenant?.address) lines.push(tenant.address);
    if (tenant?.phone) lines.push(`📞 ${tenant.phone}`);
    if (tenant?.gstin) lines.push(`GSTIN: ${tenant.gstin}`);
    lines.push(BOLD_DIV);

    // Document type + receipt info
    lines.push(`📋 *${docTitle}*`);
    lines.push(`Bill#: *${receipt.receiptNumber}*`);
    lines.push(`Date: ${fmtDate(receipt.createdAt)}`);
    if (receipt.customer) {
      const cust = receipt.customer;
      const custLine = `Customer: ${cust.name}${cust.phone ? ` · ${cust.phone}` : ''}`;
      lines.push(custLine);
      if (cust.gstin) lines.push(`Buyer GSTIN: ${cust.gstin}`);
    }

    // Items
    lines.push(DIV);
    lines.push(`*ITEMS*`);
    lines.push(DIV);
    (receipt.items || []).forEach(i => {
      lines.push(`*${i.name}*${i.hsnCode ? ` _(HSN: ${i.hsnCode})_` : ''}`);
      lines.push(`  ${i.quantity} × ${fmt(i.unitPrice)} = *${fmt(i.total)}*${i.gstRate ? ` (GST ${i.gstRate}%)` : ''}`);
    });
    lines.push(DIV);

    // Totals
    const subtotalExTax = (receipt.total || 0) - (receipt.taxAmount || 0) + (receipt.discountAmount || 0);
    if ((receipt.discountAmount || 0) > 0) {
      lines.push(`Subtotal:   ${fmt(subtotalExTax + (receipt.discountAmount || 0))}`);
      lines.push(`Discount:   -${fmt(receipt.discountAmount)}`);
    }
    if (hasAnyGst) {
      lines.push(`Taxable:    ${fmt(subtotalExTax)}`);
      if (totalIgst > 0) {
        lines.push(`IGST:       ${fmt(totalIgst)}`);
      } else {
        lines.push(`CGST:       ${fmt(totalCgst)}`);
        lines.push(`SGST:       ${fmt(totalSgst)}`);
      }
    }

    // Grand total
    lines.push(BOLD_DIV);
    lines.push(`💰 *TOTAL: ${fmt(receipt.total)}*`);
    lines.push(`✅ Paid (${(receipt.paymentMethod || 'CASH').replace('_', ' ')}): ${fmt(receipt.amountPaid)}`);
    if ((receipt.change || 0) > 0) lines.push(`🔄 Change: ${fmt(receipt.change)}`);
    lines.push(BOLD_DIV);

    // Footer
    lines.push(`${rc.thankYouMessage || 'Thank You! Visit Again'} 🙏`);
    if (rc.returnPolicy !== false && rc.returnPolicy) lines.push(rc.returnPolicy);
    if (tenant?.gstin) lines.push(`GST Registered Dealer`);
    lines.push(BOLD_DIV);

    return lines.join('\n');
  };

  const normalizePhone = (phone) => {
    if (!phone) return null;
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('0')) p = p.slice(1);
    if (p.length === 10) p = '91' + p;
    return p;
  };

  const sendViaWA = (phone) => {
    const text = buildReceiptText();
    const normalized = normalizePhone(phone);
    const url = normalized
      ? `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleWAClick = () => {
    const phone = receipt.customer?.phone;
    if (phone) {
      sendViaWA(phone);
    } else {
      setShowPhoneInput(p => !p);
    }
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=420,height=800');
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${docTitle} ${receipt.receiptNumber}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: #fff; width: 300px; margin: 0 auto; }
    @page { size: 80mm auto; margin: 6mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    td { padding: 1px 2px; }
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const S = {
    dashed: { borderTop: '1px dashed #999', margin: '8px 0' },
    row: { display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 },
    totalRow: { display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 14, borderTop: '1px solid #000', paddingTop: 4, marginTop: 4 },
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

        {/* Toolbar */}
        <div style={{ borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Sale Complete ✓</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleWAClick}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#25D366', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <MessageCircle size={13} /> WhatsApp
              </button>
              <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#1E293B', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Printer size={13} /> Print
              </button>
              <button onClick={onClose} style={{ padding: 7, borderRadius: 8, border: 'none', background: '#F3F4F6', color: '#6B7280', cursor: 'pointer' }}><X size={15} /></button>
            </div>
          </div>

          {/* Prominent WA CTA when customer phone is known (new sale) */}
          {receipt._autoWhatsApp && receipt.customer?.phone && (
            <div
              onClick={() => sendViaWA(receipt.customer.phone)}
              style={{ margin: '0 16px 12px', padding: '10px 14px', background: '#DCFCE7', border: '1.5px solid #22C55E', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageCircle size={15} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>Send receipt to {receipt.customer.name}</div>
                <div style={{ fontSize: 11, color: '#16A34A' }}>{receipt.customer.phone} · tap to open WhatsApp</div>
              </div>
              <div style={{ fontSize: 18, color: '#22C55E' }}>→</div>
            </div>
          )}

          {/* Phone input for walk-in without phone */}
          {showPhoneInput && !receipt.customer?.phone && (
            <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="tel" value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)}
                placeholder="Customer mobile (e.g. 9876543210)" autoFocus
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #25D366', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                onKeyDown={e => { if (e.key === 'Enter') sendViaWA(walkinPhone); }} />
              <button onClick={() => sendViaWA(walkinPhone)}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#25D366', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Send ↗
              </button>
            </div>
          )}
        </div>

        {/* Scrollable receipt */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div ref={printRef} style={{ padding: '20px 16px', fontFamily: "'Courier New', monospace", fontSize: 12 }}>

            {/* Business header */}
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              {tenant?.logoUrl && (
                <img src={tenant.logoUrl} alt="logo" style={{ maxHeight: 56, maxWidth: 160, marginBottom: 6, objectFit: 'contain' }} />
              )}
              <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 2 }}>{tenant?.name || 'STORE'}</div>
              {receipt.branch?.name && <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 2 }}>{receipt.branch.name}</div>}
              {tenant?.address && <div style={{ fontSize: 11, color: '#555' }}>{tenant.address}</div>}
              {(tenant?.city || tenant?.state) && (
                <div style={{ fontSize: 11, color: '#555' }}>{[tenant.city, tenant.state].filter(Boolean).join(', ')}</div>
              )}
              {tenant?.phone && <div style={{ fontSize: 11, color: '#555' }}>Ph: {tenant.phone}</div>}
              {tenant?.gstin && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>GSTIN: {tenant.gstin}</div>}
            </div>

            {/* Document title */}
            <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '6px 0', margin: '10px 0', textAlign: 'center', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em' }}>
              {docTitle}
            </div>

            {/* Receipt meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span>Receipt#: <strong>{receipt.receiptNumber}</strong></span>
              <span>{fmtDate(receipt.createdAt)}</span>
            </div>
            {receipt.customer && (
              <div style={{ fontSize: 11, marginBottom: 2 }}>
                Customer: <strong>{receipt.customer.name}</strong>
                {receipt.customer.phone && <span> · {receipt.customer.phone}</span>}
              </div>
            )}
            {receipt.customer?.gstin && (
              <div style={{ fontSize: 11, marginBottom: 2 }}>Buyer GSTIN: <strong>{receipt.customer.gstin}</strong></div>
            )}
            {tenant?.state && (
              <div style={{ fontSize: 11, marginBottom: 2, color: '#555' }}>Place of Supply: {tenant.state}</div>
            )}

            {/* Items */}
            <div style={S.dashed} />
            {(receipt.items || []).map((item, i) => {
              const taxable = (item.total || 0) - (item.taxAmount || 0);
              const hasCgst = (item.cgst || 0) > 0;
              const hasIgst = (item.igst || 0) > 0;
              return (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span style={{ flex: 1, paddingRight: 8 }}>{item.name}</span>
                    <span>{fmt(item.total)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#555' }}>
                    {item.quantity} × {fmt(item.unitPrice)}
                    {item.hsnCode && <span> · HSN: {item.hsnCode}</span>}
                    {(item.gstRate || 0) > 0 && <span> · GST {item.gstRate}%</span>}
                  </div>
                  {isGstRegistered && (item.taxAmount || 0) > 0 && (
                    <div style={{ fontSize: 10, color: '#777', marginTop: 1 }}>
                      Taxable: {fmt(taxable)}
                      {hasCgst && <span> · CGST {item.gstRate / 2}%: {fmt(item.cgst)} · SGST {item.gstRate / 2}%: {fmt(item.sgst)}</span>}
                      {hasIgst && <span> · IGST {item.gstRate}%: {fmt(item.igst)}</span>}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Totals */}
            <div style={S.dashed} />
            {(receipt.discountAmount || 0) > 0 && (
              <div style={S.row}><span>Discount</span><span>-{fmt(receipt.discountAmount)}</span></div>
            )}
            {hasAnyGst && (
              <>
                <div style={S.row}><span>Subtotal (Taxable)</span><span>{fmt(taxable)}</span></div>
                {totalIgst > 0
                  ? <div style={S.row}><span>IGST</span><span>{fmt(totalIgst)}</span></div>
                  : <>
                    <div style={S.row}><span>CGST</span><span>{fmt(totalCgst)}</span></div>
                    <div style={S.row}><span>SGST</span><span>{fmt(totalSgst)}</span></div>
                  </>
                }
              </>
            )}
            <div style={S.totalRow}><span>TOTAL</span><span>{fmt(receipt.total)}</span></div>
            <div style={{ ...S.row, marginTop: 4 }}>
              <span>Paid ({(receipt.paymentMethod || 'CASH').replace('_', ' ')})</span>
              <span>{fmt(receipt.amountPaid)}</span>
            </div>
            {(receipt.change || 0) > 0 && (
              <div style={{ ...S.row, fontWeight: 700, color: '#16A34A' }}>
                <span>Change</span><span>{fmt(receipt.change)}</span>
              </div>
            )}

            {/* GST Summary table */}
            {isGstRegistered && gstSummary.length > 0 && (
              <>
                <div style={S.dashed} />
                <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, textAlign: 'center', letterSpacing: '0.05em' }}>GST SUMMARY</div>
                <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ccc' }}>
                      <td style={{ paddingBottom: 2 }}>Rate</td>
                      <td style={{ paddingBottom: 2, textAlign: 'right' }}>Taxable</td>
                      {gstSummary.some(r => r.igst > 0)
                        ? <td style={{ paddingBottom: 2, textAlign: 'right' }}>IGST</td>
                        : <>
                          <td style={{ paddingBottom: 2, textAlign: 'right' }}>CGST</td>
                          <td style={{ paddingBottom: 2, textAlign: 'right' }}>SGST</td>
                        </>
                      }
                      <td style={{ paddingBottom: 2, textAlign: 'right' }}>Total Tax</td>
                    </tr>
                  </thead>
                  <tbody>
                    {gstSummary.map((row, i) => (
                      <tr key={i}>
                        <td>{row.rate}%</td>
                        <td style={{ textAlign: 'right' }}>{fmt(row.taxable)}</td>
                        {row.igst > 0
                          ? <td style={{ textAlign: 'right' }}>{fmt(row.igst)}</td>
                          : <>
                            <td style={{ textAlign: 'right' }}>{fmt(row.cgst)}</td>
                            <td style={{ textAlign: 'right' }}>{fmt(row.sgst)}</td>
                          </>
                        }
                        <td style={{ textAlign: 'right' }}>{fmt(row.cgst + row.sgst + row.igst)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '1px solid #ccc', fontWeight: 700 }}>
                      <td>Total</td>
                      <td style={{ textAlign: 'right' }}>{fmt(gstSummary.reduce((s, r) => s + r.taxable, 0))}</td>
                      {gstSummary.some(r => r.igst > 0)
                        ? <td style={{ textAlign: 'right' }}>{fmt(gstSummary.reduce((s, r) => s + r.igst, 0))}</td>
                        : <>
                          <td style={{ textAlign: 'right' }}>{fmt(totalCgst)}</td>
                          <td style={{ textAlign: 'right' }}>{fmt(totalSgst)}</td>
                        </>
                      }
                      <td style={{ textAlign: 'right' }}>{fmt(receipt.taxAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {/* Footer */}
            <div style={S.dashed} />
            <div style={{ textAlign: 'center', fontSize: 11, color: '#555' }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{rc.thankYouMessage || 'Thank You! Visit Again'}</div>
              {(rc.returnPolicy !== false) && (
                <div>{rc.returnPolicy || 'Goods once sold will not be returned.'}</div>
              )}
              {(rc.footerLines || []).map((line, i) => <div key={i}>{line}</div>)}
              {tenant?.gstin && <div style={{ marginTop: 4, fontWeight: 600 }}>GST Registered Dealer</div>}
              {!isGstRegistered && <div style={{ marginTop: 4 }}>Tax not collected (Unregistered Dealer)</div>}
            </div>

          </div>
        </div>

        {/* New Sale */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6', flexShrink: 0 }}>
          <button onClick={onNewSale} style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#F0FDF4', color: '#16A34A', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            + New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
