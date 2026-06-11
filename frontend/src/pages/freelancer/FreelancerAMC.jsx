import { useEffect, useState } from 'react';
import { Plus, X, FileCheck, AlertTriangle } from 'lucide-react';
import { listAMC, createAMC } from '../../api/freelancer';
import toast from 'react-hot-toast';

const OR = '#F97316';
const TEXT = '#F3F4F6';
const MUTED = '#9CA3AF';
const CARD = '#161616';
const BORDER = '#222';

const fmt = (n) => n ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—';

function getStatus(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: 'Expired', color: '#F87171' };
  if (diff <= 30) return { label: `Expires in ${diff}d`, color: '#FBBF24' };
  return { label: 'Active', color: '#4ADE80' };
}

export default function FreelancerAMC() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ clientName: '', description: '', amount: '', startDate: '', endDate: '', note: '' });

  const load = () => {
    setLoading(true);
    listAMC()
      .then(r => setContracts(r.data))
      .catch(() => toast.error('Could not load AMC contracts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (ev) => {
    ev.preventDefault();
    if (!form.clientName.trim()) return toast.error('Client name required');
    if (!form.description.trim()) return toast.error('Description required');
    setSaving(true);
    try {
      await createAMC({ ...form, amount: parseFloat(form.amount) || 0, startDate: form.startDate || undefined, endDate: form.endDate || undefined });
      toast.success('AMC contract added');
      setForm({ clientName: '', description: '', amount: '', startDate: '', endDate: '', note: '' });
      setShowAdd(false);
      load();
    } catch { toast.error('Could not save'); }
    finally { setSaving(false); }
  };

  const expiring = contracts.filter(c => {
    if (!c.endDate) return false;
    const diff = Math.ceil((new Date(c.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 2 }}>AMC Contracts</h1>
          <p style={{ fontSize: 13, color: MUTED }}>Annual Maintenance Contracts</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Add Contract
        </button>
      </div>

      {/* Expiring alert */}
      {expiring.length > 0 && (
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertTriangle size={16} color="#FBBF24" style={{ marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#FBBF24', marginBottom: 4 }}>{expiring.length} contract{expiring.length > 1 ? 's' : ''} expiring soon</div>
            <div style={{ fontSize: 12, color: MUTED }}>{expiring.map(c => c.clientName).join(', ')}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: MUTED, fontSize: 14 }}>Loading…</div>
      ) : contracts.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '40px', textAlign: 'center' }}>
          <FileCheck size={32} color={MUTED} style={{ marginBottom: 12 }} />
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>No AMC contracts yet</p>
          <p style={{ color: MUTED, fontSize: 13 }}>Track maintenance contracts so you never miss a renewal</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {contracts.map(c => {
            const status = getStatus(c.endDate);
            return (
              <div key={c.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{c.clientName}</div>
                  {status && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: status.color, background: `${status.color}15`, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                      {status.label}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 10 }}>{c.description}</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {c.amount > 0 && <div style={{ fontSize: 12, color: OR, fontWeight: 600 }}>{fmt(c.amount)}</div>}
                  {c.startDate && <div style={{ fontSize: 12, color: MUTED }}>Start: {new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
                  {c.endDate && <div style={{ fontSize: 12, color: MUTED }}>End: {new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
                </div>
                {c.note && <div style={{ fontSize: 12, color: MUTED, marginTop: 8, fontStyle: 'italic' }}>{c.note}</div>}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px', width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>Add AMC Contract</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}><X size={18} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AF label="Client Name *" value={form.clientName} onChange={set('clientName')} placeholder="Rohan Mehta" />
              <AF label="Description *" value={form.description} onChange={set('description')} placeholder="AC maintenance, Generator service…" />
              <AF label="Annual Amount (₹)" type="number" value={form.amount} onChange={set('amount')} placeholder="0" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <AF label="Start Date" type="date" value={form.startDate} onChange={set('startDate')} />
                <AF label="End Date" type="date" value={form.endDate} onChange={set('endDate')} />
              </div>
              <AF label="Note" value={form.note} onChange={set('note')} placeholder="Renewal terms, contact details…" />
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #222', borderRadius: 8, color: MUTED, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
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

function AF({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ padding: '9px 12px', background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 14, color: '#F3F4F6', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
    </div>
  );
}
