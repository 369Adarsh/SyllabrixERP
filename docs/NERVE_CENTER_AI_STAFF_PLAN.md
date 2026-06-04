# Syllabrix Nerve Center — AI Staff & Department Architecture
## Complete Product Specification & Build Plan

**Version:** 1.0  
**Date:** June 2026  
**Prepared by:** Syllabrix Product Team  
**Status:** Approved for Build — Phase 0 Ready

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What We Are Building](#2-what-we-are-building)
3. [Architecture Overview](#3-architecture-overview)
4. [Department Breakdown](#4-department-breakdown)
   - 4.1 MD Command Center
   - 4.2 HR Department
   - 4.3 Tech Department
   - 4.4 Finance Department
   - 4.5 Marketing Department
   - 4.6 AI Staff Room
5. [Complete Sidebar Structure](#5-complete-sidebar-structure)
6. [New Pages — Detailed Specifications](#6-new-pages--detailed-specifications)
7. [AI Agent Architecture](#7-ai-agent-architecture)
8. [Agent Profiles — Role & Responsibilities](#8-agent-profiles--role--responsibilities)
9. [Trigger & Escalation System](#9-trigger--escalation-system)
10. [Backend Infrastructure](#10-backend-infrastructure)
11. [Database Models](#11-database-models)
12. [Build Phases](#12-build-phases)
13. [Access Control Model](#13-access-control-model)
14. [Rules for Glitch-Free Execution](#14-rules-for-glitch-free-execution)

---

## 1. Executive Summary

Syllabrix Nerve Center is the single command layer for the entire Syllabrix SaaS platform. It currently operates as the platform admin panel at `/platform/*`.

This plan transforms the Nerve Center from a **7-wing function-based admin panel** into a **6-department organization** — each department staffed by an AI agent, managed by you as the Managing Director.

The result: Syllabrix runs like a real company, with AI employees handling day-to-day operations, escalating only critical decisions to you. You retain full control, full visibility, and spend zero time on routine platform management.

**This is not a cosmetic change. This is a structural rebuild with real AI intelligence powering every department.**

---

## 2. What We Are Building

### 2.1 The Concept

You are the **MD (Managing Director)** of Syllabrix. The Nerve Center is your company headquarters. Each department of Syllabrix has an AI agent acting as the department head — autonomous, intelligent, and accountable to you.

```
                      YOU — Managing Director
                             │
         ┌──────────┬────────┴───────┬──────────────┐
         │          │                │              │
      AI HR      AI Tech          AI Finance    AI Marketing
      Agent      Manager          Agent         Agent
                    │
               AI Engineer
               (reports to
               Tech Manager)
```

### 2.2 What Changes from Today

| Before | After |
|---|---|
| 7 wings organized by function | 6 departments organized by responsibility |
| You manage everything manually | AI agents handle routine operations |
| No escalation system | All critical decisions escalate to your inbox |
| No agent oversight | AI Staff Room — full agent management |
| Flat admin panel | A company org structure with a chain of command |

### 2.3 What Stays the Same

- All existing routes (`/platform/*`) remain unchanged — no URL restructuring
- All existing pages are preserved — they move departments, not get deleted
- Dark theme, design standards, and visual identity remain locked
- All existing backend APIs remain unchanged

---

## 3. Architecture Overview

### 3.1 Department Map

```
NERVE CENTER
│
├── MD COMMAND          ← You. Full visibility. Escalation inbox. Directive center.
├── HR DEPARTMENT       ← AI HR Agent. Tenants, onboarding, compliance, support.
├── TECH DEPARTMENT     ← AI Tech Manager + AI Engineer. Platform stability, features.
├── FINANCE DEPARTMENT  ← AI Finance Agent. Revenue, billing, subscriptions, overdue.
├── MARKETING DEPT      ← AI Marketing Agent. Growth, analytics, adoption, campaigns.
└── AI STAFF ROOM       ← Where you manage all agents. Chat, logs, configuration.
```

### 3.2 Page Count

| Department | Existing pages | New pages | Total |
|---|---|---|---|
| MD Command | 4 (moved) | 2 | 6 |
| HR Department | 5 (moved) | 1 | 6 |
| Tech Department | 11 (moved) | 1 | 12 |
| Finance Department | 4 (moved) | 2 | 6 |
| Marketing Department | 3 (moved) | 2 | 5 |
| AI Staff Room | 0 | 4 | 4 |
| **Total** | **27 existing** | **12 new** | **39 pages** |

---

## 4. Department Breakdown

---

### 4.1 MD Command Center

**Who runs it:** You — the Managing Director.

**Purpose:** Your executive cockpit. You see the full health of every department in one place. All critical escalations from AI agents land here. You send directives from here.

**Design principle:** Minimal noise, maximum signal. You should be able to assess the state of the entire Syllabrix platform in under 60 seconds from this dashboard.

| Page | Route | Status | Description |
|---|---|---|---|
| Executive Dashboard | `/platform/dashboard` | Enhance existing | Cross-department KPIs, agent statuses, escalation preview |
| Escalation Inbox | `/platform/escalations` | **NEW** | All agent escalations pending your decision |
| Directive Center | `/platform/directives` | **NEW** | Send instructions to any agent. View responses |
| Activity Monitor | `/platform/activity` | Move from Command | Real-time feed of all platform events |
| Announcements | `/platform/announcements` | Move from Operations | Push messages to all or specific tenants |
| Audit Logs | `/platform/audit-logs` | Move from Intelligence | Every admin and agent action logged |

**Executive Dashboard — KPI Cards:**

| Card | Metric | Source |
|---|---|---|
| Revenue Today | Payments received today | Finance module |
| MRR | Monthly Recurring Revenue | Subscriptions |
| Active Tenants | Tenants with active subscriptions | Tenants table |
| New Signups (7d) | Tenants who signed up in last 7 days | Tenants table |
| Open Escalations | Escalations pending your decision | AgentEscalation model |
| Agent Status | How many agents active vs idle | AIAgent model |
| System Health | API uptime % + error rate | Platform Health |
| Open Tickets | Support tickets unresolved | Support table |

---

### 4.2 HR Department

**Who runs it:** AI HR Agent.

**Purpose:** Everything about people on the Syllabrix platform — tenants (customers), their onboarding journey, compliance verification, support issues, and internal Syllabrix team management.

**AI HR Agent motto:** *"Every tenant deserves a smooth experience from day one."*

| Page | Route | Status | Description |
|---|---|---|---|
| HR Overview | `/platform/hr` | **NEW** | Department dashboard with all HR metrics |
| All Tenants | `/platform/tenants` | Move from Tenants | Full tenant list, drill-down per tenant |
| Onboarding Pipeline | `/platform/onboarding` | Move from Growth | Signup → KYC → Approved → Active funnel |
| Compliance & KYC | `/platform/compliance` | Move from Tenants | KYC status, risk levels, reviewer notes |
| Support Console | `/platform/support-console` | Move from Operations | All tenant-reported tickets, P1/P2/P3 queue |
| Nerve Team | `/platform/admins` | Move from Team | Internal Syllabrix staff management |

**HR Overview — KPI Cards:**

| Card | Metric |
|---|---|
| Total Tenants | All registered tenants |
| Active Tenants | Tenants currently on a paid/trial plan |
| In Onboarding | Tenants stuck in onboarding pipeline |
| Open Tickets | Unresolved support tickets |
| KYC Pending | Tenants awaiting KYC review |
| Churn This Month | Tenants who cancelled this month |

---

### 4.3 Tech Department

**Who runs it:** AI Tech Manager. AI Engineer reports to Tech Manager only — never directly to MD.

**Purpose:** Platform stability, feature control, architecture management, error monitoring, and engineering task management.

**Reporting chain:** AI Engineer → AI Tech Manager → MD (only on critical issues)

| Page | Route | Status | Description |
|---|---|---|---|
| Tech Overview | `/platform/tech` | **NEW** | Department dashboard with all technical metrics |
| Platform Health | `/platform/health` | Move from Command | API status, DB pool, response times, uptime |
| Business Catalog | `/platform/business-catalog` | Move from Platform Control | All SYL-BC-* types, module assignments |
| Business Builder | `/platform/business-builder` | Move from Platform Control | No-code business type creator |
| Roles & Modules | `/platform/roles-matrix` | Move from Platform Control | Full permission matrix |
| Feature Catalog | `/platform/feature-catalog` | Move from Platform Control | All available Syllabrix features |
| Feature Flags | `/platform/feature-flags` | Move from Platform Control | Toggle modules globally or per tenant |
| Dev Queue | `/platform/dev-queue` | Move from Operations | Engineering task board |
| Error Tracker | `/platform/errors` | Move from Intelligence | All 4xx/5xx errors grouped by type |
| Maintenance Mode | `/platform/maintenance` | Move from Operations | Schedule / activate maintenance windows |
| API Keys | `/platform/api-keys` | Move from Configuration | Platform API key management |

**Tech Overview — KPI Cards:**

| Card | Metric |
|---|---|
| API Uptime | Last 24h uptime percentage |
| Error Rate | 4xx/5xx errors per 1000 requests |
| Response Time (P95) | 95th percentile API response time (ms) |
| Open Dev Tasks | Tasks in Dev Queue |
| Active Feature Flags | Number of flags currently enabled |
| Last Deployment | Time since last code deployment |

---

### 4.4 Finance Department

**Who runs it:** AI Finance Agent.

**Purpose:** All money-related operations — revenue tracking, billing management, subscription oversight, and overdue account management.

**AI Finance Agent motto:** *"No overdue account goes unnoticed. No revenue drop goes unexplained."*

| Page | Route | Status | Description |
|---|---|---|---|
| Finance Overview | `/platform/finance` | **NEW** | Department dashboard with all financial metrics |
| Revenue | `/platform/revenue` | Move from Growth | MRR/ARR charts, plan distribution, revenue by business type |
| Plans & Billing | `/platform/plans` | Move from Growth | Tenant plan management, manual overrides |
| Plan Creator | `/platform/plan-builder` | Move from Growth | Dynamic pricing tier and promo offer manager |
| Subscriptions | `/platform/subscriptions` | Move from Tenants | All active/inactive/trial subscriptions |
| Overdue Accounts | `/platform/overdue` | **NEW** | Tenants with overdue payments, days overdue, actions |

**Finance Overview — KPI Cards:**

| Card | Metric |
|---|---|
| MRR | Monthly Recurring Revenue |
| ARR | Annual Recurring Revenue |
| Revenue Today | Payments received today |
| Overdue Accounts | Number of tenants with overdue payment |
| Overdue Amount | Total outstanding amount |
| Churn Rate | MOM churn percentage |
| New MRR This Month | Revenue added from new subscriptions |

---

### 4.5 Marketing Department

**Who runs it:** AI Marketing Agent.

**Purpose:** Platform growth, feature adoption, business intelligence, and tenant engagement analytics.

**AI Marketing Agent motto:** *"Every number tells a story. I find the story before you need to ask."*

| Page | Route | Status | Description |
|---|---|---|---|
| Marketing Overview | `/platform/marketing` | **NEW** | Department dashboard with growth and adoption metrics |
| Platform Analytics | `/platform/analytics` | Move from Intelligence | Tenant growth, retention cohorts, feature adoption curves |
| Module Usage | `/platform/module-usage` | Move from Platform Control | Which modules are most/least used across all tenants |
| Growth Reports | `/platform/growth` | **NEW** | Business type distribution, geographic spread, conversion funnel |
| Landing Media | `/platform/landing-media` | Move from Configuration | Landing page media manager |

**Marketing Overview — KPI Cards:**

| Card | Metric |
|---|---|
| New Signups (7d) | Tenants who signed up in last 7 days |
| Conversion Rate | Trial → Paid conversion this month |
| Top Growing Vertical | Business type with most new signups |
| Feature Adoption | Average % of modules enabled per tenant |
| Fastest Growing City | City with most new signups |
| Churn Signal | Tenants inactive for 14+ days |

---

### 4.6 AI Staff Room

**Who accesses it:** You (MD) only.

**Purpose:** The control room for managing all 5 AI agents. Monitor their status, chat with them directly, review their actions, and configure their behavior.

| Page | Route | Status | Description |
|---|---|---|---|
| Staff Overview | `/platform/ai-staff` | **NEW** | All agents displayed as employee cards with live status |
| Agent Chat | `/platform/ai-staff/chat` | **NEW** | Direct chat interface with any agent |
| Activity Log | `/platform/ai-staff/activity` | **NEW** | Complete log of every agent action, filterable |
| Agent Config | `/platform/ai-staff/config` | **NEW** | System prompt, schedule, triggers, tool permissions per agent |

---

## 5. Complete Sidebar Structure

```
NERVE CENTER
│
├── ── MD COMMAND ──────────────────────────────────
│   ▦   Executive Dashboard
│   📥  Escalation Inbox                   [NEW]
│   🎯  Directive Center                   [NEW]
│   📡  Activity Monitor
│   📣  Announcements
│   📒  Audit Logs
│
├── ── HR DEPARTMENT ───────────────────────────────
│   👥  HR Overview                        [NEW]
│   🏢  All Tenants
│   🚀  Onboarding Pipeline
│   🛡   Compliance & KYC
│   🐛  Support Console
│   👤  Nerve Team
│
├── ── TECH DEPARTMENT ─────────────────────────────
│   ⚙️  Tech Overview                      [NEW]
│   ❤️  Platform Health
│   🗂   Business Catalog
│   🏗   Business Builder
│   ⚡  Roles & Modules
│   🎛   Feature Catalog
│   🚦  Feature Flags
│   🔧  Dev Queue
│   🔴  Error Tracker
│   🔩  Maintenance Mode
│   🔑  API Keys
│
├── ── FINANCE DEPARTMENT ──────────────────────────
│   💰  Finance Overview                   [NEW]
│   📊  Revenue
│   📋  Plans & Billing
│   🏗   Plan Creator
│   💳  Subscriptions
│   ⚠️  Overdue Accounts                   [NEW]
│
├── ── MARKETING DEPARTMENT ────────────────────────
│   📈  Marketing Overview                 [NEW]
│   📊  Platform Analytics
│   📦  Module Usage
│   🌱  Growth Reports                     [NEW]
│   🖼   Landing Media
│
└── ── AI STAFF ROOM ───────────────────────────────
    🤖  Staff Overview                     [NEW]
    💬  Agent Chat                         [NEW]
    📋  Activity Log                       [NEW]
    ⚙️  Agent Config                       [NEW]
```

---

## 6. New Pages — Detailed Specifications

### 6.1 Escalation Inbox (`/platform/escalations`) — MD Command

**What it is:** The single place where all AI agent escalations arrive for your decision.

**Layout:**
- Top filter bar: All / Pending / Resolved / By Department / By Urgency
- Each escalation is a card showing:
  - Agent name + department badge
  - Urgency level: CRITICAL (red) / HIGH (amber) / MEDIUM (teal) / LOW (grey)
  - Subject line (e.g. "Payment fraud suspected — SYL00023")
  - Full detail body (expandable)
  - Time received
  - Action buttons: **Approve**, **Reject**, **Delegate**, **Ask Agent**
- Resolved tab shows history with resolution notes

**Urgency definitions:**

| Level | Examples | Expected Response Time |
|---|---|---|
| CRITICAL | System down, fraud detected, data breach | Immediate |
| HIGH | Payment >14 days overdue, P1 support ticket, error rate spike | Within 2 hours |
| MEDIUM | New tenant stuck in onboarding >3 days, module adoption drop | Within 24 hours |
| LOW | Weekly report ready, routine recommendation | Within 72 hours |

---

### 6.2 Directive Center (`/platform/directives`) — MD Command

**What it is:** Where you send instructions to AI agents and they respond.

**Layout:**
- Left panel: List of past directives (newest first)
- Right panel: Compose new directive
  - Recipient dropdown: All Agents / HR Agent / Tech Manager / Finance Agent / Marketing Agent
  - Message text area
  - Send button
- Each directive card shows:
  - Sent to (agent + dept badge)
  - Your instruction
  - Agent response (timestamped)
  - Status: Pending / Acknowledged / In Progress / Completed

---

### 6.3 HR Overview (`/platform/hr`) — HR Department

**What it is:** AI HR Agent's department dashboard.

**Layout:**
- Top row: 6 KPI cards (Total Tenants, Active, In Onboarding, Open Tickets, KYC Pending, Churn)
- AI HR Agent status card (Active/Idle, last action taken, "Chat with HR Agent" button)
- Onboarding funnel visualization (horizontal bar showing conversion at each stage)
- Recent ticket activity (last 5 support tickets with status)
- Recent tenant signups (last 5 tenants with business type badge)

---

### 6.4 Tech Overview (`/platform/tech`) — Tech Department

**What it is:** AI Tech Manager's department dashboard.

**Layout:**
- Top row: 6 KPI cards (API Uptime, Error Rate, P95 Response Time, Open Dev Tasks, Active Flags, DB Health)
- Two agent status cards side by side: Tech Manager + Engineer
- System health timeline (last 24h uptime graph)
- Recent errors (top 5 errors by frequency)
- Dev queue preview (top 5 open tasks by priority)

---

### 6.5 Finance Overview (`/platform/finance`) — Finance Department

**What it is:** AI Finance Agent's department dashboard.

**Layout:**
- Top row: 7 KPI cards (MRR, ARR, Revenue Today, Overdue Accounts, Overdue Amount, Churn Rate, New MRR)
- AI Finance Agent status card
- MRR trend line chart (last 6 months)
- Plan distribution donut chart (Free / Starter / Pro / Enterprise)
- Overdue accounts preview table (top 5 by days overdue)

---

### 6.6 Marketing Overview (`/platform/marketing`) — Marketing Department

**What it is:** AI Marketing Agent's department dashboard.

**Layout:**
- Top row: 6 KPI cards (New Signups 7d, Conversion Rate, Top Growing Vertical, Feature Adoption %, Top City, Churn Signal)
- AI Marketing Agent status card
- Signup trend line chart (last 30 days)
- Business type distribution bar chart
- Module adoption heatmap (modules vs adoption %)

---

### 6.7 Overdue Accounts (`/platform/overdue`) — Finance Department

**What it is:** Every tenant with an overdue payment in one actionable view.

**Layout:**
- Summary strip: Total overdue amount / Number of accounts / Average days overdue
- Filter: 3–7 days / 7–14 days / 14–30 days / 30+ days
- Table columns:
  - Tenant name + SyllabrixID
  - Business type badge
  - Plan name
  - Amount due
  - Days overdue (color-coded: amber >7, red >14)
  - Last payment date
  - Actions: Send Reminder / Suspend Access / Mark Resolved / View Billing History
- Bulk action: Select all → Send Reminder to Selected

---

### 6.8 Growth Reports (`/platform/growth`) — Marketing Department

**What it is:** The deep-dive analytics view for understanding how Syllabrix is growing.

**Layout:**
- Section 1: Business Type Distribution
  - Donut chart: distribution of tenants by SYL-BC-* category
  - Table below with count + % + MOM change per type

- Section 2: Geographic Distribution
  - City-level breakdown of tenant count
  - Top 10 cities table with growth rate

- Section 3: Conversion Funnel
  - Visited → Signed Up → Trial → Paid → Active
  - Drop-off % at each stage

- Section 4: Retention Cohort Table
  - Month-by-month cohort table: which tenants from month X are still active in month Y
  - Color-coded cells by retention % (green >80%, amber 50–80%, red <50%)

---

### 6.9 Staff Overview (`/platform/ai-staff`) — AI Staff Room

**What it is:** The visual dashboard of your AI workforce.

**Layout:**
- Five agent cards arranged in the org chart hierarchy:
  - Top row: You (MD) — labeled "Managing Director"
  - Second row: HR Agent / Tech Manager / Finance Agent / Marketing Agent
  - Third row (under Tech Manager): Engineer Agent
- Each agent card shows:
  - Agent name + role title
  - Department badge
  - Status indicator: 🟢 Active / 🟡 Idle / 🔴 Alert / ⚫ Offline
  - Last action taken (timestamp + description)
  - Actions run today (count)
  - Escalations sent today (count)
  - Toggle: Enable / Disable
  - Button: "Chat with this Agent"

---

### 6.10 Agent Chat (`/platform/ai-staff/chat`) — AI Staff Room

**What it is:** A messaging interface to talk directly with any AI agent.

**Layout:**
- Left panel: Agent selector (5 agents listed with status dots)
- Right panel: Chat window
  - Messages displayed as conversation bubbles (your messages right, agent left)
  - Agent avatar uses department color
  - Agent responses include tool calls they made (shown as expandable "actions taken" block)
  - Input bar at bottom with Send button
  - Chat history persisted per agent
- Each agent responds based on its domain knowledge and available tools

**Example interactions:**

```
You → HR Agent:
"How many tenants are stuck in onboarding for more than 3 days?"

HR Agent:
"Currently 4 tenants are stuck in onboarding beyond 3 days:
 - SYL00045 (Metro Pharmacy) — stuck at KYC for 5 days
 - SYL00047 (Green Leaf Clinic) — stuck at Document Upload for 4 days
 ...
 Want me to send them a reminder email?"
```

```
You → Finance Agent:
"What is our MRR this month compared to last month?"

Finance Agent:
"MRR this month: ₹1,24,500 (+8.3% vs last month ₹1,14,950)
 New MRR added: ₹12,400 from 3 new paid subscriptions
 Churned MRR: ₹2,850 from 1 cancellation
 Net MRR growth: ₹9,550"
```

---

### 6.11 Activity Log (`/platform/ai-staff/activity`) — AI Staff Room

**What it is:** A complete audit trail of every action every agent has ever taken.

**Layout:**
- Filter bar: Agent / Action Type / Date Range / Outcome (Success / Failed / Escalated)
- Timeline list, newest first:
  - Each entry shows:
    - Agent name + dept badge
    - Action description ("Checked overdue accounts — found 3 new overdue")
    - Tools used (expandable: which API calls were made)
    - Outcome: Success / Escalated / Failed
    - Timestamp
- Export to CSV button

---

### 6.12 Agent Config (`/platform/ai-staff/config`) — AI Staff Room

**What it is:** Full configuration control for each AI agent.

**Layout:**
- Left panel: Agent selector
- Right panel: Configuration form for selected agent

Each agent config includes:

| Config Field | Description |
|---|---|
| Agent Name | Display name (editable) |
| Role Title | e.g. "HR Manager", "Finance Director" |
| Status | Enabled / Disabled toggle |
| System Prompt | Editable text area — the agent's core instructions |
| Schedule | Cron expression + human-readable preview (e.g. "Every Monday at 9:00 AM") |
| Event Triggers | Checkbox list of events that wake this agent |
| Escalation Thresholds | Numeric inputs (e.g. "Escalate if overdue > 14 days") |
| Tool Permissions | Checkbox list of which API tools this agent may use |
| Model | Claude model selection (Sonnet / Opus) |
| Last Updated | Timestamp + who updated |

---

## 7. AI Agent Architecture

### 7.1 Core Concept

Each AI agent is a Claude API instance that:
1. Has a **system prompt** defining its role, domain, and boundaries
2. Has a **tool set** — functions that connect it to Syllabrix backend APIs
3. Is triggered by **schedules** (cron) or **events** (backend webhooks)
4. Logs every action to `AgentAction` table
5. Escalates uncertain or threshold-crossed situations to `AgentEscalation` table
6. Maintains a **chat history** for direct MD conversations

### 7.2 Agent Runner Pattern

```
TRIGGER (cron / event / MD chat)
        │
        ▼
Load Agent Config (system prompt, tools, thresholds)
        │
        ▼
Call Claude API with:
  - system prompt
  - tool definitions
  - current context (event data or chat message)
        │
        ▼
Claude decides: use tools / escalate / respond
        │
        ├─── Tool call ──► Execute Syllabrix API ──► Return result to Claude
        │
        ├─── Escalate ──► Write to AgentEscalation ──► Notify MD
        │
        └─── Done ──────► Write to AgentAction log
```

### 7.3 Model Selection

| Agent | Model | Reason |
|---|---|---|
| HR Agent | `claude-sonnet-4-6` | Routine ops, well-defined tasks |
| Tech Manager | `claude-sonnet-4-6` | Technical analysis, structured decisions |
| Engineer | `claude-haiku-4-5` | High-frequency monitoring, fast responses |
| Finance Agent | `claude-opus-4-8` | Financial reasoning requires highest accuracy |
| Marketing Agent | `claude-sonnet-4-6` | Analytics and report generation |

### 7.4 Tool Categories per Agent

**HR Agent Tools:**
- `getTenants(filter)` — list tenants with optional status/type filters
- `getTenantById(id)` — full tenant profile
- `getOnboardingStatus()` — all tenants in pipeline with stage and days stuck
- `getSupportTickets(priority)` — open tickets by priority
- `updateTenantStatus(id, status)` — activate / suspend a tenant
- `sendTenantEmail(tenantId, template, data)` — send templated email
- `moveOnboardingStage(tenantId, stage)` — advance tenant through pipeline
- `createEscalation(subject, body, urgency)` — escalate to MD

**Tech Manager Tools:**
- `getPlatformHealth()` — API uptime, DB status, response times
- `getErrorSummary(hours)` — error count and types in last N hours
- `getFeatureFlags()` — all flags and their current state
- `toggleFeatureFlag(flagId, enabled)` — enable/disable a feature
- `getDevQueue()` — open engineering tasks
- `createDevTask(title, priority, description)` — add task to Dev Queue
- `delegateToEngineer(task)` — assign task to Engineer agent
- `getAIEngineerReport()` — latest report from Engineer agent
- `createEscalation(subject, body, urgency)` — escalate to MD

**Engineer Tools:**
- `getAPIMetrics(hours)` — response times, error rates, endpoint performance
- `getDBMetrics()` — query performance, connection pool, slow queries
- `getErrorTraces(limit)` — detailed error traces
- `getTopErrors(limit)` — most frequent errors grouped by type
- `reportToTechManager(report)` — send findings to Tech Manager
  *(Engineer cannot escalate directly to MD — only via Tech Manager)*

**Finance Agent Tools:**
- `getRevenueSummary()` — MRR, ARR, today's revenue
- `getSubscriptions(status)` — all subscriptions with optional status filter
- `getOverdueAccounts()` — tenants with overdue payments + days overdue
- `sendPaymentReminder(tenantId)` — send payment reminder email
- `suspendTenantAccess(tenantId, reason)` — suspend overdue tenant (requires MD approval)
- `generateFinanceReport(month)` — full monthly financial summary
- `flagFraud(tenantId, details)` — escalate suspected fraud to MD immediately
- `createEscalation(subject, body, urgency)` — escalate to MD

**Marketing Agent Tools:**
- `getSignupTrends(days)` — new tenant signups per day for last N days
- `getBusinessTypeDistribution()` — tenant count by SYL-BC-* type
- `getFeatureAdoption()` — module usage % across all eligible tenants
- `getRetentionCohorts()` — cohort retention table data
- `getConversionFunnel()` — trial → paid conversion funnel data
- `getGeographicDistribution()` — tenant count by city/state
- `generateGrowthReport(month)` — full monthly growth summary
- `createEscalation(subject, body, urgency)` — escalate to MD

---

## 8. Agent Profiles — Role & Responsibilities

### 8.1 AI HR Agent

**Title:** Head of Human Relations  
**Reports to:** MD  
**Domain:** Tenants, Onboarding, Compliance, Support  
**Mode:** Advisory (Phase 1) → Autonomous (Phase 2 onward)

**Daily tasks:**
- Check onboarding pipeline at 9:00 AM — flag anyone stuck >3 days
- Review new support tickets at 10:00 AM and 4:00 PM
- Auto-resolve P3 tickets with standard responses
- Escalate P1 tickets immediately

**Weekly tasks (Monday 9:00 AM):**
- Generate tenant health report for MD
- Summarize: new signups, churned tenants, KYC backlog, open tickets

**Event triggers:**
- New tenant registered → begin onboarding sequence
- Ticket created with P1 priority → escalate to MD within 5 minutes
- Tenant KYC submitted → notify MD for review
- Tenant inactive for 14 days → flag for churn risk

**Escalation conditions:**
- P1 support ticket filed
- Tenant account flagged for fraud by Finance Agent
- KYC review stuck >7 days
- Any action requiring tenant suspension

---

### 8.2 AI Tech Manager

**Title:** Head of Technology  
**Reports to:** MD  
**Manages:** AI Engineer  
**Domain:** Platform stability, features, architecture  
**Mode:** Advisory (Phase 1) → Autonomous (Phase 2 onward)

**Daily tasks:**
- Review AI Engineer's hourly health reports
- Review feature flag status at 8:00 AM
- Check Dev Queue for priority tasks at 9:00 AM

**Weekly tasks (Monday 8:00 AM, before HR report):**
- Generate system health report for MD
- Summarize: uptime %, top errors, Dev Queue status, flag changes

**Event triggers:**
- Error rate exceeds 5% per hour → investigate immediately
- AI Engineer reports P1 bug → review and escalate or resolve
- Feature flag changed → log and verify no regressions
- Platform health check fails → alert MD

**Escalation conditions:**
- API uptime drops below 99%
- Critical security vulnerability detected
- Error rate spike with no identified cause
- Any platform change affecting all tenants

---

### 8.3 AI Engineer

**Title:** Platform Engineer  
**Reports to:** AI Tech Manager (NEVER directly to MD)  
**Domain:** API performance, DB health, error monitoring  
**Mode:** Autonomous from day one (monitoring only — no write operations without Tech Manager approval)

**Hourly tasks:**
- Check API error rate
- Check DB connection pool and slow queries
- Check P95 response time
- Report summary to Tech Manager

**Trigger-based tasks:**
- Error rate > 2% → generate detailed error trace report → send to Tech Manager
- DB slow query > 2000ms → report to Tech Manager
- New error type appears → analyze and report to Tech Manager

**Cannot do:**
- Escalate directly to MD
- Make any changes to production systems
- Toggle feature flags (must request via Tech Manager)

---

### 8.4 AI Finance Agent

**Title:** Head of Finance  
**Reports to:** MD  
**Domain:** Revenue, billing, subscriptions, overdue accounts  
**Mode:** Advisory (Phase 1) → Autonomous for reminders, Advisory for suspensions (Phase 2)

**Daily tasks (9:00 AM):**
- Check for new overdue accounts
- Send day-3 payment reminders automatically
- Flag day-14+ accounts for MD decision

**Weekly tasks (Friday 5:00 PM):**
- Generate weekly revenue summary for MD
- MRR change, new subscriptions, cancellations, overdue total

**Monthly tasks (1st of month, 9:00 AM):**
- Generate full financial report: MRR, ARR, churn rate, new MRR, top revenue tenants

**Event triggers:**
- Payment received → confirm subscription renewal
- Payment fails → begin reminder sequence (day 3, day 7, day 14)
- Subscription cancelled → log churn, report to MD
- Unusual payment pattern → flag as potential fraud, escalate immediately

**Escalation conditions:**
- Fraud suspected (unusual payment patterns)
- Revenue drops >15% month-over-month
- Tenant owes >₹50,000 overdue
- Any account suspension decision (Finance agent recommends, MD approves)

---

### 8.5 AI Marketing Agent

**Title:** Head of Marketing  
**Reports to:** MD  
**Domain:** Growth, analytics, feature adoption, tenant engagement  
**Mode:** Advisory only (generates insights and recommendations — does not take actions)

**Weekly tasks (Monday 10:00 AM, after HR report):**
- Generate growth report: new signups, conversion rate, top growing vertical
- Flag any modules with adoption below 20%
- Identify any signup drop >30% week-over-week

**Monthly tasks (1st of month, 11:00 AM):**
- Full growth report: business type distribution, geographic spread, retention cohorts, conversion funnel

**Event triggers:**
- Signup spike (>50% above weekly average) → report to MD with analysis
- Signup drop (>30% below weekly average) → report to MD with analysis
- New business type adoption hits 10 tenants → milestone report to MD

**Escalation conditions:**
- Signup drop >50% in a single week
- Churn rate exceeds 10% in a month
- Major feature adoption drops significantly (possible UX or bug indicator)

---

## 9. Trigger & Escalation System

### 9.1 Event Triggers

All platform events that wake agents are emitted by the backend event bus:

| Event | Emitted by | Agent triggered |
|---|---|---|
| `tenant.registered` | Auth service | HR Agent |
| `ticket.created` | Support service | HR Agent |
| `kyc.submitted` | Compliance service | HR Agent |
| `payment.received` | Billing service | Finance Agent |
| `payment.failed` | Billing service | Finance Agent |
| `subscription.cancelled` | Billing service | Finance Agent |
| `error.spike` | Error middleware | Engineer → Tech Manager |
| `feature.flag.changed` | Flags service | Tech Manager |
| `health.check.failed` | Health service | Tech Manager |
| `signup.spike` | Analytics service | Marketing Agent |

### 9.2 Escalation Flow

```
Agent detects threshold crossed
          │
          ▼
Agent writes to AgentEscalation table
  - agentId, subject, body, urgency, status=PENDING
          │
          ▼
Escalation Inbox in MD Command shows new item
  - Badge count updates on sidebar
  - CRITICAL urgency sends push notification (Phase 2)
          │
          ▼
MD reviews and takes action:
  Approve → Agent proceeds with proposed action
  Reject  → Agent logs rejection, stands down
  Delegate → Assigned to another agent or human admin
  Ask Agent → Opens chat with that agent for clarification
          │
          ▼
MD writes resolution note
Escalation status → RESOLVED
AgentEscalation.resolvedAt stamped
```

### 9.3 Chain of Command Rules (Non-Negotiable)

1. **Engineer never escalates to MD.** Engineer reports only to Tech Manager.
2. **Tech Manager escalates to MD on critical issues only** — not routine system events.
3. **Finance Agent must escalate ALL suspension decisions** — it cannot suspend a tenant autonomously.
4. **Marketing Agent is advisory only** — it never takes actions, only generates reports and recommendations.
5. **HR Agent may auto-respond to P3 tickets** but must escalate P1 tickets immediately.
6. **All autonomous actions are logged** — nothing an agent does is invisible.

---

## 10. Backend Infrastructure

### 10.1 File Structure

```
backend/src/modules/ai-staff/
├── agents/
│   ├── hr-agent.js              HR Agent runner
│   ├── tech-manager-agent.js    Tech Manager runner
│   ├── engineer-agent.js        Engineer runner
│   ├── finance-agent.js         Finance Agent runner
│   └── marketing-agent.js       Marketing Agent runner
├── tools/
│   ├── hr-tools.js              HR API tool functions
│   ├── tech-tools.js            Tech API tool functions
│   ├── finance-tools.js         Finance API tool functions
│   └── marketing-tools.js       Marketing API tool functions
├── core/
│   ├── agent-runner.js          Core loop: Claude API call + tool execution
│   ├── tool-executor.js         Executes tool calls returned by Claude
│   ├── escalation.js            Escalation writer + notifier
│   └── action-logger.js         AgentAction log writer
├── scheduler/
│   └── cron-scheduler.js        Cron-based agent trigger scheduler
├── events/
│   └── event-listener.js        Platform event bus listener
├── ai-staff.routes.js
├── ai-staff.controller.js
└── ai-staff.service.js
```

### 10.2 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/platform/ai-staff/agents` | Get all agent configs and statuses |
| PUT | `/api/platform/ai-staff/agents/:id` | Update agent config |
| POST | `/api/platform/ai-staff/agents/:id/toggle` | Enable/disable agent |
| GET | `/api/platform/ai-staff/activity` | Get agent activity log (paginated, filterable) |
| GET | `/api/platform/ai-staff/escalations` | Get all escalations (filterable) |
| POST | `/api/platform/ai-staff/escalations/:id/resolve` | Resolve an escalation |
| GET | `/api/platform/ai-staff/chat/:agentRole` | Get chat history for an agent |
| POST | `/api/platform/ai-staff/chat/:agentRole` | Send message to an agent |
| POST | `/api/platform/ai-staff/directive` | Send directive to agent(s) |
| GET | `/api/platform/ai-staff/directives` | Get directive history |

---

## 11. Database Models

```prisma
model AIAgent {
  id           String    @id @default(cuid())
  name         String    // "HR Agent"
  role         String    // "HR" | "TECH_MANAGER" | "ENGINEER" | "FINANCE" | "MARKETING"
  title        String    // "Head of Human Relations"
  systemPrompt String    @db.Text
  model        String    @default("claude-sonnet-4-6")
  enabled      Boolean   @default(true)
  schedule     String?   // cron expression e.g. "0 9 * * 1"
  thresholds   Json?     // escalation threshold config
  toolPerms    Json?     // which tools are permitted
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  actions      AgentAction[]
  escalations  AgentEscalation[]
  chats        AgentChat[]
}

model AgentAction {
  id          String   @id @default(cuid())
  agentId     String
  agent       AIAgent  @relation(fields: [agentId], references: [id])
  trigger     String   // "cron" | "event" | "chat" | "directive"
  action      String   // human-readable description
  toolsCalled Json     // array of {tool, input, output}
  outcome     String   // "SUCCESS" | "ESCALATED" | "FAILED"
  error       String?  // if outcome is FAILED
  durationMs  Int?     // how long it took
  createdAt   DateTime @default(now())
}

model AgentEscalation {
  id          String    @id @default(cuid())
  agentId     String
  agent       AIAgent   @relation(fields: [agentId], references: [id])
  subject     String
  body        String    @db.Text
  urgency     String    // "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  status      String    @default("PENDING") // "PENDING" | "RESOLVED" | "DISMISSED"
  resolvedBy  String?   // admin ID who resolved
  resolution  String?   @db.Text
  createdAt   DateTime  @default(now())
  resolvedAt  DateTime?
}

model AgentChat {
  id        String   @id @default(cuid())
  agentId   String
  agent     AIAgent  @relation(fields: [agentId], references: [id])
  role      String   // "user" | "assistant"
  content   String   @db.Text
  toolUse   Json?    // tools called in this message, if any
  createdAt DateTime @default(now())
}

model AgentDirective {
  id          String   @id @default(cuid())
  fromAdmin   String   // admin ID
  toAgentRole String   // "ALL" | "HR" | "TECH_MANAGER" | "FINANCE" | "MARKETING"
  message     String   @db.Text
  response    String?  @db.Text
  status      String   @default("PENDING") // "PENDING" | "ACKNOWLEDGED" | "COMPLETED"
  createdAt   DateTime @default(now())
  respondedAt DateTime?
}
```

---

## 12. Build Phases

### Phase 0 — Sidebar Restructure (1 day)
**Goal:** The new 6-department structure is visible and navigable before any new pages are built.

Tasks:
- Update `NAV` array in `PlatformLayout.jsx` to reflect new department sections
- Create empty placeholder pages for the 5 new department overview routes
- Add empty placeholder pages for AI Staff Room routes
- Verify every existing route still loads correctly after restructure
- No backend changes in this phase

**Done when:** All 39 routes are accessible. Sidebar shows 6 clear departments.

---

### Phase 1 — Department Overview Dashboards (4–5 days)
**Goal:** Every department has a real, data-powered overview page.

Tasks:
- Build HR Overview dashboard with live data
- Build Tech Overview dashboard with live data
- Build Finance Overview dashboard with live data
- Build Marketing Overview dashboard with live data
- Enhance Executive Dashboard (MD Command) with cross-department KPIs
- Build Escalation Inbox page (empty state — no agents yet, but structure is ready)

**Done when:** All 5 department overview pages load with real data.

---

### Phase 2 — Complete All Departments (3–4 days)
**Goal:** All departments are fully functional with all their pages.

Tasks:
- Build Overdue Accounts page (Finance)
- Build Growth Reports page (Marketing)
- Build Directive Center page (MD Command)
- Review and polish all moved pages for any broken layouts

**Done when:** All 39 pages load correctly. All departments fully functional.

---

### Phase 3 — AI Agent Backend Infrastructure (5–7 days)
**Goal:** The engine that powers all AI agents is built and tested.

Tasks:
- Add Prisma models: AIAgent, AgentAction, AgentEscalation, AgentChat, AgentDirective
- Run `prisma migrate`
- Seed 5 agent records with default system prompts and configs
- Build `agent-runner.js` — core Claude API integration with tool execution loop
- Build tool files for each agent (HR, Tech, Finance, Marketing tools)
- Build `cron-scheduler.js` — register and run scheduled agent jobs
- Build `event-listener.js` — listen to platform events and trigger correct agents
- Build `escalation.js` — write escalations and mark Escalation Inbox
- Build `action-logger.js` — log every agent action
- Build all REST endpoints for AI Staff Room UI
- Test each agent manually via API calls before building UI

**Done when:** Each agent can be triggered via API, runs correctly, uses tools, and logs its actions.

---

### Phase 4 — AI Staff Room Frontend (3–4 days)
**Goal:** Full UI for managing all AI agents from the Nerve Center.

Tasks:
- Build Staff Overview page (agent cards with org chart layout)
- Build Agent Chat interface (messaging UI, connected to backend)
- Build Activity Log page (paginated, filterable agent action log)
- Build Agent Config page (per-agent configuration form)
- Connect Escalation Inbox to real AgentEscalation data
- Connect Directive Center to real AgentDirective data

**Done when:** MD can see, chat with, configure, and review every agent from the UI.

---

### Phase 5 — Agent Intelligence Tuning (Ongoing)
**Goal:** Agents become genuinely reliable and useful over time.

Tasks (iterative, no fixed deadline):
- Review agent action logs weekly — identify incorrect or unhelpful responses
- Improve system prompts based on real behavior
- Add new tools as new platform capabilities are built
- Adjust escalation thresholds based on real escalation patterns
- Graduate agents from Advisory → Autonomous mode one at a time, after 2 weeks of reliable advisory performance

---

## 13. Access Control Model

### 13.1 Who Sees What

| Role | Access |
|---|---|
| SUPER (MD) | All 6 departments + AI Staff Room. Full read/write everywhere. |
| ADMIN | MD Command (no Directive Center) + HR + Tech + Finance + Marketing. No AI Staff Room. |
| SUPPORT | HR Department (Support Console + Tenants read-only) only. |

### 13.2 AI Agent Access

AI agents interact with the Syllabrix platform only through their approved tools. Each tool is an explicit, audited API call — agents cannot access database directly, cannot access other departments' data, and cannot act outside their tool permissions.

**Data boundaries are enforced at the tool layer, not the AI layer.**

---

## 14. Rules for Glitch-Free Execution

These rules are non-negotiable. They exist to prevent the most common failure modes in complex rebuilds.

1. **Phase 0 always first.** Never start building new pages before the sidebar structure is correct. A broken navigation ruins every page that follows.

2. **No route changes.** All existing `/platform/*` URLs remain unchanged. Users and bookmarks must not break.

3. **No page deletions.** Every existing page is moved to a department, never deleted. If something is redundant, archive it last — after the rebuild is complete.

4. **Agents start in Advisory Mode.** For the first 2 weeks after an agent is activated, it only recommends — you approve. Autonomous mode is earned, not assumed.

5. **Escalation Inbox is built before any agent runs.** An agent with nowhere to send escalations is a broken agent.

6. **Engineer never escalates to MD.** This chain of command is enforced in the Engineer's system prompt and verified in testing.

7. **Finance Agent never suspends autonomously.** All suspension decisions are escalated. This is a business-critical rule.

8. **One agent activated at a time.** Activate HR Agent first. Monitor for 1 week. Then Finance Agent. Then Tech Manager + Engineer. Then Marketing Agent. Never activate all at once.

9. **Every agent action is logged.** Nothing is invisible. If an agent did something, it is in the Activity Log. This is non-negotiable for debugging and trust-building.

10. **Test on dev branch, never on production agents.** All agent development and testing happens on `dev`. Only after thorough testing does agent infrastructure go to `main`.

---

## Appendix A — Summary of New Pages

| # | Page | Route | Department | Phase |
|---|---|---|---|---|
| 1 | HR Overview | `/platform/hr` | HR | Phase 1 |
| 2 | Tech Overview | `/platform/tech` | Tech | Phase 1 |
| 3 | Finance Overview | `/platform/finance` | Finance | Phase 1 |
| 4 | Marketing Overview | `/platform/marketing` | Marketing | Phase 1 |
| 5 | Escalation Inbox | `/platform/escalations` | MD Command | Phase 1 |
| 6 | Overdue Accounts | `/platform/overdue` | Finance | Phase 2 |
| 7 | Growth Reports | `/platform/growth` | Marketing | Phase 2 |
| 8 | Directive Center | `/platform/directives` | MD Command | Phase 2 |
| 9 | Staff Overview | `/platform/ai-staff` | AI Staff Room | Phase 4 |
| 10 | Agent Chat | `/platform/ai-staff/chat` | AI Staff Room | Phase 4 |
| 11 | Activity Log | `/platform/ai-staff/activity` | AI Staff Room | Phase 4 |
| 12 | Agent Config | `/platform/ai-staff/config` | AI Staff Room | Phase 4 |

---

## Appendix B — Page Migration Map (Existing → New Department)

| Page | From Wing | To Department |
|---|---|---|
| Dashboard | Command | MD Command |
| Activity Monitor | Command | MD Command |
| Announcements | Operations | MD Command |
| Audit Logs | Intelligence | MD Command |
| All Tenants | Tenants | HR Department |
| Onboarding Pipeline | Growth | HR Department |
| Compliance & KYC | Tenants | HR Department |
| Support Console | Operations | HR Department |
| Admins | Team | HR Department |
| Platform Health | Command | Tech Department |
| Business Catalog | Platform Control | Tech Department |
| Business Builder | Platform Control | Tech Department |
| Roles & Modules | Platform Control | Tech Department |
| Feature Catalog | Platform Control | Tech Department |
| Feature Flags | Platform Control | Tech Department |
| Dev Queue | Operations | Tech Department |
| Error Tracker | Intelligence | Tech Department |
| Maintenance Mode | Operations | Tech Department |
| API Keys | Configuration | Tech Department |
| Revenue | Growth | Finance Department |
| Plans & Billing | Growth | Finance Department |
| Plan Creator | Growth | Finance Department |
| Subscriptions | Tenants | Finance Department |
| Platform Analytics | Intelligence | Marketing Department |
| Module Usage | Platform Control | Marketing Department |
| Landing Media | Configuration | Marketing Department |
| Nerve Roles | Configuration | (Retire / Merge into Nerve Team) |

---

*This document is the authoritative specification for the Syllabrix Nerve Center AI Staff rebuild. All build decisions must align with this document. Updates to the plan must be reflected here before implementation begins.*
