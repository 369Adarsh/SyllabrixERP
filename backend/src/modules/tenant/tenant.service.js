const prisma = require('../../config/prisma');

// Business Adaptation Engine — defines which modules are active per business type
const BUSINESS_MODULES = {
  RETAIL:     ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  KIRANA:     ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  COACHING:   ['fees', 'students', 'invoicing', 'reports'],
  SALON:      ['appointments', 'pos', 'inventory', 'invoicing', 'staff', 'customers', 'reports'],
  CLINIC:     ['appointments', 'invoicing', 'staff', 'customers', 'reports'],
  RESTAURANT: ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  GYM:        ['fees', 'appointments', 'invoicing', 'staff', 'customers', 'reports'],
  MALL:       ['lease', 'invoicing', 'reports'],
  FREELANCER: ['invoicing', 'customers', 'reports'],
  WORKSHOP:   ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  OTHER:      ['pos', 'invoicing', 'customers', 'reports'],
};

const getProfile = async (tenantId) => {
  return prisma.tenant.findUnique({ where: { id: tenantId } });
};

const updateProfile = async (tenantId, data) => {
  const allowed = [
    'name', 'phone', 'address', 'city', 'state', 'pincode',
    'gstin', 'pan', 'logoUrl', 'currency', 'locale', 'timezone',
  ];
  const update = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k))
  );
  return prisma.tenant.update({ where: { id: tenantId }, data: update });
};

const getModules = async (tenantId) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { modules: true, businessType: true },
  });
  return { modules: tenant.modules, businessType: tenant.businessType };
};

const toggleModule = async (tenantId, moduleName, enable) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const modules = Array.isArray(tenant.modules) ? tenant.modules : [];
  const updated = enable
    ? [...new Set([...modules, moduleName])]
    : modules.filter((m) => m !== moduleName);
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { modules: updated },
  });
};

const getStats = async (tenantId) => {
  const [users, products, invoices, customers] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.product.count({ where: { tenantId } }),
    prisma.invoice.count({ where: { tenantId } }),
    prisma.customer.count({ where: { tenantId } }),
  ]);
  return { users, products, invoices, customers };
};

module.exports = { BUSINESS_MODULES, getProfile, updateProfile, getModules, toggleModule, getStats };
