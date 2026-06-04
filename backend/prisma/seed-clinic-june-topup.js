/**
 * Top-up seed: Sharma Medical Centre — June 2026 activity
 * Fills the gap between the historical seed (ends ~May 30) and today.
 * Creates:
 *   - Appointments + vitals + SOAP + prescriptions + bills for June 1–4
 *   - Today's OPD queue (June 4) with WAITING/IN_CONSULTATION tokens
 *   - Upcoming scheduled appointments for June 5–7
 * Safe to re-run (idempotent checks).
 */
'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pad  = (n, l = 5) => String(n).padStart(l, '0');

const EMAIL = 'owner@sharmamedical.test';
const YYMM  = '2606';

const PAST_DX = [
  { d: 'Hypertension Review',   sS: 'Monthly BP review. Home readings 145/92.', sO: 'BP 146/94, Pulse 76.', sA: 'Essential Hypertension — borderline control', sP: 'Continue Amlodipine 5mg. Reduce salt.', drugs: [['Tab Amlodipine 5mg', '1', 'OD', '30 days'], ['Tab Aspirin 75mg', '1', 'OD PC', '30 days']], bill: 300, lab: false },
  { d: 'Acute Viral Fever',     sS: 'Fever since 2 days, body ache, sore throat.', sO: 'Temp 101.2°F, throat congested.', sA: 'Acute Viral URTI', sP: 'Tab Paracetamol TDS × 5d. Rest and fluids.', drugs: [['Tab Paracetamol 500mg', '1', 'TDS', '5 days'], ['Tab Cetirizine 10mg', '1', 'OD HS', '5 days']], bill: 300, lab: false },
  { d: 'Diabetes Type 2 Review',sS: 'FBS 178 at home, increased thirst.', sO: 'BP 132/84, Wt 80kg.', sA: 'T2DM — suboptimal control', sP: 'Increase Metformin to 1000mg BD.', drugs: [['Tab Metformin 1000mg', '1', 'BD PC', '30 days'], ['Tab Glimepiride 2mg', '1', 'OD AC', '30 days']], bill: 300, lab: true, labs: ['HbA1c', 'FBS'] },
  { d: 'Follow-up Visit',       sS: 'Follow-up. Improving well.', sO: 'BP 122/80. Stable.', sA: 'Resolving', sP: 'Continue current medications.', drugs: [], bill: 150, lab: false },
  { d: 'Upper Respiratory Infection', sS: 'Cough and cold 3 days.', sO: 'Temp 98.6°F. Throat mildly red.', sA: 'Acute URTI', sP: 'Cetirizine OD × 5d. Warm gargles.', drugs: [['Tab Cetirizine 10mg', '1', 'OD HS', '5 days']], bill: 300, lab: false },
  { d: 'Hypothyroidism Review', sS: 'Routine review. Fatigue improving.', sO: 'BP 120/78, Pulse 70.', sA: 'Primary Hypothyroidism — stable', sP: 'Continue Thyroxine 75mcg. TSH after 8 weeks.', drugs: [['Tab Thyroxine Sodium 75mcg', '1', 'OD empty stomach', '60 days']], bill: 300, lab: true, labs: ['TSH'] },
];

const TODAY_DX = [
  { d: 'OPD Consultation',      sS: 'New complaint — generalised weakness.', sO: 'BP 118/76, Pulse 78. Vitals normal.', sA: 'Generalised weakness — under evaluation', sP: 'CBC and Vitamin D ordered. Review in 1 week.', drugs: [['Tab Multivitamin', '1', 'OD', '30 days']], bill: 300, lab: true, labs: ['CBC', 'Vitamin D3'] },
  { d: 'Hypertension Review',   sS: 'Monthly review. BP diary — 142-150/88-94.', sO: 'BP 148/92. No oedema.', sA: 'HTN — suboptimal', sP: 'Add Telmisartan 40mg OD.', drugs: [['Tab Telmisartan 40mg', '1', 'OD', '30 days'], ['Tab Amlodipine 5mg', '1', 'OD', '30 days']], bill: 300, lab: false },
  { d: 'Acute Gastroenteritis', sS: 'Loose stools 3-4x since yesterday. Nausea.', sO: 'BP 108/72, mild dehydration.', sA: 'AGE — mild', sP: 'ORS + Norfloxacin BD × 3d.', drugs: [['Tab Norfloxacin 400mg', '1', 'BD', '3 days'], ['ORS Sachet', '200ml', 'After each stool', '3 days']], bill: 300, lab: false },
];

async function run() {
  console.log('⏳  June 2026 top-up seed for Sharma Medical Centre…\n');

  const tenant = await prisma.tenant.findFirst({ where: { email: EMAIL } });
  if (!tenant) { console.error('Tenant not found'); return; }
  const TID = tenant.id;

  const svc = await prisma.service.findFirst({ where: { tenantId: TID, name: 'General Consultation' } });
  const followUpSvc = await prisma.service.findFirst({ where: { tenantId: TID, name: 'Follow-up Consultation' } });
  if (!svc) { console.error('Services not found — run main seed first'); return; }

  const labCenter = await prisma.labCenter.findFirst({ where: { tenantId: TID } });
  const patients  = await prisma.customer.findMany({ where: { tenantId: TID }, take: 60 });
  if (!patients.length) { console.error('No patients found'); return; }

  // Current sequence counters
  const maxBill = await prisma.clinicBill.aggregate({ where: { tenantId: TID }, _max: { billNumber: true } });
  const maxRx   = await prisma.prescription.aggregate({ where: { tenantId: TID }, _max: { rxNumber: true } });
  const maxLab  = await prisma.labOrder.aggregate({ where: { tenantId: TID }, _max: { orderNumber: true } });
  let billSeq = parseInt((maxBill._max.billNumber || 'SYLCB-2606-05000').split('-').pop()) + 1;
  let rxSeq   = parseInt((maxRx._max.rxNumber   || 'SYLRX-2606-01000').split('-').pop()) + 1;
  let labSeq  = parseInt((maxLab._max.orderNumber|| 'LO-2606-03000').split('-').pop()) + 1;

  let apptC = 0, billC = 0, rxC = 0, labC = 0, tokenC = 0;

  // ── June 1–3: past completed visits ───────────────────────────────────────
  const pastDays = [3, 2, 1]; // daysAgo
  for (const daysAgo of pastDays) {
    const visitDate = new Date();
    visitDate.setDate(visitDate.getDate() - daysAgo);
    if (visitDate.getDay() === 0) continue; // skip Sunday

    const dayPatients = patients.slice(0, rand(12, 20));
    for (const patient of dayPatients) {
      const dx = pick(PAST_DX);
      const isFollowUp = Math.random() < 0.2;
      const usedSvc = isFollowUp ? followUpSvc : svc;
      visitDate.setHours(pick([9, 10, 10, 11, 17, 18, 18, 19]), rand(0, 55), 0, 0);

      // Check if appointment already exists for this patient on this day
      const dateStr = visitDate.toISOString().slice(0, 10);
      const exists = await prisma.appointment.findFirst({
        where: { tenantId: TID, customerId: patient.id, startTime: { gte: new Date(dateStr), lt: new Date(new Date(dateStr).getTime() + 86400000) } }
      });
      if (exists) continue;

      const billAmt = isFollowUp ? 150 : dx.bill;
      const appt = await prisma.appointment.create({ data: {
        tenantId: TID, customerId: patient.id, serviceId: usedSvc.id,
        title: isFollowUp ? `Follow-up — ${dx.d}` : dx.d,
        status: 'COMPLETED',
        startTime: new Date(visitDate),
        endTime: new Date(visitDate.getTime() + (usedSvc.duration || 15) * 60000),
        price: billAmt, notes: dx.sP,
      }});

      await prisma.vitals.create({ data: {
        tenantId: TID, customerId: patient.id, appointmentId: appt.id,
        recordedAt: new Date(visitDate.getTime() + 3 * 60000),
        bpSystolic: rand(112, 158), bpDiastolic: rand(70, 98),
        pulse: rand(62, 92), temperature: parseFloat((36.2 + Math.random() * 1.8).toFixed(1)),
        weight: rand(50, 90), height: rand(152, 180),
        spo2: rand(95, 99), respiratoryRate: rand(14, 18),
        recordedBy: 'Meena Devi',
      }});

      await prisma.clinicalNote.create({ data: {
        tenantId: TID, customerId: patient.id, appointmentId: appt.id,
        doctorName: 'Dr. Arjun Sharma', patientName: patient.name, serviceName: usedSvc.name,
        soapS: dx.sS, soapO: dx.sO, soapA: dx.sA, soapP: dx.sP, diagnosisCode: dx.d,
        createdAt: new Date(visitDate.getTime() + 8 * 60000),
      }});

      if (!isFollowUp && dx.drugs?.length > 0) {
        await prisma.prescription.create({ data: {
          tenantId: TID, patientId: patient.id, appointmentId: appt.id,
          rxNumber: `SYLRX-${YYMM}-${pad(rxSeq++)}`,
          patientName: patient.name, patientPhone: patient.phone,
          doctorName: 'Dr. Arjun Sharma', diagnosis: dx.d, status: 'ACTIVE',
          createdAt: new Date(visitDate.getTime() + 12 * 60000),
          items: { create: dx.drugs.map(([drugName, dose, frequency, duration], i) => ({ drugName, dose, frequency, duration, instructions: '', sortOrder: i })) },
        }});
        rxC++;
      }

      if (dx.lab && labCenter) {
        await prisma.labOrder.create({ data: {
          tenantId: TID, patientId: patient.id, appointmentId: appt.id,
          orderNumber: `LO-${YYMM}-${pad(labSeq++)}`,
          patientName: patient.name, patientPhone: patient.phone,
          doctorName: 'Dr. Arjun Sharma', labCenterId: labCenter.id, labCenterName: labCenter.name,
          urgency: 'ROUTINE', status: 'COMPLETED',
          createdAt: new Date(visitDate.getTime() + 15 * 60000),
          items: { create: (dx.labs || ['CBC']).map((testName, i) => ({ testName, sortOrder: i })) },
        }});
        labC++;
      }

      const isCash = Math.random() > 0.3;
      await prisma.clinicBill.create({ data: {
        tenantId: TID, patientId: patient.id, appointmentId: appt.id,
        billNumber: `SYLCB-${YYMM}-${pad(billSeq++)}`,
        patientName: patient.name, patientPhone: patient.phone,
        doctorName: 'Dr. Arjun Sharma',
        billDate: new Date(visitDate.getTime() + 20 * 60000),
        status: 'PAID',
        subtotal: billAmt, exemptAmount: billAmt, taxableAmount: 0, gstAmount: 0, totalAmount: billAmt,
        cashAmount: isCash ? billAmt : 0, upiAmount: !isCash ? billAmt : 0, cardAmount: 0,
        items: { create: [{ category: 'CONSULTATION', description: usedSvc.name, quantity: 1, unitPrice: billAmt, isGstExempt: true, taxRate: 0, taxAmount: 0, lineTotal: billAmt }] },
      }});
      apptC++; billC++;
    }
  }
  console.log(`  ✓  June 1–3 past visits: ${apptC} appointments, ${billC} bills`);

  // ── June 4 (today): Morning completed + current queue ─────────────────────
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Check if today's tokens already exist
  const existingTokensToday = await prisma.opdToken.count({
    where: { tenantId: TID, visitDate: new Date(todayStr) }
  });

  if (existingTokensToday === 0) {
    // Morning completed visits (tokens 1–8, done before lunch)
    const morningPatients = patients.slice(10, 18);
    const morningTokens = [];
    for (let i = 0; i < morningPatients.length; i++) {
      const pat    = morningPatients[i];
      const dx     = pick(TODAY_DX);
      const visitT = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, i * 8);

      const appt = await prisma.appointment.create({ data: {
        tenantId: TID, customerId: pat.id, serviceId: svc.id,
        title: dx.d, status: 'COMPLETED',
        startTime: visitT, endTime: new Date(visitT.getTime() + 15 * 60000),
        price: dx.bill, notes: dx.sP,
      }});

      await prisma.vitals.create({ data: {
        tenantId: TID, customerId: pat.id, appointmentId: appt.id,
        recordedAt: new Date(visitT.getTime() + 3 * 60000),
        bpSystolic: rand(112, 158), bpDiastolic: rand(70, 98),
        pulse: rand(64, 90), temperature: parseFloat((36.2 + Math.random() * 1.8).toFixed(1)),
        weight: rand(50, 90), height: rand(152, 180), spo2: rand(95, 99), respiratoryRate: rand(14, 18),
        recordedBy: 'Meena Devi',
      }});

      await prisma.clinicalNote.create({ data: {
        tenantId: TID, customerId: pat.id, appointmentId: appt.id,
        doctorName: 'Dr. Arjun Sharma', patientName: pat.name, serviceName: 'General Consultation',
        soapS: dx.sS, soapO: dx.sO, soapA: dx.sA, soapP: dx.sP, diagnosisCode: dx.d,
        createdAt: new Date(visitT.getTime() + 8 * 60000),
      }});

      if (dx.drugs?.length > 0) {
        await prisma.prescription.create({ data: {
          tenantId: TID, patientId: pat.id, appointmentId: appt.id,
          rxNumber: `SYLRX-${YYMM}-${pad(rxSeq++)}`,
          patientName: pat.name, patientPhone: pat.phone,
          doctorName: 'Dr. Arjun Sharma', diagnosis: dx.d, status: 'ACTIVE',
          createdAt: new Date(visitT.getTime() + 12 * 60000),
          items: { create: dx.drugs.map(([drugName, dose, frequency, duration], i) => ({ drugName, dose, frequency, duration, instructions: '', sortOrder: i })) },
        }});
        rxC++;
      }

      const isCash = Math.random() > 0.3;
      await prisma.clinicBill.create({ data: {
        tenantId: TID, patientId: pat.id, appointmentId: appt.id,
        billNumber: `SYLCB-${YYMM}-${pad(billSeq++)}`,
        patientName: pat.name, patientPhone: pat.phone,
        doctorName: 'Dr. Arjun Sharma',
        billDate: new Date(visitT.getTime() + 20 * 60000),
        status: 'PAID',
        subtotal: dx.bill, exemptAmount: dx.bill, taxableAmount: 0, gstAmount: 0, totalAmount: dx.bill,
        cashAmount: isCash ? dx.bill : 0, upiAmount: !isCash ? dx.bill : 0, cardAmount: 0,
        items: { create: [{ category: 'CONSULTATION', description: 'General Consultation', quantity: 1, unitPrice: dx.bill, isGstExempt: true, taxRate: 0, taxAmount: 0, lineTotal: dx.bill }] },
      }});

      morningTokens.push({ tenantId: TID, patientId: pat.id, patientName: pat.name, tokenNumber: i + 1, visitDate: new Date(todayStr), status: 'COMPLETED', doctorName: 'Dr. Arjun Sharma', createdAt: visitT });
      apptC++; billC++;
    }

    // Current queue (tokens 9–16 — afternoon session in progress)
    const afternoonPatients = patients.slice(20, 28);
    const queueStatuses = ['COMPLETED', 'COMPLETED', 'IN_CONSULTATION', 'CALLED', 'WAITING', 'WAITING', 'WAITING', 'WAITING'];
    const afternoonTokens = afternoonPatients.map((pat, i) => ({
      tenantId: TID, patientId: pat.id, patientName: pat.name,
      tokenNumber: morningPatients.length + i + 1,
      visitDate: new Date(todayStr),
      status: queueStatuses[i] || 'WAITING',
      doctorName: 'Dr. Arjun Sharma',
      createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, i * 6),
    }));

    await prisma.opdToken.createMany({ data: [...morningTokens, ...afternoonTokens], skipDuplicates: true });
    tokenC = morningTokens.length + afternoonTokens.length;
    console.log(`  ✓  Today's OPD: ${tokenC} tokens (${morningPatients.length} completed morning, ${afternoonPatients.length} in afternoon queue)`);
  } else {
    console.log(`  ↩  Today's OPD tokens already exist (${existingTokensToday})`);
  }

  // ── June 5–7: Upcoming scheduled appointments ─────────────────────────────
  let scheduledC = 0;
  for (let daysAhead = 1; daysAhead <= 3; daysAhead++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    if (futureDate.getDay() === 0) continue;
    const futureDateStr = futureDate.toISOString().slice(0, 10);

    const futurePats = patients.slice(rand(0, 10), rand(15, 25));
    for (const pat of futurePats.slice(0, rand(8, 14))) {
      const exists = await prisma.appointment.findFirst({
        where: { tenantId: TID, customerId: pat.id, startTime: { gte: new Date(futureDateStr), lt: new Date(new Date(futureDateStr).getTime() + 86400000) }, status: 'SCHEDULED' }
      });
      if (exists) continue;
      futureDate.setHours(pick([10, 10, 11, 17, 18, 18, 19]), rand(0, 50), 0, 0);
      await prisma.appointment.create({ data: {
        tenantId: TID, customerId: pat.id, serviceId: svc.id,
        title: pick(['Follow-up Visit', 'General Consultation', 'Hypertension Review', 'Diabetes Review', 'Routine Check-up']),
        status: 'SCHEDULED',
        startTime: new Date(futureDate), endTime: new Date(futureDate.getTime() + 15 * 60000),
        price: 300, notes: '',
      }});
      scheduledC++;
    }
  }
  console.log(`  ✓  Upcoming (Jun 5–7): ${scheduledC} scheduled appointments`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  const [tA, tB, tT] = await Promise.all([
    prisma.appointment.count({ where: { tenantId: TID } }),
    prisma.clinicBill.aggregate({ where: { tenantId: TID }, _sum: { totalAmount: true } }),
    prisma.opdToken.count({ where: { tenantId: TID } }),
  ]);
  const todayAppts = await prisma.appointment.count({
    where: { tenantId: TID, startTime: { gte: new Date(todayStr), lt: new Date(new Date(todayStr).getTime() + 86400000) } }
  });
  const todayBills = await prisma.clinicBill.aggregate({
    where: { tenantId: TID, billDate: { gte: new Date(todayStr), lt: new Date(new Date(todayStr).getTime() + 86400000) } },
    _sum: { totalAmount: true }, _count: true,
  });

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║         JUNE TOP-UP COMPLETE                             ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Today's appointments: ${String(todayAppts).padEnd(4)} (dashboard should show)    ║`);
  console.log(`║  Today's bills:        ${String(todayBills._count).padEnd(4)} · ₹${String(Math.round(todayBills._sum.totalAmount||0)).padEnd(10)}               ║`);
  console.log(`║  Today's OPD tokens:   ${String(tokenC || existingTokensToday).padEnd(4)} (queue live)                 ║`);
  console.log(`║  Upcoming scheduled:   ${String(scheduledC).padEnd(4)}                              ║`);
  console.log(`║  Total appointments:   ${String(tA).padEnd(6)}                            ║`);
  console.log(`║  Total revenue:        ₹${String(Math.round(tB._sum.totalAmount||0).toLocaleString('en-IN')).padEnd(14)}               ║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

run().catch(console.error).finally(() => prisma.$disconnect());
