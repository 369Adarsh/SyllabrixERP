// SYL-BC-HLC-DN01 — DENTAL
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
