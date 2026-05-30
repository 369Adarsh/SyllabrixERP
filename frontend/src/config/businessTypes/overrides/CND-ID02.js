// SYL-BC-CND-ID02 — INTERIOR_DESIGN
export default {
  modules: {
  pos: false,
  assets: true
},
  features: {},
  dashboard: {
    kpis: [
        'pendingInvoices',
        'monthlyRevenue',
        'totalClients',
        'pendingQuotations'
    ],
    quickActions: [
        'newInvoice',
        'newQuotation',
        'newCustomer',
        'newExpense'
    ]
},
};
