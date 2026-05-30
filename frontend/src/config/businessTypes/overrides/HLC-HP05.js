// SYL-BC-HLC-HP05 — HOSPITAL
export default {
  modules: {
  pos: false,
  inventory: false,
  appointments: true,
  staff: true,
  attendance: true,
  payroll: true,
  assets: true
},
  features: {},
  dashboard: {
    kpis: [
        'todayAdmissions',
        'totalBeds',
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
