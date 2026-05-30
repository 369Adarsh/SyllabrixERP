/**
 * Fix branchIds on seeded assets — asset codes have branch prefix (MM/SR/VN/PS).
 * Run: node prisma/seed-fix-asset-branches.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.development') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔧 Fixing asset branchIds for Sharma Chain...\n');

  const tenant = await prisma.tenant.findUnique({ where: { email: 'raj@sharmachain.test' } });
  if (!tenant) { console.error('❌ Sharma Chain not found'); process.exit(1); }
  const tid = tenant.id;

  const branches = await prisma.branch.findMany({ where: { tenantId: tid } });
  const byName = (n) => branches.find(b => b.name.toLowerCase().includes(n.toLowerCase()));
  const bMain = byName('Main Market');
  const bStrd = byName('Station Road');
  const bVjnr = byName('Vijay Nagar');
  const bPlsa = byName('Palasia');

  console.log('  Branch map:', {
    'MM (Main Market)': bMain?.id.slice(-6),
    'SR (Station Road)': bStrd?.id.slice(-6),
    'VN (Vijay Nagar)': bVjnr?.id.slice(-6),
    'PS (Palasia)': bPlsa?.id.slice(-6),
  });

  const fixes = [
    { prefix: 'MM-', branchId: bMain?.id },
    { prefix: 'SR-', branchId: bStrd?.id },
    { prefix: 'VN-', branchId: bVjnr?.id },
    { prefix: 'PS-', branchId: bPlsa?.id },
  ].filter(x => x.branchId);

  let total = 0;
  for (const { prefix, branchId } of fixes) {
    const result = await prisma.asset.updateMany({
      where: { tenantId: tid, assetCode: { startsWith: prefix } },
      data: { branchId },
    });
    console.log(`  ✅ ${prefix}* → ${branchId.slice(-6)} (${result.count} assets)`);
    total += result.count;
  }

  console.log(`\n✅ Fixed ${total} assets.\n`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
