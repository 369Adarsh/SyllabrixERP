// SYL-BC-PRO-PH06 — PHOTOGRAPHY
export default {
  modules: {
  pos: false,
  inventory: false,
  appointments: true
},
  features: {},
  dashboard: {
    kpis: [
        'todayAppointments',
        'monthlyRevenue',
        'pendingInvoices',
        'totalClients'
    ],
    quickActions: [
        'newAppointment',
        'newInvoice',
        'newCustomer',
        'newExpense'
    ]
},
};
