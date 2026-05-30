/**
 * Syllabrix — Module Help Guide Seeder
 * Run: node src/scripts/seedHelp.js
 * Seeds English SOPs for all 23 modules.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.development') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ARTICLES = [

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'invoicing',
    lang: 'en',
    title: 'How to Create and Manage Invoices',
    overview: 'The Invoicing module lets you create GST-compliant invoices, record payments, send bills to customers via WhatsApp or Email, and track what is paid, pending, or overdue. Use this module every time you sell a product or service and need a formal billing record.',
    sections: [
      {
        heading: 'Creating a New Invoice',
        steps: [
          { instruction: 'Go to the Invoices page from the left sidebar.' },
          { instruction: 'Click the "New Invoice" button in the top-right corner.' },
          { instruction: 'Select the customer from the dropdown. If the customer does not exist yet, type their name and click "Add new customer".', tip: 'Customer GSTIN and address auto-fill from their saved profile.' },
          { instruction: 'Set the Invoice Date (today by default) and the Due Date.', tip: 'The due date decides when the invoice becomes "Overdue" automatically.' },
          { instruction: 'Click "Add Item", search your inventory or type a custom item name, then enter quantity and unit price.', tip: 'GST is calculated automatically based on the item\'s HSN code and tax rate.' },
          { instruction: 'Add more items if needed by clicking "Add Item" again.' },
          { instruction: 'Review the totals — check subtotal, CGST/SGST (or IGST for interstate), and grand total.' },
          { instruction: 'Add a note in the "Notes" field if you want to include a message on the invoice (optional).' },
          { instruction: 'Click "Save" to finalize the invoice.', tip: 'A saved invoice is ready to send to the customer.' },
        ],
      },
      {
        heading: 'Recording a Payment',
        steps: [
          { instruction: 'Click on any invoice in the list to open it.' },
          { instruction: 'Click the "Record Payment" button.', tip: 'Only available for SENT, PARTIAL, or OVERDUE invoices.' },
          { instruction: 'Enter the amount received, payment date, and payment method (Cash / UPI / Bank Transfer / Cheque / Card).' },
          { instruction: 'Click "Save Payment". Status updates automatically — PARTIAL if partly paid, PAID if fully paid.' },
          { instruction: 'Repeat for additional instalments if the customer pays in parts.', tip: 'You can record multiple payments against the same invoice.' },
        ],
      },
      {
        heading: 'Sending Invoices to Customers',
        steps: [
          { instruction: 'Open the invoice from the list.' },
          { instruction: 'Click "Send via WhatsApp" to send directly to the customer\'s registered mobile number.', tip: 'Requires WhatsApp integration to be set up by your admin in API Keys.' },
          { instruction: 'Or click "Send via Email" to email a PDF copy.', tip: 'Requires SMTP email to be configured by your admin.' },
          { instruction: 'Or click "Download PDF" to save and share manually.' },
        ],
      },
      {
        heading: 'Creating a Razorpay Payment Link',
        steps: [
          { instruction: 'Open an invoice with status SENT, PARTIAL, or OVERDUE.' },
          { instruction: 'Click the "Payment Link" button.', tip: 'Requires Razorpay to be configured by your admin.' },
          { instruction: 'The system generates a payment link — click "Copy Link" and share it with your customer.' },
          { instruction: 'The customer can pay online using UPI, card, or net banking. Payment is automatically recorded when complete.' },
        ],
      },
      {
        heading: 'Filtering and Searching Invoices',
        steps: [
          { instruction: 'Use the Search bar to find invoices by customer name or invoice number.' },
          { instruction: 'Use the Status dropdown to filter: All / Draft / Sent / Partial / Paid / Overdue / Cancelled.', tip: 'Filter by "Overdue" to see all invoices that need follow-up.' },
          { instruction: 'Use page navigation at the bottom if you have more than 50 invoices.' },
        ],
      },
      {
        heading: 'Understanding Invoice Statuses',
        steps: [
          { instruction: 'DRAFT — Invoice is saved but not yet sent. You can still edit it.' },
          { instruction: 'SENT — Invoice has been sent, waiting for payment.' },
          { instruction: 'PARTIAL — Customer has paid part of the amount. Balance is still due.' },
          { instruction: 'PAID — Invoice is fully paid. No further action needed.' },
          { instruction: 'OVERDUE — Payment due date has passed and the invoice is still unpaid.', tip: 'Follow up with the customer immediately.' },
          { instruction: 'CANCELLED — Invoice is void and will not appear in revenue reports.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'inventory',
    lang: 'en',
    title: 'How to Manage Your Inventory',
    overview: 'The Inventory module is your central product catalog. Add products, set prices and stock levels, track expiry dates, receive low-stock alerts, and keep your stock count accurate across all sales channels.',
    sections: [
      {
        heading: 'Adding a New Product',
        steps: [
          { instruction: 'Go to Inventory from the left sidebar.' },
          { instruction: 'Click the "Add Product" button in the top-right corner.' },
          { instruction: 'Enter the product name, category, unit (piece / kg / litre etc.), and selling price.' },
          { instruction: 'Enter the purchase price (cost price) — this is used to calculate your profit margin.', tip: 'Purchase price is not shown to customers. It is for your internal reporting only.' },
          { instruction: 'Set the opening stock quantity — how many units you currently have.' },
          { instruction: 'Set a Low Stock Alert level — you will be notified when stock falls below this number.', tip: 'Example: set 10 for a product you reorder when fewer than 10 remain.' },
          { instruction: 'Enter HSN code and GST rate if the product is taxable.' },
          { instruction: 'Optionally add a barcode (SKU) for POS scanning.' },
          { instruction: 'Click "Save Product".' },
        ],
      },
      {
        heading: 'Updating Stock (Stock In)',
        steps: [
          { instruction: 'Find the product in the inventory list and click on it.' },
          { instruction: 'Click "Add Stock" or the stock adjustment button.' },
          { instruction: 'Enter the quantity received and the purchase price for this batch.' },
          { instruction: 'Optionally add expiry date and supplier details.' },
          { instruction: 'Click "Save". The stock count updates automatically.' },
        ],
      },
      {
        heading: 'Editing a Product',
        steps: [
          { instruction: 'Find the product in the list and click the Edit (pencil) icon.' },
          { instruction: 'Update any fields — name, price, category, HSN, GST rate, alert level.' },
          { instruction: 'Click "Save Changes".', tip: 'Changing the selling price here applies to all future invoices and POS bills. Past invoices are not affected.' },
        ],
      },
      {
        heading: 'Searching and Filtering Products',
        steps: [
          { instruction: 'Use the Search bar at the top to find a product by name or barcode.' },
          { instruction: 'Use the Category filter to view products in a specific category.' },
          { instruction: 'Click the "Low Stock" tab to see all products that are at or below their alert level.' },
          { instruction: 'Click the "Expired" tab to see products past their expiry date.', tip: 'Remove or quarantine expired products immediately to avoid selling them.' },
        ],
      },
      {
        heading: 'Understanding Stock Alerts',
        steps: [
          { instruction: 'Products with stock at or below the low stock alert level appear highlighted in orange.' },
          { instruction: 'Products with zero stock appear in red — they cannot be added to invoices or POS bills.' },
          { instruction: 'Expired products appear in a separate tab and are marked clearly.', tip: 'Set realistic alert levels based on how fast each product sells and your reorder lead time.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'pos',
    lang: 'en',
    title: 'How to Use the Point of Sale (POS)',
    overview: 'The POS module is your billing counter for walk-in customers. Scan or search products, add them to the cart, accept payment, and print a receipt — all in seconds. It automatically deducts stock after every sale.',
    sections: [
      {
        heading: 'Making a Sale',
        steps: [
          { instruction: 'Go to Point of Sale from the left sidebar.' },
          { instruction: 'Search for a product by typing its name or scanning a barcode in the search box.', tip: 'Use a USB barcode scanner for faster checkout at a physical counter.' },
          { instruction: 'Click the product to add it to the cart. Click multiple times or change the quantity in the cart.' },
          { instruction: 'Continue adding products until the bill is complete.' },
          { instruction: 'Select the customer if it is a regular customer (optional for walk-ins).' },
          { instruction: 'Review the total at the bottom of the cart — GST is included automatically.' },
          { instruction: 'Click "Charge" or "Collect Payment".' },
          { instruction: 'Select the payment method: Cash, UPI, Card, or Split payment.' },
          { instruction: 'Enter the amount received. If paying by cash, the change amount is shown automatically.' },
          { instruction: 'Click "Complete Sale" to finish. A receipt is generated.' },
        ],
      },
      {
        heading: 'Printing or Sharing a Receipt',
        steps: [
          { instruction: 'After completing a sale, the receipt appears on screen.' },
          { instruction: 'Click "Print Receipt" to print from a connected thermal printer.' },
          { instruction: 'Click "Share on WhatsApp" to send the receipt to the customer\'s mobile number.', tip: 'The customer must be selected before the sale for WhatsApp sharing to work.' },
          { instruction: 'Click "New Sale" to start the next transaction.' },
        ],
      },
      {
        heading: 'Applying a Discount',
        steps: [
          { instruction: 'In the cart, click on the discount field at the bottom.' },
          { instruction: 'Enter a percentage discount (e.g. 10 for 10%) or a flat discount amount.' },
          { instruction: 'The total updates automatically. The discount is shown on the receipt.' },
        ],
      },
      {
        heading: 'Handling Returns and Refunds at POS',
        steps: [
          { instruction: 'Go to the Sales History tab in POS.' },
          { instruction: 'Find the original sale and click "Return / Refund".' },
          { instruction: 'Select the items being returned and the return quantity.' },
          { instruction: 'Confirm the refund method (Cash back or Store credit).' },
          { instruction: 'Click "Process Return". Stock is added back automatically.' },
        ],
      },
      {
        heading: 'Viewing Daily Sales Summary',
        steps: [
          { instruction: 'Click the "Today\'s Summary" or "Cash Drawer" section in POS.' },
          { instruction: 'View total sales, number of transactions, and payment method breakdown for the day.' },
          { instruction: 'Click "End of Day" to close the session and print a Z-report.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'expenses',
    lang: 'en',
    title: 'How to Record and Track Expenses',
    overview: 'The Expenses module helps you record all business expenditures — rent, utilities, salaries, raw materials, travel, and more. Track where your money is going, attach receipts, and reconcile with your accounts.',
    sections: [
      {
        heading: 'Recording a New Expense',
        steps: [
          { instruction: 'Go to Expenses from the left sidebar.' },
          { instruction: 'Click "Record Expense" in the top-right corner.' },
          { instruction: 'Select the expense category (Rent / Salaries / Utilities / Marketing / Travel / Other).' },
          { instruction: 'Enter the amount and the date of the expense.' },
          { instruction: 'Add a description — be specific so you can identify it later (e.g. "Office rent – May 2025").', tip: 'Good descriptions make monthly reconciliation much easier.' },
          { instruction: 'Select or enter the vendor / payee name (who was paid).' },
          { instruction: 'Select the payment method (Cash / Bank Transfer / UPI / Cheque).' },
          { instruction: 'Attach a receipt photo or PDF if available (optional but recommended).', tip: 'Receipts are required for tax purposes and audits.' },
          { instruction: 'Click "Save Expense".' },
        ],
      },
      {
        heading: 'Filtering and Reviewing Expenses',
        steps: [
          { instruction: 'Use the Date Range filter to view expenses for a specific period (this month, last month, custom).' },
          { instruction: 'Use the Category filter to view a specific type of expense.' },
          { instruction: 'View the total at the top — this shows total spend for the selected period.' },
          { instruction: 'Click any expense to view full details or edit it.' },
        ],
      },
      {
        heading: 'Editing or Deleting an Expense',
        steps: [
          { instruction: 'Click on the expense from the list.' },
          { instruction: 'Click "Edit" to correct any details (amount, date, category, description).' },
          { instruction: 'Click "Delete" to remove the expense permanently.', tip: 'Only delete duplicates or entries made by mistake. Deleted expenses cannot be recovered.' },
        ],
      },
      {
        heading: 'Understanding Expense Categories',
        steps: [
          { instruction: 'Use consistent categories every month for accurate reporting.' },
          { instruction: 'Rent — monthly office, shop, or warehouse rent.' },
          { instruction: 'Salaries — staff wages, bonuses, and contractor payments.' },
          { instruction: 'Utilities — electricity, water, internet, phone bills.' },
          { instruction: 'Marketing — advertising, printing, promotions, social media.' },
          { instruction: 'Travel — fuel, transport, hotel stays for business trips.' },
          { instruction: 'Purchases — raw materials, stock purchased for resale.' },
          { instruction: 'Other — anything that does not fit the above categories.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'customers',
    lang: 'en',
    title: 'How to Manage Your Customers (CRM)',
    overview: 'The Customers module is your customer relationship database. Store contact details, track purchase history, manage outstanding balances, and segment customers for targeted marketing campaigns.',
    sections: [
      {
        heading: 'Adding a New Customer',
        steps: [
          { instruction: 'Go to Customers from the left sidebar.' },
          { instruction: 'Click "Add Customer" in the top-right corner.' },
          { instruction: 'Enter the customer\'s name, mobile number, and email address.' },
          { instruction: 'Add their billing address and GSTIN if they are a business customer.', tip: 'GSTIN is required to generate GST invoices for B2B customers.' },
          { instruction: 'Select a customer type — Individual or Business.' },
          { instruction: 'Click "Save Customer".' },
        ],
      },
      {
        heading: 'Viewing a Customer\'s History',
        steps: [
          { instruction: 'Click on any customer in the list to open their profile.' },
          { instruction: 'View their complete invoice history, total amount spent, and outstanding balance.' },
          { instruction: 'See all past payments made by this customer.' },
          { instruction: 'View any notes or tags added to this customer.' },
        ],
      },
      {
        heading: 'Editing Customer Details',
        steps: [
          { instruction: 'Open the customer profile and click "Edit".' },
          { instruction: 'Update name, phone, email, address, or GSTIN as needed.' },
          { instruction: 'Click "Save Changes". Updated details appear on all future invoices.' },
        ],
      },
      {
        heading: 'Searching and Filtering Customers',
        steps: [
          { instruction: 'Use the Search bar to find a customer by name, phone, or email.' },
          { instruction: 'Filter by customer type (Individual / Business) using the dropdown.' },
          { instruction: 'Sort by total spent to identify your top customers.' },
          { instruction: 'Filter by customers with outstanding balance to follow up on payments.' },
        ],
      },
      {
        heading: 'Adding Notes to a Customer',
        steps: [
          { instruction: 'Open the customer profile.' },
          { instruction: 'Scroll to the Notes section and click "Add Note".' },
          { instruction: 'Type any relevant information — preferences, complaints, agreements, or follow-up reminders.' },
          { instruction: 'Click "Save Note". Notes are visible only internally, not to the customer.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'vendors',
    lang: 'en',
    title: 'How to Manage Vendors and Bills',
    overview: 'The Vendors module tracks all your suppliers. Record purchase bills, manage what you owe, create Goods Receipt Notes (GRN) when stock arrives, and maintain a clear record of all inward transactions.',
    sections: [
      {
        heading: 'Adding a Vendor',
        steps: [
          { instruction: 'Go to Vendors from the left sidebar.' },
          { instruction: 'Click "Add Vendor".' },
          { instruction: 'Enter the vendor name, contact person, mobile number, and email.' },
          { instruction: 'Add their GSTIN, PAN, and billing address if available.', tip: 'GSTIN is required to claim Input Tax Credit (ITC) on their bills.' },
          { instruction: 'Set payment terms — how many days you typically have to pay (e.g. Net 30).' },
          { instruction: 'Click "Save Vendor".' },
        ],
      },
      {
        heading: 'Recording a Purchase Bill',
        steps: [
          { instruction: 'Open the vendor profile or go to the Bills tab.' },
          { instruction: 'Click "Add Bill" or "New Purchase Bill".' },
          { instruction: 'Enter the bill number from the vendor\'s invoice, bill date, and due date.' },
          { instruction: 'Add line items — product name, quantity, rate, and GST rate.' },
          { instruction: 'Verify the total matches the physical bill from your vendor.' },
          { instruction: 'Click "Save Bill". This records your payable amount.' },
        ],
      },
      {
        heading: 'Recording a GRN (Goods Receipt Note)',
        steps: [
          { instruction: 'When stock physically arrives, go to the vendor\'s bill or the GRN section.' },
          { instruction: 'Click "Create GRN" or "Receive Stock".' },
          { instruction: 'Enter the quantity actually received for each item.', tip: 'Quantity received may differ from quantity ordered — record only what actually arrived.' },
          { instruction: 'Click "Save GRN". Stock is added to your Inventory automatically.' },
        ],
      },
      {
        heading: 'Paying a Vendor Bill',
        steps: [
          { instruction: 'Open the bill from the Bills list.' },
          { instruction: 'Click "Record Payment".' },
          { instruction: 'Enter the amount paid, payment date, and payment method.' },
          { instruction: 'Click "Save". Bill status updates to Partial or Paid automatically.' },
        ],
      },
      {
        heading: 'Tracking Outstanding Payables',
        steps: [
          { instruction: 'Filter bills by status "Unpaid" or "Overdue" to see what you owe.' },
          { instruction: 'Sort by due date to prioritise which vendors to pay first.' },
          { instruction: 'The total outstanding amount is shown at the top of the Bills tab.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'accounts',
    lang: 'en',
    title: 'How to Use the Accounts Module',
    overview: 'The Accounts module gives you a real-time view of your business finances — cash on hand, bank balances, receivables, payables, and profit & loss. It consolidates data from Invoicing, Expenses, Vendors, and Payroll automatically.',
    sections: [
      {
        heading: 'Viewing Your Financial Dashboard',
        steps: [
          { instruction: 'Go to Accounts from the left sidebar.' },
          { instruction: 'The dashboard shows: Cash & Bank balance, Total Receivables (what customers owe you), Total Payables (what you owe vendors), and Net Cash Position.' },
          { instruction: 'Use the date range selector to view figures for a specific month or period.' },
        ],
      },
      {
        heading: 'Viewing Profit & Loss',
        steps: [
          { instruction: 'Click on the "P&L" or "Profit & Loss" tab.' },
          { instruction: 'Revenue — total from invoices paid in the period.' },
          { instruction: 'Expenses — total expenses recorded in the period.' },
          { instruction: 'Gross Profit = Revenue – Cost of Goods Sold.' },
          { instruction: 'Net Profit = Gross Profit – All Other Expenses.', tip: 'A negative net profit means you are spending more than you are earning. Review your expense categories.' },
        ],
      },
      {
        heading: 'Managing Bank Accounts and Cash Books',
        steps: [
          { instruction: 'Go to the "Accounts" or "Ledger" tab.' },
          { instruction: 'Click "Add Account" to add a bank account or cash account.' },
          { instruction: 'Enter the account name (e.g. HDFC Current Account), opening balance, and account type.' },
          { instruction: 'All transactions (invoices, expenses, payroll, vendor payments) are automatically posted to the correct account.' },
        ],
      },
      {
        heading: 'Reconciling Accounts',
        steps: [
          { instruction: 'At the end of each month, compare your Syllabrix account balances with your actual bank statements.' },
          { instruction: 'If there is a difference, check for: missing expenses, uncategorised bank transactions, or pending journal entries.' },
          { instruction: 'Click "Add Journal Entry" to manually adjust any balance discrepancies.' },
          { instruction: 'Mark the account as "Reconciled" once it matches your bank statement.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'payroll',
    lang: 'en',
    title: 'How to Process Payroll',
    overview: 'The Payroll module calculates monthly salaries for all staff — including PF, ESI, Professional Tax, and pro-rata deductions for late arrivals or absent days. It generates payslips and records the salary expense automatically.',
    sections: [
      {
        heading: 'Setting Up Staff for Payroll',
        steps: [
          { instruction: 'First, make sure all staff members are added in the Staff module with their salary details.' },
          { instruction: 'Go to Staff → click on a staff member → set their Monthly CTC, PF number, ESI number if applicable.' },
          { instruction: 'Set the salary components: Basic, HRA, Conveyance Allowance, Special Allowance.' },
          { instruction: 'Confirm the bank account details for salary transfer.' },
        ],
      },
      {
        heading: 'Running Monthly Payroll',
        steps: [
          { instruction: 'Go to Payroll from the left sidebar.' },
          { instruction: 'Click "Process Payroll".' },
          { instruction: 'Select the month and year for payroll.', tip: 'You can only process payroll after the month ends or after the attendance for the month is finalised.' },
          { instruction: 'The system calculates gross salary, deductions (PF, ESI, PT, absent days), and net pay for each employee.' },
          { instruction: 'Review the payroll summary — check for any unusual deductions or amounts.' },
          { instruction: 'Click "Confirm & Generate Payroll" to finalise.' },
        ],
      },
      {
        heading: 'Reviewing and Approving Individual Payslips',
        steps: [
          { instruction: 'After processing, click on any employee row to view their payslip.' },
          { instruction: 'The payslip shows: Earnings (Basic + Allowances), Deductions (PF + ESI + PT + Loss of Pay), and Net Pay.' },
          { instruction: 'If any amount is incorrect, click "Edit" to adjust before marking as paid.' },
        ],
      },
      {
        heading: 'Marking Payroll as Paid',
        steps: [
          { instruction: 'Once salaries are transferred to employees, go to the payroll run.' },
          { instruction: 'Click "Mark as Paid" for the entire run, or mark individual employees as paid.' },
          { instruction: 'Enter the payment date and method (Bank Transfer / Cash).' },
          { instruction: 'Click "Confirm". The salary expense is automatically recorded in your Accounts.', tip: 'Always mark payroll as paid on the actual payment date for accurate bookkeeping.' },
        ],
      },
      {
        heading: 'Understanding Deductions',
        steps: [
          { instruction: 'PF (Provident Fund) — 12% of Basic salary deducted from employee + 12% contributed by employer.' },
          { instruction: 'ESI (Employee State Insurance) — applicable for employees earning below ₹21,000/month. Employee contributes 0.75%, employer contributes 3.25%.' },
          { instruction: 'Professional Tax — state-specific tax deducted based on salary slab. Varies by state.' },
          { instruction: 'Loss of Pay (LOP) — deducted for absent days beyond approved leaves.', tip: 'Attendance data from the Attendance module is used to calculate LOP automatically.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'staff',
    lang: 'en',
    title: 'How to Manage Staff Members',
    overview: 'The Staff module is your employee database. Add team members, assign roles and branches, store documents, track joining details, and manage access permissions. Every staff member added here can be assigned a login to Syllabrix.',
    sections: [
      {
        heading: 'Adding a New Staff Member',
        steps: [
          { instruction: 'Go to Staff from the left sidebar.' },
          { instruction: 'Click "Add Staff Member".' },
          { instruction: 'Enter their full name, mobile number, and email address.' },
          { instruction: 'Select their role from the dropdown (Manager / Accountant / Cashier / Staff etc.).' },
          { instruction: 'Assign them to a branch if your business has multiple locations.' },
          { instruction: 'Enter their joining date, department, and designation.' },
          { instruction: 'Upload their profile photo (optional).' },
          { instruction: 'Click "Save". A login is created automatically — they will receive credentials on their email.' },
        ],
      },
      {
        heading: 'Setting Salary Details',
        steps: [
          { instruction: 'Open the staff member\'s profile.' },
          { instruction: 'Click the "Salary" or "Payroll" tab.' },
          { instruction: 'Enter the Monthly CTC and break it down: Basic, HRA, Conveyance, Special Allowance.' },
          { instruction: 'Add PF and ESI numbers if applicable.' },
          { instruction: 'Enter bank account details for salary transfer.' },
          { instruction: 'Click "Save Salary Details".' },
        ],
      },
      {
        heading: 'Managing Roles and Permissions',
        steps: [
          { instruction: 'Each staff member is assigned a role that controls what they can see and do in Syllabrix.' },
          { instruction: 'To change a role, open the staff profile and select a new role from the dropdown.' },
          { instruction: 'Roles are configured in Settings → Roles. Contact your admin to create custom roles.' },
        ],
      },
      {
        heading: 'Deactivating a Staff Member',
        steps: [
          { instruction: 'Open the staff member\'s profile.' },
          { instruction: 'Click "Deactivate" or "Mark as Inactive".' },
          { instruction: 'Their login is disabled immediately. Historical data (attendance, payroll, sales) is preserved.', tip: 'Never delete a staff member — deactivate them instead to keep records intact.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'attendance',
    lang: 'en',
    title: 'How to Track Attendance',
    overview: 'The Attendance module records daily staff check-in and check-out times, calculates present and absent days, manages leaves, and feeds this data directly into Payroll for accurate Loss of Pay calculations.',
    sections: [
      {
        heading: 'Marking Daily Attendance',
        steps: [
          { instruction: 'Go to Attendance from the left sidebar.' },
          { instruction: 'Select the date (today is selected by default).' },
          { instruction: 'For each staff member, mark: Present / Absent / Half Day / On Leave / Holiday.' },
          { instruction: 'Optionally enter check-in and check-out times for detailed tracking.' },
          { instruction: 'Click "Save Attendance" to record the day.' },
        ],
      },
      {
        heading: 'Marking Attendance in Bulk',
        steps: [
          { instruction: 'Click "Mark All Present" at the top to mark everyone as present at once.' },
          { instruction: 'Then individually change those who are absent or on leave.' },
          { instruction: 'This is faster than marking each person individually.', tip: 'Do this every morning as part of your opening routine.' },
        ],
      },
      {
        heading: 'Managing Leave Requests',
        steps: [
          { instruction: 'Go to the "Leave Requests" tab.' },
          { instruction: 'View all pending leave applications from staff.' },
          { instruction: 'Click "Approve" or "Reject" on each request.' },
          { instruction: 'Approved leaves automatically mark the staff member as On Leave on the attendance calendar.' },
        ],
      },
      {
        heading: 'Viewing Monthly Attendance Report',
        steps: [
          { instruction: 'Select a month and year from the date picker.' },
          { instruction: 'The report shows: Total Working Days, Days Present, Days Absent, Leaves Taken, and Loss of Pay days for each employee.' },
          { instruction: 'This data is used automatically when processing payroll for the month.', tip: 'Always finalise attendance before running payroll to ensure correct deductions.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'appointments',
    lang: 'en',
    title: 'How to Manage Appointments',
    overview: 'The Appointments module lets you schedule, manage, and track client appointments. Set services, assign staff, manage time slots, mark attendance, and generate invoices directly from a completed appointment.',
    sections: [
      {
        heading: 'Booking a New Appointment',
        steps: [
          { instruction: 'Go to Appointments from the left sidebar.' },
          { instruction: 'Click "New Appointment" or click on an empty time slot in the calendar view.' },
          { instruction: 'Select or search for the customer. Add a new customer if they are visiting for the first time.' },
          { instruction: 'Select the service or treatment being booked.' },
          { instruction: 'Assign a staff member who will handle the appointment.' },
          { instruction: 'Choose the date and time slot.' },
          { instruction: 'Add any notes (e.g. customer preferences, special requests).' },
          { instruction: 'Click "Book Appointment". The slot is now blocked in the calendar.' },
        ],
      },
      {
        heading: 'Managing the Appointment Calendar',
        steps: [
          { instruction: 'Use the Day / Week / Month view buttons to switch calendar views.' },
          { instruction: 'Drag and drop appointments to reschedule them to a different time or date.' },
          { instruction: 'Click any appointment block to view full details, edit, or cancel.' },
          { instruction: 'Filter by staff member to see one person\'s schedule at a time.' },
        ],
      },
      {
        heading: 'Marking Attendance and Completing an Appointment',
        steps: [
          { instruction: 'When the customer arrives, open their appointment.' },
          { instruction: 'Click "Mark Arrived" to confirm they showed up.' },
          { instruction: 'After the service is done, click "Mark Completed".' },
          { instruction: 'Click "Generate Invoice" to automatically create an invoice for the appointment.', tip: 'The invoice is pre-filled with the service, assigned staff, and customer details.' },
        ],
      },
      {
        heading: 'Handling Cancellations and No-Shows',
        steps: [
          { instruction: 'Open the appointment from the calendar.' },
          { instruction: 'Click "Cancel Appointment" if the customer cancels in advance.' },
          { instruction: 'Click "Mark as No-Show" if the customer did not arrive without notice.' },
          { instruction: 'The time slot is freed up automatically for rebooking.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'fees',
    lang: 'en',
    title: 'How to Manage Fees and Collections',
    overview: 'The Fees module is designed for schools, coaching centres, and training institutes. Define fee structures, assign them to students, track payment status, send reminders, and generate fee receipts.',
    sections: [
      {
        heading: 'Setting Up a Fee Structure',
        steps: [
          { instruction: 'Go to Fees from the left sidebar.' },
          { instruction: 'Click "Fee Structures" or "Manage Structures".' },
          { instruction: 'Click "Add Fee Structure".' },
          { instruction: 'Enter the structure name (e.g. Annual Tuition – Class 10).' },
          { instruction: 'Add fee components: Tuition Fee, Admission Fee, Library Fee, Lab Fee, Transport Fee etc.' },
          { instruction: 'Set the amount and due date for each component.' },
          { instruction: 'Select whether the fee is One-Time or Recurring (Monthly / Quarterly / Annually).' },
          { instruction: 'Click "Save Structure".' },
        ],
      },
      {
        heading: 'Assigning Fees to a Student',
        steps: [
          { instruction: 'Open the student\'s profile from the Students module.' },
          { instruction: 'Go to the "Fees" tab.' },
          { instruction: 'Click "Assign Fee Structure" and select the applicable structure.' },
          { instruction: 'Set the academic year and start date.' },
          { instruction: 'Click "Assign". Scheduled fee dues are created automatically.' },
        ],
      },
      {
        heading: 'Recording a Fee Payment',
        steps: [
          { instruction: 'Open the student\'s fee record.' },
          { instruction: 'Click "Collect Fee" or "Record Payment" next to the due amount.' },
          { instruction: 'Enter the amount received, date, and payment method (Cash / UPI / Cheque / DD).' },
          { instruction: 'Click "Save Payment". A receipt number is generated.' },
          { instruction: 'Click "Print Receipt" to give the student a payment receipt.' },
        ],
      },
      {
        heading: 'Tracking Fee Defaulters',
        steps: [
          { instruction: 'Go to the "Defaulters" or "Pending Fees" tab.' },
          { instruction: 'View all students with overdue fee payments.' },
          { instruction: 'Click "Send Reminder" to notify them via WhatsApp or SMS.' },
          { instruction: 'Filter by class, batch, or fee type to narrow down the list.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'progress',
    lang: 'en',
    title: 'How to Manage Students and Progress',
    overview: 'The Students module tracks student enrolment, academic progress, batch allocation, assessments, and attendance. Use it to maintain a complete profile for every student in your institution.',
    sections: [
      {
        heading: 'Adding a New Student',
        steps: [
          { instruction: 'Go to Students from the left sidebar.' },
          { instruction: 'Click "Add Student".' },
          { instruction: 'Enter the student\'s full name, date of birth, gender, mobile, and email.' },
          { instruction: 'Add parent or guardian details and their contact number.' },
          { instruction: 'Select the class, batch, or course they are enrolling in.' },
          { instruction: 'Enter the enrolment date and roll number.' },
          { instruction: 'Upload a profile photo (optional).' },
          { instruction: 'Click "Save Student". A student ID is generated automatically.' },
        ],
      },
      {
        heading: 'Assigning a Student to a Batch',
        steps: [
          { instruction: 'Open the student\'s profile.' },
          { instruction: 'Click the "Batch" or "Course" tab.' },
          { instruction: 'Click "Assign Batch" and select the appropriate batch.' },
          { instruction: 'Click "Save". The student now appears in the batch roster.' },
        ],
      },
      {
        heading: 'Recording Assessment Results',
        steps: [
          { instruction: 'Go to the student\'s profile and click the "Progress" tab.' },
          { instruction: 'Click "Add Assessment".' },
          { instruction: 'Enter the subject, assessment type (Test / Assignment / Exam), marks obtained, and maximum marks.' },
          { instruction: 'Click "Save". The result appears in their progress history.' },
        ],
      },
      {
        heading: 'Viewing a Student\'s Complete Profile',
        steps: [
          { instruction: 'Click on any student in the list to open their full profile.' },
          { instruction: 'View: personal details, batch, attendance record, fee payment status, and academic progress — all in one place.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'assets',
    lang: 'en',
    title: 'How to Manage Business Assets',
    overview: 'The Assets module tracks all your physical business assets — machines, vehicles, computers, furniture, and equipment. Record purchase details, track depreciation, schedule maintenance, and know the current value of everything your business owns.',
    sections: [
      {
        heading: 'Adding a New Asset',
        steps: [
          { instruction: 'Go to Assets from the left sidebar.' },
          { instruction: 'Click "Add Asset".' },
          { instruction: 'Enter the asset name (e.g. "Tata Ace Delivery Van"), category (Vehicle / Machinery / Furniture / IT Equipment), and location.' },
          { instruction: 'Enter the purchase date and purchase price (original cost).' },
          { instruction: 'Set the depreciation method (Straight Line or Written Down Value) and useful life in years.', tip: 'Straight Line: equal depreciation each year. WDV: higher depreciation in early years.' },
          { instruction: 'Add serial number, model, and manufacturer for identification.' },
          { instruction: 'Upload the purchase invoice or warranty document (optional).' },
          { instruction: 'Click "Save Asset".' },
        ],
      },
      {
        heading: 'Viewing Asset Depreciation',
        steps: [
          { instruction: 'Open an asset from the list.' },
          { instruction: 'Click the "Depreciation" tab.' },
          { instruction: 'View the depreciation schedule year by year — original cost, annual depreciation, and current book value.' },
          { instruction: 'The current value shown reflects actual depreciation as of today.' },
        ],
      },
      {
        heading: 'Logging Maintenance Records',
        steps: [
          { instruction: 'Open the asset and click the "Maintenance" tab.' },
          { instruction: 'Click "Add Maintenance Record".' },
          { instruction: 'Enter the service date, type of work done, service provider, and cost.' },
          { instruction: 'Set a next service due date for reminders.' },
          { instruction: 'Click "Save". The maintenance cost is recorded as an expense automatically.' },
        ],
      },
      {
        heading: 'Disposing or Writing Off an Asset',
        steps: [
          { instruction: 'Open the asset and click "Dispose" or "Write Off".' },
          { instruction: 'Enter the disposal date and any sale or scrap value received.' },
          { instruction: 'The system calculates the profit or loss on disposal automatically.' },
          { instruction: 'Click "Confirm Disposal". The asset is removed from active records.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'lease',
    lang: 'en',
    title: 'How to Manage Lease Agreements',
    overview: 'The Lease module helps you track properties or equipment you have leased out or taken on lease. Record lease terms, track rental income or expenses, manage renewal dates, and get alerts before a lease expires.',
    sections: [
      {
        heading: 'Adding a Lease Agreement',
        steps: [
          { instruction: 'Go to Lease from the left sidebar.' },
          { instruction: 'Click "New Lease Agreement".' },
          { instruction: 'Select the lease type — Lessor (you are renting out) or Lessee (you are renting in).' },
          { instruction: 'Enter the property or asset name, address or description.' },
          { instruction: 'Enter the tenant or landlord name and contact details.' },
          { instruction: 'Set the lease start date, end date, and monthly rent amount.' },
          { instruction: 'Set the security deposit amount paid or received.' },
          { instruction: 'Set renewal alert — how many days before expiry you want a reminder.', tip: 'Set at least 60 days to give enough time to negotiate renewal or find a new tenant.' },
          { instruction: 'Upload the signed lease agreement document (optional).' },
          { instruction: 'Click "Save Lease".' },
        ],
      },
      {
        heading: 'Recording Rent Payments',
        steps: [
          { instruction: 'Open the lease agreement.' },
          { instruction: 'Click "Record Rent Payment".' },
          { instruction: 'Enter the month, amount received or paid, and payment date.' },
          { instruction: 'Click "Save". The payment history is updated.' },
        ],
      },
      {
        heading: 'Tracking Lease Renewals',
        steps: [
          { instruction: 'The Lease dashboard shows leases expiring soon in a separate section.' },
          { instruction: 'Click on a near-expiry lease to review its terms.' },
          { instruction: 'Click "Renew Lease" to extend the period with new terms.' },
          { instruction: 'Or click "Mark as Closed" if the lease is not being renewed.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'membershipplans',
    lang: 'en',
    title: 'How to Manage Memberships',
    overview: 'The Memberships module lets you create subscription plans, enrol members, track active and expired memberships, collect recurring fees, and send renewal reminders — ideal for gyms, clubs, coworking spaces, and subscription businesses.',
    sections: [
      {
        heading: 'Creating a Membership Plan',
        steps: [
          { instruction: 'Go to Memberships from the left sidebar.' },
          { instruction: 'Click "Membership Plans" → "Add New Plan".' },
          { instruction: 'Enter the plan name (e.g. "Gold – 3 Months"), duration in days or months, and price.' },
          { instruction: 'Add included benefits or features in the description.' },
          { instruction: 'Set whether the plan auto-renews or is one-time.' },
          { instruction: 'Click "Save Plan".' },
        ],
      },
      {
        heading: 'Enrolling a Member',
        steps: [
          { instruction: 'Click "Enrol Member" or open a customer profile and click "Assign Membership".' },
          { instruction: 'Select the membership plan.' },
          { instruction: 'Set the start date.' },
          { instruction: 'Record the payment amount and method.' },
          { instruction: 'Click "Confirm Enrolment". The member\'s end date is calculated automatically.' },
        ],
      },
      {
        heading: 'Tracking Active and Expired Members',
        steps: [
          { instruction: 'The Members list shows all members with their plan, start date, end date, and status.' },
          { instruction: 'Filter by "Expiring This Month" to see who needs renewal.' },
          { instruction: 'Filter by "Expired" to see lapsed members who may need follow-up.' },
          { instruction: 'Click "Send Renewal Reminder" to notify them via WhatsApp.' },
        ],
      },
      {
        heading: 'Renewing a Membership',
        steps: [
          { instruction: 'Open the member\'s profile.' },
          { instruction: 'Click "Renew Membership".' },
          { instruction: 'Select the plan for renewal (can be different from original).' },
          { instruction: 'Confirm the new start and end dates and collect payment.' },
          { instruction: 'Click "Save Renewal". History is preserved.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'whatsapp',
    lang: 'en',
    title: 'How to Use WhatsApp Integration',
    overview: 'The WhatsApp module lets you send transactional messages directly from Syllabrix — invoices, payment reminders, appointment confirmations, and custom messages — using your official WhatsApp Business API number.',
    sections: [
      {
        heading: 'Sending an Invoice via WhatsApp',
        steps: [
          { instruction: 'Go to Invoices and open any invoice.' },
          { instruction: 'Click "Send via WhatsApp". The message is sent instantly to the customer\'s registered mobile number.', tip: 'The customer\'s mobile number must be saved in their profile.' },
          { instruction: 'The message includes the invoice number, amount due, due date, and a payment link (if Razorpay is configured).' },
        ],
      },
      {
        heading: 'Sending a Custom WhatsApp Message',
        steps: [
          { instruction: 'Go to WhatsApp from the left sidebar.' },
          { instruction: 'Click "New Message".' },
          { instruction: 'Select the recipient customer or enter a phone number.' },
          { instruction: 'Select a message template or type a custom message.', tip: 'Promotional messages require a pre-approved template from Meta. Transactional messages can be sent freely.' },
          { instruction: 'Click "Send Message".' },
        ],
      },
      {
        heading: 'Setting Up WhatsApp (Admin Only)',
        steps: [
          { instruction: 'Go to Nerve Center → API Keys.' },
          { instruction: 'Enter your WhatsApp Access Token, Phone Number ID, and WABA ID from Meta for Developers.' },
          { instruction: 'Enter the Webhook Verify Token you used when setting up the webhook.' },
          { instruction: 'Click "Save" for each field. WhatsApp is now active for your platform.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'campaigns',
    lang: 'en',
    title: 'How to Run WhatsApp Campaigns',
    overview: 'The Campaigns module lets you broadcast marketing messages to groups of customers via WhatsApp — promotions, announcements, festive offers, and reminders — and track delivery status for each message.',
    sections: [
      {
        heading: 'Creating a Campaign',
        steps: [
          { instruction: 'Go to Campaigns from the left sidebar.' },
          { instruction: 'Click "New Campaign".' },
          { instruction: 'Enter the campaign name (for your internal reference).' },
          { instruction: 'Select or create the target audience — all customers, specific tags, or a manual list.' },
          { instruction: 'Select the message template (must be a Meta-approved template for promotional messages).' },
          { instruction: 'Personalise the message using variables like {{customer_name}} or {{business_name}}.' },
          { instruction: 'Schedule the send time or click "Send Now".' },
          { instruction: 'Click "Launch Campaign".' },
        ],
      },
      {
        heading: 'Tracking Campaign Results',
        steps: [
          { instruction: 'Open a completed or running campaign.' },
          { instruction: 'View the delivery stats: Total Sent, Delivered, Read, and Failed.' },
          { instruction: 'Click on "Failed" to see which numbers could not be reached and why.' },
          { instruction: 'Use Read Rate to measure engagement — higher read rate means your message was relevant.' },
        ],
      },
      {
        heading: 'Building a Target Audience',
        steps: [
          { instruction: 'Go to "Audiences" or "Customer Segments".' },
          { instruction: 'Click "Create Audience".' },
          { instruction: 'Filter by: last purchase date, total spend, product purchased, or customer tag.' },
          { instruction: 'Save the audience and use it in future campaigns.' },
          { instruction: 'Example: customers who haven\'t purchased in 60 days → send a win-back offer.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'reports',
    lang: 'en',
    title: 'How to Use Reports',
    overview: 'The Reports module gives you complete business intelligence — sales reports, GST summaries, expense breakdowns, inventory valuations, attendance reports, and more. Use reports to make informed decisions and file your taxes accurately.',
    sections: [
      {
        heading: 'Running a Sales Report',
        steps: [
          { instruction: 'Go to Reports from the left sidebar.' },
          { instruction: 'Select "Sales Report" from the report type list.' },
          { instruction: 'Set the date range — Today, This Week, This Month, This Quarter, or Custom.' },
          { instruction: 'Click "Generate Report". The report shows: Total Revenue, Total Invoices, Average Invoice Value, Top Customers, and Top Products.' },
          { instruction: 'Click "Export to Excel" or "Export to PDF" to download the report.' },
        ],
      },
      {
        heading: 'Generating GST Reports',
        steps: [
          { instruction: 'Select "GST Report" or "GSTR Summary" from the report list.' },
          { instruction: 'Select the month for which you need the GST data.' },
          { instruction: 'The report shows: GSTR-1 data (sales), GSTR-3B summary, HSN-wise breakdown, and state-wise sales.' },
          { instruction: 'Export to Excel for uploading to the GST portal.', tip: 'Reconcile your Syllabrix GST report with your CA before filing.' },
        ],
      },
      {
        heading: 'Inventory and Stock Reports',
        steps: [
          { instruction: 'Select "Inventory Report" or "Stock Valuation".' },
          { instruction: 'View the current value of all stock at cost price and selling price.' },
          { instruction: 'View slow-moving products (not sold in the last 30/60 days).' },
          { instruction: 'View fast-moving products (most sold items) to plan reordering.' },
        ],
      },
      {
        heading: 'Expense Reports',
        steps: [
          { instruction: 'Select "Expense Report" from the report list.' },
          { instruction: 'Set the date range and click "Generate".' },
          { instruction: 'View total expenses by category — see which categories are your biggest costs.' },
          { instruction: 'Compare month-over-month to identify unusual spikes in spending.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'ai',
    lang: 'en',
    title: 'How to Use the AI Copilot',
    overview: 'The AI Copilot is your intelligent business assistant. Ask it questions about your sales, customers, inventory, or operations — and get instant, data-driven answers in plain language. No formulas, no complex reports.',
    sections: [
      {
        heading: 'Starting a Conversation',
        steps: [
          { instruction: 'Go to AI Copilot from the left sidebar.' },
          { instruction: 'Type your question in the chat box at the bottom and press Enter or click Send.' },
          { instruction: 'The AI responds within seconds using your actual business data.', tip: 'You can ask in English or Hindi — the AI understands both.' },
        ],
      },
      {
        heading: 'What You Can Ask',
        steps: [
          { instruction: '"Who are my top 5 customers this month?" — get a ranked list by revenue.' },
          { instruction: '"Which products are running low on stock?" — instant inventory alert.' },
          { instruction: '"What was my total sales last week?" — revenue summary.' },
          { instruction: '"Which invoices are overdue?" — list of unpaid invoices.' },
          { instruction: '"How much did I spend on rent this year?" — expense analysis.' },
          { instruction: '"Which staff member has the most leaves this month?" — attendance insight.' },
          { instruction: '"Generate a professional reply to a customer complaint" — draft communication.' },
        ],
      },
      {
        heading: 'Tips for Better Results',
        steps: [
          { instruction: 'Be specific with your question. Instead of "show me sales", ask "show me sales for March 2025".', tip: 'The more specific your question, the more accurate the answer.' },
          { instruction: 'Ask follow-up questions — the AI remembers the context of your conversation.' },
          { instruction: 'If the answer looks wrong, ask it to explain how it calculated the result.' },
          { instruction: 'Use it to spot trends: "Compare this month\'s sales with last month."' },
        ],
      },
      {
        heading: 'Setting Up AI (Admin Only)',
        steps: [
          { instruction: 'Go to Nerve Center → API Keys.' },
          { instruction: 'Enter your Groq API key (recommended — free tier available).', tip: 'Get a free key at console.groq.com/keys — no billing required.' },
          { instruction: 'Click "Save". AI Copilot is now active for all users in your business.' },
          { instruction: 'The system automatically falls back to Gemini or Anthropic if Groq is unavailable.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'automation',
    lang: 'en',
    title: 'How to Set Up Automation Rules',
    overview: 'The Automation module lets you create "if this, then that" rules that run automatically — send a WhatsApp when an invoice is overdue, alert staff when stock is low, or trigger a follow-up message after an appointment. Save time on repetitive tasks.',
    sections: [
      {
        heading: 'Creating an Automation Rule',
        steps: [
          { instruction: 'Go to Automation from the left sidebar.' },
          { instruction: 'Click "New Rule" or "Create Automation".' },
          { instruction: 'Select the Trigger — what event should start the automation.', tip: 'Examples: Invoice Overdue, Stock Below Alert Level, Appointment Completed, New Customer Added.' },
          { instruction: 'Set any conditions — additional filters to narrow when the rule fires (e.g. only for invoices above ₹10,000).' },
          { instruction: 'Select the Action — what should happen automatically.', tip: 'Examples: Send WhatsApp, Send Email, Create Task, Update Status.' },
          { instruction: 'Compose the message or action details.' },
          { instruction: 'Toggle the rule to "Active" and click "Save Rule".' },
        ],
      },
      {
        heading: 'Common Automation Examples',
        steps: [
          { instruction: 'Overdue Invoice Reminder: Trigger = Invoice Overdue → Action = Send WhatsApp to customer with payment link.' },
          { instruction: 'Low Stock Alert: Trigger = Stock Below Alert Level → Action = Send WhatsApp to manager.' },
          { instruction: 'Appointment Reminder: Trigger = 24 hours before appointment → Action = Send WhatsApp reminder to customer.' },
          { instruction: 'Welcome New Customer: Trigger = New Customer Created → Action = Send welcome WhatsApp with your business details.' },
          { instruction: 'Birthday Offer: Trigger = Customer Birthday → Action = Send promotional WhatsApp with a discount code.' },
        ],
      },
      {
        heading: 'Pausing or Deleting a Rule',
        steps: [
          { instruction: 'Go to the Automation list and find the rule.' },
          { instruction: 'Toggle the switch to pause/resume the rule without deleting it.' },
          { instruction: 'Click the delete icon to remove the rule permanently.' },
          { instruction: 'Check the "Run History" tab to see which automations have fired and their status (Success / Failed).', tip: 'Review failed automations — the reason is usually a missing phone number or WhatsApp not being configured.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'training',
    lang: 'en',
    title: 'How to Use Training Plans',
    overview: 'The Training Plans module lets gyms, fitness centres, and coaching institutes create and assign personalised training or study plans for members or students — track workouts, sessions, progress, and adherence.',
    sections: [
      {
        heading: 'Creating a Training Plan',
        steps: [
          { instruction: 'Go to Training Plans from the left sidebar.' },
          { instruction: 'Click "New Plan".' },
          { instruction: 'Enter the plan name (e.g. "Weight Loss – 12 Week Program").' },
          { instruction: 'Set the plan duration in weeks.' },
          { instruction: 'Add exercises or sessions for each day or week.' },
          { instruction: 'For each exercise: enter name, sets, reps, duration, and notes.' },
          { instruction: 'Click "Save Plan". The plan is now available to assign to members.' },
        ],
      },
      {
        heading: 'Assigning a Plan to a Member',
        steps: [
          { instruction: 'Open a member\'s profile.' },
          { instruction: 'Click the "Training" tab.' },
          { instruction: 'Click "Assign Training Plan" and select the plan.' },
          { instruction: 'Set the start date.' },
          { instruction: 'Click "Assign". The member can now see their plan.' },
        ],
      },
      {
        heading: 'Tracking Progress',
        steps: [
          { instruction: 'Open the member\'s training plan assignment.' },
          { instruction: 'Mark each session as Completed / Skipped / Partial after it is done.' },
          { instruction: 'Log actual performance (e.g. weight lifted, time taken).' },
          { instruction: 'View the adherence percentage — how consistently the member is following the plan.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    moduleKey: 'b2b',
    lang: 'en',
    title: 'How to Use the B2B Marketplace',
    overview: 'The B2B Marketplace connects your business with other businesses on the Syllabrix network. List products for wholesale, discover suppliers, send and receive bulk orders, and build verified B2B relationships.',
    sections: [
      {
        heading: 'Listing Your Products for B2B',
        steps: [
          { instruction: 'Go to B2B Marketplace from the left sidebar.' },
          { instruction: 'Click "My Listings" → "Add Listing".' },
          { instruction: 'Select a product from your Inventory.' },
          { instruction: 'Set the B2B (wholesale) price — typically lower than your retail price.' },
          { instruction: 'Set the Minimum Order Quantity (MOQ).' },
          { instruction: 'Add product photos and a detailed description.' },
          { instruction: 'Click "Publish Listing". Other businesses on Syllabrix can now discover your product.' },
        ],
      },
      {
        heading: 'Discovering and Ordering from Suppliers',
        steps: [
          { instruction: 'Go to B2B Marketplace → "Browse Suppliers".' },
          { instruction: 'Search by product name, category, or location.' },
          { instruction: 'Click on a listing to view product details, price, and supplier profile.' },
          { instruction: 'Click "Send Enquiry" to contact the supplier.' },
          { instruction: 'Once agreed, click "Place Order" to create a formal purchase order.' },
          { instruction: 'The purchase order is tracked in your Vendors module automatically.' },
        ],
      },
    ],
  },

];

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSeeding help guides for ${ARTICLES.length} modules…\n`);
  let success = 0;
  let failed  = 0;

  for (const article of ARTICLES) {
    try {
      await prisma.moduleHelpArticle.upsert({
        where: { moduleKey_lang: { moduleKey: article.moduleKey, lang: article.lang } },
        update: {
          title:       article.title,
          overview:    article.overview,
          sections:    article.sections,
          isPublished: true,
        },
        create: {
          moduleKey:   article.moduleKey,
          lang:        article.lang,
          title:       article.title,
          overview:    article.overview,
          sections:    article.sections,
          isPublished: true,
        },
      });
      console.log(`  ✓  ${article.moduleKey} [${article.lang}] — ${article.title}`);
      success++;
    } catch (e) {
      console.error(`  ✗  ${article.moduleKey} [${article.lang}] — ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone — ${success} seeded, ${failed} failed.\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
