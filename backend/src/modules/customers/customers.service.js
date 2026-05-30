const prisma = require('../../config/prisma');

const list = async (tenantId, { search, page, limit = 50 } = {}) => {
  const where = { tenantId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  const include = { subscriptions: { where: { status: 'ACTIVE' }, orderBy: { expiryDate: 'asc' }, take: 1 } };
  if (!page) {
    return prisma.customer.findMany({ where, orderBy: { name: 'asc' }, include });
  }
  const p = Number(page), l = Number(limit);
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({ where, orderBy: { name: 'asc' }, skip: (p - 1) * l, take: l, include }),
    prisma.customer.count({ where }),
  ]);
  return { customers, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
};

const getProfile = async (tenantId, id) => {
  const customer = await prisma.customer.findUnique({
    where: { id, tenantId },
    include: {
      subscriptions: { orderBy: { expiryDate: 'desc' } },
      invoices: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, invoiceNumber: true, total: true, status: true, createdAt: true },
      },
      transactions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, receiptNumber: true, total: true, paymentMethod: true, createdAt: true },
      },
      appointments: {
        take: 5,
        orderBy: { startTime: 'desc' },
        select: { id: true, title: true, status: true, startTime: true, price: true },
      },
    },
  });
  if (!customer) return null;

  // Recent WhatsApp messages
  const messages = customer.phone
    ? await prisma.whatsAppMessage.findMany({
        where: { tenantId, phone: { contains: customer.phone.replace(/\D/g, '').slice(-10) } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : [];

  return { ...customer, messages };
};

const generateGymMembershipId = async (tenantId) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
  const prefix = (tenant?.name || 'GYM').replace(/[^A-Z]/g, '').slice(0, 3) || 'MBR';
  const last = await prisma.customer.findFirst({
    where: { tenantId, gymMembershipId: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { gymMembershipId: true },
  });
  const lastNum = last?.gymMembershipId ? parseInt(last.gymMembershipId.replace(/\D/g, '')) || 0 : 0;
  return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
};

const create = async (tenantId, data) => {
  const allowed = ['name', 'phone', 'email', 'address', 'gstin', 'notes', 'birthday', 'tags', 'personalTrainerId'];
  const payload = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  if (payload.birthday) payload.birthday = new Date(payload.birthday);
  if (data.isGymMember) {
    payload.gymMembershipId = await generateGymMembershipId(tenantId);
  }
  return prisma.customer.create({ data: { ...payload, tenantId } });
};

const update = (tenantId, id, data) => {
  const allowed = ['name', 'phone', 'email', 'address', 'gstin', 'notes', 'birthday', 'tags', 'creditLimit', 'personalTrainerId', 'gymMembershipId'];
  const payload = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  if (payload.birthday) payload.birthday = new Date(payload.birthday);
  return prisma.customer.update({ where: { id, tenantId }, data: payload });
};

const remove = (tenantId, id) => prisma.customer.delete({ where: { id, tenantId } });

// Adjust Udhar/credit balance
const adjustCredit = async (tenantId, id, amount, operation) => {
  const customer = await prisma.customer.findUnique({ where: { id, tenantId } });
  if (!customer) throw new Error('Customer not found');
  const newBalance = operation === 'add'
    ? customer.creditBalance + parseFloat(amount)
    : customer.creditBalance - parseFloat(amount);
  if (newBalance < 0) throw new Error('Credit balance cannot go negative');
  return prisma.customer.update({ where: { id, tenantId }, data: { creditBalance: newBalance } });
};

module.exports = { list, getProfile, create, update, remove, adjustCredit };
