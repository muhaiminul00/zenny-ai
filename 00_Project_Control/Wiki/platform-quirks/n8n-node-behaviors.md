# n8n Node Behaviors — Real Quirks Worth Remembering

**Status:** current as of 2026-08-12 (BC-044), accumulated across many sessions

## What's true now

A recurring set of real n8n platform behaviors that have each caused a
genuine bug in this project — none of these are one-off mistakes, they
are platform quirks that will bite again on a new node if not checked
for explicitly.

**1. Response-format / scalar-unwrap behavior (the single most
recurring class of bug in this project):**
- RPCs that return a bare scalar via PostgREST's
  `application/vnd.pgrst.object+json` content type (e.g.
  `read_credential_secret`, `store_credential_secret`,
  `insert_audit_log_event`, `delete_client_active_issue`) are NOT
  recognized as JSON by n8n's response-format autodetect. Set
  `responseFormat: "text"` explicitly on these HTTP nodes — the plain
  unwrapped value lands directly in `.data`. Do NOT `JSON.parse()` the
  result (confirmed wrong via a live 400 from Google's token endpoint
  when tried).
- The OPPOSITE case: with `responseFormat: "json"` forced on a bare JSON
  scalar (e.g. a boolean), n8n lands the value as the item's WHOLE
  `.json` directly (`json: false`), NOT nested under `.data` the way the
  `text`-format case works. Check which format is actually in play
  before assuming where the value lives.
- Even in `text` mode, a boolean scalar (e.g. from
  `delete_client_active_issue`) can be delivered as a real JS boolean
  `true` under `.data`, not the string `'true'` — a strict
  `$json.data === 'true'` comparison will silently always evaluate
  false. Accept either shape: `$json.data === true || $json.data === 'true'`.
- n8n's HTTP Request node auto-unwraps a single-row JSON array response
  into `item.json` being the row object directly (not an array of one) —
  code assuming `Array.isArray(rows)` on such a response will always be
  false, wrongly treating a real successful result as "not found."

**2. Output-pin wiring gotchas:**
- `Execute Workflow` nodes calling a sub-workflow with multiple internal
  branches (e.g. UTIL-004's Send-Ops-Email / Send-Client-Email split)
  expose a MATCHING output pin per branch on the caller side. Wiring
  only pin 0 means real traffic landing on pin 1 silently never responds,
  even though the sub-workflow itself succeeded.
- `onError: continueErrorOutput` routes a genuine node failure to a
  SEPARATE output (index 1) — if the workflow's connections graph only
  ever wires output 0 downstream, real failures silently dead-end. This
  has happened on multiple workflows independently (SCH-006's 3 refresh
  nodes) before being caught.
- `retryOnFail` + `onError: continueErrorOutput` together do NOT route a
  retry-exhausted failure to the error output pin (index 1) — it lands
  on the REGULAR pin (index 0) as an item carrying an `.error` field
  instead. Don't trust which physical pin fired; check for the presence
  of the expected success field (e.g. a real `lead_id`) instead.

**3. IF-node / validation quirks:**
- An IF node combining a boolean `"true"` operator with an explicit
  `rightValue: ''` throws a real `NodeOperationError`. Omit `rightValue`
  entirely for this operator (matches the working pattern elsewhere in
  this project).
- Strict type validation on an IF node's `exists`/comparison check can
  throw `NodeOperationError` ("Wrong type... is an object but was
  expecting a string") the moment a genuine error object (e.g. a full
  AxiosError) reaches it, rather than evaluating true/false. Use loose
  type validation (n8n's own suggested fix) on any IF node that inspects
  a real error object.

**3b. Loop (`splitInBatches`) quirks:**
- `splitInBatches` with 0 incoming items does not fire its `onDone`
  branch at all — the execution simply stops at the node feeding it
  (confirmed live, INT-009 execution 7642: a genuine "zero new items"
  run silently stalled before ever reaching post-loop aggregation/
  logging steps). This contradicts the n8n Workflow SDK reference's own
  `batch_processing` pattern doc, which describes `onDone` as always
  firing. If work must happen regardless of item count (e.g. "always
  write a sync-log row, even when there's nothing to process"), gate
  the loop's entry with an explicit IF (`hasItems?`) and route the
  empty branch directly to the same post-loop step the loop's `onDone`
  feeds — don't rely on `onDone` alone for that guarantee.
- The `array`/`notEmpty` IF operator throws `Conversion error: the
  string '' can't be converted to an array` if `rightValue` is left as
  `''` (the default the SDK docs' own example omits, but n8n's runtime
  still needs *something* type-consistent). Set `rightValue: []` (an
  empty array literal) explicitly for this operator instead of omitting
  it or leaving it as a string.

**4. Editing/testing platform behavior:**
- **Editing a workflow via MCP while it's also open in the n8n browser
  editor is not safe** — the editor's own save-on-close can silently
  clobber API-applied edits (credentials, `responseFormat`, etc.) back to
  their pre-fix state. Close the browser editor before making MCP edits,
  or re-verify after, if there's any chance it was open concurrently.
- `test_workflow` forcibly pins all credentialed/HTTP nodes — this makes
  it unsuitable for proving a branch that specifically needs to trigger a
  REAL external call (it would fake the very call being tested).
  Structural verification (`get_workflow_details`, confirming node graph
  and wiring) is the fallback when a live end-to-end call genuinely can't
  be forced through available test tooling.
- n8n's PRODUCTION publish validation is stricter than the editor's own
  live validation — it requires a real credential on every credentialed
  node, even ones on a branch that will never fire in practice (e.g.
  Slack alert nodes with no real Slack credential). The fix pattern used
  throughout this project: DISABLE (not delete) the blocking nodes to
  unblock publish, leaving the underlying credential gap fully visible
  and unchanged.
- `updateNodeParameters` alone can update a switch/IF node's own
  parameters (e.g. adding a new branch) without updating the
  workflow-level `connections` object — new branches need explicit
  `addConnection`/`removeConnection` operations, confirmed as genuinely
  separate operations in this tool.

## Why (if a non-obvious decision)

These are documented as a single reference page (rather than left
scattered per-workflow) because the SAME quirks have independently
caused real bugs across many unrelated workflows (SCH-006, UTIL-003,
UTIL-005, UTIL-006, UTIL-007, WF-001, WF-017, INT-002, INT-005,
ADP-002, Tool Execution Fallback) — recognizing the pattern early saves
re-discovering it node by node.

## Gotchas

See "What's true now" above — this entire page IS a gotchas list. The
one meta-gotcha: a workflow that "passed its tests" may still have never
actually exercised its failure/error branch — several of the bugs above
were only caught when a session deliberately forced a real failure for
the first time.

## Source

- `Phase 5 — Real OAuth Connection Persistence Bug (BC-021)` (log.md, 2026-08-06)
- `Phase 5 — Slack Removal + Gmail-Based Notifications + Scope-Request Verification (BC-025)` (log.md, 2026-08-06)
- `Phase 6 — Core Agent Build (BC-026)` (log.md, 2026-08-06)
- `Phase 6 — Real Infrastructure Bug Fixes (BC-028)` (log.md, 2026-08-07)
- `Session Log — Session 32 — BC-032 (Infrastructure catch-up)...` (log.md, 2026-08-07)
- `Prior Phase — Phase 7 (Growth Agent) BC-029 COMPLETE` (log.md, 2026-08-07)
- `Phase 5 — Token-Expiry Diagnosis + Calendar Scope Narrowing + Legal Page Revision (BC-023)` (log.md, 2026-08-06)
- `Phase 10 — Email Manager, INT-009 Sync Inbox (BC-044)` (log.md, 2026-08-12)
