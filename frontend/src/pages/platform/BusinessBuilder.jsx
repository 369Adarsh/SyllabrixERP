import { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import {
  getBBCategories, createBBCategory, checkBBCategoryCode,
  getBBTypes, getBBType, createBBType, updateBBType, deleteBBType, cloneBBType,
  previewBBTypeCode, setBBModules, publishBBType, unpublishBBType,
  suggestBBRoles, setBBRoles, saveBBTemplate, getBBTemplates, applyBBTemplate,
} from '../../api/platform';
import { resolveDependencies, checkRemovalImpact } from '../../lib/dependencyEngine';
import { generateCategoryCode } from '../../lib/codeGenerator';

// ── Module Registry ──────────────────────────────────────────────────────────

const ALL_MODULES = [
  { key: 'invoicing',    label: 'Invoicing',         icon: '🧾', category: 'Finance' },
  { key: 'pos',          label: 'Point of Sale',      icon: '🛒', category: 'Commerce' },
  { key: 'inventory',    label: 'Inventory',          icon: '📦', category: 'Commerce' },
  { key: 'customers',    label: 'Customers',          icon: '👥', category: 'Commerce' },
  { key: 'expenses',     label: 'Expenses',           icon: '💸', category: 'Finance' },
  { key: 'reports',      label: 'Reports',            icon: '📊', category: 'Finance' },
  { key: 'staff',        label: 'Staff',              icon: '👤', category: 'People' },
  { key: 'attendance',   label: 'Attendance',         icon: '🕐', category: 'People' },
  { key: 'payroll',      label: 'Payroll',            icon: '💰', category: 'People' },
  { key: 'appointments', label: 'Appointments',       icon: '📅', category: 'Service' },
  { key: 'fees',         label: 'Fees',               icon: '🎓', category: 'Service' },
  { key: 'progress',     label: 'Progress Hub',       icon: '📚', category: 'Service' },
  { key: 'membershipplans', label: 'Memberships',     icon: '🔄', category: 'Service' },
  { key: 'campaigns',    label: 'Campaigns',          icon: '📣', category: 'Comms' },
  { key: 'whatsapp',     label: 'WhatsApp',           icon: '💬', category: 'Comms' },
  { key: 'creditnotes',  label: 'Credit Notes',       icon: '📝', category: 'Finance' },
  { key: 'quotations',   label: 'Quotations',         icon: '📄', category: 'Finance' },
  { key: 'vendors',      label: 'Vendors & Bills',    icon: '🏭', category: 'Finance' },
  { key: 'bills',        label: 'Bills & Payables',   icon: '🏷', category: 'Finance' },
  { key: 'assets',       label: 'Asset Management',   icon: '🏗', category: 'Finance' },
  { key: 'lease',        label: 'Lease Management',   icon: '🏢', category: 'Service' },
  { key: 'returns',      label: 'Returns',            icon: '↩️', category: 'Commerce' },
  { key: 'b2b',          label: 'B2B Marketplace',    icon: '🤝', category: 'Commerce' },
  { key: 'training',     label: 'Training Plans',     icon: '🏋️', category: 'Service' },
];

const CAT_COLOR = { Finance: '#34D399', Commerce: '#60A5FA', People: '#A78BFA', Service: '#FBBF24', Comms: '#F472B6' };
const TIER_COLORS = { CORE: '#1FB8D6', OPTIONAL: '#A78BFA', LOCKED: '#94A3B8' };
const TIER_LABELS = { CORE: 'Core', OPTIONAL: 'Optional', LOCKED: 'Locked' };

// ── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: { display: 'flex', height: '100vh', overflow: 'hidden', background: '#0F1923' },
  sidebar: { width: 280, borderRight: '1px solid #1E2D3D', background: '#0B131C', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidebarHead: { padding: '20px 16px 12px', borderBottom: '1px solid #1E2D3D', flexShrink: 0 },
  main: { flex: 1, overflow: 'auto', padding: 28 },
  h1: { fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 2 },
  sub: { fontSize: 11, color: '#64748B' },
  card: { background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: 20, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5, display: 'block' },
  input: { width: '100%', background: '#0F1923', border: '1px solid #1E2D3D', borderRadius: 8, padding: '9px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  btn: (v) => ({
    padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
    ...(v === 'primary'  && { background: '#1FB8D6', color: '#0B131C' }),
    ...(v === 'success'  && { background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }),
    ...(v === 'danger'   && { background: 'rgba(220,38,38,0.12)', color: '#F87171', border: '1px solid rgba(220,38,38,0.25)' }),
    ...(v === 'ghost'    && { background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid #1E2D3D' }),
    ...(v === 'amber'    && { background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.25)' }),
  }),
  badge: (c) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${c}22`, color: c }),
  codeBox: { fontFamily: 'monospace', background: '#0B131C', border: '1px solid #1E2D3D', borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 700, color: '#1FB8D6', letterSpacing: '0.05em' },
  stepDot: (active, done) => ({
    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700,
    background: done ? '#1FB8D6' : active ? 'rgba(31,184,214,0.2)' : '#1E2D3D',
    color: done ? '#0B131C' : active ? '#1FB8D6' : '#475569',
    border: active ? '2px solid #1FB8D6' : '2px solid transparent',
  }),
};

// ── Draggable Module Card ─────────────────────────────────────────────────────

function DraggableModuleCard({ mod, onAdd, inCanvas }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `lib-${mod.key}` });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={{ ...style, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', marginBottom: 4, borderRadius: 8, background: '#0F1923', border: '1px solid #1E2D3D', cursor: 'grab', userSelect: 'none' }}
      {...attributes}
      {...listeners}
      onClick={() => !inCanvas && onAdd(mod.key)}
    >
      <span style={{ fontSize: 14 }}>{mod.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>{mod.label}</div>
        <div style={{ fontSize: 10, color: CAT_COLOR[mod.category] || '#64748B' }}>{mod.category}</div>
      </div>
      {!inCanvas && <span style={{ fontSize: 10, color: '#334155' }}>+</span>}
    </div>
  );
}

// ── Canvas Module Item (sortable) ─────────────────────────────────────────────

function CanvasModule({ mod, tier, onTierChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `canvas-${mod.key}` });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', marginBottom: 6,
        borderRadius: 9, background: '#0B131C', border: `1px solid ${TIER_COLORS[tier]}33`,
        cursor: 'grab',
      }}
    >
      <span {...attributes} {...listeners} style={{ fontSize: 14, flexShrink: 0 }}>{mod.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9' }}>{mod.label}</div>
        <div style={{ fontSize: 10, color: CAT_COLOR[mod.category] || '#64748B' }}>{mod.category}</div>
      </div>
      <select
        value={tier}
        onChange={e => onTierChange(mod.key, e.target.value)}
        style={{ background: `${TIER_COLORS[tier]}22`, border: `1px solid ${TIER_COLORS[tier]}55`, borderRadius: 6, color: TIER_COLORS[tier], fontSize: 11, fontWeight: 700, padding: '2px 6px', cursor: 'pointer' }}
        onClick={e => e.stopPropagation()}
      >
        <option value="CORE">Core</option>
        <option value="OPTIONAL">Optional</option>
        <option value="LOCKED">Locked</option>
      </select>
      <button onClick={() => onRemove(mod.key)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>×</button>
    </div>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────

const STEPS = ['Category', 'Identity', 'Modules', 'Roles', 'Publish'];

function Stepper({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0 28px', marginBottom: 28 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={S.stepDot(current === i, current > i)}>
              {current > i ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: current >= i ? '#F1F5F9' : '#475569', whiteSpace: 'nowrap' }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 1, background: current > i ? '#1FB8D6' : '#1E2D3D', margin: '0 12px', minWidth: 20 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function BusinessBuilder() {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQ, setSearchQ] = useState('');

  // Wizard state
  const [selectedCat, setSelectedCat] = useState(null);
  const [newCatForm, setNewCatForm] = useState({ name: '', icon: '', description: '' });
  const [newCatCode, setNewCatCode] = useState('');
  const [codeAvailable, setCodeAvailable] = useState(null);
  const [typeName, setTypeName] = useState('');
  const [typeIcon, setTypeIcon] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [typeCodeAvailable, setTypeCodeAvailable] = useState(null);
  const [canvas, setCanvas] = useState([]); // [{ moduleKey, tier, sortOrder }]
  const [suggestedRoles, setSuggestedRoles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [activeBT, setActiveBT] = useState(null); // businessTypeConfig being edited/created
  const [activeLibItem, setActiveLibItem] = useState(null);
  const [depToast, setDepToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, t, tpl] = await Promise.all([getBBCategories(), getBBTypes(), getBBTemplates()]);
      setCategories(c.data?.data || []);
      setTypes(t.data?.data || []);
      setTemplates(tpl.data?.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Code preview for category
  useEffect(() => {
    if (!newCatForm.name) { setNewCatCode(''); setCodeAvailable(null); return; }
    setNewCatCode(generateCategoryCode(newCatForm.name));
  }, [newCatForm.name]);

  // Code preview for business type
  useEffect(() => {
    if (!selectedCat || !typeName) { setTypeCode(''); setTypeCodeAvailable(null); return; }
    const t = setTimeout(async () => {
      try {
        const r = await previewBBTypeCode(selectedCat.id, typeName);
        setTypeCode(r.data?.data?.code || '');
        setTypeCodeAvailable(r.data?.data?.available ?? null);
      } catch { setTypeCode(''); }
    }, 400);
    return () => clearTimeout(t);
  }, [selectedCat, typeName]);

  const resetWizard = () => {
    setStep(0); setSelectedCat(null);
    setNewCatForm({ name: '', icon: '', description: '' }); setNewCatCode(''); setCodeAvailable(null);
    setTypeName(''); setTypeIcon(''); setTypeDesc(''); setTypeCode(''); setTypeCodeAvailable(null);
    setCanvas([]); setSuggestedRoles([]); setRoles([]); setActiveBT(null);
  };

  const startCreate = () => { resetWizard(); setView('create'); };

  const openEdit = async (bt) => {
    const r = await getBBType(bt.id);
    const full = r.data?.data;
    setActiveBT(full);
    setSelectedCat(full.category);
    setTypeName(full.name); setTypeIcon(full.icon || ''); setTypeDesc(full.description || '');
    setTypeCode(full.code);
    setCanvas((full.modules || []).map(m => ({ moduleKey: m.moduleKey, tier: m.tier, sortOrder: m.sortOrder })));
    setRoles(full.roles || []);
    setView('edit'); setStep(2);
  };

  // ── Step 1 helpers ──

  const checkCatCode = async () => {
    if (!newCatCode) return;
    const r = await checkBBCategoryCode(newCatCode);
    setCodeAvailable(r.data?.data?.available ?? false);
  };

  const confirmCategory = async () => {
    // Create new category if needed
    if (!selectedCat) {
      if (!newCatForm.name) { toast.error('Enter a category name'); return; }
      try {
        const r = await createBBCategory({ ...newCatForm, code: newCatCode });
        const cat = r.data?.data;
        setCategories(prev => [...prev, cat]);
        setSelectedCat(cat);
        toast.success(`Category "${cat.name}" created`);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to create category');
        return;
      }
    }
    setStep(1);
  };

  // ── Step 2 helpers ──

  const confirmIdentity = async () => {
    if (!typeName) { toast.error('Enter a business type name'); return; }
    setSaving(true);
    try {
      let bt;
      if (activeBT) {
        const r = await updateBBType(activeBT.id, { name: typeName, icon: typeIcon, description: typeDesc });
        bt = r.data?.data;
      } else {
        const r = await createBBType({ name: typeName, icon: typeIcon, description: typeDesc, categoryId: selectedCat.id });
        bt = r.data?.data;
      }
      setActiveBT(bt);
      setTypeCode(bt.code);
      setStep(2);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  // ── Step 3 (Module Canvas) helpers ──

  const canvasModules = canvas.map(c => ({ ...c, mod: ALL_MODULES.find(m => m.key === c.moduleKey) })).filter(c => c.mod);
  const libraryModules = ALL_MODULES.filter(m => !canvas.find(c => c.moduleKey === m.key));
  const canvasKeys = canvas.map(c => c.moduleKey);

  const addModule = (key) => {
    const deps = resolveDependencies(key, canvasKeys);
    const additions = [key, ...deps];
    setCanvas(prev => {
      const existing = prev.map(c => c.moduleKey);
      const toAdd = additions.filter(k => !existing.includes(k));
      return [...prev, ...toAdd.map((k, i) => ({ moduleKey: k, tier: 'CORE', sortOrder: prev.length + i }))];
    });
    if (deps.length) {
      setDepToast(`Auto-added: ${deps.map(d => ALL_MODULES.find(m => m.key === d)?.label || d).join(', ')}`);
      setTimeout(() => setDepToast(null), 3000);
    }
  };

  const removeModule = (key) => {
    const impact = checkRemovalImpact(key, canvasKeys);
    if (impact.length) {
      const names = impact.map(k => ALL_MODULES.find(m => m.key === k)?.label || k).join(', ');
      if (!confirm(`Removing this module will also remove: ${names}. Continue?`)) return;
      setCanvas(prev => prev.filter(c => !impact.includes(c.moduleKey) && c.moduleKey !== key));
    } else {
      setCanvas(prev => prev.filter(c => c.moduleKey !== key));
    }
  };

  const changeTier = (key, tier) => setCanvas(prev => prev.map(c => c.moduleKey === key ? { ...c, tier } : c));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveLibItem(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId.startsWith('lib-')) {
      const key = activeId.replace('lib-', '');
      if (overId === 'drop-zone' || overId.startsWith('canvas-')) addModule(key);
      return;
    }
    if (activeId.startsWith('canvas-') && overId.startsWith('canvas-')) {
      const fromKey = activeId.replace('canvas-', '');
      const toKey = overId.replace('canvas-', '');
      const fromIdx = canvas.findIndex(c => c.moduleKey === fromKey);
      const toIdx = canvas.findIndex(c => c.moduleKey === toKey);
      if (fromIdx !== toIdx) {
        setCanvas(prev => arrayMove(prev, fromIdx, toIdx).map((c, i) => ({ ...c, sortOrder: i })));
      }
    }
  };

  const saveModules = async () => {
    if (!activeBT) return;
    setSaving(true);
    try {
      await setBBModules(activeBT.id, canvas.map((c, i) => ({ ...c, sortOrder: i })));
      toast.success('Modules saved');
      const suggested = await suggestBBRoles(activeBT.id);
      setSuggestedRoles(suggested.data?.data || []);
      setRoles(suggested.data?.data?.map(r => ({ ...r, permissions: {} })) || []);
      setStep(3);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save modules');
    } finally { setSaving(false); }
  };

  // ── Step 4 (Roles) helpers ──

  const saveRoles = async () => {
    if (!activeBT) return;
    setSaving(true);
    try {
      await setBBRoles(activeBT.id, roles.map(r => ({ roleName: r.roleName, permissions: r.permissions || {}, isDefault: true })));
      toast.success('Roles saved');
      setStep(4);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  // ── Step 5 (Publish) helpers ──

  const publish = async () => {
    if (!activeBT) return;
    setSaving(true);
    try {
      await publishBBType(activeBT.id);
      toast.success(`"${activeBT.name}" is now live`);
      load();
      resetWizard();
      setView('list');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Publish failed');
    } finally { setSaving(false); }
  };

  const saveDraft = async () => {
    toast.success('Saved as draft');
    load();
    resetWizard();
    setView('list');
  };

  // ── List view actions ──

  const handleToggle = async (bt) => {
    try {
      if (bt.isActive) {
        await unpublishBBType(bt.id);
        toast.success('Unpublished');
      } else {
        await publishBBType(bt.id);
        toast.success('Published');
      }
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleClone = async (bt) => {
    try {
      const r = await cloneBBType(bt.id);
      toast.success(`Cloned "${bt.name}"`);
      load();
    } catch { toast.error('Clone failed'); }
  };

  const handleDelete = async (bt) => {
    if (!confirm(`Delete "${bt.name}"? This cannot be undone.`)) return;
    try {
      await deleteBBType(bt.id);
      toast.success('Deleted');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Cannot delete published type'); }
  };

  // ── Filtered list ──

  const filteredTypes = types.filter(t => {
    if (filterCat && t.categoryId !== filterCat) return false;
    if (filterStatus === 'active' && !t.isActive) return false;
    if (filterStatus === 'draft' && t.isActive) return false;
    if (searchQ && !t.name.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div style={{ padding: 28, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>Business Builder</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>
              {types.length} business types · {categories.length} categories · {types.filter(t => t.isActive).length} live
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={S.btn('ghost')} onClick={() => { load(); }}>Refresh</button>
            <button style={S.btn('primary')} onClick={startCreate}>+ New Business Type</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input style={{ ...S.input, maxWidth: 220 }} placeholder="Search..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          <select style={{ ...S.input, maxWidth: 200 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select style={{ ...S.input, maxWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Live</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Group by category */}
        {loading ? (
          <div style={{ color: '#64748B', fontSize: 14 }}>Loading…</div>
        ) : (
          categories.map(cat => {
            const catTypes = filteredTypes.filter(t => t.categoryId === cat.id);
            if (!catTypes.length && filterCat && filterCat !== cat.id) return null;
            if (!catTypes.length) return null;
            return (
              <div key={cat.id} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>{cat.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>{cat.name}</span>
                  <span style={{ fontSize: 11, color: '#334155', fontFamily: 'monospace' }}>{cat.code}</span>
                  <span style={{ fontSize: 11, color: '#64748B' }}>· {catTypes.length} types</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                  {catTypes.map(bt => (
                    <div key={bt.id} style={{ background: '#192533', border: `1px solid ${bt.isActive ? '#1E3A5F' : '#1E2D3D'}`, borderRadius: 10, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{bt.icon || '🔷'}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{bt.name}</div>
                            <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#475569' }}>{bt.code}</div>
                          </div>
                        </div>
                        <span style={S.badge(bt.isActive ? '#34D399' : '#64748B')}>{bt.isActive ? 'Live' : 'Draft'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#475569', marginBottom: 12 }}>
                        {bt._count?.modules || 0} modules · {bt._count?.roles || 0} roles
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button style={{ ...S.btn('ghost'), padding: '4px 10px', fontSize: 11 }} onClick={() => openEdit(bt)}>Edit</button>
                        <button style={{ ...S.btn(bt.isActive ? 'amber' : 'success'), padding: '4px 10px', fontSize: 11 }} onClick={() => handleToggle(bt)}>
                          {bt.isActive ? 'Unpublish' : 'Publish'}
                        </button>
                        <button style={{ ...S.btn('ghost'), padding: '4px 10px', fontSize: 11 }} onClick={() => handleClone(bt)}>Clone</button>
                        {!bt.isActive && <button style={{ ...S.btn('danger'), padding: '4px 10px', fontSize: 11 }} onClick={() => handleDelete(bt)}>Delete</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
        {!loading && filteredTypes.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
            No business types found. <button style={{ ...S.btn('primary'), marginLeft: 12 }} onClick={startCreate}>Create First</button>
          </div>
        )}
      </div>
    );
  }

  // ── Wizard (create / edit) ────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px 28px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button style={{ ...S.btn('ghost'), padding: '6px 12px', fontSize: 12 }} onClick={() => { resetWizard(); setView('list'); }}>← Back</button>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9' }}>{view === 'edit' ? `Editing: ${activeBT?.name || '…'}` : 'New Business Type'}</div>
      </div>

      <Stepper current={step} />

      {/* ── Step 1: Category ── */}
      {step === 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>Step 1 — Category</div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>Does this business fit an existing category?</div>

          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Pick existing category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setSelectedCat(c); setNewCatForm({ name: '', icon: '', description: '' }); }}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${selectedCat?.id === c.id ? '#1FB8D6' : '#1E2D3D'}`,
                    background: selectedCat?.id === c.id ? 'rgba(31,184,214,0.12)' : '#0F1923',
                    color: selectedCat?.id === c.id ? '#1FB8D6' : '#64748B',
                  }}
                >
                  {c.icon} {c.name} <span style={{ opacity: 0.5, fontFamily: 'monospace', fontSize: 10 }}>{c.code.replace('SYL-BC-', '')}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1E2D3D', paddingTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 12 }}>— OR create a new category —</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Category Name</label>
                <input style={S.input} value={newCatForm.name} onChange={e => { setNewCatForm(f => ({ ...f, name: e.target.value })); setSelectedCat(null); }} placeholder="e.g. Pet & Animal Care" />
              </div>
              <div style={{ width: 80 }}>
                <label style={S.label}>Icon</label>
                <input style={S.input} value={newCatForm.icon} onChange={e => setNewCatForm(f => ({ ...f, icon: e.target.value }))} placeholder="🐾" />
              </div>
            </div>
            {newCatForm.name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={S.codeBox}>{newCatCode}</div>
                <button style={S.btn('ghost')} onClick={checkCatCode}>Check availability</button>
                {codeAvailable === true && <span style={{ color: '#34D399', fontSize: 12 }}>✓ Available</span>}
                {codeAvailable === false && <span style={{ color: '#F87171', fontSize: 12 }}>✗ Taken</span>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={S.btn('primary')} onClick={confirmCategory} disabled={!selectedCat && !newCatForm.name}>
              {selectedCat ? `Continue with "${selectedCat.name}"` : 'Create Category & Continue'} →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Identity ── */}
      {step === 1 && (
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>Step 2 — Business Type Identity</div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>Category: {selectedCat?.icon} <strong style={{ color: '#94A3B8' }}>{selectedCat?.name}</strong></div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Business Type Name *</label>
              <input style={S.input} value={typeName} onChange={e => setTypeName(e.target.value)} placeholder="e.g. Pet Shop" autoFocus />
            </div>
            <div style={{ width: 80 }}>
              <label style={S.label}>Icon</label>
              <input style={S.input} value={typeIcon} onChange={e => setTypeIcon(e.target.value)} placeholder="🐾" />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Description</label>
            <input style={S.input} value={typeDesc} onChange={e => setTypeDesc(e.target.value)} placeholder="Short description of this business type" />
          </div>

          {typeCode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <label style={S.label}>Generated ID:</label>
              <div style={S.codeBox}>{typeCode}</div>
              {typeCodeAvailable === true && <span style={{ color: '#34D399', fontSize: 12 }}>✓ Available</span>}
              {typeCodeAvailable === false && <span style={{ color: '#F87171', fontSize: 12 }}>✗ Taken — will auto-increment</span>}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button style={S.btn('ghost')} onClick={() => setStep(0)}>← Back</button>
            <button style={S.btn('primary')} onClick={confirmIdentity} disabled={!typeName || saving}>
              {saving ? 'Saving…' : 'Continue to Modules →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Module Canvas ── */}
      {step === 2 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setActiveLibItem(e.active.id)} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Left: Module Library */}
            <div style={{ width: 240, flexShrink: 0 }}>
              <div style={S.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 12 }}>Module Library</div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>Drag or click to add</div>
                {['Finance','Commerce','People','Service','Comms'].map(cat => {
                  const mods = libraryModules.filter(m => m.category === cat);
                  if (!mods.length) return null;
                  return (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: CAT_COLOR[cat], letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{cat}</div>
                      <SortableContext items={mods.map(m => `lib-${m.key}`)} strategy={verticalListSortingStrategy}>
                        {mods.map(m => <DraggableModuleCard key={m.key} mod={m} onAdd={addModule} inCanvas={false} />)}
                      </SortableContext>
                    </div>
                  );
                })}
              </div>

              {templates.length > 0 && (
                <div style={S.card}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 8 }}>Templates</div>
                  {templates.map(tpl => (
                    <button
                      key={tpl.id}
                      style={{ ...S.btn('ghost'), width: '100%', marginBottom: 4, padding: '6px 10px', fontSize: 11, textAlign: 'left' }}
                      onClick={async () => {
                        if (!activeBT) return;
                        await applyBBTemplate(activeBT.id, tpl.id);
                        const r = await getBBType(activeBT.id);
                        setCanvas((r.data?.data?.modules || []).map(m => ({ moduleKey: m.moduleKey, tier: m.tier, sortOrder: m.sortOrder })));
                        toast.success('Template applied');
                      }}
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Canvas */}
            <div style={{ flex: 1 }}>
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>Module Canvas — {typeIcon || '🔷'} {typeName}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{canvas.length} modules · {canvas.filter(c => c.tier === 'CORE').length} core, {canvas.filter(c => c.tier === 'OPTIONAL').length} optional</div>
                  </div>
                  {activeBT && (
                    <button style={{ ...S.btn('ghost'), fontSize: 11, padding: '5px 10px' }} onClick={async () => {
                      const n = prompt('Template name?');
                      if (n) { await saveBBTemplate(activeBT.id, { name: n }); toast.success('Template saved'); const tpl = await getBBTemplates(); setTemplates(tpl.data?.data || []); }
                    }}>Save as Template</button>
                  )}
                </div>

                {depToast && (
                  <div style={{ background: 'rgba(31,184,214,0.1)', border: '1px solid rgba(31,184,214,0.25)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#1FB8D6', marginBottom: 12 }}>
                    🔗 {depToast}
                  </div>
                )}

                <div
                  id="drop-zone"
                  style={{ minHeight: 200, borderRadius: 10, border: canvas.length ? '1px solid #1E2D3D' : '2px dashed #1E2D3D', padding: canvas.length ? 0 : 32, display: 'flex', flexDirection: 'column', alignItems: canvas.length ? 'stretch' : 'center', justifyContent: canvas.length ? 'flex-start' : 'center' }}
                >
                  {canvas.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#334155', fontSize: 13 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
                      Drag modules here or click them in the library
                    </div>
                  ) : (
                    <SortableContext items={canvasModules.map(c => `canvas-${c.moduleKey}`)} strategy={verticalListSortingStrategy}>
                      {canvasModules.map(c => (
                        <CanvasModule key={c.moduleKey} mod={c.mod} tier={c.tier} onTierChange={changeTier} onRemove={removeModule} />
                      ))}
                    </SortableContext>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                  <button style={S.btn('ghost')} onClick={() => setStep(1)}>← Back</button>
                  <button style={S.btn('primary')} onClick={saveModules} disabled={!canvas.length || saving}>
                    {saving ? 'Saving…' : 'Save Modules & Continue →'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeLibItem && (() => {
              const key = activeLibItem.replace('lib-', '').replace('canvas-', '');
              const mod = ALL_MODULES.find(m => m.key === key);
              if (!mod) return null;
              return (
                <div style={{ padding: '7px 10px', borderRadius: 8, background: '#1FB8D6', color: '#0B131C', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  <span>{mod.icon}</span>{mod.label}
                </div>
              );
            })()}
          </DragOverlay>
        </DndContext>
      )}

      {/* ── Step 4: Roles ── */}
      {step === 3 && (
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>Step 4 — Roles</div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>Auto-generated roles based on your module selection. Customise as needed.</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            {suggestedRoles.map(r => (
              <div key={r.roleName} style={{ background: '#0F1923', border: '1px solid #1E2D3D', borderRadius: 10, padding: '12px 16px', minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color || '#64748B' }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{r.roleName}</div>
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Auto-generated</div>
              </div>
            ))}
          </div>

          {suggestedRoles.length === 0 && <div style={{ color: '#64748B', fontSize: 13, marginBottom: 20 }}>No roles auto-generated. Add modules first.</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button style={S.btn('ghost')} onClick={() => setStep(2)}>← Back</button>
            <button style={S.btn('primary')} onClick={saveRoles} disabled={saving}>
              {saving ? 'Saving…' : 'Save Roles & Continue →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Publish ── */}
      {step === 4 && (
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>Step 5 — Review & Publish</div>

          <div style={{ background: '#0F1923', border: '1px solid #1E2D3D', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px 8px', fontSize: 13 }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Category</span>
              <span style={{ color: '#F1F5F9' }}>{selectedCat?.icon} {selectedCat?.name} <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>({selectedCat?.code})</span></span>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Business Type</span>
              <span style={{ color: '#F1F5F9' }}>{typeIcon} {typeName}</span>
              <span style={{ color: '#64748B', fontWeight: 600 }}>ID</span>
              <span style={{ fontFamily: 'monospace', color: '#1FB8D6', fontWeight: 700 }}>{typeCode}</span>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Modules</span>
              <span style={{ color: '#F1F5F9' }}>{canvas.length} modules — {canvas.filter(c => c.tier === 'CORE').length} core, {canvas.filter(c => c.tier === 'OPTIONAL').length} optional, {canvas.filter(c => c.tier === 'LOCKED').length} locked</span>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Roles</span>
              <span style={{ color: '#F1F5F9' }}>{suggestedRoles.length} auto-generated</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button style={S.btn('ghost')} onClick={() => setStep(3)}>← Back</button>
            <button style={S.btn('ghost')} onClick={saveDraft}>Save as Draft</button>
            <div style={{ flex: 1 }} />
            <button style={{ ...S.btn('primary'), padding: '10px 24px', fontSize: 15 }} onClick={publish} disabled={saving}>
              {saving ? 'Publishing…' : '🚀 Publish — Go Live'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
