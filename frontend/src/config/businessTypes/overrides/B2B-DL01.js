// SYL-BC-B2B-DL01 — DEALER
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
