/**
 * Seed B2B marketplace data for Sharma Grocery Chain (Indore):
 *   1. Create a Wholesale supplier in Indore (Malwa Agro Suppliers — SYLB2B006)
 *   2. Create ACTIVE partnerships between Sharma Chain and two existing suppliers
 * Run: node prisma/seed-marketplace.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Seeding marketplace data...\n');

  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  // ── 1. Local Indore supplier ──────────────────────────────────────────────
  const INDORE_SUP = {
    syllabrixId: 'SYLB2B006',
    name: 'Malwa Agro Suppliers',
    businessType: 'WHOLESALE',
    city: 'Indore',
    state: 'Madhya Pradesh',
    phone: '9826000606',
    email: 'vikram@malwaagro.com',
    address: 'Navlakha Mandi, Indore - 452001',
    gstin: '23AABCM1234A1Z1',
    ownerName: 'Vikram Yadav',
    catalog: [
      { productName: 'Soybean Oil (Refined)', unit: 'litre', category: 'Edible Oils', basePrice: 125, moq: 50, maxOrderQty: 5000, hsnCode: '1507', taxRate: 5, description: 'MP origin, double refined, neutral taste' },
      { productName: 'Wheat Flour (Chakki Atta)', unit: 'kg', category: 'Grains', basePrice: 32, moq: 100, maxOrderQty: 10000, hsnCode: '1101', taxRate: 0, description: 'Stone ground, 100% whole wheat, no additives' },
      { productName: 'Masoor Dal (Whole)', unit: 'kg', category: 'Pulses', basePrice: 88, moq: 25, maxOrderQty: 2000, hsnCode: '0713', taxRate: 0 },
      { productName: 'Urad Dal (Split)', unit: 'kg', category: 'Pulses', basePrice: 105, moq: 25, maxOrderQty: 2000, hsnCode: '0713', taxRate: 0 },
      { productName: 'Red Chilli Powder', unit: 'kg', category: 'Spices', basePrice: 195, moq: 5, maxOrderQty: 500, hsnCode: '0904', taxRate: 5, description: 'Madhya Pradesh origin, FSSAI certified' },
      { productName: 'Coriander Powder', unit: 'kg', category: 'Spices', basePrice: 115, moq: 5, maxOrderQty: 500, hsnCode: '0909', taxRate: 5 },
      { productName: 'Salt (Iodised, 1kg)', unit: 'pcs', category: 'Essentials', basePrice: 18, moq: 200, maxOrderQty: 20000, hsnCode: '2501', taxRate: 0 },
    ],
  };

  let indoreSup = await prisma.tenant.findUnique({ where: { syllabrixId: INDORE_SUP.syllabrixId } });
  if (!indoreSup) {
    indoreSup = await prisma.tenant.create({
      data: {
        syllabrixId: INDORE_SUP.syllabrixId, name: INDORE_SUP.name,
        businessType: INDORE_SUP.businessType, city: INDORE_SUP.city, state: INDORE_SUP.state,
        phone: INDORE_SUP.phone, email: INDORE_SUP.email, address: INDORE_SUP.address,
        gstin: INDORE_SUP.gstin, plan: 'GROWTH', isActive: true,
        modules: ['inventory', 'invoicing', 'customers', 'pos', 'reports'],
        currency: 'INR', locale: 'en-IN', timezone: 'Asia/Kolkata',
      },
    });
    await prisma.user.create({
      data: {
        tenantId: indoreSup.id, name: INDORE_SUP.ownerName,
        email: INDORE_SUP.email, password: passwordHash,
        role: 'OWNER', isActive: true, isEmailVerified: true,
      },
    });
    for (const item of INDORE_SUP.catalog) {
      await prisma.displayCatalogItem.create({
        data: { supplierTenantId: indoreSup.id, ...item, isAvailable: true },
      });
    }
    console.log(`  ✅ Created Malwa Agro Suppliers (Indore) — ${INDORE_SUP.catalog.length} items`);
  } else {
    console.log('  ⏭  Malwa Agro Suppliers already exists — skipping create');
  }

  // ── 2. Find Sharma Chain ──────────────────────────────────────────────────
  const sharma = await prisma.tenant.findFirst({ where: { name: { contains: 'Sharma', mode: 'insensitive' } } });
  if (!sharma) { console.error('❌ Sharma Chain tenant not found — run main seed first'); process.exit(1); }
  console.log(`  🔍 Sharma Chain: ${sharma.id}`);

  // ── 3. Delhi Agro Wholesalers ─────────────────────────────────────────────
  const delhi = await prisma.tenant.findUnique({ where: { syllabrixId: 'SYLB2B001' } });
  if (!delhi) { console.log('  ⚠️  Delhi Agro not found — skip'); }

  // ── 4. Seed active partnerships ───────────────────────────────────────────
  const pairs = [
    { supplier: indoreSup, terms: 'NET_15', message: 'Established grain supplier in Indore Mandi', note: 'Sharma Chain ↔ Malwa Agro (Indore)' },
    ...(delhi ? [{ supplier: delhi, terms: 'NET_30', message: 'Long-standing partner for cereals and pulses', note: 'Sharma Chain ↔ Delhi Agro' }] : []),
  ];

  for (const { supplier, terms, message, note } of pairs) {
    const existing = await prisma.businessPartnership.findFirst({
      where: {
        OR: [
          { requesterTenantId: sharma.id, supplierTenantId: supplier.id },
          { requesterTenantId: supplier.id, supplierTenantId: sharma.id },
        ],
      },
    });
    if (existing) {
      console.log(`  ⏭  Partnership already exists: ${note}`);
      continue;
    }
    await prisma.businessPartnership.create({
      data: {
        requesterTenantId: sharma.id,
        supplierTenantId: supplier.id,
        status: 'ACTIVE',
        paymentTerms: terms,
        message,
        creditDays: terms === 'NET_15' ? 15 : 30,
        respondedAt: new Date(Date.now() - 15 * 86400000),
      },
    });
    console.log(`  ✅ Created ACTIVE partnership: ${note} (${terms})`);
  }

  // ── 5. Seed display catalog items for Malwa Agro if catalog is empty ──────
  const catalogCount = await prisma.displayCatalogItem.count({ where: { supplierTenantId: indoreSup.id } });
  if (catalogCount === 0) {
    for (const item of INDORE_SUP.catalog) {
      await prisma.displayCatalogItem.create({
        data: { supplierTenantId: indoreSup.id, ...item, isAvailable: true },
      });
    }
    console.log(`  ✅ Seeded ${INDORE_SUP.catalog.length} catalog items for Malwa Agro`);
  }

  console.log('\n✅ Marketplace seed complete!\n');
  console.log('   Sharma Chain now has:');
  console.log('   • 1 nearby supplier in Indore (Malwa Agro Suppliers)');
  console.log('   • Active partnership with Malwa Agro (NET 15)');
  if (delhi) console.log('   • Active partnership with Delhi Agro Wholesalers (NET 30)');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
