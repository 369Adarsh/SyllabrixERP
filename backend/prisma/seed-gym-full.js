/**
 * Syllabrix — Iron Zone Fitness Gym Seed
 * Full demo for a fitness gym business:
 *   - 60 members, 4 trainer accounts, equipment, memberships, sessions
 *
 * Run: node prisma/seed-gym-full.js
 * Login: owner@ironzone.test / IronZone@2026
 * Trainers: trainer1..4@ironzone.test / IronZone@2026
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PASS = 'IronZone@2026';
const hash = (p) => bcrypt.hashSync(p, 10);
const d = (daysAgo) => new Date(Date.now() - daysAgo * 86400_000);
const f = (daysAhead) => new Date(Date.now() + daysAhead * 86400_000);
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ── Member names (60 realistic Indian names) ──────────────────────────────────
const MEMBERS = [
  { name: 'Rohan Mehta',       phone: '9876501001' },
  { name: 'Priya Sharma',      phone: '9876501002' },
  { name: 'Karan Verma',       phone: '9876501003' },
  { name: 'Anjali Singh',      phone: '9876501004' },
  { name: 'Arjun Patel',       phone: '9876501005' },
  { name: 'Divya Nair',        phone: '9876501006' },
  { name: 'Vikram Rao',        phone: '9876501007' },
  { name: 'Pooja Gupta',       phone: '9876501008' },
  { name: 'Siddharth Joshi',   phone: '9876501009' },
  { name: 'Neha Kulkarni',     phone: '9876501010' },
  { name: 'Aarav Desai',       phone: '9876501011' },
  { name: 'Simran Kaur',       phone: '9876501012' },
  { name: 'Rahul Thakur',      phone: '9876501013' },
  { name: 'Kavya Iyer',        phone: '9876501014' },
  { name: 'Manish Pandey',     phone: '9876501015' },
  { name: 'Ritu Agarwal',      phone: '9876501016' },
  { name: 'Nikhil Shah',       phone: '9876501017' },
  { name: 'Swati Mishra',      phone: '9876501018' },
  { name: 'Deepak Kumar',      phone: '9876501019' },
  { name: 'Ananya Bose',       phone: '9876501020' },
  { name: 'Aditya Chopra',     phone: '9876501021' },
  { name: 'Shruti Reddy',      phone: '9876501022' },
  { name: 'Harsh Malhotra',    phone: '9876501023' },
  { name: 'Tanvi Patil',       phone: '9876501024' },
  { name: 'Gaurav Sinha',      phone: '9876501025' },
  { name: 'Pallavi Menon',     phone: '9876501026' },
  { name: 'Suresh Rajan',      phone: '9876501027' },
  { name: 'Meera Pillai',      phone: '9876501028' },
  { name: 'Rajesh Bansal',     phone: '9876501029' },
  { name: 'Sneha Deshpande',   phone: '9876501030' },
  { name: 'Yash Saxena',       phone: '9876501031' },
  { name: 'Isha Dixit',        phone: '9876501032' },
  { name: 'Tejas Naik',        phone: '9876501033' },
  { name: 'Sonali Bhatt',      phone: '9876501034' },
  { name: 'Kunal Srivastava',  phone: '9876501035' },
  { name: 'Nidhi Tiwari',      phone: '9876501036' },
  { name: 'Aman Chaudhary',    phone: '9876501037' },
  { name: 'Preeti Jain',       phone: '9876501038' },
  { name: 'Sachin Goel',       phone: '9876501039' },
  { name: 'Ruchika Anand',     phone: '9876501040' },
  { name: 'Dev Kapoor',        phone: '9876501041' },
  { name: 'Monika Soni',       phone: '9876501042' },
  { name: 'Vishal Goyal',      phone: '9876501043' },
  { name: 'Bhavna Yadav',      phone: '9876501044' },
  { name: 'Akash Rastogi',     phone: '9876501045' },
  { name: 'Rekha Nambiar',     phone: '9876501046' },
  { name: 'Piyush Trivedi',    phone: '9876501047' },
  { name: 'Charu Mathur',      phone: '9876501048' },
  { name: 'Rohit Dubey',       phone: '9876501049' },
  { name: 'Vandana Shukla',    phone: '9876501050' },
  { name: 'Saurabh Lal',       phone: '9876501051' },
  { name: 'Kritika Suri',      phone: '9876501052' },
  { name: 'Neeraj Bakshi',     phone: '9876501053' },
  { name: 'Poornima Hegde',    phone: '9876501054' },
  { name: 'Sumit Arora',       phone: '9876501055' },
  { name: 'Lakshmi Venkat',    phone: '9876501056' },
  { name: 'Mohit Batra',       phone: '9876501057' },
  { name: 'Jasmine Oberoi',    phone: '9876501058' },
  { name: 'Vineet Kapila',     phone: '9876501059' },
  { name: 'Gayatri Nair',      phone: '9876501060' },
];

// Membership plan definitions
const PLANS = [
  { name: 'Monthly Plan',            amount: 1499, days: 30,  invoiceDesc: 'Monthly Gym Membership' },
  { name: 'Quarterly Plan',          amount: 3999, days: 90,  invoiceDesc: 'Quarterly Gym Membership' },
  { name: 'Annual Plan',             amount: 12999, days: 365, invoiceDesc: 'Annual Gym Membership' },
  { name: 'Personal Training',       amount: 3999, days: 30,  invoiceDesc: 'Personal Training Package (1 Month)' },
  { name: 'Couple Plan',             amount: 2499, days: 30,  invoiceDesc: 'Couple Gym Membership' },
];

async function main() {
  console.log('\n🏋️  Seeding Iron Zone Fitness...\n');

  // ── 1. Create or find tenant ─────────────────────────────────────────────────
  const GYM_MODULES = ['fees', 'appointments', 'staff', 'attendance', 'customers', 'reports', 'pos', 'inventory', 'assets', 'membershipplans', 'training', 'expenses', 'whatsapp', 'campaigns', 'ai', 'automation'];

  let tenant = await prisma.tenant.findUnique({ where: { email: 'owner@ironzone.test' } });
  if (tenant) {
    console.log('  ⚡ Tenant already exists — patching modules and owner password');
    await prisma.tenant.update({ where: { id: tenant.id }, data: { modules: GYM_MODULES } });

    // Upsert owner user — handles case where tenant was created without a user
    const existingOwner = await prisma.user.findFirst({
      where: { tenantId: tenant.id, email: 'owner@ironzone.test' },
    });
    if (existingOwner) {
      await prisma.user.update({
        where: { id: existingOwner.id },
        data: { password: hash(PASS), isEmailVerified: true, emailVerifyToken: null },
      });
      console.log('  ✓ Owner password reset to IronZone@2026');
    } else {
      await prisma.user.create({
        data: {
          tenantId: tenant.id,
          name: 'Rahul Sharma',
          email: 'owner@ironzone.test',
          password: hash(PASS),
          role: 'OWNER',
          isEmailVerified: true,
        },
      });
      console.log('  ✓ Owner user created');
    }
    console.log('\n✅ Iron Zone patch complete — Login: owner@ironzone.test / IronZone@2026\n');
    return;
  }

  tenant = await prisma.tenant.create({
    data: {
      name: 'Iron Zone Fitness',
      businessType: 'GYM',
      email: 'owner@ironzone.test',
      phone: '9876500000',
      address: 'Shop 12, Baner Road, Near Balewadi',
      city: 'Pune',
      state: 'Maharashtra',
      gstin: '27AABCI1234A1Z5',
      modules: GYM_MODULES,
      receiptConfig: {
        footerText: 'Train hard. Stay fit. Iron Zone Fitness.',
        showGstin: false,
      },
    },
  });
  console.log(`  ✓ Tenant: ${tenant.name}`);

  // ── 2. Owner user ────────────────────────────────────────────────────────────
  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Rahul Sharma',
      email: 'owner@ironzone.test',
      password: hash(PASS),
      role: 'OWNER',
      isEmailVerified: true,
    },
  });
  console.log(`  ✓ Owner: ${owner.name} (${owner.email})`);

  // ── 3. Four trainer staff accounts ──────────────────────────────────────────
  const trainerData = [
    {
      name: 'Amit Singh', email: 'trainer1@ironzone.test', salary: 25000,
      specialization: ['Personal Training', 'Strength Training', 'CrossFit'],
      certifications: ['ACE-CPT', 'NSCA-CSCS', 'CrossFit L1'],
      bio: 'Certified strength coach with 8+ years of experience transforming body composition. Specialises in powerlifting fundamentals and functional hypertrophy programming.',
    },
    {
      name: 'Priya Nair', email: 'trainer2@ironzone.test', salary: 22000,
      specialization: ['Yoga', 'Zumba', 'Meditation'],
      certifications: ['RYT-500', 'Zumba Instructor', 'ISSA-CPT'],
      bio: 'Registered yoga teacher and certified Zumba instructor. Creates mindful, energetic classes that blend breathwork with movement to build strength and calm.',
    },
    {
      name: 'Karan Verma', email: 'trainer3@ironzone.test', salary: 24000,
      specialization: ['HIIT', 'Cardio', 'Functional Training'],
      certifications: ['NASM-CPT', 'TRX Suspension', 'Kettlebell Specialist'],
      bio: 'High-performance coach focused on athletic conditioning. His HIIT and functional movement sessions are designed for maximum calorie burn and real-world fitness.',
    },
    {
      name: 'Sneha Patil', email: 'trainer4@ironzone.test', salary: 21000,
      specialization: ['Dance', 'Zumba', 'Aerobics', 'Pilates'],
      certifications: ['Pilates Mat Level 2', 'Zumba Instructor', 'FitIndia Aerobics'],
      bio: 'Dance fitness specialist with a background in Bollywood choreography. Her energetic classes mix dance, aerobics and pilates for a full-body fun workout.',
    },
  ];

  const trainerUsers = [];
  const staffRecords = [];
  for (const t of trainerData) {
    const u = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: t.name,
        email: t.email,
        password: hash(PASS),
        role: 'STAFF',
        isEmailVerified: true,
      },
    });
    const s = await prisma.staff.create({
      data: {
        tenantId: tenant.id,
        name: t.name,
        phone: `987650${1001 + trainerData.indexOf(t)}`,
        email: t.email,
        role: 'Trainer',
        department: 'Training',
        salary: t.salary,
        joinedAt: d(randInt(180, 365)),
        isActive: true,
        specialization: t.specialization || [],
        bio: t.bio || null,
        certifications: t.certifications || [],
      },
    });
    trainerUsers.push(u);
    staffRecords.push(s);
    console.log(`  ✓ Trainer: ${t.name} (${t.email})`);
  }

  // ── 4. Membership services ───────────────────────────────────────────────────
  const services = [];
  const serviceDefs = [
    { name: 'Morning Batch (6-7 AM)',    description: 'Group training — cardio + weights',  duration: 60,  price: 0 },
    { name: 'Evening Batch (6-7 PM)',    description: 'Group training — full body workout',  duration: 60,  price: 0 },
    { name: 'Yoga Class',                description: 'Morning yoga & flexibility session',  duration: 60,  price: 0 },
    { name: 'Zumba / Dance Fitness',     description: 'High-energy cardio dance workout',    duration: 60,  price: 0 },
    { name: 'Personal Training Session', description: '1-on-1 with a certified trainer',    duration: 60,  price: 500 },
  ];
  for (const sd of serviceDefs) {
    const svc = await prisma.service.create({ data: { tenantId: tenant.id, ...sd } });
    services.push(svc);
  }
  console.log(`  ✓ Created ${services.length} services`);

  // ── 5. Sixty members + subscriptions + invoices ───────────────────────────────
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let invNum = 1001;

  const members = [];
  for (let i = 0; i < MEMBERS.length; i++) {
    const m = MEMBERS[i];
    const plan = PLANS[i % PLANS.length];

    // Determine membership timing:
    // 0-39: active (paid), 40-47: expiring in next 1-6 days, 48-59: overdue/expired
    let subStart, subExpiry, invStatus, paidAt, subStatus;

    if (i < 40) {
      // Active paid member — subscriptions spread across last 1-90 days
      const daysElapsed = randInt(5, plan.days - 5);
      subStart = d(daysElapsed);
      subExpiry = new Date(subStart.getTime() + plan.days * 86400_000);
      subStatus = 'ACTIVE';
      invStatus = 'PAID';
      paidAt = subStart;
    } else if (i < 48) {
      // Expiring soon — 1 to 6 days left
      const daysLeft = i - 39; // 1 to 8
      subStart = d(plan.days - daysLeft);
      subExpiry = f(daysLeft);
      subStatus = 'ACTIVE';
      invStatus = 'PAID';
      paidAt = subStart;
    } else {
      // Expired/overdue — membership lapsed
      const daysExpired = randInt(5, 30);
      subStart = d(plan.days + daysExpired);
      subExpiry = d(daysExpired);
      subStatus = 'EXPIRED';
      invStatus = 'OVERDUE';
      paidAt = null;
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: m.name,
        phone: m.phone,
        email: `${m.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        totalSpent: invStatus === 'PAID' ? plan.amount : 0,
        visitCount: invStatus === 'PAID' ? randInt(8, plan.days) : 0,
        lastVisitAt: invStatus === 'PAID' ? d(randInt(0, 3)) : d(randInt(10, 30)),
        createdAt: d(randInt(plan.days, plan.days + 60)),
      },
    });
    members.push(customer);

    // CustomerSubscription
    await prisma.customerSubscription.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        planName: plan.name,
        startDate: subStart,
        expiryDate: subExpiry,
        amount: plan.amount,
        status: subStatus,
        autoRenew: subStatus === 'ACTIVE',
        notes: `${plan.name} — Iron Zone Fitness`,
      },
    });

    // Invoice for membership
    const invNo = `IZ-${invNum++}`;
    await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        invoiceNumber: invNo,
        status: invStatus,
        issueDate: subStart,
        dueDate: new Date(subStart.getTime() + 3 * 86400_000),
        subtotal: plan.amount,
        taxAmount: 0,
        total: plan.amount,
        amountPaid: invStatus === 'PAID' ? plan.amount : 0,
        balanceDue: invStatus === 'PAID' ? 0 : plan.amount,
        notes: plan.invoiceDesc,
        ...(invStatus === 'PAID' && paidAt ? {
          items: {
            create: [{
              description: plan.invoiceDesc,
              quantity: 1,
              unitPrice: plan.amount,
              taxRate: 0,
              taxAmount: 0,
              total: plan.amount,
            }],
          },
          payments: {
            create: [{
              amount: plan.amount,
              method: rand(['CASH', 'UPI', 'CARD']),
              paidAt: paidAt,
            }],
          },
        } : {
          items: {
            create: [{
              description: plan.invoiceDesc,
              quantity: 1,
              unitPrice: plan.amount,
              taxRate: 0,
              taxAmount: 0,
              total: plan.amount,
            }],
          },
        }),
      },
    });
  }
  console.log(`  ✓ Created ${members.length} members with subscriptions & invoices`);

  // ── 6. Gym equipment as Assets ───────────────────────────────────────────────
  const equipCat = await prisma.assetCategory.create({
    data: { tenantId: tenant.id, name: 'Gym Equipment', wdvRate: 20, description: 'Fitness & training equipment' },
  });
  const cardioCategory = await prisma.assetCategory.create({
    data: { tenantId: tenant.id, name: 'Cardio Machines', wdvRate: 20 },
  });
  const strengthCategory = await prisma.assetCategory.create({
    data: { tenantId: tenant.id, name: 'Strength Equipment', wdvRate: 15 },
  });

  const equipment = [
    { cat: cardioCategory, name: 'Treadmill #1',             serial: 'TM-2023-001', price: 85000,  location: 'Cardio Zone' },
    { cat: cardioCategory, name: 'Treadmill #2',             serial: 'TM-2023-002', price: 85000,  location: 'Cardio Zone' },
    { cat: cardioCategory, name: 'Treadmill #3',             serial: 'TM-2023-003', price: 85000,  location: 'Cardio Zone' },
    { cat: cardioCategory, name: 'Treadmill #4',             serial: 'TM-2022-004', price: 75000,  location: 'Cardio Zone' },
    { cat: cardioCategory, name: 'Treadmill #5',             serial: 'TM-2022-005', price: 75000,  location: 'Cardio Zone' },
    { cat: cardioCategory, name: 'Treadmill #6',             serial: 'TM-2022-006', price: 75000,  location: 'Cardio Zone' },
    { cat: cardioCategory, name: 'Exercise Bike #1',         serial: 'EB-2023-001', price: 45000,  location: 'Cardio Zone' },
    { cat: cardioCategory, name: 'Exercise Bike #2',         serial: 'EB-2023-002', price: 45000,  location: 'Cardio Zone' },
    { cat: cardioCategory, name: 'Exercise Bike #3',         serial: 'EB-2022-003', price: 38000,  location: 'Cardio Zone' },
    { cat: cardioCategory, name: 'Exercise Bike #4',         serial: 'EB-2022-004', price: 38000,  location: 'Cardio Zone' },
    { cat: cardioCategory, name: 'Elliptical Machine #1',    serial: 'EL-2023-001', price: 60000,  location: 'Cardio Zone' },
    { cat: cardioCategory, name: 'Elliptical Machine #2',    serial: 'EL-2023-002', price: 60000,  location: 'Cardio Zone' },
    { cat: cardioCategory, name: 'Rowing Machine #1',        serial: 'RM-2023-001', price: 55000,  location: 'Cardio Zone' },
    { cat: cardioCategory, name: 'Rowing Machine #2',        serial: 'RM-2022-002', price: 48000,  location: 'Cardio Zone' },
    { cat: strengthCategory, name: 'Power Rack — Station A',  serial: 'PR-2022-001', price: 95000,  location: 'Free Weights Zone' },
    { cat: strengthCategory, name: 'Power Rack — Station B',  serial: 'PR-2022-002', price: 95000,  location: 'Free Weights Zone' },
    { cat: strengthCategory, name: 'Smith Machine',           serial: 'SM-2021-001', price: 120000, location: 'Free Weights Zone' },
    { cat: strengthCategory, name: 'Cable Crossover Machine', serial: 'CC-2022-001', price: 110000, location: 'Functional Zone' },
    { cat: strengthCategory, name: 'Leg Press Machine',       serial: 'LP-2023-001', price: 75000,  location: 'Strength Zone' },
    { cat: strengthCategory, name: 'Lat Pull-down Machine',   serial: 'LT-2022-001', price: 65000,  location: 'Strength Zone' },
    { cat: equipCat,         name: 'Dumbbell Set (2-50kg)',    serial: 'DB-2021-001', price: 140000, location: 'Free Weights Zone' },
    { cat: equipCat,         name: 'Dumbbell Set (2-30kg)',    serial: 'DB-2021-002', price: 90000,  location: 'Free Weights Zone' },
    { cat: equipCat,         name: 'Olympic Barbell Set (A)',  serial: 'OB-2022-001', price: 45000,  location: 'Free Weights Zone' },
    { cat: equipCat,         name: 'Olympic Barbell Set (B)',  serial: 'OB-2022-002', price: 45000,  location: 'Free Weights Zone' },
    { cat: equipCat,         name: 'Adjustable Bench Set (4)', serial: 'AB-2022-001', price: 32000,  location: 'Free Weights Zone' },
    { cat: equipCat,         name: 'Pull-up Station (A)',      serial: 'PU-2021-001', price: 28000,  location: 'Functional Zone' },
    { cat: equipCat,         name: 'Pull-up Station (B)',      serial: 'PU-2021-002', price: 28000,  location: 'Functional Zone' },
    { cat: equipCat,         name: 'Yoga Mat Set (20 pcs)',    serial: 'YM-2023-001', price: 12000,  location: 'Yoga Studio' },
    { cat: equipCat,         name: 'Resistance Bands Pack',    serial: 'RB-2023-001', price: 8000,   location: 'Functional Zone' },
    { cat: equipCat,         name: 'Mirror Wall — Main Floor', serial: 'MR-2021-001', price: 55000,  location: 'Main Floor' },
  ];

  for (const eq of equipment) {
    const purchaseDate = d(randInt(60, 730));
    const ageYears = (Date.now() - purchaseDate.getTime()) / (365.25 * 86400_000);
    const currentVal = Math.max(eq.price * (1 - 0.2 * ageYears), eq.price * 0.1);
    await prisma.asset.create({
      data: {
        tenantId: tenant.id,
        categoryId: eq.cat.id,
        name: eq.name,
        serialNumber: eq.serial,
        location: eq.location,
        purchaseDate,
        purchasePrice: eq.price,
        currentValue: Math.round(currentVal),
        salvageValue: Math.round(eq.price * 0.1),
        usefulLifeYears: 7,
        depreciationMethod: 'WDV',
        status: 'ACTIVE',
        vendor: 'SportsMart Equipment',
      },
    });
  }
  console.log(`  ✓ Created ${equipment.length} equipment assets`);

  // ── 7. Supplement / merchandise products (POS) ───────────────────────────────
  const prodCat = await prisma.category.create({ data: { tenantId: tenant.id, name: 'Supplements' } });
  const gearCat  = await prisma.category.create({ data: { tenantId: tenant.id, name: 'Gym Gear' } });

  const products = [
    { cat: prodCat, name: 'Whey Protein 1kg (Chocolate)',  sku: 'SUP-WP01', cost: 900,  sell: 1499, mrp: 1699, stock: 24 },
    { cat: prodCat, name: 'Whey Protein 1kg (Vanilla)',    sku: 'SUP-WP02', cost: 900,  sell: 1499, mrp: 1699, stock: 18 },
    { cat: prodCat, name: 'Pre-Workout (30 servings)',     sku: 'SUP-PW01', cost: 550,  sell: 899,  mrp: 999,  stock: 15 },
    { cat: prodCat, name: 'Creatine Monohydrate 300g',    sku: 'SUP-CR01', cost: 350,  sell: 599,  mrp: 699,  stock: 20 },
    { cat: prodCat, name: 'BCAA Powder 200g',             sku: 'SUP-BC01', cost: 500,  sell: 799,  mrp: 899,  stock: 12 },
    { cat: prodCat, name: 'Multivitamin 60 Tabs',         sku: 'SUP-MV01', cost: 250,  sell: 449,  mrp: 499,  stock: 30 },
    { cat: gearCat,  name: 'Gym Gloves (M/L/XL)',         sku: 'GR-GL01',  cost: 150,  sell: 299,  mrp: 349,  stock: 40 },
    { cat: gearCat,  name: 'Gym Belt (Leather)',           sku: 'GR-BL01',  cost: 400,  sell: 699,  mrp: 799,  stock: 15 },
    { cat: gearCat,  name: 'Shaker Bottle 700ml',          sku: 'GR-SH01',  cost: 90,   sell: 199,  mrp: 249,  stock: 50 },
    { cat: gearCat,  name: 'Iron Zone T-Shirt (Dry-Fit)',  sku: 'GR-TS01',  cost: 220,  sell: 599,  mrp: 699,  stock: 35 },
    { cat: gearCat,  name: 'Water Bottle Insulated 1L',   sku: 'GR-WB01',  cost: 80,   sell: 249,  mrp: 299,  stock: 45 },
    { cat: gearCat,  name: 'Resistance Band Set',          sku: 'GR-RB01',  cost: 200,  sell: 399,  mrp: 449,  stock: 20 },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        categoryId: p.cat.id,
        name: p.name,
        sku: p.sku,
        costPrice: p.cost,
        sellingPrice: p.sell,
        mrp: p.mrp,
        stock: p.stock,
        unit: 'pcs',
        lowStockAlert: 5,
      },
    });
  }
  console.log(`  ✓ Created ${products.length} products (supplements + gear)`);

  // ── 8. Appointments / training sessions ──────────────────────────────────────
  // Create sessions for last 7 days + today + next 14 days
  const groupServices = services.slice(0, 4); // Morning, Evening, Yoga, Zumba
  const ptService = services[4]; // Personal Training

  let apptCount = 0;

  for (let dayOffset = -7; dayOffset <= 14; dayOffset++) {
    const sessionDate = new Date(now);
    sessionDate.setDate(sessionDate.getDate() + dayOffset);

    // Skip Sundays
    if (sessionDate.getDay() === 0) continue;

    const dayStr = sessionDate.toISOString().slice(0, 10);

    // Group classes — 5 slots per day, 6-8 members each
    const classTimes = [
      { hour: 6,  svc: 0, trainer: 0 },  // Morning Batch — Amit
      { hour: 7,  svc: 2, trainer: 1 },  // Yoga — Priya
      { hour: 8,  svc: 3, trainer: 3 },  // Zumba — Sneha
      { hour: 18, svc: 1, trainer: 2 },  // Evening Batch — Karan
      { hour: 19, svc: 0, trainer: 0 },  // Evening Batch #2 — Amit
    ];

    for (const cls of classTimes) {
      const start = new Date(sessionDate);
      start.setHours(cls.hour, 0, 0, 0);
      const end   = new Date(start.getTime() + 60 * 60_000);

      // Assign 6-8 members to this class
      const batchSize = randInt(6, 10);
      const batchMembers = members.slice(0, 40).sort(() => Math.random() - 0.5).slice(0, batchSize);

      for (const member of batchMembers) {
        const isPast = dayOffset < 0;
        const isToday = dayOffset === 0;
        const status = isPast ? 'COMPLETED' : isToday ? 'CONFIRMED' : 'SCHEDULED';

        await prisma.appointment.create({
          data: {
            tenantId: tenant.id,
            customerId: member.id,
            staffId: staffRecords[cls.trainer].id,
            serviceId: groupServices[cls.svc].id,
            title: groupServices[cls.svc].name,
            status,
            startTime: start,
            endTime: end,
            price: 0,
          },
        });
        apptCount++;
      }
    }

    // 2 personal training sessions per day
    if (dayOffset >= -7 && dayOffset <= 14) {
      for (let pt = 0; pt < 2; pt++) {
        const ptHour = pt === 0 ? 9 : 17;
        const ptMember = members[40 + ((dayOffset + 7 + pt) % 8)]; // rotate through members 40-47
        const start = new Date(sessionDate);
        start.setHours(ptHour, 0, 0, 0);
        const end   = new Date(start.getTime() + 60 * 60_000);
        const isPast = dayOffset < 0;
        const isToday = dayOffset === 0;
        const status = isPast ? 'COMPLETED' : isToday ? 'CONFIRMED' : 'SCHEDULED';

        await prisma.appointment.create({
          data: {
            tenantId: tenant.id,
            customerId: ptMember.id,
            staffId: staffRecords[pt % 2].id,
            serviceId: ptService.id,
            title: 'Personal Training Session',
            status,
            startTime: start,
            endTime: end,
            price: 500,
          },
        });
        apptCount++;
      }
    }
  }
  console.log(`  ✓ Created ${apptCount} training sessions`);

  // ── 9. Staff attendance (last 7 days) ────────────────────────────────────────
  for (const staff of staffRecords) {
    for (let day = 7; day >= 1; day--) {
      const checkIn = new Date(d(day));
      checkIn.setHours(5, 45, 0, 0);
      const checkOut = new Date(checkIn);
      checkOut.setHours(13, 30, 0, 0);
      await prisma.attendanceLog.create({
        data: {
          tenantId: tenant.id,
          staffId: staff.id,
          punchType: 'IN',
          method: 'MANUAL',
          punchTime: checkIn,
        },
      });
      await prisma.attendanceLog.create({
        data: {
          tenantId: tenant.id,
          staffId: staff.id,
          punchType: 'OUT',
          method: 'MANUAL',
          timestamp: checkOut,
        },
      });
    }
  }
  console.log(`  ✓ Created staff attendance (7 days)`);

  // ── 10. Expenses (last 3 months) ─────────────────────────────────────────────
  const expenseMonths = [0, 1, 2]; // current, last, 2 months ago
  for (const mo of expenseMonths) {
    const expDate = new Date(now.getFullYear(), now.getMonth() - mo, 1);

    const expenses = [
      { amount: 50000, category: 'RENT',        desc: 'Monthly gym premises rent — Baner Road' },
      { amount: 8500,  category: 'UTILITIES',   desc: 'Electricity bill — high usage (AC + equipment)' },
      { amount: 7500,  category: 'UTILITIES',   desc: 'Water & municipal charges' },
      { amount: 90000, category: 'SALARIES',    desc: 'Trainer salaries — 4 trainers (monthly)' },
      { amount: 8000,  category: 'SALARIES',    desc: 'Cleaning & housekeeping staff' },
      { amount: 4500,  category: 'MAINTENANCE', desc: 'Treadmill & equipment servicing' },
      { amount: 6000,  category: 'MARKETING',   desc: 'Instagram & Facebook ads — member acquisition' },
      { amount: 2500,  category: 'SUPPLIES',    desc: 'Cleaning supplies, towels, toiletries' },
      { amount: 1800,  category: 'OTHER',       desc: 'Music system subscription & Wi-Fi' },
    ];

    for (const exp of expenses) {
      const expenseDate = new Date(expDate);
      expenseDate.setDate(randInt(2, 25));
      await prisma.expense.create({
        data: {
          tenantId: tenant.id,
          category: exp.category,
          amount: exp.amount,
          description: exp.desc,
          date: expenseDate,
          paymentMethod: rand(['CASH', 'BANK_TRANSFER', 'UPI']),
        },
      });
    }
  }
  console.log(`  ✓ Created 3 months of expenses`);

  // ── 11. Bank account ─────────────────────────────────────────────────────────
  await prisma.bankAccount.create({
    data: {
      tenantId: tenant.id,
      bankName: 'HDFC Bank',
      accountName: 'Iron Zone Fitness',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0001234',
      accountType: 'CURRENT',
      openingBalance: 150000,
      currentBalance: 187500,
      isDefault: true,
    },
  });
  console.log(`  ✓ Bank account created`);

  // ── 12. WhatsApp campaign draft ───────────────────────────────────────────────
  await prisma.whatsAppCampaign.create({
    data: {
      tenantId: tenant.id,
      name: 'Membership Renewal Reminder',
      segment: 'EXPIRING_7',
      message: '🏋️ *Iron Zone Fitness* — Your membership expires in 7 days!\n\nRenew now and get:\n✅ Same plan price locked\n✅ Free 1 PT session on renewal\n\nCall/WhatsApp: 9876500000\nOr walk in — we\'re open 5 AM to 10 PM!',
      status: 'DRAFT',
      targetCount: 8,
    },
  });

  await prisma.whatsAppCampaign.create({
    data: {
      tenantId: tenant.id,
      name: 'New Year Fitness Offer',
      segment: 'ALL',
      message: '🎉 *New Year Special — Iron Zone Fitness!*\n\nUpgrade to Annual Plan @ ₹9,999 (save ₹3,000!)\n\nValid for existing members only.\nOffer ends 31st January!\n\nCall: 9876500000',
      status: 'DRAFT',
      targetCount: 60,
    },
  });
  console.log(`  ✓ Created 2 WhatsApp campaign drafts`);

  // ── Done ─────────────────────────────────────────────────────────────────────
  console.log('\n✅ Iron Zone Fitness seed complete!\n');
  console.log('   Login credentials:');
  console.log('   Owner:     owner@ironzone.test     / IronZone@2026');
  console.log('   Trainer 1: trainer1@ironzone.test  / IronZone@2026  (Amit Singh)');
  console.log('   Trainer 2: trainer2@ironzone.test  / IronZone@2026  (Priya Nair)');
  console.log('   Trainer 3: trainer3@ironzone.test  / IronZone@2026  (Karan Verma)');
  console.log('   Trainer 4: trainer4@ironzone.test  / IronZone@2026  (Sneha Patil)\n');
  console.log('   Members:   60 registered (40 active, 8 expiring soon, 12 overdue)');
  console.log('   Equipment: 30 items tracked as assets');
  console.log('   Sessions:  Training appointments for ±14 days\n');
}

// Auto-run when called directly; also exportable for API-triggered seeding
if (require.main === module) {
  main().catch(console.error).finally(() => prisma.$disconnect());
}

module.exports = { seedIronZone: main };
