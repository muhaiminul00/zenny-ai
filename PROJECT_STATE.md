# PROJECT_STATE.md — Current State Dashboard

Purpose: what's true RIGHT NOW. Not history (see Wiki/log.md), not
durable facts/decisions (see Wiki/*.md). Overwritten each session,
never appended to.

Read this first, every session. Then Wiki/index.md for anything this
file points to but doesn't explain.

---

## Last Updated
2026-08-13 — by /execute — BC-049 complete: Email Manager's last two
Phase 10 gaps closed. Notion credential gate resolved by the human (real
root cause was the KB root page never being added to the "n8n"
integration's Connections list — BC-048's "stored secret mismatch"
diagnosis was wrong, corrected in the Wiki). Live-verified INT-012's full
Notion→Pinecone round trip for the first time (2 real KB pages fetched,
chunked, embedded, upserted). Built+published SCH-003 (hourly INT-009
fan-out) and SCH-004 (daily INT-012 fan-out per client with a KB source),
both live-verified against the real roster — SCH-004's first run 403'd on
a missing `SELECT` grant on `control.client_kb_source` (same
USAGE/GRANT-gap pattern as `platform-quirks/postgrest-schema-exposure.md`),
fixed live, re-verified working. Phase 10 (Email Manager) is now feature-
complete: all 7 workflows (WF-019, INT-009/010/011/012, SCH-003/004) live,
chained, and cadenced. Full narrative: `Wiki/log.md`.

2026-08-13 (same day, prior) — BC-048 complete: Email Manager chain made
genuinely live-wired end to end (INT-009→010→011 fan-out), Pinecone
credential type fixed, real BC-045 categorization bug found+fixed. Full
narrative: `Wiki/log.md`.

2026-08-13 (same day, prior) — BC-047 complete: INT-011 Draft Email +
INT-012 Sync Notion KB built, published. KB source pivoted from Convocore
(billing gate) to Notion+Pinecone. Full narrative: `Wiki/log.md`.

Older entries (BC-045, BC-044, BC-043 and earlier): see `Wiki/log.md`.

## Current Phase
Phase 8 — Conversion Engine (11 Tools) — COMPLETE (11/11 built and
live-tested)
Phase 9 — Recovery Engine — IN PROGRESS (WF-018 SendRecoveryMessage +
INT-006/SCH-001 Process Recovery Queue built, published, live-verified;
cadence now fires automatically, email channel only per explicit scope
cut; INT-007/008 stop/resume not started, still deferred pending
Phase 10's reply-trigger surface)
Phase 10 — Email Manager — FEATURE-COMPLETE (WF-019, INT-009, INT-010,
INT-011, INT-012, SCH-003, SCH-004 all built/published/live-verified,
BC-043 through BC-049. KB source is Notion+Pinecone, not Convocore
(dormant). Full chain live: INT-009→010→011 genuinely chained, INT-012's
Notion→Pinecone round trip live-verified, both cadences (SCH-003 hourly
inbox, SCH-004 daily KB sync) live and dispatching for real. No open
Credential Gate.)

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
Phase 10 — Email Manager ......................... FEATURE-COMPLETE (all 7 workflows live, chained, cadenced)
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
Email Manager .......... ✅ working — WF-019, INT-009, INT-010, INT-011,
                          INT-012, SCH-003, SCH-004 all live-tested
                          (BC-043 through BC-049); KB source is
                          Notion+Pinecone, Convocore path wired-dormant;
                          full chain (INT-009→010→011) and full KB sync
                          (INT-012, both cadences) genuinely live-verified
Credentials Platform ... ✅ working — Wiki/credentials/
Infra (VPS/DNS/Proxy) .. ✅ working — Wiki/infra/
```

## Active Blockers
- **External, Convocore-KB path blocked:** Convocore's REST API now
  returns 403 "requires Business plan or higher" workspace-wide (`Zenny-
  UI` workspace, same secret/agent that worked live on 2026-08-02/04) —
  confirmed independent of MCP. `control.convocore_agent_map` stays in
  place, dormant. Not investigated further — human's call whether to
  upgrade the Convocore plan or stay on Notion+Pinecone permanently.
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
BC-039/043/044/045 (Phase 9/10 build history through 2026-08-12): see
`Wiki/log.md` — reply-trigger split, WF-019, INT-009, INT-010.

**BC-048 complete (2026-08-13): Email Manager chain genuinely live-wired.**
INT-009 → INT-010 → INT-011 now fan out for real; fixed the Pinecone
credential-type mismatch; found and fixed a real pre-existing BC-045
categorization bug. See `Wiki/log.md`.

**BC-049 complete (2026-08-13): Notion credential gate closed (human
fixed page-sharing, not a secret), SCH-003 + SCH-004 built, published,
live-verified.** Phase 10 (Email Manager) is now feature-complete — all
7 workflows live, chained, cadenced. Per the bounded auto-handoff rule,
the loop stops here (this card wrote to live n8n/Supabase state) for a
human pulse-check before starting a new phase.

No Build Card currently issued and un-actioned. Candidates for the next
session: Phase 5A (Inventory dashboard) / 5D (Onboarding dashboard),
Phase 9's INT-007/008 (reply-based stop/resume), SCH-007, ADP-001
doc/reality investigation. (`appointments` doc diff intentionally NOT in
this list — see Active Blockers, deferred.)

## Handoff Note (for next session)

**Where things stand:** Phase 8 (Conversion Engine, all 11 Tools) done.
Phase 9 (Recovery Engine) has 3/4 internal workflows live; INT-007/008
(reply-based stop/resume) deliberately deferred. Phase 10 (Email Manager)
is feature-complete: all 7 workflows live (WF-019, INT-009/010/011/012,
SCH-003/004), fully chained and cadenced, no open Credential Gate. KB
source is Notion+Pinecone; Convocore stays wired-dormant. Nothing is
mid-flight; the next session starts clean. Full narrative: `Wiki/log.md`
(search by BC number).

**What's genuinely open, in priority order:**
1. No roster client (old or new) has a real connected calendar/
   ecommerce store. (Email/Gmail is the one exception, Client A only.)
2. `appointments` doc diff — deferred, see Active Blockers.
3. Phase 9's INT-007/008 (reply-based stop/resume) — deferred, no longer
   blocked on anything Phase 10-related now that Email Manager is done.
4. Everything else is a genuine next-phase choice — see Next Build Card
   candidates above.

Nothing requires human acknowledgment before proceeding — all
self-resolved document-level items from recent sessions are logged in
Wiki/log.md and their relevant Wiki/platform-quirks/ pages.
