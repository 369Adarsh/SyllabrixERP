const router = require('express').Router();
const ctrl = require('./whatsapp.controller');
const { authenticate, authorize } = require('../../middleware/auth');

// Public webhook — no auth
router.get('/webhook', ctrl.verify);
router.post('/webhook', ctrl.webhook);

// Protected routes
router.use(authenticate);
router.get('/conversations', ctrl.conversations);
router.get('/conversations/:phone', ctrl.thread);
router.post('/send', authorize('OWNER', 'ADMIN', 'STAFF'), ctrl.send);
router.post('/send-invoice/:invoiceId', authorize('OWNER', 'ADMIN', 'STAFF'), ctrl.sendInvoice);
router.post('/send-appointment-reminder/:appointmentId', authorize('OWNER', 'ADMIN', 'STAFF'), ctrl.sendAppointmentReminder);
router.post('/send-fee-reminder/:feeId', authorize('OWNER', 'ADMIN', 'STAFF'), ctrl.sendFeeReminder);
router.post('/send-rent-reminder/:leaseId', authorize('OWNER', 'ADMIN', 'STAFF'), ctrl.sendRentReminder);
router.post('/bulk-fee-reminders', authorize('OWNER', 'ADMIN'), ctrl.bulkFeeReminders);

module.exports = router;
