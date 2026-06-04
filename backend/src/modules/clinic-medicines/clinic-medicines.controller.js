const svc = require('./clinic-medicines.service');
const ok = (res, data, status = 200) => res.status(status).json(data);
const err = (res, e) => res.status(e.statusCode || 500).json({ error: e.message });

const listSuppliers    = async (req, res) => { try { ok(res, await svc.listSuppliers(req.tenantId)); } catch (e) { err(res, e); } };
const upsertSupplier   = async (req, res) => { try { ok(res, await svc.upsertSupplier(req.tenantId, req.body), req.body.id ? 200 : 201); } catch (e) { err(res, e); } };
const deleteSupplier   = async (req, res) => { try { ok(res, await svc.deleteSupplier(req.tenantId, req.params.id)); } catch (e) { err(res, e); } };

const listMedicines    = async (req, res) => { try { ok(res, await svc.listMedicines(req.tenantId)); } catch (e) { err(res, e); } };
const getMedicineById  = async (req, res) => { try { ok(res, await svc.getMedicineById(req.tenantId, req.params.id)); } catch (e) { err(res, e); } };
const createMedicine   = async (req, res) => { try { ok(res, await svc.createMedicine(req.tenantId, req.body), 201); } catch (e) { err(res, e); } };
const updateMedicine   = async (req, res) => { try { ok(res, await svc.updateMedicine(req.tenantId, req.params.id, req.body)); } catch (e) { err(res, e); } };
const deleteMedicine   = async (req, res) => { try { await svc.deleteMedicine(req.tenantId, req.params.id); ok(res, { success: true }); } catch (e) { err(res, e); } };

const addBatch         = async (req, res) => { try { ok(res, await svc.addBatch(req.tenantId, req.body), 201); } catch (e) { err(res, e); } };
const deleteBatch      = async (req, res) => { try { await svc.deleteBatch(req.tenantId, req.params.id); ok(res, { success: true }); } catch (e) { err(res, e); } };

const dispense         = async (req, res) => { try { ok(res, await svc.dispense(req.tenantId, req.body), 201); } catch (e) { err(res, e); } };
const listDispenses    = async (req, res) => { try { ok(res, await svc.listDispenses(req.tenantId, req.query)); } catch (e) { err(res, e); } };

const expiryAlerts     = async (req, res) => { try { ok(res, await svc.getExpiryAlerts(req.tenantId)); } catch (e) { err(res, e); } };
const lowStockAlerts   = async (req, res) => { try { ok(res, await svc.getLowStockAlerts(req.tenantId)); } catch (e) { err(res, e); } };
const scheduleHReg     = async (req, res) => { try { ok(res, await svc.getScheduleHRegister(req.tenantId)); } catch (e) { err(res, e); } };

module.exports = {
  listSuppliers, upsertSupplier, deleteSupplier,
  listMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine,
  addBatch, deleteBatch, dispense, listDispenses,
  expiryAlerts, lowStockAlerts, scheduleHReg,
};
