const svc = require('./changes.service');
const { ok } = require('../../utils/response');

const adminName = (req) => req.saAdmin?.name || req.saAdmin?.email || 'Admin';

const getStats        = async (req, res, next) => { try { ok(res, await svc.getStats()); } catch (e) { next(e); } };
const list            = async (req, res, next) => { try { ok(res, await svc.list(req.query)); } catch (e) { next(e); } };
const getOne          = async (req, res, next) => { try { ok(res, await svc.get(req.params.id)); } catch (e) { next(e); } };
const create          = async (req, res, next) => { try { ok(res, await svc.create(req.body, adminName(req))); } catch (e) { next(e); } };
const approve         = async (req, res, next) => { try { ok(res, await svc.approve(req.params.id, adminName(req))); } catch (e) { next(e); } };
const reject          = async (req, res, next) => { try { ok(res, await svc.reject(req.params.id, req.body.reason, adminName(req))); } catch (e) { next(e); } };

const getDocument = async (req, res, next) => {
  try {
    const { content, filename } = await svc.generateDocument(req.params.id);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (e) { next(e); }
};

module.exports = { getStats, list, getOne, create, approve, reject, getDocument };
