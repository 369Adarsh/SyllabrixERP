// SYL-BC-FNB-CK03 — CLOUD_KITCHEN
module.exports = {
  modules: {
  staff: true,
  attendance: true
},
  features: {},
  dashboard: {
    kpis: [
        'todayOrders',
        'dailyRevenue',
        'lowStockAlerts',
        'topDishes'
    ],
    quickActions: [
        'newSale',
        'newProduct',
        'addStock',
        'newExpense'
    ]
},
};
