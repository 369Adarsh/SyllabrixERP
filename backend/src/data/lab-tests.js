// Common Indian lab test catalog — 100+ entries
// Fields: code, name, category, unit, turnaround (hours), requiresFasting

const LAB_TESTS = [
  // ── Hematology ───────────────────────────────────────────────────────────────
  { code: 'HEMA001', name: 'CBC (Complete Blood Count)', category: 'Hematology', turnaround: 4, requiresFasting: false },
  { code: 'HEMA002', name: 'Hemoglobin', category: 'Hematology', turnaround: 2, requiresFasting: false },
  { code: 'HEMA003', name: 'ESR (Erythrocyte Sedimentation Rate)', category: 'Hematology', turnaround: 2, requiresFasting: false },
  { code: 'HEMA004', name: 'Peripheral Blood Smear', category: 'Hematology', turnaround: 8, requiresFasting: false },
  { code: 'HEMA005', name: 'Reticulocyte Count', category: 'Hematology', turnaround: 6, requiresFasting: false },
  { code: 'HEMA006', name: 'Prothrombin Time (PT / INR)', category: 'Hematology', turnaround: 4, requiresFasting: false },
  { code: 'HEMA007', name: 'APTT (Activated Partial Thromboplastin Time)', category: 'Hematology', turnaround: 4, requiresFasting: false },
  { code: 'HEMA008', name: 'Bleeding Time / Clotting Time (BT/CT)', category: 'Hematology', turnaround: 2, requiresFasting: false },
  { code: 'HEMA009', name: 'Platelet Count', category: 'Hematology', turnaround: 2, requiresFasting: false },
  { code: 'HEMA010', name: 'Blood Group & Rh Factor (ABO Typing)', category: 'Hematology', turnaround: 4, requiresFasting: false },

  // ── Blood Sugar ────────────────────────────────────────────────────────────────
  { code: 'GLUC001', name: 'Blood Sugar Fasting (BSF)', category: 'Blood Sugar', turnaround: 2, requiresFasting: true },
  { code: 'GLUC002', name: 'Blood Sugar Post Prandial (BSPP / 2hr PP)', category: 'Blood Sugar', turnaround: 2, requiresFasting: false },
  { code: 'GLUC003', name: 'Blood Sugar Random (BSR)', category: 'Blood Sugar', turnaround: 1, requiresFasting: false },
  { code: 'GLUC004', name: 'HbA1c (Glycated Hemoglobin)', category: 'Blood Sugar', turnaround: 4, requiresFasting: false },
  { code: 'GLUC005', name: 'OGTT (Oral Glucose Tolerance Test)', category: 'Blood Sugar', turnaround: 3, requiresFasting: true },

  // ── Liver Function ─────────────────────────────────────────────────────────────
  { code: 'LIVR001', name: 'LFT (Liver Function Tests — Full Panel)', category: 'Liver Function', turnaround: 6, requiresFasting: false },
  { code: 'LIVR002', name: 'SGOT / AST (Serum Glutamic-Oxaloacetic Transaminase)', category: 'Liver Function', turnaround: 4, requiresFasting: false },
  { code: 'LIVR003', name: 'SGPT / ALT (Serum Glutamic-Pyruvic Transaminase)', category: 'Liver Function', turnaround: 4, requiresFasting: false },
  { code: 'LIVR004', name: 'Serum Bilirubin (Total + Direct)', category: 'Liver Function', turnaround: 4, requiresFasting: false },
  { code: 'LIVR005', name: 'Alkaline Phosphatase (ALP)', category: 'Liver Function', turnaround: 4, requiresFasting: false },
  { code: 'LIVR006', name: 'GGT (Gamma-Glutamyl Transferase)', category: 'Liver Function', turnaround: 4, requiresFasting: false },
  { code: 'LIVR007', name: 'Serum Albumin', category: 'Liver Function', turnaround: 4, requiresFasting: false },
  { code: 'LIVR008', name: 'Total Protein', category: 'Liver Function', turnaround: 4, requiresFasting: false },
  { code: 'LIVR009', name: 'Prothrombin Time (PT/INR) — Liver', category: 'Liver Function', turnaround: 4, requiresFasting: false },

  // ── Kidney Function ────────────────────────────────────────────────────────────
  { code: 'KIDN001', name: 'RFT / KFT (Renal / Kidney Function Tests — Full Panel)', category: 'Kidney Function', turnaround: 6, requiresFasting: false },
  { code: 'KIDN002', name: 'Serum Creatinine', category: 'Kidney Function', turnaround: 4, requiresFasting: false },
  { code: 'KIDN003', name: 'Blood Urea Nitrogen (BUN)', category: 'Kidney Function', turnaround: 4, requiresFasting: false },
  { code: 'KIDN004', name: 'Uric Acid', category: 'Kidney Function', turnaround: 4, requiresFasting: false },
  { code: 'KIDN005', name: 'eGFR (Estimated Glomerular Filtration Rate)', category: 'Kidney Function', turnaround: 4, requiresFasting: false },
  { code: 'KIDN006', name: 'Serum Electrolytes (Na⁺, K⁺, Cl⁻)', category: 'Kidney Function', turnaround: 4, requiresFasting: false },
  { code: 'KIDN007', name: 'Serum Calcium', category: 'Kidney Function', turnaround: 4, requiresFasting: false },
  { code: 'KIDN008', name: 'Serum Phosphorus', category: 'Kidney Function', turnaround: 4, requiresFasting: false },
  { code: 'KIDN009', name: 'Urine Microalbumin', category: 'Kidney Function', turnaround: 6, requiresFasting: false },
  { code: 'KIDN010', name: '24-Hour Urine Protein', category: 'Kidney Function', turnaround: 24, requiresFasting: false },

  // ── Lipid Profile ──────────────────────────────────────────────────────────────
  { code: 'LIPD001', name: 'Lipid Profile (Full Panel)', category: 'Lipid Profile', turnaround: 6, requiresFasting: true },
  { code: 'LIPD002', name: 'Total Cholesterol', category: 'Lipid Profile', turnaround: 4, requiresFasting: true },
  { code: 'LIPD003', name: 'Triglycerides', category: 'Lipid Profile', turnaround: 4, requiresFasting: true },
  { code: 'LIPD004', name: 'HDL Cholesterol', category: 'Lipid Profile', turnaround: 4, requiresFasting: true },
  { code: 'LIPD005', name: 'LDL Cholesterol', category: 'Lipid Profile', turnaround: 4, requiresFasting: true },
  { code: 'LIPD006', name: 'VLDL Cholesterol', category: 'Lipid Profile', turnaround: 4, requiresFasting: true },

  // ── Thyroid ────────────────────────────────────────────────────────────────────
  { code: 'THYR001', name: 'TSH (Thyroid Stimulating Hormone)', category: 'Thyroid', turnaround: 6, requiresFasting: false },
  { code: 'THYR002', name: 'T3 (Total Triiodothyronine)', category: 'Thyroid', turnaround: 6, requiresFasting: false },
  { code: 'THYR003', name: 'T4 (Total Thyroxine)', category: 'Thyroid', turnaround: 6, requiresFasting: false },
  { code: 'THYR004', name: 'Free T3 (fT3)', category: 'Thyroid', turnaround: 6, requiresFasting: false },
  { code: 'THYR005', name: 'Free T4 (fT4)', category: 'Thyroid', turnaround: 6, requiresFasting: false },
  { code: 'THYR006', name: 'Thyroid Profile (TSH + T3 + T4)', category: 'Thyroid', turnaround: 8, requiresFasting: false },
  { code: 'THYR007', name: 'Anti-TPO (Thyroid Peroxidase Antibody)', category: 'Thyroid', turnaround: 24, requiresFasting: false },
  { code: 'THYR008', name: 'Anti-Thyroglobulin (Anti-TG)', category: 'Thyroid', turnaround: 24, requiresFasting: false },

  // ── Vitamins & Minerals ────────────────────────────────────────────────────────
  { code: 'VITM001', name: 'Vitamin D (25-OH Vitamin D)', category: 'Vitamins & Minerals', turnaround: 24, requiresFasting: false },
  { code: 'VITM002', name: 'Vitamin B12 (Cyanocobalamin)', category: 'Vitamins & Minerals', turnaround: 24, requiresFasting: false },
  { code: 'VITM003', name: 'Folic Acid (Folate)', category: 'Vitamins & Minerals', turnaround: 24, requiresFasting: false },
  { code: 'VITM004', name: 'Serum Iron + TIBC', category: 'Vitamins & Minerals', turnaround: 8, requiresFasting: false },
  { code: 'VITM005', name: 'Serum Ferritin', category: 'Vitamins & Minerals', turnaround: 8, requiresFasting: false },
  { code: 'VITM006', name: 'Zinc', category: 'Vitamins & Minerals', turnaround: 24, requiresFasting: false },

  // ── Infection / Serology ──────────────────────────────────────────────────────
  { code: 'SERO001', name: 'HIV (ELISA)', category: 'Infection / Serology', turnaround: 24, requiresFasting: false },
  { code: 'SERO002', name: 'HBsAg (Hepatitis B Surface Antigen)', category: 'Infection / Serology', turnaround: 8, requiresFasting: false },
  { code: 'SERO003', name: 'Anti-HCV (Hepatitis C Antibody)', category: 'Infection / Serology', turnaround: 8, requiresFasting: false },
  { code: 'SERO004', name: 'Widal Test (Typhoid)', category: 'Infection / Serology', turnaround: 24, requiresFasting: false },
  { code: 'SERO005', name: 'Malaria Rapid Test (RDT)', category: 'Infection / Serology', turnaround: 1, requiresFasting: false },
  { code: 'SERO006', name: 'Dengue NS1 Antigen', category: 'Infection / Serology', turnaround: 4, requiresFasting: false },
  { code: 'SERO007', name: 'Dengue IgM / IgG Antibody', category: 'Infection / Serology', turnaround: 6, requiresFasting: false },
  { code: 'SERO008', name: 'CRP (C-Reactive Protein)', category: 'Infection / Serology', turnaround: 4, requiresFasting: false },
  { code: 'SERO009', name: 'ASO Titre (Anti-Streptolysin O)', category: 'Infection / Serology', turnaround: 24, requiresFasting: false },
  { code: 'SERO010', name: 'RA Factor (Rheumatoid Arthritis Factor)', category: 'Infection / Serology', turnaround: 8, requiresFasting: false },
  { code: 'SERO011', name: 'ANA (Antinuclear Antibody)', category: 'Infection / Serology', turnaround: 48, requiresFasting: false },
  { code: 'SERO012', name: 'VDRL (Syphilis)', category: 'Infection / Serology', turnaround: 24, requiresFasting: false },
  { code: 'SERO013', name: 'H. Pylori (Breath Test / Serology)', category: 'Infection / Serology', turnaround: 8, requiresFasting: false },
  { code: 'SERO014', name: 'Typhidot (Typhoid IgM / IgG)', category: 'Infection / Serology', turnaround: 4, requiresFasting: false },
  { code: 'SERO015', name: 'COVID-19 RT-PCR', category: 'Infection / Serology', turnaround: 24, requiresFasting: false },
  { code: 'SERO016', name: 'COVID-19 Rapid Antigen', category: 'Infection / Serology', turnaround: 1, requiresFasting: false },
  { code: 'SERO017', name: 'Anti-CCP (Anti-Cyclic Citrullinated Peptide)', category: 'Infection / Serology', turnaround: 48, requiresFasting: false },

  // ── Cardiac ────────────────────────────────────────────────────────────────────
  { code: 'CARD001', name: 'ECG (12-lead Electrocardiogram)', category: 'Cardiac', turnaround: 1, requiresFasting: false },
  { code: 'CARD002', name: 'Troponin I (Cardiac)', category: 'Cardiac', turnaround: 2, requiresFasting: false },
  { code: 'CARD003', name: 'CK-MB (Creatine Kinase MB)', category: 'Cardiac', turnaround: 4, requiresFasting: false },
  { code: 'CARD004', name: 'LDH (Lactate Dehydrogenase)', category: 'Cardiac', turnaround: 4, requiresFasting: false },
  { code: 'CARD005', name: 'BNP / Pro-BNP (B-type Natriuretic Peptide)', category: 'Cardiac', turnaround: 8, requiresFasting: false },
  { code: 'CARD006', name: 'D-Dimer', category: 'Cardiac', turnaround: 4, requiresFasting: false },
  { code: 'CARD007', name: '2D Echo (Echocardiography)', category: 'Cardiac', turnaround: 24, requiresFasting: false },

  // ── Urine ──────────────────────────────────────────────────────────────────────
  { code: 'URIN001', name: 'Urine Routine & Microscopy (Urine R/M)', category: 'Urine', turnaround: 2, requiresFasting: false },
  { code: 'URIN002', name: 'Urine Culture & Sensitivity', category: 'Urine', turnaround: 48, requiresFasting: false },
  { code: 'URIN003', name: 'Urine Pregnancy Test (UPT)', category: 'Urine', turnaround: 1, requiresFasting: false },
  { code: 'URIN004', name: 'Urine Creatinine', category: 'Urine', turnaround: 4, requiresFasting: false },
  { code: 'URIN005', name: '24-Hour Urine Protein', category: 'Urine', turnaround: 24, requiresFasting: false },

  // ── Stool ──────────────────────────────────────────────────────────────────────
  { code: 'STOL001', name: 'Stool Routine & Microscopy', category: 'Stool', turnaround: 4, requiresFasting: false },
  { code: 'STOL002', name: 'Stool Culture & Sensitivity', category: 'Stool', turnaround: 48, requiresFasting: false },
  { code: 'STOL003', name: 'Occult Blood in Stool (FOB)', category: 'Stool', turnaround: 4, requiresFasting: false },
  { code: 'STOL004', name: 'H. Pylori Stool Antigen', category: 'Stool', turnaround: 24, requiresFasting: false },

  // ── Hormones ──────────────────────────────────────────────────────────────────
  { code: 'HORM001', name: 'FSH (Follicle Stimulating Hormone)', category: 'Hormones', turnaround: 24, requiresFasting: false },
  { code: 'HORM002', name: 'LH (Luteinizing Hormone)', category: 'Hormones', turnaround: 24, requiresFasting: false },
  { code: 'HORM003', name: 'Prolactin', category: 'Hormones', turnaround: 24, requiresFasting: false },
  { code: 'HORM004', name: 'Testosterone (Total)', category: 'Hormones', turnaround: 24, requiresFasting: false },
  { code: 'HORM005', name: 'Estradiol (E2)', category: 'Hormones', turnaround: 24, requiresFasting: false },
  { code: 'HORM006', name: 'Progesterone', category: 'Hormones', turnaround: 24, requiresFasting: false },
  { code: 'HORM007', name: 'Beta-HCG (Pregnancy Test — Blood)', category: 'Hormones', turnaround: 8, requiresFasting: false },
  { code: 'HORM008', name: 'Cortisol (AM)', category: 'Hormones', turnaround: 24, requiresFasting: false },
  { code: 'HORM009', name: 'Insulin Fasting', category: 'Hormones', turnaround: 24, requiresFasting: true },
  { code: 'HORM010', name: 'PSA (Prostate Specific Antigen)', category: 'Hormones', turnaround: 24, requiresFasting: false },
  { code: 'HORM011', name: 'AMH (Anti-Müllerian Hormone)', category: 'Hormones', turnaround: 48, requiresFasting: false },

  // ── Tumour Markers ─────────────────────────────────────────────────────────────
  { code: 'TUMO001', name: 'CA-125 (Ovarian Cancer Marker)', category: 'Tumour Markers', turnaround: 48, requiresFasting: false },
  { code: 'TUMO002', name: 'CA 19-9 (Pancreatic Cancer Marker)', category: 'Tumour Markers', turnaround: 48, requiresFasting: false },
  { code: 'TUMO003', name: 'CEA (Carcinoembryonic Antigen)', category: 'Tumour Markers', turnaround: 48, requiresFasting: false },
  { code: 'TUMO004', name: 'AFP (Alpha-fetoprotein)', category: 'Tumour Markers', turnaround: 48, requiresFasting: false },
  { code: 'TUMO005', name: 'Total PSA + Free PSA', category: 'Tumour Markers', turnaround: 48, requiresFasting: false },

  // ── Microbiology ───────────────────────────────────────────────────────────────
  { code: 'MICR001', name: 'Blood Culture & Sensitivity', category: 'Microbiology', turnaround: 72, requiresFasting: false },
  { code: 'MICR002', name: 'Sputum Culture & Sensitivity', category: 'Microbiology', turnaround: 72, requiresFasting: false },
  { code: 'MICR003', name: 'Throat Swab Culture', category: 'Microbiology', turnaround: 48, requiresFasting: false },
  { code: 'MICR004', name: 'Wound Swab Culture', category: 'Microbiology', turnaround: 48, requiresFasting: false },
  { code: 'MICR005', name: 'AFB (Tuberculosis Smear)', category: 'Microbiology', turnaround: 24, requiresFasting: false },
  { code: 'MICR006', name: 'CB-NAAT / GeneXpert (TB PCR)', category: 'Microbiology', turnaround: 4, requiresFasting: false },

  // ── Radiology ──────────────────────────────────────────────────────────────────
  { code: 'XRAY001', name: 'X-Ray Chest PA View', category: 'Radiology', turnaround: 4, requiresFasting: false },
  { code: 'XRAY002', name: 'X-Ray Lumbar Spine (AP + Lateral)', category: 'Radiology', turnaround: 4, requiresFasting: false },
  { code: 'XRAY003', name: 'X-Ray KUB (Kidney, Ureter, Bladder)', category: 'Radiology', turnaround: 4, requiresFasting: false },
  { code: 'XRAY004', name: 'X-Ray Hand / Wrist', category: 'Radiology', turnaround: 4, requiresFasting: false },
  { code: 'XRAY005', name: 'X-Ray Knee (AP + Lateral)', category: 'Radiology', turnaround: 4, requiresFasting: false },
  { code: 'XRAY006', name: 'X-Ray PNS (Paranasal Sinuses)', category: 'Radiology', turnaround: 4, requiresFasting: false },

  // ── Ultrasound ─────────────────────────────────────────────────────────────────
  { code: 'USGR001', name: 'USG Abdomen & Pelvis', category: 'Ultrasound', turnaround: 4, requiresFasting: true },
  { code: 'USGR002', name: 'USG Lower Abdomen (Pelvis)', category: 'Ultrasound', turnaround: 4, requiresFasting: false },
  { code: 'USGR003', name: 'USG Thyroid', category: 'Ultrasound', turnaround: 4, requiresFasting: false },
  { code: 'USGR004', name: 'USG Breast (Bilateral)', category: 'Ultrasound', turnaround: 4, requiresFasting: false },
  { code: 'USGR005', name: 'USG Scrotal (Testes)', category: 'Ultrasound', turnaround: 4, requiresFasting: false },
  { code: 'USGR006', name: 'USG Doppler (Carotid / Peripheral)', category: 'Ultrasound', turnaround: 4, requiresFasting: false },

  // ── Other ──────────────────────────────────────────────────────────────────────
  { code: 'OTHR001', name: 'Spirometry (Pulmonary Function Test)', category: 'Other', turnaround: 4, requiresFasting: false },
  { code: 'OTHR002', name: 'Audiometry', category: 'Other', turnaround: 4, requiresFasting: false },
  { code: 'OTHR003', name: 'Pap Smear / Cervical Cytology', category: 'Other', turnaround: 72, requiresFasting: false },
  { code: 'OTHR004', name: 'Biopsy (Histopathology)', category: 'Other', turnaround: 168, requiresFasting: false },
  { code: 'OTHR005', name: 'FNAC (Fine Needle Aspiration Cytology)', category: 'Other', turnaround: 72, requiresFasting: false },
  { code: 'OTHR006', name: 'Semen Analysis', category: 'Other', turnaround: 24, requiresFasting: false },
  { code: 'OTHR007', name: 'Allergy Panel (IgE)', category: 'Other', turnaround: 48, requiresFasting: false },
];

// All unique categories
const LAB_CATEGORIES = [...new Set(LAB_TESTS.map((t) => t.category))];

// Search function
const searchTests = (query, limit = 20) => {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results = LAB_TESTS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
  );
  return results.slice(0, limit);
};

// Get tests by category
const getByCategory = (category) => LAB_TESTS.filter((t) => t.category === category);

module.exports = { LAB_TESTS, LAB_CATEGORIES, searchTests, getByCategory };
