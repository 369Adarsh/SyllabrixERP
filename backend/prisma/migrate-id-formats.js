/**
 * Migration: update Branch IDs and Staff IDs to new formats.
 *
 * Branch ID: SYL00023-MAIN  (tenant syllabrixId + dash + 4-char branch code)
 * Staff ID:  MAIN1001        (4-char branch code + 4-digit non-zero-leading sequential)
 *
 * Run ONCE: node prisma/migrate-id-formats.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // ── 1. Update branch syllabrix IDs ─────────────────────────────────────────
  const branches = await prisma.branch.findMany({
    include: { tenant: { select: { syllabrixId: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\nBRANCHES (${branches.length}):`);
  for (const b of branches) {
    const code = b.code?.toUpperCase().slice(0, 4);
    const tenantSyl = b.tenant?.syllabrixId;
    if (!code || !tenantSyl) {
      console.log(`  SKIP  ${b.name} — missing code or tenant syllabrixId`);
      continue;
    }
    const newId = `${tenantSyl}-${code}`;
    if (b.syllabrixId === newId) {
      console.log(`  OK    ${newId}  ${b.name} (already correct)`);
      continue;
    }
    // Null out first to avoid unique constraint during remapping
    await prisma.branch.update({ where: { id: b.id }, data: { syllabrixId: null } });
    await prisma.branch.update({ where: { id: b.id }, data: { syllabrixId: newId } });
    console.log(`  ${String(b.syllabrixId || '?').padEnd(14)} → ${newId}  ${b.name} (${b.tenant.name})`);
  }

  // ── 2. Update branch-assigned users to staff ID format ─────────────────────
  const branchUsers = await prisma.user.findMany({
    where: { branchId: { not: null } },
    include: { branch: { select: { code: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const codeCounters = {}; // tracks how many IDs assigned per branch code during migration

  console.log(`\nBRANCH USERS (${branchUsers.length}):`);
  for (const u of branchUsers) {
    const code = u.branch?.code?.toUpperCase().slice(0, 4);
    if (!code) { console.log(`  SKIP  ${u.email} — no branch code`); continue; }

    // Start sequence at 1001 (non-zero-leading 4-digit numbers)
    codeCounters[code] = (codeCounters[code] || 1000) + 1;
    const newId = `${code}${String(codeCounters[code])}`;

    if (u.syllabrixId === newId) {
      console.log(`  OK    ${newId}  ${u.name} (already correct)`);
      continue;
    }
    await prisma.user.update({ where: { id: u.id }, data: { syllabrixId: newId } });
    console.log(`  ${String(u.syllabrixId || '?').padEnd(12)} → ${newId}  ${u.name} (${u.role}) @ ${code}`);
  }

  console.log('\n✓ Migration complete.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
