// SYL-BC-TRN-PM05 — PACKERS_MOVERS
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
