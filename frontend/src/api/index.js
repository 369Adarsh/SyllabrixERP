import api from './axios';

// Tenant
export const getTenantProfile = () => api.get('/tenant/profile');
export const updateTenantProfile = (data) => api.put('/tenant/profile', data);
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

// Campaigns
export const getCampaigns = () => api.get('/campaigns');
export const createCampaign = (data) => api.post('/campaigns', data);
export const sendCampaign = (id) => api.post(`/campaigns/${id}/send`);
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}`);
export const previewCampaignSegment = (segment) => api.get('/campaigns/preview', { params: { segment } });

// Inventory - Categories
export const getCategories = () => api.get('/inventory/categories');
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
export const getLowStockProducts = () => api.get('/inventory/products/low-stock');
export const getTaxRates = () => api.get('/inventory/tax-rates');
export const createTaxRate = (data) => api.post('/inventory/tax-rates', data);

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
export const collectFee = (id, data) => api.post(`/fees/${id}/collect`, data);
export const waiveFee = (id, notes) => api.patch(`/fees/${id}/waive`, { notes });
export const getOverdueFees = () => api.get('/fees/overdue');

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
export const getDashboard = () => api.get('/reports/dashboard');
export const getSalesReport = (params) => api.get('/reports/sales', { params });
export const getInvoiceReport = (params) => api.get('/reports/invoices', { params });
export const getTopProducts = (params) => api.get('/reports/top-products', { params });
export const getTopCustomers = (params) => api.get('/reports/top-customers', { params });

// AI
export const aiChat = (data) => api.post('/ai/chat', data);
export const getAiInsights = () => api.get('/ai/insights');

// Vendors
export const getVendors = (params) => api.get('/vendors/vendors', { params });
export const getVendor = (id) => api.get(`/vendors/vendors/${id}`);
export const createVendor = (data) => api.post('/vendors/vendors', data);
export const updateVendor = (id, data) => api.put(`/vendors/vendors/${id}`, data);
export const deleteVendor = (id) => api.delete(`/vendors/vendors/${id}`);

// Purchase Orders
export const getPurchaseOrders = (params) => api.get('/vendors/purchase-orders', { params });
export const createPurchaseOrder = (data) => api.post('/vendors/purchase-orders', data);
export const receivePurchaseOrder = (id) => api.patch(`/vendors/purchase-orders/${id}/receive`);
export const cancelPurchaseOrder = (id) => api.patch(`/vendors/purchase-orders/${id}/cancel`);

// Expenses
export const getExpenses = (params) => api.get('/expenses', { params });
export const getExpenseSummary = (params) => api.get('/expenses/summary', { params });
export const createExpense = (data) => api.post('/expenses', data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

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
export const getStaff = () => api.get('/staff');
export const createStaff = (data) => api.post('/staff', data);
export const updateStaff = (id, data) => api.put(`/staff/${id}`, data);
export const deleteStaff = (id) => api.delete(`/staff/${id}`);
export const toggleStaffActive = (id) => api.patch(`/staff/${id}/toggle`);

// Attendance
export const getTodayAttendance = () => api.get('/attendance/today');
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
export const getBillsSummary = () => api.get('/bills/summary');

// Bank Accounts
export const getBankAccounts = () => api.get('/accounts');
export const createBankAccount = (data) => api.post('/accounts', data);
export const updateBankAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteBankAccount = (id) => api.delete(`/accounts/${id}`);
export const getAccountTransactions = (id, params) => api.get(`/accounts/${id}/transactions`, { params });
export const addBankTransaction = (id, data) => api.post(`/accounts/${id}/transactions`, data);
export const getTotalBalance = () => api.get('/accounts/balance');

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
export const getGstr1 = (params) => api.get('/reports/gstr1', { params });

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
