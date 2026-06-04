import { useEffect, useState, useMemo } from 'react';
import { getCompanyFeatures, setCompanyFeature, getBranchFeatures, setBranchFeature } from '../../api';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, AlertCircle, Zap, Building2, GitBranch } from 'lucide-react';

// ── Module key (tenant.modules array) → module code ──────────────────────────
const MODULE_KEY_TO_CODE = {
  // Generic / Commerce
  pos:              'SYL-MOD-POS',
  inventory:        'SYL-MOD-STK',
  invoicing:        'SYL-MOD-INV',
  customers:        'SYL-MOD-CUS',
  expenses:         'SYL-MOD-EXP',
  vendors:          'SYL-MOD-VND',
  accounts:         'SYL-MOD-ACC',
  reports:          'SYL-MOD-REP',
  staff:            'SYL-MOD-STF',
  attendance:       'SYL-MOD-ATT',
  payroll:          'SYL-MOD-PAY',
  appointments:     'SYL-MOD-APT',
  fees:             'SYL-MOD-FEE',
  students:         'SYL-MOD-STU',
  assets:           'SYL-MOD-AST',
  lease:            'SYL-MOD-LSE',
  membershipplans:  'SYL-MOD-MBR',
  whatsapp:         'SYL-MOD-WA',
  campaigns:        'SYL-MOD-CMP',
  b2b:              'SYL-MOD-B2B',
  ai:               'SYL-MOD-AIC',
  automation:       'SYL-MOD-AUT',
  training:         'SYL-MOD-TRN',
  progress:         'SYL-MOD-PRG',
  // Healthcare — OPD
  opdqueue:         'SYL-MOD-OPD',
  vitals:           'SYL-MOD-VIT',
  clinicalNotes:    'SYL-MOD-EMR',
  prescriptions:    'SYL-MOD-RX',
  labOrders:        'SYL-MOD-LAB',
  clinicBilling:    'SYL-MOD-CBL',
  clinicMedicines:  'SYL-MOD-MED',
  clinicDoctors:    'SYL-MOD-DOC',
  clinicPnl:        'SYL-MOD-CPL',
  clinicReports:    'SYL-MOD-CLR',
  abdm:             'SYL-MOD-ABDM',
  // Healthcare — IPD
  ipdWards:         'SYL-MOD-WRD',
  ipdAdmissions:    'SYL-MOD-IPD',
  dischargeSummary: 'SYL-MOD-DSC',
  otSessions:       'SYL-MOD-OTS',
  lims:             'SYL-MOD-LIM',
  radiology:        'SYL-MOD-RAD',
  insuranceClaims:  'SYL-MOD-INS',
};

// ── All module labels + emojis (every code the platform knows) ────────────────
const MODULE_LABELS = {
  // Commerce
  'SYL-MOD-POS':  { name: 'Point of Sale',         emoji: '🛒' },
  'SYL-MOD-STK':  { name: 'Inventory',              emoji: '📦' },
  'SYL-MOD-INV':  { name: 'Invoicing',              emoji: '🧾' },
  'SYL-MOD-CUS':  { name: 'Customers',              emoji: '👥' },
  'SYL-MOD-EXP':  { name: 'Expenses',               emoji: '💸' },
  'SYL-MOD-VND':  { name: 'Vendors',                emoji: '🤝' },
  'SYL-MOD-ACC':  { name: 'Accounts',               emoji: '📊' },
  'SYL-MOD-REP':  { name: 'Reports',                emoji: '📈' },
  // HR & Admin
  'SYL-MOD-STF':  { name: 'Staff',                  emoji: '👤' },
  'SYL-MOD-ATT':  { name: 'Attendance',             emoji: '📅' },
  'SYL-MOD-PAY':  { name: 'Payroll',                emoji: '💰' },
  'SYL-MOD-AST':  { name: 'Assets',                 emoji: '🏗️' },
  // Scheduling & Services
  'SYL-MOD-APT':  { name: 'Appointments',           emoji: '📆' },
  // Education
  'SYL-MOD-FEE':  { name: 'Fees',                   emoji: '🎓' },
  'SYL-MOD-STU':  { name: 'Students',               emoji: '🎒' },
  'SYL-MOD-PRG':  { name: 'Student Progress',       emoji: '📚' },
  // Fitness
  'SYL-MOD-MBR':  { name: 'Membership Plans',       emoji: '⭐' },
  'SYL-MOD-TRN':  { name: 'Training Plans',         emoji: '🏋️' },
  // Property
  'SYL-MOD-LSE':  { name: 'Lease',                  emoji: '🏠' },
  // Marketing & AI
  'SYL-MOD-WA':   { name: 'WhatsApp',               emoji: '💬' },
  'SYL-MOD-CMP':  { name: 'Campaigns',              emoji: '📣' },
  'SYL-MOD-AUT':  { name: 'Automation',             emoji: '⚡' },
  'SYL-MOD-AIC':  { name: 'AI Copilot',             emoji: '🤖' },
  'SYL-MOD-B2B':  { name: 'B2B Portal',             emoji: '🏢' },
  // Healthcare — OPD
  'SYL-MOD-OPD':  { name: 'OPD Queue',              emoji: '🪙' },
  'SYL-MOD-VIT':  { name: 'Vitals Recording',       emoji: '🩺' },
  'SYL-MOD-EMR':  { name: 'Clinical Notes / EMR',   emoji: '📋' },
  'SYL-MOD-RX':   { name: 'Prescriptions',          emoji: '💊' },
  'SYL-MOD-LAB':  { name: 'Lab Orders',             emoji: '🧪' },
  'SYL-MOD-CBL':  { name: 'Clinic Billing',         emoji: '🏥' },
  'SYL-MOD-MED':  { name: 'Medicine Inventory',     emoji: '💉' },
  'SYL-MOD-DOC':  { name: 'Clinic Doctors',         emoji: '👨‍⚕️' },
  'SYL-MOD-CPL':  { name: 'Clinic P&L',             emoji: '📉' },
  'SYL-MOD-CLR':  { name: 'Clinic Reports',         emoji: '📊' },
  'SYL-MOD-ABDM': { name: 'ABDM / ABHA',            emoji: '🛡️' },
  // Healthcare — IPD
  'SYL-MOD-WRD':  { name: 'Wards & Beds',           emoji: '🛏️' },
  'SYL-MOD-IPD':  { name: 'IPD Admissions',         emoji: '🏨' },
  'SYL-MOD-DSC':  { name: 'Discharge Summary',      emoji: '📄' },
  'SYL-MOD-OTS':  { name: 'Operation Theatre',      emoji: '🔬' },
  'SYL-MOD-LIM':  { name: 'LIMS — Laboratory',      emoji: '🔭' },
  'SYL-MOD-RAD':  { name: 'Radiology',              emoji: '🩻' },
  'SYL-MOD-INS':  { name: 'Insurance & TPA',        emoji: '🗂️' },
};

// ── Extra module codes added per business type (beyond tenant.modules) ────────
// These are healthcare-specific modules the backend doesn't store in tenant.modules
// but the frontend override configs enable for these business types.
const HLC_OPD_EXTRA = [
  'SYL-MOD-OPD', 'SYL-MOD-VIT', 'SYL-MOD-EMR', 'SYL-MOD-RX',
  'SYL-MOD-LAB', 'SYL-MOD-CBL', 'SYL-MOD-MED', 'SYL-MOD-DOC',
  'SYL-MOD-CPL', 'SYL-MOD-CLR', 'SYL-MOD-ABDM',
];
const HLC_IPD_EXTRA = [
  'SYL-MOD-WRD', 'SYL-MOD-IPD', 'SYL-MOD-DSC',
  'SYL-MOD-OTS', 'SYL-MOD-LIM', 'SYL-MOD-RAD', 'SYL-MOD-INS',
];

const BUSINESS_TYPE_EXTRA_CODES = {
  // OPD-only healthcare
  CLINIC:         HLC_OPD_EXTRA,
  DENTAL:         HLC_OPD_EXTRA,
  DIAGNOSTIC_LAB: HLC_OPD_EXTRA,
  PHYSIOTHERAPY:  HLC_OPD_EXTRA,
  AYURVEDA:       HLC_OPD_EXTRA,
  VET_CLINIC:     HLC_OPD_EXTRA,
  // Full hospital — OPD + IPD
  HOSPITAL:       [...HLC_OPD_EXTRA, ...HLC_IPD_EXTRA],
  NURSING_HOME:   [...HLC_OPD_EXTRA, ...HLC_IPD_EXTRA],
};

// ── All categories (filtered at render time to only visible codes) ─────────────
const ALL_MODULE_CATEGORIES = [
  {
    label: 'Core Operations',
    modules: ['SYL-MOD-POS', 'SYL-MOD-STK', 'SYL-MOD-INV', 'SYL-MOD-CUS'],
  },
  {
    label: 'Finance',
    modules: ['SYL-MOD-EXP', 'SYL-MOD-VND', 'SYL-MOD-ACC', 'SYL-MOD-REP'],
  },
  {
    label: 'Team & HR',
    modules: ['SYL-MOD-STF', 'SYL-MOD-ATT', 'SYL-MOD-PAY', 'SYL-MOD-AST'],
  },
  {
    label: 'Scheduling',
    modules: ['SYL-MOD-APT'],
  },
  {
    label: 'Education',
    modules: ['SYL-MOD-FEE', 'SYL-MOD-STU', 'SYL-MOD-PRG'],
  },
  {
    label: 'Fitness',
    modules: ['SYL-MOD-MBR', 'SYL-MOD-TRN'],
  },
  {
    label: 'Property',
    modules: ['SYL-MOD-LSE'],
  },
  {
    label: 'Marketing & AI',
    modules: ['SYL-MOD-WA', 'SYL-MOD-CMP', 'SYL-MOD-AUT', 'SYL-MOD-AIC', 'SYL-MOD-B2B'],
  },
  {
    label: 'Healthcare — OPD',
    modules: [
      'SYL-MOD-OPD', 'SYL-MOD-VIT', 'SYL-MOD-EMR', 'SYL-MOD-RX',
      'SYL-MOD-LAB', 'SYL-MOD-CBL', 'SYL-MOD-MED', 'SYL-MOD-DOC',
      'SYL-MOD-CPL', 'SYL-MOD-CLR', 'SYL-MOD-ABDM',
    ],
  },
  {
    label: 'Healthcare — IPD',
    modules: [
      'SYL-MOD-WRD', 'SYL-MOD-IPD', 'SYL-MOD-DSC',
      'SYL-MOD-OTS', 'SYL-MOD-LIM', 'SYL-MOD-RAD', 'SYL-MOD-INS',
    ],
  },
];

/* ── Tier config ─────────────────────────────────────────────────────────────── */
const TIERS = {
  BASIC:      { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', dot: '#22C55E' },
  STANDARD:   { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', dot: '#3B82F6' },
  ADVANCED:   { bg: '#FAF5FF', text: '#6B21A8', border: '#E9D5FF', dot: '#A855F7' },
  ENTERPRISE: { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA', dot: '#F97316' },
};

/* ── Small components ──────────────────────────────────────────────────────────*/
function TierPill({ tier }) {
  const c = TIERS[tier] || TIERS.BASIC;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      padding: '2px 7px', borderRadius: 99,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {tier}
    </span>
  );
}

function Toggle({ on, disabled, onChange, size = 'md' }) {
  const w = size === 'sm' ? 28 : 36;
  const h = size === 'sm' ? 16 : 20;
  const d = size === 'sm' ? 10 : 14;
  const pad = 3;
  return (
    <button
      onClick={disabled ? undefined : onChange}
      style={{
        width: w, height: h, borderRadius: 99, border: 'none', flexShrink: 0,
        background: on ? 'var(--cyan, #0EA5E9)' : '#D1D5DB',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background 0.18s',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: pad, borderRadius: '50%', background: '#fff',
        width: d, height: d,
        left: on ? w - d - pad : pad,
        transition: 'left 0.18s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        display: 'block',
      }} />
    </button>
  );
}

/* ── Feature row ─────────────────────────────────────────────────────────────── */
function FeatureRow({ feature, level, isOwner, onToggle }) {
  const [busy, setBusy] = useState(false);
  const locked   = !feature.planUnlocked;
  const enforced = level === 'branch' && feature.tenantEnforced;
  const isOn     = level === 'branch' ? feature.branchEnabled : feature.tenantEnabled;

  const doToggle = async (enabled, enforced) => {
    if (busy) return;
    setBusy(true);
    try { await onToggle(feature.featureKey, enabled, enforced); }
    finally { setBusy(false); }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '13px 20px',
      borderBottom: '1px solid #F3F4F6',
      background: locked ? '#FAFAFA' : '#fff',
      transition: 'background 0.12s',
    }}>
      {/* Status dot */}
      <div style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: locked ? '#D1D5DB' : isOn && feature.effective ? '#22C55E' : '#D1D5DB',
      }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: locked ? '#9CA3AF' : 'var(--ink, #111827)' }}>
            {feature.name}
          </span>
          <TierPill tier={feature.tier} />
          {enforced && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#6B7280', background: '#F3F4F6', padding: '2px 7px', borderRadius: 4 }}>
              <Lock size={8} /> Enforced
            </span>
          )}
          {feature.dependencies?.length > 0 && (
            <span style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>
              needs: {feature.dependencies.join(', ')}
            </span>
          )}
        </div>
        {feature.description && (
          <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>{feature.description}</div>
        )}
        {locked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 11, color: '#D97706' }}>
            <Zap size={10} /> Upgrade plan to unlock
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        {level === 'company' && isOwner && !locked && isOn && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', userSelect: 'none' }}>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>Enforce</span>
            <Toggle
              size="sm"
              on={feature.tenantEnforced}
              onChange={() => doToggle(isOn, !feature.tenantEnforced)}
            />
          </label>
        )}
        <Toggle
          on={isOn}
          disabled={locked || enforced || busy}
          onChange={() => doToggle(level === 'branch' ? !feature.branchEnabled : !feature.tenantEnabled)}
        />
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────────── */
export default function ModuleFeatureSettings() {
  const { user, tenant }           = useAuth();
  const { branchId, branches }     = useBranch();
  const isOwner = ['OWNER', 'ADMIN'].includes(user?.role);

  // ── Build the set of module codes visible for this tenant ──────────────────
  const visibleCodes = useMemo(() => {
    // 1. Convert tenant.modules (key array) to codes
    const fromModules = (tenant?.modules || [])
      .map(k => MODULE_KEY_TO_CODE[k])
      .filter(Boolean);

    // 2. Add business-type-specific extra codes (e.g. clinic OPD/IPD modules)
    const extra = BUSINESS_TYPE_EXTRA_CODES[tenant?.businessType] || [];

    return new Set([...fromModules, ...extra]);
  }, [tenant?.modules, tenant?.businessType]);

  // ── Filter categories to only show modules this tenant has ─────────────────
  const visibleCategories = useMemo(() =>
    ALL_MODULE_CATEGORIES
      .map(cat => ({ ...cat, modules: cat.modules.filter(code => visibleCodes.has(code)) }))
      .filter(cat => cat.modules.length > 0),
    [visibleCodes]
  );

  // ── Default to first available module for this tenant ──────────────────────
  const defaultModule = visibleCategories[0]?.modules[0] || 'SYL-MOD-CUS';

  const [activeModule, setActiveModule]     = useState(defaultModule);
  const [viewLevel, setViewLevel]           = useState('company');
  const [selectedBranch, setSelectedBranch] = useState(branchId || '');
  const [features, setFeatures]             = useState([]);
  const [loading, setLoading]               = useState(true);

  // Re-sync activeModule when tenant loads (avoids showing a non-owned module)
  useEffect(() => {
    if (visibleCodes.size > 0 && !visibleCodes.has(activeModule)) {
      setActiveModule(visibleCategories[0]?.modules[0] || 'SYL-MOD-CUS');
    }
  }, [visibleCodes]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setLoading(true);
    try {
      const res = viewLevel === 'branch' && selectedBranch
        ? await getBranchFeatures(activeModule, selectedBranch)
        : await getCompanyFeatures(activeModule);
      setFeatures(res.data.data || []);
    } catch {
      toast.error('Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeModule, viewLevel, selectedBranch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = async (featureKey, enabled, enforced) => {
    try {
      if (viewLevel === 'branch' && selectedBranch) {
        await setBranchFeature(activeModule, selectedBranch, { featureKey, enabled });
      } else {
        await setCompanyFeature(activeModule, {
          featureKey, enabled,
          enforced: enforced ?? features.find(f => f.featureKey === featureKey)?.tenantEnforced ?? false,
        });
      }
      await load();
      toast.success('Updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const grouped = ['BASIC', 'STANDARD', 'ADVANCED', 'ENTERPRISE'].reduce((acc, tier) => {
    acc[tier] = features.filter(f => f.tier === tier);
    return acc;
  }, {});

  const activeCount   = features.filter(f => f.effective).length;
  const unlockedCount = features.filter(f => f.planUnlocked).length;
  const modInfo       = MODULE_LABELS[activeModule] || { name: activeModule, emoji: '📦' };

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 600, fontFamily: 'var(--font-body)' }}>

      {/* ── Left: module list (filtered to this tenant) ──────────────────────── */}
      <aside style={{
        width: 210, flexShrink: 0,
        borderRight: '1px solid #E5E7EB',
        overflowY: 'auto',
        paddingTop: 8, paddingBottom: 16,
        background: '#FAFAFA',
      }}>
        {visibleCategories.length === 0 ? (
          <div style={{ padding: '24px 16px', fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
            No modules assigned to this business yet.
          </div>
        ) : visibleCategories.map(cat => (
          <div key={cat.label}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#9CA3AF', padding: '12px 16px 4px',
            }}>
              {cat.label}
            </div>
            {cat.modules.map(code => {
              const info = MODULE_LABELS[code] || { name: code, emoji: '📦' };
              const active = activeModule === code;
              return (
                <button
                  key={code}
                  onClick={() => setActiveModule(code)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    width: '100%', textAlign: 'left', border: 'none',
                    padding: '7px 16px', cursor: 'pointer',
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? 'var(--navy, #0F2942)' : '#4B5563',
                    background: active ? '#E8F0FE' : 'transparent',
                    borderLeft: `3px solid ${active ? 'var(--cyan, #0EA5E9)' : 'transparent'}`,
                    transition: 'all 0.12s',
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{info.emoji}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {info.name}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      {/* ── Right: feature panel ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>

        {/* Module header */}
        <div style={{
          padding: '20px 28px 0',
          borderBottom: '1px solid #E5E7EB',
          background: '#fff',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                {modInfo.emoji}
              </div>
              <div>
                <h2 style={{
                  margin: 0, fontSize: 18, fontWeight: 700,
                  color: 'var(--navy, #0F2942)',
                  fontFamily: 'var(--font-display)',
                }}>
                  {modInfo.name}
                </h2>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  {unlockedCount} features unlocked on your plan
                  {' · '}
                  <span style={{ color: '#22C55E', fontWeight: 600 }}>{activeCount} active</span>
                </div>
              </div>
            </div>

            {/* Scope switcher */}
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 10, padding: 3, gap: 2 }}>
              <button
                onClick={() => setViewLevel('company')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  background: viewLevel === 'company' ? '#fff' : 'transparent',
                  color: viewLevel === 'company' ? 'var(--navy, #0F2942)' : '#6B7280',
                  boxShadow: viewLevel === 'company' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <Building2 size={13} /> Company-wide
              </button>
              <button
                onClick={() => setViewLevel('branch')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  background: viewLevel === 'branch' ? '#fff' : 'transparent',
                  color: viewLevel === 'branch' ? 'var(--navy, #0F2942)' : '#6B7280',
                  boxShadow: viewLevel === 'branch' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <GitBranch size={13} /> Per Branch
              </button>
            </div>
          </div>

          {/* Branch selector row */}
          {viewLevel === 'branch' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                style={{
                  padding: '7px 12px', border: '1px solid #D1D5DB',
                  borderRadius: 8, fontSize: 13, background: '#fff',
                  color: 'var(--ink, #111827)', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Select branch…</option>
                {(branches || []).map(b => (
                  <option key={b.id} value={b.id}>{b.name}{b.isHQ ? ' (HQ)' : ''}</option>
                ))}
              </select>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: '#92400E',
                background: '#FFFBEB', border: '1px solid #FDE68A',
                padding: '6px 12px', borderRadius: 8,
              }}>
                <AlertCircle size={13} />
                Branches can only restrict features, not expand them.
              </div>
            </div>
          )}
        </div>

        {/* Feature list */}
        <div style={{ padding: '20px 28px 40px' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: 'var(--cyan, #0EA5E9)', margin: '0 auto 12px', animation: 'spin 0.7s linear infinite' }} />
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>Loading features…</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : features.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{modInfo.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                {modInfo.name}
              </div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                No configurable features for this module on your current plan.
              </div>
            </div>
          ) : (
            ['BASIC', 'STANDARD', 'ADVANCED', 'ENTERPRISE'].map(tier => {
              const tierFeatures = grouped[tier];
              if (!tierFeatures?.length) return null;
              const tc = TIERS[tier];
              const tierActive = tierFeatures.filter(f => f.effective).length;
              return (
                <div key={tier} style={{ marginBottom: 20 }}>
                  {/* Tier header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 20px',
                    background: tc.bg,
                    borderRadius: '10px 10px 0 0',
                    border: `1px solid ${tc.border}`,
                    borderBottom: 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: tc.dot }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: tc.text, letterSpacing: '0.04em' }}>
                        {tier} FEATURES
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: tc.text, opacity: 0.7, fontWeight: 600 }}>
                      {tierActive} / {tierFeatures.length} active
                    </span>
                  </div>

                  {/* Feature rows */}
                  <div style={{
                    border: `1px solid ${tc.border}`,
                    borderRadius: '0 0 10px 10px',
                    overflow: 'hidden',
                    background: '#fff',
                  }}>
                    {tierFeatures.map((feature, i) => (
                      <div key={feature.featureKey} style={{ borderTop: i === 0 ? 'none' : '1px solid #F3F4F6' }}>
                        <FeatureRow
                          feature={feature}
                          level={viewLevel}
                          isOwner={isOwner}
                          onToggle={handleToggle}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
