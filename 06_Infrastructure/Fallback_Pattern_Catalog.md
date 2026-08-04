# Fallback Pattern Catalog

```
Project:   Zeny Ai - Voiceflow
Document:  Fallback_Pattern_Catalog.md v1.0
Layer:     06_Infrastructure — operations/tooling, not runtime behavior
```

---

## What This Is

Graceful degradation is a standing principle throughout
`Agent_Runtime_System_v1.md` — CLAUDE.md Rule 2 (every capability has an
ON path and a defined OFF fallback, never agent improvisation), Module 3
§5 Failure Handling, Module 3 §2.1's Universal Availability Validation
Layer fallback rule, and Module 1's various escalation triggers. It has
never been named as one reusable pattern set with a shared shorthand.
This catalog names the shape already in use, for builder reference — it
does **not** change any existing behavior, add a new rule, or override
anything in the runtime document.

---

## Pattern A — Input Retry

**Triggers when:** Data validation fails (Step 0B §7.1), or a required
input is missing or ambiguous.

**Customer experience:** A natural correction request, never "error"
language — per Step 0B §7.3's one-ask/one-reattempt rule.

**What happens:** Exactly Step 0B §7.3's Correction Flow, named as
"Pattern A" — this is not a new rule. On first failure, the agent asks
once, plainly, for the correct value. If the customer's second attempt
still fails validation, the agent does not ask a third time: it accepts
the value with `validation_flag = true` and submits to the backend as
INVALID-FLAGGED (Step 0B §7.4's Backend Submission Gate), triggering
human review rather than blocking the conversation.

---

## Pattern B — Silent Retry

**Triggers when:** A tool call times out or fails once, but the
underlying system is likely still up — Step 1D.3's WAITING → TIMEOUT
state on a single external tool call.

**Customer experience:** A natural pause ("let me check that for
you..."), then the conversation continues normally with no mention of
the retry.

**What happens:** Per Step 1D.3's Action Tool Execution Contract, one
automatic retry is attempted on TIMEOUT before the call is treated as
FAILED. Success on retry → proceed exactly as if the first call had
succeeded, no trace surfaced to the customer. Failure on retry →
escalate to Pattern C.

---

## Pattern C — Graceful Redirect (Mode Fallback)

**Triggers when:** A tool call FAILS after Pattern B's retry (Step
1D.3), the resource being committed isn't actually available (Module 3
§2.1's Universal Availability Validation Layer), or a required action
isn't permitted (Step 1D.1 Action Permission Check fails).

**Customer experience:** A natural pivot to an alternative path — never
framed as the agent having failed.

**What happens:** This is Module 3's Mode A → B → C fallback chain,
already defined per archetype (Universal Mode Naming, Module 3 §2),
named here as "Pattern C." Mode A (Agentic Completion) falls to Mode B
(Assisted Capture / Guided External Completion) — e.g., Commerce Ecom's
cart-creation API failure falling to a guided product link, or a
requested Appointment slot's unavailability falling to the nearest
available alternative before Mode B's Request Booking. If Mode B also
isn't viable, the chain continues to Pattern D.

---

## Pattern D — Warm Handoff

**Triggers when:** Escalation conditions are met — Module 1's
Escalation Priority Classification (P1 Immediate / P2 Standard / P3
Review), including the terminal case of Pattern C's Mode chain reaching
Mode C (Human Handoff).

**Customer experience:** A natural transition to a human — "Connecting
you with someone who can help further — I'll make sure they have full
context," never apologetic, never framed as a failure.

**What happens:** Module 1D's Human Handoff Handler, directly. Full
context is passed (`conversation_summary`, intent history, escalation
reason) so the human does not start from scratch. The 1.H Global Active
Issue Lock is checked first — if a human already owns this customer's
issue, the handoff consolidates to that same human rather than creating
a second, redundant escalation record.

---

## Usage

Every tool or capability defined in future builder documentation should
specify its fallback chain using this A/B/C/D shorthand (e.g., "B → A →
C" for a tool call that silently retries once, and — on further
failure — falls to an input-correction attempt before redirecting to an
alternative Mode) so builders have one shared vocabulary for degradation
behavior across the whole system, instead of re-deriving it per module
each time.

This shorthand is descriptive, not prescriptive: it names patterns the
runtime document already implements per module. If a new situation
doesn't fit any of A–D, that is a signal to consult the relevant
module's own Failure Handling / Edge Cases section — not to invent a
fifth letter here without updating this catalog first.

---

```
ZeroManual · Zenny AI Workforce · Fallback_Pattern_Catalog.md v1.0
Extracted and rebuilt from the Modular architecture's A/B/C/D fallback
ladder (01_Strategy/Modular_Legacy/ZeroManual_AddOn_Anatomy_Standard.md
§4), against current Archetype/Runtime terminology and mechanisms.
```
