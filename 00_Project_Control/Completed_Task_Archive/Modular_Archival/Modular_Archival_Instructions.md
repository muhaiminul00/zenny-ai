# Modular Architecture — Archival & Extraction — Task Instructions

```
Task:      Archive the paused Modular architecture; extract 4 genuinely
           valuable artifacts into new, correctly-scoped documents.
Status:    Approved. Architect has reviewed all 4 Modular source documents
           in full and made the disposition decision below.
Scope:     /Modular folder contents + the original "Needs_Review" files
           from Task 1's initial organization pass.
```

---

## Context & Disposition Decision

Modular was an earlier, paused approach to the same overall problem — a composable "add-on library" architecture (Universal Core + 36 task-typed add-ons + client bundles) optimized for fast, predictable commercial delivery. It was paused before the Archetype/Runtime system (`Agent_Runtime_System_v1.md`) was built.

**Architect's assessment, after reviewing all 4 Modular source documents in full:**

Modular is **superseded as a behavior-design architecture** — its task-type/add-on model (Lookup/Action/Info/Lead capture/Escalation, one type per add-on, no hybrids) cannot express the psychology-driven, freedom-level-adaptive behavior the current Archetype system requires, and its 4 niche-clusters conflate surface task pattern with customer psychology in ways the current 5-archetype system correctly avoids (e.g., Modular's "Trade & Professional" cluster grouped Roofing/Plumbing/Electrician with Marketing Agency and NGO — the current system correctly separates these into Emergency, Consultation, and Engagement archetypes, which behave completely differently).

**However, Modular is NOT being discarded.** It solved four real problems that `Agent_Runtime_System_v1.md` has not touched — not because they were rejected, but because they live at a different layer (operations/tooling, not runtime behavior) that the runtime document was never scoped to cover. These four items are being extracted into their own documents, at the correct layer, rather than lost.

---

## Part 1 — Archive the Modular Source Documents

**Move (do not delete) the following into a new folder:**

```
/Modular/ → contents move to → 01_Strategy/Modular_Legacy/
```

Files to move:
- `CS_AI_Agent_PreBuild_Guide_Modular.md`
- `ZeroManual_AddOn_Anatomy_Standard.md`
- `ZeroManual_Agent_Architecture_Reference.md`
- `ZeroManual_AddOn_Library_Master.md`
- Any other files currently in `/Modular` not listed above — include them, note anything unexpected in your report.

**Add a short README to the new folder:**

```markdown
# Modular Legacy Architecture

This folder contains the original "Modular" composable add-on architecture
(Universal Core + 36 task-typed add-ons + client bundles), designed before
the current Archetype/Runtime system (`Agent_Runtime_System_v1.md`).

**Status: Superseded as a behavior-design architecture, archived for
reference.** The task-type/add-on model could not express the
psychology-driven, freedom-level-adaptive behavior the current system
requires. Do not build against this architecture.

**What was extracted and preserved, at the correct layer:**
- Action Tool Naming Convention → 06_Infrastructure/Tool_Naming_Convention.md
- Fallback Pattern Catalog → 06_Infrastructure/Fallback_Pattern_Catalog.md
- Client Onboarding Operations Guide → 00_Project_Control/Client_Onboarding_Guide.md
- Version Control & KPI Framework → 00_Project_Control/Version_Control_and_KPI_Framework.md

These four documents took specific, still-valuable ideas from Modular and
rebuilt them to reference the current Archetype/Runtime system's actual
terminology and module structure — they are not copies of the original
Modular content.

Reviewed and archived: [date]
```

---

## Part 2 — Resolve the Original "Needs_Review" Files

**Context:** The original Task 1 file-organization pass (very early in this project) flagged a set of files as "Needs_Review" because they couldn't be confidently classified at the time. These trace back to the Modular architecture.

**Action:** Locate `00_Project_Control/Needs_Review/` (or wherever Task 1's original output placed it) and:
1. For each file that is one of the 4 Modular source documents (or a variant/draft of them), confirm it as Modular-origin and move it into `01_Strategy/Modular_Legacy/` alongside the others — do not duplicate if it's the same content already covered in Part 1.
2. For any file in Needs_Review that is NOT Modular-related, leave it in place and flag it clearly in your report — this task does not resolve non-Modular Needs_Review items.
3. If `Needs_Review/` is empty after this, note that it can be removed in the future project-reorganization task (do not remove it now — that's a separate task).

---

## Part 3 — Extract 4 Artifacts, Rebuilt Against Current Architecture

**Important: these are not copy-paste extractions.** Each must be rewritten to reference the current system's actual terminology (Growth Agent, not "Lead Module"; the 5 archetypes, not the 4 niche clusters; Module Ownership Contract, Universal Mode Naming, etc.) — the underlying idea from Modular is preserved, the content is native to the current architecture.

### Artifact 1 — Tool Naming Convention

**Create:** `06_Infrastructure/Tool_Naming_Convention.md`

Source idea: Modular's webhook naming convention (verb-entity, kebab-case: get/list/check/create/update/cancel/send).

**Rebuild it to serve the current system's actual need:** Step 1D.3 (Action Tool Execution Contract, Batch 3) defines the tool-call *lifecycle* (REQUESTED→WAITING→SUCCESS/FAILED/TIMEOUT) but has no naming standard for the tools themselves. This document fills that gap.

```markdown
# Action Tool Naming Convention

Reference: Agent_Runtime_System_v1.md, Step 1D.3 (Action Tool Execution
Contract) defines how tool calls behave. This document defines what they
are named — every concrete tool/webhook the runtime calls follows this
convention, regardless of which module invokes it or which archetype it
serves.

## Format
`{verb}-{entity}` · kebab-case, all lowercase · Info-type lookups that
pull from Business Memory/KB rather than an external system use
`kb:{section-name}` instead of a verb-entity webhook name.

## Verb Vocabulary
[Adapt Modular's table — get/list/check/create/update/cancel/send — with
examples drawn from the current system's actual archetypes: get-order-
status (Commerce), check-availability (Appointment, Universal Availability
Validation Layer), create-callback-queue-entry (Emergency), cancel-
appointment (Appointment), send-recovery-message (Recovery Engine), etc.]

## Rules
- One action per tool name — never combine two actions into one call
  (e.g., a single tool that both checks availability AND books is wrong;
  these are two tools).
- Breaking interface change → append -v2 suffix, do not silently redefine
  an existing tool's contract.
- New verb needed → document here first, no ad hoc naming by individual
  builders.

## Mapping to Module Ownership Contract
Each tool name's calling module is determined by the Module Responsibility
Contract (Step 1D.0.5) — a tool is only called by the module that OWNS the
action it performs. [Cross-reference specific examples: Conversion Engine
owns create-cart/create-appointment/create-registration; Recovery Engine
owns send-recovery-message; Email Manager owns send-email-reply.]
```

Build out the full verb table and enough real examples (10-15) drawn from actual tool calls implied throughout the 5 archetype builds (cart creation, calendar checks, dispatch queue writes, etc.) to make this genuinely usable by a builder, not just a template.

### Artifact 2 — Fallback Pattern Catalog

**Create:** `06_Infrastructure/Fallback_Pattern_Catalog.md`

Source idea: Modular's A/B/C/D fallback pattern ladder (Input retry → Silent retry → Graceful redirect → Warm handoff).

**Rebuild it to reference the current system's actual graceful degradation language**, which exists but is scattered (CLAUDE.md Rule 2, Module 3 §5 Failure Handling, Module 1's various escalation triggers) rather than named as one reusable pattern set.

```markdown
# Fallback Pattern Catalog

Reference: Graceful degradation is a standing principle throughout
Agent_Runtime_System_v1.md (every module's "if OFF" fallback, Module 3 §5
Failure Handling, Module 1's escalation triggers) but has never been
named as one reusable pattern set. This catalog names the shape already
in use, for builder reference — it does not change any existing behavior.

## Pattern A — Input Retry
Triggers when: Data validation fails (Step 0B §7.1), or required input
is missing/ambiguous.
Customer experience: A natural correction request, never "error" language
(per Step 0B §7.3's one-ask/one-reattempt rule).
What happens: [Cross-reference Step 0B §7.3 exactly, this is not a new
rule, just naming the existing one as "Pattern A."]

## Pattern B — Silent Retry
Triggers when: A tool call times out or fails once but the underlying
system is likely still up (Step 1D.3's TIMEOUT state).
Customer experience: A natural pause, then continues normally.
What happens: [Cross-reference Step 1D.3's TIMEOUT handling.]

## Pattern C — Graceful Redirect (Mode Fallback)
Triggers when: A tool call fails after retry, or a required capability
isn't permitted (Step 1D.1 Action Permission Check fails).
Customer experience: A natural pivot to an alternative path.
What happens: [Cross-reference Module 3's Mode A→B→C fallback chains,
and Universal Mode Naming from Batch 3 — this is the same pattern,
named.]

## Pattern D — Warm Handoff
Triggers when: Escalation conditions are met (Module 1's Escalation
Priority Classification, P1/P2/P3).
Customer experience: A natural transition to a human, full context
preserved (Module 1 D's Human Handoff Handler).
What happens: [Cross-reference Module 1 D directly.]

## Usage
Every add-on/tool/capability defined in future builder documentation
should specify its fallback chain using this A/B/C/D vocabulary (e.g.,
"B → A → C" — matches Modular's original notation, now mapped onto the
current system's actual mechanisms) so builders have one shared shorthand
for degradation behavior across the whole system.
```

### Artifact 3 — Client Onboarding Operations Guide

**Create:** `00_Project_Control/Client_Onboarding_Guide.md`

Source idea: Modular's 7-stage onboarding process, Client Onboarding Workbook, UAT checklist (5 test cases per capability).

**Rebuild for the current system:** replace "add-on selection questionnaire" with "archetype + module selection" (per the current system's actual configuration model — Runtime Configuration Resolver, Step 1C.0), replace "per-add-on UAT" with UAT structured around the current system's actual test categories (drawing directly from `Stress_Test_Library_v1.md`'s existing structure — Universal tests, Config Combination tests, Archetype edge cases, Cross-Module collisions, Red Team tests).

```markdown
# Client Onboarding Guide

Adapted from the original Modular architecture's onboarding process,
rebuilt to configure a Zenny deployment against the current Archetype/
Runtime system rather than an add-on bundle.

## Onboarding Sequence

1. Archetype identification — which of the 5 archetypes (Emergency,
   Commerce, Appointment, Engagement, Consultation) fits this business?
   A business may span more than one (e.g., a restaurant with both
   dine-in reservations and delivery ordering — Batch 3's Restaurant/
   Ecom scope clarification applies).
2. Module selection — which of the 5 service modules are active
   (Core Agent always on; Growth Agent, Conversion Engine, Recovery
   Engine, Email Manager per what the client is purchasing)?
3. Freedom level configuration — per Step 2, confirm the archetype's
   default freedom band or override it per Step 2 §2.1 (Default
   Freedom vs. Configured Freedom).
4. Conversion mode configuration — per archetype, which Mode (A/B/C,
   Universal Mode Naming) is available given the client's actual
   integrations (does a cart API exist? A calendar integration?).
5. Client Onboarding Workbook completion — [adapt Modular's workbook
   fields: brand voice, agent name, API credentials, service catalog,
   policies, FAQ content, operating hours, escalation contacts,
   LANGUAGE CONFIGURATION (language_mode + language_list, per Step 1C
   — new field not in the original Modular workbook)].
6. KB content upload and validation.
7. UAT — structured per Stress_Test_Library_v1.md's existing categories
   rather than Modular's generic 5-test-per-add-on pattern: run the
   relevant Universal tests, the client's specific Config Combination
   test, and relevant archetype edge cases from the Stress Test Library
   against the live configured deployment.
8. Go-live approval and monitoring setup.

## Client Onboarding Workbook Template
[Adapt Modular's workbook fields fully, add the language configuration
field, remove add-on-specific fields, add archetype/module/freedom-level
fields.]

## UAT Checklist
[Rebuild against Stress_Test_Library_v1.md's actual test categories
rather than reinventing a new UAT structure — this should literally
reference specific test IDs from that document as the basis for
per-client UAT, not duplicate test content.]
```

### Artifact 4 — Version Control & KPI Framework

**Create:** `00_Project_Control/Version_Control_and_KPI_Framework.md`

Source idea: Modular's Stable/Beta tracks, 14-day promotion gate, rollback procedure, 3-level KPI framework (client/add-on/product).

**Rebuild for the current system:** replace "add-on" with "module/archetype configuration," keep the Stable/Beta discipline and promotion criteria largely intact (this part of Modular's thinking wasn't behavior-design-specific, it's sound operational practice regardless of architecture), adapt the KPI framework's middle tier from "add-on-level" to "module-level" and "archetype-level."

```markdown
# Version Control & KPI Framework

Adapted from the original Modular architecture's operations framework —
the Stable/Beta discipline and rollback procedure are sound practice
independent of the underlying behavior architecture and are preserved
largely as-is; the KPI framework's middle tier is adapted from
"add-on-level" to "module-level and archetype-level" to match the current
system's structure.

## Version Tracks
[Preserve Modular's Stable/Beta structure, 14-day zero-critical-issue
promotion gate, breaking-vs-non-breaking classification, and rollback
procedure largely unchanged — this is genuinely architecture-agnostic
operational discipline.]

## 3-Level KPI Framework

### Client-Level KPIs
[Preserve: resolution rate, CSAT, escalation rate, first response time.]

### Module & Archetype-Level KPIs (replaces Modular's "add-on-level")
- Usage frequency per module (Core/Growth/Conversion/Recovery/Email)
  and per archetype — informs which archetype/module combinations need
  the most build attention.
- Success rate per archetype's Decision Tree branches — a low rate on
  a specific branch (e.g., Commerce's out-of-stock handling) signals a
  gap the way a low add-on success rate did in Modular, but mapped to
  the current system's actual structure.
- Escalation rate per Module 1 Escalation Priority tier (P1/P2/P3) —
  new metric, didn't exist in Modular's framework, made possible by
  the current system's Escalation Priority Classification.

### Product-Level KPIs
[Preserve: time to deploy a new client, reuse validation — adapted to
"archetype/module reuse rate" rather than "add-on reuse rate."]
```

---

## Constraints

1. Do not delete any Modular content — archive only, per Part 1.
2. The 4 extracted artifacts are genuine rewrites referencing current terminology, not copy-pasted Modular content with find-and-replace — use judgment to make each one actually useful as current documentation, not just faithful to the original.
3. Do not modify `Agent_Runtime_System_v1.md` itself under this task — this task creates new, separate documents and archives old ones. If you find a place in the runtime document that should cross-reference one of these new artifacts (e.g., Step 1D.3 referencing the new Tool Naming Convention), flag it as a suggestion in your report rather than editing the runtime document directly.
4. Do not touch `Architecture-Explorer` or `zenny-website` — separate task.
5. Do not begin project reorganization/junk-file cleanup — separate task.

---

## Deliverable

1. Confirmation `/Modular` contents moved to `01_Strategy/Modular_Legacy/` with README added.
2. Confirmation of Needs_Review triage — Modular-origin files moved, non-Modular files flagged and left in place.
3. All 4 extracted artifacts created, each a genuine rewrite against current architecture terminology, not a copy-paste.
4. A list of suggested cross-reference additions to `Agent_Runtime_System_v1.md` (not made — just suggested) where these new artifacts would be useful to link from.
5. Report on anything unexpected found in `/Modular` or `Needs_Review` beyond what was anticipated in this task.

STOP after this task is complete. Do not begin project reorganization or Architecture-Explorer/zenny-website review under this prompt.
