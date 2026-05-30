// SYL-BC-EVT-EP01 — EVENT_PLANNER
module.exports = {
  modules: {
  pos: false,
  inventory: false,
  staff: true
},
  features: {},
  dashboard: {
    kpis: [
        'upcomingEvents',
        'pendingInvoices',
        'monthlyRevenue',
        'totalClients'
    ],
    quickActions: [
        'newInvoice',
        'newQuotation',
        'newCustomer',
        'newExpense'
    ]
},
};
