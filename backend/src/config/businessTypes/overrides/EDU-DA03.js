// SYL-BC-EDU-DA03 — DANCE_ACADEMY
module.exports = {
  modules: {
  pos: false,
  inventory: false,
  fees: true,
  students: true,
  staff: true,
  attendance: true
},
  features: {},
  dashboard: {
    kpis: [
        'totalStudents',
        'feesCollected',
        'pendingFees',
        'upcomingClasses'
    ],
    quickActions: [
        'newFeeCollection',
        'newStudent',
        'newInvoice',
        'newExpense'
    ]
},
};
