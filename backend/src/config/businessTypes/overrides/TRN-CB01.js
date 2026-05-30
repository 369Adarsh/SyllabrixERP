// SYL-BC-TRN-CB01 — CAB_SERVICE
module.exports = {
  modules: {
  pos: false,
  inventory: false
},
  features: {},
  dashboard: {
    kpis: [
        'todayBookings',
        'monthlyRevenue',
        'totalCustomers',
        'pendingPayments'
    ],
    quickActions: [
        'newInvoice',
        'newCustomer',
        'newExpense',
        'newQuotation'
    ]
},
};
