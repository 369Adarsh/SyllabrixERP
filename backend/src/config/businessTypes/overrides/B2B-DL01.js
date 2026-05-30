// SYL-BC-B2B-DL01 — DEALER
module.exports = {
  modules: {
  staff: true,
  attendance: true
},
  features: {},
  dashboard: {
    kpis: [
        'todaySales',
        'pendingPayments',
        'lowStockAlerts',
        'monthlyRevenue'
    ],
    quickActions: [
        'newSale',
        'newInvoice',
        'newProduct',
        'newCustomer'
    ]
},
};
