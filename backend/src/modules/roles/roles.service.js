const prisma = require('../../config/prisma');
const { getRolesToSeed } = require('../../config/roleTemplates');

const ROLE_SELECT = {
  id: true, name: true, description: true, color: true,
  isSystem: true, isOwner: true, templateKey: true,
  permissions: true, createdAt: true,
  _count: { select: { users: true } },
};

// ── List all roles for a tenant ───────────────────────────────────────────────
const list = (tenantId) =>
  prisma.role.findMany({
    where: { tenantId },
    select: ROLE_SELECT,
    orderBy: [{ isOwner: 'desc' }, { isSystem: 'desc' }, { name: 'asc' }],
  });

// ── Get single role ───────────────────────────────────────────────────────────
const get = (tenantId, roleId) =>
  prisma.role.findFirstOrThrow({ where: { id: roleId, tenantId }, select: ROLE_SELECT });

// ── Create custom role ────────────────────────────────────────────────────────
const create = async (tenantId, { name, description, color, permissions, templateKey }) => {
  const existing = await prisma.role.findFirst({ where: { tenantId, name } });
  if (existing) throw Object.assign(new Error(`Role "${name}" already exists`), { statusCode: 409 });

  return prisma.role.create({
    data: { tenantId, name, description, color, permissions: permissions || {}, templateKey },
    select: ROLE_SELECT,
  });
};

// ── Update role (custom + system except Owner) ────────────────────────────────
const update = async (tenantId, roleId, data) => {
  const role = await prisma.role.findFirstOrThrow({ where: { id: roleId, tenantId } });
  if (role.isOwner) throw Object.assign(new Error('Owner role cannot be modified'), { statusCode: 403 });

  const allowed = ['name', 'description', 'color', 'permissions'];
  const payload = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));

  // Prevent renaming a system role
  if (role.isSystem && payload.name && payload.name !== role.name) {
    throw Object.assign(new Error('System role names cannot be changed'), { statusCode: 403 });
  }

  return prisma.role.update({
    where: { id: roleId },
    data: payload,
    select: ROLE_SELECT,
  });
};

// ── Delete role (custom only) ─────────────────────────────────────────────────
const remove = async (tenantId, roleId) => {
  const role = await prisma.role.findFirstOrThrow({ where: { id: roleId, tenantId } });
  if (role.isSystem) throw Object.assign(new Error('System roles cannot be deleted'), { statusCode: 403 });

  const inUse = await prisma.user.count({ where: { roleId } });
  if (inUse > 0) throw Object.assign(new Error(`This role is assigned to ${inUse} user(s). Reassign them first.`), { statusCode: 409 });

  await prisma.role.delete({ where: { id: roleId } });
};

// ── Assign role to user ───────────────────────────────────────────────────────
const assignToUser = async (tenantId, userId, roleId) => {
  const [user, role] = await Promise.all([
    prisma.user.findFirstOrThrow({ where: { id: userId, tenantId } }),
    prisma.role.findFirstOrThrow({ where: { id: roleId, tenantId } }),
  ]);

  // Cannot assign Owner role if the user is not already the owner
  if (role.isOwner && user.role !== 'OWNER') {
    throw Object.assign(new Error('Cannot assign Owner role to a non-owner user'), { statusCode: 403 });
  }

  return prisma.user.update({
    where: { id: userId },
    data: { roleId },
    select: { id: true, name: true, email: true, role: true, roleId: true },
  });
};

// ── Seed default roles for a new tenant ──────────────────────────────────────
const seedForTenant = async (tenantId, businessType) => {
  const templates = getRolesToSeed(businessType);
  await prisma.role.createMany({
    data: templates.map(t => ({
      tenantId,
      name:        t.name,
      description: t.description || null,
      color:       t.color || null,
      isSystem:    t.isSystem,
      isOwner:     t.isOwner,
      templateKey: t.templateKey,
      permissions: t.permissions || {},
    })),
    skipDuplicates: true,
  });

  // Return the Owner role so auth.service can assign it to the new user
  return prisma.role.findFirst({ where: { tenantId, isOwner: true } });
};

module.exports = { list, get, create, update, remove, assignToUser, seedForTenant };
