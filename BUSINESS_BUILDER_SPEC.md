---
name: business-builder-spec
description: "Full technical specification for the Syllabrix Business Builder — a no-code drag-and-drop tool inside the Nerve Center to create business types, categories, and module assignments dynamically without any code changes."
metadata: 
  node_type: memory
  type: project
  originSessionId: b78ae087-c1b0-4161-b716-91a5922aad25
---

# Syllabrix Business Builder — Full Technical Specification

**Decided:** 2026-05-28  
**Status:** Planned — not started  
**Location in Nerve Center:** Nerve Center → Platform Control → Business Builder  
**Replaces:** Static Business Catalog (hardcoded `platformCatalog.js` + Prisma enum)

---

## What Problem This Solves

**Today** — adding a new business type requires a developer to:
1. Add enum value to Prisma schema
2. Hardcode modules in `platformCatalog.js`
3. Update sidebar conditions in `Sidebar.jsx`
4. Deploy code changes
5. Manually update standards doc

**After Business Builder** — anyone on the Syllabrix team can:
1. Open Nerve Center → Business Builder
2. Create a new business type in 5 minutes
3. Drag modules onto a canvas
4. Publish — live immediately
5. Zero code. Zero deployment. Zero downtime.

---

## The Complete User Flow

```
STEP 1 — Category Selection
────────────────────────────
Q: "Does this business fit an existing category?"

  ○ YES → Pick from dropdown
           (Retail & Commerce, Education, Fitness & Sports...)

  ○ NO  → Create new category
           Enter name: "Pet & Animal Care"
           Syllabrix generates: SYL-BC-PAC
           Real-time conflict check: ✓ Available (green) / ✗ Taken (red)
           Admin can override the 3-letter code if needed
           Confirm → Category created

────────────────────────────
STEP 2 — Business Type Identity
────────────────────────────
Enter name: "Pet Shop"
Syllabrix generates: SYL-BC-PAC-PS01
  └── SYL-BC  = Syllabrix Business Category namespace
  └── PAC     = category code
  └── PS      = initials of business type name
  └── 01      = sequence (first of this type in category)

Real-time conflict check: ✓ Available (green) / ✗ Taken (red)
Admin can override the 2-letter code (PS → PET)
Optional: add icon (emoji), description

────────────────────────────
STEP 3 — Module Canvas (Drag & Drop)
────────────────────────────
Left panel: Module Library (all available modules)
Right panel: Business Canvas (drop zone)

Drag modules from library → drop onto canvas
Each module on canvas gets a tier:
  CORE     — always enabled, tenant cannot remove
  OPTIONAL — tenant can toggle on/off
  LOCKED   — visible but requires higher plan

Dependency Engine auto-resolves:
  Drag POS → auto-adds Inventory + Invoicing
  Drag Payroll → auto-adds Attendance
  Remove Inventory → warns "POS requires Inventory"

────────────────────────────
STEP 4 — Role Auto-Generator
────────────────────────────
Based on selected modules, system suggests roles:
  Inventory + Invoicing + POS + Reports →
    Owner        (full access)
    Manager      (ops access)
    Cashier      (POS only)
    Accountant   (finance only)

Admin can customise permissions per role before publishing.

────────────────────────────
STEP 5 — Review & Publish
────────────────────────────
Summary card shown:
  Category:      Pet & Animal Care  (SYL-BC-PAC)  [NEW / EXISTING]
  Business Type: Pet Shop           (SYL-BC-PAC-PS01)
  Modules:       8 modules (5 core, 3 optional)
  Roles:         4 roles auto-generated
  Status:        Draft → Ready to Publish

Actions:
  [Save as Draft]    — save without publishing
  [Save as Template] — save for reuse later
  [Publish]          — go live immediately

On Publish:
  1. BusinessType record created in DB with isActive: true
  2. SYL-BC-* code registered permanently
  3. Roles created in DB
  4. Available immediately in tenant registration flow
  5. Standards doc (DB) auto-updated
```

---

## ID Generation System

### Category ID — Format: `SYL-BC-[XXX]`

```
Input:  "Pet & Animal Care"
Logic:  Extract meaningful words → Pet, Animal, Care
        Take first letter of each → P, A, C
        Combine → PAC
Output: SYL-BC-PAC

Conflict resolution:
  PAC taken? → Try PAN, PAT, PAR... (increment last letter)
  Still taken? → Show admin 3 suggestions to choose from
  Admin can also manually type a 3-letter code
```

**Rules:**
- Always 3 uppercase letters
- Always prefixed with `SYL-BC-`
- Permanent once assigned — never reused even if category deleted
- Stored in `BusinessCategory` table

### Business Type ID — Format: `SYL-BC-[CAT]-[XX][NN]`

```
Input:  Category = PAC, Business = "Pet Shop"
Logic:  Extract initials → P, S → PS
        Find highest sequence in PAC → 00
        Increment → 01
Output: SYL-BC-PAC-PS01

Next in same category:
  "Pet Grooming" → PG → SYL-BC-PAC-PG01
  Another "Pet Shop" variant → PS → SYL-BC-PAC-PS02

Conflict resolution:
  PS01 taken? → PS02, PS03...
  Admin can override the 2-letter code
```

**Rules:**
- Always 2 uppercase letters + 2-digit sequence
- Sequence is per category (resets per category, not global)
- Permanent once assigned
- Stored in `BusinessType` table

---

## Database Schema

```prisma
// New: Dynamic business categories (replaces hardcoded SYL-BC-* list)
model BusinessCategory {
  id          String   @id @default(cuid())
  name        String           // "Pet & Animal Care"
  code        String   @unique // "SYL-BC-PAC"
  icon        String?          // emoji
  description String?
  isActive    Boolean  @default(true)
  createdBy   String           // SA who created it
  createdAt   DateTime @default(now())

  businessTypes BusinessType[]
}

// New: Dynamic business types (replaces Prisma enum BusinessType)
model BusinessType {
  id          String   @id @default(cuid())
  name        String           // "Pet Shop"
  code        String   @unique // "SYL-BC-PAC-PS01"
  categoryId  String
  icon        String?
  description String?
  isActive    Boolean  @default(false)  // false = draft
  isTemplate  Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  publishedAt DateTime?

  category    BusinessCategory      @relation(fields: [categoryId], references: [id])
  modules     BusinessTypeModule[]
  roles       BusinessTypeRole[]
  tenants     Tenant[]
}

// Junction: which modules belong to which business type
model BusinessTypeModule {
  id             String       @id @default(cuid())
  businessTypeId String
  moduleKey      String       // "invoicing", "pos", "inventory"
  tier           String       // "CORE" | "OPTIONAL" | "LOCKED"
  planRequired   String?      // null = all plans, "PRO" = pro only
  sortOrder      Int          @default(0)

  businessType   BusinessType @relation(fields: [businessTypeId], references: [id])
}

// Roles per business type (auto-generated + customisable)
model BusinessTypeRole {
  id             String       @id @default(cuid())
  businessTypeId String
  roleName       String       // "Owner", "Manager", "Cashier"
  permissions    Json         // module → CRUD map
  isDefault      Boolean      @default(true)

  businessType   BusinessType @relation(fields: [businessTypeId], references: [id])
}

// Saved module combination templates
model BusinessTemplate {
  id          String   @id @default(cuid())
  name        String           // "Standard Retail Pack"
  description String?
  modules     Json             // snapshot of moduleKey + tier
  createdBy   String
  createdAt   DateTime @default(now())
}
```

---

## Backend API Endpoints

```
// Categories
GET    /api/platform/categories              — list all categories
POST   /api/platform/categories              — create new category (generates SYL-BC-* code)
GET    /api/platform/categories/check-code   — check if code available (?code=PAC)

// Business Types
GET    /api/platform/business-types          — list all (draft + active)
POST   /api/platform/business-types          — create new (generates SYL-BC-*-XX01 code)
PUT    /api/platform/business-types/:id      — update name, icon, description
DELETE /api/platform/business-types/:id      — delete (only if no tenants)
GET    /api/platform/business-types/check-code — check if code available

// Module Assignment
POST   /api/platform/business-types/:id/modules         — add module to canvas
DELETE /api/platform/business-types/:id/modules/:key    — remove module
PATCH  /api/platform/business-types/:id/modules/:key    — change tier
PATCH  /api/platform/business-types/:id/modules/reorder — update sort order

// Publishing
POST   /api/platform/business-types/:id/publish          — go live
POST   /api/platform/business-types/:id/unpublish        — take offline
POST   /api/platform/business-types/:id/clone            — clone existing type

// Templates
GET    /api/platform/templates                — list saved templates
POST   /api/platform/templates                — save canvas as template
POST   /api/platform/templates/:id/apply      — load template into canvas
DELETE /api/platform/templates/:id            — delete template

// Role Suggestions
GET    /api/platform/business-types/:id/suggest-roles  — auto-suggest roles from modules
```

---

## Frontend Component Structure

```
pages/platform/BusinessBuilder.jsx          ← Main page
├── CategorySelector.jsx                    ← Step 1: existing or new
│   ├── ExistingCategoryDropdown.jsx
│   └── NewCategoryForm.jsx                 ← name → auto-generates SYL-BC-XXX
├── BusinessTypeIdentity.jsx                ← Step 2: name + auto ID
│   ├── CodePreview.jsx                     ← live preview of generated ID
│   └── ConflictIndicator.jsx               ← green ✓ / red ✗
├── ModuleCanvas.jsx                        ← Step 3: drag & drop
│   ├── ModuleLibrary.jsx                   ← left panel
│   │   └── DraggableModuleCard.jsx
│   ├── DropZone.jsx                        ← right panel
│   │   └── DroppedModule.jsx               ← with tier selector
│   └── DependencyToast.jsx                 ← auto-add notification
├── RoleGenerator.jsx                       ← Step 4: suggested roles
│   └── RolePermissionEditor.jsx
└── PublishPanel.jsx                        ← Step 5: review + publish

lib/
├── dependencyEngine.js                     ← module dependency rules
├── codeGenerator.js                        ← SYL-BC-* ID generation logic
└── roleSuggester.js                        ← role suggestions from modules
```

**Drag & Drop library:** `@dnd-kit/core` + `@dnd-kit/sortable`

---

## Dependency Engine Rules

```js
// lib/dependencyEngine.js
const MODULE_DEPENDENCIES = {
  pos:          ['inventory', 'invoicing'],
  payroll:      ['attendance'],
  fees:         ['customers'],
  campaigns:    ['customers'],
  creditnotes:  ['invoicing'],
  quotations:   ['customers', 'invoicing'],
  returns:      ['inventory', 'invoicing'],
  bills:        ['vendors'],
  stockTransfer: ['inventory'],
};

// When a module is removed, check reverse dependencies
const REVERSE_DEPENDENCIES = {
  inventory: ['pos', 'returns', 'stockTransfer'],
  invoicing: ['pos', 'creditnotes', 'quotations'],
  customers: ['fees', 'campaigns', 'quotations'],
  attendance: ['payroll'],
  vendors:   ['bills'],
};
```

---

## Code Generator Logic

```js
// lib/codeGenerator.js

// Generate category code from name
const generateCategoryCode = (name) => {
  const words = name.split(/[\s&,]+/).filter(w => w.length > 2);
  const initials = words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
  return `SYL-BC-${initials.padEnd(3, 'X').slice(0, 3)}`;
};

// Generate business type code from category + name + sequence
const generateTypeCode = (categoryCode, name, sequence) => {
  const words = name.split(/[\s&,]+/).filter(Boolean);
  const initials = words.slice(0, 2).map(w => w[0].toUpperCase()).join('').padEnd(2, 'X');
  const seq = String(sequence).padStart(2, '0');
  const catShort = categoryCode.replace('SYL-BC-', '');
  return `SYL-BC-${catShort}-${initials}${seq}`;
};
```

---

## What Changes in Existing Code

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add 4 new models, keep old `BusinessType` enum for migration period |
| `src/modules/auth/auth.service.js` | Validate businessType against DB instead of enum |
| `frontend/src/components/layout/Sidebar.jsx` | Read allowed modules from DB/API instead of hardcoded conditions |
| `frontend/src/config/platformCatalog.js` | Becomes module feature definitions only (not business assignments) |
| `frontend/src/pages/platform/BusinessCatalog.jsx` | Replaced by BusinessBuilder.jsx |

---

## Migration Plan (Existing 73 Business Types)

```
1. Run migration script: seed all existing hardcoded business types
   into new BusinessType + BusinessCategory DB tables

2. Existing Prisma enum stays temporarily for backward compatibility

3. Switch registration flow to use DB validation

4. Once stable — remove the hardcoded enum from schema

Migration script: backend/prisma/migrate-business-types.js
```

---

## Build Timeline

| Week | Work |
|---|---|
| **Week 1** | DB schema, Prisma migration, seed existing 73 types into DB, backend CRUD APIs |
| **Week 2** | Frontend: CategorySelector + BusinessTypeIdentity + CodeGenerator + conflict checker |
| **Week 3** | Frontend: ModuleCanvas drag-and-drop, DependencyEngine, tier selector |
| **Week 4** | RoleGenerator, Templates (save/load), Clone feature, PublishPanel |
| **Week 5** | Connect registration flow to dynamic types, sidebar reads from DB, testing |

**Total: ~5 weeks**

---

## Extra Features (Post-Launch)

| Feature | Description |
|---|---|
| **Module Marketplace** | Third-party/custom modules listed and drag-able — opens plugin ecosystem |
| **A/B Module Testing** | Different module sets for different tenants of same type — product intelligence |
| **Module Health Badge** | 🟢 Stable / 🟡 Warning / 🔴 Issues on each module card |
| **Usage Analytics** | Which modules are most used per business type |
| **Deprecation Flow** | Mark a module as deprecated — warn tenants before removing |

---

## The Big Picture

Right now Syllabrix is a **fixed ERP** — business types are hardcoded by engineers.

After Business Builder, Syllabrix becomes a **composable ERP platform** — infinitely configurable by the Syllabrix team without touching code.

- Zoho cannot do this
- Tally cannot do this
- This is Syllabrix's **competitive moat**

Every new market, every new business type, every new category — live in 5 minutes.
