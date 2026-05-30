'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Sharma Kirana Store — 1-year comprehensive dummy data seed
// FY 2025-26 (April 1, 2025 → March 31, 2026)
// Run: node prisma/seed-kirana-full.js
// ─────────────────────────────────────────────────────────────────────────────
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_EMAIL = 'owner@sharmakirana.test';

// ── Counters ──────────────────────────────────────────────────────────────────
let _r = 1, _i = 1, _p = 1, _q = 1, _c = 1, _b = 1;
const nextRcpt = () => `SKS-${String(_r++).padStart(5, '0')}`;
const nextInv  = () => `INV-KS-${String(_i++).padStart(4, '0')}`;
const nextPO   = () => `PO-KS-${String(_p++).padStart(4, '0')}`;
const nextQuo  = () => `QUO-KS-${String(_q++).padStart(4, '0')}`;
const nextCN   = () => `CN-KS-${String(_c++).padStart(4, '0')}`;
const nextBill = () => `BILL-KS-${String(_b++).padStart(4, '0')}`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const ri   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[ri(0, arr.length - 1)];
const f2   = n => parseFloat(n.toFixed(2));
const addDays  = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fyDate   = (m, dy) => { const mo = (3 + m) % 12; const yr = (3 + m) < 12 ? 2025 : 2026; return new Date(yr, mo, dy); };
// fyDate(0, 1) = 2025-04-01, fyDate(11, 28) = 2026-03-28

const PMETHODS = ['CASH', 'CASH', 'CASH', 'UPI', 'UPI', 'CARD'];
const EXP_CATS = ['RENT', 'UTILITIES', 'SALARIES', 'MARKETING', 'SUPPLIES', 'MAINTENANCE', 'TRANSPORT', 'TAXES', 'INSURANCE', 'OTHER'];

// ── Step runner ───────────────────────────────────────────────────────────────
async function step(label, fn) {
  process.stdout.write(`   ${label.padEnd(38, '.')} `);
  const result = await fn();
  console.log('✓');
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱  Sharma Kirana Store — Full 1-Year Seed');
  console.log('─'.repeat(52));

  // ── Find or create tenant ─────────────────────────────────────────────────
  let tenantRec = await prisma.tenant.findUnique({ where: { email: TENANT_EMAIL } });
  let TID;

  if (!tenantRec) {
    console.log('   No tenant found — creating Sharma Kirana Store...');
    const hash = await bcrypt.hash('Test@1234', 10);
    tenantRec = await prisma.tenant.create({
      data: {
        name: 'Sharma Kirana Store', businessType: 'KIRANA',
        email: TENANT_EMAIL, phone: '9823456789',
        address: '45, Dharavi Road, Mumbai',
        city: 'Mumbai', state: 'Maharashtra',
        gstin: '27AABCS5678B1Z3',
        modules: ['pos','inventory','invoicing','customers','reports','vendors',
                  'expenses','assets','staff','payroll','whatsapp','quotations',
                  'creditNotes','finance','accounts','campaigns'],
        users: { create: { name: 'Vijay Sharma', email: TENANT_EMAIL, password: hash, role: 'OWNER', isEmailVerified: true } },
      },
    });
    console.log(`   ✓ Created tenant ${tenantRec.id}`);
  }
  TID = tenantRec.id;
  console.log(`   Tenant ID : ${TID}`);

  // ── Guard ─────────────────────────────────────────────────────────────────
  const existingProds = await prisma.product.count({ where: { tenantId: TID, sku: { startsWith: 'SKU-K-' } } });
  if (existingProds > 40) {
    console.log(`\n⚠️  Already seeded (${existingProds} SKU-K- products). Exiting.\n`);
    process.exit(0);
  }

  console.log('');

  const taxes  = await step('Tax rates (4)',                () => seedTaxRates(TID));
  const cats   = await step('Product categories (7)',       () => seedCategories(TID));
  const prods  = await step('Products (50)',                () => seedProducts(TID, cats, taxes));
  const custs  = await step('Customers (25)',               () => seedCustomers(TID));
  const staffs = await step('Staff (3)',                    () => seedStaff(TID));
  const vends  = await step('Vendors (8)',                  () => seedVendors(TID));
  const banks  = await step('Bank accounts (4)',            () => seedBankAccounts(TID));
               await step('Asset categories + 8 assets',   () => seedAssets(TID));
               await step('POS transactions (~800 days)',   () => seedPOS(TID, prods, custs));
               await step('B2B invoices (24)',              () => seedInvoices(TID, custs, prods));
               await step('Expenses (96)',                  () => seedExpenses(TID));
               await step('Purchase orders + bills (12)',   () => seedPurchaseOrders(TID, vends, prods));
               await step('Payroll runs (12 months)',       () => seedPayroll(TID, staffs));
               await step('Attendance logs (~1560)',        () => seedAttendance(TID, staffs));
               await step('Credit notes (6)',               () => seedCreditNotes(TID, custs));
               await step('Quotations (5)',                 () => seedQuotations(TID, custs, prods));
               await step('WhatsApp campaigns (3)',         () => seedCampaigns(TID));
               await step('Customer subscriptions (5)',     () => seedSubscriptions(TID, custs));
               await step('Bank transactions (monthly)',    () => seedBankTxns(TID, banks));
               await step('Recurring invoices (2)',         () => seedRecurring(TID, custs, prods));

  console.log('\n' + '─'.repeat(52));
  console.log('✅  Seed complete!\n');
  console.log(`   Login  : ${TENANT_EMAIL}`);
  console.log('   Pass   : Test@1234');
  console.log('   FY     : April 2025 – March 2026\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TAX RATES
// ─────────────────────────────────────────────────────────────────────────────
async function seedTaxRates(TID) {
  const defs = [
    { name: 'GST 0%',  rate: 0,  cgst: 0,   sgst: 0   },
    { name: 'GST 5%',  rate: 5,  cgst: 2.5, sgst: 2.5 },
    { name: 'GST 12%', rate: 12, cgst: 6,   sgst: 6   },
    { name: 'GST 18%', rate: 18, cgst: 9,   sgst: 9   },
  ];
  const result = [];
  for (const d of defs) {
    const t = await prisma.taxRate.create({
      data: { tenantId: TID, name: d.name, rate: d.rate, isGst: true, cgst: d.cgst, sgst: d.sgst, igst: d.rate },
    });
    result.push({ id: t.id, rate: d.rate });
  }
  return result; // [{ id, rate:0 }, { id, rate:5 }, { id, rate:12 }, { id, rate:18 }]
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────
async function seedCategories(TID) {
  const names = ['Grains & Pulses', 'Oils & Ghee', 'Spices & Masalas',
                 'Beverages', 'Dairy & Bakery', 'Snacks & Biscuits', 'Personal Care'];
  const result = [];
  for (const name of names) {
    const c = await prisma.category.create({ data: { tenantId: TID, name } });
    result.push(c);
  }
  return result; // [grains, oils, spices, bev, dairy, snacks, care]
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PRODUCTS (50)
// ─────────────────────────────────────────────────────────────────────────────
async function seedProducts(TID, cats, taxes) {
  const [grains, oils, spices, bev, dairy, snacks, care] = cats;
  const [t0, t5, t12, t18] = taxes; // { id, rate }

  const TODAY = new Date();

  const defs = [
    // ── Grains & Pulses (0% GST) ─────────────────────────────────────────────
    { c: grains, t: t0,  name:'Basmati Rice 5kg',       sku:'SKU-K-001', hsn:'1006', cost:320, sell:380, mrp:399, unit:'bag', stock:80 },
    { c: grains, t: t0,  name:'Toor Dal 1kg',            sku:'SKU-K-002', hsn:'0713', cost:110, sell:130, mrp:140, unit:'kg',  stock:120 },
    { c: grains, t: t0,  name:'Moong Dal 1kg',           sku:'SKU-K-003', hsn:'0713', cost:95,  sell:115, mrp:125, unit:'kg',  stock:100 },
    { c: grains, t: t0,  name:'Chana Dal 1kg',           sku:'SKU-K-004', hsn:'0713', cost:72,  sell:88,  mrp:95,  unit:'kg',  stock:110 },
    { c: grains, t: t0,  name:'Aashirvaad Atta 5kg',    sku:'SKU-K-005', hsn:'1101', cost:200, sell:240, mrp:260, unit:'bag', stock:60  },
    { c: grains, t: t0,  name:'Maida 1kg',               sku:'SKU-K-006', hsn:'1101', cost:35,  sell:42,  mrp:48,  unit:'kg',  stock:90  },
    { c: grains, t: t0,  name:'Suji/Rava 1kg',           sku:'SKU-K-007', hsn:'1103', cost:42,  sell:50,  mrp:55,  unit:'kg',  stock:85  },
    // ── Oils & Ghee (5% GST) ─────────────────────────────────────────────────
    { c: oils,   t: t5,  name:'Sunflower Oil 1L',        sku:'SKU-K-008', hsn:'1512', cost:120, sell:145, mrp:155, unit:'ltr', stock:150 },
    { c: oils,   t: t5,  name:'Mustard Oil 1L',          sku:'SKU-K-009', hsn:'1514', cost:130, sell:155, mrp:165, unit:'ltr', stock:120 },
    { c: oils,   t: t5,  name:'Saffola Gold 1L',         sku:'SKU-K-010', hsn:'1512', cost:148, sell:175, mrp:185, unit:'ltr', stock:80  },
    { c: oils,   t: t5,  name:'Amul Ghee 500g',          sku:'SKU-K-011', hsn:'0405', cost:255, sell:290, mrp:305, unit:'tin', stock:70  },
    { c: oils,   t: t5,  name:'Fortune Oil 5L',          sku:'SKU-K-012', hsn:'1512', cost:580, sell:680, mrp:720, unit:'can', stock:40  },
    // ── Spices & Masalas (5% GST) ────────────────────────────────────────────
    { c: spices, t: t5,  name:'MDH Garam Masala 100g',  sku:'SKU-K-013', hsn:'0910', cost:55,  sell:70,  mrp:75,  unit:'pkt', stock:100 },
    { c: spices, t: t5,  name:'Everest Turmeric 200g',  sku:'SKU-K-014', hsn:'0910', cost:58,  sell:72,  mrp:78,  unit:'pkt', stock:90  },
    { c: spices, t: t5,  name:'Red Chilli Powder 200g', sku:'SKU-K-015', hsn:'0904', cost:52,  sell:65,  mrp:70,  unit:'pkt', stock:85  },
    { c: spices, t: t5,  name:'Cumin Seeds 200g',       sku:'SKU-K-016', hsn:'0909', cost:45,  sell:58,  mrp:62,  unit:'pkt', stock:80  },
    { c: spices, t: t5,  name:'Coriander Powder 200g',  sku:'SKU-K-017', hsn:'0909', cost:35,  sell:44,  mrp:48,  unit:'pkt', stock:95  },
    { c: spices, t: t5,  name:'Tata Salt 1kg',          sku:'SKU-K-018', hsn:'2501', cost:18,  sell:24,  mrp:28,  unit:'pkt', stock:150 },
    // ── Beverages (12% tea/coffee, 18% aerated) ───────────────────────────────
    { c: bev,    t: t12, name:'Taj Mahal Tea 250g',     sku:'SKU-K-019', hsn:'0902', cost:95,  sell:120, mrp:130, unit:'pkt', stock:80  },
    { c: bev,    t: t12, name:'Nescafe Classic 100g',   sku:'SKU-K-020', hsn:'2101', cost:185, sell:220, mrp:235, unit:'jar', stock:50  },
    { c: bev,    t: t12, name:'Bournvita 500g',         sku:'SKU-K-021', hsn:'1901', cost:195, sell:235, mrp:250, unit:'tin', stock:45  },
    { c: bev,    t: t18, name:'Pepsi 2L',               sku:'SKU-K-022', hsn:'2202', cost:65,  sell:85,  mrp:90,  unit:'btl', stock:120, exp: addDays(TODAY, 150) },
    { c: bev,    t: t18, name:'Thumbs Up 750ml',        sku:'SKU-K-023', hsn:'2202', cost:35,  sell:42,  mrp:45,  unit:'btl', stock:150, exp: addDays(TODAY, 120) },
    { c: bev,    t: t12, name:'Tropicana Orange 1L',    sku:'SKU-K-024', hsn:'2009', cost:95,  sell:115, mrp:125, unit:'pack',stock:60,  exp: addDays(TODAY, 40)  },
    // ── Dairy & Bakery ────────────────────────────────────────────────────────
    { c: dairy,  t: t5,  name:'Amul Butter 500g',       sku:'SKU-K-025', hsn:'0405', cost:225, sell:260, mrp:275, unit:'pkt', stock:60,  exp: addDays(TODAY, 25)  },
    { c: dairy,  t: t0,  name:'Amul Milk 1L Tetra',     sku:'SKU-K-026', hsn:'0401', cost:56,  sell:68,  mrp:70,  unit:'pck', stock:200, exp: addDays(TODAY, 3)   },
    { c: dairy,  t: t5,  name:'Mother Dairy Paneer 200g',sku:'SKU-K-027', hsn:'0406', cost:75,  sell:92,  mrp:100, unit:'pkt', stock:40,  exp: addDays(TODAY, 5)   },
    { c: dairy,  t: t0,  name:'Britannia Bread 400g',   sku:'SKU-K-028', hsn:'1905', cost:38,  sell:48,  mrp:52,  unit:'pkt', stock:80,  exp: addDays(TODAY, 4)   },
    { c: dairy,  t: t5,  name:'Amul Cheese Slices 200g',sku:'SKU-K-029', hsn:'0406', cost:115, sell:140, mrp:150, unit:'pack',stock:35,  exp: addDays(TODAY, 40)  },
    // ── Snacks & Biscuits (18% GST) ───────────────────────────────────────────
    { c: snacks, t: t18, name:'Parle-G 800g',           sku:'SKU-K-030', hsn:'1905', cost:58,  sell:72,  mrp:80,  unit:'pkt', stock:100 },
    { c: snacks, t: t18, name:'Britannia Good Day 150g',sku:'SKU-K-031', hsn:'1905', cost:22,  sell:28,  mrp:32,  unit:'pkt', stock:120 },
    { c: snacks, t: t18, name:"Lay's Classic 52g",      sku:'SKU-K-032', hsn:'2106', cost:18,  sell:22,  mrp:25,  unit:'pkt', stock:200 },
    { c: snacks, t: t18, name:'Kurkure Masala 65g',     sku:'SKU-K-033', hsn:'1905', cost:16,  sell:20,  mrp:22,  unit:'pkt', stock:200 },
    { c: snacks, t: t18, name:'Maggi Noodles 4-Pack',   sku:'SKU-K-034', hsn:'1902', cost:55,  sell:68,  mrp:72,  unit:'pkt', stock:150 },
    { c: snacks, t: t18, name:'Haldiram Namkeen 200g',  sku:'SKU-K-035', hsn:'2106', cost:38,  sell:48,  mrp:55,  unit:'pkt', stock:90  },
    { c: snacks, t: t18, name:'Bikano Boondi 200g',     sku:'SKU-K-036', hsn:'2106', cost:32,  sell:40,  mrp:45,  unit:'pkt', stock:80  },
    // ── Personal Care (18% GST) ───────────────────────────────────────────────
    { c: care,   t: t18, name:'Surf Excel 1kg',         sku:'SKU-K-037', hsn:'3402', cost:105, sell:128, mrp:140, unit:'pkt', stock:80  },
    { c: care,   t: t18, name:'Ariel 500g',             sku:'SKU-K-038', hsn:'3402', cost:72,  sell:88,  mrp:95,  unit:'pkt', stock:70  },
    { c: care,   t: t18, name:'Vim Dish Wash 750ml',    sku:'SKU-K-039', hsn:'3402', cost:55,  sell:68,  mrp:72,  unit:'btl', stock:90  },
    { c: care,   t: t18, name:'Dettol Soap 75g',        sku:'SKU-K-040', hsn:'3401', cost:38,  sell:48,  mrp:52,  unit:'pcs', stock:150 },
    { c: care,   t: t18, name:'Colgate 150g',           sku:'SKU-K-041', hsn:'3306', cost:72,  sell:88,  mrp:95,  unit:'pcs', stock:100 },
    { c: care,   t: t18, name:'Pepsodent 150g',         sku:'SKU-K-042', hsn:'3306', cost:62,  sell:78,  mrp:85,  unit:'pcs', stock:80  },
    { c: care,   t: t18, name:'Lifebuoy Soap 75g',      sku:'SKU-K-043', hsn:'3401', cost:32,  sell:40,  mrp:45,  unit:'pcs', stock:180 },
    { c: care,   t: t18, name:'Head & Shoulders 180ml', sku:'SKU-K-044', hsn:'3305', cost:148, sell:185, mrp:199, unit:'btl', stock:60  },
    { c: care,   t: t18, name:'Harpic 500ml',           sku:'SKU-K-045', hsn:'3402', cost:72,  sell:88,  mrp:95,  unit:'btl', stock:60  },
    { c: care,   t: t18, name:'Colin 500ml',            sku:'SKU-K-046', hsn:'3402', cost:72,  sell:88,  mrp:95,  unit:'btl', stock:55  },
    { c: care,   t: t18, name:'Odonil Air Freshener 50g',sku:'SKU-K-047',hsn:'3307', cost:42,  sell:52,  mrp:58,  unit:'pcs', stock:70  },
    { c: care,   t: t18, name:'Gillette Mach3 Razor',   sku:'SKU-K-048', hsn:'8212', cost:215, sell:260, mrp:280, unit:'pcs', stock:30  },
    { c: care,   t: t18, name:'Whisper Ultra 7s',       sku:'SKU-K-049', hsn:'9619', cost:52,  sell:65,  mrp:72,  unit:'pack',stock:50  },
    { c: care,   t: t18, name:'Ujala Whitener 200ml',   sku:'SKU-K-050', hsn:'3402', cost:42,  sell:52,  mrp:58,  unit:'btl', stock:60  },
  ];

  const result = [];
  for (const d of defs) {
    const p = await prisma.product.create({
      data: {
        tenantId: TID, categoryId: d.c.id, taxRateId: d.t.id,
        name: d.name, sku: d.sku, hsnCode: d.hsn,
        costPrice: d.cost, sellingPrice: d.sell, mrp: d.mrp,
        unit: d.unit, stock: d.stock, lowStockAlert: 10,
        expiryDate: d.exp || null, isActive: true,
      },
    });
    result.push({ ...p, gstRate: d.t.rate });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CUSTOMERS (25)
// ─────────────────────────────────────────────────────────────────────────────
async function seedCustomers(TID) {
  const defs = [
    { name:'Raj Provisions',       phone:'9820001001', email:'raj@provisions.com', gstin:'27AABCR1234B1Z5', creditLimit:50000, tags:['b2b','restaurant'] },
    { name:'Hotel Annapurna',      phone:'9820002002', email:'hotel@annapurna.com', gstin:'27AABCA2345C1Z4', creditLimit:75000, tags:['b2b','hotel'] },
    { name:'Tiffin Express',       phone:'9820003003', email:null, creditLimit:25000, tags:['b2b','caterer'] },
    { name:'Priya Bakery',         phone:'9820004004', email:'priya@bakery.com', creditLimit:30000, tags:['b2b','bakery'] },
    { name:'Sunita Canteen',       phone:'9820005005', email:null, creditLimit:20000, tags:['b2b'] },
    { name:'Meena Sharma',         phone:'9821001001', email:'meena.sharma@gmail.com', birthday: new Date(1985, 5, 15), tags:['vip','loyalty'] },
    { name:'Ramesh Yadav',         phone:'9821002002', email:null, tags:['regular'] },
    { name:'Kavita Patel',         phone:'9821003003', email:'kavita.p@gmail.com', birthday: new Date(1990, 2, 22), tags:['regular','vip'] },
    { name:'Suresh Gupta',         phone:'9821004004', email:null, tags:['regular'] },
    { name:'Anita Mishra',         phone:'9821005005', email:null, tags:['regular'] },
    { name:'Deepak Joshi',         phone:'9821006006', email:'deepakj@gmail.com', tags:['regular'] },
    { c: 0, name:'Sunita Verma',   phone:'9821007007', email:null, tags:['regular'] },
    { name:'Ajay Nair',            phone:'9821008008', email:null, tags:['regular'] },
    { name:'Lata Tiwari',          phone:'9821009009', email:'lata.t@gmail.com', birthday: new Date(1978, 8, 10), tags:['vip'] },
    { name:'Arun Pandey',          phone:'9821010010', email:null, tags:['regular'] },
    { name:'Geeta Shah',           phone:'9821011011', email:'geeta@gmail.com', tags:['regular'] },
    { name:'Dinesh Rao',           phone:'9821012012', email:null, tags:['regular'] },
    { name:'Rekha Bose',           phone:'9821013013', email:null, tags:['regular'] },
    { name:'Mohan Iyer',           phone:'9821014014', email:'mohan.iyer@gmail.com', tags:['regular','vip'] },
    { name:'Swati Desai',          phone:'9821015015', email:null, tags:['regular'] },
    { name:'Prakash Kulkarni',     phone:'9821016016', email:null, tags:['regular'] },
    { name:'Neha Patil',           phone:'9821017017', email:'neha.p@gmail.com', birthday: new Date(1995, 11, 5), tags:['regular'] },
    { name:'Santosh Chavan',       phone:'9821018018', email:null, tags:['regular'] },
    { name:'Priti Gaikwad',        phone:'9821019019', email:null, tags:['regular'] },
    { name:'Vikram Pawar',         phone:'9821020020', email:'vikram.p@gmail.com', tags:['regular'] },
  ];

  const result = [];
  for (const d of defs) {
    const c = await prisma.customer.create({
      data: {
        tenantId: TID,
        name: d.name,
        phone: d.phone,
        email: d.email || null,
        gstin: d.gstin || null,
        creditLimit: d.creditLimit || 0,
        loyaltyPoints: ri(0, 500),
        birthday: d.birthday || null,
        tags: d.tags || [],
        totalSpent: 0,
      },
    });
    result.push(c);
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. STAFF (3)
// ─────────────────────────────────────────────────────────────────────────────
async function seedStaff(TID) {
  const defs = [
    { name:'Sanjay Yadav',  phone:'9832001001', email:'sanjay@sharma-kirana.com', role:'Store Manager',   dept:'Operations', salary:22000, joined: new Date(2023, 0, 10) },
    { name:'Ramesh Kumar',  phone:'9832002002', email:null,                       role:'Cashier',          dept:'Sales',      salary:18000, joined: new Date(2023, 5, 15) },
    { name:'Suraj Thapa',   phone:'9832003003', email:null,                       role:'Delivery & Helper',dept:'Delivery',   salary:14000, joined: new Date(2024, 2, 1)  },
  ];
  const result = [];
  for (const d of defs) {
    const s = await prisma.staff.create({
      data: {
        tenantId: TID, name: d.name, phone: d.phone, email: d.email,
        role: d.role, department: d.dept, salary: d.salary, joinedAt: d.joined, isActive: true,
      },
    });
    result.push({ ...s, salary: d.salary });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. VENDORS (8)
// ─────────────────────────────────────────────────────────────────────────────
async function seedVendors(TID) {
  const defs = [
    { name:'Shakti Agro Distributors',   contact:'Vijay Shakti',  phone:'9812001001', gstin:'27AABCS1234A1Z5', terms:'NET30' },
    { name:'Modi Oils & Fats Pvt Ltd',   contact:'Anil Modi',     phone:'9812002002', gstin:'27AABCM2345B1Z4', terms:'NET15' },
    { name:'National Spice Merchants',   contact:'Ramesh Sharma', phone:'9812003003', gstin:null,              terms:'COD'   },
    { name:'HUL Distributor Mumbai',     contact:'Sanjay Mehta',  phone:'9812004004', gstin:'27AABCH3456C1Z3', terms:'NET30' },
    { name:'Amul Dairy Distributor',     contact:'Suresh Patel',  phone:'9812005005', gstin:'27AABCA4567D1Z2', terms:'NET7'  },
    { name:'Britannia Area Dealer',      contact:'Kiran Joshi',   phone:'9812006006', gstin:'27AABCB5678E1Z1', terms:'NET15' },
    { name:'ITC Limited Distributor',    contact:'Anand Kumar',   phone:'9812007007', gstin:'27AABCI6789F1Z0', terms:'NET30' },
    { name:'Coca-Cola/Pepsi Distributor',contact:'Deepak Singh',  phone:'9812008008', gstin:'27AABCC7890G1Z9', terms:'NET7'  },
  ];
  const result = [];
  for (const d of defs) {
    const v = await prisma.vendor.create({
      data: {
        tenantId: TID, name: d.name, contactPerson: d.contact, phone: d.phone,
        gstin: d.gstin, paymentTerms: d.terms, isActive: true,
      },
    });
    result.push(v);
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. BANK ACCOUNTS (4)
// ─────────────────────────────────────────────────────────────────────────────
async function seedBankAccounts(TID) {
  const defs = [
    { name:'HDFC Current Account', bank:'HDFC Bank',  acct:'50200012345678', ifsc:'HDFC0001234', type:'CURRENT', opening:50000  },
    { name:'Cash in Hand',         bank:'Cash',       acct:null,             ifsc:null,          type:'CASH',    opening:15000  },
    { name:'ICICI Savings Account',bank:'ICICI Bank', acct:'023001234567',   ifsc:'ICIC0000230', type:'SAVINGS', opening:25000  },
    { name:'HDFC Business Loan',   bank:'HDFC Bank',  acct:'37020056789012', ifsc:'HDFC0001234', type:'LOAN',    opening:200000 },
  ];
  const result = [];
  for (const d of defs) {
    const a = await prisma.bankAccount.create({
      data: {
        tenantId: TID, name: d.name, bankName: d.bank,
        accountNumber: d.acct, ifscCode: d.ifsc,
        accountType: d.type, openingBalance: d.opening,
        currentBalance: d.opening, isActive: true,
      },
    });
    result.push({ ...a, type: d.type });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. ASSETS
// ─────────────────────────────────────────────────────────────────────────────
async function seedAssets(TID) {
  const [acFurniture, acElectrical, acComputer, acVehicle] = await Promise.all([
    prisma.assetCategory.create({ data: { tenantId: TID, name: 'Furniture & Fixtures', wdvRate: 10, description: 'Shelves, counters, racks' } }),
    prisma.assetCategory.create({ data: { tenantId: TID, name: 'Electrical Equipment', wdvRate: 15, description: 'Refrigerators, fans, AC' } }),
    prisma.assetCategory.create({ data: { tenantId: TID, name: 'Computer & POS Equipment', wdvRate: 40, description: 'Terminals, scanners' } }),
    prisma.assetCategory.create({ data: { tenantId: TID, name: 'Vehicles', wdvRate: 20, description: 'Delivery scooter' } }),
  ]);

  const assetDefs = [
    { cat: acFurniture,  code:'AST-001', name:'Glass Display Counter',      serial:'GDC-2022-001', loc:'Main Shop',      pDate: new Date(2022, 3, 10), price:45000, salvage:5000, life:10, val:38250 },
    { cat: acFurniture,  code:'AST-002', name:'Steel Storage Racks (3 sets)',serial:'SSR-2022-001', loc:'Storage Area',   pDate: new Date(2022, 5, 15), price:32000, salvage:3000, life:10, val:27200 },
    { cat: acElectrical, code:'AST-003', name:'Double Door Refrigerator',    serial:'DDR-LG-45678', loc:'Beverages Section',pDate:new Date(2023, 0, 20), price:28000, salvage:3000, life:8,  val:21875 },
    { cat: acElectrical, code:'AST-004', name:'Digital Weighing Machine',    serial:'DWM-2023-001', loc:'Counter',        pDate: new Date(2023, 3, 5),  price:8500,  salvage:500,  life:6,  val:6667  },
    { cat: acElectrical, code:'AST-005', name:'Ceiling Fans (4 nos)',        serial:'CF-2022-SET1', loc:'Shop Floor',     pDate: new Date(2022, 3, 1),  price:12000, salvage:1000, life:8,  val:9063  },
    { cat: acComputer,   code:'AST-006', name:'Barcode Scanner',             serial:'BS-HON-78901', loc:'Counter',        pDate: new Date(2023, 6, 12), price:6500,  salvage:500,  life:4,  val:4500  },
    { cat: acComputer,   code:'AST-007', name:'POS Terminal & Cash Register',serial:'POS-2023-001', loc:'Counter',        pDate: new Date(2023, 6, 12), price:18000, salvage:2000, life:4,  val:12500 },
    { cat: acVehicle,    code:'AST-008', name:'Honda Activa Delivery Scooter',serial:'MH02EF1234',  loc:'Parking',        pDate: new Date(2022, 8, 15), price:75000, salvage:10000,life:7,  val:55357 },
  ];

  for (const d of assetDefs) {
    const asset = await prisma.asset.create({
      data: {
        tenantId: TID, categoryId: d.cat.id,
        assetCode: d.code, name: d.name, serialNumber: d.serial,
        location: d.loc, purchaseDate: d.pDate, purchasePrice: d.price,
        salvageValue: d.salvage, usefulLifeYears: d.life,
        depreciationMethod: 'SLM', currentValue: d.val, status: 'ACTIVE',
        vendor: 'Local Market',
      },
    });
    // Add 1 maintenance log per asset
    await prisma.assetMaintenance.create({
      data: {
        assetId: asset.id, type: 'SCHEDULED',
        description: 'Annual inspection and cleaning',
        cost: ri(500, 2000), performedBy: 'Local Technician',
        performedAt: new Date(2025, 3 + ri(0, 5), ri(1, 28)),
        nextDueDate: new Date(2026, 3 + ri(0, 5), ri(1, 28)),
        notes: 'All components in good condition',
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. POS TRANSACTIONS (~800 over 365 days)
// ─────────────────────────────────────────────────────────────────────────────
async function seedPOS(TID, prods, custs) {
  const bizCusts   = custs.slice(0, 5);  // B2B customers
  const walkInCusts = custs.slice(5);    // Regular walk-in customers

  // Stable products for POS (exclude perishables that expire quickly except milk/bread)
  const posProds = prods.filter(p => p.gstRate !== null);

  const FY_START = new Date(2025, 3, 1); // April 1, 2025

  const batch = [];
  for (let day = 0; day < 365; day++) {
    const txDate = addDays(FY_START, day);
    const isSunday = txDate.getDay() === 0;

    // Festival boost: Diwali (Oct), Holi (Mar), Eid (Apr), Ganesh Chaturthi (Sep)
    const month = txDate.getMonth();
    const isFestival = [3, 8, 9, 2].includes(month);
    const txCount = isSunday ? ri(1, 2) : isFestival ? ri(3, 5) : ri(2, 3);

    for (let t = 0; t < txCount; t++) {
      const hour = t === 0 ? ri(9, 12) : t === 1 ? ri(14, 17) : ri(18, 21);
      const txDateTime = new Date(txDate);
      txDateTime.setHours(hour, ri(0, 59), ri(0, 59));

      // Pick 2-5 distinct products
      const itemCount = ri(2, 5);
      const usedIdx = new Set();
      const selectedProds = [];
      while (selectedProds.length < itemCount) {
        const idx = ri(0, posProds.length - 1);
        if (!usedIdx.has(idx)) { usedIdx.add(idx); selectedProds.push(posProds[idx]); }
      }

      let subtotal = 0, taxTotal = 0;
      const items = selectedProds.map(p => {
        const qty     = ri(1, p.sellingPrice > 200 ? 2 : 4);
        const lineSub = f2(p.sellingPrice * qty);
        const tax     = f2(lineSub * p.gstRate / 100);
        const total   = f2(lineSub + tax);
        subtotal += lineSub;
        taxTotal += tax;
        return {
          productId: p.id, name: p.name, hsnCode: p.hsnCode,
          quantity: qty, unitPrice: p.sellingPrice, discount: 0,
          gstRate: p.gstRate,
          taxAmount: tax,
          cgst: f2(tax / 2), sgst: f2(tax / 2), igst: 0,
          total,
        };
      });

      const grandTotal = f2(subtotal + taxTotal);
      const method     = pick(PMETHODS);
      // 40% chance to link to a walk-in customer
      const linkCust   = ri(0, 9) > 5 ? pick(walkInCusts) : null;

      batch.push({
        tenantId: TID,
        customerId: linkCust?.id || null,
        receiptNumber: nextRcpt(),
        subtotal: f2(subtotal),
        taxAmount: f2(taxTotal),
        total: grandTotal,
        amountPaid: grandTotal,
        change: 0,
        paymentMethod: method,
        createdAt: txDateTime,
        updatedAt: txDateTime,
        items,
      });
    }
  }

  // Insert in batches of 20 for speed
  const CHUNK = 20;
  for (let i = 0; i < batch.length; i += CHUNK) {
    const chunk = batch.slice(i, i + CHUNK);
    await Promise.all(chunk.map(tx =>
      prisma.transaction.create({
        data: {
          tenantId: tx.tenantId,
          customerId: tx.customerId,
          receiptNumber: tx.receiptNumber,
          subtotal: tx.subtotal,
          taxAmount: tx.taxAmount,
          total: tx.total,
          amountPaid: tx.amountPaid,
          change: tx.change,
          paymentMethod: tx.paymentMethod,
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
          items: { create: tx.items },
        },
      })
    ));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. B2B INVOICES (24 — 2/month)
// ─────────────────────────────────────────────────────────────────────────────
async function seedInvoices(TID, custs, prods) {
  const bizCusts = custs.slice(0, 5);
  const NOW      = new Date();

  for (let m = 0; m < 12; m++) {
    const { year, month0 } = getYearMonth(m);

    for (let inv = 0; inv < 2; inv++) {
      const issueDate = new Date(year, month0, inv === 0 ? 5 : 22);
      const dueDate   = addDays(issueDate, 30);
      const customer  = pick(bizCusts);

      // 4-6 items
      const itemCount = ri(4, 6);
      const usedIdx   = new Set();
      const selProds  = [];
      while (selProds.length < itemCount) {
        const idx = ri(0, prods.length - 1);
        if (!usedIdx.has(idx)) { usedIdx.add(idx); selProds.push(prods[idx]); }
      }

      let subtotal = 0, taxAmount = 0;
      const items = selProds.map(p => {
        const qty  = ri(10, 50);
        const base = f2(p.sellingPrice * qty);
        const tax  = f2(base * p.gstRate / 100);
        subtotal   += base;
        taxAmount  += tax;
        return { description: p.name, productId: p.id, quantity: qty, unitPrice: p.sellingPrice, discount: 0, taxRate: p.gstRate, taxAmount: tax, total: f2(base + tax) };
      });

      const total      = f2(subtotal + taxAmount);
      const isPaid     = dueDate < NOW;
      const amtPaid    = isPaid ? total : ri(0, 1) ? 0 : f2(total * 0.5);
      const balanceDue = f2(total - amtPaid);
      const status     = isPaid ? 'PAID' : balanceDue === total ? 'SENT' : 'SENT';

      await prisma.invoice.create({
        data: {
          tenantId: TID, customerId: customer.id,
          invoiceNumber: nextInv(),
          status, issueDate, dueDate,
          subtotal: f2(subtotal), taxAmount: f2(taxAmount), total,
          amountPaid: amtPaid, balanceDue,
          notes: 'Monthly credit supply',
          createdAt: issueDate, updatedAt: issueDate,
          items: { create: items },
          ...(amtPaid > 0 ? {
            payments: {
              create: [{
                amount: amtPaid, method: 'BANK_TRANSFER',
                reference: `NEFT${ri(100000, 999999)}`,
                paidAt: addDays(issueDate, ri(5, 28)),
              }],
            },
          } : {}),
        },
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. EXPENSES (96 records — 8/month)
// ─────────────────────────────────────────────────────────────────────────────
async function seedExpenses(TID) {
  for (let m = 0; m < 12; m++) {
    const { year, month0 } = getYearMonth(m);

    const monthly = [
      { cat:'RENT',        desc:'Monthly shop rent — Dharavi Road',          amt:35000, method:'BANK_TRANSFER', day:1  },
      { cat:'UTILITIES',   desc:'Electricity bill — MSEDCL',                 amt:ri(2800,4200), method:'UPI', day:5    },
      { cat:'UTILITIES',   desc:'Water charges and internet bill',            amt:ri(800,1400),  method:'UPI', day:6    },
      { cat:'TRANSPORT',   desc:'Delivery petrol & scooter maintenance',      amt:ri(2500,3500), method:'CASH', day:10  },
      { cat:'SUPPLIES',    desc:'Carry bags, packaging & stationery',         amt:ri(1200,2000), method:'CASH', day:12  },
      { cat:'MARKETING',   desc:'Banner printing & local pamphlets',          amt:ri(1500,3000), method:'CASH', day:15  },
      { cat:'MAINTENANCE', desc:'Shop maintenance & cleaning supplies',       amt:ri(800,1500),  method:'CASH', day:20  },
      { cat:'INSURANCE',   desc:'Shop insurance premium (monthly)',           amt:3500,          method:'BANK_TRANSFER', day:25 },
    ];

    // Quarterly: taxes & insurance adjustments
    if (m % 3 === 0) {
      monthly.push({ cat:'TAXES', desc:'GST filing professional charges', amt:2000, method:'UPI', day:18 });
    }

    for (const e of monthly) {
      const date = new Date(year, month0, e.day);
      await prisma.expense.create({
        data: {
          tenantId: TID, category: e.cat, description: e.desc,
          amount: e.amt, date, method: e.method,
        },
      });
    }

    // One random OTHER expense per month
    const otherDescs = ['Staff meal allowance', 'Miscellaneous repairs', 'Festival decoration', 'Donation', 'Office supplies'];
    await prisma.expense.create({
      data: {
        tenantId: TID, category: 'OTHER',
        description: pick(otherDescs),
        amount: ri(500, 3000), date: new Date(year, month0, ri(1, 28)), method: pick(['CASH','UPI']),
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. PURCHASE ORDERS + VENDOR BILLS (12 POs)
// ─────────────────────────────────────────────────────────────────────────────
async function seedPurchaseOrders(TID, vendors, prods) {
  for (let m = 0; m < 12; m++) {
    const { year, month0 } = getYearMonth(m);
    const orderDate    = new Date(year, month0, ri(1, 10));
    const expectedDate = addDays(orderDate, ri(2, 5));
    const receivedDate = addDays(orderDate, ri(5, 10));
    const vendor       = pick(vendors);

    // 4-8 products in PO
    const itemCount = ri(4, 8);
    const usedIdx   = new Set();
    const selProds  = [];
    while (selProds.length < itemCount) {
      const idx = ri(0, prods.length - 1);
      if (!usedIdx.has(idx)) { usedIdx.add(idx); selProds.push(prods[idx]); }
    }

    let subtotal = 0, taxAmount = 0;
    const items = selProds.map(p => {
      const qty     = ri(20, 100);
      const base    = f2(p.costPrice * qty);
      const taxRate = p.gstRate;
      const tax     = f2(base * taxRate / 100);
      subtotal  += base;
      taxAmount += tax;
      return {
        productId: p.id, description: p.name,
        quantity: qty, unitCost: p.costPrice,
        taxRate, taxAmount: tax, total: f2(base + tax),
        receivedQty: qty,
      };
    });

    const total = f2(subtotal + taxAmount);
    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId: TID, vendorId: vendor.id,
        poNumber: nextPO(), status: 'RECEIVED',
        orderDate, expectedDate, receivedDate,
        subtotal: f2(subtotal), taxAmount: f2(taxAmount), total,
        notes: 'Monthly stock replenishment',
        createdAt: orderDate, updatedAt: receivedDate,
        items: { create: items },
      },
    });

    // Corresponding vendor bill
    const billDate = addDays(orderDate, ri(1, 3));
    const billDue  = addDays(billDate, 30);
    const isPaid   = billDue < new Date();
    const amtPaid  = isPaid ? total : 0;

    await prisma.vendorBill.create({
      data: {
        tenantId: TID, vendorId: vendor.id,
        billNumber: nextBill(), status: isPaid ? 'PAID' : 'PENDING',
        issueDate: billDate, dueDate: billDue,
        subtotal: f2(subtotal), taxAmount: f2(taxAmount), total,
        amountPaid: amtPaid, balanceDue: f2(total - amtPaid),
        notes: `Against PO ${po.poNumber}`,
        createdAt: billDate, updatedAt: billDate,
        items: {
          create: selProds.map((p, idx) => ({
            description: p.name,
            quantity: items[idx].quantity,
            unitPrice: p.costPrice,
            taxRate: p.gstRate,
            taxAmount: items[idx].taxAmount,
            total: items[idx].total,
          })),
        },
        ...(isPaid ? {
          payments: {
            create: [{
              amount: amtPaid, method: 'BANK_TRANSFER',
              reference: `NEFT${ri(100000,999999)}`,
              paidAt: addDays(billDate, ri(5, 28)),
            }],
          },
        } : {}),
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. PAYROLL (12 months × 3 staff)
// ─────────────────────────────────────────────────────────────────────────────
async function seedPayroll(TID, staffs) {
  for (let m = 0; m < 12; m++) {
    const { year, month0, monthNum } = getYearMonth(m);
    const processedAt = new Date(year, month0, 28);
    const paidAt      = new Date(year, month0, 30);

    let totalGross = 0, totalDed = 0, totalNet = 0;
    const entries = staffs.map(s => {
      const basic        = s.salary;
      const hra          = f2(basic * 0.2);
      const allowances   = f2(basic * 0.05);
      const gross        = f2(basic + hra + allowances);
      const pfEmp        = f2(basic * 0.12);
      const pfEmployer   = f2(basic * 0.12);
      const pt           = 200;
      const totalDeduc   = f2(pfEmp + pt);
      const net          = f2(gross - totalDeduc);
      const presentDays  = ri(24, 26);

      totalGross += gross;
      totalDed   += totalDeduc;
      totalNet   += net;

      return {
        staffId: s.id, basicSalary: basic, hra, allowances, grossSalary: gross,
        pfEmployee: pfEmp, pfEmployer, professionalTax: pt, totalDeductions: totalDeduc,
        netSalary: net, workingDays: 26, presentDays,
        status: 'PAID', paidAt,
      };
    });

    await prisma.payrollRun.create({
      data: {
        tenantId: TID, month: monthNum, year,
        status: 'PAID',
        totalGross: f2(totalGross), totalDeductions: f2(totalDed), totalNet: f2(totalNet),
        processedAt, createdAt: processedAt, updatedAt: paidAt,
        entries: { create: entries },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. ATTENDANCE LOGS (~1560 records — 260 working days × 3 staff × 2)
// ─────────────────────────────────────────────────────────────────────────────
async function seedAttendance(TID, staffs) {
  const FY_START = new Date(2025, 3, 1);
  const logs = [];

  for (let day = 0; day < 365; day++) {
    const date = addDays(FY_START, day);
    if (date.getDay() === 0) continue; // Skip Sundays
    if (ri(0, 9) === 0) continue;      // ~10% absent days

    for (const s of staffs) {
      if (ri(0, 9) === 0) continue; // individual absent

      const inHour  = ri(8, 10);
      const inMin   = ri(0, 59);
      const outHour = ri(19, 21);
      const outMin  = ri(0, 59);

      const punchIn  = new Date(date); punchIn.setHours(inHour, inMin, 0);
      const punchOut = new Date(date); punchOut.setHours(outHour, outMin, 0);

      logs.push({ tenantId: TID, staffId: s.id, punchType: 'IN',  punchTime: punchIn,  method: 'MANUAL', createdAt: punchIn  });
      logs.push({ tenantId: TID, staffId: s.id, punchType: 'OUT', punchTime: punchOut, method: 'MANUAL', createdAt: punchOut });
    }
  }

  // Insert in batches of 200
  const CHUNK = 200;
  for (let i = 0; i < logs.length; i += CHUNK) {
    await prisma.attendanceLog.createMany({ data: logs.slice(i, i + CHUNK) });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. CREDIT NOTES (6)
// ─────────────────────────────────────────────────────────────────────────────
async function seedCreditNotes(TID, custs) {
  const defs = [
    { m:1,  day:18, cust:custs[5],  reason:'Damaged goods returned by customer', amt:485 },
    { m:2,  day:10, cust:custs[7],  reason:'Wrong item delivered — return',        amt:320 },
    { m:4,  day:22, cust:custs[0],  reason:'Overcharged on B2B supply',            amt:2150 },
    { m:6,  day:8,  cust:custs[9],  reason:'Quality issue — biscuit packet stale', amt:140 },
    { m:8,  day:15, cust:custs[1],  reason:'Partial credit on hotel bulk order',   amt:3800 },
    { m:10, day:5,  cust:custs[13], reason:'Expired item refund',                  amt:92  },
  ];
  for (const d of defs) {
    const { year, month0 } = getYearMonth(d.m);
    const issueDate = new Date(year, month0, d.day);
    await prisma.creditNote.create({
      data: {
        tenantId: TID, customerId: d.cust.id,
        creditNoteNumber: nextCN(),
        issueDate, total: d.amt,
        reason: d.reason, status: 'ISSUED',
        createdAt: issueDate, updatedAt: issueDate,
        items: {
          create: [{
            description: d.reason.split('—')[0].trim(),
            quantity: 1, unitPrice: d.amt,
            taxRate: 5, taxAmount: f2(d.amt * 5 / 100),
            total: d.amt,
          }],
        },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. QUOTATIONS (5)
// ─────────────────────────────────────────────────────────────────────────────
async function seedQuotations(TID, custs, prods) {
  const defs = [
    { m:0,  day:15, cust:custs[0], status:'CONVERTED', note:'Bulk rice & dal supply for next 3 months' },
    { m:2,  day:20, cust:custs[1], status:'ACCEPTED',  note:'Hotel monthly grocery order' },
    { m:5,  day:10, cust:custs[2], status:'SENT',      note:'Tiffin service monthly supply' },
    { m:8,  day:5,  cust:custs[3], status:'REJECTED',  note:'Bakery ingredients supply' },
    { m:10, day:18, cust:custs[4], status:'DRAFT',     note:'Canteen bulk supply proposal' },
  ];

  for (const d of defs) {
    const { year, month0 } = getYearMonth(d.m);
    const issueDate  = new Date(year, month0, d.day);
    const expiryDate = addDays(issueDate, 30);

    const selProds = [];
    const usedIdx  = new Set();
    while (selProds.length < ri(3, 5)) {
      const idx = ri(0, prods.length - 1);
      if (!usedIdx.has(idx)) { usedIdx.add(idx); selProds.push(prods[idx]); }
    }

    let subtotal = 0, taxAmount = 0;
    const items = selProds.map(p => {
      const qty  = ri(20, 100);
      const base = f2(p.sellingPrice * qty);
      const tax  = f2(base * p.gstRate / 100);
      subtotal  += base;
      taxAmount += tax;
      return { description: p.name, quantity: qty, unitPrice: p.sellingPrice, discount: 0, taxRate: p.gstRate, taxAmount: tax, total: f2(base + tax) };
    });

    await prisma.quotation.create({
      data: {
        tenantId: TID, customerId: d.cust.id,
        quotationNumber: nextQuo(), status: d.status,
        issueDate, expiryDate,
        subtotal: f2(subtotal), taxAmount: f2(taxAmount),
        total: f2(subtotal + taxAmount),
        notes: d.note, terms: 'Payment within 15 days of delivery',
        createdAt: issueDate, updatedAt: issueDate,
        items: { create: items },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. WHATSAPP CAMPAIGNS (3)
// ─────────────────────────────────────────────────────────────────────────────
async function seedCampaigns(TID) {
  const defs = [
    {
      name: 'Diwali 2025 Offer',
      message: '🪔 Diwali Special at Sharma Kirana Store! Get 5% OFF on all items above ₹500. Use code DIWALI25. Shop now! 🛍️',
      segment: 'ALL', status: 'SENT', sentCount: 22, sentAt: new Date(2025, 9, 15),
    },
    {
      name: 'New Year 2026 Greetings',
      message: '🎉 Happy New Year 2026! Sharma Kirana Store wishes you joy and health. Get ₹50 OFF on your first purchase of the year!',
      segment: 'VIP', status: 'SENT', sentCount: 8, sentAt: new Date(2025, 11, 31),
    },
    {
      name: 'Holi 2026 Special',
      message: '🌈 Holi Hai! Get special discounts on snacks & beverages. Shop ₹1000+ and get free home delivery this Holi! 🎊',
      segment: 'ALL', status: 'DRAFT', sentCount: 0, sentAt: null,
    },
  ];

  for (const d of defs) {
    await prisma.whatsAppCampaign.create({
      data: {
        tenantId: TID, name: d.name, message: d.message,
        segment: d.segment, status: d.status,
        sentCount: d.sentCount, failedCount: 0,
        sentAt: d.sentAt,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 18. CUSTOMER SUBSCRIPTIONS (5)
// ─────────────────────────────────────────────────────────────────────────────
async function seedSubscriptions(TID, custs) {
  const defs = [
    { cust: custs[5],  plan:'Silver Monthly', start: new Date(2025,3,1),  expiry: new Date(2026,2,31), amt:199, status:'ACTIVE'   },
    { cust: custs[7],  plan:'Gold Monthly',   start: new Date(2025,4,1),  expiry: new Date(2026,3,30), amt:299, status:'ACTIVE'   },
    { cust: custs[9],  plan:'Silver Monthly', start: new Date(2025,3,15), expiry: new Date(2025,8,14), amt:199, status:'EXPIRED'  },
    { cust: custs[13], plan:'Gold Monthly',   start: new Date(2025,6,1),  expiry: new Date(2026,5,30), amt:299, status:'ACTIVE'   },
    { cust: custs[18], plan:'Silver Monthly', start: new Date(2025,9,1),  expiry: new Date(2026,8,30), amt:199, status:'ACTIVE'   },
  ];
  for (const d of defs) {
    await prisma.customerSubscription.create({
      data: {
        tenantId: TID, customerId: d.cust.id,
        planName: d.plan, startDate: d.start, expiryDate: d.expiry,
        amount: d.amt, status: d.status, autoRenew: d.status === 'ACTIVE',
        notes: 'Loyalty subscription — monthly shopping rewards',
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 19. BANK TRANSACTIONS (monthly summaries)
// ─────────────────────────────────────────────────────────────────────────────
async function seedBankTxns(TID, bankAccounts) {
  const hdfc = bankAccounts.find(b => b.name === 'HDFC Current Account');
  const cash = bankAccounts.find(b => b.name === 'Cash in Hand');
  const icici = bankAccounts.find(b => b.name === 'ICICI Savings Account');

  let hdfcBal = hdfc.openingBalance;
  let cashBal = cash.openingBalance;
  let iciciBal = icici.openingBalance;

  for (let m = 0; m < 12; m++) {
    const { year, month0 } = getYearMonth(m);

    const monthlyRevenue = ri(180000, 260000);
    const cashRevenue    = f2(monthlyRevenue * 0.5);
    const upiRevenue     = f2(monthlyRevenue * 0.35);
    const cardRevenue    = f2(monthlyRevenue * 0.15);
    const vendorPayment  = ri(60000, 100000);
    const rent           = 35000;
    const payrollAmt     = 22000 + 18000 + 14000; // 54000

    // Cash receipts
    await prisma.bankTransaction.create({
      data: {
        accountId: cash.id, type: 'CREDIT',
        amount: cashRevenue, description: `POS cash sales — ${monthName(month0)} ${year}`,
        category: 'SALES', date: new Date(year, month0, 28),
      },
    });
    cashBal += cashRevenue;

    // UPI/card to HDFC
    await prisma.bankTransaction.create({
      data: {
        accountId: hdfc.id, type: 'CREDIT',
        amount: f2(upiRevenue + cardRevenue),
        description: `UPI+Card receipts — ${monthName(month0)} ${year}`,
        category: 'SALES', date: new Date(year, month0, 28),
      },
    });
    hdfcBal += upiRevenue + cardRevenue;

    // Rent from HDFC
    await prisma.bankTransaction.create({
      data: {
        accountId: hdfc.id, type: 'DEBIT',
        amount: rent, description: `Shop rent — ${monthName(month0)} ${year}`,
        category: 'RENT', date: new Date(year, month0, 2),
      },
    });
    hdfcBal -= rent;

    // Vendor payment from HDFC
    await prisma.bankTransaction.create({
      data: {
        accountId: hdfc.id, type: 'DEBIT',
        amount: vendorPayment, description: `Vendor payments — stock purchase`,
        category: 'PURCHASE', date: new Date(year, month0, ri(8, 15)),
      },
    });
    hdfcBal -= vendorPayment;

    // Payroll from HDFC
    await prisma.bankTransaction.create({
      data: {
        accountId: hdfc.id, type: 'DEBIT',
        amount: payrollAmt, description: `Staff payroll — ${monthName(month0)} ${year}`,
        category: 'PAYROLL', date: new Date(year, month0, 30),
      },
    });
    hdfcBal -= payrollAmt;

    // Monthly HDFC to ICICI transfer (savings)
    const savings = ri(10000, 25000);
    await prisma.bankTransaction.create({
      data: {
        accountId: hdfc.id, type: 'DEBIT',
        amount: savings, description: 'Transfer to savings account',
        category: 'TRANSFER', date: new Date(year, month0, 25),
      },
    });
    hdfcBal -= savings;

    await prisma.bankTransaction.create({
      data: {
        accountId: icici.id, type: 'CREDIT',
        amount: savings, description: 'Transfer from current account',
        category: 'TRANSFER', date: new Date(year, month0, 25),
      },
    });
    iciciBal += savings;

    // Loan EMI (₹8,000/month)
    await prisma.bankTransaction.create({
      data: {
        accountId: hdfc.id, type: 'DEBIT',
        amount: 8000, description: 'Business loan EMI — HDFC Bank',
        category: 'LOAN_REPAYMENT', date: new Date(year, month0, 5),
      },
    });
    hdfcBal -= 8000;
  }

  // Update final balances
  await prisma.bankAccount.update({ where: { id: hdfc.id  }, data: { currentBalance: f2(hdfcBal) } });
  await prisma.bankAccount.update({ where: { id: cash.id  }, data: { currentBalance: f2(cashBal) } });
  await prisma.bankAccount.update({ where: { id: icici.id }, data: { currentBalance: f2(iciciBal) } });
}

// ─────────────────────────────────────────────────────────────────────────────
// 20. RECURRING INVOICES (2)
// ─────────────────────────────────────────────────────────────────────────────
async function seedRecurring(TID, custs, prods) {
  const selProds1 = prods.slice(0, 5).map(p => ({ description: p.name, unitPrice: p.sellingPrice, quantity: 20, taxRate: p.gstRate, taxAmount: f2(p.sellingPrice * 20 * p.gstRate / 100), total: f2(p.sellingPrice * 20 * (1 + p.gstRate / 100)) }));
  const selProds2 = prods.slice(5, 9).map(p => ({ description: p.name, unitPrice: p.sellingPrice, quantity: 15, taxRate: p.gstRate, taxAmount: f2(p.sellingPrice * 15 * p.gstRate / 100), total: f2(p.sellingPrice * 15 * (1 + p.gstRate / 100)) }));

  await prisma.recurringInvoice.create({
    data: {
      tenantId: TID, customerId: custs[0].id,
      frequency: 'MONTHLY', isActive: true,
      nextRunDate: new Date(2026, 4, 5),
      lastRunDate: new Date(2026, 3, 5),
      items: selProds1,
      notes: 'Monthly auto-invoice for Raj Provisions',
      terms: 'Payment within 15 days',
    },
  });

  await prisma.recurringInvoice.create({
    data: {
      tenantId: TID, customerId: custs[1].id,
      frequency: 'MONTHLY', isActive: true,
      nextRunDate: new Date(2026, 4, 22),
      lastRunDate: new Date(2026, 3, 22),
      items: selProds2,
      notes: 'Monthly auto-invoice for Hotel Annapurna',
      terms: 'Net 30',
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function getYearMonth(m) {
  // m=0 → April 2025, m=11 → March 2026
  const totalMonth = 3 + m; // 3=April (0-indexed)
  const year       = totalMonth < 12 ? 2025 : 2026;
  const month0     = totalMonth % 12;          // JS Date month (0-indexed)
  const monthNum   = month0 + 1;               // 1-indexed DB month
  return { year, month0, monthNum };
}

function monthName(month0) {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month0];
}

// ─────────────────────────────────────────────────────────────────────────────
main()
  .catch(e => { console.error('\n❌ Seed failed:', e.message, '\n', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
