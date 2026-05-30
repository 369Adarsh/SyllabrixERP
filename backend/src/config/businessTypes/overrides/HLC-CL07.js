// SYL-BC-HLC-CL07 — CLINIC
module.exports = {
  modules: { pos: false, inventory: false, appointments: true, staff: true, attendance: true },
  features: {},
  dashboard: {
    kpis: ['todayAppointments', 'totalPatients', 'pendingBilling', 'monthlyRevenue'],
    quickActions: ['newAppointment', 'newPatient', 'newInvoice', 'newExpense'],
  },
};
