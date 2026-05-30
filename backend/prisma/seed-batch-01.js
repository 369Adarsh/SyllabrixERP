/**
 * Syllabrix — Seed Batch 01
 * Businesses: RETAIL, KIRANA, COACHING, SALON, CLINIC (accounts 1–5)
 * Quality env: dotenv -e .env.quality -- node prisma/seed-batch-01.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.quality') });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PASS = bcrypt.hashSync('Test@1234', 10);
const d  = (days) => new Date(Date.now() - days * 86_400_000);
const f  = (days) => new Date(Date.now() + days * 86_400_000);

async function createTenant({ name, type, owner, email, phone, city, state, address, gstin, modules }) {
  const existing = await prisma.tenant.findUnique({ where: { email } });
  if (existing) {
    console.log(`  ⚡ Already exists: ${name} — skipping data creation`);
    return { tenant: existing, isNew: false };
  }
  const t = await prisma.tenant.create({
    data: {
      name, businessType: type, email, phone, address, city, state,
      gstin: gstin || null, modules,
      users: { create: { name: owner, email, password: PASS, role: 'OWNER', isEmailVerified: true } },
    },
  });
  console.log(`  ✓ Created: ${name} (${type})`);
  return { tenant: t, isNew: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. RETAIL — Ramesh Electronics, Delhi
// ─────────────────────────────────────────────────────────────────────────────
async function seedRetail() {
  console.log('\n[1/5] RETAIL — Ramesh Electronics');
  const { tenant: t, isNew } = await createTenant({
    name: 'Ramesh Electronics', type: 'RETAIL', owner: 'Ramesh Kumar',
    email: 'owner@rameshelectronics.test', phone: '9876543210',
    city: 'Delhi', state: 'Delhi', address: '12, Lajpat Nagar, New Delhi',
    gstin: '07AABCR1234A1Z5',
    modules: ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  });
  if (!isNew) return;

  const [catMobile, catTV, catAC, catAcc, catKitchen] = await Promise.all([
    prisma.category.create({ data: { tenantId: t.id, name: 'Mobile Phones' } }),
    prisma.category.create({ data: { tenantId: t.id, name: 'Televisions' } }),
    prisma.category.create({ data: { tenantId: t.id, name: 'Air Conditioners' } }),
    prisma.category.create({ data: { tenantId: t.id, name: 'Accessories' } }),
    prisma.category.create({ data: { tenantId: t.id, name: 'Kitchen Appliances' } }),
  ]);

  await prisma.product.createMany({ data: [
    { tenantId: t.id, categoryId: catMobile.id, name: 'Samsung Galaxy M34 5G', sku: 'MOB-SGM34', costPrice: 14000, sellingPrice: 17999, mrp: 18999, stock: 15, unit: 'pcs', lowStockAlert: 3 },
    { tenantId: t.id, categoryId: catMobile.id, name: 'Redmi Note 13 5G', sku: 'MOB-RN13', costPrice: 11500, sellingPrice: 14499, mrp: 15999, stock: 22, unit: 'pcs', lowStockAlert: 5 },
    { tenantId: t.id, categoryId: catMobile.id, name: 'Apple iPhone 15 128GB', sku: 'MOB-IP15', costPrice: 65000, sellingPrice: 74999, mrp: 79900, stock: 4, unit: 'pcs', lowStockAlert: 2 },
    { tenantId: t.id, categoryId: catMobile.id, name: 'Vivo V29 5G', sku: 'MOB-VV29', costPrice: 26000, sellingPrice: 32999, mrp: 35999, stock: 10, unit: 'pcs', lowStockAlert: 2 },
    { tenantId: t.id, categoryId: catMobile.id, name: 'OPPO Reno 11', sku: 'MOB-OR11', costPrice: 24000, sellingPrice: 29999, mrp: 31999, stock: 8, unit: 'pcs', lowStockAlert: 2 },
    { tenantId: t.id, categoryId: catMobile.id, name: 'OnePlus Nord CE 3 Lite', sku: 'MOB-ONCE3', costPrice: 16500, sellingPrice: 19999, mrp: 21999, stock: 12, unit: 'pcs', lowStockAlert: 3 },
    { tenantId: t.id, categoryId: catTV.id, name: 'Samsung 43" 4K Smart TV', sku: 'TV-SAM43', costPrice: 28000, sellingPrice: 35999, mrp: 42999, stock: 5, unit: 'pcs', lowStockAlert: 1 },
    { tenantId: t.id, categoryId: catTV.id, name: 'LG 55" OLED 4K TV', sku: 'TV-LG55', costPrice: 65000, sellingPrice: 79999, mrp: 89990, stock: 3, unit: 'pcs', lowStockAlert: 1 },
    { tenantId: t.id, categoryId: catTV.id, name: 'Mi 32" HD Smart TV', sku: 'TV-MI32', costPrice: 12000, sellingPrice: 15499, mrp: 17999, stock: 8, unit: 'pcs', lowStockAlert: 2 },
    { tenantId: t.id, categoryId: catAC.id, name: 'Daikin 1.5 Ton 5 Star Split AC', sku: 'AC-DAI15', costPrice: 34000, sellingPrice: 42999, mrp: 48000, stock: 6, unit: 'pcs', lowStockAlert: 1 },
    { tenantId: t.id, categoryId: catAC.id, name: 'Voltas 1 Ton 3 Star Window AC', sku: 'AC-VOL1', costPrice: 22000, sellingPrice: 27999, mrp: 31000, stock: 4, unit: 'pcs', lowStockAlert: 1 },
    { tenantId: t.id, categoryId: catAcc.id, name: 'boAt Rockerz 255 Earphone', sku: 'ACC-BOA255', costPrice: 500, sellingPrice: 999, mrp: 1299, stock: 60, unit: 'pcs', lowStockAlert: 10 },
    { tenantId: t.id, categoryId: catAcc.id, name: 'USB-C Charger 65W', sku: 'ACC-CHG65', costPrice: 450, sellingPrice: 799, mrp: 999, stock: 50, unit: 'pcs', lowStockAlert: 10 },
    { tenantId: t.id, categoryId: catAcc.id, name: 'Tempered Glass (Universal)', sku: 'ACC-TG01', costPrice: 40, sellingPrice: 99, mrp: 149, stock: 200, unit: 'pcs', lowStockAlert: 30 },
    { tenantId: t.id, categoryId: catAcc.id, name: 'Phone Cover Silicon', sku: 'ACC-PC01', costPrice: 50, sellingPrice: 149, mrp: 199, stock: 180, unit: 'pcs', lowStockAlert: 30 },
    { tenantId: t.id, categoryId: catKitchen.id, name: 'Prestige Induction Cooktop 1600W', sku: 'KIT-PI1600', costPrice: 1800, sellingPrice: 2599, mrp: 3200, stock: 15, unit: 'pcs', lowStockAlert: 3 },
    { tenantId: t.id, categoryId: catKitchen.id, name: 'Bajaj Mixer Grinder 750W', sku: 'KIT-BAJ750', costPrice: 2200, sellingPrice: 2999, mrp: 3500, stock: 10, unit: 'pcs', lowStockAlert: 2 },
    { tenantId: t.id, categoryId: catKitchen.id, name: 'Philips Air Fryer 4.1L', sku: 'KIT-PHI4L', costPrice: 6000, sellingPrice: 7999, mrp: 9500, stock: 7, unit: 'pcs', lowStockAlert: 2 },
  ]});

  const [c1, c2, c3] = await Promise.all([
    prisma.customer.create({ data: { tenantId: t.id, name: 'Suresh Mehta', phone: '9811001001', email: 'suresh@gmail.com', totalSpent: 17999 } }),
    prisma.customer.create({ data: { tenantId: t.id, name: 'Priya Sharma', phone: '9811002002', email: 'priya.s@gmail.com', totalSpent: 14499 } }),
    prisma.customer.create({ data: { tenantId: t.id, name: 'Rajesh Singh', phone: '9811003003', totalSpent: 0 } }),
  ]);

  await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c1.id,
    invoiceNumber: 'INV-RET-001', status: 'PAID',
    subtotal: 17999, taxAmount: 0, discountAmount: 0, total: 17999, amountPaid: 17999, balanceDue: 0,
    issueDate: d(10), dueDate: d(3),
    items: { create: [{ description: 'Samsung Galaxy M34 5G', quantity: 1, unitPrice: 17999, taxRate: 0, taxAmount: 0, total: 17999 }] },
  }});
  await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c2.id,
    invoiceNumber: 'INV-RET-002', status: 'SENT',
    subtotal: 14499, taxAmount: 0, discountAmount: 0, total: 14499, amountPaid: 5000, balanceDue: 9499,
    issueDate: d(5), dueDate: f(10),
    items: { create: [{ description: 'Redmi Note 13 5G', quantity: 1, unitPrice: 14499, taxRate: 0, taxAmount: 0, total: 14499 }] },
  }});

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'RENT', description: 'Monthly shop rent', amount: 35000, date: d(15), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'UTILITIES', description: 'Electricity bill', amount: 4200, date: d(12), method: 'UPI' },
    { tenantId: t.id, category: 'MARKETING', description: 'Google Ads — electronics', amount: 8000, date: d(8), method: 'CARD' },
    { tenantId: t.id, category: 'SALARIES', description: 'Sales staff — May', amount: 25000, date: d(30), method: 'BANK_TRANSFER' },
  ]});

  const v1 = await prisma.vendor.create({ data: { tenantId: t.id, name: 'Samsung India Distributor', contactPerson: 'Ajay Verma', phone: '9810001111', paymentTerms: 'NET30' } });
  await prisma.vendor.create({ data: { tenantId: t.id, name: 'Xiaomi/Redmi Wholesale', contactPerson: 'Mohan Lal', phone: '9810002222', paymentTerms: 'NET15' } });

  console.log('    → 18 products, 3 customers, 2 invoices, 4 expenses, 2 vendors');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. KIRANA — Sharma Kirana Store, Mumbai
// ─────────────────────────────────────────────────────────────────────────────
async function seedKirana() {
  console.log('\n[2/5] KIRANA — Sharma Kirana Store');
  const { tenant: t, isNew } = await createTenant({
    name: 'Sharma Kirana Store', type: 'KIRANA', owner: 'Vijay Sharma',
    email: 'owner@sharmakirana.test', phone: '9823456789',
    city: 'Mumbai', state: 'Maharashtra', address: '45, Dharavi Road, Mumbai',
    gstin: '27AABCS5678B1Z3',
    modules: ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  });
  if (!isNew) return;

  const [catGrain, catOil, catSpice, catBev, catSnack, catPersonal, catClean, catDairy] = await Promise.all([
    prisma.category.create({ data: { tenantId: t.id, name: 'Grains & Pulses' } }),
    prisma.category.create({ data: { tenantId: t.id, name: 'Oils & Ghee' } }),
    prisma.category.create({ data: { tenantId: t.id, name: 'Spices & Masala' } }),
    prisma.category.create({ data: { tenantId: t.id, name: 'Beverages & Tea' } }),
    prisma.category.create({ data: { tenantId: t.id, name: 'Biscuits & Snacks' } }),
    prisma.category.create({ data: { tenantId: t.id, name: 'Personal Care' } }),
    prisma.category.create({ data: { tenantId: t.id, name: 'Cleaning & Household' } }),
    prisma.category.create({ data: { tenantId: t.id, name: 'Dairy & Packaged' } }),
  ]);

  await prisma.product.createMany({ data: [
    // Grains & Pulses
    { tenantId: t.id, categoryId: catGrain.id, name: 'Toor Dal 1kg', sku: 'GRN-TD1', costPrice: 118, sellingPrice: 145, mrp: 155, stock: 100, unit: 'kg', lowStockAlert: 15 },
    { tenantId: t.id, categoryId: catGrain.id, name: 'Chana Dal 1kg', sku: 'GRN-CD1', costPrice: 90, sellingPrice: 110, mrp: 120, stock: 80, unit: 'kg', lowStockAlert: 15 },
    { tenantId: t.id, categoryId: catGrain.id, name: 'Moong Dal 1kg', sku: 'GRN-MD1', costPrice: 100, sellingPrice: 125, mrp: 135, stock: 70, unit: 'kg', lowStockAlert: 10 },
    { tenantId: t.id, categoryId: catGrain.id, name: 'Urad Dal 1kg', sku: 'GRN-UD1', costPrice: 105, sellingPrice: 130, mrp: 140, stock: 60, unit: 'kg', lowStockAlert: 10 },
    { tenantId: t.id, categoryId: catGrain.id, name: 'Masoor Dal 1kg', sku: 'GRN-MSD1', costPrice: 88, sellingPrice: 108, mrp: 118, stock: 75, unit: 'kg', lowStockAlert: 10 },
    { tenantId: t.id, categoryId: catGrain.id, name: 'India Gate Basmati Rice 5kg', sku: 'GRN-IGR5', costPrice: 400, sellingPrice: 490, mrp: 525, stock: 50, unit: 'pkt', lowStockAlert: 8 },
    { tenantId: t.id, categoryId: catGrain.id, name: 'Aashirvaad Atta 5kg', sku: 'GRN-ASH5', costPrice: 200, sellingPrice: 240, mrp: 260, stock: 60, unit: 'pkt', lowStockAlert: 10 },
    { tenantId: t.id, categoryId: catGrain.id, name: 'Fortune Soya Bean Oil 1L', sku: 'OIL-FSB1', costPrice: 120, sellingPrice: 148, mrp: 160, stock: 80, unit: 'btl', lowStockAlert: 12 },
    // Oils & Ghee
    { tenantId: t.id, categoryId: catOil.id, name: 'Amul Pure Ghee 1L', sku: 'OIL-AMG1', costPrice: 520, sellingPrice: 620, mrp: 660, stock: 30, unit: 'btl', lowStockAlert: 5 },
    { tenantId: t.id, categoryId: catOil.id, name: 'Saffola Gold Oil 5L', sku: 'OIL-SAF5', costPrice: 620, sellingPrice: 750, mrp: 810, stock: 25, unit: 'can', lowStockAlert: 5 },
    { tenantId: t.id, categoryId: catOil.id, name: 'Parachute Coconut Oil 500ml', sku: 'OIL-PAR5', costPrice: 90, sellingPrice: 115, mrp: 130, stock: 40, unit: 'btl', lowStockAlert: 8 },
    { tenantId: t.id, categoryId: catOil.id, name: 'Sundrop Sunflower Oil 1L', sku: 'OIL-SUN1', costPrice: 110, sellingPrice: 135, mrp: 148, stock: 60, unit: 'btl', lowStockAlert: 10 },
    // Spices & Masala
    { tenantId: t.id, categoryId: catSpice.id, name: 'MDH Chana Masala 100g', sku: 'SPC-MDH-CM', costPrice: 40, sellingPrice: 55, mrp: 65, stock: 60, unit: 'pkt', lowStockAlert: 10 },
    { tenantId: t.id, categoryId: catSpice.id, name: 'Everest Garam Masala 100g', sku: 'SPC-EVR-GM', costPrice: 45, sellingPrice: 62, mrp: 70, stock: 55, unit: 'pkt', lowStockAlert: 10 },
    { tenantId: t.id, categoryId: catSpice.id, name: 'Tata Salt 1kg', sku: 'SPC-TAT-SL', costPrice: 18, sellingPrice: 24, mrp: 28, stock: 120, unit: 'pkt', lowStockAlert: 20 },
    { tenantId: t.id, categoryId: catSpice.id, name: 'Haldi Powder 200g', sku: 'SPC-HAL-200', costPrice: 30, sellingPrice: 42, mrp: 50, stock: 80, unit: 'pkt', lowStockAlert: 15 },
    { tenantId: t.id, categoryId: catSpice.id, name: 'Red Chilli Powder 200g', sku: 'SPC-RCP-200', costPrice: 35, sellingPrice: 48, mrp: 58, stock: 70, unit: 'pkt', lowStockAlert: 12 },
    // Beverages & Tea
    { tenantId: t.id, categoryId: catBev.id, name: 'Brooke Bond Red Label Tea 500g', sku: 'BEV-BRL-500', costPrice: 200, sellingPrice: 248, mrp: 270, stock: 40, unit: 'pkt', lowStockAlert: 8 },
    { tenantId: t.id, categoryId: catBev.id, name: 'Tata Tea Premium 250g', sku: 'BEV-TTP-250', costPrice: 100, sellingPrice: 128, mrp: 140, stock: 50, unit: 'pkt', lowStockAlert: 10 },
    { tenantId: t.id, categoryId: catBev.id, name: 'Nescafe Classic 200g', sku: 'BEV-NES-200', costPrice: 400, sellingPrice: 490, mrp: 545, stock: 20, unit: 'jar', lowStockAlert: 4 },
    { tenantId: t.id, categoryId: catBev.id, name: 'Bournvita 500g', sku: 'BEV-BVT-500', costPrice: 230, sellingPrice: 285, mrp: 310, stock: 30, unit: 'jar', lowStockAlert: 5 },
    { tenantId: t.id, categoryId: catBev.id, name: 'Amul Milk 1L Tetra', sku: 'BEV-AML-1L', costPrice: 58, sellingPrice: 68, mrp: 72, stock: 100, unit: 'pkt', lowStockAlert: 20 },
    { tenantId: t.id, categoryId: catBev.id, name: 'Coca-Cola 2L Bottle', sku: 'BEV-CC-2L', costPrice: 72, sellingPrice: 90, mrp: 95, stock: 48, unit: 'btl', lowStockAlert: 10 },
    // Biscuits & Snacks
    { tenantId: t.id, categoryId: catSnack.id, name: 'Parle-G Biscuit 800g', sku: 'BSC-PRG-800', costPrice: 68, sellingPrice: 85, mrp: 90, stock: 80, unit: 'pkt', lowStockAlert: 15 },
    { tenantId: t.id, categoryId: catSnack.id, name: 'Britannia Good Day 150g', sku: 'BSC-BGD-150', costPrice: 25, sellingPrice: 35, mrp: 40, stock: 100, unit: 'pkt', lowStockAlert: 20 },
    { tenantId: t.id, categoryId: catSnack.id, name: 'Lays Classic Salted 73g', sku: 'SNK-LAY-73', costPrice: 18, sellingPrice: 25, mrp: 30, stock: 120, unit: 'pkt', lowStockAlert: 20 },
    { tenantId: t.id, categoryId: catSnack.id, name: 'Haldirams Aloo Bhujia 400g', sku: 'SNK-HAL-400', costPrice: 100, sellingPrice: 128, mrp: 140, stock: 40, unit: 'pkt', lowStockAlert: 8 },
    // Personal Care
    { tenantId: t.id, categoryId: catPersonal.id, name: 'Colgate MaxFresh 150g', sku: 'OHC-COL-150', costPrice: 62, sellingPrice: 78, mrp: 88, stock: 60, unit: 'pcs', lowStockAlert: 10 },
    { tenantId: t.id, categoryId: catPersonal.id, name: 'Lux Beauty Soap 100g', sku: 'OHC-LUX-100', costPrice: 28, sellingPrice: 38, mrp: 42, stock: 100, unit: 'pcs', lowStockAlert: 20 },
    { tenantId: t.id, categoryId: catPersonal.id, name: 'Head & Shoulders Shampoo 340ml', sku: 'OHC-HNS-340', costPrice: 195, sellingPrice: 248, mrp: 279, stock: 30, unit: 'btl', lowStockAlert: 6 },
    { tenantId: t.id, categoryId: catPersonal.id, name: 'Dettol Handwash 250ml', sku: 'OHC-DET-250', costPrice: 68, sellingPrice: 88, mrp: 99, stock: 50, unit: 'btl', lowStockAlert: 10 },
    // Cleaning & Household
    { tenantId: t.id, categoryId: catClean.id, name: 'Surf Excel 1kg', sku: 'CLN-SRF-1K', costPrice: 145, sellingPrice: 178, mrp: 195, stock: 50, unit: 'pkt', lowStockAlert: 10 },
    { tenantId: t.id, categoryId: catClean.id, name: 'Vim Dishwash Bar 400g', sku: 'CLN-VIM-400', costPrice: 38, sellingPrice: 50, mrp: 58, stock: 60, unit: 'pcs', lowStockAlert: 12 },
    { tenantId: t.id, categoryId: catClean.id, name: 'Harpic Power Plus 1L', sku: 'CLN-HRP-1L', costPrice: 90, sellingPrice: 118, mrp: 135, stock: 30, unit: 'btl', lowStockAlert: 6 },
    // Dairy & Packaged
    { tenantId: t.id, categoryId: catDairy.id, name: 'Amul Butter 500g', sku: 'DRY-AML-BTR', costPrice: 220, sellingPrice: 268, mrp: 285, stock: 20, unit: 'pkt', lowStockAlert: 4 },
    { tenantId: t.id, categoryId: catDairy.id, name: 'Amul Dahi 400g', sku: 'DRY-AML-DH', costPrice: 38, sellingPrice: 48, mrp: 55, stock: 30, unit: 'pcs', lowStockAlert: 6 },
    { tenantId: t.id, categoryId: catDairy.id, name: 'Maggi Noodles 70g Pack of 4', sku: 'DRY-MAG-4PK', costPrice: 52, sellingPrice: 68, mrp: 76, stock: 80, unit: 'pkt', lowStockAlert: 15 },
  ]});

  const [c1, c2, c3] = await Promise.all([
    prisma.customer.create({ data: { tenantId: t.id, name: 'Radha Devi', phone: '9833001001', totalSpent: 3450 } }),
    prisma.customer.create({ data: { tenantId: t.id, name: 'Ravi Nair', phone: '9833002002', totalSpent: 1890 } }),
    prisma.customer.create({ data: { tenantId: t.id, name: 'Sunita Patil', phone: '9833003003', totalSpent: 750 } }),
  ]);

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'RENT', description: 'Shop rent — May', amount: 12000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SUPPLIES', description: 'Carry bags & packaging', amount: 1500, date: d(10), method: 'CASH' },
    { tenantId: t.id, category: 'UTILITIES', description: 'Electricity', amount: 2800, date: d(20), method: 'UPI' },
    { tenantId: t.id, category: 'SUPPLIES', description: 'Stock purchase — grains', amount: 45000, date: d(7), method: 'BANK_TRANSFER' },
  ]});

  console.log('    → 35 products, 3 customers, 4 expenses');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COACHING — Bright Future Academy, Ahmedabad
// ─────────────────────────────────────────────────────────────────────────────
async function seedCoaching() {
  console.log('\n[3/5] COACHING — Bright Future Academy');
  const { tenant: t, isNew } = await createTenant({
    name: 'Bright Future Academy', type: 'COACHING', owner: 'Dr. Anita Patel',
    email: 'owner@brightfutureacademy.test', phone: '9867543210',
    city: 'Ahmedabad', state: 'Gujarat', address: 'Plot 7, Satellite Area, Ahmedabad',
    gstin: '24AABCA9012C1Z1',
    modules: ['fees', 'invoicing', 'customers', 'reports'],
  });
  if (!isNew) return;

  const [s1, s2, s3, s4, s5, s6] = await Promise.all([
    prisma.student.create({ data: { tenantId: t.id, name: 'Aryan Patel', phone: '9870001001', email: 'aryan@gmail.com', parentName: 'Sunil Patel', parentPhone: '9870001002', course: 'JEE Mains', batch: 'Batch A — Morning', enrolledAt: d(90) } }),
    prisma.student.create({ data: { tenantId: t.id, name: 'Sneha Shah', phone: '9870002001', parentName: 'Meena Shah', parentPhone: '9870002002', course: 'NEET', batch: 'Batch B — Evening', enrolledAt: d(60) } }),
    prisma.student.create({ data: { tenantId: t.id, name: 'Rohan Mehta', phone: '9870003001', parentName: 'Girish Mehta', parentPhone: '9870003002', course: 'Class 10 Boards', batch: 'Batch C', enrolledAt: d(45) } }),
    prisma.student.create({ data: { tenantId: t.id, name: 'Pooja Nair', phone: '9870004001', parentName: 'Suresh Nair', parentPhone: '9870004002', course: 'JEE Mains', batch: 'Batch A — Morning', enrolledAt: d(30) } }),
    prisma.student.create({ data: { tenantId: t.id, name: 'Karan Desai', phone: '9870005001', parentName: 'Hemant Desai', parentPhone: '9870005002', course: 'NEET', batch: 'Batch B — Evening', enrolledAt: d(20) } }),
    prisma.student.create({ data: { tenantId: t.id, name: 'Riya Joshi', phone: '9870006001', parentName: 'Sanjay Joshi', parentPhone: '9870006002', course: 'Class 12 Commerce', batch: 'Batch D', enrolledAt: d(10) } }),
  ]);

  await prisma.feeRecord.createMany({ data: [
    { tenantId: t.id, studentId: s1.id, description: 'JEE April Tuition Fee', amount: 8000, discount: 0, netAmount: 8000, dueDate: d(15), status: 'PAID', paidAmount: 8000, paidAt: d(14), paymentMethod: 'UPI', receiptNumber: 'FEE-BFA-001' },
    { tenantId: t.id, studentId: s1.id, description: 'JEE May Tuition Fee', amount: 8000, discount: 0, netAmount: 8000, dueDate: f(15), status: 'PENDING', paidAmount: 0 },
    { tenantId: t.id, studentId: s2.id, description: 'NEET April Tuition Fee', amount: 9500, discount: 500, netAmount: 9000, dueDate: d(20), status: 'PAID', paidAmount: 9000, paidAt: d(18), paymentMethod: 'BANK_TRANSFER', receiptNumber: 'FEE-BFA-002' },
    { tenantId: t.id, studentId: s2.id, description: 'NEET May Tuition Fee', amount: 9500, discount: 500, netAmount: 9000, dueDate: f(10), status: 'PENDING', paidAmount: 0 },
    { tenantId: t.id, studentId: s3.id, description: 'Boards April Tuition Fee', amount: 5000, discount: 0, netAmount: 5000, dueDate: d(25), status: 'PARTIAL', paidAmount: 2500 },
    { tenantId: t.id, studentId: s3.id, description: 'Study Material Charges', amount: 2000, discount: 0, netAmount: 2000, dueDate: d(30), status: 'OVERDUE', paidAmount: 0 },
    { tenantId: t.id, studentId: s4.id, description: 'JEE May Tuition Fee', amount: 8000, discount: 0, netAmount: 8000, dueDate: f(5), status: 'PENDING', paidAmount: 0 },
    { tenantId: t.id, studentId: s5.id, description: 'NEET Registration Fee', amount: 3000, discount: 0, netAmount: 3000, dueDate: d(5), status: 'PAID', paidAmount: 3000, paidAt: d(4), paymentMethod: 'UPI', receiptNumber: 'FEE-BFA-003' },
    { tenantId: t.id, studentId: s6.id, description: 'Commerce May Fee', amount: 5500, discount: 0, netAmount: 5500, dueDate: f(8), status: 'PENDING', paidAmount: 0 },
  ]});

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'RENT', description: 'Academy rent — May', amount: 35000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SALARIES', description: 'Teacher salaries — April', amount: 80000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SUPPLIES', description: 'Study material printing', amount: 8000, date: d(15), method: 'CASH' },
    { tenantId: t.id, category: 'MARKETING', description: 'Social media ads', amount: 5000, date: d(10), method: 'UPI' },
    { tenantId: t.id, category: 'UTILITIES', description: 'Electricity & internet', amount: 4500, date: d(20), method: 'UPI' },
  ]});

  await prisma.staff.createMany({ data: [
    { tenantId: t.id, name: 'Suresh Patel', phone: '9870101001', role: 'Physics Teacher', salary: 25000, joinedAt: d(365) },
    { tenantId: t.id, name: 'Kavita Shah', phone: '9870102002', role: 'Chemistry Teacher', salary: 22000, joinedAt: d(180) },
    { tenantId: t.id, name: 'Ravi Joshi', phone: '9870103003', role: 'Maths Teacher', salary: 28000, joinedAt: d(270) },
  ]});

  console.log('    → 6 students, 9 fee records, 5 expenses, 3 staff');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SALON — Glamour Studio, Bangalore
// ─────────────────────────────────────────────────────────────────────────────
async function seedSalon() {
  console.log('\n[4/5] SALON — Glamour Studio');
  const { tenant: t, isNew } = await createTenant({
    name: 'Glamour Studio', type: 'SALON', owner: 'Nisha Kapoor',
    email: 'owner@glamourstudio.test', phone: '9900112233',
    city: 'Bangalore', state: 'Karnataka', address: 'Shop 4, Koramangala 5th Block, Bangalore',
    gstin: '29AABCG3456D1Z7',
    modules: ['appointments', 'pos', 'inventory', 'invoicing', 'customers', 'reports'],
  });
  if (!isNew) return;

  await prisma.staff.createMany({ data: [
    { tenantId: t.id, name: 'Meera D', phone: '9900201001', email: 'meera@glamour.com', role: 'Senior Stylist', salary: 22000, joinedAt: d(365) },
    { tenantId: t.id, name: 'Asha R', phone: '9900202002', role: 'Beautician', salary: 16000, joinedAt: d(180) },
    { tenantId: t.id, name: 'Kavya S', phone: '9900203003', role: 'Junior Stylist', salary: 12000, joinedAt: d(90) },
    { tenantId: t.id, name: 'Pooja M', phone: '9900204004', role: 'Nail Artist', salary: 14000, joinedAt: d(60) },
  ]});

  const [sv1, sv2, sv3, sv4, sv5, sv6, sv7] = await Promise.all([
    prisma.service.create({ data: { tenantId: t.id, name: 'Haircut (Women)', duration: 45, price: 500 } }),
    prisma.service.create({ data: { tenantId: t.id, name: 'Haircut (Men)', duration: 30, price: 250 } }),
    prisma.service.create({ data: { tenantId: t.id, name: 'Hair Colour (Full)', duration: 150, price: 3500 } }),
    prisma.service.create({ data: { tenantId: t.id, name: 'Hair Colour (Highlights)', duration: 120, price: 2500 } }),
    prisma.service.create({ data: { tenantId: t.id, name: 'Facial (Basic)', duration: 60, price: 1200 } }),
    prisma.service.create({ data: { tenantId: t.id, name: 'Waxing (Full Arms)', duration: 30, price: 400 } }),
    prisma.service.create({ data: { tenantId: t.id, name: 'Bridal Package', duration: 240, price: 15000 } }),
  ]);

  const [c1, c2, c3, c4] = await Promise.all([
    prisma.customer.create({ data: { tenantId: t.id, name: 'Divya Menon', phone: '9900301001', email: 'divya@gmail.com', totalSpent: 4200 } }),
    prisma.customer.create({ data: { tenantId: t.id, name: 'Lakshmi R', phone: '9900302002', email: 'lakshmi@gmail.com', totalSpent: 15000 } }),
    prisma.customer.create({ data: { tenantId: t.id, name: 'Sunitha B', phone: '9900303003', totalSpent: 1700 } }),
    prisma.customer.create({ data: { tenantId: t.id, name: 'Preethi K', phone: '9900304004', totalSpent: 2400 } }),
  ]);

  await Promise.all([
    prisma.appointment.create({ data: { tenantId: t.id, customerId: c1.id, serviceId: sv1.id, title: 'Haircut', status: 'COMPLETED', startTime: d(7), endTime: new Date(d(7).getTime() + 45 * 60000), price: 500 } }),
    prisma.appointment.create({ data: { tenantId: t.id, customerId: c1.id, serviceId: sv5.id, title: 'Facial', status: 'SCHEDULED', startTime: f(2), endTime: new Date(f(2).getTime() + 60 * 60000), price: 1200 } }),
    prisma.appointment.create({ data: { tenantId: t.id, customerId: c2.id, serviceId: sv7.id, title: 'Bridal Package', status: 'CONFIRMED', startTime: f(5), endTime: new Date(f(5).getTime() + 240 * 60000), price: 15000 } }),
    prisma.appointment.create({ data: { tenantId: t.id, customerId: c3.id, serviceId: sv6.id, title: 'Waxing', status: 'COMPLETED', startTime: d(3), endTime: new Date(d(3).getTime() + 30 * 60000), price: 400 } }),
    prisma.appointment.create({ data: { tenantId: t.id, customerId: c4.id, serviceId: sv3.id, title: 'Hair Colour', status: 'SCHEDULED', startTime: f(1), endTime: new Date(f(1).getTime() + 150 * 60000), price: 3500 } }),
  ]);

  const catHair = await prisma.category.create({ data: { tenantId: t.id, name: 'Hair Care Products' } });
  const catSkin = await prisma.category.create({ data: { tenantId: t.id, name: 'Skin Care Products' } });
  await prisma.product.createMany({ data: [
    { tenantId: t.id, categoryId: catHair.id, name: 'Loreal Shampoo 400ml', sku: 'HC-LOR400', costPrice: 280, sellingPrice: 420, mrp: 499, stock: 30, unit: 'btl', lowStockAlert: 5 },
    { tenantId: t.id, categoryId: catHair.id, name: 'Schwarzkopf Hair Colour', sku: 'HC-SCHW', costPrice: 350, sellingPrice: 550, mrp: 650, stock: 18, unit: 'pcs', lowStockAlert: 3 },
    { tenantId: t.id, categoryId: catHair.id, name: 'Matrix Hair Serum 100ml', sku: 'HC-MAT100', costPrice: 400, sellingPrice: 650, mrp: 780, stock: 12, unit: 'btl', lowStockAlert: 3 },
    { tenantId: t.id, categoryId: catSkin.id, name: 'Lakme Skin Solution SPF 30', sku: 'SK-LAK30', costPrice: 220, sellingPrice: 380, mrp: 450, stock: 20, unit: 'pcs', lowStockAlert: 4 },
    { tenantId: t.id, categoryId: catSkin.id, name: 'VLCC Face Wash 150ml', sku: 'SK-VLC150', costPrice: 150, sellingPrice: 249, mrp: 295, stock: 25, unit: 'pcs', lowStockAlert: 5 },
  ]});

  await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c2.id,
    invoiceNumber: 'INV-SAL-001', status: 'PAID',
    subtotal: 15000, taxAmount: 0, discountAmount: 0, total: 15000, amountPaid: 15000, balanceDue: 0,
    issueDate: d(30), dueDate: d(25),
    items: { create: [{ description: 'Bridal Package — Hair + Makeup', quantity: 1, unitPrice: 15000, total: 15000 }] },
  }});

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'RENT', description: 'Salon rent — May', amount: 28000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SALARIES', description: 'Staff salaries', amount: 64000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SUPPLIES', description: 'Beauty products stock', amount: 18000, date: d(15), method: 'CARD' },
    { tenantId: t.id, category: 'UTILITIES', description: 'Electricity', amount: 5500, date: d(20), method: 'UPI' },
  ]});

  console.log('    → 4 staff, 7 services, 4 customers, 5 appointments, 5 products, 1 invoice, 4 expenses');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CLINIC — HealthCare Plus, Hyderabad
// ─────────────────────────────────────────────────────────────────────────────
async function seedClinic() {
  console.log('\n[5/5] CLINIC — HealthCare Plus Clinic');
  const { tenant: t, isNew } = await createTenant({
    name: 'HealthCare Plus Clinic', type: 'CLINIC', owner: 'Dr. Rakesh Gupta',
    email: 'owner@healthcareplus.test', phone: '9811223344',
    city: 'Hyderabad', state: 'Telangana', address: '23, Banjara Hills, Hyderabad',
    gstin: '36AABCR7890E1Z2',
    modules: ['appointments', 'invoicing', 'customers', 'reports'],
  });
  if (!isNew) return;

  await prisma.staff.createMany({ data: [
    { tenantId: t.id, name: 'Dr. Priya Reddy', phone: '9811301001', email: 'priya.reddy@clinic.com', role: 'General Physician', salary: 60000, joinedAt: d(730) },
    { tenantId: t.id, name: 'Nurse Sudha', phone: '9811302002', role: 'Nurse', salary: 18000, joinedAt: d(365) },
    { tenantId: t.id, name: 'Receptionist Geetha', phone: '9811303003', role: 'Receptionist', salary: 14000, joinedAt: d(200) },
  ]});

  const [sv1, sv2, sv3, sv4, sv5] = await Promise.all([
    prisma.service.create({ data: { tenantId: t.id, name: 'General Consultation', duration: 20, price: 500 } }),
    prisma.service.create({ data: { tenantId: t.id, name: 'Specialist Consultation', duration: 30, price: 1200 } }),
    prisma.service.create({ data: { tenantId: t.id, name: 'Blood Test (CBC)', duration: 10, price: 400 } }),
    prisma.service.create({ data: { tenantId: t.id, name: 'ECG', duration: 15, price: 600 } }),
    prisma.service.create({ data: { tenantId: t.id, name: 'X-Ray Chest', duration: 15, price: 800 } }),
  ]);

  const [c1, c2, c3, c4] = await Promise.all([
    prisma.customer.create({ data: { tenantId: t.id, name: 'Ramaiah B', phone: '9811401001', email: 'ramaiah@gmail.com', totalSpent: 1100 } }),
    prisma.customer.create({ data: { tenantId: t.id, name: 'Sunita K', phone: '9811402002', totalSpent: 500 } }),
    prisma.customer.create({ data: { tenantId: t.id, name: 'Hari Prasad', phone: '9811403003', totalSpent: 2000 } }),
    prisma.customer.create({ data: { tenantId: t.id, name: 'Kavitha M', phone: '9811404004', totalSpent: 0 } }),
  ]);

  await Promise.all([
    prisma.appointment.create({ data: { tenantId: t.id, customerId: c1.id, serviceId: sv1.id, title: 'General Consultation', status: 'COMPLETED', startTime: d(5), endTime: new Date(d(5).getTime() + 20 * 60000), price: 500 } }),
    prisma.appointment.create({ data: { tenantId: t.id, customerId: c1.id, serviceId: sv3.id, title: 'Blood Test', status: 'COMPLETED', startTime: d(4), endTime: new Date(d(4).getTime() + 10 * 60000), price: 400 } }),
    prisma.appointment.create({ data: { tenantId: t.id, customerId: c2.id, serviceId: sv1.id, title: 'Consultation', status: 'SCHEDULED', startTime: f(1), endTime: new Date(f(1).getTime() + 20 * 60000), price: 500 } }),
    prisma.appointment.create({ data: { tenantId: t.id, customerId: c3.id, serviceId: sv2.id, title: 'Specialist Consultation', status: 'SCHEDULED', startTime: f(3), endTime: new Date(f(3).getTime() + 30 * 60000), price: 1200 } }),
    prisma.appointment.create({ data: { tenantId: t.id, customerId: c4.id, serviceId: sv4.id, title: 'ECG', status: 'CONFIRMED', startTime: f(2), endTime: new Date(f(2).getTime() + 15 * 60000), price: 600 } }),
  ]);

  await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c1.id,
    invoiceNumber: 'INV-CLI-001', status: 'PAID',
    subtotal: 900, taxAmount: 0, discountAmount: 0, total: 900, amountPaid: 900, balanceDue: 0,
    issueDate: d(4), dueDate: d(4),
    items: { create: [
      { description: 'General Consultation', quantity: 1, unitPrice: 500, total: 500 },
      { description: 'Blood Test (CBC)', quantity: 1, unitPrice: 400, total: 400 },
    ] },
  }});

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'RENT', description: 'Clinic rent', amount: 45000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SALARIES', description: 'Staff salaries', amount: 92000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SUPPLIES', description: 'Medical supplies', amount: 12000, date: d(10), method: 'CARD' },
    { tenantId: t.id, category: 'INSURANCE', description: 'Medical insurance', amount: 8000, date: d(60), method: 'BANK_TRANSFER' },
  ]});

  console.log('    → 3 staff, 5 services, 4 customers, 5 appointments, 1 invoice, 4 expenses');
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 Syllabrix Seed — Batch 01 (Accounts 1–5)');
  console.log('─'.repeat(50));
  console.log('   Target: Syllabrix-Qty (Quality Environment)');
  console.log('─'.repeat(50));

  await seedRetail();
  await seedKirana();
  await seedCoaching();
  await seedSalon();
  await seedClinic();

  console.log('\n' + '─'.repeat(50));
  console.log('\n✅ Batch 01 complete!\n');
  console.log('Login credentials (password: Test@1234):\n');
  console.log('  1. RETAIL   → owner@rameshelectronics.test');
  console.log('  2. KIRANA   → owner@sharmakirana.test');
  console.log('  3. COACHING → owner@brightfutureacademy.test');
  console.log('  4. SALON    → owner@glamourstudio.test');
  console.log('  5. CLINIC   → owner@healthcareplus.test');
  console.log('\nUpdate QA tracker: Set Seed Status = Done for rows 1–5\n');
}

main()
  .catch((e) => { console.error('\n❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
