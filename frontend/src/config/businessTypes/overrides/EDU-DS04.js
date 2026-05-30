// SYL-BC-EDU-DS04 — DRIVING_SCHOOL
export default {
  modules: {
  pos: false,
  inventory: false,
  fees: true,
  students: true,
  staff: true,
  attendance: true,
  appointments: true
},
  features: {},
  dashboard: {
    kpis: [
        'totalStudents',
        'feesCollected',
        'pendingFees',
        'upcomingLessons'
    ],
    quickActions: [
        'newLesson',
        'newFeeCollection',
        'newStudent',
        'newInvoice'
    ]
},
};
