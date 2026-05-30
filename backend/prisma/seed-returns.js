/**
 * Seed: Sale Returns across all Sharma Grocery Chain branches
 * Run: node prisma/seed-returns.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const d = (daysAgo) => new Date(Date.now() - daysAgo * 86400000);

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { email: 'raj@sharmachain.test' } });
  if (!tenant) { console.error('Sharma Grocery Chain not found — run seed.js first'); process.exit(1); }
  const tid = tenant.id;

  const existing = await prisma.saleReturn.count({ where: { tenantId: tid } });
  if (existing > 0) {
    console.log(`  ⚡ Already has ${existing} returns — delete them first to re-seed`);
    return;
  }

  const branches = await prisma.branch.findMany({ where: { tenantId: tid } });
  const byCode = Object.fromEntries(branches.map(b => [b.code, b]));
  const b1 = byCode['MAIN'], b2 = byCode['STRD'], b3 = byCode['VJNR'], b4 = byCode['PLSA'];
  if (!b1 || !b2 || !b3 || !b4) { console.error('Missing branch — run seed.js first'); process.exit(1); }
  console.log(`  Branches: MAIN STRD VJNR PLSA`);

  const customers = await prisma.customer.findMany({ where: { tenantId: tid }, take: 20, orderBy: { createdAt: 'asc' } });
  const prods     = await prisma.product.findMany({ where: { tenantId: tid }, select: { id: true, name: true, sellingPrice: true }, orderBy: { createdAt: 'asc' } });

  const txOf = async (branchId, skip = 0) => prisma.transaction.findFirst({
    where: { tenantId: tid, branchId },
    include: { items: { take: 1 } },
    orderBy: { createdAt: 'desc' },
    skip,
  });

  const hqInv = await prisma.invoice.findFirst({
    where: { tenantId: tid, branchId: b1.id, status: 'PAID' },
    include: { items: { take: 1 } },
  });

  let seq = 0;
  const yr = new Date().getFullYear();
  const rn = () => `RET-SC-${yr}-${String(++seq).padStart(4, '0')}`;

  const [tx1, tx2, tx6, tx7, tx10, tx11, tx13] = await Promise.all([
    txOf(b1.id, 0), txOf(b1.id, 1),
    txOf(b2.id, 0), txOf(b2.id, 2),
    txOf(b3.id, 0), txOf(b3.id, 1),
    txOf(b4.id, 0),
  ]);

  const returns = [
    // ── MAIN MARKET (b1) ─────────────────────────────────────────────────────
    {
      tenantId: tid, branchId: b1.id, returnNumber: rn(), sourceType: 'TRANSACTION',
      transactionId: tx1?.id, customerId: tx1?.customerId || customers[0].id,
      reason: 'Wrong item billed — customer received Toor Dal instead of Chana Dal',
      refundMethod: 'CASH', refundAmount: 110, createdAt: d(3),
      notes: 'Staff billing error at Main Market counter',
      items: { create: [{ productId: prods[5].id, description: 'Toor Dal 1kg (wrong item)', quantity: 1, unitPrice: 110, total: 110 }] },
    },
    {
      tenantId: tid, branchId: b1.id, returnNumber: rn(), sourceType: 'TRANSACTION',
      transactionId: tx2?.id, customerId: tx2?.customerId || customers[1].id,
      reason: 'Packaging damaged — Sunflower Oil bottle leaking',
      refundMethod: 'STORE_CREDIT', refundAmount: 155, createdAt: d(7),
      notes: 'Store credit issued. Customer will use on next visit.',
      items: { create: [{ productId: prods[7].id, description: 'Sunflower Oil 1L', quantity: 1, unitPrice: 155, total: 155 }] },
    },
    hqInv ? {
      tenantId: tid, branchId: b1.id, returnNumber: rn(), sourceType: 'INVOICE',
      invoiceId: hqInv.id, customerId: hqInv.customerId,
      reason: 'Bulk rice quality below spec — moisture content high (B2B complaint)',
      refundMethod: 'UPI', refundAmount: 4700, createdAt: d(14),
      notes: 'Partial return on bulk order. Caterer rejected 20 bags.',
      items: { create: [{ description: 'Bulk Rice 100kg — partial return (20 bags)', quantity: 20, unitPrice: 235, total: 4700 }] },
    } : null,
    {
      tenantId: tid, branchId: b1.id, returnNumber: rn(), sourceType: 'WALKTHROUGH',
      customerId: customers[3].id,
      reason: 'Near-expiry product — Tropicana Juice expiring in 3 days',
      refundMethod: 'CASH', refundAmount: 110, createdAt: d(21),
      notes: 'Customer noticed at home. Accepted return on goodwill.',
      items: { create: [{ productId: prods[25].id, description: 'Tropicana Juice 1L', quantity: 1, unitPrice: 110, total: 110 }] },
    },
    {
      tenantId: tid, branchId: b1.id, returnNumber: rn(), sourceType: 'WALKTHROUGH',
      customerId: customers[5].id,
      reason: 'Customer dissatisfied — Boost Health Drink taste issue',
      refundMethod: 'STORE_CREDIT', refundAmount: 275, createdAt: d(45),
      notes: 'No receipt presented. Accepted on goodwill; store credit CN issued.',
      items: { create: [{ productId: prods[26].id, description: 'Boost Health Drink 500g', quantity: 1, unitPrice: 275, total: 275 }] },
    },

    // ── STATION ROAD (b2) ──────────────────────────────────────────────────────
    {
      tenantId: tid, branchId: b2.id, returnNumber: rn(), sourceType: 'TRANSACTION',
      transactionId: tx6?.id, customerId: tx6?.customerId || customers[6].id,
      reason: 'Defective — Head & Shoulders seal broken, product contaminated',
      refundMethod: 'CASH', refundAmount: 295, createdAt: d(5),
      notes: 'Seal was broken on purchase. Full refund given immediately.',
      items: { create: [{ productId: prods[30].id, description: 'Head & Shoulders 400ml', quantity: 1, unitPrice: 295, total: 295 }] },
    },
    {
      tenantId: tid, branchId: b2.id, returnNumber: rn(), sourceType: 'TRANSACTION',
      transactionId: tx7?.id, customerId: tx7?.customerId || customers[7].id,
      reason: 'Billing error — 2 units billed, customer only took 1',
      refundMethod: 'UPI', refundAmount: 349, createdAt: d(12),
      notes: 'Cashier Vikas corrected. UPI refund processed same day.',
      items: { create: [{ productId: prods[0].id, description: 'Basmati Rice 5kg', quantity: 1, unitPrice: 349, total: 349 }] },
    },
    {
      tenantId: tid, branchId: b2.id, returnNumber: rn(), sourceType: 'WALKTHROUGH',
      customerId: customers[8].id,
      reason: 'Damaged in transit — Ariel detergent packet torn, powder spilled',
      refundMethod: 'CASH', refundAmount: 245, createdAt: d(30),
      notes: 'Manufacturer defect. Accepted return; supplier notified.',
      items: { create: [{ productId: prods[28].id, description: 'Ariel 1kg', quantity: 1, unitPrice: 245, total: 245 }] },
    },
    {
      tenantId: tid, branchId: b2.id, returnNumber: rn(), sourceType: 'WALKTHROUGH',
      customerId: customers[10].id,
      reason: 'Wrong item — customer picked Moong Dal, wanted Toor Dal',
      refundMethod: 'STORE_CREDIT', refundAmount: 125, createdAt: d(60),
      notes: 'No receipt. Store credit ₹125 issued against next purchase.',
      items: { create: [{ productId: prods[4].id, description: 'Moong Dal 1kg', quantity: 1, unitPrice: 125, total: 125 }] },
    },

    // ── VIJAY NAGAR (b3) ──────────────────────────────────────────────────────
    {
      tenantId: tid, branchId: b3.id, returnNumber: rn(), sourceType: 'TRANSACTION',
      transactionId: tx10?.id, customerId: tx10?.customerId || customers[11].id,
      reason: 'Expired biscuits — Parle G pack expired 3 days ago',
      refundMethod: 'CASH', refundAmount: 55, createdAt: d(9),
      notes: 'Old batch found on shelf. All Parle G stock date-checked post return.',
      items: { create: [{ productId: prods[18].id, description: 'Parle G 800g', quantity: 1, unitPrice: 55, total: 55 }] },
    },
    {
      tenantId: tid, branchId: b3.id, returnNumber: rn(), sourceType: 'TRANSACTION',
      transactionId: tx11?.id, customerId: tx11?.customerId || customers[12].id,
      reason: 'Scan error — Britannia Marie billed, customer wanted Hide & Seek',
      refundMethod: 'UPI', refundAmount: 65, createdAt: d(18),
      notes: 'Barcode scan error. Refund via UPI, customer repurchased correct item.',
      items: { create: [{ productId: prods[19].id, description: 'Britannia Marie 500g', quantity: 1, unitPrice: 65, total: 65 }] },
    },
    {
      tenantId: tid, branchId: b3.id, returnNumber: rn(), sourceType: 'WALKTHROUGH',
      customerId: customers[14].id,
      reason: 'Quality issue — Amul Ghee tasted rancid (lot recall)',
      refundMethod: 'STORE_CREDIT', refundAmount: 370, createdAt: d(35),
      notes: 'Returned after 2 days. Ghee lot recalled. Store credit issued.',
      items: { create: [{ productId: prods[10].id, description: 'Amul Pure Ghee 500g', quantity: 1, unitPrice: 370, total: 370 }] },
    },

    // ── PALASIA SQUARE (b4) ───────────────────────────────────────────────────
    {
      tenantId: tid, branchId: b4.id, returnNumber: rn(), sourceType: 'TRANSACTION',
      transactionId: tx13?.id, customerId: tx13?.customerId || customers[15].id,
      reason: 'Customer changed mind — bought Fortune Oil 5L, wants 1L instead',
      refundMethod: 'CASH', refundAmount: 739, createdAt: d(6),
      notes: 'Unopened pack returned within 1 hour. Full refund.',
      items: { create: [{ productId: prods[9].id, description: 'Fortune Refined Oil 5L', quantity: 1, unitPrice: 739, total: 739 }] },
    },
    {
      tenantId: tid, branchId: b4.id, returnNumber: rn(), sourceType: 'WALKTHROUGH',
      customerId: customers[16].id,
      reason: 'Wrong variant — Surf Excel 500g returned, wanted 1kg pack',
      refundMethod: 'CASH', refundAmount: 75, createdAt: d(22),
      notes: 'Refunded 500g price. Customer repurchased 1kg. Net exchange.',
      items: { create: [{ productId: prods[27].id, description: 'Surf Excel 500g', quantity: 1, unitPrice: 75, total: 75 }] },
    },
    {
      tenantId: tid, branchId: b4.id, returnNumber: rn(), sourceType: 'WALKTHROUGH',
      customerId: customers[18].id,
      reason: 'Tampered product — Colgate tube seal broken, partially used',
      refundMethod: 'UPI', refundAmount: 98, createdAt: d(50),
      notes: 'Tampered product returned. Escalated to Manager Neha Jain.',
      items: { create: [{ productId: prods[32].id, description: 'Colgate 200g', quantity: 1, unitPrice: 98, total: 98 }] },
    },
  ].filter(Boolean);

  const branchLabel = (id) => id === b1.id ? 'MAIN' : id === b2.id ? 'STRD' : id === b3.id ? 'VJNR' : 'PLSA';

  for (const row of returns) {
    await prisma.saleReturn.create({ data: row });
    console.log(`  ✓ ${row.returnNumber}  ${branchLabel(row.branchId)}  ${row.refundMethod.padEnd(12)}  ₹${row.refundAmount}`);
  }

  const counts = { [b1.id]: 0, [b2.id]: 0, [b3.id]: 0, [b4.id]: 0 };
  for (const r of returns) counts[r.branchId]++;
  console.log(`\n  ✓ Seeded ${returns.length} returns  →  MAIN:${counts[b1.id]}  STRD:${counts[b2.id]}  VJNR:${counts[b3.id]}  PLSA:${counts[b4.id]}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
