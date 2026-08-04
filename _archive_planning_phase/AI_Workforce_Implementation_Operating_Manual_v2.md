# AI Workforce Implementation Operating Manual v2

**Status:** APPROVED — Version 2 (Implementation Model Revision)

**Purpose:** Define the complete implementation operating model for building the Zenny AI Workforce platform using **Claude Code** as the **Architecture Orchestrator** and **Codex** as the **Implementation Lead**, with the human (CTO) remaining the sole approval authority and credential gate.

---

# Why Version 2?

Version 1 was written when Claude Code performed a significant portion of the implementation planning, MCP verification, and implementation review.

Since then, both **Claude Code** and **Codex** now have:

- n8n MCP access
- Live platform verification capability
- n8n implementation skills
- Documentation access
- Architecture awareness

This fundamentally changes the most efficient implementation model.

Instead of having Claude Code spend large amounts of tokens on implementation tasks that Codex can perform equally well, Version 2 intentionally shifts almost all implementation work to Codex.

Claude Code now focuses almost exclusively on:

- Architectural governance
- Cross-document consistency
- Change control
- Final implementation approval

Codex becomes responsible for:

- Planning implementation
- Live MCP verification
- Workflow construction
- Testing
- Compliance verification
- Implementation reporting

This significantly reduces Claude token usage while improving implementation efficiency without sacrificing architectural quality.

---

# Why the Name Changed

Version 1 was called:

> **AI Builder Operating Manual**

That name reflected an implementation process focused primarily on builders.

Version 2 governs the entire AI implementation workforce, including:

- CTO
- Claude Code
- Codex
- Human approval
- Credential management
- Change control
- Reporting
- Governance

Because it now defines how the entire implementation workforce operates—not just builders—the document has been renamed:

> **AI Workforce Implementation Operating Manual**

This better reflects its true scope.

---

# 1. Vision

The implementation phase is intentionally **human-governed but AI-executed**.

Architecture is frozen before implementation begins.

Implementation is delegated almost entirely to Codex.

Claude protects architecture.

The human controls approvals and credentials.

Reality discovered during implementation may improve architecture, but only through approved Change Requests.

Core principles:

- Architecture drives implementation.
- Codex performs implementation.
- Claude governs architecture.
- Human approves architectural changes.
- Credentials remain human controlled.
- Implementation never silently changes architecture.

---

# 2. Workforce Roles

---

## CTO — Chief Architect & Approval Authority

Owns:

- Final architecture
- Document approval
- Build prioritization
- Credentials
- Production approval
- Change Request approval

Never responsible for:

- Workflow implementation
- Node configuration
- Testing
- MCP verification

---

## Claude Code — Architecture Orchestrator

Claude is **not an implementation engineer.**

Claude owns architectural governance only.

Responsibilities:

- Read frozen architecture
- Select the next Build Card
- Resolve architectural ambiguity
- Review architectural compliance
- Validate proposed Change Requests
- Approve completed Build Cards
- Update implementation status

Claude never:

- Builds workflows
- Configures nodes
- Performs MCP verification
- Creates implementation strategies
- Tests workflows
- Recreates implementation reports

Claude thinks.

Claude governs.

---

## Codex — Implementation Lead

Codex owns implementation.

Responsibilities:

- Read Build Cards
- Interpret implementation requirements
- Read Workflow Specification
- Read Integration Contract
- Read Runtime documentation
- Analyze dependencies
- Perform live MCP verification
- Verify node capabilities
- Create implementation strategy
- Build workflows
- Configure nodes
- Configure expressions
- Configure utilities
- Configure routing
- Configure retries
- Configure logging
- Configure schema resolution
- Configure idempotency
- Test workflows
- Perform self-review
- Verify compliance
- Generate Implementation Reports
- Export workflows

Codex never:

- Changes architecture
- Approves Change Requests
- Invents credentials
- Overrides architecture

Codex executes.

---

# 3. Required Frozen Documents

Implementation begins only after the following documents are frozen.

1. Agent Runtime System
2. Database Structure
3. Database Review & Future Roadmap
4. n8n Execution Architecture
5. Integration Contract
6. Workflow Specification
7. Build Execution Plan
8. Build Cards
9. AI Workforce Implementation Operating Manual (this document)

---

# 4. Operating Philosophy

Every AI performs the work it is best suited for.

Claude specializes in:

- reasoning
- governance
- architecture

Codex specializes in:

- implementation
- tooling
- verification
- testing

Therefore:

Claude decides **what** should be built.

Codex decides **how** it should be implemented within the architectural boundaries.

---

# 5. End-to-End Lifecycle

```text
Frozen Architecture
        ↓
Claude selects next Build Card
        ↓
Codex reads Build Card
        ↓
Codex creates Implementation Strategy
        ↓
Codex performs MCP Verification
        ↓
Dependencies verified?
      /         \
    No          Yes
    |            |
Report Issue     Build Workflow
    |            |
Architecture?    Testing
Mismatch?        |
    |            |
Yes             Self Review
    |            |
Potential CR     Compliance Check
    |            |
Human           Implementation Report
    |            |
Claude Architecture Review
        ↓
Approved?
   /         \
 Yes          No
 |             |
Next Card    Fix / Change Request
```

---

# 6. Codex Implementation Lifecycle

Every Build Card follows the same execution process.

## Phase 1

Understand Build Card.

---

## Phase 2

Read required architecture.

Including:

- Runtime
- Integration Contract
- Workflow Specification
- Build Execution Plan

---

## Phase 3

Dependency Analysis

Determine:

- required utilities
- required workflows
- required credentials
- required external services

---

## Phase 4

Live MCP Verification

Verify only the capabilities required for the current Build Card.

Examples:

- node availability
- parameters
- expressions
- authentication
- schema support

Never assume.

---

## Phase 5

Implementation Strategy

Codex prepares its own implementation plan before building.

This includes:

- node selection
- execution sequence
- utility placement
- retry strategy
- logging strategy

---

## Phase 6

Workflow Construction

Create:

- workflow
- nodes
- expressions
- routing
- utilities
- retries
- logging
- schema resolution
- idempotency

---

## Phase 7

Testing

Run:

- success
- failure
- security
- retry
- duplicate

---

## Phase 8

Self Review

Codex verifies:

- architecture compliance
- naming
- utilities
- folder placement
- response format

before reporting.

---

## Phase 9

Implementation Report

Codex reports everything required before Claude performs architecture review.

---

# 7. MCP Verification Rules

MCP verification belongs to Codex.

Before implementation Codex must verify:

- required node capability
- required parameter support
- expression syntax
- credential mechanism
- known limitations

If architecture assumptions differ from reality:

- report the difference
- determine whether it is implementation or architecture
- recommend a Change Request when necessary

No Build Card is implemented using unverified assumptions.

---

# 8. Credential Gate

AI never creates credentials.

If credentials are required:

- Build workflow
- Configure every non-secret field
- Pause
- Report required credential
- Human adds credential
- Resume testing

---

# 9. Pause Point System

Every blocked implementation reports:

- Pause Point ID
- Reason
- Progress
- Remaining Tasks
- Resume Instructions

Implementation resumes from the exact pause point.

---

# 10. Standard Reports

---

## A. Build Assignment

Issued by Claude.

Contains:

- Build Card
- Build objective
- Architectural notes
- Priority

Not implementation instructions.

Codex determines implementation details.

---

## B. Implementation Report

Issued by Codex.

Contains:

- Build Card
- Implementation summary
- Workflow created
- Nodes used
- Utilities connected
- MCP verification results
- Tests
- Credentials required
- Compliance checklist
- Problems
- Workarounds
- Suggested Change Requests
- Export status

---

## C. Architecture Review

Issued by Claude.

Checks only:

- architecture compliance
- document consistency
- required Change Requests
- approval status

Claude does not recreate implementation work.

---

## D. Change Request

Raised when implementation reveals an architectural issue.

Normally proposed by Codex.

Validated by Claude.

Approved by the CTO.

Contains:

- CR ID
- Reason
- Impact
- Recommendation
- Affected documents
- Approval status

---

# 11. Compliance Model

Primary compliance verification belongs to Codex.

Codex verifies every Build Card before reporting.

Claude performs architectural audit rather than implementation inspection.

This significantly reduces duplicate work.

---

# 12. Workflow Status Model

- Planned
- Ready
- Building
- Test Blocked
- Tested
- Approved
- Production Ready
- Deprecated

---

# 13. Definition of Done

A Build Card is complete only when:

- Workflow exists
- Correct folder
- Correct naming
- Utilities reused
- Schema resolution implemented
- Logging implemented
- Retry implemented
- Idempotency implemented
- Standard response implemented
- MCP verification completed
- Compliance verified
- Tests passed
- Implementation Report completed
- Claude approved

---

# 14. Workforce Rules

## Claude

Never:

- build workflows
- configure nodes
- perform implementation planning
- duplicate Codex work

Always:

- govern architecture
- review architecture
- approve implementation

---

## Codex

Never:

- modify architecture
- invent credentials
- embed secrets
- bypass Build Cards

Always:

- verify using MCP
- implement
- test
- self-review
- report honestly

---

## Human

Always owns:

- credentials
- approvals
- architecture
- production deployment

---

# 15. Benefits of Version 2

Compared with Version 1:

- Significantly lower Claude token consumption
- Faster implementation cycles
- Better use of Codex MCP capabilities
- Less duplicated verification
- Cleaner role separation
- Better scalability
- Easier future automation
- Strong architectural governance remains unchanged

---

# 16. Future Expansion

Future AI specialists may be introduced.

Examples:

- QA Agent
- Documentation Agent
- Security Review Agent
- Test Automation Agent

Each must integrate into this operating model without changing the governance hierarchy.

---

# Final Operating Principle

The Zenny implementation workforce follows one simple philosophy:

> **Claude decides. Codex executes. Humans approve.**

Claude protects the architecture.

Codex builds the platform.

The human controls trust, security, and business decisions.

This separation maximizes implementation speed while preserving long-term architectural integrity.