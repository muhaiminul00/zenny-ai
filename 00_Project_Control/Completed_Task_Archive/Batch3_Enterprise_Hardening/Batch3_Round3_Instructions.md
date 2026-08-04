# Batch 3 — Round 3 — Business Logic Hardening

```
Task:      Apply conversion-mode consolidation, universal availability
           checking, and Restaurant scope clarification
Source:    Patches 5, 9, and 10 (partial) from the merged 10-patch structure
Status:    Approved.
```

---

## Patch 5 — Conversion Mode Terminology & Availability Validation Layer

**Why:** Module 3's existing Mode A/B/C structure already matches what's needed (confirmed in Round 1's Module Ownership Contract work) — this patch does two things: (1) adopts clearer universal naming for the three modes so they read consistently across all archetypes, and (2) adds an explicit, universal Availability Validation Layer, since currently availability checking exists per-archetype (Appointment has it, Emergency's "human available" check is different from "team available to dispatch," Ecom's cart API implicitly checks stock) without one unifying pattern.

### Part 1 — Universal Mode Naming

**Insert as a clarifying addition to Module 3, Section 2 (Conversion Modes Table), immediately before the table:**

```markdown
**Universal mode naming (clarification, not a structural change):** The
three conversion modes already defined per archetype in the table below
follow one consistent pattern, named here explicitly for clarity across
all archetypes:

```
MODE A — Agentic Completion
  The agent performs the action directly: creates the cart, writes the
  calendar event, submits the registration, queues the dispatch.

MODE B — Assisted Capture / Guided External Completion
  The agent either collects details and creates a pending request for
  human confirmation (Assisted Capture — e.g., Appointment's Request
  Booking), OR hands the customer a direct self-service link to complete
  the action externally (Guided External Completion — e.g., Ecom's
  product link, or a self-service booking link). Which sub-type applies
  is archetype/config-specific — see the table below for which sub-type
  each archetype uses.

MODE C — Human Handoff
  The agent captures what it can and routes to a human, because the
  action requires judgment or authority the agent doesn't hold.
```

This naming does not change any existing mode's behavior — it is the
shared vocabulary the table below already implements per archetype.
```

### Part 2 — Add Appointment's Missing Guided-Link Sub-Mode

**Why:** Ecom already has both Mode B sub-types (Assisted Capture doesn't apply to Ecom Mode B, which is pure Guided External Completion via product link). Appointment currently only has Assisted Capture (Request Booking, human confirms) as its Mode B — it's missing the Guided External Completion sub-type (a self-service booking link, e.g., Calendly/cal.com style) that would let a customer complete a booking themselves without waiting on human confirmation.

**Insert into Module 3, Appointment section, as a new Mode B sub-type immediately after the existing "Request Booking Flow (Mode B — human confirms)" section:**

```markdown
**Guided Self-Service Booking (Mode B, alternate sub-type):**
```
Trigger: "reserve slot" permission not granted AND a self-service booking
   link integration exists (config-dependent — not every deployment has
   this integration; where it doesn't, Request Booking above is the only
   Mode B sub-type available).
1. Provide a direct, specific link to the booking calendar/system
   (e.g., a Calendly/cal.com-style link), not a generic contact page.
2. Agent says: "Here's a direct link to book — you'll see real-time
   availability and can pick what works for you."
Exit: Link delivered → Step 1G End State 2 (Open Opportunity) unless
   customer confirms in-session completion, in which case End State 1.
```

**Config flag:** `appointment_selfservice_link_enabled` (boolean) —
determines whether this sub-type is available. If false, Mode B is
Request Booking only, as originally built.
```

### Part 3 — Universal Availability Validation Layer

**Why:** Emergency checks "is a human available to receive dispatch" (Flag 2, already built) but not "is the team/technician actually available to be dispatched" — a different resource-availability question. Appointment checks calendar. Ecom checks stock via cart API. Restaurant checks table/slot availability. These are all instances of one pattern that should be named once and referenced everywhere, rather than four separately-invented mechanisms.

**Insert as a new section in Module 3, immediately after Section 2 (Conversion Modes Table) and before Section 3 (Full Flow Per Archetype), as Section 2.1:**

```markdown
#### 2.1 Universal Availability Validation Layer

Before any Mode A (Agentic Completion) action executes, the agent
validates that the resource being committed is actually available. This
is the same underlying pattern across every archetype — named once here,
implemented per-archetype below.

```
Commerce (Ecom):       Inventory/stock check (via cart-creation API call,
                        already implemented in Mode A flow)
Commerce (Restaurant):  Table/slot availability at requested time
                        (already implemented in Reservation Flow)
Appointment:            Calendar availability check (already implemented
                        in Direct Booking Flow)
Emergency:              TWO separate checks, not one — this is the gap:
                        (a) Human available to receive/process the
                        dispatch request (Flag 2, already built)
                        (b) Team/technician actually available to be
                        physically dispatched (NOT currently built —
                        see addition below)
Consultation:           Human/specialist availability for the specific
                        score-tier routing (Mode C priority handoff
                        assumes availability — not currently validated)
Engagement:             Program/event capacity check (referenced in
                        Engagement Step 4 gap list, not yet built since
                        Engagement's full Step 4 is still pending)
```

**Universal fallback rule (applies regardless of archetype):** If
availability validation fails, the agent does NOT simply report failure
and stop. It follows the same graceful-degradation pattern already
established system-wide (CLAUDE.md Rule 2, Step 1D's fallback
requirement): offer the nearest available alternative, or fall to the
next Mode (A → B → C), per the specific archetype's existing Mode
fallback chain. This section does not introduce new fallback logic — it
names the existing pattern and identifies where a check is currently
missing (Emergency's team-availability check).
```

**Add the missing Emergency team-availability check.** Insert into Module 3's Emergency section, "Callback Queue Flow (Mode A)," as a new step between the existing steps 2 and 3:

```markdown
**New Step 2.5 — Team Availability Check:** Before creating the callback
queue entry, confirm a technician/team is actually available for dispatch
in the customer's service area within the communicated window — this is
distinct from Flag 2's "is a human available to receive the callback
request" check (which is about someone answering the queue, not about
field capacity). If no team is available in the relevant window:
```
IF team unavailable in stated window:
  Do NOT state a time window the team cannot honor (per the existing
  "never promise what can't be honored" rule, Flag 2).
  → Communicate the actual next available window honestly, OR
  → If genuinely urgent and no window works, route to Mode C
    (Emergency Escalation Path) rather than creating a queue entry
    the team can't fulfill.
```
```

---

## Patch 9 (partial) — Restaurant Archetype Scope Clarification

**Why:** "Restaurant" as currently scoped implies dine-in/reservation logic. Food-delivery-style businesses (bakeries, pickup/delivery shops — the foodpanda/zomato-style model) don't need reservation logic (party size, table time) — they need order/cart logic, which is what Commerce-Ecom already provides.

**Insert into Step 0A, Commerce archetype section, as a clarifying note immediately after the existing Ecommerce/Restaurant sub-variant split:**

```markdown
**Sub-variant scope clarification:** "Restaurant" in this document refers
specifically to businesses with reservation/dine-in logic (party size,
table time, seating). Food-service businesses organized around
order-then-pickup-or-delivery (bakeries, delivery-first restaurants,
platforms like the foodpanda/zomato model) do NOT use the Restaurant
sub-variant's reservation flow — they map to the **Ecommerce sub-variant**
instead, since their actual interaction pattern is cart/order/checkout,
not table booking. A business offering both (a restaurant with dine-in
reservations AND delivery ordering) would be configured with both
sub-variants active, routed by which the customer's message indicates.
```

---

### Round 3 Completion

1. Confirm all 3 parts of Patch 5 applied (naming clarification, Appointment guided-link sub-mode, Availability Validation Layer + Emergency team-check addition).
2. Confirm Patch 9's Restaurant scope clarification applied to Step 0A.
3. Confirm no existing Mode A/B/C behavior, existing Appointment flows, or existing Emergency flow content was rewritten — only additions.
4. Update Module 3 and Step 0A completion summaries.

**STOP after Round 3. Report back. Do not proceed to Round 4 without confirmation.**
