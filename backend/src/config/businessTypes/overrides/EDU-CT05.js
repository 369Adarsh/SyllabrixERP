// SYL-BC-EDU-CT05 — COMPUTER_TRAINING
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
        'activeCoures'
    ],
    quickActions: [
        'newFeeCollection',
        'newStudent',
        'newInvoice',
        'newExpense'
    ]
},
};
