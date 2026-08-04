# Claude Code — Step Prompts (Paste One at a Time)

> After Task 1 (organization) is approved, paste these prompts in sequence.
> Only paste the next prompt after the previous step is reviewed and approved.
> Never paste two steps at once.

---

---


```

---

---

# STEP 0B PROMPT

```
Read CLAUDE.md. Read 02_Agent_Runtime_System/Agent_Runtime_System_v1.md for context from STEP 0A.
Read the Execution Plan section on STEP 0B.

CONTINUE into Agent_Runtime_System_v1.md.
Append STEP 0B below the existing content.

STEP 0B — Natural Data Collection Doctrine

This section defines the universal rules for WHEN and HOW the agent collects customer contact information.

Write the following:

1. THE CORE PROBLEM
   Explain (in 3–5 sentences) why standard "collect name/email/phone first" flows fail in real customer conversations.

2. THE GOVERNING PRINCIPLE
   One clear statement of how contact info collection should work.

3. THREE COLLECTION TIERS
   For each tier, define:
   - Tier name
   - When it activates (exact trigger condition)
   - What the agent offers or says
   - What data is collected
   - Example conversation line the agent might use
   - What the agent NEVER does in this tier

   Tiers:
   TIER 1 — Passive Capture
   TIER 2 — Value Exchange Capture
   TIER 3 — Commitment Capture

4. PER-ARCHETYPE COLLECTION MAPPING TABLE
   For each archetype: Primary Tier / Secondary Tier / Exact trigger moment / Special rules

5. UNIVERSAL PROHIBITIONS
   A definitive list of what the agent NEVER does regarding data collection.
   These are absolute. No exceptions.

6. EDGE CASES TO HANDLE
   At minimum:
   - Customer volunteers email before agent asks
   - Customer refuses to give phone number
   - Customer gives email in wrong format
   - Customer says "I'll give you my info later"
   - Returning customer whose info is already on file
   - Support conversation where customer has not bought yet

After STEP 0B:

Add:
---
## STEP 0B COMPLETION SUMMARY
- Decisions made:
- Open questions:
- Ready for architect review: YES
---

STOP. Do not begin STEP 0C.
```

---

---

# STEP 0C PROMPT

```
Read CLAUDE.md. Read existing Agent_Runtime_System_v1.md for full context.

CONTINUE into Agent_Runtime_System_v1.md.
Append STEP 0C below existing content.

STEP 0C — Context & Memory Boundary System

This section defines what types of information the agent holds, how much it trusts each type, and how conflicts are resolved.

Write the following:

1. THE CORE PROBLEM
   Why uncontrolled memory creates wrong assumptions, privacy issues, and bad customer experiences.

2. THREE MEMORY LEVELS
   For each level define:
   - Scope (what information it contains)
   - Source (where it comes from)
   - Trust level (how authoritatively agent uses it)
   - Usage rules (when agent may / may not reference it)
   - Example of correct use
   - Example of incorrect use (invasive / wrong assumption)

   Levels:
   LEVEL 1 — Session Memory (current conversation only)
   LEVEL 2 — Customer Memory (prior interaction history)
   LEVEL 3 — Business Memory (config, KB, policies, SOPs)

3. MEMORY CONFLICT RESOLUTION
   Priority order when levels conflict.
   Worked example for each conflict type:
   - Session memory contradicts customer history
   - Customer history contradicts business rules
   - Agent assumption contradicts any memory level

4. PRIVACY BOUNDARIES
   What the agent must never reference even if the data exists:
   - Browsing behavior
   - Frequency/count data ("you've viewed this 7 times")
   - Personal inferences beyond stated facts
   - Sensitive prior interactions in unrelated new conversations

5. MEMORY EDGE CASES
   At minimum:
   - Customer denies prior purchase that is on record
   - Customer references a conversation the agent has no memory of
   - Business config has changed since customer's last visit
   - Discontinued product in customer's history
   - Customer uses a different name than on record

After STEP 0C:

Add:
---
## STEP 0C COMPLETION SUMMARY
- Decisions made:
- Open questions:
- Ready for architect review: YES
---

STOP. Do not begin STEP 1.
```

---

---

# STEP 1 PROMPT

```
Read CLAUDE.md. Read existing Agent_Runtime_System_v1.md for full context.

CONTINUE into Agent_Runtime_System_v1.md.
Append STEP 1 below existing content.

STEP 1 — Universal Runtime Layer

This is the single thinking engine that every customer message passes through, regardless of archetype or configuration. It is always active. It cannot be disabled.

Write all 6 sub-sections:

---

1A. SESSION STATE CHECK
Before any intent detection, the agent determines who it is talking to.
Define all 3 session states:
- New User
- Returning Lead (prior conversation, no conversion)
- Existing Customer (prior conversion on record)

For each:
- Definition
- How agent detects it
- Starting behavior difference
- What data is loaded
- What agent must NOT do

---

1B. INTENT CLASSIFICATION
Every message is classified before routing.
Define all 10 intent types with:
- Intent name
- Definition
- Realistic example messages (3 minimum)
- What it signals about customer state
- Priority level (used in 1E)

Intents:
01 — Information Seek
02 — Problem Aware
03 — Solution Aware
04 — Existing Customer Support
05 — Complaint / Negative State
06 — Refund / Cancellation
07 — Human Request
08 — Comparison / Objection
09 — Off-Topic / Unclear
10 — Returning With Context

---

1C. CONFIGURATION LOAD
After intent classification, agent loads business config.
Define:
- What is loaded
- What happens if config is missing or incomplete
- What agent does if a required config flag is absent

---

1D. MODULE ROUTING
Based on intent + config, route to the correct module.
Write the full routing logic as a decision tree.
Every path must have:
- A YES branch
- A NO branch (fallback)
- No dead ends

---

1E. INTENT SWITCHING & PRIORITY SYSTEM
Real customers change intent mid-conversation.
Define:
- The intent recheck trigger (when does recheck happen?)
- The priority order (full table, 7 levels)
- Rules for switching (what is preserved, what resets)
- Worked examples (minimum 3: Commerce→Support, FAQ→Complaint, Discovery→Ready-to-buy)

---

1F. MULTI-INTENT HANDLING SYSTEM
Customers express multiple needs in one message.
Define:
- How agent detects multiple intents
- Blocking intent vs supporting intent (how to tell the difference)
- Resolution order
- Worked examples (minimum 3)
- When multi-intent requires escalation

---

After STEP 1 (all 6 sub-sections):

Add:
---
## STEP 1 COMPLETION SUMMARY
- Sub-sections completed: 1A / 1B / 1C / 1D / 1E / 1F
- Decisions made:
- Open questions:
- Ready for architect review: YES
---

STOP. Do not begin STEP 2.
```

---

---

# STEP 2 PROMPT

```
Read CLAUDE.md. Read existing Agent_Runtime_System_v1.md for full context.

CONTINUE into Agent_Runtime_System_v1.md.
Append STEP 2 below existing content.

STEP 2 — Freedom Boundary Specification

This section translates agentic scores from abstract numbers into exact operational rules that every builder can implement regardless of platform.

Write the following:

1. THE CORE PROBLEM
   Why "Agentic 2/10" and "Agentic 8/10" as labels alone are not enough to build from.

2. FREEDOM LEVEL DEFINITION TABLE
   Full table mapping score ranges to operational rules:
   - Score range
   - Questions per turn (max)
   - Can reorder conversation sequence?
   - Can challenge customer's stated position?
   - Can recommend proactively (without being asked)?
   - Can deviate from script?
   - Can explore off-script topics?
   - Decision making authority

3. WHAT EACH LEVEL LOOKS LIKE IN PRACTICE
   For each archetype, write:
   - The agentic score
   - 1 worked example conversation showing what agent DOES
   - 1 worked example showing what agent REFUSES to do
   - The internal agent "thinking" at key decision points

   Archetypes:
   - Emergency (2/10)
   - Commerce Ecom (3/10) / Restaurant (2/10)
   - Appointment (4/10)
   - Engagement (4/10)
   - Consultation (8/10)

4. FREEDOM BOUNDARY ENFORCEMENT RULES
   Universal rules that apply regardless of score:
   - What NO agent may do regardless of freedom level
   - What requires human takeover regardless of freedom level
   - What the agent must always do regardless of freedom level

5. EDGE CASES
   At minimum:
   - Customer pushes agent to act beyond its freedom level
   - Customer asks agent to "just decide for me" (high SOP agent)
   - Customer asks for creative/open-ended input (low agentic agent)
   - Agent is mid-discovery when customer becomes ready to buy (Consultation)

After STEP 2:

Add:
---
## STEP 2 COMPLETION SUMMARY
- Decisions made:
- Open questions:
- Ready for architect review: YES
---

STOP. Do not begin STEP 3.
```

---

---

# STEP 3A PROMPT — Core Agent Module

```
Read CLAUDE.md. Read existing Agent_Runtime_System_v1.md for full context.
Note: STEP 3 has 5 modules. Build one module per prompt. This is MODULE 1.

CONTINUE into Agent_Runtime_System_v1.md.
Append STEP 3 — MODULE 1: Core Agent below existing content.

MODULE 1 — CORE AGENT (Always Active)

This module is the minimum viable agent. It exists in every deployment regardless of what other modules are purchased.

Write all of the following:

1. PURPOSE & SCOPE
   What this module does and does not do.

2. SUB-FLOWS (write full flow for each):

   A. FAQ Handler
      - Entry condition
      - KB search logic
      - Confidence threshold (what counts as "found" vs "not found")
      - How many clarification attempts before escalating
      - What agent says when it doesn't know
      - Exit conditions

   B. Support Handler (existing customer)
      - Entry condition
      - How agent detects existing customer status
      - Priority rule: resolve before selling
      - Data it reads from customer record
      - Exit conditions

   C. Complaint Handler
      - Entry condition
      - De-escalation sequence
      - What agent can offer vs cannot offer
      - When complaint triggers immediate escalation vs agent handles
      - Recovery opportunity check (only after resolution)
      - Exit conditions

   D. Human Handoff Handler
      - Entry condition (explicit request vs agent-triggered)
      - What agent says during handoff
      - What context is passed to human agent
      - Human Takeover & Return Path:
        * Case 1: Issue resolved — return to AI
        * Case 2: Sensitive ongoing issue — human retains ownership
        * Case 3: Customer returns with unrelated request — return to AI
      - AI resume behavior after human handoff ends
      - Exit conditions

   E. Off-Topic Handler
      - Entry condition
      - What agent does (redirect, not ignore)
      - How many redirects before ending conversation
      - Exit conditions

3. FALLBACK BEHAVIOR
   This module has no fallback — it is always ON.
   Define what happens when KB is completely empty.

4. EDGE CASES
   Minimum 5 specific to Core Agent behavior.

After MODULE 1:

Add:
---
## STEP 3 MODULE 1 COMPLETION SUMMARY
- Sub-flows completed:
- Decisions made:
- Open questions:
- Ready for architect review: YES
---

STOP. Do not begin Module 2.
```

---

---

# STEP 3B PROMPT — Revenue Agent Module

```
Read CLAUDE.md. Read existing Agent_Runtime_System_v1.md. This is STEP 3 MODULE 2.

CONTINUE into Agent_Runtime_System_v1.md.
Append MODULE 2: Revenue Agent below existing content.

MODULE 2 — REVENUE AGENT (Active if purchased)

Purpose: Create buying momentum. Move customers from interest toward conversion intent.

Write all of the following:

1. PURPOSE, SCOPE & ACTIVATION
   What this module does, does not do, and what triggers it.
   What happens if it is OFF (fallback path).

2. SUB-FLOWS:

   A. Discovery Flow
      Entry: customer has problem but not clear solution
      Goal: understand the real need before recommending
      Freedom level governed by archetype score
      Exit: need understood → move to recommendation

   B. Recommendation Flow
      Entry: need is understood
      Goal: suggest best-fit product/service
      Rules: how many recommendations max, how to present, upsell timing
      Exit: customer responds to recommendation

   C. Objection Handling Flow
      Entry: customer hesitates after recommendation
      Objection types and response rules:
        - Price objection (no discount authority)
        - Trust objection (evidence/social proof path)
        - Timing objection (save-for-later path)
        - Confusion (simplify, not add choices)
        - Competitor comparison (value, not attack)
      Exit: objection resolved or escalated

   D. Internal Conversation Recovery Flow
      Entry: hesitation signals detected mid-conversation
      Signal list (minimum 6)
      Hesitation type identification logic
      Response rules per type
      Check: Recovery Engine active? → YES: create record / NO: end positively
      Exit conditions

   E. Opportunity Detection
      Entry: any point in conversation
      What signals indicate upsell/cross-sell moment
      Rules for introducing upsell (timing, max attempts)
      Rules for NOT introducing upsell (complaint context, support mode)

3. HANDOFF TO CONVERSION ENGINE
   Exact trigger condition for handoff
   What data must be ready before handoff
   Fallback if Conversion Engine is OFF

4. EDGE CASES
   Minimum 5 specific to Revenue Agent.

After MODULE 2:
---
## STEP 3 MODULE 2 COMPLETION SUMMARY
- Sub-flows:
- Decisions made:
- Open questions:
- Ready for architect review: YES
---
STOP. Do not begin Module 3.
```

---

---

# STEP 3C PROMPT — Conversion Engine Module

```
Read CLAUDE.md. Read existing Agent_Runtime_System_v1.md. This is STEP 3 MODULE 3.

CONTINUE. Append MODULE 3: Conversion Engine.

MODULE 3 — CONVERSION ENGINE (Active if purchased)

Purpose: Turn confirmed intent into a completed business outcome.

Write all of the following:

1. PURPOSE, SCOPE & ACTIVATION
   Fallback if OFF.

2. CONVERSION MODES TABLE
   For each archetype, define all configured modes:
   | Archetype | Mode A | Mode B | Mode C |
   Plus: what config flag controls which mode is active.

3. FULL FLOW PER ARCHETYPE:

   COMMERCE — ECOM:
     Mode A (Agent Cart Creation): step-by-step flow, data needed, cart API dependency, out-of-stock handling
     Mode B (Guided to Product Link): flow, link format, what agent says
     Mode C (Lead Handoff): when and how

   COMMERCE — RESTAURANT:
     Reservation flow, party size gate, time validation, waitlist config

   APPOINTMENT:
     Direct booking flow, request booking flow, availability conflict handling

   CONSULTATION:
     Score gate logic (hard gate: score ≥ 50), score tier routing, nurture path for <50

   EMERGENCY:
     Callback queue flow, inspection slot flow, escalation path

   ENGAGEMENT:
     Registration flow per conversion type (donate / volunteer / attend)

4. DATA COLLECTION AT CONVERSION
   Map: for each archetype/mode, exactly what data is collected and at which step.
   Apply STEP 0B doctrine.

5. EDGE CASES
   Minimum 5 across conversion types.

After MODULE 3:
---
## STEP 3 MODULE 3 COMPLETION SUMMARY
STOP. Do not begin Module 4.
```

---

---

# STEP 3D PROMPT — Recovery Engine Module

```
Read CLAUDE.md. Read existing Agent_Runtime_System_v1.md. This is STEP 3 MODULE 4.

CONTINUE. Append MODULE 4: Recovery Engine.

MODULE 4 — RECOVERY ENGINE (Active if purchased)

Purpose: Recover lost opportunities after conversation ends without conversion.

Write all of the following:

1. PURPOSE, SCOPE & ACTIVATION
   Fallback if OFF (conversation ends, no record created).

2. RECOVERY TRIGGER DEFINITION
   Exact moment a recovery record is created for each archetype.
   Exact conditions that do NOT create a record (non-triggers).

3. RECOVERY PROFILES
   For each profile: cadence, goal, stop conditions, channel.
   Profiles: Commerce / Appointment / Emergency / Consultation / Engagement

4. RECOVERY MESSAGE LOGIC
   How message content is determined at each step.
   What the agent references from the prior conversation.
   Tone rules per archetype.

5. STOP CONDITION ENFORCEMENT
   Exactly when recovery halts:
   - Customer converts
   - Customer explicitly opts out
   - Customer escalates
   - Max steps reached
   What happens to the record in each stop case.

6. EDGE CASES
   Minimum 5.

After MODULE 4:
---
## STEP 3 MODULE 4 COMPLETION SUMMARY
STOP. Do not begin Module 5.
```

---

---

# STEP 3E PROMPT — Email Manager Module

```
Read CLAUDE.md. Read existing Agent_Runtime_System_v1.md. This is STEP 3 MODULE 5.

CONTINUE. Append MODULE 5: Email Manager.

MODULE 5 — EMAIL MANAGER (Active if purchased)

Purpose: Reduce administrative email workload through categorization, summarization, drafting, and autonomous response.

Write all of the following:

1. PURPOSE, SCOPE & ACTIVATION
   Fallback if OFF.

2. THREE AUTONOMY LEVELS
   For each level:
   - Definition
   - What agent does
   - What agent does NOT do
   - Industries/use cases it fits
   - Full processing flow

   Level 1 — Summarize Only
   Level 2 — Draft for Approval
   Level 3 — Autonomous Reply (with 5-condition gate)

3. THE 5-CONDITION GATE (Level 3)
   Each condition:
   - Exact trigger
   - What happens when triggered (always escalate)
   - Why it escalates (not just that it does)

4. EMAIL CATEGORIZATION
   All approved categories with definitions.
   Routing per category per autonomy level.

5. CONFIDENCE THRESHOLD
   How agent determines if it can answer vs must escalate.
   What "confidence below threshold" means operationally.

6. EDGE CASES
   Minimum 5.

After MODULE 5:
---
## STEP 3 ALL MODULES COMPLETION SUMMARY
- All 5 modules complete: YES/NO
- Cross-module consistency check: [notes]
- Ready for architect review: YES
---
STOP. Do not begin STEP 4.
```

---

---

# STEP 4 PROMPTS — Archetypes (One at a Time)

> Paste one archetype prompt at a time. Do not combine.

---

## STEP 4A — Emergency Archetype

```
Read CLAUDE.md. Read existing Agent_Runtime_System_v1.md. STEP 4, Archetype 1.

CONTINUE. Append STEP 4 — ARCHETYPE 1: Emergency Engine.

Reference: Customer Psychology from STEP 0A (Emergency). Freedom level from STEP 2.

Write all 8 required sections:
1. Customer Psychology Summary (reference 0A, add runtime implications)
2. Common Entry Scenarios (minimum 10 realistic opening messages + what each signals)
3. Full Conversation Journey Map (happy path + all branch paths)
4. Data Collection Timing (apply 0B doctrine to Emergency specifically)
5. Decision Tree (all conditions with YES/NO branches, no dead ends)
6. Conversion Path (callback queue vs inspection slot — full flow for both)
7. Recovery Trigger Moments (exact, with non-trigger list)
8. Escalation Boundaries (all triggers with exact agent behavior on detection)

Edge cases to handle specifically:
- Research customer ("How much does roof repair cost?")
- DIY customer ("How do I fix this myself?")
- Out-of-zone customer
- Active safety risk
- Angry customer during emergency
- Customer calls for neighbor / on behalf of someone else

STOP after Emergency. Do not begin Commerce.
```

---

## STEP 4B — Commerce Archetype

```
Read CLAUDE.md. Read existing Agent_Runtime_System_v1.md. STEP 4, Archetype 2.

CONTINUE. Append STEP 4 — ARCHETYPE 2: Commerce Engine.

Two sub-variants: ECOMMERCE and RESTAURANT. Both must be fully mapped.

Write all 8 sections for EACH sub-variant.

Ecommerce-specific edge cases to cover:
- Agent cart (Mode A) vs guided link (Mode B) — both fully mapped
- Out of stock product
- Bundle suggestion logic and decline handling
- Cart value escalation threshold
- Returning customer with order issue switching to support mode
- Gift purchase (two contact sets)
- Discount request
- Competitor comparison
- Payment failed (post-checkout)

Restaurant-specific edge cases:
- Party size escalation (≥10)
- Time already passed
- Dietary restriction not in KB
- Waitlist when no slots available
- Private event / catering inquiry

STOP after Commerce. Do not begin Appointment.
```

---

## STEP 4C — Appointment Archetype

```
Read CLAUDE.md. Read existing Agent_Runtime_System_v1.md. STEP 4, Archetype 3.

CONTINUE. Append STEP 4 — ARCHETYPE 3: Appointment Engine.

Write all 8 sections.

Edge cases to cover:
- Customer knows service vs doesn't know (two distinct paths)
- Rescheduling existing appointment
- No-show follow-up
- Availability conflict
- Membership upsell timing
- Special requests (allergies, equipment, accessibility)

STOP after Appointment. Do not begin Engagement.
```

---

## STEP 4D — Engagement Archetype

```
Read CLAUDE.md. Read existing Agent_Runtime_System_v1.md. STEP 4, Archetype 4.

CONTINUE. Append STEP 4 — ARCHETYPE 4: Engagement Engine.

Note: This archetype needs the most redesign from the original architecture.
Three distinct conversion types: Donate / Volunteer / Attend
Each needs its own sub-flow.

Write all 8 sections, with sub-flows per conversion type.

Edge cases to cover:
- Passive supporter ("just browsing")
- Donation request when no campaign active
- Volunteer with skills that don't match current programs
- Event that is at capacity
- Recurring donor checking status

STOP after Engagement. Do not begin Consultation.
```

---

## STEP 4E — Consultation Archetype

```
Read CLAUDE.md. Read existing Agent_Runtime_System_v1.md. STEP 4, Archetype 5.

CONTINUE. Append STEP 4 — ARCHETYPE 5: Consultation Engine.

Most complex archetype. Closest to a human sales rep.
Two sub-variants: Marketing Agency / Travel Agency.

Write all 8 sections for each sub-variant.

Three distinct entry paths:
- Cold lead ("Tell me about your service")
- Warm lead ("I need marketing help")
- Hot lead ("I want a call this week")

Edge cases to cover:
- Discovery depth decision (when is enough, enough?)
- Customer who gives only surface-level answers
- Challenging customer's stated position
- Lead score <50 nurture path (exact message and what gets sent)
- Score 70-84 sales alert (what does agent say while waiting?)
- Score 85+ priority (exact handoff message)
- Travel: unknown destination matching logic
- Customer who wants proposal before score is calculated

STOP after Consultation.
---
## STEP 4 ALL ARCHETYPES COMPLETION SUMMARY
- All 5 archetypes complete: YES/NO
- Cross-archetype consistency check: [notes]
- Ready for architect review: YES
---
```

---

---

# STEP 5 PROMPT — Stress Test Library

```
Read CLAUDE.md. Read entire Agent_Runtime_System_v1.md.

CREATE a new file:
02_Agent_Runtime_System/Stress_Test_Library_v1.md

Write the full Stress Test Library.

Structure:

SECTION 1 — Universal Stress Tests
Tests that apply to all archetypes:
- Customer behavior matrix (all 10 customer types from STEP 1B)
- Intent switching scenarios (minimum 5)
- Multi-intent scenarios (minimum 5)
- Memory conflict scenarios (minimum 3)
- Data collection resistance scenarios (minimum 5)

SECTION 2 — Configuration Combination Tests
For each archetype, test 3 configurations:
- Config A: Core only
- Config B: Core + one module
- Config C: Full stack
For each: What can agent do? What can it NOT do? What does it say at each limit?

SECTION 3 — Per-Archetype Edge Case Library
For each archetype: minimum 12 edge cases
Format per case:
| ID | Customer Input | Expected Agent Path | Rule Being Tested | Pass Criteria |

SECTION 4 — Cross-Module Failure Tests
Scenarios where modules interact unexpectedly:
- Revenue Agent active, Conversion Engine OFF, customer ready to buy
- Recovery Engine triggers for existing customer in support mode
- Email Manager Level 3 receives complaint while human owns conversation
Minimum 8 cross-module scenarios.

After completing:
---
## STRESS TEST LIBRARY COMPLETION SUMMARY
- Total test cases:
- Archetypes covered:
- Open gaps:
- Ready for architect review: YES
---

STOP. Do not begin flowcharts.
```

---

---

# STEP 6 PROMPT — Flowcharts

```
Read CLAUDE.md. Read entire Agent_Runtime_System_v1.md and Stress_Test_Library_v1.md.

CREATE flowchart files in:
02_Agent_Runtime_System/Flowcharts/

Create one Mermaid diagram file per flowchart.
Use .md files with Mermaid fenced code blocks (```mermaid ... ```).

Flowcharts to create (one file each):

1. Universal_Runtime_Flow.md — full message routing (1A through 1F)
2. Service_Routing_Map.md — which module activates under which config
3. Data_Collection_Map.md — when/how contact info collected per archetype
4. Core_Agent_Flow.md — all 5 Core Agent sub-flows
5. Revenue_Agent_Flow.md — all sub-flows including internal recovery
6. Conversion_Engine_Flow.md — all modes per archetype
7. Recovery_Engine_Flow.md — trigger → cadence → stop
8. Email_Manager_Flow.md — all 3 autonomy levels
9. Emergency_Archetype_Flow.md
10. Commerce_Archetype_Flow.md (Ecom + Restaurant)
11. Appointment_Archetype_Flow.md
12. Engagement_Archetype_Flow.md
13. Consultation_Archetype_Flow.md
14. Escalation_Map.md — all triggers → routing

After all flowcharts:
---
## STEP 6 COMPLETION SUMMARY
- Flowcharts created: [list]
- Rendering verified: YES/NO
- Ready for architect review: YES
---

STOP. Agent_Runtime_System_v1.md is complete pending final review.
```

---

```
END OF STEP PROMPTS
Total steps: Task 1 + Steps 0A/0B/0C + Step 1 + Step 2 + Steps 3A–3E + Steps 4A–4E + Step 5 + Step 6
Each builds on the last. Never skip. Never combine.
```
