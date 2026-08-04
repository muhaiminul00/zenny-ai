# Step 4 — Commerce Archetype Build — Task Instructions

```
Task:      Build the full Step 4 Archetype Operating System for Commerce
           (Ecommerce + Restaurant sub-variants)
Status:    Approved. First of the 4 remaining Step 4 builds.
Reference: Emergency's Step 4 build (already complete) is the quality/depth
           template — match its rigor, not its specific content.
Foundation: This build happens AFTER Batch 3 (Enterprise Runtime Hardening)
           — reference the Module Ownership Contract, Availability
           Validation Layer, Universal Mode Naming, and Growth Agent
           naming (renamed from Revenue Agent) throughout.
```

---

## Required Structure (per the Execution Plan, Step 4 §4.2-4.8, matching Emergency's build)

For EACH sub-variant (Ecommerce and Restaurant — build both fully, do not treat one as a light variant of the other):

```
1. Customer Psychology (reference Step 0A Commerce section — do not
   redefine, cite and extend where the archetype flow requires more
   detail than the psychology section itself covers)
2. Common Entry Scenarios (minimum 10-15 realistic examples per sub-variant)
3. Full Conversation Journey Map (happy path + every branch)
4. Data Collection Timing (apply Step 0B doctrine + the new Data
   Validation Layer from Step 0B §7 — this did not exist when Step 4
   Emergency was built, so Commerce is the first archetype to build
   validation handling in from the start rather than retrofit it)
5. Decision Tree (explicit YES/NO branches, no dead ends — same
   discipline as Universal Runtime Layer's Step 1D)
6. Conversion Path (use Universal Mode Naming from Batch 3: Agentic
   Completion / Assisted Capture-or-Guided External / Human Handoff —
   map to Module 3's existing Ecom Mode A/B/C and Restaurant flows)
7. Recovery Trigger Moments (reference Module 4 Section 2's existing
   trigger definitions for Commerce — this build should USE those,
   not redefine them; if the archetype-level detail requires something
   Module 4 doesn't cover, flag it rather than inventing new Recovery
   Engine behavior here)
8. Escalation Boundaries (exact triggers, reference Module 1's
   Escalation Priority Classification — P1/P2/P3 — apply it here,
   don't reinvent)
```

**Also required, per the Module Ownership Contract (Batch 3, Step 1D.0.5):** For each conversation journey branch, note which module owns that step — this wasn't required when Emergency was built (the contract didn't exist yet), but is now a standing requirement for every subsequent archetype build. This directly prevents the FAQ/Growth-Agent cross-contamination pattern that motivated the contract in the first place.

---

## Ecommerce-Specific Requirements

Resolve these design questions explicitly (they were flagged as open in the original Execution Plan and never resolved):

1. **Agent cart (Mode A) vs. guided link (Mode B)** — both must be fully mapped as parallel paths, config-selected (per the Runtime Configuration Resolver, Batch 3 Patch 3). Do not present one as primary and the other as fallback-only; they are both first-class, config-determined.

2. **Out of stock handling** — apply the Availability Validation Layer (Module 3 §2.1, Batch 3 Patch 5). When the cart-creation API call in Mode A fails specifically due to stock, this is a distinct case from a general API error (Module 3 §5) — define: does the agent suggest an alternative, offer a back-in-stock notification, or fall to Mode C? Decide and document the exact branch.

3. **Bundle/upsell suggestion logic** — reference Growth Agent's existing Opportunity Detection (Module 2, Section E) — this archetype build should show the archetype-specific triggers for when a bundle suggestion is natural for Ecom specifically (e.g., "customers who bought X also need Y" style, if the business's KB supports it), respecting the existing one-offer-per-conversation cap.

4. **Cart value escalation threshold** — define the actual threshold logic (e.g., above what value does Mode C — Human Handoff — become the default instead of Mode A/B?) — this was flagged as "needs definition" in the original plan and never resolved.

5. **Returning customer with an order issue** — this is explicitly a Module 1 (Core Agent) ownership case per the Module Ownership Contract, not a Commerce-archetype-specific flow — the archetype build should show the HANDOFF point clearly (when does a Commerce conversation recognize "this is actually a support case" and transfer ownership) rather than building parallel support logic inside the Commerce archetype.

6. **Gift purchase (dual contact identity)** — buyer and recipient may need separate contact capture. Define exactly which Tier (Step 0B) each capture belongs to and in what order.

7. **Discount request** — always escalates per existing no-discount-authority rules (Module 2 Objection Handling) — the archetype build shows exactly where in the Ecom conversation flow this triggers and what the agent says.

8. **Competitor comparison** — apply Growth Agent's existing value-focused, never-attack response pattern (Module 2, Objection Handling, Competitor subtype) — show it in the Ecom-specific context.

---

## Restaurant-Specific Requirements

1. **Party size escalation threshold (≥10)** — already defined in Module 3's existing Restaurant flow (Batch 3 didn't change this). The archetype build shows this in full conversational context — exact agent language, exact decision point.

2. **Time-already-passed handling** — already defined in Module 3. Show in full conversational context.

3. **Dietary restriction not in KB** — this is a genuinely open case not yet defined anywhere. Decide: does the agent escalate, say "I don't have that information confirmed, let me check," or decline to guess? Apply the existing Step 0C Level 3 principle (never override business data with assumptions) — the answer should follow directly from that.

4. **Waitlist (if no slots)** — already gated behind `waitlist_enabled` config flag in Module 3. Show in full conversational context, including the case where the flag is false.

5. **Private event/catering inquiry** — already routes to Mode C (Event/Catering Handoff) per Module 3. Show in full conversational context.

6. **Scope boundary reminder (per Batch 3 Patch 9):** Confirm this archetype build correctly treats delivery/pickup/bakery-style businesses as OUT of Restaurant's scope (they belong to Ecommerce per Batch 3's clarification) — do not build reservation-style logic for them here.

---

## Stress-Test Cross-Check (Required Before Completion)

`Stress_Test_Library_v1.md` already contains Commerce-relevant test scenarios from Section 2 (Configuration Combination Tests) and Section 3/4/5's universal tests. Before marking this build complete:

1. Walk through the existing stress test cases that reference Commerce and confirm this new Step 4 build actually satisfies them (i.e., the Decision Tree and Conversation Journey Map built here should be able to answer every Commerce-relevant stress test case without needing further invention).
2. If any stress test case reveals a gap this build doesn't cover, resolve it within this build rather than leaving a new open gap.

---

## Constraints

1. This is a large build — if it becomes unwieldy in a single pass, split Ecommerce and Restaurant into two sequential sub-builds with a stop between them (your judgment on whether to split; report which approach you took).
2. Reference existing Module 1-5 content — do not redefine module behavior that's already specified. This archetype build should read as "here's how the existing modules come together for Commerce specifically," not as a parallel spec.
3. Apply the Module Ownership Contract explicitly at each journey step, as required above.
4. Do not touch /Modular. Do not begin Appointment, Engagement, or Consultation builds under this prompt.

---

## Deliverable

1. Full Step 4 Commerce section added to `Agent_Runtime_System_v1.md`, both sub-variants complete per the required structure.
2. All 8 Ecommerce design questions and all 6 Restaurant items explicitly resolved (not left as open flags).
3. Stress-test cross-check confirmation.
4. Updated `Commerce_Archetype_Flow.md` — note that this flowchart currently exists as a PARTIAL stub; it should now be rebuilt as a full flowchart reflecting the completed Step 4 build (remove the PARTIAL status header once done).
5. Updated completion summary.

STOP after Commerce is complete. Do not proceed to Appointment, Engagement, or Consultation without a new starting prompt.
