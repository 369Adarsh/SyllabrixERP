const prisma = require('../../config/prisma');
const { generateInvoiceNumber } = require('../../utils/generateNumber');

const list = (tenantId, customerId) =>
  prisma.customerSubscription.findMany({
    where: { tenantId, customerId },
    orderBy: { expiryDate: 'desc' },
  });

const VALID_METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE'];

const create = async (tenantId, customerId, data) => {
  const { planName, startDate, expiryDate, amount, autoRenew, notes, paymentMethod } = data;
  const price = parseFloat(amount) || 0;
  const isPaid = paymentMethod && VALID_METHODS.includes(paymentMethod.toUpperCase());
  const method = isPaid ? paymentMethod.toUpperCase() : null;

  const [subscription, invoiceNumber] = await Promise.all([
    prisma.customerSubscription.create({
      data: {
        tenantId,
        customerId,
        planName,
        startDate: new Date(startDate),
        expiryDate: new Date(expiryDate),
        amount: price,
        autoRenew: autoRenew !== false,
        notes,
      },
    }),
    generateInvoiceNumber(),
  ]);

  if (price > 0) {
    const start = new Date(startDate);
    const expiry = new Date(expiryDate);
    const periodLabel = `${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} – ${expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        customerId,
        invoiceNumber,
        status: isPaid ? 'PAID' : 'DRAFT',
        subtotal: price,
        taxAmount: 0,
        discountAmount: 0,
        total: price,
        amountPaid: isPaid ? price : 0,
        balanceDue: isPaid ? 0 : price,
        notes: `Membership: ${planName} · ${periodLabel}`,
        items: {
          create: [{
            description: `${planName} Membership (${periodLabel})`,
            quantity: 1,
            unitPrice: price,
            discount: 0,
            taxRate: 0,
            taxAmount: 0,
            total: price,
          }],
        },
      },
    });

    // Record payment immediately when collected at desk
    if (isPaid) {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: price,
          method,
          notes: `Collected at registration — ${planName}`,
        },
      });
    }
  }

  return subscription;
};

const updateStatus = (tenantId, id, status) =>
  prisma.customerSubscription.update({
    where: { id, tenantId },
    data: { status },
  });

const remove = (tenantId, id) =>
  prisma.customerSubscription.delete({ where: { id, tenantId } });

// Find subscriptions expiring within `days` days (for reminders)
const getExpiring = async (tenantId, days = 7) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return prisma.customerSubscription.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
      expiryDate: { gte: now, lte: cutoff },
    },
    include: { customer: true },
    orderBy: { expiryDate: 'asc' },
  });
};

// Auto-expire subscriptions past their expiryDate
const autoExpire = async (tenantId) => {
  const result = await prisma.customerSubscription.updateMany({
    where: { tenantId, status: 'ACTIVE', expiryDate: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });
  return result.count;
};

module.exports = { list, create, updateStatus, remove, getExpiring, autoExpire };
