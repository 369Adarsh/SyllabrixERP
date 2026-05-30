// SYL-BC-RET-JW05 — JEWELLERY
module.exports = {
  modules: {
  assets: true,
  staff: true,
  attendance: true
},
  features: {},
  dashboard: {
    kpis: [
        'todaySales',
        'pendingInvoices',
        'totalStock',
        'monthlyRevenue'
    ],
    quickActions: [
        'newSale',
        'newProduct',
        'newCustomer',
        'newInvoice'
    ]
},
};
