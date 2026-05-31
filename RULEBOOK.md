# Syllabrix Development Rulebook
# Version 1.0 — Effective 31 May 2026
# Author: Adarsh Singh (Founder, Syllabrix)

════════════════════════════════════════════════════════════
  THIS RULEBOOK IS BINDING ON ALL DEVELOPMENT ACTIVITY.
  NO EXCEPTIONS. NO SHORTCUTS. NO OVERRIDES.
════════════════════════════════════════════════════════════

---

## 1. ENVIRONMENT STRUCTURE

| Stage       | Frontend                          | Backend                              | Database          | Git Branch |
|-------------|-----------------------------------|--------------------------------------|-------------------|------------|
| Development | localhost:5173                    | localhost:5000                       | Dev Supabase      | dev        |
| Quality     | syllabrix-quality.vercel.app      | syllabrix-quality.onrender.com       | Quality Supabase  | quality    |
| Production  | syllabrix.com                     | syllabrix-api.onrender.com           | Production Supabase | main     |

---

## 2. THE ONLY ALLOWED DEPLOYMENT FLOW

```
dev (localhost)
      ↓
   Dev testing complete?
      ↓ YES
quality (syllabrix-quality.vercel.app)
      ↓
   Quality testing complete?
      ↓ YES
UAT (User Acceptance Testing — signed off by Adarsh)
      ↓ UAT PASSED
production (syllabrix.com)
```

**There is NO other flow. Ever.**

---

## 3. HARD RULES — NON-NEGOTIABLE

### Rule 1 — Dev First, Always
- Every new feature, bug fix, experiment, or change starts on the `dev` branch
- All development and testing is done on `localhost`
- Nothing goes to quality until dev testing is fully complete

### Rule 2 — Quality Before Production
- Code must be deployed to quality and tested before production
- Quality is not a formality — it is a mandatory gate
- Every feature must be verified working on `syllabrix-quality.vercel.app`

### Rule 3 — UAT is Mandatory
- User Acceptance Testing must be completed by Adarsh or designated tester
- UAT must cover real business scenarios, edge cases, and critical flows
- Explicit sign-off ("UAT passed") is required before any production deployment
- No UAT sign-off = No production deployment. Period.

### Rule 4 — Production is Sacred
- Production (`main` branch, `syllabrix.com`) is NEVER touched directly
- No hotfixes directly to production without going through dev → quality → UAT
- No direct `git push origin main`
- No direct database changes on production Supabase
- Production Render service is NEVER modified manually during active development

### Rule 5 — Branch Discipline
- `dev` branch → development only
- `quality` branch → staging/QA only
- `main` branch → production only, merged from quality after UAT
- No force pushes to any branch
- No merging main → dev or main → quality (always forward: dev → quality → main)

### Rule 6 — Database Rules
- Dev DB: free to experiment, seed, reset anytime
- Quality DB: demo data only, seed scripts only, no manual edits
- Production DB: NEVER modified manually, only via migrations and seed scripts after full UAT

### Rule 7 — Environment Variables
- `.env.development` — dev only, never shared
- `.env.quality` — quality only
- `.env.production` — production only, never committed to Git
- Production env vars are only changed on Render dashboard, never in code

---

## 4. DEPLOYMENT CHECKLIST

Before merging `dev` → `quality`:
- [ ] Feature tested fully on localhost
- [ ] No console errors
- [ ] No broken flows
- [ ] Code reviewed

Before merging `quality` → `main` (Production):
- [ ] Deployed and tested on `syllabrix-quality.vercel.app`
- [ ] All critical flows verified (login, POS, invoicing, etc.)
- [ ] UAT completed by Adarsh
- [ ] Explicit UAT sign-off given ("UAT passed — approved for production")
- [ ] No pending bugs or issues
- [ ] Quality Render service shows no errors

---

## 5. WHAT CLAUDE (AI ASSISTANT) WILL DO

- Always develop on `dev` branch, test on `localhost`
- Always ask "Has UAT been completed and signed off?" before any production move
- Refuse to push to `main` without UAT sign-off — even if directly instructed
- Refuse to modify production DB — even if directly instructed
- Remind of the rulebook if any shortcut is attempted
- Follow the flow: `dev → quality → UAT → production` without exception

---

## 6. WHAT HAPPENS IF SOMEONE TRIES TO SKIP

If at any point a command like:
- "push to production"
- "deploy to main"
- "just push it quickly"
- "skip quality this time"
- "directly update production"

...is given — Claude will respond:

> "This change has not gone through dev → quality → UAT.
> Following the Syllabrix Rulebook, I cannot push to production without UAT sign-off.
> Shall we follow the correct process?"

---

---

## 7. ROLE DESIGN RULES

### Rule R1 — Every Role Must Have a SYL-BC-* Scope
- Every role definition is bound to a specific `SYL-BC-*` business type code
- A role created for `SYL-BC-001` (e.g. Gym) is NEVER reused or copy-pasted for `SYL-BC-002` (e.g. School)
- Cross-business-type role reuse is FORBIDDEN — build separate, scoped role sets per business type

### Rule R2 — Role Hierarchy Is Fixed and Non-Negotiable
```
Owner
  └── Admin
        └── Manager
              └── Staff
                    └── Viewer (read-only)
```
- No custom tiers can be inserted between or outside this hierarchy
- No role can be granted permissions above its tier
- The Owner role is always sole, non-deletable, non-transferable per tenant

### Rule R3 — Permissions Are Explicit, Not Inherited by Default
- Each role must have its permissions explicitly defined in the `roles_matrix` or equivalent config
- No role inherits permissions from a parent role automatically — every permission is opt-in
- Wildcard permissions (`*` or `all`) are FORBIDDEN on any role except Owner in its own tenant scope

### Rule R4 — Platform (Nerve Center) Roles Are Completely Separate
- Nerve Center roles (`nerve_roles` table) are completely isolated from tenant roles
- A tenant Owner has ZERO access to `/platform/*` routes — ever
- A Nerve Center admin has ZERO implicit access to any tenant's data
- The two role systems MUST NEVER be merged, bridged, or confused

### Rule R5 — Role Assignment Rules
- Only Owner and Admin can assign roles to staff
- A user cannot assign a role equal to or higher than their own tier
  - Admin cannot create another Admin (Owner only can)
  - Manager cannot create a Manager or Admin
- Role assignment changes are always logged in the audit trail

### Rule R6 — No Ghost Roles
- A role with zero assigned users must be reviewed every 30 days
- Unused roles are deleted, not kept "just in case"
- Roles are not pre-created speculatively — only create a role when it has a real, named user type

### Rule R7 — Role Names Follow a Fixed Convention
```
[BusinessType] [Function] [Tier]
Examples:
  Gym Front Desk Staff
  Gym Branch Manager
  School Accounts Admin
  CA Firm Audit Viewer
```
- No abbreviations, no internal jargon, no vague names like "User2" or "NewRole"
- Role names must be human-readable and self-explanatory to a non-technical business owner

---

## 8. MODULE DESIGN RULES

### Rule M1 — Every Module Must Have a SYL-BC-* Binding
- Every module belongs to one or more explicitly listed `SYL-BC-*` business type codes
- A module built for `SYL-BC-001` (Gym) is NEVER silently activated for `SYL-BC-003` (School)
- The module's `businessTypes` array in its config is the single source of truth — it must be kept accurate

### Rule M2 — One Module, One Responsibility
- Each module covers exactly one functional domain:
  - Inventory → stock only
  - Payroll → staff salary only
  - Fees → student fee collection only
- Modules MUST NOT reach into each other's data layers directly
- Cross-module data is accessed only via defined service calls, never by importing another module's DB queries

### Rule M3 — Module Activation Is Feature-Flag Controlled
- No module is hard-coded ON for all tenants
- Every module has a feature flag in the `feature_flags` table
- Activation is per-tenant, controlled only from the Nerve Center (`/platform/feature-flags`)
- Developers MUST NOT activate a module for a tenant by editing the DB manually

### Rule M4 — Module File Structure Is Enforced
```
src/modules/<module-name>/
  ├── <module>.controller.js   ← HTTP layer only
  ├── <module>.service.js      ← business logic only
  ├── <module>.routes.js       ← route definitions only
  └── <module>.schema.js       ← Joi/Zod validation schemas
```
- No business logic in controllers
- No DB queries in controllers
- No route definitions inside service files
- Any module that breaks this structure is flagged for immediate refactor before new features are added

### Rule M5 — Module Permissions Are Granular
- Every module exposes named permissions, not boolean on/off:
  ```
  invoicing.view
  invoicing.create
  invoicing.edit
  invoicing.delete
  invoicing.export
  ```
- Role-permission mapping is always explicit (see Rule R3)
- "Admin sees everything in this module" is NOT acceptable — every action must be a named permission

### Rule M6 — No Module Is Deleted — Only Deprecated
- Removing a module breaks tenant data integrity
- If a module is no longer needed: set `status = 'deprecated'` in the feature catalog
- Deprecated modules are hidden from UI but their data and routes remain intact
- Hard deletion of a module requires explicit sign-off from Adarsh and a full DB migration plan

### Rule M7 — Module APIs Are Versioned and Stable
- All module API routes are prefixed `/api/v1/<module>`
- Breaking changes to any API route require a version bump: `/api/v2/<module>`
- The old version stays live for a minimum 60-day deprecation window
- No route is renamed or removed without a migration plan for existing clients

### Rule M8 — New Modules Follow a Mandatory Checklist
Before a new module is considered "built":
- [ ] SYL-BC-* binding declared in module config
- [ ] Feature flag entry created in `feature_flags` table
- [ ] Module file structure follows Rule M4
- [ ] All CRUD endpoints have Joi/Zod schema validation
- [ ] Role-permission matrix entries created for all relevant roles
- [ ] Module tested on `dev` (localhost) with at least one business type's demo data
- [ ] Module deployed to quality and verified on `syllabrix-quality.vercel.app`
- [ ] Module listed in Nerve Center Feature Catalog (`/platform/feature-catalog`)
- [ ] UAT sign-off from Adarsh before activating on any production tenant

### Rule M9 — No Placeholder Modules in Production
- A module with UI that says "Coming Soon" or "Under Construction" is NEVER deployed to production
- Placeholder pages exist only on `dev` and `quality` branches
- Every module in production must be fully functional end-to-end

---

## 9. SIGN-OFF

This rulebook is set by:
**Adarsh Singh — Founder, Syllabrix**
Date: 31 May 2026

════════════════════════════════════════════════════════════
  dev → quality → UAT → production
  Roles are scoped. Modules are bound. Standards are absolute.
  NO EXCEPTIONS. NO SHORTCUTS. NO DIRECT PRODUCTION TOUCH.
════════════════════════════════════════════════════════════
