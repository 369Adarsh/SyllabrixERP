const svc = require('./insurance-claims.service');
const ok  = (res, data, s = 200) => res.status(s).json(data);
const err = (res, e) => res.status(e.statusCode || 500).json({ error: e.message });

const list     = async (req, res) => { try { ok(res, await svc.list(req.tenantId, req.query)); } catch (e) { err(res, e); } };
const getById  = async (req, res) => { try { ok(res, await svc.getById(req.tenantId, req.params.id)); } catch (e) { err(res, e); } };
const create   = async (req, res) => { try { ok(res, await svc.create(req.tenantId, req.body), 201); } catch (e) { err(res, e); } };
const update   = async (req, res) => { try { ok(res, await svc.update(req.tenantId, req.params.id, req.body)); } catch (e) { err(res, e); } };
const remove   = async (req, res) => { try { await svc.remove(req.tenantId, req.params.id); ok(res, { success: true }); } catch (e) { err(res, e); } };
const getStats = async (req, res) => { try { ok(res, await svc.getStats(req.tenantId)); } catch (e) { err(res, e); } };
const getMeta  = (req, res) => ok(res, { statuses: svc.CLAIM_STATUSES, tpaSchemes: svc.TPA_SCHEMES });

module.exports = { list, getById, create, update, remove, getStats, getMeta };
