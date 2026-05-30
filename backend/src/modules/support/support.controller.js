const svc = require('./support.service');
const { ok, created } = require('../../utils/response');

// Tenant-facing
const list = async (req, res, next) => {
  try { ok(res, await svc.listMyTickets(req.tenantId, req.query)); } catch (e) { next(e); }
};
const get = async (req, res, next) => {
  try {
    const t = await svc.getMyTicket(req.tenantId, req.params.id);
    if (!t) return res.status(404).json({ success: false, message: 'Ticket not found' });
    ok(res, t);
  } catch (e) { next(e); }
};
const create = async (req, res, next) => {
  try { created(res, await svc.createTicket(req.tenantId, req.body, req.user), 'Ticket created'); } catch (e) { next(e); }
};
const reply = async (req, res, next) => {
  try { ok(res, await svc.replyToTicket(req.tenantId, req.params.id, req.body.content, req.user)); } catch (e) { next(e); }
};
const close = async (req, res, next) => {
  try { await svc.closeTicket(req.tenantId, req.params.id); ok(res, {}, 'Ticket closed'); } catch (e) { next(e); }
};

// SA-facing
const saList = async (req, res, next) => {
  try {
    const [tickets, total] = await svc.listAllTickets(req.query);
    ok(res, { tickets, total });
  } catch (e) { next(e); }
};
const saGet = async (req, res, next) => {
  try { ok(res, await svc.getTicketAdmin(req.params.id)); } catch (e) { next(e); }
};
const saReply = async (req, res, next) => {
  try { ok(res, await svc.adminReply(req.params.id, req.body.content, req.saAdmin, req.body.isInternal)); } catch (e) { next(e); }
};
const saUpdateStatus = async (req, res, next) => {
  try { ok(res, await svc.updateTicketStatus(req.params.id, req.body.status)); } catch (e) { next(e); }
};
const saUpdatePriority = async (req, res, next) => {
  try { ok(res, await svc.assignTicketPriority(req.params.id, req.body.priority)); } catch (e) { next(e); }
};
const saStats = async (req, res, next) => {
  try { ok(res, await svc.getTicketStats()); } catch (e) { next(e); }
};

module.exports = { list, get, create, reply, close, saList, saGet, saReply, saUpdateStatus, saUpdatePriority, saStats };
