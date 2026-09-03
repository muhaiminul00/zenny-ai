# Notion + Pinecone Multi-Tenant KB Pattern (BC-047)

## What this is

Email Manager's knowledge-base source for INT-011 (Draft Email). Replaces
an earlier Convocore-KB design (see "Why Convocore was dropped" below) —
`control.convocore_agent_map` and every Convocore MCP/REST call stay in
the codebase, dormant, not deleted, in case the plan-tier blocker clears.

## Shape

- **Doc storage:** Notion, one root workspace page ("Zenny Client
  Knowledge Bases"), one child page per client, containing that client's
  KB article sub-pages. Owned entirely by ZeroManual's own `zenny-notion-
  api` integration token — no per-client OAuth, no client-owned
  credential. **Correction, BC-049:** pages created via the integration's
  own token are NOT automatically accessible to it going forward — the
  root page still needed to be explicitly added under its own Connections
  /data-access list before the integration could read it live (see
  "Credential gates" below; this assumption was wrong and caused a real
  404 in BC-048). Always add the integration under a KB root page's
  Connections explicitly, even for self-created pages.
- **Pointer table:** `control.client_kb_source (client_id, notion_page_id,
  last_synced_at)` — mirrors `convocore_agent_map`'s exact convention.
  Content never touches Postgres.
- **Vector store:** Pinecone, one serverless index (`zenny-email-kb`,
  AWS `us-east-1`, 1536-dim cosine — matched to `text-embedding-3-small`).
  **Tenant isolation is the Pinecone `namespace`, set to the literal
  `client_id`** — a structural, server-side boundary, not just a metadata
  filter a caller could forget to apply. A query scoped to one namespace
  physically cannot return another client's vectors. Chose namespace
  over metadata-filter deliberately, given this project's prior real
  cross-tenant scare (`platform-quirks/security-definer-rls.md`).
- **Embeddings:** OpenRouter's `/embeddings` endpoint (`openai/text-
  embedding-3-small`), reusing the existing `openrouter-zm` credential.
  OpenRouter added embeddings support since the last time this project's
  Convocore live-test doc was written — a genuinely new capability, not
  previously known to this codebase. No new credential needed for this
  leg.
- **Both legs use raw HTTP Request nodes**, not the native LangChain
  Pinecone Vector Store / Embeddings nodes. Deliberate: those native
  nodes require the embedding provider to be wired as a LangChain
  subnode, which would have forced either (a) a brand-new `openAiApi`-
  typed credential just to point at OpenRouter via its `baseURL`
  override, or (b) fighting the node's credential-type strictness. Raw
  HTTP against Pinecone's own REST API + OpenRouter's REST endpoint
  needed zero new credentials beyond the one unavoidable Pinecone key —
  smaller footprint, matches this project's existing "raw HTTP where no
  clean native fit exists" convention (Convocore, Gmail-via-UTIL-006,
  etc.).

## Two workflows

- **INT-012 Sync Notion KB** (ingest): resolves `notion_page_id` → lists
  child pages (native Notion node) → fetches each as clean Markdown →
  chunks (~700 chars, paragraph-packed) → embeds → upserts to Pinecone
  with a deterministic vector ID (`notion_block_id + chunk_index`), so
  re-syncing the same page updates in place rather than duplicating.
- **INT-011 Draft Email** (retrieval): embeds the inbound email → queries
  Pinecone (`namespace = client_id`, topK 4) → grounds the draft in the
  returned chunk text → falls back to `client_config.archetype_settings`
  if the namespace has zero matches (client hasn't synced a KB yet).

## Why Convocore was dropped

`Convocore_REST_Live_Test_v1.md` §7-11 fully live-tested a working
"live-fetch KB via Convocore REST" design against `Zenny-UI`
(`1nyXSGBFG1yOj0T9DIPM`, workspace secret `vg_sBw7SK2YCeuY8ryoAn16`) on
2026-08-02/04 — real KB content, real semantic search, all confirmed
working. When BC-046 tried to build against this exact same design on
2026-08-13, **every endpoint on that workspace now returns `403 "API
access requires the Business plan or higher"`** — confirmed independent
of MCP (identical error via raw `curl`, same credential). This is a real
Convocore-side account-plan/billing change, not a code regression, an
expired credential, or an MCP artifact — the same secret that worked 9
days earlier is now blocked workspace-wide. Notably, Convocore's own
static pricing reference doesn't even list a "Business"/"White Label"
tier as of its last-reviewed date (2026-04-18) — either the plan
structure changed since, or this workspace's plan lapsed; not
investigated further (see `PROJECT_STATE.md` Active Blockers).

Human then also flagged a second, independent concern with the original
fallback plan (Google Drive as KB storage): adding Drive's API scope to
this project's *production* Google OAuth app (already carrying Gmail +
Calendar scopes) risks triggering Google's sensitive-scope re-
verification process. Notion's internal-integration token model sidesteps
that entirely — no OAuth consent flow, no scope review, single API key.

## Credential gates — both closed, BC-049

**Pinecone — resolved BC-048.** The human-created `zenny-pinecone-api`
credential turned out to be a native `pineconeApi`-typed credential, not
the `httpHeaderAuth` type BC-047 assumed (the MCP can't create
credentials, so it never got to verify the type live until BC-048). Both
`Query Pinecone` (INT-011) and `Upsert To Pinecone` (INT-012) switched
from `genericCredentialType`/`httpHeaderAuth` to
`predefinedCredentialType`/`pineconeApi` — live-verified working.

**Notion — resolved BC-049, real root cause was page-sharing, not a
secret mismatch.** BC-048 diagnosed the live 404 on `List Child Pages`
as the n8n credential's stored secret not matching the token supplied in
chat (based on a direct `curl` against `api.notion.com` succeeding with
that same token). **That diagnosis was wrong.** The human traced the
actual cause: the "Zenny Client Knowledge Bases" root page had never
been added to the "n8n" integration's Connections/data-access list inside
Notion itself — the credential secret was fine all along; the `curl`
success was misleading because a token can authenticate successfully
while still lacking a specific page's Connections grant, which is a
separate, page-level permission layer on top of raw API auth. Fixed by
adding the integration under the page's own Connections menu. No n8n
credential was ever touched or needed re-pasting. **Lesson for next
time:** a working `curl`/API-auth check proves the *token* is valid, not
that the *integration* has been connected to the specific page/database
in question — check page-level Connections first for a 404 that isn't a
plain auth failure.

## BC-049 live verification (both legs, full round trip)

Triggered INT-012 for real (via a temporary harness, deleted after)
against Client A, unpinned: `List Child Pages` returned both real child
pages ("Shipping & Returns Policy", "Order Status & Support"), each
fetched as Markdown, chunked, embedded via OpenRouter, and upserted to
Pinecone (`upsertedCount: 1` per chunk, confirmed in the real Pinecone
REST response), `last_synced_at` genuinely advanced. First fully-live
proof of the complete Notion→Pinecone pipeline, both legs, in one run.
Also built and live-verified SCH-003/SCH-004 (cron cadences for
INT-009/INT-012) this same card — see `Workflow_Registry.md`.

## BC-048 live verification (Pinecone leg only, prior to the fix above)

Triggered INT-010 for real (via a temporary harness, deleted after) with
a genuine test email against Client A. Full chain ran live: customer
resolution → categorization → `emails` row write → INT-010's new call
into INT-011 → real embed → real Pinecone query (0 matches, namespace
still empty since INT-012 hadn't synced yet) → correct fallback grounding
→ real LLM draft → real `update_client_email_draft` write, confirmed via
direct SQL. First genuinely-live proof the Pinecone leg authenticates and
works end-to-end.

While chasing this, also found and fixed a real, pre-existing bug in
INT-010 (BC-045, not this pattern's own code) that was silently causing
every real categorization to fail — see
[[n8n-node-behaviors]] for the n8n array-response-splitting root cause.

## Superseded for Business KB — BC-076 Card 3b (2026-09-03)

This pattern's `zenny-email-kb` index was always Email Manager-specific
(Phase 10). When the Phase 14 Business KB pivot needed a Notion ingestion
leg, `SCH-004` (see `Workflow_Registry.md`) was generalized to route other
source types to `zenny-business-kb`, but its `notion` branch was left
pointing at INT-012 unchanged — a real gap: Notion KB content was
unreachable via `Search_business_kb` at all. Card 3b's `/plan-eng-review`
(`docs/designs/bc076-card3b-notion-kb-fix.md`) locked the fix: a NEW
parallel "Notion Fetch KB Leg" workflow reusing this page's proven
List-Child-Pages/Get-Page-Content logic, feeding the Generic KB Ingestion
Core (D25) instead of INT-012's own hand-rolled upsert. INT-012/INT-011
stay exactly as documented above, untouched, dormant once SCH-004 is
retargeted — this page's content remains accurate for Email Manager's own
(near-unused, 3 executions ever) Draft Email path.

**New finding from Card 3b's review, not previously documented here:**
INT-012 never writes `sync_status` — it calls a different, older RPC
(`update_client_kb_last_synced`) that only touches `last_synced_at`. A
silently-failing Notion sync has always been invisible via
`client_kb_source.sync_status`, unlike every leg built since Card3 (D25).

## Related

[[n8n-openrouter-direct-llm-pattern]] — the direct-LLM-call precedent
this design's draft-generation leg follows. [[security-definer-rls]] —
the prior cross-tenant scare that motivated using Pinecone namespaces
(a structural boundary) over a metadata filter.
