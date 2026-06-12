import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, X, ArrowLeft, Briefcase } from 'lucide-react';
import { listClients, createClient, getClient } from '../../api/freelancer';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const OR = '#f97316';
const TEXT = '#f1f5f9';
const MUTED = '#64748b';
const CARD = '#141414';
const BORDER = '#1e1e1e';

const STATUS_COLORS = {
  ENQUIRY: '#94a3b8', ESTIMATE_SENT: '#60a5fa', IN_PROGRESS: '#f97316',
  COMPLETED: '#4ade80', PAYMENT_PENDING: '#fbbf24', CLOSED: '#6b7280', CANCELLED: '#ef4444',
};

const fmt = (n) => n != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—';

export default function FreelancerClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    listClients({ search: search || undefined })
      .then(r => setClients(r.data))
      .catch(() => toast.error('Could not load clients'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openClient = async (c) => {
    try {
      const { data } = await getClient(c.id);
      setSelected(data);
    } catch { toast.error('Could not load client'); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (ev) => {
    ev.preventDefault();
    if (!form.name.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      await createClient(form);
      toast.success('Client added');
      setForm({ name: '', phone: '', email: '', address: '' });
      setShowAdd(false);
      load();
    } catch { toast.error('Could not save'); }
    finally { setSaving(false); }
  };

  if (selected) {
    return <ClientDetail client={selected} onBack={() => setSelected(null)} navigate={navigate} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>Clients</h1>
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Add Client
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 340 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: MUTED }} />
        <input type="text" placeholder="Search by name or phone…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '9px 12px 9px 32px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
      </div>

      {loading ? (
        <div style={{ color: MUTED, fontSize: 14 }}>Loading…</div>
      ) : clients.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '40px', textAlign: 'center' }}>
          <p style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>No clients yet</p>
          <p style={{ color: MUTED, fontSize: 13 }}>Add clients to link them with jobs easily</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {clients.map(c => (
            <div
              key={c.id}
              onClick={() => openClient(c)}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = OR}
              onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(249,115,22,0.15)', border: '1.5px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: OR, fontSize: 15 }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                {c._count?.jobs > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 20, padding: '3px 8px' }}>
                    <Briefcase size={11} color={OR} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: OR }}>{c._count.jobs} job{c._count.jobs !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 6 }}>{c.name}</div>
              {c.phone && <div style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>📞 {c.phone}</div>}
              {c.email && <div style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>✉ {c.email}</div>}
              {c.address && <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{c.address}</div>}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px', width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>Add Client</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}><X size={18} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['Name *', 'name', 'text', 'Suresh Sharma'], ['Phone', 'phone', 'tel', '9876543210'], ['Email', 'email', 'email', 'suresh@email.com'], ['Address', 'address', 'text', 'Area, City']].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: MUTED, display: 'block', marginBottom: 5 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={set(key)} placeholder={ph}
                    style={{ padding: '9px 12px', background: '#111', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14, color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', background: OR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientDetail({ client, onBack, navigate }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>{client.name}</h1>
          {client.phone && <p style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{client.phone}</p>}
        </div>
      </div>

      {/* Client info */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
        <h3 style={{ fontSize: 12, fontWeight: 600, color: OR, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px 16px', fontSize: 13 }}>
          {client.email && <><span style={{ color: MUTED }}>Email</span><span style={{ color: TEXT }}>{client.email}</span></>}
          {client.address && <><span style={{ color: MUTED }}>Address</span><span style={{ color: TEXT }}>{client.address}</span></>}
          {client.notes && <><span style={{ color: MUTED }}>Notes</span><span style={{ color: TEXT }}>{client.notes}</span></>}
        </div>
      </div>

      {/* Jobs */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: OR, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Jobs ({client.jobs?.length || 0})
          </h3>
        </div>
        {!client.jobs?.length ? (
          <div style={{ padding: '32px', textAlign: 'center', color: MUTED, fontSize: 13 }}>
            No jobs linked to this client yet.<br />
            <span style={{ color: OR, fontSize: 12, marginTop: 6, display: 'block' }}>
              Select this client when creating a new job to link it.
            </span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Job #', 'Work Type', 'Status', 'Value'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {client.jobs.map((j, i) => (
                <tr
                  key={j.id}
                  onClick={() => navigate(`/freelancer/jobs/${j.id}`)}
                  style={{ borderBottom: i < client.jobs.length - 1 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: OR }}>{j.jobNumber}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: TEXT }}>{j.workType}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLORS[j.status] || MUTED, background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 20 }}>
                      {j.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: TEXT }}>{fmt(j.jobValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
