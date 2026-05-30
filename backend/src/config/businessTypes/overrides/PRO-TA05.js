// SYL-BC-PRO-TA05 — TRAVEL_AGENCY
module.exports = {
  modules: {
  pos: false,
  inventory: false
},
  features: {},
  dashboard: {
    kpis: [
        'pendingBookings',
        'monthlyRevenue',
        'totalClients',
        'pendingPayments'
    ],
    quickActions: [
        'newInvoice',
        'newCustomer',
        'newQuotation',
        'newExpense'
    ]
},
};
