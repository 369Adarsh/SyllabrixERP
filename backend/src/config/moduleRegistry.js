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

  // ── SYL-BC-HLC clinic modules ─────────────────────────────────────────────
  opdqueue: {
    code: 'SYL-MOD-OPD', label: 'OPD Queue',
    features: {
      opdTokens:       'OPD Tokens',
      queueManagement: 'Queue Management',
      boardView:       'Live Board View',
    },
  },
  clinicalNotes: {
    code: 'SYL-MOD-EMR', label: 'Clinical Notes / EMR',
    features: {
      soapNotes:      'SOAP Notes',
      patientHistory: 'Patient Visit History',
      diagnosisCodes: 'Diagnosis / ICD Codes',
    },
  },
  prescriptions: {
    code: 'SYL-MOD-RX', label: 'Prescriptions',
    features: {
      createRx:    'Write Prescription',
      rxHistory:   'Prescription History',
      printRx:     'Print Rx',
      aiSuggest:   'AI Prescription Suggest',
      qrVerify:    'QR-Verified Rx',
    },
  },
  labOrders: {
    code: 'SYL-MOD-LAB', label: 'Lab Orders & Reports',
    features: {
      labOrders:    'Lab Orders',
      labReports:   'Report Upload & View',
      referralSlip: 'Referral Slip Print',
      labCenters:   'Lab Center Directory',
    },
  },
  clinicBilling: {
    code: 'SYL-MOD-CBL', label: 'Clinic Billing',
    features: {
      clinicBills:    'Clinic Bills',
      dayEndSummary:  'Day-End Summary',
      outstanding:    'Outstanding Dues',
      pnlReport:      'Clinic P&L',
    },
  },
  clinicMedicines: {
    code: 'SYL-MOD-MED', label: 'Medicine Inventory',
    features: {
      medicineStock: 'Medicine Stock',
      batches:       'Batch Tracking',
      dispensing:    'Dispensing',
      scheduleH:     'Schedule H Register',
      expiryAlerts:  'Expiry Alerts',
    },
  },
  clinicDoctors: {
    code: 'SYL-MOD-DOC', label: 'Clinic Doctors',
    features: {
      doctorProfiles: 'Doctor Profiles',
      mciReg:         'MCI Registration',
      schedules:      'OPD Schedules & Fees',
    },
  },
  clinicPnl: {
    code: 'SYL-MOD-CPL', label: 'Clinic P&L',
    features: {
      pnlStatement:     'P&L Statement',
      revenueBreakdown: 'Revenue by Category',
      doctorRevenue:    'Doctor-wise Revenue',
    },
  },
  clinicReports: {
    code: 'SYL-MOD-CLR', label: 'Clinic Reports',
    features: {
      opdSummary:          'Daily OPD Summary',
      monthlyRevenue:      'Monthly Revenue Trend',
      patientGrowth:       'Patient Growth',
      diagnosisFrequency:  'Diagnosis Frequency',
      doctorPerformance:   'Doctor Performance',
    },
  },
};

module.exports = MODULE_REGISTRY;
