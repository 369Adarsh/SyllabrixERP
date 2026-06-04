// SYL-BC-HLC-NH08 — NURSING HOME
// OPD + IPD, 5–30 beds, basic pharmacy, minor OT — Modules 1–22 + 25
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

    // ── Modules 17–20 — IPD (Ward + Admissions + Rounds + MAR) ──────────────
    ipdWards:        true,
    ipdAdmissions:   true,

    // ── Modules 21–25 ────────────────────────────────────────────────────────
    dischargeSummary: true,
    otSessions:       true,   // basic OT scheduling
    lims:             false,  // no in-house LIMS at NH level — refers to external lab
    radiology:        false,  // no in-house radiology at NH level
    insuranceClaims:  true,
  },
  features: {},
  dashboard: {
    kpis: ['currentIPD', 'availableBeds', 'todayAdmissions', 'todayCollection'],
    quickActions: ['admitPatient', 'newOpdToken', 'newPrescription', 'newClinicBill'],
  },
};
