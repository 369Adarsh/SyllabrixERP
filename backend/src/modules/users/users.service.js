const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');

const list = (tenantId) =>
  prisma.user.findMany({
    where: { tenantId },
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLogin: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

const create = async (tenantId, data) => {
  const hashed = await bcrypt.hash(data.password, 12);
  return prisma.user.create({
    data: { ...data, password: hashed, tenantId },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
};

const update = (tenantId, userId, data) => {
  const allowed = ['name', 'role', 'isActive'];
  const update = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  return prisma.user.update({
    where: { id: userId, tenantId },
    data: update,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
};

const remove = (tenantId, userId) =>
  prisma.user.update({ where: { id: userId, tenantId }, data: { isActive: false } });

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });
  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
};

module.exports = { list, create, update, remove, changePassword };
