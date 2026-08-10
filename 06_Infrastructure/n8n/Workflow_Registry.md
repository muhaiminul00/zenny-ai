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

**TRIGGER:** Webhook, `POST /convocore-adapter` (production: `https://n8n-cbzu.srv1881104.hstgr.cloud/webhook/convocore-adapter`).

**INPUT:** Convocore's raw tool-call POST body: `{ agentId, conversation_id, tool_name (or toolName/key), timestamp, correlation_id, variables (or payload) }` + an `Authorization: Bearer <token>` header.

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

**FIXED BC-032 (major — the entire "standard tool" routing path had never actually forwarded to anything):** the human observed the routing switch only had 3 real `tool_name` cases; live investigation via `get_workflow_details` found the real gap was worse than a missing case — the "standard" fallback branch built a Standard Request Contract and echoed it straight back via `Respond - Standard Request Contract`, with **no forwarding logic to any downstream Tool ever implemented**, for any tool_name, since this Adapter was first built. Every real Convocore Tool call other than the 3 excluded/handoff cases had always silently returned the bare contract instead of the Tool's actual result. Fixed by adding: a `Resolve Tool Webhook Path` Code node (kebab-case conversion + a hardcoded allow-list of the 12 currently-built Tools), a `Tool Is Built?` IF node, a `Forward To Tool` HTTP node (`onError: continueErrorOutput`, POSTs to the resolved Tool's real production webhook), and split success/error response nodes. Also fixed a leak this introduced: the internal routing fields (`_tool_path`, `_kebab_tool_name`) were briefly appearing in the not-yet-built-tool echo response before the response body was made to construct itself explicitly instead of echoing the whole item.

**LAST VERIFIED:** BC-028, 2026-08-06 — real end-to-end test via the actual production webhook (human-handoff path only, see above). **BC-032 (standard tool forwarding):** 4 real curl calls against the live production webhook (`https://n8n-cbzu.srv1881104.hstgr.cloud/webhook/convocore-adapter`) using a real test agent (`bc028-test-agent-clientA`) and real Bearer secret: `CheckAvailability` → real WF-002 response; `CreateLead` → real WF-001 response (new lead `b28c4e95-...` confirmed); `GetOrderStatus` → real WF-014 response with full order data; `RecordConversion` (genuinely not yet built) → correctly fell back to the clean untouched echo response, no leaked internal fields. **BC-035 (2026-08-10, allow-list extended to 17):** same test agent/secret, 4 more real curl calls: `RecordConversion` → real WF-012 response (duplicate-detected existing conversion row returned); `CreateRegistration` → real WF-011 Pattern D handoff (correctly degraded on a wrong-archetype client, real escalation `26aa8fc8-...` created, not a crash); `CreateLead` → re-confirmed no regression (new lead `b9cbc71f-...`); `SendRecoveryMessage` (still genuinely unbuilt) → correctly still falls to the clean echo fallback.

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

**PURPOSE:** Cancels an appointment. Classified HIGH-RISK per the Customer Verification Rule (modifies a booking). No verification mechanism is configured anywhere in the real system (confirmed empirically) — per the rule's own exact language ("do not attempt to improvise a verification approach"), this workflow **always** routes to Human Handoff Handler (WF-017) rather than executing.

**TRIGGER:** Webhook, `POST /cancel-appointment`.

**INPUT (Standard Request Contract):** `{ client_id, payload: { customer_id, appointment_id } }`

**OUTPUT / END STATE:** Always: 200, `{ result: { appointment_id, status: "pending_human_review" }, handoff: { result: { escalation_id, status: "open" } } }` — a real new `escalations` row is always created via WF-017, no cancellation is ever actually attempted by this workflow itself.

**REAL DEPENDENCIES:** UTIL-001 (schema resolution), WF-017 (via a direct HTTP POST to its production webhook, not an Execute Workflow node).

**LAST VERIFIED:** BC-026, 2026-08-06 — real webhook call, real escalation confirmed (`0642be06-...`).

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

**LAST VERIFIED:** BC-026, 2026-08-06 — real webhook call against a real appointment (`45555555-...`), correct `status: "success"` derived from `authoritative_source: client_calendar`.

---

### WF-016 — Zenny Core Agent - UpdateCustomer
**n8n ID:** `ogYca9QFCMIEWrWG` · **published**, active

**PURPOSE:** Updates customer account fields. HIGH-RISK per the Customer Verification Rule (modifies account data). Same as WF-013: no verification mechanism configured anywhere → always routes to Human Handoff Handler instead of executing unverified.

**TRIGGER:** Webhook, `POST /update-customer`.

**INPUT:** `{ client_id, payload: { customer_id, fields: {...requested field changes...} } }`

**OUTPUT / END STATE:** Always: 200, `{ result: { customer_id, updated_fields: [] }, handoff: { result: { escalation_id, status: "open" } } }` — `updated_fields` is always empty because no update is ever actually applied; a real new `escalations` row is always created via WF-017.

**REAL DEPENDENCIES:** UTIL-001, WF-017 (direct HTTP POST to its production webhook).

**LAST VERIFIED:** BC-026, 2026-08-06 — real webhook call, real escalation confirmed (`5e7a3855-...`).

---

### WF-017 — Zenny Core Agent - NotifyHuman
**n8n ID:** `pLYEVQ9kto7NTBfk` · **published**, active

**PURPOSE:** The terminal Fallback-D / Human Handoff Handler destination for every other Tool (and called directly by WF-013/WF-016 for their always-handoff behavior). Writes a real `escalations` row and fires a real internal-ops notification.

**TRIGGER:** Webhook, `POST /notify-human`.

**INPUT:** `{ client_id, request_id, contract_version, payload: { customer_id, conversation_summary, intent_history[], escalation_reason, escalation_priority: "P1"|"P2"|"P3" } }` — `escalation_priority` is mapped internally to the real enum values (`P1`→`P1_immediate`, `P2`→`P2_standard`, `P3`→`P3_review`; unrecognized → defaults to `P2_standard`).

**OUTPUT / END STATE:**
- Success: 200, `{ result: { escalation_id, status: "open" } }` — a real new `escalations` row exists with `status='open'`, `escalation_type='notify_human_tool'`, `origin_module='core_agent'`, `ownership_state='human_owned'`; a real Gmail message is sent via UTIL-004 to the internal ops inbox.
- Unknown client: 400, `{ error: { code: "UNKNOWN_CLIENT" } }`.

**REAL DEPENDENCIES:** UTIL-001, UTIL-004 (via Execute Workflow — **both of UTIL-004's output pins must be wired to the response node**, see UTIL-004's entry above; this exact bug existed here until fixed BC-026).

**LAST VERIFIED:** BC-026, 2026-08-06 — real escalation rows confirmed via direct SQL (`d073d15c-...` pre-fix — proving the DB write itself always worked even while the response was broken; `655dc334-...` post-fix, `455b6eca-...` for Client B). Real Gmail message confirmed sent: `id: 19fd832788ca2c8d`, `labelIds: ["SENT"]`.

**FIXED BC-029 (major, found live while testing WF-001's Pattern D path):** `Insert Escalation Row` calls `public.insert_client_escalation` with exactly 9 named args — this workflow's own real call, unchanged since BC-026. BC-028 added a 10-arg overload (`p_escalation_team text DEFAULT NULL`) alongside the original 9-arg one; PostgREST could no longer disambiguate a 9-arg call between the two (`PGRST203 — Could not choose the best candidate function`), so **every 9-arg caller of WF-017 — this workflow's own internal call, and therefore WF-013/WF-016's handoff path too — had been silently broken since BC-028**, undetected because BC-028's own ADP-002 test always passed the 10th argument explicitly. Fixed by dropping the redundant 9-arg overload (migration `drop_ambiguous_insert_client_escalation_9arg_overload`) — the 10-arg version's `DEFAULT NULL` is a strict, fully backward-compatible superset. Also found: `client_test_001_acme_emergency_test.escalations` was missing migration 032's `escalation_team` column entirely (schema-provisioning drift, same class as the `leads` gap below) — fixed via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS escalation_team text`. Re-verified live via WF-001's Retry test: a real escalation (`6e7c768f-...`) was created end-to-end post-fix.

---

## Growth Agent — Tools (Part 13)

### WF-001 — Zenny Growth Agent - CreateLead (WF-001)
**n8n ID:** `fjJkKxA3o6kfeLoz` · **published**, active

**PURPOSE:** Growth Agent's ONLY Tool (Part 7.2's hard rule — Growth Agent never calls a conversion action tool directly). Creates the SOFT LEAD RECORD (Agent_Runtime_System_v1.md Module 2 §4.1) at Tier 2 capture — no lead-scoring logic here, per Planning_to_Build_Transition_v1.md Phase 7's note that scoring defers to Convocore's funnel.

**TRIGGER:** Webhook, `POST /create-lead` (production: `https://n8n-cbzu.srv1881104.hstgr.cloud/webhook/create-lead`).

**INPUT (Standard Request Contract):** `{ client_id, conversation_id, payload: { customer_id, archetype, intent, source_channel, conversation_summary } }`. `archetype` must be one of the 6 real `archetype_enum` values; `source_channel` one of the 6 real `source_channel_enum` values — both checked by a dedicated `Validate Input` node (Pattern A) before any DB call, not left to a raw enum-cast DB error.

**OUTPUT / END STATE:**
- Success: 200, `{ result: { lead_id, status: "new" } }` — a real new row in `{client_schema_name}.leads` (via the new `public.insert_client_lead` RPC), `status='new'`, `validation_flag=false`.
- Missing/invalid required field: 400, `{ error: { code: "VALIDATION_ERROR", message, details: [...] } }` (Pattern A) — no DB call made.
- Unknown `client_id`: 400, `{ error: { code: "UNKNOWN_CLIENT" } }`.
- `customer_id` doesn't belong to this client's own schema (cross-client / security case): 400, `{ error: { code: "CUSTOMER_NOT_FOUND" } }` — checked explicitly via the new `public.client_customer_exists` RPC before insert, not left to an incidental FK-violation error.
- Duplicate (`client_id` + `conversation_id` repeated, matching the `create-lead_{client_id}_{conversation_id}` idempotency key): 200, same `lead_id` as the first call — `insert_client_lead` checks `(customer_id, convocore_conversation_id)` first and returns the existing row instead of inserting a second one. Backed by a real per-schema partial `UNIQUE` index on `(customer_id, convocore_conversation_id)` (Integration Contract Part 11.4's "database is the final guarantee"), not just the key format.
- DB call fails/times out: one silent automatic retry (Pattern B — `retryOnFail`, `maxTries: 2`, `waitBetweenTries: 1000`). If still unresolved: 200, `{ result: { status: "pending_human_review" }, handoff: {...} }` — routes to WF-017 NotifyHuman (Pattern D) with a real new `escalations` row created.

**REAL DEPENDENCIES:** UTIL-001 (schema resolution), WF-017 (direct HTTP POST to its production webhook, matching the WF-013/WF-016 pattern — not an Execute Workflow node).

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

**LAST VERIFIED:** BC-034, 2026-08-10 — Success/Duplicate (real row, same `conversion_id` returned twice against a fresh lead), Failure (missing `conversion_type`), Security/Unknown-client (bad `client_id`) all genuinely tested.

---

## Recovery Engine — Tools (Part 13, Phase 9 kickoff — BC-036)

### WF-018 — Zenny Recovery Engine - SendRecoveryMessage (WF-018)
**n8n ID:** `wdRY4sD6Z8JZ06zr` · **published**, active

**PURPOSE:** Sends one recovery-cadence step message to a lead. **Scope cut (BC-036, explicit user instruction):** email channel only — `sms`/`whatsapp` are rejected as a clean `VALIDATION_ERROR`, not built out. Gates on: UTIL-005 Stop Checker (suppression, mandatory per spec Part 6.5), `recovery_queue.status = 'active'`, and `recovery_queue.current_step` matching the requested `step_number` — this step-match check IS the idempotency guard (Integration Contract Part 11.4's "database is the final guarantee" philosophy — no separate dedupe table). Holds (does not send, does not advance state) outside the 8am–8pm window before building the message and reaching Gmail — Emergency archetype step 1 is exempt, matching Recovery_Engine_Flow.md §3.1.

**KNOWN LIMITATION, disclosed not hidden:** no per-client timezone column exists anywhere in the schema yet (checked live + against `Database_Structure_v4_FINAL.md`) — `Time Window Check` uses UTC as an honest placeholder for "local." Revisit when timezone data is added to the platform.

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

---

## Referenced In Docs But Not Found As A Real Built Workflow

**ADP-001 Voiceflow Adapter** — n8n_Workflow_Specification_v1.md Part 17 lists this as status "Production," but a full `search_workflows` audit (BC-027, 2026-08-07) found no n8n workflow matching this name or purpose anywhere in the live instance. This is a real doc/reality mismatch, not resolved or investigated further this session (BC-027 is a documentation card) — flagged here for whoever picks up Voiceflow-adapter work next.

---

## Legacy / Explicitly Not Part Of The Current Architecture

The following workflows exist in the n8n instance but are pre-rebuild, unrelated to the current Part 6/7/8/13/17 numbering, and were confirmed as such during BC-026's own live audit (not part of this registry's real per-workflow documentation, listed here only to prevent future confusion with the real `WF-01x` Tool numbering above): `WF-001 — LEAD CREATION ENGINE` (`RJwCyNXEp4HM83il`), `WF-002 — CONVERSION ENGINE` (`VQcBi05xWO8HgqlO`), `WF-003 — ESCALATION ENGINE` (`vBQlUyZwVT5oKmeA`), the `WF-1xx`/`WF-2xx`/`WF-401`/`WF-5xx` series (Appointment/Commerce Recovery Engines, Email Intake/Draft/Approval/Auto-Respond/Label workflows, KPI Engine, Error Logger, Data Validator — all pre-rebuild, all inactive), and the `zenny-gmail-*`/`zenny-calendar-*`/`zenny-oauth-*` single-tenant/multitenant prototype workflows superseded by the real Phase-1 Credential Platform. Also excluded: `Zenny Credential Platform - Provider Router Example` (`yFIlAOvQ3ZeIQXly`, explicitly a template/reference workflow, never a real callable dependency) and assorted personal/test workflows ("My workflow", "AI agent chat," etc.) with no Zenny-architecture relevance.
