/**
 * Central sidebar link registry.
 * Single source of truth for ALL navigation items across ALL business types.
 * Imported by Sidebar.jsx (rendering) and WorkspaceTab.jsx (configuration UI).
 */

import {
  LayoutDashboard, Package, ShoppingCart, FileText, Users,
  Calendar, GraduationCap, Building2, BarChart3, Truck, Receipt,
  MessageCircle, Briefcase, UserCheck, Megaphone, CreditCard,
  FileX, ClipboardList, BookOpen, Store, Award, RotateCcw,
  ArrowLeftRight, Network, Dumbbell, Zap,
  ListOrdered, Pill, FlaskConical, Stethoscope, IndianRupee, Activity,
  ShieldCheck, BedDouble, Scissors, Microscope, Radio, Shield,
} from 'lucide-react';

// Role sets — who can see each link by default
export const ALL  = ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF', 'CASHIER'];
export const OPS  = ['OWNER', 'ADMIN', 'MANAGER'];
export const FIN  = ['OWNER', 'ADMIN', 'ACCOUNTANT'];
export const OPS_FIN = ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'];
export const SALES = ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CASHIER'];

// Business type classification
export const CLINIC_TYPES       = ['CLINIC', 'NURSING_HOME', 'HOSPITAL', 'DENTAL', 'PHYSIOTHERAPY', 'AYURVEDA', 'VET_CLINIC', 'DIAGNOSTIC_LAB'];
export const NURSING_HOME_TYPES = ['NURSING_HOME', 'HOSPITAL'];
export const GYM_MODULE_KEY     = 'membershipplans';
export const EDUCATION_MODULE_KEY = 'progress';

export const EDUCATION_HIDDEN = ['/invoices', '/assets', '/bills', '/accounts', '/quotations', '/credit-notes', '/payroll'];
export const GYM_HIDDEN       = ['/lease', '/marketplace', '/quotations', '/credit-notes'];

/**
 * Every navigation item across every business type.
 * Fields:
 *   to           – route path
 *   icon         – lucide-react icon component
 *   label        – display label (may be overridden per business type in Sidebar)
 *   module       – module key that gates this item (null = always visible if role allows)
 *   roles        – roles that can see this by default
 *   category     – used to group items in the Workspace settings UI
 *   clinicOnly   – only show for clinic-type businesses
 *   nursingHomeOnly – only show for nursing home / hospital
 *   gymOnly      – only show if membershipplans module is active
 *   educationOnly – only show if progress module is active
 *   branchesOnly – only show if tenant has branches
 */
export const ALL_LINKS = [
  // ── Core ──────────────────────────────────────────────────────────────────
  { to: '/dashboard',         icon: LayoutDashboard,  label: 'Dashboard',        module: null,            roles: ALL,     category: 'core' },

  // ── Inventory & Stock ─────────────────────────────────────────────────────
  { to: '/inventory',         icon: Package,          label: 'Inventory',        module: 'inventory',     roles: OPS,     category: 'operations' },
  { to: '/stock-network',     icon: Network,          label: 'Stock Network',    module: 'inventory',     roles: ['OWNER'], category: 'operations', branchesOnly: true },
  { to: '/stock-transfers',   icon: ArrowLeftRight,   label: 'Stock Transfers',  module: 'inventory',     roles: OPS,     category: 'operations', branchesOnly: true },

  // ── Sales ─────────────────────────────────────────────────────────────────
  { to: '/pos',               icon: ShoppingCart,     label: 'POS / Billing',    module: 'pos',           roles: SALES,   category: 'operations' },
  { to: '/invoices',          icon: FileText,         label: 'Invoices',         module: 'invoicing',     roles: OPS_FIN, category: 'operations' },
  { to: '/customers',         icon: Users,            label: 'Customers',        module: 'customers',     roles: OPS_FIN, category: 'operations' },
  { to: '/appointments',      icon: Calendar,         label: 'Appointments',     module: 'appointments',  roles: OPS,     category: 'operations' },

  // ── Clinic (SYL-BC-HLC-CL07 and related) ──────────────────────────────────
  { to: '/opd-queue',         icon: ListOrdered,      label: 'OPD Queue',        module: 'appointments',  roles: OPS,     category: 'clinic',    clinicOnly: true },
  { to: '/vitals',            icon: Activity,         label: 'Vitals',           module: 'appointments',  roles: OPS,     category: 'clinic',    clinicOnly: true },
  { to: '/clinical-notes',    icon: Stethoscope,      label: 'Clinical Notes',   module: 'appointments',  roles: OPS,     category: 'clinic',    clinicOnly: true },
  { to: '/prescriptions',     icon: Pill,             label: 'Prescriptions',    module: 'appointments',  roles: OPS,     category: 'clinic',    clinicOnly: true },
  { to: '/lab-orders',        icon: FlaskConical,     label: 'Lab Orders',       module: 'appointments',  roles: OPS,     category: 'clinic',    clinicOnly: true },
  { to: '/clinic-billing',    icon: Receipt,          label: 'Clinic Billing',   module: 'appointments',  roles: OPS,     category: 'clinic',    clinicOnly: true },
  { to: '/clinic-medicines',  icon: Package,          label: 'Medicine Stock',   module: 'appointments',  roles: OPS,     category: 'clinic',    clinicOnly: true },
  { to: '/clinic-doctors',    icon: Stethoscope,      label: 'Doctors',          module: 'appointments',  roles: OPS,     category: 'clinic',    clinicOnly: true },
  { to: '/clinic-pnl',        icon: IndianRupee,      label: 'Clinic P&L',       module: 'appointments',  roles: OPS,     category: 'clinic',    clinicOnly: true },
  { to: '/clinic-reports',    icon: BarChart3,        label: 'Clinic Reports',   module: 'appointments',  roles: OPS,     category: 'clinic',    clinicOnly: true },
  { to: '/abdm',              icon: ShieldCheck,      label: 'ABDM / ABHA',      module: 'appointments',  roles: OPS,     category: 'clinic',    clinicOnly: true },

  // ── Nursing Home / Hospital ────────────────────────────────────────────────
  { to: '/ipd-wards',         icon: BedDouble,        label: 'Wards & Beds',     module: 'appointments',  roles: OPS,     category: 'ipd',       nursingHomeOnly: true },
  { to: '/ipd-admissions',    icon: ClipboardList,    label: 'IPD Admissions',   module: 'appointments',  roles: OPS,     category: 'ipd',       nursingHomeOnly: true },
  { to: '/discharge-summary', icon: FileText,         label: 'Discharge Summary',module: 'appointments',  roles: OPS,     category: 'ipd',       nursingHomeOnly: true },
  { to: '/ot-sessions',       icon: Scissors,         label: 'Operation Theatre',module: 'appointments',  roles: OPS,     category: 'ipd',       nursingHomeOnly: true },
  { to: '/lims',              icon: Microscope,       label: 'LIMS — Lab',       module: 'appointments',  roles: OPS,     category: 'ipd',       nursingHomeOnly: true },
  { to: '/radiology',         icon: Radio,            label: 'Radiology',        module: 'appointments',  roles: OPS,     category: 'ipd',       nursingHomeOnly: true },
  { to: '/insurance-claims',  icon: Shield,           label: 'Insurance & TPA',  module: 'appointments',  roles: OPS,     category: 'ipd',       nursingHomeOnly: true },

  // ── Gym (SYL-BC-FIT-GY01) ─────────────────────────────────────────────────
  { to: '/membership-plans',  icon: Award,            label: 'Plan Catalog',     module: 'membershipplans', roles: OPS,  category: 'gym',       gymOnly: true },
  { to: '/receipts',          icon: CreditCard,       label: 'Receipts',         module: 'membershipplans', roles: OPS_FIN, category: 'gym',   gymOnly: true },
  { to: '/training-plans',    icon: Dumbbell,         label: 'Training Plans',   module: 'training',        roles: [...OPS, 'STAFF'], category: 'gym', gymOnly: true },

  // ── Education ─────────────────────────────────────────────────────────────
  { to: '/fees',              icon: GraduationCap,    label: 'Fees',             module: 'fees',          roles: OPS,     category: 'education' },
  { to: '/progress',          icon: BookOpen,         label: 'Progress',         module: 'progress',      roles: OPS,     category: 'education', educationOnly: true },

  // ── Finance ───────────────────────────────────────────────────────────────
  { to: '/expenses',          icon: Receipt,          label: 'Expenses',         module: null,            roles: OPS_FIN, category: 'finance' },
  { to: '/assets',            icon: Briefcase,        label: 'Assets',           module: null,            roles: OPS,     category: 'finance' },
  { to: '/accounts',          icon: CreditCard,       label: 'Accounts',         module: null,            roles: FIN,     category: 'finance' },
  { to: '/quotations',        icon: ClipboardList,    label: 'Quotations',       module: null,            roles: OPS_FIN, category: 'finance' },
  { to: '/returns',           icon: RotateCcw,        label: 'Returns',          module: null,            roles: OPS_FIN, category: 'finance' },
  { to: '/credit-notes',      icon: FileX,            label: 'Credit Notes',     module: null,            roles: FIN,     category: 'finance' },
  { to: '/lease',             icon: Building2,        label: 'Lease',            module: 'lease',         roles: OPS_FIN, category: 'finance' },
  { to: '/vendors',           icon: Truck,            label: 'Vendors',          module: 'inventory',     roles: OPS,     category: 'finance' },

  // ── HR ────────────────────────────────────────────────────────────────────
  { to: '/staff',             icon: UserCheck,        label: 'Staff',            module: null,            roles: OPS,     category: 'hr' },
  { to: '/attendance',        icon: Calendar,         label: 'Attendance',       module: null,            roles: OPS,     category: 'hr' },

  // ── Marketing ─────────────────────────────────────────────────────────────
  { to: '/campaigns',         icon: Megaphone,        label: 'Campaigns',        module: 'campaigns',     roles: OPS,     category: 'marketing' },
  { to: '/whatsapp',          icon: MessageCircle,    label: 'WhatsApp',         module: 'whatsapp',      roles: OPS,     category: 'marketing' },
  { to: '/automation',        icon: Zap,              label: 'Automation',       module: 'automation',    roles: OPS,     category: 'marketing' },
  { to: '/marketplace',       icon: Store,            label: 'Marketplace',      module: null,            roles: OPS,     category: 'marketing' },

  // ── Reports ───────────────────────────────────────────────────────────────
  { to: '/reports',           icon: BarChart3,        label: 'Reports',          module: 'reports',       roles: OPS_FIN, category: 'reports' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns all links that are theoretically available for this tenant's
 * business type (ignores role, ignores module subscription).
 */
export function getAvailableLinks(tenant) {
  const modules    = Array.isArray(tenant?.modules) ? tenant.modules : [];
  const isGym      = modules.includes(GYM_MODULE_KEY);
  const isEducation = modules.includes(EDUCATION_MODULE_KEY);
  const isClinic   = CLINIC_TYPES.includes(tenant?.businessType);
  const isNursingHome = NURSING_HOME_TYPES.includes(tenant?.businessType);
  const hasBranches = tenant?.hasBranches;

  return ALL_LINKS.filter(l => {
    if (l.gymOnly        && !isGym)         return false;
    if (l.clinicOnly     && !isClinic)      return false;
    if (l.nursingHomeOnly && !isNursingHome) return false;
    if (l.educationOnly  && !isEducation)   return false;
    if (l.branchesOnly   && !hasBranches)   return false;
    if (isGym        && GYM_HIDDEN.includes(l.to))       return false;
    if (isEducation  && EDUCATION_HIDDEN.includes(l.to)) return false;
    return true;
  });
}

/**
 * Returns the default visible paths for a given role on a given tenant.
 * Mirrors the existing Sidebar filtering logic exactly.
 */
export function getDefaultPaths(tenant, role) {
  const modules = Array.isArray(tenant?.modules) ? tenant.modules : [];
  return getAvailableLinks(tenant)
    .filter(l => {
      if (l.roles && !l.roles.includes(role)) return false;
      return !l.module || modules.includes(l.module);
    })
    .map(l => l.to);
}

/**
 * Given a tenant's sidebarConfig and a role, returns the ordered list of
 * link objects to render. Falls back to defaults if no config for that role.
 * Always re-checks module subscription so removed modules disappear automatically.
 */
export function resolveLinks(tenant, role, sidebarConfig) {
  const modules    = Array.isArray(tenant?.modules) ? tenant.modules : [];
  const isGym      = modules.includes(GYM_MODULE_KEY);
  const isClinic   = CLINIC_TYPES.includes(tenant?.businessType);
  const isNursingHome = NURSING_HOME_TYPES.includes(tenant?.businessType);
  const isEducation = modules.includes(EDUCATION_MODULE_KEY);

  const paths = sidebarConfig?.[role];
  if (paths && Array.isArray(paths)) {
    return paths
      .map(path => ALL_LINKS.find(l => l.to === path))
      .filter(Boolean)
      .filter(l => {
        if (l.gymOnly        && !isGym)         return false;
        if (l.clinicOnly     && !isClinic)      return false;
        if (l.nursingHomeOnly && !isNursingHome) return false;
        if (l.educationOnly  && !isEducation)   return false;
        return !l.module || modules.includes(l.module);
      });
  }
  // Fallback — same logic as original Sidebar
  return getAvailableLinks(tenant).filter(l => {
    if (l.roles && !l.roles.includes(role)) return false;
    return !l.module || modules.includes(l.module);
  });
}

// Category display metadata for WorkspaceTab grouping
export const CATEGORY_META = {
  core:       { label: 'Core',          color: '#0F2339' },
  operations: { label: 'Operations',    color: '#0891B2' },
  clinic:     { label: 'Clinic',        color: '#059669' },
  ipd:        { label: 'IPD / Hospital',color: '#7C3AED' },
  gym:        { label: 'Gym',           color: '#D97706' },
  education:  { label: 'Education',     color: '#DB2777' },
  finance:    { label: 'Finance',       color: '#2563EB' },
  hr:         { label: 'HR',            color: '#6B7280' },
  marketing:  { label: 'Marketing',     color: '#EA580C' },
  reports:    { label: 'Reports',       color: '#0F766E' },
};
