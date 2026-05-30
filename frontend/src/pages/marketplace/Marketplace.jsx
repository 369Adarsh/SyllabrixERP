import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Store, Search, Package, Users, Tag, Plus, Edit2, Trash2,
  CheckCircle, XCircle, Clock, ChevronRight, MessageSquare,
  TrendingDown, Building2, MapPin, Send, RefreshCw, ShoppingCart,
  AlertCircle, Eye, Star, Award, Shield, Zap, Hash, Wifi, WifiOff,
} from 'lucide-react';
import {
  getMyDisplayCatalog, addDisplayCatalogItem, updateDisplayCatalogItem, deleteDisplayCatalogItem,
  searchSuppliers, getLocalSuppliers, getSupplierProfile, getSupplierRatings,
  getMyPartnerships, sendPartnerRequest, respondToPartnerRequest, setPartnershipTerms,
  ratePartner, getSupplierCatalog, getMyNegotiations, requestBestPrice, respondToNegotiation,
} from '../../api/index';

const B2B_TYPES = ['DEALER', 'SUPPLIER', 'WHOLESALE'];
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const statusColor = { PENDING: '#F59E0B', ACTIVE: '#10B981', REJECTED: '#EF4444', SUSPENDED: '#6B7280' };
const negColor = { PENDING: '#F59E0B', COUNTERED: '#3B82F6', ACCEPTED: '#10B981', REJECTED: '#EF4444', EXPIRED: '#9CA3AF', PO_CREATED: '#8B5CF6' };
const negLabel = { PENDING: 'Awaiting Response', COUNTERED: 'Counter-Offer Made', ACCEPTED: 'Agreed', REJECTED: 'Rejected', EXPIRED: 'Expired', PO_CREATED: 'PO Created' };

const PAYMENT_TERMS_OPTIONS = [
  { value: 'COD', label: 'Cash on Delivery', desc: 'Pay at the time of delivery' },
  { value: 'ADVANCE_FULL', label: 'Full Advance', desc: '100% payment before dispatch' },
  { value: 'ADVANCE_PARTIAL', label: 'Partial Advance', desc: 'Partial payment upfront, rest on delivery' },
  { value: 'NET_15', label: 'Net 15', desc: 'Payment within 15 days of invoice' },
  { value: 'NET_30', label: 'Net 30', desc: 'Payment within 30 days of invoice' },
  { value: 'NET_45', label: 'Net 45', desc: 'Payment within 45 days of invoice' },
  { value: 'NET_60', label: 'Net 60', desc: 'Payment within 60 days of invoice' },
  { value: 'LETTER_OF_CREDIT', label: 'Letter of Credit', desc: 'Bank-backed guarantee for large orders' },
  { value: 'CUSTOM', label: 'Custom Terms', desc: 'Mutually agreed custom payment schedule' },
];
const ptLabel = (v) => PAYMENT_TERMS_OPTIONS.find(o => o.value === v)?.label || v || 'COD';
const ptColor = { COD: '#10B981', ADVANCE_FULL: '#EF4444', ADVANCE_PARTIAL: '#F59E0B', NET_15: '#3B82F6', NET_30: '#3B82F6', NET_45: '#8B5CF6', NET_60: '#8B5CF6', LETTER_OF_CREDIT: 'var(--navy)', CUSTOM: '#6B7280' };

// ── Star display ──────────────────────────────────────────────────────────────
const Stars = ({ value = 0, max = 5, size = 14, interactive = false, onChange }) => (
  <div style={{ display: 'inline-flex', gap: 2 }}>
    {Array.from({ length: max }).map((_, i) => (
      <Star key={i} size={size}
        fill={i < Math.round(value) ? '#F59E0B' : 'none'}
        color={i < Math.round(value) ? '#F59E0B' : '#D1D5DB'}
        style={{ cursor: interactive ? 'pointer' : 'default' }}
        onClick={() => interactive && onChange?.(i + 1)}
      />
    ))}
  </div>
);

// ── Pill Badge ────────────────────────────────────────────────────────────────
const Pill = ({ color, label }) => (
  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: color + '18', color, border: `1px solid ${color}40`, whiteSpace: 'nowrap' }}>{label}</span>
);

// ── Modal Shell ───────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: wide ? 760 : 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #F3F4F6' }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{title}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 20 }}>✕</button>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>{children}</div>
    </div>
  </div>
);

const Field = ({ label, children, half }) => (
  <div style={{ gridColumn: half ? 'span 1' : 'span 2' }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
    {children}
  </div>
);
const Input = (props) => (
  <input {...props} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', ...props.style }} />
);
const Textarea = (props) => (
  <textarea {...props} rows={3} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', ...props.style }} />
);
const Btn = ({ children, onClick, disabled, variant = 'primary', small, style: sx }) => {
  const styles = {
    primary: { background: 'var(--navy)', color: '#fff', border: 'none' },
    secondary: { background: '#F3F4F6', color: '#374151', border: '1.5px solid #E5E7EB' },
    danger: { background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #FECACA' },
    success: { background: '#ECFDF5', color: '#10B981', border: '1.5px solid #A7F3D0' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...styles[variant], borderRadius: 8, padding: small ? '6px 14px' : '9px 18px', fontSize: small ? 13 : 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', ...sx }}>
      {children}
    </button>
  );
};

// ─── Connect Modal (with payment terms) ──────────────────────────────────────
function ConnectModal({ supplier, onClose, onConnected }) {
  const [form, setForm] = useState({
    message: `Hello ${supplier.name}, we'd like to connect and explore your catalog.`,
    paymentTerms: 'COD',
    creditDays: '',
    advancePct: '',
    termsNotes: '',
  });
  const [saving, setSaving] = useState(false);

  const connect = async () => {
    setSaving(true);
    try {
      await sendPartnerRequest({
        supplierTenantId: supplier.id,
        message: form.message,
        paymentPrefs: {
          paymentTerms: form.paymentTerms,
          creditDays: form.creditDays ? Number(form.creditDays) : undefined,
          advancePct: form.advancePct ? Number(form.advancePct) : undefined,
          termsNotes: form.termsNotes || undefined,
        },
      });
      toast.success('Partnership request sent!');
      onConnected();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send request');
    } finally { setSaving(false); }
  };

  const selectedPt = PAYMENT_TERMS_OPTIONS.find(o => o.value === form.paymentTerms);

  return (
    <Modal title={`Connect with ${supplier.name}`} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, background: '#F0F4FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={20} color="var(--navy)" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{supplier.name}</div>
          <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
            {supplier.syllabrixId && <><Hash size={11} /><span style={{ fontFamily: 'monospace', color: 'var(--navy)' }}>{supplier.syllabrixId}</span></>}
            {supplier.city && <><MapPin size={11} />{supplier.city}{supplier.state ? `, ${supplier.state}` : ''}</>}
          </div>
          {supplier.avgRating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Stars value={supplier.avgRating} size={12} />
              <span style={{ fontSize: 11, color: '#6B7280' }}>{Number(supplier.avgRating).toFixed(1)} ({supplier.ratingCount} reviews)</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Introduction Message</label>
        <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={2} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Preferred Payment Terms</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {PAYMENT_TERMS_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setForm(p => ({ ...p, paymentTerms: opt.value }))}
              style={{ padding: '10px 12px', borderRadius: 10, border: `2px solid ${form.paymentTerms === opt.value ? 'var(--navy)' : '#E5E7EB'}`, background: form.paymentTerms === opt.value ? '#F0F4FF' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: form.paymentTerms === opt.value ? 'var(--navy)' : '#111827' }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {(form.paymentTerms === 'ADVANCE_PARTIAL') && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Advance Percentage (%)</label>
          <Input type="number" min="5" max="95" value={form.advancePct} onChange={e => setForm(p => ({ ...p, advancePct: e.target.value }))} placeholder="e.g. 30" />
        </div>
      )}
      {(['NET_15', 'NET_30', 'NET_45', 'NET_60'].includes(form.paymentTerms)) && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Credit Days</label>
          <Input type="number" min="1" value={form.creditDays} onChange={e => setForm(p => ({ ...p, creditDays: e.target.value }))} placeholder={form.paymentTerms.replace('NET_', '')} />
        </div>
      )}
      {form.paymentTerms === 'CUSTOM' && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Describe Your Terms</label>
          <Textarea value={form.termsNotes} onChange={e => setForm(p => ({ ...p, termsNotes: e.target.value }))} rows={2} placeholder="e.g. 50% advance, rest within 30 days of delivery..." />
        </div>
      )}

      {selectedPt && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={14} color="#10B981" />
          <span style={{ fontSize: 13, color: '#065F46' }}>
            <strong>{selectedPt.label}</strong> — {selectedPt.desc}. The supplier will agree or propose different terms.
          </span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={connect} disabled={saving}>{saving ? 'Sending…' : 'Send Request'}</Btn>
      </div>
    </Modal>
  );
}

// ─── Rate Partner Modal ────────────────────────────────────────────────────────
function RatingModal({ targetTenantId, targetName, onClose, onRated }) {
  const [ratings, setRatings] = useState({ overallRating: 0, qualityRating: 0, deliveryRating: 0, communicationRating: 0, paymentRating: 0 });
  const [review, setReview] = useState('');
  const [saving, setSaving] = useState(false);

  const dimensions = [
    { key: 'overallRating', label: 'Overall Experience', icon: Star },
    { key: 'qualityRating', label: 'Product Quality', icon: Award },
    { key: 'deliveryRating', label: 'Delivery & Logistics', icon: Zap },
    { key: 'communicationRating', label: 'Communication', icon: MessageSquare },
    { key: 'paymentRating', label: 'Payment Reliability', icon: Shield },
  ];

  const submit = async () => {
    if (ratings.overallRating === 0) return toast.error('Please give an overall rating');
    setSaving(true);
    try {
      await ratePartner(targetTenantId, { ...ratings, review });
      toast.success(`Rating submitted for ${targetName}`);
      onRated();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit rating');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={`Rate ${targetName}`} onClose={onClose}>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 0, marginBottom: 20 }}>
        Your ratings help other businesses make informed decisions. Rate based on your actual experience.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {dimensions.map(({ key, label, icon: Icon }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={15} color="#6B7280" />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{label}</span>
              {key === 'overallRating' && <span style={{ color: '#EF4444', fontSize: 12 }}>*</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Stars value={ratings[key]} size={20} interactive onChange={v => setRatings(p => ({ ...p, [key]: v }))} />
              <span style={{ fontSize: 13, color: '#9CA3AF', width: 18 }}>{ratings[key] || ''}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Written Review (optional)</label>
        <Textarea value={review} onChange={e => setReview(e.target.value)} rows={3} placeholder="Share your experience with this business partner..." />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit} disabled={saving || ratings.overallRating === 0}>{saving ? 'Submitting…' : 'Submit Rating'}</Btn>
      </div>
    </Modal>
  );
}

// ─── Supplier Profile Modal ────────────────────────────────────────────────────
function SupplierProfileModal({ supplierTenantId, onClose, onConnect }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupplierProfile(supplierTenantId)
      .then(r => setProfile(r.data?.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [supplierTenantId]);

  const p = profile;
  const rating = profile?.ratings;
  const ratingDimensions = [
    { key: 'avgQuality', label: 'Quality' },
    { key: 'avgDelivery', label: 'Delivery' },
    { key: 'avgCommunication', label: 'Communication' },
    { key: 'avgPayment', label: 'Payment' },
  ];

  return (
    <Modal title="Business Profile" onClose={onClose} wide>
      {loading && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>Loading profile…</div>}
      {!loading && !p && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>Profile not available.</div>}
      {!loading && p && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
            <div style={{ width: 64, height: 64, background: 'var(--navy)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={28} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#111827' }}>{p.name}</div>
              {p.syllabrixId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Hash size={12} color="var(--navy)" />
                  <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--navy)', fontWeight: 700 }}>{p.syllabrixId}</span>
                  <Pill color="var(--navy)" label="Verified ID" />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <Pill color="#8B5CF6" label={p.businessType} />
                {p.city && <span style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{p.city}, {p.state} {p.pincode}</span>}
                {p.gstin && <span style={{ fontSize: 12, color: '#6B7280' }}>GSTIN: {p.gstin}</span>}
              </div>
              {rating && rating.count > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Stars value={rating.avgOverall} size={16} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{Number(rating.avgOverall).toFixed(1)}</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>from {rating.count} partner reviews</span>
                </div>
              )}
            </div>
            <div style={{ flexShrink: 0 }}>
              {profile?.partnershipStatus !== 'ACTIVE' && (
                <Btn onClick={() => { onClose(); onConnect(p); }}><Plus size={14} />Connect</Btn>
              )}
              {profile?.partnershipStatus === 'ACTIVE' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: '#ECFDF5', color: '#059669', border: '1.5px solid #6EE7B7' }}>
                  <CheckCircle size={13} />Connected
                </span>
              )}
            </div>
          </div>

          {rating && rating.count > 0 && (
            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 12 }}>Rating Breakdown</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {ratingDimensions.map(({ key, label }) => rating[key] > 0 && (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Stars value={rating[key]} size={12} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{Number(rating[key]).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile?.ratings?.ratings?.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 10 }}>Recent Reviews</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {profile.ratings.ratings.map((r, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: '#fff', border: '1.5px solid #F3F4F6', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Stars value={r.overallRating} size={13} />
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{r.reviewer?.name}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>
                        {new Date(r.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {r.review && <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{r.review}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile?.catalogCount > 0 && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: '#F0F4FF', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 600 }}>
                <Package size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                {profile.catalogCount} item{profile.catalogCount !== 1 ? 's' : ''} in catalog
              </div>
              {profile?.partnershipStatus === 'ACTIVE' && <Pill color="#10B981" label="Access via Browse Catalog" />}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── Add/Edit Display Catalog Item Modal ─────────────────────────────────────
function CatalogItemModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    productName: item?.productName || '',
    description: item?.description || '',
    sku: item?.sku || '',
    unit: item?.unit || 'pcs',
    basePrice: item?.basePrice || '',
    moq: item?.moq || 1,
    maxOrderQty: item?.maxOrderQty || '',
    hsnCode: item?.hsnCode || '',
    taxRate: item?.taxRate || 0,
    category: item?.category || '',
    isAvailable: item?.isAvailable !== false,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.productName || !form.basePrice) return toast.error('Product name and price are required');
    setSaving(true);
    try {
      if (item) { await updateDisplayCatalogItem(item.id, form); toast.success('Item updated'); }
      else { await addDisplayCatalogItem(form); toast.success('Item added to your Display Catalog'); }
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const f = (k) => ({ value: form[k], onChange: (e) => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <Modal title={item ? 'Edit Catalog Item' : 'Add to Display Catalog'} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Product Name *"><Input {...f('productName')} placeholder="e.g. Basmati Rice 25kg" /></Field>
        <Field label="Category" half><Input {...f('category')} placeholder="e.g. Grains" /></Field>
        <Field label="SKU / Item Code" half><Input {...f('sku')} placeholder="Optional" /></Field>
        <Field label="Unit" half><Input {...f('unit')} placeholder="pcs / kg / bag" /></Field>
        <Field label="Base Price (₹) *" half><Input {...f('basePrice')} type="number" min="0" step="0.01" placeholder="0.00" /></Field>
        <Field label="Min Order Qty" half><Input {...f('moq')} type="number" min="1" /></Field>
        <Field label="Max Order Qty" half><Input {...f('maxOrderQty')} type="number" min="0" placeholder="No limit" /></Field>
        <Field label="GST Rate (%)" half><Input {...f('taxRate')} type="number" min="0" max="28" step="0.5" /></Field>
        <Field label="HSN Code" half><Input {...f('hsnCode')} placeholder="Optional" /></Field>
        <Field label="Description"><Textarea {...f('description')} placeholder="Brief description visible to buyers..." /></Field>
        {item && (
          <Field label="Availability" half>
            <select value={form.isAvailable} onChange={e => setForm(p => ({ ...p, isAvailable: e.target.value === 'true' }))}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14 }}>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
          </Field>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : (item ? 'Save Changes' : 'Add Item')}</Btn>
      </div>
    </Modal>
  );
}

// ─── Supplier Catalog Browse + Best Price Request ─────────────────────────────
function SupplierCatalogModal({ supplier, partnershipId, onClose, onNegotiationCreated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [negotiating, setNegotiating] = useState(null);
  const [negForm, setNegForm] = useState({ requestedQty: 1, buyerTargetPrice: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getSupplierCatalog(supplier.id)
      .then(r => setData(r.data?.data))
      .catch(() => toast.error('Failed to load catalog'))
      .finally(() => setLoading(false));
  }, [supplier.id]);

  const submitNeg = async () => {
    if (!negForm.buyerTargetPrice) return toast.error('Enter your target price');
    if (Number(negForm.buyerTargetPrice) >= negotiating.basePrice) return toast.error('Target price must be lower than listed price');
    setSubmitting(true);
    try {
      await requestBestPrice({ partnershipId, catalogItemId: negotiating.id, requestedQty: Number(negForm.requestedQty), buyerTargetPrice: Number(negForm.buyerTargetPrice), notes: negForm.notes });
      toast.success('Best price request sent!');
      setNegotiating(null);
      onNegotiationCreated?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send request');
    } finally { setSubmitting(false); }
  };

  return (
    <Modal title={`${supplier.name} — Catalog`} onClose={onClose} wide>
      {loading && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>Loading catalog…</div>}
      {!loading && data && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#6B7280', fontSize: 13 }}>
            <MapPin size={13} /><span>{[data.supplier?.city, data.supplier?.state].filter(Boolean).join(', ') || 'Location unknown'}</span>
            <span style={{ margin: '0 6px' }}>·</span>
            <Package size={13} /><span>{data.items?.length} item{data.items?.length !== 1 ? 's' : ''} available</span>
          </div>

          {negotiating && (
            <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: 18, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <TrendingDown size={16} color="#3B82F6" />
                <strong style={{ color: 'var(--navy)' }}>Request Best Price — {negotiating.productName}</strong>
                <span style={{ marginLeft: 'auto', color: '#6B7280', fontSize: 13 }}>Listed: {fmt(negotiating.basePrice)}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>QTY YOU NEED</label>
                  <Input type="number" min={negotiating.moq || 1} value={negForm.requestedQty} onChange={e => setNegForm(p => ({ ...p, requestedQty: e.target.value }))} />
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>Min: {negotiating.moq} {negotiating.unit}</span>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>YOUR TARGET PRICE (₹)</label>
                  <Input type="number" min="0" step="0.01" value={negForm.buyerTargetPrice} onChange={e => setNegForm(p => ({ ...p, buyerTargetPrice: e.target.value }))} style={{ borderColor: '#3B82F6' }} placeholder={`< ${negotiating.basePrice}`} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>MESSAGE (OPTIONAL)</label>
                  <Textarea value={negForm.notes} onChange={e => setNegForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="e.g. Regular bulk buyer, 3 orders/month..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Btn onClick={submitNeg} disabled={submitting}><Send size={14} />{submitting ? 'Sending…' : 'Send Request'}</Btn>
                <Btn variant="secondary" onClick={() => setNegotiating(null)}>Cancel</Btn>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.items?.length === 0 && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 32 }}>No items in this catalog yet.</div>}
            {data.items?.map(item => (
              <div key={item.id} style={{ border: '1.5px solid #E5E7EB', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, background: '#F3F4F6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={20} color="#9CA3AF" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 2 }}>{item.productName}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    {item.category && <span style={{ marginRight: 10 }}>{item.category}</span>}MOQ: {item.moq} {item.unit}
                    {item.hsnCode && <span style={{ marginLeft: 10 }}>HSN: {item.hsnCode}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{fmt(item.basePrice)}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>per {item.unit}</div>
                </div>
                <Btn variant="secondary" small onClick={() => { setNegotiating(item); setNegForm({ requestedQty: item.moq, buyerTargetPrice: '', notes: '' }); }}>
                  <TrendingDown size={13} />Best Price
                </Btn>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Negotiation Detail Modal ─────────────────────────────────────────────────
function NegotiationModal({ neg, role, onClose, onUpdated }) {
  const [form, setForm] = useState({ price: '', qty: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const respond = async (action) => {
    if (action === 'COUNTER' && !form.price) return toast.error('Enter counter price');
    setSubmitting(true);
    try {
      await respondToNegotiation(neg.id, { action, price: form.price, qty: form.qty, message: form.message });
      toast.success(action === 'ACCEPT' ? 'Price accepted!' : action === 'REJECT' ? 'Negotiation rejected' : 'Counter-offer sent');
      onUpdated();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const closed = ['ACCEPTED', 'REJECTED', 'EXPIRED', 'PO_CREATED'].includes(neg.status);
  const partnerName = role === 'buyer' ? neg.supplierTenant?.name : neg.buyerTenant?.name;

  return (
    <Modal title="Price Negotiation" onClose={onClose} wide>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 16px', background: '#F9FAFB', borderRadius: 10 }}>
        <Package size={20} color="#6B7280" />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{neg.catalogItem?.productName}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{role === 'buyer' ? 'Supplier' : 'Buyer'}: {partnerName}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>Listed Price</div>
          <div style={{ fontWeight: 700 }}>{fmt(neg.catalogItem?.basePrice)}</div>
        </div>
        <Pill color={negColor[neg.status]} label={negLabel[neg.status]} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Negotiation Timeline</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {neg.rounds?.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: r.offeredBy === 'BUYER' ? '#EFF6FF' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                {r.offeredBy === 'BUYER' ? <ShoppingCart size={14} color="#3B82F6" /> : <Store size={14} color="#10B981" />}
              </div>
              <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.offeredBy === 'BUYER' ? 'var(--navy)' : '#059669' }}>{r.offeredBy}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{fmt(r.price)} {r.qty && <span style={{ fontSize: 12, fontWeight: 400, color: '#6B7280' }}>× {r.qty} {neg.catalogItem?.unit}</span>}</div>
                {r.message && <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>{r.message}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {neg.finalPrice && (
        <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={18} color="#10B981" />
          <div>
            <div style={{ fontSize: 12, color: '#065F46', fontWeight: 600 }}>Final Agreed Price</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#059669' }}>{fmt(neg.finalPrice)}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6B7280' }}>
            Saving {((neg.catalogItem?.basePrice - neg.finalPrice) / neg.catalogItem?.basePrice * 100).toFixed(1)}% vs listed price
          </div>
        </div>
      )}

      {!closed && (
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Response</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>COUNTER PRICE (₹)</label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="Your offer" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>QTY (optional)</label>
              <Input type="number" min="0" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: e.target.value }))} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>MESSAGE</label>
              <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={2} placeholder="Optional note..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn variant="success" onClick={() => respond('ACCEPT')} disabled={submitting}><CheckCircle size={14} />Accept Current Offer</Btn>
            <Btn onClick={() => respond('COUNTER')} disabled={submitting || !form.price}><RefreshCw size={14} />Send Counter</Btn>
            <Btn variant="danger" onClick={() => respond('REJECT')} disabled={submitting}><XCircle size={14} />Reject</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Supplier Card ─────────────────────────────────────────────────────────────
function SupplierCard({ supplier, onConnect, onBrowse, onViewProfile, onRate, isExactMatch }) {
  const isActive = supplier.partnershipStatus === 'ACTIVE';
  const isPending = supplier.partnershipStatus === 'PENDING';
  const isRejected = supplier.partnershipStatus === 'REJECTED';

  const borderColor = isExactMatch ? 'var(--navy)' : isActive ? '#BBF7D0' : '#E5E7EB';
  const bgColor = isExactMatch ? '#F0F4FF' : isActive ? '#F0FDF4' : '#fff';

  return (
    <div style={{ border: `1.5px solid ${borderColor}`, borderRadius: 14, background: bgColor, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 44, height: 44, background: isActive ? '#D1FAE5' : '#F3F4F6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={20} color={isActive ? '#059669' : '#6B7280'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{supplier.name}</span>
            {isExactMatch && <Pill color="var(--navy)" label="Exact Match" />}
            {isActive && <Pill color="#059669" label="Connected" />}
            {isPending && <Pill color="#F59E0B" label="Request Sent" />}
            {isRejected && <Pill color="#EF4444" label="Rejected" />}
            <Pill color="#6B7280" label={supplier.businessType} />
            {supplier.paymentTerms && <Pill color={ptColor[supplier.paymentTerms] || '#6B7280'} label={ptLabel(supplier.paymentTerms)} />}
          </div>
          {supplier.syllabrixId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
              <Hash size={11} color="#9CA3AF" />
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B7280' }}>{supplier.syllabrixId}</span>
            </div>
          )}
          {supplier.city && (
            <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
              <MapPin size={11} />{supplier.city}{supplier.state ? `, ${supplier.state}` : ''}{supplier.pincode ? ` — ${supplier.pincode}` : ''}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
            {supplier.avgRating > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Stars value={supplier.avgRating} size={12} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{Number(supplier.avgRating).toFixed(1)}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>({supplier.ratingCount})</span>
              </div>
            ) : <span style={{ fontSize: 11, color: '#9CA3AF' }}>No ratings yet</span>}
            <span style={{ color: '#D1D5DB' }}>·</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{supplier.catalogCount || 0} catalog items</span>
          </div>
        </div>
      </div>
      {/* Action bar */}
      <div style={{ borderTop: '1px solid #F3F4F6', padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', background: '#FAFAFA' }}>
        <Btn variant="secondary" small onClick={() => onViewProfile(supplier.id)}><Eye size={12} />View Profile</Btn>
        {isActive && <Btn small onClick={() => onBrowse(supplier, supplier.partnershipId)}><Package size={12} />Browse Catalog</Btn>}
        {isActive && onRate && <Btn variant="secondary" small onClick={() => onRate(supplier)}><Star size={12} />Rate</Btn>}
        {!isActive && !isPending && !isRejected && (
          <Btn small onClick={() => onConnect(supplier)}><Plus size={13} />Connect</Btn>
        )}
      </div>
    </div>
  );
}

// ─── Negotiations Section ─────────────────────────────────────────────────────
function NegotiationsSection({ asBuyer, asSupplier, onView }) {
  const [subTab, setSubTab] = useState('buyer');
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[{ id: 'buyer', label: `As Buyer (${asBuyer.length})` }, { id: 'supplier', label: `As Supplier (${asSupplier.length})` }].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1.5px solid',
            borderColor: subTab === t.id ? 'var(--navy)' : '#E5E7EB',
            background: subTab === t.id ? '#F0F4FF' : '#fff',
            color: subTab === t.id ? 'var(--navy)' : '#6B7280',
          }}>{t.label}</button>
        ))}
      </div>
      {subTab === 'buyer' && <NegotiationList items={asBuyer} role="buyer" onView={onView} />}
      {subTab === 'supplier' && <NegotiationList items={asSupplier} role="supplier" onView={onView} />}
    </div>
  );
}

function NegotiationList({ items, role, onView }) {
  if (items.length === 0) return (
    <div style={{ textAlign: 'center', padding: 50, color: '#9CA3AF' }}>
      <TrendingDown size={36} style={{ marginBottom: 10, opacity: 0.4 }} />
      <div style={{ fontWeight: 600 }}>No negotiations yet</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>
        {role === 'buyer' ? 'Connect with a supplier and request best prices from their catalog.' : 'Negotiations will appear here when buyers request better prices.'}
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(neg => {
        const partner = role === 'buyer' ? neg.supplierTenant : neg.buyerTenant;
        const latestRound = neg.rounds?.[neg.rounds.length - 1];
        const needsAction = (role === 'buyer' && neg.status === 'COUNTERED') || (role === 'supplier' && neg.status === 'PENDING');
        return (
          <div key={neg.id} style={{ border: `1.5px solid ${needsAction ? '#BFDBFE' : '#E5E7EB'}`, borderRadius: 12, padding: 16, background: needsAction ? '#EFF6FF' : '#fff', cursor: 'pointer' }} onClick={() => onView(neg, role)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: '#F3F4F6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Package size={18} color="#6B7280" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{neg.catalogItem?.productName}</span>
                  <Pill color={negColor[neg.status]} label={negLabel[neg.status]} />
                  {needsAction && <Pill color="#EF4444" label="Action Needed" />}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  {role === 'buyer' ? 'Supplier' : 'Buyer'}: {partner?.name} · Qty: {neg.requestedQty} {neg.catalogItem?.unit}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>Listed</div>
                <div style={{ fontWeight: 700, fontSize: 14, textDecoration: neg.finalPrice ? 'line-through' : 'none', color: '#9CA3AF' }}>{fmt(neg.catalogItem?.basePrice)}</div>
                {neg.finalPrice && <div style={{ fontWeight: 800, fontSize: 16, color: '#10B981' }}>{fmt(neg.finalPrice)}</div>}
                {!neg.finalPrice && latestRound && <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{fmt(latestRound.price)}</div>}
              </div>
              <ChevronRight size={18} color="#9CA3AF" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Marketplace Page ────────────────────────────────────────────────────
export default function Marketplace() {
  const { tenant } = useAuth();
  const isSupplierType = B2B_TYPES.includes(tenant?.businessType);

  const [tab, setTab] = useState(isSupplierType ? 'catalog' : 'network');
  const [myCatalog, setMyCatalog] = useState([]);
  const [partnerships, setPartnerships] = useState({ sent: [], received: [] });
  const [localSuppliers, setLocalSuppliers] = useState({ sameCity: [], sameState: [] });
  const [negotiations, setNegotiations] = useState({ asBuyer: [], asSupplier: [] });
  const [loading, setLoading] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isExactMatch, setIsExactMatch] = useState(false);

  const [editItem, setEditItem] = useState(null);
  const [addItem, setAddItem] = useState(false);
  const [browsing, setBrowsing] = useState(null);
  const [viewNeg, setViewNeg] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [rating, setRating] = useState(null);
  const [viewProfile, setViewProfile] = useState(null);

  const searchTimer = useRef(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cat, parts, negs] = await Promise.all([
        isSupplierType ? getMyDisplayCatalog() : Promise.resolve({ data: { data: [] } }),
        getMyPartnerships(),
        getMyNegotiations(),
      ]);
      setMyCatalog(cat.data?.data || []);
      setPartnerships(parts.data?.data || { sent: [], received: [] });
      setNegotiations(negs.data?.data || { asBuyer: [], asSupplier: [] });
    } catch { toast.error('Failed to load marketplace data'); }
    finally { setLoading(false); }
  }, [isSupplierType]);

  const loadLocal = useCallback(async () => {
    setLocalLoading(true);
    try {
      const r = await getLocalSuppliers();
      setLocalSuppliers(r.data?.data || { sameCity: [], sameState: [] });
    } catch { /* silent */ }
    finally { setLocalLoading(false); }
  }, []);

  useEffect(() => { loadAll(); loadLocal(); }, [loadAll, loadLocal]);

  const isSyllabrixId = (q) => /^SYL[A-Z0-9]{6}$/i.test((q || '').trim());

  const doSearch = (q) => {
    clearTimeout(searchTimer.current);
    setSearchQ(q);
    if (!q.trim()) { setSearchResults(null); setIsExactMatch(false); return; }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await searchSuppliers(q);
        const results = r.data?.data || [];
        setSearchResults(results);
        setIsExactMatch(isSyllabrixId(q) && results.length === 1);
      } catch { toast.error('Search failed'); }
      finally { setSearchLoading(false); }
    }, 400);
  };

  const handleConnected = () => {
    setConnecting(null);
    if (searchQ) doSearch(searchQ);
    loadAll();
    loadLocal();
  };

  const handleRespond = async (partnershipId, accept) => {
    try {
      await respondToPartnerRequest(partnershipId, accept);
      toast.success(accept ? 'Partnership accepted!' : 'Request rejected');
      loadAll();
    } catch { toast.error('Failed'); }
  };

  const pendingReceived = partnerships.received?.filter(p => p.status === 'PENDING') || [];
  const activePartnerships = [...(partnerships.sent || []), ...(partnerships.received || [])].filter(p => {
    if (p.status !== 'ACTIVE') return false;
    const isRequester = p.requesterTenantId === tenant?.id;
    const partner = isRequester ? p.supplier : p.requester;
    return B2B_TYPES.includes(partner?.businessType);
  });
  const totalPendingNegs = (negotiations.asBuyer?.filter(n => n.status === 'COUNTERED') || []).length +
    (negotiations.asSupplier?.filter(n => n.status === 'PENDING') || []).length;
  const allLocalSuppliers = [...(localSuppliers.sameCity || []), ...(localSuppliers.sameState || [])];

  const TABS = [
    ...(isSupplierType ? [{ id: 'catalog', label: 'My Display Catalog', icon: Store }] : []),
    { id: 'network', label: 'Supplier Network', icon: Users },
    { id: 'negotiations', label: 'Price Negotiations', icon: TrendingDown, badge: totalPendingNegs || null },
  ];

  const sharedCardProps = {
    onConnect: (s) => setConnecting(s),
    onBrowse: (sup, pid) => setBrowsing({ supplier: sup, partnershipId: pid }),
    onViewProfile: (id) => setViewProfile(id),
    onRate: (s) => setRating(s),
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, background: 'var(--navy)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>B2B Marketplace</h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Connect with suppliers, verify partners, negotiate prices with confidence</p>
          </div>
          {isSupplierType && <div style={{ marginLeft: 'auto' }}><Pill color="var(--navy)" label={tenant?.businessType} /></div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 16 }}>
          {[
            { label: 'Active Partners', value: activePartnerships.length, color: '#10B981', icon: CheckCircle },
            { label: 'Pending Requests', value: pendingReceived.length, color: '#F59E0B', icon: Clock },
            { label: 'Open Negotiations', value: (negotiations.asBuyer?.filter(n => !['ACCEPTED','REJECTED','EXPIRED'].includes(n.status)) || []).length, color: '#3B82F6', icon: TrendingDown },
            { label: 'Nearby Suppliers', value: allLocalSuppliers.length, color: '#8B5CF6', icon: MapPin },
            ...(isSupplierType ? [{ label: 'Catalog Items', value: myCatalog.length, color: '#EC4899', icon: Package }] : []),
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: color + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #F3F4F6' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'none',
            color: tab === t.id ? 'var(--navy)' : '#6B7280',
            borderBottom: `3px solid ${tab === t.id ? 'var(--navy)' : 'transparent'}`,
            marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6, position: 'relative',
          }}>
            <t.icon size={15} />{t.label}
            {t.badge && (
              <span style={{ position: 'absolute', top: 4, right: 4, background: '#EF4444', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 800, padding: '1px 5px', minWidth: 16, textAlign: 'center' }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: My Display Catalog ── */}
      {tab === 'catalog' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Your Published Catalog</h2>
              <p style={{ color: '#6B7280', fontSize: 13, margin: '2px 0 0' }}>Items your connected buyers can browse and request prices for</p>
            </div>
            <Btn onClick={() => setAddItem(true)}><Plus size={15} />Add Item</Btn>
          </div>
          {loading && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>Loading…</div>}
          {!loading && myCatalog.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
              <Store size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontWeight: 600 }}>No items published yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Add products to your Display Catalog so connected buyers can browse and request prices.</div>
              <Btn onClick={() => setAddItem(true)} style={{ marginTop: 16 }}><Plus size={15} />Add First Item</Btn>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {myCatalog.map(item => (
              <div key={item.id} style={{ border: '1.5px solid #E5E7EB', borderRadius: 14, padding: 16, background: '#fff', opacity: item.isAvailable ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{item.productName}</div>
                    {item.category && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{item.category}</div>}
                  </div>
                  <Pill color={item.isAvailable ? '#10B981' : '#9CA3AF'} label={item.isAvailable ? 'Live' : 'Off'} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>{fmt(item.basePrice)}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>per {item.unit} · MOQ {item.moq} · GST {item.taxRate}%{item.sku && ` · SKU: ${item.sku}`}</div>
                {item.description && <div style={{ fontSize: 13, color: '#374151', marginBottom: 12, lineHeight: 1.4 }}>{item.description}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="secondary" small onClick={() => setEditItem(item)}><Edit2 size={12} />Edit</Btn>
                  <Btn variant="danger" small onClick={async () => {
                    if (!window.confirm('Remove this item from your catalog?')) return;
                    try { await deleteDisplayCatalogItem(item.id); toast.success('Removed'); loadAll(); }
                    catch { toast.error('Failed'); }
                  }}><Trash2 size={12} /></Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Supplier Network ── */}
      {tab === 'network' && (
        <div>

          {/* ── SECTION A: Syllabrix Network ─────────────────────────────────── */}
          <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 14, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#16A34A', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wifi size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#14532D' }}>Syllabrix Network — Online Suppliers</div>
              <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>
                These are businesses that are registered on Syllabrix. You can connect, browse their catalog, and negotiate prices digitally.
              </div>
            </div>
          </div>

          {/* Pending partner requests received */}
          {pendingReceived.length > 0 && (
            <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#92400E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} />{pendingReceived.length} Pending Partnership Request{pendingReceived.length > 1 ? 's' : ''}
              </div>
              {pendingReceived.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid #FED7AA' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.requester?.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      {p.requester?.businessType} · {p.requester?.city}
                      {p.paymentTerms && <> · Proposed: <strong>{ptLabel(p.paymentTerms)}</strong></>}
                    </div>
                    {p.message && <div style={{ fontSize: 12, color: '#374151', fontStyle: 'italic', marginTop: 2 }}>"{p.message}"</div>}
                  </div>
                  <Btn variant="success" small onClick={() => handleRespond(p.id, true)}><CheckCircle size={13} />Accept</Btn>
                  <Btn variant="danger" small onClick={() => handleRespond(p.id, false)}><XCircle size={13} />Reject</Btn>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: searchLoading ? 'var(--navy)' : '#9CA3AF' }} />
            <input value={searchQ} onChange={e => doSearch(e.target.value)}
              placeholder="Search Syllabrix businesses by name, city, or Syllabrix ID (e.g. SYLABCD12)…"
              style={{ width: '100%', padding: '11px 14px 11px 40px', border: `1.5px solid ${searchQ && isSyllabrixId(searchQ) ? 'var(--navy)' : '#E5E7EB'}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            {searchQ && isSyllabrixId(searchQ) && (
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <Pill color="var(--navy)" label="ID Search" />
              </div>
            )}
          </div>

          {/* Search results */}
          {searchResults !== null && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                {searchLoading ? 'Searching…' : (
                  <>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQ}"
                    {isExactMatch && <Pill color="var(--navy)" label="Exact Syllabrix ID Match" />}
                  </>
                )}
              </div>
              {searchResults.length === 0 && !searchLoading && (
                <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', background: '#F9FAFB', borderRadius: 12 }}>
                  <Search size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div style={{ fontWeight: 600 }}>No Syllabrix businesses found</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Your offline vendors are shown below — invite them to join Syllabrix.</div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {searchResults.map(s => <SupplierCard key={s.id} supplier={s} isExactMatch={isExactMatch && searchResults.length === 1} {...sharedCardProps} />)}
              </div>
            </div>
          )}

          {/* Active partners */}
          {activePartnerships.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Connected Partners ({activePartnerships.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activePartnerships.map(p => {
                  const isRequester = p.requesterTenantId === tenant?.id;
                  const partner = isRequester ? p.supplier : p.requester;
                  const enrichedPartner = { ...(partner || {}), partnershipStatus: 'ACTIVE', partnershipId: p.id, paymentTerms: p.paymentTerms };
                  return <SupplierCard key={p.id} supplier={enrichedPartner} {...sharedCardProps} />;
                })}
              </div>
            </div>
          )}

          {/* Pending sent */}
          {partnerships.sent?.filter(p => p.status === 'PENDING').length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Requests Sent</div>
              {partnerships.sent.filter(p => p.status === 'PENDING').map(p => (
                <div key={p.id} style={{ border: '1.5px solid #FEF3C7', borderRadius: 10, padding: '12px 16px', background: '#FFFBEB', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Clock size={16} color="#F59E0B" />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600 }}>{p.supplier?.name}</span>
                    <span style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>· {p.supplier?.city}</span>
                    {p.paymentTerms && <span style={{ marginLeft: 8 }}><Pill color={ptColor[p.paymentTerms] || '#6B7280'} label={ptLabel(p.paymentTerms)} /></span>}
                  </div>
                  <Pill color="#F59E0B" label="Awaiting Response" />
                </div>
              ))}
            </div>
          )}

          {/* Local supplier discovery */}
          {!searchResults && (localSuppliers.sameCity?.length > 0 || localSuppliers.sameState?.length > 0) && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={12} />Syllabrix Suppliers Near You · {tenant?.city || 'your area'}
              </div>
              {localSuppliers.sameCity?.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: '#C4B5FD', fontWeight: 600, marginBottom: 8 }}>SAME CITY — {tenant?.city?.toUpperCase()}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                    {localSuppliers.sameCity.map(s => <SupplierCard key={s.id} supplier={s} {...sharedCardProps} />)}
                  </div>
                </>
              )}
              {localSuppliers.sameState?.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: '#C4B5FD', fontWeight: 600, marginBottom: 8 }}>SAME STATE — {tenant?.state?.toUpperCase()}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {localSuppliers.sameState.map(s => <SupplierCard key={s.id} supplier={s} {...sharedCardProps} />)}
                  </div>
                </>
              )}
            </div>
          )}
          {localLoading && !searchResults && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 16, fontSize: 13 }}>Finding Syllabrix suppliers near you…</div>}

          {/* ── Offline vendors callout ───────────────────────────────────── */}
          <div style={{ marginTop: 28, borderTop: '1px solid #F3F4F6', paddingTop: 20 }}>
            <a href="/vendors" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, textDecoration: 'none' }}>
              <WifiOff size={18} color="#64748B" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>Offline Vendors — managed in Vendors & Purchases</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Your manually-added vendors are shown there with WhatsApp invite options to bring them onto Syllabrix.</div>
              </div>
              <ChevronRight size={16} color="#9CA3AF" />
            </a>
          </div>

        </div>
      )}

      {/* ── Tab: Price Negotiations ── */}
      {tab === 'negotiations' && (
        <NegotiationsSection
          asBuyer={negotiations.asBuyer || []}
          asSupplier={negotiations.asSupplier || []}
          onView={(neg, role) => setViewNeg({ neg, role })}
        />
      )}

      {/* Modals */}
      {addItem && <CatalogItemModal onClose={() => setAddItem(false)} onSaved={() => { setAddItem(false); loadAll(); }} />}
      {editItem && <CatalogItemModal item={editItem} onClose={() => setEditItem(null)} onSaved={() => { setEditItem(null); loadAll(); }} />}
      {connecting && (
        <ConnectModal
          supplier={connecting}
          onClose={() => setConnecting(null)}
          onConnected={handleConnected}
        />
      )}
      {rating && (
        <RatingModal
          targetTenantId={rating.id}
          targetName={rating.name}
          onClose={() => setRating(null)}
          onRated={() => { setRating(null); loadAll(); loadLocal(); if (searchQ) doSearch(searchQ); }}
        />
      )}
      {viewProfile && (
        <SupplierProfileModal
          supplierTenantId={viewProfile}
          onClose={() => setViewProfile(null)}
          onConnect={(s) => { setViewProfile(null); setConnecting(s); }}
        />
      )}
      {browsing && (
        <SupplierCatalogModal
          supplier={browsing.supplier}
          partnershipId={browsing.partnershipId}
          onClose={() => setBrowsing(null)}
          onNegotiationCreated={() => { setBrowsing(null); loadAll(); setTab('negotiations'); }}
        />
      )}
      {viewNeg && (
        <NegotiationModal
          neg={viewNeg.neg}
          role={viewNeg.role}
          onClose={() => setViewNeg(null)}
          onUpdated={() => { setViewNeg(null); loadAll(); }}
        />
      )}
    </div>
  );
}
