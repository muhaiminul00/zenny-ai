# Batch 3 — Enterprise Runtime Hardening — Master Instructions

```
Task:      Apply 10 architectural hardening patches to Agent_Runtime_System_v1.md
Source:    User's 24 build-review notes + merged 10-patch structure (architect-reviewed)
Status:    Approved. Larger scope than Batch 2 — split into 4 rounds with hard stops.
Scope:     Mix of additive amendments and scoped restructuring. Read each patch's
           own scope note carefully — some are "add a section," others are
           "add a principle now, defer full retrofit to later."
```

---

## Why This Batch Exists

Batch 2 hardened the agent's *behavior* against research. This batch hardens the *system* against three risks that don't show up until production:

1. **Platform lock-in** — architecture accidentally assumes Airtable/Voiceflow/n8n permanence, when the actual plan is eventual migration to a custom stack (LangGraph + n8n + Supabase + frontend).
2. **Module boundary erosion** — a real production issue already observed (FAQ handling lead work, lead routing back to FAQ) — the architecture has fallback rules but no explicit ownership contract preventing modules from doing each other's jobs.
3. **Execution ambiguity** — tool/API calls, conversion modes, and availability checks need universal patterns, not per-module ad hoc handling.

None of this touches Step 0A-2 psychology/freedom work or the Phase 2/3 research amendments (Batch 2) — those stay as-is. This batch operates one layer down, at the system-execution level.

---

## Round Structure

Complete each round fully, report back, and STOP before the next round. Do not self-proceed.

```
ROUND 1 — Foundation Contracts        (Patches 3, 4, 6)
ROUND 2 — Platform Independence        (Patch 2 — principle only, not full retrofit)
ROUND 3 — Business Logic Hardening     (Patches 5, 9, 10-partial)
ROUND 4 — Data Architecture & Cleanup  (Patches 7, 8, 10-remainder)
```

Round 1 goes first because Patches 4 (Module Ownership) and 3 (Configuration Resolver) are the highest-leverage — get these wrong and every downstream module inherits the ambiguity. Patch 6 (Tool Execution Contract) is grouped in because it's also a foundational pattern other patches will reference.

---

# ROUND 1 — Foundation Contracts

## Patch 4 — Strict Module Ownership Contract

**Why:** Real observed production bug — FAQ Handler answering discovery-type questions it shouldn't, Revenue Agent routing sales-adjacent questions back to FAQ instead of owning them. The current architecture has routing rules (Step 1D) but no explicit per-module contract stating what each module owns, is allowed to touch, and must never touch.

**Insert as a new section immediately after Step 1D (Module Routing), before Step 1D.1 (Action Permission Check), numbered Step 1D.0.5 or integrated as a subsection of 1D — use your judgment on exact numbering to avoid breaking existing cross-references, but it must sit at the Universal Runtime Layer level since it governs all modules, not live inside one module's own section:**

```markdown
### Module Responsibility Contract

Every module operates under an explicit contract with four parts. Before
acting on any message, a module verifies the message falls within what it
Owns — not just that Step 1D routed it there. Routing can be wrong (intent
misclassification); this contract is the module's own final check.

**Format per module:**
```
OWNS:            [what this module is the correct handler for]
ALLOWED:         [adjacent things it may touch without owning]
DOES NOT OWN:    [explicitly forbidden, even if adjacent]
MUST TRANSFER:   [where it sends things it doesn't own]
```

---

**MODULE 1 — CORE AGENT**
```
OWNS:            Answering known-KB questions, existing-customer support,
                  complaint de-escalation, human handoff, off-topic redirect
ALLOWED:         Recognizing (not acting on) a customer-initiated new need
                  after support/complaint resolution (Support → Opportunity
                  Detection bridge, §B.1)
DOES NOT OWN:    Discovery, recommendation, persuasion, objection handling,
                  booking/cart/registration execution
MUST TRANSFER:   Discovery/recommendation → Revenue Agent (if ON) or KB-only
                  fallback (if OFF); execution → Conversion Engine (if ON)
```

**MODULE 2 — REVENUE AGENT**
```
OWNS:            Understanding need, recommending, handling objections,
                  detecting upsell opportunity (post-primary-need only)
ALLOWED:         Referencing KB facts already owned by Core Agent (e.g.,
                  citing a policy while building a recommendation) without
                  taking over the support context
DOES NOT OWN:    Executing any transaction (cart, booking, registration),
                  resolving complaints, verifying customer identity for
                  account actions
MUST TRANSFER:   Execution → Conversion Engine (if ON) or fallback message
                  (if OFF); any complaint/support signal → Core Agent
                  immediately (Step 1E priority)
```

**MODULE 3 — CONVERSION ENGINE**
```
OWNS:            Completing the specific transaction action (cart, booking,
                  registration, dispatch) once Intent 03 is confirmed
ALLOWED:         Reading (not generating) recommendation/preference context
                  handed off from Revenue Agent
DOES NOT OWN:    Discovery, persuasion, objection handling — if an objection
                  surfaces mid-conversion, it re-routes, does not attempt to
                  resolve it itself
MUST TRANSFER:   Objection mid-conversion → Revenue Agent (re-classify per
                  Step 1E); post-completion modification requests → Core
                  Agent Support Handler (Intent 04, per existing EC-07)
```

**MODULE 4 — RECOVERY ENGINE**
```
OWNS:            Creating and managing follow-up cadences for incomplete
                  opportunities, across all Source A-I origins
ALLOWED:         Reading conversation_summary/selected_solution context
                  from other modules' handoffs
DOES NOT OWN:    Any live conversation — the moment a customer replies, per
                  §6.1, ownership transfers immediately and fully into the
                  Universal Runtime Layer; Recovery Engine does not continue
                  operating "alongside" a live conversation
MUST TRANSFER:   Any reply → full re-entry through Step 1 (Universal Runtime
                  Loop), not a resumed cadence
```

**MODULE 5 — EMAIL MANAGER**
```
OWNS:            Inbound email categorization/response at its configured
                  autonomy level; outbound delivery execution for
                  module-triggered messages
ALLOWED:         Formatting/delivering content whose substance (what to say,
                  when to say it) is owned by another module (Recovery
                  Engine, Conversion Engine confirmations)
DOES NOT OWN:    Deciding when a recovery cadence fires, what a booking
                  confirmation says, or any live-chat routing decision
MUST TRANSFER:   Any email requiring live-conversation-equivalent judgment
                  beyond its autonomy level → the same escalation path as
                  live chat (Module 1 §D), not a parallel email-only path
```

**Enforcement rule:** This contract is checked by each module *before* acting,
not just relied upon via Step 1D's routing correctness. If a module receives
a message that Step 1D routed to it but which falls under another module's
OWNS list, the receiving module re-routes rather than attempting the task —
this is the direct fix for the FAQ/Revenue cross-contamination pattern.
```

---

## Patch 3 — Configuration Architecture (Runtime Configuration Resolver)

**Why:** Makes explicit a decision the architecture already implicitly made (Step 1D routes by checking "is module X active," never assumes physical removal) but never stated as a formal principle. This matters now because it directly determines whether Voiceflow demo builds and the future SaaS platform can share one graph.

**Insert as a new section immediately before Step 1C (Configuration Load), or as Section 1C.0:**

```markdown
### Runtime Configuration Resolver — Governing Principle

**The runtime contains every module and every capability, always.**
Configuration does not add or remove capability from the runtime — it
activates or deactivates what already exists. This is a formal statement
of a principle already implicit throughout Step 1C/1D/1D.1; stated
explicitly here because it determines whether one runtime graph can serve
every deployment, or whether each client needs a structurally different
build.

**Resolution sequence, every conversation:**
```
Load Business Config
↓
Determine:
  active_modules        (Core always; Revenue/Conversion/Recovery/Email
                          per config)
  allowed_actions        (per Step 1D.1 action-level permissions)
  enabled_channels        (chat/email/SMS/WhatsApp/voice per config)
  archetype                (Emergency/Commerce/Appointment/Consultation/
                          Engagement)
  conversion_modes        (Mode A/B/C per archetype, per Module 3 §2)
↓
Build this conversation's runtime behavior from the SAME underlying
graph every other deployment uses — never a structurally different
build per client.
```

**Why this matters for implementation:** A lightweight Voiceflow playbook
generated for a demo client and the eventual SaaS platform's LangGraph
execution should both be expressions of this same resolver logic — the
runtime graph does not change; what fires within it does. This principle
is what makes future platform migration a re-implementation of execution,
not a redesign of behavior.

**This does not change any existing routing logic in Step 1C/1D/1D.1 —
it is the formal principle those sections already operate under, made
explicit.**
```

---

## Patch 6 — Tool Execution Contract

**Why:** Module 3's Failure Handling (§5) already has this pattern for conversion actions specifically. This generalizes it to *any* external tool/API call across *any* module — Email Manager sending mail, Recovery Engine triggering a webhook, a future voice-platform call — so there's one universal execution pattern rather than each module inventing its own.

**Insert as a new section in the Universal Runtime Layer (Step 1), positioned as Section 1D.3, immediately after 1D.2 (Confidence Gate):**

```markdown
### 1D.3 Action Tool Execution Contract

Any time the agent calls an external system (an API, a webhook, a database
write, a booking system, an email send) — regardless of which module
initiates it — the call follows the same lifecycle. This generalizes the
pattern already established in Module 3 §1.1 (Conversion State Machine)
and §5 (Failure Handling) to every tool call in the system, not just
conversion actions.

```
REQUESTED
  The agent has decided to call an external tool. No customer-facing
  confirmation is sent yet.
↓
WAITING
  The call is in flight. The agent does not proceed as if a result
  exists yet — this state cannot be skipped, ever, regardless of how
  confident the agent is the call will succeed.
↓
Result received:
  SUCCESS  → proceed down the success path specific to that action
             (e.g., Module 3's CONFIRMED state; Email Manager's
             ThreadUpdate; Recovery Engine's Send confirmation)
  FAILED   → proceed down the fallback path specific to that action
             (e.g., Module 3's FAILED_RECOVERABLE/FAILED_ESCALATION;
             Email Manager's BounceCheck)
  TIMEOUT  → treated as FAILED for fallback purposes, but logged
             distinctly (the call may have succeeded server-side
             without the agent receiving confirmation — do not assume
             either success or failure silently; route to the same
             fallback as FAILED, but flag the ambiguity for human
             review since a retry could create a duplicate action —
             see Module 3 §1.2 Duplicate Action Protection, which
             now applies to any WAITING → TIMEOUT case system-wide,
             not just conversion actions)
```

**Universal rule (restated from Module 3 §5, now system-wide):** The agent
never confirms an action to the customer while in WAITING state. A
confirmed-sounding message describing an unconfirmed action is a worse
failure than honest "let me get this sorted" language, in every module,
not just Conversion Engine.

**This section formalizes and generalizes Module 3 §1.1/§5's existing
pattern. It does not change Module 3's own behavior — Module 3 already
complies. It extends the same discipline to Modules 4 and 5, which
previously described tool calls (webhooks, email sends) less formally.**
```

---

### Round 1 Completion

After Patches 4, 3, and 6:

1. Update Step 1's own completion summary noting all three additions and their section numbers.
2. Confirm no existing Step 1D/1D.1/1D.2 content was altered — these are new adjacent sections only.
3. Confirm Module 3's existing state machine/failure handling was NOT rewritten — Patch 6 references it, does not modify it.

**STOP after Round 1. Report back. Do not proceed to Round 2 without confirmation.**
