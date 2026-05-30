const router = require('express').Router();
const ctrl = require('./support.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { authenticateSA, authorizeSA } = require('../superadmin/superadmin.middleware');

// Tenant routes
router.use('/my', authenticate);
router.get('/my', ctrl.list);
router.post('/my', ctrl.create);
router.get('/my/:id', ctrl.get);
router.post('/my/:id/reply', ctrl.reply);
router.patch('/my/:id/close', ctrl.close);

// Super-admin routes
router.use('/admin', authenticateSA);
router.get('/admin/stats', ctrl.saStats);
router.get('/admin', ctrl.saList);
router.get('/admin/:id', ctrl.saGet);
router.post('/admin/:id/reply', ctrl.saReply);
router.patch('/admin/:id/status', ctrl.saUpdateStatus);
router.patch('/admin/:id/priority', ctrl.saUpdatePriority);

module.exports = router;
