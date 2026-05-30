/**
 * One-time migration: reassign all Syllabrix IDs to the new sequential format.
 * Format: SYL + 5-digit zero-padded global sequence (SYL00001, SYL00002, …)
 * Order: tenants by createdAt ASC first, then branches by createdAt ASC.
 * Run ONCE: node prisma/migrate-syllabrix-ids.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const pad = (n) => `SYL${String(n).padStart(5, '0')}`;

async function main() {
  // ── 1. Fetch all tenants and branches ordered by creation time ──────────────
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, syllabrixId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const branches = await prisma.branch.findMany({
    select: { id: true, name: true, code: true, syllabrixId: true, createdAt: true, tenant: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\nFound ${tenants.length} tenants and ${branches.length} branches to reassign.\n`);

  let counter = 1;
  const ops = [];

  // ── 2. Assign tenants first ────────────────────────────────────────────────
  console.log('TENANTS:');
  for (const t of tenants) {
    const newId = pad(counter++);
    console.log(`  ${String(t.syllabrixId || '(none)').padEnd(16)} → ${newId}  ${t.name}`);
    ops.push(prisma.tenant.update({ where: { id: t.id }, data: { syllabrixId: newId } }));
  }

  // ── 3. Assign branches next ────────────────────────────────────────────────
  console.log('\nBRANCHES:');
  for (const b of branches) {
    const newId = pad(counter++);
    console.log(`  ${String(b.syllabrixId || '(none)').padEnd(24)} → ${newId}  ${b.name} (${b.code}) — ${b.tenant.name}`);
    ops.push(prisma.branch.update({ where: { id: b.id }, data: { syllabrixId: newId } }));
  }

  // ── 4. Apply all updates ───────────────────────────────────────────────────
  // Run sequentially (not $transaction) to avoid unique constraint conflicts during remapping
  console.log(`\nApplying ${ops.length} updates…`);

  // First null-out all existing IDs to clear unique constraints, then assign new ones
  await prisma.tenant.updateMany({ data: { syllabrixId: null } });
  await prisma.branch.updateMany({ data: { syllabrixId: null } });

  for (const op of ops) {
    await op;
  }

  console.log(`\n✓ Done — ${counter - 1} IDs assigned (SYL00001 → ${pad(counter - 1)})`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
