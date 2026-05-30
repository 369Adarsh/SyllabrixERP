// SYL-BC-GEN-FR01 — FREELANCER
module.exports = {
  modules: { pos: false, inventory: false },
  features: {},
  dashboard: {
    kpis: ['pendingInvoices', 'monthlyEarnings', 'unpaidAmount', 'totalClients'],
    quickActions: ['newInvoice', 'newQuotation', 'newCustomer', 'newExpense'],
  },
};
