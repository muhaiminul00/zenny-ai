# AI Workforce Implementation Orchestration Plan v1

**Status:** Approved — revised with 2 additions (Section 6.1 Mandatory
Pre-Prompt MCP Verification, Section 6.2 Open Verification Item tracking,
Section 10.C.1 Fixed Compliance Checklist)\
**Purpose:** Define the human-in-the-loop implementation process for
building the Zenny platform using Claude Code (orchestrator) and Codex
(builder), with the human as the sole bridge between the two — reports
flow Codex → Human → Claude → Human → Codex, never automated end-to-end.

------------------------------------------------------------------------

# 1. Vision

The implementation phase is intentionally **not fully autonomous**.

The architecture, plans, and specifications are frozen before
implementation begins. AI builders execute against those documents while
a human remains the approval and credential gate.

Core principles:

-   Architecture drives implementation.
-   Claude Code orchestrates.
-   Codex implements.
-   The human approves and controls credentials.
-   Reality discovered during implementation feeds back into
    architecture only through controlled change requests.

------------------------------------------------------------------------

# 2. Roles

## Me(CTO) --- Chief Architect & Approval Authority

Owns:

-   Final architectural decisions
-   Document approval
-   Build prioritization
-   Credential management
-   Change approval
-   Production readiness approval

Never responsible for:

-   Building workflows
-   Configuring nodes
-   Writing implementation logic

------------------------------------------------------------------------

## Claude Code --- Build Orchestrator

Responsibilities:

-   Read all frozen documents
-   Plan implementation sequence
-   Generate Build Prompts
-   Review Codex output
-   Detect architectural violations
-   Generate Change Requests
-   Approve or reject Build Cards
-   Produce the next Build Prompt

Claude never directly builds workflows.

------------------------------------------------------------------------

## Codex --- Implementation Engineer

Responsibilities:

-   Build workflows in live n8n using MCP
-   Configure nodes
-   Configure expressions
-   Configure routing
-   Configure retries
-   Configure utilities
-   Test workflows
-   Report implementation status

Codex never changes architecture.

------------------------------------------------------------------------

# 3. Required Documents Before Building

Implementation does not begin until these are frozen:

1.  Agent Runtime System
2.  Database Structure
3.  Database Review & Future Roadmap
4.  n8n Execution Architecture
5.  Execution Layer Integration Contract
6.  n8n Workflow Specification
7.  n8n Build Execution Plan
8.  Build Cards
9.  AI Builder Operating Manual (this document)

------------------------------------------------------------------------

# 4. End-to-End Lifecycle

``` text
Frozen Architecture
        ↓
Claude reviews documents
        ↓
Claude generates Build Prompt
        ↓
Codex implements Build Card
        ↓
Credential required?
      /        \
    No          Yes
    |            |
 Test        Pause & Report
    |            |
    |       Human adds credential
    |            |
    └──── Resume Testing ────┘
        ↓
Codex Implementation Report
        ↓
Human review
        ↓
Claude Architecture Review
        ↓
Approved?
   /        \
 Yes         No
 |            |
Next Card   Fix / Change Request
```

------------------------------------------------------------------------

# 5. Build Card System

Each Build Card represents exactly **one workflow**.

Contains:

-   Build Card ID
-   Workflow Name
-   Runtime Module
-   Purpose
-   Inputs
-   Outputs
-   Dependencies
-   Shared Utilities
-   Acceptance Criteria
-   Test Cases
-   Definition of Done

------------------------------------------------------------------------

# 6. Claude → Codex Build Prompt

Every prompt includes:

-   Build Card reference
-   Architectural constraints
-   Workflow objective
-   Required utilities
-   Folder placement
-   Testing instructions
-   Expected outputs
-   Open Verification Items resolved by this prompt (if any — see 6.1)

Codex should never receive the full project for implementation at once.

------------------------------------------------------------------------

## 6.1 Mandatory Pre-Prompt MCP Verification

Before issuing any Build Prompt, Claude Code must verify the specific node,
capability, or field the prompt depends on directly against the live n8n MCP
connection and current n8n documentation — not recite it from a frozen
architecture document.

This is not optional and is not satisfied by citing that a document already
says so. Per Execution Architecture Rule 11 (21.12), prior build documentation
has already been found substantially wrong against the live platform once in
this project — frozen documents describe *architecture and intent*, never
*current platform capability*.

**Applies in particular to:**

-   Which node type (native Supabase node vs. HTTP Request node) is actually
    capable of setting `Accept-Profile` / `Content-Profile` headers, per the
    Integration Contract's flagged open item (`Database_API_Reference.md`
    notes this may still be HTTP-Request-only — confirm before every Build
    Prompt that assumes otherwise, not just the first one).
-   Credential store mechanics for the specific service the workflow calls.
-   Any node parameter, expression syntax, or default behavior the Build Card
    relies on.

**Procedure:**

1.  Identify the specific capability the Build Card depends on.
2.  Query the n8n MCP / current n8n docs directly for that capability.
3.  If it matches the frozen document's assumption — proceed, note "verified"
    in the Build Prompt.
4.  If it does not match — do not silently patch the prompt. Raise a Change
    Request (Section 10.D) if the mismatch affects architecture; otherwise
    correct the Build Prompt directly and note the correction and why.
5.  Never issue a Build Prompt on an unverified assumption about live platform
    behavior, even if the assumption "should" be true based on how similar
    tools usually work.

This check is scoped to the one capability the current Build Card needs — not
a full platform audit before every prompt.

------------------------------------------------------------------------

## 6.2 Closing the Integration Contract's Open Verification Items

`INTEGRATION_CONTRACT_v1.md` (frozen) flags 5 items explicitly deferred to
live verification:

1.  `x-webhook-secret` replacement / real secret-management mechanism
2.  `tool_call_state_enum`'s exact member values
3.  Per-tool timeout values (not yet decided anywhere in the project)
4.  n8n's native Supabase node's current schema/profile-parameter support
5.  Whether `correlation_id` / `error_category` columns should be added to
    `tool_call_log` via migration, or deferred

Whenever a Build Prompt's MCP verification (6.1) resolves one of these five
items — whether it confirms or contradicts the Contract's stated assumption —
the Build Prompt must state which item it resolves, and the following
Implementation Report (Section 10.B) must confirm the live answer found.
Once all 5 are closed, note this explicitly in the next Architecture Review
so the Integration Contract's open-items list can be marked resolved rather
than silently forgotten mid-build.

------------------------------------------------------------------------

# 7. Codex Implementation Rules

For every workflow:

1.  Create workflow
2.  Configure nodes
3.  Configure expressions
4.  Connect utilities
5.  Configure logging
6.  Configure retry
7.  Configure idempotency
8.  Configure schema targeting
9.  Test
10. Export
11. Report

------------------------------------------------------------------------

# 8. Human Credential Gate

AI never creates or invents credentials.

If credentials are required:

-   Create nodes.
-   Configure every non-secret field.
-   Leave credential empty or use agreed placeholder.
-   Stop testing if blocked.
-   Report required credential.
-   Human adds credential.
-   Codex resumes testing.

Credential types:

## External Secrets

Examples:

-   Google OAuth
-   Gmail OAuth
-   Supabase Service Role
-   Stripe
-   OpenAI
-   Anthropic
-   Twilio

Require human intervention.

## Existing n8n Credential References

If a credential already exists with a known name, Codex may reference it
without exposing secrets.

------------------------------------------------------------------------

# 9. Pause Point System

If blocked:

Example:

-   Pause Point ID
-   Reason
-   Progress %
-   Remaining Tasks
-   Resume Instruction

Human performs required action.

Codex resumes from the pause point.

------------------------------------------------------------------------

# 10. Standard Reports

## A. Build Prompt

Issued by Claude.

## B. Implementation Report

Includes:

-   Build Card
-   Status
-   Work completed
-   Tests
-   Credential requirements
-   Problems
-   Workarounds
-   Questions
-   Export status
-   MCP-verified facts discovered (per Section 6.1) — even if not requested,
    any live platform behavior discovered during the build that differs from
    a frozen document's assumption must be reported
-   Open Verification Item(s) resolved this cycle, if any (Section 6.2)

## C. Architecture Review

Issued by Claude.

Includes:

-   Compliance checklist (fixed — Section 10.C.1, not reinvented per card)
-   Violations
-   Required fixes
-   Approval status
-   Next Build Card

### C.1 Fixed Compliance Checklist

Every Architecture Review checks the same list, derived directly from
`INTEGRATION_CONTRACT_v1.md` Part 22 (Final Rules) and this manual's Section
12 (Definition of Done). Not reinvented per Build Card — a fixed list is what
makes reviews comparable across the whole build.

**From the Integration Contract (Part 22):**

1.  Runtime calls Tools, never workflows — the workflow is invoked only by
    its Tool Name, nothing n8n-internal leaked to the Runtime side.
2.  Tool name is stable PascalCase; any breaking change ships as a new
    version, not a silent redefinition.
3.  n8n owns execution and retries — Runtime-facing contract shows no retry
    logic pushed upstream.
4.  Database structure untouched — no inline schema/table changes; any schema
    need routes through `Template_Migration_Process.md`, not this workflow.
5.  Authentication present on every entry point — no unauthenticated path in.
6.  `Accept-Profile` / `Content-Profile` resolved fresh via Schema Resolver —
    no static or default schema anywhere in the workflow.
7.  `tool_call_log` row written on every execution, matching the real column
    set (Part 9.4) — no invented fields assumed to exist.
8.  `idempotency_key` present and honored for every create/modify/trigger
    action (Part 11.2's list).
9.  Response matches the Standard Success (Part 8) or Standard Error (Part 9)
    shape exactly — no ad hoc response fields.
10. Utility order matches Section 13.3's Mandatory Utility Order (Schema
    Resolver → Validator → Stop Checker → Business Workflow → Error Logger →
    Notification Router).

**From this manual (Section 12, Definition of Done):**

11. Correct folder placement (01–08, per Execution Architecture Part 6).
12. Correct workflow naming convention.
13. Shared Utilities reused, not reimplemented inline.
14. Tests passed, matching Section 19's 5 test categories (Success, Failure,
    Security, Retry, Duplicate) from the Integration Contract.

**Additional, per Section 6.1/6.2 of this manual:**

15. Any live-platform fact the Build Prompt depended on was actually verified
    against MCP/docs before the prompt was issued — not assumed.
16. If this Build Card touched one of the Integration Contract's 5 Open
    Verification Items, the live answer is recorded in the Implementation
    Report and reflected back to this checklist item, not left open silently.

A Build Card fails review if any of the 16 items is unresolved, not just the
ones judged "important" for that particular workflow.

## D. Change Request

Raised only when implementation reveals architectural issues.

Contains:

-   CR ID
-   Reason
-   Impact
-   Recommendation
-   Documents affected
-   Approval status

No architectural document changes without approval.

------------------------------------------------------------------------

# 11. Workflow Status Model

-   Draft
-   Implemented
-   Test Blocked
-   Tested
-   Approved
-   Production Ready

------------------------------------------------------------------------

# 12. Definition of Done

A Build Card is complete only when:

-   Workflow exists
-   Correct folder
-   Correct naming
-   Utilities reused
-   Schema targeting implemented
-   Logging implemented
-   Retry implemented
-   Idempotency implemented
-   Standard response implemented
-   Tests passed
-   Claude approved

------------------------------------------------------------------------

# 13. Implementation Rules

Claude:

-   Never implements workflows.
-   Never bypasses architecture.

Codex:

-   Never changes architecture.
-   Never invents credentials.
-   Never embeds secrets.
-   Never bypasses Build Cards.

Human:

-   Owns approvals.
-   Owns credentials.
-   Owns architecture.

------------------------------------------------------------------------

# 14. Benefits

-   Strong architectural consistency
-   Secure credential handling
-   Controlled evolution
-   Clear separation of responsibilities
-   Repeatable implementation process
-   Easier debugging and auditing
-   Future-proof for additional AI builders

------------------------------------------------------------------------

# 15. Future Expansion

Additional builders may be introduced later (testing, documentation,
QA), but they must integrate through the same approval pipeline without
changing the core roles defined here.
