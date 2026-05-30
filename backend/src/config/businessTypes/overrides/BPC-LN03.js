// SYL-BC-BPC-LN03 — LAUNDRY
module.exports = {
  modules: {
  staff: true,
  attendance: true
},
  features: {},
  dashboard: {
    kpis: [
        'pendingOrders',
        'todaySales',
        'cashBalance',
        'monthlyRevenue'
    ],
    quickActions: [
        'newOrder',
        'newSale',
        'newCustomer',
        'newInvoice'
    ]
},
};
