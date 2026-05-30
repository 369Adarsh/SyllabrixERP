const svc = require('./help.service');
const { ok } = require('../../utils/response');

// Tenant-facing: GET /api/v1/help/:moduleKey?lang=en
const getPublic = async (req, res, next) => {
  try {
    const { moduleKey } = req.params;
    const lang = req.query.lang || 'en';
    const article = await svc.getHelp(moduleKey, lang);
    if (!article || !article.isPublished) return ok(res, null);
    ok(res, article);
  } catch (e) { next(e); }
};

// Platform SA: GET /api/platform/help/:moduleKey (all languages)
const getForModule = async (req, res, next) => {
  try {
    ok(res, await svc.getAllForModule(req.params.moduleKey));
  } catch (e) { next(e); }
};

// Platform SA: PUT /api/platform/help/:moduleKey/:lang
const upsert = async (req, res, next) => {
  try {
    const { moduleKey, lang } = req.params;
    ok(res, await svc.upsertHelp(moduleKey, lang, req.body));
  } catch (e) { next(e); }
};

// Platform SA: DELETE /api/platform/help/:moduleKey/:lang
const remove = async (req, res, next) => {
  try {
    await svc.deleteHelp(req.params.moduleKey, req.params.lang);
    ok(res, { deleted: true });
  } catch (e) { next(e); }
};

module.exports = { getPublic, getForModule, upsert, remove };
