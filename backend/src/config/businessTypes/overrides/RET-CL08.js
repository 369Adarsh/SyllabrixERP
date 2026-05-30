// SYL-BC-RET-CL08 — CLOTHING
module.exports = {
  modules: {
  staff: true,
  attendance: true
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
