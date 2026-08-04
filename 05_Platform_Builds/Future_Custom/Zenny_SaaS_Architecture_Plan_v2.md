# Zenny SaaS Architecture Plan — Updated v2.0
## Phase 2 Foundation — LangGraph Runtime

> **Document Version:** 2.0  
> **Last Updated:** 2026-07-10  
> **Status:** Architecture-First Build (AI-Assisted, No Hired Engineers)  
> **Build Methodology:** Multi-Agent Reasoning Review → Architecture Lock → AI Coding Agent Handoff

---

## 1. Purpose & Vision

### Original Vision (Retained)
Replace third-party conversation platforms (Voiceflow/Convocore) with Zenny's own AI employee runtime while keeping the existing architecture philosophy.

**Core Principle (Unchanged):**  
> Do not build a Voiceflow clone. Build an AI Workforce Operating System.

### Updated Build Philosophy
Move from ad-hoc AI coding to **architecture-first development**. The architecture specification is the single source of truth. No coding agent may deviate without human arbitration and re-validation.

**Final Goal (Unchanged):**
> Move from: 100 clients = 100 chatbot projects  
> To: 100 clients = 100 database configurations running on one Zenny AI engine.

---

## 2. Current vs. Future Architecture

| Layer | Current (Legacy) | Future (Zenny Runtime) |
|-------|-----------------|------------------------|
| Channels | WhatsApp, Web, etc. | Same |
| Conversation Engine | Voiceflow / Convocore | **Zenny LangGraph Runtime** |
| Automation | n8n | **n8n (retained as execution layer)** |
| Database | Generic | **PostgreSQL (Supabase)** |
| Dashboard | Existing | **Zenny Dashboard (Next.js)** |

---

## 3. Technology Stack

### 3.1 Frontend

| Component | Original Choice | Current Preference | Reasoning |
|-----------|---------------|-------------------|-----------|
| Framework | Next.js | **Next.js (retained)** | React Server Components, API routes, unmatched ecosystem |
| Styling | Tailwind CSS | **Tailwind CSS (retained)** | Rapid UI development, AI coding agents write it fluently |
| Hosting | Vercel | **Vercel Pro (retained)** | Zero-config Next.js deploy. **Note:** Hobby plan prohibits commercial use; Pro required at $20/seat/month. Enterprise cliff at ~$20K/year — evaluate Cloudflare Pages migration at 10K+ users |

### 3.2 Backend

| Component | Original Choice | Current Preference | Reasoning |
|-----------|---------------|-------------------|-----------|
| API Framework | Python FastAPI | **Python FastAPI (retained)** | Async-native, OpenAPI auto-generation, LangGraph-compatible |
| AI Runtime | LangGraph | **LangGraph (retained)** | Most production-hardened for stateful conversation systems (34.5M monthly PyPI downloads, used by Klarma, Uber, LinkedIn, JPMorgan). Stateful workflows, human-in-the-loop, audit trails. **Caveat:** Lock versions in `requirements.txt`; LangChain ecosystem has frequent API changes |
| Alternative Considered | — | **Pydantic AI V2** | Switch only if architecture review unanimously confirms conversation logic is linear (no complex branching). Lower verbosity, better type safety, but weaker on state machine complexity. **Decision:** Retain LangGraph unless review overrides |

### 3.3 Database

| Component | Original Choice | Current Preference | Reasoning |
|-----------|---------------|-------------------|-----------|
| Primary DB | PostgreSQL (Supabase) | **Supabase (retained)** | Auth + DB + Storage + Realtime in one platform. pgvector built-in. Row Level Security critical for multi-tenancy. Free tier: 500MB DB, 50K auth users. Pro at $25/month |
| Alternative Considered | — | **Neon** | Serverless Postgres with branching. Cheaper at $19 Pro. **Decision:** Retain Supabase for integrated auth and storage; Neon only if branching becomes critical |
| Vector Search | pgvector | **pgvector via Supabase (retained)** | No separate Pinecone/Weaviate cost. Included in Supabase |

### 3.4 Memory Architecture

| Component | Original Choice | Current Preference | Reasoning |
|-----------|---------------|-------------------|-----------|
| Short-term State | Redis | **Upstash Redis (updated)** | Serverless, zero operational overhead. Free tier: 10K requests/day, 256MB. Pay-per-request scaling. Compatible with LangGraph Redis checkpointer. **Critical:** Self-hosted Redis on VPS adds failure mode we cannot manage without engineers |
| Long-term Memory | PostgreSQL | **Supabase PostgreSQL (retained)** | Persistent conversation history, agent configurations, analytics. Already in stack |
| Alternative Considered | — | **Dragonfly / KeyDB** | Multi-threaded Redis alternatives. **Decision:** Not applicable — serverless beats self-hosted for our constraints |

### 3.5 Automation Layer

| Component | Original Choice | Current Preference | Reasoning |
|-----------|---------------|-------------------|-----------|
| Execution Engine | n8n | **n8n (retained)** | No better alternative at this price point. LangGraph thinks; n8n executes. CRM sync, calendar, notifications, recovery workflows, email workflows |
| n8n Hosting | VPS | **Hetzner CX22 VPS (specified)** | ~$5/month. Unbeatable price/performance. Persistent disk for workflow definitions. Docker-friendly. Official n8n image deploys cleanly |

### 3.6 Backend Hosting

| Component | Original Choice | Current Preference | Reasoning |
|-----------|---------------|-------------------|-----------|
| Hosting Platform | Railway / Render / Fly.io (undecided) | **Railway Hobby for MVP → Fly.io for Production (updated)** | Railway: fastest deploy, best DX, visual logs dashboard, $5 Hobby plan. Fly.io: cheapest per-compute at scale ($2–$7 start, $10–$30 at 1K users), global regions, micro-VMs. **Migration path:** Start Railway for rapid iteration; migrate to Fly.io when revenue justifies |
| Alternative Considered | — | **Render** | Free static sites, predictable billing. **Decision:** Railway wins on deploy speed for AI-assisted iteration |
| Alternative Considered | — | **Hetzner VPS for backend** | Cheapest raw compute. **Decision:** Rejected — adds SSL, logs, backups, scaling management we cannot handle without engineers |

### 3.7 Communication & Monitoring (Added)

| Component | Original Choice | Current Preference | Reasoning |
|-----------|---------------|-------------------|-----------|
| Transactional Email | — (not specified) | **Resend (added)** | 3,000 emails/month free. React Email templates. Required for password resets, notifications, billing alerts. Integrates with Next.js natively |
| Error Tracking | — (not specified) | **Sentry Free Tier (added)** | 5K errors/month free. Catch production errors before customers do. Essential for AI-assisted builds where debugging is human-bottlenecked |
| AI Runtime Tracing | — (not specified) | **LangSmith (deferred to Phase 2B)** | LangGraph step-by-step tracing. Free tier limited. Add when deep debugging needed |

---

## 4. LangGraph Runtime Flow (Unchanged Architecture)

```
Customer Message
      ↓
Load Agent Config (from PostgreSQL)
      ↓
Load Conversation Memory (Redis short-term + PostgreSQL long-term)
      ↓
Intent Detection (LLM call)
      ↓
Select Archetype Playbook (Emergency / Consultation / etc.)
      ↓
RAG Knowledge Search (pgvector)
      ↓
Tool Execution (n8n webhook or direct tool)
      ↓
Generate Response (LLM call with context)
      ↓
Save Memory (Redis + PostgreSQL)
      ↓
Send Response (Channel adapter)
```

**Critical Integration Contract (Added):**

| Aspect | Specification |
|--------|-------------|
| Trigger Direction | LangGraph → n8n via HTTP webhook |
| Payload Format | JSON: `{org_id, agent_id, action_type, parameters, timestamp, idempotency_key}` |
| Response Contract | n8n returns `{status: "success"|"error", data: {}, error: "", retryable: boolean}` within 10s timeout |
| Failure Mode | LangGraph retries twice with exponential backoff, then escalates to human queue |
| Idempotency | All n8n workflows must be idempotent — same payload yields same result |
| Authentication | HMAC-SHA256 signature on payload, verified by n8n |

---

## 5. Multi-Tenant Data Model (Unchanged)

### Schema Overview

```sql
-- Organizations (tenant root)
organizations
  - id (UUID, PK)
  - name (text)
  - plan (enum: free, pro, enterprise)
  - created_at (timestamp)
  - settings (jsonb)

-- Users (within organization)
users
  - id (UUID, PK)
  - organization_id (UUID, FK → organizations.id)
  - email (text, unique)
  - role (enum: admin, manager, agent)
  - created_at (timestamp)

-- Agents (AI employees)
agents
  - id (UUID, PK)
  - organization_id (UUID, FK → organizations.id)
  - name (text)
  - archetype (enum: emergency, consultation, support, sales)
  - configuration (jsonb) -- playbook settings, freedom level, tools
  - knowledge_base_ids (UUID[])
  - is_active (boolean)
  - created_at (timestamp)

-- Conversations
conversations
  - id (UUID, PK)
  - agent_id (UUID, FK → agents.id)
  - organization_id (UUID, FK → organizations.id) -- denormalized for RLS
  - channel (enum: web, whatsapp, sms, email)
  - external_id (text) -- channel-specific thread ID
  - status (enum: active, closed, escalated)
  - metadata (jsonb)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Messages
messages
  - id (UUID, PK)
  - conversation_id (UUID, FK → conversations.id)
  - role (enum: system, user, assistant, tool)
  - content (text)
  - tool_calls (jsonb)
  - tool_results (jsonb)
  - latency_ms (integer)
  - token_count (integer)
  - created_at (timestamp)

-- Knowledge Base
knowledge_chunks
  - id (UUID, PK)
  - organization_id (UUID, FK → organizations.id)
  - agent_id (UUID, FK → agents.id, nullable) -- null = org-wide
  - source_type (enum: file, url, manual)
  - source_id (UUID)
  - content (text)
  - embedding (vector(1536)) -- OpenAI text-embedding-3-small
  - metadata (jsonb)
  - created_at (timestamp)

-- Leads & Conversions
leads
  - id (UUID, PK)
  - organization_id (UUID, FK)
  - conversation_id (UUID, FK, nullable)
  - source (text)
  - contact_info (jsonb)
  - qualification_score (integer)
  - status (enum: new, qualified, converted, lost)
  - assigned_to (UUID, FK → users.id, nullable)
  - created_at (timestamp)

conversions
  - id (UUID, PK)
  - organization_id (UUID, FK)
  - lead_id (UUID, FK → leads.id)
  - agent_id (UUID, FK → agents.id)
  - value (decimal)
  - conversion_type (text)
  - metadata (jsonb)
  - created_at (timestamp)

-- Metrics (aggregated)
metrics
  - id (UUID, PK)
  - organization_id (UUID, FK)
  - agent_id (UUID, FK, nullable)
  - metric_type (enum: response_time, satisfaction, conversion_rate, token_usage)
  - value (decimal)
  - period (enum: hourly, daily, weekly, monthly)
  - period_start (timestamp)
  - created_at (timestamp)
```

### Row Level Security (RLS) Policies (Critical Addition)

Every table with `organization_id` must enforce:

```sql
-- Example: conversations table
CREATE POLICY "tenant_isolation" ON conversations
  FOR ALL
  USING (organization_id = current_setting('app.current_org_id')::UUID);

-- Set org_id per request via PostgreSQL SET command
-- Propagated from JWT token (Supabase Auth) → FastAPI middleware → PostgreSQL session
```

**Architecture Review Checkpoint:** All three reasoning agents (Claude, GPT, Kimi) must validate RLS completeness before coding handoff.

---

## 6. Agent Configuration Philosophy (Unchanged)

> **One engine. Many configurations.**

| Agent Type | Freedom Level | Focus | Configuration Keys |
|------------|--------------|-------|-------------------|
| **Emergency Agent** | Low | Dispatcher style, booking-focused | `max_tools: 3`, `require_confirmation: true`, `playbook: emergency_dispatch` |
| **Consultation Agent** | High | Discovery-focused, qualification-driven | `max_tools: 10`, `require_confirmation: false`, `playbook: consultation_discovery` |
| **Support Agent** | Medium | Resolution-focused, escalation-aware | `max_tools: 7`, `escalation_threshold: 0.7`, `playbook: support_resolution` |
| **Sales Agent** | High | Conversion-focused, objection handling | `max_tools: 8`, `follow_up_enabled: true`, `playbook: sales_closing` |

Archetypes are **database configurations**, not code branches. Adding a new archetype = inserting a row + JSON config. No deployment required.

---

## 7. n8n Responsibility & Integration (Refined)

### n8n Retained Workflows

| Category | Workflows | Trigger From LangGraph |
|----------|-----------|----------------------|
| CRM Sync | Create/update contact, deal, activity | `action_type: "crm_sync"` |
| Calendar | Check availability, create appointment | `action_type: "calendar_book"` |
| Notifications | SMS alert, email to human, Slack | `action_type: "notify"` |
| Recovery | Failed payment retry, no-show follow-up | `action_type: "recovery"` |
| Email | Send transcript, follow-up sequence | `action_type: "email_send"` |
| External APIs | Custom client integrations | `action_type: "external_api"` |

### n8n Workflow Requirements (Added)

1. **Idempotency:** All workflows must handle duplicate webhook calls gracefully
2. **Timeout:** Maximum 30s execution; LangGraph timeout is 10s
3. **Error Response:** Structured JSON with `retryable` flag
4. **Logging:** All executions logged to Supabase `n8n_execution_logs` table
5. **Secrets:** API keys stored in n8n credentials, never in workflow JSON

---

## 8. Build Phases (Updated with Architecture-First Methodology)

### Phase 0: Architecture Specification (NEW — 2–3 weeks)

**Before any code is written.**

| Step | Deliverable | Owner |
|------|-------------|-------|
| 0.1 | Draft Technical Specification (data flows, API contracts, state machine, schema, RLS policies, error handling, rate limits) | You |
| 0.2 | Claude Opus Review — logical inconsistencies, missing edge cases | Claude Opus |
| 0.3 | GPT-5 Review — integration anti-patterns, API contract gaps | GPT-5 |
| 0.4 | Kimi Review — contradictions with business plan, schema mismatches | Kimi |
| 0.5 | Human Synthesis — resolve conflicts, finalize spec | You |
| 0.6 | Final Validation — all three agents review resolved version | All |
| 0.7 | **ARCHITECTURE LOCK** — spec is frozen, versioned, signed off | You |

**Architecture Lock Rule:** No coding agent may deviate from the spec. If a coding agent discovers the spec is wrong, work stops. You update the spec, re-run adversarial review (Step 0.2–0.6), then resume coding.

### Phase 2A: LangGraph Runtime (4–6 months)

| Step | Module | Coding Agent | Validation |
|------|--------|--------------|------------|
| 2A.1 | Database schema + migrations + RLS policies | Claude Code / Codex | Sentry error tracking active |
| 2A.2 | Supabase Auth integration (org-scoped) | Claude Code / Codex | Manual test: multi-tenant isolation |
| 2A.3 | Upstash Redis checkpointer for LangGraph | Claude Code / Codex | Integration test: state persistence |
| 2A.4 | LangGraph state machine (single archetype: Consultation) | Claude Code / Codex | Architecture spec compliance check |
| 2A.5 | RAG pipeline (chunking, embedding, pgvector retrieval) | Claude Code / Codex | Benchmark: relevance score > 0.7 |
| 2A.6 | n8n webhook client + error handling | Claude Code / Codex | Contract test: payload shape, timeout, retry |
| 2A.7 | Channel adapter (Web chat only) | Claude Code / Codex | End-to-end conversation test |
| 2A.8 | FastAPI routes + middleware (org_id injection) | Claude Code / Codex | Security audit: RLS bypass attempts |
| 2A.9 | Integration testing (all modules) | You + AI | Architecture spec traceability matrix |
| 2A.10 | **Milestone: Single archetype, single channel, working end-to-end** | — | Demo to first pilot customer |

**Scope Restriction for Phase 2A:** One archetype (Consultation), one channel (Web), one n8n workflow (CRM sync). No admin UI. No billing. Validate that a real customer will pay for *this* before expanding.

### Phase 2B: Internal Admin UI + Multi-Archetype (2–3 months)

| Step | Module | Notes |
|------|--------|-------|
| 2B.1 | Next.js dashboard scaffold | AI excels here |
| 2B.2 | Agent creation wizard | Form-heavy, AI handles well |
| 2B.3 | Knowledge base upload (PDF, URL, text) | File processing, chunking pipeline |
| 2B.4 | Analytics views (conversations, leads, metrics) | Supabase Realtime for live updates |
| 2B.5 | Additional archetypes (Emergency, Support, Sales) | Database config only, no code deploy |
| 2B.6 | Additional channels (WhatsApp, SMS) | Webhook adapters, rate limit handling |
| 2B.7 | LangSmith integration (deep tracing) | Add if debugging complexity demands |
| 2B.8 | **Milestone: Internal team can configure agents without code** | — |

### Phase 3: Full External SaaS (1–2 months)

| Step | Module | Notes |
|------|--------|-------|
| 3.1 | Stripe billing integration (per-seat + usage) | Well-documented, AI handles well |
| 3.2 | Self-service onboarding (org creation, first agent) | Critical for conversion funnel |
| 3.3 | Usage quotas + rate limiting (per plan) | Prevent abuse, enforce plan limits |
| 3.4 | Public documentation + API keys | Developer experience for power users |
| 3.5 | **Milestone: First paying customer onboarded without human intervention** | — |

### Total Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Architecture | 2–3 weeks | 2–3 weeks |
| Phase 2A: Runtime | 4–6 months | 5–7 months |
| Phase 2B: Admin + Scale | 2–3 months | 7–10 months |
| Phase 3: SaaS Commercial | 1–2 months | 8–12 months |
| **Buffer (refactor, polish, real-world fixes)** | +2–3 months | **10–14 months** |

---

## 9. Infrastructure Cost Projection (Updated)

### Monthly Costs by Stage

| Service | Tool | MVP (0–100 users) | Growth (1K users) | Scale (10K users) |
|---------|------|-------------------|-------------------|-------------------|
| Frontend Hosting | Vercel Pro | $20 | $20 | $20 → evaluate Cloudflare |
| Backend Hosting | Railway Hobby → Fly.io | $5 | $20–$40 | $30–$50 |
| Database | Supabase Pro | $0 free / $25 | $25 | $25–$100 |
| Vector Search | Supabase pgvector | $0 | $0 | $0 |
| Short-term Memory | Upstash Redis | $0 | $10 | $20–$50 |
| Long-term Memory | Supabase PostgreSQL | $0 (included) | $0 | $0 |
| Auth | Supabase Auth | $0 (included) | $0 | $0 |
| File Storage | Supabase Storage | $0 (included) | $0 | $0 |
| Automation | n8n (Hetzner CX22) | $5 | $5–$10 | $10–$15 |
| Transactional Email | Resend | $0 | $0 | $0 (3K free) → $10 |
| Error Tracking | Sentry | $0 | $0 | $0 (5K free) → $26 |
| Domain | Namecheap | ~$1 | ~$1 | ~$1 |
| AI API (variable) | OpenAI/Anthropic | $20–$80 | $200–$500 | $500–$2,000 |
| **TOTAL (fixed infra)** | | **~$31–$136** | **~$81–$106** | **~$112–$262** |
| **TOTAL (with AI API)** | | **~$51–$216** | **~$281–$606** | **~$612–$2,262** |

### Cost Optimization Notes

- **Supabase free tier:** 500MB DB, 50K auth users, 1GB storage. Sufficient for MVP validation.
- **Upstash free tier:** 10K requests/day. Monitor with Sentry; upgrade when hit.
- **AI API costs:** Use GPT-5.4 Mini for most tasks ($0.75/M tokens). Reserve GPT-5 / Claude Sonnet 5 for complex reasoning only.
- **Hetzner:** CX22 at ~$5/month is globally unbeatable for VPS. No reason to change.

---

## 10. Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LangGraph API breaking change | Medium | High | Lock versions in `requirements.txt`. No mid-build upgrades |
| Multi-tenant data leakage | Low | Critical | RLS policies validated by all 3 reasoning agents. Manual penetration test before Phase 2B |
| RAG relevance poor | Medium | High | Benchmark threshold (> 0.7) in Phase 2A. Tune chunking + embedding model |
| n8n workflow failure cascade | Medium | High | Idempotency + circuit breaker pattern in spec. Sentry alerts |
| AI API cost explosion | Medium | Medium | Usage quotas per org. GPT-5.4 Mini default. Cost alerts in dashboard |
| Build timeline slip | High | Medium | Architecture lock prevents scope creep. Phase 2A scope restricted to one archetype + one channel |
| No product-market fit | Medium | Critical | Phase 2A ends with pilot customer validation. Do not proceed to 2B without revenue signal |
| Single founder burnout | High | Critical | 15–20 hrs/week sustained. AI agents reduce typing, not decision fatigue. Build in public for accountability |

---

## 11. Success Metrics by Phase

| Phase | Metric | Target |
|-------|--------|--------|
| Phase 0 | Architecture spec completeness | 100% traceability (every requirement → design → test) |
| Phase 2A | End-to-end conversation success rate | > 90% for Consultation archetype, Web channel |
| Phase 2A | Pilot customer willingness to pay | ≥ 1 customer commits to paid plan at Phase 2B completion |
| Phase 2B | Agent creation time (non-technical user) | < 10 minutes from signup to first working agent |
| Phase 2B | Multi-tenant isolation audit | Zero data leakage across organizations |
| Phase 3 | Self-service onboarding completion rate | > 50% of signups create first agent without support |
| Phase 3 | Monthly Recurring Revenue (MRR) | > $1,000 (validation of business model) |

---

## 12. Build Methodology: AI-Assisted, Architecture-First

### The Process

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 0: ARCHITECTURE (Human + Reasoning Agents)          │
│  ├─ You: Draft technical specification                     │
│  ├─ Claude Opus: Find logical gaps & edge cases           │
│  ├─ GPT-5: Find integration anti-patterns                  │
│  ├─ Kimi: Find schema/business contradictions              │
│  ├─ You: Synthesize, resolve, finalize                      │
│  └─ ALL: Final validation → ARCHITECTURE LOCK             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2A–3: CODING (AI Coding Agents: Claude Code / Codex) │
│  ├─ Receive: Locked spec + implementation checklist        │
│  ├─ Build: Module by module, dependency-ordered              │
│  ├─ Test: Per-module criteria defined in spec                │
│  ├─ Report: Deviations trigger Architecture Lock Rule      │
│  └─ Deliver: Working module, Sentry-monitored               │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Lock Rule (Critical)

> **No coding agent may deviate from the spec. If a coding agent discovers the spec is wrong, work stops. You update the spec, re-run adversarial review (Phase 0.2–0.6), then resume coding.**

This prevents the #1 failure mode of AI-assisted builds: coding agents "optimizing" what they perceive as suboptimal, creating silent divergence between implementation and architecture.

---

## 13. Tool Evaluation Summary

| Tool | Original | Current | Change Reason |
|------|----------|---------|---------------|
| LangGraph | ✓ | **✓ Retained** | Best for stateful conversation systems |
| LangFlow | — | **✗ Not for production** | Visual builder; use only for prototyping reference |
| Pydantic AI V2 | — | **△ Alternative** | Switch only if architecture review confirms linear flows |
| FastAPI | ✓ | **✓ Retained** | Async-native, LangGraph-compatible |
| Next.js | ✓ | **✓ Retained** | Unmatched for React full-stack |
| Tailwind | ✓ | **✓ Retained** | AI coding agents write it fluently |
| Vercel | ✓ | **✓ Retained** | Zero-config Next.js; Pro required for commercial |
| Supabase | ✓ | **✓ Retained** | Auth + DB + Storage + pgvector + RLS in one |
| Neon | — | **△ Alternative** | Cheaper branching; not worth switching from Supabase |
| Redis (self-hosted) | ✓ | **✗ Replaced** | Operational overhead unacceptable without engineers |
| Upstash Redis | — | **✓ Added** | Serverless, zero ops, free tier, LangGraph-compatible |
| n8n | ✓ | **✓ Retained** | No better alternative at this price |
| Hetzner VPS (n8n) | ✓ | **✓ Specified** | CX22 at $5/month is optimal |
| Railway | △ | **✓ MVP choice** | Fastest deploy for AI-assisted iteration |
| Fly.io | △ | **✓ Production choice** | Cheapest at scale; migration path defined |
| Render | △ | **✗ Not selected** | Slower deploy than Railway |
| Resend | — | **✓ Added** | Required for SaaS; 3K emails free |
| Sentry | — | **✓ Added** | Essential for production monitoring |
| LangSmith | — | **△ Deferred** | Add in Phase 2B if debugging demands |

---

## 14. Final Notes

### What Hasn't Changed
- Core vision: AI Workforce Operating System, not a chatbot builder
- Multi-tenant philosophy: 100 clients = 100 database configs, not 100 projects
- LangGraph + n8n division: LangGraph thinks, n8n executes
- Archetype-driven configuration: one engine, many personalities
- No hired engineers: AI-assisted build with founder guidance

### What Has Changed
- **Architecture-first methodology:** 2–3 week spec phase before any code
- **Multi-agent adversarial review:** Claude + GPT + Kimi validate before coding
- **Architecture Lock Rule:** Spec is law; deviations require re-validation
- **Tool optimizations:** Upstash replaces self-hosted Redis; Railway→Fly.io migration path; Resend + Sentry added
- **Scope restriction:** Phase 2A limited to one archetype + one channel for validation
- **Cost model:** Detailed monthly projections from MVP to 10K users
- **Risk framework:** Explicit mitigation for top 8 risks

### The Honest Bottom Line

This is a **10–14 month build** to production-ready SaaS. AI coding agents reduce cash cost to near-zero but do not proportionally reduce calendar time — architectural decisions, debugging, and integration testing remain human-bottlenecked. The architecture-first approach with adversarial AI review is the highest-leverage intervention available, shifting failure mode from "system falls apart at integration points" to "individual components need tuning."

**Win rate estimate with this methodology:**
- Working MVP: 85%
- 10+ real customers: 65%
- 100+ customers without major refactor: 45%
- Product-market fit: 15–25% (unchanged — this is business, not tech)

**Start with Phase 0. Do not write code until the Architecture Lock is signed off by all three reasoning agents and yourself.**

---

*Document Version 2.0 — Architecture-First Build Methodology*  
*Built for AI-assisted execution with human architectural oversight*
