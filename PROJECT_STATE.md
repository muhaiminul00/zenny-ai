# PROJECT_STATE.md — Current State Dashboard

Purpose: what's true RIGHT NOW. Not history (see Wiki/log.md), not
durable facts/decisions (see Wiki/*.md). Overwritten each session,
never appended to.

Read this first, every session. Then Wiki/index.md for anything this
file points to but doesn't explain.

---

## Last Updated
2026-08-10 — by /execute — BC-036 complete: WF-018 SendRecoveryMessage
built, tested genuinely live end-to-end (real Gmail send confirmed),
and published. Phase 9 (Recovery Engine) kicked off — 1/1 planned Tool
done; INT-006/007/008 + SCH-001 (queue processing, stop/resume, cron)
remain as follow-up Build Cards, not started.

## Current Phase
Phase 8 — Conversion Engine (11 Tools) — COMPLETE (11/11 built and
live-tested)
Phase 9 — Recovery Engine — IN PROGRESS (WF-018 SendRecoveryMessage
built + live-tested, email channel only per explicit scope cut;
INT-006/007/008 + SCH-001 not started)

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
Recovery Engine ........ 🟡 partial — WF-018 SendRecoveryMessage live-
                          tested (email only); queue-processing/stop/
                          resume/cron (INT-006/007/008, SCH-001) not built
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
None issued yet. Strong candidate given dependency ordering: BC-037 —
INT-006 (Process Recovery Queue internals) + SCH-001 (cron trigger),
since the spec explicitly orders these right after SendRecoveryMessage
exists (which it now does). Also open: INT-007/008 (Stop/Resume
Recovery), Phase 5A (Inventory dashboard) / 5D (Onboarding dashboard),
Phase 10 (Email Manager), SCH-007, ADP-001 doc/reality investigation.
(`appointments` doc diff intentionally NOT in this list — see Active
Blockers, deferred.)

## Handoff Note (for next session)

**Where things stand:** Phase 8 (Conversion Engine, all 11 Tools) is
fully done. Phase 9 (Recovery Engine) is kicked off — WF-018
SendRecoveryMessage built, live-tested end-to-end (real email sent),
published. Nothing is mid-flight; the next session starts clean.

**What just happened (BC-036, this session):**
- Built WF-018 SendRecoveryMessage — email channel only, per explicit
  user scope cut (sms/whatsapp cleanly rejected as validation errors,
  not built out).
- Added 2 new RPCs: `get_client_recovery_context`,
  `advance_client_recovery_step` (the latter IS the idempotency guard —
  atomic `UPDATE ... WHERE current_step = $2`, no separate dedupe table,
  per Integration Contract Part 11.4).
- Caught and fixed 2 real bugs live via `test_workflow`/`execute_workflow`
  before publishing: (1) all 8 IF nodes had `rightValue: ''` on
  boolean/exists operators — a documented n8n platform quirk
  (`Wiki/platform-quirks/n8n-node-behaviors.md` §3) that throws
  `NodeOperationError`; (2) a genuinely new bug — `Time Window Check`
  read `$json` from its immediate predecessor (an Execute Workflow
  node whose output replaces `$json` entirely), silently losing the
  eligibility context and making `Build Message` fall back to generic
  filler text. Both fixed and re-verified before publish.
- **Live-tested for real, not just pinned:** discovered Client A
  (`client_test_002_acme_commerce_test`) has a genuinely connected
  Gmail (`control.client_connections`, category `email`, `connected`) —
  used it to send a real test email end-to-end (Gmail message ID
  confirmed, `labelIds: ["SENT"]`). All 6 planned test cases covered:
  5 live (success, suppressed, not-found, invalid-input, duplicate/
  stale-step), 1 (time-window hold) by code inspection + live hour
  computation.
- **New disclosed limitation, not a blocker:** no per-client timezone
  column exists anywhere in the schema — Time Window Check uses UTC as
  an honest placeholder for "local" 8am–8pm. Flagged in the workflow
  itself (sticky note) and in Workflow_Registry.md; revisit whenever
  timezone data is added to the platform.

**What's genuinely open, in priority order:**
1. Recovery Engine is NOT complete — INT-006 (queue processing),
   INT-007/008 (stop/resume), and SCH-001 (the actual cron that calls
   WF-018 on a schedule) are all still unbuilt. WF-018 only fires when
   called directly; nothing dispatches it automatically yet.
2. No roster client (old or new) has a real connected calendar/
   ecommerce store — still true, unchanged. (Email/Gmail is the one
   exception now confirmed working, for Client A only.)
3. `appointments` doc diff — deferred, see Active Blockers. Low
   urgency but real; pick up opportunistically.
4. Everything else is a genuine next-phase choice — see the Next Build
   Card candidates above.

**Nothing requires human acknowledgment before proceeding** — no open
Standing Gate, no unresolved document-level conflict.
