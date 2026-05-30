const prisma = require('../../config/prisma');
const waSvc = require('../whatsapp/whatsapp.service');

const list = (tenantId) =>
  prisma.whatsAppCampaign.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });

const create = (tenantId, data) => {
  const { name, message, segment } = data;
  return prisma.whatsAppCampaign.create({
    data: { tenantId, name, message, segment },
  });
};

const remove = (tenantId, id) =>
  prisma.whatsAppCampaign.delete({ where: { id, tenantId } });

// Resolve which customers are in a segment
const resolveSegment = async (tenantId, segment) => {
  const now = new Date();

  if (segment === 'ALL') {
    return prisma.customer.findMany({ where: { tenantId, phone: { not: null } } });
  }

  if (segment === 'EXPIRING_7') {
    const cutoff = new Date(now.getTime() + 7 * 86400000);
    const subs = await prisma.customerSubscription.findMany({
      where: { tenantId, status: 'ACTIVE', expiryDate: { gte: now, lte: cutoff } },
      include: { customer: true },
      distinct: ['customerId'],
    });
    return subs.map((s) => s.customer).filter((c) => c?.phone);
  }

  if (segment === 'EXPIRING_30') {
    const cutoff = new Date(now.getTime() + 30 * 86400000);
    const subs = await prisma.customerSubscription.findMany({
      where: { tenantId, status: 'ACTIVE', expiryDate: { gte: now, lte: cutoff } },
      include: { customer: true },
      distinct: ['customerId'],
    });
    return subs.map((s) => s.customer).filter((c) => c?.phone);
  }

  if (segment === 'INACTIVE_30') {
    const cutoff = new Date(now.getTime() - 30 * 86400000);
    return prisma.customer.findMany({
      where: { tenantId, phone: { not: null }, OR: [{ lastVisitAt: { lt: cutoff } }, { lastVisitAt: null }] },
    });
  }

  if (segment === 'INACTIVE_60') {
    const cutoff = new Date(now.getTime() - 60 * 86400000);
    return prisma.customer.findMany({
      where: { tenantId, phone: { not: null }, OR: [{ lastVisitAt: { lt: cutoff } }, { lastVisitAt: null }] },
    });
  }

  if (segment === 'VIP') {
    // Top 20% by totalSpent with at least 1 visit
    const all = await prisma.customer.findMany({
      where: { tenantId, phone: { not: null }, totalSpent: { gt: 0 } },
      orderBy: { totalSpent: 'desc' },
    });
    const vipCount = Math.max(1, Math.ceil(all.length * 0.2));
    return all.slice(0, vipCount);
  }

  if (segment === 'BIRTHDAY_MONTH') {
    const month = now.getMonth() + 1;
    const customers = await prisma.customer.findMany({
      where: { tenantId, phone: { not: null }, birthday: { not: null } },
    });
    return customers.filter((c) => c.birthday && new Date(c.birthday).getMonth() + 1 === month);
  }

  return [];
};

const previewSegment = async (tenantId, segment) => {
  const customers = await resolveSegment(tenantId, segment);
  return { count: customers.length };
};

const send = async (tenantId, campaignId) => {
  const campaign = await prisma.whatsAppCampaign.findUnique({
    where: { id: campaignId, tenantId },
    include: { tenant: true },
  });
  if (!campaign) throw new Error('Campaign not found');
  if (campaign.status === 'SENDING' || campaign.status === 'SENT') throw new Error('Campaign already sent or sending');

  await prisma.whatsAppCampaign.update({ where: { id: campaignId }, data: { status: 'SENDING' } });

  const customers = await resolveSegment(tenantId, campaign.segment);
  let sent = 0;
  let failed = 0;

  for (const customer of customers) {
    if (!customer?.phone) continue;
    try {
      // Replace template variables
      const body = campaign.message
        .replace(/\{\{name\}\}/g, customer.name)
        .replace(/\{\{businessName\}\}/g, campaign.tenant?.name || '')
        .replace(/\{\{expiryDate\}\}/g, customer.subscriptions?.[0]?.expiryDate
          ? new Date(customer.subscriptions[0].expiryDate).toLocaleDateString('en-IN')
          : '');

      await waSvc.sendText(tenantId, customer.phone, body, customer.name);
      sent++;
    } catch {
      failed++;
    }
  }

  const updated = await prisma.whatsAppCampaign.update({
    where: { id: campaignId },
    data: { status: 'SENT', sentCount: sent, failedCount: failed, sentAt: new Date() },
  });

  return { ...updated, sent, failed, total: customers.length };
};

const personalizeMessage = (msg, customer, businessName) =>
  msg
    .replace(/\{\{name\}\}/g, customer.name || '')
    .replace(/\{\{businessName\}\}/g, businessName || '')
    .replace(/\{\{expiryDate\}\}/g, customer.subscriptions?.[0]?.expiryDate
      ? new Date(customer.subscriptions[0].expiryDate).toLocaleDateString('en-IN') : '');

const markSent = (tenantId, id, { sent, failed }) =>
  prisma.whatsAppCampaign.update({
    where: { id, tenantId },
    data: { status: 'SENT', sentCount: sent, failedCount: failed, sentAt: new Date() },
  });

module.exports = { list, create, remove, previewSegment, send, resolveSegment, personalizeMessage, markSent };
