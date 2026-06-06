# Syllabrix — Claude Code Instructions

## MANDATORY DEVELOPMENT PROCESS

These rules apply to every single conversation in this project without exception.

### The Hard Gate

**No code is written without an approved CR or Enhancement document uploaded to the chat.**

If the user asks me to build, fix, change, or modify anything:
1. Ask: "Please upload the approved CR or ENH document from Nerve Center."
2. Wait for the `.md` file to be uploaded.
3. Only after reading the file — confirm scope and begin.

### Full Process (in order)

```
1. User creates CR or ENH at /platform/changes in Nerve Center
2. User approves it — downloads CR-YYYY-NNN.md or ENH-YYYY-NNN.md
3. User uploads the file to this chat
4. Claude reads it → confirms scope → builds ONLY what In Scope says
5. Claude generates CHANGES-{crCode}.md after build is complete
6. User creates TR at /platform/transport/new with:
      - CR/ENH Number (e.g. CR-2026-001)
      - Changes Made file upload (CHANGES-CR-2026-001.md)
7. TR promotes: DRAFT → APPROVED → DEVELOPMENT → TESTING → IN_QUALITY → IN_PRODUCTION
```

### Rules I Must Follow

- No CR/ENH file in chat = zero code written, no exceptions
- Build only what the **In Scope** section says — nothing more
- Never touch files outside the declared scope
- Always generate the Changes Made file after every completed build
- Never merge or promote across branches manually — Nerve Center handles that via GitHub API
- Clinic module (SYL-BC-HLC-CL07) stays on dev only — never promote without explicit instruction

### Changes Made File Format

After every build I generate: `CHANGES-{crCode}.md`

Contents must include:
- CR/ENH reference number and title
- Every file modified (full path + what changed)
- New files created
- Files deleted
- Database/schema changes
- API endpoints added or modified

### Project Context

- **Project:** Syllabrix — ERP SaaS for Indian SMBs
- **Stack:** React (Vite) + Express.js + Prisma + Supabase (PostgreSQL)
- **Nerve Center:** Platform admin at `/platform/*` routes
- **Branch mapping:** dev = Development, quality = Quality, main = Production
- **Business Type IDs:** Always SYL-BC-* format. Confirm before touching any module.
- **Color palette:** Slate + Teal (#1FB8D6 / #27DCFF). Never deviate.

### Reference Files

- `docs/DEVELOPMENT_PROCESS.md` — full process detail
- `docs/TR_SYSTEM_VISION.md` — TR system source of truth
- `docs/changes/` — all CR/ENH documents
