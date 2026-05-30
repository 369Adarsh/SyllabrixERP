// SYL-BC-BPC-TL04 — TAILORING
module.exports = {
  modules: {
  pos: false,
  inventory: false,
  appointments: true,
  staff: true
},
  features: {},
  dashboard: {
    kpis: [
        'pendingOrders',
        'todayAppointments',
        'pendingPayments',
        'monthlyRevenue'
    ],
    quickActions: [
        'newOrder',
        'newAppointment',
        'newCustomer',
        'newInvoice'
    ]
},
};
