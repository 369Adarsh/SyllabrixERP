// SYL-BC-HLC-CL07 — CLINIC
export default {
  modules: {
    // Core commerce — disabled
    pos:            false,
    inventory:      false,
    invoicing:      false,
    vendors:        false,
    membershipplans:false,
    lease:          false,
    fees:           false,
    progress:       false,
    training:       false,

    // General modules — enabled
    customers:      true,
    appointments:   true,
    staff:          true,
    attendance:     true,
    expenses:       true,
    accounts:       true,
    reports:        false,   // replaced by clinicReports
    payroll:        true,
    whatsapp:       true,
    campaigns:      true,
    ai:             true,
    automation:     true,
    b2b:            false,
    assets:         true,

    // Clinic-specific modules — all enabled
    opdqueue:        true,
    clinicalNotes:   true,
    prescriptions:   true,
    labOrders:       true,
    clinicBilling:   true,
    clinicMedicines: true,
    clinicDoctors:   true,
    clinicPnl:       true,
    clinicReports:   true,
  },
  features: {},
  dashboard: {
    kpis: ['todayTokens', 'totalPatients', 'todayCollection', 'pendingDues'],
    quickActions: ['newOpdToken', 'newPrescription', 'newLabOrder', 'newClinicBill'],
  },
};
