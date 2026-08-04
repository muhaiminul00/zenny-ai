# Step 4 — Engagement Archetype Build — Task Instructions

```
Task:      Build the full Step 4 Archetype Operating System for Engagement
Status:    Approved. Third of the 4 remaining Step 4 builds.
Reference: Emergency/Commerce/Appointment Step 4 builds are the structural
           template — BUT this archetype needs more original design work
           than the last two. See "Why This One Is Different" below.
Foundation: Same hardened foundation as Commerce/Appointment (Module
           Ownership Contract, Availability Validation Layer, Universal
           Mode Naming, Growth Agent naming, Step 0B §7 validation).
```

---

## Why This One Is Different

The original Execution Plan itself flags Engagement as "weakest in the original architecture, needs redesign" — this isn't a template-application task the way Appointment largely was. Three structural differences from every other archetype built so far:

1. **No single conversion type.** Commerce converts to a purchase, Appointment to a booking, Emergency to a dispatch, Consultation to a qualified call. Engagement has THREE distinct conversion types — Donate, Volunteer, Attend — each with meaningfully different psychology, data needs, and success criteria. This build must give each its own sub-flow, not one flow with three variable endings.

2. **No scoring/qualification mechanism.** Unlike Consultation (coming next), Engagement has no lead-scoring gate. The Step 0A psychology already establishes why: this archetype's Relationship-Transaction weighting is 20%/80% — the lowest Transaction weight of any archetype. Success is closer to "stay visible, build trust" than "close." The Decision Tree for this archetype should reflect that a "no conversion this time" outcome is not a failure state the way it might read in Commerce.

3. **Passive supporter handling is a first-class case, not an edge case.** Step 0A already establishes that forcing conversion on someone who isn't ready damages the relationship for this archetype specifically, more than any other. This build needs to treat "customer is here just to learn, not to act" as a fully legitimate, well-designed path — not a fallback.

---

## Required Structure

Same 8-part structure, applied per conversion type where it diverges (Donate/Volunteer/Attend), and once where it's shared (Entry/Psychology apply archetype-wide before splitting):

```
1. Customer Psychology (reference Step 0A Engagement section — this
   section already has real depth; cite and extend, don't restate)
2. Common Entry Scenarios (minimum 10-15 total, covering entries into
   each of the 3 conversion types AND the passive-supporter case —
   do not weight all 15 toward Donate just because it's the most
   commerce-adjacent)
3. Full Conversation Journey Map — build THREE sub-maps (Donate,
   Volunteer, Attend) branching from one shared Entry/Trust-Building
   opening, per Step 0A's psychology
4. Data Collection Timing (Step 0B doctrine + §7 validation) — note
   that each conversion type likely has different Tier 2 trigger
   content (a donation-amount question is not the same value-exchange
   moment as a volunteer-skills question)
5. Decision Tree — one tree per conversion type is acceptable and
   probably clearer than forcing one universal tree; explicit YES/NO
   branches, no dead ends
6. Conversion Path (Universal Mode Naming — map to Module 3's existing
   Engagement flows: Direct Registration (Mode A), Guided to Form
   (Mode B), Human Handoff (Mode C) — applied per conversion type)
7. Recovery Trigger Moments (reference Module 4 Section 2 and Section
   3's Engagement cadence — note the cadence is still flagged as
   "proposed, unconfirmed, no WF-105 workflow" from the original
   Module 4 build; this archetype build does not need to resolve that
   infrastructure question, just use the cadence as specified)
8. Escalation Boundaries (reference Module 1's Escalation Priority
   Classification)
```

**Module Ownership Contract requirement (same as prior builds):** Tag every journey step. Note one Engagement-specific ownership question: a "passive supporter" who never converts — does staying in a light-touch nurture relationship long-term belong to Growth Agent (ongoing relationship-building) or does it eventually become a Recovery Engine case? Resolve this explicitly — it's not obviously answered by either module's existing definition.

---

## Design Questions to Resolve

From the original Execution Plan (never resolved) plus questions this build surfaces:

1. **Three distinct conversion types need three distinct sub-flows** — this is the core structural requirement above, not optional. Confirm each sub-flow has genuinely different data collection, different Tier 2 trigger content, and different Conversion Path mapping — not the same flow with a different label at the end.

2. **Volunteer matching depth** — how specific does the agent get about matching a volunteer's stated skills/availability to actual programs without live program-capacity data? Define the confidence-gated behavior here (Step 1D.2) — if the agent doesn't have current program data in Business Memory, what does it say rather than guessing?

3. **Donation ask calibration** — Step 0A already establishes the agent never pressures. Define what a "natural" donation ask actually looks like in conversational terms — this needs concrete example language, not just the abstract "never pressure" principle restated. Apply Growth Agent's Recommendation Confidence Requirement pattern (only recommend/ask when genuine fit is understood) to the donation-ask moment specifically.

4. **Trust-building phase duration** — how long before ANY conversion-type action is offered? Step 0A's Long Patience Window already implies "longer than other archetypes" — this build needs to translate that into an actual behavioral rule (e.g., a minimum-exchange threshold, or a signal-based trigger rather than a fixed turn-count) consistent with the Discovery Budget Rule's existing "permission to ask isn't a requirement to ask" principle.

5. **Passive supporter path** — per "Why This One Is Different" above, build this as a genuine first-class path with its own Decision Tree branch, not a fallback message. Define what a good passive-supporter conversation actually accomplishes (per Step 0A's Employee Mindset — "mission ambassador, not fundraiser") even when it produces zero conversion.

6. **Program/campaign not currently active** — if a customer wants to donate to or volunteer for something not currently running, what does the agent do? Apply Step 0C Level 3 (never override current Business Memory with assumption) — the agent should not imply a program exists if Business Memory doesn't confirm it.

7. **Recurring donor status check** — a returning donor asking about their giving history/status. This is explicitly a Module 1 (Core Agent) Support Handler case per the Module Ownership Contract (same pattern as Commerce/Appointment's returning-customer handoffs) — show the handoff point, don't build parallel donor-history logic inside this archetype.

8. **Gift/tribute donations** (donating in someone else's name/memory) — not flagged in the original plan but a common real-world Engagement pattern worth resolving now rather than leaving as a stress-test gap. Define the data collection pattern (similar dual-identity structure to Commerce's gift-purchase resolution, but adapted — a tribute donation needs the honoree's name, not necessarily their contact info).

---

## Stress-Test Cross-Check (Required)

Same requirement as prior builds. Walk `Stress_Test_Library_v1.md`'s Engagement-relevant cases against the new Decision Trees. Given Engagement's structural difference (three sub-flows), confirm the cross-check covers all three conversion types, not just whichever one the existing stress test cases happen to reference most. Flag (don't fix) any out-of-archetype-scope gaps found, same discipline as prior builds.

---

## Constraints

1. Given the structural complexity (three sub-flows, not one), a single continuous pass may be less appropriate here than for Appointment — use judgment on whether to split by conversion type (e.g., shared Entry/Psychology first, then Donate, then Volunteer, then Attend as sequential sub-passes with stops). Report your approach.
2. Reference, don't redefine, existing Module 1-5 behavior — including Module 4's already-flagged-as-unconfirmed Engagement recovery cadence; use it as specified, don't attempt to resolve that infrastructure question here.
3. Apply the Module Ownership Contract explicitly, including the passive-supporter-long-term ownership question raised above.
4. Do not touch /Modular. Do not begin Consultation under this prompt.

---

## Deliverable

1. Full Step 4 Engagement section — shared Entry/Psychology plus three distinct conversion-type sub-flows (Donate/Volunteer/Attend), each complete to the 8-part structure.
2. All 8 design questions explicitly resolved with documented reasoning.
3. The passive-supporter path built as a genuine first-class Decision Tree branch, not a fallback.
4. Stress-test cross-check confirmation covering all three conversion types.
5. Rebuilt, validated `Engagement_Archetype_Flow.md` (PARTIAL status removed) — given three sub-flows, consider whether one flowchart or three linked flowcharts better represents this archetype; use judgment, validate whichever approach you take with the Node/JSDOM mermaid parse method, then re-validate all flowchart files and confirm full PASS.
6. Any new Business Config fields required, added to Appendix A.
7. Updated completion summary, explicitly noting this archetype's structural difference from the prior three builds.

STOP after Engagement is complete. Do not proceed to Consultation without a new starting prompt.
