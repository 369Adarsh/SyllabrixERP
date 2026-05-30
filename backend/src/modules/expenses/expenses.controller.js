const path = require('path');
const fs   = require('fs');
const svc  = require('./expenses.service');
const { ok, created } = require('../../utils/response');

const injectBranch = (req) => {
  const params = { ...req.query };
  if (req.user?.role === 'MANAGER' && req.user.branchId) params.branchId = req.user.branchId;
  return params;
};

const activity = require('../activity/activity.service');

const list    = async (req, res, next) => { try { ok(res, await svc.list(req.tenantId, injectBranch(req))); } catch (e) { next(e); } };
const create  = async (req, res, next) => {
  try {
    const exp = await svc.create(req.tenantId, req.body);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, 'EXPENSE_ADDED', 'expenses', 'Expense', exp.id, { amount: exp.amount, category: exp.category }, ipAddress);
    created(res, exp);
  } catch (e) { next(e); }
};
const update  = async (req, res, next) => { try { ok(res, await svc.update(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); } };
const remove  = async (req, res, next) => { try { ok(res, await svc.remove(req.tenantId, req.params.id), 'Deleted'); } catch (e) { next(e); } };
const summary = async (req, res, next) => { try { ok(res, await svc.summary(req.tenantId, injectBranch(req))); } catch (e) { next(e); } };

const uploadReceipt = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const receiptUrl = `/uploads/receipts/${req.file.filename}`;
    const expense = await svc.setReceipt(req.tenantId, req.params.id, receiptUrl);
    ok(res, expense);
  } catch (e) { next(e); }
};

const removeReceipt = async (req, res, next) => {
  try {
    // Remove old file from disk if it exists
    const prisma = require('../../config/prisma');
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id, tenantId: req.tenantId }, select: { receipt: true } });
    if (expense?.receipt) {
      const filePath = path.join(__dirname, '../../../', expense.receipt);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    ok(res, await svc.clearReceipt(req.tenantId, req.params.id));
  } catch (e) { next(e); }
};

module.exports = { list, create, update, remove, summary, uploadReceipt, removeReceipt };
