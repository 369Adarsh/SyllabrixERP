# Syllabrix Development Process
## Official Standard — All Development Must Follow This

**Owner:** Adarsh Singh  
**Created:** 2026-06-06  
**Status:** Active — Mandatory for all changes  

---

## The One Rule

> **No code is written without an approved CR or Enhancement document. No exceptions.**

---

## Step-by-Step Process

### STEP 1 — Raise the Change (Nerve Center)

Go to `/platform/changes` → Click **New CR** or **New Enhancement**

| Use a CR for | Use an Enhancement for |
|---|---|
| Bug fixes | New features |
| Config changes | New pages |
| Hotfixes | New modules |
| Rollbacks | UI improvements |

Fill in the full document:
- Title
- Business Type Code (SYL-BC-*)
- Problem Statement
- Proposed Solution
- In Scope (exact list)
- Out of Scope (exact list)
- Priority

**Result:** CR/ENH created with status `DRAFT`  
**Code format:** `CR-2026-001` or `ENH-2026-001`

---

### STEP 2 — Approve the Change (Nerve Center)

Open the CR/ENH → Review the document → Click **Approve**

- Status moves to `APPROVED`
- **Download Document** button becomes active
- Download the generated `.md` file (e.g. `CR-2026-001.md`)

> If the document is incomplete or incorrect — click **Reject** and raise a new one.

---

### STEP 3 — Hand to Claude (This Chat)

Upload the downloaded `.md` file into the Claude Code chat.

Claude will:
1. Read the document
2. Confirm understanding of scope
3. State exactly what will be built
4. Ask for confirmation before touching any code

**If no file is uploaded → Claude will not write any code.**

---

### STEP 4 — Development (Claude Code)

Claude builds exactly what the **In Scope** section says.

Rules during development:
- Only files related to the In Scope items are touched
- No extra features, no refactoring outside scope
- No changes to other business type modules
- Every change is intentional and traceable

---

### STEP 5 — Changes Made File (Claude Code Generates)

After development is complete, Claude automatically generates:

**Filename:** `CHANGES-CR-2026-001.md` (or `CHANGES-ENH-2026-001.md`)

**Contents:**
```
# Changes Made — CR-2026-001

## CR/ENH Reference
Document: CR-2026-001
Title: ...

## Files Modified
- backend/src/modules/xyz/xyz.service.js — [what changed]
- frontend/src/pages/platform/XYZ.jsx — [what changed]

## Files Created
- backend/src/modules/xyz/xyz.routes.js

## Files Deleted
- (none)

## Database Changes
- Added table: xyz
- Added column: abc to table xyz

## API Changes
- Added: POST /api/platform/xyz
- Modified: GET /api/platform/xyz/:id

## Notes
- ...
```

---

### STEP 6 — Create the TR (Nerve Center)

Go to `/platform/transport/new`

TR creation requires **BOTH**:

| Required | What it is |
|---|---|
| CR/ENH Number | e.g. `CR-2026-001` — links to the approved document |
| Changes Made File | Upload `CHANGES-CR-2026-001.md` — the execution manifest |

Without both → TR cannot be created.

**TR Status starts at:** `DRAFT`

---

### STEP 7 — Promote (Nerve Center)

TR travels through the pipeline:

```
DRAFT → APPROVED → DEVELOPMENT → TESTING → IN_QUALITY → IN_PRODUCTION
```

| Stage | Action |
|---|---|
| DRAFT | TR created, awaiting approval |
| APPROVED | Ready to begin development (code already written at this point) |
| DEVELOPMENT | Code is on dev branch, being verified |
| TESTING | Test scenarios being run |
| IN_QUALITY | Promoted to quality branch via GitHub API |
| IN_PRODUCTION | Promoted to main branch via GitHub API |

---

## Summary Diagram

```
Nerve Center          Claude Code           Nerve Center
─────────────         ───────────           ────────────
Create CR/ENH    →    Read document    →    Create TR
Approve it       →    Build code       →    Attach Changes file
Download .md     →    Generate         →    Promote to Quality
                      Changes Made     →    Promote to Production
                      file
```

---

## What Claude Will Refuse

- Build anything without a CR/ENH document uploaded
- Build anything outside the In Scope list
- Skip generating the Changes Made file
- Write code for multiple CRs in one session without separate documents

---

## File Naming Reference

| File | Format | Example |
|---|---|---|
| CR Document | `CR-YYYY-NNN.md` | `CR-2026-001.md` |
| ENH Document | `ENH-YYYY-NNN.md` | `ENH-2026-001.md` |
| Changes Made | `CHANGES-{code}.md` | `CHANGES-ENH-2026-002.md` |

---

*This document is the official Syllabrix development standard. Any deviation requires explicit written approval from Adarsh Singh.*
