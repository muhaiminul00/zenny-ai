# PROJECT_STATE.md — Current State Dashboard

Purpose: what's true RIGHT NOW. Not history (see Wiki/log.md), not
durable facts/decisions (see Wiki/*.md). Overwritten each session,
never appended to.

Read this first, every session. Then Wiki/index.md for anything this
file points to but doesn't explain.

---

## Last Updated
2026-08-12 — by /execute — BC-043 complete: WF-019 SendEmailReply built
and published (Phase 10, Email Manager — first workflow in this phase).
Generic transactional email-send Tool, exclusive owner of `send-*`
email tools. Real idempotency guard (`get_email_record` RPC, short-
circuits an already-sent `email_id`), Stop Checker suppression,
UTIL-006-resolved Gmail send, Pattern B->D fallback to WF-017 human
handoff — mirrors WF-018's proven design. 2 new public RPCs
(`get_email_record`, `update_email_send_result`), both safely no-op
when no `emails` row exists yet (expected until INT-009/010/011 are
built). Live-verified end-to-end against Client A (real Gmail send,
real RPC calls, execution 7511) plus 6 `test_workflow`-pinned scenarios
(success, validation error, idempotent short-circuit, suppressed,
credential-unavailable, send-failure) — all passed.
`Workflow_Registry.md` WF-019 entry added. Next in Phase 10: INT-009
Sync Inbox, INT-010 Categorize Email, INT-011 Draft Email, SCH-003 —
each its own Build Card per the bounded auto-handoff rule (this card
touched live n8n/Supabase, so the loop stops here for a pulse-check).

2026-08-12 (prior card this session) — BC-042 complete: `RecordConversion`'s RPC
(`insert_client_conversion_record`) now atomically flips a converting
lead's `recovery_queue.status` from `active` to `completed`, reusing
WF-018's existing eligibility gate — closes the real gap where a
converted lead could keep receiving recovery emails. No new column, no
WF-018 change. Verified with a real RPC call against a pre-existing
active test row, confirmed the flip, reverted the test data afterward.
`Workflow_Registry.md` WF-012 entry updated. This replaces BC-039's
stop-half per your 2026-08-12 decision (see Wiki/log.md
session-BC-039-decision) — the reply-trigger half (INT-007/INT-008)
stays deferred until Phase 10 (Email Manager) exists, no real trigger
surface without it.

BC-041 (2026-08-11, prior card this session) also complete: WF-018's
hardcoded UTC 8am-8pm window replaced with real per-client
`control.clients.active_hours_start_utc/active_hours_end_utc`
(default 8/20 = zero behavior change), live-verified via `test_workflow`
pinned-data executions 4379/4384. Full detail: Wiki/log.md.

## Current Phase
Phase 8 — Conversion Engine (11 Tools) — COMPLETE (11/11 built and
live-tested)
Phase 9 — Recovery Engine — IN PROGRESS (WF-018 SendRecoveryMessage +
INT-006/SCH-001 Process Recovery Queue built, published, live-verified;
cadence now fires automatically, email channel only per explicit scope
cut; INT-007/008 stop/resume not started, still deferred pending
Phase 10's reply-trigger surface)
Phase 10 — Email Manager — IN PROGRESS (WF-019 SendEmailReply built,
published, live-verified — BC-043; INT-009/010/011, SCH-003 not
started)

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
Phase 10 — Email Manager ......................... IN PROGRESS (WF-019 live; INT-009/010/011, SCH-003 not started)
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
Email Manager .......... 🟡 partial — WF-019 SendEmailReply live-
                          tested (BC-043); INT-009/010/011 (inbound
                          pipeline), SCH-003 not built
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
**BC-039 resolved (2026-08-12): split, not built as one card.**
Conversion-side gap closed by BC-042 (done). Reply-trigger side
(INT-007/INT-008) stays **deferred, not started** — real trigger
surface needs INT-009/INT-010 (Phase 10) to exist first; INT-009 is
next in the queue below.

**BC-043 complete (2026-08-12): WF-019 SendEmailReply built, published,
live-verified.** Per the bounded auto-handoff rule, the loop stopped
here (this card wrote to live n8n/Supabase) for a human pulse-check
before continuing Phase 10.

No Build Card currently issued and un-actioned. Candidates for the
next session, in dependency order for Phase 10: INT-009 Sync Inbox →
INT-010 Categorize Email → INT-011 Draft Email → SCH-003 Sync Inbox
Trigger (each depends on the previous). Other candidates: Phase 5A
(Inventory dashboard) / 5D (Onboarding dashboard), SCH-007, ADP-001
doc/reality investigation.
(`appointments` doc diff intentionally NOT in this list — see Active
Blockers, deferred.)

## Handoff Note (for next session)

**Where things stand:** Phase 8 (Conversion Engine, all 11 Tools) done.
Phase 9 (Recovery Engine) has 3/4 internal workflows live and working:
WF-018 SendRecoveryMessage (BC-036, now with per-client active-hours,
BC-041), INT-006/SCH-001 Process Recovery Queue (BC-037/038, 5-minute
cron sweep, excludes offboarded clients), and conversion-aware
suppression (BC-042, converting stops an active cadence automatically).
INT-007/INT-008 (reply-based stop/resume) deliberately deferred until
Phase 10 gets far enough to give them a real trigger surface. Phase 10
(Email Manager) itself has started: WF-019 SendEmailReply live (BC-043,
this session) — the generic send Tool the rest of the phase's internal
workflows will hand drafts/replies to. Nothing is mid-flight; the next
session starts clean. Full narrative of how each piece was built/
verified: Wiki/log.md (search by BC number).

**What's genuinely open, in priority order:**
1. No roster client (old or new) has a real connected calendar/
   ecommerce store. (Email/Gmail is the one exception, Client A only.)
2. `appointments` doc diff — deferred, see Active Blockers.
3. Phase 10 continuation: INT-009 Sync Inbox is the next real piece —
   it needs a real inbound-email pull mechanism (Gmail `messages.list`/
   `history.list` via the same UTIL-006 token pattern WF-019 uses) and
   feeds INT-010's categorization. Scope that Build Card narrowly (Sync
   Inbox only, not the full categorization pipeline in one card).
4. Everything else is a genuine next-phase choice — see Next Build
   Card candidates above.

Nothing requires human acknowledgment before proceeding — all
self-resolved document-level items from recent sessions are logged in
Wiki/log.md and their relevant Wiki/platform-quirks/ pages.
