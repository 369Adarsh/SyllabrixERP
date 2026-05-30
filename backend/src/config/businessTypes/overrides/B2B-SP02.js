// SYL-BC-B2B-SP02 — SUPPLIER
module.exports = {
  modules: {
  staff: true,
  attendance: true
},
  features: {},
  dashboard: {
    kpis: [
        'pendingOrders',
        'monthlyRevenue',
        'lowStockAlerts',
        'pendingPayments'
    ],
    quickActions: [
        'newInvoice',
        'newProduct',
        'newCustomer',
        'newQuotation'
    ]
},
};
