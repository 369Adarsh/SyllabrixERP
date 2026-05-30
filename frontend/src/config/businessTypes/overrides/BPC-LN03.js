// SYL-BC-BPC-LN03 — LAUNDRY
export default {
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
