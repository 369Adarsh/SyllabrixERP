// SYL-BC-EDU-CG06 — COACHING
export default {
  modules: {
    pos: false, inventory: false,
    fees: true, students: true, progress: true, staff: true, attendance: true,
  },
  features: {},
  dashboard: {
    kpis: ['totalStudents', 'feesCollected', 'pendingFees', 'upcomingClasses'],
    quickActions: ['newFeeCollection', 'newStudent', 'newInvoice', 'newHomework'],
  },
};
