import { useEffect, useState } from 'react';
import { getSAAdmins, createSAAdmin } from '../../api/platform';
import axios from 'axios';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/v1', '/api/platform')
  : 'http://localhost:5000/api/platform';

const api = axios.create({ baseURL: BASE });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('saToken');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const WINGS = ['COMMAND', 'GROWTH', 'TENANTS', 'PLATFORM', 'OPERATIONS', 'INTELLIGENCE', 'ADMIN'];
const WING_ICON = { COMMAND: '▦', GROWTH: '💰', TENANTS: '🏢', PLATFORM: '⚙️', OPERATIONS: '🔧', INTELLIGENCE: '📈', ADMIN: '🔑' };
const OP_COLOR  = { C: '#059669', R: '#2563EB', U: '#D97706', D: '#DC2626' };
const ROLE_COLOR = { SUPER: '#F59E0B', ADMIN: '#A78BFA', SUPPORT: '#34D399', COMPLIANCE: '#60A5FA', ANALYST: '#F472B6', DEVELOPER: '#FB923C' };

const T = { bg: '#111C27', card: '#192533', border: '#1E2D3D', text: '#F1F5F9', muted: '#64748B', accent: '#27DCFF' };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const S = {
  page:  { padding: 28, maxWidth: 1200, margin: '0 auto' },
  btn:   (v) => ({
    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
    ...(v === 'primary' && { background: T.accent, color: '#0B131C' }),
    ...(v === 'ghost'   && { background: '#ffffff12', color: T.muted }),
    ...(v === 'danger'  && { background: '#DC262618', color: '#F87171', border: '1px solid #DC262640' }),
    ...(v === 'success' && { background: '#05966918', color: '#34D399', border: '1px solid #05966940' }),
  }),
  input: { padding: '9px 12px', background: '#111C27', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box' },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#192533', border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 500, maxHeight: '90vh', overflowY: 'auto' },
};

// ── Grant Access Modal ────────────────────────────────────────────────────────
function GrantModal({ admin, onClose, onSaved }) {
  const [wing, setWing]     = useState('TENANTS');
  const [access, setAccess] = useState({ C: false, R: true, U: false, D: false });
  const [reason, setReason] = useState('');
  const [type, setType]     = useState('temporary'); // 'permanent' | 'temporary'
  const [days, setDays]     = useState(7);
  const [saving, setSaving] = useState(false);

  const toggleOp = (op) => setAccess((a) => ({ ...a, [op]: !a[op] }));

  const handleGrant = async () => {
    const ops = Object.keys(access).filter((k) => access[k]);
    if (!ops.length)      return toast.error('Select at least one permission');
    if (!reason.trim())   return toast.error('Reason is required');

    let expiresAt = null;
    if (type === 'temporary') {
      const d = new Date();
      d.setDate(d.getDate() + Number(days));
      expiresAt = d.toISOString();
    }

    setSaving(true);
    try {
      await api.post(`/nc-grants/${admin.id}`, { wing, access: ops, reason, expiresAt });
      toast.success('Access granted');
      onSaved();
      onClose();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to grant access'); }
    finally { setSaving(false); }
  };

  const expDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + Number(days));
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  })();

  return (
    <div style={S.modal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modalBox}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 20 }}>
          Grant Access — {admin.name}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Wing</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {WINGS.map((w) => (
              <button key={w} type="button" onClick={() => setWing(w)} style={{
                padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${wing === w ? T.accent : T.border}`,
                background: wing === w ? `${T.accent}18` : 'transparent',
                color: wing === w ? T.accent : T.muted,
              }}>
                {WING_ICON[w]} {w}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Permissions</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['C', 'R', 'U', 'D'].map((op) => (
              <button key={op} type="button" onClick={() => toggleOp(op)} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${access[op] ? OP_COLOR[op] : T.border}`,
                background: access[op] ? `${OP_COLOR[op]}20` : 'transparent',
                color: access[op] ? OP_COLOR[op] : T.muted,
              }}>
                {op}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>C = Create · R = Read · U = Update · D = Delete</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Duration</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {['temporary', 'permanent'].map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} style={{
                flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${type === t ? T.accent : T.border}`,
                background: type === t ? `${T.accent}18` : 'transparent',
                color: type === t ? T.accent : T.muted,
              }}>
                {t === 'temporary' ? '⏱ Temporary' : '∞ Permanent'}
              </button>
            ))}
          </div>
          {type === 'temporary' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {[1, 3, 7, 14, 30].map((d) => (
                <button key={d} type="button" onClick={() => setDays(d)} style={{
                  padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${days === d ? T.accent : T.border}`,
                  background: days === d ? `${T.accent}18` : 'transparent',
                  color: days === d ? T.accent : T.muted,
                }}>{d}d</button>
              ))}
              <span style={{ fontSize: 12, color: T.muted, marginLeft: 4 }}>Expires {expDate}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>Reason <span style={{ color: '#F87171' }}>*</span></label>
          <input style={S.input} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this access needed?" />
          <div style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>This is logged in the audit trail and cannot be changed later.</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button style={S.btn('ghost')} onClick={onClose}>Cancel</button>
          <button style={S.btn('primary')} onClick={handleGrant} disabled={saving}>
            {saving ? 'Granting…' : 'Grant Access'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Admin Detail Panel ────────────────────────────────────────────────────────
function AdminPanel({ admin, roles, onClose, onUpdated }) {
  const [grants, setGrants]       = useState([]);
  const [loadingG, setLoadingG]   = useState(true);
  const [grantModal, setGrantModal] = useState(false);
  const [assignRole, setAssignRole] = useState(admin.platformRoleId || '');
  const [savingRole, setSavingRole] = useState(false);

  const loadGrants = async () => {
    try {
      const r = await api.get(`/nc-grants/${admin.id}`);
      setGrants(r.data.data || []);
    } catch { toast.error('Failed to load grants'); }
    finally { setLoadingG(false); }
  };

  useEffect(() => { loadGrants(); }, []);

  const handleAssignRole = async () => {
    if (!assignRole) return toast.error('Select a role');
    setSavingRole(true);
    try {
      await api.patch(`/nc-roles/${admin.id}/assign`, { roleId: assignRole });
      toast.success('Role assigned');
      onUpdated();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to assign role'); }
    finally { setSavingRole(false); }
  };

  const handleRevoke = async (grantId) => {
    if (!confirm('Revoke this grant?')) return;
    try {
      await api.delete(`/nc-grants/${grantId}/revoke`);
      toast.success('Grant revoked');
      loadGrants();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to revoke'); }
  };

  const activeGrants  = grants.filter((g) => g.status === 'active');
  const historyGrants = grants.filter((g) => g.status !== 'active');

  const statusColor = { active: '#34D399', expired: '#64748B', revoked: '#F87171' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', zIndex: 1000 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 480, height: '100vh', background: '#192533', borderLeft: `1px solid ${T.border}`, overflowY: 'auto', padding: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{admin.name}</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{admin.email}</div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, marginTop: 6, display: 'inline-block',
              background: `${ROLE_COLOR[admin.role] || '#64748B'}22`, color: ROLE_COLOR[admin.role] || '#64748B' }}>
              {admin.platformRole?.label || admin.role}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Assign Role */}
        <div style={{ background: '#111C27', borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Base Role</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={assignRole} onChange={(e) => setAssignRole(e.target.value)}
              style={{ ...S.input, flex: 1 }}>
              <option value="">Select role…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.label} ({r.name})</option>
              ))}
            </select>
            <button style={S.btn('primary')} onClick={handleAssignRole} disabled={savingRole}>
              {savingRole ? '…' : 'Assign'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>
            Base role defines the permanent floor of access. Use grants below for temporary additions.
          </div>
        </div>

        {/* Active Grants */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Active Grants ({activeGrants.length})</div>
          <button style={S.btn('primary')} onClick={() => setGrantModal(true)}>+ Grant Access</button>
        </div>

        {loadingG ? (
          <div style={{ color: T.muted, fontSize: 13, padding: '12px 0' }}>Loading grants…</div>
        ) : activeGrants.length === 0 ? (
          <div style={{ color: T.muted, fontSize: 13, padding: '12px 0', textAlign: 'center' }}>No active grants</div>
        ) : activeGrants.map((g) => (
          <div key={g.id} style={{ background: '#111C27', borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                  {WING_ICON[g.wing]} {g.wing}
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: OP_COLOR.C }}>
                    {g.access.join(' · ')}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>"{g.reason}"</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                  By {g.grantedBy?.name} · {fmtDateTime(g.createdAt)}
                  {g.expiresAt ? ` · Expires ${fmtDate(g.expiresAt)}` : ' · Permanent'}
                </div>
              </div>
              <button style={S.btn('danger')} onClick={() => handleRevoke(g.id)}>Revoke</button>
            </div>
          </div>
        ))}

        {/* Grant History */}
        {historyGrants.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, margin: '20px 0 10px' }}>History</div>
            {historyGrants.map((g) => (
              <div key={g.id} style={{ background: '#111C27', borderRadius: 10, padding: '10px 14px', marginBottom: 6, opacity: 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                      {WING_ICON[g.wing]} {g.wing} · {g.access.join(' · ')}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>"{g.reason}"</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor[g.status] || T.muted }}>
                    {g.status}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {grantModal && (
        <GrantModal
          admin={admin}
          onClose={() => setGrantModal(false)}
          onSaved={() => { loadGrants(); onUpdated(); }}
        />
      )}
    </div>
  );
}

// ── Main Admins Page ──────────────────────────────────────────────────────────
export default function Admins() {
  const [admins, setAdmins]     = useState([]);
  const [roles, setRoles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'SUPPORT' });
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, rRes] = await Promise.all([getSAAdmins(), api.get('/nc-roles')]);
      setAdmins(aRes.data.data || []);
      setRoles(rRes.data.data || []);
    } catch { toast.error('Failed to load admins'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('All fields required');
    setSaving(true);
    try {
      await createSAAdmin(form);
      toast.success('Admin created');
      setCreateModal(false);
      setForm({ name: '', email: '', password: '', role: 'SUPPORT' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create admin'); }
    finally { setSaving(false); }
  };

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: T.text }}>Nerve Center Admins</h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>Click any admin to manage their role and grants.</p>
        </div>
        <button style={S.btn('primary')} onClick={() => setCreateModal(true)}>+ Add Admin</button>
      </div>

      {loading ? (
        <div style={{ color: T.muted, fontSize: 14 }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {admins.map((a) => (
            <div key={a.id}
              onClick={() => setSelected(a)}
              style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, padding: '20px 22px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = T.accent}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: `linear-gradient(135deg, ${ROLE_COLOR[a.role] || '#64748B'}, ${ROLE_COLOR[a.role] || '#64748B'}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: '#0B131C',
                }}>{a.name?.[0]?.toUpperCase() || 'A'}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{a.name}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 99,
                    background: `${ROLE_COLOR[a.role] || '#64748B'}22`, color: ROLE_COLOR[a.role] || '#64748B' }}>
                    {a.platformRole?.label || a.role}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: T.muted }}>{a.email}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginTop: 10 }}>
                <span style={{ color: a.isActive ? '#34D399' : '#F87171', fontWeight: 600 }}>
                  {a.isActive ? '● Active' : '● Inactive'}
                </span>
                <span>Joined {fmtDate(a.createdAt)}</span>
              </div>
            </div>
          ))}
          {admins.length === 0 && (
            <div style={{ color: T.muted, fontSize: 14, gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>No admins found</div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {createModal && (
        <div style={S.modal} onClick={(e) => e.target === e.currentTarget && setCreateModal(false)}>
          <div style={{ ...S.modalBox, maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text }}>New Nerve Center Admin</h3>
              <button onClick={() => setCreateModal(false)} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            {[
              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Riya Sharma' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'riya@syllabrix.com' },
              { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={S.label}>{f.label}</label>
                <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} style={S.input} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Initial Role</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['SUPPORT', 'COMPLIANCE', 'ANALYST', 'DEVELOPER', 'ADMIN', 'SUPER'].map((r) => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, role: r })} style={{
                    padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${form.role === r ? (ROLE_COLOR[r] || T.accent) : T.border}`,
                    background: form.role === r ? `${ROLE_COLOR[r] || T.accent}22` : 'transparent',
                    color: form.role === r ? (ROLE_COLOR[r] || T.accent) : T.muted,
                  }}>{r}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={S.btn('ghost')} onClick={() => setCreateModal(false)}>Cancel</button>
              <button style={{ ...S.btn('primary'), flex: 1 }} onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating…' : 'Create Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Detail Panel */}
      {selected && (
        <AdminPanel
          admin={selected}
          roles={roles}
          onClose={() => setSelected(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}
