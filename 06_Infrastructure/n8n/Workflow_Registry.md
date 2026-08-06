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
helper added.
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

**OUTPUT / END STATE:**
- Connection exists and connected: calls `public.get_client_connection` RPC, then checks `Token Expiring Soon?` (`!token_expires_at || token_expires_at <= now+5min`).
  - Not expiring: reads the existing secret directly via `public.read_credential_secret` → `{ available: true, token, provider, connection_id }`.
  - Expiring or already expired: calls the new `Zenny Shared Utility - Refresh Connection Token` (UTIL-007) synchronously first. If that succeeds, reads the freshly-stored secret and returns the same `{ available: true, ... }` shape with a genuinely new token. If the refresh itself fails, calls Tool Execution Fallback with `failure_type: 'credential_error'` and reason `"synchronous token refresh failed at time of use: ..."`.
- No connection / not connected: `{ available: false }` + calls Tool Execution Fallback with a real reason (`"no client_connections row..."` or `"connection status is X, not connected"`).

**Design intent (BC-028):** SCH-006 (see its own entry above for the real 2-hour interval + the separate 7-day Google Testing-mode constraint) remains the normal-case optimization that keeps most tokens pre-warmed; this synchronous check is the correctness guarantee that closes the real gap between sweep runs (a 2-hour sweep interval + a 1-hour Google access-token lifetime genuinely produces a dead-token window every cycle). A deliberate hybrid, not a replacement of the sweep. SCH-006 itself was NOT refactored to call the new UTIL-007 refresh helper this session (its own inline refresh logic still works and was left untouched) — a possible future consolidation, not required for this card's fix.

**FIXED BC-028 (major — this workflow had never been execution-tested before this session, confirmed by real "Credentials not found" errors on 3 separate nodes):** `Get Client Connection`, `Read Token Secret`, and (before the redesign) the general flow all had zero credential attached — none of these were ever real, working Supabase calls until this session. Also fixed: `Read Token Secret` had no `responseFormat` set (same bare-text-scalar-with-object+json-header bug hit repeatedly this session) — forced `text`, and `Resolved Credential`'s `token` assignment updated to read `$json.data` instead of the whole `$json`.

**REAL DEPENDENCIES:** UTIL-007 Refresh Connection Token (new, BC-028), Tool Execution Fallback (`UTcdzMvOb7gCQM5J`).

**LAST VERIFIED:** BC-028, 2026-08-06 — **first-ever confirmed live execution of this workflow.** Tested against a REAL production connection (Client A's `google`/`email` connection) that happened to be genuinely expired at test time (not artificially forced) — confirmed a real, fresh Google access token (`ya29....`) was returned, and real DB state showed `token_expires_at` updated to ~1 hour in the future (matching Google's real access-token lifetime) with a fresh `updated_at`. This was a real production fix, not a disposable test — the connection is now genuinely healthy again.

---

### UTIL-007 — Zenny Shared Utility - Refresh Connection Token (new, BC-028)
**n8n ID:** `NiBCdKzb0pkvWBQn` · **published**, active

**PURPOSE:** Shared synchronous token-refresh helper, extracted from SCH-006's real per-provider refresh logic so UTIL-006 (and, in future, SCH-006 itself if refactored) has one canonical place to call rather than reimplementing the refresh HTTP calls a second time. Not itself given a formal Part 6 number in the spec docs — a new BC-028 addition, numbered here for registry clarity only.

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ connection_id, client_id, category, provider, refresh_token_secret_id }`

**OUTPUT / END STATE:**
- Success (`google` only — see scope note below): reads the refresh token secret, the OAuth app's client_id, and its client secret; POSTs to `https://oauth2.googleapis.com/token`; on success, stores the new access token via `store_credential_secret` and calls `update_connection_tokens` (1-hour expiry, matching Google's real access-token lifetime) → `{ refreshed: true, access_token_secret_id, token_expires_at }`.
- Refresh failure (Google returned an error): `{ refreshed: false, error }`.
- Any other provider (`calendly`, `cal_com`, anything else): `{ refreshed: false, error: "unsupported provider for synchronous refresh: ..." }` — **NOT YET IMPLEMENTED**, a real, deliberate scope cut for this session (Google is the only provider with real, currently-tested credentials across every prior session; Calendly/Cal.com are still `testing`/`pending` app status). Flagged for a future card, not silently left unhandled — the fallback branch returns a clear, honest error rather than crashing or guessing.

**REAL DEPENDENCIES:** None directly (calls Google's real token endpoint + `public` RPCs).

**LAST VERIFIED:** BC-028, 2026-08-06 — verified indirectly via UTIL-006's real E2E test (the Google branch is the one that actually ran and succeeded, confirmed via real DB state). Not directly execution-tested in isolation, nor has the Calendly/Cal.com fallback branch been exercised.

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
- Standard tool → 200, the full built Standard Request Contract object (`request_id`, `contract_version: 'v1'`, `correlation_id`, `client_id`, `conversation_id`, `runtime_module: null` — deliberately never inferred, per Part 8 — `tool_name`, `timestamp`, `idempotency_key`, `payload`, `authentication.bearer_verified: true`).

**FIXED BC-028 (major — the entire human-handoff path was non-functional, and several more real bugs surfaced once real test data existed for the first time ever):**
1. `Check Existing Open Escalation` and `Insert Escalation Row` both used `Content-Profile`/`Accept-Profile` direct client-schema access — same `PGRST106` failure as UTIL-003/UTIL-005. Rewired to two new `public` RPCs: `client_has_open_escalation` (returns the open row or `null`) and a newly-overloaded `insert_client_escalation` (10-arg version adding `p_escalation_team`, fully backward-compatible with WF-017's existing 9-arg calls — Postgres correctly resolves each call to the matching overload).
2. `control.convocore_agent_map` had **zero table-level grants** for `authenticated`/`service_role` at all — a real, separate infrastructure gap (the BC-026 schema-`USAGE` fix opened the schema door but this specific table's own grants were never added). Fixed via `GRANT SELECT ON control.convocore_agent_map`. This had never been caught because no real `convocore_agent_map` row existed anywhere until this session.
3. `Agent Known?` and 4 downstream nodes/expressions (`Read Agent Secret`, `Resolve Client Schema`'s input, `Build Standard Request Contract`'s Code node, the Stage-2 notification message) all assumed the agent-lookup response was still a `[0]`-indexed array — the same array-unwrap bug class as BC-026's INT-002 finding. Never caught because no real row ever hit the "found" branch before. All fixed to reference the object directly.
4. `Read Agent Secret` had no `responseFormat` set, and the Bearer comparison referenced the wrong shape depending on format — resolved to `responseFormat: text` + comparing against `$json.data`.
5. `Insert Escalation Row`'s `p_schema` reference (`$json.client_schema_name`) broke because `Check Existing Open Escalation`'s own HTTP response replaces the item's `.json` entirely — fixed to reference the schema-resolver node explicitly via `$('Resolve Client Schema (UTIL-001)')`.
6. The Stage-2 `Fire Stage 2 Notification (UTIL-004)` → `Respond - Stage 2 Notification Fired` connection had the same single-output-pin gotcha fixed elsewhere this session — wired both pins.

**REAL DEPENDENCIES:** UTIL-001 (schema resolution for the human-handoff path only), UTIL-004 (Stage-2 notification).

**LAST VERIFIED:** BC-028, 2026-08-06 — real end-to-end test via the actual production webhook, using a real (test-marked) `convocore_agent_map` row + a real stored Bearer secret. Stage 1: real Bearer auth passed, real `escalations` row created (`escalation_team: 'ops_team'` confirmed via direct SQL). Stage 2 (repeat call, same customer): correctly detected the existing open escalation, did NOT create a duplicate (confirmed exactly one row via SQL), fired a real UTIL-004 notification. The Standard-Request-Contract "normal" tool-call path was not independently re-tested this session (out of BC-028's stated scope, which was specifically the human-handoff path) but shares no code with the parts that were fixed.

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

---

## Referenced In Docs But Not Found As A Real Built Workflow

**ADP-001 Voiceflow Adapter** — n8n_Workflow_Specification_v1.md Part 17 lists this as status "Production," but a full `search_workflows` audit (BC-027, 2026-08-07) found no n8n workflow matching this name or purpose anywhere in the live instance. This is a real doc/reality mismatch, not resolved or investigated further this session (BC-027 is a documentation card) — flagged here for whoever picks up Voiceflow-adapter work next.

---

## Legacy / Explicitly Not Part Of The Current Architecture

The following workflows exist in the n8n instance but are pre-rebuild, unrelated to the current Part 6/7/8/13/17 numbering, and were confirmed as such during BC-026's own live audit (not part of this registry's real per-workflow documentation, listed here only to prevent future confusion with the real `WF-01x` Tool numbering above): `WF-001 — LEAD CREATION ENGINE` (`RJwCyNXEp4HM83il`), `WF-002 — CONVERSION ENGINE` (`VQcBi05xWO8HgqlO`), `WF-003 — ESCALATION ENGINE` (`vBQlUyZwVT5oKmeA`), the `WF-1xx`/`WF-2xx`/`WF-401`/`WF-5xx` series (Appointment/Commerce Recovery Engines, Email Intake/Draft/Approval/Auto-Respond/Label workflows, KPI Engine, Error Logger, Data Validator — all pre-rebuild, all inactive), and the `zenny-gmail-*`/`zenny-calendar-*`/`zenny-oauth-*` single-tenant/multitenant prototype workflows superseded by the real Phase-1 Credential Platform. Also excluded: `Zenny Credential Platform - Provider Router Example` (`yFIlAOvQ3ZeIQXly`, explicitly a template/reference workflow, never a real callable dependency) and assorted personal/test workflows ("My workflow", "AI agent chat," etc.) with no Zenny-architecture relevance.
