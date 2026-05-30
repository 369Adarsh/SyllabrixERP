const svc = require('./ai.service');
const { ok } = require('../../utils/response');

const chat          = async (req, res, next) => { try { ok(res, await svc.chat(req.tenantId, req.body));    } catch (e) { next(e); } };
const getInsights   = async (req, res, next) => { try { ok(res, await svc.getInsights(req.tenantId));       } catch (e) { next(e); } };
const audit         = async (req, res, next) => { try { ok(res, await svc.auditModule(req.body.moduleKey, req.body.ticketContext || null)); } catch (e) { next(e); } };
const modules       = async (req, res, next) => { try { ok(res, svc.listAuditableModules());                } catch (e) { next(e); } };
const pageModules   = async (req, res, next) => { try { ok(res, { pageMap: svc.PAGE_MODULE_MAP, modulesForPage: svc.getModulesForPage(req.query.route || '') }); } catch (e) { next(e); } };

// Report lifecycle
const submitReport  = async (req, res, next) => { try { ok(res, await svc.submitReport(req.tenantId, req.body));         } catch (e) { next(e); } };
const myReports     = async (req, res, next) => { try { ok(res, await svc.getTenantReports(req.tenantId));               } catch (e) { next(e); } };
// Syllabrix-admin only
const allReports    = async (req, res, next) => { try { ok(res, await svc.getReports(req.query));                        } catch (e) { next(e); } };
const patchReport   = async (req, res, next) => { try { ok(res, await svc.updateReport(req.params.reportId, req.body));  } catch (e) { next(e); } };

module.exports = { chat, getInsights, audit, modules, pageModules, submitReport, myReports, allReports, patchReport };
