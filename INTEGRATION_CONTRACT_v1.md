# Execution Layer Integration Contract v1

```
Status:    APPROVED — Architecture Freeze (v1.0)
Purpose:   Wire-level contract between Agent Runtime and Execution Layer (n8n)
Position:  Fifth foundational document. Sits beneath n8n_Execution_Architecture_v1.md,
           above n8n_Workflow_Specification_v1 (not yet written).
Revision:  Reviewed and frozen with 5 additions: Canonical Request Lifecycle (Part
           2.1), correlation_id ownership (Part 5.2), reserved contract_version
           field (Part 5), Mandatory Utility Order (Part 13.3), reserved Future
           Event Contract (Part 21.5).
Supersedes: The prior INTEGRATION_CONTRACT_v1.md draft (Airtable/Voiceflow-only,
           Demo Sprint 01 scope) — that draft predates the Supabase schema-per-client
           architecture and the frozen Execution Architecture. Retained only as
           historical reference for its field-naming discipline, not as a source of
           truth for anything below.
Gate:      Per Execution Architecture Part 22.5, this document must exist and be
           reviewed before n8n Workflow Specification v1 / workflow building begins.
```

---

## Relationship With Other Documents

```
Agent Runtime System v1              (defines WHAT should happen)
        ↓
Database Structure v4 FINAL          (defines WHAT is stored)
        ↓
n8n Execution Architecture v1        (defines execution PRINCIPLES — Part 15
        ↓                            states the contract's structure only)
Execution Layer Integration Contract (THIS DOCUMENT — defines the wire-level
        ↓                            DETAIL: exact JSON, headers, codes, keys)
n8n Workflow Specification v1        (defines actual workflows, not yet written)
```

This document is implementation-independent in principle (Part 1.9 of the Execution
Architecture), but every concrete example below reflects the *current* implementation:
n8n as Execution Layer, Supabase/PostgREST as Database Layer, Voiceflow as the
production Adapter, Convocore as a prospective Adapter.

---

# PART 1 — Purpose & Scope

## 1.1 Purpose

This document answers, concretely:

- How does Runtime call a Tool?
- What exact fields must every request contain?
- How does n8n identify the client and resolve the correct schema?
- How are results returned?
- How are errors classified and reported?
- How are retries and duplicate executions prevented?
- What does every builder need to stop guessing about?

## 1.2 What This Document Is Not

Not a workflow specification (see `n8n_Workflow_Specification_v1`, not yet written).
Not a restatement of *why* these principles exist (see `n8n_Execution_Architecture_v1.md`
Parts 9–15) — this document assumes that reasoning and states only the resulting contract.

## 1.3 Golden Rule

Every system speaks the same field names. A field defined here as `client_id` is
`client_id` in the Runtime request, `client_id` in n8n's internal references, and
`client_id` in every log entry — never re-labeled per layer.

---

# PART 2 — Integration Philosophy

> **Runtime communicates with Tools, not workflows.**

Runtime knows: `BookAppointment`.
Runtime never knows: which n8n workflow ID handles it, which node calls Google
Calendar, which node writes to Supabase, or how many internal steps exist.

This is Execution Architecture Part 12.1's Tool/Workflow distinction, restated as a
hard contract boundary: nothing on the Runtime side of this document may reference
n8n implementation detail, and nothing on the Execution side may require Runtime to
supply anything beyond what Part 5 defines.

---

# PART 2.1 — Canonical Request Lifecycle

Every Tool Request, regardless of tool, follows this exact sequence inside the
Execution Layer. This is the canonical lifecycle every builder implements — no
workflow skips, reorders, or substitutes a step:

```
Receive Request
   ↓
Authenticate                 (Part 6 — fail fast, before any DB round-trip)
   ↓
Validate Envelope            (Part 5 — required fields, Data Validator utility)
   ↓
Resolve Schema                (Part 7 — Accept-Profile / Content-Profile)
   ↓
Check Idempotency              (Part 11 — return prior result if key seen)
   ↓
Execute Tool                    (Business Workflow, Folders 01–05)
   ↓
Retry (if applicable)            (Part 10 — only on Retryable Error / Timeout)
   ↓
Log                               (Part 13 — tool_call_log row)
   ↓
Respond                            (Part 8 success / Part 9 error)
```

This matches the Universal Workflow Pattern already defined in Execution
Architecture Part 8 (`Receive → Validate → Authenticate → Resolve Schema →
Execute → Log → Respond`), with Idempotency and Retry made explicit as their own
steps for contract purposes. Authenticate precedes Validate/Resolve Schema for the
same reason stated there: fail fast before any DB round-trip.

---

# PART 3 — System Communication Model

```
Customer
   ↓
Conversation Platform (Voiceflow / Convocore)
   ↓
Platform Adapter (Folder 08 — translation only)
   ↓
Agent Runtime System (decides WHAT)
   ↓
Tool Request                              ← PART 5 of this document
   ↓
Execution Layer Entry Workflow (n8n)
   ↓
Shared Utilities (Schema Resolver, Data Validator, Error Logger,
                   Notification Router, Stop Checker)
   ↓
Business Workflow (Folders 01–05, per Runtime module ownership)
   ↓
External Systems / Supabase (schema-targeted per PART 7)
   ↓
Standard Response                          ← PART 8 of this document
   ↓
Runtime → Adapter → Conversation Platform → Customer
```

---

# PART 4 — Tool Contract

## 4.1 Tool Identity

Every request carries a `tool_name` — a stable, Runtime-facing, platform-independent
label. Per Execution Architecture 12.4, examples already in use: `BookAppointment`,
`CreateLead`, `UpdateCustomer`, `SendEmail`, `TriggerRecovery`, `RecordConversion`.

**Tool Name vs. Webhook Identifier — these are related but not identical:**

| Layer | Format | Example |
|---|---|---|
| Runtime-facing Tool Name (this contract) | PascalCase | `BookAppointment` |
| n8n webhook/tool identifier (`Tool_Naming_Convention.md`) | kebab-case verb-entity | `create-appointment` |

A Tool Request's `tool_name` field uses the PascalCase Runtime-facing form. The Entry
Workflow it routes to is named per `Tool_Naming_Convention.md`'s verb-entity registry.
Mapping between the two is an Execution Layer routing concern — Runtime never needs
to know the kebab-case form exists.

## 4.2 Tool Ownership — Real Registry

Every Tool belongs to exactly one Runtime module, per the Module Responsibility
Contract (Agent Runtime System Step 1D.0.5). This is the actual registry, drawn from
`Tool_Naming_Convention.md`'s archetype-grounded examples — not invented placeholders:

| Tool Name (Runtime-facing) | Webhook ID | Owning Module |
|---|---|---|
| `CheckAvailability` | `check-availability` | Conversion Engine |
| `CreateCart` | `create-cart` | Conversion Engine |
| `CreateReservation` | `create-reservation` | Conversion Engine |
| `CreateWaitlistEntry` | `create-waitlist-entry` | Conversion Engine |
| `CreateAppointment` | `create-appointment` | Conversion Engine |
| `CreateBookingRequest` | `create-booking-request` | Conversion Engine |
| `CancelAppointment` | `cancel-appointment` | Core Agent (Support Handler, post-handoff) |
| `CreateCallbackQueueEntry` | `create-callback-queue-entry` | Conversion Engine |
| `CreateInspectionSlotBooking` | `create-inspection-slot-booking` | Conversion Engine |
| `CreateScoredBooking` | `create-scored-booking` | Conversion Engine |
| `CreateRegistration` | `create-registration` | Conversion Engine |
| `GetOrderStatus` | `get-order-status` | Core Agent (Support Handler) |
| `GetBookingStatus` | `get-booking-status` | Core Agent (Support Handler) |
| `SendRecoveryMessage` | `send-recovery-message` | Recovery Engine (exclusive owner) |
| `SendEmailReply` | `send-email-reply` | Email Manager (exclusive owner of `send-*` email tools) |
| `NotifyHuman` | `notify-human` | Core Agent (Human Handoff Handler, exclusive owner) |
| `CreateLead` | `create-lead` | Growth Agent → handoff only; Conversion Engine executes |
| `UpdateCustomer` | `update-customer` | Core Agent |

**Hard rules carried forward from `Tool_Naming_Convention.md`:**
- Growth Agent never calls an action tool directly — its role ends at handoff (Module
  2 §3); every `Create*` tool fires only after control passes to Conversion Engine.
- `NotifyHuman` is called only by Core Agent's Human Handoff Handler — Growth Agent
  and Conversion Engine reclassify and transfer per Step 1E rather than calling it.
- This table is illustrative of the real, already-decided registry — not exhaustive.
  The complete inventory lives in `n8n_Workflow_Specification_v1` (not yet written);
  new tools are proposed against `Tool_Naming_Convention.md`'s verb vocabulary first.

## 4.3 Tool Lifecycle

Per Agent Runtime System Step 1D.3 (Action Tool Execution Contract), restated as the
binding lifecycle every Tool Request follows:

```
REQUESTED  → no customer-facing confirmation sent yet
    ↓
WAITING    → call in flight; Runtime never proceeds as if a result exists;
             this state cannot be skipped
    ↓
SUCCESS    → standard success response (Part 8)
FAILED     → standard error response (Part 9), fallback pattern applied
TIMEOUT    → treated as FAILED for fallback purposes, logged distinctly;
             one silent retry attempted first (Part 10) before this state
             is reported upward
```

**Universal rule:** Runtime never confirms an action to the customer while a Tool
Request is in `WAITING`.

## 4.4 Breaking Changes

A Tool's contract, once published, is never silently redefined. A breaking interface
change publishes a new Tool Name with a `-v2` suffix or version field (Part 16) —
existing integrations against `CreateAppointment` must not change behavior underneath
the same name.

---

# PART 5 — Request Contract

## 5.1 Standard Request Structure

```json
{
  "request_id": "uuid",
  "contract_version": "v1",
  "correlation_id": "uuid",
  "client_id": "uuid",
  "conversation_id": "uuid",
  "runtime_module": "conversion_engine",
  "tool_name": "CreateAppointment",
  "timestamp": "2026-07-18T09:30:00Z",
  "idempotency_key": "string",
  "payload": {},
  "authentication": {}
}
```

Additional fields may be added without breaking backward compatibility (Execution
Architecture 15.3). No field listed here may be removed or renamed without a
Contract version bump (Part 16).

## 5.2 Field Definitions

| Field | Type | Required | Purpose |
|---|---|---|---|
| `request_id` | uuid | Yes | Unique identifier for this specific execution request |
| `contract_version` | string | Yes | Version of this contract the request was built against (Part 16.2). Reserved now to prevent mixed-deployment ambiguity later — value is `"v1"` for every request under this document. |
| `correlation_id` | uuid | Yes | Traces one logical operation across Runtime → n8n → Database → logs (Part 15.5 of Execution Architecture). **Ownership: Runtime always generates `correlation_id`. Downstream layers (n8n, Adapters, Database) echo it — they must never replace, regenerate, or override it.** |
| `client_id` | uuid | Yes | Tenant identifier — resolves to `client_schema_name` via `control.clients` (Part 7) |
| `conversation_id` | uuid | Yes | The live conversation/session this request originated from |
| `runtime_module` | enum | Yes | One of the 5 canonical modules (Part 5.3) |
| `tool_name` | string | Yes | PascalCase Tool Name (Part 4.1) |
| `timestamp` | ISO 8601 | Yes | Request creation time, UTC |
| `idempotency_key` | string | Yes for tools listed in Part 11.2; optional otherwise | Duplicate-execution guard |
| `payload` | object | Yes | Tool-specific data — see per-tool schemas in `n8n_Workflow_Specification_v1` |
| `authentication` | object | Yes | Per Part 6 |

## 5.3 `runtime_module` — Exact Values

Matches `module_name_enum` as implemented in the database (`current_state.sql`,
`Database_Structure_v4_FINAL.md`):

```
core_agent | growth_agent | conversion_engine | recovery_engine | email_manager
```

## 5.4 Payload — Example

```json
{
  "payload": {
    "customer_id": "uuid",
    "archetype": "appointment",
    "service": "consultation",
    "preferred_date": "2026-07-20",
    "preferred_time": "15:00"
  }
}
```

Payload shape is tool-specific. `n8n_Workflow_Specification_v1` will define the
canonical payload schema per Tool; this document defines only the envelope.

---

# PART 6 — Authentication Contract

## 6.1 Runtime → n8n

```
Runtime → Signed Request → n8n Webhook Validation → Execution Allowed/Denied
```

**Current mechanism (Voiceflow, production):** static `x-webhook-secret` header.

**⚠️ Known technical debt, carried forward from Execution Architecture Part 18.6 —
not resolved by this document:** the current secret is a static, hardcoded, single
value — adequate for demo scope, not a real multi-client security model. A proper
secret-management upgrade (e.g., per-client or rotating credentials) is required
before broader production use. **This must be verified against current n8n
credential-store capabilities before the Workflow Specification is written** — flagged
per user instruction as needing live confirmation, not assumed from this document.

**Future:** OAuth or per-client signed tokens — not yet designed, tracked as an open
item, not a v1 requirement.

## 6.2 n8n → Supabase

Per `Database_API_Reference.md` §1 — **hard rule, not a convenience choice**: n8n uses
the `service_role` key exclusively for every database operation, stored in n8n's
credential store, never hardcoded into a node's parameters or expression. Every table
in every schema has RLS enabled with zero policies (default-deny); `anon` and
`authenticated` have zero grants anywhere in this database. `service_role` is the only
role with `rolbypassrls = true`.

## 6.3 n8n → External Services (Calendar, Email, CRM)

Per-service credentials stored in n8n's credential store, referenced by node, never
inlined. Exact credential requirements per external service belong to
`n8n_Workflow_Specification_v1`.

---

# PART 7 — Schema Resolution Contract

## 7.1 Mechanism — Exact, Not Conceptual

Per `Database_API_Reference.md` §2 and Execution Architecture Part 7.4, empirically
verified against the live project:

```
Accept-Profile:   {schema_name}    — GET / HEAD requests
Content-Profile:  {schema_name}    — POST / PATCH / PUT / DELETE requests
```

Omitting the header defaults to `public` — never rely on this default implicitly.
Every node touching a client schema sets the header explicitly, every execution.

## 7.2 Resolution Flow

```
client_id (from Request Contract, Part 5)
   ↓
GET /rest/v1/clients?select=client_schema_name&client_id=eq.{client_id}
Accept-Profile: control
   ↓
client_schema_name (result)
   ↓
Every subsequent node's Accept-Profile / Content-Profile set from this
lookup result via expression — never a literal string typed into the header field
```

## 7.3 Verified Failure Modes

| Response | Meaning | Fix |
|---|---|---|
| `406` / `PGRST106` "Invalid schema" | Schema not registered in Exposed Schemas | Complete the manual Exposed-Schemas step (`Database_API_Reference.md` §4) — never a code change |
| `401` / `42501` "permission denied" | Correct schema, wrong role/key | Check credential is `service_role`, not `anon` |

## 7.4 Rules

- No workflow assumes `public`, `default`, `current`, or `previous` schema.
- No cross-client operations — every FK resolves within-schema, never cross-schema
  (verified throughout Phase B/C).
- `control` schema access uses `Accept-Profile: control` explicitly — it is not
  exposed by default and requires the same manual registration as any client schema.

---

# PART 8 — Response Contract

## 8.1 Standard Success Response

```json
{
  "success": true,
  "status": "completed",
  "correlation_id": "uuid",
  "request_id": "uuid",
  "tool_name": "CreateAppointment",
  "timestamp": "2026-07-18T09:30:04Z",
  "result": {},
  "warnings": []
}
```

## 8.2 Standard Failure Response

See Part 9.2 — failure responses are the Error Contract, not a variant of this one.

## 8.3 Field Definitions

| Field | Type | Purpose |
|---|---|---|
| `success` | boolean | Top-level outcome |
| `status` | enum | `completed`, `failed`, `timeout` — mirrors Part 4.3 lifecycle terminal states |
| `correlation_id` | uuid | Echoed from the request |
| `request_id` | uuid | Echoed from the request |
| `result` | object | Tool-specific business result (e.g., `appointment_id`, `calendar_event_id`) |
| `warnings` | array | Non-fatal issues (e.g., validation-flagged input accepted per Fallback Pattern A) |

## 8.4 Platform Independence

This structure is identical regardless of caller (Voiceflow, Convocore, future
LangGraph). Platform-specific formatting is an Adapter concern (Part 17), never
present in this response.

---

# PART 9 — Error Contract

## 9.1 The 5 Error Categories

Exactly as defined in Execution Architecture Part 9.3 — this document does not
introduce a different taxonomy:

```
Validation Error    — malformed/missing input
Authorization Error — trust/security boundary hit
Retryable Error      — temporary API failure, network timeout, service unavailable
Permanent Error      — unknown customer, invalid configuration, missing resource
System Error         — unexpected exception, internal workflow failure
```

## 9.2 Standard Error Response

```json
{
  "success": false,
  "error_type": "retryable_error",
  "message": "",
  "correlation_id": "uuid",
  "request_id": "uuid",
  "retryable": true
}
```

## 9.3 Mapping to Fallback Pattern Catalog — Exact, Not Reinvented

Per Execution Architecture 9.4, restated here as the binding mapping every Adapter
and Runtime module relies on:

| Error Category | Fallback Pattern | Customer Experience |
|---|---|---|
| Validation Error | **A** — Input Retry | One-ask/one-reattempt correction, natural language, never "error" |
| Retryable Error | **B** — Silent Retry | Natural pause, no retry mentioned; one automatic retry before escalating |
| Permanent Error | **C** — Graceful Redirect | Natural pivot to next Mode (A→B→C chain), never framed as failure |
| Authorization Error | **D** — Warm Handoff | Natural transition to human, never apologetic |
| System Error | **D** — Warm Handoff | Same as above — unknown failures always escalate, never guessed at |

## 9.4 Logging — Real Schema, Not Invented Fields

**`tool_call_log`'s actual current columns** (`Database_Structure_v4_FINAL.md`,
`current_state.sql`):

```
call_id              uuid PRIMARY KEY
tool_name            text NOT NULL
calling_module       module_name_enum NOT NULL
lead_id              uuid, nullable (no FK)
state                tool_call_state_enum NOT NULL
request_payload      json NOT NULL
response_payload     json, nullable
"timestamp"          timestamptz NOT NULL
```

**No dedicated `correlation_id` or `error_category` columns exist yet.** Per
Execution Architecture 9.6, until a migration adds them: include both as keys
*within* `request_payload` / `response_payload` JSON. Do not assume these columns
exist when writing n8n nodes — verify against the live schema before building, per
Rule 11 (Execution Architecture 21.12). This is flagged as a candidate schema
addition, not added speculatively here.

## 9.5 Error Flow

```
Failure → Classify (9.1) → Log (9.4) → Retryable?
   Yes → Retry Strategy (Part 10)
   No  → Apply mapped Fallback Pattern (9.3) → Return Standard Error (9.2)
```

---

# PART 10 — Retry Contract

## 10.1 Ownership

**The Execution Layer owns retries. Runtime never retries.** Runtime receives only
the terminal result (success, failed, or timeout-treated-as-failed) after the
Execution Layer's own retry logic has already run.

## 10.2 Strategy

One automatic silent retry on `TIMEOUT` (Fallback Pattern B), before the call is
reported as `FAILED` upward. No workflow implements retry without idempotency (Part
11) — these are load-bearing together, never independent.

## 10.3 Retry Metadata (internal to Execution Layer, not exposed to Runtime)

```
attempt_number
max_attempts
retry_reason
next_retry_time
```

---

# PART 11 — Idempotency Contract

## 11.1 Key Format

```
{tool_name}_{client_id}_{primary_entity_reference}
```

Example: `create-appointment_a1b2c3d4_lead-e5f6g7h8`

Exact separator/format finalized when `n8n_Workflow_Specification_v1` is written;
the composition principle (tool + tenant + entity) is fixed here.

## 11.2 What Requires Idempotency

Per Execution Architecture 11.3 — any workflow creating, modifying, or triggering a
business event: `CreateLead`, `CreateCustomer`, `BookAppointment`/`CreateAppointment`,
`RecordConversion`, `SendEmail`/`SendEmailReply`, `TriggerRecovery`/
`SendRecoveryMessage`, any `Create*` CRM record.

## 11.3 Rule

```
Same idempotency_key, first execution  → Execute normally
Same idempotency_key, second execution → Return the stored previous result;
                                          do NOT execute again
```

## 11.4 Database Responsibility

The database is the final guarantee — unique constraints and duplicate-action
protection (already implemented in `conversions`/`recovery_queue` per Database
Structure v4) back up the Execution Layer's operational check. Neither alone is
sufficient; both are required.

---

# PART 12 — Timeout Contract

## 12.1 Rule

Every Tool defines: expected timeout, maximum timeout, failure behavior. No workflow
waits indefinitely.

## 12.2 Values

**Not yet finalized for the full registry.** Per-tool timeout values belong to
`n8n_Workflow_Specification_v1`. Flagged here as required before that document is
considered complete — do not assume unstated defaults when building.

---

# PART 13 — Logging Contract

## 13.1 What Must Be Logged

Every Tool Request writes one `tool_call_log` row (Part 9.4's real schema), containing
at minimum: `tool_name`, `calling_module`, `state`, `request_payload`,
`response_payload`, `timestamp`. `correlation_id` travels inside the JSON payloads
until a schema migration adds a dedicated column (Part 9.4).

## 13.2 State Values

Per Execution Architecture Part 4.3 / Agent Runtime System Step 1D.3:

```
requested | waiting | success | failed | timeout
```

**Confirmed against the live schema (2026-08-01):** exact match to the
values above — `migrations/FINAL/current_state.sql:155` (`CREATE TYPE
tool_call_state_enum AS ENUM ('requested', 'waiting', 'success', 'failed',
'timeout')`), also documented in `Database_Structure_v4_FINAL.md` §6. No
longer an open verification item.

## 13.3 Mandatory Utility Order

Every Business Workflow invokes the canonical Shared Utilities (Execution
Architecture Part 13) in this fixed order — no workflow reorders or skips a step
without architectural review:

```
Schema Resolver     → resolve client schema before any query (Part 7)
   ↓
Data Validator      → validate payload before touching business logic (Part 5)
   ↓
Stop Checker        → confirm execution should still proceed (opt-out, cancelled,
                       already-completed checks) before the business operation fires
   ↓
Business Workflow   → the actual Tool's operation (Folders 01–05)
   ↓
Error Logger        → write tool_call_log regardless of outcome (Part 9.4)
   ↓
Notification Router → fire only if the outcome requires an internal alert
                       (failures, escalations) — not on every execution
```

This order resolves the one sequencing question `n8n_Execution_Architecture_v1.md`
Part 13.2 left implicit (it lists the 5 utilities as a set, not a sequence).

---

# PART 14 — Database Contract

## 14.1 Allowed (Execution Layer)

Read, Insert, Update, Archive, Log — all schema-targeted per Part 7, all via
`service_role`.

## 14.2 Not Allowed

Change schema structure, modify architecture, create arbitrary tables. Schema
evolution is governed exclusively by `Template_Migration_Process.md`'s manual,
reviewed procedure — never performed inline by a workflow.

## 14.3 Module → Table Ownership

Per Execution Architecture 14.7:

```
Growth Agent       → Leads, Growth Events, Handoff Payloads
Conversion Engine  → Conversions (core + archetype-specific extensions)
Recovery Engine    → Recovery Queue, Suppression Records
Core Agent         → Complaints, Customers, Escalations
Email Manager      → Emails, Attachments, Draft Edit Log
```

Full table-to-module mapping: `Database_Structure_v4_FINAL.md`.

---

# PART 15 — External Integration Contract

## 15.1 Rule

Every external integration (Calendar, Email provider, CRM) requires: authentication,
validation, timeout, retry, logging, response mapping — no exceptions, no ad hoc
integration pattern per builder.

## 15.2 Example — Calendar

```
Runtime → BookAppointment Tool → n8n Entry Workflow → Schema Resolve →
Google Calendar API → Response Mapping → Database Write → Standard Response
```

Concrete node-level configuration is **not** specified here — per Rule 11 (Execution
Architecture 21.12), must be verified against live n8n docs/MCP at build time, not
assumed from this or any prior document.

---

# PART 16 — Versioning Strategy

## 16.1 Tool Versioning

```
CreateAppointment.v1
CreateAppointment.v2   (breaking change)
```

## 16.2 Contract Versioning

```
Execution Layer Integration Contract v1
Execution Layer Integration Contract v2
```

Breaking changes to this document's request/response schemas require a version
bump, not a silent edit.

## 16.3 Existing Groundwork — Not Greenfield

This is not a new capability being designed from scratch. Real groundwork already
exists and should be extended, not duplicated:

- `control.template_versions` — already tracks per-archetype template version
  numbers and change descriptions (Database Phase C).
- `control.agent_prompts.version` / `.status` — already tracks prompt versioning
  with a promotion-to-stable workflow.

Tool/Contract versioning (this Part) is a distinct concern from template/prompt
versioning (above) — both exist, neither replaces the other, and a future formal
Tool Versioning layer (Execution Architecture Part 17.6.5, deferred) should build on
top of this existing groundwork rather than reinventing it.

---

# PART 17 — Adapter Contract

## 17.1 Responsibility

Translation only. Voiceflow Adapter, Convocore Adapter (prospective), future
LangGraph Adapter — all follow the same rule.

```
Platform-native payload → Adapter → Standard Request Contract (Part 5)
Standard Response Contract (Part 8) → Adapter → Platform-native response
```

## 17.2 May

Translate requests, normalize payloads, validate authentication, convert responses,
handle platform-specific formatting.

## 17.3 Must Never

Execute business decisions, access databases directly, perform qualification,
interpret customer psychology, implement Runtime logic. Adapters remain
intentionally thin (Execution Architecture 16.6).

## 17.4 Current Status

| Platform | Status |
|---|---|
| Voiceflow | ✅ Production (ADP-001) |
| Convocore | 🟢 Built (ADP-002, BC-009) — see `Convocore_Adapter_Spec_FINAL.md` and `n8n_Workflow_Specification_v1.md` Part 17. Not yet live-tested against a real Convocore agent; human-handoff's staged-fallback trigger condition remains a genuine open decision. |
| LangGraph | Future — long-term migration target |

---

# PART 18 — Security Requirements

- Every request authenticated (Part 6).
- Every client operation schema-resolved before execution (Part 7) — no default
  schema assumed.
- `service_role` key never exposed outside n8n's credential store.
- Known debt: static `x-webhook-secret` (Part 6.1) — flagged, not resolved here.
- No cross-client data access under any circumstance.

---

# PART 19 — Testing Requirements

Before any Tool is production-ready, test:

| Category | Case |
|---|---|
| Success | Correct, complete request |
| Failure | Invalid/malformed payload |
| Security | Wrong `client_id` / cross-tenant attempt |
| Retry | Simulated temporary failure (Retryable Error) |
| Duplicate | Same `idempotency_key` sent twice |

---

# PART 20 — Example Contracts

## 20.1 CreateLead

```json
// Request
{
  "request_id": "uuid",
  "correlation_id": "uuid",
  "client_id": "uuid",
  "conversation_id": "uuid",
  "runtime_module": "growth_agent",
  "tool_name": "CreateLead",
  "timestamp": "2026-07-18T09:00:00Z",
  "idempotency_key": "create-lead_{client_id}_{conversation_id}",
  "payload": {
    "customer_id": "uuid",
    "archetype": "commerce_ecom",
    "intent": "product inquiry, sizing question",
    "source_channel": "web-chat",
    "conversation_summary": "Customer asking about jacket sizing."
  }
}
```

## 20.2 BookAppointment / CreateAppointment

```json
{
  "runtime_module": "conversion_engine",
  "tool_name": "CreateAppointment",
  "idempotency_key": "create-appointment_{client_id}_{lead_id}",
  "payload": {
    "customer_id": "uuid",
    "service": "consultation",
    "preferred_date": "2026-07-20",
    "preferred_time": "15:00"
  }
}
```

## 20.3 SendEmailReply

```json
{
  "runtime_module": "email_manager",
  "tool_name": "SendEmailReply",
  "idempotency_key": "send-email-reply_{client_id}_{email_id}",
  "payload": {
    "email_id": "uuid",
    "recipient_email": "customer@example.com",
    "subject": "Re: Order status",
    "body": "..."
  }
}
```

## 20.4 TriggerRecovery / SendRecoveryMessage

```json
{
  "runtime_module": "recovery_engine",
  "tool_name": "SendRecoveryMessage",
  "idempotency_key": "send-recovery-message_{client_id}_{lead_id}_{step_number}",
  "payload": {
    "lead_id": "uuid",
    "step_number": 1,
    "channel": "email"
  }
}
```

---

# PART 21 — Future LangGraph Compatibility

```
Today:    Voiceflow  → Voiceflow Adapter  → Runtime → this Contract → n8n
Tomorrow: LangGraph  → LangGraph Adapter  → Runtime → this Contract → n8n (or successor)
```

Only the caller and Adapter change. Every field, response shape, error category, and
idempotency rule in this document remains identical.

---

# PART 21.5 — Future Event Contract (Reserved)

Reserved for when the Request/Response model (Parts 5, 8) is no longer sufficient —
LangGraph orchestration, background workers, streaming responses, or webhook-driven
async events. No content defined yet; this placeholder exists so a future event
contract has a designated home in this document's numbering rather than requiring a
renumber later. Not a v1 requirement.

---

# PART 22 — Final Rules

1. Runtime calls Tools, never workflows.
2. Tools have stable, PascalCase names; breaking changes get a new version, never a
   silent redefinition.
3. n8n owns execution and owns retries — Runtime never retries.
4. The database owns business truth; the Execution Layer may operate on it, never
   redefine its structure.
5. Every request is authenticated (Part 6) — no exceptions.
6. Every client operation resolves `Accept-Profile`/`Content-Profile` from a fresh
   lookup — no static, hardcoded, or default schema.
7. Every execution writes a `tool_call_log` row (Part 9.4's real schema).
8. Every retryable/creating/modifying action carries an `idempotency_key`.
9. Every response follows the Success (Part 8) or Error (Part 9) contract exactly —
   no ad hoc shapes.
10. Future platforms (LangGraph, REST, mobile) integrate by adding an Adapter only —
    this contract does not change for them.

---

# Open Items Requiring Live Verification Before Build

Per user instruction, the following were **not** verified against live Supabase/n8n
MCP while drafting — pulled from project docs only. Flag for live confirmation before
`n8n_Workflow_Specification_v1` treats them as final:

- Exact `x-webhook-secret` replacement mechanism (Part 6.1) — real secret-management
  upgrade path not yet designed.
- ~~`tool_call_state_enum`'s exact member values (Part 13.2)~~ — **Resolved
  2026-08-01:** confirmed against live schema, exact match to the values
  already documented here (Part 13.2). No longer open.
- Per-tool timeout values (Part 12.2) — not yet decided anywhere in the project.
- n8n's native Supabase node's current schema/profile-parameter support
  (`Database_API_Reference.md` flagged this as possibly still absent) — confirm
  before deciding HTTP Request node vs. native node per workflow.
- Whether `correlation_id`/`error_category` columns should be added to `tool_call_log`
  via migration before build starts, or deferred until real usage patterns justify it
  (Part 9.4) — an open decision, not resolved by this document.

---

```
ZeroManual · Zenny AI Workforce · Execution Layer Integration Contract v1
Built against: n8n_Execution_Architecture_v1.md (frozen v1.0), Database_Structure_v4_FINAL.md,
Database_API_Reference.md, Tool_Naming_Convention.md, Fallback_Pattern_Catalog.md,
current_state.sql. Supersedes the prior Demo-Sprint/Airtable-era INTEGRATION_CONTRACT_v1.md.
```
