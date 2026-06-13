/**
 * Syllabrix — 5 Freelancer Demo Seeds (1 Year of Realistic Data)
 * Each profile has a different module set stored in sidebarConfig
 *
 * node prisma/seed-freelancers.js
 *
 * Credentials (password: Freelancer@2026)
 *  ramesh@elec.test   — Electrician (Mumbai)
 *  priya@design.test  — Graphic Designer (Bangalore)
 *  suresh@plumb.test  — Plumber (Ahmedabad)
 *  ankit@fit.test     — Fitness Trainer (Delhi)
 *  kavya@photo.test   — Photographer (Chennai)
 */

require('dotenv').config({ path: process.env.ENV_FILE || '.env.quality' });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PASS = 'Freelancer@2026';
const hash = (p) => bcrypt.hashSync(p, 10);
const rand  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randN = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo   = (n) => new Date(Date.now() - n * 86_400_000);
const daysAhead = (n) => new Date(Date.now() + n * 86_400_000);
const jitter = (base, pct) => Math.round(base * (1 + (Math.random() - 0.5) * pct));

function jobStatus(daysCreatedAgo) {
  if (daysCreatedAgo > 270) return rand(['CLOSED','CLOSED','CANCELLED']);
  if (daysCreatedAgo > 150) return rand(['CLOSED','COMPLETED','PAYMENT_PENDING']);
  if (daysCreatedAgo > 60)  return rand(['COMPLETED','PAYMENT_PENDING','IN_PROGRESS']);
  if (daysCreatedAgo > 20)  return rand(['IN_PROGRESS','COMPLETED','PAYMENT_PENDING']);
  return rand(['ENQUIRY','ESTIMATE_SENT','IN_PROGRESS']);
}

// ─────────────────────────────────────────────────────────────────────────────
//  PROFILE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

const PROFILES = [

  // ── 1. ELECTRICIAN (Mumbai) ──────────────────────────────────────────────
  {
    email: 'ramesh@elec.test', name: 'Ramesh Kumar', businessName: 'Ramesh Electricals',
    city: 'Mumbai', phone: '9876540001',

    activeModules: ['jobs','clients','finance','expenses','bills','team','suppliers','tools','amc'],
    moduleLabels: { jobs: 'Work Orders', bills: 'Payments Due' },

    helpers: [
      { name: 'Raju Yadav',   phone: '9876541001', skill: 'Wiring helper', dailyRate: 600 },
      { name: 'Santosh More', phone: '9876541002', skill: 'Helper',        dailyRate: 500 },
    ],
    partners: [
      { name: 'AC Cool Services', phone: '9876541003', skill: 'AC installation & gas refill', notes: '30% revenue share on AC jobs' },
    ],
    suppliers: [
      { name: 'Sharma Electricals', ownerName: 'Vijay Sharma', phone: '9876542001', materials: 'Wires, MCBs, switches, sockets', area: 'Dadar, Mumbai', credit: 15000, outstanding: 4200 },
      { name: 'Price Power Mart',   ownerName: 'Rakesh Gupta', phone: '9876542002', materials: 'DB boxes, conduits, cable trays',  area: 'Andheri, Mumbai', credit: 10000, outstanding: 0 },
    ],
    tools: [
      { name: 'Bosch Drill Machine GBH 200', cost: 5800, condition: 'GOOD',          purchaseDaysAgo: 420 },
      { name: 'Fluke Digital Multimeter',    cost: 3200, condition: 'GOOD',          purchaseDaysAgo: 310 },
      { name: 'Aluminium Ladder 6ft',        cost: 2400, condition: 'GOOD',          purchaseDaysAgo: 580 },
      { name: 'Wire Stripper Set',           cost: 950,  condition: 'NEEDS_SERVICE', purchaseDaysAgo: 200 },
      { name: 'Voltage Tester Pen',          cost: 380,  condition: 'GOOD',          purchaseDaysAgo: 120 },
    ],
    amc: [
      { clientName: 'Mehta Apartment CHS',  clientPhone: '9876550011', workType: 'Annual electrical maintenance — common area wiring, DB inspection, emergency support', annualFee: 22000, startDaysAgo: 300, endDaysAhead: 65 },
      { clientName: 'Sunrise Office Park',  clientPhone: '9876550012', workType: 'Quarterly wiring checkup + 24-hour emergency support for 3-floor office', annualFee: 36000, startDaysAgo: 280, endDaysAhead: 85 },
      { clientName: "Riya's Restaurant",    clientPhone: '9876550013', workType: 'Monthly kitchen electrical safety inspection + panel maintenance', annualFee: 14400, startDaysAgo: 200, endDaysAhead: 165 },
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
      { name: 'Mehta Apartment CHS', phone: '9876550011', address: 'Bandra East, Mumbai'    },
      { name: 'Sunrise Office Park', phone: '9876550012', address: 'BKC, Mumbai'            },
      { name: "Riya's Restaurant",   phone: '9876550013', address: 'Juhu, Mumbai'           },
      { name: 'Dilip Sawant',        phone: '9876550014', address: 'Dadar, Mumbai'          },
    ],
    jobs: [
      { workType: 'New wiring (1BHK)',        baseVal: 7500,  matRatio: 0.45, freq: 10, withHelper: true  },
      { workType: 'New wiring (2BHK)',        baseVal: 14000, matRatio: 0.45, freq: 6,  withHelper: true  },
      { workType: 'Fan installation',          baseVal: 550,   matRatio: 0.2,  freq: 20, withHelper: false },
      { workType: 'MCB / DB box repair',      baseVal: 1400,  matRatio: 0.35, freq: 14, withHelper: false },
      { workType: 'AC wiring & power point',  baseVal: 2200,  matRatio: 0.3,  freq: 12, withHelper: false },
      { workType: 'Inverter / UPS install',   baseVal: 1800,  matRatio: 0.4,  freq: 8,  withHelper: false },
      { workType: 'Light fitting (set)',       baseVal: 700,   matRatio: 0.25, freq: 16, withHelper: false },
      { workType: 'Earthing / spike guard',   baseVal: 1200,  matRatio: 0.3,  freq: 6,  withHelper: false },
      { workType: 'Rewiring (apartment)',      baseVal: 18000, matRatio: 0.5,  freq: 3,  withHelper: true  },
      { workType: 'Generator wiring',         baseVal: 4500,  matRatio: 0.35, freq: 4,  withHelper: true  },
    ],
    matItems: {
      'New wiring (1BHK)':       [{ name: 'Copper wire 2.5sqmm (50m)', qty: 2, unit: 'roll', rateRange: [900, 1200] }, { name: 'PVC conduit (10m)', qty: 5, unit: 'pcs', rateRange: [35, 55] }],
      'New wiring (2BHK)':       [{ name: 'Copper wire 4sqmm (50m)',   qty: 3, unit: 'roll', rateRange: [1300, 1700] }, { name: 'DB box 8-way', qty: 1, unit: 'pcs', rateRange: [420, 550] }],
      'Rewiring (apartment)':    [{ name: 'Copper wire 4sqmm (50m)',   qty: 5, unit: 'roll', rateRange: [1300, 1700] }, { name: 'DB box 12-way', qty: 1, unit: 'pcs', rateRange: [600, 800] }],
      'AC wiring & power point': [{ name: 'Armoured cable 4C 10m',    qty: 1, unit: 'pcs',  rateRange: [350, 550]  }],
      'MCB / DB box repair':     [{ name: 'MCB 32A',                  qty: 2, unit: 'pcs',  rateRange: [130, 190]  }],
    },
    expenses: [
      { note: 'Petrol & auto rickshaw',   category: 'TRAVEL', minAmt: 800,  maxAmt: 1800 },
      { note: 'Tool service & sharpening',category: 'TOOL',   minAmt: 200,  maxAmt: 700  },
      { note: 'Mobile recharge + data',   category: 'PHONE',  minAmt: 299,  maxAmt: 399  },
      { note: 'Food & chai at site',      category: 'OTHER',  minAmt: 350,  maxAmt: 800  },
    ],
  },

  // ── 2. GRAPHIC DESIGNER (Bangalore) ──────────────────────────────────────
  {
    email: 'priya@design.test', name: 'Priya Nair', businessName: 'Priya Creative Studio',
    city: 'Bangalore', phone: '9876540002',

    activeModules: ['jobs','clients','finance','expenses','bills','team'],
    moduleLabels: { jobs: 'Projects', clients: 'Clients', team: 'Collaborators', expenses: 'Overheads', bills: 'Outstanding' },

    helpers: [],
    partners: [
      { name: 'Arun Dev (Web Developer)', phone: '9876543001', skill: 'Frontend web development', notes: '40% revenue share on web projects' },
      { name: 'Sneha Copywriter',         phone: '9876543002', skill: 'Content & copywriting',    notes: '25% share on full brand projects' },
    ],
    suppliers: [],
    tools:    [],
    amc:      [],
    clients: [
      { name: 'Raj Mehta Startup',    phone: '9876551001', address: 'Koramangala, Bangalore'      },
      { name: 'Zest Cafe Chain',       phone: '9876551002', address: 'Indiranagar, Bangalore'      },
      { name: 'GreenLeaf Organics',    phone: '9876551003', address: 'HSR Layout, Bangalore'       },
      { name: 'TechBridge Solutions',  phone: '9876551004', address: 'Electronic City, Bangalore'  },
      { name: 'Anika Fashion House',   phone: '9876551005', address: 'Commercial Street, Bangalore'},
      { name: 'Dr. Preethi Clinic',    phone: '9876551006', address: 'Jayanagar, Bangalore'        },
      { name: 'Horizon Real Estate',   phone: '9876551007', address: 'Whitefield, Bangalore'       },
      { name: 'Namma Kitchen',         phone: '9876551008', address: 'BTM Layout, Bangalore'       },
      { name: 'Spark Academy',         phone: '9876551009', address: 'Rajajinagar, Bangalore'      },
      { name: 'BlueOcean Travels',     phone: '9876551010', address: 'MG Road, Bangalore'          },
    ],
    jobs: [
      { workType: 'Brand identity (logo + kit)',       baseVal: 22000, matRatio: 0, freq: 6  },
      { workType: 'Social media package (monthly)',    baseVal: 12000, matRatio: 0, freq: 18 },
      { workType: 'Brochure / flyer design',           baseVal: 4500,  matRatio: 0, freq: 10 },
      { workType: 'Packaging design',                  baseVal: 14000, matRatio: 0, freq: 4  },
      { workType: 'Website UI design',                 baseVal: 28000, matRatio: 0, freq: 5  },
      { workType: 'Business card + letterhead',        baseVal: 2200,  matRatio: 0, freq: 8  },
      { workType: 'Presentation deck (20 slides)',     baseVal: 8000,  matRatio: 0, freq: 6  },
      { workType: 'Product photo editing (50 images)', baseVal: 4000,  matRatio: 0, freq: 8  },
      { workType: 'Email template design',             baseVal: 5500,  matRatio: 0, freq: 4  },
    ],
    matItems: {},
    expenses: [
      { note: 'Adobe Creative Cloud (annual)',  category: 'TOOL',     minAmt: 4999, maxAmt: 4999 },
      { note: 'Canva Pro',                      category: 'TOOL',     minAmt: 3999, maxAmt: 3999 },
      { note: 'Figma (professional)',           category: 'TOOL',     minAmt: 1200, maxAmt: 1200 },
      { note: 'Electricity + internet (home)',  category: 'OTHER',    minAmt: 1800, maxAmt: 2800 },
      { note: 'Premium stock photos/vectors',   category: 'MATERIAL', minAmt: 800,  maxAmt: 2500 },
      { note: 'Google Drive + cloud backup',    category: 'TOOL',     minAmt: 650,  maxAmt: 650  },
    ],
  },

  // ── 3. PLUMBER (Ahmedabad) ───────────────────────────────────────────────
  {
    email: 'suresh@plumb.test', name: 'Suresh Patel', businessName: 'Suresh Plumbing Works',
    city: 'Ahmedabad', phone: '9876540003',

    activeModules: ['jobs','clients','finance','expenses','bills','team','suppliers','tools','amc'],
    moduleLabels: { jobs: 'Service Calls', tools: 'Equipment' },

    helpers: [
      { name: 'Ramji Solanki',  phone: '9876544001', skill: 'Plumbing assistant', dailyRate: 450 },
      { name: 'Bhavesh Mistry', phone: '9876544002', skill: 'Helper',             dailyRate: 380 },
    ],
    partners: [],
    suppliers: [
      { name: 'Patel Plumbing Mart', ownerName: 'Kiran Patel', phone: '9876545001', materials: 'CPVC pipes, fittings, valves, taps', area: 'Kalupur, Ahmedabad', credit: 12000, outstanding: 2800 },
      { name: 'Hardware King',        ownerName: 'Sunil Shah',  phone: '9876545002', materials: 'General hardware, sealants, grout',  area: 'Raipur, Ahmedabad',  credit: 6000,  outstanding: 0   },
    ],
    tools: [
      { name: 'RIDGID Pipe Cutter',        cost: 1200, condition: 'GOOD',          purchaseDaysAgo: 380 },
      { name: 'Pipe wrench 18" (Taparia)', cost: 1100, condition: 'GOOD',          purchaseDaysAgo: 450 },
      { name: 'Drain snake 15mtr',         cost: 2200, condition: 'NEEDS_SERVICE', purchaseDaysAgo: 280 },
      { name: 'Hacksaw frame',             cost: 380,  condition: 'GOOD',          purchaseDaysAgo: 600 },
      { name: 'Thread seal tape (bulk)',   cost: 220,  condition: 'GOOD',          purchaseDaysAgo: 90  },
    ],
    amc: [
      { clientName: 'Patel Residency CHS', clientPhone: '9876552006', workType: 'Monthly drainage + overhead tank checkup for 24-unit CHS', annualFee: 15600, startDaysAgo: 280, endDaysAhead: 85  },
      { clientName: 'Royal Comfort Hotel', clientPhone: '9876552007', workType: 'Quarterly full plumbing maintenance (3 floors, 40 rooms)',  annualFee: 24000, startDaysAgo: 180, endDaysAhead: 185 },
    ],
    clients: [
      { name: 'Hasmukh Patel',       phone: '9876552001', address: 'Navrangpura, Ahmedabad' },
      { name: 'Rekha Shah',          phone: '9876552002', address: 'Satellite, Ahmedabad'   },
      { name: 'Bharat Mehta',        phone: '9876552003', address: 'Vastrapur, Ahmedabad'   },
      { name: 'Asha Desai',          phone: '9876552004', address: 'Maninagar, Ahmedabad'   },
      { name: 'Jayesh Modi',         phone: '9876552005', address: 'Bopal, Ahmedabad'       },
      { name: 'Patel Residency CHS', phone: '9876552006', address: 'Chandkheda, Ahmedabad'  },
      { name: 'Royal Comfort Hotel', phone: '9876552007', address: 'CG Road, Ahmedabad'     },
      { name: 'Kiran Joshi',         phone: '9876552008', address: 'Gota, Ahmedabad'        },
      { name: 'Meena Trivedi',       phone: '9876552009', address: 'Thaltej, Ahmedabad'     },
    ],
    jobs: [
      { workType: 'Leakage repair (pipe)',      baseVal: 900,  matRatio: 0.4,  freq: 24 },
      { workType: 'New tap installation',       baseVal: 750,  matRatio: 0.45, freq: 18 },
      { workType: 'Drainage cleaning',          baseVal: 1200, matRatio: 0.1,  freq: 16 },
      { workType: 'Bathroom fitting (full)',    baseVal: 5500, matRatio: 0.5,  freq: 8  },
      { workType: 'Water tank repair',          baseVal: 1800, matRatio: 0.3,  freq: 10 },
      { workType: 'Pipe replacement (section)', baseVal: 3200, matRatio: 0.55, freq: 6  },
      { workType: 'WC / flush mechanism',       baseVal: 950,  matRatio: 0.45, freq: 12 },
      { workType: 'Overhead tank cleaning',     baseVal: 1100, matRatio: 0.05, freq: 8  },
      { workType: 'Hot water geyser install',   baseVal: 2400, matRatio: 0.35, freq: 4  },
    ],
    matItems: {
      'Bathroom fitting (full)':   [{ name: 'CPVC pipe 3/4"', qty: 8,  unit: 'mtr', rateRange: [55, 80]  }, { name: 'Elbow joint', qty: 12, unit: 'pcs', rateRange: [20, 35] }],
      'Pipe replacement (section)':[{ name: 'PVC pipe 1"',    qty: 5,  unit: 'mtr', rateRange: [60, 90]  }, { name: 'M-seal / compound', qty: 2, unit: 'pcs', rateRange: [50, 70] }],
      'New tap installation':      [{ name: 'Tap washer set', qty: 1,  unit: 'set', rateRange: [60, 90]  }, { name: 'Teflon tape', qty: 2, unit: 'roll', rateRange: [20, 35] }],
      'Hot water geyser install':  [{ name: 'CPVC pipe 1/2"', qty: 4,  unit: 'mtr', rateRange: [45, 65]  }],
    },
    expenses: [
      { note: 'Transport (city rides)', category: 'TRAVEL', minAmt: 500,  maxAmt: 1100 },
      { note: 'Food & refreshments',    category: 'OTHER',  minAmt: 300,  maxAmt: 600  },
      { note: 'Tool maintenance',       category: 'TOOL',   minAmt: 150,  maxAmt: 500  },
      { note: 'Mobile + internet',      category: 'PHONE',  minAmt: 299,  maxAmt: 399  },
    ],
  },

  // ── 4. FITNESS TRAINER (Delhi) ───────────────────────────────────────────
  {
    email: 'ankit@fit.test', name: 'Ankit Verma', businessName: 'Ankit Fitness Pro',
    city: 'Delhi', phone: '9876540004',

    activeModules: ['jobs','clients','finance','expenses','bills','team'],
    moduleLabels: { jobs: 'Sessions & Packages', clients: 'Members', expenses: 'Business Costs', team: 'Network' },

    helpers: [],
    partners: [
      { name: 'Riya Arora (Dietitian)', phone: '9876546001', skill: 'Sports nutrition & diet planning', notes: '20% share on combo fitness+diet packages' },
      { name: 'SportFit Gym',           phone: '9876546002', skill: 'Gym space collaboration',          notes: 'Space-sharing arrangement — 3 mornings/week' },
    ],
    suppliers: [],
    tools:    [],
    amc:      [],
    clients: [
      { name: 'Rahul Sharma',    phone: '9876553001', address: 'Saket, Delhi'           },
      { name: 'Nidhi Gupta',     phone: '9876553002', address: 'Vasant Kunj, Delhi'     },
      { name: 'Ajay Malhotra',   phone: '9876553003', address: 'Dwarka, Delhi'          },
      { name: 'Shruti Kapoor',   phone: '9876553004', address: 'Rohini, Delhi'          },
      { name: 'Vikas Bansal',    phone: '9876553005', address: 'Pitampura, Delhi'       },
      { name: 'Pooja Soni',      phone: '9876553006', address: 'Janakpuri, Delhi'       },
      { name: 'Sharma Family',   phone: '9876553007', address: 'Lajpat Nagar, Delhi'   },
      { name: 'TechCorp Office', phone: '9876553008', address: 'Cyber City, Gurugram'   },
      { name: 'Sanjay Bhatia',   phone: '9876553009', address: 'Greater Kailash, Delhi' },
      { name: 'Divya Yadav',     phone: '9876553010', address: 'Noida, UP'              },
      { name: 'Priya Arora',     phone: '9876553011', address: 'Gurgaon, Haryana'       },
      { name: 'Rohan Mehra',     phone: '9876553012', address: 'Karol Bagh, Delhi'      },
    ],
    jobs: [
      { workType: 'Monthly PT package (12 sessions)', baseVal: 6000,  matRatio: 0, freq: 20 },
      { workType: 'Online coaching (monthly plan)',    baseVal: 3500,  matRatio: 0, freq: 12 },
      { workType: 'Weight loss programme (3 months)', baseVal: 15000, matRatio: 0, freq: 4  },
      { workType: 'Home training visit (1 session)',  baseVal: 800,   matRatio: 0, freq: 16 },
      { workType: 'Diet + fitness combo plan',        baseVal: 4500,  matRatio: 0, freq: 8  },
      { workType: 'Corporate wellness session',       baseVal: 5500,  matRatio: 0, freq: 6  },
      { workType: 'Group yoga class (10 sessions)',   baseVal: 2000,  matRatio: 0, freq: 10 },
      { workType: 'Body transformation programme',   baseVal: 22000, matRatio: 0, freq: 2  },
      { workType: 'Posture correction plan',         baseVal: 7000,  matRatio: 0, freq: 3  },
    ],
    matItems: {},
    expenses: [
      { note: 'Metro + auto (travel to clients)',     category: 'TRAVEL',   minAmt: 700,  maxAmt: 1400 },
      { note: 'Protein supplements (personal stock)', category: 'MATERIAL', minAmt: 1500, maxAmt: 2800 },
      { note: 'YouTube Premium + editing apps',       category: 'TOOL',     minAmt: 300,  maxAmt: 600  },
      { note: 'Mobile + internet data',               category: 'PHONE',    minAmt: 499,  maxAmt: 699  },
      { note: 'CPD course / webinar',                 category: 'OTHER',    minAmt: 500,  maxAmt: 3500 },
    ],
  },

  // ── 5. PHOTOGRAPHER (Chennai) ────────────────────────────────────────────
  {
    email: 'kavya@photo.test', name: 'Kavya Iyer', businessName: 'Kavya Iyer Photography',
    city: 'Chennai', phone: '9876540005',

    activeModules: ['jobs','clients','finance','expenses','bills','team','tools','amc'],
    moduleLabels: { jobs: 'Shoots & Projects', clients: 'Clients', team: 'Crew', tools: 'Gear', amc: 'Retainers' },

    helpers: [
      { name: 'Karthik R', phone: '9876547001', skill: 'Lighting assistant & photo assistant', dailyRate: 1000 },
    ],
    partners: [
      { name: 'Vignesh Films',      phone: '9876547002', skill: 'Videography & reels',     notes: '35% share on video combo packages' },
      { name: 'PrintHouse Chennai', phone: '9876547003', skill: 'Album & print delivery', notes: 'Vendor — prints at ₹12/photo' },
    ],
    suppliers: [],
    tools: [
      { name: 'Sony Alpha A7 IV',           cost: 234000, condition: 'GOOD',          purchaseDaysAgo: 180 },
      { name: 'Sony FE 85mm f/1.4 GM Lens', cost: 148000, condition: 'GOOD',          purchaseDaysAgo: 180 },
      { name: 'Sony FE 24-70mm f/2.8 GM',   cost: 165000, condition: 'GOOD',          purchaseDaysAgo: 365 },
      { name: 'Godox AD200 Pro Flash',       cost: 19500,  condition: 'GOOD',          purchaseDaysAgo: 280 },
      { name: 'DJI Mini 3 Pro (drone)',      cost: 78000,  condition: 'GOOD',          purchaseDaysAgo: 210 },
      { name: 'Manfrotto 055 Tripod',        cost: 14500,  condition: 'NEEDS_SERVICE', purchaseDaysAgo: 480 },
      { name: 'Zhiyun Crane M3 Gimbal',      cost: 22000,  condition: 'GOOD',          purchaseDaysAgo: 150 },
    ],
    amc: [
      { clientName: 'The Grand Banquet Hall', clientPhone: '9876554003', workType: 'Priority partner — first right of refusal on all events, 2 shoots/month guaranteed', annualFee: 36000, startDaysAgo: 250, endDaysAhead: 115 },
      { clientName: 'Sunshine Studio',         clientPhone: '9876554004', workType: 'Monthly product photography retainer — 60 SKUs/month + editing',                    annualFee: 28800, startDaysAgo: 180, endDaysAhead: 185 },
    ],
    clients: [
      { name: 'Arjun & Priya (Wedding)',  phone: '9876554001', address: 'Adyar, Chennai'         },
      { name: 'Kumar & Associates',       phone: '9876554002', address: 'Anna Nagar, Chennai'     },
      { name: 'The Grand Banquet Hall',   phone: '9876554003', address: 'T Nagar, Chennai'        },
      { name: 'Sunshine Studio',          phone: '9876554004', address: 'Mylapore, Chennai'       },
      { name: 'Ramesh Exports Ltd',       phone: '9876554005', address: 'Guindy, Chennai'         },
      { name: 'Priya & Vikram Wedding',   phone: '9876554006', address: 'Velachery, Chennai'      },
      { name: 'SRM College',              phone: '9876554007', address: 'Kattankulathur, Chennai' },
      { name: 'Organic Bliss Brand',      phone: '9876554009', address: 'Nungambakkam, Chennai'   },
      { name: 'Karthik Textile House',    phone: '9876554010', address: 'Perambur, Chennai'       },
      { name: 'Meenakshi Jewellers',      phone: '9876554011', address: 'Pondy Bazaar, Chennai'   },
    ],
    jobs: [
      { workType: 'Wedding photography (full day)',  baseVal: 42000, matRatio: 0, freq: 6  },
      { workType: 'Pre-wedding shoot',               baseVal: 16000, matRatio: 0, freq: 5  },
      { workType: 'Corporate event photography',     baseVal: 14000, matRatio: 0, freq: 6  },
      { workType: 'Product photography (batch)',     baseVal: 7500,  matRatio: 0, freq: 10 },
      { workType: 'Birthday / party shoot',          baseVal: 5500,  matRatio: 0, freq: 6  },
      { workType: 'Maternity / newborn shoot',       baseVal: 8500,  matRatio: 0, freq: 4  },
      { workType: 'Real estate photography',         baseVal: 5000,  matRatio: 0, freq: 5  },
      { workType: 'College annual day coverage',     baseVal: 10000, matRatio: 0, freq: 3  },
      { workType: 'Brand campaign shoot (full day)', baseVal: 35000, matRatio: 0, freq: 2  },
      { workType: 'Headshot / portfolio session',    baseVal: 3500,  matRatio: 0, freq: 8  },
    ],
    matItems: {},
    expenses: [
      { note: 'Travel & cab to shoots',         category: 'TRAVEL',   minAmt: 1200, maxAmt: 3200 },
      { note: 'Adobe LR + PS subscription',     category: 'TOOL',     minAmt: 1675, maxAmt: 1675 },
      { note: 'Cloud storage (Google One 2TB)', category: 'TOOL',     minAmt: 650,  maxAmt: 650  },
      { note: 'Memory cards / extra batteries', category: 'TOOL',     minAmt: 500,  maxAmt: 5500 },
      { note: 'Printing & album delivery',      category: 'MATERIAL', minAmt: 1500, maxAmt: 5000 },
      { note: 'Props / backdrop fabric',        category: 'MATERIAL', minAmt: 500,  maxAmt: 2500 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SEED ONE PROFILE
// ─────────────────────────────────────────────────────────────────────────────

async function seedProfile(p) {
  console.log(`\n  ─── ${p.name}  (${p.email}) ───`);

  let tenant = await prisma.tenant.findUnique({ where: { email: p.email } });
  if (tenant) {
    console.log('  ⚡ Exists — cleaning and re-seeding');
    const tid = tenant.id;
    await prisma.flJobHelper.deleteMany({ where: { tenantId: tid } });
    await prisma.flPayment.deleteMany({ where: { tenantId: tid } });
    await prisma.flMaterial.deleteMany({ where: { tenantId: tid } });
    const estimateIds = (await prisma.flEstimate.findMany({ where: { tenantId: tid }, select: { id: true } })).map(e => e.id);
    if (estimateIds.length) await prisma.flEstimateItem.deleteMany({ where: { estimateId: { in: estimateIds } } });
    await prisma.flEstimate.deleteMany({ where: { tenantId: tid } });
    await prisma.flJob.deleteMany({ where: { tenantId: tid } });
    await prisma.flExpense.deleteMany({ where: { tenantId: tid } });
    await prisma.flHelper.deleteMany({ where: { tenantId: tid } });
    await prisma.flPartner.deleteMany({ where: { tenantId: tid } });
    await prisma.flSupplier.deleteMany({ where: { tenantId: tid } });
    await prisma.flTool.deleteMany({ where: { tenantId: tid } });
    await prisma.flAMC.deleteMany({ where: { tenantId: tid } });
    await prisma.flClient.deleteMany({ where: { tenantId: tid } });
    await prisma.user.deleteMany({ where: { tenantId: tid } });
    await prisma.tenant.delete({ where: { id: tid } });
  }

  tenant = await prisma.tenant.create({
    data: {
      name: p.businessName, businessType: 'FREELANCER',
      email: p.email, phone: p.phone, city: p.city,
      modules: ['invoices','expenses','customers','reports','assets','ai'],
      sidebarConfig: { flModules: p.activeModules },
      labelConfig:   { flLabels:  p.moduleLabels  },
    },
  });
  const tid = tenant.id;

  await prisma.user.create({
    data: { tenantId: tid, name: p.name, email: p.email, password: hash(PASS), role: 'OWNER', isEmailVerified: true },
  });

  const helperObjs = [];
  for (const h of p.helpers) {
    const helper = await prisma.flHelper.create({ data: { tenantId: tid, ...h } });
    helperObjs.push(helper);
  }
  for (const pt of p.partners) {
    await prisma.flPartner.create({ data: { tenantId: tid, ...pt } });
  }
  for (const s of p.suppliers) {
    await prisma.flSupplier.create({ data: { tenantId: tid, ...s } });
  }
  for (const t of p.tools) {
    await prisma.flTool.create({ data: { tenantId: tid, name: t.name, cost: t.cost, condition: t.condition, purchaseDate: daysAgo(t.purchaseDaysAgo) } });
  }
  for (const c of p.clients) {
    await prisma.flClient.create({ data: { tenantId: tid, ...c } });
  }
  for (const a of p.amc) {
    await prisma.flAMC.create({
      data: {
        tenantId: tid,
        clientName: a.clientName, clientPhone: a.clientPhone,
        workType: a.workType, annualFee: a.annualFee, type: 'AMC',
        startDate: daysAgo(a.startDaysAgo), endDate: daysAhead(a.endDaysAhead),
      },
    });
  }

  const totalFreq = p.jobs.reduce((s, j) => s + j.freq, 0);
  const jobCount  = randN(68, 82);
  let jobNum = 1, totalMat = 0, totalPay = 0, totalHelperAssigned = 0;

  const daysSpread = Array.from({ length: jobCount }, (_, i) =>
    Math.floor((i / jobCount) * 365) + randN(0, 5)
  ).sort((a, b) => a - b);

  for (const dAgo of daysSpread) {
    const r = Math.random() * totalFreq;
    let acc = 0, tpl = p.jobs[0];
    for (const jt of p.jobs) { acc += jt.freq; if (r <= acc) { tpl = jt; break; } }

    const jobVal      = jitter(tpl.baseVal, 0.25);
    const clientEntry = rand(p.clients);
    const status      = jobStatus(dAgo);
    const created     = daysAgo(dAgo);

    const job = await prisma.flJob.create({
      data: {
        tenantId: tid,
        jobNumber: `JOB-${String(jobNum++).padStart(4, '0')}`,
        customerName:  clientEntry.name,
        customerPhone: clientEntry.phone || '',
        siteAddress:   clientEntry.address || '',
        workType:      tpl.workType,
        jobValue:      jobVal,
        advanceReq:    ['IN_PROGRESS','COMPLETED','CLOSED','PAYMENT_PENDING'].includes(status)
                         ? Math.round(jobVal * randN(15, 35) / 100) : 0,
        status,
        startDate: created,
        endDate:   ['COMPLETED','CLOSED'].includes(status)
                     ? new Date(created.getTime() + randN(1, 9) * 86_400_000) : null,
        createdAt: created,
        updatedAt: created,
      },
    });

    const matList = p.matItems[tpl.workType];
    if (matList && tpl.matRatio > 0 && ['IN_PROGRESS','COMPLETED','CLOSED','PAYMENT_PENDING'].includes(status)) {
      for (const m of matList.slice(0, randN(1, matList.length))) {
        const qty  = randN(2, 8);
        const rate = randN(m.rateRange[0], m.rateRange[1]);
        await prisma.flMaterial.create({
          data: { tenantId: tid, jobId: job.id, name: m.name, qty, unit: m.unit, rate, total: qty * rate, purchaseDate: created },
        });
        totalMat++;
      }
    }

    if (['COMPLETED','CLOSED','PAYMENT_PENDING'].includes(status)) {
      const pctPaid = status === 'CLOSED' ? randN(88, 100) / 100
                    : status === 'COMPLETED' ? randN(60, 100) / 100
                    : randN(20, 60) / 100;
      const amt = Math.round(jobVal * pctPaid);
      if (amt > 0) {
        const payDate = new Date(created.getTime() + randN(1, 12) * 86_400_000);
        await prisma.flPayment.create({
          data: { tenantId: tid, jobId: job.id, amount: amt, mode: rand(['CASH','CASH','UPI','UPI','NEFT']), paidAt: payDate, createdAt: payDate },
        });
        totalPay++;
      }
    }

    if (helperObjs.length > 0 && tpl.withHelper && ['IN_PROGRESS','COMPLETED','CLOSED'].includes(status) && Math.random() > 0.35) {
      const h    = rand(helperObjs);
      const days = randN(1, 4);
      await prisma.flJobHelper.create({
        data: { tenantId: tid, jobId: job.id, helperId: h.id, daysWorked: days, totalWages: days * h.dailyRate },
      }).catch(() => {});
      totalHelperAssigned++;
    }
  }

  // Expenses — one entry per template per month over 12 months
  let expCount = 0;
  for (let mo = 0; mo < 12; mo++) {
    const moBase = daysAgo(365 - mo * 30);
    for (const exp of p.expenses) {
      if (exp.maxAmt <= 0) continue;
      const amt = randN(Math.max(exp.minAmt, 1), exp.maxAmt);
      if (amt <= 0) continue;
      await prisma.flExpense.create({
        data: { tenantId: tid, note: exp.note, category: exp.category, amount: amt,
                expenseDate: new Date(moBase.getTime() + randN(0, 25) * 86_400_000) },
      });
      expCount++;
    }
  }

  console.log(`  ✓ Jobs: ${jobCount} | Materials: ${totalMat} | Payments: ${totalPay} | Helper assignments: ${totalHelperAssigned}`);
  console.log(`  ✓ Expenses: ${expCount} | Helpers: ${helperObjs.length} | Tools: ${p.tools.length} | AMC: ${p.amc.length}`);
  console.log(`  ✓ Active modules: [${p.activeModules.join(', ')}]`);
}

async function main() {
  console.log('\n🚀 Seeding 5 freelancers with realistic 1-year data…\n');
  for (const p of PROFILES) await seedProfile(p);

  console.log('\n\n✅ All done!\n');
  console.log('  Password for all accounts: Freelancer@2026\n');
  PROFILES.forEach(p =>
    console.log(`  ${p.email.padEnd(24)} → ${p.name.padEnd(18)} · ${p.activeModules.length} modules active`)
  );
  console.log();
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
