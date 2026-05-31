import api from './axios';

// Tenant
export const getTenantProfile = () => api.get('/tenant/profile');
export const updateTenantProfile = (data) => api.put('/tenant/profile', data);
export const uploadBusinessLogo = (formData) => api.post('/tenant/logo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const getTenantModules = () => api.get('/tenant/modules');
export const getTenantStats = () => api.get('/tenant/stats');

// Users
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const changePassword = (data) => api.post('/users/change-password', data);

// Customers
export const getCustomers = (params) => api.get('/customers', { params });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
export const adjustCustomerCredit = (id, data) => api.patch(`/customers/${id}/credit`, data);

// Customer Subscriptions
export const getSubscriptions = (customerId) => api.get(`/customers/${customerId}/subscriptions`);
export const createSubscription = (customerId, data) => api.post(`/customers/${customerId}/subscriptions`, data);
export const updateSubscriptionStatus = (customerId, subId, status) => api.patch(`/customers/${customerId}/subscriptions/${subId}/status`, { status });
export const sendSubscriptionReminder = (customerId, subId) => api.post(`/customers/${customerId}/subscriptions/${subId}/remind`);
export const deleteSubscription = (customerId, subId) => api.delete(`/customers/${customerId}/subscriptions/${subId}`);

// Membership Plans
export const getMembershipPlans = () => api.get('/membership-plans');
export const createMembershipPlan = (data) => api.post('/membership-plans', data);
export const updateMembershipPlan = (id, data) => api.put(`/membership-plans/${id}`, data);
export const deleteMembershipPlan = (id) => api.delete(`/membership-plans/${id}`);
export const toggleMembershipPlan = (id) => api.patch(`/membership-plans/${id}/toggle`);

// Campaigns
export const getCampaigns = () => api.get('/campaigns');
export const createCampaign = (data) => api.post('/campaigns', data);
export const sendCampaign = (id) => api.post(`/campaigns/${id}/send`);
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}`);
export const previewCampaignSegment = (segment) => api.get('/campaigns/preview', { params: { segment } });
export const getCampaignRecipients = (id) => api.get(`/campaigns/${id}/recipients`);
export const markCampaignSent = (id, data) => api.patch(`/campaigns/${id}/mark-sent`, data);
export const getSegmentCustomers = (segment) => api.get('/campaigns/segment-customers', { params: { segment } });

// Inventory - Categories
export const getCategories = () => api.get('/inventory/categories');
export const getCategoryReport = () => api.get('/inventory/categories/report');
export const seedStandardCategories = () => api.post('/inventory/categories/seed-standard');
export const deduplicateCategories = () => api.post('/inventory/categories/deduplicate');
export const createCategory = (data) => api.post('/inventory/categories', data);
export const updateCategory = (id, data) => api.put(`/inventory/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/inventory/categories/${id}`);

// Inventory - Products
export const getProducts = (params) => api.get('/inventory/products', { params });
export const getProduct = (id) => api.get(`/inventory/products/${id}`);
export const createProduct = (data) => api.post('/inventory/products', data);
export const updateProduct = (id, data) => api.put(`/inventory/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/inventory/products/${id}`);
export const adjustStock = (id, data) => api.post(`/inventory/products/${id}/stock`, data);
export const getStockMovements = (id) => api.get(`/inventory/products/${id}/movements`);
export const getAllStockMovements = () => api.get('/inventory/movements');
export const getLowStockProducts = () => api.get('/inventory/products/low-stock');
export const getTaxRates = () => api.get('/inventory/tax-rates');
export const createTaxRate = (data) => api.post('/inventory/tax-rates', data);
export const deleteTaxRate = (id) => api.delete(`/inventory/tax-rates/${id}`);

// POS
export const createSale = (data) => api.post('/pos/sale', data);
export const getTransactions = (params) => api.get('/pos/transactions', { params });
export const getTransaction = (id) => api.get(`/pos/transactions/${id}`);

// Invoicing
export const getInvoices = (params) => api.get('/invoices', { params });
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const createInvoice = (data) => api.post('/invoices', data);
export const updateInvoiceStatus = (id, status) => api.patch(`/invoices/${id}/status`, { status });
export const recordPayment = (id, data) => api.post(`/invoices/${id}/payments`, data);
export const cancelInvoice = (id) => api.delete(`/invoices/${id}`);
export const createPaymentLink = (id) => api.post(`/invoices/${id}/payment-link`);

// Appointments
export const getServices = () => api.get('/appointments/services');
export const createService = (data) => api.post('/appointments/services', data);
export const updateService = (id, data) => api.put(`/appointments/services/${id}`, data);
export const getAppointments = (params) => api.get('/appointments', { params });
export const getAppointment = (id) => api.get(`/appointments/${id}`);
export const createAppointment = (data) => api.post('/appointments', data);
export const updateAppointment = (id, data) => api.put(`/appointments/${id}`, data);
export const updateAppointmentStatus = (id, status) => api.patch(`/appointments/${id}/status`, { status });
export const cancelAppointment = (id) => api.delete(`/appointments/${id}`);

// Fees
export const getStudents = (params) => api.get('/fees/students', { params });
export const getStudent = (id) => api.get(`/fees/students/${id}`);
export const createStudent = (data) => api.post('/fees/students', data);
export const updateStudent = (id, data) => api.put(`/fees/students/${id}`, data);
export const getFees = (params) => api.get('/fees', { params });
export const createFee = (data) => api.post('/fees', data);
export const updateFee = (id, data) => api.put(`/fees/${id}`, data);
export const collectFee = (id, data) => api.post(`/fees/${id}/collect`, data);
export const waiveFee = (id, notes) => api.patch(`/fees/${id}/waive`, { notes });
export const getOverdueFees = () => api.get('/fees/overdue');

// Progress & Homework
export const getHomework = (params) => api.get('/progress/homework', { params });
export const createHomework = (data) => api.post('/progress/homework', data);
export const deleteHomework = (id) => api.delete(`/progress/homework/${id}`);
export const updateHomeworkSubmission = (hwId, studentId, data) => api.patch(`/progress/homework/${hwId}/submissions/${studentId}`, data);
export const bulkUpdateSubmissions = (hwId, updates) => api.post(`/progress/homework/${hwId}/bulk`, { updates });
export const getTeachingLogs = (params) => api.get('/progress/teaching-log', { params });
export const createTeachingLog = (data) => api.post('/progress/teaching-log', data);
export const deleteTeachingLog = (id) => api.delete(`/progress/teaching-log/${id}`);
export const getStudentProgress = () => api.get('/progress/student-progress');

// Exams
export const getExams = () => api.get('/progress/exams');
export const createExam = (data) => api.post('/progress/exams', data);
export const updateExam = (id, data) => api.put(`/progress/exams/${id}`, data);
export const deleteExam = (id) => api.delete(`/progress/exams/${id}`);
export const upsertStudentPrep = (examId, studentId, data) => api.put(`/progress/exams/${examId}/prep/${studentId}`, data);

// Lease
export const getLeaseUnits = () => api.get('/lease/units');
export const createLeaseUnit = (data) => api.post('/lease/units', data);
export const getLeases = (params) => api.get('/lease', { params });
export const getLease = (id) => api.get(`/lease/${id}`);
export const createLease = (data) => api.post('/lease', data);
export const updateLease = (id, data) => api.put(`/lease/${id}`, data);
export const terminateLease = (id) => api.patch(`/lease/${id}/terminate`);
export const getRentDue = () => api.get('/lease/rent-due');

// Reports
export const getDashboard = (params) => api.get('/reports/dashboard', { params });
export const getSalesReport = (params) => api.get('/reports/sales', { params });
export const getInvoiceReport = (params) => api.get('/reports/invoices', { params });
export const getTopProducts = (params) => api.get('/reports/top-products', { params });
export const getTopCustomers = (params) => api.get('/reports/top-customers', { params });
export const getDemandTrends = (params) => api.get('/reports/demand-trends', { params });

// AI
export const aiChat = (data) => api.post('/ai/chat', data);
export const getAiInsights = () => api.get('/ai/insights');
// Diagnostic reports
export const submitAuditReport = (data) => api.post('/ai/reports', data);
export const getMyAuditReports = () => api.get('/ai/reports/mine');
// Syllabrix support console
export const getAllAuditReports = (params) => api.get('/ai/reports/all', { params });
export const updateAuditReport = (reportId, data) => api.patch(`/ai/reports/${reportId}`, data);

// Vendors
export const getVendors = (params) => api.get('/vendors/vendors', { params });
export const getVendor = (id) => api.get(`/vendors/vendors/${id}`);
export const createVendor = (data) => api.post('/vendors/vendors', data);
export const updateVendor = (id, data) => api.put(`/vendors/vendors/${id}`, data);
export const deleteVendor = (id) => api.delete(`/vendors/vendors/${id}`);

// Vendor Catalog
export const getVendorCatalog = (vendorId) => api.get(`/vendors/vendors/${vendorId}/catalog`);
export const addVendorCatalogItem = (vendorId, data) => api.post(`/vendors/vendors/${vendorId}/catalog`, data);
export const updateVendorCatalogItem = (id, data) => api.put(`/vendors/catalog/${id}`, data);
export const deleteVendorCatalogItem = (id) => api.delete(`/vendors/catalog/${id}`);
export const getReorderSuggestions = () => api.get('/vendors/reorder-suggestions');

// Purchase Orders (vendors module)
export const getPurchaseOrders = (params) => api.get('/vendors/purchase-orders', { params });
export const getPurchaseOrder = (id) => api.get(`/vendors/purchase-orders/${id}`);
export const createPurchaseOrder = (data) => api.post('/vendors/purchase-orders', data);
export const updatePurchaseOrder = (id, data) => api.put(`/vendors/purchase-orders/${id}`, data);
export const deletePurchaseOrder = (id) => api.delete(`/vendors/purchase-orders/${id}`);
export const receivePurchaseOrder = (id, items) => api.post(`/vendors/purchase-orders/${id}/receive`, { items });
export const cancelPurchaseOrder = (id) => api.patch(`/vendors/purchase-orders/${id}/cancel`);

// Goods Receipt Notes
export const listGRNs = (params) => api.get('/vendors/grns', { params });
export const getGRN = (id) => api.get(`/vendors/grns/${id}`);
export const createGRN = (poId) => api.post('/vendors/grns', { poId });
export const confirmGRN = (id, data) => api.post(`/vendors/grns/${id}/confirm`, data);
export const getGRNVariance = (id) => api.get(`/vendors/grns/${id}/variance`);

// Expenses
export const getExpenses = (params) => api.get('/expenses', { params });
export const getExpenseSummary = (params) => api.get('/expenses/summary', { params });
export const createExpense = (data) => api.post('/expenses', data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
export const uploadExpenseReceipt = (id, file) => {
  const fd = new FormData();
  fd.append('receipt', file);
  return api.post(`/expenses/${id}/receipt`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const removeExpenseReceipt = (id) => api.delete(`/expenses/${id}/receipt`);

// Assets
export const getAssetSummary = () => api.get('/assets/summary');
export const getAssetCategories = () => api.get('/assets/categories');
export const createAssetCategory = (data) => api.post('/assets/categories', data);
export const updateAssetCategory = (id, data) => api.put(`/assets/categories/${id}`, data);
export const deleteAssetCategory = (id) => api.delete(`/assets/categories/${id}`);
export const getAssets = (params) => api.get('/assets', { params });
export const getAsset = (id) => api.get(`/assets/${id}`);
export const createAsset = (data) => api.post('/assets', data);
export const updateAsset = (id, data) => api.put(`/assets/${id}`, data);
export const disposeAsset = (id, data) => api.patch(`/assets/${id}/dispose`, data);
export const deleteAsset = (id) => api.delete(`/assets/${id}`);
export const getAssetMaintenance = (id) => api.get(`/assets/${id}/maintenance`);
export const logAssetMaintenance = (id, data) => api.post(`/assets/${id}/maintenance`, data);

// Staff
export const getStaff = (params) => api.get('/staff', { params });
export const createStaff = (data) => api.post('/staff', data);
export const updateStaff = (id, data) => api.put(`/staff/${id}`, data);
export const deleteStaff = (id) => api.delete(`/staff/${id}`);
export const toggleStaffActive = (id) => api.patch(`/staff/${id}/toggle`);

// Attendance
export const getTodayAttendance = (params) => api.get('/attendance/today', { params });
export const punchIn = (data) => api.post('/attendance/in', data);
export const punchOut = (data) => api.post('/attendance/out', data);
export const getAttendanceReport = (params) => api.get('/attendance/report', { params });
export const getAttendanceSummary = (params) => api.get('/attendance/summary', { params });

// Auth (unauthenticated)
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

// Expiry
export const getExpiringProducts = (days = 30) => api.get('/inventory/products/expiring', { params: { days } });

// Vendor Bills (Accounts Payable)
export const getBills = (params) => api.get('/bills', { params });
export const getBill = (id) => api.get(`/bills/${id}`);
export const createBill = (data) => api.post('/bills', data);
export const payBill = (id, data) => api.post(`/bills/${id}/pay`, data);
export const cancelBill = (id) => api.delete(`/bills/${id}`);
export const getBillsSummary = (params) => api.get('/bills/summary', { params });

// Bank Accounts
export const getBankAccounts = () => api.get('/accounts');
export const createBankAccount = (data) => api.post('/accounts', data);
export const updateBankAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteBankAccount = (id) => api.delete(`/accounts/${id}`);
export const getAccountTransactions = (id, params) => api.get(`/accounts/${id}/transactions`, { params });
export const addBankTransaction = (id, data) => api.post(`/accounts/${id}/transactions`, data);
export const getTotalBalance = () => api.get('/accounts/balance');

// Returns / Refunds
export const getReturns = (params) => api.get('/returns', { params });
export const getReturnsSummary = (params) => api.get('/returns/summary', { params });
export const createReturn = (data) => api.post('/returns', data);
export const lookupInvoiceForReturn = (invoiceNumber) => api.get(`/returns/lookup/invoice/${encodeURIComponent(invoiceNumber)}`);
export const lookupReceiptForReturn = (receiptNumber) => api.get(`/returns/lookup/receipt/${encodeURIComponent(receiptNumber)}`);

// Credit Notes
export const getCreditNotes = (params) => api.get('/credit-notes', { params });
export const getCreditNote = (id) => api.get(`/credit-notes/${id}`);
export const createCreditNote = (data) => api.post('/credit-notes', data);
export const updateCreditNoteStatus = (id, status) => api.patch(`/credit-notes/${id}/status`, { status });

// Quotations
export const getQuotations = (params) => api.get('/quotations', { params });
export const getQuotation = (id) => api.get(`/quotations/${id}`);
export const createQuotation = (data) => api.post('/quotations', data);
export const updateQuotationStatus = (id, status) => api.patch(`/quotations/${id}/status`, { status });
export const convertQuotationToInvoice = (id) => api.post(`/quotations/${id}/convert`);

// Payroll
export const getPayrollRuns = () => api.get('/payroll');
export const getPayrollRun = (id) => api.get(`/payroll/${id}`);
export const processPayroll = (month, year) => api.post('/payroll/process', { month, year });
export const markPayrollPaid = (id) => api.patch(`/payroll/${id}/paid`);

// Finance Reports
export const getProfitLoss = (params) => api.get('/reports/pl', { params });
export const getCashFlow = (params) => api.get('/reports/cash-flow', { params });
export const getGstr1         = (params) => api.get('/reports/gstr1',          { params });
export const getGstr3b        = (params) => api.get('/reports/gstr3b',         { params });
export const getBalanceSheet  = (params) => api.get('/reports/balance-sheet', { params });
export const getTdsReport     = (params) => api.get('/reports/tds',            { params });
export const getCashBook      = (params) => api.get('/reports/cash-book',      { params });
export const getCreditorAging = (params) => api.get('/reports/creditor-aging', { params });

// Recurring Invoices
export const getRecurringInvoices = () => api.get('/recurring-invoices');
export const createRecurringInvoice = (data) => api.post('/recurring-invoices', data);
export const updateRecurringInvoice = (id, data) => api.put(`/recurring-invoices/${id}`, data);
export const toggleRecurringInvoice = (id) => api.patch(`/recurring-invoices/${id}/toggle`);
export const deleteRecurringInvoice = (id) => api.delete(`/recurring-invoices/${id}`);
export const generateDueInvoices = () => api.post('/recurring-invoices/generate');

// WhatsApp
export const getWAConversations = () => api.get('/whatsapp/conversations');
export const getWAThread = (phone) => api.get(`/whatsapp/conversations/${phone}`);
export const sendWAMessage = (data) => api.post('/whatsapp/send', data);
export const sendWAInvoice = (invoiceId) => api.post(`/whatsapp/send-invoice/${invoiceId}`);
export const sendWAAppointmentReminder = (id) => api.post(`/whatsapp/send-appointment-reminder/${id}`);
export const sendWAFeeReminder = (id) => api.post(`/whatsapp/send-fee-reminder/${id}`);
export const sendWARentReminder = (id) => api.post(`/whatsapp/send-rent-reminder/${id}`);
export const bulkWAFeeReminders = () => api.post('/whatsapp/bulk-fee-reminders');


// Role Requests
export const getRoleRequests = () => api.get('/role-requests');
export const createRoleRequest = (data) => api.post('/role-requests', data);

// Support Tickets (tenant-facing)
export const getMyTickets = (params) => api.get('/support/my', { params });
export const getMyTicket = (id) => api.get(`/support/my/${id}`);
export const createTicket = (data) => api.post('/support/my', data);
export const replyToTicket = (id, content) => api.post(`/support/my/${id}/reply`, { content });
export const closeTicket = (id) => api.patch(`/support/my/${id}/close`);

// Compliance (tenant-facing)
export const getMyCompliance = () => api.get('/compliance/my');
export const submitKyc = (data) => api.post('/compliance/my/kyc', data);

// Announcements (tenant-facing)
export const getAnnouncements = () => api.get('/announcements/my');

// Platform maintenance (public — no auth required)
export const getActiveMaintenance = () => api.get('/maintenance/active');

// B2B Marketplace
export const getMyDisplayCatalog = () => api.get('/b2b/display-catalog');
export const addDisplayCatalogItem = (data) => api.post('/b2b/display-catalog', data);
export const updateDisplayCatalogItem = (id, data) => api.put(`/b2b/display-catalog/${id}`, data);
export const deleteDisplayCatalogItem = (id) => api.delete(`/b2b/display-catalog/${id}`);

export const searchSuppliers = (q) => api.get('/b2b/suppliers/search', { params: { q } });
export const getLocalSuppliers = () => api.get('/b2b/suppliers/local');
export const getSupplierProfile = (supplierTenantId) => api.get(`/b2b/suppliers/${supplierTenantId}/profile`);
export const getSupplierRatings = (supplierTenantId) => api.get(`/b2b/suppliers/${supplierTenantId}/ratings`);

export const getMyPartnerships = () => api.get('/b2b/partnerships');
export const sendPartnerRequest = (data) => api.post('/b2b/partnerships', data);
export const respondToPartnerRequest = (id, accept, paymentPrefs) => api.patch(`/b2b/partnerships/${id}/respond`, { accept, paymentPrefs });
export const setPartnershipTerms = (id, data) => api.patch(`/b2b/partnerships/${id}/terms`, data);

export const ratePartner = (targetTenantId, data) => api.post(`/b2b/ratings/${targetTenantId}`, data);

export const getSupplierCatalog = (supplierTenantId) => api.get(`/b2b/suppliers/${supplierTenantId}/catalog`);

export const getMyNegotiations = () => api.get('/b2b/negotiations');
export const requestBestPrice = (data) => api.post('/b2b/negotiations', data);
export const respondToNegotiation = (id, data) => api.patch(`/b2b/negotiations/${id}/respond`, data);

// Branches
export const getBranches       = ()          => api.get('/branches');
export const getBranch         = (id)        => api.get(`/branches/${id}`);
export const createBranch      = (data)      => api.post('/branches', data);
export const updateBranch      = (id, data)  => api.put(`/branches/${id}`, data);
export const toggleBranch      = (id)        => api.patch(`/branches/${id}/toggle`);
export const getStockNetwork   = ()          => api.get('/branches/stock-network');

// Stock Transfers
export const getStockTransfers      = (params) => api.get('/stock-transfers', { params });
export const getStockTransfer       = (id)     => api.get(`/stock-transfers/${id}`);
export const createStockTransfer    = (data)   => api.post('/stock-transfers', data);
export const approveStockTransfer   = (id)     => api.patch(`/stock-transfers/${id}/approve`);
export const markTransferInTransit  = (id)     => api.patch(`/stock-transfers/${id}/in-transit`);
export const receiveStockTransfer   = (id)     => api.patch(`/stock-transfers/${id}/receive`);
export const cancelStockTransfer    = (id)     => api.patch(`/stock-transfers/${id}/cancel`);
export const getSurplusSuggestion   = (productId, qty) => api.get('/stock-transfers/suggest', { params: { productId, qty } });

// Automation
export const getAutomationConfig = () => api.get('/automation/config');
export const saveAutomationConfig = (data) => api.put('/automation/config', data);
export const getPendingActions = () => api.get('/automation/pending-actions');
export const getDailySummary = () => api.get('/automation/daily-summary');
export const sendDailyDigest = () => api.post('/automation/send-digest');
export const getDigestPreview = () => api.get('/automation/digest-preview');


// Training Plans
export const getTrainingStats    = (params) => api.get('/training/stats', { params });
export const getTrainingActivity = (params) => api.get('/training/activity', { params });
// Exercises
export const getExercises    = () => api.get('/training/exercises');
export const seedExercises   = () => api.post('/training/exercises/seed');
export const createExercise  = (data) => api.post('/training/exercises', data);
export const updateExercise  = (id, data) => api.put(`/training/exercises/${id}`, data);
export const deleteExercise  = (id) => api.delete(`/training/exercises/${id}`);
// Templates
export const getTemplates    = () => api.get('/training/templates');
export const getTemplate     = (id) => api.get(`/training/templates/${id}`);
export const createTemplate  = (data) => api.post('/training/templates', data);
export const updateTemplate  = (id, data) => api.put(`/training/templates/${id}`, data);
export const deleteTemplate  = (id) => api.delete(`/training/templates/${id}`);
// Template Days
export const addTemplateDay       = (templateId, data) => api.post(`/training/templates/${templateId}/days`, data);
export const updateTemplateDay    = (templateId, dayId, data) => api.put(`/training/templates/${templateId}/days/${dayId}`, data);
export const deleteTemplateDay    = (templateId, dayId) => api.delete(`/training/templates/${templateId}/days/${dayId}`);
export const addExerciseToDay     = (templateId, dayId, data) => api.post(`/training/templates/${templateId}/days/${dayId}/exercises`, data);
export const updateDayExercise    = (templateId, dayId, exId, data) => api.put(`/training/templates/${templateId}/days/${dayId}/exercises/${exId}`, data);
export const removeDayExercise    = (templateId, dayId, exId) => api.delete(`/training/templates/${templateId}/days/${dayId}/exercises/${exId}`);
// Member Plans
export const getMemberPlans    = (params) => api.get('/training/member-plans', { params });
export const assignMemberPlan  = (data) => api.post('/training/member-plans', data);
export const updateMemberPlan  = (id, data) => api.put(`/training/member-plans/${id}`, data);
export const deleteMemberPlan  = (id) => api.delete(`/training/member-plans/${id}`);
// Sessions
export const getPlanSessions = (planId) => api.get(`/training/member-plans/${planId}/sessions`);
export const logWorkoutSession = (planId, data) => api.post(`/training/member-plans/${planId}/sessions`, data);
// Member card
export const getMemberCard = (memberId) => api.get(`/training/member-card/${memberId}`);
// Body stats
export const getMemberBodyStats = (memberId) => api.get(`/training/body-stats/${memberId}`);
export const addMemberBodyStats = (data) => api.post('/training/body-stats', data);
// Trainer notes
export const getMemberTrainerNotes = (memberId) => api.get(`/training/trainer-notes/${memberId}`);
export const addMemberTrainerNote  = (data) => api.post('/training/trainer-notes', data);
// Trainer board & performance
export const getTrainerBoard       = (params) => api.get('/training/trainer-board', { params });
export const getTrainerPerformance = () => api.get('/training/trainer-performance');


// Module Features
export const getModuleFeatures       = (moduleKey, params) => api.get(`/features/${moduleKey}`, { params });
export const getModuleFeatureMap     = (moduleKey, params) => api.get(`/features/${moduleKey}/map`, { params });
export const getCompanyFeatures      = (moduleKey) => api.get(`/features/${moduleKey}/company`);
export const setCompanyFeature       = (moduleKey, data) => api.patch(`/features/${moduleKey}/company`, data);
export const getBranchFeatures       = (moduleKey, branchId) => api.get(`/features/${moduleKey}/branch/${branchId}`);
export const setBranchFeature        = (moduleKey, branchId, data) => api.patch(`/features/${moduleKey}/branch/${branchId}`, data);

// Module Help / Knowledge Base
export const getModuleHelpPublic = (moduleKey, lang = 'en') => api.get(`/help/${moduleKey}`, { params: { lang } });

// Member Receipts
export const createMemberReceipt = (data) => api.post('/receipts', data);
export const getMemberReceipts = (params) => api.get('/receipts', { params });
export const getMemberReceiptsSummary = (params) => api.get('/receipts/summary', { params });
export const backfillMemberReceipts = () => api.post('/receipts/backfill');
export const updateReceiptPayment = (id, paymentMethod) => api.patch(`/receipts/${id}/payment`, { paymentMethod });
