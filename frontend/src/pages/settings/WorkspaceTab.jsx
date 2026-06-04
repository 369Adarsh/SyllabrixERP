import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateSidebarConfig, updateLabelConfig } from '../../api';
import { ALL_LINKS, getAvailableLinks, getDefaultPaths, CATEGORY_META, GYM_MODULE_KEY, CLINIC_TYPES } from '../../config/sidebarLinks';
import { getSuggestions } from '../../config/labelSuggestions';
import { Lock, ChevronUp, ChevronDown, RotateCcw, Save, Eye, EyeOff, Layers, Pencil, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'STAFF'];

const ROLE_META = {
  OWNER:      { color: '#7C3AED', bg: '#EDE9FE', label: 'Owner' },
  ADMIN:      { color: '#2563EB', bg: '#EFF6FF', label: 'Admin' },
  MANAGER:    { color: '#0891B2', bg: '#ECFEFF', label: 'Manager' },
  ACCOUNTANT: { color: '#D97706', bg: '#FFFBEB', label: 'Accountant' },
  CASHIER:    { color: '#059669', bg: '#ECFDF5', label: 'Cashier' },
  STAFF:      { color: '#6B7280', bg: '#F3F4F6', label: 'Staff' },
};

// ── Inline label editor ───────────────────────────────────────────────────────
function LabelEditor({ link, businessType, currentLabel, defaultLabel, onSave, onClose }) {
  const [value, setValue]   = useState(currentLabel || defaultLabel);
  const inputRef            = useRef(null);
  const suggestions         = getSuggestions(link.to, businessType);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSave(link.to, trimmed === defaultLabel ? null : trimmed);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
      background: '#fff', border: '1px solid #E5E7EB',
      borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      padding: 14, marginTop: 4,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Rename "{defaultLabel}"
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 6, marginBottom: suggestions.length ? 12 : 0 }}>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          maxLength={40}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            border: '1px solid #D1D5DB', fontSize: 13, fontWeight: 500,
            outline: 'none', color: '#111827',
          }}
          placeholder="Type a custom name…"
        />
        <button
          onClick={commit}
          style={{ background: 'var(--navy)', border: 'none', borderRadius: 8, padding: '0 12px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}
          title="Confirm"
        >
          <Check size={14} />
        </button>
        <button
          onClick={onClose}
          style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '0 10px', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center' }}
          title="Cancel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Suggestions for {businessType?.replace(/_/g, ' ')}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => { setValue(s); inputRef.current?.focus(); }}
                style={{
                  padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  background: value === s ? 'var(--navy)' : '#F0F4FF',
                  color: value === s ? '#fff' : '#2563EB',
                  transition: 'all 0.1s',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset to default hint */}
      {currentLabel && currentLabel !== defaultLabel && (
        <button
          onClick={() => { setValue(defaultLabel); onSave(link.to, null); }}
          style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 11, fontWeight: 600, padding: 0 }}
        >
          <RotateCcw size={10} />
          Reset to default "{defaultLabel}"
        </button>
      )}
    </div>
  );
}

// ── Main WorkspaceTab ──────────────────────────────────────────────────────────
export default function WorkspaceTab() {
  const { tenant, refreshMe }     = useAuth();
  const [selectedRole, setSelectedRole] = useState('OWNER');
  const [config, setConfig]       = useState({});
  const [labels, setLabels]       = useState({});
  const [editingPath, setEditingPath] = useState(null);
  const [sidebarDirty, setSidebarDirty] = useState(false);
  const [labelDirty, setLabelDirty]     = useState(false);
  const [saving, setSaving]       = useState(false);

  const modules     = Array.isArray(tenant?.modules) ? tenant.modules : [];
  const isGym       = modules.includes(GYM_MODULE_KEY);
  const isClinic    = CLINIC_TYPES.includes(tenant?.businessType);
  const businessType = tenant?.businessType;

  // Load from tenant on mount
  useEffect(() => {
    if (tenant?.sidebarConfig && typeof tenant.sidebarConfig === 'object')
      setConfig(tenant.sidebarConfig);
    if (tenant?.labelConfig && typeof tenant.labelConfig === 'object')
      setLabels(tenant.labelConfig);
  }, [tenant]);

  // Close editor on outside click
  const wrapperRef = useRef(null);
  useEffect(() => {
    if (!editingPath) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setEditingPath(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editingPath]);

  const availableLinks  = getAvailableLinks(tenant);
  const getVisiblePaths = (role) => config[role] ?? getDefaultPaths(tenant, role);
  const visiblePaths    = getVisiblePaths(selectedRole);
  const isLocked        = (link) => !!link.module && !modules.includes(link.module);

  // Resolve display label for a link (custom → built-in override → default)
  const resolveDisplayLabel = (link) => {
    if (labels[link.to]) return labels[link.to];
    if (link.to === '/customers' && isClinic) return 'Patients';
    if (link.to === '/customers' && isGym)    return 'Members';
    if (link.to === '/appointments' && isGym) return 'Sessions';
    if (link.to === '/staff'  && isGym)       return 'Trainers';
    if (link.to === '/assets' && isGym)       return 'Equipment';
    return link.label;
  };

  // ── Sidebar config actions ──
  const toggle = (path) => {
    const current = getVisiblePaths(selectedRole);
    const updated = current.includes(path)
      ? current.filter(p => p !== path)
      : [...current, path];
    setConfig(prev => ({ ...prev, [selectedRole]: updated }));
    setSidebarDirty(true);
  };

  const moveUp = (path) => {
    const current = [...getVisiblePaths(selectedRole)];
    const idx = current.indexOf(path);
    if (idx <= 0) return;
    [current[idx - 1], current[idx]] = [current[idx], current[idx - 1]];
    setConfig(prev => ({ ...prev, [selectedRole]: current }));
    setSidebarDirty(true);
  };

  const moveDown = (path) => {
    const current = [...getVisiblePaths(selectedRole)];
    const idx = current.indexOf(path);
    if (idx === -1 || idx === current.length - 1) return;
    [current[idx], current[idx + 1]] = [current[idx + 1], current[idx]];
    setConfig(prev => ({ ...prev, [selectedRole]: current }));
    setSidebarDirty(true);
  };

  const resetToDefault = () => {
    setConfig(prev => ({ ...prev, [selectedRole]: getDefaultPaths(tenant, selectedRole) }));
    setSidebarDirty(true);
    toast.success(`Reset ${ROLE_META[selectedRole]?.label} to default`);
  };

  // ── Label actions ──
  const saveLabel = (path, value) => {
    setLabels(prev => {
      const next = { ...prev };
      if (value === null) delete next[path];
      else next[path] = value;
      return next;
    });
    setLabelDirty(true);
    setEditingPath(null);
  };

  // ── Save all ──
  const save = async () => {
    setSaving(true);
    try {
      const ops = [];
      if (sidebarDirty) ops.push(updateSidebarConfig(config));
      if (labelDirty)   ops.push(updateLabelConfig(labels));
      await Promise.all(ops);
      await refreshMe();
      setSidebarDirty(false);
      setLabelDirty(false);
      toast.success('Workspace saved');
    } catch {
      toast.error('Failed to save — try again');
    } finally {
      setSaving(false);
    }
  };

  const isDirty     = sidebarDirty || labelDirty;
  const activeLinks = visiblePaths
    .map(p => availableLinks.find(l => l.to === p))
    .filter(Boolean);

  const inactiveLinks = availableLinks.filter(l => !visiblePaths.includes(l.to));
  const inactiveByCategory = inactiveLinks.reduce((acc, l) => {
    const cat = l.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(l);
    return acc;
  }, {});

  const rm = ROLE_META[selectedRole] || ROLE_META.STAFF;

  return (
    <div ref={wrapperRef}>

      {/* Info banner */}
      <div style={{ marginBottom: 24, padding: '14px 20px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Layers size={20} color="var(--navy)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 3 }}>Sidebar Workspace</div>
          <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
            Choose which modules each role sees and rename any label to match your business vocabulary.
            Click the <strong>pencil icon</strong> on any active item to rename it — smart suggestions are shown based on your business type.
          </div>
        </div>
      </div>

      {/* Role tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {ROLES.map(role => {
          const meta   = ROLE_META[role];
          const active = selectedRole === role;
          const count  = getVisiblePaths(role).length;
          return (
            <button key={role} onClick={() => setSelectedRole(role)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 10,
              border: active ? `2px solid ${meta.color}` : '2px solid #E5E7EB',
              background: active ? meta.bg : '#fff', cursor: 'pointer', transition: 'all 0.12s',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? meta.color : '#D1D5DB' }} />
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? meta.color : '#374151' }}>{meta.label}</span>
              <span style={{ fontSize: 11, color: active ? meta.color : '#9CA3AF', fontWeight: 600, background: active ? `${meta.color}18` : '#F3F4F6', borderRadius: 6, padding: '1px 6px' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── Active in sidebar ─────────────────────────────────────────────── */}
        <div style={{ flex: '1 1 300px', minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Active in sidebar
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: rm.color, background: rm.bg, borderRadius: 6, padding: '1px 7px' }}>
                {activeLinks.length}
              </span>
            </div>
            <button onClick={resetToDefault} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, fontWeight: 600 }}>
              <RotateCcw size={11} /> Reset
            </button>
          </div>

          <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'visible' }}>
            {activeLinks.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                No items active — add from the right panel
              </div>
            )}
            {activeLinks.map((link, idx) => {
              const Icon      = link.icon;
              const catMeta   = CATEGORY_META[link.category] || { color: '#6B7280' };
              const dispLabel = resolveDisplayLabel(link);
              const isCustom  = !!labels[link.to];
              const isEditing = editingPath === link.to;

              return (
                <div key={link.to} style={{ position: 'relative' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    borderBottom: idx < activeLinks.length - 1 ? '1px solid #F3F4F6' : 'none',
                    background: isEditing ? '#F8FAFF' : '#fff', transition: 'background 0.1s',
                  }}>
                    {/* Reorder arrows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                      <button onClick={() => moveUp(link.to)} disabled={idx === 0}
                        style={{ border: 'none', background: 'none', cursor: idx === 0 ? 'default' : 'pointer', padding: 1, color: idx === 0 ? '#D1D5DB' : '#9CA3AF', display: 'flex' }}>
                        <ChevronUp size={12} />
                      </button>
                      <button onClick={() => moveDown(link.to)} disabled={idx === activeLinks.length - 1}
                        style={{ border: 'none', background: 'none', cursor: idx === activeLinks.length - 1 ? 'default' : 'pointer', padding: 1, color: idx === activeLinks.length - 1 ? '#D1D5DB' : '#9CA3AF', display: 'flex' }}>
                        <ChevronDown size={12} />
                      </button>
                    </div>

                    {/* Icon */}
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${catMeta.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} color={catMeta.color} />
                    </div>

                    {/* Label + rename button */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{dispLabel}</span>
                        {isCustom && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#7C3AED', background: '#EDE9FE', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.04em' }}>
                            RENAMED
                          </span>
                        )}
                        <button
                          onClick={() => setEditingPath(isEditing ? null : link.to)}
                          title="Rename this label"
                          style={{
                            border: 'none', background: isEditing ? '#E0E7FF' : 'none',
                            borderRadius: 5, padding: '2px 4px', cursor: 'pointer',
                            color: isEditing ? '#4F46E5' : '#9CA3AF', display: 'flex', alignItems: 'center',
                            transition: 'all 0.1s',
                          }}
                        >
                          <Pencil size={11} />
                        </button>
                      </div>
                      <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {CATEGORY_META[link.category]?.label || link.category}
                        {isCustom && <span style={{ color: '#C4B5FD', marginLeft: 4 }}>· was "{link.label}"</span>}
                      </div>
                    </div>

                    {/* Hide button */}
                    <button onClick={() => toggle(link.to)} title="Remove from sidebar"
                      style={{ border: 'none', background: 'rgba(239,68,68,0.08)', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                      <EyeOff size={12} /> Hide
                    </button>
                  </div>

                  {/* Inline label editor — drops below the row */}
                  {isEditing && (
                    <LabelEditor
                      link={link}
                      businessType={businessType}
                      currentLabel={labels[link.to] || null}
                      defaultLabel={link.label}
                      onSave={saveLabel}
                      onClose={() => setEditingPath(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Available to add ──────────────────────────────────────────────── */}
        <div style={{ flex: '1 1 280px', minWidth: 260 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Available to add
          </div>

          {inactiveLinks.length === 0 ? (
            <div style={{ padding: '28px 20px', textAlign: 'center', border: '1px solid #E5E7EB', borderRadius: 12, color: '#9CA3AF', fontSize: 13 }}>
              All available modules are already active
            </div>
          ) : (
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
              {Object.entries(inactiveByCategory).map(([cat, catLinks], gi) => (
                <div key={cat}>
                  <div style={{
                    padding: '6px 14px', background: '#F9FAFB',
                    borderBottom: '1px solid #F0F0F0', borderTop: gi > 0 ? '1px solid #F0F0F0' : 'none',
                    fontSize: 10, fontWeight: 700, color: CATEGORY_META[cat]?.color || '#6B7280',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: CATEGORY_META[cat]?.color || '#6B7280' }} />
                    {CATEGORY_META[cat]?.label || cat}
                  </div>

                  {catLinks.map((link, idx) => {
                    const Icon   = link.icon;
                    const locked = isLocked(link);
                    const catMeta = CATEGORY_META[link.category] || { color: '#6B7280' };
                    const dispLabel = resolveDisplayLabel(link);
                    return (
                      <div key={link.to} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                        borderBottom: idx < catLinks.length - 1 ? '1px solid #F9FAFB' : 'none',
                        background: locked ? '#FAFAFA' : '#fff', opacity: locked ? 0.65 : 1,
                      }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${catMeta.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={13} color={catMeta.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: locked ? '#9CA3AF' : '#111827' }}>
                            {dispLabel}
                          </div>
                        </div>
                        {locked ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#9CA3AF', fontWeight: 600, background: '#F3F4F6', borderRadius: 6, padding: '4px 8px' }}>
                            <Lock size={10} /> Upgrade
                          </div>
                        ) : (
                          <button onClick={() => toggle(link.to)}
                            style={{ border: 'none', background: 'rgba(23,185,208,0.1)', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}>
                            <Eye size={12} /> Show
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Save bar ────────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 28, padding: '14px 20px',
        background: isDirty ? '#F0FDF4' : '#F9FAFB',
        border: `1px solid ${isDirty ? '#BBF7D0' : '#E5E7EB'}`,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        transition: 'all 0.2s',
      }}>
        <div>
          <div style={{ fontSize: 13, color: isDirty ? '#15803D' : '#9CA3AF', fontWeight: isDirty ? 600 : 400 }}>
            {isDirty ? 'You have unsaved changes' : 'All changes saved'}
          </div>
          {isDirty && (
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
              {sidebarDirty && labelDirty ? 'Sidebar layout + label renames will be saved'
                : sidebarDirty ? 'Sidebar layout changes will be saved'
                : 'Label renames will be saved'}
            </div>
          )}
        </div>
        <button
          onClick={save}
          disabled={saving || !isDirty}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 22px', borderRadius: 10, border: 'none',
            background: isDirty ? 'var(--navy)' : '#E5E7EB',
            color: isDirty ? '#fff' : '#9CA3AF',
            fontSize: 13, fontWeight: 700, cursor: isDirty ? 'pointer' : 'default',
            transition: 'all 0.15s', opacity: saving ? 0.7 : 1,
          }}
        >
          <Save size={14} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
