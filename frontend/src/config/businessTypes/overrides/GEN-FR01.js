// SYL-BC-GEN-FR01 — FREELANCER
export default {
  modules: { pos: false, inventory: false },
  features: {},
  dashboard: {
    kpis: ['pendingInvoices', 'monthlyEarnings', 'unpaidAmount', 'totalClients'],
    quickActions: ['newInvoice', 'newQuotation', 'newCustomer', 'newExpense'],
  },
};
