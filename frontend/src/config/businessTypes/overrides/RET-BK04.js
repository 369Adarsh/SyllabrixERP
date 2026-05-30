// SYL-BC-RET-BK04 — BAKERY
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
