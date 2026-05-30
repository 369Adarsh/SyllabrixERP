// SYL-BC-TRN-CR03 — CAR_RENTAL
export default {
  modules: {
  pos: false,
  assets: true,
  appointments: true
},
  features: {},
  dashboard: {
    kpis: [
        'activeRentals',
        'monthlyRevenue',
        'pendingPayments',
        'totalVehicles'
    ],
    quickActions: [
        'newBooking',
        'newInvoice',
        'newCustomer',
        'newExpense'
    ]
},
};
