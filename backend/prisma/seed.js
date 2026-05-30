/**
 * Syllabrix — Seed Script
 * Creates one test account for every business type with realistic Indian sample data.
 * Run: node prisma/seed.js
 *
 * All accounts use password: Test@1234
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PASS = 'Test@1234';
const hashed = (p) => bcrypt.hashSync(p, 10);

const BUSINESS_MODULES = {
  RETAIL:     ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  KIRANA:     ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  COACHING:   ['fees', 'students', 'invoicing', 'reports'],
  SALON:      ['appointments', 'pos', 'inventory', 'invoicing', 'staff', 'customers', 'reports'],
  CLINIC:     ['appointments', 'invoicing', 'staff', 'customers', 'reports'],
  RESTAURANT: ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  GYM:        ['fees', 'appointments', 'staff', 'attendance', 'customers', 'reports', 'pos', 'inventory', 'assets', 'membershipplans', 'training', 'expenses', 'whatsapp', 'campaigns', 'ai', 'automation'],
  MALL:       ['lease', 'invoicing', 'reports'],
  FREELANCER: ['invoicing', 'customers', 'reports'],
  WORKSHOP:   ['pos', 'inventory', 'invoicing', 'customers', 'reports'],
  OTHER:      ['pos', 'invoicing', 'customers', 'reports'],
};

// ── Helper ──────────────────────────────────────────────────────────────────
const d = (daysAgo) => new Date(Date.now() - daysAgo * 86400000);
const future = (days) => new Date(Date.now() + days * 86400000);

async function createTenant({ businessName, businessType, ownerName, email, phone, city, state, gstin, address }) {
  // Skip if already exists
  const existing = await prisma.tenant.findUnique({ where: { email } });
  if (existing) {
    console.log(`  ⚡ Already exists: ${businessName} — skipping`);
    return null;
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: businessName,
      businessType,
      email,
      phone,
      address,
      city,
      state,
      gstin,
      modules: BUSINESS_MODULES[businessType],
      users: {
        create: {
          name: ownerName,
          email,
          password: hashed(PASS),
          role: 'OWNER',
          isEmailVerified: true,
        },
      },
    },
  });

  console.log(`  ✓ Created: ${businessName} (${businessType}) — ${email}`);
  return tenant;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. RETAIL — Electronics store
// ═══════════════════════════════════════════════════════════════════════════
async function seedRetail() {
  const t = await createTenant({
    businessName: 'Ramesh Electronics',
    businessType: 'RETAIL',
    ownerName: 'Ramesh Kumar',
    email: 'owner@rameshelectronics.test',
    phone: '9876543210',
    city: 'Delhi', state: 'Delhi', address: '12, Lajpat Nagar, New Delhi',
    gstin: '07AABCR1234A1Z5',
  });
  if (!t) return;

  const cat = await prisma.category.create({ data: { tenantId: t.id, name: 'Mobile Phones' } });
  const cat2 = await prisma.category.create({ data: { tenantId: t.id, name: 'Accessories' } });

  const p1 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat.id, name: 'Samsung Galaxy M34', sku: 'SAM-M34', costPrice: 14000, sellingPrice: 17999, mrp: 18999, stock: 15, unit: 'pcs', lowStockAlert: 3 } });
  const p2 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat.id, name: 'Redmi Note 13', sku: 'RED-N13', costPrice: 11500, sellingPrice: 14499, mrp: 15999, stock: 22, unit: 'pcs', lowStockAlert: 5 } });
  const p3 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat2.id, name: 'Phone Cover (Universal)', sku: 'ACC-PC01', costPrice: 80, sellingPrice: 199, mrp: 299, stock: 120, unit: 'pcs', lowStockAlert: 20 } });
  const p4 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat2.id, name: 'USB-C Charger 65W', sku: 'ACC-CHG65', costPrice: 450, sellingPrice: 799, mrp: 999, stock: 50, unit: 'pcs', lowStockAlert: 10 } });
  await prisma.product.create({ data: { tenantId: t.id, categoryId: cat.id, name: 'Apple iPhone 15', sku: 'APL-15', costPrice: 65000, sellingPrice: 74999, mrp: 79900, stock: 4, unit: 'pcs', lowStockAlert: 2 } });

  const c1 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Suresh Mehta', phone: '9811001001', email: 'suresh@gmail.com', totalSpent: 17999 } });
  const c2 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Priya Sharma', phone: '9811002002', email: 'priya.s@gmail.com', totalSpent: 14698 } });
  await prisma.customer.create({ data: { tenantId: t.id, name: 'Rajesh Singh', phone: '9811003003', totalSpent: 0 } });

  // Invoice
  const inv1 = await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c1.id,
    invoiceNumber: 'INV-RET-001', status: 'PAID',
    subtotal: 17999, taxAmount: 0, discountAmount: 0, total: 17999, amountPaid: 17999, balanceDue: 0,
    issueDate: d(10), dueDate: d(3),
    items: { create: [{ description: 'Samsung Galaxy M34', productId: p1.id, quantity: 1, unitPrice: 17999, taxRate: 0, taxAmount: 0, total: 17999 }] },
  } });
  const inv2 = await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c2.id,
    invoiceNumber: 'INV-RET-002', status: 'SENT',
    subtotal: 14499, taxAmount: 0, discountAmount: 0, total: 14499, amountPaid: 5000, balanceDue: 9499,
    issueDate: d(5), dueDate: future(10),
    items: { create: [{ description: 'Redmi Note 13', productId: p2.id, quantity: 1, unitPrice: 14499, taxRate: 0, taxAmount: 0, total: 14499 }] },
  } });

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'RENT', description: 'Monthly shop rent', amount: 25000, date: d(15), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'UTILITIES', description: 'Electricity bill', amount: 3200, date: d(12), method: 'UPI' },
    { tenantId: t.id, category: 'MARKETING', description: 'Google Ads — mobile phones', amount: 5000, date: d(8), method: 'CARD' },
  ] });

  const v1 = await prisma.vendor.create({ data: { tenantId: t.id, name: 'Samsung India Distributor', contactPerson: 'Ajay Verma', phone: '9810001111', email: 'samsung.dist@vendor.com', paymentTerms: 'NET30' } });
  await prisma.vendor.create({ data: { tenantId: t.id, name: 'Redmi Wholesale', contactPerson: 'Mohan Lal', phone: '9810002222', paymentTerms: 'NET15' } });

  await prisma.purchaseOrder.create({ data: {
    tenantId: t.id, vendorId: v1.id, poNumber: 'PO-RET-001', status: 'RECEIVED',
    subtotal: 70000, total: 70000, orderDate: d(20), receivedDate: d(15),
    items: { create: [
      { productId: p1.id, description: 'Samsung Galaxy M34', quantity: 5, unitCost: 14000, total: 70000, receivedQty: 5 },
    ] },
  } });
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. KIRANA — Grocery store
// ═══════════════════════════════════════════════════════════════════════════
async function seedKirana() {
  const t = await createTenant({
    businessName: 'Sharma Kirana Store',
    businessType: 'KIRANA',
    ownerName: 'Vijay Sharma',
    email: 'owner@sharmakirana.test',
    phone: '9823456789',
    city: 'Mumbai', state: 'Maharashtra', address: '45, Dharavi Road, Mumbai',
    gstin: '27AABCS5678B1Z3',
  });
  if (!t) return;

  const cat = await prisma.category.create({ data: { tenantId: t.id, name: 'Grains & Pulses' } });
  const cat2 = await prisma.category.create({ data: { tenantId: t.id, name: 'Beverages' } });
  const cat3 = await prisma.category.create({ data: { tenantId: t.id, name: 'Personal Care' } });

  const p1 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat.id, name: 'Toor Dal (1kg)', sku: 'GRN-TD1', costPrice: 120, sellingPrice: 145, mrp: 155, stock: 80, unit: 'kg', lowStockAlert: 10 } });
  const p2 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat.id, name: 'Basmati Rice (5kg)', sku: 'GRN-BR5', costPrice: 280, sellingPrice: 340, mrp: 380, stock: 50, unit: 'pkt', lowStockAlert: 8 } });
  const p3 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat2.id, name: 'Amul Milk (1L)', sku: 'BEV-AM1', costPrice: 58, sellingPrice: 68, mrp: 70, stock: 120, unit: 'ltr', lowStockAlert: 20 } });
  await prisma.product.create({ data: { tenantId: t.id, categoryId: cat2.id, name: 'Coca-Cola 2L', sku: 'BEV-CC2', costPrice: 72, sellingPrice: 90, mrp: 95, stock: 60, unit: 'btl', lowStockAlert: 12 } });
  await prisma.product.create({ data: { tenantId: t.id, categoryId: cat3.id, name: 'Colgate MaxFresh', sku: 'PC-CM1', costPrice: 65, sellingPrice: 80, mrp: 90, stock: 40, unit: 'pcs', lowStockAlert: 10 } });

  const c1 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Radha Devi', phone: '9833001001', totalSpent: 3450 } });
  const c2 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Ravi Nair', phone: '9833002002', totalSpent: 1890 } });

  await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c1.id,
    invoiceNumber: 'INV-KIR-001', status: 'PAID',
    subtotal: 678, taxAmount: 0, discountAmount: 0, total: 678, amountPaid: 678, balanceDue: 0,
    issueDate: d(3), dueDate: d(0),
    items: { create: [
      { description: 'Toor Dal (1kg)', productId: p1.id, quantity: 2, unitPrice: 145, total: 290 },
      { description: 'Basmati Rice (5kg)', productId: p2.id, quantity: 1, unitPrice: 340, total: 340 },
      { description: 'Amul Milk (1L)', productId: p3.id, quantity: 2, unitPrice: 68, total: 136 },
    ] },
  } });

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'RENT', description: 'Shop rent — May', amount: 12000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SUPPLIES', description: 'Carry bags & packaging', amount: 1500, date: d(10), method: 'CASH' },
    { tenantId: t.id, category: 'UTILITIES', description: 'Electricity', amount: 2800, date: d(20), method: 'UPI' },
  ] });
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. COACHING — Education center
// ═══════════════════════════════════════════════════════════════════════════
async function seedCoaching() {
  const t = await createTenant({
    businessName: 'Bright Future Academy',
    businessType: 'COACHING',
    ownerName: 'Dr. Anita Patel',
    email: 'owner@brightfutureacademy.test',
    phone: '9867543210',
    city: 'Ahmedabad', state: 'Gujarat', address: 'Plot 7, Satellite Area, Ahmedabad',
    gstin: '24AABCA9012C1Z1',
  });
  if (!t) return;

  const s1 = await prisma.student.create({ data: { tenantId: t.id, name: 'Aryan Patel', phone: '9870001001', email: 'aryan@gmail.com', parentName: 'Sunil Patel', parentPhone: '9870001002', course: 'JEE Mains', batch: 'Batch A — Morning', enrolledAt: d(90) } });
  const s2 = await prisma.student.create({ data: { tenantId: t.id, name: 'Sneha Shah', phone: '9870002001', parentName: 'Meena Shah', parentPhone: '9870002002', course: 'NEET', batch: 'Batch B — Evening', enrolledAt: d(60) } });
  const s3 = await prisma.student.create({ data: { tenantId: t.id, name: 'Rohan Mehta', phone: '9870003001', parentName: 'Girish Mehta', parentPhone: '9870003002', course: 'Class 10 Boards', batch: 'Batch C', enrolledAt: d(45) } });
  const s4 = await prisma.student.create({ data: { tenantId: t.id, name: 'Pooja Nair', phone: '9870004001', parentName: 'Suresh Nair', parentPhone: '9870004002', course: 'JEE Mains', batch: 'Batch A — Morning', enrolledAt: d(30) } });

  // Fees
  await prisma.feeRecord.createMany({ data: [
    { tenantId: t.id, studentId: s1.id, description: 'JEE April Tuition Fee', amount: 8000, discount: 0, netAmount: 8000, dueDate: d(15), status: 'PAID', paidAmount: 8000, paidAt: d(14), paymentMethod: 'UPI', receiptNumber: 'RCP-001' },
    { tenantId: t.id, studentId: s1.id, description: 'JEE May Tuition Fee', amount: 8000, discount: 0, netAmount: 8000, dueDate: future(15), status: 'PENDING', paidAmount: 0 },
    { tenantId: t.id, studentId: s2.id, description: 'NEET April Tuition Fee', amount: 9500, discount: 500, netAmount: 9000, dueDate: d(20), status: 'PAID', paidAmount: 9000, paidAt: d(18), paymentMethod: 'BANK_TRANSFER', receiptNumber: 'RCP-002' },
    { tenantId: t.id, studentId: s2.id, description: 'NEET May Tuition Fee', amount: 9500, discount: 500, netAmount: 9000, dueDate: future(10), status: 'PENDING', paidAmount: 0 },
    { tenantId: t.id, studentId: s3.id, description: 'Boards April Tuition Fee', amount: 5000, discount: 0, netAmount: 5000, dueDate: d(25), status: 'PARTIAL', paidAmount: 2500 },
    { tenantId: t.id, studentId: s3.id, description: 'Study Material Charges', amount: 2000, discount: 0, netAmount: 2000, dueDate: d(30), status: 'OVERDUE', paidAmount: 0 },
    { tenantId: t.id, studentId: s4.id, description: 'JEE May Tuition Fee', amount: 8000, discount: 0, netAmount: 8000, dueDate: future(5), status: 'PENDING', paidAmount: 0 },
  ] });

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'RENT', description: 'Academy rent — May', amount: 35000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SALARIES', description: 'Teacher salaries — April', amount: 80000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SUPPLIES', description: 'Study material printing', amount: 8000, date: d(15), method: 'CASH' },
    { tenantId: t.id, category: 'MARKETING', description: 'Social media ads', amount: 5000, date: d(10), method: 'UPI' },
  ] });
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. SALON — Hair & beauty
// ═══════════════════════════════════════════════════════════════════════════
async function seedSalon() {
  const t = await createTenant({
    businessName: 'Glamour Studio',
    businessType: 'SALON',
    ownerName: 'Nisha Kapoor',
    email: 'owner@glamourstudio.test',
    phone: '9900112233',
    city: 'Bangalore', state: 'Karnataka', address: 'Shop 4, Koramangala 5th Block, Bangalore',
    gstin: '29AABCG3456D1Z7',
  });
  if (!t) return;

  // Staff
  await prisma.staff.createMany({ data: [
    { tenantId: t.id, name: 'Meera D', phone: '9900201001', email: 'meera@glamour.com', role: 'Senior Stylist', salary: 22000, joinedAt: d(365) },
    { tenantId: t.id, name: 'Asha R', phone: '9900202002', role: 'Beautician', salary: 16000, joinedAt: d(180) },
    { tenantId: t.id, name: 'Kavya S', phone: '9900203003', role: 'Junior Stylist', salary: 12000, joinedAt: d(90) },
  ] });

  // Services
  const sv1 = await prisma.service.create({ data: { tenantId: t.id, name: 'Haircut (Women)', duration: 45, price: 500 } });
  const sv2 = await prisma.service.create({ data: { tenantId: t.id, name: 'Hair Colour (Highlights)', duration: 120, price: 2500 } });
  const sv3 = await prisma.service.create({ data: { tenantId: t.id, name: 'Facial', duration: 60, price: 1200 } });
  const sv4 = await prisma.service.create({ data: { tenantId: t.id, name: 'Waxing (Full Arms)', duration: 30, price: 400 } });
  const sv5 = await prisma.service.create({ data: { tenantId: t.id, name: 'Bridal Package', duration: 240, price: 15000 } });

  // Customers
  const c1 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Divya Menon', phone: '9900301001', email: 'divya@gmail.com', totalSpent: 4200 } });
  const c2 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Lakshmi R', phone: '9900302002', email: 'lakshmi@gmail.com', totalSpent: 15000 } });
  const c3 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Sunitha B', phone: '9900303003', totalSpent: 1700 } });

  // Appointments
  await prisma.appointment.create({ data: {
    tenantId: t.id, customerId: c1.id, serviceId: sv1.id,
    title: 'Haircut', status: 'COMPLETED',
    startTime: d(7), endTime: new Date(d(7).getTime() + 45 * 60000), price: 500,
  } });
  await prisma.appointment.create({ data: {
    tenantId: t.id, customerId: c1.id, serviceId: sv3.id,
    title: 'Facial', status: 'SCHEDULED',
    startTime: future(2), endTime: new Date(future(2).getTime() + 60 * 60000), price: 1200,
  } });
  await prisma.appointment.create({ data: {
    tenantId: t.id, customerId: c2.id, serviceId: sv5.id,
    title: 'Bridal Package', status: 'CONFIRMED',
    startTime: future(5), endTime: new Date(future(5).getTime() + 240 * 60000), price: 15000,
  } });
  await prisma.appointment.create({ data: {
    tenantId: t.id, customerId: c3.id, serviceId: sv4.id,
    title: 'Waxing', status: 'COMPLETED',
    startTime: d(3), endTime: new Date(d(3).getTime() + 30 * 60000), price: 400,
  } });

  // Products (retail)
  const cat = await prisma.category.create({ data: { tenantId: t.id, name: 'Hair Care' } });
  await prisma.product.create({ data: { tenantId: t.id, categoryId: cat.id, name: 'Loreal Shampoo 400ml', sku: 'HC-LOR400', costPrice: 280, sellingPrice: 420, mrp: 499, stock: 30, unit: 'btl', lowStockAlert: 5 } });
  await prisma.product.create({ data: { tenantId: t.id, categoryId: cat.id, name: 'Schwarzkopf Hair Colour', sku: 'HC-SCHW', costPrice: 350, sellingPrice: 550, mrp: 650, stock: 18, unit: 'pcs', lowStockAlert: 3 } });

  // Invoices
  await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c2.id,
    invoiceNumber: 'INV-SAL-001', status: 'PAID',
    subtotal: 15000, taxAmount: 0, discountAmount: 0, total: 15000, amountPaid: 15000, balanceDue: 0,
    issueDate: d(30), dueDate: d(25),
    items: { create: [{ description: 'Bridal Package — Hair + Makeup + Saree Draping', quantity: 1, unitPrice: 15000, total: 15000 }] },
  } });

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'RENT', description: 'Salon rent — May', amount: 28000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SALARIES', description: 'Staff salaries', amount: 50000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SUPPLIES', description: 'Beauty products stock', amount: 15000, date: d(15), method: 'CARD' },
  ] });
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CLINIC — Medical clinic
// ═══════════════════════════════════════════════════════════════════════════
async function seedClinic() {
  const t = await createTenant({
    businessName: 'HealthCare Plus Clinic',
    businessType: 'CLINIC',
    ownerName: 'Dr. Rakesh Gupta',
    email: 'owner@healthcareplus.test',
    phone: '9811223344',
    city: 'Hyderabad', state: 'Telangana', address: '23, Banjara Hills, Hyderabad',
    gstin: '36AABCR7890E1Z2',
  });
  if (!t) return;

  // Staff / Doctors
  await prisma.staff.createMany({ data: [
    { tenantId: t.id, name: 'Dr. Priya Reddy', phone: '9811301001', email: 'priya.reddy@clinic.com', role: 'General Physician', salary: 60000, joinedAt: d(730) },
    { tenantId: t.id, name: 'Nurse Sudha', phone: '9811302002', role: 'Nurse', salary: 18000, joinedAt: d(365) },
    { tenantId: t.id, name: 'Receptionist Geetha', phone: '9811303003', role: 'Receptionist', salary: 14000, joinedAt: d(200) },
  ] });

  // Services
  const sv1 = await prisma.service.create({ data: { tenantId: t.id, name: 'General Consultation', duration: 20, price: 500 } });
  const sv2 = await prisma.service.create({ data: { tenantId: t.id, name: 'Specialist Consultation', duration: 30, price: 1200 } });
  const sv3 = await prisma.service.create({ data: { tenantId: t.id, name: 'Blood Test (CBC)', duration: 10, price: 400 } });
  const sv4 = await prisma.service.create({ data: { tenantId: t.id, name: 'ECG', duration: 15, price: 600 } });

  // Customers / Patients
  const c1 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Ramaiah B', phone: '9811401001', email: 'ramaiah@gmail.com', totalSpent: 1100 } });
  const c2 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Sunita K', phone: '9811402002', totalSpent: 500 } });
  const c3 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Hari Prasad', phone: '9811403003', totalSpent: 2000 } });

  // Appointments
  await prisma.appointment.create({ data: { tenantId: t.id, customerId: c1.id, serviceId: sv1.id, title: 'Consultation', status: 'COMPLETED', startTime: d(5), endTime: new Date(d(5).getTime() + 20 * 60000), price: 500 } });
  await prisma.appointment.create({ data: { tenantId: t.id, customerId: c1.id, serviceId: sv3.id, title: 'Blood Test', status: 'COMPLETED', startTime: d(4), endTime: new Date(d(4).getTime() + 10 * 60000), price: 400 } });
  await prisma.appointment.create({ data: { tenantId: t.id, customerId: c2.id, serviceId: sv1.id, title: 'Consultation', status: 'SCHEDULED', startTime: future(1), endTime: new Date(future(1).getTime() + 20 * 60000), price: 500 } });
  await prisma.appointment.create({ data: { tenantId: t.id, customerId: c3.id, serviceId: sv2.id, title: 'Specialist Consultation', status: 'SCHEDULED', startTime: future(3), endTime: new Date(future(3).getTime() + 30 * 60000), price: 1200 } });

  // Invoices
  await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c1.id,
    invoiceNumber: 'INV-CLI-001', status: 'PAID',
    subtotal: 900, taxAmount: 0, discountAmount: 0, total: 900, amountPaid: 900, balanceDue: 0,
    issueDate: d(4), dueDate: d(4),
    items: { create: [
      { description: 'General Consultation', quantity: 1, unitPrice: 500, total: 500 },
      { description: 'Blood Test (CBC)', quantity: 1, unitPrice: 400, total: 400 },
    ] },
  } });

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'RENT', description: 'Clinic rent', amount: 45000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SALARIES', description: 'Staff salaries', amount: 92000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SUPPLIES', description: 'Medical supplies', amount: 12000, date: d(10), method: 'CARD' },
    { tenantId: t.id, category: 'INSURANCE', description: 'Medical insurance', amount: 8000, date: d(60), method: 'BANK_TRANSFER' },
  ] });
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. RESTAURANT
// ═══════════════════════════════════════════════════════════════════════════
async function seedRestaurant() {
  const t = await createTenant({
    businessName: 'Spice Garden Restaurant',
    businessType: 'RESTAURANT',
    ownerName: 'Chef Arun Kumar',
    email: 'owner@spicegarden.test',
    phone: '9756123456',
    city: 'Chennai', state: 'Tamil Nadu', address: '7, Anna Nagar, Chennai',
    gstin: '33AABCS2345F1Z6',
  });
  if (!t) return;

  const cat1 = await prisma.category.create({ data: { tenantId: t.id, name: 'Starters' } });
  const cat2 = await prisma.category.create({ data: { tenantId: t.id, name: 'Main Course' } });
  const cat3 = await prisma.category.create({ data: { tenantId: t.id, name: 'Beverages' } });

  const p1 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat1.id, name: 'Chicken 65', sku: 'STR-C65', costPrice: 80, sellingPrice: 180, mrp: 200, stock: 999, unit: 'plate' } });
  const p2 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat1.id, name: 'Veg Spring Roll', sku: 'STR-VSR', costPrice: 50, sellingPrice: 120, mrp: 140, stock: 999, unit: 'plate' } });
  const p3 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat2.id, name: 'Butter Chicken', sku: 'MC-BC', costPrice: 140, sellingPrice: 320, mrp: 360, stock: 999, unit: 'plate' } });
  const p4 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat2.id, name: 'Dal Makhani', sku: 'MC-DM', costPrice: 80, sellingPrice: 200, mrp: 230, stock: 999, unit: 'plate' } });
  await prisma.product.create({ data: { tenantId: t.id, categoryId: cat3.id, name: 'Fresh Lime Soda', sku: 'BEV-FLS', costPrice: 20, sellingPrice: 60, mrp: 70, stock: 999, unit: 'glass' } });

  const c1 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Karthik M', phone: '9756201001', totalSpent: 1540 } });
  const c2 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Janaki R', phone: '9756202002', totalSpent: 680 } });

  await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c1.id,
    invoiceNumber: 'INV-RST-001', status: 'PAID',
    subtotal: 1100, taxAmount: 198, discountAmount: 0, total: 1298, amountPaid: 1298, balanceDue: 0,
    issueDate: d(2), dueDate: d(2),
    items: { create: [
      { description: 'Butter Chicken', productId: p3.id, quantity: 2, unitPrice: 320, taxRate: 9, taxAmount: 57.6, total: 640 },
      { description: 'Chicken 65', productId: p1.id, quantity: 2, unitPrice: 180, taxRate: 9, taxAmount: 32.4, total: 360 },
      { description: 'Dal Makhani', productId: p4.id, quantity: 1, unitPrice: 200, taxRate: 9, taxAmount: 18, total: 200 },
    ] },
  } });

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'RENT', description: 'Restaurant rent', amount: 60000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SALARIES', description: 'Kitchen & serving staff', amount: 120000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SUPPLIES', description: 'Raw ingredients — May', amount: 80000, date: d(15), method: 'CARD' },
    { tenantId: t.id, category: 'UTILITIES', description: 'Gas & electricity', amount: 18000, date: d(20), method: 'UPI' },
  ] });
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. GYM
// ═══════════════════════════════════════════════════════════════════════════
async function seedGym() {
  const t = await createTenant({
    businessName: 'FitZone Gym',
    businessType: 'GYM',
    ownerName: 'Sanjay Yadav',
    email: 'owner@fitzonegym.test',
    phone: '9845123456',
    city: 'Pune', state: 'Maharashtra', address: '88, Aundh, Pune',
    gstin: '27AABCF4567G1Z8',
  });
  if (!t) return;

  // Staff
  await prisma.staff.createMany({ data: [
    { tenantId: t.id, name: 'Vikram T', phone: '9845201001', role: 'Head Trainer', salary: 30000, joinedAt: d(500) },
    { tenantId: t.id, name: 'Pooja J', phone: '9845202002', role: 'Yoga Instructor', salary: 20000, joinedAt: d(200) },
  ] });

  // Services
  const sv1 = await prisma.service.create({ data: { tenantId: t.id, name: 'Personal Training (1 hr)', duration: 60, price: 800 } });
  const sv2 = await prisma.service.create({ data: { tenantId: t.id, name: 'Yoga Class (45 min)', duration: 45, price: 400 } });
  const sv3 = await prisma.service.create({ data: { tenantId: t.id, name: 'Body Assessment', duration: 30, price: 500 } });

  // Customers / Members
  const c1 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Rahul Desai', phone: '9845301001', email: 'rahul@gmail.com', totalSpent: 3000 } });
  const c2 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Sneha Joshi', phone: '9845302002', email: 'sneha@gmail.com', totalSpent: 2000 } });
  const c3 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Amit Kulkarni', phone: '9845303003', totalSpent: 1500 } });

  // Fee records (monthly memberships)
  const s1 = await prisma.student.create({ data: { tenantId: t.id, name: 'Rahul Desai', phone: '9845301001', email: 'rahul@gmail.com', course: 'Gold Membership', batch: 'Morning', enrolledAt: d(90) } });
  const s2 = await prisma.student.create({ data: { tenantId: t.id, name: 'Sneha Joshi', phone: '9845302002', email: 'sneha@gmail.com', course: 'Silver Membership', batch: 'Evening', enrolledAt: d(60) } });
  const s3 = await prisma.student.create({ data: { tenantId: t.id, name: 'Amit Kulkarni', phone: '9845303003', course: 'Basic Membership', batch: 'Morning', enrolledAt: d(30) } });

  await prisma.feeRecord.createMany({ data: [
    { tenantId: t.id, studentId: s1.id, description: 'Gold Membership — April', amount: 3000, discount: 0, netAmount: 3000, dueDate: d(30), status: 'PAID', paidAmount: 3000, paidAt: d(29), paymentMethod: 'UPI', receiptNumber: 'GYM-001' },
    { tenantId: t.id, studentId: s1.id, description: 'Gold Membership — May', amount: 3000, discount: 0, netAmount: 3000, dueDate: future(2), status: 'PENDING', paidAmount: 0 },
    { tenantId: t.id, studentId: s2.id, description: 'Silver Membership — April', amount: 2000, discount: 0, netAmount: 2000, dueDate: d(25), status: 'PAID', paidAmount: 2000, paidAt: d(24), paymentMethod: 'CASH', receiptNumber: 'GYM-002' },
    { tenantId: t.id, studentId: s2.id, description: 'Silver Membership — May', amount: 2000, discount: 0, netAmount: 2000, dueDate: future(5), status: 'PENDING', paidAmount: 0 },
    { tenantId: t.id, studentId: s3.id, description: 'Basic Membership — May', amount: 1500, discount: 0, netAmount: 1500, dueDate: d(5), status: 'OVERDUE', paidAmount: 0 },
  ] });

  // Appointments
  await prisma.appointment.create({ data: { tenantId: t.id, customerId: c1.id, serviceId: sv1.id, title: 'Personal Training', status: 'SCHEDULED', startTime: future(1), endTime: new Date(future(1).getTime() + 60 * 60000), price: 800 } });
  await prisma.appointment.create({ data: { tenantId: t.id, customerId: c2.id, serviceId: sv2.id, title: 'Yoga Class', status: 'CONFIRMED', startTime: future(0.5), endTime: new Date(future(0.5).getTime() + 45 * 60000), price: 400 } });

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'RENT', description: 'Gym rent — May', amount: 55000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SALARIES', description: 'Trainer salaries', amount: 50000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'MAINTENANCE', description: 'Equipment maintenance', amount: 8000, date: d(15), method: 'CASH' },
    { tenantId: t.id, category: 'UTILITIES', description: 'Electricity (AC)', amount: 22000, date: d(20), method: 'UPI' },
  ] });
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. MALL — Shopping mall
// ═══════════════════════════════════════════════════════════════════════════
async function seedMall() {
  const t = await createTenant({
    businessName: 'City Square Mall',
    businessType: 'MALL',
    ownerName: 'Ravi Agarwal',
    email: 'owner@citysquaremall.test',
    phone: '9900987654',
    city: 'Jaipur', state: 'Rajasthan', address: 'Tonk Road, Jaipur',
    gstin: '08AABCM1122H1Z4',
  });
  if (!t) return;

  // Lease units
  const u1 = await prisma.leaseUnit.create({ data: { tenantId: t.id, unitNumber: 'G-01', floor: 'Ground', area: 450, description: 'Main entrance, corner shop' } });
  const u2 = await prisma.leaseUnit.create({ data: { tenantId: t.id, unitNumber: 'G-02', floor: 'Ground', area: 300, description: 'Food court unit' } });
  const u3 = await prisma.leaseUnit.create({ data: { tenantId: t.id, unitNumber: 'F1-01', floor: '1st Floor', area: 600, description: 'Anchor tenant space' } });
  const u4 = await prisma.leaseUnit.create({ data: { tenantId: t.id, unitNumber: 'F1-02', floor: '1st Floor', area: 250, description: 'Small retail unit' } });
  const u5 = await prisma.leaseUnit.create({ data: { tenantId: t.id, unitNumber: 'F2-01', floor: '2nd Floor', area: 180, description: 'Kiosk space' } });

  // Lease tenants
  await prisma.leaseTenant.create({ data: { tenantId: t.id, unitId: u1.id, businessName: 'Reliance Trends', contactName: 'Deepak Jain', phone: '9900101001', email: 'deepak@reliance.com', monthlyRent: 120000, deposit: 360000, startDate: d(365), endDate: future(365), status: 'ACTIVE' } });
  await prisma.leaseTenant.create({ data: { tenantId: t.id, unitId: u2.id, businessName: 'KFC India', contactName: 'Vishal M', phone: '9900102002', email: 'vishal@kfc.com', monthlyRent: 85000, deposit: 255000, startDate: d(180), endDate: future(545), status: 'ACTIVE' } });
  await prisma.leaseTenant.create({ data: { tenantId: t.id, unitId: u3.id, businessName: 'Shoppers Stop', contactName: 'Anita B', phone: '9900103003', email: 'anita@shoppers.com', monthlyRent: 200000, deposit: 600000, startDate: d(730), endDate: future(270), status: 'ACTIVE' } });
  await prisma.leaseTenant.create({ data: { tenantId: t.id, unitId: u4.id, businessName: 'Bata India', contactName: 'Suresh T', phone: '9900104004', monthlyRent: 65000, deposit: 195000, startDate: d(90), endDate: future(275), status: 'ACTIVE' } });
  await prisma.leaseTenant.create({ data: { tenantId: t.id, unitId: u5.id, businessName: 'Mobile Accessories Hub', contactName: 'Rohit K', phone: '9900105005', monthlyRent: 25000, deposit: 75000, startDate: d(30), endDate: future(335), status: 'ACTIVE' } });

  await prisma.invoice.create({ data: {
    tenantId: t.id,
    invoiceNumber: 'INV-MAL-001', status: 'PAID',
    subtotal: 120000, taxAmount: 0, discountAmount: 0, total: 120000, amountPaid: 120000, balanceDue: 0,
    issueDate: d(30), dueDate: d(25),
    items: { create: [{ description: 'G-01 Rent — April (Reliance Trends)', quantity: 1, unitPrice: 120000, total: 120000 }] },
  } });

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'MAINTENANCE', description: 'Common area maintenance', amount: 75000, date: d(15), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'UTILITIES', description: 'Common area electricity', amount: 45000, date: d(20), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SALARIES', description: 'Security & housekeeping', amount: 80000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'INSURANCE', description: 'Building insurance', amount: 30000, date: d(60), method: 'BANK_TRANSFER' },
  ] });
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. FREELANCER
// ═══════════════════════════════════════════════════════════════════════════
async function seedFreelancer() {
  const t = await createTenant({
    businessName: 'Arjun Design Studio',
    businessType: 'FREELANCER',
    ownerName: 'Arjun Reddy',
    email: 'owner@arjundesign.test',
    phone: '9944123456',
    city: 'Hyderabad', state: 'Telangana', address: 'Banjara Hills, Hyderabad',
    gstin: null,
  });
  if (!t) return;

  const c1 = await prisma.customer.create({ data: { tenantId: t.id, name: 'TechStart Pvt Ltd', phone: '9944201001', email: 'ceo@techstart.com', notes: 'Startup client — UI/UX projects', totalSpent: 75000 } });
  const c2 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Retail Brands Inc', phone: '9944202002', email: 'marketing@retailbrands.com', totalSpent: 35000 } });
  const c3 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Suresh Bakery', phone: '9944203003', notes: 'Small business — logo design', totalSpent: 15000 } });

  await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c1.id,
    invoiceNumber: 'INV-FRL-001', status: 'PAID',
    subtotal: 75000, taxAmount: 13500, discountAmount: 0, total: 88500, amountPaid: 88500, balanceDue: 0,
    issueDate: d(45), dueDate: d(30),
    items: { create: [
      { description: 'UI/UX Design — Mobile App (15 screens)', quantity: 15, unitPrice: 3000, taxRate: 18, taxAmount: 8100, total: 45000 },
      { description: 'Brand Guidelines Document', quantity: 1, unitPrice: 20000, taxRate: 18, taxAmount: 3600, total: 20000 },
      { description: 'Prototype & Handoff', quantity: 1, unitPrice: 10000, taxRate: 18, taxAmount: 1800, total: 10000 },
    ] },
  } });
  await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c2.id,
    invoiceNumber: 'INV-FRL-002', status: 'SENT',
    subtotal: 35000, taxAmount: 6300, discountAmount: 0, total: 41300, amountPaid: 20000, balanceDue: 21300,
    issueDate: d(15), dueDate: future(15),
    items: { create: [
      { description: 'E-commerce Website Redesign', quantity: 1, unitPrice: 35000, taxRate: 18, taxAmount: 6300, total: 35000 },
    ] },
  } });
  await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c3.id,
    invoiceNumber: 'INV-FRL-003', status: 'DRAFT',
    subtotal: 15000, taxAmount: 2700, discountAmount: 0, total: 17700, amountPaid: 0, balanceDue: 17700,
    issueDate: d(2), dueDate: future(28),
    items: { create: [
      { description: 'Logo Design + Brand Kit', quantity: 1, unitPrice: 15000, taxRate: 18, taxAmount: 2700, total: 15000 },
    ] },
  } });

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'TRANSPORT', description: 'Client meetings travel', amount: 2500, date: d(10), method: 'UPI' },
    { tenantId: t.id, category: 'SUPPLIES', description: 'Adobe CC annual subscription', amount: 15000, date: d(30), method: 'CARD' },
    { tenantId: t.id, category: 'MARKETING', description: 'Behance portfolio premium', amount: 3000, date: d(30), method: 'CARD' },
    { tenantId: t.id, category: 'TAXES', description: 'Advance tax Q1', amount: 8000, date: d(45), method: 'BANK_TRANSFER' },
  ] });
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. WORKSHOP — Auto repair
// ═══════════════════════════════════════════════════════════════════════════
async function seedWorkshop() {
  const t = await createTenant({
    businessName: 'AutoFix Workshop',
    businessType: 'WORKSHOP',
    ownerName: 'Mohan Singh',
    email: 'owner@autofixworkshop.test',
    phone: '9833123456',
    city: 'Chandigarh', state: 'Punjab', address: 'Industrial Area Phase 1, Chandigarh',
    gstin: '03AABCM9876I1Z3',
  });
  if (!t) return;

  const cat = await prisma.category.create({ data: { tenantId: t.id, name: 'Engine Parts' } });
  const cat2 = await prisma.category.create({ data: { tenantId: t.id, name: 'Tyres & Wheels' } });
  const cat3 = await prisma.category.create({ data: { tenantId: t.id, name: 'Lubricants' } });

  const p1 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat.id, name: 'Oil Filter (Universal)', sku: 'ENG-OF1', costPrice: 120, sellingPrice: 250, mrp: 300, stock: 40, unit: 'pcs', lowStockAlert: 8 } });
  const p2 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat.id, name: 'Air Filter', sku: 'ENG-AF1', costPrice: 180, sellingPrice: 350, mrp: 420, stock: 25, unit: 'pcs', lowStockAlert: 5 } });
  const p3 = await prisma.product.create({ data: { tenantId: t.id, categoryId: cat3.id, name: 'Castrol Engine Oil 5L', sku: 'LUB-CST5', costPrice: 850, sellingPrice: 1200, mrp: 1350, stock: 30, unit: 'can', lowStockAlert: 5 } });
  await prisma.product.create({ data: { tenantId: t.id, categoryId: cat2.id, name: 'MRF Tyre 185/65 R15', sku: 'TYR-MRF1', costPrice: 3800, sellingPrice: 5200, mrp: 5800, stock: 8, unit: 'pcs', lowStockAlert: 2 } });

  const c1 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Gurpreet Singh', phone: '9833201001', notes: 'Honda City — PB-01-AB-1234', totalSpent: 4800 } });
  const c2 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Harjeet Kaur', phone: '9833202002', notes: 'Maruti Swift — PB-10-CD-5678', totalSpent: 2400 } });
  const c3 = await prisma.customer.create({ data: { tenantId: t.id, name: 'Naveen Kumar', phone: '9833203003', notes: 'Hyundai i20 — PB-65-EF-9012', totalSpent: 0 } });

  await prisma.invoice.create({ data: {
    tenantId: t.id, customerId: c1.id,
    invoiceNumber: 'INV-WRK-001', status: 'PAID',
    subtotal: 4350, taxAmount: 261, discountAmount: 0, total: 4611, amountPaid: 4611, balanceDue: 0,
    issueDate: d(8), dueDate: d(8),
    items: { create: [
      { description: 'Engine Oil Change (Castrol 5L)', productId: p3.id, quantity: 1, unitPrice: 1200, taxRate: 5, taxAmount: 60, total: 1200 },
      { description: 'Oil Filter Replacement', productId: p1.id, quantity: 1, unitPrice: 250, taxRate: 5, taxAmount: 12.5, total: 250 },
      { description: 'Full Servicing Labour', quantity: 1, unitPrice: 2500, taxRate: 5, taxAmount: 125, total: 2500 },
      { description: 'Air Filter Replacement', productId: p2.id, quantity: 1, unitPrice: 350, taxRate: 5, taxAmount: 17.5, total: 350 },
    ] },
  } });

  const v1 = await prisma.vendor.create({ data: { tenantId: t.id, name: 'Castrol India Distributor', contactPerson: 'Rajiv S', phone: '9810555001', paymentTerms: 'NET30' } });
  await prisma.purchaseOrder.create({ data: {
    tenantId: t.id, vendorId: v1.id, poNumber: 'PO-WRK-001', status: 'ORDERED',
    subtotal: 25500, total: 25500, orderDate: d(5), expectedDate: future(7),
    items: { create: [
      { productId: p3.id, description: 'Castrol Engine Oil 5L', quantity: 30, unitCost: 850, total: 25500, receivedQty: 0 },
    ] },
  } });

  await prisma.expense.createMany({ data: [
    { tenantId: t.id, category: 'RENT', description: 'Workshop rent', amount: 18000, date: d(30), method: 'BANK_TRANSFER' },
    { tenantId: t.id, category: 'SALARIES', description: 'Mechanic salaries', amount: 35000, date: d(30), method: 'CASH' },
    { tenantId: t.id, category: 'SUPPLIES', description: 'Workshop tools', amount: 5000, date: d(15), method: 'CARD' },
  ] });
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARMA GROCERY CHAIN — Multi-branch demo tenant (4 branches, 1 year data)
// Login: raj@sharmachain.test / Test@1234
// Branch managers: amit@, sunita@, mohan@, neha@ (all @sharmachain.test)
// ═══════════════════════════════════════════════════════════════════════════
async function seedSharmaChain() {
  const existing = await prisma.tenant.findUnique({ where: { email: 'raj@sharmachain.test' } });
  if (existing) { console.log('  ⚡ Already exists: Sharma Grocery Chain — skipping'); return; }

  // ── Tenant ──────────────────────────────────────────────────────────────
  const t = await prisma.tenant.create({
    data: {
      name: 'Sharma Grocery Chain',
      businessType: 'KIRANA',
      email: 'raj@sharmachain.test',
      phone: '9876501234',
      address: 'Plot 12, Main Market, Indore',
      city: 'Indore',
      state: 'Madhya Pradesh',
      gstin: '23ABCRS1234A1Z7',
      hasBranches: true,
      modules: BUSINESS_MODULES.KIRANA,
      users: {
        create: {
          name: 'Raj Sharma',
          email: 'raj@sharmachain.test',
          password: hashed(PASS),
          role: 'OWNER',
          isEmailVerified: true,
        },
      },
    },
  });
  const tid = t.id;
  const owner = await prisma.user.findFirst({ where: { tenantId: tid, role: 'OWNER' } });

  // ── Branches ─────────────────────────────────────────────────────────────
  const [b1, b2, b3, b4] = await Promise.all([
    prisma.branch.create({ data: { tenantId: tid, name: 'Main Market',    code: 'MAIN', isHQ: true,  address: 'Plot 12, Main Market, Indore',      city: 'Indore', phone: '9876501234', gstin: '23ABCRS1234A1Z7' } }),
    prisma.branch.create({ data: { tenantId: tid, name: 'Station Road',   code: 'STRD', isHQ: false, address: '45, Station Road, Indore',           city: 'Indore', phone: '9876502234', gstin: '23ABCRS1234B1Z8' } }),
    prisma.branch.create({ data: { tenantId: tid, name: 'Vijay Nagar',    code: 'VJNR', isHQ: false, address: 'Shop 7, Vijay Nagar Square, Indore',  city: 'Indore', phone: '9876503234' } }),
    prisma.branch.create({ data: { tenantId: tid, name: 'Palasia Square', code: 'PLSA', isHQ: false, address: '2/1 Palasia Square, Indore',          city: 'Indore', phone: '9876504234' } }),
  ]);

  // ── Tax rates ─────────────────────────────────────────────────────────────
  const [gst5, gst12] = await Promise.all([
    prisma.taxRate.create({ data: { tenantId: tid, name: 'GST 5%',  rate: 5,  isGst: true, cgst: 2.5, sgst: 2.5 } }),
    prisma.taxRate.create({ data: { tenantId: tid, name: 'GST 12%', rate: 12, isGst: true, cgst: 6,   sgst: 6   } }),
  ]);

  // ── Categories ────────────────────────────────────────────────────────────
  const [catGrain, catOil, catSpice, catSnack, catBev, catCare, catDairy] = await Promise.all([
    prisma.category.create({ data: { tenantId: tid, name: 'Grains & Pulses', color: '#059669' } }),
    prisma.category.create({ data: { tenantId: tid, name: 'Oils & Ghee',     color: '#F59E0B' } }),
    prisma.category.create({ data: { tenantId: tid, name: 'Spices & Masalas',color: '#EF4444' } }),
    prisma.category.create({ data: { tenantId: tid, name: 'Packaged Snacks', color: '#F97316' } }),
    prisma.category.create({ data: { tenantId: tid, name: 'Beverages',       color: '#3B82F6' } }),
    prisma.category.create({ data: { tenantId: tid, name: 'Personal Care',   color: '#8B5CF6' } }),
    prisma.category.create({ data: { tenantId: tid, name: 'Dairy',           color: '#06B6D4' } }),
  ]);

  // ── Products (36 SKUs) ────────────────────────────────────────────────────
  const prods = await Promise.all([
    // Grains & Pulses (0-6)
    prisma.product.create({ data: { tenantId: tid, categoryId: catGrain.id, taxRateId: gst5.id, name: 'Basmati Rice 5kg',       sku: 'SC-RICE-BSM', hsnCode: '1006', costPrice: 280,  sellingPrice: 349,  mrp: 375,  stock: 200, unit: 'bag', lowStockAlert: 30 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catGrain.id,                     name: 'Regular Rice 5kg',        sku: 'SC-RICE-REG', hsnCode: '1006', costPrice: 190,  sellingPrice: 235,  mrp: 260,  stock: 300, unit: 'bag', lowStockAlert: 40 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catGrain.id, taxRateId: gst5.id, name: 'Aata 10kg',               sku: 'SC-ATA-10',   hsnCode: '1101', costPrice: 320,  sellingPrice: 385,  mrp: 420,  stock: 250, unit: 'bag', lowStockAlert: 30 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catGrain.id,                     name: 'Chana Dal 1kg',           sku: 'SC-DAL-CHN',  hsnCode: '0713', costPrice: 85,   sellingPrice: 110,  mrp: 125,  stock: 400, unit: 'kg',  lowStockAlert: 50 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catGrain.id,                     name: 'Moong Dal 1kg',           sku: 'SC-DAL-MNG',  hsnCode: '0713', costPrice: 95,   sellingPrice: 125,  mrp: 140,  stock: 350, unit: 'kg',  lowStockAlert: 40 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catGrain.id,                     name: 'Toor Dal 1kg',            sku: 'SC-DAL-TOR',  hsnCode: '0713', costPrice: 110,  sellingPrice: 145,  mrp: 165,  stock: 380, unit: 'kg',  lowStockAlert: 50 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catGrain.id,                     name: 'Urad Dal 1kg',            sku: 'SC-DAL-URD',  hsnCode: '0713', costPrice: 90,   sellingPrice: 118,  mrp: 135,  stock: 320, unit: 'kg',  lowStockAlert: 40 } }),
    // Oils & Ghee (7-10)
    prisma.product.create({ data: { tenantId: tid, categoryId: catOil.id,   taxRateId: gst5.id, name: 'Sunflower Oil 1L',        sku: 'SC-OIL-SFW1', hsnCode: '1512', costPrice: 130,  sellingPrice: 155,  mrp: 175,  stock: 300, unit: 'bottle', lowStockAlert: 40 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catOil.id,   taxRateId: gst5.id, name: 'Mustard Oil 1L',          sku: 'SC-OIL-MST1', hsnCode: '1514', costPrice: 150,  sellingPrice: 175,  mrp: 195,  stock: 240, unit: 'bottle', lowStockAlert: 30 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catOil.id,   taxRateId: gst5.id, name: 'Fortune Refined Oil 5L',  sku: 'SC-OIL-FRT5', hsnCode: '1512', costPrice: 610,  sellingPrice: 739,  mrp: 799,  stock: 120, unit: 'tin',    lowStockAlert: 15 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catOil.id,   taxRateId: gst5.id, name: 'Amul Pure Ghee 500g',     sku: 'SC-GHE-AML',  hsnCode: '0405', costPrice: 300,  sellingPrice: 370,  mrp: 400,  stock: 150, unit: 'tin',    lowStockAlert: 20 } }),
    // Spices (11-17)
    prisma.product.create({ data: { tenantId: tid, categoryId: catSpice.id,                     name: 'Rock Salt 1kg',           sku: 'SC-SLT-RK1',  hsnCode: '2501', costPrice: 18,   sellingPrice: 25,   mrp: 30,   stock: 500, unit: 'kg',     lowStockAlert: 80 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catSpice.id,                     name: 'Sugar 1kg',               sku: 'SC-SUG-1',    hsnCode: '1701', costPrice: 42,   sellingPrice: 52,   mrp: 60,   stock: 600, unit: 'kg',     lowStockAlert: 100 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catSpice.id,                     name: 'Tata Tea Premium 250g',   sku: 'SC-TEA-250',  hsnCode: '0902', costPrice: 90,   sellingPrice: 115,  mrp: 130,  stock: 280, unit: 'pkt',    lowStockAlert: 40 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catSpice.id,                     name: 'Turmeric Powder 100g',    sku: 'SC-SPC-TRM',  hsnCode: '0910', costPrice: 30,   sellingPrice: 45,   mrp: 55,   stock: 350, unit: 'pkt',    lowStockAlert: 50 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catSpice.id,                     name: 'Red Chilli Powder 100g',  sku: 'SC-SPC-RCP',  hsnCode: '0904', costPrice: 35,   sellingPrice: 50,   mrp: 60,   stock: 320, unit: 'pkt',    lowStockAlert: 50 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catSpice.id,                     name: 'Coriander Powder 100g',   sku: 'SC-SPC-CRP',  hsnCode: '0909', costPrice: 28,   sellingPrice: 42,   mrp: 50,   stock: 300, unit: 'pkt',    lowStockAlert: 50 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catSpice.id,                     name: 'Everest Garam Masala 50g',sku: 'SC-SPC-GM50', hsnCode: '0910', costPrice: 55,   sellingPrice: 78,   mrp: 90,   stock: 200, unit: 'pkt',    lowStockAlert: 30 } }),
    // Packaged Snacks (18-22)
    prisma.product.create({ data: { tenantId: tid, categoryId: catSnack.id, taxRateId: gst12.id, name: 'Parle G 800g',           sku: 'SC-BSC-PRG',  hsnCode: '1905', costPrice: 40,   sellingPrice: 55,   mrp: 60,   stock: 400, unit: 'pkt',    lowStockAlert: 60 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catSnack.id, taxRateId: gst12.id, name: 'Britannia Marie 500g',   sku: 'SC-BSC-MRG',  hsnCode: '1905', costPrice: 48,   sellingPrice: 65,   mrp: 72,   stock: 350, unit: 'pkt',    lowStockAlert: 50 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catSnack.id, taxRateId: gst12.id, name: 'Lays Classic 80g',       sku: 'SC-CHI-LYS',  hsnCode: '2008', costPrice: 15,   sellingPrice: 20,   mrp: 20,   stock: 500, unit: 'pcs',    lowStockAlert: 80 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catSnack.id, taxRateId: gst12.id, name: 'Haldiram Namkeen 200g',  sku: 'SC-NMK-HLD',  hsnCode: '2008', costPrice: 65,   sellingPrice: 90,   mrp: 100,  stock: 280, unit: 'pkt',    lowStockAlert: 40 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catSnack.id, taxRateId: gst12.id, name: 'KitKat 4-Finger',        sku: 'SC-CHO-KKT',  hsnCode: '1806', costPrice: 38,   sellingPrice: 55,   mrp: 60,   stock: 300, unit: 'pcs',    lowStockAlert: 50 } }),
    // Beverages (23-26)
    prisma.product.create({ data: { tenantId: tid, categoryId: catBev.id,   taxRateId: gst12.id, name: 'Cold Drink 600ml',       sku: 'SC-CDR-600',  hsnCode: '2202', costPrice: 28,   sellingPrice: 40,   mrp: 40,   stock: 500, unit: 'bottle', lowStockAlert: 80 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catBev.id,                        name: 'Mineral Water 1L',       sku: 'SC-WTR-1L',   hsnCode: '2201', costPrice: 12,   sellingPrice: 20,   mrp: 20,   stock: 600, unit: 'bottle', lowStockAlert: 100 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catBev.id,   taxRateId: gst12.id, name: 'Tropicana Juice 1L',     sku: 'SC-JCE-TRP',  hsnCode: '2009', costPrice: 80,   sellingPrice: 110,  mrp: 125,  stock: 150, unit: 'bottle', lowStockAlert: 20 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catBev.id,   taxRateId: gst12.id, name: 'Boost Health Drink 500g',sku: 'SC-HLT-BST',  hsnCode: '1904', costPrice: 210,  sellingPrice: 275,  mrp: 299,  stock: 100, unit: 'tin',    lowStockAlert: 15 } }),
    // Personal Care (27-32)
    prisma.product.create({ data: { tenantId: tid, categoryId: catCare.id,  taxRateId: gst12.id, name: 'Surf Excel 500g',        sku: 'SC-DET-SRF',  hsnCode: '3402', costPrice: 55,   sellingPrice: 75,   mrp: 85,   stock: 300, unit: 'pkt',    lowStockAlert: 40 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catCare.id,  taxRateId: gst12.id, name: 'Ariel 1kg',              sku: 'SC-DET-ARL',  hsnCode: '3402', costPrice: 185,  sellingPrice: 245,  mrp: 270,  stock: 200, unit: 'pkt',    lowStockAlert: 30 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catCare.id,  taxRateId: gst12.id, name: 'Lifebuoy Soap 100g',     sku: 'SC-SOP-LFB',  hsnCode: '3401', costPrice: 22,   sellingPrice: 32,   mrp: 35,   stock: 500, unit: 'pcs',    lowStockAlert: 80 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catCare.id,  taxRateId: gst12.id, name: 'Head & Shoulders 400ml', sku: 'SC-SHP-HNS',  hsnCode: '3305', costPrice: 220,  sellingPrice: 295,  mrp: 329,  stock: 150, unit: 'bottle', lowStockAlert: 20 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catCare.id,  taxRateId: gst12.id, name: 'Colgate 200g',           sku: 'SC-TPT-COL',  hsnCode: '3306', costPrice: 75,   sellingPrice: 98,   mrp: 110,  stock: 300, unit: 'pcs',    lowStockAlert: 40 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catCare.id,  taxRateId: gst12.id, name: 'Dettol Handwash 250ml',  sku: 'SC-HWS-DTL',  hsnCode: '3401', costPrice: 78,   sellingPrice: 105,  mrp: 120,  stock: 200, unit: 'bottle', lowStockAlert: 30 } }),
    // Dairy (33-35)
    prisma.product.create({ data: { tenantId: tid, categoryId: catDairy.id, taxRateId: gst5.id,  name: 'Amul Butter 500g',       sku: 'SC-BTR-AML',  hsnCode: '0405', costPrice: 218,  sellingPrice: 265,  mrp: 290,  stock: 120, unit: 'pkt',    lowStockAlert: 15 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catDairy.id, taxRateId: gst5.id,  name: 'Amul Milk 1L',           sku: 'SC-MLK-AML',  hsnCode: '0401', costPrice: 62,   sellingPrice: 72,   mrp: 75,   stock: 200, unit: 'pouch',  lowStockAlert: 30 } }),
    prisma.product.create({ data: { tenantId: tid, categoryId: catDairy.id, taxRateId: gst5.id,  name: 'Mother Dairy Curd 400g', sku: 'SC-CRD-MTH',  hsnCode: '0403', costPrice: 42,   sellingPrice: 55,   mrp: 60,   stock: 150, unit: 'pkt',    lowStockAlert: 20 } }),
  ]);

  // ── Branch stock distribution ─────────────────────────────────────────────
  // HQ gets ~40%, Station Road 30%, Vijay Nagar 20%, Palasia 10%
  const branchArr = [b1, b2, b3, b4];
  const stockShare = [0.40, 0.30, 0.20, 0.10];
  const branchStockData = [];
  for (let bi = 0; bi < branchArr.length; bi++) {
    for (let pi = 0; pi < prods.length; pi++) {
      branchStockData.push({
        tenantId: tid,
        branchId: branchArr[bi].id,
        productId: prods[pi].id,
        quantity: Math.max(5, Math.round(prods[pi].stock * stockShare[bi] * (0.85 + (pi * 3 + bi * 7) % 30 / 100))),
      });
    }
  }
  await prisma.branchStock.createMany({ data: branchStockData });

  // ── Branch manager login accounts ─────────────────────────────────────────
  const [mgr1, mgr2, mgr3, mgr4] = await Promise.all([
    prisma.user.create({ data: { tenantId: tid, name: 'Amit Sharma',  email: 'amit@sharmachain.test',   password: hashed(PASS), role: 'MANAGER', branchId: b1.id, isEmailVerified: true } }),
    prisma.user.create({ data: { tenantId: tid, name: 'Sunita Yadav', email: 'sunita@sharmachain.test', password: hashed(PASS), role: 'MANAGER', branchId: b2.id, isEmailVerified: true } }),
    prisma.user.create({ data: { tenantId: tid, name: 'Mohan Lal',    email: 'mohan@sharmachain.test',  password: hashed(PASS), role: 'MANAGER', branchId: b3.id, isEmailVerified: true } }),
    prisma.user.create({ data: { tenantId: tid, name: 'Neha Jain',    email: 'neha@sharmachain.test',   password: hashed(PASS), role: 'MANAGER', branchId: b4.id, isEmailVerified: true } }),
  ]);

  // ── Staff records ─────────────────────────────────────────────────────────
  await prisma.staff.createMany({
    data: [
      { tenantId: tid, branchId: b1.id, name: 'Amit Sharma',   role: 'Manager',   phone: '9876511001', salary: 22000, joinedAt: d(365) },
      { tenantId: tid, branchId: b1.id, name: 'Priya Patel',   role: 'Cashier',   phone: '9876511002', salary: 14000, joinedAt: d(320) },
      { tenantId: tid, branchId: b1.id, name: 'Ravi Kumar',    role: 'Store Boy', phone: '9876511003', salary: 10000, joinedAt: d(280) },
      { tenantId: tid, branchId: b2.id, name: 'Sunita Yadav',  role: 'Manager',   phone: '9876512001', salary: 18000, joinedAt: d(340) },
      { tenantId: tid, branchId: b2.id, name: 'Vikas Singh',   role: 'Cashier',   phone: '9876512002', salary: 13000, joinedAt: d(300) },
      { tenantId: tid, branchId: b2.id, name: 'Deepa Gupta',   role: 'Store Boy', phone: '9876512003', salary: 10000, joinedAt: d(260) },
      { tenantId: tid, branchId: b3.id, name: 'Mohan Lal',     role: 'Manager',   phone: '9876513001', salary: 18000, joinedAt: d(300) },
      { tenantId: tid, branchId: b3.id, name: 'Kavita Sharma', role: 'Cashier',   phone: '9876513002', salary: 13000, joinedAt: d(270) },
      { tenantId: tid, branchId: b3.id, name: 'Suresh Patel',  role: 'Store Boy', phone: '9876513003', salary: 9000,  joinedAt: d(220) },
      { tenantId: tid, branchId: b4.id, name: 'Neha Jain',     role: 'Manager',   phone: '9876514001', salary: 17000, joinedAt: d(250) },
      { tenantId: tid, branchId: b4.id, name: 'Rohit Tiwari',  role: 'Cashier',   phone: '9876514002', salary: 12000, joinedAt: d(220) },
      { tenantId: tid, branchId: b4.id, name: 'Anjali Singh',  role: 'Store Boy', phone: '9876514003', salary: 9000,  joinedAt: d(180) },
    ],
  });

  // ── Customers (30 shared across all branches) ─────────────────────────────
  const customers = await Promise.all([
    { name: 'Vikram Mishra',    phone: '9811101001', email: 'vikram.m@gmail.com'  },
    { name: 'Meena Gupta',      phone: '9811102002', email: 'meena.g@gmail.com'   },
    { name: 'Suresh Patidar',   phone: '9811103003'                               },
    { name: 'Anita Singh',      phone: '9811104004', email: 'anita.s@gmail.com'   },
    { name: 'Rahul Verma',      phone: '9811105005'                               },
    { name: 'Pooja Sharma',     phone: '9811106006', email: 'pooja.sh@gmail.com'  },
    { name: 'Dinesh Tiwari',    phone: '9811107007'                               },
    { name: 'Rekha Patel',      phone: '9811108008', email: 'rekha.p@gmail.com'   },
    { name: 'Ajay Yadav',       phone: '9811109009'                               },
    { name: 'Sunita Joshi',     phone: '9811110010', email: 'sunita.j@gmail.com'  },
    { name: 'Raju Sharma',      phone: '9811111011'                               },
    { name: 'Kamla Bai',        phone: '9811112012'                               },
    { name: 'Manoj Soni',       phone: '9811113013', email: 'manoj.s@gmail.com'   },
    { name: 'Geeta Devi',       phone: '9811114014'                               },
    { name: 'Prakash Verma',    phone: '9811115015'                               },
    { name: 'Sarita Patel',     phone: '9811116016', email: 'sarita.p@gmail.com'  },
    { name: 'Hemant Sharma',    phone: '9811117017'                               },
    { name: 'Uma Devi',         phone: '9811118018'                               },
    { name: 'Vipin Gupta',      phone: '9811119019', email: 'vipin.g@gmail.com'   },
    { name: 'Lalita Singh',     phone: '9811120020'                               },
    { name: 'Mukesh Kumar',     phone: '9811121021'                               },
    { name: 'Sangeeta Bai',     phone: '9811122022'                               },
    { name: 'Vivek Patel',      phone: '9811123023', email: 'vivek.p@gmail.com'   },
    { name: 'Preeti Yadav',     phone: '9811124024'                               },
    { name: 'Ashok Mishra',     phone: '9811125025', email: 'ashok.m@gmail.com'   },
    { name: 'Vandana Sharma',   phone: '9811126026'                               },
    { name: 'Narendra Soni',    phone: '9811127027'                               },
    { name: 'Poonam Gupta',     phone: '9811128028', email: 'poonam.g@gmail.com'  },
    { name: 'Rajesh Patidar',   phone: '9811129029'                               },
    { name: 'Shobha Verma',     phone: '9811130030'                               },
  ].map(c => prisma.customer.create({ data: { tenantId: tid, ...c } })));

  // ── POS Transactions (52 weeks × 4 branches = ~572 sales over 1 year) ────
  // Batched 50 at a time for speed
  const payMethods = ['CASH', 'UPI', 'CASH', 'UPI', 'CARD'];
  let txCounter = 0;
  const branches = [b1, b2, b3, b4];
  const txPerWeek = [4, 3, 2, 2]; // HQ gets more footfall
  let pending = [];

  for (let week = 0; week < 52; week++) {
    for (let bi = 0; bi < 4; bi++) {
      for (let i = 0; i < txPerWeek[bi]; i++) {
        const dayOffset = 365 - week * 7 - i;
        const txDate = new Date(Date.now() - dayOffset * 86400000);
        txCounter++;
        const customer = customers[(week * 4 + i + bi * 7) % customers.length];
        const receiptNo = `SC-${String(txCounter).padStart(5, '0')}`;
        const numItems = 2 + (txCounter % 3);
        const txItems = [];
        let subtotal = 0, taxTotal = 0, txTotal = 0;

        for (let j = 0; j < numItems; j++) {
          const prod = prods[(txCounter * 3 + j * 7 + bi * 11 + week * 2) % prods.length];
          const qty = 1 + (j % 2);
          const gstRate = prod.taxRateId === gst5.id ? 5 : (prod.taxRateId === gst12.id ? 12 : 0);
          const lineSub = qty * prod.sellingPrice;
          const lineTax = gstRate > 0 ? Math.round(lineSub * gstRate / (100 + gstRate) * 100) / 100 : 0;
          subtotal += lineSub;
          taxTotal += lineTax;
          txTotal  += lineSub;
          txItems.push({
            productId: prod.id, name: prod.name, hsnCode: prod.hsnCode || null,
            quantity: qty, unitPrice: prod.sellingPrice, discount: 0,
            gstRate, taxAmount: lineTax,
            cgst: Math.round(lineTax / 2 * 100) / 100,
            sgst: Math.round(lineTax / 2 * 100) / 100,
            igst: 0, total: lineSub,
          });
        }

        pending.push(
          prisma.transaction.create({
            data: {
              tenantId: tid, branchId: branches[bi].id, customerId: customer.id,
              receiptNumber: receiptNo,
              subtotal: Math.round(subtotal * 100) / 100,
              taxAmount: Math.round(taxTotal * 100) / 100,
              discountAmount: 0,
              total: Math.round(txTotal * 100) / 100,
              amountPaid: Math.round(txTotal * 100) / 100,
              change: 0,
              paymentMethod: payMethods[(txCounter + bi) % payMethods.length],
              createdAt: txDate,
              items: { create: txItems },
            },
          })
        );

        if (pending.length >= 50) { await Promise.all(pending); pending = []; }
      }
    }
  }
  if (pending.length) await Promise.all(pending);

  // Update customer totalSpent + visitCount from actual transactions
  const spendAgg = await prisma.transaction.groupBy({
    by: ['customerId'],
    where: { tenantId: tid },
    _sum: { total: true },
    _count: { _all: true },
  });
  await Promise.all(
    spendAgg.filter(r => r.customerId).map(r =>
      prisma.customer.update({
        where: { id: r.customerId },
        data: { totalSpent: r._sum.total || 0, visitCount: r._count._all, lastVisitAt: new Date() },
      })
    )
  );

  // ── B2B Invoices (monthly for the last 12 months, HQ branch) ─────────────
  const b2bCust = await prisma.customer.create({ data: { tenantId: tid, name: 'Indore Caterers Pvt Ltd', phone: '9800001001', email: 'purchase@indorecaterers.com', gstin: '23AABCI9876B1Z4' } });
  for (let month = 0; month < 12; month++) {
    const issueDate = d(30 * (11 - month) + 15);
    const dueDate   = new Date(issueDate.getTime() + 30 * 86400000);
    const baseAmt   = 45000 + month * 2000;
    const taxAmt    = Math.round(baseAmt * 0.05);
    const totalAmt  = baseAmt + taxAmt;
    const paid      = month <= 9;
    await prisma.invoice.create({ data: {
      tenantId: tid, branchId: b1.id, customerId: b2bCust.id,
      invoiceNumber: `INV-SC-${String(month + 1).padStart(3, '0')}`,
      status: paid ? 'PAID' : (month === 10 ? 'SENT' : 'DRAFT'),
      subtotal: baseAmt, taxAmount: taxAmt, discountAmount: 0,
      total: totalAmt, amountPaid: paid ? totalAmt : 0, balanceDue: paid ? 0 : totalAmt,
      issueDate, dueDate,
      items: { create: [
        { description: 'Bulk Rice 100kg',           quantity: 20, unitPrice: 235,   taxRate: 5, taxAmount: Math.round(20*235*5/105*100)/100,  total: 20*235   },
        { description: 'Bulk Sunflower Oil 5L×20',  quantity: 20, unitPrice: 739,   taxRate: 5, taxAmount: Math.round(20*739*5/105*100)/100,  total: 20*739   },
        { description: 'Mixed Groceries Assorted',  quantity: 1,  unitPrice: baseAmt - 20*235 - 20*739, taxRate: 0, taxAmount: 0, total: baseAmt - 20*235 - 20*739 },
      ]},
    }});
  }

  // ── Expenses (12 months × 4 branches: rent, utilities, salaries) ─────────
  const branchExpConfig = [
    { branch: b1, rent: 35000, elec: 5500, salaries: 46000, label: 'Main Market'    },
    { branch: b2, rent: 22000, elec: 3200, salaries: 41000, label: 'Station Road'   },
    { branch: b3, rent: 18000, elec: 2800, salaries: 40000, label: 'Vijay Nagar'    },
    { branch: b4, rent: 16000, elec: 2500, salaries: 38000, label: 'Palasia Square' },
  ];
  const expenseRows = [];
  for (let month = 0; month < 12; month++) {
    for (const { branch, rent, elec, salaries, label } of branchExpConfig) {
      expenseRows.push(
        { tenantId: tid, branchId: branch.id, category: 'RENT',      description: `Monthly rent — ${label}`,       amount: rent,     date: d(30 * (11 - month) + 5),  method: 'BANK_TRANSFER' },
        { tenantId: tid, branchId: branch.id, category: 'UTILITIES',  description: `Electricity — ${label}`,        amount: elec,     date: d(30 * (11 - month) + 10), method: 'UPI'           },
        { tenantId: tid, branchId: branch.id, category: 'SALARIES',   description: `Staff salaries — ${label}`,     amount: salaries, date: d(30 * (11 - month) + 1),  method: 'BANK_TRANSFER' },
      );
    }
  }
  // Additional one-off expenses
  expenseRows.push(
    { tenantId: tid, branchId: b1.id, category: 'MARKETING',   description: 'WhatsApp campaign — Diwali offers', amount: 8000, date: d(45),  method: 'UPI'           },
    { tenantId: tid, branchId: b1.id, category: 'MARKETING',   description: 'Pamphlets & in-store banners',      amount: 3500, date: d(90),  method: 'CASH'          },
    { tenantId: tid, branchId: b1.id, category: 'MAINTENANCE', description: 'AC service & repairs',              amount: 4200, date: d(130), method: 'CASH'          },
    { tenantId: tid, branchId: b2.id, category: 'MAINTENANCE', description: 'Display shelf repair',              amount: 1800, date: d(60),  method: 'CASH'          },
    { tenantId: tid, branchId: b3.id, category: 'SUPPLIES',    description: 'Carry bags & packaging material',   amount: 2200, date: d(20),  method: 'CASH'          },
    { tenantId: tid,                  category: 'OTHER',        description: 'Syllabrix software subscription',   amount: 2999, date: d(15),  method: 'CARD'          },
  );
  // Batch createMany in chunks of 50 to avoid query size limits
  for (let i = 0; i < expenseRows.length; i += 50) {
    await prisma.expense.createMany({ data: expenseRows.slice(i, i + 50) });
  }

  // ── Stock transfers between branches ──────────────────────────────────────
  const trf = (n) => `TRF-2505-${String(n).padStart(5, '0')}`;
  await Promise.all([
    // 1. HQ → Palasia: sugar + rice restocking (RECEIVED)
    prisma.stockTransfer.create({ data: {
      tenantId: tid, transferNumber: trf(1), fromBranchId: b1.id, toBranchId: b4.id,
      status: 'RECEIVED', requestedById: owner.id, approvedById: owner.id,
      notes: 'Palasia running low on staples',
      items: { create: [
        { productId: prods[12].id, quantity: 50, unitCost: 42  }, // Sugar
        { productId: prods[1].id,  quantity: 20, unitCost: 190 }, // Regular Rice
      ]},
    }}),
    // 2. Station Road → Vijay Nagar: oil for Diwali rush (RECEIVED)
    prisma.stockTransfer.create({ data: {
      tenantId: tid, transferNumber: trf(2), fromBranchId: b2.id, toBranchId: b3.id,
      status: 'RECEIVED', requestedById: mgr3.id, approvedById: owner.id,
      notes: 'Vijay Nagar needs oil — festival season',
      items: { create: [
        { productId: prods[7].id, quantity: 30, unitCost: 130 }, // Sunflower Oil
      ]},
    }}),
    // 3. HQ → Vijay Nagar: EMERGENCY ghee (IN_TRANSIT)
    prisma.stockTransfer.create({ data: {
      tenantId: tid, transferNumber: trf(3), fromBranchId: b1.id, toBranchId: b3.id,
      status: 'IN_TRANSIT', isEmergency: true, requestedById: mgr3.id, approvedById: owner.id,
      notes: 'URGENT — Vijay Nagar out of ghee',
      items: { create: [
        { productId: prods[10].id, quantity: 15, unitCost: 300 }, // Ghee
      ]},
    }}),
    // 4. Station Road → Palasia: biscuits for festival (APPROVED)
    prisma.stockTransfer.create({ data: {
      tenantId: tid, transferNumber: trf(4), fromBranchId: b2.id, toBranchId: b4.id,
      status: 'APPROVED', requestedById: mgr4.id, approvedById: mgr2.id,
      notes: 'Festival season biscuit restocking',
      items: { create: [
        { productId: prods[18].id, quantity: 50, unitCost: 40 }, // Parle G
        { productId: prods[19].id, quantity: 30, unitCost: 48 }, // Britannia
      ]},
    }}),
    // 5. HQ → Station Road: pending request (REQUESTED)
    prisma.stockTransfer.create({ data: {
      tenantId: tid, transferNumber: trf(5), fromBranchId: b1.id, toBranchId: b2.id,
      status: 'REQUESTED', requestedById: mgr2.id,
      notes: 'Station Road running low on multiple items',
      items: { create: [
        { productId: prods[0].id,  quantity: 25, unitCost: 280 }, // Basmati Rice
        { productId: prods[6].id,  quantity: 20, unitCost: 90  }, // Urad Dal
        { productId: prods[13].id, quantity: 30, unitCost: 90  }, // Tea
      ]},
    }}),
  ]);

  console.log(`  ✓ Created: Sharma Grocery Chain (KIRANA) — raj@sharmachain.test`);
  console.log(`    └─ 4 branches: Main Market (HQ), Station Road, Vijay Nagar, Palasia Square`);
  console.log(`    └─ ${prods.length} products, 30 customers, 12 staff, 4 branch managers`);
  console.log(`    └─ ${txCounter} POS transactions (1 year), 12 B2B invoices, ${expenseRows.length} expenses, 5 stock transfers`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n🌱 Syllabrix Seed Script — Creating test accounts for all business types\n');
  console.log('─'.repeat(65));

  await seedRetail();
  await seedKirana();
  await seedCoaching();
  await seedSalon();
  await seedClinic();
  await seedRestaurant();
  await seedGym();
  await seedMall();
  await seedFreelancer();
  await seedWorkshop();
  await seedSharmaChain();

  console.log('\n' + '─'.repeat(65));
  console.log('\n✅ Seed complete! All accounts use password: Test@1234\n');
  console.log('📋 Login credentials:\n');

  const accounts = [
    ['Retail',      'Ramesh Electronics',       'owner@rameshelectronics.test'],
    ['Kirana',      'Sharma Kirana Store',       'owner@sharmakirana.test'],
    ['Coaching',    'Bright Future Academy',     'owner@brightfutureacademy.test'],
    ['Salon',       'Glamour Studio',            'owner@glamourstudio.test'],
    ['Clinic',      'HealthCare Plus Clinic',    'owner@healthcareplus.test'],
    ['Restaurant',  'Spice Garden Restaurant',   'owner@spicegarden.test'],
    ['Gym',         'FitZone Gym',               'owner@fitzonegym.test'],
    ['Mall',        'City Square Mall',          'owner@citysquaremall.test'],
    ['Freelancer',  'Arjun Design Studio',       'owner@arjundesign.test'],
    ['Workshop',    'AutoFix Workshop',          'owner@autofixworkshop.test'],
    ['Chain-Kirana','Sharma Grocery Chain',      'raj@sharmachain.test'],
  ];

  const col = (s, n) => s.padEnd(n);
  console.log(col('Type', 14) + col('Business', 28) + 'Email');
  console.log('─'.repeat(65));
  for (const [type, biz, email] of accounts) {
    console.log(col(type, 14) + col(biz, 28) + email);
  }
  console.log('\n🔑 Password for all: Test@1234\n');
  console.log('📍 Sharma Chain branch managers:');
  console.log('   Main Market  (HQ) — amit@sharmachain.test');
  console.log('   Station Road      — sunita@sharmachain.test');
  console.log('   Vijay Nagar       — mohan@sharmachain.test');
  console.log('   Palasia Square    — neha@sharmachain.test\n');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
