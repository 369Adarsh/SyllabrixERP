// SYL-BC-PRO-LF02 — LAW_FIRM
export default {
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
