const svc = require('./abdm.service');
const ok = (res, data) => res.json(data);
const err = (res, e) => res.status(e.statusCode || 500).json({ error: e.message });

const getConfig           = async (req, res) => { try { ok(res, await svc.getConfig(req.tenantId)); } catch (e) { err(res, e); } };
const saveConfig          = async (req, res) => { try { ok(res, await svc.saveConfig(req.tenantId, req.body)); } catch (e) { err(res, e); } };
const getAbhaStats        = async (req, res) => { try { ok(res, await svc.getAbhaStats(req.tenantId)); } catch (e) { err(res, e); } };
const getPatientsNoAbha   = async (req, res) => { try { ok(res, await svc.getPatientsWithoutAbha(req.tenantId, req.query.limit)); } catch (e) { err(res, e); } };
const updatePatientAbha   = async (req, res) => { try { ok(res, await svc.updatePatientAbha(req.tenantId, req.params.patientId, req.body.abhaId)); } catch (e) { err(res, e); } };
const getHealthRecordQueue= async (req, res) => { try { ok(res, await svc.getHealthRecordQueue(req.tenantId)); } catch (e) { err(res, e); } };

module.exports = { getConfig, saveConfig, getAbhaStats, getPatientsNoAbha, updatePatientAbha, getHealthRecordQueue };
