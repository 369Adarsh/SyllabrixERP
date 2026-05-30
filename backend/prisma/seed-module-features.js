/**
 * Seeds the full ModuleFeature catalog for all Syllabrix modules.
 * Run: node prisma/seed-module-features.js
 *
 * Module codes match platformCatalog.js MODULE_REGISTRY exactly.
 * Tiers: BASIC → STANDARD → ADVANCED → ENTERPRISE
 * Plan mapping:
 *   STARTER    → BASIC
 *   GROWTH     → BASIC + STANDARD
 *   SCALE      → BASIC + STANDARD + ADVANCED
 *   (ENTERPRISE features are highest-tier add-ons)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FEATURES = [

  // ─── POINT OF SALE (SYL-MOD-POS) ────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.product_search',      name: 'Product Search',            tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Search products by name, SKU or barcode text' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.cash_payment',        name: 'Cash Payment',              tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Accept cash with change calculation' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.receipt_print',       name: 'Receipt Print',             tier: 'BASIC',      defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Print or download bill as PDF after every sale' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.category_filter',     name: 'Category Filter',           tier: 'BASIC',      defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Filter products by category tabs' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.upi_payment',         name: 'UPI Payment',               tier: 'STANDARD',   defaultOn: true,  sortOrder: 5,  dependencies: [], description: 'Accept UPI — manual cashier confirmation' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.upi_qr',              name: 'UPI QR Code',               tier: 'STANDARD',   defaultOn: true,  sortOrder: 6,  dependencies: ['pos.upi_payment'], description: 'Auto-generate scannable QR for exact amount' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.card_payment',        name: 'Card / Bank Payment',       tier: 'STANDARD',   defaultOn: true,  sortOrder: 7,  dependencies: [], description: 'Record card or bank transfer payments' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.barcode_scanner',     name: 'Barcode Scanner',           tier: 'STANDARD',   defaultOn: true,  sortOrder: 8,  dependencies: [], description: 'Scan barcodes via camera to add products instantly' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.discount',            name: 'Bill Discount',             tier: 'STANDARD',   defaultOn: true,  sortOrder: 9,  dependencies: [], description: 'Apply flat ₹ or % discount on overall bill' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.customer_capture',    name: 'Customer Capture',          tier: 'STANDARD',   defaultOn: true,  sortOrder: 10, dependencies: [], description: 'Link each sale to a new or existing customer record' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.sales_history',       name: "Today's Sales History",     tier: 'STANDARD',   defaultOn: true,  sortOrder: 11, dependencies: [], description: "View all bills from today — click to reprint" },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.gst_breakdown',       name: 'GST Breakdown on Bill',     tier: 'STANDARD',   defaultOn: true,  sortOrder: 12, dependencies: [], description: 'Show CGST/SGST split per rate group on screen and receipt' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.hold_bill',           name: 'Hold / Park Bill',          tier: 'ADVANCED',   defaultOn: true,  sortOrder: 13, dependencies: [], description: 'Park current cart and start a new one — restore anytime' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.quick_cash',          name: 'Quick Cash Buttons',        tier: 'ADVANCED',   defaultOn: true,  sortOrder: 14, dependencies: ['pos.cash_payment'], description: 'One-tap preset amounts: ₹50, ₹100, ₹200, ₹500…' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.bill_note',           name: 'Bill Note',                 tier: 'ADVANCED',   defaultOn: true,  sortOrder: 15, dependencies: [], description: 'Add a short note to each sale (e.g. gift wrap, delivery)' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.item_discount',       name: 'Per-Item Discount',         tier: 'ADVANCED',   defaultOn: false, sortOrder: 16, dependencies: ['pos.discount'], description: 'Apply discount on individual line items in the cart' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.custom_item',         name: 'Custom / Ad-hoc Item',      tier: 'ADVANCED',   defaultOn: false, sortOrder: 17, dependencies: [], description: 'Add unlisted item with custom name and price to any bill' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.split_payment',       name: 'Split Payment',             tier: 'ADVANCED',   defaultOn: false, sortOrder: 18, dependencies: ['pos.cash_payment', 'pos.upi_payment'], description: 'Accept part cash + part UPI in one transaction' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.manager_pin_discount',name: 'Manager PIN for Discount',  tier: 'ENTERPRISE', defaultOn: false, sortOrder: 19, dependencies: ['pos.discount'], description: 'Require manager PIN approval before cashier applies discount' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.multi_cashier',       name: 'Multi-Cashier Sessions',    tier: 'ENTERPRISE', defaultOn: false, sortOrder: 20, dependencies: [], description: 'Track which staff processed each sale for accountability' },
  { moduleKey: 'SYL-MOD-POS', featureKey: 'pos.table_assignment',    name: 'Table / Seat Assignment',   tier: 'ENTERPRISE', defaultOn: false, sortOrder: 21, dependencies: [], description: 'Assign bills to a table or seat — for restaurants and cafes' },

  // ─── INVENTORY (SYL-MOD-STK) ────────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-STK', featureKey: 'stk.product_list',        name: 'Product List',              tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'View and manage all products with stock levels' },
  { moduleKey: 'SYL-MOD-STK', featureKey: 'stk.stock_adjustment',    name: 'Stock Adjustment',          tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Manually adjust stock with reason tracking' },
  { moduleKey: 'SYL-MOD-STK', featureKey: 'stk.categories',          name: 'Product Categories',        tier: 'BASIC',      defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Organise products into categories and sub-categories' },
  { moduleKey: 'SYL-MOD-STK', featureKey: 'stk.low_stock_alerts',    name: 'Low Stock Alerts',          tier: 'STANDARD',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Alert when stock falls below the set threshold' },
  { moduleKey: 'SYL-MOD-STK', featureKey: 'stk.purchase_orders',     name: 'Purchase Orders',           tier: 'STANDARD',   defaultOn: true,  sortOrder: 5,  dependencies: [], description: 'Create and track purchase orders sent to vendors' },
  { moduleKey: 'SYL-MOD-STK', featureKey: 'stk.barcode_labels',      name: 'Barcode Label Print',       tier: 'STANDARD',   defaultOn: false, sortOrder: 6,  dependencies: [], description: 'Print barcode labels for products directly from inventory' },
  { moduleKey: 'SYL-MOD-STK', featureKey: 'stk.branch_stock',        name: 'Branch-wise Stock',         tier: 'ADVANCED',   defaultOn: true,  sortOrder: 7,  dependencies: [], description: 'Separate stock levels tracked per branch location' },
  { moduleKey: 'SYL-MOD-STK', featureKey: 'stk.stock_transfer',      name: 'Stock Transfer',            tier: 'ADVANCED',   defaultOn: true,  sortOrder: 8,  dependencies: ['stk.branch_stock'], description: 'Move stock between branches with transfer records' },
  { moduleKey: 'SYL-MOD-STK', featureKey: 'stk.batch_expiry',        name: 'Batch & Expiry Tracking',   tier: 'ENTERPRISE', defaultOn: false, sortOrder: 9,  dependencies: [], description: 'Track batch numbers and expiry dates — pharma/food essential' },
  { moduleKey: 'SYL-MOD-STK', featureKey: 'stk.import_export',       name: 'Bulk Import / Export',      tier: 'ENTERPRISE', defaultOn: false, sortOrder: 10, dependencies: [], description: 'Import products via CSV; export full inventory to Excel' },

  // ─── INVOICING (SYL-MOD-INV) ────────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-INV', featureKey: 'inv.create_invoice',      name: 'Create Invoice',            tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Create GST-compliant invoices for customers' },
  { moduleKey: 'SYL-MOD-INV', featureKey: 'inv.pdf_download',        name: 'PDF Download',              tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Download invoices as branded PDF' },
  { moduleKey: 'SYL-MOD-INV', featureKey: 'inv.payment_record',      name: 'Payment Recording',         tier: 'BASIC',      defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Mark invoices as paid and record payment method' },
  { moduleKey: 'SYL-MOD-INV', featureKey: 'inv.email_send',          name: 'Email Invoice',             tier: 'STANDARD',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Send invoice directly to customer email' },
  { moduleKey: 'SYL-MOD-INV', featureKey: 'inv.whatsapp_send',       name: 'WhatsApp Invoice',          tier: 'STANDARD',   defaultOn: true,  sortOrder: 5,  dependencies: [], description: 'Send invoice link via WhatsApp' },
  { moduleKey: 'SYL-MOD-INV', featureKey: 'inv.quotations',          name: 'Quotations',                tier: 'STANDARD',   defaultOn: true,  sortOrder: 6,  dependencies: [], description: 'Create quotes and convert to invoice with one click' },
  { moduleKey: 'SYL-MOD-INV', featureKey: 'inv.credit_notes',        name: 'Credit Notes',              tier: 'STANDARD',   defaultOn: true,  sortOrder: 7,  dependencies: [], description: 'Issue credit notes for returns and adjustments' },
  { moduleKey: 'SYL-MOD-INV', featureKey: 'inv.recurring',           name: 'Recurring Invoices',        tier: 'ADVANCED',   defaultOn: true,  sortOrder: 8,  dependencies: [], description: 'Auto-generate invoices on a schedule (weekly/monthly)' },
  { moduleKey: 'SYL-MOD-INV', featureKey: 'inv.overdue_alerts',      name: 'Overdue Alerts',            tier: 'ADVANCED',   defaultOn: true,  sortOrder: 9,  dependencies: [], description: 'Auto-remind customers about overdue invoices' },
  { moduleKey: 'SYL-MOD-INV', featureKey: 'inv.partial_payment',     name: 'Partial Payments',          tier: 'ADVANCED',   defaultOn: false, sortOrder: 10, dependencies: [], description: 'Record multiple partial payments against a single invoice' },
  { moduleKey: 'SYL-MOD-INV', featureKey: 'inv.bulk_send',           name: 'Bulk Invoice Send',         tier: 'ENTERPRISE', defaultOn: false, sortOrder: 11, dependencies: [], description: 'Send invoices to multiple customers in one action' },

  // ─── CUSTOMERS (SYL-MOD-CUS) ────────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-CUS', featureKey: 'cus.customer_list',       name: 'Customer List',             tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'View and manage all customer profiles' },
  { moduleKey: 'SYL-MOD-CUS', featureKey: 'cus.customer_profile',    name: 'Customer Profile',          tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Name, phone, email, address and visit history' },
  { moduleKey: 'SYL-MOD-CUS', featureKey: 'cus.loyalty_points',      name: 'Loyalty Points',            tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Track and redeem loyalty points on each purchase' },
  { moduleKey: 'SYL-MOD-CUS', featureKey: 'cus.customer_credit',     name: 'Customer Credit',           tier: 'STANDARD',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Set credit limits and track outstanding balances' },
  { moduleKey: 'SYL-MOD-CUS', featureKey: 'cus.tags',                name: 'Customer Tags',             tier: 'STANDARD',   defaultOn: true,  sortOrder: 5,  dependencies: [], description: 'Tag customers for segmentation (VIP, Regular, Wholesale)' },
  { moduleKey: 'SYL-MOD-CUS', featureKey: 'cus.birthday_alerts',     name: 'Birthday Reminders',        tier: 'ADVANCED',   defaultOn: true,  sortOrder: 6,  dependencies: [], description: 'Get reminded of customer birthdays for personalised outreach' },
  { moduleKey: 'SYL-MOD-CUS', featureKey: 'cus.import_export',       name: 'Import / Export',           tier: 'ADVANCED',   defaultOn: false, sortOrder: 7,  dependencies: [], description: 'Bulk import customers from CSV; export full list' },
  { moduleKey: 'SYL-MOD-CUS', featureKey: 'cus.lifetime_value',      name: 'Customer Analytics',        tier: 'ENTERPRISE', defaultOn: false, sortOrder: 8,  dependencies: [], description: 'Lifetime value, purchase frequency, retention rate per customer' },

  // ─── EXPENSES (SYL-MOD-EXP) ─────────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-EXP', featureKey: 'exp.expense_log',         name: 'Expense Log',               tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Record all business expenses with date and amount' },
  { moduleKey: 'SYL-MOD-EXP', featureKey: 'exp.categories',          name: 'Expense Categories',        tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Organise expenses into categories (Rent, Utilities, Salaries)' },
  { moduleKey: 'SYL-MOD-EXP', featureKey: 'exp.receipt_upload',      name: 'Receipt Upload',            tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Attach bill photo or PDF to each expense record' },
  { moduleKey: 'SYL-MOD-EXP', featureKey: 'exp.recurring_expenses',  name: 'Recurring Expenses',        tier: 'STANDARD',   defaultOn: false, sortOrder: 4,  dependencies: [], description: 'Auto-log fixed expenses that repeat monthly (rent, subscriptions)' },
  { moduleKey: 'SYL-MOD-EXP', featureKey: 'exp.expense_reports',     name: 'Expense Reports',           tier: 'ADVANCED',   defaultOn: true,  sortOrder: 5,  dependencies: [], description: 'Category-wise and date-range expense breakdowns' },
  { moduleKey: 'SYL-MOD-EXP', featureKey: 'exp.budget_tracking',     name: 'Budget Tracking',           tier: 'ENTERPRISE', defaultOn: false, sortOrder: 6,  dependencies: [], description: 'Set monthly budgets per category and track overspending' },

  // ─── VENDORS & BILLS (SYL-MOD-VND) ──────────────────────────────────────────
  { moduleKey: 'SYL-MOD-VND', featureKey: 'vnd.vendor_list',         name: 'Vendor List',               tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'View and manage all supplier profiles' },
  { moduleKey: 'SYL-MOD-VND', featureKey: 'vnd.purchase_bills',      name: 'Purchase Bills',            tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Record bills received from vendors' },
  { moduleKey: 'SYL-MOD-VND', featureKey: 'vnd.purchase_orders',     name: 'Purchase Orders',           tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Raise and track purchase orders sent to vendors' },
  { moduleKey: 'SYL-MOD-VND', featureKey: 'vnd.grn',                 name: 'Goods Receipt Notes',       tier: 'STANDARD',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Confirm received goods and update inventory automatically' },
  { moduleKey: 'SYL-MOD-VND', featureKey: 'vnd.payment_tracking',    name: 'Payment Tracking',          tier: 'ADVANCED',   defaultOn: true,  sortOrder: 5,  dependencies: [], description: 'Track outstanding payments due to each vendor' },
  { moduleKey: 'SYL-MOD-VND', featureKey: 'vnd.vendor_ledger',       name: 'Vendor Ledger',             tier: 'ENTERPRISE', defaultOn: false, sortOrder: 6,  dependencies: [], description: 'Full transaction history per vendor with running balance' },

  // ─── BANK ACCOUNTS (SYL-MOD-ACC) ────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-ACC', featureKey: 'acc.bank_accounts',       name: 'Bank Accounts',             tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Track multiple bank/cash account balances' },
  { moduleKey: 'SYL-MOD-ACC', featureKey: 'acc.transaction_log',     name: 'Transaction Log',           tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Record credits and debits for each account' },
  { moduleKey: 'SYL-MOD-ACC', featureKey: 'acc.reconciliation',      name: 'Bank Reconciliation',       tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Match bank statement entries to recorded transactions' },
  { moduleKey: 'SYL-MOD-ACC', featureKey: 'acc.profit_loss',         name: 'Profit & Loss',             tier: 'ADVANCED',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Auto-generated P&L statement from income and expenses' },
  { moduleKey: 'SYL-MOD-ACC', featureKey: 'acc.balance_sheet',       name: 'Balance Sheet',             tier: 'ADVANCED',   defaultOn: false, sortOrder: 5,  dependencies: [], description: 'Assets, liabilities and equity snapshot' },
  { moduleKey: 'SYL-MOD-ACC', featureKey: 'acc.cash_flow',           name: 'Cash Flow Projections',     tier: 'ENTERPRISE', defaultOn: false, sortOrder: 6,  dependencies: [], description: '30/60/90-day cash flow forecast based on receivables and payables' },

  // ─── REPORTS (SYL-MOD-REP) ──────────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-REP', featureKey: 'rep.sales_summary',       name: 'Sales Summary',             tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Daily and monthly sales totals with payment method breakdown' },
  { moduleKey: 'SYL-MOD-REP', featureKey: 'rep.gst_report',          name: 'GST Report',                tier: 'STANDARD',   defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'GSTR-ready output: taxable value, CGST, SGST by rate slab' },
  { moduleKey: 'SYL-MOD-REP', featureKey: 'rep.expense_report',      name: 'Expense Report',            tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Category-wise expense breakdown for any date range' },
  { moduleKey: 'SYL-MOD-REP', featureKey: 'rep.product_sales',       name: 'Product-wise Sales',        tier: 'STANDARD',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Which products sold the most — quantity and revenue' },
  { moduleKey: 'SYL-MOD-REP', featureKey: 'rep.profit_loss',         name: 'Profit & Loss',             tier: 'ADVANCED',   defaultOn: true,  sortOrder: 5,  dependencies: [], description: 'Revenue minus expenses = net profit for any period' },
  { moduleKey: 'SYL-MOD-REP', featureKey: 'rep.revenue_trends',      name: 'Revenue Trends',            tier: 'ADVANCED',   defaultOn: true,  sortOrder: 6,  dependencies: [], description: '7-day and 30-day revenue charts with comparison to prior period' },
  { moduleKey: 'SYL-MOD-REP', featureKey: 'rep.export_excel',        name: 'Export to Excel',           tier: 'ADVANCED',   defaultOn: false, sortOrder: 7,  dependencies: [], description: 'Download any report as Excel / CSV file' },
  { moduleKey: 'SYL-MOD-REP', featureKey: 'rep.scheduled_reports',   name: 'Scheduled Reports',         tier: 'ENTERPRISE', defaultOn: false, sortOrder: 8,  dependencies: [], description: 'Auto-send reports to your email on a daily/weekly schedule' },

  // ─── STAFF & HR (SYL-MOD-STF) ───────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-STF', featureKey: 'stf.staff_list',          name: 'Staff List',                tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'View and manage all staff profiles' },
  { moduleKey: 'SYL-MOD-STF', featureKey: 'stf.departments',         name: 'Departments',               tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Organise staff into departments' },
  { moduleKey: 'SYL-MOD-STF', featureKey: 'stf.roles_permissions',   name: 'Roles & Permissions',       tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Create custom roles with granular module permissions' },
  { moduleKey: 'SYL-MOD-STF', featureKey: 'stf.certifications',      name: 'Certifications & Skills',   tier: 'ADVANCED',   defaultOn: false, sortOrder: 4,  dependencies: [], description: 'Track staff certifications, skills and renewal dates' },
  { moduleKey: 'SYL-MOD-STF', featureKey: 'stf.hr_documents',        name: 'HR Documents',              tier: 'ENTERPRISE', defaultOn: false, sortOrder: 5,  dependencies: [], description: 'Store offer letters, ID proofs and contracts per staff member' },

  // ─── ATTENDANCE (SYL-MOD-ATT) ───────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-ATT', featureKey: 'att.manual_log',          name: 'Manual Attendance',         tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Mark attendance manually — present, absent, half day' },
  { moduleKey: 'SYL-MOD-ATT', featureKey: 'att.monthly_summary',     name: 'Monthly Summary',           tier: 'STANDARD',   defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Monthly attendance report with present/absent/leave count' },
  { moduleKey: 'SYL-MOD-ATT', featureKey: 'att.biometric',           name: 'Biometric Integration',     tier: 'ADVANCED',   defaultOn: false, sortOrder: 3,  dependencies: [], description: 'Connect biometric/fingerprint device for auto attendance' },
  { moduleKey: 'SYL-MOD-ATT', featureKey: 'att.shift_management',    name: 'Shift Management',          tier: 'ADVANCED',   defaultOn: false, sortOrder: 4,  dependencies: [], description: 'Define morning/evening/night shifts and assign to staff' },
  { moduleKey: 'SYL-MOD-ATT', featureKey: 'att.overtime',            name: 'Overtime Calculation',      tier: 'ENTERPRISE', defaultOn: false, sortOrder: 5,  dependencies: ['att.shift_management'], description: 'Auto-calculate overtime hours and cost based on shift rules' },

  // ─── PAYROLL (SYL-MOD-PAY) ──────────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-PAY', featureKey: 'pay.salary_processing',   name: 'Salary Processing',         tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Process monthly salaries and generate payslips' },
  { moduleKey: 'SYL-MOD-PAY', featureKey: 'pay.payslips',            name: 'Payslips',                  tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Generate and download payslips for each staff member' },
  { moduleKey: 'SYL-MOD-PAY', featureKey: 'pay.deductions',          name: 'PF / ESI / PT Deductions',  tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Statutory deductions: Provident Fund, ESI, Professional Tax' },
  { moduleKey: 'SYL-MOD-PAY', featureKey: 'pay.allowances',          name: 'Allowances',                tier: 'STANDARD',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'HRA, travel, medical and other custom allowances' },
  { moduleKey: 'SYL-MOD-PAY', featureKey: 'pay.bank_transfer_list',  name: 'Bank Transfer List',        tier: 'ADVANCED',   defaultOn: false, sortOrder: 5,  dependencies: [], description: 'Export salary transfer list ready for bulk bank upload' },
  { moduleKey: 'SYL-MOD-PAY', featureKey: 'pay.form16',              name: 'Form 16 / IT Summary',      tier: 'ENTERPRISE', defaultOn: false, sortOrder: 6,  dependencies: [], description: 'Annual salary summary and Form 16 generation for income tax' },

  // ─── APPOINTMENTS (SYL-MOD-APT) ─────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-APT', featureKey: 'apt.appointment_list',    name: 'Appointment List',          tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Create and view all scheduled appointments' },
  { moduleKey: 'SYL-MOD-APT', featureKey: 'apt.calendar_view',       name: 'Calendar View',             tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Day/week/month calendar view of appointments' },
  { moduleKey: 'SYL-MOD-APT', featureKey: 'apt.staff_assignment',    name: 'Staff Assignment',          tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Assign each appointment to a specific staff member' },
  { moduleKey: 'SYL-MOD-APT', featureKey: 'apt.reminders',           name: 'Appointment Reminders',     tier: 'STANDARD',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Auto WhatsApp reminder to customer before appointment' },
  { moduleKey: 'SYL-MOD-APT', featureKey: 'apt.status_tracking',     name: 'Status Tracking',           tier: 'STANDARD',   defaultOn: true,  sortOrder: 5,  dependencies: [], description: 'Track booked → confirmed → completed → cancelled flow' },
  { moduleKey: 'SYL-MOD-APT', featureKey: 'apt.recurring',           name: 'Recurring Appointments',    tier: 'ADVANCED',   defaultOn: false, sortOrder: 6,  dependencies: [], description: 'Auto-create repeat appointments on a fixed schedule' },
  { moduleKey: 'SYL-MOD-APT', featureKey: 'apt.waitlist',            name: 'Waitlist Management',       tier: 'ENTERPRISE', defaultOn: false, sortOrder: 7,  dependencies: [], description: 'Maintain a waitlist and auto-notify when a slot opens up' },

  // ─── FEES (SYL-MOD-FEE) ─────────────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-FEE', featureKey: 'fee.fee_collection',      name: 'Fee Collection',            tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Collect fees and generate receipts for students' },
  { moduleKey: 'SYL-MOD-FEE', featureKey: 'fee.fee_structure',       name: 'Fee Structure',             tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Define fee heads: tuition, transport, lab, activity etc.' },
  { moduleKey: 'SYL-MOD-FEE', featureKey: 'fee.pending_alerts',      name: 'Pending Fee Alerts',        tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Alert for students with overdue fee payments' },
  { moduleKey: 'SYL-MOD-FEE', featureKey: 'fee.bulk_collection',     name: 'Bulk Fee Collection',       tier: 'ADVANCED',   defaultOn: false, sortOrder: 4,  dependencies: [], description: 'Collect fees for an entire batch/class in one step' },
  { moduleKey: 'SYL-MOD-FEE', featureKey: 'fee.scholarship_waiver',  name: 'Scholarship / Waiver',      tier: 'ENTERPRISE', defaultOn: false, sortOrder: 5,  dependencies: [], description: 'Apply partial or full fee waivers with approval tracking' },

  // ─── STUDENTS (SYL-MOD-STU) ─────────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-STU', featureKey: 'stu.student_profiles',    name: 'Student Profiles',          tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Enrol students and manage their basic details' },
  { moduleKey: 'SYL-MOD-STU', featureKey: 'stu.batch_management',    name: 'Batch / Class Management',  tier: 'STANDARD',   defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Assign students to batches and manage class schedules' },
  { moduleKey: 'SYL-MOD-STU', featureKey: 'stu.homework',            name: 'Homework Tracking',         tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Assign and track homework completion per student' },
  { moduleKey: 'SYL-MOD-STU', featureKey: 'stu.progress_reports',    name: 'Progress Reports',          tier: 'ADVANCED',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Academic progress and exam result tracking per student' },
  { moduleKey: 'SYL-MOD-STU', featureKey: 'stu.exam_management',     name: 'Exam Management',           tier: 'ENTERPRISE', defaultOn: false, sortOrder: 5,  dependencies: [], description: 'Schedule exams, record marks and generate marksheets' },

  // ─── ASSETS (SYL-MOD-AST) ───────────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-AST', featureKey: 'ast.asset_register',      name: 'Asset Register',            tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Maintain a register of all fixed assets with purchase details' },
  { moduleKey: 'SYL-MOD-AST', featureKey: 'ast.depreciation',        name: 'Depreciation (SLM)',        tier: 'STANDARD',   defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Straight-line depreciation auto-calculated per asset' },
  { moduleKey: 'SYL-MOD-AST', featureKey: 'ast.maintenance_log',     name: 'Maintenance Logs',          tier: 'ADVANCED',   defaultOn: false, sortOrder: 3,  dependencies: [], description: 'Track servicing, repairs and maintenance schedules per asset' },
  { moduleKey: 'SYL-MOD-AST', featureKey: 'ast.wdv_depreciation',    name: 'WDV Depreciation',          tier: 'ENTERPRISE', defaultOn: false, sortOrder: 4,  dependencies: [], description: 'Written-down value method depreciation for tax purposes' },

  // ─── LEASE / PROPERTY (SYL-MOD-LSE) ─────────────────────────────────────────
  { moduleKey: 'SYL-MOD-LSE', featureKey: 'lse.lease_units',         name: 'Lease Units',               tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Add and manage properties/units available for lease' },
  { moduleKey: 'SYL-MOD-LSE', featureKey: 'lse.tenant_profiles',     name: 'Tenant Profiles',           tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Manage tenant details, KYC and contact information' },
  { moduleKey: 'SYL-MOD-LSE', featureKey: 'lse.rent_collection',     name: 'Rent Collection',           tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Record monthly rent payments and generate receipts' },
  { moduleKey: 'SYL-MOD-LSE', featureKey: 'lse.overdue_alerts',      name: 'Overdue Rent Alerts',       tier: 'STANDARD',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Alert for tenants with pending rent payments' },
  { moduleKey: 'SYL-MOD-LSE', featureKey: 'lse.lease_renewal',       name: 'Lease Renewal Alerts',      tier: 'ADVANCED',   defaultOn: true,  sortOrder: 5,  dependencies: [], description: 'Alert when lease agreements are due for renewal' },
  { moduleKey: 'SYL-MOD-LSE', featureKey: 'lse.occupancy_report',    name: 'Occupancy Report',          tier: 'ENTERPRISE', defaultOn: false, sortOrder: 6,  dependencies: [], description: 'Portfolio-level occupancy rate and revenue per property' },

  // ─── MEMBERSHIPS (SYL-MOD-MBR) ──────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-MBR', featureKey: 'mbr.plan_management',     name: 'Membership Plans',          tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Create and manage membership tiers (Monthly, Quarterly, Annual)' },
  { moduleKey: 'SYL-MOD-MBR', featureKey: 'mbr.member_enrolment',    name: 'Member Enrolment',          tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Enrol customers into membership plans' },
  { moduleKey: 'SYL-MOD-MBR', featureKey: 'mbr.expiry_alerts',       name: 'Expiry Alerts',             tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Auto-alert when member plans are about to expire' },
  { moduleKey: 'SYL-MOD-MBR', featureKey: 'mbr.freeze_membership',   name: 'Freeze Membership',         tier: 'ADVANCED',   defaultOn: false, sortOrder: 4,  dependencies: [], description: 'Pause a membership for a fixed period (illness, travel)' },
  { moduleKey: 'SYL-MOD-MBR', featureKey: 'mbr.referral_tracking',   name: 'Referral Tracking',         tier: 'ENTERPRISE', defaultOn: false, sortOrder: 5,  dependencies: [], description: 'Track which member referred a new enrolment' },

  // ─── WHATSAPP (SYL-MOD-WA) ──────────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-WA',  featureKey: 'wa.manual_messages',      name: 'Manual WhatsApp Messages',  tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Send individual WhatsApp messages to customers' },
  { moduleKey: 'SYL-MOD-WA',  featureKey: 'wa.message_templates',    name: 'Message Templates',         tier: 'STANDARD',   defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Save reusable message templates for quick sending' },
  { moduleKey: 'SYL-MOD-WA',  featureKey: 'wa.delivery_status',      name: 'Delivery Status',           tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Track sent / delivered / read status for each message' },
  { moduleKey: 'SYL-MOD-WA',  featureKey: 'wa.automated_messages',   name: 'Automated Messages',        tier: 'ADVANCED',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Auto-send after sale, appointment reminder, birthday wishes' },
  { moduleKey: 'SYL-MOD-WA',  featureKey: 'wa.two_way_chat',         name: 'Two-Way Chat',              tier: 'ENTERPRISE', defaultOn: false, sortOrder: 5,  dependencies: [], description: 'Receive and reply to customer WhatsApp messages in-app' },

  // ─── CAMPAIGNS (SYL-MOD-CMP) ────────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-CMP', featureKey: 'cmp.create_campaign',     name: 'Create Campaign',           tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Create and send bulk WhatsApp campaigns to customers' },
  { moduleKey: 'SYL-MOD-CMP', featureKey: 'cmp.segmented_send',      name: 'Segment-based Send',        tier: 'STANDARD',   defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Target campaigns to a segment: VIP, inactive, birthday this month' },
  { moduleKey: 'SYL-MOD-CMP', featureKey: 'cmp.scheduled_send',      name: 'Scheduled Send',            tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Schedule campaigns for future date and time' },
  { moduleKey: 'SYL-MOD-CMP', featureKey: 'cmp.campaign_analytics',  name: 'Campaign Analytics',        tier: 'ADVANCED',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Delivery rate, open rate and response tracking per campaign' },
  { moduleKey: 'SYL-MOD-CMP', featureKey: 'cmp.drip_campaigns',      name: 'Drip Campaigns',            tier: 'ENTERPRISE', defaultOn: false, sortOrder: 5,  dependencies: [], description: 'Multi-step automated message sequences over days/weeks' },

  // ─── AI COPILOT (SYL-MOD-AIC) ───────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-AIC', featureKey: 'ai.business_insights',    name: 'Business Insights',         tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'AI-generated daily business summary and key insights' },
  { moduleKey: 'SYL-MOD-AIC', featureKey: 'ai.ask_ai',               name: 'Ask AI',                    tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Chat with AI about your business data in plain language' },
  { moduleKey: 'SYL-MOD-AIC', featureKey: 'ai.anomaly_detection',    name: 'Anomaly Detection',         tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'AI flags unusual patterns: revenue spikes, sudden drops' },
  { moduleKey: 'SYL-MOD-AIC', featureKey: 'ai.forecasting',          name: 'Revenue Forecasting',       tier: 'ADVANCED',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'AI-predicted revenue for next 30/60/90 days' },
  { moduleKey: 'SYL-MOD-AIC', featureKey: 'ai.custom_reports',       name: 'AI Custom Reports',         tier: 'ENTERPRISE', defaultOn: false, sortOrder: 5,  dependencies: [], description: 'Ask AI to generate any custom report in natural language' },

  // ─── AUTOMATION (SYL-MOD-AUT) ───────────────────────────────────────────────
  { moduleKey: 'SYL-MOD-AUT', featureKey: 'aut.post_sale_whatsapp',  name: 'Post-sale WhatsApp',        tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Auto-send WhatsApp receipt/thank-you after each POS sale' },
  { moduleKey: 'SYL-MOD-AUT', featureKey: 'aut.daily_digest',        name: 'Daily Digest Email',        tier: 'STANDARD',   defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'Daily business summary email to owner every morning' },
  { moduleKey: 'SYL-MOD-AUT', featureKey: 'aut.low_stock_alert',     name: 'Low Stock Automation',      tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Auto-WhatsApp alert to owner when stock hits threshold' },
  { moduleKey: 'SYL-MOD-AUT', featureKey: 'aut.birthday_wishes',     name: 'Birthday Wishes',           tier: 'ADVANCED',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Auto-send personalised birthday WhatsApp to customers' },
  { moduleKey: 'SYL-MOD-AUT', featureKey: 'aut.payment_reminders',   name: 'Payment Reminders',         tier: 'ADVANCED',   defaultOn: true,  sortOrder: 5,  dependencies: [], description: 'Auto-remind customers about overdue invoices via WhatsApp' },
  { moduleKey: 'SYL-MOD-AUT', featureKey: 'aut.custom_workflows',    name: 'Custom Workflow Builder',   tier: 'ENTERPRISE', defaultOn: false, sortOrder: 6,  dependencies: [], description: 'Build any trigger → condition → action automation without code' },

  // ─── B2B MARKETPLACE (SYL-MOD-B2B) ─────────────────────────────────────────
  { moduleKey: 'SYL-MOD-B2B', featureKey: 'b2b.supplier_profile',    name: 'Supplier Profile',          tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Create a public supplier profile in the B2B marketplace' },
  { moduleKey: 'SYL-MOD-B2B', featureKey: 'b2b.product_catalog',     name: 'Product Catalog',           tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: [], description: 'List products with wholesale pricing for B2B buyers' },
  { moduleKey: 'SYL-MOD-B2B', featureKey: 'b2b.connections',         name: 'Buyer Connections',         tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: [], description: 'Send and receive connection requests from other businesses' },
  { moduleKey: 'SYL-MOD-B2B', featureKey: 'b2b.price_negotiation',   name: 'Price Negotiation',         tier: 'ADVANCED',   defaultOn: true,  sortOrder: 4,  dependencies: [], description: 'Negotiate custom pricing with specific buyers in-platform' },
  { moduleKey: 'SYL-MOD-B2B', featureKey: 'b2b.ratings',             name: 'Ratings & Reviews',         tier: 'ENTERPRISE', defaultOn: false, sortOrder: 5,  dependencies: [], description: 'Rate and review your B2B trading partners' },

  // ─── TRAINING PLANS (SYL-MOD-TRN) ──────────────────────────────────────────
  { moduleKey: 'SYL-MOD-TRN', featureKey: 'trn.exercise_library',    name: 'Exercise Library',          tier: 'BASIC',      defaultOn: true,  sortOrder: 1,  dependencies: [], description: 'Library of exercises with instructions, muscles targeted, and difficulty level' },
  { moduleKey: 'SYL-MOD-TRN', featureKey: 'trn.workout_templates',   name: 'Workout Templates',         tier: 'BASIC',      defaultOn: true,  sortOrder: 2,  dependencies: ['trn.exercise_library'], description: 'Pre-built workout templates trainers can assign to members' },
  { moduleKey: 'SYL-MOD-TRN', featureKey: 'trn.training_plans',      name: 'Member Training Plans',     tier: 'STANDARD',   defaultOn: true,  sortOrder: 3,  dependencies: ['trn.workout_templates'], description: 'Custom weekly or monthly training plans assigned per member' },
  { moduleKey: 'SYL-MOD-TRN', featureKey: 'trn.session_logs',        name: 'Session Logs',              tier: 'STANDARD',   defaultOn: true,  sortOrder: 4,  dependencies: ['trn.training_plans'], description: 'Log each training session with sets, reps, weight, and notes' },
  { moduleKey: 'SYL-MOD-TRN', featureKey: 'trn.body_stats',          name: 'Body Stats',                tier: 'ADVANCED',   defaultOn: true,  sortOrder: 5,  dependencies: [], description: 'Track weight, BMI, body fat %, and measurements over time' },
  { moduleKey: 'SYL-MOD-TRN', featureKey: 'trn.trainer_notes',       name: 'Trainer Notes',             tier: 'ADVANCED',   defaultOn: true,  sortOrder: 6,  dependencies: [], description: 'Private notes from trainer to member visible only to the assigned trainer' },
];

async function main() {
  console.log(`Seeding module feature catalog — ${FEATURES.length} features across all modules…\n`);

  const byModule = {};
  for (const f of FEATURES) {
    if (!byModule[f.moduleKey]) byModule[f.moduleKey] = [];
    byModule[f.moduleKey].push(f);
  }

  for (const [mod, features] of Object.entries(byModule)) {
    console.log(`${mod} (${features.length} features)`);
    for (const feature of features) {
      await prisma.moduleFeature.upsert({
        where:  { featureKey: feature.featureKey },
        update: {
          name: feature.name, description: feature.description,
          tier: feature.tier, defaultOn: feature.defaultOn,
          dependencies: feature.dependencies, sortOrder: feature.sortOrder,
          moduleKey: feature.moduleKey,
        },
        create: feature,
      });
      process.stdout.write(`  ✓ ${feature.featureKey}\n`);
    }
    console.log('');
  }

  const total = await prisma.moduleFeature.count();
  console.log(`Done — ${total} features in catalog.`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
