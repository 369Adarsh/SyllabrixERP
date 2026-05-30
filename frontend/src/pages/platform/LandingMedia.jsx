import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getLandingPhotos, createLandingPhoto, updateLandingPhoto,
  deleteLandingPhoto, reorderLandingPhotos,
} from '../../api/platform';

const UPLOADS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1')
  .replace('/api/v1', '');

const BG_OPTIONS = [
  { value: 'pbg-kirana',    label: 'Amber / Orange',  color: '#d97706' },
  { value: 'pbg-gym',       label: 'Deep Blue',        color: '#2563eb' },
  { value: 'pbg-logistics', label: 'Sky Teal',         color: '#0891b2' },
  { value: 'pbg-coaching',  label: 'Indigo',           color: '#4f46e5' },
  { value: 'pbg-tuition',   label: 'Emerald',          color: '#16a34a' },
  { value: 'pbg-supplier',  label: 'Burnt Orange',     color: '#ea580c' },
  { value: 'pbg-freelancer',label: 'Purple',           color: '#9333ea' },
  { value: 'pbg-wholesale', label: 'Cyan',             color: '#0e7490' },
  { value: 'pbg-restaurant',label: 'Crimson',          color: '#dc2626' },
  { value: 'pbg-salon',     label: 'Pink / Magenta',   color: '#db2777' },
  { value: 'pbg-clinic',    label: 'Teal Green',       color: '#14b8a6' },
  { value: 'pbg-retail',    label: 'Green',            color: '#059669' },
];

const EMPTY_FORM = { altText: '', tag: '', typeName: '', modules: '', bgClass: 'pbg-kirana', rowIndex: 1, sortOrder: 0 };

const s = {
  page: { padding: '28px 32px', minHeight: '100vh', background: '#0F1923', fontFamily: 'var(--font-body, system-ui)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  title: { fontSize: 22, fontWeight: 700, color: '#F1F5F9', fontFamily: 'var(--font-display, system-ui)', margin: 0 },
  sub: { fontSize: 13, color: '#64748B', marginTop: 3 },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
    background: 'linear-gradient(135deg, #1FB8D6, #0891b2)', border: 'none',
    borderRadius: 9, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  section: { marginBottom: 36 },
  sectionTitle: {
    fontSize: 12, fontWeight: 700, color: '#334155', letterSpacing: '0.1em',
    textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
  },
  rowBadge: (r) => ({
    background: r === 1 ? 'rgba(31,184,214,0.15)' : 'rgba(124,58,237,0.15)',
    color: r === 1 ? '#27DCFF' : '#A78BFA',
    border: `1px solid ${r === 1 ? 'rgba(31,184,214,0.25)' : 'rgba(124,58,237,0.25)'}`,
    padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700,
  }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  card: {
    background: '#0B131C', border: '1px solid #1E2D3D', borderRadius: 14,
    overflow: 'hidden', position: 'relative',
  },
  cardImg: { width: '100%', height: 130, objectFit: 'cover', display: 'block' },
  cardImgPlaceholder: { width: '100%', height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 },
  cardBody: { padding: '12px 14px 14px' },
  cardTag: {
    display: 'inline-block', fontSize: 10, fontWeight: 700, color: '#1FB8D6',
    background: 'rgba(31,184,214,0.12)', border: '1px solid rgba(31,184,214,0.2)',
    borderRadius: 5, padding: '2px 7px', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  cardName: { fontSize: 13, fontWeight: 600, color: '#F1F5F9', marginBottom: 3, lineHeight: 1.35 },
  cardMods: { fontSize: 11, color: '#475569', marginBottom: 10, lineHeight: 1.4 },
  cardMeta: { fontSize: 11, color: '#334155', marginBottom: 12 },
  cardActions: { display: 'flex', gap: 6 },
  actionBtn: (variant) => ({
    flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
    background: variant === 'edit' ? 'rgba(31,184,214,0.12)' : variant === 'del' ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.06)',
    color: variant === 'edit' ? '#27DCFF' : variant === 'del' ? '#F87171' : '#94A3B8',
  }),
  activeDot: (on) => ({
    display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
    background: on ? '#34D399' : '#475569', marginRight: 5,
  }),
  emptyRow: {
    padding: '32px 0', textAlign: 'center', color: '#334155',
    border: '1px dashed #1E2D3D', borderRadius: 12, fontSize: 13,
  },
  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modal: {
    background: '#0B131C', border: '1px solid #1E2D3D', borderRadius: 16,
    width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 28,
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: '#F1F5F9', marginBottom: 22 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' },
  input: {
    width: '100%', padding: '9px 12px', background: '#111E2C', border: '1px solid #1E2D3D',
    borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  },
  select: {
    width: '100%', padding: '9px 12px', background: '#111E2C', border: '1px solid #1E2D3D',
    borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  },
  dropzone: {
    border: '2px dashed #1E2D3D', borderRadius: 10, padding: '28px 20px',
    textAlign: 'center', cursor: 'pointer', background: '#0F1923',
    transition: 'border-color 0.2s',
  },
  modalActions: { display: 'flex', gap: 10, marginTop: 24 },
  saveBtn: {
    flex: 1, padding: '10px', background: 'linear-gradient(135deg, #1FB8D6, #0891b2)',
    border: 'none', borderRadius: 9, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  cancelBtn: {
    padding: '10px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid #1E2D3D',
    borderRadius: 9, color: '#94A3B8', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
};

function getBgStyle(bgClass) {
  const found = BG_OPTIONS.find(b => b.value === bgClass);
  if (!found) return { background: '#1E2D3D' };
  const c = found.color;
  return { background: `linear-gradient(135deg, ${c}55, ${c}22)` };
}

export default function LandingMedia() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getLandingPhotos();
      setPhotos(data.data || []);
    } catch { toast.error('Failed to load photos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sortOrder: photos.length });
    setFile(null);
    setPreview(null);
    setModal('add');
  };

  const openEdit = (photo) => {
    setEditing(photo);
    setForm({
      altText: photo.altText, tag: photo.tag, typeName: photo.typeName,
      modules: photo.modules, bgClass: photo.bgClass,
      rowIndex: photo.rowIndex, sortOrder: photo.sortOrder,
    });
    setFile(null);
    setPreview(`${UPLOADS_BASE}/uploads/landing/${photo.filename}`);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditing(null); setFile(null); setPreview(null); };

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) { toast.error('Only image files'); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSave = async () => {
    if (modal === 'add' && !file) { toast.error('Please select a photo'); return; }
    if (!form.typeName.trim()) { toast.error('Type name is required'); return; }
    setSaving(true);
    try {
      if (modal === 'add') {
        const fd = new FormData();
        fd.append('photo', file);
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        await createLandingPhoto(fd);
        toast.success('Photo uploaded!');
      } else {
        await updateLandingPhoto(editing.id, form);
        toast.success('Updated!');
      }
      closeModal();
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (photo) => {
    if (!window.confirm(`Delete "${photo.typeName}"? This removes the image file too.`)) return;
    try {
      await deleteLandingPhoto(photo.id);
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const handleToggle = async (photo) => {
    try {
      await updateLandingPhoto(photo.id, { isActive: !photo.isActive });
      toast.success(photo.isActive ? 'Hidden from landing page' : 'Now visible on landing page');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleMove = async (photo, dir) => {
    const rowPhotos = photos.filter(p => p.rowIndex === photo.rowIndex).sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = rowPhotos.findIndex(p => p.id === photo.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= rowPhotos.length) return;
    const updates = [
      { id: rowPhotos[idx].id,     sortOrder: rowPhotos[swapIdx].sortOrder },
      { id: rowPhotos[swapIdx].id, sortOrder: rowPhotos[idx].sortOrder },
    ];
    try {
      await reorderLandingPhotos(updates);
      load();
    } catch { toast.error('Reorder failed'); }
  };

  const row1 = [...photos].filter(p => p.rowIndex === 1).sort((a, b) => a.sortOrder - b.sortOrder);
  const row2 = [...photos].filter(p => p.rowIndex === 2).sort((a, b) => a.sortOrder - b.sortOrder);

  const PhotoCard = ({ photo, rowPhotos }) => {
    const imgUrl = `${UPLOADS_BASE}/uploads/landing/${photo.filename}`;
    const idx = rowPhotos.findIndex(p => p.id === photo.id);
    return (
      <div style={s.card}>
        {/* Image or placeholder */}
        <div style={{ position: 'relative' }}>
          <div style={{ ...s.cardImgPlaceholder, ...getBgStyle(photo.bgClass) }}>
            <span style={{ fontSize: 28 }}>🖼</span>
          </div>
          <img
            src={imgUrl}
            alt={photo.altText || photo.typeName}
            style={{ ...s.cardImg, position: 'absolute', top: 0, left: 0 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          {!photo.isActive && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#F87171', letterSpacing: '0.1em',
            }}>HIDDEN</div>
          )}
        </div>
        <div style={s.cardBody}>
          {photo.tag && <div style={s.cardTag}>{photo.tag}</div>}
          <div style={s.cardName}>{photo.typeName || '—'}</div>
          <div style={s.cardMods}>{photo.modules || '—'}</div>
          <div style={s.cardMeta}>
            <span style={s.activeDot(photo.isActive)} />
            {photo.isActive ? 'Visible' : 'Hidden'} · Row {photo.rowIndex} · #{photo.sortOrder}
          </div>
          <div style={s.cardActions}>
            <button style={s.actionBtn('other')} onClick={() => handleMove(photo, 'up')} disabled={idx === 0} title="Move left">←</button>
            <button style={s.actionBtn('other')} onClick={() => handleMove(photo, 'down')} disabled={idx === rowPhotos.length - 1} title="Move right">→</button>
            <button style={s.actionBtn('other')} onClick={() => handleToggle(photo)} title={photo.isActive ? 'Hide' : 'Show'}>
              {photo.isActive ? '👁' : '🙈'}
            </button>
            <button style={s.actionBtn('edit')} onClick={() => openEdit(photo)}>Edit</button>
            <button style={s.actionBtn('del')} onClick={() => handleDelete(photo)}>Del</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Landing Page Media</h1>
          <div style={s.sub}>Photos shown in the scrolling marquee on your public landing page</div>
        </div>
        <button style={s.addBtn} onClick={openAdd}>
          + Add Photo
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#334155' }}>Loading…</div>
      ) : (
        <>
          {/* Row 1 */}
          <div style={s.section}>
            <div style={s.sectionTitle}>
              <span style={s.rowBadge(1)}>Row 1</span>
              Scrolls left · {row1.length} photo{row1.length !== 1 ? 's' : ''}
            </div>
            {row1.length === 0 ? (
              <div style={s.emptyRow}>No photos in Row 1 — click "+ Add Photo" and select Row 1</div>
            ) : (
              <div style={s.grid}>
                {row1.map(p => <PhotoCard key={p.id} photo={p} rowPhotos={row1} />)}
              </div>
            )}
          </div>

          {/* Row 2 */}
          <div style={s.section}>
            <div style={s.sectionTitle}>
              <span style={s.rowBadge(2)}>Row 2</span>
              Scrolls right · {row2.length} photo{row2.length !== 1 ? 's' : ''}
            </div>
            {row2.length === 0 ? (
              <div style={s.emptyRow}>No photos in Row 2 — click "+ Add Photo" and select Row 2</div>
            ) : (
              <div style={s.grid}>
                {row2.map(p => <PhotoCard key={p.id} photo={p} rowPhotos={row2} />)}
              </div>
            )}
          </div>

          {/* Info box */}
          <div style={{
            background: 'rgba(31,184,214,0.06)', border: '1px solid rgba(31,184,214,0.15)',
            borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#64748B', lineHeight: 1.6,
          }}>
            <strong style={{ color: '#27DCFF' }}>How it works:</strong> Photos upload here → get stored on the server → appear automatically on the live landing page.
            Row 1 scrolls left, Row 2 scrolls right. Use ← → buttons to reorder within a row. Eye button hides without deleting.
          </div>
        </>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={s.modal}>
            <div style={s.modalTitle}>{modal === 'add' ? 'Upload New Photo' : 'Edit Photo Card'}</div>

            {/* Drop zone */}
            <div style={s.field}>
              <label style={s.label}>Photo {modal === 'add' ? '(required)' : '(leave empty to keep current)'}</label>
              <div
                style={{ ...s.dropzone, borderColor: dragOver ? '#1FB8D6' : '#1E2D3D' }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                {preview ? (
                  <img src={preview} alt="preview" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 8, margin: '0 auto', display: 'block' }} />
                ) : (
                  <div style={{ color: '#475569', fontSize: 13 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                    Drag & drop or click to select<br />
                    <span style={{ fontSize: 11 }}>JPG, PNG, WEBP · Max 5 MB</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])} />
            </div>

            {/* Fields */}
            <div style={s.field}>
              <label style={s.label}>Business Type Name *</label>
              <input style={s.input} placeholder="e.g. 🛒 Kirana Store" value={form.typeName}
                onChange={e => setForm(f => ({ ...f, typeName: e.target.value }))} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={s.field}>
                <label style={s.label}>Category Tag</label>
                <input style={s.input} placeholder="e.g. Retail" value={form.tag}
                  onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Alt Text</label>
                <input style={s.input} placeholder="e.g. Kirana store interior" value={form.altText}
                  onChange={e => setForm(f => ({ ...f, altText: e.target.value }))} />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Modules Text</label>
              <input style={s.input} placeholder="e.g. POS · Inventory · GST · WhatsApp" value={form.modules}
                onChange={e => setForm(f => ({ ...f, modules: e.target.value }))} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={s.field}>
                <label style={s.label}>Background</label>
                <select style={s.select} value={form.bgClass} onChange={e => setForm(f => ({ ...f, bgClass: e.target.value }))}>
                  {BG_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Row</label>
                <select style={s.select} value={form.rowIndex} onChange={e => setForm(f => ({ ...f, rowIndex: parseInt(e.target.value) }))}>
                  <option value={1}>Row 1 (← left)</option>
                  <option value={2}>Row 2 (→ right)</option>
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Sort Order</label>
                <input style={s.input} type="number" min={0} value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={closeModal}>Cancel</button>
              <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : modal === 'add' ? 'Upload Photo' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
