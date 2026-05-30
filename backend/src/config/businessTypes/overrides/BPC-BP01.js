// SYL-BC-BPC-BP01 — BEAUTY_PARLOUR
module.exports = {
  modules: {
  appointments: true,
  staff: true,
  attendance: true
},
  features: {},
  dashboard: {
    kpis: [
        'todayAppointments',
        'todaySales',
        'pendingPayments',
        'topServices'
    ],
    quickActions: [
        'newAppointment',
        'newSale',
        'newCustomer',
        'newInvoice'
    ]
},
};
