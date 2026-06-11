# Syllabrix Marketing AI Agent — Full System Specification

**Document Version:** 1.0  
**Created:** 2026-06-10  
**Status:** Approved for Build  
**Classification:** Internal — Platform Architecture

---

## 1. Vision

Syllabrix will have a fully autonomous AI marketing employee that operates 24/7 — generating platform-specific content, designing branded graphics, scheduling and publishing posts across LinkedIn, Instagram, and Facebook, and reporting performance back to the platform owner through the Nerve Center.

This agent is not a third-party tool bolted onto the platform. It is a **first-class Nerve Center wing** — built inside Syllabrix, controlled from inside Syllabrix, and powered by the same backend that runs the entire platform.

The goal is simple: attract Indian SMB owners to trial.syllabrix.com without the platform owner needing to write a single caption, open a design tool, or manually log into any social media account.

---

## 2. What the Agent Does

### Content Generation
- Accepts a plain-language campaign brief from the platform owner
- Claude AI generates platform-optimised posts for LinkedIn, Instagram, and Facebook simultaneously
- Each post is written in the correct tone for that platform (professional for LinkedIn, visual-first for Instagram, conversational for Facebook)
- Hashtags, emojis, CTAs, and posting times are all generated automatically

### Visual Design
- Canva Connect API creates branded graphics from Syllabrix templates
- All designs conform to the official Syllabrix brand kit (Slate + Teal, #1FB8D6 / #27DCFF, official logo)
- If Canva is unavailable, posts go out as text-only — the agent never blocks itself

### Scheduling and Publishing
- Posts are queued in the database and published at optimal times automatically
- The agent handles the full posting lifecycle: draft → review → approved → queued → published → reported
- All posting happens from the Railway (Production) backend — never from the browser

### Video Content
- Short promotional videos (15s, 30s) rendered using Remotion on the Railway backend
- Videos highlight specific Syllabrix features or business types (gym, clinic, retail, etc.)
- Published as native video posts to all three platforms

### Analytics and Reporting
- Tracks reach, impressions, likes, link clicks, and trial signups attributed to each post
- Weekly AI summary delivered in the Nerve Center: what worked, what underperformed, what to do next week
- Platform owner never needs to open Meta Business Suite or LinkedIn Analytics

---

## 3. System Architecture

### High-Level Flow

```
Platform Owner (Nerve Center UI)
          │
          │  Campaign brief
          ▼
  Railway Backend (Express.js)
          │
          ├──► Anthropic API  ──► Generated post copy (3 platforms)
          │
          ├──► Canva Connect API  ──► Branded image asset
          │
          ├──► Supabase DB  ──► Posts saved, queued, tracked
          │
          ▼
  Job Queue (PostJob table)
          │
          ├──► Meta Graph API  ──► Facebook Page post
          │                  └──► Instagram Business post
          │
          └──► LinkedIn Share API  ──► LinkedIn Company Page post
                    │
                    ▼
          Analytics webhooks back to Supabase
```

### Why the Backend Handles Everything

Every sensitive operation — Claude API calls, Canva API calls, Meta API calls, LinkedIn API calls — runs exclusively on the Railway backend. The Nerve Center frontend (React) only:
- Sends the campaign brief to the backend
- Displays generated content for review
- Sends approval/rejection instructions

No API key, OAuth token, or credential ever reaches the browser. The browser has zero direct contact with any external service.

---

## 4. Security Model

### Credential Storage

| Credential | Storage Location | Access |
|---|---|---|
| Anthropic API Key | Railway environment variable | Backend only |
| Meta App ID + Secret | Railway environment variable | Backend only |
| Meta Page Access Token | Supabase (AES-256 encrypted column) | Backend only |
| LinkedIn Client ID + Secret | Railway environment variable | Backend only |
| LinkedIn Access Token | Supabase (AES-256 encrypted column) | Backend only |
| Canva API Key | Railway environment variable | Backend only |

### No Leakage Architecture

- **No credentials in frontend code.** The React build contains zero API keys.
- **No credentials in git.** All secrets live in environment variables, never in `.env` files committed to the repository.
- **No credentials in logs.** All logging middleware strips Authorization headers and token values before writing to logs.
- **Encrypted at rest.** OAuth tokens stored in Supabase use application-level AES-256 encryption on top of Supabase's native encryption.
- **Token rotation.** Meta and LinkedIn access tokens are refreshed automatically before expiry. Expired tokens disable posting gracefully — they do not crash the platform.
- **Scope minimisation.** OAuth apps request only the minimum permissions needed: `pages_manage_posts`, `instagram_content_publish`, `w_member_social`. Nothing broader.

### Platform Isolation

The marketing module is completely isolated from the core Syllabrix business logic:

- **Separate DB tables.** No marketing table has a foreign key relationship to any tenant business table (Business, User, Plan, etc.).
- **Separate Express router.** `/api/marketing/*` is its own router file mounted independently. A failure in the marketing router cannot propagate to `/api/businesses/*`, `/api/auth/*`, or any other route.
- **Separate React module.** `/platform/marketing/*` pages live in their own folder. No existing page imports anything from the marketing module.
- **Feature flag.** A single boolean in the `PlatformSettings` table (`marketingAgentEnabled`) disables the entire module instantly without a code deploy or restart.

### Failure Containment

| Failure Scenario | What Happens |
|---|---|
| Anthropic API is down | Content generation fails gracefully. Post stays in draft. Platform unaffected. |
| Meta API is down | Post stays in queue. Retried 3× with exponential backoff. Marked failed after 3 attempts. |
| LinkedIn API is down | Same queue + retry pattern. |
| Canva API is down | Post publishes as text-only. No crash, no delay. |
| Railway cron job misses | On next run, all overdue approved posts are processed. No double-posting (idempotency key per post). |
| Invalid/expired OAuth token | Posting pauses for that platform. Alert shown in Nerve Center. Platform keeps running. |

---

## 5. Database Models

All new tables. Zero modifications to existing schema.

### MarketingCampaign
```
id              String    @id
name            String
brief           String    — the plain-language instruction from the owner
targetAudience  String    — e.g. "gym owners", "clinic managers"
platforms       String[]  — ["facebook", "instagram", "linkedin"]
status          Enum      — DRAFT | ACTIVE | PAUSED | COMPLETED
startDate       DateTime
endDate         DateTime?
createdAt       DateTime
updatedAt       DateTime
```

### MarketingPost
```
id              String    @id
campaignId      String    → MarketingCampaign
platform        Enum      — FACEBOOK | INSTAGRAM | LINKEDIN
contentText     String    — generated post copy
hashtags        String[]
imageUrl        String?   — Canva-generated asset URL
videoUrl        String?   — Remotion-rendered video URL
scheduledFor    DateTime
status          Enum      — DRAFT | PENDING_REVIEW | APPROVED | QUEUED | PUBLISHED | FAILED
platformPostId  String?   — ID returned by Meta/LinkedIn after publishing
publishedAt     DateTime?
createdAt       DateTime
updatedAt       DateTime
```

### SocialAccount
```
id              String    @id
platform        Enum      — FACEBOOK | INSTAGRAM | LINKEDIN
accountName     String
accountId       String    — platform's page/profile ID
accessToken     String    — AES-256 encrypted
tokenExpiresAt  DateTime?
isActive        Boolean
connectedAt     DateTime
updatedAt       DateTime
```

### PostJob
```
id              String    @id
postId          String    → MarketingPost
status          Enum      — PENDING | PROCESSING | DONE | FAILED
attempts        Int       @default(0)
lastAttemptAt   DateTime?
failureReason   String?
idempotencyKey  String    @unique  — prevents double-posting
createdAt       DateTime
updatedAt       DateTime
```

### MarketingAnalytics
```
id              String    @id
postId          String    → MarketingPost
impressions     Int       @default(0)
reach           Int       @default(0)
likes           Int       @default(0)
comments        Int       @default(0)
shares          Int       @default(0)
linkClicks      Int       @default(0)
trialSignups    Int       @default(0)
fetchedAt       DateTime
```

---

## 6. API Routes

All under `/api/marketing/`. Isolated router, authenticated with existing platform admin middleware.

```
POST   /api/marketing/campaigns              — create campaign
GET    /api/marketing/campaigns              — list all campaigns
GET    /api/marketing/campaigns/:id          — get campaign + posts
PATCH  /api/marketing/campaigns/:id          — update campaign
DELETE /api/marketing/campaigns/:id          — delete campaign

POST   /api/marketing/generate              — call Claude, generate posts for campaign
GET    /api/marketing/posts                 — list all posts
PATCH  /api/marketing/posts/:id/approve     — approve post for publishing
PATCH  /api/marketing/posts/:id/reject      — reject + optionally regenerate
DELETE /api/marketing/posts/:id             — delete post

POST   /api/marketing/social/connect        — initiate OAuth for a platform
GET    /api/marketing/social/callback       — OAuth callback handler
GET    /api/marketing/social/accounts       — list connected accounts
DELETE /api/marketing/social/accounts/:id   — disconnect account

GET    /api/marketing/analytics             — aggregate performance data
GET    /api/marketing/analytics/:postId     — per-post analytics
POST   /api/marketing/analytics/sync        — pull latest data from Meta/LinkedIn

GET    /api/marketing/settings              — get feature flag + preferences
PATCH  /api/marketing/settings              — update settings (including on/off toggle)
```

---

## 7. Nerve Center Wing — UI Pages

New wing: **Marketing Command** — accessible at `/platform/marketing`

### Page 1: Dashboard (`/platform/marketing`)
- Overview cards: total posts published, total reach, trial signups attributed
- Upcoming scheduled posts (next 7 days)
- Platform connection status (FB, IG, LinkedIn — green/red indicators)
- Quick action: New Campaign

### Page 2: Campaigns (`/platform/marketing/campaigns`)
- List of all campaigns with status badges
- Campaign detail: brief, platforms, date range, post count
- Create / Edit / Pause / Archive actions

### Page 3: Content Studio (`/platform/marketing/studio`)
- Enter campaign brief in plain language
- Select target audience, platforms, tone
- Click Generate — Claude produces 3 posts (one per platform) simultaneously
- Side-by-side review: LinkedIn | Instagram | Facebook
- Inline edit any post before approving
- Approve all / Reject + regenerate

### Page 4: Post Calendar (`/platform/marketing/calendar`)
- Visual weekly/monthly calendar showing all scheduled posts
- Colour-coded by platform
- Drag to reschedule
- Click post to preview content + image

### Page 5: Asset Library (`/platform/marketing/assets`)
- All Canva-generated images and Remotion videos
- Filter by campaign, platform, date
- Re-use assets across posts

### Page 6: Analytics (`/platform/marketing/analytics`)
- Performance charts: reach over time, engagement rate, clicks, signups
- Best-performing posts ranked
- Platform comparison (which platform drives most trial signups)
- Weekly AI insight (Claude summarises what to do more of)

### Page 7: Connections (`/platform/marketing/connections`)
- Connect / Disconnect Facebook, Instagram, LinkedIn
- OAuth flow initiated from here
- Token health indicator (valid / expiring soon / expired)
- Reconnect button when token expires

---

## 8. Build Phases

### Phase 1 — Foundation
**Risk level:** Zero  
**External dependencies:** None  
**What gets built:**
- All 5 database models (Prisma migration)
- Marketing router skeleton (all routes return 200 with placeholder data)
- All 7 Nerve Center pages (UI shell, no live data yet)
- Feature flag wired to completely hide the wing when disabled
- Campaign CRUD fully functional (create, list, edit, delete)

**Completion test:** Full Nerve Center Marketing wing visible, campaigns can be created and managed, zero impact on any other platform feature.

---

### Phase 2 — Claude Content Generator
**Risk level:** Low (read-only external call, no posting)  
**External dependencies:** Anthropic API key  
**What gets built:**
- `/api/marketing/generate` endpoint calling Anthropic API
- Prompt engineering for platform-specific post generation
- Content Studio UI fully wired (brief → generate → review → approve)
- Post storage in DB with full status lifecycle

**Completion test:** Enter a brief, receive 3 posts (LinkedIn, Instagram, Facebook), approve them, verify they appear in the Post Calendar as QUEUED.

---

### Phase 3 — Meta API (Facebook + Instagram)
**Risk level:** Medium (live external posting)  
**External dependencies:** Meta Business App credentials, Facebook Page, Instagram Business Account  
**What gets built:**
- Meta OAuth flow (Connections page)
- Token storage (encrypted)
- PostJob queue processor (runs every 5 minutes via Railway cron)
- Meta Graph API posting for Facebook and Instagram
- Retry logic (3× with exponential backoff)
- Idempotency enforcement

**Pre-live test:** Connect a throwaway Facebook Page. Schedule 3 posts. Verify they publish correctly. Verify retry logic by temporarily using an invalid token.  
**Completion test:** Real posts appear on real Facebook Page and Instagram account at scheduled times.

---

### Phase 4 — LinkedIn API
**Risk level:** Medium (same pattern as Phase 3)  
**External dependencies:** LinkedIn Developer App credentials, LinkedIn Company Page  
**What gets built:**
- LinkedIn OAuth flow
- LinkedIn Share API posting
- Same queue + retry pattern as Phase 3

**Pre-live test:** Connect a test LinkedIn profile. Schedule 2 posts. Verify publishing.  
**Completion test:** Real posts appear on real LinkedIn Company Page at scheduled times.

---

### Phase 5 — Canva Graphics
**Risk level:** Low (isolated, graceful fallback built-in)  
**External dependencies:** Canva for Teams, Canva Connect API approval  
**What gets built:**
- Canva Connect API integration
- Syllabrix brand kit templates in Canva
- Auto-image generation triggered when post is generated
- Asset Library populated with all generated images
- Fallback: text-only post if Canva unavailable

**Completion test:** Generated posts include Canva-designed images. Disabling Canva key results in text-only posts (no crash, no error shown to end user).

---

### Phase 6 — Analytics Dashboard
**Risk level:** Low (read-only data fetching)  
**External dependencies:** None new (uses existing Meta + LinkedIn connections)  
**What gets built:**
- Analytics sync cron job (daily pull from Meta + LinkedIn APIs)
- MarketingAnalytics table population
- Analytics page charts fully wired
- Claude-generated weekly insight card

**Completion test:** After publishing 5+ posts, Analytics page shows real reach and engagement data. Weekly insight card generates a useful, accurate summary.

---

### Phase 7 — Promotional Videos
**Risk level:** Medium (new render pipeline)  
**External dependencies:** None new  
**What gets built:**
- Remotion project with 3–4 Syllabrix video templates (15s, 30s)
- Background render job on Railway backend
- Video upload to Meta and LinkedIn as native video posts
- Asset Library supports video previews

**Completion test:** Trigger a video render from the Nerve Center. Video renders within 2 minutes, appears in Asset Library, publishes to all platforms successfully.

---

## 9. External Accounts Required

The platform owner must set up the following before each phase. These are one-time steps.

| Account | Required for | Setup Location |
|---|---|---|
| Anthropic API account | Phase 2 | console.anthropic.com |
| Meta Business Suite (Facebook Page + Instagram Business) | Phase 3 | business.facebook.com |
| Meta Developer App with `pages_manage_posts`, `instagram_content_publish` permissions | Phase 3 | developers.facebook.com |
| LinkedIn Company Page | Phase 4 | linkedin.com/company |
| LinkedIn Developer App with `w_member_social` permission | Phase 4 | linkedin.com/developers |
| Canva for Teams + Canva Connect API | Phase 5 | canva.com/developers |

---

## 10. Environment Variable Map

All variables are set in Railway (Production) and Render (Quality). Never committed to git.

```
# Anthropic
ANTHROPIC_API_KEY=

# Meta (Facebook + Instagram)
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://yourdomain.com/api/marketing/social/callback/meta

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/marketing/social/callback/linkedin

# Canva
CANVA_API_KEY=
CANVA_CLIENT_ID=
CANVA_CLIENT_SECRET=

# Encryption (for storing OAuth tokens at rest)
MARKETING_ENCRYPTION_KEY=   ← 32-byte random hex, generated once, never changed
```

---

## 11. Cost Summary

| Service | Monthly Cost | Notes |
|---|---|---|
| Anthropic API | ~$1–2 | ~100 posts/month at ~$0.01/post |
| Meta Graph API | Free | No charge for organic posting |
| LinkedIn Share API | Free | No charge for organic posting |
| Canva Connect API | Free (API) | Canva for Teams: $13/user/month optional |
| Remotion rendering | ~$1–5 | Runs on existing Railway instance |
| Railway (backend) | Already paying | No new infrastructure |
| Supabase | Already paying | No new infrastructure |
| **Total new spend** | **~$2–20/month** | Depending on Canva tier |

---

## 12. What This Does Not Do

To be explicit about scope:

- **Does not touch tenant business data.** The marketing agent has no access to Business, User, Invoice, or any other business-type tables.
- **Does not post without approval (unless auto-approve is turned on).** Every generated post waits in PENDING_REVIEW state until the platform owner approves it in the Nerve Center.
- **Does not run paid advertising campaigns.** This is organic posting only. LinkedIn Ads API and Meta Ads API are out of scope.
- **Does not manage DMs or comments.** Automated comment responses are a future phase, not part of this build.
- **Does not share any tenant data with external APIs.** The only data sent to Claude, Canva, Meta, or LinkedIn is marketing content — never business names, user records, or financial data from the platform.

---

## 13. Rollback and Emergency Procedures

### Immediate Off Switch
Set `marketingAgentEnabled = false` in Nerve Center Settings. All scheduled jobs pause instantly. No posts go out. No code deploy required.

### Per-Platform Off Switch
Disconnect any social account from the Connections page. That platform stops receiving posts immediately. Other platforms continue unaffected.

### Nuclear Option
Delete all rows from the `PostJob` table. All queued posts are cancelled. Existing published posts are not affected (they are already live on social media and cannot be recalled from Syllabrix).

### If a Canva/Meta/LinkedIn credential is compromised
1. Revoke the token from the relevant developer dashboard immediately (outside Syllabrix)
2. Disconnect the account in Nerve Center Connections
3. Rotate the Railway environment variable if it is an API key
4. Reconnect with new credentials

---

*Document maintained by: Syllabrix Platform Team*  
*Next review: After Phase 3 completion*
