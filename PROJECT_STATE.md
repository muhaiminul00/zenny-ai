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

2026-09-02 (latest) — by /execute — **Repo renamed + doc/infra hygiene pass, ahead of BC-076 Card 3.** GitHub repo renamed live: `zeromanualai/zenny-producition-sync` → `muhaiminul00/zenny-ai` (ownership had already moved to `muhaiminul00`; this fixed the repo name/typo). Local `origin` remote and the `zenny-dashboard` VPS container's hardcoded clone URL both fixed and live-verified (container redeployed, confirmed serving real traffic post-redeploy). `Claude_Build_Command_Protocol_v2.md` (removed by the human) had 4 dangling `CLAUDE.md` pointers — stripped, nothing substantive lost (already inline elsewhere in `CLAUDE.md`). Full detail: `Wiki/log.md` session-repo-rename-and-doc-cleanup. **Next:** BC-076 Card 3 (remaining ingestion legs) — unchanged from before this housekeeping pass.

2026-09-02 (prior) — by /execute — **BC-076-Card2a SHIPPED: dashboard OAuth bug fixed (real root cause was a 3-week-stale deployment, not a grants bug), admin dashboard-user provisioning built, hardened by review, and live-verified end to end.** The reported error was the live `zenny-dashboard` container serving pre-BC-052 code — fixed via a human-approved container restart, no code change needed. New: `role='admin'` support (`dashboard_users_role_check_constraint`, `dashboard_get_my_role()`, `dashboard_admin_list_clients()`), a new version-controlled Edge Function (`admin-provision-dashboard-user` — this project's first, breaking the no-repo-source convention for this one admin/security boundary), and a `/admin/provision` page. `/review`'s Codex adversarial pass found 2 false-positive "critical" findings (verified wrong live) and 5 real ones, all fixed (auth-check ordering, UUID validation, full pagination, a real `remap` confirmation, orphaned-user rollback). Two real bugs caught only by live testing, not static checks: an admin account showing the same UI as a client (fixed architecturally — admin/client routes now fully separated); an `archetype_enum`-vs-`text` cast bug in the new client-list RPC (caught by the browser click-through, fixed). Credential Gate initially flagged for Shopify turned out to be a false alarm — the human clarified the two existing test/demo accounts already have every provider connected between them (documented in new `Wiki/credentials/test-fixture-clients.md`). Shipped via PR #9, squash-merged, full browser click-through completed post-merge both directions (admin-only view; non-admin blocked from admin routes). Full detail: `Wiki/log.md` session-bc076-card2a-dashboard-oauth-shipped, `Wiki/infra/dashboard-auth-mapping.md`. **Next:** BC-076 Card 3 (remaining ingestion legs — Shopify/WooCommerce/Baserow/generalized Notion) can now build against the two existing connected test clients; Card 4 (canary/smoke-test) can run in parallel.

2026-09-02 (prior) — by /commander — **gstack-pilot v1.6.1 confirmed live for this project.** Human ran `/plugin update gstack-pilot@gstack-pilot`; verified via `~/.claude/plugins/installed_plugins.json` that this project's entry now resolves `installPath`/`version` to `1.6.1`. The mode.json-handback deadlock fix (T7.2) is in effect going forward — no further action needed on it. Also: the image-based product search request from BC-076-Card2b (correctly scoped out at the time, but never actually written down) is now tracked in `TODOS.md`. Full detail: `Wiki/log.md` session-gstack-pilot-v1.6.1-plugin-update-confirmed.

**Recent history (last ~2 weeks), full narrative in `Wiki/log.md` by slug:**
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
archetype nodes), BC-076 Cards 1/2a/2b/2c (business-memory KB tool +
dashboard OAuth fix + admin provisioning + Sheets ingestion + rename-
safety fix — all live-verified), BC-077/078 (migrated tooling from
`role-modes` to `gstack-pilot`, safe-gate reconciled). **Next: BC-076
Card 3** (remaining ingestion legs: Shopify/WooCommerce/Baserow/
generalized Notion, buildable now against the two existing connected
test clients) and Card 4 (canary/smoke-test, parallel with Card 3).
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
- Remaining ingestion legs (Shopify/WooCommerce/Baserow/generalized
  Notion) — not yet built, BC-076 Card 3. Buildable now against two
  real connected test clients — see Test-Client Roster below.

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
admin@zenny.internal — dashboard admin (role='admin', nominal home Client A) — created BC-076-Card2a
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

**BC-076 Card 3** (remaining ingestion legs: Shopify/WooCommerce/
Baserow/generalized Notion) — already named as the next scoped step in
`docs/designs/zenny-launch-blueprint.md`, buildable now against the two
real connected test clients above. Routes through `/plan-eng-review`
(architecture lock-in), not `office-hours`, per the Commander→gstack→
Execute bridge. Card 4 (canary/smoke-test) can run in parallel. Full
current backlog: `TODOS.md`.

Pre-pivot "Next Build Card" content (the Convocore Path A/Path B
roadmap, BC-057 through BC-071, the dual-path plan, the old Handoff
Note) is paused-track history — archived verbatim in `Wiki/log.md`,
not reproduced here since none of it is current-track work.
