// SYL-BC-EVT-TH03 — TENT_HOUSE
export default {
  modules: {
  pos: false,
  staff: true,
  attendance: true
},
  features: {},
  dashboard: {
    kpis: [
        'upcomingBookings',
        'pendingInvoices',
        'monthlyRevenue',
        'lowStockAlerts'
    ],
    quickActions: [
        'newInvoice',
        'newQuotation',
        'newCustomer',
        'newExpense'
    ]
},
};
