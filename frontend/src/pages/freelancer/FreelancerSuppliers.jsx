import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { listSuppliers, createSupplier } from '../../api/freelancer';
import toast from 'react-hot-toast';

const OR = '#F97316';
const TEXT = '#F3F4F6';
const MUTED = '#9CA3AF';
const CARD = '#161616';
const BORDER = '#222';

export default function FreelancerSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', category: '', address: '', note: '' });

  const load = () => {
    setLoading(true);
    listSuppliers()
      .then(r => setSuppliers(r.data))
      .catch(() => toast.error('Could not load suppliers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (ev) => {
    ev.preventDefault();
    if (!form.name.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      await createSupplier(form);
      toast.success('Supplier added');
      setForm({ name: '', phone: '', category: '', address: '', note: '' });
      setShowAdd(false);
      load();
    } catch { toast.error('Could not save'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>Suppliers</h1>
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Add Supplier
        </button>
      </div>

      {loading ? (
        <div style={{ color: MUTED, fontSize: 14 }}>Loading…</div>
      ) : suppliers.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '40px', textAlign: 'center' }}>
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>No suppliers yet</p>
          <p style={{ color: MUTED, fontSize: 13 }}>Add your material suppliers for quick reference</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {suppliers.map(s => (
            <div key={s.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 8 }}>{s.name}</div>
              {s.category && (
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: 'rgba(249,115,22,0.1)', color: OR, display: 'inline-block', marginBottom: 8 }}>{s.category}</span>
              )}
              {s.phone && <div style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>📞 {s.phone}</div>}
              {s.address && <div style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>📍 {s.address}</div>}
              {s.note && <div style={{ fontSize: 12, color: MUTED, marginTop: 4, fontStyle: 'italic' }}>{s.note}</div>}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px', width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>Add Supplier</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}><X size={18} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['Name *', 'name', 'text', 'Sharma Hardware'], ['Phone', 'phone', 'tel', '9876543210'], ['Category', 'category', 'text', 'Hardware, Electrical, Paint…'], ['Address', 'address', 'text', 'Area, City'], ['Note', 'note', 'text', 'e.g. Gives credit of 30 days']].map(([label, key, type, ph]) => (
                <SField key={key} label={label} type={type} value={form[key]} onChange={set(key)} placeholder={ph} />
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', background: OR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SField({ label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ padding: '9px 12px', background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 14, color: '#F3F4F6', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
    </div>
  );
}
