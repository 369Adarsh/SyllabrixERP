/**
 * Seed: Sharma Medical Centre — General Physician Demo Clinic
 * SYL-BC-HLC-CL07 | CLINIC
 *
 * Login: owner@sharmamedical.test / SharmaClinic@2026
 *
 * Idempotent: safe to run multiple times.
 * If tenant exists, owner password is reset and patients are upserted.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const PASS = 'SharmaClinic@2026';
const EMAIL = 'owner@sharmamedical.test';

const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const future = (n) => new Date(Date.now() + n * 86400000);
const dob = (yearsAgo) => new Date(Date.now() - yearsAgo * 365.25 * 86400000);

async function main() {
  const hash = await bcrypt.hash(PASS, 10);

  // ── Upsert tenant ──────────────────────────────────────────────────────────
  let tenant = await prisma.tenant.findUnique({ where: { email: EMAIL } });

  if (tenant) {
    // Reset owner password and ensure modules are current
    const owner = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: EMAIL } });
    if (owner) {
      await prisma.user.update({
        where: { id: owner.id },
        data: { password: hash, isEmailVerified: true, emailVerifyToken: null },
      });
    }
    console.log('Sharma Medical Centre already exists — password reset to SharmaClinic@2026');
  } else {
    // Create fresh
    tenant = await prisma.tenant.create({
      data: {
        name: 'Sharma Medical Centre',
        businessType: 'CLINIC',
        email: EMAIL,
        phone: '9893001122',
        address: '14, Palasia Square, AB Road',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        modules: ['appointments', 'staff', 'attendance', 'invoicing', 'customers', 'reports', 'expenses', 'whatsapp'],
        users: {
          create: {
            name: 'Dr. Arjun Sharma',
            email: EMAIL,
            password: hash,
            role: 'OWNER',
            isEmailVerified: true,
          },
        },
      },
    });
    console.log(`Created tenant: Sharma Medical Centre (${tenant.id})`);
  }

  // ── Staff ──────────────────────────────────────────────────────────────────
  const staffData = [
    {
      name: 'Dr. Arjun Sharma',
      phone: '9893001122',
      email: EMAIL,
      role: 'Doctor',
      specialization: ['General Medicine', 'Family Medicine'],
      certifications: ['MBBS', 'MD - General Medicine'],
      bio: 'MBBS, MD (General Medicine). 15 years experience. Available Mon–Sat 10AM–2PM & 6PM–9PM.',
      salary: 0,
      joinedAt: daysAgo(1825),
    },
    {
      name: 'Kavita Rao',
      phone: '9893002233',
      email: 'kavita@sharmamedical.test',
      role: 'Receptionist',
      specialization: [],
      certifications: [],
      salary: 16000,
      joinedAt: daysAgo(730),
    },
    {
      name: 'Meena Devi',
      phone: '9893003344',
      email: 'meena@sharmamedical.test',
      role: 'Nurse',
      specialization: ['General Nursing'],
      certifications: ['GNM', 'BLS Certified'],
      salary: 20000,
      joinedAt: daysAgo(540),
    },
  ];

  const existingStaff = await prisma.staff.findMany({ where: { tenantId: tenant.id }, select: { email: true } });
  const existingEmails = new Set(existingStaff.map(s => s.email));

  for (const s of staffData) {
    if (!existingEmails.has(s.email)) {
      await prisma.staff.create({ data: { tenantId: tenant.id, ...s } });
    }
  }

  // ── Services ───────────────────────────────────────────────────────────────
  const serviceData = [
    { name: 'General Consultation', description: 'OPD consultation with Dr. Arjun Sharma', duration: 15, price: 300 },
    { name: 'Follow-up Consultation', description: 'Follow-up visit within 7 days', duration: 10, price: 150 },
    { name: 'ECG', description: 'Electrocardiogram with interpretation', duration: 15, price: 400 },
    { name: 'Nebulization', description: 'Bronchodilator nebulization therapy', duration: 20, price: 200 },
    { name: 'Dressing / Wound Care', description: 'Minor wound dressing and care', duration: 15, price: 150 },
    { name: 'Injection (IM/IV)', description: 'Intramuscular or intravenous injection', duration: 10, price: 100 },
  ];

  const existingServices = await prisma.service.findMany({ where: { tenantId: tenant.id }, select: { name: true } });
  const existingServiceNames = new Set(existingServices.map(s => s.name));

  const services = {};
  for (const s of serviceData) {
    if (!existingServiceNames.has(s.name)) {
      services[s.name] = await prisma.service.create({ data: { tenantId: tenant.id, ...s } });
    } else {
      services[s.name] = await prisma.service.findFirst({ where: { tenantId: tenant.id, name: s.name } });
    }
  }

  // ── Patients ───────────────────────────────────────────────────────────────
  const patientData = [
    {
      name: 'Prakash Verma',
      phone: '9893101001',
      email: 'prakash.verma@gmail.com',
      bloodGroup: 'O+',
      dateOfBirth: dob(58),
      gender: 'M',
      chronicConditions: ['Hypertension', 'Diabetes Type 2'],
      allergies: ['Aspirin'],
      referredBy: 'Word of mouth',
      emergencyContactName: 'Savita Verma',
      emergencyContactPhone: '9893101999',
      totalSpent: 1800,
      visitCount: 6,
    },
    {
      name: 'Sunita Joshi',
      phone: '9893102002',
      email: 'sunita.joshi@gmail.com',
      bloodGroup: 'A+',
      dateOfBirth: dob(34),
      gender: 'F',
      chronicConditions: [],
      allergies: [],
      referredBy: 'Google',
      totalSpent: 450,
      visitCount: 2,
    },
    {
      name: 'Ravi Kumar',
      phone: '9893103003',
      bloodGroup: 'B+',
      dateOfBirth: dob(45),
      gender: 'M',
      chronicConditions: ['Asthma'],
      allergies: ['NSAIDs', 'Dust'],
      emergencyContactName: 'Priya Kumar',
      emergencyContactPhone: '9893103999',
      totalSpent: 900,
      visitCount: 3,
    },
    {
      name: 'Rajesh Patel',
      phone: '9893104004',
      email: 'rajesh.patel@yahoo.com',
      bloodGroup: 'AB+',
      dateOfBirth: dob(62),
      gender: 'M',
      chronicConditions: ['CAD', 'Hypertension', 'Diabetes Type 2'],
      allergies: ['Penicillin'],
      referredBy: 'Dr. Mehta (Cardiologist)',
      emergencyContactName: 'Anita Patel',
      emergencyContactPhone: '9893104999',
      totalSpent: 3200,
      visitCount: 11,
    },
    {
      name: 'Aanya Sharma (via mother)',
      phone: '9893105005',
      bloodGroup: 'O+',
      dateOfBirth: dob(2),
      gender: 'F',
      chronicConditions: [],
      allergies: [],
      referredBy: 'Family',
      totalSpent: 300,
      visitCount: 1,
    },
  ];

  const patients = {};
  for (const p of patientData) {
    const existing = await prisma.customer.findFirst({ where: { tenantId: tenant.id, phone: p.phone } });
    if (!existing) {
      patients[p.name] = await prisma.customer.create({ data: { tenantId: tenant.id, ...p } });
    } else {
      patients[p.name] = existing;
    }
  }

  // ── Appointments ───────────────────────────────────────────────────────────
  const existingAppts = await prisma.appointment.count({ where: { tenantId: tenant.id } });
  if (existingAppts === 0) {
    const sv = services['General Consultation'];
    const svFollowUp = services['Follow-up Consultation'];
    const svEcg = services['ECG'];

    await prisma.appointment.createMany({ data: [
      { tenantId: tenant.id, customerId: patients['Prakash Verma'].id, serviceId: sv.id, title: 'General Consultation', status: 'COMPLETED', startTime: daysAgo(7), endTime: new Date(daysAgo(7).getTime() + 15 * 60000), price: 300 },
      { tenantId: tenant.id, customerId: patients['Prakash Verma'].id, serviceId: svFollowUp.id, title: 'Follow-up', status: 'COMPLETED', startTime: daysAgo(3), endTime: new Date(daysAgo(3).getTime() + 10 * 60000), price: 150 },
      { tenantId: tenant.id, customerId: patients['Rajesh Patel'].id, serviceId: svEcg.id, title: 'ECG Check', status: 'COMPLETED', startTime: daysAgo(2), endTime: new Date(daysAgo(2).getTime() + 15 * 60000), price: 400 },
      { tenantId: tenant.id, customerId: patients['Sunita Joshi'].id, serviceId: sv.id, title: 'General Consultation', status: 'SCHEDULED', startTime: future(1), endTime: new Date(future(1).getTime() + 15 * 60000), price: 300 },
      { tenantId: tenant.id, customerId: patients['Ravi Kumar'].id, serviceId: sv.id, title: 'General Consultation', status: 'SCHEDULED', startTime: future(2), endTime: new Date(future(2).getTime() + 15 * 60000), price: 300 },
    ] });
  }

  // ── Expenses ───────────────────────────────────────────────────────────────
  const existingExpenses = await prisma.expense.count({ where: { tenantId: tenant.id } });
  if (existingExpenses === 0) {
    await prisma.expense.createMany({ data: [
      { tenantId: tenant.id, category: 'RENT', description: 'Clinic rent — AB Road', amount: 22000, date: daysAgo(15) },
      { tenantId: tenant.id, category: 'SALARIES', description: 'Staff salaries — June', amount: 36000, date: daysAgo(10) },
      { tenantId: tenant.id, category: 'SUPPLIES', description: 'Medical supplies — Metropolis Traders', amount: 8500, date: daysAgo(5) },
      { tenantId: tenant.id, category: 'UTILITIES', description: 'Electricity + internet', amount: 3200, date: daysAgo(8) },
    ] });
  }

  console.log('✓ Sharma Medical Centre seed complete');
  console.log('  Login: owner@sharmamedical.test / SharmaClinic@2026');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

module.exports = { seedSharmaClinic: main };
