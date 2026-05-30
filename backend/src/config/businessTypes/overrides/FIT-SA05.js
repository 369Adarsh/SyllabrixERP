// SYL-BC-FIT-SA05 — SPORTS_ACADEMY
module.exports = {
  modules: {
    fees: true, appointments: true, staff: true, attendance: true,
    subscriptions: true, membershipplans: true, assets: true,
    pos: false, inventory: false,
    invoicing: false, quotations: false, recurringinvoices: false,
    bills: false, creditnotes: false, returns: false,
  },
  features: {},
  dashboard: {
    kpis: ['activeMembers', 'feesCollected', 'todayClasses', 'expiringMemberships'],
    quickActions: ['newMember', 'collectFee', 'newAppointment', 'markAttendance'],
  },
};
