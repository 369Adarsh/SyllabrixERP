import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import KpiBar from '../../components/ui/KpiBar';
import { P } from '../../styles/page';
import { useBranch } from '../../context/BranchContext';
import { getReturns, getReturnsSummary, createReturn, lookupInvoiceForReturn, lookupReceiptForReturn } from '../../api';
import { RotateCcw, Plus, Search, X, Package, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const REFUND_METHODS = [
  { value: 'CASH',         label: 'Cash',         color: '#10B981' },
  { value: 'UPI',          label: 'UPI',           color: '#6366F1' },
  { value: 'BANK_TRANSFER',label: 'Bank Transfer', color: '#3B82F6' },
  { value: 'STORE_CREDIT', label: 'Store Credit',  color: '#F59E0B' },
  { value: 'EXCHANGE',     label: 'Exchange',      color: '#8B5CF6' },
];

const RETURN_REASONS = [
  'Defective / damaged product',
  'Wrong item delivered',
  'Customer changed mind',
  'Product not as described',
  'Duplicate order',
  'Other',
];

const methodColor = (m) => REFUND_METHODS.find(r => r.value === m)?.color || '#6B7280';
const methodLabel = (m) => REFUND_METHODS.find(r => r.value === m)?.label || m;

// ─── New Return Modal ─────────────────────────────────────────────────────────
function NewReturnModal({ onClose, onCreated }) {
  const [step, setStep]             = useState(1); // 1=lookup, 2=select items, 3=refund details
  const [sourceType, setSourceType] = useState('INVOICE');
  const [searchNo, setSearchNo]     = useState('');
  const [searching, setSearching]   = useState(false);
  const [sourceDoc, setSourceDoc]   = useState(null); // invoice or transaction
  const [selectedItems, setSelectedItems] = useState([]); // { item, returnQty }
  const [reason, setReason]         = useState('');
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);

  const lookup = async () => {
    if (!searchNo.trim()) return toast.error('Enter an invoice or receipt number');
    setSearching(true);
    try {
      const fn = sourceType === 'INVOICE' ? lookupInvoiceForReturn : lookupReceiptForReturn;
      const r  = await fn(searchNo.trim());
      const doc = r.data.data;
      setSourceDoc(doc);
      // Pre-populate selectedItems with qty 0
      const items = sourceType === 'INVOICE' ? doc.items : doc.items;
      setSelectedItems(items.map(it => ({ item: it, returnQty: 0 })));
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Not found');
    } finally { setSearching(false); }
  };

  const setQty = (idx, val) => {
    setSelectedItems(prev => prev.map((s, i) => i === idx ? { ...s, returnQty: Math.max(0, Math.min(Number(val), s.item.quantity)) } : s));
  };

  const selectedCount = selectedItems.filter(s => s.returnQty > 0).length;
  const refundTotal   = selectedItems.reduce((sum, s) => {
    const price = s.item.unitPrice || s.item.basePrice || 0;
    return sum + s.returnQty * price;
  }, 0);

  const submit = async () => {
    if (!reason.trim()) return toast.error('Please select a return reason');
    const toReturn = selectedItems.filter(s => s.returnQty > 0);
    if (!toReturn.length) return toast.error('Select at least one item to return');
    setSaving(true);
    try {
      const items = toReturn.map(s => ({
        productId:   s.item.productId || s.item.product?.id || null,
        description: s.item.description || s.item.name,
        quantity:    s.returnQty,
        unitPrice:   s.item.unitPrice || s.item.basePrice || 0,
      }));
      await createReturn({
        sourceType,
        invoiceId:     sourceType === 'INVOICE'     ? sourceDoc.id : undefined,
        transactionId: sourceType === 'TRANSACTION' ? sourceDoc.id : undefined,
        customerId:    sourceDoc.customerId || sourceDoc.customer?.id || undefined,
        reason,
        refundMethod,
        notes,
        items,
      });
      toast.success('Return processed successfully');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process return');
    } finally { setSaving(false); }
  };


  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', margin: 0 }}>Process Return</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {['Find Sale', 'Select Items', 'Refund Details'].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: step > i + 1 ? '#10B981' : step === i + 1 ? 'var(--navy)' : '#E5E7EB', color: step >= i + 1 ? '#fff' : '#9CA3AF' }}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: step === i + 1 ? 'var(--navy)' : '#9CA3AF', fontWeight: step === i + 1 ? 700 : 400 }}>{s}</span>
                  {i < 2 && <span style={{ color: '#E5E7EB', fontSize: 12 }}>›</span>}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>

          {/* Step 1 — Lookup */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {['INVOICE', 'TRANSACTION'].map(t => (
                  <button key={t} onClick={() => setSourceType(t)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: `2px solid ${sourceType === t ? 'var(--navy)' : '#E5E7EB'}`, background: sourceType === t ? 'var(--navy)' : '#fff', color: sourceType === t ? '#fff' : '#6B7280', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    {t === 'INVOICE' ? '📄 Invoice' : '🧾 POS Receipt'}
                  </button>
                ))}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                  {sourceType === 'INVOICE' ? 'Invoice Number (e.g. INV-2026-0001)' : 'Receipt Number (e.g. TXN-202600001)'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={searchNo} onChange={e => setSearchNo(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()} placeholder={sourceType === 'INVOICE' ? 'INV-2026-0001' : 'TXN-202600001'} style={{ ...P.input, flex: 1 }} />
                  <Button onClick={lookup} loading={searching}><Search size={14} />Find</Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Select items */}
          {step === 2 && sourceDoc && (
            <div>
              <div style={{ background: '#F0F4FF', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
                    {sourceType === 'INVOICE' ? sourceDoc.invoiceNumber : sourceDoc.receiptNumber}
                  </div>
                  {sourceDoc.customer && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{sourceDoc.customer.name}{sourceDoc.customer.phone ? ` · ${sourceDoc.customer.phone}` : ''}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>Original total</div>
                  <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{fmt(sourceDoc.total)}</div>
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Select items to return</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {selectedItems.map((s, idx) => {
                  const it    = s.item;
                  const price = it.unitPrice || it.basePrice || 0;
                  const name  = it.description || it.name;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: `1.5px solid ${s.returnQty > 0 ? 'var(--navy)' : '#E5E7EB'}`, borderRadius: 10, background: s.returnQty > 0 ? '#F0F4FF' : '#fff', transition: 'all 0.15s' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{name}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{fmt(price)} × {it.quantity} sold</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => setQty(idx, s.returnQty - 1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <input type="number" value={s.returnQty} onChange={e => setQty(idx, e.target.value)} min={0} max={it.quantity} style={{ width: 44, textAlign: 'center', padding: '4px 0', border: '1.5px solid #E5E7EB', borderRadius: 6, fontSize: 14, fontWeight: 700 }} />
                        <button onClick={() => setQty(idx, s.returnQty + 1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <div style={{ width: 72, textAlign: 'right', fontWeight: 700, fontSize: 13, color: s.returnQty > 0 ? 'var(--navy)' : '#9CA3AF' }}>{fmt(s.returnQty * price)}</div>
                    </div>
                  );
                })}
              </div>

              {selectedCount > 0 && (
                <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{selectedCount} item{selectedCount !== 1 ? 's' : ''} to return</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy)' }}>Refund: {fmt(refundTotal)}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => { setStep(1); setSourceDoc(null); }}>Back</Button>
                <Button onClick={() => selectedCount > 0 && setStep(3)} disabled={selectedCount === 0}>Next →</Button>
              </div>
            </div>
          )}

          {/* Step 3 — Refund details */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Summary */}
              <div style={{ background: '#F0F4FF', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{selectedCount} item{selectedCount !== 1 ? 's' : ''} · {sourceDoc?.invoiceNumber || sourceDoc?.receiptNumber}</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--navy)' }}>{fmt(refundTotal)}</div>
                </div>
                <RotateCcw size={28} color="var(--navy)" style={{ opacity: 0.3 }} />
              </div>

              {/* Reason */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Return Reason *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {RETURN_REASONS.map(r => (
                    <button key={r} onClick={() => setReason(r)} style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${reason === r ? 'var(--navy)' : '#E5E7EB'}`, background: reason === r ? 'var(--navy)' : '#fff', color: reason === r ? '#fff' : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{r}</button>
                  ))}
                </div>
              </div>

              {/* Refund method */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Refund Method *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {REFUND_METHODS.map(m => (
                    <button key={m.value} onClick={() => setRefundMethod(m.value)} style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${refundMethod === m.value ? m.color : '#E5E7EB'}`, background: refundMethod === m.value ? m.color + '18' : '#fff', color: refundMethod === m.value ? m.color : '#6B7280', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{m.label}</button>
                  ))}
                </div>
                {refundMethod === 'STORE_CREDIT' && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
                    A credit note of {fmt(refundTotal)} will be automatically issued to the customer.
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Internal notes about this return..." style={{ ...P.input, resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={submit} loading={saving} disabled={!reason || !refundMethod}>
                  <RotateCcw size={14} />Process Return
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Returns() {
  const { isMobile }        = useBreakpoint();
  const { branchId, hasBranches } = useBranch();
  const showBranchCol = hasBranches && !branchId;
  const [returns, setReturns]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = branchId ? { branchId } : {};
      const [rRes, sRes] = await Promise.all([getReturns(params), getReturnsSummary(params)]);
      setReturns(rRes.data.data || []);
      setSummary(sRes.data.data || null);
    } catch { toast.error('Failed to load returns'); }
    finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Returns & Refunds</h1>
          <p style={P.sub}>Process customer returns · restock inventory · issue refunds</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus size={16} style={{ marginRight: 6 }} />New Return</Button>
      </div>

      <KpiBar stats={[
        { label: 'Total Refunded', value: fmt(summary?.totalRefunded), color: '#EF4444' },
        { label: 'Total Returns',  value: summary?.totalReturns ?? '—', color: 'var(--navy)' },
        { label: 'Last 30 Days',   value: summary?.last30Days ?? '—',   color: '#F59E0B' },
      ]} />

      {/* Branch breakdown — only in All Branches view */}
      {showBranchCol && summary?.byBranch?.length > 0 && (
        <Card style={{ marginBottom: isMobile ? 12 : 20, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Returns by Branch</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {summary.byBranch.map((b, i) => {
              const pct = summary.totalRefunded > 0 ? Math.round((b.totalRefunded / summary.totalRefunded) * 100) : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{b.branch?.isHQ ? '🏢' : '🏪'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.branch?.name || 'Unassigned'}</span>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan)', flexShrink: 0 }}>{b.branch?.code || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 700 }}>{fmt(b.totalRefunded)}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>{b.totalReturns} return{b.totalReturns !== 1 ? 's' : ''} · {pct}%</span>
                    </div>
                    <div style={{ marginTop: 4, height: 3, borderRadius: 2, background: '#E5E7EB', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--cyan)', borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Table */}
      <Card style={{ padding: 0 }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>Loading…</p>
        ) : returns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <RotateCcw size={40} style={{ color: '#E5E7EB', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: '#9CA3AF', fontSize: 14 }}>No returns processed yet.</p>
            <Button onClick={() => setShowModal(true)} style={{ marginTop: 12 }}><Plus size={14} />Process First Return</Button>
          </div>
        ) : (
          <div style={P.tableScroll}>
            <table style={P.table}>
              <thead style={P.thead}>
                <tr>
                  {['Return #', 'Date', ...(showBranchCol ? ['Branch'] : []), 'Source', 'Customer', 'Items', 'Refund Amount', 'Method', 'Reason'].map(h => (
                    <th key={h} style={P.th()}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {returns.map((r, i) => (
                  <tr key={r.id} style={P.tr(i, returns.length)}>
                    <td style={{ ...P.td(), fontWeight: 700, color: 'var(--navy)', fontFamily: 'monospace' }}>{r.returnNumber}</td>
                    <td style={{ ...P.td(), color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</td>
                    {showBranchCol && (
                      <td style={P.td()}>
                        {r.branch ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14 }}>{r.branch.isHQ ? '🏢' : '🏪'}</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2 }}>{r.branch.name}</div>
                              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.05em' }}>{r.branch.code}</div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#9CA3AF' }}>—</span>
                        )}
                      </td>
                    )}
                    <td style={P.td()}>
                      {r.sourceType === 'INVOICE'
                        ? <span style={{ color: '#6366F1', fontWeight: 600 }}>{r.invoice?.invoiceNumber || '—'}</span>
                        : r.sourceType === 'TRANSACTION'
                          ? <span style={{ color: '#0EA5E9', fontWeight: 600 }}>{r.transaction?.receiptNumber || '—'}</span>
                          : <span style={{ color: '#9CA3AF', fontSize: 12 }}>Walk-in</span>}
                    </td>
                    <td style={P.td()}>{r.customer?.name || <span style={{ color: '#9CA3AF' }}>—</span>}</td>
                    <td style={{ ...P.td(), color: '#6B7280' }}>
                      {r.items?.slice(0, 2).map(i => i.description).join(', ')}
                      {r.items?.length > 2 && ` +${r.items.length - 2}`}
                    </td>
                    <td style={{ ...P.td(), fontWeight: 700, color: '#EF4444', whiteSpace: 'nowrap' }}>{fmt(r.refundAmount)}</td>
                    <td style={P.td()}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: methodColor(r.refundMethod) + '18', color: methodColor(r.refundMethod), whiteSpace: 'nowrap' }}>
                        {methodLabel(r.refundMethod)}
                      </span>
                    </td>
                    <td style={{ ...P.td(), maxWidth: 160 }}>{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <NewReturnModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}

