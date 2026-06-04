// Maps URL path prefixes → module context for the in-app issue reporter.
// Longest prefix wins (checked in order by key length desc at runtime).
export const ROUTE_MODULE_MAP = {
  '/recurring-invoices': {
    module: 'recurringinvoices',
    label: 'Recurring Invoices',
    features: ['Invoice Schedule List', 'Create Recurring Invoice', 'Toggle Active/Paused', 'Generate Due Invoices', 'Edit Schedule'],
  },
  '/membership-plans': {
    module: 'memberships',
    label: 'Membership Plans',
    features: ['Plan List', 'Create Plan', 'Toggle Active', 'Edit Plan', 'Active Members Count'],
  },
  '/credit-notes': {
    module: 'creditnotes',
    label: 'Credit Notes',
    features: ['Credit Note List', 'Create Credit Note', 'Apply to Invoice', 'Status Update', 'Print / Download'],
  },
  '/appointments': {
    module: 'appointments',
    label: 'Appointments',
    features: ['Schedule View', 'Services Management', 'Calendar', 'Status Update', 'WhatsApp Reminder'],
  },
  '/opd-queue': {
    module: 'opdqueue',
    label: 'OPD Queue',
    features: ['Token Assignment', 'Queue Status', 'Call Next Token', 'Mark No-Show', 'Live Board View', 'Day Stats'],
  },
  '/emr': {
    module: 'clinicalNotes',
    label: 'Clinical Notes / EMR',
    features: ['SOAP Notes (S/O/A/P)', 'Patient Visit History', 'Diagnosis / ICD Codes', 'Follow-up Date', 'Copy Previous Note'],
  },
  '/prescriptions': {
    module: 'prescriptions',
    label: 'Prescriptions',
    features: ['Write Prescription', 'Drug Search', 'Frequency / Duration / Instructions', 'Print Rx', 'AI Suggest', 'QR Verification', 'Rx History'],
  },
  '/lab-orders': {
    module: 'labOrders',
    label: 'Lab Orders & Reports',
    features: ['Create Lab Order', 'Test Catalog', 'Referral Slip Print', 'Report Upload', 'Mark Viewed', 'Lab Centers'],
  },
  '/clinic-billing': {
    module: 'clinicBilling',
    label: 'Clinic Billing',
    features: ['Create Bill', 'Consultation / Procedure Quick-Add', 'GST Treatment', 'Multi-mode Payment', 'Day-End Summary', 'Outstanding Dues', 'Print Bill'],
  },
  '/clinic-medicines': {
    module: 'clinicMedicines',
    label: 'Medicine Inventory',
    features: ['Medicine Master', 'Add Stock Batch', 'Expiry Alerts', 'Low Stock Alerts', 'Dispensing', 'Schedule H Register', 'Supplier Directory'],
  },
  '/clinic-doctors': {
    module: 'clinicDoctors',
    label: 'Clinic Doctors',
    features: ['Doctor Profiles', 'MCI Registration', 'Specialization', 'Consultation Fees', 'Available Days', 'OPD Timings'],
  },
  '/clinic-pnl': {
    module: 'clinicPnl',
    label: 'Clinic P&L',
    features: ['Revenue by Category', 'Expense Summary', 'P&L Statement', 'Doctor-wise Revenue', 'Month / Year Picker'],
  },
  '/clinic-reports': {
    module: 'clinicReports',
    label: 'Clinic Reports',
    features: ['Daily OPD Summary', 'OPD Trend (30 days)', 'Monthly Revenue Chart', 'Patient Growth', 'Diagnosis Frequency', 'Doctor Performance'],
  },
  '/marketplace': {
    module: 'b2b',
    label: 'B2B Marketplace',
    features: ['Supplier Search', 'Display Catalog', 'Partnership Requests', 'Negotiations', 'Ratings & Reviews'],
  },
  '/quotations': {
    module: 'quotations',
    label: 'Quotations',
    features: ['Quotation List', 'Create Quotation', 'Convert to Invoice', 'Status Update', 'Print / Download'],
  },
  '/dashboard': {
    module: 'dashboard',
    label: 'Dashboard',
    features: ['KPI Summary', 'Quick Stats', 'Quick Actions', 'Recent Activity', 'Low Stock Alerts'],
  },
  '/inventory': {
    module: 'inventory',
    label: 'Inventory',
    features: ['Product List', 'Add / Edit Product', 'Stock Adjustment', 'Categories', 'Low Stock Alerts', 'Expiry Tracking', 'Barcode'],
  },
  '/customers': {
    module: 'customers',
    label: 'Customers',
    features: ['Customer List', 'Customer Profile', 'Payment History', 'Credit Balance', 'Subscriptions', 'Add Customer'],
  },
  '/invoices': {
    module: 'invoicing',
    label: 'Invoices',
    features: ['Invoice List', 'Create Invoice', 'Send via WhatsApp', 'Record Payment', 'GST Preview', 'Cancel Invoice', 'Download PDF'],
  },
  '/expenses': {
    module: 'expenses',
    label: 'Expenses',
    features: ['Expense List', 'Create Expense', 'Receipt Upload', 'Expense Summary', 'Edit / Delete'],
  },
  '/vendors': {
    module: 'vendors',
    label: 'Vendors & Purchases',
    features: ['Vendor List', 'Purchase Orders', 'Goods Receipt (GRN)', 'Reorder Suggestions', 'Vendor Catalog', 'Vendor Bills'],
  },
  '/reports': {
    module: 'reports',
    label: 'Reports',
    features: ['Sales Report', 'Invoice Report', 'Expense Report', 'P&L Statement', 'Balance Sheet', 'Cash Flow', 'GST (GSTR-1)', 'GST (GSTR-3B)', 'TDS Report', 'Cash Book', 'Creditor Aging', 'Top Products', 'Top Customers'],
  },
  '/returns': {
    module: 'returns',
    label: 'Returns & Refunds',
    features: ['Return List', 'Process Return', 'Invoice Lookup', 'Receipt Lookup', 'Return Summary'],
  },
  '/accounts': {
    module: 'accounts',
    label: 'Bank Accounts',
    features: ['Account List', 'Account Transactions', 'Add Transaction', 'Total Balance View'],
  },
  '/campaigns': {
    module: 'campaigns',
    label: 'Campaigns',
    features: ['Campaign List', 'Create Campaign', 'Customer Segments', 'Send Campaign', 'Recipients View'],
  },
  '/progress': {
    module: 'progress',
    label: 'Progress & Homework',
    features: ['Homework List', 'Teaching Log', 'Exams', 'Student Progress', 'Bulk Submission Update'],
  },
  '/whatsapp': {
    module: 'whatsapp',
    label: 'WhatsApp',
    features: ['Conversations', 'Send Message', 'Invoice Share', 'Fee Reminder', 'Rent Reminder', 'Bulk Reminders'],
  },
  '/assets': {
    module: 'assets',
    label: 'Assets',
    features: ['Asset List', 'Add Asset', 'Depreciation View', 'Maintenance Log', 'Asset Disposal', 'Categories'],
  },
  '/staff': {
    module: 'staff',
    label: 'Staff & Attendance',
    features: ['Staff List', 'Add Staff', 'Punch In / Out', 'Attendance Report', 'Payroll Runs', 'Monthly Summary'],
  },
  '/lease': {
    module: 'lease',
    label: 'Lease',
    features: ['Units List', 'Active Leases', 'Rent Due', 'Create Lease', 'Terminate Lease'],
  },
  '/fees': {
    module: 'fees',
    label: 'Fees',
    features: ['Student List', 'Fee Collection', 'Overdue Fees', 'Fee History', 'Waiver', 'Add Student'],
  },
  '/pos': {
    module: 'pos',
    label: 'Point of Sale',
    features: ['New Sale / Billing', 'Transaction History', 'Receipt Print', 'Barcode Scan', 'Discount Apply'],
  },
  '/ai': {
    module: 'ai',
    label: 'AI Copilot',
    features: ['Chat Interface', 'Business Insights', 'Auto Suggestions', 'Data Analysis'],
  },
  '/settings': {
    module: 'settings',
    label: 'Settings',
    features: ['Business Profile', 'Users & Roles', 'Receipt Configuration', 'GST Settings', 'Automation Rules', 'Integrations'],
  },
};

// Returns the module context for a given pathname.
// Checks longest matching prefix first.
export function getModuleForPath(pathname) {
  const sorted = Object.keys(ROUTE_MODULE_MAP).sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    if (pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?')) {
      return { key: ROUTE_MODULE_MAP[prefix].module, ...ROUTE_MODULE_MAP[prefix] };
    }
  }
  return null;
}

// Maps issue type labels → TicketCategory enum
export const ISSUE_TYPE_OPTIONS = [
  { value: 'TECHNICAL',       label: 'Not loading / Error / Crash' },
  { value: 'DATA_ISSUE',      label: 'Wrong data / Calculation issue' },
  { value: 'ROLE_REQUEST',    label: 'Permission / Access problem' },
  { value: 'FEATURE_REQUEST', label: 'Feature not working as expected' },
  { value: 'BILLING',         label: 'Billing / Plan issue' },
  { value: 'OTHER',           label: 'Other' },
];

export const SEVERITY_OPTIONS = [
  { value: 'LOW',      label: 'Low — minor inconvenience' },
  { value: 'MEDIUM',   label: 'Medium — affects daily work' },
  { value: 'HIGH',     label: 'High — blocking a key workflow' },
  { value: 'CRITICAL', label: 'Critical — data loss / system down' },
];
