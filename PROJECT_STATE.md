# PROJECT_STATE.md — Current State Dashboard

Purpose: what's true RIGHT NOW. Not history (see Wiki/log.md), not
durable facts/decisions (see Wiki/*.md). Overwritten each session,
never appended to.

Read this first, every session. Then Wiki/index.md for anything this
file points to but doesn't explain.

---

## Last Updated
2026-08-15 (latest) — by /execute — **BC-064 COMPLETE.** Human flagged
117 live Supabase Security Advisor warnings via screenshot. Root cause:
BC-052 (2026-08-14) only revoked `anon` EXECUTE from ~40 internal RPCs
— `authenticated` was never touched (73 functions, including
`read_credential_secret`/`store_credential_secret` themselves — any
real signed-in dashboard user, not just anon, could read/rotate any
client's Vault secrets). Also found: new functions built since BC-052
(including this session's own `get_client_agent_prompt`) inherit
Supabase's ambient anon+authenticated default grant on new `public`
functions unless explicitly revoked. **Fix:** grepped the dashboard's
real frontend code + checked the one Edge Function that forwards a
caller's real JWT to find the true 10-function "needs authenticated"
set; revoked anon+authenticated from the other 62 (service_role only).
**Live-verified:** advisor warnings 117 → 11 (10 intentional + 1
unrelated Auth setting, not a grant issue, disclosed not fixed). Re-ran
INT-010's `test_workflow` against the tightened grants — confirmed
live, unaffected (n8n's credential is genuinely `service_role`). Full
detail: `Wiki/log.md` session-BC-064,
`Wiki/platform-quirks/anon-grant-exposure-bc052.md`.

2026-08-15 (prior) — by /execute — **BC-062 COMPLETE.** Human
approved the redesign; built in one pass: `public.agent_prompts`
created + backfilled into all 5 `tpl_*` templates (structure only) and
all 5 real client schemas (2 seed rows each, from `control.
agent_prompts`); `create_archetype_template`/`create_client_schema_
from_template` updated to include it for future provisioning; new
`public.get_client_agent_prompt(p_schema, p_prompt_key)` RPC (same
shape as `list_client_email_categories`); old control-schema RPC
dropped (genuinely dead); `control.agent_prompts` kept as the
master-defaults seed source. INT-010 and INT-011 rewired to the new
RPC using each client's real resolved schema name, **live-tested with
real (unpinned) LLM calls** — not just structural pinning — confirmed
byte-identical prompt output to the pre-BC-062 hardcoded version, both
published. The `agent_prompts` wiring gap (Path A #4) is closed. Full
detail: `Wiki/log.md` session-BC-062 redesign entry,
`Wiki/infra/convocore-agent-provisioning.md`,
`Wiki/platform-quirks/n8n-openrouter-direct-llm-pattern.md`.

2026-08-15 (prior) — by /execute — BC-062 verification follow-up:
human pushed back on 2 things from the first pass, both checked live,
both resolved. **(1) Credential-attach was NOT a Supabase permission
issue** — it's an n8n MCP tool gap (`addNode`'s inline `credentials`
field is silently dropped; the dedicated `setNodeCredential` operation
works and was applied to both draft nodes, still unpublished). **(2)
The control-schema/archetype-keyed `agent_prompts` design was the
wrong shape** — human's per-client-schema mental model is confirmed
correct and is the platform's real, consistently-applied pattern
(`Database_Structure_v4_FINAL.md` §1, live schema list matches exactly).
That same doc already flags `control.agent_prompts` as `never synced to
any client schema` — a known original-design gap, not a doc conflict.
Found a direct working precedent: `email_categories` lives per-client-
schema (real, queried) with an orphaned `control` copy predating BC-045
— `agent_prompts` should follow the same pattern. **Redesign not yet
built — reported to human, correctly stopped rather than self-resolved
(a real system-shape decision).** Full detail: `Wiki/log.md`
session-BC-062 follow-up entry, `Wiki/infra/convocore-agent-provisioning.md`.

2026-08-15 (prior) — by /execute — BC-062 STARTED, BLOCKED (Credential
Gate, not self-resolved): Email Manager prompt externalization
(`agent_prompts` wiring gap, Path A #4). Built `public.get_agent_prompt`
RPC (live, tested), seeded 2 default rows, draft-wired INT-010 and
INT-011 (new HTTP node + Code node updates, byte-identical output by
construction). **Real finding:** the live `agent_prompts` schema has no
`client_id` column — supports default+archetype-level override today,
not literally per-client as originally framed; disclosed, not built
around. **Blocked:** the n8n MCP tooling cannot attach a credential to
the 2 new HTTP nodes (confirmed via the tool's own response) — needs a
human to set it in the n8n UI (believed `zenny-vault-suparbase`, not
independently confirmed — every existing node's credential assignment
is redacted from every read path this session had). Neither workflow
can be tested/published until that's done; **both workflows' live/
active versions are unchanged.** BC-063 (the other item raised this
session — Edge Function client_id/JWT-trust gap, Path A #1) not started.
Full detail: `Wiki/log.md` session-BC-062,
`Wiki/infra/convocore-agent-provisioning.md`,
`Wiki/platform-quirks/n8n-openrouter-direct-llm-pattern.md`.

2026-08-14 (prior) — by /execute — BC-059 complete: ran the intake
checklist against a real target, carmelli.co.uk (a kosher bakery,
click-and-collect only). Fetched the homepage + contact page (About and
a guessed shipping-policy URL both 404'd, disclosed rather than
guessed). Archetype diagnostic run for real: **Commerce-Ecom**
(transactional, customer already knows what they want, no booking slot,
no advisory step). All AUTO rows filled with real site content
(products/pricing, 24h/48h advance-order policy, kosher certs, contact
info, UK locale); genuinely unanswerable-from-the-website items (hours,
refund policy, actual ecommerce platform) left as disclosed gaps, not
guessed. Checklist restructured per human request: added a `Type`
column (`Placeholder` vs. `Option: [real enumerated choices]` — never
vague) and a client-facing `Why it matters` column (no internal field
names). Also added `control.agent_prompts`'s per-client-prompt-override
gap (BC-058c finding) to the Next Build Card candidates list below.
Full checklist: `05_Platform_Builds/Convocore/Convocore_Agent_Intake_Checklist_v1.md`.

2026-08-14 (prior) — by /execute — BC-058c complete: the 2 stale
Convocore docs actually corrected (`Findings_Required_Updates_FINAL.md`
§1.1/§1.2, `Adapter_Spec_FINAL.md` Part 2.3 — both now match live
reality), and `control.agent_prompts` resolved to a real, non-Convocore
finding: human confirmed it's Email Manager's (per-client-overridable
LLM prompts, one default at build time, replacing hardcoded-in-n8n).
Live n8n check (full `get_workflow_details` on INT-010 + INT-011, both
prompt-building Code nodes) confirms it is **built but not wired to
either workflow yet** — a real, disclosed, un-built improvement, not
mystery scaffolding. **Document Resolution Authority pause from BC-058
is now closed — BC-059 unblocked.** Full narrative: `Wiki/log.md`;
findings: `Wiki/infra/convocore-agent-provisioning.md`,
`Wiki/platform-quirks/n8n-openrouter-direct-llm-pattern.md`.

2026-08-14 (prior) — by /execute — BC-058 complete: master Convocore
Agent Intake Checklist built (`Convocore_Agent_Intake_Checklist_v1.md`),
grounded in a live Supabase schema read (not the flagged-stale
`Client_Onboarding_Sequence_Spec.md`). Merges `Client_Onboarding_Guide.md`'s
archetype diagnostic with genuine business-decision inputs from the 3
primary Convocore docs, AUTO/ASK split, 4 sections. **2 real doc/reality
gaps found and self-resolved per Document Resolution Authority — session
paused here pending human acknowledgment before BC-059 starts:** (1)
agent naming convention (`Findings_Required_Updates_FINAL.md` still
flags this open; actually decided elsewhere — `{ClientBusinessName}
Assistant`); (2) `convocore_agent_map`'s schema (`Adapter_Spec_FINAL.md`
calls it "pending"; it's already built, exactly matching the spec's own
stated minimum). Also flagged, not resolved: `control.agent_prompts`
exists live, unmentioned by any Convocore doc, may already scaffold the
undocumented "Template Dashboard" — worth checking before BC-060. Full
narrative: `Wiki/log.md`; findings: `Wiki/infra/convocore-agent-provisioning.md`.

2026-08-14 (prior) — by /execute — BC-057b complete: Convocore
reachability rechecked (still `403`, both REST and MCP, identical to the
2026-08-04 finding — same account-level billing block, not an MCP
artifact and not cleared since). Not treated as a blocker per human
decision: manual build in the Convocore Canvas UI is the agreed fallback
build method for the upcoming demo-business agent (Path B of the new
dual-path plan — Path A is remaining backend work, Path B is a real,
human-provisioned Convocore agent build for a demo business shown to
that client, doubling as a full-stack integration test). All 10 current
Convocore docs annotated with a `DOC PREFERENCE` status line; full map
at `Wiki/reference/convocore-doc-status.md`. Also flagged (not yet
corrected): `Client_Onboarding_Sequence_Spec.md` predates several recent
migrations (BC-051-056) and should not be trusted literally for future
provisioning — re-derive schema live when that work starts. Full
narrative: `Wiki/log.md`.

2026-08-14 (prior) — by /execute — BC-054/055/056 complete, plus the
`zenny-notification-sender` credential reconnect live-verified. All 3
were Commander-issued from the Next Build Card candidates list, human
approved, executed sequentially in one session. **BC-054** (recovery
max-steps enforcement): `control.archetype_recovery_defaults` +
per-client `max_recovery_steps` override; `advance_client_recovery_step`
now stops a lead's cadence the instant it reaches its archetype's real
max step (Recovery_Engine_Flow.md §3/§6), `get_due_recovery_queue`
defensively excludes any row already past it. Live-verified via 3
disposable fixtures. **BC-055** (CancelAppointment real calendar-event
deletion): `resolve-pending-verification`'s approve path now genuinely
deletes the client's Google Calendar event (Calendly cancellation built
per spec, not live-tested — no roster Calendly connection). Real,
full end-to-end proof: created a real disposable Google Calendar event,
deleted it via the live deployed function, independently confirmed
`status: "cancelled"` on Google's own side — better than the external
blocker originally assumed (Mandatory MCP Verification found Client A's
"insufficient scope" was specific to FreeBusy, not the events API).
**BC-056** (INT-008 ownership-release caller): real finding — neither
INT-008 nor `resume_client_recovery` ever touched
`human_ownership_flag`; built the actual flag-clear as a new
`auth.uid()`-scoped RPC (`dashboard_release_lead_ownership`), gave
INT-008 a real webhook (it had none), added a `/paused-leads` dashboard
page and a `release-lead-ownership` Edge Function (deliberately
`verify_jwt: true`, a documented deviation from BC-052/053's
convention, since this action genuinely needs real caller identity).
Live-verified end to end except the Edge Function's full real-user
happy path (no real dashboard session to test with — Credential Gate,
not invented; the RPC and webhook it glues together are each proven
standalone). Full narrative: `Wiki/log.md`.

2026-08-14 (prior) — by /execute — BC-053 complete: Verification
Approval Queue built, live-verified — the last of the 3 Build Cards
approved from this session's decision round (BC-051/052/053 all done).
Opt-in per client (`control.clients.verification_tier_enabled`, default
false — no existing client's behavior changed). WF-013/WF-016 each gained
a branch: tier off = byte-identical to pre-BC-053 always-handoff
(regression-proven live); tier on = queues a `pending_verifications` row
(new table, dynamically created across all 10 client/template schemas)
and responds `pending_approval`. New dashboard `/approvals` page +
`resolve-pending-verification` Edge Function does the real execution on
approve (`cancel_client_appointment`/`apply_customer_update`, both reusing
existing columns — no new appointments/customers columns needed, a real
scope-narrowing finding) + sends confirmation via WF-019's real webhook
(reused, not rebuilt). **Known, disclosed gap:** CancelAppointment's real
calendar-event deletion is not built (no existing DELETE pattern anywhere
in the platform to reuse) — DB-side cancellation is real; calendar
deletion honestly reported as not implemented. **Bug found+fixed mid-card:**
a migration mistake briefly broke `get_client_appointment_with_customer`
(WF-013/WF-015's real dependency) — caught within minutes via live
testing, restored, reverified; no evidence real traffic was affected.
**New unrelated finding:** n8n's internal `zenny-notification-sender`
Gmail credential has expired, crashing UTIL-006 when a client lacks an
email connection — needs human OAuth reconnection, not fixed this card.
Full narrative: `Wiki/log.md`.

2026-08-14 (earlier) — by /execute — BC-052 complete: Connection Lifecycle
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
Phase 9  — Recovery Engine ....................... IN PROGRESS (WF-018, INT-006/007/008, SCH-001 all built; INT-008 now has a real caller, BC-056; max-steps enforced, BC-054)
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
                          real Revoke/Reconnect/Refresh (BC-052);
                          Appointments dashboard gained a real write
                          action (BC-053, /approvals page, opt-in per
                          client, off by default; BC-055 added real
                          calendar-event deletion to it); new
                          /paused-leads page (BC-056, real INT-008
                          caller); a critical anon-key RPC exposure was
                          found+fixed same session (see Active Blockers
                          for the smaller residual gap); Wiki/infra/ for
                          deployment
Recovery Engine ........ ✅ working — WF-018 SendRecoveryMessage +
                          INT-006/SCH-001 Process Recovery Queue +
                          INT-007 StopRecovery + INT-008 ResumeRecovery
                          all live-tested, cadence fires automatically
                          (email only), per-client active-hours window
                          (BC-041); INT-007 genuinely wired into INT-010;
                          INT-008 now has a real caller (BC-056, dashboard
                          ownership-release action); max-steps enforced
                          (BC-054)
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
- ~~INT-008 (Resume Recovery) has no caller~~ **CLOSED (BC-056,
  2026-08-14).** New dashboard `/paused-leads` action → real
  `dashboard_release_lead_ownership` RPC (clears the flag — a real
  finding: neither INT-008 nor `resume_client_recovery` ever touched it)
  → INT-008's new real webhook (it had none before). Live-verified. See
  `Wiki/infra/int008-ownership-release.md`.
- ~~Recovery cadence's "max steps reached → Stopped" condition~~ **CLOSED
  (BC-054, 2026-08-14).** `control.archetype_recovery_defaults` +
  per-client `control.clients.max_recovery_steps` override now enforce
  it in `advance_client_recovery_step` (real stop) and
  `get_due_recovery_queue` (defensive filter). Live-verified. See
  `Wiki/platform-quirks/recovery-queue-sweep-design.md`.
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
- ~~`zenny-notification-sender` Gmail credential expired~~ **CLOSED
  2026-08-14.** Human reconnected via n8n UI; live-reverified via the
  exact real failing path (WF-019 → UTIL-006 → Tool Execution Fallback →
  UTIL-004, real Gmail send, message id `19ffd2a904ae2bcf`). See WF-019's
  `Workflow_Registry.md` entry.
- ~~CancelAppointment's real calendar-event deletion~~ **CLOSED (BC-055,
  2026-08-14).** `resolve-pending-verification`'s approve path now
  deletes the real Google Calendar event (Calendly cancellation built,
  not live-tested — no roster Calendly connection). Real end-to-end
  proof: created a real disposable Google event, deleted it via the live
  deployed Edge Function, independently confirmed `status: "cancelled"`
  on Google's side. See `Wiki/infra/verification-approval-queue.md`.
- ~~BC-062 (credential-attach block, then agent_prompts redesign)~~
  **CLOSED (2026-08-15).** Credential-attach was an n8n MCP tool gap
  (`addNode`'s inline `credentials` silently dropped), not a Supabase
  permission issue — fixed via `setNodeCredential`. The control-schema/
  archetype-keyed design was the wrong shape (live `email_categories`
  precedent + the architecture doc's own "never synced to any client
  schema" note both pointed to per-client-schema) — rebuilt:
  `agent_prompts` now lives in `public`+`tpl_*`+every client schema,
  read via `get_client_agent_prompt`. INT-010/INT-011 rewired,
  live-tested with real LLM calls, published. See `Wiki/log.md`
  session-BC-062 redesign entry, `Wiki/infra/convocore-agent-provisioning.md`.
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
resolved 2026-08-14 — see Wiki/decisions/: BC-051, BC-052, BC-053 all
done; 1 closed with no build needed. A critical anon-grant RPC-exposure
bug, unrelated to any of the 4 decisions, was found and fixed live
during BC-052 — see Last Updated above.)
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

**BC-053 complete (2026-08-14): Verification Approval Queue built, live-
verified.** Opt-in per client, off by default. WF-013/WF-016 both
regression-proven unchanged when off. Real DB-side execution on approve.
Its 2 disclosed gaps from this card (calendar-delete, credential
reconnect) were both closed later the same session — see below.

**Credential reconnect verified, BC-054/055/056 complete (2026-08-14):**
all 4 remaining Next-Build-Card candidates from that list were closed in
one continued session (see Last Updated above for full detail):
`zenny-notification-sender` reconnect live-reverified; BC-054 (recovery
max-steps enforcement); BC-055 (CancelAppointment real calendar-event
deletion, live-proven end-to-end against a real disposable Google
event); BC-056 (INT-008's real ownership-release caller). The residual
Edge Function client_id-trust gap (BC-052 finding) and Phase 5A/5D/
SCH-007 remain open — see below.

**BC-057b complete (2026-08-14): Convocore reachability rechecked, still
blocked (both REST and MCP), not a build blocker — manual Canvas UI
fallback confirmed as the path forward.** Doc set annotated. See
`Wiki/reference/convocore-doc-status.md`.

**BC-058 complete (2026-08-14): master intake checklist built.**
**BC-058c complete (2026-08-14): the 2 stale docs actually fixed;
`agent_prompts` resolved as a real, disclosed Email Manager gap (built,
not wired) — unrelated to Convocore.** See Last Updated above,
`Wiki/infra/convocore-agent-provisioning.md`,
`Wiki/platform-quirks/n8n-openrouter-direct-llm-pattern.md`. Document
Resolution Authority pause closed — BC-059 clear to proceed.

Dual build path agreed with human 2026-08-14:

**Path A — remaining backend**, pulled in only as the demo business
actually needs it:
1. Residual Edge Function client_id-trust gap (BC-052 finding, lower
   priority than previously framed — this is an agency-provisioned
   build, not client self-signup, so client_id enumeration risk is low
   until self-serve exists).
2. Calendly's real calendar-delete path (BC-055 built it to spec but
   could not live-test — no roster Calendly connection).
3. Phase 5A (Inventory dashboard) / SCH-007.
4. ~~`control.agent_prompts` wiring gap (BC-058c finding)~~ **CLOSED
   (BC-062, 2026-08-15).** Redesigned to per-client-schema, INT-010/
   INT-011 rewired and live-tested, both published. See Last Updated
   above and `Wiki/log.md` session-BC-062 redesign entry.
5. Edge Function client_id/JWT-trust gap (BC-052 finding, item #1 above)
   — raised again 2026-08-15, not yet started as BC-063. Needs a live
   MCP-verification pass of each function's actual call pattern first
   (per its Build Card) before any `verify_jwt` change, since
   `oauth-callback` may be called mid-redirect without a session.

**Path B — real Convocore agent build (test+verify+build for a demo
business):**
- BC-057b done.
- BC-058 done — `Convocore_Agent_Intake_Checklist_v1.md` built and
  schema-grounded.
- BC-058c done — stale docs fixed, `agent_prompts` finding corrected
  (Email Manager, not Convocore). Pause closed.
- BC-059 done — checklist run against carmelli.co.uk (Commerce-Ecom).
  All AUTO rows filled; a short real ASK list is now ready to send to
  the business (hours, refund policy, ecommerce platform, plus the
  standard module/channel/integration questions).
- BC-060 (next): once Carmelli's ASK answers come back, build the real
  Convocore agent (manual Canvas UI, per BC-057b) + Supabase
  provisioning + n8n/credential wiring from the completed checklist.
- BC-060: populate Convocore (manual Canvas build, per BC-057b) +
  Supabase provisioning (live schema, not the stale sequence spec) + n8n
  wiring from the completed checklist.
- BC-061: full round-trip test (real conversation → adapter → n8n →
  Supabase → dashboard).

Phase 5D (Onboarding dashboard) is deliberately sequenced *after* Path B
completes once for real — human wants the manual written from a lived
build, not guessed in advance.

ADP-001 (Voiceflow Adapter doc/reality mismatch) dropped from candidates
per human instruction (2026-08-14) — no longer worth investigating.
(`appointments` doc diff intentionally NOT in this list — see Active
Blockers, deferred.)

## Handoff Note (for next session)

**Where things stand:** Phase 8 (Conversion Engine, all 11 Tools) done.
Phase 9 (Recovery Engine) is now fully live and closed-loop: all 4
internal workflows + SCH-001 (WF-018, INT-006, INT-007, INT-008), INT-007
wired into Email Manager's live chain, INT-008 now has a real dashboard
caller (BC-056), max-steps genuinely enforced (BC-054). Phase 10 (Email
Manager) is feature-complete: all 7 workflows live, fully chained and
cadenced, no open Credential Gate. KB source is Notion+Pinecone;
Convocore stays wired-dormant. All 3 human-approved Build Cards from the
2026-08-14 decision session shipped (BC-051/052/053), then all 4
remaining Next-Build-Card candidates also shipped the same session
(credential reconnect, BC-054/055/056) — see `Wiki/log.md` for full
narrative of each. Nothing is mid-flight; the next session starts clean.

**What's genuinely open, in priority order:** dual build path agreed
2026-08-14 — Path A (Edge Function client_id-trust gap, Calendly
calendar-delete, Phase 5A/SCH-007, pulled in only as needed) and Path B
(real Convocore agent build for a demo business; BC-057b done —
Convocore still `403`-blocked on REST+MCP, manual Canvas UI is the
agreed fallback; next is BC-058, the master intake checklist). Phase 5D
(Onboarding dashboard) intentionally waits until after Path B's first
real build. `appointments` doc diff stays deferred, see Active Blockers.

Nothing requires human acknowledgment before proceeding — all
self-resolved document-level items from recent sessions are logged in
Wiki/log.md and their relevant Wiki/platform-quirks/ pages.
