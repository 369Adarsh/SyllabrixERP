// SYL-BC-FNB-CM05 — CANTEEN_MESS
module.exports = {
  modules: {
  staff: true,
  attendance: true,
  fees: true
},
  features: {},
  dashboard: {
    kpis: [
        'todaySales',
        'monthlySubscribers',
        'cashBalance',
        'lowStockAlerts'
    ],
    quickActions: [
        'newSale',
        'newProduct',
        'collectFee',
        'newExpense'
    ]
},
};
