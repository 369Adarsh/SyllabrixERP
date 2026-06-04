// SYL-BC-HLC-CL07 — CLINIC (Solo / 2–3 doctor OPD clinic, outpatient only)
export default {
  modules: {
    // Core commerce — disabled (uses clinic-specific billing)
    pos:            false,
    inventory:      false,
    invoicing:      false,
    vendors:        false,
    membershipplans:false,
    lease:          false,
    fees:           false,
    progress:       false,
    training:       false,
    b2b:            false,
    reports:        false,   // replaced by clinicReports

    // General modules — enabled
    customers:      true,
    appointments:   true,
    staff:          true,
    attendance:     true,
    expenses:       true,
    accounts:       true,
    payroll:        true,
    whatsapp:       true,
    campaigns:      true,
    ai:             true,
    automation:     true,
    assets:         true,

    // ── Modules 1–15 (Clinic tier) ───────────────────────────────────────────
    opdqueue:        true,   // Mod 2
    vitals:          true,   // Mod 3
    clinicalNotes:   true,   // Mod 4
    prescriptions:   true,   // Mod 5
    labOrders:       true,   // Mod 6
    clinicBilling:   true,   // Mod 7
    clinicMedicines: true,   // Mod 8
    clinicDoctors:   true,   // Mod 9 (staff profiles)
    clinicPnl:       true,   // Mod 12
    clinicReports:   true,   // Mod 13

    // ── Module 16 — ABDM (available for all healthcare) ──────────────────────
    abdm:            true,

    // ── Modules 17–25 — IPD tier (Nursing Home / Hospital only) ─────────────
    ipdWards:        false,
    ipdAdmissions:   false,
    dischargeSummary:false,
    otSessions:      false,
    lims:            false,
    radiology:       false,
    insuranceClaims: false,
  },
  features: {},
  dashboard: {
    kpis: ['todayTokens', 'totalPatients', 'todayCollection', 'pendingDues'],
    quickActions: ['newOpdToken', 'newPrescription', 'newLabOrder', 'newClinicBill'],
  },
};
