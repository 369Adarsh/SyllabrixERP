// SYL-BC-RET-JW05 — JEWELLERY
export default {
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
