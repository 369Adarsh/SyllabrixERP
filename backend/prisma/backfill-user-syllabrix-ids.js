/**
 * One-time backfill: assign sequential Syllabrix IDs to all existing users.
 * Picks up the global counter where tenants + branches left off.
 * Run ONCE: node prisma/backfill-user-syllabrix-ids.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const RE = /^SYL(\d{5})$/;
const pad = (n) => `SYL${String(n).padStart(5, '0')}`;

async function currentMax() {
  const [tenants, branches, users] = await Promise.all([
    prisma.tenant.findMany({ where: { syllabrixId: { not: null } }, select: { syllabrixId: true } }),
    prisma.branch.findMany({ where: { syllabrixId: { not: null } }, select: { syllabrixId: true } }),
    prisma.user.findMany({ where: { syllabrixId: { not: null } }, select: { syllabrixId: true } }),
  ]);
  let max = 0;
  for (const { syllabrixId } of [...tenants, ...branches, ...users]) {
    const m = RE.exec(syllabrixId);
    if (m) { const n = parseInt(m[1], 10); if (n > max) max = n; }
  }
  return max;
}

async function main() {
  const users = await prisma.user.findMany({
    where: { syllabrixId: null },
    select: { id: true, name: true, email: true, role: true, tenant: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  if (users.length === 0) {
    console.log('All users already have Syllabrix IDs. Nothing to do.');
    return;
  }

  let counter = (await currentMax()) + 1;
  console.log(`\nAssigning IDs to ${users.length} users, starting at ${pad(counter)}:\n`);

  for (const u of users) {
    const newId = pad(counter++);
    console.log(`  ${newId}  ${u.role.padEnd(10)}  ${u.email}  (${u.tenant?.name || '?'})`);
    await prisma.user.update({ where: { id: u.id }, data: { syllabrixId: newId } });
  }

  console.log(`\n✓ Done — ${users.length} users assigned (up to ${pad(counter - 1)})`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
