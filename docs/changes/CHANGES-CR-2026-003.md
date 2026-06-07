# Changes Made — CR-2026-003

## Reference
- **Document:** CR-2026-003 (filed as CR-2026-001 in Quality Nerve Center — code collision with prior build)
- **Title:** CR/ENH form — Raised From environment + CR Scope fields
- **Business Type:** SYL-BC-ALL
- **Built by:** Claude Code
- **Date:** 2026-06-07

---

## Files Modified

| File | What Changed |
|---|---|
| `backend/prisma/schema.prisma` | Added `CRTarget` enum (BUSINESS_PLATFORM, NERVE_CENTER), `CRRaisedFrom` enum (QUALITY, PRODUCTION); added `crTarget` and `raisedFrom` fields to `ChangeRequest` model |
| `backend/src/modules/changes/changes.service.js` | `create()` accepts `crTarget` and `raisedFrom`; `generateDocument()` includes CR Target and Raised From rows in the MD table |
| `frontend/src/pages/platform/ChangeNew.jsx` | Added `crTarget` toggle (Business Platform / Nerve Center); added `raisedFrom` toggle (Quality / Production), required when crTarget = BUSINESS_PLATFORM; validation blocks submit if Business Platform CR has no raisedFrom |
| `frontend/src/pages/platform/ChangeList.jsx` | Added Target column with crTarget + raisedFrom badges on every row |
| `frontend/src/pages/platform/ChangeDetail.jsx` | Added CR Target and Raised From chips to meta row; added CR Target and Raised From rows to Details section |

---

## Database Changes

Applied via `prisma db push` to both **dev** and **production** databases:
- New enum: `CRTarget` — values: BUSINESS_PLATFORM, NERVE_CENTER
- New enum: `CRRaisedFrom` — values: QUALITY, PRODUCTION
- `change_requests` table: added `crTarget` column (default: BUSINESS_PLATFORM), added `raisedFrom` column (nullable)

---

## API Changes

No new endpoints. Existing `POST /api/platform/changes` now accepts `crTarget` and `raisedFrom` in the request body.
