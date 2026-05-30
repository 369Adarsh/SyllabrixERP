// SYL-BC-TRN-PM05 — PACKERS_MOVERS
module.exports = {
  modules: {
  pos: false,
  inventory: false,
  staff: true
},
  features: {},
  dashboard: {
    kpis: [
        'pendingJobs',
        'monthlyRevenue',
        'totalCustomers',
        'pendingPayments'
    ],
    quickActions: [
        'newInvoice',
        'newQuotation',
        'newCustomer',
        'newExpense'
    ]
},
};
