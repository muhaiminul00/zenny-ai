# Claude Build Command Protocol v2

Status:    APPROVED — supersedes v2's two-product model. Retains all
           governance content; changes WHERE each role runs.
Purpose:   Define the operating model for building the Zenny platform
           using Claude Code as the sole execution surface, operating
           in three distinct modes (Commander, Executor, Advisor), with
           the human as the sole approval and credential authority.
           Claude.ai (chat) is retained ONLY as an optional, non-code
           advisory surface for strategy/research that never touches
           live repo or platform state — it is not part of the build
           loop and never issues Build Cards.
Position:  Governs how every Build Card gets issued, executed, and
           reviewed from this point forward.
Change:    v2 split Commander (Claude.ai chat) and Executor (Claude
           Code) across two products, reconciled by manual summary/
           GitHub sync. That sync was found unreliable and token-
           expensive in practice (repeated real cost, no live grounding
           on the Commander side). v2.4 collapses both roles into
           Claude Code itself, switched via /commander, /execute, and
           /advisor slash-commands, each persisting across sessions via
           a mode-state file until explicitly changed.


------------------------------------------------------------------------

# 1. Vision — Unchanged in Spirit, Restated for One Tool, Three Modes

Implementation is intentionally **not fully autonomous**. Architecture is
frozen (or validated-current) before implementation proceeds. Every mode
executes against that architecture; the human remains the approval and
credential gate.

Core principles, unchanged:

- Architecture drives implementation.
- Commander mode plans. Executor mode builds. Advisor mode is
  advisory-only and commits nothing.
- The human approves and controls credentials.
- Reality discovered during implementation feeds back into architecture
  only through controlled Change Requests — never a silent edit.

**What changed from v2, and why:** v2's split across two products
required manual synchronization (pasted summaries, GitHub fetches) for
the Commander to see real repo/platform state. This was found to be
both unreliable and expensive in practice — a Commander reasoning from a
stale or lossy summary produced plans that had to be corrected against
reality anyway, at real token cost twice over. Collapsing to one tool
means the Commander (now Claude Code in `/commander` mode) can read
PROJECT_STATE.md, the Wiki, and live MCP state directly, with zero
translation loss.

------------------------------------------------------------------------

# 2. Roles

## You — Chief Architect & Approval Authority

Unchanged. Owns: final architectural decisions, document approval,
build prioritization, credential management, change approval,
production readiness approval.

Never responsible for: building workflows, configuring nodes, writing
implementation logic.

------------------------------------------------------------------------

## Claude Code, in `/commander` mode — Commander

Invoked via the `/commander` slash-command. Persists across sessions
(via mode-state file) until `/execute` or `/advisor` is invoked.
Operates at medium effort, `plan` permission mode by default.

Responsibilities — unchanged from v2's Commander role, now performed
by the same tool that will execute:

- Read and maintain all frozen/current documents, PROJECT_STATE.md,
  and the Wiki (see Section 3).
- Plan implementation sequence (per the Build Card system and current
  PROJECT_STATE.md phase status — `Planning_to_Build_Transition_v1.md`
  was removed 2026-08-29 as a pre-Wiki-era planning doc; its ordering
  has been superseded by the Phase Checklist in PROJECT_STATE.md).
- Generate Build Cards (Section 5).
- Review prior Implementation Reports.
- Detect architectural violations.
- Generate Change Requests.
- Approve or reject completed Build Cards.
- Issue the next Build Card.

**New in this version — bounded direct-execution authority:**
Commander mode may execute directly, without switching to `/execute`,
ONLY when the action is:
  - read-only, or
  - single-file and non-destructive, and
  - has no credential or live-infra impact (no n8n/Supabase/VPS/DNS
    writes, no git operations beyond a read).

Anything outside that boundary — any write to live n8n, Supabase,
infra, or a credential-adjacent action — must hand off to `/execute`,
even if the action seems small. This boundary exists specifically so
Commander mode's planning judgment is never exercised under the
pressure of "it's a small execute, I'll just do it" for anything that
actually carries real risk.

**Standing constraint, unchanged from v2:** Commander mode never
bypasses architecture and never approves its own Build Card without a
genuine Implementation Report to review — even though both roles now
run in the same tool, the review step is not skipped. A Build Card
issued in `/commander` mode is reviewed against its Implementation
Report in a later `/commander` turn, the same as v2's cross-product
review, just without the sync cost.

**Standing constraint on Build Card issuance:** `/commander` will not
generate a new Build Card while an unresolved, unacknowledged
document-level conflict is flagged (per the Document Resolution
Authority, Section 2 below) — resolve or obtain acknowledgment first.

------------------------------------------------------------------------

## Claude Code, in `/execute` mode — Executor

Invoked via the `/execute` slash-command. Persists across sessions
until `/commander` or `/advisor` is invoked. Operates at medium effort,
`auto` (or this environment's equivalent default) permission mode.

Responsibilities — unchanged from v2:

- Execute a Build Card fully: build workflows, configure nodes/
  expressions/routing/retries/utilities, write and run migrations,
  deploy Edge Functions, build dashboard components — whatever the
  Build Card scopes.
- **Has orchestration authority within a Build Card's scope** — may
  break a Build Card into its own sub-steps, sequence its own tool
  calls, and make small implementation-detail judgment calls without
  stopping to ask, as long as the result matches the Build Card's
  stated objective and the Fixed Compliance Checklist (Section 10.C.1).
- Live-verify against MCP/current docs before building on any
  assumption (Section 6.1 — unchanged, still mandatory).
- Test what it builds.
- Report back precisely: what was built, what was verified live vs.
  assumed, what's blocked, what deviated from the Build Card and why.

**Executor never invents architecture.** A genuinely novel product or
design decision — new territory no document resolves — is a Change
Request (Section 10.D), surfaced to the human directly (there is no
separate Commander product to route it through; a Change Request
raised in `/execute` mode is answered by the human, then acted on,
optionally after a `/commander` turn re-plans around it).

------------------------------------------------------------------------

## Claude Code, in `/advisor` mode — Advisor (new in this version)

Invoked via the `/advisor` slash-command. **Default mode for any fresh
session with no prior persisted mode.** Operates at low effort.

Responsibilities:

- Answer questions, discuss strategy, reason about trade-offs.
- Read files and summarize when asked.
- **Never generates a Build Card. Never executes a build action. Never
  commits an architectural decision to any file** (PROJECT_STATE.md,
  Wiki, migrations, workflows — nothing is written from this mode
  beyond the mode-state file itself).

This mode exists to absorb the role Claude.ai chat played in v2 for
non-code strategic thought — pricing, customer psychology research,
new archetype design, wording a spec before it becomes a Build Card —
without ever touching live repo/platform state. Advisor mode may still
read PROJECT_STATE.md/the Wiki for context when asked a question about
current state, but reading is not the same as deciding — no plan is
produced, no Build Card issued, from this mode.

------------------------------------------------------------------------

### Document Resolution Authority (Standing Rule) — unchanged in substance

Claude Code, in either `/commander` or `/execute` mode, may resolve a
genuine conflict, gap, or needed correction in a system document during
a session — after real verification, never a guess — and continue the
same session, rather than stopping and waiting.

**The governing constraint: system documents are the source of truth,
always searched before anything is resolved.**


1. Search the relevant system documents first — broadly, including
   documents that might not be the obvious first place to check.
2. If the docs contain the answer (even if it takes cross-referencing
   multiple documents), that IS the answer — use it.
3. If a real, thorough search genuinely finds no answer anywhere, THEN
   Claude Code decides: resolve it directly (if it's a verification-
   level fact, or a mechanical/structural decision with one obviously
   correct answer given everything else already established), or ask
   the human (if it's a genuine, novel design/product decision not
   implied by anything already established).
4. Never invent a reasonable-sounding answer to fill a gap.


**Logging destination — changed from v2:** a resolved document-level
item is logged in the relevant Wiki page (not appended to
PROJECT_STATE.md's Session Log, which is now a pure dashboard — see
Section 3) AND in `Wiki/log.md`, with the same required detail as
before: what the conflict/gap was, which documents were checked, what
it was resolved to, and why.

After logging, `/execute` (or `/commander`, if it self-resolved
something while planning) stops at the end of that session's scoped
work — even if a next Build Card has already been issued — until the
human has explicitly acknowledged that specific resolution in a
follow-up message. This gate is unchanged from v2; only the log's
location changed.

A session with zero self-resolved document-level items is not subject
to this gate — proceed normally.

------------------------------------------------------------------------

### Per-Workflow Documentation (Standing Rule) — unchanged

Every workflow is documented immediately with real information as it
is built or meaningfully modified. Any session (in `/execute` mode)
that creates or meaningfully modifies an n8n workflow must add/update
that workflow's entry in `06_Infrastructure/n8n/Workflow_Registry.md`
before that session's Definition of Done is considered met. Full
detail unchanged from v2.2 — see Section 12.

------------------------------------------------------------------------

# 3. Required Reading — updated for the Wiki/PROJECT_STATE.md split

Before any `/commander` or `/execute` session begins real work:

1. **PROJECT_STATE.md** — current-state dashboard only (phase,
   per-module status, active blockers). Read in full every session;
   it is kept deliberately short.
2. **Wiki/index.md** — catalog of durable facts/decisions. Read the
   index; drill into specific pages only as needed for the task at
   hand, not read cover-to-cover.
3. **CLAUDE.md** — standing rules, including the Tool Routing Table.
4. The specific frozen/current architecture document(s) the current
   Build Card actually touches — not the full document set by default.

**Do NOT read `Wiki/log.md` or `00_Project_Control/Session_Log_
Archive.md`** as part of normal session start — these are historical/
audit records, consulted only when a session genuinely needs to know
*when* something was decided, not *what* is currently true.

------------------------------------------------------------------------

# 4. End-to-End Lifecycle — updated, single tool


Current Architecture (frozen or validated-current)
        ↓
/commander reads PROJECT_STATE.md + Wiki + relevant docs
        ↓
/commander issues a Build Card
        ↓
/execute — self-orchestrating sub-steps as needed
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
Implementation Report (written by /execute)
        ↓
Human review
        ↓
/commander — Architecture Review
        ↓
Approved?
   /        \
 Yes         No
 |            |
Next Card   Fix / Change Request


No GitHub-sync step, no cross-product summary step — both removed, per
the reasoning in Section 1.

------------------------------------------------------------------------

# 5. Build Card System 

Each Build Card represents exactly one workflow, dashboard component, migration, or comparably-scoped unit of work.

Contains:

* Build Card ID
* Target (workflow name / migration / dashboard piece / Edge Function)
* Runtime Module or system area
* Purpose
* Inputs
* Outputs
* Dependencies
* Shared Utilities involved
* Acceptance Criteria
* Test Cases
* Definition of Done

------------------------------------------------------------------------

# 6. Build Card Issuance — unchanged in content, issued from /commander

Every Build Card includes:

* Build Card reference/ID
* Architectural constraints
* Objective
* Required utilities
* Folder/location placement
* Testing instructions
* Expected outputs
* Open Verification Items resolved by this card, if any (6.2)

Claude Code should never receive the full project for one Build Card —
scope stays narrow, per-card.


## 6.1 Mandatory Pre-Build MCP Verification — unchanged, still mandatory

Before executing any Build Card (in `/execute` mode), verify the
specific node, capability, or field it depends on directly against the
live n8n MCP / Supabase MCP connection — not recited from a frozen
document. 

**Procedure:**

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

## 6.2 Closing Open Verification Items 

Both `INTEGRATION\_CONTRACT\_v1.md`'s originally-flagged items and every
open item accumulated since (tracked centrally in
`Planning\_to\_Build\_Transition\_v1.md` Part 6) follow the same rule:
whenever a Build Card's MCP verification (6.1) resolves one — confirming
or contradicting the prior assumption — the Implementation Report states
which item it resolves. Once resolved, the next Architecture Review marks
it closed in the Transition document, rather than leaving it silently
open after the fact.

------------------------------------------------------------------------

# 7. Execution Rules (in /execute mode) — unchanged

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

# 8. Human Credential Gate — unchanged

AI never creates or invents credentials.

If credentials are required:

* Create nodes/config with every non-secret field set.
* Leave the credential empty or use the agreed placeholder pattern
(`Client\_Integration\_and\_Credential\_Platform\_v1.md`'s placeholder
convention, or the HTTP Request + Header Auth test-account pattern
confirmed in `Planning\_to\_Build\_Transition\_v1.md` Part 2.8 for live
end-to-end testing).
* Stop and report exactly what credential is required.
* Human adds the credential.
* Claude Code resumes.

**External Secrets** (require human intervention): Google OAuth, Shopify,
Slack, Calendly, Cal.com, Supabase Service Role, Twilio, Convocore agent
secrets, any LLM/OpenRouter API key.

**Existing n8n Credential References:** if a credential already exists
under a known name, Claude Code may reference it without exposing the
secret value.


**New note:** the `.zenny-py-venv` standing rule (all Python installs
scoped to the project venv) is enforced via a `PreToolUse` hook
(`pip-guard.ps1`) — a soft gate, not a credential, but the same "stop,
report, human/Claude decides" shape. If Claude proceeds with a global
install because the venv genuinely can't accommodate a package, it
must log why (1-2 lines) in both the response summary and `Wiki/
log.md`, per the hook's own instruction.

AI never creates or invents credentials.

------------------------------------------------------------------------

# 9. Pause Point System

If blocked, report: Pause Point ID, Reason, Progress %, Remaining
Tasks, Resume Instruction. Human performs the required action.
Resumes from the pause point, not from zero.

**New note on permission denials specifically:** governed by the
`permission-fallback.ps1` hook (`PermissionDenied` event). On a real
tool-permission denial (n8n/Supabase/git): check for an easy
alternative first; if found and it works, note the substitution in the
Wiki and continue. If no alternative exists and the denied action is
essential to the current task, stop and ask the human (standard Pause
Point). If the denied action is NOT essential to completing the
current task (e.g. a routine git commit), do not stop — continue the
task and flag the pending action at the end of the response summary
instead.

------------------------------------------------------------------------

# 10. Standard Reports — unchanged in content, all issued by Claude Code under the relevant mode

## A. Build Card — issued from `/commander`.

## B. Implementation Report — issued from `/execute`. Build Card reference
* Build Card reference
* Status
* Work completed
* Tests run and results
* Credential requirements encountered
* Problems
* Workarounds
* Questions for the Commander
* Deployment/export status
* MCP-verified facts discovered (per 6.1) — any live platform behavior
that differs from a frozen/current document's assumption must be
reported even if not specifically asked for
* Open Verification Item(s) resolved this cycle, if any (6.2)

## C. Architecture Review — issued from `/commander`, from the Implementation Report.
* Compliance checklist (not reinvented per card)
* Violations
* Required fixes
* Approval status
* Next Build Card

### C.1 Fixed Compliance Checklist :

Every Architecture Review checks the same list, derived from
`INTEGRATION\_CONTRACT\_v1.md` Part 22 and this document's Section 12. Not
reinvented per Build Card.

**From the Integration Contract (Part 22):**

1. Runtime calls Tools, never workflows — nothing n8n-internal leaked to
the Runtime side.
2. Tool name is stable PascalCase; breaking changes ship as a new
version, never a silent redefinition.
3. n8n owns execution and retries — no retry logic pushed upstream.
4. Database structure untouched by workflow logic — schema needs route
through `Template\_Migration\_Process.md`.
5. Authentication present on every entry point.
6. `Accept-Profile` / `Content-Profile` resolved fresh via Schema
Resolver — no static/default schema anywhere.
7. `tool\_call\_log` row written on every execution, matching the real
column set.
8. `idempotency\_key` present and honored for every create/modify/trigger
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


## D. Change Request :
Raised only when implementation reveals a genuine architectural issue —
not a mechanical registration gap (which Claude Code may fix directly
under its orchestration authority if it's purely additive/consistent with
existing patterns, e.g., adding a missing utility ID entry) but a real
mismatch requiring a Commander decision.

Contains: CR ID, Reason, Impact, Recommendation, Documents affected,
Approval status.

No architectural document changes without Commander review and human
approval.

## E. State Sync — renamed and restructured from v2's "PROJECT_STATE.md Sync"

**PROJECT_STATE.md** is now a pure current-state dashboard — phase,
per-module one-line status, active blockers, pointer to the Wiki.
Overwritten, not appended, at the end of every session. Target: stays
under ~150 lines. If a line describes something that *happened* rather
than something that *is currently true*, it does not belong here — it
belongs in the Wiki or `Wiki/log.md`.

**The Wiki** (`00_Project_Control/Wiki/`) holds durable facts and
decisions, organized by topic/entity, edited in place as understanding
changes — not appended to chronologically. `Wiki/index.md` is the
catalog read at the start of every session; `Wiki/log.md` is the
append-only change record, read only for historical/audit purposes.

**The promotion rule, standing from this version forward:** at the end
of every session, ask — did this session produce a durable fact
(→ Wiki page, cross-referenced in index.md), or just complete a task
(→ one-line PROJECT_STATE.md status update)? The full narrative of
*how* something was fixed (exact commands, exact errors) goes in
`Wiki/log.md`, never in PROJECT_STATE.md itself.

**The confidence rule:** if the Wiki has no page or only weak/tangential
matches for a query, say so explicitly rather than synthesizing an
answer from unrelated pages. Never file a synthesized-from-weak-
evidence answer back into the Wiki as established fact.

**The lint operation, new standing task:** roughly every 5 sessions,
`/commander` should run a Wiki health-check — contradictions, orphan
pages, stale claims, missing cross-references — and correct what it
finds, logging the correction in `Wiki/log.md` the same as any other
document resolution.

Committed to the zenny-sync repo alongside that session's actual
changes, same as v2 — via real git commands, not any MCP git tool, per
the existing standing instruction.

------------------------------------------------------------------------

# 11. Workflow/Build Status Model — unchanged

Draft → Implemented → Test Blocked → Tested → Approved → Production Ready

------------------------------------------------------------------------

# 12. Definition of Done — unchanged content, re-stated for one tool

A Build Card (issued and reviewed in `/commander`, executed in
`/execute`) is complete only when: the artifact exists, correct
folder/location, correct naming, utilities reused, schema targeting
implemented, logging implemented, retry implemented (where
applicable), idempotency implemented (where applicable), standard
response implemented, tests passed, the workflow's Workflow_
Registry.md entry is added/updated, PROJECT_STATE.md + Wiki updated
per Section 10.E, human approved (via a `/commander` Architecture
Review).

------------------------------------------------------------------------

# 13. Implementation Rules — restated per mode, same substance as v2

**`/commander`:**
- Never builds directly beyond the bounded direct-execution authority
  (Section 2).
- Never bypasses architecture.
- Never approves its own Build Card without a genuine Implementation
  Report to review.
- Never issues a new Build Card over an unresolved, unacknowledged
  document-level conflict.

**`/execute`:**
- Never changes architecture unilaterally.
- Never invents credentials.
- Never embeds secrets in code/config.
- Never bypasses a Build Card's stated objective, even while exercising
  orchestration authority over *how* to reach it.
- Always verifies live before building on an assumption (6.1).

**`/advisor`:**
- Never generates a Build Card.
- Never executes a build action.
- Never commits an architectural decision to any file.

**Human:**
- Owns approvals.
- Owns credentials.
- Owns architecture.

------------------------------------------------------------------------

# 14. Benefits — unchanged

Strong architectural consistency, secure credential handling,
controlled evolution, clear separation of responsibilities, repeatable
implementation process, easier debugging and auditing. **Added in this
version:** zero cross-product sync cost, since planning and execution
now share the same live repo/MCP context.

------------------------------------------------------------------------

# 15. Future Expansion — unchanged

Additional AI parties may be introduced later, but must integrate
through the same Commander → Executor → Human approval pipeline
(now expressed as modes rather than separate products) without
altering the core model defined here.

------------------------------------------------------------------------

## Document Changelog

- **v1** — original 3-party model (Human / Claude / Codex).
- **v2** — retired Codex; two-party model (Claude.ai chat = Commander,
  Claude Code = Executor).
- **v2.1** — Document Resolution Authority standing rule.
- **v2.2 (BC-027)** — Per-Workflow Documentation standing rule.
- **v2.3 (BC-030)** — PROJECT_STATE.md Session Log archive note.
- **v2.4 (this version)** — Collapsed the two-product Commander/
  Executor split into a single tool, Claude Code, operating in three
  slash-command-invoked modes: `/commander` (planning, Build Cards,
  bounded direct-execution authority for low-risk actions),
  `/execute` (full build authority, unchanged from v2's Executor),
  and `/advisor` (new — low-effort, non-code advisory mode, default
  for any fresh session, replacing Claude.ai chat's role in the build
  loop; Claude.ai chat is retained only as an optional, out-of-loop
  surface for non-code strategic thought). Mode persists across
  sessions via a mode-state file until explicitly changed. Reason for
  change: the two-product model's Commander could not see live repo/
  platform state without a manual, lossy, token-expensive sync step
  (pasted summaries, GitHub fetches) — found unreliable in practice.
  Section 10.E (PROJECT_STATE.md Sync) restructured into a three-layer
  model — PROJECT_STATE.md (thin current-state dashboard),
  `Wiki/` (durable, topic-organized, LLM-maintained facts and
  decisions, per the raw-sources/wiki/schema pattern), and
  `Wiki/log.md` (chronological change record) — replacing the prior
  single ever-growing Session Log, which had outgrown its own
  usefulness. Document Resolution Authority's logging destination
  updated to match. Added a standing Wiki lint operation (~every 5
  sessions). Section 8 (Credential Gate) extended with the
  `.zenny-py-venv` PreToolUse soft-gate. Section 9 (Pause Points)
  extended with the PermissionDenied retry/escalate/defer sequence.


---
