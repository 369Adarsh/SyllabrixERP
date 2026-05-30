/**
 * Migrate existing 73 hardcoded business types (Prisma enum) into the
 * new BusinessCategory + BusinessTypeConfig DB tables.
 *
 * Run once: node prisma/migrate-business-types.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORIES = [
  {
    name: 'Retail & Commerce',
    code: 'SYL-BC-RET',
    icon: '🛒',
    types: [
      { enumKey: 'RETAIL',        name: 'Retail Store',      icon: '🏪', modules: ['invoicing','pos','inventory','customers','expenses','reports','creditnotes','quotations'] },
      { enumKey: 'KIRANA',        name: 'Kirana Store',      icon: '🛍', modules: ['pos','inventory','customers','expenses','reports'] },
      { enumKey: 'MEDICAL_STORE', name: 'Medical Store',     icon: '💊', modules: ['pos','inventory','customers','expenses','reports','creditnotes'] },
      { enumKey: 'STATIONARY',    name: 'Stationery Shop',   icon: '📎', modules: ['pos','inventory','customers','expenses','reports'] },
      { enumKey: 'SWEET_SHOP',    name: 'Sweet Shop',        icon: '🍬', modules: ['pos','inventory','customers','expenses','reports'] },
      { enumKey: 'BAKERY',        name: 'Bakery',            icon: '🥐', modules: ['pos','inventory','customers','expenses','reports','invoicing'] },
      { enumKey: 'JEWELLERY',     name: 'Jewellery Store',   icon: '💍', modules: ['pos','inventory','customers','expenses','reports','invoicing','creditnotes','quotations'] },
      { enumKey: 'HARDWARE',      name: 'Hardware Store',    icon: '🔧', modules: ['pos','inventory','customers','expenses','reports','invoicing','vendors'] },
      { enumKey: 'ELECTRICAL',    name: 'Electrical Shop',   icon: '⚡', modules: ['pos','inventory','customers','expenses','reports','invoicing','vendors'] },
      { enumKey: 'CLOTHING',      name: 'Clothing Store',    icon: '👗', modules: ['pos','inventory','customers','expenses','reports','invoicing','creditnotes','campaigns'] },
      { enumKey: 'FOOTWEAR',      name: 'Footwear Store',    icon: '👟', modules: ['pos','inventory','customers','expenses','reports','invoicing','campaigns'] },
      { enumKey: 'ELECTRONICS',   name: 'Electronics Store', icon: '📱', modules: ['pos','inventory','customers','expenses','reports','invoicing','creditnotes','quotations','vendors'] },
      { enumKey: 'MOBILE_REPAIR', name: 'Mobile Repair',     icon: '🔌', modules: ['pos','inventory','customers','expenses','reports','invoicing','appointments'] },
      { enumKey: 'OPTICAL',       name: 'Optical Store',     icon: '👓', modules: ['pos','inventory','customers','expenses','reports','invoicing','appointments'] },
      { enumKey: 'BOOKSTORE',     name: 'Bookstore',         icon: '📚', modules: ['pos','inventory','customers','expenses','reports'] },
      { enumKey: 'FLORIST',       name: 'Florist',           icon: '🌸', modules: ['pos','inventory','customers','expenses','reports','invoicing'] },
      { enumKey: 'MALL',          name: 'Mall / Complex',    icon: '🏬', modules: ['pos','inventory','customers','expenses','reports','invoicing','staff','attendance','assets','lease'] },
    ],
  },
  {
    name: 'Food & Beverage',
    code: 'SYL-BC-FNB',
    icon: '🍽',
    types: [
      { enumKey: 'RESTAURANT',    name: 'Restaurant',        icon: '🍴', modules: ['pos','inventory','customers','expenses','reports','invoicing','staff','attendance','payroll'] },
      { enumKey: 'DHABA',         name: 'Dhaba',             icon: '🫕', modules: ['pos','inventory','customers','expenses','reports','staff'] },
      { enumKey: 'CATERING',      name: 'Catering Service',  icon: '🎪', modules: ['invoicing','customers','expenses','reports','inventory','staff','quotations'] },
      { enumKey: 'CLOUD_KITCHEN', name: 'Cloud Kitchen',     icon: '🍱', modules: ['pos','inventory','customers','expenses','reports','invoicing','campaigns'] },
      { enumKey: 'JUICE_BAR',     name: 'Juice Bar',         icon: '🥤', modules: ['pos','inventory','customers','expenses','reports'] },
      { enumKey: 'CANTEEN_MESS',  name: 'Canteen / Mess',    icon: '🍲', modules: ['pos','inventory','customers','expenses','reports','invoicing'] },
    ],
  },
  {
    name: 'Healthcare',
    code: 'SYL-BC-HLT',
    icon: '🏥',
    types: [
      { enumKey: 'CLINIC',           name: 'Clinic',             icon: '🩺', modules: ['appointments','customers','expenses','reports','invoicing','staff'] },
      { enumKey: 'DENTAL',           name: 'Dental Clinic',      icon: '🦷', modules: ['appointments','customers','expenses','reports','invoicing','staff','inventory'] },
      { enumKey: 'DIAGNOSTIC_LAB',   name: 'Diagnostic Lab',     icon: '🔬', modules: ['invoicing','customers','expenses','reports','staff','inventory'] },
      { enumKey: 'PHYSIOTHERAPY',    name: 'Physiotherapy',      icon: '🏃', modules: ['appointments','customers','expenses','reports','invoicing','staff'] },
      { enumKey: 'AYURVEDA',         name: 'Ayurveda Center',    icon: '🌿', modules: ['appointments','customers','expenses','reports','invoicing','inventory','staff'] },
      { enumKey: 'HOSPITAL',         name: 'Hospital',           icon: '🏨', modules: ['appointments','customers','expenses','reports','invoicing','staff','attendance','payroll','inventory','assets'] },
      { enumKey: 'VET_CLINIC',       name: 'Veterinary Clinic',  icon: '🐾', modules: ['appointments','customers','expenses','reports','invoicing','inventory'] },
    ],
  },
  {
    name: 'Beauty & Wellness',
    code: 'SYL-BC-BWL',
    icon: '💇',
    types: [
      { enumKey: 'SALON',          name: 'Salon',               icon: '✂️', modules: ['appointments','customers','expenses','reports','invoicing','staff','pos','inventory','campaigns'] },
      { enumKey: 'BEAUTY_PARLOUR', name: 'Beauty Parlour',      icon: '💄', modules: ['appointments','customers','expenses','reports','invoicing','staff','campaigns'] },
      { enumKey: 'SPA',            name: 'Spa',                 icon: '🧖', modules: ['appointments','customers','expenses','reports','invoicing','staff','inventory','campaigns','membershipplans'] },
      { enumKey: 'BARBERSHOP',     name: 'Barbershop',          icon: '💈', modules: ['appointments','customers','expenses','reports','invoicing','pos'] },
      { enumKey: 'LAUNDRY',        name: 'Laundry Service',     icon: '🧺', modules: ['customers','expenses','reports','invoicing','pos'] },
      { enumKey: 'TAILORING',      name: 'Tailoring Shop',      icon: '🧵', modules: ['customers','expenses','reports','invoicing','inventory'] },
    ],
  },
  {
    name: 'Fitness & Sports',
    code: 'SYL-BC-FIT',
    icon: '💪',
    types: [
      { enumKey: 'GYM',              name: 'Gym',                icon: '🏋', modules: ['membershipplans','customers','staff','attendance','payroll','expenses','reports','invoicing','campaigns','assets'] },
      { enumKey: 'YOGA_STUDIO',      name: 'Yoga Studio',        icon: '🧘', modules: ['appointments','membershipplans','customers','staff','expenses','reports','invoicing','campaigns'] },
      { enumKey: 'MARTIAL_ARTS',     name: 'Martial Arts',       icon: '🥋', modules: ['fees','customers','staff','attendance','expenses','reports','invoicing'] },
      { enumKey: 'SPORTS_ACADEMY',   name: 'Sports Academy',     icon: '⚽', modules: ['fees','customers','staff','attendance','expenses','reports','invoicing'] },
      { enumKey: 'SWIMMING_ACADEMY', name: 'Swimming Academy',   icon: '🏊', modules: ['fees','customers','staff','attendance','expenses','reports','invoicing','membershipplans'] },
      { enumKey: 'CROSSFIT_STUDIO',  name: 'CrossFit Studio',    icon: '🏃', modules: ['membershipplans','customers','staff','attendance','expenses','reports','invoicing','campaigns'] },
      { enumKey: 'WORKSHOP',         name: 'Workshop',           icon: '🔨', modules: ['invoicing','customers','inventory','expenses','reports','quotations'] },
    ],
  },
  {
    name: 'Education',
    code: 'SYL-BC-EDU',
    icon: '🎓',
    types: [
      { enumKey: 'COACHING',           name: 'Coaching Center',    icon: '📖', modules: ['fees','students','customers','staff','attendance','expenses','reports','invoicing','campaigns'] },
      { enumKey: 'HOME_TUITION',       name: 'Home Tuition',       icon: '🏠', modules: ['fees','students','customers','expenses','reports','invoicing'] },
      { enumKey: 'MUSIC_SCHOOL',       name: 'Music School',       icon: '🎵', modules: ['fees','students','customers','staff','attendance','expenses','reports','invoicing'] },
      { enumKey: 'DANCE_ACADEMY',      name: 'Dance Academy',      icon: '💃', modules: ['fees','students','customers','staff','attendance','expenses','reports','invoicing'] },
      { enumKey: 'DRIVING_SCHOOL',     name: 'Driving School',     icon: '🚗', modules: ['fees','customers','staff','attendance','expenses','reports','invoicing','appointments'] },
      { enumKey: 'COMPUTER_TRAINING',  name: 'Computer Training',  icon: '💻', modules: ['fees','students','customers','staff','expenses','reports','invoicing'] },
    ],
  },
  {
    name: 'Professional Services',
    code: 'SYL-BC-PRO',
    icon: '💼',
    types: [
      { enumKey: 'CA_FIRM',        name: 'CA Firm',              icon: '📊', modules: ['invoicing','customers','expenses','reports','quotations','creditnotes','staff','attendance'] },
      { enumKey: 'LAW_FIRM',       name: 'Law Firm',             icon: '⚖️', modules: ['invoicing','customers','expenses','reports','appointments','staff'] },
      { enumKey: 'REAL_ESTATE',    name: 'Real Estate Agency',   icon: '🏡', modules: ['invoicing','customers','expenses','reports','quotations','campaigns','staff','lease'] },
      { enumKey: 'INSURANCE_AGENCY', name: 'Insurance Agency',  icon: '🛡', modules: ['invoicing','customers','expenses','reports','campaigns','staff'] },
      { enumKey: 'TRAVEL_AGENCY',  name: 'Travel Agency',        icon: '✈️', modules: ['invoicing','customers','expenses','reports','quotations','campaigns','staff'] },
      { enumKey: 'PHOTOGRAPHY',    name: 'Photography Studio',   icon: '📷', modules: ['invoicing','customers','expenses','reports','appointments','quotations'] },
      { enumKey: 'DIGITAL_AGENCY', name: 'Digital Agency',       icon: '🖥', modules: ['invoicing','customers','expenses','reports','quotations','campaigns','staff','attendance'] },
      { enumKey: 'FREELANCER',     name: 'Freelancer',           icon: '🧑', modules: ['invoicing','customers','expenses','reports','quotations'] },
    ],
  },
  {
    name: 'Events & Functions',
    code: 'SYL-BC-EVT',
    icon: '🎉',
    types: [
      { enumKey: 'EVENT_PLANNER', name: 'Event Planner',  icon: '🎭', modules: ['invoicing','customers','expenses','reports','quotations','vendors','staff','campaigns'] },
      { enumKey: 'DECORATOR',     name: 'Decorator',      icon: '🎊', modules: ['invoicing','customers','expenses','reports','quotations','inventory'] },
      { enumKey: 'TENT_HOUSE',    name: 'Tent House',     icon: '⛺', modules: ['invoicing','customers','expenses','reports','quotations','inventory','vendors'] },
    ],
  },
  {
    name: 'Transport & Logistics',
    code: 'SYL-BC-TRN',
    icon: '🚛',
    types: [
      { enumKey: 'CAB_SERVICE',     name: 'Cab Service',      icon: '🚕', modules: ['invoicing','customers','expenses','reports','staff','attendance'] },
      { enumKey: 'TRANSPORT',       name: 'Transport Company', icon: '🚚', modules: ['invoicing','customers','expenses','reports','staff','attendance','payroll','assets'] },
      { enumKey: 'CAR_RENTAL',      name: 'Car Rental',        icon: '🚙', modules: ['invoicing','customers','expenses','reports','assets','staff'] },
      { enumKey: 'COURIER',         name: 'Courier Service',   icon: '📦', modules: ['invoicing','customers','expenses','reports','staff','attendance'] },
      { enumKey: 'PACKERS_MOVERS',  name: 'Packers & Movers',  icon: '🏗', modules: ['invoicing','customers','expenses','reports','quotations','staff','vendors'] },
    ],
  },
  {
    name: 'Construction & Design',
    code: 'SYL-BC-CON',
    icon: '🏗',
    types: [
      { enumKey: 'CONSTRUCTION',    name: 'Construction Company', icon: '🧱', modules: ['invoicing','customers','expenses','reports','quotations','vendors','staff','attendance','payroll','assets','inventory'] },
      { enumKey: 'INTERIOR_DESIGN', name: 'Interior Design',      icon: '🪑', modules: ['invoicing','customers','expenses','reports','quotations','vendors','staff'] },
      { enumKey: 'CO_WORKING',      name: 'Co-Working Space',     icon: '🏢', modules: ['invoicing','customers','expenses','reports','lease','staff','attendance','assets','campaigns'] },
    ],
  },
  {
    name: 'Trade & Supply (B2B)',
    code: 'SYL-BC-B2B',
    icon: '🤝',
    types: [
      { enumKey: 'DEALER',    name: 'Dealer',          icon: '🏭', modules: ['invoicing','pos','inventory','customers','expenses','reports','vendors','creditnotes','quotations','b2b'] },
      { enumKey: 'SUPPLIER',  name: 'Supplier',        icon: '📦', modules: ['invoicing','inventory','customers','expenses','reports','vendors','quotations','b2b'] },
      { enumKey: 'WHOLESALE', name: 'Wholesale',       icon: '🏪', modules: ['invoicing','pos','inventory','customers','expenses','reports','vendors','creditnotes','quotations','b2b'] },
    ],
  },
  {
    name: 'General',
    code: 'SYL-BC-GEN',
    icon: '🔷',
    types: [
      { enumKey: 'OTHER',     name: 'Other / General',  icon: '🔷', modules: ['invoicing','customers','expenses','reports'] },
      { enumKey: 'PEST_CONTROL', name: 'Pest Control',  icon: '🐛', modules: ['appointments','customers','invoicing','expenses','reports','inventory','staff'] },
    ],
  },
];

async function migrate() {
  console.log('🚀 Starting business type migration...\n');

  let catCount = 0, typeCount = 0, moduleCount = 0;

  for (const cat of CATEGORIES) {
    // Upsert category
    const existingCat = await prisma.businessCategory.findUnique({ where: { code: cat.code } });
    const category = existingCat || await prisma.businessCategory.create({
      data: { name: cat.name, code: cat.code, icon: cat.icon, createdBy: 'migration' },
    });
    if (!existingCat) catCount++;
    console.log(`📁 ${category.name} (${category.code})`);

    for (const type of cat.types) {
      // Skip if already migrated
      if (type.enumKey) {
        const existing = await prisma.businessTypeConfig.findUnique({ where: { enumKey: type.enumKey } });
        if (existing) {
          console.log(`  ⏭  ${type.name} (already exists)`);
          continue;
        }
      }

      // Generate code
      const words = type.name.split(/[\s&,\-_]+/).filter(Boolean);
      const initials = words.slice(0, 2).map(w => w[0].toUpperCase()).join('').padEnd(2, 'X');
      const catShort = cat.code.replace('SYL-BC-', '');
      let seq = 1;
      let code;
      do {
        code = `SYL-BC-${catShort}-${initials}${String(seq).padStart(2, '0')}`;
        const taken = await prisma.businessTypeConfig.findUnique({ where: { code } });
        if (!taken) break;
        seq++;
      } while (true);

      const bt = await prisma.businessTypeConfig.create({
        data: {
          name: type.name, code, enumKey: type.enumKey || null,
          categoryId: category.id, icon: type.icon,
          isActive: true, publishedAt: new Date(), createdBy: 'migration',
        },
      });
      typeCount++;

      // Seed modules (all CORE for migration)
      if (type.modules && type.modules.length) {
        await prisma.businessTypeModule.createMany({
          data: type.modules.map((m, i) => ({ businessTypeId: bt.id, moduleKey: m, tier: 'CORE', sortOrder: i })),
          skipDuplicates: true,
        });
        moduleCount += type.modules.length;
      }

      console.log(`  ✅ ${type.name} → ${code}`);
    }
  }

  console.log(`\n✨ Migration complete:`);
  console.log(`   ${catCount} categories created`);
  console.log(`   ${typeCount} business types created`);
  console.log(`   ${moduleCount} module assignments created`);
}

migrate()
  .catch(e => { console.error('❌ Migration failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
