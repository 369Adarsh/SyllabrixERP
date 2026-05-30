/**
 * seed-sharma-assets.js
 * Seeds branch-specific fixed assets for Sharma Grocery Chain.
 * Run: node prisma/seed-sharma-assets.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.development') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const d = (daysAgo) => new Date(Date.now() - daysAgo * 86400000);

// Compute current book value using WDV or SLM
const calcCurrentValue = (purchasePrice, salvageValue, usefulLifeYears, method, purchaseDate, wdvRate = 15) => {
  const years = (Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (method === 'SLM') {
    const annualDep = (purchasePrice - salvageValue) / (usefulLifeYears || 5);
    return Math.max(salvageValue, purchasePrice - annualDep * years);
  }
  const rate = wdvRate / 100;
  let val = purchasePrice;
  const fullYears = Math.floor(years);
  for (let i = 0; i < fullYears; i++) val *= (1 - rate);
  val *= (1 - rate * (years - fullYears));
  return Math.max(salvageValue, Math.round(val * 100) / 100);
};

async function main() {
  console.log('\n🏭 Sharma Grocery — Branch Assets Seed\n');

  const tenant = await prisma.tenant.findUnique({ where: { email: 'raj@sharmachain.test' } });
  if (!tenant) { console.error('❌ Sharma Chain not found'); process.exit(1); }
  const tid = tenant.id;

  const existingCount = await prisma.asset.count({ where: { tenantId: tid } });
  if (existingCount > 0) {
    console.log(`  ⏭  Assets already seeded (${existingCount} found) — skipping`);
    process.exit(0);
  }

  const branches = await prisma.branch.findMany({ where: { tenantId: tid }, orderBy: { createdAt: 'asc' } });
  const [b1, b2, b3, b4] = branches;
  // b1 = Main Market (flagship), b2 = Station Road, b3 = Vijay Nagar, b4 = Palasia Square

  // ── Asset Categories ────────────────────────────────────────────────────────
  const upsertCat = async (name, wdvRate) => {
    const ex = await prisma.assetCategory.findFirst({ where: { tenantId: tid, name } });
    if (ex) return ex;
    return prisma.assetCategory.create({ data: { tenantId: tid, name, wdvRate } });
  };

  const [catElec, catIT, catEquip, catFurniture, catRefrig] = await Promise.all([
    upsertCat('Electrical Equipment', 15),
    upsertCat('Computer & IT', 40),
    upsertCat('Plant & Machinery', 15),
    upsertCat('Furniture & Fixtures', 10),
    upsertCat('Refrigeration Equipment', 15),
  ]);

  // ── Asset factory ────────────────────────────────────────────────────────────
  const mkAsset = (branchId, data) => {
    const base = {
      tenantId: tid,
      branchId,
      depreciationMethod: 'WDV',
      salvageValue: 0,
      usefulLifeYears: 5,
      status: 'ACTIVE',
      ...data,
      purchaseDate: data.purchaseDate || d(365),
    };
    // Map category wdvRate to compute currentValue
    const wdvRateMap = {
      [catIT.id]: 40,
      [catElec.id]: 15,
      [catEquip.id]: 15,
      [catFurniture.id]: 10,
      [catRefrig.id]: 15,
    };
    const wdvRate = wdvRateMap[base.categoryId] || 15;
    base.currentValue = calcCurrentValue(
      base.purchasePrice, base.salvageValue || 0,
      base.usefulLifeYears, base.depreciationMethod, base.purchaseDate, wdvRate
    );
    return base;
  };

  // ── Main Market Branch (b1) — flagship, most assets ─────────────────────────
  const b1Assets = [
    mkAsset(b1.id, { name: 'Samsung POS Terminal #1', assetCode: 'MM-POS-01', categoryId: catIT.id, purchasePrice: 45000, salvageValue: 5000, usefulLifeYears: 4, purchaseDate: d(730), vendor: 'Samsung India', location: 'Main Market Branch — Counter 1', serialNumber: 'SAM-POS-MM01', depreciationMethod: 'WDV' }),
    mkAsset(b1.id, { name: 'Samsung POS Terminal #2', assetCode: 'MM-POS-02', categoryId: catIT.id, purchasePrice: 45000, salvageValue: 5000, usefulLifeYears: 4, purchaseDate: d(700), vendor: 'Samsung India', location: 'Main Market Branch — Counter 2', serialNumber: 'SAM-POS-MM02' }),
    mkAsset(b1.id, { name: 'Godrej Double-Door Refrigerator', assetCode: 'MM-REF-01', categoryId: catRefrig.id, purchasePrice: 85000, salvageValue: 10000, usefulLifeYears: 8, purchaseDate: d(900), vendor: 'Godrej Appliances', location: 'Main Market Branch — Cold Section', serialNumber: 'GDJ-REF-7734' }),
    mkAsset(b1.id, { name: 'Walton Deep Freezer (500L)', assetCode: 'MM-DFZ-01', categoryId: catRefrig.id, purchasePrice: 62000, salvageValue: 8000, usefulLifeYears: 8, purchaseDate: d(820), vendor: 'Walton India', location: 'Main Market Branch — Frozen Section', serialNumber: 'WLT-DFZ-500-08' }),
    mkAsset(b1.id, { name: 'LG Split AC 1.5 Ton (Showroom)', assetCode: 'MM-AC-01', categoryId: catElec.id, purchasePrice: 48000, salvageValue: 5000, usefulLifeYears: 7, purchaseDate: d(600), vendor: 'LG Electronics', location: 'Main Market — Sales Floor', serialNumber: 'LG-DUALAC-6654' }),
    mkAsset(b1.id, { name: 'Heavy-Duty Rack System (10-shelf)', assetCode: 'MM-RACK-01', categoryId: catFurniture.id, purchasePrice: 35000, salvageValue: 3000, usefulLifeYears: 10, purchaseDate: d(1095), vendor: 'Nilkamal Ltd', location: 'Main Market Branch — Aisle 1-3' }),
    mkAsset(b1.id, { name: 'CCTV System (8 cameras + DVR)', assetCode: 'MM-CCTV-01', categoryId: catElec.id, purchasePrice: 28000, salvageValue: 2000, usefulLifeYears: 5, purchaseDate: d(540), vendor: 'CP Plus', location: 'Main Market — Full Coverage', serialNumber: 'CPP-DVR-88CH' }),
    mkAsset(b1.id, { name: 'Electronic Weighing Scale (30kg)', assetCode: 'MM-WGH-01', categoryId: catEquip.id, purchasePrice: 12500, salvageValue: 1000, usefulLifeYears: 5, purchaseDate: d(400), vendor: 'Mettler Toledo India', location: 'Main Market — Counter', serialNumber: 'MTT-WS-3045' }),
  ];

  // ── Station Road Branch (b2) ─────────────────────────────────────────────────
  const b2Assets = [
    mkAsset(b2.id, { name: 'Casio POS Terminal', assetCode: 'SR-POS-01', categoryId: catIT.id, purchasePrice: 38000, salvageValue: 4000, usefulLifeYears: 4, purchaseDate: d(550), vendor: 'Casio India', location: 'Station Road Branch — Counter', serialNumber: 'CSO-POS-SR01' }),
    mkAsset(b2.id, { name: 'Haier Double-Door Refrigerator', assetCode: 'SR-REF-01', categoryId: catRefrig.id, purchasePrice: 72000, salvageValue: 8000, usefulLifeYears: 8, purchaseDate: d(720), vendor: 'Haier Appliances', location: 'Station Road Branch — Cold Section', serialNumber: 'HAI-REF-DD-23' }),
    mkAsset(b2.id, { name: 'Voltas Split AC 1.5 Ton', assetCode: 'SR-AC-01', categoryId: catElec.id, purchasePrice: 42000, salvageValue: 4000, usefulLifeYears: 7, purchaseDate: d(480), vendor: 'Voltas Limited', location: 'Station Road Branch — Hall', serialNumber: 'VOL-AC-1.5-SR1', status: 'UNDER_MAINTENANCE' }),
    mkAsset(b2.id, { name: 'Display Rack System (8-shelf)', assetCode: 'SR-RACK-01', categoryId: catFurniture.id, purchasePrice: 28000, salvageValue: 2500, usefulLifeYears: 10, purchaseDate: d(900), vendor: 'Supreme Industries', location: 'Station Road Branch — Main Floor' }),
    mkAsset(b2.id, { name: 'CCTV System (4 cameras)', assetCode: 'SR-CCTV-01', categoryId: catElec.id, purchasePrice: 16000, salvageValue: 1500, usefulLifeYears: 5, purchaseDate: d(380), vendor: 'Hikvision India', location: 'Station Road Branch — Full Coverage', serialNumber: 'HIK-DVR-4CH-02' }),
    mkAsset(b2.id, { name: 'Electronic Weighing Scale (15kg)', assetCode: 'SR-WGH-01', categoryId: catEquip.id, purchasePrice: 9000, salvageValue: 800, usefulLifeYears: 5, purchaseDate: d(320), vendor: 'Essae Teraoka', location: 'Station Road — Checkout' }),
  ];

  // ── Vijay Nagar Branch (b3) ──────────────────────────────────────────────────
  const b3Assets = [
    mkAsset(b3.id, { name: 'TouchPOS Terminal', assetCode: 'VN-POS-01', categoryId: catIT.id, purchasePrice: 40000, salvageValue: 4000, usefulLifeYears: 4, purchaseDate: d(420), vendor: 'ePOS Systems', location: 'Vijay Nagar Branch — Counter', serialNumber: 'EPOS-VN-2023' }),
    mkAsset(b3.id, { name: 'Samsung Commercial Refrigerator', assetCode: 'VN-REF-01', categoryId: catRefrig.id, purchasePrice: 68000, salvageValue: 7000, usefulLifeYears: 8, purchaseDate: d(600), vendor: 'Samsung India', location: 'Vijay Nagar Branch — Cold Section', serialNumber: 'SAM-COMREF-VN1' }),
    mkAsset(b3.id, { name: 'Blue Star Split AC 1T', assetCode: 'VN-AC-01', categoryId: catElec.id, purchasePrice: 36000, salvageValue: 3500, usefulLifeYears: 7, purchaseDate: d(360), vendor: 'Blue Star Ltd', location: 'Vijay Nagar Branch', serialNumber: 'BST-AC-1TN-VN1' }),
    mkAsset(b3.id, { name: 'Gondola Shelving Unit (6-shelf)', assetCode: 'VN-RACK-01', categoryId: catFurniture.id, purchasePrice: 22000, salvageValue: 2000, usefulLifeYears: 10, purchaseDate: d(730), vendor: 'JSL Industries', location: 'Vijay Nagar Branch — Floor' }),
    mkAsset(b3.id, { name: 'CCTV System (4 cameras + NVR)', assetCode: 'VN-CCTV-01', categoryId: catElec.id, purchasePrice: 18500, salvageValue: 1500, usefulLifeYears: 5, purchaseDate: d(290), vendor: 'Dahua Technology', location: 'Vijay Nagar Branch', serialNumber: 'DH-NVR-4P-VN' }),
  ];

  // ── Palasia Square Branch (b4) — smallest ────────────────────────────────────
  const b4Assets = [
    mkAsset(b4.id, { name: 'Compact POS Terminal', assetCode: 'PS-POS-01', categoryId: catIT.id, purchasePrice: 32000, salvageValue: 3000, usefulLifeYears: 4, purchaseDate: d(300), vendor: 'Posiflex India', location: 'Palasia Square Branch — Counter', serialNumber: 'PFX-POS-PS01' }),
    mkAsset(b4.id, { name: 'Whirlpool Single-Door Refrigerator', assetCode: 'PS-REF-01', categoryId: catRefrig.id, purchasePrice: 38000, salvageValue: 4000, usefulLifeYears: 8, purchaseDate: d(480), vendor: 'Whirlpool India', location: 'Palasia Square Branch — Storage', serialNumber: 'WHP-SD-340L-PS' }),
    mkAsset(b4.id, { name: 'Carrier AC 1T (Window)', assetCode: 'PS-AC-01', categoryId: catElec.id, purchasePrice: 28000, salvageValue: 2500, usefulLifeYears: 7, purchaseDate: d(420), vendor: 'Carrier Midea', location: 'Palasia Square Branch — Floor', serialNumber: 'CAR-WIN-1T-PS1' }),
    mkAsset(b4.id, { name: 'Wire Mesh Shelving (4-shelf)', assetCode: 'PS-RACK-01', categoryId: catFurniture.id, purchasePrice: 14000, salvageValue: 1200, usefulLifeYears: 10, purchaseDate: d(580), vendor: 'Chrome Industries', location: 'Palasia Square Branch' }),
    mkAsset(b4.id, { name: 'CCTV System (2 cameras)', assetCode: 'PS-CCTV-01', categoryId: catElec.id, purchasePrice: 9500, salvageValue: 800, usefulLifeYears: 5, purchaseDate: d(250), vendor: 'Hikvision India', location: 'Palasia Square Branch', serialNumber: 'HIK-2CH-PS01' }),
  ];

  const allAssets = [...b1Assets, ...b2Assets, ...b3Assets, ...b4Assets];
  let created = 0;
  for (const data of allAssets) {
    await prisma.asset.create({ data });
    created++;
  }

  console.log(`  ✅ Created ${created} assets across ${branches.length} branches:`);
  console.log(`     Main Market:     ${b1Assets.length} assets`);
  console.log(`     Station Road:    ${b2Assets.length} assets`);
  console.log(`     Vijay Nagar:     ${b3Assets.length} assets`);
  console.log(`     Palasia Square:  ${b4Assets.length} assets`);
  console.log('\n✅ Assets seed complete!\n');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
