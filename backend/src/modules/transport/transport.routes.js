const router = require('express').Router();
const ctrl   = require('./transport.controller');
const { authenticateSA, authorizeSA } = require('../superadmin/superadmin.middleware');

router.use(authenticateSA);

router.get('/stats',                                      authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.getStats);
router.get('/environments',                               authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.getEnvironments);
router.get('/',                                           authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.list);
router.get('/:id',                                        authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.getOne);
router.post('/',                                          authorizeSA('SUPER', 'ADMIN'),             ctrl.create);
router.patch('/:id',                                      authorizeSA('SUPER', 'ADMIN'),             ctrl.update);
router.patch('/:id/approve',                              authorizeSA('SUPER', 'ADMIN'),             ctrl.approve);
router.post('/:id/promote',                               authorizeSA('SUPER', 'ADMIN'),             ctrl.promote);
router.post('/:id/implement',                             authorizeSA('SUPER', 'ADMIN'),             ctrl.implement);
router.post('/:id/rollback',                              authorizeSA('SUPER'),                      ctrl.rollback);
router.get('/settings',                                   authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.getSettings);
router.patch('/settings',                                 authorizeSA('SUPER', 'ADMIN'),             ctrl.updateSettings);
router.patch('/:id/scope-lock',                           authorizeSA('SUPER', 'ADMIN'),             ctrl.toggleScopeLock);
router.post('/:id/comments',                              authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.addComment);
router.post('/:id/test-scenarios',                        authorizeSA('SUPER', 'ADMIN'),             ctrl.addTestScenario);
router.patch('/:id/test-scenarios/:scenarioId',           authorizeSA('SUPER', 'ADMIN'),             ctrl.updateTestResult);

module.exports = router;
