# PROJECT_STATE.md — Current State Dashboard

Purpose: what's true RIGHT NOW. Not history (see Wiki/log.md), not
durable facts/decisions (see Wiki/*.md). Overwritten each session,
never appended to.

Read this first, every session. Then Wiki/index.md for anything this
file points to but doesn't explain.

---

## Last Updated
2026-08-14 (later) — by /execute — BC-052 complete: Connection Lifecycle
Actions built, live-verified. **Also: a critical live security exposure
found mid-card and fixed** — ~40 internal RPCs (read_credential_secret,
etc.) were granted EXECUTE to `anon` with no internal caller-identity
check, live-exploitable via the public anon key to read any client's
Vault secrets or forge data cross-tenant. Human approved an immediate
fix; `REVOKE ... FROM anon` applied across all affected functions,
live-verified (anon now denied, service_role/n8n unaffected). Full
writeup: `Wiki/platform-quirks/anon-grant-exposure-bc052.md`. New Edge
Function `connection-lifecycle` gives the dashboard real Revoke (Google/
Calendly have real provider endpoints, live-tested; Shopify/WooCommerce
have no app-initiated revoke API at all — honestly disclosed, not
faked) + Refresh (Google live-tested non-destructively; Shopify built
but untested, no live connection exists) + Reconnect (reuses existing
Connect flow, no new backend). `Integrations.tsx` updated, typecheck/
lint clean; full browser click-through not done (no test-user
credentials — disclosed). Full narrative: `Wiki/log.md`.

2026-08-14 (earlier) — by /execute — BC-051 complete: Dashboard Auth Mapping built.
New `control.dashboard_users(auth_user_id, client_id, role)` table
replaces the `app_metadata.client_schema_name` stopgap (BC-015). Both
existing dashboard RPCs (`dashboard_get_my_client_schema`,
`dashboard_get_my_client`) migrated to read it, live regression-tested
identical to pre-migration behavior; new `service_role`-only
`dashboard_provision_user` RPC is the real replacement for manually
setting `app_metadata` going forward (no dashboard-UI flow calls it yet
— none exists). All 5 acceptance criteria live-verified (backfill,
regression, fail-closed, provisioning upsert + permission denial,
direct-table-access denial). Human had already decided, in the prior
advisor-mode conversation, all 4 previously-open product decisions
(`Wiki/decisions/`): calendar category-sharing stays as-is (closed, no
build); provider revocation gets built (BC-052, queued next); this auth
mapping gets built (BC-051, done); verification-tier redesign gets built
opt-in per client (BC-053, queued after BC-052). Full narrative:
`Wiki/log.md`.

2026-08-13 (prior) — by /execute — BC-050 complete: INT-007 (Stop Recovery) and
INT-008 (Resume Recovery) built, published, live-verified. Scoped correctly
via live investigation rather than the original assumption: INT-007's real
trigger (INT-009/010's per-email customer resolution) was genuinely
unblocked by Phase 10; INT-008's real trigger (`human_ownership_flag`
clearing) is NOT reply-based and has no writer anywhere in the built system
— confirmed by grep — so it was built + live-tested standalone, no caller
wired, per explicit human decision. INT-007 wired directly into INT-010
(fires on every inbound email, before categorization); a real end-to-end
run proved a reply gets both correctly categorized/drafted AND its
`recovery_queue` row genuinely stopped. New RPCs:
`stop_client_recovery_for_customer`, `resume_client_recovery`. Investigation
also surfaced a real pre-existing gap: no per-archetype max-recovery-step
count exists anywhere in the DB, and neither WF-018 nor INT-006 enforce the
"max steps reached → Stopped" condition — not fixed this card (out of
scope), flagged below. Full narrative: `Wiki/log.md`.

2026-08-13 (same day, prior) — by /execute — BC-049 complete: Email Manager's last two
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
INT-006/SCH-001 Process Recovery Queue + INT-007 StopRecovery + INT-008
ResumeRecovery all built, published, live-verified; cadence fires
automatically, email channel only per explicit scope cut; INT-007 is
genuinely wired live into INT-010's per-email chain; INT-008 is built and
proven but has no real caller yet — its actual trigger,
`human_ownership_flag` clearing, is written nowhere in the built system,
see Active Blockers)
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
Phase 9  — Recovery Engine ....................... IN PROGRESS (WF-018, INT-006/007/008, SCH-001 all built; INT-008 has no caller yet)
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
Dashboard (5B/5C/Int) .. ✅ working — auth mapping now real (BC-051,
                          control.dashboard_users); Integrations page has
                          real Revoke/Reconnect/Refresh (BC-052); a
                          critical anon-key RPC exposure was found+fixed
                          same session (see Active Blockers for the
                          smaller residual gap); Wiki/infra/ for deployment
Recovery Engine ........ 🟡 partial — WF-018 SendRecoveryMessage +
                          INT-006/SCH-001 Process Recovery Queue +
                          INT-007 StopRecovery + INT-008 ResumeRecovery
                          all live-tested, cadence fires automatically
                          (email only), per-client active-hours window
                          (BC-041); INT-007 genuinely wired into INT-010;
                          INT-008 has no caller yet (see Active Blockers)
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
- **INT-008 (Resume Recovery) has no caller:** built and live-tested
  (BC-050) but its real trigger — `human_ownership_flag` flipping back to
  `false` when a human closes their task without the customer replying —
  is written nowhere in the built system (confirmed by grep). No dashboard
  action or workflow currently clears this flag. Needs its own future
  Build Card once the ownership-release mechanism itself is scoped (likely
  a dashboard action on an escalation/`active_issues` row); not urgent,
  Recovery Engine functions correctly without it (WF-018 still won't send
  to a human-owned lead, per the existing gate — leads just stay Paused
  indefinitely instead of auto-resuming).
- **Recovery cadence's "max steps reached → Stopped" condition is not
  enforced anywhere real:** discovered during BC-050. No per-archetype
  max-step count exists in the DB (`leads.recovery_profile` is free text),
  and neither WF-018 nor INT-006/SCH-001 check current_step against any
  max. INT-008 reproduces `Recovery_Engine_Flow.md` §3's documented step
  counts as a local hardcoded map for its own use, but that doesn't fix
  the sweep — a lead could theoretically keep receiving recovery sends
  past its archetype's documented max step count. Not fixed this card
  (out of BC-050's scope); worth a small future Build Card (add the same
  max-step check to `get_due_recovery_queue` or WF-018 itself).
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
- UTIL-002 (Data Validator) has no real caller anywhere — not urgent,
  no live risk.
- **Residual, smaller-severity security gap (found BC-052, not fixed):**
  the connect/lifecycle Edge Functions (`oauth-callback`,
  `shopify-connect`, `woocommerce-connect`, `connection-lifecycle`) all
  trust `client_id` from the request body rather than verifying it
  against the caller's own JWT (`verify_jwt: false`, a project-wide
  convention predating BC-052, not introduced by it). Low real risk
  today (client_id UUIDs aren't guessable, one real dashboard user
  total), worth a small future Build Card once self-serve signup makes
  client_id enumeration a real concern. See
  `Wiki/platform-quirks/anon-grant-exposure-bc052.md`.

(ADP-001 doc/reality mismatch dropped per human instruction, 2026-08-14
— no longer tracked. The 4 open product/design decisions were all
resolved 2026-08-14 — see Wiki/decisions/: BC-051 done, BC-052 done,
BC-053 queued, 1 closed with no build needed. A critical anon-grant
RPC-exposure bug, unrelated to any of the 4 decisions, was found and
fixed live during BC-052 — see Last Updated above.)
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
7 workflows live, chained, cadenced.

**BC-050 complete (2026-08-13): INT-007 (Stop Recovery) + INT-008
(Resume Recovery) built, published, live-verified.** INT-007 genuinely
wired into INT-010's live chain. INT-008 built standalone, no caller yet
(real blocker, see Active Blockers).

**BC-051 complete (2026-08-14): Dashboard Auth Mapping built, live-
verified.** `control.dashboard_users` replaces the `app_metadata`
stopgap. See Last Updated above and `Wiki/infra/dashboard-auth-mapping.md`.

**BC-052 complete (2026-08-14): Connection Lifecycle Actions built,
live-verified, plus an unplanned critical security fix mid-card** (see
Last Updated above — anon-granted internal RPCs, fixed same session).
Real revoke: Google + Calendly (real provider endpoints, live-tested);
Shopify + WooCommerce honestly disclosed as local-only (no
app-initiated revoke API exists for either — a real finding, not a
build gap). Refresh: Google live-tested non-destructively; Shopify
built but not live-tested (no live Shopify connection in the roster).
Reconnect: no new backend, reuses the existing Connect flow.

**Issued, queued next (approved by human, not yet started):**
- **BC-053 — Verification Approval Queue:** third tier (queued human-
  approval → real auto-execute) for WF-013 CancelAppointment / WF-016
  UpdateCustomer, **opt-in per client** (new `control.clients` flag,
  default off — human-decided 2026-08-14, does not replace always-handoff
  by default). Requires Phase 5C Appointments dashboard to go read-only →
  write-capable. Depends on BC-051 (done). Likely spans >1 session.

ADP-001 (Voiceflow Adapter doc/reality mismatch) dropped from candidates
per human instruction (2026-08-14) — no longer worth investigating.

Other candidates for whenever there's room: Phase 5A (Inventory
dashboard) / 5D (Onboarding dashboard), SCH-007, the recovery
max-steps-enforcement gap (design direction discussed: per-client
`max_recovery_steps` override falling back to a small
`control.archetype_recovery_defaults` lookup table, not a flat default —
not yet a Build Card), scoping INT-008's ownership-release caller (likely
folds into BC-053's escalation/approval-queue work rather than being
separate — worth scoping together when BC-053 starts). (`appointments`
doc diff intentionally NOT in this list — see Active Blockers, deferred.)

## Handoff Note (for next session)

**Where things stand:** Phase 8 (Conversion Engine, all 11 Tools) done.
Phase 9 (Recovery Engine) has all 4 internal workflows + SCH-001 live
(WF-018, INT-006, INT-007, INT-008); INT-007 is genuinely wired into
Email Manager's live chain, INT-008 is proven but has no caller (see
Active Blockers). Phase 10 (Email Manager) is feature-complete: all 7
workflows live (WF-019, INT-009/010/011/012, SCH-003/004), fully chained
and cadenced, no open Credential Gate. KB source is Notion+Pinecone;
Convocore stays wired-dormant. BC-051 (Dashboard Auth Mapping) and
BC-052 (Connection Lifecycle Actions) both shipped this session — real
`control.dashboard_users` caller-identity mechanism, and real
Revoke/Reconnect/Refresh on the Integrations page. A critical anon-key
RPC exposure was also found and fixed live mid-BC-052 (see Last Updated
above and `Wiki/platform-quirks/anon-grant-exposure-bc052.md`). Nothing
is mid-flight; the next session starts clean. Full narrative:
`Wiki/log.md` (search by BC number).

**What's genuinely open, in priority order:**
1. **BC-053 (Verification Approval Queue) is issued and approved, not
   yet started** — see Next Build Card above for full scope/deps.
   Likely spans >1 session.
2. The residual Edge Function client_id-trust gap (BC-052 finding, low
   severity today) — see Active Blockers.
3. `appointments` doc diff — deferred, see Active Blockers.
4. INT-008's ownership-release caller — worth scoping together with
   BC-053's approval-queue work rather than separately.
5. The recovery max-steps enforcement gap — design direction discussed
   (per-client override + archetype-default lookup table), not yet a
   Build Card.
6. Everything else is a genuine next-phase choice — see Next Build Card
   candidates above.

Nothing requires human acknowledgment before proceeding — all
self-resolved document-level items from recent sessions are logged in
Wiki/log.md and their relevant Wiki/platform-quirks/ pages.
