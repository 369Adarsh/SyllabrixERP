// SYL-BC-FNB-JB04 — JUICE_BAR
export default {
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
