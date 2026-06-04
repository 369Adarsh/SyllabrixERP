const svc = require('./ipd-admissions.service');
const ok  = (res, data, s = 200) => res.status(s).json(data);
const err = (res, e) => res.status(e.statusCode || 500).json({ error: e.message });

// ── Admissions ────────────────────────────────────────────────────────────────
const listAdmissions    = async (req, res) => { try { ok(res, await svc.listAdmissions(req.tenantId, req.query)); } catch (e) { err(res, e); } };
const getAdmission      = async (req, res) => { try { ok(res, await svc.getAdmissionById(req.tenantId, req.params.id)); } catch (e) { err(res, e); } };
const createAdmission   = async (req, res) => { try { ok(res, await svc.createAdmission(req.tenantId, req.body), 201); } catch (e) { err(res, e); } };
const updateAdmission   = async (req, res) => { try { ok(res, await svc.updateAdmission(req.tenantId, req.params.id, req.body)); } catch (e) { err(res, e); } };
const deleteAdmission   = async (req, res) => { try { await svc.deleteAdmission(req.tenantId, req.params.id); ok(res, { success: true }); } catch (e) { err(res, e); } };
const getCensus         = async (req, res) => { try { ok(res, await svc.getCensus(req.tenantId, req.query.date)); } catch (e) { err(res, e); } };

// ── Progress Notes ────────────────────────────────────────────────────────────
const addProgressNote    = async (req, res) => { try { ok(res, await svc.addProgressNote(req.tenantId, req.params.admId, req.body), 201); } catch (e) { err(res, e); } };
const updateProgressNote = async (req, res) => { try { ok(res, await svc.updateProgressNote(req.tenantId, req.params.noteId, req.body)); } catch (e) { err(res, e); } };
const deleteProgressNote = async (req, res) => { try { await svc.deleteProgressNote(req.tenantId, req.params.noteId); ok(res, { success: true }); } catch (e) { err(res, e); } };

// ── Nursing Charts ────────────────────────────────────────────────────────────
const addNursingChart    = async (req, res) => { try { ok(res, await svc.addNursingChart(req.tenantId, req.params.admId, req.body), 201); } catch (e) { err(res, e); } };
const deleteNursingChart = async (req, res) => { try { await svc.deleteNursingChart(req.tenantId, req.params.chartId); ok(res, { success: true }); } catch (e) { err(res, e); } };

module.exports = {
  listAdmissions, getAdmission, createAdmission, updateAdmission, deleteAdmission, getCensus,
  addProgressNote, updateProgressNote, deleteProgressNote,
  addNursingChart, deleteNursingChart,
};
