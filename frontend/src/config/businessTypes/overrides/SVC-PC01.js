// SYL-BC-SVC-PC01 — PEST_CONTROL
export default {
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
