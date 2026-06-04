import { useState, useEffect, useRef } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { getTenantProfile, updateTenantProfile, uploadBusinessLogo, getUsers, createUser, updateUser, deleteUser, changePassword, getTaxRates, createTaxRate, deleteTaxRate, getAutomationConfig, saveAutomationConfig, getRoleRequests, createRoleRequest, sendDailyDigest, getDigestPreview, createBranch, updateBranch, toggleBranch } from '../../api';
import { Building2, Users, Shield, Plus, X, Edit2, Trash2, CheckCircle, Percent, Zap, GraduationCap, Send, Clock, AlertCircle, ChevronDown, ChevronUp, Upload, ImageOff, Copy, Lock, Unlock, ChevronRight, Info, Eye, Settings2, GitBranch, ToggleRight } from 'lucide-react';
import ModuleFeatureSettings from './ModuleFeatureSettings';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { MODULES, MODULE_GROUPS, ACCESS_LEVELS, PERMISSION_PROFILES, resolvePermissions, getAccessMeta, getProfile } from '../../constants/permissions';

const ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'STAFF'];

const ROLE_META = {
  OWNER:      { color: '#7C3AED', bg: '#EDE9FE', label: 'Owner',      desc: 'Full access to everything including settings and user management.' },
  ADMIN:      { color: '#2563EB', bg: '#EFF6FF', label: 'Admin',      desc: 'Same as Owner but cannot manage users or delete the business.' },
  MANAGER:    { color: '#0891B2', bg: '#ECFEFF', label: 'Manager',    desc: 'Manages day-to-day operations — inventory, POS, customers, vendors, expenses.' },
  ACCOUNTANT: { color: '#D97706', bg: '#FFFBEB', label: 'Accountant', desc: 'Invoices, expenses, bank accounts, finance reports. No POS or inventory write access.' },
  CASHIER:    { color: '#059669', bg: '#ECFDF5', label: 'Cashier',    desc: 'POS sales only. Cannot access any reports, settings, or financial data.' },
  STAFF:      { color: '#6B7280', bg: '#F3F4F6', label: 'Staff',      desc: 'Dashboard and POS. Minimal access for floor/delivery staff.' },
};

const ROLE_PERMISSIONS = [
  { label: 'Dashboard',        OWNER: true,  ADMIN: true,  MANAGER: true,  ACCOUNTANT: true,  CASHIER: true,  STAFF: true  },
  { label: 'POS / Sales',      OWNER: true,  ADMIN: true,  MANAGER: true,  ACCOUNTANT: false, CASHIER: true,  STAFF: true  },
  { label: 'Inventory',        OWNER: true,  ADMIN: true,  MANAGER: true,  ACCOUNTANT: false, CASHIER: false, STAFF: false },
  { label: 'Invoices',         OWNER: true,  ADMIN: true,  MANAGER: true,  ACCOUNTANT: true,  CASHIER: false, STAFF: false },
  { label: 'Customers',        OWNER: true,  ADMIN: true,  MANAGER: true,  ACCOUNTANT: true,  CASHIER: false, STAFF: false },
  { label: 'Vendors & POs',    OWNER: true,  ADMIN: true,  MANAGER: true,  ACCOUNTANT: false, CASHIER: false, STAFF: false },
  { label: 'Expenses',         OWNER: true,  ADMIN: true,  MANAGER: true,  ACCOUNTANT: true,  CASHIER: false, STAFF: false },
  { label: 'Bank Accounts',    OWNER: true,  ADMIN: true,  MANAGER: false, ACCOUNTANT: true,  CASHIER: false, STAFF: false },
  { label: 'Finance / P&L',    OWNER: true,  ADMIN: true,  MANAGER: false, ACCOUNTANT: true,  CASHIER: false, STAFF: false },
  { label: 'Reports',          OWNER: true,  ADMIN: true,  MANAGER: true,  ACCOUNTANT: true,  CASHIER: false, STAFF: false },
  { label: 'Payroll',          OWNER: true,  ADMIN: true,  MANAGER: false, ACCOUNTANT: false, CASHIER: false, STAFF: false },
  { label: 'Staff & HR',       OWNER: true,  ADMIN: true,  MANAGER: true,  ACCOUNTANT: false, CASHIER: false, STAFF: false },
  { label: 'Campaigns',        OWNER: true,  ADMIN: true,  MANAGER: true,  ACCOUNTANT: false, CASHIER: false, STAFF: false },
  { label: 'Quotations',       OWNER: true,  ADMIN: true,  MANAGER: true,  ACCOUNTANT: true,  CASHIER: false, STAFF: false },
  { label: 'Credit Notes',     OWNER: true,  ADMIN: true,  MANAGER: false, ACCOUNTANT: true,  CASHIER: false, STAFF: false },
  { label: 'AI Copilot',       OWNER: true,  ADMIN: true,  MANAGER: true,  ACCOUNTANT: true,  CASHIER: false, STAFF: false },
  { label: 'Settings',         OWNER: true,  ADMIN: true,  MANAGER: false, ACCOUNTANT: false, CASHIER: false, STAFF: false },
  { label: 'User Management',  OWNER: true,  ADMIN: false, MANAGER: false, ACCOUNTANT: false, CASHIER: false, STAFF: false },
];

const EDUCATION_TYPES = ['COACHING', 'HOME_TUITION', 'MUSIC_SCHOOL', 'DANCE_ACADEMY', 'DRIVING_SCHOOL', 'COMPUTER_TRAINING'];

const COMMON_SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
  'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'Economics', 'Accountancy', 'Business Studies', 'Geography', 'History',
  'Sanskrit', 'Drawing / Art', 'Physical Education',
];

// ─── Logo Upload Section ──────────────────────────────────────────────────────

function LogoSection({ currentLogoUrl, onSaved }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview({ file, url: URL.createObjectURL(file) });
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!preview) return;
    const fd = new FormData();
    fd.append('logo', preview.file);
    setUploading(true);
    try {
      await uploadBusinessLogo(fd);
      toast.success('Logo updated');
      setPreview(null);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await updateTenantProfile({ logoUrl: null });
      toast.success('Logo removed');
      onSaved();
    } catch {
      toast.error('Failed to remove logo');
    } finally {
      setRemoving(false);
    }
  };

  const displayUrl = preview?.url || currentLogoUrl;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 20px', background: '#F9FAFB', borderRadius: 14, border: '1.5px dashed #D1D5DB', marginBottom: 4 }}>
      {/* Logo preview */}
      <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', background: displayUrl ? '#fff' : '#E5E7EB', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {displayUrl ? (
          <img src={displayUrl} alt="Business logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <ImageOff size={28} color="#C4C4C4" />
        )}
      </div>

      {/* Info + actions */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 3 }}>Business Logo</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>
          PNG, JPG or WebP · Max 2 MB · Shown in the sidebar and on receipts
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1.5px solid var(--navy)', background: '#fff', color: 'var(--navy)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <Upload size={13} />
            {currentLogoUrl ? 'Change' : 'Upload logo'}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--navy)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}
            >
              {uploading ? 'Saving…' : 'Save logo'}
            </button>
          )}
          {preview && (
            <button
              type="button"
              onClick={() => setPreview(null)}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}
            >
              Cancel
            </button>
          )}
          {currentLogoUrl && !preview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #FCA5A5', background: '#FFF5F5', color: '#DC2626', fontSize: 13, cursor: removing ? 'not-allowed' : 'pointer', opacity: removing ? 0.6 : 1 }}
            >
              {removing ? 'Removing…' : 'Remove'}
            </button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  );
}

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
    upiId: tenant?.receiptConfig?.upiId || '',
    thankYouMessage: tenant?.receiptConfig?.thankYouMessage || '',
    subjects: tenant?.receiptConfig?.subjects || [],
  });
  const [loading, setLoading] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');
  const isEducation = EDUCATION_TYPES.includes(tenant?.businessType);

  // Resync form when tenant prop changes (e.g. after save + re-fetch)
  useEffect(() => {
    if (!tenant) return;
    setForm({
      name: tenant?.name || '',
      phone: tenant?.phone || '',
      address: tenant?.address || '',
      city: tenant?.city || '',
      state: tenant?.state || '',
      pincode: tenant?.pincode || '',
      gstin: tenant?.gstin || '',
      pan: tenant?.pan || '',
      upiId: tenant?.receiptConfig?.upiId || '',
      thankYouMessage: tenant?.receiptConfig?.thankYouMessage || '',
      subjects: tenant?.receiptConfig?.subjects || [],
    });
  }, [tenant]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const addSubject = () => {
    const s = subjectInput.trim();
    if (!s) return;
    if (form.subjects.includes(s)) { toast.error('Subject already added'); return; }
    setForm(f => ({ ...f, subjects: [...f.subjects, s] }));
    setSubjectInput('');
  };

  const removeSubject = (i) => setForm(f => ({ ...f, subjects: f.subjects.filter((_, j) => j !== i) }));

  const quickAdd = (s) => {
    if (form.subjects.includes(s)) return;
    setForm(f => ({ ...f, subjects: [...f.subjects, s] }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Business name is required');
    setLoading(true);
    try {
      const { upiId, thankYouMessage, subjects, ...tenantFields } = form;
      await updateTenantProfile({
        ...tenantFields,
        receiptConfig: {
          ...(tenant?.receiptConfig || {}),
          upiId: upiId.trim(),
          thankYouMessage: thankYouMessage.trim(),
          subjects,
        },
      });
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

        <LogoSection currentLogoUrl={tenant?.logoUrl} onSaved={onSaved} />

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

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Payment & Receipt</h3>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>UPI ID is used to generate a scannable QR code at checkout.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Input label="UPI ID" value={form.upiId} onChange={set('upiId')} placeholder="yourname@upi (e.g. business@okaxis)" />
              {tenant?.receiptConfig?.upiId && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle size={12} />
                  Saved: <strong style={{ fontFamily: 'var(--font-mono)' }}>{tenant.receiptConfig.upiId}</strong>
                </div>
              )}
            </div>
            <Input label="Thank-you message on receipts" value={form.thankYouMessage} onChange={set('thankYouMessage')} placeholder="Thank you for shopping with us!" />
          </div>
        </div>

        {/* ── Subjects — education businesses only ── */}
        {isEducation && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <GraduationCap size={16} color="var(--navy)" />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Subjects Offered</h3>
            </div>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
              These subjects appear as a dropdown when enrolling a new student, so you don't need to type them every time.
            </p>

            {/* Current subjects — chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, minHeight: 36 }}>
              {form.subjects.length === 0 ? (
                <span style={{ fontSize: 13, color: '#C4C4C4', fontStyle: 'italic', alignSelf: 'center' }}>No subjects added yet</span>
              ) : form.subjects.map((s, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--navy)', color: '#fff', padding: '5px 12px 5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                  {s}
                  <button type="button" onClick={() => removeSubject(i)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick-add common subjects */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Quick add</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {COMMON_SUBJECTS.filter(s => !form.subjects.includes(s)).map(s => (
                  <button type="button" key={s} onClick={() => quickAdd(s)}
                    style={{ padding: '4px 11px', borderRadius: 16, border: '1.5px dashed #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--navy)'; e.currentTarget.style.color = 'var(--navy)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#6B7280'; }}>
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Add custom subject */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={subjectInput}
                onChange={e => setSubjectInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubject(); } }}
                placeholder="Type a custom subject and press Enter or Add…"
                style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none' }}
              />
              <button type="button" onClick={addSubject}
                style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--navy)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Add
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <Button type="submit" loading={loading}>Save changes</Button>
        </div>
      </div>
    </form>
  );
}

// ─── Team Management Tab ──────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.STAFF;
  return (
    <span style={{ background: m.bg, color: m.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  );
}

function PermissionMatrix({ selectedRole }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 24, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#F9FAFB', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={15} /> Role Permissions Reference</span>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{open ? '▲ Hide' : '▼ View what each role can access'}</span>
      </button>
      {open && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#F3F4F6' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: '#374151', borderBottom: '1px solid var(--border)', minWidth: 130 }}>Module</th>
                {ROLES.map(r => {
                  const m = ROLE_META[r];
                  return (
                    <th key={r} style={{ padding: '10px 12px', fontWeight: 700, color: m.color, borderBottom: '1px solid var(--border)', background: selectedRole === r ? m.bg : '#F3F4F6', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {m.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ROLE_PERMISSIONS.map((row, i) => (
                <tr key={row.label} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '9px 16px', color: '#374151', fontWeight: 600, borderBottom: '1px solid #F3F4F6' }}>{row.label}</td>
                  {ROLES.map(r => {
                    const m = ROLE_META[r];
                    const has = row[r];
                    return (
                      <td key={r} style={{ textAlign: 'center', padding: '9px 12px', borderBottom: '1px solid #F3F4F6', background: selectedRole === r ? `${m.bg}80` : 'transparent' }}>
                        {has
                          ? <span style={{ color: '#16A34A', fontSize: 16 }}>✓</span>
                          : <span style={{ color: '#E5E7EB', fontSize: 16 }}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AddUserModal({ onClose, onAdded, defaultBranchId = null, branches = [], hasBranches = false }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STAFF', branchId: defaultBranchId || '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const selectedMeta = ROLE_META[form.role] || ROLE_META.STAFF;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email || !form.password) return toast.error('All fields are required');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await createUser({ ...form, branchId: form.branchId || null });
      toast.success(`${form.name} added as ${selectedMeta.label}`);
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', margin: 0 }}>Add Team Member</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>They can log in using Staff Login with their email and password.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Full name *" placeholder="Ramesh Kumar" value={form.name} onChange={set('name')} autoFocus />
          <Input label="Email *" type="email" placeholder="ramesh@yourbusiness.com" value={form.email} onChange={set('email')} />
          <Input label="Password *" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={set('password')} />

          {/* Branch assignment — multi-branch businesses */}
          {hasBranches && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Branch Assignment</label>
              <select value={form.branchId} onChange={set('branchId')}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, background: '#fff', cursor: 'pointer', outline: 'none', color: '#374151' }}>
                <option value="">— Headquarters / Not branch-specific —</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}{b.isHQ ? ' (HQ)' : ''}{b.syllabrixId ? ` · ${b.syllabrixId}` : ''}</option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>Managers and staff should be assigned to their branch for proper access scoping.</div>
            </div>
          )}

          {/* Role selector */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Role *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ROLES.filter(r => r !== 'OWNER').map(r => {
                const m = ROLE_META[r];
                const active = form.role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r }))}
                    style={{
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      border: active ? `2px solid ${m.color}` : '2px solid var(--border)',
                      background: active ? m.bg : '#fff',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, color: active ? m.color : 'var(--navy)' }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, lineHeight: 1.4 }}>{m.desc.split('.')[0]}.</div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 10, padding: '10px 14px', background: selectedMeta.bg, borderRadius: 8, fontSize: 12, color: selectedMeta.color, fontWeight: 500 }}>
              <strong>{selectedMeta.label}:</strong> {selectedMeta.desc}
            </div>
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

// ─── All available permissions (keys map to sidebar modules) ──────────────────
const ALL_PERMISSIONS = [
  { key: 'dashboard',    label: 'Dashboard',       group: 'General' },
  { key: 'pos',          label: 'POS / Sales',      group: 'Operations' },
  { key: 'inventory',    label: 'Inventory',        group: 'Operations' },
  { key: 'customers',    label: 'Customers',        group: 'Operations' },
  { key: 'vendors',      label: 'Vendors & POs',    group: 'Operations' },
  { key: 'expenses',     label: 'Expenses',         group: 'Operations' },
  { key: 'campaigns',    label: 'Campaigns',        group: 'Operations' },
  { key: 'staff',        label: 'Staff & HR',       group: 'Operations' },
  { key: 'invoices',     label: 'Invoices',         group: 'Finance' },
  { key: 'quotations',   label: 'Quotations',       group: 'Finance' },
  { key: 'credit_notes', label: 'Credit Notes',     group: 'Finance' },
  { key: 'accounts',     label: 'Bank Accounts',    group: 'Finance' },
  { key: 'finance',      label: 'Finance / P&L',    group: 'Finance' },
  { key: 'reports',      label: 'Reports',          group: 'Finance' },
  { key: 'payroll',      label: 'Payroll',          group: 'Finance' },
  { key: 'ai',           label: 'AI Copilot',       group: 'General' },
  { key: 'settings',     label: 'Settings',         group: 'Admin' },
  { key: 'users',        label: 'User Management',  group: 'Admin' },
];
const PERM_GROUPS = ['General', 'Operations', 'Finance', 'Admin'];

const STATUS_META = {
  PENDING:      { color: '#D97706', bg: '#FFFBEB', label: 'Pending',      icon: Clock },
  UNDER_REVIEW: { color: '#2563EB', bg: '#EFF6FF', label: 'Under Review', icon: AlertCircle },
  APPROVED:     { color: '#16A34A', bg: '#F0FDF4', label: 'Approved',     icon: CheckCircle },
  REJECTED:     { color: '#DC2626', bg: '#FEF2F2', label: 'Rejected',     icon: X },
};

function CustomRoleRequest() {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ roleName: '', description: '', permissions: [], reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loadingReqs, setLoadingReqs] = useState(true);

  const loadRequests = async () => {
    setLoadingReqs(true);
    try { const r = await getRoleRequests(); setRequests(r.data.data || []); } catch {}
    finally { setLoadingReqs(false); }
  };

  useEffect(() => { loadRequests(); }, []);

  const togglePermission = (key) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(k => k !== key)
        : [...f.permissions, key],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createRoleRequest(form);
      toast.success('Role request sent to Syllabrix! We\'ll review it within 2 business days.');
      setShowForm(false);
      setForm({ roleName: '', description: '', permissions: [], reason: '' });
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 32, borderTop: '2px dashed var(--border)', paddingTop: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={15} /> Request a Custom Role from Syllabrix
          </h3>
          <p style={{ fontSize: 13, color: '#6B7280', maxWidth: 520 }}>
            Don't see a role that fits your business? Tell us what you need — tick the permissions, explain the use case, and our team will create it for you.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{ padding: '9px 16px', borderRadius: 10, border: '2px solid var(--navy)', background: '#fff', color: 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            + Request Custom Role
          </button>
        )}
      </div>

      {/* Request form */}
      {showForm && (
        <div style={{ background: '#F8FAFF', border: '1.5px solid #BFDBFE', borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h4 style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', margin: 0 }}>New Custom Role Request</h4>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Role name + description */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Role name *</label>
                <input
                  value={form.roleName}
                  onChange={e => setForm(f => ({ ...f, roleName: e.target.value }))}
                  placeholder='e.g. "Senior Auditor", "Counter Boy"'
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Short description</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder='e.g. "Handles invoice review only"'
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Permission checkboxes */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10 }}>
                Permissions needed * <span style={{ fontWeight: 400, color: '#9CA3AF' }}>({form.permissions.length} selected)</span>
              </label>
              {PERM_GROUPS.map(group => (
                <div key={group} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{group}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ALL_PERMISSIONS.filter(p => p.group === group).map(p => {
                      const checked = form.permissions.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px',
                            borderRadius: 8, cursor: 'pointer', userSelect: 'none',
                            border: checked ? '2px solid var(--navy)' : '1.5px solid #E5E7EB',
                            background: checked ? '#EFF6FF' : '#fff',
                            transition: 'all 0.12s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(p.key)}
                            style={{ width: 14, height: 14, accentColor: 'var(--navy)', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: 13, fontWeight: checked ? 700 : 500, color: checked ? 'var(--navy)' : '#374151' }}>
                            {p.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Reason */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Why do you need this role? * <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(helps us review faster)</span>
              </label>
              <textarea
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                rows={3}
                placeholder="e.g. We have a CA firm that audits our books monthly. They need to see invoices and finance reports but must not access POS or inventory..."
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
              />
            </div>

            {/* Info box */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
              <strong>How it works:</strong> Syllabrix reviews your request within 2 business days. If approved, the custom role will appear in your role list and you can assign it to team members. You'll see the status below.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 18px', borderRadius: 9, border: '1.5px solid var(--border)', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Send size={14} /> {submitting ? 'Sending…' : 'Send to Syllabrix'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Past requests */}
      {loadingReqs ? null : requests.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Your Role Requests</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map(req => {
              const sm = STATUS_META[req.status] || STATUS_META.PENDING;
              const StatusIcon = sm.icon;
              return (
                <div key={req.id} style={{ background: '#fff', border: `1.5px solid ${sm.color}30`, borderRadius: 12, padding: '16px 20px', borderLeft: `4px solid ${sm.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{req.roleName}</div>
                      {req.description && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{req.description}</div>}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                        {req.permissions.map(key => {
                          const p = ALL_PERMISSIONS.find(x => x.key === key);
                          return (
                            <span key={key} style={{ fontSize: 11, background: '#F3F4F6', color: '#374151', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                              {p?.label || key}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: sm.bg, color: sm.color, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      <StatusIcon size={13} /> {sm.label}
                    </div>
                  </div>
                  {req.adminNote && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#F9FAFB', borderRadius: 8, fontSize: 12, color: '#374151', borderLeft: '3px solid var(--cyan)' }}>
                      <strong>Syllabrix note:</strong> {req.adminNote}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#C4C4C4', marginTop: 10 }}>
                    Submitted {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Permission Editor Modal ───────────────────────────────────────────────────
function PermissionEditorModal({ targetUser, allUsers, onClose, onSaved }) {
  const { isMobile } = useBreakpoint();

  const initProfile = () => targetUser.permissionProfile ||
    (PERMISSION_PROFILES.find(p => p.systemRole === targetUser.role)?.id || 'custom');
  const initPerms = () => ({ ...resolvePermissions(targetUser) });

  const [selectedProfileId, setSelectedProfileId] = useState(initProfile);
  const [perms, setPerms] = useState(initPerms);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({ General: true, Operations: true, Finance: true, Admin: true });

  const selectedProfile = getProfile(selectedProfileId);

  const applyProfile = (profileId) => {
    const p = getProfile(profileId);
    if (!p) return;
    setSelectedProfileId(profileId);
    if (profileId !== 'custom') setPerms({ ...p.perms });
  };

  const setModulePerm = (key, level) => {
    setSelectedProfileId('custom');
    setPerms(prev => ({ ...prev, [key]: level }));
  };

  const handleCopyFrom = (uid) => {
    if (!uid) return;
    const src = allUsers.find(u => u.id === uid);
    if (!src) return;
    setPerms({ ...resolvePermissions(src) });
    setSelectedProfileId('custom');
    toast.success(`Copied permissions from ${src.name}`);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateUser(targetUser.id, {
        permissionProfile: selectedProfileId,
        customPermissions: selectedProfileId === 'custom' ? perms : null,
      });
      toast.success(`Permissions updated for ${targetUser.name}`);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const managedCount = Object.values(perms).filter(v => v === 'manage').length;
  const viewCount    = Object.values(perms).filter(v => v === 'view').length;
  const ownCount     = Object.values(perms).filter(v => v === 'own').length;
  const noneCount    = Object.values(perms).filter(v => v === 'none').length;
  const roleMeta = ROLE_META[targetUser.role] || ROLE_META.STAFF;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 0 : 20 }}>
      <div style={{
        background: '#fff', borderRadius: isMobile ? '20px 20px 0 0' : 20,
        width: '100%', maxWidth: 900, maxHeight: isMobile ? '95dvh' : '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        position: isMobile ? 'fixed' : 'relative', bottom: isMobile ? 0 : 'auto',
      }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0F2349 0%,#1B3A6B 100%)', padding: '20px 28px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${roleMeta.color}25`, border: `2.5px solid ${roleMeta.color}70`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>
                {targetUser.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{targetUser.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: roleMeta.bg, color: roleMeta.color, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{roleMeta.label}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{targetUser.email}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff' }}><X size={18} /></button>
          </div>
          {/* Permission summary bar */}
          <div style={{ display: 'flex', gap: 14, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Full Access', value: managedCount, color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
              { label: 'View Only',   value: viewCount,    color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
              { label: 'Own Records', value: ownCount,     color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
              { label: 'No Access',   value: noneCount,    color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: s.bg, borderRadius: 20, padding: '4px 12px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.value}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>

          {/* Left — Profile picker */}
          <div style={{ width: isMobile ? '100%' : 280, flexShrink: 0, borderRight: isMobile ? 'none' : '1px solid #F3F4F6', borderBottom: isMobile ? '1px solid #F3F4F6' : 'none', overflowY: 'auto', background: '#FAFAFA', maxHeight: isMobile ? 260 : 'none' }}>
            <div style={{ padding: '14px 16px 8px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Permission Profile</div>
              <div style={{ marginBottom: 12 }}>
                <select defaultValue="" onChange={e => handleCopyFrom(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, background: '#fff', color: '#374151', cursor: 'pointer' }}>
                  <option value="">📋 Copy from another user…</option>
                  {allUsers.filter(u => u.id !== targetUser.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({ROLE_META[u.role]?.label || u.role})</option>
                  ))}
                </select>
              </div>

              {PERMISSION_PROFILES.map(profile => {
                const active = selectedProfileId === profile.id;
                return (
                  <button key={profile.id} onClick={() => !profile.locked && applyProfile(profile.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '11px 12px', borderRadius: 12, marginBottom: 5,
                      border: active ? `2px solid ${profile.color}` : '2px solid transparent',
                      background: active ? profile.bg : '#fff',
                      cursor: profile.locked ? 'default' : 'pointer',
                      transition: 'all 0.12s',
                      boxShadow: active ? `0 0 0 3px ${profile.color}15` : 'none',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                      <span style={{ fontSize: 15 }}>{profile.emoji}</span>
                      <span style={{ fontWeight: 700, fontSize: 12, color: active ? profile.color : 'var(--navy)', flex: 1 }}>{profile.label}</span>
                      <span style={{ fontSize: 9, background: active ? profile.color : '#F3F4F6', color: active ? '#fff' : '#9CA3AF', padding: '1px 6px', borderRadius: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {profile.tagline}
                      </span>
                      {profile.locked && <Lock size={10} color="#D1D5DB" />}
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.4 }}>{profile.desc}</div>
                    {active && profile.highlight && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 7 }}>
                        {profile.highlight.map(h => (
                          <span key={h} style={{ fontSize: 9, background: profile.color + '18', color: profile.color, padding: '1px 7px', borderRadius: 8, fontWeight: 700 }}>{h}</span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right — Module matrix */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Module Permissions</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {ACCESS_LEVELS.map(al => (
                  <div key={al.key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: al.color }} />
                    <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{al.short}</span>
                  </div>
                ))}
              </div>
            </div>

            {MODULE_GROUPS.map(group => {
              const groupModules = MODULES.filter(m => m.group === group);
              const isExp = expandedGroups[group];
              return (
                <div key={group} style={{ marginBottom: 14 }}>
                  <button onClick={() => setExpandedGroups(g => ({ ...g, [group]: !g[group] }))}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: '#F9FAFB', borderRadius: 9, border: 'none', cursor: 'pointer', marginBottom: isExp ? 8 : 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', flex: 1, textAlign: 'left' }}>{group}</span>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                      {groupModules.filter(m => perms[m.key] && perms[m.key] !== 'none').length}/{groupModules.length} active
                    </span>
                    <ChevronRight size={12} color="#9CA3AF" style={{ transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                  </button>

                  {isExp && groupModules.map(mod => {
                    const lvl = perms[mod.key] || 'none';
                    const al = getAccessMeta(lvl);
                    return (
                      <div key={mod.key} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                        borderRadius: 10, marginBottom: 4,
                        background: lvl !== 'none' ? al.bg : '#fff',
                        border: `1px solid ${lvl !== 'none' ? al.border : '#F3F4F6'}`,
                        transition: 'all 0.12s',
                      }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{mod.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{mod.label}</div>
                          <div style={{ fontSize: 10, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.desc}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                          {ACCESS_LEVELS.map(level => {
                            const isActive = lvl === level.key;
                            return (
                              <button key={level.key} onClick={() => setModulePerm(mod.key, level.key)}
                                title={`${level.label}: ${level.desc}`}
                                style={{
                                  padding: '3px 9px', borderRadius: 20,
                                  border: `1.5px solid ${isActive ? level.color : '#E5E7EB'}`,
                                  background: isActive ? level.color : '#fff',
                                  color: isActive ? '#fff' : '#9CA3AF',
                                  fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.1s',
                                }}>
                                {level.short}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Access level guide */}
            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '12px 14px', marginTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Access Level Guide</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ACCESS_LEVELS.map(al => (
                  <div key={al.key} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 36, height: 18, borderRadius: 10, background: al.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{al.short}</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>{al.label}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.4 }}>{al.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA', flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            {selectedProfileId !== 'custom'
              ? <span>Profile: <strong style={{ color: selectedProfile?.color }}>{selectedProfile?.emoji} {selectedProfile?.label}</strong></span>
              : <span style={{ color: '#D97706' }}>⚙️ Custom module overrides</span>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <button onClick={save} disabled={saving} style={{
              padding: '9px 24px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,var(--navy) 0%,#1B3A6B 100%)',
              color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'wait' : 'pointer',
            }}>
              {saving ? 'Saving…' : '✓ Save Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── User card ─────────────────────────────────────────────────────────────────
function UserCard({ u, currentUser, canManage, allUsers, onRefresh, showBranch = false, isHeadCard = false }) {
  const [showPermEditor, setShowPermEditor] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [roleChanging, setRoleChanging] = useState(false);

  const isSelf = u.id === currentUser?.id;
  const canEdit = canManage && !isSelf && u.role !== 'OWNER';
  const roleMeta = ROLE_META[u.role] || ROLE_META.STAFF;

  const effectivePerms = resolvePermissions(u);
  const activeModules = MODULES.filter(m => effectivePerms[m.key] && effectivePerms[m.key] !== 'none');
  const profileId = u.permissionProfile || PERMISSION_PROFILES.find(p => p.systemRole === u.role)?.id;
  const profile = getProfile(profileId);
  const hasCustom = u.permissionProfile === 'custom' || (u.customPermissions && Object.keys(u.customPermissions || {}).length > 0);

  const fmtLogin = (d) => {
    if (!d) return 'Never';
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 2) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const dd = Math.floor(h / 24);
    if (dd < 7) return `${dd}d ago`;
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const handleRoleChange = async (role) => {
    setRoleChanging(true);
    try { await updateUser(u.id, { role }); toast.success(`${u.name} → ${ROLE_META[role]?.label}`); onRefresh(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setRoleChanging(false); }
  };

  const handleToggle = async () => {
    try { await updateUser(u.id, { isActive: !u.isActive }); onRefresh(); setConfirmDeactivate(false); toast.success(u.isActive ? `${u.name} deactivated` : `${u.name} restored`); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${isHeadCard ? roleMeta.color + '40' : '#E5E7EB'}`, overflow: 'hidden', opacity: u.isActive ? 1 : 0.6, boxShadow: isHeadCard ? `0 2px 10px ${roleMeta.color}18` : '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = isHeadCard ? `0 4px 20px ${roleMeta.color}25` : '0 4px 20px rgba(0,0,0,0.09)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = isHeadCard ? `0 2px 10px ${roleMeta.color}18` : '0 1px 4px rgba(0,0,0,0.04)'; }}>
        {/* Role color bar */}
        <div style={{ height: isHeadCard ? 5 : 4, background: `linear-gradient(90deg,${roleMeta.color},${roleMeta.color}55)` }} />

        <div style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{ width: 46, height: 46, borderRadius: 12, background: roleMeta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: roleMeta.color, flexShrink: 0, border: `2px solid ${roleMeta.color}35` }}>
              {u.name?.[0]?.toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name + status badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 3 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy)' }}>{u.name}</span>
                {isSelf && <span style={{ fontSize: 10, background: 'var(--navy)', color: '#fff', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>You</span>}
                {!u.isActive && <span style={{ fontSize: 10, background: '#FEF2F2', color: '#DC2626', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>Inactive</span>}
                {hasCustom && <span style={{ fontSize: 10, background: '#FFF7ED', color: '#C2410C', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>Custom</span>}
                <RoleBadge role={u.role} />
              </div>

              {/* Syllabrix ID + email row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                {u.syllabrixId && (
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(31,184,214,0.85)', fontWeight: 700, letterSpacing: '0.06em', background: 'rgba(31,184,214,0.08)', padding: '2px 7px', borderRadius: 6, border: '1px solid rgba(31,184,214,0.15)' }}>
                    {u.syllabrixId}
                  </span>
                )}
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{u.email}</span>
              </div>

              {/* Branch badge when shown in flat/search view */}
              {showBranch && u.branch && (
                <div style={{ marginBottom: 5 }}>
                  <span style={{ fontSize: 10, background: '#EFF6FF', color: '#2563EB', padding: '2px 9px', borderRadius: 6, fontWeight: 700, border: '1px solid #BFDBFE' }}>
                    🏪 {u.branch.name}{u.branch.syllabrixId ? ` · ${u.branch.syllabrixId}` : ''}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {profile && (
                  <span style={{ fontSize: 10, background: profile.bg, color: profile.color, border: `1px solid ${profile.border}`, padding: '2px 9px', borderRadius: 20, fontWeight: 700 }}>
                    {profile.emoji} {profile.label}
                  </span>
                )}
                <span style={{ fontSize: 10, color: '#C4C4C4' }}>last login {fmtLogin(u.lastLogin)}</span>
              </div>
            </div>

            {/* Action buttons */}
            {canEdit && (
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                <button onClick={() => setShowPermEditor(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--navy)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  <Shield size={11} /> Permissions
                </button>
                {currentUser?.role === 'OWNER' && (u.isActive
                  ? <button onClick={() => setConfirmDeactivate(true)} style={{ padding: '6px 9px', borderRadius: 8, border: '1.5px solid #FCA5A5', background: '#fff', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={11} /></button>
                  : <button onClick={handleToggle} style={{ padding: '6px 9px', borderRadius: 8, border: '1.5px solid #86EFAC', background: '#fff', color: '#16A34A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700 }}><CheckCircle size={11} /> Restore</button>
                )}
              </div>
            )}
          </div>

          {/* Active module chips */}
          {activeModules.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {activeModules.slice(0, 7).map(m => {
                const lvl = effectivePerms[m.key];
                const al = getAccessMeta(lvl);
                return (
                  <span key={m.key} style={{ fontSize: 10, background: al.bg, color: al.color, border: `1px solid ${al.border}`, padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>
                    {m.icon} {m.label}
                  </span>
                );
              })}
              {activeModules.length > 7 && <span style={{ fontSize: 10, background: '#F3F4F6', color: '#9CA3AF', padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>+{activeModules.length - 7} more</span>}
            </div>
          )}

          {/* Role selector */}
          {canEdit && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, whiteSpace: 'nowrap' }}>Base role:</span>
              <select value={u.role} onChange={e => handleRoleChange(e.target.value)} disabled={roleChanging}
                style={{ padding: '4px 9px', border: `1.5px solid ${roleMeta.color}40`, borderRadius: 7, fontSize: 11, background: roleMeta.bg, color: roleMeta.color, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                {ROLES.filter(r => r !== 'OWNER').map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {showPermEditor && <PermissionEditorModal targetUser={u} allUsers={allUsers} onClose={() => setShowPermEditor(false)} onSaved={() => { setShowPermEditor(false); onRefresh(); }} />}

      {confirmDeactivate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>Remove access?</h3>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}><strong>{u.name}</strong> will be unable to log in until restored. All their data is preserved.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setConfirmDeactivate(false)}>Cancel</Button>
              <button onClick={handleToggle} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: '#DC2626', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Yes, remove access</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Branch section (hierarchy view) ──────────────────────────────────────────
const ROLE_TIER_ORDER = { MANAGER: 0, ACCOUNTANT: 1, CASHIER: 2, STAFF: 3 };

function BranchSection({ branch, users, currentUser, canManage, allUsers, onRefresh, onAddMember }) {
  const [collapsed, setCollapsed] = useState(false);

  const sorted = [...users].sort((a, b) => (ROLE_TIER_ORDER[a.role] ?? 9) - (ROLE_TIER_ORDER[b.role] ?? 9));
  const manager = sorted.find(u => u.role === 'MANAGER');
  const rest = sorted.filter(u => u.role !== 'MANAGER');

  return (
    <div style={{ marginBottom: 18, border: '1.5px solid #E5E7EB', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      {/* Branch header */}
      <div
        style={{ background: branch.isHQ ? 'linear-gradient(135deg,#0F2349 0%,#1B3A6B 100%)' : 'linear-gradient(135deg,#F8FAFC 0%,#EFF6FF 100%)', padding: '14px 20px', cursor: 'pointer', borderBottom: collapsed ? 'none' : `1.5px solid ${branch.isHQ ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}` }}
        onClick={() => setCollapsed(c => !c)}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Branch icon */}
            <div style={{ width: 40, height: 40, borderRadius: 12, background: branch.isHQ ? 'rgba(255,255,255,0.12)' : '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {branch.isHQ ? '🏢' : '🏪'}
            </div>
            <div>
              {/* Branch name + tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: branch.isHQ ? '#fff' : 'var(--navy)' }}>{branch.name}</span>
                <span style={{ fontSize: 10, background: branch.isHQ ? 'rgba(255,255,255,0.15)' : '#F3F4F6', color: branch.isHQ ? 'rgba(255,255,255,0.7)' : '#6B7280', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>{branch.code}</span>
                {branch.isHQ && <span style={{ fontSize: 10, background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>HQ</span>}
              </div>
              {/* Branch ID + manager + count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                {branch.syllabrixId && (
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: branch.isHQ ? 'rgba(31,184,214,0.9)' : 'rgba(31,184,214,0.75)', fontWeight: 700, letterSpacing: '0.06em' }}>{branch.syllabrixId}</span>
                )}
                {manager ? (
                  <span style={{ fontSize: 11, color: branch.isHQ ? 'rgba(255,255,255,0.55)' : '#6B7280' }}>
                    Manager: <strong style={{ color: branch.isHQ ? 'rgba(255,255,255,0.85)' : 'var(--navy)' }}>{manager.name}</strong>
                    {manager.syllabrixId && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, marginLeft: 5, color: branch.isHQ ? 'rgba(31,184,214,0.7)' : 'rgba(31,184,214,0.6)' }}>{manager.syllabrixId}</span>}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: branch.isHQ ? 'rgba(255,255,255,0.4)' : '#D1D5DB', fontStyle: 'italic' }}>No manager assigned</span>
                )}
                <span style={{ fontSize: 11, color: branch.isHQ ? 'rgba(255,255,255,0.4)' : '#9CA3AF' }}>{users.length} member{users.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {canManage && (
              <button
                onClick={e => { e.stopPropagation(); onAddMember(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${branch.isHQ ? 'rgba(255,255,255,0.2)' : '#E5E7EB'}`, background: branch.isHQ ? 'rgba(255,255,255,0.08)' : '#fff', color: branch.isHQ ? '#fff' : 'var(--navy)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={12} /> Add
              </button>
            )}
            <ChevronDown size={16} color={branch.isHQ ? 'rgba(255,255,255,0.5)' : '#9CA3AF'} style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* Members body */}
      {!collapsed && (
        <div style={{ padding: users.length > 0 ? '16px 18px' : 0, background: '#FAFBFC' }}>
          {users.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>No staff assigned to this branch yet.</div>
              {canManage && (
                <button onClick={onAddMember} style={{ fontSize: 13, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>+ Add first member</button>
              )}
            </div>
          ) : (
            <>
              {/* Manager — full width, highlighted */}
              {manager && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#0891B2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 20, height: 2, background: '#0891B2', borderRadius: 4, display: 'inline-block' }} />
                    Branch Manager
                  </div>
                  <UserCard u={manager} currentUser={currentUser} canManage={canManage} allUsers={allUsers} onRefresh={onRefresh} isHeadCard />
                </div>
              )}

              {/* Staff grid */}
              {rest.length > 0 && (
                <div>
                  {manager && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 20, height: 2, background: '#E5E7EB', borderRadius: 4, display: 'inline-block' }} />
                      Staff
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 10 }}>
                    {rest.map(u => <UserCard key={u.id} u={u} currentUser={currentUser} canManage={canManage} allUsers={allUsers} onRefresh={onRefresh} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Role-tier view (single-branch businesses) ─────────────────────────────────
function RoleTierView({ users, currentUser, canManage, allUsers, onRefresh }) {
  const tierOrder = ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'STAFF'];
  const tiers = tierOrder.filter(role => users.some(u => u.role === role));

  return (
    <div>
      {tiers.map((role, idx) => {
        const tierUsers = users.filter(u => u.role === role);
        const meta = ROLE_META[role];
        const isLeadership = ['OWNER', 'ADMIN'].includes(role);
        return (
          <div key={role} style={{ marginBottom: 22 }}>
            {/* Tier label with connector line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {idx > 0 && <div style={{ width: 2, height: 16, background: '#E5E7EB', marginLeft: 11, position: 'absolute', marginTop: -18, borderRadius: 2 }} />}
              <div style={{ width: 24, height: 24, borderRadius: 8, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{meta.label}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>{meta.desc.split('.')[0]}</span>
              </div>
              <span style={{ fontSize: 11, color: '#D1D5DB', marginLeft: 'auto' }}>{tierUsers.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isLeadership ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: 10 }}>
              {tierUsers.map(u => <UserCard key={u.id} u={u} currentUser={currentUser} canManage={canManage} allUsers={allUsers} onRefresh={onRefresh} isHeadCard={isLeadership} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── TeamTab ───────────────────────────────────────────────────────────────────
function TeamTab({ currentUser }) {
  const { isMobile } = useBreakpoint();
  const { branches, hasBranches } = useBranch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addToBranchId, setAddToBranchId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  const canManage = ['OWNER', 'ADMIN'].includes(currentUser?.role);

  const load = async () => {
    setLoading(true);
    try { const r = await getUsers(); setUsers(r.data.data || []); }
    catch { toast.error('Failed to load team'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const isSearching = !!(search || filterRole !== 'ALL');

  const filtered = users.filter(u => {
    const matchSearch = !search
      || u.name?.toLowerCase().includes(search.toLowerCase())
      || u.email?.toLowerCase().includes(search.toLowerCase())
      || u.syllabrixId?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // Hierarchy grouping
  const topLevel = users.filter(u => u.role === 'OWNER' || u.role === 'ADMIN');
  const byBranch = {};
  const unassigned = [];
  for (const u of users) {
    if (u.role === 'OWNER' || u.role === 'ADMIN') continue;
    if (u.branchId) {
      (byBranch[u.branchId] = byBranch[u.branchId] || []).push(u);
    } else {
      unassigned.push(u);
    }
  }

  const stats = [
    { label: 'Total Members', value: users.length,                             color: 'var(--navy)', bg: '#F0F4FF' },
    { label: 'Active',        value: users.filter(u => u.isActive).length,     color: '#10B981',     bg: '#F0FDF4' },
    { label: hasBranches ? 'Branches' : 'Custom Perms',
      value: hasBranches ? branches.length : users.filter(u => u.permissionProfile === 'custom' || Object.keys(u.customPermissions || {}).length > 0).length,
      color: hasBranches ? '#0891B2' : '#C2410C',
      bg: hasBranches ? '#ECFEFF' : '#FFF7ED' },
    { label: 'Roles in Use',  value: [...new Set(users.map(u => u.role))].length, color: '#7C3AED', bg: '#F5F3FF' },
  ];

  const openAdd = (branchId = null) => { setAddToBranchId(branchId); setShowAdd(true); };

  return (
    <div style={{ maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>
            {hasBranches ? 'Organisation Hierarchy' : 'Team & Access Control'}
          </h3>
          <p style={{ fontSize: 13, color: '#6B7280' }}>
            {hasBranches
              ? 'Full team across all branches — ownership, management, and staff in one view.'
              : 'Manage team members and their permissions. Click Permissions on any card to configure module access.'}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => openAdd(null)} style={{ flexShrink: 0 }}>
            <Plus size={15} style={{ marginRight: 6 }} />Add member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '14px 18px', border: `1px solid ${s.color}18` }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or Syllabrix ID…"
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff' }}
        />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          style={{ padding: '9px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, background: '#fff', cursor: 'pointer', outline: 'none' }}>
          <option value="ALL">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label || r}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: 14 }}>Loading team…</div>
      ) : isSearching ? (
        filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: 14 }}>No members match your search.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
            {filtered.map(u => <UserCard key={u.id} u={u} currentUser={currentUser} canManage={canManage} allUsers={users} onRefresh={load} showBranch={hasBranches} />)}
          </div>
        )
      ) : hasBranches ? (
        <>
          {/* 👑 Business leadership — Owner & Admin */}
          {topLevel.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👑</div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)' }}>Business Ownership</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 10 }}>Full access across all branches and settings</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
                {topLevel.map(u => <UserCard key={u.id} u={u} currentUser={currentUser} canManage={canManage} allUsers={users} onRefresh={load} isHeadCard />)}
              </div>
            </div>
          )}

          {/* Branch sections */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏪</div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)' }}>Branch Network</span>
              <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 10 }}>Managers and staff organised per branch</span>
            </div>
          </div>
          {branches.map(branch => (
            <BranchSection
              key={branch.id}
              branch={branch}
              users={byBranch[branch.id] || []}
              currentUser={currentUser}
              canManage={canManage}
              allUsers={users}
              onRefresh={load}
              onAddMember={() => openAdd(branch.id)}
            />
          ))}

          {/* Unassigned members */}
          {unassigned.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F9FAFB', border: '1.5px dashed #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#6B7280' }}>Not assigned to a branch</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 10 }}>{unassigned.length} member{unassigned.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
                {unassigned.map(u => <UserCard key={u.id} u={u} currentUser={currentUser} canManage={canManage} allUsers={users} onRefresh={load} />)}
              </div>
            </div>
          )}
        </>
      ) : (
        <RoleTierView users={users} currentUser={currentUser} canManage={canManage} allUsers={users} onRefresh={load} />
      )}

      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); load(); }}
          defaultBranchId={addToBranchId}
          branches={branches}
          hasBranches={hasBranches}
        />
      )}

      {canManage && <div style={{ marginTop: 32 }}><CustomRoleRequest /></div>}
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

// ─── Tax Rates Tab ────────────────────────────────────────────────────────

const STANDARD_SLABS = [
  { name: 'GST 0%',  rate: 0,  cgst: 0,   sgst: 0,   igst: 0,  isGst: true },
  { name: 'GST 5%',  rate: 5,  cgst: 2.5, sgst: 2.5, igst: 5,  isGst: true },
  { name: 'GST 12%', rate: 12, cgst: 6,   sgst: 6,   igst: 12, isGst: true },
  { name: 'GST 18%', rate: 18, cgst: 9,   sgst: 9,   igst: 18, isGst: true },
  { name: 'GST 28%', rate: 28, cgst: 14,  sgst: 14,  igst: 28, isGst: true },
];

function TaxRatesTab() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState({ name: '', rate: '' });
  const [adding, setAdding] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const load = async () => {
    setLoading(true);
    try { const r = await getTaxRates(); setRates(r.data.data || []); }
    catch { toast.error('Failed to load tax rates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const seedStandard = async () => {
    setSeeding(true);
    let created = 0;
    for (const slab of STANDARD_SLABS) {
      const exists = rates.some(r => r.rate === slab.rate);
      if (exists) continue;
      try { await createTaxRate(slab); created++; } catch {}
    }
    toast.success(created > 0 ? `Added ${created} standard GST slabs` : 'All standard slabs already exist');
    load();
    setSeeding(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const rate = parseFloat(form.rate);
    if (!form.name.trim() || isNaN(rate)) return toast.error('Name and rate are required');
    setAdding(true);
    try {
      const half = rate / 2;
      await createTaxRate({ name: form.name.trim(), rate, cgst: half, sgst: half, igst: rate, isGst: true });
      toast.success('Tax rate added');
      setForm({ name: '', rate: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTaxRate(id);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete — rate is in use by products');
    }
  };

  const RATE_COLORS = { 0: '#6B7280', 5: '#16A34A', 12: '#2563EB', 18: '#D97706', 28: '#DC2626' };

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>GST / Tax Rates</h3>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Assign these to products in Inventory. Used on receipts and invoices.</p>
        </div>
        <button
          onClick={seedStandard}
          disabled={seeding}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid var(--navy)', background: '#fff', color: 'var(--navy)', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: seeding ? 0.6 : 1 }}
        >
          {seeding ? 'Adding…' : '+ Add Standard Slabs (0–28%)'}
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#9CA3AF', textAlign: 'center', padding: 32 }}>Loading…</div>
      ) : rates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', border: '2px dashed var(--border)', borderRadius: 12 }}>
          <Percent size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>No tax rates yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Click "Add Standard Slabs" to add Indian GST rates instantly</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {rates.map(r => {
            const color = RATE_COLORS[r.rate] || '#374151';
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color }}>{r.rate}%</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)' }}>{r.name}</div>
                  {r.rate > 0 && (
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                      CGST {r.cgst}% + SGST {r.sgst}%  ·  IGST {r.igst}%
                    </div>
                  )}
                </div>
                <button onClick={() => handleDelete(r.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 4, display: 'flex', opacity: 0.6 }}>
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add custom rate */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>Add custom rate</h4>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 2 }}>
            <Input label="Name" value={form.name} onChange={set('name')} placeholder="e.g. GST 3% (Gold)" />
          </div>
          <div style={{ flex: 1 }}>
            <Input label="Rate %" type="number" min="0" max="100" step="0.5" value={form.rate} onChange={set('rate')} placeholder="3" />
          </div>
          <Button type="submit" loading={adding} style={{ marginBottom: 1 }}>Add</Button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Settings Page ────────────────────────────────────────────────────

// ─── Automation Tab ──────────────────────────────────────────────────────────

const TOGGLE_GROUPS = [
  {
    title: 'POS & Sales',
    items: [
      { key: 'autoWhatsApp', label: 'Auto-send WhatsApp receipt', desc: 'Automatically send the receipt to customer via WhatsApp after every sale (if phone is saved).' },
      { key: 'autoPrint', label: 'Auto-print receipt', desc: 'Automatically open the print dialog after every sale completes.' },
    ],
  },
  {
    title: 'Customer Reminders',
    items: [
      { key: 'feeReminders', label: 'Fee due reminders', desc: 'Send WhatsApp reminder to students/parents when fee is due or overdue.' },
      { key: 'appointmentReminders', label: 'Appointment reminders', desc: 'Remind customers 24 hours before their scheduled appointment.' },
      { key: 'rentReminders', label: 'Rent due reminders', desc: 'Send monthly rent due alert to tenants on the set day.' },
    ],
  },
  {
    title: 'Owner Alerts',
    items: [
      { key: 'whatsappDigest', label: 'Nightly WhatsApp digest', desc: 'Receive today\'s sales, expenses, and net P&L on WhatsApp every evening at 8:30 PM IST. Uses your business phone number.' },
      { key: 'dailySummary', label: 'Dashboard daily summary', desc: 'Show a daily sales summary card on your Dashboard with one-click WhatsApp share.' },
      { key: 'lowStockAlerts', label: 'Low stock alerts', desc: 'Flag products below the stock threshold on your Dashboard after each sale.' },
    ],
  },
];

function AutomationTab() {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    getAutomationConfig().then(r => setConfig(r.data.data || {})).catch(() => setConfig({}));
  }, []);

  const toggle = (key) => setConfig(c => ({ ...c, [key]: !c[key] }));
  const setVal = (key, val) => setConfig(c => ({ ...c, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      await saveAutomationConfig(config);
      toast.success('Automation settings saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const testDigest = async () => {
    setTestSending(true);
    try {
      const r = await sendDailyDigest();
      toast.success(`Digest sent to ${r.data?.data?.phone || 'your business phone'}!`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send digest. Check your WhatsApp config.');
    } finally { setTestSending(false); }
  };

  const loadPreview = async () => {
    try {
      const r = await getDigestPreview();
      setPreview(r.data?.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load preview');
    }
  };

  if (!config) return <div style={{ color: '#9CA3AF', padding: 20 }}>Loading...</div>;

  const Toggle = ({ k }) => (
    <button onClick={() => toggle(k)} style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
      background: config[k] ? '#10B981' : '#D1D5DB', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 2, left: config[k] ? 22 : 2, width: 20, height: 20,
        background: '#fff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Automation & Smart Alerts</h3>
        <p style={{ fontSize: 13, color: '#6B7280' }}>Toggle which alerts show on your Dashboard. Each one has a one-click WhatsApp button — no API, no cost, works instantly.</p>
      </div>

      {TOGGLE_GROUPS.map(group => (
        <div key={group.title}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{group.title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {group.items.map((item, i) => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: '#fff', borderBottom: i < group.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{item.desc}</div>
                </div>
                <Toggle k={item.key} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Advanced settings */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Advanced Settings</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '18px', borderRadius: 12, border: '1px solid var(--border)', background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Fee reminder days before due</label>
              <input type="number" min={0} max={30} value={config.feeReminderDaysBefore ?? 3}
                onChange={e => setVal('feeReminderDaysBefore', Number(e.target.value))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Low stock threshold (units)</label>
              <input type="number" min={0} value={config.lowStockThreshold ?? 5}
                onChange={e => setVal('lowStockThreshold', Number(e.target.value))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Appointment reminder (hours before)</label>
              <input type="number" min={1} max={72} value={config.appointmentReminderHours ?? 24}
                onChange={e => setVal('appointmentReminderHours', Number(e.target.value))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Rent reminder day of month</label>
              <input type="number" min={1} max={28} value={config.rentReminderDay ?? 1}
                onChange={e => setVal('rentReminderDay', Number(e.target.value))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Owner WhatsApp for alerts & daily summary (leave blank to use business phone)</label>
            <input type="tel" value={config.summaryPhone || ''}
              onChange={e => setVal('summaryPhone', e.target.value)}
              placeholder="9876543210"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13 }} />
          </div>
        </div>
      </div>

      {/* WhatsApp Digest Preview */}
      {preview && (
        <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>Digest Preview — will send to {preview.phone}</div>
            <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18 }}>✕</button>
          </div>
          <pre style={{ fontFamily: 'inherit', fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{preview.message}</pre>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={save} disabled={saving}
          style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--navy)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        <button onClick={loadPreview}
          style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #D1D5DB', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Send size={14} style={{ color: '#10B981' }} />Preview Digest
        </button>
        <button onClick={testDigest} disabled={testSending}
          style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #A7F3D0', background: '#ECFDF5', color: '#059669', fontSize: 14, fontWeight: 600, cursor: testSending ? 'not-allowed' : 'pointer', opacity: testSending ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Send size={14} />{testSending ? 'Sending…' : 'Send Test Digest Now'}
        </button>
      </div>
    </div>
  );
}

// ─── Branches Tab (OWNER only) ───────────────────────────────────────────────
function BranchesTab() {
  const { branches, reloadBranches } = useBranch();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const emptyForm = { name: '', code: '', address: '', city: '', phone: '', gstin: '' };
  const [form, setForm] = useState(emptyForm);

  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) return toast.error('Branch name and code are required');
    setLoading(true);
    try {
      if (editing) {
        await updateBranch(editing.id, form);
        toast.success('Branch updated');
      } else {
        await createBranch(form);
        toast.success('Branch created');
      }
      await reloadBranches();
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save branch');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (b) => {
    setEditing(b);
    setForm({ name: b.name, code: b.code, address: b.address || '', city: b.city || '', phone: b.phone || '', gstin: b.gstin || '' });
    setShowForm(true);
  };

  const handleToggle = async (b) => {
    try {
      await toggleBranch(b.id);
      await reloadBranches();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 3, fontSize: 16 }}>Branch Network</h3>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Manage store locations and assign staff per branch.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(s => !s); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          <Plus size={14} /> Add Branch
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#F9FAFB', borderRadius: 12, border: '1px solid var(--border)', padding: '18px 20px', marginBottom: 20 }}>
          <h4 style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 16, fontSize: 15 }}>
            {editing ? `Edit — ${editing.name}` : 'New Branch'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <Input label="Branch Name *" value={form.name} onChange={f('name')} placeholder="e.g. Station Road" />
            <Input label="Short Code *" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase().slice(0, 6) }))} placeholder="STRD" />
            <Input label="City" value={form.city} onChange={f('city')} placeholder="Indore" />
            <Input label="Phone" value={form.phone} onChange={f('phone')} placeholder="9876500000" />
          </div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Address" value={form.address} onChange={f('address')} placeholder="Shop no., Street, Area" />
            <Input label="GSTIN (optional)" value={form.gstin} onChange={e => setForm(p => ({ ...p, gstin: e.target.value.toUpperCase() }))} placeholder="23AABCS1234A1Z7" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={handleSubmit} disabled={loading} style={{ padding: '9px 20px', borderRadius: 8, background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving…' : editing ? 'Update' : 'Create Branch'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }} style={{ padding: '9px 16px', borderRadius: 8, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {branches.map(b => (
          <div key={b.id} style={{ background: b.isActive ? '#fff' : '#FAFAFA', border: `1px solid ${b.isActive ? 'var(--border)' : '#E5E7EB'}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: b.isActive ? 1 : 0.65 }}>
            <div style={{ width: 38, height: 38, background: b.isHQ ? 'var(--navy)' : '#F3F4F6', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GitBranch size={16} color={b.isHQ ? '#27DCFF' : '#9CA3AF'} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
                <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>{b.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#F3F4F6', color: '#6B7280', fontFamily: 'var(--font-mono)' }}>{b.code}</span>
                {b.isHQ && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'rgba(39,220,255,0.1)', color: 'var(--cyan)' }}>HQ</span>}
                {!b.isActive && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#FEE2E2', color: '#DC2626' }}>Inactive</span>}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {b.city && <span>{b.city}</span>}
                {b.phone && <span>{b.phone}</span>}
                {b.gstin && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{b.gstin}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => handleEdit(b)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Edit2 size={11} /> Edit
              </button>
              {!b.isHQ && (
                <button onClick={() => handleToggle(b)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: b.isActive ? '#DC2626' : '#059669' }}>
                  {b.isActive ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          </div>
        ))}
        {branches.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF', fontSize: 13 }}>
            <GitBranch size={32} style={{ margin: '0 auto 12px', display: 'block', color: '#D1D5DB' }} />
            No branches yet. Click "Add Branch" to create your first location.
          </div>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { id: 'profile',    label: 'Business Profile', desc: 'Logo, address, receipt config',   icon: Building2    },
  { id: 'branches',   label: 'Branches',         desc: 'Locations & team structure',      icon: GitBranch,   ownerOnly: true },
  { id: 'features',   label: 'Module Features',  desc: 'Enable or restrict features',     icon: ToggleRight, ownerOnly: true },
  { id: 'taxes',      label: 'GST / Tax Rates',  desc: 'Tax slabs for invoicing',         icon: Percent      },
  { id: 'automation', label: 'Automation',       desc: 'Smart alerts & daily digest',     icon: Zap          },
  { id: 'team',       label: 'Team',             desc: 'Staff, roles & permissions',      icon: Users        },
  { id: 'security',   label: 'Security',         desc: 'Password & account security',     icon: Shield       },
];

const PLAN_COLORS = {
  STARTER:    { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  GROWTH:     { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  PRO:        { bg: '#FAF5FF', text: '#7C3AED', border: '#E9D5FF' },
  ENTERPRISE: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
};

export default function Settings() {
  const { isMobile } = useBreakpoint();
  const { user, tenant, refreshMe } = useAuth();
  const [tab, setTab] = useState('profile');
  const visibleTabs = TABS.filter(t => !t.ownerOnly || user?.role === 'OWNER');
  const [profile, setProfile] = useState(tenant || null);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    getTenantProfile()
      .then(r => { setProfile(r.data.data || r.data); setProfileError(false); })
      .catch(() => { setProfileError(true); toast.error('Failed to load business profile'); });
  }, []);

  const handleProfileSaved = async () => {
    await refreshMe();
    const r = await getTenantProfile();
    setProfile(r.data.data || r.data);
  };

  const activeTab  = TABS.find(t => t.id === tab);
  const planColor  = PLAN_COLORS[tenant?.plan] || PLAN_COLORS.STARTER;
  const isFeatures = tab === 'features';

  return (
    <div style={{ padding: isMobile ? '16px' : '28px 32px', maxWidth: 1120, margin: '0 auto' }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24, flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: isMobile ? 22 : 26, color: 'var(--navy)',
            letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2,
          }}>
            Settings
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>
            Configure your business, team, and module features
          </p>
        </div>

        {tenant && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1px solid #E5E7EB',
            borderRadius: 10, padding: '8px 14px', flexShrink: 0,
          }}>
            {profile?.logoUrl ? (
              <img src={profile.logoUrl} alt="" style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 4 }} />
            ) : (
              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={12} color="#fff" />
              </div>
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tenant.name}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
              background: planColor.bg, color: planColor.text,
              border: `1px solid ${planColor.border}`,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              {tenant.plan}
            </span>
          </div>
        )}
      </div>

      {/* ── Mobile: horizontal scrollable tab strip ───────────────────────── */}
      {isMobile && (
        <div style={{ overflowX: 'auto', marginBottom: 14, paddingBottom: 2 }}>
          <div style={{
            display: 'flex', gap: 4,
            background: '#F3F4F6', borderRadius: 12, padding: 4,
            width: 'fit-content', minWidth: 'max-content',
          }}>
            {visibleTabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 9,
                border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                background: tab === t.id ? 'var(--navy)' : 'transparent',
                color:      tab === t.id ? '#fff' : '#6B7280',
                transition: 'all 0.15s',
              }}>
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Desktop: two-column layout ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* Left nav sidebar */}
        {!isMobile && (
          <nav style={{
            width: 210, flexShrink: 0,
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            padding: '10px 8px',
            position: 'sticky', top: 16,
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}>
            {visibleTabs.map(t => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', textAlign: 'left',
                    padding: '9px 10px', borderRadius: 10, marginBottom: 2,
                    border: 'none', cursor: 'pointer',
                    background: active ? 'var(--navy)' : 'transparent',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F3F4F6'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Icon box */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: active ? 'rgba(255,255,255,0.15)' : '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.12s',
                  }}>
                    <t.icon size={15} color={active ? '#fff' : '#6B7280'} />
                  </div>

                  {/* Label + desc */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: active ? 700 : 500, lineHeight: 1.3,
                      color: active ? '#fff' : 'var(--navy)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {t.label}
                    </div>
                    <div style={{
                      fontSize: 10, color: active ? 'rgba(255,255,255,0.55)' : '#9CA3AF',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginTop: 1,
                    }}>
                      {t.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        )}

        {/* Content card */}
        <div style={{
          flex: 1, minWidth: 0,
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        }}>

          {/* Tab header strip — shown on all tabs except Module Features (it has its own header) */}
          {activeTab && !isFeatures && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 28px',
              borderBottom: '1px solid #F0F0F0',
              background: 'linear-gradient(to right, #FAFAFA, #fff)',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: 'var(--navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(15,35,73,0.18)',
              }}>
                <activeTab.icon size={17} color="#fff" />
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800,
                  color: 'var(--navy)', lineHeight: 1.2,
                }}>
                  {activeTab.label}
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                  {activeTab.desc}
                </div>
              </div>
            </div>
          )}

          {/* Tab body */}
          <div style={{ padding: isFeatures ? 0 : isMobile ? '20px 16px' : '28px 32px' }}>

            {tab === 'profile' && (
              profile
                ? <ProfileTab tenant={profile} onSaved={handleProfileSaved} />
                : profileError
                  ? (
                    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                      <AlertCircle size={36} color="#EF4444" style={{ margin: '0 auto 14px', display: 'block' }} />
                      <div style={{ color: '#374151', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                        Could not load business profile
                      </div>
                      <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>
                        Check your connection and try again.
                      </div>
                      <button
                        onClick={() => {
                          setProfileError(false);
                          getTenantProfile()
                            .then(r => setProfile(r.data.data || r.data))
                            .catch(() => setProfileError(true));
                        }}
                        style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                      >
                        Retry
                      </button>
                    </div>
                  )
                  : (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: 'var(--cyan)', animation: 'spin 0.7s linear infinite' }} />
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                  )
            )}

            {tab === 'branches'   && <BranchesTab />}
            {tab === 'features'   && <ModuleFeatureSettings />}
            {tab === 'taxes'      && <TaxRatesTab />}
            {tab === 'automation' && <AutomationTab />}
            {tab === 'team'       && <TeamTab currentUser={user} />}
            {tab === 'security'   && <SecurityTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
