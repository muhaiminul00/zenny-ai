# Client Onboarding Guide

```
Project:   Zeny Ai - Voiceflow
Document:  Client_Onboarding_Guide.md v1.0
Layer:     00_Project_Control — operations, not runtime behavior
```

---

## What This Is

Adapted from the original Modular architecture's onboarding process
(`01_Strategy/Modular_Legacy/CS_AI_Agent_PreBuild_Guide_Modular.md`, Step
11), rebuilt to configure a Zenny deployment against the current
Archetype/Runtime system (`Agent_Runtime_System_v1.md`) rather than an
add-on bundle. Modular's "add-on selection questionnaire" becomes
**archetype + module selection** against the Runtime Configuration
Resolver (Step 1C.0); Modular's generic 5-test-per-add-on UAT becomes
**UAT structured around `Stress_Test_Library_v1.md`'s actual test
categories**, referencing real test IDs rather than reinventing a
parallel checklist.

---

## Onboarding Sequence

**1. Archetype identification.** Which of the 5 archetypes fits this
business — Emergency, Commerce, Appointment, Engagement, or
Consultation? A business may span more than one (e.g., a restaurant
running both dine-in reservations and delivery/pickup ordering runs
Commerce's Restaurant and Ecommerce sub-variants simultaneously, per
Step 0A's sub-variant scope clarification — each sub-variant is a fully
independent journey sharing only the parent archetype label). Identify
every archetype/sub-variant this specific business actually needs; do
not assume one archetype per client.

### 1.5 — Archetype Fit Diagnostic (Use When Industry Doesn't Obviously Match)

Do not select an archetype by industry label. Select it by answering
these questions about the client's actual customers — the same
dimensions used throughout Step 0A of Agent_Runtime_System_v1.md to
define every existing archetype.

**Run this diagnostic for any client whose industry doesn't
immediately, obviously suggest one of the 5 archetypes** — a tech firm,
a manufacturer, a subscription service, or any business type not
already covered by an existing archetype's known industries.

---

#### Question 1 — Is there a genuine time-critical crisis element?

Does the customer contact this business because something is actively
wrong right now, with real urgency (a burst pipe, a security breach,
a system down)?

- **Yes, genuine active urgency** → likely **Emergency**
- **No, or "urgent" only in a soft business sense (e.g., "I need this
  contract signed by Friday")** → continue to Question 2

---

#### Question 2 — Does the customer already know exactly what they want?

Does the customer typically arrive already knowing the specific
product/service/slot they want, needing only to complete the
transaction with minimal discovery (buying a specific software
license, booking a specific known service)?

- **Yes, low/no discovery needed, transactional** → likely **Commerce**
  (Ecom sub-variant if no scheduling involved, Restaurant sub-variant
  if genuinely reservation/appointment-slot-based with a fixed
  time/capacity)
- **No, they need to be guided to the right fit first** → continue to
  Question 3

---

#### Question 3 — Is the interaction structured around a specific bookable slot?

Does the core interaction revolve around scheduling a specific
appointment/session with a person, resource, or time slot (a
consultation call is different from this — see Question 4 first if
unsure)?

- **Yes, and the "product" IS the slot itself (a haircut, a gym class,
  a repair visit)** → likely **Appointment**
- **No, or the slot is really just the endpoint of a longer sales/
  advisory conversation** → continue to Question 4

---

#### Question 4 — Is trust built through demonstrated expertise before any commitment?

Does the customer need to be understood and diagnosed — through
adaptive questioning that proves the business genuinely grasps their
specific situation — before they'd trust a recommendation or agree to
a next step (a paid engagement, a formal proposal, a qualified sales
call)? Is the customer implicitly evaluating "does this business get
my problem" throughout?

- **Yes — this is the core dynamic** → likely **Consultation**
  (This is the correct home for most B2B, professional-services, and
  tech-firm clients — a tech firm selling a SaaS product with a sales-
  assisted, discovery-based purchase process fits here, regardless of
  how unfamiliar "tech firm" sounds as an industry label.)
- **No, something else is going on** → continue to Question 5

---

#### Question 5 — Is the customer relationship values-driven rather than transaction-driven?

Is the customer motivated primarily by alignment with a mission/cause
rather than personal transactional benefit — donating, volunteering,
attending in support of something, not to receive a product/service
in return?

- **Yes** → likely **Engagement**
- **No, and none of Questions 1-5 produced a clear match** → **flag for
  architect review** (see below) — do not force-fit into the closest-
  seeming archetype.

---

### What "Flag for Architect Review" Means

If the diagnostic above produces no clear match, this is a genuine,
rare signal — not a process failure. Document:

1. The client's business type and a description of their typical
   customer interaction pattern.
2. Which of Questions 1-5 came closest, and specifically why it still
   didn't fit (e.g., "closest to Consultation, but there's no
   discovery phase at all — customers already know exactly what they
   want, closer to Commerce, but the purchase requires a multi-week
   custom quote process Commerce's conversion modes don't express").
3. Whether this looks like a genuinely new psychology pattern, or a
   **hybrid/multi-archetype case** (see below) that's actually already
   coverable.

**Before concluding a 6th archetype is needed, check the hybrid case
first** — it resolves the large majority of edge cases without any
new architecture:

---

### The Hybrid / Multi-Archetype Case (Check This Before Assuming You Need a New Archetype)

A single client can be configured with **more than one archetype
active simultaneously** — this is already fully supported by the
existing architecture (Commerce's own Ecom + Restaurant dual sub-
variant is a proof case already built and shipped). `control.clients`
already has a `secondary_archetypes` field for exactly this.

**Many "doesn't fit" cases are actually hybrid cases, not new-
archetype cases.** Example: a business that does high-touch B2B
consulting (Consultation) but also sells a fixed-price self-serve
starter product on their website (Commerce) — this is not a 6th
archetype, it's a client configured with both Consultation AND
Commerce active, with intent classification (Step 1B) routing each
conversation to the correct one based on what the customer actually
asks for.

Check the hybrid case explicitly before escalating to "we need a new
archetype" — it is very likely the actual answer.

---

### If a Genuinely New Archetype Is Needed

This is architect-level, not onboarder-level work — the full procedure
(Phase 0 confirmation through the psychology profile, freedom level
assignment, full archetype build, module ownership mapping, database
template schema, n8n execution layer update, and documentation
propagation) is documented in full in
`01_Strategy/New_Archetype_Introduction_Process.md`. Do not attempt to
run this process from memory or improvise it here — follow that
document.

**Do NOT onboard the client against a placeholder/approximate archetype
while that work happens** — the whole point of the archetype system is
that behavior is correctly calibrated to real psychology; a wrong-fit
placeholder produces exactly the "collect data, don't ask, force
conversion at the wrong moment" failures this entire architecture was
built to prevent.

In practice: given the deliberate breadth already built into
Consultation specifically (designed and tested across two genuinely
different industries), expect this to be a rare event, not a routine
one.

**2. Module selection.** Which of the 5 service modules are active?
Core Agent is always on (no config gate). Growth Agent, Conversion
Engine, Recovery Engine, and Email Manager activate per what the client
has purchased — per the Module Responsibility Contract (Step 1D.0.5),
every module checks OWNS/ALLOWED/DOES NOT OWN/MUST TRANSFER before
acting, so partial-stack deployments (e.g., Core + Conversion Engine
only, no Growth Agent) are fully valid, not degraded states requiring
special handling.

**3. Freedom level configuration.** Per Step 2, confirm the archetype's
default freedom band, or override it per Step 2 §2.1 (Default Freedom
vs. Configured Freedom). Document the override's business rationale —
freedom level is not a technical knob, it directly shapes how much
discovery, recommendation, and proactive behavior the agent is allowed
before Conversion Engine acts.

**4. Conversion mode configuration.** Per archetype, which Mode
(Universal Mode Naming — A: Agentic Completion / B: Assisted Capture or
Guided External Completion / C: Human Handoff) is available, given the
client's actual integrations? Does a cart-creation API exist (Commerce
Ecom Mode A) or not (falls to Mode B, guided product link)? Does a
calendar integration support individual-practitioner queries
(Appointment's Availability Validation Layer) or only business-level
availability? This is a deployment-level business decision (Module 3
§2's Conversion Modes Table config flags), not a quality tier — a
business correctly running Mode B as its permanent conversion path is
not a lesser deployment than one running Mode A.

**5. Client Onboarding Workbook completion.** See template below.

**6. KB content upload and validation.** Business Memory content (Step
0C Level 3) — service catalog, pricing, policies, FAQ — loaded and spot-
checked against a handful of real customer questions before UAT begins.

**7. UAT.** See UAT Checklist below — structured per
`Stress_Test_Library_v1.md`'s existing categories, not a generic
per-capability checklist.

**8. Go-live approval and monitoring setup.** Confirm Recovery Engine
cadence profiles (Module 4 §3) and Email Manager autonomy level (Module
5 §3), if active, are set to the agreed values before the first live
customer message — these are exactly the kind of settings that are
expensive to discover misconfigured after launch.

---

## Client Onboarding Workbook Template

Adapted from Modular's workbook fields — add-on-specific fields removed,
archetype/module/freedom-level fields added, and the language
configuration field added as new (it did not exist in Modular's
workbook at all).

```
BUSINESS IDENTITY
  - Brand voice description
  - Agent name preference
  - Archetype(s) + sub-variant(s) selected (Stage 1)

CONFIGURATION
  - Active modules (Core always on; Growth / Conversion / Recovery /
    Email per purchase — Stage 2)
  - Freedom level: archetype default, or override + rationale
    (Stage 3, Step 2 §2.1)
  - Conversion mode per archetype (Stage 4, Module 3 §2)
  - LANGUAGE CONFIGURATION — language_mode (fixed | adaptive) +
    language_list (Step 1C). New field, not present in the original
    Modular workbook. Default when unspecified: adaptive, bounded to a
    single entry matching the business's primary operating language.

INTEGRATIONS
  - API credentials per active integration (calendar, cart/ecommerce
    platform, CRM, email)
  - Tool availability confirmation against Tool_Naming_Convention.md's
    registry (e.g., does `check-availability` resolve to a real
    calendar query, or does this deployment fall to Mode B by default?)

CONTENT
  - Service catalog / product catalog
  - Policies (cancellation, refund, shipping — whichever apply to the
    selected archetype)
  - FAQ content
  - Operating hours + send-window override if different from the
    08:00–20:00 local default (Appendix A, `send_window_start` /
    `send_window_end`)

OPERATIONS
  - Escalation contact(s) — per Module 1D's Escalation Priority
    Classification, who receives P1/P2/P3
  - After-hours emergency contact, if Emergency archetype is active
    (Appendix A, `after_hours_emergency_contact`)
  - Recovery Engine cadence acknowledgment (if active) — client has seen
    and approved the archetype's default cadence (Module 4 §3) or an
    explicit override
```

---

## UAT Checklist

Rebuilt against `Stress_Test_Library_v1.md`'s actual test categories,
referencing specific test IDs as the basis for per-client UAT rather
than duplicating test content here.

**Always run, every client (Stress Test Library §1 — Universal Stress
Tests, archetype-independent):**
- Customer Behavior Matrix (U-01 through U-10) — confirm all 10 intents
  route correctly for this specific module configuration (many U-tests
  branch on "if Growth ON" / "if Conversion OFF" — run the branch that
  matches this client's actual Stage 2 module selection).
- At minimum one Intent Switching scenario (IS-01 through IS-05) and one
  Multi-Intent scenario (MI-01 through MI-05) relevant to the client's
  archetype.
- Data Validation Failure (DV-01 through DV-05) against this client's
  actual Tier 2/3 fields — confirm Step 0B §7's validation and
  correction-flow rules behave correctly against real field examples
  from this client's KB (e.g., a real product name, a real service
  type), not just the Stress Test Library's generic examples.

**Run the client's specific Configuration Combination test (§2):** each
archetype has a Config A / B / C row (Core only / Core + primary module
/ full stack) — run the row matching this client's exact Stage 2 module
selection, confirming the "Agent CAN" / "Agent CANNOT" / "Says at Limit"
columns all hold as specified.

**Run relevant archetype edge cases:** for Emergency clients, run the
applicable rows from §3's Per-Archetype Edge Case Library (E-01 through
E-12) directly. For Commerce, Appointment, Engagement, and Consultation
clients, run the relevant scenarios from that archetype's own
"STRESS-TEST CROSS-CHECK" section inside `Agent_Runtime_System_v1.md`
(each archetype's Step 4 build carries its own cross-check against §1/
§2/§4/§5 rather than a dedicated §3-style library — see that document's
Step 6 completion summary for why).

**Run any Cross-Module Collision test (§4, CM-01 through CM-08)
relevant to this client's active module combination** — e.g., CM-01
(human ownership vs. Recovery Engine) only applies if Recovery Engine is
active; CM-06 (Email Manager + live-chat collision) only applies if both
Email Manager and live conversation are in scope for this client.

**Run Red Team tests (§5) relevant to this archetype and freedom
level** — at minimum RT-02 (freedom-boundary manipulation) and RT-10
(sensitive/high-liability content) for every client regardless of
archetype, plus any archetype-specific Red Team scenario.

All selected tests must pass before go-live. A failure means fix before
launch, not launch-with-a-known-gap — consistent with the runtime
document's own "flag, don't invent" discipline: if a UAT failure reveals
a genuine architecture gap rather than a client-specific configuration
error, it gets flagged for the runtime document's own maintainers, not
patched ad hoc during onboarding.

---

```
ZeroManual · Zenny AI Workforce · Client_Onboarding_Guide.md v1.0
Extracted and rebuilt from the Modular architecture's 7-stage onboarding
process, Client Onboarding Workbook, and per-add-on UAT checklist
(01_Strategy/Modular_Legacy/CS_AI_Agent_PreBuild_Guide_Modular.md, Step
11), against current Archetype/Runtime terminology and
Stress_Test_Library_v1.md's actual test structure.
```
