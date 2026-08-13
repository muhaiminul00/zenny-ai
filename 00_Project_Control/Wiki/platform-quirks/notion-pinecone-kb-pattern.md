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
  credential. Pages created *by* that integration's own token are
  automatically accessible to it; no manual "share with integration"
  step needed unless pulling in pre-existing pages later.
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

## Open credential gate

The n8n MCP cannot create credentials (a known, documented limitation).
A "Pinecone API Key" HTTP Header Auth credential (header name `Api-Key`)
needs manual creation in the n8n UI before INT-011/INT-012 can be fully
live-verified end-to-end (structural/pinned testing is complete and
passing on both). See `PROJECT_STATE.md` Active Blockers for the exact
steps.

## Related

[[n8n-openrouter-direct-llm-pattern]] — the direct-LLM-call precedent
this design's draft-generation leg follows. [[security-definer-rls]] —
the prior cross-tenant scare that motivated using Pinecone namespaces
(a structural boundary) over a metadata filter.
