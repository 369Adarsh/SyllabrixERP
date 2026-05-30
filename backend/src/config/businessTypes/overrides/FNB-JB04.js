// SYL-BC-FNB-JB04 — JUICE_BAR
module.exports = {
  modules: {
  staff: true
},
  features: {},
  dashboard: {
    kpis: [
        'todaySales',
        'cashBalance',
        'lowStockAlerts',
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
