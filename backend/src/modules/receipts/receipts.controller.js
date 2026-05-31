const svc = require('./receipts.service');

async function backfill(req, res, next) {
  try {
    const result = await svc.backfillReceipts(req.user.tenantId, req.user);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const receipt = await svc.createReceipt(req.user.tenantId, {
      ...req.body,
      generatedById:   req.user.id,
      generatedByName: req.user.name,
    });
    res.status(201).json({ success: true, data: receipt });
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const { from, to, paymentMethod, page, limit } = req.query;
    const result = await svc.listReceipts(req.user.tenantId, { from, to, paymentMethod, page: Number(page) || 1, limit: Number(limit) || 50 });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function summary(req, res, next) {
  try {
    const { from, to } = req.query;
    const data = await svc.getSummary(req.user.tenantId, { from, to });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function updatePayment(req, res, next) {
  try {
    const { paymentMethod } = req.body;
    if (!['CASH', 'UPI', 'CARD', 'LATER'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }
    const receipt = await svc.updatePaymentMethod(req.user.tenantId, req.params.id, paymentMethod);
    res.json({ success: true, data: receipt });
  } catch (err) { next(err); }
}

module.exports = { create, list, summary, backfill, updatePayment };
