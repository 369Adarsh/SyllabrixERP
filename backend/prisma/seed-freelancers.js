/**
 * Syllabrix — 5 Freelancer Demo Seeds (1 Year of Data)
 *
 * Run: node prisma/seed-freelancers.js
 *
 * Logins (password: Freelancer@2026)
 *  1. ramesh@elec.test   — Electrician     (Mumbai)
 *  2. priya@design.test  — Graphic Designer (Bangalore)
 *  3. suresh@plumb.test  — Plumber          (Ahmedabad)
 *  4. ankit@fit.test     — Fitness Trainer  (Delhi)
 *  5. kavya@photo.test   — Photographer    (Chennai)
 */

require('dotenv').config({ path: process.env.ENV_FILE || '.env.quality' });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PASS    = 'Freelancer@2026';
const hash    = (p) => bcrypt.hashSync(p, 10);
const rand    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo  = (n) => new Date(Date.now() - n * 86_400_000);
const daysAhead = (n) => new Date(Date.now() + n * 86_400_000);

const FL_MODULES = ['invoices', 'expenses', 'customers', 'reports', 'assets', 'ai'];

function pickStatus(dAgo) {
  if (dAgo > 240) return rand(['CLOSED', 'CLOSED', 'CLOSED', 'CANCELLED']);
  if (dAgo > 120) return rand(['CLOSED', 'COMPLETED', 'PAYMENT_PENDING']);
  if (dAgo > 60)  return rand(['COMPLETED', 'PAYMENT_PENDING', 'IN_PROGRESS']);
  if (dAgo > 14)  return rand(['IN_PROGRESS', 'COMPLETED', 'PAYMENT_PENDING']);
  return rand(['ENQUIRY', 'ESTIMATE_SENT', 'IN_PROGRESS']);
}

// ── PROFILES ──────────────────────────────────────────────────────────────────

const PROFILES = [

  // 1. Electrician
  {
    email: 'ramesh@elec.test', name: 'Ramesh Kumar', businessName: 'Ramesh Electricals',
    city: 'Mumbai', phone: '9876540001',
    helpers: [
      { name: 'Raju Yadav',   phone: '9876541001', skill: 'Wiring assistant', dailyRate: 500 },
      { name: 'Santosh More', phone: '9876541002', skill: 'Helper',           dailyRate: 450 },
    ],
    partners: [
      { name: 'AC Cool Services', phone: '9876541003', skill: 'AC installation', notes: '30% share on AC jobs' },
    ],
    suppliers: [
      { name: 'Sharma Electricals', phone: '9876542001', materials: 'Wires, MCBs, switches', area: 'Dadar, Mumbai' },
      { name: 'Price Power Mart',   phone: '9876542002', materials: 'DB boxes, conduits',    area: 'Andheri, Mumbai' },
    ],
    tools: [
      { name: 'Bosch Drill Machine', cost: 4500, condition: 'GOOD' },
      { name: 'Digital Tester',       cost: 1200, condition: 'GOOD' },
      { name: 'Aluminium Ladder 6ft', cost: 2200, condition: 'GOOD' },
      { name: 'Wire Stripper Set',    cost: 850,  condition: 'NEEDS_SERVICE' },
    ],
    amc: [
      { clientName: 'Mehta Apartment CHS', clientPhone: '9876550011', workType: 'Annual electrical maintenance — common areas', annualFee: 18000 },
      { clientName: 'Sunrise Office Park',  clientPhone: '9876550012', workType: 'Quarterly wiring checkup + emergency support',  annualFee: 24000 },
      { clientName: 'Riya Restaurant',      clientPhone: '9876550013', workType: 'Monthly kitchen wiring inspection',              annualFee: 9600  },
    ],
    clients: [
      { name: 'Suresh Mehta',        phone: '9876550001', address: 'Bandra West, Mumbai'   },
      { name: 'Anita Kadam',         phone: '9876550002', address: 'Borivali East, Mumbai'  },
      { name: 'Rajesh Patil',        phone: '9876550003', address: 'Thane, Mumbai'          },
      { name: 'Sunita Joshi',        phone: '9876550004', address: 'Malad West, Mumbai'     },
      { name: 'Prakash Shah',        phone: '9876550005', address: 'Kandivali, Mumbai'      },
      { name: 'Meera Desai',         phone: '9876550006', address: 'Andheri West, Mumbai'   },
      { name: 'Vijay Nair',          phone: '9876550007', address: 'Goregaon, Mumbai'       },
      { name: 'Pooja Rane',          phone: '9876550008', address: 'Chembur, Mumbai'        },
      { name: 'Dinesh Sawant',       phone: '9876550009', address: 'Dadar, Mumbai'          },
      { name: 'Kavita Singh',        phone: '9876550010', address: 'Mulund, Mumbai'         },
      { name: 'Mehta Apartment CHS', phone: '9876550011', address: 'Bandra, Mumbai'         },
      { name: 'Sunrise Office Park', phone: '9876550012', address: 'BKC, Mumbai'            },
    ],
    jobTemplates: [
      { workType: 'New wiring',            minVal: 3000,  maxVal: 15000, matRatio: 0.45 },
      { workType: 'Fan installation',      minVal: 400,   maxVal: 800,   matRatio: 0.2  },
      { workType: 'MCB / DB box repair',   minVal: 600,   maxVal: 2500,  matRatio: 0.35 },
      { workType: 'AC wiring & fitting',   minVal: 1500,  maxVal: 4000,  matRatio: 0.3  },
      { workType: 'Inverter installation', minVal: 1200,  maxVal: 3000,  matRatio: 0.4  },
      { workType: 'Light fitting',         minVal: 300,   maxVal: 1000,  matRatio: 0.25 },
      { workType: 'Socket / plug repair',  minVal: 200,   maxVal: 600,   matRatio: 0.2  },
      { workType: 'Earthing',              minVal: 800,   maxVal: 2500,  matRatio: 0.3  },
      { workType: 'Rewiring apartment',    minVal: 8000,  maxVal: 25000, matRatio: 0.5  },
    ],
    matItems: {
      'New wiring':          [{ name: 'Copper wire 2.5sqmm', unit: 'mtr', rMin: 40, rMax: 80 }, { name: 'PVC conduit', unit: 'pcs', rMin: 20, rMax: 40 }],
      'Rewiring apartment':  [{ name: 'Copper wire 4sqmm', unit: 'mtr', rMin: 60, rMax: 120 }, { name: 'DB box 8-way', unit: 'pcs', rMin: 350, rMax: 550 }],
      'MCB / DB box repair': [{ name: 'MCB 32A', unit: 'pcs', rMin: 120, rMax: 200 }],
      'AC wiring & fitting': [{ name: 'Armoured cable 4C', unit: 'mtr', rMin: 80, rMax: 150 }],
    },
    expenseItems: [
      { note: 'Petrol & auto', category: 'TRAVEL', minAmt: 600,  maxAmt: 1400 },
      { note: 'Tool servicing', category: 'TOOL',   minAmt: 200,  maxAmt: 800  },
      { note: 'Mobile recharge', category: 'OTHER', minAmt: 200,  maxAmt: 400  },
      { note: 'Food & chai',    category: 'OTHER',  minAmt: 300,  maxAmt: 700  },
    ],
  },

  // 2. Graphic Designer
  {
    email: 'priya@design.test', name: 'Priya Nair', businessName: 'Priya Creative Studio',
    city: 'Bangalore', phone: '9876540002',
    helpers: [],
    partners: [
      { name: 'Web Dev Arun', phone: '9876543001', skill: 'Web development', notes: '40% share on web projects' },
    ],
    suppliers: [],
    tools: [
      { name: 'MacBook Pro 14"',     cost: 185000, condition: 'GOOD' },
      { name: 'Wacom Intuos Tablet', cost: 8500,   condition: 'GOOD' },
      { name: 'Dell 27" Monitor',    cost: 22000,  condition: 'GOOD' },
      { name: 'Sony ZV-E10 Camera',  cost: 48000,  condition: 'GOOD' },
    ],
    amc: [
      { clientName: 'Zest Cafe Chain',    clientPhone: '9876551002', workType: 'Monthly social media design — 20 posts/month', annualFee: 15000 },
      { clientName: 'GreenLeaf Organics', clientPhone: '9876551003', workType: 'Quarterly brand refresh + packaging',           annualFee: 28000 },
    ],
    clients: [
      { name: 'Raj Mehta Startup',    phone: '9876551001', address: 'Koramangala, Bangalore' },
      { name: 'Zest Cafe Chain',      phone: '9876551002', address: 'Indiranagar, Bangalore' },
      { name: 'GreenLeaf Organics',   phone: '9876551003', address: 'HSR Layout, Bangalore'  },
      { name: 'TechBridge Solutions', phone: '9876551004', address: 'Electronic City, Bangalore' },
      { name: 'Anika Fashion House',  phone: '9876551005', address: 'Commercial Street, Bangalore' },
      { name: 'Dr. Preethi Clinic',   phone: '9876551006', address: 'Jayanagar, Bangalore'   },
      { name: 'Horizon Real Estate',  phone: '9876551007', address: 'Whitefield, Bangalore'  },
      { name: 'Namma Kitchen',        phone: '9876551008', address: 'BTM Layout, Bangalore'  },
      { name: 'Spark Academy',        phone: '9876551009', address: 'Rajajinagar, Bangalore' },
      { name: 'BlueOcean Travels',    phone: '9876551010', address: 'MG Road, Bangalore'     },
    ],
    jobTemplates: [
      { workType: 'Logo design',                 minVal: 3000,  maxVal: 15000, matRatio: 0 },
      { workType: 'Brand identity package',      minVal: 12000, maxVal: 35000, matRatio: 0 },
      { workType: 'Social media posts (monthly)',minVal: 6000,  maxVal: 18000, matRatio: 0 },
      { workType: 'Brochure / flyer design',     minVal: 2000,  maxVal: 6000,  matRatio: 0 },
      { workType: 'Packaging design',            minVal: 5000,  maxVal: 20000, matRatio: 0 },
      { workType: 'Website banner set',          minVal: 3000,  maxVal: 8000,  matRatio: 0 },
      { workType: 'Business card design',        minVal: 800,   maxVal: 2000,  matRatio: 0 },
      { workType: 'Presentation deck',           minVal: 4000,  maxVal: 12000, matRatio: 0 },
      { workType: 'Product photo editing',       minVal: 2500,  maxVal: 8000,  matRatio: 0 },
    ],
    matItems: {},
    expenseItems: [
      { note: 'Adobe CC subscription', category: 'TOOL',     minAmt: 4800, maxAmt: 4800 },
      { note: 'Canva Pro',             category: 'TOOL',     minAmt: 999,  maxAmt: 999  },
      { note: 'Electricity + internet',category: 'OTHER',    minAmt: 1200, maxAmt: 2200 },
      { note: 'Stock photos',          category: 'MATERIAL', minAmt: 500,  maxAmt: 2000 },
    ],
  },

  // 3. Plumber
  {
    email: 'suresh@plumb.test', name: 'Suresh Patel', businessName: 'Suresh Plumbing Works',
    city: 'Ahmedabad', phone: '9876540003',
    helpers: [
      { name: 'Ramji Solanki',  phone: '9876544001', skill: 'Plumbing helper', dailyRate: 400 },
      { name: 'Bhavesh Mistry', phone: '9876544002', skill: 'Assistant',        dailyRate: 350 },
    ],
    partners: [],
    suppliers: [
      { name: 'Patel Plumbing Mart', phone: '9876545001', materials: 'CPVC pipes, fittings, valves', area: 'Kalupur, Ahmedabad' },
      { name: 'Hardware King',        phone: '9876545002', materials: 'General hardware, sealants',   area: 'Raipur, Ahmedabad'  },
    ],
    tools: [
      { name: 'Pipe cutter',       cost: 650,  condition: 'GOOD'         },
      { name: 'Pipe wrench 18"',   cost: 900,  condition: 'GOOD'         },
      { name: 'Plunger',           cost: 200,  condition: 'GOOD'         },
      { name: 'Drain snake 15mtr', cost: 1800, condition: 'NEEDS_SERVICE' },
    ],
    amc: [
      { clientName: 'Patel Residency CHS', clientPhone: '9876552006', workType: 'Monthly drainage & overhead tank checkup', annualFee: 12000 },
      { clientName: 'Royal Comfort Hotel', clientPhone: '9876552007', workType: 'Quarterly full plumbing maintenance',       annualFee: 20000 },
    ],
    clients: [
      { name: 'Hasmukh Patel',      phone: '9876552001', address: 'Navrangpura, Ahmedabad' },
      { name: 'Rekha Shah',         phone: '9876552002', address: 'Satellite, Ahmedabad'   },
      { name: 'Bharat Mehta',       phone: '9876552003', address: 'Vastrapur, Ahmedabad'   },
      { name: 'Asha Desai',         phone: '9876552004', address: 'Maninagar, Ahmedabad'   },
      { name: 'Jayesh Modi',        phone: '9876552005', address: 'Bopal, Ahmedabad'       },
      { name: 'Patel Residency CHS',phone: '9876552006', address: 'Chandkheda, Ahmedabad'  },
      { name: 'Royal Comfort Hotel',phone: '9876552007', address: 'CG Road, Ahmedabad'     },
      { name: 'Kiran Joshi',        phone: '9876552008', address: 'Gota, Ahmedabad'        },
      { name: 'Meena Trivedi',      phone: '9876552009', address: 'Thaltej, Ahmedabad'     },
      { name: 'Dilip Rao',          phone: '9876552010', address: 'Prahlad Nagar, Ahmedabad' },
    ],
    jobTemplates: [
      { workType: 'Leakage repair',          minVal: 300,  maxVal: 2000, matRatio: 0.4  },
      { workType: 'New tap installation',    minVal: 400,  maxVal: 1200, matRatio: 0.5  },
      { workType: 'Drainage cleaning',       minVal: 500,  maxVal: 2500, matRatio: 0.2  },
      { workType: 'Bathroom fitting',        minVal: 3000, maxVal: 8000, matRatio: 0.5  },
      { workType: 'Water tank repair',       minVal: 800,  maxVal: 3000, matRatio: 0.3  },
      { workType: 'Pipe replacement',        minVal: 1500, maxVal: 6000, matRatio: 0.55 },
      { workType: 'WC / flush repair',       minVal: 400,  maxVal: 1500, matRatio: 0.4  },
      { workType: 'Overhead tank cleaning',  minVal: 600,  maxVal: 1800, matRatio: 0.1  },
    ],
    matItems: {
      'Bathroom fitting': [{ name: 'CPVC pipe 1"', unit: 'mtr', rMin: 40, rMax: 80 }, { name: 'Elbow joint', unit: 'pcs', rMin: 15, rMax: 30 }],
      'Pipe replacement': [{ name: 'PVC pipe 3/4"', unit: 'mtr', rMin: 25, rMax: 50 }, { name: 'M-seal', unit: 'pcs', rMin: 30, rMax: 60 }],
      'New tap installation': [{ name: 'Tap washer', unit: 'pcs', rMin: 20, rMax: 40 }, { name: 'Teflon tape', unit: 'roll', rMin: 15, rMax: 25 }],
    },
    expenseItems: [
      { note: 'Transport', category: 'TRAVEL', minAmt: 400, maxAmt: 900 },
      { note: 'Food',      category: 'OTHER',  minAmt: 250, maxAmt: 550 },
      { note: 'Tools & supplies', category: 'TOOL', minAmt: 200, maxAmt: 600 },
    ],
  },

  // 4. Fitness Trainer
  {
    email: 'ankit@fit.test', name: 'Ankit Verma', businessName: 'Ankit Fitness Pro',
    city: 'Delhi', phone: '9876540004',
    helpers: [],
    partners: [
      { name: 'Dietitian Riya Arora', phone: '9876546001', skill: 'Diet planning', notes: '20% share on combo packages' },
    ],
    suppliers: [],
    tools: [
      { name: 'Resistance bands set', cost: 999,  condition: 'GOOD' },
      { name: 'Foam roller',          cost: 699,  condition: 'GOOD' },
      { name: 'Kettlebell 16kg',      cost: 1800, condition: 'GOOD' },
      { name: 'Yoga mat',             cost: 799,  condition: 'GOOD' },
    ],
    amc: [
      { clientName: 'Sharma Family',   clientPhone: '9876553007', workType: 'Monthly personal training — 3 members, 12 sessions', annualFee: 12000 },
      { clientName: 'TechCorp Office', clientPhone: '9876553008', workType: 'Corporate wellness — 2 days/week group sessions',     annualFee: 18000 },
    ],
    clients: [
      { name: 'Rahul Sharma',    phone: '9876553001', address: 'Saket, Delhi'        },
      { name: 'Nidhi Gupta',     phone: '9876553002', address: 'Vasant Kunj, Delhi'  },
      { name: 'Ajay Malhotra',   phone: '9876553003', address: 'Dwarka, Delhi'       },
      { name: 'Shruti Kapoor',   phone: '9876553004', address: 'Rohini, Delhi'       },
      { name: 'Vikas Bansal',    phone: '9876553005', address: 'Pitampura, Delhi'    },
      { name: 'Pooja Soni',      phone: '9876553006', address: 'Janakpuri, Delhi'    },
      { name: 'Sharma Family',   phone: '9876553007', address: 'Lajpat Nagar, Delhi' },
      { name: 'TechCorp Office', phone: '9876553008', address: 'Cyber City, Gurugram'},
      { name: 'Sanjay Bhatia',   phone: '9876553009', address: 'Greater Kailash, Delhi'},
      { name: 'Divya Yadav',     phone: '9876553010', address: 'Noida, UP'           },
    ],
    jobTemplates: [
      { workType: 'Monthly training package',      minVal: 4000, maxVal: 8000,  matRatio: 0 },
      { workType: 'Online coaching (monthly)',     minVal: 2500, maxVal: 5000,  matRatio: 0 },
      { workType: 'Weight loss programme 3 months',minVal: 9000, maxVal: 18000, matRatio: 0 },
      { workType: 'Home personal training session',minVal: 600,  maxVal: 1200,  matRatio: 0 },
      { workType: 'Diet + fitness plan',           minVal: 1500, maxVal: 4000,  matRatio: 0 },
      { workType: 'Corporate wellness session',    minVal: 3000, maxVal: 8000,  matRatio: 0 },
      { workType: 'Yoga & flexibility class',      minVal: 500,  maxVal: 1500,  matRatio: 0 },
    ],
    matItems: {},
    expenseItems: [
      { note: 'Transport (metro/auto)', category: 'TRAVEL', minAmt: 600,  maxAmt: 1200 },
      { note: 'Protein supplement',     category: 'MATERIAL',minAmt: 1200, maxAmt: 2500 },
      { note: 'Internet & phone',       category: 'OTHER',   minAmt: 500,  maxAmt: 800  },
    ],
  },

  // 5. Photographer
  {
    email: 'kavya@photo.test', name: 'Kavya Iyer', businessName: 'Kavya Iyer Photography',
    city: 'Chennai', phone: '9876540005',
    helpers: [
      { name: 'Karthik R', phone: '9876547001', skill: 'Photo assistant / lighting', dailyRate: 800 },
    ],
    partners: [
      { name: 'Vignesh Films', phone: '9876547002', skill: 'Videography', notes: '35% share on video combo projects' },
    ],
    suppliers: [],
    tools: [
      { name: 'Sony A7 IV',              cost: 230000, condition: 'GOOD' },
      { name: 'Sony 85mm f/1.4 GM Lens', cost: 145000, condition: 'GOOD' },
      { name: 'Godox AD200 Pro Flash',   cost: 18000,  condition: 'GOOD' },
      { name: 'DJI Mini 3 Drone',        cost: 74000,  condition: 'GOOD' },
      { name: 'Tripod Manfrotto',        cost: 12000,  condition: 'NEEDS_SERVICE' },
    ],
    amc: [
      { clientName: 'The Grand Banquet Hall', clientPhone: '9876554003', workType: 'Priority 2 events/month — shoot + editing',       annualFee: 30000 },
      { clientName: 'Sunshine Studio',         clientPhone: '9876554004', workType: 'Monthly product photography — 50 products/month', annualFee: 22000 },
    ],
    clients: [
      { name: 'Arjun & Priya (Wedding)', phone: '9876554001', address: 'Adyar, Chennai'         },
      { name: 'Kumar & Associates',      phone: '9876554002', address: 'Anna Nagar, Chennai'     },
      { name: 'The Grand Banquet Hall',  phone: '9876554003', address: 'T Nagar, Chennai'        },
      { name: 'Sunshine Studio',         phone: '9876554004', address: 'Mylapore, Chennai'       },
      { name: 'Ramesh Exports',          phone: '9876554005', address: 'Guindy, Chennai'         },
      { name: 'Priya & Vikram Iyer',    phone: '9876554006', address: 'Velachery, Chennai'      },
      { name: 'SRM College Admin',       phone: '9876554007', address: 'Kattankulathur, Chennai' },
      { name: 'Nisha Birthday Party',   phone: '9876554008', address: 'Kilpauk, Chennai'        },
      { name: 'Organic Bliss Brand',    phone: '9876554009', address: 'Nungambakkam, Chennai'   },
      { name: 'Karthik Textile House',  phone: '9876554010', address: 'Perambur, Chennai'       },
    ],
    jobTemplates: [
      { workType: 'Wedding photography (full day)',  minVal: 20000, maxVal: 60000, matRatio: 0 },
      { workType: 'Pre-wedding shoot',               minVal: 8000,  maxVal: 25000, matRatio: 0 },
      { workType: 'Corporate event photography',     minVal: 8000,  maxVal: 20000, matRatio: 0 },
      { workType: 'Product photography (batch)',     minVal: 4000,  maxVal: 15000, matRatio: 0 },
      { workType: 'Birthday / party shoot',          minVal: 3000,  maxVal: 8000,  matRatio: 0 },
      { workType: 'Maternity / baby shoot',          minVal: 5000,  maxVal: 12000, matRatio: 0 },
      { workType: 'Real estate photography',         minVal: 4000,  maxVal: 10000, matRatio: 0 },
      { workType: 'College annual day coverage',     minVal: 6000,  maxVal: 15000, matRatio: 0 },
    ],
    matItems: {},
    expenseItems: [
      { note: 'Travel & logistics',       category: 'TRAVEL',   minAmt: 800,  maxAmt: 2500 },
      { note: 'Cloud storage (Google)',    category: 'TOOL',     minAmt: 500,  maxAmt: 500  },
      { note: 'Lightroom subscription',   category: 'TOOL',     minAmt: 799,  maxAmt: 799  },
      { note: 'Memory cards / hard disk', category: 'TOOL',     minAmt: 0,    maxAmt: 4000 },
      { note: 'Printing & packaging',     category: 'MATERIAL', minAmt: 300,  maxAmt: 1500 },
    ],
  },
];

// ── SEED ONE FREELANCER ────────────────────────────────────────────────────────
async function seedFreelancer(profile) {
  console.log(`\n  ── ${profile.name} (${profile.email}) ──`);

  // Skip if already exists
  let tenant = await prisma.tenant.findUnique({ where: { email: profile.email } });
  if (tenant) {
    console.log(`  ⚡ Already exists — resetting password only`);
    const u = await prisma.user.findFirst({ where: { tenantId: tenant.id } });
    if (u) await prisma.user.update({ where: { id: u.id }, data: { password: hash(PASS), isEmailVerified: true } });
    return;
  }

  // Tenant
  tenant = await prisma.tenant.create({
    data: { name: profile.businessName, businessType: 'FREELANCER', email: profile.email, phone: profile.phone, city: profile.city, modules: FL_MODULES },
  });
  const tid = tenant.id;

  // User
  await prisma.user.create({
    data: { tenantId: tid, name: profile.name, email: profile.email, password: hash(PASS), role: 'OWNER', isEmailVerified: true },
  });
  console.log(`  ✓ Tenant + user`);

  // Helpers
  const helperMap = {};
  for (const h of profile.helpers) {
    const helper = await prisma.flHelper.create({ data: { tenantId: tid, ...h } });
    helperMap[helper.id] = helper;
  }
  const helperIds = Object.keys(helperMap);

  // Partners
  for (const p of profile.partners) {
    await prisma.flPartner.create({ data: { tenantId: tid, ...p } });
  }

  // Suppliers
  for (const s of profile.suppliers) {
    await prisma.flSupplier.create({ data: { tenantId: tid, ...s } });
  }

  // Tools
  for (const t of profile.tools) {
    await prisma.flTool.create({
      data: { tenantId: tid, name: t.name, cost: t.cost, condition: t.condition, purchaseDate: daysAgo(randInt(60, 500)) },
    });
  }

  // Clients
  for (const c of profile.clients) {
    await prisma.flClient.create({ data: { tenantId: tid, ...c } });
  }

  // AMC contracts
  for (const a of profile.amc) {
    await prisma.flAMC.create({
      data: { tenantId: tid, clientName: a.clientName, clientPhone: a.clientPhone, workType: a.workType, annualFee: a.annualFee, type: 'AMC', startDate: daysAgo(300), endDate: daysAhead(65) },
    });
  }
  console.log(`  ✓ Helpers: ${profile.helpers.length} | Partners: ${profile.partners.length} | Tools: ${profile.tools.length} | Clients: ${profile.clients.length} | AMC: ${profile.amc.length}`);

  // Jobs — 65-75 across 12 months
  const jobCount = randInt(65, 75);
  const clientNames = profile.clients.map(c => c.name);
  let jobNum = 1;
  let totalMat = 0, totalPay = 0;

  for (let i = 0; i < jobCount; i++) {
    const tpl    = rand(profile.jobTemplates);
    const client = rand(clientNames);
    const cData  = profile.clients.find(c => c.name === client);
    const jobVal = randInt(tpl.minVal, tpl.maxVal);
    const dAgo   = Math.floor((i / jobCount) * 365) + randInt(0, 8);
    const status = pickStatus(dAgo);
    const created = daysAgo(dAgo);

    const job = await prisma.flJob.create({
      data: {
        tenantId:      tid,
        jobNumber:     `JOB-${String(jobNum++).padStart(4, '0')}`,
        customerName:  client,
        customerPhone: cData?.phone || '',
        siteAddress:   cData?.address || '',
        workType:      tpl.workType,
        jobValue:      jobVal,
        advanceReq:    ['IN_PROGRESS','COMPLETED','CLOSED','PAYMENT_PENDING'].includes(status) ? randInt(0, Math.floor(jobVal * 0.4)) : 0,
        status,
        startDate:     created,
        endDate:       ['COMPLETED','CLOSED'].includes(status) ? new Date(created.getTime() + randInt(1, 7) * 86_400_000) : null,
        createdAt:     created,
        updatedAt:     created,
      },
    });

    // Materials
    const matList = profile.matItems[tpl.workType];
    if (matList && tpl.matRatio > 0 && ['IN_PROGRESS','COMPLETED','CLOSED','PAYMENT_PENDING'].includes(status)) {
      for (const m of matList.slice(0, randInt(1, matList.length))) {
        const qty  = randInt(2, 8);
        const rate = randInt(m.rMin, m.rMax);
        await prisma.flMaterial.create({
          data: { tenantId: tid, jobId: job.id, name: m.name, qty, unit: m.unit, rate, total: qty * rate, purchaseDate: created },
        });
        totalMat++;
      }
    }

    // Payment
    if (['COMPLETED','CLOSED','PAYMENT_PENDING'].includes(status)) {
      const pctPaid = status === 'CLOSED' ? randInt(85, 100) / 100 : status === 'COMPLETED' ? randInt(55, 100) / 100 : randInt(15, 55) / 100;
      const amt = Math.round(jobVal * pctPaid);
      if (amt > 0) {
        const payDate = new Date(created.getTime() + randInt(1, 10) * 86_400_000);
        await prisma.flPayment.create({
          data: { tenantId: tid, jobId: job.id, amount: amt, mode: rand(['CASH','UPI','UPI','NEFT']), paidAt: payDate, createdAt: payDate },
        });
        totalPay++;
      }
    }

    // Assign helper to ~50% of eligible jobs
    if (helperIds.length > 0 && ['IN_PROGRESS','COMPLETED','CLOSED'].includes(status) && Math.random() > 0.5) {
      const hid = rand(helperIds);
      const h   = helperMap[hid];
      const days = randInt(1, 4);
      await prisma.flJobHelper.create({
        data: { tenantId: tid, jobId: job.id, helperId: hid, daysWorked: days, totalWages: days * h.dailyRate },
      }).catch(() => {});
    }
  }
  console.log(`  ✓ Jobs: ${jobCount} | Materials: ${totalMat} | Payments: ${totalPay}`);

  // Monthly expenses — 12 months
  let expCount = 0;
  for (let mo = 0; mo < 12; mo++) {
    const moDate = daysAgo(365 - mo * 30);
    const eligible = profile.expenseItems.filter(e => e.maxAmt > 0);
    const picks = eligible.slice(0, randInt(2, Math.min(3, eligible.length)));
    for (const exp of picks) {
      const amt = randInt(exp.minAmt || 1, exp.maxAmt);
      if (amt <= 0) continue;
      await prisma.flExpense.create({
        data: {
          tenantId:    tid,
          note:        exp.note,
          category:    exp.category,
          amount:      amt,
          expenseDate: new Date(moDate.getTime() + randInt(0, 25) * 86_400_000),
        },
      });
      expCount++;
    }
  }
  console.log(`  ✓ Expenses: ${expCount}`);
}

async function main() {
  console.log('\n🚀 Seeding 5 freelancers with 1 year of data...\n');
  for (const p of PROFILES) {
    await seedFreelancer(p);
  }
  console.log('\n\n✅ Done!\n');
  console.log('  Password for all: Freelancer@2026\n');
  console.log('  ramesh@elec.test   → Electrician     (Mumbai)');
  console.log('  priya@design.test  → Graphic Designer (Bangalore)');
  console.log('  suresh@plumb.test  → Plumber          (Ahmedabad)');
  console.log('  ankit@fit.test     → Fitness Trainer  (Delhi)');
  console.log('  kavya@photo.test   → Photographer    (Chennai)\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
