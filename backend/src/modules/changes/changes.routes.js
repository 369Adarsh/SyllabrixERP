const router = require('express').Router();
const ctrl   = require('./changes.controller');
const { authenticateSA, authorizeSA } = require('../superadmin/superadmin.middleware');

router.use(authenticateSA);

router.get('/stats',         authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.getStats);
router.get('/',              authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.list);
router.get('/:id',           authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.getOne);
router.get('/:id/document',  authorizeSA('SUPER', 'ADMIN'),            ctrl.getDocument);
router.post('/',             authorizeSA('SUPER', 'ADMIN'),             ctrl.create);
router.patch('/:id/approve', authorizeSA('SUPER', 'ADMIN'),            ctrl.approve);
router.patch('/:id/reject',  authorizeSA('SUPER', 'ADMIN'),            ctrl.reject);

module.exports = router;
