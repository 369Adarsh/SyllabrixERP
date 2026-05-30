// SYL-BC-RET-OP12 — OPTICAL
export default {
  modules: {
  appointments: true,
  staff: true
},
  features: {},
  dashboard: {
    kpis: [
        'todayAppointments',
        'todaySales',
        'pendingInvoices',
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
