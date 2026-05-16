import { useState, useEffect, useRef } from 'react';
import { getInvoice, sendWAInvoice } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { X, Printer, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const STATUS_LABEL = { DRAFT: 'Draft', SENT: 'Sent', PAID: 'Paid', PARTIAL: 'Partial', OVERDUE: 'Overdue', CANCELLED: 'Cancelled' };
const STATUS_COLOR = { DRAFT: '#6B7280', SENT: '#3B82F6', PAID: '#16A34A', PARTIAL: '#D97706', OVERDUE: '#DC2626', CANCELLED: '#9CA3AF' };

export default function InvoiceView({ invoiceId, onClose }) {
  const { tenant } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    getInvoice(invoiceId)
      .then(r => setInvoice(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${invoice?.invoiceNumber || ''}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #111827; background: #fff; }
    @page { size: A4; margin: 14mm 16mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, fontSize: 14, color: '#6B7280' }}>Loading invoice...</div>
    </div>
  );

  if (!invoice) return null;

  const inv = invoice;
  const hasTax = (inv.taxAmount || 0) > 0;
  const isInterState = inv.gstDetails?.isInterState;
  const customerPhone = inv.customer?.phone;

  const handleSendWA = async () => {
    if (!customerPhone) return toast.error('Customer has no phone number saved');
    setSending(true);
    try {
      await sendWAInvoice(inv.id);
      toast.success(`Invoice sent to ${inv.customer.name} on WhatsApp ✓`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send WhatsApp message');
    } finally { setSending(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 760, boxShadow: '0 24px 80px rgba(0,0,0,0.25)', marginBottom: 24 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Invoice Preview</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSendWA}
              disabled={sending || !customerPhone}
              title={!customerPhone ? 'No phone number for this customer' : `Send to ${customerPhone}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: customerPhone ? '#25D366' : '#D1FAE5', color: customerPhone ? '#fff' : '#6B7280', fontSize: 13, fontWeight: 600, cursor: customerPhone ? 'pointer' : 'not-allowed', opacity: sending ? 0.7 : 1 }}
            >
              <MessageCircle size={14} /> {sending ? 'Sending…' : 'Send WhatsApp'}
            </button>
            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1E293B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Printer size={14} /> Print / PDF
            </button>
            <button onClick={onClose} style={{ padding: 8, borderRadius: 8, border: 'none', background: '#F3F4F6', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Invoice content */}
        <div ref={printRef} style={{ padding: '32px 40px' }}>
          <InvoiceDocument inv={inv} tenant={tenant} hasTax={hasTax} isInterState={isInterState} />
        </div>
      </div>
    </div>
  );
}

function InvoiceDocument({ inv, tenant, hasTax, isInterState }) {
  const statusColor = STATUS_COLOR[inv.status] || '#6B7280';

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 13, color: '#111827', background: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid #1E293B' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', letterSpacing: '-0.03em', marginBottom: 6 }}>{tenant?.name || 'Business Name'}</div>
          {tenant?.address && <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{tenant.address}</div>}
          {(tenant?.city || tenant?.state) && <div style={{ fontSize: 12, color: '#6B7280' }}>{[tenant.city, tenant.state, tenant.pincode].filter(Boolean).join(', ')}</div>}
          {tenant?.phone && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>📞 {tenant.phone}</div>}
          {tenant?.email && <div style={{ fontSize: 12, color: '#6B7280' }}>✉ {tenant.email}</div>}
          {tenant?.gstin && <div style={{ fontSize: 11, color: '#374151', marginTop: 6, fontWeight: 600 }}>GSTIN: {tenant.gstin}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1E293B', letterSpacing: '-0.03em' }}>INVOICE</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginTop: 4 }}>{inv.invoiceNumber}</div>
          <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusColor + '18', color: statusColor, border: `1px solid ${statusColor}40` }}>
            {STATUS_LABEL[inv.status] || inv.status}
          </div>
        </div>
      </div>

      {/* Bill to + Invoice details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Bill To</div>
          {inv.customer ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1E293B', marginBottom: 2 }}>{inv.customer.name}</div>
              {inv.customer.phone && <div style={{ fontSize: 12, color: '#6B7280' }}>📞 {inv.customer.phone}</div>}
              {inv.customer.email && <div style={{ fontSize: 12, color: '#6B7280' }}>✉ {inv.customer.email}</div>}
              {inv.customer.address && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{inv.customer.address}</div>}
              {inv.customer.gstin && <div style={{ fontSize: 11, color: '#374151', marginTop: 4, fontWeight: 600 }}>GSTIN: {inv.customer.gstin}</div>}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>Walk-in Customer</div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Invoice Details</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Invoice Date', fmtDate(inv.issueDate)],
                ['Due Date', fmtDate(inv.dueDate)],
                ...(hasTax && isInterState !== undefined ? [['Supply Type', isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)']] : []),
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{ padding: '3px 0', fontSize: 12, color: '#6B7280', width: '45%' }}>{label}</td>
                  <td style={{ padding: '3px 0', fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Line items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#1E293B' }}>
            {['#', 'Description', 'Qty', 'Unit Price', ...(hasTax ? ['Tax %', 'Tax Amt'] : []), 'Discount', 'Amount'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: h === '#' || h === 'Qty' ? 'center' : h === 'Amount' || h === 'Tax Amt' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(inv.items || []).map((item, idx) => (
            <tr key={item.id} style={{ background: idx % 2 === 0 ? '#F9FAFB' : '#fff', borderBottom: '1px solid #E5E7EB' }}>
              <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>{idx + 1}</td>
              <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: '#1E293B' }}>
                {item.description}
                {item.product?.sku && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>SKU: {item.product.sku}</div>}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13 }}>{item.quantity}</td>
              <td style={{ padding: '10px 12px', fontSize: 13 }}>{fmt(item.unitPrice)}</td>
              {hasTax && <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: '#6B7280' }}>{item.taxRate ? `${item.taxRate}%` : '—'}</td>}
              {hasTax && <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: '#6B7280' }}>{item.taxAmount > 0 ? fmt(item.taxAmount) : '—'}</td>}
              <td style={{ padding: '10px 12px', fontSize: 12, color: '#6B7280' }}>{item.discount > 0 ? fmt(item.discount) : '—'}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{fmt(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
        <div style={{ width: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
            <span>Subtotal</span><span>{fmt(inv.subtotal)}</span>
          </div>
          {(inv.discountAmount || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#DC2626', borderBottom: '1px solid #F3F4F6' }}>
              <span>Discount</span><span>−{fmt(inv.discountAmount)}</span>
            </div>
          )}
          {hasTax && (inv.gstDetails?.cgst || inv.taxAmount > 0) && (
            isInterState ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
                <span>IGST</span><span>{fmt(inv.taxAmount)}</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
                  <span>CGST</span><span>{fmt((inv.taxAmount || 0) / 2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
                  <span>SGST</span><span>{fmt((inv.taxAmount || 0) / 2)}</span>
                </div>
              </>
            )
          )}
          {hasTax && !(inv.gstDetails?.cgst) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
              <span>Tax</span><span>{fmt(inv.taxAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 16, fontWeight: 800, color: '#1E293B', borderTop: '2px solid #1E293B' }}>
            <span>Grand Total</span><span>{fmt(inv.total)}</span>
          </div>
          {(inv.amountPaid || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#16A34A', borderBottom: '1px solid #F3F4F6' }}>
              <span>Amount Paid</span><span>−{fmt(inv.amountPaid)}</span>
            </div>
          )}
          {(inv.balanceDue || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, fontWeight: 700, color: '#DC2626' }}>
              <span>Balance Due</span><span>{fmt(inv.balanceDue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment history */}
      {inv.payments?.length > 0 && (
        <div style={{ marginBottom: 24, padding: '16px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Payment History</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {inv.payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: '4px 0', fontSize: 12, color: '#374151' }}>{fmtDate(p.paidAt)}</td>
                  <td style={{ padding: '4px 0', fontSize: 12, color: '#6B7280' }}>{p.method?.replace('_', ' ')}</td>
                  {p.reference && <td style={{ padding: '4px 0', fontSize: 11, color: '#9CA3AF' }}>Ref: {p.reference}</td>}
                  <td style={{ padding: '4px 0', fontSize: 12, fontWeight: 600, color: '#16A34A', textAlign: 'right' }}>{fmt(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes & Terms */}
      {(inv.notes || inv.terms) && (
        <div style={{ display: 'grid', gridTemplateColumns: inv.notes && inv.terms ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 24 }}>
          {inv.notes && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{inv.notes}</div>
            </div>
          )}
          {inv.terms && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Terms & Conditions</div>
              <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{inv.terms}</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ paddingTop: 20, borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>
          This is a computer-generated invoice and does not require a physical signature.
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 20 }}>For {tenant?.name || 'Business'}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', borderTop: '1px solid #D1D5DB', paddingTop: 4, width: 140, textAlign: 'center' }}>Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
}
