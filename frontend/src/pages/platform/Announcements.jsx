import { useEffect, useState } from 'react';
import {
  getSAAnnouncements, createSAAnnouncement, updateSAAnnouncement,
  publishSAAnnouncement, unpublishSAAnnouncement, deleteSAAnnouncement,
} from '../../api/platform';
import toast from 'react-hot-toast';

const TYPE_COLOR = { INFO: '#60A5FA', WARNING: '#F59E0B', CRITICAL: '#F87171', FEATURE: '#34D399', MAINTENANCE: '#A78BFA' };
const BUSINESS_TYPES = [
  'ALL',
  // Fitness & Sports
  'GYM', 'SPA', 'YOGA_STUDIO', 'MARTIAL_ARTS', 'SPORTS_ACADEMY', 'SWIMMING_ACADEMY', 'CROSSFIT_STUDIO',
  // Other categories
  'RETAIL', 'RESTAURANT', 'CLINIC', 'SALON', 'COACHING', 'GENERAL',
];

const EMPTY = { title: '', body: '', type: 'INFO', targetTypes: [], expiresAt: '', isPublished: false };

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getSAAnnouncements();
      setAnnouncements(data.data || []);
    } catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      title: a.title,
      body: a.body,
      type: a.type,
      targetTypes: a.targetTypes || [],
      expiresAt: a.expiresAt ? a.expiresAt.slice(0, 10) : '',
      isPublished: a.isPublished,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) return toast.error('Title and body required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        targetTypes: form.targetTypes,
      };
      if (editing) {
        await updateSAAnnouncement(editing.id, payload);
        toast.success('Announcement updated');
      } else {
        await createSAAnnouncement(payload);
        toast.success('Announcement created');
      }
      setModalOpen(false);
      load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handlePublish = async (a) => {
    try {
      if (a.isPublished) {
        await unpublishSAAnnouncement(a.id);
        toast.success('Unpublished');
      } else {
        await publishSAAnnouncement(a.id);
        toast.success('Published');
      }
      load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await deleteSAAnnouncement(id);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const toggleTarget = (type) => {
    setForm((f) => ({
      ...f,
      targetTypes: f.targetTypes.includes(type)
        ? f.targetTypes.filter((t) => t !== type)
        : [...f.targetTypes, type],
    }));
  };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F1F5F9' }}>
          Announcements
        </h1>
        <button
          onClick={openCreate}
          style={{
            padding: '9px 20px', background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)',
            border: 'none', borderRadius: 8, color: '#0B131C',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          + New Announcement
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#64748B', fontSize: 14 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map((a) => (
            <div key={a.id} style={{ background: '#192533', borderRadius: 12, border: `1px solid ${a.isPublished ? '#1E2D3D' : '#F59E0B33'}`, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <TypeBadge type={a.type} />
                    {!a.isPublished && (
                      <span style={{ background: '#F59E0B22', color: '#F59E0B', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>DRAFT</span>
                    )}
                    {a.targetTypes?.length > 0 && (
                      <span style={{ fontSize: 11, color: '#64748B' }}>→ {a.targetTypes.join(', ')}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 6 }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>{a.body}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 8 }}>
                    By {a.createdBy} · {new Date(a.createdAt).toLocaleDateString('en-IN')}
                    {a.expiresAt && ` · Expires ${new Date(a.expiresAt).toLocaleDateString('en-IN')}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handlePublish(a)}
                    style={{
                      padding: '7px 14px', borderRadius: 8, border: `1px solid ${a.isPublished ? '#F59E0B' : '#34D399'}`,
                      background: a.isPublished ? 'rgba(245,158,11,0.1)' : 'rgba(52,211,153,0.1)',
                      color: a.isPublished ? '#F59E0B' : '#34D399',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    }}>
                    {a.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => openEdit(a)}
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #1E2D3D', background: '#192533', color: '#94A3B8', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(a.id)}
                    style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #F8717133', background: 'rgba(248,113,113,0.08)', color: '#F87171', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div style={{ color: '#64748B', textAlign: 'center', padding: 60, fontSize: 14 }}>No announcements yet. Create one!</div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#192533', borderRadius: 16, border: '1px solid #1E2D3D', width: '100%', maxWidth: 560, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#F1F5F9' }}>
                {editing ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <label style={labelStyle}>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" style={{ ...inputStyle, width: '100%', marginBottom: 14 }} />

            <label style={labelStyle}>Body</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Full announcement text…" rows={4}
              style={{ ...inputStyle, width: '100%', resize: 'vertical', marginBottom: 14 }} />

            <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                  {Object.keys(TYPE_COLOR).map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Expires (optional)</label>
                <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
              </div>
            </div>

            <label style={labelStyle}>Target Business Types (empty = all)</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {BUSINESS_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => toggleTarget(t)}
                  style={{
                    padding: '5px 12px', borderRadius: 8, border: `1px solid ${form.targetTypes.includes(t) ? '#1FB8D6' : '#1E2D3D'}`,
                    background: form.targetTypes.includes(t) ? 'rgba(31,184,214,0.15)' : '#111C27',
                    color: form.targetTypes.includes(t) ? '#1FB8D6' : '#64748B',
                    fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  }}>
                  {t}
                </button>
              ))}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
              <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>Publish immediately</span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalOpen(false)}
                style={{ flex: 1, padding: '10px', background: '#1E2D3D', border: 'none', borderRadius: 8, color: '#64748B', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 2, padding: '10px', background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TypeBadge = ({ type }) => (
  <span style={{ background: `${TYPE_COLOR[type]}22`, color: TYPE_COLOR[type], padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
    {type}
  </span>
);

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' };
const inputStyle = { padding: '9px 12px', background: '#111C27', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)' };
