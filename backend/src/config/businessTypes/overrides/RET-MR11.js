// SYL-BC-RET-MR11 — MOBILE_REPAIR
module.exports = {
  modules: {
  appointments: true,
  staff: true
},
  features: {},
  dashboard: {
    kpis: [
        'pendingRepairs',
        'todaySales',
        'pendingInvoices',
        'monthlyRevenue'
    ],
    quickActions: [
        'newRepairJob',
        'newSale',
        'newCustomer',
        'newInvoice'
    ]
},
};
