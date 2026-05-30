/**
 * Default permission templates for standard Syllabrix roles.
 * These are seeded for every new tenant on registration.
 * Business owners can customise any of these (except OWNER).
 *
 * Permission shape per feature: { C, R, U, D }
 *   C = Create, R = Read, U = Update, D = Delete
 */

// ── Helpers ───────────────────────────────────────────────────────────────────
const full = () => ({ C: true,  R: true,  U: true,  D: true  });
const cru  = () => ({ C: true,  R: true,  U: true,  D: false });
const cr   = () => ({ C: true,  R: true,  U: false, D: false });
const r    = () => ({ C: false, R: true,  U: false, D: false });

// ── Role Templates ────────────────────────────────────────────────────────────

const OWNER = {
  templateKey: 'OWNER',
  name: 'Owner',
  description: 'Full unrestricted access to everything. Cannot be edited.',
  color: '#7C3AED',
  isSystem: true,
  isOwner: true,
  permissions: {}, // isOwner=true bypasses all permission checks
};

const ADMIN = {
  templateKey: 'ADMIN',
  name: 'Admin',
  description: 'Full access to all modules. Cannot manage the Owner account.',
  color: '#2563EB',
  isSystem: true,
  isOwner: false,
  permissions: {
    invoicing:      { invoices: cru(), creditNotes: cru(), quotations: cru(), recurringInvoices: cru(), returns: cru() },
    pos:            { sales: cru(), receipts: cr() },
    inventory:      { products: full(), categories: full(), stockAlerts: cru(), purchaseOrders: cru() },
    customers:      { customers: cru(), customerCredit: cru() },
    expenses:       { expenses: cru() },
    vendors:        { vendors: cru(), bills: cru() },
    accounts:       { transactions: cru(), bankAccounts: cru() },
    reports:        { salesReport: r(), expenseReport: r(), gstReport: r(), profitLoss: r(), balanceSheet: r() },
    staff:          { staffMembers: cru(), roles: cru() },
    attendance:     { attendance: cru(), biometric: cru() },
    payroll:        { payslips: cru(), payrollRun: cru() },
    appointments:   { appointments: cru() },
    fees:           { feeRecords: cru(), feeStructure: cru() },
    students:       { students: cru(), progress: cru() },
    assets:         { assets: cru(), depreciation: r() },
    lease:          { leaseUnits: cru(), leaseTenants: cru(), rentCollection: cru() },
    membershipplans:{ membershipPlans: cru(), memberSubscriptions: cru() },
    whatsapp:       { messages: cr(), templates: cru() },
    campaigns:      { campaigns: cru(), bulkMessages: cr() },
    b2b:            { supplierProfiles: cru(), connections: cr() },
    ai:             { aiQueries: cr() },
    automation:     { automationRules: cru(), digests: cru() },
  },
};

const MANAGER = {
  templateKey: 'MANAGER',
  name: 'Manager',
  description: 'Day-to-day operations. No payroll, no bank accounts, no role management.',
  color: '#0891B2',
  isSystem: true,
  isOwner: false,
  permissions: {
    invoicing:      { invoices: cru(), creditNotes: cru(), quotations: cru(), recurringInvoices: r(), returns: cru() },
    pos:            { sales: cru(), receipts: cr() },
    inventory:      { products: cru(), categories: r(), stockAlerts: r(), purchaseOrders: cru() },
    customers:      { customers: cru(), customerCredit: r() },
    expenses:       { expenses: cru() },
    vendors:        { vendors: r(), bills: cru() },
    accounts:       { transactions: r(), bankAccounts: r() },
    reports:        { salesReport: r(), expenseReport: r(), gstReport: r() },
    staff:          { staffMembers: r(), roles: r() },
    attendance:     { attendance: cru(), biometric: r() },
    appointments:   { appointments: cru() },
    fees:           { feeRecords: cru(), feeStructure: r() },
    students:       { students: cru(), progress: cru() },
    assets:         { assets: r(), depreciation: r() },
    lease:          { leaseUnits: r(), leaseTenants: r(), rentCollection: cru() },
    membershipplans:{ membershipPlans: r(), memberSubscriptions: cru() },
    whatsapp:       { messages: cr(), templates: r() },
    campaigns:      { campaigns: cru(), bulkMessages: cr() },
    b2b:            { supplierProfiles: r(), connections: cr() },
    ai:             { aiQueries: cr() },
    automation:     { automationRules: r(), digests: r() },
  },
};

const ACCOUNTANT = {
  templateKey: 'ACCOUNTANT',
  name: 'Accountant',
  description: 'Invoices, expenses, accounts and financial reports. No POS write or inventory.',
  color: '#D97706',
  isSystem: true,
  isOwner: false,
  permissions: {
    invoicing:      { invoices: cru(), creditNotes: cru(), quotations: cru(), recurringInvoices: cru(), returns: cru() },
    pos:            { receipts: r() },
    inventory:      { products: r(), categories: r() },
    customers:      { customers: r(), customerCredit: cru() },
    expenses:       { expenses: full() },
    vendors:        { vendors: r(), bills: full() },
    accounts:       { transactions: cru(), bankAccounts: cru() },
    reports:        { salesReport: r(), expenseReport: r(), gstReport: r(), profitLoss: r(), balanceSheet: r() },
    payroll:        { payslips: r(), payrollRun: r() },
    fees:           { feeRecords: cru(), feeStructure: r() },
    membershipplans:{ membershipPlans: r(), memberSubscriptions: r() },
    ai:             { aiQueries: cr() },
  },
};

const CASHIER = {
  templateKey: 'CASHIER',
  name: 'Cashier',
  description: 'POS sales and basic invoicing. Cannot access reports or financial data.',
  color: '#059669',
  isSystem: true,
  isOwner: false,
  permissions: {
    invoicing:  { invoices: cr(), quotations: cr() },
    pos:        { sales: cr(), receipts: cr() },
    inventory:  { products: r(), categories: r() },
    customers:  { customers: cr() },
    ai:         { aiQueries: cr() },
  },
};

const STAFF = {
  templateKey: 'STAFF',
  name: 'Staff',
  description: 'Minimal read access. Suitable for delivery staff and general floor workers.',
  color: '#6B7280',
  isSystem: true,
  isOwner: false,
  permissions: {
    invoicing:  { invoices: r() },
    pos:        { sales: cr(), receipts: r() },
    inventory:  { products: r() },
    customers:  { customers: r() },
  },
};

const DEFAULT_TEMPLATES = { OWNER, ADMIN, MANAGER, ACCOUNTANT, CASHIER, STAFF };

module.exports = DEFAULT_TEMPLATES;
