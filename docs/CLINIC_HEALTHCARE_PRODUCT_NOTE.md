# Syllabrix Healthcare Product Note
## Clinic → Nursing Home → Hospital — Complete Product Specification

**Version:** 1.0  
**Date:** June 2026  
**Category Code:** `SYL-BC-HLC` (Healthcare)  
**Prepared by:** Syllabrix Product Team

---

## 1. Business Type Registry

### 1.1 Category

| Field | Value |
|---|---|
| **Category Name** | Healthcare |
| **Category Code** | `SYL-BC-HLC` |
| **Namespace** | HLC |
| **Target Market** | Private clinics, nursing homes, small hospitals, diagnostic labs, specialty centers |
| **India Market Size** | ~6.5 lakh private clinics + ~70,000 nursing homes + ~43,000 small hospitals |

---

### 1.2 Business Type IDs

| Business Type | Enum Key | Type Code | Description | Tier |
|---|---|---|---|---|
| Clinic | `CLINIC` | `SYL-BC-HLC-CL07` | Solo / 2–3 doctor OPD clinic, outpatient only | 1 — Starter |
| Nursing Home | `NURSING_HOME` | `SYL-BC-HLC-NH08` | OPD + IPD, 5–30 beds, basic pharmacy, minor OT | 2 — Growth |
| Hospital | `HOSPITAL` | `SYL-BC-HLC-HP05` | Full OPD + IPD + Lab + Pharmacy + Radiology + OT | 3 — Enterprise |
| Dental | `DENTAL` | `SYL-BC-HLC-DN01` | Dental clinic with chair management | Specialty |
| Diagnostic Lab | `DIAGNOSTIC_LAB` | `SYL-BC-HLC-DL02` | Standalone pathology / diagnostic center | Specialty |
| Physiotherapy | `PHYSIOTHERAPY` | `SYL-BC-HLC-PT03` | Physio clinic with session + progress tracking | Specialty |
| Ayurveda | `AYURVEDA` | `SYL-BC-HLC-AY04` | Ayurvedic clinic with Panchakarma modules | Specialty |
| Vet Clinic | `VET_CLINIC` | `SYL-BC-HLC-VC06` | Veterinary practice with pet patient records | Specialty |

> **Note:** `NURSING_HOME (NH08)` is a new type to be registered in the Prisma enum and registry.

---

### 1.3 Pricing Tiers

| Tier | Business Type | Monthly Price | Target |
|---|---|---|---|
| Solo Doctor | CLINIC | ₹999/mo | 1 doctor, 1 location |
| Small Clinic | CLINIC | ₹1,999/mo | Up to 3 doctors, WhatsApp automation |
| Nursing Home | NURSING_HOME | ₹2,999–4,999/mo | IPD + pharmacy, multi-staff |
| Small Hospital | HOSPITAL | ₹5,999–9,999/mo | Full suite, multi-department |
| Enterprise | HOSPITAL | Custom | Multi-branch hospital chains |

> **Pricing principle:** No per-consultation commissions. No marketplace cut. No data lock-in. Patient data export always free.

---

## 2. Module Specification — All Three Tiers

> **Legend:** ✅ Included | 🔶 Enhanced version | ❌ Not included

---

### MODULE 1 — Patient Registration & Medical Profile

**Available in:** CLINIC ✅ | NURSING HOME ✅ | HOSPITAL ✅

**Purpose:** Centralized patient record that persists across all visits, departments, and doctors.

| Feature | Detail |
|---|---|
| Basic demographics | Name, DOB (age auto-calculated), gender, marital status |
| Contact | Mobile (primary identifier), alternate phone, email, address (district, state, pin) |
| ABHA ID | Ayushman Bharat Health Account ID — scan QR for instant profile pull |
| UHID | Unique Hospital ID — auto-generated on first registration |
| Medical identifiers | Blood group, allergies (drug, food, environmental — with severity flag) |
| Chronic conditions | Diabetes, hypertension, thyroid, asthma — flagged prominently on every screen |
| Medical history | Past surgeries, hospitalizations, family history (free text + structured) |
| Insurance details | Policy number, TPA name, company, validity date |
| Referred by | Doctor name or source (word-of-mouth, Google, Practo) |
| Emergency contact | Name, relationship, phone |
| Patient photo | Optional — for identification in busy OPDs |
| Visit timeline | All visits, prescriptions, lab reports, vitals in chronological view |
| Tags | e.g., VIP, Diabetic, Hypertensive, Pregnant — color-coded |
| Data portability | Export full patient record as PDF anytime — patient's right to their data |

---

### MODULE 2 — OPD Queue & Token Management

**Available in:** CLINIC ✅ | NURSING HOME ✅ | HOSPITAL ✅

**Purpose:** Replace paper token registers and manual name-calling with a live digital queue.

| Feature | Detail |
|---|---|
| Token assignment | Auto-increment token per day (resets at midnight) |
| Multi-doctor queue | Separate queue per doctor when 2+ doctors in same facility |
| Token statuses | WAITING → CALLED → IN_CONSULTATION → COMPLETED / NO_SHOW |
| Live queue display | Full-screen TV board mode showing current token and next 3 tokens |
| WhatsApp queue update | Patient receives: "Token #14 assigned. Currently serving #9. Est. wait: 25 min" |
| Walk-in + pre-booked | Walk-ins get tokens; pre-booked appointments get reserved slots |
| Token recall | Receptionist can call a token out of order (emergency) |
| No-show handling | Skip token, mark NO_SHOW, auto-move to next |
| Estimated wait time | Calculated from avg. consultation duration of that doctor |
| Day statistics | Total tokens issued, avg. wait time, no-show rate per day |
| Priority queue | Emergency / senior citizen fast-track lane |

---

### MODULE 3 — Vitals Recording

**Available in:** CLINIC ✅ | NURSING HOME ✅ | HOSPITAL ✅

**Purpose:** Nurse records patient vitals before consultation; doctor sees them on EMR screen.

| Feature | Detail |
|---|---|
| Vitals captured | BP (systolic/diastolic), pulse rate, temperature (°C/°F), weight (kg), height (cm), SpO2, blood glucose (random/fasting/PP), respiratory rate |
| BMI auto-calculation | Auto-calculated from weight and height |
| Visit-linked | Each vitals entry linked to specific appointment/visit |
| Vitals history | Graph of BP, weight, glucose over time — critical for chronic disease management |
| Abnormal flag | Values outside normal range highlighted in red (e.g., BP > 140/90) |
| Nurse workflow | Separate nurse login view: quick vitals entry form, patient queue showing who's next |
| Pediatric norms | Age-adjusted normal ranges for patients under 18 |

---

### MODULE 4 — EMR / Clinical Notes (SOAP)

**Available in:** CLINIC ✅ | NURSING HOME 🔶 | HOSPITAL 🔶

**Purpose:** Structured digital record of every consultation. The core of clinical documentation.

| Feature | Detail |
|---|---|
| SOAP format | S (Subjective), O (Objective), A (Assessment), P (Plan) |
| S — Subjective | Chief complaint, history of present illness, duration, associated symptoms, review of systems |
| O — Objective | Auto-populated from Vitals module + free text for examination findings |
| A — Assessment | Diagnosis (free text + optional ICD-10 code search) |
| P — Plan | Links to Prescription, Lab Orders, Follow-up date |
| Specialty templates | General Medicine, Pediatrics, Gynecology/Obstetrics, Orthopedics, ENT, Dermatology, Ophthalmology — 7 templates |
| Previous visit pull | One click to view last 5 visits' SOAP notes |
| Copy forward | Copy previous assessment/plan as starting point (useful for follow-ups) |
| Chronic condition summary | Always-visible sidebar: patient's known conditions, current medications, allergies |
| Doctor access only | Receptionist and lab tech cannot view EMR notes |
| Audit trail | Every edit timestamped with doctor's name |
| IPD Progress Notes (NH/H) | Daily rounds note format for admitted patients — replaces per-appointment SOAP |

---

### MODULE 5 — Prescription Management

**Available in:** CLINIC ✅ | NURSING HOME ✅ | HOSPITAL ✅

**Purpose:** Digital prescription creation, delivery, and verification. The most critical clinical module.

| Feature | Detail |
|---|---|
| Drug database | 20,000+ Indian medicines — generic name, brand names, formulations |
| Drug search | Search by generic or brand name, auto-suggest top matches |
| Prescription builder | Add drug → formulation → dose → frequency → duration → instructions |
| Indian frequency codes | OD, BD, TDS, QID, HS, SOS, stat, AC (before food), PC (after food) |
| Duration options | Days, weeks, months — "continue till review" option |
| Instructions | Before/after food, with water, avoid milk, avoid sunlight, etc. |
| Drug interaction check | Flag dangerous combinations (e.g., warfarin + aspirin) |
| Schedule H/H1/X flag | Controlled drug warning on add; Schedule X requires manual override |
| Allergy cross-check | Auto-warn if prescribed drug matches patient's known allergy |
| Dosage by weight | Pediatric dose calculator (mg/kg) — doctor enters weight, system suggests dose |
| Prescription header | Clinic letterhead: doctor name, degrees, MCI/state registration number, clinic address, timings, phone |
| Print formats | A4, A5, thermal (80mm) — all supported |
| WhatsApp delivery | One tap to send PDF prescription via WhatsApp to patient's number |
| Email delivery | PDF to patient email |
| QR code on Rx | Unique QR on every prescription — links to verification page |
| Verification page | Public page: doctor credentials, Rx date, medicines, validity — pharmacist scans to verify |
| Mark as dispensed | Pharmacist can mark Rx dispensed — prevents Schedule H re-use |
| Rx history | All prescriptions in patient timeline, doctor can compare across visits |
| Regional language | Prescription output in Hindi, Marathi, Bengali, Tamil, Telugu (Phase 3) |
| Reprint | Any past prescription can be reprinted or re-sent |

---

### MODULE 6 — Lab Orders & Reports

**Available in:** CLINIC ✅ | NURSING HOME ✅ | HOSPITAL 🔶 (LIMS)

**Purpose:** Close the referral loop — order tests from EMR, receive reports digitally, attach to patient record.

| Feature | Detail |
|---|---|
| Test catalog | Common tests pre-loaded (CBC, LFT, RFT, KFT, Lipid Profile, HbA1c, TSH, Urine R/M, ECG, X-Ray, USG Abdomen) |
| Lab order from EMR | One click from SOAP Plan section — select tests, select lab center |
| Lab center directory | Preferred diagnostic centers with contact details |
| Referral slip | Auto-generated PDF: patient name, tests ordered, doctor name, date — printable + WhatsApp |
| Report upload | Receptionist or lab uploads PDF report, attaches to patient record |
| Doctor notification | Dashboard alert + optional WhatsApp when report is uploaded |
| Patient notification | "Your CBC report is ready. Tap to view." — sent via WhatsApp |
| Abnormal value flag | AI reads uploaded report and flags values outside normal range in red |
| Report history | All reports in patient timeline, grouped by type |
| In-house lab (NH/H) | If facility has own lab — integrated with LIMS module |

---

### MODULE 7 — Billing & Invoicing

**Available in:** CLINIC ✅ | NURSING HOME 🔶 | HOSPITAL 🔶

**Purpose:** Generate accurate bills with correct GST treatment for healthcare services.

| Feature | Detail |
|---|---|
| Bill components | Consultation fee + procedure charges + medicine charges + diagnostic charges |
| GST treatment | Consultation/treatment = GST exempt; medicines sold = taxable at applicable rate; cosmetic procedures = 18% GST |
| Split billing | Each line item has correct GST treatment — single bill, multiple tax buckets |
| Consultation fee types | First visit, follow-up, specialist, emergency — different rate per type |
| Procedure charges | Dressing, injection, nebulization, ECG, minor surgery — pre-configured with price |
| Auto-invoice | Appointment marked COMPLETED → draft invoice auto-created with service price |
| Payment modes | Cash, UPI (GPay/PhonePe/Paytm QR), card — multi-mode on single bill |
| Thermal print | 58mm and 80mm receipt format — direct to thermal printer |
| A4 invoice print | Full detailed invoice on A4 letterhead |
| Pending / outstanding | Track unpaid bills per patient |
| Day-end summary | Total collections: consultation + procedures + medicines, split by payment mode |
| Credit note | Issue refunds or adjustments |
| Advance deposit (NH/H) | Collect advance against admission; adjust against final bill |
| Package billing (NH/H) | Delivery package, surgical package — flat-fee billing |
| Insurance/TPA (NH/H) | Policy number, TPA, pre-authorization code, cashless flag, claim status |

---

### MODULE 8 — Medicine Inventory & Dispensary

**Available in:** CLINIC ✅ (basic) | NURSING HOME 🔶 | HOSPITAL 🔶

**Purpose:** Track medicine stock, manage dispensing, ensure expiry compliance.

| Feature | Detail |
|---|---|
| Medicine master | Generic name, brand, manufacturer, formulation, strength, MRP |
| Batch & expiry | Per batch: batch number, manufacturing date, expiry date, quantity |
| Stock entry | Purchase from distributor — quantity, rate, invoice number (for GST) |
| Stock deduction | Auto-deduct on dispensing (linked to billing) |
| Expiry alerts | 90-day and 30-day advance warnings on dashboard |
| Reorder alert | Alert when stock falls below reorder level |
| Consumables | Syringes, gloves, IV sets, dressings — separate consumables stock |
| Supplier master | Distributor name, phone, GST number, credit terms |
| Purchase orders | Generate PO to supplier; track delivery |
| Schedule H register | Mandatory log for Schedule H and Schedule X drugs — auto-maintained |
| Stock report | Current stock value, near-expiry list, fast-moving vs slow-moving items |
| Dispensary billing | Medicine billing at clinic — with patient name, Rx number, batch |
| Return to supplier | Track medicine returns with debit note |

---

### MODULE 9 — Staff Management

**Available in:** CLINIC ✅ | NURSING HOME ✅ | HOSPITAL ✅

**Purpose:** Manage all clinical and administrative staff with role-based access.

| Feature | Detail |
|---|---|
| Staff profiles | Name, photo, designation, department, qualifications, certifications |
| Doctor profile | Specialization, MCI/state registration number, consultation fee, available days/timings |
| Role-based access | DOCTOR, RECEPTIONIST, NURSE, LAB_TECHNICIAN, WARD_BOY, PHARMACIST, ADMIN, OWNER |
| Permission matrix | Granular: receptionist can book appointments but cannot view EMR; nurse can record vitals but not billing |
| Shift management | Morning OPD, evening OPD, night duty — shift assignment per staff |
| Leave management | Apply, approve, track — leave balance auto-calculated |
| Multi-doctor support | Unlimited doctors per location, each with own consultation schedule |
| Audit log | Which staff accessed which patient record, when — HIPAA-style audit trail |
| Staff contact | Emergency contacts, bank details for payroll |

---

### MODULE 10 — Attendance

**Available in:** CLINIC ✅ | NURSING HOME ✅ | HOSPITAL ✅

| Feature | Detail |
|---|---|
| Manual attendance | Mark IN/OUT from dashboard |
| Biometric integration | ZKTeco, FingerJet — auto-push from device |
| Mobile attendance | GPS-tagged check-in from mobile app |
| Daily hours | Auto-calculated from punch IN/OUT |
| Overtime tracking | Hours beyond shift duration flagged as OT |
| Monthly summary | Working days, absent days, leave days, OT hours per staff |
| Shift-wise report | Attendance by shift (morning/evening/night) |

---

### MODULE 11 — WhatsApp Automation

**Available in:** CLINIC ✅ | NURSING HOME ✅ | HOSPITAL ✅

**Purpose:** Replace manual receptionist WhatsApp messages with automated, professional flows.

| Automation Flow | Trigger | Message Sent |
|---|---|---|
| Booking confirmation | Appointment booked | "Your appointment with Dr. [Name] on [Date] at [Time] is confirmed. Clinic: [Address]" |
| Day-before reminder | 24 hours before appointment | "Reminder: Your appointment is tomorrow. Token will be issued on arrival." |
| Queue update | Token called / position changes | "Token #14 assigned. Now serving #9. Estimated wait: 25 min. You may arrive now." |
| Prescription delivery | Prescription generated | "Your prescription from Dr. [Name] is ready. [PDF link]. QR code for pharmacy." |
| Lab report ready | Report uploaded | "Your [CBC] report is ready. View here: [link]. Please discuss with Dr. [Name]." |
| Follow-up reminder | 3 days before follow-up date | "Dr. [Name] has scheduled your follow-up on [Date]. Reply YES to confirm." |
| Post-visit feedback | After COMPLETED status | "How was your experience with Dr. [Name] today? Rate 1–5." |
| Birthday message | Patient DOB | "Happy Birthday! [Clinic Name] wishes you good health." |
| Advance deposit receipt | Payment received | "Advance of ₹[amount] received against admission. Receipt: [number]." |
| Two-way reply | Patient replies YES/CANCEL | Auto-confirms or cancels appointment; notifies receptionist |
| Receptionist inbox | Any inbound patient message | All patient WhatsApp messages visible inside Syllabrix — not on personal phones |

> **Infrastructure:** WhatsApp Business API via AiSensy / Wati partnership. Never personal WhatsApp (violates Meta ToS).

---

### MODULE 12 — Expense Tracking & Clinic P&L

**Available in:** CLINIC ✅ | NURSING HOME ✅ | HOSPITAL ✅

**Purpose:** Give doctors a true P&L view — the feature no competitor offers.

| Feature | Detail |
|---|---|
| Expense categories | Staff salaries, rent, electricity, water, internet, medicine purchases, equipment maintenance, lab reagents, consumables, insurance premiums, marketing |
| Revenue tracking | Consultation fees + procedures + medicines + diagnostics — per day/month |
| P&L statement | Revenue − Expenses = Net Profit — daily, monthly, yearly |
| Per-doctor revenue | In multi-doctor setups: revenue attributed to each doctor |
| GST summary | Taxable income vs exempt income — for CA/GST filing |
| Outstanding receivables | Pending insurance claims, credit patients |
| Cash flow view | Money in vs money out per week |
| Year-over-year | Compare current month to same month last year |
| Export | Excel/PDF export for CA/accountant |

---

### MODULE 13 — Reports & Analytics

**Available in:** CLINIC ✅ | NURSING HOME ✅ | HOSPITAL ✅

| Report | What it shows |
|---|---|
| Daily OPD Summary | Patients seen, collections, new vs. repeat, no-shows |
| Monthly Revenue | Trend line, peak days, revenue breakdown |
| Patient Growth | New registrations per month, retention rate |
| Diagnosis Frequency | Top 10 diagnoses — useful for specialty focus decisions |
| Top Medicines Prescribed | Inventory planning input |
| No-Show Analysis | No-show rate by day/time/doctor — helps scheduling decisions |
| Staff Attendance | Monthly summary per staff |
| Inventory Valuation | Current stock value, near-expiry items |
| Pending Lab Reports | Lab orders without reports filed |
| Doctor-wise Performance | Patients seen, revenue, avg. consultation time per doctor |
| IPD Occupancy (NH/H) | Bed occupancy rate, avg. length of stay, discharge trend |
| Insurance Claims (NH/H) | Pending claims, settled claims, claim rejection rate |

---

### MODULE 14 — AI Copilot (Prescription Suggestions)

**Available in:** CLINIC ✅ | NURSING HOME ✅ | HOSPITAL ✅

**Purpose:** Reduce prescription writing from 3 minutes to 30 seconds using AI.

| Feature | Detail |
|---|---|
| Symptom → diagnosis suggestion | Type chief complaint → AI suggests top 3 likely diagnoses |
| Diagnosis → Rx template | Select diagnosis → AI suggests standard prescription for that condition |
| Age-weight adjusted dosing | Pediatric dose auto-adjusted based on patient age/weight |
| Chronic condition awareness | AI considers patient's known conditions (e.g., avoids NSAIDs for CKD patient) |
| Drug interaction check | AI flags dangerous combinations before adding to Rx |
| Doctor's own pattern learning | Over time, learns individual doctor's prescribing habits and improves suggestions |
| Language | Suggestions always in English; output prescription in doctor's preferred language |

> **Powered by:** Groq API (already integrated in Syllabrix backend)

---

### MODULE 15 — QR-Verified Digital Prescription (Differentiator)

**Available in:** CLINIC ✅ | NURSING HOME ✅ | HOSPITAL ✅

**Purpose:** Only Indian clinic ERP offering pharmacy-verifiable digital prescriptions.

| Feature | Detail |
|---|---|
| Unique QR on every Rx | Each prescription has a unique Syllabrix QR code |
| Verification page | `syllabrix.com/rx/[unique-id]` — shows: doctor name, MCI reg, Rx date, medicines, validity |
| Pharmacist verification | Pharmacist scans QR → confirms Rx is genuine and unmodified |
| Mark dispensed | Pharmacist can mark Rx dispensed — prevents Schedule H re-use |
| Tamper detection | QR links to original data — any alteration to printed Rx is detectable |
| Validity period | Rx valid for 3 days (general), 1 month (Schedule H), 6 months (chronic) |

---

### MODULE 16 — ABDM / ABHA Integration

**Available in:** CLINIC ✅ | NURSING HOME ✅ | HOSPITAL ✅

| Feature | Detail |
|---|---|
| ABHA ID capture | Manual entry or scan ABHA QR at registration |
| Scan & Share | Patient scans clinic QR → profile auto-populated in 30 seconds |
| Health record push | Prescriptions and lab reports pushed to patient's ABHA locker (consent-based) |
| Facility registration | Register clinic on HFR (Health Facility Registry) — ABDM compliance |
| Doctor registration | Doctor registered on HPR (Health Professional Registry) |
| ABDM compliance badge | Visible on clinic's Syllabrix profile — builds trust |

---

### MODULE 17 — Bed & Ward Management *(Nursing Home + Hospital only)*

**Available in:** CLINIC ❌ | NURSING HOME ✅ | HOSPITAL ✅

| Feature | Detail |
|---|---|
| Ward master | ICU, General, Private, Semi-Private, Maternity, Pediatric |
| Bed master | Bed number, ward, type (AC/Non-AC), daily rate |
| Live bed board | Color-coded: Occupied (red), Available (green), Under cleaning (yellow), Reserved (blue) |
| Occupancy dashboard | Total beds, occupied, available — live percentage |
| Bed allocation | Assign bed on admission; transfer to different ward |
| Bed release | Mark bed "under cleaning" after discharge; available after cleaning confirmation |
| Daily occupancy report | Bed occupancy rate, average length of stay |

---

### MODULE 18 — IPD Admission Management *(Nursing Home + Hospital only)*

**Available in:** CLINIC ❌ | NURSING HOME ✅ | HOSPITAL ✅

| Feature | Detail |
|---|---|
| Admit patient | Patient registration → admission form → bed assignment → MLC if required |
| Admission details | Admission diagnosis, admitting doctor, ward, bed, attendant name and phone |
| MLC flag | Medico-Legal Case flag for accidents, assaults — auto-alerts admin |
| Advance deposit | Collect advance; shown on admission slip |
| Daily charges | Room rent, nursing charges, O2 charges — auto-accumulate per day |
| Diet orders | Send diet instructions to kitchen/dietitian |
| Transfer | Transfer patient between beds/wards with reason |
| Referral | Refer to higher center — generates referral letter |
| Discharge process | Discharge summary → final bill → clearance from pharmacy/lab → discharge slip |
| Discharge types | Regular, LAMA (Left Against Medical Advice), Absconded, Transferred, Death |
| Census report | Daily inpatient census — admissions, discharges, deaths, transfers |

---

### MODULE 19 — Daily Rounds & Progress Notes *(Nursing Home + Hospital only)*

**Available in:** CLINIC ❌ | NURSING HOME ✅ | HOSPITAL ✅

| Feature | Detail |
|---|---|
| IPD rounds list | Doctor sees list of all current IPD patients sorted by ward |
| Daily progress note | Date, vitals (auto-linked from nurse entry), examination findings, treatment changes |
| Running problem list | Tracks active problems for each admitted patient |
| Multi-doctor notes | Multiple doctors can write progress notes on same patient |
| Order sheet | Doctor writes orders: new medicines, investigations, diet changes, nursing instructions |
| Nurse acknowledgment | Nurse marks each order as executed with timestamp |
| Night notes | Night duty doctor's separate note format |
| High-risk patient flag | ICU patients, critical patients highlighted prominently |

---

### MODULE 20 — Nursing Charts / MAR *(Nursing Home + Hospital only)*

**Available in:** CLINIC ❌ | NURSING HOME ✅ | HOSPITAL ✅

**MAR = Medication Administration Record**

| Feature | Detail |
|---|---|
| Drug schedule | All prescribed drugs with scheduled administration times (8AM/2PM/8PM/2AM) |
| Administration recording | Nurse marks each dose: Given / Held / Refused / Not Available |
| Nurse signature | Digital acknowledgment per entry |
| IV fluid chart | IV fluid type, rate, total volume, start/stop time |
| Intake-output chart | Fluids in (oral + IV) vs fluids out (urine + drain) — critical for ICU |
| Vitals chart | Nursing vitals entry: BP, temp, pulse, RR at scheduled intervals |
| Allergy alert | Patient allergy prominently displayed on MAR screen |
| Missed dose alert | Supervisor notified if dose not marked within 30 min of scheduled time |

---

### MODULE 21 — Discharge Summary *(Nursing Home + Hospital only)*

**Available in:** CLINIC ❌ | NURSING HOME ✅ | HOSPITAL ✅

| Feature | Detail |
|---|---|
| Auto-populated fields | Patient demographics, admission date, admitting diagnosis, ward/bed — auto-filled |
| Clinical summary | Doctor fills: history, examination on admission, investigations done, treatment given |
| Diagnosis on discharge | Final diagnosis (ICD-10 optional) |
| Operative notes | Procedure/surgery performed (if any) |
| Condition at discharge | Stable / Improved / LAMA / Referred |
| Discharge medications | Medicines to continue at home — auto-populated from MAR, editable |
| Follow-up instructions | Follow-up date, restrictions, diet advice |
| Print format | Professional A4 layout on hospital letterhead |
| WhatsApp delivery | Discharge summary PDF sent to patient's WhatsApp |
| Digital signature | Doctor's digital signature / QR for verification |

---

### MODULE 22 — Operation Theatre Management *(Nursing Home + Hospital only)*

**Available in:** CLINIC ❌ | NURSING HOME ✅ (basic) | HOSPITAL 🔶 (advanced)

| Feature | Detail |
|---|---|
| OT scheduling | Schedule procedures: date, time, OT room, surgeon, anesthesiologist, type (elective/emergency) |
| OT clearance | Pre-op checklist: consent signed, investigations done, NPO status, anesthesia fitness |
| OT notes | Intraoperative notes: procedure performed, findings, complications |
| Anesthesia notes | Type (GA/SA/LA), drugs used, any complications |
| OT consumables | Materials used — deducted from inventory |
| Post-op orders | Recovery room instructions, pain management orders |
| OT utilization report | OT hours used vs available, surgeon-wise statistics |

---

### MODULE 23 — LIMS — Laboratory *(Hospital only)*

**Available in:** CLINIC ❌ | NURSING HOME ❌ | HOSPITAL ✅

| Feature | Detail |
|---|---|
| Test catalog | 500+ tests: Hematology, Biochemistry, Microbiology, Serology, Histopathology, Urine |
| Sample collection | Barcode-labeled sample tubes, collection list per patient |
| Sample tracking | Sample in lab → processing → result entry → report ready |
| Result entry | Numeric fields with reference ranges; auto-flag abnormal values |
| Report generation | Professional report with lab letterhead, doctor name, reference ranges, flag |
| Critical value alert | Immediately alerts doctor if result is critically abnormal (panic values) |
| Report delivery | Print + WhatsApp + email + ABHA push |
| QC tracking | Internal quality control records for NABL compliance |
| TAT tracking | Turnaround time per test — alerts if beyond SLA |
| Reflex testing | Auto-order follow-up test based on result (e.g., positive HBsAg → HBV DNA) |
| Lab billing integration | Charges auto-linked to patient bill |

---

### MODULE 24 — Radiology *(Hospital only)*

**Available in:** CLINIC ❌ | NURSING HOME ❌ | HOSPITAL ✅

| Feature | Detail |
|---|---|
| Radiology order | Doctor orders from EMR: X-ray, USG, CT, MRI, ECG, 2D Echo |
| Worklist | Technician sees pending orders on radiology workstation |
| Report entry | Radiologist types findings and impression |
| Image attachment | Attach JPEG/DICOM images to report |
| Report delivery | Print + WhatsApp + email to patient and ordering doctor |
| Radiology billing | Linked to patient bill |

---

### MODULE 25 — Insurance & TPA Management *(Hospital + Nursing Home)*

**Available in:** CLINIC 🔶 (basic) | NURSING HOME ✅ | HOSPITAL ✅

| Feature | Detail |
|---|---|
| Insurance master | CGHS, ECHS, ESI, all major corporate TPA schemes |
| Policy capture | Policy number, member ID, validity, coverage amount |
| Pre-authorization | Track pre-auth request, approval number, approved amount |
| Cashless flag | Mark admission as cashless — billing goes to TPA, not patient |
| Claim preparation | Generate claim documents: case summary, bills, investigation reports |
| Claim submission | Track submission date, claim number |
| Claim status | Pending / Under query / Approved / Rejected / Settled |
| Rejection analysis | Track common rejection reasons to improve claim quality |
| Outstanding report | Pending claims value per insurer |

---

## 3. Role Matrix — All Three Tiers

| Role | Clinic | Nursing Home | Hospital | Key Permissions |
|---|---|---|---|---|
| OWNER | ✅ | ✅ | ✅ | Full access — all modules, billing, reports, settings |
| ADMIN | ✅ | ✅ | ✅ | All except settings/billing limits |
| DOCTOR | ✅ | ✅ | ✅ | EMR, prescriptions, lab orders, appointments — no billing |
| RECEPTIONIST | ✅ | ✅ | ✅ | Registration, appointments, queue, billing — no EMR |
| NURSE | ✅ | ✅ | ✅ | Vitals, MAR, nursing notes — no billing |
| LAB_TECHNICIAN | ✅ | ✅ | ✅ | Lab orders, report upload — no billing |
| WARD_NURSE | ❌ | ✅ | ✅ | IPD nursing charts, daily vitals, MAR |
| WARD_BOY | ❌ | ✅ | ✅ | Bed status update only |
| PHARMACIST | ❌ | ✅ | ✅ | Dispensary billing, stock, Schedule H log |
| RADIOLOGIST | ❌ | ❌ | ✅ | Radiology reports, worklist |
| ANESTHESIOLOGIST | ❌ | ✅ | ✅ | OT notes, anesthesia records |
| ACCOUNTANT | ✅ | ✅ | ✅ | Billing, expenses, reports — no clinical data |
| CASHIER | ✅ | ✅ | ✅ | Billing and payment only |

---

## 4. Competitor Analysis — 12 Platforms

---

### 4.1 Practo Ray

**Type:** Cloud SaaS | **Origin:** India (Bangalore) | **Founded:** 2008

**Target:** All clinic sizes; marketplace integration

**Pricing:**
- Basic: ₹1,000/month/doctor
- Advanced: ₹3,000–6,000/month/doctor
- Ray Connect (AI receptionist): ₹999–2,499/month add-on
- Marketplace commission: ~37% per online consultation

**Key Features:**
- Appointment scheduling + calendar sync
- Basic EMR / patient records
- SMS appointment reminders
- Queue management (basic)
- Mobile app (iOS/Android/iPad)
- Telemedicine (video consultation)
- Ray Connect: AI-powered call management
- Integration with Practo consumer marketplace
- Multi-location support on premium plans

**Strengths:**
- Largest brand recognition in India
- 100,000+ doctors on platform
- Strong consumer-facing marketplace drives new patient acquisition
- Well-designed mobile apps
- Telemedicine built-in

**Critical Weaknesses:**
- ₹37% marketplace commission — doctors don't receive full consultation fee
- Account blocking without notice — documented cases of accounts blocked for 4+ years with no refund
- Poor customer support — calls not returned, tickets unresolved
- Doctor/patient data used for platform promotion without consent (IMC complaint filed)
- Patient sees competitors on your listing page
- Too expensive for solo/rural doctors
- No offline mode — useless when internet drops
- No prescription QR, no ABDM (partial), no WhatsApp API automation
- No expense/P&L tracking for clinics

**Verdict for Syllabrix:** This is the biggest competitor and also the most disliked. Doctors are actively looking for alternatives. The frustration is loud and documented. Price + commission + data lock-in are the three exit triggers.

---

### 4.2 HealthPlix EMR

**Type:** Cloud SaaS | **Origin:** India (Bangalore) | **Founded:** 2015

**Target:** Solo doctors / small clinics — pure EMR focus

**Pricing:**
- Free tier (limited features)
- Paid: pricing not publicly disclosed; estimated ₹1,000–2,000/month

**Key Features:**
- AI-assisted prescription generation
- 20,000+ Indian drug database (brand + generic)
- 22 regional language prescription output
- 16 specialty modules (General, Cardiology, Diabetology, Gynecology, Pediatrics, etc.)
- Appointment booking
- Basic billing
- ABDM integration
- Longitudinal patient journey / visit timeline
- DISHA and HIPAA compliant

**Strengths:**
- Best AI prescription in India — genuinely reduces prescription writing time
- Regional language output (Hindi, Bengali, Tamil, Telugu, Marathi, Kannada, etc.)
- Large doctor base: 10,000+ physicians, 7 million patients
- Free entry tier — excellent for adoption
- Strong ABDM compliance

**Critical Weaknesses:**
- Zero expense or financial tracking — doctors use Excel for P&L
- No clinic inventory or pharmacy management
- Single-doctor restriction on free/basic plan — 2-doctor clinics forced to premium
- No WhatsApp Business API automation
- Appointment scheduling issues reported
- Weak billing module
- No queue management (OPD token system)
- Poor customer support within app

**Verdict for Syllabrix:** HealthPlix is the closest feature threat on the clinical (EMR/Rx) side. Syllabrix must match their AI prescription quality while also providing everything they lack — especially P&L, WhatsApp, and multi-doctor support at fair price.

---

### 4.3 MocDoc HMS

**Type:** Cloud SaaS | **Origin:** India (Chennai) | **Founded:** 2012

**Target:** Small to mid-size clinics and hospital chains

**Pricing:**
- ₹15,000/year (per Techjockey listing); exact subscription pricing on request
- Considered affordable for small-to-mid clinics

**Key Features:**
- 15+ specialty OPD case sheet templates
- Appointment management + calendar
- Patient dashboard
- Billing with quick invoicing
- Pharmacy inventory integration
- Lab management (LIMS)
- Nursing vitals capture module
- Telemedicine
- Multi-location / chain clinic support
- SMS and email reminders
- IPD management (for hospital tier)

**Strengths:**
- One of the most complete offerings for Indian small clinics
- Nursing staff can capture vitals separately — good workflow separation
- Multi-specialty template library
- Quick billing reduces patient wait time
- Scales from single clinic to multi-chain

**Critical Weaknesses:**
- Not mobile-first — desktop-heavy UI
- No WhatsApp Business API (partial integration only)
- No offline mode
- No AI prescription suggestions
- No QR-verified prescription
- Complex for a solo doctor to set up

**Verdict for Syllabrix:** Good functional competitor. Syllabrix needs to beat them on UX simplicity, WhatsApp automation, mobile experience, and AI prescription.

---

### 4.4 DocPulse

**Type:** Cloud SaaS | **Origin:** India | **Founded:** 2012

**Target:** OPD clinics + small hospitals

**Pricing:**
- Reported from ₹500 base; custom pricing on request
- Single-doctor tier available

**Key Features:**
- OPD + IPD management
- EMR and appointment scheduling
- Billing and invoice generation
- Pharmacy module
- LIMS (lab information system)
- Inventory management
- Patient records with history
- Queue management
- Telemedicine
- SMS appointment reminders
- HIPAA-compliant

**Hosted on:** Google Cloud Platform

**Strengths:**
- Broad module suite covering the full clinic-to-hospital range
- LIMS and pharmacy included
- Reasonable pricing for small clinics
- GCP hosting — good reliability

**Critical Weaknesses:**
- No expense tracking (explicitly noted in reviews)
- Single doctor limit on basic plan
- Limited WhatsApp integration
- Outdated UI compared to modern tools
- No AI prescription
- No offline mode
- No QR prescription

**Verdict for Syllabrix:** DocPulse covers more modules but lacks modern UX, AI, and WhatsApp. Syllabrix can outposition on all three.

---

### 4.5 eHospital Systems

**Type:** Cloud SaaS + On-premise | **Origin:** India (by Adroit Infosystems) | **Founded:** ~2000s

**Target:** Medium-to-large hospitals; government hospitals (NIC version)

**Pricing:** Custom enterprise quote; not affordable for small clinics

**Key Features:**
- Full OPD/IPD management
- EMR
- Billing + accounts
- Pharmacy (complete)
- Laboratory / LIMS
- Radiology
- Inventory
- Blood bank
- HR / Payroll
- Business intelligence
- HL7/FHIR/PACS integration
- Biometric integration
- Mobile app
- ABDM integration

**Strengths:**
- Most comprehensive HMS in India for large facilities
- Government adoption (NIC version used in government hospitals)
- Strong claims and insurance management
- HL7/PACS integration for large hospital imaging workflows

**Critical Weaknesses:**
- Far too complex for a 1–3 doctor clinic
- Enterprise pricing — small clinics cannot afford
- Implementation requires months + IT team
- Not designed for self-onboarding
- No modern UX; legacy interface
- Overkill for 90% of India's clinic market

**Verdict for Syllabrix:** Not a direct competitor in the small clinic market. Relevant only as a reference for the Hospital tier (HP05) feature set.

---

### 4.6 EasyClinic

**Type:** Cloud SaaS | **Origin:** India | **Founded:** ~2018

**Target:** Small to mid-size clinics; paperless practice

**Pricing:** Tiered (Basic / Professional / Enterprise) — pricing on request

**Key Features:**
- EMR + appointment management
- Billing and inventory
- WhatsApp + email prescription delivery
- ABDM compliant
- AI-powered BI and reporting
- Multi-specialty support
- Paperless workflow emphasis
- Digital prescription

**Strengths:**
- Strong WhatsApp prescription delivery
- ABDM compliant
- AI reporting and analytics
- Modern UI

**Critical Weaknesses:**
- No offline mode
- Limited drug interaction checking
- No OPD token/queue system
- No expense/P&L tracking
- Pricing not transparent

**Verdict for Syllabrix:** Closest in vision to Syllabrix. Must outcompete on offline support, QR prescription, AI Rx, transparent pricing, and P&L tracking.

---

### 4.7 Lybrate for Doctors

**Type:** Consumer health platform + light practice management | **Origin:** India (Delhi) | **Founded:** 2013

**Target:** Primarily consumer-facing patient acquisition; light practice management

**Pricing:**
- Reported: $11–49/user/month (₹900–4,000) — US-dollar pricing for Indian market

**Key Features:**
- Appointment management
- Basic patient records
- Online presence and reputation management
- Calendar sync
- Telemedicine / online consultation
- Analytics
- Cloud storage (Amazon)

**User Base:** 10M+ active users, 150,000+ verified doctors

**Strengths:**
- Large consumer-facing patient acquisition platform
- Doctor discovery and online presence management
- Strong brand in metro India

**Critical Weaknesses:**
- Not a real clinic ERP — it's a marketplace with light PM tools attached
- No EMR, no prescription, no OPD queue, no pharmacy
- US-dollar pricing unjustifiable for basic features
- Doctors use it for online presence, not day-to-day management
- Significant marketplace commission concerns (similar to Practo)

**Verdict for Syllabrix:** Not a direct clinical ERP competitor. Relevant only as a "listing platform" that Syllabrix can argue against — "own your patient data, don't rent it from Lybrate."

---

### 4.8 Meditab IMS

**Type:** Enterprise HMS | **Origin:** USA (with India subsidiary)

**Target:** Medium-to-large practices; US market primarily, India secondary

**Pricing:** Enterprise on-request pricing

**Key Features:**
- 40+ specialty modules
- Speech-to-text clinical notes
- Touch-pen prescription
- Mobile app (IMSGo — prescriptions, lab results, telemedicine on phone/smartwatch)
- e-Prescribing
- Patient portal
- Telemedicine

**Strengths:**
- Genuinely mobile-first
- Speech-to-text reduces typing burden for doctors
- 40+ specialty modules
- Smartwatch integration (novelty but notable)

**Critical Weaknesses:**
- System slow with crash issues documented (Java-dependency problems)
- Complex setup; requires IT team
- US-market product adapted for India — cultural and regulatory gaps
- No India-specific features (ABDM, ABHA, Schedule H, regional language Rx)
- Enterprise pricing inaccessible to small clinics

**Verdict for Syllabrix:** Not a real competitor in the small Indian clinic market. Reference only for mobile-first prescription features.

---

### 4.9 ConnectAI

**Type:** Cloud SaaS + WhatsApp AI | **Origin:** India | **Founded:** ~2021

**Target:** Solo to small clinics; WhatsApp-native workflows

**Pricing:** From ₹1,499/month

**Key Features:**
- WhatsApp AI bot for patient booking and communication
- EMR and appointment management
- Billing
- Google My Business (GMB) optimization integration
- AI chatbot handles appointment booking on WhatsApp 24/7

**Strengths:**
- Only Indian clinic software with built-in WhatsApp AI bot for automated booking
- GMB integration helps clinics rank on Google Maps
- Affordable entry price

**Critical Weaknesses:**
- Limited EMR depth
- No pharmacy, no lab management
- No IPD / nursing home features
- No offline mode
- Small team — support and reliability concerns

**Verdict for Syllabrix:** Interesting differentiator on WhatsApp AI bot. Syllabrix should match the WhatsApp automation depth while offering far more on the clinical side.

---

### 4.10 PappyJoe

**Type:** Cloud + On-premise hybrid | **Origin:** India | **Founded:** ~2010

**Target:** Solo to small clinics; on-premise seekers (rural/semi-urban)

**Pricing:**
- Cloud: ₹999–5,999/month
- On-premise: ₹10,000 one-time (as listed on IndiaMART)

**Key Features:**
- OPD management
- Patient records and appointment scheduling
- Billing
- Basic inventory
- On-premise option (major differentiator for rural clinics)
- WhatsApp and SMS reminders (basic)
- Desktop and browser versions

**Strengths:**
- Offline / on-premise capability — the only other tool offering this
- Affordable one-time license option
- Works for clinics with no reliable internet
- Long market presence; stable product

**Critical Weaknesses:**
- No AI prescription
- No QR prescription
- No ABDM integration
- Outdated UI
- Limited mobile support
- No WhatsApp Business API (uses personal WhatsApp pattern)
- No IPD or nursing home features
- No modern analytics

**Verdict for Syllabrix:** The main reference point for offline capability. Syllabrix's PWA offline-first approach must match PappyJoe's offline reliability while vastly outperforming on clinical features and UX.

---

### 4.11 Doccure

**Type:** Cloud SaaS + White-label | **Origin:** India (Chennai — Dreams Technologies) | **Founded:** ~2018

**Target:** Clinics wanting branded patient app

**Pricing:** Custom quote; considered mid-market

**Key Features:**
- Appointment booking and EMR
- White-label branded patient mobile app
- ABDM integration
- Telemedicine
- Billing
- Staff management
- Multi-location support
- Analytics dashboard

**Strengths:**
- White-label patient app — clinic gets its own branded app
- ABDM compliant
- Good multi-location support
- Clean UI

**Critical Weaknesses:**
- No AI prescription
- No WhatsApp Business API automation
- No pharmacy management
- No P&L / expense tracking
- Pricing not transparent

**Verdict for Syllabrix:** White-label patient app is a notable differentiator Syllabrix could consider (Phase 4). On core clinical features, Syllabrix plan exceeds Doccure.

---

### 4.12 Healthray

**Type:** Cloud SaaS | **Origin:** India | **Founded:** ~2019

**Target:** Clinics migrating away from Practo

**Pricing:** Custom quote; explicitly positioned as "affordable Practo alternative"

**Key Features:**
- Appointment management
- EMR
- Billing
- Telemedicine
- Patient app
- ABDM compliant
- Multi-specialty
- Practo data migration support

**Strengths:**
- Explicitly targets Practo migrators — strong positioning
- ABDM compliant
- Migration tooling from Practo
- Modern UI

**Critical Weaknesses:**
- No AI prescription
- No WhatsApp Business API
- No offline mode
- No pharmacy or lab management
- No IPD or nursing home tier

**Verdict for Syllabrix:** Good at acquisition (Practo migration) but weak on clinical depth. Syllabrix should also offer Practo data migration as a feature.

---

## 5. Competitive Matrix — Syllabrix vs All Competitors

| Feature | Practo Ray | HealthPlix | MocDoc | DocPulse | EasyClinic | PappyJoe | ConnectAI | Doccure | eHospital | Healthray | Meditab | **Syllabrix** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **OPD Queue/Token** | Basic | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **AI Prescription** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Partial | ✅ |
| **QR-Verified Rx** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **WhatsApp API (full)** | ❌ | ❌ | Partial | ❌ | Partial | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Offline Mode** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | On-prem | ❌ | ❌ | ✅ PWA |
| **Expense / P&L** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Partial | ❌ | ❌ | ✅ |
| **ABDM Compliant** | Partial | ✅ | Partial | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Regional Language Rx** | ❌ | ✅ (22 langs) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (5 langs) |
| **Pharmacy/Dispensary** | ❌ | ❌ | ✅ | ✅ | ❌ | Basic | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **IPD/Nursing Home** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | Partial | ✅ |
| **LIMS (Lab)** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ (Hospital) |
| **Transparent Pricing** | ❌ | ❌ | ❌ | ❌ | ❌ | Partial | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **No Commission** | ❌ (37%) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Data Portability** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Partial | ❌ | ✅ |
| **Multi-Tier (Clinic→Hospital)** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Vitals Module** | ❌ | ❌ | ✅ | Partial | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Drug Interaction Check** | ❌ | Partial | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Discharge Summary** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |

**Syllabrix Score: 18/18** — the only platform planned to cover all 18 differentiating features.

---

## 6. Build Roadmap Summary

### Clinic (SYL-BC-HLC-CL07) — Sellable at Week 7–10

| Phase | Modules Built | Weeks |
|---|---|---|
| P1 | Patient Medical Profile, OPD Queue, Vitals, EMR/SOAP, Prescription | 3–4 |
| P2 | Lab Orders, Medicine Inventory, Enhanced Billing, WhatsApp Automation | 2–3 |
| P3 | AI Prescription, QR Rx, ABDM, Regional Language, P&L Dashboard | 2–3 |

### Nursing Home (SYL-BC-HLC-NH08) — Sellable at Week 14–17

| Phase | Modules Built | Weeks |
|---|---|---|
| P4 | Bed Management, IPD Admission, Daily Rounds, MAR, Discharge Summary | 3–4 |
| P5 | Package Billing, Dispensary (Schedule H), OT (basic), Insurance/TPA | 2–3 |

### Hospital (SYL-BC-HLC-HP05) — Sellable at Week 18–22

| Phase | Modules Built | Weeks |
|---|---|---|
| P6 | LIMS, Radiology, OT (advanced), Blood Bank (Phase 1), Enhanced Payroll | 3–4 |

**Total timeline to full Hospital tier: 18–22 weeks**

---

## 7. Market Opportunity Summary

| Metric | Value |
|---|---|
| India private clinic count | ~6.5 lakh |
| India nursing home count | ~70,000 |
| India small hospital count (~30–100 beds) | ~43,000 |
| Clinic software market CAGR | 11–12% (Mordor Intelligence 2024) |
| Average no-show rate (Indian OPD) | 15–30% |
| WhatsApp no-show reduction | 30–40% |
| Cost per missed appointment | ₹800–₹2,500 |
| Annual WhatsApp automation saving per clinic | ~₹4.2 lakh |
| ABHA IDs created | 73.98 crore (Feb 2025) |
| Health records linked to ABHA | 49 crore |
| Facilities using ABDM-enabled software | 1,59,020 |
| Practo Ray marketplace commission | ~37% per consultation |
| Typical Practo Ray cost | ₹1,000–6,000/doctor/month |
| Syllabrix Clinic pricing | ₹999–1,999/month |
| Syllabrix Nursing Home pricing | ₹2,999–4,999/month |
| Syllabrix Hospital pricing | ₹5,999–9,999/month |

---

## 8. Syllabrix Positioning Statement

> **"The only Indian clinic ERP with no commissions, offline support, AI prescriptions, WhatsApp-first automation, QR-verified Rxs, true P&L tracking, and a clear upgrade path from solo clinic to full hospital — at a price every Indian doctor can afford."**

The five pillars no competitor offers together:
1. **WhatsApp-first** — Full Business API automation, not just SMS
2. **Offline-capable** — PWA that works without internet
3. **AI + QR Prescription** — Fastest Rx writing + pharmacy-verifiable QR
4. **True P&L** — Real expense tracking; not just revenue
5. **Transparent pricing** — Published rates, no commissions, data always exportable

---

*Document maintained by Syllabrix Product Team. Update when new business types are added or competitor landscape changes.*
