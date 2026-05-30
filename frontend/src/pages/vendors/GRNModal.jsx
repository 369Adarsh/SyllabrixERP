import { useState, useEffect } from 'react';
import { createGRN, confirmGRN } from '../../api';
import { X, CheckCircle, AlertTriangle, Package, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function VarianceBadge({ variance }) {
  if (variance === 0) return <span style={{ color: '#16A34A', fontWeight: 700, fontSize: 12 }}>✓ Match</span>;
  if (variance > 0) return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#2563EB', fontWeight: 700, fontSize: 12 }}>
      <TrendingUp size={12} /> +{variance} extra
    </span>
  );
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#DC2626', fontWeight: 700, fontSize: 12 }}>
      <TrendingDown size={12} /> {variance} short
    </span>
  );
}

export default function GRNModal({ po, onClose, onConfirmed }) {
  const [grn, setGrn] = useState(null);
  const [lines, setLines] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createGRN(po.id)
      .then(r => {
        const g = r.data.data;
        setGrn(g);
        setLines(g.lines.map(l => ({
          id:          l.id,
          description: l.description,
          product:     l.product,
          orderedQty:  l.orderedQty,
          receivedQty: l.receivedQty,
          unitCost:    l.unitCost,
          varNotes:    '',
        })));
      })
      .catch(e => { toast.error(e.response?.data?.message || 'Failed to load PO'); onClose(); })
      .finally(() => setLoading(false));
  }, [po.id]);

  const updateLine = (idx, field, val) =>
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l));

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await confirmGRN(grn.id, {
        lines: lines.map(l => ({
          id:         l.id,
          receivedQty: Number(l.receivedQty),
          unitCost:    Number(l.unitCost),
          varNotes:    l.varNotes,
        })),
        notes,
      });
      toast.success('GRN confirmed — stock updated');
      onConfirmed();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to confirm GRN');
    } finally {
      setSaving(false);
    }
  };

  const totalOrdered  = lines.reduce((s, l) => s + Number(l.orderedQty), 0);
  const totalReceived = lines.reduce((s, l) => s + Number(l.receivedQty), 0);
  const totalValue    = lines.reduce((s, l) => s + Number(l.receivedQty) * Number(l.unitCost), 0);
  const hasVariances  = lines.some(l => Number(l.receivedQty) !== Number(l.orderedQty));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 860, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', marginBottom: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #F3F4F6' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 17, color: 'var(--navy)', margin: 0 }}>
              Goods Receipt Note
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
              PO: {po.poNumber} · {po.vendor?.name || 'Unknown vendor'}
            </p>
          </div>
          {grn && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', background: '#F3F4F6', padding: '4px 10px', borderRadius: 8 }}>
              {grn.grnNumber}
            </span>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', marginLeft: 8 }}><X size={20} /></button>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#6B7280' }}>Loading PO items...</div>
        ) : (
          <>
            {/* Variance banner */}
            {hasVariances && (
              <div style={{ margin: '16px 24px 0', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={16} color="#D97706" />
                <span style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
                  Quantity differences detected — review each line before confirming.
                </span>
              </div>
            )}

            {/* Line items table */}
            <div style={{ padding: '16px 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B7280', fontWeight: 600 }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '8px 8px', color: '#6B7280', fontWeight: 600, width: 90 }}>Ordered</th>
                    <th style={{ textAlign: 'center', padding: '8px 8px', color: '#6B7280', fontWeight: 600, width: 110 }}>Received ✎</th>
                    <th style={{ textAlign: 'center', padding: '8px 8px', color: '#6B7280', fontWeight: 600, width: 110 }}>Unit Cost ✎</th>
                    <th style={{ textAlign: 'center', padding: '8px 8px', color: '#6B7280', fontWeight: 600, width: 90 }}>Variance</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', color: '#6B7280', fontWeight: 600, width: 110 }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => {
                    const variance = Number(line.receivedQty) - Number(line.orderedQty);
                    const lineTotal = Number(line.receivedQty) * Number(line.unitCost);
                    const rowBg = variance < 0 ? '#FFF5F5' : variance > 0 ? '#EFF6FF' : '#fff';
                    return (
                      <tr key={line.id} style={{ borderBottom: '1px solid #F9FAFB', background: rowBg }}>
                        <td style={{ padding: '10px 0' }}>
                          <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{line.description}</div>
                          {line.product && <div style={{ fontSize: 11, color: '#9CA3AF' }}>SKU: {line.product.sku} · Stock: {line.product.stock}</div>}
                          {/* Variance note */}
                          {variance !== 0 && (
                            <input
                              placeholder="Reason for difference (e.g. substituted brand, partial delivery)..."
                              value={line.varNotes}
                              onChange={e => updateLine(idx, 'varNotes', e.target.value)}
                              style={{ marginTop: 4, width: '100%', fontSize: 11, padding: '3px 7px', border: '1px solid #FDE68A', borderRadius: 6, background: '#FFFBEB', color: '#92400E' }}
                            />
                          )}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px 8px', color: '#374151', fontWeight: 600 }}>
                          {line.orderedQty}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.receivedQty}
                            onChange={e => updateLine(idx, 'receivedQty', e.target.value)}
                            style={{ width: 80, textAlign: 'center', padding: '5px 8px', border: `1.5px solid ${variance !== 0 ? '#FCA5A5' : '#D1D5DB'}`, borderRadius: 6, fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitCost}
                            onChange={e => updateLine(idx, 'unitCost', e.target.value)}
                            style={{ width: 90, textAlign: 'center', padding: '5px 8px', border: '1.5px solid #D1D5DB', borderRadius: 6, fontSize: 13, color: 'var(--navy)' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                          <VarianceBadge variance={variance} />
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 700, color: 'var(--navy)' }}>
                          {fmt(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary bar */}
            <div style={{ margin: '0 24px', background: '#F9FAFB', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Total Ordered</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{totalOrdered} units</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Total Received</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: totalReceived < totalOrdered ? '#DC2626' : '#16A34A' }}>{totalReceived} units</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Net Variance</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: (totalReceived - totalOrdered) === 0 ? '#16A34A' : '#D97706' }}>
                  {totalReceived - totalOrdered >= 0 ? '+' : ''}{totalReceived - totalOrdered}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Receipt Value</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{fmt(totalValue)}</div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ padding: '16px 24px 0' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Delivery Notes (optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Partial delivery — remaining 20 units expected next week..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px 20px' }}>
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                <Package size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Confirming will update inventory stock levels
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: 'var(--navy)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}
                >
                  <CheckCircle size={15} />
                  {saving ? 'Confirming...' : 'Confirm Receipt'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
