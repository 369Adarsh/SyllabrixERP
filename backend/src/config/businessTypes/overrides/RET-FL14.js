// SYL-BC-RET-FL14 — FLORIST
module.exports = {
  modules: {
  staff: true
},
  features: {},
  dashboard: {
    kpis: [
        'todaySales',
        'lowStockAlerts',
        'pendingOrders',
        'monthlyRevenue'
    ],
    quickActions: [
        'newSale',
        'newProduct',
        'newCustomer',
        'newInvoice'
    ]
},
};
