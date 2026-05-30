const router = require('express').Router();
const ctrl = require('./features.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

// Any logged-in user — get effective feature map for current session
router.get('/:moduleKey/map',     ctrl.getFeatureMap);
router.get('/:moduleKey',         ctrl.getMyFeatures);

// Owner / Admin only — manage company-level settings
router.get( '/:moduleKey/company',       authorize('OWNER', 'ADMIN'), ctrl.getCompanyFeatures);
router.patch('/:moduleKey/company',      authorize('OWNER', 'ADMIN'), ctrl.setCompanyFeature);

// Owner / Admin / Manager — branch-level settings
router.get( '/:moduleKey/branch/:branchId',    authorize('OWNER', 'ADMIN', 'MANAGER'), ctrl.getBranchFeatures);
router.patch('/:moduleKey/branch/:branchId',   authorize('OWNER', 'ADMIN', 'MANAGER'), ctrl.setBranchFeature);

module.exports = router;
