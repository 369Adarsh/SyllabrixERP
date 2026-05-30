const svc = require('./superadmin.service');
const { ok, created } = require('../../utils/response');
const prisma = require('../../config/prisma');

const login = async (req, res, next) => {
  try { ok(res, await svc.login(req.body), 'Logged in'); } catch (e) { next(e); }
};

const getMe = async (req, res, next) => {
  try { ok(res, await svc.getMe(req.saAdmin.adminId)); } catch (e) { next(e); }
};

const getDashboard = async (req, res, next) => {
  try { ok(res, await svc.getDashboard()); } catch (e) { next(e); }
};

const listTenants = async (req, res, next) => {
  try {
    const [tenants, total] = await svc.listTenants(req.query);
    ok(res, { tenants, total, page: Number(req.query.page || 1), limit: Number(req.query.limit || 20) });
  } catch (e) { next(e); }
};

const getTenant = async (req, res, next) => {
  try { ok(res, await svc.getTenant(req.params.id)); } catch (e) { next(e); }
};

const toggleTenant = async (req, res, next) => {
  try { ok(res, await svc.toggleTenant(req.params.id, req.saAdmin.name || 'Admin'), 'Status updated'); } catch (e) { next(e); }
};

const changePlan = async (req, res, next) => {
  try { ok(res, await svc.changePlan(req.params.id, req.body.plan, req.saAdmin.name || 'Admin')); } catch (e) { next(e); }
};

const addNote = async (req, res, next) => {
  try { created(res, await svc.addTenantNote(req.params.id, req.body.content, req.saAdmin.name || 'Admin'), 'Note added'); } catch (e) { next(e); }
};

const terminateTenant = async (req, res, next) => {
  try { ok(res, await svc.terminateTenant(req.params.id, req.saAdmin.name || 'Admin'), 'Tenant terminated and all data erased'); } catch (e) { next(e); }
};

const listRoleRequests = async (req, res, next) => {
  try { ok(res, await svc.listRoleRequests(req.query.status)); } catch (e) { next(e); }
};

const resolveRoleRequest = async (req, res, next) => {
  try { ok(res, await svc.resolveRoleRequest(req.params.id, req.body, req.saAdmin.name || 'Admin')); } catch (e) { next(e); }
};

const getAuditLogs = async (req, res, next) => {
  try { ok(res, await svc.getAuditLogs(req.query)); } catch (e) { next(e); }
};

const listAdmins = async (req, res, next) => {
  try { ok(res, await svc.listAdmins()); } catch (e) { next(e); }
};

const createAdmin = async (req, res, next) => {
  try { created(res, await svc.createAdmin(req.body), 'Admin created'); } catch (e) { next(e); }
};

const listAuditReports = async (req, res, next) => {
  try {
    const { status, priority, assignedTo, tenantId, limit = 100 } = req.query;
    const where = {};
    if (status)     where.status = status;
    if (priority)   where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (tenantId)   where.tenantId = tenantId;
    const reports = await prisma.auditReport.findMany({
      where,
      include: { tenant: { select: { name: true, syllabrixId: true, businessType: true } } },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      take: Number(limit),
    });
    ok(res, reports);
  } catch (e) { next(e); }
};

const patchAuditReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { status, assignedTo, fixNotes } = req.body;
    const data = {};
    if (status !== undefined)     data.status = status;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;
    if (fixNotes !== undefined)   data.fixNotes = fixNotes;
    if (status === 'RESOLVED')    data.resolvedAt = new Date();
    const updated = await prisma.auditReport.update({ where: { reportId }, data });
    await prisma.auditLog.create({
      data: { actorType: 'SUPER_ADMIN', actorId: req.saAdmin.adminId, actorName: req.saAdmin.name || 'Admin', action: 'BUG_REPORT_UPDATE', resource: 'auditReport', resourceId: reportId, details: { status, assignedTo } },
    }).catch(() => {});
    ok(res, updated);
  } catch (e) { next(e); }
};

const getFeatureFlags = async (req, res, next) => {
  try { ok(res, await svc.getFeatureFlags()); } catch (e) { next(e); }
};

const toggleFeatureFlag = async (req, res, next) => {
  try {
    const { moduleKey } = req.params;
    const { isEnabled, reason } = req.body;
    ok(res, await svc.toggleFeatureFlag(moduleKey, isEnabled, reason, req.saAdmin.name || 'Admin'));
  } catch (e) { next(e); }
};

const getTenantModules = async (req, res, next) => {
  try { ok(res, await svc.getTenantModules(req.params.tenantId)); } catch (e) { next(e); }
};

const setTenantModule = async (req, res, next) => {
  try {
    const { tenantId, moduleKey } = req.params;
    const { action } = req.body; // 'enable' | 'disable'
    ok(res, await svc.setTenantModule(tenantId, moduleKey, action, req.saAdmin.name || 'Admin'));
  } catch (e) { next(e); }
};

const getModuleUsage = async (req, res, next) => {
  try { ok(res, await svc.getModuleUsage()); } catch (e) { next(e); }
};

const getRevenue = async (req, res, next) => {
  try { ok(res, await svc.getRevenue()); } catch (e) { next(e); }
};

const getPlansOverview = async (req, res, next) => {
  try { ok(res, await svc.getPlansOverview(req.query)); } catch (e) { next(e); }
};

const getOnboardingPipeline = async (req, res, next) => {
  try { ok(res, await svc.getOnboardingPipeline()); } catch (e) { next(e); }
};

const getPlatformAnalytics = async (req, res, next) => {
  try { ok(res, await svc.getPlatformAnalytics()); } catch (e) { next(e); }
};

const getErrorLogs = async (req, res, next) => {
  try { ok(res, await svc.getErrorLogs(req.query)); } catch (e) { next(e); }
};

const getPlatformHealth = async (req, res, next) => {
  try { ok(res, await svc.getPlatformHealth()); } catch (e) { next(e); }
};

const getMaintenanceWindows = async (req, res, next) => {
  try { ok(res, await svc.getMaintenanceWindows()); } catch (e) { next(e); }
};

const getActiveMaintenance = async (req, res, next) => {
  try { ok(res, await svc.getActiveMaintenance()); } catch (e) { next(e); }
};

const scheduleMaintenance = async (req, res, next) => {
  try {
    const data = { ...req.body, adminName: req.saAdmin?.name || 'Admin' };
    ok(res, await svc.scheduleMaintenance(data), 'Maintenance scheduled');
  } catch (e) { next(e); }
};

const activateMaintenance = async (req, res, next) => {
  try { ok(res, await svc.activateMaintenance(req.params.id, req.saAdmin?.name || 'Admin'), 'Maintenance activated'); } catch (e) { next(e); }
};

const cancelMaintenance = async (req, res, next) => {
  try { ok(res, await svc.cancelMaintenance(req.params.id, req.saAdmin?.name || 'Admin'), 'Maintenance cancelled'); } catch (e) { next(e); }
};

const getSubscriptions = async (req, res, next) => {
  try { ok(res, await svc.getSubscriptions(req.query)); } catch (e) { next(e); }
};

// Plan Builder
const getManagedPlans = async (req, res, next) => {
  try { ok(res, await svc.getManagedPlans()); } catch (e) { next(e); }
};

const createManagedPlan = async (req, res, next) => {
  try { created(res, await svc.createManagedPlan(req.body, req.saAdmin?.name || 'Admin'), 'Plan created'); } catch (e) { next(e); }
};

const updateManagedPlan = async (req, res, next) => {
  try { ok(res, await svc.updateManagedPlan(req.params.id, req.body), 'Plan updated'); } catch (e) { next(e); }
};

const toggleManagedPlan = async (req, res, next) => {
  try { ok(res, await svc.toggleManagedPlan(req.params.id), 'Plan toggled'); } catch (e) { next(e); }
};

const deleteManagedPlan = async (req, res, next) => {
  try { ok(res, await svc.deleteManagedPlan(req.params.id), 'Plan deleted'); } catch (e) { next(e); }
};

const getManagedOffers = async (req, res, next) => {
  try { ok(res, await svc.getManagedOffers()); } catch (e) { next(e); }
};

const createManagedOffer = async (req, res, next) => {
  try { created(res, await svc.createManagedOffer(req.body, req.saAdmin?.name || 'Admin'), 'Offer created'); } catch (e) { next(e); }
};

const updateManagedOffer = async (req, res, next) => {
  try { ok(res, await svc.updateManagedOffer(req.params.id, req.body), 'Offer updated'); } catch (e) { next(e); }
};

const deleteManagedOffer = async (req, res, next) => {
  try { ok(res, await svc.deleteManagedOffer(req.params.id), 'Offer deleted'); } catch (e) { next(e); }
};

const getSettings = async (req, res, next) => {
  try { ok(res, await svc.getSettings()); } catch (e) { next(e); }
};
const saveSettings = async (req, res, next) => {
  try { ok(res, await svc.saveSettings(req.body, req.saAdmin?.name || 'Admin'), 'Settings saved'); } catch (e) { next(e); }
};
const testApiKey = async (req, res, next) => {
  try { ok(res, await svc.testApiKey(req.body)); } catch (e) { next(e); }
};

// ── Nerve Center RBAC ─────────────────────────────────────────────────────────
const listNcRoles  = async (req, res, next) => { try { ok(res, await svc.listNcRoles()); } catch (e) { next(e); } };
const createNcRole = async (req, res, next) => { try { created(res, await svc.createNcRole(req.body), 'Role created'); } catch (e) { next(e); } };
const updateNcRole = async (req, res, next) => { try { ok(res, await svc.updateNcRole(req.params.id, req.body), 'Role updated'); } catch (e) { next(e); } };
const deleteNcRole = async (req, res, next) => { try { ok(res, await svc.deleteNcRole(req.params.id), 'Role deleted'); } catch (e) { next(e); } };
const assignNcRole = async (req, res, next) => { try { ok(res, await svc.assignNcRole(req.params.id, req.body), 'Role assigned'); } catch (e) { next(e); } };

const listGrants  = async (req, res, next) => { try { ok(res, await svc.listGrants(req.params.adminId)); } catch (e) { next(e); } };
const createGrant = async (req, res, next) => { try { created(res, await svc.createGrant(req.params.adminId, req.body, req.saAdmin.adminId), 'Grant created'); } catch (e) { next(e); } };
const revokeGrant = async (req, res, next) => { try { ok(res, await svc.revokeGrant(req.params.grantId, req.saAdmin.adminId), 'Grant revoked'); } catch (e) { next(e); } };
const getMyPermissions = async (req, res, next) => { try { ok(res, await svc.getMyPermissions(req.saAdmin.adminId)); } catch (e) { next(e); } };

// ── Landing Photos CMS ────────────────────────────────────────────────────────
const listLandingPhotos      = async (req, res, next) => { try { ok(res, await svc.listLandingPhotos()); } catch (e) { next(e); } };
const getActiveLandingPhotos = async (req, res, next) => { try { ok(res, await svc.getActiveLandingPhotos()); } catch (e) { next(e); } };

const createLandingPhoto = async (req, res, next) => {
  try {
    if (!req.file) throw Object.assign(new Error('No photo uploaded'), { statusCode: 400 });
    const { altText = '', tag = '', typeName = '', modules: mods = '', bgClass = 'pbg-kirana', rowIndex = 1, sortOrder = 0 } = req.body;
    const photo = await svc.createLandingPhoto({
      filename: req.file.filename,
      altText, tag, typeName, modules: mods, bgClass,
      rowIndex: parseInt(rowIndex) || 1,
      sortOrder: parseInt(sortOrder) || 0,
    });
    created(res, photo, 'Photo uploaded');
  } catch (e) { next(e); }
};

const updateLandingPhoto = async (req, res, next) => {
  try {
    const data = {};
    ['altText', 'tag', 'typeName', 'modules', 'bgClass'].forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    if (req.body.rowIndex  !== undefined) data.rowIndex  = parseInt(req.body.rowIndex);
    if (req.body.sortOrder !== undefined) data.sortOrder = parseInt(req.body.sortOrder);
    if (req.body.isActive  !== undefined) data.isActive  = req.body.isActive === true || req.body.isActive === 'true';
    ok(res, await svc.updateLandingPhoto(req.params.id, data));
  } catch (e) { next(e); }
};

const deleteLandingPhoto   = async (req, res, next) => { try { ok(res, await svc.deleteLandingPhoto(req.params.id), 'Photo deleted'); } catch (e) { next(e); } };
const reorderLandingPhotos = async (req, res, next) => { try { ok(res, await svc.reorderLandingPhotos(req.body.updates), 'Reordered'); } catch (e) { next(e); } };

module.exports = {
  login, getMe, getDashboard,
  listTenants, getTenant, toggleTenant, changePlan, addNote, terminateTenant,
  listRoleRequests, resolveRoleRequest,
  getAuditLogs, listAdmins, createAdmin,
  listAuditReports, patchAuditReport,
  getRevenue, getPlansOverview, getOnboardingPipeline,
  getFeatureFlags, toggleFeatureFlag, getTenantModules, setTenantModule,
  getModuleUsage, getPlatformAnalytics, getErrorLogs, getPlatformHealth,
  getMaintenanceWindows, getActiveMaintenance, scheduleMaintenance, activateMaintenance, cancelMaintenance,
  getSubscriptions,
  getManagedPlans, createManagedPlan, updateManagedPlan, toggleManagedPlan, deleteManagedPlan,
  getManagedOffers, createManagedOffer, updateManagedOffer, deleteManagedOffer,
  getSettings, saveSettings, testApiKey,
  listNcRoles, createNcRole, updateNcRole, deleteNcRole, assignNcRole,
  listGrants, createGrant, revokeGrant, getMyPermissions,
  listLandingPhotos, getActiveLandingPhotos, createLandingPhoto, updateLandingPhoto, deleteLandingPhoto, reorderLandingPhotos,
};
