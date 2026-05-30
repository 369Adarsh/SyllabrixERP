# Syllabrix Platform Standards

> **This document is the single source of truth for all Syllabrix platform standardizations.**
> Every code, identifier, format, or naming convention used across the platform must be recorded here.
> Never duplicate, rename, or reassign a code once issued.

---

## How to Use This Document

- Before creating any new code or identifier, check this document first.
- When a new standard is defined, add it here immediately.
- Each standard has a **version** and **date issued** — never edit a past entry, only add new ones.
- All codes are **permanent**. If a category is deprecated, mark it `[DEPRECATED]` — do not delete or reuse its code.

---

## 1. Business Category Codes (`SYL-BC-*`)

**Format:** `SYL-BC-XXX`
- `SYL` — Syllabrix platform prefix (all platform codes start with this)
- `BC` — Business Category namespace
- `XXX` — 3-letter unique category identifier (uppercase)

**Purpose:** Uniquely identify a business category across the platform — used in feature flags, rollout targeting, analytics, API payloads, and deployment controls.

**Issued:** 2026-05-23 | **Version:** 1.0

| Code | Category Name | Business Types Included |
|---|---|---|
| `SYL-BC-GEN` | General / Core | RETAIL, KIRANA, GYM, SALON, CLINIC, RESTAURANT, MALL, FREELANCER, WORKSHOP, COACHING, OTHER |
| `SYL-BC-RET` | Retail & Commerce | MEDICAL_STORE, STATIONARY, SWEET_SHOP, BAKERY, JEWELLERY, HARDWARE, ELECTRICAL, CLOTHING, FOOTWEAR, ELECTRONICS, MOBILE_REPAIR, OPTICAL, BOOKSTORE, FLORIST |
| `SYL-BC-FNB` | Food & Beverage | DHABA, CATERING, CLOUD_KITCHEN, JUICE_BAR, CANTEEN_MESS |
| `SYL-BC-EVT` | Events & Functions | EVENT_PLANNER, DECORATOR, TENT_HOUSE |
| `SYL-BC-HLC` | Healthcare | DENTAL, DIAGNOSTIC_LAB, PHYSIOTHERAPY, AYURVEDA, HOSPITAL, VET_CLINIC |
| `SYL-BC-BPC` | Beauty & Personal Care | BEAUTY_PARLOUR, SPA, LAUNDRY, TAILORING, BARBERSHOP |
| `SYL-BC-EDU` | Education | HOME_TUITION, MUSIC_SCHOOL, DANCE_ACADEMY, DRIVING_SCHOOL, COMPUTER_TRAINING |
| `SYL-BC-PRO` | Professional Services | CA_FIRM, LAW_FIRM, REAL_ESTATE, INSURANCE_AGENCY, TRAVEL_AGENCY, PHOTOGRAPHY, DIGITAL_AGENCY |
| `SYL-BC-TRN` | Transport & Logistics | CAB_SERVICE, TRANSPORT, CAR_RENTAL, COURIER, PACKERS_MOVERS |
| `SYL-BC-CND` | Construction & Design | CONSTRUCTION, INTERIOR_DESIGN, CO_WORKING |
| `SYL-BC-B2B` | Trade & Supply (B2B) | DEALER, SUPPLIER, WHOLESALE |
| `SYL-BC-SVC` | Other Services | PEST_CONTROL |

**Rules:**
- Total categories: **12** (as of v1.0)
- Total business types covered: **68**
- `SYL-BC-GEN` is the default fallback for any tenant whose `businessType` does not map to a specific category
- **Every new business category MUST be added to this table before or at the time it is added to the schema.** No category goes live without a `SYL-BC-*` code.
- New business types added to the schema must be assigned to an existing category (or a new one with a new code) here before going live.
- When a new category is added: assign the next available 3-letter code, add a row to the table, increment the total count, and log it in the Changelog below.

---

## 2. Business Type Codes (`SYL-BC-[CAT]-[LL##]`)

**Format:** `SYL-BC-[CATEGORY]-[2 LETTERS][2 DIGITS]`
- Inherits the parent category code
- 2-letter prefix = meaningful abbreviation of the business name
- 2-digit suffix = sequential order within the category (01, 02, 03 …)
- Numbering restarts at `01` for each category

**Purpose:** Uniquely identify every individual business type — used for granular feature rollouts, per-business-type configurations, analytics segmentation, and tenant targeting.

**Issued:** 2026-05-23 | **Version:** 1.0

### SYL-BC-GEN — General / Core

| Business Type Code | Schema Enum | Business Name |
|---|---|---|
| `SYL-BC-GEN-RT01` | `RETAIL` | Retail |
| `SYL-BC-GEN-KR02` | `KIRANA` | Kirana |
| `SYL-BC-GEN-CH03` | `COACHING` | Coaching |
| `SYL-BC-GEN-SL04` | `SALON` | Salon |
| `SYL-BC-GEN-CL05` | `CLINIC` | Clinic |
| `SYL-BC-GEN-RS06` | `RESTAURANT` | Restaurant |
| `SYL-BC-GEN-GY07` | `GYM` | Gym |
| `SYL-BC-GEN-ML08` | `MALL` | Mall |
| `SYL-BC-GEN-FR09` | `FREELANCER` | Freelancer |
| `SYL-BC-GEN-WS10` | `WORKSHOP` | Workshop |
| `SYL-BC-GEN-OT11` | `OTHER` | Other |

### SYL-BC-RET — Retail & Commerce

| Business Type Code | Schema Enum | Business Name |
|---|---|---|
| `SYL-BC-RET-MS01` | `MEDICAL_STORE` | Medical Store |
| `SYL-BC-RET-ST02` | `STATIONARY` | Stationary |
| `SYL-BC-RET-SW03` | `SWEET_SHOP` | Sweet Shop |
| `SYL-BC-RET-BK04` | `BAKERY` | Bakery |
| `SYL-BC-RET-JW05` | `JEWELLERY` | Jewellery |
| `SYL-BC-RET-HW06` | `HARDWARE` | Hardware |
| `SYL-BC-RET-EL07` | `ELECTRICAL` | Electrical |
| `SYL-BC-RET-CL08` | `CLOTHING` | Clothing |
| `SYL-BC-RET-FW09` | `FOOTWEAR` | Footwear |
| `SYL-BC-RET-EC10` | `ELECTRONICS` | Electronics |
| `SYL-BC-RET-MR11` | `MOBILE_REPAIR` | Mobile Repair |
| `SYL-BC-RET-OP12` | `OPTICAL` | Optical |
| `SYL-BC-RET-BS13` | `BOOKSTORE` | Bookstore |
| `SYL-BC-RET-FL14` | `FLORIST` | Florist |

### SYL-BC-FNB — Food & Beverage

| Business Type Code | Schema Enum | Business Name |
|---|---|---|
| `SYL-BC-FNB-DH01` | `DHABA` | Dhaba |
| `SYL-BC-FNB-CT02` | `CATERING` | Catering |
| `SYL-BC-FNB-CK03` | `CLOUD_KITCHEN` | Cloud Kitchen |
| `SYL-BC-FNB-JB04` | `JUICE_BAR` | Juice Bar |
| `SYL-BC-FNB-CM05` | `CANTEEN_MESS` | Canteen / Mess |

### SYL-BC-EVT — Events & Functions

| Business Type Code | Schema Enum | Business Name |
|---|---|---|
| `SYL-BC-EVT-EP01` | `EVENT_PLANNER` | Event Planner |
| `SYL-BC-EVT-DC02` | `DECORATOR` | Decorator |
| `SYL-BC-EVT-TH03` | `TENT_HOUSE` | Tent House |

### SYL-BC-HLC — Healthcare

| Business Type Code | Schema Enum | Business Name |
|---|---|---|
| `SYL-BC-HLC-DN01` | `DENTAL` | Dental Clinic |
| `SYL-BC-HLC-DL02` | `DIAGNOSTIC_LAB` | Diagnostic Lab |
| `SYL-BC-HLC-PT03` | `PHYSIOTHERAPY` | Physiotherapy |
| `SYL-BC-HLC-AY04` | `AYURVEDA` | Ayurveda |
| `SYL-BC-HLC-HP05` | `HOSPITAL` | Hospital |
| `SYL-BC-HLC-VC06` | `VET_CLINIC` | Vet Clinic |

### SYL-BC-BPC — Beauty & Personal Care

| Business Type Code | Schema Enum | Business Name |
|---|---|---|
| `SYL-BC-BPC-BP01` | `BEAUTY_PARLOUR` | Beauty Parlour |
| `SYL-BC-BPC-SP02` | `SPA` | Spa |
| `SYL-BC-BPC-LN03` | `LAUNDRY` | Laundry |
| `SYL-BC-BPC-TL04` | `TAILORING` | Tailoring |
| `SYL-BC-BPC-BR05` | `BARBERSHOP` | Barbershop |

### SYL-BC-EDU — Education

| Business Type Code | Schema Enum | Business Name |
|---|---|---|
| `SYL-BC-EDU-HT01` | `HOME_TUITION` | Home Tuition |
| `SYL-BC-EDU-MS02` | `MUSIC_SCHOOL` | Music School |
| `SYL-BC-EDU-DA03` | `DANCE_ACADEMY` | Dance Academy |
| `SYL-BC-EDU-DS04` | `DRIVING_SCHOOL` | Driving School |
| `SYL-BC-EDU-CT05` | `COMPUTER_TRAINING` | Computer Training |

### SYL-BC-PRO — Professional Services

| Business Type Code | Schema Enum | Business Name |
|---|---|---|
| `SYL-BC-PRO-CA01` | `CA_FIRM` | CA Firm |
| `SYL-BC-PRO-LF02` | `LAW_FIRM` | Law Firm |
| `SYL-BC-PRO-RE03` | `REAL_ESTATE` | Real Estate |
| `SYL-BC-PRO-IA04` | `INSURANCE_AGENCY` | Insurance Agency |
| `SYL-BC-PRO-TA05` | `TRAVEL_AGENCY` | Travel Agency |
| `SYL-BC-PRO-PH06` | `PHOTOGRAPHY` | Photography |
| `SYL-BC-PRO-DG07` | `DIGITAL_AGENCY` | Digital Agency |

### SYL-BC-TRN — Transport & Logistics

| Business Type Code | Schema Enum | Business Name |
|---|---|---|
| `SYL-BC-TRN-CB01` | `CAB_SERVICE` | Cab Service |
| `SYL-BC-TRN-TR02` | `TRANSPORT` | Transport |
| `SYL-BC-TRN-CR03` | `CAR_RENTAL` | Car Rental |
| `SYL-BC-TRN-CO04` | `COURIER` | Courier |
| `SYL-BC-TRN-PM05` | `PACKERS_MOVERS` | Packers & Movers |

### SYL-BC-CND — Construction & Design

| Business Type Code | Schema Enum | Business Name |
|---|---|---|
| `SYL-BC-CND-CN01` | `CONSTRUCTION` | Construction |
| `SYL-BC-CND-ID02` | `INTERIOR_DESIGN` | Interior Design |
| `SYL-BC-CND-CW03` | `CO_WORKING` | Co-Working Space |

### SYL-BC-B2B — Trade & Supply (B2B)

| Business Type Code | Schema Enum | Business Name |
|---|---|---|
| `SYL-BC-B2B-DL01` | `DEALER` | Dealer |
| `SYL-BC-B2B-SP02` | `SUPPLIER` | Supplier |
| `SYL-BC-B2B-WS03` | `WHOLESALE` | Wholesale |

### SYL-BC-SVC — Other Services

| Business Type Code | Schema Enum | Business Name |
|---|---|---|
| `SYL-BC-SVC-PC01` | `PEST_CONTROL` | Pest Control |

**Rules:**
- Total business type codes issued: **68** (as of v1.0)
- Format is always `SYL-BC-[CAT]-[2 LETTERS][2 DIGITS]` — no exceptions
- 2-letter prefix must be a meaningful abbreviation of the business name
- When a new business type is added: assign the next sequential number within its category, add a row to the correct category table, increment the total count, and log in the Changelog
- Codes within the same category must be unique — the same 2-letter prefix can exist in different categories without conflict (e.g. `SYL-BC-EDU-MS02` and `SYL-BC-RET-MS01` are different codes)

---

## 3. Business Type Segregation Infrastructure

**Purpose:** Isolate every business type behind its own config so deployments, enhancements, and bug fixes only affect the targeted business type code. Other businesses are completely untouched.

**Issued:** 2026-05-23 | **Version:** 1.0

### File Structure

```
backend/src/config/businessTypes/
  registry.js          ← maps every BusinessType enum → { categoryCode, typeCode }
  base.config.js       ← default config all 68 types inherit
  index.js             ← getBusinessTypeConfig(), getBusinessTypeCodes(), isFeatureEnabled(), isModuleEnabled()
  overrides/
    GEN-RT01.js        ← RETAIL overrides
    GEN-KR02.js        ← KIRANA overrides
    GEN-CH03.js        ← COACHING overrides
    GEN-SL04.js        ← SALON overrides
    GEN-CL05.js        ← CLINIC overrides
    GEN-RS06.js        ← RESTAURANT overrides
    GEN-GY07.js        ← GYM overrides
    GEN-ML08.js        ← MALL overrides
    GEN-FR09.js        ← FREELANCER overrides
    GEN-WS10.js        ← WORKSHOP overrides
    GEN-OT11.js        ← OTHER overrides
    [add more as needed — one file per business type code]

backend/src/middleware/
  businessTypeScope.js ← attaches req.businessTypeCode, req.businessCategoryCode, req.businessConfig

frontend/src/config/businessTypes/
  registry.js          ← same mapping (ES module)
  base.config.js       ← frontend base config
  index.js             ← same getters (uses Vite import.meta.glob for overrides)
  overrides/           ← mirrors backend overrides structure

frontend/src/hooks/
  useBusinessTypeConfig.js  ← React hook: { config, typeCode, categoryCode, hasModule(), hasFeature() }
```

### How to Deploy a New Feature Safely

1. Add the flag to `base.config.js` features as `false` (off for everyone)
2. Set it `true` only in the target business type's override file
3. Deploy — only that business type sees the feature
4. If there is a bug: set back to `false` in the override — zero impact on other types

```js
// base.config.js
features: { new_kirana_dashboard: false }   // off for all

// overrides/GEN-KR02.js
features: { new_kirana_dashboard: true }    // on only for KIRANA
```

### How to Gate a Module/Feature in Code

**Backend:**
```js
const businessTypeScope = require('../middleware/businessTypeScope');
router.get('/appointments', authenticate, businessTypeScope, (req, res) => {
  if (!req.businessConfig.modules.appointments) return res.status(403).json({ message: 'Not available' });
  // ...
});
```

**Frontend:**
```jsx
const { hasModule, hasFeature } = useBusinessTypeConfig();
{hasModule('appointments') && <AppointmentsLink />}
{hasFeature('new_kirana_dashboard') && <NewDashboard />}
```

### Rules
- Every new business type override file must be named exactly `[CAT-CODE].js` (e.g. `RET-MS01.js`)
- Override files only specify what is DIFFERENT from base — keep them minimal
- Never put business logic in override files — only `modules`, `features`, `dashboard` keys
- When a new business type is added to the schema: create its override file before going live

---

## 4. Module Codes (`SYL-MOD-*`) + Feature Registry

**Format:** `SYL-MOD-XXX`
**Purpose:** Uniquely identify every platform module — used in Role permissions, deployment flags, and access control.
**Issued:** 2026-05-24 | **Version:** 1.0

| Module Code | Key | Label | Features |
|---|---|---|---|
| `SYL-MOD-INV` | `invoicing` | Invoicing | invoices, creditNotes, quotations, recurringInvoices, returns |
| `SYL-MOD-POS` | `pos` | Point of Sale | sales, receipts |
| `SYL-MOD-STK` | `inventory` | Inventory | products, categories, stockAlerts, purchaseOrders |
| `SYL-MOD-CUS` | `customers` | Customers | customers, customerCredit |
| `SYL-MOD-EXP` | `expenses` | Expenses | expenses |
| `SYL-MOD-VND` | `vendors` | Vendors & Bills | vendors, bills |
| `SYL-MOD-ACC` | `accounts` | Accounts | transactions, bankAccounts |
| `SYL-MOD-REP` | `reports` | Reports | salesReport, expenseReport, gstReport, profitLoss, balanceSheet |
| `SYL-MOD-STF` | `staff` | Staff | staffMembers, roles |
| `SYL-MOD-ATT` | `attendance` | Attendance | attendance, biometric |
| `SYL-MOD-PAY` | `payroll` | Payroll | payslips, payrollRun |
| `SYL-MOD-APT` | `appointments` | Appointments | appointments |
| `SYL-MOD-FEE` | `fees` | Fees | feeRecords, feeStructure |
| `SYL-MOD-STU` | `students` | Students | students, progress |
| `SYL-MOD-AST` | `assets` | Assets | assets, depreciation |
| `SYL-MOD-LSE` | `lease` | Lease | leaseUnits, leaseTenants, rentCollection |
| `SYL-MOD-MBR` | `membershipplans` | Memberships | membershipPlans, memberSubscriptions |
| `SYL-MOD-WA` | `whatsapp` | WhatsApp | messages, templates |
| `SYL-MOD-CMP` | `campaigns` | Campaigns | campaigns, bulkMessages |
| `SYL-MOD-B2B` | `b2b` | B2B Marketplace | supplierProfiles, connections |
| `SYL-MOD-AIC` | `ai` | AI Copilot | aiQueries |
| `SYL-MOD-AUT` | `automation` | Automation | automationRules, digests |

**Permission shape per feature:** `{ C, R, U, D }` — Create, Read, Update, Delete
**Canonical source:** `backend/src/config/moduleRegistry.js`

**Rules:**
- Total modules: **22** (as of v1.0)
- Every new module added to the platform must get a `SYL-MOD-*` code here and an entry in `moduleRegistry.js` before going live
- Feature keys are camelCase and permanent — never rename a feature key

---

## 5. Role System

**Purpose:** Every tenant gets a set of Roles. Each Role owns a permission matrix of `{ module → feature → { C, R, U, D } }`. Business owners can create custom roles beyond the 6 standard ones.

**Issued:** 2026-05-24 | **Version:** 1.0

### Standard Roles (seeded for every tenant)

| Template Key | Name | isSystem | isOwner | Description |
|---|---|---|---|---|
| `OWNER` | Owner | true | true | Full access. Locked. Cannot be edited. |
| `ADMIN` | Admin | true | false | Full access. No owner account management. |
| `MANAGER` | Manager | true | false | Operational access. No payroll or bank accounts. |
| `ACCOUNTANT` | Accountant | true | false | Financial modules. No POS write or inventory. |
| `CASHIER` | Cashier | true | false | POS + basic invoicing only. |
| `STAFF` | Staff | true | false | Minimal read access. |

### Business-Type-Specific Extra Roles

Seeded automatically on registration based on `businessType`:

| Business Type | Extra Roles |
|---|---|
| GYM | Trainer, Front Desk |
| CLINIC | Doctor, Receptionist, Lab Technician |
| COACHING (+ all EDU types) | Teacher, Coordinator |
| SALON | Stylist |
| RESTAURANT | Waiter, Chef |
| MALL | Security |
| BEAUTY_PARLOUR | Beautician |
| BARBERSHOP | Barber |
| DENTAL | Dentist |

**Canonical source:** `backend/src/config/roleTemplates/`

### Role Permission JSON Schema

```json
{
  "invoicing": {
    "invoices":   { "C": true,  "R": true,  "U": true,  "D": false },
    "creditNotes":{ "C": true,  "R": true,  "U": false, "D": false }
  },
  "pos": {
    "sales":      { "C": true,  "R": true,  "U": false, "D": false }
  }
}
```
- Module key absent = module is inaccessible for this role
- `isOwner: true` on a Role bypasses all permission checks — full access always

---

## 6. Reserved Namespace Index

All Syllabrix platform codes follow the `SYL-[NAMESPACE]-[ID]` pattern.
Namespaces issued so far:

| Namespace | Meaning | Example |
|---|---|---|
| `BC` | Business Category | `SYL-BC-RET` |
| `MOD` | Platform Module | `SYL-MOD-INV` |

> Namespaces reserved but not yet issued:
> `FF` (Feature Flags), `PLN` (Plans), `EVT` (Platform Events)

---

## Changelog

| Date | Version | Change |
|---|---|---|
| 2026-05-23 | 1.0 | Initial issue — Business Category Codes (`SYL-BC-*`), 12 categories, 68 business types |
| 2026-05-23 | 1.1 | Business Type Codes (`SYL-BC-[CAT]-[LL##]`) — all 68 types coded across 12 categories |
| 2026-05-23 | 1.2 | Business Type Segregation Infrastructure — registry, base config, overrides, middleware, frontend hook |
| 2026-05-24 | 1.3 | Module Codes (`SYL-MOD-*`) — 22 modules, feature registry, permission JSON schema |
| 2026-05-24 | 1.4 | Role System — 6 standard roles, business-type-specific extra roles, CRUD permission matrix |
