# Syllabrix Transport Request (TR) System
## Vision & Build Specification

**Document Owner:** Adarsh Singh  
**Created:** 05 June 2026  
**Status:** Approved — Ready to Build  
**Location:** Syllabrix Nerve Center → Transport Wing

---

## 1. The One-Paragraph Vision

The Syllabrix Transport Request (TR) System is a built-in release management platform inside the Syllabrix Nerve Center. It gives every code change — a new feature, a bug fix, a configuration update — a tracked identity from the moment it is created to the moment it reaches production. Developers log a TR, test it, and promote it across environments (Development → Quality → Production) entirely from inside the Nerve Center with a single button click, with no manual git commands needed after the initial code push. Every action is permanently recorded, every promotion is audited, every rollback is traceable. Over time, the TR system becomes the living memory of how Syllabrix was built — a complete, searchable, visual history of the platform's evolution.

---

## 2. The Problem We Are Solving

| Problem Today | How TR System Solves It |
|---|---|
| Code moves between environments manually via VS Code git push — error-prone and undocumented | Promotions happen via one button click from Nerve Center; GitHub API handles the merge |
| No record of what changed, when, or why | Every change is logged as a TR with full description, module tag, and audit trail |
| "Clinic stays on dev" is a verbal rule — easy to forget | Scope Lock enforces SYL-BC-* rules automatically; promotion is blocked until unlocked |
| Rollback means manually reverting commits under pressure | Rollback button triggers a clean revert via GitHub API; history preserved |
| No visibility into the platform's growth over time | Development History page shows the full timeline of every change ever shipped |
| Deployments feel chaotic and risky | Pre-promotion checklists, dry run mode, and auto-block rules create a safe, predictable process |

---

## 3. Core Concept — The TR Lifecycle

Every single change to the Syllabrix platform — no matter how small — follows this journey:

```
STEP 1 — LOG
Developer makes a code change in VS Code and pushes to dev branch.
A TR is created in Nerve Center: title, description, module, SYL-BC-* code, category.
TR Status → [ DEVELOPMENT ]

STEP 2 — TEST
Developer or QA runs test scenarios attached to the TR.
Results are recorded inside the TR (pass / fail / notes).
TR Status → [ TESTING ]

STEP 3 — PROMOTE TO QUALITY
All tests pass. Pre-promotion checklist is ticked.
Developer clicks "Promote to Quality" in Nerve Center.
Nerve Center calls GitHub API → merges dev into quality branch.
Deployment triggers automatically on the quality environment.
TR Status → [ IN QUALITY ]

STEP 4 — PROMOTE TO PRODUCTION
Quality sign-off given. Reviewer approves (if required).
Developer clicks "Promote to Production".
Nerve Center calls GitHub API → merges quality into main branch.
Production environment deploys automatically.
TR Status → [ IN PRODUCTION ]

STEP 5a — SUCCESS
TR is marked complete. Version history updated. Changelog entry generated.
TR lives permanently in Development History.

STEP 5b — ROLLBACK (if something breaks)
Developer clicks "Rollback" with a reason.
Nerve Center calls GitHub API → creates a clean revert commit.
Environment is restored to previous state.
TR Status → [ ROLLED BACK ]
History records the rollback permanently — it is never hidden.
```

---

## 4. The Six Pillars

The TR system is organized into six functional pillars. Each pillar is a group of features that serve a specific purpose.

### Pillar 1 — Core Engine
The foundation. Without this, nothing else works.
- TR creation with auto-generated TR Code (TR-YYYY-NNN)
- TR Kanban board (Development / Testing / Quality / Production columns)
- TR Detail page (full info, audit log, actions)
- Promote button (dev → quality → production via GitHub API)
- Rollback button (reverts via GitHub API)
- TR Dependencies (TR-005 blocked until TR-003 is in production)

### Pillar 2 — Safety & Quality Gates
These features make promotions safe and prevent mistakes.
- Pre-Promotion Checklist (mandatory tick-off before promote button activates)
- Scope Lock (SYL-BC-* enforcement — clinic TR cannot promote until explicitly unlocked)
- Auto-Block Rules (never promote to prod on Friday; billing requires 2 approvals)
- Production Freeze (disable all production promotions for a date range)
- Dry Run Mode (simulate a promotion without executing it)
- Test Scenario Attachment (link test cases to a TR; record pass/fail per scenario)

### Pillar 3 — Intelligence & Analytics
These features show how well the development process is working.
- DORA Metrics Dashboard (Deployment Frequency, Lead Time, Change Failure Rate, Recovery Time)
- Module Heat Map (which modules are changed most often — visual grid)
- Bottleneck Detector (flags TRs that are stuck beyond average time in any stage)
- Deployment Forecast (estimated production date based on historical data)
- Statistics Summary (total TRs, features shipped, bug fixes, rollbacks, avg lead time)

### Pillar 4 — Planning & Management
These features help plan and organize releases.
- Release Bundles (group multiple TRs into a named release — "June Release v1.2")
- Release Calendar (schedule when TRs will be promoted; visual date-based pipeline view)
- Sprint Grouping (group TRs by sprint or iteration)
- Priority Levels (Critical / High / Medium / Low with visual indicators)
- TR Templates (pre-filled forms for common change types; log a TR in 30 seconds)

### Pillar 5 — Notifications & Alerts
These features ensure nothing is missed.
- WhatsApp Notifications (TR promoted, rollback triggered, TR stuck — all via WhatsApp)
- Weekly Digest (Monday morning summary of what shipped, what is in progress)
- Customer Impact Alert (warns before production promotion which tenants are affected)
- Reviewer Notifications (notifies assigned reviewer that a TR is waiting for approval)

### Pillar 6 — History & Audit
These features create the permanent record of Syllabrix's evolution.
- Development Timeline (chronological log of every TR ever — filterable by date, module, BT)
- Version Milestones (every production bundle creates a version snapshot — v1.0, v1.1, v2.0)
- Module Evolution View (filter history to one module — see its entire growth from day one)
- Milestone Markers (manual gold pins on timeline — "First customer", "500 users", etc.)
- Immutable Audit Log (every action on every TR is permanently recorded — cannot be edited or deleted)
- Export (download full TR history as PDF or CSV for compliance or reference)

---

## 5. Complete Page List

| Page | Route | Description |
|---|---|---|
| TR Dashboard | `/nerve-center/transport` | Main landing — Kanban board, stats summary, quick actions |
| New TR Form | `/nerve-center/transport/new` | Create a TR with template options |
| TR Detail | `/nerve-center/transport/[trId]` | Full TR view — info, test results, promote, rollback, comments, audit log |
| Release Bundles | `/nerve-center/transport/bundles` | Create and manage release bundles |
| Release Calendar | `/nerve-center/transport/calendar` | Date-based view of planned and completed releases |
| Environment Status | `/nerve-center/transport/environments` | Live view — what is currently in dev / quality / production |
| Analytics | `/nerve-center/transport/analytics` | DORA metrics, heat map, bottleneck detector, forecasts |
| Development History | `/nerve-center/transport/history` | Full timeline, version milestones, module evolution, export |
| Settings | `/nerve-center/transport/settings` | Auto-block rules, freeze periods, reviewer config, notification settings |

**Total: 9 pages**

---

## 6. Database Models Required

```
TransportRequest
  - id, trCode (TR-YYYY-NNN), title, description
  - category (FEATURE | BUGFIX | ENHANCEMENT | CONFIG | HOTFIX)
  - businessTypeCode (SYL-BC-HLC-CL07, SYL-BC-GYM-001, SYL-BC-ALL, etc.)
  - modulesAffected (array)
  - status (DEVELOPMENT | TESTING | IN_QUALITY | IN_PRODUCTION | ROLLED_BACK)
  - priority (CRITICAL | HIGH | MEDIUM | LOW)
  - scopeLocked (boolean — blocks promotion if true)
  - createdBy, assignedReviewer
  - gitCommits (array of commit hashes)
  - testPlanNotes
  - promotedToQualityAt, promotedToProdAt, rolledBackAt, rolledBackReason
  - bundleId (optional — links to a release bundle)
  - sprintId (optional — links to a sprint)
  - dependsOnTRs (array of TR IDs that must be in production first)
  - createdAt, updatedAt

TRLog (Audit Trail — immutable)
  - id, trId
  - action (CREATED | STATUS_CHANGED | PROMOTED | ROLLED_BACK | COMMENT | REVIEWER_ASSIGNED | etc.)
  - fromStatus, toStatus
  - performedBy
  - notes
  - createdAt

TRComment
  - id, trId, authorId, body, createdAt

TRTestScenario
  - id, trId, title, steps, expectedResult
  - result (PENDING | PASSED | FAILED)
  - testedBy, testedAt, notes

TRBundle (Release Package)
  - id, name (e.g. "June Release v1.2"), version, description
  - status (PLANNING | IN_QUALITY | IN_PRODUCTION | ROLLED_BACK)
  - plannedProductionDate
  - createdBy, createdAt

TRSprint
  - id, name, startDate, endDate, goal

TRMilestone (History page pins)
  - id, title, description, date, icon, createdBy

TRSettings (one record per platform)
  - productionFreezeStart, productionFreezeEnd
  - autoBlockFridays (boolean)
  - billingRequiresTwoApprovals (boolean)
  - whatsappNotificationsEnabled (boolean)
  - weeklyDigestEnabled (boolean)
```

---

## 7. Technical Architecture

### GitHub API Integration
- Stored: `GITHUB_ACCESS_TOKEN` in `.env` (Personal Access Token with repo write scope)
- Promote dev → quality: `POST /repos/{owner}/{repo}/merges` (base: quality, head: dev)
- Promote quality → main: `POST /repos/{owner}/{repo}/merges` (base: main, head: quality)
- Rollback: `POST /repos/{owner}/{repo}/git/refs` + revert commit creation
- Branch mapping: `dev` = Development, `quality` = Quality, `main` = Production

### Deployment Hooks
- After any merge, Vercel/Railway deployment triggers automatically via connected GitHub repo
- No additional webhook setup needed if Vercel is already watching the branches

### Notification Integration
- WhatsApp: uses existing Syllabrix WhatsApp integration credentials
- Message templates to be created for: promotion, rollback, stuck TR, weekly digest

### Frontend
- Kanban board: drag-and-drop using `@hello-pangea/dnd` (already used or add as dep)
- Charts (DORA, heat map): `recharts` (already likely in project)
- Timeline (History page): custom vertical timeline component, Slate+Teal palette
- Calendar: `react-big-calendar` or custom grid

---

## 8. Build Phases

### Phase 1 — Core Engine (Build First)
Everything else depends on this being solid.
1. Prisma schema — all models
2. TR creation API + form
3. TR Kanban board page (status columns, drag or button-based status change)
4. TR Detail page (info + audit log)
5. Promote endpoint (GitHub API merge — dev→quality, quality→main)
6. Rollback endpoint (GitHub API revert)
7. Environment Status page (live view of what is in each branch)

### Phase 2 — Safety Layer
Makes the system trustworthy before anyone relies on it.
1. Pre-promotion checklist engine
2. Scope Lock enforcement (SYL-BC-* check before promote button activates)
3. TR Dependencies (block promotion if dependency not in production)
4. Production Freeze setting + enforcement
5. Test Scenario attachment + pass/fail recording

### Phase 3 — Planning & Management
Organizes the work.
1. Release Bundles (create, add TRs, promote bundle as a unit)
2. Sprint Grouping
3. Priority levels + visual indicators
4. TR Templates
5. Release Calendar page

### Phase 4 — History & Audit
The permanent record.
1. Development History timeline page
2. Version Milestones (auto-create on every production promotion)
3. Milestone Markers (manual pins)
4. Module Evolution filter view
5. Export (PDF / CSV)

### Phase 5 — Intelligence & Notifications
The smart layer.
1. DORA Metrics Dashboard
2. Module Heat Map
3. Bottleneck Detector
4. Deployment Forecast
5. WhatsApp Notifications
6. Weekly Digest
7. Customer Impact Alert

---

## 9. What We Are NOT Building

These are explicitly out of scope to keep the build focused:

- We are NOT building a full CI/CD pipeline — GitHub Actions, automated test runners, linting pipelines. The TR system records and promotes; it does not run automated code quality checks.
- We are NOT building a code diff viewer inside Nerve Center. Git history and code review stay in GitHub/VS Code.
- We are NOT replacing VS Code for writing code. Developers still write and push to dev branch as normal. The TR system takes over after that.
- We are NOT building per-tenant rollback in Phase 1–4. This is a Phase 5+ advanced feature that requires significant additional architecture.
- We are NOT building a public-facing changelog or status page for customers. The history is internal to Nerve Center only.

---

## 10. Definition of Done

The TR system is complete when:

1. A developer can create a TR, attach test scenarios, tick the pre-promotion checklist, and promote code from dev to quality to production — entirely from Nerve Center, without opening a terminal.
2. Every promotion and rollback is permanently recorded in the audit log.
3. The Development History page shows a complete, readable timeline of every change ever shipped to production.
4. Scope Lock prevents clinic (or any locked business type) from being promoted without explicit unlock.
5. DORA metrics dashboard shows real data from actual TR history.
6. WhatsApp notifications fire on promotion, rollback, and stuck TR events.
7. A rollback from production can be triggered and completed within 2 minutes from Nerve Center.

---

## 11. Naming Conventions

| Term | Meaning |
|---|---|
| TR | Transport Request — one unit of tracked change |
| TR Code | Auto-generated unique ID in format `TR-YYYY-NNN` (e.g. TR-2026-001) |
| Promote | Move a TR from one environment to the next |
| Rollback | Revert a TR from its current environment to the previous state |
| Bundle | A named group of TRs promoted together as one release |
| Sprint | A time-boxed group of TRs (development iteration) |
| Milestone | A manually-pinned significant moment in the platform's history |
| Scope Lock | A flag on a TR that blocks promotion based on SYL-BC-* business type rules |
| Environment | One of: Development (dev branch), Quality (quality branch), Production (main branch) |

---

## 12. Vision Statement (One Line)

> **The Syllabrix TR System turns every code change into a traceable, promotable, rollback-safe journey — and turns the history of those journeys into the living story of how Syllabrix was built.**

---

*This document is the source of truth for the TR System build. Any feature not listed here requires a vision update before it is built. Any feature listed here should not be skipped or redesigned without updating this document first.*
