// SYL-BC-RET-EL07 — ELECTRICAL
export default {
  modules: {
  staff: true
},
  features: {},
  dashboard: {
    kpis: [
        'todaySales',
        'lowStockAlerts',
        'pendingInvoices',
        'monthlyRevenue'
    ],
    quickActions: [
        'newSale',
        'newProduct',
        'newCustomer',
        'newInvoice'
    ]
},
};
