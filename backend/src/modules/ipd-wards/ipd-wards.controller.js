const svc = require('./ipd-wards.service');
const ok = (res, data, s = 200) => res.status(s).json(data);
const err = (res, e) => res.status(e.statusCode || 500).json({ error: e.message });

const listWards      = async (req, res) => { try { ok(res, await svc.listWards(req.tenantId)); } catch (e) { err(res, e); } };
const createWard     = async (req, res) => { try { ok(res, await svc.createWard(req.tenantId, req.body), 201); } catch (e) { err(res, e); } };
const updateWard     = async (req, res) => { try { ok(res, await svc.updateWard(req.tenantId, req.params.id, req.body)); } catch (e) { err(res, e); } };
const deleteWard     = async (req, res) => { try { ok(res, await svc.deleteWard(req.tenantId, req.params.id)); } catch (e) { err(res, e); } };
const createBed      = async (req, res) => { try { ok(res, await svc.createBed(req.tenantId, req.body), 201); } catch (e) { err(res, e); } };
const updateBedStatus= async (req, res) => { try { ok(res, await svc.updateBedStatus(req.tenantId, req.params.id, req.body.status)); } catch (e) { err(res, e); } };
const deleteBed      = async (req, res) => { try { await svc.deleteBed(req.tenantId, req.params.id); ok(res, { success: true }); } catch (e) { err(res, e); } };
const getOccupancy   = async (req, res) => { try { ok(res, await svc.getOccupancy(req.tenantId)); } catch (e) { err(res, e); } };
const getTypes       = (req, res) => ok(res, { wardTypes: svc.WARD_TYPES, bedTypes: svc.BED_TYPES });

module.exports = { listWards, createWard, updateWard, deleteWard, createBed, updateBedStatus, deleteBed, getOccupancy, getTypes };
