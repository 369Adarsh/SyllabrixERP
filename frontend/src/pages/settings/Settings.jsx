import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTenantProfile, updateTenantProfile, getUsers, createUser, updateUser, deleteUser, changePassword } from '../../api';
import { Building2, Users, Shield, Plus, X, Edit2, Trash2, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const ROLES = ['OWNER', 'ADMIN', 'ACCOUNTANT', 'STAFF'];

// ─── Business Profile Tab ───────────────────────────────────────────────────

function ProfileTab({ tenant, onSaved }) {
  const [form, setForm] = useState({
    name: tenant?.name || '',
    phone: tenant?.phone || '',
    address: tenant?.address || '',
    city: tenant?.city || '',
    state: tenant?.state || '',
    pincode: tenant?.pincode || '',
    gstin: tenant?.gstin || '',
    pan: tenant?.pan || '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Business name is required');
    setLoading(true);
    try {
      await updateTenantProfile(form);
      toast.success('Profile updated');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Business details</h3>
          <p style={{ fontSize: 13, color: '#6B7280' }}>This information appears on invoices and receipts.</p>
        </div>

        <Input label="Business name *" value={form.name} onChange={set('name')} placeholder="Your business name" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="9876543210" />
          <Input label="City" value={form.city} onChange={set('city')} placeholder="Mumbai" />
        </div>

        <Input label="Address" value={form.address} onChange={set('address')} placeholder="Street address" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="State" value={form.state} onChange={set('state')} placeholder="Maharashtra" />
          <Input label="Pincode" value={form.pincode} onChange={set('pincode')} placeholder="400001" />
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Tax information</h3>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Used for GST calculations on invoices.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="GSTIN" value={form.gstin} onChange={set('gstin')} placeholder="27AAPFU0939F1ZV" />
            <Input label="PAN" value={form.pan} onChange={set('pan')} placeholder="AAPFU0939F" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <Button type="submit" loading={loading}>Save changes</Button>
        </div>
      </div>
    </form>
  );
}

// ─── Team Management Tab ──────────────────────────────────────────────────────

function AddUserModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STAFF' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email || !form.password) return toast.error('All fields are required');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await createUser(form);
      toast.success('Team member added');
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Add Team Member</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Full name *" placeholder="Ramesh Kumar" value={form.name} onChange={set('name')} />
          <Input label="Email *" type="email" placeholder="ramesh@business.com" value={form.email} onChange={set('email')} />
          <Input label="Password *" type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Role</label>
            <select value={form.role} onChange={set('role')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              {ROLES.filter(r => r !== 'OWNER').map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
            </select>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
              Admin — full access except owner actions. Accountant — invoices & reports only. Staff — basic operations.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Add member</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeamTab({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await getUsers();
      setUsers(r.data.data || []);
    } catch {
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (u, role) => {
    try {
      await updateUser(u.id, { role });
      toast.success('Role updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleToggleActive = async (u) => {
    try {
      await updateUser(u.id, { isActive: !u.isActive });
      toast.success(u.isActive ? 'Member deactivated' : 'Member activated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const ROLE_COLORS = {
    OWNER:      { bg: '#EDE9FE', color: '#7C3AED' },
    ADMIN:      { bg: '#EFF6FF', color: '#3B82F6' },
    ACCOUNTANT: { bg: '#FFFBEB', color: '#D97706' },
    STAFF:      { bg: '#F3F4F6', color: '#6B7280' },
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Team members</h3>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Manage who has access to your Syllabrix account.</p>
        </div>
        {currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN' ? (
          <Button onClick={() => setShowAdd(true)}><Plus size={15} style={{ marginRight: 5 }} />Add member</Button>
        ) : null}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map(u => {
            const rc = ROLE_COLORS[u.role] || ROLE_COLORS.STAFF;
            const isSelf = u.id === currentUser?.id;
            return (
              <div key={u.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, opacity: u.isActive ? 1 : 0.55 }}>
                <div style={{ width: 40, height: 40, background: rc.bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: rc.color, flexShrink: 0 }}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {u.name}
                    {isSelf && <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '1px 8px', borderRadius: 10 }}>You</span>}
                    {!u.isActive && <span style={{ fontSize: 11, background: '#FEF2F2', color: '#DC2626', padding: '1px 8px', borderRadius: 10 }}>Inactive</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!isSelf && (currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN') && u.role !== 'OWNER' ? (
                    <select value={u.role} onChange={e => handleRoleChange(u, e.target.value)}
                      style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
                      {ROLES.filter(r => r !== 'OWNER').map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                    </select>
                  ) : (
                    <span style={{ background: rc.bg, color: rc.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                    </span>
                  )}
                  {!isSelf && u.role !== 'OWNER' && currentUser?.role === 'OWNER' && (
                    <button onClick={() => handleToggleActive(u)} title={u.isActive ? 'Deactivate' : 'Activate'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: u.isActive ? '#DC2626' : '#16A34A', padding: 4, display: 'flex' }}>
                      {u.isActive ? <Trash2 size={15} /> : <CheckCircle size={15} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

// ─── Security Tab ──────────────────────────────────────────────────────────

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword) return toast.error('All fields are required');
    if (form.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 460 }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Change password</h3>
        <p style={{ fontSize: 13, color: '#6B7280' }}>Use a strong password of at least 8 characters.</p>
      </div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Current password" type="password" placeholder="••••••••" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" />
        <Input label="New password" type="password" placeholder="Minimum 8 characters" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" />
        <Input label="Confirm new password" type="password" placeholder="Repeat new password" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
        <div style={{ marginTop: 4 }}>
          <Button type="submit" loading={loading}>Update password</Button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Settings Page ────────────────────────────────────────────────────

const TABS = [
  { id: 'profile', label: 'Business Profile', icon: Building2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function Settings() {
  const { user, tenant, refreshMe } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getTenantProfile().then(r => setProfile(r.data.data || r.data)).catch(() => {});
  }, []);

  const handleProfileSaved = async () => {
    await refreshMe();
    const r = await getTenantProfile();
    setProfile(r.data.data || r.data);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>Manage your business profile and team</p>
      </div>

      <div style={{ display: 'flex', gap: 32 }}>
        {/* Sidebar nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 180, flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
              border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, textAlign: 'left',
              background: tab === t.id ? 'var(--navy)' : 'transparent',
              color: tab === t.id ? '#fff' : '#6B7280',
              transition: 'all 0.15s',
            }}>
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: '28px 32px' }}>
          {tab === 'profile' && (profile ? <ProfileTab tenant={profile} onSaved={handleProfileSaved} /> : <div style={{ color: '#9CA3AF' }}>Loading...</div>)}
          {tab === 'team' && <TeamTab currentUser={user} />}
          {tab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}
