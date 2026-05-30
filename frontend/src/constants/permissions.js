// ─────────────────────────────────────────────────────────────────────────────
// Syllabrix Permission System
// ─────────────────────────────────────────────────────────────────────────────

// ── All modules ───────────────────────────────────────────────────────────────
export const MODULES = [
  // General
  { key: 'dashboard',    label: 'Dashboard',             group: 'General',    icon: '🏠', desc: 'Business overview, KPIs and real-time insights' },
  { key: 'ai',           label: 'AI Copilot',             group: 'General',    icon: '✨', desc: 'AI-powered insights, anomaly detection, smart assistant' },

  // Operations
  { key: 'pos',          label: 'Point of Sale',          group: 'Operations', icon: '🧾', desc: 'Billing, receipts and daily transaction processing' },
  { key: 'customers',    label: 'Members / Customers',    group: 'Operations', icon: '👥', desc: 'Customer profiles, memberships, credit, subscriptions' },
  { key: 'appointments', label: 'Sessions / Appointments',group: 'Operations', icon: '📅', desc: 'Book and manage appointments or training sessions' },
  { key: 'inventory',    label: 'Inventory',              group: 'Operations', icon: '📦', desc: 'Products, stock levels, low-stock alerts, categories' },
  { key: 'vendors',      label: 'Vendors & Purchases',    group: 'Operations', icon: '🚚', desc: 'Supplier profiles, purchase orders, bills, GRNs' },
  { key: 'expenses',     label: 'Expenses',               group: 'Operations', icon: '💳', desc: 'Track and categorise all business expenses' },
  { key: 'campaigns',    label: 'WhatsApp Campaigns',     group: 'Operations', icon: '📢', desc: 'Bulk WhatsApp messaging and automated customer campaigns' },
  { key: 'assets',       label: 'Fixed Assets',           group: 'Operations', icon: '🏗️', desc: 'Asset register, SLM/WDV depreciation, maintenance logs' },

  // Finance
  { key: 'invoices',     label: 'Invoices & Billing',     group: 'Finance',    icon: '📄', desc: 'Invoices, quotations, payments, credit notes' },
  { key: 'accounts',     label: 'Bank Accounts',          group: 'Finance',    icon: '🏦', desc: 'Account balances, bank reconciliation, transactions' },
  { key: 'reports',      label: 'Reports & Analytics',    group: 'Finance',    icon: '📊', desc: 'P&L, GST, revenue trends, category analysis' },
  { key: 'payroll',      label: 'Payroll',                group: 'Finance',    icon: '💰', desc: 'Monthly salary processing, PF, ESI, PT deductions' },

  // Admin
  { key: 'staff',        label: 'Staff & HR',             group: 'Admin',      icon: '🪪', desc: 'Team management, biometric attendance, HR records' },
  { key: 'settings',     label: 'Settings',               group: 'Admin',      icon: '⚙️', desc: 'Business profile, tax rates, integrations, branding' },
  { key: 'users',        label: 'User & Access Management', group: 'Admin',    icon: '🔑', desc: 'Invite team members, assign roles and custom permissions' },
];

export const MODULE_GROUPS = ['General', 'Operations', 'Finance', 'Admin'];

// ── Access levels ─────────────────────────────────────────────────────────────
export const ACCESS_LEVELS = [
  { key: 'none',   label: 'No Access',    short: 'None',   color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB', desc: 'Hidden from sidebar. All routes blocked.' },
  { key: 'view',   label: 'View Only',    short: 'View',   color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', desc: 'Read-only. Cannot create, edit or delete records.' },
  { key: 'own',    label: 'Own Records',  short: 'Own',    color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', desc: 'Can only view and manage their own records.' },
  { key: 'manage', label: 'Full Access',  short: 'Manage', color: '#10B981', bg: '#F0FDF4', border: '#A7F3D0', desc: 'Complete read/write access to this module.' },
];

// Helper — get access level metadata
export const getAccessMeta = (key) => ACCESS_LEVELS.find(l => l.key === key) || ACCESS_LEVELS[0];

// ── Permission Profiles ───────────────────────────────────────────────────────
const ALL_MANAGE = Object.fromEntries(MODULES.map(m => [m.key, 'manage']));
const ALL_NONE   = Object.fromEntries(MODULES.map(m => [m.key, 'none']));

export const PERMISSION_PROFILES = [
  {
    id: 'owner',
    label: 'Owner',
    emoji: '👑',
    color: '#7C3AED',
    bg: '#EDE9FE',
    border: '#C4B5FD',
    locked: true,
    systemRole: 'OWNER',
    tagline: 'Unrestricted',
    desc: 'Complete access to every module. Cannot be modified.',
    highlight: ['All modules', 'Settings & Users', 'Financials', 'Payroll'],
    perms: ALL_MANAGE,
  },
  {
    id: 'admin',
    label: 'Admin',
    emoji: '🔑',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    locked: true,
    systemRole: 'ADMIN',
    tagline: 'Full Operations',
    desc: 'Full access to all modules. Cannot manage users or delete the business.',
    highlight: ['All Operations', 'Finance & Reports', 'Staff & Payroll'],
    perms: { ...ALL_MANAGE, users: 'none' },
  },
  {
    id: 'manager',
    label: 'Operations Manager',
    emoji: '📊',
    color: '#0891B2',
    bg: '#ECFEFF',
    border: '#A5F3FC',
    systemRole: 'MANAGER',
    tagline: 'Day-to-day Ops',
    desc: 'Runs day-to-day operations. No access to financials, payroll or user management.',
    highlight: ['POS & Inventory', 'Customers & Sessions', 'Expenses', 'Reports (view)'],
    perms: {
      dashboard: 'manage', ai: 'manage',
      pos: 'manage', customers: 'manage', appointments: 'manage',
      inventory: 'manage', vendors: 'manage', expenses: 'manage',
      campaigns: 'manage', assets: 'view',
      invoices: 'view', accounts: 'none', reports: 'view', payroll: 'none',
      staff: 'view', settings: 'none', users: 'none',
    },
  },
  {
    id: 'accountant',
    label: 'Accountant',
    emoji: '📑',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    systemRole: 'ACCOUNTANT',
    tagline: 'Finance Focus',
    desc: 'Invoices, expenses, bank accounts, payroll and financial reports. No operational access.',
    highlight: ['Invoices & Payments', 'Expenses & Bank', 'P&L Reports', 'Payroll'],
    perms: {
      dashboard: 'view', ai: 'view',
      pos: 'none', customers: 'view', appointments: 'none',
      inventory: 'view', vendors: 'manage', expenses: 'manage',
      campaigns: 'none', assets: 'manage',
      invoices: 'manage', accounts: 'manage', reports: 'manage', payroll: 'manage',
      staff: 'view', settings: 'none', users: 'none',
    },
  },
  {
    id: 'cashier',
    label: 'Cashier',
    emoji: '🧾',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    systemRole: 'CASHIER',
    tagline: 'POS Only',
    desc: 'Point-of-sale billing only. No reports, settings or financial visibility.',
    highlight: ['POS / Billing', 'Customer lookup', 'Inventory (view)'],
    perms: {
      dashboard: 'view', ai: 'none',
      pos: 'manage', customers: 'view', appointments: 'none',
      inventory: 'view', vendors: 'none', expenses: 'none',
      campaigns: 'none', assets: 'none',
      invoices: 'none', accounts: 'none', reports: 'none', payroll: 'none',
      staff: 'none', settings: 'none', users: 'none',
    },
  },
  // ── Specialised profiles ───────────────────────────────────────────────────
  {
    id: 'receptionist',
    label: 'Receptionist',
    emoji: '📞',
    color: '#EC4899',
    bg: '#FDF2F8',
    border: '#F9A8D4',
    tagline: 'Front Desk',
    desc: 'Front desk operations: bookings, member check-in, invoicing and reminders.',
    highlight: ['Appointments', 'Members', 'Invoices', 'Campaigns'],
    perms: {
      dashboard: 'view', ai: 'view',
      pos: 'manage', customers: 'manage', appointments: 'manage',
      inventory: 'view', vendors: 'none', expenses: 'none',
      campaigns: 'manage', assets: 'none',
      invoices: 'manage', accounts: 'none', reports: 'view', payroll: 'none',
      staff: 'view', settings: 'none', users: 'none',
    },
  },
  {
    id: 'trainer-basic',
    label: 'Basic Trainer',
    emoji: '🏋️',
    color: '#EA580C',
    bg: '#FFF7ED',
    border: '#FED7AA',
    tagline: 'Own Schedule',
    desc: 'Can see their own schedule and assigned members. No financials or admin access.',
    highlight: ['Own sessions only', 'Member profiles (view)', 'Dashboard'],
    perms: {
      dashboard: 'view', ai: 'none',
      pos: 'none', customers: 'view', appointments: 'own',
      inventory: 'none', vendors: 'none', expenses: 'none',
      campaigns: 'none', assets: 'none',
      invoices: 'none', accounts: 'none', reports: 'none', payroll: 'none',
      staff: 'none', settings: 'none', users: 'none',
    },
  },
  {
    id: 'trainer-senior',
    label: 'Senior Trainer',
    emoji: '⭐',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    tagline: 'Full Training Access',
    desc: 'Manages all sessions and members. Can process POS sales (e.g. supplements). View-only reports.',
    highlight: ['All sessions', 'Member management', 'POS sales', 'Reports (view)'],
    perms: {
      dashboard: 'view', ai: 'view',
      pos: 'manage', customers: 'manage', appointments: 'manage',
      inventory: 'view', vendors: 'none', expenses: 'none',
      campaigns: 'view', assets: 'none',
      invoices: 'none', accounts: 'none', reports: 'view', payroll: 'none',
      staff: 'none', settings: 'none', users: 'none',
    },
  },
  {
    id: 'floor-manager',
    label: 'Floor Manager',
    emoji: '🔧',
    color: '#0EA5E9',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    tagline: 'Operations Lead',
    desc: 'Manages floor operations including inventory, staff attendance, POS and sessions.',
    highlight: ['Staff attendance', 'Inventory', 'POS & Sessions', 'Expenses'],
    perms: {
      dashboard: 'view', ai: 'view',
      pos: 'manage', customers: 'manage', appointments: 'manage',
      inventory: 'manage', vendors: 'view', expenses: 'manage',
      campaigns: 'none', assets: 'view',
      invoices: 'view', accounts: 'none', reports: 'view', payroll: 'none',
      staff: 'manage', settings: 'none', users: 'none',
    },
  },
  {
    id: 'custom',
    label: 'Custom',
    emoji: '⚙️',
    color: '#6B7280',
    bg: '#F3F4F6',
    border: '#D1D5DB',
    tagline: 'Hand-crafted',
    desc: 'Manually configure every module permission. Build exactly the right access for this person.',
    highlight: ['Fully configurable', 'Module by module', 'Any combination'],
    perms: ALL_NONE,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export const getProfile = (id) => PERMISSION_PROFILES.find(p => p.id === id);

// Resolve effective permissions for a user:
// 1. Start with role defaults (via permissionProfile matching systemRole)
// 2. Override with customPermissions if set
export const resolvePermissions = (user) => {
  if (!user) return ALL_NONE;

  // OWNER always gets everything
  if (user.role === 'OWNER') return ALL_MANAGE;

  // Find matching system profile
  const sysProfile = PERMISSION_PROFILES.find(p => p.systemRole === user.role);
  const base = sysProfile ? { ...sysProfile.perms } : { ...ALL_NONE };

  // Overlay customPermissions if present
  if (user.customPermissions && typeof user.customPermissions === 'object') {
    return { ...base, ...user.customPermissions };
  }

  return base;
};

// Check if user has at least a given access level on a module
export const hasAccess = (user, moduleKey, minLevel = 'view') => {
  const perms = resolvePermissions(user);
  const level = perms[moduleKey] || 'none';
  const order = { none: 0, view: 1, own: 2, manage: 3 };
  return (order[level] || 0) >= (order[minLevel] || 0);
};

// Map module key → sidebar path(s)
export const MODULE_PATHS = {
  dashboard:    ['/dashboard', '/'],
  ai:           ['/ai'],
  pos:          ['/pos'],
  customers:    ['/customers'],
  appointments: ['/appointments'],
  inventory:    ['/inventory'],
  vendors:      ['/vendors', '/bills'],
  expenses:     ['/expenses'],
  campaigns:    ['/campaigns'],
  assets:       ['/assets'],
  invoices:     ['/invoices', '/quotations', '/credit-notes', '/recurring-invoices'],
  accounts:     ['/accounts'],
  reports:      ['/reports'],
  payroll:      ['/payroll'],
  staff:        ['/staff'],
  settings:     ['/settings'],
  users:        ['/settings'],
};
