/**
 * Master Module Feature Seeder — Syllabrix Platform
 * Covers all 41 modules across Generic + Healthcare OPD + Healthcare IPD.
 * Safe to re-run — all operations are upserts.
 *
 * Tier logic:
 *   BASIC      → Core feature that makes the module usable at all
 *   STANDARD   → Efficiency features (search, filters, integrations, exports)
 *   ADVANCED   → Analytics, AI, automation, bulk operations
 *   ENTERPRISE → Compliance, multi-branch enforcement, API, advanced security
 */

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC MODULES (23)
// ─────────────────────────────────────────────────────────────────────────────
const GENERIC = [

  // ── INVOICING (SYL-MOD-INV) ──────────────────────────────────────────────
  { featureKey:'inv.create_invoice',    moduleKey:'SYL-MOD-INV', name:'Create Invoice',          description:'Create GST-compliant invoices for customers',                           tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'inv.pdf_download',      moduleKey:'SYL-MOD-INV', name:'PDF Download',            description:'Download invoices as a branded A4 PDF',                                 tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'inv.payment_record',    moduleKey:'SYL-MOD-INV', name:'Payment Recording',       description:'Mark invoices as paid and record payment method',                        tier:'BASIC',      defaultOn:true,  sortOrder:12 },
  { featureKey:'inv.partial_payment',   moduleKey:'SYL-MOD-INV', name:'Partial Payments',        description:'Accept partial payment and track outstanding balance',                   tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'inv.email_send',        moduleKey:'SYL-MOD-INV', name:'Email Invoice',           description:'Send invoice directly to customer email',                               tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'inv.whatsapp_send',     moduleKey:'SYL-MOD-INV', name:'WhatsApp Invoice',        description:'Share invoice PDF via WhatsApp',                                        tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'inv.quotations',        moduleKey:'SYL-MOD-INV', name:'Quotations',              description:'Create and convert quotations to invoices',                             tier:'STANDARD',   defaultOn:true,  sortOrder:23 },
  { featureKey:'inv.credit_notes',      moduleKey:'SYL-MOD-INV', name:'Credit Notes',            description:'Issue credit notes against returned or adjusted invoices',              tier:'STANDARD',   defaultOn:false, sortOrder:24 },
  { featureKey:'inv.overdue_alerts',    moduleKey:'SYL-MOD-INV', name:'Overdue Alerts',          description:'Auto-alert customers with overdue invoices via WhatsApp',               tier:'STANDARD',   defaultOn:true,  sortOrder:25 },
  { featureKey:'inv.recurring',         moduleKey:'SYL-MOD-INV', name:'Recurring Invoices',      description:'Auto-generate invoices on a fixed schedule',                            tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'inv.bulk_send',         moduleKey:'SYL-MOD-INV', name:'Bulk Invoice Send',       description:'Send multiple invoices in one batch',                                   tier:'ADVANCED',   defaultOn:false, sortOrder:31 },

  // ── POINT OF SALE (SYL-MOD-POS) ──────────────────────────────────────────
  { featureKey:'pos.product_search',    moduleKey:'SYL-MOD-POS', name:'Product Search',          description:'Search and add products to a bill by name or code',                     tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'pos.cash_payment',      moduleKey:'SYL-MOD-POS', name:'Cash Payment',            description:'Accept and record cash payments',                                       tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'pos.receipt_print',     moduleKey:'SYL-MOD-POS', name:'Receipt Print',           description:'Print or share receipt after sale',                                     tier:'BASIC',      defaultOn:true,  sortOrder:12 },
  { featureKey:'pos.upi_payment',       moduleKey:'SYL-MOD-POS', name:'UPI Payment',             description:'Accept UPI payments with QR code display',                              tier:'BASIC',      defaultOn:true,  sortOrder:13 },
  { featureKey:'pos.sales_history',     moduleKey:'SYL-MOD-POS', name:"Today's Sales History",  description:'View all bills made today with totals',                                  tier:'BASIC',      defaultOn:true,  sortOrder:14 },
  { featureKey:'pos.category_filter',   moduleKey:'SYL-MOD-POS', name:'Category Filter',         description:'Filter products by category on the POS screen',                         tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'pos.card_payment',      moduleKey:'SYL-MOD-POS', name:'Card / Bank Payment',     description:'Accept card or bank transfer payments',                                  tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'pos.bill_discount',     moduleKey:'SYL-MOD-POS', name:'Bill Discount',           description:'Apply percentage or fixed discount to the entire bill',                  tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'pos.item_discount',     moduleKey:'SYL-MOD-POS', name:'Per-Item Discount',       description:'Apply discount on individual line items',                               tier:'STANDARD',   defaultOn:true,  sortOrder:23 },
  { featureKey:'pos.customer_capture',  moduleKey:'SYL-MOD-POS', name:'Customer Capture',        description:'Link a sale to a customer for loyalty and history',                     tier:'STANDARD',   defaultOn:true,  sortOrder:24 },
  { featureKey:'pos.gst_breakdown',     moduleKey:'SYL-MOD-POS', name:'GST Breakdown on Bill',   description:'Show CGST/SGST/IGST breakdown on the bill',                             tier:'STANDARD',   defaultOn:true,  sortOrder:25 },
  { featureKey:'pos.custom_item',       moduleKey:'SYL-MOD-POS', name:'Custom / Ad-hoc Item',    description:'Add a custom item not in the product catalog',                          tier:'STANDARD',   defaultOn:true,  sortOrder:26 },
  { featureKey:'pos.hold_bill',         moduleKey:'SYL-MOD-POS', name:'Hold / Park Bill',        description:'Put a bill on hold and resume it later',                                tier:'STANDARD',   defaultOn:false, sortOrder:27 },
  { featureKey:'pos.split_payment',     moduleKey:'SYL-MOD-POS', name:'Split Payment',           description:'Split a bill across multiple payment methods',                          tier:'STANDARD',   defaultOn:false, sortOrder:28 },
  { featureKey:'pos.barcode_scanner',   moduleKey:'SYL-MOD-POS', name:'Barcode Scanner',         description:'Scan product barcode to add to bill instantly',                         tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'pos.manager_pin',       moduleKey:'SYL-MOD-POS', name:'Manager PIN for Discount',description:'Require manager PIN before applying discounts above a threshold',        tier:'ADVANCED',   defaultOn:false, sortOrder:31 },
  { featureKey:'pos.table_assignment',  moduleKey:'SYL-MOD-POS', name:'Table / Seat Assignment', description:'Assign bills to table numbers (restaurant / café)',                      tier:'ADVANCED',   defaultOn:false, sortOrder:32 },
  { featureKey:'pos.multi_cashier',     moduleKey:'SYL-MOD-POS', name:'Multi-Cashier Sessions',  description:'Multiple cashiers with separate session tracking',                       tier:'ENTERPRISE', defaultOn:false, sortOrder:40 },

  // ── INVENTORY (SYL-MOD-STK) ──────────────────────────────────────────────
  { featureKey:'stk.product_list',      moduleKey:'SYL-MOD-STK', name:'Product List',            description:'Manage products with name, SKU, price, and category',                   tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'stk.categories',        moduleKey:'SYL-MOD-STK', name:'Product Categories',      description:'Organise products into categories',                                     tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'stk.stock_adjust',      moduleKey:'SYL-MOD-STK', name:'Stock Adjustment',        description:'Manually add or reduce stock with a reason',                            tier:'BASIC',      defaultOn:true,  sortOrder:12 },
  { featureKey:'stk.low_stock_alerts',  moduleKey:'SYL-MOD-STK', name:'Low Stock Alerts',        description:'Alert when product stock falls below a set threshold',                  tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'stk.purchase_orders',   moduleKey:'SYL-MOD-STK', name:'Purchase Orders',         description:'Raise POs to suppliers and auto-update stock on receipt',               tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'stk.barcode_labels',    moduleKey:'SYL-MOD-STK', name:'Barcode Label Print',     description:'Print barcode labels for products',                                     tier:'STANDARD',   defaultOn:false, sortOrder:22 },
  { featureKey:'stk.batch_expiry',      moduleKey:'SYL-MOD-STK', name:'Batch & Expiry Tracking', description:'Track stock by batch number and expiry date',                           tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'stk.branch_stock',      moduleKey:'SYL-MOD-STK', name:'Branch-wise Stock',       description:'View and manage stock levels per branch',                               tier:'ADVANCED',   defaultOn:false, sortOrder:31 },
  { featureKey:'stk.stock_transfer',    moduleKey:'SYL-MOD-STK', name:'Stock Transfer',          description:'Transfer stock between branches',                                       tier:'ADVANCED',   defaultOn:false, sortOrder:32 },
  { featureKey:'stk.import_export',     moduleKey:'SYL-MOD-STK', name:'Bulk Import / Export',    description:'Import products from Excel; export full catalog',                       tier:'ADVANCED',   defaultOn:false, sortOrder:33 },

  // ── CUSTOMERS (SYL-MOD-CUS) ──────────────────────────────────────────────
  { featureKey:'cus.customer_list',     moduleKey:'SYL-MOD-CUS', name:'Customer List',           description:'Manage customers with name, phone, address, and notes',                 tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'cus.customer_profile',  moduleKey:'SYL-MOD-CUS', name:'Customer Profile',        description:'View purchase history, outstanding dues, and activity',                 tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'cus.customer_credit',   moduleKey:'SYL-MOD-CUS', name:'Customer Credit',         description:'Extend credit to customers and track outstanding balance',              tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'cus.tags',              moduleKey:'SYL-MOD-CUS', name:'Customer Tags',           description:'Tag customers for segmentation and campaigns',                          tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'cus.birthday_alerts',   moduleKey:'SYL-MOD-CUS', name:'Birthday Reminders',      description:'Auto WhatsApp birthday greetings to customers',                         tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'cus.import_export',     moduleKey:'SYL-MOD-CUS', name:'Import / Export',         description:'Bulk import customers from CSV / export full list',                     tier:'STANDARD',   defaultOn:false, sortOrder:23 },
  { featureKey:'cus.loyalty_points',    moduleKey:'SYL-MOD-CUS', name:'Loyalty Points',          description:'Earn and redeem loyalty points on purchases',                           tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'cus.lifetime_value',    moduleKey:'SYL-MOD-CUS', name:'Customer Analytics',      description:'Lifetime value, visit frequency, and revenue contribution',             tier:'ADVANCED',   defaultOn:false, sortOrder:31 },

  // ── EXPENSES (SYL-MOD-EXP) ──────────────────────────────────────────────
  { featureKey:'exp.expense_log',       moduleKey:'SYL-MOD-EXP', name:'Expense Log',             description:'Record business expenses with category, amount, and vendor',            tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'exp.categories',        moduleKey:'SYL-MOD-EXP', name:'Expense Categories',      description:'Organise expenses into custom categories',                              tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'exp.receipt_upload',    moduleKey:'SYL-MOD-EXP', name:'Receipt Upload',          description:'Attach receipt images or PDFs to expense records',                     tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'exp.recurring',         moduleKey:'SYL-MOD-EXP', name:'Recurring Expenses',      description:'Auto-create recurring expenses (rent, subscriptions)',                  tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'exp.expense_reports',   moduleKey:'SYL-MOD-EXP', name:'Expense Reports',         description:'Summarised expense reports by category, date, or vendor',              tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'exp.budget_tracking',   moduleKey:'SYL-MOD-EXP', name:'Budget Tracking',         description:'Set monthly budgets per category and track variance',                   tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── VENDORS (SYL-MOD-VND) ────────────────────────────────────────────────
  { featureKey:'vnd.vendor_list',       moduleKey:'SYL-MOD-VND', name:'Vendor List',             description:'Manage supplier contacts, GST details, and payment terms',             tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'vnd.purchase_bills',    moduleKey:'SYL-MOD-VND', name:'Purchase Bills',          description:'Record purchase bills from suppliers',                                  tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'vnd.purchase_orders',   moduleKey:'SYL-MOD-VND', name:'Purchase Orders',         description:'Raise POs to vendors and track fulfilment',                             tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'vnd.grn',               moduleKey:'SYL-MOD-VND', name:'Goods Receipt Notes',     description:'Record GRN on delivery and match against PO',                          tier:'STANDARD',   defaultOn:false, sortOrder:21 },
  { featureKey:'vnd.payment_tracking',  moduleKey:'SYL-MOD-VND', name:'Payment Tracking',        description:'Track payments made to vendors and outstanding dues',                   tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'vnd.vendor_ledger',     moduleKey:'SYL-MOD-VND', name:'Vendor Ledger',           description:'Full transaction history per vendor',                                   tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── ACCOUNTS (SYL-MOD-ACC) ───────────────────────────────────────────────
  { featureKey:'acc.bank_accounts',     moduleKey:'SYL-MOD-ACC', name:'Bank Accounts',           description:'Manage cash and bank accounts with opening balances',                   tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'acc.transaction_log',   moduleKey:'SYL-MOD-ACC', name:'Transaction Log',         description:'Full debit/credit transaction history per account',                     tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'acc.reconciliation',    moduleKey:'SYL-MOD-ACC', name:'Bank Reconciliation',     description:'Reconcile bank statement with recorded transactions',                   tier:'STANDARD',   defaultOn:false, sortOrder:20 },
  { featureKey:'acc.profit_loss',       moduleKey:'SYL-MOD-ACC', name:'Profit & Loss',           description:'P&L statement from revenue and expense data',                           tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'acc.balance_sheet',     moduleKey:'SYL-MOD-ACC', name:'Balance Sheet',           description:'Assets vs liabilities summary',                                         tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'acc.cash_flow',         moduleKey:'SYL-MOD-ACC', name:'Cash Flow Projections',   description:'30/60/90-day cash flow forecast',                                       tier:'ADVANCED',   defaultOn:false, sortOrder:31 },

  // ── REPORTS (SYL-MOD-REP) ────────────────────────────────────────────────
  { featureKey:'rep.sales_summary',     moduleKey:'SYL-MOD-REP', name:'Sales Summary',           description:'Daily/weekly/monthly sales totals with trend charts',                   tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'rep.expense_report',    moduleKey:'SYL-MOD-REP', name:'Expense Report',          description:'Expense breakdown by category and date range',                          tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'rep.gst_report',        moduleKey:'SYL-MOD-REP', name:'GST Report',              description:'GSTR-1 / GSTR-3B summary for filing',                                  tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'rep.product_sales',     moduleKey:'SYL-MOD-REP', name:'Product-wise Sales',      description:'Top-selling products by quantity and revenue',                          tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'rep.profit_loss',       moduleKey:'SYL-MOD-REP', name:'Profit & Loss',           description:'Monthly P&L with revenue vs expense comparison',                        tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'rep.revenue_trends',    moduleKey:'SYL-MOD-REP', name:'Revenue Trends',          description:'Month-over-month revenue trend charts',                                  tier:'STANDARD',   defaultOn:true,  sortOrder:23 },
  { featureKey:'rep.export_excel',      moduleKey:'SYL-MOD-REP', name:'Export to Excel',         description:'Download any report as Excel / CSV',                                    tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'rep.scheduled',         moduleKey:'SYL-MOD-REP', name:'Scheduled Reports',       description:'Auto-email or WhatsApp reports on a schedule',                         tier:'ADVANCED',   defaultOn:false, sortOrder:31 },

  // ── STAFF (SYL-MOD-STF) ──────────────────────────────────────────────────
  { featureKey:'stf.staff_list',        moduleKey:'SYL-MOD-STF', name:'Staff List',              description:'Manage staff profiles with role, contact, and joining date',            tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'stf.roles_permissions', moduleKey:'SYL-MOD-STF', name:'Roles & Permissions',     description:'Create roles and assign module-level permissions to staff',             tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'stf.departments',       moduleKey:'SYL-MOD-STF', name:'Departments',             description:'Organise staff into departments',                                       tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'stf.certifications',    moduleKey:'SYL-MOD-STF', name:'Certifications & Skills', description:'Track professional qualifications and skill sets per staff member',      tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'stf.hr_documents',      moduleKey:'SYL-MOD-STF', name:'HR Documents',            description:'Upload and manage employee documents (offer letter, ID proof)',         tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── ATTENDANCE (SYL-MOD-ATT) ─────────────────────────────────────────────
  { featureKey:'att.manual_log',        moduleKey:'SYL-MOD-ATT', name:'Manual Attendance',       description:'Mark daily attendance as Present, Absent, or Leave',                   tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'att.monthly_summary',   moduleKey:'SYL-MOD-ATT', name:'Monthly Summary',         description:'Attendance summary per staff per month',                                tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'att.biometric',         moduleKey:'SYL-MOD-ATT', name:'Biometric Integration',   description:'Sync attendance from biometric / RFID device',                         tier:'ADVANCED',   defaultOn:false, sortOrder:20 },
  { featureKey:'att.shift_management',  moduleKey:'SYL-MOD-ATT', name:'Shift Management',        description:'Define shifts and assign staff to shift schedules',                     tier:'ADVANCED',   defaultOn:false, sortOrder:21 },
  { featureKey:'att.overtime',          moduleKey:'SYL-MOD-ATT', name:'Overtime Calculation',    description:'Auto-calculate overtime hours for payroll',                             tier:'ADVANCED',   defaultOn:false, sortOrder:22 },

  // ── PAYROLL (SYL-MOD-PAY) ────────────────────────────────────────────────
  { featureKey:'pay.salary_processing', moduleKey:'SYL-MOD-PAY', name:'Salary Processing',       description:'Run monthly payroll and mark salaries as paid',                         tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'pay.payslips',          moduleKey:'SYL-MOD-PAY', name:'Payslips',                description:'Generate and share printable payslips per employee',                    tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'pay.deductions',        moduleKey:'SYL-MOD-PAY', name:'PF / ESI / PT Deductions',description:'Calculate statutory deductions (PF, ESI, Professional Tax)',           tier:'STANDARD',   defaultOn:false, sortOrder:20 },
  { featureKey:'pay.allowances',        moduleKey:'SYL-MOD-PAY', name:'Allowances',              description:'Configure and track HRA, TA, and custom allowances',                   tier:'STANDARD',   defaultOn:false, sortOrder:21 },
  { featureKey:'pay.bank_transfer',     moduleKey:'SYL-MOD-PAY', name:'Bank Transfer List',      description:'Export payroll as bank transfer file',                                  tier:'STANDARD',   defaultOn:false, sortOrder:22 },
  { featureKey:'pay.form16',            moduleKey:'SYL-MOD-PAY', name:'Form 16 / IT Summary',    description:'Generate Form 16 and income tax summary for employees',                tier:'ENTERPRISE', defaultOn:false, sortOrder:30 },

  // ── FEES (SYL-MOD-FEE) ───────────────────────────────────────────────────
  { featureKey:'fee.collection',        moduleKey:'SYL-MOD-FEE', name:'Fee Collection',          description:'Collect and record fee payments from students/members',                 tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'fee.structure',         moduleKey:'SYL-MOD-FEE', name:'Fee Structure',           description:'Define fee heads (tuition, transport, etc.) per course/batch',         tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'fee.pending_alerts',    moduleKey:'SYL-MOD-FEE', name:'Pending Fee Alerts',      description:'Auto WhatsApp reminder to students/parents for overdue fees',           tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'fee.bulk_collection',   moduleKey:'SYL-MOD-FEE', name:'Bulk Fee Collection',     description:'Process fee collection for multiple students at once',                  tier:'STANDARD',   defaultOn:false, sortOrder:21 },
  { featureKey:'fee.scholarship',       moduleKey:'SYL-MOD-FEE', name:'Scholarship / Waiver',    description:'Apply fee waivers or scholarships to individual students',              tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── STUDENTS (SYL-MOD-STU) ───────────────────────────────────────────────
  { featureKey:'stu.profiles',          moduleKey:'SYL-MOD-STU', name:'Student Profiles',        description:'Manage student records with course, batch, and parent contact',         tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'stu.batch_management',  moduleKey:'SYL-MOD-STU', name:'Batch / Class Management',description:'Create batches, assign students, and manage timetables',                tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'stu.homework',          moduleKey:'SYL-MOD-STU', name:'Homework Tracking',       description:'Assign and track homework completion per student',                      tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'stu.progress_reports',  moduleKey:'SYL-MOD-STU', name:'Progress Reports',        description:'Generate and share student progress reports',                           tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'stu.exam_management',   moduleKey:'SYL-MOD-STU', name:'Exam Management',         description:'Schedule exams, enter marks, and generate result cards',               tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── ASSETS (SYL-MOD-AST) ─────────────────────────────────────────────────
  { featureKey:'ast.asset_register',    moduleKey:'SYL-MOD-AST', name:'Asset Register',          description:'Track business assets with purchase date, cost, and category',          tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'ast.depreciation_slm',  moduleKey:'SYL-MOD-AST', name:'Depreciation (SLM)',      description:'Calculate straight-line depreciation for each asset',                   tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'ast.maintenance_log',   moduleKey:'SYL-MOD-AST', name:'Maintenance Logs',        description:'Log service/maintenance events against assets',                         tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'ast.depreciation_wdv',  moduleKey:'SYL-MOD-AST', name:'WDV Depreciation',        description:'Written-down value (diminishing balance) depreciation method',          tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── LEASE (SYL-MOD-LSE) ──────────────────────────────────────────────────
  { featureKey:'lse.lease_units',       moduleKey:'SYL-MOD-LSE', name:'Lease Units',             description:'Manage shop/office/flat units with area, floor, and type',              tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'lse.tenant_profiles',   moduleKey:'SYL-MOD-LSE', name:'Tenant Profiles',         description:'Manage lessee contacts, agreement dates, and rental terms',             tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'lse.rent_collection',   moduleKey:'SYL-MOD-LSE', name:'Rent Collection',         description:'Record rent receipts and track payment status',                         tier:'BASIC',      defaultOn:true,  sortOrder:12 },
  { featureKey:'lse.overdue_alerts',    moduleKey:'SYL-MOD-LSE', name:'Overdue Rent Alerts',     description:'Auto WhatsApp reminder to tenants for overdue rent',                    tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'lse.lease_renewal',     moduleKey:'SYL-MOD-LSE', name:'Lease Renewal Alerts',    description:'Alert when a lease is approaching expiry',                              tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'lse.occupancy_report',  moduleKey:'SYL-MOD-LSE', name:'Occupancy Report',        description:'Live occupancy view — occupied vs vacant units',                        tier:'STANDARD',   defaultOn:true,  sortOrder:22 },

  // ── MEMBERSHIPS (SYL-MOD-MBR) ────────────────────────────────────────────
  { featureKey:'mbr.plan_management',   moduleKey:'SYL-MOD-MBR', name:'Membership Plans',        description:'Create plans with duration, price, and included features',              tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'mbr.enrolment',         moduleKey:'SYL-MOD-MBR', name:'Member Enrolment',        description:'Enrol members into plans and track start/end dates',                   tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'mbr.expiry_alerts',     moduleKey:'SYL-MOD-MBR', name:'Expiry Alerts',           description:'Auto WhatsApp renewal reminder before membership expires',              tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'mbr.freeze',            moduleKey:'SYL-MOD-MBR', name:'Freeze Membership',       description:'Pause a membership and auto-extend expiry date',                        tier:'STANDARD',   defaultOn:false, sortOrder:21 },
  { featureKey:'mbr.referral',          moduleKey:'SYL-MOD-MBR', name:'Referral Tracking',       description:'Track which member referred a new enrolment',                           tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── WHATSAPP (SYL-MOD-WA) ────────────────────────────────────────────────
  { featureKey:'wa.manual_messages',    moduleKey:'SYL-MOD-WA',  name:'Manual WhatsApp Messages', description:'Send one-to-one WhatsApp messages to customers from the platform',    tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'wa.templates',          moduleKey:'SYL-MOD-WA',  name:'Message Templates',       description:'Pre-saved message templates for common use cases',                      tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'wa.delivery_status',    moduleKey:'SYL-MOD-WA',  name:'Delivery Status',         description:'Track sent / delivered / read status of messages',                     tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'wa.automated',          moduleKey:'SYL-MOD-WA',  name:'Automated Messages',      description:'Auto-trigger WhatsApp on events (booking, payment, birthday)',          tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'wa.two_way_chat',       moduleKey:'SYL-MOD-WA',  name:'Two-Way Chat',            description:'Receive and reply to WhatsApp messages from customers',                 tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── CAMPAIGNS (SYL-MOD-CMP) ──────────────────────────────────────────────
  { featureKey:'cmp.create',            moduleKey:'SYL-MOD-CMP', name:'Create Campaign',         description:'Create WhatsApp / SMS campaigns with message and audience',             tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'cmp.segmented_send',    moduleKey:'SYL-MOD-CMP', name:'Segment-based Send',      description:'Target campaigns to customer segments (tags, spent, location)',         tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'cmp.scheduled_send',    moduleKey:'SYL-MOD-CMP', name:'Scheduled Send',          description:'Schedule campaigns to send at a future date and time',                  tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'cmp.analytics',         moduleKey:'SYL-MOD-CMP', name:'Campaign Analytics',      description:'Delivery, open, and response rate metrics per campaign',               tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'cmp.drip',              moduleKey:'SYL-MOD-CMP', name:'Drip Campaigns',          description:'Multi-step automated message sequences triggered by events',            tier:'ADVANCED',   defaultOn:false, sortOrder:31 },

  // ── B2B (SYL-MOD-B2B) ────────────────────────────────────────────────────
  { featureKey:'b2b.supplier_profile',  moduleKey:'SYL-MOD-B2B', name:'Supplier Profile',        description:'Create a verified supplier profile on the Syllabrix B2B marketplace',  tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'b2b.product_catalog',   moduleKey:'SYL-MOD-B2B', name:'Product Catalog',         description:'List products available for wholesale buyers',                          tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'b2b.connections',       moduleKey:'SYL-MOD-B2B', name:'Buyer Connections',       description:'Connect with verified buyers on the platform',                          tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'b2b.price_negotiation', moduleKey:'SYL-MOD-B2B', name:'Price Negotiation',       description:'Negotiate prices with buyers through the platform',                     tier:'STANDARD',   defaultOn:false, sortOrder:21 },
  { featureKey:'b2b.ratings',           moduleKey:'SYL-MOD-B2B', name:'Ratings & Reviews',       description:'Build trust with buyer ratings and reviews',                            tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── AI COPILOT (SYL-MOD-AIC) ─────────────────────────────────────────────
  { featureKey:'aic.ask_ai',            moduleKey:'SYL-MOD-AIC', name:'Ask AI',                  description:'Ask business questions in natural language and get instant answers',    tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'aic.insights',          moduleKey:'SYL-MOD-AIC', name:'Business Insights',       description:'AI-generated weekly summary of sales, customers, and trends',           tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'aic.anomaly',           moduleKey:'SYL-MOD-AIC', name:'Anomaly Detection',       description:'AI flags unusual drops or spikes in revenue or stock',                  tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'aic.forecasting',       moduleKey:'SYL-MOD-AIC', name:'Revenue Forecasting',     description:'30/60/90-day AI-powered revenue forecast',                              tier:'ADVANCED',   defaultOn:false, sortOrder:31 },
  { featureKey:'aic.custom_reports',    moduleKey:'SYL-MOD-AIC', name:'AI Custom Reports',       description:'Generate custom reports by describing them in plain language',           tier:'ENTERPRISE', defaultOn:false, sortOrder:40 },

  // ── AUTOMATION (SYL-MOD-AUT) ─────────────────────────────────────────────
  { featureKey:'aut.post_sale_wa',      moduleKey:'SYL-MOD-AUT', name:'Post-sale WhatsApp',      description:'Auto WhatsApp thank-you after every sale',                              tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'aut.daily_digest',      moduleKey:'SYL-MOD-AUT', name:'Daily Digest',            description:'Daily WhatsApp summary of sales, expenses, and appointments',           tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'aut.low_stock_alert',   moduleKey:'SYL-MOD-AUT', name:'Low Stock Automation',    description:'Auto alert when stock falls below threshold',                           tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'aut.birthday_wishes',   moduleKey:'SYL-MOD-AUT', name:'Birthday Wishes',         description:'Auto WhatsApp birthday greetings to customers and staff',               tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'aut.payment_reminders', moduleKey:'SYL-MOD-AUT', name:'Payment Reminders',       description:'Auto reminder for overdue invoices and dues',                           tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'aut.custom_workflows',  moduleKey:'SYL-MOD-AUT', name:'Custom Workflow Builder', description:'Build no-code automation rules: trigger → condition → action',          tier:'ENTERPRISE', defaultOn:false, sortOrder:30 },

  // ── TRAINING PLANS (SYL-MOD-TRN) ─────────────────────────────────────────
  { featureKey:'trn.exercise_library',  moduleKey:'SYL-MOD-TRN', name:'Exercise Library',        description:'Manage a library of exercises with descriptions and muscle groups',      tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'trn.templates',         moduleKey:'SYL-MOD-TRN', name:'Workout Templates',       description:'Create reusable workout plan templates',                                tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'trn.training_plans',    moduleKey:'SYL-MOD-TRN', name:'Member Training Plans',   description:'Assign personalised training plans to individual members',              tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'trn.session_logs',      moduleKey:'SYL-MOD-TRN', name:'Session Logs',            description:'Log completed workout sessions per member',                             tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'trn.body_stats',        moduleKey:'SYL-MOD-TRN', name:'Body Stats',              description:'Track weight, body fat, measurements over time',                        tier:'STANDARD',   defaultOn:false, sortOrder:22 },
  { featureKey:'trn.trainer_notes',     moduleKey:'SYL-MOD-TRN', name:'Trainer Notes',           description:'Private notes from trainer about member progress',                      tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
];

// ─────────────────────────────────────────────────────────────────────────────
// HEALTHCARE — OPD (11 modules)
// ─────────────────────────────────────────────────────────────────────────────
const HEALTHCARE_OPD = [

  // ── OPD QUEUE (SYL-MOD-OPD) ──────────────────────────────────────────────
  { featureKey:'opd.tokens',            moduleKey:'SYL-MOD-OPD', name:'OPD Tokens',              description:'Generate sequential OPD tokens for walk-in and booked patients',        tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'opd.queue_management',  moduleKey:'SYL-MOD-OPD', name:'Queue Management',        description:'Call next, mark consulting, and close token from the queue',            tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'opd.board_view',        moduleKey:'SYL-MOD-OPD', name:'Live Board View',         description:'Kanban-style board: Waiting / In Consultation / Done',                  tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'opd.date_filter',       moduleKey:'SYL-MOD-OPD', name:'Date Filter',             description:'View queue for any past or future date',                                tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'opd.token_count_kpi',   moduleKey:'SYL-MOD-OPD', name:'Today\'s Token Count KPI',description:'Dashboard KPI showing total tokens generated today',                   tier:'BASIC',      defaultOn:true,  sortOrder:12 },
  { featureKey:'opd.walk_in_token',     moduleKey:'SYL-MOD-OPD', name:'Walk-in Token',           description:'Create a token for a new patient directly from the queue',              tier:'BASIC',      defaultOn:true,  sortOrder:13 },
  { featureKey:'opd.doctor_filter',     moduleKey:'SYL-MOD-OPD', name:'Doctor-wise Queue',       description:'Filter queue by doctor (multi-doctor clinic)',                          tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'opd.avg_wait_kpi',      moduleKey:'SYL-MOD-OPD', name:'Average Wait Time KPI',   description:'KPI showing average patient wait time today',                           tier:'ADVANCED',   defaultOn:false, sortOrder:31 },

  // ── VITALS (SYL-MOD-VIT) ─────────────────────────────────────────────────
  { featureKey:'vit.record_vitals',     moduleKey:'SYL-MOD-VIT', name:'Record Vitals',           description:'Record BP, pulse, temperature, SpO₂, weight, height, RR',              tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'vit.bmi_calc',          moduleKey:'SYL-MOD-VIT', name:'BMI Auto-calculation',    description:'Auto-calculate BMI from height and weight, with classification label',  tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'vit.abnormal_flag',     moduleKey:'SYL-MOD-VIT', name:'Abnormal Value Flagging', description:'Highlight vitals outside normal range in red',                          tier:'BASIC',      defaultOn:true,  sortOrder:12 },
  { featureKey:'vit.history',           moduleKey:'SYL-MOD-VIT', name:'Vitals History',          description:'View all past vitals for a patient chronologically',                    tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'vit.trend_graph',       moduleKey:'SYL-MOD-VIT', name:'Vitals Trend Graph',      description:'Line chart of BP, weight, SpO₂ over time',                             tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'vit.nurse_workflow',    moduleKey:'SYL-MOD-VIT', name:'Nurse Vitals Workflow',   description:'Nurse-specific view to quickly record vitals for each token in queue',  tier:'STANDARD',   defaultOn:true,  sortOrder:22 },

  // ── CLINICAL NOTES / EMR (SYL-MOD-EMR) ───────────────────────────────────
  { featureKey:'emr.soap_notes',        moduleKey:'SYL-MOD-EMR', name:'SOAP Notes',              description:'Structured Subjective / Objective / Assessment / Plan clinical notes',  tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'emr.patient_history',   moduleKey:'SYL-MOD-EMR', name:'Patient Visit History',   description:'Full chronological visit history per patient',                          tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'emr.diagnosis_codes',   moduleKey:'SYL-MOD-EMR', name:'Diagnosis / ICD Codes',   description:'Structured diagnosis entry with ICD-10 code lookup',                   tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'emr.date_filter',       moduleKey:'SYL-MOD-EMR', name:'Date Range Filter',       description:'Filter patient notes by date range',                                    tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'emr.print_note',        moduleKey:'SYL-MOD-EMR', name:'Print Clinical Note',     description:'Print formatted clinical note as A4 PDF',                               tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'emr.abha_display',      moduleKey:'SYL-MOD-EMR', name:'ABHA Number Display',     description:'Show ABHA ID in patient header when available',                         tier:'STANDARD',   defaultOn:true,  sortOrder:23, dependencies: ['emr.soap_notes'] },
  { featureKey:'emr.ai_assist',         moduleKey:'SYL-MOD-EMR', name:'AI Clinical Assist',      description:'AI-powered suggestions for diagnosis and plan based on symptoms',        tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'emr.voice_dictation',   moduleKey:'SYL-MOD-EMR', name:'Voice Dictation',         description:'Dictate SOAP notes using voice-to-text',                                tier:'ENTERPRISE', defaultOn:false, sortOrder:40 },

  // ── PRESCRIPTIONS (SYL-MOD-RX) ───────────────────────────────────────────
  { featureKey:'rx.create',             moduleKey:'SYL-MOD-RX',  name:'Write Prescription',      description:'Create prescriptions with medicines, dosage, duration, and instructions', tier:'BASIC',     defaultOn:true,  sortOrder:10 },
  { featureKey:'rx.history',            moduleKey:'SYL-MOD-RX',  name:'Prescription History',    description:'View all past prescriptions for a patient',                             tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'rx.print',              moduleKey:'SYL-MOD-RX',  name:'Print Rx',                description:'Print formatted prescription with clinic header and doctor signature',  tier:'BASIC',      defaultOn:true,  sortOrder:12 },
  { featureKey:'rx.medicine_autocomplete',moduleKey:'SYL-MOD-RX',name:'Medicine Autocomplete',   description:'Search medicines from inventory while writing prescription',             tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'rx.qr_verify',          moduleKey:'SYL-MOD-RX',  name:'QR-Verified Rx',          description:'QR code on prescription links to public verify page (/verify-rx/:id)',  tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'rx.whatsapp_share',     moduleKey:'SYL-MOD-RX',  name:'WhatsApp Share',          description:'Share prescription PDF with patient via WhatsApp',                      tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'rx.ai_suggest',         moduleKey:'SYL-MOD-RX',  name:'AI Prescription Suggest', description:'AI recommends medicines based on diagnosis and patient history',        tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── LAB ORDERS (SYL-MOD-LAB) ─────────────────────────────────────────────
  { featureKey:'lab.orders',            moduleKey:'SYL-MOD-LAB', name:'Lab Orders',              description:'Create lab orders with test list and external lab center',              tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'lab.lab_centers',       moduleKey:'SYL-MOD-LAB', name:'Lab Center Directory',    description:'Maintain a list of preferred external diagnostic centers',              tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'lab.referral_slip',     moduleKey:'SYL-MOD-LAB', name:'Referral Slip Print',     description:'Print referral slip for the patient to carry to the lab center',        tier:'BASIC',      defaultOn:true,  sortOrder:12 },
  { featureKey:'lab.report_upload',     moduleKey:'SYL-MOD-LAB', name:'Report Upload & View',    description:'Upload lab report PDF and view from patient record',                    tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'lab.result_entry',      moduleKey:'SYL-MOD-LAB', name:'Result Entry',            description:'Enter test values with reference ranges and flag abnormals',            tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'lab.status_tracking',   moduleKey:'SYL-MOD-LAB', name:'Status Tracking',         description:'Track lab order status: Ordered → Sample Collected → Report Received',  tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'lab.emr_link',          moduleKey:'SYL-MOD-LAB', name:'EMR Link',                description:'Lab results auto-appear in patient EMR timeline',                        tier:'STANDARD',   defaultOn:true,  sortOrder:23, dependencies:['lab.report_upload'] },

  // ── CLINIC BILLING (SYL-MOD-CBL) ─────────────────────────────────────────
  { featureKey:'cbl.bills',             moduleKey:'SYL-MOD-CBL', name:'Clinic Bills',            description:'Create bills for consultations, procedures, and medicines',             tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'cbl.payment_modes',     moduleKey:'SYL-MOD-CBL', name:'Payment Modes',           description:'Accept cash, UPI, and card; split across multiple modes',               tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'cbl.receipt_print',     moduleKey:'SYL-MOD-CBL', name:'Receipt Print',           description:'Print formatted receipt with clinic header and QR code',               tier:'BASIC',      defaultOn:true,  sortOrder:12 },
  { featureKey:'cbl.outstanding',       moduleKey:'SYL-MOD-CBL', name:'Outstanding Dues',        description:'View and collect pending balances from patients',                       tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'cbl.day_end_summary',   moduleKey:'SYL-MOD-CBL', name:'Day-End Summary',         description:'Daily collection summary: cash, UPI, card, dues',                      tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'cbl.gst_exempt',        moduleKey:'SYL-MOD-CBL', name:'GST Exempt Billing',      description:'Mark consultation and clinical services as GST-exempt (healthcare)',    tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'cbl.auto_bill',         moduleKey:'SYL-MOD-CBL', name:'Auto-Bill from Appointment',description:'Auto-create a draft bill when appointment is marked complete',        tier:'STANDARD',   defaultOn:true,  sortOrder:23 },
  { featureKey:'cbl.whatsapp_receipt',  moduleKey:'SYL-MOD-CBL', name:'WhatsApp Receipt',        description:'Send receipt to patient via WhatsApp after payment',                   tier:'STANDARD',   defaultOn:true,  sortOrder:24 },
  { featureKey:'cbl.insurance_flag',    moduleKey:'SYL-MOD-CBL', name:'Insurance / TPA Flag',    description:'Flag a bill as insurance-covered and route to claims module',           tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── MEDICINE INVENTORY (SYL-MOD-MED) ─────────────────────────────────────
  { featureKey:'med.stock',             moduleKey:'SYL-MOD-MED', name:'Medicine Stock',          description:'Manage medicines with name, composition, category, MRP, and stock',    tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'med.dispensing',        moduleKey:'SYL-MOD-MED', name:'Dispensing',              description:'Dispense medicines against a prescription and deduct from stock',       tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'med.expiry_alerts',     moduleKey:'SYL-MOD-MED', name:'Expiry Alerts',           description:'Alert for medicines expiring within 30/60/90 days',                    tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'med.batches',           moduleKey:'SYL-MOD-MED', name:'Batch Tracking',          description:'Track stock by batch number, MFD, and expiry date',                    tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'med.low_stock',         moduleKey:'SYL-MOD-MED', name:'Low Stock Alerts',        description:'Alert when medicine stock falls below set threshold',                   tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'med.schedule_h',        moduleKey:'SYL-MOD-MED', name:'Schedule H Register',     description:'Maintain statutory Schedule H drug register with patient details',      tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'med.purchase_order',    moduleKey:'SYL-MOD-MED', name:'Medicine Purchase Order', description:'Raise purchase orders to medicine suppliers',                           tier:'ADVANCED',   defaultOn:false, sortOrder:31 },

  // ── CLINIC DOCTORS (SYL-MOD-DOC) ─────────────────────────────────────────
  { featureKey:'doc.profiles',          moduleKey:'SYL-MOD-DOC', name:'Doctor Profiles',         description:'Manage doctor profiles with qualifications, specialization, and bio',   tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'doc.schedules',         moduleKey:'SYL-MOD-DOC', name:'OPD Schedules & Fees',    description:'Set available days, time slots, and consultation fees per doctor',      tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'doc.mci_reg',           moduleKey:'SYL-MOD-DOC', name:'MCI Registration',        description:'Store MCI registration number and display on prescriptions',            tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'doc.deactivate',        moduleKey:'SYL-MOD-DOC', name:'Deactivate Doctor',       description:'Remove a doctor from scheduling without deleting their records',        tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'doc.revenue',           moduleKey:'SYL-MOD-DOC', name:'Doctor Revenue Report',   description:'Revenue attributed to each doctor from their consultations',            tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── CLINIC P&L (SYL-MOD-CPL) ─────────────────────────────────────────────
  { featureKey:'cpl.statement',         moduleKey:'SYL-MOD-CPL', name:'P&L Statement',           description:'Monthly revenue vs expenses = net profit or loss',                     tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'cpl.revenue_breakdown', moduleKey:'SYL-MOD-CPL', name:'Revenue by Category',     description:'Breakdown: consultations, procedures, medicine sales, others',          tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'cpl.doctor_revenue',    moduleKey:'SYL-MOD-CPL', name:'Doctor-wise Revenue',     description:'Revenue contribution per doctor',                                       tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'cpl.monthly_trend',     moduleKey:'SYL-MOD-CPL', name:'Monthly Trend Chart',     description:'Month-over-month revenue, expenses, and profit trend',                  tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'cpl.annual_view',       moduleKey:'SYL-MOD-CPL', name:'Annual P&L View',         description:'Full-year P&L with month-by-month breakdown',                          tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── CLINIC REPORTS (SYL-MOD-CLR) ─────────────────────────────────────────
  { featureKey:'clr.opd_summary',       moduleKey:'SYL-MOD-CLR', name:'Daily OPD Summary',       description:'Tokens generated, patients seen, collection for any day',              tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'clr.monthly_revenue',   moduleKey:'SYL-MOD-CLR', name:'Monthly Revenue Trend',   description:'Month-over-month revenue chart with collection breakdown',             tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'clr.patient_growth',    moduleKey:'SYL-MOD-CLR', name:'Patient Growth',          description:'New vs returning patients trend by month',                              tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'clr.diagnosis_freq',    moduleKey:'SYL-MOD-CLR', name:'Diagnosis Frequency',     description:'Top diagnoses by count — identify disease patterns',                   tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'clr.doctor_perf',       moduleKey:'SYL-MOD-CLR', name:'Doctor Performance',      description:'Patients seen, average consultation time, and revenue per doctor',     tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'clr.export',            moduleKey:'SYL-MOD-CLR', name:'Export Reports',          description:'Download any clinic report as Excel or CSV',                           tier:'ADVANCED',   defaultOn:false, sortOrder:31 },

  // ── ABDM / ABHA (SYL-MOD-ABDM) ───────────────────────────────────────────
  { featureKey:'abdm.capture',          moduleKey:'SYL-MOD-ABDM',name:'ABHA ID Capture',         description:'Capture and link patient ABHA (Ayushman Bharat) ID',                  tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'abdm.linkage',          moduleKey:'SYL-MOD-ABDM',name:'ABHA Linkage',            description:'Link patient\'s ABHA account to their profile for health record sharing', tier:'STANDARD', defaultOn:true,  sortOrder:20 },
  { featureKey:'abdm.record_push',      moduleKey:'SYL-MOD-ABDM',name:'Health Record Push',      description:'Push clinical notes, prescriptions, and lab reports to ABHA',           tier:'ADVANCED',  defaultOn:false, sortOrder:30 },
  { featureKey:'abdm.facility_config',  moduleKey:'SYL-MOD-ABDM',name:'ABDM Facility Config',    description:'Configure HFR (Health Facility Registry) ID and ABDM credentials',     tier:'ENTERPRISE',defaultOn:false, sortOrder:40 },
  { featureKey:'abdm.stats',            moduleKey:'SYL-MOD-ABDM',name:'ABHA Coverage Stats',     description:'% of patients with ABHA linked — adoption dashboard',                  tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
];

// ─────────────────────────────────────────────────────────────────────────────
// HEALTHCARE — IPD (7 modules)
// ─────────────────────────────────────────────────────────────────────────────
const HEALTHCARE_IPD = [

  // ── WARDS & BEDS (SYL-MOD-WRD) ───────────────────────────────────────────
  { featureKey:'wrd.ward_management',   moduleKey:'SYL-MOD-WRD', name:'Ward Management',         description:'Create and manage wards with type (General, ICU, Private, Semi-private)', tier:'BASIC',    defaultOn:true,  sortOrder:10 },
  { featureKey:'wrd.bed_management',    moduleKey:'SYL-MOD-WRD', name:'Bed Management',          description:'Add beds per ward with bed numbers and types',                          tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'wrd.bed_status',        moduleKey:'SYL-MOD-WRD', name:'Bed Status Update',       description:'Set beds as Occupied / Available / Cleaning / Reserved',               tier:'BASIC',      defaultOn:true,  sortOrder:12 },
  { featureKey:'wrd.occupancy_report',  moduleKey:'SYL-MOD-WRD', name:'Live Occupancy Report',   description:'Real-time occupancy view with occupied vs available beds per ward',     tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'wrd.bed_transfer',      moduleKey:'SYL-MOD-WRD', name:'Bed Transfer',            description:'Move an admitted patient to a different bed or ward',                   tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'wrd.census',            moduleKey:'SYL-MOD-WRD', name:'Daily Census',            description:'Daily inpatient census report: admits, discharges, and current count',  tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── IPD ADMISSIONS (SYL-MOD-IPD) ─────────────────────────────────────────
  { featureKey:'ipd.admit',             moduleKey:'SYL-MOD-IPD', name:'Admit Patient',           description:'Admit patient with ward, bed, diagnosis, and admitting doctor',         tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'ipd.admission_list',    moduleKey:'SYL-MOD-IPD', name:'Admission List',          description:'View all current admissions with status, ward, and doctor',             tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'ipd.daily_rounds',      moduleKey:'SYL-MOD-IPD', name:'Daily Rounds',            description:'Doctors record daily progress notes per admitted patient',              tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'ipd.order_sheet',       moduleKey:'SYL-MOD-IPD', name:'Doctor Order Sheet',      description:'Structured doctor orders (medication, investigations, diet, activity)',  tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'ipd.nursing_mar',       moduleKey:'SYL-MOD-IPD', name:'Nursing MAR',             description:'Medication Administration Record — nurses mark doses given',            tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'ipd.vitals_chart',      moduleKey:'SYL-MOD-IPD', name:'Vitals Chart & IV Fluids',description:'Inpatient vitals chart with IV fluid intake tracking',                  tier:'STANDARD',   defaultOn:true,  sortOrder:23 },
  { featureKey:'ipd.intake_output',     moduleKey:'SYL-MOD-IPD', name:'Intake-Output Chart',     description:'Track fluid intake and urine/drain output hourly',                      tier:'STANDARD',   defaultOn:false, sortOrder:24 },
  { featureKey:'ipd.discharge_workflow',moduleKey:'SYL-MOD-IPD', name:'Discharge Workflow',      description:'Initiate discharge, auto-link discharge summary, and free the bed',     tier:'STANDARD',   defaultOn:true,  sortOrder:25, dependencies:['ipd.admit'] },
  { featureKey:'ipd.mlc_flag',          moduleKey:'SYL-MOD-IPD', name:'MLC Case Flag',           description:'Flag admission as Medico-Legal Case with police notification log',      tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'ipd.census',            moduleKey:'SYL-MOD-IPD', name:'Daily Inpatient Census',  description:'Daily census report: new admissions, discharges, and current count',    tier:'ADVANCED',   defaultOn:false, sortOrder:31 },

  // ── DISCHARGE SUMMARY (SYL-MOD-DSC) ──────────────────────────────────────
  { featureKey:'dsc.create',            moduleKey:'SYL-MOD-DSC', name:'Create Discharge Summary',description:'Create structured discharge summary linked to IPD admission',           tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'dsc.edit',              moduleKey:'SYL-MOD-DSC', name:'Edit Clinical Fields',    description:'Edit diagnosis, treatment given, follow-up instructions',               tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'dsc.print',             moduleKey:'SYL-MOD-DSC', name:'Print A4 Discharge Summary',description:'Print formatted discharge summary on clinic letterhead',             tier:'BASIC',      defaultOn:true,  sortOrder:12 },
  { featureKey:'dsc.whatsapp',          moduleKey:'SYL-MOD-DSC', name:'WhatsApp PDF Delivery',   description:'Send discharge summary PDF to patient via WhatsApp',                   tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'dsc.abdm_push',         moduleKey:'SYL-MOD-DSC', name:'ABDM Health Record Push', description:'Push discharge summary to patient\'s ABHA account',                    tier:'ADVANCED',   defaultOn:false, sortOrder:30, dependencies:['dsc.create'] },

  // ── OPERATION THEATRE (SYL-MOD-OTS) ──────────────────────────────────────
  { featureKey:'ots.schedule',          moduleKey:'SYL-MOD-OTS', name:'Schedule OT Procedure',   description:'Book OT slot for surgery with surgeon, procedure, and date/time',       tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'ots.clearance',         moduleKey:'SYL-MOD-OTS', name:'Pre-op Clearance',        description:'Pre-operative checklist: consent, investigations, anaesthesia clearance', tier:'STANDARD',  defaultOn:true,  sortOrder:20 },
  { featureKey:'ots.intraop_notes',     moduleKey:'SYL-MOD-OTS', name:'Intraoperative Notes',    description:'Surgeon records findings, procedure performed, and complications',       tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'ots.anesthesia',        moduleKey:'SYL-MOD-OTS', name:'Anaesthesia Record',      description:'Anaesthetist records drugs, doses, and monitoring during procedure',     tier:'STANDARD',   defaultOn:false, sortOrder:22 },
  { featureKey:'ots.post_op_orders',    moduleKey:'SYL-MOD-OTS', name:'Post-op Orders',          description:'Post-operative instructions: medication, diet, activity, follow-up',     tier:'STANDARD',   defaultOn:true,  sortOrder:23 },
  { featureKey:'ots.utilization',       moduleKey:'SYL-MOD-OTS', name:'OT Utilization Report',   description:'OT usage by surgeon, procedure type, and time slot efficiency',         tier:'ADVANCED',   defaultOn:false, sortOrder:30 },

  // ── LIMS — LABORATORY (SYL-MOD-LIM) ──────────────────────────────────────
  { featureKey:'lim.test_catalog',      moduleKey:'SYL-MOD-LIM', name:'Test Catalog',            description:'Manage internal test catalog with reference ranges per test',           tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'lim.sample_collection', moduleKey:'SYL-MOD-LIM', name:'Sample Collection',       description:'Collect samples, generate sample IDs, and track collection status',     tier:'BASIC',      defaultOn:true,  sortOrder:11 },
  { featureKey:'lim.result_entry',      moduleKey:'SYL-MOD-LIM', name:'Result Entry',            description:'Enter test results; auto-flag values outside reference range',           tier:'BASIC',      defaultOn:true,  sortOrder:12 },
  { featureKey:'lim.critical_alerts',   moduleKey:'SYL-MOD-LIM', name:'Critical Value Alerts',   description:'Immediate alert for critical/panic lab values to the treating doctor',  tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'lim.report_gen',        moduleKey:'SYL-MOD-LIM', name:'Lab Report Generation',   description:'Generate formatted lab report PDF with lab header and doctor sign-off', tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'lim.qc_tracking',       moduleKey:'SYL-MOD-LIM', name:'Quality Control',         description:'Track QC samples and control charts per analyser',                      tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
  { featureKey:'lim.tat_report',        moduleKey:'SYL-MOD-LIM', name:'Turnaround Time Report',  description:'Report on average TAT per test and department',                        tier:'ADVANCED',   defaultOn:false, sortOrder:31 },

  // ── RADIOLOGY (SYL-MOD-RAD) ──────────────────────────────────────────────
  { featureKey:'rad.orders',            moduleKey:'SYL-MOD-RAD', name:'Radiology Orders',        description:'Create radiology orders with modality (X-ray, CT, MRI, USG)',           tier:'BASIC',      defaultOn:true,  sortOrder:10 },
  { featureKey:'rad.worklist',          moduleKey:'SYL-MOD-RAD', name:'Technician Worklist',     description:'Radiology technician views pending orders and updates status',           tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'rad.report_entry',      moduleKey:'SYL-MOD-RAD', name:'Radiologist Report Entry',description:'Radiologist enters findings and impression for each study',             tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'rad.image_attach',      moduleKey:'SYL-MOD-RAD', name:'Image Attachment',        description:'Attach DICOM images or scanned reports to the order',                  tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'rad.report_delivery',   moduleKey:'SYL-MOD-RAD', name:'Report Delivery',         description:'Deliver report to patient via print or WhatsApp PDF',                  tier:'STANDARD',   defaultOn:true,  sortOrder:23 },
  { featureKey:'rad.modality_worklist', moduleKey:'SYL-MOD-RAD', name:'DICOM Worklist',          description:'Push worklist to DICOM-compatible imaging equipment',                  tier:'ENTERPRISE', defaultOn:false, sortOrder:40 },

  // ── INSURANCE & TPA (SYL-MOD-INS) ────────────────────────────────────────
  { featureKey:'ins.claim_creation',    moduleKey:'SYL-MOD-INS', name:'Claim Creation',          description:'Create insurance claims with insurer, policy number, diagnosis, and amount', tier:'BASIC', defaultOn:true,  sortOrder:10 },
  { featureKey:'ins.pre_auth',          moduleKey:'SYL-MOD-INS', name:'Pre-Authorization',       description:'Submit and track pre-authorisation requests for planned procedures',    tier:'STANDARD',   defaultOn:true,  sortOrder:20 },
  { featureKey:'ins.claim_status',      moduleKey:'SYL-MOD-INS', name:'Claim Status Tracking',   description:'Track claim through: Submitted → Under Review → Approved → Settled',   tier:'STANDARD',   defaultOn:true,  sortOrder:21 },
  { featureKey:'ins.cashless_flag',     moduleKey:'SYL-MOD-INS', name:'Cashless Admission Flag', description:'Flag admission as cashless TPA and link to pre-auth',                   tier:'STANDARD',   defaultOn:true,  sortOrder:22 },
  { featureKey:'ins.settlement',        moduleKey:'SYL-MOD-INS', name:'Settlement Recording',    description:'Record settlement amount, date, and shortfall from insurer',            tier:'STANDARD',   defaultOn:true,  sortOrder:23 },
  { featureKey:'ins.outstanding',       moduleKey:'SYL-MOD-INS', name:'Outstanding Claims Report',description:'Report of all submitted but unpaid claims by insurer',                 tier:'ADVANCED',   defaultOn:false, sortOrder:30 },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEEDER
// ─────────────────────────────────────────────────────────────────────────────
async function run() {
  const ALL = [...GENERIC, ...HEALTHCARE_OPD, ...HEALTHCARE_IPD];

  let created = 0, updated = 0, errors = 0;

  for (const f of ALL) {
    const data = {
      featureKey:   f.featureKey,
      moduleKey:    f.moduleKey,
      name:         f.name,
      description:  f.description || null,
      tier:         f.tier,
      defaultOn:    f.defaultOn,
      isActive:     true,
      sortOrder:    f.sortOrder,
      dependencies: f.dependencies || [],
    };

    try {
      const exists = await p.moduleFeature.findUnique({ where: { featureKey: data.featureKey } });
      if (exists) {
        await p.moduleFeature.update({ where: { featureKey: data.featureKey }, data });
        updated++;
      } else {
        await p.moduleFeature.create({ data });
        created++;
      }
    } catch (e) {
      console.error(`  ✗ ${f.featureKey}: ${e.message}`);
      errors++;
    }
  }

  // Summary by module
  const byModule = {};
  ALL.forEach(f => { byModule[f.moduleKey] = (byModule[f.moduleKey] || 0) + 1; });

  console.log('\n══════════════════════════════════════════════');
  console.log('  SYLLABRIX MODULE FEATURE SEEDER — COMPLETE');
  console.log('══════════════════════════════════════════════');
  console.log(`  Created : ${created}`);
  console.log(`  Updated : ${updated}`);
  console.log(`  Errors  : ${errors}`);
  console.log(`  Total   : ${ALL.length} features across ${Object.keys(byModule).length} modules`);
  console.log('──────────────────────────────────────────────');
  Object.entries(byModule).sort(([a], [b]) => a.localeCompare(b)).forEach(([mod, count]) => {
    console.log(`  ${mod.padEnd(18)} ${count} features`);
  });
  console.log('══════════════════════════════════════════════\n');

  await p.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
