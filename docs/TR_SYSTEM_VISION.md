# Syllabrix Transport Request (TR) System
## Vision & Build Specification — v3.0

**Document Owner:** Adarsh Singh
**Created:** 05 June 2026
**Revised:** 07 June 2026 (v3.0 — complete redesign with all gaps resolved)
**Status:** Approved — Ready to Build

---

## 1. The One-Paragraph Vision

The Syllabrix TR System is a complete change management platform built inside the Syllabrix Nerve Center. Every code change starts with a Change Request (CR) raised from where the business runs — Quality or Production. That CR travels to DEV where it is built, tested, and promoted through environments via a strict one-way pipeline. Every promotion is tracked, every correction is recorded, and when code reaches Production the CR document is uploaded and matched against what was delivered — completing the full audit loop. The result is an institutional memory of every change ever made to the Syllabrix platform — traceable, auditable, and permanent.

---

## 2. The Three Environments — Each Plays a Different Role

### DEV (localhost) — The Builder
**Responsibilities:**
- Receive CRs via MD file upload (imported from Quality or Production)
- Create Nerve Center CRs directly (developer found bug on localhost)
- Create TR from CR — all CR information auto-populates the TR
- Developer writes code in VS Code + Claude
- Click "Push to Dev" in Nerve Center → backend runs git push + captures commit hash
- Promote TR → Quality via GitHub API
- Host the master archive of ALL CRs ever created
- Run completion check when TR reaches IN_PRODUCTION

**Cannot:**
- Create Business Platform CRs (those come from Quality/Production)
- Push directly to Production (Quality is mandatory checkpoint)
- Skip the Quality environment under any circumstance

---

### QUALITY (Render) — The Validator
**Responsibilities:**
- Create Business Platform CRs (raisedFrom: QUALITY)
- Create Nerve Center CRs
- Receive TR promoted from DEV
- Test code against original CR scope
- Record test results (pass / fail) per scenario
- If testing fails → generate Correction file (CR-YYYY-NNN-Q-C1)
- If testing passes → authorised role promotes TR to Production via GitHub API

**Cannot:**
- Create TRs (TR creation is DEV's responsibility)
- Accept code that bypasses the TR promote flow
- Push to Production without testing passing first

---

### PRODUCTION (Railway) — The Final Destination
**Responsibilities:**
- Create Business Platform CRs (raisedFrom: PRODUCTION)
- Create Nerve Center CRs
- Download CR document (MD file) and send to developer
- Receive code from Quality branch only — never from DEV directly
- Upload CR document at deployment → system matches and runs completion check
- Store completion check result permanently in CR record
- Rollback via GitHub API if something breaks (no DB needed — uses git history)

**Cannot:**
- Accept code from DEV directly
- Push anywhere further — Production is the end of the line
- Manage TRs (TR management is DEV/Quality's responsibility)

---

## 3. CR Code System — Environment Identity Built Into the Code

Every CR code carries its origin environment. No conflicts possible across databases.

### Format
```
[Type]-[Year]-[Sequence]-[Environment]
[Type]-[Year]-[Sequence]-[Environment]-C[N]  ← correction
```

### Examples
```
CR-2026-001-Q    Change Request, created in Quality
CR-2026-001-P    Change Request, created in Production
CR-2026-001-D    Change Request, created in DEV (Nerve Center type only)

ENH-2026-001-Q   Enhancement, created in Quality
ENH-2026-001-P   Enhancement, created in Production

CR-2026-001-Q-C1  First correction of CR-2026-001-Q
CR-2026-001-P-C2  Second correction of CR-2026-001-P
```

### Code Generator Rule
```
Quality backend   → always appends -Q
Production backend → always appends -P
DEV backend       → always appends -D (Nerve Center CRs only)
```

When a CR is imported from Production to DEV, the code stays exactly as-is (e.g. `CR-2026-001-P`). No renaming. No conflict with `CR-2026-001-Q`.

---

## 4. The Full CR Lifecycle

```
STEP 1 — RAISE (Quality or Production Nerve Center)
  Business user or admin notices a bug or missing feature
  CR created: title, problem, solution, in scope, out of scope
  CR Target: BUSINESS_PLATFORM or NERVE_CENTER
  Raised From: QUALITY or PRODUCTION (required for Business Platform CRs)
  CR Code auto-generated with environment suffix (-Q or -P)
  CR Status → DRAFT

STEP 2 — APPROVE (Quality or Production Nerve Center)
  Authorised role approves the CR
  CR document generated: CR-YYYY-NNN-Q.md or CR-YYYY-NNN-P.md
  CR Status → APPROVED
  [Future — Gap 4] Notification fires to developer via WhatsApp/email

STEP 3 — IMPORT TO DEV
  Developer downloads CR document from Quality/Production Nerve Center
  Uploads MD file to DEV Nerve Center
  DEV backend parses the MD → creates same CR in DEV/Quality DB
  CR arrives as APPROVED (already approved upstream — no re-review needed)
  CR code stays unchanged (e.g. CR-2026-001-P remains CR-2026-001-P)
  CR added to DEV master archive

STEP 4 — CREATE TR (DEV Nerve Center)
  Developer creates TR linked to imported CR
  All CR fields auto-populate the TR:
    title, problem, solution, in scope, out of scope,
    business type, modules affected, priority, raisedFrom, crTarget
  Developer adds only operational fields: git commits, test scenarios
  TR Status → DRAFT

STEP 5 — DEVELOP (localhost)
  Developer writes code in VS Code with Claude
  Developer stages and commits in VS Code (unchanged workflow)
  Developer clicks "Push to Dev" in Nerve Center
  DEV backend runs: git push origin dev (via child_process)
  DEV backend captures commit hash: git rev-parse HEAD
  Commit hash stored in TR record
  TR Status → DEVELOPMENT

STEP 6 — TEST ON DEV (DEV Nerve Center)
  Developer runs test scenarios on localhost
  Test results recorded against each scenario (PASS / FAIL)
  TR Status → TESTING

STEP 7 — PROMOTE TO QUALITY (DEV Nerve Center)
  All DEV test scenarios must be recorded (not necessarily all passed)
  Developer clicks "Push to Quality"
  DEV backend calls GitHub API → merges dev into quality branch
  Quality environment (Render) auto-deploys
  TR Status → IN_QUALITY

STEP 8A — QUALITY TESTING PASSES
  Authorised role tests in Quality against CR inScope
  All scenarios recorded as PASSED
  Authorised role clicks "Push to Production"
  Quality backend calls GitHub API → merges quality into main branch
  Production environment (Railway) auto-deploys
  TR Status → IN_PRODUCTION

STEP 8B — QUALITY TESTING FAILS → CORRECTION CYCLE
  Testing reveals a bug or mismatch with CR scope
  Quality records what failed and exact reason per scenario
  System generates Correction file: CR-YYYY-NNN-Q-C1.md
  Developer downloads correction file → uploads to VS Code / Claude
  Developer makes ONLY the corrections stated in C1
  Pushes fix to dev → promotes to Quality again
  Quality sees: original scope + C1 corrections highlighted (3-column view)
  If fails again → CR-YYYY-NNN-Q-C2 generated
  Cycle repeats until all scenarios pass

STEP 9 — PRODUCTION DEPLOYMENT + COMPLETION CHECK
  TR reaches IN_PRODUCTION
  Admin uploads the CR document (final MD — including any corrections) to Production Nerve Center
  Production backend parses the uploaded MD:
    — What was decided (inScope from CR)
    — What corrections were made (C1, C2... if any)
  System matches against what TR delivered
  Comparison: CR inScope ←→ TR scope + corrections
  Result stored permanently in CR record:
    MATCHED   → CR Status = COMPLETED ✓
    MISMATCHED → CR Status = INCOMPLETE ✗ (flagged for review)

STEP 10 — PERMANENT RECORD
  CR record in DEV master archive updated with completion result
  TR permanently archived — cannot be deleted
  Full history preserved: original CR + corrections + TR journey + completion check
```

---

## 5. CR Types and Where They Can Be Created

| CR Type | DEV | QUALITY | PRODUCTION |
|---|---|---|---|
| Business Platform | ✗ | ✓ | ✓ |
| Nerve Center | ✓ | ✓ | ✓ |

- **Business Platform CRs** → raised where the business runs (Quality/Production). `raisedFrom` field mandatory.
- **Nerve Center CRs** → raised from any environment. Developer may find the bug on localhost. `raisedFrom` not required.

---

## 6. CR Correction System

### When Generated
Quality testing fails on any scenario → correction file auto-generated.

### Correction Code Format
```
Original:      CR-2026-001-Q
Correction 1:  CR-2026-001-Q-C1
Correction 2:  CR-2026-001-Q-C2
Correction 3:  CR-2026-001-Q-C3
```

### Correction File Structure (CR-YYYY-NNN-Q-C1.md)
```markdown
# CR-2026-001-Q-C1 — Correction 1
## [Original Title] — Quality Correction

| Field             | Value                     |
|-------------------|---------------------------|
| Correction Code   | CR-2026-001-Q-C1          |
| Original CR       | CR-2026-001-Q             |
| Correction Number | 1                         |
| Failed In         | QUALITY                   |
| Raised By         | [tester name]             |
| Date              | [date]                    |

## What Was Originally Decided
[Exact copy of original CR inScope]
- Item 1
- Item 2
- Item 3

## What Was Built (From TR)
- Item 1 ✓ correct
- Item 2 ✓ correct
- Item 3 ✗ missing / wrong

## What Failed in Quality Testing
- Scenario 1: [what was tested] → [what happened] → FAILED
- Scenario 2: [what was tested] → [what happened] → FAILED

## The Gap (Decided vs Built)
- Item 3 was in scope but not built correctly because [reason]
- Scenario 1 failed because [specific reason]

## Correction Required (New In Scope)
[Only what needs to be fixed — nothing more]
- Fix Item 3 — specifically [what exactly]
- Resolve Scenario 1 — specifically [what exactly]

## Do Not Touch
[Already correct — developer must not change these]
- Item 1 — correct ✓
- Item 2 — correct ✓

## How to Verify This Correction
[Exact steps Quality will use to re-test]
- Step 1: [exact test]
- Step 2: [exact test]
```

### How Quality Sees the Correction (3-Column View)
```
ORIGINAL SCOPE      │  WHAT WAS BUILT    │  CORRECTION C1
──────────────────  │  ──────────────── │  ──────────────────
Item 1 ✓            │  Item 1 ✓          │  — (already correct)
Item 2 ✓            │  Item 2 ✓          │  — (already correct)
Item 3 ✗            │  Item 3 ✗ wrong    │  → FIXED ← highlighted
```
Only corrected items highlighted. Quality re-tests only the highlighted items.

---

## 7. Push to Dev — Technical Implementation

The "Push to Dev" button in DEV Nerve Center works because the DEV backend (localhost Express server) runs on the same machine as the git repository.

```
Developer commits code in VS Code (unchanged workflow)
        ↓
Developer clicks "Push to Dev" in Nerve Center TR page
        ↓
POST /api/platform/transport/:id/push-to-dev
        ↓
DEV backend runs via child_process:
  git push origin dev    → pushes to GitHub
  git rev-parse HEAD     → captures commit hash
        ↓
Commit hash stored in TR record (devPushCommit)
TR status → DEVELOPMENT
```

**Config required in `.env.development`:**
```
GIT_REPO_PATH=D:/new project
```

Developer habit change: instead of `git push` in terminal → click "Push to Dev" in Nerve Center. Everything else unchanged.

---

## 8. Rollback from Production

Rollback does not need the Quality DB. GitHub is the source of truth.

```
Admin clicks Rollback in Production Nerve Center
        ↓
Production backend calls GitHub API:
  GET /repos/{owner}/{repo}/commits?sha=main&per_page=2
        ↓
GitHub returns:
  Commit 1 (latest)   = the broken deployment
  Commit 2 (previous) = the good state
        ↓
Production backend force resets main to Commit 2:
  PATCH /git/refs/heads/main  { sha: previousSha, force: true }
        ↓
Railway detects main branch change → auto-deploys previous good state
Done ✓
```

No cross-database access. No TR record needed. GitHub history is the rollback source.

---

## 9. Production Deployed View — Completion Check via MD Upload

When code arrives in Production, the admin uploads the final CR document (MD file). The system matches it against the TR and runs the completion check.

```
TR promoted to Production
        ↓
Admin uploads CR-2026-001-Q.md (or C1/C2 if corrections happened)
        ↓
Production backend parses MD:
  — Original inScope (what was decided)
  — Corrections made (C1, C2...)
        ↓
System matches: CR inScope ←→ TR scope + corrections
        ↓
Result stored in CR record:
  MATCHED   → CR COMPLETED ✓
  MISMATCHED → CR INCOMPLETE ✗
```

**Same MD upload mechanism as DEV import — different purpose:**
```
DEV    → upload MD → CREATE new CR
PROD   → upload MD → MATCH + COMPLETE existing CR
```

---

## 10. Role-Based Promotion Rights

Permissions assigned by Syllabrix — not hardcoded. Any Nerve Center role can be granted any permission.

| Action | Permission |
|---|---|
| Push code to dev branch | TR_PUSH_DEV |
| Promote TR → Quality | TR_PROMOTE_QUALITY |
| Promote TR → Production | TR_PROMOTE_PRODUCTION |
| Create Business Platform CR | TR_CREATE_CR |
| Approve CR | TR_APPROVE_CR |
| Generate Correction file | TR_GENERATE_CORRECTION |
| Run Completion Check | TR_COMPLETION_CHECK |

---

## 11. Strict Pipeline Rules

```
✓ DEV → QUALITY           Developer promotes (TR_PROMOTE_QUALITY)
✓ QUALITY → PRODUCTION    Authorised role promotes (TR_PROMOTE_PRODUCTION)
✗ DEV → PRODUCTION        Permanently blocked — no exceptions
✗ PRODUCTION → anywhere   Code sits here — rollback only
```

---

## 12. The CR Archive — DEV as Master Record

DEV/Quality DB holds the permanent record of every CR ever created:

| Source | How it arrives in DEV |
|---|---|
| Quality CR | Already in shared DB (DEV + Quality share same Supabase) |
| Production CR | MD file downloaded → uploaded to DEV Nerve Center |
| DEV Nerve Center CR | Created directly |

**Every CR record contains:**
- Original CR document (what was decided)
- Environment that raised it (raisedFrom)
- CR target (Business Platform / Nerve Center)
- Linked TR reference
- All corrections (C1, C2...) with full detail
- Completion check result (MATCHED / MISMATCHED)
- Final status (COMPLETED / INCOMPLETE / IN_DEVELOPMENT)

**Searchable by:** environment, business type, CR target, date, status, correction count.

---

## 13. Notification System (Deferred — Future CR)

Gap 4 is parked. When WhatsApp/email integration is ready:
- CR approved in Quality/Production → notification fires to developer
- Message contains: CR code, title, environment, download link

---

## 14. Coding Plan — Build Phases

### Phase 1 — Foundation
- `frontend/src/config/env.js` — central `ENV_FEATURES` object
- All Nerve Center pages read from ENV_FEATURES before rendering
- Replace all hostname-based detection

### Phase 2 — Schema Changes
```
ChangeRequest model:
  + correctionParentId    (links C1 back to original CR)
  + correctionNumber      (1, 2, 3...)
  + importedFrom          (QUALITY / PRODUCTION)
  + completionStatus      (MATCHED / MISMATCHED / PENDING)
  + completionCheckedAt
  + completionCheckedBy
  + correctionScope       (what needs fixing — for correction CRs)
  + doNotTouch            (what is already correct — for correction CRs)
  + verificationSteps     (how to re-test — for correction CRs)

TransportRequest model:
  - Remove IN_QUALITY_RECEIVED status
  - Remove IN_PRODUCTION_RECEIVED status
  + linkedCRId            (hard link to CR)
  + devPushCommit         (commit hash from Push to Dev)

Permissions:
  + TRPermission model (TR_PUSH_DEV, TR_PROMOTE_QUALITY, etc.)
```

### Phase 3 — DEV/Quality Backend
```
changes/
  + importCR()              — parse MD, create CR as APPROVED
  + generateCorrection()    — create CR-YYYY-NNN-Q-C1
  + runCompletionCheck()    — decided vs built comparison
  + matchProductionUpload() — match uploaded MD to existing CR

transport/
  + createFromCR()          — TR auto-populated from CR
  + pushToDev()             — git push via child_process + capture hash
  ~ promote()               — simplified, no RECEIVED state
  ~ rollback()              — unchanged
```

### Phase 4 — Production Backend
```
changes/
  create()                  — Business Platform CR (-P suffix) only
  list()                    — Production CRs only
  generateDocument()        — download MD
  uploadForCompletion()     — match + complete CR

transport/
  — Remove all TR management endpoints
  + rollback()              — GitHub API, get last 2 commits on main
```

### Phase 5 — DEV Nerve Center Frontend
```
/platform/changes
  + Import CR button (MD upload → createFromCR)
  + New Nerve Center CR button
  Full archive view (all CRs)

/platform/changes/new
  Nerve Center CR form only (-D suffix)

/platform/transport
  Full pipeline view
  Push to Dev button
  Promote to Quality button
  Completion check results panel

/platform/transport/new
  Create TR from CR (auto-populate all fields)
```

### Phase 6 — Quality Nerve Center Frontend
```
/platform/changes
  New Business Platform CR (raisedFrom: QUALITY, -Q suffix)
  New Nerve Center CR (-Q suffix)

/platform/transport
  Incoming TRs view
  Test scenario recording (pass / fail per scenario)
  3-column correction view (original | built | correction)
  Generate Correction file button (on failure)
  Promote to Production button (authorised role)
```

### Phase 7 — Production Nerve Center Frontend
```
/platform/changes
  New Business Platform CR (raisedFrom: PRODUCTION, -P suffix)
  New Nerve Center CR (-P suffix)
  Upload CR for completion check

/platform/transport
  Live deployment view (latest commit on main via GitHub API)
  Rollback button only
  Completion check results
```

### Phase 8 — Correction System
- Correction file generator (backend)
- Correction file parser (when imported to DEV)
- 3-column comparison view (Quality frontend)
- Correction highlighting logic

### Phase 9 — Completion Check
- MD parser in Production backend
- Scope comparison engine (CR inScope vs TR corrections)
- Result storage in CR record
- COMPLETED / INCOMPLETE status update

### Phase 10 — Notification System
- Deferred — future CR

---

## 15. What is NOT in Scope

- Automated CI/CD pipelines or test runners
- Code diff viewer inside Nerve Center (stays in GitHub/VS Code)
- Per-tenant rollback
- Public-facing changelog
- Notification system (deferred to Phase 10)
- Release bundles, calendars, DORA metrics (future phases)

---

## 16. Definition of Done

The TR system is complete when:

1. A Business Platform CR raised from Production → imported to DEV → built → tested → promoted to Quality → tested → promoted to Production — entirely from Nerve Center, no terminal commands needed after commit
2. Quality testing failure generates a Correction file with 3-column comparison view
3. Production upload of CR document triggers automatic completion check — CR marked COMPLETED or INCOMPLETE
4. Rollback from Production works via GitHub API in one click — no DB access needed
5. DEV master archive holds every CR ever created with full history
6. All three environments show only what belongs to them — no feature bleed
7. CR code uniquely identifies its origin environment (-Q, -P, -D)
8. Push to Dev captures git commit hash automatically — no manual entry

---

*This document is the source of truth for the TR System v3.0.*
*v1.0 and v2.0 are fully superseded. Do not reference previous versions.*
