# Agent Capability Scope & Business Memory — SCOPED OUT of BC-074/075 (2026-08-31)

## BC-076 severe unfixed bug found (2026-08-31, follow-up pass) — the tool cannot retrieve real content for any client

The same-day follow-up pass that wired all 3 archetypes' system prompts
to use `Search_business_kb` also live-verified the tool with real
seeded content, and found `client_id` resolves to `null` on every
call — a genuine n8n platform limitation (a `toolWorkflow` node invoked
as an AI Agent tool cannot reliably resolve `$()`/`$json`/`$node[]`
references to sibling main-chain nodes), reproduced 6 independent ways.
**Consequence: the tool always queries Pinecone under an empty/wrong
namespace, so it will never return real client-scoped content even
once the remaining 4 ingestion legs are built.** This is now the real
blocker on BC-076's launch gate (D6/D9), ahead of the ingestion legs
themselves — a wired-but-broken tool doesn't satisfy "verified," and
building more ingestion into a tool that can't retrieve it changes
nothing observable. Two untried candidate fixes and the full repro
detail: `06_Infrastructure/n8n/Workflow_Registry.md`'s Search Business
KB Tool entry, `Wiki/log.md` session-bc076-followup-kb-client-id-bug.

## BC-076 build-ready spec locked (2026-08-31, fifth pass — schema, ingestion, verification plan)

Now that Part 1/D6 made BC-076 launch-critical, this pass produced the
actual implementation spec (full detail: blueprint's new "BC-076
build-ready spec" section + its fifth GSTACK REVIEW REPORT):

- **Schema:** `control.client_kb_source` generalized (source_type enum
  covering notion/shopify/woocommerce/google_sheets/baserow, one row per
  source, multiple sources can feed one client's namespace). New
  dedicated Pinecone index `zenny-business-kb` (not reusing Email
  Manager's `zenny-email-kb`), same proven 1536-dim/cosine/
  namespace-per-client shape.
- **New tool:** `Search Business KB`, one definition wired into all 3
  shipped archetype Agents (Commerce-Ecom, Appointment, Consultation) —
  same retrieval shape as INT-011, generalized into a tool call.
- **5 ingestion legs**, all chunk→embed→upsert: Shopify, WooCommerce,
  Notion (INT-012 unchanged, decoupled from Email-Manager-only scope),
  Google Sheets (native n8n node, confirmed live — closes D4's flagged
  verification), Baserow (D10, native n8n node has real batch ops,
  Grist's doesn't — a live-verified, not assumed, tie-breaker).
- **D9 (verification plan):** per-archetype minimum — 4 demo businesses
  for Commerce-Ecom (one per catalog source) gate its own launch; 1
  shared Notion-KB demo business gates Appointment + Consultation
  together (same mechanism, two Agent-wiring checks). Matches D7
  (independent rollout) and D6 (nothing ships unproven) simultaneously.
- **D10 (Baserow over Grist):** locked with concrete evidence, not
  reputation — Baserow's native n8n node supports batch row operations
  (200/request), Grist's doesn't.

Step 0 fired a real complexity-check STOP (5 new workflows + 1 tool + 3
Agent wirings) — human confirmed building all 5 legs in one Build Card
rather than phasing, consistent with D6's explicit wording.

## Production-readiness gate locked (2026-08-31, fourth pass — priority reversal + BC-076 launch-gate)

Human explicit instruction: stop treating "finish the remaining 3
archetypes" as next-up — fully production-harden the 3 already-shipped
archetypes (Commerce-Ecom/BC-073, Appointment/BC-074, Consultation/BC-075)
first, so the pattern replicates to the rest. Locked via gstack
`/plan-eng-review` (full detail: blueprint's Part 1 + its third GSTACK
REVIEW REPORT):

- **Gate scope (D5):** launch-critical only — credential reconnect,
  capability-breadth spot-check, channel-gateway audit, onboarding-
  pipeline confirmation, minimum execution-failure alerting, two
  launch-critical dashboard pieces (existing-screen verification + the
  new KB/catalog self-serve screen), and a final QA pass, all per
  archetype. Full dashboard rebuild and full ops/monitoring stack stay
  fast-follow.
- **BC-076 timing (D6) — REVERSED from this page's own earlier framing:**
  the business-memory/KB tool is now launch-critical, not fast-follow.
  Human's explicit call: "everything should be built, verified before any
  client gets live... test it if required with demo business made by
  ourselves." The backend must be built and verified against 1-2
  internally-built demo businesses before any real client launches on any
  of the 3 archetypes.
- **Rollout mode (D7):** independent per-archetype — each of the 3
  archetypes goes live as soon as its own gate items clear, not bundled.
- **KB/catalog UI scope (D8):** hybrid — the self-serve dashboard screen
  for a client to manage their own KB/catalog is ALSO launch-critical
  (reopening D3's dashboard-fast-follow call for this one screen only);
  the internal demo businesses used to verify BC-076 itself can be
  populated manually, no UI needed for those.

**Net effect on this page's own prior status ("not decided, not built"):**
still not built, but no longer open-ended — this is now the explicit,
ordered gate a future BC-076 Build Card must satisfy before any of these
3 archetypes can onboard a real paying client.

## Scope broadened (2026-08-31, third pass — dashboard + spreadsheet sync)

Human explicitly instructed: read `02_Agent_Runtime_System/
Agent_Runtime_System_v1.md` first (the original pre-pivot spec — its
Level-3 Business Memory concept originally pointed at a Business Config/
KB source, corroborating this decision's direction), look for real
open-source projects/patterns to reuse before planning custom builds, and
broaden scope rather than shrink it. Two more decisions locked via a
second `/plan-eng-review` pass (full detail + tradeoffs in the blueprint's
Part 2/Part 6 and its second GSTACK REVIEW REPORT):

- **Dashboard architecture (D3):** keep the existing custom React/Vite/TS
  dashboard, explicitly reference Chatwoot's (MIT-licensed, open-source
  Intercom/Zendesk alternative) UX/information-architecture when building
  the channels/integrations/chats/business-info/metrics/settings screens
  — no new runtime dependency. Adopting Chatwoot as real running
  infrastructure (self-hosted, Agents wired in via its Agent Bot API) was
  considered and named explicitly as the road not taken, not silently
  dropped — a bigger, more ambitious bet worth revisiting later.
- **Spreadsheet catalog sync (D4, extends D1):** native Google Sheets
  sync (n8n's likely built-in node, flagged for live verification) for
  clients with an existing sheet; an embedded open-source spreadsheet UI
  — Baserow (MIT) or Grist (Apache-2.0) — as the actual "sheet-type page"
  for clients with neither Shopify/WooCommerce nor an existing sheet.
  NocoDB explicitly rejected — it switched off AGPL to a Sustainable Use
  License, no longer safe to embed commercially.

## Architecture locked (2026-08-31, second pass — module boundary + sync source)

Follow-up to the resolution below: the human asked whether the light
launch blueprint (`docs/designs/zenny-launch-blueprint.md`) actually
resolved HOW business memory works, not just that it's deferred. It
hadn't — ran a real gstack `/plan-eng-review` pass and locked two
decisions (full detail + tradeoffs in the blueprint's Part 2 and its
GSTACK REVIEW REPORT):

- **Module boundary:** 4 parts per archetype Agent — Channel (delivery
  param, already exists), Integrations (`client_connections`, already
  exists), Business-Info/KB (persona `agent_prompts` + the new catalog/KB
  layer below), Tool-calling core (the Agent workflow, gains one new
  `Search Business KB` tool). Names a boundary that mostly already exists
  in the built code rather than inventing a new one.
- **Catalog/business-data sync mechanism:** phased — Shopify/WooCommerce
  API pull (reusing already-built, already-credentialed connections) for
  e-commerce clients with one connected; the existing Notion+Pinecone KB
  pattern, generalized cross-archetype, for everyone else (hours,
  policies, FAQ, non-catalog archetypes). Generic website scraping and
  client-maintained feed uploads explicitly deferred — higher engineering
  risk / burden than either reused path.

**Still not decided — a future BC's job:** the KB tool's exact schema and
per-archetype wiring; the sync workflow's cadence/diffing strategy. This
pass locked the boundary and the source, not the implementation.

## Resolution (2026-08-31, BC-074/075 eng review)

Resolved via AskUserQuestion during the BC-074/075 planning pass, not left
open: **deferred to a separate future Build Card, not folded into
BC-074/075.** Capability breadth (FAQ, sales-style recommendation) turned
out to be a prompt-content question, not a missing tool-calling capability
— BC-073's own AC1 already proves the LLM answers FAQ/availability directly
with no tool call. The real gap is business memory itself: a durable,
structured, cross-archetype store beyond the single static per-client
`agent_prompts` string. Recommendation for whoever scopes that future card:
generalize the already-live Notion+Pinecone KB pattern (Email Manager,
INT-011/012 — [[../platform-quirks/notion-pinecone-kb-pattern]]) into a new
read-only `Search Business KB` tool available to every archetype's Agent,
not just Email Manager. Not designed further — this is a pointer, not a
spec. Full reasoning: `docs/designs/zenny-saas-runtime-pivot.md`'s "BC-074/075
Eng Review" section.

## What was raised

Human review after BC-2026-08-31-concurrency-hardening raised two related
points, explicitly **not** a build request yet — a standing design
concern to carry into every future archetype Build Card:

1. **Capability breadth**: does an archetype agent (Commerce-Ecom today,
   appointment/consultation next) actually cover the full job — FAQ
   answering, product recommendation in a real sales-person style, and
   whatever else that archetype's job actually requires — or does it
   only cover the narrow tool-calling flows built so far (cart,
   verification, booking)?
2. **Business memory, distinct from chat memory**: the agent needs a
   second memory class alongside per-conversation chat history —
   durable business-level facts (business info, policies, product
   catalog/details, FAQ answers, etc.) that aren't tied to any one
   conversation and must be available to every conversation for that
   client. **Applies to all 6 archetypes, not just commerce-ecom.**

## Why this isn't a Finding-5 bolt-on

This is a different axis from BC-2026-08-31's concurrency fixes (which
were about correctness under concurrent load for behavior that already
existed). This is about whether the *behavior itself* — what the agent
knows and can do — is complete for the archetype's actual job. It's an
architecture-shaped question (where does business memory live, how does
an archetype's tool-calling scope get defined, is business memory
per-client-schema or a shared+overridable pattern like
`agent_prompts`/`email_categories`) that belongs in front of BC-074/075's
build, not bolted onto a card already in flight.

## Status: not decided, not built

No RPC, table, or workflow exists for "business memory" yet. Product
context so far (Convocore's Knowledge Base attempt, then INT-011/012's
Notion+Pinecone pattern for Email Manager specifically — see
[[../platform-quirks/notion-pinecone-kb-pattern]]) is the closest existing
precedent and should be checked first before inventing a new mechanism —
per the Document Resolution Authority's "search broadly first" rule.

**Next step, per CLAUDE.md's Commander→gstack→Execute planning bridge**:
this gets folded into the gstack planning pass for BC-074/075 as a
cross-archetype architectural input, not resolved by Commander directly.
If gstack's plan concludes it's genuinely out of BC-074/075's scope,
that's a legitimate call — the requirement is that it gets *considered*
at the architecture stage (e.g. does the appointment/consultation schema
need a business-memory table now to avoid a migration later), not
silently deferred without a decision.

## See also

- [[../platform-quirks/notion-pinecone-kb-pattern]] — closest existing
  precedent (Email Manager's KB, not agent-wide).
- [[../platform-quirks/n8n-openrouter-direct-llm-pattern]] — the
  per-client-schema-overridable-prompt pattern (`agent_prompts`), a
  possible structural precedent for per-client business memory too.
- `06_Infrastructure/n8n/Workflow_Registry.md`'s "Zenny Own Runtime
  (Phase 14)" section — where BC-074/075 will land once planned.
