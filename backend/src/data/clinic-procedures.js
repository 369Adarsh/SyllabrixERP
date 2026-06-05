// Clinic pre-configured procedure catalog
// isGstExempt: true  → 0% GST (medical services — healthcare exemption)
// isGstExempt: false → taxRate applies (cosmetic / non-medical)

const PROCEDURES = [
  // ── Consultation ─────────────────────────────────────────────────────────────
  { code: 'CONS001', category: 'CONSULTATION', description: 'Consultation — First Visit',  defaultPrice: 300, isGstExempt: true,  taxRate: 0 },
  { code: 'CONS002', category: 'CONSULTATION', description: 'Consultation — Follow-up',    defaultPrice: 200, isGstExempt: true,  taxRate: 0 },
  { code: 'CONS003', category: 'CONSULTATION', description: 'Consultation — Specialist',   defaultPrice: 500, isGstExempt: true,  taxRate: 0 },
  { code: 'CONS004', category: 'CONSULTATION', description: 'Consultation — Emergency',    defaultPrice: 500, isGstExempt: true,  taxRate: 0 },
  { code: 'CONS005', category: 'CONSULTATION', description: 'Consultation — Home Visit',   defaultPrice: 800, isGstExempt: true,  taxRate: 0 },
  { code: 'CONS006', category: 'CONSULTATION', description: 'Teleconsultation / Video',    defaultPrice: 200, isGstExempt: true,  taxRate: 0 },

  // ── Procedures (Medical — GST Exempt) ─────────────────────────────────────────
  { code: 'PROC001', category: 'PROCEDURE', description: 'Dressing — Minor',              defaultPrice: 100,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC002', category: 'PROCEDURE', description: 'Dressing — Major',              defaultPrice: 200,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC003', category: 'PROCEDURE', description: 'Injection — Intramuscular (IM)',defaultPrice: 50,   isGstExempt: true,  taxRate: 0 },
  { code: 'PROC004', category: 'PROCEDURE', description: 'Injection — Intravenous (IV)',  defaultPrice: 100,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC005', category: 'PROCEDURE', description: 'Injection — Subcutaneous (SC)', defaultPrice: 50,   isGstExempt: true,  taxRate: 0 },
  { code: 'PROC006', category: 'PROCEDURE', description: 'IV Fluid Administration',        defaultPrice: 200,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC007', category: 'PROCEDURE', description: 'Nebulization',                  defaultPrice: 200,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC008', category: 'PROCEDURE', description: 'ECG (12-lead)',                  defaultPrice: 150,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC009', category: 'PROCEDURE', description: 'Suturing — 1–3 stitches',        defaultPrice: 300,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC010', category: 'PROCEDURE', description: 'Suturing — 4–8 stitches',        defaultPrice: 500,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC011', category: 'PROCEDURE', description: 'Incision & Drainage (I&D)',      defaultPrice: 500,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC012', category: 'PROCEDURE', description: 'Wound Debridement',              defaultPrice: 400,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC013', category: 'PROCEDURE', description: 'Urinary Catheterization',        defaultPrice: 300,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC014', category: 'PROCEDURE', description: 'Ear Wax Removal (Syringing)',    defaultPrice: 200,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC015', category: 'PROCEDURE', description: 'Nasal Packing',                  defaultPrice: 300,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC016', category: 'PROCEDURE', description: 'Plaster of Paris (POP) Cast',    defaultPrice: 500,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC017', category: 'PROCEDURE', description: 'Minor Surgery',                  defaultPrice: 1000, isGstExempt: true,  taxRate: 0 },
  { code: 'PROC018', category: 'PROCEDURE', description: 'Joint Aspiration / Injection',   defaultPrice: 500,  isGstExempt: true,  taxRate: 0 },
  { code: 'PROC019', category: 'PROCEDURE', description: 'Blood Transfusion (per unit)',   defaultPrice: 1500, isGstExempt: true,  taxRate: 0 },
  { code: 'PROC020', category: 'PROCEDURE', description: 'Oxygen Inhalation (per hour)',   defaultPrice: 100,  isGstExempt: true,  taxRate: 0 },

  // ── Diagnostics (In-house — GST Exempt) ────────────────────────────────────────
  { code: 'DIAG001', category: 'DIAGNOSTIC', description: 'Blood Glucose (Random — CBG)',  defaultPrice: 30,  isGstExempt: true,  taxRate: 0 },
  { code: 'DIAG002', category: 'DIAGNOSTIC', description: 'Urine Dipstick Test',           defaultPrice: 50,  isGstExempt: true,  taxRate: 0 },
  { code: 'DIAG003', category: 'DIAGNOSTIC', description: 'Urine Pregnancy Test (UPT)',    defaultPrice: 100, isGstExempt: true,  taxRate: 0 },
  { code: 'DIAG004', category: 'DIAGNOSTIC', description: 'Malaria Rapid Test (RDT)',      defaultPrice: 100, isGstExempt: true,  taxRate: 0 },
  { code: 'DIAG005', category: 'DIAGNOSTIC', description: 'Dengue NS1 Rapid Test',         defaultPrice: 150, isGstExempt: true,  taxRate: 0 },
  { code: 'DIAG006', category: 'DIAGNOSTIC', description: 'COVID-19 Rapid Antigen',        defaultPrice: 200, isGstExempt: true,  taxRate: 0 },
  { code: 'DIAG007', category: 'DIAGNOSTIC', description: 'Typhoid Card Test',             defaultPrice: 100, isGstExempt: true,  taxRate: 0 },
  { code: 'DIAG008', category: 'DIAGNOSTIC', description: 'SpO2 Monitoring',               defaultPrice: 30,  isGstExempt: true,  taxRate: 0 },

  // ── Cosmetic Procedures (18% GST) ─────────────────────────────────────────────
  { code: 'COSM001', category: 'PROCEDURE', description: 'Botox Injection (per area)',     defaultPrice: 5000, isGstExempt: false, taxRate: 18 },
  { code: 'COSM002', category: 'PROCEDURE', description: 'Chemical Peel',                  defaultPrice: 2000, isGstExempt: false, taxRate: 18 },
  { code: 'COSM003', category: 'PROCEDURE', description: 'PRP Therapy',                    defaultPrice: 3000, isGstExempt: false, taxRate: 18 },
  { code: 'COSM004', category: 'PROCEDURE', description: 'Laser Treatment (per session)',  defaultPrice: 2500, isGstExempt: false, taxRate: 18 },
];

const PROCEDURE_CATEGORIES = ['CONSULTATION', 'PROCEDURE', 'DIAGNOSTIC'];

const CATEGORY_COLORS = {
  CONSULTATION: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  PROCEDURE:    { bg: '#F5F3FF', color: '#6D28D9', border: '#C4B5FD' },
  MEDICINE:     { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  DIAGNOSTIC:   { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  OTHER:        { bg: '#F9FAFB', color: '#374151', border: '#D1D5DB' },
};

module.exports = { PROCEDURES, PROCEDURE_CATEGORIES, CATEGORY_COLORS };
