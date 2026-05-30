/**
 * Backfills branchId on existing quotations for Sharma Chain.
 * Run: node prisma/seed-backfill-quotation-branches.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.development') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔧 Backfilling branchId on Sharma Chain quotations...\n');

  const tenant = await prisma.tenant.findUnique({ where: { email: 'raj@sharmachain.test' } });
  if (!tenant) { console.error('❌ Sharma Chain not found'); process.exit(1); }
  const tid = tenant.id;

  const branches = await prisma.branch.findMany({ where: { tenantId: tid } });
  const byName = (n) => branches.find(b => b.name.toLowerCase().includes(n.toLowerCase()));
  const bMain  = byName('Main Market');
  const bStrd  = byName('Station Road');
  const bVjnr  = byName('Vijay Nagar');
  const bPlsa  = byName('Palasia');
  console.log('  Branch map:', { Main: bMain?.id.slice(-6), Station: bStrd?.id.slice(-6), Vijay: bVjnr?.id.slice(-6), Palasia: bPlsa?.id.slice(-6) });

  // Map quotation number prefix → branchId
  const prefixMap = [
    { prefix: 'QT-SC-',   branchId: bMain?.id },
    { prefix: 'QT-STRD-', branchId: bStrd?.id },
    { prefix: 'QT-VJNR-', branchId: bVjnr?.id },
    { prefix: 'QT-PLSA-', branchId: bPlsa?.id },
  ].filter(x => x.branchId);

  let updated = 0;
  for (const { prefix, branchId } of prefixMap) {
    const result = await prisma.quotation.updateMany({
      where: { tenantId: tid, quotationNumber: { startsWith: prefix } },
      data: { branchId },
    });
    if (result.count > 0) {
      console.log(`  ✅ ${prefix}* → ${branchId.slice(-6)} (${result.count} updated)`);
      updated += result.count;
    } else {
      console.log(`  ⏭  ${prefix}* — already set or not found`);
    }
  }

  console.log(`\n✅ Backfill complete — ${updated} quotations updated.\n`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
