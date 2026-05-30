const router = require('express').Router();
const ctrl = require('./businessbuilder.controller');
const { authenticateSA, authorizeSA } = require('../superadmin/superadmin.middleware');

router.use(authenticateSA);

// Categories
router.get('/categories',              authorizeSA('SUPER','ADMIN','SUPPORT'), ctrl.listCategories);
router.get('/categories/check-code',   authorizeSA('SUPER','ADMIN'), ctrl.checkCategoryCode);
router.post('/categories',             authorizeSA('SUPER','ADMIN'), ctrl.createCategory);
router.patch('/categories/:id',        authorizeSA('SUPER','ADMIN'), ctrl.updateCategory);

// Business Types
router.get('/business-types',          authorizeSA('SUPER','ADMIN','SUPPORT'), ctrl.listBusinessTypes);
router.get('/business-types/check-code', authorizeSA('SUPER','ADMIN'), ctrl.checkTypeCode);
router.get('/business-types/preview-code', authorizeSA('SUPER','ADMIN'), ctrl.previewTypeCode);
router.post('/business-types',         authorizeSA('SUPER','ADMIN'), ctrl.createBusinessType);
router.get('/business-types/:id',      authorizeSA('SUPER','ADMIN','SUPPORT'), ctrl.getBusinessType);
router.patch('/business-types/:id',    authorizeSA('SUPER','ADMIN'), ctrl.updateBusinessType);
router.delete('/business-types/:id',   authorizeSA('SUPER'), ctrl.deleteBusinessType);
router.post('/business-types/:id/clone', authorizeSA('SUPER','ADMIN'), ctrl.cloneBusinessType);

// Module Assignment
router.put('/business-types/:id/modules',            authorizeSA('SUPER','ADMIN'), ctrl.setModules);
router.delete('/business-types/:id/modules/:moduleKey', authorizeSA('SUPER','ADMIN'), ctrl.removeModule);

// Publishing
router.post('/business-types/:id/publish',   authorizeSA('SUPER','ADMIN'), ctrl.publishBusinessType);
router.post('/business-types/:id/unpublish', authorizeSA('SUPER','ADMIN'), ctrl.unpublishBusinessType);

// Role Suggestions & Assignment
router.get('/business-types/:id/suggest-roles', authorizeSA('SUPER','ADMIN'), ctrl.suggestRoles);
router.put('/business-types/:id/roles',         authorizeSA('SUPER','ADMIN'), ctrl.setRoles);

// Templates
router.get('/templates',                    authorizeSA('SUPER','ADMIN','SUPPORT'), ctrl.listTemplates);
router.post('/business-types/:id/save-template', authorizeSA('SUPER','ADMIN'), ctrl.saveTemplate);
router.post('/business-types/:id/apply-template/:templateId', authorizeSA('SUPER','ADMIN'), ctrl.applyTemplate);
router.delete('/templates/:id',             authorizeSA('SUPER'), ctrl.deleteTemplate);

module.exports = router;
