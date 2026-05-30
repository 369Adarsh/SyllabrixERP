// SYL-BC-PRO-RE03 — REAL_ESTATE
export default {
  modules: {
  pos: false,
  inventory: false,
  lease: true
},
  features: {},
  dashboard: {
    kpis: [
        'pendingInvoices',
        'monthlyRevenue',
        'totalClients',
        'activeLeases'
    ],
    quickActions: [
        'newInvoice',
        'newCustomer',
        'newQuotation',
        'newExpense'
    ]
},
};
