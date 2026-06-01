const svc = require('./opd-queue.service');

const list    = async (req, res, next) => { try { res.json({ success: true, data: await svc.getQueue(req.tenantId) }); } catch (e) { next(e); } };
const stats   = async (req, res, next) => { try { res.json({ success: true, data: await svc.getStats(req.tenantId) }); } catch (e) { next(e); } };
const assign  = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.assignToken(req.tenantId, req.body) }); } catch (e) { next(e); } };
const call    = async (req, res, next) => { try { res.json({ success: true, data: await svc.callToken(req.tenantId, req.params.id) }); } catch (e) { next(e); } };
const start   = async (req, res, next) => { try { res.json({ success: true, data: await svc.startConsultation(req.tenantId, req.params.id) }); } catch (e) { next(e); } };
const complete = async (req, res, next) => { try { res.json({ success: true, data: await svc.completeToken(req.tenantId, req.params.id) }); } catch (e) { next(e); } };
const skip    = async (req, res, next) => { try { res.json({ success: true, data: await svc.skipToken(req.tenantId, req.params.id) }); } catch (e) { next(e); } };
const requeue = async (req, res, next) => { try { res.json({ success: true, data: await svc.requeueToken(req.tenantId, req.params.id) }); } catch (e) { next(e); } };

module.exports = { list, stats, assign, call, start, complete, skip, requeue };
