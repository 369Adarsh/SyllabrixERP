// SYL-BC-SVC-ML03 — MALL
module.exports = {
  modules: { pos: false, inventory: false, lease: true },
  features: {},
  dashboard: {
    kpis: ['occupiedUnits', 'pendingRent', 'monthlyRevenue', 'vacantUnits'],
    quickActions: ['newLeaseUnit', 'collectRent', 'newInvoice', 'newExpense'],
  },
};
