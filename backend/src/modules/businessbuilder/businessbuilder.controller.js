const svc = require('./businessbuilder.service');
const { ok, created } = require('../../utils/response');

const listCategories = async (req, res, next) => {
  try { ok(res, await svc.listCategories()); } catch (e) { next(e); }
};

const checkCategoryCode = async (req, res, next) => {
  try { ok(res, await svc.checkCategoryCode(req.query.code || '')); } catch (e) { next(e); }
};

const createCategory = async (req, res, next) => {
  try { created(res, await svc.createCategory(req.body, req.saAdmin?.name || 'Admin'), 'Category created'); } catch (e) { next(e); }
};

const updateCategory = async (req, res, next) => {
  try { ok(res, await svc.updateCategory(req.params.id, req.body)); } catch (e) { next(e); }
};

const listBusinessTypes = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
    if (req.query.categoryId) filters.categoryId = req.query.categoryId;
    ok(res, await svc.listBusinessTypes(filters));
  } catch (e) { next(e); }
};

const getBusinessType = async (req, res, next) => {
  try { ok(res, await svc.getBusinessType(req.params.id)); } catch (e) { next(e); }
};

const checkTypeCode = async (req, res, next) => {
  try { ok(res, await svc.checkTypeCode(req.query.code || '')); } catch (e) { next(e); }
};

const previewTypeCode = async (req, res, next) => {
  try { ok(res, await svc.previewTypeCode(req.query.categoryId, req.query.name)); } catch (e) { next(e); }
};

const createBusinessType = async (req, res, next) => {
  try { created(res, await svc.createBusinessType(req.body, req.saAdmin?.name || 'Admin'), 'Business type created'); } catch (e) { next(e); }
};

const updateBusinessType = async (req, res, next) => {
  try { ok(res, await svc.updateBusinessType(req.params.id, req.body)); } catch (e) { next(e); }
};

const deleteBusinessType = async (req, res, next) => {
  try { ok(res, await svc.deleteBusinessType(req.params.id)); } catch (e) { next(e); }
};

const cloneBusinessType = async (req, res, next) => {
  try { created(res, await svc.cloneBusinessType(req.params.id, req.saAdmin?.name || 'Admin'), 'Cloned'); } catch (e) { next(e); }
};

const setModules = async (req, res, next) => {
  try { ok(res, await svc.setModules(req.params.id, req.body.modules || []), 'Modules saved'); } catch (e) { next(e); }
};

const removeModule = async (req, res, next) => {
  try { ok(res, await svc.removeModule(req.params.id, req.params.moduleKey), 'Module removed'); } catch (e) { next(e); }
};

const publishBusinessType = async (req, res, next) => {
  try { ok(res, await svc.publishBusinessType(req.params.id, req.saAdmin?.name || 'Admin'), 'Published'); } catch (e) { next(e); }
};

const unpublishBusinessType = async (req, res, next) => {
  try { ok(res, await svc.unpublishBusinessType(req.params.id), 'Unpublished'); } catch (e) { next(e); }
};

const suggestRoles = async (req, res, next) => {
  try { ok(res, await svc.suggestRoles(req.params.id)); } catch (e) { next(e); }
};

const setRoles = async (req, res, next) => {
  try { ok(res, await svc.setRoles(req.params.id, req.body.roles || []), 'Roles saved'); } catch (e) { next(e); }
};

const listTemplates = async (req, res, next) => {
  try { ok(res, await svc.listTemplates()); } catch (e) { next(e); }
};

const saveTemplate = async (req, res, next) => {
  try { created(res, await svc.saveTemplate(req.params.id, req.body, req.saAdmin?.name || 'Admin'), 'Template saved'); } catch (e) { next(e); }
};

const applyTemplate = async (req, res, next) => {
  try { ok(res, await svc.applyTemplate(req.params.templateId, req.params.id), 'Template applied'); } catch (e) { next(e); }
};

const deleteTemplate = async (req, res, next) => {
  try { ok(res, await svc.deleteTemplate(req.params.id), 'Template deleted'); } catch (e) { next(e); }
};

module.exports = {
  listCategories, checkCategoryCode, createCategory, updateCategory,
  listBusinessTypes, getBusinessType, checkTypeCode, previewTypeCode,
  createBusinessType, updateBusinessType, deleteBusinessType, cloneBusinessType,
  setModules, removeModule,
  publishBusinessType, unpublishBusinessType,
  suggestRoles, setRoles,
  listTemplates, saveTemplate, applyTemplate, deleteTemplate,
};
