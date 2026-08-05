# n8n Workflow Specification v1

```
Status:    APPROVED — Architecture Freeze (v1.0)
Purpose:   Canonical inventory of every workflow, utility, folder placement, and
           per-tool payload/response schema in the Execution Layer.
Position:  Sixth foundational document. Sits beneath the Integration Contract,
           above n8n Build Execution Plan and Build Cards (neither written yet).
contract_version this spec targets: v1 (matches every request envelope's
           reserved contract_version field, Integration Contract Part 5.2)
Verified live against n8n MCP (2026-07-18): native Supabase node's schema-
           targeting capability — see Part 6.9. This closes Integration
           Contract Open Verification Item #4. All other node-level detail in
           this document is deferred to per-Build-Card MCP verification
           (AI_Builder_Operating_Manual_v1.md Section 6.1) — not re-verified
           here, per that document's own scoping rule.
Revision:  Reviewed and frozen with 6 additions: Workflow ID Convention
           (Part 3.1), Workflow Lifecycle Status model (Part 3.2), Internal
           Workflow Registry (Part 7.7), Utility Ownership Matrix (Part
           6.0.1), Execution Sequence Reference diagram (Part 6.0), and
           Build Order moved to the final section (Part 15) with Open
           Verification Items preceding it (Part 14) for a clean
           architecture-to-execution handoff.
```

---

# PART 1 — Purpose & Scope

## 1.1 Purpose

This document answers one question: **exactly what workflows exist, what does
each one do, what utilities does it use, and what is its payload/response
contract?**

It is the direct successor to `INTEGRATION_CONTRACT_v1.md`, which defined the
wire-level envelope (request/response shape, error codes, idempotency keys)
but explicitly deferred tool-specific payload schemas, timeout values, and the
concrete workflow inventory to this document (Integration Contract Part 5.4,
Part 12.2).

## 1.2 Scope

Covers: workflow taxonomy, ID convention, lifecycle status model, canonical
folder structure, Entry Workflow pattern, Shared Utility specifications (with
ownership matrix and execution sequence reference), the full Tool → Workflow
registry with payload/response schemas, the internal (non-Tool) workflow
registry, scheduled workflows, external integration requirements per
service, builder rules, open verification items, and build order.

## 1.3 Relationship With Other Documents

```
Agent Runtime System v1              (WHAT should happen)
        ↓
Database Structure v4 FINAL          (WHAT is stored)
        ↓
n8n Execution Architecture v1        (execution PRINCIPLES)
        ↓
Execution Layer Integration Contract (wire-level envelope — request/response
        ↓                            shape, error codes, idempotency, schema
        ↓                            resolution mechanics)
n8n Workflow Specification            ← THIS DOCUMENT (concrete inventory:
        ↓                            which workflows exist, their payloads,
        ↓                            their folder, their utility usage)
n8n Build Execution Plan              (sequencing — not yet written)
        ↓
Build Cards                           (one per workflow — not yet written)
        ↓
Codex builds (via Claude Code Build Prompts, per AI_Builder_Operating_Manual_v1.md)
```

## 1.4 What This Document Does NOT Define

To prevent architectural drift back into documents already frozen:

- **Why** the Runtime/Execution boundary exists, why Tools are not Workflows,
  why schema-per-client — all settled in `n8n_Execution_Architecture_v1.md`.
  This document assumes that reasoning and never re-argues it.
- **The wire envelope itself** (request_id, correlation_id, contract_version,
  standard success/error shape) — settled in `INTEGRATION_CONTRACT_v1.md`.
  This document references it, never restates or modifies it.
- **Exact node-by-node configuration** (which parameter, which expression
  syntax, which credential field) — deferred to Build Cards and their
  mandatory per-card MCP verification (`AI_Builder_Operating_Manual_v1.md`
  Section 6.1). This document specifies *which* utility/node category a
  workflow uses, not its literal n8n node graph.
- **Implementation sequencing as project management** (dates, owners,
  sprints) — that belongs to the Build Execution Plan, not this document.
  Part 15 here defines dependency *order*, not a schedule.

---

# PART 2 — Workflow Philosophy

## 2.1 Rules

- **Every Tool has exactly one Entry Workflow.** Per Execution Architecture
  12.3 — a stable interface; internal implementation may evolve without
  affecting the Runtime.
- **One workflow = one responsibility.** A workflow that both checks
  availability and books is two workflows, never one (Tool Naming Convention's
  "one action per tool name" rule extends directly to workflow granularity).
- **Runtime never calls child/business workflows directly.** It calls the Tool
  Name; the Entry Workflow is what n8n resolves that to internally.
- **Child/business workflows never expose their own webhook.** Only Entry
  Workflows are externally callable. Everything downstream of an Entry
  Workflow is invoked by n8n's internal Execute Workflow mechanism, never by
  a second webhook.
- **Utilities are reused, never duplicated.** Per Execution Architecture 13.8
  — if logic is reusable by more than one Runtime module, it belongs in
  Folder 06 (Utilities), not copy-pasted into each business workflow.
- **Folders represent business ownership, not integration dependencies.**
  Restated directly from Execution Architecture 6.2 — a workflow touching
  Calendar + Supabase + Email still belongs to exactly one folder, determined
  by which Runtime module owns its business purpose.

## 2.2 Contract Version Binding

Every workflow specified in this document is built against
`contract_version: "v1"` (Integration Contract Part 5.2). If the Integration
Contract is ever revised to v2, every workflow's Entry Workflow validation
step must reject a request whose `contract_version` it doesn't recognize
rather than silently attempting to process it — this is a Data Validator
responsibility (Part 6.2), not a per-workflow concern.

---

# PART 3 — Workflow Taxonomy

Every workflow in the Execution Layer falls into exactly one of these
categories:

```
Entry Workflows        — one per Tool; the only externally-callable webhooks
Shared Utilities        — Schema Resolver, Data Validator, Error Logger,
                          Notification Router, Stop Checker (Execution
                          Architecture 13.2's canonical 5)
Business Workflows       — the actual per-Tool operation, organized by owning
                          Runtime module (Core Agent, Growth Agent, Conversion
                          Engine, Recovery Engine, Email Manager)
Scheduled Workflows        — cron-triggered, no external caller (recovery
                          queue sweep, timeout/stale-call sweep, etc.)
Platform Adapters            — Voiceflow Adapter (ADP-001, production),
                          Convocore Adapter (ADP-002, built — BC-009, see
                          Part 17) — translation-only, per Integration
                          Contract Part 17
```

This mirrors the canonical 01–08 folder structure (Part 4) exactly — the
taxonomy and the folder structure are the same classification, viewed as
"what kind of workflow is this" vs. "where does it live."

## 3.1 Workflow ID Convention

Every workflow, Tool or internal, gets a permanent ID at this specification
level — frozen here so Build Cards never invent their own numbering scheme.

```
WF-{NNN}     — Business Workflow (Tool-facing, Folders 01–05)
UTIL-{NNN}   — Shared Utility (Folder 06)
SCH-{NNN}    — Scheduled Workflow (Part 8)
ADP-{NNN}    — Platform Adapter (Folder 08)
INT-{NNN}    — Internal (non-Tool) Workflow (Part 7.7)
```

Numbering is sequential within each prefix, assigned in the order each
workflow first appears in this document's registries (Part 13, Part 7.7,
Part 6, Part 8, Part 17). IDs are permanent once assigned — a workflow that
is later deprecated keeps its ID (marked `Deprecated`, Part 3.2), never
recycled onto a different workflow. A breaking-change replacement gets a new
ID entirely, distinct from the Tool-name `-v2` suffix convention (Integration
Contract Part 4.4) — the ID identifies the workflow artifact, the Tool Name
`-v2` suffix identifies the contract version Runtime calls.

Full ID assignment: Part 13.20 (registry table), Part 6.10 (utilities), Part
8 (scheduled), Part 7.7 (internal).

## 3.2 Workflow Lifecycle Status

Every workflow carries exactly one status at any time, tracked in the
registries below and inherited by Build Cards and the Dashboard without
redefinition:

```
Planned      — specified here, not yet a Build Card
Ready         — Build Card exists, MCP-verified, awaiting a Build Prompt
Building       — Codex actively implementing (Manual Section 7)
Test Blocked    — blocked on a credential or dependency (Manual Section 9)
Tested           — Codex-reported tests passed (Manual Section 10.B)
Approved          — Claude Architecture Review passed (Manual Section 10.C)
Production Ready   — released, live-traffic eligible
Deprecated          — superseded by a new Tool version or workflow ID,
                     retained for audit/rollback, no longer called
```

This is the same 6-state model already defined in
`AI_Builder_Operating_Manual_v1.md` Section 11 (Draft → Implemented → Test
Blocked → Tested → Approved → Production Ready), restated here with
`Planned` prepended (the pre-Build-Card state every workflow in this
document currently holds) and `Deprecated` appended (the terminal state the
Manual's model doesn't cover). Every entry in Part 13's registry and Part
7.7's internal registry starts at `Planned`.

---

# PART 4 — Folder Structure

## 4.1 Canonical Structure

Restated exactly from Execution Architecture Part 6.3 — not redefined here,
only mapped to this document's workflow inventory (Part 13):

```
01_Core_Agent/
02_Growth_Agent/
03_Conversion_Engine/
04_Recovery_Engine/
05_Email_Manager/
06_Utilities/
07_Dashboard/
08_Adapters/
```

## 4.2 Entry Workflows — Placement Rule

An Entry Workflow lives inside the folder of the Runtime module that OWNS
its Tool (Part 4.2 of the Integration Contract's ownership table), not in a
separate "01 Entry" folder. Execution Architecture 6.2's guiding principle —
folders represent ownership, not workflow type — applies to Entry Workflows
exactly as it applies to their internal business-logic workflows. `Create
Appointment`'s Entry Workflow lives in `03_Conversion_Engine/`, alongside the
business workflow it triggers, not in a cross-cutting entry-point folder.

**This corrects a structural assumption in the earlier draft plan** (which
proposed a standalone `01 Entry Workflows` category) — the canonical folder
structure is already frozen in the Execution Architecture and does not have
a dedicated Entry folder; Entry Workflows are simply the externally-webhooked
member of each owning module's folder.

## 4.3 Execution Core / Adapter Boundary

Restated from Execution Architecture 6.4 — every folder except `08_Adapters`
is platform-neutral (Execution Core). Only `08_Adapters` contains
platform-specific code. Migration to a new conversation platform touches
`08_Adapters` only.

---

# PART 5 — Entry Workflow Specification

## 5.1 Required Elements — Every Entry Workflow

Per the Canonical Request Lifecycle (Integration Contract Part 2.1), every
Entry Workflow implements, in this exact order:

```
Receive Request (webhook)
   ↓
Authenticate            (Integration Contract Part 6)
   ↓
Validate Envelope       (Data Validator — Part 6.2)
   ↓
Resolve Schema          (Schema Resolver — Part 6.1)
   ↓
Check Idempotency       (Integration Contract Part 11)
   ↓
Execute Tool             (invoke the owning Business Workflow)
   ↓
Retry (if applicable)     (Integration Contract Part 10 — only on
                          Retryable Error/Timeout)
   ↓
Log                        (Error Logger — Part 6.3)
   ↓
Respond                     (Standard Success/Error — Integration Contract
                             Parts 8–9)
```

## 5.2 Webhook Requirements

- One webhook per Entry Workflow, named per `Tool_Naming_Convention.md`'s
  kebab-case verb-entity format (e.g., `create-appointment`).
- Method: `POST` exclusively — Tool Requests are never idempotent-safe `GET`
  operations even for read-type Tools (`GetOrderStatus`), since the envelope
  itself (correlation_id, authentication) requires a body.
- Authentication header required on every request — no webhook accepts an
  unauthenticated call (Integration Contract Part 6).

## 5.3 Response Timing

Entry Workflows respond synchronously with the Standard Success/Error shape.
No Entry Workflow in this v1 scope returns an immediate "accepted, processing
async" response — Execution Architecture Part 17.3 (Event System) is
explicitly deferred; every Tool in this document's registry (Part 13) is
request-response, not fire-and-forget.

---

# PART 6 — Shared Utility Specifications

## 6.0 Execution Sequence Reference (Permanent — Cite, Don't Redraw)

This is the one canonical execution sequence every Entry Workflow and every
Build Card implements. It combines the Canonical Request Lifecycle
(Integration Contract Part 2.1) with the Mandatory Utility Order (Integration
Contract Part 13.3) into a single reference diagram. Build Cards reference
this section by number — they do not redraw it.

```
Entry Workflow (webhook received)
   ↓
Authenticate                    (Integration Contract Part 6)
   ↓
Schema Resolver     [UTIL-001]  (Part 6.1)
   ↓
Data Validator       [UTIL-002]  (Part 6.2)
   ↓
Stop Checker           [UTIL-005]  (Part 6.5 — conditional, see 6.5's Reuse Rule)
   ↓
Check Idempotency         (Integration Contract Part 11)
   ↓
Credential Resolver   [UTIL-006]  (Part 6.5a — conditional, only if the
                                  Business Workflow calls an external
                                  provider API; registered 2026-08-01)
   ↓
Business Workflow            (the Tool's actual operation — Part 13)
   ↓
Database (Supabase, schema-targeted per Schema Resolver's result)
   ↓
Error Logger         [UTIL-003]  (Part 6.3 — writes tool_call_log regardless
                                  of outcome)
   ↓
Notification Router   [UTIL-004]  (Part 6.4 — conditional, only on
                                  failure/escalation outcomes)
   ↓
Respond (Standard Success/Error, Integration Contract Parts 8–9)
```

## 6.0.1 Utility Ownership Matrix

| Utility | ID | Owner (Folder) | Used By |
|---|---|---|---|
| Schema Resolver | UTIL-001 | 06 — Utilities | All modules, every workflow touching client-schema data |
| Data Validator | UTIL-002 | 06 — Utilities | All modules, every Entry Workflow |
| Error Logger | UTIL-003 | 06 — Utilities | All modules, every Business Workflow |
| Notification Router | UTIL-004 | 06 — Utilities | Primarily Recovery Engine + Email Manager (escalation-heavy modules); called conditionally by any module on failure |
| Stop Checker | UTIL-005 | 06 — Utilities | Mandatory: Recovery Engine, Email Manager. Optional per Build Card: Core Agent, Conversion Engine (Part 6.5) |
| Credential Resolver | UTIL-006 | 06 — Utilities | All modules, every Business Workflow that calls an external provider API requiring a stored credential (registered per Change Request 1, `Client_Integration_and_Credential_Platform_v1.md` Part 6.2/Part 12) |

## 6.1 Schema Resolver

Per Execution Architecture 13.2, the 5 canonical utilities. Each is specified
below with ID, Purpose, Input, Output, Failure Behavior, and Reuse Rule.

**ID: UTIL-001**

**Purpose:** Determine the correct client schema before any database
operation touches client data.

**Input:** `client_id` (from the Tool Request envelope).

**Output:** `client_schema_name` (string), used to set `Accept-Profile` /
`Content-Profile` on every subsequent database node in the workflow.

**Mechanism (verified, Integration Contract Part 7):**
```
GET /rest/v1/clients?select=client_schema_name&client_id=eq.{client_id}
Accept-Profile: control
```

**Failure Behavior:** If `client_id` resolves to no row → Permanent Error
(Integration Contract Part 9.1), Fallback Pattern D (Warm Handoff) — an
unknown client is not a retryable condition. If the resolved schema is not
yet exposed (`406`/`PGRST106`) → System Error, since this indicates an
onboarding gap (`Database_API_Reference.md` §4), not a request-level problem.

**Reuse Rule:** Called by every Entry Workflow and every Business Workflow
that touches client-schema data, without exception. Never re-implemented
inline.

## 6.2 Data Validator

**ID: UTIL-002**

**Purpose:** Ensure incoming payloads are valid before any business logic
runs. Implements Agent Runtime System Step 0B §7's field-level validation
(email/phone typo-correction, country-code handling, one-ask/one-reattempt
correction flow) directly.

**Input:** Raw request envelope + tool-specific payload.

**Output:** Validated payload, or a `validation_flag: true` pass-through per
Fallback Pattern A (Step 0B §7.4's Backend Submission Gate) if the customer's
second correction attempt still fails.

**Failure Behavior:** Validation Error (Integration Contract Part 9.1),
Fallback Pattern A (Input Retry). Stops execution before any business
operation — no partial-write-then-validate pattern anywhere in this system.

**Reuse Rule:** Called immediately after Authenticate, before Resolve Schema,
in every Entry Workflow.

## 6.3 Error Logger

**ID: UTIL-003**

**Purpose:** Standardized operational logging to `tool_call_log`.

**Input:** `call_id`, `tool_name`, `calling_module`, `lead_id` (nullable),
`state`, `request_payload`, `response_payload`, `timestamp` — the real,
current column set (Integration Contract Part 9.4; no `correlation_id` or
`error_category` columns exist yet — both travel inside the JSON payload
fields until a migration adds them).

**Output:** One written row per execution, regardless of outcome.

**Failure Behavior:** A logging failure itself is a System Error — but must
never block the Tool Request's own response to Runtime. Logging is
best-effort-but-mandatory: attempted on every path, never a hard dependency
of the response being returned.

**Reuse Rule:** Called at the end of every Business Workflow, before Respond
— per the Mandatory Utility Order (Integration Contract Part 13.3).

## 6.4 Notification Router

**ID: UTIL-004**

**Purpose:** Sends internal operational notifications — admin alerts,
critical failures, escalations. Configurable per client/severity.

**Input:** Notification type, severity, context payload.

**Output:** Delivered notification (channel TBD per Build Card — Slack,
email, or dashboard alert, not yet decided at this specification level).

**Failure Behavior:** Non-blocking. A failed notification never fails the
underlying Tool Request.

**Reuse Rule:** Called only when the outcome requires an internal alert
(failures, escalations, System Errors) — not on every execution (Integration
Contract Part 13.3).

## 6.5 Stop Checker

**ID: UTIL-005**

**Purpose:** Determines whether execution should continue before the
business operation fires — customer opted out, conversation archived,
recovery cancelled, workflow already completed.

**Input:** Relevant entity ID (lead_id, customer_id, or recovery record ID
depending on the calling Tool).

**Output:** Boolean — proceed / halt.

**Failure Behavior:** If the Stop Checker itself fails to resolve (e.g., the
underlying lookup errors), treat as Retryable Error — do not proceed on an
unresolved stop-check, since executing when a genuine stop condition exists
is worse than a delayed retry.

**Reuse Rule:** Directly implements Agent Runtime System Module 4's
"re-read Lead Status live before every send" rule and the suppression-record
checks in `Database_Structure_v4_FINAL.md`. Mandatory before every Recovery
Engine and Email Manager business operation; optional (per Build Card) for
other modules where no analogous stop condition exists.

## 6.5a Credential Resolver

**ID: UTIL-006**

**Registered 2026-08-01 per Change Request 1**
(`Client_Integration_and_Credential_Platform_v1.md` Part 6.2/Part 12) — a
6th canonical utility, not a variant of an existing one. This closes the
Change Request; it is no longer a gap in this document.

**Purpose:** Fetches a working, already-fresh access credential for the
external provider a Business Workflow is about to call — the mechanism
every provider branch in the Capability → Router → Provider Branch
pattern (`External_Integration_Strategy_v1.md` Part 5.1) actually calls
to obtain its `Authorization` header.

**Input:** `client_id` (from Schema Resolver, UTIL-001) + credential
category (e.g., `calendar`, `email`, `commerce`).

**Output:** A valid access token ready to use in the provider API call, or
a Tool Execution Fallback trigger if unavailable.

**Failure Behavior:** Queries `control.client_connections` for this
`client_id` + category. If `status != 'connected'`, this is a Tool
Execution Fallback trigger (`Client_Integration_and_Credential_Platform_v1.md`
Part 7), not a normal continuation — the calling Business Workflow does
not proceed to the provider call. Otherwise fetches `access_token` via
Vault RPC — already fresh under normal operation, since SCH-006 (Part 8)
keeps tokens refreshed ahead of expiry; no refresh-on-read in the normal
path.

**Execution position:** Runs after Schema Resolver (UTIL-001) resolves
`client_schema_name`, before the Business Workflow calls the external
provider — inserted into the sequence below.

**Reuse Rule:** Called by every Business Workflow that calls an external
provider API requiring a stored credential — this is the single missing
piece that makes the Capability → Router → Provider Branch pattern
executable; not called by workflows with no external-provider dependency
(e.g., pure internal Supabase writes).

## 6.6 Mandatory Utility Order — Restated

Per Integration Contract Part 13.3, extended per Change Request 1
(`Client_Integration_and_Credential_Platform_v1.md` Part 6.2/Part 12) to
insert Credential Resolver ahead of any Business Workflow step that calls
an external provider API:

```
Schema Resolver → Data Validator → Stop Checker → [Credential Resolver,
only if the Business Workflow calls an external provider API] →
Business Workflow → Error Logger → Notification Router (conditional)
```

## 6.7 Node Selection — General Rule

Per n8n's own builder guidance (verified live, 2026-07-18): prefer a
dedicated integration node over HTTP Request wherever one exists with the
needed operation — dedicated nodes carry built-in authentication, pre-
configured parameters, and better error handling. Use HTTP Request only when
no dedicated node exists, the dedicated node lacks the specific operation
needed, or the target is a custom/internal API (Supabase's Data API via raw
PostgREST calls being the one standing exception noted below).

## 6.8 Node Selection — Data Validator / Error Logger / Stop Checker

These three utilities are logic-only (field checks, conditional branching,
composing a log row) — implemented via n8n's Code node or IF/Switch nodes,
not a dedicated service node. No external credential required for their own
logic; Error Logger's actual write to `tool_call_log` uses the same
Supabase/Postgres node selection as Part 6.9 below.

## 6.9 Node Selection — Schema Resolver / Error Logger's Database Write

**Verified live against n8n MCP, 2026-07-18 — resolves Integration Contract
Open Verification Item #4.**

The native `n8n-nodes-base.supabase` node (v1, resource: `row`) supports
custom schema targeting directly:

```typescript
useCustomSchema?: boolean;  // default: false
schema?: string | Expression<string>;  // shown when useCustomSchema: true
                                        // accepts an n8n expression —
                                        // e.g. {{ $node["Get Client Schema"]
                                        //     .json.client_schema_name }}
```

This is available on all 5 row operations (`create`, `get`, `getAll`,
`update`, `delete`). **Correction to the Integration Contract's flagged
uncertainty (Part 7, `Database_API_Reference.md`'s "may still be HTTP-Request-
only" caution):** the native node does support expression-driven,
per-execution schema targeting — the earlier caution was appropriately
conservative but is now resolved.

**Standing recommendation:** either the native Supabase node (`useCustomSchema:
true`, `schema` set via expression) or the HTTP Request node (explicit
`Accept-Profile`/`Content-Profile` headers) satisfies the schema-resolution
requirement. Per Build Card, prefer the native node for simple row
operations (Part 6.7's general rule); use HTTP Request only where a specific
operation isn't covered by the native node's resource/operation set (e.g.,
calling `control.recovery_cadence_profiles`'s resolution logic, RPC calls
like `create_client_schema_from_template`, or any raw SQL not expressible via
the native node's filter UI).

**Still deferred to Build Card-level MCP verification, not resolved here:**
whether the native node's `getTables`/`getTableColumns` `loadOptionsMethod`
dropdowns correctly populate against a non-`public` schema at parameter-
configuration time in the n8n editor (a UI/authoring-time question, distinct
from the confirmed runtime `schema` expression capability above).

## 6.10 Utility ID Summary

```
UTIL-001   Schema Resolver
UTIL-002   Data Validator
UTIL-003   Error Logger
UTIL-004   Notification Router
UTIL-005   Stop Checker
UTIL-006   Credential Resolver   (registered 2026-08-01, Change Request 1)
```

6 canonical utilities are in v1 scope as of this registration. A 7th
utility would still require the same architectural-approval process
(Execution Architecture 13.2) before a `UTIL-007` ID is assigned.

---

# PART 7 — Runtime Module Workflows

Business workflows organized by owning Runtime module. This is the same real
Tool registry as Integration Contract Part 4.2, restated here in workflow-
inventory form (folder + entry point), not repeated as a flat list. Full
payload/response schemas: Part 13.

## 7.1 Folder 01 — Core Agent

```
UpdateCustomer          entry: update-customer
GetOrderStatus          entry: get-order-status
GetBookingStatus        entry: get-booking-status
CancelAppointment        entry: cancel-appointment
NotifyHuman               entry: notify-human    (exclusive to Human Handoff
                                                    Handler — Growth Agent and
                                                    Conversion Engine never
                                                    call this directly)
```

Per Execution Architecture 6.5 — also owns 5 internal (non-Tool) workflows,
formally registered at Part 7.7 (INT-001 through INT-005).

## 7.2 Folder 02 — Growth Agent

```
CreateLead               entry: create-lead
```

Per Tool Naming Convention's hard rule: **Growth Agent never calls an action
tool directly.** Its role ends at handoff (Agent Runtime System Module 2 §3)
— `CreateLead` is Growth Agent's only Tool; every `Create*` conversion action
fires only after control passes to Conversion Engine.

## 7.3 Folder 03 — Conversion Engine

```
CheckAvailability             entry: check-availability
CreateCart                    entry: create-cart
CreateReservation              entry: create-reservation
CreateWaitlistEntry             entry: create-waitlist-entry
CreateAppointment                 entry: create-appointment
CreateBookingRequest               entry: create-booking-request
CreateCallbackQueueEntry             entry: create-callback-queue-entry
CreateInspectionSlotBooking           entry: create-inspection-slot-booking
CreateScoredBooking                    entry: create-scored-booking
CreateRegistration                      entry: create-registration
RecordConversion                         entry: record-conversion
```

`CheckAvailability` implements the Universal Availability Validation Layer
(Agent Runtime System Module 3 §2.1) per-archetype:

```
Commerce Ecom          → inventory/stock check
Commerce Restaurant     → table/slot availability
Appointment              → calendar availability
Emergency                 → TWO checks: human-available (built) AND
                            team/technician physically available (no
                            live capacity feed — resolved for v1 via
                            `client_config.emergency_booking_mode`,
                            default `dashboard_request`; automated
                            feed deferred to v2)
Consultation               → human/specialist availability for score-tier
                            routing (no live feed — resolved for v1 via
                            `client_config.
                            consultation_specialist_check_mode`, default
                            `dashboard_request`; automated feed deferred
                            to v2)
Engagement                  → program/event capacity check (no live feed
                            — resolved for v1 via `client_config.
                            engagement_capacity_check_mode`, default
                            `dashboard_request`; automated feed deferred
                            to v2)
```

**Resolved for v1, per Runtime System amendment (Agent Runtime System
Module 3 §2.1, v1 Fallback Configuration):** Emergency's team-availability
check, Consultation's specialist-availability validation, and
Engagement's live-capacity feed each now have a client-configurable
`dashboard_request` fallback — `CheckAvailability` returns
`"available": false` with an empty `alternatives` array is NOT the
mechanism used here; instead, the calling Workflow (`CreateAppointment`,
`CreateRegistration`, the Emergency dispatch-queue Workflow) checks the
relevant `client_config` mode flag directly and, under
`dashboard_request`, creates the record in a pending/unconfirmed state
rather than calling `CheckAvailability`'s team/specialist/capacity
sub-type at all. Building the underlying live team/specialist/capacity
data feed (so `direct_calendar`/`direct_confirm` mode can be validated
automatically) remains deferred to v2 — that is the only part of this
still open, not the v1 behavior itself.

## 7.4 Folder 04 — Recovery Engine

```
SendRecoveryMessage          entry: send-recovery-message
```

**Exclusive owner** — no other module fires a recovery-cadence send (Tool
Naming Convention hard rule). 3 internal (non-Tool) workflows also live here,
formally registered at Part 7.7 (INT-006 through INT-008).

## 7.5 Folder 05 — Email Manager

```
SendEmailReply               entry: send-email-reply
```

**Exclusive owner of `send-*` email tools** (Tool Naming Convention hard
rule) — the transactional-vs-discretionary distinction (Agent Runtime System
Module 5 §7) governs *when* the send happens, never *which module* owns the
tool. 3 internal (non-Tool) workflows also live here, formally registered at
Part 7.7 (INT-009 through INT-011).

## 7.6 Module → Tool Ownership Summary Table

| Tool Name | Owning Module | Folder |
|---|---|---|
| UpdateCustomer | Core Agent | 01 |
| GetOrderStatus | Core Agent | 01 |
| GetBookingStatus | Core Agent | 01 |
| CancelAppointment | Core Agent | 01 |
| NotifyHuman | Core Agent | 01 |
| CreateLead | Growth Agent | 02 |
| CheckAvailability | Conversion Engine | 03 |
| CreateCart | Conversion Engine | 03 |
| CreateReservation | Conversion Engine | 03 |
| CreateWaitlistEntry | Conversion Engine | 03 |
| CreateAppointment | Conversion Engine | 03 |
| CreateBookingRequest | Conversion Engine | 03 |
| CreateCallbackQueueEntry | Conversion Engine | 03 |
| CreateInspectionSlotBooking | Conversion Engine | 03 |
| CreateScoredBooking | Conversion Engine | 03 |
| CreateRegistration | Conversion Engine | 03 |
| RecordConversion | Conversion Engine | 03 |
| SendRecoveryMessage | Recovery Engine | 04 |
| SendEmailReply | Email Manager | 05 |

19 externally-facing Tools in this v1 scope. Not exhaustive of every
internal (non-Tool) workflow — see each module's subsection above for the
internal workflows that support these but carry no Runtime-facing Tool Name.

---

## 7.7 Internal Workflow Registry (Non-Tool Workflows)

These workflows carry no Runtime-facing Tool Name — Runtime never calls them
directly via a Tool Request. They exist to support the Tool-facing workflows
above, or run as internal steps within a module's own operation. Named and
ID'd here so they don't become invisible architecture, but scoped to Purpose/
Called By only — no payload/response schema (Part 13's schema format applies
only to externally-invoked Tools).

| ID | Internal Workflow | Purpose | Called By | Folder | Externally Callable? |
|---|---|---|---|---|---|
| INT-001 | Create Customer | Initialize a new Customer record | Core Agent, on first session for a new customer_id | 01 | No |
| INT-002 | Load Client Configuration | Read `control.client_config` for the current client | Core Agent, start of every conversation session | 01 | No |
| INT-003 | Load Archetype Configuration | Resolve archetype-specific config sub-object | Core Agent, immediately after INT-002 | 01 | No |
| INT-004 | Initialize Conversation | Create/attach the session's conversation record | Core Agent, session start | 01 | No |
| INT-005 | Archive Conversation | Close out a conversation record at session end | Core Agent, session end | 01 | No |
| INT-006 | Process Recovery Queue (internal steps) | Iterate due `recovery_queue` rows, invoke SendRecoveryMessage per row | SCH-001 (Part 8) | 04 | No |
| INT-007 | Stop Recovery | Halt a recovery cadence (opt-out, reply received, or manual stop) | Recovery Engine, on Reply Handling trigger (Agent Runtime System §6.1) | 04 | No |
| INT-008 | Resume Recovery | Re-activate a paused (not stopped) cadence | Recovery Engine, per Recovery Status transitions | 04 | No |
| INT-009 | Sync Inbox | Pull new inbound email from the provider | SCH-003 (Part 8) or provider webhook | 05 | No |
| INT-010 | Categorize Email | Apply the 8-category taxonomy (Integration Contract) to an inbound email | INT-009, per email received | 05 | No |
| INT-011 | Draft Email | Compose a reply draft at Level 2 autonomy (human-approval-pending) | Email Manager, post-categorization | 05 | No |

**Rule:** an Internal Workflow never exposes its own webhook (Part 2.1's
"child workflows never expose webhooks" rule applies identically here — the
Tool/non-Tool distinction does not create an exception). If a future need
arises for Runtime to call one of these directly, it must be promoted to a
Tool with its own PascalCase Tool Name, registered in Part 13, and given a
new `WF-{NNN}` ID — not retrofitted with a webhook under its `INT-{NNN}` ID.

---

# PART 8 — Scheduled Workflows

Cron-triggered, no Runtime-initiated webhook call, no `tool_name` envelope.

| ID | Workflow | Trigger | Purpose | Folder |
|---|---|---|---|---|
| SCH-001 | Process Recovery Queue | Cron (interval per Build Card) | Sweep `recovery_queue` for due sends, invoke `SendRecoveryMessage` internally per cadence step via INT-006 | 04 |
| SCH-002 | Stale Tool Call Sweep | Cron | Query `tool_call_log` for stuck `waiting` states past a threshold (Integration Contract Part 9.4's stale-`WAITING` pattern), flag/log as `timeout` | 06 (Utilities — cross-cutting, not module-specific) |
| SCH-003 | Sync Inbox Trigger | Cron or provider webhook (TBD per Build Card) | Fires INT-009 to pull new inbound email for categorization | 05 |
| SCH-004 | Health Check | Cron | Verify Schema Resolver / credential connectivity ahead of business hours (not yet scoped in detail) | 07 (Dashboard) |
| SCH-005 | Metrics Rollup | Cron | Populate `Metrics`-equivalent aggregates for Dashboard reporting | 07 (Dashboard) |
| SCH-006 | Token Refresh Sweep | Cron (interval TBD at Build Card time) | Query `control.client_connections WHERE token_expires_at < (now + buffer)`; for each due connection, fetch `refresh_token` via Vault RPC and call the provider's token refresh endpoint — on success, update `access_token_secret_id`/`token_expires_at`; on failure (`invalid_grant`), set `status = 'expired'`. Registered per Change Request 2, `Client_Integration_and_Credential_Platform_v1.md` Part 6.1/Part 12 | 06 (Utilities — cross-cutting, not module-specific) |

**Note:** exact cron intervals are not decided at this specification level —
flagged for the Build Execution Plan / individual Build Cards, consistent
with Part 12's stance on timeout values (nothing invented speculatively here
that hasn't been decided elsewhere in the project).

---

# PART 9 — Workflow Lifecycle

Identical to the Canonical Request Lifecycle already frozen in the
Integration Contract (Part 2.1) — restated here only to confirm every
workflow in this Specification's registry (Part 13) implements it, with no
per-workflow deviation:

```
Triggered (webhook or cron)
   ↓
Authenticate        (webhook only — scheduled workflows skip this, they are
                     not externally callable)
   ↓
Validate
   ↓
Schema Resolve
   ↓
Idempotency Check    (Entry Workflows only — scheduled sweeps use their own
                     natural idempotency: e.g., a recovery send that already
                     fired for this step_number is a Stop Checker condition,
                     not a duplicate Tool Request)
   ↓
Execute
   ↓
Retry (if applicable)
   ↓
Log
   ↓
Respond (webhook) / Complete silently (scheduled)
```

---

# PART 10 — Workflow Dependencies

For every workflow in the Part 13 registry, the following is defined at
Build Card time (this Specification names the categories; Build Cards fill
in the specifics per workflow):

```
Depends on:         which other workflows must exist first (e.g.,
                    CreateAppointment depends on CheckAvailability existing
                    and callable, though it does not call it internally —
                    Runtime calls both independently per Agent Runtime
                    System Module 3 §2.1's sequencing)
Uses Utility:       which of the 5 canonical utilities, in Mandatory Order
                    (Part 6.6)
Calls External:     which external service(s) — Part 11
Writes Tables:      which client-schema tables, per Part 14.3 module
                    ownership (Integration Contract)
Returns:            the Tool's `result` object shape — Part 13's per-Tool
                    response schema
```

This structure is filled in per-workflow in Build Cards, not exhaustively
duplicated here for all 19 Tools — doing so here would create the same
three-times-repeated-tool-list problem this document's own planning
explicitly avoided (Part 1.4).

---

# PART 11 — External Integrations

For every external service a Business Workflow calls, the same required
sequence applies (Integration Contract Part 15.1): authentication,
validation, timeout, retry, logging, response mapping.

| Service | Used By | Node Category (per Part 6.7's general rule) | Credential Owner |
|---|---|---|---|
| Supabase (Data API) | Every workflow touching client-schema data | Native Supabase node (row ops) or HTTP Request (RPC/raw SQL) — Part 6.9 | n8n credential store, `service_role` key exclusively (Integration Contract Part 6.2) |
| Google Calendar | CheckAvailability, CreateAppointment, CreateReservation, CreateBookingRequest | Dedicated node expected to exist — **not yet verified against MCP; defer to that Build Card's mandatory pre-prompt check (Manual Section 6.1)** | Human-provided OAuth credential, per Manual Part 8 |
| Email Provider (Gmail or equivalent) | SendEmailReply, Sync Inbox | Dedicated node expected to exist — **not yet verified against MCP; defer to Build Card** | Human-provided OAuth credential |
| Notification Channel (Slack or equivalent) | Notification Router | **Not yet decided which channel** — flagged, not assumed | Human-provided credential, if selected |

**This table intentionally does not resolve the Calendar/Email node
questions now.** Per `AI_Builder_Operating_Manual_v1.md` Section 6.1, that
verification belongs at the specific Build Card that needs it — this
document only names which Tools depend on which external service category,
so the Build Execution Plan can sequence credential-gate pauses (Manual
Part 8/9) correctly in advance.

---

# PART 12 — Builder Rules

Carried forward and made explicit for this document's scope:

1. Never duplicate a Shared Utility inline — if two workflows need the same
   logic, it belongs in Folder 06.
2. Never bypass the Entry Workflow pattern — no Business Workflow exposes
   its own webhook.
3. Never hardcode a schema name — always resolve via Schema Resolver
   (Part 6.1), even in a workflow that "will only ever run for one client"
   during early testing.
4. Never hardcode credentials into a node parameter or expression — always
   the n8n credential store (Integration Contract Part 6.2/6.3).
5. **Verify node behavior against MCP before building** — per Manual Section
   6.1, scoped to the specific capability the current Build Card needs. This
   document's own Part 6.9 verification is the model to follow: confirm,
   cite the exact result, note what remains unverified.
6. **Raise a Change Request, not a silent fix,** when implementation reveals
   an architectural mismatch — e.g., if a Build Card discovers Google
   Calendar's dedicated node can't support a required operation, that's a
   Change Request against this Specification (Part 11's table), not an ad
   hoc workaround baked into one workflow.
7. **One action per tool name, restated at workflow granularity** (Part
   2.1) — no workflow silently grows a second responsibility over time
   without a Change Request updating this document's registry (Part 13)
   first.

---

# PART 13 — Workflow Registry (Master Inventory)

The canonical source for Build Cards. Each entry: WF-ID, Tool Name, Entry
Webhook, Module, Folder, Payload Schema, Response Schema, Idempotency Key
Pattern, Fallback Chain, Required Tests (per Integration Contract Part 19's 5
categories), Lifecycle Status (Part 3.2).

## 13.0 Master ID / Status Quick Reference

Every entry below starts at `Planned` (Part 3.2) — this table is the single
place to check current status without reading all 19 full entries; Build
Cards update this row as a workflow progresses through its lifecycle.

| WF-ID | Tool Name | Module | Folder | Status |
|---|---|---|---|---|
| WF-001 | CreateLead | Growth Agent | 02 | Planned |
| WF-002 | CheckAvailability | Conversion Engine | 03 | Planned |
| WF-003 | CreateAppointment | Conversion Engine | 03 | Planned |
| WF-004 | CreateBookingRequest | Conversion Engine | 03 | Planned |
| WF-005 | CreateCart | Conversion Engine | 03 | Planned |
| WF-006 | CreateReservation | Conversion Engine | 03 | Planned |
| WF-007 | CreateWaitlistEntry | Conversion Engine | 03 | Planned |
| WF-008 | CreateCallbackQueueEntry | Conversion Engine | 03 | Planned |
| WF-009 | CreateInspectionSlotBooking | Conversion Engine | 03 | Planned |
| WF-010 | CreateScoredBooking | Conversion Engine | 03 | Planned |
| WF-011 | CreateRegistration | Conversion Engine | 03 | Planned |
| WF-012 | RecordConversion | Conversion Engine | 03 | Planned |
| WF-013 | CancelAppointment | Core Agent | 01 | Planned |
| WF-014 | GetOrderStatus | Core Agent | 01 | Planned |
| WF-015 | GetBookingStatus | Core Agent | 01 | Planned |
| WF-016 | UpdateCustomer | Core Agent | 01 | Planned |
| WF-017 | NotifyHuman | Core Agent | 01 | Planned |
| WF-018 | SendRecoveryMessage | Recovery Engine | 04 | Planned |
| WF-019 | SendEmailReply | Email Manager | 05 | Planned |

## 13.1 CreateLead — WF-001

```
Module:        Growth Agent          Folder: 02
Entry webhook:  create-lead
Idempotency:     create-lead_{client_id}_{conversation_id}
Fallback chain:   B → A → D  (silent retry once; validation retry on bad
                  input; unresolvable → warm handoff)
```

**Payload:**
```json
{
  "customer_id": "uuid",
  "archetype": "commerce_ecom | commerce_restaurant | emergency | appointment | consultation | engagement",
  "intent": "string",
  "source_channel": "string",
  "conversation_summary": "string"
}
```

**Response `result`:**
```json
{ "lead_id": "uuid", "status": "new" }
```

**Tests:** Success (valid payload) · Failure (missing `customer_id`) ·
Security (cross-client `customer_id`) · Retry (Supabase timeout) · Duplicate
(same `conversation_id` twice). **Status: Planned.**

## 13.2 CheckAvailability — WF-002

```
Module:        Conversion Engine     Folder: 03
Entry webhook:  check-availability
Idempotency:     Not required — read-only, per Integration Contract Part 11.2
                  (idempotency applies to create/modify/trigger actions only)
Fallback chain:   B → C  (silent retry; then graceful redirect to next Mode
                  if unavailable)
```

**Payload:**
```json
{
  "customer_id": "uuid",
  "archetype": "string",
  "check_type": "inventory | table_slot | calendar | team | specialist | capacity",
  "reference": "product_id | preferred_date+time | resource_id (varies by check_type)"
}
```

**Response `result`:**
```json
{ "available": true, "alternatives": [] }
```

**Tests:** Success · Failure (invalid `check_type`) · Security · Retry ·
N/A for Duplicate (read-only). **Status: Planned — Emergency/Consultation/
Engagement `check_type` values (`team`/`specialist`/`capacity`) are v2
scope (no live data feed exists to answer them); in v1 these three route
through the `dashboard_request` fallback at the calling Workflow instead
of calling this sub-type (Part 7.3, resolved).**

## 13.3 CreateAppointment — WF-003

```
Module:        Conversion Engine     Folder: 03
Entry webhook:  create-appointment
Idempotency:     create-appointment_{client_id}_{lead_id}
Fallback chain:   B → C → D
```

**Payload:**
```json
{
  "customer_id": "uuid",
  "lead_id": "uuid",
  "service": "string",
  "preferred_date": "YYYY-MM-DD",
  "preferred_time": "HH:MM"
}
```

**Response `result`:**
```json
{ "appointment_id": "uuid", "calendar_event_id": "string", "status": "confirmed" }
```

**Tests:** Full 5-category set. **Status: Planned.**

## 13.4 CreateBookingRequest — WF-004

```
Module:        Conversion Engine     Folder: 03
Entry webhook:  create-booking-request
Idempotency:     create-booking-request_{client_id}_{lead_id}
Fallback chain:   B → D  (Mode B sub-type — human confirms; no further
                  automated fallback beyond escalation if the request itself
                  fails to record)
```

**Payload:** same shape as `CreateAppointment`, `service`/date fields
optional (Mode B may capture partial preference only).

**Response `result`:**
```json
{ "booking_request_id": "uuid", "status": "pending_human_confirmation" }
```

**Tests:** Full 5-category set. **Status: Planned.**

## 13.5 CreateCart — WF-005

```
Module:        Conversion Engine     Folder: 03
Entry webhook:  create-cart
Idempotency:     create-cart_{client_id}_{lead_id}
Fallback chain:   B → C  (Mode A → Mode B guided product link on failure)
```

**Payload:**
```json
{
  "customer_id": "uuid",
  "items": [{ "product_id": "string", "quantity": 1 }]
}
```

**Response `result`:**
```json
{ "cart_id": "uuid", "cart_value": 0.00, "checkout_link": "string" }
```

**Tests:** Full 5-category set. **Status: Planned.**

## 13.6 CreateReservation — WF-006

```
Module:        Conversion Engine     Folder: 03
Entry webhook:  create-reservation
Idempotency:     create-reservation_{client_id}_{lead_id}
Fallback chain:   B → C  (→ CreateWaitlistEntry if no slot, per
                  waitlist_enabled config)
```

**Payload:**
```json
{
  "customer_id": "uuid",
  "party_size": 1,
  "reservation_time": "ISO 8601",
  "special_request": "string, optional"
}
```

**Response `result`:**
```json
{ "reservation_id": "uuid", "table_confirmed": true }
```

**Tests:** Full 5-category set. **Status: Planned.**

## 13.7 CreateWaitlistEntry — WF-007

```
Module:        Conversion Engine     Folder: 03
Entry webhook:  create-waitlist-entry
Idempotency:     create-waitlist-entry_{client_id}_{lead_id}
Fallback chain:   C → D  (Mode B sub-type fallback of CreateReservation)
```

**Payload:**
```json
{ "customer_id": "uuid", "party_size": 1, "requested_time": "ISO 8601" }
```

**Response `result`:**
```json
{ "waitlist_id": "uuid", "position": 1 }
```

**Tests:** Full 5-category set. **Status: Planned.**

## 13.8 CreateCallbackQueueEntry — WF-008

```
Module:        Conversion Engine     Folder: 03
Entry webhook:  create-callback-queue-entry
Idempotency:     create-callback-queue-entry_{client_id}_{lead_id}
Fallback chain:   B → D  (Emergency Mode A)
```

**Payload:**
```json
{
  "customer_id": "uuid",
  "location": "string",
  "urgency_level": "string",
  "issue_description": "string"
}
```

**Response `result`:**
```json
{ "queue_entry_id": "uuid", "estimated_callback_window": "string", "status": "confirmed | pending_review" }
```

`status` is driven by `client_config.emergency_booking_mode` (Runtime
System Module 3 §2.1): `"direct_calendar"` → `"confirmed"`;
`"dashboard_request"` (v1-safe default) → `"pending_review"`, and the
calling agent must use the "submitted, pending confirmation" wording
variant rather than an outright confirmation (Runtime System, same
section).

**Tests:** Full 5-category set, with Security case emphasized (Emergency
data is high-sensitivity). **Status: Planned.**

## 13.9 CreateInspectionSlotBooking — WF-009

```
Module:        Conversion Engine     Folder: 03
Entry webhook:  create-inspection-slot-booking
Idempotency:     create-inspection-slot-booking_{client_id}_{lead_id}
Fallback chain:   B → C → D  (Emergency Mode B, non-emergency/quote branch)
```

**Payload:**
```json
{
  "customer_id": "uuid",
  "preferred_date": "YYYY-MM-DD",
  "preferred_time": "HH:MM",
  "issue_description": "string"
}
```

**Response `result`:**
```json
{ "inspection_slot_id": "uuid", "status": "confirmed" }
```

**Tests:** Full 5-category set. **Status: Planned — depends on the same
calendar-infrastructure-availability confirmation flagged as an open
architect-review item in the Runtime doc (Appendix C gap 15).**

## 13.10 CreateScoredBooking — WF-010

```
Module:        Conversion Engine     Folder: 03
Entry webhook:  create-scored-booking
Idempotency:     create-scored-booking_{client_id}_{lead_id}
Fallback chain:   A → B → D  (fires only after Score Gate passes, per
                  consultation_scoring_enabled config)
```

**Payload:**
```json
{
  "customer_id": "uuid",
  "lead_score": 0,
  "service_type": "string",
  "preferred_date": "YYYY-MM-DD",
  "preferred_time": "HH:MM"
}
```

**Response `result`:**
```json
{ "booking_id": "uuid", "opportunity_score": 0, "status": "confirmed" }
```

**Tests:** Full 5-category set, plus explicit Score Gate rejection case
(`lead_score < 50` for Consultation, per the old build guide's
CONSULTATION SCORE GATE pattern — reference only, re-verify the exact
threshold against current Runtime doc config before building).
**Status: Planned.**

## 13.11 CreateRegistration — WF-011

```
Module:        Conversion Engine     Folder: 03
Entry webhook:  create-registration
Idempotency:     create-registration_{client_id}_{lead_id}
Fallback chain:   B → D  (Engagement, Mode A Direct Registration)
```

**Payload:**
```json
{
  "customer_id": "uuid",
  "registration_type": "donate | volunteer | attend",
  "program_id": "string",
  "amount": 0.00
}
```

**Response `result`:**
```json
{ "registration_id": "uuid", "status": "confirmed | pending_review" }
```

`status` applies only to Volunteer/Attend registration (capacity-gated,
per Runtime System Direct Registration §5/Capacity verification note)
and is driven by `client_config.engagement_capacity_check_mode`:
`"direct_confirm"` → `"confirmed"`; `"dashboard_request"` (v1-safe
default) → `"pending_review"`, and the agent uses the
submitted-pending-confirmation wording variant. Donate registrations are
never capacity-gated and always return `"confirmed"`.

**Tests:** Full 5-category set. **Status: Planned — resolved for v1 via
`engagement_capacity_check_mode` (Part 7.3); the live capacity data feed
itself remains deferred to v2, not a v1 blocker.**

## 13.12 RecordConversion — WF-012

```
Module:        Conversion Engine     Folder: 03
Entry webhook:  record-conversion
Idempotency:     record-conversion_{client_id}_{conversion_id}
Fallback chain:   B → D
```

**Payload:**
```json
{
  "lead_id": "uuid",
  "conversion_type": "string",
  "value": 0.00,
  "archetype_specific_fields": {}
}
```

**Response `result`:**
```json
{ "conversion_id": "uuid", "status": "confirmed" }
```

**Tests:** Full 5-category set. **Status: Planned.**

## 13.13 CancelAppointment — WF-013

```
Module:        Core Agent (Support Handler, post-handoff)   Folder: 01
Entry webhook:  cancel-appointment
Idempotency:     cancel-appointment_{client_id}_{appointment_id}
Fallback chain:   B → D
```

**Payload:**
```json
{ "appointment_id": "uuid", "reason": "string, optional" }
```

**Response `result`:**
```json
{ "appointment_id": "uuid", "status": "cancelled" }
```

**Tests:** Full 5-category set. **Status: Planned.**

## 13.14 GetOrderStatus — WF-014

```
Module:        Core Agent (Support Handler)   Folder: 01
Entry webhook:  get-order-status
Idempotency:     Not required — read-only
Fallback chain:   B → D
```

**Payload:**
```json
{ "customer_id": "uuid", "order_reference": "string" }
```

**Response `result`:**
```json
{ "order_id": "uuid", "status": "string", "details": {} }
```

**Tests:** Success · Failure · Security · Retry. N/A Duplicate.
**Status: Planned.**

## 13.15 GetBookingStatus — WF-015

```
Module:        Core Agent (Support Handler)   Folder: 01
Entry webhook:  get-booking-status
Idempotency:     Not required — read-only
Fallback chain:   B → D
```

**Payload:**
```json
{ "customer_id": "uuid", "booking_reference": "string" }
```

**Response `result`:**
```json
{ "booking_id": "uuid", "status": "string", "details": {} }
```

**Tests:** Success · Failure · Security · Retry. N/A Duplicate.
**Status: Planned.**

## 13.16 UpdateCustomer — WF-016

```
Module:        Core Agent   Folder: 01
Entry webhook:  update-customer
Idempotency:     Not required for pure field updates unless the field itself
                  is create-adjacent (e.g., first-time preference creation) —
                  decide per Build Card
Fallback chain:   A → D
```

**Payload:**
```json
{ "customer_id": "uuid", "fields": {} }
```

**Response `result`:**
```json
{ "customer_id": "uuid", "updated_fields": [] }
```

**Tests:** Success · Failure (invalid field) · Security · Retry.
**Status: Planned.**

## 13.17 NotifyHuman — WF-017

```
Module:        Core Agent (Human Handoff Handler, exclusive)   Folder: 01
Entry webhook:  notify-human
Idempotency:     Not required — a genuine repeated escalation for the same
                  issue is a valid distinct event, not a duplicate; consult
                  Stop Checker (Part 6.5) instead if suppression is needed
Fallback chain:   D is terminal — this Tool IS the fallback destination for
                  every other Tool's D-pattern; it has no further fallback
                  of its own beyond System Error logging
```

**Payload:**
```json
{
  "customer_id": "uuid",
  "conversation_summary": "string",
  "intent_history": [],
  "escalation_reason": "string",
  "escalation_priority": "P1 | P2 | P3"
}
```

**Response `result`:**
```json
{ "escalation_id": "uuid", "status": "open" }
```

**Tests:** Success · Failure · Security · Retry.
**Status: Planned.**

## 13.18 SendRecoveryMessage — WF-018

```
Module:        Recovery Engine (exclusive)   Folder: 04
Entry webhook:  send-recovery-message
Idempotency:     send-recovery-message_{client_id}_{lead_id}_{step_number}
Fallback chain:   B → D
```

**Payload:**
```json
{ "lead_id": "uuid", "step_number": 1, "channel": "email | sms | whatsapp" }
```

**Response `result`:**
```json
{ "recovery_send_id": "uuid", "status": "sent" }
```

**Tests:** Full 5-category set, with explicit Stop Checker interaction test
(suppressed/opted-out lead must not send, verified as its own test case
beyond the standard 5). **Status: Planned.**

## 13.19 SendEmailReply — WF-019

```
Module:        Email Manager (exclusive owner of send-* email tools)  Folder: 05
Entry webhook:  send-email-reply
Idempotency:     send-email-reply_{client_id}_{email_id}
Fallback chain:   B → D
```

**Payload:**
```json
{ "email_id": "uuid", "recipient_email": "string", "subject": "string", "body": "string" }
```

**Response `result`:**
```json
{ "email_id": "uuid", "status": "sent" }
```

**Tests:** Full 5-category set. **Status: Planned.**

---

# PART 14 — Open Verification Items (Carried Forward / Newly Flagged)

Per this document's own scope discipline (Part 1.4) and the Manual's Section
6.1/6.2 tracking requirement:

**Resolved by this document:**
- Integration Contract Open Verification Item #4 (native Supabase node
  schema-targeting capability) — confirmed live, Part 6.9.

**Resolved 2026-08-01, not by this document originally but confirmed
during the cross-architecture validation pass:**
- Integration Contract Item #2 (`tool_call_state_enum` exact values) —
  confirmed against live schema, exact match to the values already
  documented in both Integration Contract Part 13.2 and
  `Database_Structure_v4_FINAL.md` §6. No longer open.

**Still open, explicitly deferred to Build Cards (not resolved here):**
- Integration Contract Item #1 (webhook secret replacement mechanism)
- Integration Contract Item #3 (per-tool timeout values) — **not decided
  anywhere in this document either**; every Part 13 entry is silent on
  timeout by design, pending that decision
- Integration Contract Item #5 (`correlation_id`/`error_category` migration
  decision)

**Newly flagged by this document:**
- Google Calendar and Email Provider dedicated node capability — not yet
  verified against MCP (Part 11's table); required before Phase 4/6 Build
  Cards can be finalized.
- Notification Router's actual channel — not yet decided (Part 6.4/11).
- Three Runtime-doc-level gaps blocking full `CheckAvailability` and
  `CreateRegistration` implementation (Emergency team-availability,
  Consultation specialist-availability, Engagement live-capacity feed) —
  these require an Agent Runtime System amendment, not an n8n-level fix;
  flagged for a Change Request against that document, not this one.
- Scheduled workflow cron intervals (Part 8) — not decided.
- Internal (non-Tool) workflows named in Parts 7.1/7.4/7.5 (Create Customer,
  Load Client Configuration, Process Recovery Queue's internals, Sync Inbox,
  Categorize Email, Draft Email) have no payload/response schema in Part 13
  since they carry no Runtime-facing Tool Name — these need their own
  internal-workflow specification pass before their Build Cards can be
  written, scoped separately from this Tool-registry-centered document.

---

# PART 15 — Build Order

## 15.1 Dependency-Justified Phases

Not a schedule — a dependency order. Each phase requires the prior phase to
exist and be tested, because later workflows call earlier utilities/patterns
directly:

```
Phase 1 — Shared Utilities (Folder 06)
   Why first: every Entry Workflow in every later phase depends on Schema
   Resolver, Data Validator, Error Logger existing and being callable.
   Building any Tool before these exist means either stubbing them (rework
   later) or hardcoding what they'd provide (a direct Builder Rule
   violation, Part 12.3/12.4).

Phase 2 — Core Agent (Folder 01)
   Why second: Core Agent owns Customer initialization and Configuration
   Loading — every other module's workflows assume a Customer record and
   loaded client config already exist (Execution Architecture 6.5). Also
   contains NotifyHuman, the terminal fallback destination every other
   module's Pattern D relies on — must exist before any module that uses
   Pattern D can be considered complete, even if built in parallel.

Phase 3 — Growth Agent (Folder 02)
   Why third: CreateLead is a dependency of Conversion Engine's handoff
   pattern (Growth Agent → Conversion Engine, Module 2 §3) — Conversion
   Engine's workflows assume a Lead record may already exist by the time
   they're called.

Phase 4 — Conversion Engine (Folder 03)
   Why fourth: the largest module (11 of 19 Tools) and the one most other
   modules reference — Recovery Engine's eligibility logic reads Conversion
   state (Module 3 §5.1), Email Manager's confirmation sends are often
   triggered by Conversion Engine's own workflows.

Phase 5 — Recovery Engine (Folder 04)
   Why fifth: depends on Conversion Engine's conversion-state model existing
   (Module 3 §5.1 is the single source of truth Recovery Engine defers to
   for eligibility).

Phase 6 — Email Manager (Folder 05)
   Why sixth: standalone enough to build independently of Conversion/
   Recovery (Agent Runtime System Module 5 confirms Email Manager can run
   with no live-chat modules active at all) — placed after Recovery only
   because Recovery Engine's Production channel preference set includes
   Email, so Email Manager existing first-among-the-last two avoids Recovery
   Engine referencing a not-yet-built send path.

Phase 7 — Scheduled Workflows (Part 8)
   Why seventh: Process Recovery Queue depends on SendRecoveryMessage
   (Phase 5) existing; Sync Inbox depends on Email Manager's categorization
   pipeline (Phase 6) existing.

Phase 8 — Platform Adapters (Folder 08)
   Why last: per Execution Architecture 5.2/6.4, Adapters are the one
   platform-specific layer — building them last means every Execution Core
   workflow (Phases 1–7) is already stable and testable via direct webhook
   calls before the Voiceflow-specific translation layer is added on top.
```

## 15.2 Parallelization Note

Within Phase 4 (Conversion Engine), the 11 Tools are not sequentially
dependent on each other (each archetype's Tools are largely independent) —
Build Cards within a phase may be built in parallel or reordered by the
Build Execution Plan without violating this dependency structure, as long
as the phase itself starts only after its prerequisite phase is complete.

## 15.3 Handoff to Build Execution Plan

This is the last content this document originally defined at freeze time.
Phase 1 (Shared Utilities, UTIL-001 through UTIL-005) is what the Build
Execution Plan sequences first, and what the first Build Card and first
Claude → Codex Build Prompt (`AI_Builder_Operating_Manual_v1.md` Section 6)
are written against. Part 17 below is a post-freeze addition (BC-009,
2026-08-05) — the Platform Adapter Registry this document's own Part 3.1
ID convention reserved a slot for but never populated.

---

# PART 17 — Platform Adapter Registry

Added post-freeze (BC-009, 2026-08-05) — Part 3.1 defines the `ADP-{NNN}`
ID convention; this table is where those IDs actually get assigned.
Verified live before this addition: no `ADP-{NNN}` entry existed anywhere
in this document prior to this table, including for the Voiceflow Adapter
already in production — that gap is closed here at the same time as
Convocore's registration, not left half-done.

| ADP-ID | Adapter | Status | Folder | Spec Document |
|---|---|---|---|---|
| ADP-001 | Voiceflow Adapter | Production | 08 | `n8n_Execution_Architecture_v1.md` Part 16 (no standalone spec document exists) |
| ADP-002 | Convocore Adapter | Built (BC-009) | 08 | `Convocore_Adapter_Spec_FINAL.md` |

**ADP-002 detail:** n8n workflow ID `BOxeuH6ehv46FZL0` ("Zenny Platform
Adapter - Convocore Adapter (ADP-002)"). Implements client resolution
(Part 2), Standard Request Contract mapping (Part 3), Tool Name/Variable
pass-through (Parts 4-5), the Shopify exclusion (Part 10), and
human-handoff's escalations-row-write (Part 7, partial — see PROJECT_STATE.md
for the explicitly-not-built staged-fallback trigger condition). No live
Convocore agent exists yet, so this has not been end-to-end tested against
real Convocore traffic — built and internally verified against the frozen
contract only, per this Build Card's explicit scope.

---

```
ZeroManual · Zenny AI Workforce · n8n Workflow Specification v1
Built against: INTEGRATION_CONTRACT_v1.md (frozen v1.0), n8n_Execution_Architecture_v1.md
(frozen v1.0), Tool_Naming_Convention.md, Agent_Runtime_System_v1.md, Fallback_Pattern_
Catalog.md, Database_Structure_v4_FINAL.md, Database_API_Reference.md, live n8n MCP
(Supabase node verification only, 2026-07-18). Predecessor n8n_Scan_and_Plan_v1.md and
the old n8n_*_Build_Guide_v1.docx files used for sequencing/philosophy reference only,
per their own known-unreliable-node-config caveat (Execution Architecture Rule 11).
```
