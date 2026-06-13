# Syllabrix — Master Competitive Analysis
### 46 Competitors. Every Vertical. Every Gap. The Path to #1.
**Last Updated:** June 2026 | **Scope:** Indian SMB ERP & SaaS Market

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Syllabrix at a Glance](#2-syllabrix-at-a-glance)
3. [Competitive Landscape Map](#3-competitive-landscape-map)
4. [Category 1 — Billing, Accounting & POS](#4-category-1--billing-accounting--pos)
5. [Category 2 — Pharmacy Software](#5-category-2--pharmacy-software)
6. [Category 3 — Clinic & Healthcare](#6-category-3--clinic--healthcare)
7. [Category 4 — Salon & Beauty](#7-category-4--salon--beauty)
8. [Category 5 — Gym & Fitness](#8-category-5--gym--fitness)
9. [Category 6 — Restaurant & Food](#9-category-6--restaurant--food)
10. [Category 7 — Education & Coaching](#10-category-7--education--coaching)
11. [Category 8 — Multi-Industry ERP](#11-category-8--multi-industry-erp)
12. [Syllabrix Strengths — Where We Win](#12-syllabrix-strengths--where-we-win)
13. [Syllabrix Gaps — Where We Lose](#13-syllabrix-gaps--where-we-lose)
14. [The Gap Priority Matrix](#14-the-gap-priority-matrix)
15. [Roadmap to #1 — What to Build and When](#15-roadmap-to-1--what-to-build-and-when)
16. [What Can Be Achieved](#16-what-can-be-achieved)
17. [Pricing Benchmark](#17-pricing-benchmark)

---

## 1. Executive Summary

Syllabrix is a **multi-industry adaptive ERP SaaS** built for Indian micro and small businesses. Its core differentiation — a Business Adaptation Engine that reshapes the entire product per industry — is unique in the Indian market. No competitor adapts UI, KPIs, sidebar, default roles, and enabled modules simultaneously at registration for 70+ business types.

However, **Syllabrix is incomplete in ways that block adoption** in most verticals today:
- No e-invoicing (IRN) or e-way bill — rejected by every accountant in India
- No offline mode — fails in Tier-2/3 cities where internet is unreliable
- No pharmacy retail POS — medical stores cannot use it
- No dental tooth charting — dentists cannot use it
- No staff commissions — salons won't adopt it
- No KOT/table management — restaurants cannot use it
- No student/member app — education/gym competition is Classplus and Akton

**The opportunity is real and large.** The Indian SMB ERP market has no single product that does what Syllabrix attempts. Every vertical has a specialist with limited scope, and every multi-industry ERP (Zoho, Odoo, ERPNext) is too complex for a kirana owner or salon operator. **Syllabrix can own this gap if the right features are built in the right order.**

---

## 2. Syllabrix at a Glance

| Dimension | Detail |
|---|---|
| **Product Type** | Multi-industry adaptive ERP SaaS |
| **Tech Stack** | React 19 (Vite) + Express.js + Prisma + PostgreSQL (Supabase) |
| **Business Types** | 70 types across 15 categories (SYL-BC-* system) |
| **Backend Modules** | 57 modules |
| **Database Models** | 120+ Prisma models |
| **Key Integrations** | Meta WhatsApp Cloud API v19, Razorpay, Google Gemini AI, ZKTeco biometric |
| **Deployment** | Railway (backend) + Vercel (frontend) |
| **Environments** | Dev (localhost), Quality (Render), Production (Railway) |
| **Industries Covered** | Retail, Healthcare, Fitness, Beauty, Education, F&B, Events, Transport, Construction, Professional Services, B2B Trade |
| **Platform Admin** | Syllabrix Nerve Center — 7-wing internal operations layer |
| **Unique IP** | Business Adaptation Engine, WhatsApp-native integration, AI business insights, B2B Marketplace |
| **Build Status** | ~60% feature-complete. MVP-ready for 3–4 verticals. Not production-ready for all 70. |

---

## 3. Competitive Landscape Map

```
                    SINGLE INDUSTRY ◄────────────────────► MULTI INDUSTRY
                         │                                       │
HIGH     Zenoti (Salon)  │   Practo Ray (Clinic)     Zoho One   │  ERPNext
PRICE    Posist (Rest.)  │   Classplus (Edu)         Odoo        │  Syllabrix*
         Mindbody (Gym)  │   Dentobees (Dental)                  │
         ────────────────┼───────────────────────────────────────┤
LOW      Akton (Gym)     │   MioSalon                Vyapar      │  myBillBook
PRICE    Fresha (Salon)  │   Petpooja (Rest.)        Busy        │  Swipe
         OkCredit        │   DocPulse (Clinic)       Khatabook   │  GrofleX
                         │                                       │
                    *Syllabrix goal: Top-right quadrant (multi-industry, premium-but-accessible)
```

**Market Whitespace:** Multi-industry, affordable (₹500–2,000/month), India-native, WhatsApp-first, adaptive UI. **No product sits here today. That is Syllabrix's target position.**

---

## 4. Category 1 — Billing, Accounting & POS

### Competitors in this category:
Vyapar, TallyPrime, Zoho Books, Busy Accounting, myBillBook, Swipe, Khatabook, OkCredit, Refrens, Giddh, Munim, GrofleX, Gofrugal, Zoho One

---

### 4.1 Full Feature Comparison

| Feature | Vyapar | TallyPrime | Zoho Books | Busy | myBillBook | Swipe | Khatabook | Syllabrix |
|---|---|---|---|---|---|---|---|---|
| GST Invoicing | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ⚠️ Basic | ⚠️ Partial |
| **e-Invoicing (IRN/QR)** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ **MISSING** |
| **e-Way Bill** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ **MISSING** |
| **GSTR-1 Export** | ✅ | ✅ | ✅ (GSP) | ✅ | ✅ | ✅ | ❌ | ❌ **MISSING** |
| GSTR-3B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ **MISSING** |
| **Offline Mode** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ **MISSING** |
| **Mobile App** | ✅ Android+iOS | ⚠️ Limited | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ **MISSING** |
| POS Billing | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Barcode Scan | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ (camera+USB) |
| Inventory Management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Purchase Orders | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | ✅ |
| Vendor Management | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | ✅ |
| Quotations | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Credit Notes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Recurring Invoices | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **WhatsApp Native** | ✅ | ⚠️ Add-on | ⚠️ Via CRM | ✅ | ✅ | ✅ | ✅ | ✅ **Best-in-class** |
| WA Campaigns | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| UPI QR Payment | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ⚠️ Via Razorpay |
| Udhar / Credit Balance | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ | ✅ |
| Loyalty Points | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Multi-Branch | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Payroll | ❌ | ✅ | Add-on | ✅ | ✅ | ❌ | ❌ | ✅ |
| Attendance + Biometric | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ✅ (ZKTeco) |
| Asset Management | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ (SLM+WDV) |
| P&L Report | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Balance Sheet | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ Skeleton |
| **True GL Accounting** | ⚠️ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Tally Export | ❌ | N/A | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI Insights | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Industry-Adaptive UI | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Pricing (₹/month) | 293 | 750–2,250 | Free–9,999 | 917 | 33–300 | Free/low | Free | Unknown |

**Legend:** ✅ = Full feature | ⚠️ = Partial / Limited | ❌ = Missing

---

### 4.2 Verdict

**Syllabrix wins on:** WhatsApp campaigns, multi-branch, loyalty, udhar, AI insights, adaptive UI, payroll+attendance in one product.

**Syllabrix loses on:** The three non-negotiables for Indian businesses — e-invoicing (IRN), e-way bill, and GSTR-1 export. Without these three, **no accountant in India will approve Syllabrix.** This is the #1 blocker across all verticals, not just billing.

---

## 5. Category 2 — Pharmacy Software

### Competitors: Marg Pharmacy, Gofrugal Pharmacy, Busy Pharma, Phairo, MedKit ERP

---

### 5.1 Full Feature Comparison

| Feature | Marg Pharmacy | Gofrugal Pharmacy | Phairo | MedKit ERP | Syllabrix |
|---|---|---|---|---|---|
| GST Billing | ✅ | ✅ | ✅ | ✅ | ✅ |
| Batch Tracking | ✅ | ✅ | ✅ | ✅ | ✅ |
| Expiry Tracking + Alerts | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Pharmacy Retail POS (OTC Counter)** | ✅ | ✅ | ✅ | ✅ | ❌ **MISSING** |
| **Drug Licence Tracking** | ✅ | ✅ | ❌ | ❌ | ❌ **MISSING** |
| **Scheme Management (distributor)** | ✅ | ❌ | ❌ | ❌ | ❌ **MISSING** |
| **e-Way Bill** | ✅ | ✅ | ❌ | ❌ | ❌ **MISSING** |
| Schedule H Register | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Prescription Linking | ❌ | ❌ | ✅ | ✅ | ✅ |
| Rx QR Verification | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| WhatsApp Native | ✅ | ⚠️ | ✅ | ❌ | ✅ |
| ABDM Integration | ✅ | ✅ | ❌ | ❌ | ⚠️ Skeleton |
| Offline Mode | ✅ | ✅ | ❌ | ❌ | ❌ |
| Mobile App | ✅ | ✅ | ✅ | ✅ | ❌ |
| Nationwide Support Centers | 800+ | 100+ | Limited | Limited | None |
| Indian Drug Database | ✅ | ✅ | ✅ | ✅ | ✅ (200+ drugs) |
| Clinic Integration | ❌ | ❌ | ⚠️ | ✅ | ✅ **Best** |
| IPD / OPD Link | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Pricing (₹/month) | ~1,050 | ~667 | Custom | Custom | Unknown |

---

### 5.2 Verdict

**Syllabrix wins on:** Schedule H register, Rx QR verification, clinic-to-pharmacy integration (OPD → dispense in one system), full IPD link for hospital pharmacies.

**Syllabrix loses on:** The retail counter. A chemist shop bills 50–100 customers per hour. The current `ClinicDispense` model is designed for clinic use. A dedicated **pharmacy retail POS** (product search by generic/brand name, quantity, optional patient name, instant receipt) is completely absent. Marg's 1.75 lakh chemist shops and 800 support centers represent a distribution moat that pricing alone cannot overcome — but superior clinic integration + Schedule H + WhatsApp campaigns can carve a niche in clinic-attached pharmacies.

---

## 6. Category 3 — Clinic & Healthcare

### Competitors: Practo Ray, Lybrate, DocPulse, Aarogya, eClinicalWorks India, Dento ERP, Dentobees, ERP Flow Studios, MedKit ERP

---

### 6.1 Full Feature Comparison

| Feature | Practo Ray | Lybrate | DocPulse | Aarogya | eClinicalWorks | Syllabrix |
|---|---|---|---|---|---|---|
| OPD Queue + Token System | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vitals (BP/Pulse/SpO2/Glucose) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| EMR / SOAP Notes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ICD-10 Diagnosis Codes | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Digital Prescriptions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rx QR Verification (public) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Schedule H Register | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Lab Orders | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ |
| LIMS (Lab Info Management) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Radiology Orders (XRAY/CT/MRI) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **IPD / Ward Management** | ❌ | ❌ | ⚠️ | ✅ | ✅ | ✅ |
| **OT / Surgery Scheduling** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Insurance Claims** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Nursing Charts (MAR)** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Clinic Billing + GST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pharmacy / Medicine Inventory | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Multi-Doctor Support | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ABDM / ABHA Integration** | ✅ | ❌ | ✅ | ✅ | ✅ | ⚠️ Skeleton |
| WhatsApp Reminders | ✅ | ⚠️ SMS | ❌ | ❌ | ❌ | ✅ **Best** |
| **Patient Discovery Marketplace** | ✅ (Practo.com) | ✅ (Lybrate.com) | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Multi-Language SMS | ❌ | ✅ (8 langs) | ❌ | ❌ | ❌ | ✅ (i18next) |
| **Dental Tooth Charting** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ **MISSING** |
| On-Premise Option | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Mobile App | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI-Powered Assistant | ✅ Ray Connect | ❌ | ❌ | ❌ | ❌ | ✅ Gemini |
| Pricing (₹/doctor/month) | 1,000–6,000 | ~900 | ~500 | Custom | Custom | Unknown |

---

### 6.2 Dental Clinics Specifically

| Feature | Dento ERP | Dentobees | Syllabrix |
|---|---|---|---|
| **Dental Tooth Charting (32-tooth map)** | ✅ | ✅ | ❌ **CRITICAL MISSING** |
| **Dental Condition Notation** | ✅ | ✅ | ❌ **CRITICAL MISSING** |
| OPD Queue + Appointments | ✅ | ✅ | ✅ |
| Patient Records + EMR | ✅ | ✅ | ✅ |
| X-Ray / Radiology Orders | ⚠️ | ⚠️ | ✅ |
| Billing + GST | ✅ | ✅ | ✅ |
| Multi-Clinic Support | ❌ | ✅ | ✅ (multi-branch) |
| WhatsApp | ❌ | ❌ | ✅ |
| Lab Orders | ❌ | ❌ | ✅ |
| Insurance | ❌ | ❌ | ✅ |

**Brutal truth:** Syllabrix has registered `SYL-BC-HLC-DN01` (Dental Clinic) as a supported business type. But without a tooth chart, **no dentist will use the product for clinical work.** The tooth charting component is non-negotiable for this vertical — it's the first thing any dentist asks to see in a demo.

---

### 6.3 Verdict

**Syllabrix is the most complete clinic/healthcare ERP in the SMB category** — surpassing Practo Ray on depth (IPD/OT/LIMS/Radiology), Aarogya on WhatsApp+AI, and every competitor on Schedule H + Rx QR verification.

**Three remaining blockers:**
1. ABDM live integration (regulatory risk, not just feature gap)
2. Dental tooth charting (blocks all 8 dental types)
3. No patient discovery (Practo's edge — but this is a marketing/product hybrid problem)

---

## 7. Category 4 — Salon & Beauty

### Competitors: MioSalon, Zenoti, Fresha, Operato Corp, Stor-OS, Booksy, Vagaro, Appointy

---

### 7.1 Full Feature Comparison

| Feature | MioSalon | Zenoti | Fresha | Operato | Stor-OS | Syllabrix |
|---|---|---|---|---|---|---|
| Appointment Calendar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Online Booking Widget / Link** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ **MISSING** |
| **Staff Commission Tracking** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ **MISSING** |
| Memberships / Packages | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Customer CRM + History | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (360° profile) |
| Loyalty Points | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| WhatsApp Reminders (native) | ✅ | ⚠️ Integration | ❌ | ❌ | ❌ | ✅ **Best** |
| WA Segment Campaigns | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Inventory (products sold/used) | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ |
| POS Billing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GST Billing | ✅ | ⚠️ | ❌ | ⚠️ | ✅ | ✅ |
| UPI Payments | ✅ | ❌ | ❌ | ❌ | ✅ | ⚠️ Via Razorpay |
| Payroll | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Multi-Branch / Outlet | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Staff Attendance | ⚠️ | ✅ | ❌ | ❌ | ❌ | ✅ (biometric) |
| AI Insights | ❌ | ⚠️ Analytics | ❌ | ❌ | ❌ | ✅ |
| Mobile App | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Customer Discovery Marketplace | ✅ (MioSalon listing) | ❌ | ✅ (Fresha marketplace) | ❌ | ❌ | ❌ |
| Pricing (₹/month/outlet) | 2,500 | 18,000–35,000 | Free+commission | Custom | Bundled | Unknown |

---

### 7.2 Verdict

**Syllabrix wins on:** WhatsApp campaigns targeting "inactive 30 days" or "VIP" clients — no salon software in this list has this. Payroll + biometric attendance. Loyalty points. Inventory tracking of products sold/used. Full multi-branch.

**Two deal-breaking gaps for salons:**
1. **Staff commissions** — Every Indian salon pays stylists a 20–40% commission per service. Without this, the owner cannot calculate salaries. The fix is one field on `Appointment` (commissionRate) + one report.
2. **Online booking link** — A WhatsApp bio link that opens a booking page. Every competitor has this. Without it, Syllabrix cannot even get to a demo with a salon owner in 2026.

---

## 8. Category 5 — Gym & Fitness

### Competitors: Akton, Mindbody, FitBudd, TeamUp, GymMaster, Wellyx

---

### 8.1 Full Feature Comparison

| Feature | Akton | Mindbody | FitBudd | TeamUp | Syllabrix |
|---|---|---|---|---|---|
| Member Management | ✅ | ✅ | ✅ | ✅ | ✅ |
| Membership Plans + Expiry | ✅ | ✅ | ✅ | ✅ | ✅ |
| Automated Renewal Reminders | ✅ | ✅ | ✅ | ✅ | ✅ |
| Attendance (QR + Biometric) | ✅ | ✅ | ❌ | ✅ | ✅ (ZKTeco) |
| **Facial Recognition** | ✅ | ❌ | ❌ | ❌ | ❌ **MISSING** |
| **Class Scheduling + Booking** | ❌ | ✅ | ✅ | ✅ | ❌ **MISSING** |
| **Member-Facing Mobile App** | ✅ OKFit branded | ✅ | ✅ branded | ✅ | ❌ **MISSING** |
| Workout Templates / Programs | ❌ | ❌ | ✅ | ❌ | ✅ **Best** |
| Body Stats Tracking | ❌ | ❌ | ✅ | ❌ | ✅ **Best** |
| Exercise Library | ❌ | ❌ | ✅ | ❌ | ✅ **Best** |
| Trainer-to-Member Notes | ❌ | ❌ | ✅ | ❌ | ✅ **Best** |
| Workout Session Logging | ❌ | ❌ | ✅ | ❌ | ✅ |
| Live Gym Crowd Capacity | ✅ | ❌ | ❌ | ❌ | ❌ **MISSING** |
| WhatsApp Native | ✅ | ❌ | ❌ | ❌ | ✅ |
| WA Segment Campaigns | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| GST + UPI | ✅ | ❌ | ❌ | ❌ | ✅ |
| Payroll | ❌ | ✅ | ❌ | ❌ | ✅ |
| Biometric Door Access | ✅ | ❌ | ❌ | ⚠️ | ✅ |
| AI Fitness Recommendations | ❌ | ❌ | ❌ | ❌ | ✅ Gemini |
| Mobile App | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pricing (₹/month) | **89** | 13,000–58,000 | ~1,250 | ~8,250 | Unknown |

---

### 8.2 Verdict

**Syllabrix wins on programming depth:** Workout templates, exercise library, body composition tracking, trainer notes — Akton (India's dominant gym software at ₹89/month) has **none of these.** For PT studios, CrossFit boxes, and premium gyms, Syllabrix's training module is genuinely superior.

**Syllabrix's structural problem in gyms:** Akton at ₹89/month is a pricing moat. Most Indian gym owners spend ₹89–500/month on software. To win, Syllabrix must either:
- Price similarly and deliver more value visually (member app changes everything here), or
- Target premium gyms (₹1,500/month+) that care about programming and member experience

**Missing that matters most:** Member-facing mobile app. A gym member who can see their workout program, log sessions, and track body stats on their phone — that gym will never switch software. Without the app, the training module is invisible to members.

---

## 9. Category 6 — Restaurant & Food

### Competitors: Petpooja, Posist/Restroworks, DotPe, UrbanPiper, LimeTray, Torqus

---

### 9.1 Full Feature Comparison

| Feature | Petpooja | Posist | DotPe | LimeTray | Syllabrix |
|---|---|---|---|---|---|
| **KOT (Kitchen Order Ticket)** | ✅ | ✅ | ❌ | ❌ | ❌ **CRITICAL MISSING** |
| **Table Management** | ✅ | ✅ | ❌ | ❌ | ❌ **CRITICAL MISSING** |
| **Aggregator Integration (Swiggy/Zomato)** | ✅ | ✅ | ❌ | ✅ | ❌ **CRITICAL MISSING** |
| **QR Menu + Digital Ordering** | ✅ | ✅ | ✅ | ✅ | ❌ **CRITICAL MISSING** |
| **Recipe Costing / Raw Material Inventory** | ✅ | ✅ | ❌ | ❌ | ❌ **MISSING** |
| POS Billing | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inventory (finished goods) | ✅ | ✅ | ❌ | ❌ | ✅ |
| GST Billing | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Customer CRM + Loyalty | ✅ | ✅ | ❌ | ✅ | ✅ |
| WhatsApp | ✅ bill+alerts | ⚠️ | ⚠️ | ❌ | ✅ |
| WA Campaigns | ❌ | ❌ | ❌ | ❌ | ✅ |
| Staff Payroll | ❌ | ❌ | ❌ | ❌ | ✅ |
| Multi-Location | ✅ | ✅ | ❌ | ✅ | ✅ |
| Offline Mode | ✅ | ✅ | ❌ | ❌ | ❌ |
| Mobile App | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pricing (₹/month) | ~1,200 | 3,000+ | Free/low | Custom | Unknown |

---

### 9.2 Verdict

**Syllabrix cannot serve restaurants today.** KOT, table management, and Swiggy/Zomato integration are the minimum three features to sell restaurant POS. Petpooja has 1 lakh+ outlets and ₹1,200/month pricing. This vertical should be the **last to build,** not the first to sell.

**What Syllabrix can do today for F&B:** Use the POS + inventory for a cloud kitchen (no tables, no aggregator needed, only billing). That is a viable niche until the full restaurant module is built.

---

## 10. Category 7 — Education & Coaching

### Competitors: Classplus, Teachmint, MyClassboard, Schoolpad, Extramarks

---

### 10.1 Full Feature Comparison

| Feature | Classplus | Teachmint | MyClassboard | Syllabrix |
|---|---|---|---|---|
| Fee Collection | ✅ | ✅ | ✅ | ✅ |
| Student Attendance | ✅ | ✅ | ✅ | ✅ |
| Homework / Assignments | ❌ | ✅ | ✅ | ✅ |
| Exam + Result Tracking | ❌ | ✅ | ✅ | ✅ |
| Teaching Logs | ❌ | ❌ | ❌ | ✅ **Unique** |
| Exam Prep Tracking (student-level) | ❌ | ❌ | ❌ | ✅ **Unique** |
| **Branded Student App (Play Store)** | ✅ **Signature** | ✅ | ✅ | ❌ **MISSING** |
| **Live Online Classes** | ✅ | ✅ | ❌ | ❌ **MISSING** |
| **Recorded Video / LMS** | ✅ | ✅ | ⚠️ | ❌ **MISSING** |
| **Parent Communication App** | ❌ | ✅ | ✅ | ❌ **MISSING** |
| Timetable Management | ❌ | ✅ | ✅ | ❌ **MISSING** |
| Online Fee Payment (UPI) | ✅ | ✅ | ✅ | ⚠️ Via Razorpay |
| WhatsApp | ⚠️ Integration | ⚠️ | ⚠️ | ✅ |
| WA Campaigns to Parents | ❌ | ❌ | ❌ | ✅ **Unique** |
| Staff Payroll | ❌ | ❌ | ✅ | ✅ |
| Staff Attendance (biometric) | ❌ | ❌ | ✅ | ✅ |
| AI Insights | ❌ | ⚠️ | ❌ | ✅ |
| Mobile App | ✅ | ✅ | ✅ | ❌ |
| Pricing (₹/month) | 1,700–4,200 | 3,000–8,000 | ~210/student | Unknown |

---

### 10.2 Verdict

**Syllabrix wins on:** Teaching logs (daily teacher notes per student), exam prep tracking with per-student readiness scoring, WhatsApp campaigns to parents (e.g., "fee due" segment), payroll + biometric attendance for teachers.

**Critical missing:** Classplus's core selling point is the **branded app on the Play Store under the institute's own name.** For a coaching institute, "Sharma Classes App" on Play Store is a prestige differentiator worth paying ₹4,200/month for. Without a student app, the fee module and attendance are useful but not enough to win against Classplus.

---

## 11. Category 8 — Multi-Industry ERP

### Competitors: Zoho One, Odoo, ERPNext, GrofleX, Gofrugal, Sellnaudit, Operato Corp

---

### 11.1 Full Feature Comparison

| Feature | Zoho One | Odoo | ERPNext | GrofleX | Gofrugal | Sellnaudit | Syllabrix |
|---|---|---|---|---|---|---|---|
| Industries Supported | All | All | All | All | 60+ | 30+ | **70 (adaptive)** |
| **Business-Adaptive UI** | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ **Unique** |
| Accounting (Full GL) | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ |
| **Manufacturing / BOM** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ **MISSING** |
| **Leave Management** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ **MISSING** |
| **Customer Self-Service Portal** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ **MISSING** |
| **e-Invoicing (IRN)** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ **MISSING** |
| Tally Import/Export | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| WhatsApp (native, all modules) | ⚠️ Via CRM | ⚠️ Via module | ⚠️ Via app | ❌ | ⚠️ | ❌ | ✅ **Best** |
| AI Insights | ✅ Zia | ⚠️ Limited | ❌ | ❌ | ❌ | ❌ | ✅ Gemini |
| Clinic / Healthcare | ❌ | ✅ | ✅ | ❌ | ⚠️ | ❌ | ✅ **Deepest** |
| Gym / Fitness (workout) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Education (homework/exams) | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ✅ |
| Open Source / Self-Hosted | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Setup Time | Weeks | Months | Months | Days | Days | Days | **Hours** |
| Target User | Tech-literate | Developer/IT | Developer/IT | SMB | SMB | SMB | **Non-tech SMB** |
| Platform Admin Layer | ⚠️ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ Nerve Center |
| Pricing (₹/month) | 1,500/employee | Custom | Custom | 49–99/module | 750+ | Custom | Unknown |

---

### 11.2 Verdict

**Syllabrix vs Zoho One:** Zoho One wins on breadth (45 apps) and accounting depth. Syllabrix wins on industry-specific adaptation, WhatsApp native depth, simplified onboarding, and clinic/gym/education modules. A kirana owner won't spend weeks integrating Zoho CRM + Zoho Books + Zoho People just to run their shop. Syllabrix must be operational in one day.

**Syllabrix vs Odoo/ERPNext:** Both require IT expertise or expensive consultants. They are fundamentally partner-deployed, not self-serve. Syllabrix is cloud SaaS — this is a genuine distribution advantage for SMBs who cannot afford implementation teams.

**Syllabrix's unique position in this category:** No multi-industry product has:
- Per-industry UI adaptation at registration
- WhatsApp campaigns with segment targeting across all verticals
- Clinic IPD + OT + LIMS in a single SMB ERP
- Gym workout programming and body stats
- A 7-wing platform admin layer (Nerve Center)

---

## 12. Syllabrix Strengths — Where We Win

### 12.1 Absolute Strengths (No competitor has these)

| Strength | Why It Matters |
|---|---|
| **Business Adaptation Engine (70 types)** | One product feels custom-built for 70 different industries. No competitor does this. The kirana owner sees a kirana dashboard; the gym owner sees a gym dashboard. |
| **WhatsApp-Native Across All 70 Types** | Not a bolt-on, not a third-party plugin. Campaigns, invoices, reminders, appointment notifications all built in. Segment-based campaigns (inactive 30 days, VIP, expiring 7 days) are unique across the entire Indian SaaS market. |
| **Clinic Depth at SMB Price** | OPD + EMR + SOAP + ICD-10 + Prescriptions + LIMS + Radiology + IPD + OT + Insurance in one SaaS. Only Aarogya and eClinicalWorks come close — both are hospital-grade with implementation costs. |
| **Gym Programming Module** | Workout templates, exercise library, body stats, trainer notes, workout session logs — Akton (India's gym software leader) has zero of this. |
| **Schedule H Register + Rx QR** | Unique compliance feature for pharmacies and clinics. No competitor in any category has built Rx QR verification. |
| **Teaching Logs + Exam Prep Tracking** | Unique in education category. No Classplus, Teachmint, or MyClassboard tracks daily teaching logs or per-student exam readiness scoring. |
| **B2B Marketplace with Price Negotiation** | Supplier discovery, buyer-supplier partnerships, multi-round price negotiation — no SMB ERP in India has built this. |
| **Syllabrix Nerve Center (7-wing admin)** | Purpose-built platform admin with activity monitoring, release management, compliance tracking, wing-level permissions. Enterprise-grade operations infrastructure for a SaaS product. |
| **AI Business Insights (Gemini)** | Contextual business recommendations on dashboard load. No Vyapar, Marg, Tally, or Petpooja competitor has this. |

---

### 12.2 Competitive Strengths (Syllabrix is better than most, but not alone)

| Strength | Details |
|---|---|
| Multi-Branch from Day 1 | Inventory transfers, per-branch GST, branch-level reporting built into schema |
| Payroll + Biometric Attendance | ZKTeco integration exists; most billing software treats payroll as an add-on |
| Udhar / Credit Balance | Proper credit balance + credit limit per customer, not just a note field |
| Asset Management (SLM + WDV) | Depreciation calculation with disposal tracking — rare in SMB ERP |
| Staff Specialization + Certifications | Useful for clinics, gyms, salons — staff profiles beyond just name/salary |
| Loyalty Points System | Tracks points, redemptions, customer lifetime value |
| 360° Customer Profile | Single view: invoices, POS history, subscriptions, appointments, credit balance, loyalty |
| Support Ticket System (tenant-facing) | Built-in support channel within the product |
| Multi-Language UI (EN/HI/TA/TE/MR) | i18next internationalization ready |

---

## 13. Syllabrix Gaps — Where We Lose

### 13.1 CRITICAL Gaps — Blocking Every Sales Demo Today

These are features whose absence causes immediate rejection.

| Gap | Impact | Who Has It |
|---|---|---|
| ❌ **e-Invoicing (IRN/QR)** | Every accountant in India rejects the product without this. Mandatory for businesses above ₹5 Cr turnover. | Vyapar, TallyPrime, Zoho Books, Busy, Swipe, Odoo, ERPNext |
| ❌ **e-Way Bill Generation** | All goods-trading businesses (retail, kirana, hardware, wholesale) need this for transport. | Vyapar, TallyPrime, Zoho Books, Busy, Marg, Gofrugal |
| ❌ **GSTR-1 Export (complete)** | Framework exists; JSON/Excel export for GSTR filing is missing. Required at every month-end. | All Indian accounting tools |
| ❌ **Offline Mode** | India's internet is unreliable, especially in Tier-2/3 cities. All major competitors work offline. | Vyapar, TallyPrime, Busy, Marg, Petpooja, myBillBook |
| ❌ **Dental Tooth Charting** | 8 dental types registered in Syllabrix. Not a single dentist can use the product without a tooth map. | Dento ERP, Dentobees |
| ❌ **KOT + Table Management** | Restaurant POS without kitchen tickets and table mapping is not a restaurant POS. 6 F&B types blocked. | Petpooja, Posist, every restaurant software |
| ❌ **Pharmacy Retail POS (OTC)** | `SYL-BC-RET-MS01` (Medical Store) is one of the most common business types. No OTC billing counter = unusable. | Marg Pharmacy, Gofrugal, Phairo |

---

### 13.2 HIGH Priority Gaps — Losing Deals in Demo

| Gap | Impact | Who Has It |
|---|---|---|
| ❌ **Staff Commission Tracking** | Salons, barbershops, spas pay per-service commissions. Without this, payroll calculation is impossible. | MioSalon, Zenoti, Operato, Fresha |
| ❌ **Online Booking Widget / Link** | Salons, clinics, gyms all expect a bookable link in 2026. Customer self-booking via WhatsApp/Instagram. | MioSalon, Fresha, Practo Ray, Mindbody |
| ❌ **Mobile App (Android + iOS)** | Every competitor the user compares against has a mobile app. Field staff, on-the-go billing, owner dashboard. | Vyapar, TallyPrime, Zoho Books, Petpooja, Practo Ray, Akton |
| ❌ **Leave Management** | Any business with 5+ staff needs leave application, approval, balance tracking. Payroll is incomplete without it. | Zoho One, Odoo, ERPNext, TallyPrime, Busy |
| ❌ **Razorpay Auto-Reconciliation** | Payment links are generated but webhook auto-match to invoice is missing. Every payment needs manual confirmation. | Native in all accounting tools |
| ❌ **ABDM / ABHA Integration (live)** | Government mandate for digital health. Clinics face regulatory pressure. Only skeleton exists. | Practo Ray, eClinicalWorks, Marg Pharmacy, Gofrugal |
| ❌ **Pagination on All List APIs** | A tenant with 10,000 customers or products will crash the app. Scalability blocker before any growth. | All mature products |

---

### 13.3 MEDIUM Priority Gaps — Quality and Completeness Issues

| Gap | Impact |
|---|---|
| ❌ **True GL / Double-Entry Accounting** | P&L and balance sheet are basic. No journal entries, no ledger posting, no trial balance. CA-managed businesses will reject. |
| ❌ **Student / Member App** | Gym programming and education modules have no delivery channel to the end-user without a member app. |
| ❌ **Tally Export** | Accountants who use Tally for GST filing need to import data from Syllabrix. ERPNext has this; Syllabrix doesn't. |
| ❌ **Class Scheduling (capacity-based)** | Yoga studios, CrossFit, swimming academies, music schools — all need class booking with seat limits. |
| ❌ **Recipe Costing / Raw Material BOM** | Cloud kitchens, restaurants, caterers need to cost a dish against raw material consumption. |
| ❌ **Product Expiry Alerts on Dashboard** | Schema has `expiryDate`. Low-stock and expiry alerts are not surfaced on the dashboard for retail/pharma. |
| ❌ **Customer Self-Service Portal** | Clients can't view their invoices, pay online, or download statements independently. Reduces support calls. |
| ❌ **Staff Self-Service (payslips/leave)** | Staff cannot view their attendance, payslips, or apply for leave online. |
| ❌ **Scheduled/Email Reports** | No daily P&L email, no weekly sales summary. Owners run the business on their phone. |
| ❌ **Barcode Label Printing** | Can scan barcodes; cannot generate and print barcode labels for products. |
| ❌ **Dark Mode** | Design tokens exist; not wired in React. Minor but frequently requested. |
| ❌ **SMS Fallback** | Only WhatsApp. Customers without WhatsApp (feature phones, elderly) get no reminders. |
| ❌ **PWA / Installable Web App** | Responsive but not installable. Competitors have dedicated apps. PWA is the fastest bridge. |

---

### 13.4 GAP SUMMARY SCORECARD

| Vertical | Ready to Sell Today? | Blockers | Score |
|---|---|---|---|
| **General Retail / Kirana** | ⚠️ Partially | No e-invoice, e-way bill, GSTR-1, offline | 5/10 |
| **Medical Store / Pharmacy** | ❌ No | No OTC POS, no drug licence, no offline | 3/10 |
| **General Clinic (GP/OPD)** | ✅ Yes (with caveats) | No ABDM live, no mobile app | 8/10 |
| **Dental Clinic** | ❌ No | No tooth charting — product is unusable for dentists | 2/10 |
| **Hospital** | ⚠️ Partially | No ABDM, no PACS, no patient consent forms | 6/10 |
| **Gym / Fitness** | ⚠️ Partially | No member app, no class booking, Akton pricing pressure | 6/10 |
| **Salon / Beauty** | ⚠️ Partially | No commissions, no online booking | 5/10 |
| **Restaurant / F&B** | ❌ No | No KOT, no tables, no aggregator — unusable | 1/10 |
| **Coaching / Education** | ⚠️ Partially | No student app, no live classes | 5/10 |
| **B2B / Wholesale / Dealer** | ⚠️ Partially | No e-way bill, no manufacturing BOM | 5/10 |
| **Professional Services** | ✅ Yes | Minor compliance gaps | 7/10 |
| **Events / Tent House / Decorator** | ✅ Yes | Quotation + billing works | 7/10 |

---

## 14. The Gap Priority Matrix

```
                    HIGH BUSINESS IMPACT
                           │
         e-Invoice/IRN  ───┤─── GSTR-1 Export
         Offline Mode   ───┤
         e-Way Bill     ───┤─── Dental Tooth Charting
                           │
HIGH  ─────────────────────┼──────────────────────────── LOW
BUILD                      │                             BUILD
EFFORT ────────────────────┼──────────────────────────── EFFORT
                           │
         KOT/Tables    ────┤─── Staff Commissions ◄── Quick wins
         Member App    ────┤─── Online Booking ◄────── Quick wins
         Leave Mgmt    ────┤─── Pharmacy POS ◄──────── Quick wins
                           │
                    LOW BUSINESS IMPACT
```

### Priority 1 — Build in Phase 1 (Weeks 1–6): Compliance + Quick Wins
These unblock the most business types with the least effort.

| # | Feature | Effort | Business Types Unlocked |
|---|---|---|---|
| 1 | GSTR-1 JSON/Excel Export | Medium | All 70 types |
| 2 | e-Invoicing (IRN generation via IRP) | High | All 70 types above ₹5Cr |
| 3 | e-Way Bill Generation | Medium | 20+ goods-trading types |
| 4 | Staff Commission Tracking | Low | 5 beauty/salon types |
| 5 | Online Booking Link (shareable URL) | Medium | 15+ appointment-based types |
| 6 | Razorpay Webhook Auto-Reconciliation | Low | All 70 types |
| 7 | Pagination on All List APIs | Low | All 70 types (scalability) |

### Priority 2 — Build in Phase 2 (Weeks 7–14): Vertical Completeness
| # | Feature | Effort | Business Types Unlocked |
|---|---|---|---|
| 8 | Dental Tooth Charting (SVG) | Medium | 8 dental types |
| 9 | Pharmacy Retail POS | Medium | All medical store types |
| 10 | KOT + Table Management | High | 6 F&B types |
| 11 | Leave Management Module | Medium | All 70 types |
| 12 | Progressive Web App (PWA) | Low | All 70 (mobile presence) |
| 13 | ABDM / ABHA Live Integration | High | 8 healthcare types |

### Priority 3 — Build in Phase 3 (Weeks 15–24): Growth Features
| # | Feature | Effort | Impact |
|---|---|---|---|
| 14 | Member / Student Mobile App | Very High | Gym, education, salon stickiness |
| 15 | Class Scheduling (capacity-based) | Medium | Yoga, CrossFit, swimming, music |
| 16 | Recipe Costing / BOM (basic) | Medium | Restaurant, caterer, cloud kitchen |
| 17 | Customer Self-Service Portal | High | All invoicing businesses |
| 18 | Swiggy / Zomato Aggregator Integration | High | 6 F&B types |
| 19 | Offline Mode (Service Worker + IndexedDB) | Very High | Tier-2/3 city adoption |
| 20 | True GL / Double-Entry Accounting | Very High | CA-managed businesses |

---

## 15. Roadmap to #1 — What to Build and When

### Phase 0 — Foundation (NOW, before any marketing)
> Fix the leaks. Stop losing prospects at "accountant veto."

1. Complete GSTR-1 export (JSON format for GSTN portal upload)
2. Add Razorpay webhook auto-reconciliation
3. Add pagination to all list APIs (customers, products, invoices, transactions)
4. Fix forgot-password frontend page (backend is complete, page is missing)
5. Wire product expiry and low-stock alerts to dashboard notifications

**Outcome:** Syllabrix passes the accountant test. No more "rejected because no GST export."

---

### Phase 1 — Compliance Layer (Month 1–2)
> Become India-compliant. This is the gate to every business type.

1. **e-Invoicing (IRN):** Integrate with Invoice Registration Portal (IRP) or a GSP (Govt. licensed provider). Generate IRN + signed QR per invoice. Auto-embed in PDF.
2. **e-Way Bill:** Integrate with NIC e-Way Bill API. Generate e-way bill from purchase/sales orders for goods above ₹50,000 inter-state.
3. **GSTR-3B Report:** Monthly summary report for direct filing or export.
4. **TDS Auto-Calculation:** Compute TDS on vendor bills. Currently a field; wire the calculation.

**Outcome:** Syllabrix is India-compliant. No accountant can reject it on compliance grounds.

---

### Phase 2 — Vertical Unlock (Month 2–4)
> Fix the 3 verticals where we have the most data but cannot close deals.

**Salon Vertical (5 types):**
- Staff commission tracking (commission % per service, monthly commission report)
- Online booking page (public URL: `/book/[tenantSlug]`, shows services, available slots)
- Online booking widget (embeddable `<iframe>` for Instagram/website)

**Dental Vertical (8 types):**
- Tooth charting component (32-tooth SVG, click to annotate conditions — caries, crown, RCT, missing, implant)
- Dental treatment plan linked to tooth chart
- Dental-specific billing codes

**Restaurant / F&B (6 types):**
- KOT (Kitchen Order Ticket) — print/display on kitchen screen when order placed
- Table management — floor plan, table status (vacant/occupied/billed)
- Raw material inventory (recipes, portion costing, consumption against sales)
- Aggregator integration (Phase 3 — UrbanPiper API)

**Outcome:** 19 additional business types become fully demo-able and closeable.

---

### Phase 3 — Mobile & Offline (Month 4–7)
> Enter Tier-2 and Tier-3 India. This is where 80% of the market lives.

1. **Progressive Web App (PWA):** Service worker + Web App Manifest + `manifest.json`. Add to home screen on Android. Estimated 2 weeks.
2. **Offline POS Mode:** IndexedDB cache for product catalog and customer list. Queue transactions for sync. Critical for areas with patchy connectivity.
3. **Mobile-first UI Audit:** Ensure every page is fully usable on a 5-inch Android screen. Fix overflow, touch targets, modal height issues.
4. **React Native / Capacitor App (Phase 3B):** Staff attendance punch, owner dashboard, WhatsApp message view on mobile.

**Outcome:** Syllabrix works in Jaipur, Indore, Nagpur, Surat — not just Bangalore and Mumbai.

---

### Phase 4 — Ecosystem & Retention (Month 7–12)
> Lock users in. Make switching painful. Add the features that create daily habits.

1. **Member / Student App (white-label PWA):** Gym member checks workout, education student sees homework — all under tenant's branding.
2. **Leave Management:** Types, applications, approval workflow, leave balance in payslip.
3. **Customer Self-Service Portal:** Invoice view, payment link, statement download — no login required, token-based access.
4. **Scheduled Reports:** Daily P&L email at 9 PM, weekly sales summary on Monday morning, monthly GST summary.
5. **Staff Self-Service:** Payslip PDF download, attendance log view, leave application — staff login via mobile app.
6. **Tally Export:** CSV/Excel export in Tally-importable format. Removes one objection from accountants.
7. **True GL / Double-Entry:** Journal entries, trial balance, full balance sheet. Targets CA-managed businesses.

---

### Phase 5 — Scale & Moat (Month 12–18)
> Defend position. Build what no one else will.

1. **ABDM / ABHA Live Integration:** Partner with NHA (National Health Authority) for accreditation.
2. **AI Prescription Assistant:** Gemini-powered drug interaction checker, dosage suggestions (with disclaimer).
3. **AI Inventory Reorder Forecasting:** Gemini predicts when stock runs out based on sales velocity.
4. **Video Consultations (for clinics):** WebRTC-based video link in appointment. Unique in SMB clinic software.
5. **WhatsApp Catalog Sync:** Sync product catalog to WhatsApp Business catalog. Customers order via WhatsApp.
6. **Swiggy / Zomato Integration:** UrbanPiper API to receive aggregator orders into Syllabrix POS.
7. **Franchise/Chain Management:** Parent-child tenant relationship. Group-level reporting for chains (salon chains, gym chains, clinic chains).

---

## 16. What Can Be Achieved

### If Phase 0 + Phase 1 complete (by Month 2):
- **Every business can pass the accountant test.** No more GSTR rejection.
- Kirana, retail, wholesale, professional services become fully closeable.
- **Estimated addressable TAM: ₹200 Cr/year** (retail + professional segment alone).

### If Phase 2 complete (by Month 4):
- **Dental becomes a power vertical.** 8 types, ~5 lakh dental clinics in India, no truly modern SaaS ERP for dentists. Syllabrix can own this.
- **Salons become closeable.** 7 million salons in India. MioSalon at ₹2,500/month is the only serious competition. WhatsApp campaigns tip the balance.
- **Cloud kitchens become fully operational.** No need for Petpooja for small cloud kitchens.
- **Estimated addressable TAM: ₹800 Cr/year.**

### If Phase 3 complete (by Month 7):
- **Tier-2/3 India opens up.** 600 million people in Tier-2/3 cities. Most Indian SaaS companies don't serve them properly. Offline mode + mobile = massive distribution advantage.
- **Syllabrix becomes viable on feature phones (Android Go).** PWA loads on ₹5,000 phones.
- **Estimated addressable TAM: ₹3,000 Cr/year.**

### If Phase 4 + 5 complete (by Month 18):
- **Syllabrix becomes the only product where a chain operator (5 gyms, 3 clinics, 2 salons) can run all branches on one dashboard** with WhatsApp campaigns, AI insights, payroll, compliance, and member apps.
- **Category leader position:** India's first adaptive multi-industry ERP that works for ₹500/month and replaces Vyapar + Petpooja + Akton + Practo Ray for a multi-business operator.
- **Potential ARR: ₹50–200 Cr** (10,000–50,000 paid tenants at ₹500–2,000/month average).

---

### The Single Most Achievable Competitive Advantage

If Syllabrix delivers this combination, **no single competitor can match it:**

> **"One ERP that adapts to your industry, works on WhatsApp, files your GST, tracks your staff, and runs offline — for ₹999/month."**

- Vyapar covers GST + billing but has no industry adaptation, no clinic, no gym
- Practo Ray covers clinic but has no inventory, no payroll, no other industries
- Akton covers gym at ₹89 but has no workout programming, no payroll, no GST
- MioSalon covers salon but has no pharmacy, no inventory depth, no payroll
- Zoho One covers everything but costs ₹1,500/employee and requires IT setup

**Syllabrix is the only product positioned to serve all of them from one platform.**

---

## 17. Pricing Benchmark

| Product | Category | Price (₹/month) | Notes |
|---|---|---|---|
| OkCredit | Ledger | Free | No GST |
| Khatabook | Ledger | Free | No GST |
| Swipe | Billing | Free–low | GST basic, no payroll |
| myBillBook | Billing | 33–300 | Full GST, payroll basic |
| **Akton** | **Gym** | **89** | **India-native, WA reminders** |
| Vyapar | Billing+POS | 293 | Full GST, offline, WA |
| Refrens | Invoicing | ~900 | Service businesses |
| Zoho Books Free | Accounting | Free | <₹25L revenue |
| Giddh | Accounting | ~400 | Unlimited users |
| Busy Basic | Accounting | ~917 | Full GST, offline |
| Lybrate Clinic | Clinic | ~900 | Per clinic |
| Zoho Books Standard | Accounting | 899 | Full features start here |
| Marg Pharmacy | Pharmacy | ~1,050 | AMC model |
| Gofrugal Retail | Retail ERP | ~750 | 60+ business types |
| DocPulse | Clinic | ~500 | Per doctor |
| MioSalon | Salon | 2,500 | Per outlet |
| Petpooja | Restaurant | ~1,200 | Per outlet |
| Practo Ray | Clinic | 1,000–6,000 | Per doctor |
| FitBudd | Gym | ~1,250 | USD pricing |
| Classplus | Education | 1,700–4,200 | Branded app |
| Teachmint | Education | 3,000–8,000 | Live classes |
| Posist | Restaurant | 3,000+ | Per location |
| Zoho One | ERP Suite | 1,500/employee | 45+ apps |
| **Syllabrix (target)** | **Multi-industry ERP** | **₹499–1,999** | **All modules, adaptive, WA-native** |
| Zenoti | Salon (enterprise) | 18,000–35,000 | Chains only |
| Mindbody | Gym (global) | 13,000–58,000 | USD pricing |

### Syllabrix Recommended Pricing Strategy

| Plan | Price | Target | Includes |
|---|---|---|---|
| **Starter** | ₹499/month | Solo operators, 1 branch, <5 staff | Core modules, 500 WA messages/month |
| **Growth** | ₹999/month | Small businesses, 2 branches, <20 staff | All modules, 2,000 WA messages/month, AI insights |
| **Scale** | ₹1,999/month | Multi-branch, teams, franchises | Unlimited branches, unlimited WA, advanced analytics, priority support |
| **Enterprise** | Custom | Chains, hospitals, campuses | Dedicated support, custom integrations, SLA |

---

*This document was compiled from deep codebase analysis of Syllabrix and web research across 46 competitor products. Last updated: June 2026.*
