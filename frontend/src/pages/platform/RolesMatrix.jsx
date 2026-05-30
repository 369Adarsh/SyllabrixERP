import { useState, useMemo, useEffect } from 'react';
import {
  MODULE_REGISTRY, MODULE_CATEGORY_COLORS,
  ALL_ROLES, DEFAULT_ROLES, EXTRA_ROLES,
  getPerm, getModuleAccess, getCoverage,
  CRUD_COLORS, P,
} from '../../config/platformCatalog';
import { getSARoleRequests, updateSARoleRequest, getModuleHelp, upsertModuleHelp, deleteModuleHelp } from '../../api/platform';
import toast from 'react-hot-toast';

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg: '#111C27', panel: '#0F1923', sidebar: '#0B131C',
  card: '#1A2838', border: '#1E2D3D', accent: '#27DCFF', accent2: '#1FB8D6',
  text: '#F1F5F9', muted: '#64748B', green: '#34D399', amber: '#FBBF24',
  red: '#F87171', blue: '#60A5FA', purple: '#A78BFA',
};

const ALL_MODULE_KEYS = Object.keys(MODULE_REGISTRY);

const MODULE_CATEGORIES = [...new Set(Object.values(MODULE_REGISTRY).map((m) => m.category))];

// ── Helpers ───────────────────────────────────────────────────────────────────

function permLabel(perm) {
  if (!perm) return '—';
  const ops = ['C', 'R', 'U', 'D'].filter((op) => perm[op]);
  if (ops.length === 4) return 'Full';
  if (ops.length === 0) return '—';
  return ops.join('');
}

function permScore(perm) {
  if (!perm) return 0;
  return (perm.C ? 1 : 0) + (perm.R ? 2 : 0) + (perm.U ? 1 : 0) + (perm.D ? 1 : 0);
}

// ── CRUD Badge ────────────────────────────────────────────────────────────────

function CrudBadge({ perm, size = 14 }) {
  const p = perm || P.none;
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {['C', 'R', 'U', 'D'].map((op) => {
        const active = p[op];
        const color = CRUD_COLORS[op];
        return (
          <span key={op} style={{
            width: size, height: size, borderRadius: 3,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size - 5, fontWeight: 800, lineHeight: 1, userSelect: 'none',
            background: active ? `${color}22` : 'rgba(30,45,61,0.5)',
            color: active ? color : '#1E3A52',
            border: `1px solid ${active ? `${color}44` : '#1A2D3D'}`,
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
    <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: `${color}18`, color, border: `1px solid ${color}30`, fontWeight: 600 }}>
      {label}
    </span>
  );
}

// ── Role Card (list item) ─────────────────────────────────────────────────────

function RoleListItem({ role, selected, onClick, allModuleAccess }) {
  const active = selected;
  const modCount = role.isOwner ? ALL_MODULE_KEYS.length : Object.keys(role.permissions || {}).length;
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left',
      background: active ? `${role.color}12` : 'transparent',
      border: `1px solid ${active ? role.color + '40' : 'transparent'}`,
      borderLeft: `3px solid ${active ? role.color : 'transparent'}`,
      borderRadius: '0 8px 8px 0', padding: '10px 12px', marginBottom: 2,
      cursor: 'pointer', transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${role.color}20`, border: `2px solid ${role.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: role.color, flexShrink: 0 }}>
        {role.name[0]}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? T.text : '#B0BEC5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {role.name}
        </div>
        <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>
          {role.isOwner ? 'All modules' : `${modCount} module${modCount !== 1 ? 's' : ''}`}
          {!role.isSystem && <span style={{ marginLeft: 6, color: T.amber }}>custom</span>}
        </div>
      </div>
      {role.isOwner && (
        <span style={{ fontSize: 9, fontWeight: 700, color: T.purple, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>∞</span>
      )}
    </button>
  );
}

// ── Role Detail Panel ─────────────────────────────────────────────────────────

function RoleDetail({ role }) {
  const [expandedMods, setExpandedMods] = useState(new Set());
  const toggleMod = (k) => setExpandedMods((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const expandAll  = () => setExpandedMods(new Set(ALL_MODULE_KEYS));
  const collapseAll = () => setExpandedMods(new Set());

  const { accessible, total, pct } = useMemo(() => getCoverage(role, ALL_MODULE_KEYS), [role]);

  const accessible_mods = ALL_MODULE_KEYS.filter((mk) => getModuleAccess(role, mk));
  const locked_mods     = ALL_MODULE_KEYS.filter((mk) => !getModuleAccess(role, mk));

  const appliesLabel = role.appliesTo === 'all'
    ? 'All Business Types'
    : Array.isArray(role.appliesTo) ? role.appliesTo.join(', ') : role.appliesTo;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Role header card */}
      <div style={{ background: T.card, border: `1px solid ${role.color}35`, borderLeft: `4px solid ${role.color}`, borderRadius: 10, padding: '16px 20px', marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${role.color}20`, border: `2px solid ${role.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: role.color, flexShrink: 0 }}>
            {role.name[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{role.name}</span>
              {role.isOwner && <span style={{ fontSize: 10, fontWeight: 700, color: T.purple, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 4, padding: '2px 7px' }}>OWNER · Unrestricted</span>}
              {role.isSystem && !role.isOwner && <span style={{ fontSize: 10, fontWeight: 700, color: T.blue, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 4, padding: '2px 7px' }}>System Role</span>}
              {!role.isSystem && <span style={{ fontSize: 10, fontWeight: 700, color: T.green, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 4, padding: '2px 7px' }}>Custom Role</span>}
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{role.description}</p>
            <div style={{ fontSize: 11, color: T.muted }}>
              <span style={{ color: '#64748B' }}>Applies to: </span>
              <span style={{ color: '#94A3B8', fontWeight: 500 }}>{appliesLabel}</span>
            </div>
          </div>
          {/* Coverage */}
          {!role.isOwner && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: T.muted, marginBottom: 5 }}>Read coverage (all modules)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                <div style={{ width: 100, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct > 60 ? T.green : pct > 30 ? T.amber : T.red, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{pct}%</span>
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>{accessible} / {total} features</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Pill label={`${accessible_mods.length} modules accessible`} color={T.green} />
                <Pill label={`${locked_mods.length} locked`} color={T.muted} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Owner special view */}
      {role.isOwner ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ textAlign: 'center', padding: '24px', background: `${T.purple}08`, border: `1px solid ${T.purple}20`, borderRadius: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 40, marginBottom: 8, color: T.purple }}>∞</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Unrestricted access to all {ALL_MODULE_KEYS.length} modules</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>The Owner flag bypasses all permission checks at the API layer</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {ALL_MODULE_KEYS.map((mk) => {
              const mod = MODULE_REGISTRY[mk];
              const catColor = MODULE_CATEGORY_COLORS[mod.category] || T.accent;
              return (
                <div key={mk} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.label}</div>
                    <div style={{ fontSize: 9, color: T.muted, fontFamily: 'monospace' }}>{mod.code}</div>
                  </div>
                  <CrudBadge perm={P.full} size={12} />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Permission tree */
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1 }}>
              Permission Tree — {accessible_mods.length} of {ALL_MODULE_KEYS.length} modules
            </span>
            <button onClick={expandAll}   style={{ fontSize: 11, color: T.accent2, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Expand all</button>
            <button onClick={collapseAll} style={{ fontSize: 11, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Collapse</button>
          </div>

          {/* Accessible modules */}
          {accessible_mods.map((mk) => {
            const mod = MODULE_REGISTRY[mk];
            const catColor = MODULE_CATEGORY_COLORS[mod.category] || T.accent;
            const expanded = expandedMods.has(mk);
            const featEntries = Object.entries(mod.features);
            return (
              <div key={mk} style={{ marginBottom: 6 }}>
                <button onClick={() => toggleMod(mk)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, background: expanded ? '#0D1820' : T.card, border: `1px solid ${expanded ? T.accent2 : T.border}`, borderRadius: expanded ? '8px 8px 0 0' : 8, padding: '9px 14px', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: 10, color: T.muted, transform: expanded ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s', flexShrink: 0 }}>▶</span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text, flex: 1 }}>{mod.label}</span>
                  <span style={{ fontSize: 9, color: T.muted, fontFamily: 'monospace' }}>{mod.code}</span>
                  <span style={{ fontSize: 10, color: catColor, background: `${catColor}12`, border: `1px solid ${catColor}25`, borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>{mod.category}</span>
                </button>
                {expanded && (
                  <div style={{ background: '#0D1820', border: `1px solid ${T.accent2}`, borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                    {featEntries.map(([fk, fl], i) => {
                      const perm = getPerm(role, mk, fk);
                      const anyPerm = perm.C || perm.R || perm.U || perm.D;
                      return (
                        <div key={fk} style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderBottom: i < featEntries.length - 1 ? `1px solid ${T.border}` : 'none', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent', opacity: anyPerm ? 1 : 0.35 }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: anyPerm ? catColor : T.muted, flexShrink: 0, marginRight: 10 }} />
                          <span style={{ flex: 1, fontSize: 12, color: anyPerm ? T.text : T.muted }}>{fl}</span>
                          <CrudBadge perm={perm} />
                          <span style={{ marginLeft: 10, fontSize: 10, color: T.muted, minWidth: 80, textAlign: 'right' }}>
                            {anyPerm ? [perm.C && 'Create', perm.R && 'Read', perm.U && 'Update', perm.D && 'Delete'].filter(Boolean).join(' · ') : 'No access'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Locked modules */}
          {locked_mods.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Locked / No Access ({locked_mods.length} modules)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {locked_mods.map((mk) => (
                  <span key={mk} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(26,40,56,0.6)', color: T.muted, border: `1px solid ${T.border}` }}>
                    {MODULE_REGISTRY[mk]?.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Help Guide constants ──────────────────────────────────────────────────────
const HELP_LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'HI' },
  { code: 'gu', label: 'ગુજરાતી', short: 'GU' },
  { code: 'mr', label: 'मराठी', short: 'MR' },
];

const emptyArticle = () => ({ title: '', overview: '', sections: [], isPublished: false });

function HelpGuideEditor({ moduleKey }) {
  const [activeLang, setActiveLang] = useState('en');
  const [articles, setArticles]     = useState({});  // { en: {...}, hi: {...} }
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    setLoading(true);
    getModuleHelp(moduleKey)
      .then((r) => {
        const map = {};
        (r.data?.data || []).forEach((a) => { map[a.lang] = a; });
        setArticles(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [moduleKey]);

  const article = articles[activeLang] || emptyArticle();

  const update = (patch) => setArticles((prev) => ({
    ...prev,
    [activeLang]: { ...(prev[activeLang] || emptyArticle()), ...patch },
  }));

  const updateSection = (si, patch) => {
    const sections = [...(article.sections || [])];
    sections[si] = { ...sections[si], ...patch };
    update({ sections });
  };

  const addSection = () => {
    const sections = [...(article.sections || []), { heading: '', steps: [{ instruction: '', tip: '' }] }];
    update({ sections });
  };

  const removeSection = (si) => {
    const sections = (article.sections || []).filter((_, i) => i !== si);
    update({ sections });
  };

  const addStep = (si) => {
    const sections = [...(article.sections || [])];
    sections[si] = { ...sections[si], steps: [...(sections[si].steps || []), { instruction: '', tip: '' }] };
    update({ sections });
  };

  const updateStep = (si, stIdx, patch) => {
    const sections = [...(article.sections || [])];
    const steps = [...(sections[si].steps || [])];
    steps[stIdx] = { ...steps[stIdx], ...patch };
    sections[si] = { ...sections[si], steps };
    update({ sections });
  };

  const removeStep = (si, stIdx) => {
    const sections = [...(article.sections || [])];
    sections[si] = { ...sections[si], steps: sections[si].steps.filter((_, i) => i !== stIdx) };
    update({ sections });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await upsertModuleHelp(moduleKey, activeLang, {
        title: article.title,
        overview: article.overview,
        sections: article.sections,
        isPublished: article.isPublished,
      });
      setArticles((prev) => ({ ...prev, [activeLang]: r.data?.data || r.data }));
      toast.success('Guide saved');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!articles[activeLang]?.id) return;
    if (!confirm(`Delete ${HELP_LANGS.find(l => l.code === activeLang)?.label} guide for this module?`)) return;
    try {
      await deleteModuleHelp(moduleKey, activeLang);
      setArticles((prev) => { const n = { ...prev }; delete n[activeLang]; return n; });
      toast.success('Guide deleted');
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 13 }}>Loading guides…</div>
  );

  const isSaved = !!articles[activeLang]?.id;

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingBottom: 40 }}>
      {/* Lang tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {HELP_LANGS.map((l) => {
          const exists = !!articles[l.code]?.id;
          const active = activeLang === l.code;
          return (
            <button key={l.code} onClick={() => setActiveLang(l.code)} style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: active ? T.accent : T.card,
              color: active ? T.bg : exists ? T.text : T.muted,
              border: `1px solid ${active ? T.accent : exists ? T.border : 'transparent'}`,
            }}>
              {l.short} <span style={{ fontWeight: 400, opacity: 0.7 }}>{l.label}</span>
              {exists && !active && <span style={{ marginLeft: 5, fontSize: 9, color: T.green }}>●</span>}
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: T.muted }}>
            <input
              type="checkbox"
              checked={!!article.isPublished}
              onChange={(e) => update({ isPublished: e.target.checked })}
            />
            Published (visible to tenants)
          </label>
          {isSaved && (
            <button onClick={handleDelete} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, border: `1px solid ${T.red}40`, background: `${T.red}12`, color: T.red, cursor: 'pointer' }}>
              Delete
            </button>
          )}
          <button onClick={handleSave} disabled={saving} style={{ padding: '7px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: T.accent, color: T.bg, border: 'none', cursor: 'pointer' }}>
            {saving ? 'Saving…' : isSaved ? 'Update' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Guide Title</label>
        <input
          value={article.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="e.g. How to create and manage invoices"
          style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 13px', color: T.text, fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Overview */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Overview / Intro</label>
        <textarea
          value={article.overview}
          onChange={(e) => update({ overview: e.target.value })}
          placeholder="Brief description of what this module does and when to use it…"
          rows={3}
          style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 13px', color: T.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
        />
      </div>

      {/* Sections */}
      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Step-by-Step Sections</div>

      {(article.sections || []).map((sec, si) => (
        <div key={si} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, minWidth: 60 }}>SECTION {si + 1}</div>
            <input
              value={sec.heading}
              onChange={(e) => updateSection(si, { heading: e.target.value })}
              placeholder="Section heading e.g. Creating an Invoice"
              style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, padding: '7px 11px', color: T.text, fontSize: 12, fontWeight: 600, outline: 'none' }}
            />
            <button onClick={() => removeSection(si)} style={{ background: `${T.red}18`, border: 'none', borderRadius: 6, color: T.red, fontSize: 11, padding: '5px 10px', cursor: 'pointer', fontWeight: 700 }}>✕ Remove</button>
          </div>

          {(sec.steps || []).map((step, stIdx) => (
            <div key={stIdx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: T.accent, color: T.bg, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 7 }}>{stIdx + 1}</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <input
                  value={step.instruction}
                  onChange={(e) => updateStep(si, stIdx, { instruction: e.target.value })}
                  placeholder="Instruction e.g. Click 'New Invoice' button in top-right corner"
                  style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, padding: '7px 11px', color: T.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                />
                <input
                  value={step.tip || ''}
                  onChange={(e) => updateStep(si, stIdx, { tip: e.target.value })}
                  placeholder="💡 Optional tip or shortcut (leave blank if none)"
                  style={{ width: '100%', background: T.bg, border: `1px dashed ${T.border}`, borderRadius: 7, padding: '6px 11px', color: T.muted, fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button onClick={() => removeStep(si, stIdx)} style={{ background: 'transparent', border: 'none', color: T.muted, fontSize: 14, cursor: 'pointer', marginTop: 5, padding: '2px 6px' }}>✕</button>
            </div>
          ))}

          <button onClick={() => addStep(si)} style={{ fontSize: 11, fontWeight: 700, color: T.accent, background: `${T.accent}10`, border: `1px dashed ${T.accent}40`, borderRadius: 6, padding: '5px 14px', cursor: 'pointer', marginTop: 4 }}>
            + Add Step
          </button>
        </div>
      ))}

      <button onClick={addSection} style={{ width: '100%', padding: '12px', borderRadius: 10, border: `2px dashed ${T.border}`, background: 'transparent', color: T.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
        + Add Section
      </button>
    </div>
  );
}

// ── Module Detail Panel ───────────────────────────────────────────────────────

function ModuleDetail({ moduleKey }) {
  const [activeTab, setActiveTab] = useState('permissions');
  const mod = MODULE_REGISTRY[moduleKey];
  if (!mod) return null;
  const catColor = MODULE_CATEGORY_COLORS[mod.category] || T.accent;
  const featEntries = Object.entries(mod.features);

  // For each feature, compute which roles have what access
  const roleRows = ALL_ROLES.map((role) => ({
    role,
    featurePerms: Object.fromEntries(featEntries.map(([fk]) => [fk, getPerm(role, moduleKey, fk)])),
    hasAny: role.isOwner || featEntries.some(([fk]) => { const p = getPerm(role, moduleKey, fk); return p.R || p.C || p.U || p.D; }),
  }));

  const accessibleRoles = roleRows.filter((r) => r.hasAny);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Module header */}
      <div style={{ background: T.card, border: `1px solid ${catColor}30`, borderLeft: `4px solid ${catColor}`, borderRadius: 10, padding: '16px 20px', marginBottom: 14, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{mod.label}</span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: catColor, background: `${catColor}12`, border: `1px solid ${catColor}25`, borderRadius: 6, padding: '2px 8px' }}>{mod.code}</span>
              <span style={{ fontSize: 11, color: catColor, fontWeight: 600 }}>{mod.category}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Pill label={`${featEntries.length} Features`}      color={T.accent} />
              <Pill label={`${accessibleRoles.length} roles have access`} color={T.green} />
              <Pill label={`${ALL_ROLES.length - accessibleRoles.length} locked out`} color={T.muted} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, flexShrink: 0, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
        {[
          { key: 'permissions', label: '🔐 Permissions Matrix' },
          { key: 'guide',       label: '📖 Help Guide' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
            background: 'transparent', borderBottom: `2px solid ${activeTab === tab.key ? T.accent : 'transparent'}`,
            color: activeTab === tab.key ? T.accent : T.muted, marginBottom: -1,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'guide' ? (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <HelpGuideEditor moduleKey={moduleKey} />
        </div>
      ) : (
      /* Role × Feature matrix */
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', minHeight: 0 }}>
        <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Role × Feature Permission Matrix
        </div>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 160, position: 'sticky', left: 0, background: T.bg, zIndex: 1 }}>
                Role
              </th>
              {featEntries.map(([fk, fl]) => (
                <th key={fk} style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', minWidth: 130 }}>
                  {fl}
                </th>
              ))}
              <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 80 }}>
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Standard roles header */}
            <tr>
              <td colSpan={featEntries.length + 2} style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: T.blue, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(96,165,250,0.04)' }}>
                ── Standard Roles (seeded for every tenant)
              </td>
            </tr>
            {DEFAULT_ROLES.map((role, i) => {
              const row = roleRows.find((r) => r.role.templateKey === role.templateKey);
              const totalScore = featEntries.reduce((s, [fk]) => s + permScore(getPerm(role, moduleKey, fk)), 0);
              return (
                <tr key={role.templateKey} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '10px 14px', position: 'sticky', left: 0, background: i % 2 === 0 ? T.bg : '#0E1924', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${role.color}20`, border: `1.5px solid ${role.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: role.color, flexShrink: 0 }}>{role.name[0]}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{role.name}</div>
                        {role.isOwner && <div style={{ fontSize: 9, color: T.purple }}>Unrestricted</div>}
                      </div>
                    </div>
                  </td>
                  {featEntries.map(([fk]) => {
                    const perm = getPerm(role, moduleKey, fk);
                    return (
                      <td key={fk} style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <CrudBadge perm={perm} size={13} />
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: totalScore > 0 ? T.green : T.muted }}>
                      {role.isOwner ? '∞' : totalScore > 0 ? totalScore : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* Business-specific roles header */}
            <tr>
              <td colSpan={featEntries.length + 2} style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: T.amber, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(251,191,36,0.04)' }}>
                ── Business-Specific Roles
              </td>
            </tr>
            {EXTRA_ROLES.map((role, i) => {
              const totalScore = featEntries.reduce((s, [fk]) => s + permScore(getPerm(role, moduleKey, fk)), 0);
              return (
                <tr key={role.templateKey} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '10px 14px', position: 'sticky', left: 0, background: i % 2 === 0 ? T.bg : '#0E1924', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${role.color}20`, border: `1.5px solid ${role.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: role.color, flexShrink: 0 }}>{role.name[0]}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{role.name}</div>
                        <div style={{ fontSize: 9, color: T.muted }}>
                          {Array.isArray(role.appliesTo) ? role.appliesTo.slice(0, 2).join(', ') + (role.appliesTo.length > 2 ? ` +${role.appliesTo.length - 2}` : '') : role.appliesTo}
                        </div>
                      </div>
                    </div>
                  </td>
                  {featEntries.map(([fk]) => {
                    const perm = getPerm(role, moduleKey, fk);
                    return (
                      <td key={fk} style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <CrudBadge perm={perm} size={13} />
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: totalScore > 0 ? T.green : T.muted }}>
                      {totalScore > 0 ? totalScore : '—'}
                    </span>
                  </td>
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

// ── Role Requests View ────────────────────────────────────────────────────────

const STATUS_META = {
  PENDING:     { color: '#FBBF24', label: 'Pending' },
  APPROVED:    { color: '#34D399', label: 'Approved' },
  REJECTED:    { color: '#F87171', label: 'Rejected' },
  IMPLEMENTED: { color: '#60A5FA', label: 'Implemented' },
};

function RoleRequestsView() {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('PENDING');
  const [selected, setSelected]   = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getSARoleRequests();
      setRequests(data.data || []);
    } catch { toast.error('Failed to load role requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const counts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = filter ? requests.filter(r => r.status === filter) : requests;

  const openRequest = (r) => {
    setSelected(r);
    setAdminNote(r.adminNote || '');
  };

  const handleAction = async (status) => {
    setSaving(true);
    try {
      await updateSARoleRequest(selected.id, { status, adminNote: adminNote.trim() || undefined });
      toast.success(`Request ${status.toLowerCase()}`);
      await load();
      setSelected(null);
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const pending = counts.PENDING || 0;

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

      {/* ── Left: request list ── */}
      <div style={{ width: 300, flexShrink: 0, background: T.sidebar, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <div key={key} style={{ flex: 1, padding: '10px 4px', textAlign: 'center', borderRight: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: meta.color, fontFamily: 'var(--font-display)' }}>
                {counts[key] || 0}
              </div>
              <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {meta.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {[['', 'All'], ['PENDING', 'Pending'], ['APPROVED', 'Done']].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              flex: 1, padding: '8px 4px', border: 'none', borderBottom: `2px solid ${filter === key ? T.accent : 'transparent'}`,
              background: 'transparent', color: filter === key ? T.accent : T.muted,
              fontSize: 12, fontWeight: filter === key ? 700 : 500, cursor: 'pointer',
            }}>
              {label}{key === '' ? ` (${requests.length})` : key === 'APPROVED' ? ` (${(counts.APPROVED || 0) + (counts.REJECTED || 0) + (counts.IMPLEMENTED || 0)})` : ` (${counts[key] || 0})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ padding: 24, color: T.muted, fontSize: 13, textAlign: 'center' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, color: T.muted, fontSize: 13, textAlign: 'center' }}>No requests</div>
          ) : filtered.map((r) => {
            const meta = STATUS_META[r.status];
            const active = selected?.id === r.id;
            return (
              <button key={r.id} onClick={() => openRequest(r)} style={{
                width: '100%', textAlign: 'left', display: 'block',
                background: active ? `rgba(39,220,255,0.06)` : 'transparent',
                border: 'none', borderLeft: `3px solid ${active ? T.accent : 'transparent'}`,
                padding: '12px 14px', cursor: 'pointer', borderBottom: `1px solid ${T.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${meta.color}20`, border: `1.5px solid ${meta.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: meta.color, flexShrink: 0 }}>
                    {r.roleName?.[0] || '?'}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.roleName}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.tenant?.businessName || r.tenant?.name}
                    </div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: meta.color, background: `${meta.color}15`, border: `1px solid ${meta.color}30`, borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                    {r.status}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: T.muted, paddingLeft: 36 }}>
                  {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  {r.permissions?.length > 0 && <span style={{ marginLeft: 8, color: T.blue }}>· {r.permissions.length} permissions</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: detail panel ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>Select a request to review</div>
            <div style={{ fontSize: 13 }}>{pending > 0 ? `${pending} pending request${pending > 1 ? 's' : ''} need attention` : 'No pending requests right now'}</div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ background: T.card, border: `1px solid ${STATUS_META[selected.status].color}30`, borderLeft: `4px solid ${STATUS_META[selected.status].color}`, borderRadius: 10, padding: '18px 22px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{selected.roleName}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_META[selected.status].color, background: `${STATUS_META[selected.status].color}15`, border: `1px solid ${STATUS_META[selected.status].color}30`, borderRadius: 4, padding: '2px 8px' }}>
                      {selected.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: T.muted }}>
                    <span style={{ color: '#94A3B8', fontWeight: 500 }}>{selected.tenant?.businessName || selected.tenant?.name}</span>
                    <span style={{ marginLeft: 8 }}>· {selected.tenant?.businessType}</span>
                    <span style={{ marginLeft: 8 }}>· Requested {new Date(selected.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, color: T.muted, padding: '5px 10px', cursor: 'pointer', fontSize: 13 }}>
                  ✕
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Reason */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Reason for Request</div>
                {selected.reason ? (
                  <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>{selected.reason}</p>
                ) : (
                  <p style={{ fontSize: 13, color: T.muted, fontStyle: 'italic', margin: 0 }}>No reason provided</p>
                )}
              </div>

              {/* Permissions requested */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  Requested Permissions {selected.permissions?.length > 0 && <span style={{ color: T.accent }}>({selected.permissions.length})</span>}
                </div>
                {selected.permissions?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selected.permissions.map((p) => {
                      const [modKey, op] = p.split('.');
                      const mod = MODULE_REGISTRY[modKey];
                      return (
                        <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#1A2838', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px' }}>
                          {mod && <span style={{ width: 6, height: 6, borderRadius: '50%', background: MODULE_CATEGORY_COLORS[mod.category] || T.accent, flexShrink: 0 }} />}
                          <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{p}</span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: T.muted, fontStyle: 'italic', margin: 0 }}>No specific permissions listed</p>
                )}
              </div>
            </div>

            {/* Cross-reference with catalog */}
            {selected.permissions?.length > 0 && (() => {
              const moduleKeys = [...new Set(selected.permissions.map(p => p.split('.')[0]).filter(k => MODULE_REGISTRY[k]))];
              if (moduleKeys.length === 0) return null;
              return (
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Module Impact</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                    {moduleKeys.map(mk => {
                      const mod = MODULE_REGISTRY[mk];
                      const catColor = MODULE_CATEGORY_COLORS[mod.category] || T.accent;
                      const modPerms = selected.permissions.filter(p => p.startsWith(mk + '.'));
                      return (
                        <div key={mk} style={{ background: '#0F1923', border: `1px solid ${catColor}25`, borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{mod.label}</span>
                          </div>
                          <div style={{ fontSize: 10, color: catColor, background: `${catColor}10`, borderRadius: 4, padding: '2px 6px', display: 'inline-block' }}>
                            {modPerms.length} permission{modPerms.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Existing admin note */}
            {selected.adminNote && (
              <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Admin Notes</div>
                <p style={{ fontSize: 13, color: '#CBD5E1', margin: 0, lineHeight: 1.6 }}>{selected.adminNote}</p>
              </div>
            )}

            {/* Action area — only for PENDING */}
            {selected.status === 'PENDING' && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Review Decision</div>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Add notes — reason for approval/rejection, implementation details, or any caveats…"
                  rows={3}
                  style={{ width: '100%', background: '#0F1923', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: '10px 12px', resize: 'vertical', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => handleAction('APPROVED')} disabled={saving} style={{ flex: 1, padding: '11px', background: 'rgba(52,211,153,0.12)', border: '1px solid #34D399', borderRadius: 8, color: '#34D399', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    ✓ Approve
                  </button>
                  <button onClick={() => handleAction('IMPLEMENTED')} disabled={saving} style={{ flex: 1, padding: '11px', background: 'rgba(96,165,250,0.12)', border: '1px solid #60A5FA', borderRadius: 8, color: '#60A5FA', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    🚀 Mark Implemented
                  </button>
                  <button onClick={() => handleAction('REJECTED')} disabled={saving} style={{ flex: 1, padding: '11px', background: 'rgba(248,113,113,0.12)', border: '1px solid #F87171', borderRadius: 8, color: '#F87171', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RolesMatrix() {
  const [view, setView]               = useState('roles');   // 'roles' | 'modules'
  const [selectedRole, setSelectedRole] = useState('OWNER');
  const [selectedModule, setSelectedModule] = useState('invoicing');
  const [modFilter, setModFilter]     = useState('All');

  const totalFeatures = useMemo(() => ALL_MODULE_KEYS.reduce((s, k) => s + Object.keys(MODULE_REGISTRY[k]?.features || {}).length, 0), []);

  const filteredModules = modFilter === 'All'
    ? ALL_MODULE_KEYS
    : ALL_MODULE_KEYS.filter((mk) => MODULE_REGISTRY[mk]?.category === modFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.bg, color: T.text, fontFamily: 'var(--font-body, system-ui)' }}>

      {/* ── Header ── */}
      <div style={{ padding: '18px 28px 14px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>Roles & Modules Matrix</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: T.muted }}>Every role and every module on the Syllabrix platform — independent of any business type</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Pill label={`${DEFAULT_ROLES.length} Standard Roles`}      color={T.blue} />
            <Pill label={`${EXTRA_ROLES.length} Business-Specific Roles`} color={T.amber} />
            <Pill label={`${ALL_MODULE_KEYS.length} Modules`}            color={T.green} />
            <Pill label={`${totalFeatures} Features`}                    color={T.accent} />
          </div>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {[['roles', '👥 All Roles'], ['modules', '📦 All Modules'], ['requests', '🔑 Role Requests']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              style={{
                padding: '7px 20px', borderRadius: 8, cursor: 'pointer',
                background: view === key ? 'rgba(39,220,255,0.1)' : 'transparent',
                border: `1.5px solid ${view === key ? T.accent : T.border}`,
                color: view === key ? T.accent : T.muted,
                fontSize: 13, fontWeight: view === key ? 600 : 500, transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Role Requests full-width view */}
        {view === 'requests' && <RoleRequestsView />}

        {/* Left list panel — hidden when viewing requests */}
        <div style={{ width: 260, flexShrink: 0, background: T.sidebar, borderRight: `1px solid ${T.border}`, overflowY: 'auto', display: view === 'requests' ? 'none' : 'flex', flexDirection: 'column' }}>

          {view === 'roles' ? (
            <div style={{ padding: '12px 8px 12px 0' }}>
              {/* Standard roles */}
              <div style={{ padding: '0 0 6px 14px', fontSize: 10, fontWeight: 700, color: T.blue, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Standard Roles · {DEFAULT_ROLES.length}
              </div>
              {DEFAULT_ROLES.map((role) => (
                <RoleListItem key={role.templateKey} role={role} selected={selectedRole === role.templateKey} onClick={() => setSelectedRole(role.templateKey)} />
              ))}

              {/* Divider */}
              <div style={{ margin: '12px 14px', borderTop: `1px solid ${T.border}` }} />

              {/* Business-specific roles */}
              <div style={{ padding: '0 0 6px 14px', fontSize: 10, fontWeight: 700, color: T.amber, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Business-Specific · {EXTRA_ROLES.length}
              </div>
              {EXTRA_ROLES.map((role) => (
                <RoleListItem key={role.templateKey} role={role} selected={selectedRole === role.templateKey} onClick={() => setSelectedRole(role.templateKey)} />
              ))}
            </div>
          ) : (
            <div style={{ padding: '12px 8px 12px 0', display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Category filter */}
              <div style={{ padding: '0 8px 10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Filter by category</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {['All', ...MODULE_CATEGORIES].map((cat) => {
                    const color = cat === 'All' ? T.accent : (MODULE_CATEGORY_COLORS[cat] || T.muted);
                    return (
                      <button key={cat} onClick={() => setModFilter(cat)} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: `1px solid ${modFilter === cat ? color : T.border}`, background: modFilter === cat ? `${color}15` : 'transparent', color: modFilter === cat ? color : T.muted, transition: 'all 0.15s' }}>
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Module list */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredModules.map((mk) => {
                  const mod = MODULE_REGISTRY[mk];
                  const catColor = MODULE_CATEGORY_COLORS[mod.category] || T.accent;
                  const active = mk === selectedModule;
                  return (
                    <button key={mk} onClick={() => setSelectedModule(mk)} style={{ width: '100%', textAlign: 'left', background: active ? `${catColor}10` : 'transparent', border: `1px solid ${active ? catColor + '40' : 'transparent'}`, borderLeft: `3px solid ${active ? catColor : 'transparent'}`, borderRadius: '0 8px 8px 0', padding: '10px 12px', marginBottom: 2, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: active ? T.text : '#B0BEC5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.label}</div>
                        <div style={{ fontSize: 9, color: T.muted, fontFamily: 'monospace', marginTop: 1 }}>{mod.code}</div>
                      </div>
                      <span style={{ fontSize: 10, color: T.muted, flexShrink: 0 }}>{Object.keys(mod.features).length}f</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right detail panel — hidden when viewing requests */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', minHeight: 0, display: view === 'requests' ? 'none' : 'flex', flexDirection: 'column' }}>
          {view === 'roles' ? (
            (() => {
              const role = ALL_ROLES.find((r) => r.templateKey === selectedRole);
              return role ? <RoleDetail role={role} /> : null;
            })()
          ) : (
            <ModuleDetail moduleKey={selectedModule} />
          )}
        </div>
      </div>
    </div>
  );
}
