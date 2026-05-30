// SYL-BC-FNB-CT02 — CATERING
module.exports = {
  modules: {
  staff: true,
  attendance: true
},
  features: {},
  dashboard: {
    kpis: [
        'upcomingEvents',
        'pendingInvoices',
        'monthlyRevenue',
        'totalCustomers'
    ],
    quickActions: [
        'newInvoice',
        'newQuotation',
        'newCustomer',
        'newExpense'
    ]
},
};
