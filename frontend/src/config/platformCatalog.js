/**
 * Syllabrix Platform Catalog — shared static data
 * Single source of truth for Module Registry and Role Templates on the frontend.
 * Feature keys match seed-module-features.js exactly (camelCase of DB featureKey).
 */

// ── Module Registry ───────────────────────────────────────────────────────────

export const MODULE_REGISTRY = {
  invoicing: { code: 'SYL-MOD-INV', label: 'Invoicing', category: 'Finance', features: {
    createInvoice:   'Create Invoice',
    pdfDownload:     'PDF Download',
    paymentRecord:   'Payment Recording',
    emailSend:       'Email Invoice',
    whatsappSend:    'WhatsApp Invoice',
    quotations:      'Quotations',
    creditNotes:     'Credit Notes',
    recurring:       'Recurring Invoices',
    overdueAlerts:   'Overdue Alerts',
    partialPayment:  'Partial Payments',
    bulkSend:        'Bulk Invoice Send',
  }},
  pos: { code: 'SYL-MOD-POS', label: 'Point of Sale', category: 'Commerce', features: {
    productSearch:       'Product Search',
    cashPayment:         'Cash Payment',
    receiptPrint:        'Receipt Print',
    categoryFilter:      'Category Filter',
    upiPayment:          'UPI Payment',
    upiQR:               'UPI QR Code',
    cardPayment:         'Card / Bank Payment',
    barcodeScanner:      'Barcode Scanner',
    billDiscount:        'Bill Discount',
    customerCapture:     'Customer Capture',
    salesHistory:        "Today's Sales History",
    gstBreakdown:        'GST Breakdown on Bill',
    holdBill:            'Hold / Park Bill',
    quickCash:           'Quick Cash Buttons',
    billNote:            'Bill Note',
    itemDiscount:        'Per-Item Discount',
    customItem:          'Custom / Ad-hoc Item',
    splitPayment:        'Split Payment',
    managerPinDiscount:  'Manager PIN for Discount',
    multiCashier:        'Multi-Cashier Sessions',
    tableAssignment:     'Table / Seat Assignment',
  }},
  inventory: { code: 'SYL-MOD-STK', label: 'Inventory', category: 'Commerce', features: {
    productList:    'Product List',
    stockAdjust:    'Stock Adjustment',
    categories:     'Product Categories',
    lowStockAlerts: 'Low Stock Alerts',
    purchaseOrders: 'Purchase Orders',
    barcodeLabels:  'Barcode Label Print',
    branchStock:    'Branch-wise Stock',
    stockTransfer:  'Stock Transfer',
    batchExpiry:    'Batch & Expiry Tracking',
    importExport:   'Bulk Import / Export',
  }},
  customers: { code: 'SYL-MOD-CUS', label: 'Customers', category: 'Commerce', features: {
    customerList:    'Customer List',
    customerProfile: 'Customer Profile',
    loyaltyPoints:   'Loyalty Points',
    customerCredit:  'Customer Credit',
    tags:            'Customer Tags',
    birthdayAlerts:  'Birthday Reminders',
    importExport:    'Import / Export',
    lifetimeValue:   'Customer Analytics',
  }},
  expenses: { code: 'SYL-MOD-EXP', label: 'Expenses', category: 'Finance', features: {
    expenseLog:        'Expense Log',
    categories:        'Expense Categories',
    receiptUpload:     'Receipt Upload',
    recurringExpenses: 'Recurring Expenses',
    expenseReports:    'Expense Reports',
    budgetTracking:    'Budget Tracking',
  }},
  vendors: { code: 'SYL-MOD-VND', label: 'Vendors & Bills', category: 'Finance', features: {
    vendorList:      'Vendor List',
    purchaseBills:   'Purchase Bills',
    purchaseOrders:  'Purchase Orders',
    grn:             'Goods Receipt Notes',
    paymentTracking: 'Payment Tracking',
    vendorLedger:    'Vendor Ledger',
  }},
  accounts: { code: 'SYL-MOD-ACC', label: 'Accounts', category: 'Finance', features: {
    bankAccounts:   'Bank Accounts',
    transactionLog: 'Transaction Log',
    reconciliation: 'Bank Reconciliation',
    profitLoss:     'Profit & Loss',
    balanceSheet:   'Balance Sheet',
    cashFlow:       'Cash Flow Projections',
  }},
  reports: { code: 'SYL-MOD-REP', label: 'Reports', category: 'Finance', features: {
    salesSummary:      'Sales Summary',
    gstReport:         'GST Report',
    expenseReport:     'Expense Report',
    productSales:      'Product-wise Sales',
    profitLoss:        'Profit & Loss',
    revenueTrends:     'Revenue Trends',
    exportExcel:       'Export to Excel',
    scheduledReports:  'Scheduled Reports',
  }},
  staff: { code: 'SYL-MOD-STF', label: 'Staff', category: 'People', features: {
    staffList:        'Staff List',
    departments:      'Departments',
    rolesPermissions: 'Roles & Permissions',
    certifications:   'Certifications & Skills',
    hrDocuments:      'HR Documents',
  }},
  attendance: { code: 'SYL-MOD-ATT', label: 'Attendance', category: 'People', features: {
    manualLog:       'Manual Attendance',
    monthlySummary:  'Monthly Summary',
    biometric:       'Biometric Integration',
    shiftManagement: 'Shift Management',
    overtime:        'Overtime Calculation',
  }},
  payroll: { code: 'SYL-MOD-PAY', label: 'Payroll', category: 'People', features: {
    salaryProcessing: 'Salary Processing',
    payslips:         'Payslips',
    deductions:       'PF / ESI / PT Deductions',
    allowances:       'Allowances',
    bankTransferList: 'Bank Transfer List',
    form16:           'Form 16 / IT Summary',
  }},
  appointments: { code: 'SYL-MOD-APT', label: 'Appointments', category: 'Service', features: {
    appointmentList: 'Appointment List',
    calendarView:    'Calendar View',
    staffAssignment: 'Staff Assignment',
    reminders:       'Appointment Reminders',
    statusTracking:  'Status Tracking',
    recurring:       'Recurring Appointments',
    waitlist:        'Waitlist Management',
  }},
  fees: { code: 'SYL-MOD-FEE', label: 'Fees', category: 'Service', features: {
    feeCollection:     'Fee Collection',
    feeStructure:      'Fee Structure',
    pendingAlerts:     'Pending Fee Alerts',
    bulkCollection:    'Bulk Fee Collection',
    scholarshipWaiver: 'Scholarship / Waiver',
  }},
  progress: { code: 'SYL-MOD-STU', label: 'Students', category: 'Service', features: {
    studentProfiles: 'Student Profiles',
    batchManagement: 'Batch / Class Management',
    homework:        'Homework Tracking',
    progressReports: 'Progress Reports',
    examManagement:  'Exam Management',
  }},
  assets: { code: 'SYL-MOD-AST', label: 'Assets', category: 'Finance', features: {
    assetRegister:  'Asset Register',
    depreciation:   'Depreciation (SLM)',
    maintenanceLog: 'Maintenance Logs',
    wdvDepreciation:'WDV Depreciation',
  }},
  lease: { code: 'SYL-MOD-LSE', label: 'Lease', category: 'Service', features: {
    leaseUnits:      'Lease Units',
    tenantProfiles:  'Tenant Profiles',
    rentCollection:  'Rent Collection',
    overdueAlerts:   'Overdue Rent Alerts',
    leaseRenewal:    'Lease Renewal Alerts',
    occupancyReport: 'Occupancy Report',
  }},
  membershipplans: { code: 'SYL-MOD-MBR', label: 'Memberships', category: 'Service', features: {
    planManagement:    'Membership Plans',
    memberEnrolment:   'Member Enrolment',
    expiryAlerts:      'Expiry Alerts',
    freezeMembership:  'Freeze Membership',
    referralTracking:  'Referral Tracking',
  }},
  whatsapp: { code: 'SYL-MOD-WA', label: 'WhatsApp', category: 'Comms', features: {
    manualMessages:    'Manual WhatsApp Messages',
    messageTemplates:  'Message Templates',
    deliveryStatus:    'Delivery Status',
    automatedMessages: 'Automated Messages',
    twoWayChat:        'Two-Way Chat',
  }},
  campaigns: { code: 'SYL-MOD-CMP', label: 'Campaigns', category: 'Comms', features: {
    createCampaign:    'Create Campaign',
    segmentedSend:     'Segment-based Send',
    scheduledSend:     'Scheduled Send',
    campaignAnalytics: 'Campaign Analytics',
    dripCampaigns:     'Drip Campaigns',
  }},
  b2b: { code: 'SYL-MOD-B2B', label: 'B2B Marketplace', category: 'Commerce', features: {
    supplierProfile:  'Supplier Profile',
    productCatalog:   'Product Catalog',
    connections:      'Buyer Connections',
    priceNegotiation: 'Price Negotiation',
    ratings:          'Ratings & Reviews',
  }},
  ai: { code: 'SYL-MOD-AIC', label: 'AI Copilot', category: 'Platform', features: {
    businessInsights: 'Business Insights',
    askAI:            'Ask AI',
    anomalyDetection: 'Anomaly Detection',
    forecasting:      'Revenue Forecasting',
    customReports:    'AI Custom Reports',
  }},
  automation: { code: 'SYL-MOD-AUT', label: 'Automation', category: 'Platform', features: {
    postSaleWhatsapp: 'Post-sale WhatsApp',
    dailyDigest:      'Daily Digest Email',
    lowStockAlert:    'Low Stock Automation',
    birthdayWishes:   'Birthday Wishes',
    paymentReminders: 'Payment Reminders',
    customWorkflows:  'Custom Workflow Builder',
  }},
  training: { code: 'SYL-MOD-TRN', label: 'Training Plans', category: 'Service', features: {
    exerciseLibrary: 'Exercise Library',
    workoutTemplates:'Workout Templates',
    trainingPlans:   'Member Training Plans',
    sessionLogs:     'Session Logs',
    bodyStats:       'Body Stats',
    trainerNotes:    'Trainer Notes',
  }},

  // ── SYL-BC-HLC clinic modules ───────────────────────────────────────────────
  opdqueue: { code: 'SYL-MOD-OPD', label: 'OPD Queue', category: 'Healthcare', features: {
    opdTokens:       'OPD Tokens',
    queueManagement: 'Queue Management',
    boardView:       'Live Board View',
  }},

  // ── Module 3 — Vitals Recording ──────────────────────────────────────────────
  vitals: { code: 'SYL-MOD-VIT', label: 'Vitals Recording', category: 'Healthcare', features: {
    recordVitals:    'Record Vitals (BP, Pulse, Temp, SpO₂, Weight)',
    bmiCalc:         'BMI Auto-calculation',
    vitalsHistory:   'Vitals Trend Graph',
    abnormalFlag:    'Abnormal Value Flagging',
    nurseWorkflow:   'Nurse Vitals Workflow View',
  }},

  clinicalNotes: { code: 'SYL-MOD-EMR', label: 'Clinical Notes / EMR', category: 'Healthcare', features: {
    soapNotes:      'SOAP Notes',
    patientHistory: 'Patient Visit History',
    diagnosisCodes: 'Diagnosis / ICD Codes',
  }},
  prescriptions: { code: 'SYL-MOD-RX', label: 'Prescriptions', category: 'Healthcare', features: {
    createRx:  'Write Prescription',
    rxHistory: 'Prescription History',
    printRx:   'Print Rx',
    aiSuggest: 'AI Prescription Suggest',
    qrVerify:  'QR-Verified Rx',
  }},
  labOrders: { code: 'SYL-MOD-LAB', label: 'Lab Orders & Reports', category: 'Healthcare', features: {
    labOrders:    'Lab Orders',
    labReports:   'Report Upload & View',
    referralSlip: 'Referral Slip Print',
    labCenters:   'Lab Center Directory',
  }},
  clinicBilling: { code: 'SYL-MOD-CBL', label: 'Clinic Billing', category: 'Healthcare', features: {
    clinicBills:   'Clinic Bills',
    dayEndSummary: 'Day-End Summary',
    outstanding:   'Outstanding Dues',
    pnlReport:     'Clinic P&L',
  }},
  clinicMedicines: { code: 'SYL-MOD-MED', label: 'Medicine Inventory', category: 'Healthcare', features: {
    medicineStock: 'Medicine Stock',
    batches:       'Batch Tracking',
    dispensing:    'Dispensing',
    scheduleH:     'Schedule H Register',
    expiryAlerts:  'Expiry Alerts',
  }},
  clinicDoctors: { code: 'SYL-MOD-DOC', label: 'Clinic Doctors', category: 'Healthcare', features: {
    doctorProfiles: 'Doctor Profiles',
    mciReg:         'MCI Registration',
    schedules:      'OPD Schedules & Fees',
  }},
  clinicPnl: { code: 'SYL-MOD-CPL', label: 'Clinic P&L', category: 'Healthcare', features: {
    pnlStatement:     'P&L Statement',
    revenueBreakdown: 'Revenue by Category',
    doctorRevenue:    'Doctor-wise Revenue',
  }},
  clinicReports: { code: 'SYL-MOD-CLR', label: 'Clinic Reports', category: 'Healthcare', features: {
    opdSummary:         'Daily OPD Summary',
    monthlyRevenue:     'Monthly Revenue Trend',
    patientGrowth:      'Patient Growth',
    diagnosisFrequency: 'Diagnosis Frequency',
    doctorPerformance:  'Doctor Performance',
  }},

  // ── Module 16 — ABDM / ABHA Integration ─────────────────────────────────────
  abdm: { code: 'SYL-MOD-ABDM', label: 'ABDM / ABHA', category: 'Healthcare', features: {
    abhaCapture:    'ABHA ID Capture & Linkage',
    healthRecordPush: 'Health Record Push to ABHA',
    abdmConfig:     'ABDM Facility Configuration',
    abhaStats:      'ABHA Coverage Stats',
  }},

  // ── Module 17 — Bed & Ward Management ────────────────────────────────────────
  ipdWards: { code: 'SYL-MOD-WRD', label: 'Wards & Beds', category: 'Healthcare', features: {
    wardManagement: 'Ward Management',
    bedManagement:  'Bed Management',
    bedStatusUpdate:'Bed Status (Occupied / Cleaning / Reserved)',
    occupancyReport:'Live Occupancy Report',
  }},

  // ── Modules 18–20 — IPD Admissions, Daily Rounds, Nursing Charts ─────────────
  ipdAdmissions: { code: 'SYL-MOD-IPD', label: 'IPD Admissions', category: 'Healthcare', features: {
    admitPatient:    'Admit Patient',
    admissionList:   'Admission List & Status',
    mlcFlag:         'MLC Case Flag',
    dailyRounds:     'Daily Rounds / Progress Notes',
    orderSheet:      'Doctor Order Sheet',
    nursingMAR:      'Nursing MAR — Medication Administration',
    vitalsChart:     'Vitals Chart & IV Fluids',
    intakeOutput:    'Intake-Output Chart',
    dischargeWorkflow:'Discharge Workflow',
    census:          'Daily Inpatient Census',
  }},

  // ── Module 21 — Discharge Summary ────────────────────────────────────────────
  dischargeSummary: { code: 'SYL-MOD-DSC', label: 'Discharge Summary', category: 'Healthcare', features: {
    createSummary:      'Create Discharge Summary',
    editSummary:        'Edit Clinical Fields',
    printSummary:       'Print A4 Discharge Summary',
    whatsappDelivery:   'WhatsApp PDF Delivery',
  }},

  // ── Module 22 — Operation Theatre ────────────────────────────────────────────
  otSessions: { code: 'SYL-MOD-OTS', label: 'Operation Theatre', category: 'Healthcare', features: {
    scheduleOT:      'Schedule OT Procedure',
    otClearance:     'Pre-op Clearance Checklist',
    intraopNotes:    'Intraoperative Notes',
    anesthesiaRecord:'Anesthesia Record',
    postOpOrders:    'Post-op Orders',
    otUtilization:   'OT Utilization Report',
  }},

  // ── Module 23 — LIMS Laboratory ──────────────────────────────────────────────
  lims: { code: 'SYL-MOD-LIM', label: 'LIMS — Laboratory', category: 'Healthcare', features: {
    testCatalog:     'Test Catalog Management',
    sampleCollection:'Sample Collection & Tracking',
    resultEntry:     'Result Entry',
    criticalAlerts:  'Critical Value Alerts',
    reportGeneration:'Lab Report Generation',
    qcTracking:      'Quality Control Tracking',
  }},

  // ── Module 24 — Radiology ─────────────────────────────────────────────────────
  radiology: { code: 'SYL-MOD-RAD', label: 'Radiology', category: 'Healthcare', features: {
    radiologyOrders: 'Radiology Orders',
    worklist:        'Technician Worklist',
    reportEntry:     'Radiologist Report Entry',
    imageAttach:     'Image Attachment',
    reportDelivery:  'Report Delivery',
  }},

  // ── Module 25 — Insurance & TPA ───────────────────────────────────────────────
  insuranceClaims: { code: 'SYL-MOD-INS', label: 'Insurance & TPA', category: 'Healthcare', features: {
    claimCreation:   'Claim Creation',
    preAuthorization:'Pre-Authorization Tracking',
    claimStatus:     'Claim Status Tracking',
    cashlessFlag:    'Cashless Admission Flag',
    settlementRecord:'Settlement Recording',
    outstandingReport:'Outstanding Claims Report',
  }},

};

export const MODULE_CATEGORY_COLORS = {
  Finance:    '#34D399',
  Commerce:   '#60A5FA',
  People:     '#A78BFA',
  Service:    '#FBBF24',
  Comms:      '#F472B6',
  Platform:   '#27DCFF',
  Healthcare: '#F87171',
};

// ── Permission presets ────────────────────────────────────────────────────────

export const P = {
  full: { C: true,  R: true,  U: true,  D: true  },
  cru:  { C: true,  R: true,  U: true,  D: false },
  cr:   { C: true,  R: true,  U: false, D: false },
  r:    { C: false, R: true,  U: false, D: false },
  none: { C: false, R: false, U: false, D: false },
};

// ── Standard role templates ───────────────────────────────────────────────────
// Permissions can be:
//   - A P preset directly (e.g. pos: P.cru) — applies to ALL features in that module
//   - A nested object (e.g. payroll: { payslips: P.r, payrollRun: P.none }) — feature-level

export const DEFAULT_ROLES = [
  {
    templateKey: 'OWNER', name: 'Owner', description: 'Full unrestricted access to everything. Cannot be edited.',
    color: '#7C3AED', isSystem: true, isOwner: true, appliesTo: 'all', permissions: {},
  },
  {
    templateKey: 'ADMIN', name: 'Admin', description: 'Full access to all modules. Cannot manage the Owner account.',
    color: '#2563EB', isSystem: true, isOwner: false, appliesTo: 'all',
    permissions: {
      invoicing:      P.cru,
      pos:            P.cru,
      inventory:      P.full,
      customers:      P.cru,
      expenses:       P.cru,
      vendors:        P.cru,
      accounts:       P.cru,
      reports:        P.r,
      staff:          P.cru,
      attendance:     P.cru,
      payroll:        P.cru,
      appointments:   P.cru,
      fees:           P.cru,
      progress:       P.cru,
      assets:         P.cru,
      lease:          P.cru,
      membershipplans:P.cru,
      whatsapp:       P.cr,
      campaigns:      P.cru,
      b2b:            P.cru,
      ai:             P.cr,
      automation:     P.cru,
      training:       P.full,
      // Clinic modules
      opdqueue:        P.cru,
      clinicalNotes:   P.full,
      prescriptions:   P.full,
      labOrders:       P.cru,
      clinicBilling:   P.cru,
      clinicMedicines: P.cru,
      clinicDoctors:   P.cru,
      clinicPnl:       P.r,
      clinicReports:   P.r,
      // Modules 3, 16–25
      vitals:           P.cru,
      abdm:             P.cru,
      ipdWards:         P.cru,
      ipdAdmissions:    P.full,
      dischargeSummary: P.full,
      otSessions:       P.full,
      lims:             P.full,
      radiology:        P.full,
      insuranceClaims:  P.full,
    },
  },
  {
    templateKey: 'MANAGER', name: 'Manager', description: 'Day-to-day operations. No payroll, no bank accounts, no role management.',
    color: '#0891B2', isSystem: true, isOwner: false, appliesTo: 'all',
    permissions: {
      invoicing:      P.cru,
      pos:            P.cru,
      inventory:      P.cru,
      customers:      P.cru,
      expenses:       P.cru,
      vendors:        P.r,
      accounts:       P.r,
      reports:        P.r,
      staff:          P.r,
      attendance:     P.cru,
      appointments:   P.cru,
      fees:           P.cru,
      progress:       P.cru,
      assets:         P.r,
      lease:          { leaseUnits: P.r, tenantProfiles: P.r, rentCollection: P.cru, overdueAlerts: P.r, leaseRenewal: P.r, occupancyReport: P.r },
      membershipplans:P.cru,
      whatsapp:       P.cr,
      campaigns:      P.cru,
      b2b:            P.r,
      ai:             P.cr,
      automation:     P.r,
      training:       P.cru,
      // Clinic modules
      opdqueue:        P.cru,
      clinicalNotes:   P.cru,
      prescriptions:   P.cru,
      labOrders:       P.cru,
      clinicBilling:   P.cru,
      clinicMedicines: P.r,
      clinicDoctors:   P.r,
      clinicPnl:       P.r,
      clinicReports:   P.r,
      // Modules 3, 16–25
      vitals:           P.cru,
      abdm:             P.cru,
      ipdWards:         P.cru,
      ipdAdmissions:    P.cru,
      dischargeSummary: P.cru,
      otSessions:       P.cru,
      lims:             P.cru,
      radiology:        P.cru,
      insuranceClaims:  P.cru,
    },
  },
  {
    templateKey: 'ACCOUNTANT', name: 'Accountant', description: 'Invoices, expenses, accounts and financial reports only.',
    color: '#D97706', isSystem: true, isOwner: false, appliesTo: 'all',
    permissions: {
      invoicing:      P.cru,
      pos:            { receiptPrint: P.r, salesHistory: P.r, gstBreakdown: P.r },
      inventory:      P.r,
      customers:      P.r,
      expenses:       P.full,
      vendors:        P.full,
      accounts:       P.cru,
      reports:        P.r,
      payroll:        { salaryProcessing: P.r, payslips: P.r, deductions: P.r, allowances: P.r },
      fees:           P.cru,
      assets:         P.cru,
      membershipplans:P.r,
      ai:             P.cr,
    },
  },
  {
    templateKey: 'CASHIER', name: 'Cashier', description: 'POS sales and basic invoicing only.',
    color: '#059669', isSystem: true, isOwner: false, appliesTo: 'all',
    permissions: {
      invoicing:  { createInvoice: P.cr, pdfDownload: P.r, paymentRecord: P.cr, quotations: P.cr },
      pos:        P.cr,
      inventory:  P.r,
      customers:  P.cr,
      ai:         P.cr,
    },
  },
  {
    templateKey: 'STAFF', name: 'Staff', description: 'Minimal read access for general floor workers.',
    color: '#6B7280', isSystem: true, isOwner: false, appliesTo: 'all',
    permissions: {
      invoicing:  { createInvoice: P.r, pdfDownload: P.r },
      pos:        P.cr,
      inventory:  P.r,
      customers:  P.r,
    },
  },
];

// ── Business-specific role templates ─────────────────────────────────────────

const educationTypes = ['COACHING', 'HOME_TUITION', 'MUSIC_SCHOOL', 'DANCE_ACADEMY', 'DRIVING_SCHOOL', 'COMPUTER_TRAINING'];
const gymTypes       = ['GYM', 'CROSSFIT_STUDIO'];
const fitnessTypes   = ['YOGA_STUDIO', 'MARTIAL_ARTS', 'SPORTS_ACADEMY', 'SWIMMING_ACADEMY'];

export const EXTRA_ROLES = [
  // ── SYL-BC-FIT — GYM + CROSSFIT_STUDIO ──────────────────────────────────────
  {
    templateKey: 'TRAINER', name: 'Trainer', description: 'Manages member sessions and workout plans.',
    color: '#F59E0B', isSystem: false, appliesTo: gymTypes,
    permissions: {
      appointments:    P.cru,
      customers:       P.r,
      membershipplans: P.r,
      attendance:      P.cr,
      training:        P.cru,
    },
  },
  {
    templateKey: 'FRONT_DESK', name: 'Front Desk', description: 'Handles member check-in, fee collection and POS.',
    color: '#10B981', isSystem: false, appliesTo: gymTypes,
    permissions: {
      pos:             P.cr,
      fees:            { feeCollection: P.cr, feeStructure: P.r, pendingAlerts: P.r },
      customers:       P.cru,
      appointments:    P.cru,
      attendance:      P.cr,
      membershipplans: P.r,
      training:        { trainingPlans: P.r, exerciseLibrary: P.r },
    },
  },
  // ── SYL-BC-FIT — YOGA / MARTIAL_ARTS / SPORTS / SWIMMING ─────────────────────
  {
    templateKey: 'INSTRUCTOR', name: 'Instructor', description: 'Teaches classes and manages member progress.',
    color: '#F59E0B', isSystem: false, appliesTo: fitnessTypes,
    permissions: {
      appointments:    P.cru,
      customers:       P.r,
      membershipplans: P.r,
      attendance:      P.cr,
    },
  },
  {
    templateKey: 'FRONT_DESK', name: 'Front Desk', description: 'Handles member check-in and fee collection.',
    color: '#10B981', isSystem: false, appliesTo: fitnessTypes,
    permissions: {
      fees:            { feeCollection: P.cr, feeStructure: P.r, pendingAlerts: P.r },
      customers:       P.cru,
      appointments:    P.cru,
      attendance:      P.cr,
      membershipplans: P.r,
    },
  },
  // ── SYL-BC-FIT — SPA ─────────────────────────────────────────────────────────
  {
    templateKey: 'THERAPIST', name: 'Therapist', description: 'Manages personal appointments and service POS.',
    color: '#8B5CF6', isSystem: false, appliesTo: ['SPA'],
    permissions: {
      appointments: P.cru,
      pos:          { productSearch: P.r, cashPayment: P.cr, receiptPrint: P.cr, upiPayment: P.cr },
      customers:    P.r,
    },
  },
  {
    templateKey: 'RECEPTIONIST', name: 'Receptionist', description: 'Front desk: books appointments and processes payments.',
    color: '#EC4899', isSystem: false, appliesTo: ['SPA'],
    permissions: {
      appointments: P.cru,
      pos:          P.cr,
      customers:    P.cru,
      attendance:   P.cr,
    },
  },
  // ── SYL-BC-HLC — CLINIC, DENTAL, HOSPITAL, DIAGNOSTIC_LAB, PHYSIOTHERAPY, AYURVEDA, VET_CLINIC ──
  {
    templateKey: 'DOCTOR', name: 'Doctor',
    description: 'Full clinical access — EMR, prescriptions, lab orders, reports. No billing.',
    color: '#3B82F6', isSystem: false,
    appliesTo: ['CLINIC', 'DENTAL', 'HOSPITAL', 'DIAGNOSTIC_LAB', 'PHYSIOTHERAPY', 'AYURVEDA', 'VET_CLINIC'],
    permissions: {
      appointments:  P.cru,
      customers:     P.r,
      opdqueue:      { opdTokens: P.r, queueManagement: P.r },
      vitals:        P.r,
      clinicalNotes: P.full,
      prescriptions: P.full,
      labOrders:     { labOrders: P.cru, labReports: P.r, referralSlip: P.r, labCenters: P.r },
      clinicReports: P.r,
      clinicPnl:     P.r,
      clinicDoctors: P.cru,
      // Modules 16–25
      abdm:             P.r,
      ipdAdmissions:    { admitPatient: P.r, admissionList: P.r, dailyRounds: P.full, orderSheet: P.full, nursingMAR: P.r, vitalsChart: P.r, intakeOutput: P.r, dischargeSummary: P.full, census: P.r },
      dischargeSummary: P.full,
      otSessions:       P.full,
      lims:             { sampleCollection: P.r, resultEntry: P.r, criticalAlerts: P.r, reportGeneration: P.r },
      radiology:        { radiologyOrders: P.cru, worklist: P.r, reportEntry: P.full, reportDelivery: P.r },
      insuranceClaims:  P.r,
    },
  },
  {
    templateKey: 'RECEPTIONIST', name: 'Receptionist',
    description: 'Patient registration, OPD queue, appointments, billing. Cannot view clinical notes.',
    color: '#8B5CF6', isSystem: false,
    appliesTo: ['CLINIC', 'DENTAL', 'HOSPITAL', 'PHYSIOTHERAPY', 'AYURVEDA', 'VET_CLINIC'],
    permissions: {
      appointments:  P.cru,
      customers:     P.cru,
      opdqueue:      P.cru,
      clinicBilling: P.cru,
      labOrders:     { labOrders: P.cr, labReports: P.cr, referralSlip: P.r },
      prescriptions: { rxHistory: P.r, printRx: P.r },
      whatsapp:      P.cr,
      // Modules 16–25
      abdm:             { abhaCapture: P.cru, abhaStats: P.r },
      ipdAdmissions:    { admitPatient: P.cr, admissionList: P.r, mlcFlag: P.r, census: P.r, dischargeSummary: P.r },
      insuranceClaims:  { claimCreation: P.cr, preAuthorization: P.cr, claimStatus: P.r, cashlessFlag: P.cr },
    },
  },
  {
    templateKey: 'NURSE', name: 'Nurse',
    description: 'Vitals recording, OPD queue management, medicine dispensing.',
    color: '#EC4899', isSystem: false,
    appliesTo: ['CLINIC', 'HOSPITAL', 'PHYSIOTHERAPY'],
    permissions: {
      appointments:    P.r,
      customers:       P.r,
      opdqueue:        P.cru,
      vitals:          P.full,
      clinicMedicines: { medicineStock: P.r, batches: P.r, dispensing: P.cr },
      // Modules 16–25
      ipdAdmissions:   { nursingMAR: P.full, vitalsChart: P.full, intakeOutput: P.full, admissionList: P.r },
      dischargeSummary:{ printSummary: P.r },
    },
  },
  {
    templateKey: 'LAB_TECHNICIAN', name: 'Lab Technician',
    description: 'Manages lab orders, uploads test reports, and operates LIMS.',
    color: '#06B6D4', isSystem: false,
    appliesTo: ['CLINIC', 'HOSPITAL', 'DIAGNOSTIC_LAB'],
    permissions: {
      customers: P.r,
      labOrders: P.cru,
      lims:      P.full,
    },
  },
  {
    templateKey: 'PHARMACIST', name: 'Pharmacist',
    description: 'Medicine inventory, dispensing, and Schedule H register.',
    color: '#10B981', isSystem: false,
    appliesTo: ['CLINIC', 'HOSPITAL'],
    permissions: {
      customers:       P.r,
      prescriptions:   { rxHistory: P.r, printRx: P.r },
      clinicMedicines: P.full,
    },
  },
  // ── SYL-BC-HLC — HOSPITAL — Specialist roles ─────────────────────────────────
  {
    templateKey: 'RADIOLOGIST', name: 'Radiologist',
    description: 'Reports on radiology investigations — reads worklist, enters findings and impression.',
    color: '#a855f7', isSystem: false,
    appliesTo: ['HOSPITAL'],
    permissions: {
      customers:  P.r,
      radiology:  P.full,
    },
  },
  {
    templateKey: 'ANESTHESIOLOGIST', name: 'Anesthesiologist',
    description: 'Manages OT anesthesia records, pre-op fitness assessment, and intraoperative notes.',
    color: '#f97316', isSystem: false,
    appliesTo: ['NURSING_HOME', 'HOSPITAL'],
    permissions: {
      customers:   P.r,
      otSessions:  P.full,
      ipdAdmissions: { admissionList: P.r, dailyRounds: P.r, orderSheet: P.r },
    },
  },
  // ── SYL-BC-HLC — NURSING_HOME, HOSPITAL — IPD-specific roles ─────────────────
  {
    templateKey: 'WARD_NURSE', name: 'Ward Nurse',
    description: 'IPD nursing staff — MAR, vitals, intake-output, progress note acknowledgment.',
    color: '#EC4899', isSystem: false,
    appliesTo: ['NURSING_HOME', 'HOSPITAL'],
    permissions: {
      customers:        P.r,
      appointments:     P.r,
      vitals:           P.full,
      ipdAdmissions:    { admissionList: P.r, nursingMAR: P.full, vitalsChart: P.full, intakeOutput: P.full, orderSheet: P.r, dailyRounds: P.r },
      ipdWards:         { bedStatusUpdate: P.cr, occupancyReport: P.r },
      dischargeSummary: { printSummary: P.r },
    },
  },
  {
    templateKey: 'WARD_BOY', name: 'Ward Boy',
    description: 'Bed status update only — marks beds as cleaned/available after discharge.',
    color: '#6B7280', isSystem: false,
    appliesTo: ['NURSING_HOME', 'HOSPITAL'],
    permissions: {
      ipdWards:      { bedStatusUpdate: P.cr },
      ipdAdmissions: { admissionList: P.r },
    },
  },
  // ── Education ─────────────────────────────────────────────────────────────────
  {
    templateKey: 'TEACHER', name: 'Teacher', description: 'Manages student progress, homework and teaching logs.',
    color: '#7C3AED', isSystem: false, appliesTo: educationTypes,
    permissions: {
      progress:  { studentProfiles: P.r, batchManagement: P.r, homework: P.cru, progressReports: P.cru },
      customers: P.r,
    },
  },
  {
    templateKey: 'COORDINATOR', name: 'Coordinator', description: 'Manages fee collection and student enrolment.',
    color: '#F97316', isSystem: false, appliesTo: educationTypes,
    permissions: {
      fees:      P.cru,
      progress:  { studentProfiles: P.cru, batchManagement: P.cru, homework: P.r, progressReports: P.r },
      customers: P.cru,
      invoicing: { createInvoice: P.cr, pdfDownload: P.r, paymentRecord: P.cr },
    },
  },
  // ── SALON ─────────────────────────────────────────────────────────────────────
  {
    templateKey: 'STYLIST', name: 'Stylist', description: 'Manages personal appointments and service-based POS.',
    color: '#EC4899', isSystem: false, appliesTo: ['SALON'],
    permissions: {
      appointments: P.cru,
      pos:          { productSearch: P.r, cashPayment: P.cr, receiptPrint: P.cr, upiPayment: P.cr },
      customers:    P.r,
    },
  },
  // ── RESTAURANT ────────────────────────────────────────────────────────────────
  {
    templateKey: 'WAITER', name: 'Waiter', description: 'Creates POS orders and processes table payments.',
    color: '#F59E0B', isSystem: false, appliesTo: ['RESTAURANT'],
    permissions: {
      pos:       P.cr,
      inventory: P.r,
    },
  },
  {
    templateKey: 'CHEF', name: 'Chef', description: 'Views kitchen orders and manages inventory consumption.',
    color: '#EF4444', isSystem: false, appliesTo: ['RESTAURANT'],
    permissions: {
      pos:       { productSearch: P.r, salesHistory: P.r },
      inventory: P.r,
    },
  },
  // ── MALL ──────────────────────────────────────────────────────────────────────
  {
    templateKey: 'SECURITY', name: 'Security', description: 'Views lease unit information and attendance logs.',
    color: '#6B7280', isSystem: false, appliesTo: ['MALL'],
    permissions: {
      lease:      { leaseUnits: P.r, tenantProfiles: P.r },
      attendance: P.r,
    },
  },
  // ── BEAUTY_PARLOUR ────────────────────────────────────────────────────────────
  {
    templateKey: 'BEAUTICIAN', name: 'Beautician', description: 'Manages personal appointments and service POS.',
    color: '#EC4899', isSystem: false, appliesTo: ['BEAUTY_PARLOUR'],
    permissions: {
      appointments: P.cru,
      pos:          { productSearch: P.r, cashPayment: P.cr, receiptPrint: P.cr, upiPayment: P.cr },
      customers:    P.r,
    },
  },
  // ── BARBERSHOP ────────────────────────────────────────────────────────────────
  {
    templateKey: 'BARBER', name: 'Barber', description: 'Manages walk-in appointments and POS.',
    color: '#0891B2', isSystem: false, appliesTo: ['BARBERSHOP'],
    permissions: {
      appointments: P.cru,
      pos:          { productSearch: P.r, cashPayment: P.cr, receiptPrint: P.cr, upiPayment: P.cr },
      customers:    P.r,
    },
  },
  // ── DENTAL ────────────────────────────────────────────────────────────────────
  {
    templateKey: 'DENTIST', name: 'Dentist', description: 'Manages patient appointments and dental records.',
    color: '#3B82F6', isSystem: false, appliesTo: ['DENTAL'],
    permissions: {
      appointments: P.cru,
      customers:    P.r,
    },
  },
];

export const ALL_ROLES = [...DEFAULT_ROLES, ...EXTRA_ROLES];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getPerm(role, moduleKey, featureKey) {
  if (role.isOwner) return P.full;
  const modPerms = role.permissions?.[moduleKey];
  if (!modPerms) return P.none;
  // Module-level flat permission (the object IS a P preset — has C/R/U/D boolean keys directly)
  if ('C' in modPerms || 'R' in modPerms) return modPerms;
  // Feature-level: look up by feature key
  return modPerms[featureKey] ?? P.none;
}

export function getModuleAccess(role, moduleKey) {
  if (role.isOwner) return true;
  const mp = role.permissions?.[moduleKey];
  if (!mp) return false;
  // Module-level flat permission
  if ('C' in mp || 'R' in mp) return mp.R || mp.C || mp.U || mp.D;
  // Feature-level permissions object
  return Object.values(mp).some((p) => p?.R || p?.C || p?.U || p?.D);
}

export function getCoverage(role, moduleKeys) {
  let accessible = 0, total = 0;
  for (const mk of moduleKeys) {
    for (const fk of Object.keys(MODULE_REGISTRY[mk]?.features || {})) {
      total++;
      if (getPerm(role, mk, fk).R) accessible++;
    }
  }
  return { accessible, total, pct: total > 0 ? Math.round((accessible / total) * 100) : 0 };
}

export const CRUD_COLORS = { C: '#34D399', R: '#60A5FA', U: '#FBBF24', D: '#F87171' };
