# n8n Direct-LLM-Call Pattern (OpenRouter)

**Status:** current as of 2026-08-12 (BC-045)

## What's true now

Until INT-010, every n8n workflow in this project was purely the execution
layer — Convocore (per-client agent) owned all AI judgment calls, n8n only
did deterministic RPC calls and IF/Switch routing. INT-010 (Categorize
Email) is the first n8n workflow that makes a real AI judgment call
directly, decided explicitly by the human (not self-resolved) when
Commander flagged the gap: use a direct LLM call from n8n itself, via the
existing `openrouter-zm` credential (n8n native `openRouterApi` credential
type, id `s0v1iS8pSVD69XiO`), rather than routing through Convocore or
building a rule-based/keyword heuristic.

**The concrete pattern**, matching n8n's own `triage` best-practices
("Combined Approach" / structured-output guidance):

- `@n8n/n8n-nodes-langchain.chainLlm` (Basic LLM Chain) as the main-flow
  node, `promptType: 'define'`, `hasOutputParser: true`.
- `@n8n/n8n-nodes-langchain.lmChatOpenRouter` as its `subnodes.model` —
  bind the credential via `newCredential('openrouter-zm', '<id>')` in SDK
  code (2-arg form is safe here since the exact credential was confirmed
  live via `list_credentials` first, not guessed). `temperature: 0.1` —
  low, for classification consistency, per the triage best-practices doc.
- `@n8n/n8n-nodes-langchain.outputParserStructured` as its
  `subnodes.outputParser`, `schemaType: 'fromJson'`, a JSON example
  including a `reasoning` field alongside the actual classification value
  (aids debugging, per the same best-practices doc).
- The chain's structured output lands at `$json.output.<field>` — NOT
  `$json.<field>` directly (`outputParserStructured`'s own builderHint:
  "Output data is wrapped in an `output` key").
- **Never trust the LLM's raw output as a foreign key.** INT-010 asks the
  LLM for a category *name*, then does its own exact-match lookup against
  a live DB query's real `category_id` — an unmatched/hallucinated name
  routes to a dedicated failure branch, never silently defaults.
- `openRouterApi` is a **fixed platform-level credential**, not a
  per-client resolved one (unlike Gmail via UTIL-006) — no "credential
  unavailable" branch applies to this pattern the way it does for
  per-client provider credentials.
- `test_workflow` does **not** force-pin `chainLlm`/`lmChatOpenRouter`
  the way it pins plain `httpRequest`/credentialed nodes for its trigger
  auto-pin rule in the same blanket way — INT-010's 5 pinned test
  scenarios left the LLM call genuinely live in 3 of them (only the DB
  rows around it were pinned), which is how the whole pipeline got a real
  end-to-end classification test without extra live-execution tooling.

## Why (if a non-obvious decision)

Three options were on the table when this gap was flagged (Convocore
call, direct n8n LLM call, keyword heuristic). Direct n8n LLM call was
chosen by the human explicitly — logged here rather than assumed, since
this is the kind of architecture-shaping decision Document Resolution
Authority's own discipline says Claude should never self-resolve.

## Gotchas

- Don't reach for `$json.category_name` after a `chainLlm` node — it's
  `$json.output.category_name`.
- The DB only stores `category_name`/`category_scope`/`routing_rule` for
  `email_categories` — no semantic *definition* column. If the LLM prompt
  needs the actual category meanings (it does, for accurate
  classification), keep a static definitions map in the prompt-building
  Code node rather than inventing a new DB column for something this
  project's own doc (`Agent_Runtime_System_v1.md` §5) already specifies
  in full.

## Source

- `Phase 10 — Email Manager, INT-010 Categorize Email (BC-045)` (log.md, 2026-08-12)
