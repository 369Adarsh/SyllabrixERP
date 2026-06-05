const svc = require('./lab-orders.service');

const ok = (res, data, status = 200) => res.status(status).json(data);
const err = (res, e) => res.status(e.statusCode || 500).json({ error: e.message });

// Centers
const listCenters   = async (req, res) => { try { ok(res, await svc.listCenters(req.tenantId)); } catch (e) { err(res, e); } };
const upsertCenter  = async (req, res) => { try { ok(res, await svc.upsertCenter(req.tenantId, req.body), req.body.id ? 200 : 201); } catch (e) { err(res, e); } };
const deleteCenter  = async (req, res) => { try { ok(res, await svc.deleteCenter(req.tenantId, req.params.id)); } catch (e) { err(res, e); } };

// Orders
const listOrders   = async (req, res) => { try { ok(res, await svc.listOrders(req.tenantId, req.query)); } catch (e) { err(res, e); } };
const getOrderById = async (req, res) => { try { ok(res, await svc.getOrderById(req.tenantId, req.params.id)); } catch (e) { err(res, e); } };
const createOrder  = async (req, res) => { try { ok(res, await svc.createOrder(req.tenantId, req.body), 201); } catch (e) { err(res, e); } };
const updateOrder  = async (req, res) => { try { ok(res, await svc.updateOrder(req.tenantId, req.params.id, req.body)); } catch (e) { err(res, e); } };
const deleteOrder  = async (req, res) => { try { await svc.deleteOrder(req.tenantId, req.params.id); ok(res, { success: true }); } catch (e) { err(res, e); } };

// Reports
const addReport        = async (req, res) => { try { ok(res, await svc.addReport(req.tenantId, req.body), 201); } catch (e) { err(res, e); } };
const markReportViewed = async (req, res) => { try { ok(res, await svc.markReportViewed(req.params.id)); } catch (e) { err(res, e); } };
const deleteReport     = async (req, res) => { try { await svc.deleteReport(req.tenantId, req.params.id); ok(res, { success: true }); } catch (e) { err(res, e); } };

// Catalog
const testSearch  = (req, res) => ok(res, svc.testSearch(req.query.q || ''));
const testCatalog = (req, res) => ok(res, svc.testCatalog());

module.exports = {
  listCenters, upsertCenter, deleteCenter,
  listOrders, getOrderById, createOrder, updateOrder, deleteOrder,
  addReport, markReportViewed, deleteReport,
  testSearch, testCatalog,
};
