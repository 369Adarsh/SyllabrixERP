# Trial Landing Page — Idea Notes
**Date:** 2026-06-10  
**Environment:** trial.syllabrix.com (Quality)

---

## Vision
`trial.syllabrix.com` is not just a trial signup page.  
It is a **sales funnel + investor pitch + product showcase** — all in one.

Every visit should end with one of:
- Business signing up for trial (`/register`)
- Trial user converting to production (`syllabrix.com/get-started`)
- Investor/partner making contact

---

## Two Landing Pages — Clear Separation

| URL | Page | Purpose |
|---|---|---|
| `syllabrix.com` | Production landing | Main Syllabrix brand page |
| `trial.syllabrix.com` | Trial landing | Trial funnel + investor showcase |

---

## Production Landing Page CTAs (syllabrix.com)
1. "Start Free Trial — 14 Days" → `trial.syllabrix.com/register`
2. "Already on Trial? Log in" → `trial.syllabrix.com/login`
3. "Business Sign Up" → `syllabrix.com/get-started`
4. "Business Login" → `syllabrix.com/login`

---

## Trial Landing Page CTAs (trial.syllabrix.com)
1. "Start Free Trial" → `/register`
2. "Log in" → `/login`
3. "Ready for Syllabrix Business?" → `syllabrix.com/get-started`

---

## Trial Landing Page Sections

### 1. Hero
- Headline: "Experience the Future of Indian Business Management"
- Sub: "You're on the Syllabrix Trial — 14 days, full platform, zero commitment"
- Primary CTA: "Start Free Trial"
- Secondary CTA: "Already have a trial account? Log in"
- Trial restriction badge: "Sandbox Environment — Not for real business use"

### 2. Market Statement (Investor Hook)
- "India has 63 million SMBs. Only 3% use ERP software."
- "Syllabrix is built for the other 97%."
- Made in India badge

### 3. Live Traction Numbers (Dynamic — admin-controlled)
- Businesses on platform
- Business types supported (83+)
- Modules available (20+)
- Cities covered
- (Numbers fetched from a public API or hardcoded with Nerve Center override)

### 4. Feature Showcase
- Inventory, Billing, CRM, Staff, GST, AI Copilot, WhatsApp
- India-specific: GST-native, WhatsApp-native, UPI payments
- Visual tiles with icons

### 5. Business Types Gallery
- Scrolling/grid gallery of 83+ business types
- Shows breadth of platform coverage

### 6. Why Syllabrix (Comparison)
- vs Tally / Vyapar / Busy
- Comparison table: GST, WhatsApp, AI, Multi-branch, Mobile, Price

### 7. Pricing Plans (Dynamic from Plan Creator DB)
- Starter ₹999 / Growth ₹2,499 / Scale ₹4,999
- Fetched live from `/api/v1/auth/plans`
- Monthly/yearly toggle
- CTA on each plan → `syllabrix.com/get-started`

### 8. Partner & Investor Section
- Headline: "Building for India's next 60 million businesses"
- Sub: "Interested in partnering, investing, or integrating?"
- Contact form → submits to Nerve Center (new lead model or email)
- Or simple mailto link to start

### 9. Upgrade CTA (Sticky / Bottom of page)
- "Loving the trial? Go live today."
- Button: "Create Your Business Account" → `syllabrix.com/get-started`

---

## Trial Restriction Messaging (appears throughout)
- Top banner: "⚠ TRIAL ENVIRONMENT — Data is not permanent. Not for real business operations."
- On all generated documents: "TRIAL — NOT VALID"
- Reminder before signup: mandatory checkbox

---

## Technical Notes
- `trial-landing.html` in `frontend/public/` — separate from `landing.html`
- `RootRedirect` in `App.jsx` detects hostname:
  - `syllabrix.com` → serves `landing.html`
  - `trial.syllabrix.com` → serves `trial-landing.html`
- Plans fetched dynamically from Quality backend (`syllabrix-quality.onrender.com`)
- Traction numbers — Phase 1: static with admin override via Nerve Center later

---

## Future Enhancements
- Nerve Center "Landing Stats" wing — admin controls live traction numbers
- Testimonials section (once businesses give feedback)
- Video demo embed
- Investor deck download (gated behind contact form)
- WhatsApp chat widget for instant business enquiries
