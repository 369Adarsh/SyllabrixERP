// SYL-BC-CND-CW03 — CO_WORKING
export default {
  modules: {
  pos: false,
  inventory: false,
  lease: true,
  staff: true
},
  features: {},
  dashboard: {
    kpis: [
        'occupiedUnits',
        'pendingRent',
        'monthlyRevenue',
        'vacantUnits'
    ],
    quickActions: [
        'newLeaseUnit',
        'collectRent',
        'newInvoice',
        'newExpense'
    ]
},
};
