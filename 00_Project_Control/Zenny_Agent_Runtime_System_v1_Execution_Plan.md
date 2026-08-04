# Zenny Agent Runtime System v1
## Final Design Execution Plan

```
Status:    FROZEN — NO FURTHER CHANGES WITHOUT APPROVAL
Version:   1.1
Owner:     ZeroManual
Audience:  Founders · Builders · Prompt Engineers · Platform Architects
```

---

## What This Document Is

This is the build plan for the **Zenny Agent Runtime System v1** — the missing layer between business strategy and platform implementation.

It is not a prompt. Not a Voiceflow flow. Not an n8n workflow.

It is the **AI employee brain spec** — platform-independent, configurable per client, and reusable across every deployment.

---

## The Missing Layer (Why This Exists)

**Before (what we had):**
```
Business Strategy → Archetype → Services → Platform Build
```

**Now (what we're building):**
```
Business Strategy → Archetype → Agent Runtime System → Services → Platform Build
```

The Runtime System answers one question for every possible customer message:

> "According to this business's configuration, what should the agent think, check, and do next?"

The agent does not decide. **Configuration decides. Agent executes.**

---

## Final Output Structure

Three deliverables. Built in sequence.

| Deliverable | Contents |
|---|---|
| `Agent_Runtime_System_v1.md` | Steps 0–4: Ground Truth + Runtime Logic + Service Flows + Archetype Operating Systems |
| `Stress_Test_Library_v1.md` | Step 5: Edge case simulation library + config combination matrix |
| Flowcharts (visual artifacts) | Step 6: Visual maps per runtime layer, service, and archetype |

---

## Guiding Principles (Non-Negotiable)

These govern every decision made in the build:

**1. Configuration is the only decision-maker.**
The agent never chooses its operating mode. Business config, set before deployment, controls every capability boundary.

**2. The agent earns contact information. It never demands it.**
Data collection is triggered by value moments, not by a scripted sequence. Forcing contact info before trust is built kills conversion.

**3. Every module must work standalone.**
Because clients buy different combinations. No module can assume another module is active.

**4. Every OFF module needs a defined fallback.**
If a capability is disabled, the agent has a specific, graceful response — not silence, not confusion.

**5. Think like the best human employee, not like a chatbot.**
Start from: "What would a world-class employee do here?" Then encode that into rules.

---

## Build Steps

---

### STEP 0 — Ground Truth (Before Any Flow Design)

**Purpose:** Establish the two foundational layers that every flow depends on. If these are wrong, everything downstream is wrong.

---

#### 0A. Customer Psychology Map

For each of the 5 archetypes, define:

- What mental state is the customer in when the conversation starts?
- What is their trust level? (Low / Medium / High)
- What is their buying readiness? (Exploring / Deciding / Ready / Post-purchase)
- What do they actually want from this interaction?
- What will make them disengage?
- What does a "win" look like from their perspective?

This is not about what the agent does. It is about who the customer is.

**Output:** Customer Psychology Map (5 archetypes × above dimensions)

---

#### 0B. Natural Data Collection Doctrine

**The problem to solve:** Current build collects name/email/phone before purchase. Real buyers do not provide this unless they are certain. Forcing it breaks trust and kills conversion.

**The doctrine to define:**

Three tiers of data collection — each triggered by a different customer moment:

```
TIER 1 — PASSIVE CAPTURE
When: Customer voluntarily provides contact info as part of their message.
Example: "Email me the details at john@gmail.com"
Agent action: Capture silently. No explicit ask needed.

TIER 2 — VALUE EXCHANGE CAPTURE
When: Agent has created enough value that an offer is natural.
Trigger moment: Customer has expressed clear preference or made a decision.
Mechanic: Agent offers something worth the contact info.
Examples:
  Commerce:   "Want me to save this cart and send it to you?"
  Appointment: "I can send you a confirmation and reminder — what's your email?"
  Consultation: "I'll send you a summary of what we discussed."
  Emergency:  Not applicable — urgency justifies immediate collection.
  Engagement: "I'll match you to the right program and send details."

TIER 3 — COMMITMENT CAPTURE
When: Customer has already decided. Contact info completes the transaction.
Trigger moment: Booking, purchase intent, registration confirmed.
Mechanic: Required fields collected as part of completion, not as a gate.
Example: "To confirm your appointment, I just need your name and number."
```

**Per-archetype mapping:**

| Archetype | Primary Tier | Secondary Tier | Notes |
|---|---|---|---|
| Commerce (Ecom) | Tier 2 | Tier 3 | Cart save offer is the natural trigger. Never ask upfront. |
| Commerce (Restaurant) | Tier 3 | Tier 1 | Reservation requires name. Collect at booking moment. |
| Appointment | Tier 2 | Tier 3 | Slot confirmation is the natural trigger. |
| Emergency | Tier 3 | — | Urgency justifies immediate collection. Safety context makes it natural. |
| Consultation | Tier 2 | Tier 3 | Summary offer after discovery. Not before. |
| Engagement | Tier 2 | Tier 3 | Program match offer. Mission-aligned framing. |

**What agent never does:**
- Ask for name/email at conversation start
- Ask for all three fields at once
- Block conversation progress until contact info is provided
- Ask for contact info in a support/complaint context before the issue is resolved

**Output:** Data Collection Doctrine doc (referenced by all archetype flows)

---

#### 0C. Context & Memory Boundary System

**The problem to solve:** Enterprise agents need memory, but uncontrolled memory creates wrong assumptions, privacy issues, and bad customer experiences. The agent must understand what type of information it is using and how much trust to place on it.

---

### Memory Levels

The runtime separates memory into three layers:

```
LEVEL 1 — SESSION MEMORY
Scope:
  Current conversation only.
Examples:
  * Customer preferences mentioned today
  * Current product/service interest
  * Current objection
  * Current conversation goal
Usage:
  Agent can freely use this context.
Example:
  Customer: "I like the blue one."
  Later: Agent understands "the blue one" refers to the product discussed earlier.

---

LEVEL 2 — CUSTOMER MEMORY
Scope:
  Known customer history.
Examples:
  * Previous purchases
  * Previous bookings
  * Past support issues
  * Saved preferences
  * Previous conversations
Usage:
  Agent may reference carefully.
Rule:
  Use to improve experience, not to appear invasive.
Bad:  "I see you viewed this product 7 times last month."
Good: "Looks like you've purchased from us before — I can help with that order."

---

LEVEL 3 — BUSINESS MEMORY
Scope:
  Company rules and knowledge.
Examples:
  * Products
  * Services
  * Pricing rules
  * Policies
  * Availability
  * SOPs
Usage:
  Highest authority source.
  Agent must never override business memory with assumptions.
```

---

### Memory Conflict Resolution

If information conflicts, priority order:

```
Business Memory
↓
Current Session Information
↓
Customer History
↓
Agent Assumption
```

Example: Customer previously bought Product A. Product A is now discontinued.
Agent follows current business data, not old customer history.

**Output:** Context & Memory Rules used by all runtime flows.

---

### STEP 1 — Universal Runtime Layer

**Purpose:** The single thinking engine every message passes through, regardless of archetype or config.

**This layer is always active. It cannot be disabled.**

---

#### 1A. Session State Check

Before anything else, agent determines who it is talking to:

```
NEW USER
  → No session history. No prior data.
  → Start from greeting + intent detection.

RETURNING LEAD
  → Prior conversation exists. Did not convert.
  → Load context. Acknowledge without being creepy.
  → Recovery module may be active.

EXISTING CUSTOMER
  → Has prior conversion record.
  → Support mode takes priority over sales mode.
  → Never sell before resolving the active issue.
```

---

#### 1B. Intent Classification

Every message maps to one of these intent types. Agent classifies before routing:

```
INTENT 01 — INFORMATION SEEK
Customer wants to understand something.
Examples: "What do you offer?" / "How does this work?" / "What's the price?"

INTENT 02 — PROBLEM AWARE
Customer has a problem. Needs diagnosis/direction.
Examples: "I need help with X" / "I'm looking for something for Y"

INTENT 03 — SOLUTION AWARE
Customer knows what they want. Ready to act.
Examples: "I want to book X" / "I want to buy Y"

INTENT 04 — EXISTING CUSTOMER — SUPPORT
Customer has a prior transaction. Needs help.
Examples: "Where is my order?" / "I need to reschedule"

INTENT 05 — COMPLAINT / NEGATIVE STATE
Customer is unhappy. Trust is broken.
Examples: "This is terrible" / "I'm very disappointed"

INTENT 06 — REFUND / CANCELLATION
Customer wants to undo a transaction.

INTENT 07 — HUMAN REQUEST
Customer explicitly wants a human.
Examples: "Let me speak to someone" / "I want to talk to a person"

INTENT 08 — COMPARISON / OBJECTION
Customer is evaluating. May be testing.
Examples: "Why should I choose you?" / "Competitor X is cheaper"

INTENT 09 — OFF-TOPIC / UNCLEAR
Message does not map to a business context.

INTENT 10 — RETURNING WITH CONTEXT
Customer references a prior conversation or interaction.
Examples: "I was talking to someone earlier" / "I got an email about..."
```

---

#### 1C. Configuration Load

After intent classification, agent loads business config:

```
LOAD CONFIG:
  - Industry / Archetype
  - Modules active: Core / Revenue / Conversion / Recovery / Email
  - Archetype-specific capability flags
  - Freedom level (agentic score)
  - Escalation thresholds
```

---

#### 1D. Module Routing

Route to the correct module based on intent + config:

```
INTENT CLASSIFIED
        ↓
IS THIS A SUPPORT/COMPLAINT/REFUND/HUMAN REQUEST?
  YES → Core Agent (Support Mode) — regardless of other modules
  NO  → continue
        ↓
IS REVENUE AGENT ACTIVE?
  YES + Intent is 01/02 → Revenue Agent
  NO  + Intent is 01    → Core FAQ only
        ↓
IS CONVERSION ENGINE ACTIVE?
  YES + Intent is 03 → Conversion Engine
  NO  + Intent is 03 → "I can share details, but bookings are handled by our team."
        ↓
ESCALATION DETECTION runs in parallel at all times.
```

**Fallback rule:** Every disabled module has a defined graceful response. No dead ends.

**Output:** Master Runtime Flow (with all branching conditions and fallback paths)

---

#### 1E. Intent Switching & Priority System

**The problem to solve:** Real customers do not follow linear flows. A customer can start in one intent and switch at any time.

Example:
```
Customer: "What jacket do you recommend?"
→ Agent enters Commerce Revenue Flow

Customer: "Actually, my last order never arrived."
→ Agent must immediately switch to Support Mode.
```

---

### Runtime Intent Recheck

Before every agent response:

```
NEW CUSTOMER MESSAGE
↓
Compare:
  Previous Intent vs Current Message Intent
↓
Did intent change?
  YES → Run Priority Check
  NO  → Continue current flow
```

---

### Intent Priority Order

Higher priority intent overrides lower priority intent:

```
PRIORITY 1 — Safety / Emergency
PRIORITY 2 — Complaint / Negative Experience
PRIORITY 3 — Existing Customer Support
PRIORITY 4 — Ready Conversion
PRIORITY 5 — Buying / Revenue Conversation
PRIORITY 6 — General FAQ
PRIORITY 7 — Off-topic
```

### Rules:
- Never continue selling when customer switches into complaint mode.
- Never restart qualification if customer becomes ready to convert.
- Never ignore urgent requests because another flow was active.
- Preserve previous context when switching.

**Output:** Intent Switching Logic

---

#### 1F. Multi-Intent Handling System

**The problem to solve:** Customers often express multiple needs in one message.

Example: `"How much is this jacket, and can I get it before Friday?"`

This contains:
- Pricing question
- Delivery question
- Buying signal

The agent must resolve all relevant intents without forcing the customer into one path.

---

### Multi-Intent Processing Flow

```
MESSAGE RECEIVED
↓
Detect all intents
↓
Separate:
  Blocking Intent vs Supporting Intent
↓
Answer required information first
↓
Continue toward business goal
```

---

### Examples:

```
Customer: "Do you have this in medium and can I order?"
Detected: 1. Inventory question  2. Purchase intent
Flow: Answer availability → Continue conversion

---

Customer: "I want to book but what's your cancellation policy?"
Detected: 1. Booking intent  2. Policy concern
Flow: Answer policy → Continue booking

---

Customer: "I want to buy but your reviews look bad."
Detected: 1. Purchase intent  2. Trust objection
Flow: Handle trust concern first → Continue only after confidence restored
```

**Rule:** Customer concerns are resolved before pushing conversion.

**Output:** Multi-Intent Runtime Rules

---

### STEP 2 — Freedom Boundary Specification

**Purpose:** Translate agentic scores from abstract numbers into exact operational rules.

Currently "2/10" and "8/10" exist as labels. This step defines what they mean inside a conversation.

---

#### Freedom Level Table

| Score | Questions per turn | Can reorder sequence? | Can challenge customer? | Proactive recommendation? | Can deviate from script? | Can explore off-script topics? |
|---|---|---|---|---|---|---|
| 1–2 | 1, fixed | No | No | No | No | No |
| 3–4 | 1, fixed | No | No | Only if asked | Minor rephrase only | No |
| 5–6 | 1–2 | Yes | No | Yes | Yes, within topic | No |
| 7–8 | 1–2 | Yes | Yes | Yes, proactively | Yes | Yes, if relevant |
| 9–10 | Open | Yes | Yes | Yes | Full | Yes |

---

#### What Each Level Looks Like in Practice

**Level 2/10 — Emergency:**
```
Customer: "My roof is leaking"
Agent thinking:
  ALLOWED:   Classify urgency. Collect location. Collect phone. Route.
  NOT ALLOWED: Ask about goals. Compare solutions. Educate. Explore.
  MAX BRANCHES: 2 (emergency path / non-emergency path)
  SEQUENCE: Fixed. Cannot be reordered.
```

**Level 4/10 — Appointment / Engagement:**
```
Customer: "I want a massage"
Agent thinking:
  ALLOWED:   Recommend service type. Ask about preference. Suggest upsell if natural.
  NOT ALLOWED: Deep diagnosis. Challenging customer's choice. Open-ended exploration.
  SEQUENCE: Semi-fixed. May rephrase. May reorder minor steps.
```

**Level 8/10 — Consultation:**
```
Customer: "I need more clients"
Agent thinking:
  ALLOWED:   Diagnose problem. Ask adaptive follow-up. Challenge assumptions.
             Explore budget/timeline/authority dynamically. Reorder questions based on answers.
  NOT ALLOWED: Quote pricing. Draft proposals. Book without score gate passing.
  SEQUENCE: Adaptive. Agent chooses next question based on prior answer.
```

**Output:** Freedom Boundary Spec (referenced in every archetype flow)

---

### STEP 3 — Service Module Flows

**Purpose:** Build each service as an independent, self-contained flow. No module assumes another is active.

Five modules. Each gets:
- Purpose
- Entry conditions
- Full conversation flow
- Exit conditions
- Fallback if disabled

---

#### MODULE 1 — Core Agent (Always ON)

Minimum viable agent. Exists in every deployment.

Sub-flows:
- FAQ Handler (KB-only answers, escalate if not found)
- Support Handler (existing customer issues)
- Complaint Handler (de-escalate, resolve, then optionally recover relationship)
- Human Handoff Handler
- Off-topic Handler

---

### Human Takeover & Return Path

**Problem:** Escalation does not mean the AI relationship ends forever. The system needs clear ownership rules after human involvement.

---

### Handoff States

```
AI ACTIVE
↓
Escalation Trigger
↓
Human Takes Ownership
↓
Resolution Complete
↓
Determine Future Owner
```

---

### Return Rules:

```
CASE 1 — Issue fully resolved
  Future normal questions → Return to AI.

CASE 2 — Sensitive ongoing issue
  Examples: refund dispute / legal issue / high-value negotiation
  Human remains owner.

CASE 3 — Customer returns with unrelated request
  Example:
    Previous: Refund issue
    Later:    New product question
  Return to AI.
```

**AI Resume Rule:** When AI resumes after human, acknowledge context briefly. Do not pretend it handled the human conversation itself.

Key decisions to define:
- At what confidence threshold does agent escalate vs attempt an answer?
- How many clarification attempts before escalating?
- What does agent say when it doesn't know?

---

#### MODULE 2 — Revenue Agent

Active only if purchased.

Sub-flows:
- Discovery Flow (understand customer need)
- Recommendation Flow (suggest product/service based on need)
- Objection Handling Flow (price, trust, comparison)
- Opportunity Detection (identify upsell/cross-sell moments)
- Lead Momentum Flow (move customer toward next step without pushing)

Key decisions to define:
- At what point does Revenue Agent hand off to Conversion Engine?
- What happens if Conversion Engine is OFF? (Revenue Agent completes with link/referral only)
- How does objection handling work without pricing authority?

---

### Internal Conversation Recovery Flow

**Purpose:** Recover hesitation before the customer disappears. This happens inside the live conversation and is separate from the external Recovery Engine.

---

Trigger signals:
- "Too expensive"
- "I'm not sure"
- "I'll think about it"
- "Maybe later"
- "Competitor is cheaper"
- Long hesitation after recommendation

---

Flow:
```
CUSTOMER HESITATION DETECTED
↓
Identify hesitation type:
  Price? / Trust? / Timing? / Confusion? / Missing information?
↓
Respond according to allowed authority
↓
Offer next lowest-friction action
```

Examples:

```
Price:
  Do:     Explain value / options.
  Do not: Create unauthorized discount.

Timing:
  Do:     Offer save-for-later option.
  Do not: Pressure.

Confusion:
  Do:     Simplify recommendation.
  Do not: Add more choices.
```

If hesitation remains:
```
Check: Recovery Engine active?
  YES → Create recovery opportunity if criteria match.
  NO  → End conversation positively.
```

---

#### MODULE 3 — Conversion Engine

Active only if purchased. Configured per archetype and per client.

**All conversion modes — defined per archetype:**

| Mode | Commerce (Ecom) | Commerce (Restaurant) | Appointment | Consultation | Emergency | Engagement |
|---|---|---|---|---|---|---|
| A | Agent cart fill → checkout link | Reservation direct | Direct booking (calendar) | Scored booking (score ≥ 50) | Callback queue (15 min) | Direct registration |
| B | Guided to product page | Waitlist entry | Request booking (human confirms) | Open booking (no scoring) | Inspection slot booking | Guided to form |
| C | Lead handoff to human | Event/catering handoff | Human callback | Human priority (score ≥ 85) | Emergency escalation | Human handoff |

Config determines which mode is active. Agent does not choose.

Key decisions to define per mode:
- Commerce Mode A: What cart API is required? What if product is out of stock?
- Commerce Mode B: What link format? Dynamic or static?
- Appointment: What if no slots available?
- Consultation: Exact score gate logic and nurture path for score < 50.

---

#### MODULE 4 — Recovery Engine

Active only if purchased.

**The recovery record creation problem (currently undefined):**

A recovery record is created at the exact moment the conversation ends without conversion.

Triggers to define precisely:

```
RECOVERY TRIGGER CONDITIONS:
  Commerce:    Conversation ends after product recommendation, no purchase.
               OR: Cart link sent, no confirmation received.
  Appointment: Conversation ends after availability discussion, no booking.
               OR: Date/time collected, no confirmation.
  Emergency:   Callback requested but not confirmed within X minutes.
  Consultation: Discovery complete, score returned, no booking made.
  Engagement:  Program matched, no registration completed.

NON-TRIGGER CONDITIONS:
  - Customer explicitly says "not interested"
  - Conversation ended by escalation (human takes over)
  - Customer already converted in same session
  - Customer is existing customer in support mode
```

Recovery flows per profile (cadences already defined in Blueprint — this step defines the conversation content and channel logic).

---

#### MODULE 5 — Email Manager

Active only if purchased.

Three autonomy levels — configured before deployment:

```
LEVEL 1 — SUMMARIZE ONLY
  Agent reads email → creates summary → sends to human.
  Agent never replies.
  Use: High-risk industries (emergency, legal, medical).

LEVEL 2 — DRAFT FOR APPROVAL
  Agent reads email → categorizes → drafts reply → sends draft to human for approval.
  Human approves or edits → send.
  Use: Consultation, high-value commerce.

LEVEL 3 — AUTONOMOUS REPLY
  Agent reads email → categorizes → applies 5-condition gate → replies or escalates.
  5-condition gate:
    1. Is this a complaint?    → Escalate
    2. Is this a refund request? → Escalate
    3. Is this a legal question? → Escalate
    4. Is confidence below threshold? → Escalate
    5. All clear? → Auto-reply
```

**Output:** All 5 module flow specs with entry/exit conditions and fallback paths

---

### STEP 4 — Archetype Operating Systems

**Purpose:** Apply the universal runtime, freedom spec, and service modules to each archetype's specific customer reality.

Build order: Emergency → Commerce → Appointment → Engagement → Consultation

Each archetype gets:

```
4.1  Customer Psychology (from Step 0A)
4.2  Common Entry Scenarios (10–15 realistic examples)
4.3  Full Conversation Journey Map
4.4  Data Collection Timing (mapped to doctrine from Step 0B)
4.5  Decision Tree (real conditions with exact branch logic)
4.6  Conversion Path (mapped to Conversion Engine modes from Step 3)
4.7  Recovery Trigger Moments (exact, from Step 3 Module 4)
4.8  Escalation Boundaries (exact triggers, no ambiguity)
```

---

#### Archetype 1 — Emergency Engine (Agentic 2/10 · SOP 9/10)

Key design questions to resolve during build:

- Research customer ("How much does roof repair cost?") — sell or educate?
- DIY customer ("How do I fix this myself?") — what is the boundary?
- Out-of-zone customer — what exactly does agent say?
- What defines "active safety risk" that triggers immediate escalation?
- How does agent communicate urgency without creating panic?

---

#### Archetype 2 — Commerce Engine (Ecom 3/10 · Restaurant 2/10)

**This archetype requires the deepest treatment.** Two sub-variants. Most edge cases.

Commerce-specific questions to resolve:

**Ecom:**
- Agent cart (Mode A) vs guided link (Mode B) — both must be fully mapped
- Out of stock: what does agent do? (suggest alternative / collect notification opt-in / escalate?)
- Bundle suggestion logic: when triggered, how many max, what if customer declines?
- Cart value escalation: what is the threshold? What exactly happens above it?
- Returning customer with order issue: support mode, not sales mode — how does agent switch?
- Gift purchase: agent may need to collect two sets of contact info (buyer + recipient)
- Discount request: escalate immediately, but how does agent frame it?
- Comparison with competitor: agent can highlight value, but what is the boundary?

**Restaurant:**
- Party size escalation threshold (≥10): what exactly does agent say?
- Time already passed: how does agent flag it without being robotic?
- Dietary restriction not in KB: escalate or say unavailable?
- Waitlist: if no slots, does agent offer waitlist entry? (requires config flag)
- Private event / catering: immediate escalation, but what does handoff message look like?

---

#### Archetype 3 — Appointment Engine (Agentic 4/10 · SOP 7/10)

Key questions to resolve:

- Customer knows service vs doesn't know: two distinct paths
- Rescheduling existing appointment: support mode, different flow
- No-show follow-up: recovery engine or separate flow?
- Availability conflict: what if requested slot is unavailable?
- Membership upsell: when in the flow is it natural? After booking, not before.
- Special requests (allergies, equipment, accessibility): collect and flag, not decide

---

#### Archetype 4 — Engagement Engine (Agentic 4/10 · SOP 7/10)

Note: This archetype was weakest in the original architecture. Needs redesign.

Key design questions:

- Three distinct conversion types (donate / volunteer / attend) — each needs its own sub-flow
- Volunteer matching: how specific does agent get without access to live program data?
- Donation: agent never pressures. But what does a "natural" donation ask look like?
- Trust-building phase: how long before agent asks for any action?
- Passive supporter ("just browsing"): does agent try to convert? Or nurture?
- Program not available: what does agent do?

---

#### Archetype 5 — Consultation Engine (Agentic 8/10 · SOP 5/10)

Most complex. Closest to a human sales rep.

Key questions to resolve:

- Cold lead ("Tell me about your service") vs warm ("I need marketing help") vs hot ("I want a call") — three distinct entry paths
- Discovery depth: when has agent explored enough to move to qualification?
- Challenging the customer: when is this appropriate? What is the boundary?
- Lead score < 50 nurture path: what exactly does agent say? What gets sent?
- Score 70–84 sales alert: what does agent tell the customer while waiting?
- Score 85+ priority: agent stops and human takes over — what is the handoff message?
- Travel agency sub-variant: destination matching logic. How does agent handle unknown destinations?

**Output:** 5 complete Archetype Operating System specs

---

### STEP 5 — Stress Test Library

**Purpose:** Simulate every realistic customer behavior scenario before it happens in production. Break the flows before builders build them.

---

#### Structure Per Archetype

**A. Customer Behavior Matrix**

For each archetype, map all realistic customer types:

| Customer Type | Example Input | Expected Agent Path | Critical Rule to Enforce |
|---|---|---|---|
| Ready buyer | "I want X now" | Fast conversion path | Don't slow them down with discovery |
| Explorer | "What's the best option?" | Revenue Agent → recommendation | Don't push conversion too early |
| Price objector | "Too expensive" | Objection handling → escalate pricing | No discount authority |
| Angry customer | "This is terrible" | Support/de-escalation | Never sell before resolving |
| Confused customer | "I'm not sure what I need" | Discovery → recommendation | Patient, one question at a time |
| Returning customer | "I ordered before" | Support mode first | Never re-sell before checking status |
| Passive browser | "Just looking" | Light touch → not pushy | Let them lead |
| Impossible request | "Give me free service" | Polite boundary → escalate | No negotiation authority |
| Ghost (goes silent) | [no response] | Recovery trigger | Correct timing for record creation |
| Competitor comparison | "X is cheaper" | Value highlight → not defensive | No competitor attacks |

**B. Configuration Combination Tests**

For each archetype, test 3 minimum configurations:

```
CONFIG A — MINIMUM (Core only)
  What can agent do?
  What can it NOT do?
  What does it say when customer asks for something unavailable?

CONFIG B — PARTIAL (Core + Revenue or Core + Conversion)
  Does conversation still make sense?
  Are there dead ends?

CONFIG C — FULL (All modules active)
  Does full flow work end-to-end?
  Are there conflicts between modules?
```

**C. Edge Case Scenarios**

Minimum 10 edge cases per archetype. Examples from Commerce:

```
EC-01: Customer provides email in first message before agent asks
EC-02: Customer gives wrong phone number format
EC-03: Customer switches intent mid-conversation (starts FAQ, ends wanting to buy)
EC-04: Customer asks about a product not in KB
EC-05: Customer adds to cart then asks for discount before checkout
EC-06: Customer says they're buying as a gift (different recipient)
EC-07: Customer returns mid-conversation after going silent for 20 minutes
EC-08: Customer asks agent to compare two products — both in KB
EC-09: Customer claims prior order issue before any purchase in this session
EC-10: Customer uses aggressive/rude language in a purchase context
EC-11: Customer asks for a specific item, agent recommends different item, customer insists
EC-12: Customer says payment failed (post-checkout)
```

**Output:** `Stress_Test_Library_v1.md` — full matrix for all 5 archetypes

---

### STEP 6 — Flowcharts

**Purpose:** Convert all markdown logic into visual maps for builder handoff.

Built only after Steps 0–5 are complete and approved.

One flowchart per:

| Flowchart | Contents |
|---|---|
| Universal Runtime Map | Message → State Check → Intent → Config → Module Route |
| Service Routing Map | Which module activates under which config |
| Data Collection Map | When and how contact info is collected per archetype |
| Core Agent Flow | FAQ / Support / Complaint / Handoff |
| Revenue Agent Flow | Discovery → Recommendation → Objection → Handoff |
| Conversion Engine Flow | All modes per archetype |
| Recovery Engine Flow | Trigger → Cadence → Stop conditions |
| Email Manager Flow | All 3 autonomy levels |
| Emergency Archetype Flow | Full conversation map |
| Commerce Archetype Flow | Ecom + Restaurant variants |
| Appointment Archetype Flow | Full conversation map |
| Engagement Archetype Flow | Full conversation map |
| Consultation Archetype Flow | Full conversation map |
| Escalation Map | All escalation triggers → routing |

**Output:** Visual flowchart artifacts (one per item above)

---

## Execution Order Summary

```
STEP 0A  →  Customer Psychology Map
STEP 0B  →  Natural Data Collection Doctrine
STEP 0C  →  Context & Memory Boundary System
STEP 1   →  Universal Runtime Layer
              - 1A: Session State Check
              - 1B: Intent Classification
              - 1C: Configuration Load
              - 1D: Module Routing
              - 1E: Intent Switching & Priority System
              - 1F: Multi-Intent Handling System
STEP 2   →  Freedom Boundary Specification
STEP 3   →  Service Module Flows (5 modules)
STEP 4   →  Archetype Operating Systems (5 archetypes, Emergency → Consultation)
STEP 5   →  Stress Test Library
STEP 6   →  Flowcharts
```

Steps 0A, 0B, and 0C must be approved before any subsequent step begins.
Steps 1 and 2 must be approved before Step 3 begins.
Step 3 must be approved before Step 4 begins.
Step 4 must be approved before Step 5 begins.
Step 5 must be approved before Step 6 begins.

---

## What This Unlocks

After this document is complete:

- Any builder on any platform (Convocore, Voiceflow, custom code) receives a complete, unambiguous spec
- Client onboarding becomes a configuration checklist, not a rebuild
- Enterprise scaling requires zero new architecture — only new config
- Platform choice becomes an implementation detail, not a design constraint

---

```
ZeroManual · Zenny Agent Runtime System v1 · Execution Plan
Confidential · Internal Use Only
```
