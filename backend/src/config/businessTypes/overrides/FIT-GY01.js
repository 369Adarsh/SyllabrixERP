// SYL-BC-FIT-GY01 — GYM
module.exports = {
  modules: {
    fees: true, appointments: true, staff: true, attendance: true,
    assets: true, subscriptions: true, membershipplans: true,
    pos: true, inventory: true,
    invoicing: false, quotations: false, recurringinvoices: false,
    bills: false, creditnotes: false, returns: false,
  },
  features: {},
  dashboard: {
    kpis: ['activeMembers', 'feesCollected', 'expiringMemberships', 'todayAttendance'],
    quickActions: ['newMember', 'collectFee', 'newAppointment', 'markAttendance'],
  },
};
