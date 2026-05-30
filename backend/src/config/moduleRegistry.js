/**
 * Syllabrix Module Registry
 * Single source of truth for every module and its features.
 * Codes are permanent — see docs/SYLLABRIX_STANDARDS.md Section 5.
 *
 * Structure:
 *   moduleKey → { code, label, features: { featureKey → label } }
 */

const MODULE_REGISTRY = {
  invoicing: {
    code: 'SYL-MOD-INV', label: 'Invoicing',
    features: {
      invoices:           'Invoices',
      creditNotes:        'Credit Notes',
      quotations:         'Quotations',
      recurringInvoices:  'Recurring Invoices',
      returns:            'Returns & Refunds',
    },
  },
  pos: {
    code: 'SYL-MOD-POS', label: 'Point of Sale',
    features: {
      sales:    'Sales',
      receipts: 'Receipts',
    },
  },
  inventory: {
    code: 'SYL-MOD-STK', label: 'Inventory',
    features: {
      products:       'Products',
      categories:     'Categories',
      stockAlerts:    'Stock Alerts',
      purchaseOrders: 'Purchase Orders',
    },
  },
  customers: {
    code: 'SYL-MOD-CUS', label: 'Customers',
    features: {
      customers:     'Customers',
      customerCredit: 'Customer Credit',
    },
  },
  expenses: {
    code: 'SYL-MOD-EXP', label: 'Expenses',
    features: {
      expenses: 'Expenses',
    },
  },
  vendors: {
    code: 'SYL-MOD-VND', label: 'Vendors & Bills',
    features: {
      vendors: 'Vendors',
      bills:   'Purchase Bills',
    },
  },
  accounts: {
    code: 'SYL-MOD-ACC', label: 'Accounts',
    features: {
      transactions: 'Transactions',
      bankAccounts: 'Bank Accounts',
    },
  },
  reports: {
    code: 'SYL-MOD-REP', label: 'Reports',
    features: {
      salesReport:   'Sales Report',
      expenseReport: 'Expense Report',
      gstReport:     'GST Report',
      profitLoss:    'Profit & Loss',
      balanceSheet:  'Balance Sheet',
    },
  },
  staff: {
    code: 'SYL-MOD-STF', label: 'Staff',
    features: {
      staffMembers: 'Staff Members',
      roles:        'Roles & Permissions',
    },
  },
  attendance: {
    code: 'SYL-MOD-ATT', label: 'Attendance',
    features: {
      attendance: 'Attendance Logs',
      biometric:  'Biometric',
    },
  },
  payroll: {
    code: 'SYL-MOD-PAY', label: 'Payroll',
    features: {
      payslips:   'Payslips',
      payrollRun: 'Payroll Run',
    },
  },
  appointments: {
    code: 'SYL-MOD-APT', label: 'Appointments',
    features: {
      appointments: 'Appointments',
    },
  },
  fees: {
    code: 'SYL-MOD-FEE', label: 'Fees',
    features: {
      feeRecords:   'Fee Records',
      feeStructure: 'Fee Structure',
    },
  },
  students: {
    code: 'SYL-MOD-STU', label: 'Students',
    features: {
      students: 'Students',
      progress: 'Progress & Homework',
    },
  },
  assets: {
    code: 'SYL-MOD-AST', label: 'Assets',
    features: {
      assets:       'Assets',
      depreciation: 'Depreciation',
    },
  },
  lease: {
    code: 'SYL-MOD-LSE', label: 'Lease',
    features: {
      leaseUnits:     'Lease Units',
      leaseTenants:   'Lease Tenants',
      rentCollection: 'Rent Collection',
    },
  },
  membershipplans: {
    code: 'SYL-MOD-MBR', label: 'Memberships',
    features: {
      membershipPlans:     'Membership Plans',
      memberSubscriptions: 'Subscriptions',
    },
  },
  whatsapp: {
    code: 'SYL-MOD-WA', label: 'WhatsApp',
    features: {
      messages:  'Messages',
      templates: 'Templates',
    },
  },
  campaigns: {
    code: 'SYL-MOD-CMP', label: 'Campaigns',
    features: {
      campaigns:    'Campaigns',
      bulkMessages: 'Bulk Messages',
    },
  },
  b2b: {
    code: 'SYL-MOD-B2B', label: 'B2B Marketplace',
    features: {
      supplierProfiles: 'Supplier Profiles',
      connections:      'Connections',
    },
  },
  ai: {
    code: 'SYL-MOD-AIC', label: 'AI Copilot',
    features: {
      aiQueries: 'AI Queries',
    },
  },
  automation: {
    code: 'SYL-MOD-AUT', label: 'Automation',
    features: {
      automationRules: 'Automation Rules',
      digests:         'Digests',
    },
  },
};

module.exports = MODULE_REGISTRY;
