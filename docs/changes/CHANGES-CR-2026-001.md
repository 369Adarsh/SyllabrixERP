# Changes Made — CR-2026-001

## Reference
- **Document:** CR-2026-001
- **Title:** TR System: Environment Hierarchy, Test Gates & Production Lock
- **Business Type:** SYL-BC-ALL
- **Built by:** Claude Code
- **Date:** 2026-06-06

---

## Files Modified

### Backend

| File | What Changed |
|---|---|
| `backend/src/modules/transport/transport.service.js` | Added test gate in promote() — blocks TESTING→IN_QUALITY if DEV scenarios not all PASSED; blocks IN_QUALITY→IN_PRODUCTION if QUALITY scenarios not all PASSED; added parseTestScenarios() parser for Changes Made file; create() now auto-imports test scenarios from Changes Made file; addTestScenario() now accepts layer field; PROMOTE_MAP updated with strict one-way pipeline comment |

### Frontend

| File | What Changed |
|---|---|
| `frontend/src/pages/platform/TransportManager.jsx` | Full redesign — 3 environment blocks (DEV/QUALITY/PRODUCTION) with branch labels; environment tabs (DEV/Quality/Production/All); RECEIVED badge and Implement button on cards; LIVE badge on IN_PRODUCTION cards; no promote button on production cards; Toggle component for auto-implement settings |
| `frontend/src/pages/platform/TransportDetail.jsx` | DEV vs QUALITY test scenario layers (ScenarioLayer component); Add scenario button is layer-aware; production lock — no promote button on IN_PRODUCTION TRs |

### Schema

| File | What Changed |
|---|---|
| `backend/prisma/schema.prisma` | Added `layer String @default("DEV")` field to TransportTestScenario model |

---

## Files Created

| File | Purpose |
|---|---|
| `docs/changes/CR-2026-001.md` | CR document for this change |

---

## Database Changes

Applied via `prisma db push`:
- `transport_test_scenarios` table: added `layer` column (String, default "DEV")

---

## API Changes

No new endpoints. Test gate enforcement added to existing `POST /api/platform/transport/:id/promote`.

---

## TEST SCENARIOS (DEV)

1. Promote blocked when no DEV scenarios — create TR, move to TESTING with zero scenarios, verify Promote → Quality is blocked with error message
2. Promote blocked when DEV scenario FAILED — add scenario, mark FAILED, verify promote still blocked
3. Promote allowed when all DEV scenarios PASSED — mark all PASSED, verify promote button works
4. QUALITY scenarios locked until IN_QUALITY — verify QUALITY TEST SCENARIOS section shows "Scenarios will be added when TR reaches IN_QUALITY stage" when TR is in TESTING

## TEST SCENARIOS (QUALITY)

1. Regression — existing TR promote flow still works end to end
2. Layer separation — DEV scenarios stay in DEV section, QUALITY scenarios appear in QUALITY section after reaching IN_QUALITY
3. Production lock — verify IN_PRODUCTION TR has no promote button, only Rollback
