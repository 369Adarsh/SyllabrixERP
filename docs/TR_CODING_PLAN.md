# Syllabrix TR System — Complete Coding Plan
## All Three Environments

**Document Owner:** Adarsh Singh
**Created:** 07 June 2026
**Status:** Approved — Reference for Build
**Vision Reference:** `docs/TR_SYSTEM_VISION.md` (v3.0)

---

## 1. Architecture Principle

One codebase. Three deployments. Three completely different behaviors.

```
Same code → deployed three times
  DEV      (localhost)   ← VITE_ENV=development  NODE_ENV=development
  QUALITY  (Render)      ← VITE_ENV=quality      NODE_ENV=quality
  PRODUCTION (Railway)   ← VITE_ENV=production   NODE_ENV=production
```

Environment behavior is controlled by:
- **Frontend:** `VITE_ENV` drives `ENV_FEATURES` config object
- **Backend:** `NODE_ENV` drives route and service behavior
- **Database:** DEV + Quality share one Supabase. Production has its own.

```
DEV (localhost)    → Quality Supabase  (ydjvbsngyyqymingforr)
QUALITY (Render)   → Quality Supabase  (ydjvbsngyyqymingforr)  ← same DB
PRODUCTION (Railway) → Production Supabase (ppnhazvhtahcckhxiomx) ← separate
```

---

## 2. CR Code System

Every CR code carries its origin environment. No conflicts possible.

```
Format:   [Type]-[Year]-[Sequence]-[Environment]
Correction: [Type]-[Year]-[Sequence]-[Environment]-C[N]

Examples:
  CR-2026-001-Q      Change Request from Quality
  CR-2026-001-P      Change Request from Production
  CR-2026-001-D      Change Request from DEV (Nerve Center only)
  ENH-2026-001-Q     Enhancement from Quality
  CR-2026-001-Q-C1   First correction of CR-2026-001-Q
  CR-2026-001-P-C2   Second correction of CR-2026-001-P
```

**Generator rule:**
- Quality backend  → appends `-Q`
- Production backend → appends `-P`
- DEV backend → appends `-D` (Nerve Center CRs only)

---

## 3. Environment Features Map

```
ENV_FEATURES = {

  development: {
    canImportCR:             true,   // MD upload → create CR
    canCreateNerveCenterCR:  true,   // DEV can raise Nerve Center CRs
    canCreateBusinessCR:     false,  // Business CRs come from Quality/Production
    canCreateTR:             true,   // TR creation is DEV's job
    canPushToDev:            true,   // git push via backend child_process
    canPromoteToQuality:     true,   // DEV → Quality
    canPromoteToProduction:  false,  // blocked — must go via Quality
    canRecordTestResults:    true,   // DEV tests on localhost
    canGenerateCorrection:   false,  // corrections come from Quality
    canUploadForCompletion:  false,  // completion check is Production's job
    canRollback:             false,  // rollback is Production's job
    isMasterArchive:         true,   // DEV holds all CRs permanently
    showFullPipeline:        true,   // see all statuses
    crSuffix:                'D',
    raisedFrom:              null,
  },

  quality: {
    canImportCR:             false,
    canCreateNerveCenterCR:  true,
    canCreateBusinessCR:     true,   // Quality raises Business Platform CRs
    canCreateTR:             false,  // TR creation is DEV only
    canPushToDev:            false,
    canPromoteToQuality:     false,
    canPromoteToProduction:  true,   // Quality → Production (authorised role)
    canRecordTestResults:    true,   // Quality tests incoming TRs
    canGenerateCorrection:   true,   // Quality generates C1, C2...
    canUploadForCompletion:  false,
    canRollback:             false,
    showIncomingTRs:         true,   // TRs arriving from DEV
    show3ColumnCorrection:   true,   // correction comparison view
    crSuffix:                'Q',
    raisedFrom:              'QUALITY',
  },

  production: {
    canImportCR:             false,
    canCreateNerveCenterCR:  true,
    canCreateBusinessCR:     true,   // Production raises Business Platform CRs
    canCreateTR:             false,
    canPushToDev:            false,
    canPromoteToQuality:     false,
    canPromoteToProduction:  false,
    canRecordTestResults:    false,
    canGenerateCorrection:   false,
    canUploadForCompletion:  true,   // upload MD → completion check
    canRollback:             true,   // GitHub API rollback
    showLiveDeployment:      true,   // latest commit on main
    showCompletionResults:   true,
    crSuffix:                'P',
    raisedFrom:              'PRODUCTION',
  },

}
```

---

## 4. Schema Changes
**File:** `backend/prisma/schema.prisma`

### ChangeRequest model — add fields

```prisma
crEnvironment        String?           // DEV, QUALITY, PRODUCTION
correctionParentId   String?           // links C1 back to parent CR
correctionNumber     Int?              // 1, 2, 3...
correctionScope      String?           // what needs fixing (correction CRs)
doNotTouch           String?           // already correct — don't change
verificationSteps    String?           // how Quality will re-test
failedScenarios      String[]          // which scenarios failed
importedFrom         CRRaisedFrom?     // QUALITY or PRODUCTION (for imports)
completionStatus     CompletionStatus? // MATCHED, MISMATCHED, PENDING
completionCheckedAt  DateTime?
completionCheckedBy  String?
```

### TransportRequest model — changes

```prisma
// REMOVE these from TRStatus enum:
IN_QUALITY_RECEIVED
IN_PRODUCTION_RECEIVED

// ADD these fields:
linkedCRId      String?   // hard link to the CR this TR was born from
devPushCommit   String?   // git commit hash captured on Push to Dev
```

### New enums

```prisma
enum CompletionStatus {
  PENDING
  MATCHED
  MISMATCHED
}
```

### New model

```prisma
model TRPermission {
  id         String   @id @default(uuid())
  roleName   String
  permission String
  createdAt  DateTime @default(now())

  @@unique([roleName, permission])
  @@map("tr_permissions")
}

// Permission values:
// TR_PUSH_DEV
// TR_PROMOTE_QUALITY
// TR_PROMOTE_PRODUCTION
// TR_CREATE_CR
// TR_APPROVE_CR
// TR_GENERATE_CORRECTION
// TR_COMPLETION_CHECK
```

---

## 5. Backend Changes

### 5.1 Changes Module
**File:** `backend/src/modules/changes/changes.service.js`

#### New: `generateCode(type, environment)`
```
Old: generateCode(type)
New: generateCode(type, environment)
  — environment = 'DEV' | 'QUALITY' | 'PRODUCTION'
  — suffix map: DEV→D, QUALITY→Q, PRODUCTION→P
  — output: CR-2026-003-Q
```

#### New: `importCR(mdContent, adminName)`
```
Purpose: Parse an uploaded MD file and create a CR in DEV DB

Steps:
  1. Parse MD content — extract fields:
       crCode, title, problem, solution,
       inScope, outOfScope, businessTypeCode,
       priority, crTarget, raisedFrom
  2. Check if crCode already exists → skip if duplicate
  3. Create CR with:
       status = APPROVED (already approved upstream)
       importedFrom = raisedFrom value from MD
       crEnvironment = parsed from crCode suffix (-Q or -P)
  4. Log: IMPORTED
  5. Return created CR
```

#### New: `generateCorrection(trId, failedScenarios, correctionScope, doNotTouch, verificationSteps, adminName)`
```
Purpose: Generate a correction CR and downloadable MD when Quality fails

Steps:
  1. Find TR → get linkedCRId → get parent CR
  2. Count existing corrections for this CR
  3. correctionNumber = count + 1
  4. Generate correction code:
       parent CR-2026-001-Q → correction CR-2026-001-Q-C1
  5. Create correction CR record:
       correctionParentId = parent CR id
       correctionNumber = 1
       failedScenarios = [...what failed]
       correctionScope = what needs fixing
       doNotTouch = what is already correct
       verificationSteps = how to re-test
       status = APPROVED
  6. Generate MD content (correction file format)
  7. Return { content, filename: 'CR-2026-001-Q-C1.md' }
```

#### New: `matchProductionUpload(mdContent, adminName)`
```
Purpose: Match uploaded MD to existing CR and run completion check

Steps:
  1. Parse MD content — extract crCode + inScope
  2. Find matching CR in DB by crCode (or correctionParentId chain)
  3. Find linked TR
  4. Compare: CR inScope items vs TR scope + all corrections
  5. Calculate: MATCHED or MISMATCHED
  6. Update CR:
       completionStatus = MATCHED | MISMATCHED
       completionCheckedAt = now()
       completionCheckedBy = adminName
       status = COMPLETED | INCOMPLETE
  7. Return result with comparison detail
```

---

**File:** `backend/src/modules/changes/changes.routes.js`

```
New routes:
  POST   /import                → importCR         (DEV only)
  POST   /:id/correction        → generateCorrection (QUALITY only)
  POST   /match-completion      → matchProductionUpload (PRODUCTION only)
```

---

### 5.2 Transport Module
**File:** `backend/src/modules/transport/transport.service.js`

#### New: `createFromCR(crId, data, adminName)`
```
Purpose: Create TR with all fields auto-populated from linked CR

Steps:
  1. Fetch CR by crId
  2. Generate TR code
  3. Create TR with:
       title           = cr.title
       description     = cr.problem
       businessTypeCode = cr.businessTypeCode
       modulesAffected = cr.modulesAffected
       priority        = cr.priority
       linkedCRId      = cr.id
       category        = data.category (developer selects)
       testPlanNotes   = data.testPlanNotes (developer adds)
  4. Log: CREATED_FROM_CR
  5. Return TR
```

#### New: `pushToDev(trId, adminName)`
```
Purpose: Execute git push from Nerve Center, capture commit hash

Steps:
  1. const { execSync } = require('child_process')
  2. const repoPath = process.env.GIT_REPO_PATH
  3. execSync('git push origin dev', { cwd: repoPath })
  4. const hash = execSync('git rev-parse HEAD', { cwd: repoPath }).toString().trim()
  5. Update TR:
       devPushCommit = hash
       status = DEVELOPMENT
  6. Log: PUSHED_TO_DEV with commit hash (first 7 chars)
  7. Return updated TR

Config needed in .env.development:
  GIT_REPO_PATH=D:/new project
```

#### Updated: `promote(id, adminName, notes)`
```
Changes:
  REMOVE: IN_QUALITY_RECEIVED and IN_PRODUCTION_RECEIVED states
  REMOVE: auto-implement logic
  REMOVE: getSettings() check
  KEEP:   test gate (informational — logs warning but does not block)

New PROMOTE_MAP:
  APPROVED    → DEVELOPMENT  (no git, status change only)
  DEVELOPMENT → TESTING      (no git, status change only)
  TESTING     → IN_QUALITY   (git: merge dev → quality, direct)
  IN_QUALITY  → IN_PRODUCTION (git: merge quality → main, direct)
```

#### Updated: `rollback(id, reason, adminName)`
```
Production rollback — no DB needed:
  1. Call GitHub API: GET /commits?sha=main&per_page=2
  2. previousSha = commits[1].sha
  3. Call GitHub API: PATCH /git/refs/heads/main
       { sha: previousSha, force: true }
  4. Update TR status → ROLLED_BACK
  5. Log: ROLLED_BACK with reason
```

---

**File:** `backend/src/modules/transport/transport.routes.js`

```
New routes:
  POST  /create-from-cr/:crId  → createFromCR
  POST  /:id/push-to-dev       → pushToDev
```

---

## 6. Frontend Changes

### 6.1 New File: `frontend/src/config/env.js`
```javascript
const VITE_ENV = import.meta.env.VITE_ENV || 'development';

export const ENV = VITE_ENV;

export const FEATURES = {
  // all feature flags from Section 3 above
  ...ENV_FEATURES[VITE_ENV]
};

export const CR_SUFFIX = FEATURES.crSuffix;
export const RAISED_FROM = FEATURES.raisedFrom;
```

Every component imports from here. No more scattered `window.location.hostname` checks.

---

### 6.2 New File: `frontend/src/pages/platform/ChangeImport.jsx`
**Used in:** DEV only

```
UI:
  — Drag-and-drop or file picker for .md files
  — "Import CR from Quality/Production" heading
  — Preview panel (shows parsed CR before confirming):
      CR Code, Title, Raised From, CR Target, In Scope preview
  — Confirm Import button
  — Cancel button

API calls:
  POST /api/platform/changes/import (multipart/form-data)

On success:
  Navigate to /platform/changes/:id (the imported CR detail)
  Toast: "CR-2026-001-Q imported successfully"
```

---

### 6.3 Updated: `frontend/src/pages/platform/ChangeList.jsx`

**DEV view:**
```
Header buttons:
  [Import CR] ← opens ChangeImport modal
  [+ New Nerve Center CR]

Table:
  All CRs ever imported + created in DEV
  Extra column: Completion Status badge (MATCHED/MISMATCHED/PENDING)
  Extra column: Corrections count (C1, C2...)
  Extra column: Origin environment badge (-Q / -P / -D)
```

**QUALITY view:**
```
Header buttons:
  [+ New Business Platform CR] ← raisedFrom: QUALITY, suffix: -Q
  [+ New Nerve Center CR] ← suffix: -Q

Table:
  Only Quality-originated CRs
  No completion status column
  No import button
```

**PRODUCTION view:**
```
Header buttons:
  [+ New Business Platform CR] ← raisedFrom: PRODUCTION, suffix: -P
  [+ New Nerve Center CR] ← suffix: -P
  [Upload for Completion] ← appears when TR is IN_PRODUCTION

Table:
  Only Production-originated CRs
  Completion status column
```

---

### 6.4 Updated: `frontend/src/pages/platform/ChangeNew.jsx`

**DEV view:**
```
  — Only NERVE_CENTER target (no toggle shown)
  — raisedFrom field hidden
  — crEnvironment = DEV → code gets -D suffix automatically
```

**QUALITY view:**
```
  — Both CR targets available (Business Platform / Nerve Center)
  — raisedFrom = QUALITY (pre-filled, locked, not editable)
  — crEnvironment = QUALITY → code gets -Q suffix
```

**PRODUCTION view:**
```
  — Both CR targets available
  — raisedFrom = PRODUCTION (pre-filled, locked, not editable)
  — crEnvironment = PRODUCTION → code gets -P suffix
```

---

### 6.5 Updated: `frontend/src/pages/platform/ChangeDetail.jsx`

**DEV view — additions:**
```
  + "Create TR from this CR" button (if no TR linked yet)
  + Linked TR chip (if TR exists) → links to TR detail
  + Corrections section: shows C1, C2... with download buttons
  + Completion Check panel:
      Status: PENDING / MATCHED ✓ / MISMATCHED ✗
      Checked by, Checked at
      What matched, what didn't
```

**QUALITY view — additions:**
```
  + Download MD button (for sending to developer)
  + Correction history (C1, C2... with what failed each time)
```

**PRODUCTION view — additions:**
```
  + Upload CR for Completion Check button
  + Completion result panel
  + Completion timestamp + who checked
```

---

### 6.6 Updated: `frontend/src/pages/platform/TransportManager.jsx`

**DEV view — complete rebuild:**
```
Single flat Kanban — no environment sections:

Columns:
  DRAFT | APPROVED | DEVELOPMENT | TESTING | IN_QUALITY | IN_PRODUCTION | ROLLED_BACK

Each TR card shows:
  — TR code + title
  — Linked CR code (e.g. CR-2026-001-Q) as chip
  — Dev push commit hash (first 7 chars) if pushed
  — Priority dot, business type, category badge

Action buttons per status:
  DRAFT         → [Approve]
  APPROVED      → [Start Development]
  DEVELOPMENT   → [Push to Dev] ← calls pushToDev API
  TESTING       → [Promote to Quality]
  IN_QUALITY    → (waiting — Quality handles)
  IN_PRODUCTION → [View Completion Check]
  ROLLED_BACK   → (terminal — no actions)

Push to Dev button behavior:
  — Confirms: "Push current dev branch to GitHub?"
  — Calls POST /api/platform/transport/:id/push-to-dev
  — Shows commit hash on success
  — Updates TR card in real time
```

**QUALITY view — complete rebuild:**
```
Shows only IN_QUALITY TRs

Each TR card shows:
  — TR code + title
  — Linked CR: what was decided (inScope summary)
  — Dev commit hash (what code arrived)
  — Test scenarios with pass/fail toggles

Action buttons:
  All scenarios recorded:
    [Push to Production] ← authorised role only
  Any scenario failed:
    [Generate Correction] ← opens correction modal

Correction modal:
  — Lists each failed scenario
  — Text field: what exactly failed
  — Text field: correction scope (what to fix)
  — Text field: do not touch (what's correct)
  — Text field: verification steps
  — [Generate C1 File] button → downloads CR-YYYY-NNN-Q-C1.md
```

**PRODUCTION view — complete rebuild:**
```
Section 1 — Live Deployment:
  Calls GitHub API: GET /commits?sha=main&per_page=1
  Shows:
    — Latest commit hash (7 chars)
    — Commit message
    — Committed at timestamp
    — "This is what's running in Production right now"

Section 2 — Completion Check:
  Upload CR document (MD file)
  System parses + matches
  Shows result: MATCHED ✓ or MISMATCHED ✗
  Detail: what matched, what didn't

Section 3 — Rollback:
  Calls GitHub API: GET /commits?sha=main&per_page=2
  Shows:
    Current:  [hash] [message] [date]
    Previous: [hash] [message] [date]
  [Rollback to Previous] button
  — Confirms: "This will revert Production. Are you sure?"
  — PATCH /git/refs/heads/main { sha: previousSha, force: true }
  — Railway auto-redeploys previous state
```

---

### 6.7 Updated: `frontend/src/pages/platform/TransportNew.jsx`
**Used in:** DEV only

```
Step 1 — Select CR:
  Dropdown of all APPROVED CRs (not yet linked to a TR)
  Shows: CR code, title, raisedFrom badge

Step 2 — Review auto-populated fields (read-only):
  Title (from CR)
  Business Type (from CR)
  Modules Affected (from CR)
  Priority (from CR)
  Problem (from CR)
  In Scope (from CR)

Step 3 — Developer adds (editable):
  Category (FEATURE / BUGFIX / ENHANCEMENT / CONFIG / HOTFIX)
  Test Plan Notes
  Git commits (optional — also captured on Push to Dev)

[Create TR] button
  Calls POST /api/platform/transport/create-from-cr/:crId
  Navigates to TR detail page
```

---

### 6.8 New File: `frontend/src/pages/platform/CorrectionView.jsx`
**Used in:** QUALITY only (inside TransportDetail)

```
3-column comparison table:

Props:
  originalScope   (from parent CR inScope)
  whatWasBuilt    (from TR description + commits)
  correctionScope (from C1 correctionScope)

Renders:
  ORIGINAL SCOPE      │  WHAT WAS BUILT     │  CORRECTION C1
  ─────────────────── │  ──────────────────  │  ──────────────────
  Item 1              │  Item 1 ✓           │  — unchanged
  Item 2              │  Item 2 ✓           │  — unchanged
  Item 3              │  Item 3 ✗ wrong     │  → FIXED (teal highlight)

Colors:
  Unchanged rows: normal (#94A3B8)
  Corrected rows: teal highlight (#1FB8D6 background)
  Failed rows:    red (#F87171)

Used when a correction (C1, C2...) exists on a TR in Quality
Quality tester focuses only on highlighted (corrected) rows
```

---

### 6.9 Updated: `frontend/src/api/platform.js`

**New functions:**
```javascript
// Changes
importCR(file)                          // POST /changes/import
generateCorrection(trId, data)          // POST /changes/:id/correction
matchProductionCompletion(file)         // POST /changes/match-completion

// Transport
createTRFromCR(crId, data)             // POST /transport/create-from-cr/:crId
pushToDev(trId)                        // POST /transport/:id/push-to-dev

// GitHub (direct from frontend for live view)
getGitHubLatestCommit(branch)          // GET via backend proxy
getGitHubLastTwoCommits(branch)        // GET via backend proxy
```

---

## 7. Build Order

```
Step 1   Schema changes
           prisma db push → DEV/Quality DB
           prisma db push → Production DB

Step 2   Backend: changes.service.js
           + generateCode (with env suffix)
           + importCR
           + generateCorrection
           + matchProductionUpload
           + update create() for crEnvironment

Step 3   Backend: transport.service.js
           + createFromCR
           + pushToDev
           ~ promote (remove RECEIVED states)
           ~ rollback (GitHub API, no DB)

Step 4   Backend: routes
           + changes.routes.js new routes
           + transport.routes.js new routes

Step 5   Frontend: config/env.js
           ENV_FEATURES object

Step 6   Frontend: DEV pages
           ChangeList (import button, archive view)
           ChangeImport (new file — MD upload)
           ChangeNew (Nerve Center only)
           ChangeDetail (create TR button, completion panel)
           TransportManager (flat kanban, Push to Dev button)
           TransportNew (create from CR)

Step 7   Frontend: Quality pages
           ChangeList (Business + Nerve Center CR creation)
           ChangeNew (both types, -Q suffix)
           TransportManager (incoming TRs, correction flow)
           CorrectionView (new file — 3-column comparison)

Step 8   Frontend: Production pages
           ChangeList (CR creation + completion upload)
           ChangeNew (both types, -P suffix)
           TransportManager (live view, rollback, completion check)

Step 9   End-to-end test on DEV
           Create CR (Nerve Center) → import → create TR
           → push to dev → promote to quality

Step 10  Test correction flow on Quality
           Simulate fail → generate C1 → import to DEV
           → fix → push → promote to quality again → pass

Step 11  Test production flow
           Promote to production → upload MD → completion check
           → test rollback via GitHub API

Step 12  Manual push to all environments
           dev → quality → main
```

---

## 8. Files Changed — Complete List

| File | Status | Environment |
|---|---|---|
| `backend/prisma/schema.prisma` | Modified | All |
| `backend/src/config/env.js` | Modified (add GIT_REPO_PATH) | DEV |
| `backend/src/modules/changes/changes.service.js` | Modified | All |
| `backend/src/modules/changes/changes.controller.js` | Modified | All |
| `backend/src/modules/changes/changes.routes.js` | Modified | All |
| `backend/src/modules/transport/transport.service.js` | Modified | All |
| `backend/src/modules/transport/transport.controller.js` | Modified | All |
| `backend/src/modules/transport/transport.routes.js` | Modified | All |
| `frontend/src/config/env.js` | **New file** | All |
| `frontend/src/api/platform.js` | Modified | All |
| `frontend/src/pages/platform/ChangeList.jsx` | Modified | All (env-aware) |
| `frontend/src/pages/platform/ChangeNew.jsx` | Modified | All (env-aware) |
| `frontend/src/pages/platform/ChangeDetail.jsx` | Modified | All (env-aware) |
| `frontend/src/pages/platform/ChangeImport.jsx` | **New file** | DEV only |
| `frontend/src/pages/platform/TransportManager.jsx` | Modified | All (env-aware) |
| `frontend/src/pages/platform/TransportNew.jsx` | Modified | DEV only |
| `frontend/src/pages/platform/TransportDetail.jsx` | Modified | All (env-aware) |
| `frontend/src/pages/platform/CorrectionView.jsx` | **New file** | Quality only |
| `backend/.env.development` | Modified (add GIT_REPO_PATH) | DEV |

---

## 9. Definition of Done — Per Environment

### DEV ✓ when:
- Import CR via MD upload creates correct CR with same code
- TR created from CR has all fields auto-populated
- Push to Dev button captures commit hash and updates TR
- Promote to Quality triggers GitHub API merge dev → quality
- Full pipeline visible in single flat Kanban
- No Business Platform CR creation button visible

### QUALITY ✓ when:
- Business Platform CR creation works with -Q suffix
- Incoming TRs visible with test scenario recording
- Correction file (C1) generates and downloads correctly
- 3-column correction view shows original vs built vs fixed
- Push to Production triggers GitHub API merge quality → main
- No TR creation or Push to Dev buttons visible

### PRODUCTION ✓ when:
- Business Platform CR creation works with -P suffix
- Live deployment view shows latest main branch commit
- MD upload runs completion check — MATCHED or MISMATCHED stored
- Rollback button reverts main branch to previous commit via GitHub API
- No TR management, no promote buttons visible

---

## 10. Data Flow Summary

```
QUALITY/PRODUCTION
  CR created (raisedFrom + env suffix)
  MD downloaded
        ↓ [MD file — only data bridge between environments]
DEV
  MD uploaded → CR imported (APPROVED, code unchanged)
  TR created from CR (auto-populated)
  Code written in VS Code
  Push to Dev button → git push + commit hash captured
  Promote to Quality → GitHub API merge dev → quality
        ↓ [GitHub API — code bridge]
QUALITY
  TR received → test scenarios recorded
  Pass → Promote to Production → GitHub API merge quality → main
  Fail → Correction file (C1) generated → MD downloaded
        ↓ [MD file — correction bridge back to DEV]
DEV (correction cycle)
  C1 MD imported → fix built → push → promote to quality again
        ↓ [GitHub API — code bridge]
PRODUCTION
  Code deployed → admin uploads CR MD
  System matches → completion check runs
  CR marked COMPLETED or INCOMPLETE
  Permanent record stored
```

---

*This document is the coding reference for the TR System v3.0 build.*
*Always read alongside `docs/TR_SYSTEM_VISION.md` (v3.0).*
*Do not begin building until a CR is created and approved for this work.*
