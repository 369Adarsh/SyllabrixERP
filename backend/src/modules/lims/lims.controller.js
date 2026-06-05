const svc = require('./lims.service');
const ok  = (res, data, s = 200) => res.status(s).json(data);
const err = (res, e) => res.status(e.statusCode || 500).json({ error: e.message });

// Test catalog
const listTests      = async (req, res) => { try { ok(res, await svc.listTests(req.tenantId, req.query)); } catch (e) { err(res, e); } };
const createTest     = async (req, res) => { try { ok(res, await svc.createTest(req.tenantId, req.body), 201); } catch (e) { err(res, e); } };
const updateTest     = async (req, res) => { try { ok(res, await svc.updateTest(req.tenantId, req.params.id, req.body)); } catch (e) { err(res, e); } };
const deactivateTest = async (req, res) => { try { ok(res, await svc.deactivateTest(req.tenantId, req.params.id)); } catch (e) { err(res, e); } };

// Samples
const listSamples    = async (req, res) => { try { ok(res, await svc.listSamples(req.tenantId, req.query)); } catch (e) { err(res, e); } };
const getSample      = async (req, res) => { try { ok(res, await svc.getSample(req.tenantId, req.params.id)); } catch (e) { err(res, e); } };
const createSample   = async (req, res) => { try { ok(res, await svc.createSample(req.tenantId, req.body), 201); } catch (e) { err(res, e); } };
const updateSampleStatus = async (req, res) => { try { ok(res, await svc.updateSampleStatus(req.tenantId, req.params.id, req.body.status)); } catch (e) { err(res, e); } };

// Results
const addResult    = async (req, res) => { try { ok(res, await svc.addResult(req.tenantId, req.params.sampleId, req.body), 201); } catch (e) { err(res, e); } };
const updateResult = async (req, res) => { try { ok(res, await svc.updateResult(req.tenantId, req.params.resultId, req.body)); } catch (e) { err(res, e); } };
const deleteResult = async (req, res) => { try { await svc.deleteResult(req.tenantId, req.params.resultId); ok(res, { success: true }); } catch (e) { err(res, e); } };

// Stats
const getStats   = async (req, res) => { try { ok(res, await svc.getStats(req.tenantId)); } catch (e) { err(res, e); } };
const getCategories = (req, res) => ok(res, svc.CATEGORIES);

module.exports = { listTests, createTest, updateTest, deactivateTest, listSamples, getSample, createSample, updateSampleStatus, addResult, updateResult, deleteResult, getStats, getCategories };
