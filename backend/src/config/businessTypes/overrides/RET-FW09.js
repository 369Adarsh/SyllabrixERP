// SYL-BC-RET-FW09 — FOOTWEAR
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
        'topSellingProducts'
    ],
    quickActions: [
        'newSale',
        'newProduct',
        'newCustomer',
        'newInvoice'
    ]
},
};
