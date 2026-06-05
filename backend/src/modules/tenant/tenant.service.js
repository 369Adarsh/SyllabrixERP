const prisma = require('../../config/prisma');

// Business Adaptation Engine — defines which nav modules are active per business type.
// Keys map to the `module` field on Sidebar nav items.
// Always-visible modules (module: null): staff, expenses, assets
// Module-gated add-ons: whatsapp, campaigns, automation, ai, b2b (enabled per tenant)
const BUSINESS_MODULES = {
  // ── Existing ─────────────────────────────────────────────────────────────
  RETAIL:            ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  KIRANA:            ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  COACHING:          ['fees', 'customers', 'progress', 'reports'],
  SALON:             ['appointments', 'pos', 'inventory', 'invoicing', 'customers', 'reports'],
  CLINIC:            ['appointments', 'invoicing', 'customers', 'reports'],
  RESTAURANT:        ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  MALL:              ['lease', 'invoicing', 'customers', 'reports'],
  FREELANCER:        ['invoicing', 'customers', 'reports'],
  WORKSHOP:          ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  OTHER:             ['pos', 'inventory', 'invoicing', 'customers', 'reports'],

  // ── Retail & Commerce ─────────────────────────────────────────────────────
  MEDICAL_STORE:     ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  STATIONARY:        ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  SWEET_SHOP:        ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  BAKERY:            ['pos', 'inventory', 'appointments', 'invoicing', 'customers', 'reports'],
  JEWELLERY:         ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  HARDWARE:          ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  ELECTRICAL:        ['pos', 'inventory', 'appointments', 'invoicing', 'customers', 'reports'],
  CLOTHING:          ['pos', 'inventory', 'appointments', 'invoicing', 'customers', 'reports'],
  FOOTWEAR:          ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  ELECTRONICS:       ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  MOBILE_REPAIR:     ['pos', 'inventory', 'appointments', 'invoicing', 'customers', 'reports'],
  OPTICAL:           ['pos', 'inventory', 'appointments', 'invoicing', 'customers', 'reports'],
  BOOKSTORE:         ['pos', 'inventory', 'fees', 'invoicing', 'customers', 'reports'],
  FLORIST:           ['pos', 'inventory', 'appointments', 'invoicing', 'customers', 'reports'],

  // ── Food & Beverage ───────────────────────────────────────────────────────
  DHABA:             ['pos', 'inventory', 'customers', 'reports'],
  CATERING:          ['appointments', 'inventory', 'invoicing', 'customers', 'reports'],
  CLOUD_KITCHEN:     ['pos', 'inventory', 'customers', 'reports'],
  JUICE_BAR:         ['pos', 'inventory', 'customers', 'reports'],
  CANTEEN_MESS:      ['pos', 'fees', 'inventory', 'customers', 'reports'],

  // ── Events & Functions ────────────────────────────────────────────────────
  EVENT_PLANNER:     ['appointments', 'invoicing', 'customers', 'reports'],
  DECORATOR:         ['appointments', 'inventory', 'invoicing', 'customers', 'reports'],
  TENT_HOUSE:        ['appointments', 'inventory', 'invoicing', 'customers', 'reports'],

  // ── Healthcare ────────────────────────────────────────────────────────────
  DENTAL:            ['appointments', 'inventory', 'invoicing', 'customers', 'reports'],
  DIAGNOSTIC_LAB:    ['appointments', 'invoicing', 'customers', 'reports'],
  PHYSIOTHERAPY:     ['appointments', 'fees', 'invoicing', 'customers', 'reports'],
  AYURVEDA:          ['appointments', 'inventory', 'invoicing', 'customers', 'reports'],
  HOSPITAL:          ['appointments', 'inventory', 'invoicing', 'customers', 'reports'],
  VET_CLINIC:        ['pos', 'inventory', 'appointments', 'invoicing', 'customers', 'reports'],

  // ── Fitness & Sports (SYL-BC-FIT) ─────────────────────────────────────────
  GYM:               ['fees', 'appointments', 'membershipplans', 'staff', 'attendance', 'pos', 'inventory', 'customers', 'reports', 'training'],
  SPA:               ['appointments', 'pos', 'inventory', 'customers', 'reports'],
  YOGA_STUDIO:       ['fees', 'appointments', 'membershipplans', 'staff', 'attendance', 'customers', 'reports'],
  MARTIAL_ARTS:      ['fees', 'appointments', 'membershipplans', 'staff', 'attendance', 'customers', 'reports'],
  SPORTS_ACADEMY:    ['fees', 'appointments', 'membershipplans', 'staff', 'attendance', 'customers', 'reports'],
  SWIMMING_ACADEMY:  ['fees', 'appointments', 'membershipplans', 'staff', 'attendance', 'customers', 'reports'],
  CROSSFIT_STUDIO:   ['fees', 'appointments', 'membershipplans', 'staff', 'attendance', 'pos', 'inventory', 'customers', 'reports', 'training'],

  // ── Beauty & Personal Care ────────────────────────────────────────────────
  BEAUTY_PARLOUR:    ['appointments', 'pos', 'inventory', 'invoicing', 'customers', 'reports'],
  LAUNDRY:           ['pos', 'appointments', 'invoicing', 'customers', 'reports'],
  TAILORING:         ['appointments', 'invoicing', 'customers', 'reports'],
  BARBERSHOP:        ['appointments', 'pos', 'inventory', 'invoicing', 'customers', 'reports'],

  // ── Education ─────────────────────────────────────────────────────────────
  HOME_TUITION:      ['fees', 'customers', 'progress', 'reports'],
  MUSIC_SCHOOL:      ['fees', 'appointments', 'customers', 'progress', 'reports'],
  DANCE_ACADEMY:     ['fees', 'appointments', 'customers', 'progress', 'reports'],
  DRIVING_SCHOOL:    ['fees', 'appointments', 'customers', 'progress', 'reports'],
  COMPUTER_TRAINING: ['fees', 'appointments', 'customers', 'progress', 'reports'],

  // ── Professional Services ──────────────────────────────────────────────────
  CA_FIRM:           ['fees', 'invoicing', 'customers', 'reports'],
  LAW_FIRM:          ['appointments', 'invoicing', 'customers', 'reports'],
  REAL_ESTATE:       ['appointments', 'lease', 'invoicing', 'customers', 'reports'],
  INSURANCE_AGENCY:  ['fees', 'invoicing', 'customers', 'reports'],
  TRAVEL_AGENCY:     ['appointments', 'invoicing', 'customers', 'reports'],
  PHOTOGRAPHY:       ['appointments', 'invoicing', 'customers', 'reports'],
  DIGITAL_AGENCY:    ['invoicing', 'customers', 'reports'],

  // ── Transport & Logistics ──────────────────────────────────────────────────
  CAB_SERVICE:       ['pos', 'invoicing', 'customers', 'reports'],
  TRANSPORT:         ['invoicing', 'customers', 'reports'],
  CAR_RENTAL:        ['appointments', 'invoicing', 'customers', 'reports'],
  COURIER:           ['pos', 'invoicing', 'customers', 'reports'],
  PACKERS_MOVERS:    ['appointments', 'invoicing', 'customers', 'reports'],

  // ── Construction & Design ──────────────────────────────────────────────────
  CONSTRUCTION:      ['invoicing', 'customers', 'reports'],
  INTERIOR_DESIGN:   ['appointments', 'invoicing', 'customers', 'reports'],
  CO_WORKING:        ['lease', 'invoicing', 'customers', 'reports'],

  // ── Trade & Supply (B2B) ───────────────────────────────────────────────────
  DEALER:            ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  SUPPLIER:          ['inventory', 'invoicing', 'customers', 'reports'],
  WHOLESALE:         ['inventory', 'invoicing', 'customers', 'reports'],

  // ── Other Services ─────────────────────────────────────────────────────────
  PEST_CONTROL:      ['appointments', 'invoicing', 'customers', 'reports'],
};

const getProfile = async (tenantId) => {
  return prisma.tenant.findUnique({ where: { id: tenantId } });
};

const updateProfile = async (tenantId, data) => {
  const allowed = [
    'name', 'phone', 'address', 'city', 'state', 'pincode',
    'gstin', 'pan', 'logoUrl', 'currency', 'locale', 'timezone',
    'receiptConfig',
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

const updateLabelConfig = async (tenantId, labels) => {
  if (typeof labels !== 'object' || Array.isArray(labels) || labels === null)
    throw Object.assign(new Error('Invalid label config'), { statusCode: 400 });
  // Sanitise: keys must be route paths (/...), values must be non-empty strings ≤ 40 chars
  const clean = {};
  for (const [k, v] of Object.entries(labels)) {
    if (typeof k === 'string' && k.startsWith('/') && typeof v === 'string' && v.trim().length > 0)
      clean[k] = v.trim().slice(0, 40);
  }
  return prisma.tenant.update({ where: { id: tenantId }, data: { labelConfig: clean } });
};

const updateSidebarConfig = async (tenantId, config) => {
  if (typeof config !== 'object' || Array.isArray(config) || config === null)
    throw Object.assign(new Error('Invalid sidebar config'), { statusCode: 400 });
  return prisma.tenant.update({ where: { id: tenantId }, data: { sidebarConfig: config } });
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

module.exports = { BUSINESS_MODULES, getProfile, updateProfile, getModules, toggleModule, updateSidebarConfig, updateLabelConfig, getStats };
