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

### BC-076 build-ready spec (locked 2026-08-31, fifth pass — D9/D10, the actual implementation)

Part 1/D6 made BC-076 launch-critical. D1/D2/D4 locked its boundary and
sources. This section locks the actual build-ready spec — table shape,
ingestion workflow design, tool wiring, and verification plan — so
Commander can package a formal Build Card against it. Step 0 flagged the
real complexity (5 ingestion legs + 1 new tool + wiring into 3 Agents) as
one Build Card, not several — human confirmed: D6's "everything...
verified" instruction was explicit enough that phasing any leg would be
re-litigating a closed decision, not honoring it.

**Schema (mechanical extension of the proven INT-011/012 pattern —
`[[../platform-quirks/notion-pinecone-kb-pattern]]`, no new invention):**

```
control.client_kb_source                    (NEW — generalizes the
  ├─ client_id            uuid                existing client_kb_source
  ├─ source_type          enum('notion',       table beyond Email
  │                              'shopify',     Manager-only)
  │                              'woocommerce',
  │                              'google_sheets',
  │                              'baserow')
  ├─ source_ref           text        -- notion_page_id / shopify
  │                                      connection_id / sheet_id /
  │                                      baserow_table_id, per source_type
  ├─ last_synced_at       timestamptz
  └─ sync_status          text        -- mirrors client_connections'
                                          status convention

Pinecone: NEW dedicated index `zenny-business-kb` (not the existing
`zenny-email-kb` — different metadata shape, different tool surface;
keeping them separate is "boring by default," not a new pattern).
Same proven shape: serverless, AWS us-east-1, 1536-dim cosine
(text-embedding-3-small via OpenRouter, zero new credential).
Namespace = client_id (same structural per-client isolation as the
email-KB pattern — one client can have MULTIPLE source rows feeding
the SAME namespace, e.g. a Shopify catalog + a Notion FAQ together).
```

**New tool: `Search Business KB`** — wired into all 3 shipped archetype
Agents (Commerce-Ecom, Appointment, Consultation), same shape as
INT-011's retrieval leg generalized into a tool call: embed the query →
Pinecone query (`namespace = client_id`, topK 4) → ground the Agent's
answer in returned chunk text → fall back to `client_config.
archetype_settings` on zero matches (identical fallback INT-011 already
uses). One tool definition, reused verbatim across all 3 Agent workflows
— not 3 separate tools.

**Ingestion workflows — 5 legs, same chunk→embed→upsert shape as
INT-012, same SCH-00x cron cadence convention:**

| Leg | Source | Node | Chunk unit | Deterministic vector ID |
|---|---|---|---|---|
| Shopify | existing Client Credentials Grant connection (`[[../credentials/shopify]]`) | HTTP Request (products.json) | 1 product (title+description+price+variants) | `shopify_product_id` |
| WooCommerce | existing manual-key connection (`[[../credentials/woocommerce]]`) | HTTP Request (`/wp-json/wc/v3/products`) | 1 product | `woocommerce_product_id` |
| Notion (generalized) | existing INT-012 mechanism, unchanged, decoupled from Email-Manager-only scope | native Notion node | ~700-char paragraph-packed chunk | `notion_block_id + chunk_index` (unchanged) |
| Google Sheets | client's existing sheet | **native `n8n-nodes-base.googleSheets` node, `sheet.read` op — confirmed live via n8n MCP `search_nodes`/`get_node_types` this session, not assumed** (closes D4's flagged verification) | 1 row | stable row-key column (client-designated) or row index |
| Baserow (D10 winner) | embedded Baserow table (D8's self-serve screen) | **native `n8n-nodes-base.baserow` node, `row.getAll`/`batchCreate` — has real batch operations (200 rows/request), the concrete reason D10 picked Baserow over Grist (Grist's native node has no batch op)** | 1 row | Baserow row ID |

**D10 — Baserow over Grist for the embedded sheet-type page (locked).**
Verified live via n8n MCP, not assumed: `n8n-nodes-base.baserow` supports
`batchCreate`/`batchUpdate`/`batchDelete` (200 rows/request) — matches a
full-catalog sync's actual shape. `n8n-nodes-base.grist` exposes only
single-row create/update/delete/getAll, no batch op — would need N
individual calls per sync. Baserow's own Application Builder also fits
embedding a client-facing catalog page more directly than Grist's
spreadsheet-formula strength, which nothing here needs. Grist's larger
community (11,371 vs 5,460 GitHub stars) doesn't offset the concrete
technical gap. [Baserow vs Grist](https://www.getgrist.com/lookup/grist-vs-baserow/), [Baserow/Grist n8n integration](https://n8n.io/integrations/baserow/and/grist/).

**D9 — verification plan (locked: per-archetype minimum, not bundled).**
Matches D7 (independent rollout) + D6 (nothing ships unproven) at once —
an archetype's launch only waits on the legs its own clients actually
use, never on an unrelated archetype's leg:

- **4 demo businesses for Commerce-Ecom** — one per catalog source
  (Shopify-connected, WooCommerce-connected, Google-Sheets-connected,
  neither/Baserow-embedded). Commerce-Ecom's own launch waits on all 4,
  since a real client could arrive with any of the 4 catalog shapes.
- **1 shared demo business for Appointment + Consultation** — a Notion
  KB (FAQ/policies), synced once, then the `Search Business KB` tool
  call verified live against BOTH archetype Agents using that same
  synced content (one ingestion test, two tool-wiring tests — the
  mechanism is identical, only the calling Agent differs).
- **"Verified" means, per demo business:** the real ingestion workflow
  executed live (not `test_workflow`-pinned) with a genuine Pinecone
  upsert confirmed via Pinecone's own REST response (matching BC-049's
  proof style), AND a real live Agent tool-call proving `Search Business
  KB` returns grounded, correct answers from that demo business's actual
  synced content (matching BC-073 AC1's proof style) — not a code-review
  pass, an actual end-to-end execution.

**Not decided here — Execute's job during the build:** exact chunk-size
tuning per source type, exact Baserow table schema/column names for the
embedded catalog page, the demo businesses' real synthetic data content.

### BC-076 unblock sequence (locked 2026-08-31, sixth pass — the severe client_id bug + everything it was blocking)

The fifth pass's build-ready spec shipped its first slice, then a same-day
follow-up found `Search Business KB`'s `client_id` parameter resolves to
`null` on every call — confirmed via a real n8n community thread describing
the identical symptom (`toolWorkflow` node invoked as an `ai_tool` cannot
reliably resolve `$()`/`$json`/`$node[]` references to sibling main-chain
nodes; unresolved upstream, no official n8n fix exists). This sixth pass
plans the full unblock, plus three new gaps the human raised directly:
no verification/smoke-test practice exists, no real (non-synthetic)
integration-testing process exists, and Google Sheets' OAuth path would
have collided with a real, already-flagged constraint (see D11 below).

Step 0 fired a real STOP a second time — bug fix + 5 ingestion legs + a
new verification system + a new credential-testing process + a Sheets
design decision is 5 separate pieces of work, not one Build Card. Human
confirmed the 5-card split below. **Only Card 1 is build-ready from this
pass — Cards 2a/2b/3/4 are scoped, not specced; each gets its own
`/plan-eng-review` pass when Commander picks it up, matching this doc's
own established convention (Parts 3-9 are outlines until picked up).**

**D11 — Google Sheets via service account, not OAuth (locked).** Human
raised a real, correct concern before this was decided: the app's existing
Gmail (restricted scope) + Calendar (sensitive scope) OAuth consent screen
has not passed Google's verification review and is capped at 100 lifetime
users (unresettable) — adding a third sensitive scope (Sheets) would widen
what an eventual verification submission has to cover and could force
re-consent from already-connected clients, for no real benefit. **Real
alternative found and locked instead:** a Google **service account**
(Zenny's own fixed identity, not a client's delegated OAuth grant) — the
client shares their specific Sheet with the service account's email
(Viewer access), the same flow as sharing a doc with a colleague. Zero
OAuth consent screen, zero new scope, zero verification exposure — and
per n8n's own docs, service accounts are the recommended pattern for
automated/production access, not a workaround. Sync cadence: extend
SCH-004's existing cron job (already polls `client_kb_source` for due
clients) to also handle `source_type='google_sheets'` rows — reuses
proven scheduling/due-client logic rather than a second scheduler.
**Flagged, not solved here:** the service account fix removes ONE future
scope-creep risk but does NOT resolve the existing Gmail/Calendar
unverified-app status or its 100-user lifetime cap — that's a separate,
larger, still-open item (cross-references Part 1's launch gate) that
needs its own decision before scaling past a handful of real clients,
not before Card 2a/2b below (unverified apps still function under the
cap, with a warning screen, which is acceptable for a 2-3-test-client
phase).

**D12 — verification/smoke-test mechanism: scheduled automated canary,
not manual-only (locked).** This exact session found 2 severe bugs
(a boolean-typed IF-node condition; an n8n zero-item-input silently
skipping downstream nodes while the execution still reported "success")
that had been silently breaking every brand-new customer's first message
since the 3 shipped archetypes launched — undetected for days because
nothing was watching, and "run `/qa` before shipping" is exactly the
practice that already failed to catch this class of bug. **Locked
design, refined by outside-voice review (see VERDICT below):** a
scheduled canary workflow fires a synthetic message per shipped
archetype against a dedicated canary test client, using a **fresh
`external_id`/conversation every run** (not a reused warm one — the bugs
found were specifically in the cold, first-message path, so a canary
that only ever exercises a warm conversation would never have caught
them), and asserts the **actual grounded response content**, not just
"no error was thrown" (a "success" execution that silently did nothing
is exactly what slipped through last time). Alerts via the existing
`zenny-notification-sender` credential — Card 4 must include a one-time
real test that the alert path itself fires, not just that it's wired.

**D13 — Card 1's tenant-isolation correction (locked, outside-voice
catch).** The fix everyone already agreed to (give `Search_business_kb` a
real Webhook trigger, call it via `httpRequestTool` like `Check_availability`
instead of the broken `toolWorkflow` mechanism) had a real security gap in
its first draft: `client_id` was going to be `$fromAI`-supplied, meaning
the LLM would control tenant identity — a cross-tenant data-leak vector if
the model hallucinates or is manipulated via injected conversation text.
**Corrected:** `client_id` is a static expression referencing the calling
Agent's own main-chain trigger node (`$('<Archetype> Node Trigger').item.json.client_id`)
— the exact pattern `Check_availability`/`Cancel_appointment`/
`Get_booking_status` already use successfully. The LLM never sees or
supplies `client_id`; only `query` is `$fromAI`. Zero added effort — this
is correcting the design to match the pattern already proven safe
elsewhere in this codebase, not a new mechanism.

**Card 1 — full build-ready spec (ready now):**
- Give `Zenny Runtime - Search Business KB Tool (BC-076)` (`uZdHEI8tQ1qeeHzt`)
  a real Webhook trigger (same shape as WF-002/WF-013/WF-015), replacing
  its `executeWorkflowTrigger`.
- Rewire all 3 Agent workflows (Commerce-Ecom `IKOAp1dmnqul5uuQ`, Appointment
  `VcaqfwExxxiknOrO`, Consultation `pTtw04cyetGDPKGd`) to call it via a new
  `httpRequestTool` node instead of the current `toolWorkflow` node —
  `client_id` static (per D13), `query` via `$fromAI`.
- **Definition of Done, tightened per outside-voice review:** a real
  seeded Pinecone fact + a real live Agent conversation must prove (a) the
  tool is actually invoked, (b) the returned content matches the seeded
  fact for THAT client's namespace specifically, and (c) a second client's
  namespace does NOT see it — a coherent-sounding answer alone does not
  satisfy this bar.
- **Flagged, not fixed here (pre-existing, inherited by this fix, not
  introduced by it):** none of `Check_availability`/`Cancel_appointment`/
  `Get_booking_status`'s real production webhooks appear to carry any
  auth beyond the URL itself, and this fix's new webhook inherits the
  same gap. Worth a dedicated security pass across all tool webhooks
  before real client traffic scales — not blocking this fix, which only
  matches existing parity.

**Card 2a — dashboard OAuth investigation + test-client provisioning:**
investigate the human's real Google OAuth reconnect error on the dashboard
(root cause unknown, error details not yet gathered), and confirm whether
the dashboard even supports creating new test-client logins today (a real
open unknown, not assumed either way) before provisioning Client A
(Calendar + Gmail + Shopify) and Client B (Google Calendar + WooCommerce).
**Real sequencing risk, not a footnote:** Card 3 depends on these real
clients existing and being genuinely connected — if the dashboard doesn't
support test-login creation today, that becomes Card 2a's actual scope,
not a quick provisioning step.

**Card 2b — Google Sheets ingestion leg (service account, per D11):**
independent of Card 2a's OAuth investigation — doesn't touch the broken
flow at all, can ship even if 2a stalls.

**Card 3 — remaining ingestion legs (Shopify, WooCommerce, generalized-
Notion, Baserow), built against Card 2a's real clients:** **honesty
flag from outside-voice review:** these 4 legs are not equivalent effort
— different auth models, pagination, rate limits, and deleted-content
semantics per source (Notion is page/database-grant-based, not a flat
API list; Shopify/WooCommerce paginate differently; Baserow's batch ops
don't exist on the others). Card 3's own future `/plan-eng-review` pass
should decide whether it stays one card or splits per-leg once scoped in
full — not decided here. **New requirement, not in the original fifth-pass
spec:** a deletion/staleness strategy — the original spec's deterministic
vector IDs (e.g. `shopify_product_id`) make re-ingestion idempotent but
say nothing about content REMOVED from the source; without a stale-chunk
cleanup step, a discontinued product stays answerable forever. Card 3
must design this, not just the upsert path.

**Card 4 — scheduled canary/smoke-test workflow, per D12.**

**Sequencing:** Card 1 → Card 2a/2b (parallel, independent) → Card 3.
Card 4 can build in parallel with Card 3 once Card 1 is done.

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
   **Sixth pass (2026-08-31) locked the actual unblock sequence: Card 1
   (fix `Search_business_kb`'s client_id bug) → Card 2a/2b (test-client
   provisioning + dashboard OAuth investigation; Sheets ingestion via
   service account, parallel to 2a) → Card 3 (remaining ingestion legs)
   → Card 4 (canary/smoke-test, parallel with Card 3). Only Card 1 is
   build-ready; 2a/2b/3/4 need their own `/plan-eng-review` pass each
   when picked up.** **Cross-reference, needs a direct human check before
   this sequence's Card 2a lands:** `Provider_App_Setup_Guide_v1.md`
   §1.8 already decided Google OAuth verification submission "should not
   wait for the rest of the build to finish" — confirm whether that
   submission was actually started; if not, the Gmail/Calendar unverified-
   app status (100-user lifetime cap, no reset) is older and more
   pressing than this pass discovered it to be.
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

---

## GSTACK REVIEW REPORT — BC-076 build-ready spec (2026-08-31, fifth pass)

Scope: produce BC-076's actual implementation spec (schema, ingestion
workflow design, tool wiring, verification plan) now that Part 1/D6 made
it launch-critical. Not a review of the whole blueprint, not a build —
this is the spec Commander packages into a formal Build Card next.

| Section | Status | Findings |
|---|---|---|
| Step 0 (scope challenge) | Done, fired a real STOP | 5 new ingestion workflows + 1 new tool + wiring into 3 existing Agents crossed the 8-file/2-service complexity smell — stopped and asked whether to spec all 5 legs now or phase 2 into a fast-second card. Human confirmed all 5 now, citing D6's own explicit wording as the reason phasing would be re-litigation, not honoring the decision. Existing-code reuse mapped exhaustively: `client_kb_source` table shape, INT-011/012's chunk-embed-upsert mechanism, Shopify/WooCommerce credential connections, Pinecone namespace-per-client pattern — all reused, nothing rebuilt from scratch. |
| 1. Architecture review | Done, 2 decisions locked (D9, D10) | D9 (verification plan: per-archetype minimum, 5 demo businesses, human accepted recommendation) and D10 (Baserow over Grist, human accepted recommendation) — both grounded in live evidence, not assumption: n8n MCP `search_nodes`/`get_node_types` confirmed Baserow's native batch operations vs. Grist's absence of them, and confirmed the native Google Sheets node exists (closing D4's flagged-not-assumed verification requirement from the second pass). A new dedicated Pinecone index (`zenny-business-kb`) was chosen over reusing Email Manager's `zenny-email-kb` — different metadata shape, different tool surface, "boring by default" separation rather than a new pattern. |
| 2. Code quality review | No issues — no code changes in this pass, spec-only. | — |
| 3. Test review | Locked as part of this spec, not deferred | D9's verification plan IS the test plan: real live ingestion execution + real Pinecone upsert proof + real Agent tool-call proof, per demo business, matching this project's own established live-verification bar (BC-049's proof style for ingestion, BC-073 AC1's proof style for tool-call grounding) rather than a new, weaker standard. |
| 4. Performance review | Flagged for Execute during the build | Baserow's batch operations (200 rows/request) were the deciding factor precisely because of performance at sync time — a large catalog synced via Grist's single-row-only node would multiply API calls linearly. Embedding/upsert cost per sync run still scales with catalog size regardless of source (flagged in the first pass, unchanged) — Execute should watch this during the demo-business verification runs, not just prove correctness on small synthetic catalogs. |

**VERDICT:** BC-076's build-ready spec is locked — schema, 5-leg ingestion design (Shopify/WooCommerce/Notion/Sheets/Baserow), the `Search Business KB` tool's wiring into all 3 shipped archetype Agents, and a concrete per-archetype demo-business verification plan. Ready for Commander to translate directly into a formal Build Card and hand to Execute — the next action, not a further planning pass.

**UNRESOLVED DECISIONS:**
- Exact chunk-size tuning per source type, exact Baserow table schema/column names for the embedded catalog page, and the demo businesses' real synthetic data content — explicitly left to Execute's own judgment during the build, not over-specified here.
- Part 1-EXT (Emergency, Engagement, Commerce-Restaurant) — untouched, still sequenced after Part 1's gate substantially clears.
- Part 3-7, 9 of the blueprint's own gate items (capability audits, channel-gateway parity, onboarding confirmation, dashboard's existing-screen verification, minimum alerting, final QA) — untouched by this pass, each still needs picking up per Part 1's sequencing.
- Everything under "Not decided here" in Part 2 and Part 6 (first and second pass) — still open, unchanged.

---

## GSTACK REVIEW REPORT — BC-076 unblock sequence (2026-08-31, sixth pass)

Scope: plan the full unblock for the severe `client_id`-resolves-to-null
bug found in a same-day follow-up to the fifth pass, plus 3 new gaps the
human raised directly (no verification/smoke-test practice, no real
integration-testing process, a Sheets-OAuth collision risk) — a proper
step-by-step plan first, THEN a Build Card, per explicit human
instruction, not a single narrow bug-fix card.

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | Not run — infra/architecture planning, not a product-scope question. |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | issues_found, all resolved | See CODEX/CROSS-MODEL below. |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | clean (post-resolution) | See table below. |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | Not run — no UI in this pass's scope. |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | Not run — not applicable to this infra plan. |

| Section | Status | Findings |
|---|---|---|
| Step 0 (scope challenge) | Done, fired a real STOP | Bug fix + 5 ingestion legs + a new verification system + a new credential-testing process + a Sheets design decision is 5 pieces of work, not one Build Card. Human confirmed a sequenced split (initially 4 cards, refined to 5 after the outside-voice pass — see Card 2 split below). |
| 1. Architecture review | Done, 3 decisions locked (D11, D12, D13) | D11 (Google Sheets via service account, not OAuth — human raised the real concern first, live-search-grounded before deciding); D12 (scheduled automated canary, not manual-only — grounded in this exact session's own undetected-bug history); D13 (Card 1's `client_id` binding corrected to a static main-chain reference, never LLM-supplied — a real tenant-isolation gap the outside-voice pass caught in the human-approved draft, not a hypothetical). |
| 2. Code quality review | No issues — no code changes in this pass, spec-only. | — |
| 3. Test review | Card 1's Definition of Done tightened per outside-voice review | "A coherent response" was too weak — now requires proving tool invocation, correct-tenant content match, AND cross-tenant non-leakage. Card 4's canary design tightened the same way: asserts actual grounded content (not "no error"), and uses a fresh conversation every run (not a warm one) specifically because the bugs it exists to catch were in the cold, first-message path. |
| 4. Performance review | No new findings this pass | Carried forward unchanged from the fifth pass: embedding/upsert cost scales with catalog size regardless of source — still Execute's watch-item for Card 3. |

**CODEX:** Ran (gpt-5.5, high reasoning). 21 findings — 2 promoted to human decisions (tenant-isolation binding in Card 1, Card 2's split), the rest folded directly into the written spec as scope corrections (deletion/staleness strategy added to Card 3; ingestion legs' non-equivalent effort made explicit; canary's weak "non-error" bar tightened and its cold-path-exercise requirement added; the "locked plan" framing corrected to "Card 1 build-ready, Cards 2a/2b/3/4 scoped not specced"; a cross-reference surfaced to `Provider_App_Setup_Guide_v1.md`'s pre-existing (and possibly stalled) Google verification-submission decision).

**CROSS-MODEL:** No disagreement — Codex's 2 promoted findings were genuine gaps in the human-approved draft, not a competing architectural stance; both were corrected via AskUserQuestion and accepted as recommended, not contested.

**VERDICT:** Card 1 (fix `Search_business_kb` — webhook trigger + `httpRequestTool`, static `client_id` binding per D13, tightened Definition of Done) is build-ready — packaged into a formal Build Card and handed to Execute next. Cards 2a/2b/3/4 are scoped and sequenced but each needs its own `/plan-eng-review` pass before a Build Card is written, per this doc's own established convention. CEO + ENG CLEARED for Card 1 — eng review required for 2a/2b/3/4 individually when picked up.

**UNRESOLVED DECISIONS:**
- Whether `Provider_App_Setup_Guide_v1.md` §1.8's Google-verification submission was actually started — a direct human check needed before Card 2a proceeds; if not started, this is older and more pressing than this pass discovered.
- Whether the dashboard currently supports creating new test-client logins at all — Card 2a's own first task, not assumed either way.
- Root cause of the human's real dashboard OAuth reconnect error — not yet investigated, Card 2a's other first task.
- A dedicated security pass on tool-webhook auth (Check_availability/Cancel_appointment/Get_booking_status and the new Search_business_kb webhook all appear to carry no auth beyond the URL itself) — flagged, not scheduled.
- Everything already listed as unresolved in the fifth pass above — still open, unchanged.
