// SYL-BC-FNB-DH01 — DHABA
module.exports = {
  modules: {
  staff: true,
  attendance: true
},
  features: {},
  dashboard: {
    kpis: [
        'todaySales',
        'cashBalance',
        'dailyRevenue',
        'lowStockAlerts'
    ],
    quickActions: [
        'newSale',
        'newOrder',
        'newProduct',
        'newExpense'
    ]
},
};
