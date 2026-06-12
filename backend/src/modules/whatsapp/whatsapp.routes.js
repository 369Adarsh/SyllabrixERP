const router = require('express').Router();
const ctrl = require('./whatsapp.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { whatsappLimiter } = require('../../middleware/rateLimiter');

// Note: GET /webhook and POST /webhook are mounted in app.js before express.json()
// to capture the raw body needed for Meta's X-Hub-Signature-256 verification.

// Public — setup only, no sensitive data
router.get('/qr-status', ctrl.qrStatus);
router.get('/qr.png', ctrl.qrImage);

// Protected routes
router.use(authenticate);
router.get('/conversations', ctrl.conversations);
router.get('/conversations/:phone', ctrl.thread);
router.post('/send', whatsappLimiter, authorize('OWNER', 'ADMIN', 'STAFF'), ctrl.send);
router.post('/send-invoice/:invoiceId', authorize('OWNER', 'ADMIN', 'STAFF'), ctrl.sendInvoice);
router.post('/send-appointment-reminder/:appointmentId', authorize('OWNER', 'ADMIN', 'STAFF'), ctrl.sendAppointmentReminder);
router.post('/send-fee-reminder/:feeId', authorize('OWNER', 'ADMIN', 'STAFF'), ctrl.sendFeeReminder);
router.post('/send-rent-reminder/:leaseId', authorize('OWNER', 'ADMIN', 'STAFF'), ctrl.sendRentReminder);
router.post('/bulk-fee-reminders', authorize('OWNER', 'ADMIN'), ctrl.bulkFeeReminders);

module.exports = router;
