import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/v1', '/api/platform')
  : 'http://localhost:5000/api/platform';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('saToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('saToken');
      window.location.href = '/platform/login';
    }
    return Promise.reject(err);
  }
);

export default api;
export { api as platformApi };

// Auth
export const saLogin = (data) => api.post('/auth/login', data);
export const saGetMe = () => api.get('/auth/me');

// Dashboard
export const getSAPlatformDashboard = () => api.get('/dashboard');

// Tenants
export const getSATenants = () => api.get('/tenants');
export const getSATenant = (id) => api.get(`/tenants/${id}`);
export const toggleSATenant = (id) => api.patch(`/tenants/${id}/toggle`);
export const changeSATenantPlan = (id, plan) => api.patch(`/tenants/${id}/plan`, { plan });
export const addSATenantNote = (id, note) => api.post(`/tenants/${id}/notes`, { content: note });
export const terminateSATenant = (id) => api.delete(`/tenants/${id}/terminate`);

// Support
export const getSATickets = (params) => api.get('/support/admin', { params });
export const getSATicketStats = () => api.get('/support/admin/stats');
export const getSATicket = (id) => api.get(`/support/admin/${id}`);
export const replySATicket = (id, data) => api.post(`/support/admin/${id}/reply`, data);
export const updateSATicketStatus = (id, status) => api.patch(`/support/admin/${id}/status`, { status });
export const updateSATicketPriority = (id, priority) => api.patch(`/support/admin/${id}/priority`, { priority });

// Compliance
export const getSACompliance = () => api.get('/compliance/admin');
export const getSAComplianceStats = () => api.get('/compliance/admin/stats');
export const updateSACompliance = (tenantId, data) => api.patch(`/compliance/admin/${tenantId}`, data);
export const addSAComplianceFlag = (tenantId, data) => api.post(`/compliance/admin/${tenantId}/flag`, data);
export const removeSAComplianceFlag = (tenantId, flag) => api.delete(`/compliance/admin/${tenantId}/flag/${flag}`);

// Role Requests
export const getSARoleRequests = () => api.get('/role-requests');
export const updateSARoleRequest = (id, data) => api.patch(`/role-requests/${id}`, data);

// Announcements
export const getSAAnnouncements = () => api.get('/announcements/admin');
export const createSAAnnouncement = (data) => api.post('/announcements/admin', data);
export const updateSAAnnouncement = (id, data) => api.put(`/announcements/admin/${id}`, data);
export const publishSAAnnouncement = (id) => api.patch(`/announcements/admin/${id}/publish`);
export const unpublishSAAnnouncement = (id) => api.patch(`/announcements/admin/${id}/unpublish`);
export const deleteSAAnnouncement = (id) => api.delete(`/announcements/admin/${id}`);

// Audit Logs
export const getSAAuditLogs = (params) => api.get('/audit-logs', { params });

// SA Admins
export const getSAAdmins = () => api.get('/admins');
export const createSAAdmin = (data) => api.post('/admins', data);

// Diagnostic Audit Reports (Support Console)
export const getSAAuditReports   = (params) => api.get('/audit-reports', { params });
export const updateSAAuditReport = (reportId, data) => api.patch(`/audit-reports/${reportId}`, data);

// Business Activity Monitor
export const getActivityLogs          = (params) => api.get('/activity', { params });
export const getActivityModuleSummary = (tenantId) => api.get('/activity/module-summary', { params: tenantId ? { tenantId } : {} });
export const getActivityActiveTenants = (hours) => api.get('/activity/active-tenants', { params: hours ? { hours } : {} });

// Growth Wing
export const getSARevenue            = () => api.get('/revenue');
export const getSAPlansOverview      = (params) => api.get('/plans', { params });
export const getSAOnboardingPipeline = () => api.get('/onboarding');

// Platform Control — Feature Flags
export const getSAFeatureFlags          = () => api.get('/feature-flags');
export const toggleSAFeatureFlag        = (moduleKey, isEnabled, reason) => api.patch(`/feature-flags/${moduleKey}`, { isEnabled, reason });
export const getSATenantModules         = (tenantId) => api.get(`/feature-flags/tenant/${tenantId}`);
export const setSATenantModule          = (tenantId, moduleKey, action) => api.patch(`/feature-flags/tenant/${tenantId}/${moduleKey}`, { action });

// Platform Control — Module Usage
export const getSAModuleUsage           = () => api.get('/module-usage');

// Intelligence Wing
export const getSAPlatformAnalytics     = () => api.get('/analytics');
export const getSAErrorLogs             = (params) => api.get('/errors', { params });

// Platform Health
export const getSAPlatformHealth        = () => api.get('/health');

// Maintenance Mode
export const getSAMaintenanceWindows    = () => api.get('/maintenance');
export const getSAActiveMaintenance     = () => api.get('/maintenance/active');
export const scheduleSAMaintenance      = (data) => api.post('/maintenance', data);
export const activateSAMaintenance      = (id) => api.patch(`/maintenance/${id}/activate`);
export const cancelSAMaintenance        = (id) => api.patch(`/maintenance/${id}/cancel`);

// Subscriptions
export const getSASubscriptions         = (params) => api.get('/subscriptions', { params });

// Plan Builder — Plans
export const getSAManagedPlans          = ()       => api.get('/plan-builder/plans');
export const createSAManagedPlan        = (data)   => api.post('/plan-builder/plans', data);
export const updateSAManagedPlan        = (id, data) => api.patch(`/plan-builder/plans/${id}`, data);
export const toggleSAManagedPlan        = (id)     => api.patch(`/plan-builder/plans/${id}/toggle`);
export const deleteSAManagedPlan        = (id)     => api.delete(`/plan-builder/plans/${id}`);

// Plan Builder — Offers
export const getSAManagedOffers         = ()       => api.get('/plan-builder/offers');
export const createSAManagedOffer       = (data)   => api.post('/plan-builder/offers', data);
export const updateSAManagedOffer       = (id, data) => api.patch(`/plan-builder/offers/${id}`, data);
export const deleteSAManagedOffer       = (id)     => api.delete(`/plan-builder/offers/${id}`);

// Business Builder — Categories
export const getBBCategories        = ()       => api.get('/builder/categories');
export const checkBBCategoryCode    = (code)   => api.get('/builder/categories/check-code', { params: { code } });
export const createBBCategory       = (data)   => api.post('/builder/categories', data);
export const updateBBCategory       = (id, d)  => api.patch(`/builder/categories/${id}`, d);

// Business Builder — Business Types
export const getBBTypes             = (p)      => api.get('/builder/business-types', { params: p });
export const getBBType              = (id)     => api.get(`/builder/business-types/${id}`);
export const previewBBTypeCode      = (categoryId, name) => api.get('/builder/business-types/preview-code', { params: { categoryId, name } });
export const checkBBTypeCode        = (code)   => api.get('/builder/business-types/check-code', { params: { code } });
export const createBBType           = (data)   => api.post('/builder/business-types', data);
export const updateBBType           = (id, d)  => api.patch(`/builder/business-types/${id}`, d);
export const deleteBBType           = (id)     => api.delete(`/builder/business-types/${id}`);
export const cloneBBType            = (id)     => api.post(`/builder/business-types/${id}/clone`);
export const setBBModules           = (id, modules) => api.put(`/builder/business-types/${id}/modules`, { modules });
export const publishBBType          = (id)     => api.post(`/builder/business-types/${id}/publish`);
export const unpublishBBType        = (id)     => api.post(`/builder/business-types/${id}/unpublish`);
export const suggestBBRoles         = (id)     => api.get(`/builder/business-types/${id}/suggest-roles`);
export const setBBRoles             = (id, roles) => api.put(`/builder/business-types/${id}/roles`, { roles });
export const saveBBTemplate         = (id, d)  => api.post(`/builder/business-types/${id}/save-template`, d);
export const applyBBTemplate        = (id, templateId) => api.post(`/builder/business-types/${id}/apply-template/${templateId}`);

// Business Builder — Templates
export const getBBTemplates         = ()       => api.get('/builder/templates');
export const deleteBBTemplate       = (id)     => api.delete(`/builder/templates/${id}`);

// Landing Page CMS
// Module Help / Knowledge Base
export const getModuleHelp           = (moduleKey)        => api.get(`/help/${moduleKey}`);
export const upsertModuleHelp        = (moduleKey, lang, data) => api.put(`/help/${moduleKey}/${lang}`, data);
export const deleteModuleHelp        = (moduleKey, lang)  => api.delete(`/help/${moduleKey}/${lang}`);

// Landing Page CMS
export const getLandingPhotos        = ()       => api.get('/landing-photos');
export const createLandingPhoto      = (form)   => api.post('/landing-photos', form, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateLandingPhoto      = (id, d)  => api.patch(`/landing-photos/${id}`, d);
export const deleteLandingPhoto      = (id)     => api.delete(`/landing-photos/${id}`);
export const reorderLandingPhotos    = (updates) => api.patch('/landing-photos/reorder', { updates });

export const seedDemoData            = ()       => api.post('/seed-demo');
export const seedClinicData          = ()       => api.post('/seed-clinic');

// Feature Catalog (Platform Control)
export const getSAFeatures           = (moduleKey)          => api.get('/features', { params: moduleKey ? { moduleKey } : {} });
export const getSAFeatureAdoption    = (moduleKey)          => api.get('/features/adoption', { params: moduleKey ? { moduleKey } : {} });
export const toggleSAFeature         = (featureKey, active) => api.patch(`/features/${featureKey}/toggle`, { isActive: active });

// Nerve Center Roles (Configuration wing)
export const getSANcRoles            = ()       => api.get('/nc-roles');
export const createSANcRole          = (data)   => api.post('/nc-roles', data);
export const updateSANcRole          = (id, d)  => api.patch(`/nc-roles/${id}`, d);
export const deleteNcRole            = (id)     => api.delete(`/nc-roles/${id}`);

// Nerve Center Grants / Admin access (Team wing)
export const getSANcGrants           = (adminId)  => api.get(`/nc-grants/${adminId}`);
export const createNcGrant           = (adminId, data) => api.post(`/nc-grants/${adminId}`, data);
export const revokeNcGrant           = (grantId)  => api.delete(`/nc-grants/${grantId}/revoke`);
export const assignNcRole            = (adminId, roleId) => api.patch(`/nc-roles/${adminId}/assign`, { roleId });

// API Keys / Settings (Configuration wing)
export const getSASettings           = ()         => api.get('/settings');
export const updateSASettings        = (data)     => api.put('/settings', data);
export const testSAApiKey            = (provider, key) => api.post('/settings/test-key', { provider, key });
