import { useState, useMemo } from 'react';
import REGISTRY from '../../config/businessTypes/registry';
import { getBusinessTypeConfig } from '../../config/businessTypes/index';
import {
  MODULE_REGISTRY, DEFAULT_ROLES, EXTRA_ROLES as EXTRA_ROLES_FLAT,
  getPerm, getModuleAccess, CRUD_COLORS, P,
} from '../../config/platformCatalog';

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg: '#111C27', panel: '#0F1923', sidebar: '#0B131C',
  card: '#1A2838', border: '#1E2D3D', accent: '#27DCFF', accent2: '#1FB8D6',
  text: '#F1F5F9', muted: '#64748B', green: '#34D399', amber: '#FBBF24',
  red: '#F87171', blue: '#60A5FA', purple: '#A78BFA',
};

// ── Business catalog static data ──────────────────────────────────────────────

const CATEGORIES = [
  { code: 'SYL-BC-GEN', label: 'General / Core',        emoji: '🏪' },
  { code: 'SYL-BC-RET', label: 'Retail & Commerce',      emoji: '🛒' },
  { code: 'SYL-BC-FNB', label: 'Food & Beverage',        emoji: '🍽' },
  { code: 'SYL-BC-FIT', label: 'Fitness & Sports',       emoji: '🏋️' },
  { code: 'SYL-BC-EVT', label: 'Events & Functions',     emoji: '🎉' },
  { code: 'SYL-BC-HLC', label: 'Healthcare',             emoji: '🏥' },
  { code: 'SYL-BC-BPC', label: 'Beauty & Personal Care', emoji: '💆' },
  { code: 'SYL-BC-EDU', label: 'Education',              emoji: '🎓' },
  { code: 'SYL-BC-PRO', label: 'Professional Services',  emoji: '💼' },
  { code: 'SYL-BC-TRN', label: 'Transport & Logistics',  emoji: '🚚' },
  { code: 'SYL-BC-CND', label: 'Construction & Design',  emoji: '🏗' },
  { code: 'SYL-BC-B2B', label: 'Trade & Supply',         emoji: '🤝' },
  { code: 'SYL-BC-SVC', label: 'Other Services',         emoji: '⚙' },
];

const toLabel = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const TYPES_BY_CATEGORY = (() => {
  const map = {};
  for (const [enumKey, { categoryCode, typeCode }] of Object.entries(REGISTRY)) {
    if (!map[categoryCode]) map[categoryCode] = [];
    map[categoryCode].push({ enumKey, typeCode, label: toLabel(enumKey) });
  }
  return map;
})();

// Build a by-type map from the flat EXTRA_ROLES array
const EXTRA_ROLES_BY_TYPE = (() => {
  const map = {};
  for (const role of EXTRA_ROLES_FLAT) {
    const types = Array.isArray(role.appliesTo) ? role.appliesTo : [role.appliesTo];
    for (const t of types) {
      if (!map[t]) map[t] = [];
      map[t].push(role);
    }
  }
  return map;
})();

function getRolesForType(typeEnum) {
  return [...DEFAULT_ROLES, ...(EXTRA_ROLES_BY_TYPE[typeEnum] || [])];
}

function hasAnyAccess(role, modKey) {
  return getModuleAccess(role, modKey);
}

// ── CRUD Cell ─────────────────────────────────────────────────────────────────

function CrudCell({ perm, compact }) {
  const p = perm || P.none;
  return (
    <div style={{ display: 'flex', gap: compact ? 1 : 2, alignItems: 'center' }}>
      {['C', 'R', 'U', 'D'].map((op) => {
        const active = p[op];
        const color = CRUD_COLORS[op];
        return (
          <span key={op} style={{
            width: compact ? 13 : 15, height: compact ? 13 : 15, borderRadius: 3,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 800, lineHeight: 1, userSelect: 'none',
            background: active ? `${color}20` : 'rgba(30,45,61,0.6)',
            color: active ? color : '#1E3A52',
            border: `1px solid ${active ? `${color}40` : '#1A2D3D'}`,
          }}>
            {op}
          </span>
        );
      })}
    </div>
  );
}

function Pill({ label, color }) {
  return (
    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: `${color}18`, color, border: `1px solid ${color}30`, fontWeight: 600 }}>
      {label}
    </span>
  );
}

// ── Module accordion row (Modules tab) ────────────────────────────────────────

function ModuleAccordionRow({ moduleKey, mod, active, roles, expanded, onToggle }) {
  const featureEntries = Object.entries(mod.features);
  const noRoleAccess = active && !roles.some((r) => r.isOwner || featureEntries.some(([fk]) => getPerm(r, moduleKey, fk).R));

  return (
    <div style={{ marginBottom: 6 }}>
      <button onClick={onToggle} style={{
        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
        background: expanded ? (active ? 'rgba(26,40,56,0.9)' : 'rgba(20,32,44,0.6)') : (active ? T.card : 'rgba(26,40,56,0.4)'),
        border: `1px solid ${expanded ? T.accent2 : T.border}`,
        borderRadius: expanded ? '8px 8px 0 0' : 8,
        padding: '10px 14px', cursor: 'pointer', transition: 'all 0.15s', opacity: active ? 1 : 0.55,
      }}>
        <span style={{ fontSize: 11, color: T.muted, display: 'inline-block', transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>▶</span>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: active ? T.text : T.muted }}>{mod.label}</span>
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.accent2 }}>{mod.code}</span>
          <span style={{ fontSize: 10, color: T.muted }}>{featureEntries.length} features</span>
        </div>
        {noRoleAccess && <span style={{ fontSize: 10, fontWeight: 700, color: T.amber, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>⚠ No role access</span>}
        <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '2px 8px', flexShrink: 0, background: active ? 'rgba(52,211,153,0.12)' : 'rgba(100,116,139,0.12)', color: active ? T.green : T.muted, border: `1px solid ${active ? 'rgba(52,211,153,0.3)' : 'rgba(100,116,139,0.3)'}` }}>
          {active ? 'ACTIVE' : 'OFF'}
        </span>
      </button>
      {expanded && (
        <div style={{ background: '#0D1820', border: `1px solid ${T.accent2}`, borderTop: 'none', borderRadius: '0 0 8px 8px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', width: 180 }}>Feature</th>
                {roles.map((role) => (
                  <th key={role.templateKey} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: role.color, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: role.color, marginRight: 4, verticalAlign: 'middle' }} />
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureEntries.map(([featKey, featLabel], i) => {
                const perms = roles.map((role) => getPerm(role, moduleKey, featKey));
                const hasFault = perms.some((p) => !p.R && (p.C || p.U || p.D));
                return (
                  <tr key={featKey} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: T.text, whiteSpace: 'nowrap' }}>
                      {featLabel}
                      {hasFault && <span style={{ marginLeft: 6, fontSize: 10, color: T.red }} title="Write without Read">⚠</span>}
                    </td>
                    {perms.map((perm, ri) => (
                      <td key={ri} style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}><CrudCell perm={perm} compact /></div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Roles tab ─────────────────────────────────────────────────────────────────

function RolesTab({ roles, activeModuleKeys }) {
  const [selectedKey, setSelectedKey] = useState(roles[0]?.templateKey);
  const role = roles.find((r) => r.templateKey === selectedKey) || roles[0];

  const accessible = useMemo(() => {
    if (!role) return { count: 0, total: 0, pct: 0 };
    let acc = 0, tot = 0;
    for (const mk of activeModuleKeys) {
      for (const fk of Object.keys(MODULE_REGISTRY[mk]?.features || {})) {
        tot++;
        if (getPerm(role, mk, fk).R) acc++;
      }
    }
    return { count: acc, total: tot, pct: tot > 0 ? Math.round((acc / tot) * 100) : 0 };
  }, [role, activeModuleKeys]);

  const accessibleMods = activeModuleKeys.filter((mk) => hasAnyAccess(role, mk));

  return (
    <div>
      {/* Role pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {roles.map((r) => (
          <button key={r.templateKey} onClick={() => setSelectedKey(r.templateKey)} style={{
            padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
            border: `1.5px solid ${r.templateKey === selectedKey ? r.color : T.border}`,
            background: r.templateKey === selectedKey ? `${r.color}18` : 'transparent',
            color: r.templateKey === selectedKey ? r.color : T.muted,
            fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
            {r.name}
            {!r.isSystem && <span style={{ fontSize: 9, opacity: 0.7 }}>custom</span>}
          </button>
        ))}
      </div>

      {role && (
        <>
          {/* Role card */}
          <div style={{ background: T.card, border: `1px solid ${role.color}40`, borderLeft: `3px solid ${role.color}`, borderRadius: 10, padding: '14px 18px', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${role.color}25`, border: `2px solid ${role.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: role.color }}>{role.name[0]}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{role.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  {role.isOwner && <span style={{ fontSize: 10, fontWeight: 700, color: T.purple, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 4, padding: '1px 6px' }}>OWNER — Unrestricted</span>}
                  {role.isSystem && !role.isOwner && <span style={{ fontSize: 10, fontWeight: 700, color: T.blue, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 4, padding: '1px 6px' }}>System Role</span>}
                  {!role.isSystem && <span style={{ fontSize: 10, fontWeight: 700, color: T.green, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 4, padding: '1px 6px' }}>Custom Role</span>}
                </div>
              </div>
              {!role.isOwner && (
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Read coverage</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 120, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${accessible.pct}%`, height: '100%', background: accessible.pct > 70 ? T.green : accessible.pct > 40 ? T.amber : T.red, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{accessible.pct}%</span>
                    <span style={{ fontSize: 11, color: T.muted }}>{accessible.count}/{accessible.total}</span>
                  </div>
                </div>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{role.description}</p>
          </div>

          {/* Permission tree */}
          {role.isOwner ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: T.purple }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>∞</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Full access to all {activeModuleKeys.length} active modules and every feature</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>The Owner role bypasses all permission checks at the API layer</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                Module access ({accessibleMods.length} of {activeModuleKeys.length} active)
              </div>
              {accessibleMods.length === 0 ? (
                <div style={{ color: T.red, fontSize: 13, padding: '16px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8 }}>
                  This role has no access to any active module for this business type.
                </div>
              ) : (
                accessibleMods.map((mk) => {
                  const mod = MODULE_REGISTRY[mk];
                  if (!mod) return null;
                  const featEntries = Object.entries(mod.features);
                  return (
                    <div key={mk} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{mod.label}</span>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.accent2 }}>{mod.code}</span>
                      </div>
                      <div style={{ padding: '4px 0' }}>
                        {featEntries.map(([fk, fl], i) => {
                          const perm = getPerm(role, mk, fk);
                          const anyPerm = perm.C || perm.R || perm.U || perm.D;
                          if (!anyPerm) return null;
                          return (
                            <div key={fk} style={{ display: 'flex', alignItems: 'center', padding: '7px 14px', borderBottom: i < featEntries.length - 1 ? `1px solid ${T.border}` : 'none', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                              <span style={{ flex: 1, fontSize: 12, color: T.text }}>{fl}</span>
                              <CrudCell perm={perm} />
                              <span style={{ marginLeft: 10, fontSize: 10, color: T.muted, minWidth: 60 }}>
                                {[perm.C && 'Create', perm.R && 'Read', perm.U && 'Update', perm.D && 'Delete'].filter(Boolean).join(' · ')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
              {(() => {
                const noAccess = activeModuleKeys.filter((mk) => !hasAnyAccess(role, mk));
                return noAccess.length > 0 ? (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                      No access ({noAccess.length} modules)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {noAccess.map((mk) => (
                        <span key={mk} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(100,116,139,0.08)', color: T.muted, border: `1px solid ${T.border}` }}>
                          {MODULE_REGISTRY[mk]?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BusinessCatalog() {
  const [selectedCat, setSelectedCat]   = useState('SYL-BC-RET');
  const [selectedType, setSelectedType] = useState('RETAIL');
  const [tab, setTab]                   = useState('modules');
  const [expandedMods, setExpandedMods] = useState(new Set());
  const [showInactive, setShowInactive] = useState(false);

  const typesInCat     = TYPES_BY_CATEGORY[selectedCat] || [];
  const selectedCatMeta     = CATEGORIES.find((c) => c.code === selectedCat);
  const selectedTypeCode    = selectedType ? REGISTRY[selectedType]?.typeCode    : null;
  const selectedTypeCatCode = selectedType ? REGISTRY[selectedType]?.categoryCode : null;
  const selectedTypeCatMeta = selectedTypeCatCode ? CATEGORIES.find((c) => c.code === selectedTypeCatCode) : null;

  const moduleConfig = useMemo(() => {
    if (!selectedType) return null;
    try { return getBusinessTypeConfig(selectedType); } catch { return null; }
  }, [selectedType]);

  const activeModuleKeys   = useMemo(() => moduleConfig ? Object.keys(MODULE_REGISTRY).filter((k) => moduleConfig.modules[k] === true) : [], [moduleConfig]);
  const inactiveModuleKeys = useMemo(() => moduleConfig ? Object.keys(MODULE_REGISTRY).filter((k) => moduleConfig.modules[k] !== true) : [], [moduleConfig]);

  const roles = useMemo(() => selectedType ? getRolesForType(selectedType) : DEFAULT_ROLES, [selectedType]);

  const toggleMod   = (key) => setExpandedMods((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const expandAll   = () => setExpandedMods(new Set(activeModuleKeys));
  const collapseAll = () => setExpandedMods(new Set());

  const handleCatSelect  = (code) => {
    setSelectedCat(code);
    const first = (TYPES_BY_CATEGORY[code] || [])[0];
    setSelectedType(first?.enumKey || null);
    setExpandedMods(new Set());
  };
  const handleTypeSelect = (enumKey) => { setSelectedType(enumKey); setExpandedMods(new Set()); };

  // Fault detection
  const faults = useMemo(() => {
    if (!moduleConfig || !selectedType) return [];
    const issues = [];
    for (const mk of activeModuleKeys) {
      const mod = MODULE_REGISTRY[mk];
      if (!mod) continue;
      const featKeys = Object.keys(mod.features);
      const noAccess = !roles.some((r) => r.isOwner || featKeys.some((fk) => getPerm(r, mk, fk).R));
      if (noAccess) issues.push({ type: 'no_role_access', label: mod.label });
      for (const [fk, fl] of Object.entries(mod.features)) {
        for (const role of roles) {
          const p = getPerm(role, mk, fk);
          if (!p.R && (p.C || p.U || p.D)) issues.push({ type: 'write_without_read', roleName: role.name, featureLabel: fl });
        }
      }
    }
    return issues;
  }, [moduleConfig, selectedType, activeModuleKeys, roles]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.bg, color: T.text, fontFamily: 'var(--font-body, system-ui)' }}>

      {/* Header */}
      <div style={{ padding: '18px 28px 14px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>Business Catalog</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: T.muted }}>Drill down into every business type — modules, features, roles, and CRUD permissions</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Pill label={`${CATEGORIES.length} Categories`}                color={T.accent} />
            <Pill label={`${Object.keys(REGISTRY).length} Business Types`} color={T.purple} />
            <Pill label={`${Object.keys(MODULE_REGISTRY).length} Modules`} color={T.green} />
          </div>
        </div>
      </div>

      {/* 3-panel body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Panel 1 — Categories */}
        <div style={{ width: 220, flexShrink: 0, background: T.sidebar, borderRight: `1px solid ${T.border}`, overflowY: 'auto', padding: '12px 8px' }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 8px 8px' }}>Categories</div>
          {CATEGORIES.map((cat) => {
            const count = (TYPES_BY_CATEGORY[cat.code] || []).length;
            const active = cat.code === selectedCat;
            return (
              <button key={cat.code} onClick={() => handleCatSelect(cat.code)} style={{ width: '100%', textAlign: 'left', background: active ? 'rgba(31,184,214,0.1)' : 'transparent', border: `1px solid ${active ? 'rgba(31,184,214,0.25)' : 'transparent'}`, borderRadius: 8, padding: '8px 10px', marginBottom: 2, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{cat.emoji}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: active ? T.accent : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.label}</div>
                  <div style={{ fontSize: 9, color: T.muted, marginTop: 1, fontFamily: 'monospace' }}>{cat.code}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px', flexShrink: 0, background: active ? 'rgba(39,220,255,0.15)' : 'rgba(100,116,139,0.15)', color: active ? T.accent : T.muted }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Panel 2 — Business Types */}
        <div style={{ width: 220, flexShrink: 0, background: T.panel, borderRight: `1px solid ${T.border}`, overflowY: 'auto', padding: '12px 8px' }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 8px 8px' }}>
            {selectedCatMeta?.label} · {typesInCat.length}
          </div>
          {typesInCat.map(({ enumKey, typeCode, label }) => {
            const active = enumKey === selectedType;
            return (
              <button key={enumKey} onClick={() => handleTypeSelect(enumKey)} style={{ width: '100%', textAlign: 'left', background: active ? 'rgba(39,220,255,0.08)' : 'transparent', border: `1px solid ${active ? 'rgba(39,220,255,0.2)' : 'transparent'}`, borderRadius: 8, padding: '9px 10px', marginBottom: 2, cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? T.accent : T.text }}>{label}</div>
                <div style={{ fontSize: 9, color: T.muted, marginTop: 2, fontFamily: 'monospace' }}>{typeCode}</div>
              </button>
            );
          })}
        </div>

        {/* Panel 3 — Detail */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {selectedType && moduleConfig ? (
            <>
              {/* Type banner */}
              <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text }}>{toLabel(selectedType)}</h2>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', background: 'rgba(39,220,255,0.1)', color: T.accent, border: `1px solid rgba(39,220,255,0.2)`, borderRadius: 6, padding: '2px 7px' }}>{selectedTypeCode}</span>
                  {selectedTypeCatMeta && (
                    <span style={{ fontSize: 10, fontFamily: 'monospace', background: 'rgba(167,139,250,0.1)', color: T.purple, border: `1px solid rgba(167,139,250,0.2)`, borderRadius: 6, padding: '2px 7px' }}>
                      {selectedTypeCatMeta.emoji} {selectedTypeCatMeta.code}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <Pill label={`${activeModuleKeys.length} Active Modules`} color={T.green} />
                  <Pill label={`${inactiveModuleKeys.length} Inactive`}     color={T.muted} />
                  <Pill label={`${roles.length} Roles`}                     color={T.blue} />
                  <Pill label={`${activeModuleKeys.reduce((s, k) => s + Object.keys(MODULE_REGISTRY[k]?.features || {}).length, 0)} Features`} color={T.accent2} />
                  {faults.length > 0 && <Pill label={`${faults.length} Issue${faults.length > 1 ? 's' : ''}`} color={T.amber} />}
                </div>

                {faults.length > 0 && (
                  <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 6 }}>⚠ Permission Issues Detected</div>
                    {faults.map((f, i) => (
                      <div key={i} style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>
                        {f.type === 'no_role_access' && `Module "${f.label}" is active but no role has read access`}
                        {f.type === 'write_without_read' && `Role "${f.roleName}" has write on "${f.featureLabel}" without Read`}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${T.border}` }}>
                  {[['modules', 'Modules & Features'], ['roles', 'Default Roles']].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)} style={{ padding: '8px 18px', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === key ? T.accent : 'transparent'}`, color: tab === key ? T.accent : T.muted, fontSize: 13, fontWeight: tab === key ? 600 : 500, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {label}
                      {key === 'roles' && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(96,165,250,0.15)', color: T.blue, borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>{roles.length}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
                {tab === 'modules' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1 }}>Active Modules ({activeModuleKeys.length}) · click to drill down</div>
                      <button onClick={expandAll}   style={{ fontSize: 11, color: T.accent2, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Expand all</button>
                      <button onClick={collapseAll} style={{ fontSize: 11, color: T.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>Collapse all</button>
                    </div>
                    {activeModuleKeys.map((mk) => (
                      <ModuleAccordionRow key={mk} moduleKey={mk} mod={MODULE_REGISTRY[mk]} active roles={roles} expanded={expandedMods.has(mk)} onToggle={() => toggleMod(mk)} />
                    ))}
                    {inactiveModuleKeys.length > 0 && (
                      <div style={{ marginTop: 24 }}>
                        <button onClick={() => setShowInactive((v) => !v)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: 0, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                          <span style={{ display: 'inline-block', transition: 'transform 0.15s', transform: showInactive ? 'rotate(90deg)' : 'none' }}>▶</span>
                          Inactive / Disabled ({inactiveModuleKeys.length})
                        </button>
                        {showInactive && inactiveModuleKeys.map((mk) => (
                          <ModuleAccordionRow key={mk} moduleKey={mk} mod={MODULE_REGISTRY[mk]} active={false} roles={roles} expanded={expandedMods.has(mk)} onToggle={() => toggleMod(mk)} />
                        ))}
                      </div>
                    )}
                  </>
                )}
                {tab === 'roles' && <RolesTab roles={roles} activeModuleKeys={activeModuleKeys} />}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.muted, fontSize: 14 }}>
              Select a business type to explore its configuration
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
