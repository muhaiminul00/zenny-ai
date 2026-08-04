# Step 4 — Appointment Archetype Build — Task Instructions

```
Task:      Build the full Step 4 Archetype Operating System for Appointment
Status:    Approved. Second of the 4 remaining Step 4 builds.
Reference: Emergency and Commerce Step 4 builds (both complete) are the
           quality/depth template. Commerce is the more recent and more
           directly comparable reference, since it was built against the
           same hardened foundation this build also uses.
Foundation: Module Ownership Contract, Availability Validation Layer,
           Universal Mode Naming, Growth Agent naming, Step 0B §7
           validation, adaptive language config — all apply here, same
           as Commerce.
```

---

## Required Structure

Same 8-part structure as Emergency and Commerce (Execution Plan §4.2-4.8):

```
1. Customer Psychology (reference Step 0A Appointment section — cite,
   extend only where archetype-flow detail requires more than the
   psychology section itself covers)
2. Common Entry Scenarios (minimum 10-15 realistic examples)
3. Full Conversation Journey Map (happy path + every branch)
4. Data Collection Timing (Step 0B doctrine + §7 validation, built in
   from the start — same discipline as Commerce)
5. Decision Tree (explicit YES/NO branches, no dead ends)
6. Conversion Path (Universal Mode Naming — map to Module 3's existing
   Appointment flows: Direct Booking (Mode A), Request Booking (Mode B,
   Assisted Capture), Guided Self-Service Booking (Mode B, Guided
   External — added in Batch 3 Round 3), Availability Conflict Handling)
7. Recovery Trigger Moments (reference Module 4 Section 2's existing
   Appointment trigger definitions — use, don't redefine)
8. Escalation Boundaries (reference Module 1's Escalation Priority
   Classification — P1/P2/P3)
```

**Module Ownership Contract requirement (same as Commerce):** Tag every journey step with which module owns it. This archetype has a specific ownership-boundary case worth getting right: rescheduling/cancellation of an EXISTING appointment is a Module 1 (Core Agent) Support Handler case, not a new booking flow — the build must show this handoff clearly, same pattern as Commerce's "returning customer with order issue" resolution.

---

## Design Questions to Resolve

These were flagged as open in the original Execution Plan and never resolved. Resolve all of them with documented reasoning, consistent with the "higher-stakes wins ties" directional bias already established:

1. **Customer knows the service vs. doesn't know** — two genuinely distinct paths. Define exactly where the fork happens (which Intent/signal triggers each) and how Growth Agent's Buying Stage Detection (Module 2, A.0) applies here specifically.

2. **Rescheduling an existing appointment** — per the Module Ownership note above, this is Core Agent Support Handler territory. Show the exact handoff point: what signal in the conversation causes the archetype flow to recognize "this isn't a new booking" and transfer.

3. **No-show follow-up** — define whether this is a Recovery Engine case (Module 4) or requires separate handling. Reference Module 4 Section 2's trigger definitions — if Appointment's existing trigger table already covers this, show how; if it doesn't, decide the trigger moment now (the original plan flagged this as needing resolution).

4. **Availability conflict** — already defined in Module 3 (offer 2-3 alternatives, then Mode C if none fit). Show this in full conversational context specific to Appointment's psychology (Medium Patience Window, per Step 0A).

5. **Membership/package upsell timing** — Step 0A already flags this should happen "after booking, not before." Define the exact trigger point in the Conversion Path where this becomes appropriate, and route it through Growth Agent's Opportunity Detection (Module 2, Section E) rather than inventing new upsell logic here.

6. **Special requests (allergy, accessibility, equipment needs)** — Step 0B already says these should be bundled into the same data-collection step as booking confirmation, not asked separately. Show this bundling in the actual conversation flow, and define what happens if a special request reveals something the agent isn't equipped to accommodate (e.g., accessibility need the business can't currently meet) — this should follow the same honesty-over-forcing-a-fit principle established in Commerce's dietary-restriction resolution and Growth Agent's "No Suitable Recommendation Handling."

7. **Practitioner/staff-specific requests** ("I want to book with Sarah specifically") — not explicitly flagged in the original plan but implied by Step 0A's Appointment psychology (customer evaluates the provider relationally, per the Batch 3-preserved "mild vulnerability" and practitioner-name-request pattern noted in the earlier architecture review). Define how this affects the Decision Tree — does staff-specific availability get its own check within the Availability Validation Layer, or does it modify which Mode applies?

8. **Appointment self-service link mode adoption** — Batch 3 Round 3 added the Guided Self-Service Booking sub-mode (`appointment_selfservice_link_enabled` config flag) as an alternate to Request Booking. This archetype build should show clearly in the Conversion Path when each Mode B sub-type applies, not just reference that both exist.

---

## Stress-Test Cross-Check (Required)

Same requirement as Commerce: walk `Stress_Test_Library_v1.md`'s Appointment-relevant cases (Section 2's Appointment config table, any universal cases that reference Appointment) against the new Decision Tree and Conversation Journey Map. Confirm all are satisfied without further invention. If a gap surfaces, resolve it within this build. If a gap is found that belongs to a different section (Step 0B, Module 3/4 generally — not Appointment-specific), flag it rather than fixing it here, same discipline Commerce used for DV-02.

---

## Constraints

1. Appointment is a smaller scope than Commerce (one sub-variant, not two) — a single continuous pass is expected to be sufficient, but use judgment same as before; report your approach either way.
2. Reference, don't redefine, existing Module 1-5 behavior.
3. Apply the Module Ownership Contract explicitly at each journey step.
4. Do not touch /Modular. Do not begin Engagement or Consultation builds under this prompt.

---

## Deliverable

1. Full Step 4 Appointment section added to `Agent_Runtime_System_v1.md`.
2. All 8 design questions explicitly resolved with documented reasoning.
3. Stress-test cross-check confirmation, with any out-of-scope gaps flagged (not fixed) per the DV-02 precedent.
4. Rebuilt, validated `Appointment_Archetype_Flow.md` (PARTIAL status removed), validated with the Node/JSDOM mermaid parse method — re-validate all 14 flowchart files after, confirm 14/14 PASS.
5. Any new Business Config fields this build requires, added to Appendix A (following the `cart_value_escalation_threshold` / `backorder_notification_enabled` pattern from Commerce).
6. Updated completion summary.

STOP after Appointment is complete. Do not proceed to Engagement or Consultation without a new starting prompt.
