# Planning-to-Build Transition Document v1

```
Status:    ACTIVE — this is the bridge document from architecture phase to
           rapid build phase. Everything a fresh session needs to operate
           as commander (this chat's role going forward) or executor
           (Claude Code's role going forward) starts here.
Purpose:   (1) Consolidate everything learned from the Convocore document
           set. (2) Record every decision made in this session. (3) Define
           the Commander/Executor operating model going forward. (4) Give
           the full phase-by-phase build plan. (5) Give Phase 0's concrete
           Claude Code environment setup instructions.
Position:  Sits above the Build Execution Plan (paused earlier, superseded
           by this document's revised phase plan, which now accounts for
           Convocore and the 4 new dashboard systems).
Revision:  Email Manager v2 confirmed and fully specified (Phase 10).
           Cal.com, WooCommerce guide, Token Refresh Sweep interval, and
           last_error field shape all resolved. Redirect URI confirmed
           correct. Phase 0 corrected to audit/rewrite existing Claude
           Code config files, not create new ones. Operating manual
           rewritten as Claude_Build_Command_Protocol_v2.md (see that
           document) — retires Codex, formalizes the real two-party
           Commander/Executor model.
```

---

# PART 1 — Convocore: What Was Learned

Source documents fully read: `Convocore_Adapter_Spec_FINAL.md`,
`Convocore_Canvas_Ground_Truth_FINAL.md`,
`Convocore_Findings_Required_Updates_FINAL.md`. `escalations` table's real
columns verified directly against `current_state.sql`, not assumed from
the documents' own uncertainty.

## 1.1 Where Convocore Sits — Unchanged

```
Customer → Convocore (Conversation Layer) → Convocore Adapter →
Agent Runtime System → Execution Layer (n8n) → Database (Supabase)
```

Core Agent, Growth Agent, Conversion Engine, Recovery Engine, Email
Manager, Utilities, Dashboard — none of these change based on which
adapter is in use. The adapter's rule is unchanged from Voiceflow: may
translate/normalize/validate/format; must never execute business
decisions, access databases directly, or implement Runtime logic.

## 1.2 What's Genuinely New

1. **Client Resolution** — Convocore has no native `client_id` concept.
   Every request must resolve `agentId → client_id` before anything else.
   A Custom Tool's Bearer token (defaults to the agent's own secret if
   left blank) doubles as a real security check — don't trust `agentId`
   alone.
2. **`runtime_module` — embedded prompt logic (the single biggest
   decision in the whole Convocore document set).** Business logic that
   determines which module's behavior applies is written as **static,
   pasted prompt text** inside Convocore's nodes — not inferred by the
   Adapter, not driven by a runtime conditional variable (explicitly
   rejected — LLM hallucination risk on conditional logic in natural
   language). This means Runtime logic that will ever run inside a
   Convocore node needs a second, prompt-embeddable version maintained
   alongside its normal implementation.
3. **Tool Key = Runtime `tool_name`, now binding** — every Convocore
   Custom Tool's `Key` field must exactly match the Runtime's Tool Name
   registry. Makes the Adapter's tool mapping a pure pass-through.
4. **Variables → payload** — a Custom Tool's attached Variables become
   `payload` fields. Values only get captured if the node's prompt
   explicitly instructs capture — Convocore does not auto-infer from a
   Variable's Description alone.
5. **`human-handoff` — deep integration, staged fallback.** Writes a real
   `escalations` row, not just Convocore's internal email. Staged:
   Convocore's email + Zenny's KB-informed response first; escalate
   further only if a human manually judges it insufficient (per this
   session's decision, Part 2.4 below — not automated).
6. **Shopify — formal, deliberate exception.** Convocore's *native*
   Shopify system tool is used for conversational product Q&A. Client
   credentials flow through Zenny's own credential platform, then get
   manually/programmatically provisioned into Convocore directly — never
   through a Zenny-owned integration workflow the way every other
   provider works. Not a gap, an intentional exception.
7. **Recovery messaging — no API path exists, current state.** Three
   approaches investigated (WebSocket `prompt` field, Campaigns, the
   `PATCH .../messages` endpoint) are all confirmed dead ends for
   triggering a genuine agent-initiated outbound message. Email-only,
   manual, until Convocore's own team responds to a support inquiry
   already sent (external dependency, not a Zenny-side task).
8. **Conversation Origination Rule — critical build constraint.**
   Conversations created via `POST /convos` (REST) are **structurally
   broken** for every later `GET`/`PATCH`/`DELETE` — 100% reproducible
   across 3 independent workspaces, identifiable by `{agentId}_{suffix}`
   IDs. Only real WebSocket-originated conversations work correctly.
   **Any Zenny component that will read/tag/update a conversation later
   must originate it via WebSocket, never `POST /convos`.**
9. **Product/inventory data — never stored in Zenny's own database.**
   Confirmed: stays FAQ/business-knowledge only. Product catalogue flows
   Shopify/WooCommerce → a new sync workflow → **Convocore's KB directly.**
10. **Lead Qualification Funnel — Convocore's is primary**, not Zenny's
    Growth Agent scoring. Requires real per-client dashboard setup on
    Convocore's side (qualification steps, point weights) — not
    zero-config.
11. **Convocore auto-generated data (summary/sentiment/cost/lead-score)
    — use Convocore's version first**, Zenny's own computation only as a
    fallback if judged insufficient (manual judgment, per Part 2.4).
12. **Voice** — one Canvas node handles both chat and voice via two
    separate instruction slots (Text/Voice). Google Live model is
    incompatible with multi-node agents. Twilio only, always the client's
    own number (never Convocore-purchased) — same credential platform as
    everything else. Voice Webhook (passive, fire-and-forget) exists but
    is deprioritized; voice agents already call standard Custom Tools
    mid-call through the normal mechanism, no separate path needed.
13. **MCP is a post-build checklist tool only, never a build tool** —
    confirmed unreliable for writes across three independent workspaces.
    `run_command` permanently off-limits regardless of connection method.
    All Canvas/Tool/Variable building happens manually in the dashboard.

## 1.3 Known Convocore Platform Bugs (tracking only, not a Zenny-side fix)

`childrenNodes` wiring can render a visually blank/broken node even on a
successful write — never trust the dashboard's visual state alone,
validate via a real test conversation. `kb/stats` throws 500 on an empty
KB. `get_agent_usage`/`search_agents` have auth/result bugs (use
`POST /workspaces/{uid}/usage` instead). Custom Metrics `PATCH` returns
404 on valid IDs. Telegram conversations can 500 on `GET` (a third,
distinct failure mode from the REST-creation bug).

---

# PART 2 — Decisions Made This Session

## 2.1 `control.convocore_agent_map` — dedicated table (not columns on
the client table)

Reasoning: not guaranteed 1:1 forever (a client could have multiple
agents later — voice + chat, multi-brand), and matches the exact pattern
already used for `oauth_apps`/`client_connections`.

```sql
control.convocore_agent_map (
    client_id                 uuid REFERENCES control.clients(client_id),
    convocore_agent_id         text NOT NULL,
    convocore_agent_secret_id   uuid NOT NULL,  -- Vault reference
    convocore_region              text NOT NULL,  -- 'eu' | 'na'
    agent_display_name               text NOT NULL,  -- shown on web widget
    created_at                          timestamptz NOT NULL DEFAULT now()
)
```

## 2.2 Convocore auto-generated data — columns on `leads`

```sql
ALTER TABLE {client_schema}.leads
  ADD COLUMN convocore_conversation_id text NULL,  -- WebSocket-origin ONLY
  ADD COLUMN convocore_summary text NULL,
  ADD COLUMN convocore_sentiment text NULL,
  ADD COLUMN convocore_token_usage integer NULL,
  ADD COLUMN convocore_cost numeric NULL,
  ADD COLUMN convocore_lead_score integer NULL;
```

## 2.3 `escalations.escalation_team` — new column, confirmed needed

Real columns verified directly: `escalation_id`, `lead_id`, `customer_id`,
`escalation_type`, `escalation_reason`, `escalation_priority`,
`origin_module`, `trigger_condition`, `ownership_state`, `status`,
`created_date`, `resolved_date`. **No column exists for Convocore's
`team_key`** (which team should handle this). `escalation_reason` maps
reasonably onto Convocore's `issue_summary`, but `team_key` has no home.

```sql
ALTER TABLE {client_schema}.escalations
  ADD COLUMN escalation_team text NULL;
```

## 2.4 "Insufficient" trigger conditions — resolved as manual, not automated

Every place the Convocore documents flagged an "insufficient → escalate
further" condition (handoff staged fallback, lead-funnel switchover,
general Convocore-data-precedence fallback): **this is a human judgment
call, not a workflow-checkable rule.** No automated trigger condition is
built. When ZeroManual/Zenny's team judges Convocore's output insufficient
for a given client, that's communicated manually, and the fallback to
Zenny's own system is switched on deliberately — not detected
automatically by any workflow.

## 2.5 Agent naming convention — confirmed

```
{ClientBusinessName} Assistant
```

e.g. "Bright Smiles Dental Assistant." Client's own brand is what the
customer sees on the widget — never "Zenny" or "ZeroManual" client-facing
(same principle already applied to OAuth app naming, Part 8 of this
document).

## 2.6 Template Dashboard — deferred, not built now

The "copy-paste prompt generator" system the embedded-logic decision
(1.2 #2) depends on at scale is **not built for the first clients.**
Instead: a fresh Claude Code session (or this chat) fetches client data
via Supabase MCP, and a human manually builds each Convocore agent in the
dashboard following provided instructions (Tools, Variables, node prompts
per-client). Templating comes later, once real patterns across several
manually-built clients make templating well-informed rather than
speculative.

## 2.7 Dashboard-building tool — Directus, not a custom build

For the 4 new dashboard systems (Part 6.3 below): **Directus**
(open-source, MIT-adjacent license, 28K+ GitHub stars, self-hostable).
Connects directly to an existing Postgres/Supabase database, auto-
generates a full admin UI (tables, forms, relational data, role-based
access) with no custom app to build from scratch — closer to the
"Airtable-like, thin, simple" requirement than a code framework like
Refine (which still requires building a React app around it). Includes
built-in Flows (visual automation) if useful later. **This choice should
still be live-verified by Claude Code against the actual current Directus
release before committing — same MCP/live-verification discipline this
whole project has followed throughout, not taken on faith from this
document alone.**

## 2.8 Credential testing approach — HTTP Request + Header Auth, not
native OAuth nodes

Confirmed: build real end-to-end workflows now, using n8n's **HTTP
Request node with a Generic Header Auth credential** holding real test
account tokens (Google, Shopify, Slack, Calendly already captured — see
Part 2.9). **Do not use n8n's native OAuth-specific nodes** (e.g., the
built-in Google Calendar node) — that's a structurally different node
type than what's architected (`External_Integration_Strategy_v1.md` Part
5.2 rules this out for multi-tenant reasons), and building on it now
means rebuilding later, not swapping a credential. HTTP Request + Header
Auth is architecturally identical to the eventual production shape
(dynamic Vault-sourced token in an Authorization header) — swapping test
credentials for real Vault-sourced ones later is a one-field change.

## 2.9 Credential status (as of this session)

**Captured:** Google (client ID + secret, test users added, verification
submitted), Shopify (client ID + secret), Slack (bot token `xoxb-...`),
Calendly (client ID, secret, webhook signing key).

**Cal.com — confirmed decision:** build the Router branch now, same as
every other provider — but keep it disabled/hidden. Set
`control.oauth_apps`'s Cal.com row to a non-active status (e.g.
`'pending'`, not `'testing'`/`'published'`) so the Provider Router never
routes real traffic to it until the business email is supplied and the
app is actually registered with Cal.com. Not blocked on this to continue
building.

**WooCommerce onboarding guide — confirmed decision:** Claude Code writes
this when Phase 5 (the WooCommerce manual-key dashboard flow) is actually
being built — not before. At that point, Claude Code reports back any
task that genuinely needs a human (e.g., a real WooCommerce test-store
login, a screenshot it can't take itself).

**Not done:** Vault storage (walked through, not confirmed working),
`control.oauth_apps` table (not built — blocks Vault entries from linking
to a provider row).

**Resolved this session, no longer open:**
- **Redirect URI** — `kmhzosyljpzheqvfuyzm.supabase.co/functions/v1/
  oauth-callback` is confirmed correct. Claude Code re-confirms this
  live as its first action in Phase 1, per standing MCP-verification
  discipline, but this is no longer treated as an open question.
- **Token Refresh Sweep interval — confirmed: 6 hours.** Reasoning:
  safely inside every provider's expiry window (Google's Testing-mode
  7-day hard cutoff is the tightest constraint in the system; 6 hours
  leaves generous margin to catch a token needing refresh well before
  any deadline). Should be revisited toward more frequent intervals as
  client volume grows — not treated as a permanent constant, just the
  right starting value now.
- **`last_error` field shape — confirmed: plain text, no structured
  category field.** `connection_audit_log.reason`
  (`Client_Integration_and_Credential_Platform_v1.md` Part 6.3) stores
  the provider's raw error message verbatim, nothing more structured.
  Reasoning: not enough real failure volume yet to know what categories
  would actually be useful to filter by — adding structure speculatively
  risks guessing wrong. Matches this project's standing discipline of not
  inventing structure before a real need is demonstrated.

## 2.10 Operating Model — Commander / Executor

**This chat (Claude, in claude.ai) = Commander.** Issues Build Cards
(scoped work orders), reviews Implementation Reports, makes architecture
decisions, resolves ambiguity, updates documents.

**Claude Code = Executor.** Takes a Build Card, executes it (writes code,
builds schema, deploys, tests), reports back precisely what was done,
what was verified live vs. assumed, and what's blocked.

This mirrors `Claude_Build_Command_Protocol_v2.md`'s Build Card →
Implementation Report → Architecture Review cycle exactly — this section
just names the two roles plainly for this build phase.

## 2.11 New chat or continue in this one — recommendation

**Start a new chat.** This document is deliberately written to be
self-contained — everything a fresh session needs is here, not implicitly
assumed from a long prior conversation. Reasons to start fresh rather
than continue in this thread:

- This thread is now extremely long; a fresh Commander session operating
  over many future Build Card exchanges works more reliably with a clean
  context than one carrying this entire planning history.
- This document is the explicit bridge — if it's missing something the
  new session needs, that's a defect in this document worth fixing, not
  a reason to fall back on this thread's memory.
- Keep this thread available for reference/history, but treat the new
  chat as the one actually issuing Build Cards going forward.

---

# PART 3 — Phase 0: Claude Code Environment Setup (Do This First)

## 3.1 Purpose

Before any real building starts, the project folder (`zenny-breakthrough`)
needs to be organized for a fast-moving build phase — not left in its
current planning-phase-accumulated state.

## 3.2 File Organization

1. Create a folder named `_archive_planning_phase/` (or similar) at root.
2. Move into it: anything superseded, draft, or purely historical —
   specifically: any `_v1`/pre-FINAL version of a document that has a
   FINAL counterpart still in root, the old Airtable-era test/demo
   documents (`zenny-dashboard-test-only_gmail_calender_-doc.md` and
   similar — keep as historical reference for their OAuth mechanics per
   `Client_Integration_and_Credential_Platform_v1.md` Part 11, but out of
   the active root), and any `.docx` drafts already noted as superseded
   by a `.md` FINAL version.
3. **Do not archive anything without listing it first and confirming it
   matches this rule** — same discipline as the earlier Cross-Architecture
   Validation pass. Report the full before/after file list.
4. Keep in active root: every `_FINAL` and current `v1` document still
   without a superseding version, `current_state.sql`,
   `Database_Structure_v4_FINAL.md`, all `n8n_*` specs, all `Convocore_*`
   FINAL docs, `Tool_Naming_Convention.md`, `Fallback_Pattern_Catalog.md`,
   `Claude_Build_Command_Protocol_v2.md` (supersedes
   `AI_Builder_Operating_Manual_v1.md` — archive the v1 manual per 3.2's
   rule, since a FINAL/superseding version now exists),
   `External_Integration_Strategy_v1.md`,
   `Client_Integration_and_Credential_Platform_v1.md`,
   `Provider_App_Setup_Guide_v1.md`, this document.

## 3.3 Claude Code Project Configuration Files

**Correction to this document's earlier assumption:** `CLAUDE.md` and
some settings files already exist in the project. **This is an audit and
rewrite task, not a create-from-scratch task.** The existing `CLAUDE.md`
is confirmed stale — written for the planning phase, not the build phase
— and the existing settings files are unorganized. Claude Code's first
real task in this phase:

1. **Read the existing `CLAUDE.md` in full first.** Identify what's
   still accurate (project identity, tech stack facts) vs. what's
   planning-phase-oriented and needs replacing with build-phase content.
2. **Rewrite `CLAUDE.md`** to contain:
   - One-paragraph project summary (Zenny: multi-tenant AI customer-agent
     platform, Convocore conversation layer, n8n execution layer,
     Supabase database, ZeroManual as the parent company)
   - Pointer to `Planning_to_Build_Transition_v1.md` as the current
     phase-plan and decision-record entry point, and
     `Claude_Build_Command_Protocol_v2.md` as the operating-model
     document governing how Build Cards flow
   - The Commander/Executor model stated plainly (this chat commands,
     Claude Code executes with orchestration authority within a card's
     scope — per the Protocol document, Section 2)
   - The MCP-verification discipline restated as a standing rule
   - The credential-testing approach (HTTP Request + Header Auth, never
     n8n's native OAuth-specific nodes) restated as a standing rule
3. **Locate and organize the existing settings files** — report what's
   currently there (exact file names/locations, since these weren't
   confirmed by the human), consolidate/clean up as needed, confirm
   Supabase MCP and n8n MCP access are both configured and working.
4. **A build tracking file** (e.g., `BUILD_PROGRESS.md`) — check if
   anything like this already exists before creating one; if not, create
   it mirroring Part 4's phase list below, checked off as each
   phase/workflow completes. This becomes the single source of truth for
   "what's actually built," replacing informal status updates in chat.

## 3.4 Output Required From This Phase

1. The full before/after file manifest (3.2).
2. Confirmation `CLAUDE.md`, the settings file, and `BUILD_PROGRESS.md`
   exist and their contents.
3. Confirmation of current Claude Code project-config conventions verified
   live (file names/locations can change between Claude Code versions —
   don't assume the names above are still current without checking).

---

# PART 4 — Full Phase-by-Phase Build Plan (Revised)

## Phase 0 — Environment Setup
Per Part 3 above.

## Phase 1 — Close Credential Platform Gaps (blocking)
```
1. Build control.oauth_apps table
2. Confirm Vault storage round-trip works
3. Sign off redirect URI as final
4. Decide + document Token Refresh Sweep interval
5. Decide + document last_error field shape
6. Seed oauth_apps with the 4 real captured credentials (Part 2.9)
```

## Phase 2 — Convocore Database Changes
```
1. control.convocore_agent_map (Part 2.1)
2. leads: 6 new Convocore-data columns (Part 2.2)
3. escalations.escalation_team (Part 2.3)
4. client_config or equivalent: voice_agent_enabled, sms_agent_enabled,
   client_voice_number, client_sms_number
5. Documentation note: no product/inventory tables, ever, in our DB
6. New Twilio credential fields in the Credential Platform (Account SID,
   Auth Token, phone number) — always client's own number
```

## Phase 3 — Remaining Shared Utilities
```
UTIL-001 Schema Resolver, UTIL-002 Data Validator, UTIL-003 Error Logger,
UTIL-004 Notification Router (simple email/notification, no extra table —
per earlier session decision), UTIL-005 Stop Checker
```
*(UTIL-006 Credential Resolver already built)*

## Phase 4 — Convocore Adapter (ADP-002)
```
1. Client Resolution (agentId → client_id)
2. Standard Request Contract mapping
3. Tool Name pass-through enforcement
4. Variable → payload mapping
5. human-handoff deep integration + staged fallback (manual trigger,
   per Part 2.4)
6. Shopify exception handling
7. Register ADP-002 formally in n8n_Workflow_Specification_v1.md
8. Update 3 stale "Prospective" status lines (Workflow Spec, Integration
   Contract, Execution Architecture)
```

## Phase 5 — The 4 New Dashboard Systems (Directus-based, Part 2.7)

```
5A. Inventory Dashboard + Database
    For clients without Shopify/WooCommerce. Client updates product/stock
    → trigger workflow → syncs into that client's Convocore KB. Agent's
    product lookup always hits Convocore KB, never our DB directly.

5B. Order Lookup Dashboard + Database
    EVERY order lands here first, regardless of provider. Client reviews
    → approve/reject → THEN pushed to real store if applicable (matches
    the already-frozen approval flow, External_Integration_Strategy_v1.md
    Part 6.1).

5C. Appointment Booking Dashboard + Database (new)
    **Parallel-write pattern, not sequential.** On every booking
    create/update, the workflow writes to BOTH the client's real calendar
    (Google/Calendly/Cal.com) AND our own Appointment Dashboard database,
    as part of the same operation — not "ours first, theirs later."

    - If the client calendar write succeeds: both systems now agree,
      done. Our database record is a synced mirror, not a staging area.
    - If the client calendar write FAILS (provider outage, revoked
      credential, any Tool Execution Fallback trigger per
      Client_Integration_and_Credential_Platform_v1.md Part 7): our
      database write still succeeded — it's the resilient fallback
      record, the "black box." An alert fires immediately ("your
      calendar connection failed — see this booking on your ZeroManual
      dashboard") so nothing is silently lost; the client can manually
      reconcile once their calendar connection is restored.

    **Reads work the opposite direction — client's calendar is checked
    first, our database only as fallback.** `CheckAvailability` and any
    booking-status lookup query the client's real, live calendar first
    (source of truth when it's reachable); only fall back to our own
    stored record if that live read fails or the client has no calendar
    connected at all.

    This is a genuine architecture change from the original per-Tool
    spec (which wrote straight to the calendar provider only) — needs a
    Change Request against `n8n_Workflow_Specification_v1.md`'s
    `CreateAppointment`/`CreateReservation`/`CreateInspectionSlotBooking`/
    `CreateScoredBooking`/`CheckAvailability` entries, updating both their
    write behavior (parallel, not single-destination) and their read
    behavior (client-first, our-system-fallback).

    **Reuses the existing Tool Execution Fallback mechanism, does not
    duplicate it.** A client-calendar write failure detected here is the
    same class of event `Client_Integration_and_Credential_Platform_v1.md`
    Part 7 already handles (retryable vs. non-retryable, credential
    status updates, alerting) — the only difference is that in this
    pattern, the "degrade to dashboard capture" path Part 7 describes
    *is* the parallel write to our own database, not a separate fallback
    invoked only after failure. Build this as one workflow with two write
    targets and Part 7's existing failure-handling wrapped around the
    client-calendar target specifically — not as two independent
    mechanisms that happen to both exist.

5D. Onboarding Form + Database
    Direct client-facing form → writes straight into control.clients /
    client_config, replacing manual onboarding entry.
```

## Phase 6 — Core Agent
```
WF-013 through WF-017, INT-001 through INT-005
```

## Phase 7 — Growth Agent
```
WF-001 CreateLead — defers scoring to Convocore's funnel primarily
(Part 1.2 #10)
```

## Phase 8 — Conversion Engine (11 Tools)
```
WF-002 through WF-012 — booking/reservation Tools now write in PARALLEL to
both the client's calendar and Phase 5C's dashboard (5C's fallback pattern
above), reading from the client's calendar first with 5C as fallback;
CreateCart writes to Phase 5B first; CheckAvailability reads from Phase
5A's synced Convocore KB where no Shopify/WooCommerce exists
```

## Phase 9 — Recovery Engine
```
WF-018 — email-only (Convocore API path confirmed unavailable, Part 1.2 #7)
```

## Phase 10 — Email Manager

**Confirmed, decision made — no longer on hold.** The Email Manager v2
redesign (originally shared as a draft outline: WF-201 Intake+Context
Engine, WF-202 Human Assist, WF-203 Draft Generator, WF-204 Approval
Processor, WF-205 Auto Responder, WF-206 Label Manager) is confirmed as
the real design, corrected against current architecture as follows:

```
- Airtable → Supabase everywhere (the outline predates the Supabase
  build; every "Business Config Lookup" / "Store Draft" step now targets
  the client's schema via Schema Resolver, not Airtable)
- Gmail-only assumption → routes through the Provider Router pattern
  (External_Integration_Strategy_v1.md Part 5) — email_provider config,
  not hardcoded Gmail
- "Business Config Lookup" is NOT a new lookup — it calls the EXISTING
  INT-002 Load Client Configuration / INT-003 Load Archetype
  Configuration, not a duplicate mechanism
- "Load Knowledge Base — Production: RAG" is now answered concretely:
  Convocore's KB Search API (POST /agents/{agentId}/kb/search) — this
  is the real mechanism, confirmed live this session, not a placeholder
- "Generate Draft" step: KB search results feed into an OpenRouter call
  (not a direct single-vendor LLM call) to actually compose the draft
  text — OpenRouter chosen specifically for provider flexibility,
  matching this project's standing "never hardcode a provider" principle
- Workflow IDs reassigned into the existing INT-{NNN} numbering (these
  are internal/non-Tool workflows, same as the rest of Email Manager):
  INT-012 Email Intake + Context Engine (was WF-201)
  INT-013 Human Assist (was WF-202, Level 1)
  INT-014 Draft Generator (was WF-203, Level 2 & 3 share this)
  INT-015 Approval Processor (was WF-204, Level 2)
  INT-016 Auto Responder (was WF-205, Level 3, governance gate before send)
  INT-017 Label Manager (was WF-206, shared, provider-aware not Gmail-only)
- WF-019 SendEmailReply (existing Tool contract) and INT-009 Sync Inbox
  remain unchanged as the entry points into this pipeline
```

This is a genuine Change Request against
`n8n_Workflow_Specification_v1.md` Part 7.7's Internal Workflow Registry
— 6 new INT entries replacing the prior INT-010/INT-011 placeholder pair
with a properly decomposed pipeline. Needs formal registration before
this phase's Build Cards are written, same discipline as UTIL-006/SCH-006.

## Phase 11 — Scheduled Workflows
```
SCH-001 through SCH-006 (existing) + NEW: Shopify/WooCommerce → Convocore
KB sync workflow (Part 1.2 #9) — cadence/transform/error-handling design
is a real build task, not yet designed
```

## Phase 12 — Node-by-Node Outlines (cross-cutting, see Part 5 below)

## Phase 13 — Template Dashboard
Deferred (Part 2.6) — revisit after several clients are manually built.

---

# PART 5 — Node-by-Node Outline Philosophy

Per your instruction: every workflow gets a **structural outline** before
building — Node 1 does X, Node 2 does Y, in sequence, naming which
utility/API each node touches — so Claude Code implements against a
scaffold instead of designing the shape from scratch each time.

**What this outline is:** the sequence and purpose of each node.
**What this outline is NOT:** exact live API field names, exact n8n node
type/version, exact expression syntax — those still get verified live at
build time, per this project's established MCP-verification discipline
(`Claude_Build_Command_Protocol_v2.md` Section 6.1). Pre-locking those
details risks building against a stale assumption — this has already
happened once in this project (the Supabase schema-header question) and
was corrected by verifying live instead of guessing.

**Practical shape, one outline per workflow, written at Build Card time
for each phase — not all 40+ upfront**, since front-loading every outline
before any building starts would itself become stale as earlier phases'
real implementation reveals adjustments (exactly what happened with the
Email Manager plan once the real Convocore KB mechanism was found).

---

# PART 6 — Open Items Carried Forward

1. ~~Email Manager v2~~ — **RESOLVED, confirmed this session.** Full
   design now in Part 4, Phase 10.
2. **Cal.com** — build now, hidden/disabled (Part 2.9), business email
   still pending from you.
3. **WooCommerce onboarding guide** — Claude Code writes it at Phase 5,
   not before (Part 2.9).
4. ~~Token Refresh Sweep interval~~ — **RESOLVED: 6 hours** (Part 2.9).
5. ~~`last_error` field shape~~ — **RESOLVED: plain text, no structured
   category** (Part 2.9).
6. ~~Redirect URI~~ — **RESOLVED, confirmed correct.** Claude Code
   re-verifies live as a first action, per standing discipline, not
   because it's still in doubt.
7. **Directus** — recommended but not yet live-verified as current/fit —
   Phase 5 task, first action, Claude Code's call to confirm or swap.
8. **Claude Code's config file conventions** — `CLAUDE.md` and settings
   already exist but are unorganized/stale; Phase 0 is now correctly an
   audit-and-rewrite task, not a create task (Part 3.3, corrected).
9. **`AI_Builder_Operating_Manual_v1.md` → `Claude_Build_Command_Protocol_v2.md`**
   — the operating manual has been rewritten for the real two-party
   (Claude chat + Claude Code) model, retiring Codex entirely. v1 is
   archived per Phase 0's file-organization rule (Part 3.2).

---

```
ZeroManual · Zenny AI Workforce · Planning-to-Build Transition Document v1
Synthesizes: Convocore_Adapter_Spec_FINAL.md, Convocore_Canvas_Ground_Truth_FINAL.md,
Convocore_Findings_Required_Updates_FINAL.md (all read in full), current_state.sql
(escalations table verified directly), plus every decision made in this session.
Directus vs. Refine comparison verified via live web research, 2026-08-02.
```
