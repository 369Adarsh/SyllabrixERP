// SYL-BC-BPC-SL06 — SALON
export default {
  modules: { appointments: true, staff: true, attendance: true },
  features: {},
  dashboard: {
    kpis: ['todayAppointments', 'todaySales', 'pendingPayments', 'topServices'],
    quickActions: ['newAppointment', 'newSale', 'newCustomer', 'newInvoice'],
  },
};
