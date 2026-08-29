# Zenny Channel Adapter Architecture v2.0 — Multi-Tenant SaaS Connection Layer

**Document Version:** 2.0  
**Status:** Architecture Reference (Corrected for Multi-Tenant SaaS)  
**Last Updated:** 2026-08-29  
**Purpose:** Define how Zenny's multi-tenant SaaS customers self-connect messaging channels (WhatsApp, Instagram, Facebook, Web) to their AI agents, with per-client credential isolation and zero per-channel platform fees.  
**Audience:** Founders, AI coding agents, architecture reviewers  
**Constraint:** Architecture and integration design only. No implementation code.

---

## Table of Contents

1. [The Multi-Tenant Constraint](#1-the-multi-tenant-constraint)
2. [Design Principles](#2-design-principles)
3. [The Recommended Architecture](#3-the-recommended-architecture)
4. [Primary Solution: OpenBSP API (Self-Hosted)](#4-primary-solution-openbsp-api-self-hosted)
5. [Fallback Solution: Direct Meta Adapters (Build Your Own)](#5-fallback-solution-direct-meta-adapters-build-your-own)
6. [Channel-by-Channel Implementation](#6-channel-by-channel-implementation)
7. [Credential Storage & Security](#7-credential-storage--security)
8. [The "Click to Connect" UX Flow](#8-the-click-to-connect-ux-flow)
9. [Cost Analysis](#9-cost-analysis)
10. [Build Phases](#10-build-phases)
11. [Risk Assessment](#11-risk-assessment)
12. [Appendices](#12-appendices)

---

## 1. The Multi-Tenant Constraint

**The problem:** Zenny is a multi-tenant SaaS. Client A's WhatsApp Business Account, Client B's Instagram page, and Client C's Facebook page must all connect to the same Zenny infrastructure, with fully isolated credentials, and each client must be able to self-connect without engineering intervention.

**Why n8n native nodes don't work for this:**
- n8n's Telegram Trigger node requires a single bot token configured at the workflow level. For 100 clients with 100 different Telegram bots, you would need 100 separate workflow instances or complex dynamic credential switching that n8n doesn't natively support.
- n8n's IMAP Email node stores credentials in n8n's internal credential vault, not in Zenny's PostgreSQL, making per-client isolation and dashboard management impossible.
- n8n's native Meta channel nodes don't exist — there is no native WhatsApp Business API or Instagram DM node.

**What we need instead:**
- A **channel gateway service** that handles multi-tenant credential storage, OAuth flows, webhook routing, and token refresh.
- Zenny's runtime talks to this gateway via a clean REST API or webhooks.
- The gateway is either open-source (self-hosted, zero per-channel fees) or built directly against Meta's APIs (one-time setup, zero ongoing platform fees).

**Channels in priority order:**
1. **WhatsApp Business API** — highest demand, highest value
2. **Instagram DM** — secondary demand
3. **Facebook Messenger** — bundled with Instagram (same Meta ecosystem)
4. **Web Chat** — full control, trivial to build
5. **Email** — **ALREADY SOLVED** (Zenny's existing Gmail OAuth platform)
6. **Telegram** — **NOT A PRIORITY** for MVP

---

## 2. Design Principles

| Principle | Rationale |
|---|---|
| **Zero per-channel platform fees** | Paying $5–$50 per client per month to a third-party gateway (Umnico, 360dialog) destroys SaaS margins. At 100 clients, that's $500–$5,000/month in pure channel costs before Zenny earns a dollar. |
| **One Meta App, many clients** | Zenny creates ONE Facebook Developer App. All clients connect their WhatsApp/Instagram/Facebook accounts through this single app via OAuth. This is how Intercom, Zendesk, Freshdesk, and every major platform does it. |
| **Credentials live in Zenny's database** | Client tokens (access tokens, refresh tokens, WABA IDs, phone number IDs) are stored in Zenny's PostgreSQL, encrypted at rest. Zenny never delegates credential storage to a third party. |
| **Webhook routing by ID** | One webhook endpoint receives all messages from Meta. Zenny routes to the correct client by matching `phone_number_id` (WhatsApp) or `page_id` (Instagram/Facebook) against the `channel_credentials` table. |
| **Start with what exists** | Don't build Meta plumbing from scratch if an open-source project already solved it. Adapt and self-host. |
| **Email is done, Web is trivial** | Focus engineering effort on the hard channels (Meta). Web chat is a custom widget. Email uses Zenny's existing Gmail OAuth. |

---

## 3. The Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  CUSTOMER CHANNELS                                                  │
│  WhatsApp │ Instagram │ Facebook │ Web Chat │ Email (solved)       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  META CHANNEL GATEWAY                                               │
│  ├─ PRIMARY: OpenBSP API (self-hosted, open source)                │
│  │   → Handles WhatsApp + Instagram OAuth, webhooks, token refresh │
│  │   → Multi-tenant by design                                      │
│  │   → Built on Supabase + Postgres (same stack as Zenny)         │
│  └─ FALLBACK: Direct Meta Adapters (Zenny-built)                  │
│      → One Facebook App, Embedded Signup, webhook routing          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ZENNY RUNTIME                                                      │
│  ├─ n8n HTTP Request nodes (dynamic credentials from Supabase)     │
│  ├─ Message normalization → Standard Zenny payload                  │
│  └─ Multi-Node Agent Runtime (from Architecture v1.0)              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Primary Solution: OpenBSP API (Self-Hosted)

### 4.1 What is OpenBSP API?

OpenBSP API is an **open-source, multi-tenant messaging platform** built specifically for this exact use case. It connects to the official WhatsApp Cloud API and Instagram Graph API, stores messages in Supabase-backed PostgreSQL, and provides webhooks for external AI agents.

**Key facts:**
- **License:** Open source (GitHub: `matiasbattocchia/open-bsp-api`)
- **Stack:** Deno + PostgreSQL + Supabase (identical database stack to Zenny)
- **Multi-tenant:** Native support for multiple organizations with isolated environments
- **Meta-ready:** Built by a registered Meta Tech Provider. Uses official Meta APIs only.
- **WhatsApp:** Supports Embedded Signup (clients connect without leaving Zenny's dashboard)
- **Instagram:** Full Instagram Business API integration
- **AI-agent ready:** Designed to connect to external agents via webhooks
- **n8n integration:** Mentioned in documentation
- **Self-hostable:** Deploy on Zenny's existing Hetzner VPS or separate instance
- **Hosted option:** `web.openbsp.dev` — 5,000 messages/month free tier

### 4.2 Why OpenBSP is the Perfect Fit for Zenny

| Zenny Need | OpenBSP Provides |
|---|---|
| Multi-tenant SaaS | Native multi-tenant architecture with org isolation |
| Self-hosted, low cost | Open source, deploys on existing VPS |
| Official Meta APIs only | Registered Meta Tech Provider, no ban risk |
| Client self-connect (click to add) | Embedded Signup for WhatsApp, OAuth for Instagram |
| No per-channel fees | Self-hosted = $0 platform fees |
| Same database stack | Supabase + PostgreSQL — can even share the database instance |
| Webhook to external agent | Built-in webhook system for AI agent integration |
| No hired engineers needed | AI-assisted deployment, Docker-based |

### 4.3 How Zenny Uses OpenBSP

Zenny does **not** use OpenBSP's built-in AI agents or inbox UI. Zenny uses OpenBSP purely as a **multi-tenant channel gateway**:

```
Client clicks "Connect WhatsApp" in Zenny dashboard
        ↓
Zenny calls OpenBSP API → creates organization for client
        ↓
OpenBSP generates Embedded Signup URL
        ↓
Client completes Meta OAuth in popup (never leaves Zenny)
        ↓
OpenBSP stores WABA credentials, returns phone_number_id to Zenny
        ↓
Zenny stores phone_number_id + OpenBSP org credentials in Supabase
        ↓
Customer sends WhatsApp message
        ↓
Meta Cloud API → OpenBSP webhook → Zenny n8n webhook endpoint
        ↓
Zenny runtime processes → generates response
        ↓
Zenny calls OpenBSP API → send message → Meta → customer
```

### 4.4 OpenBSP Self-Host Deployment

**Infrastructure:**
- Deploy on Zenny's existing Hetzner CX32 VPS (8GB RAM) or a separate CX22 ($5/month)
- OpenBSP runs as Docker containers (Deno runtime + PostgreSQL)
- Can share Zenny's existing Supabase PostgreSQL instance (separate database/schema)
- No Redis required (unlike Chatwoot)

**Resource requirements:**
- CPU: 1 vCPU minimum
- RAM: 1GB minimum (2GB recommended)
- Disk: 20GB SSD
- Network: Public URL for Meta webhooks

**Cost:** $0 (uses existing VPS resources) or $5/month (dedicated VPS).

### 4.5 OpenBSP Limitations

- **Newer project:** Less battle-tested than Chatwoot (but built by a Meta Tech Provider)
- **Deno runtime:** Less familiar than Node.js for some AI coding agents (but Deno is straightforward)
- **Documentation:** May require reading source code for advanced customization
- **Community:** Smaller than Chatwoot's 50K+ installations

---

## 5. Fallback Solution: Direct Meta Adapters (Build Your Own)

If OpenBSP proves unsuitable, Zenny builds direct Meta adapters. This is the standard pattern used by Intercom, Zendesk, and every major SaaS platform.

### 5.1 The "One App, Many Clients" Pattern

**Core insight:** You need exactly ONE Facebook Developer App for Zenny. All clients connect their WhatsApp Business Accounts, Instagram accounts, and Facebook Pages through this single app.

**What you build once:**
1. Create Facebook Developer App
2. Add WhatsApp, Instagram, Messenger products
3. Complete Business Verification (one-time)
4. Submit for App Review (one-time, 1–4 weeks)
5. Build webhook endpoint: `zenny.com/webhooks/meta`
6. Build OAuth redirect handler
7. Build token refresh job (runs daily)

**What happens per client:**
1. Client clicks "Connect WhatsApp" in Zenny dashboard
2. Zenny redirects to Meta's Embedded Signup flow (Facebook SDK popup)
3. Client logs into Facebook, selects their WABA and phone number
4. Meta redirects back to Zenny with authorization code
5. Zenny exchanges code for long-lived access token
6. Zenny stores: `access_token`, `waba_id`, `phone_number_id`, `expires_at`
7. Zenny subscribes to webhooks for this phone number

**What happens on every message:**
1. Meta sends webhook to `zenny.com/webhooks/meta`
2. Payload contains `entry[0].changes[0].value.metadata.phone_number_id`
3. Zenny looks up `phone_number_id` in `channel_credentials` table → finds client
4. Zenny normalizes payload and injects into Multi-Node Runtime

### 5.2 Why This is Actually Feasible for a Solo Builder

**The hard part (Meta App Review) is one-time:**
- Business Verification: Submit business documents, wait 3–5 days
- App Review: Record a 2-minute screencast showing the Embedded Signup flow, submit, wait 1–4 weeks
- After approval: Never do it again. The app works for all clients forever.

**The technical part is simpler than it looks:**
- OAuth flow: Standard OAuth 2.0 — n8n HTTP Request nodes can handle the entire flow
- Webhook verification: Meta sends a GET with `hub.challenge` — respond with the same value. One n8n webhook node.
- Token refresh: Long-lived tokens last 60 days. A daily n8n scheduled workflow refreshes all tokens.
- Webhook routing: One `IF` node in n8n checks `phone_number_id` against a Supabase lookup.

**Timeline estimate:** 2–3 weeks for a solo AI-assisted builder.

### 5.3 Direct Build vs. OpenBSP Comparison

| Factor | OpenBSP (Self-Hosted) | Direct Meta Build |
|---|---|---|
| **Upfront build time** | 2–3 days (deploy + integrate) | 2–3 weeks (App Review + OAuth + webhooks) |
| **Ongoing maintenance** | Low (update Docker image periodically) | Low (token refresh job, monitor Meta API changes) |
| **Meta App Review** | Handled by OpenBSP | Zenny must do it once |
| **Cost** | $0 (self-hosted) | $0 (just Meta conversation fees) |
| **Flexibility** | Limited to OpenBSP's API surface | Full control over every API call |
| **Risk** | OpenBSP project could stall | Meta could change APIs (but they are stable) |
| **Data ownership** | Full (self-hosted) | Full |

---

## 6. Channel-by-Channel Implementation

### 6.1 WhatsApp Business API (Phase 1 — Week 1)

**Gateway:** OpenBSP API (self-hosted) or Direct Meta Cloud API

**Setup flow for business owner:**
1. Business owner clicks "Connect WhatsApp" in Zenny dashboard
2. Zenny creates an organization in OpenBSP (or initiates Embedded Signup directly)
3. Popup opens with Meta's Embedded Signup flow
4. Business owner selects their WhatsApp Business Account and phone number
5. Connection confirmed. Phone number is live.

**Credential storage in Zenny:**
```sql
-- channel_credentials table
INSERT INTO channel_credentials (
  organization_id,
  agent_id,
  channel_type,        -- 'whatsapp'
  provider,            -- 'openbsp' or 'meta_direct'
  external_id,         -- phone_number_id (e.g., "1234567890")
  access_token,        -- encrypted
  refresh_token,       -- encrypted (if applicable)
  waba_id,             -- WhatsApp Business Account ID
  expires_at,          -- token expiration
  status,              -- 'active', 'expired', 'disconnected'
  metadata             -- JSONB: {display_name: "Urban Wellness"}
) VALUES (...);
```

**Inbound:** Meta → OpenBSP → Zenny n8n webhook → normalize → runtime

**Outbound:** Zenny runtime → n8n HTTP Request → OpenBSP API `/messages` → Meta Cloud API → customer

**Meta conversation fees (unavoidable, paid to Meta regardless of gateway):**
- User-initiated: ~$0.005–$0.008 per 24-hour conversation window
- Business-initiated (template): ~$0.02–$0.08 per message (varies by region)

### 6.2 Instagram DM (Phase 2 — Week 2)

**Gateway:** OpenBSP API or Direct Meta Graph API

**Setup flow:**
1. Business owner clicks "Connect Instagram"
2. Zenny redirects to Meta OAuth (Login with Facebook)
3. Business owner grants `instagram_manage_messages` permission
4. Zenny stores: `page_access_token`, `instagram_account_id`, `page_id`

**Credential storage:** Same `channel_credentials` table, `channel_type = 'instagram'`

**Limitation:** 24-hour reply window. After 24h of no activity, only pre-approved template messages can be sent. Zenny's outbound adapter must check message age and fall back to template or prompt user to message again.

### 6.3 Facebook Messenger (Phase 2 — Week 2)

**Gateway:** Same as Instagram (shared Facebook App, shared OAuth)

**Setup flow:**
1. Business owner clicks "Connect Facebook"
2. Same OAuth flow as Instagram (bundled permissions)
3. Zenny stores: `page_access_token`, `page_id`

**Credential storage:** `channel_credentials` table, `channel_type = 'facebook'`

### 6.4 Web Chat (Phase 1 — Week 1)

**Gateway:** None needed. Custom-built.

**Setup flow:**
1. Business owner copies JavaScript snippet from Zenny dashboard
2. Pastes into website `<head>`
3. Widget connects to Zenny webhook endpoint

**Implementation:**
- Frontend: Next.js embeddable widget (iframe or inline)
- Transport: HTTP POST to n8n webhook (sync response for instant reply)
- Authentication: Widget initialized with `agent_id` + `org_id` (public identifiers)
- Features v1: Text, file upload, typing indicator, conversation history
- Features v2: Buttons, cards (rendered based on agent response metadata)

**No credential storage needed** — web chat is unauthenticated public access.

### 6.5 Email (Already Solved)

**Gateway:** Zenny's existing Gmail OAuth platform

**No action needed** — already built, already working.

### 6.6 Telegram (Deferred — Not Priority)

**Gateway:** Direct Bot API (no third party needed)

**Why deferred:**
- Not requested by current clients
- Bot API is free and simple, but requires one bot token per client
- Can be added later with minimal effort (standard Bot API, no App Review)
- If needed: Store `bot_token` in `channel_credentials`, use n8n HTTP Request nodes (not native Telegram node, for multi-tenant credential switching)

---

## 7. Credential Storage & Security

### 7.1 The `channel_credentials` Table

```sql
CREATE TABLE channel_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),  -- nullable = org-wide channel

  channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN (
    'whatsapp', 'instagram', 'facebook', 'telegram', 'email', 'web'
  )),

  provider VARCHAR(20) NOT NULL CHECK (provider IN (
    'openbsp', 'meta_direct', 'gmail_oauth', 'telegram_bot', 'zenny_web'
  )),

  -- The public identifier used for webhook routing
  external_id VARCHAR(255) NOT NULL,  -- phone_number_id | page_id | bot_username | email_address

  -- Encrypted tokens (never plaintext, never exposed to LLM)
  access_token TEXT NOT NULL,         -- AES-256 encrypted
  refresh_token TEXT,                 -- AES-256 encrypted

  -- Meta-specific fields
  waba_id VARCHAR(255),               -- WhatsApp Business Account ID
  page_id VARCHAR(255),               -- Facebook Page ID

  -- Token lifecycle
  expires_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ DEFAULT now(),

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disconnected', 'error')),
  error_message TEXT,

  -- Display info
  display_name VARCHAR(255),          -- "Urban Wellness WhatsApp"
  metadata JSONB DEFAULT '{}'::jsonb, -- provider-specific extras

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, channel_type, external_id)
);

-- Index for fast webhook routing
CREATE INDEX idx_channel_credentials_external_id ON channel_credentials(external_id);
CREATE INDEX idx_channel_credentials_org_channel ON channel_credentials(organization_id, channel_type);
```

### 7.2 Encryption

- **Algorithm:** AES-256-GCM
- **Key storage:** Master encryption key stored in n8n environment variables (ENV scope, never in database, never exposed to LLM)
- **Encryption location:** n8n Function node encrypts tokens before writing to PostgreSQL
- **Decryption location:** n8n Function node decrypts tokens after reading from PostgreSQL, immediately before making API calls
- **Never:** Store tokens in plain text, log tokens, pass tokens to LLM context

### 7.3 Token Refresh

**Daily scheduled n8n workflow:**
1. Query `channel_credentials` where `expires_at < NOW() + INTERVAL '7 days'`
2. For each token nearing expiration:
   - Decrypt refresh_token
   - Call Meta's `POST /oauth/access_token?grant_type=fb_exchange_token` (or OpenBSP's refresh endpoint)
   - Encrypt new access_token
   - Update `expires_at`, `last_refreshed_at`
3. Log failures to `channel_credentials.error_message`

---

## 8. The "Click to Connect" UX Flow

### 8.1 WhatsApp via OpenBSP

```
Zenny Dashboard → "Channels" tab → "Connect WhatsApp"
    ↓
Zenny backend calls OpenBSP API: POST /organizations
    ↓
OpenBSP returns org_id + embedded_signup_url
    ↓
Zenny opens popup: window.open(embedded_signup_url, 'MetaSignup', 'width=600,height=700')
    ↓
Business owner:
  1. Logs into Facebook
  2. Selects/creates WhatsApp Business Account
  3. Selects/verifies phone number
  4. Grants permissions
    ↓
Meta redirects to Zenny callback URL with authorization code
    ↓
Zenny exchanges code for tokens → stores encrypted in channel_credentials
    ↓
Dashboard shows: "✓ WhatsApp connected — +1 (234) 567-8901"
```

### 8.2 Instagram via OpenBSP

```
Zenny Dashboard → "Channels" tab → "Connect Instagram"
    ↓
Zenny backend calls OpenBSP API: POST /organizations/{id}/instagram/connect
    ↓
OpenBSP returns OAuth URL
    ↓
Zenny redirects to Meta OAuth: scope=instagram_manage_messages,pages_messaging
    ↓
Business owner grants permissions
    ↓
Meta redirects to Zenny callback with code
    ↓
Zenny exchanges code → stores tokens → shows "✓ Instagram connected"
```

### 8.3 Web Chat

```
Zenny Dashboard → "Channels" tab → "Web Chat"
    ↓
Zenny generates unique snippet:
    <script src="https://zenny.ai/widget.js" 
            data-org-id="uuid" 
            data-agent-id="uuid"></script>
    ↓
Business owner copies snippet → pastes into website HTML
    ↓
Widget appears on site, connected to agent
    ↓
No credentials needed — public access
```

---

## 9. Cost Analysis

### 9.1 Monthly Costs by Scale

| Cost Item | 10 Clients | 50 Clients | 100 Clients |
|---|---|---|---|
| **OpenBSP self-hosted** | $0 (shared VPS) | $0 (shared VPS) | $0 (shared VPS) |
| **Meta conversation fees** (WhatsApp) | ~$15–$30 | ~$75–$150 | ~$150–$300 |
| **Infrastructure** (Vercel + Supabase + n8n VPS) | ~$50 | ~$50 | ~$75 |
| **Email** (Resend) | $0 (3K free) | $0 (3K free) | ~$10 |
| **TOTAL** | **~$65–$80** | **~$125–$200** | **~$235–$385** |

### 9.2 What Zenny Avoids

| Service | Their Cost | At 100 Clients | Zenny's Alternative |
|---|---|---|---|
| **Umnico** | $5.20/channel/month | $520/month | OpenBSP self-hosted: **$0** |
| **360dialog Partner** | €250–€1,000/month + €15–€49/channel | €1,750–€5,900/month | OpenBSP or Direct Meta: **$0** |
| **Twilio WhatsApp** | $0.005/message + Meta fees | ~$250–$500/month | Direct Meta Cloud API: **Meta fees only** |
| **Wati** | ~$40/number/month | $4,000/month | OpenBSP or Direct Meta: **$0** |

**Savings at 100 clients: $4,000–$6,000/month vs. paid gateways.**

### 9.3 The Economics of Building vs. Renting

**Renting (Umnico/360dialog):**
- Month 1–12 at 100 clients: $4,000–$6,000/month × 12 = **$48,000–$72,000/year**
- Forever: Scales linearly with client count

**Building (OpenBSP or Direct Meta):**
- Upfront: 2–3 weeks of AI-assisted coding
- Ongoing: $0 platform fees + Meta conversation fees only
- Year 1 at 100 clients: ~$3,000 in Meta fees + $600 infrastructure = **~$3,600/year**
- **Savings Year 1: $44,000–$68,000**

---

## 10. Build Phases

### Phase 1: Core Channels (Weeks 1–2)

**Goal:** Web chat + WhatsApp working end-to-end with one real client.

| Step | Task | Deliverable |
|---|---|---|
| 1.1 | Deploy OpenBSP API (self-hosted) or initiate Direct Meta App creation | Working gateway |
| 1.2 | Build `channel_credentials` table with encryption | Secure credential storage |
| 1.3 | Build WhatsApp "Connect" flow (Embedded Signup popup) | Business owner can self-connect |
| 1.4 | Build Meta webhook endpoint (`/webhooks/meta`) | Receives all Meta events |
| 1.5 | Build webhook router (match phone_number_id → client → agent) | Correct routing test |
| 1.6 | Build outbound sender (n8n HTTP Request → OpenBSP/Meta API) | Message delivery test |
| 1.7 | Build web chat widget (Next.js embeddable) | Working widget on Carmelli's site |
| 1.8 | Build web chat adapter (webhook → normalize → runtime) | Sub-workflow |
| 1.9 | **Milestone: Customer chats via Web or WhatsApp** | Live test |

### Phase 2: Instagram + Facebook (Week 3)

**Goal:** Instagram DM and Facebook Messenger connected.

| Step | Task | Deliverable |
|---|---|---|
| 2.1 | Build Instagram "Connect" flow (OAuth redirect) | Self-connect working |
| 2.2 | Build Facebook "Connect" flow (bundled with Instagram OAuth) | Self-connect working |
| 2.3 | Extend webhook router (match page_id → client) | Correct routing test |
| 2.4 | Handle 24h reply window constraint (template fallback) | Logic in outbound adapter |
| 2.5 | **Milestone: All three Meta channels working** | Live test |

### Phase 3: Polish + Scale (Week 4+)

| Step | Task | Deliverable |
|---|---|---|
| 3.1 | Token refresh automation (daily scheduled workflow) | No expired tokens |
| 3.2 | Channel health monitoring (connection status dashboard) | Business owner sees "✓ Connected" or "⚠ Disconnected" |
| 3.3 | Reconnection flow (token expired → prompt re-auth) | One-click re-connect |
| 3.4 | Multi-channel routing (same customer on WhatsApp + Web → unified conversation) | Conversation merging logic |
| 3.5 | **Milestone: Channel layer is invisible to the runtime** | Runtime never knows which channel a message came from |

---

## 11. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **OpenBSP project stalls or breaks** | Low | High | Fallback to Direct Meta build (2–3 weeks). Architecture is adapter-based; swapping the gateway requires changing only the outbound API calls and webhook parser. |
| **Meta App Review rejects Zenny's app** | Low | Critical | If using Direct Meta build, ensure compliance with Meta's Platform Terms before submission. Use OpenBSP to avoid this risk entirely (they handle App Review). |
| **Meta changes webhook format** | Low | Medium | Webhook parser is a single n8n Function node. Changes are localized. OpenBSP abstracts this away. |
| **Client's WhatsApp number gets banned** | Very Low | High | **Policy:** Official Meta APIs only. Never use unofficial methods. Ban risk is near-zero with Cloud API. |
| **Token refresh fails for many clients** | Low | Medium | Daily refresh job with Slack/email alerts on failures. Dashboard shows "⚠ Reconnect needed" for expired tokens. |
| **Webhook endpoint overwhelmed** | Very Low | Medium | n8n can handle thousands of webhooks per minute. If overloaded, add a queue (Supabase realtime or n8n's built-in queue mode). |
| **Instagram 24h window confuses users** | Medium | Low | Outbound adapter checks message age. If > 24h, sends template or asks user to message again. Documented in agent instructions. |
| **Credential encryption key leaked** | Very Low | Critical | Master key stored only in n8n ENV variables. Never in code, never in database, never in logs. Rotate key quarterly. |
| **OpenBSP too heavy for VPS** | Low | Medium | OpenBSP is lightweight (Deno + Postgres). If overloaded, migrate to dedicated CX32 ($10/month). |

---

## 12. Appendices

### Appendix A: Glossary

| Term | Definition |
|---|---|
| **BSP** | Business Solution Provider — Meta-certified company authorized to provide WhatsApp Business API access. |
| **Channel Credential** | The encrypted access token, refresh token, and identifiers stored in Zenny's database for a client's connected channel. |
| **Embedded Signup** | Meta's official flow where a business connects their WhatsApp Business Account to a third-party platform without leaving the platform's UI. |
| **Meta App Review** | Meta's approval process for third-party apps requesting advanced permissions. Requires screencasts and use-case documentation. |
| **Multi-tenant** | A SaaS architecture where a single instance serves multiple isolated customers (tenants), each with their own data and configuration. |
| **OpenBSP** | Open-source Business Solution Platform — a self-hostable, multi-tenant messaging gateway for WhatsApp and Instagram. |
| **WABA** | WhatsApp Business Account — the container for one or more WhatsApp phone numbers used for business messaging. |
| **Webhook Router** | The logic that inspects an incoming webhook payload (e.g., by `phone_number_id`) and routes it to the correct tenant's agent. |

### Appendix B: Decision Log

| Decision | Chosen | Rejected | Rationale |
|---|---|---|---|
| **Meta channel gateway (MVP)** | OpenBSP API (self-hosted, open source) | Umnico ($5.20/channel), 360dialog (€250+/mo), Twilio (per-message fees) | Zero per-channel fees. Same Supabase stack. Multi-tenant by design. |
| **Meta channel gateway (fallback)** | Direct Meta build (one app, many clients) | Pay-per-channel services forever | Full control, zero platform fees, standard SaaS pattern. |
| **Credential storage** | Zenny PostgreSQL (AES-256 encrypted) | n8n native credential vault, third-party storage | Per-client isolation, dashboard visibility, full ownership. |
| **n8n native nodes for channels** | Rejected for multi-tenant | Use native Telegram/Email nodes | Native nodes don't support dynamic credential switching per client. Use HTTP Request nodes instead. |
| **Telegram** | Deferred (not priority) | Build in MVP | No client demand yet. Bot API is simple to add later. |
| **Email** | Already solved (Gmail OAuth) | Build new email adapter | Zenny's existing platform handles this. No action needed. |
| **Web chat** | Custom Next.js widget | Third-party widget | Full control over UI, buttons, cards, branding. Trivial to build. |
| **App Review responsibility** | OpenBSP handles it | Zenny handles it | Avoids 1–4 week delay and compliance risk for MVP. |

### Appendix C: Reference Architectures Studied

| Platform | What Zenny learned | What Zenny does differently |
|---|---|---|
| **Convocore** | One-click channel connection UX, built-in OAuth | Zenny uses OpenBSP for the hard channels instead of building its own OAuth UI. |
| **OpenBSP API** | Multi-tenant messaging gateway, official Meta APIs, Supabase stack | Zenny uses OpenBSP as a black-box gateway, not as an inbox or agent platform. |
| **360dialog Partner** | WhatsApp reseller program pricing, multi-customer architecture | Zenny avoids €250+/month fees by using open-source or direct build. |
| **Chatwoot CE** | Multi-account support, Platform API for provisioning | Zenny uses OpenBSP instead (lighter stack, same multi-tenancy). |
| **Meta Tech Provider docs** | Embedded signup flow, webhook verification, token refresh | Zenny delegates this to OpenBSP or implements it directly as a fallback. |

### Appendix D: The "One App, Many Clients" Pattern (Direct Build Detail)

**If Zenny builds direct Meta adapters, this is the exact architecture:**

```
Facebook Developer App: "Zenny AI"
  ├─ WhatsApp Product
  │   └─ Webhook URL: https://zenny.ai/webhooks/meta
  ├─ Instagram Product
  │   └─ Webhook URL: https://zenny.ai/webhooks/meta
  └─ Messenger Product
      └─ Webhook URL: https://zenny.ai/webhooks/meta

Client A (Urban Wellness):
  ├─ WhatsApp: phone_number_id = "12345", access_token = "..."
  ├─ Instagram: page_id = "67890", access_token = "..."
  └─ Facebook: page_id = "67890", access_token = "..."

Client B (Carmelli):
  ├─ WhatsApp: phone_number_id = "54321", access_token = "..."
  └─ Instagram: page_id = "09876", access_token = "..."

Webhook payload arrives:
  entry[0].changes[0].value.metadata.phone_number_id = "12345"
  → Lookup: SELECT * FROM channel_credentials WHERE external_id = '12345'
  → Found: Client A (Urban Wellness), agent_id = "..."
  → Route to Urban Wellness's agent runtime
```

**Why this works:**
- Meta sends the `phone_number_id` or `page_id` in every webhook payload.
- These IDs are globally unique across all of Meta.
- Zenny stores the mapping from `external_id` → `organization_id` → `agent_id`.
- Routing is a single database lookup. No complex logic needed.

---

## Document Changelog

- **v1.0 (2026-08-29)** — Initial channel adapter architecture. Proposed hybrid approach with Umnico for Meta channels.
- **v2.0 (2026-08-29)** — **Major correction.** Recognized multi-tenant SaaS constraint makes n8n native nodes and per-channel third-party APIs (Umnico, 360dialog) economically unviable. Replaced with OpenBSP API (open-source, self-hosted, multi-tenant, zero per-channel fees) as primary solution, with direct Meta build as fallback. Removed Telegram and Email from scope (deferred / already solved).

---

*End of Document*
