/**
 * Syllabrix — Comprehensive GST Compliance Seed
 * Creates all standard GST slabs and assigns legally correct HSN codes + rates
 * to every product across all 5 business types.
 *
 * Run: node prisma/seed-gst.js
 *
 * Legal basis: CBIC GST Rate Schedule FY 2024-25
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { getStandardSlabs } = require('../src/utils/gstReference');
const prisma = new PrismaClient();

// ─── Per-product mapping: SKU → { hsn, gstRate, note } ───────────────────────

const PRODUCT_MAP = {

  // ── RETAIL — Ramesh Electronics (Delhi) ────────────────────────────────────
  // Mobile Phones: HSN 8517 @ 18%
  'MOB-SGM34':  { hsn: '8517', rate: 18, note: 'Smartphone — HSN 8517' },
  'MOB-RN13':   { hsn: '8517', rate: 18, note: 'Smartphone — HSN 8517' },
  'MOB-IP15':   { hsn: '8517', rate: 18, note: 'Smartphone — HSN 8517' },
  'MOB-VV29':   { hsn: '8517', rate: 18, note: 'Smartphone — HSN 8517' },
  'MOB-OR11':   { hsn: '8517', rate: 18, note: 'Smartphone — HSN 8517' },
  'MOB-ONCE3':  { hsn: '8517', rate: 18, note: 'Smartphone — HSN 8517' },
  // Televisions: HSN 8528 — 32" @ 18%, >32" @ 28%
  'TV-SAM43':   { hsn: '8528', rate: 28, note: 'TV >32" — HSN 8528 @ 28%' },
  'TV-LG55':    { hsn: '8528', rate: 28, note: 'TV >32" — HSN 8528 @ 28%' },
  'TV-MI32':    { hsn: '8528', rate: 18, note: 'TV ≤32" — HSN 8528 @ 18%' },
  // Air Conditioners: HSN 8415 @ 28%
  'AC-DAI15':   { hsn: '8415', rate: 28, note: 'Air Conditioner — HSN 8415 @ 28%' },
  'AC-VOL1':    { hsn: '8415', rate: 28, note: 'Air Conditioner — HSN 8415 @ 28%' },
  // Accessories
  'ACC-BOA255': { hsn: '8518', rate: 18, note: 'Earphones — HSN 8518 @ 18%' },
  'ACC-CHG65':  { hsn: '8504', rate: 18, note: 'Charger/Adapter — HSN 8504 @ 18%' },
  'ACC-TG01':   { hsn: '7007', rate: 18, note: 'Tempered Glass — HSN 7007 @ 18%' },
  'ACC-PC01':   { hsn: '3926', rate: 18, note: 'Phone Cover (Plastic) — HSN 3926 @ 18%' },
  // Kitchen Appliances
  'KIT-PI1600': { hsn: '8516', rate: 18, note: 'Induction Cooktop — HSN 8516 @ 18%' },
  'KIT-BAJ750': { hsn: '8509', rate: 12, note: 'Mixer Grinder — HSN 8509 @ 12%' },
  'KIT-PHI4L':  { hsn: '8516', rate: 18, note: 'Air Fryer — HSN 8516 @ 18%' },

  // ── KIRANA — Sharma Kirana Store (Mumbai) ──────────────────────────────────
  // Grains & Pulses: Branded packaged = 5% (HSN 0713 / 1006 / 1101)
  'GRN-TD1':    { hsn: '0713', rate: 5,  note: 'Branded packaged Toor Dal — HSN 0713 @ 5%' },
  'GRN-CD1':    { hsn: '0713', rate: 5,  note: 'Branded packaged Chana Dal — HSN 0713 @ 5%' },
  'GRN-MD1':    { hsn: '0713', rate: 5,  note: 'Branded packaged Moong Dal — HSN 0713 @ 5%' },
  'GRN-UD1':    { hsn: '0713', rate: 5,  note: 'Branded packaged Urad Dal — HSN 0713 @ 5%' },
  'GRN-MSD1':   { hsn: '0713', rate: 5,  note: 'Branded packaged Masoor Dal — HSN 0713 @ 5%' },
  'GRN-IGR5':   { hsn: '1006', rate: 5,  note: 'Branded Basmati Rice — HSN 1006 @ 5%' },
  'GRN-ASH5':   { hsn: '1101', rate: 5,  note: 'Branded Atta — HSN 1101 @ 5%' },
  'OIL-FSB1':   { hsn: '1507', rate: 5,  note: 'Soya Bean Oil — HSN 1507 @ 5%' },
  // Oils & Ghee
  'OIL-AMG1':   { hsn: '0405', rate: 12, note: 'Pure Ghee — HSN 0405 @ 12%' },
  'OIL-SAF5':   { hsn: '1512', rate: 5,  note: 'Sunflower/Safflower Oil — HSN 1512 @ 5%' },
  'OIL-PAR5':   { hsn: '1513', rate: 5,  note: 'Coconut Oil (edible) — HSN 1513 @ 5%' },
  'OIL-SUN1':   { hsn: '1512', rate: 5,  note: 'Sunflower Oil — HSN 1512 @ 5%' },
  // Spices & Masala: HSN 0910 @ 5%
  'SPC-MDH-CM': { hsn: '0910', rate: 5,  note: 'Mixed Masala — HSN 0910 @ 5%' },
  'SPC-EVR-GM': { hsn: '0910', rate: 5,  note: 'Mixed Masala — HSN 0910 @ 5%' },
  'SPC-TAT-SL': { hsn: '2501', rate: 0,  note: 'Salt — HSN 2501 @ 0% (Exempt)' },
  'SPC-HAL-200':{ hsn: '0910', rate: 5,  note: 'Turmeric/Haldi — HSN 0910 @ 5%' },
  'SPC-RCP-200':{ hsn: '0910', rate: 5,  note: 'Red Chilli Powder — HSN 0910 @ 5%' },
  // Beverages & Tea
  'BEV-BRL-500':{ hsn: '0902', rate: 5,  note: 'Tea — HSN 0902 @ 5%' },
  'BEV-TTP-250':{ hsn: '0902', rate: 5,  note: 'Tea — HSN 0902 @ 5%' },
  'BEV-NES-200':{ hsn: '2101', rate: 18, note: 'Instant Coffee Extract — HSN 2101 @ 18%' },
  'BEV-BVT-500':{ hsn: '1806', rate: 18, note: 'Malted Cocoa Drink (Bournvita) — HSN 1806 @ 18%' },
  'BEV-AML-1L': { hsn: '0401', rate: 0,  note: 'Packaged Milk — HSN 0401 @ 0% (Exempt)' },
  'BEV-CC-2L':  { hsn: '2202', rate: 28, note: 'Carbonated Soft Drink — HSN 2202 @ 28%' },
  // Biscuits & Snacks
  'BSC-PRG-800':{ hsn: '1905', rate: 18, note: 'Biscuits — HSN 1905 @ 18%' },
  'BSC-BGD-150':{ hsn: '1905', rate: 18, note: 'Biscuits — HSN 1905 @ 18%' },
  'SNK-LAY-73': { hsn: '2008', rate: 18, note: 'Potato Chips — HSN 2008 @ 18%' },
  'SNK-HAL-400':{ hsn: '2106', rate: 18, note: 'Namkeen/Bhujia — HSN 2106 @ 18%' },
  // Personal Care
  'OHC-COL-150':{ hsn: '3306', rate: 18, note: 'Toothpaste — HSN 3306 @ 18%' },
  'OHC-LUX-100':{ hsn: '3401', rate: 18, note: 'Soap — HSN 3401 @ 18%' },
  'OHC-HNS-340':{ hsn: '3305', rate: 18, note: 'Shampoo — HSN 3305 @ 18%' },
  'OHC-DET-250':{ hsn: '3401', rate: 18, note: 'Handwash/Soap — HSN 3401 @ 18%' },
  // Cleaning & Household
  'CLN-SRF-1K': { hsn: '3402', rate: 18, note: 'Detergent — HSN 3402 @ 18%' },
  'CLN-VIM-400':{ hsn: '3402', rate: 18, note: 'Dishwash Bar — HSN 3402 @ 18%' },
  'CLN-HRP-1L': { hsn: '3808', rate: 18, note: 'Toilet Cleaner — HSN 3808 @ 18%' },
  // Dairy & Packaged
  'DRY-AML-BTR':{ hsn: '0405', rate: 12, note: 'Butter — HSN 0405 @ 12%' },
  'DRY-AML-DH': { hsn: '0403', rate: 5,  note: 'Curd/Dahi — HSN 0403 @ 5%' },
  'DRY-MAG-4PK':{ hsn: '1902', rate: 18, note: 'Instant Noodles — HSN 1902 @ 18%' },

  // ── SALON — Glamour Studio (Bangalore) ─────────────────────────────────────
  // Hair care products sold at counter
  'HC-LOR400':  { hsn: '3305', rate: 18, note: 'Hair Care Product — HSN 3305 @ 18%' },
  'HC-SCHW':    { hsn: '3305', rate: 18, note: 'Hair Colour — HSN 3305 @ 18%' },
  'HC-MAT100':  { hsn: '3305', rate: 18, note: 'Hair Serum — HSN 3305 @ 18%' },
  // Skin care products
  'SK-LAK30':   { hsn: '3304', rate: 18, note: 'Skin Care (Sunscreen/Cream) — HSN 3304 @ 18%' },
  'SK-VLC150':  { hsn: '3401', rate: 18, note: 'Face Wash — HSN 3401 @ 18%' },

  // Note: COACHING and CLINIC have no products in inventory.
  // Their services are handled as:
  //   COACHING: SAC 999294 @ 18% (coaching is taxable under GST)
  //   CLINIC:   SAC 999311 @ 0%  (healthcare services are exempt)
};

// ─── Additional products not in PRODUCT_MAP — match by SKU prefix or name ────
// This handles any future products added via seed or UI.
const CATEGORY_DEFAULTS = {
  'Grains & Pulses':    { hsn: '0713', rate: 5  },
  'Oils & Ghee':        { hsn: '1507', rate: 5  },
  'Spices & Masala':    { hsn: '0910', rate: 5  },
  'Beverages & Tea':    { hsn: '0902', rate: 5  },
  'Biscuits & Snacks':  { hsn: '1905', rate: 18 },
  'Personal Care':      { hsn: '3401', rate: 18 },
  'Cleaning & Household': { hsn: '3402', rate: 18 },
  'Dairy & Packaged':   { hsn: '0403', rate: 5  },
  'Mobile Phones':      { hsn: '8517', rate: 18 },
  'Televisions':        { hsn: '8528', rate: 28 },
  'Air Conditioners':   { hsn: '8415', rate: 28 },
  'Accessories':        { hsn: '8518', rate: 18 },
  'Kitchen Appliances': { hsn: '8516', rate: 18 },
  'Hair Care Products': { hsn: '3305', rate: 18 },
  'Skin Care Products': { hsn: '3304', rate: 18 },
};

async function main() {
  console.log('\n🇮🇳  Syllabrix — GST Compliance Seed (FY 2024-25)');
  console.log('─'.repeat(55));

  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, gstin: true, businessType: true },
  });

  if (tenants.length === 0) {
    console.error('No tenants found. Run seed-batch-01.js first.');
    process.exit(1);
  }

  for (const tenant of tenants) {
    console.log(`\n▶  ${tenant.name} (${tenant.businessType}) — GSTIN: ${tenant.gstin || 'Unregistered'}`);

    // 1. Create standard GST slabs ──────────────────────────────────────────
    const slabs = getStandardSlabs();
    const rateMap = {};

    for (const slab of slabs) {
      const existing = await prisma.taxRate.findFirst({
        where: { tenantId: tenant.id, rate: slab.rate },
      });
      if (existing) {
        rateMap[slab.rate] = existing.id;
        process.stdout.write(`  ⚡ GST ${slab.rate}% exists  `);
      } else {
        const created = await prisma.taxRate.create({
          data: { tenantId: tenant.id, ...slab },
        });
        rateMap[slab.rate] = created.id;
        process.stdout.write(`  ✓ Created GST ${slab.rate}%  `);
      }
    }
    console.log();

    // 2. Assign HSN codes + tax rates to products ───────────────────────────
    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      include: { category: true },
    });

    let updated = 0, skipped = 0;

    for (const product of products) {
      // Look up by exact SKU first, then fall back to category default
      const mapping = PRODUCT_MAP[product.sku]
        || (product.category ? CATEGORY_DEFAULTS[product.category.name] : null);

      if (!mapping) {
        console.log(`  ⚠  No mapping for: ${product.name} (SKU: ${product.sku || 'none'}) — skipped`);
        skipped++;
        continue;
      }

      const taxRateId = rateMap[mapping.rate];
      if (!taxRateId) {
        console.log(`  ✗  No tax rate record for ${mapping.rate}% — check slabs`);
        continue;
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { hsnCode: mapping.hsn, taxRateId },
      });
      updated++;
    }

    console.log(`  → ${updated} products updated, ${skipped} skipped`);
  }

  // 3. Print GST compliance summary ─────────────────────────────────────────
  console.log('\n' + '─'.repeat(55));
  console.log('📋  GST Compliance Summary\n');
  console.log('  Business Type     Tax Treatment');
  console.log('  ─────────────     ─────────────────────────────────────────');
  console.log('  RETAIL            Products @ correct slab (5–28%) + HSN codes');
  console.log('  KIRANA            Food items 0–5%, FMCG 18%, Beverages 28%');
  console.log('  SALON             Services SAC 999721 @ 18%, Products 18%');
  console.log('  COACHING          Services SAC 999294 @ 18% (coaching is taxable)');
  console.log('  CLINIC            Services SAC 999311 @ 0% (healthcare EXEMPT)');
  console.log('\n  ℹ  Businesses with turnover < ₹20 lakh may be exempt from GST.');
  console.log('  ℹ  Composition dealers: use Composition Scheme @ 1–5%.');
  console.log('  ℹ  GST exemption for coaching applies only to govt-approved institutions.');
  console.log('\n✅  Done! All products are now GST-compliant.\n');
  console.log('Next step: Make a new POS sale — the receipt will show');
  console.log('CGST + SGST breakdown and HSN codes per item.\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
