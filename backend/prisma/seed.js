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
  GYM:        ['fees', 'appointments', 'invoicing', 'staff', 'customers', 'reports'],
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
    return existing;
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
  ];

  const col = (s, n) => s.padEnd(n);
  console.log(col('Type', 14) + col('Business', 28) + 'Email');
  console.log('─'.repeat(65));
  for (const [type, biz, email] of accounts) {
    console.log(col(type, 14) + col(biz, 28) + email);
  }
  console.log('\n🔑 Password for all: Test@1234\n');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
