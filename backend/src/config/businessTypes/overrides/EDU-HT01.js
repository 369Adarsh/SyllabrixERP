// SYL-BC-EDU-HT01 — HOME_TUITION
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
