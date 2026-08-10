# PROJECT_STATE.md — Current State Dashboard

Purpose: what's true RIGHT NOW. Not history (see Wiki/log.md), not
durable facts/decisions (see Wiki/*.md). Overwritten each session,
never appended to.

Read this first, every session. Then Wiki/index.md for anything this
file points to but doesn't explain.

---

## Last Updated
2026-08-10 — by /execute — BC-037 complete: INT-006 + SCH-001 (Process
Recovery Queue) built, published, and live-verified — a real scheduled
cron tick dispatched 4 real due rows across 3 clients through WF-018
with zero crashes, and a new `human_ownership_flag` filter (a real gap
WF-018 itself didn't cover) was confirmed excluding a human-owned row
both by direct RPC call and in the live sweep. Recovery cadence now
fires on its own — WF-018 is no longer direct-call-only. INT-007/008
(stop/resume) remain as the next follow-up Build Card (BC-038).

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
                          only); stop/resume (INT-007/008) not built
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
None issued yet. Strong candidate given dependency ordering: BC-038 —
INT-007/008 (Stop/Resume Recovery), the last piece of the Recovery
Engine's internal workflow set (Part 7.7), now that both SendRecoveryMessage
(WF-018, BC-036) and the cron dispatcher (INT-006/SCH-001, BC-037) are
live. Also open: Phase 5A (Inventory dashboard) / 5D (Onboarding
dashboard), Phase 10 (Email Manager), SCH-007, ADP-001 doc/reality
investigation. (`appointments` doc diff intentionally NOT in this list
— see Active Blockers, deferred.)

## Handoff Note (for next session)

**Where things stand:** Phase 8 (Conversion Engine, all 11 Tools) is
fully done. Phase 9 (Recovery Engine) now has 2/4 internal workflows
live: WF-018 SendRecoveryMessage (BC-036) and INT-006/SCH-001 Process
Recovery Queue (BC-037, this session) — the cadence now fires on its
own via a 5-minute cron sweep. Nothing is mid-flight; the next session
starts clean.

**What just happened (BC-037, this session):**
- Built INT-006 + SCH-001 as one workflow (`Zenny Recovery Engine -
  Process Recovery Queue`, n8n ID `crncPUwCbAQn5WgW`) — a 5-minute
  Schedule Trigger sweep that reads `control.clients`, finds due rows
  per client via a new `get_due_recovery_queue` RPC, and dispatches
  each to WF-018's production webhook. Pure dispatcher — no state
  ownership, no changes to WF-018 itself.
- Added 1 new RPC: `get_due_recovery_queue(p_schema, p_limit)`,
  SECURITY DEFINER, same dynamic-SQL convention as BC-036's 2 RPCs.
  Filters `status='active' AND human_ownership_flag=false AND
  next_follow_up<=now()` — the `human_ownership_flag` check is a real
  gap WF-018 itself never covered (Recovery_Engine_Flow.md §1.H), now
  closed at the sweep level.
- **Real architectural finding, resolved without asking (Document
  Resolution Authority — logged in Wiki/log.md):** `control.clients.
  status` is not used as a gate anywhere else in the built system
  (UTIL-001 doesn't check it either), and every roster client is
  permanently `onboarding` as a test-fixture status, not a real
  in-progress state. Gating the sweep on client status would have
  silently excluded 100% of the real roster and introduced a filter no
  other real workflow uses — so the sweep reads all clients, no status
  filter.
- **Live-tested for real, not just pinned:** a real scheduled tick
  (execution 550) fired 5 minutes after publish, unprompted, and
  processed 4 real due rows across 3 real clients with zero crashes —
  1 routed through WF-018's own Pattern D handoff (no Gmail
  connection), 2 correctly held on the time-window check, 1 correctly
  suppressed. A synthetic `human_ownership_flag=true` row was inserted
  specifically to test the new filter, confirmed excluded both by
  direct RPC call and by absence from the live sweep's dispatched
  rows, then deleted after verification (along with one other
  synthetic test row) to stop it re-firing every 5 minutes.
- **Not separately exercised this session:** a real `"sent"` pass-
  through and WF-018's own duplicate/stale-step short-circuit — every
  live tick this session landed outside the real UTC 8am–8pm window,
  so eligible sends held instead of completing. Both paths were
  already live-verified end-to-end in BC-036 and are unchanged by this
  card (WF-018 itself was not modified) — this session only verified
  the new dispatch/filter logic sitting in front of them.
- **A permission classifier denial mid-session, handled per the
  Permission Denials standing rule:** a manual `execute_workflow` call
  (to force a live tick) was blocked. Rather than force it, waited for
  the workflow's own real 5-minute schedule to fire it instead —
  achieved the same live verification without overriding the denial.

**What's genuinely open, in priority order:**
1. Recovery Engine is close but not complete — INT-007/008 (stop on
   opt-out/reply/escalation, resume from pause) are the last unbuilt
   pieces, candidate BC-038.
2. No roster client (old or new) has a real connected calendar/
   ecommerce store — still true, unchanged. (Email/Gmail is the one
   exception, Client A only.)
3. `appointments` doc diff — deferred, see Active Blockers. Low
   urgency but real; pick up opportunistically.
4. Everything else is a genuine next-phase choice — see the Next Build
   Card candidates above.

**Nothing requires human acknowledgment before proceeding** — no open
Standing Gate, no unresolved document-level conflict. The `control.
clients.status` finding above was self-resolved per the Document
Resolution Authority rule and is logged in Wiki/log.md, but per that
same rule, no further Build Card work should begin until this specific
resolution is acknowledged.
