const router = require('express').Router();
const ctrl   = require('./activity.controller');
const { authenticateSA, authorizeSA } = require('../superadmin/superadmin.middleware');

router.use(authenticateSA);

// Platform admins only — all roles can view activity logs
router.get('/',               authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.list);
router.get('/module-summary', authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.moduleSummary);
router.get('/active-tenants', authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.activeTenants);

module.exports = router;
