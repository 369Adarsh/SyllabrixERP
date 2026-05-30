// SYL-BC-HLC-PT03 — PHYSIOTHERAPY
module.exports = {
  modules: {
  pos: false,
  inventory: false,
  appointments: true,
  staff: true,
  attendance: true
},
  features: {},
  dashboard: {
    kpis: [
        'todayAppointments',
        'totalPatients',
        'pendingBilling',
        'monthlyRevenue'
    ],
    quickActions: [
        'newAppointment',
        'newPatient',
        'newInvoice',
        'newExpense'
    ]
},
};
