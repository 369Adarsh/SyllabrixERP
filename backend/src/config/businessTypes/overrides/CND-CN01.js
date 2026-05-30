// SYL-BC-CND-CN01 — CONSTRUCTION
module.exports = {
  modules: {
  pos: false,
  inventory: false,
  assets: true,
  staff: true,
  attendance: true,
  payroll: true
},
  features: {},
  dashboard: {
    kpis: [
        'pendingInvoices',
        'monthlyRevenue',
        'totalClients',
        'unpaidAmount'
    ],
    quickActions: [
        'newInvoice',
        'newQuotation',
        'newCustomer',
        'newExpense'
    ]
},
};
