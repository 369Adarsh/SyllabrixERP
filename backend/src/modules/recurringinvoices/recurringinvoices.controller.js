const svc = require('./recurringinvoices.service');

const list = async (req, res, next) => {
  try {
    const data = await svc.list(req.tenantId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await svc.create(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await svc.update(req.tenantId, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const toggle = async (req, res, next) => {
  try {
    const data = await svc.toggle(req.tenantId, req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await svc.remove(req.tenantId, req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// Manual trigger to generate due invoices (e.g. from a cron webhook)
const generateDue = async (req, res, next) => {
  try {
    const data = await svc.generateDue(req.tenantId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { list, create, update, toggle, remove, generateDue };
