// SYL-BC-TRN-TR02 — TRANSPORT
export default {
  modules: {
  pos: false,
  assets: true
},
  features: {},
  dashboard: {
    kpis: [
        'pendingOrders',
        'monthlyRevenue',
        'pendingPayments',
        'totalCustomers'
    ],
    quickActions: [
        'newInvoice',
        'newCustomer',
        'newExpense',
        'newQuotation'
    ]
},
};
