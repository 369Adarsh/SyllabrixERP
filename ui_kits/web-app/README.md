# Syllabrix Web App — UI Kit

A high-fidelity recreation of the Syllabrix admin/owner web dashboard. The dashboard is **adaptive** — the sidebar and KPI cards in `index.html` change based on the active business type (kirana, coaching, salon, clinic). Switch types in the top bar to see the Business Adaptation Engine at work.

## Components

| File | What it is |
|---|---|
| `Sidebar.jsx` | Fixed left nav, logo, module list, branch switcher, user footer. |
| `TopBar.jsx` | Search, business-type switcher, theme toggle, notifications, user menu. |
| `KpiCard.jsx` | Numeric headline + delta + sparkline. Variants: default, indigo-gradient, saffron. |
| `ModuleTile.jsx` | Tappable module card for the home grid. |
| `InvoiceTable.jsx` | Tabular numerics, status pills, row hover. |
| `AiCopilot.jsx` | Floating saffron chip → inverse surface panel with prompts. |
| `Dashboard.jsx` | Orchestrator — composes the above into the home view. |

## Adaptive logic

The `BUSINESS_PROFILES` map in `Dashboard.jsx` defines, per business type:
- KPI labels (e.g. retail says "Today's sales", coaching says "Active students")
- Visible modules (POS for retail, Admissions for coaching, Appointments for salon)
- Table fixture (recent invoices vs upcoming classes vs today's appointments)

This mirrors the production Adaptation Engine described in the brief.

## How to run
Open `index.html` directly. Loads from CDN.
