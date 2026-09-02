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

2026-09-02 (latest) — by /execute — **Admin Provisioning Bootstrap SHIPPED: `super_admin` tier, real client creation, and forced password-reset built and live-verified end to end.** Closes the admin-minting risk accepted at Card2a: minting an `admin`/`super_admin` now requires a dedicated `create_admin` Edge Function action, gated server-side on the CALLER already being `super_admin` — the original `map_existing` path can no longer assign anything but `client_user`. New `create_client` action creates a real client (`status='unprovisioned'`, archetype/schema both NULL until the client's own onboarding decides them) via a 3-write chain (client row → Auth user → mapping) with rollback at each step. **Two real bugs found and fixed live, neither caught by `tsc`/static review:** `control.dashboard_users` has zero `service_role` table grants (unlike `control.clients`), so the Edge Function's audit-column write was silently no-op'ing — fixed via a new `SECURITY DEFINER` RPC; `dashboard_admin_list_clients()`'s new `email` column returned `varchar(255)` against a declared `text` return type (same bug *class* as Card2a's `archetype_enum` mismatch) — fixed with an explicit cast. **Live-verified against a real admin session** (curl + a real password-grant JWT): platform 401s, `map_existing`'s role restriction, `create_admin`'s `super_admin`-only gate proven against a genuinely freshly-minted `admin` account (not hypothetical), forged-role-in-body ignored, duplicate-email 409, invalid-client-id 400, `dashboard_admin_list_clients()` regression-checked against all 6 real clients via PostgREST. All synthetic test accounts cleaned up after (zero leftover, confirmed). **Disclosed, not hidden:** promoting `admin@zenny.internal` to `super_admin` ahead of this shipping means the *old, still-deployed* dashboard code temporarily shows that account a client's orders view instead of the admin panel, until this merges and the container redeploys — no data risk, closes on ship. The new UI (Add Client/Add Admin tabs, client list, forced password-change) is `tsc`/`oxlint`-clean but not yet browser-click-tested (same structural gap Card2a's own T7 disclosed — the deployed container serves `main`). One new `TODOS.md` follow-up: a freshly created "unprovisioned" client can log in immediately but hits a clean RPC exception on every page until provisioning finishes. Full detail: `Wiki/log.md` session-admin-provisioning-bootstrap-shipped, `Wiki/infra/dashboard-auth-mapping.md`.

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
**Next: BC-076 Card 4** (canary/smoke-test) — Cards 3b (Notion fix) and
3c (Baserow infra) are real follow-ups, each needing their own
`/plan-eng-review` pass before a Build Card.
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

**Admin Provisioning Bootstrap — SHIPPED** (see Last Updated above for
the full live-verification summary). **BC-076 Card 3 — SHIPPED**
(Shopify + WooCommerce ingestion). Card 4 (canary/smoke-test) can now
run against real, KB-populated test clients.

**Follow-ups, tracked not dropped:**
- **Card 3b** (Notion leg fix — re-point INT-012 to `zenny-business-kb`,
  add D19/D20-style hardening) — real, live-verified finding; not yet
  specced, needs its own `/plan-eng-review` pass.
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
