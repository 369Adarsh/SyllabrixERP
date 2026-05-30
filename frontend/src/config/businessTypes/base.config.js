/**
 * Syllabrix Base Business Type Config — Frontend
 * Controls sidebar visibility, feature flags, and dashboard layout.
 * Overrides in ./overrides/[TYPE-CODE].js
 */

const base = {
  modules: {
    invoicing:         true,
    customers:         true,
    reports:           true,
    expenses:          true,
    vendors:           true,
    accounts:          true,
    bills:             true,
    quotations:        true,
    creditnotes:       true,
    recurringinvoices: true,
    returns:           true,
    automation:        true,
    whatsapp:          true,
    campaigns:         true,
    ai:                true,
    b2b:               true,
    pos:               true,
    inventory:         true,

    // Specialized — off by default
    appointments:      false,
    fees:              false,
    staff:             false,
    attendance:        false,
    payroll:           false,
    lease:             false,
    assets:            false,
    students:          false,
    progress:          false,
    subscriptions:     false,
    membershipplans:   false,
    training:          false,
  },

  features: {
    // New enhancement flags — always false in base.
    // Set true in the relevant override file to enable only for that business type.
  },

  dashboard: {
    kpis: ['todaySales', 'totalCustomers', 'pendingInvoices', 'monthlyRevenue'],
    quickActions: ['newInvoice', 'newCustomer', 'newExpense', 'newProduct'],
  },
};

export default base;
