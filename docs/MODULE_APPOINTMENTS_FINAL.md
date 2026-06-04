# Appointments Module — Final Build Note
**Module Code:** SYL-MOD-APT  
**Business Type:** All (clinic-specific features gate on `businessType === 'CLINIC'`)  
**Date Completed:** 2026-06-03  
**Branch:** dev

---

## 1. What This Module Does

The Appointments module is the central scheduling engine for any time-based business on Syllabrix. For a clinic it is the entry point for every patient visit — from booking → token → vitals → EMR → bill. For a gym it is session booking. For a salon it is service scheduling.

---

## 2. Feature Catalog (29 features — all live in `ModuleFeature` table)

### BASIC — 13 features (unlocked on all plans)

| Feature Key | Name | Business Logic |
|-------------|------|----------------|
| `apt.appointment_list` | Appointment List | Core list view. Default date window: past 7 days + next 30 days |
| `apt.walk_in_booking` | Walk-in Booking | `customerId = null` is valid. No patient record required |
| `apt.service_selection` | Service Catalog | Pulls from `Service` table filtered by `tenantId + isActive` |
| `apt.status_scheduled` | Scheduled Status | Default status on `create`. No side-effects |
| `apt.status_confirmed` | Confirmed Status | Owner/staff explicitly confirms. No side-effects |
| `apt.status_completed` | Completed Status | Triggers auto-bill (see §4). Status is terminal |
| `apt.status_cancelled` | Cancelled Status | Soft cancel — record preserved. Status is terminal |
| `apt.search_filter` | Search | Searches `title`, `customer.name`, `service.name` (case-insensitive) |
| `apt.date_filter` | Date Range Filter | Params: `date`, `from`, `to`. Default if none: -7d to +30d |
| `apt.kpi_today` | Today's Bookings KPI | Derived client-side from loaded appointments |
| `apt.kpi_upcoming` | Upcoming KPI | `startTime > now AND NOT today` |
| `apt.kpi_completed` | Completed KPI | `status === 'COMPLETED'` in current view |
| `apt.calendar_view` | Calendar View | Week grid view toggle. Shows 7-day column layout with colored appointment blocks |

### STANDARD — 14 features (GROWTH plan and above)

| Feature Key | Name | Business Logic |
|-------------|------|----------------|
| `apt.staff_assignment` | Staff / Doctor Assignment | Links to `Staff` record via `staffId`. Falls back to `staffName` free-text |
| `apt.filter_staff` | Filter by Staff | Backend: `WHERE staffId = ? OR staffName LIKE ?` |
| `apt.filter_service` | Filter by Service | Backend: `WHERE serviceId = ?` |
| `apt.status_noshow` | No-show Status | Only available after CONFIRMED. No billing side-effect |
| `apt.whatsapp_confirm` | Post-booking WhatsApp | Opens `wa.me` link with pre-filled confirmation message after booking |
| `apt.reminders` | Appointment Reminders | Auto WhatsApp reminder sent before appointment via automation |
| `apt.whatsapp_reminder` | Manual WhatsApp Reminder | One-click reminder button on appointment row (calls `/whatsapp/send-appointment-reminder/:id`) |
| `apt.status_tracking` | Status Tracking Flow | Full flow: Scheduled → Confirmed → Completed / Cancelled / No-show |
| `apt.auto_bill` | Auto-Bill on Completion | On COMPLETED: creates `ClinicBill` for healthcare types, `Invoice` for others (see §4) |
| `apt.conflict_detection` | Conflict Detection | Backend checks `staffId + overlapping time` before create/update/reschedule. Returns 409 with human message |
| `apt.reschedule` | Reschedule | `PATCH /appointments/:id/reschedule` — preserves duration, runs conflict check, resets to SCHEDULED |
| `apt.patient_typeahead` | Patient Typeahead Search | Debounced 280ms search against `GET /customers?search=`. Dropdown with name + phone. Walk-in fallback |
| `apt.vitals_quick` | Quick Vitals (Clinic) | Renders `<VitalsModal>` inline from the appointment row. CLINIC only |
| `apt.emr_quick` | Quick EMR Jump (Clinic) | `navigate('/emr/:appointmentId')`. CLINIC only |

### ADVANCED — 1 feature (SCALE plan and above)

| Feature Key | Name | Business Logic |
|-------------|------|----------------|
| `apt.recurring` | Recurring Appointments | `POST /appointments` with `{ recurring: { frequency, count } }` creates N appointments. Conflicts are skipped silently with a count returned |

### ENTERPRISE — 1 feature (ENTERPRISE plan only)

| Feature Key | Name | Business Logic |
|-------------|------|----------------|
| `apt.waitlist` | Waitlist Management | Maintain waitlist, auto-notify on slot availability |

---

## 3. Status State Machine

```
              ┌──────────────────────────────────────────────┐
              │                  SCHEDULED                    │ ← default on create
              └──────┬──────────────────────────┬────────────┘
                     │ confirm                  │ cancel
                     ▼                          ▼
              ┌────────────┐            ┌───────────────┐
              │ CONFIRMED  │            │   CANCELLED   │ (terminal)
              └──┬──────┬──┘            └───────────────┘
          complete│      │noshow
                 ▼       ▼
          ┌──────────┐  ┌─────────┐
          │ COMPLETED│  │ NO_SHOW │  (both terminal)
          └──────────┘  └─────────┘
               │
               └─► auto-bill triggered (see §4)
```

---

## 4. Auto-Bill Routing Logic

When `status → COMPLETED` and `service.price > 0`:

```
tenant.businessType ∈ {
  CLINIC, DENTAL, HOSPITAL, NURSING_HOME,
  PHYSIOTHERAPY, AYURVEDA, VET_CLINIC, DIAGNOSTIC_LAB
}
        │
        ├── YES → Create ClinicBill (SYLCB-YYMM-XXXXX)
        │         category: CONSULTATION, isGstExempt: true
        │         Status: DRAFT, dueAmount = service.price
        │
        └── NO  → Create Invoice (SYLINV-YYMM-XXXXX)
                  Status: DRAFT, balanceDue = service.price
```

**Why two separate models?**  
`ClinicBill` has clinic-specific fields: `patientName`, `patientPhone`, `appointmentId`, `doctorId`, GST-exempt consultation billing, and splits: `cashAmount / upiAmount / cardAmount`. Generic `Invoice` is for retail/service businesses with standard GST billing.

---

## 5. Conflict Detection

Runs on: `create`, `update` (when date/time changes), `reschedule`

```
IF staffId is set:
  SELECT appointment WHERE
    tenantId = current
    AND staffId = requested
    AND status NOT IN ('CANCELLED')
    AND startTime < requestedEndTime
    AND endTime > requestedStartTime
    AND id != currentId (excluded on edit/reschedule)

  IF found → throw 409:
    "Dr. Arjun Sharma already has an appointment
     at 10:30 AM with Sunita Verma"
```

Walk-ins without a staff assignment skip conflict checking entirely.

---

## 6. Recurring Appointments

```
POST /appointments
Body: {
  ...appointmentData,
  recurring: {
    frequency: 'daily' | 'weekly' | 'monthly',
    count: 2–52
  }
}

Returns: {
  created: [ ...appointments ],
  skipped: [ { date, reason } ]   ← conflicts silently skipped
}
```

The first occurrence starts on `scheduledAt`. Each subsequent occurrence advances by frequency. Duration is preserved from the first booking.

---

## 7. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/appointments` | List with filters: `date`, `from`, `to`, `staffId`, `serviceId`, `status`, `search`, `noCustomer`, `page`, `limit` |
| `GET` | `/appointments/:id` | Single appointment |
| `POST` | `/appointments` | Create (single or recurring if `recurring` body param present) |
| `PUT` | `/appointments/:id` | Full update (conflict check if date/time changes) |
| `PATCH` | `/appointments/:id/status` | Status change (triggers auto-bill on COMPLETED) |
| `PATCH` | `/appointments/:id/reschedule` | Reschedule: `{ date, time }` — resets to SCHEDULED |
| `DELETE` | `/appointments/:id` | Soft cancel (sets status = CANCELLED) |
| `GET` | `/appointments/services` | List tenant services |
| `POST` | `/appointments/services` | Create service (OWNER/ADMIN only) |

---

## 8. Frontend Components

| Component | File | Purpose |
|-----------|------|---------|
| `Appointments` | `pages/appointments/Appointments.jsx` | Main page — list view + week calendar |
| `BookModal` | inline in Appointments.jsx | Book single or recurring appointment. Patient typeahead + recurring toggle |
| `PatientTypeahead` | inline in Appointments.jsx | Debounced live search for patient records |
| `RescheduleModal` | inline in Appointments.jsx | Change date/time with conflict check |
| `WeekCalendar` | inline in Appointments.jsx | 7-column week grid with day navigation |
| `SessionCard` | inline in Appointments.jsx | Card view for gym/spa sessions |
| `TableRow` | inline in Appointments.jsx | Table row for clinic/non-gym list view |
| `VitalsModal` | `components/clinic/VitalsModal.jsx` | Launched from appointment row (clinic only) |

---

## 9. Business Type Behaviour Matrix

| Feature | CLINIC | GYM / SPA | COACHING | RETAIL / OTHER |
|---------|--------|-----------|----------|---------------|
| Patient label | Patient | Member | Student | Customer |
| Appointment label | Appointment | Training Session | Class | Appointment |
| Auto-bill target | ClinicBill | Invoice | Invoice | Invoice |
| Quick Vitals button | ✅ | ❌ | ❌ | ❌ |
| Quick EMR button | ✅ | ❌ | ❌ | ❌ |
| List layout | Table | Card grid | Table | Table |
| Trainer/Doctor filter | Doctor | Trainer | Teacher | Staff |
| Walk-in toggle filter | ❌ | ✅ | ❌ | ❌ |

---

## 10. What Was NOT Built (Accepted Gaps)

| Gap | Reason / Future Work |
|-----|---------------------|
| SMS notifications | WhatsApp-only platform; SMS is out of scope for v1 |
| Google Calendar / iCal sync | Phase 2 — needs OAuth scope |
| Online booking page (public URL) | Business Builder Phase 3 |
| Video consultation link | Phase 2 — needs WebRTC or Zoom integration |
| Payment collection at booking | Razorpay integration — Phase 2 |
| Waitlist auto-notification | Feature flag exists (`apt.waitlist`) — logic not yet built |

---

## 11. Settings → Module Features Mapping

All 29 features are live in the `ModuleFeature` DB table and visible at:  
**Settings → Module Features → Scheduling → Appointments**

The Enforce toggle (visible for multi-branch businesses) locks a feature on for all branches.  
Plan gate: BASIC features are always visible. STANDARD requires GROWTH+. ADVANCED requires SCALE+. ENTERPRISE requires ENTERPRISE plan.

---

*Syllabrix — SYL-BC-HLC-CL07 | dev branch | 2026-06-03*
