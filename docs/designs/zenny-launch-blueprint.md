# Zenny Launch Blueprint — light roadmap to "live with real paying clients"

Status: DRAFT, human review pending
Created: 2026-08-31, by /commander (direct, not gstack — see note below)
Purpose: a map, not a spec. Each part below becomes its own Build Card,
planned in full (gstack `/plan-eng-review` per part) only when Commander
picks it up — per CLAUDE.md's existing Commander→gstack→Execute bridge.
This doc exists so that bridge has a checklist to walk instead of each
session inventing scope from PROJECT_STATE prose.

**Why this isn't a gstack CEO-review output:** `/plan-ceo-review`'s
machinery (git-diff scope audit, 10x-expansion ceremonies) is built to
review an already-scoped branch/PR, not to draft a from-scratch product
roadmap. Running it here would be exactly the tool-process over-engineering
CLAUDE.md tells both modes to avoid. This is Commander's own light-planning
output instead — no code, no infra touched, single new file.

---

## Where things actually stand (2026-08-31)

**Built, live, published (Phase 14 — own n8n runtime, replacing Convocore):**
- BC-072 — shared runtime foundation (session resolution, OpenRouter LLM call)
- BC-073 — Commerce-Ecom archetype node
- BC-2026-08-31 — concurrency hardening (race conditions + durable memory
  rehydration) — now the standing bar every archetype node must meet
- BC-074 — Appointment archetype node
- BC-075 — Consultation archetype node (provisional lead-score stand-in)

**3 of 6 archetypes done.** Not started: **Emergency, Engagement,
Commerce-Restaurant.**

**Known open items, already flagged, not yet scheduled:**
1. Business memory (this session's trigger) — no durable per-client KB
   beyond the static `agent_prompts` string; needed across all archetypes.
   **Locked as launch-critical (D6, third pass, Part 1) — not fast-follow,
   reversing the earlier working assumption.**
2. Capability breadth (FAQ, sales-style recommendation) — resolved as
   *probably* a prompt-content question not a missing tool (BC-073's own
   AC1 proves FAQ-style answers happen with no tool call today), but never
   verified against a real test for the 5 remaining archetypes.
3. Expired `zenny-notification-sender` Gmail credential (Active Blocker
   since BC-053) — blocks clean calendar-tool tests, needs human OAuth
   reconnect.
4. Channel-gateway parity (WhatsApp, Instagram, web chat) — only ever
   tested against the old Convocore Adapter; never re-verified or rebuilt
   against the new own-runtime.
5. Dashboard's current state relative to this pivot is unverified — it
   was built assuming Convocore as the conversation layer.

---

## The blueprint — 9 parts, roughly in build order

Order reflects dependency, not importance — a part can move up if it
blocks something else once actually planned.

### Part 1 — Production-readiness gate for the 3 shipped archetypes (locked 2026-08-31, third pass — supersedes the sequencing below)

**Human's explicit instruction this pass: stop treating "finish the
archetype set" as next-up. Fully complete/production-harden Commerce-Ecom
(BC-073), Appointment (BC-074), and Consultation (BC-075) FIRST — the
pattern that emerges here is what gets replicated for Emergency,
Engagement, and Commerce-Restaurant, not built in parallel with them.**
Locked via gstack `/plan-eng-review` (D5-D8 below); the old Part 1
("finish the archetype set") moves to **Part 1-EXT** further down and is
now explicitly deferred, not parallel.

**D5 — gate scope (locked: launch-critical only, not full platform
readiness).** What must be true before any of these 3 archetypes is
called production-ready, vs. what fast-follows after the first real
clients:

**In the gate:**
- Part 8 — credential reconnect (`zenny-notification-sender` Gmail,
  Active Blocker since BC-053). Cheap, do first — unblocks a clean
  calendar-tool test for appointment/consultation.
- Part 3 — capability-breadth spot-check, live, per archetype (FAQ,
  sales-style recommendation where relevant) — cheap, rides alongside
  everything else.
- Part 4 — channel-gateway parity audit (WhatsApp/Instagram/web chat) on
  the new own-runtime — real, disclosed unknown, never re-verified since
  the Convocore→own-runtime pivot.
- Part 5 — onboarding pipeline confirmed working end-to-end for these 3
  archetypes against the new runtime (not just checked in isolation per
  archetype card).
- Part 6, narrowed to two launch-critical pieces (see D8 below): (a)
  verify existing dashboard screens — lead-approval, connection-
  management, client-config — against the new runtime's real data shapes
  (this is the same gap PROJECT_STATE.md already discloses: BC-073's
  cart-verification approval Edge Function has never been tested with a
  real dashboard JWT — that's a real launch blocker for commerce-ecom,
  not fast-follow); (b) the BC-076 self-serve KB/catalog screen (D8).
- Part 7, narrowed to a minimum: execution-failure alerting on the core
  runtime chain + each archetype's Agent, and a credential-expiry check
  — the two things Part 7's own text already names as the pre-launch
  floor. Full monitoring/ops stack is fast-follow.
- **BC-076 (business-memory/KB tool) — locked as launch-critical, not
  fast-follow (D6 below, reversing this doc's own working assumption).**
- Part 9 — final QA pass, applied per-archetype (D7 below), once that
  archetype's own gate items above clear.

**Fast-follows after the first real clients (not gating):**
- The rest of Part 6 — chats/inbox view, metrics, settings polish, the
  full Chatwoot-IA-informed screen redesign.
- The rest of Part 7 — anything beyond execution-failure alerting +
  credential-expiry checking (dashboards, on-call rotation, etc.).

Rejected: full platform-readiness gate (everything above plus the
complete dashboard rebuild and full ops stack) — real weeks of work for
value not yet proven needed pre-launch, the same reasoning the
concurrency-hardening card already applied against a custom Postgres
memory system. Rejected: bare-minimum technical gate (just credential
fix + QA pass, skipping the capability/channel/onboarding audits) —
leaves real disclosed unknowns (channel parity, onboarding-pipeline
staleness) untested going into a real client's first experience.

**D6 — BC-076 timing (locked: hard gate, reversing the earlier
fast-follow framing in "Where things actually stand" above).** Human's
explicit call: "Everything should be built, verified before any client
gets live. We have to test it if required with demo business made by
ourselves." BC-076's backend (the `Search Business KB` tool, ingestion
workflows, Shopify/WooCommerce/Notion/Sheets sync per D1/D4 above) must
be fully built and verified against 1-2 internally-built demo
businesses — not a real client — before any real, paying client goes
live on any of these 3 archetypes. This reverses this doc's own working
assumption (Part 3's finding that FAQ-style answers work fine via prompt
content alone) as a launch-gate call, not a technical correction to that
finding — the finding still stands for what a bare prompt *can* do, the
human's call is that a real client shouldn't launch without the fuller
capability regardless.

**D7 — rollout mode (locked: independent per-archetype gate, not
bundled).** Each of the 3 archetypes goes live as soon as its own D5
gate items clear — a client can go live on Commerce-Ecom the moment its
gate items are done, without waiting on Appointment or Consultation's
own QA to finish. "These 3 archetypes are production-ready" becomes a
rolling milestone, not one bundled checkpoint. Matches the concurrency-
hardening precedent (ship the smallest correct thing) over waiting for a
tidy simultaneous release.

**D8 — KB/catalog UI scope (locked: hybrid).** Human's explicit call:
"Full self-serve UI before launch but we can manually populate for first
1-2 demo business." The BC-076 self-serve KB/catalog dashboard screen
(where a real client edits their own catalog/FAQ/policies) is
launch-critical — it must exist before any REAL client goes live, not
fast-follow — reopening D1's original "rest of Part 6 is fast-follow"
call for this one screen specifically (the rest of Part 6 stays
fast-follow, unchanged). The 1-2 internal demo businesses used to verify
BC-076's backend (D6) can be populated directly/manually, no UI needed
for those — they're test fixtures, not real clients.

**Sequencing for this gate, per archetype:** Part 8 (credential
reconnect, once) → Part 3 + Part 4 audits (cheap, parallel) → BC-076
backend build + demo-business verification (D6) → Part 6's two
launch-critical pieces (existing-screen verification + KB/catalog
self-serve screen, D8) → Part 5 onboarding-pipeline confirmation → Part
7 minimum alerting → Part 9 QA pass for that archetype → that archetype
goes live independently (D7).

**Blocks:** Part 1-EXT (the remaining 3 archetypes) — deferred until
this gate is substantially through for the first archetype, so the
pattern that emerges here (which parts of Part 5/6/7's minimum bar
actually took real work, what BC-076 verification surfaced) is what gets
replicated, per the human's explicit instruction this pass.

### Part 1-EXT — Finish the remaining archetype set (Emergency, Engagement, Commerce-Restaurant) — now deferred, not parallel
Same pattern as BC-073/074/075: Agent workflow + memory-rehydration chain +
lead-mint sub-workflow + tool wiring, gstack-planned per archetype, built
against the now-hardened concurrency baseline from day one. Biggest known
unknown per archetype: which existing Convocore-era Tools (WF-0xx) are
reusable vs. need a same-shape lead-mint gate like appointment/consultation
got. **Blocked by Part 1 above, per this pass's explicit instruction** —
no longer "runs in parallel," starts once Part 1's gate is substantially
proven on at least one of the 3 shipped archetypes.

### Part 2 — Business info architecture: channels, integrations, business-info/KB, tool-calling core
**Resolved via gstack `/plan-eng-review`, 2026-08-31 (D1, D2 below) — no
longer an open question.** Grounded in `05_Platform_Builds/Zenny_SaaS/
Zenny_Raw_Product_Definition_v1.md`'s Section 4: "Knowledge — it needs to
actually know the business's real info... has to come from somewhere and
stay current."

**D2 — module boundary (locked: 4-part formalization).** Names a boundary
that mostly already exists in the built code, rather than inventing a new
one — each part changes at its own natural rate:

```
  ARCHETYPE AGENT (per client, per archetype — e.g. Commerce-Ecom Node)
  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                   │
  │  CHANNEL              INTEGRATIONS         BUSINESS-INFO/KB       │
  │  (delivery only)      (3rd-party conns)    (what it knows)       │
  │  ─────────────        ──────────────       ──────────────         │
  │  WhatsApp/IG/          client_connections    Persona:              │
  │  web chat param,       table — Shopify,       agent_prompts        │
  │  resolved by           WooCommerce,           (BC-062 pattern,     │
  │  BC-072's shared       Calendar/Calendly,     unchanged)           │
  │  session resolver.     etc. Unchanged.                            │
  │  Already exists,                              Catalog/KB layer:   │
  │  no new work here      Already exists,        NEW — see D1        │
  │  (see blueprint         no new work here                          │
  │  Part 4 for             beyond D1's sync                          │
  │  channel-gateway         path                                     │
  │  parity re-check)                                                 │
  │                                                                   │
  │                    ▼ both feed into ▼                             │
  │              TOOL-CALLING CORE (the Agent workflow itself,        │
  │              BC-073/074/075 pattern, unchanged) — gains one new   │
  │              tool: `Search Business KB`, generalized from the     │
  │              existing Notion+Pinecone pattern to every archetype  │
  └─────────────────────────────────────────────────────────────────┘
```

Rejected: folding business info into a bigger `agent_prompts` blob (caps
out fast — a real catalog can't live in a system prompt, and conflates
persona edits with catalog syncs, two different change-rates); a full
microservice split of channel/integrations/business-info (solves a scale
problem this pre-launch, single-n8n-instance platform doesn't have yet —
same reasoning the concurrency-hardening card already applied rejecting a
custom Postgres memory system).

**D1 — catalog/business-data sync mechanism (locked: phased, reuse
existing infra).** Standard practice for this problem (per a live search,
2026-08-31) is an ingestion layer with connectors for the client's real
commerce platform plus a KB/CMS layer for policy content — this locks the
same shape using what's already built, not a from-scratch design:

- **Commerce-ecom clients with a connected Shopify/WooCommerce
  integration:** periodic pull via the already-built, already-credentialed
  connections (`Wiki/credentials/shopify.md`, `Wiki/credentials/
  woocommerce.md`). Cadence matches the existing SCH-00x cron pattern
  (e.g. INT-012's cadence). Synced catalog data feeds the KB layer the
  same way INT-012 already ingests Notion content (chunk → embed →
  upsert), same Pinecone namespace-per-client isolation.
- **Everyone else** (appointment/consultation/emergency/engagement, and
  any commerce-ecom client without a Shopify/WooCommerce connection): the
  existing Notion+Pinecone KB pattern (INT-011/012,
  `Wiki/platform-quirks/notion-pinecone-kb-pattern.md`), generalized from
  Email-Manager-only into the cross-archetype `Search Business KB` tool.
  Business owner maintains a Notion page (hours, policies, FAQ, service
  descriptions) — already-proven ingest pipeline, unchanged.
- **Explicitly deferred, not built:** a generic website scraper/crawler
  (fragile, every client's site is a different target, no precedent in
  this codebase, high engineering risk for uncertain payoff) and a
  client-maintained feed/file upload as the *primary* mechanism (pushes
  real ongoing maintenance burden onto small-business owners — this
  platform's actual target per the archetype set).

**D4 — spreadsheet legs added to D1 (locked, 2026-08-31 second pass), per
explicit human ask.** D1 as first locked didn't cover clients who run
their real product list off a spreadsheet rather than Shopify/WooCommerce
— a real, common small-business case. Two additional legs, same reuse
logic as D1:

- **Clients with an existing Google Sheet:** native Google Sheets sync
  added to the same periodic-pull cadence as the Shopify/WooCommerce leg.
  **Flagged, not assumed:** n8n very likely already ships a native Google
  Sheets node — this needs live MCP verification by Execute during the
  future build (BC-076 candidate), not asserted as fact here. Excel
  (`.xlsx`) support rides the same leg if a client uploads a file instead
  of a live Sheet — same ingestion shape, different source connector.
- **Clients with neither Shopify/WooCommerce nor an existing sheet:**
  embed an open-source, self-hosted spreadsheet UI — **Baserow (MIT)** or
  **Grist (Apache-2.0)**, both real, mature, commercially-embeddable
  Airtable alternatives — as the actual "sheet-type page" surfaced inside
  Zenny's dashboard (see Part 6's D3 for the dashboard-architecture
  context this sits inside). Deliberately **not NocoDB**: it switched off
  AGPL-3.0 to a Sustainable Use License as of v0.301.0, no longer safe to
  embed in a commercial product the way Baserow/Grist still are.
  Structured rows entered there feed the same KB ingestion pipeline as
  the Notion leg (chunk → embed → upsert), not a separate mechanism.
- **Rejected:** a fully custom in-house grid/table editor component — real
  UI engineering effort (cell types, CSV import, validation) to rebuild
  what Baserow/Grist already do well; same resourcefulness miss D3's
  rejected option C would have been for the dashboard.

**Not decided here — a future BC's job:** the `Search Business KB` tool's
exact table/schema shape and how it wires into each archetype Agent; the
e-commerce/sheet sync workflow's exact cadence/diffing strategy and how
Pinecone chunks map to Shopify/WooCommerce/Sheet rows; which of Baserow vs.
Grist to actually deploy (both viable, not decided here); Baserow/Grist's
own hosting/ops cost as a new self-hosted service. This locks the boundary
and the sync-source decision, not the implementation. Recommended next
step: a dedicated Build Card (BC-076 candidate) planned against these
decisions.

Sources consulted for the D1 industry-practice check: [RAG for Customer Service 2026: Implementation Guide](https://heeya.fr/en/blog/rag-for-customer-service-2026), [Deploying an AI Shopping Assistant with RAG](https://www.blockchain-council.org/ai/deploying-ai-shopping-assistant-with-rag-product-catalog-reviews-policies/), [RAG Pipelines for Customer Support: Templates and Best Practices (2026)](https://techdailyshot.com/blog/rag-pipelines-customer-support-templates-2026). Sources for the D4 open-source spreadsheet check: [9 Best Open Source Airtable Alternatives in 2026](https://openalternative.co/alternatives/airtable), [NocoDB vs Baserow](https://blog.elest.io/nocodb-vs-baserow-which-open-source-airtable-alternative-should-you-pick/).

### Part 3 — Capability-breadth verification
Cheap, should ride alongside Part 1/2, not its own multi-day Build Card:
for each archetype, a real live test proving the Agent answers FAQ-style
and (where relevant) makes a sales-style recommendation without a tool
call, the way BC-073's AC1 already proved for commerce-ecom. If a gap is
found, it's a prompt-content fix, not a new tool — per the existing
resolution.

### Part 4 — Channel-gateway parity on the new runtime
WhatsApp + Instagram + web chat were required at launch per the original
architecture-lock decision (channel parity, not fast-follow). The old
Convocore Adapter tested this; the new own-runtime hasn't. Needs a real
audit: does BC-072's shared foundation already handle multi-channel
`external_id`/`channel` resolution correctly (it was built channel-aware),
or does each channel need its own webhook-to-runtime bridge built fresh.
**Likely blocks real client traffic** if any client needs WhatsApp/IG, not
just web chat — worth an early live-check even before full build.

### Part 5 — Client onboarding/provisioning pipeline, updated for own-runtime
BC-058-064's intake/provisioning process predates the Convocore→own-runtime
pivot. Needs a pass confirming `create_client_schema_from_template` and the
onboarding checklist still produce a working client end-to-end against the
new runtime (agent_prompts seeding, archetype module assignment, etc.) —
not just checked in isolation per archetype Build Card, but as a real
"onboard a brand-new client from zero" test.

### Part 6 — Client-facing dashboard: real scoped architecture
**Rewritten via gstack `/plan-eng-review`, 2026-08-31 (D3) — no longer just
"verify it still works."** The dashboard's real job was never fully
scoped: it needs to cover **channels** (per-client channel status/config),
**integrations** (Shopify/WooCommerce/Calendar/Calendly connections —
`client_connections`, already exists), **chats** (a real conversation/
inbox view against BC-072's `conversations`/`messages` tables), **the
business-info/KB surface** (Part 2's catalog/KB layer, including D4's
embedded Baserow/Grist sheet-type page for clients without Shopify/
WooCommerce or an existing sheet), **metrics** (leads, conversions,
appointments, escalations — data mostly already recorded, per
`Agent_Runtime_System_v1.md`'s own note that Growth/Conversion Engine
events "populate dashboard metrics"), and **settings** (client_config,
archetype module on/off, per-client thresholds).

**D3 — dashboard architecture (locked: steal Chatwoot's UX, no new
runtime dependency).** Chatwoot (MIT-licensed, self-hosted, unified
omnichannel inbox — live chat/WhatsApp/Instagram/Email/SMS, team
collaboration, reports, Agent Bot API) is a real, mature open-source
Intercom/Zendesk alternative whose information architecture (inbox
layout, channel-settings structure) maps closely onto everything this
Part needs. **Decision: keep the existing custom React/Vite/TS dashboard,
explicitly reference Chatwoot's UX/IA as a design input when building
each screen below — do not adopt Chatwoot as running infrastructure.**
Rejected: self-hosting Chatwoot as the real conversation/inbox layer and
wiring archetype Agents in via its Agent Bot API — a genuinely bigger,
more ambitious option (would eliminate most of the dashboard build) but a
real architectural bet: a second self-hosted service to run and secure,
a migration of the existing production dashboard's chat-facing surface,
and a one-way-ish door once client data lives there. Named explicitly as
the road not taken, not silently dropped — worth revisiting if the custom
build proves genuinely too slow once scoped in full.

**Still verify, from the prior Part 6 framing (unchanged, still needed):**
whatever screens already exist (lead-approval, connection-management,
client-config) against the new runtime's real data shapes — `conversations`/
`messages`/`leads` tables changed shape under BC-072. Scope this only
after a real read of the dashboard's current code against current schema.

**Not decided here — a future BC's job:** the actual screen-by-screen
design and build (channels/integrations/chats/business-info/metrics/
settings), informed by Chatwoot's IA per D3 but not copying its code;
which specific existing dashboard screens need fixing vs. which are new.

### Part 7 — Ops/monitoring
Nothing currently watches for what the expired `zenny-notification-sender`
credential blocker (Part 8) already proved can happen silently: a broken
dependency (credential, webhook, workflow) failing quietly until someone
manually finds it. Minimum bar before real client traffic: execution-failure
alerting on the core runtime workflows (BC-072 chain + each archetype
Agent), and a credential-expiry check that doesn't rely on someone noticing
by accident.

### Part 8 — Clear the disclosed credential blocker — CLOSED, live-verified (2026-08-31)
Human reconnected `zenny-notification-sender` (expired Gmail OAuth).
Execute live-verified via a throwaway test workflow bound to the same
credential ID the production nodes use — real send succeeded (Gmail
message ID `1a05730046f5a2e9`), not just checked for existence. **New
gap found in the same check, flagged not fixed:** the hourly Tool
Execution Fallback chain (`UTcdzMvOb7gCQM5J`) has 609 error executions
from an unrelated cause — a client's email-sync integration is missing
its `client_connections` row — still open, recommended for Part 4 or 7
when picked up. Full detail: `Wiki/log.md`
session-part8-credential-verify-and-bc076-planning.

### Part 9 — Pre-launch QA pass
Once Parts 1-7 are done: one real end-to-end pass per archetype, per
channel, against the concurrency-hardening standard already proven for
commerce-ecom — not a new invention, just applying BC-2026-08-31's own bar
platform-wide before the first real paying client goes live. Plus a
Supabase Security Advisor sweep (last full pass was BC-064) to catch any
new-RPC grant-exposure gaps introduced by Parts 1-2.

---

## Sequencing notes (light, not a Gantt chart)

**Superseded, third pass (2026-08-31):** the critical path is no longer
"finish the remaining archetypes." Per Part 1's new production-readiness
gate, the priority order is now:

1. Part 8 (credential reconnect) — 5-minute human action, do it whenever
   convenient, pure unblock.
2. Part 3 + Part 4 audits (capability-breadth, channel-gateway parity) —
   cheap, run in parallel, for the 3 shipped archetypes only.
3. BC-076 backend build + demo-business verification (D6) — now
   launch-critical, the single biggest remaining build in the gate.
4. Part 6's two launch-critical pieces (existing dashboard screens
   verified against new schema; BC-076's self-serve KB/catalog screen,
   D8) — the rest of Part 6 stays fast-follow.
5. Part 5 (onboarding pipeline confirmation) + Part 7's minimum alerting.
6. Part 9 (QA pass), per archetype independently (D7) — that archetype
   goes live the moment its own chain above clears.
7. Part 1-EXT (Emergency, Engagement, Commerce-Restaurant) — starts once
   Part 1's gate is substantially proven on at least one shipped
   archetype, not in parallel with it.

Parts 2's remaining "not decided here" items (KB tool schema/cadence,
Baserow-vs-Grist) get resolved as part of step 3-4 above, not separately.

## Explicitly not decided here

No effort estimates, no dates. Business-memory's boundary and sync source
ARE now decided (Part 2, above) — everything else stays a map of parts,
not a plan for any one part. Each remaining part gets its own gstack
`/plan-eng-review` pass when Commander schedules it, per the existing
planning bridge.

---

## GSTACK REVIEW REPORT — Part 2 architecture lock (2026-08-31)

Scope: two architecture decisions only (catalog-sync mechanism, module
decomposition) extending Part 2. Not a review of the full 9-part
blueprint, not a build.

| Section | Status | Findings |
|---|---|---|
| Step 0 (scope challenge) | Done | No 8+ file / 2+ new service smell — this locks a boundary + a sync-source choice, not an implementation. Existing-code reuse mapped: `client_connections` (integrations), `agent_prompts` (persona), Notion+Pinecone KB pattern, Shopify/WooCommerce credentials — all pre-built, all reused rather than rebuilt. |
| 1. Architecture review | Done, 2 decisions locked | D1 (catalog-sync mechanism) and D2 (module boundary) — both resolved via AskUserQuestion, both option A, both locked with real tradeoffs (see Part 2 body). Layer-2 industry check via WebSearch confirmed the recommended shape (platform-connector ingestion + KB/CMS layer) matches current practice, not a novel invention. |
| 2. Code quality review | No issues — no code changes in this pass, architecture-lock only. | — |
| 3. Test review | Deferred to the future BC | This session locks the boundary and sync source; the future BC that builds the `Search Business KB` tool and the e-commerce sync workflow must cover: sync success/failure per provider (Shopify down, WooCommerce down, malformed catalog response), KB fallback when a client's namespace is empty (matches INT-011's existing `client_config.archetype_settings` fallback pattern), catalog-staleness handling (sync cron missed a run), and the Agent's tool-call wiring itself (same pattern as BC-073/074/075's already-proven tool tests). |
| 4. Performance review | Flagged for the future BC | Embedding/upsert cost scales with catalog size per sync run (OpenRouter + Pinecone calls) — cadence choice (D1) should account for large-catalog clients, not just prove correctness on a small test roster. No action needed at this locking stage. |

**VERDICT:** Architecture locked for Part 2 (business info / catalog sync). Ready to translate into a scoped Build Card (BC-076 candidate) when Commander picks it up — implementation details (table shape, ingestion workflow, cadence) intentionally left to that card's own `/plan-eng-review` pass, per this review's Step 0 finding that this pass should stay a boundary-and-source decision, not a full spec.

**UNRESOLVED DECISIONS (first pass):**
- `Search Business KB` tool's exact schema, ingestion workflow, and per-archetype wiring — future BC.
- E-commerce sync cadence, diffing strategy, and Pinecone-chunk-to-product-record mapping — future BC.
- The rest of the 9-part blueprint (archetypes, channel parity, dashboard, ops, etc.) — untouched by this pass, each gets its own review when scheduled.

---

## GSTACK REVIEW REPORT — Part 2 (D4) + Part 6 (D3) scope broadening (2026-08-31, second pass)

Scope: two more architecture decisions, per explicit human instruction to
broaden (not shrink) scope and be resourceful about open-source reuse
before planning custom builds. Grounded in `02_Agent_Runtime_System/
Agent_Runtime_System_v1.md` (read this pass) — its original Level-3
"Business Memory" concept pointed at a Business Config/KB source
(originally Airtable, dropped with Convocore), and its Module 2 Enterprise
Expansion Audit already flags product-catalog/inventory-aware
recommendation as [MVP] gaps, both corroborating this doc's own direction
rather than contradicting it.

| Section | Status | Findings |
|---|---|---|
| Step 0 (scope challenge) | Done | Search-before-building check run live via WebSearch (Chatwoot, Baserow/Grist, NocoDB's license change) before any decision — the explicit human instruction this pass required. No 8+ file / 2+ new service smell — still an architecture-lock only, no code. |
| 1. Architecture review | Done, 2 decisions locked | D3 (dashboard: steal Chatwoot's UX/IA, no new runtime dependency — option A over adopting Chatwoot as real infra) and D4 (catalog sync: Google Sheets native sync + embedded Baserow/Grist for the "our own sheet page" case, NocoDB explicitly rejected for its license change) — both resolved via AskUserQuestion, both option A. |
| 2. Code quality review | No issues — no code changes in this pass. | — |
| 3. Test review | Deferred to the future BC(s) | The dashboard rebuild (Part 6) and the Sheets/Baserow-Grist sync leg (Part 2/D4) each need their own test coverage map when actually planned — not fabricated here for unscoped, unbuilt surfaces. |
| 4. Performance review | Flagged for the future BC | Running Baserow/Grist adds a new self-hosted service (smaller than Chatwoot's footprint, but real) — hosting/ops cost should be scoped alongside D4's implementation, not assumed free. |

**VERDICT:** Part 2 (business info) and Part 6 (dashboard) both broadened per instruction — architecture locked for both without shrinking scope: real open-source options were surveyed and two adopted as design/implementation inputs (Chatwoot's UX pattern, Baserow/Grist as real embedded infra), one explicitly rejected mid-check (NocoDB, license change) rather than recommended from stale assumption.

**UNRESOLVED DECISIONS (second pass):**
- Chatwoot-as-real-infra (D3 option B) — named as the road not taken, not closed forever; worth revisiting if the custom dashboard build proves too slow once fully scoped.
- Baserow vs. Grist — both viable, not decided; future BC's call.
- n8n's native Google Sheets node — flagged for live MCP verification by Execute, not assumed.
- Everything under "Not decided here" in Part 2 and Part 6 above (schema, ingestion workflow, screen-by-screen dashboard design) — future BC's job.
- The rest of the 9-part blueprint (archetypes 1/3/4/5, channel-gateway parity, onboarding, ops, credential blocker, QA) — untouched by either pass, each gets its own review when scheduled.

---

## GSTACK REVIEW REPORT — Part 1 production-readiness gate for the 3 shipped archetypes (2026-08-31, third pass)

Scope: re-sequence the blueprint's priority (production-harden the 3
shipped archetypes before starting the remaining 3) and lock 4 scope/
sequencing decisions (D5-D8: gate scope, BC-076 timing, rollout mode,
KB/catalog UI scope). Not a review of the full 9-part blueprint, not a
build.

| Section | Status | Findings |
|---|---|---|
| Step 0 (scope challenge) | Done | No 8+ file / 2+ new service smell — pure scope/sequencing lock on an existing doc, no code changes. Existing-code/doc reuse mapped: reused the blueprint's own Parts 3-9 rather than inventing new categories, reused PROJECT_STATE.md's already-disclosed gaps (credential blocker, provisional lead-scorer, untested approval-Edge-Function JWT) rather than re-deriving them. WebSearch skipped — this is a project-specific prioritization call, not an unfamiliar technical pattern needing external validation. |
| 1. Architecture review | Done, 4 decisions locked | D5 (gate scope: launch-critical only, not full platform readiness — human accepted recommendation), D6 (BC-076 timing: hard gate, human explicitly rejected the fast-follow recommendation and required demo-business verification before any real client), D7 (rollout mode: independent per-archetype, human accepted recommendation), D8 (KB/catalog UI scope: hybrid — self-serve UI gates real-client launch, demo businesses can be manually populated, human's own explicit framing). D6 is the one place this pass's human decision overrode the AI recommendation — logged plainly, not smoothed over. |
| 2. Code quality review | No issues — no code changes in this pass, scope/sequencing lock only. | — |
| 3. Test review | Deferred to the future BC(s) | BC-076's own future Build Card must cover demo-business verification as a real acceptance criterion (D6), not just unit-level tool tests — the human's explicit bar is "verified... with demo business made by ourselves," which is an end-to-end test requirement, not a code-review checklist item. The channel-gateway audit (Part 4) and onboarding-pipeline confirmation (Part 5) each need their own live test pass when picked up — not fabricated here for unscoped work. |
| 4. Performance review | Not applicable this pass | No performance-sensitive architecture introduced — this locks priority order and gate membership, not implementation. |

**VERDICT:** Part 1 re-sequenced and locked: production-hardening the 3 shipped archetypes (Commerce-Ecom, Appointment, Consultation) is now the explicit priority over starting the remaining 3 (moved to Part 1-EXT, deferred). Gate scope (D5), BC-076's launch-critical status (D6), independent per-archetype rollout (D7), and the KB/catalog UI's hybrid scope (D8) are all locked with real tradeoffs recorded. Ready for Commander to translate the sequencing above into scoped Build Cards (starting with Part 8's trivial credential unblock and the BC-076 backend build) as each is picked up.

**UNRESOLVED DECISIONS:**
- BC-076's exact table/schema shape, ingestion workflow, and per-archetype tool wiring — still a future BC's job, unchanged from the first pass; D6 only changed the launch-gate timing, not the implementation spec.
- Which specific existing dashboard screens (lead-approval, connection-management, client-config) actually need fixing vs. already work against the new schema — genuinely unknown until Execute reads the current dashboard code against current schema, per Part 6's own "still verify" framing.
- The demo business(es) used for BC-076 verification (D6) — how many, what archetype(s), how realistic the test data needs to be — not scoped here, a future BC's call.
- Part 1-EXT (the remaining 3 archetypes) — untouched by this pass beyond confirming it's now sequenced after, not parallel with, Part 1's gate.
- Everything under "Not decided here" in Part 2 and Part 6 (first and second pass) — still open, unchanged by this pass.
