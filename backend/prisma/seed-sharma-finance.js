/**
 * seed-sharma-finance.js
 * Run: node prisma/seed-sharma-finance.js
 *
 * Injects into Sharma Grocery Chain:
 *   • 5 vendors with product catalogs
 *   • 12 purchase orders, GRNs, and vendor bills (per PO lifecycle)
 *   • Branch-specific invoices for all 4 branches (30 invoices total)
 *   • 12 quotations (3 per branch)
 *
 * Idempotent — safe to re-run. Skips sections that already have data.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.development') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const d  = (daysAgo)  => new Date(Date.now() - daysAgo * 86400000);
const da = (base, n)  => new Date(base.getTime() + n * 86400000);
const rnd = (n)       => Math.round(n * 100) / 100;

async function main() {
  console.log('\n💰 Sharma Finance Seed — Vendors, POs, Bills & Branch Invoices\n');

  // ── Tenant + branches ──────────────────────────────────────────────────────
  const tenant = await prisma.tenant.findUnique({ where: { email: 'raj@sharmachain.test' } });
  if (!tenant) {
    console.error('❌ Sharma Grocery Chain not found. Run main seed.js first.');
    process.exit(1);
  }
  const tid = tenant.id;

  const allBranches = await prisma.branch.findMany({
    where: { tenantId: tid }, orderBy: { createdAt: 'asc' },
  });
  const [b1, b2, b3, b4] = allBranches; // Main Market, Station Road, Vijay Nagar, Palasia Square

  // ── Products ───────────────────────────────────────────────────────────────
  const products = await prisma.product.findMany({ where: { tenantId: tid } });
  const bySku    = Object.fromEntries(products.map(p => [p.sku, p]));

  // ── Existing customers ─────────────────────────────────────────────────────
  const existingCusts = await prisma.customer.findMany({ where: { tenantId: tid } });
  const findOrCreateCust = async (data) => {
    const found = existingCusts.find(c => c.name === data.name);
    if (found) return found;
    const created = await prisma.customer.create({ data: { tenantId: tid, ...data } });
    existingCusts.push(created);
    return created;
  };

  const indoreCaterers = existingCusts.find(c => c.name === 'Indore Caterers Pvt Ltd');

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. VENDORS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📦 Creating vendors...');

  const vendorDefs = [
    {
      name: 'Agroha Foods Pvt Ltd', contactPerson: 'Ramesh Agroha',
      phone: '9713000101', email: 'sales@agrohafoods.com',
      address: 'Warehouse 5, Dewas Road, Indore, MP',
      gstin: '23AABCA1234A1Z5', paymentTerms: 'Net 30',
      notes: 'Primary grains & pulses supplier. Reliable, 3-day delivery to Indore.',
    },
    {
      name: 'Fortune Edible Oils Ltd', contactPerson: 'Deepak Shah',
      phone: '9022000202', email: 'orders@fortuneoils.com',
      address: 'Maker Chambers IV, Nariman Point, Mumbai',
      gstin: '27AABCF1234A1Z5', paymentTerms: 'Net 15',
      notes: 'Fortune brand — refined oils, mustard oil, ghee. Min order 100 units.',
    },
    {
      name: 'PepsiCo India Holdings Pvt Ltd', contactPerson: 'Sanjay Verma',
      phone: '9811000303', email: 'trade@pepsicoindia.com',
      address: 'DLF Tower A, Sector 24, Gurgaon, Haryana',
      gstin: '06AABCP5678B1Z3', paymentTerms: 'Net 7',
      notes: "Lays, Pepsi, Tropicana, Kurkure. Weekly delivery on Tuesday.",
    },
    {
      name: 'Marico Limited', contactPerson: 'Priya Bhatt',
      phone: '9022000404', email: 'distribution@marico.com',
      address: 'Rang Sharda, Bandra Reclamation, Mumbai',
      gstin: '27AABCM9876C1Z2', paymentTerms: 'Net 30',
      notes: 'Parachute, Saffola, H&S, Lifebuoy via distribution channel.',
    },
    {
      name: 'GCMMF Ltd (Amul)', contactPerson: 'Mukesh Patel',
      phone: '9879000505', email: 'supply@amul.com',
      address: 'Amul Dairy, PO Box 10, Anand, Gujarat',
      gstin: '24AAACG1234D1Z6', paymentTerms: 'Advance',
      notes: 'Amul butter, milk, curd, ghee. Advance payment required. Cold chain delivery.',
    },
  ];

  const vendors = [];
  for (const vd of vendorDefs) {
    let v = await prisma.vendor.findFirst({ where: { tenantId: tid, name: vd.name } });
    if (!v) {
      v = await prisma.vendor.create({ data: { tenantId: tid, ...vd } });
      console.log(`  ✓ Vendor: ${vd.name}`);
    } else {
      console.log(`  ⚡ Already exists: ${vd.name}`);
    }
    vendors.push(v);
  }
  const [vAgroha, vFortune, vPepsi, vMarico, vAmul] = vendors;

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. VENDOR PRODUCT CATALOGS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n📋 Creating vendor catalogs...');

  const catalogEntries = [
    // Agroha — grains & pulses
    { vendorId: vAgroha.id, productId: bySku['SC-RICE-BSM']?.id, itemName: 'Basmati Rice 5kg',   vendorSku: 'AGR-RCB-5K', vendorPrice: 265,  minOrderQty: 10  },
    { vendorId: vAgroha.id, productId: bySku['SC-RICE-REG']?.id, itemName: 'Regular Rice 5kg',   vendorSku: 'AGR-RCR-5K', vendorPrice: 178,  minOrderQty: 20  },
    { vendorId: vAgroha.id, productId: bySku['SC-ATA-10']?.id,   itemName: 'Aata 10kg',          vendorSku: 'AGR-ATA-10', vendorPrice: 308,  minOrderQty: 10  },
    { vendorId: vAgroha.id, productId: bySku['SC-DAL-CHN']?.id,  itemName: 'Chana Dal 1kg',      vendorSku: 'AGR-DLC-1K', vendorPrice: 80,   minOrderQty: 50  },
    { vendorId: vAgroha.id, productId: bySku['SC-DAL-MNG']?.id,  itemName: 'Moong Dal 1kg',      vendorSku: 'AGR-DLM-1K', vendorPrice: 89,   minOrderQty: 50  },
    { vendorId: vAgroha.id, productId: bySku['SC-DAL-TOR']?.id,  itemName: 'Toor Dal 1kg',       vendorSku: 'AGR-DLT-1K', vendorPrice: 103,  minOrderQty: 50  },
    { vendorId: vAgroha.id, productId: bySku['SC-DAL-URD']?.id,  itemName: 'Urad Dal 1kg',       vendorSku: 'AGR-DLU-1K', vendorPrice: 84,   minOrderQty: 50  },
    // Fortune — oils & ghee
    { vendorId: vFortune.id, productId: bySku['SC-OIL-SFW1']?.id, itemName: 'Sunflower Oil 1L',       vendorSku: 'FOR-SFO-1L',  vendorPrice: 122, minOrderQty: 24 },
    { vendorId: vFortune.id, productId: bySku['SC-OIL-MST1']?.id, itemName: 'Mustard Oil 1L',         vendorSku: 'FOR-MSO-1L',  vendorPrice: 141, minOrderQty: 24 },
    { vendorId: vFortune.id, productId: bySku['SC-OIL-FRT5']?.id, itemName: 'Fortune Refined Oil 5L', vendorSku: 'FOR-RFO-5L',  vendorPrice: 580, minOrderQty: 12 },
    { vendorId: vFortune.id, productId: bySku['SC-GHE-AML']?.id,  itemName: 'Pure Ghee 500g',         vendorSku: 'FOR-GHE-500', vendorPrice: 285, minOrderQty: 12 },
    // PepsiCo — snacks & beverages
    { vendorId: vPepsi.id, productId: bySku['SC-CHI-LYS']?.id,  itemName: "Lay's Classic 80g",     vendorSku: 'PSO-LYS-80',  vendorPrice: 13,  minOrderQty: 96  },
    { vendorId: vPepsi.id, productId: bySku['SC-CDR-600']?.id,   itemName: 'Cold Drink 600ml',      vendorSku: 'PSO-CDR-600', vendorPrice: 24,  minOrderQty: 48  },
    { vendorId: vPepsi.id, productId: bySku['SC-JCE-TRP']?.id,   itemName: 'Tropicana Juice 1L',    vendorSku: 'PSO-TRP-1L',  vendorPrice: 72,  minOrderQty: 24  },
    { vendorId: vPepsi.id, productId: bySku['SC-HLT-BST']?.id,   itemName: 'Boost Health Drink 500g',vendorSku: 'PSO-BST-500', vendorPrice: 198, minOrderQty: 12  },
    { vendorId: vPepsi.id, productId: bySku['SC-NMK-HLD']?.id,   itemName: 'Haldiram Namkeen 200g', vendorSku: 'PSO-HLD-200', vendorPrice: 60,  minOrderQty: 48  },
    // Marico — personal care
    { vendorId: vMarico.id, productId: bySku['SC-SHP-HNS']?.id, itemName: 'Head & Shoulders 400ml', vendorSku: 'MRC-HNS-400', vendorPrice: 208, minOrderQty: 12 },
    { vendorId: vMarico.id, productId: bySku['SC-SOP-LFB']?.id, itemName: 'Lifebuoy Soap 100g',     vendorSku: 'MRC-LFB-100', vendorPrice: 19,  minOrderQty: 48 },
    { vendorId: vMarico.id, productId: bySku['SC-DET-SRF']?.id, itemName: 'Surf Excel 500g',        vendorSku: 'MRC-SRF-500', vendorPrice: 50,  minOrderQty: 24 },
    { vendorId: vMarico.id, productId: bySku['SC-DET-ARL']?.id, itemName: 'Ariel 1kg',              vendorSku: 'MRC-ARL-1K',  vendorPrice: 175, minOrderQty: 12 },
    { vendorId: vMarico.id, productId: bySku['SC-TPT-COL']?.id, itemName: 'Colgate 200g',           vendorSku: 'MRC-COL-200', vendorPrice: 70,  minOrderQty: 24 },
    { vendorId: vMarico.id, productId: bySku['SC-HWS-DTL']?.id, itemName: 'Dettol Handwash 250ml',  vendorSku: 'MRC-DTL-250', vendorPrice: 73,  minOrderQty: 24 },
    // Amul — dairy
    { vendorId: vAmul.id, productId: bySku['SC-BTR-AML']?.id, itemName: 'Amul Butter 500g',       vendorSku: 'AML-BTR-500', vendorPrice: 205, minOrderQty: 12 },
    { vendorId: vAmul.id, productId: bySku['SC-MLK-AML']?.id, itemName: 'Amul Milk 1L',           vendorSku: 'AML-MLK-1L',  vendorPrice: 58,  minOrderQty: 50 },
    { vendorId: vAmul.id, productId: bySku['SC-CRD-MTH']?.id, itemName: 'Mother Dairy Curd 400g', vendorSku: 'AML-CRD-400', vendorPrice: 38,  minOrderQty: 24 },
  ];

  let catalogCreated = 0;
  for (const ce of catalogEntries) {
    const exists = await prisma.vendorProduct.findFirst({
      where: { tenantId: tid, vendorId: ce.vendorId, vendorSku: ce.vendorSku },
    });
    if (!exists) {
      await prisma.vendorProduct.create({ data: { tenantId: tid, ...ce } });
      catalogCreated++;
    }
  }
  console.log(`  ✓ ${catalogCreated} catalog entries created (${catalogEntries.length - catalogCreated} already existed)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. PURCHASE ORDERS + GRNs + VENDOR BILLS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n🛒 Creating purchase orders, GRNs & bills...');

  const existingPoCount = await prisma.purchaseOrder.count({ where: { tenantId: tid } });
  if (existingPoCount > 0) {
    console.log(`  ⚡ POs already exist (${existingPoCount}) — skipping`);
  } else {
    const poDefs = [
      // ── Agroha Foods ──────────────────────────────────────────────────────
      {
        vendor: vAgroha, poNo: 'PO-SC-001', daysAgo: 95, leadDays: 3, status: 'RECEIVED',
        items: [
          { desc: 'Basmati Rice 5kg',  sku: 'SC-RICE-BSM', qty: 100, cost: 265,  tax: 5 },
          { desc: 'Regular Rice 5kg',  sku: 'SC-RICE-REG', qty: 150, cost: 178,  tax: 0 },
          { desc: 'Aata 10kg',         sku: 'SC-ATA-10',   qty: 80,  cost: 308,  tax: 5 },
        ],
      },
      {
        vendor: vAgroha, poNo: 'PO-SC-002', daysAgo: 62, leadDays: 3, status: 'RECEIVED',
        items: [
          { desc: 'Chana Dal 1kg', sku: 'SC-DAL-CHN', qty: 200, cost: 80,  tax: 0 },
          { desc: 'Moong Dal 1kg', sku: 'SC-DAL-MNG', qty: 150, cost: 89,  tax: 0 },
          { desc: 'Toor Dal 1kg',  sku: 'SC-DAL-TOR', qty: 180, cost: 103, tax: 0 },
          { desc: 'Urad Dal 1kg',  sku: 'SC-DAL-URD', qty: 120, cost: 84,  tax: 0 },
        ],
      },
      {
        vendor: vAgroha, poNo: 'PO-SC-003', daysAgo: 18, leadDays: 3, status: 'ORDERED',
        items: [
          { desc: 'Basmati Rice 5kg', sku: 'SC-RICE-BSM', qty: 120, cost: 265, tax: 5 },
          { desc: 'Aata 10kg',        sku: 'SC-ATA-10',   qty: 100, cost: 308, tax: 5 },
        ],
      },
      // ── Fortune Edible Oils ───────────────────────────────────────────────
      {
        vendor: vFortune, poNo: 'PO-SC-004', daysAgo: 88, leadDays: 5, status: 'RECEIVED',
        items: [
          { desc: 'Sunflower Oil 1L',       sku: 'SC-OIL-SFW1', qty: 144, cost: 122, tax: 5 },
          { desc: 'Mustard Oil 1L',         sku: 'SC-OIL-MST1', qty: 96,  cost: 141, tax: 5 },
          { desc: 'Fortune Refined Oil 5L', sku: 'SC-OIL-FRT5', qty: 48,  cost: 580, tax: 5 },
          { desc: 'Pure Ghee 500g',         sku: 'SC-GHE-AML',  qty: 60,  cost: 285, tax: 5 },
        ],
      },
      {
        vendor: vFortune, poNo: 'PO-SC-005', daysAgo: 28, leadDays: 5, status: 'RECEIVED',
        items: [
          { desc: 'Sunflower Oil 1L', sku: 'SC-OIL-SFW1', qty: 120, cost: 122, tax: 5 },
          { desc: 'Pure Ghee 500g',   sku: 'SC-GHE-AML',  qty: 48,  cost: 285, tax: 5 },
        ],
      },
      {
        vendor: vFortune, poNo: 'PO-SC-006', daysAgo: 4, leadDays: 5, status: 'DRAFT',
        items: [
          { desc: 'Mustard Oil 1L',         sku: 'SC-OIL-MST1', qty: 96, cost: 141, tax: 5 },
          { desc: 'Fortune Refined Oil 5L', sku: 'SC-OIL-FRT5', qty: 36, cost: 580, tax: 5 },
        ],
      },
      // ── PepsiCo ───────────────────────────────────────────────────────────
      {
        vendor: vPepsi, poNo: 'PO-SC-007', daysAgo: 75, leadDays: 2, status: 'RECEIVED',
        items: [
          { desc: "Lay's Classic 80g",      sku: 'SC-CHI-LYS', qty: 288, cost: 13,  tax: 12 },
          { desc: 'Cold Drink 600ml',       sku: 'SC-CDR-600',  qty: 192, cost: 24,  tax: 12 },
          { desc: 'Tropicana Juice 1L',     sku: 'SC-JCE-TRP',  qty: 72,  cost: 72,  tax: 12 },
          { desc: 'Boost Health Drink 500g',sku: 'SC-HLT-BST',  qty: 48,  cost: 198, tax: 12 },
        ],
      },
      {
        vendor: vPepsi, poNo: 'PO-SC-008', daysAgo: 12, leadDays: 2, status: 'RECEIVED',
        items: [
          { desc: "Lay's Classic 80g", sku: 'SC-CHI-LYS', qty: 192, cost: 13, tax: 12 },
          { desc: 'Cold Drink 600ml',  sku: 'SC-CDR-600',  qty: 144, cost: 24, tax: 12 },
          { desc: 'Haldiram Namkeen 200g', sku: 'SC-NMK-HLD', qty: 96, cost: 60, tax: 12 },
        ],
      },
      {
        vendor: vPepsi, poNo: 'PO-SC-009', daysAgo: 2, leadDays: 2, status: 'ORDERED',
        items: [
          { desc: 'Cold Drink 600ml',   sku: 'SC-CDR-600', qty: 240, cost: 24, tax: 12 },
          { desc: 'Tropicana Juice 1L', sku: 'SC-JCE-TRP', qty: 48,  cost: 72, tax: 12 },
        ],
      },
      // ── Marico ────────────────────────────────────────────────────────────
      {
        vendor: vMarico, poNo: 'PO-SC-010', daysAgo: 55, leadDays: 7, status: 'RECEIVED',
        items: [
          { desc: 'Head & Shoulders 400ml', sku: 'SC-SHP-HNS', qty: 72,  cost: 208, tax: 12 },
          { desc: 'Lifebuoy Soap 100g',     sku: 'SC-SOP-LFB', qty: 240, cost: 19,  tax: 12 },
          { desc: 'Surf Excel 500g',        sku: 'SC-DET-SRF', qty: 120, cost: 50,  tax: 12 },
          { desc: 'Ariel 1kg',              sku: 'SC-DET-ARL', qty: 96,  cost: 175, tax: 12 },
          { desc: 'Colgate 200g',           sku: 'SC-TPT-COL', qty: 144, cost: 70,  tax: 12 },
          { desc: 'Dettol Handwash 250ml',  sku: 'SC-HWS-DTL', qty: 96,  cost: 73,  tax: 12 },
        ],
      },
      // ── Amul ──────────────────────────────────────────────────────────────
      {
        vendor: vAmul, poNo: 'PO-SC-011', daysAgo: 45, leadDays: 1, status: 'RECEIVED',
        items: [
          { desc: 'Amul Butter 500g',       sku: 'SC-BTR-AML', qty: 60,  cost: 205, tax: 5 },
          { desc: 'Amul Milk 1L',           sku: 'SC-MLK-AML', qty: 200, cost: 58,  tax: 5 },
          { desc: 'Mother Dairy Curd 400g', sku: 'SC-CRD-MTH', qty: 100, cost: 38,  tax: 5 },
        ],
      },
      {
        vendor: vAmul, poNo: 'PO-SC-012', daysAgo: 6, leadDays: 1, status: 'RECEIVED',
        items: [
          { desc: 'Amul Butter 500g', sku: 'SC-BTR-AML', qty: 36,  cost: 205, tax: 5 },
          { desc: 'Amul Milk 1L',     sku: 'SC-MLK-AML', qty: 150, cost: 58,  tax: 5 },
        ],
      },
    ];

    let grnSeq = 1, billSeq = 1;

    for (const def of poDefs) {
      let subtotal = 0, taxAmount = 0;
      const lineItems = def.items.map(it => {
        const base    = it.qty * it.cost;
        const lineTax = it.tax > 0 ? rnd(base * it.tax / 100) : 0;
        subtotal   += base;
        taxAmount  += lineTax;
        return {
          productId:   bySku[it.sku]?.id || null,
          description: it.desc,
          quantity:    it.qty,
          unitCost:    it.cost,
          taxRate:     it.tax,
          taxAmount:   lineTax,
          total:       rnd(base + lineTax),
          receivedQty: def.status === 'RECEIVED' ? it.qty : 0,
        };
      });
      const total       = rnd(subtotal + taxAmount);
      const orderDate   = d(def.daysAgo);
      const expectedDate= da(orderDate, def.leadDays);
      const receivedDate= def.status === 'RECEIVED' ? da(orderDate, def.leadDays) : null;

      const po = await prisma.purchaseOrder.create({
        data: {
          tenantId: tid,
          vendorId: def.vendor.id,
          poNumber: def.poNo,
          status:   def.status,
          orderDate,
          expectedDate,
          receivedDate,
          subtotal: rnd(subtotal),
          taxAmount: rnd(taxAmount),
          total,
          notes: `Restocking order — ${def.vendor.name}`,
          items: { create: lineItems },
        },
        include: { items: true },
      });

      // GRN + Bill only for RECEIVED POs
      if (def.status === 'RECEIVED') {
        const grnNumber  = `GRN-SC-${String(grnSeq++).padStart(3, '0')}`;
        const billNumber = `BILL-SC-${String(billSeq++).padStart(3, '0')}`;

        const grn = await prisma.goodsReceiptNote.create({
          data: {
            tenantId: tid, poId: po.id, grnNumber, status: 'CONFIRMED',
            receivedAt: receivedDate,
            notes: 'All items inspected. No damage/shortage.',
            lines: {
              create: po.items.map(item => ({
                poItemId:    item.id,
                productId:   item.productId,
                description: item.description,
                orderedQty:  item.quantity,
                receivedQty: item.quantity,
                unitCost:    item.unitCost,
                variance:    0,
              })),
            },
          },
        });

        // Age-based bill status: >45 days = PAID, >25 days = PARTIAL, else PENDING
        const ageDays    = def.daysAgo - def.leadDays;
        let billStatus, amountPaid;
        if (ageDays > 45) {
          billStatus = 'PAID';    amountPaid = total;
        } else if (ageDays > 20) {
          billStatus = 'PARTIAL'; amountPaid = rnd(total * 0.5);
        } else {
          billStatus = 'PENDING'; amountPaid = 0;
        }

        const billIssue   = receivedDate;
        const billDue     = da(billIssue, 30);
        const balanceDue  = rnd(total - amountPaid);

        const bill = await prisma.vendorBill.create({
          data: {
            tenantId: tid, vendorId: def.vendor.id, grnId: grn.id,
            billNumber, status: billStatus,
            issueDate: billIssue, dueDate: billDue,
            subtotal: rnd(subtotal), taxAmount: rnd(taxAmount),
            total, amountPaid, balanceDue,
            notes: `Against GRN ${grnNumber}`,
            items: {
              create: def.items.map(it => {
                const base    = it.qty * it.cost;
                const lineTax = it.tax > 0 ? rnd(base * it.tax / 100) : 0;
                return {
                  description: it.desc,
                  quantity:    it.qty,
                  unitPrice:   it.cost,
                  taxRate:     it.tax,
                  taxAmount:   lineTax,
                  total:       rnd(base + lineTax),
                };
              }),
            },
          },
        });

        if (amountPaid > 0) {
          await prisma.vendorBillPayment.create({
            data: {
              billId: bill.id, amount: amountPaid, method: 'BANK',
              reference: `NEFT-${billNumber}`,
              notes: billStatus === 'PAID' ? 'Full settlement' : 'First installment',
              paidAt: da(billIssue, 15),
            },
          });
        }
      }
      console.log(`  ✓ ${def.poNo} [${def.status}] — ${def.vendor.name}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. B2B CUSTOMERS FOR EACH BRANCH
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n👥 Creating branch B2B customers...');

  const strdCust1 = await findOrCreateCust({ name: 'Sunrise Hotel & Restaurant', phone: '9800002001', email: 'purchase@sunriseindore.com', gstin: '23AABCS2345B1Z3' });
  const strdCust2 = await findOrCreateCust({ name: 'Highway Dhaba Consortium',   phone: '9800002002' });
  const vjnrCust1 = await findOrCreateCust({ name: 'VN Cooperative Society',     phone: '9800003001', email: 'vncoop@gmail.com', gstin: '23AABCV3456C1Z2' });
  const vjnrCust2 = await findOrCreateCust({ name: 'Vijay Nagar Tiffin Center',  phone: '9800003002' });
  const plsaCust1 = await findOrCreateCust({ name: 'Palasia Palace Hotel',       phone: '9800004001', email: 'fnb@palasiapalace.com', gstin: '23AABCP4567D1Z1' });
  const plsaCust2 = await findOrCreateCust({ name: 'Square Events & Caterers',   phone: '9800004002' });
  console.log('  ✓ B2B customers ready');

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. BRANCH INVOICES
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n🧾 Creating branch invoices...');

  const existingInvCount = await prisma.invoice.count({ where: { tenantId: tid } });
  if (existingInvCount > 12) {
    console.log(`  ⚡ Branch invoices already exist (${existingInvCount} total) — skipping`);
  } else {
    const invDefs = [
      // ── Main Market HQ (b1) — 3 additional ───────────────────────────────
      {
        branch: b1, cust: indoreCaterers, no: 'INV-SC-013', daysAgo: 6,  dueDays: 30, status: 'SENT',
        items: [
          { d: 'Sugar 50kg bags × 6',   q: 6,  u: 2600, t: 0 },
          { d: 'Tata Tea Premium 250g × 50', q: 50, u: 115, t: 0 },
        ],
      },
      {
        branch: b1, cust: indoreCaterers, no: 'INV-SC-014', daysAgo: 42, dueDays: 30, status: 'OVERDUE',
        items: [
          { d: 'Basmati Rice 5kg × 20 bags',   q: 20,  u: 349, t: 5 },
          { d: 'Sunflower Oil 1L × 100 bottles', q: 100, u: 155, t: 5 },
        ],
      },
      {
        branch: b1, cust: indoreCaterers, no: 'INV-SC-015', daysAgo: 2, dueDays: 30, status: 'DRAFT',
        items: [
          { d: 'Mixed Staples Bulk Order — June Q2', q: 1, u: 68000, t: 0 },
        ],
      },

      // ── Station Road (b2) — 8 invoices ────────────────────────────────────
      {
        branch: b2, cust: strdCust1, no: 'INV-STRD-001', daysAgo: 240, dueDays: 30, status: 'PAID',
        items: [
          { d: 'Beverages assorted bulk',  q: 5,  u: 4500, t: 12 },
          { d: 'Snacks variety supply',    q: 10, u: 1200, t: 12 },
        ],
      },
      {
        branch: b2, cust: strdCust1, no: 'INV-STRD-002', daysAgo: 210, dueDays: 30, status: 'PAID',
        items: [
          { d: 'Sunflower Oil 1L × 100',  q: 100, u: 155, t: 5 },
          { d: 'Mustard Oil 1L × 50',     q: 50,  u: 175, t: 5 },
        ],
      },
      {
        branch: b2, cust: strdCust2, no: 'INV-STRD-003', daysAgo: 180, dueDays: 30, status: 'PAID',
        items: [{ d: 'Packaged snacks monthly supply — Highway Dhaba', q: 1, u: 28000, t: 12 }],
      },
      {
        branch: b2, cust: strdCust1, no: 'INV-STRD-004', daysAgo: 150, dueDays: 30, status: 'PAID',
        items: [
          { d: 'Rice & Pulses bulk — Ramzan special',  q: 1, u: 35000, t: 0 },
          { d: 'Oils & Ghee — festive restocking',     q: 1, u: 18000, t: 5 },
        ],
      },
      {
        branch: b2, cust: strdCust2, no: 'INV-STRD-005', daysAgo: 90, dueDays: 30, status: 'PAID',
        items: [{ d: 'Summer beverages mega stock — Dhaba', q: 1, u: 42000, t: 12 }],
      },
      {
        branch: b2, cust: strdCust1, no: 'INV-STRD-006', daysAgo: 55, dueDays: 30, status: 'PAID',
        items: [
          { d: 'Dairy products monthly supply', q: 1, u: 22000, t: 5  },
          { d: 'Personal care bulk supply',     q: 1, u: 15000, t: 12 },
        ],
      },
      {
        branch: b2, cust: strdCust1, no: 'INV-STRD-007', daysAgo: 22, dueDays: 30, status: 'SENT',
        items: [
          { d: 'Grains & Pulses — June restock',   q: 1, u: 38000, t: 0 },
          { d: 'Spices & Masalas — June monthly',  q: 1, u: 12000, t: 0 },
        ],
      },
      {
        branch: b2, cust: strdCust2, no: 'INV-STRD-008', daysAgo: 4, dueDays: 30, status: 'DRAFT',
        items: [{ d: 'Highway Dhaba Consortium — Q2 bulk order', q: 1, u: 55000, t: 0 }],
      },

      // ── Vijay Nagar (b3) — 6 invoices ─────────────────────────────────────
      {
        branch: b3, cust: vjnrCust1, no: 'INV-VJNR-001', daysAgo: 180, dueDays: 30, status: 'PAID',
        items: [{ d: 'VN Cooperative — grocery bundle Jan', q: 1, u: 28000, t: 0 }],
      },
      {
        branch: b3, cust: vjnrCust1, no: 'INV-VJNR-002', daysAgo: 150, dueDays: 30, status: 'PAID',
        items: [
          { d: 'Oils & Ghee quarterly supply', q: 1, u: 19500, t: 5 },
          { d: 'Dairy supply — Feb',           q: 1, u: 11000, t: 5 },
        ],
      },
      {
        branch: b3, cust: vjnrCust2, no: 'INV-VJNR-003', daysAgo: 90, dueDays: 30, status: 'PAID',
        items: [{ d: 'Snacks & Beverages — festival stock', q: 1, u: 32000, t: 12 }],
      },
      {
        branch: b3, cust: vjnrCust1, no: 'INV-VJNR-004', daysAgo: 48, dueDays: 30, status: 'SENT',
        items: [
          { d: 'VN Cooperative — rice & dal bundle', q: 1, u: 24000, t: 0 },
          { d: 'Spices & Masalas monthly',           q: 1, u: 8500,  t: 0 },
        ],
      },
      {
        branch: b3, cust: vjnrCust2, no: 'INV-VJNR-005', daysAgo: 38, dueDays: 30, status: 'OVERDUE',
        items: [{ d: 'Tiffin center monthly grocery supply', q: 1, u: 18000, t: 0 }],
      },
      {
        branch: b3, cust: vjnrCust1, no: 'INV-VJNR-006', daysAgo: 3, dueDays: 30, status: 'DRAFT',
        items: [{ d: 'Q2 bulk restock — VN Cooperative Society', q: 1, u: 45000, t: 0 }],
      },

      // ── Palasia Square (b4) — 4 invoices ──────────────────────────────────
      {
        branch: b4, cust: plsaCust1, no: 'INV-PLSA-001', daysAgo: 120, dueDays: 30, status: 'PAID',
        items: [
          { d: 'Hotel pantry supply — January',      q: 1, u: 22000, t: 0  },
          { d: 'Beverages & dairy for hotel kitchen', q: 1, u: 12000, t: 12 },
        ],
      },
      {
        branch: b4, cust: plsaCust2, no: 'INV-PLSA-002', daysAgo: 68, dueDays: 30, status: 'PAID',
        items: [
          { d: 'Event catering supply — wedding season', q: 1, u: 38000, t: 0 },
          { d: 'Premium oils & ghee for hotel kitchen',  q: 1, u: 14000, t: 5 },
        ],
      },
      {
        branch: b4, cust: plsaCust1, no: 'INV-PLSA-003', daysAgo: 18, dueDays: 30, status: 'SENT',
        items: [
          { d: 'Hotel monthly grocery bundle — June', q: 1, u: 31000, t: 0  },
          { d: 'Personal care & toiletries bulk',     q: 1, u: 9500,  t: 12 },
        ],
      },
      {
        branch: b4, cust: plsaCust2, no: 'INV-PLSA-004', daysAgo: 2, dueDays: 30, status: 'DRAFT',
        items: [{ d: 'Palasia Palace — Q2 catering & pantry contract', q: 1, u: 62000, t: 0 }],
      },
    ];

    let invCreated = 0;
    for (const inv of invDefs) {
      let subtotal = 0, taxAmount = 0, total = 0;
      const lineItems = inv.items.map(it => {
        const gross    = it.q * it.u;
        const lineTax  = it.t > 0 ? rnd(gross * it.t / (100 + it.t)) : 0;
        const lineBase = rnd(gross - lineTax);
        subtotal  += lineBase;
        taxAmount += lineTax;
        total     += gross;
        return { description: it.d, quantity: it.q, unitPrice: it.u, taxRate: it.t, taxAmount: lineTax, total: gross };
      });

      const issueDate  = d(inv.daysAgo);
      const dueDate    = da(issueDate, inv.dueDays);
      const amountPaid = inv.status === 'PAID' ? total : 0;

      await prisma.invoice.create({
        data: {
          tenantId: tid,
          branchId: inv.branch.id,
          customerId: inv.cust?.id || null,
          invoiceNumber: inv.no,
          status: inv.status,
          issueDate, dueDate,
          subtotal: rnd(subtotal),
          taxAmount: rnd(taxAmount),
          discountAmount: 0,
          total: rnd(total),
          amountPaid,
          balanceDue: rnd(total - amountPaid),
          items: { create: lineItems },
        },
      });
      invCreated++;
    }
    console.log(`  ✓ ${invCreated} branch invoices created`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. QUOTATIONS (3 per branch = 12 total)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n📝 Creating quotations...');

  const existingQtCount = await prisma.quotation.count({ where: { tenantId: tid } });
  if (existingQtCount > 0) {
    console.log(`  ⚡ Quotations already exist (${existingQtCount}) — skipping`);
  } else {
    const qtDefs = [
      // Main Market
      { no: 'QT-SC-001', daysAgo: 15, expDays: 30, status: 'SENT',     cust: indoreCaterers, items: [{ d: 'Bulk Rice & Pulses — Q3 Quarter',          q: 1,  u: 85000, t: 0 }] },
      { no: 'QT-SC-002', daysAgo: 7,  expDays: 30, status: 'DRAFT',    cust: indoreCaterers, items: [{ d: 'Diwali gift hamper bulk supply × 50 units', q: 50, u: 1200,  t: 12 }] },
      { no: 'QT-SC-003', daysAgo: 48, expDays: 30, status: 'ACCEPTED', cust: indoreCaterers, items: [{ d: 'Annual contract — staples supply FY26-27',  q: 1,  u: 420000, t: 0 }] },
      // Station Road
      { no: 'QT-STRD-001', daysAgo: 12, expDays: 30, status: 'SENT',    cust: strdCust2, items: [{ d: 'Monthly grocery package — Highway Dhaba', q: 1, u: 55000, t: 0 }] },
      { no: 'QT-STRD-002', daysAgo: 5,  expDays: 30, status: 'DRAFT',   cust: strdCust1, items: [{ d: 'Beverages & snacks quarterly stock',       q: 1, u: 32000, t: 12 }] },
      { no: 'QT-STRD-003', daysAgo: 65, expDays: 30, status: 'EXPIRED', cust: strdCust2, items: [{ d: 'Festival season mega bulk supply',         q: 1, u: 78000, t: 0 }] },
      // Vijay Nagar
      { no: 'QT-VJNR-001', daysAgo: 20, expDays: 30, status: 'SENT',    cust: vjnrCust1, items: [{ d: 'Q2 cooperative grocery bundle',         q: 1, u: 45000,  t: 0 }] },
      { no: 'QT-VJNR-002', daysAgo: 6,  expDays: 30, status: 'DRAFT',   cust: vjnrCust2, items: [{ d: 'Tiffin center weekly supply × 4 weeks', q: 4, u: 4500,   t: 0 }] },
      { no: 'QT-VJNR-003', daysAgo: 55, expDays: 30, status: 'ACCEPTED',cust: vjnrCust1, items: [{ d: 'Annual cooperative contract FY26-27',   q: 1, u: 210000, t: 0 }] },
      // Palasia Square
      { no: 'QT-PLSA-001', daysAgo: 10, expDays: 30, status: 'SENT',    cust: plsaCust1, items: [{ d: 'Hotel monthly pantry package',              q: 1, u: 41000, t: 0 }] },
      { no: 'QT-PLSA-002', daysAgo: 3,  expDays: 30, status: 'DRAFT',   cust: plsaCust2, items: [{ d: 'Wedding season catering supply',            q: 1, u: 95000, t: 0 }] },
      { no: 'QT-PLSA-003', daysAgo: 38, expDays: 30, status: 'REJECTED',cust: plsaCust1, items: [{ d: 'Premium luxury pantry package — rejected',  q: 1, u: 58000, t: 12 }] },
    ];

    for (const qt of qtDefs) {
      let subtotal = 0, taxAmount = 0, total = 0;
      const items = qt.items.map(it => {
        const gross   = it.q * it.u;
        const lineTax = it.t > 0 ? rnd(gross * it.t / (100 + it.t)) : 0;
        subtotal  += rnd(gross - lineTax);
        taxAmount += lineTax;
        total     += gross;
        return { description: it.d, quantity: it.q, unitPrice: it.u, discount: 0, taxRate: it.t, taxAmount: lineTax, total: gross };
      });

      const issueDate  = d(qt.daysAgo);
      const expiryDate = da(issueDate, qt.expDays);

      await prisma.quotation.create({
        data: {
          tenantId: tid,
          customerId: qt.cust?.id || null,
          quotationNumber: qt.no,
          status: qt.status,
          issueDate, expiryDate,
          subtotal: rnd(subtotal),
          taxAmount: rnd(taxAmount),
          discountAmount: 0,
          total: rnd(total),
          notes: `Quotation for ${qt.cust?.name || 'bulk buyer'}`,
          items: { create: items },
        },
      });
    }
    console.log(`  ✓ ${qtDefs.length} quotations created`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n✅ Sharma Finance seed complete!\n');
  console.log('  📦 Vendors:        5 (Agroha Foods, Fortune Oils, PepsiCo, Marico, Amul)');
  console.log('  📋 Catalog items:  25 vendor-product mappings');
  console.log('  🛒 Purchase Orders: 12 (8 RECEIVED w/ GRN+Bill, 2 ORDERED, 1 DRAFT)');
  console.log('  🧾 Invoices:        30 total — Main Market +3, Station Road 8, Vijay Nagar 6, Palasia 4');
  console.log('  📝 Quotations:      12 (3 per branch — SENT/DRAFT/ACCEPTED/EXPIRED/REJECTED)');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
