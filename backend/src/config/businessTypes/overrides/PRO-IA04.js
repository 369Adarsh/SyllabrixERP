// SYL-BC-PRO-IA04 — INSURANCE_AGENCY
module.exports = {
  modules: {
  pos: false,
  inventory: false
},
  features: {},
  dashboard: {
    kpis: [
        'pendingInvoices',
        'monthlyEarnings',
        'totalClients',
        'renewalsDue'
    ],
    quickActions: [
        'newInvoice',
        'newCustomer',
        'newExpense',
        'newQuotation'
    ]
},
};
