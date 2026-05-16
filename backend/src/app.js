const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/env');

const authRoutes = require('./modules/auth/auth.routes');
const tenantRoutes = require('./modules/tenant/tenant.routes');
const userRoutes = require('./modules/users/users.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const posRoutes = require('./modules/pos/pos.routes');
const invoicingRoutes = require('./modules/invoicing/invoicing.routes');
const appointmentRoutes = require('./modules/appointments/appointments.routes');
const feesRoutes = require('./modules/fees/fees.routes');
const leaseRoutes = require('./modules/lease/lease.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const customerRoutes = require('./modules/customers/customers.routes');
const vendorRoutes = require('./modules/vendors/vendors.routes');
const expenseRoutes = require('./modules/expenses/expenses.routes');
const whatsappRoutes = require('./modules/whatsapp/whatsapp.routes');
const assetRoutes = require('./modules/assets/assets.routes');
const staffRoutes = require('./modules/staff/staff.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const campaignRoutes = require('./modules/campaigns/campaigns.routes');
const billsRoutes = require('./modules/bills/bills.routes');
const accountsRoutes = require('./modules/accounts/accounts.routes');
const creditNotesRoutes = require('./modules/creditnotes/creditnotes.routes');
const quotationsRoutes = require('./modules/quotations/quotations.routes');
const payrollRoutes = require('./modules/payroll/payroll.routes');
const recurringInvoicesRoutes = require('./modules/recurringinvoices/recurringinvoices.routes');

const { razorpayWebhook } = require('./modules/invoicing/invoicing.controller');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// Razorpay webhook — raw body required for HMAC signature verification
app.post('/api/v1/webhooks/razorpay', express.raw({ type: 'application/json' }), razorpayWebhook);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Syllabrix API' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenant', tenantRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/pos', posRoutes);
app.use('/api/v1/invoices', invoicingRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/fees', feesRoutes);
app.use('/api/v1/lease', leaseRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/bills', billsRoutes);
app.use('/api/v1/accounts', accountsRoutes);
app.use('/api/v1/credit-notes', creditNotesRoutes);
app.use('/api/v1/quotations', quotationsRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/recurring-invoices', recurringInvoicesRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;
