# Syllabrix — Claude Code Instructions

## ⚠️ TEMPORARY MODE — In effect until TR system v3.0 is fully built

**The mandatory CR/ENH gate is SUSPENDED.**

Build whatever the user asks directly. No CR document required. No CHANGES file required. No TR creation required.

After every build, push manually:
```
git checkout quality && git merge dev --no-edit && git push origin quality && git checkout main && git merge quality --no-edit && git push origin main && git checkout dev
```

### TEMPORARY MODE ends when:
1. TR + CR system (docs/TR_CODING_PLAN.md) is fully built
2. All 3 environments have correct env-aware Nerve Center behavior
3. CR import, TR creation from CR, Push to Dev, correction flow, completion check all work

### After TEMPORARY MODE — Full Process Resumes

```
1. CR/ENH raised from Quality or Production Nerve Center
2. Approved → MD downloaded → uploaded to this chat
3. Claude builds only what In Scope says
4. CHANGES file generated after every build
5. Manual push: dev → quality → main
```

### Rules That Always Apply (never suspended)

- Clinic module (SYL-BC-HLC-CL07) stays on dev only — never promote without explicit instruction
- Color palette: Slate + Teal (#1FB8D6 / #27DCFF) — never deviate
- Business Type IDs always SYL-BC-* format

### Full Stack Wiring Rule — Zero Gaps Tolerated

Every feature must be fully wired before it is considered done. No exceptions.

**A feature is ONLY functional when ALL of this is true:**

```
BACKEND
├── API route exists and registered in app.js
├── Controller written and connected
├── Service logic complete
└── Prisma model correct and migrated

FRONTEND
├── UI component built
├── API call wired (correct endpoint, method, auth headers)
├── Loading state handled
└── Error state handled

NERVE CENTER
└── Platform-level features visible and manageable from /platform/*

DATA CHAIN VERIFIED
└── UI action → API → Service → DB → Response → UI update
    Every single link confirmed working. No broken links.
```

**Before calling anything done:**
1. Trace the full data chain from UI click to database row and back
2. Verify Nerve Center connection for any platform-level feature
3. Test on Quality — only then mark complete
4. Never push to production with unverified wiring

### Project Context

- **Project:** Syllabrix — ERP SaaS for Indian SMBs
- **Stack:** React (Vite) + Express.js + Prisma + Supabase (PostgreSQL)
- **Nerve Center:** Platform admin at `/platform/*` routes
- **Branch mapping:** dev = Development, quality = Quality, main = Production
- **Business Type IDs:** Always SYL-BC-* format. Confirm before touching any module.
- **Color palette:** Slate + Teal (#1FB8D6 / #27DCFF). Never deviate.

### Three Environments — NEVER FORGET

| Environment | Platform | Branch |
|---|---|---|
| DEV | **Localhost** | `dev` |
| QUALITY | **Render** | `quality` |
| PRODUCTION | **Railway** | `main` |

- DEV = localhost only. No public URL.
- QUALITY = Render deployment, auto-deploys when `quality` branch changes
- PRODUCTION = Railway deployment, auto-deploys when `main` branch changes
- Nerve Center (localhost) controls all promotions via GitHub API

### Reference Files

- `docs/DEVELOPMENT_PROCESS.md` — full process detail
- `docs/TR_SYSTEM_VISION.md` — TR system source of truth
- `docs/changes/` — all CR/ENH documents
