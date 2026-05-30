// SYL-BC-B2B-WS03 — WHOLESALE
export default {
  modules: {
  staff: true,
  attendance: true
},
  features: {},
  dashboard: {
    kpis: [
        'todaySales',
        'pendingPayments',
        'lowStockAlerts',
        'monthlyRevenue'
    ],
    quickActions: [
        'newSale',
        'newInvoice',
        'newProduct',
        'newCustomer'
    ]
},
};
