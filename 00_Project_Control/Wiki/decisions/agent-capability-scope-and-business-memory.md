# Agent Capability Scope & Business Memory — SCOPED OUT of BC-074/075 (2026-08-31)

## BC-076-Card2b build-ready spec locked + build started, blocked on Credential Gate (2026-09-01, seventh pass)

Full detail: `docs/designs/zenny-launch-blueprint.md`'s "BC-076-Card2b
build-ready spec" section + its seventh-pass GSTACK REVIEW REPORT,
`06_Infrastructure/n8n/Workflow_Registry.md`'s SCH-004 + new Sheets
Ingestion entries, `Wiki/log.md` session-bc076-card2b-blocked.

**Ten real decisions locked (D14-D23):** client-designated key column over
row index (D14); one designated tab per sheet (D15); cross-leg deletion
deferred to Card 3, narrowed (D16); continue-past-bad-row partial failure
(D17); new `source_config jsonb` column over more delimited `source_ref`
segments (D18); composite vector ID + full metadata contract, an
outside-voice catch correcting a real collision bug in the first draft
(D19); delete-then-reinsert per row key every sync, another outside-voice
catch closing 2 bugs (shrinking chunk count, edited key values) with one
mechanism (D20); client-designated column whitelist over ingest-everything,
closing a real content-leak risk (D21); one global service account for now,
blast-radius tradeoff documented explicitly (D22); proceed with the
revised Card 2b rather than a separate hardening pre-card, since D18-D21's
fixes already generalize past Sheets (D23).

**A real live incident found and fixed before it happened, unrelated to
the new build but discovered while starting it:** `SCH-004`'s published
version was still querying a column (`notion_page_id`) renamed away during
BC-076's first slice — its next scheduled run would have broken the
nightly Notion KB sync for every client. A prior session's own registry
note had wrongly asserted this was already fixed, without ever confirming
the fix was published, not just drafted. See Workflow_Registry.md.

**Real design corrections made during the build itself, not just
planning:** Pinecone's docs don't clearly confirm delete-by-metadata-filter
works on serverless indexes, so D20's cleanup mechanism uses delete-by-ID
against deterministic candidate IDs instead — same outcome, no unverified
claim underneath it. `content_hash`/`source_ref_hash` dropped for simpler
mechanisms with no unverified crypto-module dependency in n8n's Code node
sandbox. D17's "blank cell" trigger narrowed to the key column specifically
(a blank whitelisted content column is legitimate data, not a failure).

**Blocked, Credential Gate (Standing Rule) — not a workaround target:**
the new Sheets ingestion workflow (13 nodes, structurally validated) and
SCH-004's generalized dispatcher are both built and correct, but neither
can publish until a real Google service-account credential exists — none
does yet (`list_credentials` confirmed 0 results). Live-verified this
session (closing a real gap, not assuming): n8n's Google Sheets node does
natively support `authentication: 'serviceAccount'`, confirmed from its
type definition, not just the read operation's existence as the fifth
pass had checked. Human needs to create the GCP service account + n8n
credential + share a test Sheet before Execute can finish live-verifying
this card.

## BC-076-Card1 SHIPPED (2026-08-31) — the severe client_id bug is fixed, live-verified

Full detail: `06_Infrastructure/n8n/Workflow_Registry.md`'s Search Business
KB Tool entry, `Wiki/log.md` session-bc076-card1-shipped. Summary: the
tool's sub-workflow now has a real Webhook trigger (matching WF-002/013/
015), all 3 Agents call it via `httpRequestTool` (matching
`Check_availability`) with `client_id` static per D13. Live-verified with
2 real seeded facts across 2 clients: correct-tenant retrieval AND
cross-tenant non-leakage both proven, not assumed. Cards 2a/2b/3/4 remain
the next planned work, each needing its own `/plan-eng-review` pass.

## BC-076 unblock sequence locked (2026-08-31, sixth pass — gstack `/plan-eng-review`)

Human explicitly asked for a proper step-by-step plan before any more
Build Cards, not another ad-hoc "what's next." Full detail:
`docs/designs/zenny-launch-blueprint.md`'s new "BC-076 unblock sequence"
section + its sixth-pass GSTACK REVIEW REPORT. Summary:

- **Card 1 (build-ready now):** fix `Search_business_kb` — real Webhook
  trigger + `httpRequestTool` (same pattern as `Check_availability`),
  `client_id` bound as a static main-chain reference, never LLM-supplied
  (a real tenant-isolation gap in the first draft, caught by Codex's
  outside-voice pass, corrected before being accepted).
- **Card 2a:** investigate the human's real dashboard Google OAuth
  reconnect error + confirm whether the dashboard supports creating new
  test-client logins today, then provision Client A (Calendar+Gmail+
  Shopify) and Client B (Google Calendar+WooCommerce).
- **Card 2b (independent of 2a):** Google Sheets ingestion via a
  **service account** (client shares their Sheet with Zenny's service
  account email), not OAuth — human raised the real concern first: the
  app's existing Gmail/Calendar OAuth is unverified (100-user lifetime
  cap), and a 3rd sensitive scope would only make that worse. Cross-
  references `Provider_App_Setup_Guide_v1.md` §1.8's pre-existing (and
  possibly stalled) verification-submission decision — needs a direct
  human check.
- **Card 3:** remaining ingestion legs (Shopify/WooCommerce/Notion/
  Baserow) against Card 2a's real clients, plus a new deletion/staleness
  requirement (Codex catch — the original spec's deterministic vector
  IDs handle re-ingestion but not content removed from the source).
- **Card 4:** a scheduled automated canary/smoke-test — this session's
  own 2 severe undetected-bug findings are the reason manual-only
  verification isn't enough; must use a fresh conversation each run and
  assert real grounded content, not just "no error."

Only Card 1 is a formal Build Card from this pass; 2a/2b/3/4 are scoped,
each needs its own `/plan-eng-review` when picked up.

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
