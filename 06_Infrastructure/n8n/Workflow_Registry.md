# Workflow Registry — Live, Per-Workflow Reference

```
Purpose:   One dedicated entry per real, currently-built n8n workflow,
           written from live get_workflow_details reads (BC-027), not
           reconstructed from PROJECT_STATE.md's session prose. This is
           the file to check first for "what does workflow X actually
           do right now" — PROJECT_STATE.md remains the session-by-
           session build history; this file is the current-state
           reference for the workflows themselves.
Standing rule (added BC-027, see CLAUDE.md + Claude_Build_Command_
Protocol_v2.md): every future Build Card that creates or meaningfully
modifies a workflow MUST add/update that workflow's entry here BEFORE
the session's own Definition of Done is considered met.
Format: workflow ID + real n8n name, PURPOSE, TRIGGER, INPUT,
OUTPUT/END STATE (success + failure), REAL DEPENDENCIES, LAST VERIFIED.
Last full pass: 2026-08-07 (BC-027), reading every node of every
workflow listed below live via get_workflow_details. Updated 2026-08-07
(BC-028): UTIL-003, UTIL-005, ADP-002's human-handoff path, and Tool
Execution Fallback's PostgREST/Slack/missing-credential bugs fixed and
re-verified; UTIL-006 fixed (missing credentials on 3 nodes, none ever
previously attached) and given its first-ever confirmed live execution,
plus a new synchronous token-expiry check; new UTIL-007 shared refresh
helper added. Updated 2026-08-06/07 (BC-029): new WF-001 CreateLead
built and added (Phase 7, Growth Agent). While testing it, found and
fixed 3 more real pre-existing infrastructure bugs that had never
surfaced before because no real test data had hit the affected paths:
(1) `client_test_001_acme_emergency_test.leads` was missing migration
028's `convocore_*` columns entirely (schema-provisioning drift); (2)
the same schema's `escalations` table was missing migration 032's
`escalation_team` column (same drift class); (3) BC-028's 10-arg
`insert_client_escalation` overload made every 9-arg call (i.e. every
real call WF-017 NotifyHuman itself makes) ambiguous to PostgREST
(`PGRST203`) — silently broken since BC-028, undetected because
BC-028's own ADP-002 test always passed the 10th argument explicitly.
This means WF-017 (and therefore WF-013/WF-016's handoff path) had been
broken for any 9-arg caller since BC-028 until this session's fix
(dropped the redundant 9-arg overload). See WF-001's own entry below
for detail, and PROJECT_STATE.md's Session Log for the full account.
Updated 2026-08-06/07 (BC-031): Phase 8a — 6 new Conversion Engine Tools
built (WF-002 CheckAvailability, WF-003 CreateAppointment, WF-004
CreateBookingRequest, WF-005 CreateCart, WF-006 CreateReservation, WF-007
CreateWaitlistEntry), all genuinely tested against real production data
across 3 archetypes (commerce_ecom, commerce_restaurant, appointment — a
new roster client, client_test_003_acme_appointment_test, was created for
the appointment archetype). Found and fixed 2 more real, previously-
undiscovered bugs in the shared UTIL-006/Tool Execution Fallback path
(a NULL-expiry check wrongly forcing a doomed refresh on non-refreshable
api_key credentials; Tool Execution Fallback crashing outright on the
"zero client_connections rows exist at all" case, never exercised before
this session's brand-new appointment client), plus several schema-drift
gaps (missing `conversions_restaurant` table on `client_test_002`;
missing `waitlist_entries` table anywhere; `conversions_appointment`'s
`service_type`/`appointment_time` wrongly `NOT NULL` despite Part 13.4
documenting both as optional). A genuine document-level gap was also
self-resolved and logged: `lead_id` was missing from CreateCart/
CreateReservation/CreateWaitlistEntry's documented payloads despite their
idempotency keys requiring it — fixed directly in
`n8n_Workflow_Specification_v1.md`. See each Tool's own entry below.
Updated 2026-08-07 (BC-032): ADP-002's "standard tool" routing path fixed
— it had never actually forwarded to any downstream Tool for any
tool_name, only echoed the built contract back; now correctly forwards
to any of the 12 real built Tools, tested with 4 real curl calls. UTIL-
006/UTIL-007 extended with a new real Shopify Client Credentials Grant
refresh branch (structurally validated and published; not yet exercised
end-to-end — no built Tool currently makes a live ecommerce call that
would trigger it, a disclosed limitation, not a shortcut). New Supabase
Edge Function `shopify-connect` added (mirrors `woocommerce-connect`),
tested live against a real (nonexistent) store domain to confirm it
performs a genuine external call rather than a simulated one.
Updated 2026-08-10 (BC-034): Phase 8b — the final 5 Conversion Engine
Tools built (WF-008 CreateCallbackQueueEntry, WF-009
CreateInspectionSlotBooking, WF-010 CreateScoredBooking, WF-011
CreateRegistration, WF-012 RecordConversion), completing all 11 Tools.
2 new roster clients created (consultation, engagement — neither
archetype had one). Found and fixed a real `create_client_schema_from_
template` function bug (missing `appointments` in its common-tables
list, silently breaking 3 client schemas), a real `UNIQUE(lead_id)`
constraint violation in RecordConversion's duplicate check, and a real
response-field bug in WF-008 (`estimated_callback_window` read from the
wrong node). Several genuine document-level payload/schema gaps
self-resolved, same class as BC-031's `lead_id` fixes — see each Tool's
own entry below.
```

---

## Shared Utilities (Part 6)

### UTIL-001 — Zenny Shared Utility - Schema Resolver
**n8n ID:** `qbhdmH2ZN6opkXL1` · not published (draft-only, called via `source: database`)

**PURPOSE:** Resolves a `client_id` to that client's real Postgres schema name (`client_schema_name`), the first step of nearly every Tool/internal workflow.

**TRIGGER:** `executeWorkflowTrigger` — no webhook, called internally only.

**INPUT:** `{ client_id: string }`

**OUTPUT / END STATE:**
- Success: `{ resolved: true, client_schema_name: string }` — reads `control.clients` directly (`GET .../clients?select=client_schema_name&client_id=eq....`, header `Accept-Profile: control`).
- Failure: `{ resolved: false, error_type: "permanent", error_message: "client_id does not resolve to a known client -- Fallback Pattern D (Warm Handoff)" }` if no matching row.

**REAL DEPENDENCIES:** None (leaf). Called by: WF-013 through WF-017, ADP-002.

**LAST VERIFIED:** BC-026, 2026-08-06 — live via WF-017/WF-014/WF-015/WF-013/WF-016 execution and directly via the INT-00x test harness. Note: this read depends on `control` schema `USAGE` grants that were confirmed MISSING and fixed only in BC-026 (see SCH note under Blockers in PROJECT_STATE.md) — any execution of this workflow from BEFORE 2026-08-06's grant fix would have failed with `permission denied for schema control`, meaning this workflow's real success was never actually confirmed in any session prior to BC-026.

---

### UTIL-002 — Zenny Shared Utility - Data Validator
**n8n ID:** `Cw1LW6ZXHaJkrJLB` · not published

**PURPOSE:** Validates the Standard Request Contract envelope (contract_version + required fields) before business logic runs.

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ request_id, contract_version, correlation_id, client_id, tool_name, payload }`

**OUTPUT / END STATE:** Always succeeds (pure Code node, no DB call, no failure path): `{ valid: boolean, validation_flag: boolean, errors: string[], payload }`. Checks: `contract_version === 'v1'`, presence of `request_id`/`client_id`/`tool_name`/`payload`.

**REAL DEPENDENCIES:** None.

**LAST VERIFIED:** **Not execution-tested in any session captured in PROJECT_STATE.md's Session Log to date.** None of the 10 workflows built in BC-026 call it (they inline their own lighter "Normalize Contract" Code nodes instead) — flagged here, not fixed/wired this session (out of BC-027's scope).

---

### UTIL-003 — Zenny Shared Utility - Error Logger
**n8n ID:** `Azi7BaBldiK3NDqk` · not published

**PURPOSE:** Writes a `tool_call_log` row to the resolved client schema. Designed to be best-effort (`onError: continueRegularOutput` on its one HTTP node) so a logging failure never blocks the caller's real response.

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ client_schema_name, tool_name, calling_module, lead_id, state, request_payload, response_payload }`

**OUTPUT / END STATE:** Success: a new `tool_call_log` row exists in `{client_schema_name}.tool_call_log`, written via the `public.insert_client_tool_call_log` RPC wrapper (BC-028). `onError: continueRegularOutput` preserved — a logging failure still never blocks the caller's response.

**FIXED BC-028:** the node used to POST directly to `.../tool_call_log` with a `Content-Profile` header — client schemas are not exposed to PostgREST (`PGRST106`), so this never worked against a real client schema. Rewired to call the new `public.insert_client_tool_call_log` RPC wrapper (`responseFormat: json`), same proven pattern BC-026 used for INT-001/004/005/WF-013/014/015/017.

**REAL DEPENDENCIES:** None.

**LAST VERIFIED:** BC-028, 2026-08-06 — real `tool_call_log` row confirmed created against `client_test_002_acme_commerce_test` via direct SQL, then cleaned up.

---

### UTIL-004 — Zenny Shared Utility - Notification Router
**n8n ID:** `fcilrbwldjnn92Yn` · **published**, active

**PURPOSE:** Sends real Gmail notifications on 2 independent branches: an internal ops alert (always to `zenny.zeromanual@gmail.com`) and a distinct client-facing alert (rebuilt BC-025, replacing the removed Slack path).

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ severity, subject, message, notify_email: boolean, notify_client: boolean, client_email, client_subject, client_message }`

**OUTPUT / END STATE:** Success = a real Gmail message sent on whichever branch(es) fired (`notify_email` → `Send Ops Email`; `notify_client` → `Send Client Email`), each Gmail node returning `{ id, threadId, labelIds: ["SENT"] }`. No explicit failure path — a Gmail send error would surface as a node-level execution error to the caller.
**IMPORTANT CALLER GOTCHA (found + fixed BC-026):** this workflow, when called via an `Execute Workflow` node, exposes **2 separate output pins** matching its 2 branches (`Send Ops Email` = one pin, `Send Client Email` = the other). A caller that only wires one pin to its own downstream response node will silently fail to respond whenever the OTHER branch is the one that actually fires — this exact bug existed in WF-017 until fixed in BC-026. **Any future caller of this workflow must wire BOTH output pins**, not just the one that seems more likely.

**REAL DEPENDENCIES:** `zenny-notification-sender` Gmail credential (`dUDWiqDs4C95gnLG`).

**LAST VERIFIED:** BC-026, 2026-08-06 — real Gmail message IDs confirmed for both the ops-email branch (`19fd832788ca2c8d` for Client A, another for Client B's P1 test) via direct calls from WF-017. BC-025 also confirmed both branches independently (`19fd75113a10d2df` ops, `19fd751152b7ee18` client).

---

### UTIL-005 — Zenny Shared Utility - Stop Checker
**n8n ID:** `IWuuNyRjp7vPjNui` · not published

**PURPOSE:** Checks `suppression_records` or `leads.status` before a Recovery Engine/Email Manager business operation is allowed to fire — a do-not-contact/do-not-proceed gate.

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ client_schema_name, check_type: 'suppression'|'lead_status', entity_value }`

**OUTPUT / END STATE:**
- `check_type='suppression'`: `{ proceed: (0 matching rows), reason: 'suppression_records check' }`.
- `check_type='lead_status'`: `{ proceed: (status not in ['closed','escalated']), reason: 'lead_status check' }`.
- Any other/unknown `check_type`: `{ proceed: false, reason: 'unknown check_type -- treated as Retryable Error per Part 6.5, do not proceed on an unresolved stop-check' }` — a deliberately conservative default, correctly built.

**FIXED BC-028:** both HTTP nodes used `Accept-Profile: {{ client_schema_name }}` direct client-schema access — same `PGRST106` failure as UTIL-003, never worked against a real client schema. Rewired to call two new `public`-schema RPCs: `client_has_suppression` (bare boolean scalar — note: with `responseFormat: json` forced on a bare JSON scalar, n8n lands the value as the item's whole `.json` directly, e.g. `json: false`, NOT nested under `.data` — a real, newly-confirmed quirk distinct from the `.data`-string behavior scalar-with-`text`-format cases show) and `get_client_lead_status` (bare text scalar, `responseFormat: text`, lands under `.data` as usual).

**REAL DEPENDENCIES:** None.

**LAST VERIFIED:** BC-028, 2026-08-06 — all 4 real branches tested: suppression check correctly `proceed:true` for a non-suppressed contact and `proceed:false` for a genuinely suppressed one (real row inserted then cleaned up); lead-status check correctly `proceed:true` for a `booked` lead and `proceed:false` for a `closed` one, both against real leads.

---

### UTIL-006 — Zenny Credential Platform - Credential Resolver
**n8n ID:** `LzP5m25iMmhROVsD` · **published**, active

**PURPOSE:** Looks up a client's connection for a given credential category, returns a decrypted token if genuinely connected — now with a synchronous expiry check at time of use (BC-028) — otherwise triggers Tool Execution Fallback.

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ client_id, category, tool_name }`

**UPDATED BC-032:** `Refresh Token Synchronously`'s call into UTIL-007 now also passes `access_token_secret_id`, `secondary_secret_id`, and `provider_account_id` (previously only `connection_id`/`client_id`/`category`/`provider`/`refresh_token_secret_id` were forwarded) — additive only, needed so UTIL-007's new Shopify branch (see below) has the fields it needs. Google's existing refresh path ignores the new fields, unaffected.

**OUTPUT / END STATE:**
- Connection exists and connected: calls `public.get_client_connection` RPC, then checks `Token Expiring Soon?` (`!token_expires_at || token_expires_at <= now+5min`).
  - Not expiring: reads the existing secret directly via `public.read_credential_secret` → `{ available: true, token, provider, connection_id }`.
  - Expiring or already expired: calls the new `Zenny Shared Utility - Refresh Connection Token` (UTIL-007) synchronously first. If that succeeds, reads the freshly-stored secret and returns the same `{ available: true, ... }` shape with a genuinely new token. If the refresh itself fails, calls Tool Execution Fallback with `failure_type: 'credential_error'` and reason `"synchronous token refresh failed at time of use: ..."`.
- No connection / not connected: `{ available: false }` + calls Tool Execution Fallback with a real reason (`"no client_connections row..."` or `"connection status is X, not connected"`).

**Design intent (BC-028):** SCH-006 (see its own entry above for the real 2-hour interval + the separate 7-day Google Testing-mode constraint) remains the normal-case optimization that keeps most tokens pre-warmed; this synchronous check is the correctness guarantee that closes the real gap between sweep runs (a 2-hour sweep interval + a 1-hour Google access-token lifetime genuinely produces a dead-token window every cycle). A deliberate hybrid, not a replacement of the sweep. SCH-006 itself was NOT refactored to call the new UTIL-007 refresh helper this session (its own inline refresh logic still works and was left untouched) — a possible future consolidation, not required for this card's fix.

**FIXED BC-028 (major — this workflow had never been execution-tested before this session, confirmed by real "Credentials not found" errors on 3 separate nodes):** `Get Client Connection`, `Read Token Secret`, and (before the redesign) the general flow all had zero credential attached — none of these were ever real, working Supabase calls until this session. Also fixed: `Read Token Secret` had no `responseFormat` set (same bare-text-scalar-with-object+json-header bug hit repeatedly this session) — forced `text`, and `Resolved Credential`'s `token` assignment updated to read `$json.data` instead of the whole `$json`.

**REAL DEPENDENCIES:** UTIL-007 Refresh Connection Token (new, BC-028), Tool Execution Fallback (`UTcdzMvOb7gCQM5J`).

**LAST VERIFIED:** BC-028, 2026-08-06 — **first-ever confirmed live execution of this workflow.** Tested against a REAL production connection (Client A's `google`/`email` connection) that happened to be genuinely expired at test time (not artificially forced) — confirmed a real, fresh Google access token (`ya29....`) was returned, and real DB state showed `token_expires_at` updated to ~1 hour in the future (matching Google's real access-token lifetime) with a fresh `updated_at`. This was a real production fix, not a disposable test — the connection is now genuinely healthy again.

**FIXED BC-031 (real bug — first time this workflow was ever called against a non-Google/non-refreshable connection):** `Token Expiring Soon?` treated ANY `NULL token_expires_at` as expiring-soon, including `api_key`-style connections (WooCommerce) that legitimately never expire and have no `refresh_token_secret_id` at all — this forced a doomed synchronous refresh (UTIL-007 correctly rejects unsupported providers), which then incorrectly marked a genuinely healthy WooCommerce connection `status='error'` via Tool Execution Fallback. Fixed: refresh is now only attempted when `refresh_token_secret_id` is actually present. The real WooCommerce connection's status was manually restored to `connected` after the false failure. Also extended `Resolved Credential`'s output with `provider_account_id` and `secondary_secret_id` (both already stored on `control.client_connections`, migration 020, but never surfaced) so two-part-credential providers like WooCommerce can be used by callers — additive only, no change to existing `{available, token, provider, connection_id}` callers.

---

### UTIL-007 — Zenny Shared Utility - Refresh Connection Token (new, BC-028)
**n8n ID:** `NiBCdKzb0pkvWBQn` · **published**, active

**PURPOSE:** Shared synchronous token-refresh helper, extracted from SCH-006's real per-provider refresh logic so UTIL-006 (and, in future, SCH-006 itself if refactored) has one canonical place to call rather than reimplementing the refresh HTTP calls a second time. Not itself given a formal Part 6 number in the spec docs — a new BC-028 addition, numbered here for registry clarity only.

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ connection_id, client_id, category, provider, refresh_token_secret_id, access_token_secret_id, secondary_secret_id, provider_account_id }` — the last 3 fields added BC-032 for the new Shopify branch below (Google's branch ignores them).

**OUTPUT / END STATE:**
- Success (`google`): reads the refresh token secret, the OAuth app's client_id, and its client secret; POSTs to `https://oauth2.googleapis.com/token`; on success, stores the new access token via `store_credential_secret` and calls `update_connection_tokens` (1-hour expiry, matching Google's real access-token lifetime) → `{ refreshed: true, access_token_secret_id, token_expires_at }`.
- Success (`shopify`, new BC-032): reads the Shopify Client ID from `refresh_token_secret_id` and the Client Secret from `secondary_secret_id`; POSTs to `https://{provider_account_id}/admin/oauth/access_token` (Client Credentials Grant, `grant_type=client_credentials`); on success, stores the new access token and calls `update_connection_tokens` (86399s expiry, matching Shopify's real token TTL) → same `{ refreshed: true, access_token_secret_id, token_expires_at }` shape as Google. **Field placement is deliberately Google-shaped, not WooCommerce-shaped**: the STABLE Shopify Client ID lives in `refresh_token_secret_id` (the same role Google's actual refresh_token plays), not in `access_token_secret_id` — that slot is reserved for the ROTATING access token every Tool reads for live calls and every refresh overwrites. An earlier draft of this branch got this backwards; caught and fixed before any real connection used it (see Session Log).
- Refresh failure (Google or Shopify returned an error): `{ refreshed: false, error }`.
- Any other provider (`calendly`, `cal_com`, anything else): `{ refreshed: false, error: "unsupported provider for synchronous refresh: ..." }` — **NOT YET IMPLEMENTED**, a real, deliberate scope cut (Calendly/Cal.com are still `testing`/`pending` app status). Flagged for a future card, not silently left unhandled — the fallback branch returns a clear, honest error rather than crashing or guessing.

**REAL DEPENDENCIES:** None directly (calls Google's and Shopify's real token endpoints + `public` RPCs). The Shopify branch's connection rows are created by a new Supabase Edge Function, `shopify-connect` (BC-032, mirrors `woocommerce-connect`'s live-validate-then-store pattern) — not tracked as its own registry entry here since this file is n8n-scoped and no other Edge Function (including `woocommerce-connect` itself) has one either; noted here as the natural cross-reference instead.

**LAST VERIFIED:** BC-028, 2026-08-06 — verified indirectly via UTIL-006's real E2E test (the Google branch is the one that actually ran and succeeded, confirmed via real DB state). **BC-032 (Shopify branch):** structurally validated (published, `get_workflow_details` re-confirmed the full node graph and all 5 `Route By Provider` outputs correctly wired) and its request shape/endpoint confirmed correct against Shopify's real, documented Client Credentials Grant contract, but **not exercised end-to-end through a genuine production connection** — no currently-built Tool performs a live ecommerce API call that would trigger this branch naturally (WF-014 GetOrderStatus reads only from Zenny's own DB), and this workflow's `executeWorkflowTrigger` cannot be invoked directly by the available test tooling (no webhook trigger; `test_workflow` forcibly pins all credentialed/HTTP nodes, which would fake the very external call this branch needs to prove). Disclosed limitation, same class as other providers tested without real store credentials — not a shortcut taken silently.

---

### Tool Execution Fallback (Part 7 — unnumbered but real, referenced as the credential-failure terminal path)
**n8n ID:** `UTcdzMvOb7gCQM5J` · not published

**PURPOSE:** Handles a credential/tool-execution failure: retries once if `failure_type === 'retryable'` (2-second wait), otherwise marks the connection `error`, logs an audit event, and notifies a human.

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ failure_type, tool_name, client_id, category, connection_id, error_reason }`

**OUTPUT / END STATE:**
- Retryable: waits 2s, returns `{ action: 'retry', ...passthrough }`.
- Non-retryable: calls `public.update_connection_status` RPC (sets `status='error'`, stores `last_error`), calls `public.insert_audit_log_event` RPC, notifies via UTIL-004 (Gmail), then returns `{ action: 'notify_human', note: "No generic dashboard-approval degrade path exists yet..." }`.

**FIXED BC-028 (multiple real, pre-existing bugs — this workflow had never been execution-tested before this session either):**
1. The Slack node ("Notify Human") had no valid credential (per BC-004/BC-008's long-standing gap — no real multi-tenant Slack OAuth app exists) and had never been migrated to the Gmail-based UTIL-004 path the way SCH-006's alerts were in BC-025 — meaning the credential-failure human-notification path had always notified no one. Removed entirely (not disabled-in-place, per the BC-025 precedent) and replaced with Execute Workflow → UTIL-004, wiring both of UTIL-004's output pins (the same known gotcha fixed elsewhere this session/BC-026).
2. `Mark Connection Errored` and `Log Fallback Event` both had zero credential attached at all — confirmed via a real "Credentials not found" error on first test.
3. `Log Fallback Event` had no `responseFormat` set, throwing on `insert_audit_log_event`'s bare scalar response — fixed to `text`, matching `Mark Connection Errored` (also proactively set to `text`).

**REAL DEPENDENCIES:** UTIL-004 (Notification Router).

**LAST VERIFIED:** BC-028, 2026-08-06 — first-ever confirmed live execution. Tested via a real disposable `control.client_connections` row (category `telephony`, later marked `revoked`): confirmed the connection was genuinely marked `status='error'` with the real `last_error` text via direct SQL, and a real Gmail message was sent (`id: 19fd89f71e99ca23`, `labelIds: ["SENT"]`).

**FIXED BC-031 (real bug — the "zero `client_connections` rows exist at all" case had never been exercised before this session's brand-new appointment test client):** `Mark Connection Errored` and `Log Fallback Event` both unconditionally passed `connection_id` through to their respective RPCs (`update_connection_status`, `insert_audit_log_event`), both of which take a `uuid` parameter. When no connection row exists at all for a client+category (as opposed to an existing revoked/expired one), `connection_id` arrives as an empty string, not a valid uuid or `NULL` — both RPC calls threw `invalid input syntax for type uuid: ""`, crashing the entire fallback workflow with no response ever returned, silently breaking every real caller of UTIL-006 whenever a client's connection was simply never configured (as opposed to configured-then-broken). Fixed: added an explicit `Has Connection ID?` check before `Mark Connection Errored` (skips straight to logging when there's no row to mark), and coerced `Log Fallback Event`'s `p_connection_id` from `""` to `null`.

---

## Scheduled Workflows (Part 8)

### SCH-006 — Zenny Credential Platform - Token Refresh Sweep
**n8n ID:** `rKlJYukwRexlYRYM` · **published**, active

**PURPOSE:** Refreshes OAuth access tokens for Google/Calendly/Cal.com connections due for refresh; marks genuinely expired ones; logs both outcomes; separately, proactively warns about Google connections approaching Google's own 7-day Testing-mode refresh-token hard-expiry.

**TRIGGER:** Schedule Trigger. **Real node name is "Every 6 Hours" (stale/mislabeled — do not trust the name).** Real live config, reconfirmed 2026-08-07 (BC-027): `{ rule: { interval: [{ field: 'hours', hoursInterval: 2 }] } }` — genuinely fires every 2 hours, not 6. The human changed this directly in n8n outside a Build Card; this session only confirmed it live, did not change it.

**INPUT:** None (self-triggered, queries `control.client_connections` for rows due for refresh).

**OUTPUT / END STATE:** Success per connection = either a refreshed token stored (`Update Connection Tokens` + `Log Token Refreshed`) or, on a genuine refresh failure, the connection marked expired (`Mark Token Expired`) + logged (`Log Refresh Failed`) + a real notification fired via `Notify Refresh Failed` (Execute Workflow → UTIL-004). Separately, the 7-Day Warning Loop finds Google Testing-mode connections nearing 7-day expiry and fires `Notify Google Testing 7-Day Reminder` (also via UTIL-004).

**STANDING OPERATIONAL REALITY (not solved by this or any sweep-interval change):** Google issues OAuth **refresh tokens** to Testing-status apps with a **hard 7-day expiry, independent of how often this sweep runs** (Client_Integration_and_Credential_Platform_v1.md Part 8.1.1). A 2-hour (or even 2-minute) sweep interval only ever refreshes the short-lived **access** token more promptly — it cannot extend or renew the refresh token itself once Google's own 7-day Testing-mode clock runs out. The ONLY real fix for that constraint is completing Google's app verification and switching the OAuth app's Publishing Status from Testing to Production (confirmed via BC-020's direct investigation). Do not read a tighter sweep interval as having addressed this constraint.

**REAL DEPENDENCIES:** UTIL-004 (both the failure-notification and 7-day-reminder branches).

**LAST VERIFIED:** Real deliberate-failure test + 2 genuine Gmail sends confirmed BC-025 (2026-08-06). The 2-hour interval itself reconfirmed live via a direct node-parameter read BC-027 (2026-08-07) — not re-executed this session.

---

## Platform Adapters (Part 17)

### ADP-002 — Zenny Platform Adapter - Convocore Adapter
**n8n ID:** `BOxeuH6ehv46FZL0` · **published**, active

**PURPOSE:** The real ingress point for every Convocore Tool call: resolves `agentId` → `client_id` (via `control.convocore_agent_map`), verifies the request's Bearer token against that agent's own stored secret, then routes by tool type — System Tools (`forward-call`/`end-call`) and Shopify are explicitly excluded (Convocore-native / credential-routed, not Adapter-mediated); `human-handoff` writes a real `escalations` row with a Stage-1/Stage-2 distinction; everything else gets mapped into the Standard Request Contract and returned.

**TRIGGER:** Webhook, `POST /convocore-adapter` (production: `https://n8n-cbzu.srv1881104.hstgr.cloud/webhook/convocore-adapter?agent_id=<agent's real convocore_agent_id>&key=<tool-key>` — the query string is now mandatory, see FIXED BC-071 below).

**INPUT (corrected BC-071, 2026-08-17 — supersedes the shape below, kept only for history):** Convocore's REAL body, live-captured for the first time via a real Custom Tool test call: `{ convo_id, session_id, tool_metadata: { tool_id }, tool_payload: {...} }` — no `agentId` or tool identifier anywhere in the body at all. `agent_id`/`key` must arrive via the webhook URL's own query string instead (each Custom Tool's Server URL carries its own `?agent_id=...&key=...`).

**INPUT (stale, pre-BC-071 assumption — never matched real traffic):** ~~`{ agentId, conversation_id, tool_name (or toolName/key), timestamp, correlation_id, variables (or payload) }` + an `Authorization: Bearer <token>` header~~ — this shape was invented, never independently verified against a real captured Convocore call, and would have produced `UNKNOWN_AGENT` on every single real invocation (no `agentId` in the actual body). The `Authorization: Bearer <token>` header itself was correct and remains unchanged.

**OUTPUT / END STATE:**
- Unknown agent → 401 `{ error: { code: "UNKNOWN_AGENT" } }`.
- Bad bearer token → 401 `{ error: { code: "AUTH_FAILED" } }`.
- System Tool / Shopify → 200, explicit "excluded, out of Adapter scope" note, no further action.
- `human-handoff`, no existing open escalation → 200 `{ result: { stage: 1, escalated: true } }`, and a real new `escalations` row (`status='open'`, `escalation_type='convocore_human_handoff'`).
- `human-handoff`, an open escalation already exists for this customer → 200 `{ result: { stage: 2, escalated: true } }`, fires a real UTIL-004 notification instead of writing a duplicate row (per BC-010's Stage-2 decision).
- Standard tool, real built Tool exists (BC-032, extended BC-035 — see fixes below): builds the Standard Request Contract, resolves `tool_name` (PascalCase, e.g. `"CreateLead"`) to its kebab-case webhook path (`.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()`), and if that path matches one of the 17 real built Tool webhooks — `create-lead`, `cancel-appointment`, `get-order-status`, `get-booking-status`, `update-customer`, `notify-human`, `check-availability`, `create-appointment`, `create-booking-request`, `create-cart`, `create-reservation`, `create-waitlist-entry`, `create-callback-queue-entry`, `create-inspection-slot-booking`, `create-scored-booking`, `create-registration`, `record-conversion` — forwards the contract via a real HTTP POST to that Tool's own production webhook and returns 200 with the Tool's real response body. Forward itself fails (network/5xx from the Tool): 502 `{ error: ... }`.
- Standard tool, NOT YET BUILT (e.g. `SendRecoveryMessage`): 200, the built Standard Request Contract object (`request_id`, `contract_version: 'v1'`, `correlation_id`, `client_id`, `conversation_id`, `runtime_module: null` — deliberately never inferred, per Part 8 — `tool_name`, `timestamp`, `idempotency_key`, `payload`, `authentication.bearer_verified: true`) echoed back as a clean fallback, same shape as before BC-032 — this remains correct behavior for tools that genuinely don't exist yet.

**FIXED BC-035 (allow-list update, all 11 Conversion Engine Tools now forward):** `Resolve Tool Webhook Path`'s hardcoded `builtTools` array extended from 12 to 17 entries with the 5 Tools built in BC-034 (WF-008–WF-012). Real curl calls against the live production webhook confirmed: `RecordConversion` and `CreateRegistration` (2 of the 5 new tool_names) both forward correctly — `CreateRegistration` against a wrong-archetype client also proved the downstream Tool's own Pattern D resilience (real escalation created, no crash, no leaked echo); `CreateLead` (one of the original 12) re-confirmed no regression; a genuinely still-unbuilt tool (`SendRecoveryMessage`) correctly still falls to the clean echo fallback.

**FIXED BC-028 (major — the entire human-handoff path was non-functional, and several more real bugs surfaced once real test data existed for the first time ever):**
1. `Check Existing Open Escalation` and `Insert Escalation Row` both used `Content-Profile`/`Accept-Profile` direct client-schema access — same `PGRST106` failure as UTIL-003/UTIL-005. Rewired to two new `public` RPCs: `client_has_open_escalation` (returns the open row or `null`) and a newly-overloaded `insert_client_escalation` (10-arg version adding `p_escalation_team`, fully backward-compatible with WF-017's existing 9-arg calls — Postgres correctly resolves each call to the matching overload).
2. `control.convocore_agent_map` had **zero table-level grants** for `authenticated`/`service_role` at all — a real, separate infrastructure gap (the BC-026 schema-`USAGE` fix opened the schema door but this specific table's own grants were never added). Fixed via `GRANT SELECT ON control.convocore_agent_map`. This had never been caught because no real `convocore_agent_map` row existed anywhere until this session.
3. `Agent Known?` and 4 downstream nodes/expressions (`Read Agent Secret`, `Resolve Client Schema`'s input, `Build Standard Request Contract`'s Code node, the Stage-2 notification message) all assumed the agent-lookup response was still a `[0]`-indexed array — the same array-unwrap bug class as BC-026's INT-002 finding. Never caught because no real row ever hit the "found" branch before. All fixed to reference the object directly.
4. `Read Agent Secret` had no `responseFormat` set, and the Bearer comparison referenced the wrong shape depending on format — resolved to `responseFormat: text` + comparing against `$json.data`.
5. `Insert Escalation Row`'s `p_schema` reference (`$json.client_schema_name`) broke because `Check Existing Open Escalation`'s own HTTP response replaces the item's `.json` entirely — fixed to reference the schema-resolver node explicitly via `$('Resolve Client Schema (UTIL-001)')`.
6. The Stage-2 `Fire Stage 2 Notification (UTIL-004)` → `Respond - Stage 2 Notification Fired` connection had the same single-output-pin gotcha fixed elsewhere this session — wired both pins.

**REAL DEPENDENCIES:** UTIL-001 (schema resolution for the human-handoff path only), UTIL-004 (Stage-2 notification). BC-032: the "standard tool" path now also depends on whichever real Tool webhook it forwards to (12 currently: see OUTPUT/END STATE above).

**FIXED BC-071 (2026-08-17 — critical, found via a real human test, not a Doc-Search-First read):** while producing the Carmelli Convocore build package (`05_Platform_Builds/Convocore/BC-071_Carmelli_Build_Package/`), the human ran a real `create-lead` Custom Tool call in n8n's webhook test mode and captured Convocore's actual outgoing body directly. It never matched what `Normalize Incoming Payload` assumed — see the corrected INPUT line above. Most critically, **`agentId` was never present in the body at all**, meaning every real Convocore Custom Tool call to this Adapter, since it was first built, would have failed `UNKNOWN_AGENT` before reaching any tool logic — this had never been caught because, same as BC-028's finding, no real end-to-end Convocore call had ever been tested (only curl calls simulating the assumed shape). Fixed `Normalize Incoming Payload` to read `agent_id`/`key` from the webhook URL's own query string (not the body) and `tool_payload` for parameters (not `variables`/`payload`), `convo_id` for the conversation ID (not `conversation_id`). **Live-tested** against the human's real captured shape with query params added: execution `30214` — `Normalize Incoming Payload` correctly output `agentId`, `tool_name: "create-lead"`, `conversation_id`, and the real `variables` object; flow correctly proceeded to `Get Convocore Agent Map` and correctly stopped at `Respond - Unknown Agent` (expected — no real Carmelli `convocore_agent_id` exists yet, gate 2 not built; the Supabase lookup ran for real, found nothing, no live data touched). **Consequence for every future client's Convocore build, not just Carmelli's:** every Custom Tool's Server URL must now include `?agent_id=<real-agent-id>&key=<tool-key>` — this is a platform-wide correction, not Carmelli-specific, even though it surfaced during Carmelli's build.

**FIXED BC-032 (major — the entire "standard tool" routing path had never actually forwarded to anything):** the human observed the routing switch only had 3 real `tool_name` cases; live investigation via `get_workflow_details` found the real gap was worse than a missing case — the "standard" fallback branch built a Standard Request Contract and echoed it straight back via `Respond - Standard Request Contract`, with **no forwarding logic to any downstream Tool ever implemented**, for any tool_name, since this Adapter was first built. Every real Convocore Tool call other than the 3 excluded/handoff cases had always silently returned the bare contract instead of the Tool's actual result. Fixed by adding: a `Resolve Tool Webhook Path` Code node (kebab-case conversion + a hardcoded allow-list of the 12 currently-built Tools), a `Tool Is Built?` IF node, a `Forward To Tool` HTTP node (`onError: continueErrorOutput`, POSTs to the resolved Tool's real production webhook), and split success/error response nodes. Also fixed a leak this introduced: the internal routing fields (`_tool_path`, `_kebab_tool_name`) were briefly appearing in the not-yet-built-tool echo response before the response body was made to construct itself explicitly instead of echoing the whole item.

**LAST VERIFIED:** BC-028, 2026-08-06 — real end-to-end test via the actual production webhook (human-handoff path only, see above). **BC-032 (standard tool forwarding):** 4 real curl calls against the live production webhook (`https://n8n-cbzu.srv1881104.hstgr.cloud/webhook/convocore-adapter`) using a real test agent (`bc028-test-agent-clientA`) and real Bearer secret: `CheckAvailability` → real WF-002 response; `CreateLead` → real WF-001 response (new lead `b28c4e95-...` confirmed); `GetOrderStatus` → real WF-014 response with full order data; `RecordConversion` (genuinely not yet built) → correctly fell back to the clean untouched echo response, no leaked internal fields. **BC-035 (2026-08-10, allow-list extended to 17):** same test agent/secret, 4 more real curl calls: `RecordConversion` → real WF-012 response (duplicate-detected existing conversion row returned); `CreateRegistration` → real WF-011 Pattern D handoff (correctly degraded on a wrong-archetype client, real escalation `26aa8fc8-...` created, not a crash); `CreateLead` → re-confirmed no regression (new lead `b9cbc71f-...`); `SendRecoveryMessage` (still genuinely unbuilt) → correctly still falls to the clean echo fallback. **BC-071 (2026-08-17, real payload-shape bug fixed):** test execution `30214` against the human's real live-captured Convocore body (with `?agent_id=...&key=create-lead` query params added) — `Normalize Incoming Payload`'s output confirmed correct field-by-field; flow correctly reached live Supabase and correctly returned `Unknown Agent` for the test placeholder ID (no real Carmelli agent exists yet). Not yet re-tested end-to-end against a real Convocore agent (still `403`-blocked / gate 2 not built) — this is the first correction to actually match real Convocore traffic shape, prior BC-028/032/035 tests all used curl calls built against the never-verified assumed shape.

**FIXED BC-071 PART 3 — CRITICAL, real auth bypass + human_handoff branch customer-resolution (2026-08-17):** found while investigating the human's own live test, both genuinely severe:
1. **`Bearer Token Valid?` was completely disconnected.** `Read Agent Secret` wired straight to `Route By Tool Type`, bypassing the Bearer check node entirely — every real Convocore call had been processed regardless of whether its Bearer token actually matched the calling agent's stored secret. The whole auth design in `Convocore_Adapter_Spec_FINAL.md` Part 2.4 had never actually run. Reconnected `Read Agent Secret` → `Bearer Token Valid?` → (true) `Route By Tool Type` / (false) `Respond - Auth Failed`. **Live-verified both directions**: a correct Bearer token now reaches routing (execution `31147`); an incorrect one is now genuinely rejected with `AUTH_FAILED` (execution `31149`) — confirmed neither was true before this fix.
2. **The Adapter's own `human_handoff` branch had the identical customer-resolution bug as WF-017**, independently — Convocore's native `human-handoff` System Tool routes through the Adapter directly (never through WF-017's webhook), and this branch's own `Check Existing Open Escalation` and `Insert Escalation Row` both passed raw Convocore `customer_id` to RPCs requiring a real UUID. Wired the same find-or-create chain in. Live-tested end to end together with the auth fix (execution `31147`) — real escalation `71ebcd49-...` created with the correct `escalation_type='convocore_human_handoff'`/`escalation_team` shape, cleaned up after.
3. **Also fixed:** `Forward To Tool`'s URL had regressed to `webhook-test` instead of production `webhook` — found and reverted before any real Convocore traffic could hit it.

Published (`a5c4b85d-7adb-480b-a92c-38a41ef5188d`).

---

## Core Agent — Internal Workflows (Part 7.7, no webhook exposure)

### INT-001 — Zenny Internal - Create Customer
**n8n ID:** `15a5DvfIRI7JwsAQ` · **published**, active

**PURPOSE:** Initializes a new Customer record on a new customer's first session. Business Memory only — no Customer Memory exists yet to load, per Agent_Runtime_System_v1.md's NEW USER definition.

**TRIGGER:** `executeWorkflowTrigger` — no webhook, Core Agent only.

**INPUT:** `{ client_schema_name, primary_contact_method }`

**OUTPUT / END STATE:** Success = a real new row in `{client_schema_name}.customers` (via the `public.insert_client_customer` RPC, `session_state='new'`), returns `{ created: true, customer_id }`.

**REAL DEPENDENCIES:** None (calls the `insert_client_customer` RPC directly, not another workflow).

**LAST VERIFIED:** BC-026, 2026-08-06 — real customer rows confirmed created for both roster clients (`3cf9975f-...` Client A, `f2174d7d-...` Client B) via direct SQL, not just execution success.

---

### INT-002 — Zenny Internal - Load Client Configuration
**n8n ID:** `vbk6dwVX4Q6H2RuY` · **published**, active

**PURPOSE:** Reads `control.client_config` fresh at the start of every session — never cached, per Agent_Runtime_System_v1.md Step 1C's explicit "Critical rule."

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ client_id }`

**OUTPUT / END STATE:**
- Config exists: `{ config_loaded: true, client_config: {...real row...} }`.
- No config row (hard missing-config rule): `{ config_loaded: false, fallback: 'core_agent_only', modules_active: { growth_agent: false, conversion_engine: false, recovery_engine: false, email_manager: false }, reason: 'no control.client_config row for this client_id' }` — the most conservative behavior, never permissive.

**REAL DEPENDENCIES:** None directly (reads `control.client_config` via PostgREST with `Accept-Profile: control`).

**LAST VERIFIED:** BC-026, 2026-08-06. **Two real bugs were found and fixed here first**, both now resolved: (1) the `control` schema had no `USAGE` grant for any PostgREST role at all — fixed by a human-applied `GRANT USAGE ON SCHEMA control` migration; (2) the config-resolution Code node wrongly assumed the HTTP node's output was still a JSON array (`Array.isArray(rows)`) when n8n actually auto-unwraps a single-row response into the object directly — fixed to check `$input.all()` + presence of `client_id`. Re-verified live post-fix against Client A's real config (`config_loaded: true`).

---

### INT-003 — Zenny Internal - Load Archetype Configuration
**n8n ID:** `WZMrS05IeTn8o0pj` · **published**, active

**PURPOSE:** Resolves the archetype-specific sub-object out of the already-loaded client config. Called immediately after INT-002.

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ client_config: object, archetype: string }`

**OUTPUT / END STATE:** Always succeeds (pure Code node, no DB call): `{ archetype, archetype_settings, freedom_level, language_mode, language_list, resolved_conservatively: boolean }`. Missing `freedom_level_override` → defaults to `1` (most conservative). Missing `language_mode` → `'adaptive'`. Missing/empty `language_list` → `['English']`. Per Step 1C: never infer capability from context when config is silent.

**REAL DEPENDENCIES:** None.

**LAST VERIFIED:** BC-026, 2026-08-06 — tested against Client B's real `{"emergency":{"conversion_mode":"A","freedom_level_override":null}}` config: correctly resolved `freedom_level: 1`, `resolved_conservatively: true`.

---

### INT-004 — Zenny Internal - Initialize Conversation
**n8n ID:** `Xlcb0PhSUiyO6Znj` · **published**, active

**PURPOSE:** Creates/attaches the session's conversation record at session start. **Self-resolved document-level mapping (BC-026, acknowledged by the Commander in BC-027):** no `conversations` table exists in any client schema — Convocore itself owns the real conversation transcript/record — so this workflow's Postgres-side analog is an `active_issues` row with `current_owner='live_conversation'`, not a dedicated table.

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ client_schema_name, customer_id }`

**OUTPUT / END STATE:** Success = a real new row in `{client_schema_name}.active_issues` (via the `public.insert_client_active_issue` RPC, `current_owner='live_conversation'`), returns `{ initialized: true, issue_id }`.

**REAL DEPENDENCIES:** None (calls the RPC directly).

**LAST VERIFIED:** BC-026, 2026-08-06 — real `active_issues` rows confirmed created for both roster clients via direct SQL (`current_owner: 'live_conversation'` confirmed).

---

### INT-005 — Zenny Internal - Archive Conversation
**n8n ID:** `bIcKNwCk8M52oipt` · **published**, active

**PURPOSE:** Closes out the conversation record at session end — deletes the `active_issues` row INT-004 opened.

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ client_schema_name, issue_id }`

**OUTPUT / END STATE:** Success = the `active_issues` row is genuinely deleted (via the `public.delete_client_active_issue` RPC), returns `{ archived: true, issue_id }`.

**REAL DEPENDENCIES:** None (calls the RPC directly).

**LAST VERIFIED:** BC-026, 2026-08-06. **A real bug was found and fixed here**: `delete_client_active_issue` returns a bare boolean scalar; even with `responseFormat: "text"` set, n8n delivered it as a real JS boolean `true` (not the string `'true'`) under `.data`, so the original strict string comparison (`$json.data === 'true'`) always evaluated false — a real successful delete was always reported as `archived: false`. Fixed to accept either shape. Re-verified live post-fix against a fresh row for both roster clients — real deletion confirmed via direct SQL (empty result) AND the workflow's own `archived: true` output now correctly matches.

---

## Core Agent — Tools (Part 13)

### WF-013 — Zenny Core Agent - CancelAppointment
**n8n ID:** `68tMXAV7lPzsX4fn` · **published**, active

**PURPOSE:** Cancels an appointment. Classified HIGH-RISK per the Customer Verification Rule (modifies a booking). **BC-053 UPDATE (2026-08-14):** now branches on `control.clients.verification_tier_enabled` (opt-in per client, default false). If **off** (all existing clients today), behavior is unchanged from BC-026 — always routes to Human Handoff Handler (WF-017). If **on**, queues a `<schema>.pending_verifications` row instead and responds `pending_approval` — a dashboard approval genuinely executes the cancellation (see PENDING-VERIFICATION note below), it does not just flip a status.

**TRIGGER:** Webhook, `POST /cancel-appointment`.

**INPUT (Standard Request Contract):** `{ client_id, payload: { customer_id, appointment_id } }`

**OUTPUT / END STATE:**
- Tier off (default): 200, `{ result: { appointment_id, status: "pending_human_review" }, handoff: { result: { escalation_id, status: "open" } } }` — real `escalations` row via WF-017, unchanged from BC-026.
- Tier on: 200, `{ result: { appointment_id, status: "pending_approval", pending_verification_id } }` — no escalation, no handoff call.

**REAL DEPENDENCIES:** UTIL-001 (schema resolution), WF-017 (via a direct HTTP POST to its production webhook, not an Execute Workflow node — tier-off path only), `get_client_verification_tier` + `queue_pending_verification` RPCs (BC-053, tier-on path).

**PENDING-VERIFICATION note:** approval is NOT handled inside this workflow — the dashboard's Pending Approvals page calls the `resolve-pending-verification` Edge Function directly, which calls `cancel_client_appointment` (sets `conversions.final_state`/`conversion_state = 'cancelled'` — real DB state, live-verified) and sends a confirmation from the client's own connected email via WF-019. **BC-055 UPDATE (2026-08-14):** the Edge Function now also attempts a real client-calendar event delete (Google `DELETE`, Calendly cancellation) — see `Wiki/infra/verification-approval-queue.md` for the full mechanism and real end-to-end proof (a real disposable Google Calendar event was created, deleted via the live function, and independently confirmed `status: "cancelled"` on Google's own side).

**BUG FOUND + FIXED THIS CARD:** while adding BC-053's RPCs, a copy-paste error in the same migration batch briefly overwrote `public.get_client_appointment_with_customer` (this workflow's own "Get Appointment + Customer" node dependency, also used by WF-015) with an empty stub. Caught immediately via a live disposable-fixture test, restored using the exact join already proven correct in `dashboard_get_appointment` (read live before restoring, not reconstructed from memory), re-verified against a fresh fixture. Live window: a few minutes within this session; no evidence any real traffic hit it during that window (roster clients have 0 real appointments).

**LAST VERIFIED:** BC-053, 2026-08-14 — both branches (tier on/off) proven live via the real production webhook against a real synthetic fixture, plus the `get_client_appointment_with_customer` regression fix reverified. Prior: BC-026, 2026-08-06 — real webhook call, real escalation confirmed (`0642be06-...`). **BC-055, 2026-08-14** — real calendar-delete path proven end-to-end against a genuine disposable Google Calendar event (not just the DB-side path); Calendly cancellation built to spec but not live-tested (no roster Calendly connection).

---

### WF-014 — Zenny Core Agent - GetOrderStatus
**n8n ID:** `XBkDQ8JzHOp4jsOV` · **published**, active

**PURPOSE:** Returns the status of a real order. LOW-RISK per the Customer Verification Rule — light verification only (confirm one known identifier: `order_reference`).

**TRIGGER:** Webhook, `POST /get-order-status`.

**INPUT:** `{ client_id, payload: { customer_id, order_reference } }` — `order_reference` matches either `order_id::text` or `provider_order_id` (via the `public.get_client_order_by_reference` RPC).

**OUTPUT / END STATE:**
- Found: 200, `{ result: { order_id, status, details: {...full real order row...} } }`.
- Not found: 404, `{ error: { code: "NOT_FOUND", message: "No order matches the given order_reference" } }`.
- Unknown client: 400, `{ error: { code: "UNKNOWN_CLIENT" } }`.

**REAL DEPENDENCIES:** UTIL-001.

**LAST VERIFIED:** BC-026, 2026-08-06 — real webhook call against a real Shopify order (`shopify-ord-9001`), correct `status: "pushed"` with full real order details returned.

---

### WF-015 — Zenny Core Agent - GetBookingStatus
**n8n ID:** `juAixXehoE81eGYn` · **published**, active

**PURPOSE:** Returns the status of a real appointment. LOW-RISK, light verification (confirm one known identifier: `booking_reference`). Re-verified directly against Part 13.15 during BC-026 rather than inferred from WF-014's shape (the field name and derivation logic genuinely differ).

**TRIGGER:** Webhook, `POST /get-booking-status`.

**INPUT:** `{ client_id, payload: { customer_id, booking_reference } }` — `booking_reference` is the real `appointment_id` (via the `public.get_client_appointment_with_customer` RPC, which also joins through `conversions`→`leads` to attach `customer_id`).

**OUTPUT / END STATE:**
- Found: 200, `{ result: { booking_id, status, details: {...full appointment row + customer_id...} } }`. `status` is DERIVED, not a stored column: whichever of `client_calendar_write_status`/`our_db_write_status` matches the row's own `authoritative_source` — since `appointments` has no simple `status` column.
- Not found: 404, `{ error: { code: "NOT_FOUND", message: "No appointment matches the given booking_reference" } }`.
- Unknown client: 400, `{ error: { code: "UNKNOWN_CLIENT" } }`.

**REAL DEPENDENCIES:** UTIL-001.

**LAST VERIFIED:** BC-026, 2026-08-06 — real webhook call against a real appointment (`45555555-...`), correct `status: "success"` derived from `authoritative_source: client_calendar`. **Note (BC-053):** this workflow's `get_client_appointment_with_customer` dependency was briefly (a few minutes) broken by an unrelated migration mistake during BC-053, then fixed and reverified with the exact join documented above — see WF-013's entry for the full incident. No evidence this workflow's own real traffic hit the broken window.

---

### WF-016 — Zenny Core Agent - UpdateCustomer
**n8n ID:** `ogYca9QFCMIEWrWG` · **published**, active

**PURPOSE:** Updates customer account fields. HIGH-RISK per the Customer Verification Rule (modifies account data). **BC-053 UPDATE (2026-08-14):** same opt-in branch as WF-013 — off (default) unchanged from BC-026; on, queues a `pending_verifications` row instead of always handing off.

**TRIGGER:** Webhook, `POST /update-customer`.

**INPUT:** `{ client_id, payload: { customer_id, fields: {...requested field changes...} } }`. **`customer_id` is a channel-native identifier (corrected BC-071, 2026-08-17), not a pre-existing internal UUID** — see FIXED BC-071 below.

**OUTPUT / END STATE:**
- Tier off (default): 200, `{ result: { customer_id, updated_fields: [] }, handoff: { result: { escalation_id, status: "open" } } }` — unchanged from BC-026, no update ever actually applied on this path.
- Tier on: 200, `{ result: { customer_id, status: "pending_approval", pending_verification_id } }`.

**REAL DEPENDENCIES:** UTIL-001, WF-017 (tier-off path), `get_client_verification_tier` + `queue_pending_verification` RPCs (BC-053, tier-on path).

**PENDING-VERIFICATION note:** approval executes via the `resolve-pending-verification` Edge Function, same as WF-013 — calls `apply_customer_update` (maps the `primary_contact_method` field directly, everything else upserts into `customer_preferences` — real DB writes, live-verified), then sends confirmation via WF-019. See `Wiki/infra/verification-approval-queue.md`.

**LAST VERIFIED:** BC-053, 2026-08-14 — both branches proven live via the real production webhook, plus a full queue→approve→real-DB-update→confirmation-attempt round trip. Prior: BC-026, 2026-08-06 — real webhook call, real escalation confirmed (`5e7a3855-...`).

**FIXED BC-071 (2026-08-17, found live-testing Carmelli's build):** same customer-resolution bug as WF-001/WF-017 — `customer_id` arrives as Convocore's own chat-session identifier, never a real UUID, and both this workflow's branches (`Build Handoff Payload`/Route-to-WF-017, and the opt-in `Queue Pending Verification` path) passed it straight to RPCs requiring a real UUID (`insert_client_escalation` via WF-017, `queue_pending_verification` directly). The tier-on branch would have hit this for any client with `verification_tier_enabled=true`, not just via Carmelli's tier-off path. Wired the same find-or-create chain (`find_client_customer_by_channel`/`insert_client_customer`/`insert_client_channel_identity_link`) between schema resolution and both branches. **Also found and fixed:** this workflow's unpublished draft had `Route To Human Handoff (WF-017)`'s URL regressed to `webhook-test` (the previously-published active version was still correct) — fixed before it could ever ship broken. Live-tested end to end (execution `31150`) — real escalation `a08b84e6-...` created via the tier-off path with a correctly resolved customer UUID, cleaned up after. Published.

---

### WF-017 — Zenny Core Agent - NotifyHuman
**n8n ID:** `pLYEVQ9kto7NTBfk` · **published**, active

**PURPOSE:** The terminal Fallback-D / Human Handoff Handler destination for every other Tool (and called directly by WF-013/WF-016 for their always-handoff behavior). Writes a real `escalations` row and fires a real internal-ops notification.

**TRIGGER:** Webhook, `POST /notify-human`.

**INPUT:** `{ client_id, request_id, contract_version, payload: { customer_id, conversation_summary, intent_history[], escalation_reason, escalation_priority: "P1"|"P2"|"P3" } }` — `escalation_priority` is mapped internally to the real enum values (`P1`→`P1_immediate`, `P2`→`P2_standard`, `P3`→`P3_review`; unrecognized → defaults to `P2_standard`). **`customer_id` is a channel-native identifier (corrected BC-071, 2026-08-17), not a pre-existing internal UUID** — this workflow is the terminal Fallback-D destination for every other Tool, so resolving it here once fixes every Tool's escalation path at once — see FIXED BC-071 below.

**OUTPUT / END STATE:**
- Success: 200, `{ result: { escalation_id, status: "open" } }` — a real new `escalations` row exists with `status='open'`, `escalation_type='notify_human_tool'`, `origin_module='core_agent'`, `ownership_state='human_owned'`; a real Gmail message is sent via UTIL-004 to the internal ops inbox.
- Unknown client: 400, `{ error: { code: "UNKNOWN_CLIENT" } }`.

**REAL DEPENDENCIES:** UTIL-001, UTIL-004 (via Execute Workflow — **both of UTIL-004's output pins must be wired to the response node**, see UTIL-004's entry above; this exact bug existed here until fixed BC-026).

**LAST VERIFIED:** BC-026, 2026-08-06 — real escalation rows confirmed via direct SQL (`d073d15c-...` pre-fix — proving the DB write itself always worked even while the response was broken; `655dc334-...` post-fix, `455b6eca-...` for Client B). Real Gmail message confirmed sent: `id: 19fd832788ca2c8d`, `labelIds: ["SENT"]`.

**FIXED BC-029 (major, found live while testing WF-001's Pattern D path):** `Insert Escalation Row` calls `public.insert_client_escalation` with exactly 9 named args — this workflow's own real call, unchanged since BC-026. BC-028 added a 10-arg overload (`p_escalation_team text DEFAULT NULL`) alongside the original 9-arg one; PostgREST could no longer disambiguate a 9-arg call between the two (`PGRST203 — Could not choose the best candidate function`), so **every 9-arg caller of WF-017 — this workflow's own internal call, and therefore WF-013/WF-016's handoff path too — had been silently broken since BC-028**, undetected because BC-028's own ADP-002 test always passed the 10th argument explicitly. Fixed by dropping the redundant 9-arg overload (migration `drop_ambiguous_insert_client_escalation_9arg_overload`) — the 10-arg version's `DEFAULT NULL` is a strict, fully backward-compatible superset. Also found: `client_test_001_acme_emergency_test.escalations` was missing migration 032's `escalation_team` column entirely (schema-provisioning drift, same class as the `leads` gap below) — fixed via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS escalation_team text`. Re-verified live via WF-001's Retry test: a real escalation (`6e7c768f-...`) was created end-to-end post-fix.

**FIXED BC-071 (2026-08-17, critical, found live-testing Carmelli's build via WF-016's Pattern D path):** raw Convocore `customer_id` was passed straight to `insert_client_escalation`, which requires a real UUID — every real Tool's Pattern-D fallback and every direct `notify-human` call would have thrown `22P02 invalid input syntax for type uuid`. Since this workflow is the SHARED terminal destination for every other Tool's escalation path, fixing customer resolution here once fixes it for all of them at once — not a per-Tool patch. Wired the same find-or-create chain used in WF-001 (`find_client_customer_by_channel`/`insert_client_customer`/`insert_client_channel_identity_link`) between schema resolution and the escalation write. Live-tested end to end (execution `31127`) — real escalation `e64ef64e-...` created with a correctly resolved customer UUID, cleaned up after. Published. **Note:** the Convocore Adapter's OWN separate `human_handoff` branch (ADP-002, Convocore's native System Tool → Adapter directly) bypasses this workflow entirely and had the identical bug independently — fixed separately, see ADP-002's own entry above.

---

## Growth Agent — Tools (Part 13)

### WF-001 — Zenny Growth Agent - CreateLead (WF-001)
**n8n ID:** `fjJkKxA3o6kfeLoz` · **published**, active

**PURPOSE:** Growth Agent's ONLY Tool (Part 7.2's hard rule — Growth Agent never calls a conversion action tool directly). Creates the SOFT LEAD RECORD (Agent_Runtime_System_v1.md Module 2 §4.1) at Tier 2 capture — no lead-scoring logic here, per Planning_to_Build_Transition_v1.md Phase 7's note that scoring defers to Convocore's funnel.

**TRIGGER:** Webhook, `POST /create-lead` (production: `https://n8n-cbzu.srv1881104.hstgr.cloud/webhook/create-lead`).

**INPUT (Standard Request Contract):** `{ client_id, conversation_id, payload: { customer_id, archetype, intent, source_channel, conversation_summary } }`. `archetype` must be one of the 6 real `archetype_enum` values; `source_channel` one of the 6 real `source_channel_enum` values — both checked by a dedicated `Validate Input` node (Pattern A) before any DB call, not left to a raw enum-cast DB error. **`customer_id` is NOT a pre-existing internal UUID (corrected BC-071)** — it's whatever channel-native identifier the calling platform's own session tracking uses (for Convocore: its `user_id`/chat-session identifier, an arbitrary non-UUID string). This workflow resolves it to a real internal `customers.customer_id` itself — callers never need to know or supply the internal UUID.

**OUTPUT / END STATE:**
- Success: 200, `{ result: { lead_id, status: "new" } }` — a real new row in `{client_schema_name}.leads` (via the new `public.insert_client_lead` RPC), `status='new'`, `validation_flag=false`.
- Missing/invalid required field: 400, `{ error: { code: "VALIDATION_ERROR", message, details: [...] } }` (Pattern A) — no DB call made.
- Unknown `client_id`: 400, `{ error: { code: "UNKNOWN_CLIENT" } }`.
- Duplicate (`client_id` + `conversation_id` repeated, matching the `create-lead_{client_id}_{conversation_id}` idempotency key): 200, same `lead_id` as the first call — `insert_client_lead` checks `(customer_id, convocore_conversation_id)` first and returns the existing row instead of inserting a second one. Backed by a real per-schema partial `UNIQUE` index on `(customer_id, convocore_conversation_id)` (Integration Contract Part 11.4's "database is the final guarantee"), not just the key format.
- DB call fails/times out: one silent automatic retry (Pattern B — `retryOnFail`, `maxTries: 2`, `waitBetweenTries: 1000`). If still unresolved: 200, `{ result: { status: "pending_human_review" }, handoff: {...} }` — routes to WF-017 NotifyHuman (Pattern D) with a real new `escalations` row created.

**REAL DEPENDENCIES:** UTIL-001 (schema resolution), WF-017 (direct HTTP POST to its production webhook, matching the WF-013/WF-016 pattern — not an Execute Workflow node). **Added BC-071:** `find_client_customer_by_channel`, `insert_client_customer`, `insert_client_channel_identity_link` RPCs (see FIXED BC-071 below).

**FIXED BC-071 (2026-08-17 — critical, found live-testing Carmelli's build):** the original `Check Customer Exists (RPC)`/`Customer Exists?`/`Respond - Customer Not Found` chain assumed `customer_id` already resolved to a real internal UUID and just verified it belonged to this client — but no caller (Convocore included) ever has that UUID; they only have their own channel-native session identifier. Every real call was throwing `22P02 invalid input syntax for type uuid` at the DB layer. The intended resolution mechanism already existed as standalone, never-wired pieces (`find_client_customer_by_channel`, `insert_client_customer`, `insert_client_channel_identity_link` RPCs, matching `Agent_Runtime_System_v1.md` Module 1 §B's "match by contact method" design) — assembled them into a real find-or-create chain: `Find Customer By Channel (RPC)` (channel_type `chat_session`, channel_value = the incoming `customer_id`) → `Customer Found?` → found: use directly; not found: `Create Customer (RPC)` → `Link Customer Channel (RPC)` → both paths converge at `Resolve Customer ID` (Code node) → real UUID feeds `Insert Lead (RPC)`. Old dead nodes removed. **Also fixed in the same pass:** `Validate Input`'s `source_channel` enum had been live-edited to accept `web_chat` (an attempt to match Convocore's own raw channel value) — the real `public.source_channel_enum` only accepts `website`/`whatsapp`/`instagram`/`facebook`/`email`/`sms`; reverted to the real DB enum after the edited version caused a live `invalid input value for enum` failure on the very next test. Convocore's Carmelli build must send the literal string `"website"`, never its own `channel` system variable value.

**STEP 0 AUDIT:** confirmed live via `search_workflows` — the only existing "WF-001" in the n8n instance is `WF-001 — LEAD CREATION ENGINE` (`RJwCyNXEp4HM83il`), inactive, `availableInMCP: false`, part of the pre-rebuild legacy series (Workflow Registry's "Legacy" section) — genuinely unrelated to this current-architecture build, confirmed before building.

**REAL BUGS FOUND + FIXED WHILE BUILDING/TESTING THIS WORKFLOW (BC-029):**
1. An `IF` node condition combining a boolean `"true"` operator with an explicit `rightValue: ''` throws `NodeOperationError` (strict type validation tries to coerce `''` to boolean) — WF-013's identical-looking IF nodes omit `rightValue` entirely for this operator; matched that working shape on all 3 boolean IF nodes here.
2. `retryOnFail` + `onError: continueErrorOutput` together do NOT route a retry-exhausted failure to the node's error output pin (index 1) — it lands on the regular output pin (index 0) as an item carrying an `.error` field instead. Fixed by adding an explicit `Insert Succeeded?` IF node checking for a real `lead_id` after the main pin, rather than relying on the second pin (kept as a defensive fallback connection).
3. `client_test_001_acme_emergency_test.leads` was missing migration 028's `convocore_*` columns entirely — a real schema-provisioning drift (that client schema was created before the migration ran and was never back-filled). Fixed via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
4. `client_test_001_acme_emergency_test.escalations` was missing migration 032's `escalation_team` column — same drift class as #3. Fixed the same way.
5. BC-028's 10-arg `insert_client_escalation` overload made every 9-arg call (i.e. every real call WF-017 itself makes) ambiguous to PostgREST (`PGRST203`) — see WF-017's own entry above for full detail. Fixed by dropping the redundant 9-arg overload.
6. Setting `options.response.response.responseFormat: 'json'` explicitly on the `Route To Human Handoff (WF-017)` HTTP node caused a real internal n8n crash (`Cannot read properties of undefined (reading 'data')`) — reverted to no explicit `responseFormat`, matching WF-013's already-proven pattern exactly. The `handoff` echo field in WF-001's own Pattern-D response is consequently sparse (`{}`) rather than carrying WF-017's `escalation_id` back — a real, minor, shared cosmetic gap also true of WF-013/WF-016, not fixed here (their scope, not this card's).

**REAL NEW DB OBJECTS (BC-029):** `public.insert_client_lead` (RPC, with built-in duplicate detection), `public.client_customer_exists` (RPC, security check), plus the schema-drift and overload fixes above (all applied directly via Supabase migrations, not workflow logic touching schema).

**LAST VERIFIED:** BC-029, 2026-08-06 — all 5 required test categories genuinely executed against real production data (not simulated/assumed):
- Success: real `leads` row confirmed via direct SQL (`294e9af5-...` final clean run; `b602285b-...` initial).
- Failure (missing `customer_id`): real `VALIDATION_ERROR` response, no DB call made.
- Security (cross-client `customer_id` — Client B's real customer against Client A's schema): real `CUSTOMER_NOT_FOUND` rejection, confirmed no row was ever at risk of being created (FK-backed).
- Retry (forced 1ms client-side timeout to genuinely simulate a Supabase timeout): confirmed one real silent retry (~1s = one `waitBetweenTries`), then genuine Pattern D handoff — real escalation `6e7c768f-...` confirmed via direct SQL, real `escalation_id` returned in the response.
- Duplicate (same `conversation_id` sent twice): confirmed via direct SQL — exactly 1 row exists for `test-conv-success-002`, both calls returned the identical `lead_id`.

**RE-VERIFIED BC-071 (2026-08-17):** find-or-create customer resolution tested both branches live against real Carmelli data (`client_carmelli_bakery`), test rows cleaned up after: (1) not-found path — execution `30872`, fresh channel value `test_chat_session_qa_001` correctly returned `{found:false}`, correctly created a real customer (`4fdd05e5-...`) + real channel link, correctly resolved and reached `Insert Lead` (which then correctly failed on the stale `web_chat` enum bug, confirming the enum fix was needed for real, not theoretical); (2) found path + full success — execution `30876`, same channel value now correctly matched the existing customer, resolved the same UUID, and `Insert Lead` succeeded for real with `source_channel: "website"` (real lead `6c52b2c6-...`, `duplicate: false`). All 3 test rows (`leads`, `channel_identity_links`, `customers`) deleted after verification — no residue left in Carmelli's real schema.

**FIXED BC-071 PART 2 (2026-08-17, same day — platform-wide `source_channel` enum rename):** the `web_chat` value from the previous fix was itself wrong — a live-edited guess, not Convocore's real value. Human confirmed via their own original raw webhook capture that Convocore's real `channel` system variable sends `web-chat` (hyphen). Rather than keep instructing the Convocore agent's LLM to override `source_channel` with a hardcoded literal (`website`) that never matched reality, made the platform-wide fix instead: `ALTER TYPE public.source_channel_enum RENAME VALUE 'website' TO 'web-chat'` — live-verified 25 existing rows across the test roster (5 clients) migrated automatically with zero data loss, no rows dropped or reinterpreted. `Validate Input`'s JS enum array updated to match (`web-chat` replacing both the original `website` and the incorrect intermediate `web_chat`). **Re-tested end to end** with the real value (execution `30978`) — full success, real lead `b910001c-...` created, cleaned up after. **Published to production** (active version `90491bc2-d4c3-488e-b389-45fcf15b099b`). Also fixed the one stale `"website"` example in `INTEGRATION_CONTRACT_v1.md` Part 20.1. No other RPC or workflow referenced the literal string `website` (confirmed via `pg_proc` source search before the rename).

---

## Conversion Engine — Tools (Part 13, Phase 8a — BC-031)

**Test roster note:** `client_test_002_acme_commerce_test` (commerce_ecom, real WooCommerce + Calendly connections) was used for CreateCart/CreateReservation/CreateWaitlistEntry testing — its schema supports both `commerce_ecom` and `commerce_restaurant` sub-archetypes (both share `tpl_commerce`, confirmed live), so no separate restaurant client was needed. A new roster client, `client_test_003_acme_appointment_test` (client_id `2d0fafb6-72c8-4751-a7c0-cc77cf743807`), was created for CreateAppointment/CreateBookingRequest testing — no appointment-archetype client existed before this card. Neither new client has a real connected Google Calendar or a functioning ecommerce store (the roster's only "connected" WooCommerce store, `zenny-woocom.free.je`, returns non-JSON responses to real API calls, and the roster's only Calendly connection has `status='error'`) — this is a real, external infrastructure limitation, not a gap in the workflows themselves; every Tool's resilient fallback path was proven genuinely real as a direct result.

### WF-002 — Zenny Conversion Engine - CheckAvailability (WF-002)
**n8n ID:** `I3wMoqjH5uoc6hvN` · **published**, active

**PURPOSE:** Read-only availability check, no idempotency (per Part 13.2). v1 scope is `inventory`/`table_slot`/`calendar` only — `team`/`specialist`/`capacity` (Emergency/Consultation/Engagement) are explicitly v2 (Part 7.3, verified directly): those archetypes route through the `dashboard_request` config fallback at the calling workflow instead of ever calling this sub-type.

**TRIGGER:** Webhook, `POST /check-availability`.

**INPUT:** `{ client_id, payload: { customer_id, archetype, check_type: 'inventory'|'table_slot'|'calendar', reference } }`. `table_slot` and `calendar` both resolve via the `calendar`-category connection (no separate reservation-provider category exists in the credential platform — a mechanical, not novel, mapping).

**OUTPUT / END STATE:**
- `check_type` is `team`/`specialist`/`capacity` or otherwise unsupported, or `reference` missing: 400 `VALIDATION_ERROR`.
- Unknown `client_id`: 400 `UNKNOWN_CLIENT`.
- Real Provider Router pattern (matching the `Provider Router Example` template): resolves the relevant credential via UTIL-006, routes by real `provider` (Shopify/WooCommerce for inventory; Google/Calendly/Cal.com for calendar), and calls that provider's real API. Success or provider/credential failure both return 200 `{ result: { available, alternatives: [] } }` — never an error, per the B→C fallback chain (graceful, never a handoff).

**REAL DEPENDENCIES:** UTIL-001, UTIL-006 (both `ecommerce` and `calendar` categories).

**FIXED BC-031:** see UTIL-006's own entry above — this Tool's first-ever real calls against non-Google connections surfaced 2 real UTIL-006/Tool Execution Fallback bugs, both fixed. Also fixed live in this workflow itself: the same `retryOnFail`+`continueErrorOutput` quirk documented in WF-001/WF-002's sibling Tools (a retry-exhausted failure lands on the main pin as an `{error,...}` item, not the error pin) — all 5 provider-response `Normalize` nodes now check for `$json.error` explicitly before calling array methods, which previously evaluated silently to `null` instead of `false`.

**LAST VERIFIED:** BC-031, 2026-08-06 — real credential resolution and real external API calls confirmed against the real WooCommerce store and the real (errored) Calendly connection (both correctly degrade to `available:false` per their genuine real state, not simulated). Failure (invalid/v2 check_type, missing reference), Security (unknown client), and Retry (forced 1ms timeout on the WooCommerce call, confirmed silent retry then graceful degradation) all genuinely tested. Duplicate is N/A (read-only, per spec).

---

### WF-005 — Zenny Conversion Engine - CreateCart (WF-005)
**n8n ID:** `PlsVixbrW0M1oH0S` · **published**, active

**PURPOSE:** Ecom Mode A cart creation. Per the hard product rule (External_Integration_Strategy_v1.md Part 6.1), this NEVER writes to the client's live store directly — it writes to Zenny's own `orders` table (`status='pending_review'`), pending business-dashboard approval.

**TRIGGER:** Webhook, `POST /create-cart`.

**INPUT:** `{ client_id, payload: { customer_id, lead_id, items: [{product_id, quantity}] } }`. `lead_id` added to the documented payload this session — see the self-resolved document-level item logged in PROJECT_STATE.md.

**OUTPUT / END STATE:**
- Real stock check via a direct HTTP call to WF-002 (`check_type: inventory`, first item's `product_id`) before any write is attempted.
- Real cart-value escalation check against the new `control.client_config.cart_value_escalation_threshold` field (added this session — previously specified in the Runtime doc but never actually added to the schema). `cart_value` is currently always `0.00` — real per-item pricing requires a live commerce catalog price feed not yet built (a real, disclosed v1 gap, not hidden) — the threshold-gate logic itself is complete and correct, just not exercisable with a non-zero value today.
- Success: 200 `{ result: { cart_id, cart_value, checkout_link } }` — a real `conversions`+`conversions_ecom`+`orders` row set, with real duplicate detection (checks by `lead_id` first).
- Stock unavailable, threshold exceeded, or insert failure (after Pattern B retry): Mode C — 200 `{ result: { status: "pending_human_review" }, handoff }`, a real `escalations` row created via WF-017.

**REAL DEPENDENCIES:** UTIL-001, WF-002 (direct HTTP call), WF-017 (direct HTTP call).

**REAL NEW DB OBJECTS:** `public.insert_client_cart` RPC (real duplicate detection via a partial `UNIQUE(lead_id)` index), `public.get_client_conversion_config` RPC.

**LAST VERIFIED:** BC-031, 2026-08-06 — Failure (empty `items`) and Security (cross-client `customer_id`) tested directly against the real stock-check gate. Because the roster's only WooCommerce connection is a non-functional test store (confirmed via WF-002 testing), Success/Retry/Duplicate required a temporary, explicitly-logged bypass of the real stock-check IF condition to reach and prove the real Insert Cart logic — the RPC's real duplicate-detection and insert behavior was ALSO independently confirmed via direct SQL (a genuine INSERT then a genuine no-op on repeat, exactly 1 row). The Mode C escalation path (stock unavailable) is fully real and was the outcome of every un-bypassed test, since the connected store never returns a usable response.

---

### WF-006 — Zenny Conversion Engine - CreateReservation (WF-006)
**n8n ID:** `qA0HJV1YSJT5QNDp` · **published**, active

**PURPOSE:** Restaurant Mode A reservation. Party size ≥10 routes to a real event/catering human handoff (Mode C), never a silent decline. Time-in-the-past requests are rejected as a validation error (correction flow). Real parallel-write pattern identical to CreateAppointment (§13.3): attempts the client's real calendar/booking system first, always keeps `our_db_fallback` as the resilient record if that fails.

**TRIGGER:** Webhook, `POST /create-reservation`.

**INPUT:** `{ client_id, payload: { customer_id, lead_id, party_size, reservation_time, special_request? } }`. `lead_id` added to the documented payload this session (same gap as CreateCart).

**OUTPUT / END STATE:**
- Party size ≥10: 200, Mode C human handoff (`escalation_priority: P3`, "event/catering inquiry" reasoning).
- Real calendar credential resolved (UTIL-006, category `calendar`); Google provider gets a real `events.insert` write attempt (Pattern B retry). Success → 200 `authoritative_source: "client_calendar"`. Failure, non-Google provider, or no connection → real `our_db_fallback` write (`conversions`+`conversions_restaurant`+`appointments` tracking row, `alert_fired: true`) → 200 `authoritative_source: "our_db_fallback"`, `table_confirmed: true`.
- **Real waitlist redirect:** if no calendar credential is available AND `control.client_config.waitlist_enabled` is `true` (new field, this session), routes directly to WF-007 CreateWaitlistEntry instead of `our_db_fallback` — 200 `authoritative_source: "waitlist"`.
- If even `our_db_fallback` fails after retry: Mode C human handoff.

**REAL DEPENDENCIES:** UTIL-001, UTIL-006 (`calendar`), WF-007 (direct HTTP call, waitlist redirect), WF-017 (direct HTTP call).

**REAL NEW DB OBJECTS:** `public.insert_client_reservation` RPC (real duplicate detection via `lead_id`), `public.insert_client_appointment_tracking` RPC (shared with WF-003).

**FIXED BC-031 (real bug found via the Duplicate test):** a repeat call for an already-existing conversion still attempted a fresh `appointments` tracking-row insert, hitting the real `appointments_conversion_id_key` UNIQUE constraint with no error handling — the whole execution crashed with no response ever sent. Added an explicit `Is Duplicate?` check that skips straight to the success response instead. Also fixed a real schema-drift gap: `client_test_002_acme_commerce_test` was missing the entire `conversions_restaurant` table (present on `tpl_commerce` but never back-filled to this already-provisioned client schema).

**LAST VERIFIED:** BC-031, 2026-08-06 — all 5 categories genuinely tested: Success/Duplicate (real `our_db_fallback` writes, same `reservation_id` returned twice, confirmed via SQL), Failure (past-time correction), Security (cross-client `customer_id`), Retry (forced 1ms timeout, confirmed Mode C fallback), and — per the card's explicit requirement — **the real WF-006→WF-007 waitlist handoff chain end-to-end** (`waitlist_enabled` toggled true on the real roster client, confirmed a real `waitlist_entries` row created via WF-007 with the correct queue `position`, then reverted).

---

### WF-007 — Zenny Conversion Engine - CreateWaitlistEntry (WF-007)
**n8n ID:** `8sZ8yiY228KaPyy3` · **published**, active

**PURPOSE:** Mode B sub-type fallback of CreateReservation (also callable as its own Tool). Fallback chain C→D — this workflow IS the "C" (graceful redirect) destination for CreateReservation; if creating the waitlist entry itself fails, that's Pattern D (warm handoff).

**TRIGGER:** Webhook, `POST /create-waitlist-entry`.

**INPUT:** `{ client_id, payload: { customer_id, lead_id, party_size, requested_time } }`. `lead_id` added to the documented payload this session (same gap as CreateCart/CreateReservation).

**OUTPUT / END STATE:**
- Success: 200 `{ result: { waitlist_id, position } }` — a real new `waitlist_entries` row (new table this session — no home existed anywhere in the schema before), `position` computed as a genuine live count of currently-waiting entries + 1. Real duplicate detection via a partial `UNIQUE(lead_id)` index (same `lead_id` returns the same `waitlist_id`, no second row).
- Insert failure after Pattern B retry: Pattern D — 200 `{ result: { status: "pending_human_review" }, handoff }`, real escalation via WF-017.

**REAL DEPENDENCIES:** UTIL-001, WF-017 (direct HTTP call). Also called directly BY WF-006 (its Mode B redirect target).

**REAL NEW DB OBJECTS:** `public.waitlist_entries` table (new, deployed to both roster clients + `tpl_commerce`), `public.insert_client_waitlist_entry` RPC.

**LAST VERIFIED:** BC-031, 2026-08-06 — all 5 categories genuinely tested as a standalone Tool (Success, Duplicate, Failure, Security, Retry — real escalation confirmed on forced timeout), plus confirmed working as WF-006's real redirect target (see WF-006's entry).

---

### WF-003 — Zenny Conversion Engine - CreateAppointment (WF-003)
**n8n ID:** `3sLUvbCxVqNGsPHw` · **published**, active

**PURPOSE:** The Tool Appointments (5C) has been waiting on since BC-017 — real parallel-write pattern (Phase 5C, CR applied BC-013): writes to the client's real calendar AND `appointments` in the same operation, never sequentially. The most consequential Tool in this batch — once live, 5C stops monitoring seeded data and starts showing real bookings (once a client has a real connected calendar; none currently do — see roster note above).

**TRIGGER:** Webhook, `POST /create-appointment`.

**INPUT:** `{ client_id, payload: { customer_id, lead_id, service, preferred_date, preferred_time } }`. Time-in-the-past requests are rejected (correction flow), matching CreateReservation.

**OUTPUT / END STATE:**
- Real calendar credential resolved (UTIL-006, `calendar` category); Google gets a real `events.insert` attempt (Pattern B retry). Success → 200 `{ result: { appointment_id, calendar_event_id, client_calendar_write_status: "success", our_db_write_status: "success", authoritative_source: "client_calendar", status: "confirmed" } }` — a real parallel write (`conversions`+`conversions_appointment`+`appointments` tracking row, both legs in the same operation).
- Calendar write fails, non-Google provider, or no connection: real `our_db_fallback` (`alert_fired: true`) → 200, `authoritative_source: "our_db_fallback"`, `status: "pending_review"` — nothing silently lost, matching Part 13.3 exactly.
- If even the fallback write fails after retry: Pattern D — 200 `{ result: { appointment_id: null, status: "pending_human_review" }, handoff }`.

**REAL DEPENDENCIES:** UTIL-001, UTIL-006 (`calendar`), WF-017 (direct HTTP call).

**REAL NEW DB OBJECTS:** `public.insert_client_appointment_conversion` RPC (shared with WF-004, real duplicate detection via `lead_id`), `public.insert_client_appointment_tracking` RPC (shared with WF-006).

**FIXED BC-031 (2 real, previously-undiscovered shared-utility bugs — this Tool was the first-ever real caller against a client with ZERO client_connections rows for any category):** see Tool Execution Fallback's own entry above for the "no connection row at all" crash (root-caused and fixed here). Also applied the same `Is Duplicate?` fix as WF-006 to avoid the identical tracking-row UNIQUE-constraint crash on a repeat call.

**LAST VERIFIED:** BC-031, 2026-08-06 — all 5 categories genuinely tested against the new `client_test_003_acme_appointment_test` roster client (created this session, no prior calendar connection): Success/Duplicate (real `our_db_fallback` writes, same `appointment_id` returned twice, confirmed via SQL), Failure (past-time correction), Security (cross-client `customer_id`), Retry (forced 1ms timeout, confirmed Pattern D fallback with a real escalation). The `client_calendar` success path (real Google Calendar write) is coded and follows the exact proven Provider Router pattern, but could not be live-tested — no roster client has a real connected Google Calendar (a genuine, stated external blocker, not a gap in this workflow).

---

### WF-004 — Zenny Conversion Engine - CreateBookingRequest (WF-004)
**n8n ID:** `YAVs2qc35DZcV4rp` · **published**, active

**PURPOSE:** Mode B sub-type — always routes to human confirmation, no calendar write ever attempted (payload may be genuinely partial). Simplest of the 6 Tools in this batch.

**TRIGGER:** Webhook, `POST /create-booking-request`.

**INPUT:** `{ client_id, payload: { customer_id, lead_id, service?, preferred_date?, preferred_time? } }` — `service`/date/time all genuinely optional per Part 13.4.

**OUTPUT / END STATE:**
- Success: 200 `{ result: { booking_request_id, status: "pending_human_confirmation" } }` — real `conversions`+`conversions_appointment` row (`conversion_mode: 'B'`, `external_action_status: 'not_attempted'`), real duplicate detection via `lead_id`.
- Insert failure after Pattern B retry: Pattern D — 200 `{ result: { booking_request_id: null, status: "pending_human_review" }, handoff }`.

**REAL DEPENDENCIES:** UTIL-001, WF-017 (direct HTTP call).

**FIXED BC-031 (2 real schema gaps found live via the Success test):** `conversions_appointment.service_type` and `.appointment_time` were both `NOT NULL` everywhere, despite Part 13.4 explicitly documenting both as optional for this exact Tool — the column had only ever been exercised by CreateAppointment (where both are required) until this session's real test. Both relaxed to nullable across `public`, `tpl_appointment`, and the real client schema.

**LAST VERIFIED:** BC-031, 2026-08-06 — all 5 categories genuinely tested with a real partial payload (no `service`/date/time at all): Success/Duplicate (real row confirmed, same `booking_request_id` returned twice), Failure (missing `lead_id`), Security (cross-client `customer_id`), Retry (forced 1ms timeout, confirmed Pattern D fallback with a real escalation).

---

## Conversion Engine — Tools (Part 13, Phase 8b — BC-034)

**Test roster note:** two new roster clients created this session — `client_test_004_acme_consultation_test` (`e5f6a7b8-0001-4c1d-9e2a-000000000004`, consultation) and `client_test_005_acme_engagement_test` (`e5f6a7b8-0001-4c1d-9e2a-000000000005`, engagement) — neither archetype had a test client before. Neither has a real connected calendar (same known external limitation as BC-031's roster), so WF-009/WF-010's `client_calendar` success leg is coded/wired per the proven Provider Router pattern but not live-exercised, same disclosed gap as WF-003/WF-006.

**Real infra bugs found and fixed while testing (not pre-existing workflow bugs — genuine first-ever exercise of these paths):**
1. `create_client_schema_from_template`'s hardcoded common-tables list omitted `appointments` entirely, even though it's real deployed infrastructure (BC-013) used by every calendar-parallel-write Tool — silently produced 3 broken client schemas (`client_test_001`, and the 2 new ones) missing the table. Fixed the function itself (conditional clone: only when the source `tpl_*` template actually has it — `tpl_engagement` genuinely doesn't, Engagement has no calendar-booking Tool) so all future onboarding is correct, plus manually retrofitted the 2 affected existing/new client schemas (`client_test_001`, `client_test_004`) via the established `CREATE TABLE ... LIKE ... INCLUDING ALL` + FK + RLS + grant-revoke pattern.
2. `conversions.lead_id` has a real system-wide `UNIQUE` constraint (one conversion per lead, ever) that `insert_client_conversion_record`'s original duplicate check didn't respect (it scoped by `(lead_id, conversion_type)` instead) — a real INSERT hit the constraint and crashed instead of gracefully returning the existing row. Fixed the RPC's duplicate check to lead_id-only, matching every other Tool's established pattern.
3. WF-008's success response read `dispatch_window`/`status` from the wrong node (`$json` instead of `$('Determine Booking Mode')`), silently dropping `estimated_callback_window` from every real response — found via the first live Success test, fixed and re-verified.

**Self-resolved document-level items (same class as BC-031's `lead_id` gap, logged in `Wiki/log.md`):**
- WF-008/WF-009/WF-010's documented payloads (Part 13.8/13.9/13.10) omit `lead_id` despite their idempotency keys requiring it — added, matching WF-011 (already correct) and the BC-031 precedent.
- `conversions_emergency.location`/`.dispatch_window` were `NOT NULL`, correct for WF-008 (dispatch) but meaningless for WF-009 (inspection) — relaxed to nullable, added `urgency_level`/`issue_description` columns (needed by both Tools' payloads, previously missing entirely).
- `conversions_engagement` was missing `amount` (WF-011's donate `amount` field, documented in `Agent_Runtime_System_v1.md`'s Donate flow but never added to the schema doc).
- Base `conversions` table was missing `conversion_type`/`value`/`archetype_specific_fields` (WF-012's generic, cross-archetype payload — added to the base table since RecordConversion isn't archetype-locked, same placement logic as the table's other generic fields).
- Consultation Score Gate threshold (WF-010) verified against the live `Agent_Runtime_System_v1.md` Module 3 §3 ("hard gate: score ≥ 50"), not the spec's own "old build guide — re-verify" reference-only note — confirmed identical, no conflict.

### WF-008 — Zenny Conversion Engine - CreateCallbackQueueEntry (WF-008)
**n8n ID:** `PvzY7qyi8ccBPyRp` · **published**, active

**PURPOSE:** Emergency Mode A (dispatch/callback queue). Single write to `conversions`+`conversions_emergency`. `status` driven by `client_config.archetype_settings.emergency.emergency_booking_mode` (JSONB, same INT-003-style pattern as `freedom_level_override`) — `"direct_calendar"` → `confirmed`, missing/anything else → `pending_review` (v1-safe default per spec).

**TRIGGER:** Webhook, `POST /create-callback-queue-entry`.

**INPUT:** `{ client_id, payload: { customer_id, lead_id, location, urgency_level, issue_description } }`.

**OUTPUT / END STATE:**
- Success: 200 `{ result: { queue_entry_id, estimated_callback_window, status } }` — `estimated_callback_window` is a business-display string derived from `urgency_level` (critical→"within 1 hour", high→"within 2 hours", else→"within 4 hours"), not itself a stored/configured field (no such config exists in any doc).
- Insert failure after Pattern B retry: Pattern D — 200 `{ result: { queue_entry_id: null, status: "pending_human_review" }, handoff }`.

**REAL DEPENDENCIES:** UTIL-001, WF-017 (direct HTTP call).

**REAL NEW DB OBJECTS:** `public.insert_client_callback_queue_entry` RPC.

**LAST VERIFIED:** BC-034, 2026-08-10 — Success (real row + correct `estimated_callback_window` after the fix above), Duplicate (same `queue_entry_id` returned twice), Failure (missing `location`), Security (cross-client `customer_id`) all genuinely tested against `client_test_001_acme_emergency_test`. Retry not forced-tested this session (time-scoped, structurally identical `retryOnFail`/`onError` config to every proven sibling Tool).

---

### WF-009 — Zenny Conversion Engine - CreateInspectionSlotBooking (WF-009)
**n8n ID:** `GMwddv6AJKx0hes6` · **published**, active

**PURPOSE:** Emergency Mode B (non-emergency/quote branch, inspection booking). Real parallel-write pattern identical to CreateAppointment (§13.3): client calendar first, `our_db_fallback` (writes `conversions`+`conversions_emergency`+`appointments` tracking row) if that fails or is unavailable.

**TRIGGER:** Webhook, `POST /create-inspection-slot-booking`.

**INPUT:** `{ client_id, payload: { customer_id, lead_id, preferred_date, preferred_time, issue_description } }`. Time-in-the-past rejected (correction flow, same as CreateAppointment).

**OUTPUT / END STATE:** Same 3-outcome shape as CreateAppointment (`client_calendar` success / `our_db_fallback` / Pattern D), `result.inspection_slot_id` = the conversion's own id (matches CreateAppointment's `appointment_id` naming convention).

**REAL DEPENDENCIES:** UTIL-001, UTIL-006 (`calendar`), WF-017.

**REAL NEW DB OBJECTS:** `public.insert_client_inspection_slot_conversion` RPC (shares `insert_client_appointment_tracking` with WF-003/WF-006/WF-010).

**LAST VERIFIED:** BC-034, 2026-08-10 — Success (real `our_db_fallback` write, no calendar connected — same disclosed external limitation as every prior calendar-integrated Tool), Duplicate (same `inspection_slot_id` returned twice), Failure (past-time correction), Security (cross-client `customer_id`) all genuinely tested against `client_test_001_acme_emergency_test`, after retrofitting that client's missing `appointments` table (see infra bugs above). Retry/calendar-write-failure path not forced-tested this session (time-scoped).

---

### WF-010 — Zenny Conversion Engine - CreateScoredBooking (WF-010)
**n8n ID:** `pxi9BKZcJxLoryIJ` · **published**, active

**PURPOSE:** Consultation Score Gate (hard gate, score ≥ 50, verified live against `Agent_Runtime_System_v1.md` Module 3 §3) + real parallel-write pattern (client calendar + `conversions_consultation`+`appointments` tracking, same as CreateAppointment).

**TRIGGER:** Webhook, `POST /create-scored-booking`.

**INPUT:** `{ client_id, payload: { customer_id, lead_id, lead_score, service_type, preferred_date, preferred_time } }`. `lead_score < 50` is a validation-style rejection (400 `VALIDATION_ERROR`), not a silent fallback — Score Gate is this Tool's own caller's responsibility (Growth Agent), but a call that violates the hard gate is rejected explicitly rather than booked anyway.

**OUTPUT / END STATE:** Same 3-outcome shape as CreateAppointment, `result.opportunity_score` echoes the input `lead_score`.

**REAL DEPENDENCIES:** UTIL-001, UTIL-006 (`calendar`), WF-017.

**REAL NEW DB OBJECTS:** `public.insert_client_scored_booking_conversion` RPC (shares `insert_client_appointment_tracking`).

**LAST VERIFIED:** BC-034, 2026-08-10 — Success (real `our_db_fallback` write, no calendar connected), Duplicate (same `booking_id` returned twice), Score Gate rejection (`lead_score: 20` → 400), Security (cross-client `customer_id`) all genuinely tested against the new `client_test_004_acme_consultation_test`. Retry/calendar-write-failure path not forced-tested this session (time-scoped).

---

### WF-011 — Zenny Conversion Engine - CreateRegistration (WF-011)
**n8n ID:** `tTCZpPDibffG95dG` · **published**, active

**PURPOSE:** Engagement Mode A direct registration (donate/volunteer/attend). Single write to `conversions`+`conversions_engagement`. Donate always `confirmed`; volunteer/attend gated by `client_config.archetype_settings.engagement.engagement_capacity_check_mode` (same JSONB pattern as WF-008's emergency gating), v1-safe default `pending_review`.

**TRIGGER:** Webhook, `POST /create-registration`.

**INPUT:** `{ client_id, payload: { customer_id, lead_id, registration_type, program_id, amount } }`.

**OUTPUT / END STATE:** Success: 200 `{ result: { registration_id, status } }`. Insert failure after retry: Pattern D.

**REAL DEPENDENCIES:** UTIL-001, WF-017.

**REAL NEW DB OBJECTS:** `public.insert_client_registration` RPC.

**LAST VERIFIED:** BC-034, 2026-08-10 — Success/Duplicate (donate, always `confirmed`, same `registration_id` twice), volunteer (config-gated branch, correctly `pending_review` on the v1-safe default), Failure (invalid `registration_type`), Security (cross-client `customer_id`) all genuinely tested against the new `client_test_005_acme_engagement_test`.

---

### WF-012 — Zenny Conversion Engine - RecordConversion (WF-012)
**n8n ID:** `IJo7Nkdu5xlh3kgo` · **published**, active

**PURPOSE:** Generic, cross-archetype conversion logger — the only Tool with no archetype-locked extension table and no `customer_id` in its contract (payload keys directly off `lead_id`, per spec). Single write to the base `conversions` table only.

**TRIGGER:** Webhook, `POST /record-conversion`.

**INPUT:** `{ client_id, payload: { lead_id, conversion_type, value, archetype_specific_fields } }`.

**OUTPUT / END STATE:** Success: 200 `{ result: { conversion_id, status: "confirmed" } }`. Insert failure/duplicate-on-already-consumed-lead after retry: Pattern D, with `customer_id: null` in the handoff payload (this Tool genuinely has no customer_id to pass — a real, expected quirk unique to this Tool, not a bug).

**REAL DEPENDENCIES:** UTIL-001, WF-017.

**REAL NEW DB OBJECTS:** `public.insert_client_conversion_record` RPC.

**FIXED BC-034 (real bug, see infra bugs above):** duplicate check originally scoped to `(lead_id, conversion_type)`, missing the real system-wide `UNIQUE(lead_id)` constraint on `conversions` — fixed to lead_id-only.

**CONVERSION STOPS ACTIVE RECOVERY (BC-042, 2026-08-11):** closes the real gap where a converted lead could keep receiving automated recovery emails — `RecordConversion` never touched `recovery_queue` before this. `insert_client_conversion_record` now also runs `UPDATE recovery_queue SET status='completed' WHERE lead_id=$1 AND status='active'` in the same atomic function call, right after the conversion insert (only on a genuine new conversion — the existing duplicate-check early-return is unchanged, so a duplicate call never re-touches `recovery_queue`). Reuses WF-018's existing `status==='active'` eligibility gate — **no new column, no WF-018 change was needed or made.** No n8n node added to WF-012 either; the RPC itself is where the fix lives.

**LAST VERIFIED:** BC-034, 2026-08-10 — Success/Duplicate (real row, same `conversion_id` returned twice against a fresh lead), Failure (missing `conversion_type`), Security/Unknown-client (bad `client_id`) all genuinely tested. **BC-042, 2026-08-11** — real RPC call against a pre-existing real `active` `recovery_queue` row (`client_test_002_acme_commerce_test`, lead `b1c2d3e4-...-098`): conversion inserted (`duplicate:false`), `recovery_queue.status` confirmed flipped `active → completed` immediately after. Test data reverted afterward (conversion row deleted, `recovery_queue.status` restored to `active`) — no permanent change to pre-existing test fixtures.

---

## Recovery Engine — Tools (Part 13, Phase 9 kickoff — BC-036)

### WF-018 — Zenny Recovery Engine - SendRecoveryMessage (WF-018)
**n8n ID:** `wdRY4sD6Z8JZ06zr` · **published**, active

**PURPOSE:** Sends one recovery-cadence step message to a lead. **Scope cut (BC-036, explicit user instruction):** email channel only — `sms`/`whatsapp` are rejected as a clean `VALIDATION_ERROR`, not built out. Gates on: UTIL-005 Stop Checker (suppression, mandatory per spec Part 6.5), `recovery_queue.status = 'active'`, and `recovery_queue.current_step` matching the requested `step_number` — this step-match check IS the idempotency guard (Integration Contract Part 11.4's "database is the final guarantee" philosophy — no separate dedupe table). Holds (does not send, does not advance state) outside the client's active-hours window before building the message and reaching Gmail — Emergency archetype step 1 is exempt, matching Recovery_Engine_Flow.md §3.1.

**PER-CLIENT ACTIVE HOURS (BC-041, 2026-08-11):** `Time Window Check` no longer hardcodes UTC 8am–8pm. A new `Get Client Active Hours` node (HTTP GET, `control.clients?select=active_hours_start_utc,active_hours_end_utc&client_id=eq...`) reads two new `control.clients` columns — `active_hours_start_utc smallint` (0–23), `active_hours_end_utc smallint` (1–24), both defaulting to `8`/`20` (= the exact prior hardcoded values, zero behavior change for the current roster until a client's row is explicitly changed). `start=0, end=24` means always-on. If the fetch fails or returns non-integer fields, `Time Window Check` defensively falls back to `8`/`20` in code — same defaults, so failure mode matches pre-BC-041 behavior exactly. Still UTC-hour based, not true per-client *timezone* — that remains open, see Known Limitation below.

**KNOWN LIMITATION, disclosed not hidden:** no per-client timezone column exists anywhere in the schema yet (checked live + against `Database_Structure_v4_FINAL.md`) — `Time Window Check` uses UTC hours as an honest placeholder for "local" time, even though the *window itself* is now per-client (BC-041). Revisit when real timezone data is added to the platform.

**TRIGGER:** Webhook, `POST /send-recovery-message`.

**INPUT:** `{ client_id, payload: { lead_id, step_number, channel } }` — `channel` must be `"email"`.

**OUTPUT / END STATE:**
- Success: 200 `{ result: { recovery_send_id, status: "sent" } }` (`recovery_send_id` is `recovery_queue.recovery_id` — no dedicated per-send log table exists, disclosed scope decision, not a gap to silently paper over).
- Ineligible (recovery not active / stale step): 200 `{ result: { status: "not_sent" }, reason }`.
- Suppressed: 200 `{ result: { status: "not_sent" }, reason: "suppressed_or_opted_out" }`.
- Held (outside window): 200 `{ result: { status: "held" }, reason: "outside_time_window" }`.
- Unknown lead: 404 `RECOVERY_RECORD_NOT_FOUND`.
- Invalid input (missing fields, unsupported channel): 400 `VALIDATION_ERROR`.
- Supabase/Gmail failure after Pattern B retry: Pattern D, real `escalations` row via WF-017.

**REAL DEPENDENCIES:** UTIL-001 (schema resolution), UTIL-005 (Stop Checker, mandatory), UTIL-006 (Credential Resolver, `category: 'email'` — resolves the client's live Google OAuth token, same mechanism as Calendar), WF-017 (direct HTTP POST to its production webhook, matching the WF-013/WF-016/WF-012 pattern — not an Execute Workflow node). Sends via the Gmail API directly (`gmail.googleapis.com/gmail/v1/users/me/messages/send`) using the bearer token UTIL-006 resolves — no native n8n Gmail credential involved, consistent with the platform's per-client multi-tenant OAuth design (one shared Zeromanual Google app, per-client tokens in Vault).

**REAL NEW DB OBJECTS:** `public.get_client_recovery_context` RPC (joins `recovery_queue`+`leads`+`customers`+`growth_handoff_payload`, SECURITY DEFINER, `SET search_path TO ''`, matches the `get_client_appointment_with_customer` pattern exactly). `public.advance_client_recovery_step` RPC (atomic `UPDATE ... WHERE current_step = $2 AND status = 'active' RETURNING ...` — the idempotency guard itself; returns `duplicate: true` without re-advancing when the step no longer matches, mirroring `insert_client_conversion_record`'s duplicate-flag style).

**FIXED LIVE (real bug, caught by `test_workflow`, not by inspection):** `Time Window Check`'s `const ctx = $json` read the immediate predecessor's output — but the immediate predecessor is `Check Suppression (UTIL-005)`, an Execute Workflow node whose output REPLACES `$json` with its own `{proceed, reason}` shape rather than merging upstream fields. This silently dropped `conversation_summary`/`selected_solution`/`contact_method`/`archetype`, and `Build Message` fell back to generic filler text as a result. Fixed by reading `$('Evaluate Eligibility').item.json` explicitly — documented as a fresh instance of the SDK's known "$json in branchy/sub-workflow-downstream workflows" pitfall.

**ALSO FIXED LIVE:** all 8 IF nodes originally carried `rightValue: ''` on boolean-`true`/string-`exists` operators, copied from a bad template — this throws a real `NodeOperationError` (`Wrong type: '' is a string but was expecting a boolean`), caught immediately by `test_workflow`. This is the exact quirk already on record in `Wiki/platform-quirks/n8n-node-behaviors.md` §3 — omit `rightValue` entirely for these operators; the fix here reused the documented pattern rather than rediscovering it.

**LAST VERIFIED:** BC-036, 2026-08-10 — genuinely live end-to-end, not `test_workflow`-pinned: Success (real Gmail send to a real inbox, `labelIds: ["SENT"]`, against `client_test_002_acme_commerce_test`, whose Client A connection is real and `connected` — confirmed via `control.client_connections`), Suppressed (real `suppression_records` row), Not Found (real `null` RPC response), Validation (missing `step_number` + unsupported `channel: 'sms'`), Duplicate/stale-step (re-called the already-advanced lead, correctly short-circuited with **no second email sent** — confirmed by absence of a `Send Gmail Message` run in that execution's data). Held/time-window logic verified by code inspection plus a live, correctly-computed `hour_utc` in every real run above; not separately exercised against an out-of-window clock this session.

**BC-041 VERIFIED, 2026-08-11 — `test_workflow`-pinned (no real client data or email touched):** execution 4379, `Get Client Active Hours` pinned to an empty object → defensive fallback to `8`/`20` correctly fired → `held:false` at real `hour_utc:19`, matching exactly what the old hardcoded logic would have produced (regression parity). Execution 4384, pinned to `{active_hours_start_utc:8, active_hours_end_utc:18}` (deliberately excludes hour 19) → `held:true`, correctly routed to `Respond - Held`, execution stopped before `Send Gmail Message` — proves the per-client override genuinely drives the decision, not just the default path. Real `control.clients` rows for all 5 roster clients confirmed at `8`/`20` post-migration (zero behavior change). Emergency-step-1 bypass logic untouched, not re-exercised this pass (already covered structurally — code path unchanged from BC-036).

**UPDATED BC-054, 2026-08-14 — max-steps enforcement (RPC-only, workflow itself unchanged):** `advance_client_recovery_step` (this workflow's own step-advance/idempotency RPC) now also flips `status` to `'stopped'` in the same atomic `UPDATE` the instant the new step reaches the client's effective max (`coalesce(control.clients.max_recovery_steps, control.archetype_recovery_defaults.max_steps)` — new lookup table seeded from `Recovery_Engine_Flow.md` §3, matching the exact stop condition documented in §6's StatusMap). Live-verified via 3 disposable Client B fixtures: a step-2→3 advance correctly stopped (max 3, emergency); a step-0→1 advance correctly stayed `active` (regression, below-max unaffected). All fixtures deleted after verification. Closes the Active Blocker flagged during BC-050. Full mechanism: `Wiki/platform-quirks/recovery-queue-sweep-design.md`.

---

## Email Manager — Tools & Internal Workflows (Part 13, Phase 10 — BC-043, BC-044, BC-045)

### WF-019 — Zenny Email Manager - SendEmailReply (WF-019)
**n8n ID:** `oi3a2qmyh1Q8K4PI` · **published**, active

**PURPOSE:** Generic, transactional email-send Tool — exclusive owner of `send-*` email tools per the Tool Naming Convention (`n8n_Execution_Architecture_v1.md` §7.5). Every module's outbound email (Conversion Engine confirmations, Recovery Engine cadence via WF-018 in future, this module's own future Draft Email sends) is meant to route through this one workflow rather than a direct provider call. No business decision lives here — categorization/autonomy-level logic belongs to INT-010/INT-011 (not yet built).

**IDEMPOTENCY:** Checks the client's `emails` row for `email_id` first (`get_email_record` RPC); if `email_status = 'sent'` already, short-circuits to the same success response without resending or touching Gmail. Real dedupe guard, not just documentation — matches the spec's stated idempotency key (`send-email-reply_{client_id}_{email_id}`) with an actual mechanism, mirroring WF-018's "database is the final guarantee" philosophy. Currently a near-always-no-op in practice (no `emails` rows exist yet until INT-009/010/011 are built) but is the correct real guard for when they do.

**TRIGGER:** Webhook, `POST /send-email-reply`.

**INPUT:** `{ client_id, payload: { email_id, recipient_email, subject, body } }`.

**OUTPUT / END STATE:**
- Success (including idempotent already-sent): 200 `{ result: { email_id, status: "sent" } }`.
- Suppressed: 200 `{ result: { email_id: null, status: "not_sent" }, reason: "suppressed_or_opted_out" }`.
- Invalid input (missing field / malformed `recipient_email`): 400 `VALIDATION_ERROR`.
- Unknown client: 400 `UNKNOWN_CLIENT`.
- Credential unavailable / Gmail send failure after Pattern B retry: Pattern D, real `escalations` row via WF-017 (direct HTTP POST to its production webhook, same pattern WF-018 uses).

**REAL DEPENDENCIES:** UTIL-001 (schema resolution), UTIL-005 (Stop Checker, mandatory per spec Part 6.9), UTIL-006 (Credential Resolver, `category: 'email'`), WF-017 (direct HTTP POST, not Execute Workflow). Sends via the Gmail API directly (`gmail.googleapis.com/gmail/v1/users/me/messages/send`) using the UTIL-006-resolved bearer token — no native n8n Gmail credential involved, same design as WF-018.

**REAL NEW DB OBJECTS:** `public.get_email_record(p_schema, p_email_id)` RPC (SECURITY DEFINER, `SET search_path TO ''`, returns `{found:false}` when no row exists). `public.update_email_send_result(p_schema, p_email_id, p_email_status, p_sent_content)` RPC (best-effort `UPDATE ... WHERE email_id = $3`, no-ops safely — `{email_id, updated:false}` — when no row exists yet; never flips the caller-facing response to an error, mirroring `advance_client_recovery_step`'s style). Both follow the same dynamic-SQL-per-schema convention as WF-018's RPCs.

**KNOWN GAP, disclosed not hidden:** bounce/delivery-status handling (Flow diagram's `BounceCheck` node) is NOT built here — Gmail's synchronous send response carries no bounce signal; real bounce detection needs an inbound event pipeline (INT-009 Sync Inbox), which doesn't exist yet. Flagged in-workflow via sticky note, not silently skipped.

**LAST VERIFIED:** BC-043, 2026-08-12 — `test_workflow`-pinned coverage: success (real UTIL-001/005/006 calls against Client A, `client_test_002_acme_commerce_test`, Gmail send pinned), validation error (missing `recipient_email`), idempotent already-sent short-circuit (confirmed `Send Gmail Message` never ran), suppressed (real temporary `suppression_records` row inserted/verified/reverted), credential-unavailable → Pattern D (real call against Client B, `client_test_001_acme_emergency_test`, no real connection), send-failure → Pattern D (pinned Gmail error). **Genuinely live, not pinned:** execution 7511 — real `get_email_record` RPC call (200, `found:false`), real Gmail send to Client A's connected account (`quaantummedia.zeromanual@gmail.com`, self-addressed test send, real message id `19ff6a3fbebe543b`, `labelIds: ["SENT"]`), real `update_email_send_result` RPC call (200, `updated:false` — correct no-op, no `emails` row exists yet). Confirms both RPC credential bindings and the Gmail send path work end-to-end against live infrastructure.

**RE-VERIFIED 2026-08-14 (credential reconnect check, pre-BC-054):** genuinely live, unpinned, execution 14532 against Client B (no real email connection, same repro shape BC-053 hit) — real `available:false` from UTIL-006 → real `Trigger Tool Execution Fallback` → real `Notify Human via UTIL-004` → real Gmail send via the just-reconnected `zenny-notification-sender` credential (`dUDWiqDs4C95gnLG`), real message id `19ffd2a904ae2bcf`, `labelIds:["SENT"]`. Confirms the human's OAuth reconnect actually took — this is the exact path that previously crashed with an uncaught error (see Active Blockers, now closed).

---

### INT-009 — Zenny Email Manager - SyncInbox (INT-009)
**n8n ID:** `PAGsoD5bbl5iru8d` · **published**, active (no production trigger — see Trigger)

**PURPOSE:** Internal (non-Tool) workflow per `n8n_Workflow_Specification_v1.md` Part 7.6 — pulls new inbound Gmail messages for a client since the last successful sync, normalizes them (sender/subject/body/thread-id/received-date). The intake step the rest of Email Manager (INT-010 Categorize Email onward) will consume. Never exposes a webhook, per the "child workflows never expose webhooks" convention.

**TRIGGER:** `executeWorkflowTrigger` only this card — no production trigger exists yet. SCH-003 (Sync Inbox Trigger, cron) is a separate later Build Card that will wire the real cadence; until then this workflow is only reachable via a manual Execute Workflow call or MCP `execute_workflow`/`test_workflow` (the latter only with pinned, not live, data — see Last Verified).

**INPUT:** `{ client_id }` (Execute Workflow call convention, matches WF-018/INT-006).

**OUTPUT / END STATE (no HTTP response — Execute Workflow return value):**
- Success (incl. zero-new-messages): `{ client_id, emails: [...], count, sync_status: "success" }`.
- Unknown client: `{ client_id, error: { code: "UNKNOWN_CLIENT", message } }`.
- Credential unavailable: `{ client_id, error: { code: "CREDENTIAL_UNAVAILABLE", message } }`.
- Gmail `messages.list` failed after retry: `{ client_id, error: { code: "UPSTREAM_ERROR", message } }`.
- Every path writes a `control.sync_log` row (`table_synced: 'emails'`, `status: 'success'|'failed'`, `triggered_by: 'manual_edit'` until SCH-003 exists to set `'schedule'`), including on zero-new-messages — the real "always log the outcome" guarantee.

**REAL DEPENDENCIES:** UTIL-001 (schema resolution), UTIL-006 (Credential Resolver, `category: 'email'`, `tool_name: 'SyncInbox'`). Gmail `messages.list`/`messages.get` via HTTP Request using the UTIL-006-resolved bearer token — no native Gmail node, same convention as WF-019/WF-018.

**KNOWN GAP, disclosed not hidden (per session-BC-044-scoping, Wiki/log.md):** does NOT write to the `emails` table this card. `emails.customer_id`/`category_id` are both `NOT NULL`, and per `Email_Manager_Flow.md`'s documented pipeline, categorization (INT-010) and identity resolution happen downstream of Sync Inbox — INT-009 has nothing to resolve those with yet. Normalized emails are returned to the caller only; INT-010 (next card) is the one that will actually persist `emails` rows once it exists to receive this handoff.

**KNOWN LIMITATION:** a single message whose `messages.get` fetch fails after retry is dropped from that run (not retried individually) — the sync watermark advances on overall run success, not per-message. Accepted given `retryOnFail` already absorbs transient failures; flagged in-workflow via sticky note.

**REAL BUG FOUND AND FIXED DURING BUILD:** `splitInBatches` does not fire its `onDone` branch at all when it receives 0 input items — contradicts the n8n Workflow SDK reference's own documented `batch_processing` pattern. The zero-new-messages case originally stalled silently at `Split Message IDs` and never wrote a `sync_log` row (caught live via `test_workflow` execution 7642). Fixed by adding an explicit `Has New Messages?` IF gate before the loop, routing the empty case directly to `Aggregate Normalized Emails` (now defensively try/catches its `$('Normalize Email').all()` lookup since that node never runs in the empty path). Full detail: `Wiki/platform-quirks/n8n-node-behaviors.md` §3b.

**LAST VERIFIED:** BC-044, 2026-08-12 — 5 `test_workflow`-pinned scenarios, all passed: success with 1 new message (real UTIL-001/006 calls against Client A, `client_test_002_acme_commerce_test`, real Gmail bearer token resolved, Gmail list/get pinned, body correctly base64-decoded), zero-new-messages (post-fix, confirmed reaches `Build Final Result (Success)` with `count: 0`), unknown client (real UTIL-001 call against a garbage `client_id`, confirmed `resolved:false`), credential unavailable (real UTIL-006 call against Client B, `client_test_001_acme_emergency_test`, confirmed `available:false` — no Gmail connected), Gmail list error (pinned error shape). No genuinely live (unpinned) execution was possible for this card: `execute_workflow` only supports Schedule/Webhook/Form/Chat/Manual trigger types, and this workflow intentionally uses `executeWorkflowTrigger` (per the "child workflows never expose webhooks" convention) — real end-to-end Gmail/Supabase HTTP verification will happen naturally once SCH-003 or INT-010 calls this workflow for real. The UTIL-001/UTIL-006 sub-workflow calls, which matter most architecturally, ran genuinely live in every scenario above (Execute Workflow sub-calls always run for real regardless of pinning).

**BC-048 UPDATE (2026-08-13):** now genuinely chained — `Aggregate Normalized Emails` fans out (new parallel leaf, existing `Write Sync Log`/`Build Final Result` path untouched) through a new `Split Emails To Items` → `Call INT-010 Categorize Email` (`mode: 'each'`) pair, so every normalized email is actually handed to INT-010 for real. Closes this workflow's own disclosed gap. Live-verified as part of INT-010's chain test below (this leg's own SCH-003 cron trigger is still not built — still manual/Execute-Workflow-only).

---

### INT-010 — Zenny Email Manager - CategorizeEmail (INT-010)
**n8n ID:** `pk4YXHCwI3fNixb7` · **published**, active (no production trigger — see Trigger)

**PURPOSE:** Closes INT-009's disclosed gap. Invoked per-email (one call per normalized email, caller loops), resolves/creates the customer via `channel_identity_links`, classifies the email into the client's real `email_categories` taxonomy via a direct OpenRouter LLM call, and writes the first real `emails` row this pipeline produces.

**TRIGGER:** `executeWorkflowTrigger` only — same convention as INT-009, not yet wired as INT-009's actual caller (that wiring is a small follow-up, not part of this card's scope).

**INPUT:** `{ client_id, email: { sender, subject, body, gmail_thread_id, gmail_message_id, received_date } }` — matches INT-009's per-email normalized shape exactly, so INT-009 can call this directly once wired.

**OUTPUT / END STATE (no HTTP response — Execute Workflow return value):**
- Success: `{ email_id, customer_id, category_id, category_name, category_scope, deduped, created }`.
- Unknown client: `{ client_id, error: { code: "UNKNOWN_CLIENT", message } }`.
- LLM category didn't match any real category for this client: `{ client_id, error: { code: "CATEGORY_UNMATCHED", message } }`.
- `upsert_client_email` DB write failed: `{ client_id, error: { code: "DB_WRITE_FAILED", message, detail } }`.

**IDENTITY RESOLUTION:** `find_client_customer_by_channel` (channel_type `'email'`, channel_value = the sender's bare email address parsed out of the raw `From` header). Found → reuse that `customer_id`. Not found → `insert_client_customer` + `insert_client_channel_identity_link` (`match_confidence: 'verified'` — the email address itself is a confirmed identifier per Agent_Runtime_System_v1.md §2.7, no merge ambiguity).

**CATEGORIZATION:** direct OpenRouter LLM call (`@n8n/n8n-nodes-langchain.chainLlm` + `lmChatOpenRouter` + structured output parser, credential `openrouter-zm`, model `anthropic/claude-sonnet-4.6`, temperature 0.1) against a prompt built from the client's live `email_categories` rows (via `list_client_email_categories`) merged with the canonical category *definitions* from Agent_Runtime_System_v1.md §5 (the DB only stores name/scope/routing_rule, not the semantic definition the LLM needs — kept in-code in `Build Classification Prompt`). The LLM's returned category name is matched back against the live DB rows by exact name — never trusted for a raw `category_id`. First LLM-classification node in this project's n8n layer (n8n was execution-only until now); see `Wiki/platform-quirks/n8n-openrouter-direct-llm-pattern.md`.

**DATA MODEL DECISION:** `emails` is one row **per thread**, not per message — inferred mechanically from the table's own shape (one `thread_lifecycle`/`draft_content`/`sent_content` per row) plus Agent_Runtime_System_v1.md §2.3's explicit "one thread can simultaneously have Email Status = Sent and Thread Lifecycle = Waiting-Customer" language. `upsert_client_email` inserts only for a genuinely new `gmail_thread_id`; a reply on an existing thread updates that row in place; replaying the same `gmail_message_id` against an existing thread is a no-op (`deduped: true`).

**REPLY_STYLE PLACEHOLDER:** `emails.reply_style` is `NOT NULL` but no per-category config source exists yet (checked `templates`/`client_config`/`email_categories` — none carry it) to decide scripted vs. generative per §3.2. Defaults to `'scripted'`, disclosed via sticky note and here — INT-011 is where reply style is actually decided.

**REAL DEPENDENCIES:** UTIL-001 (schema resolution). No UTIL-006 — `openrouter-zm` is a fixed platform-level native n8n credential (`openRouterApi` type), not a per-client resolved connection, so this card has no "credential unavailable" branch the way INT-009's Gmail credential does.

**REAL NEW DB OBJECTS (BC-045):** `public.find_client_customer_by_channel(p_schema, p_channel_type, p_channel_value)`, `public.insert_client_channel_identity_link(p_schema, p_customer_id, p_channel_type, p_channel_value, p_match_confidence)`, `public.list_client_email_categories(p_schema)`, `public.upsert_client_email(p_schema, p_customer_id, p_lead_id, p_gmail_thread_id, p_gmail_message_id, p_category_id, p_thread_lifecycle, p_email_status, p_reply_style, p_received_date)` — all SECURITY DEFINER / `SET search_path TO ''`, same dynamic-SQL-per-schema convention as every other client-schema RPC wrapper in this project.

**REAL DATA GAP FOUND AND FIXED DURING BUILD:** `control.email_categories` had never been seeded with the real 15-category taxonomy (Agent_Runtime_System_v1.md §5) — only one legacy `"General Inquiry"` placeholder row existed, and all 5 roster client schemas' local `email_categories` tables were empty (onboarding-time sync only runs once, before this seed existed). Seeded the 15 canonical rows into `control.email_categories` and backfilled all 5 roster clients' local tables using the exact merge logic `Client_Onboarding_Sequence_Spec.md` documents (`DISTINCT ON (category_name) ... ORDER BY category_name, client_id NULLS LAST`). Mechanical fill from a fully-specified doc — Document Resolution Authority tier 3, logged to `Wiki/log.md`.

**LAST VERIFIED:** BC-045, 2026-08-12 — 5 `test_workflow`-pinned scenarios, all passed with the LLM node genuinely live (unpinned, real OpenRouter calls): new-sender success (real `Create Customer`/`Link Channel Identity` pin path, LLM correctly classified a real order-status email as "Support", real category_id matched), known-sender/dedup success (`Customer Found?` true path skips create/link, LLM correctly classified an angry refund-demand email as "Refund"), unmatched category (categories list pinned empty, LLM returned "Uncategorized" as expected, correctly routed to `CATEGORY_UNMATCHED`), DB write failure (`Upsert Email` pinned to a PostgREST-shaped error lacking `email_id`, correctly routed to `DB_WRITE_FAILED`), unknown client (real UTIL-001 call against a garbage `client_id`, confirmed `resolved:false`). **Additionally, all 4 new RPCs were verified genuinely live via direct SQL** (not just through pinned workflow branches): `list_client_email_categories` returned the real 16-row taxonomy; `find_client_customer_by_channel` correctly returned `{found:false}` then, after a real `insert_client_customer`+`insert_client_channel_identity_link`, correctly found the new customer; `upsert_client_email` correctly inserted a new thread row, updated it in place on a second message in the same thread, and correctly no-op'd (`deduped:true`) on a replayed `gmail_message_id` — all test rows cleaned up afterward against `client_test_002_acme_commerce_test`.

**REAL BUG FOUND AND FIXED, BC-048 (2026-08-13):** `List Categories`'s HTTP response is a JSON array (16 category rows); n8n auto-splits a JSON-array HTTP response into one item PER array element, not one item containing the array. `Build Classification Prompt` and `Match Category` both read `$('List Categories').item.json` (first item only, i.e. one category) and `Array.isArray()`-checked it — always `false` — so the LLM's `CATEGORIES:` prompt section was silently empty on every real run since BC-045, and the LLM hallucinated a plausible-sounding category name instead of picking one of the real 16 (reproduced live 3x during BC-048: "Returns & Exchanges", "Order Status Inquiry", "Returns & Shipping Policy Inquiry" — none real, all routed to `CATEGORY_UNMATCHED`). BC-045's own pinned test coverage never caught this because its pin data for `List Categories` was presumably shaped as a single array item, which doesn't reproduce how n8n actually splits a live array HTTP response — a pinned-vs-live behavior gap, not a bad test per se. Fixed both nodes to `$('List Categories').all().map(i => i.json)`. Confirmed live afterward: real email correctly classified `"Support"`, matched to the real `category_id`, all downstream (upsert + INT-011 draft chain) worked end to end. Logged: `Wiki/platform-quirks/n8n-node-behaviors.md`.

**BC-048 UPDATE (2026-08-13):** now genuinely chained to INT-011 — after a successful categorize+upsert, `Build Final Result (Success)` → new `Call INT-011 Draft Email` (`executeWorkflow`, `waitForSubWorkflow: true`, passes the same email object + the new `email_id`) → new `Build Final Result (Chained)`, which is now this workflow's real terminal leaf. **Return contract changed**: success now returns `{ email_id, customer_id, category_id, category_name, category_scope, deduped, created, email_status, drafted }` (was categorization-only before) — documented, not silent; no external caller existed to break. Failure branches (unknown client, unmatched category, DB write failure) are unchanged. Live-verified end to end via a temporary harness workflow (Manual Trigger → Call INT-010, deleted after verification): real email → real customer resolution → real "Support" categorization → real `emails` row write → real INT-011 call → real Pinecone query (0 matches, correctly fell back to `client_config` grounding since INT-012/Notion hasn't synced yet — see INT-012's Credential Gate) → real `draft_content` written to `client_test_002_acme_commerce_test.emails`, `email_status: 'draft_ready'`.

**BC-050 UPDATE (2026-08-13):** new `Call INT-007 Stop Recovery` node inserted between customer/lead identity resolution (both the `Customer Found?` true branch and the new-customer `Link Channel Identity` branch converge into it) and `List Categories` — every inbound email now stops any active/paused `recovery_queue` cadence for its resolved `customer_id` via INT-007, per Agent_Runtime_System_v1.md §6.1. Not gated by category; runs before classification, doesn't change categorization/drafting behavior. Live-verified as part of INT-007's own Last Verified entry (full real chain: reply correctly categorized+drafted AND the customer's real `recovery_queue` row independently confirmed `stopped` in the database afterward).

**BC-062 UPDATE (2026-08-15), COMPLETE — PUBLISHED:** new `Get Classification Prompt Template` HTTP node inserted between `List Categories` and `Build Classification Prompt`, calling `public.get_client_agent_prompt(p_schema, p_prompt_key)` — a SECURITY DEFINER RPC that reads the CALLER'S OWN client schema's `agent_prompts` table (same pattern as `List Categories`/`list_client_email_categories`), granted to `service_role`/`authenticated` only. `Build Classification Prompt`'s literal prompt text replaced with the same wording as a `{{categories}}/{{sender_email}}/{{subject}}/{{body}}` template. Closes the BC-058c-disclosed `agent_prompts` wiring gap for this workflow. **Redesigned mid-card:** the first BC-062 pass built a control-schema, archetype-keyed version of this RPC — a human review correctly identified this as the wrong shape (the live `email_categories` precedent, and the architecture doc's own "never synced to any client schema" note on `control.agent_prompts`, both point to per-client-schema). Rebuilt: `agent_prompts` now exists in `public` + all 5 `tpl_*` templates + every real client schema (2 seed rows each), `create_archetype_template`/`create_client_schema_from_template` updated to include it going forward, old control-schema RPC dropped (genuinely dead, never referenced by a published workflow). **Credential-attach note:** the new node's Supabase credential couldn't be set via `update_workflow`'s `addNode` (tool silently drops it) — fixed with the dedicated `setNodeCredential` operation instead (`zenny-vault-suparbase`). **Live-tested via `test_workflow` with a real, unpinned LLM call** — email correctly classified `"Support"`, `prompt_text` confirmed byte-identical to the pre-BC-062 hardcoded version via direct execution-data inspection. Published.

---

### INT-012 — Zenny Email Manager - SyncNotionKB (INT-012)
**n8n ID:** `yrz1YZcWmUlIZQOx` · **published**, active (no production trigger — see Trigger)

**PURPOSE:** BC-047. KB ingest side of the Notion+Pinecone pivot that replaces the Convocore-KB plan (blocked — see `Wiki/log.md` and `Wiki/platform-quirks/notion-pinecone-kb-pattern.md`). Invoked per-client, syncs that client's Notion KB root page's child pages into Pinecone (index `zenny-email-kb`, namespace = `client_id`) for INT-011 to query at draft time.

**TRIGGER:** `executeWorkflowTrigger` only — no production cadence yet (a future SCH-004 cron card, not built this session; today it's manual/on-demand only).

**INPUT:** `{ client_id }`.

**OUTPUT / END STATE (no HTTP response — Execute Workflow return value):**
- Success: `{ client_id, last_synced_at, sync_status: "success" }`.
- No KB source configured: `{ client_id, error: { code: "NO_KB_SOURCE", message } }`.

**PIPELINE:** `get_client_kb_source` (control-schema RPC) resolves the client's `notion_page_id` → native Notion node (`block.getAll`, credential `zenny-notion-api`) lists child pages → filtered to `type: child_page` → looped (`splitInBatches`, batch size 1) → native Notion node (`page.getMarkdown`) fetches each page's clean Markdown content → Code node chunks it (~700 chars, paragraph-packed, no over-engineering for a v1 flow) → HTTP call to OpenRouter's `/embeddings` endpoint (`text-embedding-3-small`, reuses the existing `openrouter-zm` credential — **no new credential needed for this leg**, OpenRouter added embeddings support since the last live-test-doc pass) → HTTP upsert to Pinecone's data-plane REST (`POST /vectors/upsert`, deterministic vector ID = `notion_block_id + chunk_index` so re-syncing the same page updates in place, never duplicates) → on loop completion, `update_client_kb_last_synced` (control-schema RPC).

**REAL DEPENDENCIES:** `zenny-notion-api` (native Notion credential, `notionApi` type — explicitly pinned via `setNodeCredential`, auto-assignment picked an unrelated "Notion account" credential and had to be corrected). `openrouter-zm` (existing, reused). **Pinecone credential is a real, disclosed gap** — see Credential Gate below.

**REAL NEW DB OBJECTS:** `control.client_kb_source (client_id, notion_page_id, last_synced_at)` — pointer-only table, mirrors `convocore_agent_map`'s convention exactly, no document content ever touches Postgres. `public.get_client_kb_source(p_client_id)`, `public.update_client_kb_last_synced(p_client_id)` — both SECURITY DEFINER, control-schema, `p_client_id`-keyed (not `p_schema` — this table isn't per-client-schema).

**REAL INFRASTRUCTURE STOOD UP THIS CARD:** Pinecone index `zenny-email-kb` (serverless, AWS `us-east-1`, 1536-dim cosine, matching `text-embedding-3-small`) created and verified live via direct REST (control-plane) — confirmed `Ready` state. Notion structure: one root "Zenny Client Knowledge Bases" page + one child KB page per roster client, all created directly via the `zenny-notion-api` integration's own token (so the integration has automatic access — no manual "share with integration" step needed), with 2 real seed articles (Shipping & Returns Policy, Order Status & Support) under Client A (`client_test_002_acme_commerce_test`) for live KB-content testing.

**CREDENTIAL GATE — CLOSED, BC-049 (2026-08-13):** the Pinecone credential (`zenny-pinecone-api`, created BC-048) turned out to be a native `pineconeApi`-typed credential, not the `httpHeaderAuth` type this workflow's sticky assumed — `Upsert To Pinecone` switched from `genericCredentialType`/`httpHeaderAuth` to `predefinedCredentialType`/`pineconeApi`, live-verified working. The Notion leg's 404 (BC-048) was initially misdiagnosed as a stored-credential-secret mismatch; the actual, human-confirmed root cause was simpler — the "Zenny Client Knowledge Bases" root page had never been explicitly connected to the "n8n" integration under Notion's own page-level Connections/data-access list (page self-creation via the integration's token does not automatically grant it durable read access the way this workflow's original sticky note assumed). Fixed by the human adding the integration under that page's Connections. No credential secret was ever actually wrong. Both legs now genuinely live-verified in one unpinned round trip — see LAST VERIFIED.

**KNOWN GAP, disclosed not hidden:** deleting a page from Notion does not delete its vectors from Pinecone — a v1.1 follow-up, not this card's scope.

**LAST VERIFIED:** BC-049, 2026-08-13 — full unpinned live round trip via a temporary harness workflow (Manual Trigger → Call INT-012, deleted after verification): `List Child Pages` returned both real Client A child pages ("Shipping & Returns Policy", "Order Status & Support"), each fetched as Markdown, chunked, embedded, and upserted to Pinecone (`upsertedCount: 1` per chunk, confirmed in the real Pinecone REST response), `last_synced_at` genuinely advanced. First fully-live proof of this workflow's complete pipeline, both legs. Superseded scenario-pinned coverage from BC-047 (2026-08-13, 2 `test_workflow`-pinned scenarios: success/no-KB-source, still valid as regression coverage).

---

### INT-011 — Zenny Email Manager - DraftEmail (INT-011)
**n8n ID:** `fmBjtfi7vqdszs78` · **published**, active (no production trigger — see Trigger)

**PURPOSE:** BC-047, absorbing the scope originally planned as BC-046 (that card stalled on Convocore's KB API hitting a real account-plan/billing gate — see `Wiki/log.md`). Invoked per-email once categorized (INT-010), generates a human-approval draft reply grounded in the client's Notion/Pinecone KB. **Level 2 only** (draft + human-approval queue) — Level 3 autonomous auto-send is out of scope; no per-client autonomy-level config exists anywhere in the platform yet, and building the full 5-Condition Gate is real, separate scope, not a "quick" add.

**TRIGGER:** `executeWorkflowTrigger` only — same convention as INT-009/INT-010, not yet wired as INT-010's actual caller (small follow-up, not this card's scope).

**INPUT:** `{ client_id, email_id, email: { sender, subject, body } }` — **note the raw email object is passed directly**, not re-fetched from Gmail by `email_id` alone. Real gap surfaced during this build: `emails` has no `subject`/`body` columns (only category/lifecycle/status/thread fields) — nothing to re-read from Postgres, and INT-010 never persists the raw content either. Matches INT-010's own input shape exactly; once INT-010 is wired to call this workflow directly, it already has the content in hand.

**OUTPUT / END STATE (no HTTP response — Execute Workflow return value):**
- Drafted: `{ email_id, email_status: "draft_ready", category_name, drafted: true }`.
- Escalated (Complaint/Refund): `{ email_id, email_status: "human_review_required", category_name, drafted: false }`.
- Unknown client: `{ client_id, error: { code: "UNKNOWN_CLIENT", message } }`.
- Email not found: `{ client_id, error: { code: "EMAIL_NOT_FOUND", message } }`.

**ESCALATION RULE:** Complaint and Refund categories always route to WF-017 (direct HTTP POST to its production webhook, same pattern as every other Fallback-D caller in this project) and are never drafted, regardless of reply style — Agent_Runtime_System_v1.md §3.2/§4 Conditions 3-4. `update_client_email_draft` is still called on this path (`p_draft_content: null`, `p_email_status: 'human_review_required'`) so the `emails` row reflects the real outcome.

**KB GROUNDING:** embeds the subject+body via OpenRouter's `/embeddings` endpoint (reuses `openrouter-zm`) → queries Pinecone (`namespace = client_id`, topK 4) → if any matches, grounds the draft in their `metadata.text`; if the namespace is empty (client hasn't run INT-012 yet, or has no KB), falls back to `get_client_kb_fallback_context` (`control.client_config.archetype_settings`) with an explicit "don't invent specifics" instruction baked into the fallback prompt text. Draft itself: `chainLlm` + `lmChatOpenRouter` (`anthropic/claude-sonnet-4.6`, temperature 0.4 — higher than INT-010's classification 0.1, appropriate for natural-sounding prose), same architectural pattern as INT-010's classification call, credential explicitly pinned to `openrouter-zm` (auto-assignment again picked an unrelated "OpenRouter account" credential and had to be corrected via `setNodeCredential`).

**REPLY_STYLE DECIDED:** always `'generative'` — corrects INT-010's `'scripted'` placeholder. No scripted-template content exists anywhere in the DB for email replies (`templates.template_type_enum` has no email-reply type; checked and confirmed empty at BC-045 time already). Mechanical, one-obviously-correct-answer resolution — Document Resolution Authority tier 3, logged to `Wiki/log.md`.

**REAL NEW DB OBJECTS:** `public.get_client_email_for_draft(p_schema, p_email_id)` — joins `emails`+`email_categories`, returns category/customer/thread context for the escalate check and the draft prompt. `public.get_client_kb_fallback_context(p_client_id)` — control-schema, returns `archetype_settings`. `public.update_client_email_draft(p_schema, p_email_id, p_draft_content, p_reply_style, p_email_status)` — same safe-no-op dynamic-SQL convention as `update_email_send_result`. All verified genuinely live via direct SQL against a real test `emails` row (created, verified, cleaned up).

**REAL DEPENDENCIES:** UTIL-001 (schema resolution), WF-017 (direct HTTP POST, not Execute Workflow — matches WF-013/016/018/019's convention), `openrouter-zm`. **Pinecone credential fixed BC-048** — `Query Pinecone` switched from `genericCredentialType`/`httpHeaderAuth` to `predefinedCredentialType`/`pineconeApi` (the credential's real native type), live-verified working.

**LAST VERIFIED:** BC-047, 2026-08-13 — 3 `test_workflow`-pinned scenarios, all passed: draft-with-KB-match (Support category, real KB-context-shaped prompt confirmed built correctly, reached `Build Result (Success)`), escalate (Refund category, correctly skipped drafting and routed through `Notify Human (WF-017)` → `Write Draft (Escalated)` → `Build Result (Escalated)`), draft-with-fallback (empty Pinecone matches, correctly fell through to `Get Fallback Context`/`Build Grounding (Fallback)`, confirmed the exact fallback prompt text). All 3 new RPCs verified genuinely live via direct SQL against a real `emails` row in `client_test_002_acme_commerce_test` (created via `insert_client_customer`+`upsert_client_email`, read via `get_client_email_for_draft`, written via `update_client_email_draft`, all correct, then cleaned up).

**BC-048 UPDATE (2026-08-13) — genuinely live end to end (Pinecone leg):** triggered for real via INT-010's new chain call against a real inbound test email. Real customer resolution → real "Support" categorization (after the `List Categories` fix, see INT-010) → real `Embed Query (OpenRouter)` call → real `Query Pinecone` call (0 matches — Client A's namespace was still empty at that point since INT-012/Notion hadn't synced yet) → correctly fell back to `client_config` grounding → real `chainLlm` draft generation → real `update_client_email_draft` write, confirmed via direct SQL (`email_status: 'draft_ready'`, `reply_style: 'generative'`, real non-empty `draft_content` that correctly avoided inventing specific policy details per the fallback prompt's instruction). First genuinely-live, unpinned proof this workflow's Pinecone leg authenticates and works.

**BC-049 UPDATE (2026-08-13):** INT-012's Notion leg closed out (see INT-012's entry) — Client A's Pinecone namespace now has real KB content in it. The KB-match branch itself (non-empty `Query Pinecone` results actually grounding a draft) has not yet been separately re-run live since the KB sync landed; next real inbound email to Client A will exercise it for the first time. Not blocking — the fallback path this workflow already proved live remains correct behavior either way.

**BC-062 UPDATE (2026-08-15), COMPLETE — PUBLISHED:** same redesigned pattern as INT-010 (see its BC-062 entry for the full RPC/table/credential detail). New `Get Draft Prompt Template` HTTP node inserted between `Email Found?`'s true branch and `Escalate Category?` (upstream of both the escalate and normal-draft paths, so the template is available to `Build Draft Prompt` regardless of which branch fires), calling `public.get_client_agent_prompt(p_schema, p_prompt_key='draft_email')`. `Build Draft Prompt`'s literal instruction text replaced with a `{{category}}/{{grounding}}/{{sender}}/{{subject}}/{{body}}` template. **Live-tested via `test_workflow`** (real, unpinned LLM call, fallback-grounding branch): correctly generated a grounded draft reply, `prompt_text` confirmed byte-identical to the pre-BC-062 hardcoded version via direct execution-data inspection. Published.

---

### INT-006 + SCH-001 — Zenny Recovery Engine - Process Recovery Queue (INT-006 + SCH-001)
**n8n ID:** `crncPUwCbAQn5WgW` · **published**, active

**PURPOSE:** Closes the gap BC-036 left open — WF-018 (SendRecoveryMessage) only fired on direct call, with nothing dispatching it automatically. This is that dispatcher: a 5-minute cron sweep across every client schema, calling WF-018 for each `recovery_queue` row that's due. Pure dispatcher — owns no state, never writes `recovery_queue` directly; step-advancement and idempotency stay entirely owned by WF-018 (`advance_client_recovery_step`), unchanged from BC-036.

**TRIGGER:** Schedule Trigger ("Every 5 Minutes"), `{ rule: { interval: [{ field: 'minutes', minutesInterval: 5 }] } }`. Interval chosen because the shortest real cadence gap in any archetype profile is Emergency step 1 at 15 minutes (Recovery_Engine_Flow.md §3) — 5 minutes keeps sends within a third of that gap.

**INPUT:** None (self-triggered). Reads `control.clients` (`&status=neq.offboarded` only — **fixed BC-038**, see below; `status='onboarding'`/`'active'`/`'paused'` all still pass through, since none of those are documented as excludable and `control.clients.status` is not used as a gate anywhere else in the built system).

**FIXED BC-038 (real gap found in Commander re-verification, not the original build):** `Get Active Clients`'s URL now excludes `status='offboarded'` clients — `Template_Migration_Process.md` already established the precedent (an offboarded client's schema may not exist, acting on it serves no purpose) and the same reasoning applies directly to dispatching automated recovery messages. `paused` is intentionally left unfiltered — no document anywhere defines what `paused` should mean operationally; not resolved, flagged as an open product decision (`Wiki/platform-quirks/recovery-queue-sweep-design.md`). **Real mistake caught by live re-verification, not by inspection:** the first `update_workflow` edit was applied but never published — the live/active version kept running the old (unfiltered) query for one full cron cycle (execution 598 still showed the synthetic offboarded test client) before the miss was caught and `publish_workflow` was called. Re-verified clean on the next tick (execution 609).

**OUTPUT / END STATE:** No caller-facing response (unattended). Per due row, forwards a `POST` to WF-018's production webhook (`https://n8n-cbzu.srv1881104.hstgr.cloud/webhook/send-recovery-message`, same direct-HTTP pattern WF-018 itself uses to call WF-017 — not an Execute Workflow node) and lets WF-018's own response (`sent`/`held`/`not_sent`/`pending_human_review`) pass through un-acted-on. A failure calling the due-rows RPC or dispatching to WF-018 for one row is captured on a `Set` node (`Log Schema Sweep Failure` / `Log Dispatch Failure`) and does not abort the rest of the sweep — per-item default iteration already isolates failures, confirmed live (see below).

**REAL NEW DB OBJECT:** `public.get_due_recovery_queue(p_schema text, p_limit integer DEFAULT 50)` RPC — SECURITY DEFINER, `SET search_path TO ''`, same dynamic-SQL-per-schema convention as `get_client_recovery_context`/`advance_client_recovery_step`. Filters `status = 'active' AND human_ownership_flag = false AND next_follow_up <= now()`, ordered by `next_follow_up`, capped at `p_limit` (default 50, not load-tested). The `human_ownership_flag` filter is the one real gap WF-018 itself does not cover — per `Recovery_Engine_Flow.md` §"1.H Global Active Issue Lock" ("Human owns → Pause — do not create/send"), enforced here at the sweep level since nothing else in the built system checks it.

**REAL DEPENDENCIES:** WF-018 SendRecoveryMessage (called, never modified). No UTIL-001 call needed — `control.clients` is read directly for the full roster (same URL/header pattern UTIL-001 itself uses internally, just without the single-`client_id` filter, since this workflow needs to enumerate all clients rather than resolve one).

**LAST VERIFIED:** BC-037, 2026-08-10 — genuinely live, not `test_workflow`-pinned: a real scheduled tick (execution 550, `mode: "trigger"`, unprompted) fired 5 minutes after publish and processed 4 real due rows across 3 real clients in one sweep with zero crashes — one routed through WF-018's own Pattern D human-handoff branch (`pending_human_review`, Client B lead with no real Gmail connection), two correctly `held` on WF-018's time-window check (real UTC hour was outside 8am–8pm at test time), one correctly `not_sent`/`suppressed_or_opted_out` (pre-existing real `suppression_records` row on a Client C lead). A synthetic `human_ownership_flag = true` row was inserted on a Client A lead specifically to test the new filter — confirmed **excluded** from `get_due_recovery_queue`'s result both by direct RPC call and by its absence from the real sweep's dispatched rows. Both synthetic test rows were deleted after verification; the real pre-existing rows (Client A step-2 lead, 2 Client C rows) were left untouched. **Not separately exercised this session:** a real `"sent"` pass-through and the resulting WF-018-side stale-step/duplicate short-circuit — the real UTC clock was outside the 8am–8pm window for every live tick run this session, so every eligible send held instead of completing. WF-018's own `sent` and duplicate-suppression paths were already live-verified end-to-end in BC-036 and are unchanged by this card; this sweep only adds the dispatch/filter logic in front of them, which is what was verified live above.

**RE-VERIFIED BC-038, 2026-08-10:** offboarded-client exclusion. A synthetic `status='offboarded'` client (`client_schema_name: 'zz_offboarded_test_should_not_appear'`) was inserted, confirmed present in the sweep's real output on execution 598 (the un-published edit, see above), then confirmed absent on execution 609 (five minutes after the missed publish was caught and corrected). Deleted after verification.

**UPDATED BC-054, 2026-08-14 — max-steps enforcement (RPC-only, workflow itself unchanged):** `get_due_recovery_queue` now also filters `current_step < effective_max`, where `effective_max = coalesce(control.clients.max_recovery_steps, control.archetype_recovery_defaults.max_steps)` for the row's client (new lookup table, seeded from `Recovery_Engine_Flow.md` §3). This is the defensive second gate — the real stop happens in `advance_client_recovery_step` (WF-018's RPC, see its entry) the moment a step reaches the max; this filter exists in case a row is ever left `active` past its max by some other path. Live-verified: a synthetic step-3 row (effective max 3, Client B/emergency) was correctly excluded from this RPC's result; deleted after verification. Full mechanism: `Wiki/platform-quirks/recovery-queue-sweep-design.md`.

---

### SCH-003 — Zenny Email Manager - Inbox Sync Cadence (SCH-003)
**n8n ID:** `ykXANEvGhr9tSe0B` · **published**, active

**PURPOSE:** BC-049. Puts INT-009 (Sync Inbox) on a real automated cadence instead of manual/on-demand-only — closes the last open Phase 10 scheduling gap. Mirrors INT-006/SCH-001's "enumerate active clients, dispatch per client" pattern exactly.

**TRIGGER:** Schedule Trigger ("Hourly Trigger"), `{ rule: { interval: [{ field: 'hours', hoursInterval: 1 }] } }`. Hourly chosen as a reasonable default for inbox freshness — no per-archetype SLA doc exists for email response latency the way Recovery's Emergency-step-1 15-minute gap does; revisit if a real SLA surfaces.

**INPUT:** None (self-triggered). Reads `control.clients` (`&status=neq.offboarded`, same filter convention as SCH-001/INT-006 post-BC-038).

**OUTPUT / END STATE:** No caller-facing response (unattended). Fans out to INT-009 via `Execute Workflow` (`mode: 'each'`, `waitForSubWorkflow: true`) — one sub-execution per active client. Clients with no Gmail credential no-op cleanly through INT-009's own `Credential Available?` branch (`CREDENTIAL_UNAVAILABLE`), not treated as a sweep failure.

**REAL DEPENDENCIES:** INT-009 (called, never modified this card). Reuses the `zenny-vault-suparbase` Supabase credential.

**LAST VERIFIED:** BC-049, 2026-08-13 — genuine live manual run (not `test_workflow`-pinned) against the full real 5-client roster: 4 clients correctly no-op'd (`CREDENTIAL_UNAVAILABLE`, no real Gmail connection), Client A (`baa673b5-...`) genuinely synced 1 real inbox message end to end through the full INT-009→INT-010→INT-011 chain built in BC-048. Zero crashes across the sweep.

---

### SCH-004 — Zenny Email Manager - KB Sync Cadence (SCH-004)
**n8n ID:** `ve6GVb5IvBtl4pvf` · **published**, active

**PURPOSE:** BC-049. Puts INT-012 (Sync Notion KB) on a real automated cadence instead of manual/on-demand-only — the second half of the last open Phase 10 scheduling gap. Fans out only to clients that actually have a KB configured (`control.client_kb_source.notion_page_id` set), not the full roster.

**TRIGGER:** Schedule Trigger ("Daily Trigger"), `{ rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 3, triggerAtMinute: 0 }] } }` — daily at 03:00 (instance timezone). KB content changes far less often than inbox traffic; daily is a conservative default, not tied to any documented SLA.

**INPUT:** None (self-triggered). Reads `control.client_kb_source` directly (`?select=client_id,notion_page_id&notion_page_id=not.is.null`), not `control.clients` — this workflow only needs clients with a real KB pointer, unlike SCH-003's full-roster fan-out.

**OUTPUT / END STATE:** No caller-facing response (unattended). Fans out to INT-012 via `Execute Workflow` (`mode: 'each'`, `waitForSubWorkflow: true`) — one sub-execution per client with a KB source row.

**REAL BUG FOUND AND FIXED, BC-049:** first live run 403'd — `permission denied for table client_kb_source` (Postgres `42501`), because `service_role` had never been granted `SELECT` on `control.client_kb_source` (created BC-047, never exercised via a direct roster-listing query before this card — INT-012 itself only ever reads it through the `get_client_kb_source` RPC, which runs as `SECURITY DEFINER` and doesn't need a direct grant). Same "control-schema USAGE/GRANT gap" pattern already documented in `Wiki/platform-quirks/postgrest-schema-exposure.md` — resolved the same way: `GRANT SELECT ON control.client_kb_source TO service_role;` applied live via migration, re-ran, succeeded.

**REAL DEPENDENCIES:** INT-012 (called, never modified this card). Reuses the `zenny-vault-suparbase` Supabase credential.

**LAST VERIFIED:** BC-049, 2026-08-13 — genuine live manual run (not `test_workflow`-pinned), post-GRANT-fix: successfully enumerated and dispatched to every client with a real `notion_page_id` (Client A only, at present), which re-confirmed the full live Notion→Pinecone round trip already proven in this same session (see INT-012's entry).

---

### INT-007 — Zenny Recovery Engine - StopRecovery (INT-007)
**n8n ID:** `tncscZAt6lKkO6c9` · **published**, active (no independent trigger — called from INT-010)

**PURPOSE:** BC-050. Implements `Agent_Runtime_System_v1.md` §6.1 Recovery Reply Handling's first line — "Stop the scheduled recovery cadence immediately" — the moment a customer replies to any email. Wired as a call from INT-010 (Categorize Email), right after customer/lead identity resolution, for every inbound email — not gated by category, since a recovery reply can carry any content and gets classified normally afterward regardless.

**TRIGGER:** `executeWorkflowTrigger` only — no independent cadence, called synchronously by INT-010.

**INPUT:** `{ client_id, customer_id }`. Deliberately `customer_id`, not `lead_id` — INT-010 only ever resolves `customer_id` (via `channel_identity_links`), and a customer can have multiple leads/recovery records over its lifetime, so the RPC joins `leads`→`recovery_queue` by `customer_id` and stops every active/paused record found (normally 0 or 1, but not guaranteed to be exactly 1 — see Last Verified).

**OUTPUT \ END STATE (no HTTP response — Execute Workflow return value):**
- `{ client_id, customer_id, stopped_count, stopped_records: [{recovery_id, lead_id}, ...], recovery_stopped: boolean }` — `stopped_count: 0` for the overwhelming majority of inbound emails (sender has no recovery record at all), which is the expected common case, not an error.
- Unknown client: `{ client_id, error: { code: 'UNKNOWN_CLIENT', message } }`.

**REAL NEW DB OBJECT:** `public.stop_client_recovery_for_customer(p_schema text, p_customer_id uuid)` RPC — SECURITY DEFINER, `SET search_path TO ''`, same dynamic-SQL-per-schema convention as `get_client_recovery_context`/`advance_client_recovery_step`. `UPDATE ... WHERE status IN ('active','paused')` — reuses the existing `recovery_status_enum` (no new enum value added; mechanical, Document Resolution Authority tier 3, since the spec never names a distinct terminal state for a reply-triggered stop and `'stopped'` already means "cadence over, not a failure" per the existing status-mapping rule).

**REAL DEPENDENCIES:** UTIL-001 (schema resolution). Called by INT-010 (`Call INT-007 Stop Recovery`, inserted between customer-identity resolution and `List Categories`).

**LAST VERIFIED:** BC-050, 2026-08-13 — live, not `test_workflow`-pinned, via a disposable harness (Manual Trigger → Execute Workflow → INT-007) plus a real end-to-end run through INT-010: (1) standalone, a customer with 2 real active/paused synthetic `recovery_queue` rows across 2 different leads got both stopped in one call (`stopped_count: 2`) — genuinely proved the multi-lead-per-customer join, not just the single-row case; (2) standalone, a customer with zero recovery rows correctly returned `stopped_count: 0`; (3) full chain: a synthetic inbound email from a real customer with one real `active` `recovery_queue` row was run through the live (unpublished-at-the-time) INT-010 draft — the email was genuinely categorized (`Support`) and drafted via INT-011 exactly as before, AND the recovery row was independently confirmed `status='stopped'` in the database afterward, proving the wiring doesn't disturb the existing pipeline while genuinely adding the stop. All synthetic rows/links deleted after verification.

---

### INT-008 — Zenny Recovery Engine - ResumeRecovery (INT-008)
**n8n ID:** `elsNaj0yIj8f6KCl` · **published**, active — **real caller wired, BC-056**

**PURPOSE:** BC-050. Implements `Agent_Runtime_System_v1.md`'s Paused-State Resumption logic (resumption triggers B and C: a human closes their task without the customer replying, or a live conversation ends without conversion) — resume from the next step if the archetype's max cadence steps haven't been reached, otherwise stop.

**TRIGGER (BC-056 UPDATE):** now has 2 entry points — the original `executeWorkflowTrigger` (internal use) AND a new real Webhook, `POST /resume-recovery` (added this card — previously this workflow had zero production triggers at all, the actual real gap behind "no caller"). A shared `Normalize Contract` node (matching WF-018/WF-019's own convention) feeds both into the same unchanged downstream decision logic.

**INPUT:** `{ client_id, lead_id }` — matches the existing `get_client_recovery_context`/`advance_client_recovery_step` convention (keyed on lead, since that RPC assumes at most one live recovery row per lead at a time). Webhook body shape: `{ client_id, payload: { lead_id } }`, same contract convention as every other webhook Tool in this project.

**OUTPUT \ END STATE (no HTTP response — Execute Workflow return value):**
- Resumed: `{ client_id, lead_id, action: 'resume', resumed: true, stopped: false, new_status: 'active', next_follow_up }`.
- Max steps reached during pause: `{ ..., action: 'stop', resumed: false, stopped: true, new_status: 'stopped' }`.
- No-op (no recovery record, or record isn't `paused`): `{ client_id, lead_id, action: 'noop', reason: 'NO_RECOVERY_RECORD' | 'NOT_PAUSED', resumed: false, stopped: false }` — not an error.
- Unknown client: `{ client_id, error: { code: 'UNKNOWN_CLIENT', message } }`.

**REAL NEW DB OBJECT:** `public.resume_client_recovery(p_schema text, p_lead_id uuid, p_new_status text)` RPC — SECURITY DEFINER, `SET search_path TO ''`, `UPDATE ... WHERE status = 'paused'` (idempotency guard — a second call after the first already resumed/stopped the record correctly no-ops via `Get Recovery Context` reporting `NOT_PAUSED`, same "database is the final guarantee" philosophy as `advance_client_recovery_step`). Sets `next_follow_up = now()` only on the `active` branch so the resumed record is immediately eligible for INT-006/SCH-001's next sweep tick.

**MAX-STEPS-PER-ARCHETYPE:** INT-008's `Compute Resume Decision` node still reproduces `Recovery_Engine_Flow.md` §3's cadence-profile step counts as its own local hardcoded map (emergency:3, appointment:4, commerce_ecom:3, commerce_restaurant:2, consultation:5, engagement:3), unchanged by BC-054/056 — this is INT-008's own resume-vs-stop decision, separate from BC-054's sweep-level enforcement (`get_due_recovery_queue`/`advance_client_recovery_step`, see WF-018's entry), which closed the previously-disclosed platform-wide gap. Both now agree on the same real source values.

**REAL CALLER, BC-056 (2026-08-14):** the actual gap was never "INT-008's logic is unwired" — it was that **nothing in the built system, including INT-008/`resume_client_recovery` themselves, ever wrote `human_ownership_flag = false`** (a real finding from this card's Mandatory MCP Verification, correcting the prior assumption). Fixed via a new `auth.uid()`-scoped RPC, `dashboard_release_lead_ownership` (clears the flag, scoped to the caller's own client via `control.dashboard_users`), called from a new dashboard `/paused-leads` page through a new `release-lead-ownership` Edge Function, which then calls this workflow's new webhook (above) to do the actual resume/stop. Full mechanism: `Wiki/infra/int008-ownership-release.md`.

**REAL DEPENDENCIES:** UTIL-001 (schema resolution), `get_client_recovery_context` (reused, not modified).

**LAST VERIFIED:** BC-050, 2026-08-13 — live, not `test_workflow`-pinned, via a disposable harness (Manual Trigger → Execute Workflow → INT-008) against real synthetic `recovery_queue` rows, all 3 branches: (1) paused, `current_step: 1 < 3` (commerce_ecom max) → `resumed: true`, `new_status: 'active'`, `next_follow_up` set to the call time; (2) paused, `current_step: 3 >= 3` → `stopped: true`, `new_status: 'stopped'`; (3) same lead re-called after (1), now `status='active'` not `'paused'` → `action: 'noop', reason: 'NOT_PAUSED'`. All synthetic rows deleted after verification. **BC-056, 2026-08-14** — the new webhook path proven live, twice, against a disposable fixture: first call correctly resumed (`status: paused → active`), second call on the same now-active lead correctly no-op'd (`NOT_PAUSED`). `dashboard_release_lead_ownership` proven both for a real success (flag cleared) and fail-closed (unmapped user rejected).

---

## Zenny Own Runtime (Phase 14) — BC-072 Shared Runtime Foundation

Own-conversation-runtime track, replacing Convocore (fully stopped 2026-08-29).
Architecture: `05_Platform_Builds/Zenny_SaaS/Zenny_MultiNode_Runtime_Architecture_v1.0.md`
+ `Zenny_Channel_Adapter_Architecture_v2.0.md`. Full decision record:
`docs/designs/zenny-saas-runtime-pivot.md`, `Wiki/decisions/zenny-saas-runtime-pivot.md`.

### Zenny Runtime - Resolve or Create Conversation Session
**n8n ID:** `hA0PJmeEzEeLssNC` · **published**, active (sub-workflow, no production trigger)

**PURPOSE:** The shared entry choke point every future conversation-node workflow calls first — closes the tenant-isolation finding from BC-072's eng review. Resolves `client_id` → `client_schema_name` (reusing UTIL-001 directly, not rebuilt) then finds or creates the conversation + session row for that client's schema. **Tenant isolation is schema-per-client** (matching this platform's existing pattern — WF-017/UTIL-001), **not** the RLS+`organization_id`+`app.current_org_id` model the MultiNode Runtime v1.0 doc originally assumed; that mismatch was found live reading WF-017 during BC-072, corrected before building — see the design doc's CORRECTION section.

**TRIGGER:** Execute Workflow Trigger (Define Below): `client_id` (string), `channel` (string, matches `channel_type_enum`), `external_id` (string).

**OUTPUT / END STATE:**
- Resolved: `{ resolved: true, client_schema_name, conversation_id, is_new }` — `is_new: true` on first message for that `external_id`+`channel` pair, `false` on a returning one (same `conversation_id`).
- Unknown client: `{ resolved: false, error_type: "permanent", error_message: "client_id does not resolve to a known client" }`.

**REAL DEPENDENCIES:** UTIL-001 (schema resolution, reused unmodified), `find_or_create_conversation` RPC (new, BC-072), `zenny-vault-suparbase` Supabase credential.

**LAST VERIFIED:** BC-072, 2026-08-29 — live via `execute_workflow` (manual mode, not `test_workflow`-pinned, since `test_workflow` auto-pins credentialed nodes and would only simulate the Supabase call). Three real executions against the live test-client roster: (1) new conversation created for `client_test_002_acme_commerce_test` (`43ed5d3e-...`, `is_new: true`); (2) same client_id + same `external_id` replayed → same `conversation_id`, `is_new: false` (idempotency proven); (3) a **different** client (`client_test_003_acme_appointment_test`) with the **same** `external_id` → a genuinely separate `conversation_id` (`90bc192a-...`) in the other schema — tenant isolation proven, not assumed. All 3 synthetic rows deleted after verification. A real n8n IF-node bug was found and fixed during this verification: a `{type:'boolean', operation:'true'}` condition on `$json.resolved` threw a strict-type-validation error (this project's most recurring n8n bug class per `Wiki/platform-quirks/n8n-node-behaviors.md`) — fixed by switching to the already-proven `{type:'string', operation:'exists'}` pattern on `client_schema_name`, matching WF-017's own "Customer Found?" node.

**FIXED BC-072 (schema-provisioning gap, found live):** `create_client_schema_from_template` only clones tables that exist in the source `tpl_*` schema at call time — the 3 already-provisioned test-client schemas needed for Phase 1 (`client_test_002/003/004`) predated this migration and had no `conversations`/`conversation_sessions`/`messages` tables. Backfilled directly, including re-adding the foreign keys `LIKE ... INCLUDING ALL` never copies (a real Postgres gotcha, not an oversight — matches why `create_client_schema_from_template`'s own `v_fk_defs` array exists). Also extended these 3 tables to `tpl_emergency`/`tpl_engagement` (outside Phase 1 scope, but needed to avoid breaking future provisioning for those archetypes once `create_client_schema_from_template` expects them everywhere).

**FIXED BC-072 (RPC grant gap, found via `get_advisors`):** `find_or_create_conversation`/`append_message` were created with `REVOKE ... FROM anon, authenticated` (matching BC-052/064's documented pattern) but remained executable by both roles — Postgres grants `EXECUTE` to the implicit `PUBLIC` pseudo-role by default, and every role is a member of `PUBLIC`, so revoking named roles alone doesn't remove it. Fixed with an explicit `REVOKE ... FROM PUBLIC` + `GRANT ... TO service_role`. Checked live whether this gap existed in any of the 62 functions BC-064 already fixed — it did not (zero `SECURITY DEFINER` functions in `public` are anon-executable as of this check), so this was specific to these 2 new functions, not a platform-wide regression.

**FIXED BC-2026-08-31 (real race condition, found live during a multi-tenant/concurrency audit):** `find_or_create_conversation` was a plain SELECT-then-INSERT with no unique constraint backing it — two near-simultaneous messages from the same customer (a doubled webhook, or two genuinely quick messages) could both pass the SELECT before either INSERT committed, creating two separate `conversations` rows (each with its own `conversation_sessions` row), silently splitting that customer's history and `turn_count` in two. **Fix:** added a partial unique index `conversations_open_channel_external_uidx ON (channel, external_id) WHERE status <> 'closed'` to all 5 `tpl_*` templates + all 6 provisioned client schemas, and a matching unique index on `conversation_sessions(conversation_id)` (one session per conversation was already the design intent, never enforced). Rewrote the function to `INSERT ... ON CONFLICT ... DO UPDATE RETURNING` instead of check-then-insert — both racing callers now provably converge on the same row, by construction (Postgres MVCC on a unique index), not by timing luck. Live-verified: two calls for the same never-before-seen `(channel, external_id)` both returned the identical `conversation_id`, with exactly 1 conversation row and 1 session row on disk after. Full detail: `Wiki/platform-quirks/n8n-concurrency-race-patterns.md`.

### Zenny Runtime - Call LLM via OpenRouter
**n8n ID:** `OuJt2xCEOL8CgZJy` · **published**, active (sub-workflow, no production trigger)

**PURPOSE:** Reusable LLM-call wrapper for every future node type (BC-073/074/075), matching the existing `chainLlm`+`lmChatOpenRouter` pattern already live in this repo (`Wiki/platform-quirks/n8n-openrouter-direct-llm-pattern.md`, built for INT-010). Closes the eng review's "LLM provider single point of failure" finding: a 15s timeout + graceful degradation message on the error output, instead of a silent hang or a thrown workflow error.

**TRIGGER:** Execute Workflow Trigger (Define Below): `prompt` (string), `system_message` (string).

**OUTPUT / END STATE:**
- Success: `{ success: true, output: "<model's reply text>" }`.
- Degraded (timeout/failure after 3 retries): `{ success: false, output: "We're having trouble right now — please try again shortly.", error_type: "llm_unavailable" }`.

**REAL DEPENDENCIES:** `openrouter-zm` OpenRouter credential (the same credential name INT-010/011 already use, per Workflow_Registry's own INT-010 entry — confirmed consistent, not a new/different key).

**LAST VERIFIED:** BC-072, 2026-08-29 — live via `execute_workflow` (a temporary Manual Trigger was added for direct invocation, since Execute Workflow Trigger sub-workflows can't be called directly through the MCP's `execute_workflow`, then removed after verification). Real call to `openai/gpt-4.1-mini` returned "connection verified" for a controlled test prompt — genuine external API round trip, not simulated (`test_workflow` was deliberately avoided here since it auto-pins credentialed nodes, which would have only proven the wiring, not the actual OpenRouter connection).

**UPDATED BC-073 (customer resolution added, found live during planning — a real gap, not a build choice):** `find_or_create_conversation` never resolved a `customer_id` — the `conversations` table has no customer link at all — but every commerce tool (CreateCart, pending_verifications) requires one. Extended this shared sub-workflow (not duplicated per-node, matching the WF-017 shared-choke-point convention) to also find-or-create the customer via `find_client_customer_by_channel`/`insert_client_customer`/`insert_client_channel_identity_link` — the same find-or-create-customer chain WF-001 already uses. **Return shape gained `customer_id`.** Also found and fixed live: `channel_type_enum` (reused for both `conversations.channel` and customer-identity matching) was missing `web_chat`/`instagram` — two of the three channels required at launch — added both (additive, non-breaking). Re-verified both branches (not-found→create, found→reuse) against `client_test_002_acme_commerce_test`; synthetic rows cleaned up after.

### Zenny Runtime - Queue Commerce Cart Verification
**n8n ID:** `Rt9PupfwwV9NMNvS` · **published**, active (sub-workflow, no production trigger — wired as a `toolWorkflow` agent tool)

**PURPOSE:** BC-073's commerce-tool guardrail enforcement point. The commerce-ecom Agent never calls `insert_client_cart`/WF-005 directly for a cart-creation request — it calls this instead, which mints a lead (`insert_client_lead`, required by `insert_client_cart`'s FK) then queues a `pending_verifications` row. **Real gap found and closed, not assumed safe:** checked WF-005's actual behavior before building this — its happy path creates the real order immediately, human review only fires on its own escalation (failure) path, which does not satisfy the eng review's locked guardrail ("human confirmation before executing"). This sub-workflow is that missing pre-execution gate.

**TRIGGER:** Execute Workflow Trigger (Define Below): `client_schema_name`, `customer_id`, `channel`, `items` (array), `conversation_summary` (all string except `items`).

**OUTPUT / END STATE:** `{ status: "pending_confirmation", pending_verification_id, message }` — always this shape; the real order is only created later, on business-owner approval (see `resolve-pending-verification`'s new `CreateCart` branch below).

**REAL DEPENDENCIES:** `insert_client_lead`, `queue_pending_verification` RPCs (both pre-existing); `zenny-vault-suparbase` credential.

**REAL NEW DB OBJECT:** extended `pending_verifications_tool_name_check` (every schema carrying the table — 5 `tpl_*` + 6 client/test schemas) to allow `CreateCart` alongside BC-053's `CancelAppointment`/`UpdateCustomer` — found live when the first real test call was rejected by the check constraint.

**FIXED BC-2026-08-31 (real idempotency gap, found live during a multi-tenant/concurrency audit):** `queue_pending_verification` was a bare INSERT with no uniqueness — an Agent tool-call retry (LLM retry, timeout retry, both normal under real load) could queue two separate `pending_verifications` rows for the same `(customer_id, tool_name, target_id)` cart request, each independently approvable → two real orders from one customer request. **Fix:** added a partial unique index `pending_verifications_open_uidx ON (customer_id, tool_name, target_id) WHERE status = 'pending'` to all 11 schemas carrying the table; rewrote the function to `INSERT ... ON CONFLICT ... DO NOTHING`, re-selecting and returning the already-queued row's id on conflict — callers get a real id either way, idempotently. Live-verified: two calls with identical args returned the identical `pending_verification_id`, with exactly 1 row on disk after. Full detail: `Wiki/platform-quirks/n8n-concurrency-race-patterns.md`.

**FIXED (found live, not assumed):** `channel_type_enum` (`web_chat`) vs `source_channel_enum` (`web-chat`, hyphen) are two different enums for conceptually the same value — `insert_client_lead`'s `p_source_channel` needs the hyphenated form. Mapped inline (`web_chat` → `web-chat`) rather than unifying the enums, since `source_channel_enum` already has its own established history (BC-071's platform-wide rename) this card doesn't touch. Also fixed: `queue_pending_verification` `RETURNS uuid` (scalar) — PostgREST's `application/vnd.pgrst.object+json` Accept header is for object-returning functions and broke JSON parsing on this scalar return; fixed by dropping that header and reading the plain-text response instead.

**LAST VERIFIED:** BC-073, 2026-08-29 — live via `execute_workflow` (temporary Manual Trigger, same pattern as BC-072). Full real chain proven: a real lead created (`insert_client_lead`), a real `pending_verifications` row queued (`queue_pending_verification`), confirmed via the `Return` node's real `pending_verification_id`. Synthetic rows cleaned up after.

### Zenny Runtime - Commerce-Ecom Node
**n8n ID:** `IKOAp1dmnqul5uuQ` · **published**, active (sub-workflow, no production trigger — the first real archetype node, called by whatever channel/routing layer arrives later)

**PURPOSE:** BC-073's commerce-ecom archetype node — an `@n8n/n8n-nodes-langchain.agent` (tool-calling), not BC-072's `chainLlm` LLM sub-workflow (which has no tool-calling surface — a real architecture finding from `/plan-eng-review`, caught in planning not mid-build). Handles FAQ/product/availability Q&A (auto) and cart-creation requests (gated) for a commerce-ecom client's conversation turn.

**TRIGGER:** Execute Workflow Trigger (Define Below): `client_id`, `channel`, `external_id`, `message_text`.

**FLOW:** resolves the conversation+customer via BC-072's shared sub-workflow → **checks whether the in-process memory buffer for this `conversation_id` is cold and rehydrates it from Postgres if so (BC-2026-08-31, see below)** → fetches the client's `business_name` (`control.clients` via REST, `Accept-Profile: control` — the same pattern UTIL-001 already uses) and the `commerce_ecom_agent_system` prompt (`get_client_agent_prompt` RPC, BC-062 pattern) → interpolates the business name into the prompt → persists the inbound message (`append_message`) → runs the Agent (model: OpenRouter `openai/gpt-4.1-mini`, credential `openrouter-zm`; memory: `memoryBufferWindow` keyed on `conversation_id`; tools: `Check_availability` — HTTP Request Tool → WF-002's real webhook, read-only, no gate; `Create_cart` — `toolWorkflow` → "Zenny Runtime - Queue Commerce Cart Verification", gated) → persists the response (`append_message`) → returns `{ response, conversation_id }`.

**FIXED BC-2026-08-31 (memory durability gap, found live during a multi-tenant/concurrency audit):** the Agent's actual cross-turn memory is `memoryBufferWindow`, an in-process buffer living only in the single running `n8n-cbzu` container's RAM — it was never rehydrated from BC-072's own Postgres `messages` table, which `append_message` writes to as a pure audit log the Agent never actually reads. A container restart/deploy/crash silently wiped every active conversation's context while Postgres showed the conversation continuing normally; the customer's next message got answered with zero prior context. **Fix (kept deliberately small — Zenny is pre-launch/single-instance, per the CEO/eng review; a full custom Postgres-backed memory implementation was considered and rejected as solving a scale problem the product doesn't have yet):** new nodes `Load Current Memory` (Chat Memory Manager, `mode=load`, `groupMessages:true`) → `Memory Cold?` (IF: `is_new === false && messagesCount === 0`) → on cold, `Get Recent History (RPC)` (new `get_recent_messages` RPC, last 10 messages) → `Rehydrate Memory` (Chat Memory Manager, `mode=insert`, one message per item, n8n auto-iterates since the RPC's raw JSON array response becomes one n8n item per message). **2 real bugs found and fixed during live-testing, not anticipated in planning:** (1) `groupMessages:false`'s original design meant zero historical messages produced zero output items, and n8n does not run downstream nodes on a zero-item input — the `Memory Cold?` branch never fired in exactly the cold-buffer case it exists to detect; fixed by switching to `groupMessages:true` (always exactly one grouped item) + `alwaysOutputData:true` as a safety net. (2) the new `Get Recent History (RPC)` node never got its Supabase credential auto-assigned at creation time (flagged in the build tool's own response, missed until the live test surfaced "Credentials not found") — fixed by explicitly wiring the same `zenny-vault-suparbase` credential every sibling node uses. **Live-verified end to end** against a real conversation with real prior history: cold buffer correctly detected (`messagesCount:0`), 2 real messages fetched from Postgres in order, both correctly inserted into the memory buffer (`{success:true}` × 2). This pattern is per-workflow (the memory node isn't shareable across workflow boundaries) — BC-074/075 must each replicate these 4 nodes, not just call a shared sub-workflow; flagged in `Wiki/platform-quirks/n8n-concurrency-race-patterns.md` so it isn't missed. Full detail there.

**REAL FINDINGS, both closed before/during build:**
1. **Tool wiring split found via Mandatory MCP Verification, not assumed from the design doc:** WF-002/WF-005 are `Webhook`-triggered, not `Execute Workflow Trigger` — `toolWorkflow` requires the latter. `Check_availability` wires as an HTTP Request Tool against WF-002's real webhook URL; `Create_cart` wires as `toolWorkflow` against the newly-built Queue Commerce Cart Verification sub-workflow (which does have a real Execute Workflow Trigger, built for this purpose).
2. **Placeholder-delimiter collision:** the prompt's `{{business_name}}` placeholder collided with n8n's own `{{ }}` expression syntax inside a Set node expression, throwing "invalid syntax". Fixed by changing the DB-stored placeholder to `[[business_name]]` (all 3 seeded copies: `tpl_commerce`, `client_test_002_acme_commerce_test`, `control.agent_prompts`).
3. **No conversational system prompt existed for any archetype** (`agent_prompts` only ever held Email Manager's `classify_email`/`draft_email`) — seeded `commerce_ecom_agent_system`, content genericized from Carmelli's real, already-used Convocore Global Prompt (`05_Platform_Builds/Convocore/BC-071_Carmelli_Build_Package/03_GlobalPrompt_and_Nodes_Spec.md`), not authored from scratch.

**REAL DEPENDENCIES:** `hA0PJmeEzEeLssNC` (BC-072, extended), `Rt9PupfwwV9NMNvS` (this card), WF-002 (called by URL, not modified), `get_client_agent_prompt`/`append_message` RPCs, `openrouter-zm` + `zenny-vault-suparbase` credentials.

**LAST VERIFIED:** BC-073, 2026-08-29 — live, real external calls, not simulated:
- FAQ/availability path: real message → real customer created → real WF-002 call (genuinely returned `available:false`, this test roster's real stock state) → real OpenRouter response, correctly grounded in the tool result → both messages persisted via `append_message`.
- Continuity/guardrail path: a follow-up message on the same conversation ("order 2 sourdough loaves") correctly recalled the prior turn's out-of-stock result from memory and did **not** call `Create_cart` — asked the customer for an alternative instead, matching the system prompt's "use Check availability before promising anything is in stock" instruction. Proves memory continuity and that the guardrail isn't bypassable by skipping the check.
- `Create_cart` tool mechanism itself verified independently via the sub-workflow's own direct test above (this test roster's real store has no in-stock item to trigger it through the full agent flow — a known, disclosed roster limitation, same one WF-002/WF-005's own BC-031 tests already documented).
- **Not fully verified:** `resolve-pending-verification`'s new `CreateCart` branch requires a real dashboard-user JWT (`dashboard_get_my_client()`) to invoke — no real dashboard login exists to test with, the same disclosed limitation BC-053/BC-063 already carry for this Edge Function. The RPC it calls (`insert_client_cart`) is WF-005's own already-proven RPC (BC-031); the new branch's call shape was verified by code review against that proof, not a fresh live call.

Synthetic rows cleaned up after every test.

---

## Referenced In Docs But Not Found As A Real Built Workflow

**ADP-001 Voiceflow Adapter** — n8n_Workflow_Specification_v1.md Part 17 lists this as status "Production," but a full `search_workflows` audit (BC-027, 2026-08-07) found no n8n workflow matching this name or purpose anywhere in the live instance. This is a real doc/reality mismatch, not resolved or investigated further this session (BC-027 is a documentation card) — flagged here for whoever picks up Voiceflow-adapter work next.

---

## Legacy / Explicitly Not Part Of The Current Architecture

The following workflows exist in the n8n instance but are pre-rebuild, unrelated to the current Part 6/7/8/13/17 numbering, and were confirmed as such during BC-026's own live audit (not part of this registry's real per-workflow documentation, listed here only to prevent future confusion with the real `WF-01x` Tool numbering above): `WF-001 — LEAD CREATION ENGINE` (`RJwCyNXEp4HM83il`), `WF-002 — CONVERSION ENGINE` (`VQcBi05xWO8HgqlO`), `WF-003 — ESCALATION ENGINE` (`vBQlUyZwVT5oKmeA`), the `WF-1xx`/`WF-2xx`/`WF-401`/`WF-5xx` series (Appointment/Commerce Recovery Engines, Email Intake/Draft/Approval/Auto-Respond/Label workflows, KPI Engine, Error Logger, Data Validator — all pre-rebuild, all inactive), and the `zenny-gmail-*`/`zenny-calendar-*`/`zenny-oauth-*` single-tenant/multitenant prototype workflows superseded by the real Phase-1 Credential Platform. Also excluded: `Zenny Credential Platform - Provider Router Example` (`yFIlAOvQ3ZeIQXly`, explicitly a template/reference workflow, never a real callable dependency) and assorted personal/test workflows ("My workflow", "AI agent chat," etc.) with no Zenny-architecture relevance.
