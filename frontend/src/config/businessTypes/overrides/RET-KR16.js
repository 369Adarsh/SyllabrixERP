// SYL-BC-RET-KR16 — KIRANA
export default {
  modules: {
    staff:             true,
    attendance:        true,
    payroll:           true,
    assets:            true,
    b2b:               false,
    quotations:        false,
    recurringinvoices: false,
  },
  features: {},
  dashboard: {
    kpis: ['todaySales', 'lowStockAlerts', 'pendingPayments', 'cashBalance'],
    quickActions: ['newSale', 'newProduct', 'addStock', 'newCustomer'],
  },
};
