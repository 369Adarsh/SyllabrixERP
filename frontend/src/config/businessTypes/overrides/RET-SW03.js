// SYL-BC-RET-SW03 — SWEET_SHOP
export default {
  modules: {
  staff: true,
  attendance: true
},
  features: {},
  dashboard: {
    kpis: [
        'todaySales',
        'lowStockAlerts',
        'cashBalance',
        'topSellingProducts'
    ],
    quickActions: [
        'newSale',
        'newProduct',
        'addStock',
        'newInvoice'
    ]
},
};
