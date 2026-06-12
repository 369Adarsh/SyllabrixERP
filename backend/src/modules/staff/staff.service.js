const prisma = require('../../config/prisma');

const list = (tenantId, { branchId } = {}) =>
  prisma.staff.findMany({
    where: { tenantId, ...(branchId && { branchId }) },
    orderBy: { createdAt: 'desc' },
  });

const get = async (tenantId, id) => {
  const s = await prisma.staff.findFirst({ where: { id, tenantId } });
  if (!s) throw Object.assign(new Error('Staff not found'), { status: 404 });
  return s;
};

const create = (tenantId, data) =>
  prisma.staff.create({ data: { ...data, tenantId } });

const update = async (tenantId, id, data) => {
  await get(tenantId, id);
  return prisma.staff.update({ where: { id }, data });
};

const remove = async (tenantId, id) => {
  await get(tenantId, id);
  return prisma.staff.delete({ where: { id } });
};

const toggleActive = async (tenantId, id) => {
  const s = await get(tenantId, id);
  return prisma.staff.update({ where: { id }, data: { isActive: !s.isActive } });
};

module.exports = { list, get, create, update, remove, toggleActive };
