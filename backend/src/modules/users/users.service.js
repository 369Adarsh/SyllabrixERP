const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');
const { nextSyllabrixId, generateStaffId } = require('../../utils/syllabrixId');

const USER_SELECT = {
  id: true, name: true, email: true, role: true,
  syllabrixId: true,
  branchId: true,
  branch: { select: { id: true, name: true, code: true, syllabrixId: true } },
  permissionProfile: true, customPermissions: true,
  isActive: true, lastLogin: true, createdAt: true,
};

const list = (tenantId) =>
  prisma.user.findMany({
    where: { tenantId },
    select: USER_SELECT,
    orderBy: { createdAt: 'desc' },
  });

const create = async (tenantId, data) => {
  // Branch-assigned users get a branch-scoped staff ID (MAIN1001).
  // Business-level users (owners, unassigned admins) get a global SYL ID.
  const resolveId = async () => {
    if (data.branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: data.branchId }, select: { code: true } });
      if (branch?.code) return generateStaffId(branch.code);
    }
    return nextSyllabrixId();
  };

  const [hashed, syllabrixId] = await Promise.all([
    bcrypt.hash(data.password, 12),
    resolveId(),
  ]);
  return prisma.user.create({
    data: { ...data, password: hashed, tenantId, syllabrixId },
    select: USER_SELECT,
  });
};

const update = (tenantId, userId, data) => {
  const allowed = ['name', 'role', 'branchId', 'isActive', 'permissionProfile', 'customPermissions'];
  const payload = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  return prisma.user.update({
    where: { id: userId, tenantId },
    data: payload,
    select: USER_SELECT,
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
