// SYL-BC-RET-BK04 — BAKERY
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
        'cashBalance',
        'dailyRevenue'
    ],
    quickActions: [
        'newSale',
        'newProduct',
        'addStock',
        'newExpense'
    ]
},
};
