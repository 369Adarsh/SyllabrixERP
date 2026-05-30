const prisma = require('../../config/prisma');

const list = (tenantId) =>
  prisma.roleRequest.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });

const create = async (tenantId, { roleName, description, permissions, reason }) => {
  if (!roleName?.trim()) throw Object.assign(new Error('Role name is required'), { statusCode: 400 });
  if (!permissions?.length) throw Object.assign(new Error('Select at least one permission'), { statusCode: 400 });
  if (!reason?.trim()) throw Object.assign(new Error('Please explain why you need this role'), { statusCode: 400 });

  // Prevent duplicate pending requests for the same role name
  const existing = await prisma.roleRequest.findFirst({
    where: { tenantId, roleName: { equals: roleName.trim(), mode: 'insensitive' }, status: { in: ['PENDING', 'UNDER_REVIEW'] } },
  });
  if (existing) throw Object.assign(new Error('A request for this role name is already pending review'), { statusCode: 409 });

  return prisma.roleRequest.create({
    data: { tenantId, roleName: roleName.trim(), description: description?.trim() || '', permissions, reason: reason.trim() },
  });
};

// Syllabrix admin only
const updateStatus = (id, { status, adminNote }) =>
  prisma.roleRequest.update({
    where: { id },
    data: { status, adminNote: adminNote || null },
  });

const listAll = () =>
  prisma.roleRequest.findMany({
    include: { tenant: { select: { name: true, email: true, businessType: true } } },
    orderBy: { createdAt: 'desc' },
  });

module.exports = { list, create, updateStatus, listAll };
