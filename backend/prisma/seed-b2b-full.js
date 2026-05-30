/**
 * Comprehensive seed for B2B accounts 1–3.
 * Creates tax rates, categories, inventory, customers, invoices, expenses,
 * and cross-tenant business partnerships.
 *
 * Run AFTER seed-b2b.js
 * Usage: node prisma/seed-b2b-full.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TODAY = new Date('2026-05-21');

function daysAgo(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d;
}
function r2(n) { return Math.round(n * 100) / 100; }

// Build a single invoice item row
function item(description, qty, unitPrice, taxRate = 0, disc = 0) {
  const afterDisc = r2(qty * unitPrice * (1 - disc / 100));
  const taxAmount = r2(afterDisc * taxRate / 100);
  return { description, quantity: qty, unitPrice, discount: disc, taxRate, taxAmount, total: r2(afterDisc + taxAmount) };
}

// Compute invoice-level totals from items array
function invoiceTotals(items) {
  const subtotal = r2(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0));
  const discountAmount = r2(items.reduce((s, i) => s + i.quantity * i.unitPrice * i.discount / 100, 0));
  const taxAmount = r2(items.reduce((s, i) => s + i.taxAmount, 0));
  const total = r2(subtotal - discountAmount + taxAmount);
  return { subtotal, discountAmount, taxAmount, total };
}

function gstDetails(taxAmount, isInterState = false) {
  if (isInterState) return { isInterState: true, cgst: 0, sgst: 0, igst: r2(taxAmount) };
  const h = r2(taxAmount / 2);
  return { isInterState: false, cgst: h, sgst: h, igst: 0 };
}

// ─── ENSURE helper: skip if already present ───────────────────────────────────

async function ensureCategory(tenantId, name, opts = {}) {
  const ex = await prisma.category.findFirst({ where: { tenantId, name } });
  if (ex) return ex;
  return prisma.category.create({ data: { tenantId, name, ...opts } });
}

async function ensureTaxRate(tenantId, name, rate, opts = {}) {
  const ex = await prisma.taxRate.findFirst({ where: { tenantId, name } });
  if (ex) return ex;
  return prisma.taxRate.create({ data: { tenantId, name, rate, ...opts } });
}

async function ensureProduct(tenantId, sku, data) {
  const ex = await prisma.product.findFirst({ where: { tenantId, sku } });
  if (ex) return ex;
  return prisma.product.create({ data: { tenantId, sku, ...data } });
}

async function ensureCustomer(tenantId, phone, data) {
  const ex = await prisma.customer.findFirst({ where: { tenantId, phone } });
  if (ex) return ex;
  return prisma.customer.create({ data: { tenantId, phone, ...data } });
}

async function ensureInvoice(tenantId, invoiceNumber, data) {
  const ex = await prisma.invoice.findFirst({ where: { invoiceNumber } });
  if (ex) { console.log(`    ↩  Invoice ${invoiceNumber} already exists`); return ex; }
  return prisma.invoice.create({ data: { tenantId, invoiceNumber, ...data } });
}

async function ensurePartnership(requesterTenantId, supplierTenantId) {
  const ex = await prisma.businessPartnership.findFirst({
    where: { requesterTenantId, supplierTenantId },
  });
  if (ex) return ex;
  return prisma.businessPartnership.create({
    data: {
      requesterTenantId,
      supplierTenantId,
      status: 'ACTIVE',
      message: 'Established business relationship',
      respondedAt: daysAgo(60),
    },
  });
}

// ─── 1. DELHI AGRO WHOLESALERS ────────────────────────────────────────────────

async function seedDelhiAgro(tid) {
  console.log('\n  [Delhi Agro Wholesalers]');

  // Tax rates
  const t0  = await ensureTaxRate(tid, 'Exempt (0%)', 0, { isGst: true, cgst: 0, sgst: 0, igst: 0 });
  const t5  = await ensureTaxRate(tid, 'GST 5%', 5,  { isGst: true, cgst: 2.5, sgst: 2.5, igst: 0 });
  await ensureTaxRate(tid, 'GST 12%', 12, { isGst: true, cgst: 6, sgst: 6, igst: 0 });
  await ensureTaxRate(tid, 'GST 18%', 18, { isGst: true, cgst: 9, sgst: 9, igst: 0 });
  console.log('    ✓ Tax rates');

  // Categories
  const catGrains = await ensureCategory(tid, 'Grains & Cereals');
  const catPulses = await ensureCategory(tid, 'Pulses & Lentils');
  const catOils   = await ensureCategory(tid, 'Edible Oils');
  const catSpices = await ensureCategory(tid, 'Spices & Masalas');
  const catSugar  = await ensureCategory(tid, 'Sugar & Sweeteners');
  console.log('    ✓ Categories');

  // Products
  await ensureProduct(tid, 'AGRO-RICE-01', { name: 'Basmati Rice (Grade A)', unit: 'kg',  costPrice: 72,  sellingPrice: 85,  mrp: 92,   hsnCode: '1006', stock: 2500, lowStockAlert: 200, categoryId: catGrains.id, taxRateId: t0.id, description: 'Premium long-grain basmati, aged 2 years' });
  await ensureProduct(tid, 'AGRO-MOONG-01', { name: 'Yellow Moong Dal',        unit: 'kg',  costPrice: 92,  sellingPrice: 110, mrp: 120,  hsnCode: '0713', stock: 1200, lowStockAlert: 100, categoryId: catPulses.id, taxRateId: t0.id });
  await ensureProduct(tid, 'AGRO-CHANA-01', { name: 'Chana Dal (Split)',       unit: 'kg',  costPrice: 65,  sellingPrice: 78,  mrp: 88,   hsnCode: '0713', stock: 1500, lowStockAlert: 100, categoryId: catPulses.id, taxRateId: t0.id });
  await ensureProduct(tid, 'AGRO-URAD-01',  { name: 'Urad Dal (Whole)',        unit: 'kg',  costPrice: 98,  sellingPrice: 120, mrp: 132,  hsnCode: '0713', stock: 800,  lowStockAlert: 80,  categoryId: catPulses.id, taxRateId: t0.id });
  await ensureProduct(tid, 'AGRO-TOOR-01',  { name: 'Toor Dal (Arhar)',        unit: 'kg',  costPrice: 105, sellingPrice: 128, mrp: 140,  hsnCode: '0713', stock: 1000, lowStockAlert: 80,  categoryId: catPulses.id, taxRateId: t0.id });
  await ensureProduct(tid, 'AGRO-MOIL-01',  { name: 'Mustard Oil (Refined) 1L', unit: 'litre', costPrice: 118, sellingPrice: 140, mrp: 155, hsnCode: '1514', stock: 500,  lowStockAlert: 50,  categoryId: catOils.id, taxRateId: t5.id, description: 'Cold-pressed, double filtered' });
  await ensureProduct(tid, 'AGRO-SOIL-01',  { name: 'Sunflower Oil 1L',        unit: 'litre', costPrice: 125, sellingPrice: 148, mrp: 160, hsnCode: '1512', stock: 600,  lowStockAlert: 60,  categoryId: catOils.id, taxRateId: t5.id });
  await ensureProduct(tid, 'AGRO-SBOIL-01', { name: 'Soybean Oil 1L',          unit: 'litre', costPrice: 115, sellingPrice: 136, mrp: 148, hsnCode: '1507', stock: 700,  lowStockAlert: 60,  categoryId: catOils.id, taxRateId: t5.id });
  await ensureProduct(tid, 'AGRO-TURM-01',  { name: 'Turmeric Powder',         unit: 'kg',  costPrice: 150, sellingPrice: 180, mrp: 200,  hsnCode: '0910', stock: 400,  lowStockAlert: 40,  categoryId: catSpices.id, taxRateId: t5.id });
  await ensureProduct(tid, 'AGRO-CORI-01',  { name: 'Coriander Powder',        unit: 'kg',  costPrice: 78,  sellingPrice: 95,  mrp: 108,  hsnCode: '0909', stock: 500,  lowStockAlert: 50,  categoryId: catSpices.id, taxRateId: t5.id });
  await ensureProduct(tid, 'AGRO-CHIL-01',  { name: 'Red Chilli Powder',       unit: 'kg',  costPrice: 165, sellingPrice: 200, mrp: 225,  hsnCode: '0904', stock: 350,  lowStockAlert: 35,  categoryId: catSpices.id, taxRateId: t5.id });
  await ensureProduct(tid, 'AGRO-JEERA-01', { name: 'Cumin Seeds (Jeera)',     unit: 'kg',  costPrice: 280, sellingPrice: 340, mrp: 380,  hsnCode: '0909', stock: 200,  lowStockAlert: 25,  categoryId: catSpices.id, taxRateId: t5.id });
  await ensureProduct(tid, 'AGRO-SUGAR-01', { name: 'Sugar M30 Grade',         unit: 'kg',  costPrice: 36,  sellingPrice: 42,  mrp: 46,   hsnCode: '1701', stock: 5000, lowStockAlert: 500, categoryId: catSugar.id, taxRateId: t5.id });
  await ensureProduct(tid, 'AGRO-JAGGERY-01', { name: 'Jaggery (Block)',       unit: 'kg',  costPrice: 55,  sellingPrice: 65,  mrp: 72,   hsnCode: '1701', stock: 800,  lowStockAlert: 80,  categoryId: catSugar.id, taxRateId: t5.id });
  await ensureProduct(tid, 'AGRO-MAIDA-01', { name: 'Maida (All Purpose Flour)', unit: 'kg', costPrice: 32,  sellingPrice: 38,  mrp: 42,   hsnCode: '1101', stock: 2000, lowStockAlert: 200, categoryId: catGrains.id, taxRateId: t5.id });
  console.log('    ✓ 15 products');

  // Customers
  const c1 = await ensureCustomer(tid, '9811001001', { name: 'Sharma Kirana Store', email: 'sharma@kirana.in',    gstin: '07AABCS1234B1Z5', address: 'Laxmi Nagar, Delhi' });
  const c2 = await ensureCustomer(tid, '9811002002', { name: 'Rajdhani Caterers',   email: 'rj@rajdhani.co.in',  gstin: '07AAACR5678C1Z3', address: 'Karol Bagh, Delhi' });
  const c3 = await ensureCustomer(tid, '9811003003', { name: 'Spice Garden Restaurant', email: null,             gstin: '07AASSG3456D1Z7', address: 'Connaught Place, Delhi' });
  const c4 = await ensureCustomer(tid, '9811004004', { name: 'Bhatia Brothers General Store', email: null,       gstin: '07AABCB7890E1Z1', address: 'Chandni Chowk, Delhi' });
  const c5 = await ensureCustomer(tid, '9811005005', { name: 'Adarsh Kirana',       email: 'adarsh@kirana.in',   gstin: '07AAAAK4567F1Z9', address: 'Rohini Sector 9, Delhi' });
  const c6 = await ensureCustomer(tid, '9811006006', { name: 'Lucky Kirana Mart',   email: null,                 gstin: null,              address: 'Dwarka Sector 10, Delhi' });
  console.log('    ✓ 6 customers');

  // Invoices
  const invDefs = [
    {
      invoiceNumber: 'DAGRO/2526/001',
      customerId: c1.id, issueDate: daysAgo(75), dueDate: daysAgo(45), status: 'PAID',
      items: [
        item('Basmati Rice (Grade A)', 200, 85, 0),
        item('Yellow Moong Dal',       100, 110, 0),
      ],
    },
    {
      invoiceNumber: 'DAGRO/2526/002',
      customerId: c2.id, issueDate: daysAgo(60), dueDate: daysAgo(30), status: 'PAID',
      items: [
        item('Mustard Oil (Refined) 1L', 50, 140, 5),
        item('Turmeric Powder',          20, 180, 5),
        item('Coriander Powder',         30, 95,  5),
      ],
    },
    {
      invoiceNumber: 'DAGRO/2526/003',
      customerId: c3.id, issueDate: daysAgo(45), dueDate: daysAgo(15), status: 'PAID',
      items: [
        item('Sunflower Oil 1L',   30,  148, 5),
        item('Red Chilli Powder',  15,  200, 5),
        item('Cumin Seeds (Jeera)', 10, 340, 5),
        item('Sugar M30 Grade',   200,   42, 5),
      ],
    },
    {
      invoiceNumber: 'DAGRO/2526/004',
      customerId: c4.id, issueDate: daysAgo(30), dueDate: daysFromNow(15), status: 'SENT',
      items: [
        item('Basmati Rice (Grade A)', 500, 85,  0),
        item('Toor Dal (Arhar)',       100, 128, 0),
        item('Chana Dal (Split)',      200, 78,  0),
        item('Sugar M30 Grade',       500, 42,  5),
      ],
    },
    {
      invoiceNumber: 'DAGRO/2526/005',
      customerId: c5.id, issueDate: daysAgo(25), dueDate: daysAgo(5), status: 'PAID',
      items: [
        item('Yellow Moong Dal',    150, 110, 0),
        item('Urad Dal (Whole)',     80, 120, 0),
        item('Turmeric Powder',     10,  180, 5),
        item('Mustard Oil (Refined) 1L', 25, 140, 5),
      ],
    },
    {
      invoiceNumber: 'DAGRO/2526/006',
      customerId: c6.id, issueDate: daysAgo(15), dueDate: daysAgo(7), status: 'OVERDUE',
      items: [
        item('Maida (All Purpose Flour)', 100, 38, 5),
        item('Sugar M30 Grade',          200, 42, 5),
        item('Jaggery (Block)',            50, 65, 5),
      ],
    },
    {
      invoiceNumber: 'DAGRO/2526/007',
      customerId: c1.id, issueDate: daysAgo(10), dueDate: daysFromNow(20), status: 'SENT',
      items: [
        item('Basmati Rice (Grade A)', 300, 85,  0),
        item('Chana Dal (Split)',       150, 78,  0),
        item('Soybean Oil 1L',          20, 136, 5),
      ],
    },
    {
      invoiceNumber: 'DAGRO/2526/008',
      customerId: c2.id, issueDate: daysAgo(5), dueDate: daysFromNow(25), status: 'DRAFT',
      items: [
        item('Turmeric Powder',  30, 180, 5),
        item('Coriander Powder', 40, 95,  5),
        item('Red Chilli Powder', 25, 200, 5),
      ],
    },
  ];

  for (const def of invDefs) {
    const { items: defItems, customerId, issueDate, dueDate, status } = def;
    const { subtotal, discountAmount, taxAmount, total } = invoiceTotals(defItems);
    const isPaid = status === 'PAID';
    const inv = await ensureInvoice(tid, def.invoiceNumber, {
      customerId, issueDate, dueDate, status,
      subtotal, discountAmount, taxAmount, total,
      amountPaid: isPaid ? total : 0,
      balanceDue: isPaid ? 0 : total,
      gstDetails: gstDetails(taxAmount),
      items: { create: defItems },
    });
    if (isPaid && inv) {
      const existingPmt = await prisma.payment.findFirst({ where: { invoiceId: inv.id } });
      if (!existingPmt) {
        await prisma.payment.create({
          data: { invoiceId: inv.id, amount: total, method: def.invoiceNumber.endsWith('001') ? 'CASH' : def.invoiceNumber.endsWith('002') ? 'UPI' : 'BANK_TRANSFER', paidAt: dueDate },
        });
      }
    }
  }
  console.log('    ✓ 8 invoices');

  // Expenses — 3 months of operational costs
  const expCount = await prisma.expense.count({ where: { tenantId: tid } });
  if (expCount === 0) {
    const expRows = [
      // March 2026
      { category: 'RENT',       description: 'Warehouse rent — Azadpur Mandi, March 2026', amount: 45000, date: new Date('2026-03-01'), method: 'BANK_TRANSFER' },
      { category: 'UTILITIES',  description: 'Electricity & water, March 2026',            amount: 8200,  date: new Date('2026-03-05'), method: 'UPI' },
      { category: 'SALARIES',   description: 'Staff salaries, March 2026',                  amount: 61500, date: new Date('2026-03-31'), method: 'BANK_TRANSFER' },
      { category: 'TRANSPORT',  description: 'Delivery vehicles & freight, March 2026',    amount: 14200, date: new Date('2026-03-20'), method: 'CASH' },
      { category: 'SUPPLIES',   description: 'Packaging material & jute bags',             amount: 5800,  date: new Date('2026-03-15'), method: 'CASH' },
      // April 2026
      { category: 'RENT',       description: 'Warehouse rent — Azadpur Mandi, April 2026', amount: 45000, date: new Date('2026-04-01'), method: 'BANK_TRANSFER' },
      { category: 'UTILITIES',  description: 'Electricity & water, April 2026',             amount: 9100,  date: new Date('2026-04-05'), method: 'UPI' },
      { category: 'SALARIES',   description: 'Staff salaries, April 2026',                  amount: 61500, date: new Date('2026-04-30'), method: 'BANK_TRANSFER' },
      { category: 'TRANSPORT',  description: 'Delivery vehicles & freight, April 2026',    amount: 16500, date: new Date('2026-04-18'), method: 'CASH' },
      { category: 'MAINTENANCE',description: 'Cold storage unit maintenance',               amount: 3200,  date: new Date('2026-04-10'), method: 'CASH' },
      // May 2026
      { category: 'RENT',       description: 'Warehouse rent — Azadpur Mandi, May 2026',   amount: 45000, date: new Date('2026-05-01'), method: 'BANK_TRANSFER' },
      { category: 'UTILITIES',  description: 'Electricity & water, May 2026',               amount: 11500, date: new Date('2026-05-05'), method: 'UPI' },
      { category: 'SALARIES',   description: 'Staff salaries (advance), May 2026',          amount: 30000, date: new Date('2026-05-15'), method: 'BANK_TRANSFER' },
      { category: 'TRANSPORT',  description: 'Freight charges, May 2026',                  amount: 8800,  date: new Date('2026-05-10'), method: 'CASH' },
    ];
    for (const e of expRows) {
      await prisma.expense.create({ data: { tenantId: tid, ...e } });
    }
    console.log('    ✓ 14 expense entries');
  } else {
    console.log('    ↩  Expenses already seeded');
  }
}

// ─── 2. PHARMAFIRST DISTRIBUTORS ─────────────────────────────────────────────

async function seedPharmaFirst(tid) {
  console.log('\n  [PharmaFirst Distributors]');

  const t12 = await ensureTaxRate(tid, 'GST 12%', 12, { isGst: true, cgst: 6, sgst: 6, igst: 0 });
  const t18 = await ensureTaxRate(tid, 'GST 18%', 18, { isGst: true, cgst: 9, sgst: 9, igst: 0 });
  await ensureTaxRate(tid, 'Exempt (0%)', 0, { isGst: true, cgst: 0, sgst: 0, igst: 0 });
  console.log('    ✓ Tax rates');

  const catOtc  = await ensureCategory(tid, 'OTC Medicines');
  const catRx   = await ensureCategory(tid, 'Prescription Drugs');
  const catSupp = await ensureCategory(tid, 'Health Supplements');
  const catSurg = await ensureCategory(tid, 'Surgical & Hygiene');
  const catWound = await ensureCategory(tid, 'Wound Care');
  await ensureCategory(tid, 'Medical Devices');
  console.log('    ✓ Categories');

  await ensureProduct(tid, 'PF-PARA-01',   { name: 'Paracetamol 500mg Strip/10',     unit: 'strip',  costPrice: 11,   sellingPrice: 14.50, mrp: 18,   hsnCode: '3004', stock: 5000, lowStockAlert: 500, categoryId: catOtc.id,   taxRateId: t12.id, description: 'Generic, WHO-GMP certified' });
  await ensureProduct(tid, 'PF-CETI-01',   { name: 'Cetirizine 10mg Strip/10',       unit: 'strip',  costPrice: 14,   sellingPrice: 18,    mrp: 22,   hsnCode: '3004', stock: 3000, lowStockAlert: 300, categoryId: catOtc.id,   taxRateId: t12.id });
  await ensureProduct(tid, 'PF-IBUP-01',   { name: 'Ibuprofen 400mg Strip/10',       unit: 'strip',  costPrice: 16,   sellingPrice: 20,    mrp: 24,   hsnCode: '3004', stock: 3000, lowStockAlert: 300, categoryId: catOtc.id,   taxRateId: t12.id });
  await ensureProduct(tid, 'PF-ORS-01',    { name: 'ORS Sachets Box/20',             unit: 'box',    costPrice: 38,   sellingPrice: 48,    mrp: 55,   hsnCode: '3004', stock: 1500, lowStockAlert: 150, categoryId: catOtc.id,   taxRateId: t12.id });
  await ensureProduct(tid, 'PF-AZITH-01',  { name: 'Azithromycin 500mg Strip/3',     unit: 'strip',  costPrice: 72,   sellingPrice: 88,    mrp: 105,  hsnCode: '3004', stock: 1200, lowStockAlert: 120, categoryId: catRx.id,    taxRateId: t12.id });
  await ensureProduct(tid, 'PF-VITC-01',   { name: 'Vitamin C 500mg Effervescent 10s', unit: 'tube', costPrice: 52,   sellingPrice: 65,    mrp: 80,   hsnCode: '2936', stock: 2000, lowStockAlert: 200, categoryId: catSupp.id,  taxRateId: t12.id });
  await ensureProduct(tid, 'PF-CALC-01',   { name: 'Calcium + D3 Strip/10',          unit: 'strip',  costPrice: 45,   sellingPrice: 58,    mrp: 70,   hsnCode: '2936', stock: 2500, lowStockAlert: 250, categoryId: catSupp.id,  taxRateId: t12.id });
  await ensureProduct(tid, 'PF-BCOM-01',   { name: 'B-Complex Strip/10',             unit: 'strip',  costPrice: 22,   sellingPrice: 28,    mrp: 35,   hsnCode: '2936', stock: 3000, lowStockAlert: 300, categoryId: catSupp.id,  taxRateId: t12.id });
  await ensureProduct(tid, 'PF-ANTI-01',   { name: 'Antiseptic Liquid 500ml',        unit: 'bottle', costPrice: 68,   sellingPrice: 85,    mrp: 98,   hsnCode: '3808', stock: 1000, lowStockAlert: 100, categoryId: catSurg.id,  taxRateId: t18.id });
  await ensureProduct(tid, 'PF-GLOVE-01',  { name: 'Surgical Gloves Box/100',        unit: 'box',    costPrice: 260,  sellingPrice: 320,   mrp: 375,  hsnCode: '4015', stock: 500,  lowStockAlert: 50,  categoryId: catSurg.id,  taxRateId: t12.id });
  await ensureProduct(tid, 'PF-SYR-01',    { name: 'Disposable Syringes 5ml Box/100', unit: 'box',   costPrice: 145,  sellingPrice: 185,   mrp: 220,  hsnCode: '9018', stock: 400,  lowStockAlert: 40,  categoryId: catSurg.id,  taxRateId: t12.id });
  await ensureProduct(tid, 'PF-SANI-01',   { name: 'Hand Sanitizer 500ml',           unit: 'bottle', costPrice: 75,   sellingPrice: 95,    mrp: 110,  hsnCode: '3808', stock: 800,  lowStockAlert: 80,  categoryId: catSurg.id,  taxRateId: t18.id });
  await ensureProduct(tid, 'PF-GAUZE-01',  { name: 'Gauze Bandage 10cm×4m',          unit: 'roll',   costPrice: 17,   sellingPrice: 22,    mrp: 28,   hsnCode: '3005', stock: 2000, lowStockAlert: 200, categoryId: catWound.id, taxRateId: t12.id });
  await ensureProduct(tid, 'PF-BANDAGE-01',{ name: 'Adhesive Bandage Box/100',       unit: 'box',    costPrice: 85,   sellingPrice: 110,   mrp: 130,  hsnCode: '3005', stock: 600,  lowStockAlert: 60,  categoryId: catWound.id, taxRateId: t12.id });
  await ensureProduct(tid, 'PF-THERM-01',  { name: 'Digital Thermometer',            unit: 'pcs',    costPrice: 180,  sellingPrice: 220,   mrp: 260,  hsnCode: '9025', stock: 300,  lowStockAlert: 30,  categoryId: catSurg.id,  taxRateId: t12.id });
  console.log('    ✓ 15 products');

  const c1 = await ensureCustomer(tid, '9820001001', { name: 'HealthCare Plus Clinic',   email: 'purchase@healthcareplus.in', gstin: '27AACHP2345A1Z6', address: 'Borivali West, Mumbai' });
  const c2 = await ensureCustomer(tid, '9820002002', { name: 'MedCare Pharmacy',         email: 'medcare@pharmacy.in',        gstin: '27AACMP6789B1Z2', address: 'Dadar, Mumbai' });
  const c3 = await ensureCustomer(tid, '9820003003', { name: 'City Medical Store',       email: null,                         gstin: '27AACCM1234C1Z4', address: 'Thane West, Mumbai' });
  const c4 = await ensureCustomer(tid, '9820004004', { name: 'Apex Diagnostics',         email: 'apex@diagnostics.in',        gstin: '27AAAPA4567D1Z8', address: 'Andheri East, Mumbai' });
  const c5 = await ensureCustomer(tid, '9820005005', { name: 'Sunrise Healthcare',       email: null,                         gstin: '27AAASH7890E1Z3', address: 'Navi Mumbai' });
  const c6 = await ensureCustomer(tid, '9820006006', { name: 'Walk-in Chemist Purchase', email: null,                         gstin: null,              address: 'Mumbai' });
  console.log('    ✓ 6 customers');

  const invDefs = [
    {
      invoiceNumber: 'PFRST/2526/001',
      customerId: c1.id, issueDate: daysAgo(80), dueDate: daysAgo(50), status: 'PAID',
      items: [
        item('Paracetamol 500mg Strip/10',       500, 14.50, 12),
        item('Cetirizine 10mg Strip/10',          300, 18,    12),
        item('Gauze Bandage 10cm×4m',             200, 22,    12),
        item('Surgical Gloves Box/100',            20, 320,   12),
      ],
    },
    {
      invoiceNumber: 'PFRST/2526/002',
      customerId: c2.id, issueDate: daysAgo(65), dueDate: daysAgo(35), status: 'PAID',
      items: [
        item('Vitamin C 500mg Effervescent 10s',  200, 65,  12),
        item('Calcium + D3 Strip/10',              150, 58,  12),
        item('B-Complex Strip/10',                 300, 28,  12),
        item('Hand Sanitizer 500ml',               50,  95,  18),
      ],
    },
    {
      invoiceNumber: 'PFRST/2526/003',
      customerId: c3.id, issueDate: daysAgo(50), dueDate: daysAgo(20), status: 'PAID',
      items: [
        item('Paracetamol 500mg Strip/10',  400, 14.50, 12),
        item('Ibuprofen 400mg Strip/10',    400, 20,    12),
        item('ORS Sachets Box/20',           80, 48,    12),
        item('Adhesive Bandage Box/100',     30, 110,   12),
      ],
    },
    {
      invoiceNumber: 'PFRST/2526/004',
      customerId: c4.id, issueDate: daysAgo(35), dueDate: daysFromNow(10), status: 'SENT',
      items: [
        item('Antiseptic Liquid 500ml',      60, 85,  18),
        item('Disposable Syringes 5ml Box/100', 20, 185, 12),
        item('Surgical Gloves Box/100',       30, 320, 12),
        item('Digital Thermometer',           20, 220, 12),
      ],
    },
    {
      invoiceNumber: 'PFRST/2526/005',
      customerId: c5.id, issueDate: daysAgo(28), dueDate: daysAgo(8), status: 'PAID',
      items: [
        item('Azithromycin 500mg Strip/3',   100, 88,  12),
        item('Cetirizine 10mg Strip/10',     200, 18,  12),
        item('Vitamin C 500mg Effervescent 10s', 100, 65, 12),
      ],
    },
    {
      invoiceNumber: 'PFRST/2526/006',
      customerId: c6.id, issueDate: daysAgo(18), dueDate: daysAgo(3), status: 'OVERDUE',
      items: [
        item('Paracetamol 500mg Strip/10', 200, 14.50, 12),
        item('ORS Sachets Box/20',          40, 48,    12),
        item('Hand Sanitizer 500ml',        24, 95,    18),
      ],
    },
    {
      invoiceNumber: 'PFRST/2526/007',
      customerId: c1.id, issueDate: daysAgo(12), dueDate: daysFromNow(18), status: 'SENT',
      items: [
        item('Surgical Gloves Box/100',  50, 320, 12),
        item('Antiseptic Liquid 500ml', 48, 85,  18),
        item('Gauze Bandage 10cm×4m',  300, 22,  12),
        item('Adhesive Bandage Box/100', 25, 110, 12),
      ],
    },
    {
      invoiceNumber: 'PFRST/2526/008',
      customerId: c2.id, issueDate: daysAgo(4), dueDate: daysFromNow(26), status: 'DRAFT',
      items: [
        item('Calcium + D3 Strip/10', 200, 58, 12),
        item('B-Complex Strip/10',    300, 28, 12),
        item('Digital Thermometer',    15, 220, 12),
      ],
    },
  ];

  for (const def of invDefs) {
    const { items: defItems, customerId, issueDate, dueDate, status } = def;
    const { subtotal, discountAmount, taxAmount, total } = invoiceTotals(defItems);
    const isPaid = status === 'PAID';
    const inv = await ensureInvoice(tid, def.invoiceNumber, {
      customerId, issueDate, dueDate, status,
      subtotal, discountAmount, taxAmount, total,
      amountPaid: isPaid ? total : 0,
      balanceDue: isPaid ? 0 : total,
      gstDetails: gstDetails(taxAmount),
      items: { create: defItems },
    });
    if (isPaid && inv) {
      const existingPmt = await prisma.payment.findFirst({ where: { invoiceId: inv.id } });
      if (!existingPmt) {
        await prisma.payment.create({
          data: { invoiceId: inv.id, amount: total, method: 'UPI', paidAt: dueDate },
        });
      }
    }
  }
  console.log('    ✓ 8 invoices');

  const expCount = await prisma.expense.count({ where: { tenantId: tid } });
  if (expCount === 0) {
    const expRows = [
      { category: 'RENT',        description: 'Office + cold storage rent, March 2026',    amount: 35000, date: new Date('2026-03-01'), method: 'BANK_TRANSFER' },
      { category: 'UTILITIES',   description: 'Electricity & cold chain, March 2026',       amount: 6500,  date: new Date('2026-03-05'), method: 'UPI' },
      { category: 'SALARIES',    description: 'Staff salaries, March 2026',                  amount: 76000, date: new Date('2026-03-31'), method: 'BANK_TRANSFER' },
      { category: 'TRANSPORT',   description: 'Delivery & last-mile logistics, March 2026', amount: 15200, date: new Date('2026-03-20'), method: 'CASH' },
      { category: 'OTHER',       description: 'Drug license renewal fee',                   amount: 8000,  date: new Date('2026-03-10'), method: 'BANK_TRANSFER' },
      { category: 'RENT',        description: 'Office + cold storage rent, April 2026',     amount: 35000, date: new Date('2026-04-01'), method: 'BANK_TRANSFER' },
      { category: 'UTILITIES',   description: 'Electricity & cold chain, April 2026',        amount: 7200,  date: new Date('2026-04-05'), method: 'UPI' },
      { category: 'SALARIES',    description: 'Staff salaries, April 2026',                  amount: 76000, date: new Date('2026-04-30'), method: 'BANK_TRANSFER' },
      { category: 'TRANSPORT',   description: 'Delivery & last-mile logistics, April 2026', amount: 16800, date: new Date('2026-04-18'), method: 'CASH' },
      { category: 'INSURANCE',   description: 'Goods in transit insurance, Q1',             amount: 12000, date: new Date('2026-04-01'), method: 'BANK_TRANSFER' },
      { category: 'RENT',        description: 'Office + cold storage rent, May 2026',        amount: 35000, date: new Date('2026-05-01'), method: 'BANK_TRANSFER' },
      { category: 'UTILITIES',   description: 'Electricity & cold chain, May 2026',          amount: 7800,  date: new Date('2026-05-05'), method: 'UPI' },
      { category: 'SALARIES',    description: 'Staff salaries (advance), May 2026',          amount: 38000, date: new Date('2026-05-15'), method: 'BANK_TRANSFER' },
    ];
    for (const e of expRows) {
      await prisma.expense.create({ data: { tenantId: tid, ...e } });
    }
    console.log('    ✓ 13 expense entries');
  } else {
    console.log('    ↩  Expenses already seeded');
  }
}

// ─── 3. TECHPARTS SUPPLIERS ───────────────────────────────────────────────────

async function seedTechParts(tid) {
  console.log('\n  [TechParts Suppliers]');

  const t18 = await ensureTaxRate(tid, 'GST 18%', 18, { isGst: true, cgst: 9, sgst: 9, igst: 0 });
  const t28 = await ensureTaxRate(tid, 'GST 28%', 28, { isGst: true, cgst: 14, sgst: 14, igst: 0 });
  await ensureTaxRate(tid, 'GST 12%', 12, { isGst: true, cgst: 6, sgst: 6, igst: 0 });
  console.log('    ✓ Tax rates');

  const catCables  = await ensureCategory(tid, 'Cables & Connectors');
  const catAcc     = await ensureCategory(tid, 'Mobile Accessories');
  const catScreen  = await ensureCategory(tid, 'Screen Protection');
  const catAudio   = await ensureCategory(tid, 'Audio Devices');
  const catCharge  = await ensureCategory(tid, 'Charging Solutions');
  const catSec     = await ensureCategory(tid, 'Security & Surveillance');
  await ensureCategory(tid, 'Networking');
  console.log('    ✓ Categories');

  await ensureProduct(tid, 'TP-USBC-01',  { name: 'USB Type-C Cable 1m (Bulk)',         unit: 'pcs',  costPrice: 32,  sellingPrice: 45,   mrp: 55,   hsnCode: '8544', stock: 3000, lowStockAlert: 300, categoryId: catCables.id, taxRateId: t18.id, description: '3A fast charge, braided nylon' });
  await ensureProduct(tid, 'TP-MUSB-01',  { name: 'Micro USB Cable 1m (Bulk)',           unit: 'pcs',  costPrice: 22,  sellingPrice: 32,   mrp: 40,   hsnCode: '8544', stock: 2500, lowStockAlert: 250, categoryId: catCables.id, taxRateId: t18.id });
  await ensureProduct(tid, 'TP-HDMI-01',  { name: 'HDMI Cable 2m (4K)',                  unit: 'pcs',  costPrice: 65,  sellingPrice: 95,   mrp: 120,  hsnCode: '8544', stock: 1000, lowStockAlert: 100, categoryId: catCables.id, taxRateId: t18.id });
  await ensureProduct(tid, 'TP-OTG-01',   { name: 'OTG Adapter Type-C',                  unit: 'pcs',  costPrice: 18,  sellingPrice: 28,   mrp: 35,   hsnCode: '8544', stock: 2000, lowStockAlert: 200, categoryId: catCables.id, taxRateId: t18.id });
  await ensureProduct(tid, 'TP-COVER-01', { name: 'Mobile Back Cover Universal 6.5"',   unit: 'pcs',  costPrice: 20,  sellingPrice: 28,   mrp: 35,   hsnCode: '3926', stock: 5000, lowStockAlert: 500, categoryId: catAcc.id,    taxRateId: t18.id });
  await ensureProduct(tid, 'TP-HOLD-01',  { name: 'Car Phone Holder (Universal)',        unit: 'pcs',  costPrice: 55,  sellingPrice: 85,   mrp: 110,  hsnCode: '8714', stock: 1000, lowStockAlert: 100, categoryId: catAcc.id,    taxRateId: t18.id });
  await ensureProduct(tid, 'TP-CLEAN-01', { name: 'Screen Cleaning Kit',                 unit: 'pcs',  costPrice: 35,  sellingPrice: 55,   mrp: 70,   hsnCode: '3405', stock: 800,  lowStockAlert: 80,  categoryId: catAcc.id,    taxRateId: t18.id });
  await ensureProduct(tid, 'TP-TG-01',    { name: 'Tempered Glass 6.5" Pack/50',         unit: 'pack', costPrice: 280, sellingPrice: 380,  mrp: 450,  hsnCode: '7007', stock: 800,  lowStockAlert: 80,  categoryId: catScreen.id, taxRateId: t18.id, description: '9H hardness, full coverage' });
  await ensureProduct(tid, 'TP-EAR-01',   { name: 'Earphones with Mic (Wired)',          unit: 'pcs',  costPrice: 85,  sellingPrice: 120,  mrp: 149,  hsnCode: '8518', stock: 1500, lowStockAlert: 150, categoryId: catAudio.id,  taxRateId: t18.id });
  await ensureProduct(tid, 'TP-BT-01',    { name: 'Bluetooth Earbuds (Budget)',           unit: 'pcs',  costPrice: 320, sellingPrice: 450,  mrp: 599,  hsnCode: '8518', stock: 500,  lowStockAlert: 50,  categoryId: catAudio.id,  taxRateId: t18.id });
  await ensureProduct(tid, 'TP-PB-01',    { name: 'Power Bank 10000mAh',                 unit: 'pcs',  costPrice: 520, sellingPrice: 680,  mrp: 849,  hsnCode: '8507', stock: 300,  lowStockAlert: 30,  categoryId: catCharge.id, taxRateId: t28.id, description: 'Dual USB output, micro+type-c input' });
  await ensureProduct(tid, 'TP-CH18-01',  { name: '18W Fast Charger Adapter',            unit: 'pcs',  costPrice: 130, sellingPrice: 175,  mrp: 220,  hsnCode: '8504', stock: 1200, lowStockAlert: 120, categoryId: catCharge.id, taxRateId: t18.id });
  await ensureProduct(tid, 'TP-GAN-01',   { name: '65W GaN Charger (Type-C)',            unit: 'pcs',  costPrice: 380, sellingPrice: 520,  mrp: 649,  hsnCode: '8504', stock: 400,  lowStockAlert: 40,  categoryId: catCharge.id, taxRateId: t18.id });
  await ensureProduct(tid, 'TP-CCTV-01',  { name: 'CCTV Camera 2MP Dome (Night Vision)', unit: 'pcs',  costPrice: 900, sellingPrice: 1200, mrp: 1499, hsnCode: '8525', stock: 150,  lowStockAlert: 15,  categoryId: catSec.id,    taxRateId: t18.id, description: 'Night vision, indoor, plug & play' });
  await ensureProduct(tid, 'TP-WIFI-01',  { name: 'WiFi Router TP-Link 300Mbps',         unit: 'pcs',  costPrice: 780, sellingPrice: 999,  mrp: 1249, hsnCode: '8517', stock: 100,  lowStockAlert: 15,  categoryId: catSec.id,    taxRateId: t18.id });
  console.log('    ✓ 15 products');

  const c1 = await ensureCustomer(tid, '9900001001', { name: 'Ramesh Electronics',       email: 'ramesh@electronics.in',   gstin: '29AAACR5678A1Z4', address: 'Marathahalli, Bengaluru' });
  const c2 = await ensureCustomer(tid, '9900002002', { name: 'AutoFix Workshop',         email: 'autofix@workshop.in',     gstin: '29AAAAW1234B1Z6', address: 'Koramangala, Bengaluru' });
  const c3 = await ensureCustomer(tid, '9900003003', { name: 'MobileZone Store',         email: 'info@mobilezone.in',      gstin: '29AAACM3456C1Z8', address: 'Indiranagar, Bengaluru' });
  const c4 = await ensureCustomer(tid, '9900004004', { name: 'Digital Hub Bengaluru',    email: null,                      gstin: '29AAADH7890D1Z2', address: 'Whitefield, Bengaluru' });
  const c5 = await ensureCustomer(tid, '9900005005', { name: 'TechStar Distributors',    email: 'ts@techstar.in',          gstin: '29AAACT2345E1Z5', address: 'Electronic City, Bengaluru' });
  const c6 = await ensureCustomer(tid, '9900006006', { name: 'Cash Purchase',            email: null,                      gstin: null,              address: 'Bengaluru' });
  console.log('    ✓ 6 customers');

  const invDefs = [
    {
      invoiceNumber: 'TPART/2526/001',
      customerId: c1.id, issueDate: daysAgo(85), dueDate: daysAgo(55), status: 'PAID',
      items: [
        item('USB Type-C Cable 1m (Bulk)',    500, 45,  18),
        item('Mobile Back Cover Universal 6.5"', 500, 28, 18),
        item('Tempered Glass 6.5" Pack/50',   20, 380, 18),
      ],
    },
    {
      invoiceNumber: 'TPART/2526/002',
      customerId: c2.id, issueDate: daysAgo(70), dueDate: daysAgo(40), status: 'PAID',
      items: [
        item('HDMI Cable 2m (4K)',         100, 95,  18),
        item('18W Fast Charger Adapter',   100, 175, 18),
        item('CCTV Camera 2MP Dome (Night Vision)', 10, 1200, 18),
        item('WiFi Router TP-Link 300Mbps', 10, 999, 18),
      ],
    },
    {
      invoiceNumber: 'TPART/2526/003',
      customerId: c3.id, issueDate: daysAgo(55), dueDate: daysAgo(25), status: 'PAID',
      items: [
        item('Earphones with Mic (Wired)',     200, 120, 18),
        item('Bluetooth Earbuds (Budget)',      50, 450, 18),
        item('Power Bank 10000mAh',             30, 680, 28),
      ],
    },
    {
      invoiceNumber: 'TPART/2526/004',
      customerId: c4.id, issueDate: daysAgo(40), dueDate: daysFromNow(5), status: 'SENT',
      items: [
        item('65W GaN Charger (Type-C)',        50, 520, 18),
        item('18W Fast Charger Adapter',       100, 175, 18),
        item('Micro USB Cable 1m (Bulk)',      300, 32,  18),
        item('OTG Adapter Type-C',             200, 28,  18),
      ],
    },
    {
      invoiceNumber: 'TPART/2526/005',
      customerId: c5.id, issueDate: daysAgo(30), dueDate: daysAgo(10), status: 'PAID',
      items: [
        item('USB Type-C Cable 1m (Bulk)',     1000, 45, 18),
        item('Mobile Back Cover Universal 6.5"', 1000, 28, 18),
        item('Tempered Glass 6.5" Pack/50',      30, 380, 18),
      ],
    },
    {
      invoiceNumber: 'TPART/2526/006',
      customerId: c6.id, issueDate: daysAgo(20), dueDate: daysAgo(5), status: 'OVERDUE',
      items: [
        item('Screen Cleaning Kit',   50, 55,  18),
        item('Car Phone Holder (Universal)', 50, 85, 18),
        item('Earphones with Mic (Wired)',   50, 120, 18),
      ],
    },
    {
      invoiceNumber: 'TPART/2526/007',
      customerId: c1.id, issueDate: daysAgo(10), dueDate: daysFromNow(20), status: 'SENT',
      items: [
        item('CCTV Camera 2MP Dome (Night Vision)', 20, 1200, 18),
        item('WiFi Router TP-Link 300Mbps',          15, 999,  18),
        item('HDMI Cable 2m (4K)',                   50, 95,   18),
      ],
    },
    {
      invoiceNumber: 'TPART/2526/008',
      customerId: c2.id, issueDate: daysAgo(3), dueDate: daysFromNow(27), status: 'DRAFT',
      items: [
        item('18W Fast Charger Adapter', 50, 175, 18),
        item('USB Type-C Cable 1m (Bulk)', 100, 45, 18),
        item('OTG Adapter Type-C',        100, 28, 18),
      ],
    },
  ];

  for (const def of invDefs) {
    const { items: defItems, customerId, issueDate, dueDate, status } = def;
    const { subtotal, discountAmount, taxAmount, total } = invoiceTotals(defItems);
    const isPaid = status === 'PAID';
    const inv = await ensureInvoice(tid, def.invoiceNumber, {
      customerId, issueDate, dueDate, status,
      subtotal, discountAmount, taxAmount, total,
      amountPaid: isPaid ? total : 0,
      balanceDue: isPaid ? 0 : total,
      gstDetails: gstDetails(taxAmount),
      items: { create: defItems },
    });
    if (isPaid && inv) {
      const existingPmt = await prisma.payment.findFirst({ where: { invoiceId: inv.id } });
      if (!existingPmt) {
        await prisma.payment.create({
          data: { invoiceId: inv.id, amount: total, method: 'UPI', paidAt: dueDate },
        });
      }
    }
  }
  console.log('    ✓ 8 invoices');

  const expCount = await prisma.expense.count({ where: { tenantId: tid } });
  if (expCount === 0) {
    const expRows = [
      { category: 'RENT',       description: 'Warehouse rent — Electronics City, March 2026',  amount: 40000, date: new Date('2026-03-01'), method: 'BANK_TRANSFER' },
      { category: 'UTILITIES',  description: 'Electricity & internet, March 2026',              amount: 7500,  date: new Date('2026-03-05'), method: 'UPI' },
      { category: 'SALARIES',   description: 'Staff salaries, March 2026',                      amount: 82000, date: new Date('2026-03-31'), method: 'BANK_TRANSFER' },
      { category: 'TRANSPORT',  description: 'Courier & logistics, March 2026',                amount: 18500, date: new Date('2026-03-20'), method: 'CASH' },
      { category: 'MARKETING',  description: 'Online marketplace listing fees, March 2026',    amount: 12000, date: new Date('2026-03-15'), method: 'UPI' },
      { category: 'RENT',       description: 'Warehouse rent — Electronics City, April 2026',  amount: 40000, date: new Date('2026-04-01'), method: 'BANK_TRANSFER' },
      { category: 'UTILITIES',  description: 'Electricity & internet, April 2026',              amount: 8200,  date: new Date('2026-04-05'), method: 'UPI' },
      { category: 'SALARIES',   description: 'Staff salaries, April 2026',                      amount: 82000, date: new Date('2026-04-30'), method: 'BANK_TRANSFER' },
      { category: 'TRANSPORT',  description: 'Courier & logistics, April 2026',                amount: 21000, date: new Date('2026-04-18'), method: 'CASH' },
      { category: 'SUPPLIES',   description: 'Packaging materials & bubble wrap, April 2026', amount: 6500,  date: new Date('2026-04-12'), method: 'CASH' },
      { category: 'RENT',       description: 'Warehouse rent — Electronics City, May 2026',    amount: 40000, date: new Date('2026-05-01'), method: 'BANK_TRANSFER' },
      { category: 'UTILITIES',  description: 'Electricity & internet, May 2026',                amount: 8800,  date: new Date('2026-05-05'), method: 'UPI' },
      { category: 'SALARIES',   description: 'Staff salaries (advance), May 2026',              amount: 41000, date: new Date('2026-05-15'), method: 'BANK_TRANSFER' },
      { category: 'TRANSPORT',  description: 'Courier & logistics, May 2026 (partial)',        amount: 11200, date: new Date('2026-05-12'), method: 'CASH' },
    ];
    for (const e of expRows) {
      await prisma.expense.create({ data: { tenantId: tid, ...e } });
    }
    console.log('    ✓ 14 expense entries');
  } else {
    console.log('    ↩  Expenses already seeded');
  }
}

// ─── PARTNERSHIPS ─────────────────────────────────────────────────────────────

async function seedPartnerships(agro, pharma, tech) {
  console.log('\n  [Business Partnerships]');

  // Look up buyer tenants by name
  const sharmaKirana   = await prisma.tenant.findFirst({ where: { name: { contains: 'Sharma Kirana' } } });
  const adarshKirana   = await prisma.tenant.findFirst({ where: { name: { contains: 'Adarsh Kirana' } } });
  const spiceGarden    = await prisma.tenant.findFirst({ where: { name: { contains: 'Spice Garden' } } });
  const healthCare     = await prisma.tenant.findFirst({ where: { name: { contains: 'HealthCare' } } });
  const rameshElec     = await prisma.tenant.findFirst({ where: { name: { contains: 'Ramesh Electronics' } } });
  const autoFix        = await prisma.tenant.findFirst({ where: { name: { contains: 'AutoFix' } } });

  let created = 0;

  async function tryPartnership(buyer, supplier, label) {
    if (!buyer) { console.log(`    ⚠  ${label} tenant not found — skipping`); return; }
    await ensurePartnership(buyer.id, supplier.id);
    console.log(`    ✓ ${label} ↔ ${supplier.name}`);
    created++;
  }

  await tryPartnership(sharmaKirana, agro,   'Sharma Kirana Store');
  await tryPartnership(adarshKirana, agro,   'Adarsh Kirana');
  await tryPartnership(spiceGarden,  agro,   'Spice Garden Restaurant');
  await tryPartnership(healthCare,   pharma, 'HealthCare Plus Clinic');
  await tryPartnership(rameshElec,   tech,   'Ramesh Electronics');
  await tryPartnership(autoFix,      tech,   'AutoFix Workshop');

  console.log(`    → ${created} partnerships active`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Seeding comprehensive B2B data for first 3 supplier accounts…');

  const agro  = await prisma.tenant.findUnique({ where: { syllabrixId: 'SYLB2B001' } });
  const pharma = await prisma.tenant.findUnique({ where: { syllabrixId: 'SYLB2B002' } });
  const tech  = await prisma.tenant.findUnique({ where: { syllabrixId: 'SYLB2B003' } });

  if (!agro || !pharma || !tech) {
    console.error('❌  One or more B2B tenants not found. Run seed-b2b.js first.');
    process.exit(1);
  }

  await seedDelhiAgro(agro.id);
  await seedPharmaFirst(pharma.id);
  await seedTechParts(tech.id);
  await seedPartnerships(agro, pharma, tech);

  console.log('\n✅  B2B full seed complete!');
  console.log('\nAccounts now have: tax rates, categories, 15 products each,');
  console.log('6 customers each, 8 invoices each (mixed PAID/SENT/OVERDUE/DRAFT),');
  console.log('monthly expenses (March–May 2026), and active B2B partnerships.\n');
}

main()
  .catch(e => { console.error('Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
