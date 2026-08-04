# Claude Build Command Protocol v2

```
Status:    APPROVED — supersedes AI_Builder_Operating_Manual_v1.md entirely.
Purpose:   Define the operating model for building the Zenny platform using
           two AI parties — Claude (chat) as Commander and Claude Code as
           Executor — with the human as the sole approval and credential
           authority. Codex is no longer part of this pipeline; v1's
           three-party model (Human/Claude/Codex) is retired.
Position:  Governs how every Build Card gets issued, executed, and
           reviewed from this point forward. Referenced by
           Planning_to_Build_Transition_v1.md, which is the current
           entry point for the active build phase.
Rename:    v1 was titled "AI Workforce Implementation Orchestration Plan."
           Renamed to reflect what it actually now governs: a direct
           command relationship between the two Claude surfaces, not a
           multi-vendor workforce.
```

------------------------------------------------------------------------

# 1. Vision — Unchanged in Spirit, Restated for Two Parties

Implementation is intentionally **not fully autonomous**. Architecture is
frozen (or, per `Planning_to_Build_Transition_v1.md`, validated and
current) before implementation proceeds. Both AI parties execute against
that architecture; the human remains the approval and credential gate.

Core principles, unchanged:

- Architecture drives implementation.
- Claude (chat) commands. Claude Code executes.
- The human approves and controls credentials.
- Reality discovered during implementation feeds back into architecture
  only through controlled Change Requests — never a silent edit.

------------------------------------------------------------------------

# 2. Roles

## You — Chief Architect & Approval Authority

Owns: final architectural decisions, document approval, build
prioritization, credential management, change approval, production
readiness approval.

Never responsible for: building workflows, configuring nodes, writing
implementation logic.

------------------------------------------------------------------------

## Claude (this chat) — Commander

Responsibilities:

- Read and maintain all frozen/current documents.
- Plan implementation sequence (the phase plan in
  `Planning_to_Build_Transition_v1.md` Part 4 is the current standing
  sequence — Claude keeps it current as phases complete).
- Generate Build Cards (Section 5).
- Review Claude Code's Implementation Reports.
- Detect architectural violations.
- Generate Change Requests.
- Approve or reject completed Build Cards.
- Issue the next Build Card.

**Claude (chat) never directly builds** — no code execution, no MCP tool
calls that create/modify live infrastructure. It reads (via
`project_knowledge_search`, file view) and reasons, then commands.

------------------------------------------------------------------------

## Claude Code — Executor

Responsibilities:

- Execute a Build Card fully: build workflows, configure nodes/
  expressions/routing/retries/utilities, write and run migrations, deploy
  Edge Functions, build dashboard components — whatever the Build Card
  scopes.
- **Has orchestration authority within a Build Card's scope** — may
  break a Build Card into its own sub-steps, sequence its own tool calls,
  and make small implementation-detail judgment calls (e.g., exact node
  arrangement, minor naming) without stopping to ask, as long as the
  result matches the Build Card's stated objective and the Fixed
  Compliance Checklist (Section 10.C.1).
- Live-verify against MCP/current docs before building on any assumption
  (Section 6.1 — unchanged from v1, still mandatory).
- Test what it builds.
- Report back precisely: what was built, what was verified live vs.
  assumed, what's blocked, what deviated from the Build Card and why.

**Claude Code never changes architecture.** A genuine architectural
mismatch discovered mid-build is a Change Request (Section 10.D) back to
the Commander, not a unilateral fix — the orchestration authority above
covers *how* to build within the given scope, not *what* the scope should
be.

**Shared tooling:** both parties have the same MCP connections (Supabase,
n8n). Claude (chat) uses this to *read/verify* before issuing a Build
Card; Claude Code uses it to *build*. Read access by the Commander is not
a build action and doesn't require credential-gate handling.

------------------------------------------------------------------------

# 3. Required Reading Before Building

Per `Planning_to_Build_Transition_v1.md`, the current entry point. That
document supersedes v1's static "Required Documents" list (which
referenced a `Build Execution Plan` and standalone `Build Cards` gate that
this project's actual history moved past). Current standing reading list,
maintained going forward in the Transition document itself, not
duplicated here to avoid drift:

- Every frozen/current architecture document (Runtime, Database,
  Execution Architecture, Integration Contract, Workflow Specification)
- `External_Integration_Strategy_v1.md`,
  `Client_Integration_and_Credential_Platform_v1.md`,
  `Provider_App_Setup_Guide_v1.md`
- The three Convocore FINAL documents
- `Planning_to_Build_Transition_v1.md` itself — the current phase plan
  and decision record

------------------------------------------------------------------------

# 4. End-to-End Lifecycle

```
Current Architecture (frozen or validated-current)
        ↓
Claude (Commander) reviews relevant documents
        ↓
Claude issues a Build Card
        ↓
Claude Code (Executor) executes — self-orchestrating sub-steps as needed
        ↓
Credential required?
      /        \
    No          Yes
    |            |
 Continue    Pause & Report
    |            |
    |       Human adds credential
    |            |
    └──── Resume ────┘
        ↓
Claude Code Implementation Report
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

Unchanged from v1 — each Build Card represents exactly **one** workflow,
dashboard component, migration, or comparably-scoped unit of work.

Contains:

- Build Card ID
- Target (workflow name / migration / dashboard piece / Edge Function)
- Runtime Module or system area
- Purpose
- Inputs
- Outputs
- Dependencies
- Shared Utilities involved
- Acceptance Criteria
- Test Cases
- Definition of Done

------------------------------------------------------------------------

# 6. Claude → Claude Code Build Card Issuance

Every Build Card includes:

- Build Card reference/ID
- Architectural constraints
- Objective
- Required utilities
- Folder/location placement
- Testing instructions
- Expected outputs
- Open Verification Items resolved by this card, if any (6.2)

Claude Code should never receive the full project for one Build Card —
scope stays narrow, per-card.

------------------------------------------------------------------------

## 6.1 Mandatory Pre-Build MCP Verification — Unchanged, Still Mandatory

Before executing any Build Card, Claude Code must verify the specific
node, capability, or field the card depends on directly against the live
n8n MCP / Supabase MCP connection and current documentation — not recite
it from a frozen architecture document.

This is not optional. Prior build documentation has already been found
substantially wrong against the live platform more than once in this
project (the Supabase schema-header question; Claude Code's own draft
catching missing `event_type`/`eventTypeId` params before shipping,
Calendar provider research). Frozen documents describe *architecture and
intent*, never *current platform capability*.

**Applies in particular to:**

- Node type / capability questions (e.g., native vs. HTTP Request node
  for a given operation)
- Credential store mechanics for the specific service the workflow calls
- Any node parameter, expression syntax, or default behavior the Build
  Card relies on
- Any third-party provider API shape (Google, Shopify, Slack, Calendly,
  Cal.com, Convocore) — verify against that provider's current live docs,
  not memory

**Procedure, unchanged:**

1. Identify the specific capability the Build Card depends on.
2. Query the MCP connection / current docs directly for that capability.
3. If it matches the assumption — proceed, note "verified" in the
   Implementation Report.
4. If it doesn't match — do not silently patch around it. Raise a Change
   Request if the mismatch affects architecture; otherwise correct course
   and note the correction and why.
5. Never build on an unverified assumption, even if it "should" be true.

Scoped to the one capability the current Build Card needs — not a full
platform audit before every card.

------------------------------------------------------------------------

## 6.2 Closing Open Verification Items

Both `INTEGRATION_CONTRACT_v1.md`'s originally-flagged items and every
open item accumulated since (tracked centrally in
`Planning_to_Build_Transition_v1.md` Part 6) follow the same rule:
whenever a Build Card's MCP verification (6.1) resolves one — confirming
or contradicting the prior assumption — the Implementation Report states
which item it resolves. Once resolved, the next Architecture Review marks
it closed in the Transition document, rather than leaving it silently
open after the fact.

------------------------------------------------------------------------

# 7. Claude Code Execution Rules

For every workflow or comparable build unit:

1. Create the workflow/component
2. Configure nodes/fields
3. Configure expressions
4. Connect shared utilities
5. Configure logging
6. Configure retry
7. Configure idempotency (where applicable)
8. Configure schema targeting
9. Test
10. Export/deploy
11. Report

------------------------------------------------------------------------

# 8. Human Credential Gate — Unchanged

AI never creates or invents credentials.

If credentials are required:

- Create nodes/config with every non-secret field set.
- Leave the credential empty or use the agreed placeholder pattern
  (`Client_Integration_and_Credential_Platform_v1.md`'s placeholder
  convention, or the HTTP Request + Header Auth test-account pattern
  confirmed in `Planning_to_Build_Transition_v1.md` Part 2.8 for live
  end-to-end testing).
- Stop and report exactly what credential is required.
- Human adds the credential.
- Claude Code resumes.

**External Secrets** (require human intervention): Google OAuth, Shopify,
Slack, Calendly, Cal.com, Supabase Service Role, Twilio, Convocore agent
secrets, any LLM/OpenRouter API key.

**Existing n8n Credential References:** if a credential already exists
under a known name, Claude Code may reference it without exposing the
secret value.

------------------------------------------------------------------------

# 9. Pause Point System — Unchanged

If blocked, report:

- Pause Point ID
- Reason
- Progress %
- Remaining Tasks
- Resume Instruction

Human performs the required action. Claude Code resumes from the pause
point — it does not restart the Build Card from zero.

------------------------------------------------------------------------

# 10. Standard Reports

## A. Build Card

Issued by Claude (Commander).

## B. Implementation Report

Issued by Claude Code. Includes:

- Build Card reference
- Status
- Work completed
- Tests run and results
- Credential requirements encountered
- Problems
- Workarounds
- Questions for the Commander
- Deployment/export status
- MCP-verified facts discovered (per 6.1) — any live platform behavior
  that differs from a frozen/current document's assumption must be
  reported even if not specifically asked for
- Open Verification Item(s) resolved this cycle, if any (6.2)

## C. Architecture Review

Issued by Claude (Commander), from the Implementation Report. Includes:

- Compliance checklist (fixed — 10.C.1, not reinvented per card)
- Violations
- Required fixes
- Approval status
- Next Build Card

### C.1 Fixed Compliance Checklist — Unchanged

Every Architecture Review checks the same list, derived from
`INTEGRATION_CONTRACT_v1.md` Part 22 and this document's Section 12. Not
reinvented per Build Card.

**From the Integration Contract (Part 22):**

1. Runtime calls Tools, never workflows — nothing n8n-internal leaked to
   the Runtime side.
2. Tool name is stable PascalCase; breaking changes ship as a new
   version, never a silent redefinition.
3. n8n owns execution and retries — no retry logic pushed upstream.
4. Database structure untouched by workflow logic — schema needs route
   through `Template_Migration_Process.md`.
5. Authentication present on every entry point.
6. `Accept-Profile` / `Content-Profile` resolved fresh via Schema
   Resolver — no static/default schema anywhere.
7. `tool_call_log` row written on every execution, matching the real
   column set.
8. `idempotency_key` present and honored for every create/modify/trigger
   action.
9. Response matches the Standard Success/Error shape exactly.
10. Utility order matches the Mandatory Utility Order (Schema Resolver →
    Validator → Stop Checker → Business Workflow → Error Logger →
    Notification Router → Credential Resolver where applicable, per
    UTIL-006's addition).

**From this document (Section 12, Definition of Done):**

11. Correct folder placement.
12. Correct naming convention.
13. Shared Utilities reused, not reimplemented inline.
14. Tests passed, matching the 5 test categories (Success, Failure,
    Security, Retry, Duplicate) from the Integration Contract.

**Additional, per Section 6.1/6.2:**

15. Any live-platform fact the Build Card depended on was actually
    verified — not assumed.
16. If this Build Card touched an Open Verification Item, the live
    answer is recorded and reflected back to the tracking list.

**New, per this document's two-party model:**

17. If Claude Code exercised orchestration authority (Section 2) to
    deviate from the Build Card's literal steps, the Implementation
    Report states what changed and why — the Commander reviews this as
    part of approval, not as a silent implementation detail.

A Build Card fails review if any applicable item is unresolved, not just
the ones judged "important" for that particular unit of work.

## D. Change Request

Raised only when implementation reveals a genuine architectural issue —
not a mechanical registration gap (which Claude Code may fix directly
under its orchestration authority if it's purely additive/consistent with
existing patterns, e.g., adding a missing utility ID entry) but a real
mismatch requiring a Commander decision.

Contains: CR ID, Reason, Impact, Recommendation, Documents affected,
Approval status.

No architectural document changes without Commander review and human
approval.

## E. PROJECT_STATE.md Sync

PROJECT_STATE.md is the real-time ground truth of build state — schema,
workflows, credentials, blockers — maintained by Claude Code at the end
of every session (per CLAUDE.md's session protocol) and committed to
the zenny-sync repo alongside that session's actual changes.

**Before issuing any Build Card, the Commander reads PROJECT_STATE.md
first** — via GitHub MCP (fetch directly from zenny-sync), UNLESS the
human states in-chat that they've uploaded PROJECT_STATE.md directly
into the project files, in which case the uploaded copy is read instead
and a fresh MCP fetch is not needed.

This exists because a Build Card issued against a stale or assumed state
is worse than one delayed by 30 seconds of reading — Section 6.1's
MCP-verification discipline applies to schema/workflow build capability;
this section applies the same principle to the Commander's own picture
of what's already built.
------------------------------------------------------------------------

# 11. Workflow/Build Status Model — Unchanged

Draft → Implemented → Test Blocked → Tested → Approved → Production Ready

------------------------------------------------------------------------

# 12. Definition of Done — Unchanged

A Build Card is complete only when: the artifact exists, correct
folder/location, correct naming, utilities reused, schema targeting
implemented, logging implemented, retry implemented (where applicable),
idempotency implemented (where applicable), standard response
implemented, tests passed, Commander approved.

------------------------------------------------------------------------

# 13. Implementation Rules

**Claude (Commander):**
- Never builds directly.
- Never bypasses architecture.
- Never approves its own Build Card without a genuine Implementation
  Report to review.

**Claude Code (Executor):**
- Never changes architecture unilaterally.
- Never invents credentials.
- Never embeds secrets in code/config.
- Never bypasses a Build Card's stated objective, even while exercising
  orchestration authority over *how* to reach it.
- Always verifies live before building on an assumption (6.1).

**Human:**
- Owns approvals.
- Owns credentials.
- Owns architecture.

------------------------------------------------------------------------

# 14. Benefits — Unchanged

Strong architectural consistency, secure credential handling, controlled
evolution, clear separation of responsibilities, repeatable
implementation process, easier debugging and auditing.

------------------------------------------------------------------------

# 15. Future Expansion

Additional AI parties may be introduced later (testing, documentation,
QA), but must integrate through the same Commander → Executor → Human
approval pipeline without altering the core two-AI-party model defined
here.

------------------------------------------------------------------------

## Document Changelog

- **v1** — original 3-party model (Human / Claude / Codex).
- **v2 (this version)** — retired Codex entirely; Claude Code now holds
  both the orchestration and execution responsibilities v1 split across
  Claude and Codex. Added explicit orchestration authority for Claude
  Code within a Build Card's scope (Section 2, Section 13, new checklist
  item 17). Renamed from "AI Workforce Implementation Orchestration Plan"
  to "Claude Build Command Protocol" to reflect the actual two-party
  relationship. Section 3's document list now points to
  `Planning_to_Build_Transition_v1.md` as the maintained entry point
  rather than a static list that had drifted out of date. Section 10.C.1
  checklist item 10 updated to include UTIL-006 (Credential Resolver) in
  the Mandatory Utility Order.
