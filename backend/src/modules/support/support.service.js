const prisma = require('../../config/prisma');

const pad = (n, len = 5) => String(n).padStart(len, '0');

const generateTicketNumber = async () => {
  const count = await prisma.supportTicket.count();
  const yymm = new Date().toISOString().slice(2, 7).replace('-', '');
  return `TKT-${yymm}-${pad(count + 1)}`;
};

// ── Tenant-facing ──────────────────────────────────────────────────────────

const listMyTickets = (tenantId, { status } = {}) =>
  prisma.supportTicket.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
    include: { messages: { where: { isInternal: false }, orderBy: { createdAt: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
  });

const getMyTicket = (tenantId, id) =>
  prisma.supportTicket.findFirst({
    where: { id, tenantId },
    include: { messages: { where: { isInternal: false }, orderBy: { createdAt: 'asc' } } },
  });

const createTicket = async (tenantId, { title, category, priority = 'MEDIUM', message, moduleKey, featureKey, reporterRole }, user) => {
  const ticketNumber = await generateTicketNumber();
  return prisma.supportTicket.create({
    data: {
      tenantId, ticketNumber, title, category, priority,
      ...(moduleKey    && { moduleKey }),
      ...(featureKey   && { featureKey }),
      ...(reporterRole && { reporterRole }),
      reporterName: user.name || null,
      messages: {
        create: { senderType: 'TENANT', senderId: user.id, senderName: user.name, content: message },
      },
    },
    include: { messages: true },
  });
};

const replyToTicket = async (tenantId, ticketId, content, user) => {
  const ticket = await prisma.supportTicket.findFirst({ where: { id: ticketId, tenantId } });
  if (!ticket) throw Object.assign(new Error('Ticket not found'), { statusCode: 404 });
  if (['RESOLVED', 'CLOSED'].includes(ticket.status)) throw Object.assign(new Error('Ticket is closed'), { statusCode: 400 });

  const [msg] = await prisma.$transaction([
    prisma.ticketMessage.create({ data: { ticketId, senderType: 'TENANT', senderId: user.id, senderName: user.name, content } }),
    prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'OPEN', updatedAt: new Date() } }),
  ]);
  return msg;
};

const closeTicket = (tenantId, id) =>
  prisma.supportTicket.updateMany({ where: { id, tenantId }, data: { status: 'CLOSED', resolvedAt: new Date() } });

// ── Super Admin-facing ─────────────────────────────────────────────────────

const listAllTickets = ({ status, category, priority, tenantId, page = 1, limit = 20 } = {}) => {
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;
  if (tenantId) where.tenantId = tenantId;

  return Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        tenant: { select: { name: true, email: true, businessType: true, syllabrixId: true } },
        messages: { where: { isInternal: false }, orderBy: { createdAt: 'asc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: Number(limit),
    }),
    prisma.supportTicket.count({ where }),
  ]);
};

const getTicketAdmin = (id) =>
  prisma.supportTicket.findUnique({
    where: { id },
    include: {
      tenant: { select: { name: true, email: true, businessType: true, plan: true } },
      messages: { orderBy: { createdAt: 'asc' } }, // admin sees internal notes too
    },
  });

const adminReply = async (ticketId, content, admin, isInternal = false) => {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw Object.assign(new Error('Ticket not found'), { statusCode: 404 });

  const newStatus = isInternal ? ticket.status : 'WAITING_TENANT';
  const [msg] = await prisma.$transaction([
    prisma.ticketMessage.create({ data: { ticketId, senderType: 'SYLLABRIX', senderId: admin.adminId, senderName: admin.name || 'Syllabrix Support', content, isInternal } }),
    prisma.supportTicket.update({ where: { id: ticketId }, data: { status: newStatus, updatedAt: new Date() } }),
  ]);
  return msg;
};

const updateTicketStatus = (id, status) => {
  const data = { status };
  if (['RESOLVED', 'CLOSED'].includes(status)) data.resolvedAt = new Date();
  return prisma.supportTicket.update({ where: { id }, data });
};

const assignTicketPriority = (id, priority) =>
  prisma.supportTicket.update({ where: { id }, data: { priority } });

const getTicketStats = async () => {
  const [byStatus, byCategory, byPriority, avgResolution] = await Promise.all([
    prisma.supportTicket.groupBy({ by: ['status'], _count: true }),
    prisma.supportTicket.groupBy({ by: ['category'], _count: true }),
    prisma.supportTicket.groupBy({ by: ['priority'], _count: true }),
    prisma.supportTicket.findMany({
      where: { resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
      take: 100,
      orderBy: { resolvedAt: 'desc' },
    }),
  ]);

  const avgHours = avgResolution.length
    ? avgResolution.reduce((sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0) / avgResolution.length / 3600000
    : null;

  return { byStatus, byCategory, byPriority, avgResolutionHours: avgHours ? Math.round(avgHours) : null };
};

module.exports = {
  listMyTickets, getMyTicket, createTicket, replyToTicket, closeTicket,
  listAllTickets, getTicketAdmin, adminReply, updateTicketStatus, assignTicketPriority, getTicketStats,
};
