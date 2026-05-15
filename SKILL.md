---
name: syllabrix-design
description: Use this skill to generate well-branded interfaces and assets for Syllabrix, either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. Syllabrix (full name "Syllabrix Network") is an AI-powered modular ERP SaaS for small businesses (retail, kirana, coaching, salons, clinics, restaurants, malls, service shops). Brand voice is calm, confident, plain-spoken; visuals are warm cream + deep navy + a flash of electric cyan.
user-invocable: true
---

Read `README.md` first — it contains the brand context, content fundamentals, visual foundations, and iconography rules. Then explore the other files:

- `colors_and_type.css` — drop-in design tokens (colors, type, spacing, radius, shadow, motion). Always import this first.
- `assets/` — logos, illustrations. Copy what you need; never redraw.
- `preview/` — small specimen cards documenting each token group.
- `ui_kits/web-app/` — admin/owner web dashboard (adaptive: retail / coaching / salon / clinic).
- `ui_kits/mobile-app/` — owner mobile app (Home / POS / AI Studio).
- `ui_kits/marketing-site/` — public marketing site.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out and create static HTML files for the user to view. If working on production code, copy assets and apply the rules in `README.md` to design with the Syllabrix brand correctly.

If the user invokes this skill without other guidance, ask what they want to build, ask a few targeted questions (business type, surface, audience, fidelity), then act as an expert designer who outputs HTML artifacts or production code as needed.

**House rules to enforce:**
- Sentence case for everything except brand names. Plain, direct, blameless copy. "You" not "we." `₹` always before numbers, no space.
- Never pure white backgrounds — use cream `#FAF6EF`. Never a `#000` shadow — use the warm shadow tokens.
- Lucide icons only, 1.5px stroke. Never emoji as iconography.
- The brick motif (12px radius, modular cards) is the signature shape.
- **Cyan is an accent**, primary actions are navy. Reserve electric cyan `#27DCFF` for the X mark, sparkles, and AI gradients only.
- Use the founder-supplied PNG (`assets/logo-syllabrix-network.png`) for marketing/hero placements; use the SVG mark/wordmark for product chrome.
- Bricolage Grotesque for display, Plus Jakarta Sans for body, JetBrains Mono for numerics. Never Inter.
