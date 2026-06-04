const svc = require('./clinic-doctors.service');
const ok = (res, data) => res.json(data);
const err = (res, e) => res.status(e.statusCode || 500).json({ error: e.message });

const listDoctors        = async (req, res) => { try { ok(res, await svc.listDoctors(req.tenantId)); } catch (e) { err(res, e); } };
const getAllStaff         = async (req, res) => { try { ok(res, await svc.getAllStaff(req.tenantId)); } catch (e) { err(res, e); } };
const getProfileByStaff  = async (req, res) => { try { ok(res, await svc.getProfileByStaffId(req.tenantId, req.params.staffId)); } catch (e) { err(res, e); } };
const upsertProfile      = async (req, res) => { try { ok(res, await svc.upsertProfile(req.tenantId, req.params.staffId, req.body)); } catch (e) { err(res, e); } };

module.exports = { listDoctors, getAllStaff, getProfileByStaff, upsertProfile };
