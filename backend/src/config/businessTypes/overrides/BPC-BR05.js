// SYL-BC-BPC-BR05 — BARBERSHOP
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
        'monthlyRevenue'
    ],
    quickActions: [
        'newAppointment',
        'newSale',
        'newCustomer',
        'newInvoice'
    ]
},
};
