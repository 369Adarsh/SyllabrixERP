/**
 * Seed 5 complete B2B supplier businesses for marketplace testing.
 * Run AFTER: npx prisma generate
 * Usage: node prisma/seed-b2b.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Demo@1234';
const DEFAULT_MODULES = ['inventory', 'invoicing', 'customers', 'pos', 'reports'];

const SUPPLIERS = [
  {
    syllabrixId: 'SYLB2B001',
    name: 'Delhi Agro Wholesalers',
    businessType: 'WHOLESALE',
    city: 'Delhi',
    state: 'Delhi',
    phone: '9811000101',
    email: 'rajesh@delhiagro.biz',
    address: 'Warehouse 14, Azadpur Mandi, Delhi - 110033',
    gstin: '07AAGCD1234A1Z5',
    ownerName: 'Rajesh Agarwal',
    ownerEmail: 'rajesh@delhiagro.biz',
    catalog: [
      { productName: 'Basmati Rice (Grade A)', category: 'Grains', unit: 'kg', basePrice: 85, moq: 50, maxOrderQty: 5000, hsnCode: '1006', taxRate: 0, description: 'Premium long-grain basmati, aged 2 years' },
      { productName: 'Yellow Moong Dal', category: 'Pulses', unit: 'kg', basePrice: 110, moq: 25, maxOrderQty: 2000, hsnCode: '0713', taxRate: 0, description: 'Washed & polished, uniform size' },
      { productName: 'Chana Dal (Split)', category: 'Pulses', unit: 'kg', basePrice: 78, moq: 25, maxOrderQty: 2000, hsnCode: '0713', taxRate: 0 },
      { productName: 'Mustard Oil (Refined)', category: 'Edible Oils', unit: 'litre', basePrice: 140, moq: 20, maxOrderQty: 500, hsnCode: '1514', taxRate: 5, description: 'Cold-pressed, double filtered' },
      { productName: 'Turmeric Powder', category: 'Spices', unit: 'kg', basePrice: 180, moq: 10, maxOrderQty: 500, hsnCode: '0910', taxRate: 5 },
      { productName: 'Coriander Seeds (Whole)', category: 'Spices', unit: 'kg', basePrice: 95, moq: 10, maxOrderQty: 500, hsnCode: '0909', taxRate: 5 },
      { productName: 'Sugar (M30 Grade)', category: 'Grains', unit: 'kg', basePrice: 42, moq: 100, maxOrderQty: 10000, hsnCode: '1701', taxRate: 5 },
    ],
  },
  {
    syllabrixId: 'SYLB2B002',
    name: 'PharmaFirst Distributors',
    businessType: 'DEALER',
    city: 'Mumbai',
    state: 'Maharashtra',
    phone: '9820000202',
    email: 'priya@pharmafirst.in',
    address: '3rd Floor, Pharma Complex, Andheri East, Mumbai - 400069',
    gstin: '27AAHCP5678B1Z1',
    ownerName: 'Priya Mehta',
    ownerEmail: 'priya@pharmafirst.in',
    catalog: [
      { productName: 'Paracetamol 500mg (Strip/10)', category: 'OTC Medicines', unit: 'strip', basePrice: 14.50, moq: 100, maxOrderQty: 10000, hsnCode: '3004', taxRate: 12, description: 'Generic, WHO-GMP certified manufacturer' },
      { productName: 'Vitamin C 500mg Effervescent (10s)', category: 'Supplements', unit: 'tube', basePrice: 65, moq: 50, maxOrderQty: 5000, hsnCode: '2936', taxRate: 12 },
      { productName: 'Cetirizine 10mg (Strip/10)', category: 'OTC Medicines', unit: 'strip', basePrice: 18, moq: 100, maxOrderQty: 10000, hsnCode: '3004', taxRate: 12 },
      { productName: 'Antiseptic Liquid 500ml', category: 'Surgical & Hygiene', unit: 'bottle', basePrice: 85, moq: 24, maxOrderQty: 2400, hsnCode: '3808', taxRate: 18 },
      { productName: 'Surgical Gloves (Box/100)', category: 'Surgical & Hygiene', unit: 'box', basePrice: 320, moq: 10, maxOrderQty: 1000, hsnCode: '4015', taxRate: 12 },
      { productName: 'Gauze Bandage 10cm×4m', category: 'Wound Care', unit: 'roll', basePrice: 22, moq: 50, maxOrderQty: 5000, hsnCode: '3005', taxRate: 12 },
    ],
  },
  {
    syllabrixId: 'SYLB2B003',
    name: 'TechParts Suppliers',
    businessType: 'SUPPLIER',
    city: 'Bengaluru',
    state: 'Karnataka',
    phone: '9900000303',
    email: 'sunil@techparts.co.in',
    address: 'Plot 22, Electronics City Phase 2, Bengaluru - 560100',
    gstin: '29AAFCT8901C1Z7',
    ownerName: 'Sunil Krishnamurthy',
    ownerEmail: 'sunil@techparts.co.in',
    catalog: [
      { productName: 'USB Type-C Cable 1m (Bulk)', category: 'Cables & Connectors', unit: 'pcs', basePrice: 45, moq: 50, maxOrderQty: 5000, hsnCode: '8544', taxRate: 18, description: '3A fast charge, braided nylon, bulk pack' },
      { productName: 'Mobile Back Cover (Universal 6.5")', category: 'Accessories', unit: 'pcs', basePrice: 28, moq: 100, maxOrderQty: 10000, hsnCode: '3926', taxRate: 18 },
      { productName: 'Tempered Glass 6.5" (Pack/50)', category: 'Screen Protection', unit: 'pack', basePrice: 380, moq: 10, maxOrderQty: 500, hsnCode: '7007', taxRate: 18, description: '9H hardness, full coverage' },
      { productName: 'Earphones with Mic (Wired)', category: 'Audio', unit: 'pcs', basePrice: 120, moq: 50, maxOrderQty: 2000, hsnCode: '8518', taxRate: 18 },
      { productName: 'Power Bank 10000mAh', category: 'Charging', unit: 'pcs', basePrice: 680, moq: 20, maxOrderQty: 500, hsnCode: '8507', taxRate: 28, description: 'Dual USB output, micro+type-c input' },
      { productName: '18W Fast Charger Adapter', category: 'Charging', unit: 'pcs', basePrice: 175, moq: 50, maxOrderQty: 2000, hsnCode: '8504', taxRate: 18 },
      { productName: 'CCTV Camera 2MP Dome', category: 'Security', unit: 'pcs', basePrice: 1200, moq: 5, maxOrderQty: 200, hsnCode: '8525', taxRate: 18, description: 'Night vision, indoor, plug & play' },
    ],
  },
  {
    syllabrixId: 'SYLB2B004',
    name: 'Surat Fabrics & Textiles',
    businessType: 'SUPPLIER',
    city: 'Surat',
    state: 'Gujarat',
    phone: '9724000404',
    email: 'hitesh@suratfabrics.com',
    address: 'Ring Road, Sahara Darwaja, Surat - 395003',
    gstin: '24AASCS2345D1Z3',
    ownerName: 'Hitesh Patel',
    ownerEmail: 'hitesh@suratfabrics.com',
    catalog: [
      { productName: 'Plain Cotton Fabric (per metre)', category: 'Cotton', unit: 'metre', basePrice: 55, moq: 100, maxOrderQty: 10000, hsnCode: '5208', taxRate: 5, description: '40s count, 60" width, 120 GSM' },
      { productName: 'Georgette Saree Fabric (per metre)', category: 'Saree Fabric', unit: 'metre', basePrice: 145, moq: 50, maxOrderQty: 5000, hsnCode: '5404', taxRate: 12 },
      { productName: 'Polyester Lining Fabric (per metre)', category: 'Lining', unit: 'metre', basePrice: 38, moq: 200, maxOrderQty: 20000, hsnCode: '5407', taxRate: 12 },
      { productName: 'Embroidered Dupatta (per piece)', category: 'Dupattas', unit: 'pcs', basePrice: 280, moq: 12, maxOrderQty: 1000, hsnCode: '6214', taxRate: 12 },
      { productName: 'Denim Fabric 14oz (per metre)', category: 'Denim', unit: 'metre', basePrice: 220, moq: 50, maxOrderQty: 2000, hsnCode: '5209', taxRate: 12 },
      { productName: 'Readymade Kurta (assorted)', category: 'Readymade', unit: 'pcs', basePrice: 185, moq: 24, maxOrderQty: 2400, hsnCode: '6211', taxRate: 12, description: 'XS-3XL mixed sizes, washable print' },
    ],
  },
  {
    syllabrixId: 'SYLB2B005',
    name: 'OfficeHub Dealers',
    businessType: 'DEALER',
    city: 'Pune',
    state: 'Maharashtra',
    phone: '9876000505',
    email: 'aarti@officehub.co.in',
    address: '12, Hadapsar Industrial Area, Pune - 411028',
    gstin: '27AAFCO6789E1Z9',
    ownerName: 'Aarti Joshi',
    ownerEmail: 'aarti@officehub.co.in',
    catalog: [
      { productName: 'A4 Copier Paper 75GSM (500 sheets)', category: 'Paper & Printing', unit: 'ream', basePrice: 185, moq: 10, maxOrderQty: 2000, hsnCode: '4802', taxRate: 12, description: 'JK/Century brand, FSC certified' },
      { productName: 'Ballpoint Pen (Box/50)', category: 'Writing', unit: 'box', basePrice: 180, moq: 10, maxOrderQty: 500, hsnCode: '9608', taxRate: 18, description: 'Blue ink, retractable' },
      { productName: 'Sticky Notes 3×3" (12 pads/pack)', category: 'Stationery', unit: 'pack', basePrice: 220, moq: 5, maxOrderQty: 200, hsnCode: '4820', taxRate: 18 },
      { productName: 'File Folder A4 (Pack/50)', category: 'Filing', unit: 'pack', basePrice: 350, moq: 5, maxOrderQty: 500, hsnCode: '4820', taxRate: 18 },
      { productName: 'HP 805 Ink Cartridge (Black)', category: 'Printer Supplies', unit: 'pcs', basePrice: 290, moq: 10, maxOrderQty: 500, hsnCode: '8443', taxRate: 18 },
      { productName: 'Whiteboard Marker Set (4 colours)', category: 'Markers', unit: 'set', basePrice: 85, moq: 12, maxOrderQty: 1000, hsnCode: '9608', taxRate: 18 },
      { productName: 'Office Chair (Mesh Back)', category: 'Furniture', unit: 'pcs', basePrice: 4800, moq: 1, maxOrderQty: 50, hsnCode: '9401', taxRate: 18, description: 'Lumbar support, 5-star base, 1yr warranty' },
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  console.log('\n🌱 Seeding B2B supplier businesses...\n');

  for (const sup of SUPPLIERS) {
    // Check if already exists
    const existing = await prisma.tenant.findUnique({ where: { syllabrixId: sup.syllabrixId } });
    if (existing) {
      console.log(`  ⏭  ${sup.name} already exists — skipping`);
      continue;
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        syllabrixId: sup.syllabrixId,
        name: sup.name,
        businessType: sup.businessType,
        city: sup.city,
        state: sup.state,
        phone: sup.phone,
        email: sup.email,
        address: sup.address,
        gstin: sup.gstin,
        plan: 'GROWTH',
        isActive: true,
        modules: DEFAULT_MODULES,
        currency: 'INR',
        locale: 'en-IN',
        timezone: 'Asia/Kolkata',
      },
    });

    // Create owner user
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: sup.ownerName,
        email: sup.ownerEmail,
        password: passwordHash,
        role: 'OWNER',
        isActive: true,
        isEmailVerified: true,
      },
    });

    // Create display catalog items
    for (const item of sup.catalog) {
      await prisma.displayCatalogItem.create({
        data: {
          supplierTenantId: tenant.id,
          productName: item.productName,
          category: item.category || null,
          unit: item.unit || 'pcs',
          basePrice: item.basePrice,
          moq: item.moq || 1,
          maxOrderQty: item.maxOrderQty || null,
          hsnCode: item.hsnCode || null,
          taxRate: item.taxRate || 0,
          description: item.description || null,
          isAvailable: true,
        },
      });
    }

    console.log(`  ✅ ${sup.name} (${sup.businessType}, ${sup.city}) — ${sup.catalog.length} catalog items`);
  }

  console.log('\n📋 Login credentials for all supplier accounts:');
  console.log('   Password: Demo@1234\n');
  SUPPLIERS.forEach(s => {
    console.log(`   ${s.name.padEnd(30)} → ${s.ownerEmail}`);
  });
  console.log('\n✅ B2B seed complete!\n');
}

main()
  .catch(e => { console.error('Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
