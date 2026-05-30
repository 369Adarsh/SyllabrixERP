// SYL-BC-PRO-LF02 — LAW_FIRM
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
        'unpaidAmount'
    ],
    quickActions: [
        'newInvoice',
        'newCustomer',
        'newExpense',
        'newQuotation'
    ]
},
};
