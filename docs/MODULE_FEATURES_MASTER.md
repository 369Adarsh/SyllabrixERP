# Syllabrix — Master Module Feature Map
**Date:** 2026-06-03 | **Total:** 265 features across 40 modules | **Branch:** dev

---

## Architecture — How It All Connects

```
platformCatalog.js          seed-all-module-features.js
(feature definitions)  ──►  (DB: ModuleFeature table)
                                      │
                    ┌─────────────────┼──────────────────┐
                    ▼                                     ▼
         Nerve Center                           Tenant Settings
    /platform/feature-catalog              /settings → Module Features
    (SA reads ALL features)          (Owner reads only their modules)
    (SA can enable/disable globally) (Owner can enable/disable per tenant)
                    │                                     │
                    └─────────────────┬──────────────────┘
                                      ▼
                         Runtime: getFeatureMap()
                         Pages check feature flags
                         to show/hide UI elements
```

**Flow:**  
1. Nerve Center (Syllabrix admin) manages the global feature catalog  
2. A feature disabled globally → hidden for ALL tenants regardless of their config  
3. Tenant owner can further toggle features within what's globally active  
4. Plan gate: BASIC (all plans) → STANDARD (GROWTH+) → ADVANCED (SCALE+) → ENTERPRISE  

---

## Module Summary — 40 Modules, 265 Features

| # | Module | Code | Features | Category |
|---|--------|------|----------|----------|
| 1 | Invoicing | SYL-MOD-INV | 11 | Finance |
| 2 | Point of Sale | SYL-MOD-POS | 18 | Commerce |
| 3 | Inventory | SYL-MOD-STK | 10 | Commerce |
| 4 | Customers | SYL-MOD-CUS | 8 | Commerce |
| 5 | Expenses | SYL-MOD-EXP | 6 | Finance |
| 6 | Vendors | SYL-MOD-VND | 6 | Finance |
| 7 | Accounts | SYL-MOD-ACC | 6 | Finance |
| 8 | Reports | SYL-MOD-REP | 8 | Finance |
| 9 | Staff | SYL-MOD-STF | 5 | People |
| 10 | Attendance | SYL-MOD-ATT | 5 | People |
| 11 | Payroll | SYL-MOD-PAY | 6 | People |
| 12 | **Appointments** | SYL-MOD-APT | **29** | Service |
| 13 | Fees | SYL-MOD-FEE | 5 | Education |
| 14 | Students | SYL-MOD-STU | 5 | Education |
| 15 | Assets | SYL-MOD-AST | 4 | Finance |
| 16 | Lease | SYL-MOD-LSE | 6 | Property |
| 17 | Memberships | SYL-MOD-MBR | 5 | Fitness |
| 18 | WhatsApp | SYL-MOD-WA | 5 | Comms |
| 19 | Campaigns | SYL-MOD-CMP | 5 | Comms |
| 20 | B2B Portal | SYL-MOD-B2B | 5 | Commerce |
| 21 | AI Copilot | SYL-MOD-AIC | 5 | Platform |
| 22 | Automation | SYL-MOD-AUT | 6 | Platform |
| 23 | Training Plans | SYL-MOD-TRN | 6 | Fitness |
| **—** | **Healthcare OPD** | | | |
| 24 | OPD Queue | SYL-MOD-OPD | 8 | Healthcare |
| 25 | Vitals Recording | SYL-MOD-VIT | 6 | Healthcare |
| 26 | Clinical Notes / EMR | SYL-MOD-EMR | 8 | Healthcare |
| 27 | Prescriptions | SYL-MOD-RX | 7 | Healthcare |
| 28 | Lab Orders | SYL-MOD-LAB | 7 | Healthcare |
| 29 | Clinic Billing | SYL-MOD-CBL | 9 | Healthcare |
| 30 | Medicine Inventory | SYL-MOD-MED | 7 | Healthcare |
| 31 | Clinic Doctors | SYL-MOD-DOC | 5 | Healthcare |
| 32 | Clinic P&L | SYL-MOD-CPL | 5 | Healthcare |
| 33 | Clinic Reports | SYL-MOD-CLR | 6 | Healthcare |
| 34 | ABDM / ABHA | SYL-MOD-ABDM | 5 | Healthcare |
| **—** | **Healthcare IPD** | | | |
| 35 | Wards & Beds | SYL-MOD-WRD | 6 | Healthcare |
| 36 | IPD Admissions | SYL-MOD-IPD | 10 | Healthcare |
| 37 | Discharge Summary | SYL-MOD-DSC | 5 | Healthcare |
| 38 | Operation Theatre | SYL-MOD-OTS | 6 | Healthcare |
| 39 | LIMS — Laboratory | SYL-MOD-LIM | 7 | Healthcare |
| 40 | Radiology | SYL-MOD-RAD | 6 | Healthcare |
| 41 | Insurance & TPA | SYL-MOD-INS | 6 | Healthcare |

---

## Tier Distribution

| Tier | Plan Required | Count | Logic |
|------|--------------|-------|-------|
| BASIC | All plans | ~120 | Core feature that makes the module usable at all |
| STANDARD | GROWTH+ | ~110 | Efficiency: search, filters, exports, integrations |
| ADVANCED | SCALE+ | ~30 | Analytics, AI, bulk operations, automation |
| ENTERPRISE | ENTERPRISE | ~5 | Compliance, multi-branch, API, statutory |

---

## Business Type → Visible Modules (Settings Page)

| Business Type | Modules Shown in Settings |
|---------------|--------------------------|
| **CLINIC** | Staff, Attendance, Payroll, Assets, Customers, Expenses, Accounts, WhatsApp, Campaigns, AI, Automation, Appointments + **OPD (11)** |
| **HOSPITAL / NURSING_HOME** | All clinic modules + **IPD (7)** |
| **GYM / CROSSFIT** | Customers, Appointments, Memberships, Training, Staff, Attendance, Payroll, WhatsApp, Campaigns, AI, Automation |
| **YOGA / MARTIAL_ARTS / SPORTS / SWIMMING** | Customers, Appointments, Memberships, Staff, Attendance, Payroll, WhatsApp, Campaigns, AI |
| **COACHING / HOME_TUITION** | Customers, Fees, Students, Appointments, Staff, Attendance, Payroll, WhatsApp, Campaigns, AI |
| **RESTAURANT / DHABA / FNB** | POS, Inventory, Expenses, Staff, Attendance, WhatsApp, Campaigns, AI |
| **RETAIL / KIRANA / MEDICAL_STORE** | POS, Inventory, Invoicing, Customers, Vendors, Expenses, Accounts, Reports, Staff, WhatsApp |
| **DEALER / SUPPLIER / WHOLESALE** | Invoicing, Inventory, Vendors, Customers, Expenses, Accounts, Reports, B2B, Staff |
| **MALL** | Lease, Assets, Staff, Attendance, Accounts, Expenses, WhatsApp |
| **CA_FIRM / LAW_FIRM / SERVICES** | Invoicing, Customers, Expenses, Accounts, Reports, Assets, Staff, WhatsApp, Campaigns, AI |

---

## Nerve Center — Feature Catalog Controls

**Path:** `/platform/feature-catalog`

| Action | Effect |
|--------|--------|
| Toggle feature **OFF** globally | Feature hidden for ALL tenants — no tenant can enable it |
| Toggle feature **ON** globally | Feature available — tenants can enable/disable within their plan tier |
| View Adoption tab | See what % of active tenants have each feature enabled |
| Filter by module | Focus on one module's features |

**Admin use cases:**
- Disable a broken feature globally while a fix is deployed
- Roll out a new feature to ALL tenants at once
- Check adoption before deciding to deprecate a feature

---

## Tenant Settings — Module Features Controls

**Path:** `/settings → Module Features`

| Action | Effect |
|--------|--------|
| Toggle feature **OFF** | Feature disabled for this tenant only |
| Toggle feature **ON** | Feature enabled (requires plan to have that tier unlocked) |
| **Enforce** toggle (multi-branch) | Branch managers cannot override — feature is locked ON for all branches |

**Plan gates in effect:**
```
STARTER    → BASIC features only
GROWTH     → BASIC + STANDARD
SCALE      → BASIC + STANDARD + ADVANCED
ENTERPRISE → All tiers
```
Sharma Medical Centre is on **SCALE** plan → all BASIC + STANDARD + ADVANCED features available.

---

## Dependency Graph (selected)

```
rx.ai_suggest          → depends on: rx.create
emr.abha_display       → depends on: emr.soap_notes
lab.emr_link           → depends on: lab.report_upload
ipd.discharge_workflow → depends on: ipd.admit
dsc.abdm_push          → depends on: dsc.create
wa.automated           → auto-cascade from: wa.manual_messages
```
When a parent feature is disabled, all dependents are cascade-disabled.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `src/scripts/seed-apt-features.js` | Seeds/updates Appointments module only (29 features) |
| `src/scripts/seed-all-module-features.js` | **Master seeder** — all 40 modules, 265 features, safe to re-run |

*Syllabrix Platform — dev branch — 2026-06-03*
