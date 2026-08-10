# PROJECT_STATE.md — Current State Dashboard

Purpose: what's true RIGHT NOW. Not history (see Wiki/log.md), not
durable facts/decisions (see Wiki/*.md). Overwritten each session,
never appended to.

Read this first, every session. Then Wiki/index.md for anything this
file points to but doesn't explain.

---

## Last Updated
2026-08-10 — by /commander — added a Handoff Note for the next session
and re-marked the `appointments` doc diff as explicitly DEFERRED (not
scheduled, not blocking) in Active Blockers. No new build work. BC-034
(Phase 8b, 11/11 Conversion Engine Tools) and BC-035 (ADP-002 allow-
list) both complete this session — see below.

## Current Phase
Phase 8 — Conversion Engine (11 Tools) — COMPLETE (11/11 built and
live-tested)

## Standing Gate
None open.

## Phase Checklist
```
Phase 0  — Environment Setup .................... COMPLETE
Phase 1  — Close Credential Platform Gaps ........ COMPLETE
Phase 2  — Convocore Database Changes ............ COMPLETE
Phase 3  — Remaining Shared Utilities ............ COMPLETE
Phase 4  — Convocore Adapter (ADP-002) ........... COMPLETE
Phase 5  — 4 New Dashboard Systems ............... IN PROGRESS (5B, 5C-read-only, Integrations done; 5A Inventory + 5D Onboarding not started)
Phase 6  — Core Agent ............................ COMPLETE
Phase 7  — Growth Agent .......................... COMPLETE
Phase 8  — Conversion Engine (11 Tools) .......... COMPLETE
Phase 9  — Recovery Engine ....................... NOT STARTED
Phase 10 — Email Manager ......................... NOT STARTED
Phase 11 — Scheduled Workflows ................... IN PROGRESS (SCH-006 live; SCH-007 logged, not built)
Phase 12 — Node-by-Node Outlines ................. NOT STARTED (cross-cutting)
Phase 13 — Template Dashboard .................... DEFERRED
```

## Module Status
```
Core Agent ............ ✅ working — Wiki: (none needed, stable)
Growth Agent ........... ✅ working
Conversion Engine ...... ✅ working — all 11/11 Tools built and live-tested (BC-034)
Dashboard (5B/5C/Int) .. ✅ working — Wiki/infra/ for deployment
Credentials Platform ... ✅ working — Wiki/credentials/
Infra (VPS/DNS/Proxy) .. ✅ working — Wiki/infra/
```

## Active Blockers
- External: no roster client has a real, working Google Calendar or
  ecommerce connection to fully live-test Conversion Engine success
  paths (Calendly `status='error'`; WooCommerce test store
  non-functional). Now also true for the 2 new BC-034 roster clients
  (consultation, engagement) — same class of external limitation, not
  a workflow gap. Wiki/credentials/calendly.md, Wiki/credentials/woocommerce.md.
- **DEFERRED (to-do, not blocking):** `Database_Structure_v4_FINAL.md`
  missing an `appointments` section — real deployed table (BC-013),
  used by 5 of 11 Conversion Engine Tools, still undocumented. Not
  blocking (BC-034 already found and fixed the one real bug this gap
  caused, in `create_client_schema_from_template`), but the doc debt
  itself is still open — owed by Commander, not applied by Claude Code
  per Section 13's standing rule. Deferred rather than scheduled;
  revisit next time this doc is touched for any other reason, or
  proactively if it starts causing a second incident.
- Doc diff owed by Commander: `n8n_Workflow_Specification_v1.md`
  missing the SCH-007 row.
- ADP-001 (Voiceflow Adapter) documented as "Production" but no
  matching live n8n workflow found — doc/reality mismatch, not
  investigated.
- UTIL-002 (Data Validator) has no real caller anywhere — not urgent,
  no live risk.
- 4 open product/design decisions, none blocking current work directly
  — see Wiki/decisions/ (calendar-category-sharing,
  disconnect-provider-revocation, dashboard-auth-mapping,
  verification-tier-redesign).
## Test-Client Roster
```
Client A: baa673b5-c51a-4a7b-91f5-a37027f8dca4 — commerce_ecom — client_test_002_acme_commerce_test
Client B: 7e2dffbf-97a2-46d8-b60f-6782379f02b6 — emergency — client_test_001_acme_emergency_test
Client C: 2d0fafb6-72c8-4751-a7c0-cc77cf743807 — appointment — client_test_003_acme_appointment_test
Client D: e5f6a7b8-0001-4c1d-9e2a-000000000004 — consultation — client_test_004_acme_consultation_test (new, BC-034)
Client E: e5f6a7b8-0001-4c1d-9e2a-000000000005 — engagement — client_test_005_acme_engagement_test (new, BC-034)
```

## Next Build Card
None issued yet. Candidates for the next Commander session: Phase 5A
(Inventory dashboard) / 5D (Onboarding dashboard), Phase 9 (Recovery
Engine), Phase 10 (Email Manager), SCH-007, ADP-001 doc/reality
investigation. (`appointments` doc diff intentionally NOT in this
list — see Active Blockers, deferred.)

## Handoff Note (for next session)

**Where things stand:** Phase 8 (Conversion Engine, all 11 Tools) is
fully done — built, live-tested, and wired into ADP-002's forwarding
path. Nothing is mid-flight; the next session starts clean, picking a
new thread from scratch.

**What just happened (BC-034 + BC-035, this session):**
- Built the last 5 Conversion Engine Tools (WF-008–WF-012), completing
  the module. Found and fixed 3 real infra bugs along the way (a
  client-onboarding function bug, a UNIQUE-constraint dedup bug, a
  response-field bug) — see `Wiki/log.md` BC-034 entry for full detail.
- Extended ADP-002's tool-forwarding allow-list to include those 5
  Tools (BC-035) — Convocore can now actually reach all 11.
- 2 new roster test clients created (consultation, engagement).

**What's genuinely open, in priority order:**
1. No roster client (old or new) has a real connected calendar/
   ecommerce store — every "success" path for calendar-integrated
   Tools has only ever been proven via `our_db_fallback`, never the
   live-provider leg. Real external blocker, not a code gap — worth
   raising with the human if a real test connection becomes available.
2. `appointments` doc diff — deferred, see Active Blockers. Low
   urgency but real; pick up opportunistically.
3. Everything else is a genuine next-phase choice, not a follow-up —
   see the Next Build Card candidates above. No dependency ordering
   forces one before another.

**Nothing requires human acknowledgment before proceeding** — no open
Standing Gate, no unresolved document-level conflict.
