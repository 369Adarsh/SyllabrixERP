// SYL-BC-HLC-DL02 — DIAGNOSTIC_LAB
export default {
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
        'todayTests',
        'pendingReports',
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
