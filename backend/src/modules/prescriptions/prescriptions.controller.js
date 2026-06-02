const svc = require('./prescriptions.service');

const ok = (res, data, status = 200) => res.status(status).json(data);
const err = (res, e) => res.status(e.statusCode || 500).json({ error: e.message });

const list = async (req, res) => {
  try {
    const data = await svc.list(req.tenantId, req.query);
    ok(res, data);
  } catch (e) { err(res, e); }
};

const getById = async (req, res) => {
  try {
    const data = await svc.getById(req.tenantId, req.params.id);
    ok(res, data);
  } catch (e) { err(res, e); }
};

const create = async (req, res) => {
  try {
    const data = await svc.create(req.tenantId, req.body);
    ok(res, data, 201);
  } catch (e) { err(res, e); }
};

const update = async (req, res) => {
  try {
    const data = await svc.update(req.tenantId, req.params.id, req.body);
    ok(res, data);
  } catch (e) { err(res, e); }
};

const remove = async (req, res) => {
  try {
    await svc.remove(req.tenantId, req.params.id);
    ok(res, { success: true });
  } catch (e) { err(res, e); }
};

const drugSearch = async (req, res) => {
  try {
    const results = svc.drugSearch(req.query.q || '');
    ok(res, results);
  } catch (e) { err(res, e); }
};

module.exports = { list, getById, create, update, remove, drugSearch };
