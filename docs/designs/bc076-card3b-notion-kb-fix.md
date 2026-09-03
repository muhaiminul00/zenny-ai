# BC-076 Card 3b — Notion KB Ingestion Leg Fix

Status: DRAFT (in review — plan-eng-review in progress)

## Problem

`INT-012` (`yrz1YZcWmUlIZQOx`, "Zenny Email Manager - SyncNotionKB", built
BC-047) syncs each client's Notion KB pages into Pinecone index
`zenny-email-kb` — the OLD, Email-Manager-specific index. It does NOT write
to `zenny-business-kb`, the index `Search_business_kb` (the tool wired into
all 3 shipped Phase-14 archetype agents) actually queries. `SCH-004`'s daily
cron dispatcher was generalized during Card2b/Card3 to route
`google_sheets`/`shopify`/`woocommerce` correctly to the new Business-KB
pipeline, but its `notion` branch still calls the unmodified INT-012.

**Net effect:** a client's Notion KB content is currently unreachable via
`Search_business_kb` at all — a real functional gap, not just hygiene.

INT-012 also lacks every hardening decision the other legs picked up since
(D19/D20 orphan-vector cleanup, the shared Generic KB Ingestion Core's
dedup/sync_status contract). Live-verified: INT-012 never writes
`sync_status` at all (it calls a different, older RPC that only touches
`last_synced_at`) — a silently-failing Notion sync is currently invisible.

## What already exists (reuse, not rebuild)

- **`Zenny Runtime - Generic KB Ingestion Core`** (`XxkqBACpoJiifl0T`, D25,
  Card3) — already solves embed/upsert-to-`zenny-business-kb`/orphan-cleanup/
  dedup/`sync_status`-write, generically. Contract:
  `{client_id, source_type, source_ref, read_complete, records:[{row_key, content}]}`.
  Shopify/WooCommerce already prove the "thin fetch workflow feeds the shared
  core" pattern — Notion needs the same shape.
- **INT-012's own Notion-read logic** (List Child Pages, Get Page Content) —
  proven, live-verified (BC-049), reusable as-is for a new fetch workflow.
- **`control.client_kb_source`** already carries a `source_type='notion'` row
  for every client (generalized during Card2b/Card3) — no schema change
  needed.

## Live verification performed (Mandatory MCP Verification)

- `get_workflow_details` on INT-012 (`yrz1YZcWmUlIZQOx`) — confirmed live,
  active, upserts to `zenny-email-kb` (URL literally hardcoded in the node).
- `get_workflow_details` on SCH-004 (`ve6GVb5IvBtl4pvf`) — confirmed the
  `notion` branch still targets `yrz1YZcWmUlIZQOx` unchanged; last updated
  2026-09-02 (Card3's generalization only touched the other 3 branches).
- `search_executions` on INT-012 — 162 total executions, 5 most recent all
  `success`, latest 2026-09-02T21:00. Real, active, running daily.
- `search_executions` on INT-011 (Draft Email, `fmBjtfi7vqdszs78`) — **3
  executions total, ever**, latest 2026-09-01. Near-zero real production
  usage.
- `describe-index-stats` on `zenny-email-kb` — 2 vectors total, 1 namespace
  (Client A). Tiny, stale footprint.
- `execute_sql` on `control.client_kb_source` — 6 clients have a
  `source_type='notion'` row; only Client A has a non-null `last_synced_at`.
  Carmelli Bakery's Notion row has never synced (`last_synced_at: null`)
  despite having a `source_ref` set — consistent with the BC-049-documented
  "page must be added to the integration's Connections list separately from
  raw API auth" gotcha, likely never done for Carmelli.
- `get_workflow_details` on Generic KB Ingestion Core — confirmed its exact
  input contract and internal orphan-cleanup/status-write logic.
- `list-indexes` / `describe-index-stats` on `zenny-business-kb` — confirmed
  no Notion-sourced content exists there for either real client.

## Step 0 — Scope Challenge

Minimum change: **one new small workflow** ("Notion Fetch KB Leg") reusing
INT-012's existing Notion-read nodes, feeding the existing Generic Ingestion
Core, plus retargeting SCH-004's `notion` branch to it. Does not trigger the
8-files/2-new-services complexity gate. No blocking TODOS.md items; two
adjacent-but-separate TODOS exist ("Migrate Sheets to Generic Core" P2,
"Wire sync_status failures to real alerting" P3) — not bundled in, different
workflow / different scope.

## Section 1 — Architecture decisions (locked)

**D1 — New parallel leg via Generic Core.** Build one new small "Notion
Fetch KB Leg" workflow reusing INT-012's existing List Child Pages + Get Page
Content nodes verbatim, feeding it into the Generic KB Ingestion Core exactly
like Shopify/WooCommerce already do. Retarget SCH-004's `notion` branch to
this new workflow. Leave INT-012/INT-011 running, completely untouched.
Chosen over (a) re-pointing INT-012 directly + migrating INT-011 (touches a
paused-track consumer confirmed to have near-zero real traffic, for no
correctness gain — INT-012 still wouldn't get dedup/orphan-cleanup without
also rewriting its upsert logic) and (b) dual-write INT-012 to both indexes
(doesn't fix the structural gap — INT-012 still lacks orphan-cleanup/
sync_status, so the business-KB copy would silently drift and rot exactly
like the original bug, just duplicated).

**D2 — Legacy INT-012/INT-011 fate.** Leave INT-012 active but mark **only
INT-012** deprecated in `Workflow_Registry.md` and its own sticky note —
INT-011 itself is NOT deprecated, it keeps working exactly as it always has
(querying `zenny-email-kb` directly, unaffected by anything in this card).
Once SCH-004's `notion` branch is retargeted, INT-012 loses its only known
caller and goes naturally dormant. Matches this project's existing
dormant-not-deleted convention (Convocore). Do NOT `archive_workflow` it —
that would remove Phase 10's only Notion-sync path entirely, a real
behavior change for a track marked paused, not scoped here. **Disclosed
limitation, not fixed here:** if Phase 10 (Email Manager) is ever revived,
INT-012 still has every bug this card found (no `sync_status`, no orphan
cleanup) — reviving that track would need its own follow-up card, not
something this card's "leave it alone" choice silently fixes.

**D3 — Carmelli Bakery's broken Notion connection is in scope.** Fix the
Notion integration's Connections-list gap for Carmelli's KB root page (same
manual fix BC-049 already used once for a different page) as part of this
card, so the new leg can be live-verified against BOTH real clients
(Client A + Carmelli) — matching this project's established live-verification
doctrine (every other Card3 leg was proven against 2 real clients).

**D4 — Partial per-page fetch failure handling.** Notion's fetch is N
separate per-page HTTP calls (unlike Shopify/WooCommerce/Sheets, which each
fetch everything in one bulk call) — a genuinely new failure mode this leg
introduces. If the page listing succeeds but one page's content-fetch fails
mid-loop, `read_complete` is set to `false` for the WHOLE run (conservative,
whole-run-level), not just for that one page. This ensures Generic Core's
Read Gate correctly skips orphan-cleanup on a run where we don't have a
complete, trustworthy view of the source — a transient single-page failure
must never risk deleting a still-valid vector for a page we just failed to
re-check this run. Matches the intent of D20's rename-safety fix.
Verified against Generic Core's actual wiring: `read_complete:false` gates
only the orphan-cleanup branch, never the upsert of already-fetched
records — so a partial failure still indexes what it successfully fetched,
it just correctly skips deleting anything that looked missing this run.

**D5 — Empty-KB wipe safety (added post Codex outside-voice review).** A
Notion API/parsing bug could cause "List Child Pages" to return 0 items
even though the client genuinely has pages — the design as originally
drafted would report `read_complete:true, records:[]`, and Generic Core
would treat that as "genuinely empty" and delete ALL of that client's
Notion vectors via orphan-cleanup. Fix: before trusting "0 pages = empty",
check that the raw Notion API response itself has a valid, well-formed
results structure (not just that the post-filter child-page count is 0).
If the raw response looks malformed/unexpected, report `read_complete:false`
instead — treats API-contract drift as a failure, not a genuine empty KB.

**D6 — SCH-004 retarget rollback + canary (added post Codex outside-voice
review).** Retargeting SCH-004's `notion` branch touches active, shipped
production routing. Before trusting the full daily sweep: (1) note the old
workflow ID (`yrz1YZcWmUlIZQOx`) in the commit/doc for an easy revert —
n8n's own version history also covers this, same pattern the Sheets-refactor
TODO already recommends; (2) run ONE manual trigger of the new leg against
a single client first, and only then let the automated daily sweep run
across the full roster.

## Section 2 — Code Quality

No issues. DRY: n8n workflows can't share node definitions across workflows
— copying INT-012's 2 Notion-read nodes into the new fetch workflow matches
how Shopify/WooCommerce/Sheets each keep their own source-specific read
logic; not a violation. Error handling: Generic Core already distinguishes
"genuinely empty" from "read failed" via `read_complete` (Card3's own fix);
the new workflow just needs to set that flag honestly per D4. Sizing: a thin
fetch/normalize layer, matching the established Shopify/WooCommerce shape.

**Credential-binding note (Codex outside-voice catch):** copying INT-012's
Notion-read nodes into the new workflow means re-verifying the Notion
credential resolves correctly in the new workflow, not assuming copy-paste
preserves the binding — this project has already hit exactly this failure
once (BC-047: "auto-assignment picked an unrelated 'Notion account'
credential and had to be corrected"). Folded into T2's Verify step below.

**Disclosed, not fixed here (Codex outside-voice catch):** reusing INT-012's
`getMarkdown` export inherits a possible content-fidelity gap — nested
blocks inside toggles/columns/callouts/synced blocks/tables may not flatten
cleanly. Pre-existing since BC-047, unaudited, unrelated to this card's own
changes. Logged as its own TODOS.md item, not fixed here.

## Section 3 — Test review

```
CODE PATHS (new: "Notion Fetch KB Leg" workflow)
[+] Notion Fetch KB Leg (new)
  ├── List Child Pages (Notion API)
  │   ├── [GAP] Success, N>0 pages           → proceed to per-page fetch
  │   ├── [GAP] Success, 0 pages (empty KB)  → read_complete:true, records:[] → status:'success', synced:0
  │   └── [GAP] API error (404/no Connections/rate-limit) → read_complete:false → status:'failed'
  ├── Get Page Content (per page, looped)
  │   ├── [GAP] All pages succeed             → read_complete:true (if listing also succeeded)
  │   └── [GAP] [D4] Any page fails mid-loop  → read_complete:false (whole-run, conservative)
  ├── Build records[] {row_key: notion_block_id, content: markdown}
  └── Call Generic KB Ingestion Core (client_id, source_type:'notion', source_ref, read_complete, records)
      └── [EXISTING, Card3-proven] embed/upsert/orphan-cleanup/dedup/sync_status write — not retraced

[+] SCH-004 routing
  ├── [GAP] notion branch retargeted to new workflow (not old INT-012)
  └── [GAP] Sheets/Shopify/WooCommerce branches unaffected — regression check (mandatory, existing shipped infra)

[+] Legacy trio (INT-012/INT-011, per D2)
  └── [GAP] INT-012 goes naturally dormant — confirm no orphaned cron/manual trigger still fires it

USER-FACING FLOW
[+] Search_business_kb query for Notion-sourced content
  ├── [GAP] Client A: real query returns real Notion content (round-trip proof)
  └── [GAP] Carmelli (post-D3 fix): same round-trip proof — 2nd real client

COVERAGE: 0/10 paths tested (0%) — none built yet, this plan defines the full test set
```

**REGRESSION RULE:** SCH-004 is existing, shipped, active production infra
— retargeting its `notion` branch is a modification to existing behavior.
Mandatory regression test: after retargeting, run a full live SCH-004 sweep
and confirm Sheets/Shopify/WooCommerce branches are unaffected (same node
IDs, same routing) — this project has no automated test framework for n8n;
verification is live, via `search_executions` + `get_workflow_details`.

## Section 4 — Performance

Notion's per-page fetch loop is O(N) sequential Notion API calls (inherited
from INT-012's existing pattern, not a new regression). Current real KB
sizes are tiny (2 pages for Client A) — not a practical concern now, worth
noting as a known scaling limit if KB sizes grow. No blocking issues.

## NOT in scope

- Migrating `KR0kHvk3kJRThrX5` (Sheets) to the Generic Core — separate,
  already-tracked TODOS.md item (P2), different workflow.
- Building the "wire sync_status failures to real alerting" infra — separate
  TODOS.md item (P3), general infra, not this card's job.
- Archiving INT-012/INT-011 outright — per D2, deprecate-in-docs only.
- Recursing into nested (grandchild) Notion sub-pages — INT-012's existing
  List Child Pages only lists direct children; the new leg inherits this
  same limitation verbatim (not a new regression, not this card's scope to
  fix).
- Re-migrating INT-011 to query `zenny-business-kb` — per D1, out of scope
  given near-zero real usage.

## Failure modes

| Codepath | Failure | Test? | Error handling? | User-visible? |
|---|---|---|---|---|
| List Child Pages | Notion API 404/no Connections | Yes (D3 fix + live verify) | Yes — `read_complete:false` → `status:'failed'` | Visible via `sync_status` (new — INT-012 never had this) |
| Get Page Content (per page) | Transient fetch failure | Yes (D4) | Yes — whole-run `read_complete:false` | Visible via `sync_status` |
| SCH-004 retarget | Wrong workflow ID wired | Yes (live `get_workflow_details` check) | N/A (config, not runtime) | Silent if unverified — mandatory pre-ship check |
| SCH-004 other branches | Retarget accidentally breaks Sheets/Shopify/WooCommerce | Yes (regression sweep, mandatory) | N/A | Would be silent without live sweep — critical gap if skipped |
| Empty-KB report (D5) | Parsing/API bug reports 0 pages when client has real content | Yes (raw-response sanity check) | Yes — falls back to `read_complete:false` | Would have silently wiped a client's real KB without D5 |
| SCH-004 retarget (D6) | Routing mistake breaks the whole daily sweep at once | Yes (canary single-client run before full sweep) | Yes — old workflow ID captured for revert | Contained to 1 client instead of the whole roster, with D6 |

No critical gaps remain unaddressed — every failure mode above has an
explicit test + error-handling path in this design.

## Implementation Tasks

Synthesized from this review's findings (Step 0 + Sections 1-4 + Codex
outside-voice). Each task derives from a specific finding above.

- [ ] **T0 (P1, human: ~5min / CC: ~2min) — Dependency, not build work** —
  Fix Carmelli Bakery's Notion Connections gap (D3) — a manual step in
  Notion's own UI, same fix BC-049 used once before. Reclassified out of
  the build-task list per Codex's catch: this can only be done by whoever
  controls the Notion workspace, and it blocks T5's 2nd-client proof — flag
  it up front, don't let it surface mid-build as a surprise blocker.
  - Verify: re-check `control.client_kb_source` for Carmelli's notion row
    after a manual/temporary trigger, or wait for the new leg's first sweep.
- [ ] **T1 (P1, human: ~2h / CC: ~20min)** — Build "Notion Fetch KB Leg"
  workflow (D1, D4, D5) — reuse INT-012's List Child Pages + Get Page
  Content nodes, build records array, compute `read_complete` per D4 (any
  page-fetch failure → whole-run false) and D5 (raw-response sanity check
  before trusting an empty result).
  - Files: new n8n workflow (via MCP, not a repo file).
  - Verify: `validate_workflow` clean, `get_workflow_details` connections
    match intent, `test_workflow` against pinned representative data,
    **explicitly confirm the Notion credential resolves to the correct one**
    (not auto-assigned to an unrelated credential — this project has hit
    that exact failure once, BC-047).
- [ ] **T2 (P1, human: ~20min / CC: ~10min)** — Retarget SCH-004's `notion`
  branch to the new workflow, with D6's rollback/canary practice: capture
  the old workflow ID (`yrz1YZcWmUlIZQOx`) in the commit/doc, run ONE
  manual trigger against a single client first, only then trust the full
  daily sweep.
  - Verify: `get_workflow_details` confirms the new workflow ID is wired;
    single-client canary run succeeds; live sweep confirms Sheets/Shopify/
    WooCommerce branches unaffected (mandatory regression test, existing
    shipped infra).
- [ ] **T3 (P1, human: ~15min / CC: ~10min)** — Live end-to-end proof
  against both real clients, strengthened per Codex's catch that "returns
  real content" alone doesn't prove orphan-cleanup or isolation.
  - Verify: real `Search_business_kb` webhook call returns real Notion
    content for Client A and Carmelli (post-T0); a rename/delete-then-resync
    proof (same style as Card2c's D20 verification) confirming orphaned
    vectors actually get cleaned up, not just that fresh content appears;
    confirm `sync_status` is now populated for Notion rows (it never was
    under INT-012); re-confirm cross-tenant isolation holds (Client A sees
    none of Carmelli's content and vice versa).
- [ ] **T4 (P2)** — Mark **INT-012 only** deprecated in `Workflow_Registry.md`
  + a sticky note on INT-012 itself (D2). INT-011 is NOT deprecated — it
  keeps working as-is, unaffected by this card.
  - Verify: doc entries updated, sticky note added, no config change to
    either workflow.
- [ ] **T5 (P1)** — `Workflow_Registry.md` entry for the new leg (mandatory
  per root `CLAUDE.md`'s Per-Workflow Documentation standing rule).
  - Verify: written from a live `get_workflow_details` read.

_JSONL task artifact skipped — `jq` not installed in this environment (same
gap noted during BC-076 Card 4's review)._

## Completion summary

- Step 0: Scope Challenge — scope accepted as-is (1 new workflow + 1 SCH-004
  retarget; did not trigger the 8-files/2-services gate).
- Architecture Review: 4 issues found (D1-D4), all resolved.
- Code Quality Review: 0 issues found.
- Test Review: diagram produced, 10 gaps identified (all new — nothing
  built yet; this plan defines the full test set, including the mandatory
  SCH-004 regression sweep).
- Performance Review: 0 blocking issues (1 inherited scaling note, not new).
- NOT in scope: written.
- What already exists: written.
- TODOS.md updates: 2 items proposed and accepted (shared fetch-adapter
  contract; nested-block content-fidelity audit).
- Failure modes: 0 critical gaps flagged (all 6 identified failure modes
  have an explicit test + error-handling path).
- Outside voice: ran (Codex, gpt-5.5) — 15 raw points, 8 resolved by
  evidence already in hand, 2 became genuine decisions (D5, D6), 2 became
  TODOS.md items, 1 dismissed (CLAUDE.md "smell" — false positive from
  restricted context), 1 was a doc-wording fix (INT-011 not deprecated),
  1 folded into an existing task's Verify step (credential-binding check).
- Parallelization: 3 lanes (T0 independent/human, T1→T2→T3 sequential
  n8n-workflow chain, T4 independent doc edit), 1 independent / 1
  sequential chain / 1 independent.
- Lake Score: 6/6 recommendations chose the complete option (D1, D3, D5, D6
  and both TODOs all took the fuller/safer path over the shortcut).

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | not run (not a product-direction change) |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | RAN | 15 points raised, 6 substantive (2→decisions D5/D6, 2→TODOS, 1 dismissed w/ evidence, 1 doc fix), 8 resolved by evidence already in hand |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 6 issues found (D1-D6), 0 unresolved, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | not run (no UI changes) |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | not run |

- **CODEX:** Caught 2 real design gaps this review's own sections missed (empty-KB wipe safety, SCH-004 retarget rollback/canary) — both accepted and folded into D5/D6. Also flagged 6 concerns resolvable by evidence already gathered this session (pagination, row_key identity, partial-failure semantics, rate-limiting, INT-012 sole-caller claim, CLAUDE.md dependency) — none required a plan change.
- **CROSS-MODEL:** No unresolved disagreement — every Codex point either got folded into the plan (D5, D6, 2 TODOs, doc-wording fix) or was resolved by re-reading the actual live code (Generic Core's wiring, INT-012's node config, triggerInfo) and shown not to apply as stated.
- **VERDICT:** ENG REVIEW CLEARED — ready to implement. CEO/Design/DX reviews not applicable to this card.

NO UNRESOLVED DECISIONS
