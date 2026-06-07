# Syllabrix Transport Request (TR) System
## Vision & Build Specification — v2.0

**Document Owner:** Adarsh Singh
**Created:** 05 June 2026
**Revised:** 07 June 2026
**Status:** Approved — Ready to Build

---

## 1. The One-Paragraph Vision

The Syllabrix TR System is a complete change management platform built inside the Syllabrix Nerve Center. Every code change starts with a Change Request (CR) raised from where the business runs — Quality or Production. That CR travels to DEV where it is built, tested, and promoted through environments via a strict one-way pipeline. Every promotion is tracked, every correction is recorded, and every completed CR is verified against what was originally decided. The result is an institutional memory of every change ever made to the Syllabrix platform — traceable, auditable, and permanent.

---

## 2. The Three Environments — Each Plays a Different Role

### DEV (localhost) — The Builder
- Receives CRs via MD file upload (from Quality or Production)
- Creates Nerve Center CRs directly (developer found bug on localhost)
- Creates TR from CR — all CR information auto-populates the TR
- Developer writes code (VS Code + Claude)
- Pushes code to dev branch from Nerve Center
- Promotes TR → Quality
- Hosts the master record of ALL CRs ever created (permanent archive)

**Cannot:**
- Create Business Platform CRs (those come from Quality/Production)
- Push directly to Production (Quality is mandatory)
- Skip the Quality environment

### QUALITY (Render) — The Validator
- Creates Business Platform CRs (raisedFrom: QUALITY)
- Receives TR promoted from DEV
- Tests code against the original CR scope
- Records test results (pass / fail) against each scenario
- If testing fails → generates CR Correction file (CR-YYYY-NNN-C1)
- If testing passes → authorised role promotes TR to Production

**Cannot:**
- Accept code from DEV that bypasses the TR promote flow
- Push to Production without testing passing
- Create TRs (TR creation is DEV's responsibility)

### PRODUCTION (Railway) — The Final Destination
- Creates Business Platform CRs (raisedFrom: PRODUCTION)
- Receives code from Quality branch only — never from DEV directly
- Runs CR Completion Check (what was decided vs what was built)
- Code sits here permanently — no further promotion
- Rollback only if something breaks in production

**Cannot:**
- Accept code from DEV directly
- Push anywhere further
- Modify or patch code without going through the full CR → DEV → Quality cycle

---

## 3. The CR Lifecycle — From Problem to Verified Solution

```
STEP 1 — RAISE (Quality or Production Nerve Center)
  Business user or admin notices a bug or missing feature
  CR created: title, problem, solution, in scope, out of scope
  CR Target: BUSINESS_PLATFORM or NERVE_CENTER
  Raised From: QUALITY or PRODUCTION (required for Business Platform CRs)
  CR Status → DRAFT

STEP 2 — APPROVE (Quality or Production Nerve Center)
  Authorised role approves the CR
  CR document generated: CR-YYYY-NNN.md
  CR Status → APPROVED
  [Future] WhatsApp/email notification fires to developer

STEP 3 — IMPORT TO DEV
  Developer downloads CR-YYYY-NNN.md from Quality/Production
  Uploads MD file to DEV Nerve Center
  DEV creates same CR with same code — status already APPROVED
  CR is now in DEV master archive

STEP 4 — CREATE TR (DEV Nerve Center)
  Developer creates TR linked to CR-YYYY-NNN
  All CR fields auto-populate the TR:
    title, problem, solution, in scope, business type,
    modules affected, priority, raisedFrom, crTarget
  TR Status → DRAFT

STEP 5 — DEVELOP (localhost)
  Developer writes code in VS Code with Claude
  Developer clicks "Push to Dev" in Nerve Center
  Code pushed to dev branch — commit hash recorded in TR
  TR Status → DEVELOPMENT

STEP 6 — TEST ON DEV (DEV Nerve Center)
  Developer runs test scenarios on localhost
  Results recorded in TR
  TR Status → TESTING

STEP 7 — PROMOTE TO QUALITY (DEV Nerve Center)
  Developer clicks "Push to Quality"
  Nerve Center merges dev → quality via GitHub API
  Quality environment deploys automatically
  TR Status → IN_QUALITY

STEP 8A — QUALITY TESTING PASSES
  Authorised role tests in Quality against CR scope
  All scenarios pass
  Authorised role clicks "Push to Production"
  Nerve Center merges quality → main via GitHub API
  Production deploys automatically
  TR Status → IN_PRODUCTION

STEP 8B — QUALITY TESTING FAILS
  Testing reveals a bug or mismatch with CR scope
  Quality records what failed and why
  System generates CR Correction file: CR-YYYY-NNN-C1.md
    — Contains original CR scope
    — What failed in Quality
    — What needs to be corrected
  Developer downloads correction file → uploads to VS Code / Claude
  Developer makes ONLY the corrections needed
  Pushes to dev → promotes to Quality again
  Quality sees: original build + corrections highlighted (what changed)
  If fails again → CR-YYYY-NNN-C2, CR-YYYY-NNN-C3...

STEP 9 — CR COMPLETION CHECK (Production)
  Once TR reaches Production, system runs completion check:
    What was decided (CR In Scope)
    vs What was built (TR + commits + corrections)
    Do they match?
  Match → CR Status → COMPLETED ✓
  Mismatch → CR Status → INCOMPLETE ✗ (flagged for review)

STEP 10 — PERMANENT RECORD
  TR lives in archive permanently — cannot be deleted
  Full history: original build + every correction + final verification
  CR archive updated with completion status
```

---

## 4. CR Types and Rules

### Business Platform CR
- Raised from Quality or Production only
- `raisedFrom` field is mandatory (QUALITY or PRODUCTION)
- Covers: ERP features, business module bugs, tenant-facing issues
- Cannot be created from DEV Nerve Center

### Nerve Center CR
- Can be raised from ANY environment (DEV, Quality, Production)
- `raisedFrom` not required — developer may find the bug on localhost
- Covers: Nerve Center bugs, TR system issues, platform admin features
- DEV Nerve Center has a "New Nerve Center CR" button

---

## 5. CR Correction System

When Quality testing fails, a correction cycle begins:

| Code | Meaning |
|---|---|
| CR-2026-003 | Original CR |
| CR-2026-003-C1 | First correction after Quality failure |
| CR-2026-003-C2 | Second correction if C1 also fails |
| CR-2026-003-C3 | Third correction, and so on |

Each correction file contains:
- Original CR scope (what was decided)
- What failed in Quality (exact failure)
- What needs to be corrected (scope of fix)
- The TR highlights what changed between the original and the correction

---

## 6. Role-Based Promotion Rights

Promotion rights are assigned by Syllabrix as platform permissions — not hardcoded:

| Action | Permission Required |
|---|---|
| Push code to dev branch | TR_PUSH_DEV |
| Promote TR → Quality | TR_PROMOTE_QUALITY |
| Promote TR → Production | TR_PROMOTE_PRODUCTION |
| Create Business Platform CR | TR_CREATE_CR |
| Approve CR | TR_APPROVE_CR |

Syllabrix decides which Nerve Center roles receive which permissions.

---

## 7. The CR Archive — DEV as Master Record

The DEV database holds the permanent record of every CR ever created:

- CRs from Quality → imported via MD upload → stored in DEV
- CRs from Production → imported via MD upload → stored in DEV
- CRs from DEV (Nerve Center type) → created directly → stored in DEV

Every CR record contains:
- Original CR document (what was decided)
- Which environment raised it
- Linked TR (how it was executed)
- All corrections made (C1, C2...)
- Completion check result (decided vs built)
- Final status (COMPLETED / INCOMPLETE)

Searchable and filterable by: environment, business type, CR target, date, status, correction count.

---

## 8. Strict Pipeline Rules

```
✓ DEV → QUALITY         Developer promotes
✓ QUALITY → PRODUCTION  Authorised role promotes (after testing passes)
✗ DEV → PRODUCTION      Nobody — this is permanently blocked
✗ PRODUCTION → anywhere Code sits here — rollback only
```

---

## 9. What is NOT in Scope

- Automated CI/CD pipelines or test runners — TR records and promotes, it does not run automated tests
- Code diff viewer inside Nerve Center — git history stays in GitHub/VS Code
- Per-tenant rollback — future phase
- Public-facing changelog — internal to Nerve Center only
- Notification system (WhatsApp/email) — deferred to a future CR

---

## 10. Definition of Done

The TR system is complete when:

1. A Business Platform CR can be raised from Quality or Production, imported to DEV, built, and promoted to Production — entirely from Nerve Center
2. Quality testing failure generates a Correction file (CR-YYYY-NNN-C1) with the right content
3. Production runs a CR completion check and marks CR as COMPLETED or INCOMPLETE
4. DEV holds the complete archive of every CR ever created across all environments
5. Role-based permissions enforce who can promote where
6. No code can reach Production without passing through Quality
7. Every TR has a permanent, immutable audit record

---

*This document is the source of truth for the TR System v2.0. Any feature not listed here requires a vision update before it is built. The previous v1.0 vision has been superseded entirely.*
