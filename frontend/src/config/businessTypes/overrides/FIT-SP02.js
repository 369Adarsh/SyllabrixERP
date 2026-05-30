// SYL-BC-FIT-SP02 — SPA
export default {
  modules: {
    appointments: true, staff: true, attendance: true,
    subscriptions: true, pos: true, inventory: true,
    fees: false, membershipplans: false,
    invoicing: false, quotations: false, recurringinvoices: false,
    bills: false, creditnotes: false, returns: false,
  },
  features: {},
  dashboard: {
    kpis: ['todayAppointments', 'todaySales', 'pendingPayments', 'monthlyRevenue'],
    quickActions: ['newAppointment', 'newSale', 'newCustomer', 'newInvoice'],
  },
};
