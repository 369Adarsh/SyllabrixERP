# Syllabrix Clinic — Complete Testing Scenarios
**Business Type:** SYL-BC-HLC-CL07 (General Practice Clinic)  
**Demo Tenant:** Sharma Medical Centre, Indore  
**Login:** `owner@sharmamedical.test` / `SharmaClinic@2026`  
**Date:** 2026-06-03

---

## How to Use This Document
- Work through each section in order — later sections depend on data created earlier.
- Each test has: **Steps → Expected Result → Pass/Fail**.
- Use the seed data (200 patients, Dr. Arjun Sharma, 3 lab centers, 38 medicines) — it is already in the DB.
- Mark each row ✅ Pass / ❌ Fail / ⚠️ Partial.

---

## 1. Authentication

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| A-01 | Owner login — valid | Go to `/login`, select **Owner/Admin**, enter `owner@sharmamedical.test` / `SharmaClinic@2026`, click Sign in | Redirects to `/dashboard`, top bar shows "Dr. Arjun Sharma" |
| A-02 | Owner login — wrong password | Same email, type `wrongpass`, click Sign in | Toast: "Invalid credentials", stays on login page |
| A-03 | Owner login — empty fields | Click Sign in with empty fields | Inline validation: "Email is required", "Password is required" |
| A-04 | Staff login — receptionist | Switch to **Staff Login** tab, enter `kavita@sharmamedical.test` / `SharmaClinic@2026` | Logs in as Kavita Rao (Receptionist), sidebar shows only allowed modules |
| A-05 | Staff login — nurse | Staff tab, enter `meena@sharmamedical.test` / `SharmaClinic@2026` | Logs in as Meena Devi (Nurse) |
| A-06 | Logout | Click avatar → Logout | Redirects to `/login`, localStorage cleared, refresh stays on `/login` |
| A-07 | Token refresh | Log in, wait for access token to expire (or manually expire it), make any API call | Auto-refreshes silently, user stays logged in |
| A-08 | Protected route guard | While logged out, navigate to `/dashboard` directly | Redirects to `/login` |

---

## 2. Dashboard

**URL:** `/dashboard`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| D-01 | KPI cards load | Log in, land on dashboard | 4 cards: **Today's Tokens**, **Total Patients**, **Today's Collection**, **Pending Dues** — all show numeric values |
| D-02 | Today's tokens count | Check OPD queue for today's date, count tokens | Dashboard card matches the count |
| D-03 | Total patients | Count patients in Customers page | Dashboard "Total Patients" matches |
| D-04 | Today's collection | Sum today's clinic bills (paid) | Card shows correct INR amount |
| D-05 | Quick action — New OPD Token | Click **New OPD Token** quick action | Opens OPD queue / token creation form |
| D-06 | Quick action — New Prescription | Click **New Prescription** | Opens prescription editor |
| D-07 | Quick action — New Lab Order | Click **New Lab Order** | Opens lab order editor |
| D-08 | Quick action — New Clinic Bill | Click **New Clinic Bill** | Opens clinic bill editor |
| D-09 | Sidebar module list | Check sidebar items | Should show: Dashboard, OPD Queue, Appointments, Vitals, Clinical Notes, Prescriptions, Lab Orders, Clinic Billing, Doctors, Medicine Inventory, Clinic Reports, Clinic P&L, Patients, Staff, Attendance, Expenses, Accounts, Payroll, Assets, Settings |
| D-10 | Modules NOT shown | Check sidebar | Should NOT show: POS, Inventory (retail), Invoicing, Vendors, Lease, Quotations, Receipts |

---

## 3. OPD Queue

**URL:** `/opd-queue`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| OQ-01 | View today's queue | Navigate to OPD Queue | Tokens for today listed; columns: Token#, Patient, Status (Waiting/In-Consultation/Done) |
| OQ-02 | Generate new token — existing patient | Click **New Token**, search "Prakash Sharma", select patient, choose Dr. Arjun Sharma, click Generate | New token appears at bottom of queue with status **Waiting** |
| OQ-03 | Generate new token — walk-in (new patient) | Click **New Token**, toggle "Walk-in / New Patient", enter name "Ramesh Yadav", age 45, gender Male, phone 9876543210, Generate | Token created, new patient auto-created in Customers, token in queue |
| OQ-04 | Call next patient | Click **Call Next** or advance first Waiting token | Status changes to **In-Consultation** |
| OQ-05 | Mark done | Click **Done** on In-Consultation token | Status changes to **Done** |
| OQ-06 | Board view | Switch to board/kanban view (if OpdQueueBoard.jsx is wired) | Three columns: Waiting / In-Consultation / Done with tokens as cards |
| OQ-07 | Token count badge | Note token numbers for today | Tokens are sequential (T-001, T-002…) |
| OQ-08 | Queue filter by date | Change date picker to yesterday | Shows yesterday's tokens, not today's |
| OQ-09 | Empty queue state | Pick a future date | Shows "No tokens for this date" or empty state |

---

## 4. Appointments

**URL:** `/appointments`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| AP-01 | View appointments calendar/list | Navigate to Appointments | List or calendar shows upcoming appointments from seed data |
| AP-02 | Book new appointment | Click **New Appointment**, pick patient "Sunita Verma", date = tomorrow, time = 10:30 AM, doctor Dr. Arjun Sharma, type General Consultation | Appointment saved, appears in list |
| AP-03 | Edit appointment | Click an existing appointment, change time to 11:00 AM, Save | Time updated in list |
| AP-04 | Cancel appointment | Click an appointment, click Cancel, confirm | Status changes to Cancelled |
| AP-05 | Conflict detection | Book two appointments for same doctor at same time slot | Warning or block shown |
| AP-06 | Patient search in booking | In booking form, type "Ravi" in patient field | Dropdown shows all patients with "Ravi" in name |
| AP-07 | Appointment types | Check available types dropdown | Should include: General Consultation (₹300), Follow-up (₹150), ECG (₹400), Nebulization (₹200) |
| AP-08 | Filter by date | Use date picker to filter | Only appointments for selected date shown |
| AP-09 | Filter by status | Filter by Scheduled / Completed / Cancelled | Only matching records shown |

---

## 5. Vitals

**Accessible via:** OPD Queue or Clinical Notes inline form

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| V-01 | Record vitals for a patient | From OPD token, click patient name → Record Vitals (or from clinical notes form), enter: BP 130/85, Pulse 78, Temp 98.6°F, SpO2 98%, Weight 72kg, Height 165cm, RR 16 | Vitals saved and shown in the patient's record |
| V-02 | BMI auto-calculation | Enter Height 165cm, Weight 72kg | BMI auto-calculated ≈ 26.4 (shown as Overweight) |
| V-03 | Vitals history | View a patient with multiple visits | Multiple vitals entries listed chronologically |
| V-04 | Abnormal vitals highlight | Enter BP 180/110 | Highlighted in red as abnormal |
| V-05 | Required fields | Submit vitals form with no data | Validation error shown |

---

## 6. Clinical Notes (EMR)

**URL:** `/clinical-notes` or EMRPage

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| CN-01 | View patient EMR | Search patient "Priya Gupta", click her name | Opens EMR with Subjective, Objective, Assessment, Plan (SOAP) layout |
| CN-02 | Create new note — SOAP | Click New Note, fill Subjective: "Fever for 3 days", Objective: "Temp 101°F, throat congested", Assessment: "Acute Viral Fever", Plan: "Paracetamol 500mg TDS × 5 days, rest", Save | Note saved, appears in patient history |
| CN-03 | Edit existing note | Open a past note, change Assessment text, Save | Note updated, timestamp updated |
| CN-04 | Diagnosis auto-suggest | Type "Hyp" in diagnosis field | Dropdown suggests: Hypertension, Hypothyroidism, etc. |
| CN-05 | Link prescription from note | Within a note, click "Create Prescription" | Opens prescription pre-filled with note's patient and date |
| CN-06 | Link lab order from note | Within a note, click "Order Labs" | Opens lab order form pre-filled |
| CN-07 | Visit history timeline | Open EMR for a patient with 10+ visits | All notes listed chronologically, newest first |
| CN-08 | Filter notes by date range | Use date filter in EMR | Only notes in range shown |
| CN-09 | Print / PDF note | Click print/export on a note | Generates printable clinical note |
| CN-10 | ABHA number display | Open EMR for a patient who has ABHA (some seed patients do) | ABHA ID shown in patient header |

---

## 7. Prescriptions

**URL:** `/prescriptions`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| PR-01 | View all prescriptions | Navigate to Prescriptions | List with columns: Rx#, Patient, Date, Doctor, Medicines count, Status |
| PR-02 | Create new prescription | Click **New Prescription**, select patient "Rajesh Sharma", date today, add medicine: Paracetamol 500mg — 1 tab TDS × 5 days — After food, Save | Prescription Rx-XXXX created, appears in list |
| PR-03 | Add multiple medicines | In editor, add 3 medicines (Paracetamol, Azithromycin 500mg, Pantoprazole 40mg) with different dosage instructions | All 3 appear in the prescription |
| PR-04 | Diagnosis on prescription | Enter diagnosis "Acute Viral Fever" | Saved and shown on prescription print |
| PR-05 | Medicine search/autocomplete | Type "Para" in medicine field | Dropdown shows Paracetamol 500mg from inventory |
| PR-06 | Custom medicine (not in inventory) | Type "Cefixime 200mg" (not in list), press enter or add manually | Allowed, saves as free-text medicine |
| PR-07 | Print / share prescription | Click Print on a saved prescription | Generates PDF with clinic header, doctor name, patient details, medicines, doctor signature placeholder |
| PR-08 | QR code / verify-rx | Generated prescription has a QR code | QR leads to `/verify-rx/[id]` which shows prescription details publicly |
| PR-09 | Edit prescription | Edit an existing Rx, remove one medicine, add another | Changes saved correctly |
| PR-10 | Filter by patient | Search patient name in filter | Only that patient's prescriptions shown |
| PR-11 | Filter by date | Use date range filter | Only prescriptions in range shown |
| PR-12 | Prescription from EMR | Created via CN-05 link | Patient and date pre-filled from clinical note |

---

## 8. Lab Orders

**URL:** `/lab-orders`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| LO-01 | View all lab orders | Navigate to Lab Orders | List with: LO#, Patient, Date, Lab Center, Tests, Status |
| LO-02 | Create new lab order | Click **New Lab Order**, patient "Sunita Patel", date today, Lab center: Metropolis Diagnostics, Tests: CBC, RBS, Save | LO created, status = Ordered |
| LO-03 | Lab center selection | In form, click lab center dropdown | Shows: Metropolis Diagnostics, SRL Diagnostics, Lal PathLabs |
| LO-04 | Common test autocomplete | Type "CBC" in test field | Suggests Complete Blood Count |
| LO-05 | Multiple tests | Add CBC + LFT + RFT to one order | All 3 tests saved in the order |
| LO-06 | Mark report received | On an Ordered lab order, click **Report Received** | Status changes to Report Received |
| LO-07 | Enter test results | After Report Received, click **Enter Results**, add Hb: 9.2 g/dL (low), RBS: 185 mg/dL | Results saved, abnormal values highlighted |
| LO-08 | View results in EMR | Open same patient's EMR | Lab results appear in timeline |
| LO-09 | Print lab order requisition | Click Print on an order | Generates referral slip with patient info, tests, and lab center name |
| LO-10 | Filter by status | Filter by Ordered / Report Received | Only matching records shown |

---

## 9. Clinic Billing

**URL:** `/clinic-billing`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| CB-01 | View all bills | Navigate to Clinic Billing | Bills list with: Bill#, Patient, Date, Services, Amount, Status (Paid/Unpaid) |
| CB-02 | Create new bill — consultation | Click **New Bill**, patient "Vijay Singh", add service: General Consultation ₹300, payment: Cash, Save | Bill created, status = Paid |
| CB-03 | Bill with multiple services | Add: Consultation ₹300 + ECG ₹400 + Injection IM ₹100 | Total = ₹800, all services listed |
| CB-04 | Bill with medicine sale | Add medicines from inventory (Paracetamol 500mg × 10 strips) | Medicine added as line item at MRP |
| CB-05 | Payment modes | Choose UPI as payment mode | Bill shows payment mode UPI |
| CB-06 | Partial payment / due | Bill ₹500, pay ₹300, mark remaining as due | Status = Partial, due amount = ₹200 |
| CB-07 | Unpaid bill | Create bill, choose "Pay Later" or leave unpaid | Status = Unpaid, appears in Pending Dues on dashboard |
| CB-08 | Mark unpaid bill as paid | On an Unpaid bill, click **Collect Payment** | Status changes to Paid, dashboard pending dues decreases |
| CB-09 | Print receipt | Click Print on a paid bill | Generates receipt with clinic logo, patient name, services, total, payment mode |
| CB-10 | Bill against OPD token | Create bill directly from OPD token row | Patient pre-filled from token |
| CB-11 | Search bill by patient | Type patient name in search | Bills filtered to that patient |
| CB-12 | Date range filter | Filter by last 7 days | Only bills in range shown |
| CB-13 | Total collections today | Check today's bills sum | Matches Dashboard "Today's Collection" KPI |

---

## 10. Clinic Doctors

**URL:** `/clinic-doctors`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| DR-01 | View doctors list | Navigate to Clinic Doctors | Dr. Arjun Sharma listed with specialization, consultation fee, availability |
| DR-02 | Add new doctor | Click **Add Doctor**, fill: Dr. Priya Mehta, MBBS MD Paediatrics, fee ₹400, Mon–Fri 9AM–1PM, Save | New doctor appears in list |
| DR-03 | Edit doctor profile | Click Dr. Arjun Sharma, update bio, Save | Bio updated |
| DR-04 | Doctor availability schedule | View/set available days and time slots | Days and hours shown correctly |
| DR-05 | Consultation fee display | Check fee on profile | Shows ₹300 (consultation) and ₹150 (follow-up) |
| DR-06 | Certifications | Check Dr. Arjun Sharma profile | Shows MBBS, MD - General Medicine |
| DR-07 | Deactivate doctor | Toggle doctor to inactive | Doctor removed from appointment booking dropdown |

---

## 11. Medicine Inventory

**URL:** `/clinic-medicines`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| MI-01 | View medicine list | Navigate to Medicine Inventory | 38 medicines listed from seed data |
| MI-02 | Search medicine | Type "Metformin" | Shows Metformin 500mg and Metformin 1000mg |
| MI-03 | Add new medicine | Click **Add Medicine**, name: Atenolol 25mg, category: Beta Blocker, MRP: ₹8, stock: 200, Save | Added to list |
| MI-04 | Edit medicine | Click Paracetamol 500mg, change MRP from ₹2 to ₹3, Save | Updated |
| MI-05 | Stock quantity update | Adjust stock for Azithromycin 500mg: add 100 strips | New stock reflects |
| MI-06 | Low stock alert | Set a medicine's stock to 5 (below threshold) | Highlighted as low stock |
| MI-07 | Medicine used in prescription | Prescribe Paracetamol | Searchable in prescription editor |
| MI-08 | Medicine used in billing | Add Paracetamol to clinic bill | Appears as line item at MRP |
| MI-09 | Filter by category | Filter by "Antihypertensives" | Shows Amlodipine, Telmisartan, Aspirin |
| MI-10 | Expiry date tracking | Set expiry date on a medicine | Shown in list; expired medicines flagged |

---

## 12. Clinic Reports

**URL:** `/clinic-reports`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| CR-01 | Daily OPD report | Navigate to Clinic Reports, select Daily OPD report for today | Shows token count, patients seen, collection breakdown |
| CR-02 | Patient visit frequency | View Patient Visit report | Shows most frequent patients (weekly tier patients should appear most) |
| CR-03 | Disease/diagnosis summary | View Diagnosis report | Top diagnoses: Hypertension, Diabetes, Fever, etc. from seed data |
| CR-04 | Revenue by service | View Revenue Breakdown | Consultation vs ECG vs Nebulization vs medicines |
| CR-05 | Doctor-wise report | Filter reports by doctor | Revenue, patients attributed to Dr. Arjun Sharma |
| CR-06 | Date range filter | Set last 30 days | Report covers only that period |
| CR-07 | Export to CSV | Click Export/Download | Downloads CSV with report data |
| CR-08 | Medicine dispensed report | View Medicine Dispensed report | Shows medicine name, quantity dispensed, revenue |
| CR-09 | Lab order summary | View Lab Orders report | Count by lab center, by test type |

---

## 13. Clinic P&L

**URL:** `/clinic-pnl`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| PL-01 | View P&L dashboard | Navigate to Clinic P&L | Revenue, Expenses, Net Profit sections |
| PL-02 | Monthly P&L | Select current month | Revenue from clinic bills, expenses from expense records |
| PL-03 | Revenue breakdown | Check revenue categories | Consultation fees, procedures, medicine sales |
| PL-04 | Expense breakdown | Check expense categories | Rent, salaries, medicines purchase, utilities |
| PL-05 | Profit calculation | Revenue − Expenses | Net profit/loss shown correctly |
| PL-06 | Comparison graph | View month-over-month chart | Line/bar chart showing trend |
| PL-07 | Annual view | Switch to annual view | Full year P&L with monthly breakdown |

---

## 14. Patients (Customers)

**URL:** `/customers`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| PT-01 | View patient list | Navigate to Patients | 200 patients from seed data listed |
| PT-02 | Search by name | Type "Sunita" | Filters to all Sunitas |
| PT-03 | Search by phone | Type a phone number (e.g. 9893001122 for Dr. Sharma's staff record) | Matching patient shown |
| PT-04 | Add new patient | Click **Add Patient**, fill: Neha Joshi, DOB 1990-03-15, Female, Phone 9812345678, Address: Rau, Indore, Blood Group B+, ABHA: 14-4210-9876-0001, Save | Patient created with Patient ID |
| PT-05 | Edit patient | Click an existing patient, update email, Save | Updated |
| PT-06 | Patient profile view | Click patient name | Shows: demographics, visit history, prescriptions, lab orders, bills |
| PT-07 | ABHA number entry | Add ABHA ID to patient | Shown in profile and EMR header |
| PT-08 | Age auto-calculation | Enter DOB | Age shown automatically |
| PT-09 | Pagination | Scroll through 200 patients | Pagination works, all patients accessible |
| PT-10 | Duplicate phone check | Try to add patient with phone already in system | Warning shown |
| PT-11 | Patient visit count | Check a "weekly" tier patient | Shows 48–52 visit records |
| PT-12 | Blood group filter | Filter by blood group A+ | Only A+ patients shown |

---

## 15. Staff

**URL:** `/staff`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| ST-01 | View staff list | Navigate to Staff | Shows Dr. Arjun Sharma (Doctor), Kavita Rao (Receptionist), Meena Devi (Nurse) |
| ST-02 | Add new staff member | Click **Add Staff**, fill: Deepak Nair, role: Lab Technician, phone 9800001122, salary ₹18000, joined today, Save | New staff appears in list |
| ST-03 | Edit staff | Click Kavita Rao, update phone, Save | Updated |
| ST-04 | View certifications | Click Dr. Arjun Sharma | Shows MBBS, MD - General Medicine |
| ST-05 | Deactivate staff | Toggle Meena Devi to inactive | She no longer appears in active staff lists |
| ST-06 | Staff roles | Check Roles sub-section under Staff | Lists roles: Doctor, Receptionist, Nurse, Lab Technician |
| ST-07 | Role permissions | Click a role, view/edit its permissions | Permission matrix shows allowed modules |

---

## 16. Attendance

**URL:** `/attendance` or via Staff module

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| AT-01 | View attendance | Navigate to Attendance | 3 months of seed attendance shown for all 3 staff |
| AT-02 | Mark attendance today | Click **Mark Attendance**, select Kavita Rao, mark Present, check-in 09:30 | Attendance record saved |
| AT-03 | Mark absent | Select Meena Devi, mark Absent | Shown as absent for today |
| AT-04 | Attendance summary | View monthly summary | Present / Absent / Leave counts per staff per month |
| AT-05 | Export attendance | Click Export | CSV with staff attendance for selected month |

---

## 17. Expenses

**URL:** `/expenses`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| EX-01 | View expenses | Navigate to Expenses | 60 seed expense records shown (12 months × 5 recurring categories) |
| EX-02 | Add expense | Click **Add Expense**, category: Medicines Purchase, amount ₹5000, vendor "Sharma Medical Wholesale", date today, Save | Expense saved |
| EX-03 | Expense categories | Check dropdown | Should include: Rent, Salaries, Medicines Purchase, Utilities, Equipment, Misc |
| EX-04 | Filter by category | Filter by "Rent" | Only rent expenses shown |
| EX-05 | Filter by date | Last 30 days filter | Only recent expenses shown |
| EX-06 | Total expenses card | Check total in expenses header | Sum of all filtered expenses |
| EX-07 | Edit expense | Click an expense, change amount, Save | Updated |
| EX-08 | Delete expense | Click delete on an expense, confirm | Expense removed |

---

## 18. Accounts

**URL:** `/accounts`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| AC-01 | View accounts | Navigate to Accounts | Cash, Bank, UPI accounts listed |
| AC-02 | Account balance | Check balances | Reflect payments received + expenses paid |
| AC-03 | Add transaction | Record a bank deposit of ₹10,000 | Transaction appears, bank balance updates |
| AC-04 | Transfer between accounts | Transfer ₹5000 from Cash to Bank | Both balances update correctly |
| AC-05 | Account statement | View statement for Cash account | All debits and credits listed |

---

## 19. Payroll

**URL:** `/payroll`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| PY-01 | View payroll | Navigate to Payroll | Staff salaries: Kavita ₹16,000, Meena ₹20,000 |
| PY-02 | Generate payroll for month | Click **Run Payroll**, select May 2026, confirm | Payroll records created for all active staff |
| PY-03 | Mark salary as paid | Click **Mark Paid** for Kavita Rao | Status = Paid, date recorded |
| PY-04 | Payroll with deductions | Add deduction for absence days | Deduction reflected in net pay |
| PY-05 | Payroll history | View past months | Previous payroll runs listed |
| PY-06 | Payslip generation | Click **Payslip** for Meena Devi | Generates printable payslip |

---

## 20. Assets

**URL:** `/assets`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| AS-01 | View assets | Navigate to Assets | Clinic equipment list (seeded if applicable) |
| AS-02 | Add asset | Click **Add Asset**, name: Stethoscope, category: Medical Equipment, purchase price ₹2000, date: 2024-01-01, Save | Asset saved with Asset ID |
| AS-03 | Add high-value asset | Add: ECG Machine, ₹45,000, Purchased 2025-06-01 | Asset created |
| AS-04 | Depreciation | Check if depreciation is tracked | Depreciated value shown |
| AS-05 | Filter by category | Filter by Medical Equipment | Only medical equipment shown |

---

## 21. Settings

**URL:** `/settings`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| SE-01 | Clinic profile | Go to Settings → Clinic Profile | Shows: Sharma Medical Centre, Indore, owner@sharmamedical.test, CLINIC type |
| SE-02 | Update clinic address | Change address, Save | Address updated (used in prescription printouts) |
| SE-03 | Logo upload | Upload a clinic logo PNG | Logo appears in top bar and prescription headers |
| SE-04 | Module feature settings | Go to Settings → Features | Toggle optional features on/off |
| SE-05 | Currency/locale | Check currency setting | Shows INR, en-IN locale |
| SE-06 | Timezone | Check timezone | Shows Asia/Kolkata |
| SE-07 | Receipt config | Configure receipt/bill template | Preview shows custom header |

---

## 22. Extended Modules (Hospital-Tier)
*These are currently DISABLED for CL07. Test that they are hidden, and test their basic function if enabled manually.*

### 22a. IPD Admissions (`/ipd-admissions`)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| IPD-01 | Module not visible | Check sidebar as default clinic | IPD Admissions NOT in sidebar |
| IPD-02 | Admit patient (if enabled) | Navigate to `/ipd-admissions`, click **Admit Patient**, fill: Patient Priya Gupta, ward: General, bed: B-03, diagnosis: Dengue Fever, admitting doctor: Dr. Arjun Sharma, Save | Admission record created, bed marked occupied |
| IPD-03 | View admitted patients | View IPD list | Shows admitted patient with admission date, ward, bed |
| IPD-04 | Discharge patient | Click **Discharge**, fill discharge date, diagnosis summary | Status changes to Discharged |

### 22b. IPD Wards (`/ipd-wards`)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| WD-01 | View wards | Navigate to `/ipd-wards` | Wards listed with beds (if seeded) |
| WD-02 | Add ward | Click **Add Ward**, name: General Ward, beds: 10, Save | Ward created with 10 beds |
| WD-03 | Bed occupancy | After IPD-02, check bed B-03 | Shows as Occupied with patient name |
| WD-04 | Available beds | View available beds count | Correctly reflects free/occupied beds |

### 22c. OT Sessions (`/ot-sessions`)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| OT-01 | Schedule OT | Click **Schedule OT**, patient, surgery type: Minor Procedure, date/time, surgeon, Save | OT session created |
| OT-02 | Update OT status | Change status: Scheduled → In Progress → Completed | Status trail saved |

### 22d. LIMS — Lab Information System (`/lims`)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| LI-01 | View LIMS | Navigate to `/lims` | Internal lab orders management page |
| LI-02 | Receive sample | Mark a lab order sample as Received | Status updated |
| LI-03 | Enter results | Enter test results with reference ranges | Abnormal values flagged |
| LI-04 | Authorize report | Click Authorize | Report locked, ready to share with patient |

### 22e. Radiology (`/radiology`)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| RA-01 | Create radiology order | Click **New Order**, patient, modality: X-Ray Chest, radiologist: external, Save | Order created |
| RA-02 | Upload report | Attach PDF report | File saved, accessible from patient EMR |
| RA-03 | Findings | Enter radiology findings text | Saved and visible in patient record |

### 22f. Discharge Summary (`/discharge-summary`)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| DS-01 | Create discharge summary | Link to IPD admission, auto-fill admission date, diagnosis, medications, instructions, Save | Summary created |
| DS-02 | Print summary | Click Print | Formatted PDF with hospital/clinic header |

### 22g. Insurance Claims (`/insurance-claims`)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| IC-01 | Create claim | Click **New Claim**, patient, insurer: Star Health, policy no., diagnosis, bill amount ₹8500, Save | Claim created with status: Submitted |
| IC-02 | Update claim status | Mark as: Submitted → Under Review → Approved → Settled | Status trail maintained |
| IC-03 | Settlement amount | Enter settlement amount ₹7200 (less than claimed ₹8500) | Shortfall ₹1300 shown |

### 22h. ABDM (`/abdm`)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| AB-01 | View ABDM page | Navigate to `/abdm` | Page loads with ABDM integration UI |
| AB-02 | Link ABHA ID | Select a patient with ABHA number (seed has ~20 weekly patients with ABHA 90% chance), click **Link ABHA** | ABHA linked to patient profile |
| AB-03 | Health records push | Push a clinical note to ABHA Health Records (sandbox) | API response shown |

---

## 23. Cross-Module Flows (End-to-End)

| # | Scenario | Flow |
|---|----------|------|
| E2E-01 | Full OPD visit | Token → Vitals → Clinical Notes → Prescription → Lab Order → Clinic Bill → Print receipt |
| E2E-02 | Chronic patient follow-up | Existing patient search → OPD token → Record BP vitals → SOAP note (HTN review) → Prescription refill (Amlodipine, Telmisartan) → Bill (₹150 follow-up) |
| E2E-03 | New walk-in patient | Walk-in token → Create patient in system → Vitals → Diagnosis (Acute Fever) → Prescription (Paracetamol, Cetirizine) → Bill ₹300 → Print prescription + receipt |
| E2E-04 | Lab-driven visit | Patient comes for lab results → Existing lab order marked Report Received → Results entered → Clinical note updated → Follow-up appointment booked |
| E2E-05 | Month-end payroll | Mark all staff attendance for month → Run payroll → Mark salaries paid → View in Expenses as Salary expense → Check P&L |
| E2E-06 | Staff role enforcement | Log in as Kavita (Receptionist) → She can see OPD queue, appointments, billing → She CANNOT access Payroll or Settings |

---

## 24. Error & Edge Cases

| # | Scenario | Expected |
|---|----------|----------|
| EC-01 | Delete patient who has appointments | Warning: "Patient has active records, cannot delete" |
| EC-02 | Bill an inactive patient | System allows (patient is archived, not deleted) |
| EC-03 | Prescription with zero medicines | Validation error: "Add at least one medicine" |
| EC-04 | Lab order with no tests selected | Validation error: "Select at least one test" |
| EC-05 | OPD token for past date | Token generated but with past date — for record keeping only |
| EC-06 | Negative expense amount | Validation error |
| EC-07 | Bill amount ₹0 | Warning: "Are you sure?" or block |
| EC-08 | Network offline | Appropriate error toast, no data loss on retry |
| EC-09 | Concurrent login (two browsers) | Both sessions active; logout on one does NOT kick the other (unless refresh token revoked) |
| EC-10 | Long patient name (100 chars) | UI does not break, truncated with ellipsis |

---

## 25. Mobile / Responsive

| # | Scenario | Expected |
|---|----------|----------|
| MB-01 | Login page on mobile (375px) | Form is full-width, readable |
| MB-02 | Dashboard on tablet (768px) | KPI cards stack to 2×2 grid |
| MB-03 | OPD queue on mobile | Token list readable, action buttons accessible |
| MB-04 | Prescription editor on mobile | Medicine rows scroll horizontally or stack |
| MB-05 | Sidebar on mobile | Sidebar collapses to hamburger menu |

---

## Test Execution Checklist

```
Module                  | Tested | Pass | Fail | Notes
------------------------|--------|------|------|------
Authentication          |        |      |      |
Dashboard               |        |      |      |
OPD Queue               |        |      |      |
Appointments            |        |      |      |
Vitals                  |        |      |      |
Clinical Notes (EMR)    |        |      |      |
Prescriptions           |        |      |      |
Lab Orders              |        |      |      |
Clinic Billing          |        |      |      |
Clinic Doctors          |        |      |      |
Medicine Inventory      |        |      |      |
Clinic Reports          |        |      |      |
Clinic P&L              |        |      |      |
Patients                |        |      |      |
Staff                   |        |      |      |
Attendance              |        |      |      |
Expenses                |        |      |      |
Accounts                |        |      |      |
Payroll                 |        |      |      |
Assets                  |        |      |      |
Settings                |        |      |      |
IPD Admissions          |        |      |      |
IPD Wards               |        |      |      |
OT Sessions             |        |      |      |
LIMS                    |        |      |      |
Radiology               |        |      |      |
Discharge Summary       |        |      |      |
Insurance Claims        |        |      |      |
ABDM                    |        |      |      |
Cross-Module E2E        |        |      |      |
Error & Edge Cases      |        |      |      |
Mobile/Responsive       |        |      |      |
```

---

*Generated for Syllabrix — SYL-BC-HLC-CL07 (General Practice Clinic)*
