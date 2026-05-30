// SYL-BC-BPC-SL06 — SALON
module.exports = {
  modules: { appointments: true, staff: true, attendance: true },
  features: {},
  dashboard: {
    kpis: ['todayAppointments', 'todaySales', 'pendingPayments', 'topServices'],
    quickActions: ['newAppointment', 'newSale', 'newCustomer', 'newInvoice'],
  },
};
