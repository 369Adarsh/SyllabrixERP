const { getBusinessTypeCodes, getBusinessTypeConfig } = require('../config/businessTypes');

/**
 * Resolves the tenant's SYL-BC-* codes and business config and attaches them to req.
 * Must be used AFTER authenticate middleware (requires req.user.tenant).
 *
 * Attaches:
 *   req.businessTypeCode     — e.g. 'SYL-BC-RET-KR16'
 *   req.businessCategoryCode — e.g. 'SYL-BC-RET'
 *   req.businessConfig       — merged config (modules, features, dashboard)
 *
 * Usage in routes:
 *   router.get('/something', authenticate, businessTypeScope, (req, res) => {
 *     if (!req.businessConfig.modules.appointments) return res.status(403)...
 *     if (!req.businessConfig.features.new_feature_x) return res.status(404)...
 *   });
 */
module.exports = function businessTypeScope(req, res, next) {
  const businessType = req.user?.tenant?.businessType;
  if (!businessType) return next();

  const codes = getBusinessTypeCodes(businessType);
  req.businessTypeCode     = codes.typeCode;
  req.businessCategoryCode = codes.categoryCode;
  req.businessConfig       = getBusinessTypeConfig(businessType);

  next();
};
