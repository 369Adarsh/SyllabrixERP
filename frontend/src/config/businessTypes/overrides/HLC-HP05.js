// SYL-BC-HLC-HP05 — HOSPITAL
// Full OPD + IPD + Lab + Pharmacy + Radiology — all 25 modules enabled
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
    clinicDoctors:   true,   // Mod 9
    clinicPnl:       true,   // Mod 12
    clinicReports:   true,   // Mod 13

    // ── Module 16 — ABDM ─────────────────────────────────────────────────────
    abdm:            true,

    // ── Modules 17–20 — IPD ──────────────────────────────────────────────────
    ipdWards:        true,
    ipdAdmissions:   true,

    // ── Modules 21–25 — all enabled for Hospital ─────────────────────────────
    dischargeSummary: true,
    otSessions:       true,
    lims:             true,
    radiology:        true,
    insuranceClaims:  true,
  },
  features: {},
  dashboard: {
    kpis: ['todayAdmissions', 'totalBeds', 'occupancyPct', 'todayCollection'],
    quickActions: ['admitPatient', 'newOpdToken', 'newPrescription', 'newLabOrder'],
  },
};
