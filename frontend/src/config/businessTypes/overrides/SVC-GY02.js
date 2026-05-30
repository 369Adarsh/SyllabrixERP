// SYL-BC-SVC-GY02 — GYM
export default {
  modules: { fees: true, appointments: true, staff: true, attendance: true, assets: true, subscriptions: true, membershipplans: true },
  features: {},
  dashboard: {
    kpis: ['activeMembers', 'feesCollected', 'expiringMemberships', 'todayAttendance'],
    quickActions: ['newMember', 'collectFee', 'newAppointment', 'markAttendance'],
  },
};
