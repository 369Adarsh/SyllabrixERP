import api from './axios';

const fl = (path, config) => api.get(`/fl/${path}`, config);
const flPost = (path, data) => api.post(`/fl/${path}`, data);
const flPut = (path, data) => api.put(`/fl/${path}`, data);
const flPatch = (path, data) => api.patch(`/fl/${path}`, data);
const flDel = (path) => api.delete(`/fl/${path}`);

// Jobs
export const createJob = (data) => flPost('jobs', data);
export const listJobs = (params) => fl('jobs', { params });
export const getJob = (id) => fl(`jobs/${id}`);
export const updateJob = (id, data) => flPut(`jobs/${id}`, data);
export const updateJobStatus = (id, status) => flPatch(`jobs/${id}/status`, { status });
export const deleteJob = (id) => flDel(`jobs/${id}`);

// Estimates
export const saveEstimate = (jobId, data) => flPost(`jobs/${jobId}/estimate`, data);
export const getEstimate = (jobId) => fl(`jobs/${jobId}/estimate`);

// Materials
export const addMaterial = (jobId, data) => flPost(`jobs/${jobId}/materials`, data);
export const listMaterials = (jobId) => fl(`jobs/${jobId}/materials`);
export const deleteMaterial = (jobId, mid) => flDel(`jobs/${jobId}/materials/${mid}`);

// Payments
export const recordPayment = (jobId, data) => flPost(`jobs/${jobId}/payments`, data);
export const listPayments = (jobId) => fl(`jobs/${jobId}/payments`);

// Helpers
export const createHelper = (data) => flPost('helpers', data);
export const listHelpers = () => fl('helpers');
export const assignHelper = (jobId, data) => flPost(`jobs/${jobId}/helpers`, data);
export const updateJobHelper = (jobId, hid, data) => flPatch(`jobs/${jobId}/helpers/${hid}`, data);

// Partners
export const createPartner = (data) => flPost('partners', data);
export const listPartners = () => fl('partners');

// Clients
export const createClient = (data) => flPost('clients', data);
export const listClients = (params) => fl('clients', { params });
export const getClient = (id) => fl(`clients/${id}`);
export const updateClient = (id, data) => flPut(`clients/${id}`, data);

// Expenses
export const createExpense = (data) => flPost('expenses', data);
export const listExpenses = (params) => fl('expenses', { params });
export const deleteExpense = (id) => flDel(`expenses/${id}`);

// Suppliers
export const createSupplier = (data) => flPost('suppliers', data);
export const listSuppliers = () => fl('suppliers');
export const updateSupplier = (id, data) => flPut(`suppliers/${id}`, data);

// Tools
export const createTool = (data) => flPost('tools', data);
export const listTools = () => fl('tools');
export const updateTool = (id, data) => flPut(`tools/${id}`, data);

// AMC
export const createAMC = (data) => flPost('amc', data);
export const listAMC = () => fl('amc');
export const updateAMC = (id, data) => flPut(`amc/${id}`, data);

// Reports
export const dashboardStats = () => fl('reports/dashboard');
export const monthlyReport = (params) => fl('reports/monthly', { params });
export const pendingPayments = () => fl('reports/pending');
export const jobsReport = () => fl('reports/jobs');
export const financeReport = (params) => fl('reports/finance', { params });

// Settings
export const getSettings = () => fl('settings');
export const updateSettings = (data) => flPatch('settings', data);
