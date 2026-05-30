/**
 * Seed: Assign Syllabrix Branch IDs to Sharma Grocery Chain branches.
 * Format: SYLBR-{PARENT_CODE}-{BRANCH_CODE}
 * Parent code is derived from the tenant name (SHARMA).
 * Run: node prisma/seed-branch-syllabrix-ids.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SHARMA_EMAIL = 'raj@sharmachain.test';

// Assign Syllabrix ID to the parent tenant too if missing
const SHARMA_SYLLABRIX_ID = 'SYLRET001';

const BRANCH_IDS = {
  MAIN: 'SYLBR-SHARMA-MAIN',
  STRD: 'SYLBR-SHARMA-STRD',
  VJNR: 'SYLBR-SHARMA-VJNR',
  PLSA: 'SYLBR-SHARMA-PLSA',
};

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { email: SHARMA_EMAIL } });
  if (!tenant) { console.log('  ✗ Sharma Chain not found'); process.exit(1); }

  // Assign tenant syllabrixId if not already set
  if (!tenant.syllabrixId) {
    await prisma.tenant.update({ where: { id: tenant.id }, data: { syllabrixId: SHARMA_SYLLABRIX_ID } });
    console.log(`  ✓ Assigned tenant syllabrixId: ${SHARMA_SYLLABRIX_ID}`);
  } else {
    console.log(`  ⚡ Tenant syllabrixId already set: ${tenant.syllabrixId}`);
  }

  const branches = await prisma.branch.findMany({ where: { tenantId: tenant.id } });

  let updated = 0;
  for (const branch of branches) {
    const newId = BRANCH_IDS[branch.code];
    if (!newId) { console.log(`  ⚠️  No mapping for branch code: ${branch.code} — skip`); continue; }
    if (branch.syllabrixId === newId) { console.log(`  ⚡ ${branch.name} already has: ${newId}`); continue; }
    await prisma.branch.update({ where: { id: branch.id }, data: { syllabrixId: newId } });
    console.log(`  ✓ ${branch.name} (${branch.code}) → ${newId}`);
    updated++;
  }

  console.log(`\n  Done — ${updated} branch(es) updated.`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
