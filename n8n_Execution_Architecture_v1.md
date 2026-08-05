# n8n Execution Architecture v1

```
Status:    APPROVED — Architecture Baseline (v1.0)
Purpose:   Canonical Execution Layer Standard
Next Dependency: Execution Layer Integration Contract v1 (Part 15.10,
           Part 22.5) — must exist before workflow-level building begins.
Position:  Fourth foundational architecture document, alongside
           Agent_Runtime_System_v1.md (Business Intelligence),
           Database_Structure_v4_FINAL.md (Business Data Layer), and
           Database Architecture Review & Future Runtime Roadmap
           (Current vs. Future Evolution) — defines the Execution Layer,
           currently implemented via n8n.
Revision history: Assembled from the full draft (Parts 1-6, 11-22) plus
           newly-integrated Parts 7-10; corrected against verified
           project fact (Database_API_Reference.md,
           Fallback_Pattern_Catalog.md, tool_call_log's actual schema,
           current platform status); refined per architecture review —
           Execution Core / Adapter Boundary renaming (5.2, 6.4),
           explicit Tool vs. Workflow rule (12.1), Workflow Versioning
           added (17.6.5), Workflow Registry folded into Tool Definition
           Layer (17.4).
```

---

## PART 1 — Purpose

### 1.1 Purpose of this Document

This document defines the architecture of the **Execution Layer** of the Zenny AI Workforce platform.

For the current implementation, the Execution Layer is built using **n8n**.

The purpose of this document is **not** to describe individual workflows or explain how to use n8n. Instead, it defines the architectural principles, responsibilities, boundaries, and integration patterns that govern every workflow built within the platform.

This document ensures that:

- Every workflow follows the same execution model.
- Business logic remains independent of implementation details.
- Runtime decisions are never duplicated inside workflows.
- Database interactions remain consistent and predictable.
- Future migration from Voiceflow/Convocore to LangGraph can occur without redesigning the execution layer.

Like the Agent Runtime System, this document is intended to be **implementation guidance**, not platform documentation.

---

### 1.2 Position Within the Overall Architecture

The Zenny platform is divided into five primary architectural layers.

```
Customer
        ↓
Conversation Layer
(Voiceflow / Convocore)
        ↓
Runtime Layer
(Agent Runtime System)
        ↓
Execution Layer
(n8n)
        ↓
Business Data Layer
(Supabase)
        ↓
External Services
(Calendar, Email, CRM, APIs, etc.)
```

Each layer has a single responsibility.

| Layer | Responsibility |
|---|---|
| Conversation Layer | Communicates with the customer |
| Runtime Layer | Determines what should happen |
| Execution Layer | Performs the required actions |
| Business Data Layer | Stores business truth |
| External Services | Perform real-world operations |

Each layer depends on the layer below it but should remain logically independent.

---

### 1.3 Why an Execution Layer Exists

The Runtime System is intentionally designed to be platform-independent.

It defines: customer psychology, decision-making, qualification logic, conversation strategy, business rules.

However, the Runtime cannot: send an email, create a calendar booking, update a database, call an external API, generate a PDF, send a Slack notification.

Those are execution concerns.

The Execution Layer exists to perform those actions. It translates Runtime decisions into real-world operations while remaining completely unaware of *why* those actions were requested.

---

### 1.4 Primary Objectives

1. Execute Runtime requests reliably.
2. Interact with external systems securely.
3. Maintain consistent database updates.
4. Handle retries and operational failures.
5. Log execution history for auditing and debugging.
6. Remain reusable regardless of the conversation platform.

---

### 1.5 Scope

This architecture governs: Entry workflows, Shared utilities, External integrations, Database operations, Workflow conventions, Error handling, Retry policies, Schema targeting, Authentication, Logging, Runtime communication.

This document does **not** govern: Conversation psychology, Prompt engineering, Agent personalities, Intent detection, Customer qualification logic, Business decision-making.

Those belong exclusively to the Agent Runtime System.

---

# PART 2 — Philosophy

## 2.1 Core Philosophy

The Zenny platform follows a strict separation of responsibilities. Every architectural layer answers a different question.

| Question | Layer |
|---|---|
| What should happen? | Runtime |
| How is it executed? | Execution Layer |
| Where is it stored? | Database |
| How is it presented? | Conversation Layer |

Mixing these responsibilities creates architectural coupling and technical debt.

---

## 2.2 Fundamental Principle

> **Runtime decides. Execution Layer executes. Database stores. Conversation platforms communicate.**

Everything within this document follows from that principle.

---

## 2.3 Architectural Principles

**Principle 1 — Runtime Owns Business Decisions.** Qualification, prioritization, recommendations, customer psychology, escalation logic, recovery strategy, freedom levels — never recreated inside n8n.

**Principle 2 — Execution Owns Operations.** Calling APIs, updating databases, sending notifications, formatting data, validating payloads, generating documents, scheduling jobs. Performs work; does not decide *whether* the work should happen.

**Principle 3 — Database Stores Facts.** Lead created, appointment booked, payment received, recovery initiated, email sent. Never a decision engine.

**Principle 4 — Conversation Platforms Are Replaceable.** Voiceflow and Convocore are current and prospective implementations of the Conversation Layer. Future platforms (LangGraph) integrate through adapter changes only.

**Principle 5 — Utilities Are Universal.** Schema Resolver, Data Validator, Error Logger, Notification Router, Stop Checker. Never module-specific business logic.

**Principle 6 — Configuration Over Hardcoding.** Client-specific behavior controlled through configuration and database records, not duplicated workflows.

---

## 2.4 What the Execution Layer Is Not

Not an AI agent, reasoning engine, prompt engine, conversation engine, memory system, or state machine. Its responsibility begins only after the Runtime has decided that an action must occur.

---

# PART 3 — Execution Ownership Model

## 3.1 Purpose

One of the most common sources of architectural drift is uncertainty about where functionality belongs. This section establishes permanent ownership boundaries.

> **Which architectural layer owns this responsibility?**

---

## 3.2 Ownership Matrix

| Responsibility | Owner |
|---|---|
| Customer psychology | Runtime |
| Intent detection | Conversation Layer |
| Business decisions | Runtime |
| Agent personality | Runtime |
| Conversation rendering | Conversation Layer |
| Tool selection | Runtime |
| Workflow execution | Execution Layer |
| External APIs | Execution Layer |
| Authentication | Execution Layer |
| Data validation | Execution Layer |
| Schema resolution | Execution Layer |
| Database persistence | Database |
| Business records | Database |
| Audit history | Database |
| Workflow logging | Execution Layer |
| Platform translation | Adapter Layer |

---

## 3.3 Decision Boundary

The Runtime answers: *"What should happen?"*
The Execution Layer answers: *"How do we perform it safely and reliably?"*

```
Runtime:           Customer qualifies for booking.

Execution Layer:   Create calendar booking.
                    Update database.
                    Send confirmation email.
                    Notify internal team.
```

The Execution Layer never asks whether the customer qualifies — that decision has already been made.

---

## 3.4 Scoring Boundary

Calculations (numerical scores, formatting, validation, aggregation) are mechanical operations and may be performed inside the Execution Layer. **The interpretation of those calculations belongs exclusively to the Runtime.**

```
Execution Layer:   Lead Score = 82
Runtime:           82 → Priority Lead → Recommend Immediate Booking
```

This mirrors Agent Runtime System's Consultation Score Gate design (Module 3), which explicitly places the scoring *mechanism* out of scope for the Runtime document — Runtime consumes `score_received` and decides what to do with it. The Execution Layer may produce that number; it never decides its meaning.

---

# PART 4 — Responsibilities

## 4.1 Responsibilities of the Execution Layer

**External Integrations:** Calendar systems, email providers, CRM platforms, internal APIs, payment gateways, file storage, third-party services.

**Database Operations:** Insert, update, search, archive, log execution, record analytics.

**Workflow Coordination:** Execute tools, route requests, call utilities, trigger follow-up workflows.

**Validation:** Input/output validation, payload normalization, schema verification.

**Operational Reliability:** Retry handling, timeout management, error classification, logging, notifications.

**Scheduled Operations:** Follow-ups, recovery sequences, maintenance jobs, reporting, cleanup.

---

## 4.2 What Never Belongs in the Execution Layer

Customer psychology, prompt engineering, agent personalities, intent detection, conversation memory, qualification logic, business recommendations, recovery strategy, freedom-level decisions, module ownership decisions.

If a workflow requires one of these, it belongs in the Runtime.

---

# PART 5 — System Architecture

## 5.1 Overview

```
                    Customer
                        │
                        ▼
        Conversation Layer
      (Voiceflow / Convocore)
                        │
                        ▼
             Agent Runtime System
        (Business Logic & Decisions)
                        │
             Action Request / Tool Call
                        │
                        ▼
────────────────────────────────────────────
            EXECUTION LAYER (n8n)
────────────────────────────────────────────
        Entry Workflow
              │
              ▼
      Shared Utilities
              │
              ▼
    External Integrations
              │
              ▼
      Business Data Layer
          (Supabase)
              │
              ▼
       Standardized Response
              │
              ▼
         Agent Runtime System
              │
              ▼
      Conversation Layer
              │
              ▼
            Customer
```

---

## 5.2 Execution Core and Adapter Boundary

**Note on terminology:** earlier drafts of this document used "Layer 1" and "Layer 2" for this internal split. Since the Execution Layer is itself already one of the five architectural layers (Part 1.2), nesting a second "Layer 1/Layer 2" numbering inside it created unnecessary hierarchy confusion. This section uses **Execution Core** and **Adapter Boundary** instead — same concept, clearer naming.

**Execution Core.** Core Agent, Growth Agent, Conversion Engine, Recovery Engine, Email Manager workflows, Utilities, Dashboard (Folders 01–07, per Part 6). Platform-independent; unchanged if the conversation platform changes.

**Adapter Boundary.** Translates between conversation platforms and the Execution Core (Folder 08, per Part 6).

Current adapter: **Voiceflow** (production). **Convocore** is prospective, not yet built — see Part 16.4.

Future adapters: LangGraph, Custom APIs, Mobile applications.

---

## 5.3 Architectural Goal

1. **Platform Independence** — platforms can be replaced without redesigning workflows.
2. **Reusable Execution Logic** — implemented once, reused across all interfaces.
3. **Stable Operational Layer** — integrations, database interactions, logging, utilities remain consistent regardless of how customers communicate.

---

# PART 6 — Workflow Categories (Canonical 01–08 Structure)

## 6.1 Purpose

Without a strict organizational structure, workflows become difficult to maintain, duplicate logic appears, and architectural ownership becomes unclear. This section defines the **canonical workflow organization** — mandatory, based on **Runtime ownership**, not external systems.

---

## 6.2 Guiding Principle

**Folders represent business ownership — not implementation dependencies.**

A booking workflow may touch Google Calendar, Supabase, Email, Notification Router, CRM — but it belongs to only one Runtime module: **Conversion Engine**, because its business purpose is customer conversion.

---

## 6.3 Canonical Folder Structure

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

No additional top-level folders without architectural review.

---

## 6.4 Execution Core / Adapter Boundary Classification

```
Execution Core (platform-independent)    Adapter Boundary (platform-specific)
──────────────────────────────────       ──────────────────────────────────
01 Core Agent                            08 Adapters
02 Growth Agent
03 Conversion Engine
04 Recovery Engine
05 Email Manager
06 Utilities
07 Dashboard
```

(See Part 5.2 for the full terminology note and reasoning.)

---

## 6.5 Folder 01 — Core Agent

**Purpose:** Foundational operations shared across all archetypes.
**Responsibilities:** Customer initialization, session initialization, profile creation, configuration loading, tool execution coordination, conversation lifecycle updates.
**Example workflows:** Create Customer, Update Customer, Load Client Configuration, Load Archetype Configuration, Initialize Conversation, Archive Conversation, Update Conversation Status, General Tool Execution.

The Core Agent should remain intentionally generic.

---

## 6.6 Folder 02 — Growth Agent

**Purpose:** Lead development and engagement after initial customer interaction.
**Responsibilities:** Lead nurturing, follow-up initiation, engagement tracking, prospect enrichment, marketing automation triggers, customer re-engagement.
**Example workflows:** Create Lead, Update Lead, Schedule Follow-up, Assign Campaign, Update Engagement Score, Request Marketing Automation, Trigger Reminder Sequence.

These workflows execute Growth Agent requests but never determine engagement strategy themselves.

---

## 6.7 Folder 03 — Conversion Engine

**Purpose:** Executing customer conversion activities.
**Responsibilities:** Appointment booking, consultation processing, proposal generation, order creation, service confirmation, payment initiation, conversion recording.
**Example workflows:** Book Appointment, Cancel Appointment, Create Consultation, Update Consultation, Generate Proposal, Create Order, Record Conversion, Request Payment.

Qualification and recommendation decisions remain owned by the Runtime.

---

## 6.8 Folder 04 — Recovery Engine

**Purpose:** Recovery and operational continuation.
**Responsibilities:** Recovery queue execution, reminder scheduling, retry operations, no-response recovery, re-engagement execution, recovery logging.
**Example workflows:** Execute Recovery, Schedule Reminder, Resume Workflow, Retry Failed Operation, Process Recovery Queue, Send Re-engagement, Close Recovery Case.

Recovery strategies are determined by the Runtime; the Recovery Engine executes them.

---

## 6.9 Folder 05 — Email Manager

**Purpose:** Email operations, centralized for consistent formatting, delivery, logging, future provider replacement.
**Responsibilities:** Transactional email, follow-up email, internal notification, customer notification, email logging, delivery status updates.
**Example workflows:** Send Customer Email, Send Internal Email, Send Appointment Confirmation, Send Reminder Email, Send Recovery Email, Log Email Activity.

No business decision should exist inside Email Manager.

---

## 6.10 Folder 06 — Utilities

**Purpose:** Reusable components shared across all Runtime modules — platform-independent, business-independent, reusable, deterministic. Never customer-specific logic.

**Current canonical utilities:** Error Logger, Data Validator, Schema Resolver, Notification Router, Stop Checker.

**Utility Principles:** Reusable by multiple modules, independent of business context, stateless where possible, configurable, fully documented, version controlled.

If a workflow is reusable by only one Runtime module, it stays inside that module rather than becoming a Utility.

---

## 6.11 Folder 07 — Dashboard

**Purpose:** Operational reporting and platform visibility for internal users.
**Responsibilities:** Analytics generation, dashboard refresh, KPI calculation, daily summaries, scheduled reporting, administrative metrics.
**Example workflows:** Generate KPI Report, Refresh Dashboard, Daily Business Summary, Weekly Performance Report, Usage Statistics, Platform Health Summary.

Dashboard workflows consume business data but should not modify business processes.

---

## 6.12 Folder 08 — Adapters

**Purpose:** Isolate conversation platforms from Core Execution. The only platform-specific area.

**Current adapters:** Voiceflow (production). Convocore (prospective — see Part 16.4).
**Future:** LangGraph, REST API, Mobile App, Custom Integrations.

**Responsible for:** Request/response transformation, authentication translation, payload normalization, platform-specific formatting, error translation.

**Not responsible for:** Business decisions, database operations, customer qualification, workflow orchestration, Runtime logic.

---

## 6.13 Why We Organize by Runtime Module Instead of Integration

Grouping by external system (Google/, Stripe/, CRM/, Email/, Slack/) is convenient for small projects but breaks down once a single customer action spans multiple integrations:

```
Book Appointment → Google Calendar → Supabase → Email → CRM → Notification
```

If workflows are grouped by integration, ownership becomes ambiguous — no correct answer. Instead, Zenny organizes by **business ownership**:

```
Conversion Engine
└── Book Appointment
```

This aligns the Execution Layer directly with the Runtime Module Ownership Contract — every workflow has a single, unambiguous owner.

---

## 6.14 Workflow Placement Rules

```
What business module owns this process?
        ↓
Core Agent? Growth Agent? Conversion Engine?
Recovery Engine? Email Manager?
        ↓
Place workflow in that module.
        ↓
Use Utilities where appropriate.
        ↓
Call external integrations as dependencies.
        ↓
Return standardized response.
```

External integrations never determine workflow placement. Business ownership always determines workflow placement.

---

## 6.15 Architectural Benefits

Clear ownership, reduced duplication, platform independence (only Adapters change), easier maintenance, future scalability.

---

## 6.16 Canonical Rule

The 01–08 folder structure is the canonical organization of the Zenny Execution Layer, derived from the Runtime Module Ownership Contract. Any deviation requires explicit architectural review. Builders must not reorganize based on external integrations, convenience, or preference.

---

# PART 7 — Schema Targeting

## 7.1 Purpose

The Zenny platform uses a **schema-per-client** database architecture. Unlike traditional applications where every workflow interacts with a single shared schema, the Execution Layer must determine the correct database schema before performing any business operation.

Without correct schema targeting: client data may be mixed, cross-tenant access becomes possible, RLS assumptions become invalid, business operations become unreliable.

Schema Targeting is a first-class architectural concern and must occur before any database operation.

---

## 7.2 Guiding Principle

> Every database operation must know **which client schema it belongs to before it executes.**

No exceptions. No workflow should assume `public`, `default`, `current`, or `previous` schema.

---

## 7.3 Execution Flow

```
Receive Request → Identify Client → Resolve Schema → Verify Access →
Execute Database Operation → Return Result
```

The database should never be queried before schema resolution completes successfully.

---

## 7.4 The Actual Mechanism — Accept-Profile / Content-Profile Headers

This section states the concrete, tested mechanism — not just the principle that schema targeting must happen.

**Schema selection is performed via PostgREST's schema-selection headers**, empirically verified against the live project during the database build:

```
Accept-Profile:   {schema_name}    — GET/HEAD requests
Content-Profile:  {schema_name}    — POST/PATCH/PUT/DELETE requests
```

**Verified failure modes** (confirmed via real requests against the live project, per `Database_API_Reference.md`):
- A schema not registered in Exposed Schemas returns `406` / `PGRST106` ("Invalid schema") — the direct, concrete consequence of skipping the manual Exposed-Schemas step for a newly-onboarded client (Part 7.7).
- The correct schema with the wrong key (e.g., `anon` against a `service_role`-only table) returns `401` / `42501` ("permission denied") — confirms the RLS/grant hard-deny is real, not theoretical.

**In n8n specifically:** every HTTP Request node or Postgres/Supabase node touching client data must set the appropriate header dynamically, using the schema name resolved by the Schema Resolver (Part 7.5) — never a static, hardcoded value.

---

## 7.5 Schema Resolver

Schema resolution is performed exclusively through the shared **Schema Resolver Utility**.

**Responsibilities:** Resolve Client ID from the incoming request; query `control.clients.client_schema_name`; verify the schema exists and the client's `status` is `active`; return a standardized execution context.

The Schema Resolver should not execute business logic — only provide database context.

---

## 7.6 Execution Context

```
Client ID
Schema Name
Archetype                    (the client's assigned archetype, per Agent
                              Runtime System's 5-archetype model — NOT
                              "Business Type")
Runtime Configuration        (from control.client_config, including the
                              relevant archetype_settings JSONB entry)
Feature Flags (if applicable)
```

Subsequent workflows consume this context rather than performing additional schema lookups.

---

## 7.7 New Client Onboarding — The Manual Gate

Schema Targeting depends on a schema being registered in Exposed Schemas before it is reachable at all. This registration is currently a **manual step** (empirically confirmed during database Phase C — no MCP tool or `pgrst.db_schemas` GUC path exists to automate it today).

Every new client onboarding must include this manual step before that client's schema can be targeted. See `Database_API_Reference.md` §4 for the full builder-facing procedure. Automating this step is explicitly optional, deferred to end-of-n8n-build (Part 17.8) — not a blocker for initial onboarding.

---

## 7.8 Architectural Benefits

Tenant isolation, consistent workflow behavior, easier maintenance, improved security, simpler future scaling. Every workflow follows the same schema resolution process regardless of business purpose.

---

# PART 8 — Universal Workflow Pattern

## 8.1 Purpose

Every workflow should follow the same lifecycle — improving maintainability, debugging, builder productivity, reliability, testing. Mandatory for all entry workflows.

---

## 8.2 Universal Execution Lifecycle

```
Receive → Validate → Authenticate → Resolve Schema → Execute → Log → Respond
```

**Note on ordering:** Authenticate precedes Resolve Schema. Verifying request authenticity is cheap and should happen before any database lookup — for security (fail fast on unauthorized requests) and efficiency (don't spend a database round-trip validating a request that was never legitimate).

---

## 8.3 Stage 1 — Receive
Receive Tool request, capture metadata, generate Correlation ID, initialize execution context. No business logic.

## 8.4 Stage 2 — Validate
Validate payload, required fields, data types; normalize inputs. Invalid requests terminate immediately.

## 8.5 Stage 3 — Authenticate
Verify request source, permissions, execution rights. Authentication failures terminate execution immediately, before schema resolution or database access.

## 8.6 Stage 4 — Resolve Schema
Identify client, resolve schema (Part 7), verify tenant, load execution context. No database operations before this completes.

## 8.7 Stage 5 — Execute
Perform business operation, call external APIs, update database, trigger utilities, coordinate sub-workflows. The only stage where business operations occur.

## 8.8 Stage 6 — Log
Record execution, store metrics, log errors, update audit history. Regardless of outcome where possible.

## 8.9 Stage 7 — Respond
Format standardized response, return execution status/business result, include Correlation ID. Platform-independent.

## 8.10 Why Standardization Matters

Shared documentation, reusable utilities, consistent debugging, predictable workflows, easier onboarding, platform independence. Builders should never invent custom workflow lifecycles.

---

# PART 9 — Universal Error Handling

## 9.1 Purpose

Failures must be predictable, consistent, recoverable, observable. Every workflow classifies and handles errors using the same model.

## 9.2 Error Philosophy

Errors are operational events — never undefined workflow behavior. Every error must result in a known outcome.

## 9.3 Standard Error Categories

**Validation Error** — missing field, invalid type/format. Terminate; return validation response.
**Authorization Error** — invalid credentials/client/permissions. Terminate; log security event.
**Retryable Error** — temporary API failure, network timeout, service unavailable. Retry per Retry Strategy (Part 10).
**Permanent Error** — unknown customer, invalid configuration, missing resource. Terminate; log failure; notify if required.
**System Error** — unexpected exception, internal workflow failure, unknown runtime condition. Stop; log full context; escalate if necessary.

---

## 9.4 Mapping to the Fallback Pattern Catalog

The 5 error categories above classify *what kind of failure occurred*. `Fallback_Pattern_Catalog.md` (already cross-referenced live inside Agent Runtime System's Module 3 §2.1 and §5) defines *what happens in response*, using its A/B/C/D vocabulary. These are complementary, not redundant:

| Error Category | Fallback Pattern | Reasoning |
|---|---|---|
| Validation Error | **Pattern A** (Input Retry) | Correctable — matches Step 0B §7.3's one-ask/one-reattempt rule |
| Retryable Error | **Pattern B** (Silent Retry) | Transient, safe to retry without customer awareness |
| Permanent Error | **Pattern C** (Graceful Redirect / Mode Fallback) | Requested path can't complete — fall to next Mode per Module 3's chains |
| Authorization Error | **Pattern D** (Warm Handoff) | Trust/security boundary hit — route to human per Module 1D |
| System Error | **Pattern D** (Warm Handoff) | Unknown failures always escalate rather than being guessed at |

The 5-category classification determines internal logging/retry eligibility; the mapped Fallback Pattern determines what the customer actually experiences.

---

## 9.5 Error Flow

```
Failure → Classify (9.3) → Log → Retryable?
  Yes → Retry Strategy (Part 10)
  No  → Apply mapped Fallback Pattern (9.4) → Return Standard Error
```

## 9.6 Logging Requirements

Correlation ID, Workflow Name, Tool Name, Client ID, Timestamp, Error Category, Error Details.

**Implementation note:** `tool_call_log` currently holds `call_id, tool_name, calling_module, lead_id, state, request_payload, response_payload, timestamp` — no dedicated `correlation_id`/`error_category` columns yet. Until a migration adds them, include both as keys within `request_payload`/`response_payload` JSON. Flag as a candidate schema addition once production error-log query patterns reveal the real need — don't add speculatively now (same "manual first, learn the real need" discipline as the database's recovery-cadence decision).

## 9.7 Error Responses

Standardized: Success/Failure, Error Category, human-readable message, Correlation ID. Platform-specific formatting belongs in Adapters.

---

# PART 10 — Retry Strategy

## 10.1 Purpose

Not every failure should terminate execution — many are temporary. Retry Strategy improves reliability without Runtime intervention.

## 10.2 Guiding Principle

Retry only when repeating the action is safe. **Idempotency (Part 11) and Retry Strategy work together — load-bearing, not incidental.** No workflow implements retry without idempotency.

## 10.3 Retry Lifecycle

```
Execute → Failure → Retryable? ─No→ Return Failure
  Yes → Immediate Retry → Failure → Backoff → Retry → Failure →
  Final Retry → Failure → Log → Apply mapped Fallback Pattern (9.4) →
  Return Failure
```

## 10.4 Retry Classification

**Appropriate:** network failures, temporary service failures, rate limiting, timeouts.
**Not appropriate:** validation failures, authorization failures, missing business data, invalid configuration — these require correction, not repetition.

## 10.5 Retry Limits

Every Tool defines: maximum retries, retry interval, maximum execution duration. The Runtime should not need to manage retry behavior.

## 10.6 Escalation

When retries exhaust: log failure, update execution history, notify if required, return standardized failure (applying the mapped Fallback Pattern).

## 10.7 Relationship with Idempotency

Retry assumes repeated execution is safe. Every retryable workflow must implement idempotency — retry without it creates duplicate business actions.

## 10.8 Architectural Principle

The Execution Layer owns operational resilience. The Runtime requests an operation; the Execution Layer executes it as reliably as possible before returning a final standardized result.

---

# PART 11 — Idempotency

## 11.1 Purpose

Every incoming request **may be delivered more than once** — network retries, Voiceflow/Convocore retries, user double-clicks, API timeouts, webhook retransmission, n8n workflow retries, infrastructure failures.

Without protection: duplicate appointments, orders, invoices, payment requests, recovery sequences, emails.

## 11.2 Principle

> Every business action must be safe to execute more than once.

## 11.3 What Requires Idempotency

Create Lead, Create Customer, Book Appointment, Record Conversion, Send Payment Link, Trigger Recovery, Send Email, Create CRM Record. Any workflow creating/modifying/triggering business events.

## 11.4 Idempotency Strategy

Every request includes: Correlation ID + Idempotency Key + Tool Name + Timestamp.

```
If already completed: Return previous result. Do NOT execute again.
If not:                Execute. Store execution. Return result.
```

## 11.5 Database Responsibility

The database is the final source of truth. Unique constraints, duplicate-action protection (Agent Runtime System Module 3 §1.2, implemented in `Database_Structure_v4_FINAL.md`'s `conversions`/`recovery_queue` uniqueness design), and execution logs work together. The Execution Layer performs the operational check; the database provides the final guarantee.

---

# PART 12 — Tool Architecture

## 12.1 Purpose

The Runtime requests a **Tool**, not a workflow. The Execution Layer translates the tool request into workflows — preventing the Runtime from depending on n8n implementation details.

> **A Tool is a Runtime-facing capability. A Workflow is an Execution implementation.**

This is one of the most important distinctions in this entire document, and the most common source of confusion for new builders. Stated concretely:

```
Runtime sees:            n8n contains (for that one Tool):
──────────────           ──────────────────────────────────
BookAppointment           book_appointment_entry
                          calendar_create
                          database_update
                          email_confirmation
                          notification_send
```

The Runtime never sees, references, or depends on any of the internal workflow names. It calls `BookAppointment` and receives a standardized response (Part 15.4) — everything between the Tool Request and that response is Execution Layer implementation detail, free to change, be refactored, or be re-architected without ever touching the Runtime or requiring its knowledge.

## 12.2 Tool Execution Flow

```
Runtime → Tool Request → Entry Workflow → Shared Utilities →
Business Workflow → Database → Response → Runtime
```

The Runtime knows only Tool Names — never workflow names, folder structure, utility implementation, or API providers.

## 12.3 Entry Workflow Pattern

Every Tool begins with a single Entry Workflow, following the Universal Workflow Pattern (Part 8):

```
Book_Appointment → Validate → Authenticate → Resolve Schema → Execute → Log → Respond
```

Entry workflows provide a stable interface; internal implementation may evolve without affecting the Runtime.

## 12.4 Tool Naming

Stable, human-readable, platform-independent: `BookAppointment`, `CreateLead`, `UpdateCustomer`, `SendEmail`, `TriggerRecovery`, `GenerateProposal`, `RecordConversion`.

These follow `Tool_Naming_Convention.md`'s verb-entity discipline at the naming-philosophy level; the exact kebab-case webhook identifiers (e.g., `create-lead`) are defined there directly — Tool Names here are Runtime-facing labels, not necessarily identical to the webhook URL string.

## 12.5 Tool Responsibilities

Validation, authentication, schema resolution, execution, logging, standardized responses. Not business reasoning.

## 12.6 Tool Composition

```
Book Appointment → Validate → Calendar → Database → Email →
Notification → Analytics → Response
```

The Runtime still sees only one Tool.

---

# PART 13 — Shared Components

## 13.1 Purpose

Reusable functionality centralized rather than duplicated across modules — the operational foundation of the Execution Layer.

## 13.2 Canonical Shared Components

Schema Resolver, Data Validator, Error Logger, Notification Router, Stop Checker. Future components require architectural approval.

## 13.3 Schema Resolver

Determine correct client schema before any database operation. Resolve tenant, resolve schema, verify schema exists, return connection context. Full mechanism: Part 7. No business logic.

## 13.4 Data Validator

Ensure incoming payloads are valid — required fields, type/format validation, payload normalization. Implements Agent Runtime System's Step 0B §7 (Data Validation Layer) field-level rules directly: email/phone typo-correction, country-code handling, the one-ask/one-reattempt correction flow. Validation failures stop execution before any business operation.

## 13.5 Error Logger

Standardized operational logging — error classification (Part 9.3), correlation ID, stack information, runtime metadata, execution history. Writes to `tool_call_log` — see Part 9.6 for the current schema/field caveat.

## 13.6 Notification Router

Sends operational notifications — internal alerts, admin notifications, critical failures, escalations. Configurable.

## 13.7 Stop Checker

Determines whether execution should continue — customer opted out, conversation archived, recovery cancelled, workflow already completed. Directly implements Agent Runtime System Module 4's "re-read Lead Status live before every send" rule and the suppression-record checks defined in `Database_Structure_v4_FINAL.md`. Prevents unnecessary execution.

## 13.8 Shared Component Rules

Stateless where possible, platform-independent, reusable, fully documented, version controlled, independently testable. Never contain Runtime decisions.

---

# PART 14 — Database Integration

## 14.1 Purpose

The Execution Layer is the only layer responsible for operational interaction with the Business Data Layer. The Runtime defines what should exist; the Execution Layer performs the actual operations.

## 14.2 Integration Philosophy

The database stores business truth. The Execution Layer performs business operations. Neither replaces the other.

## 14.3 Schema Resolution

```
Receive Request → Resolve Client → Resolve Schema → Verify Access → Execute Query
```

Every workflow resolves the target schema (Part 7) before performing business operations. No default schema assumed.

## 14.4 Read Operations

Customer lookup, lead lookup, conversation lookup, configuration lookup, analytics retrieval. Optimized to minimize unnecessary queries.

## 14.5 Write Operations

Insert, update, archive, log, status changes. All writes: validate input, resolve schema, execute atomically where appropriate, log execution.

## 14.6 Ownership Principle

The Execution Layer may read/write/update/archive data. It may not redefine the database structure — schema evolution is governed by `Template_Migration_Process.md`'s manual, reviewed procedure.

## 14.7 Module Ownership

```
Growth Agent           → Leads, Growth Events, Handoff Payloads
Conversion Engine      → Conversions (core + archetype-specific extensions)
Recovery Engine        → Recovery Queue, Suppression Records
Core Agent              → Complaints, Customers, Escalations
Email Manager           → Emails, Attachments, Draft Edit Log
```

(Full table-to-module mapping: `Database_Structure_v4_FINAL.md`.)

---

# PART 15 — Runtime Integration Contract

## 15.1 Purpose

The Runtime and Execution Layer communicate through a standardized contract — neither side depends on internal implementation details.

## 15.2 Execution Flow

```
Runtime → Tool Request → Execution Layer → Business Operation →
Standard Response → Runtime
```

## 15.3 Standard Request Structure

Request Metadata, Correlation ID, Client ID, Conversation ID, Runtime Module, Tool Name, Payload, Authentication Context. Additional fields may be added without breaking backward compatibility.

## 15.4 Standard Response Structure

Success/Status, Correlation ID, Execution Timestamp, Business Result, Errors (if any), Warnings (optional). Platform-independent.

## 15.5 Correlation IDs

Unique per request; appears in logs, database updates, tool execution, error reports, notifications — enabling complete execution tracing.

## 15.6 Timeouts

Never wait indefinitely. Every Tool defines maximum execution time, retry policy, failure behavior. Timeouts produce standardized error responses.

## 15.7 Retry Contract

Consistent across the platform (Part 10). The Runtime never needs to know whether retries occurred — the Execution Layer manages this transparently.

## 15.8 Error Contract

Errors classified into the 5 standardized categories (Part 9.3), each mapped to a Fallback Pattern (Part 9.4). Sufficient context for logging/troubleshooting without exposing sensitive implementation details.

## 15.9 Platform Independence

The contract must remain unchanged regardless of platform. Current caller: Voiceflow Adapter. Prospective: Convocore Adapter (Part 16.4). Future: LangGraph Adapter, REST API, Mobile Applications.

## 15.10 Wire-Level Detail — Deferred to a Companion Document

This document defines the contract's *structure* (15.3–15.8). The exact wire-level detail — concrete JSON schemas, header specifications, exact error code enums, idempotency key format — belongs in a separate companion document: **Execution Layer Integration Contract v1** (not yet written; recommended as the next deliverable — Part 22.5).

This mirrors how `Database_API_Reference.md` was deliberately kept separate from `Database_Structure_v4_FINAL.md` — one document stays conceptual and stable, the other holds exact, constantly-referenced implementation detail.

## 15.11 Architectural Principle

The Runtime communicates with **Tools**, not workflows. The Execution Layer executes **workflows**, not business decisions. The Database stores **business truth**, not execution logic.

---

# PART 16 — Platform Integration

## 16.1 Purpose

The Execution Layer is intentionally independent of any specific conversation platform. Today: Voiceflow (production), Convocore (under evaluation — 16.4). Future: LangGraph, REST APIs, Mobile Applications, Custom Interfaces. Only the Adapter Layer requires modification.

## 16.2 Integration Philosophy

Conversation Layer communicates with customers. Runtime determines decisions. Execution Layer performs operations. This separation keeps conversation platforms replaceable without affecting business workflows.

## 16.3 Voiceflow Integration

**Current Status: ✅ Current Production Platform**

```
Customer → Voiceflow → Voiceflow Adapter → Runtime → Execution Layer →
Database / External Services → Execution Result → Runtime → Voiceflow → Customer
```

The Voiceflow Adapter is responsible only for request/response translation, authentication, payload normalization. Business logic must never exist inside the adapter.

**Known technical-debt item (carried forward from earlier project scanning):** the existing tool-call pattern uses a static, hardcoded `x-webhook-secret` — adequate for demo, not a real multi-client security model. Needs a proper secret-management upgrade before broader production use (Part 18.6).

## 16.4 Convocore Integration

**Current Status: 🟢 Built — ADP-002 (BC-009), see `Convocore_Adapter_Spec_FINAL.md` and `n8n_Workflow_Specification_v1.md` Part 17**

Convocore is the confirmed, adopted conversation-layer platform (superseding this section's earlier "prospective" framing). The Adapter is built and internally verified against the frozen contract; not yet live-tested against a real Convocore agent (none exists yet — deliberately out of this Adapter build's scope). This section's description below of the *intended* treatment now describes the actual built integration, not a hypothetical one.

If adopted, expected to follow the same architectural model as Voiceflow — only the adapter differs:

```
Customer → Convocore → Convocore Adapter → Runtime → Execution Layer
```

No business workflows require modification when switching between or supporting both platforms, per the Execution Core / Adapter Boundary split (5.2).

## 16.5 Future Platform Integration

```
LangGraph → LangGraph Adapter → Execution Layer
```
or
```
REST API → API Adapter → Execution Layer
```

The Runtime Integration Contract remains identical — only request translation changes.

## 16.6 Adapter Responsibilities

**May:** translate requests, normalize payloads, validate authentication, convert responses, handle platform-specific formatting.
**Must never:** execute business decisions, access databases directly, perform qualification, interpret customer psychology, implement Runtime logic.

Adapters remain intentionally thin.

---

# PART 17 — Deferred-by-Design Layers

## 17.1 Purpose

Some capabilities are intentionally **not implemented** during the Voiceflow/Convocore phase — not because unnecessary, but because current conversation platforms already provide equivalent functionality internally. These matter once the platform transitions toward a custom runtime such as LangGraph.

## 17.2 Runtime State Machine

**Status:** Deferred. **Reason:** Voiceflow/Convocore already maintain conversation execution state — building another inside n8n would duplicate platform functionality. **Future Need:** Required for LangGraph. **Database Impact:** None.

## 17.3 Universal Event System

**Status:** Deferred, with a real head start already in place. **Reason:** Current execution is primarily request-response; Voiceflow already controls sequencing. **Existing groundwork:** `tool_call_log` (already built, Database Phase A) is a functional first pass — already tracking REQUESTED→WAITING→SUCCESS/FAILED/TIMEOUT per tool call. A future full event system extends this; it does not start from zero. **Future Need:** Event-driven Runtime, event replay, workflow orchestration. **Database Impact:** Minimal — likely extension of `tool_call_log`, not a new table family.

## 17.4 Tool Definition Layer (includes Workflow Registry)

**Status:** Deferred. **Reason:** The current Integration Contract (Part 15) sufficiently defines Tool execution. Future: tool registry, metadata, versioning, discovery, dynamic loading.

**Scope note:** a "Workflow Registry" (Runtime → Tool Registry → Workflow Version → Execution) is the same underlying deferred concept as the Tool Registry described here, viewed from the Execution side of the Runtime↔Execution boundary rather than the Runtime side. They are documented together in this one section rather than as two separate deferred layers, to avoid the exact kind of disconnected-parallel-vocabulary problem Part 9.4 was built to prevent between Error Categories and Fallback Patterns. When this layer is eventually built, it should resolve both a Tool Name (Runtime-facing) and a specific Workflow Version (Execution-facing) as one lookup, not two separate registries that need reconciling.

No immediate implementation required for either framing.

## 17.5 Execution State Layer

**Status:** Deferred. **Reason:** Voiceflow manages execution checkpoints internally. **Future Need:** LangGraph, checkpoint recovery, resume execution, distributed execution. **Database Impact:** Possible execution-state tables; no redesign required.

## 17.6 Agent Versioning

**Status:** Deferred, with a real head start already in place. **Existing groundwork:** `control.template_versions` (already built, Database Phase C) already tracks per-archetype template version numbers and change descriptions; `control.agent_prompts` already has its own `version`/`status` fields. A future full agent-versioning system extends this to prompt/behavior-level versioning — it does not start from zero.

## 17.6.5 Workflow Versioning

**Status:** Deferred. **Purpose:** Allow individual workflow implementations to evolve (e.g., `BookAppointment_v1` → `BookAppointment_v2`) without breaking the stable Tool Name the Runtime references (per Part 12.4's "internal workflow names may change, Tool names remain stable" principle). This is distinct from Agent Versioning (17.6, which versions prompt/behavior content) and from the Tool Definition Layer (17.4, which is the future *registry* that would resolve a version dynamically) — Workflow Versioning specifically means individual workflow files/implementations carrying their own version identifier. **Reason for deferral:** at current build volume, a single active implementation per Tool is sufficient; formal versioning becomes valuable once multiple concurrent workflow versions need to coexist during a migration or A/B evaluation. **Database Impact:** Minimal — likely a `workflow_version` field alongside the existing `tool_call_log` entries once needed, not a new table family.

## 17.7 Advanced Observability

**Status:** Partial. **Current:** Tool logs, database logs, workflow logs. **Future:** Timeline replay, node tracing, runtime visualization, execution graph, performance tracing. Current implementation is sufficient for this phase.

## 17.8 Schema Exposure Automation

**Status:** Deferred, explicitly optional. **Reason:** No MCP tool or Supabase configuration path currently exists to automate Exposed Schemas registration (Part 7.7) — confirmed empirically during database Phase C. The manual procedure (`Database_API_Reference.md` §4) is sufficient for current onboarding volume. **Future Need:** One-click automation, planned as an end-of-n8n-build task once real onboarding volume justifies it.

## 17.9 Principle

Future architectural layers should only be introduced when the implementation platform requires them. The project intentionally avoids solving problems that do not yet exist.

---

# PART 18 — Security

## 18.1 Purpose

Security is a responsibility shared across every workflow, not a single feature.

## 18.2 Security Principles

Every workflow must: authenticate, authorize, validate, log, fail safely. Security must never depend on individual workflow implementations.

## 18.3 Authentication

Requests should only originate from trusted sources: Voiceflow Adapter, Convocore Adapter (once built), Internal Runtime, Approved APIs. Occurs before business execution begins (per Part 8's ordering — Authenticate precedes Resolve Schema).

## 18.4 Authorization

Authentication verifies identity; authorization verifies permission. The Execution Layer ensures correct client, schema, access level, service permissions.

## 18.5 Schema Isolation

Every request resolves its schema (Part 7) before performing operations. Cross-client access is prohibited.

This directly extends the RLS/`service_role`-only posture already established and empirically verified at the database layer (`Database_Structure_v4_FINAL.md`, `Supabase_MCP_Implementation_Notes.md`) — the Execution Layer is the enforcement point ensuring the database's isolation guarantees are actually exercised correctly on every call.

## 18.6 Secret Management

Secrets never hardcoded, logged, exposed in responses, or stored in workflows. Credentials remain centralized in n8n's credential store, not individual node configurations — directly resolving the technical-debt item flagged in Part 16.3.

## 18.7 Logging

Security events logged: authentication failures, authorization failures, invalid schema access, unexpected execution, critical system failures.

## 18.8 Failure Principle

Security failures fail closed. If identity, authorization, or schema resolution cannot be verified: execution stops, no business action occurs.

---

# PART 19 — Monitoring

## 19.1 Purpose

Sufficient visibility into operation to support debugging, reliability, continuous improvement.

## 19.2 Current Monitoring Capabilities

Workflow execution, tool execution, error logging, database updates, recovery activity — sufficient for the current implementation phase.

## 19.3 Operational Metrics

Workflow success rate, failure rate, retry frequency, execution duration, tool usage, database operations. Support continuous improvement, not business decision-making.

## 19.4 Error Monitoring

Every significant failure produces: log entry, correlation ID, workflow name, error classification, timestamp.

## 19.5 Future Monitoring

Intentionally deferred: distributed tracing, runtime visualization, workflow replay, performance dashboards, execution graphs. Valuable as the platform grows.

---

# PART 20 — Scaling

## 20.1 Current Deployment Philosophy

Designed for a single production deployment, optimizing for simplicity, reliability, maintainability. Premature horizontal scaling intentionally avoided.

## 20.2 Scaling Strategy

```
Single Server → Workflow Optimization → Infrastructure Optimization →
Additional Workers → Horizontal Scaling
```

Each stage justified by measurable operational demand.

## 20.3 Workflow Design

Every workflow: modular, stateless where possible, retryable, idempotent — naturally improving scalability.

## 20.4 Future Scaling

Potential future: worker separation, queue partitioning, distributed execution, regional deployments. Outside the scope of the current phase.

---

# PART 21 — Builder Rules

## 21.1 Purpose

Mandatory implementation standards for every workflow, ensuring long-term consistency regardless of who builds.

## 21.2 Rule 1 — Respect Runtime Ownership
Never duplicate Runtime decisions. Execution Layer executes; Runtime decides.

## 21.3 Rule 2 — Respect Module Ownership
Every workflow belongs to exactly one Runtime module. Never organize by external integrations.

## 21.4 Rule 3 — Use Shared Components
Reuse existing Utility functionality; never duplicate it.

## 21.5 Rule 4 — Resolve Schema Before Every Database Operation
Per Part 7/8's Universal Workflow Pattern: `Authenticate → Resolve Schema → Execute`. No exceptions.

## 21.6 Rule 5 — Never Hardcode Clients
All client behavior driven by configuration. No client-specific workflows.

## 21.7 Rule 6 — Log Everything Important
Tool execution, database writes, failures, retries, critical notifications.

## 21.8 Rule 7 — Build Small Workflows
Small, reusable, composable — never large monolithic workflows.

## 21.9 Rule 8 — Standardize Responses
Every Tool returns standardized responses (Part 15.4). Never invent custom formats.

## 21.10 Rule 9 — Design for Replacement
Every external dependency replaceable (Email Provider A→B, Calendar A→B, CRM A→B) — via adapter changes, not workflow redesign.

## 21.11 Rule 10 — Document Everything
Every workflow includes: Purpose, Inputs, Outputs, Dependencies, Owner, Version, Related Runtime module.

## 21.12 Rule 11 — Verify Against the Real Platform, Not Assumptions
Before building or documenting any node configuration, verify against current n8n documentation and/or the live n8n MCP connection — not against prior build docs. This project's earlier n8n build documentation was found to be substantially incorrect against the actual running platform version. The same empirical-verification discipline that caught real gaps during the Supabase database build (the `LIKE...INCLUDING ALL` FK-copying behavior, schema-specific default-grant behavior) applies here without exception.

---

# PART 22 — Final Architecture Summary

## 22.1 The Role of the Execution Layer

The Execution Layer transforms Runtime decisions into reliable, secure, repeatable business operations — the operational engine of the Zenny platform. It is not responsible for business reasoning; it is responsible for execution excellence.

## 22.2 Architectural Boundaries

```
Customer
        ▼
Conversation Layer
        ▼
Agent Runtime System (What should happen?)
        ▼
Execution Layer — n8n (How is it executed?)
        ▼
Business Data Layer (What happened?)
        ▼
External Services
```

## 22.3 Long-Term Vision

Designed to survive changes in the Conversation Layer.

**Today:** Voiceflow (production), Convocore (prospective).
**Tomorrow:** LangGraph, REST API, Custom Interfaces.

Regardless of platform, the Execution Layer continues providing the same operational capabilities through a stable Runtime Integration Contract.

## 22.4 Architecture Status

This document is the canonical implementation standard for the current Voiceflow phase (with Convocore under evaluation) of the Zenny AI Workforce platform. Future enhancements should extend this architecture rather than replace it.

## 22.5 Recommended Next Steps

1. **Execution Layer Integration Contract v1** (companion document, Part 15.10) — concrete wire-level JSON schemas, header requirements, error code enums, idempotency key format, versioning strategy.
2. **n8n Workflow Specification v1** — the detailed workflow inventory for the current phase, derived from this document.
3. **Build order:** Utilities first (Error Logger, Data Validator, Schema Resolver, Notification Router, Stop Checker), one at a time with review checkpoints — per the proven sequencing confirmed against old build docs.
4. **Every node configuration verified against live n8n documentation/MCP** before being trusted, per Rule 11 (21.12) — not carried forward from prior build docs, found substantially incorrect against the current platform version.
