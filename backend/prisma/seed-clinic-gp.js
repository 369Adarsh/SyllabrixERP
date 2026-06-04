/**
 * Seed: Sharma Medical Centre — General Physician (1-Year Full Practice)
 * SYL-BC-HLC-CL07 | CLINIC
 *
 * Login: owner@sharmamedical.test / SharmaClinic@2026
 * Staff: kavita@sharmamedical.test / SharmaClinic@2026  (Receptionist)
 *        meena@sharmamedical.test  / SharmaClinic@2026  (Nurse)
 *
 * 200 patients across 4 tiers:
 *   WEEKLY   (20)  — 48-52 visits/year  — severe chronic
 *   MONTHLY  (50)  — 10-14 visits/year  — stable chronic
 *   REGULAR  (80)  — 4-8 visits/year    — recurrent acute
 *   CASUAL   (50)  — 1-3 visits/year    — one-off visits
 *
 * Idempotent — safe to re-run.
 */

'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt           = require('bcryptjs');
const prisma           = new PrismaClient();

const dAgo = (n)   => new Date(Date.now() - n * 86_400_000);
const dob  = (y)   => new Date(Date.now() - y * 365.25 * 86_400_000);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (a,b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pad  = (n,l=5) => String(n).padStart(l,'0');
const YYMM = () => { const d=new Date(); return `${d.getFullYear().toString().slice(-2)}${pad(d.getMonth()+1,2)}`; };

const EMAIL = 'owner@sharmamedical.test';
const PASS  = 'SharmaClinic@2026';

// ── Name pools ────────────────────────────────────────────────────────────────
const MN = ['Prakash','Rajesh','Suresh','Mahesh','Ramesh','Dinesh','Naresh','Anil','Sunil','Ashok','Vinod','Manoj','Sanjay','Vijay','Ajay','Ravi','Vivek','Sanjeev','Deepak','Alok','Pradeep','Mukesh','Lokesh','Harish','Satish','Manish','Dhiraj','Rakesh','Nikhil','Rohit','Mohit','Arjun','Vikram','Varun','Pawan','Rajan','Mohan','Gopal','Venkatesh','Chandrakant','Hemant','Anand','Chetan','Lalit','Kamal','Devendra','Surendra','Narendra','Rajendra','Brijesh','Gaurav','Praveen','Ramkumar','Srinivas','Raghunath','Balakrishna','Narayanan'];
const FN = ['Sunita','Savita','Kavita','Anita','Seema','Rekha','Usha','Asha','Priya','Riya','Divya','Shreya','Pooja','Aarti','Meena','Geeta','Neeta','Rita','Lata','Sushma','Pushpa','Kamla','Vimla','Nirmala','Pramila','Shaila','Leela','Sarla','Sarita','Sumita','Smita','Swati','Jyoti','Kiran','Pallavi','Madhuri','Manisha','Rakhi','Namita','Mamta','Shanti','Prabha','Parvati','Radha','Nandini','Deepika','Vasanti','Manorama','Chandrika','Indira','Meenakshi','Shakuntala','Lalita','Malati','Sharmila','Hemlata','Supriya','Sujata','Vandita','Amita'];
const LN = ['Sharma','Verma','Gupta','Patel','Singh','Yadav','Tiwari','Mishra','Pandey','Agarwal','Joshi','Mathur','Saxena','Srivastava','Shukla','Dubey','Chaturvedi','Tripathi','Rastogi','Malhotra','Kapoor','Chopra','Mehra','Batra','Arora','Khanna','Narang','Kumar','Das','Roy','Sen','Ghosh','Chatterjee','Banerjee','Kulkarni','Desai','Naik','Patil','Gaikwad','Jadhav','Shinde','Pawar','Rao','Reddy','Naidu','Pillai','Nair','Menon','Iyer','Krishnan','Bajaj','Bhatt','Dave','Shah','Mehta','Jain','Parikh','Chandra','Lalit','Bose','Dey'];
const BLOODS = ['O+','O-','A+','A-','B+','B-','AB+','AB-'];

// ── Diagnosis templates ────────────────────────────────────────────────────────
const DX = [
  /* 0 */ { d:'Acute Viral Fever', sS:'Fever 101°F, body ache, headache, mild sore throat 2 days.', sO:'Temp 101.4°F, BP 118/76, Pulse 92. Throat mildly congested.', sA:'Acute Viral Fever + URTI', sP:'Tab Paracetamol 500mg TDS × 5d. Tab Cetirizine 10mg OD × 5d. Adequate fluids.', drugs:[['Tab Paracetamol 500mg','1','TDS','5 days'],['Tab Cetirizine 10mg','1','OD HS','5 days']], bill:300, lab:false },
  /* 1 */ { d:'Hypertension Review',  sS:'Monthly review. BP 145-155/90-96 at home. No symptoms.', sO:'BP 148/94, Pulse 78, Wt 74kg. No pedal oedema.', sA:'Essential Hypertension — suboptimal', sP:'Increase Telmisartan to 80mg OD. Low salt diet. Walk 30 min daily.', drugs:[['Tab Amlodipine 5mg','1','OD','30 days'],['Tab Telmisartan 80mg','1','OD','30 days'],['Tab Aspirin 75mg','1','OD PC','30 days']], bill:300, lab:true, labs:['RFT','Lipid Profile'] },
  /* 2 */ { d:'Diabetes Type 2 Review', sS:'FBS 185 at home, increased thirst, polyuria.', sO:'BP 134/84, Wt 82kg. Feet: no ulcer/neuropathy.', sA:'T2DM — poor glycaemic control', sP:'Increase Metformin 1000mg BD. Add Glimepiride 2mg OD AC.', drugs:[['Tab Metformin 1000mg','1','BD PC','30 days'],['Tab Glimepiride 2mg','1','OD AC','30 days']], bill:300, lab:true, labs:['HbA1c','FBS','RFT'] },
  /* 3 */ { d:'Acute Gastroenteritis', sS:'Loose stools 4-5x, nausea, vomiting, cramps. Ate outside yesterday.', sO:'Temp 99.2°F, BP 106/70, Pulse 98. Mild abdominal tenderness.', sA:'Acute Gastroenteritis — mild dehydration', sP:'Tab Norfloxacin 400mg BD × 3d. ORS after each stool. Light diet.', drugs:[['Tab Norfloxacin 400mg','1','BD','3 days'],['Tab Ondansetron 4mg','1','BD','2 days'],['ORS Sachet','200ml','After each stool','3 days']], bill:300, lab:false },
  /* 4 */ { d:'Upper Respiratory Infection', sS:'Runny nose, sneezing, mild cough, sore throat 3 days. No fever.', sO:'Temp 98.8°F. Throat injected. Chest clear.', sA:'Acute URTI — viral', sP:'Tab Cetirizine OD × 5d. Syp Chericof 10ml TDS × 5d. Warm gargles.', drugs:[['Tab Cetirizine 10mg','1','OD HS','5 days'],['Syp Chericof 100ml','10ml','TDS','5 days']], bill:300, lab:false },
  /* 5 */ { d:'Hypothyroidism Review', sS:'Routine thyroid review. Fatigue improving. Weight stable.', sO:'BP 122/80, Pulse 72, Wt 66kg. No goitre.', sA:'Primary Hypothyroidism — on treatment', sP:'Continue Thyroxine 75mcg OD empty stomach. TSH after 8 weeks.', drugs:[['Tab Thyroxine Sodium 75mcg','1','OD empty stomach','60 days']], bill:300, lab:true, labs:['TSH'] },
  /* 6 */ { d:'Asthma Exacerbation', sS:'Increased cough, wheeze, breathlessness 2 days. Using inhaler more.', sO:'RR 22/min, SpO2 95% RA. Bilateral expiratory wheeze.', sA:'Asthma exacerbation — moderate', sP:'Nebulization. Azithromycin 500mg OD × 5d. Tab Montair LC OD.', drugs:[['Tab Azithromycin 500mg','1','OD','5 days'],['Tab Montelukast + Levocetirizine','1','OD','14 days'],['Tab Prednisolone 10mg','1','BD PC','5 days']], bill:500, lab:false, proc:'Nebulization' },
  /* 7 */ { d:'Lower Back Pain', sS:'LBP radiating left thigh 1 week. Worse on bending.', sO:'Lumbar tenderness L4-L5. SLR positive 60° left. Neuro normal.', sA:'PLID L4-L5 — probable', sP:'Tab Diclofenac SR 100mg OD PC × 7d. Tab Thiocolchicoside 8mg BD × 5d. Hot fomentation.', drugs:[['Tab Diclofenac SR 100mg','1','OD PC','7 days'],['Tab Thiocolchicoside 8mg','1','BD','5 days'],['Tab Pantoprazole 40mg','1','OD AC','7 days']], bill:300, lab:false },
  /* 8 */ { d:'Iron Deficiency Anaemia', sS:'Fatigue, pallor, dyspnoea on exertion 3 weeks. Low meat intake.', sO:'Pallor+++, Koilonychia. BP 100/68. Pulse 96.', sA:'Iron Deficiency Anaemia — moderate', sP:'Tab Ferrous Sulphate + Folic Acid BD × 90d. Dietary iron. Vit C.', drugs:[['Tab Ferrous Sulphate + Folic Acid','1','BD after meals','90 days'],['Tab Vitamin C 500mg','1','OD','90 days']], bill:300, lab:true, labs:['CBC','Serum Iron','Serum Ferritin'] },
  /* 9 */ { d:'Migraine', sS:'Severe throbbing R-sided headache, nausea, photophobia 6 hours.', sO:'BP 118/78. No neck stiffness. Neuro normal.', sA:'Episodic Migraine without aura', sP:'Tab Sumatriptan 50mg at onset. Tab Propranolol 40mg OD prophylaxis.', drugs:[['Tab Sumatriptan 50mg','1','SOS at onset','—'],['Tab Propranolol 40mg','1','OD','30 days']], bill:300, lab:false },
  /* 10 */ { d:'UTI', sS:'Dysuria, frequency, urgency 2 days. Suprapubic discomfort.', sO:'Temp 98.6°F, suprapubic tenderness mild.', sA:'Uncomplicated UTI', sP:'Tab Nitrofurantoin 100mg BD PC × 5d. Increase water intake.', drugs:[['Tab Nitrofurantoin 100mg','1','BD PC','5 days'],['Tab Phenazopyridine 200mg','1','TDS','2 days']], bill:300, lab:true, labs:['Urine R/M','Urine C&S'] },
  /* 11 */ { d:'Allergic Dermatitis', sS:'Itchy rash both arms, torso 4 days. H/o new detergent.', sO:'Erythematous papular rash forearms + trunk. Vitals normal.', sA:'Allergic Contact Dermatitis', sP:'Tab Cetirizine OD HS × 7d. Cream Mometasone 0.1% apply BD × 7d.', drugs:[['Tab Cetirizine 10mg','1','OD HS','7 days'],['Cream Mometasone 0.1%','Apply BD','Topical','7 days']], bill:300, lab:false },
  /* 12 */ { d:'HTN + DM Routine Review', sS:'Monthly review. BP diary good. FBS 126-140. Foot exam done.', sO:'BP 132/82, Pulse 74, Wt 80kg. Feet clear.', sA:'T2DM + HTN — well controlled', sP:'Continue medications. Refill 1 month. HbA1c due next month.', drugs:[['Tab Metformin 500mg','1','BD PC','30 days'],['Tab Amlodipine 5mg','1','OD','30 days'],['Tab Aspirin 75mg','1','OD PC','30 days']], bill:300, lab:false },
  /* 13 */ { d:'Musculoskeletal Chest Pain', sS:'L-sided chest pain, sharp, worse on pressing. H/o lifting.', sO:'BP 124/80. ECG: normal sinus. 4th rib cartilage tender.', sA:'Costochondritis', sP:'Tab Diclofenac 50mg BD PC × 5d. Tab Pantoprazole OD AC. Reassure.', drugs:[['Tab Diclofenac 50mg','1','BD PC','5 days'],['Tab Pantoprazole 40mg','1','OD AC','5 days']], bill:400, lab:true, labs:['ECG'], proc:'ECG' },
  /* 14 */ { d:'Allergic Rhinitis', sS:'Sneezing 10-15/morning, watery discharge, nasal congestion, itchy eyes.', sO:'Pale boggy nasal mucosa. Allergic salute. Vitals normal.', sA:'Seasonal Allergic Rhinitis', sP:'Tab Levocetirizine OD × 14d. Nasal Spray Fluticasone OD × 4 weeks.', drugs:[['Tab Levocetirizine 5mg','1','OD HS','14 days'],['Nasal Spray Fluticasone','2 puffs each nostril','OD','28 days']], bill:300, lab:false },
  /* 15 */ { d:'COPD + HTN Review', sS:'Monthly review. Cough increasing. BP 152/96 at home.', sO:'BP 150/98, RR 20, SpO2 93% RA. Reduced breath sounds.', sA:'COPD Gold Grade 2 + Uncontrolled HTN', sP:'Increase Amlodipine 10mg OD. Add Telmisartan 40mg. Refer Chest Physician.', drugs:[['Tab Amlodipine 10mg','1','OD','30 days'],['Tab Telmisartan 40mg','1','OD','30 days'],['Tab Montelukast + Levocetirizine','1','OD','30 days']], bill:300, lab:true, labs:['CBC','PFT referral'] },
  /* 16 */ { d:'Acute Pharyngitis', sS:'Severe sore throat, difficulty swallowing, mild fever 1 day.', sO:'Temp 100.2°F. Tonsils 2+ erythematous. LN tender.', sA:'Acute Bacterial Pharyngitis', sP:'Tab Amoxicillin 500mg TDS × 7d. Tab Paracetamol TDS × 3d. Warm gargles.', drugs:[['Tab Amoxicillin 500mg','1','TDS','7 days'],['Tab Paracetamol 500mg','1','TDS','3 days']], bill:300, lab:false },
  /* 17 */ { d:'Knee Pain (Osteoarthritis)', sS:'R knee pain, stiffness on waking, worse on stairs. Age 58.', sO:'BP 136/86. R knee: mild effusion, crepitus on ROM.', sA:'Osteoarthritis Knee — right', sP:'Tab Diclofenac SR 100mg OD PC × 14d. Tab Glucosamine + Chondroitin OD × 3m.', drugs:[['Tab Diclofenac SR 100mg','1','OD PC','14 days'],['Tab Glucosamine + Chondroitin','1','OD','90 days']], bill:300, lab:false },
  /* 18 */ { d:'Follow-up Visit', sS:'Follow-up. Symptoms improving. No new complaints.', sO:'BP 122/80, Temp 98.4°F. Improving.', sA:'Resolving — improving', sP:'Continue medications. Return if worsens.', drugs:[], bill:150, lab:false },
  /* 19 */ { d:'Vitamin D Deficiency', sS:'Generalised body ache, fatigue, mild low back pain 2 months.', sO:'BP 118/76, normal examination.', sA:'Vitamin D Deficiency', sP:'Tab Vitamin D3 60000 IU once weekly × 8 weeks. Sun exposure.', drugs:[['Tab Vitamin D3 60000 IU','1','Once weekly','8 weeks']], bill:300, lab:true, labs:['Vitamin D3','Calcium','Phosphorus'] },
];

// ── Medicine catalog ──────────────────────────────────────────────────────────
const MEDS = [
  ['Tab Paracetamol 500mg','Calpol','Tablet','500mg',18,'Antipyretic'],
  ['Tab Cetirizine 10mg','Okacet','Tablet','10mg',18,'Antihistamine'],
  ['Tab Levocetirizine 5mg','Levocet','Tablet','5mg',22,'Antihistamine'],
  ['Tab Amlodipine 5mg','Amlokind','Tablet','5mg',28,'Antihypertensive'],
  ['Tab Amlodipine 10mg','Amlokind 10','Tablet','10mg',38,'Antihypertensive'],
  ['Tab Telmisartan 40mg','Telma','Tablet','40mg',65,'Antihypertensive'],
  ['Tab Telmisartan 80mg','Telma 80','Tablet','80mg',88,'Antihypertensive'],
  ['Tab Aspirin 75mg','Ecosprin','Tablet','75mg',18,'Antiplatelet'],
  ['Tab Metformin 500mg','Glycomet','Tablet','500mg',22,'Antidiabetic'],
  ['Tab Metformin 1000mg','Glycomet 1000','Tablet','1000mg',38,'Antidiabetic'],
  ['Tab Glimepiride 1mg','Amaryl','Tablet','1mg',42,'Antidiabetic'],
  ['Tab Glimepiride 2mg','Amaryl 2','Tablet','2mg',58,'Antidiabetic'],
  ['Tab Thyroxine Sodium 50mcg','Eltroxin 50','Tablet','50mcg',28,'Thyroid'],
  ['Tab Thyroxine Sodium 75mcg','Eltroxin 75','Tablet','75mcg',35,'Thyroid'],
  ['Tab Thyroxine Sodium 100mcg','Eltroxin 100','Tablet','100mcg',42,'Thyroid'],
  ['Tab Azithromycin 500mg','Azithral','Tablet','500mg',78,'Antibiotic'],
  ['Tab Amoxicillin 500mg','Mox 500','Tablet','500mg',32,'Antibiotic'],
  ['Tab Norfloxacin 400mg','Norflox','Tablet','400mg',32,'Antibiotic'],
  ['Tab Nitrofurantoin 100mg','Niftran','Tablet','100mg',45,'Antibiotic'],
  ['Tab Pantoprazole 40mg','Pantocid','Tablet','40mg',22,'PPI'],
  ['Tab Ondansetron 4mg','Emeset','Tablet','4mg',28,'Antiemetic'],
  ['Tab Diclofenac 50mg','Voveran','Tablet','50mg',18,'NSAID'],
  ['Tab Diclofenac SR 100mg','Voveran SR','Tablet','100mg',32,'NSAID'],
  ['Tab Thiocolchicoside 8mg','Myoril','Tablet','8mg',52,'Muscle Relaxant'],
  ['Tab Prednisolone 10mg','Wysolone','Tablet','10mg',24,'Corticosteroid'],
  ['Tab Montelukast + Levocetirizine','Montair LC','Tablet','10mg+5mg',38,'Antiasthmatic'],
  ['Tab Propranolol 40mg','Ciplar','Tablet','40mg',18,'Beta Blocker'],
  ['Tab Sumatriptan 50mg','Suminat','Tablet','50mg',65,'Antimigraine'],
  ['Tab Ferrous Sulphate + Folic Acid','Orofer XT','Tablet','150mg+1.5mg',42,'Haematinic'],
  ['Tab Vitamin C 500mg','Limcee','Tablet','500mg',18,'Vitamin'],
  ['Tab Multivitamin','Becosules','Tablet','Standard',65,'Vitamin'],
  ['Tab Phenazopyridine 200mg','Pyridium','Tablet','200mg',28,'Urinary Analgesic'],
  ['Syp Chericof 100ml','Chericof','Syrup','5mg/5ml',72,'Cough'],
  ['ORS Sachet','Electral','Sachet','Standard',12,'Electrolyte'],
  ['Cream Mometasone 0.1%','Elocon','Cream','0.1%',95,'Topical Steroid'],
  ['Nasal Spray Fluticasone','Flonase','Nasal Spray','50mcg/spray',165,'Nasal Steroid'],
  ['Tab Atorvastatin 10mg','Atorfit','Tablet','10mg',35,'Statin'],
  ['Tab Glucosamine + Chondroitin','Rejoint','Tablet','500mg+400mg',85,'Supplement'],
  ['Tab Vitamin D3 60000 IU','Calcirol','Tablet','60000 IU',45,'Vitamin'],
  ['Tab Nitrofurantoin 100mg','Niftran','Tablet','100mg',45,'Antibiotic'],
];

// ── Tier config ────────────────────────────────────────────────────────────────
const TIERS = [
  { tier:'WEEKLY',  count:20, visits:[48,52], ages:[45,75], genderM:0.6,
    chronic:[['Hypertension','Diabetes Type 2'],['COPD','Hypertension'],['Diabetes Type 2','CKD Stage 2'],['Hypertension','CAD'],['Hypothyroidism','Hypertension'],['Rheumatoid Arthritis'],['Asthma'],['Diabetes Type 2','Hypothyroidism'],['Hypertension','Osteoarthritis'],['COPD']],
    allergies:['Aspirin','Penicillin','NSAIDs','Sulfa','Codeine','','',''],
    dxPool:[1,2,5,12,15,18,0,13,16,19], abhaChance:0.9 },
  { tier:'MONTHLY', count:50, visits:[10,14], ages:[35,70], genderM:0.55,
    chronic:[['Hypertension'],['Diabetes Type 2'],['Hypothyroidism'],['Asthma'],['Migraine'],['Iron Deficiency Anaemia'],['PCOD'],['Gout'],['Osteoarthritis'],['BPH'],['Hyperlipidemia'],['Fibromyalgia']],
    allergies:['Aspirin','Penicillin','','','',''],
    dxPool:[1,2,5,9,7,3,17,14,18,0,8,19], abhaChance:0.4 },
  { tier:'REGULAR', count:80, visits:[4,8],   ages:[20,60], genderM:0.5,
    chronic:[[],['Recurrent URTI'],[],['Recurrent UTI'],[],['Seasonal Allergy'],[],[],[],['Vitamin D Deficiency']],
    allergies:['','','','','Penicillin',''],
    dxPool:[0,4,3,7,11,10,14,16,18,19], abhaChance:0.1 },
  { tier:'CASUAL',  count:50, visits:[1,3],   ages:[15,65], genderM:0.5,
    chronic:[[],[],[],[],[],[],[],[],[],[]],
    allergies:['','','',''],
    dxPool:[0,4,3,11,16,18,19], abhaChance:0 },
];

function buildPatients() {
  const list = [];
  let phone = 9893201001;
  for (const t of TIERS) {
    for (let i = 0; i < t.count; i++) {
      const male = Math.random() < t.genderM;
      const fn   = male ? pick(MN) : pick(FN);
      const ln   = pick(LN);
      const age  = rand(t.ages[0], t.ages[1]);
      const chronic  = t.chronic[i % t.chronic.length] || [];
      const allergy  = t.allergies[i % t.allergies.length] || '';
      const visits   = rand(t.visits[0], t.visits[1]);
      const hasAbha  = Math.random() < t.abhaChance;
      list.push({
        name: `${fn} ${ln}`, phone: String(phone++),
        gender: male ? 'M' : 'F', age, blood: pick(BLOODS),
        chronic: [...chronic], allergies: allergy ? [allergy] : [],
        tier: t.tier, visits, dxPool: t.dxPool,
        abha: hasAbha ? `14-${rand(1000,9999)}-${rand(1000,9999)}-${pad(i+1,4)}` : null,
        emergName:  male ? `${pick(FN)} ${ln}` : `${pick(MN)} ${ln}`,
        emergPhone: String(phone + 800000),
        ref: pick(['Word of mouth','Google','Family','Practo','Doctor referral','Neighbour','Instagram']),
      });
    }
  }
  return list;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function seedSharmaClinic() {
  console.log('🏥  Seeding Sharma Medical Centre — 200-patient, 1-year GP practice…\n');
  const hash = await bcrypt.hash(PASS, 10);
  const yymm = YYMM();
  let seq = { rx:1000, bill:5000, lab:3000 };

  // ── Tenant ─────────────────────────────────────────────────────────────────
  let tenant = await prisma.tenant.findUnique({ where: { email: EMAIL } });
  if (tenant) {
    const owner = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: EMAIL } });
    if (owner) await prisma.user.update({ where: { id: owner.id }, data: { password: hash, isEmailVerified: true, emailVerifyToken: null } });
    console.log('  ↩  Tenant exists — password reset');
  } else {
    tenant = await prisma.tenant.create({ data: {
      name: 'Sharma Medical Centre', businessType: 'CLINIC', email: EMAIL,
      phone: '9893001122', address: '14, Palasia Square, AB Road',
      city: 'Indore', state: 'Madhya Pradesh', pincode: '452001',
      modules: ['appointments','staff','attendance','customers','expenses','whatsapp','campaigns','ai','automation','assets','accounts','payroll'],
      users: { create: { name:'Dr. Arjun Sharma', email: EMAIL, password: hash, role:'OWNER', isEmailVerified: true } },
    }});
    console.log(`  ✓  Tenant created (${tenant.id})`);
  }
  const TID = tenant.id;

  // ── Staff ──────────────────────────────────────────────────────────────────
  let docStaff = await prisma.staff.findFirst({ where: { tenantId: TID, email: EMAIL } });
  if (!docStaff) {
    docStaff = await prisma.staff.create({ data: { tenantId: TID, name:'Dr. Arjun Sharma', phone:'9893001122', email: EMAIL, role:'Doctor', certifications:['MBBS','MD - General Medicine'], salary:0, joinedAt:dAgo(1825) } });
  }
  const staffMembers = [
    { name:'Kavita Rao', phone:'9893002233', email:'kavita@sharmamedical.test', role:'Receptionist', certifications:['B.Com'], salary:16000, joinedAt:dAgo(730) },
    { name:'Meena Devi', phone:'9893003344', email:'meena@sharmamedical.test',  role:'Nurse', certifications:['GNM','BLS Certified'], salary:20000, joinedAt:dAgo(540) },
  ];
  for (const s of staffMembers) {
    const ex = await prisma.staff.findFirst({ where: { tenantId: TID, phone: s.phone } });
    if (!ex) await prisma.staff.create({ data: { tenantId: TID, ...s } });
    // Ensure a user account exists so staff can log in via Staff Login tab
    const exUser = await prisma.user.findUnique({ where: { tenantId_email: { tenantId: TID, email: s.email } } });
    if (!exUser) {
      await prisma.user.create({ data: { tenantId: TID, name: s.name, email: s.email, password: hash, role: 'STAFF', isEmailVerified: true } });
    } else {
      await prisma.user.update({ where: { id: exUser.id }, data: { password: hash, isEmailVerified: true, emailVerifyToken: null } });
    }
  }
  console.log('  ✓  Staff seeded (with login accounts)');

  // ── Doctor profile ─────────────────────────────────────────────────────────
  const docExists = await prisma.clinicDoctorProfile.findFirst({ where: { tenantId: TID } });
  if (!docExists) {
    await prisma.clinicDoctorProfile.create({ data: {
      tenantId: TID, staffId: docStaff.id,
      specialization: 'General Medicine & Family Physician',
      mciRegNumber: 'MP-MED-2009-14872',
      consultationFee: 300, followUpFee: 150, experience: 15,
      availableDays: ['Mon','Tue','Wed','Thu','Fri','Sat'],
      morningStart: '10:00', morningEnd: '14:00',
      eveningStart: '18:00', eveningEnd: '21:00',
      education: 'MBBS – MGM Medical College, Indore (2005)\nMD General Medicine – AIIMS, Bhopal (2009)',
      languages: ['Hindi','English'],
      bio: '15 years in general practice. Focus on chronic disease management and family medicine.',
    }});
    console.log('  ✓  Doctor profile created');
  }

  // ── Services ────────────────────────────────────────────────────────────────
  const svcMap = {};
  for (const s of [
    { name:'General Consultation',   price:300, duration:15 },
    { name:'Follow-up Consultation', price:150, duration:10 },
    { name:'ECG',                    price:400, duration:15 },
    { name:'Nebulization',           price:200, duration:20 },
    { name:'Dressing / Wound Care',  price:150, duration:15 },
    { name:'Injection (IM/IV)',      price:100, duration:10 },
  ]) {
    let svc = await prisma.service.findFirst({ where: { tenantId: TID, name: s.name } });
    if (!svc) svc = await prisma.service.create({ data: { tenantId: TID, description: s.name, ...s } });
    svcMap[s.name] = svc;
  }

  // ── Lab centers ─────────────────────────────────────────────────────────────
  const LAB_CENTERS = [
    { name:'Metropolis Diagnostics', phone:'9893200100', address:'Plot 12, Sapna Sangeeta Road, Indore' },
    { name:'SRL Diagnostics',        phone:'9893200200', address:'18, MG Road, Indore' },
    { name:'Lal PathLabs',           phone:'9893200300', address:'22, Vijay Nagar, Indore' },
  ];
  for (const lc of LAB_CENTERS) {
    const ex = await prisma.labCenter.findFirst({ where: { tenantId: TID, name: lc.name } });
    if (!ex) await prisma.labCenter.create({ data: { tenantId: TID, ...lc } });
  }
  const labCenters = await prisma.labCenter.findMany({ where: { tenantId: TID } });

  // ── Medicine inventory ───────────────────────────────────────────────────────
  const seenMeds = new Set();
  for (const [nameLabel, brand, form, strength, mrp, cat] of MEDS) {
    if (seenMeds.has(nameLabel)) continue;
    seenMeds.add(nameLabel);
    const genericName = nameLabel.replace(/^(Tab |Syp |Cream |Nasal Spray )/,'');
    let med = await prisma.clinicMedicine.findFirst({ where: { tenantId: TID, genericName } });
    if (!med) {
      med = await prisma.clinicMedicine.create({ data: {
        tenantId: TID, genericName,
        brandName: brand, formulation: form, strength,
        scheduleType: 'NONE', mrp, reorderLevel: 20,
      }});
      await prisma.clinicMedicineBatch.create({ data: {
        tenantId: TID, medicineId: med.id,
        batchNumber: `B${rand(10000,99999)}`,
        quantity: 300, purchasePrice: Math.round(mrp * 0.65),
        expiryDate: new Date(Date.now() + 730 * 86400000),
        mfgDate: new Date(Date.now() - 180 * 86400000),
      }});
    }
  }
  console.log(`  ✓  Medicine inventory: ${seenMeds.size} medicines with batches`);

  // ── Patients ─────────────────────────────────────────────────────────────────
  const patientDefs = buildPatients();
  const patientMap  = {};

  const existingCount = await prisma.customer.count({ where: { tenantId: TID } });
  if (existingCount >= 150) {
    console.log(`  ↩  Patients already exist (${existingCount}) — loading`);
    const existing = await prisma.customer.findMany({ where: { tenantId: TID } });
    for (const p of existing) patientMap[p.name] = p;
  } else {
    for (const p of patientDefs) {
      let cust = await prisma.customer.findFirst({ where: { tenantId: TID, phone: p.phone } });
      if (!cust) {
        cust = await prisma.customer.create({ data: {
          tenantId: TID, name: p.name, phone: p.phone,
          dateOfBirth: dob(p.age), gender: p.gender, bloodGroup: p.blood,
          chronicConditions: p.chronic, allergies: p.allergies,
          abhaId: p.abha || null, referredBy: p.ref,
          emergencyContactName: p.emergName, emergencyContactPhone: p.emergPhone,
          tags: p.tier === 'WEEKLY' ? ['Chronic','Regular'] : p.tier === 'MONTHLY' ? ['Regular'] : ['New'],
          visitCount: 0, totalSpent: 0,
        }});
      }
      patientMap[p.name] = cust;
    }
    console.log(`  ✓  ${Object.keys(patientMap).length} patients created`);
  }

  // ── Visit data ───────────────────────────────────────────────────────────────
  const existingAppts = await prisma.appointment.count({ where: { tenantId: TID } });
  if (existingAppts > 50) {
    console.log(`  ↩  Visit data exists (${existingAppts} appointments) — skipping`);
  } else {
    console.log('  ⏳  Creating visit data (appointments, vitals, prescriptions, bills)…');
    let apptC=0, vitC=0, rxC=0, labC=0, billC=0;

    for (const pDef of patientDefs) {
      const patient = patientMap[pDef.name];
      if (!patient) continue;

      const totalVisits = pDef.visits;
      const intervalDays = Math.floor(365 / totalVisits);
      let totalSpent = 0;
      let lastVisitDays = 365;

      for (let v = 0; v < totalVisits; v++) {
        const daysBack = 365 - Math.round(v * intervalDays) - rand(0, Math.min(intervalDays-1, 6));
        if (daysBack < 0) continue;
        if (daysBack < lastVisitDays) lastVisitDays = daysBack;

        const visitDate = new Date(Date.now() - daysBack * 86400000);
        visitDate.setHours(pick([9,10,10,11,11,17,17,18,18,19]), rand(0,59), 0, 0);
        if (visitDate.getDay() === 0) continue; // no Sundays

        const isFollowUp = v > 0 && rand(0,4) === 0;
        const dxIdx = pDef.dxPool[v % pDef.dxPool.length];
        const dx    = DX[dxIdx] || DX[0];
        const svcName = isFollowUp ? 'Follow-up Consultation' : dx.proc === 'ECG' ? 'ECG' : 'General Consultation';
        const svc   = svcMap[svcName] || svcMap['General Consultation'];
        const billAmt = isFollowUp ? 150 : (dx.bill || 300);
        totalSpent += billAmt;

        // ── Appointment ──
        const appt = await prisma.appointment.create({ data: {
          tenantId: TID, customerId: patient.id, serviceId: svc.id,
          title: isFollowUp ? `Follow-up — ${dx.d}` : dx.d,
          status: 'COMPLETED',
          startTime: visitDate,
          endTime: new Date(visitDate.getTime() + (svc.duration || 15) * 60000),
          price: billAmt, notes: dx.sP,
        }});
        apptC++;

        // ── Vitals ──
        const bpS = pDef.chronic.includes('Hypertension') ? rand(128,168) : rand(106,134);
        const bpD = pDef.chronic.includes('Hypertension') ? rand(82,104) : rand(66,88);
        await prisma.vitals.create({ data: {
          tenantId: TID,
          customerId: patient.id,
          appointmentId: appt.id,
          recordedAt: new Date(visitDate.getTime() + 3 * 60000),
          bpSystolic: bpS, bpDiastolic: bpD,
          pulse: rand(62, 96),
          temperature: parseFloat((36.1 + Math.random() * 2.0).toFixed(1)),
          weight: patient.gender === 'F' ? rand(46,80) : rand(56,96),
          height: patient.gender === 'F' ? rand(150,168) : rand(158,182),
          spo2: pDef.chronic.includes('COPD') ? rand(88,96) : rand(94,99),
          bloodGlucose: pDef.chronic.includes('Diabetes Type 2') ? rand(120,245) : null,
          respiratoryRate: rand(14,20),
          recordedBy: 'Meena Devi',
          notes: bpS > 140 ? 'BP elevated — noted to doctor' : null,
        }});
        vitC++;

        // ── Clinical Note (SOAP) ──
        await prisma.clinicalNote.create({ data: {
          tenantId: TID, customerId: patient.id, appointmentId: appt.id,
          doctorName: 'Dr. Arjun Sharma',
          patientName: patient.name,
          serviceName: svcName,
          soapS: dx.sS, soapO: dx.sO, soapA: dx.sA, soapP: dx.sP,
          diagnosisCode: dx.d,
          createdAt: new Date(visitDate.getTime() + 8 * 60000),
        }});

        // ── Prescription ──
        if (!isFollowUp && dx.drugs?.length > 0) {
          const rx = await prisma.prescription.create({ data: {
            tenantId: TID, patientId: patient.id, appointmentId: appt.id,
            rxNumber: `SYLRX-${yymm}-${pad(++seq.rx)}`,
            patientName: patient.name, patientPhone: patient.phone,
            doctorName: 'Dr. Arjun Sharma',
            diagnosis: dx.d, status: 'ACTIVE',
            createdAt: new Date(visitDate.getTime() + 12 * 60000),
            items: { create: dx.drugs.map(([drugName, dose, frequency, duration, instructions], i) => ({
              drugName, dose: dose || '1', frequency, duration, instructions: instructions || '', sortOrder: i,
            })) },
          }});
          rxC++;
        }

        // ── Lab Order ──
        if (dx.lab && rand(0,9) < 6 && labCenters.length > 0) {
          const lc = pick(labCenters);
          await prisma.labOrder.create({ data: {
            tenantId: TID, patientId: patient.id, appointmentId: appt.id,
            orderNumber: `LO-${yymm}-${pad(++seq.lab)}`,
            patientName: patient.name, patientPhone: patient.phone,
            doctorName: 'Dr. Arjun Sharma',
            labCenterId: lc.id, labCenterName: lc.name,
            urgency: 'ROUTINE',
            status: daysBack > 7 ? 'COMPLETED' : 'PENDING',
            createdAt: new Date(visitDate.getTime() + 15 * 60000),
            items: { create: (dx.labs || ['CBC']).map((testName, i) => ({ testName, sortOrder: i })) },
          }});
          labC++;
        }

        // ── Clinic Bill ──
        const isCash = pick([true,true,true,false,false]);
        const isUPI  = !isCash && pick([true,false]);
        await prisma.clinicBill.create({ data: {
          tenantId: TID, patientId: patient.id, appointmentId: appt.id,
          billNumber: `SYLCB-${yymm}-${pad(++seq.bill)}`,
          patientName: patient.name, patientPhone: patient.phone,
          doctorName: 'Dr. Arjun Sharma',
          billDate: new Date(visitDate.getTime() + 20 * 60000),
          status: 'PAID',
          subtotal: billAmt, exemptAmount: billAmt, taxableAmount: 0, gstAmount: 0, totalAmount: billAmt,
          cashAmount: isCash ? billAmt : 0,
          upiAmount:  !isCash && isUPI ? billAmt : 0,
          cardAmount: !isCash && !isUPI ? billAmt : 0,
          items: { create: [
            { category:'CONSULTATION', description: svcName, quantity:1, unitPrice: isFollowUp ? 150 : 300, isGstExempt: true, taxRate:0, taxAmount:0, lineTotal: isFollowUp ? 150 : 300 },
            ...(dx.proc === 'ECG' ? [{ category:'PROCEDURE', description:'ECG', quantity:1, unitPrice:400, isGstExempt:true, taxRate:0, taxAmount:0, lineTotal:400 }] : []),
            ...(dx.proc === 'Nebulization' ? [{ category:'PROCEDURE', description:'Nebulization', quantity:1, unitPrice:200, isGstExempt:true, taxRate:0, taxAmount:0, lineTotal:200 }] : []),
          ] },
        }});
        billC++;
      }

      // Update patient totals
      await prisma.customer.update({ where: { id: patient.id }, data: {
        visitCount: totalVisits, totalSpent,
        lastVisitAt: dAgo(rand(0, Math.max(1, Math.ceil(365 / totalVisits)))),
        tags: pDef.tier === 'WEEKLY' ? ['Chronic','Regular'] : pDef.tier === 'MONTHLY' ? ['Regular'] : pDef.tier === 'REGULAR' ? ['Regular'] : ['New'],
      }});
    }

    console.log(`  ✓  Appointments: ${apptC} | Vitals: ${vitC} | SOAP notes: ${vitC}`);
    console.log(`  ✓  Prescriptions: ${rxC} | Lab orders: ${labC} | Clinic bills: ${billC}`);
  }

  // ── OPD Tokens (last 30 days) ──────────────────────────────────────────────
  const existingTokens = await prisma.opdToken.count({ where: { tenantId: TID } });
  if (existingTokens === 0) {
    const allPats = await prisma.customer.findMany({ where: { tenantId: TID }, select: { id:true, name:true, phone:true }, take:100 });
    const tokenRows = [];
    for (let day = 30; day >= 0; day--) {
      const d = dAgo(day);
      if (d.getDay() === 0) continue;
      const count = rand(15, 32);
      for (let t = 1; t <= count; t++) {
        const pat = pick(allPats);
        const statusPool = day > 0 ? ['COMPLETED','COMPLETED','COMPLETED','NO_SHOW','COMPLETED'] : ['WAITING','WAITING','IN_CONSULTATION','CALLED','COMPLETED'];
        tokenRows.push({
          tenantId: TID, patientId: pat.id, patientName: pat.name, patientPhone: pat.phone,
          tokenNumber: t, tokenDate: new Date(d.toISOString().slice(0,10)),
          status: pick(statusPool), doctorName: 'Dr. Arjun Sharma',
          createdAt: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, t * 4),
        });
      }
    }
    await prisma.opdToken.createMany({ data: tokenRows, skipDuplicates: true });
    console.log(`  ✓  OPD tokens: ${tokenRows.length} (last 30 days, avg ${(tokenRows.length/26).toFixed(0)}/day)`);
  }

  // ── Expenses — 12 months ────────────────────────────────────────────────────
  const existingExp = await prisma.expense.count({ where: { tenantId: TID } });
  if (existingExp < 60) {
    const rows = [];
    const MONTHLY_EXP = [
      { category:'RENT',      description:'Clinic rent — 14 Palasia Square, AB Road', amount:22000 },
      { category:'SALARIES',  description:'Staff salaries (Kavita Rao + Meena Devi)', amount:36000 },
      { category:'UTILITIES', description:'Electricity + WiFi + landline', amount:3800 },
      { category:'SUPPLIES',  description:'Medical supplies + consumables (Metropolis Traders)', amount:6500 },
      { category:'EQUIPMENT', description:'Equipment AMC (BP machine, ECG, Nebulizer)', amount:1200 },
    ];
    for (let m = 11; m >= 0; m--) {
      const md = new Date(); md.setMonth(md.getMonth()-m); md.setDate(1);
      const lbl = md.toLocaleString('en-IN', { month:'long', year:'numeric' });
      for (const e of MONTHLY_EXP) {
        rows.push({ tenantId: TID, category: e.category, description: `${e.description} — ${lbl}`, amount: e.amount + rand(-400,400), date: new Date(md.getFullYear(), md.getMonth(), rand(1,5)) });
      }
      if (m % 3 === 0) rows.push({ tenantId: TID, category:'SUPPLIES', description:`Quarterly medicine purchase (${md.toLocaleString('en-IN',{month:'short',year:'numeric'})})`, amount: rand(18000,26000), date: new Date(md.getFullYear(), md.getMonth(), rand(6,12)) });
      if (m === 11) {
        rows.push({ tenantId: TID, category:'EQUIPMENT', description:'Annual AMC renewal — ECG + Autoclave', amount:8500, date: new Date(md.getFullYear(), md.getMonth(), 15) });
        rows.push({ tenantId: TID, category:'OTHER', description:'Medical council renewal + CPD workshop', amount:4500, date: new Date(md.getFullYear(), md.getMonth(), 20) });
      }
    }
    await prisma.expense.createMany({ data: rows, skipDuplicates: true });
    console.log(`  ✓  Expenses: ${rows.length} entries (12 months)`);
  }

  // ── Attendance (90 days) ────────────────────────────────────────────────────
  const existingAtt = await prisma.attendanceLog.count({ where: { tenantId: TID } });
  if (existingAtt < 100) {
    const staffRecs = await prisma.staff.findMany({ where: { tenantId: TID }, select: { id:true } });
    const attRows = [];
    for (let day = 90; day >= 1; day--) {
      const d = dAgo(day);
      if (d.getDay() === 0) continue;
      for (const s of staffRecs) {
        if (rand(0,19) === 0) continue;
        const inT  = new Date(d.getFullYear(), d.getMonth(), d.getDate(), rand(9,10), rand(0,30));
        const outT = new Date(d.getFullYear(), d.getMonth(), d.getDate(), rand(20,21), rand(0,59));
        attRows.push({ tenantId: TID, staffId: s.id, date: new Date(d.toISOString().slice(0,10)), checkIn: inT, checkOut: outT, status:'PRESENT', hoursWorked: parseFloat(((outT-inT)/3600000).toFixed(1)) });
      }
    }
    if (attRows.length > 0) {
      await prisma.attendanceLog.createMany({ data: attRows, skipDuplicates: true });
      console.log(`  ✓  Attendance: ${attRows.length} records (90 days)`);
    }
  }

  // ── ABDM config ─────────────────────────────────────────────────────────────
  const t = await prisma.tenant.findUnique({ where: { id: TID }, select: { abdmConfig: true } });
  if (!t?.abdmConfig) {
    await prisma.tenant.update({ where: { id: TID }, data: { abdmConfig: { hfrId:'HFR-MP-IND-2024-00872', hprId:'HPR-DR-SHARMA-2024-14872', facilityName:'Sharma Medical Centre', doctorName:'Dr. Arjun Sharma', abdmEnabled: true } }});
    console.log('  ✓  ABDM config set');
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  const [tP,tA,tB,tR,tL,tT,tE,tV] = await Promise.all([
    prisma.customer.count({ where: { tenantId: TID } }),
    prisma.appointment.count({ where: { tenantId: TID } }),
    prisma.clinicBill.count({ where: { tenantId: TID } }),
    prisma.prescription.count({ where: { tenantId: TID } }),
    prisma.labOrder.count({ where: { tenantId: TID } }),
    prisma.opdToken.count({ where: { tenantId: TID } }),
    prisma.expense.count({ where: { tenantId: TID } }),
    prisma.vitals.count({ where: { tenantId: TID } }),
  ]);
  const weeklyPats  = await prisma.customer.count({ where: { tenantId: TID, visitCount: { gte: 48 } } });
  const monthlyPats = await prisma.customer.count({ where: { tenantId: TID, visitCount: { gte: 10, lte: 47 } } });
  const totalRevenue = await prisma.clinicBill.aggregate({ where: { tenantId: TID }, _sum: { totalAmount: true } });

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         SHARMA MEDICAL CENTRE — SEED COMPLETE                ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log('║  Login:         owner@sharmamedical.test                      ║');
  console.log('║  Password:      SharmaClinic@2026                             ║');
  console.log('║  Doctor:        Dr. Arjun Sharma — MBBS, MD (Gen Medicine)    ║');
  console.log('║  Location:      14 Palasia Square, AB Road, Indore, MP        ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Patients:    ${String(tP).padEnd(6)} (${weeklyPats} weekly · ${monthlyPats} monthly · rest casual) ║`);
  console.log(`║  Appointments:      ${String(tA).padEnd(6)} (spread over 365 days)             ║`);
  console.log(`║  Vitals Recorded:   ${String(tV).padEnd(6)} (BP, pulse, temp, SpO₂, weight)    ║`);
  console.log(`║  Prescriptions:     ${String(tR).padEnd(6)} (~80% of non-follow-up visits)     ║`);
  console.log(`║  Lab Orders:        ${String(tL).padEnd(6)} (~25% of visits)                   ║`);
  console.log(`║  Clinic Bills:      ${String(tB).padEnd(6)} (all visits)                       ║`);
  console.log(`║  OPD Tokens:        ${String(tT).padEnd(6)} (last 30 days)                     ║`);
  console.log(`║  Expenses:          ${String(tE).padEnd(6)} (12 months recurring)              ║`);
  console.log(`║  Annual Revenue:    ₹${String(Math.round(totalRevenue._sum.totalAmount||0).toLocaleString('en-IN')).padEnd(12)}                         ║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
}

async function main() { await seedSharmaClinic(); }
main().catch(console.error).finally(() => prisma.$disconnect());
module.exports = { seedSharmaClinic };
