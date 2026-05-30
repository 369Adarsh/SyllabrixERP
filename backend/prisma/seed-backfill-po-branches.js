/**
 * Backfill: Assign existing Sharma Chain POs/GRNs/Bills to HQ branch (Main Market).
 * Pre-branch-feature POs were created without a branchId — HQ is the default owner.
 * Run: node prisma/seed-backfill-po-branches.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { email: 'raj@sharmachain.test' } });
  if (!tenant) { console.log('  ✗ Sharma Chain not found'); process.exit(1); }

  const hq = await prisma.branch.findFirst({ where: { tenantId: tenant.id, isHQ: true } });
  if (!hq) { console.log('  ✗ HQ branch not found'); process.exit(1); }

  console.log(`  HQ branch: ${hq.name} (${hq.id})`);

  const [poResult, grnResult, billResult] = await Promise.all([
    prisma.purchaseOrder.updateMany({
      where: { tenantId: tenant.id, branchId: null },
      data: { branchId: hq.id },
    }),
    prisma.goodsReceiptNote.updateMany({
      where: { tenantId: tenant.id, branchId: null },
      data: { branchId: hq.id },
    }),
    prisma.vendorBill.updateMany({
      where: { tenantId: tenant.id, branchId: null },
      data: { branchId: hq.id },
    }),
  ]);

  console.log(`  ✓ POs backfilled:   ${poResult.count}`);
  console.log(`  ✓ GRNs backfilled:  ${grnResult.count}`);
  console.log(`  ✓ Bills backfilled: ${billResult.count}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
