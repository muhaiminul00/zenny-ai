# New Archetype Introduction Process

```
Status:    Reference procedure. Rare, architect-level work — expect
           this to be invoked infrequently, given the deliberate
           breadth already built into existing archetypes (Consultation
           alone spans Marketing Agency and Travel Agency).
Trigger:   Client_Onboarding_Guide.md §1.5's Archetype Fit Diagnostic
           concludes no existing archetype fits, AND the Hybrid Case
           (multiple existing archetypes active on one client) has been
           explicitly ruled out, not just skipped.
```

## Phase 0 — Confirm This Is Actually Needed

Before any real work begins, verify against 3 things, in order:

1. **Re-run the Archetype Fit Diagnostic once more, explicitly** — the
   most common failure mode is mis-scoping a new client's psychology
   too quickly against surface industry impressions rather than the
   actual 5 diagnostic questions. Confirm a second time, ideally with
   a second person, that none of Questions 1-5 produce a match.
2. **Confirm it is not a Hybrid Case.** A business needing two
   different interaction patterns (e.g., product sales + service
   booking) is a multi-archetype client, not a new archetype. Only
   proceed if the *single* interaction pattern itself doesn't match
   anything existing — not if the *combination* of two patterns is
   what's unfamiliar.
3. **Confirm it's not an existing archetype needing a new sub-variant**
   rather than a wholly new archetype. Commerce already has Ecom and
   Restaurant sub-variants; Consultation already has Marketing Agency
   and Travel Agency. A new sub-variant (same psychology profile,
   different surface content) is meaningfully cheaper than a new
   archetype and should be checked first — same test as Step 4's
   original archetype builds used: does the *psychology* differ
   (different Patience Window, different Relationship-Transaction
   Weight, different freedom level, different conversion mode
   structure), or only the surface industry content differs?

**Output of Phase 0:** A written confirmation, with reasoning, that
this is genuinely Phase 1-8 work — not a diagnostic error, not a
hybrid case, not a sub-variant. This confirmation is itself the
deliverable of Phase 0, reviewed before Phase 1 begins.

---

## Phase 1 — Psychology Profile (Step 0A Equivalent)

Build the full psychology profile, matching the depth and structure
every existing archetype received in `Agent_Runtime_System_v1.md`
Step 0A:

```
1. Customer Mental State at Conversation Start
2. Trust Level (Low/Medium/High, with reasoning)
3. Buying Readiness (the relevant stages/temperatures for this pattern)
4. Real Customer Goal
5. Fears and Friction Points
6. What Creates Confidence
7. What Causes Disengagement
8. Ideal Win Condition (customer perspective)
9. Employee Mindset (if a world-class human did this job, how would
   they think about this customer?)
10. Common Conversation Patterns (3-5 realistic opening messages,
    with what each signals)
11. Customer Patience Window (Short/Medium/Long, with discovery
    tolerance)
12. Relationship vs. Transaction Weight (the % split, with reasoning)
```

**Explicit distinctness check:** before finalizing, compare this
profile directly against all 5 existing archetypes' Step 0A profiles,
item by item. If more than 2-3 items are genuinely identical to an
existing archetype, revisit Phase 0 — this may actually be a
sub-variant, not a new archetype.

---

## Phase 2 — Freedom Level Assignment (Step 2 Equivalent)

Assign a default freedom level (1-10) per the existing Freedom Level
Definition Table (`Agent_Runtime_System_v1.md` Step 2 §2). Do not
invent a new freedom-level scale — the existing 1-10 table with its
band-level behavior definitions (questions per turn, sequence
flexibility, challenge authority, proactive recommendation, script
deviation, off-script exploration, decision-making authority) already
covers the full space; a new archetype gets a *position* on this
scale, not a new scale.

Write at least 2 worked examples (a DOES case and a REFUSES case, per
the existing pattern in Step 2 §3) showing what this freedom level
looks like in practice for the new archetype specifically.

---

## Phase 3 — Data Collection Doctrine Mapping (Step 0B Equivalent)

Map the new archetype onto the existing Tier 1/2/3 data collection
model (`Agent_Runtime_System_v1.md` Step 0B) — determine:

- Primary Tier and Secondary Tier for this archetype
- The exact trigger moment for Tier 2 (Value Exchange Capture)
- Any archetype-specific data collection nuances (following the
  pattern of Emergency's "Tier 3 only, no earn-it-first step" or
  Consultation's "after real discovery insight, never before")

Do not invent a new data collection model — the existing Tier
structure already covers the full space of "how AI agents should earn
the right to ask for contact info."

---

## Phase 4 — Full Archetype Build (Step 4 Equivalent)

The full 8-part build every existing archetype received:

```
1. Customer Psychology (references Phase 1's profile)
2. Common Entry Scenarios (minimum 10-15 realistic examples)
3. Full Conversation Journey Map (happy path + every branch)
4. Data Collection Timing (per Phase 3's mapping + Step 0B §7
   validation)
5. Decision Tree (explicit YES/NO branches, no dead ends)
6. Conversion Path — mapped to the EXISTING Universal Mode Naming
   (Agentic Completion / Assisted Capture-Guided External / Human
   Handoff, per Module 3 §2). Do not invent a new mode taxonomy; a new
   archetype gets its own conversion CONTENT within the existing mode
   structure, same as every other archetype did.
7. Recovery Trigger Moments — mapped to the existing Module 4
   Recovery Engine trigger/cadence model (a new archetype may need a
   new cadence profile, but not a new recovery ENGINE).
8. Escalation Boundaries — mapped to the existing Escalation Priority
   Classification (P1/P2/P3, Module 1D). Do not invent a new
   escalation taxonomy.
```

**Stress-test cross-check required**, same discipline as every
existing archetype build — walk the new archetype's Decision Tree
against `Stress_Test_Library_v1.md`'s Universal test categories before
considering the build complete; add new archetype-specific test cases
to that library.

---

## Phase 5 — Module Ownership Contract Application

Confirm the Module Responsibility Contract (`Agent_Runtime_System_v1.md`
Step 1D.0.5) applies cleanly to the new archetype with zero exceptions
— every journey step in Phase 4's Conversation Journey Map should be
tagged with which module (Core Agent/Growth Agent/Conversion Engine/
Recovery Engine/Email Manager) owns it, exactly like Commerce and
Appointment's builds did. If a journey step doesn't cleanly map to an
existing module's OWNS list, that is a signal to revisit Phase 0 — the
5 existing modules were designed to be archetype-agnostic; a new
archetype needing a 6th module is a much bigger, separate decision not
covered by this document.

---

## Phase 6 — Database Template Schema

**New Vault entry:** Add the new archetype as a value in `archetype_enum`
(requires a migration — `ALTER TYPE archetype_enum ADD VALUE '{new_archetype}'`,
following the same real-migration, tested-on-one-client-first discipline
already established in `Template_Migration_Process.md`).

**New template schema:** Build `tpl_{new_archetype}` following the
exact same pattern as the 5 existing templates — the 21 common tables
(unchanged, reused as-is) + this archetype's specific extension
table(s), determined by what Phase 4's Conversion Path actually needs
to store (following the pattern of `conversions_ecom`,
`conversions_appointment`, etc. — one new extension table, or more if
the archetype genuinely needs multiple sub-variants like Commerce did).

**Add to `control.template_versions`:** one new row for the new
archetype, version 1, per the existing seeding pattern.

**Use the existing `create_archetype_template` function** (or its
variant) — do not build new schema-assembly tooling; the mechanism
already generalizes.

---

## Phase 7 — n8n Execution Layer Update

**Add a new folder** to the canonical 01-08 structure? **No** — per
`n8n_Execution_Architecture_v1.md` Part 6's Module Ownership principle,
folders are organized by *Runtime module* (Core Agent/Growth Agent/
Conversion Engine/Recovery Engine/Email Manager/Utilities/Dashboard/
Adapters), not by archetype. A new archetype does NOT get a new n8n
folder — it gets new *Tools* within the existing module folders (e.g.,
a new `create-{new-archetype-conversion-type}` Tool inside
`03_Conversion_Engine/`, following `Tool_Naming_Convention.md`'s
existing verb-entity discipline).

**New Tool Names required:** determined by Phase 4's Conversion Path —
add these to `Tool_Naming_Convention.md`'s registry, following the
existing pattern exactly.

**New Fallback Pattern mappings:** confirm the new archetype's
failure/escalation cases still map cleanly onto the existing A/B/C/D
patterns (`Fallback_Pattern_Catalog.md`) — do not invent a 5th letter
without first exhausting whether the new archetype's failure modes
genuinely don't fit any of the existing 4.

---

## Phase 8 — Onboarding & Documentation Update

1. Add the new archetype to `Client_Onboarding_Guide.md`'s Step 1
   questionnaire and §1.5's diagnostic (as a 6th possible outcome).
2. Update this document's own Phase 0 checklist reasoning if the new
   archetype reveals a gap in how the diagnostic distinguishes cases —
   feed learnings back into the diagnostic itself.
3. Update `Agent_Runtime_System_v1.md`'s own archetype count and
   references throughout (the document currently states "5 archetypes"
   in numerous places — this is a real, mechanical find-and-update
   task, not optional).
4. Run the full comprehensive document scan (same discipline as the
   post-Step-4 scan already performed once) to catch any stale
   cross-references the new archetype's addition creates.

---

## Summary — What's Genuinely New vs. What Reuses Existing Architecture

```
GENUINELY NEW (built fresh for the new archetype):
  - Psychology profile (Phase 1)
  - Freedom level POSITION on the existing scale (Phase 2)
  - Entry scenarios, journey map, decision tree (Phase 4)
  - Archetype-specific database extension table(s) (Phase 6)
  - New Tool Names for its specific conversion actions (Phase 7)

REUSED, NEVER REINVENTED:
  - The 5 Service Modules and Module Ownership Contract
  - The Universal Mode Naming (Agentic Completion/Assisted Capture-
    Guided External/Human Handoff)
  - The Tier 1/2/3 Data Collection Doctrine
  - The Escalation Priority Classification (P1/P2/P3)
  - The Fallback Pattern Catalog (A/B/C/D)
  - The Recovery Engine's trigger/cadence model (gets new DATA, not a
    new mechanism)
  - The 01-08 n8n folder structure
  - The 21 common database tables
  - The Tool Naming Convention's verb-entity format

A new archetype is a large but fundamentally BOUNDED piece of work —
it adds new psychology and new archetype-specific content within an
already-built, reusable frame. It is not a re-architecture.
```
