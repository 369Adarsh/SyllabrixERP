/**
 * Seeds / upserts all Appointments module (SYL-MOD-APT) features.
 * Safe to re-run — uses upsert.
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const features = [
  // ── BASIC ──────────────────────────────────────────────────────────────────
  {
    featureKey: 'apt.appointment_list',
    moduleKey:  'SYL-MOD-APT',
    name:        'Appointment List',
    description: 'Create and view all scheduled appointments',
    tier: 'BASIC', defaultOn: true, sortOrder: 10, dependencies: [],
  },
  {
    featureKey: 'apt.walk_in_booking',
    moduleKey:  'SYL-MOD-APT',
    name:        'Walk-in Booking',
    description: 'Book appointments without linking a patient record (anonymous walk-in)',
    tier: 'BASIC', defaultOn: true, sortOrder: 15, dependencies: [],
  },
  {
    featureKey: 'apt.service_selection',
    moduleKey:  'SYL-MOD-APT',
    name:        'Service Catalog',
    description: 'Pull services with name, price, and duration from the tenant service catalog',
    tier: 'BASIC', defaultOn: true, sortOrder: 20, dependencies: [],
  },
  {
    featureKey: 'apt.status_scheduled',
    moduleKey:  'SYL-MOD-APT',
    name:        'Scheduled Status',
    description: 'Default status assigned on appointment creation',
    tier: 'BASIC', defaultOn: true, sortOrder: 30, dependencies: [],
  },
  {
    featureKey: 'apt.status_confirmed',
    moduleKey:  'SYL-MOD-APT',
    name:        'Confirmed Status',
    description: 'Explicitly confirm a booked appointment before the visit',
    tier: 'BASIC', defaultOn: true, sortOrder: 31, dependencies: [],
  },
  {
    featureKey: 'apt.status_completed',
    moduleKey:  'SYL-MOD-APT',
    name:        'Completed Status',
    description: 'Mark the visit as done; triggers auto-draft clinic bill or invoice',
    tier: 'BASIC', defaultOn: true, sortOrder: 32, dependencies: [],
  },
  {
    featureKey: 'apt.status_cancelled',
    moduleKey:  'SYL-MOD-APT',
    name:        'Cancelled Status',
    description: 'Soft-cancel an appointment — status change only, record is preserved',
    tier: 'BASIC', defaultOn: true, sortOrder: 33, dependencies: [],
  },
  {
    featureKey: 'apt.search_filter',
    moduleKey:  'SYL-MOD-APT',
    name:        'Search',
    description: 'Search appointments by patient name or service name',
    tier: 'BASIC', defaultOn: true, sortOrder: 40, dependencies: [],
  },
  {
    featureKey: 'apt.date_filter',
    moduleKey:  'SYL-MOD-APT',
    name:        'Date Range Filter',
    description: 'Filter appointments by date; default window is past 7 days + next 30 days',
    tier: 'BASIC', defaultOn: true, sortOrder: 41, dependencies: [],
  },
  {
    featureKey: 'apt.kpi_today',
    moduleKey:  'SYL-MOD-APT',
    name:        "Today's Bookings KPI",
    description: "KPI card showing count of today's appointments",
    tier: 'BASIC', defaultOn: true, sortOrder: 50, dependencies: [],
  },
  {
    featureKey: 'apt.kpi_upcoming',
    moduleKey:  'SYL-MOD-APT',
    name:        'Upcoming KPI',
    description: 'KPI card showing count of future appointments',
    tier: 'BASIC', defaultOn: true, sortOrder: 51, dependencies: [],
  },
  {
    featureKey: 'apt.kpi_completed',
    moduleKey:  'SYL-MOD-APT',
    name:        'Completed KPI',
    description: 'KPI card showing completed appointments in the current filtered view',
    tier: 'BASIC', defaultOn: true, sortOrder: 52, dependencies: [],
  },
  {
    featureKey: 'apt.calendar_view',
    moduleKey:  'SYL-MOD-APT',
    name:        'Calendar View',
    description: 'Day/week/month calendar view of appointments',
    tier: 'BASIC', defaultOn: true, sortOrder: 60, dependencies: [],
  },

  // ── STANDARD ───────────────────────────────────────────────────────────────
  {
    featureKey: 'apt.staff_assignment',
    moduleKey:  'SYL-MOD-APT',
    name:        'Staff / Doctor Assignment',
    description: 'Assign each appointment to a specific staff member or doctor',
    tier: 'STANDARD', defaultOn: true, sortOrder: 70, dependencies: [],
  },
  {
    featureKey: 'apt.filter_staff',
    moduleKey:  'SYL-MOD-APT',
    name:        'Filter by Staff',
    description: 'Filter appointment list by assigned doctor or staff member',
    tier: 'STANDARD', defaultOn: true, sortOrder: 71, dependencies: ['apt.staff_assignment'],
  },
  {
    featureKey: 'apt.filter_service',
    moduleKey:  'SYL-MOD-APT',
    name:        'Filter by Service',
    description: 'Filter appointment list by service type',
    tier: 'STANDARD', defaultOn: true, sortOrder: 72, dependencies: ['apt.service_selection'],
  },
  {
    featureKey: 'apt.status_noshow',
    moduleKey:  'SYL-MOD-APT',
    name:        'No-show Status',
    description: 'Mark a confirmed appointment as no-show when the patient does not arrive',
    tier: 'STANDARD', defaultOn: true, sortOrder: 73, dependencies: ['apt.status_confirmed'],
  },
  {
    featureKey: 'apt.whatsapp_confirm',
    moduleKey:  'SYL-MOD-APT',
    name:        'Post-booking WhatsApp',
    description: 'Send a WhatsApp confirmation message to the patient after booking',
    tier: 'STANDARD', defaultOn: true, sortOrder: 80, dependencies: [],
  },
  {
    featureKey: 'apt.reminders',
    moduleKey:  'SYL-MOD-APT',
    name:        'Appointment Reminders',
    description: 'Auto WhatsApp reminder sent to the patient before the appointment time',
    tier: 'STANDARD', defaultOn: true, sortOrder: 81, dependencies: ['apt.whatsapp_confirm'],
  },
  {
    featureKey: 'apt.whatsapp_reminder',
    moduleKey:  'SYL-MOD-APT',
    name:        'Manual WhatsApp Reminder',
    description: 'Send a manual WhatsApp reminder from the appointment row on demand',
    tier: 'STANDARD', defaultOn: true, sortOrder: 82, dependencies: ['apt.reminders'],
  },
  {
    featureKey: 'apt.status_tracking',
    moduleKey:  'SYL-MOD-APT',
    name:        'Status Tracking Flow',
    description: 'Full status flow: booked → confirmed → completed → cancelled',
    tier: 'STANDARD', defaultOn: true, sortOrder: 83, dependencies: [],
  },
  {
    featureKey: 'apt.auto_bill',
    moduleKey:  'SYL-MOD-APT',
    name:        'Auto-Bill on Completion',
    description: 'Auto-create a draft clinic bill (or invoice) when an appointment is completed',
    tier: 'STANDARD', defaultOn: true, sortOrder: 90, dependencies: ['apt.status_completed'],
  },
  {
    featureKey: 'apt.conflict_detection',
    moduleKey:  'SYL-MOD-APT',
    name:        'Conflict Detection',
    description: 'Block double-booking the same doctor in an overlapping time slot',
    tier: 'STANDARD', defaultOn: true, sortOrder: 91, dependencies: ['apt.staff_assignment'],
  },
  {
    featureKey: 'apt.reschedule',
    moduleKey:  'SYL-MOD-APT',
    name:        'Reschedule',
    description: 'Move an appointment to a new date/time with conflict check, resets to Scheduled',
    tier: 'STANDARD', defaultOn: true, sortOrder: 92, dependencies: [],
  },
  {
    featureKey: 'apt.patient_typeahead',
    moduleKey:  'SYL-MOD-APT',
    name:        'Patient Typeahead Search',
    description: 'Search patients by name or phone in the booking form with live autocomplete',
    tier: 'STANDARD', defaultOn: true, sortOrder: 93, dependencies: [],
  },
  {
    featureKey: 'apt.vitals_quick',
    moduleKey:  'SYL-MOD-APT',
    name:        'Quick Vitals (Clinic)',
    description: 'Record patient vitals directly from the appointment row (clinic only)',
    tier: 'STANDARD', defaultOn: true, sortOrder: 100, dependencies: [],
  },
  {
    featureKey: 'apt.emr_quick',
    moduleKey:  'SYL-MOD-APT',
    name:        'Quick EMR Jump (Clinic)',
    description: 'One-click jump to the patient clinical notes / EMR from the appointment row',
    tier: 'STANDARD', defaultOn: true, sortOrder: 101, dependencies: ['apt.vitals_quick'],
  },

  // ── ADVANCED ───────────────────────────────────────────────────────────────
  {
    featureKey: 'apt.recurring',
    moduleKey:  'SYL-MOD-APT',
    name:        'Recurring Appointments',
    description: 'Auto-create repeat appointments on a fixed schedule (daily / weekly / monthly)',
    tier: 'ADVANCED', defaultOn: false, sortOrder: 110, dependencies: [],
  },

  // ── ENTERPRISE ─────────────────────────────────────────────────────────────
  {
    featureKey: 'apt.waitlist',
    moduleKey:  'SYL-MOD-APT',
    name:        'Waitlist Management',
    description: 'Maintain a waitlist and auto-notify the patient when a slot opens up',
    tier: 'ENTERPRISE', defaultOn: false, sortOrder: 120, dependencies: [],
  },
];

async function run() {
  let created = 0, updated = 0;
  for (const f of features) {
    const exists = await p.moduleFeature.findUnique({ where: { featureKey: f.featureKey } });
    if (exists) {
      await p.moduleFeature.update({ where: { featureKey: f.featureKey }, data: { ...f, isActive: true } });
      updated++;
    } else {
      await p.moduleFeature.create({ data: { ...f, isActive: true } });
      created++;
    }
  }
  console.log(`Done — created: ${created} | updated: ${updated} | total: ${features.length}`);
  await p.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
