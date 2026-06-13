import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Users, Handshake, RefreshCw } from 'lucide-react';
import { listHelpers, createHelper, listPartners, createPartner } from '../../api/freelancer';
import toast from 'react-hot-toast';

const OR = '#f97316';
const TEXT = '#f1f5f9';
const MUTED = '#64748b';
const CARD = '#141414';
const BORDER = '#1e1e1e';
const GR = '#10b981';

const HELPER_BLANK = { name: '', phone: '', skill: '', dailyRate: '' };
const PARTNER_BLANK = { name: '', phone: '', skill: '', notes: '' };

export default function FreelancerTeam() {
  const [tab, setTab] = useState('helpers');
  const [helpers, setHelpers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(HELPER_BLANK);

  const loadAll = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([listHelpers(), listPartners()])
      .then(([h, p]) => { setHelpers(h.data); setPartners(p.data); })
      .catch(err => setError(`Could not load — ${err?.response?.status || 'Network error'}`))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openAdd = () => {
    setForm(tab === 'helpers' ? HELPER_BLANK : PARTNER_BLANK);
    setShowAdd(true);
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (ev) => {
    ev.preventDefault();
    if (!form.name.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      if (tab === 'helpers') {
        await createHelper({ name: form.name, phone: form.phone || undefined, skill: form.skill || undefined, dailyRate: parseFloat(form.dailyRate) || 0 });
        toast.success('Helper added');
      } else {
        await createPartner({ name: form.name, phone: form.phone || undefined, skill: form.skill || undefined, notes: form.notes || undefined });
        toast.success('Partner added');
      }
      setShowAdd(false);
      loadAll();
    } catch (e) { toast.error(e?.response?.data?.error || 'Could not save'); }
    finally { setSaving(false); }
  };

  const items = tab === 'helpers' ? helpers : partners;

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 3 }}>My Team</h1>
          <p style={{ fontSize: 13, color: MUTED }}>{helpers.length} helpers · {partners.length} partners</p>
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Add {tab === 'helpers' ? 'Helper' : 'Partner'}
        </button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#111', borderRadius: 10, padding: 4, width: 'fit-content', border: `1px solid ${BORDER}` }}>
        {[{ key: 'helpers', icon: Users, label: `Helpers (${helpers.length})` }, { key: 'partners', icon: Handshake, label: `Partners (${partners.length})` }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t.key ? CARD : 'transparent', color: tab === t.key ? OR : MUTED, transition: 'background 0.15s, color 0.15s' }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px', height: 110 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#222', marginBottom: 12 }} />
              <div style={{ width: '50%', height: 14, background: '#222', borderRadius: 3, marginBottom: 8 }} />
              <div style={{ width: '35%', height: 12, background: '#1a1a1a', borderRadius: 3 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '32px', textAlign: 'center' }}>
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>Failed to load</p>
          <p style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>{error}</p>
          <button onClick={loadAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: OR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '40px', textAlign: 'center' }}>
          {tab === 'helpers' ? <Users size={28} color={MUTED} style={{ marginBottom: 12 }} /> : <Handshake size={28} color={MUTED} style={{ marginBottom: 12 }} />}
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>No {tab === 'helpers' ? 'helpers' : 'partners'} yet</p>
          <p style={{ color: MUTED, fontSize: 13 }}>
            {tab === 'helpers' ? 'Add helpers to assign them to jobs and track daily wages' : 'Add partners you collaborate with on joint projects'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
          {items.map(item => (
            <div key={item.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(249,115,22,0.12)', border: '1.5px solid rgba(249,115,22,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: OR, fontSize: 14, flexShrink: 0 }}>
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{item.name}</div>
                  {item.phone && <div style={{ fontSize: 12, color: MUTED }}>📞 {item.phone}</div>}
                </div>
              </div>

              {item.skill && (
                <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
                  🔧 <span style={{ color: TEXT }}>{item.skill}</span>
                </div>
              )}

              {tab === 'helpers' && item.dailyRate > 0 && (
                <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: `${GR}14`, border: `1px solid ${GR}28`, fontSize: 12, fontWeight: 600, color: GR }}>
                  ₹{item.dailyRate}/day
                </div>
              )}

              {tab === 'partners' && item.notes && (
                <div style={{ fontSize: 12, color: MUTED, fontStyle: 'italic', marginTop: 4 }}>{item.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#141414', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px', width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>Add {tab === 'helpers' ? 'Helper' : 'Partner'}</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}><X size={18} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <TF label="Name *" value={form.name || ''} onChange={set('name')} placeholder={tab === 'helpers' ? 'Raju Yadav' : 'Partner name'} />
              <TF label="Phone" type="tel" value={form.phone || ''} onChange={set('phone')} placeholder="9876543210" />
              <TF label={tab === 'helpers' ? 'Skill / Role' : 'Specialty'} value={form.skill || ''} onChange={set('skill')} placeholder={tab === 'helpers' ? 'Wiring helper, Painter…' : 'AC installation, Civil work…'} />
              {tab === 'helpers' ? (
                <TF label="Daily Rate (₹)" type="number" value={form.dailyRate || ''} onChange={set('dailyRate')} placeholder="0" />
              ) : (
                <TF label="Notes (share %, terms)" value={form.notes || ''} onChange={set('notes')} placeholder="e.g. 30% share on AC jobs" />
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setShowAdd(false); }} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', background: OR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TF({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: MUTED, display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ padding: '9px 12px', background: '#0f0f0f', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14, color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
    </div>
  );
}
