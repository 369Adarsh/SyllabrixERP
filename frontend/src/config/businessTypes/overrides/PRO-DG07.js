// SYL-BC-PRO-DG07 — DIGITAL_AGENCY
export default {
  modules: {
  pos: false,
  inventory: false
},
  features: {},
  dashboard: {
    kpis: [
        'pendingInvoices',
        'monthlyRevenue',
        'totalClients',
        'recurringRevenue'
    ],
    quickActions: [
        'newInvoice',
        'newCustomer',
        'newExpense',
        'newQuotation'
    ]
},
};
