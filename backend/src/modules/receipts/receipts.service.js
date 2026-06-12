const prisma = require('../../config/prisma');

const generateReceiptNo = () => `RCP-${Date.now().toString(36).toUpperCase()}`;

async function createReceipt(tenantId, data) {
  return prisma.memberReceipt.create({
    data: {
      receiptNo:       generateReceiptNo(),
      tenantId,
      customerId:      data.customerId,
      subscriptionId:  data.subscriptionId || null,
      memberName:      data.memberName,
      memberPhone:     data.memberPhone,
      planName:        data.planName,
      planDuration:    data.planDuration,
      startDate:       new Date(data.startDate),
      expiryDate:      new Date(data.expiryDate),
      originalAmount:  data.originalAmount,
      discountAmount:  data.discountAmount || 0,
      discountNote:    data.discountNote || null,
      finalAmount:     data.finalAmount,
      paymentMethod:   data.paymentMethod,
      generatedById:   data.generatedById,
      generatedByName: data.generatedByName,
    },
  });
}

async function listReceipts(tenantId, { from, to, paymentMethod, page = 1, limit = 50 }) {
  const where = { tenantId };

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  if (paymentMethod && paymentMethod !== 'ALL') {
    where.paymentMethod = paymentMethod;
  }

  const [receipts, total] = await Promise.all([
    prisma.memberReceipt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.memberReceipt.count({ where }),
  ]);

  return { receipts, total, page, limit };
}

async function getSummary(tenantId, { from, to }) {
  const where = { tenantId };

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const rows = await prisma.memberReceipt.groupBy({
    by: ['paymentMethod'],
    where,
    _sum: { finalAmount: true },
    _count: { id: true },
  });

  const summary = { CASH: 0, UPI: 0, CARD: 0, LATER: 0, total: 0, totalCount: 0 };
  for (const row of rows) {
    const amt = row._sum.finalAmount || 0;
    const key = row.paymentMethod.toUpperCase();
    if (key in summary) summary[key] = amt;
    if (key !== 'LATER') summary.total += amt;
    summary.totalCount += row._count.id;
  }

  return summary;
}

// Backfill receipt records for subscriptions that don't have one yet
async function backfillReceipts(tenantId, requestingUser) {
  // Find all subscriptions for this tenant that have no matching receipt
  const existingReceiptSubIds = await prisma.memberReceipt.findMany({
    where: { tenantId },
    select: { subscriptionId: true },
  });
  const coveredIds = new Set(existingReceiptSubIds.map((r) => r.subscriptionId).filter(Boolean));

  const subs = await prisma.customerSubscription.findMany({
    where: { tenantId },
    include: { customer: { select: { id: true, name: true, phone: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const toBackfill = subs.filter((s) => !coveredIds.has(s.id));
  if (toBackfill.length === 0) return { created: 0 };

  const records = toBackfill.map((s) => {
    const duration = Math.round((new Date(s.expiryDate) - new Date(s.startDate)) / (1000 * 60 * 60 * 24));
    return {
      receiptNo:       `RCP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      tenantId,
      customerId:      s.customerId,
      subscriptionId:  s.id,
      memberName:      s.customer?.name || 'Unknown',
      memberPhone:     s.customer?.phone || '',
      planName:        s.planName,
      planDuration:    duration,
      startDate:       s.startDate,
      expiryDate:      s.expiryDate,
      originalAmount:  s.amount,
      discountAmount:  0,
      discountNote:    null,
      finalAmount:     s.amount,
      paymentMethod:   s.paymentMethod || 'LATER',
      generatedById:   requestingUser.id,
      generatedByName: requestingUser.name,
      createdAt:       s.createdAt,
    };
  });

  await prisma.memberReceipt.createMany({ data: records, skipDuplicates: true });
  return { created: records.length };
}

async function updatePaymentMethod(tenantId, receiptId, paymentMethod) {
  return prisma.memberReceipt.update({
    where: { id: receiptId, tenantId },
    data: { paymentMethod },
  });
}

module.exports = { createReceipt, listReceipts, getSummary, backfillReceipts, updatePaymentMethod };
