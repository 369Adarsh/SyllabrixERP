/**
 * Syllabrix Business Type Registry — Frontend
 * Mirrors backend/src/config/businessTypes/registry.js exactly.
 * Source of truth: docs/SYLLABRIX_STANDARDS.md
 *
 * RULES:
 *  - Never renumber or remove an existing entry — codes are permanent
 *  - New types append at the end of their category section
 *  - categoryCode must match a SYL-BC-* code in SYLLABRIX_STANDARDS.md
 *  - typeCode format: SYL-BC-[CAT]-[LL][##]
 */

const REGISTRY = {
  // ── SYL-BC-GEN — General / Core ──────────────────────────────────────────
  FREELANCER:        { categoryCode: 'SYL-BC-GEN', typeCode: 'SYL-BC-GEN-FR01' },
  OTHER:             { categoryCode: 'SYL-BC-GEN', typeCode: 'SYL-BC-GEN-OT02' },

  // ── SYL-BC-RET — Retail & Commerce ───────────────────────────────────────
  MEDICAL_STORE:     { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-MS01' },
  STATIONARY:        { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-ST02' },
  SWEET_SHOP:        { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-SW03' },
  BAKERY:            { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-BK04' },
  JEWELLERY:         { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-JW05' },
  HARDWARE:          { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-HW06' },
  ELECTRICAL:        { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-EL07' },
  CLOTHING:          { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-CL08' },
  FOOTWEAR:          { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-FW09' },
  ELECTRONICS:       { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-EC10' },
  MOBILE_REPAIR:     { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-MR11' },
  OPTICAL:           { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-OP12' },
  BOOKSTORE:         { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-BS13' },
  FLORIST:           { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-FL14' },
  RETAIL:            { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-RT15' },
  KIRANA:            { categoryCode: 'SYL-BC-RET', typeCode: 'SYL-BC-RET-KR16' },

  // ── SYL-BC-FNB — Food & Beverage ─────────────────────────────────────────
  DHABA:             { categoryCode: 'SYL-BC-FNB', typeCode: 'SYL-BC-FNB-DH01' },
  CATERING:          { categoryCode: 'SYL-BC-FNB', typeCode: 'SYL-BC-FNB-CT02' },
  CLOUD_KITCHEN:     { categoryCode: 'SYL-BC-FNB', typeCode: 'SYL-BC-FNB-CK03' },
  JUICE_BAR:         { categoryCode: 'SYL-BC-FNB', typeCode: 'SYL-BC-FNB-JB04' },
  CANTEEN_MESS:      { categoryCode: 'SYL-BC-FNB', typeCode: 'SYL-BC-FNB-CM05' },
  RESTAURANT:        { categoryCode: 'SYL-BC-FNB', typeCode: 'SYL-BC-FNB-RS06' },

  // ── SYL-BC-EVT — Events & Functions ──────────────────────────────────────
  EVENT_PLANNER:     { categoryCode: 'SYL-BC-EVT', typeCode: 'SYL-BC-EVT-EP01' },
  DECORATOR:         { categoryCode: 'SYL-BC-EVT', typeCode: 'SYL-BC-EVT-DC02' },
  TENT_HOUSE:        { categoryCode: 'SYL-BC-EVT', typeCode: 'SYL-BC-EVT-TH03' },

  // ── SYL-BC-HLC — Healthcare ───────────────────────────────────────────────
  DENTAL:            { categoryCode: 'SYL-BC-HLC', typeCode: 'SYL-BC-HLC-DN01' },
  DIAGNOSTIC_LAB:    { categoryCode: 'SYL-BC-HLC', typeCode: 'SYL-BC-HLC-DL02' },
  PHYSIOTHERAPY:     { categoryCode: 'SYL-BC-HLC', typeCode: 'SYL-BC-HLC-PT03' },
  AYURVEDA:          { categoryCode: 'SYL-BC-HLC', typeCode: 'SYL-BC-HLC-AY04' },
  HOSPITAL:          { categoryCode: 'SYL-BC-HLC', typeCode: 'SYL-BC-HLC-HP05' },
  VET_CLINIC:        { categoryCode: 'SYL-BC-HLC', typeCode: 'SYL-BC-HLC-VC06' },
  CLINIC:            { categoryCode: 'SYL-BC-HLC', typeCode: 'SYL-BC-HLC-CL07' },

  // ── SYL-BC-FIT — Fitness & Sports ────────────────────────────────────────
  GYM:               { categoryCode: 'SYL-BC-FIT', typeCode: 'SYL-BC-FIT-GY01' },
  SPA:               { categoryCode: 'SYL-BC-FIT', typeCode: 'SYL-BC-FIT-SP02' },
  YOGA_STUDIO:       { categoryCode: 'SYL-BC-FIT', typeCode: 'SYL-BC-FIT-YS03' },
  MARTIAL_ARTS:      { categoryCode: 'SYL-BC-FIT', typeCode: 'SYL-BC-FIT-MA04' },
  SPORTS_ACADEMY:    { categoryCode: 'SYL-BC-FIT', typeCode: 'SYL-BC-FIT-SA05' },
  SWIMMING_ACADEMY:  { categoryCode: 'SYL-BC-FIT', typeCode: 'SYL-BC-FIT-SW06' },
  CROSSFIT_STUDIO:   { categoryCode: 'SYL-BC-FIT', typeCode: 'SYL-BC-FIT-CF07' },

  // ── SYL-BC-BPC — Beauty & Personal Care ──────────────────────────────────
  BEAUTY_PARLOUR:    { categoryCode: 'SYL-BC-BPC', typeCode: 'SYL-BC-BPC-BP01' },
  LAUNDRY:           { categoryCode: 'SYL-BC-BPC', typeCode: 'SYL-BC-BPC-LN03' },
  TAILORING:         { categoryCode: 'SYL-BC-BPC', typeCode: 'SYL-BC-BPC-TL04' },
  BARBERSHOP:        { categoryCode: 'SYL-BC-BPC', typeCode: 'SYL-BC-BPC-BR05' },
  SALON:             { categoryCode: 'SYL-BC-BPC', typeCode: 'SYL-BC-BPC-SL06' },

  // ── SYL-BC-EDU — Education ───────────────────────────────────────────────
  HOME_TUITION:      { categoryCode: 'SYL-BC-EDU', typeCode: 'SYL-BC-EDU-HT01' },
  MUSIC_SCHOOL:      { categoryCode: 'SYL-BC-EDU', typeCode: 'SYL-BC-EDU-MS02' },
  DANCE_ACADEMY:     { categoryCode: 'SYL-BC-EDU', typeCode: 'SYL-BC-EDU-DA03' },
  DRIVING_SCHOOL:    { categoryCode: 'SYL-BC-EDU', typeCode: 'SYL-BC-EDU-DS04' },
  COMPUTER_TRAINING: { categoryCode: 'SYL-BC-EDU', typeCode: 'SYL-BC-EDU-CT05' },
  COACHING:          { categoryCode: 'SYL-BC-EDU', typeCode: 'SYL-BC-EDU-CG06' },

  // ── SYL-BC-PRO — Professional Services ───────────────────────────────────
  CA_FIRM:           { categoryCode: 'SYL-BC-PRO', typeCode: 'SYL-BC-PRO-CA01' },
  LAW_FIRM:          { categoryCode: 'SYL-BC-PRO', typeCode: 'SYL-BC-PRO-LF02' },
  REAL_ESTATE:       { categoryCode: 'SYL-BC-PRO', typeCode: 'SYL-BC-PRO-RE03' },
  INSURANCE_AGENCY:  { categoryCode: 'SYL-BC-PRO', typeCode: 'SYL-BC-PRO-IA04' },
  TRAVEL_AGENCY:     { categoryCode: 'SYL-BC-PRO', typeCode: 'SYL-BC-PRO-TA05' },
  PHOTOGRAPHY:       { categoryCode: 'SYL-BC-PRO', typeCode: 'SYL-BC-PRO-PH06' },
  DIGITAL_AGENCY:    { categoryCode: 'SYL-BC-PRO', typeCode: 'SYL-BC-PRO-DG07' },

  // ── SYL-BC-TRN — Transport & Logistics ───────────────────────────────────
  CAB_SERVICE:       { categoryCode: 'SYL-BC-TRN', typeCode: 'SYL-BC-TRN-CB01' },
  TRANSPORT:         { categoryCode: 'SYL-BC-TRN', typeCode: 'SYL-BC-TRN-TR02' },
  CAR_RENTAL:        { categoryCode: 'SYL-BC-TRN', typeCode: 'SYL-BC-TRN-CR03' },
  COURIER:           { categoryCode: 'SYL-BC-TRN', typeCode: 'SYL-BC-TRN-CO04' },
  PACKERS_MOVERS:    { categoryCode: 'SYL-BC-TRN', typeCode: 'SYL-BC-TRN-PM05' },

  // ── SYL-BC-CND — Construction & Design ───────────────────────────────────
  CONSTRUCTION:      { categoryCode: 'SYL-BC-CND', typeCode: 'SYL-BC-CND-CN01' },
  INTERIOR_DESIGN:   { categoryCode: 'SYL-BC-CND', typeCode: 'SYL-BC-CND-ID02' },
  CO_WORKING:        { categoryCode: 'SYL-BC-CND', typeCode: 'SYL-BC-CND-CW03' },
  WORKSHOP:          { categoryCode: 'SYL-BC-CND', typeCode: 'SYL-BC-CND-WS04' },

  // ── SYL-BC-B2B — Trade & Supply ──────────────────────────────────────────
  DEALER:            { categoryCode: 'SYL-BC-B2B', typeCode: 'SYL-BC-B2B-DL01' },
  SUPPLIER:          { categoryCode: 'SYL-BC-B2B', typeCode: 'SYL-BC-B2B-SP02' },
  WHOLESALE:         { categoryCode: 'SYL-BC-B2B', typeCode: 'SYL-BC-B2B-WS03' },

  // ── SYL-BC-SVC — Other Services ──────────────────────────────────────────
  PEST_CONTROL:      { categoryCode: 'SYL-BC-SVC', typeCode: 'SYL-BC-SVC-PC01' },
  MALL:              { categoryCode: 'SYL-BC-SVC', typeCode: 'SYL-BC-SVC-ML03' },
};

export default REGISTRY;
