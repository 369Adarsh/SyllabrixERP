# Changes Made — ENH-2026-002

## Reference
- **Document:** ENH-2026-002
- **Title:** CR / Enhancement Tab — Dedicated Change Management Section
- **Business Type:** SYL-BC-ALL
- **Built by:** Claude Code
- **Date:** 2026-06-06

---

## Files Modified

### Backend

| File | What Changed |
|---|---|
| `backend/prisma/schema.prisma` | Added `CRType` enum (CR, ENHANCEMENT); added `CRStatus` enum (DRAFT, APPROVED, IN_DEVELOPMENT, COMPLETED, REJECTED); added `CRLogAction` enum; added `ChangeRequest` model; added `CRLog` model |
| `backend/src/app.js` | Added `require` for changes routes; mounted `changesRoutes` at `/api/platform/changes` |

### Frontend

| File | What Changed |
|---|---|
| `frontend/src/api/platform.js` | Added `getCRStats`, `listCRs`, `getCR`, `createCR`, `approveCR`, `rejectCR`, `downloadCRDocument` API functions |
| `frontend/src/pages/platform/PlatformLayout.jsx` | Added `Change Control` sidebar section with `Change Requests` nav item linking to `/platform/changes` |
| `frontend/src/App.jsx` | Added imports for `ChangeList`, `ChangeNew`, `ChangeDetail`; added routes `/platform/changes`, `/platform/changes/new`, `/platform/changes/:id` |
| `frontend/src/pages/platform/TransportNew.jsx` | Added TR Linkage section with CR/ENH Number field and Changes Made file upload (file reader, line count confirmation, validation) |

---

## Files Created

### Backend

| File | Purpose |
|---|---|
| `backend/src/modules/changes/changes.service.js` | CR code generator (CR-YYYY-NNN / ENH-YYYY-NNN), getStats, list, get, create, approve, reject, generateDocument (serves .md file as download) |
| `backend/src/modules/changes/changes.controller.js` | Route handlers for all changes endpoints |
| `backend/src/modules/changes/changes.routes.js` | Routes mounted at `/api/platform/changes` with SA auth middleware |

### Frontend

| File | Purpose |
|---|---|
| `frontend/src/pages/platform/ChangeList.jsx` | CR/ENH list page — stats strip (7 counters), type/status filters, search, table with clickable rows |
| `frontend/src/pages/platform/ChangeNew.jsx` | CR/ENH creation form — type toggle (CR/ENH), full document fields, validation, BT code, priority |
| `frontend/src/pages/platform/ChangeDetail.jsx` | CR/ENH detail — Document tab (problem/solution/scope), Audit Log tab, Approve button, Reject button with modal, Download Document button |

### Docs

| File | Purpose |
|---|---|
| `docs/changes/ENH-2026-002.md` | CR/ENH document for this enhancement |
| `docs/DEVELOPMENT_PROCESS.md` | Official development process document |
| `CLAUDE.md` | Project-level Claude Code instructions enforcing the development gate |
| `C:\Users\krish\.claude\CLAUDE.md` | Global Claude Code instructions |

---

## Files Deleted

None

---

## Database Changes

Applied via `prisma db push` to Supabase:
- New table: `change_requests` (ChangeRequest model)
- New table: `cr_logs` (CRLog model)
- New enum: `CRType` with values CR, ENHANCEMENT
- New enum: `CRStatus` with values DRAFT, APPROVED, IN_DEVELOPMENT, COMPLETED, REJECTED
- New enum: `CRLogAction` with values CREATED, APPROVED, REJECTED, LINKED_TO_TR, STATUS_CHANGED

---

## API Changes

- **Added:** `GET /api/platform/changes/stats`
- **Added:** `GET /api/platform/changes`
- **Added:** `GET /api/platform/changes/:id`
- **Added:** `GET /api/platform/changes/:id/document` — generates and downloads `.md` file
- **Added:** `POST /api/platform/changes`
- **Added:** `PATCH /api/platform/changes/:id/approve`
- **Added:** `PATCH /api/platform/changes/:id/reject`

---

## Notes

- CR and ENH codes use separate sequences (CR-2026-NNN vs ENH-2026-NNN)
- Document download is served as `text/markdown` with `Content-Disposition: attachment`
- The Changes Made file upload in TransportNew uses the browser FileReader API — content stored as plain text in DB
