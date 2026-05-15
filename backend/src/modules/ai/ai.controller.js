const svc = require('./ai.service');
const { ok } = require('../../utils/response');

const chat = async (req, res, next) => {
  try { ok(res, await svc.chat(req.tenantId, req.body)); } catch (e) { next(e); }
};

const getInsights = async (req, res, next) => {
  try { ok(res, await svc.getInsights(req.tenantId)); } catch (e) { next(e); }
};

module.exports = { chat, getInsights };
