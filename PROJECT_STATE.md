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

2026-09-02 (latest) — by /commander — **gstack-pilot v1.6.1 confirmed live for this project.** Human ran `/plugin update gstack-pilot@gstack-pilot`; verified via `~/.claude/plugins/installed_plugins.json` that this project's entry now resolves `installPath`/`version` to `1.6.1`. The mode.json-handback deadlock fix (T7.2) is in effect going forward — no further action needed on it. Also: the image-based product search request from BC-076-Card2b (correctly scoped out at the time, but never actually written down) is now tracked in `TODOS.md`. Full detail: `Wiki/log.md` session-gstack-pilot-v1.6.1-plugin-update-confirmed.

**Recent history (last ~2 weeks), full narrative in `Wiki/log.md` by slug:**
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
archetype nodes), BC-076 Cards 1/2b/2c (business-memory KB tool +
Sheets ingestion + rename-safety fix — all live-verified), BC-077/078
(migrated tooling from `role-modes` to `gstack-pilot`, safe-gate
reconciled). **Next: BC-076 Card 2a** (dashboard OAuth investigation +
test-client provisioning), then Card 3 (remaining ingestion legs:
Shopify/WooCommerce/Baserow/generalized Notion) and Card 4 (canary/
smoke-test). Target architecture docs: `05_Platform_Builds/Zenny_SaaS/`
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
- Remaining ingestion legs (Shopify/WooCommerce/Baserow/generalized
  Notion) — not yet built, BC-076 Card 3.
- Dashboard OAuth / test-client provisioning — not yet investigated,
  BC-076 Card 2a (next).

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

Pre-pivot roster (Convocore era) — **not yet re-confirmed against the
current Phase 14 track; verify live before relying on these for new
work:**
```
Client A: baa673b5-c51a-4a7b-91f5-a37027f8dca4 — commerce_ecom — client_test_002_acme_commerce_test
Client B: 7e2dffbf-97a2-46d8-b60f-6782379f02b6 — emergency — client_test_001_acme_emergency_test
Client C: 2d0fafb6-72c8-4751-a7c0-cc77cf743807 — appointment — client_test_003_acme_appointment_test
Client D: e5f6a7b8-0001-4c1d-9e2a-000000000004 — consultation — client_test_004_acme_consultation_test
Client E: e5f6a7b8-0001-4c1d-9e2a-000000000005 — engagement — client_test_005_acme_engagement_test
```

## Next

**BC-076 Card 2a** (dashboard OAuth investigation + test-client
provisioning) — already named as the next scoped step in
`docs/designs/zenny-launch-blueprint.md`, so it routes through
`/plan-eng-review` (architecture lock-in), not `office-hours`, per the
Commander→gstack→Execute bridge. Full current backlog: `TODOS.md`.

Pre-pivot "Next Build Card" content (the Convocore Path A/Path B
roadmap, BC-057 through BC-071, the dual-path plan, the old Handoff
Note) is paused-track history — archived verbatim in `Wiki/log.md`,
not reproduced here since none of it is current-track work.
