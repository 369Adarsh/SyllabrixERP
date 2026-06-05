const svc = require('./tenant.service');
const { ok } = require('../../utils/response');

const getProfile = async (req, res, next) => {
  try { ok(res, await svc.getProfile(req.tenantId)); } catch (e) { next(e); }
};

const updateProfile = async (req, res, next) => {
  try { ok(res, await svc.updateProfile(req.tenantId, req.body), 'Profile updated'); } catch (e) { next(e); }
};

const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) throw Object.assign(new Error('No file uploaded'), { statusCode: 400 });
    const logoUrl = `${req.protocol}://${req.get('host')}/uploads/logos/${req.file.filename}`;
    await svc.updateProfile(req.tenantId, { logoUrl });
    ok(res, { logoUrl }, 'Logo updated');
  } catch (e) { next(e); }
};

const getModules = async (req, res, next) => {
  try { ok(res, await svc.getModules(req.tenantId)); } catch (e) { next(e); }
};

const toggleModule = async (req, res, next) => {
  try {
    const { module: moduleName, enable } = req.body;
    ok(res, await svc.toggleModule(req.tenantId, moduleName, enable), 'Module updated');
  } catch (e) { next(e); }
};

const updateLabelConfig = async (req, res, next) => {
  try { ok(res, await svc.updateLabelConfig(req.tenantId, req.body), 'Label config saved'); } catch (e) { next(e); }
};

const updateSidebarConfig = async (req, res, next) => {
  try { ok(res, await svc.updateSidebarConfig(req.tenantId, req.body), 'Sidebar config saved'); } catch (e) { next(e); }
};

const getStats = async (req, res, next) => {
  try { ok(res, await svc.getStats(req.tenantId)); } catch (e) { next(e); }
};

module.exports = { getProfile, updateProfile, uploadLogo, getModules, toggleModule, updateSidebarConfig, updateLabelConfig, getStats };
