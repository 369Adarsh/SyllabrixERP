// SYL-BC-TRN-CO04 — COURIER
module.exports = {
  modules: {
  pos: false,
  inventory: false,
  staff: true
},
  features: {},
  dashboard: {
    kpis: [
        'todayShipments',
        'pendingDeliveries',
        'monthlyRevenue',
        'totalCustomers'
    ],
    quickActions: [
        'newShipment',
        'newInvoice',
        'newCustomer',
        'newExpense'
    ]
},
};
