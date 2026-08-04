# Step 4 — Consultation Archetype Build — Task Instructions

```
Task:      Build the full Step 4 Archetype Operating System for Consultation
Status:    Approved. FINAL archetype build — Emergency, Commerce,
           Appointment, and Engagement are all complete.
Reference: Commerce/Appointment/Engagement Step 4 builds are the
           structural template. Step 2's existing Consultation worked
           examples (8/10 freedom band) are the closest existing content
           to build from directly.
Foundation: Same hardened foundation as all prior Step 4 builds.
```

---

## Why This One Is Different

This is the highest-freedom, highest-complexity archetype in the system — closest to a human sales/advisory rep. Three things distinguish it from every prior build:

1. **Real-time discovery-depth judgment, not a fixed sequence.** Every other archetype either has a short fixed path (Emergency) or a bounded discovery flow (Commerce/Appointment). Consultation's 8/10 freedom band means the agent decides, turn by turn, whether it has "enough" to move forward — this was explicitly flagged as unresolved in the original plan ("discovery-depth-is-enough decision boundary") and needs a real, buildable answer here, not a restatement of "use judgment."

2. **Score-gated conversion with three distinct customer experiences.** A <50 score, a 50-84 score, and an ≥85 score are not just different routing outcomes — they're different conversations. The customer at each tier should not be able to tell they're being scored, but the agent's behavior legitimately differs. This build needs to show what each tier actually feels like to the customer, not just the routing logic.

3. **Two sub-variants with genuinely different discovery content.** Marketing Agency and Travel Agency both use the same 8/10 freedom band and the same score-gate mechanics, but what "good discovery" means is completely different (business diagnostic questions vs. destination/travel-preference questions). Build both fully — this is closer to Commerce's two-sub-variant pattern than to Engagement's shared-entry-then-branch pattern, since these two don't share an entry point the way Engagement's four paths did.

---

## Required Structure

Same 8-part structure, per sub-variant (Marketing Agency, Travel Agency):

```
1. Customer Psychology (reference Step 0A Consultation section AND
   Step 2's existing worked examples — Consultation is the archetype
   with the most existing content already built; consolidate and
   extend, don't restate)
2. Common Entry Scenarios (minimum 10-15 per sub-variant) — must cover
   all three entry temperatures already established in Step 0A: Cold
   ("tell me about your service"), Warm ("I need help with X"), Hot
   ("I want to book a call")
3. Full Conversation Journey Map (happy path + every branch, including
   all 3 score-tier outcomes)
4. Data Collection Timing (Step 0B doctrine + §7 validation — note
   Consultation's Tier 2 trigger is explicitly "after real discovery
   insight, never before," per Step 0B §4 — this build should show
   exactly what "real insight" looks like conversationally)
5. Decision Tree — this is where the discovery-depth judgment (see
   below) needs to be made concrete and buildable
6. Conversion Path (Universal Mode Naming — map to Module 3's existing
   Consultation Score Gate Logic: Nurture <50, Mode A Scored Booking
   50-84, Mode C Human Priority ≥85)
7. Recovery Trigger Moments (reference Module 4 Section 2 — Consultation
   already has the most sophisticated Recovery treatment of any
   archetype, score-aware messaging per Module 4 §4 — use it, don't
   redefine it)
8. Escalation Boundaries (Module 1's Escalation Priority Classification
   — note Score ≥85 is ALREADY defined as Priority 1 per Module 3's
   Consultation Mode C, cross-reference rather than re-decide)
```

**Module Ownership Contract requirement:** Tag every journey step. Consultation's specific ownership question: when does Growth Agent's adaptive discovery (8/10 freedom, challenge authority) hand off to Conversion Engine's Score Gate evaluation? Define the exact trigger — is it customer-signal-driven (Intent 03 appears, per Step 1E, same as every other archetype) or does Consultation need an additional signal specific to "discovery is complete enough to score," distinct from "customer is ready to book"? These may not be the same moment for this archetype specifically, since the customer might say "let's book" before the agent has enough to score accurately.

---

## The Core Design Problem: Discovery-Depth-Is-Enough

This is the single most important unresolved question in this build. Solve it concretely:

**Required approach — build a real decision rule, not a restatement of "use judgment":**

```markdown
Reference existing tools already in the document rather than inventing
new ones:
- Step 2 §2.3 Discovery Budget Rule (3-check gate: necessary? value
  exchanged? readiness signal showing?)
- Step 1D.2 Confidence Gate (High/Medium/Low/Conflicting)
- SPIN-based discovery structure already established in Growth Agent's
  Discovery Flow (Situation → Problem → Implication → Need-payoff)

The discovery-depth-is-enough boundary should be defined as: discovery
is sufficient when the agent has reached Confidence Gate "High" on the
SPECIFIC dimensions the score calculation needs as inputs (whatever
those are — reference Module 3's existing "scoring mechanism itself is
out of scope for this runtime document" boundary; this build does NOT
define how scoring works, only when discovery has gathered enough for
scoring to proceed with confidence).

Concretely: define the minimum SPIN stage reached (e.g., "Implication"
established, not just "Situation") as the floor, combined with the
Discovery Budget Rule's existing readiness-signal check (a customer
showing strong buying signal can shortcut even incomplete discovery —
per Step 1E's existing priority system, Intent 03 already outranks
Intent 02 regardless of archetype).
```

Build this into an actual Decision Tree branch, with explicit examples showing what "enough" looks like for each sub-variant.

---

## Design Questions to Resolve

1. **Discovery-depth-is-enough** — see above, this is the primary deliverable of this build.

2. **Exact score-tier messaging while customer waits (70-84 sales alert)** — Module 3 already defines the nurture (<50) and priority (≥85) messaging. The 70-84 "High Intent" tier (per Module 4 §4's existing message-logic table) needs its own conversational treatment here — what does the agent actually say to a 70-84 customer in real time, not just in the recovery-message context Module 4 already covers?

3. **Travel Agency destination-matching logic** — when a customer names a destination not well-covered in Business Memory/KB, apply Step 0C Level 3 (never fabricate) — define the exact honest-limitation response, parallel to how Growth Agent's "No Suitable Recommendation Handling" (Module 2, B.1) already handles the equivalent Commerce case.

4. **Customer wants proposal/pricing before score is calculated** — this connects directly to Step 2's existing worked example ("I don't have pricing authority to quote directly... that's an action-level permission boundary, not a freedom-level restriction"). Show this in full conversational context for both sub-variants, and clarify: does a customer pushing for pricing early affect their score, or is scoring entirely independent of this kind of pressure? Decide and document.

5. **Challenging the customer's stated position** — Step 2's Consultation worked example already shows one instance of this (challenging "more clients" as vague). Define the boundary more fully: how many challenges is appropriate before it reads as argumentative rather than diagnostic? Reference the Discovery Budget Rule's patience-window constraints.

---

## Stress-Test Cross-Check (Required)

Same requirement as prior builds. Walk `Stress_Test_Library_v1.md`'s Consultation-relevant cases against the new Decision Trees, covering both sub-variants and all three score tiers. Flag (don't fix) out-of-scope gaps, same discipline as all prior builds — note that the scoring MECHANISM itself (how the 0-100 number is calculated) is explicitly out of scope for this entire document, confirmed multiple times already; do not attempt to define it here either.

---

## Constraints

1. Given two genuinely independent sub-variants (closer to Commerce's pattern than Engagement's), a single continuous pass covering both is likely appropriate, but use judgment — report your approach.
2. Reference, don't redefine, existing Module 1-5 behavior, especially Module 3's Score Gate Logic and Module 4's score-aware Recovery messaging — both already well-built, this archetype build shows them in full conversational context, doesn't re-decide them.
3. Apply the Module Ownership Contract, including the Growth-Agent-to-Conversion-Engine handoff timing question raised above.
4. Do not touch /Modular.

---

## Deliverable

1. Full Step 4 Consultation section, both sub-variants (Marketing Agency, Travel Agency) complete to the 8-part structure.
2. The Discovery-Depth-Is-Enough decision rule built concretely, with real examples per sub-variant — this is the primary deliverable.
3. All 5 design questions explicitly resolved with documented reasoning.
4. Stress-test cross-check confirmation covering both sub-variants and all 3 score tiers.
5. Rebuilt, validated `Consultation_Archetype_Flow.md` (PARTIAL status removed), validated with Node/JSDOM mermaid parse method, full 14-file re-validation confirming PASS.
6. Any new Business Config fields required, added to Appendix A.
7. Updated completion summary.
8. **Since this is the final archetype build:** a brief note confirming all 5 archetypes (Emergency, Commerce, Appointment, Engagement, Consultation) are now complete, and a list of every deferred/out-of-scope gap flagged across all 5 builds (DV-02, and any others raised during Commerce/Appointment/Engagement/Consultation), consolidated in one place for the comprehensive post-Step-4 scan already planned.

STOP after Consultation is complete and the consolidated gap list is delivered. This closes all Step 4 archetype work — do not begin the comprehensive scan under this same prompt, that will be a separate task.
