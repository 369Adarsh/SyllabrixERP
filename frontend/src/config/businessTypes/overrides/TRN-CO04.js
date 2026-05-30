// SYL-BC-TRN-CO04 — COURIER
export default {
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
