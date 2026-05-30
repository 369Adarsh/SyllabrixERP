---
name: nerve-center-plan
description: Full plan for rebranding and expanding the Syllabrix Admin Panel into the Syllabrix Nerve Center — the single control center for all of Syllabrix operations.
metadata: 
  node_type: memory
  type: project
  originSessionId: b78ae087-c1b0-4161-b716-91a5922aad25
---

# Syllabrix Nerve Center — Full Build Plan

**Decided:** 2026-05-28  
**Status:** Planning phase — not started  
**Goal:** Transform the existing `/platform/*` admin panel into a full operational nerve center for Syllabrix as a business.

---

## What Is the Nerve Center?

The Syllabrix Nerve Center is the **single control center** for everything Syllabrix — not just tenant monitoring, but the complete operation of Syllabrix as a SaaS business. Revenue, plans, feature control, platform health, team management, compliance, and intelligence — all from one place.

Think of it like: Stripe's internal dashboard, Shopify's backend, or a mission control room.

---

## Rebrand Details

| Item | Before | After |
|---|---|---|
| Product name | Syllabrix Admin Panel | **Syllabrix Nerve Center** |
| Login page heading | "Syllabrix Platform" | "Welcome to Syllabrix Nerve Center" |
| Sidebar header | "Platform" | "Nerve Center" |
| Browser tab title | "Platform — Syllabrix" | "Nerve Center — Syllabrix" |
| URL | `/platform/*` | Keep `/platform/*` — no URL change needed |

---

## Full Navigation Structure — 7 Wings

---

### Wing 1 — Command
> Real-time overview of the entire Syllabrix platform

| Page | Route | Description | Status |
|---|---|---|---|
| Overview Dashboard | `/platform/dashboard` | Live tenant count, revenue today, active users, error rate, platform uptime | Enhance existing |
| Platform Health | `/platform/health` | API status, DB connection pool, response times, error spike alerts | NEW |
| Live Activity | `/platform/activity` | Real-time feed of what tenants are doing across the platform | Already built |

**Key metrics on Overview Dashboard:**
- Total tenants (active / inactive / trial)
- Revenue today / this month
- New signups last 7 days
- Active users right now
- Open bug reports (P1/P2/P3)
- Platform uptime %
- DB connection health indicator

---

### Wing 2 — Growth
> Syllabrix as a business — revenue, plans, pipeline

| Page | Route | Description | Status |
|---|---|---|---|
| Revenue | `/platform/revenue` | MRR, ARR, churn rate, plan distribution chart, revenue by business type | NEW |
| Plans & Billing | `/platform/plans` | Assign/change plans per tenant, trial extensions, manual overrides, billing history | NEW |
| Onboarding Pipeline | `/platform/onboarding` | New signup → KYC submitted → Approved flow with drop-off tracking | NEW |

**Revenue page details:**
- MRR (Monthly Recurring Revenue) card
- ARR (Annual Recurring Revenue) card
- Churn rate % this month
- New MRR added this month
- Plan distribution donut chart (Free / Starter / Pro / Enterprise)
- Revenue by business type bar chart (Retail, Education, Gym, etc.)
- Month-over-month growth line chart

**Plans & Billing page details:**
- List of all tenants with their current plan + renewal date
- Inline plan change (dropdown per tenant row)
- Trial extension button (extend by 7/14/30 days)
- Manual override — activate/suspend a tenant
- Billing history per tenant

**Onboarding Pipeline page details:**
- Kanban-style or table view: New Signup → Docs Submitted → KYC Review → Approved → Active
- Drop-off count at each stage
- Days stuck in each stage (flag if >3 days in KYC)
- One-click move to next stage
- Link to compliance record

---

### Wing 3 — Tenants
> Managing every business on the platform

| Page | Route | Description | Status |
|---|---|---|---|
| All Tenants | `/platform/tenants` | Full list, search, filter by type/plan/status, drill-down into each tenant | Already built |
| Compliance & KYC | `/platform/compliance` | KYC status, risk levels, compliance flags, reviewer notes | Already built |
| Subscriptions | `/platform/subscriptions` | Which tenant is on which plan, renewal dates, overdue payments | NEW |

---

### Wing 4 — Platform Control
> What Syllabrix offers and how it's controlled

| Page | Route | Description | Status |
|---|---|---|---|
| Business Catalog | `/platform/business-catalog` | All business types, SYL-BC-* codes, module assignments per type | Already built |
| Roles & Modules | `/platform/roles-matrix` | Full permission matrix, role requests tab | Already built |
| Feature Flags | `/platform/feature-flags` | Turn modules on/off globally or per specific tenant | NEW |
| Module Usage | `/platform/module-usage` | Which modules are most used, adoption rates across all tenants | NEW |

**Feature Flags page details:**
- Global flags: toggle a module for ALL tenants instantly
- Per-tenant override: enable/disable a specific module for one tenant
- Flag history: who toggled what and when
- Emergency kill switch: disable a module that's causing issues across the platform

**Module Usage page details:**
- Module adoption % (what % of eligible tenants have it enabled)
- Most active modules by API call volume
- Least used modules (candidates for deprecation)
- Usage trend per module over time

---

### Wing 5 — Operations
> Day-to-day running of Syllabrix

| Page | Route | Description | Status |
|---|---|---|---|
| Bug Reports | `/platform/support-console` | All tenant-reported issues, P1/P2/P3 priority queue | Already built |
| Dev Queue | `/platform/dev-queue` | Internal engineering task board | Already built |
| Announcements | `/platform/announcements` | Push messages to all or specific tenants | Already built |
| Maintenance Mode | `/platform/maintenance` | Schedule/activate platform maintenance with tenant notification | NEW |

**Maintenance Mode page details:**
- Schedule a maintenance window (date + time + duration)
- Auto-notify all tenants via in-app banner + email
- Activate emergency maintenance instantly
- Maintenance history log
- Customizable message to show tenants during downtime

---

### Wing 6 — Intelligence
> Data, logs, and insights

| Page | Route | Description | Status |
|---|---|---|---|
| Audit Logs | `/platform/audit-logs` | Every admin action ever taken inside the Nerve Center | Already built |
| Platform Analytics | `/platform/analytics` | Tenant growth over time, feature adoption curves, retention cohorts | NEW |
| Error Tracker | `/platform/errors` | All 4xx/5xx errors across all tenants, grouped by type and frequency | NEW |

**Platform Analytics page details:**
- Tenant growth line chart (cumulative + new per month)
- Retention cohort table (which tenants from month X are still active)
- Feature adoption curve per module
- Business type distribution over time
- Geographic distribution (city/state) if available

**Error Tracker page details:**
- Error frequency table (endpoint + error code + count)
- Top 10 most frequent errors this week
- Per-tenant error breakdown (which tenant is hitting the most errors)
- Error trend chart — is error rate going up or down?
- Link to relevant audit log entries

---

### Wing 7 — Team
> Internal Syllabrix team management

| Page | Route | Description | Status |
|---|---|---|---|
| Admins | `/platform/admins` | All Syllabrix internal staff, their roles (SUPER/ADMIN/SUPPORT) | Already built |
| Access Control | `/platform/access` | Who can see which Wings inside the Nerve Center | Enhance existing |
| Activity Log | `/platform/audit-logs` | What each internal admin did and when (already in Audit Logs) | Partially built |

---

## Build Phases

### Phase 0 — Rebrand (Start anytime)
**Time: ~1 day**
- Update all titles, headings, login page
- Update sidebar header to "Nerve Center"
- Update browser tab titles
- No backend changes needed

### Phase 1 — Growth Wing (After Phase 0)
**Time: ~3–4 days**
- Revenue Dashboard page
- Plans & Billing page
- Onboarding Pipeline page
- Requires: plan/billing data model in backend

### Phase 2 — Platform Control additions (After Phase 1)
**Time: ~2–3 days**
- Feature Flags page
- Module Usage page
- Requires: feature flag model in DB + API

### Phase 3 — Intelligence (After Phase 2)
**Time: ~2–3 days**
- Platform Analytics page
- Error Tracker page
- Requires: error logging middleware on backend

### Phase 4 — Command enhancements (After Phase 3)
**Time: ~1–2 days**
- Platform Health page
- Enhance Overview Dashboard with live metrics

### Phase 5 — Operations additions (Last)
**Time: ~1 day**
- Maintenance Mode page
- Requires: maintenance flag + tenant notification system

---

## What's Already Built vs New

| Already Built (11 pages) | New to Build (9 pages) |
|---|---|
| Overview Dashboard | Platform Health |
| Live Activity | Revenue |
| All Tenants | Plans & Billing |
| Compliance & KYC | Onboarding Pipeline |
| Business Catalog | Subscriptions |
| Roles & Modules | Feature Flags |
| Bug Reports | Module Usage |
| Dev Queue | Platform Analytics |
| Announcements | Error Tracker |
| Audit Logs | Maintenance Mode |
| Admins | — |

**~55% already built. ~45% new to build.**

---

## Technical Notes

- All new pages live under `/platform/*` routes — no URL restructuring needed
- New backend endpoints go under `/api/platform/*` — follow existing pattern
- All new pages use the same dark platform theme (NOT the business portal Slate+Teal theme)
- All new SA API calls go through `api/platform.js` using `saToken`
- Feature Flags will require a new `FeatureFlag` model in Prisma schema
- Revenue/Plans will require a `Plan` and `Subscription` model (or integration with Razorpay subscriptions)

---

## How to Apply

When starting a new phase, read this file first. Build in the exact phase order — later phases depend on data/infrastructure from earlier ones. Each page should follow the existing platform admin dark theme (navy `#1E2B3C` sidebar, dark cards, teal accent `#17B9D0`).
