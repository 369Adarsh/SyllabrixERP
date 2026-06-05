import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getSANcRoles, createSANcRole, updateSANcRole, deleteNcRole } from '../../api/platform';

const WINGS = ['COMMAND', 'GROWTH', 'TENANTS', 'PLATFORM', 'OPERATIONS', 'INTELLIGENCE', 'ADMIN'];
const WING_META = {
  COMMAND:      { label: 'Command',      desc: 'Dashboard, Health, Activity',                    icon: '▦' },
  GROWTH:       { label: 'Growth',       desc: 'Revenue, Plans, Plan Builder, Onboarding',        icon: '💰' },
  TENANTS:      { label: 'Tenants',      desc: 'All Tenants, Compliance, Subscriptions',          icon: '🏢' },
  PLATFORM:     { label: 'Platform',     desc: 'Business Builder, Catalog, Feature Flags',        icon: '⚙️' },
  OPERATIONS:   { label: 'Operations',   desc: 'Bug Reports, Dev Queue, Announcements, Maintenance', icon: '🔧' },
  INTELLIGENCE: { label: 'Intelligence', desc: 'Analytics, Errors, Audit Logs, Module Usage',    icon: '📈' },
  ADMIN:        { label: 'Admin',        desc: 'Admins, API Keys — SUPER only',                   icon: '🔑' },
};
const OPS = ['C', 'R', 'U', 'D'];
const OP_COLOR = { C: '#059669', R: '#2563EB', U: '#D97706', D: '#DC2626' };
const OP_LABEL = { C: 'Create', R: 'Read', U: 'Update', D: 'Delete' };

const emptyPerms = () => Object.fromEntries(WINGS.map((w) => [w, { C: false, R: false, U: false, D: false }]));

const T = {
  bg: '#111C27', card: '#1A2838', border: '#1E2D3D',
  text: '#F1F5F9', muted: '#64748B', accent: '#27DCFF',
};

const S = {
  page:    { padding: 28, maxWidth: 1100, margin: '0 auto' },
  h1:      { fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 4, fontFamily: 'var(--font-display)' },
  sub:     { fontSize: 13, color: T.muted, marginBottom: 24 },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 },
  card:    { background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 },
  cardH:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  roleLabel: { fontSize: 15, fontWeight: 700, color: T.text },
  roleSub:   { fontSize: 12, color: T.muted, marginTop: 2 },
  builtIn:   { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: '#27DCFF22', color: T.accent },
  custom:    { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: '#A78BFA22', color: '#A78BFA' },
  matrix:    { display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 0' },
  wingRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}` },
  wingName:  { fontSize: 12, color: T.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  opBadges:  { display: 'flex', gap: 3 },
  op:        (active, color) => ({
    width: 22, height: 22, borderRadius: 4, fontSize: 10, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? `${color}25` : '#ffffff08',
    color: active ? color : '#334155',
    border: `1px solid ${active ? color + '60' : '#1E2D3D'}`,
  }),
  btn:    (v) => ({
    padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: 'none',
    ...(v === 'primary' && { background: T.accent, color: '#0B131C' }),
    ...(v === 'ghost'   && { background: '#ffffff10', color: T.muted }),
    ...(v === 'danger'  && { background: '#DC262620', color: '#F87171', border: '1px solid #DC262640' }),
  }),
  modal:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#1A2838', border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 540, maxHeight: '90vh', overflowY: 'auto' },
  input:    { width: '100%', padding: '9px 12px', background: '#0F1923', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  label:    { fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6, display: 'block' },
  toggle:   (on, color) => ({
    width: 30, height: 18, borderRadius: 9, background: on ? color : '#334155',
    position: 'relative', cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
  }),
  thumb:    (on) => ({
    position: 'absolute', top: 2, left: on ? 14 : 2, width: 14, height: 14,
    borderRadius: '50%', background: '#fff', transition: 'left 0.15s',
  }),
};

function OpBadges({ perms }) {
  return (
    <div style={S.opBadges}>
      {OPS.map((op) => (
        <div key={op} style={S.op(perms?.[op], OP_COLOR[op])} title={OP_LABEL[op]}>{op}</div>
      ))}
    </div>
  );
}

function RoleCard({ role, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={S.card}>
      <div style={S.cardH}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={S.roleLabel}>{role.label}</span>
            <span style={role.isBuiltIn ? S.builtIn : S.custom}>
              {role.isBuiltIn ? 'Built-in' : 'Custom'}
            </span>
          </div>
          <div style={S.roleSub}>{role.description || role.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {!role.isBuiltIn && (
            <>
              <button style={S.btn('ghost')} onClick={() => onEdit(role)}>Edit</button>
              <button style={S.btn('danger')} onClick={() => onDelete(role)}>Del</button>
            </>
          )}
          <button style={S.btn('ghost')} onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Hide' : 'View'}
          </button>
        </div>
      </div>

      {expanded && (
        <div>
          {WINGS.map((w) => (
            <div key={w} style={S.wingRow}>
              <span style={S.wingName}>
                <span>{WING_META[w].icon}</span>{WING_META[w].label}
              </span>
              <OpBadges perms={role.permissions?.[w]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoleModal({ role, onClose, onSaved }) {
  const isEdit = !!role?.id;
  const [name, setName]         = useState(role?.name || '');
  const [label, setLabel]       = useState(role?.label || '');
  const [desc, setDesc]         = useState(role?.description || '');
  const [perms, setPerms]       = useState(() => {
    if (role?.permissions) return JSON.parse(JSON.stringify(role.permissions));
    return emptyPerms();
  });
  const [saving, setSaving] = useState(false);

  const toggleOp = (wing, op) => {
    setPerms((p) => ({ ...p, [wing]: { ...p[wing], [op]: !p[wing][op] } }));
  };

  const handleSave = async () => {
    if (!label.trim()) return toast.error('Role label is required');
    if (!isEdit && !name.trim()) return toast.error('Role name is required');
    setSaving(true);
    try {
      if (isEdit) {
        await updateSANcRole(role.id, { label, description: desc, permissions: perms });
        toast.success('Role updated');
      } else {
        await createSANcRole({ name, label, description: desc, permissions: perms });
        toast.success('Role created');
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={S.modal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modalBox}>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 20 }}>
          {isEdit ? `Edit Role: ${role.label}` : 'Create Custom Role'}
        </div>

        {!isEdit && (
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Role Key (uppercase, no spaces)</label>
            <input style={S.input} value={name} onChange={(e) => setName(e.target.value.toUpperCase().replace(/\s/g,''))} placeholder="e.g. MARKETING" />
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Display Label</label>
          <input style={S.input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Marketing Analyst" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>Description (optional)</label>
          <input style={S.input} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What does this role do?" />
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Permission Matrix
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginBottom: 6, paddingRight: 2 }}>
          {OPS.map((op) => (
            <span key={op} style={{ fontSize: 11, fontWeight: 700, color: OP_COLOR[op], width: 22, textAlign: 'center' }}>{op}</span>
          ))}
        </div>

        {WINGS.map((w) => (
          <div key={w} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{WING_META[w].icon} {WING_META[w].label}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{WING_META[w].desc}</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {OPS.map((op) => (
                <div key={op} style={{ width: 22, display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={S.toggle(perms[w]?.[op], OP_COLOR[op])}
                    onClick={() => toggleOp(w, op)}
                  >
                    <div style={S.thumb(perms[w]?.[op])} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button style={S.btn('ghost')} onClick={onClose}>Cancel</button>
          <button style={S.btn('primary')} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NerveRoles() {
  const [roles, setRoles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null); // null | 'create' | role object

  const load = async () => {
    try {
      const r = await getSANcRoles();
      setRoles(r.data.data || []);
    } catch { toast.error('Failed to load roles'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (role) => {
    if (!confirm(`Delete role "${role.label}"? This cannot be undone.`)) return;
    try {
      await deleteNcRole(role.id);
      toast.success('Role deleted');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
  };

  const builtIn = roles.filter((r) => r.isBuiltIn);
  const custom  = roles.filter((r) => !r.isBuiltIn);

  if (loading) return <div style={{ padding: 40, color: T.muted, fontSize: 14, textAlign: 'center' }}>Loading…</div>;

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={S.h1}>Nerve Center Roles</h1>
          <p style={S.sub}>Manage access control for Syllabrix team members. Built-in roles cannot be modified.</p>
        </div>
        <button style={S.btn('primary')} onClick={() => setModal('create')}>+ New Role</button>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
        Built-in Roles ({builtIn.length})
      </div>
      <div style={S.grid}>
        {builtIn.map((r) => (
          <RoleCard key={r.id} role={r} onEdit={setModal} onDelete={handleDelete} />
        ))}
      </div>

      {custom.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '24px 0 10px' }}>
            Custom Roles ({custom.length})
          </div>
          <div style={S.grid}>
            {custom.map((r) => (
              <RoleCard key={r.id} role={r} onEdit={setModal} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}

      {modal && (
        <RoleModal
          role={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
