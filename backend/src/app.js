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

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
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

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;
