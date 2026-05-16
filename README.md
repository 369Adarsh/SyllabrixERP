# Syllabrix — Design System

> One smart ERP platform for every small business.

Syllabrix is an AI-powered, modular ERP SaaS for micro and small businesses — kirana stores, retail shops, coaching institutes, salons, clinics, restaurants, gyms, shopping complexes, freelancers, workshops. Instead of forcing a one-size-fits-all interface, Syllabrix runs a **Business Adaptation Engine** at onboarding that activates only the modules a business needs (POS, inventory, fees, appointments, lease management, etc.) and lays out the dashboard around the way that owner actually works.

A signature feature: **AI-generated promotional videos** built from live business data — admissions-open reels for coaching institutes, festival-offer posts for retail, "doctor available" clips for clinics — published to Instagram, WhatsApp, and Facebook in a few taps.

The brand has to do two jobs at once:
1. **Reassure** a non-technical owner who's used to handwritten ledgers and Excel.
2. **Impress** a manager or accountant who wants real ERP power underneath.

So the design language is **warm, modular, confident, calm**. Friendly enough for a kirana store. Serious enough to run accounts.

---

## Brand origin

The name **Syllabrix** is a portmanteau — *syllabus* (the curriculum, the system, what's taught) plus *brix* (bricks, the building blocks). The full identity is **Syllabrix Network** — it isn't just one ERP, it's a connected platform of modules and small-business owners. That **network of modular bricks** idea is the visual North Star.

The logo carries the story: a confident navy wordmark anchors the system, while the final **X** is rendered as an electric-cyan, sparkle-flecked mark — the moment of energy where the bricks click together and data starts flowing. Everything visual ladders to those two halves: **calm navy + electric cyan**, modular form + a moment of spark.

---

## Sources & inputs

- **Logo & wordmark provided** by the founder — `uploads/syllabrix-logo-full.png`, copied to `assets/logo-syllabrix-network.png`. The wordmark sets the palette (deep navy + electric cyan).
- **No codebase or Figma file** was attached. Tokens, components, and UI kits were authored against the product brief in `chat`, then re-derived from the supplied logo.
- The product brief described the ERP scope, target users, modules, and AI video promotion feature in detail.
- Indian market context (GST, kirana, multi-language, WhatsApp-first marketing) shaped tone and feature decisions.

---

## Folder index

| Path | What's inside |
|---|---|
| `README.md` | This file — brand context, content fundamentals, visual foundations, iconography. |
| `SKILL.md` | Skill definition for Claude Code / Agent Skills. |
| `colors_and_type.css` | All design tokens — colors, type scale, spacing, radius, shadow, motion. **Import this first.** |
| `fonts/` | Font loading instructions (Google Fonts CDN). |
| `assets/` | Logos (wordmark, mark, monogram), icons, illustrations, brand graphics. |
| `preview/` | Design System tab cards — color swatches, type specimens, spacing, components. |
| `ui_kits/web-app/` | Admin/owner web dashboard recreation — sidebar, KPIs, modules, POS, reports. |
| `ui_kits/mobile-app/` | Mobile owner app — home, POS quick-bill, marketing, AI video studio. |
| `ui_kits/marketing-site/` | Public marketing site — hero, modules, pricing, AI video promo callout. |

---

## Content fundamentals

### Voice
**Calm, confident, plain-spoken.** Like a senior shopkeeper's accountant son who has been to business school — knows the books cold, but talks to you in your language. Never patronising, never jargon-heavy.

- **You, not we.** The product talks *to* the owner. "Your sales today," not "our platform shows sales today." Avoid "users" and "customers" inside the product — say "owners," "staff," "students," "patients" depending on the business type.
- **Active voice.** "Add a product" beats "A product can be added."
- **Numbers first.** Owners care about money and counts. Lead with the figure: "**₹1,24,560** today" not "Today you made ₹1,24,560."
- **Indian English-friendly but globally correct.** Lakhs and crores allowed in Indian-locale builds; default to standard formatting otherwise. Never Americanize a UK or Indian phrase.
- **Multi-language ready.** All copy keys must accept Hindi, Tamil, Bengali, Marathi, Gujarati translations. Sentences stay short so they translate cleanly.

### Casing
- **Sentence case everywhere** — buttons, headings, menu items, table columns. ("New invoice", not "New Invoice".)
- **Brand & module names in Title Case** ("Syllabrix", "Adaptation Engine", "Marketing Studio").
- **All-caps reserved for tiny labels** — eyebrow tags above section headers, status pills like `LIVE` or `DRAFT`. Tracking +0.06em.

### Tone by surface
- **Marketing site:** Optimistic, ambitious. "Run any business. Beautifully." Specific verbs.
- **Onboarding:** Warm, encouraging, asking-not-telling. "What kind of business is this?" Never "Configure your tenant."
- **Empty states:** Helpful + a clear next step. "No invoices yet. **Create your first one** — it takes 30 seconds."
- **Errors:** Plain, blameless, with the fix. "Couldn't reach the GST server. Try again, or skip for now and we'll sync later."
- **AI assistant voice:** Concise, evidence-based, never sycophantic. "Sales dropped 12% this week, mostly from Branch 2. Want me to break it down?"

### Examples — the Syllabrix way
| Don't | Do |
|---|---|
| "Welcome to your dashboard, valued customer!" | "Good morning, Riya. Here's your shop today." |
| "An error occurred. Please contact support." | "Something didn't save. Retry — or [tell us what happened]." |
| "Configure your business profile" | "Tell us about your business" |
| "Access denied" | "You don't have access to payroll. Ask your owner to enable it." |
| "🚀 Boost your sales!" | "Sales are up 18% this week. Here's why." |

### Emoji
**Used sparingly, never as iconography.** Emoji can show up in *user-generated* contexts — a WhatsApp message preview, a chat-style notification, an AI-suggested caption. Never in product chrome, navigation, or system messages. The brand has its own icon set; emoji would dilute it.

### Numbers, dates, currency
- ₹ symbol always before the figure, no space: `₹1,24,560`.
- Indian grouping by default (`12,34,567`). Toggleable to international (`1,234,567`).
- Dates: `12 May 2026` in long form, `12/05/26` in dense tables, `Today · 4:32 PM` in feeds.
- Time: 12-hour with AM/PM by default, 24-hour as a setting.

---

## Visual foundations

### Core motif — the brick
Every product visual ties back to one shape: a **rounded rectangle ~12px radius** representing a "brick" — a module, a card, a building block. The logo mark is two interlocked bricks. Module tiles, KPI cards, the onboarding step indicator, and the AI video templates all use the same brick silhouette at different scales. The motif should feel **assembled, not drawn** — things click together.

### Color
A **two-temperature** palette pulled directly from the wordmark — calm warm cream + cool deep navy + a flash of electric cyan.

- **Brand primary — Syllabrix Navy `#192F3D`.** Exact colour from the wordmark. Primary buttons, sidebars, body text, and the logo.
- **Signal — Brix Cyan `#1FB8D6`** with **Electric `#27DCFF`** reserved for the X mark, sparkles, and AI gradients. The marker for AI / network moments.
- **Success — Emerald `#0E9F6E`.** Money green. Positive deltas, paid invoices, "in stock."
- **Warning — Amber `#D97706`** and **Danger — Vermilion `#DC2626`** keep the system semantics readable next to a cyan accent.
- **Surface — Cream `#FAF6EF`** as the default app background in light mode (warm off-white, never pure `#FFFFFF`). Cream sets the navy off; the cyan stays the cool moment.
- **Ink — `#0A1825`** as the foreground extreme, cool-dark to match the navy.
- **Dark mode** swaps the canvas to Midnight `#061018` with cards on `#0C1F2C`; the cyan does the lifting that navy did in light.

Never apply navy as a full gradient across whole surfaces — it reads heavy. Gradients only appear in **three narrow places**: the X mark itself (cyan → deep cyan), hero illustrations (a soft cyan radial behind the mark), and the AI assistant chip (a 1.5px navy→cyan border, ≤10% of any screen).

### Typography
- **Display — Bricolage Grotesque.** Variable, slightly geometric, with optical-size axis. Carries the modular feel of the brick motif. Used for H1/H2 marketing, dashboard page titles, large numbers in KPI cards.
- **Body — Plus Jakarta Sans.** Friendly geometric sans with great Latin + Devanagari coverage. All UI text, body copy, forms, tables.
- **Mono — JetBrains Mono.** Code, IDs, SKUs, invoice numbers, anything tabular-numeric where alignment matters.

Type scale is a 1.2 modular ratio (minor third) anchored at 16px body. Never below 12px in product, never below 24px in slides. Tracking opens up at small sizes (+0.01em) and tightens for display (-0.02em). Line-height is 1.5 for body, 1.15 for display, 1.3 for mid sizes.

### Spacing & rhythm
4px base unit. Spacing scale: `4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96, 128`. Almost everything in the product sits on multiples of 4 or 8. Page gutters: 24px mobile, 32px tablet, 48px desktop, 96px+ on marketing.

### Corners & elevation
- **Radii**: `4` (chips, pills inside cards), `8` (inputs, small buttons), `12` (cards — the brick), `16` (modals, large cards), `24` (hero blocks), `999` (full pills).
- **Shadows** are soft and warm — based on `oklch(20% 0.05 280 / alpha)` with a **double-layer technique**: a tight 1px shadow + a wider blurred shadow. No black drop shadows. Three elevation levels: `sm` (resting cards), `md` (popovers, dropdowns), `lg` (modals, AI assistant panel). Dark mode shadows shift to higher alpha + slight indigo tint.
- **Borders** are mostly absent. When used, they're a hairline in `--border-subtle` (`#E8E2D6` light / `#23275A` dark) — 1px. Cards rely on shadow + surface color contrast, not borders.

### Imagery & illustration
- **Photography vibe**: warm, slightly golden, not over-saturated. Real Indian small-business contexts where possible — kirana shelves, salon mirrors, classroom whiteboards. Avoid stock-blue corporate office photos.
- **Illustration**: simple, geometric, brick-built. Two-tone (indigo + saffron) on cream. Storefronts, faces, products built from rounded rectangles and circles. Never gradient-meshed or 3D-rendered.
- **Empty-state illustrations** are a single object on cream — a brick, a parcel, a notebook — drawn in 2px stroke indigo with one saffron fill detail.

### Motion
Calm, confident, no bouncing. Easings:
- **Standard:** `cubic-bezier(0.2, 0, 0, 1)` over 200ms — most UI transitions.
- **Entrance:** `cubic-bezier(0.16, 1, 0.3, 1)` over 360ms — modals, sheets, page enters.
- **Exit:** linear-ish `cubic-bezier(0.4, 0, 1, 1)` over 160ms — quicker out than in.

Hover lifts a card by 2px and deepens shadow `sm → md`. Press states **shrink to 98%** with a 80ms transition. Never opacity-only — that reads as "disabled" not "pressed." Skeleton loaders use a 1.4s shimmer in `--surface-2`. The AI assistant has a single signature motion: a slow saffron border-gradient sweep (4s loop) only when it's actively thinking.

### Layout
- **Cards over panels.** The dashboard is a grid of bricks, not a wall of dividers.
- **Sticky chrome** — the top bar and sidebar stay; everything else scrolls in a content scroller. No global page scroll on app surfaces.
- **One primary action per screen.** Buttons earn primary status; everything else is secondary or ghost.
- **Mobile-first density.** Tables collapse to cards. Min hit target 44px. POS controls min 56px.

### Transparency & blur
Used in **three** places only — the global top bar (backdrop-blur 12px over scrolled content), the AI assistant overlay, and the bottom sheet on mobile. Cards never use transparency. Never glassmorphism on cards or modals — it reads cheap.

---

## Iconography

Syllabrix uses **[Lucide](https://lucide.dev)** as its icon system. Lucide ships clean 1.5px-stroke geometric icons that pair naturally with Bricolage Grotesque and Plus Jakarta Sans, and the open license + huge coverage matter for an ERP that needs icons for everything from "barcode" to "stethoscope" to "rent receipt."

**Loaded via CDN** in UI kits (`https://unpkg.com/lucide@latest`) — see `ui_kits/*/index.html` for the loader pattern.

Rules:
- Stroke 1.5px, currentColor, 20px in dense UI, 24px in standard UI, 16px inline with body text, 32px+ in module-tile heroes.
- Icons inherit text color. They get a brand color only when paired with a colored chip background (e.g. saffron icon on saffron-tinted chip).
- Pair icons with labels in nav and module tiles — icon-only only for utility (search, close, more). Min 44×44 hit area regardless of icon size.
- **Do not** mix icon styles. No emoji as icons. No filled-style icons next to outline ones.
- Custom icons (logo mark, monogram) live in `assets/` as SVG. Module-specific marks (e.g. an Indian rupee variant, a kirana storefront illustration) are also in `assets/`.

**Brand assets in `assets/`:**
- `logo-syllabrix-network.png` — the founder-supplied wordmark with the sparkle-X. **Use this in marketing, hero, and any large-format placement** — the SVG variants are simplified for product chrome.
- `logo-wordmark.svg` — simplified wordmark for inline product use, scales cleanly.
- `logo-wordmark-cream.svg` — same on dark surfaces.
- `logo-mark.svg` — standalone X mark in navy + cyan gradient, for sidebar / favicon / app icon.
- `logo-mark-mono.svg` — single-color X mark, currentColor fill — for inverse / mono contexts.
- `illustration-onboarding.svg` — brick-built storefront for empty states.
- `illustration-ai-video.svg` — AI Studio hero illustration.

Emoji and unicode characters are **not** used as icons in product chrome. They may appear in user content (chat-style notifications previewing a customer message, AI-generated WhatsApp captions). The currency symbols `₹ $ €` and the rupee character `₹` are used inline as text, not as icon glyphs.

---

## Quick start for designers

```html
<!-- Import the tokens first -->
<link rel="stylesheet" href="colors_and_type.css">

<!-- Lucide for icons -->
<script src="https://unpkg.com/lucide@latest"></script>
<script>lucide.createIcons();</script>
```

Then reach for components in `ui_kits/web-app/` or `ui_kits/mobile-app/`.

---

## Open questions / iteration asks

1. **Vector master of the logo.** The founder-supplied PNG is canonical for hero/marketing; I've drawn simplified SVG variants for product chrome. If a vector master of the sparkle-X exists, drop it in and I'll replace the SVG.
2. **Surface temperature.** Light mode uses warm cream against the cool navy/cyan brand. If you'd rather lean fully tech (cool off-white), say the word and I'll re-derive.
3. **Typography licensing.** Bricolage Grotesque + Plus Jakarta Sans are free Google Fonts and pair naturally with the wordmark. If you've licensed something else (PP Neue Montreal, GT Walsheim), tell me and I'll swap.
4. **Tone in regional languages.** The English voice is set. Voice in Hindi/Tamil/Marathi needs native-speaker review.
5. **Photography library.** None curated yet — pull a real shoot of Indian small-business contexts before launch.

---

## Modules Built — Complete Registry

> Last updated: 2026-05-16 · 18 backend modules · 20 frontend pages · 10 business types supported

---

### Backend Modules (`backend/src/modules/`)

| # | Module | Route prefix | What it does |
|---|---|---|---|
| 1 | **Auth** | `/api/v1/auth` | Register, Login, Staff login, Refresh token, Logout, Forgot/reset password |
| 2 | **Tenant** | `/api/v1/tenant` | Business profile, Module toggle, Business Adaptation Engine (`BUSINESS_MODULES` map) |
| 3 | **Users** | `/api/v1/users` | Team member CRUD, Role management (OWNER/ADMIN/ACCOUNTANT/STAFF), Change password |
| 4 | **Inventory** | `/api/v1/inventory` | Product categories, Products (barcode, SKU, expiry date, batch number), Stock adjustments, Tax rates (GST), Low-stock API |
| 5 | **POS** | `/api/v1/pos` | Create sale, Stock auto-deduction, Transaction history, Receipt data |
| 6 | **Invoicing** | `/api/v1/invoices` | Create invoice, Status lifecycle (DRAFT→SENT→PAID/OVERDUE), Payment recording, GST detail storage, Cancel |
| 7 | **Appointments** | `/api/v1/appointments` | Service catalog, Appointment CRUD, Status workflow (SCHEDULED→CONFIRMED→IN_PROGRESS→COMPLETED/CANCELLED/NO_SHOW) |
| 8 | **Fees** | `/api/v1/fees` | Student records, Fee records, Collect fee, Waive fee, Overdue query |
| 9 | **Lease** | `/api/v1/lease` | Property units, Lease tenants, Terminate lease, Rent-due API |
| 10 | **Reports** | `/api/v1/reports` | Business-type-adapted dashboard, Sales report, Invoice report, Top products, Top customers |
| 11 | **AI** | `/api/v1/ai` | Gemini 1.5 Flash chat, Auto-generated business insights on dashboard |
| 12 | **Customers** | `/api/v1/customers` | Customer CRUD, Total-spent tracking, Credit balance (Udhar), GSTIN storage |
| 13 | **Vendors** | `/api/v1/vendors` | Vendor CRUD, Purchase orders, Receive goods (auto stock-in) |
| 14 | **Expenses** | `/api/v1/expenses` | Expense CRUD, 10-category breakdown (Rent/Salaries/Marketing/…), Category summary |
| 15 | **WhatsApp** | `/api/v1/whatsapp` | Send text/invoice/appointment-reminder/fee-reminder/rent-reminder, Bulk overdue-fee reminders, Inbound message webhook, Conversation threads |
| 16 | **Assets** | `/api/v1/assets` | Asset categories (WDV rates), Asset CRUD, SLM & WDV depreciation (Indian IT Act), Maintenance logs, Disposal recording, Summary |
| 17 | **Staff** | `/api/v1/staff` | Staff CRUD (name/role/department/salary/joinDate), Toggle active, Biometric ID enrollment field |
| 18 | **Attendance** | `/api/v1/attendance` | Today's roster, Manual Punch IN/OUT, Date-range report, Hours-worked summary, **Device-push endpoint for ZKTeco / FingerJet biometric hardware** |

---

### Frontend Pages (`frontend/src/pages/`)

| # | Page | Route | What it does |
|---|---|---|---|
| 1 | **Login** | `/login` | JWT login, business-owner email auth |
| 2 | **Register** | `/register` | New tenant onboarding, business type selection → module assignment |
| 3 | **Dashboard** | `/dashboard` | **Adapts KPIs + quick actions to business type** (10 different layouts) |
| 4 | **Inventory** | `/inventory` | Products with barcode/SKU/expiry/batch, category tree, stock movements, tax rates, low-stock filter |
| 5 | **Point of Sale** | `/pos` | Product grid, cart, **camera barcode scanner** (html5-qrcode), **USB barcode auto-detect** (Enter-to-add), cash/UPI/card payment, change calculator |
| 6 | **Invoices** | `/invoices` | Create/manage invoices, status pills, payment recording, **A4 PDF/print modal**, **WhatsApp send button** per invoice |
| 7 | **Customers** | `/customers` | CRUD, credit balance (Udhar), total spent, GST number |
| 8 | **Appointments** | `/appointments` | Calendar-style list, service management, status workflow, **WhatsApp reminder** button |
| 9 | **Fees** | `/fees` | Student records, fee collection, waiver, overdue tracking, **WhatsApp fee reminder** |
| 10 | **Lease** | `/lease` | Property units, lease tenants, rent-due panel, terminate, **WhatsApp rent reminder** |
| 11 | **Vendors & Purchases** | `/vendors` | Vendor list, purchase order creation, receive goods |
| 12 | **Expenses** | `/expenses` | Expense log, category breakdown with progress bars, date/category/method filters |
| 13 | **Assets** | `/assets` | Asset list, depreciation progress bar per row, detail panel with schedule table, maintenance history, disposal modal, default Indian IT Act categories |
| 14 | **Staff & Attendance** | `/staff` | Staff CRUD (biometric ID), today's punch IN/OUT roster, hours worked, date-range report, **biometric device webhook panel** |
| 15 | **Reports** | `/reports` | Sales chart (daily/monthly), invoice breakdown, top products, top customers |
| 16 | **WhatsApp** | `/whatsapp` | Two-panel inbox, conversation threads, unread badges, send field (Enter to send, Shift+Enter newline) |
| 17 | **AI Copilot** | `/ai` | Gemini-powered business chat, full conversation history, business-context aware |
| 18 | **Settings** | `/settings` | Business profile, team management, role change, change password |
| 19 | **InvoiceView** *(modal)* | — | A4 invoice preview with business header, GST table, payment history; Print/PDF + WhatsApp send |
| 20 | **POS Receipt** *(modal)* | — | Thermal 80mm receipt, Print, WhatsApp send (named customer direct; walk-in shows phone input) |

---

### Add-on Features (cross-cutting)

| Feature | Where | Details |
|---|---|---|
| **Multilingual UI** | Sidebar switcher | English, हिंदी (Hindi), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi) — auto-detects browser language, persists to localStorage |
| **Barcode Scanner** | POS, Inventory | Camera mode via `html5-qrcode`; USB scanner via keyboard-input auto-detect (type + Enter) |
| **Biometric Attendance** | Staff page + backend | ZKTeco/FingerJet push to `POST /api/v1/attendance/device-punch`; manual punch fallback |
| **Business Adaptation Engine** | Dashboard + Sidebar | KPIs, quick actions, and visible nav change per business type at login |
| **WhatsApp Commerce** | Invoices, POS, Appointments, Fees, Lease | Send formatted messages directly from every relevant page; inbound inbox |
| **Invoice PDF / Print** | Invoices | Browser print-to-PDF — no external library, clean A4 layout |
| **Thermal Receipt** | POS | 80mm CSS format, print-ready |
| **AI Insights** | Dashboard | 3 actionable insights generated by Gemini on every dashboard load |
| **Row-Level Security** | Supabase | Deny-all RLS for anon/authenticated roles on all 22 tables; backend superuser bypasses |
| **Role-Based Access** | Entire app | OWNER / ADMIN / ACCOUNTANT / STAFF — both API middleware and UI guards |
| **Seed Accounts** | `backend/prisma/seed.js` | 10 test businesses covering all types, all `Test@1234` |

---

### Database Models (Prisma · Supabase PostgreSQL)

| # | Model | Table | Purpose |
|---|---|---|---|
| 1 | Tenant | `tenants` | Business account, modules JSON, plan, locale |
| 2 | User | `users` | Login credentials, role, language preference |
| 3 | Customer | `customers` | Customers with Udhar credit balance |
| 4 | Staff | `staff` | Employees with biometric ID + department |
| 5 | AttendanceLog | `attendance_logs` | Punch IN/OUT, method (MANUAL/BIOMETRIC/RFID), device ID |
| 6 | Category | `categories` | Inventory product categories (tree structure) |
| 7 | Product | `products` | Items with barcode, SKU, expiry date, batch number |
| 8 | TaxRate | `tax_rates` | GST slabs (CGST/SGST/IGST) |
| 9 | StockMovement | `stock_movements` | Audit trail: PURCHASE/SALE/ADJUSTMENT/RETURN/DAMAGE |
| 10 | Transaction | `transactions` | POS sales |
| 11 | TransactionItem | `transaction_items` | Line items per POS sale |
| 12 | Invoice | `invoices` | B2B invoices with GST details |
| 13 | InvoiceItem | `invoice_items` | Line items per invoice |
| 14 | Payment | `payments` | Partial/full payments against invoices |
| 15 | Service | `services` | Appointment service catalog |
| 16 | Appointment | `appointments` | Bookings with status workflow |
| 17 | Student | `students` | Students/members for coaching & gym |
| 18 | FeeRecord | `fee_records` | Fee ledger with collect/waive |
| 19 | LeaseUnit | `lease_units` | Property units |
| 20 | LeaseTenant | `lease_tenants` | Lease agreements |
| 21 | Vendor | `vendors` | Suppliers |
| 22 | PurchaseOrder | `purchase_orders` | POs with line items and receive workflow |
| 23 | PurchaseItem | `purchase_items` | Line items per PO |
| 24 | Expense | `expenses` | Business expenses by category |
| 25 | WhatsAppMessage | `whatsapp_messages` | Inbound/outbound WhatsApp log |
| 26 | AssetCategory | `asset_categories` | Asset types with WDV depreciation rate |
| 27 | Asset | `assets` | Fixed assets with SLM/WDV depreciation |
| 28 | AssetMaintenance | `asset_maintenance` | Maintenance/repair logs per asset |

---

### Pending — What to build next

| Priority | Feature | Status |
|---|---|---|
| 🔴 High | Forgot password frontend page | Backend ready, frontend page missing |
| 🔴 High | Customer Udhar/credit UI | Schema ready (`creditBalance`, `creditLimit`), no UI yet |
| 🔴 High | Razorpay UPI payment link per invoice | Not started — highest Indian market impact |
| 🟡 Medium | Product expiry alerts | Schema ready (`expiryDate`), no dashboard alert |
| 🟡 Medium | Nightly WhatsApp business digest | Not started — daily P&L to owner's WhatsApp at 10 PM |
| 🟡 Medium | GSTR-1 / GST compliance export | Not started |
| 🟡 Medium | Pagination on all list APIs | All APIs return all records |
| 🟡 Medium | Returns/Refunds formal flow | `RETURN` stock type exists, no UI |
| 🟡 Medium | Staff payroll report | Salary field exists, no payroll calculation |
| 🟢 Low | AI promotional video generation | Signature README feature — complex, not started |
| 🟢 Low | WhatsApp Catalog sync | Not started |
| 🟢 Low | Multi-branch / multi-location | Not started |
| 🟢 Low | Dark mode | Design tokens defined, not wired |
| ⚙️ Infra | Deploy to Railway + Vercel | Not done — WhatsApp webhook needs public URL |
