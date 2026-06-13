import { useEffect, useState, useCallback } from 'react';
import { Plus, X, FileCheck, AlertTriangle, RefreshCw, Phone } from 'lucide-react';

const WA_GREEN = '#25D366';
function WABtn({ phone, text, label = 'WhatsApp' }) {
  if (!phone) return null;
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (p.length === 10) p = '91' + p;
  const link = `https://wa.me/${p}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', background: `${WA_GREEN}18`, border: `1px solid ${WA_GREEN}50`, borderRadius: 6, color: WA_GREEN, fontSize: 11, fontWeight: 600, textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill={WA_GREEN}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      {label}
    </a>
  );
}
import { listAMC, createAMC } from '../../api/freelancer';
import toast from 'react-hot-toast';

const OR = '#f97316';
const TEXT = '#f1f5f9';
const MUTED = '#64748b';
const CARD = '#141414';
const BORDER = '#1e1e1e';
const GR = '#10b981';
const YE = '#f59e0b';
const RE = '#ef4444';

const fmt = (n) => n ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function getStatus(endDate) {
  if (!endDate) return { label: 'Ongoing', color: '#94a3b8' };
  const diff = Math.ceil((new Date(endDate) - new Date()) / 86_400_000);
  if (diff < 0) return { label: 'Expired', color: RE };
  if (diff <= 30) return { label: `Expires in ${diff}d`, color: YE };
  return { label: 'Active', color: GR };
}

const BLANK = { clientName: '', clientPhone: '', workType: '', annualFee: '', startDate: '', endDate: '', notes: '' };

export default function FreelancerAMC() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listAMC()
      .then(r => setContracts(r.data))
      .catch(err => setError(`Could not load contracts — ${err?.response?.status || 'Network error'}`))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (ev) => {
    ev.preventDefault();
    if (!form.clientName.trim()) return toast.error('Client name required');
    if (!form.clientPhone.trim()) return toast.error('Client phone required');
    if (!form.workType.trim()) return toast.error('Work description required');
    if (!form.startDate) return toast.error('Start date is required');
    if (!form.endDate) return toast.error('End date is required');
    setSaving(true);
    try {
      await createAMC({
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        workType: form.workType,
        annualFee: parseFloat(form.annualFee) || 0,
        type: 'AMC',
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        notes: form.notes || undefined,
      });
      toast.success('AMC contract added');
      setForm(BLANK);
      setShowAdd(false);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const expiring = contracts.filter(c => {
    if (!c.endDate) return false;
    const diff = Math.ceil((new Date(c.endDate) - new Date()) / 86_400_000);
    return diff >= 0 && diff <= 30;
  });

  const expired = contracts.filter(c => c.endDate && new Date(c.endDate) < new Date());

  const totalAnnual = contracts.reduce((s, c) => s + (c.annualFee || 0), 0);

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 3 }}>AMC Contracts</h1>
          <p style={{ fontSize: 13, color: MUTED }}>
            {contracts.length} contract{contracts.length !== 1 ? 's' : ''}
            {totalAnnual > 0 && ` · ${fmt(totalAnnual)}/year total`}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Add Contract
        </button>
      </div>

      {/* Expiry alerts */}
      {expiring.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 10 }}>
          <AlertTriangle size={15} color={YE} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: YE, marginBottom: 4 }}>
              {expiring.length} contract{expiring.length > 1 ? 's' : ''} expiring within 30 days
            </div>
            <div style={{ fontSize: 12, color: MUTED }}>{expiring.map(c => c.clientName).join(' · ')}</div>
          </div>
        </div>
      )}
      {expired.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: '12px 18px', marginBottom: 16, display: 'flex', gap: 10 }}>
          <AlertTriangle size={15} color={RE} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: RE, fontWeight: 500 }}>
            {expired.length} contract{expired.length > 1 ? 's' : ''} expired — {expired.map(c => c.clientName).join(', ')}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 20px', height: 130 }}>
              <div style={{ width: '55%', height: 14, background: '#222', borderRadius: 4, marginBottom: 10 }} />
              <div style={{ width: '70%', height: 13, background: '#1a1a1a', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: '40%', height: 13, background: '#1a1a1a', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '32px', textAlign: 'center' }}>
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>Failed to load</p>
          <p style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>{error}</p>
          <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: OR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      ) : contracts.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '48px', textAlign: 'center' }}>
          <FileCheck size={32} color={MUTED} style={{ marginBottom: 12 }} />
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>No AMC contracts yet</p>
          <p style={{ color: MUTED, fontSize: 13 }}>Track recurring maintenance so you never miss a renewal</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
          {contracts.map(c => {
            const st = getStatus(c.endDate);
            return (
              <div key={c.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: TEXT, flex: 1, paddingRight: 8 }}>{c.clientName}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: st.color, background: `${st.color}18`, padding: '2px 9px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {st.label}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: MUTED, marginBottom: 12, lineHeight: 1.5 }}>{c.workType}</div>

                {/* Details row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {c.clientPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: MUTED }}>
                        <Phone size={11} /> {c.clientPhone}
                      </span>
                      <WABtn phone={c.clientPhone} label="Chat" />
                      <WABtn phone={c.clientPhone} label="Renewal Reminder"
                        text={`Hi ${c.clientName}! Your AMC contract for *${c.workType}* is coming up for renewal on *${c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN') : 'soon'}*. Annual fee: ₹${c.annualFee || '—'}. Please contact us to renew on time. Thank you! 🙏`} />
                    </div>
                  )}
                  {c.annualFee > 0 && (
                    <div style={{ fontSize: 14, fontWeight: 700, color: OR }}>{fmt(c.annualFee)}<span style={{ fontSize: 11, fontWeight: 400, color: MUTED }}> /year</span></div>
                  )}
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: MUTED }}>
                    {c.startDate && <span>Start: {fmtDate(c.startDate)}</span>}
                    {c.endDate && <span>End: {fmtDate(c.endDate)}</span>}
                  </div>
                </div>

                {c.notes && <div style={{ marginTop: 10, fontSize: 12, color: MUTED, fontStyle: 'italic', borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>{c.notes}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#141414', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>New AMC Contract</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}><X size={18} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Client Name *" value={form.clientName} onChange={set('clientName')} placeholder="Rohan Mehta" />
              <Field label="Client Phone *" type="tel" value={form.clientPhone} onChange={set('clientPhone')} placeholder="9876543210" />
              <Field label="Work Description *" value={form.workType} onChange={set('workType')} placeholder="AC maintenance, Generator service, Electrical upkeep…" />
              <Field label="Annual Amount (₹)" type="number" value={form.annualFee} onChange={set('annualFee')} placeholder="12000" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Start Date" type="date" value={form.startDate} onChange={set('startDate')} />
                <Field label="End Date" type="date" value={form.endDate} onChange={set('endDate')} />
              </div>
              <Field label="Notes" value={form.notes} onChange={set('notes')} placeholder="Renewal terms, contact details…" />
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setShowAdd(false); setForm(BLANK); }} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', background: OR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Add Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: MUTED, display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ padding: '9px 12px', background: '#0f0f0f', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14, color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
    </div>
  );
}
