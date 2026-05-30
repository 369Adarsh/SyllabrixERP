import { useState, useEffect, useCallback, useRef } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useBranch } from '../../context/BranchContext';
import KpiBar from '../../components/ui/KpiBar';
import { P } from '../../styles/page';
import { getExpenses, getExpenseSummary, createExpense, updateExpense, deleteExpense, uploadExpenseReceipt, removeExpenseReceipt } from '../../api';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, TrendingDown, ReceiptText, PieChart, Filter, X,
  Paperclip, Eye, Upload, CheckCircle, AlertCircle, FileText, Image,
} from 'lucide-react';

const CATEGORIES = ['RENT','UTILITIES','SALARIES','MARKETING','SUPPLIES','MAINTENANCE','TRANSPORT','TAXES','INSURANCE','PROFESSIONAL_FEES','CONTRACT_LABOR','OTHER'];

const TDS_APPLICABLE = ['RENT', 'PROFESSIONAL_FEES', 'CONTRACT_LABOR'];
const TDS_INFO = {
  RENT:              { section: '194I', rate: 10, threshold: '₹2.4L/yr' },
  PROFESSIONAL_FEES: { section: '194J', rate: 10, threshold: '₹30K' },
  CONTRACT_LABOR:    { section: '194C', rate: 2,  threshold: '₹30K' },
};
const METHODS    = ['CASH','CARD','UPI','BANK_TRANSFER','CHEQUE'];

const CATEGORY_COLORS = {
  RENT: '#6366F1', UTILITIES: '#0EA5E9', SALARIES: '#F59E0B',
  MARKETING: '#EC4899', SUPPLIES: '#10B981', MAINTENANCE: '#F97316',
  TRANSPORT: '#8B5CF6', TAXES: '#EF4444', INSURANCE: '#14B8A6',
  PROFESSIONAL_FEES: '#7C3AED', CONTRACT_LABOR: '#B45309', OTHER: '#6B7280',
};

const fmt     = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';


// ── Utility: resolve receipt URL ──────────────────────────────────────────────
const receiptSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''}/uploads/receipts/${url.replace('/uploads/receipts/', '')}`;
};

const isPdf = (url) => url?.toLowerCase().endsWith('.pdf');

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, maxWidth = 480 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF' }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Receipt Viewer modal ──────────────────────────────────────────────────────
function ReceiptViewer({ expense, onClose, onRemove }) {
  const src = receiptSrc(expense.receipt);
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!confirm('Remove this receipt?')) return;
    setRemoving(true);
    try { await onRemove(); onClose(); }
    catch { toast.error('Failed to remove receipt'); }
    finally { setRemoving(false); }
  };

  return (
    <Modal title="Bill Receipt" onClose={onClose} maxWidth={720}>
      <div style={{ marginBottom: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--navy)' }}>{expense.description}</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
            {fmtDate(expense.date)} · {expense.category?.replace('_', ' ')} · <strong style={{ color: '#EF4444' }}>{fmt(expense.amount)}</strong>
          </div>
        </div>
        <a href={src} target="_blank" rel="noopener noreferrer"
          style={{ ...P.btn('secondary'), fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <Eye size={13} /> Open in new tab
        </a>
        <button onClick={handleRemove} disabled={removing}
          style={{ ...P.btn('danger'), fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Trash2 size={13} /> {removing ? 'Removing…' : 'Remove'}
        </button>
      </div>

      <div style={{ background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isPdf(expense.receipt) ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <FileText size={48} color="#6366F1" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>PDF Receipt</div>
            <a href={src} target="_blank" rel="noopener noreferrer" style={{ ...P.btn(), textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <Eye size={14} /> View PDF
            </a>
          </div>
        ) : (
          <img src={src} alt="receipt" style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 8 }} />
        )}
      </div>
    </Modal>
  );
}

// ── Upload zone (inline drag & drop) ─────────────────────────────────────────
function UploadZone({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef();

  const handleFile = (file) => {
    if (!file) return;
    const ok = /^image\/(jpeg|png|webp)$/.test(file.type) || file.type === 'application/pdf';
    if (!ok) return toast.error('Only JPEG, PNG, WebP or PDF allowed');
    if (file.size > 5 * 1024 * 1024) return toast.error('File must be under 5 MB');
    onFile(file);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => ref.current.click()}
      style={{
        border: `2px dashed ${dragging ? 'var(--cyan)' : '#D1D5DB'}`,
        borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
        background: dragging ? '#F0FDFE' : '#FAFAFA', transition: 'all 0.15s',
      }}
    >
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])} />
      <Upload size={20} color={dragging ? 'var(--cyan)' : '#9CA3AF'} style={{ marginBottom: 6 }} />
      <div style={{ fontSize: 13, fontWeight: 600, color: dragging ? 'var(--cyan)' : '#6B7280' }}>
        Drop bill here or click to upload
      </div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>JPEG · PNG · WebP · PDF — max 5 MB</div>
    </div>
  );
}

// ── Expense form modal ────────────────────────────────────────────────────────
function ExpenseModal({ expense, onClose, onSave }) {
  const { branchId } = useBranch();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    category:       expense?.category       || 'SUPPLIES',
    description:    expense?.description    || '',
    amount:         expense?.amount         || '',
    date:           expense?.date ? expense.date.slice(0, 10) : today,
    method:         expense?.method         || 'CASH',
    reference:      expense?.reference      || '',
    notes:          expense?.notes          || '',
    tdsApplicable:  expense?.tdsApplicable  || false,
    tdsRate:        expense?.tdsRate        || 0,
    tdsAmount:      expense?.tdsAmount      || '',
  });
  const [saving,         setSaving]         = useState(false);
  const [pendingFile,    setPendingFile]    = useState(null); // file chosen but not yet uploaded
  const [uploadingFile,  setUploadingFile]  = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(expense?.receipt || null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const field = (label, content) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
      {content}
    </div>
  );

  const handleSave = async () => {
    if (!form.amount || !form.description) return toast.error('Description and amount are required');
    setSaving(true);
    try {
      let savedExpense;
      if (expense) {
        savedExpense = await updateExpense(expense.id, form);
        toast.success('Expense updated');
      } else {
        savedExpense = await createExpense({ ...form, ...(branchId && { branchId }) });
        toast.success('Expense recorded');
      }

      // Upload pending receipt after saving the expense
      if (pendingFile) {
        setUploadingFile(true);
        try {
          const expId = expense?.id || savedExpense.data.data?.id;
          await uploadExpenseReceipt(expId, pendingFile);
        } catch { toast.error('Expense saved but receipt upload failed'); }
        finally { setUploadingFile(false); }
      }

      onSave();
    } catch { toast.error('Failed to save expense'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={expense ? 'Edit Expense' : 'Record Expense'} onClose={onClose}>
      {field('Category', (
        <select value={form.category} onChange={e => {
          const cat = e.target.value;
          set('category', cat);
          if (!TDS_APPLICABLE.includes(cat)) { set('tdsApplicable', false); set('tdsRate', 0); set('tdsAmount', ''); }
          else if (TDS_INFO[cat]) { set('tdsRate', TDS_INFO[cat].rate); }
        }} style={P.input}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
        </select>
      ))}
      {field('Description *', <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Monthly electricity bill" style={P.input} />)}
      {field('Amount (₹) *', <input type="number" value={form.amount} onChange={e => {
        const amt = e.target.value;
        set('amount', amt);
        if (form.tdsApplicable && form.tdsRate) set('tdsAmount', Math.round(Number(amt) * form.tdsRate) / 100);
      }} placeholder="0.00" style={P.input} />)}
      {field('Date', <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={P.input} />)}
      {field('Payment Method', (
        <select value={form.method} onChange={e => set('method', e.target.value)} style={P.input}>
          {METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
        </select>
      ))}
      {field('Reference / Bill No.', <input value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="INV-001" style={P.input} />)}
      {field('Notes', <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." rows={2} style={{ ...P.input, resize: 'vertical' }} />)}

      {/* TDS section — only for applicable categories */}
      {TDS_APPLICABLE.includes(form.category) && (
        <div style={{ background: '#F0F9FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.tdsApplicable ? 12 : 0 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>TDS Deductible</span>
              <span style={{ marginLeft: 8, fontSize: 11, color: '#6B7280' }}>
                Sec {TDS_INFO[form.category]?.section} · {TDS_INFO[form.category]?.rate}% · Threshold {TDS_INFO[form.category]?.threshold}
              </span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.tdsApplicable}
                onChange={e => {
                  const checked = e.target.checked;
                  const rate = checked ? (TDS_INFO[form.category]?.rate || 0) : 0;
                  const amt = checked && form.amount ? Math.round(Number(form.amount) * rate) / 100 : '';
                  set('tdsApplicable', checked);
                  set('tdsRate', rate);
                  set('tdsAmount', amt);
                }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8' }}>Apply TDS</span>
            </label>
          </div>
          {form.tdsApplicable && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>TDS Rate (%)</label>
                <input type="number" value={form.tdsRate} onChange={e => {
                  const rate = Number(e.target.value);
                  set('tdsRate', rate);
                  if (form.amount) set('tdsAmount', Math.round(Number(form.amount) * rate) / 100);
                }} style={{ ...P.input, background: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>TDS Amount (₹)</label>
                <input type="number" value={form.tdsAmount} onChange={e => set('tdsAmount', e.target.value)} style={{ ...P.input, background: '#fff' }} placeholder="Auto-calculated" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Receipt section */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
          Bill / Receipt <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span>
        </label>
        {currentReceipt ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 14px' }}>
            {isPdf(currentReceipt) ? <FileText size={18} color="#059669" /> : <Image size={18} color="#059669" />}
            <span style={{ fontSize: 13, color: '#065F46', fontWeight: 600, flex: 1 }}>Receipt attached</span>
            <button type="button" onClick={() => setCurrentReceipt(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 12 }}>Remove</button>
          </div>
        ) : pendingFile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 14px' }}>
            {pendingFile.type === 'application/pdf' ? <FileText size={18} color="#3B82F6" /> : <Image size={18} color="#3B82F6" />}
            <span style={{ fontSize: 13, color: '#1D4ED8', fontWeight: 600, flex: 1 }}>{pendingFile.name}</span>
            <button type="button" onClick={() => setPendingFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 12 }}>Remove</button>
          </div>
        ) : (
          <UploadZone onFile={setPendingFile} />
        )}
        {uploadingFile && <div style={{ fontSize: 12, color: 'var(--cyan)', marginTop: 6 }}>Uploading receipt…</div>}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onClose} style={P.btn('secondary')}>Cancel</button>
        <button onClick={handleSave} disabled={saving || uploadingFile} style={P.btn()}>
          {saving ? 'Saving...' : expense ? 'Update' : 'Record Expense'}
        </button>
      </div>
    </Modal>
  );
}

// ── Inline receipt upload button (in table row) ───────────────────────────────
function ReceiptCell({ expense, onUpdated }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const hasReceipt = !!expense.receipt;

  const handleFile = async (file) => {
    if (!file) return;
    const ok = /^image\/(jpeg|png|webp)$/.test(file.type) || file.type === 'application/pdf';
    if (!ok) return toast.error('Only JPEG, PNG, WebP or PDF allowed');
    if (file.size > 5 * 1024 * 1024) return toast.error('File must be under 5 MB');
    setUploading(true);
    try {
      await uploadExpenseReceipt(expense.id, file);
      toast.success('Receipt uploaded');
      onUpdated();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
        style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      {hasReceipt ? (
        <div title="Receipt attached" style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'default' }}>
          <CheckCircle size={11} /> Receipt
        </div>
      ) : (
        <button onClick={() => fileRef.current.click()} disabled={uploading} title="Upload receipt"
          style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
          {uploading ? '…' : <><Paperclip size={11} /> Attach</>}
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Expenses() {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [expenses,   setExpenses]   = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [viewReceipt, setViewReceipt] = useState(null); // expense obj
  const [filters,    setFilters]    = useState({ category: '', method: '', from: '', to: '', reconciled: '' });
  const [activeTab,  setActiveTab]  = useState('list');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.method)   params.method   = filters.method;
      if (filters.from)     params.from     = filters.from;
      if (filters.to)       params.to       = filters.to;
      if (branchId)         params.branchId = branchId;
      const [eRes, sRes] = await Promise.all([getExpenses(params), getExpenseSummary(params)]);
      setExpenses(eRes.data.data || []);
      setSummary(sRes.data.data || null);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  }, [filters, branchId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try { await deleteExpense(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleRemoveReceipt = async (expense) => {
    await removeExpenseReceipt(expense.id);
    toast.success('Receipt removed');
    load();
  };

  // Reconciliation stats
  const matched   = expenses.filter(e => !!e.receipt).length;
  const unmatched = expenses.length - matched;
  const matchPct  = expenses.length > 0 ? Math.round((matched / expenses.length) * 100) : 0;

  // Apply reconciled filter client-side
  const displayed = expenses.filter(e => {
    if (filters.reconciled === 'yes') return !!e.receipt;
    if (filters.reconciled === 'no')  return !e.receipt;
    return true;
  });

  const topCategory = summary?.byCategory?.sort((a, b) => b._sum.amount - a._sum.amount)[0];

  const TAB = (id, label) => (
    <button onClick={() => setActiveTab(id)} style={{
      padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
      border: 'none', background: activeTab === id ? 'var(--navy)' : 'transparent',
      color: activeTab === id ? '#fff' : '#6B7280',
    }}>{label}</button>
  );

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Expenses</h1>
          <p style={P.sub}>Track expenditure · attach bills · reconcile</p>
        </div>
        <button onClick={() => setModal('create')} style={P.btn()}>
          <Plus size={16} /> Record Expense
        </button>
      </div>

      <KpiBar stats={[
        { icon: TrendingDown, label: 'Total Expenses', value: fmt(summary?.total), sub: `${summary?.count || 0} transactions`, color: '#EF4444' },
        { icon: ReceiptText, label: 'Largest Category', value: topCategory?.category?.replace('_', ' ') || '—', sub: topCategory ? fmt(topCategory._sum.amount) : '', color: '#F59E0B' },
        { icon: PieChart, label: 'This Month', value: fmt(summary?.thisMonth ?? 0), sub: 'current month spend', color: '#6366F1' },
      ]} />

      {/* ── Reconciliation Banner ── */}
      {expenses.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Receipt Coverage</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: matchPct === 100 ? '#059669' : '#D97706' }}>{matchPct}% have receipts</span>
            </div>
            <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${matchPct}%`, background: matchPct === 100 ? '#10B981' : 'var(--cyan)', borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: '#059669' }}>
                <CheckCircle size={12} /> {matched} with receipts
              </span>
              <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: '#D97706' }}>
                <AlertCircle size={12} /> {unmatched} no receipt
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setFilters(f => ({ ...f, reconciled: f.reconciled === 'no' ? '' : 'no' }))}
              style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${filters.reconciled === 'no' ? '#D97706' : '#E5E7EB'}`, background: filters.reconciled === 'no' ? '#FEF3C7' : '#fff', color: filters.reconciled === 'no' ? '#92400E' : '#6B7280', cursor: 'pointer' }}>
              {filters.reconciled === 'no' ? '✕ Clear filter' : 'Show without receipts'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs + Filters */}
      <div style={{ ...P.card, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {TAB('list', 'All Expenses')}
          {TAB('summary', 'By Category')}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={14} color="#9CA3AF" />
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} style={{ ...P.input, width: 'auto', padding: '7px 10px' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
          <select value={filters.method} onChange={e => setFilters(f => ({ ...f, method: e.target.value }))} style={{ ...P.input, width: 'auto', padding: '7px 10px' }}>
            <option value="">All Methods</option>
            {METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} style={{ ...P.input, width: 'auto', padding: '7px 10px' }} />
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>to</span>
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} style={{ ...P.input, width: 'auto', padding: '7px 10px' }} />
          {(filters.category || filters.method || filters.from || filters.to || filters.reconciled) && (
            <button onClick={() => setFilters({ category: '', method: '', from: '', to: '', reconciled: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: 14 }}>Loading expenses...</div>
      ) : activeTab === 'list' ? (
        displayed.length === 0 ? (
          <div style={{ ...P.card, textAlign: 'center', padding: 60 }}>
            <TrendingDown size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
            <p style={{ color: '#9CA3AF', fontSize: 14 }}>
              {filters.reconciled === 'no' ? 'All expenses have bills attached!' : 'No expenses recorded yet.'}
            </p>
            {filters.reconciled !== 'no' && (
              <button onClick={() => setModal('create')} style={{ ...P.btn(), marginTop: 12 }}>Record First Expense</button>
            )}
          </div>
        ) : (
          <div style={P.tableWrap}>
            <div style={P.tableScroll}>
              <table style={{ ...P.table, minWidth: isMobile ? 560 : 'unset' }}>
                <thead style={P.thead}>
                  <tr>
                    {['Date', 'Category', 'Description', 'Method', 'Reference', 'Amount', 'Bill', ''].map(h => (
                      <th key={h} style={P.th()}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((e, i) => (
                    <tr key={e.id} style={P.tr(i, displayed.length)}>
                      <td style={P.td()}>{fmtDate(e.date)}</td>
                      <td style={P.td()}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: (CATEGORY_COLORS[e.category] || '#6B7280') + '18', color: CATEGORY_COLORS[e.category] || '#6B7280' }}>
                          {e.category?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ ...P.td(), color: '#111827', fontWeight: 500, maxWidth: 220 }}>
                        {e.description}
                        {e.notes && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{e.notes}</div>}
                      </td>
                      <td style={{ ...P.td(), color: '#6B7280' }}>{e.method?.replace('_', ' ')}</td>
                      <td style={{ ...P.td(), color: '#9CA3AF', fontSize: 13 }}>{e.reference || '—'}</td>
                      <td style={{ ...P.td(), fontWeight: 700, color: '#EF4444' }}>{fmt(e.amount)}</td>
                      <td style={P.td()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ReceiptCell expense={e} onUpdated={load} />
                          {e.receipt && (
                            <button onClick={() => setViewReceipt(e)} title="View bill"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 3, display: 'flex' }}>
                              <Eye size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={P.td()}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setModal(e)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(e.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 4 }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Summary / By Category tab */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {(summary?.byCategory || []).sort((a, b) => b._sum.amount - a._sum.amount).map(cat => {
            const pct   = summary.total > 0 ? ((cat._sum.amount / summary.total) * 100).toFixed(1) : 0;
            const color = CATEGORY_COLORS[cat.category] || '#6B7280';
            const catExpenses = expenses.filter(e => e.category === cat.category);
            const catMatched  = catExpenses.filter(e => !!e.receipt).length;
            return (
              <div key={cat.category} style={{ ...P.card, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: 3, width: `${pct}%`, background: color, borderRadius: '12px 0 0 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: color + '18', color }}>{cat.category?.replace('_', ' ')}</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{pct}%</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: 4 }}>{fmt(cat._sum.amount)}</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>{cat._count} transaction{cat._count !== 1 ? 's' : ''}</div>
                {/* Bill reconciliation per category */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600 }}>
                  <CheckCircle size={11} color={catMatched === catExpenses.length ? '#059669' : '#9CA3AF'} />
                  <span style={{ color: catMatched === catExpenses.length ? '#059669' : '#9CA3AF' }}>
                    {catMatched}/{catExpenses.length} bills attached
                  </span>
                </div>
                <div style={{ marginTop: 8, height: 6, background: '#F3F4F6', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            );
          })}
          {(!summary?.byCategory?.length) && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: 14 }}>No expense data for the selected period.</div>
          )}
        </div>
      )}

      {/* Modals */}
      {(modal === 'create' || (modal && modal !== 'create')) && (
        <ExpenseModal
          expense={modal !== 'create' ? modal : null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
      {viewReceipt && (
        <ReceiptViewer
          expense={viewReceipt}
          onClose={() => setViewReceipt(null)}
          onRemove={() => handleRemoveReceipt(viewReceipt)}
        />
      )}
    </div>
  );
}

