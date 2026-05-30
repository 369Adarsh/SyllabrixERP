'use strict';
// CA Firm seed — Sharma & Associates Chartered Accountants
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const f2  = n => parseFloat(n.toFixed(2));
const ri  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const KIRANA_TID   = '20352ebf-5545-4f50-b4f3-7eb88b051359';

async function main() {
  console.log('\n🏛️  Sharma & Associates CA Firm — Seed\n');

  // ── 1. Find or create CA firm tenant ─────────────────────────────────────
  let caFirm = await prisma.tenant.findUnique({ where: { email: 'ca@sharmaassociates.test' } });
  if (!caFirm) {
    const hash = await bcrypt.hash('CA@1234', 10);
    caFirm = await prisma.tenant.create({
      data: {
        name: 'Sharma & Associates — Chartered Accountants',
        businessType: 'CA_FIRM',
        email: 'ca@sharmaassociates.test',
        phone: '9811500500',
        gstin: '27AABCS9999X1Z1',
        pan: 'AABCS9999X',
        address: '201, Nirman House, BKC, Mumbai',
        city: 'Mumbai', state: 'Maharashtra',
        plan: 'GROWTH',
        modules: ['invoicing','customers','expenses','reports','staff',
                  'whatsapp','quotations','finance','accounts'],
        users: {
          create: {
            name: 'CA Suresh Sharma',
            email: 'ca@sharmaassociates.test',
            password: await bcrypt.hash('CA@1234', 10),
            role: 'OWNER',
            isEmailVerified: true,
          },
        },
      },
    });
    console.log('   ✓ CA Firm tenant created:', caFirm.id);
  } else {
    console.log('   ✓ CA Firm already exists:', caFirm.id);
  }
  const TCA = caFirm.id;

  // ── 2. Clients (customers) ────────────────────────────────────────────────
  const existClients = await prisma.customer.count({ where: { tenantId: TCA } });
  let clients = [];
  if (existClients < 5) {
    clients = await Promise.all([
      prisma.customer.create({ data: { tenantId: TCA, name:'Sharma Kirana Store',          phone:'9823456789', email:'owner@sharmakirana.test',     gstin:'27AABCS5678B1Z3', creditLimit:0, tags:['kirana','gst','itr'] } }),
      prisma.customer.create({ data: { tenantId: TCA, name:'Ramesh Electronics Delhi',     phone:'9876543210', email:'owner@rameshelectronics.test', gstin:'07AABCR1234A1Z5', creditLimit:0, tags:['retail','audit'] } }),
      prisma.customer.create({ data: { tenantId: TCA, name:'Hotel Annapurna Mumbai',       phone:'9820002002', email:'hotel@annapurna.com',          gstin:'27AABCA2345C1Z4', creditLimit:0, tags:['hospitality','gst'] } }),
      prisma.customer.create({ data: { tenantId: TCA, name:'Bright Future Academy',        phone:'9867543210', email:'owner@brightfutureacademy.test',gstin:'24AABCA9012C1Z1', creditLimit:0, tags:['education','itr'] } }),
      prisma.customer.create({ data: { tenantId: TCA, name:'Mehta Trading Co.',            phone:'9844001001', email:'mehta@trading.com',            gstin:'27AABCM7654Z1B2', creditLimit:0, tags:['wholesale','audit','itr'] } }),
      prisma.customer.create({ data: { tenantId: TCA, name:'Patel Constructions Pvt Ltd',  phone:'9855002002', email:'patel@constructions.com',      gstin:'24AABCP3210Y1C3', creditLimit:0, tags:['construction','tds'] } }),
      prisma.customer.create({ data: { tenantId: TCA, name:'SkyHigh Logistics',            phone:'9866003003', email:'skyhigh@logistics.com',        gstin:'27AABCS0011H1Z8', creditLimit:0, tags:['transport','gst'] } }),
    ]);
    console.log('   ✓ 7 clients created');
  } else {
    clients = await prisma.customer.findMany({ where: { tenantId: TCA }, take: 7 });
    console.log('   ✓ Clients already exist');
  }

  // ── 3. Staff ───────────────────────────────────────────────────────────────
  const existStaff = await prisma.staff.count({ where: { tenantId: TCA } });
  let staffList = [];
  if (existStaff < 2) {
    staffList = await Promise.all([
      prisma.staff.create({ data: { tenantId: TCA, name:'Priya Joshi',  phone:'9811501001', email:'priya@sharmaassociates.test', role:'Junior CA',          department:'Audit',    salary:40000, joinedAt: new Date(2023,5,1)  } }),
      prisma.staff.create({ data: { tenantId: TCA, name:'Rahul Gupta',  phone:'9811502002', email:'rahul@sharmaassociates.test', role:'Tax Associate',       department:'Tax',      salary:30000, joinedAt: new Date(2024,0,15) } }),
      prisma.staff.create({ data: { tenantId: TCA, name:'Neha Patel',   phone:'9811503003', email:'neha@sharmaassociates.test',  role:'Accounts Executive',  department:'Accounts', salary:22000, joinedAt: new Date(2024,3,1)  } }),
    ]);
    console.log('   ✓ 3 staff created');
  }

  // ── 4. Tax rate (GST 18% for professional services) ───────────────────────
  const existTax = await prisma.taxRate.count({ where: { tenantId: TCA } });
  if (existTax === 0) {
    await prisma.taxRate.create({
      data: { tenantId: TCA, name:'GST 18% (Services)', rate:18, isGst:true, cgst:9, sgst:9, igst:18 },
    });
    console.log('   ✓ Tax rate created');
  }

  // ── 5. Monthly retainer invoices (12 months × 4 clients) ─────────────────
  const existInv = await prisma.invoice.count({ where: { tenantId: TCA } });
  if (existInv < 20) {
    let invNum = 1;

    const retainers = [
      { client: clients[0], service:'GST Return Filing (GSTR-1 + GSTR-3B)',   fee:3500 },
      { client: clients[0], service:'Bookkeeping & Monthly Accounts',          fee:5000 },
      { client: clients[1], service:'GST Return Filing + Reconciliation',      fee:4500 },
      { client: clients[4], service:'Bookkeeping & TDS Return Filing',         fee:7500 },
    ];

    for (let m = 0; m < 12; m++) {
      const totalM = 3 + m;
      const year   = totalM < 12 ? 2025 : 2026;
      const month0 = totalM % 12;

      for (const rc of retainers) {
        const issueDate = new Date(year, month0, 5);
        const dueDate   = addDays(issueDate, 15);
        const tax       = f2(rc.fee * 0.18);
        const total     = f2(rc.fee + tax);
        const isPaid    = dueDate < new Date();

        await prisma.invoice.create({
          data: {
            tenantId: TCA, customerId: rc.client.id,
            invoiceNumber: `CA-INV-${String(invNum++).padStart(4, '0')}`,
            status: isPaid ? 'PAID' : 'SENT',
            issueDate, dueDate,
            subtotal: rc.fee, taxAmount: tax, total,
            amountPaid: isPaid ? total : 0,
            balanceDue: isPaid ? 0 : total,
            notes: `${rc.service} — ${MONTHS_SHORT[month0]} ${year}`,
            createdAt: issueDate,
            items: {
              create: [{
                description: `${rc.service} — ${MONTHS_SHORT[month0]} ${year}`,
                quantity: 1, unitPrice: rc.fee,
                taxRate: 18, taxAmount: tax, total,
              }],
            },
            ...(isPaid ? {
              payments: {
                create: [{
                  amount: total, method: 'BANK_TRANSFER',
                  reference: `NEFT${ri(100000,999999)}`,
                  paidAt: addDays(issueDate, ri(2, 12)),
                }],
              },
            } : {}),
          },
        });
      }
    }

    // One-time project invoices
    const oneTimeDefs = [
      { client:clients[1], svc:'Statutory Audit FY 2024-25',                   fee:25000, date:new Date(2025,6,15),  paid:true  },
      { client:clients[0], svc:'ITR-3 Filing — FY 2024-25 (Kirana Store)',     fee:8000,  date:new Date(2025,8,10),  paid:true  },
      { client:clients[2], svc:'ITR Filing — Hotel Business FY 2024-25',       fee:12000, date:new Date(2025,8,18),  paid:true  },
      { client:clients[5], svc:'Statutory Audit — Patel Constructions',        fee:40000, date:new Date(2025,7,20),  paid:false },
      { client:clients[3], svc:'GST Registration for New Entity',              fee:3000,  date:new Date(2025,4,10),  paid:true  },
      { client:clients[4], svc:'TDS Return Filing Q1 FY 2025-26',             fee:2500,  date:new Date(2025,5,25),  paid:true  },
      { client:clients[6], svc:'GST Annual Return (GSTR-9)',                   fee:8000,  date:new Date(2025,11,20), paid:false },
      { client:clients[0], svc:'Tax Planning & Advisory — FY 2025-26',        fee:15000, date:new Date(2025,4,20),  paid:true  },
    ];

    for (const o of oneTimeDefs) {
      const tax   = f2(o.fee * 0.18);
      const total = f2(o.fee + tax);
      await prisma.invoice.create({
        data: {
          tenantId: TCA, customerId: o.client.id,
          invoiceNumber: `CA-INV-${String(invNum++).padStart(4, '0')}`,
          status: o.paid ? 'PAID' : 'SENT',
          issueDate: o.date, dueDate: addDays(o.date, 30),
          subtotal: o.fee, taxAmount: tax, total,
          amountPaid: o.paid ? total : 0,
          balanceDue: o.paid ? 0 : total,
          notes: o.svc,
          items: { create: [{ description: o.svc, quantity: 1, unitPrice: o.fee, taxRate: 18, taxAmount: tax, total }] },
          ...(o.paid ? { payments: { create: [{ amount: total, method:'BANK_TRANSFER', reference:`NEFT${ri(100000,999999)}`, paidAt: addDays(o.date, ri(3,10)) }] } } : {}),
        },
      });
    }
    console.log(`   ✓ ${invNum - 1} invoices created`);
  } else {
    console.log('   ✓ Invoices already exist');
  }

  // ── 6. Expenses (12 months) ───────────────────────────────────────────────
  const existExp = await prisma.expense.count({ where: { tenantId: TCA } });
  if (existExp < 20) {
    for (let m = 0; m < 12; m++) {
      const totalM = 3 + m;
      const year   = totalM < 12 ? 2025 : 2026;
      const month0 = totalM % 12;

      const exps = [
        { cat:'RENT',      desc:'Office rent — BKC, Mumbai',              amt:45000, method:'BANK_TRANSFER', day:1  },
        { cat:'SALARIES',  desc:'Staff salaries — ' + MONTHS_SHORT[month0], amt:92000, method:'BANK_TRANSFER', day:30 },
        { cat:'UTILITIES', desc:'Electricity + internet + phone',         amt:ri(3500,5500), method:'UPI',          day:8  },
        { cat:'SUPPLIES',  desc:'Stationery, printing & filing material', amt:ri(1500,3500), method:'CASH',         day:15 },
        { cat:'MARKETING', desc:'Professional directory & LinkedIn ads',  amt:ri(2000,4000), method:'UPI',          day:20 },
        { cat:'INSURANCE', desc:'Professional Indemnity Insurance (PI)',  amt:8000,          method:'BANK_TRANSFER', day:5  },
        { cat:'TRANSPORT', desc:'Client visit travel & auto charges',     amt:ri(1500,3000), method:'CASH',         day:25 },
        { cat:'OTHER',     desc:'Professional membership fees & CPE',     amt:ri(500,2000),  method:'UPI',          day:18 },
      ];

      if (m % 3 === 0) {
        exps.push({ cat:'TAXES', desc:'TDS payment & advance tax',        amt:ri(15000,25000), method:'BANK_TRANSFER', day:15 });
      }

      for (const e of exps) {
        await prisma.expense.create({
          data: {
            tenantId: TCA, category: e.cat, description: e.desc,
            amount: e.amt, date: new Date(year, month0, e.day), method: e.method,
          },
        });
      }
    }
    console.log('   ✓ Expenses created (12 months)');
  }

  // ── 7. Bank account + transactions ────────────────────────────────────────
  const existBank = await prisma.bankAccount.count({ where: { tenantId: TCA } });
  if (existBank === 0) {
    const caBank = await prisma.bankAccount.create({
      data: {
        tenantId: TCA, name: 'HDFC Professional Current Account',
        bankName: 'HDFC Bank', accountNumber: '50200099988877',
        ifscCode: 'HDFC0002345', accountType: 'CURRENT',
        openingBalance: 100000, currentBalance: 100000, isActive: true,
      },
    });

    // Monthly bank transactions
    let bal = 100000;
    for (let m = 0; m < 12; m++) {
      const totalM = 3 + m;
      const year   = totalM < 12 ? 2025 : 2026;
      const month0 = totalM % 12;
      const receipts = ri(80000, 130000);
      const costs    = 45000 + 92000 + ri(10000, 20000);

      await prisma.bankTransaction.create({ data: { accountId: caBank.id, type:'CREDIT', amount: receipts, description: `Client fee receipts — ${MONTHS_SHORT[month0]} ${year}`, category:'REVENUE', date: new Date(year, month0, 28) } });
      await prisma.bankTransaction.create({ data: { accountId: caBank.id, type:'DEBIT',  amount: costs,    description: `Office expenses & salaries — ${MONTHS_SHORT[month0]} ${year}`, category:'EXPENSE', date: new Date(year, month0, 30) } });
      bal += receipts - costs;
    }
    await prisma.bankAccount.update({ where: { id: caBank.id }, data: { currentBalance: f2(bal) } });
    console.log('   ✓ Bank account + transactions created');
  }

  // ── 8. Quotations (proposals to prospects) ────────────────────────────────
  const existQuo = await prisma.quotation.count({ where: { tenantId: TCA } });
  if (existQuo === 0) {
    const proposals = [
      { client:clients[6], status:'ACCEPTED', fee:18000, svc:'Full Outsourced Accounting Package',      date:new Date(2025,4,12) },
      { client:clients[5], status:'SENT',     fee:35000, svc:'Statutory Audit + Tax Filing Bundle',     date:new Date(2026,1,10) },
      { client:clients[3], status:'CONVERTED',fee:8500,  svc:'Monthly GST + Payroll Compliance',        date:new Date(2025,5,8)  },
    ];
    let qNum = 1;
    for (const p of proposals) {
      const tax   = f2(p.fee * 0.18);
      const total = f2(p.fee + tax);
      await prisma.quotation.create({
        data: {
          tenantId: TCA, customerId: p.client.id,
          quotationNumber: `CA-QUO-${String(qNum++).padStart(3,'0')}`,
          status: p.status, issueDate: p.date, expiryDate: addDays(p.date, 30),
          subtotal: p.fee, taxAmount: tax, total,
          notes: p.svc, terms: 'Payment due within 7 days of engagement commencement',
          items: { create: [{ description: p.svc, quantity: 1, unitPrice: p.fee, discount: 0, taxRate: 18, taxAmount: tax, total }] },
        },
      });
    }
    console.log('   ✓ 3 quotations/proposals created');
  }

  // ── 9. Add ACCOUNTANT reviewer to Kirana store ────────────────────────────
  const existCAUser = await prisma.user.findFirst({
    where: { tenantId: KIRANA_TID, email: 'ca.review@sharmakirana.test' },
  });
  if (!existCAUser) {
    const hash = await bcrypt.hash('CA@1234', 10);
    await prisma.user.create({
      data: {
        tenantId: KIRANA_TID,
        name: 'CA Suresh Sharma (Auditor)',
        email: 'ca.review@sharmakirana.test',
        password: hash,
        role: 'ACCOUNTANT',
        isEmailVerified: true,
      },
    });
    console.log('   ✓ CA reviewer user added to Kirana store');
  } else {
    console.log('   ✓ CA reviewer already exists in Kirana store');
  }

  console.log('\n' + '─'.repeat(54));
  console.log('✅  CA setup complete!\n');
  console.log('  CA Firm login       : ca@sharmaassociates.test');
  console.log('  Password            : CA@1234');
  console.log('  ─');
  console.log('  Kirana CA reviewer  : ca.review@sharmakirana.test');
  console.log('  Password            : CA@1234');
  console.log('\n  CA Firm data:');
  console.log('  • 7 clients (Kirana, Electronics, Hotel, Academy, Trading, Construction, Logistics)');
  console.log('  • 3 staff (Junior CA, Tax Associate, Accounts Executive)');
  console.log('  • 48 retainer invoices + 8 project invoices = 56 total');
  console.log('  • 12 months of expenses (rent ₹45k, salaries ₹92k/month)');
  console.log('  • HDFC current account with monthly cash flow');
  console.log('  • 3 client proposals/quotations\n');
}

main()
  .catch(e => { console.error('\n❌ Failed:', e.message, e); process.exit(1); })
  .finally(() => prisma.$disconnect());
