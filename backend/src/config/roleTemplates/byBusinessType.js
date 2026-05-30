/**
 * Business-type-specific extra roles seeded on registration.
 * Each entry defines custom roles beyond the 6 standard ones.
 * Keys match BusinessType enum values from schema.prisma.
 */

const r   = () => ({ C: false, R: true,  U: false, D: false });
const cr  = () => ({ C: true,  R: true,  U: false, D: false });
const cru = () => ({ C: true,  R: true,  U: true,  D: false });

const EXTRA_ROLES_BY_TYPE = {

  // -- SYL-BC-SVC-GY02 -- GYM ------------------------------------------------
  GYM: [
    {
      templateKey: 'TRAINER',
      name: 'Trainer',
      description: 'Manages member sessions, workout plans and progress notes.',
      color: '#F59E0B',
      isSystem: false,
      permissions: {
        appointments:   { appointments: cru() },
        customers:      { customers: r() },
        membershipplans:{ memberSubscriptions: r() },
        attendance:     { attendance: cr() },
      },
    },
    {
      templateKey: 'FRONT_DESK',
      name: 'Front Desk',
      description: 'Handles member check-in, fee collection and POS.',
      color: '#10B981',
      isSystem: false,
      permissions: {
        pos:            { sales: cr(), receipts: cr() },
        fees:           { feeRecords: cr() },
        customers:      { customers: cru() },
        appointments:   { appointments: cru() },
        attendance:     { attendance: cr() },
        membershipplans:{ memberSubscriptions: r() },
      },
    },
  ],

  // -- SYL-BC-HLC-CL07 -- CLINIC ---------------------------------------------
  CLINIC: [
    {
      templateKey: 'DOCTOR',
      name: 'Doctor',
      description: 'Views and manages patient appointments and medical records.',
      color: '#3B82F6',
      isSystem: false,
      permissions: {
        appointments: { appointments: cru() },
        customers:    { customers: r() },
      },
    },
    {
      templateKey: 'RECEPTIONIST',
      name: 'Receptionist',
      description: 'Books appointments, manages billing and patient check-in.',
      color: '#8B5CF6',
      isSystem: false,
      permissions: {
        appointments: { appointments: cru() },
        invoicing:    { invoices: cr() },
        customers:    { customers: cru() },
      },
    },
    {
      templateKey: 'LAB_TECHNICIAN',
      name: 'Lab Technician',
      description: 'Handles diagnostic records and test result uploads.',
      color: '#06B6D4',
      isSystem: false,
      permissions: {
        customers: { customers: r() },
      },
    },
  ],

  // -- SYL-BC-EDU-CG06 -- COACHING -------------------------------------------
  COACHING: [
    {
      templateKey: 'TEACHER',
      name: 'Teacher',
      description: 'Manages student progress, homework and teaching logs.',
      color: '#7C3AED',
      isSystem: false,
      permissions: {
        students:  { students: r(), progress: cru() },
        customers: { customers: r() },
      },
    },
    {
      templateKey: 'COORDINATOR',
      name: 'Coordinator',
      description: 'Manages fee collection, student enrolment and scheduling.',
      color: '#F97316',
      isSystem: false,
      permissions: {
        fees:      { feeRecords: cru(), feeStructure: r() },
        students:  { students: cru(), progress: r() },
        customers: { customers: cru() },
        invoicing: { invoices: cr() },
      },
    },
  ],

  // -- SYL-BC-BPC-SL06 -- SALON ----------------------------------------------
  SALON: [
    {
      templateKey: 'STYLIST',
      name: 'Stylist',
      description: 'Manages personal appointments and POS for their clients.',
      color: '#EC4899',
      isSystem: false,
      permissions: {
        appointments: { appointments: cru() },
        pos:          { sales: cr(), receipts: r() },
        customers:    { customers: r() },
      },
    },
  ],

  // -- SYL-BC-FNB-RS06 -- RESTAURANT -----------------------------------------
  RESTAURANT: [
    {
      templateKey: 'WAITER',
      name: 'Waiter',
      description: 'Creates POS orders and processes payments at the table.',
      color: '#F59E0B',
      isSystem: false,
      permissions: {
        pos:       { sales: cr(), receipts: cr() },
        inventory: { products: r() },
      },
    },
    {
      templateKey: 'CHEF',
      name: 'Chef',
      description: 'Views kitchen orders and manages inventory consumption.',
      color: '#EF4444',
      isSystem: false,
      permissions: {
        pos:       { sales: r() },
        inventory: { products: r(), categories: r() },
      },
    },
  ],

  // -- SYL-BC-SVC-ML03 -- MALL -----------------------------------------------
  MALL: [
    {
      templateKey: 'SECURITY',
      name: 'Security',
      description: 'Views lease unit information and attendance logs.',
      color: '#6B7280',
      isSystem: false,
      permissions: {
        lease:      { leaseUnits: r() },
        attendance: { attendance: r() },
      },
    },
  ],

  // -- SYL-BC-BPC-BP02 -- BEAUTY_PARLOUR -------------------------------------
  BEAUTY_PARLOUR: [
    {
      templateKey: 'BEAUTICIAN',
      name: 'Beautician',
      description: 'Manages personal appointments and service-based POS.',
      color: '#EC4899',
      isSystem: false,
      permissions: {
        appointments: { appointments: cru() },
        pos:          { sales: cr(), receipts: r() },
        customers:    { customers: r() },
      },
    },
  ],

  // -- SYL-BC-BPC-BR06 -- BARBERSHOP -----------------------------------------
  BARBERSHOP: [
    {
      templateKey: 'BARBER',
      name: 'Barber',
      description: 'Manages walk-in appointments and POS.',
      color: '#0891B2',
      isSystem: false,
      permissions: {
        appointments: { appointments: cru() },
        pos:          { sales: cr(), receipts: r() },
        customers:    { customers: r() },
      },
    },
  ],

  // -- SYL-BC-HLC-DN01 -- DENTAL ---------------------------------------------
  DENTAL: [
    {
      templateKey: 'DENTIST',
      name: 'Dentist',
      description: 'Manages patient appointments and dental records.',
      color: '#3B82F6',
      isSystem: false,
      permissions: {
        appointments: { appointments: cru() },
        customers:    { customers: r() },
      },
    },
  ],

  // -- SYL-BC-EDU-HT01 to CT06 -- Education types ----------------------------
  HOME_TUITION:      teacherCoordinatorRoles(),
  MUSIC_SCHOOL:      teacherCoordinatorRoles(),
  DANCE_ACADEMY:     teacherCoordinatorRoles(),
  DRIVING_SCHOOL:    teacherCoordinatorRoles(),
  COMPUTER_TRAINING: teacherCoordinatorRoles(),

  // -- SYL-BC-FIT -- Fitness & Sports ----------------------------------------
  YOGA_STUDIO:      fitnessInstructorRoles('Yoga Instructor', 'Teaches classes and manages student progress.'),
  MARTIAL_ARTS:     fitnessInstructorRoles('Instructor', 'Manages batch schedules and student progress.'),
  SPORTS_ACADEMY:   fitnessInstructorRoles('Coach', 'Manages training sessions and member progress.'),
  SWIMMING_ACADEMY: fitnessInstructorRoles('Coach', 'Manages swim batches and member attendance.'),
  CROSSFIT_STUDIO:  gymTrainerRoles(),

  // SYL-BC-FIT-SP02 -- SPA
  SPA: [
    {
      templateKey: 'THERAPIST',
      name: 'Therapist',
      description: 'Manages personal appointments and service-based POS billing.',
      color: '#8B5CF6',
      isSystem: false,
      permissions: {
        appointments: { appointments: cru() },
        pos:          { sales: cr(), receipts: r() },
        customers:    { customers: r() },
      },
    },
    {
      templateKey: 'RECEPTIONIST',
      name: 'Receptionist',
      description: 'Front desk: books appointments, checks in clients, processes payments.',
      color: '#EC4899',
      isSystem: false,
      permissions: {
        appointments: { appointments: cru() },
        pos:          { sales: cr(), receipts: cr() },
        customers:    { customers: cru() },
        attendance:   { attendance: cr() },
      },
    },
  ],
};

function gymTrainerRoles() {
  return [
    {
      templateKey: 'TRAINER',
      name: 'Trainer',
      description: 'Manages member sessions, workout plans and progress notes.',
      color: '#F59E0B',
      isSystem: false,
      permissions: {
        appointments:    { appointments: cru() },
        customers:       { customers: r() },
        membershipplans: { memberSubscriptions: r() },
        attendance:      { attendance: cr() },
      },
    },
    {
      templateKey: 'FRONT_DESK',
      name: 'Front Desk',
      description: 'Handles member check-in, fee collection and POS.',
      color: '#10B981',
      isSystem: false,
      permissions: {
        pos:             { sales: cr(), receipts: cr() },
        fees:            { feeRecords: cr() },
        customers:       { customers: cru() },
        appointments:    { appointments: cru() },
        attendance:      { attendance: cr() },
        membershipplans: { memberSubscriptions: r() },
      },
    },
  ];
}

function fitnessInstructorRoles(instructorTitle, instructorDesc) {
  return [
    {
      templateKey: 'INSTRUCTOR',
      name: instructorTitle,
      description: instructorDesc,
      color: '#F59E0B',
      isSystem: false,
      permissions: {
        appointments:    { appointments: cru() },
        customers:       { customers: r() },
        membershipplans: { memberSubscriptions: r() },
        attendance:      { attendance: cr() },
      },
    },
    {
      templateKey: 'FRONT_DESK',
      name: 'Front Desk',
      description: 'Handles member check-in, fee collection and bookings.',
      color: '#10B981',
      isSystem: false,
      permissions: {
        fees:            { feeRecords: cr() },
        customers:       { customers: cru() },
        appointments:    { appointments: cru() },
        attendance:      { attendance: cr() },
        membershipplans: { memberSubscriptions: r() },
      },
    },
  ];
}

function teacherCoordinatorRoles() {
  return [
    {
      templateKey: 'TEACHER',
      name: 'Teacher',
      description: 'Manages student progress and teaching logs.',
      color: '#7C3AED',
      isSystem: false,
      permissions: {
        students:  { students: r(), progress: cru() },
        customers: { customers: r() },
      },
    },
    {
      templateKey: 'COORDINATOR',
      name: 'Coordinator',
      description: 'Handles fee collection and student enrolment.',
      color: '#F97316',
      isSystem: false,
      permissions: {
        fees:      { feeRecords: cru(), feeStructure: r() },
        students:  { students: cru(), progress: r() },
        customers: { customers: cru() },
        invoicing: { invoices: cr() },
      },
    },
  ];
}

module.exports = EXTRA_ROLES_BY_TYPE;
