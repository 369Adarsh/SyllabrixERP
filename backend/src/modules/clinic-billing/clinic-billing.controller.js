const svc = require('./clinic-billing.service');

const ok = (res, data, status = 200) => res.status(status).json(data);
const err = (res, e) => res.status(e.statusCode || 500).json({ error: e.message });

const listBills     = async (req, res) => { try { ok(res, await svc.listBills(req.tenantId, req.query)); } catch (e) { err(res, e); } };
const getBillById   = async (req, res) => { try { ok(res, await svc.getBillById(req.tenantId, req.params.id)); } catch (e) { err(res, e); } };
const createBill    = async (req, res) => { try { ok(res, await svc.createBill(req.tenantId, req.body), 201); } catch (e) { err(res, e); } };
const updateBill    = async (req, res) => { try { ok(res, await svc.updateBill(req.tenantId, req.params.id, req.body)); } catch (e) { err(res, e); } };
const deleteBill    = async (req, res) => { try { await svc.deleteBill(req.tenantId, req.params.id); ok(res, { success: true }); } catch (e) { err(res, e); } };
const dayEndSummary = async (req, res) => { try { ok(res, await svc.dayEndSummary(req.tenantId, req.query.date)); } catch (e) { err(res, e); } };
const getOutstanding= async (req, res) => { try { ok(res, await svc.getOutstanding(req.tenantId)); } catch (e) { err(res, e); } };
const getProcedures = (req, res) => ok(res, svc.getProcedures());

module.exports = { listBills, getBillById, createBill, updateBill, deleteBill, dayEndSummary, getOutstanding, getProcedures };
