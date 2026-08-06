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
workflow listed below live via get_workflow_details.
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

**OUTPUT / END STATE:** Intended success: a new `tool_call_log` row exists in `{client_schema_name}.tool_call_log`. **KNOWN BROKEN (found BC-026):** the one HTTP node POSTs directly to `.../tool_call_log` with a `Content-Profile: {{ client_schema_name }}` header — client schemas are NOT exposed to PostgREST (`PGRST106`), so this call fails every time against any real client schema. `onError: continueRegularOutput` means the failure is silently swallowed rather than surfaced — this workflow has almost certainly never successfully logged anything against a real client.

**REAL DEPENDENCIES:** None.

**LAST VERIFIED:** Never confirmed working against a real client schema. **Not fixed this session (out of BC-027's scope) — needs the same `public`-schema RPC-wrapper treatment BC-026 applied to INT-001/004/005/WF-013/014/015/017.**

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

**KNOWN BROKEN (found BC-026):** both real HTTP nodes (`Check Suppression Records`, `Check Lead Status`) use `Accept-Profile: {{ client_schema_name }}` direct client-schema access — same `PGRST106` failure as UTIL-003. Never successfully executed against a real client schema.

**REAL DEPENDENCIES:** None.

**LAST VERIFIED:** Never confirmed working against a real client schema. **Not fixed this session — needs the same RPC-wrapper treatment.**

---

### UTIL-006 — Zenny Credential Platform - Credential Resolver
**n8n ID:** `LzP5m25iMmhROVsD` · not published

**PURPOSE:** Looks up a client's connection for a given credential category, returns a decrypted token if genuinely connected, otherwise triggers Tool Execution Fallback.

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ client_id, category, tool_name }`

**OUTPUT / END STATE:**
- Success: calls `public.get_client_connection(p_client_id, p_category)` RPC (already `public`-schema, not affected by the PostgREST-exposure bug), then if `connection_id` exists AND `status === 'connected'`, reads the real secret via `public.read_credential_secret` RPC → `{ available: true, token, provider, connection_id }`.
- Failure: `{ available: false }` + calls Tool Execution Fallback with `failure_type: 'credential_error'` and a real reason (`"no client_connections row..."` or `"connection status is X, not connected"`).

**REAL DEPENDENCIES:** Tool Execution Fallback (`UTcdzMvOb7gCQM5J`).

**LAST VERIFIED:** No confirmed live execution test recorded in any session's Session Log to date. Uses only `public`-schema RPCs, so it is NOT expected to be affected by the client-schema-exposure bug — but this has not been directly confirmed by a real execution.

---

### Tool Execution Fallback (Part 7 — unnumbered but real, referenced as the credential-failure terminal path)
**n8n ID:** `UTcdzMvOb7gCQM5J` · not published

**PURPOSE:** Handles a credential/tool-execution failure: retries once if `failure_type === 'retryable'` (2-second wait), otherwise marks the connection `error`, logs an audit event, and notifies a human.

**TRIGGER:** `executeWorkflowTrigger` — no webhook.

**INPUT:** `{ failure_type, tool_name, client_id, category, connection_id, error_reason }`

**OUTPUT / END STATE:**
- Retryable: waits 2s, returns `{ action: 'retry', ...passthrough }`.
- Non-retryable: calls `public.update_connection_status` RPC (sets `status='error'`, stores `last_error`), calls `public.insert_audit_log_event` RPC, **then a Slack node** ("Notify Human (Tool Execution Fallback)"), then returns `{ action: 'notify_human', note: "No generic dashboard-approval degrade path exists yet..." }`.

**KNOWN BROKEN:** the Slack node has no valid credential (per BC-004/BC-008's long-standing gap — no real multi-tenant Slack OAuth app exists) and was never migrated to the Gmail-based UTIL-004 path the way SCH-006's Slack alerts were in BC-025. **This means the credential-failure human-notification path is currently non-functional** — a real credential error would mark the connection `error` and log it correctly, but the human would NOT actually be notified. Flagged here, not fixed this session (out of BC-027's scope).

**REAL DEPENDENCIES:** None directly (calls RPCs + the broken Slack node).

**LAST VERIFIED:** No confirmed live execution test recorded to date.

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
**n8n ID:** `BOxeuH6ehv46FZL0` · not published (webhook exists but workflow is inactive)

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

**KNOWN BROKEN (found BC-026):** the `Check Existing Open Escalation` and `Insert Escalation Row` nodes both use `Content-Profile`/`Accept-Profile: {{ client_schema_name }}` direct client-schema access — same `PGRST106` failure as UTIL-003/UTIL-005. **The entire human-handoff write path (both Stage 1 and Stage 2) is currently non-functional against any real client schema.** The Standard-Request-Contract "normal" path does not touch a client schema at all and is NOT affected.

**REAL DEPENDENCIES:** UTIL-001 (schema resolution for the human-handoff path only), UTIL-004 (Stage-2 notification).

**LAST VERIFIED:** Never execution-tested against a real client schema (confirmed via this session's audit — no execution history shows a successful human-handoff write). The auth/routing logic itself (agent resolution, Bearer check, tool-type routing, Standard Request Contract shape) has not been independently re-verified live this session either — flagged as unconfirmed, not re-tested (out of BC-027's scope; BC-027 is a documentation card, not a fix/verify card for this workflow).

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
