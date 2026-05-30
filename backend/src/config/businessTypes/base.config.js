/**
 * Syllabrix Base Business Type Config
 * Every business type inherits this. Overrides in ./overrides/[TYPE-CODE].js
 * only need to specify what's DIFFERENT from this base.
 *
 * modules  — which platform modules are active for this type
 * features — feature flags for new enhancements (always false here, enabled per type)
 * dashboard — default KPIs and quick actions shown on the dashboard
 */

module.exports = {
  modules: {
    // ── Universal — every business type gets these
    invoicing:          true,
    customers:          true,
    reports:            true,
    expenses:           true,
    vendors:            true,
    accounts:           true,
    bills:              true,
    quotations:         true,
    creditnotes:        true,
    recurringinvoices:  true,
    returns:            true,
    automation:         true,
    whatsapp:           true,
    campaigns:          true,
    ai:                 true,
    b2b:                true,

    // ── Common retail / commerce — on by default, disabled per type if irrelevant
    pos:                true,
    inventory:          true,

    // ── Specialized — off by default, enabled per business type override
    appointments:       false,
    fees:               false,
    staff:              false,
    attendance:         false,
    payroll:            false,
    lease:              false,
    assets:             false,
    students:           false,
    progress:           false,
    subscriptions:      false,
    membershipplans:    false,
    training:           false,
  },

  features: {
    // All new enhancement flags live here — always false in base.
    // To deploy a feature to a specific business type only:
    //   1. Add the flag here as false
    //   2. Set it true in that type's override file
    //   3. Deploy — only that business type is affected
    //
    // Example (do not uncomment — add real flags as needed):
    // new_dashboard_v2: false,
    // bulk_invoice_send: false,
  },

  dashboard: {
    kpis: ['todaySales', 'totalCustomers', 'pendingInvoices', 'monthlyRevenue'],
    quickActions: ['newInvoice', 'newCustomer', 'newExpense', 'newProduct'],
  },
};
