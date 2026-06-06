# Changes Made — ENH-2026-001

## Reference
- **Document:** ENH-2026-001
- **Title:** TR Intake Gate — CR/ENH Document Flow
- **Business Type:** SYL-BC-ALL
- **Built by:** Claude Code
- **Date:** 2026-06-06

---

## Files Modified

### Backend

| File | What Changed |
|---|---|
| `backend/prisma/schema.prisma` | Added `DRAFT`, `APPROVED` to `TRStatus` enum; added `APPROVED` to `TRLogAction` enum; added `problem`, `solution`, `inScope`, `outOfScope`, `approvedBy`, `approvedAt`, `crNumber`, `changesMadeFile` fields to `TransportRequest`; changed default status from `DEVELOPMENT` to `DRAFT` |
| `backend/src/modules/transport/transport.service.js` | `create()` now defaults to `DRAFT` status and accepts new document fields; added `approve()` function (DRAFT → APPROVED); extended `PROMOTE_MAP` with `APPROVED → DEVELOPMENT`; updated `getStats()` to return `draft` and `approved` counts |
| `backend/src/modules/transport/transport.controller.js` | Added `approve` handler |
| `backend/src/modules/transport/transport.routes.js` | Added `PATCH /:id/approve` route |

### Frontend

| File | What Changed |
|---|---|
| `frontend/src/api/platform.js` | Added `approveTR()` API function |
| `frontend/src/pages/platform/TransportNew.jsx` | Added Problem Statement, Proposed Solution, In Scope, Out of Scope fields; added CR/ENH Number field; added Changes Made file upload with file reader; updated subtitle |
| `frontend/src/pages/platform/TransportDetail.jsx` | Added `DRAFT`, `APPROVED` to STATUS_META; added `APPROVED` to LOG_ICON; added `handleApprove()` and `copyWorkOrder()` functions; added Approve TR button (green), Begin Development button, Copy Work Order button; added Change Document section in Overview tab showing problem/solution/inScope/outOfScope; added approvedBy/approvedAt to Details grid; updated `NEXT_LABEL` and `canPromote` logic; updated `StatusPill` for new statuses |
| `frontend/src/pages/platform/TransportManager.jsx` | Added `DRAFT`, `APPROVED` to STATUS_META and COLUMNS; expanded stats row from 5 to 7 columns; updated promote button logic to include APPROVED status |

---

## Files Created

| File | Purpose |
|---|---|
| `docs/changes/ENH-2026-001.md` | CR/ENH document for this enhancement |

---

## Files Deleted

None

---

## Database Changes

Applied via `prisma db push` to Supabase:
- `TRStatus` enum: added values `DRAFT`, `APPROVED`
- `TRLogAction` enum: added value `APPROVED`
- `transport_requests` table: added columns `problem`, `solution`, `in_scope`, `out_of_scope`, `approved_by`, `approved_at`, `cr_number`, `changes_made_file`; changed default for `status` column from `DEVELOPMENT` to `DRAFT`

---

## API Changes

- **Added:** `PATCH /api/platform/transport/:id/approve` — approves a DRAFT TR, moves to APPROVED status, logs the action

---

## Notes

- Existing TRs in the database remain unaffected — they retain their current status
- The PROMOTE_MAP now includes APPROVED → DEVELOPMENT so the "Begin Development" button works via the existing promote endpoint
- `prisma db push` was used (not migrate dev) due to non-interactive terminal environment
