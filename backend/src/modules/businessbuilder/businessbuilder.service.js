const prisma = require('../../config/prisma');

// ── Code generation helpers ─────────────────────────────────────────────────

const generateCategoryCode = (name) => {
  const words = name.split(/[\s&,\-_]+/).filter(w => w.length > 1);
  const initials = words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
  return `SYL-BC-${initials.padEnd(3, 'X').slice(0, 3)}`;
};

const generateTypeInitials = (name) => {
  const words = name.split(/[\s&,\-_]+/).filter(Boolean);
  return words.slice(0, 2).map(w => w[0].toUpperCase()).join('').padEnd(2, 'X');
};

const nextSequence = async (categoryId, initials) => {
  const existing = await prisma.businessTypeConfig.findMany({
    where: { categoryId, code: { contains: `-${initials}` } },
    select: { code: true },
  });
  let max = 0;
  existing.forEach(t => {
    const match = t.code.match(/-([A-Z]{2})(\d{2})$/);
    if (match && match[1] === initials) max = Math.max(max, parseInt(match[2], 10));
  });
  return String(max + 1).padStart(2, '0');
};

const buildTypeCode = async (categoryCode, categoryId, name) => {
  const initials = generateTypeInitials(name);
  const seq = await nextSequence(categoryId, initials);
  const catShort = categoryCode.replace('SYL-BC-', '');
  return `SYL-BC-${catShort}-${initials}${seq}`;
};

// ── Categories ───────────────────────────────────────────────────────────────

const listCategories = () =>
  prisma.businessCategory.findMany({
    include: { _count: { select: { businessTypes: true } } },
    orderBy: { name: 'asc' },
  });

const checkCategoryCode = async (code) => {
  const full = code.startsWith('SYL-BC-') ? code : `SYL-BC-${code.toUpperCase()}`;
  const exists = await prisma.businessCategory.findUnique({ where: { code: full } });
  return { code: full, available: !exists };
};

const createCategory = async ({ name, icon, description }, adminName) => {
  const baseCode = generateCategoryCode(name);
  let code = baseCode;
  let suffix = 0;
  while (await prisma.businessCategory.findUnique({ where: { code } })) {
    suffix++;
    code = `SYL-BC-${baseCode.slice(7, 9)}${String.fromCharCode(65 + suffix)}`;
  }
  return prisma.businessCategory.create({
    data: { name, code, icon: icon || null, description: description || null, createdBy: adminName },
  });
};

const updateCategory = (id, data) =>
  prisma.businessCategory.update({
    where: { id },
    data: { name: data.name, icon: data.icon, description: data.description, isActive: data.isActive },
  });

// ── Business Types ───────────────────────────────────────────────────────────

const listBusinessTypes = (filters = {}) =>
  prisma.businessTypeConfig.findMany({
    where: filters,
    include: {
      category: { select: { id: true, name: true, code: true, icon: true } },
      modules: { orderBy: { sortOrder: 'asc' } },
      roles: true,
      _count: { select: { modules: true, roles: true } },
    },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
  });

const getBusinessType = (id) =>
  prisma.businessTypeConfig.findUnique({
    where: { id },
    include: {
      category: true,
      modules: { orderBy: { sortOrder: 'asc' } },
      roles: true,
    },
  });

const checkTypeCode = async (code) => {
  const exists = await prisma.businessTypeConfig.findUnique({ where: { code } });
  return { code, available: !exists };
};

const previewTypeCode = async (categoryId, name) => {
  const cat = await prisma.businessCategory.findUnique({ where: { id: categoryId } });
  if (!cat) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  const code = await buildTypeCode(cat.code, categoryId, name);
  const exists = await prisma.businessTypeConfig.findUnique({ where: { code } });
  return { code, available: !exists, categoryCode: cat.code };
};

const createBusinessType = async ({ name, categoryId, icon, description, enumKey }, adminName) => {
  const cat = await prisma.businessCategory.findUnique({ where: { id: categoryId } });
  if (!cat) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  const code = await buildTypeCode(cat.code, categoryId, name);
  return prisma.businessTypeConfig.create({
    data: { name, code, categoryId, icon: icon || null, description: description || null, enumKey: enumKey || null, createdBy: adminName },
    include: { category: true },
  });
};

const updateBusinessType = (id, data) =>
  prisma.businessTypeConfig.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });

const deleteBusinessType = async (id) => {
  const bt = await prisma.businessTypeConfig.findUnique({ where: { id } });
  if (!bt) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  if (bt.isActive) throw Object.assign(new Error('Cannot delete an active (published) business type'), { statusCode: 400 });
  return prisma.businessTypeConfig.delete({ where: { id } });
};

const cloneBusinessType = async (id, adminName) => {
  const src = await getBusinessType(id);
  if (!src) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  const code = await buildTypeCode(src.category.code, src.categoryId, src.name + ' Copy');
  const clone = await prisma.businessTypeConfig.create({
    data: {
      name: src.name + ' (Copy)',
      code, categoryId: src.categoryId,
      icon: src.icon, description: src.description,
      createdBy: adminName,
    },
  });
  if (src.modules.length) {
    await prisma.businessTypeModule.createMany({
      data: src.modules.map(m => ({ businessTypeId: clone.id, moduleKey: m.moduleKey, tier: m.tier, planRequired: m.planRequired, sortOrder: m.sortOrder })),
    });
  }
  return getBusinessType(clone.id);
};

// ── Module Assignment ─────────────────────────────────────────────────────────

const setModule = async (businessTypeId, moduleKey, tier, planRequired, sortOrder) => {
  return prisma.businessTypeModule.upsert({
    where: { businessTypeId_moduleKey: { businessTypeId, moduleKey } },
    create: { businessTypeId, moduleKey, tier: tier || 'CORE', planRequired: planRequired || null, sortOrder: sortOrder || 0 },
    update: { tier: tier || 'CORE', planRequired: planRequired || null, sortOrder: sortOrder || 0 },
  });
};

const removeModule = (businessTypeId, moduleKey) =>
  prisma.businessTypeModule.delete({
    where: { businessTypeId_moduleKey: { businessTypeId, moduleKey } },
  });

const setModules = async (businessTypeId, modules) => {
  await prisma.businessTypeModule.deleteMany({ where: { businessTypeId } });
  if (!modules.length) return [];
  return prisma.businessTypeModule.createMany({
    data: modules.map((m, i) => ({
      businessTypeId,
      moduleKey: m.moduleKey,
      tier: m.tier || 'CORE',
      planRequired: m.planRequired || null,
      sortOrder: m.sortOrder ?? i,
    })),
  });
};

// ── Publishing ────────────────────────────────────────────────────────────────

const publishBusinessType = async (id, adminName) => {
  const bt = await prisma.businessTypeConfig.findUnique({ where: { id }, include: { modules: true } });
  if (!bt) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  if (!bt.modules.length) throw Object.assign(new Error('Cannot publish: no modules assigned'), { statusCode: 400 });
  return prisma.businessTypeConfig.update({
    where: { id },
    data: { isActive: true, publishedAt: new Date() },
  });
};

const unpublishBusinessType = (id) =>
  prisma.businessTypeConfig.update({ where: { id }, data: { isActive: false } });

// ── Role Suggestions ──────────────────────────────────────────────────────────

const ROLE_RULES = [
  { name: 'Owner',      color: '#7C3AED', trigger: () => true,               permissions: { _default: 'full' } },
  { name: 'Manager',    color: '#3B82F6', trigger: (m) => m.includes('staff') || m.includes('inventory'), permissions: { _default: 'cru' } },
  { name: 'Cashier',    color: '#F59E0B', trigger: (m) => m.includes('pos'),  permissions: { pos: 'full', invoicing: 'cr', customers: 'cr', _default: 'none' } },
  { name: 'Accountant', color: '#10B981', trigger: (m) => m.includes('invoicing') || m.includes('expenses'), permissions: { invoicing: 'full', expenses: 'full', reports: 'r', _default: 'none' } },
  { name: 'Receptionist', color: '#EC4899', trigger: (m) => m.includes('appointments'), permissions: { appointments: 'full', customers: 'cru', _default: 'none' } },
  { name: 'Teacher',    color: '#8B5CF6', trigger: (m) => m.includes('fees') || m.includes('students'), permissions: { fees: 'cru', students: 'full', _default: 'none' } },
  { name: 'Staff',      color: '#64748B', trigger: () => true,               permissions: { _default: 'r' } },
];

const suggestRoles = async (businessTypeId) => {
  const bt = await prisma.businessTypeConfig.findUnique({ where: { id: businessTypeId }, include: { modules: true } });
  if (!bt) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  const moduleKeys = bt.modules.map(m => m.moduleKey);
  return ROLE_RULES.filter(r => r.trigger(moduleKeys)).map(r => ({
    roleName: r.name, color: r.color, permissions: r.permissions, isDefault: true,
  }));
};

const setRoles = async (businessTypeId, roles) => {
  await prisma.businessTypeRole.deleteMany({ where: { businessTypeId } });
  if (!roles.length) return [];
  return prisma.businessTypeRole.createMany({
    data: roles.map(r => ({ businessTypeId, roleName: r.roleName, permissions: r.permissions, isDefault: r.isDefault !== false })),
  });
};

// ── Templates ─────────────────────────────────────────────────────────────────

const listTemplates = () =>
  prisma.businessTemplate.findMany({ orderBy: { createdAt: 'desc' } });

const saveTemplate = async (businessTypeId, { name, description }, adminName) => {
  const bt = await getBusinessType(businessTypeId);
  if (!bt) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.businessTemplate.create({
    data: {
      name, description: description || null,
      modules: bt.modules.map(m => ({ moduleKey: m.moduleKey, tier: m.tier, planRequired: m.planRequired, sortOrder: m.sortOrder })),
      businessTypeId,
      createdBy: adminName,
    },
  });
};

const applyTemplate = async (templateId, businessTypeId) => {
  const tpl = await prisma.businessTemplate.findUnique({ where: { id: templateId } });
  if (!tpl) throw Object.assign(new Error('Template not found'), { statusCode: 404 });
  const modules = Array.isArray(tpl.modules) ? tpl.modules : [];
  return setModules(businessTypeId, modules);
};

const deleteTemplate = (id) => prisma.businessTemplate.delete({ where: { id } });

module.exports = {
  listCategories, checkCategoryCode, createCategory, updateCategory,
  listBusinessTypes, getBusinessType, checkTypeCode, previewTypeCode,
  createBusinessType, updateBusinessType, deleteBusinessType, cloneBusinessType,
  setModule, removeModule, setModules,
  publishBusinessType, unpublishBusinessType,
  suggestRoles, setRoles,
  listTemplates, saveTemplate, applyTemplate, deleteTemplate,
};
