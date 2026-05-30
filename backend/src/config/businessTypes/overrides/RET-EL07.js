// SYL-BC-RET-EL07 — ELECTRICAL
module.exports = {
  modules: {
  staff: true
},
  features: {},
  dashboard: {
    kpis: [
        'todaySales',
        'lowStockAlerts',
        'pendingInvoices',
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
