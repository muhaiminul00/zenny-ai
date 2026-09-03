# PROJECT_STATE.md — Current State Dashboard

Purpose: what's true RIGHT NOW. Not history (see Wiki/log.md), not
durable facts/decisions (see Wiki/*.md). Overwritten each session,
never appended to.

Read this first, every session. Then Wiki/index.md for anything this
file points to but doesn't explain.

**Pruned 2026-09-02 (BC-079):** this file had drifted to 1774 lines of
accumulated full-narrative `(prior)` entries — the opposite of its own
stated design. The entire pre-prune file is archived verbatim in
`Wiki/log.md` (search "PROJECT_STATE.md full pre-prune archive") as a
safety net; nothing below is a re-derivation, it's a genuine trim of
what's still true right now. Two still-open doc-debt items found in the
cut content were relocated to `TODOS.md` rather than silently dropped.

---

## Last Updated

2026-09-03 (latest) — by /execute — **BC-076 Card 3b (Notion KB ingestion
leg fix) SHIPPED, live-verified end to end.** New workflow
`Notion Fetch KB Leg` (`1o9Hr4Am1dgvEhmS`) feeds the Generic KB Ingestion
Core; SCH-004's `notion` branch retargeted to it (D6 rollback/canary
practice followed — old target `yrz1YZcWmUlIZQOx` documented, single-client
canary run before the full sweep). **Two real bugs found and fixed during
this card's own live testing:** `$('Node').all()` throws (not empty array)
when that node never ran a given execution; and — bigger — the SDK's own
zero-item-safety guidance claiming `splitInBatches.onDone` always fires on
0 input items is empirically false (caught live against Carmelli Bakery's
real page, which has flat content blocks, not nested child pages — her
sync silently never completed until fixed). **D3's original premise was
wrong**, found via live test: Carmelli's Notion Connections were never
broken; her content just isn't organized into sub-pages — now correctly
reported as `synced_count:0`, not a false failure, and tracked as a
confirmed (not hypothetical) instance of the existing "Notion leg may lose
nested-block content" TODO (upgraded P3→P2). **Pre-existing, unrelated
bug found incidentally** during the mandatory SCH-004 regression sweep:
Shopify KB ingestion is currently broken in production (UTIL-006 call
fails) — logged as a new P1 `TODOS.md` item, not fixed (out of this
card's scope). Client A's real Notion content confirmed retrievable via a
live `Search_business_kb` webhook call. Full detail:
`docs/designs/bc076-card3b-notion-kb-fix.md`,
`06_Infrastructure/n8n/Workflow_Registry.md`, `Wiki/log.md`
session-bc076-card3b-shipped.

2026-09-03 (prior) — by /commander — **BC-076 Card 3b (Notion KB
ingestion leg fix) `/plan-eng-review` CLEARED, 0 unresolved decisions.**
Human questioned whether Card 4 (canary) was worth finishing now given the
project is still in active build phase and Cards 3b/3c would likely change
the ingestion leg set — resequenced to Card 3b → Card 3c → resume Card 4,
rather than finishing Card 4 first or deferring it to a post-stable
"pre-production monitoring" phase entirely (Card 4's own DB objects are
leg-agnostic, so no rework risk from the reorder). Card 3b's review then
ran with full Mandatory MCP Verification against live n8n/Supabase/Pinecone:
confirmed INT-012 still writes to the wrong Pinecone index (`zenny-email-kb`,
not `zenny-business-kb`) and — a new finding — never writes `sync_status`
at all, making a silently-failing Notion sync currently invisible. Also
found INT-011 (Draft Email) has only 3 executions ever, last 2026-09-01 —
the "don't break a real live consumer" risk this card's own context brief
worried about turned out to be near-zero in practice. **Locked design**
(`docs/designs/bc076-card3b-notion-kb-fix.md`): build a NEW parallel
"Notion Fetch KB Leg" workflow feeding the existing Generic KB Ingestion
Core (D25) — not a re-point of INT-012 — leaving INT-012/INT-011 running
untouched (deprecated in docs only). Codex outside-voice caught 2 real
design gaps this review's own sections missed (an empty-KB parsing bug
could wipe a client's real KB via orphan-cleanup; SCH-004's production
routing retarget had no rollback/canary plan) — both folded in as D5/D6.
2 new `TODOS.md` items logged (P3): a shared fetch-adapter contract across
ingestion legs, and an audit of whether Notion's markdown export loses
content inside nested toggles/columns/tables. Full detail:
`Wiki/log.md` session-bc076-card3b-eng-review,
`Wiki/platform-quirks/notion-pinecone-kb-pattern.md`.

2026-09-03 (prior) — by /commander + /execute — **BC-076 Card 4 (canary/smoke-test) IN PROGRESS, paused for human review at T1 of 8.** Full `/plan-eng-review` + Codex outside-voice review completed and locked (`docs/designs/bc076-card4-canary-smoke-test.md`, branch `bc076-card4-canary-smoke-test`) — outside voice caught real scope creep in the original design (touching 2 shipped ingestion workflows to add a shared sync log) and forced a revision to a fully additive, canary-owned design (its own `canary_results` table, freshness via n8n's own execution-history API, retrieval probes against canary-owned fixture data, not real client content). **T1 (database) shipped and live-verified:** `control.canary_results` table + 3 `SECURITY DEFINER` RPCs (`insert_canary_result`/`get_recent_canary_results`/`prune_canary_results`), correctly locked to `service_role` only from creation. **Real, unrelated CRITICAL security bug found and fixed along the way (third occurrence of this vulnerability class):** `upsert_client_kb_source` (every KB ingestion leg's own sync-status writer, created 2026-09-02 during Card 3) had zero internal auth check and was `EXECUTE`-granted to both `anon` and `authenticated` — any caller could overwrite any client's KB source pointer. Fixed, live-verified via Security Advisor (cleared from both SECURITY DEFINER findings). Also discovered and logged as a durable pitfall: this Supabase project auto-grants `EXECUTE` to `anon`+`authenticated` on every NEW function by default — a bare `REVOKE ... FROM PUBLIC` does not remove these, an explicit `REVOKE ... FROM anon, authenticated` is required and was missed on my own first attempt at the 3 new canary RPCs before being caught and fixed same session. **T2-T8 remain** (fixture seeding across Sheets/Shopify/WooCommerce, the actual n8n canary workflow build — ~10+ nodes, validation, live testing, Workflow Registry entry, cross-tenant regression-guard check) — human chose to pause and review before continuing, not yet opened as a PR. Full detail: `Wiki/log.md` session-bc076-card4-anon-grant-third-occurrence-fixed, `Wiki/platform-quirks/anon-grant-exposure-bc052.md`.

2026-09-02 (prior) — by /execute — **Admin Provisioning client-picker fix SHIPPED: "Add Admin" no longer requires picking a client.** Human feedback after live-testing the Bootstrap card (below): minting an admin/super_admin shouldn't need a "nominal home client" — it was only there to satisfy `dashboard_users.client_id`'s old `NOT NULL` constraint. Fixed at the schema level: `client_id` is now nullable with a strict CHECK (`client_user` → must be set; `admin`/`super_admin` → must be NULL). Migration order matters and was gotten right (drop NOT NULL → backfill existing admin rows to NULL → add CHECK), a real Codex-caught correction. **Real, independent bug found and fixed in the same pass:** `dashboard_admin_list_clients()`'s login-email lookup had no role filter — could show an admin's email as a client's "login" under the wrong timing; added an explicit role filter, regression-verified against all 6 real clients. `create_admin`'s Edge Function branch and `AddAdminTab` both simplified to drop the client field entirely; the 3 provisioning tabs got visually regrouped (client actions vs. "Internal accounts"). **Live-verified end to end:** schema, the list-view regression, `create_admin` via curl with a real super_admin JWT, the `dashboard_provision_user` (client_id, role) pairing across a real remap, `map_existing`/`SUPER_ADMIN_REQUIRED` regression-checked, and the UI via `gstack /browse` against a local dev server (all 3 tabs, zero console errors). 3 new `TODOS.md` items from Codex's outside-voice review: a deferred `useProvisionForm` DRY extraction (cross-model tension, human sided with the regression-risk argument over doing it now), RPC role-guard hardening, and a multi-login "oldest wins" ambiguity. **CRITICAL security bug found and fixed during `/review`'s adversarial pass, before merge:** `map_existing`/`create_client`'s remap paths never checked the target account's current role — any plain `admin` could have silently demoted the platform's only `super_admin` to a `client_user`. Fixed with a shared server-side guard (routed through a new `SECURITY DEFINER` RPC, `dashboard_get_user_role()`, after a direct table read hit the same `service_role`-has-no-grants-on-`dashboard_users` bug for the 3rd time this project). Re-verified live: the exact attack now 403s, unaffected accounts unaffected. 2 more `TODOS.md` items logged (remap-confirm UI context, CORS wildcard). Full detail: `Wiki/log.md` session-admin-provision-client-picker-fix-shipped, `Wiki/infra/dashboard-auth-mapping.md`.

2026-09-02 (prior) — by /execute — **Admin Provisioning Bootstrap SHIPPED: `super_admin` tier, real client creation, and forced password-reset built and live-verified end to end.** Closes the admin-minting risk accepted at Card2a: minting an `admin`/`super_admin` now requires a dedicated `create_admin` Edge Function action, gated server-side on the CALLER already being `super_admin` — the original `map_existing` path can no longer assign anything but `client_user`. New `create_client` action creates a real client (`status='unprovisioned'`, archetype/schema both NULL until the client's own onboarding decides them) via a 3-write chain (client row → Auth user → mapping) with rollback at each step. **Two real bugs found and fixed live, neither caught by `tsc`/static review:** `control.dashboard_users` has zero `service_role` table grants (unlike `control.clients`), so the Edge Function's audit-column write was silently no-op'ing — fixed via a new `SECURITY DEFINER` RPC; `dashboard_admin_list_clients()`'s new `email` column returned `varchar(255)` against a declared `text` return type (same bug *class* as Card2a's `archetype_enum` mismatch) — fixed with an explicit cast. **Live-verified against a real admin session** (curl + a real password-grant JWT): platform 401s, `map_existing`'s role restriction, `create_admin`'s `super_admin`-only gate proven against a genuinely freshly-minted `admin` account (not hypothetical), forged-role-in-body ignored, duplicate-email 409, invalid-client-id 400, `dashboard_admin_list_clients()` regression-checked against all 6 real clients via PostgREST. All synthetic test accounts cleaned up after (zero leftover, confirmed). **Disclosed, not hidden:** promoting `admin@zenny.internal` to `super_admin` ahead of this shipping means the *old, still-deployed* dashboard code temporarily shows that account a client's orders view instead of the admin panel, until this merges and the container redeploys — no data risk, closes on ship. The new UI (Add Client/Add Admin tabs, client list, forced password-change) is `tsc`/`oxlint`-clean but not yet browser-click-tested (same structural gap Card2a's own T7 disclosed — the deployed container serves `main`). One new `TODOS.md` follow-up: a freshly created "unprovisioned" client can log in immediately but hits a clean RPC exception on every page until provisioning finishes. Full detail: `Wiki/log.md` session-admin-provisioning-bootstrap-shipped, `Wiki/infra/dashboard-auth-mapping.md`.

2026-09-02 (prior) — by /execute — **BC-076-Card3 SHIPPED: Shopify + WooCommerce KB ingestion built and live-verified end to end.** New shared `Generic KB Ingestion Core` (D25) extracted from `KR0kHvk3kJRThrX5`; new Shopify (GraphQL Admin API, D28) and WooCommerce (REST) fetch/normalize workflows, both calling the shared core; `SCH-004`'s dispatcher extended with 2 new routing branches. **Real bug found and fixed live (not by static validation):** `get_client_connection`'s `p_category` filters on a functional grouping (`'ecommerce'`), not the provider name — both new workflows initially passed the wrong value, fixed after UTIL-006 correctly rejected a real connected account. **Real, independently-verified proof:** 14 real Shopify products fetched from Carmelli Bakery's live store, embedded, and upserted (Pinecone `describe-index-stats` confirmed 28→42 records); a real `Search_business_kb` webhook call returned the exact seeded Shopify content; cross-tenant isolation re-confirmed (Client A sees none of it). **WooCommerce's known-flaky test store reproduced live** (non-JSON response) — the ingestion code correctly degraded safely (zero vectors written, no corruption), but a genuine successful WooCommerce sync remains unproven for lack of a working test store (tracked in `TODOS.md`). One design gap found and fixed in the same pass: a failed read and a genuinely empty source were both reported as `status:'success'` — now `status:'failed'` when a read didn't complete and produced zero rows. Sheets (`KR0kHvk3kJRThrX5`) was deliberately NOT migrated to call the new shared core this pass (real refactor risk on shipped code) — tracked as its own `TODOS.md` follow-up. Full detail: `Wiki/log.md` session-bc076-card3-shipped, `06_Infrastructure/n8n/Workflow_Registry.md`.

2026-09-02 (prior) — by /commander — **BC-076-Card3 `/plan-eng-review` CLEARED, scope narrowed from the original 4-leg blueprint framing to 2.** Live verification found the "4 equivalent ingestion legs" premise was wrong: generalized-Notion already has active daily infra (INT-012/SCH-004) but silently upserts into the wrong Pinecone index (`zenny-email-kb`, not `zenny-business-kb`) and lacks Card2b/2c's hardening — split out as Card 3b, not built now. Baserow turned out to mean hosting a real self-hosted instance (per the blueprint's own "embedded" framing), not collecting a client credential — split out as Card 3c. **Card 3 itself = Shopify + WooCommerce ingestion only**, built via a newly-extracted shared generic ingestion core (pulled out of the shipped `KR0kHvk3kJRThrX5` Sheets workflow, to stop the exact drift that broke Notion from happening again). Codex outside-voice caught Shopify's REST product API is 2026-legacy (locked GraphQL instead) and forced a much richer product-serialization shape (SKU/URL/category/tags/vendor/stock, not just title+price). 6 decisions locked (D24-D29), 1 new `TODOS.md` item (webhook-driven incremental sync, future). Full spec + 9-task implementation plan: `docs/designs/zenny-launch-blueprint.md` (eighth pass). Full detail: `Wiki/log.md` session-bc076-card3-eng-review.

2026-09-02 (prior) — by /commander — **Admin-provisioning redesign `/plan-eng-review` CLEARED.** Extends BC-076-Card2a's admin panel: Add Client (creates a new client login + `unprovisioned`-status shell row, not just mapping to an existing one), Add Admin gated by a new `super_admin` tier (closes the accepted admin-minting risk), a client list view, forced password-change on first login. Live verification found `control.clients.archetype`/`client_schema_name` are NOT NULL (blocks a literal shell row — resolved: loosen both, audit consumers) and that a schema-cloning function (`create_client_schema_from_template`) already exists but is dead/unverified code (explicitly NOT used by this card). Codex outside-voice raised 2 real tensions, both resolved with human sign-off. 6 findings total, all resolved; 2 new `TODOS.md` items (client-status lifecycle is broken; the schema-clone function needs validation before anything trusts it). Full spec + 9-task implementation plan: `docs/designs/admin-provisioning-redesign-bootstrap.md`. Human-confirmed sequencing: BC-076 Card 3 builds first, this Build Card second. Full detail: `Wiki/log.md` session-admin-provisioning-redesign-eng-review.

2026-09-02 (prior) — by /execute — **Repo renamed + doc/infra hygiene pass, ahead of BC-076 Card 3.** GitHub repo renamed live: `zeromanualai/zenny-producition-sync` → `muhaiminul00/zenny-ai` (ownership had already moved to `muhaiminul00`; this fixed the repo name/typo). Local `origin` remote and the `zenny-dashboard` VPS container's hardcoded clone URL both fixed and live-verified (container redeployed, confirmed serving real traffic post-redeploy). `Claude_Build_Command_Protocol_v2.md` (removed by the human) had 4 dangling `CLAUDE.md` pointers — stripped, nothing substantive lost (already inline elsewhere in `CLAUDE.md`). Full detail: `Wiki/log.md` session-repo-rename-and-doc-cleanup. **Next:** BC-076 Card 3 (remaining ingestion legs) — unchanged from before this housekeeping pass.

2026-09-02 (prior) — by /execute — **BC-076-Card2a SHIPPED: dashboard OAuth bug fixed (real root cause was a 3-week-stale deployment, not a grants bug), admin dashboard-user provisioning built, hardened by review, and live-verified end to end.** The reported error was the live `zenny-dashboard` container serving pre-BC-052 code — fixed via a human-approved container restart, no code change needed. New: `role='admin'` support (`dashboard_users_role_check_constraint`, `dashboard_get_my_role()`, `dashboard_admin_list_clients()`), a new version-controlled Edge Function (`admin-provision-dashboard-user` — this project's first, breaking the no-repo-source convention for this one admin/security boundary), and a `/admin/provision` page. `/review`'s Codex adversarial pass found 2 false-positive "critical" findings (verified wrong live) and 5 real ones, all fixed (auth-check ordering, UUID validation, full pagination, a real `remap` confirmation, orphaned-user rollback). Two real bugs caught only by live testing, not static checks: an admin account showing the same UI as a client (fixed architecturally — admin/client routes now fully separated); an `archetype_enum`-vs-`text` cast bug in the new client-list RPC (caught by the browser click-through, fixed). Credential Gate initially flagged for Shopify turned out to be a false alarm — the human clarified the two existing test/demo accounts already have every provider connected between them (documented in new `Wiki/credentials/test-fixture-clients.md`). Shipped via PR #9, squash-merged, full browser click-through completed post-merge both directions (admin-only view; non-admin blocked from admin routes). Full detail: `Wiki/log.md` session-bc076-card2a-dashboard-oauth-shipped, `Wiki/infra/dashboard-auth-mapping.md`. **Next:** BC-076 Card 3 (remaining ingestion legs — Shopify/WooCommerce/Baserow/generalized Notion) can now build against the two existing connected test clients; Card 4 (canary/smoke-test) can run in parallel.

2026-09-02 (prior) — by /commander — **gstack-pilot v1.6.1 confirmed live for this project.** Human ran `/plugin update gstack-pilot@gstack-pilot`; verified via `~/.claude/plugins/installed_plugins.json` that this project's entry now resolves `installPath`/`version` to `1.6.1`. The mode.json-handback deadlock fix (T7.2) is in effect going forward — no further action needed on it. Also: the image-based product search request from BC-076-Card2b (correctly scoped out at the time, but never actually written down) is now tracked in `TODOS.md`. Full detail: `Wiki/log.md` session-gstack-pilot-v1.6.1-plugin-update-confirmed.

**Recent history (last ~2 weeks), full narrative in `Wiki/log.md` by slug:**
- `session-bc076-card3-shipped` — Shopify+WooCommerce KB ingestion built and live-verified; a real `category`-param bug found and fixed live; WooCommerce's known-flaky test store reproduced (safe degrade confirmed, success unproven).
- `session-bc076-card3-eng-review` — `/plan-eng-review` CLEARED for BC-076 Card 3, scope narrowed to Shopify+WooCommerce only; Notion fix and Baserow infra split out as Card 3b/3c.
- `session-admin-provisioning-redesign-eng-review` — `/office-hours` design doc + `/plan-eng-review` CLEARED for the admin-panel redesign (Add Client/Add Admin/super_admin tier/client list); queued after BC-076 Card 3.
- `session-repo-rename-and-doc-cleanup` — repo renamed `zenny-producition-sync` → `zenny-ai`, stale git remote + VPS clone URL fixed, `Claude_Build_Command_Protocol_v2.md` removal's dangling doc pointers cleaned up.
- `session-gstack-pilot-v1.6.1-modejson-exemption-shipped` — the mode.json handback deadlock found + fixed + released as gstack-pilot v1.6.1 (PR #10).
- `session-bc077-t5-t7-closed` — BC-077's remaining tasks closed; found the trivial-housekeeping PR-exemption wasn't actually being applied (BC-078 went through a full PR when it qualified for direct-to-main).
- `session-bc078-safe-gate-reconcile-shipped` — safe-gate number mismatch (5 vs 3) reconciled, plugin ambiguity (role-modes vs gstack-pilot) disambiguated.
- `session-claude-md-modes-section-removed` — root CLAUDE.md's old Modes section removed (superseded by gstack-pilot).
- `session-bc077-gstack-pilot-migration-shipped` — Zenny migrated from plain `role-modes` to `gstack-pilot` (BC-077).
- `session-bc076-card2c-d20-rename-safety-fix-shipped` — D20's rename-safety gap closed in Sheets KB Ingestion (orphan-vector cleanup via Pinecone `/vectors/list` diffing), live-verified against real orphan vectors.
- `session-bc076-card2b-d20-gap-d17-fixed` / `session-bc076-card2b-shipped` / `session-bc076-card2b-blocked` — Sheets KB ingestion built, credential-gated, then shipped and live-verified; D20's rename gap discovered here (fixed in Card2c above).
- `session-bc076-card1-shipped` — the severe `Search_business_kb` client_id-null bug fixed; KB tool live-verified with real cross-tenant isolation proof.
- `session-bc076-followup-kb-client-id-bug` — that same bug first found (severe, blocking).
- `session-bc076-first-slice` — KB tool schema + sub-workflow first built, wired into all 3 shipped archetypes.
- `session-bc076-unblock-sequence-planned` — BC-076's card sequencing locked via `/plan-eng-review` (Card 1 → 2a/2b → 3 → 4).
- Earlier history (BC-072/073/074/075 archetype builds, the gstack-pilot v1.0-1.5 build history, the pre-pivot Convocore-era build BC-001 through BC-071, `zm-brain` tooling-development sessions): all in `Wiki/log.md`, not reproduced here.

---

## Current Phase

**Active track: Phase 14 — Zenny Own Runtime (SaaS Pivot).** Zenny
stopped the Convocore service and committed to its own n8n+Supabase
infrastructure (2026-08-29). Shipped so far: BC-072 (shared runtime
foundation), BC-073/074/075 (commerce-ecom/appointment/consultation
archetype nodes), BC-076 Cards 1/2a/2b/2c/3 (business-memory KB tool +
dashboard OAuth fix + admin provisioning + Sheets ingestion + rename-
safety fix + Shopify/WooCommerce ingestion — all live-verified),
BC-077/078 (migrated tooling from `role-modes` to `gstack-pilot`,
safe-gate reconciled), Admin Provisioning Bootstrap (`super_admin` tier,
real client creation, forced password-reset — all live-verified).
**Next: Card 3b (Notion fix) → Card 3c (Baserow infra) → finish BC-076
Card 4** (canary/smoke-test, resequenced 2026-09-03 — see Last Updated
below). Cards 3b/3c each need their own `/plan-eng-review` pass before
a Build Card.
Target architecture docs: `05_Platform_Builds/Zenny_SaaS/`
MultiNode Runtime v1.0 + Channel Adapter v2.0. Full record:
`docs/designs/zenny-saas-runtime-pivot.md`,
`Wiki/decisions/zenny-saas-runtime-pivot.md`,
`docs/designs/zenny-launch-blueprint.md`.

**Paused, not active, kept as historical/architectural reference only:**
Phases 0-13 (the original Convocore-based build — Core Agent, Growth
Agent, Conversion Engine, Recovery Engine, Email Manager, etc., all
shipped and live-tested on that track before the pivot). Full detail,
including the module-by-module status table as it stood at pause time:
`Wiki/log.md`'s pre-prune archive (this file, above).

## Module Status (active track only)

- **Business KB tool** (`Search_business_kb`) — ✅ working, wired into
  all 3 shipped archetype Agents, real cross-tenant isolation
  live-proven (BC-076-Card1).
- **Sheets KB ingestion** (`KR0kHvk3kJRThrX5`) — ✅ working, published,
  D20 rename-safety gap closed (BC-076-Card2c) — orphaned vectors are
  now self-cleaning on every sync via Pinecone `/vectors/list` diffing.
- **Commerce-ecom / Appointment / Consultation archetype nodes**
  (BC-073/074/075) — ✅ working, shipped, live-verified.
- **gstack-pilot** (Commander/Execute/Advisor tooling plugin) — v1.6.1,
  confirmed live for this project (see Last Updated above).
- **Dashboard admin provisioning** (`/admin/provision`,
  `admin-provision-dashboard-user` Edge Function) — ✅ working, shipped
  BC-076-Card2a, live-verified via browser click-through both
  directions (admin-only view; non-admin blocked from admin routes).
- **Dashboard "Disconnect" flow** — ✅ working again; the real bug was a
  3-week-stale container deployment, not a code defect (BC-076-Card2a).
- **Shopify KB ingestion** (`a7VNICxO5vPAp034`) — ✅ working, published,
  live-verified against Carmelli Bakery's real store (14 products,
  real `Search_business_kb` retrieval proof) — BC-076-Card3.
- **WooCommerce KB ingestion** (`omhitVMzXB5jXE8A`) — ✅ built, published,
  fails safely against real (broken) test data — BC-076-Card3. A
  genuine successful sync is unproven; Client A's only test store is
  known-flaky (`TODOS.md`).
- **Generic KB Ingestion Core** (`XxkqBACpoJiifl0T`) — ✅ working, shared
  by Shopify/WooCommerce; Sheets (`KR0kHvk3kJRThrX5`) not yet migrated
  to it (disclosed scope trim, `TODOS.md`) — BC-076-Card3.
- Baserow (Card 3c) and the Notion leg's wrong-Pinecone-index fix
  (Card 3b) — not yet built, real live-verified findings, each needs
  its own `/plan-eng-review` pass before a Build Card.
- **Admin Provisioning Bootstrap** (`super_admin` tier, `create_client`/
  `create_admin` Edge Function actions, forced password-reset) — ✅
  working, live-verified against a real admin session (curl + a real
  JWT) AND browser-click-tested for real (ran the Dashboard locally
  against the live Supabase project since the deployed container still
  serves `main` — closes the gap Card2a's own T7 disclosed).
- **Admin Provisioning client-picker fix** (`dashboard_users.client_id`
  now nullable with a strict role-conditional CHECK; `AddAdminTab` no
  longer requires a client) — ✅ working, live-verified end to end
  (schema, Edge Function via curl, UI via `gstack /browse` against a
  local dev server). Also fixed in the same pass: a real, independent
  role-filter gap in `dashboard_admin_list_clients()`'s login lookup.

Pre-pivot module status (Core Agent, Growth Agent, Conversion Engine,
Recovery Engine, Email Manager, Dashboard 5B/5C, Credentials Platform,
Infra) — all were ✅ working at pause time; full detail archived in
`Wiki/log.md`.

## Active Blockers

**None currently open for the active Phase 14 track.**

Pre-pivot (Convocore-era) blockers were either closed (see archive) or
are dormant/external with no current-track dependency (Convocore's
REST API 403, no live Calendly/WooCommerce test connection, `UTIL-002`
having no caller — explicitly "not urgent, no live risk" at the time).
Not reproduced here; full list in `Wiki/log.md`'s pre-prune archive.

**Two doc-debt items from that list were still genuinely relevant** (the
`appointments` table and SCH-007 are used by the current track, not
just the old one) — relocated to `TODOS.md` rather than archived, so
they don't get lost. See `TODOS.md`'s "Documentation debt" section.

## Test-Client Roster

**Confirmed live for the current track (BC-076-Card2a, 2026-09-02) —
real connected providers between two accounts, full detail in
`Wiki/credentials/test-fixture-clients.md`:**
```
test-dashboard-bc015@zenny.internal — Client A (baa673b5-c51a-4a7b-91f5-a37027f8dca4, commerce_ecom)
  → Google Calendar, Gmail, WooCommerce (https://zenny-woocom.free.je) — all connected
carmelli.zennyai@gmail.com — Carmelli Bakery (eb27a21f-209d-4b6d-8f6e-cb216411f6c4, commerce_ecom, real demo business)
  → Calendly, Shopify (ember-and-co-ozearycd.myshopify.com) — both connected
admin@zenny.internal — dashboard admin (role='super_admin' as of the Admin Provisioning Bootstrap card, nominal home Client A) — created BC-076-Card2a, promoted 2026-09-02
```

Pre-pivot roster (Convocore era, unrelated client_ids, not re-confirmed
against the current track):
```
Client B (old): 7e2dffbf-97a2-46d8-b60f-6782379f02b6 — emergency — client_test_001_acme_emergency_test
Client C (old): 2d0fafb6-72c8-4751-a7c0-cc77cf743807 — appointment — client_test_003_acme_appointment_test
Client D (old): e5f6a7b8-0001-4c1d-9e2a-000000000004 — consultation — client_test_004_acme_consultation_test
Client E (old): e5f6a7b8-0001-4c1d-9e2a-000000000005 — engagement — client_test_005_acme_engagement_test
```

## Next

**Admin Provisioning client-picker fix — SHIPPED** (see Last Updated
above). **Admin Provisioning Bootstrap — SHIPPED.** **BC-076 Card 3 —
SHIPPED** (Shopify + WooCommerce ingestion). **BC-076 Card 3b — SHIPPED**
(Notion KB ingestion leg fix, see Last Updated above). **Card 4
(canary/smoke-test) — PAUSED, T1 of 8 done** (branch
`bc076-card4-canary-smoke-test`, not yet PR'd; `control.canary_results`
table + 3 RPCs already live in Supabase, leg-agnostic so no rework risk
from resequencing below). **Next in queue: Card 3c**, per the resequencing
decision below.

**Resequencing decision (2026-09-03, /commander):** human raised the
concern that finishing Card 4 now, before Cards 3b/3c change the
ingestion leg set, risks rebuilding canary fixtures/config twice.
Recommended and agreed: do **Card 3b → Card 3c → then resume Card 4's
T2-T8** once the leg set is settled, rather than finishing Card 4 now or
deferring it all the way to a post-stable "pre-production monitoring"
phase. Reasoning: Card 4's retrieval-probe half is already decoupled
from ingestion internals (one config-array entry per leg, per its
locked design) so the rework risk is narrow — mainly the
already-flagged-as-v1 freshness mechanism — but sequencing 3b/3c first
avoids touching the canary build mid-flight at all.

**Follow-ups, tracked not dropped:**
- **Card 3b — SHIPPED**, see Last Updated above.
- **Card 3c** (embedded Baserow — new self-hosted infra + client-facing
  catalog UI, then its ingestion leg) — not yet specced, needs its own
  `/plan-eng-review` pass.
- Migrate Sheets ingestion to the shared Generic Ingestion Core, and get
  a real working WooCommerce test store — both in `TODOS.md`.
Full current backlog: `TODOS.md`.

Pre-pivot "Next Build Card" content (the Convocore Path A/Path B
roadmap, BC-057 through BC-071, the dual-path plan, the old Handoff
Note) is paused-track history — archived verbatim in `Wiki/log.md`,
not reproduced here since none of it is current-track work.
