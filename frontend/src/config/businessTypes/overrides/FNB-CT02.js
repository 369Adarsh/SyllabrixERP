// SYL-BC-FNB-CT02 — CATERING
export default {
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
