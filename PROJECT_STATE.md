# PROJECT_STATE.md — Current State Dashboard

Purpose: what's true RIGHT NOW. Not history (see Wiki/log.md), not
durable facts/decisions (see Wiki/*.md). Overwritten each session,
never appended to.

Read this first, every session. Then Wiki/index.md for anything this
file points to but doesn't explain.

---

## Last Updated
2026-08-12 — by /execute — BC-041 complete: WF-018's hardcoded UTC
8am-8pm `Time Window Check` replaced with real per-client
`control.clients.active_hours_start_utc/active_hours_end_utc`
(default 8/20 = zero behavior change, confirmed live across all 5
roster clients). New `Get Client Active Hours` node, defensive
fallback to 8/20 on fetch failure. Published; live-verified via
`test_workflow` pinned-data executions 4379 (fallback parity) and
4384 (override genuinely changes outcome) — no real client data or
email touched. `Workflow_Registry.md` + `Wiki/platform-quirks/
recovery-queue-sweep-design.md` updated. Self-invoked by Commander
per the corrected mode-Skill mechanism (see 2026-08-12
session-BC-040-followup in Wiki/log.md for that correction's detail).
Recovery Engine (Phase 9) still has INT-007/008 not started.
**BC-039 (INT-007/008 stop/resume) remains BLOCKED, not started** — see
Handoff Note: no real trigger mechanism exists yet for either workflow
(no reply-detection pipeline, no suppression-record writer, RecordConversion
never touches `recovery_queue`/`leads.status`), a genuine scope gap
surfaced during Mandatory MCP Verification, not something to silently
build around.

## Current Phase
Phase 8 — Conversion Engine (11 Tools) — COMPLETE (11/11 built and
live-tested)
Phase 9 — Recovery Engine — IN PROGRESS (WF-018 SendRecoveryMessage +
INT-006/SCH-001 Process Recovery Queue built, published, live-verified;
cadence now fires automatically, email channel only per explicit scope
cut; INT-007/008 stop/resume not started)

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
Phase 9  — Recovery Engine ....................... IN PROGRESS (WF-018 done; INT-006/007/008, SCH-001 not started)
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
Recovery Engine ........ 🟡 partial — WF-018 SendRecoveryMessage +
                          INT-006/SCH-001 Process Recovery Queue live-
                          tested, cadence fires automatically (email
                          only), per-client active-hours window
                          (BC-041); stop/resume (INT-007/008) not built
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
**BC-039 is BLOCKED pending a human scope decision — do not just start
building it.** INT-007/008 (Stop/Resume Recovery) were issued as the
next card, but Mandatory MCP Verification found no real trigger
mechanism exists for either one yet:
- INT-007 is specced to fire on "Reply Handling" — but Phase 10 (Email
  Manager, INT-009/010/011) is NOT STARTED, so there is no inbound-
  reply detection pipeline anywhere in the live system to fire it.
- Spec Section 6 says stop conditions are "checked live at every
  scheduled send" — but confirmed live that `RecordConversion` (WF-012)
  writes only to `conversions`, never touches `leads.status` or
  `recovery_queue`, and nothing anywhere writes `suppression_records`.
  A real conversion today would NOT stop an active recovery cadence.

This isn't a mechanical/verification-level gap with one obvious answer
— it's a real design choice (inline live-checks inside WF-018 vs.
separate event-triggered INT-007/008 workflows vs. wiring existing
Tools like RecordConversion to call them) that needs a human decision
before scope is set. Full detail in the Handoff Note below.

Also open once BC-039 is unblocked or reprioritized: Phase 5A
(Inventory dashboard) / 5D (Onboarding dashboard), Phase 10 (Email
Manager — note this would also unblock INT-007's real trigger), SCH-007,
ADP-001 doc/reality investigation. (`appointments` doc diff intentionally
NOT in this list — see Active Blockers, deferred.)

## Handoff Note (for next session)

**Where things stand:** Phase 8 (Conversion Engine, all 11 Tools) is
fully done. Phase 9 (Recovery Engine) has 2/4 internal workflows live
and working: WF-018 SendRecoveryMessage (BC-036) and INT-006/SCH-001
Process Recovery Queue (BC-037+BC-038, this session) — the cadence
fires on its own via a 5-minute cron sweep, now correctly excluding
offboarded clients too. INT-007/008 are blocked on a real scope
decision, not started. Nothing is mid-flight otherwise; the next
session starts clean.

**What just happened (BC-037 + BC-038, this session):**
- Built INT-006 + SCH-001 as one workflow (`Zenny Recovery Engine -
  Process Recovery Queue`, n8n ID `crncPUwCbAQn5WgW`) — a 5-minute
  Schedule Trigger sweep that reads `control.clients`, finds due rows
  per client via a new `get_due_recovery_queue` RPC, and dispatches
  each to WF-018's production webhook. Pure dispatcher — no state
  ownership, no changes to WF-018 itself.
- Added `get_due_recovery_queue(p_schema, p_limit)` RPC, filtering
  `status='active' AND human_ownership_flag=false AND next_follow_up<=
  now()` — the `human_ownership_flag` check is a real gap WF-018 itself
  never covered (Recovery_Engine_Flow.md §1.H), now closed at the
  sweep level.
- **Live-tested for real (execution 550):** 4 real due rows across 3
  real clients processed with zero crashes — Pattern D handoff, 2
  time-window holds, 1 suppression. A synthetic `human_ownership_flag=
  true` row was confirmed excluded, then deleted.
- **Commander re-verification (BC-038) caught a real second gap:**
  `control.clients.status` isn't used as a gate anywhere in the system
  — true — but `Template_Migration_Process.md` already sets a real
  precedent for excluding `offboarded` clients specifically. Patched
  `Get Active Clients` to add `status=neq.offboarded`. `paused` stays
  unfiltered — genuinely undefined anywhere, not resolved.
- **Real execution mistake, caught by live re-verification, not
  inspection:** the BC-038 `update_workflow` edit was applied but
  `publish_workflow` was forgotten — the live version kept running the
  old query for one full cron cycle (execution 598 still showed the
  synthetic offboarded test client) before it was caught and fixed.
  Re-verified clean on execution 609.
- **A permission classifier denial, twice this session, handled per
  the Permission Denials standing rule both times:** manual
  `execute_workflow` calls were blocked. Rather than force either,
  waited for the workflow's own real 5-minute schedule to fire instead
  — same verification outcome, no override.
- **Not separately exercised this session:** a real `"sent"` pass-
  through and WF-018's own duplicate/stale-step short-circuit — every
  live tick landed outside the real UTC 8am–8pm window. Both already
  live-verified in BC-036, unchanged here.

**What's genuinely open, in priority order:**
1. **BC-039 scope decision needed** — see Next Build Card above. Real
   options to put in front of the human: (a) add inline live-checks to
   WF-018's `Evaluate Eligibility` for `leads.status`/suppression per
   spec's literal wording, narrowing INT-007/008's real scope; (b)
   build INT-007/008 as standalone workflows AND wire RecordConversion
   (and whatever eventually writes suppression) to call them —
   materially larger scope than one Build Card; (c) defer INT-007/008
   until Phase 10 (Email Manager) exists, since reply-handling has no
   real trigger surface without it anyway.
2. No roster client (old or new) has a real connected calendar/
   ecommerce store — still true, unchanged. (Email/Gmail is the one
   exception, Client A only.)
3. `appointments` doc diff — deferred, see Active Blockers.
4. Everything else is a genuine next-phase choice — see Next Build
   Card candidates above.

**Nothing requires human acknowledgment before proceeding on BC-037/
BC-038 work** — both self-resolved document-level items from this
session (`control.clients.status` unfiltered; `offboarded` excluded)
are logged in Wiki/log.md and Wiki/platform-quirks/recovery-queue-
sweep-design.md. **BC-039 itself is the open item** — it needs a real
scope decision, not just an acknowledgment, before any Build Card for
INT-007/008 is issued.
