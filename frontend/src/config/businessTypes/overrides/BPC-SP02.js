// SYL-BC-BPC-SP02 — SPA
export default {
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
