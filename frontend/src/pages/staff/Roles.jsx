import { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Trash2, Edit2, ChevronDown, ChevronRight, Users, Lock, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getRoles, createRole, updateRole, deleteRole } from '../../api/roles';
import Button from '../../components/ui/Button';

// ── Module + feature registry (mirrors backend moduleRegistry.js) ─────────────
const MODULE_REGISTRY = [
  { key: 'invoicing',      label: 'Invoicing',       features: ['invoices','creditNotes','quotations','recurringInvoices','returns'] },
  { key: 'pos',            label: 'Point of Sale',   features: ['sales','receipts'] },
  { key: 'inventory',      label: 'Inventory',       features: ['products','categories','stockAlerts','purchaseOrders'] },
  { key: 'customers',      label: 'Customers',       features: ['customers','customerCredit'] },
  { key: 'expenses',       label: 'Expenses',        features: ['expenses'] },
  { key: 'vendors',        label: 'Vendors & Bills', features: ['vendors','bills'] },
  { key: 'accounts',       label: 'Accounts',        features: ['transactions','bankAccounts'] },
  { key: 'reports',        label: 'Reports',         features: ['salesReport','expenseReport','gstReport','profitLoss','balanceSheet'] },
  { key: 'staff',          label: 'Staff',           features: ['staffMembers','roles'] },
  { key: 'attendance',     label: 'Attendance',      features: ['attendance','biometric'] },
  { key: 'payroll',        label: 'Payroll',         features: ['payslips','payrollRun'] },
  { key: 'appointments',   label: 'Appointments',    features: ['appointments'] },
  { key: 'fees',           label: 'Fees',            features: ['feeRecords','feeStructure'] },
  { key: 'students',       label: 'Students',        features: ['students','progress'] },
  { key: 'assets',         label: 'Assets',          features: ['assets','depreciation'] },
  { key: 'lease',          label: 'Lease',           features: ['leaseUnits','leaseTenants','rentCollection'] },
  { key: 'membershipplans',label: 'Memberships',     features: ['membershipPlans','memberSubscriptions'] },
  { key: 'whatsapp',       label: 'WhatsApp',        features: ['messages','templates'] },
  { key: 'campaigns',      label: 'Campaigns',       features: ['campaigns','bulkMessages'] },
  { key: 'b2b',            label: 'B2B Marketplace', features: ['supplierProfiles','connections'] },
  { key: 'ai',             label: 'AI Copilot',      features: ['aiQueries'] },
  { key: 'automation',     label: 'Automation',      features: ['automationRules','digests'] },
];

const FEATURE_LABELS = {
  invoices:'Invoices', creditNotes:'Credit Notes', quotations:'Quotations', recurringInvoices:'Recurring Invoices', returns:'Returns',
  sales:'Sales', receipts:'Receipts',
  products:'Products', categories:'Categories', stockAlerts:'Stock Alerts', purchaseOrders:'Purchase Orders',
  customers:'Customers', customerCredit:'Customer Credit',
  expenses:'Expenses',
  vendors:'Vendors', bills:'Purchase Bills',
  transactions:'Transactions', bankAccounts:'Bank Accounts',
  salesReport:'Sales Report', expenseReport:'Expense Report', gstReport:'GST Report', profitLoss:'Profit & Loss', balanceSheet:'Balance Sheet',
  staffMembers:'Staff Members', roles:'Roles & Permissions',
  attendance:'Attendance Logs', biometric:'Biometric',
  payslips:'Payslips', payrollRun:'Payroll Run',
  appointments:'Appointments',
  feeRecords:'Fee Records', feeStructure:'Fee Structure',
  students:'Students', progress:'Progress & Homework',
  assets:'Assets', depreciation:'Depreciation',
  leaseUnits:'Lease Units', leaseTenants:'Lease Tenants', rentCollection:'Rent Collection',
  membershipPlans:'Membership Plans', memberSubscriptions:'Subscriptions',
  messages:'Messages', templates:'Templates',
  campaigns:'Campaigns', bulkMessages:'Bulk Messages',
  supplierProfiles:'Supplier Profiles', connections:'Connections',
  aiQueries:'AI Queries',
  automationRules:'Automation Rules', digests:'Digests',
};

const OPS = ['C','R','U','D'];
const OP_LABELS = { C:'Create', R:'Read', U:'Update', D:'Delete' };
const OP_COLORS = { C:'#10B981', R:'#3B82F6', U:'#F59E0B', D:'#EF4444' };

const emptyFeature = () => ({ C:false, R:false, U:false, D:false });

function getFeaturePerm(permissions, mod, feat) {
  return permissions?.[mod]?.[feat] || emptyFeature();
}

function setFeaturePerm(permissions, mod, feat, op, val) {
  const p = JSON.parse(JSON.stringify(permissions || {}));
  if (!p[mod]) p[mod] = {};
  if (!p[mod][feat]) p[mod][feat] = emptyFeature();
  p[mod][feat][op] = val;
  // If disabling Read, disable all others too
  if (op === 'R' && !val) { p[mod][feat] = emptyFeature(); }
  // If enabling C/U/D, ensure R is on
  if (op !== 'R' && val) { p[mod][feat].R = true; }
  return p;
}

function moduleHasAnyPerm(permissions, mod) {
  const mp = permissions?.[mod];
  if (!mp) return false;
  return Object.values(mp).some(f => Object.values(f).some(Boolean));
}

// ── Checkbox cell ─────────────────────────────────────────────────────────────
function OpCheckbox({ checked, op, disabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      title={OP_LABELS[op]}
      style={{ opacity: disabled ? 0.35 : 1 }}
      className="w-7 h-7 rounded flex items-center justify-center border transition-all"
      css-data={op}
    >
      <span
        className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold"
        style={{ background: checked ? OP_COLORS[op] : '#E5E7EB' }}
      >
        {checked ? <Check size={11} strokeWidth={3} /> : op}
      </span>
    </button>
  );
}

// ── Permission Builder ────────────────────────────────────────────────────────
function PermissionBuilder({ permissions, onChange, locked }) {
  const [openMods, setOpenMods] = useState({});

  const toggleMod = (k) => setOpenMods(p => ({ ...p, [k]: !p[k] }));

  const toggleModuleAll = (mod, enable) => {
    let p = JSON.parse(JSON.stringify(permissions || {}));
    const mdef = MODULE_REGISTRY.find(m => m.key === mod);
    if (!enable) { delete p[mod]; onChange(p); return; }
    p[mod] = {};
    mdef.features.forEach(f => { p[mod][f] = { C:true, R:true, U:true, D:false }; });
    onChange(p);
  };

  return (
    <div className="space-y-2">
      {MODULE_REGISTRY.map(mod => {
        const active = moduleHasAnyPerm(permissions, mod.key);
        const open = openMods[mod.key];
        return (
          <div key={mod.key} className="border rounded-lg overflow-hidden" style={{ borderColor: active ? '#BFDBFE' : '#E5E7EB' }}>
            {/* Module header */}
            <div
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none"
              style={{ background: active ? '#EFF6FF' : '#F9FAFB' }}
              onClick={() => !locked && toggleMod(mod.key)}
            >
              <button
                type="button"
                onClick={e => { e.stopPropagation(); if (!locked) toggleModuleAll(mod.key, !active); }}
                disabled={locked}
                className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{ borderColor: active ? '#3B82F6' : '#D1D5DB', background: active ? '#3B82F6' : 'white' }}
              >
                {active && <Check size={10} strokeWidth={3} color="white" />}
              </button>
              <span className="font-medium text-sm flex-1" style={{ color: active ? '#1D4ED8' : '#374151' }}>
                {mod.label}
              </span>
              <span className="text-xs" style={{ color: '#9CA3AF' }}>
                {mod.features.length} feature{mod.features.length > 1 ? 's' : ''}
              </span>
              {open ? <ChevronDown size={15} color="#9CA3AF" /> : <ChevronRight size={15} color="#9CA3AF" />}
            </div>

            {/* Feature rows */}
            {open && (
              <div className="divide-y" style={{ borderTop: '1px solid #E5E7EB' }}>
                {/* Header row */}
                <div className="flex items-center gap-2 px-4 py-1.5" style={{ background: '#F3F4F6' }}>
                  <span className="flex-1 text-xs font-semibold uppercase" style={{ color: '#6B7280' }}>Feature</span>
                  {OPS.map(op => (
                    <span key={op} className="w-7 text-center text-xs font-semibold" style={{ color: OP_COLORS[op] }}>{op}</span>
                  ))}
                </div>
                {mod.features.map(feat => {
                  const fp = getFeaturePerm(permissions, mod.key, feat);
                  return (
                    <div key={feat} className="flex items-center gap-2 px-4 py-2" style={{ background: 'white' }}>
                      <span className="flex-1 text-sm" style={{ color: '#374151' }}>
                        {FEATURE_LABELS[feat] || feat}
                      </span>
                      {OPS.map(op => (
                        <OpCheckbox
                          key={op}
                          op={op}
                          checked={fp[op] === true}
                          disabled={locked || (op !== 'R' && !fp.R)}
                          onChange={val => onChange(setFeaturePerm(permissions, mod.key, feat, op, val))}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Create / Edit Role Modal ──────────────────────────────────────────────────
const PRESET_COLORS = ['#7C3AED','#2563EB','#0891B2','#059669','#D97706','#EF4444','#EC4899','#F97316','#6B7280','#10B981'];

function RoleModal({ role, onSave, onClose }) {
  const isEdit = !!role?.id;
  const [name, setName]               = useState(role?.name || '');
  const [desc, setDesc]               = useState(role?.description || '');
  const [color, setColor]             = useState(role?.color || '#2563EB');
  const [permissions, setPermissions] = useState(role?.permissions || {});
  const [saving, setSaving]           = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Role name is required'); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: desc.trim(), color, permissions });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save role');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold" style={{ color: '#111827' }}>
            {isEdit ? `Edit Role — ${role.name}` : 'Create New Role'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} color="#6B7280" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name + Color */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Role Name *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isEdit && role?.isSystem}
                placeholder="e.g. Sales Executive"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#D1D5DB', color: '#111827' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Color</label>
              <div className="flex gap-1.5 flex-wrap w-36">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c} type="button"
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{ background: c, borderColor: color === c ? '#111827' : 'transparent' }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              placeholder="What is this role for?"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ borderColor: '#D1D5DB', color: '#111827' }}
            />
          </div>

          {/* Permission Builder */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
              Permissions <span className="font-normal text-xs ml-1" style={{ color: '#9CA3AF' }}>— click a module to expand features</span>
            </label>
            <PermissionBuilder
              permissions={permissions}
              onChange={setPermissions}
              locked={role?.isOwner}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ background: '#F9FAFB' }}>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            {isEdit ? 'Save Changes' : 'Create Role'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Roles Page ───────────────────────────────────────────────────────────
export default function Roles() {
  const { user } = useAuth();
  const [roles, setRoles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal, setModal]     = useState(null); // null | { mode:'create'|'edit', role? }
  const [deleting, setDeleting] = useState(null);

  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getRoles();
      setRoles(data.data || []);
      if (!selected && data.data?.length) setSelected(data.data[0]);
    } catch { toast.error('Failed to load roles'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (formData) => {
    if (modal.mode === 'create') {
      await createRole(formData);
      toast.success('Role created');
    } else {
      await updateRole(modal.role.id, formData);
      toast.success('Role updated');
    }
    await load();
  };

  const handleDelete = async (role) => {
    setDeleting(role.id);
    try {
      await deleteRole(role.id);
      toast.success('Role deleted');
      setSelected(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete role');
    } finally { setDeleting(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#3B82F6' }} />
    </div>
  );

  return (
    <div className="flex h-full gap-0" style={{ minHeight: '600px' }}>
      {/* ── Left: Role List ─────────────────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 border-r flex flex-col" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
          <span className="font-semibold text-sm" style={{ color: '#111827' }}>Roles</span>
          {isOwnerOrAdmin && (
            <button
              onClick={() => setModal({ mode: 'create' })}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors"
              style={{ background: '#EFF6FF', color: '#2563EB' }}
            >
              <Plus size={13} /> New
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => setSelected(role)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
              style={{ background: selected?.id === role.id ? '#EFF6FF' : 'transparent' }}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: role.color || '#9CA3AF' }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: selected?.id === role.id ? '#1D4ED8' : '#111827' }}>
                  {role.name}
                </div>
                <div className="text-xs" style={{ color: '#9CA3AF' }}>
                  {role._count?.users || 0} user{role._count?.users !== 1 ? 's' : ''}
                </div>
              </div>
              {role.isOwner && <Lock size={12} color="#9CA3AF" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Role Detail ──────────────────────────────────────────────── */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ background: selected.color || '#9CA3AF' }} />
              <div>
                <h2 className="font-semibold text-base" style={{ color: '#111827' }}>
                  {selected.name}
                  {selected.isOwner && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-normal" style={{ background: '#FEF3C7', color: '#D97706' }}>
                      Locked
                    </span>
                  )}
                  {selected.isSystem && !selected.isOwner && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-normal" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                      System
                    </span>
                  )}
                </h2>
                {selected.description && (
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{selected.description}</p>
                )}
              </div>
            </div>
            {isOwnerOrAdmin && (
              <div className="flex gap-2">
                {!selected.isOwner && (
                  <button
                    onClick={() => setModal({ mode: 'edit', role: selected })}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                    style={{ borderColor: '#D1D5DB', color: '#374151' }}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                )}
                {!selected.isSystem && (
                  <button
                    onClick={() => handleDelete(selected)}
                    disabled={deleting === selected.id}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-50"
                    style={{ borderColor: '#FCA5A5', color: '#EF4444' }}
                  >
                    <Trash2 size={14} />
                    {deleting === selected.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Permissions (read-only view OR edit redirects to modal) */}
          <div className="flex-1 overflow-y-auto p-6">
            {selected.isOwner ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Lock size={40} color="#D97706" />
                <p className="mt-3 font-semibold" style={{ color: '#111827' }}>Owner — Full Access</p>
                <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                  The Owner role always has unrestricted access to every module and feature.<br />
                  It cannot be edited or assigned to other users.
                </p>
              </div>
            ) : (
              <PermissionBuilder
                permissions={selected.permissions}
                onChange={() => {}}
                locked={true}
              />
            )}
          </div>

          {/* User count footer */}
          <div className="flex items-center gap-2 px-6 py-3 border-t" style={{ borderColor: '#E5E7EB', background: '#F9FAFB' }}>
            <Users size={14} color="#9CA3AF" />
            <span className="text-xs" style={{ color: '#6B7280' }}>
              {selected._count?.users || 0} user{selected._count?.users !== 1 ? 's' : ''} assigned to this role.
              Manage user assignments in <strong>Settings → Team</strong>.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield size={40} color="#D1D5DB" />
            <p className="mt-2 text-sm" style={{ color: '#9CA3AF' }}>Select a role to view its permissions</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <RoleModal
          role={modal.role}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
