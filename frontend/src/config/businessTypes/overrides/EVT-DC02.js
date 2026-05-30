// SYL-BC-EVT-DC02 — DECORATOR
export default {
  modules: {
  pos: false,
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
