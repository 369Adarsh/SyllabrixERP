import { useEffect, useState } from 'react';
import { Plus, X, Wrench } from 'lucide-react';
import { listTools, createTool } from '../../api/freelancer';
import toast from 'react-hot-toast';

const OR = '#F97316';
const TEXT = '#F3F4F6';
const MUTED = '#9CA3AF';
const CARD = '#161616';
const BORDER = '#222';

const CONDITIONS = ['GOOD', 'NEEDS_SERVICE', 'REPLACE'];
const CONDITION_COLORS = { GOOD: '#4ADE80', NEEDS_SERVICE: '#FBBF24', REPLACE: '#F87171' };

export default function FreelancerTools() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', purchaseDate: '', cost: '', condition: 'GOOD', notes: '' });

  const load = () => {
    setLoading(true);
    listTools()
      .then(r => setTools(r.data))
      .catch(() => toast.error('Could not load tools'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (ev) => {
    ev.preventDefault();
    if (!form.name.trim()) return toast.error('Tool name required');
    setSaving(true);
    try {
      await createTool({ ...form, cost: parseFloat(form.cost) || 0, purchaseDate: form.purchaseDate || undefined });
      toast.success('Tool added');
      setForm({ name: '', purchaseDate: '', cost: '', condition: 'GOOD', notes: '' });
      setShowAdd(false);
      load();
    } catch { toast.error('Could not save'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 2 }}>My Tools</h1>
          <p style={{ fontSize: 13, color: MUTED }}>{tools.length} tools tracked</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Add Tool
        </button>
      </div>

      {loading ? (
        <div style={{ color: MUTED, fontSize: 14 }}>Loading…</div>
      ) : tools.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '40px', textAlign: 'center' }}>
          <Wrench size={32} color={MUTED} style={{ marginBottom: 12 }} />
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>No tools tracked yet</p>
          <p style={{ color: MUTED, fontSize: 13 }}>Track your tools, their condition, and service dates</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {tools.map(t => (
            <div key={t.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wrench size={16} color={OR} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: CONDITION_COLORS[t.condition] || MUTED, background: `${CONDITION_COLORS[t.condition]}18`, padding: '2px 8px', borderRadius: 20 }}>
                  {t.condition?.replace('_', ' ')}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 4 }}>{t.name}</div>
              {t.cost > 0 && <div style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>Cost: ₹{t.cost.toLocaleString('en-IN')}</div>}
              {t.purchaseDate && <div style={{ fontSize: 12, color: MUTED }}>Bought: {new Date(t.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
              {t.notes && <div style={{ fontSize: 12, color: MUTED, marginTop: 6, fontStyle: 'italic' }}>{t.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px', width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>Add Tool</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}><X size={18} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <TField label="Tool Name *" value={form.name} onChange={set('name')} placeholder="Drill machine, Wire stripper…" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <TField label="Cost (₹)" type="number" value={form.cost} onChange={set('cost')} placeholder="0" />
                <TField label="Purchase Date" type="date" value={form.purchaseDate} onChange={set('purchaseDate')} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: MUTED, display: 'block', marginBottom: 5 }}>Condition</label>
                <select value={form.condition} onChange={set('condition')}
                  style={{ padding: '9px 12px', background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 14, color: TEXT, outline: 'none', width: '100%' }}>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <TField label="Notes" value={form.notes} onChange={set('notes')} placeholder="Any notes about the tool" />
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #222', borderRadius: 8, color: MUTED, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', background: OR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Add Tool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TField({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ padding: '9px 12px', background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 14, color: '#F3F4F6', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
    </div>
  );
}
