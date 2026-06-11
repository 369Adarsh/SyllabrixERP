import { useEffect, useState } from 'react';
import { Plus, X, Users, Handshake } from 'lucide-react';
import { listHelpers, createHelper, listPartners, createPartner } from '../../api/freelancer';
import toast from 'react-hot-toast';

const OR = '#F97316';
const TEXT = '#F3F4F6';
const MUTED = '#9CA3AF';
const CARD = '#161616';
const BORDER = '#222';

export default function FreelancerTeam() {
  const [tab, setTab] = useState('helpers');
  const [helpers, setHelpers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const loadAll = () => {
    setLoading(true);
    Promise.all([listHelpers(), listPartners()])
      .then(([h, p]) => { setHelpers(h.data); setPartners(p.data); })
      .catch(() => toast.error('Could not load team'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const openAdd = () => {
    setForm(tab === 'helpers'
      ? { name: '', phone: '', skill: '', dailyRate: '' }
      : { name: '', phone: '', specialty: '', sharePercent: '' }
    );
    setShowAdd(true);
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (ev) => {
    ev.preventDefault();
    if (!form.name.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      if (tab === 'helpers') {
        await createHelper({ ...form, dailyRate: parseFloat(form.dailyRate) || 0 });
        toast.success('Helper added');
      } else {
        await createPartner({ ...form, sharePercent: parseFloat(form.sharePercent) || 0 });
        toast.success('Partner added');
      }
      setShowAdd(false);
      loadAll();
    } catch { toast.error('Could not save'); }
    finally { setSaving(false); }
  };

  const items = tab === 'helpers' ? helpers : partners;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>My Team</h1>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Add {tab === 'helpers' ? 'Helper' : 'Partner'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#111', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ key: 'helpers', icon: Users, label: 'Helpers' }, { key: 'partners', icon: Handshake, label: 'Partners' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t.key ? CARD : 'transparent', color: tab === t.key ? OR : MUTED }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: MUTED, fontSize: 14 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '40px', textAlign: 'center' }}>
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>No {tab === 'helpers' ? 'helpers' : 'partners'} yet</p>
          <p style={{ color: MUTED, fontSize: 13 }}>
            {tab === 'helpers' ? 'Add helpers to assign them to jobs and track wages' : 'Add partners for jobs you do together'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {items.map(item => (
            <div key={item.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(249,115,22,0.15)', border: '1.5px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: OR, fontSize: 14, marginBottom: 12 }}>
                {item.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 6 }}>{item.name}</div>
              {item.phone && <div style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>📞 {item.phone}</div>}
              {item.skill && <div style={{ fontSize: 12, color: MUTED }}>🔧 {item.skill}</div>}
              {item.specialty && <div style={{ fontSize: 12, color: MUTED }}>💼 {item.specialty}</div>}
              {tab === 'helpers' && item.dailyRate != null && (
                <div style={{ fontSize: 12, color: OR, marginTop: 6, fontWeight: 500 }}>₹{item.dailyRate}/day</div>
              )}
              {tab === 'partners' && item.sharePercent != null && (
                <div style={{ fontSize: 12, color: OR, marginTop: 6, fontWeight: 500 }}>{item.sharePercent}% share</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px', width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>Add {tab === 'helpers' ? 'Helper' : 'Partner'}</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}><X size={18} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MField label="Name *" value={form.name || ''} onChange={set('name')} placeholder="Raju" />
              <MField label="Phone" type="tel" value={form.phone || ''} onChange={set('phone')} placeholder="9876543210" />
              {tab === 'helpers' ? (
                <>
                  <MField label="Skill" value={form.skill || ''} onChange={set('skill')} placeholder="Electrician, Painter…" />
                  <MField label="Daily Rate (₹)" type="number" value={form.dailyRate || ''} onChange={set('dailyRate')} placeholder="0" />
                </>
              ) : (
                <>
                  <MField label="Specialty" value={form.specialty || ''} onChange={set('specialty')} placeholder="Plumbing, Civil work…" />
                  <MField label="Share %" type="number" value={form.sharePercent || ''} onChange={set('sharePercent')} placeholder="0" />
                </>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
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

function MField({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ padding: '9px 12px', background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 14, color: '#F3F4F6', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
    </div>
  );
}
