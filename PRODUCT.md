# Syllabrix — Product Status & Feature Tracker

> Last updated: 2026-05-16

---

## What Syllabrix Is

An AI-powered, modular ERP SaaS for Indian micro and small businesses. One platform that adapts its interface, dashboard KPIs, quick actions, and visible modules to the business type at login — so a kirana owner and a coaching institute director both see a clean, relevant product without clutter.

**Target businesses:** Retail, Kirana, Coaching Institute, Salon, Clinic, Restaurant, Gym, Shopping Mall, Freelancer, Workshop.

---

## Architecture

| Layer | Tech |
|---|---|
| Frontend | React 19 (Vite/JSX), react-router-dom v7, react-hot-toast, lucide-react, react-i18next |
| Backend | Node.js + Express.js |
| ORM | Prisma v5 |
| Database | Supabase PostgreSQL |
| Auth | JWT (access + refresh tokens), bcryptjs, role-based (OWNER / ADMIN / ACCOUNTANT / STAFF) |
| AI | Gemini 1.5 Flash (via @google/generative-ai) |
| WhatsApp | Meta Graph API v19.0 (WhatsApp Cloud API) |
| Barcode | html5-qrcode (camera) + USB keyboard-input detection |
| Biometric | ZKTeco / FingerJet push SDK endpoint |
| i18n | react-i18next — EN, HI, TA, TE, MR |
| Payments | Manual (UPI/Cash/Card/Bank) — Razorpay link integration pending |
| Deployment | Local dev — Railway/Render (backend) + Vercel (frontend) pending |

---

## Business Adaptation Engine

At registration the owner selects their business type. The engine assigns a module set that controls:
- Which nav items are visible in the Sidebar
- Which KPI cards appear on the Dashboard
- Which quick actions are shown on the Dashboard

| Business Type | Active Modules | Dashboard Focus |
|---|---|---|
| **Retail** | POS, Inventory, Invoicing, Customers, Reports | Today's sales, monthly revenue, low stock |
| **Kirana** | POS, Inventory, Invoicing, Customers, Reports | Today's sales, stock alerts, Udhar/credit |
| **Coaching** | Fees, Invoicing, Customers, Reports | Students enrolled, fees collected, overdue fees |
| **Salon** | Appointments, POS, Inventory, Invoicing, Customers, Reports | Appointments today, daily sales, staff in/out |
| **Clinic** | Appointments, Invoicing, Customers, Reports | Patients today, pending appointments, invoices |
| **Restaurant** | POS, Inventory, Invoicing, Customers, Reports | Today's orders, revenue, stock |
| **Gym** | Fees, Appointments, Invoicing, Customers, Reports | Members, classes today, membership fees, overdue |
| **Mall** | Lease, Invoicing, Reports | Occupancy %, vacant units, rent due, collections |
| **Freelancer** | Invoicing, Customers, Reports | Invoiced this month, collections, overdue, clients |
| **Workshop** | POS, Inventory, Invoicing, Customers, Reports | Sales, parts inventory, job billing |

Modules can also be toggled per-tenant via `PATCH /api/v1/tenant/modules/:module`.

---

## Feature Status

### ✅ DONE — Backend Modules (18 modules)

| Module | Routes | Key Features |
|---|---|---|
| **Auth** | `/api/v1/auth` | Register, Login, Staff Login, Refresh, Logout, Forgot/Reset Password |
| **Tenant** | `/api/v1/tenant` | Profile, Module toggle, Stats — Business Adaptation Engine |
| **Users** | `/api/v1/users` | CRUD, Change password, Role management |
| **Inventory** | `/api/v1/inventory` | Categories, Products (barcode/SKU/expiry/batch), Stock adjustments, Tax rates, Low-stock API |
| **POS** | `/api/v1/pos` | Create sale, Transaction history, Auto stock deduction |
| **Invoicing** | `/api/v1/invoices` | Create, Status update, Payment recording, Cancel, GST details |
| **Appointments** | `/api/v1/appointments` | Services CRUD, Appointments CRUD, Status workflow |
| **Fees** | `/api/v1/fees` | Students CRUD, Fee records, Collect, Waive, Overdue query |
| **Lease** | `/api/v1/lease` | Units, Lease tenants, Terminate, Rent due API |
| **Reports** | `/api/v1/reports` | **Business-type-adapted dashboard**, Sales report, Invoice report, Top products, Top customers |
| **AI** | `/api/v1/ai` | Chat (Gemini), Business insights |
| **Customers** | `/api/v1/customers` | CRUD, Credit balance (Udhar), Total spent tracking |
| **Vendors** | `/api/v1/vendors` | Vendor CRUD, Purchase orders, Receive goods |
| **Expenses** | `/api/v1/expenses` | CRUD, Category summary |
| **WhatsApp** | `/api/v1/whatsapp` | Send text/invoice/appointment reminder/fee reminder/rent reminder, Bulk reminders, Inbound webhook, Conversation threads |
| **Assets** | `/api/v1/assets` | Categories, Asset CRUD, SLM/WDV depreciation, Maintenance logs, Disposal |
| **Staff** | `/api/v1/staff` | CRUD, Toggle active, Biometric ID enrollment |
| **Attendance** | `/api/v1/attendance` | Today's roster, Punch IN/OUT, Report (date range), Summary (hours/days), **Device push endpoint for ZKTeco/biometric devices** |

### ✅ DONE — Frontend Pages (20 pages)

| Page | Path | Key Features |
|---|---|---|
| **Login / Register** | `/login`, `/register` | JWT auth, business type selection on register |
| **Dashboard** | `/dashboard` | **Adapts KPIs + quick actions to business type** |
| **Inventory** | `/inventory` | Products with barcode/SKU/expiry, categories, stock movements, tax rates |
| **Point of Sale** | `/pos` | Product grid, cart, **camera barcode scanner**, **USB barcode auto-detect (Enter to add)**, customer select, cash/UPI/card, thermal receipt modal, WhatsApp receipt send |
| **Invoices** | `/invoices` | Create, status management, payment recording, **A4 PDF/print preview modal**, **WhatsApp send button per invoice** |
| **Customers** | `/customers` | CRUD, credit balance (Udhar), total spent, GST |
| **Appointments** | `/appointments` | Calendar view, service management, status workflow, **WhatsApp reminder button** |
| **Fees** | `/fees` | Students, fee records, collect, waive, overdue, **WhatsApp reminder** |
| **Lease** | `/lease` | Units, lease tenants, terminate, rent due panel, **WhatsApp rent reminder** |
| **Vendors & Purchases** | `/vendors` | Vendor CRUD, purchase orders, receive goods |
| **Expenses** | `/expenses` | CRUD, category breakdown, KPI cards, payment method filter |
| **Assets** | `/assets` | Categories, asset list, depreciation progress bars, maintenance history, disposal, **Depreciation schedule table (SLM/WDV)** |
| **Staff & Attendance** | `/staff` | Staff CRUD with biometric ID, today's roster punch IN/OUT, hours worked, **Attendance report (date range)**, **Biometric device webhook panel (ZKTeco)** |
| **Reports** | `/reports` | Sales chart, invoice breakdown, top products, top customers |
| **WhatsApp** | `/whatsapp` | Two-panel inbox, conversation threads, send messages, unread badges |
| **AI Copilot** | `/ai` | Gemini-powered business chat, business context-aware |
| **Settings** | `/settings` | Business profile, team management (add/role/deactivate), change password |
| **InvoiceView** | (modal) | A4 invoice preview, print/PDF, WhatsApp send |
| **POS Receipt** | (modal) | Thermal 80mm receipt, print, WhatsApp send (named customer direct, walk-in with phone input) |

### ✅ DONE — Cross-cutting Features

| Feature | Details |
|---|---|
| **Multilingual UI** | English, हिंदी, தமிழ், తెలుగు, मराठी — language switcher in Sidebar |
| **Barcode Scanner** | Camera (html5-qrcode) + USB keyboard detection in POS and Inventory |
| **Biometric Attendance** | ZKTeco push SDK endpoint, manual punch fallback, hours tracking |
| **WhatsApp Integration** | Meta Cloud API — invoices, reminders, bulk sends, inbound inbox |
| **Invoice PDF/Print** | Browser print-to-PDF (no external library), A4 format |
| **Thermal Receipt** | 80mm POS receipt with print + WhatsApp send |
| **Business Adaptation** | Dashboard, sidebar, and quick actions all adapt to business type |
| **Row-Level Security** | Supabase RLS — deny all for anon/authenticated roles, backend superuser bypasses |
| **Multi-role Auth** | OWNER / ADMIN / ACCOUNTANT / STAFF — route-level and UI-level guards |
| **AI Insights** | Gemini generates 3 actionable insights on dashboard load |
| **Seed Accounts** | 10 test business accounts (all `Test@1234`) covering all business types |

---

## ❌ PENDING — Not Yet Built

| Feature | Priority | Notes |
|---|---|---|
| **Forgot password (frontend)** | High | Backend logic exists (token email), frontend page missing, email sending not wired |
| **GSTR-1 / GST compliance report** | High | Format defined in Indian tax law, needs dedicated report view + export |
| **Razorpay/UPI payment link per invoice** | High | Auto-reconcile via webhook; highest single impact feature for Indian SMBs |
| **Customer credit/Udhar UI** | ✅ Done | Credit balance + credit limit with add/subtract UI on customer 360° panel |
| **Customer 360° Profile** | ✅ Done | Slide-over panel: overview, subscriptions, history, WhatsApp tab — click any customer card |
| **Customer Subscriptions** | ✅ Done | Full subscription lifecycle: add plan, expiry tracking, auto-remind, pause/cancel/renew |
| **Campaign Manager** | ✅ Done | Segment-based WhatsApp campaigns (7 segments), template variables, send/preview |
| **Nightly WhatsApp business digest** | Medium | Cron job → daily P&L/summary → sends to owner's WhatsApp |
| **Pagination on all list APIs** | Medium | All APIs return all records — needs limit/offset for scale |
| **Product expiry alerts** | Medium | Schema has `expiryDate`; needs alert on dashboard + inventory filter |
| **Returns / Refunds flow** | Medium | `StockMovementType.RETURN` exists; no dedicated transaction UI |
| **Staff payroll calculation** | Medium | Staff has salary field; no monthly payroll report |
| **AI promotional video generation** | Low (complex) | Signature feature from README; requires video API + template engine |
| **WhatsApp Catalog sync** | Low | Sync inventory to WhatsApp Business Catalog |
| **Multi-branch / multi-location** | Low | Single store per tenant today |
| **Dark mode** | Low | Design system defines dark tokens; not wired in frontend |
| **Mobile PWA** | Low | Responsive but not installable |
| **Deployment** | Infra | Railway/Render (backend) + Vercel (frontend); WhatsApp webhook needs public URL |

---

## Database Schema Summary

**22 models:** Tenant, User, Customer, Staff, Category, Product, TaxRate, StockMovement, Transaction, TransactionItem, Invoice, InvoiceItem, Payment, Service, Appointment, Student, FeeRecord, LeaseUnit, LeaseTenant, Vendor, PurchaseOrder, PurchaseItem, Expense, WhatsAppMessage, AssetCategory, Asset, AssetMaintenance, AttendanceLog

**Key additions in last build:**
- `AttendanceLog` — punch IN/OUT, biometric device push
- `Staff.biometricId` — enrollment ID for biometric device
- `Staff.department`
- `Customer.creditBalance` + `Customer.creditLimit`
- `Product.expiryDate` + `Product.batchNumber`
- `User.language` — per-user language preference

---

## Test Accounts (seed script at `backend/prisma/seed.js`)

All passwords: `Test@1234`

| Business | Email | Type |
|---|---|---|
| Ramesh Electronics | owner@rameshelectronics.test | RETAIL |
| Sharma Kirana | owner@sharmakirana.test | KIRANA |
| Bright Future Academy | owner@brightfutureacademy.test | COACHING |
| Glamour Studio | owner@glamourstudio.test | SALON |
| Healthcare Plus | owner@healthcareplus.test | CLINIC |
| Spice Garden | owner@spicegarden.test | RESTAURANT |
| FitZone Gym | owner@fitzonegym.test | GYM |
| City Square Mall | owner@citysquaremall.test | MALL |
| Arjun Design | owner@arjundesign.test | FREELANCER |
| AutoFix Workshop | owner@autofixworkshop.test | WORKSHOP |

---

## Biometric Device Integration

**Endpoint:** `POST /api/v1/attendance/device-punch`
**Auth:** None (device-to-server, tenantId in body)
**Body:**
```json
{
  "tenantId": "...",
  "biometricId": "00001",
  "punchType": "IN",
  "punchTime": "2026-05-16T09:12:00.000Z",
  "deviceId": "ZKTeco-001"
}
```
Configure ZKTeco ADMS / FingerJet push to this URL. Staff `biometricId` must match their enrollment ID on the device.

---

## WhatsApp Webhook (pending deployment)

**URL:** `POST https://YOUR-BACKEND/api/v1/whatsapp/webhook`
**Verify token:** `syllabrix_webhook_2025`
Register in Meta Developer Console → WhatsApp → Configuration → Webhook.

---

## Next Steps (recommended order)

1. **Forgot password frontend** — wire the existing backend token flow to a `/forgot-password` page
2. **Customer Udhar UI** — show/edit credit balance on Customer detail, WhatsApp reminder when overdue
3. **Razorpay payment links** — generate per invoice, auto-mark paid via webhook
4. **Product expiry alerts** — dashboard warning + inventory expiry filter
5. **Nightly WhatsApp digest** — cron at 10 PM → daily summary to owner
6. **GSTR-1 export** — GST-compliant invoice report
7. **Deploy** — Railway/Render + Vercel + register WhatsApp webhook
