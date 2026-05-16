import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sendWAMessage } from '../../api';
import { X, Printer, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d || Date.now()).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function POSReceipt({ receipt, onClose, onNewSale }) {
  const { tenant } = useAuth();
  const printRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [walkinPhone, setWalkinPhone] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const customerPhone = receipt.customer?.phone;
  const targetPhone = customerPhone || walkinPhone;

  const buildReceiptText = () => {
    const lines = [
      `🧾 *Receipt from ${tenant?.name || 'Store'}*`,
      `Receipt#: ${receipt.receiptNumber}`,
      `Date: ${fmtDate(receipt.createdAt)}`,
      ``,
      `*Items:*`,
      ...(receipt.items || []).map(i => `  • ${i.name} × ${i.quantity} = ${fmt(i.total)}`),
      ``,
    ];
    if ((receipt.taxAmount || 0) > 0) lines.push(`Tax: ${fmt(receipt.taxAmount)}`);
    lines.push(`*Total: ${fmt(receipt.total)}*`);
    lines.push(`Paid (${(receipt.paymentMethod || 'CASH').replace('_', ' ')}): ${fmt(receipt.amountPaid)}`);
    if ((receipt.change || 0) > 0) lines.push(`Change: ${fmt(receipt.change)}`);
    lines.push(``, `Thank you for shopping with us! 🙏`);
    if (tenant?.phone) lines.push(`Contact: ${tenant.phone}`);
    return lines.join('\n');
  };

  const handleSendWA = async (phone) => {
    const p = phone || targetPhone;
    if (!p) { setShowPhoneInput(true); return; }
    setSending(true);
    try {
      await sendWAMessage({ phone: p, message: buildReceiptText() });
      toast.success('Receipt sent on WhatsApp ✓');
      setShowPhoneInput(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send');
    } finally { setSending(false); }
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=420,height=700');
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${receipt.receiptNumber}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: #fff; width: 300px; margin: 0 auto; }
    @page { size: 80mm auto; margin: 6mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        {/* Toolbar */}
        <div style={{ borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Sale Complete ✓</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => customerPhone ? handleSendWA(customerPhone) : setShowPhoneInput(p => !p)}
                disabled={sending}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#25D366', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}
              >
                <MessageCircle size={13} /> {sending ? 'Sending…' : customerPhone ? 'WhatsApp' : 'Send to WhatsApp'}
              </button>
              <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#1E293B', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Printer size={13} /> Print
              </button>
              <button onClick={onClose} style={{ padding: 7, borderRadius: 8, border: 'none', background: '#F3F4F6', color: '#6B7280', cursor: 'pointer' }}><X size={15} /></button>
            </div>
          </div>
          {/* Walk-in phone input */}
          {showPhoneInput && !customerPhone && (
            <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="tel"
                value={walkinPhone}
                onChange={e => setWalkinPhone(e.target.value)}
                placeholder="Enter customer WhatsApp number (e.g. 9876543210)"
                autoFocus
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #25D366', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)' }}
                onKeyDown={e => { if (e.key === 'Enter' && walkinPhone) handleSendWA(walkinPhone); }}
              />
              <button
                onClick={() => handleSendWA(walkinPhone)}
                disabled={!walkinPhone || sending}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#25D366', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Send ✓
              </button>
            </div>
          )}
        </div>

        {/* Receipt */}
        <div ref={printRef} style={{ padding: '20px 16px', fontFamily: "'Courier New', monospace", fontSize: 12 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 2 }}>{tenant?.name || 'STORE'}</div>
            {tenant?.address && <div style={{ fontSize: 11, color: '#555' }}>{tenant.address}</div>}
            {(tenant?.city || tenant?.state) && <div style={{ fontSize: 11, color: '#555' }}>{[tenant.city, tenant.state].filter(Boolean).join(', ')}</div>}
            {tenant?.phone && <div style={{ fontSize: 11, color: '#555' }}>Ph: {tenant.phone}</div>}
            {tenant?.gstin && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>GSTIN: {tenant.gstin}</div>}
            <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '6px 0', margin: '10px 0', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em' }}>RECEIPT</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span>Receipt#: <strong>{receipt.receiptNumber}</strong></span>
              <span>{fmtDate(receipt.createdAt)}</span>
            </div>
            {receipt.customer && <div style={{ fontSize: 11, textAlign: 'left', marginTop: 4 }}>Customer: <strong>{receipt.customer.name}</strong></div>}
          </div>

          {/* Items */}
          <div style={{ borderTop: '1px dashed #999', paddingTop: 8, marginBottom: 8 }}>
            {(receipt.items || []).map((item, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span style={{ flex: 1, paddingRight: 8 }}>{item.name}</span>
                  <span>{fmt(item.total)}</span>
                </div>
                <div style={{ fontSize: 11, color: '#555' }}>
                  {item.quantity} × {fmt(item.unitPrice)}
                  {item.taxAmount > 0 && <span> (Tax: {fmt(item.taxAmount)})</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ borderTop: '1px dashed #999', paddingTop: 8, marginBottom: 8 }}>
            {(receipt.discountAmount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span>Discount</span><span>-{fmt(receipt.discountAmount)}</span>
              </div>
            )}
            {(receipt.taxAmount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span>Tax</span><span>{fmt(receipt.taxAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 14, borderTop: '1px solid #000', paddingTop: 4, marginTop: 4 }}>
              <span>TOTAL</span><span>{fmt(receipt.total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
              <span>Paid ({(receipt.paymentMethod || 'CASH').replace('_', ' ')})</span>
              <span>{fmt(receipt.amountPaid)}</span>
            </div>
            {(receipt.change || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#16A34A' }}>
                <span>Change</span><span>{fmt(receipt.change)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px dashed #999', paddingTop: 10, textAlign: 'center', fontSize: 11, color: '#555' }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Thank You! Visit Again 🙏</div>
            <div>Goods once sold will not be returned.</div>
            {tenant?.gstin && <div style={{ marginTop: 4 }}>GST Registered Dealer</div>}
          </div>
        </div>

        {/* New Sale button */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6' }}>
          <button onClick={onNewSale} style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#F0FDF4', color: '#16A34A', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            + New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
