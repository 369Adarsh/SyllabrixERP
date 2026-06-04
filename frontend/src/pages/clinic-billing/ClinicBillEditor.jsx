import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getClinicBillById, createClinicBill, updateClinicBill, getClinicProcedures } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Save, Printer, Plus, Trash2, User,
  Stethoscope, Wallet, Smartphone, CreditCard, Receipt,
  CheckCircle, IndianRupee, FileText,
} from 'lucide-react';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const CAT_STYLE = {
  CONSULTATION: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  PROCEDURE:    { bg: '#F5F3FF', color: '#6D28D9', border: '#C4B5FD' },
  MEDICINE:     { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  DIAGNOSTIC:   { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  OTHER:        { bg: '#F9FAFB', color: '#374151', border: '#D1D5DB' },
};

const CONSULTATION_QUICK = [
  { description: 'Consultation — First Visit',  unitPrice: 300 },
  { description: 'Consultation — Follow-up',    unitPrice: 200 },
  { description: 'Consultation — Specialist',   unitPrice: 500 },
  { description: 'Consultation — Emergency',    unitPrice: 500 },
];

function computeItemTotals(item) {
  const lineBase = (item.quantity || 1) * (item.unitPrice || 0) - (item.discount || 0);
  const taxAmount = item.isGstExempt ? 0 : lineBase * ((item.taxRate || 0) / 100);
  return { taxAmount, lineTotal: lineBase + taxAmount };
}

function computeBillTotals(items, discountAmount = 0) {
  let subtotal = 0, exemptAmount = 0, taxableAmount = 0, gstAmount = 0;
  items.forEach((item) => {
    const base = (item.quantity || 1) * (item.unitPrice || 0) - (item.discount || 0);
    subtotal += base;
    if (item.isGstExempt) exemptAmount += base;
    else { taxableAmount += base; gstAmount += base * ((item.taxRate || 0) / 100); }
  });
  return { subtotal, exemptAmount, taxableAmount, gstAmount, totalAmount: subtotal - discountAmount + gstAmount };
}

// ── Item row component ────────────────────────────────────────────────────────
function BillItemRow({ item, index, onChange, onRemove }) {
  const cs = CAT_STYLE[item.category] || CAT_STYLE.OTHER;
  const { lineTotal } = computeItemTotals(item);

  return (
    <tr>
      <td style={P.td()}>
        <select
          value={item.category}
          onChange={(e) => onChange(index, 'category', e.target.value)}
          style={{ ...P.input, padding: '5px 8px', fontSize: 11, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`, fontWeight: 700 }}
        >
          {['CONSULTATION', 'PROCEDURE', 'MEDICINE', 'DIAGNOSTIC', 'OTHER'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td style={P.td()}>
        <input
          style={{ ...P.input, width: '100%', boxSizing: 'border-box', minWidth: 180 }}
          value={item.description}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          placeholder="Description"
        />
      </td>
      <td style={P.td('center')}>
        <input
          type="number" min="1"
          style={{ ...P.input, width: 56, textAlign: 'center' }}
          value={item.quantity}
          onChange={(e) => onChange(index, 'quantity', parseInt(e.target.value) || 1)}
        />
      </td>
      <td style={P.td('right')}>
        <input
          type="number" min="0"
          style={{ ...P.input, width: 90, textAlign: 'right', fontFamily: 'var(--font-mono)' }}
          value={item.unitPrice}
          onChange={(e) => onChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
        />
      </td>
      <td style={P.td('center')}>
        <select
          value={item.isGstExempt ? 'exempt' : String(item.taxRate)}
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'exempt') { onChange(index, 'isGstExempt', true); onChange(index, 'taxRate', 0); }
            else { onChange(index, 'isGstExempt', false); onChange(index, 'taxRate', parseFloat(v)); }
          }}
          style={{ ...P.input, padding: '5px 8px', fontSize: 11 }}
        >
          <option value="exempt">Exempt</option>
          <option value="5">5% GST</option>
          <option value="12">12% GST</option>
          <option value="18">18% GST</option>
        </select>
      </td>
      <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--navy)' }}>
        {fmt(lineTotal)}
      </td>
      <td style={P.td('center')}>
        <button style={{ ...P.btn('danger'), padding: '4px 8px' }} onClick={() => onRemove(index)}>
          <Trash2 size={12} />
        </button>
      </td>
    </tr>
  );
}

export default function ClinicBillEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, tenant } = useAuth();
  const isMobile = useBreakpoint();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [procedures, setProcedures] = useState([]);
  const [activeCategory, setActiveCategory] = useState('CONSULTATION');

  // Form state
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState(user?.name || '');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [cashAmount, setCashAmount] = useState(0);
  const [upiAmount, setUpiAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [billNumber, setBillNumber] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [status, setStatus] = useState('DRAFT');

  useEffect(() => {
    loadProcedures();
    if (!isNew) loadBill();
    if (searchParams.get('print') === '1') setTimeout(() => window.print(), 800);
  }, [id]);

  const loadProcedures = async () => {
    try {
      const res = await getClinicProcedures();
      setProcedures(res.data || []);
    } catch { /* noop */ }
  };

  const loadBill = async () => {
    try {
      const res = await getClinicBillById(id);
      const b = res.data;
      setPatientName(b.patientName || '');
      setPatientPhone(b.patientPhone || '');
      setDoctorName(b.doctorName || '');
      setDiscountAmount(b.discountAmount || 0);
      setNotes(b.notes || '');
      setItems(b.items || []);
      setCashAmount(b.cashAmount || 0);
      setUpiAmount(b.upiAmount || 0);
      setCardAmount(b.cardAmount || 0);
      setBillNumber(b.billNumber);
      setCreatedAt(b.createdAt);
      setStatus(b.status);
    } catch {
      toast.error('Bill not found');
      navigate('/clinic-billing');
    } finally { setLoading(false); }
  };

  const addItem = useCallback((proc) => {
    setItems((prev) => [...prev, {
      category: proc.category,
      description: proc.description,
      quantity: 1,
      unitPrice: proc.defaultPrice,
      discount: 0,
      isGstExempt: proc.isGstExempt ?? true,
      taxRate: proc.taxRate || 0,
    }]);
  }, []);

  const addManualItem = () => {
    setItems((prev) => [...prev, {
      category: 'OTHER', description: '', quantity: 1,
      unitPrice: 0, discount: 0, isGstExempt: true, taxRate: 0,
    }]);
  };

  const updateItem = useCallback((idx, key, value) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item));
  }, []);

  const removeItem = useCallback((idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSave = async () => {
    if (!patientName.trim()) { toast.error('Patient name is required'); return; }
    if (items.length === 0) { toast.error('Add at least one item'); return; }

    setSaving(true);
    try {
      const payload = {
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim() || null,
        doctorName: doctorName.trim() || null,
        discountAmount: Number(discountAmount) || 0,
        notes: notes.trim() || null,
        cashAmount: Number(cashAmount) || 0,
        upiAmount: Number(upiAmount) || 0,
        cardAmount: Number(cardAmount) || 0,
        items,
      };

      if (isNew) {
        const res = await createClinicBill(payload);
        toast.success(`Bill ${res.data.billNumber} created`);
        navigate(`/clinic-billing/${res.data.id}`);
      } else {
        await updateClinicBill(id, payload);
        toast.success('Bill updated');
        loadBill();
      }
    } catch {
      toast.error('Failed to save bill');
    } finally { setSaving(false); }
  };

  const markFullyPaid = () => {
    const { totalAmount } = computeBillTotals(items, discountAmount);
    const totalPaid = cashAmount + upiAmount + cardAmount;
    const remaining = totalAmount - totalPaid;
    if (remaining > 0) setCashAmount((prev) => prev + remaining);
  };

  if (loading) return (
    <div style={{ ...P.wrap(isMobile), display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <span style={{ color: '#9CA3AF' }}>Loading…</span>
    </div>
  );

  const totals = computeBillTotals(items, discountAmount);
  const paidAmount = Number(cashAmount) + Number(upiAmount) + Number(cardAmount);
  const dueAmount = Math.max(0, totals.totalAmount - paidAmount);

  const categorizedProcs = procedures.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #bill-print-area, #bill-print-area * { visibility: visible !important; }
          #bill-print-area { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; background: #fff !important; }
          .no-print { display: none !important; }
        }
        @media print and (max-width: 100mm) {
          #bill-print-area { font-size: 10px !important; padding: 6px !important; }
        }
      `}</style>

      <div style={P.wrap(isMobile)}>
        {/* Header */}
        <div style={{ ...P.head, marginBottom: 24 }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={P.btn('ghost')} onClick={() => navigate('/clinic-billing')}><ChevronLeft size={16} /></button>
            <div>
              <h1 style={P.h1(isMobile)}>{isNew ? 'New Bill' : `Bill — ${billNumber}`}</h1>
              {!isNew && <p style={P.sub}>Created {fmtDate(createdAt)} · <strong style={{ color: status === 'PAID' ? '#059669' : status === 'PENDING' ? '#D97706' : '#374151' }}>{status}</strong></p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isNew && <button style={P.btn('secondary')} onClick={() => window.print()}><Printer size={14} /> Print</button>}
            <button style={P.btn('primary')} onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : isNew ? 'Create Bill' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: 16, alignItems: 'start' }}>
          {/* ── Left column: bill builder ───────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="no-print">
            {/* Patient + Doctor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={P.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <User size={13} color="var(--cyan)" />
                  <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--navy)' }}>Patient</span>
                </div>
                <input style={{ ...P.input, width: '100%', boxSizing: 'border-box', marginBottom: 8 }} placeholder="Patient name *" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                <input style={{ ...P.input, width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }} placeholder="Mobile" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} />
              </div>
              <div style={P.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <Stethoscope size={13} color="var(--cyan)" />
                  <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--navy)' }}>Doctor</span>
                </div>
                <input style={{ ...P.input, width: '100%', boxSizing: 'border-box' }} placeholder="Doctor name" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
              </div>
            </div>

            {/* Quick-add consultation */}
            <div style={P.card}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>Quick Add — Consultation</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CONSULTATION_QUICK.map((c) => (
                  <button key={c.description} onClick={() => addItem({ ...c, category: 'CONSULTATION', isGstExempt: true, taxRate: 0 })}
                    style={{ ...P.btn('secondary'), fontSize: 12, padding: '6px 12px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                    + {c.description.replace('Consultation — ', '')} <span style={{ fontFamily: 'var(--font-mono)', marginLeft: 4, color: '#6B7280' }}>{fmt(c.unitPrice)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Procedure catalog */}
            <div style={P.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Add Service / Procedure</span>
                <button style={{ ...P.btn('secondary'), padding: '5px 10px', fontSize: 11 }} onClick={addManualItem}>
                  <Plus size={11} /> Manual entry
                </button>
              </div>
              {/* Category tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                {Object.keys(categorizedProcs).map((cat) => {
                  const cs = CAT_STYLE[cat] || CAT_STYLE.OTHER;
                  return (
                    <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: activeCategory === cat ? cs.bg : '#F9FAFB',
                      color: activeCategory === cat ? cs.color : '#6B7280',
                      border: `1px solid ${activeCategory === cat ? cs.border : 'var(--border)'}`,
                    }}>
                      {cat}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                {(categorizedProcs[activeCategory] || []).map((proc) => (
                  <button key={proc.code} onClick={() => addItem(proc)} style={{
                    padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    background: '#F9FAFB', border: '1px solid var(--border)', color: 'var(--ink)',
                    textAlign: 'left', display: 'flex', gap: 6, alignItems: 'center',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#F9FAFB'; }}>
                    <Plus size={10} color="var(--cyan)" />
                    <span>{proc.description}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#6B7280', fontSize: 10 }}>{fmt(proc.defaultPrice)}</span>
                    {!proc.isGstExempt && <span style={{ fontSize: 9, background: '#FEF3C7', color: '#D97706', borderRadius: 3, padding: '1px 4px' }}>{proc.taxRate}% GST</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Bill items table */}
            {items.length > 0 && (
              <div style={P.tableWrap}>
                <div style={P.tableScroll}>
                  <table style={P.table}>
                    <thead style={P.thead}>
                      <tr>
                        <th style={P.th()}>Category</th>
                        <th style={P.th()}>Description</th>
                        <th style={P.th('center')}>Qty</th>
                        <th style={P.th('right')}>Price</th>
                        <th style={P.th('center')}>GST</th>
                        <th style={P.th('right')}>Total</th>
                        <th style={P.th('center')}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <BillItemRow key={i} item={item} index={i} onChange={updateItem} onRemove={removeItem} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div style={{ ...P.card, textAlign: 'center', padding: 32, color: '#9CA3AF' }}>
                <Receipt size={28} color="#D1D5DB" />
                <p style={{ marginTop: 8, fontSize: 13 }}>No items yet. Click a consultation or procedure above to add.</p>
              </div>
            )}

            {/* Notes */}
            <div style={P.card}>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Notes</label>
              <textarea style={{ ...P.input, width: '100%', boxSizing: 'border-box', height: 60, resize: 'vertical' }}
                placeholder="Payment notes, remarks…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          {/* ── Right column: payment summary ──────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="no-print">
            {/* Totals card */}
            <div style={P.card}>
              <div style={{ ...P.sectionTitle, marginBottom: 14 }}>Bill Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Subtotal</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(totals.subtotal)}</span>
                </div>
                {totals.exemptAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6B7280', fontSize: 12 }}>GST-Exempt (Health services)</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fmt(totals.exemptAmount)}</span>
                  </div>
                )}
                {totals.taxableAmount > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280', fontSize: 12 }}>Taxable amount</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fmt(totals.taxableAmount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#D97706', fontSize: 12 }}>+ GST</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#D97706' }}>+{fmt(totals.gstAmount)}</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6B7280' }}>Discount</span>
                  <input type="number" min="0" style={{ ...P.input, width: 90, textAlign: 'right', fontFamily: 'var(--font-mono)' }}
                    value={discountAmount} onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, borderTop: '1.5px solid var(--border)', paddingTop: 10, marginTop: 2 }}>
                  <span style={{ color: 'var(--navy)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--navy)' }}>{fmt(totals.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment modes */}
            <div style={P.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ ...P.sectionTitle, marginBottom: 0 }}>Payment</span>
                {dueAmount > 0 && (
                  <button style={{ ...P.btn('secondary'), fontSize: 11, padding: '4px 10px' }} onClick={markFullyPaid}>
                    <CheckCircle size={11} /> Mark Paid
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Cash',  icon: Wallet,      val: cashAmount,  set: setCashAmount,  color: '#059669' },
                  { label: 'UPI',   icon: Smartphone,  val: upiAmount,   set: setUpiAmount,   color: '#2563EB' },
                  { label: 'Card',  icon: CreditCard,  val: cardAmount,  set: setCardAmount,  color: '#7C3AED' },
                ].map(({ label, icon: Icon, val, set, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={15} color={color} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, width: 36, color: '#374151' }}>{label}</span>
                    <input type="number" min="0" style={{ ...P.input, flex: 1, textAlign: 'right', fontFamily: 'var(--font-mono)' }}
                      value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)} />
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#6B7280' }}>Paid</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 700 }}>{fmt(paidAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}>
                  <span style={{ color: dueAmount > 0 ? '#D97706' : '#059669' }}>
                    {dueAmount > 0 ? 'Due' : '✓ Settled'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: dueAmount > 0 ? '#D97706' : '#059669' }}>
                    {dueAmount > 0 ? fmt(dueAmount) : fmt(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Save button */}
            <button style={{ ...P.btn('primary'), width: '100%', justifyContent: 'center', padding: '12px' }} onClick={handleSave} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving…' : isNew ? 'Create Bill' : 'Save Changes'}
            </button>
            {!isNew && (
              <button style={{ ...P.btn('secondary'), width: '100%', justifyContent: 'center', padding: '10px' }} onClick={() => window.print()}>
                <Printer size={14} /> Print Bill
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── PRINT AREA (A4) ──────────────────────────────────────────────────── */}
      <div id="bill-print-area" style={{
        display: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
        padding: '24px 32px', maxWidth: 700, margin: '0 auto',
        fontSize: 13, color: '#1A2535',
      }}>
        {/* Clinic header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1E2B3C', paddingBottom: 14, marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, fontFamily: "'Bricolage Grotesque', sans-serif", color: '#1E2B3C', letterSpacing: '-0.02em' }}>
              {tenant?.name || 'Clinic Name'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
              {tenant?.address || ''}{tenant?.phone ? ` · ${tenant.phone}` : ''}
              {tenant?.gstin ? ` · GSTIN: ${tenant.gstin}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1E2B3C' }}>BILL</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#17B9D0' }}>{billNumber || 'DRAFT'}</div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>{fmtDate(createdAt || new Date())}</div>
          </div>
        </div>

        {/* Patient */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Bill To</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{patientName}</div>
            {patientPhone && <div style={{ fontSize: 12, fontFamily: 'monospace' }}>{patientPhone}</div>}
          </div>
          {doctorName && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Doctor</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Dr. {doctorName}</div>
            </div>
          )}
        </div>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#1E2B3C', color: '#fff' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>#</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>Qty</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Rate</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>GST</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const { lineTotal } = computeItemTotals(item);
              const cs = CAT_STYLE[item.category] || CAT_STYLE.OTHER;
              return (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '7px 10px', color: '#9CA3AF' }}>{i + 1}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <div style={{ fontWeight: 600 }}>{item.description}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: cs.color, marginTop: 1 }}>{item.category}</div>
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(item.unitPrice)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: 11 }}>
                    {item.isGstExempt ? <span style={{ color: '#059669' }}>Exempt</span> : `${item.taxRate}%`}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmt(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={{ width: 240 }}>
            {[
              { label: 'Subtotal',           val: totals.subtotal,      dim: false },
              totals.taxableAmount > 0 && { label: 'GST',   val: totals.gstAmount,   dim: false, amber: true },
              discountAmount > 0 && { label: 'Discount',    val: -discountAmount,    dim: true },
            ].filter(Boolean).map(({ label, val, dim, amber }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12, color: amber ? '#D97706' : dim ? '#9CA3AF' : '#374151' }}>
                <span>{label}</span>
                <span style={{ fontFamily: 'monospace' }}>{val < 0 ? `−${fmt(-val)}` : fmt(val)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid #1E2B3C', paddingTop: 6, marginTop: 4, fontWeight: 800, fontSize: 15, color: '#1E2B3C' }}>
              <span>Total</span>
              <span style={{ fontFamily: 'monospace' }}>{fmt(totals.totalAmount)}</span>
            </div>
            {paidAmount > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: '#059669' }}>
                  <span>Paid ({[cashAmount > 0 && 'Cash', upiAmount > 0 && 'UPI', cardAmount > 0 && 'Card'].filter(Boolean).join(' + ')})</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmt(paidAmount)}</span>
                </div>
                {dueAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#D97706', fontWeight: 800 }}>
                    <span>Balance Due</span>
                    <span style={{ fontFamily: 'monospace' }}>{fmt(dueAmount)}</span>
                  </div>
                )}
                {dueAmount <= 0 && (
                  <div style={{ marginTop: 6, textAlign: 'center', background: '#ECFDF5', borderRadius: 6, padding: '6px', color: '#059669', fontWeight: 700, fontSize: 12 }}>
                    ✓ PAID IN FULL
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {notes && <div style={{ marginBottom: 12, padding: '8px 12px', background: '#F4F7FA', borderRadius: 6, fontSize: 12 }}><strong>Notes:</strong> {notes}</div>}

        {/* GST note */}
        {totals.exemptAmount > 0 && (
          <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 10 }}>
            * Medical consultation and treatment services are exempt from GST as per Notification No. 12/2017-CT (Rate).
            {totals.taxableAmount > 0 && ' Cosmetic/non-medical procedures are taxable at applicable GST rates.'}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #D5DCE8', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280' }}>
          <div>
            <div>Generated by Syllabrix HMS</div>
            <div style={{ fontFamily: 'monospace', marginTop: 2 }}>{billNumber || 'DRAFT'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #1E2B3C', paddingTop: 6, minWidth: 120 }}>Authorized Signatory</div>
          </div>
        </div>
      </div>
    </>
  );
}
